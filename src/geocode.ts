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
