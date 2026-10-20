import { Hono } from "hono";
import { DeleteSampleUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { DeleteSampleRepository } from "../../../../infrastructure";
import { validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { DeleteSampleParamSchema } from "../../schema";

/**
 * サンプル削除
 * @route DELETE /api/v1/sample/:id
 */
const deleteSample = new Hono<AppEnv>().delete(
  `${API_ENDPOINT.SAMPLE}/:id`,
  validatorMiddleware("param", DeleteSampleParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const db = c.get('db');
    const repository = new DeleteSampleRepository(db);
    const usecase = new DeleteSampleUsecase(repository);

    const result = await usecase.execute({ id });
    if (result.isErr()) {
      return c.json({ message: "サンプルが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
    }

    return c.json({ message: "サンプルを削除しました。" }, HTTP_STATUS.OK);
  }
);

export { deleteSample };
