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
