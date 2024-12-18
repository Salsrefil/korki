import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Alert, Image, Button } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

interface Props {
  size: number
  url: string | null
  onUpload: (filePath: string) => void
}

export default function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarSize = { height: size, width: size }

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('image_path')
        .eq('id', userId)
        .single();
        console.log('halo',profileData?.image_path)
      const { data, error } = await supabase.storage.from('avatars').download(path)

      if (error) {
        throw error
      }

      const fr = new FileReader()
      fr.readAsDataURL(data)
      fr.onload = () => {
        setAvatarUrl(fr.result as string)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message)
      }
    }
  }

  async function uploadAvatar() {
    try {
      setUploading(true)

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsMultipleSelection: false, 
        allowsEditing: true,
        quality: 1,
        exif: false, 
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.')
        return
      }

      const image = result.assets[0]
      console.log('Got image', image)

      if (!image.uri) {
        throw new Error('No image uri!') 
      }

      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer())

      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg'
      const path = `${Date.now()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        })

      if (uploadError) {
        throw uploadError
      }
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      try {
        const { error } = await supabase
        .from('profiles')
        .update({
          image_path: path,
        })
        .eq('id', userId);
  
        if (error) throw error;
        
        Alert.alert("Success", "Product added successfully!");
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to add product.");
      }

      onUpload(data.path)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      } else {
        throw error
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.avatar, styles.image]}
        />
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage]} />
      )}
      <View style={styles.mt20}>
        <Button
          title={uploading ? 'Uploading ...' : 'Upload'}
          onPress={uploadAvatar}
          disabled={uploading}
          color="#6200EE"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  avatar: {
    borderRadius: 5,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(200, 200, 200)',
    borderRadius: 5,
  },
  mt20: {
    marginTop: 20,
    width: 100,
  },
  button: {   
    borderRadius: 20,  
  },
})