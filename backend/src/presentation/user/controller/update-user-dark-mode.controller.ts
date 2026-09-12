import { UserIdParamSchema } from "../../../schema";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { UpdateUserDarkModeUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { UpdateUserDarkModeRepository } from "../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware } from "../../../middleware";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { UpdateUserDarkModeResponseDto } from "../dto";
import { UpdateUserDarkModeSchema } from "../schema";

const updateUserDarkMode = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER_DARK_MODE,
    userOperationGuardMiddleware,
    authMiddleware,
    zValidator("param", UserIdParamSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: "パラメータが不正です。", data: formatZodErrors(result.error) }, HTTP_STATUS.BAD_REQUEST);
        }
    }),
    zValidator("json", UpdateUserDarkModeSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
    }),
    async (c) => {
        const { userId } = c.req.valid("param");
        const body = c.req.valid("json");
        const db = c.get('db');
        const repository = new UpdateUserDarkModeRepository(db);
        const usecase = new UpdateUserDarkModeUsecase(repository);

        const updated = await usecase.execute(userId, body.darkMode);

        if (!updated) {
            return c.json({ message: "ユーザーが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
        }

        const responseDto = new UpdateUserDarkModeResponseDto(body.darkMode);

        return c.json({ message: "ダークモード設定を更新しました。", data: responseDto.value }, HTTP_STATUS.OK);
    }
);

export { updateUserDarkMode };
