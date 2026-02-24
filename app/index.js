import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <FontAwesome5 name="pills" size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.title}>MedReminder</Text>
                    <Text style={styles.subtitle}>Never miss a dose again</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.loginButton]}
                        onPress={() => router.push('/auth/login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.registerButton]}
                        onPress={() => router.push('/auth/register')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.registerButtonText}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC'
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
        paddingBottom: 48
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoCircle: {
        width: 100,
        height: 100,
        backgroundColor: '#E1E9F5',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    },
    buttonContainer: {
        width: '100%',
        gap: 16
    },
    button: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    loginButton: {
        backgroundColor: '#007AFF',
    },
    registerButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E1E4E8'
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700'
    },
    registerButtonText: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: '700'
    }
});
