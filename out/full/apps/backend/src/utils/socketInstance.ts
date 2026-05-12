import { Server } from "socket.io";

let ioInstance: Server;

export const setIO = (io: Server) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};
