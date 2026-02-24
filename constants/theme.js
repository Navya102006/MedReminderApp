// Design Tokens for MedReminderApp
export const colors = {
    primary: '#2563EB',       // Blue
    primaryDark: '#1D4ED8',
    primaryLight: '#EFF6FF',
    success: '#16A34A',
    successLight: '#F0FDF4',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    border: '#E2E8F0',
    borderFocus: '#2563EB',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    white: '#FFFFFF',
};

export const typography = {
    h1: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    h4: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
    body: { fontSize: 15, fontWeight: '400', color: colors.textSecondary, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
};

export const spacing = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
    sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const shadow = {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
};
