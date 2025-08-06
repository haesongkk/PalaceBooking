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
        // Socket.IO가 로드되었는지 확인
        if (typeof io === 'undefined') {
            setTimeout(() => this.setupSocketConnection(), 200);
            return;
        }
        
        // 독자적인 소켓 연결 생성
        this.socket = io();
        
        // 연결 완료 이벤트 리스너
        this.socket.on('connect', () => {
            console.log('ReserveList: Socket.IO 연결 완료');
            this.socket.emit('admin'); // 'admin' 방에 join
        });
        
        // 연결 실패 이벤트 리스너
        this.socket.on('connect_error', (error) => {
            console.error('ReserveList: Socket.IO 연결 실패:', error);
        });
        
        // 예약 업데이트 이벤트 리스너
        this.socket.on('reservation-updated', () => {
            console.log('ReserveList: reservation-updated 이벤트 수신');
            this.updateTable();
        });
        
        console.log('ReserveList: 독자적인 웹소켓 연결 설정 완료');
    }

    switchFilter(tabName) {
        this.currentFilter = tabName;
        this.buttons.forEach(btn => btn.classList.remove('active'));
        this.buttons.find(btn => btn.textContent === tabName).classList.add('active');
        this.updateTable();
    }

    async updateTable() {
        const reservations = await fetch('/api/admin/reservations').then(res => res.json());

        // 필터 적용
        let filteredReservations = reservations;
        switch(this.currentFilter){
            case '전체':
                filteredReservations = reservations;
                break;
            case '대기':
                filteredReservations = reservations.filter(res => res.state === 0);
                break;
            case '확정':
                filteredReservations = reservations.filter(res => res.state === 1);
                break;
            case '취소':
                filteredReservations = reservations.filter(res => res.state === -1);
                break;
            default:
                break;
        }
        
        this.tbody.innerHTML = '';

        if (filteredReservations.length === 0) {
            const loadingRow = document.createElement('tr');
            const loadingCell = document.createElement('td');
            loadingCell.colSpan = 6;
            loadingCell.textContent = '예약이 없습니다.';
            loadingCell.className = 'loading-cell';
            loadingRow.appendChild(loadingCell);
            this.tbody.appendChild(loadingRow);
            return;
        }
        
        filteredReservations.forEach(reservation => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.textContent = reservation.id;
            row.appendChild(idCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = reservation.username || '-';
            row.appendChild(nameCell);
            
            const phoneCell = document.createElement('td');
            phoneCell.textContent = reservation.phone || '-';
            row.appendChild(phoneCell);
            
            const roomCell = document.createElement('td');
            roomCell.textContent = reservation.room || '-';
            row.appendChild(roomCell);
            
            const periodCell = document.createElement('td');
            const startDate = reservation.start_date || '';
            const endDate = reservation.end_date || '';
            periodCell.textContent = endDate ? `${startDate} ~ ${endDate}` : startDate;
            row.appendChild(periodCell);
            
            const actionCell = document.createElement('td');
            
            if(reservation.state === 0){
                // 확정 버튼
                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = '확정';
                confirmBtn.className = 'confirm';
                confirmBtn.disabled = reservation.state !== 0; // 대기 상태가 아니면 비활성화
                confirmBtn.onclick = () => this.confirmReservation(reservation.id, confirmBtn);
                actionCell.appendChild(confirmBtn);
                
                // 취소 버튼
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = '취소';
                cancelBtn.className = 'cancel';
                cancelBtn.disabled = reservation.state === -1; // 이미 취소된 상태면 비활성화
                cancelBtn.onclick = () => this.cancelReservation(reservation.id, cancelBtn);
                actionCell.appendChild(cancelBtn);
            }
            else if(reservation.state === 1){
                actionCell.textContent = '확정';
            }
            else if(reservation.state === -1){
                actionCell.textContent = '취소';
            }
            row.appendChild(actionCell);
            

            this.tbody.appendChild(row);
        });
    }

    confirmReservation(id, btn) {
        if (!confirm('이 예약을 확정하시겠습니까?')) return;
        btn.disabled = true;
        
        fetch('/api/admin/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('예약이 확정되었습니다!');
                this.updateTable();
            } else {
                alert('오류: ' + (data.error || '확정 실패'));
                btn.disabled = false;
            }
        })
        .catch(error => {
            console.error('예약 확정 실패:', error);
            alert('예약 확정 중 오류가 발생했습니다.');
            btn.disabled = false;
        });
    }

    cancelReservation(id, btn) {
        if (!confirm('이 예약을 취소하시겠습니까?')) return;
        btn.disabled = true;
        
        fetch('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('예약이 취소되었습니다!');
                this.updateTable();
            } else {
                alert('오류: ' + (data.error || '취소 실패'));
                btn.disabled = false;
            }
        })
        .catch(error => {
            console.error('예약 취소 실패:', error);
            alert('예약 취소 중 오류가 발생했습니다.');
            btn.disabled = false;
        });
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

