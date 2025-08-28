import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import Database from 'better-sqlite3';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';
import fs from 'fs';


import customersModule from "./customers.js";
import roomsModule from "./rooms.js";
import discountModule from "./discount.js";


const db = new Database("data.db");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static("../Client"));
app.use('/admin', express.static('../Admin'));

app.use('/img', express.static('./img'));
app.use('/uploads', express.static('./uploads'));


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});
const upload = multer({ 
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype);
        if (!ok) return cb(new Error('허용되지 않는 파일 형식입니다.'), false);
        cb(null, true);
    },
 });

app.post("/api/uploadImage", upload.array('image', 10), (req, res) => {
    const urlList = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json(urlList);
});


app.get("/api/rooms", (req, res) => {
    const rt = roomsModule.getRoomList();
    if(rt.ok) {
        res.status(200).json(rt.data);
    } else {
        res.status(503).json(rt.msg);
    }
});

app.get("/api/rooms/:id", (req, res) => {
    if(!req.params) return res.status(400).json({ error: "params 오류" });
    const { id } = req.params;
    if(!id) return res.status(400).json({ error: "id 누락" });

    const nID = Number(id);
    const rt = roomsModule.getRoomById(nID);
    if(rt.ok) {
        res.status(200).json(rt.data);
    } else {
        res.status(503).json(rt.msg);
    }
});

app.post("/api/rooms", (req, res) => {
    if(!req.body) return res.status(400).json({ error: "body 오류" });
    const { name, image, description } = req.body;

    if(!name) return res.status(400).json({ error: "name 누락" });
    if(!image) return res.status(400).json({ error: "image 누락" });
    if(!description) return res.status(400).json({ error: "description 누락" });


    const rt = roomsModule.createRoom(name, image, description);
    if(!rt.ok) return res.status(503).json({ error: rt.msg });

    return res.status(200);
});



app.put("/api/rooms/:id", (req, res) => {
    if(!req.params) return res.status(400).json({ error: "params 오류" });
    if(!req.body) return res.status(400).json({ error: "body 오류" });


    const { id } = req.params;
    const { name, imagePathList, description } = req.body;

    if(!id) return res.status(400).json({ error: "id 누락" });
    if(!name) return res.status(400).json({ error: "name 누락" });
    if(!description) return res.status(400).json({ error: "description 누락" });
    
    const nID = Number(id);
    const rt = roomsModule.updateRoom(nID, name, imagePathList, description);
    if(rt.ok) {
        res.status(200).json(rt.msg);
    } else {
        res.status(503).json(rt.msg);
    }
});

app.delete("/api/rooms/:id", (req, res) => {
    if(!req.params) return res.status(400).json({ error: "params 오류" });
    const { id } = req.params;
    if(!id) return res.status(400).json({ error: "id 누락" });
    
    const nID = Number(id);
    const rt = roomsModule.deleteRoom(nID);
    if(rt.ok) {
        res.status(200).json(rt.msg);
        const rtDefault = defaultModule.removeDefault(nID);
    } else {
        res.status(503).json(rt.msg);
    }
});


app.get("/api/setting/:bIsOvernight", (req, res) => {
    if(!req.params) return res.status(400).json({ error: "params 오류" });

    const { bIsOvernight } = req.params;
    const rt = roomsModule.getSettingList(Number(bIsOvernight));
    if(!rt.ok) return res.status(503).json({ error: rt.msg });

    rt.data.forEach(room => {
        const rt2 = roomsModule.getRoomById(room.roomId);
        if(!rt2.ok) return res.status(503).json({ error: rt2.msg });
        room.roomName = rt2.data.name;
    });

    res.status(200).json(rt.data);
});

app.get("/api/setting/:bIsOvernight/:roomId", (req, res) => {
	try {
		if(!req.params) return res.status(400).json({ error: "params 오류" });

		const { bIsOvernight, roomId } = req.params;
		if(bIsOvernight === undefined) return res.status(400).json({ error: "bIsOvernight 누락" });
		if(roomId === undefined) return res.status(400).json({ error: "roomId 누락" });
        console.log(bIsOvernight, typeof(bIsOvernight));
        console.log(roomId, typeof(roomId));

		const rt = roomsModule.getSettingById(Number(roomId), Number(bIsOvernight));
		if(!rt.ok) return res.status(503).json({ error: rt.msg });

		const rt2 = roomsModule.getRoomById(Number(roomId));
		if(!rt2.ok) return res.status(503).json({ error: rt2.msg });
    
		rt.data.roomName = rt2.data.name;

		res.status(200).json(rt.data);
		
	} catch (error) {
		return res.status(503).json({ error: error.message });
	}
});

app.post("/api/setting/:bIsOvernight/:roomId", (req, res) => {
    try {
        if(!req.params) return res.status(400).json({ error: "params 오류" });
        if(!req.body) return res.status(400).json({ error: "body 오류" });

        const { bIsOvernight, roomId } = req.params;
        const { status, price, openClose, usageTime } = req.body;

        roomsModule.updateSetting(Number(roomId), Number(bIsOvernight), status, price, openClose, usageTime);

        return res.status(200).json({ msg: "update setting susccess" });
    } catch (error) {
        return res.status(503).json({ error: error.message });
    }
});

app.get("/api/daily/:bIsOvernight/:year/:month", (req, res) => {
    if(!req.params) return res.status(400).json({ error: "params 오류" });
    const { bIsOvernight, year, month } = req.params;

    if(!bIsOvernight) return res.status(400).json({ error: "bIsOvernight 누락" });
    if(!month) return res.status(400).json({ error: "month 누락" });
    if(!year) return res.status(400).json({ error: "year 누락" });
    const result = roomsModule.getDailyListByMonth(bIsOvernight, year, month);

    if(!result.ok) return res.status(503).json({ error: result.msg });
    res.status(200).json(result.data);
});

app.get("/api/daily/:bIsOvernight/:year/:month/:date", (req, res) => {
    if(!req.params) return res.status(400).json({ error: "params 오류" });
    const { bIsOvernight, year, month, date } = req.params;

    if(!bIsOvernight) return res.status(400).json({ error: "bIsOvernight 누락" });
    if(!year) return res.status(400).json({ error: "year 누락" });
    if(!month) return res.status(400).json({ error: "month 누락" });
    if(!date) return res.status(400).json({ error: "date 누락" });
    const result = roomsModule.getDailyByDate(bIsOvernight, year, month, date);

    if(!result.ok) return res.status(503).json({ error: result.msg });
    if(result.data) return res.status(200).json(result.data);

    const rt = roomsModule.getSettingList(bIsOvernight? 1 : 0);
    if(!rt.ok) return res.status(503).json({ error: rt.msg });

    const data = [];
    const dayOfWeek = new Date(year, month - 1, date).getDay();

    rt.data.forEach(room => {
        const tmp = roomsModule.getRoomById(room.roomId);
        if(!tmp.ok) return res.status(503).json({ error: tmp.msg });

        data.push({
            roomId: room.roomId,
            roomName: tmp.data.name,
            bOvernight: room.bOvernight,
            year: year,
            month: month,
            day: date,

            status: JSON.parse(room.status)[dayOfWeek],
            price: JSON.parse(room.price)[dayOfWeek],
            open: JSON.parse(room.openClose)[dayOfWeek][0],
            close: JSON.parse(room.openClose)[dayOfWeek][1],
            usageTime: JSON.parse(room.usageTime)[dayOfWeek]
        })
    });

    res.status(200).json(data);
});

app.put("/api/daily/:bIsOvernight", (req, res) => {
    try {
        if(!req.params) return res.status(400).json({ error: "params 오류" });
        if(!req.body) return res.status(400).json({ error: "body 오류" });

        const { bIsOvernight } = req.params;
        const { dayList, settingList } = req.body;
        
        if(!dayList) return res.status(400).json({ error: "dayList 누락" });
        if(!settingList) return res.status(400).json({ error: "settingList 누락" });
        
        dayList.forEach(day => {
            const { date, month, year } = day;
            if(!date) return res.status(400).json({ error: "date 누락" });
            if(!month) return res.status(400).json({ error: "month 누락" });
            if(!year) return res.status(400).json({ error: "year 누락" });

            settingList.forEach(setting => {
                const { roomId, status, price, open, close, usageTime } = setting;
                if(roomId === undefined) return res.status(400).json({ error: "roomId 누락" });
                if(status === undefined) return res.status(400).json({ error: "status 누락" });
                if(price === undefined) return res.status(400).json({ error: "price 누락" });
                if(open === undefined) return res.status(400).json({ error: "open 누락" });
                if(close === undefined) return res.status(400).json({ error: "close 누락" });
                if(usageTime === undefined) return res.status(400).json({ error: "usageTime 누락" });

                roomsModule.updateDaily(
                    Number(bIsOvernight? 1 : 0), 
                    Number(date), 
                    Number(month), 
                    Number(year), 
                    Number(roomId), 
                    Number(status), 
                    Number(price), 
                    Number(open), 
                    Number(close), 
                    Number(usageTime)
                );
            });
        });

        return res.status(200).json({ msg: "update daily success" });
    } catch (error) {
        res.status(503).json({ error: error.message });
    }


});

app.get(`/api/reservation`, (req, res) => {
    try {
        const reservations = roomsModule.getReservationList();
        let reservationList = [];
        reservations.forEach(reservation => {
            const customer = customersModule.getCustomerById(reservation.customerID);
            if(customer == undefined) throw new Error("customer not found");
            const room = roomsModule.getRoomById(reservation.roomID);
            if(room.data == undefined) throw new Error("room not found");

            reservationList.push({
                id: reservation.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                roomName: room.data.name,
                checkinDate: reservation.checkinDate,
                checkoutDate: reservation.checkoutDate,
                price: reservation.price,
                status: reservation.status
            });
        });
        res.status(200).json(reservationList);

    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

app.patch("/api/reservation/:id", (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if(id == undefined) return res.status(400).json({ error: "id 누락" });
        if(status == undefined) return res.status(400).json({ error: "status 누락" });

        roomsModule.updateReservationStatus(Number(id), Number(status));
        res.status(200).json({ msg: "update reservation status success" });
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});


app.get("/api/discount", (req, res) => {
    try {
        const { firstVisitDiscount, recentVisitDiscount } = discountModule.getDiscount();
        res.status(200).json({
            msg: "get discount success",
            data: {
                firstVisitDiscount: firstVisitDiscount,
                recentVisitDiscount: recentVisitDiscount
            }
        });
    } catch (error) {
        res.status(503).json({ err: "get discount failed: " + error.message });
    }
});

app.patch("/api/discount", (req, res) => {
    try {
        const { firstVisitDiscount, recentVisitDiscount } = req.body;

        if(!firstVisitDiscount) {
            return res.status(400).json({ err: "no firstVisitDiscount" });
        }
        if(!recentVisitDiscount) {
            return res.status(400).json({ err: "no recentVisitDiscount" });
        }

        const info = discountModule.setDiscount(firstVisitDiscount, recentVisitDiscount);
        if(info.changes == 0) {
            return res.status(400).json({ err: "patch discount failed: no changes" });
        } else {
            return res.status(200).json({ msg: "patch discount success" });
        }
    } catch (error) {
        res.status(503).json({ err: "patch discount failed: " + error.message });
    }
});

app.delete("/api/customers/:id", (req, res) => {
    try{
        const { id } = req.params;
        if(id == undefined) return res.status(400).json({ err: "id 누락" });

        const rt = customersModule.deleteCustomer(Number(id));
        res.status(200).json({ msg: "delete customer success" });
    } catch (error) {
        res.status(503).json({ err: error.message });
    }
});





function getReservationPrice(roomId, checkinDate, checkoutDate, discount){
    let originalPrice = 0;
    let discountedPrice = 0;

    const startDate = new Date(checkinDate);
    const endDate = new Date(checkoutDate);

    let checkDate = new Date(startDate);
    while(checkDate < endDate){
        let setting;
        const dailyRt = roomsModule.getDailyByDate(
            1, 
            checkDate.getFullYear(), 
            checkDate.getMonth() + 1, 
            checkDate.getDate()
        );

        if(dailyRt.data != undefined) {
            setting = Array.from(dailyRt.data).find(room => room.roomId == roomId);
        }
        else {
            const dayOfWeek = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()).getDay();
            const settingRt = roomsModule.getSettingById(roomId, 1);
            setting = {
                status: JSON.parse(settingRt.data.status)[dayOfWeek],
                price: JSON.parse(settingRt.data.price)[dayOfWeek],
            };
        }

        if(setting.status == 0) return [-1, -1];
        originalPrice += Number(setting.price);
        
        discountedPrice -= discount;
        checkDate.setDate(checkDate.getDate() + 1);
    }
    discountedPrice += originalPrice;
    return [originalPrice, discountedPrice];
}

app.post(`/api/chatbot/getReservationPrice`, (req, res) => {
    try {
        const { customerID, roomID, checkinDate, checkoutDate } = req.body;
        if(!customerID) return res.status(400).json({ error: "customerID 누락" });
        if(!roomID) return res.status(400).json({ error: "roomID 누락" });
        if(!checkinDate) return res.status(400).json({ error: "checkinDate 누락" });
        if(!checkoutDate) return res.status(400).json({ error: "checkoutDate 누락" });

        const customerType = customersModule.getCustomerById(customerID)? 0: 1;
        let discount = customerType == 1 ? discountModule.getDiscount().firstVisitDiscount : discountModule.getDiscount().recentVisitDiscount;
        let [originalPrice, discountedPrice] = getReservationPrice(roomID, checkinDate, checkoutDate, discount);
        
        if(originalPrice == -1) {
            return res.status(200).json({
                ok: false,
                floatings: ["날짜 변경하기", "객실 변경하기", "취소하기"],
                msg: ["선택하신 날짜에 해당 객실이 마감되었습니다. 다른 날짜나 객실을 선택해주세요."],
            });
        }
        if(originalPrice != -1){
            let msg = [];
            
            const szRoomName = roomsModule.getRoomById(roomID).data.name;
            const szStartDate = new Date(checkinDate).toLocaleDateString();
            const szEndDate = new Date(checkoutDate).toLocaleDateString();
            const szCustomerType = customerType == 1 ? "첫 예약 고객" : "단골 고객";
            const szOrginalPrice = originalPrice.toLocaleString();
            const szDiscountedPrice = discountedPrice.toLocaleString();
            const szDiscount = discount.toLocaleString();

            msg.push(`${szRoomName} ${szStartDate} 입실 ~ ${szEndDate} 퇴실`);
            msg.push(`${szCustomerType} 1박 당 ${szDiscount}원 할인 적용!`);
            msg.push(`기준가: ${szOrginalPrice}원 → 할인 가격: ${szDiscountedPrice}원`);
            msg.push(`예약하시겠습니까?`);

            return res.status(200).json({
                ok: true,
                floatings: ["날짜 변경하기", "객실 변경하기", "예약하기", "취소하기"],
                msg: msg,
            });
    }
    } catch (error) {
        res.status(503).json({ error: error.message });
    }

});

// 나중에는 챗봇 인스턴스로 관리하게 수정할 것.
app.post(`/api/chatbot/confirmReservation`, (req, res) => {
    try {
        const { customerID, roomID, checkinDate, checkoutDate, price } = req.body;
        if(customerID == undefined) return res.status(400).json({ error: "customerID 누락" });
        if(roomID == undefined) return res.status(400).json({ error: "roomID 누락" });
        if(checkinDate == undefined) return res.status(400).json({ error: "checkinDate 누락" });
        if(checkoutDate == undefined) return res.status(400).json({ error: "checkoutDate 누락" });
        if(price == undefined) return res.status(400).json({ error: "price 누락" });

        roomsModule.createReservation(customerID, roomID, checkinDate, checkoutDate, price, 0);

        if(io) io.to("admin").emit("reservation-updated");
        res.status(200).json({ 
            floatings: ["고객 등록", "예약하기", "예약 내역", "문의하기"],
            msg: [
                "객실 상황에 따라 예약 가능 여부를 먼저 확인한 뒤, 문자로 안내드립니다.", 
                "결제는 체크인 시, ‘현장’에서 진행됩니다.",
                "무엇을 도와드릴까요?"
            ],
         });

    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});




















































// 예약 추가 시 관리자에게 실시간 알림
app.post("/api/reserve", (req, res) => {
    const { username, phone, room, startDate, endDate } = req.body;
    if (!username || !phone || !room || !startDate) {
        return res.status(400).json({ error: "필수 정보 누락" });
    }

    
    const info = db.prepare(`
        INSERT INTO reservations (phone, room, start_date, end_date)
        VALUES (?, ?, ?, ?)
        `).run(phone, roomType, checkinDate, checkoutDate);

    if(io) io.to("admin").emit("reservation-updated");
    res.status(200).json({ success: true, id: info.lastInsertRowid });
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





app.post('/api/customers/register/:phone', (req, res) => {
    const { phone } = req.params;
    const result = customersModule.registerCustomer(phone);
    res.status(result.status).json({
        msg: result.msg,
    });
});

app.get('/api/chatbot/certify/:phone', (req, res) => {
    try{
        const { phone } = req.params;
        if(phone == undefined) return res.status(400).json({ error: "phone 누락" });
        const customer = customersModule.getCustomer(phone);
        if(customer == undefined) return res.status(200).json({
            floatings: ["고객 등록", "예약하기", "예약 내역", "문의하기"],
            msg: ["고객 정보가 존재하지 않습니다. 고객 등록을 먼저 진행해주세요."],
        });

        const userNick = phone.slice(-4);
        const reservationList = roomsModule.getReservationListByCustomerID(customer.id);
        let msg = [];
        if(reservationList == undefined) msg = [
            `🙏 ${userNick}님, 팔레스 호텔을 찾아주셔서 감사합니다.`,
            "첫 방문 고객님께는 5,000원 더 저렴하게 안내해드립니다."
        ];
        else msg = [
            `🙌 ${userNick}님, 다시 찾아주셔서 감사합니다.`,
            "단골 고객님께는 야놀자보다 5,000원 더 저렴하게 안내해드립니다."
        ];

        return res.status(200).json({
            id: customer.id,
            floatings: ["날짜 선택하기", "객실 선택하기", "취소하기"],
            msg: msg,
        });


    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});




// 비밀번호 확인 API !!!!!
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





import os from 'os';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: "*" }
});

// 소켓 연결 관리
io.on("connection", (socket) => {
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
    console.log(`관리자 페이지 : http://${ip}:${PORT}/admin`);

});


// customerInfo.js 67
app.post('/api/customers', (req, res) => {
    const { id, name, phone, memo } = req.body;
    const result = customersModule.updateCustomer(id,  name, phone, memo);
    
    res.status(result.status).json({
        msg: result.msg,
    });
});

// customerList.js 132
app.get('/api/customers', (req, res) => {
    try {
        const rt = customersModule.getCustomerList();
        let customerList = []
        rt.forEach(customer => {
            const reservations = roomsModule.getReservationListByCustomerID(customer.id);
            let recentReserve = null;

            if(reservations === undefined) recentReserve = null;
            else recentReserve = reservations[0];

            const text = recentReserve ? recentReserve.checkinDate + " ~ " + recentReserve.checkoutDate : "-";

            
            customerList.push({
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                memo: customer.memo,
                recentReserve: text
            });
        });
        res.status(200).json(customerList);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// customerList.js 137
app.get("/api/customers/recentReserves", (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT r.phone, r.end_date
            FROM reservations r
            INNER JOIN (
                SELECT phone, MAX(end_date) as max_end_date
                FROM reservations
                WHERE state != -1
                GROUP BY phone
            ) latest ON r.phone = latest.phone AND r.end_date = latest.max_end_date
        `);
        
        const rows = stmt.all();
        const recentReserves = {};
        
        rows.forEach(row => {
            recentReserves[row.phone] = row.end_date;
        });
        
        res.json({ data: recentReserves });
    } catch (error) {
        res.status(500).json({ error: "최근 예약 정보를 가져오는 중 오류가 발생했습니다." });
    }
});


// customerList.js 150
app.get("/api/customers/recentReserve", (req, res) => {
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

app.get('/api/customers/search/:number', (req, res) => {
    const { number } = req.params;
    const result = customersModule.searchCustomer(number);
    res.status(result.status).json({
        msg: result.msg,
        data: result.customers
    });

});