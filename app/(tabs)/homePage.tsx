import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Profile = {
  image_path: string;
};

type Subject = {
  name: string;
};

type Ad = {
  title: string;
  address: string;
  price: number;
  profiles: Profile; // Ensure this matches the Supabase relation
  subjects: Subject;
  imageUrl?: string; // For storing the generated image URL
};

const Screen = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          title,
          address,
          price,
          profiles (
            image_path
          ),
          subjects (
            name
          )
        `);
    
      if (error) {
        console.error('Error fetching ads:', error);
        setLoading(false);
        return;
      }
    
      if (data) {
        // Ensure all rows are processed
        const adsWithImages = await Promise.all(
          data.map(async (ad) => {
            const { profiles } = ad;
    
            let imageUrl: string | undefined = undefined;
            if (profiles && profiles.image_path) {
              const { data: imageUrlData } = supabase.storage
                .from('avatars') // Replace 'images' with your bucket name
                .getPublicUrl(profiles.image_path);
    
              imageUrl = imageUrlData?.publicUrl;
            }
    
            return { ...ad, imageUrl }; // Add imageUrl to the ad object
          })
        );
    
        setAds(adsWithImages);
      }
    
      setLoading(false);
    };
    

    fetchAds();
  }, []);

  const renderItem = ({ item }: { item: Ad }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.subjects.name}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{item.price} PLN</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Strona główna</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={ads}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/addOffer')}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200EE',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Screen;
