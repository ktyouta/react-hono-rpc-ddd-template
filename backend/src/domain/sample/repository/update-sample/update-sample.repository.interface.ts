import type { UpdateSampleEntity } from "../../entity";
import type { SampleDescription, SampleId, SampleName } from "../../value-object";

/**
 * サンプル更新入力型
 */
export type UpdateSampleInput = {
  name?: SampleName;
  description?: SampleDescription;
};

/**
 * サンプル更新リポジトリインターフェース
 */
export interface IUpdateSampleRepository {
  /**
   * 更新
   * @param id サンプルID
   * @param data 更新データ
   */
  update(id: SampleId, data: UpdateSampleInput): Promise<UpdateSampleEntity | undefined>;
}
