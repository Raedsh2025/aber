# دليل نشر مشروع عابر

ثلاث قطع: قاعدة البيانات (Supabase)، الخادم (Render أو Railway)، الواجهة (Vercel أو Netlify).
الترتيب: القاعدة ← الخادم ← الواجهة ← ضبط CORS.

> لا تضع أي مفتاح أو كلمة مرور في Git. كل القيم السرية تُكتب في لوحة المنصة فقط.
> واجهات هذه المنصات تتغير؛ أسماء الأزرار أدناه تقريبية. لم أجرّب النشر فعليًا.

## 1) Supabase (قاعدة البيانات)

1. أنشئ مشروعًا واحفظ كلمة مرور قاعدة البيانات عندك.
2. من SQL Editor شغّل بالترتيب (يدويًا، مرة واحدة):
   - `aber-api/db/migrations/001_init.sql`
   - `aber-api/db/migrations/002_seed_demo.sql`
3. أنشئ حساب مدير النظام من جهازك (الكلمة تُعطى بمتغير بيئة):

       cd aber-api
       $env:ADMIN_PASSWORD = "كلمة-المرور-التي-تختارها"
       npm run seed:admin -- admin@aber.local

   (يلزم `DATABASE_URL` في `aber-api/.env` المحلي.)
4. بيانات العرض (اختياري): افتح `aber-api/db/demo/003_demo_data.sql`، بدّل `CHANGE_ME_DEMO_PASSWORD` بكلمة تجريبية تختارها، شغّله في SQL Editor، ولا تحفظ التعديل في Git.
5. رابط الاتصال: Project Settings ← Database ← Connection string، واختر **Session pooler**. شكله:
   `postgresql://postgres.<project-ref>:<كلمة-المرور-بترميز-URL>@<pooler-host>:5432/postgres`
   الرموز الخاصة في كلمة المرور تُرمَّز (URL-encode).
6. المشروع المجاني يتوقف عند الخمول. افتح لوحة Supabase قبل العرض بيوم وتأكد أنه فعّال.

## 2) الخادم (Render أو Railway)

أنشئ Web Service من مستودع GitHub، وعيّن:

| الإعداد | القيمة |
|---|---|
| Root directory | `aber-api` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/health` |

متغيرات البيئة (تُكتب في اللوحة):

| المتغير | القيمة |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | رابط Session pooler من الخطوة السابقة |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | نص عشوائي طويل (32 حرفًا فأكثر). ثبّته ولا تغيّره وإلا بطلت الجلسات |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | رابط الواجهة بعد نشرها (يمكن عدة روابط مفصولة بفاصلة) |

لا تضبط `PORT` إن كانت المنصة تحدده تلقائيًا. بعد النشر جرّب `https://<رابط-الخادم>/health` فيجب أن يرجع `{"data":{"status":"ok"}}`.
الخطة المجانية قد تنام الخدمة بعد خمول: افتح `/health` قبل العرض بدقائق.

## 3) الواجهة (Vercel أو Netlify)

| الإعداد | القيمة |
|---|---|
| Root directory | `aber-web` |
| Build command | `npm run build` |
| Output directory | `dist` |
| متغير البيئة `VITE_API_URL` | `https://<رابط-الخادم>/api` (بما فيه `/api`) |

الواجهة تطبيق صفحة واحدة، فيلزم إعادة توجيه كل المسارات إلى `index.html`:
- Vercel: ملف `aber-web/vercel.json` فيه `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`.
- Netlify: ملف `aber-web/public/_redirects` فيه `/* /index.html 200`.
(الملفان غير مضافين بعد؛ أضف الذي يناسب منصتك.)

متغير `VITE_` يُدمج وقت البناء، فبعد تغييره أعد البناء.

## 4) الربط والتجربة

1. ارجع إلى الخادم وضع رابط الواجهة في `CORS_ORIGIN`، ثم أعد التشغيل.
2. افتح الواجهة وسجّل الدخول بحساب لكل دور.
3. إن ظهر خطأ شبكة في المتصفح: راجع `CORS_ORIGIN` و`VITE_API_URL` أولًا.
