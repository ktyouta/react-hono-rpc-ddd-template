import { GetListSampleEntity } from "../../../../domain/sample";

/**
 * サンプル結果の型
 */
export type GetListSampleResultType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル一覧結果 DTO
 */
export class GetListSampleResultDto {
  private readonly _value: GetListSampleResultType[];

  /**
   * @param entities 取得したサンプルエンティティ一覧
   */
  constructor(entities: GetListSampleEntity[]) {
    this._value = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));
  }

  get value(): GetListSampleResultType[] {
    return this._value;
  }
}
