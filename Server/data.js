class Data {

    pool = null;
    
    constructor() {
    }

    selectRows(tableName) {
        return this.pool.query(`SELECT * FROM ${tableName}`);
    }

    selectRows(tableName, columnName, value) {
        return this.pool.query(`SELECT * FROM ${tableName} WHERE ${columnName} = ${value}`);
    }

    insertRow(tableName, row) {
        return this.pool.query(`INSERT INTO ${tableName} VALUES (${row})`);
    }

    updateRow(tableName, row) {
        return this.pool.query(`UPDATE ${tableName} SET ${row} WHERE id = ${row.id}`);
    }

    deleteRow(tableName, rowId) {
        return this.pool.query(`DELETE FROM ${tableName} WHERE id = ${rowId}`);
    }
}