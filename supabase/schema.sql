-- Enable extensions
create extension if not exists pgcrypto;

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  subscription_status text not null default 'inactive' check (subscription_status in ('active','inactive','expired')),
  subscription_expires_at timestamptz
);

-- Question Packages
create table if not exists public.question_packages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  description text,
  duration_minutes integer not null default 110,
  price integer,
  is_active boolean not null default true,
  requires_payment boolean not null default true,
  total_questions integer not null default 0,
  threshold_twk integer not null default 0,
  threshold_tiu integer not null default 0,
  threshold_tkp integer not null default 0,
  threshold_non_tag integer not null default 0
);

-- Questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  package_id uuid not null references public.question_packages(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_e text not null,
  points_a integer not null default 0,
  points_b integer not null default 0,
  points_c integer not null default 0,
  points_d integer not null default 0,
  points_e integer not null default 0,
  correct_answer text not null check (correct_answer in ('A','B','C','D','E')),
  explanation text,
  question_number integer,
  main_category text check (main_category in ('TWK','TIU','TKP','Non Tag')),
  sub_category text
);
create index if not exists questions_package_id_idx on public.questions(package_id);
create index if not exists questions_question_number_idx on public.questions(question_number);

-- Tryout Sessions
create table if not exists public.tryout_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.users(id) on delete cascade,
  package_id uuid not null references public.question_packages(id) on delete cascade,
  start_time timestamptz,
  end_time timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','completed','expired')),
  total_score integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  unanswered integer not null default 0,
  passed_twk boolean not null default false,
  passed_tiu boolean not null default false,
  passed_tkp boolean not null default false,
  passed_non_tag boolean not null default false,
  passed_overall boolean not null default false
);
create index if not exists tryout_sessions_user_id_idx on public.tryout_sessions(user_id);
create index if not exists tryout_sessions_package_id_idx on public.tryout_sessions(package_id);

-- User Answers
create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null references public.tryout_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  user_answer text check (user_answer in ('A','B','C','D','E')),
  awarded_points integer not null default 0,
  is_correct boolean,
  time_spent_seconds integer
);
create index if not exists user_answers_session_id_idx on public.user_answers(session_id);
create index if not exists user_answers_question_id_idx on public.user_answers(question_id);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.users(id) on delete cascade,
  package_id uuid not null references public.question_packages(id) on delete cascade,
  amount integer not null,
  payment_method text not null default 'QRIS',
  status text not null default 'pending' check (status in ('pending','completed','failed','expired')),
  qris_code text,
  transaction_id text unique,
  expires_at timestamptz
);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_package_id_idx on public.payments(package_id);

-- Payment Settings
create table if not exists public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  qris_merchant_id text,
  qris_merchant_name text,
  payment_timeout_minutes integer not null default 30,
  is_active boolean not null default true
);

-- Question Tag Stats
create table if not exists public.question_tag_stats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null references public.tryout_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  package_id uuid not null references public.question_packages(id) on delete cascade,
  main_category text,
  sub_category text,
  total_questions integer,
  correct_answers integer,
  wrong_answers integer,
  unanswered integer,
  total_time_seconds integer,
  average_time_seconds integer,
  total_points integer not null default 0
);
create index if not exists qts_session_id_idx on public.question_tag_stats(session_id);
create index if not exists qts_user_id_idx on public.question_tag_stats(user_id);
create index if not exists qts_package_id_idx on public.question_tag_stats(package_id);

-- Enable Row Level Security (RLS) with permissive demo policies
alter table public.users enable row level security;
alter table public.question_packages enable row level security;
alter table public.questions enable row level security;
alter table public.tryout_sessions enable row level security;
alter table public.user_answers enable row level security;
alter table public.payments enable row level security;
alter table public.payment_settings enable row level security;
alter table public.question_tag_stats enable row level security;

-- Demo policies: allow anon read/write for all tables (adjust for production)
create policy "anon_all_select_users" on public.users for select using (true);
create policy "anon_all_insert_users" on public.users for insert with check (true);
create policy "anon_all_update_users" on public.users for update using (true) with check (true);
create policy "anon_all_delete_users" on public.users for delete using (true);

create policy "anon_all_select_question_packages" on public.question_packages for select using (true);
create policy "anon_all_insert_question_packages" on public.question_packages for insert with check (true);
create policy "anon_all_update_question_packages" on public.question_packages for update using (true) with check (true);
create policy "anon_all_delete_question_packages" on public.question_packages for delete using (true);

create policy "anon_all_select_questions" on public.questions for select using (true);
create policy "anon_all_insert_questions" on public.questions for insert with check (true);
create policy "anon_all_update_questions" on public.questions for update using (true) with check (true);
create policy "anon_all_delete_questions" on public.questions for delete using (true);

create policy "anon_all_select_tryout_sessions" on public.tryout_sessions for select using (true);
create policy "anon_all_insert_tryout_sessions" on public.tryout_sessions for insert with check (true);
create policy "anon_all_update_tryout_sessions" on public.tryout_sessions for update using (true) with check (true);
create policy "anon_all_delete_tryout_sessions" on public.tryout_sessions for delete using (true);

create policy "anon_all_select_user_answers" on public.user_answers for select using (true);
create policy "anon_all_insert_user_answers" on public.user_answers for insert with check (true);
create policy "anon_all_update_user_answers" on public.user_answers for update using (true) with check (true);
create policy "anon_all_delete_user_answers" on public.user_answers for delete using (true);

create policy "anon_all_select_payments" on public.payments for select using (true);
create policy "anon_all_insert_payments" on public.payments for insert with check (true);
create policy "anon_all_update_payments" on public.payments for update using (true) with check (true);
create policy "anon_all_delete_payments" on public.payments for delete using (true);

create policy "anon_all_select_payment_settings" on public.payment_settings for select using (true);
create policy "anon_all_insert_payment_settings" on public.payment_settings for insert with check (true);
create policy "anon_all_update_payment_settings" on public.payment_settings for update using (true) with check (true);
create policy "anon_all_delete_payment_settings" on public.payment_settings for delete using (true);

create policy "anon_all_select_question_tag_stats" on public.question_tag_stats for select using (true);
create policy "anon_all_insert_question_tag_stats" on public.question_tag_stats for insert with check (true);
create policy "anon_all_update_question_tag_stats" on public.question_tag_stats for update using (true) with check (true);
create policy "anon_all_delete_question_tag_stats" on public.question_tag_stats for delete using (true); 