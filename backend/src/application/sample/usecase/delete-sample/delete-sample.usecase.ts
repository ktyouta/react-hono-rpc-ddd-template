import { err, ok, type Result } from "neverthrow";
import type { IDeleteSampleRepository } from "../../../../domain/sample";
import { SampleId } from "../../../../domain/sample";

export type DeleteSampleError = { type: "NOT_FOUND" };

type PropsType = {
  id: string;
}

/**
 * サンプル削除ユースケース
 */
export class DeleteSampleUsecase {
  constructor(private readonly repository: IDeleteSampleRepository) {}

  /**
   * 削除（論理削除）
   * @param id サンプルID（パスパラメータの文字列）
   * @returns 成功時は ok。ID が不正（DB は問い合わせない）・対象が存在しない場合は NOT_FOUND
   */
  async execute({ id }: PropsType): Promise<Result<void, DeleteSampleError>> {
    // 形式が不正な ID は存在しない ID として扱う
    const sampleId = SampleId.create(id);
    if (sampleId.isErr()) {
      return err({ type: "NOT_FOUND" });
    }

    if (!(await this.repository.delete(sampleId.value))) {
      return err({ type: "NOT_FOUND" });
    }
    return ok(undefined);
  }
}
