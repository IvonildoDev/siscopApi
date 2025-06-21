import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Importe as telas
import CadastroEquipeScreen from './screens/CadastroEquipeScreen';
import HomeScreen from './screens/HomeScreen';
import DeslocamentoScreen from './screens/DeslocamentoScreen';
import OperacoesScreen from './screens/OperacoesScreen';
import AbastecimentoScreen from './screens/AbastecimentoScreen';
import AguardoScreen from './screens/AguardoScreen';
import RefeicaoScreen from './screens/RefeicaoScreen'; // Adicione esta linha
import ResumoAtividadesScreen from './screens/ResumoAtividadesScreen';

// Crie o navegador de tabs
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            // Atualize a lógica que define os ícones para incluir Refeição
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Cadastro') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Deslocamento') {
              iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
            } else if (route.name === 'Operacoes') {
              iconName = focused ? 'build' : 'build-outline';
            } else if (route.name === 'Aguardo') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Abastecimento') {
              iconName = focused ? 'water' : 'water-outline';
            } else if (route.name === 'Refeicao') {
              iconName = focused ? 'restaurant' : 'restaurant-outline';
            } else if (route.name === 'Resumo') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Cadastro"
          component={CadastroEquipeScreen}
          options={{ title: 'Cadastro de Equipe' }}
        />
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'SISCOP' }}
        />
        <Tab.Screen
          name="Deslocamento"
          component={DeslocamentoScreen}
          options={{ title: 'Deslocamento' }}
        />
        <Tab.Screen
          name="Operacoes"
          component={OperacoesScreen}
          options={{
            title: 'Operações'
          }}
        />
        <Tab.Screen
          name="Aguardo"
          component={AguardoScreen}
          options={{
            title: 'Aguardo',
            tabBarIcon: ({ focused, color, size }) => {
              return <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={size}
                color={color}
              />;
            }
          }}
        />
        <Tab.Screen
          name="Abastecimento"
          component={AbastecimentoScreen}
          options={{
            title: 'Abastecimento',
            tabBarIcon: ({ focused, color, size }) => {
              return <Ionicons
                name={focused ? 'water' : 'water-outline'}
                size={size}
                color={color}
              />;
            }
          }}
        />
        <Tab.Screen
          name="Refeicao"
          component={RefeicaoScreen}
          options={{
            title: 'Refeição',
            tabBarIcon: ({ focused, color, size }) => {
              return <Ionicons
                name={focused ? 'restaurant' : 'restaurant-outline'}
                size={size}
                color={color}
              />;
            }
          }}
        />
        <Tab.Screen
          name="Resumo"
          component={ResumoAtividadesScreen}
          options={{
            title: 'Resumo de Atividades',
            tabBarIcon: ({ focused, color, size }) => {
              return <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={size}
                color={color}
              />;
            }
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Adicione isso no seu arquivo index.js ou App.js principal
if (!String.prototype.safeTrim) {
  String.prototype.safeTrim = function () {
    return this ? this.trim() : '';
  };
}
