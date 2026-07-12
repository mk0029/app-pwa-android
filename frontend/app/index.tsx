import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Network from "expo-network";

const PWA_URL = "https://jambh-ell.vercel.app";
const BG = "#0c0c0c";
const ACCENT = "#34E5B2";
const MUTED = "#8a9099";

export default function Index() {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Safety-net: hide splash after 8s if WebView events never fire.
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setProgress(1);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // Network monitor.
  const checkNet = useCallback(async () => {
    try {
      const s = await Network.getNetworkStateAsync();
      const ok = !!(s.isConnected && s.isInternetReachable !== false);
      setIsOnline(ok);
      return ok;
    } catch {
      setIsOnline(true);
      return true;
    }
  }, []);

  useEffect(() => {
    checkNet();
    const id = setInterval(checkNet, 5000);
    return () => clearInterval(id);
  }, [checkNet]);

  // Android hardware back → WebView back.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const retry = useCallback(async () => {
    setErrorMsg(null);
    if (await checkNet()) webRef.current?.reload();
  }, [checkNet]);

  // Keep the WebView pinned to jambh-ell.vercel.app.
  // Everything else opens in the system browser / native handler.
  const shouldStartLoad = useCallback((req: { url: string }) => {
    const url = req.url;
    if (
      url.startsWith(PWA_URL) ||
      url.startsWith("about:") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return true;
    }
    if (/^(tel|mailto|sms|whatsapp|upi|geo|intent):/.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    if (/^https?:\/\//.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  // ---- Offline ----
  if (!isOnline) {
    return (
      <StatusScreen
        testID="offline-screen"
        icon="⚡"
        title="You're offline"
        subtitle="Check your internet connection and try again."
        buttonLabel="Retry"
        onPress={retry}
        buttonTestID="offline-retry-button"
      />
    );
  }

  // ---- Load error ----
  if (errorMsg) {
    return (
      <StatusScreen
        testID="error-screen"
        icon="!"
        title="Something went wrong"
        subtitle={errorMsg}
        buttonLabel="Try again"
        onPress={retry}
        buttonTestID="error-retry-button"
      />
    );
  }

  // ---- Main ----
  return (
    <View style={styles.root} testID="webview-root">
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={{ height: insets.top, backgroundColor: BG }} />

      {Platform.OS === "web" ? <WebPreviewCard /> : <NativeWebView
        webRef={webRef}
        setLoading={setLoading}
        setProgress={setProgress}
        setCanGoBack={setCanGoBack}
        setErrorMsg={setErrorMsg}
        shouldStartLoad={shouldStartLoad}
      />}

      {/* Top thin progress bar (mobile only, hidden after full load) */}
      {Platform.OS !== "web" && loading && progress < 1 ? (
        <View
          style={[
            styles.progressBar,
            {
              top: insets.top,
              width: `${Math.max(5, progress * 100)}%`,
            },
          ]}
        />
      ) : null}

      {/* Splash overlay while WebView boots (mobile only) */}
      {Platform.OS !== "web" && loading && progress < 0.1 ? (
        <View style={styles.splash} pointerEvents="none">
          <Image
            source={require("../assets/images/splash-image.png")}
            style={styles.splashLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="small" color={ACCENT} style={{ marginTop: 20 }} />
        </View>
      ) : null}
    </View>
  );
}

/* ---------- Sub-components ---------- */

function NativeWebView(props: {
  webRef: React.RefObject<WebView>;
  setLoading: (v: boolean) => void;
  setProgress: (v: number) => void;
  setCanGoBack: (v: boolean) => void;
  setErrorMsg: (v: string | null) => void;
  shouldStartLoad: (req: { url: string }) => boolean;
}) {
  return (
    <WebView
      ref={props.webRef}
      testID="pwa-webview"
      source={{ uri: PWA_URL }}
      style={styles.webview}
      startInLoadingState
      allowsBackForwardNavigationGestures
      domStorageEnabled
      javaScriptEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
      setSupportMultipleWindows={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      geolocationEnabled
      mixedContentMode="always"
      originWhitelist={["*"]}
      pullToRefreshEnabled
      bounces
      overScrollMode="always"
      onShouldStartLoadWithRequest={props.shouldStartLoad}
      onLoadStart={() => props.setLoading(true)}
      onLoadProgress={({ nativeEvent }) => props.setProgress(nativeEvent.progress)}
      onLoadEnd={() => props.setLoading(false)}
      onNavigationStateChange={(n) => props.setCanGoBack(n.canGoBack)}
      onError={(e) =>
        props.setErrorMsg(
          e.nativeEvent.description || "Unable to load the app."
        )
      }
      onHttpError={(e) => {
        if (e.nativeEvent.statusCode >= 500) {
          props.setErrorMsg(`Server error ${e.nativeEvent.statusCode}.`);
        }
      }}
      renderLoading={() => <View />}
    />
  );
}

function WebPreviewCard() {
  return (
    <View style={styles.previewWrap} testID="web-preview-info">
      <View style={styles.previewCard}>
        <Image
          source={require("../assets/images/splash-image.png")}
          style={styles.previewLogo}
          resizeMode="contain"
        />
        <Text style={styles.previewTitle}>Jambh Electricals</Text>
        <Text style={styles.previewTag}>NATIVE MOBILE APP</Text>

        <Text style={styles.previewBody}>
          Preview the app on your phone via Expo Go, or publish to get an APK.
        </Text>

        {/* Real HTML anchor — always opens a new tab, escapes any iframe. */}
        {React.createElement(
          "a",
          {
            href: PWA_URL,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-testid": "open-pwa-in-browser",
            style: previewButtonStyle,
          },
          "Open PWA ↗"
        )}
      </View>
    </View>
  );
}

function StatusScreen(props: {
  testID: string;
  icon: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  buttonTestID: string;
}) {
  return (
    <SafeAreaView style={styles.statusContainer} testID={props.testID}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={styles.statusInner}>
        <View style={styles.statusIconWrap}>
          <Text style={styles.statusIcon}>{props.icon}</Text>
        </View>
        <Text style={styles.statusTitle}>{props.title}</Text>
        <Text style={styles.statusSubtitle}>{props.subtitle}</Text>
        <Pressable
          testID={props.buttonTestID}
          onPress={props.onPress}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{props.buttonLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */

const previewButtonStyle = {
  display: "inline-block",
  marginTop: 16,
  paddingLeft: 24,
  paddingRight: 24,
  paddingTop: 12,
  paddingBottom: 12,
  borderRadius: 999,
  backgroundColor: ACCENT,
  color: "#0a0a0a",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 0.4,
  textDecoration: "none",
  textAlign: "center" as const,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  webview: { flex: 1, backgroundColor: "#ffffff" },

  // Splash overlay (mobile boot)
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogo: { width: 160, height: 160 },

  // Progress bar
  progressBar: {
    position: "absolute",
    left: 0,
    height: 2,
    backgroundColor: ACCENT,
  },

  // Web preview card
  previewWrap: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  previewCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#141416",
    borderWidth: 1,
    borderColor: "#26282c",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  previewLogo: { width: 72, height: 72, marginBottom: 16 },
  previewTitle: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  previewTag: {
    fontSize: 10,
    color: ACCENT,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 14,
  },
  previewBody: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 19,
  },

  // Status screens (offline / error)
  statusContainer: { flex: 1, backgroundColor: BG },
  statusInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  statusIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#141416",
    borderWidth: 1,
    borderColor: "#26282c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusIcon: { fontSize: 32, color: ACCENT, fontWeight: "700" },
  statusTitle: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  statusSubtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 320,
  },

  // Buttons (native)
  button: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: ACCENT,
    minWidth: 140,
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
