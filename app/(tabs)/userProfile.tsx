import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Href, Link, router } from 'expo-router';
import Avatar from '../Avatar'

const UserEmailScreen = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null); 
  const [lastName, setLastName] = useState<string | null>(null);   
  const [avatarUrl, setAvatarUrl] = useState('')
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Błąd przy pobieraniu użytkownika:', authError);
      } else if (user) {
        setEmail(user.email ?? null);

        console.log(user.id)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, last_name, image_path')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Błąd przy pobieraniu profilu użytkownika:', profileError);
        } else if (profileData) {
          setName(profileData.name);
          setLastName(profileData.last_name);
          setAvatarUrl(profileData.image_path)
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Błąd podczas wylogowywania:', error);
    } else {
      setName(null);
      setLastName(null);
      router.push('/');
    }
  };

  function updateProfile(arg0: { username: any; website: any; avatar_url: string; }) {
    throw new Error('Function not implemented.');
  }

  return (
    <View style={{ padding: 20 }}>
       <View>
      <Avatar
        size={200}
        url={avatarUrl}
        onUpload={(url: string) => {
          setAvatarUrl(url)
          updateProfile({ username, website, avatar_url: url })
        }}
      />
    </View>
      {email ? (
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input label="Email" value={email} disabled />
          <Input label="Imię" value={name ?? 'Ładowanie...'} disabled />
          <Input label="Nazwisko" value={lastName ?? 'Ładowanie...'} disabled />
        </View>
      ) : (
        <Text style={{ fontSize: 18, marginTop: 10 }}>Ładowanie...</Text>
      )}

      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={handleSignOut} buttonStyle={styles.button} />
      </View>
    </View>
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
  button: {   
    borderRadius: 20,  
  },
});

export default UserEmailScreen;
