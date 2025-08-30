// db.js (PostgreSQL 버전)
const { Pool } = require('pg');
const fs = require('fs');

console.log("DATABASE_URL: ", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set. Put External Database URL into your .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render DB 필수
});

// --- 스키마 생성 (모듈 로드시 1회) ---
async function ensureSchema() {
  const ddl = fs.readFileSync('./data.sql', 'utf-8');
  await pool.query(ddl);
}
const ready = ensureSchema();

// --- Helpers ---
async function q(sql, params) {
  await ready;
  return pool.query(sql, params);
}

// --- 이미지 ---
async function createImage(data, mime, size) {
  if (!(data instanceof Buffer)) return { status: 400, msg: 'data must be a Buffer' };
  if (typeof mime !== 'string')  return { status: 400, msg: 'mime must be a string' };
  if (typeof size !== 'number')  return { status: 400, msg: 'size must be a number' };

  const { rows } = await q(
    `INSERT INTO image (data, mime, size)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data, mime, size]
  );
  return rows[0];
}

async function getImageById(id) {
  const { rows } = await q(`SELECT * FROM image WHERE id = $1`, [id]);
  return rows[0] || null;
}

// --- 방(Room) ---
async function getRoomList() {
  const { rows } = await q(`SELECT * FROM room`);
  return rows;
}

async function getRoomById(id) {
  const { rows } = await q(`SELECT * FROM room WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function updateRoom(id, szName, szImagePaths, szDescription) {
  return q(
    `UPDATE room SET name = $1, image = $2, description = $3 WHERE id = $4`,
    [szName, szImagePaths, szDescription, id]
  );
}

async function deleteRoom(id) {
  await q(`DELETE FROM room   WHERE id = $1`, [id]);
  await q(`DELETE FROM setting WHERE roomid = $1`, [id]);
  await q(`DELETE FROM daily   WHERE roomid = $1`, [id]);
}

async function createRoom(szName, szImagePath, szDescription) {
  const ins = await q(
    `INSERT INTO room (name, image, description) VALUES ($1,$2,$3) RETURNING id`,
    [szName, szImagePath, szDescription]
  );
  const roomId = ins.rows[0].id;

  // 기본 설정 (대실)
  await q(
    `INSERT INTO setting (roomid, bovernight, status, price, openclose, usagetime)
     VALUES ($1, 0, $2, $3, $4, $5)`,
    [
      roomId,
      '[1,1,1,1,1,1,1]',
      '[30000,30000,30000,30000,30000,30000,30000]',
      '[[12,22],[12,22],[12,22],[12,22],[12,22],[12,22],[12,22]]',
      '[5,5,5,5,5,5,5]',
    ]
  );
  // 기본 설정 (숙박)
  await q(
    `INSERT INTO setting (roomid, bovernight, status, price, openclose, usagetime)
     VALUES ($1, 1, $2, $3, $4, $5)`,
    [
      roomId,
      '[1,1,1,1,1,1,1]',
      '[50000,50000,50000,50000,50000,50000,50000]',
      '[[13,11],[13,11],[13,11],[13,11],[13,11],[13,11],[13,11]]',
      '[0,0,0,0,0,0,0]',
    ]
  );

  return roomId;
}

// --- 설정(Setting) ---
async function getSettingList(bIsOvernight) {
  const { rows } = await q(`SELECT * FROM setting WHERE bovernight = $1`, [bIsOvernight]);
  return rows;
}

async function getSettingById(id, bIsOvernight) {
  const overnight = bIsOvernight ? 1 : 0;
  const { rows } = await q(
    `SELECT * FROM setting WHERE roomid = $1 AND bovernight = $2`,
    [id, overnight]
  );
  return rows[0] || null;
}

async function updateSetting(id, bIsOvernight, status, price, openclose, usagetime) {
  return q(
    `UPDATE setting
     SET status = $1, price = $2, openclose = $3, usagetime = $4
     WHERE roomid = $5 AND bovernight = $6`,
    [status, price, openclose, usagetime, id, bIsOvernight]
  );
}

// --- 일일(Daily) ---
async function getDailyListByMonth(bIsOvernight, year, month) {
  const { rows } = await q(
    `SELECT * FROM daily WHERE bovernight = $1 AND year = $2 AND month = $3`,
    [bIsOvernight, year, month]
  );
  return rows;
}

async function getDailyByDate(bIsOvernight, year, month, date) {
  const { rows } = await q(
    `SELECT * FROM daily
     WHERE bovernight = $1 AND year = $2 AND month = $3 AND day = $4`,
    [bIsOvernight, year, month, date]
  );
  return rows;
}

async function updateDaily(bIsOvernight, date, month, year, roomId, status, price, open, close, usagetime) {
  const { rows } = await q(
    `SELECT 1 FROM daily
     WHERE bovernight = $1 AND year = $2 AND month = $3 AND day = $4 AND roomid = $5`,
    [bIsOvernight, year, month, date, roomId]
  );

  if (rows.length === 0) {
    await q(
      `INSERT INTO daily (bovernight, year, month, day, roomid, status, price, open, close, usagetime)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [bIsOvernight, year, month, date, roomId, status, price, open, close, usagetime]
    );
  } else {
    await q(
      `UPDATE daily
       SET status = $1, price = $2, open = $3, close = $4, usagetime = $5
       WHERE bovernight = $6 AND year = $7 AND month = $8 AND day = $9 AND roomid = $10`,
      [status, price, open, close, usagetime, bIsOvernight, year, month, date, roomId]
    );
  }
}

// --- 예약(Reservations) ---
async function createReservation(customerid, roomid, checkindate, checkoutdate, price, status) {
  return q(
    `INSERT INTO reservations (customerid, roomid, checkindate, checkoutdate, price, status)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [customerid, roomid, checkindate, checkoutdate, price, status]
  );
}

async function getReservationList() {
  const { rows } = await q(`SELECT * FROM reservations ORDER BY id DESC`);
  return rows;
}

async function updateReservationStatus(id, status) {
  return q(`UPDATE reservations SET status = $1 WHERE id = $2`, [status, id]);
}

async function getReservationListByCustomerID(customerid) {
  const { rows } = await q(
    `SELECT * FROM reservations WHERE customerid = $1 ORDER BY id DESC`,
    [customerid]
  );
  return rows;
}

// --- 할인(Discount) ---
async function getDiscount() {
  const { rows } = await q(`SELECT * FROM discount WHERE id = 1`);
  return rows[0] || null;
}

async function setDiscount(firstvisitdiscount, recentvisitdiscount) {
  return q(
    `UPDATE discount
     SET firstvisitdiscount = $1, recentvisitdiscount = $2
     WHERE id = 1`,
    [firstvisitdiscount, recentvisitdiscount]
  );
}

// --- 고객(Customers) ---
async function getCustomerById(id) {
  const { rows } = await q(`SELECT * FROM customers WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function saveCustomer(name, phone, memo) {
  if (!name)  return { status: 400, msg: '고객명이 누락되었습니다.' };
  if (!phone) return { status: 400, msg: '연락처가 누락되었습니다.' };

  try {
    const existing = await q(`SELECT id FROM customers WHERE phone = $1`, [phone]);
    if (existing.rows.length) {
      return { status: 400, msg: '이미 등록된 전화번호입니다.' };
    }
    const customerId = Date.now();
    await q(
      `INSERT INTO customers (id, name, phone, memo) VALUES ($1,$2,$3,$4)`,
      [customerId, name, phone, memo || '']
    );
    return { status: 200, msg: '고객이 성공적으로 등록되었습니다.' };
  } catch (err) {
    return { status: 500, msg: err.message || '고객 등록 오류가 발생했습니다.' };
  }
}

async function getCustomerList() {
  const { rows } = await q(`SELECT * FROM customers`);
  return rows;
}

async function deleteCustomer(id) {
  return q(`DELETE FROM customers WHERE id = $1`, [id]);
}

async function updateCustomer(id, name, phone, memo) {
  if (!id) return saveCustomer(name, phone, memo);
  try {
    await q(`UPDATE customers SET name = $1, phone = $2, memo = $3 WHERE id = $4`,
      [name, phone, memo, id]);
    return { status: 200, msg: '고객 수정 성공' };
  } catch (err) {
    return { status: 500, msg: err.message };
  }
}

async function searchCustomer(number) {
  const { rows } = await q(
    `SELECT * FROM customers WHERE phone LIKE $1`,
    [`%${number}%`]
  );
  return { status: 200, msg: '고객 검색 성공', customers: rows };
}

async function registerCustomer(phone) {
  const { rows } = await q(`SELECT * FROM customers WHERE phone = $1`, [phone]);
  if (rows.length) return { status: 400, msg: '이미 등록된 고객입니다.' };

  const id = Date.now();
  await q(
    `INSERT INTO customers (id, name, phone, memo) VALUES ($1,$2,$3,$4)`,
    [id, '익명', phone, '']
  );
  return { status: 200, msg: '고객 등록 성공' };
}

async function getCustomer(phone) {
  const { rows } = await q(`SELECT * FROM customers WHERE phone = $1`, [phone]);
  return rows[0] || null;
}

module.exports = {
  getImageById,
  createImage,

  getRoomList,
  getRoomById,
  updateRoom,
  deleteRoom,
  createRoom,

  getSettingList,
  getSettingById,
  updateSetting,

  getDailyListByMonth,
  getDailyByDate,
  updateDaily,

  getReservationList,
  getReservationListByCustomerID,
  createReservation,
  updateReservationStatus,

  getDiscount,
  setDiscount,

  getCustomerList,
  deleteCustomer,
  updateCustomer,
  searchCustomer,
  registerCustomer,
  getCustomer,
  getCustomerById,
};
