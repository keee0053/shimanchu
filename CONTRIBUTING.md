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

| タイプ | 用途 |
| --- | --- |
| add | 新機能の追加 |
| fix | バグ修正 |
| refactor | リファクタリング（動作変更なし） |
| test | テストコードの追加・修正 |
| chore | ビルド設定や補助ツールの変更など |
| perf | パフォーマンス改善 |
| docs | ドキュメントの追加・修正（README、本ファイルなど） |

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
- `.github/pull_request_template.md` のテンプレートを使用する（準備中）
- 自己マージ禁止、他メンバーのレビュー後にマージ
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

## Push 前の品質チェック（準備中）

push 前に品質チェックを実行する pre-push フックを利用できます（CI と同じチェック）。

```bash
./scripts/setup-hooks   # 初回のみ実行
```

以降、`git push` 時に自動で 型チェック（`npx tsc --noEmit`）/ ESLint（`npx expo lint`）/ テスト / 依存関係チェック（`npx expo-doctor`）が実行されます。スキップする場合は `git push --no-verify` を使用してください。

GitHub 上でも CI（GitHub Actions）が同じチェックを実行します。

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

`docs/CODING_GUIDELINES.md` を参照（準備中）。

## 使用禁止事項

- ファイル名・変数名に日本語を使用しない
- ファイル名・変数名に特殊文字（`: !@#$%^&*()+=[]{}|;:'",<>/?`）を使用しない
- AI ツール表記（Made with Cursor、Made-with: Cursor、Co-Authored-By 等）をコード・コミット・PR のいずれにも含めない（co-working 時も同様）
  - commit-msg フックでコミット拒否、pre-push フックで push 拒否される（準備中）
