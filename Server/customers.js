const Database = require("better-sqlite3");
const path = require("path");

const customersDb = new Database("customers.db");

customersDb.prepare(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

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

// 모든 고객 조회 API
function getAllCustomers() {
    try {
        const customers = customersDb.prepare(`
            SELECT 
                id,
                name,
                phone,
                memo,
                created_at,
                updated_at,
                NULL as last_visit_date
            FROM customers
            ORDER BY created_at DESC
        `).all();

        return {
            status: 200,
            msg: '고객 조회 성공',
            customers: customers
        };
    } 
    catch (error) {
        return {
            status: 500,
            msg: error.message,
            customers: []
        };
    }
    
}

function deleteCustomer(id) {
    try {
        customersDb.prepare('DELETE FROM customers WHERE id = ?').run(id);
        return {
            status: 200,
            msg: '고객 삭제 성공',
        };
    }
    catch (error) {
        return {
            status: 500,
            msg: error.message,
        };
    }
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
    const customer = customersDb.prepare(
        'SELECT * FROM customers WHERE phone = ?'
    ).get(phone);

    if(!customer) return {
        status: 404,
        msg: '고객 정보가 존재하지 않습니다.',
        data: null
    };

    return {
        status: 200,
        msg: '고객 조회 성공',
        data: customer
    };
}

module.exports = {
    getAllCustomers,
    deleteCustomer,
    updateCustomer,
    searchCustomer,
    registerCustomer,
    getCustomer,
    getCustomerById
};