import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { Slot } from "expo-router";

export const tokenCache = {
    getToken: (key) => SecureStore.getItemAsync(key),
    saveToken: (key, value) => SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
    return (
        <ClerkProvider
            publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
            tokenCache={tokenCache}
        >
            <Slot />
        </ClerkProvider>
    );
}
