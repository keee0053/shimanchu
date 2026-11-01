# チーム開発ルール

## ブランチ戦略（Git Flow）

### main ブランチ

- 本番リリース用のブランチ
- 直接コミットは行わず、develop ブランチからのマージのみ許可

### develop ブランチ

- 開発用のメインブランチ
- 機能開発はすべて develop にマージされる
- リリース準備が整ったら main にマージ

### feature ブランチ

- 新機能の開発に使用
- develop から分岐し、完了したら develop へプルリクエストを作成
- 命名規則: `feature/PascalCase`（例: `feature/AvatarDrift`、`feature/GroupLocationSetting`）
- プルリクエストは自己マージせず、他のメンバーによるレビューとマージを依頼すること

## コミットメッセージ

### 形式

```
type: 説明
```

- 日本語で一文で記述する
- 1つの目的につき1コミット

### タイプ一覧

| タイプ   | 用途                                               |
| -------- | -------------------------------------------------- |
| add      | 新機能の追加                                       |
| fix      | バグ修正                                           |
| refactor | リファクタリング（動作変更なし）                   |
| test     | テストコードの追加・修正                           |
| chore    | ビルド設定や補助ツールの変更など                   |
| perf     | パフォーマンス改善                                 |
| docs     | ドキュメントの追加・修正（README、本ファイルなど） |

### 例

```
add: 位置情報が取れないときにアバターが海を漂流する処理を実装
add: グループごとの位置情報共有設定テーブルを追加
fix: エリア判定で自宅と学校が重なるときの判定ミスを修正
refactor: 島の描画処理をカスタムフックに抽出
chore: expo-location を SDK 58 対応版に更新
docs: README にセットアップ手順を追加
```

## プルリクエスト

- タイトルは `prefix: 日本語` 形式で記述する（例: `add: 建物タップで内部を表示する画面を実装`）
- `.github/pull_request_template.md` のテンプレートを使用する（GitHub で PR を作成すると自動で本文に入る）
- 自己マージ禁止、他メンバーのレビュー後にマージ
- マージ方法は **「Create a merge commit」** を使う（「Squash and merge」はまとめたコミットの本文に元のコミット一覧が入り、コミットメッセージのルールに反して CI が失敗するため使わない）
- UI の変更がある場合はスクリーンショットまたは画面録画を添付する

### レビューチェック項目

- コードの可読性・命名規則
- 機能仕様の遵守
- 不要なファイルやコメントの除去（テンプレートのサンプル、`console.log` など）
- セキュリティ
  - 新しいテーブルに RLS（Row Level Security）が有効になっていて、ポリシーが正しいか
  - 位置情報がグループごとの共有設定を守って公開されているか（共有オフのグループに見えていないか）
  - `service_role` キーなどの秘密情報をアプリに含めていないか（`EXPO_PUBLIC_` 付きの環境変数はアプリに埋め込まれ、誰でも見られる）
  - `.env.local` などの秘密情報をコミットしていないか

## Git フックと CI による自動チェック

ルールの一部は Git フックと CI（GitHub Actions）で自動的に確認される。

### Git フック

`npm install` を実行すると自動で有効になる（`.githooks/` を使うよう git に設定される）。うまく動かないときは手動で有効にする:

```bash
npm run setup-hooks
```

| タイミング                 | 確認する内容                                                                                                                                                                                                | 違反したとき         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `git commit`（commit-msg） | コミットメッセージが `type: 説明` の日本語1行か、AI ツール表記が含まれていないか                                                                                                                            | コミットが中止される |
| `git push`（pre-push）     | push 先のブランチ名（`feature/PascalCase`、`main` / `develop` への直接 push 禁止）、push するコミットのメッセージ、型チェック（`npx tsc --noEmit`）、Lint（`npm run lint`）、整形（`npm run format:check`） | push が中止される    |

どうしてもスキップしたい場合は `git commit --no-verify` / `git push --no-verify` を使う（CI では同じチェックが走るので、PR で引っかかる）。

### CI（GitHub Actions）

`develop` / `main` 向けの PR と、`develop` / `main` への push で `.github/workflows/ci.yml` が実行される。

- PR タイトルが `prefix: 日本語` 形式か
- PR に含まれるコミットのメッセージ
- 型チェック・Lint・整形

CI が失敗している PR はマージしない。

### CodeRabbit（AI コードレビュー）

`develop` / `main` 向けの PR を作ると、CodeRabbit が自動でレビューし、日本語でコメントする（設定は `.coderabbit.yaml`）。

- 要約とレビューは CodeRabbit のコメントに書かれる（PR 本文には書き込まない設定）
- 指摘への質問や再レビューは、PR のコメントで `@coderabbitai` に話しかける
- CodeRabbit の指摘は参考意見。採用するかは作成者とレビュアーが判断し、**メンバーによるレビューとマージは必ず人が行う**
- CodeRabbit にコミットを作らせる機能（docstring・テスト生成など）は使わない

## 開発ルール

### アプリ（Expo / React Native）

- パッケージの追加は `npm install` ではなく `npx expo install <package>` を使う（SDK に合うバージョンが入るため）
- `ios/` `android/` は自動生成されるので直接編集しない。ネイティブの設定は `app.json` で行う
- 画面は `src/app/` に置き、画面以外のコードは `src/app/` に置かない

### DB（Supabase）

- テーブルなどの変更は必ずマイグレーションで行う（`supabase migration new <name>`）。Supabase Studio の画面から直接変更しない
- 一度 develop にマージされたマイグレーションファイルは編集せず、修正は新しいマイグレーションで行う
- 新しいテーブルには必ず RLS を有効にし、ポリシーを設定する

## コーディング規約

[docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) を参照（命名・ディレクトリ・Supabase・状態管理・位置情報・フォーム）。

## 使用禁止事項

- ファイル名・変数名に日本語を使用しない
- ファイル名・変数名に特殊文字（`: !@#$%^&*()+=[]{}|;:'",<>/?`）を使用しない
- AI ツール表記（Made with Cursor、Made-with: Cursor、Co-Authored-By 等）をコード・コミット・PR のいずれにも含めない（co-working 時も同様）
  - commit-msg フックでコミット拒否、pre-push フックで push 拒否される
