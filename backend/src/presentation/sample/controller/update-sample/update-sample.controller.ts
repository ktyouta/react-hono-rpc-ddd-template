import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { UpdateSampleUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { UpdateSampleRepository } from "../../../../infrastructure";
import type { AppEnv } from "../../../../types";
import { formatZodErrors } from "../../../../util";
import { UpdateSampleParamSchema, UpdateSampleSchema } from "../../schema";

/**
 * サンプル更新
 * @route PUT /api/v1/sample/:id
 */
const updateSample = new Hono<AppEnv>().put(
  `${API_ENDPOINT.SAMPLE}/:id`,
  zValidator("param", UpdateSampleParamSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "パラメータが不正です。", data: formatZodErrors(result.error) }, HTTP_STATUS.BAD_REQUEST);
    }
  }),
  zValidator("json", UpdateSampleSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const repository = new UpdateSampleRepository(db);
    const usecase = new UpdateSampleUsecase(repository);

    const result = await usecase.execute(Number(id), body.name, body.description);

    if (!result) {
      return c.json({ message: "サンプルが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
    }

    return c.json({ message: "サンプルを更新しました。", data: result.value }, HTTP_STATUS.OK);
  }
);

export { updateSample };
