import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { API_URL } from "./apiClient";

// Compute origin from API_URL for WebSocket connections
const ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return String(API_URL).replace(/\/+$/, "");
  }
})();

let socket = null;

export const connectSocket = async () => {
  if (socket && socket.connected) return socket;

  const token = await AsyncStorage.getItem("pos-token");

  socket = io(ORIGIN, {
    transports: ["websocket"], //  required for React Native
    auth: { token },           //  send JWT if your backend checks it
  });

  socket.on("connect", () => {
    console.log(" RN connected to WS:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log(" RN disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
