// callHandler.js
export default function callHandler(io, socket) {
    // Forward offers, answers, and ICE candidates to the room partner(s)
    // Events expected from client: 'webrtc-offer', 'webrtc-answer', 'webrtc-ice-candidate'
    // Payload example: { roomId, targetSocketId, sdp } or { roomId, candidate, targetSocketId }

    socket.on("webrtc-offer", (payload) => {
        // forward to the partner socket
        const { roomId, targetSocketId, sdp } = payload;
        console.log("offer from", socket.id, "to", targetSocketId, "room", roomId);
        if (targetSocketId) {
            io.to(targetSocketId).emit("webrtc-offer", { from: socket.id, sdp });
        } else {
            // broadcast to other in room
            socket.to(roomId).emit("webrtc-offer", { from: socket.id, sdp });
        }
    });

    socket.on("webrtc-answer", (payload) => {
        const { roomId, targetSocketId, sdp } = payload;
        console.log("answer from", socket.id, "to", targetSocketId || "room:" + roomId);
        if (targetSocketId) {
            io.to(targetSocketId).emit("webrtc-answer", { from: socket.id, sdp });
        } else {
            socket.to(roomId).emit("webrtc-answer", { from: socket.id, sdp });
        }
    });

    socket.on("webrtc-ice-candidate", (payload) => {
        const { roomId, targetSocketId, candidate } = payload;
        if (targetSocketId) {
            io.to(targetSocketId).emit("webrtc-ice-candidate", { from: socket.id, candidate });
        } else {
            socket.to(roomId).emit("webrtc-ice-candidate", { from: socket.id, candidate });
        }
    });

    socket.on('hangup', ({ roomId }) => {
        socket.to(roomId).emit('partner-left');
        const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        socketsInRoom.forEach(sid => {
            const s = io.sockets.sockets.get(sid);
            if (s) s.leave(roomId);
        });
    });


    // OPTIONAL: text chat via signaling (if you don't want datachannel)
    socket.on("send-chat", ({ roomId, message }) => {
        socket.to(roomId).emit("recv-chat", { from: socket.id, message });
    });
}
