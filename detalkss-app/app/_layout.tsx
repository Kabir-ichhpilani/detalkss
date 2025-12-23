import { Slot, useRouter, useSegments } from "expo-router";
import { socket } from "@/utils/socket";
import { Audio } from "expo-av";
import { useEffect } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator, Text, TouchableOpacity, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

// For Android OAuth to work correctly
WebBrowser.maybeCompleteAuthSession();

const tokenCache = {
  getToken: async (key: string) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      console.log(`🔐 [TokenCache] GET for ${key}:`, value ? "Value Found" : "Empty");
      return value;
    } catch (error) {
      console.error(`❌ [TokenCache] GET Error for ${key}:`, error);
      return null;
    }
  },
  saveToken: async (key: string, value: string) => {
    try {
      console.log(`🔐 [TokenCache] SAVE for ${key}`);
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`❌ [TokenCache] SAVE Error for ${key}:`, error);
    }
  },
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
    // 1. Initial Load Check
    if (!isLoaded) {
      console.log("🔐 [Auth] State: Loading...");
      return;
    }

    const currentSegments = [...segments];
    const segmentPath = currentSegments.join('/');
    const inAuthGroup = currentSegments[0] === '(auth)';
    const isCallback = currentSegments[0] === 'oauth-native-callback';
    const isAtRoot = (currentSegments as string[]).length === 0;

    console.log("🔐 [Auth] State Check:", {
      isSignedIn,
      path: `/${segmentPath}`,
      inAuthGroup,
      isCallback,
      isAtRoot
    });

    // 2. Auth Business Logic
    if (isSignedIn) {
      if (inAuthGroup || isAtRoot || isCallback) {
        console.log(`🚀 [Auth] Redirecting SIGNED_IN user from /${segmentPath} -> /home`);
        router.replace('/home');
      } else {
        console.log(`✅ [Auth] SIGNED_IN user allowed at /${segmentPath}`);
      }
    } else {
      if (!inAuthGroup && !isCallback) {
        console.log(`🚪 [Auth] Redirecting UNSIGNED user from /${segmentPath} -> /sign-up`);
        router.replace('/(auth)/sign-up');
      } else {
        console.log(`🟡 [Auth] UNSIGNED user allowed at /${segmentPath}`);
      }
    }
  }, [isSignedIn, isLoaded, segments.join('|')]);

  if (!isLoaded) {
    console.log("⏳ [Root] Clerk not loaded yet...");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#0f0c29' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <TouchableOpacity
          onPress={async () => {
            console.log("🧹 [Auth] Manual Reset triggered...");
            try {
              // Attempt to clear session via SecureStore directly if Clerk is stuck
              await SecureStore.deleteItemAsync("__clerk_client_token");
              // If we can get a ref to something to force a reload, that would be even better
              Alert.alert("Reset", "Session cleared. Please restart the app.");
            } catch (e) {
              console.error("❌ [Auth] Reset failed", e);
            }
          }}
          style={{ position: 'absolute', bottom: 50, padding: 20 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' }}>Clear Native Session</Text>
        </TouchableOpacity>
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
