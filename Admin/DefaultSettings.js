
class DefaultSettings {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'price-table-container';

        this.createToolbar();

        
        this.switchRoomType('overnight');

    }

    createToolbar() {
        const toolBar = document.createElement('div');
        toolBar.className = 'price-table-top-container';
        this.container.appendChild(toolBar);

        this.dailyButton = document.createElement('button');
        this.dailyButton.textContent = '대실';
        this.dailyButton.addEventListener('click', () => {
            this.switchRoomType('daily');
        });
        toolBar.appendChild(this.dailyButton);

        this.overnightButton = document.createElement('button');
        this.overnightButton.textContent = '숙박';
        this.overnightButton.addEventListener('click', () => {
            this.switchRoomType('overnight');
        });
        toolBar.appendChild(this.overnightButton);

        const addButton = document.createElement('button');
        addButton.className = 'add';
        addButton.textContent = '+';
        addButton.addEventListener('click', () => {
            this.onAddButtonClick();
        });
        toolBar.appendChild(addButton);
    }

    async createDefaultTable() {
        this.tableContainer?.remove();

        this.tableContainer = document.createElement('div');
        this.tableContainer.className = 'price-table-bottom-container';
        this.container.appendChild(this.tableContainer);

        const defaultSettings = await this.getDefaultSettings();
        defaultSettings.forEach(room => {
            const innerContainer = document.createElement('div');
            innerContainer.className = 'price-table-inner-container';
            this.tableContainer.appendChild(innerContainer);
            
            const topContainer = document.createElement('div');
            topContainer.className = 'price-table-inner-top-container';
            innerContainer.appendChild(topContainer);
            
            const h3 = document.createElement('h3');
            h3.textContent = room.roomType;
            topContainer.appendChild(h3);
            
            const editButton = document.createElement('button');
            editButton.className = 'edit';
            editButton.textContent = '수정';
            editButton.addEventListener('click', () => {
                this.onEditButtonClick(room);
            });
            topContainer.appendChild(editButton);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete';
            deleteButton.textContent = '삭제';
            deleteButton.addEventListener('click', () => {
                this.onDeleteButtonClick(room);
            });
            topContainer.appendChild(deleteButton);
            
            // 테이블 생성
            const table = document.createElement('table');
            innerContainer.appendChild(table);

            const thead = document.createElement('thead');
            table.appendChild(thead);
            
            const headerRow = document.createElement('tr');
            thead.appendChild(headerRow);

            const headers = ['항목/요일', '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            const tbody = document.createElement('tbody');
            table.appendChild(tbody);

            let rows = [];
            if(this.currentRoomType === 'daily'){
                rows = [
                    { label: '판매/마감', data: JSON.parse(room.dailyStatus).map(v => v === 1 ? '판매' : '마감') },
                    { label: '판매가', data: JSON.parse(room.dailyPrice).map(v => `${v}원`) },
                    { label: '개시/마감 시각', data: JSON.parse(room.dailyOpenClose).map(v => `${v[0]}시~${v[1]}시`) },
                    { label: '이용시간', data: JSON.parse(room.dailyUsageTime).map(v => `${v}시간`) }
                ];
            }
            else{
                rows = [
                    { label: '판매/마감', data: JSON.parse(room.overnightStatus).map(v => v === 1 ? '판매' : '마감') },
                    { label: '판매가', data: JSON.parse(room.overnightPrice).map(v => `${v}원`) },
                    { label: '입실/퇴실 시각', data: JSON.parse(room.overnightOpenClose).map(v => `${v[0]}시~${v[1]}시`) }
                ];
            }
            rows.forEach(row => {
                const tr = document.createElement('tr');
                tbody.appendChild(tr);

                const labelTd = document.createElement('td');
                labelTd.textContent = row.label;
                tr.appendChild(labelTd);
                    
                row.data.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    tr.appendChild(td);
                });
            });

        });


    }


    async getDefaultSettings() {
        const response = await fetch('/api/defaultSettings');
        const result = await response.json();
        if(!response.ok) {
            console.error(result.msg);
            return [];
        }   
        else {
            console.log(result.msg);
            return result.data;
        }
    }

    switchRoomType(roomType) {
        this.currentRoomType = roomType;
        
        // 버튼 활성화 상태 변경
        this.dailyButton.classList.toggle('active', this.currentRoomType === 'daily');
        this.overnightButton.classList.toggle('active', this.currentRoomType === 'overnight');
        
        this.createDefaultTable();
    }


    async onAddButtonClick() {
        const response = await fetch('/api/defaultSettings/create',{
            method: 'POST',
        });

        const result = await response.json();
        if(!response.ok) {
            console.error(result.msg);
        }
        else {
            console.log(result.msg);
            window.popupCanvas.append('객실 추가', new DefaultEdit(() => this.createDefaultTable(), result.data));
        }
    }

    async onEditButtonClick(room) {
        window.popupCanvas.append('객실 수정', new DefaultEdit(() => this.createDefaultTable(), room));
    }

    async onDeleteButtonClick(room) {
        const response = await fetch(`/api/defaultSettings/${room.id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if(!response.ok) console.error(result.msg);
        else console.log(result.msg);
        this.createDefaultTable();
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}
