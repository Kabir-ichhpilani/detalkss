import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import { clerk } from "./middlewares/clerkAuthentication.js";
import user from "./routes/user.js";
import { connectDB } from "./db/mongo.js";
import matchmaker from "./socket/matchmaker.js";
import callHandler from "./socket/callHandler.js";
dotenv.config();

if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    console.warn("⚠️  WARNING: Clerk keys are missing in .env! Authentication will fail.");
}

const app = express();
const server = http.createServer(app);

// connect mongo
connectDB();

// middlewares (use app NOT server)
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(clerk);



// routes
app.use("/api/user", user);

// socket.io setup
const io = new Server(server, {
    cors: { origin: "*" },
});



io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // install matching handlers on this socket
    matchmaker(io, socket);

    // install signaling handlers (offer/answer/ice)
    callHandler(io, socket);

    socket.on("disconnect", (reason) => {
        console.log("disconnect", socket.id, reason);
        matchmaker.handleDisconnect(socket);
    });
});
// start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Socket + API server running at http://localhost:${PORT}`);
});
