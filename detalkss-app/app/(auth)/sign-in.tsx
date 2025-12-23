import { View, Button, Alert } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";

export default function SignInScreen() {
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    async function handleGoogle() {
        console.log("👆 [SignIn] Starting Google OAuth...");
        try {
            const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow({
                redirectUrl: "detalkssapp://oauth-native-callback",
            });

            if (createdSessionId && setActive) {
                console.log("✅ [SignIn] Session created! Setting active...");
                await setActive({ session: createdSessionId });
            } else {
                const signInStatus = signIn?.status as string;
                const signUpStatus = signUp?.status as string;
                console.warn("⚠️ [SignIn] No session created. Status:", { signInStatus, signUpStatus });
                Alert.alert("Login Incomplete", `Status: ${signInStatus || signUpStatus || 'Account not found'}`);
            }
        } catch (err: any) {
            console.error("❌ [SignIn] Google Sign-in Error:", err);
            Alert.alert("Error", err.message || "Failed to sign in.");
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
            <Button title="Continue with Google" onPress={handleGoogle} />
        </View>
    );
}
