import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../src/firebase/firebaseConfig";
import { requireBiometric } from "../src/security/biometric";
import { hasSession } from "../src/security/session";
import { ThemeProvider } from "../src/theme/ThemeContext";
import { useTheme } from "../src/theme/useTheme";
import Splash from "./splash";

function RootNavigator() {
  const theme = useTheme();

  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let unsub: any;

    const run = async () => {
      // ✅ SHOW SPLASH FOR 1.5s
      setTimeout(() => {
        setShowSplash(false);
      }, 3500);

      const session = await hasSession();
      if (!session) {
        setReady(true);
        return;
      }

      const bioOk = await requireBiometric();
      if (!bioOk) {
        setReady(true);
        return;
      }

      // 🔐 WAIT FOR FIREBASE AUTH
      unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUnlocked(true);
        }
        setReady(true);
      });
    };

    run();
    return () => unsub && unsub();
  }, []);

  // 🟢 1️⃣ SPLASH ALWAYS FIRST
  if (showSplash) {
    return <Splash />;
  }

  // 🟡 2️⃣ WAIT FOR AUTH / BIOMETRIC
  if (!ready) return null;

  // 🔵 3️⃣ MAIN APP
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        style={theme.mode === "dark" ? "light" : "dark"}
        backgroundColor={theme.background}
      />

      <Stack screenOptions={{ headerShown: false }}>
        {unlocked ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="index" />
        )}
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
