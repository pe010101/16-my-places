# №16 My Places — полный разбор с исходниками

## Требования и маршрут

В курсе требуется сохранять адреса и показывать их на карте, использовать Firebase или SQLite, оформить интерфейс React Native Paper и переходить между экранами через React Navigation. Выбран вариант SQLite. Маршрут: распаковать проект → установить зависимости → запустить → найти адрес → выбрать правильный результат → сохранить → открыть карту → проверить сохранение после перезапуска → подготовить сдачу.

My Places — отдельный проект. В Shopping List №11 хранятся товары, здесь хранятся адрес и координаты. Для задания №16 не нужно изменять Bookstore или настраивать Firebase.

## Размещение и запуск у ученицы

Распакуйте `16-my-places.zip` в:

```text
<локальный-путь>
```

Папка должна содержать `package.json`, `package-lock.json`, `App.tsx`, `index.ts`, `src/`, `tests/` и `docs/`. Готовый проект не требует создания ещё одного шаблона.

```bash
cd <папка-этого-репозитория>
npm ci
npm run typecheck
npm test
npx expo install --check
npm run ios
```

Для Android вместо последней команды используйте `npm run android`, для браузера — `npm run web`. Нативная SQLite и react-native-maps используются на iOS/Android; браузерная версия хранит список в localStorage и показывает OpenStreetMap в iframe. Это отдельный web-адаптер для удобства разбора, а не проверка нативной SQLite.

Node 24 нужен для прилагаемых тестов с `node:sqlite`. Если работает NVM, выполните `nvm install 24` и `nvm use 24`. Для iOS Simulator нужен Xcode, для Android — Android Studio с запущенным виртуальным устройством. Expo Go должен поддерживать SDK 54 проекта.

Чтобы запускать через общий скрипт:

```bash
cd <папка-этого-репозитория>
./build-and-run.sh
```

Выберите строку `[Expo] 16-my-places`, ориентируясь на путь, а затем платформу. Номер меню не обязан совпадать с номером задания. Прямые команды выше полезны, если нужно увидеть подробную ошибку Expo.

Если создаёте проект вручную на основе существующего Expo-шаблона, сохраните его SDK, добавьте файлы решения и согласуйте библиотеки:

```bash
npm install react-native-paper @react-navigation/native @react-navigation/native-stack
npx expo install expo-sqlite react-native-maps react-native-screens react-native-safe-area-context @expo/vector-icons
# Для запуска в браузере:
npx expo install react-dom react-native-web
```

Не заменяйте package.json проекта с другим SDK целиком этим package.json. Согласованные нативные версии устанавливает `expo install`; готовый архив уже содержит lock-файл для SDK 54. Для входной точки в этом решении `main` равен `index.ts`, а сам файл вызывает `registerRootComponent(App)`. Шаблон Expo Router с `main: expo-router/entry` требует другой структуры — для данного решения используется обычный blank TypeScript.

## Что происходит в приложении

1. При открытии `PlacesScreen` функция `listPlaces()` читает сохранённые адреса из БД.
2. По кнопке SAVE вызывается `searchPlaces(address)`. Запрос выполняется по действию пользователя; ввод каждого символа не отправляет запрос.
3. Photon возвращает несколько найденных объектов. Диалог позволяет выбрать нужный город и улицу.
4. `savePlace(candidate)` записывает адрес, широту и долготу в SQLite. Данные пользователя передаются параметрами `?`.
5. Нажатие на строку вызывает `navigation.navigate('Map', { place })`.
6. `MapScreen` получает параметр маршрута и показывает карту с маркером. Стрелка Back возвращает к списку.
7. Корзина вызывает `deletePlace(id)` и перечитывает список.

В интерфейсе используются `TextInput`, `Button`, `List.Item`, `IconButton`, `Dialog`, `Snackbar` и `ActivityIndicator` из React Native Paper. `PaperProvider` подключает тему, `SafeAreaProvider` учитывает края экрана, `NavigationContainer` хранит состояние навигации, а Native Stack создаёт два экрана с заголовками и возвратом.

## Почему код устроен так

`Place` описывает сохранённый адрес с числовым id. `Candidate` содержит адрес и координаты до сохранения. Типы помогают не путать данные сервиса с записью БД.

`normalizeAddress()` очищает внешние и повторные пробелы. `validCoordinates()` проверяет конечность чисел и диапазоны. `validateCandidate()` используется и в нативном, и в web-хранилище, поэтому некорректная точка не записывается.

`parsePhoton()` разбирает ответ как `unknown`: проверяет объекты, массивы и координаты. В GeoJSON порядок — долгота, затем широта; React Native Maps ожидает поля `latitude` и `longitude`. Их перестановка — частая причина неверного маркера.

`searchPlaces()` ограничивает ожидание через AbortController, показывает понятные ошибки сети, HTTP 429 и недоступного сервиса. Для геокодирования нужен интернет. Это публичный сервис Photon без гарантии доступности; приложение не сохраняет фиктивные координаты при ошибке.

`getDatabase()` открывает БД один раз и создаёт таблицу, если она отсутствует. `execAsync()` выполняет постоянный SQL создания таблицы, а `runAsync()` передаёт значения параметрами. Адрес с апострофом не становится частью SQL-кода. `UNIQUE` предотвращает повтор одинакового сохранённого адреса.

`useEffect()` отвечает за начальную загрузку списка. Обработчики SAVE/удаления отвечают за пользовательские действия. Переменные `loading` и `busy` отключают повторные нажатия во время операции. После записи список перечитывается из БД, чтобы интерфейс соответствовал реально сохранённым данным.

Файлы `.web.ts` и `.web.tsx` автоматически выбираются Metro для браузера. На мобильных платформах выбираются файлы без `.web`. Такое разделение позволяет исключить нативный модуль карты из браузерной сборки.

## Проверка и ошибки

Автоматические команды:

```bash
npm run typecheck
npm test
npm run build
```

Сборка Expo — проверка JavaScript/TypeScript-пакетов, она не заменяет запуск карты на устройстве.

Ручные сценарии:

1. Нажать SAVE при пустом поле: появится сообщение, новая запись не создаётся.
2. Ввести `Mannerheimintie 10, Helsinki`, нажать SAVE, выбрать правильный результат.
3. Проверить появление адреса в списке. Нажать его: открыть Map, увидеть маркер и координаты, вернуться Back.
4. Перезапустить приложение: адрес должен остаться в списке.
5. Повторить сохранение того же результата: приложение сообщает, что адрес уже сохранён.
6. Сохранить второй адрес; удалить один — второй остаётся после перезапуска.
7. Проверить понятную ошибку при отключённом интернете. Уже сохранённые адреса остаются доступны; подложка карты может требовать интернет.

Если `/` в браузере показывает JSON Expo-манифеста, открыт нативный Metro. Запустите `npm run web` или выберите web в общем скрипте. Если карта пуста в собственной Android development/release-сборке, проверьте настройку Maps SDK и ограниченного Google Maps API key; Expo Go и самостоятельная сборка используют разные нативные настройки. Для iOS по умолчанию используется Apple Maps. [Документация карты для SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/).

Файл `my-places.db` создаётся внутри хранилища мобильного приложения. Удаление приложения/его данных удаляет локальную базу. В web данные относятся к адресу и порту сайта: запуск на другом порту имеет другое localStorage.

## Что объяснить на защите

Расскажите о переходе от адреса к координатам, порядке широты/долготы, SQLite CRUD и параметрах SQL. Покажите два маршрута React Navigation, различие данных `Candidate`/`Place`, Paper-компоненты и обработку ошибок. Наконец покажите, что адрес сохраняется после перезапуска именно на мобильной платформе.

Ниже — точное содержимое собственных файлов проекта. Lock-файл включён в архив, но его сгенерированные сотни зависимостей не являются исходным кодом приложения.


## Полные листинги файлов


### `package.json`

```json
{
  "name": "my-places", "version": "1.0.0", "private": true, "type": "module", "main": "index.ts",
  "scripts": {
    "start": "expo start", "ios": "expo start --ios", "android": "expo start --android", "web": "expo start --web",
    "typecheck": "tsc --noEmit", "test": "node --experimental-strip-types --test tests/*.test.ts",
    "build": "expo export --platform all --output-dir dist"
  },
  "dependencies": {
    "expo": "~54.0.37", "react": "19.1.0", "react-native": "0.81.5", "react-dom": "19.1.0", "react-native-web": "~0.21.0",
    "expo-sqlite": "~16.0.10", "react-native-maps": "1.20.1", "react-native-paper": "5.15.3",
    "react-native-safe-area-context": "~5.6.0", "react-native-screens": "~4.16.0",
    "@react-navigation/native": "^7.1.9", "@react-navigation/native-stack": "^7.3.0",
    "@expo/vector-icons": "^15.0.3"
  },
  "devDependencies": { "typescript": "~5.9.2", "@types/react": "~19.1.10", "@types/node": "^24.0.0" },
  "engines": { "node": ">=24 <25" }
}
```


### `app.json`

```json
{
  "expo": {
    "name": "My Places", "slug": "my-places", "version": "1.0.0", "orientation": "portrait",
    "userInterfaceStyle": "light", "newArchEnabled": true,
    "ios": { "supportsTablet": true }, "android": { "edgeToEdgeEnabled": true },
    "web": { "bundler": "metro" }, "plugins": ["expo-sqlite"]
  }
}
```


### `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": { "strict": true, "noEmit": true, "allowImportingTsExtensions": true }
}
```


### `index.ts`

```typescript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```


### `App.tsx`

```tsx
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
    catch { setLoadFailed(true); setMessage('Не удалось открыть хранилище. Повторите загрузку.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const search = async () => {
    if (!address.trim()) { setMessage('Введите адрес.'); return; }
    setBusy(true);
    try {
      const found = await searchPlaces(address);
      if (!found.length) setMessage('Адрес не найден. Уточните улицу и город.');
      else setCandidates(found);
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : 'Ошибка поиска.'); }
    finally { setBusy(false); }
  };

  const save = async (candidate: Candidate) => {
    setBusy(true);
    try {
      if (places.some((place) => place.address === candidate.address)) throw new Error('Этот адрес уже сохранён.');
      await savePlace(candidate);
      setPlaces(await listPlaces());
      setAddress(''); setCandidates([]); setMessage('Адрес сохранён.');
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : 'Не удалось сохранить адрес.'); }
    finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try { await deletePlace(id); setPlaces(await listPlaces()); }
    catch { setMessage('Не удалось удалить адрес.'); }
    finally { setBusy(false); }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <Text variant="headlineSmall">My Places</Text>
        <TextInput label="Type an address" placeholder="Mannerheimintie 10, Helsinki" value={address} onChangeText={setAddress} mode="outlined" disabled={busy || loading} onSubmitEditing={() => void search()} />
        <Button icon="content-save" mode="contained" loading={busy} disabled={busy || loading || loadFailed} onPress={() => void search()}>SAVE</Button>
        <Text variant="bodySmall">Найдите адрес, выберите результат и откройте его на карте.</Text>
      </View>
      {loading ? <ActivityIndicator /> : loadFailed ? <Button onPress={() => void load()}>Повторить загрузку</Button> : (
        <FlatList data={places} keyExtractor={(place) => String(place.id)} ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<List.Item title="Сохранённых адресов пока нет" description="Начните с улицы и города." left={(props) => <List.Icon {...props} icon="map-marker-outline" />} />}
          renderItem={({ item }) => <List.Item title={item.address} titleNumberOfLines={3} description="Show on map" onPress={() => navigation.navigate('Map', { place: item })}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={(props) => <IconButton {...props} icon="delete-outline" accessibilityLabel={`Удалить ${item.address}`} disabled={busy} onPress={() => void remove(item.id)} />} />}
        />
      )}
      <Portal><Dialog visible={candidates.length > 0} onDismiss={() => !busy && setCandidates([])}>
        <Dialog.Title>Выберите найденный адрес</Dialog.Title>
        <Dialog.ScrollArea><FlatList data={candidates} keyExtractor={(candidate, index) => `${candidate.latitude}:${candidate.longitude}:${index}`}
          renderItem={({ item }) => <List.Item title={item.address} titleNumberOfLines={4} description="Нажмите, чтобы сохранить" disabled={busy} onPress={() => void save(item)} />}
        /></Dialog.ScrollArea>
        <Dialog.Actions><Button disabled={busy} onPress={() => setCandidates([])}>Отмена</Button></Dialog.Actions>
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
```


### `.gitignore`

```text
node_modules/
.expo/
dist/
.env
*.db
*.sqlite
*.log
```


### `src/geocode.ts`

```typescript
import { normalizeAddress, validCoordinates, type Candidate } from './place.ts';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export function parsePhoton(body: unknown, fallback: string): Candidate[] {
  if (!isRecord(body) || !Array.isArray(body.features)) throw new Error('Сервис вернул некорректный ответ.');
  const candidates: Candidate[] = [];
  for (const feature of body.features) {
    if (!isRecord(feature) || !isRecord(feature.geometry)) continue;
    const coordinates = feature.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') continue;
    const point = { longitude: coordinates[0], latitude: coordinates[1] };
    if (!validCoordinates(point)) continue;
    const properties = isRecord(feature.properties) ? feature.properties : {};
    const text = (name: string): string => typeof properties[name] === 'string' ? properties[name].trim() : '';
    const street = [text('street'), text('housenumber')].filter(Boolean).join(' ');
    const parts = [text('name'), street, text('postcode'), text('city') || text('town'), text('country')];
    const address = [...new Set(parts.filter(Boolean))].join(', ') || fallback;
    if (!candidates.some((entry) => entry.address === address && entry.latitude === point.latitude && entry.longitude === point.longitude)) {
      candidates.push({ ...point, address });
    }
  }
  return candidates;
}

export async function searchPlaces(address: string, request: typeof fetch = fetch): Promise<Candidate[]> {
  const query = normalizeAddress(address);
  if (!query) throw new Error('Введите адрес.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await request(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`, {
      signal: controller.signal, headers: { Accept: 'application/json' },
    });
    if (response.status === 429) throw new Error('Слишком частые запросы. Попробуйте чуть позже.');
    if (!response.ok) throw new Error(`Сервис адресов недоступен: HTTP ${response.status}.`);
    return parsePhoton(await response.json(), query);
  } catch (error: unknown) {
    if (controller.signal.aborted) throw new Error('Время поиска истекло. Попробуйте ещё раз.');
    if (error instanceof TypeError) throw new Error('Не удалось подключиться. Проверьте интернет.');
    throw error;
  } finally { clearTimeout(timer); }
}
```


### `src/MapCanvas.tsx`

```tsx
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
```


### `src/MapCanvas.web.tsx`

```tsx
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
```


### `src/place.ts`

```typescript
export type Coordinates = { latitude: number; longitude: number };
export type Candidate = Coordinates & { address: string };
export type Place = Candidate & { id: number };

export function validCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}

export function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}

export function validateCandidate(candidate: Candidate): void {
  if (!normalizeAddress(candidate.address)) throw new Error('Адрес не может быть пустым.');
  if (!validCoordinates(candidate)) throw new Error('Некорректные координаты адреса.');
}
```


### `src/schema.ts`

```typescript
export const CREATE_PLACES = `CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180)
)`;
export const INSERT_PLACE = 'INSERT INTO places (address, latitude, longitude) VALUES (?, ?, ?)';
export const SELECT_PLACES = 'SELECT id, address, latitude, longitude FROM places ORDER BY id DESC';
export const DELETE_PLACE = 'DELETE FROM places WHERE id = ?';
```


### `src/storage.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import { normalizeAddress, validateCandidate, type Candidate, type Place } from './place';
import { CREATE_PLACES, DELETE_PLACE, INSERT_PLACE, SELECT_PLACES } from './schema';

let database: Promise<SQLite.SQLiteDatabase> | undefined;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = SQLite.openDatabaseAsync('my-places.db').then(async (db) => {
      await db.execAsync(CREATE_PLACES);
      return db;
    }).catch((error: unknown) => { database = undefined; throw error; });
  }
  return database;
}

export async function listPlaces(): Promise<Place[]> {
  return (await getDatabase()).getAllAsync<Place>(SELECT_PLACES);
}

export async function savePlace(candidate: Candidate): Promise<void> {
  validateCandidate(candidate);
  const db = await getDatabase();
  await db.runAsync(INSERT_PLACE, normalizeAddress(candidate.address), candidate.latitude, candidate.longitude);
}

export async function deletePlace(id: number): Promise<void> {
  await (await getDatabase()).runAsync(DELETE_PLACE, id);
}
```


### `src/storage.web.ts`

```typescript
import { normalizeAddress, validateCandidate, type Candidate, type Place } from './place';

const KEY = 'my-places.web.v1';

export async function listPlaces(): Promise<Place[]> {
  const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  if (!Array.isArray(stored)) throw new Error('Повреждено локальное хранилище.');
  return stored.filter((value): value is Place => {
    if (!value || typeof value !== 'object') return false;
    const place = value as Place;
    try { validateCandidate(place); return Number.isSafeInteger(place.id); } catch { return false; }
  });
}

export async function savePlace(candidate: Candidate): Promise<void> {
  validateCandidate(candidate);
  const places = await listPlaces();
  const address = normalizeAddress(candidate.address);
  if (places.some((place) => place.address === address)) throw new Error('Этот адрес уже сохранён.');
  const id = Math.max(0, ...places.map((place) => place.id)) + 1;
  localStorage.setItem(KEY, JSON.stringify([{ id, ...candidate, address }, ...places]));
}

export async function deletePlace(id: number): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify((await listPlaces()).filter((place) => place.id !== id)));
}
```


### `tests/places.test.ts`

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { parsePhoton, searchPlaces } from '../src/geocode.ts';
import { validateCandidate } from '../src/place.ts';
import { CREATE_PLACES, DELETE_PLACE, INSERT_PLACE, SELECT_PLACES } from '../src/schema.ts';

test('Photon uses longitude first; invalid coordinates are ignored', () => {
  assert.deepEqual(parsePhoton({ features: [
    { geometry: { coordinates: [24.94, 60.17] }, properties: { street: 'Mannerheimintie', housenumber: '10', city: 'Helsinki' } },
    { geometry: { coordinates: [500, 60] } },
  ] }, 'fallback'), [{ latitude: 60.17, longitude: 24.94, address: 'Mannerheimintie 10, Helsinki' }]);
});

test('address and finite coordinate validation', () => {
  assert.throws(() => validateCandidate({ address: ' ', latitude: 60, longitude: 24 }));
  assert.throws(() => validateCandidate({ address: 'Helsinki', latitude: NaN, longitude: 24 }));
});

test('empty query is rejected before sending a request', async () => {
  let requested = false;
  const request = (async () => { requested = true; return new Response('{}'); }) as typeof fetch;
  await assert.rejects(searchPlaces('  ', request), /Введите адрес/);
  assert.equal(requested, false);
});

test('HTTP 429 and malformed responses give useful errors', async () => {
  await assert.rejects(searchPlaces('Helsinki', (async () => new Response('', { status: 429 })) as typeof fetch), /частые запросы/);
  assert.throws(() => parsePhoton({ wrong: [] }, 'Helsinki'), /некорректный ответ/);
});

test('SQLite stores quotes as data, rejects duplicates and deletes selected id', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(CREATE_PLACES);
    const insert = db.prepare(INSERT_PLACE);
    insert.run("Student's Road 1", 60.1, 24.1);
    insert.run('Another Road 2', 60.2, 24.2);
    assert.throws(() => insert.run("Student's Road 1", 60.1, 24.1));
    const rows = db.prepare(SELECT_PLACES).all();
    assert.equal(rows.length, 2);
    db.prepare(DELETE_PLACE).run(rows[0].id);
    assert.equal(db.prepare(SELECT_PLACES).all()[0].address, "Student's Road 1");
  } finally { db.close(); }
});
```
