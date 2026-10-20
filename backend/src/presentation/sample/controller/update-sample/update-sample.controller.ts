import { Hono } from "hono";
import { UpdateSampleUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { UpdateSampleRepository } from "../../../../infrastructure";
import { validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { UpdateSampleParamSchema, UpdateSampleSchema } from "../../schema";

/**
 * サンプル更新
 * @route PUT /api/v1/sample/:id
 */
const updateSample = new Hono<AppEnv>().put(
  `${API_ENDPOINT.SAMPLE}/:id`,
  validatorMiddleware("param", UpdateSampleParamSchema),
  validatorMiddleware("json", UpdateSampleSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const repository = new UpdateSampleRepository(db);
    const usecase = new UpdateSampleUsecase(repository);

    const result = await usecase.execute({ id, body });
    if (result.isErr()) {
      const error = result.error;
      switch (error.type) {
        case "INVALID_INPUT":
          return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        case "NOT_FOUND":
          return c.json({ message: "サンプルが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
        default: {
          // 全てのエラー種別を網羅していることを型で保証する
          error satisfies never;
          return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
      }
    }

    return c.json({ message: "サンプルを更新しました。", data: result.value.value }, HTTP_STATUS.OK);
  }
);

export { updateSample };
