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

    createReservation,
    getReservationList,
    updateReservationStatus,
    getReservationListByCustomerID,
}