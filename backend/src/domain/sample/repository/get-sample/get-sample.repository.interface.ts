import type { GetSampleEntity } from "../../entity";
import type { SampleId } from "../../value-object";

/**
 * サンプル取得リポジトリインターフェース
 */
export interface IGetSampleRepository {
  /**
   * ID指定で取得
   * @param id サンプルID
   */
  findById(id: SampleId): Promise<GetSampleEntity | undefined>;
}
