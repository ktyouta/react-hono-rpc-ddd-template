import { err, ok, type Result } from "neverthrow";

/**
 * サンプル名の生成失敗
 */
export type SampleNameError = { type: "SAMPLE_NAME_EMPTY" }
  | { type: "SAMPLE_NAME_TOO_LONG"; max: number };

/**
 * サンプル名
 */
export class SampleName {
  static readonly MAX_LENGTH = 100;
  private readonly _value: string;

  /**
   * @param sampleName サンプル名
   */
  private constructor(sampleName: string) {
    this._value = sampleName;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する
   * @param sampleName サンプル名
   * @returns 成功時はサンプル名、空・上限文字数超過の場合はその内容を持つ Result
   */
  static create(sampleName: string): Result<SampleName, SampleNameError> {
    if (!sampleName) {
      return err({ type: "SAMPLE_NAME_EMPTY" });
    }

    if (sampleName.length > SampleName.MAX_LENGTH) {
      return err({ type: "SAMPLE_NAME_TOO_LONG", max: SampleName.MAX_LENGTH });
    }

    return ok(new SampleName(sampleName));
  }
}
