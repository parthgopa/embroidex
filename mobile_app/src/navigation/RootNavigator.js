import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ChatbotModal from '../screens/ChatbotModal';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SellerRegisterScreen from '../screens/SellerRegisterScreen';
import SellerUploadScreen from '../screens/SellerUploadScreen';
import SellerEarningsScreen from '../screens/SellerEarningsScreen';
import DesignDetailScreen from '../screens/DesignDetailScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Auth Screens */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />

      {/* Seller Screens */}
      <Stack.Screen name="SellerRegisterScreen" component={SellerRegisterScreen} />
      <Stack.Screen name="SellerUploadScreen" component={SellerUploadScreen} />
      <Stack.Screen name="SellerEarningsScreen" component={SellerEarningsScreen} />

      {/* Modals */}
      <Stack.Screen
        name="ChatbotModal"
        component={ChatbotModal}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Design Detail */}
      <Stack.Screen
        name="DesignDetailScreen"
        component={DesignDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
