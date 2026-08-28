# Testing and failure injection

Run `npm test` in this project or `npm run check` at repository root.

Coverage includes contract and policy validation, duplicate identities, approval and applicability, future policies, policy conflict, every rule type, exact citations, risk scoring, document-safety signals, deterministic fingerprints, draft-only remediation, reviewer roles, contract-version diff, benchmark metrics, HTTP behavior and five n8n exports.

Recommended drills:

- remove the data-protection clause and confirm a critical block;
- raise the liability multiplier and confirm an exact numeric finding;
- change the numeric unit and confirm the value is not accepted;
- activate two incompatible governing-law rules and confirm conflict blocking;
- mark the governing policy draft and confirm evaluation refuses it;
- attempt approval with a non-legal role on a high-risk report;
- change one contract clause and confirm the version diff and fingerprint change;
- inject an instruction or secret pattern into contract text.

Green fixtures prove covered code behavior only. They do not prove arbitrary PDF extraction, legal correctness or customer production performance.
