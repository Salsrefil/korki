import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';

const TermsOfServiceScreen = () =>{
    const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: 'Regulamin' });
  });


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Regulamin korzystania z aplikacji</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.paragraph}>
          1. Użytkownik zobowiązuje się do przestrzegania zasad korzystania z aplikacji.
        </Text>
        <Text style={styles.paragraph}>
          2. Wszystkie ogłoszenia muszą być zgodne z prawem i zasadami etyki.
        </Text>
        <Text style={styles.paragraph}>
          3. Zabrania się publikowania treści obraźliwych, nielegalnych lub wprowadzających w błąd.
        </Text>
        <Text style={styles.paragraph}>
          4. Aplikacja nie ponosi odpowiedzialności za treść publikowanych ogłoszeń.
        </Text>
        <Text style={styles.paragraph}>
          5. Naruszenie regulaminu może skutkować usunięciem konta użytkownika.
        </Text>
        <Text style={styles.paragraph}>
          6. Użytkownik zgadza się na przetwarzanie swoich danych osobowych zgodnie z polityką prywatności.
        </Text>
      </ScrollView>
    </View>
  );
};

export default TermsOfServiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
  },
});
