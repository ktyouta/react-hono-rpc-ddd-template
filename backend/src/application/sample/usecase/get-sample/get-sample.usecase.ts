import { err, ok, type Result } from "neverthrow";
import type { IGetSampleRepository } from "../../../../domain/sample";
import { SampleId } from "../../../../domain/sample";
import { GetSampleResultDto } from "../../dto";

export type GetSampleError = { type: "NOT_FOUND" };

type PropsType = {
  id: string;
}

/**
 * サンプル取得ユースケース
 */
export class GetSampleUsecase {
  constructor(private readonly repository: IGetSampleRepository) { }

  /**
   * ID指定で取得
   * @param id サンプルID（パスパラメータの文字列）
   * @returns 成功時はサンプルの DTO。ID が不正（DB は問い合わせない）・対象が存在しない場合は NOT_FOUND
   */
  async execute({ id }: PropsType): Promise<Result<GetSampleResultDto, GetSampleError>> {
    // 形式が不正な ID は存在しない ID として扱う
    const sampleId = SampleId.create(id);
    if (sampleId.isErr()) {
      return err({ type: "NOT_FOUND" });
    }

    const entity = await this.repository.findById(sampleId.value);
    if (!entity) {
      return err({ type: "NOT_FOUND" });
    }
    return ok(new GetSampleResultDto(entity));
  }
}
