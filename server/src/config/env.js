import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/biasmirror"),
  JWT_ACCESS_SECRET: z.string().default("biasmirror-access-secret"),
  JWT_REFRESH_SECRET: z.string().default("biasmirror-refresh-secret"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  ML_SERVICE_URL: z.string().default("http://127.0.0.1:8000"),
  CLIENT_URL: z.string().default("http://127.0.0.1:5173"),
  ADMIN_EMAIL: z.string().default(""),
  ADMIN_PASSWORD: z.string().default(""),
  ADMIN_NAME: z.string().default("BiasMirror Admin")
});

export const env = envSchema.parse(process.env);
