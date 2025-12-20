import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, PanResponder, Alert, Animated } from "react-native";
import { Link, useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { socket, API_URL } from "@/utils/socket";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [sliderValue, setSliderValue] = useState(0.5);

    // Animation for slider knob
    const panPos = useRef(new Animated.Value(0.5)).current;

    async function saveUserToBackend() {
        try {
            const token = await getToken();
            console.log("Saving user to:", `${API_URL}/api/user/save`);
            const res = await fetch(`${API_URL}/api/user/save`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // @ts-ignore
                    clerkId: user?.id,
                    // @ts-ignore
                    email: user?.primaryEmailAddress?.emailAddress,
                    // @ts-ignore
                    username: user?.username,
                    gender: "male",
                    problem: "none",
                    condition: "healthy",
                }),
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                console.log("Saved user:", data);
            } catch (jsonError) {
                console.error("Failed to parse response:", text);
            }
        } catch (error) {
            console.log("Error saving user:", error);
        }
    }

    useEffect(() => {
        if (!isLoaded || !user) return;
        saveUserToBackend();
    }, [isLoaded, user]);

    const handleNotification = () => {
        Alert.alert("Notifications", "You have no new notifications.");
    };

    const handleTrendingClick = (tag: string) => {
        Alert.alert("Trending Topic", `Browsing posts for ${tag}... \n(Feature coming soon!)`);
    };

    const handleViewAllTrends = () => {
        Alert.alert("Trending", "Opening all trending topics...");
    };

    // Slider PanResponder
    const sliderWidth = width - 80; // Approximate width (padding 20*2 + card padding 20*2)
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                // Initialize potentially
            },
            onPanResponderMove: (evt, gestureState) => {
                // Calculate new value based on touch position relative to slider
                // This is a simplified approach assuming full width drag
                // For better precision we'd measure the view.
                // Using gestureState.moveX is tricky without offset.
                // Let's rely on dx for delta changes

                // Better approach: simple increment/decrement
                let newValue = sliderValue + (gestureState.dx / sliderWidth);
                newValue = Math.max(0, Math.min(1, newValue));
                setSliderValue(newValue);
            },
            onPanResponderRelease: (evt, gestureState) => {
                // Determine final value
                // In a real app we'd verify the user wants to commit this mood
            },
        })
    ).current;

    // Vibe Check Component
    const VibeCheck = () => (
        <LinearGradient
            colors={['#2a1b3d', '#1a0b2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vibeCard}
        >
            <View style={styles.vibeHeader}>
                <View style={styles.vibeTitleRow}>
                    <MaterialCommunityIcons name="lightning-bolt" size={20} color="#a78bfa" />
                    <Text style={styles.vibeTitle}>Vibe Check</Text>
                </View>
                <View style={styles.moodBadge}>
                    <Text style={styles.moodBadgeText}>Mood Tracker</Text>
                </View>
            </View>

            <View style={styles.moodIcons}>
                <TouchableOpacity onPress={() => setSliderValue(0)}><FontAwesome5 name="sad-tear" size={24} color={sliderValue < 0.3 ? "#ef4444" : "#4b5563"} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setSliderValue(0.5)}><FontAwesome5 name="meh" size={24} color={sliderValue >= 0.3 && sliderValue <= 0.7 ? "#fbbf24" : "#4b5563"} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setSliderValue(1)}><FontAwesome5 name="bolt" size={24} color={sliderValue > 0.7 ? "#10b981" : "#4b5563"} /></TouchableOpacity>
            </View>

            <View style={styles.sliderContainer} {...panResponder.panHandlers}>
                <LinearGradient
                    colors={['#6366f1', '#a855f7', '#ec4899']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.sliderTrack}
                >
                    <View style={[styles.sliderKnob, { left: `${sliderValue * 90}%` }]}>
                        <View style={styles.sliderKnobInner} />
                    </View>
                </LinearGradient>
            </View>

            <Text style={styles.sliderText}>
                {sliderValue < 0.3 ? "Feeling low..." : sliderValue > 0.7 ? "Feeling energized!" : "Just cruising..."}
            </Text>
        </LinearGradient>
    );

    const Header = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                    <Image
                        source={{ uri: user?.imageUrl || 'https://i.pravatar.cc/150' }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
                <View>
                    <Text style={styles.greeting}>Good evening,</Text>
                    <Text style={styles.username}>
                        {user?.firstName || user?.username || 'Alex'} <Text style={styles.moon}>🌙</Text>
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn} onPress={handleNotification}>
                <Ionicons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const ActionCard = ({ title, subtitle, icon, color, onPress, image }: any) => (
        <TouchableOpacity style={styles.actionCardContainer} onPress={onPress}>
            <LinearGradient
                colors={['#1e1b4b', '#000000']}
                style={styles.actionCard}
            >
                <View style={styles.actionIconContainer}>
                    {icon}
                </View>

                {/* Decorative wave/path would go here ideally */}

                <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{title}</Text>
                    <Text style={styles.actionSubtitle}>{subtitle}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Header />

                    <VibeCheck />

                    <View style={styles.actionsRow}>
                        <ActionCard
                            title="Vent Anonymously"
                            subtitle="Text chat"
                            icon={<FontAwesome5 name="lock" size={20} color="#fff" />}
                            onPress={() => router.push('/chat' as Href)}
                        />
                        <View style={{ width: 16 }} />
                        <ActionCard
                            title="Start Voice Call"
                            subtitle="Talk now"
                            icon={<FontAwesome5 name="microphone" size={20} color="#fff" />}
                            onPress={() => router.push('/call' as Href)}
                        />
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Trending on the Hive</Text>
                        <TouchableOpacity onPress={handleViewAllTrends}>
                            <Text style={styles.viewAll}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
                        <TouchableOpacity style={styles.tag} onPress={() => handleTrendingClick("#ExamStress")}>
                            <FontAwesome5 name="graduation-cap" size={14} color="#fbbf24" style={{ marginRight: 8 }} />
                            <Text style={styles.tagText}>#ExamStress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tag, { borderColor: '#7c3aed' }]} onPress={() => handleTrendingClick("#RelationshipDrama")}>
                            <FontAwesome5 name="heart-broken" size={14} color="#ef4444" style={{ marginRight: 8 }} />
                            <Text style={[styles.tagText, { color: '#a78bfa' }]}>#RelationshipDrama</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tag, { borderColor: '#10b981' }]} onPress={() => handleTrendingClick("#WorkLife")}>
                            <FontAwesome5 name="briefcase" size={14} color="#10b981" style={{ marginRight: 8 }} />
                            <Text style={[styles.tagText, { color: '#6ee7b7' }]}>#WorkLife</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <LinearGradient
                        colors={['#2e1065', '#1e1b4b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.insightCard}
                    >
                        <View style={styles.insightHeader}>
                            <Ionicons name="bulb" size={18} color="#fbbf24" />
                            <Text style={styles.insightLabel}>DAILY INSIGHT</Text>
                        </View>
                        <Text style={styles.insightTitle}>Did you know?</Text>
                        <Text style={styles.insightText}>
                            Just 15 minutes of venting can reduce cortisol levels by up to 20%. Let it out, we're listening.
                        </Text>
                    </LinearGradient>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#7c3aed',
        marginRight: 12,
    },
    greeting: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    username: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    moon: {
        fontSize: 20,
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vibeCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    vibeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    vibeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    vibeTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    moodBadge: {
        backgroundColor: 'rgba(124, 58, 237, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    moodBadgeText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '500',
    },
    moodIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    sliderContainer: {
        height: 30,
        justifyContent: 'center',
        marginBottom: 8,
    },
    sliderTrack: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        justifyContent: 'center',
    },
    sliderKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        // 'left' is handled dynamically in style prop
        marginLeft: -12, // center the knob
    },
    sliderKnobInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#7c3aed',
    },
    sliderText: {
        color: '#9ca3af',
        textAlign: 'center',
        fontSize: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionCardContainer: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 24,
        overflow: 'hidden',
    },
    actionCard: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        gap: 4,
    },
    actionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        lineHeight: 22,
    },
    actionSubtitle: {
        color: '#9ca3af',
        fontSize: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewAll: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: '500',
    },
    tagsRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 30,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    tagText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    insightCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    insightLabel: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    insightTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    insightText: {
        color: '#d1d5db',
        fontSize: 14,
        lineHeight: 20,
    }
});
