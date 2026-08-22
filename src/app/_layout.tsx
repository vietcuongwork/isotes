import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { fonts } from "../../assets/fonts";
import "../../global.css";

// Set native root view background color before anything mounts
SystemUI.setBackgroundColorAsync("#0a0a0a");

// react-native-screens backs each native-stack screen with a container
// whose background comes from the navigation theme's `colors.background`
// (not from `contentStyle`). Without this, that container defaults to
// white and flashes at the screen corners during the swipe-back gesture.
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0a0a0a",
    card: "#0a0a0a",
  },
};

export default function RootLayout() {
  const [fontLoaded] = useFonts(fonts);
  if (!fontLoaded) {
    return null;
  }
  return (
    <GestureHandlerRootView style={styles.gestureHandleRootView}>
      <KeyboardProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={AppTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0a0a0a" },
              }}
            />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureHandleRootView: {
    flex: 1,
  },
});
