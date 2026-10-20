# auth コンテキストの user コンテキストへの統合

## 概要

バックエンドの auth コンテキストを user コンテキストに統合し、ユーザー（プロフィール・ダークモード・ログイン情報）を1つの集約（`UserAggregate`）として扱う。あわせて `UserNameUniquenessDomainService`・`LoginCredentialId`・`LoginId` を導入する。

振る舞いを変えないリファクタリング（refactor スキル）として扱う。URL・レスポンス・利用者向けのメッセージは変えない（DB スキーマの S4 を除く）。

統合前の問題：

- user 側の Repository が auth 側のテーブルにも書き込み（`createUserWithLogin` 等）、`CreateUserUsecase` が auth の `UserLoginEntity` を組み立てており、実態は1つの集約になっている
- 「ログイン名＝ユーザー名」「削除済みユーザーは操作できない」の不変条件が Usecase・Repository に散らばっており、ドメイン層が守っていない
- `UserName` が user と auth の分割のためだけに `domain/shared` に置かれている（他コンテキストからは未使用）
- `UserLoginEntity._loginId`（ログインレコード自身の ID）の型が `UserId` になっている

## 決定事項

### ユーザー決定事項

- 入力値検証のドメイン移行の後に、auth を user に統合する
- 設計書を作成してから進める
- DB スキーマも対応する
  - S1: `user_login_master` の `auth_provider`・`google_id` 列を削除する
  - S2: `user_login_master.user_id` に未削除の行のみの一意インデックスを追加する（有効なログイン情報は1ユーザー1件）
  - S3: `user_google_login_master`（Google ログイン用）を追加する。コードからはまだ使わない
  - S4: `user_master.name`・`user_login_master.login_id` の一意制約を、未削除の行のみの部分一意インデックスにする。統合前は削除済みの行も含めて一意のため、退会したユーザーと同じ名前で登録すると、重複チェック（未削除のみ）を通過したあと DB の一意制約で 500 になっていた（既存の不具合の修正。振る舞いが変わる）
- マイグレーションの検証（`check-migrations.mjs`・`db:check:*`・`predb:migrate:*`・hook・db-migration スキル）を導入する
- ファクトリ名を `create` に統一する（新規生成も `create()`。入力からの生成と新規生成の両方を持つ値オブジェクトは、入力からの生成を `fromInput`（Result）とする）
- refresh・verify・get-authenticated-user の Usecase は DTO を返し、引数をオブジェクトで受け取る形にする（テストを追加する）
- 以下の方針で進める

| 項目 | 方針 |
|---|---|
| ファクトリ名 | `UserAggregate.create`・`LoginCredentialId.create`・`UserId.create`・`UserSalt.create` |
| `reconstruct` の引数 | 値オブジェクトで受け取る（`UserBirthday.of` を追加） |
| 集約のコメント | 事前条件・事後条件の形式で書く |
| ドメインサービスの引数 | `isDuplicated(userId, userName)` の位置引数 |
| ダークモード | 集約に `darkMode: boolean` と `updateDarkMode()` を持たせる |
| エラーメッセージ | `presentation/user/error-message/input/` に auth の分を統合する |
| `UserPassword.hash` の引数 | 文字列のまま |
| ユーザー更新の処理順 | 重複チェック → ユーザー取得（統合前のまま。順を変えると「ユーザー不在かつ名前重複」の戻り値が変わる） |
| `UserEntity` | 削除する（集約に置き換える） |
| ドメインサービスのテスト | 追加する |
| 集約のパスワード変更の失敗型 | `ChangePasswordError` |
| Repository の保存メソッド名 | `createUser`・`updateUser`・`updateDarkMode`・`updatePassword`・`deleteUser`、取得は `findUser` |
| `IGetUserProfileRepository.findById` | `findUserProfile` に改名する |
| ログインの「プロフィールが存在しない場合」 | ログイン Repository の取得（JOIN）に含まれるため「ユーザーが存在しない場合」と同じ扱い（`AUTHENTICATION_FAILED`） |

### Claudeの提案をユーザーが承認したもの

| 項目 | 提案 | 理由 |
|---|---|---|
| M3: ダークモード更新・ユーザー削除の Usecase の引数 | `{ userId: UserId, ... }` のオブジェクトにする（統合前は文字列の位置引数） | 入力値検証の移行で `UpdatePasswordUsecase`・`UpdateUserUsecase` が `{ userId: UserId, body }` になり、混在していたため |
| M4: Controller テストの準備データ | ユーザー更新・ダークモード更新・ユーザー削除の Controller テストに、ログイン情報の登録を追加する。ユーザー名（`test-user-${ulid}`、36文字）を `u-${ulid}`（28文字）に変える（ユーザー更新のテストで他ユーザーの名前を確認する期待値の文字列も同じく変わる） | 集約はユーザーとログイン情報を JOIN して取得し、`UserName.of` は 30 文字超で throw するため。アプリから登録したデータではいずれの状態も起きない |
| M5: 不足している Usecase テスト | ダークモード更新・ユーザー削除の Usecase テストを追加する | Repository のインターフェースが変わる Usecase の振る舞いをテストで確認するため |
| M6: ドキュメント | CLAUDE.md の「domain/shared の扱い」の例、README のディレクトリ構成、`.claude/agents/backend-architect.md`・`impl-planner.md`、`.claude/skills/backend-review/SKILL.md` の auth の記述を修正する | auth コンテキストがなくなるため |

### 未決定（次回以降に決める）

なし

### 実装時に Claude が判断したもの（未承認）

- Phase 1〜4 は個別に typecheck を通さず、`git mv` で移動したあと一括で書き換え、差分を本設計書と照合した。各 Phase 末の確認は全 Phase の完了後にまとめて行った
- テンプレートになかったテスト（`user-login.controller.test.ts`、パスワード変更の「現在のパスワードが誤っている場合」、ユーザー削除の Controller テストのログイン情報の削除の確認）を追加した
- `UserName.equals` を削除した（使用箇所なし）
- ローカル D1 への適用（`db:migrate:local`）で、未適用だった既存の `0002`・`0003` も同時に適用された。`user_login_master` から `user_master` への外部キーは `0003` で追加されるため、`0002` の `user_master` の作り直し（`DROP TABLE`）で CASCADE により削除される行はない。適用後の件数確認でもユーザーデータは 0 件（適用前からなし）だった

## 設計

### 層ごとの構成（統合後）

- `domain/user`
  - `aggregate/user-aggregate`: `UserAggregate`
  - `service/user-name-uniqueness`: `UserNameUniquenessDomainService`
  - `repository`: `create-user`・`update-user`・`update-user-dark-mode`・`delete-user`・`get-user-profile`・`update-password`・`user-login`・`user-name-uniqueness`
  - `value-object`: `user-birthday`・`user-name`（shared から移動）・`login-credential-id`（新規）・`login-id`（`login-name` を改名）・auth から移動したもの（`access-token`・`refresh-token`・`cookie`・`header`・`pepper`・`raw-password`・`new-password`・`user-password`・`user-salt`）
- `domain/shared`: `UserId` のみ
- `application/user`: auth の DTO・Usecase を移動
- `infrastructure/user`: auth の Repository を移動。`user-password` は `update-password` に改名。`user-name-uniqueness` を新規追加
- `presentation/user`: auth の Controller・Schema・エラーメッセージを移動・統合。`user-password` は `update-password` に改名。user ルーターに全ルートをまとめ、`index.ts` から auth の import を削除する

### 新規ファイル

パスは `backend/src/` からの相対パス。`index.ts` とテストファイルも追加する。

| ファイルパス | 責務 | export するもの |
|---|---|---|
| `domain/user/aggregate/user-aggregate/user-aggregate.ts` | ユーザー（プロフィール・ダークモード・ログイン情報）の集約 | `UserAggregate`、`ChangePasswordError` |
| `domain/user/service/user-name-uniqueness/user-name-uniqueness.domain-service.ts` | ユーザー名の重複判定 | `UserNameUniquenessDomainService` |
| `domain/user/repository/user-name-uniqueness/user-name-uniqueness.repository.interface.ts` | 同名ユーザーの取得 | `IUserNameUniquenessRepository` |
| `domain/user/repository/update-password/update-password.repository.interface.ts` | パスワード変更用の取得・保存（auth の user-password を移動・改名） | `IUpdatePasswordRepository` |
| `domain/user/value-object/login-credential-id/login-credential-id.ts` | ログイン情報レコードの ID | `LoginCredentialId` |
| `domain/user/value-object/login-id/login-id.ts` | ログイン ID（auth の `LoginName` を改名、`of` を追加） | `LoginId`、`LoginIdError` |
| `infrastructure/user/repository/user-name-uniqueness/user-name-uniqueness.repository.ts` | 同名ユーザー取得の実装 | `UserNameUniquenessRepository` |
| `infrastructure/user/repository/update-password/update-password.repository.ts` | パスワード変更の実装（移動・改名） | `UpdatePasswordRepository` |
| `presentation/user/controller/update-password/update-password.controller.ts` | パスワード変更（移動・改名） | `updatePassword` |
| `presentation/user/schema/update-password/update-password.schema.ts` | パスワード変更のスキーマ（移動・改名） | `UpdatePasswordSchema`、`UpdatePasswordSchemaType` |
| `application/user/dto/{refresh-result,verify-result,get-authenticated-user-result}/*.dto.ts` | refresh・verify・get-authenticated-user の結果 DTO | `RefreshResultDto`・`VerifyResultDto`・`GetAuthenticatedUserResultDto` |

### 移動

- `domain/auth/value-object/*` → `domain/user/value-object/*`
- `domain/shared/value-object/user-name` → `domain/user/value-object/user-name`
- `domain/auth/repository/user-login` → `domain/user/repository/user-login`
- `application/auth/dto/*`・`application/auth/usecase/*` → `application/user/dto/*`・`application/user/usecase/*`
- `infrastructure/auth/repository/user-login` → `infrastructure/user/repository/user-login`
- `presentation/auth/controller/*`（user-password 以外）・`presentation/auth/schema/user-login` → `presentation/user/` 配下
- `presentation/auth/error-message/input` の内容 → `presentation/user/error-message/input` に統合

### 削除

- `domain/auth`・`application/auth`・`infrastructure/auth`・`presentation/auth`
- `domain/auth/entity/user-login`（`UserLoginEntity`）
- `domain/user/entity/user`（`UserEntity`）

### テストの扱い

- 移動したロジックのテストは移動先に合わせて移動する（テスト内容は変更しない）
- Repository のインターフェースが変わるため、Usecase のテストのモックの書き方は変更する。検証している内容（期待値）は変えない
- 新規のクラス（`UserAggregate`・`UserNameUniquenessDomainService`・`LoginCredentialId`・`LoginId.of`・`UserBirthday.of`）は契約に沿ってテストを追加する
- M4・M5 は上記の提案のとおり

### DB スキーマ（S1〜S4）

- `schema.ts` を変更し、`npm run db:generate` でマイグレーションを生成する（SQL を手で作らない）
- 生成された SQL を確認してから `npm run db:migrate:local` でローカル D1 に適用する。本番への適用（`db:migrate:prod`）は Claude は実行しない
- 生成された SQL は `ALTER TABLE ... DROP COLUMN` とインデックスの作り直しのみで、`DROP TABLE` を含まない
- ユーザー作成の Repository は `authProvider` を書き込まなくなる
- S4 の振る舞いの変化（退会したユーザーと同じ名前での登録が成功する）を Controller テストで確認する（統合前のスキーマでは 500 になることも確認済み）

### マイグレーションの検証

- `backend/scripts/check-migrations.mjs`・`backend/package.json` の `db:check:*`・`predb:migrate:*`
- `.claude/hooks/check-migration-command.mjs`・`.claude/settings.json`（`wrangler d1 migrations apply` の直接実行時の検証）・`.gitignore`
- `.claude/skills/db-migration/`
- CLAUDE.md の「マイグレーション」の節・コマンド一覧、README（`scripts/`・Node.js 22.5 以上・DB 名の変更箇所）
- feature-impl・feature-modify・refactor・impl-planner のスキーマ変更時の手順を db-migration スキルの参照に変更
- 検証: `db:check:local` は未適用なし。子孫テーブルの退避なしで `user_master` を作り直す検証用のマイグレーションを一時フォルダで当て、退避・戻しの不足と `user_login_master`・`user_google_login_master` の件数減少で止まる（終了コード 1）ことを確認した
- 既知の制限: 既存の `0002`〜`0004` を未適用とみなして検証すると、`0003`（外部キーの追加）で検証用の行が外部キー違反になり適用に失敗する（検証用の行は適用前のスキーマに合わせて入れるため）。適用済みの過去のマイグレーションを検証し直す場合にのみ起きる

### 振る舞いの変化（アプリから登録したデータでは起きないもの）

- ダークモード更新は、ログイン情報が存在しない・削除済みのユーザーでは `NOT_FOUND` になる（集約を JOIN で取得するため。統合前はユーザーのみを更新していた）
- DB に `UserName`（3〜30 文字）・`UserBirthday` の制約を満たさない値がある場合、集約の復元時に throw して 500 になる

### 破綻ケース

- ログイン方法が増える（OAuth、メールアドレスでのログイン等）
- ログイン ID とユーザー名を別々にする

上記のどちらかが入ると、資格情報を独立した集約（コンテキスト）として分け直す必要が出る。

## タスク

各 Phase の完了時に `npm run typecheck`・`npm run lint`・バックエンドのテスト（`npx vitest run`）を通す。

層ごとに分けると途中の Phase で他の層が壊れ typecheck を通せないため、移動 → 新規クラス → ユースケース単位の置き換え → 外側の層の移動の順に進める。

### Phase 1: domain の移動

- [x] auth の値オブジェクト・Repository インターフェース・`UserLoginEntity`、shared の `UserName` を `domain/user` に移動（`user-password` Repository は `update-password` に改名）
- [x] `LoginName` を `LoginId` に改名
- [x] 各層の import を移動先に合わせる

### Phase 2: domain の新規クラス

- [x] `LoginId.of`・`LoginCredentialId`・`UserBirthday.of` を追加
- [x] `UserAggregate`・`UserNameUniquenessDomainService`・`IUserNameUniquenessRepository` を追加

### Phase 3: ユースケース単位の置き換え

- [x] ユーザー作成（`UserNameUniquenessRepository` を追加）
- [x] ユーザー更新
- [x] ダークモード更新（M3・M5）
- [x] ユーザー削除（M3・M5）
- [x] パスワード変更
- [x] ログイン
- [x] 置き換え後、`UserEntity`・`UserLoginEntity` を削除

### Phase 4: application・infrastructure・presentation の移動

- [x] auth の DTO・Usecase・Repository 実装・Controller・Schema・エラーメッセージを user 側に移動・統合
- [x] user ルーターに全ルートをまとめ、`index.ts` から auth の import を削除
- [x] refresh・verify・get-authenticated-user の Usecase を DTO を返す形にし、テストを追加

### Phase 5: DB スキーマ（S1〜S4）・マイグレーションの検証

- [x] `schema.ts` を変更し、`db:generate` でマイグレーションを生成する
- [x] 生成された SQL を確認し、`db:migrate:local` で適用する
- [x] ユーザー作成の Repository から削除列を除く
- [x] S4 のテストを追加する
- [x] マイグレーションの検証を導入する

### Phase 6: 仕上げ

- [x] 空になった auth のディレクトリを削除
- [x] M6 のドキュメントを修正
- [x] ファクトリ名を `create` に統一する

### スコープ外

- ユーザー更新の処理順の変更
- フロントエンドの変更（URL・RPC の型は変わらないため不要）

## クラス仕様（契約）

### UserAggregate

不変条件:

- ログイン ID はユーザー名と同じ値である

| メソッド | 事前条件（満たさない場合は throw） | 事後条件 |
|---|---|---|
| `create({ name, birthday, password, pepper })`（static, async） | なし | 新しいユーザー ID・ログイン情報 ID・ソルトを採番し、パスワードをハッシュ化して保持する。ダークモードは false、ログイン ID はユーザー名、未削除 |
| `reconstruct(params)`（static） | なし | 渡した値をそのまま保持する |
| `updateUser({ name, birthday })` | 未削除であること | ユーザー名・生年月日を置き換え、ログイン ID をユーザー名にそろえる |
| `updateDarkMode(darkMode)` | 未削除であること | ダークモード設定を置き換える |
| `verifyPassword(rawPassword, pepper)`（async） | 未削除であること | 登録済みのパスワードと一致する場合 true を返す。自身は変更しない |
| `changePassword(nowPassword, newPassword, pepper)`（async） | 未削除であること | 現在のパスワードが一致しない場合は `CURRENT_PASSWORD_MISMATCH` を err で返し、自身は変更しない。一致する場合は同じソルトでハッシュ化した新しいパスワードに置き換え、ok を返す |
| `delete()` | 未削除であること | 削除済みにする |
| `toSnapshot()` | なし | 保持している値をプリミティブで返す。自身は変更しない |

### UserNameUniquenessDomainService

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `isDuplicated(userId, userName)` | なし | userId 以外に同名の未削除ユーザーが存在する場合 true を返す |

### LoginCredentialId

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `create()` | なし | ULID で新しい ID を生成する |
| `of(value)` | 空でないこと（満たさない場合は throw） | 渡した値を保持する |

### LoginId

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `create(value)` | なし | 空の場合は `LOGIN_ID_EMPTY` を err で返す。それ以外は ok |
| `of(value)` | 空でないこと（満たさない場合は throw） | 渡した値を保持する |

### UserBirthday（追加分）

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `of(value)` | `create` の制約を満たすこと（満たさない場合は throw） | 渡した値を保持する |

### Usecase

事前条件・事後条件は変更しない。内部の処理を集約・ドメインサービス経由に置き換える。

- `LoginUsecase` の入力値の違反の型は `LoginNameError`（`LOGIN_NAME_EMPTY`）から `LoginIdError`（`LOGIN_ID_EMPTY`）に変わる。利用者向けのメッセージ（「ユーザー名を入力してください」）は変えない
- `LoginUsecase` はプロフィール取得 Repository を使わず、ログイン Repository が返す集約から DTO を作る（ユーザーまたはログイン情報が削除済みの場合は取得されず、統合前と同じく `AUTHENTICATION_FAILED`）
- refresh・verify・get-authenticated-user の Usecase は、統合前と同じ値を DTO に包んで返す
