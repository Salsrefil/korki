import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';

const editOffer = () => {
  const router = useRouter();
  const { adId } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isAddressUpdated, setIsAddressUpdated] = useState(false);

  const categories = ['Szkoła Podstawowa', 'Technikum/Liceum', 'Szkoła zawodowa', 'Studia'];
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

  useEffect(() => {
    const loadAdData = async () => {
      const { data, error } = await supabase.from('ads').select('*').eq('id', adId).single();
      if (error) {
        console.error('Error loading ad data:', error);
        return;
      }
      setTitle(data.title);
      setPrice(data.price.toString());
      setAddress(data.address || '');
      setPhoneNumber(data.contact_info || '');
      setDescription(data.description || '');
      setSelectedCategory(categories[data.scope_id - 1] || null);
      setSelectedSubject(subjects[data.subject_id - 1] || null);
      setLatitude(data.latitude);
      setLongitude(data.longitude);
    };

    loadAdData();
  }, [adId]);

  const geocodeAddress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to geocode the address.');
        return;
      }

      const locationResults = await Location.geocodeAsync(address);
      if (locationResults.length > 0) {
        const { latitude, longitude } = locationResults[0];
        setLatitude(latitude);
        setLongitude(longitude);
      } else {
        Alert.alert('Błąd', 'Nie udało się ustalić lokalizacji dla podanego adresu.');
      }
    } catch (error) {
      console.error('Geocoding Error:', error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas ustalania lokalizacji.');
    }
  };

  const handleSave = async () => {
    if (isAddressUpdated && address) {
      await geocodeAddress();
    }

    if (!title || !price || !phoneNumber || !description || !selectedCategory || !selectedSubject) {
      Alert.alert('Błąd', 'Wszystkie pola muszą być uzupełnione!');
      return;
    }

    let selectedCategoryId = categories.indexOf(selectedCategory || '') + 1;
    let selectedSubjectId = subjects.indexOf(selectedSubject || '') + 1;

    const updatedData = {
      title,
      price: parseFloat(price),
      address,
      contact_info: phoneNumber,
      description,
      scope_id: selectedCategoryId,
      subject_id: selectedSubjectId,
      latitude: latitude || null,
      longitude: longitude || null,
    };

    const { error } = await supabase.from('ads').update(updatedData).eq('id', adId);
    if (error) {
      console.error('Error updating ad:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać zmian.');
    } else {
      Alert.alert('Sukces', 'Ogłoszenie zostało zaktualizowane.');
      router.replace({ pathname: '/MyAds', params: { from: 'userProfile' } });;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={{ padding: 20, paddingBottom: 20 }}>
        <Text style={styles.header}>Edytuj ogłoszenie:</Text>

        <View style={styles.formGroup}>
          <Picker selectedValue={selectedCategory} onValueChange={(itemValue) => setSelectedCategory(itemValue)} style={styles.picker}>
            <Picker.Item label="Wybierz szkołę" value={null} />
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <View style={styles.formGroup}>
          <Picker selectedValue={selectedSubject} onValueChange={(itemValue) => setSelectedSubject(itemValue)} style={styles.picker}>
            <Picker.Item label="Wybierz przedmiot" value={null} />
            {subjects.map((subject, index) => (
              <Picker.Item key={index} label={subject} value={subject} />
            ))}
          </Picker>
        </View>

        <View style={styles.formGroup}>
          <Input label="Tytuł oferty" onChangeText={(text) => setTitle(text)} value={title} />
        </View>

        <View style={styles.formGroup}>
          <Input label="Cena (zł / 60 min)" onChangeText={setPrice} value={price} keyboardType="phone-pad" />
        </View>

        <View style={styles.formGroup}>
          <Input
            label="Adres"
            onChangeText={(text) => {
              setAddress(text);
              setIsAddressUpdated(true);
            }}
            value={address}
          />
        </View>

        <View style={styles.formGroup}>
          <Input
            label="Kontakt"
            onChangeText={(text) => setPhoneNumber(text)}
            value={phoneNumber}
            placeholder="Tu podaj dane kontaktowe"
            multiline
            numberOfLines={6}
            style={styles.textareaSmall}
            scrollEnabled
          />
        </View>

        <View style={styles.formGroup}>
          <Input
            label="Opis"
            onChangeText={(text) => setDescription(text)}
            value={description}
            multiline
            numberOfLines={10}
            style={styles.textareaLarge}
            scrollEnabled
          />
        </View>

        <View style={styles.formGroup}>
          <Button title="Zapisz" onPress={handleSave} buttonStyle={styles.button} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#6200EE',
      },
      formGroup: {
        marginBottom: 20,
      },
      picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        paddingVertical: 10,
        paddingHorizontal: 15,
      },
      textareaSmall: {
        minHeight: 100,
        textAlignVertical: 'top', // Ustawienie tekstu na górze
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#f9f9f9',
      },
      textareaLarge: {
        minHeight: 240,
        textAlignVertical: 'top', // Ustawienie tekstu na górze
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#f9f9f9',
      },
      button: {
        backgroundColor: '#6200EE',
        borderRadius: 5,
        paddingVertical: 12,
        paddingHorizontal: 20,
      },
      scrollable: {
        maxHeight: 200, // ograniczenie wysokości dla przewijania
      },
});

export default editOffer;
