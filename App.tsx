import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Dialog, Divider, IconButton, List, MD3LightTheme, PaperProvider, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import type { Candidate, Place } from './src/place';
import { deletePlace, listPlaces, savePlace } from './src/storage';
import { searchPlaces } from './src/geocode';
import MapCanvas from './src/MapCanvas';

type Routes = { Places: undefined; Map: { place: Place } };
const Stack = createNativeStackNavigator<Routes>();
const theme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: '#236C70' } };

function PlacesScreen({ navigation }: NativeStackScreenProps<Routes, 'Places'>) {
  const [address, setAddress] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPlaces(await listPlaces()); setLoadFailed(false); }
    catch { setLoadFailed(true); setMessage('Could not open storage. Please try loading again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const search = async () => {
    if (!address.trim()) { setMessage('Enter an address.'); return; }
    setBusy(true);
    try {
      const found = await searchPlaces(address);
      if (!found.length) setMessage('Address not found. Check the street and city.');
      else setCandidates(found);
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : 'Search failed.'); }
    finally { setBusy(false); }
  };

  const save = async (candidate: Candidate) => {
    setBusy(true);
    try {
      if (places.some((place) => place.address === candidate.address)) throw new Error('This address is already saved.');
      await savePlace(candidate);
      setPlaces(await listPlaces());
      setAddress(''); setCandidates([]); setMessage('Address saved.');
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : 'Could not save the address.'); }
    finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try { await deletePlace(id); setPlaces(await listPlaces()); }
    catch { setMessage('Could not delete the address.'); }
    finally { setBusy(false); }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <Text variant="headlineSmall">My Places</Text>
        <TextInput label="Type an address" placeholder="Mannerheimintie 10, Helsinki" value={address} onChangeText={setAddress} mode="outlined" disabled={busy || loading} onSubmitEditing={() => void search()} />
        <Button icon="content-save" mode="contained" loading={busy} disabled={busy || loading || loadFailed} onPress={() => void search()}>SAVE</Button>
        <Text variant="bodySmall">Search for an address, pick a result, and open it on the map.</Text>
      </View>
      {loading ? <ActivityIndicator /> : loadFailed ? <Button onPress={() => void load()}>Retry loading</Button> : (
        <FlatList data={places} keyExtractor={(place) => String(place.id)} ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<List.Item title="No saved addresses yet" description="Start with a street and city." left={(props) => <List.Icon {...props} icon="map-marker-outline" />} />}
          renderItem={({ item }) => <List.Item title={item.address} titleNumberOfLines={3} description="Show on map" onPress={() => navigation.navigate('Map', { place: item })}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={(props) => <IconButton {...props} icon="delete-outline" accessibilityLabel={`Delete ${item.address}`} disabled={busy} onPress={() => void remove(item.id)} />} />}
        />
      )}
      <Portal><Dialog visible={candidates.length > 0} onDismiss={() => !busy && setCandidates([])}>
        <Dialog.Title>Choose an address</Dialog.Title>
        <Dialog.ScrollArea><FlatList data={candidates} keyExtractor={(candidate, index) => `${candidate.latitude}:${candidate.longitude}:${index}`}
          renderItem={({ item }) => <List.Item title={item.address} titleNumberOfLines={4} description="Tap to save" disabled={busy} onPress={() => void save(item)} />}
        /></Dialog.ScrollArea>
        <Dialog.Actions><Button disabled={busy} onPress={() => setCandidates([])}>Cancel</Button></Dialog.Actions>
      </Dialog></Portal>
      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={4000}>{message}</Snackbar>
    </View>
  );
}

function MapScreen({ route }: NativeStackScreenProps<Routes, 'Map'>) {
  const { place } = route.params;
  return <View style={styles.screen}>
    <MapCanvas key={place.id} place={place} />
    <View style={styles.mapCaption}><Text variant="titleMedium">{place.address}</Text>
      <Text>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</Text>
    </View>
  </View>;
}

export default function App() {
  return <SafeAreaProvider><PaperProvider theme={theme}><NavigationContainer>
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#236C70' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Places" component={PlacesScreen} options={{ title: 'My Places' }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
    </Stack.Navigator>
  </NavigationContainer></PaperProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' }, form: { padding: 20, gap: 12 },
  list: { paddingBottom: 24 }, mapCaption: { padding: 16, gap: 4 },
});
