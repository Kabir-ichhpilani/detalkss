import { Stack } from "expo-router";
import { socket } from "@/utils/socket";
import { Audio } from "expo-av";
import { useEffect } from "react";

export default function RootLayout() {
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

  return <Stack />;
}
