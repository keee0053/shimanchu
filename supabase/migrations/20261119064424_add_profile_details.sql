-- プロフィールの自己紹介・生年月日・性別（#64）
-- 生年月日そのものは、本人以外にはテーブルから読ませない。
-- 他人には、本人が選んだ公開範囲に合わせて、生年月日・年齢・何も返さないのどれかをビュー profile_birthdays で返す。

alter table public.profiles
  add column bio text
    constraint profiles_bio_check check (char_length(bio) <= 100),
  add column birth_date date not null,
  add column birth_date_visibility text not null default 'age'
    constraint profiles_birth_date_visibility_check
      check (birth_date_visibility in ('full', 'age', 'hidden')),
  add column gender text not null default 'unspecified'
    constraint profiles_gender_check
      check (gender in ('male', 'female', 'other', 'unspecified'));

comment on column public.profiles.bio is '自己紹介。任意で100文字まで';
comment on column public.profiles.birth_date is '生年月日。本人以外はテーブルから読めない（profile_birthdays を使う）';
comment on column public.profiles.birth_date_visibility is '生年月日の公開範囲。full = 生年月日と年齢 / age = 年齢だけ / hidden = 非公開';
comment on column public.profiles.gender is '性別。male / female / other / unspecified（回答しない）';

-- 生年月日は 18歳以上（#50）、120年前まで
-- current_date を使う CHECK 制約は行を作ったあとに再評価されないため、作成・更新のときにトリガーで検査する
create function private.check_birth_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_date > (current_date - interval '18 years')::date then
    raise exception 'birth_date must be at least 18 years ago'
      using errcode = 'check_violation';
  end if;
  if new.birth_date < (current_date - interval '120 years')::date then
    raise exception 'birth_date must be within 120 years'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_check_birth_date
  before insert or update of birth_date on public.profiles
  for each row execute function private.check_birth_date();

-- 列単位の権限
-- 本人が作成・更新できる列に足す
grant insert (bio, birth_date, birth_date_visibility, gender) on public.profiles to authenticated;
grant update (bio, birth_date, birth_date_visibility, gender) on public.profiles to authenticated;

-- 読み取りは birth_date 以外の列だけにする
-- テーブル単位の SELECT が残っていると列単位の取り消しが効かないため、いったん全部取り消して列ごとに付け直す
-- （このあと profiles に列を足すときは、その列の SELECT も grant すること）
revoke select on public.profiles from authenticated;
do $$
declare
  v_columns text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
  into v_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name <> 'birth_date';

  execute format('grant select (%s) on public.profiles to authenticated', v_columns);
end;
$$;

-- p_user_id の生年月日を、公開範囲に合わせて返す（本人には常に返す）
-- birth_date の列は読めないため security definer で読む。ビューからだけ使うので、RPC で呼べない private に置く
create function private.visible_birth_date(p_user_id uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select p.birth_date
  from public.profiles p
  where p.id = p_user_id
    and (p.id = (select auth.uid()) or p.birth_date_visibility = 'full');
$$;

-- p_user_id の年齢を、公開範囲に合わせて返す（本人には常に返す）
create function private.visible_age(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select extract(year from age(current_date, p.birth_date))::integer
  from public.profiles p
  where p.id = p_user_id
    and (p.id = (select auth.uid()) or p.birth_date_visibility in ('full', 'age'));
$$;

-- ビューの中で呼び出したユーザーの権限で実行されるため、authenticated には EXECUTE が必要
revoke execute on function private.visible_birth_date(uuid) from public, anon;
grant execute on function private.visible_birth_date(uuid) to authenticated;
revoke execute on function private.visible_age(uuid) from public, anon;
grant execute on function private.visible_age(uuid) to authenticated;

-- 生年月日と年齢（公開範囲に合わせて NULL になる）
-- security_invoker にして profiles の RLS をそのまま使い、プロフィールを読める相手の行だけ返す
create view public.profile_birthdays
with (security_invoker = true)
as
select
  p.id,
  private.visible_birth_date(p.id) as birth_date,
  private.visible_age(p.id) as age
from public.profiles p;

comment on view public.profile_birthdays is 'プロフィールの生年月日と年齢。公開範囲に合わせて NULL になる（本人には常に返す）';

revoke all on public.profile_birthdays from anon, authenticated;
grant select on public.profile_birthdays to authenticated;
