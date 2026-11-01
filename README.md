# しまんちゅ

現実の位置情報と連動した仮想の島で、友達のアバターが生活する様子を観察できるアプリ。

## 技術スタック

React Native + Expo (SDK 58) / TypeScript / Expo Router / TanStack Query / Zustand / Supabase (Auth・PostgreSQL・Realtime) / expo-location / expo-task-manager / React Hook Form / Zod

## 必要なもの

- Node.js 22 以上
- Docker Desktop（ローカル Supabase 用）
- Supabase CLI（`brew install supabase/tap/supabase`）
- 実機確認用: iOS は Xcode、Android は Android Studio（または EAS Build）

## セットアップ

```bash
npm install
cp .env.example .env.local

# ローカル Supabase を起動（Docker が必要）
supabase start
supabase status   # 表示された API URL と anon key を .env.local に記入

npx expo start
```

> バックグラウンド位置情報（expo-location / expo-task-manager）は Expo Go では動作しないため、
> 実機確認は Development Build（`npx expo run:ios` / `npx expo run:android`）を使ってください。

## よく使うコマンド

| コマンド                           | 内容                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `npx expo start`                   | 開発サーバー起動                                          |
| `npx expo install <pkg>`           | SDK 互換バージョンでパッケージ追加（Expo 系は必ずこちら） |
| `npx tsc --noEmit`                 | 型チェック                                                |
| `npm run lint`                     | Lint                                                      |
| `npm run format`                   | Prettier で全ファイルを整形（`format:check` は確認のみ）  |
| `npm run gen:types`                | DB スキーマから型を生成（`src/types/database.ts`）        |
| `npx expo-doctor`                  | 依存関係・設定の診断                                      |
| `supabase start` / `supabase stop` | ローカル Supabase の起動 / 停止                           |
| `supabase migration new <name>`    | マイグレーション作成                                      |

## ドキュメント

| ファイル                                               | 内容                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)           | アーキテクチャ（全体像・データの流れ・ディレクトリ構成）         |
| [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) | コーディング規約（命名・Supabase・状態管理・位置情報・フォーム） |
| [CONTRIBUTING.md](CONTRIBUTING.md)                     | チーム開発ルール（ブランチ・コミット・PR・レビュー）             |
