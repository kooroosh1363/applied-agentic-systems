# Security Policy

## Reporting

Do not open a public issue for a vulnerability or exposed credential. Contact the repository owner privately through GitHub.

## Repository rules

- Never commit real credentials, personal data, customer exports, or production tokens.
- Use `.env.example` with non-secret placeholders.
- Synthetic fixtures must not resemble real customer records.
- Provider callbacks must be authenticated in real deployments.
- Sensitive actions require explicit authorization and an audit event.

The automated scanner is a safety net, not a substitute for secret management or review.

