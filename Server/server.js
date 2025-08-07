const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const Database = require("better-sqlite3");
const db = new Database("data.db");
const roomDb = new Database("room.db");

// 고객 관리 모듈 추가
const customersModule = require("./customers");


const http = require("http");
const { Server: SocketIOServer } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000;






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
            <p>예약이 접수되었습니다. 관리자 승인 후 확정됩니다.</p>
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

    try {
        const stmt = db.prepare(`
            INSERT INTO reservations (username, phone, room, start_date, end_date)
            VALUES (?, ?, ?, ?, ?)
        `);
        const info = stmt.run(username, phone, room, startDate, endDate);

        // 관리자에게 실시간 알림
        if (io) io.to("admin").emit("reservation-updated");

        res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        console.error('예약 생성 오류:', error);
        res.status(500).json({ error: "예약 생성 중 오류가 발생했습니다." });
    }
});


// 결제 후 예약 추가도 동일하게 알림
app.post("/api/payment", (req, res) => {
    const { username, phone, room, startDate, endDate, paymentMethod } = req.body;
    
    if (!username || !phone || !room || !startDate || !paymentMethod) {
        return res.status(400).json({ error: "필수 정보 누락" });
    }

    // 가격 정보는 클라이언트에서 계산되어 전달되어야 함
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "유효한 가격 정보가 필요합니다." });
    }
    
    try {
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
    } catch (error) {
        console.error('결제 예약 생성 오류:', error);
        res.status(500).json({ error: "결제 예약 생성 중 오류가 발생했습니다." });
    }
});

// 전체 예약 내역 조회 (배열 반환)
app.get("/reservationList", (req, res) => {
    const { phone } = req.query;
    console.log(phone);
    if (!phone) {
        return res.status(400).json({ error: "전화번호가 필요합니다." });
    }

    const stmt = db.prepare(`
        SELECT *
        FROM reservations
        WHERE phone = ? AND state != -1
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
    const rows = db.prepare('SELECT room, COUNT(*) as cnt FROM reservations WHERE state=1 GROUP BY room').all();
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

// GET: 날짜별 객실 판매/마감 상태 조회
app.get('/api/admin/roomStock', (req, res) => {
    const { date } = req.query;
    console.log('[서버] roomStock 요청:', { date });
    if (!date) return res.status(400).json({ error: '날짜 필요' });
    
    try {
        // room.db에서 객실 목록과 상태 정보 가져오기
        const roomRows = roomDb.prepare('SELECT * FROM rooms').all();
        console.log('[서버] rooms 테이블 조회 결과:', roomRows);
        
        // daily_prices 테이블에서 해당 날짜의 판매/마감 상태 조회
        const dailyPrices = roomDb.prepare('SELECT room_id, room_type, status FROM daily_prices WHERE date = ?').all(date);
        console.log('[서버] daily_prices 조회 결과:', dailyPrices);
        
        // 요일 계산 (0: 일요일, 1: 월요일, ..., 6: 토요일)
        const requestDate = new Date(date);
        const dayOfWeek = requestDate.getDay();
        console.log('[서버] 요일:', dayOfWeek);
        
        // 결과 조합
        const result = [];
        roomRows.forEach(room => {
            // daily_prices에서 해당 객실의 상태 확인 (room_id 또는 room_type으로 매칭)
            const dailyPrice = dailyPrices.find(dp => 
                dp.room_id === room.id || 
                dp.room_id === room.name || 
                dp.room_type === room.name ||
                dp.room_id === room.id.toLowerCase() ||
                dp.room_id === room.name.toLowerCase()
            );
            
            if (dailyPrice) {
                // daily_prices에 데이터가 있으면 해당 상태 사용 (우선순위)
                console.log('[서버] daily_prices 사용:', { room: room.name, status: dailyPrice.status });
                result.push({ 
                    room_type: room.name, 
                    available: dailyPrice.status === 1, // 1: 판매, 0: 마감
                    status: dailyPrice.status 
                });
            } else {
                // daily_prices에 데이터가 없으면 rooms 테이블의 해당 요일 상태 사용
                let roomStatus = 1; // 기본값: 판매
                if (room.status) {
                    try {
                        const statusArray = JSON.parse(room.status);
                        if (statusArray && statusArray[dayOfWeek] !== undefined) {
                            roomStatus = statusArray[dayOfWeek];
                        }
                    } catch (e) {
                        console.error('[서버] status 파싱 오류:', e);
                    }
                }
                
                console.log('[서버] rooms 테이블 사용:', { room: room.name, dayOfWeek, status: roomStatus });
                result.push({ 
                    room_type: room.name, 
                    available: roomStatus === 1, // 1: 판매, 0: 마감
                    status: roomStatus 
                });
            }
        });
        
        console.log('[서버] 최종 결과:', result);
        res.json(result);
    } catch (error) {
        console.error('[서버] 객실 재고 조회 오류:', error);
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

// GET: 날짜별 가격 조회 (daily_prices 테이블)
app.get('/api/admin/dailyPrices', (req, res) => {
    const { date, roomType = 'daily' } = req.query;
    console.log('[서버] dailyPrices 요청:', { date, roomType });
    if (!date) return res.status(400).json({ error: '날짜 필요' });
    
    try {
        const rows = roomDb.prepare('SELECT * FROM daily_prices WHERE date = ? AND room_type = ?').all(date, roomType);
        console.log('[서버] daily_prices 조회 결과:', rows);
        res.json(rows);
    } catch (error) {
        console.error('[서버] 날짜별 가격 조회 오류:', error);
        res.status(500).json({ error: '날짜별 가격 조회 실패' });
    }
});

// GET: 객실별 요일 가격 조회 (rooms 테이블)
app.get('/api/admin/roomInfo', (req, res) => {
    const { name } = req.query;
    console.log('[서버] roomInfo 요청:', { name });
    if (!name) return res.status(400).json({ error: '객실명 필요' });
    
    try {
        const room = roomDb.prepare('SELECT * FROM rooms WHERE name = ?').get(name);
        console.log('[서버] room 조회 결과:', room);
        if (!room) {
            console.log('[서버] 객실을 찾을 수 없음:', name);
            return res.status(404).json({ error: '객실을 찾을 수 없습니다' });
        }
        res.json(room);
    } catch (error) {
        console.error('[서버] 객실 정보 조회 오류:', error);
        res.status(500).json({ error: '객실 정보 조회 실패' });
    }
});

// 객실 관리 테이블 생성
roomDb.prepare(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY,
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


// 날짜별 요금 테이블 생성 (객실별로 개별 행 저장)
roomDb.prepare(`
  CREATE TABLE IF NOT EXISTS daily_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    room_type TEXT NOT NULL, -- 'daily' 또는 'overnight'
    room_id TEXT NOT NULL, -- 객실 ID
    price INTEGER NOT NULL,
    status INTEGER NOT NULL, -- 1: 판매, 0: 마감
    details TEXT, -- 시간 정보 (JSON 배열 또는 문자열)
    usage_time TEXT, -- 이용시간 (대실만)
    UNIQUE(date, room_type, room_id)
  )
`).run();

// 기존 데이터 마이그레이션 (기존 구조에서 새로운 구조로)
try {
    // 기존 테이블이 있는지 확인
    const oldTableExists = roomDb.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='daily_prices_old'
    `).get();
    
    if (!oldTableExists) {
        // 기존 테이블을 백업
        roomDb.prepare(`
            CREATE TABLE IF NOT EXISTS daily_prices_old AS 
            SELECT * FROM daily_prices WHERE 1=0
        `).run();
        
        // 기존 데이터가 있는지 확인
        const existingData = roomDb.prepare('SELECT COUNT(*) as count FROM daily_prices').get();
        
        if (existingData.count > 0) {
            console.log('기존 daily_prices 데이터를 새로운 구조로 마이그레이션합니다...');
            
            // 기존 데이터를 백업 테이블로 복사
            roomDb.prepare(`
                INSERT INTO daily_prices_old 
                SELECT * FROM daily_prices
            `).run();
            
            // 기존 테이블 삭제
            roomDb.prepare('DROP TABLE daily_prices').run();
            
            // 새로운 구조로 테이블 재생성
            roomDb.prepare(`
                CREATE TABLE daily_prices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    room_type TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    price INTEGER NOT NULL,
                    status INTEGER NOT NULL,
                    details TEXT,
                    usage_time TEXT,
                    UNIQUE(date, room_type, room_id)
                )
            `).run();
            
            // 기존 데이터를 새로운 구조로 변환하여 삽입
            const oldData = roomDb.prepare('SELECT * FROM daily_prices_old').all();
            
            oldData.forEach(row => {
                try {
                    const roomsData = JSON.parse(row.rooms_data);
                    Object.keys(roomsData).forEach(room_id => {
                        const roomData = roomsData[room_id];
                        const status = typeof roomData.status === 'string' ? 
                            (roomData.status === '판매' ? 1 : 0) : 
                            (roomData.status === 1 ? 1 : 0);
                        
                        roomDb.prepare(`
                            INSERT INTO daily_prices (date, room_type, room_id, price, status, details, usage_time)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            row.date, 
                            row.room_type, 
                            room_id, 
                            roomData.price, 
                            status, 
                            roomData.details, 
                            roomData.usage_time
                        );
                    });
                } catch (error) {
                    console.error('rooms_data 파싱 오류:', error);
                }
            });
            
            console.log('마이그레이션 완료: 객실별 개별 행 구조로 변환되었습니다.');
        }
    }
} catch (error) {
    console.error('데이터 마이그레이션 오류:', error);
}



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

// 새 객실 추가 (디폴트 값으로)
app.post('/api/admin/rooms/add', (req, res) => {
    try {
        // 디폴트 값 설정
        const roomId = Date.now();
        const roomName = `객실`;
        const defaultCheckInOut = JSON.stringify(Array(7).fill([16, 13]));
        const defaultPrice = JSON.stringify(Array(7).fill(50000));
        const defaultStatus = JSON.stringify(Array(7).fill(1));
        const defaultUsageTime = JSON.stringify(Array(7).fill(5));
        const defaultOpenClose = JSON.stringify(Array(7).fill([14, 22]));
        const defaultRentalPrice = JSON.stringify(Array(7).fill(30000));
        const defaultRentalStatus = JSON.stringify(Array(7).fill(1));
        
        roomDb.prepare(`
            INSERT INTO rooms (id, name, checkInOut, price, status, usageTime, openClose, rentalPrice, rentalStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            roomId, 
            roomName, 
            defaultCheckInOut, 
            defaultPrice, 
            defaultStatus, 
            defaultUsageTime, 
            defaultOpenClose, 
            defaultRentalPrice, 
            defaultRentalStatus
        );
        
        res.json({ success: true, id: roomId, name: roomName });
    } catch (error) {
        console.error('객실 추가 오류:', error);
        res.status(500).json({ error: '객실 추가 실패' });
    }
});

// 객실 수정
app.post('/api/admin/rooms', (req, res) => {
    try {
        const { id, name, checkInOut, price, status, usageTime, openClose, rentalPrice, rentalStatus } = req.body;

        if (!id) {
            return res.status(400).json({ error: '객실 ID는 필수입니다.' });
        }

        // 가격 배열을 JSON 문자열로 변환
        const priceJson = Array.isArray(price) ? JSON.stringify(price) : price;
        const rentalPriceJson = Array.isArray(rentalPrice) ? JSON.stringify(rentalPrice) : rentalPrice;

        // 기존 객실 확인
        const existingRoom = roomDb.prepare('SELECT id FROM rooms WHERE id = ?').get(id);
        
        if (!existingRoom) {
            return res.status(404).json({ error: '객실을 찾을 수 없습니다.' });
        }

        // 기존 객실 수정
        roomDb.prepare(`
            UPDATE rooms 
            SET name = ?, checkInOut = ?, price = ?, status = ?, usageTime = ?, 
                openClose = ?, rentalPrice = ?, rentalStatus = ?
            WHERE id = ?
        `).run(name, checkInOut, priceJson, status, usageTime, openClose, rentalPriceJson, rentalStatus, id);
        
        res.json({ success: true, id });
    } catch (error) {
        console.error('객실 수정 오류:', error);
        res.status(500).json({ error: '객실 수정 실패' });
    }
});

// 객실 수정
app.put('/api/admin/rooms/:id', (req, res) => {
    try {
        const { id } = req.params;
        const roomData = req.body;
        
        // 객실 데이터 업데이트
        const info = roomDb.prepare(`
            UPDATE rooms 
            SET name = ?, checkInOut = ?, price = ?, status = ?, 
                usageTime = ?, openClose = ?, rentalPrice = ?, rentalStatus = ?
            WHERE id = ?
        `).run(
            roomData.name,
            JSON.stringify(roomData.checkInOut),
            JSON.stringify(roomData.price),
            JSON.stringify(roomData.status),
            JSON.stringify(roomData.usageTime),
            JSON.stringify(roomData.openClose),
            JSON.stringify(roomData.rentalPrice),
            JSON.stringify(roomData.rentalStatus),
            id
        );
        
        if (info.changes > 0) {
            res.json({ success: true, message: '객실 수정 완료' });
        } else {
            res.status(404).json({ error: '객실을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('객실 수정 오류:', error);
        res.status(500).json({ error: '객실 수정 실패' });
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
        
        const rows = roomDb.prepare(query).all(...params);
        
        // room_id로 정렬
        rows.sort((a, b) => a.room_id.localeCompare(b.room_id));
        
        res.json(rows);
    } catch (error) {
        console.error('날짜별 요금 조회 오류:', error);
        res.status(500).json({ error: '날짜별 요금 조회 실패' });
    }
});

// 날짜별 요금 저장/수정 (upsert) - 객실별로 개별 행 저장
app.post('/api/admin/daily-prices', (req, res) => {
    try {
        const { date, room_id, room_type, price, status, details, usage_time } = req.body;
        
        if (!date || !room_id || !room_type) {
            return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
        }

        // 기존 요금 설정 확인
        const existingPrice = roomDb.prepare('SELECT * FROM daily_prices WHERE date = ? AND room_type = ? AND room_id = ?').get(date, room_type, room_id);
        
        // details를 JSON 문자열로 변환
        const detailsJson = Array.isArray(details) ? JSON.stringify(details) : details;
        
        if (existingPrice) {
            // 기존 요금 설정 수정
            roomDb.prepare(`
                UPDATE daily_prices 
                SET price = ?, status = ?, details = ?, usage_time = ?
                WHERE date = ? AND room_type = ? AND room_id = ?
            `).run(
                price,
                status,
                detailsJson,
                usage_time,
                date, room_type, room_id
            );
        } else {
            // 새 요금 설정 생성
            roomDb.prepare(`
                INSERT INTO daily_prices (date, room_type, room_id, price, status, details, usage_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                date, room_type, room_id,
                price,
                status,
                detailsJson,
                usage_time
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('날짜별 요금 저장 오류:', error);
        res.status(500).json({ error: '날짜별 요금 저장 실패' });
    }
});

// 여러 날짜의 요금 일괄 저장 - 객실별로 개별 행 저장
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
                const existingPrice = roomDb.prepare('SELECT * FROM daily_prices WHERE date = ? AND room_type = ? AND room_id = ?').get(date, room_type, room_id);
                
                if (existingPrice) {
                    // 기존 요금 설정 수정
                    roomDb.prepare(`
                        UPDATE daily_prices 
                        SET price = ?, status = ?, details = ?, usage_time = ?
                        WHERE date = ? AND room_type = ? AND room_id = ?
                    `).run(
                        price, status, details, usage_time,
                        date, room_type, room_id
                    );
                } else {
                    // 새 요금 설정 생성
                    roomDb.prepare(`
                        INSERT INTO daily_prices (date, room_type, room_id, price, status, details, usage_time)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        date, room_type, room_id,
                        price, status, details, usage_time
                    );
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
app.delete('/api/admin/daily-prices/:date/:room_type', (req, res) => {
    try {
        const { date, room_type } = req.params;
        const info = roomDb.prepare('DELETE FROM daily_prices WHERE date = ? AND room_type = ?').run(date, room_type);
        res.json({ success: info.changes > 0 });
    } catch (error) {
        console.error('날짜별 요금 삭제 오류:', error);
        res.status(500).json({ error: '날짜별 요금 삭제 실패' });
    }
});

// 특정 객실의 날짜별 요금 삭제
app.delete('/api/admin/daily-prices/:date/:room_type/:room_id', (req, res) => {
    try {
        const { date, room_type, room_id } = req.params;
        const info = roomDb.prepare('DELETE FROM daily_prices WHERE date = ? AND room_type = ? AND room_id = ?').run(date, room_type, room_id);
        res.json({ success: info.changes > 0 });
    } catch (error) {
        console.error('객실별 요금 삭제 오류:', error);
        res.status(500).json({ error: '객실별 요금 삭제 실패' });
    }
});

// 스마트 저장 API - 기본값과 다를 때만 저장
app.post('/api/admin/daily-prices/smart-save', (req, res) => {
    try {
        const { date, room_type, rooms_data, default_values } = req.body;
        
        if (!date || !room_type || !rooms_data || !default_values) {
            return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
        }

        let savedCount = 0;
        let deletedCount = 0;

        // 트랜잭션 시작
        const transaction = roomDb.transaction(() => {
            Object.keys(rooms_data).forEach(room_id => {
                const roomData = rooms_data[room_id];
                const defaultData = default_values[room_id];
                
                // 기본값과 비교
                const isDifferent = (
                    roomData.price !== defaultData.price ||
                    roomData.status !== defaultData.status ||
                    JSON.stringify(roomData.details) !== JSON.stringify(defaultData.details) ||
                    roomData.usage_time !== defaultData.usage_time
                );
                
                // 기존 데이터 확인
                const existingPrice = roomDb.prepare('SELECT * FROM daily_prices WHERE date = ? AND room_type = ? AND room_id = ?').get(date, room_type, room_id);
                
                if (isDifferent) {
                    // 기본값과 다르면 저장
                    if (existingPrice) {
                        // 기존 데이터 수정
                        roomDb.prepare(`
                            UPDATE daily_prices 
                            SET price = ?, status = ?, details = ?, usage_time = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE date = ? AND room_type = ? AND room_id = ?
                        `).run(
                            roomData.price,
                            roomData.status,
                            roomData.details,
                            roomData.usage_time,
                            date, room_type, room_id
                        );
                    } else {
                        // 새 데이터 생성
                        roomDb.prepare(`
                            INSERT INTO daily_prices (date, room_type, room_id, price, status, details, usage_time)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            date, room_type, room_id,
                            roomData.price,
                            roomData.status,
                            roomData.details,
                            roomData.usage_time
                        );
                    }
                    savedCount++;
                } else {
                    // 기본값과 같으면 기존 데이터 삭제
                    if (existingPrice) {
                        roomDb.prepare('DELETE FROM daily_prices WHERE date = ? AND room_type = ? AND room_id = ?').run(date, room_type, room_id);
                        deletedCount++;
                    }
                }
            });
        });

        // 트랜잭션 실행
        transaction();
        
        res.json({ 
            success: true, 
            saved: savedCount, 
            deleted: deletedCount,
            message: `${savedCount}개 저장, ${deletedCount}개 삭제`
        });
    } catch (error) {
        console.error('스마트 저장 오류:', error);
        res.status(500).json({ error: '스마트 저장 실패' });
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
    case 'customers': return '👥';
    default: return '🗄️';
  }
}

// 고객 관리 API !!!!!

app.post('/api/customers', (req, res) => {
    const { id, name, phone, memo } = req.body;
    const result = customersModule.updateCustomer(id,  name, phone, memo);
    
    res.status(result.status).json({
        msg: result.msg,
    });
});

app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const result = customersModule.deleteCustomer(id);
    res.status(result.status).json({
        msg: result.msg,
    });
});

app.get('/api/customers', (req, res) => {
    const result = customersModule.getAllCustomers();
    console.log('getAllCustomers - result:', result);
    
    res.status(result.status).json({
        msg: result.msg,
        data: result.customers
    });     
});

app.get('/api/customers/search/:number', (req, res) => {
    const { number } = req.params;
    const result = customersModule.searchCustomer(number);
    res.status(result.status).json({
        msg: result.msg,
        data: result.customers
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
        WHERE phone = ? AND state != -1
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



// 기본 설정 관리 API !!!!!

const defaultSettingsModule = require('./defaultSettings'); 

app.get('/api/defaultSettings', (req, res) => {
    const result = defaultSettingsModule.getAllDefaultSettings();
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
});

app.post('/api/defaultSettings/create', (req, res) => {
    const result = defaultSettingsModule.createDefaultSettings();
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
});

app.post('/api/defaultSettings/update', (req, res) => {
    const { 
        id, 
        roomType, 
        overnightStatus, 
        overnightPrice, 
        overnightOpenClose, 
        dailyStatus, 
        dailyPrice,
        dailyOpenClose, 
        dailyUsageTime 
    } = req.body;

    console.log(req.body);
    const result = defaultSettingsModule.updateDefaultSettings(
        id, 
        roomType, 
        overnightStatus, 
        overnightPrice, 
        overnightOpenClose, 
        dailyStatus, 
        dailyPrice, 
        dailyOpenClose, 
        dailyUsageTime
    );
    
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
});

app.delete('/api/defaultSettings/:id', (req, res) => {
    const { id } = req.params;
    const result = defaultSettingsModule.deleteDefaultSettings(id);
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
});


// 예약 관리 API !!!!!
db.prepare(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      phone TEXT,
      room TEXT,
      start_date TEXT,
      end_date TEXT,
      state INTEGER DEFAULT 0
    )
  `).run();

app.post('/api/admin/confirm', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: '예약 ID가 필요합니다.' });
    }
    const stmt = db.prepare(`UPDATE reservations SET state = 1 WHERE id = ? AND state = 0`);
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
        res.status(404).json({ error: '예약을 찾을 수 없거나 이미 처리된 예약입니다.' });
    }
});



app.post("/api/cancel", (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "예약 ID가 필요합니다." });
    }

    // 예약자 전화번호 조회
    const row = db.prepare('SELECT phone FROM reservations WHERE id = ?').get(id);
    const phone = row ? row.phone : null;

    // 취소 상태로 변경 (삭제하지 않고 기록 보존)
    const stmt = db.prepare(`
        UPDATE reservations SET state = -1 WHERE id = ? AND state != -1
    `);
    const info = stmt.run(id);

    if (info.changes > 0) {
        // 관리자에게 실시간 알림
        if (io) io.to("admin").emit("reservation-updated");
        // 해당 예약자에게 실시간 취소 알림
        if (phone) io.to(`user_${phone}`).emit("reservation-cancelled", { id });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "예약을 찾을 수 없거나 이미 취소된 예약입니다." });
    }
});

app.get('/api/reserve/recent/:phone', (req, res) => {
    const { phone } = req.params;
    const result = db.prepare(`
        SELECT *
        FROM reservations
        WHERE phone = ? AND state != -1
        ORDER BY end_date DESC
    `).all(phone);
    console.log(result);
    res.json(result);
});


// 날짜별 판매 설정 API !!!!!

const dailySettingsModule = require('./dailySettings');

app.get('/api/dailySettings/:month/:year/:isOvernight', (req, res) => {
    const { month, year, isOvernight } = req.params;
    console.log(month, year, isOvernight);
    const result = dailySettingsModule.getMonthlyDailySettings(year, month, isOvernight);
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
    console.log("month: ", month, "year: ", year, "isOvernight: ", isOvernight);
    console.log("dailySettings: ", result);
});

app.post('/api/dailySettings', (req, res) => {
    const result = dailySettingsModule.updateDailySettings(req.body);
    res.status(result.status).json({
        msg: result.msg,
    });
});

// 기타...

app.get('/api/date/:dateId', (req, res) => {
    const { dateId } = req.params;
    const result = dailySettingsModule.getDate(dateId);
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
});

app.get('/api/roomType/:roomId', (req, res) => {
    const { roomId } = req.params;
    const result = defaultSettingsModule.getRoomType(roomId);
    res.status(result.status).json({
        msg: result.msg,
        data: result.data
    });
});


// 비밀번호 확인 API !!!!!
const loginIpMap = new Map();
app.get('/api/admin/login/:password', (req, res) => {
    // 무차별 대입 방어 필요
    const { password } = req.params;

    if(password === '123') {
        res.json({
            msg: 'success',
        });
    } else {
        res.json({
            msg: 'fail',
        });
    }
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
