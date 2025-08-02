class PriceTableItem {
    constructor(room, currentRoomType) {
        // 객실 데이터 저장
        this.room = room;
        this.currentRoomType = currentRoomType;

        // 1단계: 데이터 파싱
        const parseArray = (jsonString, defaultValue) => {
            try {
                if (!jsonString) return defaultValue;
                if (Array.isArray(jsonString)) return jsonString;
                if (typeof jsonString !== 'string') return defaultValue;
                if (jsonString.trim() === '') return defaultValue;
                
                const parsed = JSON.parse(jsonString);
                if (!Array.isArray(parsed)) return defaultValue;
                return parsed;
            } catch (e) {
                console.warn('JSON 파싱 오류:', e, '원본 데이터:', jsonString);
                return defaultValue;
            }
        };

        const formatTimeArray = (timeArray) => {
            return timeArray.map(timeTuple => {
                if (Array.isArray(timeTuple) && timeTuple.length === 2) {
                    const [startHour, endHour] = timeTuple;
                    return `${startHour}시~${endHour}시`;
                }
                if (typeof timeTuple === 'string' && timeTuple.includes('~')) {
                    return timeTuple;
                }
                return '16시~13시';
            });
        };

        // 객실 데이터 파싱
        const checkInOutData = parseArray(room.checkInOut, Array(7).fill([16, 13]));
        const openCloseData = parseArray(room.openClose, Array(7).fill([14, 22]));
        const priceData = parseArray(room.price, Array(7).fill(50000));
        const statusData = parseArray(room.status, Array(7).fill(1)).map(v => 
            typeof v === 'string' ? (v === '판매' ? 1 : 0) : v);
        const usageTimeData = parseArray(room.usageTime, Array(7).fill(5)).map(v => 
            typeof v === 'string' ? parseInt(v.replace('시간', '')) || 5 : v);
        const rentalPriceData = parseArray(room.rentalPrice, Array(7).fill(30000));
        const rentalStatusData = parseArray(room.rentalStatus, Array(7).fill(1)).map(v => 
            typeof v === 'string' ? (v === '판매' ? 1 : 0) : v);

        const formattedCheckInOut = formatTimeArray(checkInOutData);
        const formattedOpenClose = formatTimeArray(openCloseData);

        this.container = document.createElement('div');
        this.container.className = 'price-table-inner-container';
            
        this.topContainer = document.createElement('div');
        this.topContainer.className = 'price-table-inner-top-container';
        this.container.appendChild(this.topContainer);
            
        this.h3 = document.createElement('h3');
        this.h3.textContent = room.name;
            
        this.editButton = document.createElement('button');
        this.editButton.className = 'edit';
        this.editButton.textContent = '수정';
        this.editButton.addEventListener('click', () => {
            this.editCurrentRoom();
        });
            
        this.deleteButton = document.createElement('button');
        this.deleteButton.className = 'delete';
        this.deleteButton.textContent = '삭제';
        this.deleteButton.addEventListener('click', () => {
            this.deleteCurrentRoom();
        });
            
            this.table = document.createElement('table');
            this.thead = document.createElement('thead');
            this.tbody = document.createElement('tbody');
            
            const headerRow = document.createElement('tr');
            const headers = ['항목/요일', '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            // 2단계: 셀 데이터 채우기
            let rows = [];
            if(currentRoomType === 'daily'){
                rows = [
                    { label: '판매/마감', data: rentalStatusData.map(v => v === 1 ? '판매' : '마감') },
                    { label: '판매가', data: rentalPriceData.map(v => `${v}원`) },
                    { label: '개시/마감 시각', data: formattedOpenClose },
                    { label: '이용시간', data: usageTimeData.map(v => `${v}시간`) }
                ];
            }else{
                rows = [
                    { label: '판매/마감', data: statusData.map(v => v === 1 ? '판매' : '마감') },
                    { label: '판매가', data: priceData.map(v => `${v}원`) },
                    { label: '입실/퇴실 시각', data: formattedCheckInOut }
                ];
            }
            
            rows.forEach(row => {
                const tr = document.createElement('tr');
                
                // 첫 번째 셀 (라벨)
                const labelTd = document.createElement('td');
                labelTd.textContent = row.label;
                tr.appendChild(labelTd);
                
                // 데이터 셀들 (7일치)
                row.data.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    tr.appendChild(td);
                });
                
                this.tbody.appendChild(tr);
            });

            this.thead.appendChild(headerRow);
            this.table.appendChild(this.thead);
            this.table.appendChild(this.tbody);

            this.topContainer.appendChild(this.h3);
            this.topContainer.appendChild(this.editButton);
            this.topContainer.appendChild(this.deleteButton);
            this.container.appendChild(this.table);

    }

    async deleteCurrentRoom() {
        if (!confirm('정말로 이 객실을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/rooms/${this.room.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                console.log('PriceTableItem: 객실 삭제 완료');
                // DOM에서 제거
                this.container.remove();
                // 부모 PriceTable의 updateRoom 호출
                if (this.parentTable) {
                    this.parentTable.updateRoom();
                }
            } else {
                console.error('PriceTableItem: 객실 삭제 실패');
                alert('객실 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('PriceTableItem: 객실 삭제 오류:', error);
            alert('객실 삭제에 실패했습니다.');
        }
    }

    editCurrentRoom() {
        // 수정 기능은 나중에 구현
        console.log('PriceTableItem: 객실 수정 기능 - 구현 예정');
        alert('객실 수정 기능은 아직 구현되지 않았습니다.');
    }
}

class PriceTable {
    constructor() {
        // 데이터 관리
        this.roomData = {};
        this.currentRoomType = 'overnight'; // 'daily' 또는 'overnight'
        this.currentRoom = null;
        
        this.container = document.createElement('div');
        this.container.className = 'price-table-container';

        this.topContainer = document.createElement('div');
        this.topContainer.className = 'price-table-top-container';

        this.bottomContainer = document.createElement('div');
        this.bottomContainer.className = 'price-table-bottom-container';

        this.container.appendChild(this.topContainer);
        this.container.appendChild(this.bottomContainer);

        this.button1 = document.createElement('button');
        this.button1.textContent = '대실';
        this.button1.addEventListener('click', () => {
            this.switchRoomType('daily');
        });

        this.button2 = document.createElement('button');
        this.button2.textContent = '숙박';
        this.button2.addEventListener('click', () => {
            this.switchRoomType('overnight');
        });

        this.button3 = document.createElement('button');
        this.button3.className = 'add';
        this.button3.textContent = '+';
        this.button3.addEventListener('click', () => {
            this.addRoom();
        });

        this.topContainer.appendChild(this.button1);
        this.topContainer.appendChild(this.button2);
        this.topContainer.appendChild(this.button3);

        this.switchRoomType('overnight');

    }

    async addRoom() {
        try {
            const response = await fetch('/api/admin/rooms/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                console.log('PriceTable: 객실 추가 완료');
                this.updateTable();
            } else {
                console.error('PriceTable: 객실 추가 실패');
                alert('객실 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('PriceTable: 객실 추가 오류:', error);
            alert('객실 추가에 실패했습니다.');
        }
    }

    switchRoomType(type) {
        this.currentRoomType = type;
        
        // 버튼 활성화 상태 변경
        this.button1.classList.toggle('active', type === 'daily');
        this.button2.classList.toggle('active', type === 'overnight');
        
        this.updateTable();
    }

    async updateTable() {
        const rooms = await fetch('/api/admin/rooms').then(res => res.json());

        this.bottomContainer.innerHTML = '';
        rooms.forEach(room => {
            const item = new PriceTableItem(room, this.currentRoomType);
            // 부모 참조 설정
            item.parentTable = this;
            this.bottomContainer.appendChild(item.container);
        });
    }

    updateRoom() {
        // 테이블 전체 업데이트
        this.updateTable();
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}
