CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    university VARCHAR(255),
    faculty VARCHAR(255),
    year INT,
    bio TEXT,
    birthday DATE,
    gender VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS（行レベルセキュリティ）を有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 全員がプロフィールを閲覧できるポリシー
CREATE POLICY "プロフィールは認証済みユーザーなら誰でも閲覧可能"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 本人のみが自分のプロフィールを追加・更新できるポリシー
CREATE POLICY "本人のみプロフィールを作成可能"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "本人のみプロフィールを更新可能"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);