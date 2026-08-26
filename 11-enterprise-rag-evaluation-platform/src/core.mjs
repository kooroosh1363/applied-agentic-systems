const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const STOP_WORDS = new Set(['the','and','for','are','how','what','where','when','with','this','that','have','does','into','from']);
const stem = token => {
  if (token.endsWith('ies') && token.length > 5) return `${token.slice(0,-3)}y`;
  if (token.endsWith('ed') && token.length > 5) return token.slice(0,-2);
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 4) return token.slice(0,-1);
  return token;
};
const tokens = value => new Set(clean(value).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(x => x.length > 2 && !STOP_WORDS.has(x)).map(stem));
const round = value => Number(value.toFixed(4));

export function normalizeDocuments(input) {
  if (!Array.isArray(input) || input.length === 0) throw new Error('documents required');
  const ids = new Set();
  return input.map(raw => {
    for (const key of ['documentId', 'title', 'text']) if (!clean(raw?.[key])) throw new Error(`missing document ${key}`);
    const documentId = clean(raw.documentId);
    if (ids.has(documentId)) throw new Error('duplicate documentId');
    ids.add(documentId);
    const factIds = [...new Set((raw.factIds ?? []).map(clean).filter(Boolean))];
    return { documentId, title: clean(raw.title), text: clean(raw.text), factIds, sourceUri: clean(raw.sourceUri), version: clean(raw.version || '1') };
  });
}

export function normalizeCases(input) {
  if (!Array.isArray(input) || input.length === 0) throw new Error('evaluation cases required');
  const ids = new Set();
  return input.map(raw => {
    for (const key of ['caseId', 'question']) if (!clean(raw?.[key])) throw new Error(`missing case ${key}`);
    const caseId = clean(raw.caseId);
    if (ids.has(caseId)) throw new Error('duplicate caseId');
    ids.add(caseId);
    const relevantDocumentIds = [...new Set((raw.relevantDocumentIds ?? []).map(clean).filter(Boolean))];
    const expectedFactIds = [...new Set((raw.expectedFactIds ?? []).map(clean).filter(Boolean))];
    if (!relevantDocumentIds.length || !expectedFactIds.length) throw new Error('golden relevance and facts required');
    return { caseId, question: clean(raw.question), relevantDocumentIds, expectedFactIds, tags: (raw.tags ?? []).map(clean).filter(Boolean) };
  });
}

export function detectUnsafeDocument(document) {
  const patterns = [/ignore (?:all|previous) instructions/i, /system prompt/i, /send (?:the )?(?:secret|password|token)/i, /<script/i];
  const findings = patterns.filter(pattern => pattern.test(document.text)).map(pattern => ({ code: 'retrieval_prompt_injection', pattern: pattern.source, severity: 'block' }));
  return { safe: findings.length === 0, findings };
}

export function lexicalRetrieve(question, documentsInput, k = 3) {
  const documents = normalizeDocuments(documentsInput);
  if (!Number.isInteger(k) || k < 1 || k > 20) throw new Error('invalid k');
  const query = tokens(question);
  return documents.map(document => {
    const body = tokens(`${document.title} ${document.text}`);
    const overlap = [...query].filter(token => body.has(token)).length;
    const score = query.size ? overlap / query.size : 0;
    return { ...document, score: round(score) };
  }).sort((a, b) => b.score - a.score || a.documentId.localeCompare(b.documentId)).slice(0, k);
}

export function scoreRetrieval(retrieved, relevantDocumentIds) {
  const relevant = new Set(relevantDocumentIds);
  const ids = retrieved.map(item => clean(item.documentId));
  const hits = ids.filter(id => relevant.has(id));
  const precisionAtK = ids.length ? hits.length / ids.length : 0;
  const recallAtK = relevant.size ? new Set(hits).size / relevant.size : 0;
  const first = ids.findIndex(id => relevant.has(id));
  let dcg = 0;
  ids.forEach((id, index) => { if (relevant.has(id)) dcg += 1 / Math.log2(index + 2); });
  let ideal = 0;
  for (let index = 0; index < Math.min(relevant.size, ids.length); index++) ideal += 1 / Math.log2(index + 2);
  return { precisionAtK: round(precisionAtK), recallAtK: round(recallAtK), mrr: first < 0 ? 0 : round(1 / (first + 1)), ndcgAtK: ideal ? round(dcg / ideal) : 0 };
}

export function scoreAnswer(answer, contextInput, expectedFactIds) {
  const context = normalizeDocuments(contextInput);
  if (!answer || !Array.isArray(answer.claims) || answer.claims.length === 0) throw new Error('answer claims required');
  const docs = new Map(context.map(document => [document.documentId, document]));
  let supportedClaims = 0, validCitations = 0, totalCitations = 0;
  const coveredFacts = new Set();
  const claimResults = answer.claims.map((raw, index) => {
    const factId = clean(raw.factId), text = clean(raw.text), citations = [...new Set((raw.citations ?? []).map(clean).filter(Boolean))];
    if (!text || !factId) throw new Error(`invalid claim ${index}`);
    totalCitations += citations.length;
    const supporting = citations.filter(id => docs.get(id)?.factIds.includes(factId));
    validCitations += supporting.length;
    const supported = supporting.length > 0;
    if (supported) { supportedClaims++; coveredFacts.add(factId); }
    return { factId, text, citations, supported, invalidCitations: citations.filter(id => !supporting.includes(id)) };
  });
  const expected = new Set(expectedFactIds);
  const expectedCovered = [...coveredFacts].filter(id => expected.has(id)).length;
  return {
    faithfulness: round(supportedClaims / claimResults.length),
    citationAccuracy: totalCitations ? round(validCitations / totalCitations) : 0,
    answerCorrectness: expected.size ? round(expectedCovered / expected.size) : 0,
    claimResults
  };
}

export function evaluateCase(testCaseInput, documentsInput, answer, options = {}) {
  const testCase = normalizeCases([testCaseInput])[0];
  const documents = normalizeDocuments(documentsInput);
  const unsafe = documents.map(document => ({ documentId: document.documentId, ...detectUnsafeDocument(document) })).filter(result => !result.safe);
  if (unsafe.length && options.blockUnsafe !== false) return { caseId: testCase.caseId, status: 'blocked', unsafe, evidenceBoundary: 'simulated' };
  const retrieved = options.retrieved ?? lexicalRetrieve(testCase.question, documents, options.k ?? 3);
  const retrieval = scoreRetrieval(retrieved, testCase.relevantDocumentIds);
  const answerScore = scoreAnswer(answer, retrieved, testCase.expectedFactIds);
  return { caseId: testCase.caseId, status: 'evaluated', retrieval, answer: answerScore, retrievedDocumentIds: retrieved.map(x => x.documentId), evidenceBoundary: 'simulated' };
}

export function aggregateResults(results, gates = {}) {
  const evaluated = results.filter(result => result.status === 'evaluated');
  const blocked = results.length - evaluated.length;
  if (!evaluated.length) return { caseCount: results.length, evaluatedCount: 0, blockedCount: blocked, metrics: {}, passed: false, failures: ['no_evaluated_cases'], evidenceBoundary: 'simulated' };
  const metricNames = ['recallAtK', 'precisionAtK', 'mrr', 'ndcgAtK', 'faithfulness', 'citationAccuracy', 'answerCorrectness'];
  const metrics = {};
  for (const name of metricNames) metrics[name] = round(evaluated.reduce((sum, result) => sum + (result.retrieval[name] ?? result.answer[name] ?? 0), 0) / evaluated.length);
  const thresholds = { recallAtK: 0.8, faithfulness: 0.9, citationAccuracy: 0.9, answerCorrectness: 0.8, ...gates };
  const failures = Object.entries(thresholds).filter(([name, value]) => (metrics[name] ?? 0) < value).map(([name, value]) => `${name}<${value}`);
  return { caseCount: results.length, evaluatedCount: evaluated.length, blockedCount: blocked, metrics, thresholds, passed: failures.length === 0, failures, evidenceBoundary: 'simulated' };
}

export function compareRegression(current, baseline, tolerance = 0.02) {
  if (!current?.metrics || !baseline?.metrics) throw new Error('metrics required');
  if (typeof tolerance !== 'number' || tolerance < 0 || tolerance > 1) throw new Error('invalid tolerance');
  const deltas = {}, regressions = [];
  for (const [name, oldValue] of Object.entries(baseline.metrics)) {
    const now = Number(current.metrics[name] ?? 0);
    const delta = round(now - Number(oldValue));
    deltas[name] = delta;
    if (delta < -tolerance) regressions.push({ metric: name, baseline: oldValue, current: now, delta });
  }
  return { passed: regressions.length === 0, tolerance, deltas, regressions };
}
