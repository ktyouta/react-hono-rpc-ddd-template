import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env, SELF } from "cloudflare:test";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { userLoginMaster, userMaster } from "../../../../infrastructure/db";
import * as schema from "../../../../infrastructure/db/schema";

describe("POST /api/v1/user", () => {

    it("退会済みユーザーと同じユーザー名で登録できること", async () => {
        const db = drizzle(env.DB, { schema });
        const now = new Date().toISOString();

        const deletedUserId = ulid();
        const name = `u-${deletedUserId}`;

        await db.insert(userMaster).values({ id: deletedUserId, name, birthday: "19900101", deleteFlg: true, createdAt: now, updatedAt: now });
        await db.insert(userLoginMaster).values({ id: ulid(), userId: deletedUserId, loginId: name, passwordHash: "hashed", salt: "salt", deleteFlg: true, createdAt: now, updatedAt: now });

        const res = await SELF.fetch("http://localhost/api/v1/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                birthday: "19900101",
                password: "Passw0rd!",
                confirmPassword: "Passw0rd!",
            }),
        });

        expect(res.status).toBe(201);

        const activeUsers = await db.select().from(userMaster).where(and(eq(userMaster.name, name), eq(userMaster.deleteFlg, false)));
        const activeLogins = await db.select().from(userLoginMaster).where(and(eq(userLoginMaster.loginId, name), eq(userLoginMaster.deleteFlg, false)));

        expect(activeUsers).toHaveLength(1);
        expect(activeLogins).toHaveLength(1);
    });
});
