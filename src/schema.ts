export const CREATE_PLACES = `CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180)
)`;
export const INSERT_PLACE = 'INSERT INTO places (address, latitude, longitude) VALUES (?, ?, ?)';
export const SELECT_PLACES = 'SELECT id, address, latitude, longitude FROM places ORDER BY id DESC';
export const DELETE_PLACE = 'DELETE FROM places WHERE id = ?';
