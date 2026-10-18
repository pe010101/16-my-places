import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Place } from './place';

export default function MapCanvas({ place }: { place: Place }) {
  const { latitude: lat, longitude: lon } = place;
  const query = new URLSearchParams({
    bbox: `${lon - 0.015},${lat - 0.01},${lon + 0.015},${lat + 0.01}`,
    layer: 'mapnik', marker: `${lat},${lon}`,
  });
  return <View style={styles.map}>{createElement('iframe', {
    title: `Карта: ${place.address}`, src: `https://www.openstreetmap.org/export/embed.html?${query}`,
    style: { border: 0, width: '100%', height: '100%', minHeight: 420 }, loading: 'lazy',
  })}</View>;
}

const styles = StyleSheet.create({ map: { flex: 1, minHeight: 420 } });
