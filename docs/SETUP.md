# 環境構築手順

しまんちゅの開発に必要なツールをローカルに入れ、動作を確認するまでの手順。**macOS と Windows の両方に対応**している。
上から順に進めれば、ローカル Supabase につながったアプリがシミュレーター（エミュレーター）で起動するところまでたどり着く。

- 各手順は「**macOS**」「**Windows**」に分けて書いている。自分の OS の方だけ進めればよい
- Windows のコマンドは **PowerShell** で実行する（スタートメニューで「PowerShell」と検索）
- OS に関係ないコマンド（`npm`・`npx`・`supabase`・`git` など）は、macOS はターミナル、Windows は PowerShell でそのまま同じものを実行する

## 0. 全体の流れ

| 手順                                 | 内容                                                                         | 必須          |
| ------------------------------------ | ---------------------------------------------------------------------------- | ------------- |
| [1](#1-共通ツールを入れる)           | パッケージマネージャー・Git・Node.js・Docker・Supabase CLI・VS Code を入れる | ✅            |
| [2](#2-リポジトリを準備する)         | リポジトリを clone し、依存パッケージと環境変数を用意する                    | ✅            |
| [3](#3-ローカル-supabase-を起動する) | ローカル Supabase を起動し、アプリとつなぐ                                   | ✅            |
| [4](#4-アプリを起動する)             | Expo Go・iOS シミュレーター・Android エミュレーターでアプリを起動する        | どれか1つ以上 |
| [5](#5-動作確認チェックリスト)       | 型チェック・Lint などが通ることを確認する                                    | ✅            |

### 使うツール

| ツール                  | 用途                                        | macOS                          | Windows                   | 確認コマンド                          |
| ----------------------- | ------------------------------------------- | ------------------------------ | ------------------------- | ------------------------------------- |
| パッケージマネージャー  | ツールのインストール                        | Homebrew                       | winget（標準搭載）+ Scoop | `brew --version` / `winget --version` |
| Git                     | バージョン管理                              | ✅                             | ✅                        | `git --version`                       |
| Node.js 22              | Expo・npm スクリプトの実行                  | nvm で管理                     | fnm で管理                | `node -v`                             |
| Docker                  | ローカル Supabase の実行                    | Docker Desktop または OrbStack | Docker Desktop（WSL 2）   | `docker info`                         |
| Supabase CLI            | ローカル Supabase・マイグレーション・型生成 | ✅                             | ✅                        | `supabase --version`                  |
| Xcode **26.4 以上**     | iOS シミュレーターでのビルド                | ✅                             | ❌ macOS のみ             | `xcodebuild -version`                 |
| Android Studio + JDK 17 | Android エミュレーターでのビルド            | ✅                             | ✅                        | `adb version` / `java -version`       |
| VS Code                 | エディタ（推奨）                            | ✅                             | ✅                        | —                                     |

> **Windows では iOS シミュレーターを使えない**（Xcode が macOS 専用のため）。Windows の人は Android エミュレーターで開発し、iPhone での確認は Expo Go か、macOS のメンバーに頼む。

参考: 環境構築時点（2026-11-01）に macOS で動作を確認したバージョンは Node.js v22.21.0 / npm 10.9.4 / Supabase CLI 2.122.0 / Docker 29.3.1 / Expo SDK 58 / Xcode 27.2（iOS 26.1 シミュレーター）/ JDK 17 / Android 16 エミュレーター。

## 1. 共通ツールを入れる

### 1-1. パッケージマネージャー

**macOS** — Homebrew を入れる。

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew --version
```

**Windows** — winget は Windows 10/11 に標準で入っている。Supabase CLI 用に Scoop も入れる。

```powershell
winget --version

# Scoop（Supabase CLI のインストールに使う）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
scoop --version
```

### 1-2. Git

**macOS**

```bash
xcode-select --install   # Command Line Tools（Git を含む）。入っていれば「already installed」と出る
```

**Windows**

```powershell
winget install --id Git.Git -e
# インストール後、PowerShell を開き直す
```

**共通** — コミットに使う名前とメールアドレスを設定する（GitHub のアカウントに合わせる）。

```bash
git config --global user.name "GitHubのユーザー名"
git config --global user.email "GitHubに登録したメールアドレス"
git --version
```

> 改行コードはリポジトリの `.gitattributes` で LF に統一しているので、Windows でも `core.autocrlf` の設定を変える必要はない。

### 1-3. Node.js 22

プロジェクトごとに Node.js のバージョンを切り替えられるよう、バージョン管理ツールを使う。リポジトリ直下の `.nvmrc` に `22` と書いてあり、どちらのツールもこれを読む。

**macOS** — [nvm](https://github.com/nvm-sh/nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# ターミナルを開き直してから
nvm install 22
nvm alias default 22
```

**Windows** — [fnm](https://github.com/Schniz/fnm)（`.nvmrc` を読めて、ディレクトリ移動時に自動で切り替わる）

```powershell
winget install Schniz.fnm

# PowerShell の起動時に fnm を有効にする
if (-not (Test-Path $PROFILE)) { New-Item $PROFILE -Force }
Add-Content $PROFILE 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
# PowerShell を開き直してから
fnm install 22
fnm default 22
```

**確認**

```bash
node -v   # v22.x.x
npm -v
```

### 1-4. Docker

ローカル Supabase は Docker のコンテナで動く。インストール後、**アプリを起動しておく**（起動していないと `supabase start` が失敗する）。

**macOS** — Docker Desktop か OrbStack（Supabase が macOS で推奨。軽い）のどちらか。

```bash
brew install --cask orbstack   # または: brew install --cask docker
```

**Windows** — Docker Desktop を WSL 2 で動かす。

```powershell
wsl --install                       # WSL 2 を有効化（初回のみ。終わったら PC を再起動）
winget install --id Docker.DockerDesktop -e
```

Docker Desktop を起動し、**Settings > General** の「Use the WSL 2 based engine」がオンになっていることを確認する。

> 任意: Supabase のローカルログ（Studio の Logs 画面）を使う場合は、Docker Desktop の **Settings > General** で「Expose daemon on tcp://localhost:2375 without TLS」をオンにする。使わなければ不要。

**確認**

```bash
docker info   # Server: の情報が表示されれば OK。"Cannot connect to the Docker daemon" ならアプリが起動していない
```

### 1-5. Supabase CLI

**macOS**

```bash
brew install supabase/tap/supabase
```

**Windows**

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**確認**

```bash
supabase --version
```

更新するときは macOS は `brew upgrade supabase`、Windows は `scoop update supabase`。

### 1-6. VS Code と推奨拡張

**macOS**: `brew install --cask visual-studio-code` ／ **Windows**: `winget install --id Microsoft.VisualStudioCode -e`

リポジトリを開くと右下に「推奨拡張機能をインストールしますか？」と出るのでインストールする。

| 拡張機能   | 用途                                                   |
| ---------- | ------------------------------------------------------ |
| Expo Tools | `app.json` の補完・デバッグ                            |
| ESLint     | Lint エラーをエディタ上に表示                          |
| Prettier   | 保存時に自動整形（`.vscode/settings.json` で設定済み） |

## 2. リポジトリを準備する

### 2-1. clone して develop ブランチに切り替える

> **Windows**: `C:\dev\shimanchu` のように**短いパス**に clone する。Android のビルドはパスが長いと失敗することがある（Windows のパス長の上限 260 文字に引っかかる）。日本語やスペースを含むフォルダも避ける。

**macOS**

```bash
git clone https://github.com/keee0053/shimanchu.git
cd shimanchu
git switch develop
nvm use
```

**Windows**

```powershell
mkdir C:\dev -Force
cd C:\dev
git clone https://github.com/keee0053/shimanchu.git
cd shimanchu
git switch develop
node -v   # fnm が .nvmrc を読んで v22.x.x になっていることを確認
```

作業はここから `feature/PascalCase` のブランチを切って行う（[CONTRIBUTING.md](../CONTRIBUTING.md)）。

### 2-2. 依存パッケージを入れる

```bash
npm install
```

このとき Git フックも自動で有効になり、`✔ Git フックを有効にしました（.githooks/）` と表示される。以降、ルールに沿わないコミットメッセージや、型チェック・Lint が通らない push は自動で止められる（[CONTRIBUTING.md](../CONTRIBUTING.md#git-フックと-ci-による自動チェック)）。

> パッケージを**追加**するときは `npm install <pkg>` ではなく `npx expo install <pkg>` を使う（SDK に合うバージョンが入る）。

### 2-3. 環境変数ファイルを作る

**macOS**

```bash
cp .env.example .env.local
```

**Windows**

```powershell
Copy-Item .env.example .env.local
```

値は次の手順 3 で Supabase を起動してから記入する。`.env.local` は git 管理外なので、コミットされない。

## 3. ローカル Supabase を起動する

ここからのコマンドは macOS / Windows 共通。

### 3-1. 起動

Docker が起動していることを確認してから:

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
npm run gen:types   # src/infrastructure/supabase/database.types.ts が生成される
```

### 3-4. 停止（作業を終えるとき）

> ⚠️ 環境構築の途中では実行しない。このまま手順 4 に進む（Supabase を止めるとアプリから接続できない）。

開発を終えるときに止める:

```bash
supabase stop
```

データはコンテナのボリュームに残るので、次回 `supabase start` で元の状態に戻る。マイグレーションから DB を作り直したいときは `supabase db reset`。

## 4. アプリを起動する

用途と OS に応じて選ぶ。位置情報まわりの開発をするなら 4-2 か 4-3（Development Build）が必要。

| 方法                          | macOS | Windows | 位置情報（フォアグラウンド） | バックグラウンド位置情報 |
| ----------------------------- | ----- | ------- | ---------------------------- | ------------------------ |
| 4-1. Expo Go（スマホ実機）    | ✅    | ✅      | ○                            | ×                        |
| 4-2. iOS シミュレーター       | ✅    | ❌      | ○（場所は手動で指定）        | ○                        |
| 4-3. Android エミュレーター   | ✅    | ✅      | ○（場所は手動で指定）        | ○                        |
| Web（`npx expo start --web`） | ✅    | ✅      | △                            | ×（見た目の確認用）      |

### 4-1. Expo Go（手軽に画面を確認する）

1. スマホに **Expo Go** をインストールする（App Store / Google Play）。プロジェクトの Expo SDK（58）に対応したバージョンであること
2. PC とスマホを同じ Wi-Fi につなぐ
3. **iPhone の場合のみ**: PC で `npx expo login` を実行し、Expo Go アプリでも**同じ Expo アカウント**にサインインする（iPhone の実機で開発サーバーのプロジェクトを開くには、両方が同じアカウントでサインインしている必要がある。Android・シミュレーターでは不要）
4. 開発サーバーを Expo Go 向けに起動し、表示された QR コードをスマホで読み取る

```bash
npx expo start --go
```

> このプロジェクトには `expo-dev-client` が入っているので、`--go` を付けないと Development Build 向けに起動する（Expo Go では開けない）。起動後にターミナルで `s` を押して切り替えることもできる。

> **Windows**: 初回起動時に「Windows セキュリティの重要な警告」で Node.js の通信の許可を求められたら、**プライベート ネットワーク**を許可する。許可しないとスマホから接続できない。
>
> Expo Go は Expo に含まれるネイティブモジュールしか使えない。バックグラウンド位置情報など、Expo Go に含まれない機能を使うには 4-2 / 4-3 の Development Build が必要。

### 4-2. iOS シミュレーター（macOS のみ）

1. Mac App Store から **Xcode** をインストールする。Expo SDK 58 には **Xcode 26.4 以上**が必要（古いと Swift のコンパイルエラー `sending 'slot' risks causing data races` などでビルドが失敗する）。入っている場合も App Store で最新に更新する
2. Xcode を開き、**Settings… > Components** の **Platform Support > iOS** で **Get** を押してシミュレーターを入れる
3. **Settings… > Locations** の **Command Line Tools** で最新の Xcode を選ぶ（ターミナルで行う場合は下のコマンド。Mac のログインパスワードを聞かれる）

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

4. iOS ビルドで使う **CocoaPods** を入れる（Expo の公式手順には書かれていないが、`npx expo run:ios` の中で使われる）

   ```bash
   brew install cocoapods
   ```

確認:

```bash
xcode-select -p         # /Applications/Xcode.app/Contents/Developer（CommandLineTools になっていたら手順 3 をやり直す）
xcodebuild -version     # Xcode 26.4 以上なら OK
xcrun simctl list runtimes   # iOS xx.x が1つ以上表示されれば OK。空なら手順 2 のシミュレーターが入っていない
pod --version
```

> シミュレーターは `xcodebuild -downloadPlatform iOS` でもダウンロードできる（8GB 前後）。

ビルドして起動（初回はネイティブのビルドで数分かかる）:

```bash
npx expo run:ios
```

`ios/` ディレクトリが自動生成されるが、git 管理外で、直接編集しない。

**位置情報のテスト**: シミュレーターのメニュー **Features > Location** から現在地を指定できる（Custom Location で緯度経度を入力）。

### 4-3. Android エミュレーター

#### JDK 17 を入れる

React Native のビルドには **JDK 17** が必要。別のバージョンが入っていても `JAVA_HOME` で 17 を指定すればよい。

**macOS**

```bash
brew install --cask zulu@17
```

> `zulu@17` のインストールでは Mac のログインパスワードを聞かれる。パスワードなしで入れたい場合は `brew install openjdk@17` でもよい（その場合、下の `JAVA_HOME` は `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home` にする）。

**Windows**

```powershell
winget install --id Microsoft.OpenJDK.17 -e
```

#### Android Studio を入れる

**macOS**: `brew install --cask android-studio` ／ **Windows**: `winget install --id Google.AndroidStudio -e`

1. Android Studio を起動し、セットアップで Install Type に **Standard** を選ぶ。Android Virtual Device にもチェックを入れ、ライセンスはすべて同意する
2. **Settings > Languages & Frameworks > Android SDK** で次を入れる
   - **SDK Platforms** タブ: Android 16（Baklava）の **Android SDK Platform 36** と **Sources for Android 36**
   - **SDK Tools** タブ: **Android SDK Build-Tools** と **Android Emulator**

   > このプロジェクト（React Native 0.88）は実際には **SDK Platform 37・Build-Tools 37 / 36・NDK 27.1・CMake 3.22.1** を使う。ライセンスに同意していれば、初回の `npx expo run:android` で Gradle が自動でダウンロードするので、手で入れなくてよい（そのぶん初回のビルドは時間がかかる）。

3. 同じ画面の **Android SDK Location** に表示されるパスを控える（既定は macOS: `~/Library/Android/sdk`、Windows: `%LOCALAPPDATA%\Android\Sdk`）

#### 環境変数を設定する

**macOS** — `~/.zshrc` に追加して読み込み直す。

```bash
cat >> ~/.zshrc <<'EOF'
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
EOF
source ~/.zshrc
```

**Windows** — ユーザー環境変数に設定する（PowerShell で実行後、**PowerShell と VS Code を開き直す**）。

```powershell
# JDK 17 のインストール先（バージョン番号の部分はフォルダ名に合わせる）
Get-ChildItem "C:\Program Files\Microsoft" -Filter "jdk-17*"
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.x.x-hotspot", "User")

# Android SDK
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
```

> 画面で設定する場合: コントロールパネル > ユーザー アカウント > ユーザー アカウント > **環境変数の変更** から、`JAVA_HOME` と `ANDROID_HOME` を新規作成し、`Path` に `platform-tools` と `emulator` のフォルダを追加する。

#### エミュレーターを作って起動する

Android Studio の **More Actions > Virtual Device Manager > Create virtual device** でエミュレーターを作り、▶ で起動する。

> **Windows**: エミュレーターが起動しない・極端に遅い場合は、BIOS で仮想化（Intel VT-x / AMD-V）が有効か、Windows の機能で「Windows ハイパーバイザー プラットフォーム」が有効か確認する。

**確認**

```bash
java -version   # 17.x.x
adb version
adb devices     # 起動中のエミュレーターが表示される
```

**ビルドして起動**

```bash
npx expo run:android   # npm run android でも同じ
```

- **初回は 15〜20 分ほどかかる**（Gradle 本体・ライブラリ・SDK 37・NDK などのダウンロードと、C++ のコンパイルがあるため）。2 回目以降は数十秒で終わる
- `android/` ディレクトリが自動生成されるが、git 管理外で、直接編集しない
- iOS の開発サーバーを同時に動かしている場合はポートがぶつかるので、`npx expo run:android --port 8082` のように別のポートを指定する

**位置情報のテスト**: エミュレーター横の **…（Extended controls）> Location** から現在地を指定できる。

> Android エミュレーターから見た `127.0.0.1` はエミュレーター自身を指す。`.env.local` の `EXPO_PUBLIC_SUPABASE_URL` を `http://10.0.2.2:54321` にする（[トラブルシューティング](#アプリから-supabase-につながらない)）。

## 5. 動作確認チェックリスト

すべて通れば環境構築は完了（macOS / Windows 共通）。

```bash
node -v                  # v22.x.x
docker info              # エラーにならない
supabase status          # ローカル Supabase が起動している
npx expo-doctor          # "No issues detected!"
npx tsc --noEmit         # 型チェック
npm run lint             # ESLint
npm run format:check     # Prettier
git config core.hooksPath  # .githooks（Git フックが有効）
npx expo start           # アプリが起動し、画面が表示される
```

## トラブルシューティング

### `Cannot connect to the Docker daemon` と出る

Docker Desktop（または OrbStack）が起動していない。アプリを起動してから `supabase start` をやり直す。
Windows で Docker Desktop 自体が起動しない場合は、`wsl --status` で WSL 2 が有効になっているか確認する。

### `supabase start` でポートが使われていると出る

別のプロジェクトのローカル Supabase が同じポート（54321〜）で動いている可能性がある。動いているプロジェクトは `docker ps` のコンテナ名（`supabase_db_<プロジェクト名>` など）で分かる。

```bash
docker ps --format '{{.Names}}' | grep supabase_db   # 動いているプロジェクトを確認
supabase stop --project-id <プロジェクト名>            # そのプロジェクトだけ止める（--all で全部止める）
supabase start
```

止めたプロジェクトのデータは Docker のボリュームに残るので、そのプロジェクトのフォルダで `supabase start` すれば元に戻る。

### アプリ起動時に「EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です」と出る

`.env.local` がない、または値が空。[3-2](#3-2-envlocal-に値を記入する) をやり直し、キャッシュを消して開発サーバーを再起動する:

```bash
npx expo start -c
```

### アプリから Supabase につながらない

`127.0.0.1` は「その端末自身」を指すので、PC 以外から接続すると届かない。`.env.local` の `EXPO_PUBLIC_SUPABASE_URL` を接続元に合わせて変え、`npx expo start -c` で再起動する。

| 接続元                  | `EXPO_PUBLIC_SUPABASE_URL`                                       |
| ----------------------- | ---------------------------------------------------------------- |
| iOS シミュレーター・Web | `http://127.0.0.1:54321`                                         |
| Android エミュレーター  | `http://10.0.2.2:54321`                                          |
| 実機（Expo Go など）    | `http://<PC の IP アドレス>:54321`（PC とスマホを同じ Wi-Fi に） |

PC の IP アドレスの調べ方:

- **macOS**: `ipconfig getifaddr en0`
- **Windows**: `ipconfig` を実行し、Wi-Fi の「IPv4 アドレス」を見る

> **Windows** で実機から届かない場合は、Windows ファイアウォールでポート 54321 への受信が許可されているか確認する。

### Expo Go で「プロジェクトの SDK と互換性がない」と出る

Expo Go のバージョンがプロジェクトの SDK（58）と合っていない。Expo Go を最新に更新する。

### `npx expo run:android` で Java のバージョンエラーになる

JDK 17 以外が使われている。`java -version` で確認し、`JAVA_HOME` が JDK 17 のフォルダを指しているか確認する。
Windows で環境変数を変えた直後は、PowerShell・VS Code を開き直さないと反映されない。

### `npx expo run:android` が `Expo stopped waiting for the ADB device property/boot query operation to finish` で終わる

ビルド（`BUILD SUCCESSFUL`）のあと、エミュレーターとの通信が時間切れになった状態。初回の長いビルド中に起こりやすい。エミュレーターが起動していること（`adb devices` に `device` と表示される）を確認して、もう一度 `npx expo run:android` を実行する。ビルド済みなのですぐ終わる。

### Windows で `npx expo run:android` がパスの長さのエラーで失敗する

`Filename longer than 260 characters` などと出る場合は、リポジトリを `C:\dev\shimanchu` のような短いパスに clone し直す。

### Windows で `npm run format:check` が全ファイルでエラーになる

改行コードが CRLF になっている。`.gitattributes` が入る前に clone した場合に起こる。次で LF に直す（⚠️ **未コミットの変更は消える**ので、先にコミットするか `git stash` で退避しておく）:

```powershell
git rm --cached -r .
git reset --hard
```

### PowerShell で「スクリプトの実行が無効になっている」と出る

`npx` や `fnm` が実行ポリシーで止められている。次を一度実行する:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 依存関係がおかしい・ビルドが通らない

```bash
npx expo-doctor          # 問題を診断
npx expo install --fix   # SDK に合わないバージョンを直す
```

それでも直らなければ `node_modules` を消して入れ直す。

**macOS**

```bash
rm -rf node_modules && npm install
```

**Windows**

```powershell
Remove-Item -Recurse -Force node_modules; npm install
```

## 未整備（決まり次第追記）

- **Google ログイン**: Google Cloud での OAuth クライアント作成と、`supabase/config.toml` への設定がまだ。ローカルでのログインはこれが終わるまで試せない
- **EAS Build**: クラウドでのビルド・実機配布の設定はまだ。Windows の人が iOS の Development Build を作るにはこれが必要
