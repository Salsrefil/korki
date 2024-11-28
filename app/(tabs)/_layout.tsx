import { Tab } from '@rneui/themed';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';

const TabsLayout = () => {
  return (
    <Tabs>
        <Tabs.Screen name='homePage'/>
        <Tabs.Screen name='userProfile'/>
    </Tabs>
  );
};

export default TabsLayout;