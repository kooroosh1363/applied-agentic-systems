# Security and operations

- API key فقط یک بار نمایش داده می‌شود و تنها hash آن نگهداری می‌شود.
- کلید revoke، rotation، rate limit و secret manager برای Production الزامی‌اند.
- quota یک کنترل هزینه است، نه مجوز پرداخت: `spendAuthorized=false`.
- audit event با hash event قبلی زنجیره می‌شود؛ verification باید به‌صورت دوره‌ای اجرا شود.
- Retry محدود است؛ DLQ نیازمند triage انسانی و replay با idempotency key جدید است.
