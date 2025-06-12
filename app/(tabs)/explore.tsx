// screens/ScanScreen.js
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await BarCodeScanner.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);

    try {
      const qrData = JSON.parse(data); // On s’attend à un objet : { id, lat, lon }
      const userLocation = await Location.getCurrentPositionAsync({});
      const distance = distanceInMeters(
        qrData.lat,
        qrData.lon,
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );

      if (distance <= 50) {
        setResult(`✅ Scan valide (${distance.toFixed(2)} m)`);
      } else {
        setResult(`❌ Trop loin (${distance.toFixed(2)} m)`);
      }
    } catch (e) {
      console.error(e);
      setResult("⚠️ QR Code invalide ou données mal formatées.");
    }
  };

  if (hasPermission === null) return <Text>Demande de permissions...</Text>;
  if (!hasPermission) return <Text>Caméra ou localisation refusée.</Text>;

  return (
    <View style={styles.container}>
      {!scanned && (
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {scanned && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
          <Button title="Scanner à nouveau" onPress={() => {
            setScanned(false);
            setResult('');
          }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000aa'
  },
  resultText: { color: 'white', fontSize: 18, marginBottom: 20, textAlign: 'center' }
});
