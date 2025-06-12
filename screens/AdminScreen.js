import * as Location from 'expo-location';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Button,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import 'react-native-get-random-values';
import QRCode from 'react-native-qrcode-svg';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';

export default function AdminScreen() {
  const [title, setTitle] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [qrcodeData, setQrcodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const qrRef = useRef(null);

  const generateQR = async () => {
    if (!title.trim()) {
      setMessage('⚠️ Titre requis');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let coords;

      if (latitude && longitude) {
        coords = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setMessage('Permission localisation refusée.');
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        coords = location.coords;
      }

      const id = uuidv4();

      const { error } = await supabase.from('qrcodes').insert([
        {
          id,
          title,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      ]);

      if (error) {
        console.error(error);
        setMessage('Erreur lors de la création dans Supabase');
      } else {
        setQrcodeData({
          id,
          lat: coords.latitude,
          lon: coords.longitude,
        });
        setTitle('');
        setLatitude('');
        setLongitude('');
        setMessage('✅ QR code généré avec succès');
      }
    } catch (e) {
      console.error(e);
      setMessage('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSVG = () => {
    if (!qrRef.current || !qrcodeData) return;

    qrRef.current.toDataURL((data) => {
      const svgDataUrl = `data:image/svg+xml;base64,${data}`;

      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = svgDataUrl;
        a.download = `${qrcodeData.id}.svg`;
        a.click();
      } else {
        Alert.alert('Non disponible', 'Le téléchargement fonctionne uniquement sur le Web.');
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Créer un QR Code</Text>
      <TextInput
        placeholder="Nom du QR Code"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Latitude (laisser vide pour GPS)"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        placeholder="Longitude (laisser vide pour GPS)"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <Button
        title={loading ? 'Création...' : 'Générer QR code'}
        onPress={generateQR}
        disabled={loading}
      />
      {message !== '' && <Text style={styles.message}>{message}</Text>}

      {qrcodeData && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>QR Code :</Text>
          <QRCode
            value={JSON.stringify(qrcodeData)}
            size={200}
            getRef={qrRef}
          />
          <View style={{ marginTop: 15 }}>
            <Button title="Télécharger SVG" onPress={downloadSVG} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  message: { marginTop: 10, color: 'red' },
  qrContainer: { marginTop: 30, alignItems: 'center' },
  qrLabel: { fontSize: 16, marginBottom: 10 },
});
