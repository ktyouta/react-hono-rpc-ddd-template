import { err, ok, Result } from "neverthrow";
import type { IUpdateSampleRepository } from "../../../../domain/sample";
import { SampleDescription, SampleId, SampleName, type SampleDescriptionError, type SampleNameError } from "../../../../domain/sample";
import { UpdateSampleResultDto } from "../../dto";

/**
 * サンプル更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateSampleInputError =
  | { field: "name"; error: SampleNameError }
  | { field: "description"; error: SampleDescriptionError };

export type UpdateSampleError =
  | { type: "INVALID_INPUT"; errors: UpdateSampleInputError[] }
  | { type: "NOT_FOUND" };

type UpdateSampleBody = {
  name?: string;
  description?: string;
};

type PropsType = {
  id: string;
  body: UpdateSampleBody;
}

/**
 * サンプル更新ユースケース
 */
export class UpdateSampleUsecase {
  constructor(private readonly repository: IUpdateSampleRepository) {}

  /**
   * 更新（指定された項目のみ）
   * @param id サンプルID（パスパラメータの文字列）
   * @param body 更新内容
   * @returns 成功時は更新後のサンプルの DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
   * ID が不正（DB は問い合わせない）・対象が存在しない場合は NOT_FOUND
   */
  async execute({ id, body }: PropsType): Promise<Result<UpdateSampleResultDto, UpdateSampleError>> {
    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      (body.name === undefined ? ok(undefined) : SampleName.create(body.name))
        .mapErr((error): UpdateSampleInputError => ({ field: "name", error })),
      (body.description === undefined ? ok(undefined) : SampleDescription.create(body.description))
        .mapErr((error): UpdateSampleInputError => ({ field: "description", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [name, description] = input.value;

    // 形式が不正な ID は存在しない ID として扱う
    const sampleId = SampleId.create(id);
    if (sampleId.isErr()) {
      return err({ type: "NOT_FOUND" });
    }

    const entity = await this.repository.update(sampleId.value, { name, description });
    if (!entity) {
      return err({ type: "NOT_FOUND" });
    }
    return ok(new UpdateSampleResultDto(entity));
  }
}
