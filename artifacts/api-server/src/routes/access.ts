import { Router } from "express";
import { db } from "@workspace/db";
import { accessKeysTable, serverConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { DEFAULT_XOR_KEY, xorDecryptToString, xorEncryptString } from "../lib/xor.js";
import { logger } from "../lib/logger.js";

const router = Router();

async function getOrInitConfig() {
  const rows = await db.select().from(serverConfigTable).limit(1);
  if (rows.length > 0) return rows[0];
  const inserted = await db
    .insert(serverConfigTable)
    .values({ luaScript: "", alertMessage: "Akshu Mod Server Active!" })
    .returning();
  return inserted[0];
}

router.post("/Access.php", async (req, res) => {
  try {
    const rawBody: Buffer = req.body;

    if (!rawBody || rawBody.length === 0) {
      res.status(400).send("Bad Request");
      return;
    }

    const decryptedKey = xorDecryptToString(rawBody, DEFAULT_XOR_KEY);
    const trimmedKey = decryptedKey.trim().replace(/\0/g, "");

    logger.info({ keyLength: trimmedKey.length }, "Access attempt");

    const found = await db
      .select()
      .from(accessKeysTable)
      .where(eq(accessKeysTable.keyValue, trimmedKey))
      .limit(1);

    if (found.length === 0) {
      logger.info("Invalid key attempt");
      res.status(200).send("");
      return;
    }

    const config = await getOrInitConfig();
    const luaScript = config?.luaScript ?? "";

    if (!luaScript || luaScript.trim() === "") {
      res.status(200).send("");
      return;
    }

    const encrypted = xorEncryptString(luaScript, DEFAULT_XOR_KEY);
    res.set("Content-Type", "application/octet-stream");
    res.send(encrypted);
  } catch (err) {
    logger.error({ err }, "Error in /Access.php");
    res.status(500).send("Server Error");
  }
});

router.get("/nfo", async (_req, res) => {
  try {
    const config = await getOrInitConfig();
    const alert = config?.alertMessage ?? "Akshu Mod Server Active!";
    const encrypted = xorEncryptString(alert, DEFAULT_XOR_KEY);
    res.set("Content-Type", "application/octet-stream");
    res.send(encrypted);
  } catch (err) {
    logger.error({ err }, "Error in /nfo");
    res.status(500).send("Server Error");
  }
});

router.post("/nfo", async (_req, res) => {
  try {
    const config = await getOrInitConfig();
    const alert = config?.alertMessage ?? "Akshu Mod Server Active!";
    const encrypted = xorEncryptString(alert, DEFAULT_XOR_KEY);
    res.set("Content-Type", "application/octet-stream");
    res.send(encrypted);
  } catch (err) {
    logger.error({ err }, "Error in /nfo POST");
    res.status(500).send("Server Error");
  }
});

export default router;
