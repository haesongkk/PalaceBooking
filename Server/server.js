const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const Database = require("better-sqlite3");
const db = new Database("data.db");
const roomDb = new Database("room.db");
const closureDb = new Database("closure.db");

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

    // [AUTO_CONFIRM_TEST] 테스트용: 예약 생성 시 자동 확정 처리
    db.prepare('UPDATE reservations SET confirmed = 1 WHERE id = ?').run(info.lastInsertRowid);
    // 관리자에게 실시간 알림
    if (io) io.to("admin").emit("reservation-updated");
    // 해당 예약자에게 실시간 확정 알림
    const row = db.prepare('SELECT phone FROM reservations WHERE id = ?').get(info.lastInsertRowid);
    if (row && row.phone) io.to(`user_${row.phone}`).emit("reservation-confirmed", { id: info.lastInsertRowid });

    res.json({ success: true, id: info.lastInsertRowid });
});

app.post("/api/cancel", (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "예약 ID가 필요합니다." });
    }

    // 완전 삭제로 변경
    const stmt = db.prepare(`
        DELETE FROM reservations
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

    // [AUTO_CONFIRM_TEST] 테스트용: 예약 생성 시 자동 확정 처리
    db.prepare('UPDATE reservations SET confirmed = 1 WHERE id = ?').run(info.lastInsertRowid);
    // 관리자에게 실시간 알림
    if (io) io.to("admin").emit("reservation-updated");
    // 해당 예약자에게 실시간 확정 알림
    const row = db.prepare('SELECT phone FROM reservations WHERE id = ?').get(info.lastInsertRowid);
    if (row && row.phone) io.to(`user_${row.phone}`).emit("reservation-confirmed", { id: info.lastInsertRowid });

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

// 전체 예약 내역 조회 (배열 반환)
app.get("/reservationList", (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: "전화번호가 필요합니다." });
    }

    const stmt = db.prepare(`
        SELECT *
        FROM reservations
        WHERE phone = ? AND cancelled = 0
        ORDER BY end_date DESC
    `);

    const rows = stmt.all(phone);

    res.json(rows);
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
    
    try {
        // room.db에서 객실 목록 가져오기
        const roomRows = roomDb.prepare('SELECT name FROM rooms').all();
        const totalRooms = {};
        
        // 각 객실에 기본 총 객실 수 설정 (기본값: 5개)
        roomRows.forEach(room => {
            totalRooms[room.name] = 5; // 기본값
        });
        
        // 기존 하드코딩된 객실들도 포함 (호환성 유지)
        const defaultRooms = {
            "🖥️ 2PC": 5,
            "🎥 멀티플렉스": 4,
            "🎤 노래방": 3,
            "🛏️ 스탠다드": 10,
            "🛌 트윈": 6
        };
        
        // 기본 객실들을 totalRooms에 추가
        Object.assign(totalRooms, defaultRooms);
        
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
    } catch (error) {
        console.error('객실 재고 조회 오류:', error);
        res.status(500).json({ error: '객실 재고 조회 실패' });
    }
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

// 객실 관리 테이블 생성
roomDb.prepare(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    checkInOut TEXT,
    price TEXT, -- JSON 배열 형태: [월요일가격, 화요일가격, 수요일가격, 목요일가격, 금요일가격, 토요일가격, 일요일가격]
    status TEXT,
    usageTime TEXT,
    openClose TEXT,
    rentalPrice TEXT, -- JSON 배열 형태: [월요일가격, 화요일가격, 수요일가격, 목요일가격, 금요일가격, 토요일가격, 일요일가격]
    rentalStatus TEXT
  )
`).run();

// 기존 테이블에서 사용되지 않는 컬럼들 제거 (마이그레이션)
try { roomDb.prepare('ALTER TABLE rooms DROP COLUMN extraPerson').run(); } catch (e) {}
try { roomDb.prepare('ALTER TABLE rooms DROP COLUMN walkDiscount').run(); } catch (e) {}
try { roomDb.prepare('ALTER TABLE rooms DROP COLUMN rentalExtraPerson').run(); } catch (e) {}
try { roomDb.prepare('ALTER TABLE rooms DROP COLUMN rentalWalkDiscount').run(); } catch (e) {}
try { roomDb.prepare('ALTER TABLE rooms DROP COLUMN created_at').run(); } catch (e) {}
try { roomDb.prepare('ALTER TABLE rooms DROP COLUMN updated_at').run(); } catch (e) {}

// 잘못된 JSON 데이터 수정 (마이그레이션)
try {
    const rooms = roomDb.prepare('SELECT * FROM rooms').all();
    rooms.forEach(room => {
        let needsUpdate = false;
        let updateData = {};
        
        // price 필드 수정
        if (room.price) {
            try {
                JSON.parse(room.price);
            } catch (e) {
                // 잘못된 JSON이면 기본값으로 수정
                updateData.price = JSON.stringify(Array(7).fill(50000));
                needsUpdate = true;
            }
        } else {
            updateData.price = JSON.stringify(Array(7).fill(50000));
            needsUpdate = true;
        }
        
        // rentalPrice 필드 수정
        if (room.rentalPrice) {
            try {
                JSON.parse(room.rentalPrice);
            } catch (e) {
                // 잘못된 JSON이면 기본값으로 수정
                updateData.rentalPrice = JSON.stringify(Array(7).fill(30000));
                needsUpdate = true;
            }
        } else {
            updateData.rentalPrice = JSON.stringify(Array(7).fill(30000));
            needsUpdate = true;
        }
        
        // 다른 필드들도 수정
        if (!room.checkInOut) {
            updateData.checkInOut = JSON.stringify(Array(7).fill('16:00~13:00'));
            needsUpdate = true;
        }
        
        if (!room.status) {
            updateData.status = JSON.stringify(Array(7).fill('판매'));
            needsUpdate = true;
        }
        
        if (!room.usageTime) {
            updateData.usageTime = JSON.stringify(Array(7).fill('5시간'));
            needsUpdate = true;
        }
        
        if (!room.openClose) {
            updateData.openClose = JSON.stringify(Array(7).fill('14:00~22:00'));
            needsUpdate = true;
        }
        
        if (!room.rentalStatus) {
            updateData.rentalStatus = JSON.stringify(Array(7).fill('판매'));
            needsUpdate = true;
        }
        
        // 업데이트가 필요한 경우 실행
        if (needsUpdate) {
            const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(room.id);
            
            roomDb.prepare(`UPDATE rooms SET ${setClause} WHERE id = ?`).run(...values);
            console.log(`객실 ${room.id} 데이터 마이그레이션 완료`);
        }
    });
} catch (e) {
    console.error('데이터 마이그레이션 오류:', e);
}

// 날짜별 요금 테이블 생성
roomDb.prepare(`
  CREATE TABLE IF NOT EXISTS daily_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    room_id TEXT NOT NULL,
    room_type TEXT NOT NULL, -- 'daily' 또는 'overnight'
    price INTEGER NOT NULL,
    status TEXT DEFAULT '판매',
    details TEXT, -- 시간 정보 (예: "14:00~22:00" 또는 "16:00~13:00")
    usage_time TEXT, -- 이용시간 (대실용)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, room_id, room_type)
  )
`).run();

// 마감 설정 테이블 생성
closureDb.prepare(`
  CREATE TABLE IF NOT EXISTS closures (
    id TEXT PRIMARY KEY,
    date TEXT,
    rooms TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 객실 관리 API
// 모든 객실 조회
app.get('/api/admin/rooms', (req, res) => {
    try {
        const rows = roomDb.prepare('SELECT * FROM rooms ORDER BY name').all();
        
        // JSON 문자열을 배열로 파싱
        const parsedRows = rows.map(row => ({
            ...row,
            price: row.price ? JSON.parse(row.price) : [],
            rentalPrice: row.rentalPrice ? JSON.parse(row.rentalPrice) : []
        }));
        
        res.json(parsedRows);
    } catch (error) {
        console.error('객실 조회 오류:', error);
        res.status(500).json({ error: '객실 조회 실패' });
    }
});

// 객실 저장/수정 (upsert)
app.post('/api/admin/rooms', (req, res) => {
    try {
        const { id, name, checkInOut, price, status, usageTime, openClose, rentalPrice, rentalStatus } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: '객실 ID와 이름은 필수입니다.' });
        }

        // 가격 배열을 JSON 문자열로 변환
        const priceJson = Array.isArray(price) ? JSON.stringify(price) : price;
        const rentalPriceJson = Array.isArray(rentalPrice) ? JSON.stringify(rentalPrice) : rentalPrice;

        // 기존 객실 확인
        const existingRoom = roomDb.prepare('SELECT id FROM rooms WHERE id = ?').get(id);
        
        if (existingRoom) {
            // 기존 객실 수정
            roomDb.prepare(`
                UPDATE rooms 
                SET name = ?, checkInOut = ?, price = ?, status = ?, usageTime = ?, 
                    openClose = ?, rentalPrice = ?, rentalStatus = ?
                WHERE id = ?
            `).run(name, checkInOut, priceJson, status, usageTime, openClose, rentalPriceJson, rentalStatus, id);
        } else {
            // 새 객실 생성
            roomDb.prepare(`
                INSERT INTO rooms (id, name, checkInOut, price, status, usageTime, openClose, rentalPrice, rentalStatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, name, checkInOut, priceJson, status, usageTime, openClose, rentalPriceJson, rentalStatus);
        }
        
        res.json({ success: true, id });
    } catch (error) {
        console.error('객실 저장 오류:', error);
        res.status(500).json({ error: '객실 저장 실패' });
    }
});

// 객실 삭제
app.delete('/api/admin/rooms/:id', (req, res) => {
    try {
        const { id } = req.params;
        const info = roomDb.prepare('DELETE FROM rooms WHERE id = ?').run(id);
        res.json({ success: info.changes > 0 });
    } catch (error) {
        console.error('객실 삭제 오류:', error);
        res.status(500).json({ error: '객실 삭제 실패' });
    }
});



// 마감 설정 관리 API
// 모든 마감 설정 조회
app.get('/api/admin/closures', (req, res) => {
    try {
        const rows = closureDb.prepare('SELECT * FROM closures ORDER BY date ASC').all();
        res.json(rows);
    } catch (error) {
        console.error('마감 설정 조회 오류:', error);
        res.status(500).json({ error: '마감 설정 조회 실패' });
    }
});

// 마감 설정 저장/수정 (upsert)
app.post('/api/admin/closures', (req, res) => {
    try {
        const { id, date, rooms } = req.body;
        
        if (!id || !date || !rooms) {
            return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
        }

        // 기존 마감 설정 확인
        const existingClosure = closureDb.prepare('SELECT id FROM closures WHERE id = ?').get(id);
        
        if (existingClosure) {
            // 기존 마감 설정 수정
            closureDb.prepare(`
                UPDATE closures 
                SET date = ?, rooms = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(date, rooms, id);
        } else {
            // 새 마감 설정 생성
            closureDb.prepare(`
                INSERT INTO closures (id, date, rooms)
                VALUES (?, ?, ?)
            `).run(id, date, rooms);
        }
        
        res.json({ success: true, id });
    } catch (error) {
        console.error('마감 설정 저장 오류:', error);
        res.status(500).json({ error: '마감 설정 저장 실패' });
    }
});

// 마감 설정 삭제
app.delete('/api/admin/closures/:id', (req, res) => {
    try {
        const { id } = req.params;
        const info = closureDb.prepare('DELETE FROM closures WHERE id = ?').run(id);
        res.json({ success: info.changes > 0 });
    } catch (error) {
        console.error('마감 설정 삭제 오류:', error);
        res.status(500).json({ error: '마감 설정 삭제 실패' });
    }
});

// 날짜별 요금 관리 API
// 특정 날짜의 모든 객실 요금 조회
app.get('/api/admin/daily-prices', (req, res) => {
    try {
        const { date, room_type } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: '날짜가 필요합니다.' });
        }
        
        let query = 'SELECT * FROM daily_prices WHERE date = ?';
        let params = [date];
        
        if (room_type) {
            query += ' AND room_type = ?';
            params.push(room_type);
        }
        
        query += ' ORDER BY room_id ASC';
        
        const rows = roomDb.prepare(query).all(...params);
        res.json(rows);
    } catch (error) {
        console.error('날짜별 요금 조회 오류:', error);
        res.status(500).json({ error: '날짜별 요금 조회 실패' });
    }
});

// 날짜별 요금 저장/수정 (upsert)
app.post('/api/admin/daily-prices', (req, res) => {
    try {
        const { date, room_id, room_type, price, status, details, usage_time } = req.body;
        
        if (!date || !room_id || !room_type || price === undefined) {
            return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
        }

        // 기존 요금 설정 확인
        const existingPrice = roomDb.prepare('SELECT id FROM daily_prices WHERE date = ? AND room_id = ? AND room_type = ?').get(date, room_id, room_type);
        
        if (existingPrice) {
            // 기존 요금 설정 수정
            roomDb.prepare(`
                UPDATE daily_prices 
                SET price = ?, status = ?, details = ?, usage_time = ?, updated_at = CURRENT_TIMESTAMP
                WHERE date = ? AND room_id = ? AND room_type = ?
            `).run(price, status || '판매', details, usage_time, date, room_id, room_type);
        } else {
            // 새 요금 설정 생성
            roomDb.prepare(`
                INSERT INTO daily_prices (date, room_id, room_type, price, status, details, usage_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(date, room_id, room_type, price, status || '판매', details, usage_time);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('날짜별 요금 저장 오류:', error);
        res.status(500).json({ error: '날짜별 요금 저장 실패' });
    }
});

// 여러 날짜의 요금 일괄 저장
app.post('/api/admin/daily-prices/bulk', (req, res) => {
    try {
        const { prices } = req.body;
        
        if (!prices || !Array.isArray(prices)) {
            return res.status(400).json({ error: '요금 데이터가 필요합니다.' });
        }

        // 트랜잭션 시작
        const transaction = roomDb.transaction(() => {
            prices.forEach(({ date, room_id, room_type, price, status, details, usage_time }) => {
                if (!date || !room_id || !room_type || price === undefined) {
                    throw new Error('필수 정보가 누락되었습니다.');
                }

                // 기존 요금 설정 확인
                const existingPrice = roomDb.prepare('SELECT id FROM daily_prices WHERE date = ? AND room_id = ? AND room_type = ?').get(date, room_id, room_type);
                
                if (existingPrice) {
                    // 기존 요금 설정 수정
                    roomDb.prepare(`
                        UPDATE daily_prices 
                        SET price = ?, status = ?, details = ?, usage_time = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE date = ? AND room_id = ? AND room_type = ?
                    `).run(price, status || '판매', details, usage_time, date, room_id, room_type);
                } else {
                    // 새 요금 설정 생성
                    roomDb.prepare(`
                        INSERT INTO daily_prices (date, room_id, room_type, price, status, details, usage_time)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(date, room_id, room_type, price, status || '판매', details, usage_time);
                }
            });
        });

        // 트랜잭션 실행
        transaction();
        
        res.json({ success: true, count: prices.length });
    } catch (error) {
        console.error('날짜별 요금 일괄 저장 오류:', error);
        res.status(500).json({ error: '날짜별 요금 일괄 저장 실패' });
    }
});

// 날짜별 요금 삭제
app.delete('/api/admin/daily-prices/:date/:room_id/:room_type', (req, res) => {
    try {
        const { date, room_id, room_type } = req.params;
        const info = roomDb.prepare('DELETE FROM daily_prices WHERE date = ? AND room_id = ? AND room_type = ?').run(date, room_id, room_type);
        res.json({ success: info.changes > 0 });
    } catch (error) {
        console.error('날짜별 요금 삭제 오류:', error);
        res.status(500).json({ error: '날짜별 요금 삭제 실패' });
    }
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

// Dev API: Get available DB files
app.get('/api/dev/dbs', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 현재 디렉토리에서 .db 파일들 찾기
    const dbFiles = fs.readdirSync('.')
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        displayName: file.replace('.db', ''),
        icon: getDbIcon(file)
      }));
    
    res.json(dbFiles);
  } catch (error) {
    console.error('DB files fetch error:', error);
    res.status(500).json({ error: 'Failed to get DB files' });
  }
});

// Dev API: Get all DB data for development
app.get('/api/dev/db/:dbName', (req, res) => {
  try {
    const { dbName } = req.params;
    let targetDb;
    
    // 동적으로 DB 파일 찾기
    const fs = require('fs');
    const dbFileName = `${dbName}.db`;
    
    if (!fs.existsSync(dbFileName)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    // DB 연결
    const Database = require("better-sqlite3");
    targetDb = new Database(dbFileName);
    
    // 모든 테이블 조회
    const tables = targetDb.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    const result = {};
    
    tables.forEach(table => {
      const tableName = table.name;
      try {
        // 각 테이블의 모든 데이터 조회
        const rows = targetDb.prepare(`SELECT * FROM ${tableName}`).all();
        result[tableName] = rows;
      } catch (error) {
        console.error(`Error reading table ${tableName}:`, error);
        result[tableName] = { error: error.message };
      }
    });
    
    // DB 연결 닫기
    targetDb.close();
    
    res.json(result);
  } catch (error) {
    console.error('DB data fetch error:', error);
    res.status(500).json({ error: 'Database access failed' });
  }
});

// DB 파일별 아이콘 반환 함수
function getDbIcon(fileName) {
  const name = fileName.replace('.db', '').toLowerCase();
  switch (name) {
    case 'data': return '📊';
    case 'room': return '🏠';
    case 'closure': return '🔒';
    default: return '🗄️';
  }
}


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
