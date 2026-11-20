-- プロフィール画像（#65）
-- 画像は Storage のバケット profile-images に <user_id>/<ファイル名> で置き、profiles.image_path にパスを持つ。
-- 読める範囲はプロフィールと同じ（本人・友達・同じグループのメンバー・友達申請やグループ招待の相手）。
-- アップロード・表示・古いファイルの削除はアプリ側（#76）で行う。

-- バケット: 非公開（URL を知っていても読めない）。端末で縮小・圧縮してから送る前提で 2MB まで
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  false,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- 読み取り: 自分のフォルダ、または持ち主の profiles の行を読める相手
-- profiles の判定は、呼び出したユーザーの権限で profiles を読むことで、profiles の RLS をそのまま使う
-- （本人のフォルダは、初回設定でプロフィールの行を作る前でも読めるように別に書く）
create policy "プロフィールを読める相手はプロフィール画像を読める"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.profiles p
        where p.id::text = (storage.foldername(name))[1]
      )
    )
  );

-- 書き込み: 本人のフォルダだけ
create policy "本人は自分のフォルダにプロフィール画像をアップロードできる"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "本人は自分のフォルダのプロフィール画像を差し替えられる"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "本人は自分のフォルダのプロフィール画像を削除できる"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- profiles に画像のパスを持たせる（任意）。自分のフォルダの直下のファイルだけ入れられる
alter table public.profiles
  add column image_path text
    constraint profiles_image_path_check check (image_path ~ ('^' || id::text || '/[^/]+$'));

comment on column public.profiles.image_path is 'プロフィール画像の Storage のパス（バケット profile-images の <id>/<ファイル名>）。未設定は null';

-- 本人だけが作成・更新できる（profiles の作成・更新のポリシーが本人の行に限っている）
grant insert (image_path) on public.profiles to authenticated;
grant update (image_path) on public.profiles to authenticated;
