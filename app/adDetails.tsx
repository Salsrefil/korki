import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

const AdDetails = () => {
  const { id } = useLocalSearchParams(); // Retrieve 'id' from search params
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdDetails = async () => {
        console.log('Fetching ad details for ID:', id);
      
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('id', id)
          .single();
      
        if (error) {
          console.error('Error fetching ad details:', error);
        } else {
          console.log('Fetched ad data:', data);
        }
      
        setAd(data);
        setLoading(false);
      };
    fetchAdDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={styles.container}>
        <Text>Nie znaleziono ogłoszenia.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{ad.title}</Text>
      <Text style={styles.price}>{ad.price} PLN</Text>
      <Text style={styles.description}>{ad.description}</Text>
      <Text style={styles.contact}>Kontakt: {ad.contact_info}</Text>
      <Text style={styles.address}>Adres: {ad.address}</Text>
      <Text style={styles.status}>Status: {ad.status}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  contact: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
  },
});

export default AdDetails;
