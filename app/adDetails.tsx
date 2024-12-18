import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, Modal, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useNavigation } from 'expo-router';
import { supabase } from '../lib/supabase';

const AdDetails = () => {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [ad, setAd] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false); // Modal

  useEffect(() => {
    navigation.setOptions({ title: 'Ogłoszenie' });
    fetchAdDetails();
    fetchReviews();
  }, [id]);

  const fetchAdDetails = async () => {
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

    const { data: userData } = await supabase
      .from('profiles')
      .select('name, last_name, image_path')
      .eq('id', adData.user_id)
      .single();

    setUser(userData);
    if (userData?.image_path) downloadImage(userData.image_path);
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('comment, rating, created_at, profiles(name, last_name)')
      .eq('ad_id', id);

    setReviews(data || []);
  };

  const downloadImage = async (path: string) => {
    const { data } = await supabase.storage.from('avatars').download(path);
    const fr = new FileReader();
    fr.readAsDataURL(data);
    fr.onload = () => setAvatarUrl(fr.result as string);
  };

  const addReview = async () => {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      alert('Ocena musi być liczbą od 1 do 5.');
      return;
    }
    if (!comment.trim()) {
      alert('Komentarz nie może być pusty.');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('reviews').insert([
      { ad_id: id, user_id: userData?.user.id, rating, comment: comment.trim() },
    ]);

    setComment('');
    setRating(0);
    setModalVisible(false); // Zamknij modal
    fetchReviews();
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6200EE" /></View>;

  return (
    <ScrollView style={styles.container}>
      {/* Dane użytkownika */}
      <TouchableOpacity style={styles.userContainer} onPress={() => router.push(`/profile?userId=${ad.user_id}`)}>
        {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.userImage} /> : <View style={styles.noImage} />}
        <Text style={styles.userName}>{user?.name} {user?.last_name}</Text>
      </TouchableOpacity>

      {/* Szczegóły ogłoszenia */}
      <View style={styles.header}>
        <Text style={styles.title}>{ad.title}</Text>
        <Text style={styles.price}>{ad.price} zł / 60min</Text>
      </View>

      <View style={styles.section}><Text>{ad.description}</Text></View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontakt</Text>
        <Text>{ad.contact_info}</Text>
      </View>

      {/* Przycisk otwierający modal */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Dodaj opinię</Text>
        </TouchableOpacity>
      </View>

      {/* Wyświetlanie opinii */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opinie</Text>
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <View key={index} style={styles.reviewItem}>
              <Text style={styles.reviewRating}>Ocena: {review.rating}/5</Text>
              <Text>{review.comment}</Text>
              <Text style={styles.reviewAuthor}>
                - {review.profiles?.name} {review.profiles?.last_name}
              </Text>
            </View>
          ))
        ) : <Text>Brak opinii.</Text>}
      </View>

      {/* Modal z formularzem */}
      <Modal visible={modalVisible} animationType="slide" transparent>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* Tytuł */}
      <Text style={styles.sectionTitle}>Dodaj opinię</Text>

      {/* Sekcja oceny */}
      <View style={styles.ratingContainer}>
        <Text style={styles.modalLabel}>Ocena:</Text>
        <View style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.ratingButton,
                rating === value ? styles.ratingButtonSelected : null, // Podświetlenie wybranej oceny
              ]}
              onPress={() => setRating(value)} // Ustawienie oceny
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  rating === value ? styles.ratingButtonTextSelected : null, // Podświetlenie tekstu
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sekcja komentarza */}
      <View style={styles.commentContainer}>
        <Text style={styles.modalLabel}>Komentarz:</Text>
        <TextInput
          style={styles.commentInput}
          multiline
          placeholder="Wpisz swoją opinię..."
          value={comment}
          onChangeText={setComment}
        />
      </View>

      {/* Przyciski */}
      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
          <Text style={styles.buttonText}>Anuluj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={addReview}>
          <Text style={styles.buttonText}>Dodaj</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
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
    backgroundColor: '#FFF',
    marginBottom: 10,
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
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#EEE',
    borderRadius: 5,
  },
  reviewRating: {
    fontWeight: 'bold',
  },
  reviewAuthor: {
    fontStyle: 'italic',
    marginTop: 5,
  },
  /* Modal Styles */
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    elevation: 5,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ratingButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#EEE',
    marginHorizontal: 5,
  },
  ratingButtonSelected: {
    backgroundColor: '#6200EE',
  },
  ratingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingButtonTextSelected: {
    color: '#FFF',
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top', // Wyrównanie tekstu do góry
    backgroundColor: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#888',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});


export default AdDetails;
