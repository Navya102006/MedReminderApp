import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMedicines } from '../context/MedicineContext';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadow } from '../constants/theme';

export default function AdherenceDashboard() {
    const { prescriptions, adherenceLogs } = useMedicines();
    const router = useRouter();

    const calculateStats = () => {
        let totalScheduled = 0, totalTaken = 0, totalMissed = 0;
        prescriptions.flatMap(p => p.medicines).forEach(med => {
            const dailyTimes = med.times?.length || 1;
            const d = med.duration?.match(/\d+/);
            totalScheduled += dailyTimes * (d ? parseInt(d[0]) : 1);
        });
        adherenceLogs.forEach(log => {
            if (log.status === 'taken') totalTaken++;
            if (log.status === 'missed') totalMissed++;
        });
        const adherence = totalScheduled > 0 ? Math.min(Math.round((totalTaken / totalScheduled) * 100), 100) : 0;
        return { totalScheduled, totalTaken, totalMissed, adherence, remaining: Math.max(totalScheduled - totalTaken - totalMissed, 0) };
    };

    const stats = calculateStats();

    const grade = stats.adherence >= 80 ? { label: 'Excellent', color: colors.success, bg: colors.successLight } :
        stats.adherence >= 50 ? { label: 'Good', color: colors.warning, bg: colors.warningLight } :
            { label: 'Needs Attention', color: colors.error, bg: colors.errorLight };

    const STAT_CARDS = [
        { icon: 'list-ul', iconColor: colors.primary, bg: colors.primaryLight, value: stats.totalScheduled, label: 'Total Scheduled' },
        { icon: 'check-circle', lib: 'MaterialIcons', iconColor: colors.success, bg: colors.successLight, value: stats.totalTaken, label: 'Total Taken' },
        { icon: 'error', lib: 'MaterialIcons', iconColor: colors.error, bg: colors.errorLight, value: stats.totalMissed, label: 'Total Missed' },
        { icon: 'time-outline', lib: 'Ionicons', iconColor: colors.warning, bg: colors.warningLight, value: stats.remaining, label: 'Remaining' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Adherence Dashboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Main Score Card */}
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>Overall Adherence</Text>
                    <Text style={[styles.scoreValue, { color: grade.color }]}>{stats.adherence}%</Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${stats.adherence}%`, backgroundColor: grade.color }]} />
                    </View>

                    {/* Grade Badge */}
                    <View style={[styles.gradeBadge, { backgroundColor: grade.bg }]}>
                        <Text style={[styles.gradeLabel, { color: grade.color }]}>{grade.label}</Text>
                    </View>
                </View>

                {/* Stat Cards Grid */}
                <View style={styles.grid}>
                    {STAT_CARDS.map((s) => {
                        const IconComp = s.lib === 'MaterialIcons' ? MaterialIcons : s.lib === 'Ionicons' ? Ionicons : FontAwesome5;
                        return (
                            <View key={s.label} style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                    <IconComp name={s.icon} size={20} color={s.iconColor} />
                                </View>
                                <Text style={[styles.statValue, { color: s.iconColor }]}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Tips */}
                <View style={styles.tipCard}>
                    <View style={styles.tipHeader}>
                        <Ionicons name="bulb-outline" size={18} color={colors.warning} />
                        <Text style={styles.tipTitle}>Tips to improve adherence</Text>
                    </View>
                    {['Set reminders at the same time every day', 'Keep medicines in a visible location', 'Use a pill organizer', 'Track your progress weekly'].map(t => (
                        <View key={t} style={styles.tipRow}>
                            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                            <Text style={styles.tipText}>{t}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.infoText}>Stats are based on your prescription history and dose logs.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    content: { padding: spacing.md, paddingBottom: 40, gap: 16 },
    scoreCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.md },
    scoreLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    scoreValue: { fontSize: 56, fontWeight: '900', letterSpacing: -2, marginBottom: 16 },
    progressBg: { width: '100%', height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 14 },
    progressFill: { height: '100%', borderRadius: 5 },
    gradeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full },
    gradeLabel: { fontSize: 13, fontWeight: '800' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, width: '47%', alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 8, ...shadow.sm },
    statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
    tipCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10, ...shadow.sm },
    tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    tipTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    infoRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
    infoText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 18 },
});
