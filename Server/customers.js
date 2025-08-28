const Database = require("better-sqlite3");
const customersDb = new Database("customers.db");

customersDb.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    memo TEXT
  );
`);

function getCustomerById(id) {
    if(typeof id !== 'number') throw new Error('id must be a number');

    return customersDb.prepare(`
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
        const existingCustomer = customersDb.prepare(
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
        const result = customersDb.prepare(
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
    return customersDb.prepare(`
        SELECT * 
        FROM customers
        `).all();
}

function deleteCustomer(id) {
    if(typeof id !== 'number') throw new Error('id must be a number');
    return customersDb.prepare(`
        DELETE 
        FROM customers 
        WHERE id = ?
        `).run(id);
}

function updateCustomer(id, name, phone, memo) {
    if(!id) return saveCustomer(name, phone, memo);

    try {
        customersDb.prepare('UPDATE customers SET name = ?, phone = ?, memo = ? WHERE id = ?').run(name, phone, memo, id);
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
    const customers = customersDb.prepare(
        'SELECT * FROM customers WHERE phone LIKE ?'
    ).all(`%${number}%`);

    return {
        status: 200,
        msg: '고객 검색 성공',
        customers: customers
    };
}

function registerCustomer(phone) {
    const customer = customersDb.prepare(
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
    customersDb.prepare(
        'INSERT INTO customers (id, name, phone, memo) VALUES (?, ?, ?, ?)'
    ).run(id, name, phone, memo);
    return {
        status: 200, 
        msg: '고객 등록 성공',
    };
}

function getCustomer(phone) {
    return customersDb.prepare(
        'SELECT * FROM customers WHERE phone = ?'
    ).get(phone);
}

module.exports = {
    getCustomerList,
    deleteCustomer,
    updateCustomer,
    searchCustomer,
    registerCustomer,
    getCustomer,
    getCustomerById
};