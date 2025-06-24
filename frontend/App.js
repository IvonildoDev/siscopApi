import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, View, Text, Dimensions, ScrollView } from 'react-native';

// Importação das telas
import HomeScreen from './screens/HomeScreen';
import OperacoesScreen from './screens/OperacoesScreen';
import MobilizacaoDesmobilizacaoScreen from './screens/MobilizacaoDesmobilizacaoScreen';
import ResumoAtividadesScreen from './screens/ResumoAtividadesScreen';
import DeslocamentoScreen from './screens/DeslocamentoScreen';
import CadastroEquipeScreen from './screens/CadastroEquipeScreen';
import RefeicaoScreen from './screens/RefeicaoScreen';
import AbastecimentoScreen from './screens/AbastecimentoScreen';
import AguardoScreen from './screens/AguardoScreen';

const Tab = createBottomTabNavigator();
const windowWidth = Dimensions.get('window').width;

// Componente personalizado para o ícone da tab com separador
function TabBarIcon({ focused, color, size, iconName }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%'
    }}>
      <Ionicons name={iconName} size={size} color={color} />
    </View>
  );
}

// Componente personalizado para o rótulo da tab
function TabBarLabel({ focused, color, children }) {
  return (
    <Text
      style={{
        fontSize: 9,
        color,
        fontWeight: focused ? 'bold' : 'normal',
        textAlign: 'center',
        marginTop: 2
      }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Operacoes') {
              iconName = focused ? 'build' : 'build-outline';
            } else if (route.name === 'MobilizacaoDesmobilizacao') {
              iconName = focused ? 'repeat' : 'repeat-outline';
            } else if (route.name === 'Deslocamento') {
              iconName = focused ? 'navigate' : 'navigate-outline';
            } else if (route.name === 'Abastecimento') {
              iconName = focused ? 'water' : 'water-outline';
            } else if (route.name === 'Aguardo') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'CadastroEquipe') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'ResumoAtividades') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'Refeicao') {
              iconName = focused ? 'restaurant' : 'restaurant-outline';
            }

            // Usa o componente personalizado
            return <TabBarIcon focused={focused} color={color} size={22} iconName={iconName} />;
          },
          tabBarLabel: ({ focused, color }) => {
            let label;
            switch (route.name) {
              case 'Home': label = 'Início'; break;
              case 'Operacoes': label = 'Operar'; break;
              case 'MobilizacaoDesmobilizacao': label = 'Mobilizar'; break;
              case 'Deslocamento': label = 'Deslocar'; break;
              case 'Abastecimento': label = 'Abastecer'; break;
              case 'Aguardo': label = 'Aguardar'; break;
              case 'CadastroEquipe': label = 'Equipe'; break;
              case 'ResumoAtividades': label = 'Resumo'; break;
              case 'Refeicao': label = 'Refeição'; break;
              default: label = route.name;
            }
            return <TabBarLabel focused={focused} color={color}>{label}</TabBarLabel>;
          },
          tabBarActiveTintColor: '#FF9800', // ou '#fff'
          tabBarInactiveTintColor: '#bbb',
          headerShown: true,
          // Estilo personalizado para toda a barra
          tabBarStyle: {
            height: 80,
            paddingTop: 8,
            paddingBottom: 8,
            borderTopWidth: 1,
            borderTopColor: '#111', // linha superior mais escura
            backgroundColor: '#222', // <-- cor escura para a tab bar
            // Distribuição uniforme em toda a largura da tela
            paddingHorizontal: 0,
            justifyContent: 'space-between',
            alignItems: 'center'
          },
          // Estilo personalizado para cada item da tab
          tabBarItemStyle: {
            // Ocupar igual espaço e distribuir uniformemente
            flex: 1,
            marginHorizontal: 1, // Reduzido para caber mais botões
            paddingVertical: 4,
            borderRadius: 8,
            // Remover tamanho máximo para permitir distribuição igual
            maxWidth: undefined,
            // Diminuir a borda para um visual mais clean
            borderWidth: 0.5,
            borderColor: '#e0e0e0',
          },
          // Estilo para quando a tab está ativa
          tabBarActiveBackgroundColor: '#E8F5E9',
          // Com label na barra
          tabBarShowLabel: true,
          // Habilitando rolagem na barra
          tabBarScrollEnabled: true,
        })}
        tabBarOptions={{
          scrollEnabled: true,
        }}
      >
        {/* Linha 1 de botões */}
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Início"
          }}
        />
        <Tab.Screen
          name="Operacoes"
          component={OperacoesScreen}
          options={{
            title: "Operações"
          }}
        />
        <Tab.Screen
          name="MobilizacaoDesmobilizacao"
          component={MobilizacaoDesmobilizacaoScreen}
          options={{
            title: "Mobilização"
          }}
        />

        {/* Linha 2 de botões */}
        <Tab.Screen
          name="Deslocamento"
          component={DeslocamentoScreen}
          options={{
            title: "Deslocamento"
          }}
        />
        <Tab.Screen
          name="Abastecimento"
          component={AbastecimentoScreen}
          options={{
            title: "Abastecimento"
          }}
        />
        <Tab.Screen
          name="Aguardo"
          component={AguardoScreen}
          options={{
            title: "Aguardo"
          }}
        />

        {/* Botões adicionados - agora visíveis */}
        <Tab.Screen
          name="CadastroEquipe"
          component={CadastroEquipeScreen}
          options={{
            title: "Cadastro de Equipe"
          }}
        />
        <Tab.Screen
          name="ResumoAtividades"
          component={ResumoAtividadesScreen}
          options={{
            title: "Resumo de Atividades"
          }}
        />
        <Tab.Screen
          name="Refeicao"
          component={RefeicaoScreen}
          options={{
            title: "Refeições"
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
