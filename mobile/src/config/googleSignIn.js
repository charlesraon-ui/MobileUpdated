// src/config/googleSignIn.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const configureGoogleSignIn = () => {
  // Only configure Google Sign-In on native platforms
  if (Platform.OS === 'web') {
    console.log('Google Sign-In not supported on web platform');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  } catch (error) {
    console.warn('Google Sign-In configuration failed:', error);
  }
};

export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    throw new Error('Google Sign-In is not available on web platform. Please use email registration instead.');
  }

  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    // Get tokens
    const tokens = await GoogleSignin.getTokens();
    
    if (!tokens.accessToken) {
      throw new Error('Failed to get Google access token');
    }
    
    return {
      user: userInfo.user,
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    
    // Provide more specific error messages
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Google Sign-In was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Google Sign-In is already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    } else {
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }
};

export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
  }
};