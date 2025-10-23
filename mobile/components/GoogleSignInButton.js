import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const GoogleSignInButton = ({ onPress, disabled = false, text = "Continue with Google" }) => {
  return (
    <TouchableOpacity
      style={[styles.googleBtn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <View style={styles.googleBtnContent}>
        <View style={styles.googleIcon}>
          <Text style={styles.googleIconText}>G</Text>
        </View>
        <Text style={styles.googleBtnText}>{text}</Text>
      </View>
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
});

export default GoogleSignInButton;