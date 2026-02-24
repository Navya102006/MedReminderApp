import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const anim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);

    const show = useCallback((message, type = 'info', duration = 3000) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast({ message, type });
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
        timerRef.current = setTimeout(() => {
            Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
        }, duration);
    }, [anim]);

    const showSuccess = useCallback((msg) => show(msg, 'success'), [show]);
    const showError = useCallback((msg) => show(msg, 'error'), [show]);
    const showInfo = useCallback((msg) => show(msg, 'info'), [show]);

    const iconMap = { success: 'check-circle', error: 'error', info: 'info' };
    const colorMap = { success: '#16A34A', error: '#DC2626', info: '#2563EB' };
    const bgMap = { success: '#F0FDF4', error: '#FEF2F2', info: '#EFF6FF' };

    return (
        <ToastContext.Provider value={{ show, showSuccess, showError, showInfo }}>
            {children}
            {toast && (
                <Animated.View style={[
                    styles.toast,
                    { backgroundColor: bgMap[toast.type], borderColor: colorMap[toast.type] },
                    { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }
                ]}>
                    <MaterialIcons name={iconMap[toast.type]} size={20} color={colorMap[toast.type]} />
                    <Text style={[styles.toastText, { color: colorMap[toast.type] }]}>{toast.message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 60,
        left: 16,
        right: 16,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
});
