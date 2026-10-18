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
