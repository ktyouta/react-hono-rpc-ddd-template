import { CreateSampleEntity } from "../../../../domain/sample";

/**
 * サンプル結果の型
 */
export type CreateSampleResultType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル作成結果 DTO
 */
export class CreateSampleResultDto {
  private readonly _value: CreateSampleResultType;

  /**
   * @param entity 作成したサンプルエンティティ
   */
  constructor(entity: CreateSampleEntity) {
    this._value = {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  get value(): CreateSampleResultType {
    return this._value;
  }
}
