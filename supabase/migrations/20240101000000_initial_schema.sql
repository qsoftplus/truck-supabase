-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Trucks Table
create table public.trucks (
  id uuid default uuid_generate_v4() primary key,
  truck_no text not null unique,
  fc_expiry date,
  insurance_expiry date,
  np_expiry date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drivers Table (with alt_phone and home_phone)
create table public.drivers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  alt_phone text,
  home_phone text,
  license_no text,
  aadhar_no text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips Table
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  truck_id uuid references public.trucks(id) not null,
  driver1_id uuid references public.drivers(id) not null,
  driver2_id uuid references public.drivers(id),
  start_date date not null,
  end_date date,
  start_km numeric,
  end_km numeric,
  diesel_amount numeric default 0,
  diesel_liters numeric default 0,
  status text default 'ongoing',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Loads (Singles) Table
create table public.loads (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  loading_date date,
  from_location text,
  to_location text,
  transporter text,
  freight_amount numeric default 0,
  note text,
  pay_term text default 'To Pay',
  advance_amount numeric default 0,
  balance_amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courier Details (for Loads)
create table public.courier_details (
  id uuid default uuid_generate_v4() primary key,
  load_id uuid references public.loads(id) on delete cascade not null unique,
  received_date date,
  vendor text,
  delivery_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expenses Table
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  category text not null,
  title text,
  amount numeric default 0,
  liters numeric,
  percentage numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tyres Table
create table public.tyres (
  id uuid default uuid_generate_v4() primary key,
  truck_id uuid references public.trucks(id) not null,
  make text,
  price numeric default 0,
  fitment_date date,
  fitting_km numeric,
  removal_date date,
  removal_km numeric,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.trucks enable row level security;
alter table public.drivers enable row level security;
alter table public.trips enable row level security;
alter table public.loads enable row level security;
alter table public.courier_details enable row level security;
alter table public.expenses enable row level security;
alter table public.tyres enable row level security;

-- Open policies for development (WARNING: Secure this for production)
create policy "Enable all access for all users" on public.trucks for all using (true) with check (true);
create policy "Enable all access for all users" on public.drivers for all using (true) with check (true);
create policy "Enable all access for all users" on public.trips for all using (true) with check (true);
create policy "Enable all access for all users" on public.loads for all using (true) with check (true);
create policy "Enable all access for all users" on public.courier_details for all using (true) with check (true);
create policy "Enable all access for all users" on public.expenses for all using (true) with check (true);
create policy "Enable all access for all users" on public.tyres for all using (true) with check (true);
