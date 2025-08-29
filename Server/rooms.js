const Database = require("better-sqlite3");
const roomsDB = new Database("rooms.db");

roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS room (
        id INTEGER PRIMARY KEY,

        name TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL
    );
`);

roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS image (
        id       INTEGER,

        data     BLOB NOT NULL,    
        mime     TEXT NOT NULL,    
        size     INTEGER NOT NULL
    );
`);

roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS setting (
        roomId INTEGER,
        bOvernight INTEGER NOT NULL CHECK (bOvernight IN (0, 1)),

        status TEXT NOT NULL,
        price TEXT NOT NULL,
        openClose TEXT NOT NULL,
        usageTime TEXT NOT NULL
    );
`);
roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS daily (
        roomId INTEGER,
        bOvernight INTEGER NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,

        status INTEGER NOT NULL,
        price INTEGER NOT NULL,
        open INTEGER NOT NULL,
        close INTEGER NOT NULL,
        usageTime INTEGER NOT NULL
    );
`);

roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY,
        customerID INTEGER NOT NULL,
        roomID INTEGER NOT NULL,
        checkinDate TEXT NOT NULL,
        checkoutDate TEXT NOT NULL,
        price INTEGER NOT NULL,
        status INTEGER NOT NULL
    );
`);

roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS discount (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        firstVisitDiscount INTEGER NOT NULL,
        recentVisitDiscount INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO discount (id, firstVisitDiscount, recentVisitDiscount) VALUES (1, 5000, 5000);
`);

roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      memo TEXT
    );
  `);

  
function getCustomerById(id) {
    if(typeof id !== 'number') throw new Error('id must be a number');

    return roomsDB.prepare(`
        SELECT * FROM customers 
        WHERE id = ?
    `).get(id);
}

function saveCustomer(name, phone, memo) {
    if(!name) return { 
        status: 400, 
        msg: '고객명이 누락되었습니다.' 
    };

    if(!phone) return { 
        status: 400, 
        msg: '연락처가 누락되었습니다.' 
    };

    try{
        const existingCustomer = roomsDB.prepare(
            'SELECT id FROM customers WHERE phone = ?'
        ).get(phone);

        if(existingCustomer) return { 
            status: 400, 
            msg: '이미 등록된 전화번호입니다.' 
        };
    } 
    catch(error){
        return {
            status: 500,
            msg: error.message
        };
    }

    const customerId = Date.now();
    console.log('customerId: ', customerId);

    try{
        const result = roomsDB.prepare(
            'INSERT INTO customers (id, name, phone, memo) VALUES (?, ?, ?, ?)'
        ).run(customerId, name, phone, memo || '');
    } 
    catch(error){
        return {
            status: 500,
            msg: error.message || '고객 등록 오류가 발생했습니다.'
        };
    }

    return {
        status: 200,
        msg: '고객이 성공적으로 등록되었습니다.'
    };

}

function getCustomerList() {
    return roomsDB.prepare(`
        SELECT * 
        FROM customers
    `).all();
}

function deleteCustomer(id) {
    if(typeof id !== 'number') throw new Error('id must be a number');
    return roomsDB.prepare(`
        DELETE 
        FROM customers 
        WHERE id = ?
    `).run(id);
}

function updateCustomer(id, name, phone, memo) {
    if(!id) return saveCustomer(name, phone, memo);

    try {
        roomsDB.prepare('UPDATE customers SET name = ?, phone = ?, memo = ? WHERE id = ?').run(name, phone, memo, id);
        return {
            status: 200,
            msg: '고객 수정 성공',
        };
    }
    catch (error) {
        return {
            status: 500,
            msg: error.message,
        };
    }
}

function searchCustomer(number) {
    const customers = roomsDB.prepare(
        'SELECT * FROM customers WHERE phone LIKE ?'
    ).all(`%${number}%`);

    return {
        status: 200,
        msg: '고객 검색 성공',
        customers: customers
    };
}

function registerCustomer(phone) {
    const customer = roomsDB.prepare(
        'SELECT * FROM customers WHERE phone = ?'
    ).get(phone);
    if(customer) 
        return {
            status: 400, 
            msg: '이미 등록된 고객입니다.',
        };

    const id = Date.now();
    const name = '익명';
    const memo = '';
    roomsDB.prepare(
        'INSERT INTO customers (id, name, phone, memo) VALUES (?, ?, ?, ?)'
    ).run(id, name, phone, memo);
    return {
        status: 200, 
        msg: '고객 등록 성공',
    };
}

function getCustomer(phone) {
    return roomsDB.prepare(
        'SELECT * FROM customers WHERE phone = ?'
    ).get(phone);
}

function getDiscount() {
    const row = roomsDB.prepare(`
        SELECT * FROM discount
        WHERE id = 1
    `).get();
    return row;
}

function setDiscount(nFirstVisitDiscount, nRecentVisitDiscount) {
    const info = roomsDB.prepare(`
        UPDATE discount 
        SET firstVisitDiscount = ?, recentVisitDiscount = ?
        WHERE id = 1
    `).run(nFirstVisitDiscount, nRecentVisitDiscount);
    return info;
}

function createImage(data, mime, size) {
    if(!(data instanceof Buffer)) 
        throw new Error("data must be a Buffer");
    if(typeof mime !== 'string') 
        throw new Error("mime must be a string");
    if(typeof size !== 'number') 
        throw new Error("size must be a number");

    return roomsDB.prepare(`
        INSERT INTO image (id, data, mime, size)
        VALUES (?, ?, ?, ?)
        RETURNING *
    `).get(new Date().getTime(), data, mime, size);
}

function getImageById(id) {
    if(typeof id !== 'number') 
        throw new Error("id must be a number");

    return roomsDB.prepare(`
        SELECT * 
        FROM image 
        WHERE id = ?
    `).get(id);
}

function createReservation(customerID, roomID, checkinDate, checkoutDate, price, status) {
    if(typeof customerID !== 'number') 
        throw new Error("customerID must be a number");
    if(typeof roomID !== 'number') 
        throw new Error("roomID must be a number");
    if(typeof checkinDate !== 'string') 
        throw new Error("checkinDate must be a string");
    if(typeof checkoutDate !== 'string') 
        throw new Error("checkoutDate must be a string");
    if(typeof price !== 'number') 
        throw new Error("price must be a number");
    if(typeof status !== 'number') 
        throw new Error("status must be a number");

    return roomsDB.prepare(`
        INSERT INTO reservations (customerID, roomID, checkinDate, checkoutDate, price, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(customerID, roomID, checkinDate, checkoutDate, price, status);
}

function getReservationList() {
    return roomsDB.prepare(`SELECT * FROM reservations`).all();
}

function updateReservationStatus(id, status) {
    if(typeof id !== 'number') throw new Error("id must be a number");
    if(typeof status !== 'number') throw new Error("status must be a number");

    return roomsDB.prepare(`
        UPDATE reservations
        SET status = ?
        WHERE id = ?
    `).run(status, id);
}

function getRoomList() {
    return roomsDB.prepare(`SELECT * FROM room`).all();
}

function getRoomById(id) {
    if(typeof id !== 'number') 
        throw new Error("id must be a number");

    return roomsDB.prepare(`
        SELECT * 
        FROM room 
        WHERE id = ?
        `).get(id);
}

function updateRoom(id, szName, szImagePaths, szDescription) {
    if(typeof id !== 'number') 
        throw new Error("id must be a number");
    if(typeof szName !== 'string') 
        throw new Error("szName must be a string");
    if(typeof szImagePaths !== 'string') 
        throw new Error("szImagePaths must be a string");
    if(typeof szDescription !== 'string') 
        throw new Error("szDescription must be a string");

    return roomsDB.prepare(`
        UPDATE room
        SET name = ?, image = ?, description = ?
        WHERE id = ?
    `).run(szName, szImagePaths, szDescription, id);
}

function deleteRoom(id) {
    if(typeof id !== 'number') 
        throw new Error("id must be a number");

    roomsDB.prepare(`
        DELETE FROM room
        WHERE id = ?
    `).run(id);

    roomsDB.prepare(`
        DELETE FROM setting
        WHERE roomId = ?
    `).run(id);

    roomsDB.prepare(`
        DELETE FROM daily
        WHERE roomId = ?
    `).run(id);
}

function createRoom(szName, szImagePath, szDescription) {
    if(typeof szName !== 'string') 
        throw new Error("szName must be a string");
    if(typeof szImagePath !== 'string') 
        throw new Error("szImagePath must be a string");
    if(typeof szDescription !== 'string') 
        throw new Error("szDescription must be a string");

    const rt = roomsDB.prepare(`
        INSERT INTO room (name, image, description)
        VALUES (?, ?, ?)
    `).run(szName, szImagePath, szDescription);
    const roomId = rt.lastInsertRowid;

    // 기본 설정 (대실) 생성
    roomsDB.prepare(`
        INSERT INTO setting (roomId, bOvernight, status, price, openClose, usageTime)
        VALUES (?, 0, 
        '[1,1,1,1,1,1,1]', 
        '[30000,30000,30000,30000,30000,30000,30000]', 
        '[[12,22],[12,22],[12,22],[12,22],[12,22],[12,22],[12,22]]', 
        '[5,5,5,5,5,5,5]')
    `).run(roomId);

    // 기본 설정 (숙박) 생성
    roomsDB.prepare(`
        INSERT INTO setting (roomId, bOvernight, status, price, openClose, usageTime)
        VALUES (?, 1,
        '[1,1,1,1,1,1,1]', 
        '[50000,50000,50000,50000,50000,50000,50000]', 
        '[[13,11],[13,11],[13,11],[13,11],[13,11],[13,11],[13,11]]', 
        '[0,0,0,0,0,0,0]')
    `).run(roomId);

    return roomId;
}

function getSettingList(bIsOvernight) {
    if(typeof bIsOvernight !== 'number') 
        throw new Error("bIsOvernight must be a number");

    return roomsDB.prepare(`
        SELECT * 
        FROM setting
        WHERE bOvernight = ?    
        `).all(bIsOvernight);
}

function getSettingById(id, bIsOvernight) {
    if(typeof id !== 'number') 
        throw new Error("id must be a number");
    if(typeof bIsOvernight !== 'number') 
        throw new Error("bIsOvernight must be a number");

    const overnight = bIsOvernight ? 1 : 0;
    return roomsDB.prepare(`
        SELECT * 
        FROM setting
        WHERE roomId = ? AND bOvernight = ?
        `).get(id, overnight);
}

function updateSetting(id, bIsOvernight, status, price, openClose, usageTime) {
    if(typeof id !== 'number') 
        throw new Error("id must be a number");
    if(typeof bIsOvernight !== 'number') 
        throw new Error("bIsOvernight must be a number");
    if(typeof status !== 'string') 
        throw new Error("status must be a string");
    if(typeof price !== 'string') 
        throw new Error("price must be a string");
    if(typeof openClose !== 'string') 
        throw new Error("openClose must be a string");
    if(typeof usageTime !== 'string') 
        throw new Error("usageTime must be a string");

    return roomsDB.prepare(`
        UPDATE setting
        SET status = ?, price = ?, openClose = ?, usageTime = ?
        WHERE roomId = ? AND bOvernight = ?
    `).run(status, price, openClose, usageTime, id, bIsOvernight);
}

function getDailyListByMonth(bIsOvernight, year, month) {
    if(typeof bIsOvernight !== 'number') 
        throw new Error("bIsOvernight must be a number");
    if(typeof year !== 'number') 
        throw new Error("year must be a number");
    if(typeof month !== 'number') 
        throw new Error("month must be a number");

    return roomsDB.prepare(`
        SELECT * 
        FROM daily
        WHERE bOvernight = ? AND year = ? AND month = ?
    `).all(bIsOvernight, year, month);
}

function getDailyByDate(bIsOvernight, year, month, date) {
    if(typeof bIsOvernight !== 'number') 
        throw new Error("bIsOvernight must be a number");
    if(typeof year !== 'number') 
        throw new Error("year must be a number");
    if(typeof month !== 'number') 
        throw new Error("month must be a number");
    if(typeof date !== 'number') 
        throw new Error("date must be a number");

    return roomsDB.prepare(`
        SELECT * FROM daily
        WHERE bOvernight = ? AND year = ? AND month = ? AND day = ?
    `).all(bIsOvernight, year, month, date)
}

function updateDaily(bIsOvernight, date, month, year, roomId, status, price, open, close, usageTime) {
    if(typeof bIsOvernight !== 'number') 
        throw new Error("bIsOvernight must be a number");
    if(typeof date !== 'number') 
        throw new Error("date must be a number");
    if(typeof month !== 'number') 
        throw new Error("month must be a number");
    if(typeof year !== 'number') 
        throw new Error("year must be a number");
    if(typeof roomId !== 'number') 
        throw new Error("roomId must be a number");
    if(typeof status !== 'number') 
        throw new Error("status must be a number");
    if(typeof price !== 'number') 
        throw new Error("price must be a number");
    if(typeof open !== 'number') 
        throw new Error("open must be a number");
    if(typeof close !== 'number') 
        throw new Error("close must be a number");
    if(typeof usageTime !== 'number') 
        throw new Error("usageTime must be a number");

    const bExist = roomsDB.prepare(`
        SELECT * FROM daily
        WHERE bOvernight = ? AND year = ? AND month = ? AND day = ? AND roomId = ?
    `).get(bIsOvernight, year, month, date, roomId);

    if(!bExist) {
        roomsDB.prepare(`
            INSERT INTO daily (bOvernight, year, month, day, roomId, status, price, open, close, usageTime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            bIsOvernight, year, month, date, roomId, 
            status, price, open, close, usageTime
        );
    }
    else {
        roomsDB.prepare(`
            UPDATE daily
            SET status = ?, price = ?, open = ?, close = ?, usageTime = ?
            WHERE bOvernight = ? AND year = ? AND month = ? AND day = ? AND roomId = ?
        `).run(
            status, price, open, close, usageTime, 
            bIsOvernight, year, month, date, roomId
        );
    }
}

function getReservationListByCustomerID(customerID) {
    if(typeof customerID !== 'number') 
        throw new Error("customerID must be a number");

    return roomsDB.prepare(`
        SELECT * FROM reservations
        WHERE customerID = ?
        ORDER BY id DESC
    `).all(customerID);
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
    getCustomerById
    
}