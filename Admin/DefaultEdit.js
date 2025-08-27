class DefaultEdit {
    constructor(onSubmitCallback, roomId, bIsOvernight) {
        console.log(onSubmitCallback, typeof onSubmitCallback);
        console.log(roomId, typeof roomId);
        console.log(bIsOvernight, typeof bIsOvernight);

        this.onSubmitCallback = onSubmitCallback;
        this.roomId = roomId;
        this.bIsOvernight = bIsOvernight;

        this.container = document.createElement('div');
        this.container.className = 'price-table-inner-container';
        this.container.innerHTML = `
            <div class="price-table-inner-top-container">
                <h3 id="room-name"></h3>
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
                        ${Array.from({ length: 7 }).map((_, index) => `
                            <td id="status-cell-${index}">
                                <button class="status-btn">판매</button>
                                <button class="status-btn">마감</button>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td>판매가</td>
                        ${Array.from({ length: 7 }).map((_, index) => `
                            <td id="price-cell-${index}">
                                <input type="text" class="price-input">
                                <span>원</span>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td>개시/마감 시각</td>
                        ${Array.from({ length: 7 }).map((_, index) => `
                            <td id="time-range-cell-${index}">
                                <input type="text" class="custom-dropdown">
                                <span>시~</span>
                                <input type="text" class="custom-dropdown">
                                <span>시</span>
                            </td>
                        `).join('')}
                    </tr>
                    ${this.bIsOvernight ? ``: `
                        <tr>
                            <td>이용시간</td>
                            ${Array.from({ length: 7 }).map((_, index) => `
                                <td id="usage-time-cell-${index}">
                                    <input type="text" class="custom-dropdown">
                                    <span>시간</span>
                                </td>
                            `).join('')}
                        </tr>
                    `}
                </tbody>
            </table>
        `;

        for(let i = 0; i < 7; i++) {
            const statusBtns = this.container.querySelector(`#status-cell-${i}`).querySelectorAll('.status-btn');
            statusBtns.forEach(btn => {
                btn.onclick = () => {
                    statusBtns.forEach(btn => btn.classList.remove('active'));
                    btn.classList.add('active');
                }
            });

            
        }
        this.loadData();
    }

    loadData() {

        fetch(`/api/setting/${this.bIsOvernight}/${this.roomId}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                const roomName = data.roomName;
                const statusList = JSON.parse(data.status);
                const priceList = JSON.parse(data.price);
                const openCloseList = JSON.parse(data.openClose);
                const usageTimeList = JSON.parse(data.usageTime);

                this.container.querySelector('#room-name').textContent = roomName;
                for(let i = 0; i < 7; i++) {
                    const statusActive = this.container.querySelector(`#status-cell-${i}`).querySelector(`.status-btn:${statusList[i] ? 'first-child' : 'last-child'}`);
                    statusActive.classList.add('active');

                    const priceInput = this.container.querySelector(`#price-cell-${i}`).querySelector('.price-input');
                    priceInput.value = priceList[i];

                    const timeRangeInputs = this.container.querySelector(`#time-range-cell-${i}`).querySelectorAll('.custom-dropdown');
                    timeRangeInputs[0].value = openCloseList[i][0];
                    timeRangeInputs[1].value = openCloseList[i][1];

                    if(!this.bIsOvernight) {
                        const usageTimeInputs = this.container.querySelector(`#usage-time-cell-${i}`).querySelectorAll('.custom-dropdown');
                        usageTimeInputs[0].value = usageTimeList[i];
                    }
                }
            });
    }


    async submit() {
        const statusList = [];
        const priceList = [];
        const openCloseList = [];
        const usageTimeList = [];

        for(let i = 0; i < 7; i++) {
            const status = this.container.querySelector(`#status-cell-${i}`).querySelector(`.status-btn.active`).textContent == '판매' ? 1 : 0;
            statusList.push(status);

            const price = this.container.querySelector(`#price-cell-${i}`).querySelector('.price-input').value;
            if(!/^\d+$/.test(price)) {
                alert('판매가는 숫자만 입력해주세요.');
                return false;
            }
            priceList.push(Number(price));

            const openClose = [];
            this.container.querySelector(`#time-range-cell-${i}`).querySelectorAll('.custom-dropdown').forEach(input => {
                if(!/^\d+$/.test(input.value)) {
                    alert('개시/마감 시각은 숫자만 입력해주세요.');
                    return false;
                }
                openClose.push(Number(input.value));
            });
            openCloseList.push(openClose);

            if(!this.bIsOvernight) {
                const usageTime = this.container.querySelector(`#usage-time-cell-${i}`).querySelector('.custom-dropdown').value;
                if(!/^\d+$/.test(usageTime)) {
                    alert('이용시간은 숫자만 입력해주세요.');
                    return false;
                }
                usageTimeList.push(Number(usageTime));
            }
        }


        await fetch(`/api/setting/${this.bIsOvernight ? 1 : 0}/${this.roomId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: JSON.stringify(statusList),
                price: JSON.stringify(priceList),
                openClose: JSON.stringify(openCloseList),
                usageTime: JSON.stringify(usageTimeList)
            })
        }).then(res => res.json()).then(data => {
            if(data.error) {
                alert(data.error);
                return false;
            }
        });
        this.onSubmitCallback();
        return true;
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}
