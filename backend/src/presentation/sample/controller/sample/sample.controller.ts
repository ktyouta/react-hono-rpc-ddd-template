import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { getListSample } from "../get-list-sample";
import { getSampleById } from "../get-sample";
import { createSample } from "../create-sample";
import { updateSample } from "../update-sample";
import { deleteSample } from "../delete-sample";

// ルーティング（チェーンで型情報を保持）
const sample = new Hono<AppEnv>()
    .route("/", getListSample)
    .route("/", getSampleById)
    .route("/", createSample)
    .route("/", updateSample)
    .route("/", deleteSample);

export { sample };
