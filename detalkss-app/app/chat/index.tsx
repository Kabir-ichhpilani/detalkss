import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { socket } from '@/utils/socket';

type Message = {
    id: string;
    text: string;
    isMe: boolean;
    timestamp: number;
};

export default function ChatScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [status, setStatus] = useState<'idle' | 'searching' | 'connected'>('idle');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [partnerDisconnected, setPartnerDisconnected] = useState(false);

    // Auto-scroll to bottom
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        setupSocket();
        startSearching();

        return () => {
            leaveChat();
        };
    }, []);

    const setupSocket = () => {
        socket.on('searching', () => {
            setStatus('searching');
            setPartnerDisconnected(false);
        });

        socket.on('matched', ({ roomId: rid }) => {
            console.log('Matched in chat room:', rid);
            setStatus('connected');
            setRoomId(rid);
            setPartnerDisconnected(false);
            setMessages([]); // Clear old messages
            // Add system message
            addSystemMessage("You're connected with a stranger. Say hi!");
        });

        socket.on('recv-chat', ({ message }) => {
            addMessage(message, false);
        });

        socket.on('partner-left', () => {
            setPartnerDisconnected(true);
            addSystemMessage("Partner disconnected.");
            setStatus('idle'); // Technically idle but keeping msgs visible
        });
    };

    const startSearching = () => {
        setStatus('searching');
        setMessages([]);
        setPartnerDisconnected(false);
        socket.emit('join_call_queue', { problem: 'chat' }); // Using 'chat' as the 'problem' key to separate from voice
    };

    const leaveChat = () => {
        socket.emit('leave_call_queue');
        if (roomId) {
            socket.emit('hangup', { roomId });
        }
        socket.off('searching');
        socket.off('matched');
        socket.off('recv-chat');
        socket.off('partner-left');
    };

    const handleSend = () => {
        if (!inputText.trim() || status !== 'connected') return;

        const text = inputText.trim();
        addMessage(text, true);
        socket.emit('send-chat', { roomId, message: text });
        setInputText('');
    };

    const addMessage = (text: string, isMe: boolean) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            text,
            isMe,
            timestamp: Date.now()
        }]);
    };

    const addSystemMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            text,
            isMe: false, // System messages represented as specialized look or simplified
            timestamp: Date.now(),
            isSystem: true
        } as any]);
    };

    const handleSkip = () => {
        socket.emit('leave_call_queue');
        startSearching();
    };

    const handleEnd = () => {
        Alert.alert(
            "End Chat",
            "Are you sure you want to leave?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "End",
                    style: 'destructive',
                    onPress: () => {
                        leaveChat();
                        router.back();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        if (item.isSystem) {
            return (
                <View style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{item.text}</Text>
                </View>
            );
        }
        return (
            <View style={[
                styles.messageBubble,
                item.isMe ? styles.myMessage : styles.theirMessage
            ]}>
                <Text style={[
                    styles.messageText,
                    item.isMe ? styles.myMessageText : styles.theirMessageText
                ]}>{item.text}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <View style={styles.statusDotContainer}>
                            <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? '#22c55e' : '#fbbf24' }]} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Stranger</Text>
                            <Text style={styles.headerSubtitle}>{status === 'connected' ? 'Online now' : 'Searching...'}</Text>
                        </View>
                        <View style={styles.anonBadge}>
                            <Text style={styles.anonText}>ANON</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleEnd} style={styles.endHeaderButton}>
                        <Text style={styles.endHeaderText}>End</Text>
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="add-circle-outline" size={28} color="#9ca3af" />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={status === 'connected' ? "Type a message..." : "Waiting for partner..."}
                            placeholderTextColor="#6b7280"
                            editable={status === 'connected' && !partnerDisconnected}
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
                        />

                        <TouchableOpacity
                            onPress={handleSend}
                            style={[styles.sendButton, (!inputText.trim() || status !== 'connected') && styles.sendButtonDisabled]}
                            disabled={!inputText.trim() || status !== 'connected'}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Controls */}
                    <View style={styles.bottomControls}>
                        <TouchableOpacity onPress={handleEnd} style={styles.controlButton}>
                            <Ionicons name="close" size={20} color="#9ca3af" />
                            <Text style={styles.controlText}>STOP</Text>
                        </TouchableOpacity>

                        {(status === 'connected' || partnerDisconnected) && (
                            <TouchableOpacity onPress={handleSkip} style={styles.controlButton}>
                                <Text style={styles.controlText}>NEXT PERSON</Text>
                                <Ionicons name="play-skip-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDotContainer: {
        marginRight: 12,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#9ca3af',
        fontSize: 12,
    },
    anonBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    anonText: {
        color: '#9ca3af',
        fontSize: 10,
        fontWeight: '600',
    },
    endHeaderButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    endHeaderText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    chatContent: {
        padding: 16,
        gap: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 16,
        borderRadius: 20,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#6366f1',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#e5e7eb',
    },
    systemMessageContainer: {
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(56, 189, 248, 0.1)', // Light blue tint
        borderRadius: 16,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    systemMessageText: {
        color: '#7dd3fc',
        fontSize: 13,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
        alignItems: 'center',
        backgroundColor: '#0f0c29',
    },
    iconButton: {
        padding: 4,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#374151',
        opacity: 0.5,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 12,
        backgroundColor: '#0f0c29',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    controlText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
