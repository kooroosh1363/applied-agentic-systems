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

- تمام خواندن و نوشتن‌ها tenant scoped هستند؛ شناسهٔ Tenant از body کاربر به‌تنهایی نباید مبنای مجوز باشد.
- نقش کمتر از `operator` نمی‌تواند Run بسازد؛ API Key خام ذخیره نمی‌شود.
- کلید Idempotency در محدودهٔ Tenant یکتا است؛ مصرف quota تنها برای Run جدید رخ می‌دهد.
- خطا پس از سه تلاش به DLQ می‌رود؛ Audit قابل تغییر نیست و دستکاری‌اش قابل تشخیص است.
- در Production باید authentication مستقل، secret manager، RLS policy کامل، rate limiting و job queue پایدار افزوده شود.
