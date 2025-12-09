import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { View, Text } from "react-native";
import {socket} from "@/utils/socket";


export default function HomeScreen() {
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();

    async function saveUserToBackend() {
        const token = await getToken();


        // @ts-ignore
        // @ts-ignore
        // @ts-ignore
        // @ts-ignore
        const res = await fetch("http://localhost:4040/api/user/save", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // @ts-ignore
                clerkId: user.id,
                // @ts-ignore
                email: user.primaryEmailAddress.emailAddress,
                // @ts-ignore
                username: user.username,
                gender: "male",
                problem: "none",
                condition: "healthy",
            }),
        });

        const data = await res.json();
        console.log("Saved user:", data);
    }

    useEffect(() => {
        if (!isLoaded || !user) {
            console.log("Waiting for user...");
            return;
        }

        console.log("User loaded:", user);
        saveUserToBackend();

    }, [isLoaded, user]);

    return (
        <View>
            <Text>Welcome</Text>
        </View>
    );
}
