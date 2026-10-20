import { describe, it, expect } from "vitest";
import { DeleteSampleParamSchema } from "..";

describe("DeleteSampleParamSchema", () => {
  it("形式は判定しないこと（数値以外の ID でも通過する）", () => {
    const result = DeleteSampleParamSchema.safeParse({
      id: "abc",
    });
    expect(result.success).toBe(true);
  });

  it("ID がない場合にエラーになること", () => {
    const result = DeleteSampleParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
