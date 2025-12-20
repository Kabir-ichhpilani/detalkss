import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStreak } from '@/utils/streak';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        loadStreak();
    }, []);

    const loadStreak = async () => {
        if (user?.id) {
            const s = await getStreak(user.id);
            setStreak(s);
        }
    };

    const handleEditProfile = () => {
        // Placeholder for edit functionality
        Alert.alert("Edit Profile", "Functionality to change username/icon coming shortly!");
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {/* Back Button since we pushed from Home */}
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Profile</Text>
                    </View>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Ionicons name="settings-sharp" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Avatar Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={['#7c3aed', '#db2777']}
                                style={styles.avatarGradient}
                            >
                                <Image
                                    source={{ uri: user?.imageUrl || 'https://i.pravatar.cc/150' }}
                                    style={styles.avatar}
                                />
                            </LinearGradient>
                            <View style={styles.onlineIndicator} />
                        </View>

                        <Text style={styles.name}>{user?.fullName || user?.firstName || 'Alex Rivera'}</Text>
                        <Text style={styles.handle}>@{user?.username || 'user'} • He/Him</Text>

                        <TouchableOpacity style={styles.statusButton}>
                            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                            <Text style={styles.statusText}>Feeling electric today</Text>
                        </TouchableOpacity>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shareButton}>
                                <Ionicons name="share-social-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={styles.statContent}>
                                <Text style={styles.statNumber}>{streak}</Text>
                                <FontAwesome5 name="fire" size={20} color="#4b5563" style={styles.statIcon} />
                            </View>
                            <Text style={styles.statLabel}>DAY STREAK</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={styles.statContent}>
                                <Text style={styles.statNumber}>45</Text>
                                <FontAwesome5 name="lightbulb" size={20} color="#4b5563" style={styles.statIcon} />
                            </View>
                            <Text style={styles.statLabel}>SOLUTIONS</Text>
                        </View>
                    </View>

                    {/* Mood History */}
                    <LinearGradient
                        colors={['#1e1b4b', '#2e1065']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.moodCard}
                    >
                        <View style={styles.moodHeader}>
                            <View>
                                <Text style={styles.moodTitle}>Mood History</Text>
                                <Text style={styles.moodSubtitle}>Last 7 days trend</Text>
                            </View>
                            <View style={styles.trendIcon}>
                                <Ionicons name="trending-up" size={16} color="#9ca3af" />
                            </View>
                        </View>

                        <View style={styles.chartContainer}>
                            {/* Mock Bar Chart */}
                            <View style={[styles.bar, { height: 40 }]} />
                            <View style={[styles.bar, { height: 60 }]} />
                            <View style={[styles.bar, { height: 30 }]} />
                            <View style={[styles.bar, { height: 80 }]} />
                            <View style={[styles.bar, { height: 50 }]} />
                            <View style={[styles.bar, { height: 90, backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOpacity: 0.5, shadowRadius: 8 }]} />
                            <View style={[styles.bar, { height: 70 }]} />
                        </View>
                    </LinearGradient>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0c29',
    },
    safeArea: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    settingsBtn: {
        padding: 4,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatarGradient: {
        padding: 4,
        borderRadius: 64,
        elevation: 10,
        shadowColor: '#db2777',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#0f0c29',
    },
    onlineIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#22c55e',
        position: 'absolute',
        bottom: 8,
        right: 8,
        borderWidth: 4,
        borderColor: '#0f0c29',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    handle: {
        fontSize: 16,
        color: '#9ca3af',
        marginBottom: 16,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 27, 75, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    statusText: {
        color: '#e5e7eb',
        fontSize: 14,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    editButton: {
        flex: 1,
        backgroundColor: '#4f46e5',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    shareButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#131127',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    statIcon: {
        opacity: 0.5,
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    moodCard: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    moodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    moodTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    moodSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    trendIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingHorizontal: 8,
    },
    bar: {
        width: 24,
        backgroundColor: '#312e81',
        borderRadius: 8,
    },
    logoutButton: {
        marginTop: 32,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    }
});
