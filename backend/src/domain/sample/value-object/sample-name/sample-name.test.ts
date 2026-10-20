import { describe, it, expect } from "vitest";
import { SampleName } from "./sample-name";

describe("SampleName", () => {
  it("上限文字数ちょうどの名前で生成できること", () => {
    const name = "a".repeat(SampleName.MAX_LENGTH);

    const result = SampleName.create(name);

    expect(result.isOk() && result.value.value).toBe(name);
  });

  it("空の場合は SAMPLE_NAME_EMPTY を返すこと", () => {
    const result = SampleName.create("");

    expect(result.isErr() && result.error).toEqual({ type: "SAMPLE_NAME_EMPTY" });
  });

  it("上限文字数を超える場合は SAMPLE_NAME_TOO_LONG を返すこと", () => {
    const result = SampleName.create("a".repeat(SampleName.MAX_LENGTH + 1));

    expect(result.isErr() && result.error).toEqual({ type: "SAMPLE_NAME_TOO_LONG", max: SampleName.MAX_LENGTH });
  });
});
