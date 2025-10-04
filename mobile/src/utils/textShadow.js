import { Platform } from 'react-native';

export const platformTextShadow = ({
  color = 'rgba(0,0,0,0.3)',
  offsetX = 0,
  offsetY = 2,
  blur = 4,
} = {}) => Platform.select({
  web: { textShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}` },
  ios: { textShadowColor: color, textShadowOffset: { width: offsetX, height: offsetY }, textShadowRadius: blur },
  android: { textShadowColor: color, textShadowOffset: { width: offsetX, height: offsetY }, textShadowRadius: blur },
  default: {},
});

export default platformTextShadow;