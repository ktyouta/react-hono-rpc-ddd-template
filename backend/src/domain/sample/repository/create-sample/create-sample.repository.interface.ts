import type { CreateSampleEntity } from "../../entity";
import type { SampleDescription, SampleName } from "../../value-object";

/**
 * サンプル作成入力型
 */
export type CreateSampleInput = {
  name: SampleName;
  description: SampleDescription | null;
};

/**
 * サンプル作成リポジトリインターフェース
 */
export interface ICreateSampleRepository {
  /**
   * 作成
   * @param data 作成データ
   */
  create(data: CreateSampleInput): Promise<CreateSampleEntity>;
}
