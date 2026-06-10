create table if not exists public.wedding_guests (
  id text primary key,
  name text not null,
  seats integer not null default 1 check (seats > 0),
  guest_group text not null default 'Friends'
);

create table if not exists public.wedding_checkins (
  guest_id text primary key,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid not null default auth.uid()
);

create table if not exists public.wedding_rsvps (
  guest_name text primary key,
  status text not null check (status in ('Attending', 'Not attending', 'Pending')),
  guests_with_you integer not null default 0 check (guests_with_you >= 0),
  phone text not null default '',
  notes text not null default '',
  received_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid()
);

alter table public.wedding_checkins enable row level security;
alter table public.wedding_rsvps enable row level security;
alter table public.wedding_guests enable row level security;

drop policy if exists "Wedding admin reads guests" on public.wedding_guests;
create policy "Wedding admin reads guests"
on public.wedding_guests
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'rashamo224@gmail.com');

drop policy if exists "Wedding admin manages checkins" on public.wedding_checkins;
create policy "Wedding admin manages checkins"
on public.wedding_checkins
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'rashamo224@gmail.com')
with check ((auth.jwt() ->> 'email') = 'rashamo224@gmail.com');

drop policy if exists "Wedding admin manages rsvps" on public.wedding_rsvps;
create policy "Wedding admin manages rsvps"
on public.wedding_rsvps
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'rashamo224@gmail.com')
with check ((auth.jwt() ->> 'email') = 'rashamo224@gmail.com');

revoke all on table public.wedding_checkins from anon;
revoke all on table public.wedding_rsvps from anon;
revoke all on table public.wedding_guests from anon;
grant select on table public.wedding_guests to authenticated;
grant select, insert, update, delete on table public.wedding_checkins to authenticated;
grant select, insert, update, delete on table public.wedding_rsvps to authenticated;

insert into public.wedding_guests (id, name, seats, guest_group) values
  ('IR-F001-7K9P2X', 'Ashwaq Fakher Eldien', 1, 'Friends'),
  ('IR-F002-Q4M8ZA', 'Suha Ayoub', 1, 'Friends'),
  ('IR-F003-L6T1NC', 'Dalia Harkous', 1, 'Friends'),
  ('IR-F004-X8R5VD', 'Habiba Harkous', 1, 'Friends'),
  ('IR-F005-M2K7YB', 'Leen Badran', 1, 'Friends'),
  ('IR-F006-C9P4WH', 'Chloe Badran', 1, 'Friends'),
  ('IR-F007-Z3N8RA', 'Maha Awada', 1, 'Friends'),
  ('IR-F008-H5V2QE', 'Lina Alshami', 2, 'Friends'),
  ('IR-F011-P2W8SN', 'Dalia Romeye', 1, 'Friends'),
  ('IR-F012-Y6C4TR', 'Layla Ayoub', 1, 'Friends'),
  ('IR-F013-N8L5QJ', 'Anwar Al Sabah', 1, 'Friends'),
  ('IR-F014-R4Z9PV', 'Yasmeen Al Naqi', 1, 'Friends'),
  ('IR-F015-W7M2XA', 'Sahar Al Thatban', 1, 'Friends'),
  ('IR-F017-A6V9TE', 'Abeer Al Jarallah', 1, 'Friends'),
  ('IR-F018-D2X7QM', 'Nehad Al Jarallah', 1, 'Friends'),
  ('IR-F019-G9K4YL', 'Awatif Al Jarallah', 1, 'Friends'),
  ('IR-F020-V5R8NC', 'Ibtesam Al Jarallah', 1, 'Friends'),
  ('IR-F021-S3L6WP', 'Hala Sham', 2, 'Friends'),
  ('IR-F022-E7M4KD', 'Ghada Harkous', 1, 'Friends'),
  ('IR-F023-U9Q2XB', 'Huda Abdo', 1, 'Friends'),
  ('IR-F025-C8N6RM', 'Eman AbuSalah', 1, 'Friends'),
  ('IR-F026-R7A4QK', 'Shereen Abdullah', 1, 'Friends'),
  ('IR-F027-M5X9TD', 'Sahar Diab', 1, 'Friends')
on conflict (id) do update set
  name = excluded.name,
  seats = excluded.seats,
  guest_group = excluded.guest_group;
