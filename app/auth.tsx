import { COLORS } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const renderIcon = (Icon: any, size: number, color: string) => {
  const IconComp = Icon as any;
  return <IconComp size={size} color={color} />;
};

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = COLORS[colorScheme];

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signUpStep, setSignUpStep] = useState<"email" | "otp" | "password">(
    "email",
  );
  const [otp, setOtp] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<
    "email" | "otp" | "password"
  >("email");

  React.useEffect(() => {
    // Handle PASSWORD_RECOVERY deep links
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsForgotPassword(true);
        setForgotPasswordStep("password");
      }
    });

    return () => subscription.unsubscribe();
  }, []); // ✅ Only run once at mount

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Oops!", "Pakilagay naman yung email at password perds.");
      return;
    }
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign in timeout")), 7000),
      );

      const signInPromise = supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      const { error } = (await Promise.race([
        signInPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Sign in failed. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    if (!email || !fullName) {
      Alert.alert("Oops!", "Pakikumpleto naman yung details perds.");
      return;
    }
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OTP send timeout")), 7000),
      );

      const otpPromise = supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      const { error } = (await Promise.race([
        otpPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setSignUpStep("otp");
        Alert.alert(
          "Success!",
          "Check mo yung email mo for the verification code.",
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "OTP send failed. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpCode() {
    if (!otp) {
      Alert.alert("Oops!", "Pakilagay yung OTP perds.");
      return;
    }
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OTP verify timeout")), 7000),
      );

      const verifyPromise = supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      const { error } = (await Promise.race([
        verifyPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setSignUpStep("password");
        Alert.alert("Verified!", "Setup mo na password mo perds.");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Verification failed. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      Alert.alert("Oops!", "Pakilagay muna yung email address mo perds.");
      return;
    }
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Password reset timeout")), 7000),
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(email);

      const { error } = (await Promise.race([
        resetPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setForgotPasswordStep("otp");
        Alert.alert(
          "Success!",
          "Check mo yung email mo para sa recovery code perds.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Nagkaproblema perds. Try again later.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyRecoveryOtp() {
    if (!otp) {
      Alert.alert("Oops!", "Pakilagay yung code perds.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setForgotPasswordStep("password");
    }
    setLoading(false);
  }

  async function completeSignUpWithPassword() {
    if (!password) {
      Alert.alert("Oops!", "Pakilagay naman yung password perds.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace("/(tabs)");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {isForgotPassword
                ? forgotPasswordStep === "email"
                  ? "Forgot Password?"
                  : forgotPasswordStep === "otp"
                    ? "Verify Code"
                    : "Set New Password"
                : isSignUp
                  ? "Sali Ka Na!"
                  : "Welcome Back Perds!"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {isForgotPassword
                ? forgotPasswordStep === "email"
                  ? "Lagay mo email mo para padalhan ka namin ng recovery code."
                  : forgotPasswordStep === "otp"
                    ? "I-type mo yung 6-digit code na pinadala namin sa email mo."
                    : "Gawa ka ng bagong password na hindi mo na makakalimutan."
                : isSignUp
                  ? "Gawa ka ng account para ma-track ang expenses mo."
                  : "Mag-Login para ma-access ang iyong financial insights."}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && signUpStep === "email" && (
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                {renderIcon(User, 20, theme.muted)}
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, outline: "none" } as any,
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.muted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email Input */}
            {((!isSignUp && !isForgotPassword) ||
              (isSignUp && signUpStep === "email") ||
              (isForgotPassword && forgotPasswordStep === "email")) && (
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                {renderIcon(Mail, 20, theme.muted)}
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, outline: "none" } as any,
                  ]}
                  placeholder="Email Address"
                  placeholderTextColor={theme.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            )}

            {/* OTP Input */}
            {((isSignUp && signUpStep === "otp") ||
              (isForgotPassword && forgotPasswordStep === "otp")) && (
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                {renderIcon(Lock, 20, theme.muted)}
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, outline: "none" } as any,
                  ]}
                  placeholder="Enter OTP Code"
                  placeholderTextColor={theme.muted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            )}

            {/* Password Input */}
            {((!isSignUp && !isForgotPassword) ||
              (isSignUp && signUpStep === "password") ||
              (isForgotPassword && forgotPasswordStep === "password")) && (
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                {renderIcon(Lock, 20, theme.muted)}
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, outline: "none" } as any,
                  ]}
                  placeholder={
                    isForgotPassword
                      ? "New Password"
                      : isSignUp
                        ? "Set Password"
                        : "Password"
                  }
                  placeholderTextColor={theme.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  {renderIcon(showPassword ? EyeOff : Eye, 20, theme.muted)}
                </TouchableOpacity>
              </View>
            )}

            {!isSignUp && !isForgotPassword && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  setIsForgotPassword(true);
                  setForgotPasswordStep("email");
                }}
                hitSlop={{ top: 15, bottom: 15, left: 30, right: 30 }}
                activeOpacity={0.6}
              >
                <Text
                  style={{
                    color: theme.green,
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.green }]}
              onPress={() => {
                if (isForgotPassword) {
                  if (forgotPasswordStep === "email") handleForgotPassword();
                  else if (forgotPasswordStep === "otp") verifyRecoveryOtp();
                  else if (forgotPasswordStep === "password")
                    completeSignUpWithPassword();
                } else {
                  if (!isSignUp) signInWithEmail();
                  else if (signUpStep === "email") sendOtp();
                  else if (signUpStep === "otp") verifyOtpCode();
                  else if (signUpStep === "password")
                    completeSignUpWithPassword();
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>
                  {isForgotPassword
                    ? forgotPasswordStep === "email"
                      ? "Send Reset Code"
                      : forgotPasswordStep === "otp"
                        ? "Verify Code"
                        : "Update Password"
                    : !isSignUp
                      ? "Login"
                      : signUpStep === "email"
                        ? "Send OTP"
                        : signUpStep === "otp"
                          ? "Verify OTP"
                          : "Complete Setup"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                  setForgotPasswordStep("email");
                } else {
                  setIsSignUp(!isSignUp);
                  setSignUpStep("email");
                }
              }}
            >
              <Text style={{ color: theme.muted }}>
                {isForgotPassword
                  ? "Balik sa "
                  : isSignUp
                    ? "May account na? "
                    : "Wala pang account? "}
                <Text style={{ color: theme.green, fontWeight: "700" }}>
                  {isForgotPassword
                    ? "Login perds"
                    : isSignUp
                      ? "Login dito"
                      : "Signup dito"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    outlineWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    outlineWidth: 0,
    borderWidth: 0,
  },
  mainButton: {
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 10,
  },
});
