import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves the Flask backend URL.
 *
 * - On Web   → uses localhost (same machine)
 * - On Mobile → extracts the Metro bundler host (same machine running Flask)
 *   so the app works on any network without hardcoding an IP address.
 */
const getBackendUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000';
    }
    // expo-constants exposes the Metro server host during development.
    // e.g. "192.168.0.107:8081"  →  we extract "192.168.0.107"
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost ?? '';
    const host = hostUri.split(':')[0] || 'localhost';
    return `http://${host}:5000`;
};

export const BACKEND_URL = getBackendUrl();
