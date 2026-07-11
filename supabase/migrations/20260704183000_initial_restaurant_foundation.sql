create extension if not exists "pgcrypto";

create schema if not exists app;

create or replace function app.current_restaurant_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.restaurant_id', true), '')::uuid
$$;

do $$
begin
  create type user_status as enum ('ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type order_origin as enum ('TABLE', 'COUNTER', 'PICKUP', 'DELIVERY');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type order_status as enum ('OPEN', 'SENT_TO_KITCHEN', 'IN_PREPARATION', 'READY', 'DELIVERED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type payment_provider as enum ('CASH', 'MANUAL', 'PAGBANK');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type payment_method as enum ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'VOUCHER');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type payment_status as enum ('DRAFT', 'PENDING', 'PROCESSING', 'APPROVED', 'SETTLED', 'DECLINED', 'CANCELLED', 'EXPIRED', 'INDETERMINATE', 'REFUND_PENDING', 'REFUNDED');
exception when duplicate_object then null;
end $$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug varchar(120) not null,
  legal_name text,
  tax_id varchar(32),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_slug_unique unique (slug)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  name text not null,
  slug varchar(120) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_restaurant_slug_unique unique (restaurant_id, slug)
);

create index if not exists branches_restaurant_id_idx on public.branches(restaurant_id);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete set null,
  email varchar(255) not null,
  name text not null,
  password_hash text,
  pin_hash text,
  status user_status not null default 'INVITED',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_restaurant_email_unique unique (restaurant_id, email)
);

create index if not exists users_restaurant_id_idx on public.users(restaurant_id);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  name varchar(80) not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_restaurant_name_unique unique (restaurant_id, name)
);

create index if not exists roles_restaurant_id_idx on public.roles(restaurant_id);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code varchar(120) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissions_code_unique unique (code)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_permissions_unique unique (role_id, permission_id)
);

create index if not exists role_permissions_restaurant_id_idx on public.role_permissions(restaurant_id);

create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_role_assignments_unique unique (user_id, role_id)
);

create index if not exists user_role_assignments_restaurant_id_idx on public.user_role_assignments(restaurant_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  order_number varchar(40) not null,
  origin order_origin not null,
  status order_status not null default 'OPEN',
  subtotal_amount_in_cents integer not null default 0 check (subtotal_amount_in_cents >= 0),
  discount_amount_in_cents integer not null default 0 check (discount_amount_in_cents >= 0),
  service_fee_amount_in_cents integer not null default 0 check (service_fee_amount_in_cents >= 0),
  total_amount_in_cents integer not null default 0 check (total_amount_in_cents >= 0),
  currency varchar(3) not null default 'BRL',
  created_by uuid references public.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_restaurant_order_number_unique unique (restaurant_id, order_number)
);

create index if not exists orders_restaurant_id_idx on public.orders(restaurant_id);
create index if not exists orders_branch_status_idx on public.orders(branch_id, status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_amount_in_cents integer not null check (unit_amount_in_cents >= 0),
  total_amount_in_cents integer not null check (total_amount_in_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_items_restaurant_id_idx on public.order_items(restaurant_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  provider payment_provider not null,
  method payment_method not null,
  status payment_status not null default 'DRAFT',
  amount_in_cents integer not null check (amount_in_cents > 0),
  currency varchar(3) not null default 'BRL',
  idempotency_key varchar(180) not null,
  correlation_id varchar(180) not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_intents_restaurant_idempotency_unique unique (restaurant_id, idempotency_key)
);

create index if not exists payment_intents_restaurant_id_idx on public.payment_intents(restaurant_id);
create index if not exists payment_intents_order_id_idx on public.payment_intents(order_id);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  payment_intent_id uuid not null references public.payment_intents(id) on delete restrict,
  provider payment_provider not null,
  provider_transaction_id varchar(180),
  status payment_status not null,
  amount_in_cents integer not null check (amount_in_cents > 0),
  raw_payload jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_transactions_provider_reference_unique
  on public.payment_transactions(provider, provider_transaction_id)
  where provider_transaction_id is not null;
create index if not exists payment_transactions_restaurant_id_idx on public.payment_transactions(restaurant_id);
create index if not exists payment_transactions_intent_id_idx on public.payment_transactions(payment_intent_id);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  scope varchar(120) not null,
  key varchar(180) not null,
  request_hash text not null,
  response_body jsonb,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint idempotency_keys_scope_key_unique unique (restaurant_id, scope, key)
);

create index if not exists idempotency_keys_restaurant_id_idx on public.idempotency_keys(restaurant_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  actor_user_id uuid references public.users(id) on delete set null,
  action varchar(160) not null,
  resource_type varchar(120) not null,
  resource_id uuid,
  result varchar(40) not null,
  request_id varchar(120),
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_restaurant_id_idx on public.audit_logs(restaurant_id);
create index if not exists audit_logs_resource_idx on public.audit_logs(resource_type, resource_id);

alter table public.restaurants enable row level security;
alter table public.branches enable row level security;
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_intents enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists restaurants_tenant_isolation on public.restaurants;
create policy restaurants_tenant_isolation on public.restaurants
  using (id = app.current_restaurant_id())
  with check (id = app.current_restaurant_id());

drop policy if exists branches_tenant_isolation on public.branches;
create policy branches_tenant_isolation on public.branches
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists users_tenant_isolation on public.users;
create policy users_tenant_isolation on public.users
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists roles_tenant_isolation on public.roles;
create policy roles_tenant_isolation on public.roles
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists role_permissions_tenant_isolation on public.role_permissions;
create policy role_permissions_tenant_isolation on public.role_permissions
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists user_role_assignments_tenant_isolation on public.user_role_assignments;
create policy user_role_assignments_tenant_isolation on public.user_role_assignments
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists orders_tenant_isolation on public.orders;
create policy orders_tenant_isolation on public.orders
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists order_items_tenant_isolation on public.order_items;
create policy order_items_tenant_isolation on public.order_items
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists payment_intents_tenant_isolation on public.payment_intents;
create policy payment_intents_tenant_isolation on public.payment_intents
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists payment_transactions_tenant_isolation on public.payment_transactions;
create policy payment_transactions_tenant_isolation on public.payment_transactions
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists idempotency_keys_tenant_isolation on public.idempotency_keys;
create policy idempotency_keys_tenant_isolation on public.idempotency_keys
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists audit_logs_tenant_isolation on public.audit_logs;
create policy audit_logs_tenant_isolation on public.audit_logs
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

