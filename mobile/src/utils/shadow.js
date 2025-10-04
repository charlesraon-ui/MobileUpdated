import { Platform } from 'react-native';

const hexToRgba = (hex, opacity = 1) => {
  if (!hex) return `rgba(0,0,0,${opacity})`;
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const platformShadow = ({
  color = '#000',
  offsetX = 0,
  offsetY = 2,
  radius = 8,
  opacity = 0.1,
  spread = 0,
  elevation = Math.max(1, Math.round(radius / 2)),
} = {}) => Platform.select({
  web: { boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${spread}px ${hexToRgba(color, opacity)}` },
  ios: { shadowColor: color, shadowOffset: { width: offsetX, height: offsetY }, shadowOpacity: opacity, shadowRadius: radius },
  android: { elevation, shadowColor: color },
  default: {},
});

export default platformShadow;