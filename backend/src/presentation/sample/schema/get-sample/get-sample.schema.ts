import { z } from "zod";

/**
 * サンプルIDパラメータスキーマ
 *
 * 形式は判定しない。形式が不正な ID は存在しない ID として扱う。
 */
export const GetSampleParamSchema = z.object({
  id: z.string(),
});

export type GetSampleParamSchemaType = z.infer<typeof GetSampleParamSchema>;
