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

        container.innerHTML = `
            <input type="text" class="customer-list-top-search-input" placeholder="연락처를 검색하세요!">
            <button class="customer-list-top-search-button">검색</button>
            <button class="customer-list-top-register-button">등록</button>
            <button class="customer-list-top-setting-button">할인</button>
        `;

        container.querySelector('.customer-list-top-search-input').addEventListener('keydown', (e) => {
            if(e.key === 'Enter' && container.querySelector('.customer-list-top-search-input').value.length > 0) {
                this.onSearchButtonClick();
            }
        });

        container.querySelector('.customer-list-top-search-button').addEventListener('click', () => {
            this.onSearchButtonClick();
        });

        container.querySelector('.customer-list-top-register-button').addEventListener('click', () => {
            this.onRegisterButtonClick();
        });

        container.querySelector('.customer-list-top-setting-button').addEventListener('click', () => {
            this.onSettingButtonClick();
        });

    }

    onSettingButtonClick() {
        window.popupCanvas.append('할인율 설정', new DiscountEdit(
            () => {
                this.createCustomerTable();
            }
        ));
    }

    createCustomerTable() {
        
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
        
        
        fetch(`/api/customers`)
        .then(res => res.json()).then(data => {
            if(data.error) {
                alert(data.error);
            }
            this.customers = data;
            if(this.customers === undefined) {
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 5;
                emptyCell.textContent = '등록된 고객이 없습니다.';
                emptyCell.style.textAlign = 'center';
                emptyCell.style.padding = '40px';
                emptyCell.style.color = '#6b7280';
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                return;
            }
            this.customers.forEach(customer => {
                console.log(customer);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.memo}</td>
                    <td>${customer.recentReserve}</td>
                    <td>
                        <button class="customer-table-edit-button">수정</button>
                        <button class="customer-table-delete-button">삭제</button>
                    </td>
                `;
                tbody.appendChild(row);

                const buttons = row.querySelectorAll('button');
                console.log(buttons);
                buttons[0].addEventListener('click', () => {
                    this.onEditButtonClick(customer);
                });
                buttons[1].addEventListener('click', () => {
                    this.onDeleteButtonClick(customer.id);
                });
            });
        });
       

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
            this.createCustomerTable();
        }));
    }

    onEditButtonClick(customer) {
        window.popupCanvas.append('고객 수정', new CustomerInfo(() => {
            this.createCustomerTable();
        }, customer));
    }

    onDeleteButtonClick(id) {
        console.log(id);
        fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        }).then(res => res.json()).then(data => {
            if(data.err) alert(data.err);
            this.createCustomerTable();
        });
    }

    async reload() {
        this.searchInput.value = '';
        this.createCustomerTable();
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }   
}