# コーディング規約

Git・PR・レビューのルールは [CONTRIBUTING.md](../CONTRIBUTING.md) を参照。
ここではコードの書き方を定める。インデントやクォートなどの見た目は Prettier / ESLint に任せ、ここには書かない。

> ⚠️ **未決定** の印がある項目はまだ決まっていない。決まったらこのファイルを更新すること（一覧は末尾の「未決定事項」）。

## 1. 基本

- コミット前に `npx tsc --noEmit`・`npm run lint`・`npm run format:check` が通ること
- VS Code では保存時に Prettier で自動整形される（推奨拡張を入れること）
- `any` は使わない。型が分からないときは `unknown` で受けて絞り込む

## 2. 命名

| 対象                                               | 規則                           | 例                                       |
| -------------------------------------------------- | ------------------------------ | ---------------------------------------- |
| ファイル名（コンポーネント・フック・その他すべて） | ケバブケース                   | `avatar-card.tsx`, `use-groups.ts`       |
| 画面ファイル（`src/app/`）                         | ケバブケース（URL になる）     | `group-settings.tsx` → `/group-settings` |
| コンポーネント                                     | PascalCase                     | `AvatarCard`                             |
| フック                                             | `use` + PascalCase             | `useGroups`                              |
| 変数・関数                                         | camelCase                      | `currentArea`, `fetchGroups`             |
| 定数（設定値）                                     | UPPER_SNAKE_CASE               | `LOCATION_UPDATE_INTERVAL_MS`            |
| 型                                                 | PascalCase                     | `Group`, `AreaType`                      |
| DB のテーブル・カラム                              | snake_case、テーブル名は複数形 | `group_members.user_id`                  |

- `_layout.tsx`、`(tabs)/`、`[id].tsx` などは Expo Router の記法なのでそのまま使う
- 画面ファイルは `export default`（Expo Router の必須ルール）。それ以外は名前付き export（`export function AvatarCard`）

## 3. ディレクトリ

```
src/
├── app/          # 画面のみ（Expo Router）
├── components/   # UI コンポーネント
├── hooks/        # 汎用カスタムフック
├── api/          # Supabase へのアクセスと TanStack Query のフック（ドメインごとに1ファイル）
├── stores/       # Zustand のストア
├── schemas/      # Zod スキーマ
├── tasks/        # バックグラウンドタスク（expo-task-manager）
├── constants/    # 定数
├── types/        # 型定義（database.ts は自動生成）
└── lib/          # 外部サービスのクライアント初期化（supabase.ts, query-client.ts）
```

## 4. Supabase

### アクセスは `src/api/` に集める

画面やコンポーネントから `supabase.from(...)` を直接呼ばない。`src/api/<ドメイン>.ts` に取得・更新処理と TanStack Query のフックをまとめ、画面はフックだけを使う。

```ts
// src/api/groups.ts
export const groupKeys = {
  all: ['groups'] as const,
  members: (groupId: string) => ['groups', groupId, 'members'] as const,
};

async function fetchMyGroups() {
  const { data, error } = await supabase.from('groups').select('id, name');
  if (error) throw error;
  return data;
}

export function useMyGroups() {
  return useQuery({ queryKey: groupKeys.all, queryFn: fetchMyGroups });
}
```

- `{ data, error }` の `error` は必ず確認して `throw` する（TanStack Query がエラー状態として扱える）
- `select('*')` ではなく、使うカラムを書く
- queryKey はドメインごとに `xxxKeys` オブジェクトで定義し、文字列を直接書かない

### 型は自動生成する

- マイグレーションを追加したら `npm run gen:types` で `src/types/database.ts` を再生成してコミットする（ローカル Supabase の起動が必要）
- テーブルの型を手で書かない。`Tables<'groups'>` のように生成された型から取る

### マイグレーションと RLS

[CONTRIBUTING.md の DB ルール](../CONTRIBUTING.md#dbsupabase) に従う。RLS のポリシーは「誰が」「どの行を」読める・書けるかを SQL のコメントで書いておく。

## 5. 状態管理（TanStack Query と Zustand）

| データ                           | 置き場所       | 例                                             |
| -------------------------------- | -------------- | ---------------------------------------------- |
| サーバー（DB）から取ってくるもの | TanStack Query | 所属グループ、メンバー、友達の居場所           |
| 端末内だけの状態                 | Zustand        | 選択中のグループ、開いている建物、島の表示方式 |
| 1画面の中だけで使う状態          | `useState`     | モーダルの開閉、入力途中の値                   |

- サーバーのデータを Zustand にコピーしない（二重管理になり、更新漏れの原因になる）
- ログイン状態（セッション）は Supabase Auth が持つ。必要なら `supabase.auth.onAuthStateChange` で Zustand に反映する
- Zustand のストアは `src/stores/<名前>-store.ts`、フックは `use<名前>Store`。値は selector で必要なものだけ取り出す（`useIslandStore((s) => s.selectedBuildingId)`）

### Realtime

- 購読は `useEffect` の中で開始し、クリーンアップで必ず `supabase.removeChannel(channel)` する
- 受け取った変更は `queryClient.setQueryData` または `invalidateQueries` で TanStack Query のキャッシュに反映する（Zustand には入れない）
- チャンネル名は `<対象>:<id>` 形式（例: `group:<groupId>`）
- Realtime の購読処理も `src/api/` に置く（例: `useGroupLocationSubscription(groupId)`）

## 6. 位置情報

- **まずはフォアグラウンドのみで実装する。** バックグラウンド取得は必要性が固まってから追加する（⚠️ **未決定**: 導入時期）
- `expo-location` の呼び出しは位置情報用のフック・タスクにまとめ、画面から直接呼ばない
- 精度（accuracy）・更新間隔・距離のしきい値は `src/constants/location.ts` に定数として置く（バッテリー消費に直結するため、散らばらせない）
- 権限は使う直前に要求する。拒否・取得失敗のときは「漂流」状態として扱う（仕様どおり、エラー画面にしない）
- `TaskManager.defineTask` はコンポーネントの中ではなく `src/tasks/` のファイルのトップレベルで呼び、そのファイルをルートの `_layout.tsx` で import する（アプリ起動時に登録されていないと動かない）
- 座標を `console.log` などのログに出さない
- ⚠️ **未決定**: DB に何を保存するか（下の「未決定事項」参照）

## 7. フォーム

- React Hook Form + Zod（`zodResolver`）で書く
- スキーマは `src/schemas/<名前>.ts` に置き、型は `z.infer` で作る（型を別に手書きしない）
- エラーメッセージはスキーマ側に日本語で書く
- `TextInput` は `Controller` 経由でつなぐ

```ts
// src/schemas/profile.ts
export const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, 'ニックネームを入力してください')
    .max(20, '20文字以内で入力してください'),
});
export type ProfileInput = z.infer<typeof profileSchema>;
```

## 未決定事項

決まったら該当する節を書き換え、この一覧から消すこと。

| 項目                               | 選択肢                                                                                                                                        | 影響する箇所                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 位置情報の保存形式                 | ① 端末でエリア判定し、エリア ID だけ保存 ② 緯度経度を保存し PostGIS で判定 ③ 緯度経度は本人だけ読めるテーブルに保存し、友達にはエリアだけ公開 | DB 設計、RLS、`src/api/`、位置情報の送信処理    |
| Realtime の方式                    | Postgres Changes のまま／位置の更新は Broadcast で流し、一定間隔で DB に保存するハイブリッド                                                  | Realtime の購読処理、DB の書き込み頻度          |
| バックグラウンド位置情報の導入時期 | フォアグラウンドのみで作り、必要性が固まったら追加                                                                                            | `src/tasks/`、`app.json` の権限設定、ストア審査 |
| Sign in with Apple への対応        | Google ログインを置く場合、iOS の審査で求められることがある                                                                                   | 認証画面、Supabase Auth の設定                  |
| テスト方針                         | テストの仕組み（Jest など）と書く範囲                                                                                                         | `test:` コミット、pre-push フック               |
