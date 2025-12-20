import { Slot, useRouter, useSegments } from "expo-router";
import { socket } from "@/utils/socket";
import { Audio } from "expo-av";
import { useEffect } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        console.log("🔊 [Audio] Android audio mode configured");
      } catch (error) {
        console.error("❌ [Audio] Failed to configure audio mode:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log("Auth State Changed:", { isSignedIn, segments, inAuthGroup });

    if (isSignedIn && (inAuthGroup || (segments as string[]).length === 0)) {
      // If user is signed in and trying to access auth pages OR is at the root directory
      console.log("Redirecting to /home");
      router.replace('/home');
    } else if (!isSignedIn && !inAuthGroup) {
      // If user is not signed in and not in the auth group
      console.log("Redirecting to /sign-up");
      router.replace('/(auth)/sign-up');
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#0f0c29' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing Clerk Publishable Key. Please check your .env file.");
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}
