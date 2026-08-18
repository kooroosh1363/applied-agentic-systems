import { createHash } from 'node:crypto';

export const CHANNELS=new Set(['web','phone','email','whatsapp']);
export const STATUSES=new Set(['requested','held','confirmed','cancelled','completed','no_show','recovery_offered','rebooked']);
const TRANSITIONS={requested:new Set(['held','cancelled']),held:new Set(['confirmed','cancelled']),confirmed:new Set(['completed','cancelled','no_show']),cancelled:new Set(),completed:new Set(),no_show:new Set(['recovery_offered']),recovery_offered:new Set(['rebooked']),rebooked:new Set(['confirmed','cancelled'])};
const clean=v=>typeof v==='string'?v.trim():'';
const money=v=>Math.round(Math.max(0,Number(v)||0)*100)/100;

export function normalizeAppointment(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('payload must be an object');
 const sourceEventId=clean(input.sourceEventId),channel=clean(input.channel).toLowerCase(),customerId=clean(input.customerId),resourceId=clean(input.resourceId),serviceType=clean(input.serviceType),timezone=clean(input.timezone)||'UTC';
 if(!sourceEventId)throw new RangeError('sourceEventId is required'); if(!CHANNELS.has(channel))throw new RangeError('unsupported channel'); if(!customerId)throw new RangeError('customerId is required'); if(!resourceId)throw new RangeError('resourceId is required'); if(!serviceType)throw new RangeError('serviceType is required');
 const startsAt=new Date(input.startsAt),durationMinutes=Number(input.durationMinutes); if(Number.isNaN(startsAt.getTime()))throw new RangeError('startsAt must be an ISO date'); if(!Number.isInteger(durationMinutes)||durationMinutes<15||durationMinutes>480)throw new RangeError('durationMinutes must be 15..480');
 return{schemaVersion:'1.0',sourceEventId,channel,customerId,resourceId,serviceType,startsAt:startsAt.toISOString(),durationMinutes,timezone,estimatedValue:money(input.estimatedValue),consentToReminders:input.consentToReminders===true,receivedAt:input.receivedAt?new Date(input.receivedAt).toISOString():now.toISOString(),metadata:safeMetadata(input.metadata)};
}
function safeMetadata(v){return v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).filter(([,x])=>['string','number','boolean'].includes(typeof x))):{};}
export function idempotencyKey(a){return createHash('sha256').update(`${a.channel}:${a.sourceEventId}`).digest('hex');}
export function slotKey(a){const end=new Date(new Date(a.startsAt).getTime()+a.durationMinutes*60000);return `${a.resourceId}:${a.startsAt}:${end.toISOString()}`;}
export function canTransition(from,to){return TRANSITIONS[from]?.has(to)??false;}
export function overlaps(a,b){const as=new Date(a.startsAt).getTime(),ae=as+a.durationMinutes*60000,bs=new Date(b.startsAt).getTime(),be=bs+b.durationMinutes*60000;return a.resourceId===b.resourceId&&as<be&&bs<ae;}
export function planAppointment(input,existing=[],now=new Date()){
 const appointment=normalizeAppointment(input,now); const conflict=existing.some(x=>!['cancelled','no_show'].includes(x.status)&&overlaps(appointment,x));
 const leadMinutes=(new Date(appointment.startsAt)-now)/60000; const eligible=leadMinutes>=15;
 return{appointment,idempotencyKey:idempotencyKey(appointment),slotKey:slotKey(appointment),decision:conflict?{route:'waitlist',reason:'slot_conflict'}:!eligible?{route:'human_review',reason:'insufficient_lead_time'}:{route:'hold_slot',reason:'available'},holdExpiresAt:new Date(now.getTime()+5*60000).toISOString(),evidenceType:'simulated'};
}
export function reminderSchedule(appointment){if(!appointment.consentToReminders)return[];const start=new Date(appointment.startsAt).getTime();return[24*60,2*60].map(minutes=>({kind:`reminder_${minutes}m`,dueAt:new Date(start-minutes*60000).toISOString()}));}
export function rankWaitlist(entries,slot){return entries.filter(e=>e.status==='waiting'&&e.resourceId===slot.resourceId&&e.serviceType===slot.serviceType).map(e=>({...e,score:(e.priority||0)*10000000000000-new Date(e.createdAt).getTime()})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));}
export function recoveryOffer(noShow,policy={cooldownDays:7,maxOffers:1}){const prior=Number(noShow.priorRecoveryOffers)||0;if(prior>=policy.maxOffers)return{eligible:false,reason:'offer_limit'};if(noShow.optedOut===true)return{eligible:false,reason:'opted_out'};return{eligible:true,reason:'policy_eligible',notBefore:new Date(new Date(noShow.occurredAt).getTime()+policy.cooldownDays*86400000).toISOString(),estimatedRecoverableValue:money(noShow.estimatedValue)};}
export function recoveredRevenue(original,rebooked){if(!original||!rebooked||rebooked.status!=='completed')return 0;return money(Math.min(original.estimatedValue,rebooked.estimatedValue));}
export function classifyDelivery(status,attempt,maxAttempts=3){if(status>=200&&status<300)return'delivered';if((status===429||status>=500)&&attempt<maxAttempts)return'retry';return'dlq';}
