import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { API_ORIGIN } from "./apiClient";

let socket = null;

export const connectSocket = async () => {
  if (socket && socket.connected) return socket;

  const token = await AsyncStorage.getItem("pos-token");

  socket = io(API_ORIGIN, {
    transports: ["websocket"], // 👈 required for React Native
    auth: { token },           // 👈 send JWT if your backend checks it
  });

  socket.on("connect", () => {
    console.log("✅ RN connected to WS:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ RN disconnected:", reason);
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