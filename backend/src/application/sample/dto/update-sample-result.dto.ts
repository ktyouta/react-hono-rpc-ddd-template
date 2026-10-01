import { UpdateSampleEntity } from "../../../domain/sample";

/**
 * サンプル結果の型
 */
export type UpdateSampleResultType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル更新結果 DTO
 */
export class UpdateSampleResultDto {
  private readonly _value: UpdateSampleResultType;

  /**
   * @param entity 更新後のサンプルエンティティ
   */
  constructor(entity: UpdateSampleEntity) {
    this._value = {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  get value(): UpdateSampleResultType {
    return this._value;
  }
}
