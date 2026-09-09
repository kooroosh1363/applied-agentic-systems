import crypto from 'node:crypto';

export class AppError extends Error { constructor(code,status=400){super(code);this.code=code;this.status=status} }
const fail=(code,status=400)=>{throw new AppError(code,status)};
const text=(v,min,max,code)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)fail(code);return v.trim()};
const sha=v=>crypto.createHash('sha256').update(String(v)).digest('hex');
const hmac=(secret,value)=>crypto.createHmac('sha256',secret).update(value).digest('hex');
const safeEqual=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)};
const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a<b?-1:a>b?1:0)):item);
export const EVENT_TYPES=['order.created','order.cancelled','customer.updated','workflow.requested'];
export const TERMINAL=['succeeded','dead_lettered','quarantined'];

export function createState({clock=()=>new Date().toISOString(),signingSecret='local-signing-change-me',auditSecret='local-audit-change-me',workerSecret='local-worker-change-me'}={}){
 return {tenants:new Map,apiKeys:new Map,events:new Map,eventKeys:new Map,subscriptions:[],deliveries:new Map,outbox:[],dlq:[],quarantine:[],audit:[],auditHeads:new Map,aggregateSequences:new Map,metrics:{accepted:0,deduplicated:0,succeeded:0,retried:0,deadLettered:0,quarantined:0},clock,signingSecret,auditSecret,workerSecret};
}
export function provisionTenant(s,{slug,name,monthlyEventLimit=1000}){
 slug=text(slug,3,48,'invalid_tenant_slug');name=text(name,2,100,'invalid_tenant_name');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))fail('invalid_tenant_slug');
 if(!Number.isSafeInteger(monthlyEventLimit)||monthlyEventLimit<1||monthlyEventLimit>1000000)fail('invalid_event_limit');
 if([...s.tenants.values()].some(t=>t.slug===slug))fail('tenant_exists',409);
 const id=`ten_${sha(slug).slice(0,20)}`,tenant={id,slug,name,monthlyEventLimit,usedEvents:0,status:'active',createdAt:s.clock()};s.tenants.set(id,tenant);audit(s,id,'tenant.provisioned',{slug,monthlyEventLimit},'bootstrap');return tenant;
}
export function issueApiKey(s,{tenantId,label='ingest',scopes=['events:write','events:read']}){
 const tenant=s.tenants.get(tenantId);if(!tenant)fail('tenant_not_found',404);label=text(label,2,60,'invalid_key_label');
 const allowed=['events:write','events:read','events:replay'];if(!Array.isArray(scopes)||!scopes.length||scopes.some(x=>!allowed.includes(x)))fail('invalid_scopes');
 const token=`eda_${crypto.randomBytes(32).toString('base64url')}`,id=`key_${crypto.randomBytes(9).toString('hex')}`;s.apiKeys.set(id,{id,tenantId,label,scopes:[...new Set(scopes)],hash:sha(token),revoked:false});audit(s,tenantId,'api_key.issued',{id,label,scopes},'system');return{id,token};
}
export function authenticate(s,token,scope){if(typeof token!=='string'||!token.startsWith('eda_'))fail('invalid_api_key',401);const key=[...s.apiKeys.values()].find(k=>safeEqual(k.hash,sha(token)));if(!key||key.revoked)fail('invalid_api_key',401);if(scope&&!key.scopes.includes(scope))fail('insufficient_scope',403);return key}
export function signEvent(s,{tenantId,timestamp,event}){if(!s.tenants.has(tenantId))fail('tenant_not_found',404);return hmac(s.signingSecret,`${tenantId}.${timestamp}.${canonical(event)}`)}
export function verifySignature(s,{tenantId,timestamp,event,signature,maxSkewSeconds=300}){
 if(typeof timestamp!=='string'||!Number.isFinite(Date.parse(timestamp)))fail('invalid_signature_timestamp',401);const skew=Math.abs(Date.parse(s.clock())-Date.parse(timestamp));if(skew>maxSkewSeconds*1000)fail('signature_expired',401);
 const expected=signEvent(s,{tenantId,timestamp,event});if(typeof signature!=='string'||!safeEqual(signature,expected))fail('invalid_signature',401);return true;
}
export function validateEvent(event){
 if(!event||typeof event!=='object'||Array.isArray(event))fail('invalid_event');if(event.specversion!=='1.0')fail('unsupported_specversion');
 const allowed=new Set(['specversion','id','source','type','subject','sequence','time','datacontenttype','data']);if(Object.keys(event).some(key=>!allowed.has(key)))fail('unknown_event_field');
 const id=text(event.id,6,128,'invalid_event_id'),source=text(event.source,3,160,'invalid_event_source'),type=text(event.type,3,100,'invalid_event_type');if(!EVENT_TYPES.includes(type))fail('unsupported_event_type');
 if(typeof event.subject!=='string'||!event.subject.trim()||event.subject.length>160)fail('invalid_event_subject');if(!Number.isSafeInteger(event.sequence)||event.sequence<1)fail('invalid_sequence');if(!event.data||typeof event.data!=='object'||Array.isArray(event.data))fail('invalid_event_data');
 if(event.time!==undefined&&(typeof event.time!=='string'||!Number.isFinite(Date.parse(event.time))))fail('invalid_event_time');if(event.datacontenttype!==undefined&&event.datacontenttype!=='application/json')fail('unsupported_content_type');
 const encoded=Buffer.byteLength(JSON.stringify(event));if(encoded>32768)fail('event_too_large',413);return{...event,id,source,type,subject:event.subject.trim()};
}
export function subscribe(s,{tenantId,eventType,workflowId}){if(!s.tenants.has(tenantId))fail('tenant_not_found',404);if(!EVENT_TYPES.includes(eventType))fail('unsupported_event_type');workflowId=text(workflowId,2,100,'invalid_workflow_id');const sub={tenantId,eventType,workflowId};if(!s.subscriptions.some(x=>x.tenantId===tenantId&&x.eventType===eventType&&x.workflowId===workflowId))s.subscriptions.push(sub);return sub}
export function ingestEvent(s,{tenantId,event,timestamp,signature}){
 const tenant=s.tenants.get(tenantId);if(!tenant)fail('tenant_not_found',404);if(tenant.status!=='active')fail('tenant_inactive',403);event=validateEvent(event);verifySignature(s,{tenantId,timestamp,event,signature});
 const unique=`${tenantId}:${event.source}:${event.id}`,existingId=s.eventKeys.get(unique);if(existingId){s.metrics.deduplicated++;return{...s.events.get(existingId),deduplicated:true}}
 if(tenant.usedEvents>=tenant.monthlyEventLimit)fail('quota_exceeded',429);
 const aggregate=`${tenantId}:${event.source}:${event.subject}`,last=s.aggregateSequences.get(aggregate)||0;
 const record={internalId:`evt_${sha(unique).slice(0,22)}`,tenantId,event,status:'accepted',attempt:0,maxAttempts:3,receivedAt:s.clock(),updatedAt:s.clock(),fingerprint:sha(canonical(event))};
 s.events.set(record.internalId,record);s.eventKeys.set(unique,record.internalId);tenant.usedEvents++;s.metrics.accepted++;
 if(event.sequence<=last){record.status='quarantined';record.reason='out_of_order_or_replay';s.quarantine.push({tenantId,eventId:record.internalId,reason:record.reason,replayAuthorized:false});s.metrics.quarantined++;audit(s,tenantId,'event.quarantined',{eventId:record.internalId,reason:record.reason},'ingest');return record}
 if(event.sequence>last+1){record.status='quarantined';record.reason='sequence_gap';s.quarantine.push({tenantId,eventId:record.internalId,reason:record.reason,replayAuthorized:false});s.metrics.quarantined++;audit(s,tenantId,'event.quarantined',{eventId:record.internalId,reason:record.reason},'ingest');return record}
 s.aggregateSequences.set(aggregate,event.sequence);const routes=s.subscriptions.filter(x=>x.tenantId===tenantId&&x.eventType===event.type);for(const route of routes){const delivery={id:`del_${sha(`${record.internalId}:${route.workflowId}`).slice(0,20)}`,tenantId,eventId:record.internalId,workflowId:route.workflowId,status:'queued',attempt:0,maxAttempts:3,nextAttemptAt:null};s.deliveries.set(delivery.id,delivery);s.outbox.push({tenantId,deliveryId:delivery.id,published:false})}
 audit(s,tenantId,'event.accepted',{eventId:record.internalId,type:event.type,routes:routes.length},'ingest');return{...record,routes:routes.length};
}
export function completeDelivery(s,{tenantId,deliveryId,success,errorCode,workerSecret}){
 if(!safeEqual(workerSecret,s.workerSecret))fail('invalid_worker_credential',401);const d=s.deliveries.get(deliveryId);if(!d||d.tenantId!==tenantId)fail('delivery_not_found',404);if(TERMINAL.includes(d.status))fail('terminal_delivery',409);if(typeof success!=='boolean')fail('invalid_completion');d.attempt++;d.updatedAt=s.clock();
 if(success){d.status='succeeded';s.metrics.succeeded++;audit(s,tenantId,'delivery.succeeded',{deliveryId},'worker');return d}
 errorCode=text(errorCode,2,80,'invalid_error_code');if(d.attempt<d.maxAttempts){d.status='retry_scheduled';d.nextAttemptAt=new Date(Date.parse(s.clock())+Math.min(60,2**d.attempt)*1000).toISOString();s.metrics.retried++;audit(s,tenantId,'delivery.retry_scheduled',{deliveryId,attempt:d.attempt,errorCode},'worker');return d}
 d.status='dead_lettered';d.nextAttemptAt=null;s.dlq.push({tenantId,deliveryId,errorCode,replayAuthorized:false});s.metrics.deadLettered++;audit(s,tenantId,'delivery.dead_lettered',{deliveryId,errorCode},'worker');return d;
}
export function authorizeReplay(s,{tenantId,deliveryId,approvedBy,reason}){approvedBy=text(approvedBy,2,100,'invalid_approver');reason=text(reason,5,240,'invalid_replay_reason');const row=s.dlq.find(x=>x.tenantId===tenantId&&x.deliveryId===deliveryId);if(!row)fail('dlq_record_not_found',404);row.replayAuthorized=true;row.approvedBy=approvedBy;row.reason=reason;audit(s,tenantId,'dlq.replay_authorized',{deliveryId,reason},approvedBy);return row}
export function listTenantEvents(s,{tenantId}){return[...s.events.values()].filter(e=>e.tenantId===tenantId).map(e=>({...e}))}
export function audit(s,tenantId,event,payload,actorId){const prevHash=s.auditHeads.get(tenantId)||'GENESIS',row={id:`aud_${tenantId}_${s.audit.filter(x=>x.tenantId===tenantId).length+1}`,tenantId,event,payload,actorId,timestamp:s.clock(),prevHash};row.hash=hmac(s.auditSecret,JSON.stringify(row));s.audit.push(row);s.auditHeads.set(tenantId,row.hash);return row}
export function verifyAudit(s,tenantId){let prev='GENESIS';for(const row of s.audit.filter(x=>x.tenantId===tenantId)){const expected=hmac(s.auditSecret,JSON.stringify({id:row.id,tenantId:row.tenantId,event:row.event,payload:row.payload,actorId:row.actorId,timestamp:row.timestamp,prevHash:row.prevHash}));if(row.prevHash!==prev||!safeEqual(row.hash,expected))return false;prev=row.hash}return true}
