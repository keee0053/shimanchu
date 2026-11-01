# アーキテクチャ

コードの書き方（命名・状態管理の使い分けなど）は [CODING_GUIDELINES.md](CODING_GUIDELINES.md) を参照。

## 全体像

Expo で作ったアプリが expo-location で位置を取得し、Supabase（PostgreSQL）に保存する。
Realtime で友達の端末に変更が配信され、アプリ内のキャッシュ（TanStack Query）が更新されて画面に反映される。

```mermaid
flowchart LR
  subgraph me["自分の端末"]
    loc["expo-location<br/>（位置取得）"]
  end

  subgraph supabase["Supabase"]
    auth["Auth（Google）"]
    db[("PostgreSQL<br/>RLS で読める行を制限")]
    rt["Realtime<br/>（Postgres Changes）"]
  end

  subgraph friend["友達の端末"]
    query["TanStack Query<br/>（サーバーデータのキャッシュ）"]
    zustand["Zustand<br/>（端末内の UI 状態）"]
    screen["画面（Expo Router）<br/>島・建物・アバター"]
  end

  loc -- "位置・エリアを保存" --> db
  auth -. "auth.uid() を RLS で使用" .-> db
  db -- "変更を検知" --> rt
  rt -- "変更を配信" --> query
  query --> screen
  zustand --> screen
```

| 層             | 技術                                  | 役割                                                                          |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| 画面           | React Native + Expo / Expo Router     | iOS / Android のアプリ本体。`src/app/` のファイル構成がそのまま画面遷移になる |
| サーバーデータ | TanStack Query                        | Supabase から取得したデータのキャッシュ・再取得                               |
| 端末内の状態   | Zustand                               | 選択中のグループ、開いている建物などの UI 状態                                |
| 位置情報       | expo-location / expo-task-manager     | 位置の取得。バックグラウンド取得は当面使わない                                |
| 入力           | React Hook Form / Zod                 | フォームの状態管理と入力チェック                                              |
| 認証           | Supabase Auth（Google）               | ログイン。ユーザー ID は RLS で `auth.uid()` として使う                       |
| DB             | PostgreSQL（Supabase）                | データの保存。アプリから直接読み書きするため、RLS が権限管理の要              |
| リアルタイム   | Supabase Realtime（Postgres Changes） | テーブルの変更を購読して友達の端末に配信                                      |

> ⚠️ 位置情報の保存形式（エリア ID のみ／緯度経度）と、Realtime を Broadcast と併用するかはまだ決まっていない。
> 決まったら上の図と表を更新すること（[CODING_GUIDELINES.md の未決定事項](CODING_GUIDELINES.md#未決定事項)）。

## アプリ内部の層構成（クリーンアーキテクチャ）

アプリのコードは責務ごとに4つの層に分け、**依存の向きを一方向に固定**している。中心の domain（アプリのルール）は React・Expo・Supabase を一切知らないので、単体でテストでき、外側の技術を差し替えても影響を受けない。

```mermaid
flowchart LR
  subgraph presentation["presentation<br/>src/app・src/presentation"]
    ui["画面・コンポーネント"]
    q["TanStack Query のフック<br/>Zustand・フォーム"]
  end
  subgraph application["application<br/>src/application"]
    uc["ユースケース<br/>（例: 自分の位置を更新する）"]
  end
  subgraph domain["domain<br/>src/domain"]
    ent["エンティティの型"]
    svc["ルール（純粋関数）<br/>エリア判定・漂流判定"]
    repo["リポジトリの<br/>インターフェース"]
  end
  subgraph infrastructure["infrastructure<br/>src/infrastructure"]
    sb["Supabase の実装"]
    lc["expo-location の実装"]
  end
  container["src/container.ts<br/>（組み立て）"]

  ui --> q --> uc --> svc
  uc --> repo
  q -.->|単純な取得はユースケースなしで| repo
  sb -->|実装する| repo
  lc -->|実装する| repo
  container -.-> sb
  container -.-> lc
  container -.-> uc
  q -.-> container
```

| 層             | 場所                            | 役割                                                                   | 依存してよい層                 |
| -------------- | ------------------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| domain         | `src/domain/`                   | アプリのルール（エンティティ・純粋関数・リポジトリのインターフェース） | なし                           |
| application    | `src/application/`              | ユースケース（domain を組み合わせた1つの操作）                         | domain                         |
| infrastructure | `src/infrastructure/`           | Supabase・expo-location などを使ったリポジトリの実装                   | domain                         |
| presentation   | `src/app/`・`src/presentation/` | 画面・コンポーネント・TanStack Query・Zustand・フォーム                | application、domain、container |
| （組み立て）   | `src/container.ts`              | 実装をインターフェースに当てはめ、ユースケースを作る                   | すべて                         |

- 依存ルールは **ESLint で強制**している（`eslint.config.js`）。違反は `npm run lint`・pre-push フック・CI で止まる
- コード量を増やしすぎないため、**ロジックがない単純な取得はユースケースを作らず**、presentation から container のリポジトリを直接呼んでよい
- 書き方の詳細は [CODING_GUIDELINES.md の「層構成」](CODING_GUIDELINES.md#3-層構成クリーンアーキテクチャ)・[「データの取得と更新」](CODING_GUIDELINES.md#4-データの取得と更新) を参照

## ディレクトリ構成

> 🧪 = `create-expo-app` テンプレートのサンプル。本実装に入るときに削除・置き換え予定。
> 🚫 = 自動生成または git 管理外のファイル。手で編集しない／コミットしない。

```
shimanchu/
├── src/                          # アプリのソースコード（import は "@/..." で src/ 起点）
│   ├── app/                      # [presentation] 画面（Expo Router）。ファイル = 1画面、パス = URL
│   │   ├── _layout.tsx           # ルートレイアウト（全画面共通のナビゲーター・Provider）
│   │   ├── index.tsx             # 🧪 "/" ホーム画面
│   │   └── explore.tsx           # 🧪 "/explore" サンプル画面
│   ├── presentation/             # [presentation] 画面以外の UI まわり
│   │   ├── components/           # 再利用する UI コンポーネント
│   │   │   ├── ui/collapsible.tsx # 🧪 開閉パネル
│   │   │   ├── app-tabs.tsx      # 🧪 タブバー（iOS / Android。.web.tsx は Web 版）
│   │   │   ├── animated-icon.tsx # 🧪 アニメーション付きアイコン（*.web.tsx / *.module.css は Web 用）
│   │   │   ├── themed-text.tsx   # 🧪 ライト/ダーク対応の Text
│   │   │   ├── themed-view.tsx   # 🧪 ライト/ダーク対応の View
│   │   │   ├── external-link.tsx # 🧪 外部リンク（アプリ内ブラウザで開く）
│   │   │   ├── hint-row.tsx      # 🧪 ヒント表示行
│   │   │   └── web-badge.tsx     # 🧪 Web 用バッジ
│   │   ├── hooks/                # UI 用のフック
│   │   │   ├── use-color-scheme.ts # 🧪 ライト/ダーク判定（.web.ts は Web 版）
│   │   │   └── use-theme.ts      # 🧪 現在のテーマ取得
│   │   ├── constants/theme.ts    # 🧪 色・フォントなどのテーマ定数
│   │   ├── global.css            # 🧪 Web 用グローバル CSS
│   │   └── query-client.ts       # TanStack Query のクライアント（フォアグラウンド復帰時に再取得）
│   │   # 今後 queries/（TanStack Query のフック）・stores/（Zustand）・schemas/（フォームの Zod）を追加する
│   ├── application/              # [application] ユースケース（まだ空）
│   ├── domain/                   # [domain] アプリのルール（まだ空）
│   │   ├── entities/             #   エンティティの型
│   │   ├── services/             #   ルール（純粋関数）
│   │   └── repositories/         #   リポジトリのインターフェース
│   ├── infrastructure/           # [infrastructure] 外部とのやり取りの実装
│   │   └── supabase/
│   │       ├── client.ts         # Supabase クライアント（認証セッションを AsyncStorage に保存。DB の型付き）
│   │       └── database.types.ts # 🚫 DB の型（npm run gen:types で自動生成。手で編集しない。コミットはする）
│   │   # 今後 location/（expo-location・expo-task-manager の実装）を追加する
│   ├── container.ts              # 依存の組み立て（infrastructure の実装をつなぐ唯一の場所）
│   └── expo-types.d.ts           # Expo の型参照（自動生成の expo-env.d.ts がない環境でも型チェックを通す）
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
│   ├── git-hooks/                # Git フック・CI から使うチェック処理（Node.js。macOS / Windows 共通）
│   │   ├── commit-rules.js       # コミットメッセージ・PR タイトル・ブランチ名のルール本体
│   │   ├── check-commit-message.js # 1件のコミットメッセージ / PR タイトルを検査
│   │   ├── check-commits.js      # 範囲内のコミットメッセージをまとめて検査（CI 用）
│   │   └── pre-push.js           # push 前のチェック（ブランチ名・メッセージ・型・Lint・整形）
│   ├── setup-hooks.js            # Git フックを有効にする（npm install 時に自動実行）
│   └── reset-project.js          # 🧪 サンプルを片付けて空のプロジェクトにするスクリプト
├── .githooks/                    # Git フックの入口（commit-msg / pre-push。中身は scripts/git-hooks/ を呼ぶだけ）
│
├── docs/
│   ├── ARCHITECTURE.md           # アーキテクチャ（全体像・層構成・ディレクトリ構成）← このファイル
│   ├── SETUP.md                  # 環境構築手順
│   └── CODING_GUIDELINES.md      # コーディング規約（命名・層構成・データ取得・状態管理・位置情報など）
├── .github/
│   ├── workflows/ci.yml          # CI（PR 時に PR タイトル・コミットメッセージ・型・Lint・整形をチェック）
│   └── pull_request_template.md  # PR テンプレート
├── .coderabbit.yaml               # CodeRabbit（AI コードレビュー）の設定
├── CONTRIBUTING.md               # チーム開発ルール（ブランチ・コミット・PR・レビュー）
├── CLAUDE.md                     # Claude Code 向けのプロジェクトルール
│
├── app.json                      # Expo のアプリ設定（アプリ名・アイコン・位置情報の権限文言・プラグイン）
├── package.json                  # 依存パッケージと npm スクリプト
├── package-lock.json             # 依存バージョンの固定（コミットする）
├── tsconfig.json                 # TypeScript 設定（strict、"@/*" → src/* のパスエイリアス）
├── eslint.config.js              # ESLint 設定（Expo 推奨 + Prettier 連携 + 層の依存ルール）
├── .prettierrc.json              # Prettier 設定（.prettierignore で対象外を指定）
├── expo-env.d.ts                 # 🚫 Expo の型定義（expo start 時に自動生成）
├── .env.example                  # 環境変数のひな形 → .env.local にコピーして使う
├── .nvmrc                        # Node.js のバージョン指定（nvm use で切り替え）
├── .env.local                    # 🚫 実際の環境変数（各自で作成、コミットしない）
├── .gitignore
├── .gitattributes                # 改行コードを LF に統一（Windows 対策）
├── AGENTS.md                     # AI コーディングエージェント向けのプロジェクトルール
├── .claude/settings.json         # Claude Code の設定（Expo プラグイン有効化・コミット / PR への署名を無効化）
└── .vscode/                      # VS Code 推奨拡張（Expo Tools・ESLint・Prettier）・保存時の自動整形設定
```

## 自動生成されるディレクトリ（すべて 🚫）

| パス                | 内容                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `node_modules/`     | `npm install` でインストールされたパッケージ                                                      |
| `.expo/`            | Expo の開発用キャッシュ・型生成物                                                                 |
| `ios/` / `android/` | `npx expo run:ios` 等で生成されるネイティブプロジェクト。設定は `app.json` で行い、直接編集しない |
| `dist/`             | `npx expo export` のビルド成果物                                                                  |

## 配置ルール

- **画面**は `src/app/` に置く。画面以外のコード（コンポーネント・フック・ロジック）は `src/app/` に置かない（ルートとして扱われてしまうため）。
- どの層に何を置くかは [アプリ内部の層構成](#アプリ内部の層構成クリーンアーキテクチャ) と [CODING_GUIDELINES.md](CODING_GUIDELINES.md#3-層構成クリーンアーキテクチャ) に従う。
- Supabase・expo-location など外部サービスを使うコードは `src/infrastructure/` にだけ書く。
- `*.web.tsx` / `*.web.ts` は Web でのみ使われる実装。同名の `*.tsx` がネイティブ用。
