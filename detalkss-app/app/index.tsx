import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0c29" }}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
}
