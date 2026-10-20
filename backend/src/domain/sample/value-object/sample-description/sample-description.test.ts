import { describe, it, expect } from "vitest";
import { SampleDescription } from "./sample-description";

describe("SampleDescription", () => {
  it("空の説明で生成できること", () => {
    const result = SampleDescription.create("");

    expect(result.isOk() && result.value.value).toBe("");
  });

  it("上限文字数ちょうどの説明で生成できること", () => {
    const description = "a".repeat(SampleDescription.MAX_LENGTH);

    const result = SampleDescription.create(description);

    expect(result.isOk() && result.value.value).toBe(description);
  });

  it("上限文字数を超える場合は SAMPLE_DESCRIPTION_TOO_LONG を返すこと", () => {
    const result = SampleDescription.create("a".repeat(SampleDescription.MAX_LENGTH + 1));

    expect(result.isErr() && result.error).toEqual({ type: "SAMPLE_DESCRIPTION_TOO_LONG", max: SampleDescription.MAX_LENGTH });
  });
});
