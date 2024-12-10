import React, { useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View, Alert } from 'react-native';
import { supabase } from '../../lib/supabase'; 

type Location = {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  price: number;
};

export default function MapScreen() {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, latitude, longitude, title, price');

      if (error) {
        throw error;
      }

      const validLocations = data.filter(
        (item: any) => item.latitude && item.longitude
      );

      setLocations(validLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to fetch locations from the database.');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 52.237049,
          longitude: 19.017532,
          latitudeDelta: 8,
          longitudeDelta: 8,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={location.title}
            description={`Cena: $${location.price}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
