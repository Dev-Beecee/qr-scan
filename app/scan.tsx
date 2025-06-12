import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function distanceInMeters(lat1, lon1, lat2, lon2) {
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
    const [facing, setFacing] = useState(CameraType.back);
    const [scanned, setScanned] = useState(false);
    const [result, setResult] = useState('');

    useEffect(() => {
        (async () => {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(locStatus === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (scanned) return;

        setScanned(true);

        try {
            const qrData = JSON.parse(data); // Ex: { id, lat, lon }
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

    if (!permission || !locationGranted) {
        return (
            <View style={styles.center}>
                <Text style={styles.message}>Demande de permissions...</Text>
                <Button title="Autoriser la caméra" onPress={requestPermission} />
            </View>
        );
    }

    if (!permission.granted || !locationGranted) {
        return <Text style={styles.message}>Accès caméra ou géolocalisation refusé.</Text>;
    }

    return (
        <View style={styles.container}>
            {!scanned && (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing={facing}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleBarCodeScanned}
                >
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    message: { fontSize: 16, textAlign: 'center', marginBottom: 10 },
    resultBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000000aa'
    },
    resultText: { color: 'white', fontSize: 18, marginBottom: 20, textAlign: 'center' },
    flipContainer: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        alignItems: 'center'
    },
    flipText: {
        fontSize: 18,
        color: '#fff',
        backgroundColor: '#0008',
        padding: 10,
        borderRadius: 8
    }
});
