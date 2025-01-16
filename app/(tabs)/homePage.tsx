import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Image, Modal, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';

const subjects = [
  'Matematyka', 'Język obcy', 'Chemia', 'Biologia', 'Fizyka', 'Muzyka', 'Historia',
  'Plastyka', 'Informatyka', 'Geografia', 'Inne'
];

const categories = ['Szkoła Podstawowa', 'Technikum/Liceum', 'Szkoła zawodowa', 'Studia'];

const Screen = () => {
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [isInPerson, setIsInPerson] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(null);
  const [minRating, setMinRating] = useState(null);
  const [minReviewCount, setMinReviewCount] = useState(null);

  useEffect(() => {
    fetchAds();
    fetchUserLocation();
  }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        id, title, address, price, latitude, longitude, isRemote, isInPerson, 
        profiles (image_path), subjects (name), scopes (name),
        reviews:reviews(ad_id, rating)
      `);

    if (error) {
      console.error('Error fetching ads:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const adsWithReviews = await Promise.all(
        data.map(async (ad) => {
          const reviews = ad.reviews || [];
          const averageRating =
            reviews.length > 0
              ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
              : null;
          const reviewCount = reviews.length;

          // Pobierz publiczny URL dla obrazu
          let imageUrl = undefined;
          if (ad.profiles?.image_path) {
            const { data: imageUrlData } = supabase.storage.from('avatars').getPublicUrl(ad.profiles.image_path);
            imageUrl = imageUrlData?.publicUrl;
          }

          return { ...ad, averageRating, reviewCount, imageUrl };
        })
      );

      setAds(adsWithReviews);
      setFilteredAds(adsWithReviews);
    }

    setLoading(false);
  };

  const fetchUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setCurrentLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterAds = (subject, category, distance, remote, inPerson, minRating, minReviewCount) => {
    let filtered = ads;

    if (subject && subject !== ' ') {
      filtered = filtered.filter((ad) => ad.subjects.name === subject);
    }

    if (category && category !== ' ') {
      filtered = filtered.filter((ad) => ad.scopes.name === category);
    }

    if (distance && currentLocation) {
      filtered = filtered.filter(
        (ad) =>
          calculateDistance(ad.latitude, ad.longitude, currentLocation.latitude, currentLocation.longitude) <= distance
      );
    }

    if (remote) {
      filtered = filtered.filter((ad) => ad.isRemote);
    }

    if (inPerson) {
      filtered = filtered.filter((ad) => ad.isInPerson);
    }

    if (minRating) {
      filtered = filtered.filter((ad) => ad.averageRating >= minRating);
    }

    if (minReviewCount) {
      filtered = filtered.filter((ad) => ad.reviewCount >= minReviewCount);
    }

    setFilteredAds(filtered);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    filterAds(subject, selectedCategory, maxDistance, isRemote, isInPerson, minRating, minReviewCount);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterAds(selectedSubject, category, maxDistance, isRemote, isInPerson, minRating, minReviewCount);
  };

  const handleDistanceChange = (distance) => {
    const distanceValue = parseFloat(distance);
    setMaxDistance(isNaN(distanceValue) ? null : distanceValue);
    filterAds(selectedSubject, selectedCategory, distanceValue, isRemote, isInPerson, minRating, minReviewCount);
  };

  const handleRatingChange = (rating) => {
    const ratingValue = parseFloat(rating);
    setMinRating(isNaN(ratingValue) ? null : ratingValue);
    filterAds(selectedSubject, selectedCategory, maxDistance, isRemote, isInPerson, ratingValue, minReviewCount);
  };

  const handleReviewCountChange = (count) => {
    const countValue = parseInt(count);
    setMinReviewCount(isNaN(countValue) ? null : countValue);
    filterAds(selectedSubject, selectedCategory, maxDistance, isRemote, isInPerson, minRating, countValue);
  };

  const handleRemoteChange = () => {
    const newValue = !isRemote;
    setIsRemote(newValue);
    filterAds(selectedSubject, selectedCategory, maxDistance, newValue, isInPerson, minRating, minReviewCount);
  };

  const handleInPersonChange = () => {
    const newValue = !isInPerson;
    setIsInPerson(newValue);
    filterAds(selectedSubject, selectedCategory, maxDistance, isRemote, newValue, minRating, minReviewCount);
  };

  const clearFilters = () => {
    setSelectedSubject('');
    setSelectedCategory('');
    setMaxDistance(null);
    setIsRemote(false);
    setIsInPerson(false);
    setMinRating(null);
    setMinReviewCount(null);
    setFilteredAds(ads); // Resetowanie filtrów
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterButton} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.filterButtonText}>Filtry</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={filteredAds}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                console.log('Navigating to details with ID:', item.id);
                router.push({ pathname: '/adDetails', params: { id: item.id } });
              }}
            >
              <View style={styles.card}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.textContainer}>
                  <Text style={styles.name}>{item.subjects.name}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.price}>{item.price} PLN</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
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
      <ScrollView>
        <Text style={styles.modalTitle}>Filtry</Text>

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

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Maksymalny dystans (km)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Podaj dystans w km"
            onChangeText={handleDistanceChange}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Minimalna ocena (1-5)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Wprowadź minimalną ocenę"
            onChangeText={handleRatingChange}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Minimalna liczba opinii</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Wprowadź minimalną liczbę opinii"
            onChangeText={handleReviewCountChange}
          />
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Zdalne</Text>
            <Switch value={isRemote} onValueChange={handleRemoteChange} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Stacjonarne</Text>
            <Switch value={isInPerson} onValueChange={handleInPersonChange} />
          </View>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Wyczyść filtry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
          <Text style={styles.closeButtonText}>Zamknij</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 10,
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
    padding: 10,
    marginVertical: 9,
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
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  switchContainer: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  clearButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
  },

  
});

export default Screen;
