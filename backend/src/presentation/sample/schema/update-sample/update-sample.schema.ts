import { z } from "zod";

/**
 * サンプル更新リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約は値オブジェクトで判定する。
 */
export const UpdateSampleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateSampleSchemaType = z.infer<typeof UpdateSampleSchema>;

/**
 * サンプル更新パラメータスキーマ
 *
 * 形式は判定しない。形式が不正な ID は存在しない ID として扱う。
 */
export const UpdateSampleParamSchema = z.object({
  id: z.string(),
});

export type UpdateSampleParamSchemaType = z.infer<typeof UpdateSampleParamSchema>;
