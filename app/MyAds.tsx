import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, BackHandler } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Card } from '@rneui/themed';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';

const MyAds = () => {
  const { from } = useLocalSearchParams(); // `from` indicates the previous view
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch ads
  const fetchAds = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('ads')
      .select(`id, title, status, subjects ( name ), scopes ( name )`)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching ads:', error);
    } else {
      setAds(data || []);
    }
    setLoading(false);
  }, []);

  // Scoped back navigation logic
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (from === 'userProfile') {
          router.replace('/userProfile'); // Navigate back to userProfile
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove(); // Clean up listener on screen blur
    }, [from, router])
  );

  // Fetch ads when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAds();
    }, [fetchAds])
  );

  // Archive ad functionality
  const handleArchiveAd = async (id) => {
    Alert.alert(
      'Potwierdzenie',
      'Czy na pewno chcesz zarchiwizować to ogłoszenie?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zarchiwizuj',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('ads')
              .update({ status: 'archive' })
              .eq('id', id);

            if (error) {
              console.error('Error archiving ad:', error);
            } else {
              fetchAds();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Text style={styles.loadingText}>Ładowanie ogłoszeń...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {ads.length > 0 ? (
        ads.map((ad) => (
          <Card containerStyle={styles.card} key={ad.id}>
            <Card.Title style={styles.titleText}>{ad.title}</Card.Title>
            <Card.Divider />
            <Text style={styles.detailText}>Przedmiot: {ad.subjects?.name || 'Brak'}</Text>
            <Text style={styles.detailText}>Zakres: {ad.scopes?.name || 'Brak'}</Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Edytuj"
                onPress={() => router.push({ pathname: '/editOffer', params: { adId: ad.id } })}
                buttonStyle={styles.editButton}
              />
              <Button
                title="Usuń"
                onPress={() => handleArchiveAd(ad.id)}
                buttonStyle={styles.deleteButton}
              />
            </View>
          </Card>
        ))
      ) : (
        <Text style={styles.noAdsText}>Brak ogłoszeń do wyświetlenia.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 16,
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    borderRadius: 5,
  },
  noAdsText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888',
    marginTop: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  },
});

export default MyAds;
