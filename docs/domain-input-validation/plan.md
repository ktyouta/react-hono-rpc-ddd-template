# 入力値検証のドメイン移行

## 概要

外部入力の値の制約（文字数・形式・範囲など）を zod スキーマからドメイン（値オブジェクト）へ移し、制約違反を Result（err）で返す。zod スキーマは型・JSON 構造の検証のみにする。利用者向けのメッセージはプレゼンテーション層が決める。

対象は sample・user・auth の全コンテキスト。本移行の後に、auth コンテキストを user コンテキストへ統合する（`docs/user-auth-merge/plan.md`）。

移行前の問題：

- 値の制約が zod スキーマにのみ書かれており、ドメインが守っていない（`UserName` は空でないことのみ、`UserBirthday` は zod と VO の二重管理）
- 型・構造の違反時に zod のメッセージをそのまま返している（`formatZodErrors`）
- `errorHandler` が Hono の `HTTPException` の英語の開発者向けメッセージをそのまま返している
- Usecase の戻り値が `null`・`boolean`・`{ status }` と混在している

## 決定事項

### ユーザー決定事項

- バリデーションルールをドメインに移行する。その後 auth を user に統合する
- 対象に sample を含める（テンプレートのリファレンス実装のため）
- Result 型は neverthrow を導入する
- `validatorMiddleware` の導入・`errorHandler` の `HTTPException` メッセージ非返却・トップの `message` の「入力エラー」への統一も含める
- 設計書を作成し、Phase ごとに進める
- 以下の方針で進める
  - throw / err の基準：
    - **err**: 原因が外部入力にあるもの（通常操作か、リクエスト改ざんかを問わない）
    - **throw**: 原因が自分たちのコードにあるもの（不具合・障害・自分たちの取得処理で除外済みのはずの状態）
  - 値オブジェクトは private コンストラクタ + `create`（Result）の形にする。`of`（throw）は、DB 等の信頼できる値から生成する必要がある場合にのみ置く（形を揃えるためだけに置かない）
  - エラーは値オブジェクトごとにドメインの言葉（コード）で型定義し、利用者向けメッセージはプレゼンテーション層で決める（VO にメッセージを直書きしない）。コード名は VO 名を接頭辞にし、全体で一意にする
  - メッセージ変換関数はコンテキストごとに `presentation/{コンテキスト}/error-message/input/input.error-message.ts`（`toInputErrorMessage`）に置く。パスワードの方針の文言が user と auth で重複することは許容する
  - トップの `message` は全 API で「入力エラー」にそろえる（zod の型・構造の違反を含む）
  - zod の型・構造の違反は zod のメッセージを返さず、`{ message: "入力エラー", data: [{ field, message: "入力形式が不正です" }] }`（422）で返す。`zValidator` を固定のフックで包んだ `validatorMiddleware`（`middleware/validator/`）を全 API で使い、`formatZodErrors`・`ValidationErrorType` は削除する
  - `errorHandler` は `HTTPException` のメッセージを返さない。ステータスは維持し、400 は「入力エラー」、それ以外は「予期しないエラーが発生しました。」にする（元のメッセージはログに残す）
  - 確認用パスワードの一致はサーバーでも判定する。置き場所は Usecase。違反は `INVALID_INPUT`（`field: "confirmPassword"`、`PASSWORD_CONFIRMATION_MISMATCH`）で他の違反とまとめて返す
  - ユーザー名は 3〜30 文字を `UserName.create` で判定する
  - ログインは「〜を入力してください」のみを返し、ユーザー名の文字数は適用しない。ログインのユーザー名は `LoginName`（空でないのみ）で判定する
  - 照合用のパスワード（ログイン・パスワード変更の現在のパスワード）は `RawPassword`（空でないのみ）で判定する。`RAW_PASSWORD_EMPTY` の文言は「パスワードを入力してください」にそろえる
  - 新しく設定するパスワードの方針（8文字以上・半角英数記号）は `NewPassword` で判定する。ハッシュ済みの値を表す `UserPassword` は流用しない
  - `UserLoginEntity.verifyPassword` は `RawPassword`、`hashNewPassword` は `NewPassword` を受け取る。`IUserLoginRepository.getLoginUser` は `LoginName` を受け取る
  - user・auth の Usecase は neverthrow の Result を返す。引数はオブジェクト（`{ body }`・`{ userId, body }`）にする
  - `UserName` の `of` は Repository が DB の値から生成するため置く。`UserBirthday`・`NewPassword`・`LoginName`・`RawPassword` は DB の値から生成する箇所がないため `of` を置かない
  - `LoginUsecase` は `INVALID_INPUT`（空の入力）・`AUTHENTICATION_FAILED`（ユーザーなし・パスワード不一致・プロフィールなし。応答は従来どおり 401）を返す
  - `UpdatePasswordUsecase` は `INVALID_INPUT`・`CURRENT_PASSWORD_MISMATCH`・`NOT_FOUND`（応答はどちらも従来どおり 401）を返す
  - throw / err の基準・zod の役割・メッセージの置き場所を CLAUDE.md（バックエンド固有の設計指針「入力値検証とエラーの扱い」）に明記する

### Claudeの提案をユーザーが承認したもの

| 項目 | 提案 | 理由 |
|---|---|---|
| T1: sample のパスパラメータ `id` | zod は `z.string()` のみ。`SampleId.create`（1以上の整数の文字列）で判定し、違反は Usecase が DB を問い合わせずに `NOT_FOUND`（404）を返す。移行前は 400「パラメータが不正です。」 | 形式が不正な ID は存在しない ID として扱う。sample の ID は数値のため、判定せずに DB に渡すことはできない（`Number("abc")` が `NaN` になる） |
| T2: sample の値オブジェクト | `SampleName`（1〜100文字）・`SampleDescription`（500文字以内）を新設する。制約は移行前の zod と同じにし、前後の空白の除去は行わない | 振る舞いを変えない |
| T3: sample の Repository の入力 | `CreateSampleInput`・`UpdateSampleInput`・`findById`・`delete` の引数を VO にする。DB から生成する Entity は変更しない（プリミティブのまま）ため、VO に `of` は置かない | 「`of` は必要な場合にのみ置く」に従う。Entity の VO 化は今回の目的外 |
| T4: sample の Usecase の戻り値 | 作成: `INVALID_INPUT`、更新: `INVALID_INPUT`・`NOT_FOUND`、取得: `NOT_FOUND`、削除: `NOT_FOUND` を err で返す Result にする。一覧取得は変更しない | user・auth の Usecase を Result にするため、リファレンス実装の形をそろえる |
| T5: Phase の順序 | 共通 → sample → auth → user の順にする | auth を先に移行すれば、`LoginUsecase` が `new UserName` を使わなくなり、user の移行中に暫定対応が要らない |
| T6: パスワード変更のテストデータ | `user-password.controller.test.ts` のログインID（`login-${ulid}`、32文字）を、ユーザーID（ULID、26文字）にする | user の Phase で Repository が `UserName.of` で生成するようになり、30 文字超は throw するため。アプリから登録したデータでは起きない |

### 未決定（次回以降に決める）

なし

### 実装時に Claude が判断したもの（未承認）

- `UpdatePasswordUsecase`・`UpdateUserUsecase` の `userId` は文字列ではなく `UserId` で受け取る（Controller は `user.userId` を渡す）。本移行の対象外の `UpdateUserDarkModeUsecase`・`DeleteUserUsecase` は文字列のまま（auth の統合時にそろえる）
- `createSample` Controller はエラー種別が `INVALID_INPUT` のみのため、`switch` と `satisfies never` を使わずに分岐した（単一の型では `switch` で `never` に絞り込まれず、型エラーになるため）

## 設計

### 層ごとの責務

| 層 | 責務 | 持たないもの |
|---|---|---|
| presentation（zod） | 型・JSON 構造の検証、エラーコード→メッセージ変換、レスポンス整形 | 業務ルール |
| application（Usecase） | VO 生成とエラーの収集・項目名（`field`）の付与、確認用パスワードの一致の判定、DB を要する判定、処理の流れ | 業務ルール、メッセージ |
| domain（VO） | 業務ルールの判定、エラーのコード表現 | 画面の文言、項目名 |

### 値オブジェクト

```ts
type SampleNameError = { type: "SAMPLE_NAME_EMPTY" } | { type: "SAMPLE_NAME_TOO_LONG"; max: number };

class SampleName {
  private constructor(...)
  static create(value: string): Result<SampleName, SampleNameError> // 外部入力から生成。制約はここにだけ書く
}
```

### Usecase

1. 入力から VO を `create` で生成し、`Result.combineWithAllErrors` で違反をすべて集める。違反があれば `{ type: "INVALID_INPUT"; errors: { field, error }[] }` を返す（この時点では DB を問い合わせない）
2. DB を要する判定（存在・重複など）
3. 保存

- `field` は入力の項目名（zod の `path.join(".")` と同じ形式）
- 契約の `@throws` は「コードの不具合」のみになる

### プレゼンテーション

- `INVALID_INPUT` は `{ message: "入力エラー", data: [{ field, message }] }`（422）で返す。zod の型・構造の違反と同じ形
- Controller の err の分岐・メッセージ変換関数は `satisfies never` で網羅性を保証する

### API ごとの応答の変化

| API | 変更前 | 変更後 |
|---|---|---|
| 全 API の zod 違反 | 422 / 400、`message`「バリデーションエラー」等、`data` に zod のメッセージ | 422、`message`「入力エラー」、`data` に固定メッセージ「入力形式が不正です」 |
| 値の制約違反 | zod の 422（「バリデーションエラー」） | Usecase の `INVALID_INPUT` で 422（「入力エラー」）。項目ごとのメッセージは移行前の zod の文言を引き継ぐ |
| 生年月日が形式は正しいが実在しない日付（`20230230` 等） | zod を通過し、`UserBirthday` のコンストラクタが throw して 500 | 422、「生年月日は実在する日付を入力してください」 |
| sample の `id` が数値でない（T1） | 400「パラメータが不正です。」 | 404「サンプルが見つかりません。」 |
| `HTTPException`（壊れた JSON 等） | 英語のメッセージ | 400 は「入力エラー」、それ以外は「予期しないエラーが発生しました。」 |

- 成功時の応答・RPC の型は変わらない
- フロントエンドはトップの `message` のみを表示しており、`data` は使っていないため変更不要。ただし表示される文言は「バリデーションエラー」から「入力エラー」に変わる（フロントエンドでも同じ制約を検証しているため、通常の操作では表示されない）

### 破綻ケース

- 項目の組み合わせによるルール（開始日 ≤ 終了日など）が増えた場合: VO でも集約でもない判定の置き場所が必要になる
- 同じ入力変換を複数の入口から使う場合: Usecase の手順1をドメインの入力変換クラスに切り出す必要がある
- DB に、新しく VO に入れる制約を満たさない既存データがある場合: Repository の `of` が throw して 500 になる（`UserName` の 3〜30 文字。API から登録したデータは zod で同じ制約を満たしている。seed にユーザーデータはない）

## 変更・影響ファイル一覧

パスは `backend/src/` からの相対パス。各ファイルの `index.ts` の追加・変更は省略する。

### Phase 0: 共通

| ファイルパス | 操作 |
|---|---|
| `backend/package.json` | 変更（neverthrow を追加） |
| `middleware/validator/validator.middleware.ts`（+ テスト） | 新規 |
| `middleware/error-handler/error-handler.middleware.ts`（+ テスト） | 変更 |
| `util/validation/`・`types/api-response/` | Phase 3 の完了時に削除（使われなくなった時点） |

### Phase 1: sample

| ファイルパス | 操作 |
|---|---|
| `domain/sample/value-object/sample-id/sample-id.ts`（+ テスト） | 新規 |
| `domain/sample/value-object/sample-name/sample-name.ts`（+ テスト） | 新規 |
| `domain/sample/value-object/sample-description/sample-description.ts`（+ テスト） | 新規 |
| `domain/sample/repository/{create,update,get,delete}-sample/*.repository.interface.ts` | 変更（引数を VO に） |
| `infrastructure/sample/repository/{create,update,get,delete}-sample/*.repository.ts` | 変更 |
| `application/sample/usecase/{create,update,get,delete}-sample/*.usecase.ts`（+ テスト） | 変更（Result 化） |
| `presentation/sample/schema/*/*.schema.ts`（+ テスト） | 変更（型・構造のみ） |
| `presentation/sample/error-message/input/input.error-message.ts` | 新規 |
| `presentation/sample/controller/{create,update,get,delete}-sample/*.controller.ts` | 変更 |

### Phase 2: auth

| ファイルパス | 操作 |
|---|---|
| `domain/auth/value-object/{login-name,raw-password,new-password}/*.ts`（+ テスト） | 新規 |
| `domain/auth/entity/user-login/user-login.entity.ts`（+ テスト） | 変更（引数を VO に） |
| `domain/auth/repository/user-login/user-login.repository.interface.ts` | 変更（`LoginName`） |
| `infrastructure/auth/repository/user-login/user-login.repository.ts` | 変更 |
| `application/auth/usecase/{login,update-password}/*.usecase.ts`（+ テスト） | 変更（Result 化） |
| `presentation/auth/schema/{user-login,user-password}/*.schema.ts`（+ テスト） | 変更（型・構造のみ） |
| `presentation/auth/error-message/input/input.error-message.ts` | 新規 |
| `presentation/auth/controller/{user-login,user-password}/*.controller.ts`（+ テスト） | 変更 |

### Phase 3: user

| ファイルパス | 操作 |
|---|---|
| `domain/shared/value-object/user-name/user-name.ts`（+ テスト） | 変更（`create` / `of`） |
| `domain/user/value-object/user-birthday/user-birthday.ts`（+ テスト） | 変更（`create`） |
| `domain/user/entity/user/user.entity.test.ts`・`domain/auth/entity/user-login/user-login.entity.test.ts` | 変更（`new` の置き換え） |
| `infrastructure/auth/repository/{user-login,user-password}/*.repository.ts` | 変更（`UserName.of`） |
| `application/user/usecase/{create-user,update-user}/*.usecase.ts`（+ テスト） | 変更（Result 化） |
| `application/user/dto/create-user-result/create-user-result.dto.test.ts` | 変更（`new` の置き換え） |
| `presentation/user/schema/{create-user,update-user}/*.schema.ts`（+ テスト） | 変更（型・構造のみ） |
| `presentation/user/error-message/input/input.error-message.ts` | 新規 |
| `presentation/user/controller/{create-user,update-user,update-user-dark-mode}/*.controller.ts` | 変更 |
| `presentation/auth/controller/user-password/user-password.controller.test.ts` | 変更（T6） |

### Phase 4: 仕上げ

| ファイルパス | 操作 |
|---|---|
| `util/validation/`・`types/api-response/` | 削除 |
| `CLAUDE.md` | 変更（「入力値検証とエラーの扱い」を追加） |

## タスク

各 Phase の完了時に `npm run typecheck`・`npm run lint`・バックエンドのテストを通す。

### Phase 0: 共通

- [x] T1〜T6 を決める
- [x] neverthrow を追加する
- [x] `validatorMiddleware` を追加する
- [x] `errorHandler` を `HTTPException` のメッセージを返さない形にする
- [x] テスト

### Phase 1: sample

- [x] `SampleId`・`SampleName`・`SampleDescription` を新設する
- [x] Repository の引数を VO にする
- [x] Usecase を Result にし、`INVALID_INPUT`・`NOT_FOUND` を返す
- [x] スキーマを型・構造のみにする（`id` は `z.string()`）
- [x] `toInputErrorMessage` を置き、Controller を `validatorMiddleware` と err の分岐に切り替える
- [x] テスト

### Phase 2: auth

- [x] `LoginName`・`RawPassword`・`NewPassword` を新設する
- [x] `UserLoginEntity` の `verifyPassword`・`hashNewPassword` の引数を VO にする
- [x] `IUserLoginRepository.getLoginUser` の引数を `LoginName` にする
- [x] `LoginUsecase`・`UpdatePasswordUsecase` を Result にする
- [x] スキーマを型・構造のみにする（`confirmPassword` の `refine` も削除）
- [x] `toInputErrorMessage` を置き、Controller を切り替える
- [x] テスト

### Phase 3: user

- [x] `UserName` に `create`（3〜30 文字）/ `of` を追加し、コンストラクタを private にする（`new UserName(` はすべて置き換える）
- [x] `UserBirthday` に `create` を追加し、コンストラクタを private にする
- [x] `CreateUserUsecase`・`UpdateUserUsecase` を Result にし、`INVALID_INPUT`（確認用パスワードの不一致を含む）を返す
- [x] スキーマを型・構造のみにする（`confirmPassword` の `refine` も削除）
- [x] `toInputErrorMessage` を置き、Controller を切り替える（ダークモード更新は `validatorMiddleware` への切り替えのみ）
- [x] テスト

### Phase 4: 仕上げ

- [x] `formatZodErrors`・`ValidationErrorType` を削除する
- [x] CLAUDE.md を更新する

### スコープ外

- フロントエンドの変更
- sample の Entity の VO 化
- auth の user への統合（別の設計書で扱う）

## 実装時の注意点

- `Result.combineWithAllErrors([...] as const)` のように `as const` を付けると型が `never` になる。`as const` を付けずに配列リテラルを渡す
- 他のスキーマを流用（`omit`・`extend`・`shape`）しているスキーマは、流用元を型のみにすると制約が消える。各 Phase の着手前に `grep` で流用箇所を確認する
- `new XXX(` を置き換える際は、`grep -rn "new XXX("` で全呼び出し（Repository・DTO テスト・Entity テスト含む）を洗い出す
- RPC の型（`backend/dist-types`）は、スキーマの制約を減らしても入力の型が同じであれば変わらない。各 Phase で `npm run typecheck`（フロントエンド含む）を実行して確認する

## クラス仕様（契約）

### Phase 1（sample）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `SampleId.create` | 事後条件 | 1以上の整数の文字列なら数値として保持して ok、それ以外は `SAMPLE_ID_INVALID` |
| `SampleName.create` | 事後条件 | 空なら `SAMPLE_NAME_EMPTY`、100 文字超なら `SAMPLE_NAME_TOO_LONG`（`max`）、それ以外は ok |
| `SampleDescription.create` | 事後条件 | 500 文字超なら `SAMPLE_DESCRIPTION_TOO_LONG`（`max`）、それ以外は ok |
| `CreateSampleUsecase.execute` | 事後条件 | 入力値の違反はすべて `field` 付きで `INVALID_INPUT` として返し、保存しない。それ以外は作成して DTO を返す |
| `UpdateSampleUsecase.execute` | 事後条件 | 入力値の違反（指定された項目のみ判定）はすべて `INVALID_INPUT` として返し、DB は問い合わせない。ID が不正・対象が存在しなければ `NOT_FOUND`。それ以外は更新して DTO を返す |
| `GetSampleUsecase.execute` | 事後条件 | ID が不正（DB は問い合わせない）・対象が存在しなければ `NOT_FOUND`。それ以外は DTO を返す |
| `DeleteSampleUsecase.execute` | 事後条件 | ID が不正（DB は問い合わせない）・対象が存在しなければ `NOT_FOUND`。それ以外は論理削除して ok |

### Phase 2（auth）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `LoginName.create` | 事後条件 | 空なら `LOGIN_NAME_EMPTY`、それ以外は ok |
| `RawPassword.create` | 事後条件 | 空なら `RAW_PASSWORD_EMPTY`、それ以外は ok |
| `NewPassword.create` | 事後条件 | 8 文字未満なら `NEW_PASSWORD_TOO_SHORT`（`min`）、半角英数記号以外を含めば `NEW_PASSWORD_INVALID_CHARACTER`、それ以外は ok |
| `UserLoginEntity.verifyPassword` | 事後条件 | 平文を自身のソルトとペッパーでハッシュ化し、登録済みのハッシュと一致すれば true |
| `LoginUsecase.execute` | 事後条件 | 入力値の違反はすべて `INVALID_INPUT` として返し、DB は問い合わせない。ユーザーなし・パスワード不一致・プロフィールなしは `AUTHENTICATION_FAILED`（最終ログイン日時は更新しない）。それ以外はトークンとプロフィールの DTO を返し、最終ログイン日時を更新する |
| `UpdatePasswordUsecase.execute` | 事後条件 | 入力値の違反（確認用パスワードの不一致を含む）はすべて `INVALID_INPUT` として返し、DB は問い合わせない。資格情報がない・更新対象がない場合は `NOT_FOUND`、現在のパスワードが一致しない場合は `CURRENT_PASSWORD_MISMATCH`（いずれも更新しない）。それ以外は新しいパスワードで更新する |

### Phase 3（user）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `UserName.create` | 事後条件 | 3〜30 文字なら ok。3 文字未満（空を含む）は `USER_NAME_TOO_SHORT`（`min`）、30 文字超は `USER_NAME_TOO_LONG`（`max`） |
| `UserName.of` | 事後条件 | `create` が ok ならその値、err なら throw |
| `UserBirthday.create` | 事後条件 | yyyyMMdd 形式でなければ `USER_BIRTHDAY_INVALID_FORMAT`、実在しない日付なら `USER_BIRTHDAY_NOT_EXIST`、それ以外は ok |
| `CreateUserUsecase.execute` | 事後条件 | 入力値の違反（確認用パスワードの不一致を含む）はすべて `field` 付きで `INVALID_INPUT` として返し、DB は問い合わせない・保存しない。ユーザー名が重複していれば `DUPLICATE_NAME`（保存しない）。それ以外は作成してトークンを含む DTO を返す |
| `UpdateUserUsecase.execute` | 事後条件 | 入力値の違反はすべて `INVALID_INPUT` として返し、DB は問い合わせない。重複は `DUPLICATE_NAME`、対象が存在しなければ `NOT_FOUND`。それ以外は更新して DTO を返す |
