/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Brand accent used widely across mobile screens
const accentLight = '#10B981'; // emerald
const accentDark = '#34D399';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Extended palette for cohesive styling
    accent: accentLight,
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    muted: '#6B7280',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    accent: accentDark,
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    muted: '#9BA1A6',
    surface: '#111315',
    card: '#1A1D1F',
    border: '#2A2E32',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Design tokens for consistent spacing and rounding across screens
export const Radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Shadows = {
  // Baseline shadow values; actual platform-specific mapping handled by utils/shadow
  soft: { opacity: 0.06, radius: 8, y: 4 },
  medium: { opacity: 0.1, radius: 12, y: 6 },
  strong: { opacity: 0.12, radius: 16, y: 8 },
};

// Responsive breakpoints for different device sizes
export const Breakpoints = {
  xs: 320,    // Small phones
  sm: 375,    // Standard phones
  md: 414,    // Large phones
  lg: 768,    // Tablets
  xl: 1024,   // Large tablets
  xxl: 1200,  // Desktop/large screens
};

// Responsive utilities
export const ResponsiveUtils = {
  // Get responsive value based on screen width
  getResponsiveValue: (width: number, values: { xs?: any, sm?: any, md?: any, lg?: any, xl?: any, xxl?: any }) => {
    if (width >= Breakpoints.xxl && values.xxl !== undefined) return values.xxl;
    if (width >= Breakpoints.xl && values.xl !== undefined) return values.xl;
    if (width >= Breakpoints.lg && values.lg !== undefined) return values.lg;
    if (width >= Breakpoints.md && values.md !== undefined) return values.md;
    if (width >= Breakpoints.sm && values.sm !== undefined) return values.sm;
    return values.xs;
  },
  
  // Get number of columns for grid layouts
  getGridColumns: (width: number) => {
    if (width >= Breakpoints.xxl) return 6;
    if (width >= Breakpoints.xl) return 4;
    if (width >= Breakpoints.lg) return 3;
    if (width >= Breakpoints.md) return 2;
    return 2;
  },
  
  // Get category chip columns
  getCategoryColumns: (width: number) => {
    if (width >= Breakpoints.xl) return 6;
    if (width >= Breakpoints.lg) return 5;
    if (width >= Breakpoints.md) return 4;
    return 4;
  },
  
  // Get responsive padding
  getResponsivePadding: (width: number) => {
    if (width >= Breakpoints.xl) return 32;
    if (width >= Breakpoints.lg) return 24;
    if (width >= Breakpoints.md) return 20;
    return 16;
  },
  
  // Get responsive font size
  getResponsiveFontSize: (width: number, baseSize: number) => {
    const scale = width >= Breakpoints.lg ? 1.1 : width >= Breakpoints.md ? 1.05 : 1;
    return Math.round(baseSize * scale);
  },
  
  // Check if device is tablet or larger
  isTablet: (width: number) => width >= Breakpoints.lg,
  
  // Check if device is large screen
  isLargeScreen: (width: number) => width >= Breakpoints.xl,
};
