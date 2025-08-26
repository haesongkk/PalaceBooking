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
        roomId INTEGER REFERENCES room(id),
        bOvernight INTEGER NOT NULL CHECK (bOvernight IN (0, 1)),

        status TEXT NOT NULL,
        price TEXT NOT NULL,
        openClose TEXT NOT NULL,
        usageTime TEXT NOT NULL
    );
`);
roomsDB.exec(`
    CREATE TABLE IF NOT EXISTS daily (
        roomId INTEGER REFERENCES room(id),
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

function getRoomList() {
    try {
        return {
            ok: true,
            msg: ``,
            data: roomsDB.prepare(`SELECT * FROM room`).all()
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
            data: []
        }
    }
}

function getRoomById(nID) {
    try {
        return {
            ok: true,
            msg: ``,
            data: roomsDB.prepare(`SELECT * FROM room WHERE id = ?`).get(nID)
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
            data: null
        }
    }
}

function updateRoom(id, szName, imagePath, szDescription) {
    try {
        roomsDB.prepare(`
            UPDATE room
            SET name = ?, image = ?, description = ?
            WHERE id = ?
        `).run(szName, JSON.stringify(imagePath), szDescription, id)
        return {
            ok: true,
            msg: ``,
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
        }
    }
}

function deleteRoom(id) {
    try {
        roomsDB.prepare(`
            DELETE FROM room
            WHERE id = ?
        `).run(id);

        // 기본 설정 (대실/숙박) 삭제
        roomsDB.prepare(`
            DELETE FROM setting
            WHERE roomId = ?
        `).run(id);

        // 일일 설정 (대실/숙박) 삭제
        roomsDB.prepare(`
            DELETE FROM daily
            WHERE roomId = ?
        `).run(id);

        return {
            ok: true,
            msg: ``,
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
        }
    }
}

function createRoom(szName, szImagePath, szDescription) {
    try {
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

        return {
            ok: true,
            msg: ``,
            data: roomId
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
            data: null
        }
    }
}

function getSettingList(bIsOvernight) {
    try {
        return {
            ok: true,
            msg: ``,
            data: roomsDB.prepare(`
                SELECT * 
                FROM setting
                WHERE bOvernight = ?    
                `).all(bIsOvernight)
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
            data: []
        }
    }
}

function getSettingById(id, bIsOvernight) {
    try {
        const overnight = bIsOvernight ? 1 : 0;
        console.log(roomsDB.prepare(`
            SELECT * 
            FROM setting
            WHERE roomId = ? AND bOvernight = ?
            `).get(id, overnight));
        return {
            ok: true,
            msg: ``,
            data: roomsDB.prepare(`
                SELECT * 
                FROM setting
                WHERE roomId = ? AND bOvernight = ?
                `).get(id, overnight)
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
            data: null
        }
    }
}

function updateSetting(id, bIsOvernight, status, price, openClose, usageTime) {
    try {
        roomsDB.prepare(`
            UPDATE setting
            SET status = ?, price = ?, openClose = ?, usageTime = ?
            WHERE roomId = ? AND bOvernight = ?
        `).run(status, price, openClose, usageTime, id, bIsOvernight);
        return {
            ok: true,
            msg: ``,
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
        }
    }
}

function getDailyListByMonth(bIsOvernight, year, month) {
    try {
        return {
            ok: true,
            msg: ``,
            data: roomsDB.prepare(`
                SELECT * 
                FROM daily
                WHERE bOvernight = ? AND year = ? AND month = ?
            `).all(bIsOvernight, year, month)
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
            data: []
        }
    }
}

function getDailyByDate(bIsOvernight, year, month, date) {
    try {
        return {
            ok: true,
            msg: ``,
            data: roomsDB.prepare(`
                SELECT * FROM daily
                WHERE bOvernight = ? AND year = ? AND month = ? AND day = ?
            `).get(bIsOvernight, year, month, date)
        }
    }
    catch (error) {
        return {
            ok: false,
            msg: error,
            data: null
        }
    }
}

function updateDaily(bIsOvernight, date, month, year, roomId, status, price, open, close, usageTime) {
    try {
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
        return {
            ok: true,
            msg: ``,
        }
    } catch (error) {
        return {
            ok: false,
            msg: error,
        }
    }
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
    updateDaily
}