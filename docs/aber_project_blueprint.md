<div dir="rtl" align="right">

# خطة بناء مشروع «عابر» — Blueprint كامل


**المشروع:** منصة ويب لإدارة عمليات شركات الشحن بين المحافظات السورية


---

## 0. القرارات التقنية (اقرأها أولًا)

| البند | القرار | السبب |
|---|---|---|
| الواجهة | React + TypeScript + Vite | سريعة ومناسبة للعرض والمناقشة |
| إدارة الحالة | **Zustand** | بسيطة وخفيفة، بلا قوالب كثيرة |
| الاتصال بالخادم | **Axios** (نسخة مركزية مع Interceptors) | توحيد الأخطاء والتوكن |
| المنطق القابل لإعادة الاستخدام | **Custom Hooks** | فصل المنطق عن الواجهة |
| التنسيق | Tailwind CSS + Design Tokens | دعم RTL ونظام تصميم موحد |
| الخادم | Node.js + Express + TypeScript | يتوافق مع Axios ويحمي المفاتيح |
| قاعدة البيانات | **PostgreSQL على Supabase** | مجانية للبداية ومناسبة للعلاقات |
| الصلاحيات | JWT + أدوار (RBAC) في الخادم | خمسة أدوار واضحة |

**مبدأ الاتصال:** `React → Axios → Express API → PostgreSQL (Supabase)`.  
الواجهة **لا تتصل بقاعدة البيانات مباشرة**، فلا تحتاج إلى سياسات RLS معقدة ولا تكشف أي مفتاح في المتصفح.

---

## 1. خطة العمل خطوة بخطوة

### المرحلة 1 — التأسيس (الأسبوع 1)
1. أنشئ مستودع Git واحدًا فيه مجلدان: `aber-web` و `aber-api`.
2. أنشئ مشروع Supabase واحفظ كلمة مرور القاعدة ورابط الاتصال (Session pooler).
3. ثبّت المكتبات (القسم 2) وجهّز ESLint و Prettier.
4. أنشئ هيكل المجلدات حسب Clean Architecture (القسم 4).

**المخرج:** مشروعان يعملان ويعرضان صفحة «Hello» وخادمًا يرد على `/health`.

### المرحلة 2 — قاعدة البيانات (الأسبوع 1–2)
1. نفّذ سكربت SQL (القسم 8) في SQL Editor.
2. أضف بيانات المحافظات وجدول الأسعار والشركة التجريبية والفروع الثلاثة.
3. أنشئ مستخدم مدير النظام عبر سكربت الـ seed.

**المخرج:** جداول كاملة وبيانات تجريبية، وتتأكد بالاستعلام أنها صحيحة.

### المرحلة 3 — الخادم: الهوية والصلاحيات (الأسبوع 2)
1. اتصال `pg` بالقاعدة، وملف env مع التحقق بـ Zod.
2. تسجيل الدخول (`/auth/login`) وإصدار JWT.
3. Middleware للمصادقة وللتحقق من الدور.
4. معالج أخطاء مركزي.

**المخرج:** تسجل الدخول عبر Postman وتحصل على توكن، وتُرفض الطلبات غير المصرح بها.

### المرحلة 4 — الخادم: الشحنات (الأسبوع 3–4)
1. إنشاء شحنة مع التسعير التلقائي ورقم البوليصة.
2. تغيير الحالة مع التحقق من الانتقالات المسموحة وتسجيلها في `shipment_status_log`.
3. التتبع العام برقم البوليصة.
4. التسليم بـ OTP، وتسجيل COD.

**المخرج:** كل نقاط الشحنات تعمل وتُختبر.

### المرحلة 5 — الخادم: الرحلات والمانيفست (الأسبوع 4–5)
1. إنشاء الرحلات وإسناد الشحنات إليها مع فحص السعة.
2. مسح التحميل ومسح الوصول ومطابقة البيان، وكشف النقص.
3. اقتراح أنسب رحلة للشحنة (الجدولة الذكية).

### المرحلة 6 — الواجهة: الأساس (الأسبوع 5)
1. نظام التصميم والمكونات الأساسية (القسم 3).
2. Axios و Zustand و Router والحماية بالأدوار.
3. تسجيل الدخول والتخطيط العام (Layout) بالـ RTL.

### المرحلة 7 — الواجهة: الشاشات (الأسبوع 6–8)
1. العميل (دور عام بلا حساب دخول): التتبع العام وحاسبة تقدير السعر فقط. الشحنات يُنشئها موظف الفرع ومدير الشركة حصرًا.
2. موظف الفرع: الاستلام، الوزن، الملصق و QR، التسليم.
3. السائق: الرحلات ومسح QR.
4. مدير الشركة: الفروع والموظفون والمركبات والرحلات والتقارير.
5. مدير النظام: اعتماد الشركات والإحصاءات.

### المرحلة 8 — التقارير والـ QR (الأسبوع 8–9)
تقرير الشحنة وتقرير الفرع اليومي وملصق QR كصفحات طباعة من المتصفح (@media print وزر «طباعة / حفظ PDF»). لا يوجد توليد PDF على الخادم (غير منفّذ، بقرار المستخدم).

### المرحلة 9 — الاختبار والنشر (الأسبوع 9–10)
1. اختبارات للمنطق الحرج (الانتقالات، التسعير، السعة).
2. نشر الخادم (Render أو Railway) والواجهة (Vercel أو Netlify).
3. جهّز بيانات عرض واقعية وسيناريو المناقشة.

### قائمة الجاهزية قبل المناقشة
- [ ] مشروع Supabase فعّال (غير موقوف بسبب الخمول).
- [ ] سيناريو كامل يعمل: إنشاء شحنة ← تحميل ← نقل ← وصول ← تسليم ← تقرير.
- [ ] حسابات تجريبية لكل دور.
- [ ] نسخة احتياطية: `pg_dump` وفيديو قصير للعرض.

---

## 2. المكتبات اللازمة

### الواجهة (`aber-web`)

</div>

```bash
npm create vite@latest aber-web -- --template react-ts
cd aber-web

# أساسية
npm i react-router-dom zustand axios

# نماذج وتحقق
npm i react-hook-form zod @hookform/resolvers

# واجهة
npm i tailwindcss @tailwindcss/vite clsx lucide-react react-hot-toast date-fns @fontsource/cairo

# QR
npm i qrcode.react html5-qrcode

# اختبار
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

<div dir="rtl" align="right">

### الخادم (`aber-api`)

</div>

```bash
mkdir aber-api && cd aber-api && npm init -y

npm i express pg zod jsonwebtoken bcryptjs helmet cors morgan dotenv express-rate-limit

npm i -D typescript tsx @types/node @types/express @types/pg \
  @types/jsonwebtoken @types/bcryptjs @types/cors @types/morgan \
  vitest supertest @types/supertest
```

<div dir="rtl" align="right">

| المكتبة | وظيفتها |
|---|---|
| `zustand` | مخازن الحالة (المستخدم، الشحنات) |
| `axios` | طلبات HTTP مع Interceptors |
| `react-hook-form` + `zod` | نماذج سريعة وتحقق موحد بين الواجهة والخادم |
| `qrcode.react` | رسم رمز QR للبوليصة |
| `html5-qrcode` | مسح QR بكاميرا المتصفح |
| `pg` | الاتصال بـ PostgreSQL مباشرة |
| `jsonwebtoken` + `bcryptjs` | الهوية وتشفير كلمات المرور |
| `helmet` + `cors` + `express-rate-limit` | حماية الخادم |

---

## 3. نظام التصميم (Design System)

مأخوذ من هوية ملف توصيف المشروع: كحلي وذهبي، بطابع أكاديمي هادئ.

### 3.1 الألوان

| الاسم | القيمة | الاستخدام |
|---|---|---|
| `navy-900` | `#14304f` | العناوين، الأزرار الرئيسية، الشريط العلوي |
| `navy-700` | `#1d4670` | التفاعل (hover)، الروابط |
| `gold-500` | `#b08d3c` | التمييز، الحدود، الأرقام |
| `gold-100` | `#fbf6e8` | خلفيات التنبيهات الدافئة |
| `ink` | `#1f2933` | النص الأساسي |
| `muted` | `#5b6773` | النص الثانوي |
| `surface` | `#fffefb` | خلفية الصفحة |
| `tint` | `#f3f6fa` | خلفية البطاقات والجداول |
| `line` | `#dde3ea` | الحدود |
| `success` | `#1f7a4d` | تم التسليم |
| `warning` | `#b7791f` | في الطريق، تأخير |
| `danger` | `#b83232` | مشكلة، مرتجعة |
| `info` | `#2b6cb0` | مستلمة، محمّلة |

**ألوان حالات الشحنة:**

| الحالة | الشارة |
|---|---|
| `received` مستلمة | `info` |
| `loaded` محمّلة | `navy-700` |
| `in_transit` في الطريق | `warning` |
| `arrived` وصلت الفرع | `gold-500` |
| `delivered` سُلّمت | `success` |
| `returned` مرتجعة | `muted` |
| `issue` مشكلة | `danger` |

### 3.2 الخطوط
- **Cairo** للواجهة كلها (أوزان 400 و 600 و 700 و 800).
- **Amiri** للتقارير المطبوعة فقط (مظهر أكاديمي).

| المستوى | الحجم | الوزن |
|---|---|---|
| `display` | 32px | 800 |
| `h1` | 26px | 800 |
| `h2` | 20px | 700 |
| `h3` | 17px | 700 |
| `body` | 15px | 400 |
| `small` | 13px | 400 |

### 3.3 المسافات والأبعاد
- وحدة المسافة الأساسية **4px**: `4, 8, 12, 16, 24, 32, 48`.
- نصف القطر: `sm 6px`، `md 10px`، `lg 14px`، `full 999px`.
- الظل: `shadow-card: 0 1px 3px rgba(20,48,79,.08)`.

### 3.4 قواعد الـ RTL (إلزامية)
- `<html lang="ar" dir="rtl">`.
- استخدم الخصائص المنطقية فقط: `ms-*` و `me-*` و `ps-*` و `pe-*` و `text-start` بدل `ml/mr/left/right`.
- أيقونات الاتجاه (سهم رجوع، التالي) تُعكس في RTL.
- الأرقام والرموز اللاتينية (رقم البوليصة، رقم الهاتف) داخل عنصر `dir="ltr"`.

### 3.5 المكونات الأساسية

| المكوّن | المتغيرات | الملاحظات |
|---|---|---|
| `Button` | `primary` `secondary` `ghost` `danger` + `sm/md/lg` + `loading` | الارتفاع الأدنى 44px للمس |
| `Input` / `Select` / `Textarea` | `error` `hint` `label` | رسالة الخطأ تحت الحقل |
| `Badge` | حسب حالة الشحنة | `StatusBadge` يأخذ الحالة |
| `Card` | `default` `highlight` | حدّ ذهبي جانبي للتمييز |
| `Table` | قابل للتمرير أفقيًا على الجوال | رأس كحلي |
| `Modal` / `ConfirmDialog` | | للعمليات الحساسة |
| `Stepper` / `Timeline` | | السجل الزمني للشحنة |
| `EmptyState` / `Spinner` / `Toast` | | حالات التحميل والفراغ |
| `QrCode` / `QrScanner` | | الملصق والمسح |

### 3.6 ملف الـ Tokens (Tailwind v4)

`src/index.css`

</div>

```css
@import "tailwindcss";
@import "@fontsource/cairo/400.css";
@import "@fontsource/cairo/600.css";
@import "@fontsource/cairo/700.css";
@import "@fontsource/cairo/800.css";

@theme {
  --font-sans: "Cairo", system-ui, sans-serif;

  --color-navy-900: #14304f;
  --color-navy-700: #1d4670;
  --color-gold-500: #b08d3c;
  --color-gold-100: #fbf6e8;
  --color-ink: #1f2933;
  --color-muted: #5b6773;
  --color-surface: #fffefb;
  --color-tint: #f3f6fa;
  --color-line: #dde3ea;
  --color-success: #1f7a4d;
  --color-warning: #b7791f;
  --color-danger: #b83232;
  --color-info: #2b6cb0;

  --radius-md: 10px;
  --radius-lg: 14px;
}

html { background: var(--color-surface); color: var(--color-ink); }
body { font-family: var(--font-sans); font-size: 15px; line-height: 1.7; }
```

<div dir="rtl" align="right">

`vite.config.ts`

</div>

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
```

<div dir="rtl" align="right">

**مهم:** اختصار `@/` يحتاج إعدادًا ثانيًا في TypeScript وإلا ظهرت أخطاء «Cannot find module». أضفه في `tsconfig.app.json` (الذي ينشئه قالب Vite) داخل `compilerOptions`:

</div>

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

<div dir="rtl" align="right">

### 3.7 مثال مكوّن من النظام

`src/presentation/components/ui/Button.tsx`

</div>

```tsx
import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-700',
  secondary: 'border border-navy-900 text-navy-900 hover:bg-tint',
  ghost: 'text-navy-900 hover:bg-tint',
  danger: 'bg-danger text-white hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-lg',
};

export function Button({
  variant = 'primary', size = 'md', loading, disabled, className, children, ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading ? 'جارٍ التنفيذ...' : children}
    </button>
  );
}
```

<div dir="rtl" align="right">

`src/presentation/components/ui/StatusBadge.tsx`

</div>

```tsx
import clsx from 'clsx';
import { SHIPMENT_STATUS_LABEL, type ShipmentStatus } from '@/domain/entities/Shipment';

const tone: Record<ShipmentStatus, string> = {
  received: 'bg-info/10 text-info',
  loaded: 'bg-navy-700/10 text-navy-700',
  in_transit: 'bg-warning/10 text-warning',
  arrived: 'bg-gold-500/15 text-gold-500',
  delivered: 'bg-success/10 text-success',
  returned: 'bg-muted/10 text-muted',
  issue: 'bg-danger/10 text-danger',
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span className={clsx('inline-block rounded-full px-3 py-0.5 text-sm font-semibold', tone[status])}>
      {SHIPMENT_STATUS_LABEL[status]}
    </span>
  );
}
```

<div dir="rtl" align="right">

---

## 4. المعمارية النظيفة (Clean Architecture)

### 4.1 القاعدة الذهبية: اتجاه الاعتماد نحو الداخل فقط

</div>

```
 Presentation (React, Zustand, Hooks)
        │  تعتمد على
        ▼
 Application (Use Cases)
        │  تعتمد على
        ▼
 Domain (Entities, قواعد العمل, واجهات Repositories)
        ▲
        │  تُنفِّذ واجهات الـ Domain
 Infrastructure (Axios, API, التخزين)
```

<div dir="rtl" align="right">

- **Domain:** أنقى طبقة. لا تستورد React ولا Axios. فيها الكيانات وقواعد العمل (انتقالات الحالة، التسعير).
- **Application:** حالات الاستخدام. تنسّق بين الواجهة والـ Repositories عبر **واجهات** فقط.
- **Infrastructure:** تنفيذ الواجهات فعليًا (Axios → API).
- **Presentation:** المكونات والـ Hooks والمخازن، ولا تعرف شيئًا عن Axios.

الفائدة: تستطيع استبدال الـ API ببيانات تجريبية (Mock) للاختبار دون المساس بالواجهة.

### 4.2 هيكل الواجهة

</div>

```
aber-web/src/
├─ domain/
│  ├─ entities/            Shipment.ts  Trip.ts  User.ts
│  ├─ repositories/        ShipmentRepository.ts  AuthRepository.ts  (واجهات)
│  └─ services/            pricing.ts  shipmentStatus.ts
├─ application/
│  └─ useCases/            createShipment.ts  advanceShipmentStatus.ts
├─ infrastructure/
│  ├─ http/                httpClient.ts  tokenStorage.ts
│  └─ repositories/        ApiShipmentRepository.ts  ApiAuthRepository.ts
├─ app/
│  ├─ container.ts         (ربط التنفيذات بالواجهات)
│  └─ router.tsx
└─ presentation/
   ├─ components/ui/       Button  Input  StatusBadge  Card  Table ...
   ├─ components/shared/   QrScanner  QrLabel  ProtectedRoute
   ├─ hooks/               useAsyncAction  useDebounce
   ├─ stores/              authStore  shipmentStore
   ├─ layouts/             AppLayout  AuthLayout
   └─ features/            (مجلد لكل ميزة: صفحاتها ومكوناتها وhooks الخاصة بها)
      ├─ auth/  shipments/  trips/  tracking/  reports/  admin/
```

<div dir="rtl" align="right">

### 4.3 هيكل الخادم

</div>

```
aber-api/src/
├─ config/        env.ts (التحقق من المتغيرات)
├─ db/            pool.ts  withTransaction.ts
├─ shared/        AppError.ts  asyncHandler.ts  domain/shipmentStatus.ts
├─ middlewares/   authenticate.ts  authorize.ts  validate.ts  errorHandler.ts
├─ modules/
│  ├─ auth/       auth.routes.ts  auth.controller.ts  auth.service.ts  auth.repository.ts
│  ├─ shipments/  shipment.routes.ts  shipment.controller.ts  shipment.service.ts
│  │              shipment.repository.ts  shipment.schema.ts
│  ├─ trips/      ...
│  ├─ branches/   ...
│  └─ reports/    ...
├─ app.ts         (إعداد Express)
└─ server.ts      (تشغيل الخادم)
```

<div dir="rtl" align="right">

**تدفق الطلب:** `Route → validate (Zod) → authenticate → authorize → Controller → Service → Repository → DB`

| الطبقة | مسؤوليتها الوحيدة |
|---|---|
| Route | ربط المسار بالـ middlewares والـ controller |
| Controller | قراءة الطلب وإرجاع الاستجابة، **بدون منطق عمل** |
| Service | قواعد العمل (الانتقالات، السعة، التسعير) |
| Repository | استعلامات SQL فقط |

---

## 5. قواعد الكود النظيف (Clean Code)

1. **أسماء تدل على المعنى:** `advanceShipmentStatus` لا `doIt`، و `weightKg` لا `w`. المتغير المنطقي (Boolean) يبدأ بـ `is` أو `has` أو `can`.
2. **دالة واحدة = مسؤولية واحدة**، وطولها يناسب الشاشة (حوالي 20 سطرًا أو أقل).
3. **لا أرقام سحرية:** الثوابت تُسمّى (`MAX_OTP_ATTEMPTS = 5`).
4. **لا منطق عمل داخل المكونات:** المكوّن يعرض فقط، والمنطق في Hooks و Use Cases.
5. **الأنواع صريحة:** ممنوع `any`. استخدم `unknown` ثم تحقق بـ Zod.
6. **تحقق من كل مدخل عند الحدود:** الواجهة بـ Zod، والخادم بـ Zod أيضًا (لا تثق بالواجهة).
7. **الأخطاء بنوع واضح:** `AppError(status, code, message)`، ومعالج مركزي يحوّلها لاستجابات.
8. **لا تكرار (DRY):** أي منطق يتكرر مرتين يُستخرج لدالة أو Hook.
9. **التعليق يشرح «لماذا» لا «ماذا».**
10. **مجلد لكل ميزة (Feature-based)** بدل مجلد عام للصفحات وآخر للمكونات.
11. **التزامات Git صغيرة وبصيغة Conventional Commits:** `feat(shipments): add status transition guard`.
12. **اختبر المنطق الحرج:** الانتقالات، التسعير، السعة، الصلاحيات.

**مثال: قبل وبعد**

</div>

```ts
// ❌ غير نظيف
function f(s: any, t: string) {
  if (t == 'a') s.st = 'd';
  else if (t == 'b') s.st = 'l';
  return s;
}

// ✅ نظيف
function advanceStatus(shipment: Shipment, next: ShipmentStatus): Shipment {
  if (!canTransition(shipment.status, next)) {
    throw new AppError(409, 'INVALID_TRANSITION', 'انتقال الحالة غير مسموح');
  }
  return { ...shipment, status: next };
}
```

<div dir="rtl" align="right">

**الأدوات:** ESLint + Prettier + `strict: true` في `tsconfig` + Husky (اختياري) لفحص الكود قبل الالتزام.

---

## 6. كود الواجهة (React + Zustand + Axios + Hooks)

### 6.1 Domain

`src/domain/entities/Shipment.ts`

</div>

```ts
export type ShipmentStatus =
  | 'received' | 'loaded' | 'in_transit' | 'arrived'
  | 'delivered' | 'returned' | 'issue';

export type GoodsType = 'normal' | 'fragile' | 'refrigerated';

export interface Shipment {
  id: string;
  trackingNumber: string;
  companyId: string;
  originBranchId: string;
  destBranchId: string;
  tripId: string | null;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  goodsType: GoodsType;
  weightKg: number;
  price: number;
  codAmount: number;
  status: ShipmentStatus;
  createdAt: string; // ISO
  deliveryOtp?: string; // يظهر مرة واحدة فقط في استجابة الإنشاء
}

export interface StatusHistoryItem {
  status: ShipmentStatus;
  changedAt: string;
  note: string | null;
}

/** ما يراه الزائر في صفحة التتبع العامة (بدون بيانات حساسة) */
export interface PublicTracking {
  trackingNumber: string;
  status: ShipmentStatus;
  originGovernorate: string;
  destGovernorate: string;
  history: StatusHistoryItem[];
}

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  received: 'مستلمة',
  loaded: 'محمّلة',
  in_transit: 'في الطريق',
  arrived: 'وصلت الفرع',
  delivered: 'سُلّمت',
  returned: 'مرتجعة',
  issue: 'مشكلة',
};

export const GOODS_TYPE_LABEL: Record<GoodsType, string> = {
  normal: 'عادية',
  fragile: 'قابلة للكسر',
  refrigerated: 'مبرّدة',
};
```

<div dir="rtl" align="right">

`src/domain/entities/User.ts`

</div>

```ts
export type Role =
  | 'system_admin' | 'company_admin' | 'branch_staff' | 'line_driver' | 'customer';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
}
```

<div dir="rtl" align="right">

`src/domain/services/shipmentStatus.ts`

</div>

```ts
import type { ShipmentStatus } from '../entities/Shipment';

const ALLOWED: Record<ShipmentStatus, ShipmentStatus[]> = {
  received: ['loaded', 'returned', 'issue'],
  loaded: ['in_transit', 'issue'],
  in_transit: ['arrived', 'issue'],
  arrived: ['delivered', 'returned', 'issue'],
  delivered: [],
  returned: [],
  issue: ['received', 'loaded', 'in_transit', 'arrived', 'returned'],
};

export const nextStatuses = (from: ShipmentStatus): ShipmentStatus[] => ALLOWED[from];

export const canTransition = (from: ShipmentStatus, to: ShipmentStatus): boolean =>
  ALLOWED[from].includes(to);
```

<div dir="rtl" align="right">

`src/domain/services/pricing.ts`

</div>

```ts
import type { GoodsType } from '../entities/Shipment';

export interface RoutePrice {
  basePrice: number;
  pricePerKg: number;
  estHours: number;
}

const GOODS_FACTOR: Record<GoodsType, number> = {
  normal: 1,
  fragile: 1.25,
  refrigerated: 1.5,
};

/** معاينة فقط. السعر الرسمي يحسبه الخادم بنفس المعادلة. */
export function estimatePrice(route: RoutePrice, weightKg: number, goods: GoodsType): number {
  return Math.round((route.basePrice + route.pricePerKg * weightKg) * GOODS_FACTOR[goods]);
}
```

<div dir="rtl" align="right">

`src/domain/repositories/ShipmentRepository.ts`

</div>

```ts
import type { GoodsType, PublicTracking, Shipment, ShipmentStatus } from '../entities/Shipment';

export interface CreateShipmentInput {
  originBranchId: string;
  destBranchId: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  goodsType: GoodsType;
  weightKg: number;
  codAmount: number;
}

export interface ShipmentFilters {
  status?: ShipmentStatus;
  branchId?: string;
  tripId?: string;
  search?: string;
}

export interface ShipmentRepository {
  create(input: CreateShipmentInput): Promise<Shipment>;
  list(filters?: ShipmentFilters): Promise<Shipment[]>;
  getByTrackingNumber(trackingNumber: string): Promise<Shipment>;
  changeStatus(id: string, status: ShipmentStatus, note?: string): Promise<Shipment>;
  deliver(id: string, otp: string): Promise<Shipment>;
  trackPublic(trackingNumber: string): Promise<PublicTracking>;
}
```

<div dir="rtl" align="right">

`src/domain/repositories/AuthRepository.ts`

</div>

```ts
import type { User } from '../entities/User';

export interface AuthRepository {
  login(email: string, password: string): Promise<{ token: string; user: User }>;
}
```

<div dir="rtl" align="right">

### 6.2 Infrastructure (Axios)

`src/infrastructure/http/tokenStorage.ts`

</div>

```ts
const KEY = 'aber-token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(KEY),
  set: (token: string): void => localStorage.setItem(KEY, token),
  clear: (): void => localStorage.removeItem(KEY),
};
```

<div dir="rtl" align="right">

`src/infrastructure/http/httpClient.ts`

</div>

```ts
import axios, { type AxiosError } from 'axios';
import { tokenStorage } from './tokenStorage';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody { message?: string; code?: string; details?: unknown }

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // مثال: http://localhost:4000/api
  timeout: 15_000,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBody>) => {
    const status = error.response?.status ?? 0;

    if (status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }

    const message =
      error.response?.data?.message ??
      (status === 0 ? 'تعذّر الاتصال بالخادم' : 'حدث خطأ غير متوقع');

    return Promise.reject(
      new ApiError(message, status, error.response?.data?.code, error.response?.data?.details),
    );
  },
);
```

<div dir="rtl" align="right">

`src/infrastructure/repositories/ApiShipmentRepository.ts`

</div>

```ts
import { http } from '../http/httpClient';
import type { PublicTracking, Shipment, ShipmentStatus } from '@/domain/entities/Shipment';
import type {
  CreateShipmentInput, ShipmentFilters, ShipmentRepository,
} from '@/domain/repositories/ShipmentRepository';

interface Envelope<T> { data: T }

export class ApiShipmentRepository implements ShipmentRepository {
  async create(input: CreateShipmentInput): Promise<Shipment> {
    const res = await http.post<Envelope<Shipment>>('/shipments', input);
    return res.data.data;
  }

  async list(filters: ShipmentFilters = {}): Promise<Shipment[]> {
    const res = await http.get<Envelope<Shipment[]>>('/shipments', { params: filters });
    return res.data.data;
  }

  async getByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const res = await http.get<Envelope<Shipment>>(
      `/shipments/by-tracking/${encodeURIComponent(trackingNumber)}`,
    );
    return res.data.data;
  }

  async changeStatus(id: string, status: ShipmentStatus, note?: string): Promise<Shipment> {
    const res = await http.patch<Envelope<Shipment>>(`/shipments/${id}/status`, { status, note });
    return res.data.data;
  }

  async deliver(id: string, otp: string): Promise<Shipment> {
    const res = await http.post<Envelope<Shipment>>(`/shipments/${id}/deliver`, { otp });
    return res.data.data;
  }

  async trackPublic(trackingNumber: string): Promise<PublicTracking> {
    const res = await http.get<Envelope<PublicTracking>>(
      `/public/track/${encodeURIComponent(trackingNumber)}`,
    );
    return res.data.data;
  }
}
```

<div dir="rtl" align="right">

`src/infrastructure/repositories/ApiAuthRepository.ts`

</div>

```ts
import { http } from '../http/httpClient';
import type { AuthRepository } from '@/domain/repositories/AuthRepository';
import type { User } from '@/domain/entities/User';

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await http.post<{ data: { token: string; user: User } }>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  }
}
```

<div dir="rtl" align="right">

### 6.3 Application (Use Cases) والربط

`src/application/useCases/createShipment.ts`

</div>

```ts
import { z } from 'zod';
import type { ShipmentRepository } from '@/domain/repositories/ShipmentRepository';

const phone = z.string().regex(/^\+?[0-9]{9,15}$/, 'رقم هاتف غير صالح');

export const createShipmentSchema = z.object({
  originBranchId: z.string().uuid(),
  destBranchId: z.string().uuid(),
  senderName: z.string().trim().min(2, 'الاسم قصير'),
  senderPhone: phone,
  receiverName: z.string().trim().min(2, 'الاسم قصير'),
  receiverPhone: phone,
  goodsType: z.enum(['normal', 'fragile', 'refrigerated']),
  weightKg: z.coerce.number().positive('الوزن يجب أن يكون أكبر من صفر').max(20_000),
  codAmount: z.coerce.number().min(0).default(0),
}).refine((v) => v.originBranchId !== v.destBranchId, {
  message: 'فرع الوجهة يجب أن يختلف عن فرع الانطلاق',
  path: ['destBranchId'],
});

export type CreateShipmentForm = z.input<typeof createShipmentSchema>;

export const makeCreateShipment = (repo: ShipmentRepository) => async (raw: unknown) => {
  const input = createShipmentSchema.parse(raw);
  return repo.create(input);
};
```

<div dir="rtl" align="right">

`src/application/useCases/advanceShipmentStatus.ts`

</div>

```ts
import { canTransition } from '@/domain/services/shipmentStatus';
import type { Shipment, ShipmentStatus } from '@/domain/entities/Shipment';
import type { ShipmentRepository } from '@/domain/repositories/ShipmentRepository';

export const makeAdvanceShipmentStatus =
  (repo: ShipmentRepository) =>
  async (shipment: Shipment, next: ShipmentStatus, note?: string): Promise<Shipment> => {
    if (!canTransition(shipment.status, next)) {
      throw new Error('انتقال الحالة غير مسموح');
    }
    return repo.changeStatus(shipment.id, next, note);
  };
```

<div dir="rtl" align="right">

`src/app/container.ts`

</div>

```ts
import { ApiShipmentRepository } from '@/infrastructure/repositories/ApiShipmentRepository';
import { ApiAuthRepository } from '@/infrastructure/repositories/ApiAuthRepository';
import { makeCreateShipment } from '@/application/useCases/createShipment';
import { makeAdvanceShipmentStatus } from '@/application/useCases/advanceShipmentStatus';

// المكان الوحيد الذي يعرف التنفيذ الفعلي. للاختبار استبدله بـ Mock.
export const shipmentRepository = new ApiShipmentRepository();
export const authRepository = new ApiAuthRepository();

export const createShipment = makeCreateShipment(shipmentRepository);
export const advanceShipmentStatus = makeAdvanceShipmentStatus(shipmentRepository);
```

<div dir="rtl" align="right">

### 6.4 مخازن Zustand

`src/presentation/stores/authStore.ts`

</div>

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authRepository } from '@/app/container';
import { tokenStorage } from '@/infrastructure/http/tokenStorage';
import type { User } from '@/domain/entities/User';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { token, user } = await authRepository.login(email, password);
          tokenStorage.set(token);
          set({ user, loading: false });
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'فشل تسجيل الدخول' });
          throw e;
        }
      },

      logout: () => {
        tokenStorage.clear();
        set({ user: null, error: null });
      },
    }),
    { name: 'aber-auth', partialize: (state) => ({ user: state.user }) },
  ),
);

// عند أي 401 من Axios نسجّل الخروج تلقائيًا
window.addEventListener('auth:logout', () => useAuthStore.getState().logout());
```

<div dir="rtl" align="right">

`src/presentation/stores/shipmentStore.ts`

</div>

```ts
import { create } from 'zustand';
import { shipmentRepository } from '@/app/container';
import type { Shipment } from '@/domain/entities/Shipment';
import type { ShipmentFilters } from '@/domain/repositories/ShipmentRepository';

interface ShipmentState {
  items: Shipment[];
  loading: boolean;
  error: string | null;
  fetch: (filters?: ShipmentFilters) => Promise<void>;
  upsert: (shipment: Shipment) => void;
}

export const useShipmentStore = create<ShipmentState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (filters) => {
    set({ loading: true, error: null });
    try {
      const items = await shipmentRepository.list(filters);
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'تعذّر تحميل الشحنات' });
    }
  },

  // تحديث عنصر واحد بعد تغيير حالته دون إعادة تحميل القائمة
  upsert: (shipment) =>
    set((state) => ({
      items: state.items.some((s) => s.id === shipment.id)
        ? state.items.map((s) => (s.id === shipment.id ? shipment : s))
        : [shipment, ...state.items],
    })),
}));
```

<div dir="rtl" align="right">

### 6.5 الـ Hooks

`src/presentation/hooks/useAsyncAction.ts`

</div>

```ts
import { useCallback, useState } from 'react';

/** يغلّف أي دالة async ويعطيك loading و error. مرّر دالة ثابتة المرجع. */
export function useAsyncAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: A): Promise<R> => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'حدث خطأ');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  return { run, loading, error };
}
```

<div dir="rtl" align="right">

`src/presentation/hooks/useDebounce.ts`

</div>

```ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

<div dir="rtl" align="right">

`src/presentation/features/shipments/hooks/useShipments.ts`

</div>

```ts
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useShipmentStore } from '@/presentation/stores/shipmentStore';
import type { ShipmentFilters } from '@/domain/repositories/ShipmentRepository';

export function useShipments(filters: ShipmentFilters = {}) {
  const { items, loading, error, fetch } = useShipmentStore(
    useShallow((s) => ({ items: s.items, loading: s.loading, error: s.error, fetch: s.fetch })),
  );

  const key = JSON.stringify(filters); // مفتاح ثابت بدل كائن جديد في كل رندر
  useEffect(() => {
    void fetch(JSON.parse(key) as ShipmentFilters);
  }, [key, fetch]);

  return { shipments: items, loading, error, refresh: () => fetch(filters) };
}
```

<div dir="rtl" align="right">

`src/presentation/features/shipments/hooks/useAdvanceStatus.ts`

</div>

```ts
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { advanceShipmentStatus } from '@/app/container';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useShipmentStore } from '@/presentation/stores/shipmentStore';
import type { Shipment, ShipmentStatus } from '@/domain/entities/Shipment';

export function useAdvanceStatus() {
  const upsert = useShipmentStore((s) => s.upsert);

  const action = useCallback(
    async (shipment: Shipment, next: ShipmentStatus, note?: string) => {
      const updated = await advanceShipmentStatus(shipment, next, note);
      upsert(updated);
      toast.success('تم تحديث حالة الشحنة');
      return updated;
    },
    [upsert],
  );

  return useAsyncAction(action);
}
```

<div dir="rtl" align="right">

`src/presentation/features/tracking/hooks/useTrackShipment.ts`

</div>

```ts
import { useCallback, useState } from 'react';
import { shipmentRepository } from '@/app/container';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import type { PublicTracking } from '@/domain/entities/Shipment';

export function useTrackShipment() {
  const [result, setResult] = useState<PublicTracking | null>(null);

  const fetchTracking = useCallback(async (trackingNumber: string) => {
    const data = await shipmentRepository.trackPublic(trackingNumber.trim());
    setResult(data);
    return data;
  }, []);

  const { run, loading, error } = useAsyncAction(fetchTracking);
  return { track: run, result, loading, error };
}
```

<div dir="rtl" align="right">

### 6.6 حماية المسارات والـ Router

`src/presentation/components/shared/ProtectedRoute.tsx`

</div>

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/presentation/stores/authStore';
import type { Role } from '@/domain/entities/User';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
```

<div dir="rtl" align="right">

`src/app/router.tsx`

</div>

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/presentation/components/shared/ProtectedRoute';
// الصفحات تُستورد من مجلدات features

export const router = createBrowserRouter([
  { path: '/', element: <TrackPage /> },              // تتبع عام بلا تسجيل دخول
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute roles={['branch_staff', 'company_admin']} />,
    children: [
      { path: '/branch/shipments', element: <ShipmentsPage /> },
      { path: '/branch/shipments/new', element: <NewShipmentPage /> },
    ],
  },
  {
    element: <ProtectedRoute roles={['line_driver']} />,
    children: [{ path: '/driver/trips', element: <DriverTripsPage /> }],
  },
  {
    element: <ProtectedRoute roles={['system_admin']} />,
    children: [{ path: '/admin', element: <AdminDashboardPage /> }],
  },
  { path: '/403', element: <ForbiddenPage /> },
]);
```

<div dir="rtl" align="right">

### 6.7 ماسح QR

`src/presentation/components/shared/QrScanner.tsx`

</div>

```tsx
import { useEffect, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  /** مرّر دالة ثابتة (useCallback) حتى لا تُعاد تهيئة الكاميرا */
  onScan: (text: string) => void;
}

export function QrScanner({ onScan }: Props) {
  const elementId = useId().replace(/:/g, '');

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    let cancelled = false;
    let started = false;

    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, onScan, () => undefined)
      .then(() => {
        started = true;
        if (cancelled) void scanner.stop().then(() => scanner.clear());
      })
      .catch(() => undefined); // رفض الإذن أو لا توجد كاميرا

    return () => {
      cancelled = true;
      if (started) void scanner.stop().then(() => scanner.clear());
    };
  }, [elementId, onScan]);

  return <div id={elementId} className="w-full max-w-sm overflow-hidden rounded-lg" />;
}
```

<div dir="rtl" align="right">

> **ملاحظة مهمة:** الكاميرا في المتصفح تعمل فقط على **HTTPS** أو `localhost`. رمز الـ QR يحمل **رقم البوليصة فقط**، ثم تجلب الواجهة بيانات الشحنة من الخادم.

`src/presentation/components/shared/QrLabel.tsx`

</div>

```tsx
import { QRCodeSVG } from 'qrcode.react';

export function QrLabel({ trackingNumber }: { trackingNumber: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-lg border border-line p-4">
      <QRCodeSVG value={trackingNumber} size={140} level="M" />
      <span dir="ltr" className="font-mono text-sm font-bold text-navy-900">
        {trackingNumber}
      </span>
    </div>
  );
}
```

<div dir="rtl" align="right">

---

## 7. كود الخادم (Express + TypeScript)

### 7.1 الإعداد

`tsconfig.json`

</div>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src", "scripts"]
}
```

<div dir="rtl" align="right">

`package.json` (الأجزاء المهمة)

</div>

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/src/server.js",
    "test": "vitest run",
    "seed:admin": "tsx scripts/seed-admin.ts"
  }
}
```

<div dir="rtl" align="right">

`.env` (لا ترفعه إلى Git أبدًا)

</div>

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres.xxxx:كلمة_المرور@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
JWT_SECRET=ضع_هنا_نصًا_عشوائيًا_طوله_32_حرفًا_على_الأقل
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

<div dir="rtl" align="right">

> إن احتوت كلمة مرور القاعدة رموزًا خاصة (`@ # /`) فرمّزها بصيغة URL-encoding داخل الرابط.

`src/config/env.ts`

</div>

```ts
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(['true', 'false']).default('true'), // Supabase يتطلب true، وللقاعدة المحلية false
  JWT_SECRET: z.string().min(32, 'JWT_SECRET يجب ألا يقل عن 32 حرفًا'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

// يفشل التشغيل فورًا إن كان أي متغير ناقصًا أو خاطئًا
export const env = schema.parse(process.env);
```

<div dir="rtl" align="right">

`src/db/pool.ts`

</div>

```ts
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
});

/** أي شيء يستطيع تنفيذ استعلام: الـ pool أو عميل داخل معاملة */
export interface Queryable {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<R>>;
}

export async function withTransaction<T>(work: (tx: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

<div dir="rtl" align="right">

### 7.2 الأخطاء والـ Middlewares

`src/shared/AppError.ts`

</div>

```ts
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

<div dir="rtl" align="right">

`src/shared/asyncHandler.ts`

</div>

```ts
import type { NextFunction, Request, RequestHandler, Response } from 'express';

// يضمن وصول أخطاء الدوال غير المتزامنة إلى معالج الأخطاء (آمن مع Express 4 و 5)
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
```

<div dir="rtl" align="right">

`src/shared/domain/shipmentStatus.ts`

</div>

```ts
export type ShipmentStatus =
  | 'received' | 'loaded' | 'in_transit' | 'arrived'
  | 'delivered' | 'returned' | 'issue';

const ALLOWED: Record<ShipmentStatus, ShipmentStatus[]> = {
  received: ['loaded', 'returned', 'issue'],
  loaded: ['in_transit', 'issue'],
  in_transit: ['arrived', 'issue'],
  arrived: ['delivered', 'returned', 'issue'],
  delivered: [],
  returned: [],
  issue: ['received', 'loaded', 'in_transit', 'arrived', 'returned'],
};

export const canTransition = (from: ShipmentStatus, to: ShipmentStatus): boolean =>
  ALLOWED[from].includes(to);
```

<div dir="rtl" align="right">

`src/middlewares/authenticate.ts`

</div>

```ts
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../shared/AppError';

export type Role =
  | 'system_admin' | 'company_admin' | 'branch_staff' | 'line_driver' | 'customer';

export interface AuthUser {
  id: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
}

declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
    req.user = {
      id: String(payload.sub),
      role: payload.role as Role,
      companyId: (payload.companyId as string | null) ?? null,
      branchId: (payload.branchId as string | null) ?? null,
    };
    next();
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'الجلسة غير صالحة أو منتهية');
  }
}
```

<div dir="rtl" align="right">

`src/middlewares/authorize.ts`

</div>

```ts
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/AppError';
import type { Role } from './authenticate';

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية لتنفيذ هذا الإجراء');
    }
    next();
  };
```

<div dir="rtl" align="right">

`src/middlewares/validateBody.ts`

</div>

```ts
import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

// أخطاء Zod تُحوَّل إلى 400 في errorHandler
export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
```

<div dir="rtl" align="right">

`src/middlewares/errorHandler.ts`

</div>

```ts
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/AppError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'بيانات غير صالحة',
      details: err.flatten().fieldErrors,
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ code: err.code, message: err.message, details: err.details });
    return;
  }
  console.error(err); // لا نكشف تفاصيل الأخطاء الداخلية للعميل
  res.status(500).json({ code: 'INTERNAL', message: 'خطأ داخلي في الخادم' });
};
```

<div dir="rtl" align="right">

### 7.3 وحدة الهوية (Auth)

`src/modules/auth/auth.service.ts`

</div>

```ts
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { AppError } from '../../shared/AppError';
import type { Role } from '../../middlewares/authenticate';

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
  passwordHash: string;
  isActive: boolean;
}

export const authService = {
  async login(email: string, password: string) {
    const { rows } = await pool.query<UserRow>(
      `SELECT id, full_name AS "fullName", email, role,
              company_id AS "companyId", branch_id AS "branchId",
              password_hash AS "passwordHash", is_active AS "isActive"
         FROM users WHERE lower(email) = lower($1)`,
      [email],
    );
    const row = rows[0];
    const valid = row && row.isActive && (await bcrypt.compare(password, row.passwordHash));
    if (!row || !valid) {
      throw new AppError(401, 'BAD_CREDENTIALS', 'البريد أو كلمة المرور غير صحيحة');
    }

    const token = jwt.sign(
      { role: row.role, companyId: row.companyId, branchId: row.branchId },
      env.JWT_SECRET,
      { subject: row.id, expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] },
    );

    const { passwordHash: _omit, isActive: _active, ...user } = row;
    return { token, user };
  },
};
```

<div dir="rtl" align="right">

`src/modules/auth/auth.routes.ts`

</div>

```ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../shared/asyncHandler';
import { validateBody } from '../../middlewares/validateBody';
import { authService, loginBody } from './auth.service';

export const authRouter = Router();

// حماية من تخمين كلمات المرور
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

authRouter.post(
  '/login',
  loginLimiter,
  validateBody(loginBody),
  asyncHandler(async (req, res) => {
    const data = await authService.login(req.body.email, req.body.password);
    res.json({ data });
  }),
);
```

<div dir="rtl" align="right">

### 7.4 وحدة الشحنات

`src/modules/shipments/shipment.schema.ts`

</div>

```ts
import { z } from 'zod';

const phone = z.string().regex(/^\+?[0-9]{9,15}$/);

export const createShipmentBody = z
  .object({
    originBranchId: z.string().uuid(),
    destBranchId: z.string().uuid(),
    senderName: z.string().trim().min(2).max(100),
    senderPhone: phone,
    receiverName: z.string().trim().min(2).max(100),
    receiverPhone: phone,
    goodsType: z.enum(['normal', 'fragile', 'refrigerated']),
    weightKg: z.coerce.number().positive().max(20_000),
    codAmount: z.coerce.number().min(0).default(0),
  })
  .refine((v) => v.originBranchId !== v.destBranchId, { path: ['destBranchId'] });

export const statusBody = z.object({
  status: z.enum(['received', 'loaded', 'in_transit', 'arrived', 'delivered', 'returned', 'issue']),
  note: z.string().max(300).optional(),
});

export const deliverBody = z.object({ otp: z.string().regex(/^[0-9]{6}$/) });

export const listQuery = z.object({
  status: statusBody.shape.status.optional(),
  branchId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  search: z.string().trim().max(50).optional(),
});

export type CreateShipmentBody = z.infer<typeof createShipmentBody>;
export type ListQuery = z.infer<typeof listQuery>;
```

<div dir="rtl" align="right">

`src/modules/shipments/shipment.repository.ts` — **استعلامات SQL فقط**

</div>

```ts
import type { Queryable } from '../../db/pool';
import type { ShipmentStatus } from '../../shared/domain/shipmentStatus';
import type { CreateShipmentBody, ListQuery } from './shipment.schema';

export interface ShipmentDto {
  id: string; trackingNumber: string; companyId: string;
  originBranchId: string; destBranchId: string; tripId: string | null;
  senderName: string; senderPhone: string; receiverName: string; receiverPhone: string;
  goodsType: 'normal' | 'fragile' | 'refrigerated';
  weightKg: number; price: number; codAmount: number;
  status: ShipmentStatus; createdAt: string;
}

// الأسماء المستعارة تحوّل snake_case إلى camelCase مباشرة من SQL
const SELECT = `
  SELECT s.id, s.tracking_number AS "trackingNumber", s.company_id AS "companyId",
         s.origin_branch_id AS "originBranchId", s.dest_branch_id AS "destBranchId",
         s.trip_id AS "tripId", s.sender_name AS "senderName", s.sender_phone AS "senderPhone",
         s.receiver_name AS "receiverName", s.receiver_phone AS "receiverPhone",
         s.goods_type AS "goodsType", s.weight_kg::float AS "weightKg",
         s.price::float AS price, s.cod_amount::float AS "codAmount",
         s.status, s.created_at AS "createdAt"
    FROM shipments s`;

export interface BranchRow { id: string; company_id: string; governorate_code: string }
export interface RoutePriceRow { base_price: number; price_per_kg: number; est_hours: number }

export const shipmentRepository = {
  async findById(db: Queryable, id: string, lock = false): Promise<ShipmentDto | null> {
    const { rows } = await db.query<ShipmentDto>(
      `${SELECT} WHERE s.id = $1 ${lock ? 'FOR UPDATE OF s' : ''}`, [id],
    );
    return rows[0] ?? null;
  },

  async findByTracking(db: Queryable, trackingNumber: string): Promise<ShipmentDto | null> {
    const { rows } = await db.query<ShipmentDto>(`${SELECT} WHERE s.tracking_number = $1`, [trackingNumber]);
    return rows[0] ?? null;
  },

  async list(db: Queryable, filters: ListQuery, companyId: string | null): Promise<ShipmentDto[]> {
    const where: string[] = [];
    const values: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      values.push(value);
      where.push(sql.replaceAll('?', `$${values.length}`));
    };

    if (companyId) add('s.company_id = ?', companyId);
    if (filters.status) add('s.status = ?', filters.status);
    if (filters.tripId) add('s.trip_id = ?', filters.tripId);
    if (filters.branchId) add('(s.origin_branch_id = ? OR s.dest_branch_id = ?)', filters.branchId);
    if (filters.search) add('(s.tracking_number ILIKE ? OR s.receiver_name ILIKE ?)', `%${filters.search}%`);

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await db.query<ShipmentDto>(
      `${SELECT} ${clause} ORDER BY s.created_at DESC LIMIT 200`, values,
    );
    return rows;
  },

  async findBranches(db: Queryable, ids: string[]): Promise<BranchRow[]> {
    const { rows } = await db.query<BranchRow>(
      'SELECT id, company_id, governorate_code FROM branches WHERE id = ANY($1::uuid[])', [ids],
    );
    return rows;
  },

  async findRoutePrice(db: Queryable, from: string, to: string): Promise<RoutePriceRow | null> {
    const { rows } = await db.query<RoutePriceRow>(
      `SELECT base_price::float AS base_price, price_per_kg::float AS price_per_kg, est_hours::float AS est_hours
         FROM route_prices WHERE from_governorate = $1 AND to_governorate = $2`, [from, to],
    );
    return rows[0] ?? null;
  },

  async insert(
    db: Queryable,
    d: CreateShipmentBody & { companyId: string; price: number; otpHash: string; createdBy: string },
  ): Promise<string> {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO shipments
         (company_id, origin_branch_id, dest_branch_id, sender_name, sender_phone,
          receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount,
          delivery_otp_hash, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [d.companyId, d.originBranchId, d.destBranchId, d.senderName, d.senderPhone,
       d.receiverName, d.receiverPhone, d.goodsType, d.weightKg, d.price, d.codAmount,
       d.otpHash, d.createdBy],
    );
    return rows[0].id;
  },

  async updateStatus(db: Queryable, id: string, status: ShipmentStatus): Promise<void> {
    await db.query(
      `UPDATE shipments
          SET status = $2::shipment_status,
              delivered_at = CASE WHEN $2::shipment_status = 'delivered' THEN now() ELSE delivered_at END
        WHERE id = $1`,
      [id, status],
    );
  },

  async insertLog(db: Queryable, shipmentId: string, status: ShipmentStatus, note: string | null, by: string | null) {
    await db.query(
      `INSERT INTO shipment_status_log (shipment_id, status, note, changed_by) VALUES ($1,$2,$3,$4)`,
      [shipmentId, status, note, by],
    );
  },

  async getOtpState(db: Queryable, id: string): Promise<{ hash: string; attempts: number }> {
    const { rows } = await db.query<{ hash: string; attempts: number }>(
      'SELECT delivery_otp_hash AS hash, otp_attempts AS attempts FROM shipments WHERE id = $1', [id],
    );
    return rows[0];
  },

  async bumpOtpAttempts(db: Queryable, id: string): Promise<void> {
    await db.query('UPDATE shipments SET otp_attempts = otp_attempts + 1 WHERE id = $1', [id]);
  },

  async insertCollection(db: Queryable, c: { shipmentId: string; branchId: string; amount: number; collectedBy: string }) {
    await db.query(
      `INSERT INTO collections (shipment_id, branch_id, amount, collected_by) VALUES ($1,$2,$3,$4)
       ON CONFLICT (shipment_id) DO NOTHING`,
      [c.shipmentId, c.branchId, c.amount, c.collectedBy],
    );
  },

  async publicTracking(db: Queryable, trackingNumber: string) {
    const head = await db.query<{
      trackingNumber: string; status: ShipmentStatus; originGovernorate: string; destGovernorate: string; id: string;
    }>(
      `SELECT s.id, s.tracking_number AS "trackingNumber", s.status,
              og.name_ar AS "originGovernorate", dg.name_ar AS "destGovernorate"
         FROM shipments s
         JOIN branches ob ON ob.id = s.origin_branch_id
         JOIN governorates og ON og.code = ob.governorate_code
         JOIN branches dbr ON dbr.id = s.dest_branch_id
         JOIN governorates dg ON dg.code = dbr.governorate_code
        WHERE s.tracking_number = $1`, [trackingNumber],
    );
    if (!head.rows[0]) return null;

    const history = await db.query<{ status: ShipmentStatus; changedAt: string; note: string | null }>(
      `SELECT status, changed_at AS "changedAt", note
         FROM shipment_status_log WHERE shipment_id = $1 ORDER BY changed_at ASC`, [head.rows[0].id],
    );
    const { id: _id, ...summary } = head.rows[0];
    return { ...summary, history: history.rows };
  },
};
```

<div dir="rtl" align="right">

`src/modules/shipments/shipment.service.ts` — **قواعد العمل**

</div>

```ts
import { createHash, randomInt } from 'node:crypto';
import { pool, withTransaction, type Queryable } from '../../db/pool';
import { AppError } from '../../shared/AppError';
import { canTransition, type ShipmentStatus } from '../../shared/domain/shipmentStatus';
import type { AuthUser } from '../../middlewares/authenticate';
import { shipmentRepository as repo, type ShipmentDto } from './shipment.repository';
import type { CreateShipmentBody, ListQuery } from './shipment.schema';

const MAX_OTP_ATTEMPTS = 5;
const GOODS_FACTOR = { normal: 1, fragile: 1.25, refrigerated: 1.5 } as const;
const DRIVER_ALLOWED: ShipmentStatus[] = ['loaded', 'in_transit', 'arrived', 'issue'];

const hashOtp = (otp: string): string => createHash('sha256').update(otp).digest('hex');

function assertSameCompany(user: AuthUser, companyId: string): void {
  if (user.role !== 'system_admin' && user.companyId !== companyId) {
    throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية على هذه الشحنة');
  }
}

async function mustFind(db: Queryable, id: string, lock = false): Promise<ShipmentDto> {
  const shipment = await repo.findById(db, id, lock);
  if (!shipment) throw new AppError(404, 'NOT_FOUND', 'الشحنة غير موجودة');
  return shipment;
}

export const shipmentService = {
  async create(user: AuthUser, body: CreateShipmentBody) {
    const companyId = user.companyId;
    if (!companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
    if (user.role === 'branch_staff' && body.originBranchId !== user.branchId) {
      throw new AppError(403, 'FORBIDDEN', 'يمكنك تسجيل الشحنات من فرعك فقط');
    }

    const branches = await repo.findBranches(pool, [body.originBranchId, body.destBranchId]);
    const origin = branches.find((b) => b.id === body.originBranchId);
    const dest = branches.find((b) => b.id === body.destBranchId);
    if (!origin || !dest || origin.company_id !== companyId || dest.company_id !== companyId) {
      throw new AppError(422, 'INVALID_BRANCH', 'فرع غير صالح');
    }

    const route = await repo.findRoutePrice(pool, origin.governorate_code, dest.governorate_code);
    if (!route) throw new AppError(422, 'NO_ROUTE_PRICE', 'لا يوجد سعر معرّف لهذا المسار');

    // السعر الرسمي يُحسب هنا دائمًا ولا يُقبل من الواجهة
    const price = Math.round(
      (route.base_price + route.price_per_kg * body.weightKg) * GOODS_FACTOR[body.goodsType],
    );
    const otp = String(randomInt(100_000, 1_000_000));

    return withTransaction(async (tx) => {
      const id = await repo.insert(tx, { ...body, companyId, price, otpHash: hashOtp(otp), createdBy: user.id });
      await repo.insertLog(tx, id, 'received', null, user.id);
      const shipment = await mustFind(tx, id);
      return { ...shipment, deliveryOtp: otp }; // الرمز يظهر هذه المرة فقط
    });
  },

  list(user: AuthUser, filters: ListQuery) {
    const scope = user.role === 'system_admin' ? null : user.companyId;
    return repo.list(pool, filters, scope);
  },

  async getByTracking(user: AuthUser, trackingNumber: string) {
    const shipment = await repo.findByTracking(pool, trackingNumber);
    if (!shipment) throw new AppError(404, 'NOT_FOUND', 'الشحنة غير موجودة');
    assertSameCompany(user, shipment.companyId);
    return shipment;
  },

  async changeStatus(user: AuthUser, id: string, next: ShipmentStatus, note?: string) {
    if (next === 'delivered') {
      throw new AppError(400, 'USE_DELIVER', 'التسليم يتم عبر رمز التحقق');
    }
    if (user.role === 'line_driver' && !DRIVER_ALLOWED.includes(next)) {
      throw new AppError(403, 'FORBIDDEN', 'هذه الحالة ليست من صلاحياتك');
    }

    return withTransaction(async (tx) => {
      const current = await mustFind(tx, id, true); // قفل الصف لمنع التعارض
      assertSameCompany(user, current.companyId);
      if (!canTransition(current.status, next)) {
        throw new AppError(409, 'INVALID_TRANSITION', 'انتقال الحالة غير مسموح');
      }
      await repo.updateStatus(tx, id, next);
      await repo.insertLog(tx, id, next, note ?? null, user.id);
      return mustFind(tx, id);
    });
  },

  async deliver(user: AuthUser, id: string, otp: string) {
    const shipment = await mustFind(pool, id);
    assertSameCompany(user, shipment.companyId);
    if (shipment.status !== 'arrived') {
      throw new AppError(409, 'NOT_ARRIVED', 'لا يمكن التسليم قبل وصول الشحنة');
    }

    // يُحسب المحاولات خارج المعاملة حتى لا يُلغى العدّاد عند الرفض
    const state = await repo.getOtpState(pool, id);
    if (state.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(429, 'OTP_LOCKED', 'تم تجاوز عدد المحاولات، راجع مدير الفرع');
    }
    if (state.hash !== hashOtp(otp)) {
      await repo.bumpOtpAttempts(pool, id);
      throw new AppError(400, 'WRONG_OTP', 'رمز التحقق غير صحيح');
    }

    return withTransaction(async (tx) => {
      const current = await mustFind(tx, id, true);
      if (current.status !== 'arrived') throw new AppError(409, 'NOT_ARRIVED', 'حالة الشحنة تغيّرت');

      await repo.updateStatus(tx, id, 'delivered');
      await repo.insertLog(tx, id, 'delivered', null, user.id);
      if (current.codAmount > 0) {
        await repo.insertCollection(tx, {
          shipmentId: id,
          branchId: user.branchId ?? current.destBranchId,
          amount: current.codAmount,
          collectedBy: user.id,
        });
      }
      return mustFind(tx, id);
    });
  },

  async trackPublic(trackingNumber: string) {
    const data = await repo.publicTracking(pool, trackingNumber);
    if (!data) throw new AppError(404, 'NOT_FOUND', 'رقم البوليصة غير صحيح');
    return data;
  },
};
```

<div dir="rtl" align="right">

`src/modules/shipments/shipment.controller.ts` — **بلا منطق عمل**

</div>

```ts
import type { Request, Response } from 'express';
import { shipmentService } from './shipment.service';
import { listQuery } from './shipment.schema';

const user = (req: Request) => req.user!; // مضمون بعد authenticate

export const shipmentController = {
  async create(req: Request, res: Response) {
    res.status(201).json({ data: await shipmentService.create(user(req), req.body) });
  },
  async list(req: Request, res: Response) {
    res.json({ data: await shipmentService.list(user(req), listQuery.parse(req.query)) });
  },
  async getByTracking(req: Request, res: Response) {
    res.json({ data: await shipmentService.getByTracking(user(req), String(req.params.trackingNumber)) });
  },
  async changeStatus(req: Request, res: Response) {
    const { status, note } = req.body;
    res.json({ data: await shipmentService.changeStatus(user(req), String(req.params.id), status, note) });
  },
  async deliver(req: Request, res: Response) {
    res.json({ data: await shipmentService.deliver(user(req), String(req.params.id), req.body.otp) });
  },
  async trackPublic(req: Request, res: Response) {
    res.json({ data: await shipmentService.trackPublic(String(req.params.trackingNumber)) });
  },
};
```

<div dir="rtl" align="right">

`src/modules/shipments/shipment.routes.ts`

</div>

```ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validateBody } from '../../middlewares/validateBody';
import { asyncHandler as h } from '../../shared/asyncHandler';
import { shipmentController as c } from './shipment.controller';
import { createShipmentBody, deliverBody, statusBody } from './shipment.schema';

export const shipmentRouter = Router();
export const publicRouter = Router();

// تتبع عام بلا تسجيل دخول مع تحديد المعدل
publicRouter.get(
  '/track/:trackingNumber',
  rateLimit({ windowMs: 60_000, limit: 30 }),
  h(c.trackPublic),
);

shipmentRouter.use(authenticate);
const staff = authorize('branch_staff', 'company_admin');

shipmentRouter.post('/', staff, validateBody(createShipmentBody), h(c.create));
shipmentRouter.get('/', authorize('branch_staff', 'company_admin', 'line_driver', 'system_admin'), h(c.list));
shipmentRouter.get('/by-tracking/:trackingNumber', authorize('branch_staff', 'company_admin', 'line_driver', 'system_admin'), h(c.getByTracking));
shipmentRouter.patch('/:id/status', authorize('branch_staff', 'company_admin', 'line_driver'), validateBody(statusBody), h(c.changeStatus));
shipmentRouter.post('/:id/deliver', staff, validateBody(deliverBody), h(c.deliver));
```

<div dir="rtl" align="right">

### 7.5 تجميع التطبيق

`src/app.ts`

</div>

```ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './shared/AppError';
import { authRouter } from './modules/auth/auth.routes';
import { publicRouter, shipmentRouter } from './modules/shipments/shipment.routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '100kb' }));
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/shipments', shipmentRouter);
// أضف هنا: trips, branches, reports, admin

app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'المسار غير موجود')));
app.use(errorHandler);
```

<div dir="rtl" align="right">

`src/server.ts`

</div>

```ts
import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => console.log(`API running on :${env.PORT}`));
```

<div dir="rtl" align="right">

`scripts/seed-admin.ts`

</div>

```ts
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool';

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) throw new Error('Usage: npm run seed:admin -- <email> <password>');

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ('مدير النظام', $1, $2, 'system_admin') ON CONFLICT DO NOTHING`,
    [email, hash],
  );
  console.log('admin ready');
  await pool.end();
}

void main();
```

```bash
npm run seed:admin -- admin@aber.test "ضع_كلمة_مرور_قوية"
```

<div dir="rtl" align="right">

---

## 8. قاعدة البيانات (PostgreSQL على Supabase)

نفّذ السكربت كاملًا في **SQL Editor**. الجداول مرتبطة بعلاقات صارمة (مفاتيح أجنبية وقيود فحص) حتى لا تدخل بيانات خاطئة.

</div>

```sql
-- =====================================================
-- ملاحظة: gen_random_uuid() مدمجة في PostgreSQL 13+ ولا تحتاج إضافات
-- =====================================================

-- =====================================================
-- 1) الأنواع المعدّدة
-- =====================================================
create type user_role as enum
  ('system_admin','company_admin','branch_staff','line_driver','customer');
-- ملاحظة: القيمة customer محفوظة للتوافق؛ الدور العام للتتبع وتقدير السعر ولا ينشئ شحنات.
create type company_status as enum ('pending','approved','suspended');
create type goods_type as enum ('normal','fragile','refrigerated');
create type shipment_status as enum
  ('received','loaded','in_transit','arrived','delivered','returned','issue');
create type trip_status as enum ('scheduled','loading','in_transit','arrived','closed');
create type scan_type as enum ('load','arrive');

-- =====================================================
-- 2) جداول مرجعية
-- =====================================================
create table governorates (
  code    text primary key,
  name_ar text not null unique
);

insert into governorates (code, name_ar) values
  ('DAM','دمشق'),('RIF','ريف دمشق'),('ALP','حلب'),('HMS','حمص'),
  ('HMA','حماة'),('LAT','اللاذقية'),('TAR','طرطوس'),('IDL','إدلب'),
  ('RAQ','الرقة'),('DEZ','دير الزور'),('HAS','الحسكة'),('DRA','درعا'),
  ('SUW','السويداء'),('QUN','القنيطرة');

create table route_prices (
  from_governorate text not null references governorates(code),
  to_governorate   text not null references governorates(code),
  base_price       numeric(12,2) not null check (base_price >= 0),
  price_per_kg     numeric(12,2) not null check (price_per_kg >= 0),
  est_hours        numeric(5,1)  not null check (est_hours > 0),
  primary key (from_governorate, to_governorate),
  check (from_governorate <> to_governorate)
);

-- =====================================================
-- 3) الشركات والفروع والمستخدمون والمركبات
-- =====================================================
create table companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  status     company_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table branches (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies(id) on delete cascade,
  governorate_code text not null references governorates(code),
  name             text not null,
  address          text,
  phone            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (company_id, governorate_code, name)
);

create table users (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies(id) on delete cascade,
  branch_id     uuid references branches(id) on delete set null,
  full_name     text not null,
  email         text not null,
  phone         text,
  password_hash text not null,
  role          user_role not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- موظفو الشركات والسائقون يجب أن يتبعوا شركة
  check (role in ('system_admin','customer') or company_id is not null)
);
create unique index users_email_uq on users (lower(email));

create table vehicles (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  plate_number text not null,
  capacity_kg  numeric(10,2) not null check (capacity_kg > 0),
  is_active    boolean not null default true,
  unique (company_id, plate_number)
);

-- =====================================================
-- 4) الرحلات
-- =====================================================
create table trips (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references companies(id) on delete cascade,
  from_branch_id       uuid not null references branches(id),
  to_branch_id         uuid not null references branches(id),
  driver_id            uuid references users(id),
  vehicle_id           uuid references vehicles(id),
  departure_at         timestamptz not null,
  estimated_arrival_at timestamptz,
  capacity_kg          numeric(10,2) not null check (capacity_kg > 0),
  status               trip_status not null default 'scheduled',
  created_at           timestamptz not null default now(),
  check (from_branch_id <> to_branch_id)
);

-- =====================================================
-- 5) الشحنات
-- =====================================================
create sequence shipment_tracking_seq start 1;

create function generate_tracking_number() returns text
language sql as $$
  select 'AB' || to_char(now(), 'YY') || lpad(nextval('shipment_tracking_seq')::text, 7, '0')
$$;

create table shipments (
  id                uuid primary key default gen_random_uuid(),
  tracking_number   text not null unique default generate_tracking_number(),
  company_id        uuid not null references companies(id),
  origin_branch_id  uuid not null references branches(id),
  dest_branch_id    uuid not null references branches(id),
  trip_id           uuid references trips(id) on delete set null,
  sender_name       text not null,
  sender_phone      text not null,
  receiver_name     text not null,
  receiver_phone    text not null,
  goods_type        goods_type not null default 'normal',
  weight_kg         numeric(10,2) not null check (weight_kg > 0),
  price             numeric(12,2) not null check (price >= 0),
  cod_amount        numeric(12,2) not null default 0 check (cod_amount >= 0),
  status            shipment_status not null default 'received',
  delivery_otp_hash text not null,
  otp_attempts      smallint not null default 0,
  created_by        uuid references users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  delivered_at      timestamptz,
  check (origin_branch_id <> dest_branch_id)
);

create table shipment_status_log (
  id          bigserial primary key,
  shipment_id uuid not null references shipments(id) on delete cascade,
  status      shipment_status not null,
  note        text,
  changed_by  uuid references users(id),
  changed_at  timestamptz not null default now()
);

-- مسح التحميل والوصول (أساس بيان الحمولة وكشف النقص)
create table manifest_scans (
  id          bigserial primary key,
  trip_id     uuid not null references trips(id) on delete cascade,
  shipment_id uuid not null references shipments(id) on delete cascade,
  scan_type   scan_type not null,
  scanned_by  uuid references users(id),
  scanned_at  timestamptz not null default now(),
  unique (trip_id, shipment_id, scan_type)
);

create table collections (
  id           uuid primary key default gen_random_uuid(),
  shipment_id  uuid not null unique references shipments(id),
  branch_id    uuid not null references branches(id),
  amount       numeric(12,2) not null check (amount > 0),
  collected_by uuid references users(id),
  collected_at timestamptz not null default now(),
  settled      boolean not null default false,
  settled_at   timestamptz
);

-- =====================================================
-- 6) الفهارس
-- =====================================================
create index shipments_company_status_idx on shipments (company_id, status);
create index shipments_trip_idx           on shipments (trip_id);
create index shipments_origin_idx         on shipments (origin_branch_id);
create index shipments_dest_idx           on shipments (dest_branch_id);
create index shipments_created_idx        on shipments (created_at desc);
create index status_log_shipment_idx      on shipment_status_log (shipment_id, changed_at);
create index trips_search_idx             on trips (company_id, from_branch_id, to_branch_id, departure_at);
create index users_company_idx            on users (company_id, role);

-- =====================================================
-- 7) تحديث updated_at تلقائيًا
-- =====================================================
create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_users_updated     before update on users     for each row execute function set_updated_at();
create trigger trg_shipments_updated before update on shipments for each row execute function set_updated_at();

-- =====================================================
-- 8) Views للتقارير (security_invoker حتى لا تتجاوز حماية RLS)
-- =====================================================
create view v_trip_load with (security_invoker = true) as
select t.id as trip_id,
       t.capacity_kg,
       coalesce(sum(s.weight_kg), 0)                as loaded_kg,
       t.capacity_kg - coalesce(sum(s.weight_kg),0) as free_kg,
       count(s.id)                                  as shipments_count
  from trips t
  left join shipments s on s.trip_id = t.id and s.status <> 'returned'
 group by t.id;

-- شحنات حُمّلت ولم تُمسح عند الوصول = نقص محتمل
create view v_trip_missing with (security_invoker = true) as
select l.trip_id, l.shipment_id
  from manifest_scans l
 where l.scan_type = 'load'
   and not exists (
     select 1 from manifest_scans a
      where a.trip_id = l.trip_id and a.shipment_id = l.shipment_id and a.scan_type = 'arrive');

create view v_branch_daily_report with (security_invoker = true) as
select s.origin_branch_id as branch_id,
       (s.created_at at time zone 'Asia/Damascus')::date as day,
       count(*)        as shipments_count,
       sum(s.price)    as revenue,
       sum(s.cod_amount) as cod_total
  from shipments s
 group by 1, 2;

-- =====================================================
-- 9) الأمان: الخادم وحده يصل إلى البيانات
-- =====================================================
alter table governorates         enable row level security;
alter table route_prices         enable row level security;
alter table companies            enable row level security;
alter table branches             enable row level security;
alter table users                enable row level security;
alter table vehicles             enable row level security;
alter table trips                enable row level security;
alter table shipments            enable row level security;
alter table shipment_status_log  enable row level security;
alter table manifest_scans       enable row level security;
alter table collections          enable row level security;

-- لا سياسات = رفض كامل لواجهة Supabase الجاهزة (anon / authenticated)
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
```

<div dir="rtl" align="right">

### 8.1 بيانات تجريبية (قيم الأسعار للتجربة فقط)

</div>

```sql
with c as (
  insert into companies (name, status) values ('شركة عابر التجريبية', 'approved') returning id
)
insert into branches (company_id, governorate_code, name, address)
select c.id, v.code, v.name, v.addr
  from c,
       (values ('ALP','فرع حلب','حلب'),
               ('DAM','فرع دمشق','دمشق'),
               ('HMS','فرع حمص','حمص')) as v(code, name, addr);

insert into route_prices (from_governorate, to_governorate, base_price, price_per_kg, est_hours) values
  ('ALP','DAM',20000,500,6.0), ('DAM','ALP',20000,500,6.0),
  ('ALP','HMS',15000,400,3.5), ('HMS','ALP',15000,400,3.5),
  ('HMS','DAM',10000,300,2.5), ('DAM','HMS',10000,300,2.5);
```

<div dir="rtl" align="right">

بعدها أنشئ مدير النظام بسكربت `seed-admin`، ثم أنشئ مدير الشركة والموظفين من الواجهة (أو بسكربت مشابه).

### 8.2 استعلام «الجدولة الذكية» (اقتراح أنسب رحلة)

</div>

```sql
-- $1 الشركة  $2 فرع الانطلاق  $3 فرع الوجهة  $4 وزن الشحنة
select t.id, t.departure_at, v.free_kg
  from trips t
  join v_trip_load v on v.trip_id = t.id
 where t.company_id = $1
   and t.from_branch_id = $2
   and t.to_branch_id   = $3
   and t.status in ('scheduled','loading')
   and t.departure_at > now()
   and v.free_kg >= $4
 order by t.departure_at asc, v.free_kg asc   -- الأقرب موعدًا، ثم الأكثر امتلاءً
 limit 3;
```

<div dir="rtl" align="right">

---

## 9. نقاط الـ API

| الطريقة | المسار | الدور | الوظيفة |
|---|---|---|---|
| POST | `/api/auth/login` | عام | تسجيل الدخول |
| GET | `/api/public/track/:trackingNumber` | عام | التتبع العام |
| GET | `/api/public/estimate?from&to&weightKg&goodsType` | عام | تقدير السعر (نفس دالة التسعير) |
| GET | `/api/public/governorates` | عام | المحافظات المسعّرة فقط |
| POST | `/api/shipments` | موظف الفرع، مدير الشركة | إنشاء شحنة |
| GET | `/api/shipments` | موظف، سائق، مدير | قائمة الشحنات (بفلاتر) |
| GET | `/api/shipments/by-tracking/:n` | موظف، سائق، مدير | شحنة برقم البوليصة (بعد مسح QR) |
| PATCH | `/api/shipments/:id/status` | موظف، سائق، مدير | تغيير الحالة |
| POST | `/api/shipments/:id/deliver` | موظف، مدير | التسليم بـ OTP |
| GET/POST | `/api/trips` | مدير الشركة | إدارة الرحلات (للتنفيذ) |
| POST | `/api/trips/:id/assign` | موظف، مدير | إسناد شحنة لرحلة مع فحص السعة |
| POST | `/api/trips/:id/scan` | سائق، موظف | مسح تحميل/وصول |
| GET | `/api/trips/suggest` | موظف | الجدولة الذكية |
| — | ~~`/api/reports/shipments/:id/pdf`~~ | — | غير منفّذ: الطباعة من المتصفح بدل PDF الخادم |
| GET | `/api/reports/branch-daily` | موظف، مدير | تقرير الفرع اليومي |
| PATCH | `/api/admin/companies/:id/status` | مدير النظام | اعتماد الشركات |

**شكل الاستجابة:** نجاح `{ "data": ... }`، وخطأ `{ "code": "...", "message": "...", "details": ... }`.

---

## 10. الاختبار والنشر

### 10.1 اختبارات المنطق الحرج (Vitest)

`src/shared/domain/shipmentStatus.test.ts`

</div>

```ts
import { describe, expect, it } from 'vitest';
import { canTransition } from './shipmentStatus';

describe('canTransition', () => {
  it('يسمح بالمسار الطبيعي', () => {
    expect(canTransition('received', 'loaded')).toBe(true);
    expect(canTransition('loaded', 'in_transit')).toBe(true);
    expect(canTransition('arrived', 'delivered')).toBe(true);
  });

  it('يمنع القفز فوق المراحل', () => {
    expect(canTransition('received', 'delivered')).toBe(false);
    expect(canTransition('loaded', 'arrived')).toBe(false);
  });

  it('لا يسمح بالخروج من حالة نهائية', () => {
    expect(canTransition('delivered', 'received')).toBe(false);
  });
});
```

<div dir="rtl" align="right">

يُنصح أيضًا باختبار: التسعير، ورفض الصلاحيات (سائق يحاول إنشاء شحنة)، وقفل المحاولات بعد 5 رموز خاطئة.

### 10.2 النشر

1. **الخادم** على Render أو Railway: أمر البناء `npm run build` والتشغيل `npm start`، وأضف المتغيرات (`DATABASE_URL` و `JWT_SECRET` و `CORS_ORIGIN`...).
2. **الواجهة** على Vercel أو Netlify: متغير `VITE_API_URL=https://اسم-خادمك/api`.
3. اضبط `CORS_ORIGIN` على رابط الواجهة المنشورة.
4. تأكد أن الخادم يعمل على **HTTPS** (مطلوب لكاميرا مسح QR).

### 10.3 أخطاء شائعة وحلولها

| المشكلة | الحل |
|---|---|
| فشل الاتصال بالقاعدة | استخدم رابط **Session pooler** من Supabase وتأكد من ترميز الرموز الخاصة في كلمة المرور. وإن كنت تستعمل PostgreSQL محليًا فاضبط `DATABASE_SSL=false` |
| `Cannot find module '@/...'` | أضف `paths` في `tsconfig.app.json` (القسم 3.6) |
| `401` متكرر بعد تسجيل الدخول | تأكد أن `JWT_SECRET` ثابت في الخادم ولم يتغير بين التشغيلات |
| خطأ CORS | عدّل `CORS_ORIGIN` ليطابق رابط الواجهة تمامًا (بدون `/` في النهاية) |
| الكاميرا لا تعمل | يلزم HTTPS أو `localhost`، وامنح المتصفح إذن الكاميرا |
| القاعدة «متوقفة» قبل المناقشة | افتح لوحة Supabase وشغّل المشروع، وتجنّب أسبوعًا كاملًا من الخمول |
| أرقام تظهر كنص | استعلامات `numeric` تعود نصًا في `pg`، لذلك استعملنا `::float` في SQL |

---

### 10.4 ما الذي جرى التحقق منه فعلًا

- **سكربت SQL** نُفّذ كاملًا على PostgreSQL حقيقي بلا أخطاء (الجداول والقيود والـ Views والبيانات التجريبية).
- **كود الخادم** تُرجم بـ TypeScript بلا أخطاء، وشُغّل عليه سيناريو كامل على قاعدة حقيقية: تسجيل الدخول، الصلاحيات، إنشاء الشحنة والتسعير، الانتقالات الممنوعة، التسليم بـ OTP وقفل المحاولات، تسجيل COD، والتتبع العام (24 فحصًا نجحت جميعها).
- **كود الواجهة** (الكيانات والـ Repositories والمخازن والـ Hooks والمكونات) تُرجم بـ TypeScript بلا أخطاء.

**غير مشمول:** صفحات الواجهة الجاهزة (Login وNewShipment وغيرها) والـ Router يشير إليها فقط، وكذلك وحدات الرحلات والتقارير على الخادم، فهذه تُبنى على النمط نفسه في المراحل 5 و7 و8 من الخطة. ولم تُجرَّب الواجهة على متصفح فعلي ولا الاتصال بـ Supabase الحقيقي، فاختبرهما عندك بعد الإنشاء.

---

## 11. ترتيب البناء المقترح لتجنب التعثر

1. السكربت SQL ← الخادم (`/health` ثم `/auth/login`) ← اختبار بـ Postman.
2. وحدة الشحنات كاملة على الخادم قبل أي شاشة.
3. نظام التصميم والمكونات ← تسجيل الدخول ← شاشة إنشاء شحنة ← الملصق و QR.
4. الرحلات والمانيفست ← شاشة السائق.
5. التقارير ← لوحات المدراء ← صقل التصميم.

> **قاعدة ذهبية:** لا تنتقل لمرحلة جديدة قبل أن تعمل السابقة من الواجهة إلى القاعدة وتُختبر بالسيناريو الكامل.

</div>
