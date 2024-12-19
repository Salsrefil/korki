import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';

interface ProfileData {
  name: string;
  last_name: string;
  description: string;
  image_path: string;
}

interface OfferData {
  id: string;
  title: string;
  subject_id: string;
}

// Subject names array
const subjects = [
  'Matematyka',
  'Język obcy',
  'Chemia',
  'Biologia',
  'Fizyka',
  'Muzyka',
  'Historia',
  'Plastyka',
  'Informatyka',
  'Geografia',
  'Inne',
];

const Profile = () => {
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, last_name, description, image_path')
          .eq('id', userId)
          .single();

        if (error) throw error;

        setProfile(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const fetchOffers = async () => {
      try {
        const { data, error } = await supabase
        .from('ads')
        .select('id, title, subject_id')
        .eq('user_id', userId)
        .or('status.is.null,status.neq.archive');

        if (error) throw error;

        setOffers(data || []);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchProfile();
    fetchOffers();
  }, [userId]);

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const getSubjectName = (subjectId: string) => {
    const index = parseInt(subjectId, 10) - 1; 
    return subjects[index] || 'Unknown Subject'; 
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {profile?.image_path && (
          <Image
            source={{ uri: getImageUrl(profile.image_path) }}
            style={styles.profileImage}
            resizeMode="contain"
          />
        )}

        <Text style={styles.headerText}>Profil</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imię</Text>
          <Text style={styles.sectionValue}>{profile?.name}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nazwisko</Text>
          <Text style={styles.sectionValue}>{profile?.last_name}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opis</Text>
          <Text style={styles.sectionValue}>{profile?.description}</Text>
        </View>
      </View>

      <Text style={styles.offersHeader}>Oferty użytkownika</Text>
      <FlatList
        data={offers}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              router.push({ pathname: '/adDetails', params: { id: item.id } });
            }}
          >
            <View style={styles.offerItem}>
              <Text style={styles.offerTitle}>{item.title}</Text>
              <Text style={styles.offerSubject}>Przedmiot: {getSubjectName(item.subject_id)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.noOffersText}>No offers available.</Text>}
        style={styles.offersList}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  sectionValue: {
    fontSize: 18,
    color: '#222',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
    width: '100%',
  },
  offersHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start',
  },
  offersList: {
    width: '100%',
  },
  offerItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  offerSubject: {
    fontSize: 16,
    color: '#555',
  },
  noOffersText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Profile;
