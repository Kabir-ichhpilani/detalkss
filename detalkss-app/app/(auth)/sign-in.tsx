import { View, Button } from "react-native";
import { useSSO } from "@clerk/clerk-expo";
import { router } from "expo-router";

export default function SignInScreen() {
    const { startSSOFlow } = useSSO();

    async function handleGoogle() {
        try {
            const { createdSessionId } = await startSSOFlow({
                strategy: "oauth_google",
            });

            if (createdSessionId) {
                router.replace("/home"); // redirect after login
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
