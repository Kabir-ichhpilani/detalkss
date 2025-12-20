import { io } from "socket.io-client";

// Use env var for production, fallback to local IP for dev
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.251.172.1:4040";
export const socket = io(API_URL, {
    transports: ["websocket"], // forcing websocket usually helps with stability
});
