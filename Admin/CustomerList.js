class CustomerList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'customer-list-container';

        this.createToolbar();
        this.createCustomerTable();
    }

    createToolbar() {
        const container = document.createElement('div');
        container.className = 'customer-list-top-container';
        this.container.appendChild(container);

        const searchInput = document.createElement('input');
        searchInput.className = 'customer-list-top-search-input';
        searchInput.placeholder = '(검색 기능 구현 예정)';
        container.appendChild(searchInput);

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
        
        const headers = ['고객명', '연락처', '메모', '최근방문일', '수정'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        const tbody = document.createElement('tbody');
        customerTable.appendChild(tbody);

        const customers = await this.getCustomers();
        if(customers.length > 0) {
            customers.forEach(customer => {
                console.log(customer);
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
                lastVisitCell.textContent = '(최근 방문일 불러오기 구현 예정)';
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
        const res = await fetch('/api/customers');
        const result = await res.json();
        if(!res.ok) {
            console.error(result.msg);
            return [];
        }
        else {
            console.log(result.msg);
            return result.data;
        }
    }

    onSearchButtonClick() {
        console.log('검색 버튼 클릭');
    }

    onRegisterButtonClick() {
        window.popupCanvas.append('고객 등록', new CustomerInfo(() => {
            this.createCustomerTable();
        }));
    }

    async onEditButtonClick(customer) {
        window.popupCanvas.append('고객 수정', new CustomerInfo(() => {
            this.createCustomerTable();
        }, customer));
    }

    async onDeleteButtonClick(id) {
        const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        if(!res.ok) {
            console.error(result.msg);
        }
        else {
            console.log(result.msg);
            this.createCustomerTable();
        }
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }   
}