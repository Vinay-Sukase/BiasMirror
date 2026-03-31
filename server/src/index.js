import { createApp } from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { bootstrapAdminAccount } from "./services/adminBootstrapService.js";

const app = createApp();

connectToDatabase()
  .then(() => bootstrapAdminAccount())
  .then(() => {
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "BiasMirror server listening");
    });
  })
  .catch((error) => {
    logger.error(error, "Failed to start server");
    process.exit(1);
  });
