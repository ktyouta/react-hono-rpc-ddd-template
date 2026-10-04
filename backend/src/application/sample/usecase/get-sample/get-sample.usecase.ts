import type { IGetSampleRepository } from "../../../../domain/sample";
import { GetSampleResultDto } from "../../dto";

/**
 * サンプル取得ユースケース
 */
export class GetSampleUsecase {
  constructor(private readonly repository: IGetSampleRepository) { }

  /**
   * ID指定で取得
   * @param id サンプルID
   */
  async execute(id: number): Promise<GetSampleResultDto | null> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      return null;
    }
    return new GetSampleResultDto(entity);
  }
}
