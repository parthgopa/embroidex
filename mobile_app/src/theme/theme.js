export const LIGHT_COLORS = {
  // Brand Primary & Gradients
  primary: '#4f46e5',        // Modern Royal Indigo
  primaryLight: '#6366f1',
  primaryDark: '#3730a3',
  primaryMuted: '#e0e7ff',
  
  accentViolet: '#7c3aed',
  accentPink: '#ec4899',
  accentCyan: '#06b6d4',

  // Gradient definitions (for linear gradients and accents)
  gradientBrand: ['#4f46e5', '#7c3aed', '#ec4899'],
  gradientHeader: ['#0f172a', '#1e1b4b', '#312e81'],
  gradientHero: ['#312e81', '#4f46e5', '#7c3aed'],
  gradientCard: ['#ffffff', '#f8fafc'],

  // Monochromes & Text
  midnight: '#0f172a',       // Deepest Slate
  darkSlate: '#1e293b',
  textSecondary: '#475569',
  slate: '#64748b',
  lightSlate: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  surface: '#ffffff',
  background: '#f8fafc',

  // Status
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  info: '#0284c7',
  infoLight: '#e0f2fe',
};

export const DARK_COLORS = {
  // Brand Primary & Gradients in Dark Mode
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4338ca',
  primaryMuted: '#1e1b4b',
  
  accentViolet: '#a855f7',
  accentPink: '#f472b6',
  accentCyan: '#22d3ee',

  gradientBrand: ['#6366f1', '#a855f7', '#f472b6'],
  gradientHeader: ['#020617', '#0f172a', '#1e1b4b'],
  gradientHero: ['#1e1b4b', '#4338ca', '#6366f1'],
  gradientCard: ['#1e293b', '#0f172a'],

  // Monochromes & Text in Dark Mode
  midnight: '#f8fafc',
  darkSlate: '#f1f5f9',
  textSecondary: '#cbd5e1',
  slate: '#94a3b8',
  lightSlate: '#64748b',
  border: '#334155',
  borderLight: '#1e293b',
  surface: '#0f172a',
  background: '#020617',

  // Status
  success: '#22c55e',
  successLight: '#052e16',
  warning: '#fbbf24',
  warningLight: '#451a03',
  danger: '#f87171',
  dangerLight: '#450a0a',
  info: '#38bdf8',
  infoLight: '#082f49',
};

// Current active color scheme (default: Light)
export const COLORS = LIGHT_COLORS;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  heavy: 'System',
};

export const SHADOWS = {
  subtle: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  glow: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  floating: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};
