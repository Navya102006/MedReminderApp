import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMedicines } from '../context/MedicineContext';
import { useRouter } from 'expo-router';

export default function AdherenceDashboard() {
    const { prescriptions, adherenceLogs } = useMedicines();
    const router = useRouter();

    const calculateStats = () => {
        let totalScheduled = 0;
        let totalTaken = 0;
        let totalMissed = 0;

        // 1. Calculate Total Scheduled Doses
        const allMedicines = prescriptions.flatMap(p => p.medicines);
        allMedicines.forEach(med => {
            const dailyTimes = med.times?.length || 1;
            const durationMatch = med.duration?.match(/\d+/);
            const durationDays = durationMatch ? parseInt(durationMatch[0]) : 1;
            totalScheduled += (dailyTimes * durationDays);
        });

        // 2. Count Taken and Missed Logs
        adherenceLogs.forEach(log => {
            if (log.status === 'taken') totalTaken++;
            if (log.status === 'missed') totalMissed++;
        });

        const adherencePercentage = totalScheduled > 0
            ? Math.min(Math.round((totalTaken / totalScheduled) * 100), 100)
            : 0;

        return {
            totalScheduled,
            totalTaken,
            totalMissed,
            adherencePercentage
        };
    };

    const stats = calculateStats();

    const getProgressColor = (percent) => {
        if (percent > 80) return '#34C759'; // Green
        if (percent >= 50) return '#FF9500'; // Orange
        return '#FF3B30'; // Red
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Adherence Dashboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Overall Adherence</Text>
                    <Text style={[styles.percentageText, { color: getProgressColor(stats.adherencePercentage) }]}>
                        {stats.adherencePercentage}%
                    </Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${stats.adherencePercentage}%`,
                                        backgroundColor: getProgressColor(stats.adherencePercentage)
                                    }
                                ]}
                            />
                        </View>
                    </View>
                </View>

                <View style={[styles.statsRow, { marginTop: 20 }]}>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#E1E9F5' }]}>
                            <FontAwesome5 name="list-ol" size={18} color="#007AFF" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalScheduled}</Text>
                        <Text style={styles.statLabel}>Total Scheduled</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialIcons name="check-circle" size={22} color="#34C759" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalTaken}</Text>
                        <Text style={styles.statLabel}>Total Taken</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF2F2' }]}>
                            <MaterialIcons name="error" size={22} color="#FF3B30" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalMissed}</Text>
                        <Text style={styles.statLabel}>Total Missed</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF9EB' }]}>
                            <Ionicons name="stats-chart" size={20} color="#FFCC00" />
                        </View>
                        <Text style={styles.statValue}>
                            {stats.totalScheduled - stats.totalTaken - stats.totalMissed > 0
                                ? stats.totalScheduled - stats.totalTaken - stats.totalMissed
                                : 0}
                        </Text>
                        <Text style={styles.statLabel}>Remaining Doses</Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
                    <Text style={styles.infoText}>
                        Calculations are based on the prescribed duration and frequency of each medicine in your recorded prescriptions.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backBtn: {
        marginRight: 12
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a'
    },
    content: {
        padding: 16
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8
    },
    percentageText: {
        fontSize: 48,
        fontWeight: '800',
        marginBottom: 20
    },
    progressContainer: {
        width: '100%',
        marginTop: 10
    },
    progressBarBackground: {
        height: 12,
        backgroundColor: '#E5E5EA',
        borderRadius: 6,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        alignItems: 'center'
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        textAlign: 'center'
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#E5E5EA'
    },
    infoText: {
        fontSize: 13,
        color: '#8E8E93',
        flex: 1,
        marginLeft: 10,
        lineHeight: 18
    }
});
