# React + Hono RPC Template

JWT 認証付きのフルスタックテンプレート。React フロントエンドと Hono バックエンドを Hono RPC で型安全に連携する。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 19, Vite, TanStack Query, React Hook Form, Tailwind CSS |
| バックエンド | Hono, Cloudflare Workers, D1 (SQLite), Drizzle ORM |
| 通信 | Hono RPC（型安全） |
| 認証 | JWT（アクセストークン + リフレッシュトークン） |
| テスト | Vitest, Storybook |

> **⚠ Zod バージョンについて**
>
> フロントエンドとバックエンドで Zod のメジャーバージョンが異なる。
>
> - **フロントエンド**: Zod v4（`@hookform/resolvers@5.x` が Zod v4 のみ対応）
> - **バックエンド**: Zod v3（`@hono/zod-validator@0.4.x` が Zod v3 のみ対応）
>
> 両者のバリデーションスキーマは RPC を通じて直接共有しないため、バージョンの違いは実行時に問題を起こさない。将来的に `@hono/zod-validator` が Zod v4 に対応した時点で統一可能。
> **依存パッケージを更新する際は、各バリデータライブラリの Zod 対応バージョンを必ず確認すること。**

## ディレクトリ構成

```
react-hono-rpc-ddd-template/
├── backend/                  # Hono バックエンド（Cloudflare Workers）
│   ├── src/
│   │   ├── domain/           # Entity・Value Object・Repository interface（何にも依存しない）
│   │   │   ├── shared/       #   複数コンテキストで共有する概念（UserId・UserName）
│   │   │   ├── user/         #   プロフィール管理
│   │   │   ├── auth/         #   認証（login/logout/password/token/credential）
│   │   │   └── sample/
│   │   ├── application/      # Usecase・Result DTO（メインロジック。Repository interface 経由で domain を操作）
│   │   │   ├── user/usecase/
│   │   │   ├── auth/usecase/
│   │   │   └── sample/usecase/
│   │   ├── infrastructure/   # Repository 実装（Drizzle ORM）・DB スキーマ・DB クライアント
│   │   │   ├── db/
│   │   │   ├── user/repository/
│   │   │   ├── auth/repository/
│   │   │   └── sample/repository/
│   │   ├── presentation/     # Controller・Zod スキーマ（HTTP 入出力のみ）
│   │   │   ├── user/
│   │   │   ├── auth/
│   │   │   ├── health/
│   │   │   └── sample/
│   │   ├── config/           # 環境変数設定（EnvConfig）
│   │   ├── middleware/       # ミドルウェア（認証, CORS, ログ等）
│   │   ├── rpc/              # RPC 型エクスポート専用
│   │   └── index.ts          # エントリポイント、AppType エクスポート
│   ├── drizzle/              # マイグレーションファイル（drizzle-kit generate 出力先）
│   ├── seed/                 # Seed データ
│   ├── test/                 # テスト用設定（マイグレーション適用・型定義）。テスト本体は実装と同じフォルダに置く
│   ├── wrangler.jsonc        # Wrangler 設定（ローカル / 本番）
│   └── drizzle.config.ts     # Drizzle Kit 設定
├── frontend/                 # React フロントエンド（Vite）
│   ├── src/
│   │   ├── components/       # 共通 UI コンポーネント
│   │   ├── features/         # 機能別モジュール（home, login, sample 等）
│   │   ├── lib/              # RPC クライアント等
│   │   └── testing/          # テストセットアップ
│   └── .storybook/           # Storybook 設定
└── package.json              # ルート（npm workspaces）
```

バックエンドは DDD の4層アーキテクチャ（`presentation → application → domain ← infrastructure`）を採用している。`domain` は何にも依存せず、Repository はインターフェースを `domain` に置き `infrastructure` が実装する（依存性逆転）。詳細な設計規約は `.claude/agents/backend-architect.md` を参照。

## クイックスタート

### 1. 依存パッケージのインストール

```bash
npm install
```

ルートの `package.json` で npm workspaces を使用しているため、ルートで `npm install` を実行すれば frontend / backend 両方の依存がインストールされる。

### 2. バックエンドの環境変数設定

バックエンドの環境変数は **2 つの場所** で管理される:

| ファイル | 用途 | Git 管理 |
|---|---|---|
| `backend/wrangler.jsonc` の `vars` | 非機密の設定値（トークン有効期限、CORS オリジン等） | する |
| `backend/.dev.vars` | 機密情報（JWT 秘密鍵、PEPPER 等） | **しない** |

`backend/.dev.vars` を作成し、以下を設定する:

```
ACCESS_TOKEN_JWT_KEY=<アクセストークン用の秘密鍵>
REFRESH_TOKEN_JWT_KEY=<リフレッシュトークン用の秘密鍵>
PEPPER=<パスワードハッシュ用のペッパー値>
```

> **注意**: `.dev.vars` は dotenv 形式のため、すべての値が **文字列** として扱われる。
> `.dev.vars` に `wrangler.jsonc` と同名の変数を定義した場合、`.dev.vars` の値が優先される。
> 例えば `.dev.vars` に `CORS_ORIGIN=http://localhost:5173` と書くと、`wrangler.jsonc` の配列 `["http://localhost:5173", "http://localhost:5174"]` が上書きされ、単一の文字列になる点に注意。

### 3. データベースのセットアップ

```bash
cd backend

# マイグレーションファイルを生成（スキーマ変更時）
npm run db:generate

# ローカル D1 にマイグレーション適用
npm run db:migrate:local

# Seed データ投入（任意）
npm run db:seed:local
```

> **実行順序**: 必ず `db:generate` → `db:migrate:local` → `db:seed:local` の順で実行すること。Seed はテーブルが存在する前提で動作する。

### 4. 開発サーバー起動

ターミナルを 2 つ開き、それぞれ実行する:

```bash
# バックエンド（http://localhost:8787）
cd backend
npm run dev

# フロントエンド（http://localhost:5173）
cd frontend
npm run dev
```

または、ルートからワークスペーススクリプトを使用:

```bash
npm run dev:backend
npm run dev:frontend
```

## データベース

Cloudflare D1（SQLite ベース）を使用し、Drizzle ORM でスキーマ管理する。

- **スキーマ定義**: `backend/src/infrastructure/db/schema/schema.ts`
- **マイグレーション出力先**: `backend/drizzle/`
- **Seed データ**: `backend/seed/seed.sql`

### マイグレーションコマンド

| コマンド | 説明 |
|---|---|
| `npm run db:generate` | スキーマ変更からマイグレーション SQL を生成 |
| `npm run db:migrate:local` | ローカル D1 にマイグレーション適用 |
| `npm run db:migrate:prod` | 本番 D1 にマイグレーション適用（リモート） |
| `npm run db:seed:local` | ローカル D1 に Seed データ投入 |

## デプロイ

### バックエンド（Cloudflare Workers）

`wrangler.jsonc` に `env.production` セクションが定義されている。

```bash
cd backend

# 1. 本番用シークレットを設定（初回のみ）
npx wrangler secret put ACCESS_TOKEN_JWT_KEY --env production
npx wrangler secret put REFRESH_TOKEN_JWT_KEY --env production
npx wrangler secret put PEPPER --env production

# 2. wrangler.jsonc の production セクションを編集
#    - database_id: Cloudflare ダッシュボードで D1 データベースを作成し、その ID を設定
#    - CORS_ORIGIN: フロントエンドのデプロイ先 URL を設定

# 3. 本番 D1 にマイグレーション適用
npm run db:migrate:prod

# 4. デプロイ
npm run deploy:prod
```

### フロントエンド（Cloudflare Pages）

`frontend/src/config/env.ts` が起動時に `VITE_APP_API_URL` を必須としており、未設定でビルドすると本番で画面が真っ白になる（`Invalid env provided` エラー）。ビルド時に環境変数として渡す（`.env` ファイルには書かない）。

値は本番フロントエンドの URL 自身を指定する。`frontend/functions/api/[[path]].ts` が `/api/*` を同一オリジンで受けてバックエンドへプロキシする構成のため、バックエンドの URL を直接指定すると Cookie がクロスサイト扱いになり認証が壊れる。プロキシ先は Pages プロジェクトの環境変数 `BACKEND_API_URL`（バックエンドの実 URL）で指定する。

```bash
cd frontend
VITE_APP_API_URL=https://<Pages のデプロイ先URL> npm run build
npx wrangler pages deploy dist
```

デプロイは `npx wrangler pages deploy dist`（Pages プロジェクトを明示的に指定する）を使う。Cloudflare ダッシュボードの「Connect to Git」は現在デフォルトで Workers 用の設定（Deploy command が `wrangler deploy` になる）を作成することがあり、その場合 `functions/` 配下の Pages Functions が認識されない。ダッシュボードから連携する場合は、作成されるプロジェクトが Pages であることを確認すること。

## 主要スクリプト一覧

### ルート

| コマンド | 説明 |
|---|---|
| `npm run dev:frontend` | フロントエンド開発サーバー起動 |
| `npm run dev:backend` | バックエンド開発サーバー起動 |
| `npm run test` | 全テスト実行（frontend + backend） |
| `npm run test:frontend` | フロントエンドテスト実行 |
| `npm run test:backend` | バックエンドテスト実行 |

### バックエンド (`backend/`)

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run test` | テスト実行 |
| `npm run deploy:prod` | 本番環境にデプロイ |
| `npm run db:generate` | マイグレーション SQL 生成 |
| `npm run db:migrate:local` | ローカル DB にマイグレーション適用 |
| `npm run db:migrate:prod` | 本番 DB にマイグレーション適用 |
| `npm run db:seed:local` | ローカル DB に Seed データ投入 |

### フロントエンド (`frontend/`)

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run test` | テスト実行 |
| `npm run storybook` | Storybook 起動 |
| `npm run build-storybook` | Storybook ビルド |

## RPC 設計方針

- バックエンドは REST API の URL 設計を前提とする
- フロントエンドは URL や HTTP メソッドを意識しない（RPC クライアント経由で呼び出す）
- RPC の型定義は**バックエンドを単一の source of truth** とする
- フロントエンドで API 用の型を新規定義しない
- `InferResponseType` / `InferRequestType` で型推論し、`as` による型アサーションを使用しない

### 型安全な API 呼び出しの例

```typescript
// フロントエンド側
import { rpc } from '@/lib/rpc-client';

// 型安全な API 呼び出し（IDE で補完が効く）
const res = await rpc.api.v1.health.$get();
const data = await res.json();
```

### API クライアントの使い分け

フロントエンドには 2 つの API クライアントが存在する:

| ファイル | 方式 | 用途 |
|---|---|---|
| `lib/rpc-client.ts` | Hono RPC (`hc`) | **通常の API 呼び出しはすべてこちらを使用する** |
| `lib/api-client.ts` | Axios | リフレッシュトークンのエンドポイント呼び出し専用 |

`api-client.ts` が存在する理由: `rpc-client.ts` は 401 レスポンス時に `refresh-handler.ts` を呼び出してトークンをリフレッシュする。`refresh-handler.ts` が RPC クライアントを使うと循環参照になるため、リフレッシュ専用に独立した Axios インスタンスを使用している。

**新しい API エンドポイントを追加する際は、必ず `rpc-client.ts` の `rpc` を使用すること。**

## 設計上の補足

### sample 機能について

`frontend/src/features/sample/` はテンプレートの**リファレンス実装**として用意されている。Container / Presentational パターン、hooks、Storybook の書き方の参考として利用し、実際のプロジェクトでは削除または置き換える想定。

### ルート package.json の hono 依存

ルートの `package.json` に `hono` が `devDependencies` として存在する。これはフロントエンドの TypeScript コンパイラが RPC 型チェーン（`AppType`）を解決する際にバックエンドの Hono 型定義を参照する必要があるため。ルートに配置することで、フロントエンドの `tsc` がバックエンドの型を正しく解決できる。

### Zod バージョンが分かれている理由

- **フロントエンド**: Zod v4（`@hookform/resolvers@5.x` が Zod v4 のみ対応）
- **バックエンド**: Zod v3（`@hono/zod-validator@0.4.x` が Zod v3 のみ対応）

両者のバリデーションスキーマは RPC を通じて直接共有しないため、バージョンの違いは実行時に問題を起こさない。将来的に `@hono/zod-validator` が Zod v4 に対応した時点で統一可能。

### バックエンドの import パス

バックエンドでは `@/` パスエイリアスを設定していない（相対パスで import する）。`npm run typecheck` ではフロントエンドがバックエンドの型定義（`backend/dist-types`）を参照するが、型定義の出力ではパスエイリアスが書き換えられないため、バックエンドで `@/` を使うと型定義に `@/` が残り、フロントエンドの `tsconfig` の `@/*`（`frontend/src/*`）として誤解決される。実行時（vite・vitest）も、フロントエンドの `@` エイリアス（`frontend/src`）の設定のもとでバックエンドのソースを読み込むため、同様に誤解決される。

### フロントエンドの型チェック構成

`frontend/tsconfig.json` は `references` で以下をまとめるだけのファイルで、`npm run typecheck`（`tsc -b`）がすべてをチェックする。

| tsconfig | 対象 |
|---|---|
| `tsconfig.app.json` | アプリ本体（`src/`、テストを除く） |
| `tsconfig.test.json` | テストコード（vitest の globals の型はここだけに入れる） |
| `tsconfig.node.json` | `vite.config.ts`・`vitest.config.ts`・`.storybook/main.ts` |
| `tsconfig.functions.json` | Cloudflare Pages Functions（`functions/`。Workers ランタイムのため DOM の型を含めない） |

フロントエンドがバックエンドの何を読むかは、場面によって異なる。

| 場面 | フロントエンドが読むもの |
|---|---|
| `npm run typecheck`（`tsc -b`） | `backend/tsconfig.types.json` が出力する型定義（`backend/dist-types`、Git 管理外） |
| エディタ（VS Code 等） | バックエンドのソース（`references` で参照しているプロジェクトは、型定義ではなくソースを読む。`dist-types` が無くても型が効く） |
| 実行時（`npm run dev`・テスト） | バックエンドのソース（vite・vitest の `@backend` エイリアス） |

`npm run typecheck` では、`tsc -b` がまずバックエンドをバックエンド自身の設定（`backend/tsconfig.types.json`）でチェックして型定義を出力し、そのあとでフロントエンドの各 tsconfig をチェックする。型定義は自動で生成されるため、手動で生成する必要はない。これにより、`npm run typecheck` でバックエンドのコードがフロントエンドの tsconfig 設定（ブラウザ用の型など）でチェックされることを防いでいる。

型チェックは必ず `npm run typecheck` で行うこと。`npx tsc -p tsconfig.app.json` のように tsconfig を直接指定して実行すると、型定義が生成されないため、`dist-types` が無い状態では RPC の型が解決できずエラーになる。

### DB 名・ワーカー名の変更

テンプレートを自分のプロジェクトに適用する際は、以下の設定値を変更する:

| 設定 | ファイル | 現在の値 | 変更箇所 |
|---|---|---|---|
| ワーカー名 | `backend/wrangler.jsonc` | `react-hono-rpc` | `"name"` フィールド |
| DB 名 | `backend/wrangler.jsonc` | `hono-rest-template-db` | `"database_name"`（デフォルト + production の両方） |
| DB 名 | `backend/package.json` | `hono-rest-template-db` | `db:migrate:*` / `db:seed:*` スクリプト内 |
