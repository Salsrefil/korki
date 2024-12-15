import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase';

const AdDetails = () => {
  const { id } = useLocalSearchParams();
  const [ad, setAd] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdDetails = async () => {
      if (!id) {
        console.error('No ID provided!');
        setLoading(false);
        return;
      }

      // Pobranie szczegółów ogłoszenia
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

      if (adError) {
        console.error('Error fetching ad details:', adError);
        setLoading(false);
        return;
      }

      setAd(adData);

      // Pobranie danych użytkownika
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name, last_name, image_path')
        .eq('id', adData.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user details:', userError);
      } else {
        setUser(userData);

        // Pobranie obrazu użytkownika
        if (userData.image_path) {
          downloadImage(userData.image_path);
        }
      }

      setLoading(false);
    };

    const downloadImage = async (path: string) => {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path);

        if (error) {
          throw error;
        }

        const fr = new FileReader();
        fr.readAsDataURL(data);
        fr.onload = () => {
          setAvatarUrl(fr.result as string); // Ustawienie URL w Base64
        };
      } catch (error) {
        console.error('Error downloading image:', error.message);
      }
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

  if (!ad || !user) {
    return (
      <View style={styles.container}>
        <Text>Ogłoszenie lub użytkownik nie został znaleziony.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Sekcja użytkownika */}
      <TouchableOpacity
        style={styles.userContainer}
        onPress={() => router.push({ pathname: '/profile', params: { userId: ad.user_id } })}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.userImage}
          />
        ) : (
          <View style={styles.noImage} />
        )}
        <Text style={styles.userName}>{user.name} {user.last_name}</Text>
      </TouchableOpacity>

      {/* Reszta treści ogłoszenia */}
      <View style={styles.header}>
        <Text style={styles.title}>{ad.title}</Text>
        <Text style={styles.price}>{ad.price} zł / 60min</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opis</Text>
        <Text>{ad.description}</Text>
      </View>

            {/* Kontakt */}
            <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontakt</Text>
        <Text style={styles.contact}>{ad.contact_info}</Text>
      </View>

      {/* Adres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adres</Text>
        <Text style={styles.address}>{ad.address}</Text>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.status}>{ad.status}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  noImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#CCC',
    marginRight: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 20,
    color: '#6200EE',
    marginVertical: 10,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 10,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default AdDetails;