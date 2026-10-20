import { Hono } from "hono";
import { GetSampleUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetSampleRepository } from "../../../../infrastructure";
import { validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { GetSampleParamSchema } from "../../schema";

/**
 * サンプル取得
 * @route GET /api/v1/sample/:id
 */
const getSampleById = new Hono<AppEnv>().get(
  `${API_ENDPOINT.SAMPLE}/:id`,
  validatorMiddleware("param", GetSampleParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const db = c.get('db');
    const repository = new GetSampleRepository(db);
    const usecase = new GetSampleUsecase(repository);

    const result = await usecase.execute({ id });
    if (result.isErr()) {
      return c.json({ message: "サンプルが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
    }

    return c.json({ message: "サンプルを取得しました。", data: result.value.value }, HTTP_STATUS.OK);
  }
);

export { getSampleById };
