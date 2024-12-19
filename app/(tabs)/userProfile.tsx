import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button, Input, Card } from '@rneui/themed';
import { router } from 'expo-router';
import Avatar from '../Avatar';

const UserEmailScreen = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Error fetching user:', authError);
      } else if (user) {
        setEmail(user.email ?? null);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, last_name, image_path, description')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setName(profileData.name);
          setLastName(profileData.last_name);
          setAvatarUrl(profileData.image_path);
          setDescription(profileData.description);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during sign out:', error);
    } else {
      setName(null);
      setLastName(null);
      router.push('/');
    }
  };

  const handleUpdateDescription = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ description })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating description:', error);
    } else {
      setModalVisible(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Card containerStyle={styles.card}>
        <Card.Title>Dane użytkownika</Card.Title>
        <Card.Divider />
        <View style={styles.centered}>
          <Avatar
            size={150}
            url={avatarUrl}
            onUpload={(url: string) => {
              setAvatarUrl(url);
            }}
          />
        </View>
        <Input label="Email" value={email ?? 'Ładowanie...'} disabled />
        <Input label="Imię" value={name ?? 'Ładowanie...'} disabled />
        <Input label="Nazwisko" value={lastName ?? 'Ładowanie...'} disabled />
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title>Opcje</Card.Title>
        <Card.Divider />
        <Button
          title="Wyświetl/edytuj opis profilu"
          onPress={() => setModalVisible(true)}
          buttonStyle={styles.button}
        />
        <Button
          title="Moje ogłoszenia"
          onPress={() => router.push({ pathname: '/MyAds', params: { from: 'userProfile' } })}
          buttonStyle={styles.button}
        />
        <Button
          title="Regulamin"
          onPress={() => router.push('/termsOfService')}
          buttonStyle={styles.button}
        />
      </Card>

      <Card containerStyle={styles.card}>
        <Button
          title="Wyloguj się"
          onPress={handleSignOut}
          buttonStyle={[styles.button, { backgroundColor: '#d9534f' }]}
        />
      </Card>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Opis profilu</Text>
          <Input
            placeholder="Wprowadź opis profilu"
            multiline
            numberOfLines={4}
            value={description ?? ''}
            onChangeText={setDescription}
          />
          <View style={styles.modalButtons}>
            <Button title="Zapisz" onPress={handleUpdateDescription} buttonStyle={styles.modalButton} />
            <Button title="Zamknij" onPress={() => setModalVisible(false)} buttonStyle={styles.modalButton} type="outline" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  centered: {
    alignItems: 'center',
    marginBottom: 15,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#6200EE',
    marginVertical: 10,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    top: '20%',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    borderRadius: 5,
    width: 100,
  },
});

export default UserEmailScreen;
