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
