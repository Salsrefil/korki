import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Href, Link, router } from 'expo-router';
import { productName } from 'expo-device';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';


const addOffer = () => {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null); 
  const categories = ['Szkoła Podstawowa', 'Technikum/Liceum', 'Szkoła zawodowa', 'Studia'];  
  const subjects = ['Matematyka', 'Język obcy', 'Chemia', 'Biologia', 'Fizyka', 'Muzyka', 'Historia', 
    'Plastyka', 'Informatyka', 'Geografia' ,'Inne'
  ];


  const handleSubmit = async () => {
    
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      Alert.alert("Error", "User is not logged in.");
      return;
    }

    let selectedCategoryId = 1;
    if(selectedCategory == 'Technikum/Liceum')
      selectedCategoryId = 2;
    if(selectedCategory == 'Szkoła zawodowa')
      selectedCategoryId = 3;
    if(selectedCategory == 'Studia')
      selectedCategoryId = 4;

    let selectedSubjectId;
    if (selectedSubject !== null) {
      selectedSubjectId = subjects.indexOf(selectedSubject);
  } else {
      console.error('selectedSubject is null');
  }
    if (!selectedCategoryId) {
      Alert.alert("Error", "Please select a valid category.");
      return;
    }


    try {
      const { error } = await supabase.from('ads').insert([
        {
          title: title,
          scope_id: selectedCategoryId,
          subject_id: selectedSubjectId,
          price: parseFloat(price),
          user_id: userId,
          description: description,
          contact_info:phoneNumber,
          address:address,
        },
      ]);

      if (error) throw error;
      
      Alert.alert("Success", "Pomyślnie dodana oferta!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Nie udało się dodać oferty.");
    }
  };



  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={80} 
  >
    <ScrollView style={{ padding: 20, paddingBottom: 20 }}>
      <Text style={{ fontSize: 20 }}>Dodaj ogłoszenie:</Text>
      
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Wybierz szkołe" value={null} />
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
  <Picker
      selectedValue={selectedSubject}
      onValueChange={(itemValue) => setSelectedSubject(itemValue)}
      style={styles.picker}
    >
      <Picker.Item label="Wybierz przedmiot" value={null} />
      {subjects.map((subject, index) => (
        <Picker.Item key={index} label={subject} value={subject} />
      ))}
  </Picker>
</View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
      <Input
          label="Tytuł oferty"
          onChangeText={(text) => setTitle(text)}
          value={title}
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
      <Input
          label="Adres"
          onChangeText={(text) => setAddress(text)}
          value={address}
          autoCapitalize={'none'}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
            label="Cena"
            onChangeText={setPrice}
            value={price}
            autoCapitalize={'none'}
            keyboardType="phone-pad"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
            label="Phone number"
            onChangeText={setPhoneNumber}
            value={phoneNumber}
            autoCapitalize={'none'}
            keyboardType="phone-pad"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Opis"
          onChangeText={setDescription}
          value={description}
          autoCapitalize={'none'}
          multiline={true} 
          numberOfLines={4} 
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Add offer" onPress={handleSubmit}  buttonStyle={styles.button2} />
      </View>
      
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
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
  button: {   
    borderRadius: 20,  
  },
  button2: {   
    borderRadius: 20,
    marginBottom:20,  
  },
  dateText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default addOffer;
