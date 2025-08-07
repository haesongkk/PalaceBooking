class CustomerList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'customer-list-container';

        this.getCustomers().then(() => {
            this.createToolbar();
            this.createCustomerTable();
        });
    }

    createToolbar() {
        const container = document.createElement('div');
        container.className = 'customer-list-top-container';
        this.container.appendChild(container);

        this.searchInput = document.createElement('input');
        this.searchInput.className = 'customer-list-top-search-input';
        this.searchInput.placeholder = '연락처를 검색하세요!';
        this.searchInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' && this.searchInput.value.length > 0) {
                this.onSearchButtonClick();
            }
        });
        container.appendChild(this.searchInput);

        const searchButton = document.createElement('button');
        searchButton.className = 'customer-list-top-search-button';
        searchButton.textContent = '검색';
        container.appendChild(searchButton);
        searchButton.addEventListener('click', () => {
            this.onSearchButtonClick();
        });
        
        const registerButton = document.createElement('button');
        registerButton.className = 'customer-list-top-register-button';
        registerButton.textContent = '등록';
        registerButton.addEventListener('click', () => {
            this.onRegisterButtonClick(); 
        });
        container.appendChild(registerButton);
    }

    async createCustomerTable() {

        this.tableContainer?.remove();

        this.tableContainer = document.createElement('div');
        this.tableContainer.className = 'customer-table-container';
        this.container.appendChild(this.tableContainer);
        
        const customerTable = document.createElement('table');
        customerTable.className = 'customer-table';
        this.tableContainer.appendChild(customerTable);
        
        const thead = document.createElement('thead');
        customerTable.appendChild(thead);
        
        const headerRow = document.createElement('tr');
        thead.appendChild(headerRow);
        
        const headers = ['고객명', '연락처', '메모', '최근예약일', '수정'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        const tbody = document.createElement('tbody');
        customerTable.appendChild(tbody);

        const customers = this.customers;
        if(customers.length > 0) {
            customers.forEach(customer => {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.textContent = customer.name;
                row.appendChild(nameCell);
                
                const phoneCell = document.createElement('td');
                phoneCell.textContent = customer.phone;
                row.appendChild(phoneCell);
                
                const memoCell = document.createElement('td');
                memoCell.textContent = customer.memo;
                row.appendChild(memoCell);
                
                const lastVisitCell = document.createElement('td');
                lastVisitCell.textContent = customer.recentReserve ? new Date(customer.recentReserve).toLocaleDateString() : '-';
                row.appendChild(lastVisitCell);
                
                const editCell = document.createElement('td');
                row.appendChild(editCell);

                const editButton = document.createElement('button');
                editButton.textContent = '수정';
                editButton.addEventListener('click', () => {
                    this.onEditButtonClick(customer);
                });
                editCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.addEventListener('click', () => {
                    this.onDeleteButtonClick(customer.id);
                });
                editCell.appendChild(deleteButton);

                
                tbody.appendChild(row);
            });
        }
        else {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
    
            emptyCell.colSpan = 5;
            emptyCell.textContent = '등록된 고객이 없습니다.';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '40px';
            emptyCell.style.color = '#6b7280';
            
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        }
        

    }

    async getCustomers() {
        const res = await fetch('/api/customers').then(res => res.json());
        this.customers = res.data;
        
        // 모든 고객의 최근 예약 데이터를 한 번에 가져오기
        try {
            const recentReservesRes = await fetch('/api/customers/recentReserves').then(res => res.json());
            const recentReserves = recentReservesRes.data;
            
            this.customers.forEach(customer => {
                customer.recentReserve = recentReserves[customer.phone] || null;
            });
        } catch (error) {
            console.error('최근 예약 정보를 가져오는 중 오류:', error);
            this.customers.forEach(customer => {
                customer.recentReserve = null;
            });
        }
        
        console.log(this.customers);
    }

    async getRecentReserve(phone) {
        // 나중에는 id로 불러오도록 DB 수정
        const recentReserve = await fetch(`/recentReserve?phone=${phone}`).then(res => res.json());
        return recentReserve.end_date;
    }

    async onSearchButtonClick() {
        const res = await fetch(`/api/customers/search/${this.searchInput.value}`).then(res => res.json());
        this.customers = res.data;
        
        // 모든 고객의 최근 예약 데이터를 한 번에 가져오기
        try {
            const recentReservesRes = await fetch('/api/customers/recentReserves').then(res => res.json());
            const recentReserves = recentReservesRes.data;
            
            this.customers.forEach(customer => {
                customer.recentReserve = recentReserves[customer.phone] || null;
            });
        } catch (error) {
            console.error('최근 예약 정보를 가져오는 중 오류:', error);
            this.customers.forEach(customer => {
                customer.recentReserve = null;
            });
        }
        
        this.createCustomerTable();
    }

    onRegisterButtonClick() {
        window.popupCanvas.append('고객 등록', new CustomerInfo(() => {
            this.getCustomers().then(() => {
                this.createCustomerTable();
            });
        }));
    }

    async onEditButtonClick(customer) {
        window.popupCanvas.append('고객 수정', new CustomerInfo(() => {
            this.getCustomers().then(() => {
                this.createCustomerTable();
            });
        }, customer));
    }

    async onDeleteButtonClick(id) {
        const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        if(!res.ok) {
        }
        else {
            this.getCustomers().then(() => {
                this.createCustomerTable();
            });
        }
    }

    async reload() {
        this.searchInput.value = '';
        this.getCustomers().then(() => {
            this.createCustomerTable();
        });
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }   
}