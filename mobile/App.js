import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigation from './src/AppNavigation';
import { requestSmsPermission, startSmsListener } from './src/utils/SmsListener';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Configura o interceptador de SMS silenciosamente no fundo ao abrir o App
    const setupSms = async () => {
      const hasPermission = await requestSmsPermission();
      if (hasPermission) {
        startSmsListener((transacao) => {
          console.log('Nova transação via SMS:', transacao);
          // TODO: Enviar para Zustand / Supabase
        });
      }
    };
    setupSms();
  }, []);

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={setIsAuthenticated} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigation />
    </>
  );
}
