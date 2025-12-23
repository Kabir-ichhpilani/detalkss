// backend/matchmaker.js
// Simple in-memory matchmaker. Not for multi-instance production.
const queues = new Map();            // problem -> [socketId,...]
const socketToQueueKey = new Map();  // socketId -> problem
const currentPartner = new Map(); // socketId -> partnerSocketId

export default function installMatchmaker(io, socket) {
    // join a problem queue
    socket.on("join_call_queue", ({ problem }) => {
        console.log(`📥 [Matchmaker] join_call_queue received from ${socket.id} with problem: ${problem}`);

        if (!problem) {
            console.error(`❌ [Matchmaker] Missing problem from ${socket.id}`);
            return socket.emit("error", { message: "missing_problem" });
        }

        // if already queued, ignore
        if (socketToQueueKey.get(socket.id) === problem) {
            console.log(`ℹ️ [Matchmaker] ${socket.id} already in queue for ${problem}`);
            return socket.emit("searching");
        }

        leaveQueueIfAny(socket);

        const q = queues.get(problem) || [];
        // remove stale presence
        const idxSelf = q.indexOf(socket.id);
        if (idxSelf !== -1) q.splice(idxSelf, 1);

        if (q.length === 0) {
            q.push(socket.id);
            queues.set(problem, q);
            socketToQueueKey.set(socket.id, problem);
            console.log(`🔍 [Matchmaker] ${socket.id} is now searching for ${problem}. Queue size: ${q.length}`);
            socket.emit("searching");
            return;
        }

        // match with first waiting peer
        const partnerId = q.shift();
        if (q.length === 0) queues.delete(problem);
        else queues.set(problem, q);

        socketToQueueKey.delete(partnerId);
        socketToQueueKey.delete(socket.id);

        const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        console.log(`🤝 [Matchmaker] Matching ${socket.id} with ${partnerId} in room ${roomId} for problem: ${problem}`);

        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (!partnerSocket) {
            // partner disconnected unexpectedly — re-enqueue this socket
            console.warn(`⚠️ [Matchmaker] Partner ${partnerId} disconnected, re-enqueueing ${socket.id}`);
            enqueueSocket(problem, socket);
            return;
        }

        // join both sockets into the room
        socket.join(roomId);
        partnerSocket.join(roomId);

        // tell both peers they've been matched
        socket.emit("matched", { roomId, partnerId });
        currentPartner.set(socket.id, partnerId);
        currentPartner.set(partnerId, socket.id);

        partnerSocket.emit("matched", { roomId, partnerId: socket.id });
        console.log(`✅ [Matchmaker] Match complete! Room: ${roomId}`);
    });

    socket.on("leave_call_queue", () => {
        const partnerId = currentPartner.get(socket.id);

        // Notify partner (if matched)
        if (partnerId) {
            const p = io.sockets.sockets.get(partnerId);
            if (p) p.emit("partner-left");
            currentPartner.delete(partnerId);
            currentPartner.delete(socket.id);
        }


        leaveQueueIfAny(socket);
        socket.emit("left_queue");
    });
    socket.on("disconnect", () => {
        const partnerId = currentPartner.get(socket.id);
        if (partnerId) {
            const p = io.sockets.sockets.get(partnerId);
            if (p) p.emit("partner-left");
            currentPartner.delete(partnerId);
            currentPartner.delete(socket.id);
        }

        leaveQueueIfAny(socket);
    });

    function enqueueSocket(problem, socket) {
        const q = queues.get(problem) || [];
        q.push(socket.id);
        queues.set(problem, q);
        socketToQueueKey.set(socket.id, problem);
        socket.emit("searching");
    }

    function leaveQueueIfAny(socket) {
        const k = socketToQueueKey.get(socket.id);
        if (!k) return;
        const q = queues.get(k) || [];
        const idx = q.indexOf(socket.id);
        if (idx !== -1) q.splice(idx, 1);
        if (q.length === 0) queues.delete(k);
        else queues.set(k, q);
        socketToQueueKey.delete(socket.id);
    }
}

// cleanup on disconnect
installMatchmaker.handleDisconnect = function (socket) {
    const k = socketToQueueKey.get(socket.id);
    if (!k) return;
    const q = queues.get(k) || [];
    const idx = q.indexOf(socket.id);
    if (idx !== -1) q.splice(idx, 1);
    if (q.length === 0) queues.delete(k);
    else queues.set(k, q);
    socketToQueueKey.delete(socket.id);
};
