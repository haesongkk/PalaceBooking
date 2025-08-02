class ReserveList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'reserve-list-container';

        this.title = document.createElement('h2');
        this.title.textContent = '예약 승인';

        this.container.appendChild(this.title);

        this.topContainer = document.createElement('div');
        this.topContainer.className = 'reserve-list-top-container';

        this.bottomContainer = document.createElement('div');
        this.bottomContainer.className = 'reserve-list-bottom-container';

        this.container.appendChild(this.topContainer);
        this.container.appendChild(this.bottomContainer);

        this.buttons = [];
        for (const name of ['전체', '대기', '확정', '취소']) {
            const button = document.createElement('button');
            button.textContent = name;
            button.addEventListener('click', () => {
                this.switchFilter(name);
            });
            this.topContainer.appendChild(button);
            this.buttons.push(button);
        }

        this.table = document.createElement('table');
        this.thead = document.createElement('thead');
        this.tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');

        const headers = ['ID', '이름', '전화번호', '객실', '기간', '작업'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        this.thead.appendChild(headerRow);
        
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
        this.bottomContainer.appendChild(this.table);

        this.socket = io();
        this.socket.emit('admin');
        this.socket.on('reservation-updated',()=>{
            this.updateTable();
        });
        console.log(this.socket);

        this.switchFilter('대기');

    }

    switchFilter(tabName) {
        this.currentFilter = tabName;
        this.buttons.forEach(btn => btn.classList.remove('active'));
        this.buttons.find(btn => btn.textContent === tabName).classList.add('active');

    }

    async updateTable() {
        this.tbody.innerHTML = '';
        const reservations = await fetch('api/admin/reservations').then(res => res.json());
        console.log(reservations.length);

        // switch(this.currentFilter){
        //     case '전체':
        //         reservations = reservations;
        //         break;
            // case '대기':
            //     reservations = reservations.filter(res => !res.confirmed);
            //     break;
            // case '확정':
            //     reservations = reservations.filter(res => res.confirmed);
            //     break;
            // case '취소':
            //     reservations = reservations.filter(res => res.status === '취소');   
            //     break;
        //     default:
        //         break;
        // }

        if (reservations.length === 0) {
            const loadingRow = document.createElement('tr');
            const loadingCell = document.createElement('td');
            loadingCell.colSpan = 6;
            loadingCell.textContent = '예약이 없습니다.';
            loadingCell.className = 'loading-cell';
            loadingRow.appendChild(loadingCell);
            this.tbody.appendChild(loadingRow);
            console.log(this.tbody);
            return;
        }
        reservations.forEach(reservation => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.textContent = reservation.id;
            row.appendChild(idCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = reservation.name;
            row.appendChild(nameCell);
            
            const phoneCell = document.createElement('td');
            phoneCell.textContent = reservation.phone;
            row.appendChild(phoneCell);
            
            const roomCell = document.createElement('td');
            roomCell.textContent = reservation.room;
            row.appendChild(roomCell);
            
            const periodCell = document.createElement('td');
            periodCell.textContent = reservation.period;
            row.appendChild(periodCell);
            
            const actionCell = document.createElement('td');
            actionCell.textContent = reservation.action;
            row.appendChild(actionCell);

            this.tbody.appendChild(row);
        });
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();

    }




}

