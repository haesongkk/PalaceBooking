class ReserveList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'reserve-list-container';

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

        // 독자적인 웹소켓 연결 설정
        this.setupSocketConnection();

        this.switchFilter('대기');
    }

    setupSocketConnection() {
        if (typeof io === 'undefined') {
            setTimeout(() => this.setupSocketConnection(), 200);
            return;
        }
        
        this.socket = io();
        this.socket.on('connect', () => {
            this.socket.emit('admin');
        });
        this.socket.on('reservation-updated', () => {
            this.updateTable();
        });
    }

    switchFilter(tabName) {
        this.currentFilter = tabName;
        this.buttons.forEach(btn => btn.classList.remove('active'));
        this.buttons.find(btn => btn.textContent === tabName).classList.add('active');
        this.updateTable();
    }

    async updateTable() {
        fetch(`/api/reservation`).then(res => res.json()).then(data => {
            if(data.error) {
                alert(data.error);
                return;

            }
            this.tbody.innerHTML = '';
            let filteredReservations = [];
            data.forEach(reservation => {
                switch(this.currentFilter){
                    case '전체':
                        filteredReservations.push(reservation);
                        break;
                    case '대기':
                        if(reservation.status === 0) filteredReservations.push(reservation);
                        break;
                    case '확정':
                        if(reservation.status === 1) filteredReservations.push(reservation);
                        break;
                    case '취소':
                        if(reservation.status === -1) filteredReservations.push(reservation);
                        break;
                }
            });
            if(filteredReservations.length === 0){
                this.tbody.innerHTML = `
                    <tr>
                        <td colspan="6">예약이 없습니다.</td>
                    </tr>
                `;
            }
            filteredReservations.forEach(reservation => {
                this.tbody.innerHTML += `
                    <tr>
                        <td>${reservation.id}</td>
                        <td>${reservation.customername}</td>
                        <td>${reservation.customerphone}</td>
                        <td>${reservation.roomname}</td>
                        ${reservation.checkindate == reservation.checkoutdate ? `
                            <td>${reservation.checkindate} 대실</td>
                        ` : `
                            <td>${reservation.checkindate} 입실 ~ ${reservation.checkoutdate} 퇴실</td>
                        `}
                        <td>
                            ${reservation.status === 0 ? `
                                <button class="confirm" id="confirm-${reservation.id}">확정</button>
                                <button class="cancel" id="cancel-${reservation.id}">취소</button>
                            ` : ''}
                            ${reservation.status === 1 ? `확정` : ''}
                            ${reservation.status === -1 ? `취소` : ''}
                        </td>
                    </tr>
                `;


            });

            const buttons = this.tbody.querySelectorAll('button');

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const [type, id] = btn.id.split('-');
                    const msg = type === 'confirm' ? '확정' : '취소';
                    const statusTo = type === 'confirm' ? 1 : -1;
                    if(!confirm(`이 예약을 ${msg}하시겠습니까?`)) {
                        return;
                    }
                    fetch(`/api/reservation/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: statusTo })
                    })
                    .then(res => res.json()).then(data => {
                        if(data.error) {
                            alert(data.error);
                            return;
                        }
                        this.updateTable();
                    })
                });
            });
        });
    }


    async reload() {
        await this.updateTable();
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        // 소켓 연결 해제
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.container.remove();
    }
}

