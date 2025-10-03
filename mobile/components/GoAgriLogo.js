import React from 'react';
import { Image } from 'react-native';

const GoAgriLogo = ({ width = 120, height = 120, style }) => {
  return (
    <Image
      source={require('../assets/go-agri-logo.png')}
      style={[{ width, height }, style]}
      resizeMode="contain"
    />
  );
};

export default GoAgriLogo;