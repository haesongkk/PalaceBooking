const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const Database = require("better-sqlite3");
const db = new Database("data.db");

const http = require("http");
const { Server: SocketIOServer } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000;

// 최초 실행 시 테이블 생성
// 'confirmed' 컬럼(예약 확정 여부) 추가
try {
    db.prepare(`ALTER TABLE reservations ADD COLUMN confirmed INTEGER DEFAULT 0`).run();
} catch (e) {
    // 이미 컬럼이 있으면 무시
}
db.prepare(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    phone TEXT,
    room TEXT,
    start_date TEXT,
    end_date TEXT,
    cancelled INTEGER DEFAULT 0,
    confirmed INTEGER DEFAULT 0
  )
`).run();


app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../Client")));
// Serve Admin page (case-sensitive path)
app.use('/admin', express.static(path.join(__dirname, '../Admin')));
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin/index.html'));
});

// 결제 성공 페이지
app.get("/success", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>결제 성공</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: green; font-size: 24px; }
                .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="success">✅ 결제가 성공했습니다!</div>
            <p>예약이 완료되었습니다.</p>
            <button class="btn" onclick="if(window.opener){window.opener.postMessage('payment-success','*');window.close();}else{window.location.href='/';}">메인으로 돌아가기</button>
        </body>
        </html>
    `);
});

// 결제 실패 페이지
app.get("/fail", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>결제 실패</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .fail { color: red; font-size: 24px; }
                .btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="fail">❌ 결제에 실패했습니다.</div>
            <p>다시 시도해주세요.</p>
            <button class="btn" onclick="if(window.opener){window.opener.postMessage('payment-fail','*');window.close();}else{window.location.href='/';}">메인으로 돌아가기</button>
        </body>
        </html>
    `);
});

// 예약 추가 시 관리자에게 실시간 알림
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

    // 관리자에게 실시간 알림
    if (io) io.to("admin").emit("reservation-updated");

    res.json({ success: true, id: info.lastInsertRowid });
});

app.post("/api/cancel", (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "예약 ID가 필요합니다." });
    }

    const stmt = db.prepare(`
        UPDATE reservations 
        SET cancelled = 1 
        WHERE id = ?
    `);
    const info = stmt.run(id);

    if (info.changes > 0) {
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "예약을 찾을 수 없습니다." });
    }
});

// 결제 후 예약 추가도 동일하게 알림
app.post("/api/payment", (req, res) => {
    const { username, phone, room, startDate, endDate, paymentMethod } = req.body;
    
    if (!username || !phone || !room || !startDate || !paymentMethod) {
        return res.status(400).json({ error: "필수 정보 누락" });
    }

    // 결제 금액 계산 (간단한 예시)
    const roomPrices = {
        "🖥️ 2PC (60,000원)": 60000,
        "🎥 멀티플렉스 (50,000원)": 50000,
        "🎤 노래방 (60,000원)": 60000,
        "🛏️ 스탠다드 (45,000원)": 45000,
        "🛌 트윈 (50,000원)": 50000
    };
    
    const amount = roomPrices[room] || 50000;
    
    // 예약 정보를 DB에 저장
    const stmt = db.prepare(`
        INSERT INTO reservations (username, phone, room, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(username, phone, room, startDate, endDate);
    
    // 관리자에게 실시간 알림
    if (io) io.to("admin").emit("reservation-updated");

    // 결제 정보 응답
    res.json({
        success: true,
        reservationId: info.lastInsertRowid,
        amount: amount,
        orderId: `order_${Date.now()}_${info.lastInsertRowid}`,
        orderName: `${room} 예약`,
        customerName: username,
        customerEmail: `${phone}@palace.com`
    });
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

// 관리자용 예약 목록 조회 API
app.get('/api/admin/reservations', (req, res) => {
    const rows = db.prepare(`
        SELECT * FROM reservations ORDER BY id DESC
    `).all();
    res.json(rows);
});

// 관리자용 예약 확정 API
// 예약 확정 시 관리자+해당 예약자에게 실시간 알림
app.post('/api/admin/confirm', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: '예약 ID가 필요합니다.' });
    }
    const stmt = db.prepare(`UPDATE reservations SET confirmed = 1 WHERE id = ?`);
    const info = stmt.run(id);
    if (info.changes > 0) {
        // 예약자 전화번호 조회
        const row = db.prepare('SELECT phone FROM reservations WHERE id = ?').get(id);
        // 관리자에게 실시간 알림
        if (io) io.to("admin").emit("reservation-updated");
        // 해당 예약자에게 실시간 확정 알림
        if (row && row.phone) io.to(`user_${row.phone}`).emit("reservation-confirmed", { id });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
    }
});

// 2. 서버 시작 시 특가 상품 디폴트 등록
// 특가 상품 테이블에 stock(수량) 컬럼 추가
try {
    db.prepare('ALTER TABLE specials ADD COLUMN stock INTEGER DEFAULT 10').run();
} catch (e) {}

try {
    db.prepare(`CREATE TABLE IF NOT EXISTS specials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        roomType TEXT,
        price INTEGER,
        start_date TEXT,
        end_date TEXT,
        stock INTEGER DEFAULT 10
    )`).run();
    // 디폴트 특가 상품 등록 (중복 방지)
    // 기본 특가 상품 등록 코드 제거
} catch (e) {}

// 특가 상품 목록 조회
app.get('/api/admin/specials', (req, res) => {
    const rows = db.prepare('SELECT * FROM specials ORDER BY id DESC').all();
    res.json(rows);
});
// 특가 상품 추가
app.post('/api/admin/specials', (req, res) => {
    const { name, roomType, price, start_date, end_date, stock } = req.body;
    if (!name || !price || !roomType) return res.status(400).json({ error: '필수 정보 누락' });
    const info = db.prepare('INSERT INTO specials (name, roomType, price, start_date, end_date, stock) VALUES (?, ?, ?, ?, ?, ?)')
        .run(name, roomType, price, start_date, end_date, stock ?? 10);
    res.json({ success: true, id: info.lastInsertRowid });
});
// 특가 상품 수정
app.put('/api/admin/specials/:id', (req, res) => {
    const { id } = req.params;
    const { name, roomType, price, start_date, end_date, stock } = req.body;
    const info = db.prepare('UPDATE specials SET name=?, roomType=?, price=?, start_date=?, end_date=?, stock=? WHERE id=?')
        .run(name, roomType, price, start_date, end_date, stock ?? 10, id);
    res.json({ success: info.changes > 0 });
});
// 특가 상품 삭제
app.delete('/api/admin/specials/:id', (req, res) => {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM specials WHERE id=?').run(id);
    res.json({ success: info.changes > 0 });
});

// 객실별 남은 객실 수 반환 API
app.get('/api/admin/roomCounts', (req, res) => {
    // 객실별 총 객실 수(임의 지정)
    const totalRooms = {
        "🖥️ 2PC (60,000원)": 5,
        "🎥 멀티플렉스 (50,000원)": 4,
        "🎤 노래방 (60,000원)": 3,
        "🛏️ 스탠다드 (45,000원)": 10,
        "🛌 트윈 (50,000원)": 6
    };
    // 예약된 객실 수 집계
    const rows = db.prepare('SELECT room, COUNT(*) as cnt FROM reservations WHERE cancelled=0 AND confirmed=1 GROUP BY room').all();
    const used = {};
    rows.forEach(r => { used[r.room] = r.cnt; });
    // 남은 객실 수 계산
    const result = {};
    for (const room in totalRooms) {
        result[room] = totalRooms[room] - (used[room] || 0);
    }
    res.json(result);
});

// 날짜별 객실 재고 테이블 생성
try {
    db.prepare(`CREATE TABLE IF NOT EXISTS room_stock (
        date TEXT,
        room_type TEXT,
        stock INTEGER,
        PRIMARY KEY(date, room_type)
    )`).run();
} catch (e) {}

// room_stock 테이블에 reserved(예약 수) 컬럼 추가(없으면)
try {
    db.prepare('ALTER TABLE room_stock ADD COLUMN reserved INTEGER DEFAULT 0').run();
} catch (e) {}

// GET: 날짜별 객실 예약 수 조회 (stock=총 객실 수, reserved=예약 수)
app.get('/api/admin/roomStock', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: '날짜 필요' });
    // 객실별 총 객실 수(고정)
    const totalRooms = {
        "🖥️ 2PC (60,000원)": 5,
        "🎥 멀티플렉스 (50,000원)": 4,
        "🎤 노래방 (60,000원)": 3,
        "🛏️ 스탠다드 (45,000원)": 10,
        "🛌 트윈 (50,000원)": 6
    };
    // DB에서 해당 날짜의 예약 수 조회
    const rows = db.prepare('SELECT room_type, reserved FROM room_stock WHERE date = ?').all(date);
    const reservedMap = {};
    rows.forEach(r => { reservedMap[r.room_type] = r.reserved; });
    // 결과 조합
    const result = [];
    for (const room in totalRooms) {
        const total = totalRooms[room];
        const reserved = reservedMap[room] || 0;
        result.push({ room_type: room, reserved, total });
    }
    res.json(result);
});

// POST: 날짜별 객실 예약 수 조정
app.post('/api/admin/roomStock', (req, res) => {
    const { date, room_type, reserved } = req.body;
    if (!date || !room_type || typeof reserved !== 'number') return res.status(400).json({ error: '필수값 누락' });
    // upsert
    const exists = db.prepare('SELECT 1 FROM room_stock WHERE date=? AND room_type=?').get(date, room_type);
    if (exists) {
        db.prepare('UPDATE room_stock SET reserved=? WHERE date=? AND room_type=?').run(reserved, date, room_type);
    } else {
        db.prepare('INSERT INTO room_stock (date, room_type, reserved) VALUES (?, ?, ?)').run(date, room_type, reserved);
    }
    res.json({ success: true });
});

// Serve /dev page for log viewing (now from top-level Dev folder)
app.use('/dev', express.static(path.join(__dirname, '../Dev')));
app.get('/dev', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dev/index.html'));
});

// Ensure user_logs table has 'nick' column
try {
  db.prepare('ALTER TABLE user_logs ADD COLUMN nick TEXT').run();
} catch (e) {}
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nick TEXT,
    sender TEXT,
    type TEXT,
    content TEXT,
    timestamp TEXT
  )
`).run();

// API: Save a log
app.post('/api/log', (req, res) => {
  const { nick, sender, type, content, timestamp } = req.body;
  db.prepare(`INSERT INTO user_logs (nick, sender, type, content, timestamp) VALUES (?, ?, ?, ?, ?)`)
    .run(nick, sender, type, content, timestamp);
  res.json({ success: true });
});

// API: Get all unique nicks
app.get('/api/logs/all', (req, res) => {
  const rows = db.prepare('SELECT nick, MIN(timestamp) as first_ts, COUNT(*) as cnt FROM user_logs WHERE nick IS NOT NULL GROUP BY nick ORDER BY first_ts DESC').all();
  res.json(rows);
});

// API: Get logs by nick
app.get('/api/logs', (req, res) => {
  const { nick } = req.query;
  if (!nick) return res.status(400).json({ error: 'nick required' });
  const rows = db.prepare('SELECT * FROM user_logs WHERE nick = ? ORDER BY id ASC').all(nick);
  res.json(rows);
});


const os = require("os");

const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: "*" }
});

// 소켓 연결 관리
io.on("connection", (socket) => {
    console.log("소켓 연결됨:", socket.id);
    // 클라이언트가 본인 전화번호로 join할 수 있도록 이벤트 준비
    socket.on("join", (phone) => {
        socket.join(`user_${phone}`);
    });
    // 관리자 페이지는 'admin' 방에 join
    socket.on("admin", () => {
        socket.join("admin");
    });
});

server.listen(PORT, "0.0.0.0", () => {
    const interfaces = os.networkInterfaces();
    let ip = "localhost";
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                ip = iface.address;
            }
        }
    }
    console.log(`서버 실행됨: http://${ip}:${PORT}`);
});
