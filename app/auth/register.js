import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [caretakerEmail, setCaretakerEmail] = useState('');

    const handleRegister = async () => {
        if (!email.trim() || !password.trim() || !caretakerEmail.trim()) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        try {
            const userData = { email, password, caretakerEmail };
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save user data.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Sign up to get started</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="User Email"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Caretaker Email"
                        placeholderTextColor="#999"
                        value={caretakerEmail}
                        onChangeText={setCaretakerEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleRegister} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FC' },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
    inputContainer: { marginBottom: 24 },
    input: { backgroundColor: '#FFFFFF', height: 56, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#E1E4E8', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    button: { backgroundColor: '#007AFF', height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: 12, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 16 },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    linkButton: { alignItems: 'center', padding: 10 },
    linkText: { color: '#007AFF', fontSize: 14, fontWeight: '600' }
});
