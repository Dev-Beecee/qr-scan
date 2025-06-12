import * as Location from 'expo-location';
import React, { useRef, useState } from 'react';
import {
    Button,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import 'react-native-get-random-values';
import QRCode from 'react-native-qrcode-svg';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';

type QrCodeData = {
    id: string;
    lat: number;
    lon: number;
};

export default function AdminScreen() {
    const [title, setTitle] = useState('');
    const [qrcodeData, setQrcodeData] = useState<QrCodeData | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLon, setManualLon] = useState('');
    const qrCodeRef = useRef<any>(null); // Typé en 'any' pour compatibilité avec toDataURL

    const generateQR = async () => {
        if (!title.trim()) {
            setMessage('⚠️ Titre requis');
            return;
        }

        let latitude: number | null = null;
        let longitude: number | null = null;

        if (manualLat && manualLon) {
            latitude = parseFloat(manualLat);
            longitude = parseFloat(manualLon);
        } else {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setMessage('Permission localisation refusée.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
        }

        setLoading(true);
        setMessage('');
        const id = uuidv4();

        try {
            const { error } = await supabase.from('qrcodes').insert([
                {
                    id,
                    title,
                    latitude,
                    longitude,
                },
            ]);

            if (error) {
                console.error(error);
                setMessage('❌ Erreur lors de l’insertion Supabase');
            } else {
                setQrcodeData({ id, lat: latitude, lon: longitude });
                setMessage('✅ QR Code généré avec succès');
                setTitle('');
                setManualLat('');
                setManualLon('');
            }
        } catch (err) {
            console.error(err);
            setMessage('❌ Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (qrCodeRef.current) {
            qrCodeRef.current.toDataURL((data: string) => {
                const link = document.createElement('a');
                link.href = data;
                link.download = `qrcode-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scroll}>
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

                <Text style={styles.subtitle}>Coordonnées manuelles (optionnel)</Text>

                <TextInput
                    placeholder="Latitude"
                    value={manualLat}
                    onChangeText={setManualLat}
                    style={styles.input}
                    keyboardType="numeric"
                />
                <TextInput
                    placeholder="Longitude"
                    value={manualLon}
                    onChangeText={setManualLon}
                    style={styles.input}
                    keyboardType="numeric"
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
                            getRef={(c) => (qrCodeRef.current = c)}
                        />
                        <Button title="Télécharger le QR code" onPress={handleDownload} />
                    </View>
                )}
            </KeyboardAvoidingView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { flexGrow: 1 },
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    subtitle: { marginTop: 20, marginBottom: 5, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    message: { marginTop: 10, color: 'red', textAlign: 'center' },
    qrContainer: { marginTop: 30, alignItems: 'center', gap: 10 },
    qrLabel: { fontSize: 16, marginBottom: 10 },
});
