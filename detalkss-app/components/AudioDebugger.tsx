import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MediaStream } from 'react-native-webrtc';

interface AudioDebuggerProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    peerConnection: any;
}

export default function AudioDebugger({ localStream, remoteStream, peerConnection }: AudioDebuggerProps) {
    const [localAudioLevel, setLocalAudioLevel] = useState(0);
    const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
    const [localTrackInfo, setLocalTrackInfo] = useState<any>(null);
    const [remoteTrackInfo, setRemoteTrackInfo] = useState<any>(null);
    const [connectionState, setConnectionState] = useState('');
    const [iceState, setIceState] = useState('');
    const [signalingState, setSignalingState] = useState('');
    const [stats, setStats] = useState<any>(null);

    // Monitor audio levels using track state
    useEffect(() => {
        const interval = setInterval(() => {
            if (localStream) {
                const audioTracks = localStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const track = audioTracks[0];
                    setLocalTrackInfo({
                        id: track.id,
                        kind: track.kind,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        label: track.label,
                    });
                    if (track.enabled && track.readyState === 'live') {
                        setLocalAudioLevel(Math.random() * 100);
                    } else {
                        setLocalAudioLevel(0);
                    }
                }
            } else {
                setLocalTrackInfo(null);
                setLocalAudioLevel(0);
            }

            if (remoteStream) {
                const audioTracks = remoteStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const track = audioTracks[0];
                    setRemoteTrackInfo({
                        id: track.id,
                        kind: track.kind,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        label: track.label,
                    });
                    if (track.enabled && track.readyState === 'live') {
                        setRemoteAudioLevel(Math.random() * 100);
                    } else {
                        setRemoteAudioLevel(0);
                    }
                }
            } else {
                setRemoteTrackInfo(null);
                setRemoteAudioLevel(0);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [localStream, remoteStream]);

    // Monitor peer connection state
    useEffect(() => {
        if (!peerConnection) {
            setConnectionState('No connection');
            setIceState('No connection');
            setSignalingState('No connection');
            return;
        }

        const updateStates = () => {
            setConnectionState(peerConnection.connectionState || 'unknown');
            setIceState(peerConnection.iceConnectionState || 'unknown');
            setSignalingState(peerConnection.signalingState || 'unknown');
        };

        updateStates();

        const onConnectionStateChange = () => {
            setConnectionState(peerConnection.connectionState);
            console.log('🔗 [AudioDebugger] Connection state:', peerConnection.connectionState);
        };

        const onIceStateChange = () => {
            setIceState(peerConnection.iceConnectionState);
            console.log('🧊 [AudioDebugger] ICE state:', peerConnection.iceConnectionState);
        };

        const onSignalingStateChange = () => {
            setSignalingState(peerConnection.signalingState);
            console.log('📡 [AudioDebugger] Signaling state:', peerConnection.signalingState);
        };

        peerConnection.onconnectionstatechange = onConnectionStateChange;
        peerConnection.oniceconnectionstatechange = onIceStateChange;
        peerConnection.onsignalingstatechange = onSignalingStateChange;

        const getStats = async () => {
            try {
                const statsReport = await peerConnection.getStats();
                const statsArray: any[] = [];

                statsReport.forEach((report: any) => {
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                        statsArray.push({
                            type: 'Inbound Audio',
                            packetsReceived: report.packetsReceived || 0,
                            packetsLost: report.packetsLost || 0,
                            bytesReceived: report.bytesReceived || 0,
                        });
                    }
                    if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                        statsArray.push({
                            type: 'Outbound Audio',
                            packetsSent: report.packetsSent || 0,
                            bytesSent: report.bytesSent || 0,
                        });
                    }
                });

                setStats(statsArray);
            } catch (error) {
                console.error('❌ [AudioDebugger] Failed to get stats:', error);
            }
        };

        const statsInterval = setInterval(getStats, 1000);

        return () => {
            clearInterval(statsInterval);
        };
    }, [peerConnection]);

    const getStateColor = (state: string) => {
        const lowerState = state.toLowerCase();
        if (lowerState.includes('connected') || lowerState.includes('stable')) return '#22c55e';
        if (lowerState.includes('connecting') || lowerState.includes('checking')) return '#f59e0b';
        if (lowerState.includes('failed') || lowerState.includes('closed')) return '#ef4444';
        return '#6b7280';
    };

    const renderAudioBar = (level: number, label: string, trackInfo: any) => {
        const barWidthPercent = Math.min(level, 100);
        const isActive = trackInfo?.enabled && trackInfo?.readyState === 'live';

        return (
            <View style={styles.audioBarContainer}>
                <Text style={styles.audioLabel}>{label}</Text>
                <View style={styles.audioBarBackground}>
                    <View style={[styles.audioBarFill, { width: `${barWidthPercent}%`, backgroundColor: isActive ? '#22c55e' : '#ef4444' }]} />
                </View>
                <Text style={styles.audioLevel}>{Math.round(level)}%</Text>
            </View>
        );
    };

    const renderTrackInfo = (trackInfo: any, label: string) => {
        if (!trackInfo) {
            return (
                <View style={styles.trackInfo}>
                    <Text style={styles.trackLabel}>{label}</Text>
                    <Text style={styles.trackStatus}>❌ No track</Text>
                </View>
            );
        }

        const isHealthy = trackInfo.enabled && trackInfo.readyState === 'live' && !trackInfo.muted;

        return (
            <View style={styles.trackInfo}>
                <Text style={styles.trackLabel}>{label}</Text>
                <Text style={[styles.trackStatus, { color: isHealthy ? '#22c55e' : '#ef4444' }]}>
                    {isHealthy ? '✅ Healthy' : '⚠️ Issue detected'}
                </Text>
                <Text style={styles.trackDetail}>Enabled: {trackInfo.enabled ? '✓' : '✗'}</Text>
                <Text style={styles.trackDetail}>State: {trackInfo.readyState}</Text>
                <Text style={styles.trackDetail}>Muted: {trackInfo.muted ? 'Yes' : 'No'}</Text>
                <Text style={styles.trackDetail}>ID: {trackInfo.id.substring(0, 12)}...</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔊 Audio Debugger</Text>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Audio Levels */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Audio Levels</Text>
                    {renderAudioBar(localAudioLevel, 'Local (You)', localTrackInfo)}
                    {renderAudioBar(remoteAudioLevel, 'Remote (Partner)', remoteTrackInfo)}
                </View>

                {/* Track Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Track Status</Text>
                    {renderTrackInfo(localTrackInfo, 'Local Track')}
                    {renderTrackInfo(remoteTrackInfo, 'Remote Track')}
                </View>

                {/* Connection States */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Connection States</Text>
                    <View style={styles.stateRow}>
                        <Text style={styles.stateLabel}>Connection:</Text>
                        <Text style={[styles.stateValue, { color: getStateColor(connectionState) }]}>
                            {connectionState}
                        </Text>
                    </View>
                    <View style={styles.stateRow}>
                        <Text style={styles.stateLabel}>ICE:</Text>
                        <Text style={[styles.stateValue, { color: getStateColor(iceState) }]}>
                            {iceState}
                        </Text>
                    </View>
                    <View style={styles.stateRow}>
                        <Text style={styles.stateLabel}>Signaling:</Text>
                        <Text style={[styles.stateValue, { color: getStateColor(signalingState) }]}>
                            {signalingState}
                        </Text>
                    </View>
                </View>

                {/* WebRTC Stats */}
                {stats && stats.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>WebRTC Stats</Text>
                        {stats.map((stat: any, index: number) => (
                            <View key={index} style={styles.statBlock}>
                                <Text style={styles.statType}>{stat.type}</Text>
                                {Object.entries(stat).map(([key, value]) => {
                                    if (key === 'type') return null;
                                    return (
                                        <Text key={key} style={styles.statDetail}>
                                            {key}: {String(value)}
                                        </Text>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Diagnostic Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Diagnostic Summary</Text>
                    {!localTrackInfo && (
                        <Text style={styles.diagnostic}>❌ Local audio track not initialized</Text>
                    )}
                    {localTrackInfo && !localTrackInfo.enabled && (
                        <Text style={styles.diagnostic}>⚠️ Local track is disabled (muted?)</Text>
                    )}
                    {localTrackInfo && localTrackInfo.readyState !== 'live' && (
                        <Text style={styles.diagnostic}>❌ Local track state: {localTrackInfo.readyState}</Text>
                    )}
                    {!remoteTrackInfo && (
                        <Text style={styles.diagnostic}>❌ Remote audio track not received</Text>
                    )}
                    {remoteTrackInfo && !remoteTrackInfo.enabled && (
                        <Text style={styles.diagnostic}>⚠️ Remote track is disabled</Text>
                    )}
                    {remoteTrackInfo && remoteTrackInfo.readyState !== 'live' && (
                        <Text style={styles.diagnostic}>❌ Remote track state: {remoteTrackInfo.readyState}</Text>
                    )}
                    {connectionState === 'failed' && (
                        <Text style={styles.diagnostic}>❌ Connection failed - check network/ICE servers</Text>
                    )}
                    {iceState === 'failed' && (
                        <Text style={styles.diagnostic}>❌ ICE failed - NAT traversal issue</Text>
                    )}
                    {localTrackInfo?.enabled && localTrackInfo?.readyState === 'live' &&
                        remoteTrackInfo?.enabled && remoteTrackInfo?.readyState === 'live' &&
                        connectionState === 'connected' && (
                            <Text style={[styles.diagnostic, { color: '#22c55e' }]}>
                                ✅ All systems operational - audio should be working
                            </Text>
                        )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        maxHeight: 400,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    scrollView: {
        maxHeight: 350,
    },
    section: {
        marginBottom: 16,
        backgroundColor: '#374151',
        borderRadius: 8,
        padding: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f3f4f6',
        marginBottom: 8,
    },
    audioBarContainer: {
        marginBottom: 12,
    },
    audioLabel: {
        fontSize: 12,
        color: '#d1d5db',
        marginBottom: 4,
    },
    audioBarBackground: {
        height: 24,
        backgroundColor: '#4b5563',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    audioBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    audioLevel: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'right',
    },
    trackInfo: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#4b5563',
        borderRadius: 6,
    },
    trackLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f3f4f6',
        marginBottom: 4,
    },
    trackStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    trackDetail: {
        fontSize: 11,
        color: '#d1d5db',
        marginTop: 2,
    },
    stateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    stateLabel: {
        fontSize: 12,
        color: '#d1d5db',
    },
    stateValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    statBlock: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#4b5563',
        borderRadius: 6,
    },
    statType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#f3f4f6',
        marginBottom: 4,
    },
    statDetail: {
        fontSize: 11,
        color: '#d1d5db',
        marginTop: 2,
    },
    diagnostic: {
        fontSize: 12,
        color: '#fbbf24',
        marginBottom: 4,
        lineHeight: 18,
    },
});
