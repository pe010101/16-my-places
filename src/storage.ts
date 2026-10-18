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
