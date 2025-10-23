// src/config/googleSignIn.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  });
};

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    
    return {
      user: userInfo.user,
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
  }
};