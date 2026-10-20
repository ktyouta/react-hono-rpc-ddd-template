import type { SampleDescriptionError, SampleNameError } from "../../../../domain";

/**
 * サンプルコンテキストの入力値の違反（値オブジェクトの制約違反）
 */
type SampleInputError =
  | SampleNameError
  | SampleDescriptionError;

/**
 * 入力値の違反を、利用者向けのメッセージに変換する
 * @param error 入力値の違反
 * @returns 利用者向けのメッセージ
 */
export function toInputErrorMessage(error: SampleInputError): string {
  switch (error.type) {
    case "SAMPLE_NAME_EMPTY":
      return "名前は必須です";
    case "SAMPLE_NAME_TOO_LONG":
      return `名前は${error.max}文字以内で入力してください`;
    case "SAMPLE_DESCRIPTION_TOO_LONG":
      return `説明は${error.max}文字以内で入力してください`;
    default: {
      // 全てのエラー種別を網羅していることを型で保証する
      error satisfies never;
      return "入力内容が不正です";
    }
  }
}
