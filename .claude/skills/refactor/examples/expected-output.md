# Expected Output — Refactor

---

## ケース1: リファクタリング成功

### 状況
- `create-item.usecase.ts` の複数責務を分割してほしいというリファクタ依頼

### Step 1 出力（目的確認）

```
## リファクタリング目的
- 対象: backend/src/application/item/usecase/create-item/create-item.usecase.ts
- 現在の問題: `create()` メソッドが「重複チェック・INSERT・後処理」を1つのメソッドに詰め込んでいる
- 改善後の期待状態: 各操作を独立した名前付きメソッドに分割し、Controller の呼び出し順でフローが読めるようにする
- 振る舞いへの影響: なし（振る舞いを変えないことを確認）
```

### Step 3 出力（リファクタ前テスト）

```
テスト実行: cd backend && npx vitest run
結果: 全テスト通過（12/12）
→ リファクタリングを開始します
```

### Step 5 出力（リファクタ後テスト）

```
テスト実行: cd backend && npx vitest run
結果: 全テスト通過（12/12）
→ 振る舞いが保たれていることを確認しました
```

### Step 6 出力（型チェック）

```
型チェック: cd backend && npx tsc --noEmit -p .
結果: エラーなし
```

### Step 7 出力（レビュー）

```
## Backend Review 結果

チェック完了。問題なし。

## Architecture Review 結果

チェック完了。問題なし。

## Comments Review 結果

チェック完了。問題なし。
```

---

## ケース2: テストが落ちたため中断

### 状況
- リファクタリング後にテストが失敗した

### Step 5 出力

```
テスト実行: cd backend && npx vitest run
結果: 2件失敗
  - create-item: 重複登録の場合に 409 を返すべきだが 200 が返る
  - create-item: 後処理が2回行われている

→ テストが落ちているため、振る舞いが変わっている可能性があります。
  リファクタリングを見直します。
```

---

## ケース3: 戻り値の型変更に伴い既存テストを追従修正

### 状況
- `get-item.usecase.ts` の戻り値を Entity から Result DTO に変更するリファクタ
- 既存テストが `toBeInstanceOf(GetItemEntity)` を検証していた
- RPC レスポンス型に関わる変更のため、frontend の型チェックと rpc-review も必要

### Step 5 出力（リファクタ後テスト）

```
テスト実行: cd backend && npx vitest run
結果: 全テスト通過（12/12）

承認範囲外のテスト修正:
- test/api/item/service/get-item.service.test.ts
  理由: 戻り値の型変更への追従（toBeInstanceOf(GetItemEntity) → toBeInstanceOf(GetItemResultDto)）。期待値は変更なし
```

### Step 6 出力（型チェック）

```
型チェック: cd backend && npx tsc --noEmit -p .
結果: エラーなし
型チェック: npm run typecheck --prefix frontend
結果: エラーなし（RPC レスポンス型に変化なし）
```

### Step 7 出力（レビュー・追加分）

```
## RPC Review 結果

チェック完了。問題なし。
```

---

## NG 例: 期待値を変えてテストを通す

### 状況
- リファクタ後にテストが落ちたため、期待値 `409` を `200` に書き換えて通した

### 正しい対応

```
テストの期待値（ステータスコード）の変更は許可されていません。
振る舞いが変わっている可能性があるため、リファクタリングを見直します。
```
