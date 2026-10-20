import { err, ok, type Result } from "neverthrow";

/**
 * サンプルの説明の生成失敗
 */
export type SampleDescriptionError = { type: "SAMPLE_DESCRIPTION_TOO_LONG"; max: number };

/**
 * サンプルの説明
 */
export class SampleDescription {
  static readonly MAX_LENGTH = 500;
  private readonly _value: string;

  /**
   * @param sampleDescription サンプルの説明
   */
  private constructor(sampleDescription: string) {
    this._value = sampleDescription;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する
   * @param sampleDescription サンプルの説明（空を許容する）
   * @returns 成功時はサンプルの説明、上限文字数超過の場合はその内容を持つ Result
   */
  static create(sampleDescription: string): Result<SampleDescription, SampleDescriptionError> {
    if (sampleDescription.length > SampleDescription.MAX_LENGTH) {
      return err({ type: "SAMPLE_DESCRIPTION_TOO_LONG", max: SampleDescription.MAX_LENGTH });
    }

    return ok(new SampleDescription(sampleDescription));
  }
}
