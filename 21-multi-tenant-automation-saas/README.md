# Multi-Tenant Automation SaaS

یک مرجع محلی و deterministic برای نشان‌دادن پایه‌های SaaS چندسازمانی: tenant isolation، RBAC، quota، API key hashing، idempotency، retry/DLQ و audit hash-chain.

## مرز صادقانه

این پروژه هیچ داده‌ای را به سرویس بیرونی ارسال نمی‌کند، پرداخت انجام نمی‌دهد و انتشار خودکار ندارد. Adapterها محلی‌اند؛ PostgreSQL و Compose فقط نمونهٔ اجرای Production-like هستند.

## اجرا

```bash
node src/cli.mjs examples/demo.json
node --test
node src/server.mjs
```

## قرارداد امنیتی

- تمام خواندن و نوشتن‌ها tenant scoped هستند؛ Tenant و Actor از Credential معتبر استخراج می‌شوند و مقادیر body نادیده گرفته می‌شوند.
- نقش کمتر از `operator` نمی‌تواند Run بسازد؛ API Key خام ذخیره نمی‌شود.
- API Key با CSPRNG ساخته می‌شود، Scope و Expiry دارد و فقط hash آن ذخیره می‌شود.
- کلید Idempotency در محدودهٔ Tenant یکتا است؛ مصرف quota تنها برای Run جدید رخ می‌دهد.
- خطا پس از سه تلاش به DLQ می‌رود؛ Audit قابل تغییر نیست و دستکاری‌اش قابل تشخیص است.
- PostgreSQL شامل RLS Policy، FORCE RLS، Usage Ledger و constraintهای lifecycle است.
- Production همچنان به Secret Manager، durable queue، distributed rate limiting و آزمون بار واقعی نیاز دارد.
