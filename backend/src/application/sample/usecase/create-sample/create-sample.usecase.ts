import { err, ok, Result } from "neverthrow";
import type { ICreateSampleRepository } from "../../../../domain/sample";
import { SampleDescription, SampleName, type SampleDescriptionError, type SampleNameError } from "../../../../domain/sample";
import { CreateSampleResultDto } from "../../dto";

/**
 * サンプル作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateSampleInputError =
  | { field: "name"; error: SampleNameError }
  | { field: "description"; error: SampleDescriptionError };

export type CreateSampleError = { type: "INVALID_INPUT"; errors: CreateSampleInputError[] };

type CreateSampleBody = {
  name: string;
  description?: string;
};

type PropsType = {
  body: CreateSampleBody;
}

/**
 * サンプル作成ユースケース
 */
export class CreateSampleUsecase {
  constructor(private readonly repository: ICreateSampleRepository) {}

  /**
   * 作成
   * @param body サンプルの登録内容
   * @returns 成功時は作成したサンプルの DTO。入力値が制約を満たさない場合はエラー（違反はすべて返し、保存しない）
   */
  async execute({ body }: PropsType): Promise<Result<CreateSampleResultDto, CreateSampleError>> {
    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      SampleName.create(body.name).mapErr((error): CreateSampleInputError => ({ field: "name", error })),
      (body.description === undefined ? ok(null) : SampleDescription.create(body.description))
        .mapErr((error): CreateSampleInputError => ({ field: "description", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [name, description] = input.value;

    const entity = await this.repository.create({ name, description });
    return ok(new CreateSampleResultDto(entity));
  }
}
