-- =====================================================
-- ملاحظة: gen_random_uuid() مدمجة في PostgreSQL 13+ ولا تحتاج إضافات
-- =====================================================

-- =====================================================
-- 1) الأنواع المعدّدة
-- =====================================================
create type user_role as enum
  ('system_admin','company_admin','branch_staff','line_driver','customer');
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
