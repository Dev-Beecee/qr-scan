import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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
  const [permission, requestPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(locationStatus === 'granted');
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    try {
      const qrData = JSON.parse(data); // { id, lat, lon }
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
      setResult('⚠️ QR Code invalide ou données mal formatées.');
    }
  };

  if (!permission || !locationGranted) return <Text>Demande de permissions...</Text>;
  if (!permission.granted || !locationGranted) return <Text>Caméra ou localisation refusée.</Text>;

  return (
    <View style={styles.container}>
      {!scanned && (
        <CameraView style={styles.camera} facing={facing} onBarcodeScanned={handleBarCodeScanned}>
          <View style={styles.flipContainer}>
            <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
              <Text style={styles.flipText}>↺ Retourner la caméra</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
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
  camera: { flex: 1 },
  resultBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000aa',
  },
  resultText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  flipContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#00000088',
    padding: 10,
    borderRadius: 10,
  },
  flipText: {
    color: '#fff',
    fontSize: 16,
  },
});
