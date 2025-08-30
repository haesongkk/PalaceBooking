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
            if(data.error) {
                alert(data.error);
                return false;
            }

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
                            <tr id="${item.roomId}">
                                <td>${item.roomName}</td>
                                <td id="status-cell-${item.roomid}">
                                    <button class="status-btn ${item.status === 1 ? 'active' : ''}">판매</button>
                                    <button class="status-btn ${item.status === 0 ? 'active' : ''}">마감</button>
                                </td>
                                <td id="price-cell-${item.roomid}">
                                    <input class="price-input" type="text" value="${item.price}">
                                    <span>원</span>
                                </td>
                                <td id="time-range-cell-${item.roomid}">
                                    <input class="custom-dropdown" type="text" value="${item.open}">
                                    <span>시~</span>
                                    <input class="custom-dropdown" type="text" value="${item.close}">
                                    <span>시</span>
                                </td>
                                ${this.isOvernight ? '' : `
                                <td id="usage-time-cell-${item.roomid}">
                                    <input class="custom-dropdown" type="text" value="${item.usagetime}">
                                    <span>시간</span>
                                </t d>
                                `}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            data.forEach(item => {
                const statusBtns = this.container.querySelector(`#status-cell-${item.roomid}`).querySelectorAll('.status-btn');
                statusBtns.forEach(btn => {
                    btn.onclick = () => {
                        statusBtns.forEach(btn => btn.classList.remove('active'));
                        btn.classList.add('active');
                    }
                });
            });
        });
    }



    async submit() {
        const dayList = [];
        this.selectedDates.forEach(date => {
            dayList.push({
                date: date[2],
                month: date[1],
                year: date[0],
            });
        });
        console.log(dayList);

        const settingList = []; 
        this.container.querySelectorAll('#form-rows tr').forEach(row => {
            const roomId = row.id;

            const status = row.querySelector(`#status-cell-${roomId}`).querySelector('.status-btn.active').textContent == '판매' ? 1 : 0;
            console.log(row.id, status);

            const price = row.querySelector(`#price-cell-${roomId}`).querySelector('.price-input').value;
            if(!/^\d+$/.test(price)) {
                alert('가격은 숫자만 입력해주세요.');
                return false;
            }

            const openClose = [];
            row.querySelector(`#time-range-cell-${roomId}`).querySelectorAll('.custom-dropdown').forEach(input => {
                if(!/^\d+$/.test(input.value)) {
                    alert('개시/마감 시각은 숫자만 입력해주세요.');
                    return false;
                }
                openClose.push(Number(input.value));
            });

            let usageTime = null;
            if(!this.isOvernight) {
                usageTime = row.querySelector(`#usage-time-cell-${roomId}`).querySelector('.custom-dropdown').value;
                if(!/^\d+$/.test(usageTime)) {
                    alert('이용시간은 숫자만 입력해주세요.');
                    return false;
                }
            }

            settingList.push({
                roomid: Number(roomId),
                status: Number(status),
                price: Number(price),
                open: openClose[0],
                close: openClose[1],
                usagetime: Number(usageTime),
            });

        });

        const res = await fetch(`/api/daily/${this.isOvernight}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dayList: dayList,
                settingList: settingList,
            }),
        }).then(res => res.json()).then(data => {
            if(data.error) {
                alert(data.error);
                return false;
            }
        });
        this.onSaveCallback();
        return true;
    }

    remove() {
        this.container.remove();
    }

    getRootElement() {
        return this.container;
    }
} 