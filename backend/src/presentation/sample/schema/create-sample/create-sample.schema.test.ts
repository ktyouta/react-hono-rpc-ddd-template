import { describe, it, expect } from "vitest";
import { CreateSampleSchema } from "..";

describe("CreateSampleSchema", () => {
  it("正しい型のデータで検証を通過すること", () => {
    const result = CreateSampleSchema.safeParse({
      name: "テストサンプル",
      description: "説明文",
    });
    expect(result.success).toBe(true);
  });

  it("値の制約は判定しないこと（空の名前でも通過する）", () => {
    const result = CreateSampleSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(true);
  });

  it("説明が省略可能であること", () => {
    const result = CreateSampleSchema.safeParse({
      name: "テストサンプル",
    });
    expect(result.success).toBe(true);
  });

  it("名前がない・文字列でない場合にエラーになること", () => {
    expect(CreateSampleSchema.safeParse({}).success).toBe(false);
    expect(CreateSampleSchema.safeParse({ name: 1 }).success).toBe(false);
  });
});
