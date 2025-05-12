const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const Database = require("better-sqlite3");
const db = new Database("data.db");

const app = express();
const PORT = 3000;

// 최초 실행 시 테이블 생성
db.prepare(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    phone TEXT,
    room TEXT,
    start_date TEXT,
    end_date TEXT,
    cancelled INTEGER DEFAULT 0
  )
`).run();


app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../Client")));

app.post("/api/reserve", (req, res) => {
    const { username, phone, room, startDate, endDate } = req.body;
    if (!username || !phone || !room || !startDate) {
        return res.status(400).json({ error: "필수 정보 누락" });
    }

    const stmt = db.prepare(`
        INSERT INTO reservations (username, phone, room, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(username, phone, room, startDate, endDate);

    res.json({ success: true, id: info.lastInsertRowid });
});

app.post("/initDummy", (req, res) => {
    db.prepare(`DELETE FROM reservations`).run();

    const insert = db.prepare(`
        INSERT INTO reservations (username, phone, room, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
    `);

    insert.run("춘식이", "01011111111", "🛏️ 스탠다드 (45,000원)", "2023-04-10", "2023-04-11");
    insert.run("라이언", "01022222222", "🖥️ 2PC (60,000원)", "2025-05-01", "2025-05-02");

    res.json({ success: true });
});

app.get("/recentReserve", (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: "전화번호가 필요합니다." });
    }

    const stmt = db.prepare(`
        SELECT *
        FROM reservations
        WHERE phone = ? AND cancelled = 0
        ORDER BY end_date DESC
        LIMIT 1
    `);

    const row = stmt.get(phone);

    if (row) {
        res.json(row);
    } else {
        res.json({
            id: null,
            username: null,
            phone: null,
            room: null,
            start_date: null,
            end_date: null,
            cancelled: null
        });
    }
});


app.listen(PORT, () => {
    console.log(`서버 실행됨 http://localhost:${PORT}`);
});
