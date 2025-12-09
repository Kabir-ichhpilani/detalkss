import { io } from "socket.io-client";

export const socket = io("http://10.251.172.1:4040", {
    transports: ["websocket"],
});
