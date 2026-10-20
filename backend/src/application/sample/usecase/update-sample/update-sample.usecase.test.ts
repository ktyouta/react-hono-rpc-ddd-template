import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateSampleEntity } from "../../../../domain/sample";
import { UpdateSampleResultDto, UpdateSampleUsecase } from "../..";
import type { IUpdateSampleRepository } from "../../../../domain/sample";

describe("UpdateSampleUsecase", () => {
  let mockRepository: IUpdateSampleRepository;
  let usecase: UpdateSampleUsecase;

  beforeEach(() => {
    mockRepository = {
      update: vi.fn(),
    };
    usecase = new UpdateSampleUsecase(mockRepository);
  });

  it("指定された項目のみを更新して DTO を返すこと", async () => {
    vi.mocked(mockRepository.update).mockResolvedValue(
      new UpdateSampleEntity(1, "更新後", null, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z")
    );

    const result = await usecase.execute({ id: "1", body: { name: "更新後" } });

    expect(result.isOk() && result.value).toBeInstanceOf(UpdateSampleResultDto);
    const [id, data] = vi.mocked(mockRepository.update).mock.calls[0];
    expect(id.value).toBe(1);
    expect(data.name?.value).toBe("更新後");
    expect(data.description).toBeUndefined();
  });

  it("入力値の違反をすべて INVALID_INPUT として返し、DB を問い合わせないこと", async () => {
    const result = await usecase.execute({ id: "1", body: { name: "", description: "a".repeat(501) } });

    expect(result.isErr() && result.error).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "SAMPLE_NAME_EMPTY" } },
        { field: "description", error: { type: "SAMPLE_DESCRIPTION_TOO_LONG", max: 500 } },
      ],
    });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("ID が不正な場合は DB を問い合わせずに NOT_FOUND を返すこと", async () => {
    const result = await usecase.execute({ id: "abc", body: { name: "更新後" } });

    expect(result.isErr() && result.error).toEqual({ type: "NOT_FOUND" });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("対象が存在しない場合は NOT_FOUND を返すこと", async () => {
    vi.mocked(mockRepository.update).mockResolvedValue(undefined);

    const result = await usecase.execute({ id: "999", body: { name: "更新後" } });

    expect(result.isErr() && result.error).toEqual({ type: "NOT_FOUND" });
  });
});
