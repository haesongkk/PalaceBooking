const Database = require("better-sqlite3");

const dailySettingsDB = new Database("dailySettings.db");

dailySettingsDB.prepare(`
    CREATE TABLE IF NOT EXISTS date (
        id INTEGER PRIMARY KEY,

        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        date INTEGER NOT NULL
    )
`).run();

dailySettingsDB.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
        dateId INTEGER NOT NULL,
        roomId INTEGER NOT NULL,
        isOvernight INTEGER,

        status INTEGER NOT NULL,
        price INTEGER NOT NULL,
        openClose TEXT NOT NULL,
        usageTime INTEGER
    )
`).run();


function getMonthlyDailySettings(year, month, isOvernight) {
    const days = dailySettingsDB.prepare(`
        SELECT * FROM date
        WHERE year = ? AND month = ?
        `).all(year, month);

    console.log("days: ", days);
    const settings = [];
    days.forEach(day => {
        const daySettings = dailySettingsDB.prepare(`
            SELECT * FROM settings
            WHERE dateId = ? AND isOvernight = ?
        `).all(day.id, isOvernight);
        
        // 각 설정에 dateId 추가
        daySettings.forEach(setting => {
            setting.dateId = day.id;
        });
        
        // 배열을 평면화하여 추가
        settings.push(...daySettings);
    });
    console.log("settings: ", settings);
    return {
        status: 200,
        data: settings,
        msg: '월별 설정 조회 성공'
    }
}

function getDate(dateId) {
    const dateData = dailySettingsDB.prepare(`
        SELECT * FROM date
        WHERE id = ?
    `).get(dateId);
    
    if (dateData) {
        return {
            status: 200,
            msg: '날짜 조회 성공',
            data: dateData
        };
    } else {
        return {
            status: 404,
            msg: '날짜를 찾을 수 없습니다',
            data: -1
        };
    }
}

function getDateId(date, month, year) {
    const dateData = dailySettingsDB.prepare(`
        SELECT * FROM date
        WHERE year = ? AND month = ? AND date = ?
    `).get(year, month, date);
    
    if (dateData) {
        return dateData.id;
    } 
    else {
        const id = year*10000 + month*100 + date;
        dailySettingsDB.prepare(`
            INSERT INTO date (id, year, month, date) VALUES (?, ?, ?, ?)
        `).run(id, year, month, date);
        
        return id;
    }
}

function updateSettingsTable(dateId, roomId, isOvernight, status, price, openClose, usageTime) {
    // 먼저 기존 데이터가 있는지 확인
    const settingData = dailySettingsDB.prepare(`
        SELECT * FROM settings
        WHERE dateId = ? AND roomId = ? AND isOvernight = ?
    `).get(dateId, roomId, isOvernight);
    
    if (settingData) {
        // 기존 데이터가 있으면 UPDATE로 덮어쓰기
        dailySettingsDB.prepare(`
            UPDATE settings 
            SET status = ?, price = ?, openClose = ?, usageTime = ? 
            WHERE dateId = ? AND roomId = ? AND isOvernight = ?
        `).run(status, price, openClose, usageTime, dateId, roomId, isOvernight);
    } else {
        // 기존 데이터가 없으면 INSERT로 새로 생성
        dailySettingsDB.prepare(`
            INSERT INTO settings (dateId, roomId, isOvernight, status, price, openClose, usageTime) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(dateId, roomId, isOvernight, status, price, openClose, usageTime);
    }
}

function updateDailySettings(data) {
    const {days, settings} = data;
    days.forEach(day => {
        const dateId = getDateId(day.date, day.month, day.year);

        settings.forEach(setting => {
            console.log("day: ", day);
            console.log("setting: ", setting);
            updateSettingsTable(dateId, setting.roomId, setting.isOvernight, setting.status, setting.price, setting.openClose, setting.usageTime);
        });
    });
    return {
        status: 200,
        msg: '설정 업데이트 성공'
    }
}



module.exports = {
    getMonthlyDailySettings,
    updateDailySettings,
    getDate
}