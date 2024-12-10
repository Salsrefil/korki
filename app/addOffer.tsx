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

const addOffer = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

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
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
      } else {
        Alert.alert('Error', 'Address not found. Please enter a valid address.');
      }
    } catch (error) {
      console.error('Geocoding Error:', error);
      Alert.alert('Error', 'Failed to geocode the address.');
    }
  };
  const handleSubmit = async () => {
    await geocodeAddress(); 
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Unable to get coordinates. Please try again.');
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      Alert.alert('Error', 'User is not logged in.');
      return;
    }

    let selectedCategoryId = 1;
    if (selectedCategory === 'Technikum/Liceum') selectedCategoryId = 2;
    if (selectedCategory === 'Szkoła zawodowa') selectedCategoryId = 3;
    if (selectedCategory === 'Studia') selectedCategoryId = 4;

    let selectedSubjectId;
    if (selectedSubject !== null) {
      selectedSubjectId = subjects.indexOf(selectedSubject);
    } else {
      console.error('selectedSubject is null');
    }

    try {
      const { error } = await supabase.from('ads').insert([
        {
          title,
          scope_id: selectedCategoryId,
          subject_id: selectedSubjectId,
          price: parseFloat(price),
          user_id: userId,
          description,
          contact_info: phoneNumber,
          address,
          latitude,
          longitude,
        },
      ]);

      if (error) throw error;

      Alert.alert('Success', 'Pomyślnie dodana oferta!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Nie udało się dodać oferty.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
      <ScrollView style={{ padding: 20, paddingBottom: 20 }}>
        <Text style={{ fontSize: 20 }}>Dodaj ogłoszenie:</Text>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Picker selectedValue={selectedCategory} onValueChange={(itemValue) => setSelectedCategory(itemValue)} style={styles.picker}>
            <Picker.Item label="Wybierz szkołę" value={null} />
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Picker selectedValue={selectedSubject} onValueChange={(itemValue) => setSelectedSubject(itemValue)} style={styles.picker}>
            <Picker.Item label="Wybierz przedmiot" value={null} />
            {subjects.map((subject, index) => (
              <Picker.Item key={index} label={subject} value={subject} />
            ))}
          </Picker>
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input label="Tytuł oferty" onChangeText={(text) => setTitle(text)} value={title} autoCapitalize={'none'} />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input label="Adres" onChangeText={(text) => setAddress(text)} value={address} autoCapitalize={'none'} />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input label="Cena" onChangeText={setPrice} value={price} autoCapitalize={'none'} keyboardType="phone-pad" />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input label="Phone number" onChangeText={setPhoneNumber} value={phoneNumber} autoCapitalize={'none'} keyboardType="phone-pad" />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input label="Opis" onChangeText={setDescription} value={description} autoCapitalize={'none'} multiline={true} numberOfLines={4} />
        </View>

        <View style={styles.verticallySpaced}>
          <Button title="Add offer" onPress={handleSubmit} buttonStyle={styles.button2} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
  button2: {
    borderRadius: 20,
    marginBottom: 20,
  },
});

export default addOffer;
