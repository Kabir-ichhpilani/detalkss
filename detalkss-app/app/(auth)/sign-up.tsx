import { View, Button } from "react-native";
import { useSSO } from "@clerk/clerk-expo";
import { router } from "expo-router";

export default function SignUpScreen() {
    const { startSSOFlow } = useSSO();

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
            <Button
                title="Sign Up with Google"
                onPress={async () => {
                    try {
                        const { createdSessionId } = await startSSOFlow({
                            strategy: "oauth_google",
                        });
                        if (createdSessionId) router.replace("/home");
                    } catch (err) {
                        console.log("Sign up error:", err);
                    }
                }}
            />
        </View>
    );
}
