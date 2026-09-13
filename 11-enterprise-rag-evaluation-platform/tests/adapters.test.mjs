import test from "node:test";
import assert from "node:assert/strict";
import {
  localModelConfig,
  cosine,
  embeddingRetrieve,
  generate,
  calibrateJudge,
} from "../src/adapters.mjs";
test("model URL rejects external hosts and credentials", () => {
  for (const url of [
    "https://evil.example",
    "http://127.0.0.1@evil.example",
    "http://user:pass@localhost:11434",
    "http://localhost:11434/custom",
  ])
    assert.throws(() => localModelConfig({ OLLAMA_URL: url }));
});
test("cosine validates finite vectors and dimensions", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  for (const [a, b] of [
    [
      [0, 0],
      [1, 0],
    ],
    [[1], [1, 0]],
    [[NaN], [1]],
  ])
    assert.throws(() => cosine(a, b));
});
test("embedding adapter uses returned real vectors with strict cardinality", async () => {
  const conf = { ...localModelConfig({}), embeddingModel: "test-model" };
  let request;
  const mock = async (url, opts) => {
    request = JSON.parse(opts.body);
    return new Response(
      JSON.stringify({
        embeddings: [
          [1, 0],
          [0, 1],
          [1, 0],
        ],
      }),
    );
  };
  const ranks = await embeddingRetrieve(
    "q",
    [
      { documentId: "a", title: "A", text: "a" },
      { documentId: "b", title: "B", text: "b" },
    ],
    conf,
    mock,
  );
  assert.equal(ranks[0].documentId, "b");
  assert.equal(request.input.length, 3);
  await assert.rejects(
    () =>
      embeddingRetrieve(
        "q",
        [],
        conf,
        async () => new Response('{"embeddings":[]}'),
      ),
    /batch/,
  );
});
test("generation adapter never accepts free text outside claim contract", async () => {
  await assert.rejects(
    () =>
      generate(
        "q",
        [],
        { ...localModelConfig({}), generationModel: "mock" },
        async () =>
          new Response(
            JSON.stringify({
              message: {
                content: '{"abstained":true,"claims":[],"text":"unverified"}',
              },
            }),
          ),
      ),
    /unknown/,
  );
});
test("calibration rejects model labels masquerading as human truth", () =>
  assert.throws(
    () =>
      calibrateJudge([
        {
          caseId: "1",
          expected: "supported",
          predicted: "supported",
          labelSource: "model",
          reviewer: "AI",
        },
      ]),
    /human/,
  ));
test("calibration reports false support and undecided coverage", () => {
  const rows = [
    ["a", "unsupported", "supported"],
    ["b", "supported", "supported"],
    ["c", "supported", "uncertain"],
  ].map(([caseId, expected, predicted]) => ({
    caseId,
    expected,
    predicted,
    labelSource: "independent-human",
    reviewer: "reviewer-1",
  }));
  const s = calibrateJudge(rows);
  assert.equal(s.fp, 1);
  assert.equal(s.precision, 0.5);
  assert.equal(s.coverage, 2 / 3);
  assert.equal(s.uncertain, 1);
});
