# コーディング規約

Git・PR・レビューのルールは [CONTRIBUTING.md](../CONTRIBUTING.md)、全体の構成は [ARCHITECTURE.md](ARCHITECTURE.md) を参照。
ここではコードの書き方を定める。インデントやクォートなどの見た目は Prettier / ESLint に任せ、ここには書かない。

> ⚠️ **未決定** の印がある項目はまだ決まっていない。決まったらこのファイルを更新すること（一覧は末尾の「未決定事項」）。

## 1. 基本

- コミット前に `npx tsc --noEmit`・`npm run lint`・`npm run format:check` が通ること（pre-push フックと CI でも確認される）
- テスト（`npm test`）は CI だけで実行される。テストを書いた・ルールを変えたときは手元でも `npm test` を通す（[8. テスト](#8-テスト)）
- VS Code では保存時に Prettier で自動整形される（推奨拡張を入れること）
- `any` は使わない。型が分からないときは `unknown` で受けて絞り込む
- クラスは使わず、**関数と型**で書く（DI コンテナやクラス継承は使わない）

## 2. 命名

| 対象                           | 規則                                                  | 例                                           |
| ------------------------------ | ----------------------------------------------------- | -------------------------------------------- |
| ファイル名（すべて）           | ケバブケース                                          | `avatar-card.tsx`, `use-my-groups.ts`        |
| 画面ファイル（`src/app/`）     | ケバブケース（URL になる）                            | `group-settings.tsx` → `/group-settings`     |
| コンポーネント                 | PascalCase                                            | `AvatarCard`                                 |
| フック                         | `use` + PascalCase                                    | `useMyGroups`                                |
| 変数・関数                     | camelCase                                             | `currentArea`, `detectArea`                  |
| 定数（設定値）                 | UPPER_SNAKE_CASE                                      | `LOCATION_UPDATE_INTERVAL_MS`                |
| 型                             | PascalCase                                            | `Group`, `AvatarState`                       |
| リポジトリ（インターフェース） | `<名前>Repository`、ファイルは `<名前>-repository.ts` | `GroupRepository`                            |
| リポジトリ（実装）             | `<技術名><名前>Repository`                            | `supabaseGroupRepository`                    |
| ユースケース                   | `<動詞><名詞>`、ファイルは `<動詞>-<名詞>.ts`         | `updateMyLocation` / `update-my-location.ts` |
| DB のテーブル・カラム          | snake_case、テーブル名は複数形                        | `group_members.user_id`                      |

- `_layout.tsx`、`(tabs)/`、`[id].tsx` などは Expo Router の記法なのでそのまま使う
- 画面ファイルは `export default`（Expo Router の必須ルール）。それ以外は名前付き export（`export function AvatarCard`）

## 3. 層構成（クリーンアーキテクチャ）

責務ごとに4つの層に分け、**依存の向きを一方向に固定する**。中心の domain は React・Expo・Supabase を一切知らない。

```
presentation（src/app・src/presentation） → application → domain ← infrastructure
                         └──────── src/container.ts がすべてをつなぐ ────────┘
```

| 層             | 場所                            | 書くもの                                                                                           | import してよいもの                           |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| domain         | `src/domain/`                   | アプリのルール。エンティティの型、純粋関数（島の判定・漂流判定など）、リポジトリのインターフェース | domain のみ（Zod などの純粋なライブラリは可） |
| application    | `src/application/`              | ユースケース。domain のルールとリポジトリを組み合わせて1つの操作を行う                             | domain                                        |
| infrastructure | `src/infrastructure/`           | 外部とのやり取り。Supabase・expo-location などを使ったリポジトリの実装                             | domain、外部ライブラリ                        |
| presentation   | `src/app/`・`src/presentation/` | 画面・コンポーネント・フック・TanStack Query・Zustand・フォーム                                    | application、domain、`@/container`            |
| （つなぎ役）   | `src/container.ts`              | infrastructure の実装を domain のインターフェースに当てはめ、ユースケースを組み立てる              | すべて                                        |

この依存ルールは **ESLint（`eslint.config.js`）で強制**している。違反すると `npm run lint`・pre-push・CI で止まる。

```
src/
├── app/                      # 画面のみ（Expo Router）
├── presentation/
│   ├── components/           # UI コンポーネント
│   ├── hooks/                # UI 用のフック
│   ├── queries/              # TanStack Query のフックと queryKey（ドメインごとに1ファイル）
│   ├── stores/               # Zustand のストア
│   ├── schemas/              # フォーム入力の Zod スキーマ
│   ├── constants/            # テーマなど UI の定数
│   └── query-client.ts
├── application/              # ユースケース（1ファイル1ユースケース）
├── domain/
│   ├── entities/             # エンティティの型
│   ├── services/             # ルール（純粋関数）
│   └── repositories/         # リポジトリのインターフェース（型だけ）
├── infrastructure/
│   ├── supabase/             # client.ts、database.types.ts（自動生成）、<名前>-repository.ts
│   └── location/             # expo-location・expo-task-manager を使った実装、位置情報の定数
└── container.ts              # 依存の組み立て
```

### コード量を増やしすぎないための決まり

- **ロジックがない単純な取得・更新は、ユースケースを作らない。** presentation のフックから `@/container` のリポジトリを直接呼んでよい
- **ユースケースはロジックがあるときだけ作る**（例: 島を判定してから保存する、複数のリポジトリをまたぐ）
- 依存はクラスではなく**関数の引数**で渡す（下の例を参照）

## 4. データの取得と更新

### 単純な取得（ユースケースなし）

```ts
// src/domain/entities/group.ts
export type Group = { id: string; name: string };

// src/domain/repositories/group-repository.ts
import type { Group } from '../entities/group';
export type GroupRepository = {
  findMine(): Promise<Group[]>;
};

// src/infrastructure/supabase/group-repository.ts
import type { GroupRepository } from '@/domain/repositories/group-repository';
import { supabase } from './client';
export const supabaseGroupRepository: GroupRepository = {
  async findMine() {
    const { data, error } = await supabase.from('groups').select('id, name');
    if (error) throw error;
    return data; // DB の行 → エンティティへの変換が必要ならここで行う
  },
};

// src/container.ts
export const groupRepository: GroupRepository = supabaseGroupRepository;

// src/presentation/queries/groups.ts
import { groupRepository } from '@/container';
export const groupKeys = {
  all: ['groups'] as const,
  members: (groupId: string) => ['groups', groupId, 'members'] as const,
};
export function useMyGroups() {
  return useQuery({ queryKey: groupKeys.all, queryFn: () => groupRepository.findMine() });
}
```

### ロジックがある操作（ユースケースあり）

```ts
// src/domain/services/island.ts … ルール（純粋関数。テストしやすい）
export function detectIsland(coords: Coords | null, places: Place[]): IslandType { ... }

// src/application/update-my-location.ts … 依存は引数で受け取る
import type { LocationRepository } from '@/domain/repositories/location-repository';
import { detectIsland } from '@/domain/services/island';
export function createUpdateMyLocation(deps: { locationRepository: LocationRepository }) {
  return async (coords: Coords | null, places: Place[]) => {
    await deps.locationRepository.saveMyIsland(detectIsland(coords, places)); // 座標は送らない
  };
}

// src/container.ts
export const updateMyLocation = createUpdateMyLocation({ locationRepository: supabaseLocationRepository });

// src/presentation/queries/location.ts
export function useUpdateMyLocation() {
  return useMutation({ mutationFn: (input: { coords: Coords | null; places: Place[] }) => updateMyLocation(input.coords, input.places) });
}
```

（上の位置情報の例は書き方の説明用。何を保存するかは「6. 位置情報」を参照）

### Supabase のルール（infrastructure の中だけで使う）

- `supabase` クライアント（`src/infrastructure/supabase/client.ts`）は infrastructure の外から import しない
- `{ data, error }` の `error` は必ず確認して `throw` する（TanStack Query がエラー状態として扱える）
- `select('*')` ではなく、使うカラムを書く
- queryKey はドメインごとに `xxxKeys` オブジェクトで定義し、文字列を直接書かない

### 型

- **DB の行の型は手で書かない。** マイグレーションを追加したら `npm run gen:types` で `src/infrastructure/supabase/database.types.ts` を再生成してコミットする（ローカル Supabase の起動が必要）。infrastructure の中で `Tables<'groups'>` のように使う
- **エンティティの型（`src/domain/entities/`）は、アプリが必要な項目だけを手で定義する。** domain は自動生成の型（infrastructure）に依存できないため。DB の行とずれる場合は、リポジトリの実装で変換する

### マイグレーションと RLS

[CONTRIBUTING.md の DB ルール](../CONTRIBUTING.md#dbsupabase) に従う。RLS のポリシーは「誰が」「どの行を」読める・書けるかを SQL のコメントで書いておく。

## 5. 状態管理（TanStack Query と Zustand）

すべて presentation 層の中の話。

| データ                           | 置き場所                                      | 例                                             |
| -------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| サーバー（DB）から取ってくるもの | TanStack Query（`src/presentation/queries/`） | 所属グループ、メンバー、友達の居場所           |
| 端末内だけの状態                 | Zustand（`src/presentation/stores/`）         | 選択中のグループ、開いている建物、島の表示方式 |
| 1画面の中だけで使う状態          | `useState`                                    | モーダルの開閉、入力途中の値                   |

- サーバーのデータを Zustand にコピーしない（二重管理になり、更新漏れの原因になる）
- ログイン状態（セッション）は認証用のリポジトリ（`AuthRepository`）経由で扱う。必要なら変化を Zustand に反映する
- Zustand のストアは `src/presentation/stores/<名前>-store.ts`、フックは `use<名前>Store`。値は selector で必要なものだけ取り出す（`useIslandStore((s) => s.selectedBuildingId)`）

### Realtime

- **方式は Postgres Changes**（#48）。届いてよい相手は RLS で決まるので、別の権限の仕組みを作らない。人数が増えて重くなったら、DB から配信する Broadcast に移る
- **島の画面を開いている間だけ**、チャンネルを1つ購読する（#48）
  - `user_presence` の変更（RLS で、自分が見てよい人の分だけが届く）と、今のグループの `group_members` の変更（`group_id` で絞る）
  - 受け取った変更のうち、今のグループの人の分だけを画面で使う
  - ほかの画面に移ったときやバックグラウンドでは購読を外し、戻ったときに取り直す
- 購読の処理は **infrastructure のリポジトリに実装**し、「購読解除の関数」を返す形にする（例: `subscribeToIsland(groupId, onChange): () => void`）。中で `supabase.channel(...)` を使い、解除時に `supabase.removeChannel(channel)` する
- presentation のフックは `useEffect` の中で購読し、クリーンアップで解除関数を呼ぶ
- 受け取った変更は `queryClient.setQueryData` または `invalidateQueries` で TanStack Query のキャッシュに反映する（Zustand には入れない）
- チャンネル名は `<対象>:<id>` 形式（例: `group:<groupId>`）

## 6. 位置情報

- **MVP はフォアグラウンドのみで実装する。** バックグラウンドは MVP 後に、家と学校のジオフェンス（入った・出た）で導入する（#47）。「常に許可」の権限・`app.json` の権限文言・ストア審査での説明が必要になる
- **フォアグラウンドでの更新タイミング**（#47）: 起動時とアプリに戻ってきたときに取得する。開いている間は100m以上動いたら判定し直す。島が変わらなくても15分ごとに upsert する
- **精度**（#47）: `Accuracy.Balanced`（約100m）。地図で場所を登録するときだけ `High` を使う
- `expo-location`・`expo-task-manager` は **`src/infrastructure/location/` の中だけで使う**（presentation からの import は ESLint で禁止）。domain に位置取得のインターフェースを置き、infrastructure で実装する
- 上の精度（accuracy）・更新間隔・距離のしきい値は `src/infrastructure/location/constants.ts` に定数として置く（バッテリー消費に直結するため、散らばらせない）
- **島の判定・漂流の判定は domain の純粋関数にする**（`src/domain/services/`）。位置が取れない・権限がないときに「漂流」状態にするのも domain のルール（エラー画面にしない）
- 権限は使う直前に要求する
- `TaskManager.defineTask` はコンポーネントの中ではなく `src/infrastructure/location/` のファイルのトップレベルで呼び、そのファイルを `src/container.ts` で import する（container はルートの `_layout.tsx` から読み込まれるので、アプリ起動時に登録される）
- 座標を `console.log` などのログに出さない
- **座標は DB に保存せず、サーバーにも送らない。** 島は端末で判定し、`user_presence` に島の種類（`island_type`）だけを upsert する
  - 島の種類: `home`（家）/ `school`（学校）/ `outside`（外出中: 位置は取れたが登録した場所のどこにもいない）/ `drifting`（漂流: 位置が取れない・権限がない）
  - 表示はユーザーごとの場所に関係なく共通の島にする（誰の学校でも同じ「学校島」）
- 自宅・学校など、ユーザーが登録した場所の座標は**端末の中だけ**に保存する（サーバーには送らない。機種変更時は登録し直し）
- 端末からの更新が止まった友達（`user_presence.updated_at` から24時間以上）は、表示する側で漂流として扱う。しきい値は domain の定数にする。最終更新は、島でアバターを押したときの簡易プロフィールに「3時間前」のように出す（島の上には出さない: #47）
- そのため、島が変わらなくても定期的に `user_presence` を upsert する。更新間隔は24時間より十分短い値にし、`src/infrastructure/location/constants.ts` に定数として置く。同じ `island_type` での upsert でも、DB のトリガーで `updated_at` は現在時刻に更新される（移動履歴は島が変わったときだけ記録される）
- 島の移動履歴（`presence_history`）は DB のトリガーが記録する。アプリから書き込まない
- **島の判定**（#29）
  - 家と学校は、それぞれ1つだけ登録できる。その場所にいるときに現在地で登録し、地図でピンを動かして直せる
  - 登録した点から半径以内なら、その島にいるとみなす。半径は本人が小・中・大（100m / 200m / 500m。初期値は 200m）から選ぶ。値は domain の定数にする
  - 境目で出入りを繰り返さないよう、島から出たかどうかは半径に余裕を足して判定する（余裕の幅も domain の定数にする）
  - 家と学校の範囲が重なっているときは、中心が近い方の島にする。どちらにも入らなければ `outside`
- **島の表示**（#29）
  - 海の上に「自宅の島」「学校の島」「外出中の島」を並べ、漂流中の人は島の周りの海に浮かべる。最初は全体を見せ、島を押すとその島を大きく表示する
  - 描画は `react-native-svg`、ズームとアバターの動きは `react-native-reanimated` と `react-native-gesture-handler` で行う
  - 同じ島のアバターは、重ならないように散らす。位置はユーザー ID から決め、開くたびに変わらないようにする。入りきらないときは「+N」を出し、押すと一覧を出す
  - 島を公開していない友達は出さない。「非公開」のエリアは作らない（#63）

## 7. フォーム

- React Hook Form + Zod（`zodResolver`）で書く
- フォーム入力のスキーマは `src/presentation/schemas/<名前>.ts` に置き、型は `z.infer` で作る（型を別に手書きしない）
- 「ニックネームは1〜20文字」のような**アプリのルールそのもの**は domain に定数・関数として置き、スキーマからそれを使う
- エラーメッセージはスキーマ側に日本語で書く
- `TextInput` は `Controller` 経由でつなぐ

```ts
// src/domain/entities/profile.ts
export const NICKNAME_MAX_LENGTH = 20;

// src/presentation/schemas/profile.ts
export const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, 'ニックネームを入力してください')
    .max(NICKNAME_MAX_LENGTH, `${NICKNAME_MAX_LENGTH}文字以内で入力してください`),
});
export type ProfileInput = z.infer<typeof profileSchema>;
```

## 8. テスト

- 仕組みは `jest-expo`（Expo の推奨）。`npm test` で実行する
- **壊れると困る domain のルールだけ書く**（年齢の計算、18歳以上の判定、島の判定、漂流の判定など）。ユースケース・画面のテストは書かなくてよい。カバレッジの目標は設けない
  - CodeRabbit のレビューは差分しか読まず、コードを実行もしないので、計算の正しさや、変えていないところが壊れたことには気づきにくい。そこをテストで補う
- テストは AI（Claude Code など）に書かせてよい。ただし、中身が仕様どおりか（期待する値が正しいか）は人が確かめる
- 実行するのは **CI だけ**。push を遅くしないよう、pre-push フックには入れない
- テストのファイルは、テストする関数の近くの `__tests__/` に `<名前>-test.ts` で置く
- `describe` / `it` / `expect` はグローバルのまま使う（import しない）。テスト名は日本語で、何を確かめるかを書く
- 境界の値（ちょうど18歳になる日、島の範囲の端など）を必ず入れる

```ts
// src/domain/services/__tests__/age-test.ts
import { calculateAge } from '@/domain/services/age';

describe('calculateAge', () => {
  it('誕生日の前日はまだ年を取らない', () => {
    expect(calculateAge(new Date('2008-04-01'), new Date('2026-03-31'))).toBe(17);
  });
  it('誕生日の当日に年を取る', () => {
    expect(calculateAge(new Date('2008-04-01'), new Date('2026-04-01'))).toBe(18);
  });
});
```

## 未決定事項

決まったら該当する節を書き換え、この一覧から消すこと。

| 項目                                 | 選択肢                                                                                                                                                                                            | 影響する箇所                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 認証セッション（トークン）の保存方法 | 今は `AsyncStorage`（暗号化なし）。`expo-secure-store` で暗号鍵を守り、暗号化したセッションを `AsyncStorage` に保存する方式（Supabase の推奨例）に変える。Google ログインを実装する PR で対応する | `src/infrastructure/supabase/client.ts`、認証の実装 |
