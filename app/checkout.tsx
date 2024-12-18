import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StripeProvider, PlatformPayButton, confirmPlatformPayPayment, PlatformPay } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

const Checkout = () => {
  const router = useRouter();
  const { formData: formDataString } = useLocalSearchParams();
  const formData = JSON.parse(formDataString as string);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      console.log('Rozpoczęcie płatności...');
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'User is not logged in.');
        return;
      }

      // Fetch PaymentIntent client secret
      const response = await fetch('https://mjniyyianfsrvxmuwnvz.supabase.co/functions/v1/intentk', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: 'pln',
          amount: 5000, // stała cena 50 PLN
          items: [{ id: 'listing_fee' }],
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch payment intent.');
      const { paymentIntent } = await response.json();

      console.log('Potwierdzanie płatności...');
      // Confirm payment with Google Pay
      const { error } = await confirmPlatformPayPayment(paymentIntent, {
        googlePay: {
          testEnv: true,
          merchantName: 'Tutoring Platform',
          merchantCountryCode: 'PL',
          currencyCode: 'PLN',
          billingAddressConfig: {
            format: PlatformPay.BillingAddressFormat.Full,
            isPhoneNumberRequired: true,
            isRequired: true,
          },
        },
      });

      if (error) {
        Alert.alert('Error', `Payment failed: ${error.message}`);
        return;
      }

      console.log('Płatność udana. Zapisywanie ogłoszenia...');
      // Payment successful, save the offer to the database
      const { error: dbError } = await supabase.from('ads').insert([
        {
          title: formData.title,
          scope_id: ['Szkoła Podstawowa', 'Technikum/Liceum', 'Szkoła zawodowa', 'Studia'].indexOf(formData.category) + 1,
          subject_id: formData.subject,
          price: parseFloat(formData.price),
          user_id: userId,
          description: formData.description,
          contact_info: formData.phoneNumber,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      ]);

      if (dbError) throw dbError;

      Alert.alert('Sukces', 'Płatność powiodła się i oferta została dodana!');
      router.push('/homePage'); // Powrót do strony głównej
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Nie udało się przetworzyć płatności.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StripeProvider publishableKey="pk_test_51QX6CaGC4QWQLFjPLYaiU9kgzsJxVYadGYRuZoqVv29sWKOt5tGFBUucY8i9qBilK7vmKV3Y8Gbg8nuguwOQ5vx700CG4nHJMk">
      <View style={styles.container}>
        <Text style={styles.header}>Checkout</Text>
        <Text style={styles.infoText}>
          Płatność za wystawienie ogłoszenia wynosi <Text style={styles.bold}>50 zł</Text>.
        </Text>

        <View style={styles.paymentContainer}>
          <PlatformPayButton
            style={styles.payButton}
            type={PlatformPay.ButtonType.Pay}
            onPress={handlePayment}
            disabled={loading}
          />
        </View>
      </View>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  bold: {
    fontWeight: 'bold',
  },
  paymentContainer: {
    alignItems: 'center',
  },
  payButton: {
    height: 50,
    width: '80%',
  },
});

export default Checkout;
