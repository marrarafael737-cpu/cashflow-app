import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AuthScreen({ onAuthenticated }) {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      
      if (compatible) {
        authenticate();
      }
    })();
  }, []);

  const authenticate = async () => {
    try {
      const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
      if (!savedBiometrics) {
        return Alert.alert(
          'Biometria não encontrada',
          'Por favor, configure o FaceID/TouchID no seu aparelho.',
          [{ text: 'OK', onPress: () => onAuthenticated(true) }] // Fallback for dev
        );
      }

      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o C.A.S.H.',
        disableDeviceFallback: false,
      });

      if (biometricAuth.success) {
        onAuthenticated(true);
      } else {
        console.log('Falha na autenticação');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>C.A.S.H. Security</Text>
      <Text style={styles.subtitle}>App Financeiro</Text>
      
      <TouchableOpacity style={styles.button} onPress={authenticate}>
        <Text style={styles.buttonText}>
          {isBiometricSupported ? 'Entrar com Biometria' : 'Entrar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#00ffcc',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
