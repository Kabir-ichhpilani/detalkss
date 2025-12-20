import { View, Button } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";

export default function SignInScreen() {
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    async function handleGoogle() {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl: "detalkssapp://oauth-native-callback",
            });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                // router.replace("/home"); // Let _layout.tsx handle navigation based on auth state
            }
        } catch (err) {
            console.log("Google Sign-in Error:", err);
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
            <Button title="Continue with Google" onPress={handleGoogle} />
        </View>
    );
}
