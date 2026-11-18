# アーキテクチャ

コードの書き方（命名・状態管理の使い分けなど）は [CODING_GUIDELINES.md](CODING_GUIDELINES.md) を参照。

## 全体像

Expo で作ったアプリが expo-location で位置を取得し、端末の中で今いる島（家・学校・外出中・漂流）を判定して、島の種類だけを Supabase（PostgreSQL）に保存する。座標はサーバーに送らない。
Realtime で友達の端末に変更が配信され、アプリ内のキャッシュ（TanStack Query）が更新されて画面に反映される。

```mermaid
flowchart LR
  subgraph me["自分の端末"]
    loc["expo-location<br/>（位置取得・島の判定）"]
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

  loc -- "島の種類だけを保存" --> db
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
| 位置情報       | expo-location / expo-task-manager     | 位置の取得と島の判定（端末内）。バックグラウンド取得は当面使わない            |
| 入力           | React Hook Form / Zod                 | フォームの状態管理と入力チェック                                              |
| 認証           | Supabase Auth（Google）               | ログイン。ユーザー ID は RLS で `auth.uid()` として使う                       |
| DB             | PostgreSQL（Supabase）                | データの保存。アプリから直接読み書きするため、RLS が権限管理の要              |
| リアルタイム   | Supabase Realtime（Postgres Changes） | テーブルの変更を購読して友達の端末に配信                                      |

> ⚠️ Realtime を Broadcast と併用するかはまだ決まっていない。
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
    svc["ルール（純粋関数）<br/>島の判定・漂流判定"]
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

## 画面遷移

画面の元はワイヤーフレーム（#14）。つなぎ方は #42 で決めた。`src/app/` のルート構成（#18）はこれに合わせている（[ディレクトリ構成](#ディレクトリ構成)）。

```mermaid
flowchart TD
  start([起動]) --> authed{ログイン済み?}
  authed -- いいえ --> login[ログイン]
  login --> hasProfile{プロフィールあり?}
  authed -- はい --> hasProfile
  hasProfile -- いいえ --> onboardProfile[初回設定: プロフィール]
  onboardProfile --> onboardAvatar[初回設定: アバター]
  onboardAvatar --> home
  hasProfile -- はい --> home

  subgraph tabs["下部タブ"]
    home["ホーム<br/>最後に開いたグループの島"]
    friends["友達<br/>友達一覧・届いた申請"]
    me["マイページ<br/>自分のプロフィール"]
  end

  home -. シート .-> switcher[グループの切り替え]
  switcher -. モーダル .-> groupAdd["グループ追加<br/>作成・届いている招待"]
  home -. シート .-> preview[簡易プロフィール]
  preview --> profile[プロフィール詳細]
  home --> manage["グループ管理<br/>名前・招待・メンバー削除・譲渡・退出"]

  friends -. モーダル .-> search[友達を検索して申請]
  friends --> profile

  me --> edit[プロフィール編集]
  me --> avatarEdit[アバター編集]
  me --> settings["設定<br/>ログアウト・アカウント削除"]
  settings --> presence["島の公開設定<br/>友達ごと・友達ではないメンバー"]
```

実線は Stack で進む画面（戻る操作で戻る）、点線はシート・モーダルで開く画面。

Stack で進む画面・シート・モーダルは、タブの中ではなくルートの Stack（`src/app/_layout.tsx`）に並べる。タブより上に重なるので、開いている間はタブバーが出ない。ログイン・初回設定・タブのどれを見せるかは `Stack.Protected` で振り分ける（今は仮。#21 でログイン状態とプロフィールの有無に置き換える）。

| 決めたこと             | 内容                                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 下部タブ               | ホーム / 友達 / マイページ の3つ。設定はマイページから開く                                                                                                                              |
| ホーム                 | 最後に開いたグループの島を表示する（最後に開いたグループは端末に保存）。グループは島の中のシートで切り替え、そこから「グループ追加」も開く。グループが0件のときはグループ追加へ案内する |
| Stack で進む画面       | プロフィール詳細・プロフィール編集・アバター編集・設定・島の公開設定・グループ管理                                                                                                      |
| シート                 | 島でアバターを押したときの簡易プロフィール・グループの切り替え                                                                                                                          |
| モーダル               | グループ追加（作成・届いている招待）・友達を検索して申請。友達ではない人がいるグループに初めて入ったときの「島を見せるか」の確認（#67）                                                 |
| 確認ダイアログ         | 削除・退出・ログアウトなど、取り消せない操作の前                                                                                                                                        |
| 初回設定の途中で閉じた | 入力中のプロフィールとアバターを端末に残し、開き直したら途中の画面から続ける（プロフィールの行はアバター作成の最後にまとめて作るため、途中では DB に何も残らない）                      |
| ディープリンク         | MVP では作らない。`shimanchu://` の scheme は Google ログインの戻り先にだけ使う。招待はアプリ内だけ                                                                                     |
| 対象のプラットフォーム | MVP は iOS・Android だけ。Web は動作確認の対象にしない（Web 用のファイルは今の方針どおり残す）                                                                                          |

## ディレクトリ構成

> 🧪 = `create-expo-app` テンプレートのサンプル。本実装に入るときに削除・置き換え予定。
> 🚫 = 自動生成または git 管理外のファイル。手で編集しない／コミットしない。

```
shimanchu/
├── src/                          # アプリのソースコード（import は "@/..." で src/ 起点）
│   ├── app/                      # [presentation] 画面（Expo Router）。ファイル = 1画面、パス = URL
│   │   ├── _layout.tsx           # ルートの Stack（Provider・画面の振り分け・Stack で進む画面・モーダル・シート）
│   │   ├── login.tsx             # ログイン
│   │   ├── onboarding/           # 初回設定（_layout.tsx の Stack で index = プロフィール → avatar）
│   │   ├── (tabs)/               # 下部タブ（_layout.tsx が NativeTabs）
│   │   │   ├── index.tsx         #   "/" ホーム
│   │   │   ├── friends.tsx       #   "/friends" 友達
│   │   │   └── me.tsx            #   "/me" マイページ
│   │   ├── users/[userId]/       # index.tsx = プロフィール詳細、preview.tsx = 簡易プロフィール（シート）
│   │   ├── groups/[groupId]/manage.tsx # グループ管理
│   │   ├── profile-edit.tsx / avatar-edit.tsx # プロフィール編集・アバター編集
│   │   ├── settings/             # index.tsx = 設定、presence.tsx = 島の公開設定
│   │   ├── group-switcher.tsx    # グループの切り替え（シート）
│   │   └── group-add.tsx / friend-search.tsx / presence-prompt.tsx # モーダル
│   │   # 画面の中身は仮（PlaceholderScreen）。各画面の Issue で置き換える
│   ├── presentation/             # [presentation] 画面以外の UI まわり
│   │   ├── components/           # 再利用する UI コンポーネント
│   │   │   ├── placeholder-screen.tsx # 実装前の仮の画面（各画面を実装したら使わなくなる）
│   │   │   ├── themed-text.tsx   # 🧪 ライト/ダーク対応の Text
│   │   │   └── themed-view.tsx   # 🧪 ライト/ダーク対応の View
│   │   ├── hooks/                # UI 用のフック
│   │   │   ├── use-color-scheme.ts # 🧪 ライト/ダーク判定（.web.ts は Web 版）
│   │   │   └── use-theme.ts      # 🧪 現在のテーマ取得
│   │   ├── stores/               # Zustand のストア
│   │   │   └── temporary-flow-store.ts # 仮の画面の振り分け（#21 で本当の振り分けに置き換えて削除）
│   │   ├── constants/theme.ts    # 🧪 色・フォントなどのテーマ定数
│   │   ├── global.css            # 🧪 Web 用グローバル CSS
│   │   └── query-client.ts       # TanStack Query のクライアント（フォアグラウンド復帰時に再取得）
│   │   # 今後 queries/（TanStack Query のフック）・schemas/（フォームの Zod）を追加する
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
│   └── setup-hooks.js            # Git フックを有効にする（npm install 時に自動実行）
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
