# CLAUDE.md

しまんちゅ: 現実の位置情報と連動した仮想の島で、友達のアバターの生活を観察するモバイルアプリ（Expo + Supabase）。

Expo 全般のルール（docs の参照方法、`npx expo install`、`ios/` `android/` を触らない等）は AGENTS.md に従う。

@AGENTS.md

詳細なルールは以下。迷ったら必ず読むこと。

- チーム開発ルール（ブランチ・コミット・PR・レビュー）: [CONTRIBUTING.md](CONTRIBUTING.md)
- コーディング規約（命名・ディレクトリ・Supabase・状態管理・位置情報・フォーム）: [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)
- アーキテクチャ（全体像・データの流れ・ディレクトリ構成）: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 環境構築手順: [docs/SETUP.md](docs/SETUP.md)

## Git（厳守）

- **AI ツール表記を一切入れない。** コミット・PR・コードに `Co-Authored-By`、`Generated with Claude Code` などを書かない（hook で拒否される）
- コミットメッセージは **日本語1行** の `type: 説明`。本文は書かない。1つの目的につき1コミット
  - type: `add` / `fix` / `refactor` / `test` / `chore` / `perf` / `docs`
- `main` / `develop` に直接コミットしない。`develop` から `feature/PascalCase`（例: `feature/AvatarDrift`）を切って作業する
- PR は `develop` 向け。タイトルは `prefix: 日本語`、本文は `.github/pull_request_template.md` に沿う。自己マージしない
- commit / push / PR 作成はユーザーに頼まれたときだけ行う
- コミットメッセージとブランチ名は Git フック（`.githooks/`）と CI で検査される。フックに止められたら `--no-verify` で回避せず、メッセージや変更を直す

## コマンド

```bash
npx expo start            # 開発サーバー
npx expo install <pkg>    # パッケージ追加（npm install ではなくこちら）
npx tsc --noEmit          # 型チェック
npm run lint              # ESLint（Prettier 連携）
npm run format            # Prettier で整形（format:check は確認のみ）
npm run gen:types         # DB の型を src/types/database.ts に生成（要 supabase start）
supabase migration new <name>  # マイグレーション作成
```

作業完了前に `npx tsc --noEmit`・`npm run lint`・`npm run format:check` を通すこと。

## コードを書くときの要点

- ファイル名はケバブケース、コンポーネントは PascalCase。画面（`src/app/`）だけ `export default`、他は名前付き export
- 画面・コンポーネントから `supabase.from()` を直接呼ばない。`src/api/<ドメイン>.ts` に取得処理と TanStack Query のフックをまとめる。`error` は必ず `throw`
- サーバーのデータは TanStack Query、端末内の状態だけ Zustand（`src/stores/`）。サーバーデータを Zustand にコピーしない
- Realtime の購読はクリーンアップで必ず `supabase.removeChannel`。受信した変更は TanStack Query のキャッシュに反映する
- DB 変更は必ずマイグレーションで。新しいテーブルは RLS を有効にしてポリシーを書く。マージ済みマイグレーションは編集しない
- DB の型は手書きせず `npm run gen:types` で生成したものを使う
- 位置情報: 当面フォアグラウンドのみ。取得失敗・権限拒否は「漂流」状態として扱う。座標をログに出さない。`TaskManager.defineTask` は `src/tasks/` のトップレベルで定義
- フォームは React Hook Form + Zod（`src/schemas/`、型は `z.infer`、エラーメッセージは日本語）
- 秘密情報（`service_role` キー、`.env.local`）をコードやコミットに含めない。`EXPO_PUBLIC_` 付きの環境変数は公開される前提で扱う

## 未決定事項

以下はチームでまだ決まっていない。関係する実装をするときは、勝手に決めずにユーザーに確認すること（一覧は docs/CODING_GUIDELINES.md 末尾）。

- 位置情報を DB にどう保存するか（エリア ID のみ / 緯度経度 / 両方）
- Realtime を Postgres Changes のままにするか、Broadcast と併用するか
- バックグラウンド位置情報の導入時期
- Sign in with Apple への対応
- テスト方針

## 現状メモ

- `src/` の多くは create-expo-app テンプレートのサンプル（docs/ARCHITECTURE.md で 🧪 印）。本実装で置き換える予定で、Web 用ファイルも当面は残す方針
