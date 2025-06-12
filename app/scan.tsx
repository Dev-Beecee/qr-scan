// app/scan.tsx
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await BarCodeScanner.requestPermissionsAsync();
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        setScanned(true);

        try {
            const parsed = JSON.parse(data); // { id, lat, lon }

            const userLocation = await Location.getCurrentPositionAsync({});
            const dist = getDistanceMeters(
                parsed.lat,
                parsed.lon,
                userLocation.coords.latitude,
                userLocation.coords.longitude
            );

            if (dist <= 50) {
                setMessage(`✅ Scan valide (à ${dist.toFixed(2)} mètres)`);
            } else {
                setMessage(`❌ Trop loin (${dist.toFixed(2)} mètres)`);
            }
        } catch (err) {
            console.error(err);
            setMessage("⚠️ QR Code invalide ou format incorrect.");
        }
    };

    if (hasPermission === null) return <Text>Demande de permissions...</Text>;
    if (!hasPermission) return <Text>Caméra ou localisation non autorisée.</Text>;

    return (
        <View style={styles.container}>
            {!scanned && (
                <BarCodeScanner
                    onBarCodeScanned={handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            )}
            {scanned && (
                <View style={styles.result}>
                    <Text style={styles.resultText}>{message}</Text>
                    <Button title="Scanner à nouveau" onPress={() => {
                        setScanned(false);
                        setMessage('');
                    }} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    result: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000aa',
        padding: 20
    },
    resultText: { fontSize: 18, color: 'white', marginBottom: 20, textAlign: 'center' }
});
