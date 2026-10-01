import type { IGetListSampleRepository } from "../../../domain/sample";
import { GetListSampleResultDto } from "../dto";

/**
 * サンプル一覧取得ユースケース
 */
export class GetListSampleUsecase {
  constructor(private readonly repository: IGetListSampleRepository) { }

  /**
   * 全件取得
   */
  async execute(): Promise<GetListSampleResultDto> {
    const entities = await this.repository.findAll();
    return new GetListSampleResultDto(entities);
  }
}
