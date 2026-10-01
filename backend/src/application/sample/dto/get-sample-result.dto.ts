import { GetSampleEntity } from "../../../domain/sample";

/**
 * サンプル結果の型
 */
export type GetSampleResultType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル取得結果 DTO
 */
export class GetSampleResultDto {
  private readonly _value: GetSampleResultType;

  /**
   * @param entity 取得したサンプルエンティティ
   */
  constructor(entity: GetSampleEntity) {
    this._value = {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  get value(): GetSampleResultType {
    return this._value;
  }
}
