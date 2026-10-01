import { describe, it, expect } from "vitest";
import { GetSampleEntity } from "../../../../src/domain/sample";
import { GetSampleResultDto } from "../../../../src/application/sample/dto";

describe("GetSampleResultDto (get)", () => {
  it("エンティティからDTOを生成できること", () => {
    const entity = new GetSampleEntity(
      1,
      "テスト",
      "説明",
      "2024-01-01T00:00:00.000Z",
      "2024-01-01T00:00:00.000Z"
    );

    const dto = new GetSampleResultDto(entity);

    expect(dto.value.id).toBe(1);
    expect(dto.value.name).toBe("テスト");
    expect(dto.value.description).toBe("説明");
  });
});
