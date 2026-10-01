import type { ICreateSampleRepository } from "../../../domain/sample";
import { CreateSampleResultDto } from "../dto";

/**
 * サンプル作成ユースケース
 */
export class CreateSampleUsecase {
  constructor(private readonly repository: ICreateSampleRepository) {}

  /**
   * 作成
   * @param name 名前
   * @param description 説明
   */
  async execute(name: string, description?: string): Promise<CreateSampleResultDto> {
    const entity = await this.repository.create({
      name,
      description: description ?? null,
    });
    return new CreateSampleResultDto(entity);
  }
}
