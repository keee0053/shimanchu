# 環境構築手順

しまんちゅの開発に必要なツールを、ローカル（macOS）に入れて動作を確認するまでの手順。
上から順に進めれば、ローカル Supabase につながったアプリがシミュレーターで起動するところまでたどり着く。

> Windows の場合: iOS のビルドは macOS でしかできない。Android と Web での開発は可能なので、各手順の「Windows」の注記に従うこと。

## 0. 全体の流れ

| 手順                                 | 内容                                                                  | 必須          |
| ------------------------------------ | --------------------------------------------------------------------- | ------------- |
| [1](#1-共通ツールを入れる)           | Homebrew・Git・Node.js・Docker・Supabase CLI・VS Code を入れる        | ✅            |
| [2](#2-リポジトリを準備する)         | リポジトリを clone し、依存パッケージと環境変数を用意する             | ✅            |
| [3](#3-ローカル-supabase-を起動する) | ローカル Supabase を起動し、アプリとつなぐ                            | ✅            |
| [4](#4-アプリを起動する)             | Expo Go・iOS シミュレーター・Android エミュレーターでアプリを起動する | どれか1つ以上 |
| [5](#5-動作確認チェックリスト)       | 型チェック・Lint などが通ることを確認する                             | ✅            |

### 使うツールとバージョン

| ツール                                   | 用途                                               | 推奨バージョン           | 確認コマンド                    |
| ---------------------------------------- | -------------------------------------------------- | ------------------------ | ------------------------------- |
| Homebrew                                 | macOS のパッケージ管理                             | 最新                     | `brew --version`                |
| Git                                      | バージョン管理                                     | 最新                     | `git --version`                 |
| Node.js                                  | Expo・npm スクリプトの実行                         | 22 系（`.nvmrc` で指定） | `node -v`                       |
| npm                                      | パッケージ管理                                     | Node.js に同梱           | `npm -v`                        |
| Docker（Docker Desktop または OrbStack） | ローカル Supabase の実行                           | 最新                     | `docker info`                   |
| Supabase CLI                             | ローカル Supabase の操作・マイグレーション・型生成 | 最新                     | `supabase --version`            |
| Xcode                                    | iOS シミュレーターでのビルド（macOS のみ）         | 最新                     | `xcodebuild -version`           |
| Android Studio + JDK 17                  | Android エミュレーターでのビルド                   | Android SDK 36 / JDK 17  | `adb version` / `java -version` |
| VS Code                                  | エディタ（推奨）                                   | 最新                     | —                               |

参考: 環境構築時点（2026-11-01）で動作を確認したバージョンは Node.js v22.21.0 / npm 10.9.4 / Supabase CLI 2.105.0 / Docker 29.3.1 / Expo SDK 58。

## 1. 共通ツールを入れる

### 1-1. Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

確認:

```bash
brew --version   # Homebrew x.x.x と表示されれば OK
```

> Windows: Homebrew の代わりに [Scoop](https://scoop.sh/) を使う（Supabase CLI のインストールに必要）。

### 1-2. Git

macOS には Command Line Tools に Git が含まれる。入っていなければ:

```bash
xcode-select --install
```

コミットに使う名前とメールアドレスを設定する（GitHub のアカウントに合わせる）:

```bash
git config --global user.name "GitHubのユーザー名"
git config --global user.email "GitHubに登録したメールアドレス"
```

確認:

```bash
git --version
git config --global user.name
```

### 1-3. Node.js（nvm でバージョンを管理）

複数のプロジェクトで Node.js のバージョンを切り替えられるよう、[nvm](https://github.com/nvm-sh/nvm) を使う。

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# ターミナルを開き直してから
nvm install 22
nvm alias default 22
```

リポジトリ直下では `nvm use` で `.nvmrc` のバージョン（22）に切り替わる。

確認:

```bash
node -v   # v22.x.x
npm -v
```

> Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows) を使う。

### 1-4. Docker

ローカル Supabase は Docker のコンテナで動く。次のどちらかを入れる。

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（Windows はこちら）
- [OrbStack](https://orbstack.dev/)（macOS では Supabase が推奨。軽い）

```bash
brew install --cask orbstack   # または docker
```

インストール後、**アプリを起動しておく**（起動していないと `supabase start` が失敗する）。

確認:

```bash
docker info   # Server: の情報が表示されれば OK。"Cannot connect to the Docker daemon" ならアプリが起動していない
```

### 1-5. Supabase CLI

```bash
brew install supabase/tap/supabase
```

> Windows:
>
> ```powershell
> scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
> scoop install supabase
> ```

確認:

```bash
supabase --version
```

### 1-6. VS Code と推奨拡張

[VS Code](https://code.visualstudio.com/) を入れ、リポジトリを開くと右下に「推奨拡張機能をインストールしますか？」と出るのでインストールする。

| 拡張機能   | 用途                                                   |
| ---------- | ------------------------------------------------------ |
| Expo Tools | `app.json` の補完・デバッグ                            |
| ESLint     | Lint エラーをエディタ上に表示                          |
| Prettier   | 保存時に自動整形（`.vscode/settings.json` で設定済み） |

## 2. リポジトリを準備する

### 2-1. clone して develop ブランチに切り替える

```bash
git clone https://github.com/keee0053/shimanchu.git
cd shimanchu
git switch develop
nvm use
```

作業はここから `feature/PascalCase` のブランチを切って行う（[CONTRIBUTING.md](../CONTRIBUTING.md)）。

### 2-2. 依存パッケージを入れる

```bash
npm install
```

> パッケージを**追加**するときは `npm install <pkg>` ではなく `npx expo install <pkg>` を使う（SDK に合うバージョンが入る）。

### 2-3. 環境変数ファイルを作る

```bash
cp .env.example .env.local
```

値は次の手順 3 で Supabase を起動してから記入する。`.env.local` は git 管理外なので、コミットされない。

## 3. ローカル Supabase を起動する

### 3-1. 起動

Docker（または OrbStack）が起動していることを確認してから:

```bash
supabase start
```

初回は Docker イメージのダウンロードで数分〜十数分かかる。終わると URL とキーの一覧が表示される。

### 3-2. `.env.local` に値を記入する

```bash
supabase status
```

表示された値を `.env.local` に書く。

| `supabase status` の表示                                       | `.env.local` の変数                    |
| -------------------------------------------------------------- | -------------------------------------- |
| Project URL（`http://127.0.0.1:54321`）                        | `EXPO_PUBLIC_SUPABASE_URL`             |
| Authentication Keys の **Publishable**（`sb_publishable_...`） | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

> ⚠️ **Secret**（`sb_secret_...`）キーはアプリに入れない。`EXPO_PUBLIC_` 付きの変数はアプリに埋め込まれ、誰でも見られる。
>
> ⚠️ 実機や Android エミュレーターから接続するときは `127.0.0.1` では届かない（[トラブルシューティング](#アプリから-supabase-につながらない)）。

### 3-3. 動作確認

- `supabase status` の **Studio** の URL（通常 `http://127.0.0.1:54323`）をブラウザで開き、Supabase Studio が表示されれば OK
- マイグレーションがあれば、DB の型を生成できることを確認する:

```bash
npm run gen:types   # src/types/database.ts が生成される
```

### 3-4. 停止

```bash
supabase stop
```

データはコンテナのボリュームに残るので、次回 `supabase start` で元の状態に戻る。マイグレーションから DB を作り直したいときは `supabase db reset`。

## 4. アプリを起動する

用途に応じて選ぶ。位置情報まわりの開発をするなら 4-2 か 4-3（Development Build）が必要。

| 方法                          | 手軽さ | 位置情報（フォアグラウンド） | バックグラウンド位置情報 | 必要なもの                 |
| ----------------------------- | ------ | ---------------------------- | ------------------------ | -------------------------- |
| 4-1. Expo Go                  | ◎      | ○                            | ×                        | スマホに Expo Go アプリ    |
| 4-2. iOS シミュレーター       | ○      | ○（場所は手動で指定）        | ○                        | macOS + Xcode              |
| 4-3. Android エミュレーター   | △      | ○（場所は手動で指定）        | ○                        | Android Studio + JDK 17    |
| Web（`npx expo start --web`） | ◎      | △                            | ×                        | ブラウザ（見た目の確認用） |

### 4-1. Expo Go（手軽に画面を確認する）

1. スマホに **Expo Go** をインストールする（App Store / Google Play）。プロジェクトの Expo SDK（58）に対応したバージョンであること
2. Mac とスマホを同じ Wi-Fi につなぐ
3. 開発サーバーを起動し、表示された QR コードをスマホで読み取る

```bash
npx expo start
```

> Expo Go は Expo に含まれるネイティブモジュールしか使えない。バックグラウンド位置情報など、Expo Go に含まれない機能を使うには 4-2 / 4-3 の Development Build が必要。

### 4-2. iOS シミュレーター（macOS のみ）

1. Mac App Store から **Xcode** をインストールする
2. Xcode を開き、**Settings… > Components** の **Platform Support > iOS** で **Get** を押してシミュレーターを入れる
3. **Settings… > Locations** の **Command Line Tools** で最新の Xcode を選ぶ

確認:

```bash
xcodebuild -version   # Xcode xx.x と表示されれば OK
```

ビルドして起動（初回はネイティブのビルドで数分かかる）:

```bash
npx expo run:ios
```

`ios/` ディレクトリが自動生成されるが、git 管理外で、直接編集しない。

**位置情報のテスト**: シミュレーターのメニュー **Features > Location** から現在地を指定できる（Custom Location で緯度経度を入力）。

### 4-3. Android エミュレーター

1. JDK 17 を入れる（React Native のビルドには **17** が必要。それ以外のバージョンが入っていても `JAVA_HOME` で 17 を指定する）

   ```bash
   brew install --cask zulu@17
   ```

2. [Android Studio](https://developer.android.com/studio) を入れる
3. Android Studio の **Settings > Languages & Frameworks > Android SDK** で次を入れる
   - **SDK Platforms** タブ: Android 16（Baklava）の **Android SDK Platform 36** と **Sources for Android 36**
   - **SDK Tools** タブ: **Android SDK Build-Tools** と **Android Emulator**
4. 環境変数を `~/.zshrc` に追加する

   ```bash
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

   ```bash
   source ~/.zshrc
   ```

5. Android Studio の **More Actions > Virtual Device Manager > Create virtual device** でエミュレーターを作り、起動する

確認:

```bash
java -version   # 17.x.x
adb version
adb devices     # 起動中のエミュレーターが表示される
```

ビルドして起動:

```bash
npx expo run:android
```

**位置情報のテスト**: エミュレーター横の **…（Extended controls）> Location** から現在地を指定できる。

> Android エミュレーターから見た `127.0.0.1` はエミュレーター自身を指す。`.env.local` の `EXPO_PUBLIC_SUPABASE_URL` を `http://10.0.2.2:54321` にする（[トラブルシューティング](#アプリから-supabase-につながらない)）。

## 5. 動作確認チェックリスト

すべて通れば環境構築は完了。

```bash
node -v                  # v22.x.x
docker info              # エラーにならない
supabase status          # ローカル Supabase が起動している
npx expo-doctor          # "No issues detected!"
npx tsc --noEmit         # 型チェック
npm run lint             # ESLint
npm run format:check     # Prettier
npx expo start           # アプリが起動し、画面が表示される
```

> 現時点では、テンプレートのサンプル由来のエラーが `npx tsc --noEmit`（`app-tabs.web.tsx`）と `npm run lint`（`use-color-scheme.web.ts`）で1件ずつ出る。これ以外のエラーが出なければ OK。

## トラブルシューティング

### `Cannot connect to the Docker daemon` と出る

Docker Desktop（または OrbStack）が起動していない。アプリを起動してから `supabase start` をやり直す。

### `supabase start` でポートが使われていると出る

別のプロジェクトのローカル Supabase が動いている可能性がある。

```bash
supabase stop --all
supabase start
```

### アプリ起動時に「EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です」と出る

`.env.local` がない、または値が空。[3-2](#3-2-envlocal-に値を記入する) をやり直し、開発サーバーをキャッシュを消して再起動する:

```bash
npx expo start -c
```

### アプリから Supabase につながらない

`127.0.0.1` は「その端末自身」を指すので、Mac 以外から接続すると届かない。`.env.local` の `EXPO_PUBLIC_SUPABASE_URL` を接続元に合わせて変え、`npx expo start -c` で再起動する。

| 接続元                  | `EXPO_PUBLIC_SUPABASE_URL`                                         |
| ----------------------- | ------------------------------------------------------------------ |
| iOS シミュレーター・Web | `http://127.0.0.1:54321`                                           |
| Android エミュレーター  | `http://10.0.2.2:54321`                                            |
| 実機（Expo Go など）    | `http://<Mac の IP アドレス>:54321`（Mac とスマホを同じ Wi-Fi に） |

Mac の IP アドレスは `ipconfig getifaddr en0` で確認できる。

### Expo Go で「プロジェクトの SDK と互換性がない」と出る

Expo Go のバージョンがプロジェクトの SDK（58）と合っていない。Expo Go を最新に更新する。

### `npx expo run:android` で Java のバージョンエラーになる

JDK 17 以外が使われている。`java -version` で確認し、`JAVA_HOME` が zulu-17 を指しているか確認する。

### 依存関係がおかしい・ビルドが通らない

```bash
npx expo-doctor          # 問題を診断
npx expo install --fix   # SDK に合わないバージョンを直す
rm -rf node_modules && npm install
```

## 未整備（決まり次第追記）

- **Google ログイン**: Google Cloud での OAuth クライアント作成と、`supabase/config.toml` への設定がまだ。ローカルでのログインはこれが終わるまで試せない
- **Git フック**: commit-msg / pre-push フック（`./scripts/setup-hooks`）はまだ作っていない
- **EAS Build**: クラウドでのビルド・実機配布の設定はまだ
