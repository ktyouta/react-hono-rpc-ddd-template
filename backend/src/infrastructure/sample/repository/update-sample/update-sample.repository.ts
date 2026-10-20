import { and, eq } from "drizzle-orm";
import { UpdateSampleEntity } from "../../../../domain/sample";
import type { IUpdateSampleRepository, SampleId, UpdateSampleInput } from "../../../../domain/sample";
import type { Database } from "../../../db";
import { sample } from "../../../db";

/**
 * サンプル更新リポジトリ実装
 */
export class UpdateSampleRepository implements IUpdateSampleRepository {
  constructor(private readonly db: Database) { }

  /**
   * 更新
   */
  async update(id: SampleId, data: UpdateSampleInput): Promise<UpdateSampleEntity | undefined> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(sample)
      .set({
        name: data.name?.value,
        description: data.description?.value,
        updatedAt: now,
      })
      .where(and(eq(sample.id, id.value), eq(sample.deleteFlg, false)))
      .returning();
    return result[0] ? UpdateSampleEntity.fromRecord(result[0]) : undefined;
  }
}
