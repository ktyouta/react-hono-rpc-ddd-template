import { z } from "zod";

/**
 * サンプル削除パラメータスキーマ
 *
 * 形式は判定しない。形式が不正な ID は存在しない ID として扱う。
 */
export const DeleteSampleParamSchema = z.object({
  id: z.string(),
});

export type DeleteSampleParamSchemaType = z.infer<typeof DeleteSampleParamSchema>;
