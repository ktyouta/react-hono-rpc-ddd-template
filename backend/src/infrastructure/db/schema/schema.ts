import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * サンプルテーブル
 */
export const sample = sqliteTable("sample", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Sample = typeof sample.$inferSelect;
export type NewSample = typeof sample.$inferInsert;

/**
 * ユーザーマスタ
 */
export const userMaster = sqliteTable(
  "user_master",
  {
    id: text("id").primaryKey(), // ULID
    name: text("name").notNull(),
    birthday: text("birthday").notNull(),
    lastLoginDate: text("last_login_date"),
    darkMode: integer("dark_mode", { mode: "boolean" }).notNull().default(false),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // 論理削除済みの行は除外し、退会後に同じユーザー名で再登録できるようにする
    uniqueIndex("user_master_name_unique").on(t.name).where(sql`delete_flg = 0`),
  ]
);

export type UserMaster = typeof userMaster.$inferSelect;
export type NewUserMaster = typeof userMaster.$inferInsert;

/**
 * ユーザーログインマスタ
 */
export const userLoginMaster = sqliteTable(
  "user_login_master",
  {
    id: text("id").primaryKey(), // ULID（ログインレコード自身のID）
    userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "cascade" }), // FK → user_master.id
    loginId: text("login_id").notNull(),
    passwordHash: text("password_hash").notNull(),
    salt: text("salt").notNull(),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // 論理削除済みの行は除外し、退会後に同じログインIDで再登録できるようにする
    uniqueIndex("user_login_master_login_id_unique").on(t.loginId).where(sql`delete_flg = 0`),
    // 論理削除済みの行は除外し、1ユーザーにつき有効なログイン情報を1件に限る
    uniqueIndex("user_login_master_user_id_unique").on(t.userId).where(sql`delete_flg = 0`),
  ]
);

export type UserLoginMaster = typeof userLoginMaster.$inferSelect;
export type NewUserLoginMaster = typeof userLoginMaster.$inferInsert;

/**
 * ユーザーGoogleログインマスタ
 */
export const userGoogleLoginMaster = sqliteTable(
  "user_google_login_master",
  {
    id: text("id").primaryKey(), // ULID（ログインレコード自身のID）
    userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "cascade" }), // FK → user_master.id
    googleId: text("google_id").notNull(),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // 論理削除済みの行は除外し、退会後に同じGoogleアカウントで再登録できるようにする
    uniqueIndex("user_google_login_master_google_id_unique").on(t.googleId).where(sql`delete_flg = 0`),
    // 論理削除済みの行は除外し、1ユーザーにつき有効なGoogleログイン情報を1件に限る
    uniqueIndex("user_google_login_master_user_id_unique").on(t.userId).where(sql`delete_flg = 0`),
  ]
);

export type UserGoogleLoginMaster = typeof userGoogleLoginMaster.$inferSelect;
export type NewUserGoogleLoginMaster = typeof userGoogleLoginMaster.$inferInsert;
