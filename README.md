# しまんちゅ

現実の位置情報と連動した仮想の島で、友達のアバターが生活する様子を観察できるアプリ。

## 技術スタック

React Native + Expo (SDK 58) / TypeScript / Expo Router / Zustand / Supabase (Auth・PostgreSQL・Realtime) / expo-location / expo-task-manager / React Hook Form / Zod

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

| コマンド | 内容 |
| --- | --- |
| `npx expo start` | 開発サーバー起動 |
| `npx expo install <pkg>` | SDK 互換バージョンでパッケージ追加（Expo 系は必ずこちら） |
| `npx tsc --noEmit` | 型チェック |
| `npm run lint` | Lint |
| `npx expo-doctor` | 依存関係・設定の診断 |
| `supabase start` / `supabase stop` | ローカル Supabase の起動 / 停止 |
| `supabase migration new <name>` | マイグレーション作成 |

## ディレクトリ構成

> 🧪 = `create-expo-app` テンプレートのサンプル。本実装に入るときに削除・置き換え予定。
> 🚫 = 自動生成または git 管理外のファイル。手で編集しない／コミットしない。

```
shimanchu/
├── src/                          # アプリのソースコード（import は "@/..." で src/ 起点）
│   ├── app/                      # 画面（Expo Router）。ファイル = 1画面、パス = URL
│   │   ├── _layout.tsx           # ルートレイアウト（全画面共通のナビゲーター・Provider）
│   │   ├── index.tsx             # 🧪 "/" ホーム画面
│   │   └── explore.tsx           # 🧪 "/explore" サンプル画面
│   ├── components/               # 再利用する UI コンポーネント
│   │   ├── ui/
│   │   │   └── collapsible.tsx   # 🧪 開閉パネル
│   │   ├── app-tabs.tsx          # 🧪 タブバー（iOS / Android）
│   │   ├── app-tabs.web.tsx      # 🧪 タブバー（Web 版）
│   │   ├── animated-icon.tsx     # 🧪 アニメーション付きアイコン（*.web.tsx / *.module.css は Web 用）
│   │   ├── themed-text.tsx       # 🧪 ライト/ダーク対応の Text
│   │   ├── themed-view.tsx       # 🧪 ライト/ダーク対応の View
│   │   ├── external-link.tsx     # 🧪 外部リンク（アプリ内ブラウザで開く）
│   │   ├── hint-row.tsx          # 🧪 ヒント表示行
│   │   └── web-badge.tsx         # 🧪 Web 用バッジ
│   ├── constants/
│   │   └── theme.ts              # 🧪 色・フォントなどのテーマ定数
│   ├── hooks/                    # カスタムフック
│   │   ├── use-color-scheme.ts   # 🧪 ライト/ダーク判定（.web.ts は Web 版）
│   │   └── use-theme.ts          # 🧪 現在のテーマ取得
│   ├── lib/                      # 外部サービス接続などの共通処理
│   │   └── supabase.ts           # Supabase クライアント（認証セッションを AsyncStorage に保存）
│   └── global.css                # 🧪 Web 用グローバル CSS
│
├── assets/                       # 画像・アイコン
│   ├── expo.icon/                # iOS 用アプリアイコン
│   └── images/                   # アプリアイコン・スプラッシュ画像・Android アイコン
│                                 #   （react-logo / tabIcons / tutorial-web などは 🧪）
│
├── supabase/                     # Supabase（バックエンド）関連
│   ├── config.toml               # ローカル Supabase の設定（ポート・Auth プロバイダなど）
│   └── .gitignore
│   # 今後 migrations/（DB スキーマ）や seed.sql（初期データ）をここに追加する
│
├── scripts/
│   └── reset-project.js          # 🧪 サンプルを片付けて空のプロジェクトにするスクリプト
│
├── app.json                      # Expo のアプリ設定（アプリ名・アイコン・位置情報の権限文言・プラグイン）
├── package.json                  # 依存パッケージと npm スクリプト
├── package-lock.json             # 依存バージョンの固定（コミットする）
├── tsconfig.json                 # TypeScript 設定（strict、"@/*" → src/* のパスエイリアス）
├── expo-env.d.ts                 # 🚫 Expo の型定義（expo start 時に自動生成）
├── .env.example                  # 環境変数のひな形 → .env.local にコピーして使う
├── .env.local                    # 🚫 実際の環境変数（各自で作成、コミットしない）
├── .gitignore
├── AGENTS.md                     # AI コーディングエージェント向けのプロジェクトルール
├── .claude/settings.json         # Claude Code の設定（Expo プラグイン有効化）
└── .vscode/                      # VS Code 推奨拡張（Expo Tools）・保存時の自動整形設定
```

### 自動生成されるディレクトリ（すべて 🚫）

| パス | 内容 |
| --- | --- |
| `node_modules/` | `npm install` でインストールされたパッケージ |
| `.expo/` | Expo の開発用キャッシュ・型生成物 |
| `ios/` / `android/` | `npx expo run:ios` 等で生成されるネイティブプロジェクト。設定は `app.json` で行い、直接編集しない |
| `dist/` | `npx expo export` のビルド成果物 |

### 配置ルール

- **画面**は `src/app/` に置く。画面以外のコード（コンポーネント・フック・ロジック）は `src/app/` に置かない（ルートとして扱われてしまうため）。
- `*.web.tsx` / `*.web.ts` は Web でのみ使われる実装。同名の `*.tsx` がネイティブ用。
- Supabase など外部サービスとの接続は `src/lib/` にまとめる。
- 今後の追加予定（例）: Zustand のストアは `src/stores/`、Zod スキーマは `src/schemas/`、位置情報のバックグラウンドタスクは `src/tasks/`。
