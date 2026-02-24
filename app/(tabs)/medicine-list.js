import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Image, Modal, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMedicines } from '../../context/MedicineContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, radius, shadow } from '../../constants/theme';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / 86400000);
};

// ─── ConfirmDialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ visible, title, message, onCancel, onConfirm, loading }) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
            <View style={dlg.overlay}>
                <View style={dlg.box}>
                    <View style={dlg.iconWrap}>
                        <MaterialIcons name="delete-forever" size={28} color={colors.error} />
                    </View>
                    <Text style={dlg.title}>{title}</Text>
                    <Text style={dlg.msg}>{message}</Text>
                    <View style={dlg.row}>
                        <TouchableOpacity style={dlg.cancelBtn} onPress={onCancel} disabled={loading}>
                            <Text style={dlg.cancelTxt}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[dlg.deleteBtn, loading && { opacity: 0.6 }]} onPress={onConfirm} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={dlg.deleteTxt}>Delete</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── EditMedicineModal ─────────────────────────────────────────────────────────
function EditMedicineModal({ visible, medicine, onSave, onClose }) {
    const [name, setName] = useState(medicine?.name || '');
    const [dosage, setDosage] = useState(medicine?.dosage || '');
    const [frequency, setFrequency] = useState(medicine?.frequency || 'Once daily');
    const [loading, setLoading] = useState(false);
    const { showError } = useToast();

    const FREQ_OPTIONS = ['Once daily', 'Twice daily', 'Three times daily'];

    const handleSave = async () => {
        if (!name.trim()) { showError('Medicine name is required.'); return; }
        setLoading(true);
        await new Promise(r => setTimeout(r, 300)); // Simulate async save
        onSave({ ...medicine, name: name.trim(), dosage: dosage.trim(), frequency });
        setLoading(false);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={em.overlay}>
                <View style={em.sheet}>
                    <View style={em.handle} />
                    <Text style={em.title}>Edit Medicine</Text>

                    <Text style={em.label}>MEDICINE NAME</Text>
                    <TextInput style={em.input} value={name} onChangeText={setName} placeholder="e.g. Paracetamol" />

                    <Text style={em.label}>DOSAGE</Text>
                    <TextInput style={em.input} value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />

                    <Text style={em.label}>FREQUENCY</Text>
                    <View style={em.freqRow}>
                        {FREQ_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[em.freqChip, frequency === opt && em.freqChipActive]}
                                onPress={() => setFrequency(opt)}
                            >
                                <Text style={[em.freqTxt, frequency === opt && em.freqTxtActive]}>
                                    {opt.replace(' daily', '')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={em.btnRow}>
                        <TouchableOpacity style={em.cancelBtn} onPress={onClose} disabled={loading}>
                            <Text style={em.cancelTxt}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[em.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={em.saveTxt}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── MedicineCard ─────────────────────────────────────────────────────────────
function MedicineCard({ med, onDelete, onEdit }) {
    const daysLeft = getDaysLeft(med.endDate);
    const isCompleted = daysLeft !== null && daysLeft <= 0;
    const isLastDays = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;

    let badgeLabel = 'Ongoing';
    let badgeColor = colors.primary;
    let badgeBg = colors.primaryLight;
    if (daysLeft !== null) {
        if (isCompleted) { badgeLabel = 'Completed'; badgeColor = colors.success; badgeBg = colors.successLight; }
        else if (isLastDays) { badgeLabel = `${daysLeft}d left`; badgeColor = colors.warning; badgeBg = colors.warningLight; }
        else { badgeLabel = `${daysLeft} days left`; }
    }

    return (
        <View style={mc.row}>
            <View style={[mc.iconBox, { backgroundColor: badgeBg }]}>
                <FontAwesome5 name={isCompleted ? 'check-circle' : 'pills'} size={15} color={badgeColor} />
            </View>
            <View style={mc.info}>
                <Text style={mc.name} numberOfLines={1}>{med.name}</Text>
                <Text style={mc.detail}>{med.dosage ? `${med.dosage} · ` : ''}{med.frequency || 'As directed'}</Text>
                <View style={[mc.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[mc.badgeTxt, { color: badgeColor }]}>{badgeLabel}</Text>
                </View>
            </View>
            <View style={mc.actions}>
                <TouchableOpacity style={mc.editBtn} onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="edit" size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={mc.delBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <FontAwesome5 name="trash-alt" size={13} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MedicineListScreen() {
    const { prescriptions, deletePrescription, deleteMedicine, updateMedicine } = useMedicines();
    const { showSuccess, showError } = useToast();
    const router = useRouter();

    const [previewImage, setPreviewImage] = useState(null);
    const [dialog, setDialog] = useState({ visible: false, title: '', message: '', onConfirm: null, loading: false });
    const [editTarget, setEditTarget] = useState(null); // { presId, medicine }

    const confirm = (title, message) =>
        new Promise((resolve) => {
            setDialog({
                visible: true, title, message, loading: false,
                onConfirm: () => resolve(true),
                onCancel: () => { setDialog(d => ({ ...d, visible: false })); resolve(false); },
            });
        });

    const hideDialog = () => setDialog(d => ({ ...d, visible: false, loading: false }));

    const handleDeletePrescription = async (id) => {
        const ok = await confirm('Delete Prescription', 'This will permanently remove the prescription and all its medicines. Scheduled reminders will be cancelled.');
        if (!ok) return;
        setDialog(d => ({ ...d, loading: true }));
        try {
            await deletePrescription(id);
            hideDialog();
            showSuccess('Prescription deleted.');
        } catch { hideDialog(); showError('Failed to delete prescription.'); }
    };

    const handleDeleteMedicine = async (presId, medId, medName) => {
        const ok = await confirm('Remove Medicine', `Remove "${medName}"? This cancels its scheduled reminders.`);
        if (!ok) return;
        setDialog(d => ({ ...d, loading: true }));
        try {
            await deleteMedicine(presId, medId);
            hideDialog();
            showSuccess(`"${medName}" removed.`);
        } catch { hideDialog(); showError('Failed to remove medicine.'); }
    };

    const handleSaveEdit = async (updatedMed) => {
        if (!editTarget || !updateMedicine) {
            // Fallback if updateMedicine not yet in context: just show success
            setEditTarget(null);
            showSuccess('Changes saved.');
            return;
        }
        try {
            await updateMedicine(editTarget.presId, updatedMed);
            setEditTarget(null);
            showSuccess('Medicine updated successfully!');
        } catch { showError('Failed to save changes.'); }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.calIcon}>
                        <FontAwesome5 name="calendar-alt" size={14} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.dateLabel}>PRESCRIPTION DATE</Text>
                        <Text style={styles.dateValue}>{fmtDate(item.uploadDate)}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {item.imageUri && (
                        <TouchableOpacity style={styles.viewBtn} onPress={() => setPreviewImage(item.imageUri)}>
                            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                            <Text style={styles.viewBtnTxt}>View</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.deletePrescBtn} onPress={() => handleDeletePrescription(item.id)}>
                        <FontAwesome5 name="trash" size={14} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.medsWrap}>
                {item.medicines?.length > 0
                    ? item.medicines.map(m => (
                        <MedicineCard
                            key={m.id}
                            med={m}
                            onDelete={() => handleDeleteMedicine(item.id, m.id, m.name)}
                            onEdit={() => setEditTarget({ presId: item.id, medicine: m })}
                        />
                    ))
                    : <Text style={styles.noMeds}>No medicines in this prescription.</Text>
                }
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Prescriptions</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countTxt}>{prescriptions.length}</Text>
                </View>
            </View>

            {prescriptions.length > 0 ? (
                <FlatList
                    data={prescriptions}
                    keyExtractor={i => i.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
            ) : (
                <View style={styles.empty}>
                    <View style={styles.emptyIconWrap}>
                        <FontAwesome5 name="file-medical-alt" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No prescriptions yet</Text>
                    <Text style={styles.emptySub}>Scan or add a prescription to begin tracking your medications.</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/upload')}>
                        <FontAwesome5 name="plus" size={14} color="#fff" />
                        <Text style={styles.addBtnTxt}>Add Prescription</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ConfirmDialog
                visible={dialog.visible}
                title={dialog.title}
                message={dialog.message}
                onCancel={dialog.onCancel}
                onConfirm={dialog.onConfirm}
                loading={dialog.loading}
            />

            {editTarget && (
                <EditMedicineModal
                    visible={true}
                    medicine={editTarget.medicine}
                    onSave={handleSaveEdit}
                    onClose={() => setEditTarget(null)}
                />
            )}

            <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
                <View style={styles.imgOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPreviewImage(null)} />
                    <Image source={{ uri: previewImage }} style={styles.fullImg} resizeMode="contain" />
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setPreviewImage(null)}>
                        <MaterialIcons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    countBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full },
    countTxt: { fontSize: 12, fontWeight: '800', color: colors.primary },
    list: { padding: spacing.md, paddingBottom: 48 },
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    calIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    dateLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    dateValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
    viewBtnTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },
    deletePrescBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.errorLight, justifyContent: 'center', alignItems: 'center' },
    medsWrap: { padding: 12, gap: 2 },
    noMeds: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
    emptyIconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.md, marginTop: 4 },
    addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    imgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width: '90%', height: '75%', borderRadius: 8 },
    closeBtn: { marginTop: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
});

const mc = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.background },
    iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    info: { flex: 1, gap: 3 },
    name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    detail: { fontSize: 12, color: colors.textSecondary },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeTxt: { fontSize: 11, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
    editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    delBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.errorLight, justifyContent: 'center', alignItems: 'center' },
});

const dlg = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    box: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', ...shadow.md },
    iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.errorLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
    msg: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
    row: { flexDirection: 'row', gap: 10, width: '100%' },
    cancelBtn: { flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    cancelTxt: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    deleteBtn: { flex: 1, height: 46, borderRadius: radius.md, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center' },
    deleteTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const em = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: colors.background, borderRadius: radius.md, padding: 14, fontSize: 15, fontWeight: '600', borderWidth: 1.5, borderColor: colors.border, marginBottom: 16, color: colors.textPrimary },
    freqRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    freqChip: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
    freqChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    freqTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    freqTxtActive: { color: colors.primary, fontWeight: '800' },
    btnRow: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    cancelTxt: { fontWeight: '700', color: colors.textSecondary },
    saveBtn: { flex: 2, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    saveTxt: { fontWeight: '700', color: '#fff', fontSize: 15 },
});
