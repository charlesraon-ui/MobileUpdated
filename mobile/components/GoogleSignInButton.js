import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';

const GoogleSignInButton = ({ onPress, disabled = false, text = "Continue with Google" }) => {
  const isWeb = Platform.OS === 'web';
  const isDisabled = disabled || isWeb;
  const displayText = isWeb ? "Google Sign-In (Mobile Only)" : text;

  return (
    <TouchableOpacity
      style={[styles.googleBtn, isDisabled && styles.btnDisabled]}
      onPress={isWeb ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={isWeb ? 1 : 0.9}
    >
      <View style={styles.googleBtnContent}>
        <View style={[styles.googleIcon, isWeb && styles.iconDisabled]}>
          <Text style={[styles.googleIconText, isWeb && styles.textDisabled]}>G</Text>
        </View>
        <Text style={[styles.googleBtnText, isWeb && styles.textDisabled]}>{displayText}</Text>
      </View>
      {isWeb && (
        <Text style={styles.webNotice}>Use email registration on web</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIconText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  googleBtnText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  iconDisabled: {
    backgroundColor: "#9CA3AF",
  },
  textDisabled: {
    color: "#9CA3AF",
  },
  webNotice: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
});

export default GoogleSignInButton;