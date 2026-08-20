# Data contract

`contracts/quote-request.schema.json` caps lines, requires provider event and customer identity, supports USD/CAD/EUR, and expresses all prices as integer minor units. Tax and discount use basis points. Production requires currency exponent metadata for currencies that do not use two decimal places, tax jurisdiction inputs, product catalog identity, and contract tests with CRM, payment, and accounting providers.
