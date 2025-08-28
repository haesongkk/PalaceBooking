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
    try {
        const roomList = roomsModule.getRoomList();
        res.status(200).json(roomList);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

app.get("/api/rooms/:id", (req, res) => {
    try {
        const { id } = req.params;
        if(!id) return res.status(400).json({ error: "id 누락" });

        const room = roomsModule.getRoomById(Number(id));
        res.status(200).json(room);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

app.post("/api/rooms", (req, res) => {
    try {
        const { name, image, description } = req.body;
        if(name == undefined) return res.status(400).json({ error: "name 누락" });
        if(image == undefined) return res.status(400).json({ error: "image 누락" });
        if(description == undefined) return res.status(400).json({ error: "description 누락" });

        const id = roomsModule.createRoom(name, image, description);
        res.status(200).json(id);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});



app.put("/api/rooms/:id", (req, res) => {
    try {
        const { id } = req.params;
        const { name, imagePathList, description } = req.body;

        if(id == undefined) return res.status(400).json({ error: "id 누락" });
        if(name == undefined) return res.status(400).json({ error: "name 누락" });
        if(description == undefined) return res.status(400).json({ error: "description 누락" });

        const rt = roomsModule.updateRoom(Number(id), name, JSON.stringify(imagePathList), description);

        res.status(200).json({ msg: "update room success" });
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

app.delete("/api/rooms/:id", (req, res) => {
    try {
        const { id } = req.params;
        if(id == undefined) return res.status(400).json({ error: "id 누락" });

        roomsModule.deleteRoom(Number(id));
        res.status(200).json({ msg: "delete room success" });
    }
    catch (error) {
        return res.status(503).json({ error: error.message });
    }
});


app.get("/api/setting/:bIsOvernight", (req, res) => {
    try {
        const { bIsOvernight } = req.params;
        if(bIsOvernight === undefined) return res.status(400).json({ error: "bIsOvernight 누락" });

        const settingList = roomsModule.getSettingList(Number(bIsOvernight));
        settingList.forEach(setting => {
            const room = roomsModule.getRoomById(setting.roomId);
            setting.roomName = room.name;
        });
        res.status(200).json(settingList);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

app.get("/api/setting/:bIsOvernight/:roomId", (req, res) => {
	try {
		if(!req.params) return res.status(400).json({ error: "params 오류" });

		const { bIsOvernight, roomId } = req.params;
		if(bIsOvernight === undefined) return res.status(400).json({ error: "bIsOvernight 누락" });
		if(roomId === undefined) return res.status(400).json({ error: "roomId 누락" });


		const setting = roomsModule.getSettingById(Number(roomId), Number(bIsOvernight));

		const room = roomsModule.getRoomById(Number(roomId));
		setting.roomName = room.name;

		res.status(200).json(setting);
		
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
    try {
        const { bIsOvernight, year, month } = req.params;
        if(bIsOvernight === undefined) return res.status(400).json({ error: "bIsOvernight 누락" });
        if(year === undefined) return res.status(400).json({ error: "year 누락" });
        if(month === undefined) return res.status(400).json({ error: "month 누락" });

        const dailyList = roomsModule.getDailyListByMonth(bIsOvernight? 1 : 0, Number(year), Number(month));
        res.status(200).json(dailyList);
    } catch (error) {
        return res.status(503).json({ error: error.message });
    }
});

app.get("/api/daily/:bIsOvernight/:year/:month/:date", (req, res) => {
    try {
        const { bIsOvernight, year, month, date } = req.params;
        if(bIsOvernight === undefined) return res.status(400).json({ error: "bIsOvernight 누락" });
        if(year === undefined) return res.status(400).json({ error: "year 누락" });
        if(month === undefined) return res.status(400).json({ error: "month 누락" });
        if(date === undefined) return res.status(400).json({ error: "date 누락" });

        const daily = roomsModule.getDailyByDate(bIsOvernight? 1 : 0, Number(year), Number(month), Number(date));

        if(daily.length > 0) return res.status(200).json(daily);

        const settingList = roomsModule.getSettingList(bIsOvernight? 1 : 0);

        const data = [];
        const dayOfWeek = new Date(year, month - 1, date).getDay();

        settingList.forEach(setting => {
            const room = roomsModule.getRoomById(setting.roomId);

            data.push({
                roomId: setting.roomId,
                roomName: room.name,
                bOvernight: setting.bOvernight,
                year: year,
                month: month,
                day: date,

                status: JSON.parse(setting.status)[dayOfWeek],
                price: JSON.parse(setting.price)[dayOfWeek],
                open: JSON.parse(setting.openClose)[dayOfWeek][0],
                close: JSON.parse(setting.openClose)[dayOfWeek][1],
                usageTime: JSON.parse(setting.usageTime)[dayOfWeek]
            })
        });

        res.status(200).json(data);
    } catch (error) {
        return res.status(503).json({ error: error.message });
    }
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
            if(room == undefined) throw new Error("room not found");

            reservationList.push({
                id: reservation.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                roomName: room.name,
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
        console.log(rt);
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
        const daily = roomsModule.getDailyByDate(
            1, 
            checkDate.getFullYear(), 
            checkDate.getMonth() + 1, 
            checkDate.getDate()
        );

        if(!daily) {
            setting = daily.find(room => room.roomId == roomId);
        }
        else {
            const dayOfWeek = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()).getDay();
            const tmp = roomsModule.getSettingById(Number(roomId), 1);
            setting = {
                status: JSON.parse(tmp.status)[dayOfWeek],
                price: JSON.parse(tmp.price)[dayOfWeek],
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
            
            const szRoomName = roomsModule.getRoomById(Number(roomID)).name;
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




app.get('/api/admin/login/:password', (req, res) => {
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
        console.log(customerList);
        res.status(200).json(customerList);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
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