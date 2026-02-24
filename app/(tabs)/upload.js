import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, TextInput, FlatList, ActivityIndicator, LayoutAnimation, Platform, UIManager, Modal } from 'react-native';
import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useMedicines } from '../../context/MedicineContext';
import { normalizeFrequency } from '../../utils/ReminderEngine';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function UploadScreen() {
    const router = useRouter();
    const { addPrescription } = useMedicines();

    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [isTextExpanded, setIsTextExpanded] = useState(false);

    // Manual Entry State
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');

    // Medicines List State
    const [medicinesList, setMedicinesList] = useState([]);

    // Frequency Picker State
    const [isFreqModalVisible, setFreqModalVisibility] = useState(false);
    const [freqTarget, setFreqTarget] = useState(null); // { id: 'manual' | medId }

    // Time Picker State
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null); // { id, index }

    const FREQUENCY_OPTIONS = ["Once daily", "Twice daily", "Three times daily"];

    const pickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setImage(uri);
                processImage(uri);
            }
        } catch (e) {
            Alert.alert("Error", "Could not pick image.");
        }
    };

    const capturePrescription = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required.');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setImage(uri);
                processImage(uri);
            }
        } catch (e) {
            Alert.alert("Error", "Could not capture image.");
        }
    };

    const getDefaultTimes = (freq) => {
        const normalized = normalizeFrequency(freq);
        if (normalized === "Once daily") return ["09:00"];
        if (normalized === "Twice daily") return ["09:00", "21:00"];
        if (normalized === "Three times daily") return ["09:00", "14:00", "21:00"];
        return ["09:00"];
    };

    const formatTimeForDisplay = (time24) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    const processImage = async (imageUri) => {
        setLoading(true);
        setExtractedText('');

        try {
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                name: 'prescription.jpg',
                type: 'image/jpeg',
            });

            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/upload-prescription`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();

            if (data.status === 'success') {
                setExtractedText(data.extracted_text);

                if (data.detected_medicines && data.detected_medicines.length > 0) {
                    const newMedicines = data.detected_medicines.map((medName) => ({
                        id: Date.now().toString() + Math.random().toString(),
                        name: medName,
                        dosage: '',
                        frequency: 'Once daily',
                        duration: '',
                        times: ["09:00"],
                        isEditing: true
                    }));

                    setMedicinesList(newMedicines);
                    Alert.alert("Success", `Detected ${newMedicines.length} medicines.`);
                } else {
                    Alert.alert("OCR Complete", "No medicines detected automatically.");
                }
            } else {
                Alert.alert("Error", data.message || "Failed to process image.");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Upload Failed", "Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const addManualMedicine = () => {
        if (!name.trim()) {
            Alert.alert('Missing Name', 'Please enter Medicine Name.');
            return;
        }

        const newMedicine = {
            id: Date.now().toString(),
            name,
            dosage,
            frequency: frequency || 'Once daily',
            duration,
            times: getDefaultTimes(frequency || 'Once daily'),
            isEditing: false
        };

        setMedicinesList([...medicinesList, newMedicine]);
        setName('');
        setDosage('');
        setFrequency('');
        setDuration('');
    };

    const updateMedicineField = (id, field, value) => {
        setMedicinesList(prevList =>
            prevList.map(item => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    if (field === 'frequency') {
                        updated.times = getDefaultTimes(value);
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    const showDatePicker = (id, index) => {
        setPickerTarget({ id, index });
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        if (date && pickerTarget) {
            const { id, index } = pickerTarget;
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const newTime = `${hours}:${minutes}`;

            setMedicinesList(prev => prev.map(m => {
                if (m.id === id) {
                    const newTimes = [...m.times];
                    newTimes[index] = newTime;
                    return { ...m, times: newTimes };
                }
                return m;
            }));
        }
        hideDatePicker();
    };

    const removeMedicine = (id) => {
        setMedicinesList(medicinesList.filter(m => m.id !== id));
    };

    const showFrequencyPicker = (id) => {
        setFreqTarget(id);
        setFreqModalVisibility(true);
    };

    const handleFrequencySelect = (option) => {
        if (freqTarget === 'manual') {
            setFrequency(option);
        } else {
            updateMedicineField(freqTarget, 'frequency', option);
        }
        setFreqModalVisibility(false);
    };

    const toggleTextExpansion = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsTextExpanded(!isTextExpanded);
    };

    const handleSavePrescription = async () => {
        if (medicinesList.length === 0) {
            Alert.alert('No Medicines', 'Please add at least one medicine.');
            return;
        }

        const today = new Date();
        const startDate = today.toISOString();

        const finalMedicines = medicinesList.map(m => {
            let endDate = null;
            let displayDuration = m.duration;
            const durationNum = parseInt(m.duration);

            if (!isNaN(durationNum) && durationNum > 0) {
                const end = new Date(today);
                end.setDate(today.getDate() + durationNum);
                endDate = end.toISOString();
                displayDuration = `${durationNum} days`;
            } else {
                displayDuration = m.duration || 'Ongoing';
            }

            return {
                id: m.id,
                name: m.name,
                dosage: m.dosage || 'As directed',
                frequency: m.frequency,
                times: m.times,
                duration: displayDuration,
                startDate,
                endDate,
                type: 'pills'
            };
        });

        const prescription = {
            imageUri: image,
            medicines: finalMedicines
        };

        const success = await addPrescription(prescription);

        if (success) {
            setImage(null);
            setMedicinesList([]);
            setExtractedText('');
            router.navigate('medicine-list');
        } else {
            Alert.alert("Error", "Failed to save prescription and schedule reminders.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Scan Prescription</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.imageSection}>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {image ? <Image source={{ uri: image }} style={styles.image} /> : (
                            <View style={styles.imagePlaceholder}>
                                <FontAwesome5 name="cloud-upload-alt" size={40} color="#007AFF" />
                                <Text style={styles.imageText}>Upload Prescription</Text>
                            </View>
                        )}
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#fff" />
                                <Text style={styles.loadingText}>Processing...</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionBtn, styles.cameraBtn]} onPress={capturePrescription}>
                            <FontAwesome5 name="camera" size={18} color="#fff" />
                            <Text style={styles.btnText}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.galleryBtn]} onPress={pickImage}>
                            <FontAwesome5 name="images" size={18} color="#fff" />
                            <Text style={styles.btnText}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {extractedText ? (
                    <View style={styles.ocrSection}>
                        <TouchableOpacity style={styles.ocrHeader} onPress={toggleTextExpansion}>
                            <FontAwesome5 name="file-alt" size={16} color="#007AFF" />
                            <Text style={styles.ocrTitle}>OCR Extracted Text</Text>
                            <FontAwesome5 name={isTextExpanded ? "chevron-up" : "chevron-down"} size={14} color="#666" />
                        </TouchableOpacity>
                        {isTextExpanded && (
                            <View style={styles.ocrContent}>
                                <Text style={styles.rawText}>{extractedText}</Text>
                            </View>
                        )}
                    </View>
                ) : null}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Medicines List</Text>
                    <Text style={styles.subtitle}>{medicinesList.length} items</Text>
                </View>

                {medicinesList.map((item, index) => (
                    <View key={item.id} style={styles.medicineCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIndex}>#{index + 1}</Text>
                            <TextInput
                                style={styles.nameInput}
                                value={item.name}
                                onChangeText={(text) => updateMedicineField(item.id, 'name', text)}
                                placeholder="Medicine Name"
                            />
                            <TouchableOpacity onPress={() => removeMedicine(item.id)} style={styles.deleteBtn}>
                                <MaterialIcons name="close" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <TextInput
                                style={[styles.smallInput, { flex: 2 }]}
                                value={item.dosage}
                                onChangeText={(text) => updateMedicineField(item.id, 'dosage', text)}
                                placeholder="Dosage"
                            />
                            <TouchableOpacity
                                style={[styles.selectorInput, { flex: 2 }]}
                                onPress={() => showFrequencyPicker(item.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.selectorText}>{item.frequency || 'Select Freq'}</Text>
                                <Ionicons name="chevron-down" size={12} color="#007AFF" />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.smallInput, { flex: 1.2 }]}
                                value={item.duration}
                                onChangeText={(text) => updateMedicineField(item.id, 'duration', text)}
                                placeholder="Days"
                                keyboardType="numeric"
                            />
                        </View>

                        <Text style={styles.timeLabel}>Reminder Schedule:</Text>
                        <View style={styles.timePickerContainer}>
                            {item.times.map((time, tIdx) => (
                                <TouchableOpacity
                                    key={tIdx}
                                    style={styles.timeChip}
                                    onPress={() => showDatePicker(item.id, tIdx)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.timeChipHeader}>
                                        <Ionicons name="time" size={16} color="#007AFF" />
                                        <Text style={styles.timeText}>{formatTimeForDisplay(time)}</Text>
                                    </View>
                                    <Text style={styles.timeSubtext}>TAP TO CHANGE</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <View style={styles.divider}><Text style={styles.dividerText}>OR ADD MANUALLY</Text></View>

                <View style={styles.manualForm}>
                    <TextInput style={styles.manualInput} placeholder="Medicine Name" value={name} onChangeText={setName} />
                    <View style={styles.row}>
                        <TextInput style={styles.manualInputHalf} placeholder="Dosage" value={dosage} onChangeText={setDosage} />
                        <TouchableOpacity
                            style={styles.manualInputHalfSelector}
                            onPress={() => showFrequencyPicker('manual')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.selectorTextMain}>{frequency || 'Frequency'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    <TextInput style={styles.manualInput} placeholder="Duration (Days)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
                    <TouchableOpacity style={styles.addManualBtn} onPress={addManualMedicine}>
                        <Text style={styles.addManualBtnText}>Add to List</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100, marginTop: 10 }}>
                    {medicinesList.length > 0 && (
                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.6 }]}
                            onPress={handleSavePrescription}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Prescription</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="time"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                is24Hour={true}
                date={(() => {
                    if (!pickerTarget) return new Date();
                    const med = medicinesList.find(m => m.id === pickerTarget.id);
                    if (!med) return new Date();
                    const [h, m] = med.times[pickerTarget.index].split(':');
                    const d = new Date();
                    d.setHours(parseInt(h), parseInt(m), 0, 0);
                    return d;
                })()}
            />

            {/* Frequency Selection Modal */}
            <Modal
                transparent={true}
                visible={isFreqModalVisible}
                animationType="fade"
                onRequestClose={() => setFreqModalVisibility(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setFreqModalVisibility(false)}
                >
                    <View style={styles.dropdownModal}>
                        <Text style={styles.modalTitle}>Select Frequency</Text>
                        {FREQUENCY_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.optionItem}
                                onPress={() => handleFrequencySelect(option)}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                                {(freqTarget === 'manual' ? frequency === option : medicinesList.find(m => m.id === freqTarget)?.frequency === option) && (
                                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEF2F6' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
    content: { paddingBottom: 40, padding: 16 },
    imageSection: { marginBottom: 24 },
    imagePicker: { height: 180, backgroundColor: '#EBF2FF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#D0E1FF', borderStyle: 'dashed' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    imagePlaceholder: { alignItems: 'center' },
    imageText: { marginTop: 12, color: '#007AFF', fontSize: 16, fontWeight: '700' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#007AFF', marginTop: 10, fontSize: 16, fontWeight: '700' },
    actionButtons: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
    actionBtn: { flex: 0.48, height: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cameraBtn: { backgroundColor: '#34C759' },
    galleryBtn: { backgroundColor: '#007AFF' },
    btnText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 16 },
    ocrSection: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#EEF2F6' },
    ocrHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#F9FBFF' },
    ocrTitle: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700', color: '#4A4A4A' },
    ocrContent: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEF2F6' },
    rawText: { fontSize: 13, color: '#6C757D', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
    subtitle: { fontSize: 14, color: '#ADB5BD', fontWeight: '600' },
    medicineCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, borderWidth: 1, borderColor: '#F1F3F5' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardIndex: { marginRight: 10, fontWeight: '800', color: '#007AFF', fontSize: 14 },
    nameInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1F1F1F', borderBottomWidth: 2, borderBottomColor: '#E9ECEF', paddingVertical: 6 },
    deleteBtn: { padding: 6, backgroundColor: '#FFF0F0', borderRadius: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    smallInput: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#495057', borderWidth: 1, borderColor: '#E9ECEF' },
    selectorInput: { backgroundColor: '#F0F4F8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#DCE4EC' },
    selectorText: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
    selectorTextMain: { fontSize: 15, fontWeight: '600', color: '#495057' },
    timeLabel: { fontSize: 13, fontWeight: '800', color: '#868E96', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    timePickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    timeChip: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E1E9F5', elevation: 2, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    timeChipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    timeText: { fontSize: 15, color: '#1A1A1A', fontWeight: '800' },
    timeSubtext: { fontSize: 9, color: '#007AFF', fontWeight: '800', opacity: 0.6 },
    divider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
    dividerText: { fontSize: 11, fontWeight: '800', color: '#DEE2E6', backgroundColor: '#F8F9FA', paddingHorizontal: 12, letterSpacing: 1 },
    manualForm: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#EEF2F6' },
    manualInput: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: '#E9ECEF' },
    manualInputHalf: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, fontWeight: '600', width: '48%', borderWidth: 1, borderColor: '#E9ECEF' },
    manualInputHalfSelector: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, marginBottom: 12, width: '48%', borderWidth: 1, borderColor: '#E9ECEF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addManualBtn: { backgroundColor: '#5856D6', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8, elevation: 3, shadowColor: '#5856D6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    addManualBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    saveButton: { backgroundColor: '#007AFF', borderRadius: 18, paddingVertical: 18, alignItems: 'center', elevation: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    dropdownModal: { backgroundColor: '#fff', width: '100%', borderRadius: 24, padding: 24, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
    optionText: { fontSize: 16, fontWeight: '600', color: '#495057' },
});
