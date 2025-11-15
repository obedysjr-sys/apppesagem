-- Ativar RLS e permitir SELECT/INSERT para o papel 'anon'
-- Execute estes comandos no projeto Supabase (SQL Editor ou CLI migrations)

alter table if exists public.registros_peso enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'registros_peso' and policyname = 'Allow select for anon'
  ) then
    create policy "Allow select for anon" on public.registros_peso
      for select
      to anon
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'registros_peso' and policyname = 'Allow insert for anon'
  ) then
    create policy "Allow insert for anon" on public.registros_peso
      for insert
      to anon
      with check (true);
  end if;
end $$;