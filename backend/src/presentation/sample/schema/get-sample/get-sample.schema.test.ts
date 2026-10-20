import { describe, it, expect } from "vitest";
import { GetSampleParamSchema } from "..";

describe("GetSampleParamSchema", () => {
  it("形式は判定しないこと（数値以外の ID でも通過する）", () => {
    const result = GetSampleParamSchema.safeParse({
      id: "abc",
    });
    expect(result.success).toBe(true);
  });

  it("ID がない場合にエラーになること", () => {
    const result = GetSampleParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
