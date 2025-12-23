import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useUser } from '@clerk/clerk-expo';
import { socket } from '@/utils/socket';
import { ensureMicPermission } from "@/utils/permisions";
import {
    initPeer,
    createOffer,
    muteLocalTracks,
    closeConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    peerConnection,
    localStream
} from "@/utils/webrtc";
import { updateStreak } from "@/utils/streak";
import AudioDebugger from '@/components/AudioDebugger';

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
    const { user } = useUser();
    const [status, setStatus] = useState("idle");
    const [partnerId, setPartnerId] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [muted, setMuted] = useState(false);
    const [remoteStream, setRemoteStream] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState("Not connected");
    const [debuggerKey, setDebuggerKey] = useState(0);

    // Animation values
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous rotation for gradient
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 10000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    useEffect(() => {
        // Pulse animation when searching
        if (status === "searching") {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [status]);

    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                    interruptionModeIOS: 2,
                    interruptionModeAndroid: 1,
                });
                console.log("✅ [Audio] Audio mode configured for VoIP");
            } catch (e) {
                console.error("❌ [Audio] Failed to set audio mode", e);
            }
        };
        configureAudio();

        socket.on("searching", () => {
            console.log("🔍 [Call] Searching for partner...");
            setStatus("searching");
        });

        socket.on("matched", async ({ roomId: rid, partnerId: pid }) => {
            console.log("🤝 [Call] Matched! Room:", rid, "Partner:", pid);
            setStatus("connecting");
            setPartnerId(pid);
            setRoomId(rid);
            setConnectionStatus("Initializing...");

            try {
                await initPeer(rid, {
                    onLocalStream: () => {
                        console.log("✅ [Call] Local stream ready");
                        setConnectionStatus("Local stream ready");
                        setDebuggerKey(prev => prev + 1);
                    },
                    onRemoteStream: (stream: any) => {
                        console.log("✅ [Call] Remote stream received in UI!");
                        console.log("🔊 [Call] Remote stream tracks:", stream.getTracks().map((t: any) => t.kind));
                        setStatus("in-call");
                        setRemoteStream(stream);
                        setConnectionStatus("Connected - Audio active");
                        setDebuggerKey(prev => prev + 1);
                        if (user?.id) {
                            updateStreak(user.id).then(s => console.log("🔥 [Call] Streak updated:", s));
                        }
                    },
                });

                setConnectionStatus("Peer connection initialized");
                setDebuggerKey(prev => prev + 1);

                // @ts-ignore
                if (socket.id.localeCompare(pid) === -1) {
                    console.log("📞 [Call] I'm the caller, creating offer...");
                    await createOffer();
                    setConnectionStatus("Offer sent, waiting for answer...");
                } else {
                    console.log("📞 [Call] I'm the receiver, waiting for offer...");
                    setConnectionStatus("Waiting for offer...");
                }
            } catch (error) {
                console.error("❌ [Call] Error initializing peer:", error);
                setConnectionStatus("Error: " + error);
                setStatus("idle");
            }
        });

        socket.on("webrtc-offer", handleOffer);
        socket.on("webrtc-answer", handleAnswer);
        socket.on("webrtc-ice-candidate", handleIceCandidate);

        socket.on("partner-left", () => {
            console.log("👋 [Call] Partner left");
            closeConnection();
            setStatus("idle");
            setRemoteStream(null);
            setConnectionStatus("Not connected");
            setDebuggerKey(prev => prev + 1);
        });

        return () => {
            socket.off("searching");
            socket.off("matched");
            socket.off("webrtc-offer");
            socket.off("webrtc-answer");
            socket.off("webrtc-ice-candidate");
            socket.off("partner-left");
        };
    }, []);

    async function startCall() {
        console.log("📞 [Call] Starting call...");
        const allowed = await ensureMicPermission();
        if (!allowed) {
            console.error("❌ [Call] Microphone permission denied");
            alert("Mic permission required");
            return;
        }
        console.log("✅ [Call] Microphone permission granted");
        socket.emit("join_call_queue", { problem: "none" });
    }

    function endCall() {
        console.log("📞 [Call] Hanging up...");
        closeConnection();
        socket.emit("hangup", { roomId });
        setStatus("idle");
        setRemoteStream(null);
        setConnectionStatus("Not connected");
        setDebuggerKey(prev => prev + 1);
    }

    const getStatusColor = (): [string, string] => {
        switch (status) {
            case "idle": return ["#667eea", "#764ba2"];
            case "searching": return ["#f093fb", "#f5576c"];
            case "connecting": return ["#4facfe", "#00f2fe"];
            case "in-call": return ["#43e97b", "#38f9d7"];
            default: return ["#667eea", "#764ba2"];
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case "idle": return "📱";
            case "searching": return "🔍";
            case "connecting": return "⚡";
            case "in-call": return "🎙️";
            default: return "📱";
        }
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Animated Background Gradient */}
            <Animated.View style={[styles.backgroundGradient, { transform: [{ rotate }] }]}>
                <LinearGradient
                    colors={['#0f0c29', '#302b63', '#24243e']}
                    style={StyleSheet.absoluteFillObject}
                />
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>DeTalks</Text>
                        <Text style={styles.subtitle}>Anonymous Voice Connection</Text>
                    </View>

                    {/* Status Card */}
                    <Animated.View style={[styles.statusCard, { transform: [{ scale: pulseAnim }] }]}>
                        <LinearGradient
                            colors={getStatusColor()}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statusGradient}
                        >
                            <View style={styles.statusContent}>
                                <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
                                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                                <Text style={styles.connectionText}>{connectionStatus}</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Remote Stream Indicator */}
                    {remoteStream && (
                        <Animated.View style={styles.streamIndicator}>
                            <LinearGradient
                                colors={['rgba(67, 233, 123, 0.2)', 'rgba(56, 249, 215, 0.2)']}
                                style={styles.streamGradient}
                            >
                                <Text style={styles.streamIcon}>🎵</Text>
                                <Text style={styles.streamText}>Audio Stream Active</Text>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        {status === "idle" && (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={startCall}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>🚀 Start Call</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {status === "searching" && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => socket.emit("leave_call_queue")}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>❌ Cancel</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {status === "in-call" && (
                            <View style={styles.callControls}>
                                <TouchableOpacity
                                    style={styles.controlButton}
                                    onPress={() => {
                                        muteLocalTracks(!muted);
                                        setMuted(!muted);
                                        setDebuggerKey(prev => prev + 1);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={muted ? ['#f093fb', '#f5576c'] : ['#4facfe', '#00f2fe']}
                                        style={styles.controlGradient}
                                    >
                                        <Text style={styles.controlIcon}>{muted ? "🔇" : "🎤"}</Text>
                                        <Text style={styles.controlText}>{muted ? "Unmute" : "Mute"}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.controlButton}
                                    onPress={endCall}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#ff6b6b', '#ee5a6f']}
                                        style={styles.controlGradient}
                                    >
                                        <Text style={styles.controlIcon}>📞</Text>
                                        <Text style={styles.controlText}>Hang Up</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Hidden RTCView for audio */}
                    {remoteStream && (
                        <RTCView
                            streamURL={remoteStream.toURL()}
                            objectFit="cover"
                            style={{ width: 1, height: 1, opacity: 0 }}
                            mirror={false}
                        />
                    )}

                    {/* Audio Debugger */}
                    {(status === "connecting" || status === "in-call") && (
                        <View style={styles.debuggerContainer}>
                            <AudioDebugger
                                key={debuggerKey}
                                localStream={localStream}
                                remoteStream={remoteStream}
                                peerConnection={peerConnection}
                            />
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0c29',
    },
    backgroundGradient: {
        position: 'absolute',
        width: width * 2,
        height: height * 2,
        top: -height / 2,
        left: -width / 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 2,
        textShadowColor: 'rgba(103, 126, 234, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 8,
        letterSpacing: 1,
    },
    statusCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    statusGradient: {
        padding: 32,
    },
    statusContent: {
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 3,
        marginBottom: 8,
    },
    connectionText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 0.5,
    },
    streamIndicator: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    streamGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(67, 233, 123, 0.3)',
    },
    streamIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    streamText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#43e97b',
        letterSpacing: 0.5,
    },
    actionContainer: {
        marginTop: 24,
    },
    primaryButton: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    secondaryButton: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonGradient: {
        paddingVertical: 20,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 1,
    },
    callControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    controlButton: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    controlGradient: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    controlIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    controlText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    debuggerContainer: {
        marginTop: 32,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
});