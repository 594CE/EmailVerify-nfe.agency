import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "@nfe/config";
import { setIO } from "../utils/socketInstance";
import jwt from "jsonwebtoken";

let io: Server;

export const initWebSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret",
      (err: any, decoded: any) => {
        if (err) return next(new Error("Authentication error"));
        (socket as any).user = decoded;
        next();
      },
    );
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Client connected to WebSocket");

    socket.on("join", (userId: string) => {
      const socketUser = (socket as any).user;
      if (socketUser.userId === userId) {
        socket.join(userId);
        logger.info({ socketId: socket.id, userId }, "Client joined room");
      }
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected");
    });
  });

  setIO(io);
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
