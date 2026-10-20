import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetSampleEntity } from "../../../../domain/sample";
import { GetSampleResultDto, GetSampleUsecase } from "../..";
import type { IGetSampleRepository } from "../../../../domain/sample";

describe("GetSampleUsecase (get)", () => {
  let mockRepository: IGetSampleRepository;
  let usecase: GetSampleUsecase;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
    };
    usecase = new GetSampleUsecase(mockRepository);
  });

  it("findById - 存在する場合にエンティティを返すこと", async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(
      new GetSampleEntity(
        1,
        "テスト",
        "説明",
        "2024-01-01T00:00:00.000Z",
        "2024-01-01T00:00:00.000Z"
      )
    );

    const result = await usecase.execute({ id: "1" });

    expect(result.isOk() && result.value).toBeInstanceOf(GetSampleResultDto);
    expect(result.isOk() && result.value.value.id).toBe(1);
    expect(vi.mocked(mockRepository.findById).mock.calls[0][0].value).toBe(1);
  });

  it("findById - 存在しない場合に NOT_FOUND を返すこと", async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(undefined);

    const result = await usecase.execute({ id: "999" });

    expect(result.isErr() && result.error).toEqual({ type: "NOT_FOUND" });
  });

  it("ID が不正な場合は DB を問い合わせずに NOT_FOUND を返すこと", async () => {
    const result = await usecase.execute({ id: "abc" });

    expect(result.isErr() && result.error).toEqual({ type: "NOT_FOUND" });
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });
});
