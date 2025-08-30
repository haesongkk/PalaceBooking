
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

    }

    async createDefaultTable() {
        this.tableContainer?.remove();

        this.tableContainer = document.createElement('div');
        this.tableContainer.className = 'price-table-bottom-container';
        this.container.appendChild(this.tableContainer);

        fetch(`/api/setting/${this.currentRoomType === 'overnight' ? 1 : 0}`)
        .then(res => res.json())
        .then(data => {
            data.forEach(room => {
                console.log(room);
                const statusList = JSON.parse(room.status);
                const priceList = JSON.parse(room.price);
                const openCloseList = JSON.parse(room.openclose);
                const usageTimeList = JSON.parse(room.usagetime);
               
                const innerContainer = document.createElement('div');
                innerContainer.className = 'price-table-inner-container';
                innerContainer.innerHTML = `
                    <div class="price-table-inner-top-container">
                        <h3>${room.roomname}</h3>
                        <button class="edit">수정</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>항목/요일</th>
                                <th>일요일</th>
                                <th>월요일</th>
                                <th>화요일</th>
                                <th>수요일</th>
                                <th>목요일</th>
                                <th>금요일</th>
                                <th>토요일</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>판매/마감</td>
                                ${statusList.map(status => `<td>${status?'판매':'마감'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>판매가</td>
                                ${priceList.map(price => `<td>${price.toLocaleString()}원</td>`).join('')}
                            </tr>
                            <tr>
                                <td>개시/마감 시각</td>
                                ${openCloseList.map(openClose => `<td>${openClose[0]}시 ~ ${openClose[1]}시</td>`).join('')}
                            </tr>
                            ${this.currentRoomType === 'daily' ? `
                            <tr>
                                <td>이용시간</td>
                                ${usageTimeList.map(usageTime => `<td>${usageTime}시간</td>`).join('')}
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                `;
                const editButton = innerContainer.querySelector('.edit');
                editButton.addEventListener('click', () => {
                    this.onEditButtonClick(
                        room.roomid, 
                        this.currentRoomType === 'overnight'
                    );
                });
                this.tableContainer.appendChild(innerContainer);
            });
        });

    }



    switchRoomType(roomType) {
        this.currentRoomType = roomType;
        
        // 버튼 활성화 상태 변경
        this.dailyButton.classList.toggle('active', this.currentRoomType === 'daily');
        this.overnightButton.classList.toggle('active', this.currentRoomType === 'overnight');
        
        this.createDefaultTable();
    }


    async onEditButtonClick(id, bIsOvernight) {
        console.log(id, typeof id);
        console.log(bIsOvernight, typeof bIsOvernight);
        window.popupCanvas.append(
            '객실 수정', 
            new DefaultEdit(
                () => this.createDefaultTable(), 
                id, bIsOvernight
            )
        );
    }

    async reload() {
        await this.createDefaultTable();
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}
