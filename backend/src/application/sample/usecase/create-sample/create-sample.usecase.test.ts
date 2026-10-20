import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSampleEntity, SampleName } from "../../../../domain/sample";
import { CreateSampleResultDto, CreateSampleUsecase } from "../..";
import type { ICreateSampleRepository } from "../../../../domain/sample";

describe("CreateSampleUsecase", () => {
  let mockRepository: ICreateSampleRepository;
  let usecase: CreateSampleUsecase;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
    };
    usecase = new CreateSampleUsecase(mockRepository);
  });

  it("入力値が制約を満たす場合、作成して DTO を返すこと", async () => {
    vi.mocked(mockRepository.create).mockResolvedValue(
      new CreateSampleEntity(1, "テスト", null, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z")
    );

    const result = await usecase.execute({ body: { name: "テスト" } });

    expect(result.isOk() && result.value).toBeInstanceOf(CreateSampleResultDto);
    const input = vi.mocked(mockRepository.create).mock.calls[0][0];
    expect(input.name.value).toBe("テスト");
    expect(input.description).toBeNull();
  });

  it("入力値の違反をすべて項目名付きで INVALID_INPUT として返し、保存しないこと", async () => {
    const result = await usecase.execute({ body: { name: "", description: "a".repeat(501) } });

    expect(result.isErr() && result.error).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "SAMPLE_NAME_EMPTY" } },
        { field: "description", error: { type: "SAMPLE_DESCRIPTION_TOO_LONG", max: 500 } },
      ],
    });
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("名前の上限文字数を超える場合は SAMPLE_NAME_TOO_LONG を返すこと", async () => {
    const result = await usecase.execute({ body: { name: "a".repeat(SampleName.MAX_LENGTH + 1) } });

    expect(result.isErr() && result.error).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "name", error: { type: "SAMPLE_NAME_TOO_LONG", max: SampleName.MAX_LENGTH } }],
    });
  });
});
