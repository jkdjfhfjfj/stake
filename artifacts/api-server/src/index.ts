import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── Keep-alive ping for Render free plan (sleeps after 15 min inactivity) ──
  // Pings the health endpoint every 14 minutes so the service stays awake.
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
    setInterval(async () => {
      try {
        await fetch(`${selfUrl}/api/health`);
        logger.debug("Keep-alive ping sent");
      } catch (e) {
        logger.warn({ err: e }, "Keep-alive ping failed");
      }
    }, PING_INTERVAL_MS);
    logger.info({ selfUrl }, "Keep-alive pinger started");
  }
});
