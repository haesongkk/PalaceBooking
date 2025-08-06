const Database = require("better-sqlite3");
const defaultSettingsDb = new Database("defaultSettings.db");

defaultSettingsDb.prepare(`
    CREATE TABLE IF NOT EXISTS defaultSettings (
        id INTEGER PRIMARY KEY,
        roomType TEXT NOT NULL,
        
        overnightStatus TEXT NOT NULL,
        overnightPrice INTEGER NOT NULL,
        overnightOpenClose TEXT NOT NULL,

        dailyStatus TEXT NOT NULL,
        dailyPrice INTEGER NOT NULL,
        dailyOpenClose TEXT NOT NULL,
        dailyUsageTime TEXT NOT NULL
    )
`).run();

function getAllDefaultSettings() {
    try{
        const defaultSettings = defaultSettingsDb.prepare(`
            SELECT * FROM defaultSettings
        `).all();
        return {
            status: 200,
            msg: '기본 설정 조회 성공',
            data: defaultSettings
        }
    }
    catch(error){
        return {
            status: 500,
            msg: error.message || '기본 설정 조회 오류가 발생했습니다.',
            data: null
        };
    }
}

function createDefaultSettings() {
    const id = Date.now();
    const roomType = '객실';

    const overnightStatus = JSON.stringify(Array(7).fill(1));
    const overnightPrice = JSON.stringify(Array(7).fill(50000));
    const overnightOpenClose = JSON.stringify(Array(7).fill([14, 22]));

    const dailyStatus = JSON.stringify(Array(7).fill(1));
    const dailyPrice = JSON.stringify(Array(7).fill(30000));
    const dailyOpenClose = JSON.stringify(Array(7).fill([14, 22]));
    const dailyUsageTime = JSON.stringify(Array(7).fill(5));

    try{
        defaultSettingsDb.prepare(`
            INSERT INTO defaultSettings (id, roomType, overnightStatus, overnightPrice, overnightOpenClose, dailyStatus, dailyPrice, dailyOpenClose, dailyUsageTime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, roomType, overnightStatus, overnightPrice, overnightOpenClose, dailyStatus, dailyPrice, dailyOpenClose, dailyUsageTime);

        return {
            status: 200,
            msg: '기본 설정 생성 성공',
            data: {
                id,
                roomType,
                overnightStatus,
                overnightPrice,
                overnightOpenClose,
                dailyStatus,
                dailyPrice,
                dailyOpenClose,
                dailyUsageTime
            }
        }
    }
    catch(error){
        return {
            status: 500,
            msg: error.message || '기본 설정 생성 오류가 발생했습니다.',
            data: null
        }
    }
}

function updateDefaultSettings(id, roomType, overnightStatus, overnightPrice, overnightOpenClose, dailyStatus, dailyPrice, dailyOpenClose, dailyUsageTime) {
    try{
        defaultSettingsDb.prepare(`
            UPDATE defaultSettings SET roomType = ?, overnightStatus = ?, overnightPrice = ?, overnightOpenClose = ?, dailyStatus = ?, dailyPrice = ?, dailyOpenClose = ?, dailyUsageTime = ? WHERE id = ?
        `).run(roomType, overnightStatus, overnightPrice, overnightOpenClose, dailyStatus, dailyPrice, dailyOpenClose, dailyUsageTime, id);
        return {
            status: 200,
            msg: '기본 설정 수정 성공',
            data: null
        }
    } catch(error){ 
        return {
            status: 500,
            msg: error.message || '기본 설정 수정 오류가 발생했습니다.',
            data: null
        }
    }
}

function deleteDefaultSettings(id) {
    try{
        defaultSettingsDb.prepare(`
            DELETE FROM defaultSettings WHERE id = ?
        `).run(id);
        return {
            status: 200,
            msg: '기본 설정 삭제 성공',
            data: null
        }
    }
    catch(error){
        return {
            status: 500,
            msg: error.message || '기본 설정 삭제 오류가 발생했습니다.',
            data: null
        }
    }


}

function getRoomType(roomId) {
    const roomType = defaultSettingsDb.prepare(`
        SELECT roomType FROM defaultSettings
        WHERE id = ?
    `).get(roomId);
    return {
        status: 200,
        msg: '기본 설정 조회 성공',
        data: roomType
    }
}
module.exports = {
    getAllDefaultSettings,
    updateDefaultSettings,
    createDefaultSettings,
    deleteDefaultSettings,
    getRoomType
};
