import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/User.js";

export async function bootstrapAdminAccount() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    logger.info("Admin bootstrap skipped because credentials are not configured");
    return;
  }

  const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  if (!existingAdmin) {
    await User.create({
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      role: "admin",
      passwordHash
    });
    logger.info({ email: env.ADMIN_EMAIL }, "Bootstrapped admin account");
    return;
  }

  existingAdmin.name = env.ADMIN_NAME;
  existingAdmin.role = "admin";
  existingAdmin.passwordHash = passwordHash;
  await existingAdmin.save();
  logger.info({ email: env.ADMIN_EMAIL }, "Updated bootstrapped admin account");
}
