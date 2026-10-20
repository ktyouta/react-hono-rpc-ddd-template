import { z } from "zod";

/**
 * サンプル作成リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約は値オブジェクトで判定する。
 */
export const CreateSampleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type CreateSampleSchemaType = z.infer<typeof CreateSampleSchema>;
