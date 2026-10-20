import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteSampleUsecase } from "../..";
import type { IDeleteSampleRepository } from "../../../../domain/sample";

describe("DeleteSampleUsecase", () => {
  let mockRepository: IDeleteSampleRepository;
  let usecase: DeleteSampleUsecase;

  beforeEach(() => {
    mockRepository = {
      delete: vi.fn(),
    };
    usecase = new DeleteSampleUsecase(mockRepository);
  });

  it("対象が存在する場合は論理削除して ok を返すこと", async () => {
    vi.mocked(mockRepository.delete).mockResolvedValue(true);

    const result = await usecase.execute({ id: "1" });

    expect(result.isOk()).toBe(true);
    expect(vi.mocked(mockRepository.delete).mock.calls[0][0].value).toBe(1);
  });

  it("対象が存在しない場合は NOT_FOUND を返すこと", async () => {
    vi.mocked(mockRepository.delete).mockResolvedValue(false);

    const result = await usecase.execute({ id: "999" });

    expect(result.isErr() && result.error).toEqual({ type: "NOT_FOUND" });
  });

  it("ID が不正な場合は DB を問い合わせずに NOT_FOUND を返すこと", async () => {
    const result = await usecase.execute({ id: "abc" });

    expect(result.isErr() && result.error).toEqual({ type: "NOT_FOUND" });
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
