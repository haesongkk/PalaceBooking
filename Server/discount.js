const Database = require("better-sqlite3");
const discountDB = new Database("discount.db");

discountDB.exec(`
    CREATE TABLE IF NOT EXISTS discount (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        firstVisitDiscount INTEGER NOT NULL,
        recentVisitDiscount INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO discount (id, firstVisitDiscount, recentVisitDiscount) VALUES (1, 5000, 5000);
`);

function getDiscount() {
    const row = discountDB.prepare(`
        SELECT * FROM discount
        WHERE id = 1
    `).get();
    return row;
}

function setDiscount(nFirstVisitDiscount, nRecentVisitDiscount) {
    const info = discountDB.prepare(`
        UPDATE discount 
        SET firstVisitDiscount = ?, recentVisitDiscount = ?
        WHERE id = 1
    `).run(nFirstVisitDiscount, nRecentVisitDiscount);
    return info;
}

module.exports = { 
    getDiscount, 
    setDiscount 
};