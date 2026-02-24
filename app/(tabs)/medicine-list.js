import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useMedicines } from '../../context/MedicineContext';

export default function MedicineListScreen() {
    const { prescriptions, deletePrescription, deleteMedicine } = useMedicines();
    const [selectedImage, setSelectedImage] = useState(null);

    const handleDeletePrescription = (id) => {
        Alert.alert(
            "Delete Prescription",
            "Are you sure you want to delete this entire prescription and all its medicines?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deletePrescription(id) }
            ]
        );
    };

    const handleDeleteMedicine = (prescriptionId, medicineId) => {
        Alert.alert(
            "Delete Medicine",
            "Are you sure you want to remove this medicine?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMedicine(prescriptionId, medicineId) }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderMedicineItem = (medicine, prescriptionId) => {
        let remainingText = "";
        let isCompleted = false;

        if (medicine.endDate) {
            const today = new Date();
            const end = new Date(medicine.endDate);
            const diffTime = end - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                isCompleted = true;
                remainingText = "Course Completed";
            } else {
                remainingText = `${diffDays} days left`;
            }
        } else {
            remainingText = "Ongoing";
        }

        return (
            <View key={medicine.id} style={[styles.medicineRow, isCompleted && styles.completedRow]}>
                <View style={[styles.medicineIcon, isCompleted && styles.completedIcon]}>
                    <FontAwesome5
                        name={isCompleted ? 'check-circle' : 'pills'}
                        size={16}
                        color={isCompleted ? '#28a745' : '#007AFF'}
                    />
                </View>

                <View style={styles.medicineContent}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.medicineDetails}>{medicine.dosage} • {medicine.frequency}</Text>

                    <View style={styles.metaRow}>
                        <View style={[styles.durationBadge, isCompleted && styles.completedBadge]}>
                            <Text style={[styles.durationText, isCompleted && styles.completedText]}>
                                {remainingText}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => handleDeleteMedicine(prescriptionId, medicine.id)}
                    style={styles.deleteMedicineBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome5 name="trash-alt" size={14} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderPrescription = ({ item }) => {
        return (
            <View style={styles.card}>
                {/* Prescription Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={styles.dateIcon}>
                            <FontAwesome5 name="calendar-alt" size={16} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.headerLabel}>Prescription Date</Text>
                            <Text style={styles.headerDate}>{formatDate(item.uploadDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        {item.imageUri && (
                            <TouchableOpacity
                                style={styles.imageBtn}
                                onPress={() => setSelectedImage(item.imageUri)}
                            >
                                <FontAwesome5 name="file-prescription" size={16} color="#007AFF" />
                                <Text style={styles.imageBtnText}>View Image</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.deletePrescriptionBtn}
                            onPress={() => handleDeletePrescription(item.id)}
                        >
                            <FontAwesome5 name="trash" size={16} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Medicines List within Prescription */}
                <View style={styles.medicinesContainer}>
                    {item.medicines && item.medicines.length > 0 ? (
                        item.medicines.map(medicine => renderMedicineItem(medicine, item.id))
                    ) : (
                        <Text style={styles.emptyMedicinesText}>No medicines in this prescription.</Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Prescriptions</Text>
            </View>

            {prescriptions.length > 0 ? (
                <FlatList
                    data={prescriptions}
                    keyExtractor={item => item.id}
                    renderItem={renderPrescription}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <FontAwesome5 name="file-medical" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No prescriptions added yet.</Text>
                </View>
            )}

            {/* Image Modal */}
            <Modal visible={!!selectedImage} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedImage(null)} />
                    <View style={styles.modalContent}>
                        <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                            <FontAwesome5 name="times" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC'
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a'
    },
    listContent: {
        padding: 20,
        paddingBottom: 40
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    dateIcon: {
        marginRight: 10,
        width: 32,
        height: 32,
        backgroundColor: '#E1E9F5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerLabel: {
        fontSize: 10,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    headerDate: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333'
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    imageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E1E9F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10
    },
    imageBtnText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        marginLeft: 6
    },
    deletePrescriptionBtn: {
        padding: 6
    },
    medicinesContainer: {
        padding: 16
    },
    medicineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    completedRow: {
        opacity: 0.7
    },
    medicineIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#E1E9F5',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    completedIcon: {
        backgroundColor: '#E6F4EA'
    },
    medicineContent: {
        flex: 1
    },
    medicineName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2
    },
    medicineDetails: {
        fontSize: 13,
        color: '#666',
        marginBottom: 6
    },
    metaRow: {
        flexDirection: 'row'
    },
    durationBadge: {
        backgroundColor: '#F0F8FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    completedBadge: {
        backgroundColor: '#E6F4EA'
    },
    durationText: {
        fontSize: 11,
        color: '#007AFF',
        fontWeight: '600'
    },
    completedText: {
        color: '#28a745'
    },
    deleteMedicineBtn: {
        padding: 8,
        marginLeft: 8
    },
    emptyMedicinesText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        marginTop: 10
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginTop: 16
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalCloseArea: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    },
    modalContent: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    fullImage: {
        width: '90%',
        height: '80%',
        borderRadius: 8
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20
    }
});
