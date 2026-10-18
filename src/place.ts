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
