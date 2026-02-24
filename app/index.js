import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../constants/theme';

const FEATURES = [
    { icon: 'bell', label: 'Smart Reminders' },
    { icon: 'file-medical', label: 'Scan Prescriptions' },
    { icon: 'chart-line', label: 'Track Adherence' },
];

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <View style={styles.hero}>
                <View style={styles.logoWrap}>
                    <FontAwesome5 name="pills" size={38} color={colors.primary} />
                </View>
                <Text style={styles.appName}>MedReminder</Text>
                <Text style={styles.tagline}>Your personal medication companion</Text>
            </View>

            <View style={styles.features}>
                {FEATURES.map((f) => (
                    <View key={f.label} style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <FontAwesome5 name={f.icon} size={14} color={colors.primary} />
                        </View>
                        <Text style={styles.featureText}>{f.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push('/auth/login')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryBtnText}>Login</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.push('/auth/register')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.secondaryBtnText}>Create Account</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    logoWrap: {
        width: 88, height: 88, borderRadius: 28,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.lg,
        ...shadow.md,
    },
    appName: { fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    tagline: { fontSize: 15, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
    features: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface,
        marginHorizontal: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 14,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: {
        width: 32, height: 32, borderRadius: radius.sm,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    featureText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    actions: { padding: spacing.lg, gap: 12 },
    primaryBtn: {
        backgroundColor: colors.primary,
        height: 56, borderRadius: radius.md,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
        ...shadow.lg,
    },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    secondaryBtn: {
        height: 56, borderRadius: radius.md, borderWidth: 1.5,
        borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.surface,
    },
    secondaryBtnText: { color: colors.primary, fontSize: 17, fontWeight: '700' },
});
