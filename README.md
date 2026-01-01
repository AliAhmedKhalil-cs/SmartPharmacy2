# SmartPharmacy — Production Ready

متطلبات سريعة:
- أسماء النطاقات وTLS جاهز.
- أسرار مخزنة عبر Sealed Secrets أو مدير أسرار.
- مفاتيح نشر CI/CD مضبوطة.

أوامر مختصرة:
- Docker Compose: `docker compose up -d`
- Helm:
  - `helm upgrade --install smartpharmacy ./ops/helm -n smartpharmacy --create-namespace -f ops/helm/values.prod.yaml`
- Terraform:
  - `cd ops/terraform && terraform init && terraform apply`

ملاحظات أمان:
- يجب توفير شهادات TLS صالحة.
- ضبط سياسات المعدلات والـ CSP.
- لا تُخزّن بيانات حساسة طبية.
