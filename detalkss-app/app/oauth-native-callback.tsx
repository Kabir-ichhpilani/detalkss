import { View, ActivityIndicator } from 'react-native';

// This route serves as the callback for Clerk OAuth.
// Expo Router attempts to navigate here when the deep link 'detalkssapp://oauth-native-callback' is received.
// We just render a spinner while the original startOAuthFlow promise resolves in the background.
export default function OAuthCallback() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator color="#fff" />
        </View>
    );
}
