import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// Configure notifications handler — not supported on web
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

export const FREQUENCY_TIMES = {
    "Once daily": ["09:00"],
    "Twice daily": ["09:00", "21:00"],
    "Three times daily": ["09:00", "14:00", "21:00"],
};

/**
 * Normalizes frequency string to match FREQUENCY_TIMES keys
 */
export const normalizeFrequency = (freq) => {
    const f = freq?.toLowerCase() || "";
    if (f.includes("once") || f === "1" || f.includes("1 time")) return "Once daily";
    if (f.includes("twice") || f === "2" || f.includes("2 times")) return "Twice daily";
    if (f.includes("three") || f === "3" || f.includes("3 times")) return "Three times daily";
    return "Once daily"; // Default
};

export const scheduleMedicineReminders = async (medicine) => {
    // Notifications not supported on web
    if (Platform.OS === 'web') return [];
    // Check if course is already completed
    if (medicine.endDate) {
        const end = new Date(medicine.endDate);
        if (new Date() > end) {
            console.log(`Course completed for ${medicine.name}, skipping scheduling.`);
            return [];
        }
    }

    // Priority 1: User-selected custom times
    // Priority 2: Fallback to normalized frequency defaults
    let times = medicine.times;

    if (!times || times.length === 0) {
        const frequency = normalizeFrequency(medicine.frequency);
        times = FREQUENCY_TIMES[frequency] || ["09:00"];
    }

    const notificationIds = [];

    for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Medicine Reminder",
                    body: `Time to take your medicine ${medicine.name}`,
                    data: { medicineId: medicine.id, medicineName: medicine.name },
                },
                trigger: {
                    type: 'daily',
                    hour: hours,
                    minute: minutes,
                },
            });
            notificationIds.push(id);
        } catch (error) {
            console.error(`Failed to schedule notification for ${medicine.name}:`, error);
        }
    }

    return notificationIds;
};

/**
 * Cancels notifications for a medicine
 */
export const cancelMedicineReminders = async (notificationIds) => {
    if (Platform.OS === 'web') return;
    if (!notificationIds || notificationIds.length === 0) return;

    for (const id of notificationIds) {
        try {
            await Notifications.cancelScheduledNotificationAsync(id);
        } catch (error) {
            console.error(`Failed to cancel notification ${id}:`, error);
        }
    }
};

/**
 * Schedules an ad-hoc notification (e.g. for "Remind me in 10 mins")
 */
export const scheduleAdhocNotification = async (medicine, delayMinutes) => {
    if (Platform.OS === 'web') return null;
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: "Medicine Reminder (Follow-up)",
            body: `Time to take your ${medicine.name} - you postponed this earlier.`,
            data: { medicineId: medicine.id, medicineName: medicine.name },
        },
        trigger: {
            seconds: delayMinutes * 60,
        },
    });
    return id;
};

/**
 * Speaks the reminder message in English and Telugu
 */
export const speakReminder = (medicineName) => {
    // Speech not supported on web
    if (Platform.OS === 'web') return;
    // 1. English Reminder
    Speech.speak(`Time to take your medicine ${medicineName}`, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
    });

    // 2. Telugu Reminder (Bilingual Support)
    // Translation: "It's time for your medicine. Please take [Medicine Name]."
    const teluguMessage = `మీ మందు వేసుకునే సమయం అయింది. దయచేసి ${medicineName} వేసుకోండి.`;
    Speech.speak(teluguMessage, {
        language: 'te-IN',
        pitch: 1.0,
        rate: 0.8, // Slightly slower for clarity
    });
};

/**
 * Request notification permissions
 */
export const requestPermissions = async () => {
    if (Platform.OS === 'web') return true; // No permission needed on web
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    return finalStatus === 'granted';
};
