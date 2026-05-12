import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const socket = io(
  import.meta.env.VITE_API_URL?.replace("/api", "") || "/",
  {
    autoConnect: false,
  },
);

export const connectSocket = () => {
  const token = useAuthStore.getState().token;
  const user = useAuthStore.getState().user;

  if (token && user) {
    socket.auth = { token };
    socket.connect();

    socket.on("connect", () => {
      socket.emit("join", user.id);
    });
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;
