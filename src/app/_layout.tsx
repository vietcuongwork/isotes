import { useDatabaseMigrations, useStudio } from "@/db/client";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { StyleSheet, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { fonts } from "@/assets/fonts";
import { colors } from "@/themes/color";
import "../../global.css";

// Set native root view background color before anything mounts. Light, because
// iOS rounds the lower screen's corners during a swipe back and this shows there
SystemUI.setBackgroundColorAsync(colors.ink[50]);

// react-native-screens backs each native-stack screen with a container
// whose background comes from the navigation theme's `colors.background`
// (not from `contentStyle`). Without this, that container defaults to
// white and flashes at the screen corners during the swipe-back gesture.
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.ink[50],
    card: "#0a0a0a",
  },
};

export default function RootLayout() {
  const [fontLoaded] = useFonts(fonts);
  const { success: migrationReady, error: migrationError } =
    useDatabaseMigrations();
  useStudio();

  // [lifecycle] lines are permanent: .sim/cu.sh waits for "ready", and a
  // failed migration otherwise renders null with no log
  useEffect(() => {
    if (migrationError)
      console.error("[lifecycle] migration failed", migrationError);
  }, [migrationError]);
  useEffect(() => {
    if (__DEV__ && fontLoaded && migrationReady)
      console.log("[lifecycle] ready");
  }, [fontLoaded, migrationReady]);

  if (!fontLoaded || !migrationReady) {
    return null;
  }
  return (
    <View style={styles.root}>
      <KeyboardProvider>
        <ThemeProvider value={AppTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.ink[50] },
            }}
          />
        </ThemeProvider>
      </KeyboardProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

// if (__DEV__) {
//   enableLogging(["layout"]); // exclude layout spam, keep effect/callback logs
// }
