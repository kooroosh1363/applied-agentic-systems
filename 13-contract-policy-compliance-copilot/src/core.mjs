import { createHash } from 'node:crypto';

const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const round=value=>Number(value.toFixed(4));
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`:JSON.stringify(value);
const hash=value=>createHash('sha256').update(canonical(value)).digest('hex');
const SEVERITY_WEIGHT={critical:40,high:25,medium:12,low:5};

export function normalizePolicySet(raw){
  for(const key of ['policySetId','version','jurisdiction','effectiveFrom'])if(!clean(raw?.[key]))throw new Error(`missing policy ${key}`);
  if(!Array.isArray(raw.rules)||!raw.rules.length)throw new Error('policy rules required');
  const ids=new Set();
  const rules=raw.rules.map((r,index)=>{
    for(const key of ['ruleId','title','severity','requirementType'])if(!clean(r?.[key]))throw new Error(`missing rule ${key} ${index}`);
    const ruleId=clean(r.ruleId);if(ids.has(ruleId))throw new Error('duplicate ruleId');ids.add(ruleId);
    if(!SEVERITY_WEIGHT[clean(r.severity)])throw new Error('invalid severity');
    if(!['required_clause','prohibited_phrase','required_term','numeric_limit','allowed_value'].includes(clean(r.requirementType)))throw new Error('invalid requirementType');
    return {ruleId,title:clean(r.title),severity:clean(r.severity),requirementType:clean(r.requirementType),clauseType:clean(r.clauseType),field:clean(r.field),phrase:clean(r.phrase),operator:clean(r.operator),value:r.value??null,unit:clean(r.unit),allowedValues:(r.allowedValues??[]).map(clean).filter(Boolean),remediation:clean(r.remediation)};
  });
  return {policySetId:clean(raw.policySetId),version:clean(raw.version),jurisdiction:clean(raw.jurisdiction).toLowerCase(),effectiveFrom:clean(raw.effectiveFrom),effectiveTo:clean(raw.effectiveTo),rules,approvedBy:clean(raw.approvedBy),status:clean(raw.status||'draft')};
}

export function normalizeContract(raw){
  for(const key of ['contractId','version','jurisdiction','title'])if(!clean(raw?.[key]))throw new Error(`missing contract ${key}`);
  if(!Array.isArray(raw.clauses)||!raw.clauses.length)throw new Error('contract clauses required');
  const ids=new Set();
  const clauses=raw.clauses.map((c,index)=>{
    for(const key of ['clauseId','clauseType','text'])if(!clean(c?.[key]))throw new Error(`missing clause ${key} ${index}`);
    const clauseId=clean(c.clauseId);if(ids.has(clauseId))throw new Error('duplicate clauseId');ids.add(clauseId);
    return {clauseId,clauseType:clean(c.clauseType),text:clean(c.text),terms:{...(c.terms??{})},sourcePage:Number(c.sourcePage??0)};
  });
  return {contractId:clean(raw.contractId),version:clean(raw.version),jurisdiction:clean(raw.jurisdiction).toLowerCase(),title:clean(raw.title),parties:(raw.parties??[]).map(clean).filter(Boolean),effectiveDate:clean(raw.effectiveDate),clauses};
}

export function scanDocument(value){
  const text=clean(value), findings=[];
  const rules=[['prompt_injection',/ignore (?:all|previous).*instructions/i,'block'],['prompt_injection',/reveal (?:the )?(?:system prompt|secret|password|token)/i,'block'],['secret_pattern',/\b(?:api[_ -]?key|password|secret)\s*[:=]\s*\S+/i,'block'],['payment_card',/\b(?:\d[ -]*?){13,19}\b/,'block'],['email',/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,'review']];
  for(const [code,pattern,severity]of rules)if(pattern.test(text))findings.push({code,severity});
  return findings;
}

export function selectApplicablePolicies(policyInputs,contractInput,asOfInput){
  const contract=normalizeContract(contractInput),asOf=new Date(asOfInput||contract.effectiveDate||'2026-01-01T00:00:00Z');
  if(Number.isNaN(asOf.valueOf()))throw new Error('invalid asOf');
  const policies=policyInputs.map(normalizePolicySet).filter(p=>['global',contract.jurisdiction].includes(p.jurisdiction)&&new Date(p.effectiveFrom)<=asOf&&(!p.effectiveTo||new Date(p.effectiveTo)>=asOf));
  if(!policies.length)throw new Error('no applicable policy');
  if(policies.some(p=>p.status!=='approved'||!p.approvedBy))throw new Error('unapproved policy cannot govern');
  return policies;
}

function compare(actual,operator,expected){
  const a=Number(actual),e=Number(expected);if(!Number.isFinite(a)||!Number.isFinite(e))return false;
  return operator==='lte'?a<=e:operator==='lt'?a<e:operator==='gte'?a>=e:operator==='gt'?a>e:operator==='eq'?a===e:false;
}

export function detectPolicyConflicts(policyInputs,contractInput,asOf){
  const policies=selectApplicablePolicies(policyInputs,contractInput,asOf),groups=new Map(),conflicts=[];
  for(const policy of policies)for(const rule of policy.rules){
    const key=[rule.clauseType,rule.requirementType,rule.field].join('|');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push({policySetId:policy.policySetId,policyVersion:policy.version,...rule});
  }
  for(const [key,rules]of groups){
    const signatures=new Set(rules.map(r=>canonical({operator:r.operator,value:r.value,unit:r.unit,allowedValues:[...r.allowedValues].sort(),phrase:r.phrase})));
    if(rules.length>1&&signatures.size>1)conflicts.push({code:'policy_conflict',key,severity:'block',rules:rules.map(r=>({policySetId:r.policySetId,policyVersion:r.policyVersion,ruleId:r.ruleId}))});
  }
  return conflicts;
}

export function evaluateCompliance(contractInput,policyInputs,options={}){
  const contract=normalizeContract(contractInput),policies=selectApplicablePolicies(policyInputs,contract,options.asOf),conflicts=detectPolicyConflicts(policyInputs,contract,options.asOf);
  const safety=[...scanDocument(contract.title),...contract.clauses.flatMap(c=>scanDocument(c.text).map(f=>({...f,clauseId:c.clauseId})))];
  const clausesByType=new Map();for(const clause of contract.clauses){if(!clausesByType.has(clause.clauseType))clausesByType.set(clause.clauseType,[]);clausesByType.get(clause.clauseType).push(clause);}
  const findings=[...safety,...conflicts];
  for(const policy of policies)for(const rule of policy.rules){
    const clauses=clausesByType.get(rule.clauseType)??[];
    const base={policySetId:policy.policySetId,policyVersion:policy.version,ruleId:rule.ruleId,ruleTitle:rule.title,severity:rule.severity,remediation:rule.remediation};
    if(rule.requirementType==='required_clause'&&!clauses.length)findings.push({...base,code:'missing_required_clause',clauseId:null});
    for(const clause of clauses){
      if(rule.requirementType==='prohibited_phrase'&&clause.text.toLowerCase().includes(rule.phrase.toLowerCase()))findings.push({...base,code:'prohibited_phrase',clauseId:clause.clauseId,evidence:rule.phrase});
      if(rule.requirementType==='required_term'&&(clause.terms[rule.field]===undefined||clean(clause.terms[rule.field])===''))findings.push({...base,code:'missing_required_term',clauseId:clause.clauseId,field:rule.field});
      if(rule.requirementType==='numeric_limit'){
        const actual=clause.terms[rule.field];
        if(actual===undefined)findings.push({...base,code:'missing_numeric_term',clauseId:clause.clauseId,field:rule.field});
        else if(!compare(actual,rule.operator,rule.value)||clean(clause.terms[`${rule.field}Unit`]).toLowerCase()!==rule.unit.toLowerCase())findings.push({...base,code:'numeric_limit_violation',clauseId:clause.clauseId,field:rule.field,actual,expected:{operator:rule.operator,value:rule.value,unit:rule.unit}});
      }
      if(rule.requirementType==='allowed_value'){
        const actual=clean(clause.terms[rule.field]).toLowerCase();
        if(!actual)findings.push({...base,code:'missing_allowed_value_term',clauseId:clause.clauseId,field:rule.field});
        else if(!rule.allowedValues.map(v=>v.toLowerCase()).includes(actual))findings.push({...base,code:'disallowed_value',clauseId:clause.clauseId,field:rule.field,actual,allowedValues:rule.allowedValues});
      }
    }
  }
  const legalFindings=findings.filter(f=>SEVERITY_WEIGHT[f.severity]);
  const riskScore=Math.min(100,legalFindings.reduce((sum,f)=>sum+SEVERITY_WEIGHT[f.severity],0));
  let decision='compliant';
  if(findings.some(f=>f.severity==='block')||legalFindings.some(f=>f.severity==='critical'))decision='blocked';
  else if(legalFindings.some(f=>['high','medium'].includes(f.severity))||findings.some(f=>f.severity==='review'))decision='review_required';
  else if(legalFindings.length)decision='non_compliant';
  const summary={policySets:policies.map(p=>`${p.policySetId}@${p.version}`),clauseCount:contract.clauses.length,findingCount:findings.length,riskScore,critical:legalFindings.filter(f=>f.severity==='critical').length,high:legalFindings.filter(f=>f.severity==='high').length,medium:legalFindings.filter(f=>f.severity==='medium').length,low:legalFindings.filter(f=>f.severity==='low').length};
  return {contractId:contract.contractId,contractVersion:contract.version,decision,findings,summary,reportFingerprint:hash({contractId:contract.contractId,version:contract.version,policies:summary.policySets,findings}),evidenceBoundary:'simulated',legalNotice:'Decision support only; qualified legal review remains required.'};
}

export function proposeRemediations(report){
  if(!report?.reportFingerprint)throw new Error('verified report required');
  return report.findings.filter(f=>f.ruleId&&f.remediation).map((f,index)=>({proposalId:`proposal-${index+1}`,findingCode:f.code,clauseId:f.clauseId,policyCitation:{policySetId:f.policySetId,policyVersion:f.policyVersion,ruleId:f.ruleId},suggestedAction:f.remediation,status:'draft',requiresLegalReviewer:true,autoApplied:false}));
}

export function recordReview(report,review){
  for(const key of ['reviewerId','reviewerRole','decision','rationale'])if(!clean(review?.[key]))throw new Error(`missing review ${key}`);
  if(!['legal_reviewer','compliance_reviewer'].includes(review.reviewerRole))throw new Error('unauthorized reviewer role');
  if(!['approve','reject','request_changes'].includes(review.decision))throw new Error('invalid review decision');
  if((report.summary.critical||report.summary.high)&&review.reviewerRole!=='legal_reviewer')throw new Error('legal reviewer required');
  return {reportFingerprint:report.reportFingerprint,reviewerId:clean(review.reviewerId),reviewerRole:review.reviewerRole,decision:review.decision,rationale:clean(review.rationale),reviewedAt:clean(review.reviewedAt||'2026-01-01T00:00:00Z'),auditFingerprint:hash({reportFingerprint:report.reportFingerprint,...review})};
}

export function compareContractVersions(previousInput,currentInput){
  const previous=normalizeContract(previousInput),current=normalizeContract(currentInput);
  if(previous.contractId!==current.contractId)throw new Error('contract identity mismatch');
  const oldMap=new Map(previous.clauses.map(c=>[c.clauseId,c])),newMap=new Map(current.clauses.map(c=>[c.clauseId,c]));
  return {contractId:current.contractId,fromVersion:previous.version,toVersion:current.version,added:[...newMap.keys()].filter(id=>!oldMap.has(id)),removed:[...oldMap.keys()].filter(id=>!newMap.has(id)),modified:[...newMap.keys()].filter(id=>oldMap.has(id)&&hash(newMap.get(id))!==hash(oldMap.get(id))),fingerprint:hash({previous,current})};
}

export function scoreBenchmark(rows){
  if(!Array.isArray(rows)||!rows.length)throw new Error('benchmark rows required');let tp=0,tn=0,fp=0,fn=0;
  for(const row of rows){const predicted=row.predicted!=='compliant';if(row.expectedFinding&&predicted)tp++;else if(!row.expectedFinding&&!predicted)tn++;else if(!row.expectedFinding)fp++;else fn++;}
  return {total:rows.length,tp,tn,fp,fn,precision:tp+fp?round(tp/(tp+fp)):0,recall:tp+fn?round(tp/(tp+fn)):0,falsePositiveRate:fp+tn?round(fp/(fp+tn)):0,evidenceBoundary:'simulated'};
}
