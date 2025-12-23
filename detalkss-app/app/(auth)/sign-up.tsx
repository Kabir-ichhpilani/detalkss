import { View, Text, Image, Pressable, Alert } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const handleGoogle = async () => {
        console.log("👆 [SignUp] User clicked Continue with Google");
        try {
            console.log("⏳ [SignUp] Starting OAuth Flow...");
            const { createdSessionId, setActive, signUp, signIn } = await startOAuthFlow({
                redirectUrl: "detalkssapp://oauth-native-callback",
            });

            console.log("🔗 [SignUp] OAuth Response received:", {
                hasSession: !!createdSessionId,
                hasSetActive: !!setActive,
                signUpStatus: signUp?.status,
                signInStatus: signIn?.status
            });

            if (createdSessionId && setActive) {
                console.log("✅ [SignUp] Session created! Setting active session...");
                await setActive({ session: createdSessionId });
                console.log("✨ [SignUp] setActive successful");
            } else {
                // If it's an existing user, we might need to handle signIn status
                const signInStatus = signIn?.status as string;
                const signUpStatus = signUp?.status as string;

                if (signInStatus === "needs_second_factor") {
                    Alert.alert("2FA Required", "This account requires Two-Factor Authentication. Please sign in via a web browser first.");
                } else if (signUpStatus === "missing_requirements") {
                    Alert.alert("Incomplete Profile", "Some information is missing (likely a username). Please sign in via web to complete your profile.");
                } else {
                    console.warn("⚠️ [SignUp] No session. Status:", { signUpStatus, signInStatus });
                    Alert.alert("Login Incomplete", `Status: ${signInStatus || signUpStatus || 'Unknown'}`);
                }
            }
        } catch (err: any) {
            console.error("❌ [SignUp] Google Sign-In Error:", err);
            Alert.alert("Connection Error", err.message || "Failed to connect to Google.");
        }
    };

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#0D0D12",
                paddingHorizontal: 20,
                paddingTop: 50,
            }}
        >

            {/* ---------- TOP NAVBAR ---------- */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 30,
                }}
            >
                <View
                    style={{
                        height: 40,
                        width: 40,
                        borderRadius: 20,
                        backgroundColor: "#5A3EF5",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Ionicons name="sparkles" size={22} color="white" />
                </View>

                <Ionicons name="help-circle-outline" size={28} color="#9A9AAB" />
            </View>

            {/* ---------- HERO CARD ---------- */}
            <View
                style={{
                    height: 330,
                    backgroundColor: "#15151F",
                    borderRadius: 28,
                    overflow: "hidden",
                    marginBottom: 25,
                }}
            >
                <Image
                    source={{
                        uri:
                            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=60",
                    }}
                    style={{ width: "100%", height: "100%" }}
                />

                {/* LIVE Badge */}
                <View
                    style={{
                        position: "absolute",
                        top: 15,
                        right: 15,
                        backgroundColor: "#23CE6B",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                        LIVE
                    </Text>
                </View>

                {/* Bottom Overlay */}
                <View
                    style={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        padding: 15,
                        backgroundColor: "rgba(0,0,0,0.4)",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                        Online Now
                    </Text>
                    <Text style={{ color: "#D3D3D9", fontSize: 12 }}>
                        Join the convo
                    </Text>
                </View>
            </View>

            {/* ---------- TEXT BLOCK ---------- */}
            <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
                Real Talk.
            </Text>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
                Real Vibe.
            </Text>
            <Text
                style={{
                    color: "#5A3EF5",
                    fontSize: 28,
                    fontWeight: "800",
                    marginBottom: 20,
                }}
            >
                Real Solutions.
            </Text>

            {/* ---------- PRIMARY BUTTON ---------- */}
            <Pressable
                onPress={handleGoogle}
                style={{
                    backgroundColor: "#5A3EF5",
                    paddingVertical: 16,
                    borderRadius: 30,
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                    Sign Up with Google →
                </Text>
            </Pressable>

            {/* ---------- SECONDARY BUTTON ---------- */}
            <Pressable
                onPress={() => router.push("/sign-in")}
                style={{
                    borderColor: "#3A3A4F",
                    borderWidth: 1,
                    paddingVertical: 16,
                    borderRadius: 30,
                    alignItems: "center",
                    marginBottom: 25,
                }}
            >
                <Text style={{ color: "#B5B5C4", fontSize: 15, fontWeight: "600" }}>
                    I have an account
                </Text>
            </Pressable>

            {/* ---------- FOOTER ---------- */}
            <View
                style={{
                    flexDirection: "row",
                    gap: 6,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Ionicons name="shield-checkmark-outline" size={16} color="#B5B5C4" />
                <Text style={{ color: "#B5B5C4", fontSize: 12 }}>
                    100% Anonymous & Safe
                </Text>
            </View>
        </View>
    );
}
