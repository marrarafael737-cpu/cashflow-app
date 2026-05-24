import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import ImportTesterScreen from './screens/ImportTesterScreen';

const Tab = createBottomTabNavigator();

function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard - Em Breve</Text>
    </View>
  );
}

function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Transações - Em Breve</Text>
    </View>
  );
}

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#00ffcc',
          tabBarStyle: { backgroundColor: '#111', borderTopWidth: 0 },
          tabBarActiveTintColor: '#00ffcc',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Transações" component={TransactionsScreen} />
        <Tab.Screen name="Teste OFX" component={ImportTesterScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  text: {
    color: '#00ffcc',
    fontSize: 20,
  }
});
