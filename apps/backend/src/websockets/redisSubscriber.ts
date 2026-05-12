import { getIO } from "../utils/socketInstance";
import { logger, createRedisClient } from "@nfe/config";

const redisSubscriber = createRedisClient();

redisSubscriber.subscribe("bulk-progress", (err) => {
  if (err) {
    logger.error({ err }, "Failed to subscribe to bulk-progress channel");
  } else {
    logger.info("Subscribed to bulk-progress channel");
  }
});

redisSubscriber.on("message", (channel, message) => {
  if (channel === "bulk-progress") {
    try {
      const data = JSON.parse(message);
      const io = getIO();
      // Emit the event to the user's room
      io.to(data.userId).emit("bulk-progress", data);
    } catch (error) {
      logger.error({ error }, "Error parsing redis message");
    }
  }
});
