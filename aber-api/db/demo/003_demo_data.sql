-- Demo data for the defence. Run it yourself in the Supabase SQL editor, AFTER 001 and 002.
-- Do NOT commit a real password. Before running, replace the text
--   CHANGE_ME_DEMO_PASSWORD
-- (one place, below) with a demo password you choose, then run. Do not save that edit to Git.
-- Safe to run once: it stops if the demo users already exist.
-- Demo delivery code (OTP) for every demo shipment that is not delivered yet: 123456.

do $$
declare
  demo_password constant text := 'CHANGE_ME_DEMO_PASSWORD';
  pw_hash   text;
  co        uuid;
  b_alp     uuid; b_dam uuid; b_hms uuid;
  u_mgr     uuid; u_staff uuid; u_driver uuid;
  v1        uuid; v2 uuid;
  t_transit uuid; t_sched uuid; t_done uuid;
  s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid; s6 uuid;
  otp_hash  constant text := encode(sha256('123456'::bytea), 'hex');
begin
  if demo_password = 'CHANGE_ME_DEMO_PASSWORD' then
    raise exception 'Replace CHANGE_ME_DEMO_PASSWORD with your demo password first';
  end if;
  if exists (select 1 from users where lower(email) = 'driver@aber.local') then
    raise exception 'Demo data already exists (driver@aber.local found). Nothing was changed.';
  end if;

  select id into co from companies where name = 'شركة عابر التجريبية';
  if co is null then raise exception 'Run 002_seed_demo.sql first'; end if;
  select id into b_alp from branches where company_id = co and governorate_code = 'ALP' limit 1;
  select id into b_dam from branches where company_id = co and governorate_code = 'DAM' limit 1;
  select id into b_hms from branches where company_id = co and governorate_code = 'HMS' limit 1;

  -- bcrypt hash made by the database itself (pgcrypto lives in the "extensions" schema on Supabase).
  pw_hash := extensions.crypt(demo_password, extensions.gen_salt('bf', 12));

  -- Users: one per role used by the screens. manager@aber.local is kept if it already exists.
  insert into users (company_id, branch_id, full_name, email, password_hash, role)
  values (co, null, 'مدير الشركة', 'manager@aber.local', pw_hash, 'company_admin')
  on conflict do nothing;
  select id into u_mgr from users where lower(email) = 'manager@aber.local';

  insert into users (company_id, branch_id, full_name, email, phone, password_hash, role)
  values (co, b_alp, 'موظف فرع حلب', 'staff@aber.local', '0911000001', pw_hash, 'branch_staff')
  returning id into u_staff;
  insert into users (company_id, branch_id, full_name, email, phone, password_hash, role)
  values (co, null, 'سائق الخط', 'driver@aber.local', '0911000002', pw_hash, 'line_driver')
  returning id into u_driver;

  insert into vehicles (company_id, plate_number, capacity_kg) values (co, '123456', 1500) returning id into v1;
  insert into vehicles (company_id, plate_number, capacity_kg) values (co, '654321', 3000) returning id into v2;

  -- Trips
  insert into trips (company_id, from_branch_id, to_branch_id, driver_id, vehicle_id, departure_at, estimated_arrival_at, capacity_kg, status)
  values (co, b_alp, b_dam, u_driver, v1, now() - interval '2 hours', now() + interval '4 hours', 1500, 'in_transit')
  returning id into t_transit;
  insert into trips (company_id, from_branch_id, to_branch_id, driver_id, vehicle_id, departure_at, estimated_arrival_at, capacity_kg, status)
  values (co, b_dam, b_hms, u_driver, v2, now() + interval '1 day', now() + interval '1 day 3 hours', 3000, 'scheduled')
  returning id into t_sched;
  insert into trips (company_id, from_branch_id, to_branch_id, driver_id, vehicle_id, departure_at, estimated_arrival_at, capacity_kg, status)
  values (co, b_hms, b_alp, u_driver, v1, now() - interval '2 days', now() - interval '2 days' + interval '4 hours', 1500, 'closed')
  returning id into t_done;

  -- Shipments (prices follow the route_prices in 002: base + per_kg * weight)
  -- s1, s2: on the trip in transit (ALP -> DAM)
  insert into shipments (company_id, origin_branch_id, dest_branch_id, trip_id, sender_name, sender_phone, receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status, delivery_otp_hash, created_by)
  values (co, b_alp, b_dam, t_transit, 'عميل تجريبي 1', '0933000001', 'مستلم تجريبي 1', '0944000001', 'normal', 20, 30000, 0, 'in_transit', otp_hash, u_staff)
  returning id into s1;
  insert into shipments (company_id, origin_branch_id, dest_branch_id, trip_id, sender_name, sender_phone, receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status, delivery_otp_hash, created_by)
  values (co, b_alp, b_dam, t_transit, 'عميل تجريبي 2', '0933000002', 'مستلم تجريبي 2', '0944000002', 'fragile', 10, 31250, 50000, 'in_transit', otp_hash, u_staff)
  returning id into s2;
  -- s3: just received at Aleppo, no trip yet
  insert into shipments (company_id, origin_branch_id, dest_branch_id, sender_name, sender_phone, receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status, delivery_otp_hash, created_by)
  values (co, b_alp, b_hms, 'عميل تجريبي 3', '0933000003', 'مستلم تجريبي 3', '0944000003', 'normal', 5, 17000, 0, 'received', otp_hash, u_staff)
  returning id into s3;
  -- s4: on the scheduled trip, loaded
  insert into shipments (company_id, origin_branch_id, dest_branch_id, trip_id, sender_name, sender_phone, receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status, delivery_otp_hash, created_by)
  values (co, b_dam, b_hms, t_sched, 'عميل تجريبي 4', '0933000004', 'مستلم تجريبي 4', '0944000004', 'refrigerated', 40, 33000, 0, 'loaded', otp_hash, u_mgr)
  returning id into s4;
  -- s5: arrived at destination, waiting for the OTP delivery
  insert into shipments (company_id, origin_branch_id, dest_branch_id, trip_id, sender_name, sender_phone, receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status, delivery_otp_hash, created_by)
  values (co, b_hms, b_alp, t_done, 'عميل تجريبي 5', '0933000005', 'مستلم تجريبي 5', '0944000005', 'normal', 15, 21000, 25000, 'arrived', otp_hash, u_mgr)
  returning id into s5;
  -- s6: already delivered with cash on delivery collected
  insert into shipments (company_id, origin_branch_id, dest_branch_id, trip_id, sender_name, sender_phone, receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status, delivery_otp_hash, created_by, delivered_at)
  values (co, b_hms, b_alp, t_done, 'عميل تجريبي 6', '0933000006', 'مستلم تجريبي 6', '0944000006', 'normal', 8, 18200, 30000, 'delivered', otp_hash, u_mgr, now() - interval '1 day')
  returning id into s6;

  -- Status history
  insert into shipment_status_log (shipment_id, status, note, changed_by, changed_at) values
    (s1, 'received', null, u_staff, now() - interval '5 hours'),
    (s1, 'loaded', null, u_driver, now() - interval '3 hours'),
    (s1, 'in_transit', null, u_driver, now() - interval '2 hours'),
    (s2, 'received', null, u_staff, now() - interval '5 hours'),
    (s2, 'loaded', null, u_driver, now() - interval '3 hours'),
    (s2, 'in_transit', null, u_driver, now() - interval '2 hours'),
    (s3, 'received', null, u_staff, now() - interval '1 hour'),
    (s4, 'received', null, u_mgr, now() - interval '6 hours'),
    (s4, 'loaded', null, u_mgr, now() - interval '30 minutes'),
    (s5, 'received', null, u_mgr, now() - interval '3 days'),
    (s5, 'loaded', null, u_driver, now() - interval '2 days 3 hours'),
    (s5, 'in_transit', null, u_driver, now() - interval '2 days'),
    (s5, 'arrived', null, u_driver, now() - interval '2 days' + interval '4 hours'),
    (s6, 'received', null, u_mgr, now() - interval '3 days'),
    (s6, 'loaded', null, u_driver, now() - interval '2 days 3 hours'),
    (s6, 'in_transit', null, u_driver, now() - interval '2 days'),
    (s6, 'arrived', null, u_driver, now() - interval '2 days' + interval '4 hours'),
    (s6, 'delivered', null, u_mgr, now() - interval '1 day');

  -- Manifest scans: loaded on the trips that have left
  insert into manifest_scans (trip_id, shipment_id, scan_type, scanned_by, scanned_at) values
    (t_transit, s1, 'load', u_driver, now() - interval '3 hours'),
    (t_transit, s2, 'load', u_driver, now() - interval '3 hours'),
    (t_sched, s4, 'load', u_mgr, now() - interval '30 minutes'),
    (t_done, s5, 'load', u_driver, now() - interval '2 days 3 hours'),
    (t_done, s6, 'load', u_driver, now() - interval '2 days 3 hours'),
    (t_done, s5, 'arrive', u_driver, now() - interval '2 days' + interval '4 hours'),
    (t_done, s6, 'arrive', u_driver, now() - interval '2 days' + interval '4 hours');

  -- Cash collected for the delivered shipment
  insert into collections (shipment_id, branch_id, amount, collected_by, collected_at)
  values (s6, b_alp, 30000, u_mgr, now() - interval '1 day');

  raise notice 'Demo data created. Logins: manager@aber.local, staff@aber.local, driver@aber.local (your demo password).';
end $$;
