import { describe, it, expect } from "vitest";
import { SampleId } from "./sample-id";

describe("SampleId", () => {
  it("1以上の整数の文字列から数値として生成できること", () => {
    const result = SampleId.create("123");

    expect(result.isOk() && result.value.value).toBe(123);
  });

  it.each(["0", "-1", "1.5", "abc", "", "01", "9007199254740993"])("1以上の整数でない場合（%s）は SAMPLE_ID_INVALID を返すこと", (value) => {
    const result = SampleId.create(value);

    expect(result.isErr() && result.error).toEqual({ type: "SAMPLE_ID_INVALID" });
  });
});
