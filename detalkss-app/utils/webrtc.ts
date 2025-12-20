import { mediaDevices, RTCPeerConnection, MediaStreamTrack } from "react-native-webrtc";
import { socket } from "./socket";

export let peerConnection: RTCPeerConnection | null = null;
// @ts-ignore
export let localStream: any = null;
let currentRoomId: string | null = null;

const ICE_SERVERS = {
    iceServers: [
        // STUN servers for discovering public IP
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },

        // TURN servers - Multiple free providers for reliability on restrictive networks
        // Metered TURN servers (free, multiple transports)
        {
            urls: "turn:a.relay.metered.ca:80",
            username: "87a47a763f3fe5005efb8f47",
            credential: "0FujrKJJcWw6T+Pj",
        },
        {
            urls: "turn:a.relay.metered.ca:80?transport=tcp",
            username: "87a47a763f3fe5005efb8f47",
            credential: "0FujrKJJcWw6T+Pj",
        },
        {
            urls: "turn:a.relay.metered.ca:443",
            username: "87a47a763f3fe5005efb8f47",
            credential: "0FujrKJJcWw6T+Pj",
        },
        {
            urls: "turn:a.relay.metered.ca:443?transport=tcp",
            username: "87a47a763f3fe5005efb8f47",
            credential: "0FujrKJJcWw6T+Pj",
        },

        // OpenRelay backup servers
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
        },

        // Numb STUN/TURN (free backup)
        {
            urls: "turn:numb.viagenie.ca",
            username: "webrtc@live.com",
            credential: "muazkh",
        },
    ],
    iceCandidatePoolSize: 10,
    // Try all connection types (host, srflx, relay) - will use relay on restrictive networks
    iceTransportPolicy: "all" as const,
};

// @ts-ignore
export async function initPeer(roomId: string, { onLocalStream, onRemoteStream }: any) {
    console.log("🔵 [WebRTC] Initializing peer connection for room:", roomId);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection = pc;
    currentRoomId = roomId;

    console.log("🎤 [WebRTC] Requesting microphone access...");
    localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
    });

    console.log("✅ [WebRTC] Local stream captured, tracks:", localStream.getTracks().length);
    localStream.getTracks().forEach((track: MediaStreamTrack) => {
        console.log("➕ [WebRTC] Adding track to peer connection:", track.kind, track.id);
        // Explicitly enable the track
        track.enabled = true;
        console.log("🔊 [WebRTC] Track enabled:", track.enabled, "state:", track.readyState);
        pc.addTrack(track, localStream);
    });

    // Verify tracks are enabled after adding
    localStream.getAudioTracks().forEach((track: any) => {
        console.log("🔍 [WebRTC] Audio track after adding - enabled:", track.enabled, "muted:", track.muted, "state:", track.readyState);
    });

    onLocalStream(localStream);

    pc.ontrack = (event: any) => {
        console.log("🎵 [WebRTC] Remote track received!", event.track.kind, event.track.id);
        console.log("🎵 [WebRTC] Remote streams:", event.streams.length);
        const remote = event.streams[0];
        if (remote) {
            console.log("✅ [WebRTC] Remote stream has", remote.getTracks().length, "tracks");
            remote.getAudioTracks().forEach((t: any) => {
                t.enabled = true;
                console.log("🔊 [WebRTC] Remote track enabled:", t.enabled);
            });
            onRemoteStream(remote);
        } else {
            console.error("❌ [WebRTC] No remote stream in track event!");
        }
    };

    pc.onicecandidate = (event: any) => {
        if (event.candidate) {
            const candidateType = event.candidate.type || 'unknown';
            const protocol = event.candidate.protocol || 'unknown';
            console.log(`🧊 [WebRTC] Sending ICE candidate: type=${candidateType}, protocol=${protocol}`);
            console.log(`🧊 [WebRTC] Candidate details:`, event.candidate.candidate);
            socket.emit("webrtc-ice-candidate", {
                roomId: currentRoomId,
                candidate: event.candidate,
            });
        } else {
            console.log("🧊 [WebRTC] ICE gathering complete");
        }
    };

    pc.onconnectionstatechange = () => {
        console.log("🔗 [WebRTC] Connection state:", pc.connectionState);
        if (pc.connectionState === "failed") {
            console.warn("⚠️ [WebRTC] Connection failed – attempting ICE restart");
            (pc as any).restartIce?.();
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log("🧊 [WebRTC] ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
            console.warn("⚠️ [WebRTC] ICE failed – attempting ICE restart");
            (pc as any).restartIce?.();
        }
    };

    pc.onsignalingstatechange = () => {
        console.log("📡 [WebRTC] Signaling state:", pc.signalingState);
    };

    console.log("✅ [WebRTC] Peer connection initialized");
    return pc;
}

export async function createOffer() {
    if (!peerConnection) {
        console.error("❌ [WebRTC] Cannot create offer: no peer connection");
        return;
    }
    console.log("📤 [WebRTC] Creating offer...");
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("✅ [WebRTC] Offer created and set as local description");

    socket.emit("webrtc-offer", { roomId: currentRoomId, sdp: offer });
    console.log("📤 [WebRTC] Offer sent to room:", currentRoomId);
}

export async function handleOffer({ from, sdp }: any) {
    if (!peerConnection) {
        console.error("❌ [WebRTC] Cannot handle offer: no peer connection");
        return;
    }
    console.log("📥 [WebRTC] Received offer from:", from);
    await peerConnection.setRemoteDescription(sdp);
    console.log("✅ [WebRTC] Remote description set from offer");

    console.log("📤 [WebRTC] Creating answer...");
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("✅ [WebRTC] Answer created and set as local description");

    socket.emit("webrtc-answer", { roomId: currentRoomId, sdp: answer });
    console.log("📤 [WebRTC] Answer sent to room:", currentRoomId);
}

export async function handleAnswer({ from, sdp }: any) {
    if (!peerConnection) {
        console.error("❌ [WebRTC] Cannot handle answer: no peer connection");
        return;
    }
    console.log("📥 [WebRTC] Received answer from:", from);
    await peerConnection.setRemoteDescription(sdp);
    console.log("✅ [WebRTC] Remote description set from answer");
}

export async function handleIceCandidate({ from, candidate }: any) {
    if (peerConnection) {
        try {
            console.log("🧊 [WebRTC] Received ICE candidate from:", from, "type:", candidate.type);
            await peerConnection.addIceCandidate(candidate);
            console.log("✅ [WebRTC] ICE candidate added");
        } catch (err) {
            console.error("❌ [WebRTC] ICE CANDIDATE ERROR", err);
        }
    } else {
        console.error("❌ [WebRTC] Cannot add ICE candidate: no peer connection");
    }
}

export function muteLocalTracks(mute: boolean) {
    if (!localStream) return;

    console.log(mute ? "🔇 [WebRTC] Muting local audio" : "🔊 [WebRTC] Unmuting local audio");
    localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !mute;
        console.log("🔊 [WebRTC] Track enabled after mute toggle:", track.enabled);
    });
}

export function closeConnection() {
    console.log("🔴 [WebRTC] Closing connection...");
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        console.log("✅ [WebRTC] Peer connection closed");
    }
    if (localStream) {
        localStream.getTracks().forEach((t: any) => t.stop());
        localStream = null;
        console.log("✅ [WebRTC] Local stream stopped");
    }
    currentRoomId = null;
}