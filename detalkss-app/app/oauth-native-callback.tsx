import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function OAuthCallback() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState("Completing login...");

    useEffect(() => {
        console.log("🔄 [Callback] Route hit. State:", { isLoaded, isSignedIn });
        if (isLoaded) {
            if (isSignedIn) {
                console.log("🚀 [Callback] User IS signed in. Redirecting to /home...");
                setStatus("Success! Redirecting...");
                router.replace('/home');
            } else {
                console.log("⏳ [Callback] User NOT signed in yet. Waiting...");
                setStatus("Waiting for Clerk session...");
            }
        }
    }, [isSignedIn, isLoaded]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0c29', padding: 20 }}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={{ color: '#fff', marginTop: 20, textAlign: 'center', fontSize: 16 }}>{status}</Text>

            <View style={{ marginTop: 40, width: '100%', gap: 12 }}>
                <TouchableOpacity
                    onPress={() => router.replace('/home')}
                    style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignItems: 'center' }}
                >
                    <Text style={{ color: '#fff' }}>Manual Skip to Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.replace('/(auth)/sign-up')}
                    style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center' }}
                >
                    <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Back to Sign Up</Text>
                </TouchableOpacity>
            </View>

            <View style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    Authentication Debug Info
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 4 }}>
                    Clerk Loaded: {isLoaded ? 'Yes' : 'No'} | Signed In: {isSignedIn ? 'Yes' : 'No'}
                </Text>
            </View>
        </View>
    );
}
