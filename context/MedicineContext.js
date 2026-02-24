import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedicineReminders, cancelMedicineReminders, requestPermissions } from '../utils/ReminderEngine';

const MedicineContext = createContext();

export const MedicineProvider = ({ children }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [adherenceLogs, setAdherenceLogs] = useState([]);
    const [skipCounts, setSkipCounts] = useState({});

    useEffect(() => {
        const initialize = async () => {
            await requestPermissions();
            await loadData();
        };
        initialize();
    }, []);

    const loadData = async () => {
        try {
            const [storedPrescriptions, storedLogs, storedSkipCounts] = await Promise.all([
                AsyncStorage.getItem('prescriptions'),
                AsyncStorage.getItem('adherenceLogs'),
                AsyncStorage.getItem('skipCounts')
            ]);

            if (storedLogs) setAdherenceLogs(JSON.parse(storedLogs));
            if (storedSkipCounts) setSkipCounts(JSON.parse(storedSkipCounts));

            if (storedPrescriptions) {
                const parsed = JSON.parse(storedPrescriptions);
                // Perform sync on load: cancel completed courses
                const now = new Date();
                const updatedPrescriptions = await Promise.all(parsed.map(async (p) => {
                    if (!p.medicines) return p;
                    const updatedMedicines = await Promise.all(p.medicines.map(async (m) => {
                        if (m.endDate && new Date(m.endDate) < now && m.notificationIds?.length > 0) {
                            try {
                                await cancelMedicineReminders(m.notificationIds);
                            } catch (e) {
                                console.error('Early cancellation failed', e);
                            }
                            return { ...m, notificationIds: [] };
                        }
                        return m;
                    }));
                    return { ...p, medicines: updatedMedicines };
                }));

                setPrescriptions(updatedPrescriptions);
                await AsyncStorage.setItem('prescriptions', JSON.stringify(updatedPrescriptions));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const savePrescriptions = async (newPrescriptions) => {
        try {
            await AsyncStorage.setItem('prescriptions', JSON.stringify(newPrescriptions));
            setPrescriptions(newPrescriptions);
        } catch (error) {
            console.error('Failed to save prescriptions:', error);
        }
    };

    const saveAdherenceLogs = async (newLogs) => {
        try {
            await AsyncStorage.setItem('adherenceLogs', JSON.stringify(newLogs));
            setAdherenceLogs(newLogs);
        } catch (error) {
            console.error('Failed to save adherence logs:', error);
        }
    };

    const saveSkipCounts = async (newSkipCounts) => {
        try {
            await AsyncStorage.setItem('skipCounts', JSON.stringify(newSkipCounts));
            setSkipCounts(newSkipCounts);
        } catch (error) {
            console.error('Failed to save skip counts:', error);
        }
    };

    const addPrescription = async (prescription) => {
        try {
            // Schedule notifications for each medicine
            const medicinesWithIds = await Promise.all(prescription.medicines.map(async (med) => {
                try {
                    const ids = await scheduleMedicineReminders(med);
                    return { ...med, notificationIds: ids };
                } catch (e) {
                    console.error(`Scheduling failed for ${med.name}`, e);
                    return { ...med, notificationIds: [] };
                }
            }));

            const newPrescription = {
                ...prescription,
                medicines: medicinesWithIds,
                id: Date.now().toString(),
                uploadDate: new Date().toISOString()
            };

            const newPrescriptions = [newPrescription, ...prescriptions];
            await savePrescriptions(newPrescriptions);
            return true;
        } catch (error) {
            console.error('Failed to add prescription:', error);
            return false;
        }
    };

    const deletePrescription = async (id) => {
        const prescriptionToDelete = prescriptions.find(p => p.id === id);
        if (prescriptionToDelete) {
            // Cancel all notifications for all medicines in this prescription
            for (const med of prescriptionToDelete.medicines) {
                await cancelMedicineReminders(med.notificationIds);
            }
        }
        const newPrescriptions = prescriptions.filter(p => p.id !== id);
        await savePrescriptions(newPrescriptions);
    };

    const deleteMedicine = async (prescriptionId, medicineId) => {
        const newPrescriptions = await Promise.all(prescriptions.map(async (prescription) => {
            if (prescription.id === prescriptionId) {
                const medToDelete = prescription.medicines.find(m => m.id === medicineId);
                if (medToDelete) {
                    await cancelMedicineReminders(medToDelete.notificationIds);
                }
                const updatedMedicines = prescription.medicines.filter(m => m.id !== medicineId);
                return { ...prescription, medicines: updatedMedicines };
            }
            return prescription;
        }));
        await savePrescriptions(newPrescriptions);
    };

    const updateSkipCount = (medicineId, action) => {
        const currentCount = skipCounts[medicineId] || 0;
        let newCount = currentCount;

        if (action === 'increment') {
            newCount += 1;
        } else if (action === 'reset') {
            newCount = 0;
        }

        const newSkipCounts = { ...skipCounts, [medicineId]: newCount };
        saveSkipCounts(newSkipCounts);
        return newCount;
    };

    const logAdherence = (medicineId, status) => {
        const newLog = {
            id: Date.now().toString(),
            medicineId,
            status, // 'taken' | 'missed' | 'postponed'
            timestamp: new Date().toISOString()
        };
        const newLogs = [newLog, ...adherenceLogs];
        saveAdherenceLogs(newLogs);

        // Auto-reset skip count if taken
        if (status === 'taken') {
            updateSkipCount(medicineId, 'reset');
        }
    };

    return (
        <MedicineContext.Provider value={{
            prescriptions,
            adherenceLogs,
            skipCounts,
            addPrescription,
            deletePrescription,
            deleteMedicine,
            logAdherence,
            updateSkipCount
        }}>
            {children}
        </MedicineContext.Provider>
    );
};

export const useMedicines = () => useContext(MedicineContext);
