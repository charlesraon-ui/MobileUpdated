import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Avatar = ({ 
  avatarUrl, 
  name, 
  email, 
  size = 40, 
  textSize = 16, 
  backgroundColor = "#ECFDF5", 
  textColor = "#10B981" 
}) => {
  const initials = (name || email || "?").charAt(0).toUpperCase();
  
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle = {
    color: textColor,
    fontWeight: '800',
    fontSize: textSize,
  };

  if (avatarUrl) {
    return (
      <View style={avatarStyle}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          defaultSource={require('../../assets/images/icon.png')}
        />
      </View>
    );
  }

  return (
    <View style={avatarStyle}>
      <Text style={textStyle}>{initials}</Text>
    </View>
  );
};

export default Avatar;