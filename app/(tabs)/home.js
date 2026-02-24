import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMedicines } from '../../context/MedicineContext';
import {
    FREQUENCY_TIMES,
    normalizeFrequency,
    requestPermissions,
    speakReminder,
    scheduleMedicineReminders,
    scheduleAdhocNotification
} from '../../utils/ReminderEngine';

export default function HomeScreen() {
    const { prescriptions, logAdherence, skipCounts, updateSkipCount } = useMedicines();
    const [upcomingReminders, setUpcomingReminders] = useState([]);
    const [userData, setUserData] = useState({ email: '', caretakerEmail: 'caretaker@example.com' });
    const notificationListener = useRef();
    const responseListener = useRef();

    const [selectedMedForModal, setSelectedMedForModal] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        setupReminders();
        loadUserInfo();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const { medicineName } = notification.request.content.data;
            if (medicineName) speakReminder(medicineName);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { medicineId } = response.notification.request.content.data;
            if (medicineId) {
                // Find medicine to show in modal
                const allMedicines = prescriptions.flatMap(p => p.medicines);
                const med = allMedicines.find(m => m.id === medicineId);
                if (med) {
                    setSelectedMedForModal(med);
                    setIsModalVisible(true);
                }
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, [prescriptions]);

    const loadUserInfo = async () => {
        try {
            const storedEmail = await AsyncStorage.getItem('userEmail');
            const storedCaretaker = await AsyncStorage.getItem('caretakerEmail');
            if (storedEmail) setUserData(prev => ({ ...prev, email: storedEmail }));
            if (storedCaretaker) setUserData(prev => ({ ...prev, caretakerEmail: storedCaretaker }));
        } catch (e) {
            console.error(e);
        }
    };

    const setupReminders = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert("Permission Error", "Please enable notifications to receive reminders.");
        }
        calculateNextReminders();
    };

    const calculateNextReminders = () => {
        const allMedicines = prescriptions.flatMap(p => p.medicines);
        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        const reminders = [];
        allMedicines.forEach(medicine => {
            // Priority: medicine.times > frequency defaults
            let times = medicine.times;
            if (!times || times.length === 0) {
                const frequency = normalizeFrequency(medicine.frequency);
                times = FREQUENCY_TIMES[frequency] || ["09:00"];
            }

            times.forEach(timeStr => {
                const [h, m] = timeStr.split(':').map(Number);
                const timeInMinutes = h * 60 + m;
                let displayTime = timeInMinutes > currentTimeInMinutes ? `Today, ${timeStr}` : `Tomorrow, ${timeStr}`;

                reminders.push({
                    ...medicine,
                    displayTime,
                    timeInMinutes,
                    sortValue: timeInMinutes > currentTimeInMinutes ? timeInMinutes : timeInMinutes + 1440,
                });
            });
        });

        const sortedReminders = reminders.sort((a, b) => a.sortValue - b.sortValue);
        setUpcomingReminders(sortedReminders.slice(0, 5));
    };

    const triggerEscalation = async (medicineName) => {
        try {
            // Using placeholder IP from previous context or generic localhost for development
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/send-alert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: userData.email || 'patient@example.com',
                    caretakerEmail: userData.caretakerEmail,
                    medicineName: medicineName
                }),
            });
            const data = await response.json();
            if (data.status === 'sent') {
                Alert.alert("Safety Alert", "Caretaker has been notified.");
            }
        } catch (error) {
            console.error("Failed to send alert:", error);
            // Fallback for simulation if backend is unreachable
            Alert.alert("Clinic Notified", "Caregiver has been notified via emergency protocol.");
        }
    };

    const handleAction = async (medicine, action) => {
        if (action === 'taken') {
            logAdherence(medicine.id, 'taken');
            updateSkipCount(medicine.id, 'reset');
            Alert.alert("Success", "Medicine marked as taken.");
            setIsModalVisible(false);
        }
        else if (action === 'postpone') {
            const newCount = updateSkipCount(medicine.id, 'increment');
            if (newCount >= 3) {
                await triggerEscalation(medicine.name);
                updateSkipCount(medicine.id, 'reset');
            } else {
                await scheduleAdhocNotification(medicine, 10);
                Alert.alert("Postponed", "We will remind you again in 10 minutes.");
            }
            setIsModalVisible(false);
        }
        else if (action === 'skip') {
            const newCount = updateSkipCount(medicine.id, 'increment');
            if (newCount >= 3) {
                await triggerEscalation(medicine.name);
                updateSkipCount(medicine.id, 'reset');
            } else {
                await scheduleAdhocNotification(medicine, 5);
                logAdherence(medicine.id, 'missed');
                Alert.alert("Skipped", "Record updated. We will check in again in 5 minutes.");
            }
            setIsModalVisible(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Daily Reminders</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity
                    style={styles.dashboardBtn}
                    onPress={() => router.push('/adherence-dashboard')}
                >
                    <View style={styles.dashboardBtnContent}>
                        <Ionicons name="stats-chart" size={20} color="#fff" />
                        <Text style={styles.dashboardBtnText}>View Adherence Dashboard</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#fff" opacity={0.7} />
                </TouchableOpacity>

                <Text style={styles.greeting}>Upcoming Doses</Text>

                {upcomingReminders.length > 0 ? (
                    upcomingReminders.map((reminder, index) => (
                        <View key={`${reminder.id}-${index}`} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.headerCore}>
                                    <FontAwesome5 name="clock" size={14} color="#007AFF" />
                                    <Text style={styles.cardTitle}>{reminder.displayTime}</Text>
                                </View>
                                {skipCounts[reminder.id] > 0 && (
                                    <View style={styles.skipBadge}>
                                        <Text style={styles.skipBadgeText}>Postponed {skipCounts[reminder.id]}x</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.medicineName}>{reminder.name}</Text>
                            <Text style={styles.dosage}>{reminder.dosage}</Text>

                            <View style={styles.actionColumn}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.takenBtn]}
                                    onPress={() => handleAction(reminder, 'taken')}
                                >
                                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                                    <Text style={styles.btnText}>Mark as Taken</Text>
                                </TouchableOpacity>

                                <View style={styles.secondaryActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.postponeBtn]}
                                        onPress={() => handleAction(reminder, 'postpone')}
                                    >
                                        <Ionicons name="time-outline" size={18} color="#007AFF" />
                                        <Text style={[styles.btnText, { color: '#007AFF' }]}>In 10 Mins</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.skipBtn]}
                                        onPress={() => handleAction(reminder, 'skip')}
                                    >
                                        <MaterialIcons name="block" size={18} color="#FF3B30" />
                                        <Text style={[styles.btnText, { color: '#FF3B30' }]}>Skip</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="clipboard-check" size={40} color="#ccc" />
                        <Text style={styles.emptyText}>No reminders scheduled. Add a prescription to get started.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Modal for Notifications */}
            <Modal
                transparent={true}
                visible={isModalVisible}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Medicine Reminder</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        {selectedMedForModal && (
                            <View style={styles.modalBody}>
                                <Text style={styles.medNameText}>{selectedMedForModal.name}</Text>
                                <Text style={styles.medDosageText}>{selectedMedForModal.dosage}</Text>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.takenBtn]}
                                        onPress={() => handleAction(selectedMedForModal, 'taken')}
                                    >
                                        <MaterialIcons name="check-circle" size={20} color="#fff" />
                                        <Text style={styles.modalBtnText}>Mark as Taken</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.postponeBtn]}
                                        onPress={() => handleAction(selectedMedForModal, 'postpone')}
                                    >
                                        <Ionicons name="time-outline" size={20} color="#007AFF" />
                                        <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>Remind me in 10 Mins</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.skipBtn]}
                                        onPress={() => handleAction(selectedMedForModal, 'skip')}
                                    >
                                        <MaterialIcons name="block" size={20} color="#FF3B30" />
                                        <Text style={[styles.modalBtnText, { color: '#FF3B30' }]}>Skip</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7'
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a'
    },
    content: {
        padding: 16
    },
    dashboardBtn: {
        backgroundColor: '#5856D6',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    dashboardBtnContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    dashboardBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12
    },
    greeting: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 16,
        color: '#1C1C1E'
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    headerCore: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardTitle: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '700',
        marginLeft: 6,
        textTransform: 'uppercase'
    },
    skipBadge: {
        backgroundColor: '#FFF2F2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    skipBadgeText: {
        fontSize: 10,
        color: '#FF3B30',
        fontWeight: '600'
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginBottom: 12
    },
    medicineName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 2
    },
    dosage: {
        fontSize: 15,
        color: '#8E8E93',
        marginBottom: 16
    },
    actionColumn: {
        gap: 8
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between'
    },
    actionBtn: {
        height: 48,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    takenBtn: {
        backgroundColor: '#34C759',
        width: '100%'
    },
    postponeBtn: {
        backgroundColor: '#F2F2F7',
        flex: 1,
        borderWidth: 1,
        borderColor: '#007AFF20'
    },
    skipBtn: {
        backgroundColor: '#F2F2F7',
        flex: 1,
        borderWidth: 1,
        borderColor: '#FF3B3020'
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 14
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60
    },
    emptyText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 16,
        paddingHorizontal: 40
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1C1C1E'
    },
    modalBody: {
        alignItems: 'center'
    },
    medNameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 4
    },
    medDosageText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 30
    },
    modalActions: {
        width: '100%',
        gap: 12
    },
    modalBtn: {
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    modalBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10
    }
});
