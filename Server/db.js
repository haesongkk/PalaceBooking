const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 생성 (없으면 자동 생성됨)
const db = new Database(path.join(__dirname, 'database.sqlite'));

// 테이블 생성 (존재하지 않으면)
db.prepare(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    cancelled INTEGER DEFAULT 0
  )
`).run();

// ✅ 예약 추가
function addReservation(text) {
  const stmt = db.prepare('INSERT INTO reservations (text) VALUES (?)');
  const info = stmt.run(text);
  return info.lastInsertRowid;
}

// ✅ 예약 조회
function getReservations() {
  const stmt = db.prepare('SELECT * FROM reservations');
  return stmt.all();
}

// ✅ 예약 취소
function cancelReservation(id) {
  const stmt = db.prepare('UPDATE reservations SET cancelled = 1 WHERE id = ?');
  return stmt.run(id);
}

module.exports = {
  addReservation,
  getReservations,
  cancelReservation
};
