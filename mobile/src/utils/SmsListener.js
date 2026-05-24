import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Solicita as permissões necessárias de SMS no Android.
 */
export async function requestSmsPermission() {
  if (Platform.OS !== 'android') return false;

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);

    return (
      granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.warn(err);
    return false;
  }
}

/**
 * Inicia o listener de SMS.
 * (Nota: Em um ambiente React Native puro, usaríamos uma biblioteca como react-native-get-sms-android
 * ou react-native-sms-listener. No Expo, isso requer configuração de plugin nativo/Prebuild).
 */
export function startSmsListener(onSmsReceived) {
  if (Platform.OS !== 'android') {
    console.log('Leitura automática de SMS não suportada neste SO.');
    return;
  }

  // TODO: Conectar com o módulo nativo após a configuração do Prebuild
  // Exemplo de funcionamento:
  // SmsListener.addListener(message => {
  //   if (message.originatingAddress.includes('NUBANK')) {
  //       const transacao = parseNubankSms(message.body);
  //       onSmsReceived(transacao);
  //   }
  // });
  
  console.log('SMS Listener inicializado (Modo Preparatório).');
}

/**
 * Utilitário de conversão de texto (Smart Parser legado) adaptado.
 */
export function parseSmsText(text) {
  // Lógica importada do seu smart-parser.js
  const valueMatch = text.match(/R\$\s?(\d+[.,]\d{2})/);
  if (valueMatch) {
    return {
      value: parseFloat(valueMatch[1].replace(',', '.')),
      raw: text,
      date: new Date().toISOString()
    };
  }
  return null;
}
