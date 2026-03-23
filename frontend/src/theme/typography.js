import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
});

const typography = {
  // Display — app name, large headers
  display: {
    fontFamily,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // Title — screen titles
  title: {
    fontFamily,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  // Heading — section headings, card titles
  heading: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  // Subheading
  subheading: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  // Body — main content
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
  },
  // Caption — small labels
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
  },
  // Label — form labels
  label: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Button text
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
};

export default typography;
