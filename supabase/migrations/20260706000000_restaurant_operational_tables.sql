do $$
begin
  create type kitchen_ticket_status as enum ('PENDING', 'PREPARING', 'READY', 'DELIVERED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type kitchen_ticket_item_status as enum ('PENDING', 'PREPARING', 'READY', 'DELIVERED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type cash_register_session_status as enum ('OPEN', 'CLOSED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type cash_movement_type as enum ('OPENING_BALANCE', 'SUPRIMENTO', 'SANGRIA', 'PAYMENT', 'REFUND');
exception when duplicate_object then null;
end $$;

-- 1. categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  name text not null,
  slug varchar(120) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_restaurant_slug_unique unique (restaurant_id, slug)
);
create index if not exists categories_restaurant_id_idx on public.categories(restaurant_id);

-- 2. products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  slug varchar(120) not null,
  sku varchar(80),
  unit_amount_in_cents integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_restaurant_slug_unique unique (restaurant_id, slug)
);
create index if not exists products_restaurant_id_idx on public.products(restaurant_id);
create index if not exists products_category_id_idx on public.products(category_id);

-- 3. dining_tables
create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  number varchar(40) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dining_tables_restaurant_branch_number_unique unique (restaurant_id, branch_id, number)
);
create index if not exists dining_tables_restaurant_id_idx on public.dining_tables(restaurant_id);

-- 4. table_sessions
create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  table_id uuid not null references public.dining_tables(id) on delete restrict,
  is_active boolean not null default true,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists table_sessions_restaurant_id_idx on public.table_sessions(restaurant_id);
create index if not exists table_sessions_table_active_idx on public.table_sessions(table_id, is_active);

-- Alter orders to add table_session_id
alter table public.orders add column if not exists table_session_id uuid references public.table_sessions(id) on delete restrict;

-- 5. kitchen_tickets
create table if not exists public.kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  status kitchen_ticket_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kitchen_tickets_restaurant_id_idx on public.kitchen_tickets(restaurant_id);
create index if not exists kitchen_tickets_order_id_idx on public.kitchen_tickets(order_id);

-- 6. kitchen_ticket_items
create table if not exists public.kitchen_ticket_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  ticket_id uuid not null references public.kitchen_tickets(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  quantity integer not null,
  status kitchen_ticket_item_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kitchen_ticket_items_restaurant_id_idx on public.kitchen_ticket_items(restaurant_id);
create index if not exists kitchen_ticket_items_ticket_id_idx on public.kitchen_ticket_items(ticket_id);

-- 7. cash_registers
create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_registers_restaurant_branch_name_unique unique (restaurant_id, branch_id, name)
);
create index if not exists cash_registers_restaurant_id_idx on public.cash_registers(restaurant_id);

-- 8. cash_register_sessions
create table if not exists public.cash_register_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  cash_register_id uuid not null references public.cash_registers(id) on delete restrict,
  opened_by_id uuid not null references public.users(id) on delete restrict,
  closed_by_id uuid references public.users(id) on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_balance_in_cents integer not null,
  closing_balance_in_cents integer,
  expected_closing_balance_in_cents integer,
  closing_difference_in_cents integer,
  status cash_register_session_status not null default 'OPEN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cash_register_sessions_restaurant_id_idx on public.cash_register_sessions(restaurant_id);
create index if not exists cash_register_sessions_register_status_idx on public.cash_register_sessions(cash_register_id, status);

-- 9. cash_movements
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  session_id uuid not null references public.cash_register_sessions(id) on delete restrict,
  type cash_movement_type not null,
  amount_in_cents integer not null,
  notes text,
  performed_by_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cash_movements_restaurant_id_idx on public.cash_movements(restaurant_id);
create index if not exists cash_movements_session_id_idx on public.cash_movements(session_id);

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.dining_tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.kitchen_tickets enable row level security;
alter table public.kitchen_ticket_items enable row level security;
alter table public.cash_registers enable row level security;
alter table public.cash_register_sessions enable row level security;
alter table public.cash_movements enable row level security;

drop policy if exists categories_tenant_isolation on public.categories;
create policy categories_tenant_isolation on public.categories
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists products_tenant_isolation on public.products;
create policy products_tenant_isolation on public.products
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists dining_tables_tenant_isolation on public.dining_tables;
create policy dining_tables_tenant_isolation on public.dining_tables
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists table_sessions_tenant_isolation on public.table_sessions;
create policy table_sessions_tenant_isolation on public.table_sessions
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists kitchen_tickets_tenant_isolation on public.kitchen_tickets;
create policy kitchen_tickets_tenant_isolation on public.kitchen_tickets
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists kitchen_ticket_items_tenant_isolation on public.kitchen_ticket_items;
create policy kitchen_ticket_items_tenant_isolation on public.kitchen_ticket_items
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists cash_registers_tenant_isolation on public.cash_registers;
create policy cash_registers_tenant_isolation on public.cash_registers
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists cash_register_sessions_tenant_isolation on public.cash_register_sessions;
create policy cash_register_sessions_tenant_isolation on public.cash_register_sessions
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());

drop policy if exists cash_movements_tenant_isolation on public.cash_movements;
create policy cash_movements_tenant_isolation on public.cash_movements
  using (restaurant_id = app.current_restaurant_id())
  with check (restaurant_id = app.current_restaurant_id());
