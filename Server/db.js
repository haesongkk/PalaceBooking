const Database = require("better-sqlite3");
const db = new Database("data.db");

// 예약 테이블: 닉네임, 전화번호, 방, 시작일, 종료일
db.prepare(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT,
    phone TEXT,
    room TEXT,
    start_date TEXT,
    end_date TEXT,
    cancelled INTEGER DEFAULT 0
  )
`).run();

function addDetailedReservation({ nickname, phone, room, startDate, endDate }) {
    const stmt = db.prepare(`
    INSERT INTO reservations (nickname, phone, room, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)
  `);
    const info = stmt.run(nickname, phone, room, startDate, endDate);
    return info.lastInsertRowid;
}

function getLastReservation(nickname, phone) {
    const stmt = db.prepare(`
    SELECT start_date, end_date, room FROM reservations
    WHERE nickname = ? AND phone = ? AND cancelled = 0
    ORDER BY start_date DESC
    LIMIT 1
  `);
    return stmt.get(nickname, phone);
}

module.exports = {
    addDetailedReservation,
    getLastReservation
};
