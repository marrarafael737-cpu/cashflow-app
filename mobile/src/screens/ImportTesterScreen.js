import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import useStore from '../store/useStore';
import { parseOFX } from '../utils/ofxParser';

export default function ImportTesterScreen() {
  const addTransaction = useStore((state) => state.addTransaction);
  const transactions = useStore((state) => state.transactions);
  const [importedLog, setImportedLog] = useState([]);

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        
        // Lê o conteúdo do arquivo como string
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Tenta parsear o arquivo OFX
        const parsedTransactions = parseOFX(fileContent);

        if (parsedTransactions.length === 0) {
          Alert.alert('Erro', 'Não foi possível encontrar transações neste arquivo. Certifique-se que é um OFX válido.');
          return;
        }

        // Adiciona ao store. O addTransaction do useStore já vai passar pelo CategoryML!
        let successCount = 0;
        const tempLogs = [];
        for (const trn of parsedTransactions) {
          addTransaction(trn);
          successCount++;
          tempLogs.push(`R$ ${trn.amount.toFixed(2)} - ${trn.description}`);
        }

        setImportedLog(tempLogs);
        Alert.alert('Sucesso!', `${successCount} transações importadas e enviadas para categorização via ML.`);
      }
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      Alert.alert('Erro', 'Houve um problema ao ler o arquivo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste de Importação OFX</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleSelectFile}>
        <Text style={styles.buttonText}>Selecionar Arquivo OFX</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Log de Importação Recente ({importedLog.length}):</Text>
      <ScrollView style={styles.logContainer}>
        {importedLog.map((log, index) => (
          <Text key={index} style={styles.logText}>✅ {log}</Text>
        ))}
        {importedLog.length === 0 && (
          <Text style={styles.logTextDimmed}>Nenhuma importação feita nesta sessão.</Text>
        )}
      </ScrollView>

      <Text style={styles.subtitle}>Total no Store Global: {transactions.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#00ffcc',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  button: {
    backgroundColor: '#00ffcc',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  logTextDimmed: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
  }
});
