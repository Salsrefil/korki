import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Picker } from '@react-native-picker/picker';

type Profile = {
  image_path: string;
};

type Subject = {
  name: string;
};

type Category = {
  name: string;
};

type Ad = {
  id: string;
  title: string;
  address: string;
  price: number;
  profiles: Profile;
  subjects: Subject;
  scopes: Category;
  imageUrl?: string;
};

const subjects = [
  'Matematyka', 'Język obcy', 'Chemia', 'Biologia', 'Fizyka', 'Muzyka', 'Historia',
  'Plastyka', 'Informatyka', 'Geografia', 'Inne'
];

const categories = ['Szkoła Podstawowa', 'Technikum/Liceum', 'Szkoła zawodowa', 'Studia'];

const Screen = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        id,
        title,
        address,
        price,
        profiles (
          image_path
        ),
        subjects (
          name
        ),
        scopes (
          name
        )
      `);

    if (error) {
      console.error('Error fetching ads:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const adsWithImages = await Promise.all(
        data.map(async (ad) => {
          const { profiles } = ad;

          let imageUrl: string | undefined = undefined;
          if (profiles && profiles.image_path) {
            const { data: imageUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(profiles.image_path);

            imageUrl = imageUrlData?.publicUrl;
          }

          return { ...ad, imageUrl };
        })
      );
      console.log("hej")
      setAds(adsWithImages);
      setFilteredAds(adsWithImages);
    }

    setLoading(false);
  };
  const filterAds = (subject: string, category: string) => {
    let filtered = ads;
  
    if (subject && subject !== ' ') {
      filtered = filtered.filter((ad) => ad.subjects.name === subject);
    }
  
    if (category && category !== ' ') {
      filtered = filtered.filter((ad) => ad.scopes.name === category);
    }
  
    setFilteredAds(filtered);
  };
  
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    filterAds(subject, selectedCategory)
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterAds(selectedSubject, category);
  };
  

  const renderItem = ({ item }: { item: Ad }) => (
<TouchableOpacity   onPress={() => {
    console.log('Navigating to details with ID:', item.id);
    router.push({ pathname: '/adDetails', params: { id: item.id } });
  }}>
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
</TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterButton} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.filterButtonText}>Show Filters</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={filteredAds}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.floatingButton} onPress={() => router.push('/addOffer')}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Wybierz przedmiot</Text>
              <Picker selectedValue={selectedSubject} onValueChange={handleSubjectChange}>
                <Picker.Item label="Wszystkie" value=" " />
                {subjects.map((subject) => (
                  <Picker.Item key={subject} label={subject} value={subject} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Wybierz kategorię</Text>
              <Picker selectedValue={selectedCategory} onValueChange={handleCategoryChange}>
                <Picker.Item label="Wszystkie" value=" " />
                {categories.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 50,
  },
  filterButton: {
    padding: 15,
    backgroundColor: '#6200EE',
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
  },
  filterButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 100,
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
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#6200EE',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default Screen;
