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

        this.createTable();
    }

    createTable() {

        fetch(`/api/setting/${this.bIsOvernight}/${this.roomId}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                const roomName = data.roomName;
                const statusList = JSON.parse(data.status);
                const priceList = JSON.parse(data.price);
                const openCloseList = JSON.parse(data.openClose);
                const usageTimeList = JSON.parse(data.usageTime);

                this.container.innerHTML = `
                    <div class="price-table-inner-top-container">
                        <h3>${roomName}</h3>
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
                                ${statusList.map((status, index) => `
                                    <td>
                                        <button class="status-btn ${status ? 'active' : ''}" id="status-t-${index}">판매</button>
                                        <button class="status-btn ${status ? '' : 'active'}" id="status-f-${index}">마감</button>
                                    </td>`).join('')}
                            </tr>
                            <tr>
                                <td>판매가</td>
                                ${priceList.map(price => `
                                    <td>
                                        <input type="text" class="price-input" value="${price}">
                                        <span>원</span>
                                    </td>`).join('')}
                            </tr>
                            <tr>
                                <td>개시/마감 시각</td>
                                ${openCloseList.map(openClose => `
                                    <td>
                                        <button class="dropdown-display">${openClose[0]}</button>
                                        <span>시~</span>
                                        <button class="dropdown-display">${openClose[1]}</button>
                                        <span>시</span>
                                    </td>`).join('')}
                            </tr>
                            ${this.bIsOvernight ? `
                            <tr>
                                <td>이용시간</td>
                                ${usageTimeList.map(usageTime => `
                                    <td>
                                        <button class="dropdown-display">${usageTime}</button>
                                        <span>시간</span>
                                    </td>`).join('')}
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                `;
            });

    }


    async submit() {
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
