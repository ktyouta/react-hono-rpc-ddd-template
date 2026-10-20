import { describe, it, expect } from "vitest";
import { UpdateSampleSchema, UpdateSampleParamSchema } from "..";

describe("UpdateSampleSchema", () => {
  it("部分更新が可能であること", () => {
    const result = UpdateSampleSchema.safeParse({
      name: "更新後の名前",
    });
    expect(result.success).toBe(true);
  });

  it("空のオブジェクトでも検証を通過すること", () => {
    const result = UpdateSampleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("文字列でない値の場合にエラーになること", () => {
    const result = UpdateSampleSchema.safeParse({ description: 1 });
    expect(result.success).toBe(false);
  });
});

describe("UpdateSampleParamSchema", () => {
  it("形式は判定しないこと（数値以外の ID でも通過する）", () => {
    const result = UpdateSampleParamSchema.safeParse({
      id: "abc",
    });
    expect(result.success).toBe(true);
  });
});
