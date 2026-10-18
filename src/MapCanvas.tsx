import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Place } from './place';

export default function MapCanvas({ place }: { place: Place }) {
  return (
    <MapView style={styles.map} initialRegion={{ latitude: place.latitude, longitude: place.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 }}>
      <Marker coordinate={{ latitude: place.latitude, longitude: place.longitude }} title={place.address} />
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
