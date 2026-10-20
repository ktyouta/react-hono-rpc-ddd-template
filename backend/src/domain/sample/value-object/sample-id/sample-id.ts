import { err, ok, type Result } from "neverthrow";

/**
 * サンプルIDの生成失敗
 */
export type SampleIdError = { type: "SAMPLE_ID_INVALID" };

/**
 * サンプルID
 */
export class SampleId {
  /**
   * 1以上の整数（先頭の 0 を含まない）
   */
  private static readonly PATTERN = /^[1-9][0-9]*$/;
  private readonly _value: number;

  /**
   * @param sampleId 1以上の整数
   */
  private constructor(sampleId: number) {
    this._value = sampleId;
  }

  get value(): number {
    return this._value;
  }

  /**
   * 外部からの入力値（パスパラメータの文字列）から生成する
   * @param sampleId サンプルIDの文字列
   * @returns 成功時はサンプルID、1以上の整数でない場合はその内容を持つ Result
   */
  static create(sampleId: string): Result<SampleId, SampleIdError> {
    if (!SampleId.PATTERN.test(sampleId)) {
      return err({ type: "SAMPLE_ID_INVALID" });
    }

    const value = Number(sampleId);
    if (!Number.isSafeInteger(value)) {
      return err({ type: "SAMPLE_ID_INVALID" });
    }

    return ok(new SampleId(value));
  }
}
