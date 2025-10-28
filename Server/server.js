import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';
import os from 'os';
import axios from 'axios';

import 'dotenv/config';
import roomsModule from './database.js';

const app = express();
const PORT = process.env.PORT;

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

app.use(express.static('../Client_v2'));
app.use('/old', express.static('../Client'));
app.use('/admin', express.static('../Admin'));
app.use('/dev', express.static('../Dev'));

app.use('/img', express.static('./img'));

io.on('connection', (socket) => {
  socket.on('join', (phone) => socket.join(`user_${phone}`));
  socket.on('admin', () => socket.join('admin'));
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
      }
    }
  }
  console.log(`서버 실행됨: http://${ip}:${PORT}`);
  console.log(`관리자 페이지 : http://${ip}:${PORT}/admin`);
});

const upload = multer({ storage: multer.memoryStorage() });

/* ----------------------------- Image APIs ----------------------------- */

app.post('/api/image', upload.array('image', 10), async (req, res) => {
  try {
    const results = await Promise.all(
      req.files.map((file) =>
        roomsModule.createImage(file.buffer, file.mimetype, file.size)
      )
    );
    const idList = results.map((img) => img.id);
    res.status(200).json(idList);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await roomsModule.getImageById(Number(id));
    if (!image) return res.status(404).json({ error: 'not found' });
    res.setHeader('Content-Type', image.mime);
    res.send(image.data);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

/* ------------------------------ Room APIs ----------------------------- */

app.get('/api/rooms', async (req, res) => {
  try {
    const roomList = await roomsModule.getRoomList();
    res.status(200).json(roomList);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id 누락' });
    const room = await roomsModule.getRoomById(Number(id));
    res.status(200).json(room);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, images, description } = req.body;
    if (name == undefined) return res.status(400).json({ error: 'name 누락' });
    if (images == undefined) return res.status(400).json({ error: 'images 누락' });
    if (description == undefined) return res.status(400).json({ error: 'description 누락' });
    const id = await roomsModule.createRoom(name, images, description);
    res.status(200).json(id);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, images, description } = req.body;
    if (id == undefined) return res.status(400).json({ error: 'id 누락' });
    if (name == undefined) return res.status(400).json({ error: 'name 누락' });
    if (description == undefined) return res.status(400).json({ error: 'description 누락' });
    if(images == undefined) return res.status(400).json({ error: 'images 누락' });

    await roomsModule.updateRoom(Number(id), name, images, description);
    res.status(200).json({ msg: 'update room success' });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id == null) return res.status(400).json({ error: 'id 누락' });
    await roomsModule.deleteRoom(Number(id));
    res.status(200).json({ msg: 'delete room success' });
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }
});

/* ---------------------------- Setting APIs ---------------------------- */

app.get('/api/setting/:bIsOvernight', async (req, res) => {
  try {
    const { bIsOvernight } = req.params;
    if (bIsOvernight === undefined) return res.status(400).json({ error: 'bIsOvernight 누락' });

    const settingList = await roomsModule.getSettingList(Number(bIsOvernight));
    const enriched = await Promise.all(
      settingList.map(async (setting) => {
        const room = await roomsModule.getRoomById(setting.roomid);
        return { ...setting, roomname: room ? room.name : '삭제된 객실' };
      })
    );
    res.status(200).json(enriched);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/setting/:bIsOvernight/:roomId', async (req, res) => {
  try {
    const { bIsOvernight, roomId } = req.params;
    if (bIsOvernight === undefined) return res.status(400).json({ error: 'bIsOvernight 누락' });
    if (roomId === undefined) return res.status(400).json({ error: 'roomId 누락' });

    const setting = await roomsModule.getSettingById(Number(roomId), Number(bIsOvernight));
    const room = await roomsModule.getRoomById(Number(roomId));
    if (setting) setting.roomname = room ? room.name : '삭제된 객실';

    res.status(200).json(setting);
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }
});

app.post('/api/setting/:bIsOvernight/:roomId', async (req, res) => {
  try {
    const { bIsOvernight, roomId } = req.params;
    const { status, price, openclose, usagetime } = req.body; // ← 소문자
    await roomsModule.updateSetting(Number(roomId), Number(bIsOvernight), status, price, openclose, usagetime);
    return res.status(200).json({ msg: 'update setting susccess' });
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }
});

/* ----------------------------- Daily APIs ----------------------------- */

app.get('/api/daily/:bIsOvernight/:year/:month', async (req, res) => {
  try {
    const { bIsOvernight, year, month } = req.params;
    if (bIsOvernight === undefined) return res.status(400).json({ error: 'bIsOvernight 누락' });
    if (year === undefined) return res.status(400).json({ error: 'year 누락' });
    if (month === undefined) return res.status(400).json({ error: 'month 누락' });

    const dailyList = await roomsModule.getDailyListByMonth(bIsOvernight == '1' ? 1 : 0, Number(year), Number(month));
    res.status(200).json(dailyList);
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }
});

app.get('/api/daily/:bIsOvernight/:year/:month/:date', async (req, res) => {
  try {
    const { bIsOvernight, year, month, date } = req.params;
    if (bIsOvernight === undefined) return res.status(400).json({ error: 'bIsOvernight 누락' });
    if (year === undefined) return res.status(400).json({ error: 'year 누락' });
    if (month === undefined) return res.status(400).json({ error: 'month 누락' });
    if (date === undefined) return res.status(400).json({ error: 'date 누락' });

    const daily = await roomsModule.getDailyByDate(bIsOvernight ? 1 : 0, Number(year), Number(month), Number(date));
    if (daily.length > 0) return res.status(200).json(daily);

    const settingList = await roomsModule.getSettingList(bIsOvernight ? 1 : 0);
    const dayOfWeek = new Date(year, month - 1, date).getDay();

    const data = await Promise.all(
      settingList.map(async (setting) => {
        const room = await roomsModule.getRoomById(setting.roomid);
        return {
          roomid: setting.roomid,
          roomname: room ? room.name : '삭제된 객실',
          bovernight: setting.bovernight,
          year: Number(year),
          month: Number(month),
          day: Number(date),
          status: JSON.parse(setting.status)[dayOfWeek],
          price: JSON.parse(setting.price)[dayOfWeek],
          open: JSON.parse(setting.openclose)[dayOfWeek][0],
          close: JSON.parse(setting.openclose)[dayOfWeek][1],
          usagetime: JSON.parse(setting.usagetime)[dayOfWeek],
        };
      })
    );

    res.status(200).json(data);
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }
});

app.put('/api/daily/:bIsOvernight', async (req, res) => {
  try {
    const { bIsOvernight } = req.params;
    const { dayList, settingList } = req.body;
    if (!dayList) return res.status(400).json({ error: 'dayList 누락' });
    if (!settingList) return res.status(400).json({ error: 'settingList 누락' });

    for (const day of dayList) {
      const { date, month, year } = day;
      if (date == null) return res.status(400).json({ error: 'date 누락' });
      if (month == null) return res.status(400).json({ error: 'month 누락' });
      if (year == null) return res.status(400).json({ error: 'year 누락' });

      for (const setting of settingList) {
        const { roomid, status, price, open, close, usagetime } = setting; // ← 소문자
        await roomsModule.updateDaily(
          Number(bIsOvernight ? 1 : 0),
          Number(date),
          Number(month),
          Number(year),
          Number(roomid),
          Number(status),
          Number(price),
          Number(open),
          Number(close),
          Number(usagetime)
        );
      }
    }

    return res.status(200).json({ msg: 'update daily success' });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

/* -------------------------- Reservation APIs -------------------------- */

app.get('/api/reservation', async (req, res) => {
  try {
    const reservations = await roomsModule.getReservationList();
    const reservationList = await Promise.all(
      reservations.map(async (reservation) => {
        const customer = await roomsModule.getCustomerById(reservation.customerid);
        const room = await roomsModule.getRoomById(reservation.roomid);
        return {
          id: reservation.id,
          customername: customer ? customer.name : '삭제된 고객',
          customerphone: customer ? customer.phone : '-',
          roomname: room ? room.name : '삭제된 객실',
          checkindate: reservation.checkindate,
          checkoutdate: reservation.checkoutdate,
          price: reservation.price,
          status: reservation.status,
        };
      })
    );
    res.status(200).json(reservationList);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.patch('/api/reservation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (id == null) return res.status(400).json({ error: 'id 누락' });
    if (status == null) return res.status(400).json({ error: 'status 누락' });
    const updated = await roomsModule.updateReservationStatus(Number(id), Number(status));
    res.status(200).json({ msg: 'update reservation status success' });
    
    if(updated.status != 1 && updated.status != -1) return;

    const { phone } = await roomsModule.getCustomerById(Number(updated.customerid));
    const { name } = await roomsModule.getRoomById(Number(updated.roomid));

    // 나중에 더 상세한 예약 내역 설명으로 변경 + 결제링크까지?!
    const msg = `${name} ${updated.checkindate == updated.checkoutdate ? updated.checkindate : `${updated.checkindate} 입실 ~ ${updated.checkoutdate} 퇴실`} 예약이 ${updated.status==1 ? '확정' : '취소'}되었습니다.`;
    sendSMS(phone, msg);
    


  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

/* --------------------------- Discount APIs ---------------------------- */

app.get('/api/discount', async (req, res) => {
  try {
    const discount = await roomsModule.getDiscount();
    res.status(200).json({
      msg: 'get discount success',
      data: {
        firstVisitDiscount: discount.firstvisitdiscount,
        recentVisitDiscount: discount.recentvisitdiscount,
      },
    });
  } catch (error) {
    res.status(503).json({ err: 'get discount failed: ' + error.message });
  }
});

app.patch('/api/discount', async (req, res) => {
  try {
    const { firstVisitDiscount, recentVisitDiscount } = req.body;
    if (firstVisitDiscount == null) return res.status(400).json({ err: 'no firstVisitDiscount' });
    if (recentVisitDiscount == null) return res.status(400).json({ err: 'no recentVisitDiscount' });

    const info = await roomsModule.setDiscount(firstVisitDiscount, recentVisitDiscount);
    if ((info.rowCount ?? 0) === 0) {
      return res.status(400).json({ err: 'patch discount failed: no changes' });
    } else {
      return res.status(200).json({ msg: 'patch discount success' });
    }
  } catch (error) {
    res.status(503).json({ err: 'patch discount failed: ' + error.message });
  }
});

/* --------------------------- Customers APIs --------------------------- */

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id == null) return res.status(400).json({ err: 'id 누락' });
    await roomsModule.deleteCustomer(Number(id));
    res.status(200).json({ msg: 'delete customer success' });
  } catch (error) {
    res.status(503).json({ err: error.message });
  }
});

// customerInfo.js 67
app.post('/api/customers', async (req, res) => {
  const { id, name, phone, memo } = req.body;
  try {
    const result = await roomsModule.updateCustomer(id, name, phone, memo);
    res.status(result.status).json({ msg: result.msg });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// customerList.js 132
app.get('/api/customers', async (req, res) => {
  try {
    const rt = await roomsModule.getCustomerList();
    const customerList = await Promise.all(
      rt.map(async (customer) => {
        const reservations = await roomsModule.getReservationListByCustomerID(customer.id);
        const text = reservations.length > 0
          ? `${reservations[0].checkindate} ~ ${reservations[0].checkoutdate}`
          : '-';
        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          memo: customer.memo,
          recentreserve: text,
        };
      })
    );
    res.status(200).json(customerList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/search/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const result = await roomsModule.searchCustomer(number);
    res.status(result.status).json({
      msg: result.msg,
      data: result.customers,
    });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

/* --------------------------- Chatbot Helpers -------------------------- */

async function getReservationPrice(roomId, checkinDate, checkoutDate, discount) {
  let originalPrice = 0;
  let discountedPrice = 0;

  const startDate = new Date(checkinDate).setHours(0, 0, 0, 0);
  const endDate = new Date(checkoutDate).setHours(0, 0, 0, 0);

  const isOvernight = startDate !== endDate;

  let checkDate = new Date(startDate);
  do {
    let setting;
    const daily = await roomsModule.getDailyByDate(
      isOvernight ? 1 : 0,
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    );

    if (daily.length > 0) {
      setting = daily.find((row) => row.roomid == roomId);
    } else {
      const dayOfWeek = new Date(
        checkDate.getFullYear(),
        checkDate.getMonth(),
        checkDate.getDate()
      ).getDay();
      const tmp = await roomsModule.getSettingById(Number(roomId), isOvernight ? 1 : 0);
      setting = {
        status: JSON.parse(tmp.status)[dayOfWeek],
        price: JSON.parse(tmp.price)[dayOfWeek],
      };
    }

    if (setting.status == 0) return [-1, -1];
    originalPrice += Number(setting.price);

    discountedPrice -= discount;
    checkDate.setDate(checkDate.getDate() + 1);
  } while (checkDate < endDate);

  discountedPrice += originalPrice;
  return [originalPrice, discountedPrice];
}

/* --------------------------- Chatbot APIs ----------------------------- */

app.post('/api/chatbot/getReservationPrice', async (req, res) => {
  try {
    const { customerID, roomID, checkinDate, checkoutDate } = req.body;
    if (!customerID) return res.status(400).json({ error: 'customerID 누락' });
    if (!roomID) return res.status(400).json({ error: 'roomID 누락' });
    if (!checkinDate) return res.status(400).json({ error: 'checkinDate 누락' });
    if (!checkoutDate) return res.status(400).json({ error: 'checkoutDate 누락' });

    const customerReservations = await roomsModule.getReservationListByCustomerID(Number(customerID));
    const customerType = customerReservations.length > 0 ? 0 : 1;

    const discountRow = await roomsModule.getDiscount();
    const discount = customerType === 1
      ? discountRow.firstvisitdiscount
      : discountRow.recentvisitdiscount;

    const [originalPrice, discountedPrice] = await getReservationPrice(
      roomID,
      checkinDate,
      checkoutDate,
      discount
    );

    if (originalPrice == -1) {
      return res.status(200).json({
        ok: false,
        floatings: ['날짜 변경하기', '객실 변경하기', '취소하기'],
        msg: ['선택하신 날짜에 해당 객실이 마감되었습니다. 다른 날짜나 객실을 선택해주세요.'],
      });
    }

    let msg = [];
    const room = await roomsModule.getRoomById(Number(roomID));
    const szRoomName = room ? room.name : '삭제된 객실';
    const szStartDate = new Date(checkinDate).toLocaleDateString('ko-KR');
    const szEndDate = new Date(checkoutDate).toLocaleDateString('ko-KR');
    const szCustomerType = customerType == 1 ? '첫 예약 고객' : '단골 고객';
    const szOrginalPrice = originalPrice.toLocaleString();
    const szDiscountedPrice = discountedPrice.toLocaleString();
    const szDiscount = discount.toLocaleString();

    const overnight = szStartDate !== szEndDate;
    if (overnight) msg.push(`${szRoomName} ${szStartDate} 입실 ~ ${szEndDate} 퇴실`);
    else msg.push(`${szRoomName} ${szStartDate} 대실`);

    msg.push(`${szCustomerType} ${overnight ? '1박 당' : ''} ${szDiscount}원 할인 적용!`);
    msg.push(`기준가: ${szOrginalPrice}원 → 할인 가격: ${szDiscountedPrice}원`);
    msg.push(`예약하시겠습니까?`);

    return res.status(200).json({
      ok: true,
      floatings: ['날짜 변경하기', '객실 변경하기', '예약하기', '취소하기'],
      msg,
    });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});


function sendSMS(receiver, msg) {
  if (typeof receiver != 'string') throw new Error('receiver is not a string');
  if (typeof msg != 'string') throw new Error('msg is not a string');

  const params = new URLSearchParams();
  params.append('key', process.env.ALIGO_API_KEY);
  params.append('userid', process.env.ALIGO_USERID);
  params.append('sender', process.env.SMS_FROM);
  params.append('receiver', receiver);
  params.append('msg', msg);
  params.append('testmode_yn', 'Y'); // 테스트 모드

  return axios.post('https://apis.aligo.in/send/', params, {
    timeout: 10000,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  });
}


app.post('/api/client/reservation', async (req, res) => {
  const { date, night, roomType, phone } = req.body;

    if(date == null || typeof date != 'string') 
      return res.status(400).json({ error: 'date is required and must be a string' });
    if(night == null || typeof night != 'number') 
      return res.status(400).json({ error: 'night is required and must be a number' });
    if(roomType == null || typeof roomType != 'string') 
      return res.status(400).json({ error: 'roomType is required and must be a string' });
    if(phone == null || typeof phone != 'string') 
      return res.status(400).json({ error: 'phone is required and must be a string' });

    res.status(200).json({ msg: 'reservation success' });
    
    // 데이터베이스 구조 변경 이후 수정 필요
    //await roomsModule.createReservation(customerID, roomID, checkinDate, checkoutDate, price, 0);
    
    sendSMS(process.env.SMS_FROM, "새로운 예약이 들어왔습니다.")
      .then((r) => {
        const code = Number(r.data.result_code);
        if (code < 0) throw new Error(r.data.result_msg);
      })
      .catch((error) => {
        console.error('SMS 발송 실패: ', error.message);
      });
});



/* ------------------------------ Auth Temp ----------------------------- */
let adminToken = -1;
app.get('/api/admin/login/:password', (req, res) => {
  try{
    const { password } = req.params;
    if (password === '123') {
      adminToken = Date.now();
      res.json(adminToken);
    }
    else res.json(-1);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.post(`/api/admin/:token`, (req, res) => {
  try{
    const { token } = req.params;
    if (Number(token) == adminToken) res.json({ msg: 'success' });
    else res.json({ msg: 'fail' });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});


/* --------------------------- Customer Auth ---------------------------- */

app.post('/api/chatbot/confirmReservation', async (req, res) => {
  res.status(400).json({ msg: 'deleted api' });
});

app.post('/api/customers/register/:phone', async (req, res) => {
  res.status(404).json({ msg: 'deleted api' });
});

app.get('/api/chatbot/certify/:phone', async (req, res) => {
  res.status(404).json({ msg: 'deleted api' });
});

app.get('/api/chatbot/getReservationList/:phone', async (req, res) => {
  res.status(404).json({ msg: 'deleted api' });
});