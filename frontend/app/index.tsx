import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Text,
  Pressable,
  Platform,
  StatusBar,
  Linking,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Network from "expo-network";

const PWA_URL = "https://jambh-ell.vercel.app";
const BRAND_BG = "#0c0c0c";
const BRAND_ACCENT = "#34E5B2";

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [errorState, setErrorState] = useState<null | string>(null);
  const [progress, setProgress] = useState(0);

  // ---- Safety net: force-hide the initial loading overlay after N seconds ----
  // Some environments (e.g. web preview where react-native-webview is a no-op,
  // or slow networks) never fire onLoadEnd/onLoadProgress. Without this, the
  // splash overlay would stay forever. We forcibly consider the page "loaded"
  // after 8 seconds so the WebView (or web iframe fallback) is visible.
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setProgress(1);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // ---- Network check ----
  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(online);
      return online;
    } catch {
      setIsConnected(true);
      return true;
    }
  }, []);

  useEffect(() => {
    checkNetwork();
    const id = setInterval(checkNetwork, 5000);
    return () => clearInterval(id);
  }, [checkNetwork]);

  // ---- Android hardware back ----
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  // ---- Pull-to-refresh reload ----
  const onRetry = useCallback(async () => {
    setErrorState(null);
    const online = await checkNetwork();
    if (online) {
      webViewRef.current?.reload();
    }
  }, [checkNetwork]);

  // ---- External link handling ----
  const shouldStartLoad = useCallback((req: { url: string }) => {
    const url = req.url;
    // Allow the PWA host, blank pages, data URIs, and about:blank
    if (
      url.startsWith(PWA_URL) ||
      url.startsWith("about:") ||
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      url.startsWith("http://localhost") ||
      url.startsWith("https://jambh-ell.vercel.app")
    ) {
      return true;
    }
    // Special schemes -> device
    if (
      url.startsWith("tel:") ||
      url.startsWith("mailto:") ||
      url.startsWith("sms:") ||
      url.startsWith("whatsapp:") ||
      url.startsWith("intent:") ||
      url.startsWith("upi:") ||
      url.startsWith("geo:")
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    // Any other external http(s) URL -> open in system browser
    if (url.startsWith("http://") || url.startsWith("https://")) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  // Offline UI
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.errorContainer} testID="offline-screen">
        <StatusBar barStyle="light-content" backgroundColor={BRAND_BG} />
        <View style={styles.errorInner}>
          <View style={styles.errorIconWrap}>
            <Text style={styles.errorIcon}>⚡</Text>
          </View>
          <Text style={styles.errorTitle} testID="offline-title">You&apos;re offline</Text>
          <Text style={styles.errorSubtitle}>
            Please check your internet connection and try again.
          </Text>
          <Pressable
            testID="offline-retry-button"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Error UI (load failure)
  if (errorState) {
    return (
      <SafeAreaView style={styles.errorContainer} testID="error-screen">
        <StatusBar barStyle="light-content" backgroundColor={BRAND_BG} />
        <View style={styles.errorInner}>
          <View style={styles.errorIconWrap}>
            <Text style={styles.errorIcon}>!</Text>
          </View>
          <Text style={styles.errorTitle} testID="error-title">Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{errorState}</Text>
          <Pressable
            testID="error-retry-button"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root} testID="webview-root">
      <StatusBar barStyle="light-content" backgroundColor={BRAND_BG} />
      <View style={{ height: insets.top, backgroundColor: BRAND_BG }} />

      {Platform.OS === "web" ? (
        // react-native-webview is native-only, AND the PWA sends
        // `X-Frame-Options: DENY`, so an iframe would render blank.
        // Show a friendly message with a button to open the PWA in a new tab.
        // This branch is ONLY hit in the web preview; real Android/iOS use
        // the native WebView below.
        <View style={styles.webInfo} testID="web-preview-info">
          <Image
            source={require("../assets/images/splash-image.png")}
            style={styles.webInfoLogo}
            resizeMode="contain"
          />
          <Text style={styles.webInfoTitle}>Preview Mode</Text>
          <Text style={styles.webInfoSubtitle}>
            The Jambh Electricals app runs as a native WebView on Android & iOS.
            The web preview cannot embed the site (blocked by security headers).
            {"\n\n"}
            Scan the Expo Go QR code on your phone to test the real app, or open
            the web version below.
          </Text>
          <Pressable
            testID="open-pwa-in-browser"
            onPress={() => {
              Linking.openURL(PWA_URL).catch(() => {});
            }}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Open PWA in Browser</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          testID="pwa-webview"
          source={{ uri: PWA_URL }}
          style={styles.webview}
          containerStyle={styles.webviewContainer}
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
          userAgent={
            Platform.OS === "ios"
              ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 JambhElectricalsApp/1.0"
              : "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 JambhElectricalsApp/1.0"
          }
          onShouldStartLoadWithRequest={shouldStartLoad}
          onLoadStart={() => {
            setLoading(true);
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onLoadEnd={() => {
            setLoading(false);
          }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setErrorState(
              nativeEvent.description || "Unable to load the app. Please try again."
            );
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.statusCode >= 500) {
              setErrorState(
                `Server returned ${nativeEvent.statusCode}. Please try again.`
              );
            }
          }}
          renderLoading={() => <View />}
        />
      )}

      {/* Top progress bar */}
      {loading && progress < 1 ? (
        <View
          style={[
            styles.progressBar,
            { top: insets.top, width: `${Math.max(5, progress * 100)}%`, pointerEvents: "none" },
          ]}
        />
      ) : null}

      {/* Initial full-screen splash-style loader (only for first load) */}
      {loading && progress < 0.1 ? (
        <View style={[styles.initialOverlay, { pointerEvents: "none" }]}>
          <Image
            source={require("../assets/images/splash-image.png")}
            style={styles.initialLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="small" color={BRAND_ACCENT} style={{ marginTop: 24 }} />
          <Text style={styles.initialText}>Loading Jambh Electricals…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  scroll: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  scrollContent: {
    flexGrow: 1,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webInfo: {
    flex: 1,
    backgroundColor: BRAND_BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  webInfoLogo: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  webInfoTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  webInfoSubtitle: {
    fontSize: 14,
    color: "#9aa0a6",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 380,
  },
  progressBar: {
    position: "absolute",
    left: 0,
    height: 2,
    backgroundColor: BRAND_ACCENT,
  },
  initialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  initialLogo: {
    width: 180,
    height: 180,
  },
  initialText: {
    marginTop: 12,
    color: "#9aa0a6",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  errorInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 40,
    color: BRAND_ACCENT,
    fontWeight: "700",
  },
  errorTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#9aa0a6",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BRAND_ACCENT,
    minWidth: 160,
    alignItems: "center",
  },
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: "#0c0c0c",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
