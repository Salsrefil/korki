import { Tab } from '@rneui/themed';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import {FontAwesome} from "@expo/vector-icons";

const TabsLayout = () => {
  return (
    <Tabs>
        <Tabs.Screen name='homePage'
                     options={{
                         title: 'Start',
                         tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
                     }}/>
        <Tabs.Screen name="map" options={
            {
                title: 'Mapa',
                tabBarIcon: ({ color }) => <FontAwesome size={28} name="map" color={color} />,
            }
        }
        />
        <Tabs.Screen name='userProfile' options={
            {
                title: 'Profil',
                tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
            }
        }/>
    </Tabs>
  );
};

export default TabsLayout;