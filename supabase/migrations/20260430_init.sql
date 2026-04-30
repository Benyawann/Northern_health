-- สร้าง table สำหรับ Northern Health
create table if not exists health_data (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  detail text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- เปิด Realtime
alter publication supabase_realtime add table health_data;

-- Row Level Security
alter table health_data enable row level security;

create policy "allow all" on health_data
  for all using (true);