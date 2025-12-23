import { io } from "socket.io-client";

// Use env var for production, fallback to local IP for dev
// process.env.EXPO_PUBLIC_API_URL ||
const rawApiUrl = "http://10.134.106.1:4040";
export const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

console.log("🔌 [Socket] Connecting to:", API_URL);

export const socket = io(API_URL, {
    transports: ["websocket"], // forcing websocket usually helps with stability
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
});

// Debug socket connection
socket.on("connect", () => {
    console.log("✅ [Socket] Connected! Socket ID:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("❌ [Socket] Disconnected. Reason:", reason);
});

socket.on("connect_error", (error) => {
    console.error("❌ [Socket] Connection error:", error.message);
});

socket.on("error", (error) => {
    console.error("❌ [Socket] Error:", error);
});
