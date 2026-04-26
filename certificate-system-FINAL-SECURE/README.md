# نظام إصدار وتحقق الشهادات | Certificate Issuing & Verification System

## نظام متكامل لإصدار الشهادات مع خاصية التحقق الإلكتروني

### المميزات الرئيسية
- ✅ رفع قالب الشهادة (صورة) وتحديد مواقع الحقول
- ✅ إدخال بيانات الطالب (اسم عربي/إنجليزي، تاريخ الميلاد)
- ✅ إدراج تاريخ اليوم تلقائياً في المكان المحدد
- ✅ إنشاء QR Code موقع بـ HMAC-SHA256
- ✅ صفحة تحقق عامة للتحقق من صحة الشهادات
- ✅ دعم اللغتين العربية والإنجليزية
- ✅ إدارة الدورات التدريبية
- ✅ نظام صلاحيات (مشرف + 3 موظفين)
- ✅ سجل أحداث كامل (Audit Logs)
- ✅ حماية RLS على قاعدة البيانات

### التقنيات المستخدمة
- **Frontend**: Next.js 14 + Tailwind CSS + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **PDF Service**: Node.js + Puppeteer (Railway)
- **Desktop App**: Electron (Windows/Mac/Linux)
- **Security**: HMAC-SHA256, JWT, Rate Limiting, RLS

### خطوات التشغيل

#### 1. إعداد Supabase
- أنشئ مشروع جديد في Supabase
- شغّل ملف `01_supabase_migration.sql` في SQL Editor
- فعّل Authentication (Email/Password)
- أنشئ Storage bucket باسم `certificates`

#### 2. إعداد المتغيرات البيئية
```bash
cp .env.local .env
# عدّل المتغيرات حسب إعداداتك
```

#### 3. تشغيل التطبيق
```bash
npm install
npm run dev
```

#### 4. تشغيل خدمة PDF (اختياري)
```bash
cd pdf-service
npm install
npm start
```

#### 5. بناء تطبيق سطح المكتب
```bash
cd electron
npm install
npm run build:win
```

### هيكل المشروع
```
certificate-system/
├── app/                    # Next.js App Router
│   ├── login/             # صفحة تسجيل الدخول
│   ├── dashboard/         # لوحة التحكم
│   │   ├── admin/        # لوحة المشرف
│   │   └── worker/       # لوحة الموظف
│   ├── verify/           # صفحة التحقق العامة
│   └── api/              # API Routes
├── components/            # React Components
│   ├── certificates/     # مكونات الشهادات
│   └── dashboard/        # مكونات لوحة التحكم
├── lib/                   # المكتبات
│   ├── supabase.ts       # Supabase Client
│   ├── auth.ts           # Authentication
│   ├── crypto.ts         # HMAC & Encryption
│   └── rate-limit.ts     # Rate Limiting
├── pdf-service/          # خدمة توليد PDF
├── electron/             # تطبيق سطح المكتب
└── 01_supabase_migration.sql  # قاعدة البيانات
```

### الصلاحيات
| المشرف (Admin) | الموظف (Worker) |
|---|---|
| إدارة المستخدمين | إصدار شهادات |
| إدارة الدورات | عرض شهاداته |
| إدارة القوالب | تحميل PDF |
| عرض جميع السجلات | التحقق من QR |
| إلغاء الشهادات | — |

### الأمان
- 🔐 RLS على جميع الجداول
- 🔐 HMAC-SHA256 لتوقيع QR
- 🔐 Rate Limiting (10 طلب/دقيقة)
- 🔐 JWT Tokens
- 🔐 Audit Logs غير قابلة للتعديل
- 🔐 لا يوجد تسجيل عام - يقوم المشرف بإنشاء الحسابات

### الترخيص
MIT License
