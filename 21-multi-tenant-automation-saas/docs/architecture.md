# Architecture

`Client → Auth/RBAC → Tenant scoped API → Idempotency + Quota → Run queue → Retry/DLQ → Audit`.

مرز اعتماد: محتوا و شناسهٔ ورودی untrusted هستند. سرویس باید Tenant را از credential معتبر مشتق کند و هر query را با tenant scope اجرا کند. این Demo منطق را in-memory نگه می‌دارد تا نتیجهٔ تست deterministic باشد؛ schema نشان می‌دهد همین boundary در PostgreSQL چگونه تثبیت می‌شود.
