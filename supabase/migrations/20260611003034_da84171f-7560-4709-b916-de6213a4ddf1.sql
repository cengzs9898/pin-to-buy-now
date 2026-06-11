
create type public.app_role as enum ('user', 'seller', 'admin');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

create policy "Users can read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create policy "Service role can manage roles" on public.user_roles
  for all to service_role using (true) with check (true);

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "Users can update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Service role can manage profiles" on public.profiles
  for all to service_role using (true) with check (true);

create table public.seller_profiles (
    id uuid primary key references public.profiles(id) on delete cascade,
    business_name text not null,
    business_type text,
    tax_number text,
    address text,
    city text,
    district text,
    latitude double precision,
    longitude double precision,
    is_verified boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

GRANT SELECT, INSERT, UPDATE ON public.seller_profiles TO authenticated;
GRANT ALL ON public.seller_profiles TO service_role;

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

create policy "Sellers can read own profile" on public.seller_profiles
  for select to authenticated using (id = auth.uid());

create policy "Sellers can update own profile" on public.seller_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Service role can manage seller profiles" on public.seller_profiles
  for all to service_role using (true) with check (true);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter publication supabase_realtime add table public.profiles;
