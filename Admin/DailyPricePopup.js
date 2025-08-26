class DailyPricePopup {
    constructor(selectedDates, isOvernight, onSaveCallback) {
        this.selectedDates = selectedDates.map(date => [
                new Date(date).getFullYear(),
                new Date(date).getMonth() + 1,
                new Date(date).getDate()
            ]
        );

        this.isOvernight = isOvernight;
        this.onSaveCallback = onSaveCallback;

        this.container = document.createElement('div');
        this.container.className = 'price-table-inner-container';

        this.createTable();
    }

    createTable() {
        fetch(`/api/daily/${this.isOvernight}/${this.selectedDates[0][0]}/${this.selectedDates[0][1]}/${this.selectedDates[0][2]}`)
        .then(res => res.json())
        .then(data => {
            this.container.innerHTML = `
                <div class="price-table-inner-top-container">
                    <div class="sales-info-bar">
                        <div class="selected-dates-info" id="selected-dates-info">
                            선택한 날짜: ${this.selectedDates.map(date => {
                                return `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`;
                            }).join(', ')}
                        </div>
                        <div class="current-room-type" id="current-room-type">
                            현재 모드: ${this.isOvernight ? '숙박' : '대실'}
                        </div>
                    </div>
                </div>
                <table class="sales-form-table">
                    <thead>
                        <tr>
                            <th>객실명</th>
                            <th>판매/마감</th>
                            <th>가격</th>
                            <th>개시/마감 시각</th>
                            ${this.isOvernight ? '' : '<th>이용시간</th>'}
                        </tr>
                    </thead>
                    <tbody id="form-rows">
                        ${data.map(item => `
                            <tr>
                                <td>${item.roomName}</td>
                                <td>
                                    <button ${item.status === 1 ? 'active' : ''}>판매</button>
                                    <button ${item.status === 0 ? 'active' : ''}>마감</button>
                                </td>
                                <td>
                                    <input type="text" value="${item.price}">
                                </td>
                                <td>
                                    <input type="text" value="${item.open}">
                                    <span>시~</span>
                                    <input type="text" value="${item.close}">
                                    <span>시</span>
                                </td>
                                ${this.isOvernight ? '' : `
                                <td>
                                    <input type="text" value="${item.usageTime}">
                                    <span>시간</span>
                                </td>
                                `}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        });
    }



    async submit() {
        const days = [];
        this.selectedDates.forEach(dateString => {
            const date = new Date(dateString);
            days.push({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                date: date.getDate(),
            });
        });

        const settings = [];
        const rows = this.modal.querySelector('#form-rows').querySelectorAll('tr');
        
        rows.forEach(row => { 
            // 행별로 데이터 파싱해서 Db 저장하기
            const statusBtn = row.querySelector('.status-btn:first-child');
            const status = statusBtn.classList.contains('active')? 1 : 0;

            const price = row.querySelector('.price-input').value;


            const timeRange = row.querySelectorAll('.dropdown-display');
            const openClose = [ JSON.parse(timeRange[0].textContent), JSON.parse(timeRange[1].textContent) ];



            const usageTime = this.isOvernight ? '0' : timeRange[2].textContent;




            // const rowData = this.getRowData(row);
            settings.push({
                roomId: row.id,
                isOvernight: this.isOvernight? 1 : 0,

                status: status,
                price: price,
                openClose: JSON.stringify(openClose),
                usageTime: usageTime    
            });
        });

        const data = {
            days: days,
            settings: settings
        }

        console.log(data);

        const res = await fetch('/api/dailySettings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(res.ok) {
            console.log(result.msg);
            this.onSaveCallback();
            return true;
        }
        else {
            console.error(result.msg);
            return false;
        }
    }

    remove() {
        this.container.remove();
    }

    getRootElement() {
        return this.container;
    }
} 