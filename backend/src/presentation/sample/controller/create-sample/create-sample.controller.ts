import { Hono } from "hono";
import { CreateSampleUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { CreateSampleRepository } from "../../../../infrastructure";
import { validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { CreateSampleSchema } from "../../schema";

/**
 * サンプル作成
 * @route POST /api/v1/sample
 */
const createSample = new Hono<AppEnv>().post(
  API_ENDPOINT.SAMPLE,
  validatorMiddleware("json", CreateSampleSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = c.get('db');
    const repository = new CreateSampleRepository(db);
    const usecase = new CreateSampleUsecase(repository);

    const result = await usecase.execute({ body });
    if (result.isErr()) {
      // エラー種別が INVALID_INPUT のみのため switch で振り分けない（単一の型は never に絞り込まれず、網羅性の検査が型エラーになる）
      return c.json({ message: "入力エラー", data: result.error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    return c.json({ message: "サンプルを作成しました。", data: result.value.value }, HTTP_STATUS.CREATED);
  }
);

export { createSample };
