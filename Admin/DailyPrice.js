class DailyPrice {
    constructor() {
        const currentDate = new Date();
        this.curYear = currentDate.getFullYear();
        this.curMonth = currentDate.getMonth();

        this.selectedDates = [];
        this.isOvernight = true;
        this.dailyPricesCache = {};
        this.roomData = {}; // 자체적으로 관리
        this.cells = [];
        
        this.container = this.createContainer();
        console.log('DailyPrice: container:', this.container);
        
        this.loadData();
        //this.updateMonthDisplay();
        //this.updateSettingsButton();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'daily-price-container';
        container.id = 'daily-price-container';
        
        // 대실/숙박 버튼과 달력 헤더
        const salesHeader = document.createElement('div');
        salesHeader.className = 'sales-header';
        
        // 부동 객실 타입 버튼
        const floatingRoomTypeButtons = document.createElement('div');
        floatingRoomTypeButtons.className = 'floating-room-type-buttons';
        
        const dailyBtn = document.createElement('button');
        dailyBtn.className = 'room-type-btn';
        dailyBtn.textContent = '대실';
        dailyBtn.onclick = () => this.switchRoomType(false);
        
        const overnightBtn = document.createElement('button');
        overnightBtn.className = 'room-type-btn active';
        overnightBtn.textContent = '숙박';
        overnightBtn.onclick = () => this.switchRoomType(true);
        
        floatingRoomTypeButtons.appendChild(dailyBtn);
        floatingRoomTypeButtons.appendChild(overnightBtn);
        
        // 캘린더 컨트롤
        const calendarControls = document.createElement('div');
        calendarControls.className = 'calendar-controls';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav';
        prevBtn.innerHTML = '&lt;';
        //prevBtn.style.cssText = 'background-color: rgb(156, 163, 175); cursor: not-allowed;';
        prevBtn.style.cssText = 'background-color: rgb(59, 130, 246); cursor: pointer;';
        prevBtn.onclick = () => this.previousMonth();
        
        const currentMonth = document.createElement('h3');
        currentMonth.id = 'sales-current-month';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav';
        nextBtn.innerHTML = '&gt;';
        nextBtn.style.cssText = 'background-color: rgb(59, 130, 246); cursor: pointer;';
        nextBtn.onclick = () => this.nextMonth();
        
        calendarControls.appendChild(prevBtn);
        calendarControls.appendChild(currentMonth);
        calendarControls.appendChild(nextBtn);
        
        salesHeader.appendChild(floatingRoomTypeButtons);
        salesHeader.appendChild(calendarControls);
        
        // 요일 헤더 (부동)
        const calendarWeekdays = document.createElement('div');
        calendarWeekdays.className = 'calendar-weekdays';
        
        const weekdayHeader = document.createElement('div');
        weekdayHeader.className = 'weekday-header';
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-dates';
        selectAllCheckbox.onchange = (e) => this.toggleAllDates(e.target);
        weekdayHeader.appendChild(selectAllCheckbox);
        
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekdayIds = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        
        this.topCells = [];
        weekdays.forEach((day, index) => {
            const weekdayCell = document.createElement('div');
            weekdayCell.className = 'weekday-cell';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `select-${weekdayIds[index]}`;
            checkbox.onchange = (e) => this.onToggleTopCheckbox(index, e.target);
            
            const span = document.createElement('span');
            span.textContent = day;
            
            weekdayCell.appendChild(checkbox);
            weekdayCell.appendChild(span);
            calendarWeekdays.appendChild(weekdayCell);
            this.topCells.push(weekdayCell);
        });
        
        calendarWeekdays.insertBefore(weekdayHeader, calendarWeekdays.firstChild);
        
        // 캘린더 콘텐츠
        const salesCalendarContent = document.createElement('div');
        salesCalendarContent.className = 'sales-calendar-content';
        
        this.salesCalendarDays = document.createElement('div');
        this.salesCalendarDays.className = 'sales-calendar-days';
        this.salesCalendarDays.id = 'sales-calendar-days';
        
        salesCalendarContent.appendChild(this.salesCalendarDays);
        
        // 선택된 날짜 플로팅 UI
        this.floatingSelectionUI = document.createElement('div');
        this.floatingSelectionUI.className = 'floating-selection-ui';
        this.floatingSelectionUI.id = 'floating-selection-ui';
        this.floatingSelectionUI.style.display = 'none';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-cancel';
        cancelBtn.textContent = '선택 취소';
        cancelBtn.onclick = () => this.onClickCancelButton();
        
        const salesBtn = document.createElement('button');
        salesBtn.className = 'btn btn-sales';
        salesBtn.textContent = '판매 설정';
        salesBtn.onclick = () => this.onClickSalesButton();
        
        this.floatingSelectionUI.appendChild(cancelBtn);
        this.floatingSelectionUI.appendChild(salesBtn);
        
        container.appendChild(salesHeader);
        container.appendChild(calendarWeekdays);
        container.appendChild(salesCalendarContent);
        container.appendChild(this.floatingSelectionUI);
        
        return container;
    }

    onClickCancelButton() {
        this.dateCells.forEach(row => {
            row.forEach(cell => {
                cell.classList.remove('selected');
            });
        });
        this.selectedDates = [];
        this.floatingSelectionUI.style.display = 'none';
    }

    onClickSalesButton() {
        window.popupCanvas.append('판매 설정', new DailyPricePopup(
            this.selectedDates,
            this.lastSelectedCell.querySelector('.room-data-box'),
            this.isOvernight,
            () => {
                // 저장 후 캐시 갱신 및 캘린더 재렌더링
                this.loadData();
            }
        ));
    }

    async loadData() {
        const res1 = await fetch('/api/defaultSettings');
        const data1 = await res1.json();
        this.defaultSettings = data1.data;


        const res2 = await fetch(`/api/dailySettings/${this.curMonth+1}/${this.curYear}/${this.isOvernight? 1 : 0}`);
        const data2 = await res2.json();
        this.dailySettings = data2.data;
        console.log('DailyPrice: loadData 완료', this.dailySettings);

        this.renderCalendar();

        // dailyData 조회도 해야함
    }

    renderCalendar() {
        this.salesCalendarDays.innerHTML = '';
        this.cells = []; 
        this.selectedDates = [];
        this.floatingSelectionUI.style.display = 'none';

        document.getElementById('sales-current-month').textContent = `${this.curYear}년 ${this.curMonth + 1}월`;
        
        // 해당 월의 첫 번째 날과 마지막 날 계산
        const firstDay = new Date(this.curYear, this.curMonth, 1);
        const lastDay = new Date(this.curYear, this.curMonth + 1, 0);
        
        // 첫 번째 날의 요일 (0: 일요일, 1: 월요일, ...)
        this.firstDayOfWeek = firstDay.getDay();
        
        // 달력 시작 날짜 (이전 달의 날짜부터)
        const startDate = new Date(this.curYear, this.curMonth, 1);
        startDate.setDate(startDate.getDate() - this.firstDayOfWeek);
        
        // 현재 날짜 (과거 날짜 판별용)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let tmp = today.getDate();
        if(this.curMonth != today.getMonth() 
            || this.curYear != today.getFullYear()) {
            tmp = 1;
        }
        
        // 6주 × 7일 = 42개 셀 생성
        this.leftCells = [];
        this.dateCells = [];
        for (let row = 0; row < 6; row++) {
            this.dateCells[row] = [];
            for(let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                this.salesCalendarDays.appendChild(cell); 

                if(col === 0) {
                    cell.className = 'sales-calendar-day checkbox-column';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'date-checkbox';
                    checkbox.onchange = (e) => this.onToggleLeftCheckbox(row, e.target);
                    cell.appendChild(checkbox);
                    this.leftCells.push(cell);
                }
                else {
                    cell.className = 'sales-calendar-day';
                    cell.style.visibility = 'hidden';
                    this.dateCells[row][col-1] = cell;
                }
            }
        }
        for(let i = 1; i < tmp; i++) {
            const date = new Date(this.curYear, this.curMonth, i);
            const {row, col} = this.getCalendarCoord(i);
            this.dateCells[row][col].style.visibility = 'visible';
            this.dateCells[row][col].className = 'sales-calendar-day past-date';

            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = date.getDate();
            this.dateCells[row][col].appendChild(dateNumber);

            const roomDataBox = document.createElement('div');
            roomDataBox.className = 'room-data-box';
            this.dateCells[row][col].appendChild(roomDataBox);
        }
        for(let i = tmp; i <= lastDay.getDate(); i++) {
            const date = new Date(this.curYear, this.curMonth, i);
            const {row, col} = this.getCalendarCoord(i);

            this.dateCells[row][col].id = date;
            this.dateCells[row][col].style.visibility = 'visible';
            this.dateCells[row][col].className = 'sales-calendar-day has-data';

            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = date.getDate();
            this.dateCells[row][col].appendChild(dateNumber);

            const roomDataBox = document.createElement('div');
            roomDataBox.className = 'room-data-box';
            this.dateCells[row][col].appendChild(roomDataBox);

            this.dateCells[row][col].onclick = () => this.selectDate(this.dateCells[row][col]);

        }

        this.defaultSettings.forEach(defaultSetting => {

            const overnightStatus = JSON.parse(defaultSetting.overnightStatus);
            const overnightPrice = JSON.parse(defaultSetting.overnightPrice);
            const overnightOpenClose = JSON.parse(defaultSetting.overnightOpenClose);

            const dailyStatus = JSON.parse(defaultSetting.dailyStatus);
            const dailyPrice = JSON.parse(defaultSetting.dailyPrice);
            const dailyOpenClose = JSON.parse(defaultSetting.dailyOpenClose);
            const dailyUsageTime = JSON.parse(defaultSetting.dailyUsageTime);

            for(let i = 0; i< 7; i++) {
                this.dateCells.forEach(row => {
                    this.setCellData(
                        row[i],
                        defaultSetting.id, defaultSetting.roomType, 
                        overnightStatus[i], overnightPrice[i], overnightOpenClose[i], 
                        dailyStatus[i], dailyPrice[i], dailyOpenClose[i], dailyUsageTime[i]
                    );
                });
            }
        });

        // 모든 데이터를 병렬로 로드

        this.dailySettings.forEach(async setting => {
            const {
                dateId, roomId, isOvernight, 
                status, price, openClose, usageTime
            } = setting;

            const date = await fetch(`/api/date/${dateId}`).then(res => res.json()).then(data => data.data);


            const roomType = await fetch(`/api/roomType/${roomId}`).then(res => res.json()).then(data => data.data);
            if(roomType) {
                const {row, col} = this.getCalendarCoord(date.date);
                this.setCellData(
                    this.dateCells[row][col],
                    JSON.parse(roomId), 
                    roomType.roomType,
                    JSON.parse(status),
                    JSON.parse(price),
                    JSON.parse(openClose),
                    JSON.parse(status),
                    JSON.parse(price),
                    JSON.parse(openClose),
                    JSON.parse(usageTime)
                );
            }


            
        });

    }

    onToggleTopCheckbox(colIndex, checkbox) {
        if(checkbox.checked) {
            this.dateCells.forEach(row => {
                const cell = row[colIndex];
                if(cell.classList.contains('has-data') && !cell.classList.contains('selected')) {
                    cell.classList.add('selected');
                    this.selectedDates.push(cell.id);
                    this.floatingSelectionUI.style.display = 'flex';
                    this.lastSelectedCell = cell;
                }
            });
        }
        else {
            this.dateCells.forEach(row => {
                const cell = row[colIndex];
                if(cell.classList.contains('has-data') && cell.classList.contains('selected')) {
                    cell.classList.remove('selected');
                    this.selectedDates = this.selectedDates.filter(date => date !== cell.id);
                    if(this.selectedDates.length === 0) {
                        this.floatingSelectionUI.style.display = 'none';
                    }
                }
            });
        }
       
    }

    onToggleLeftCheckbox(rowIndex, checkbox) {
        if(checkbox.checked) {
            this.dateCells[rowIndex].forEach(cell => {
                if(cell.classList.contains('has-data') && !cell.classList.contains('selected')) {
                    cell.classList.add('selected');
                    this.selectedDates.push(cell.id);
                    this.floatingSelectionUI.style.display = 'flex';
                    this.lastSelectedCell = cell;
                }
            });
        }
        else {
            this.dateCells[rowIndex].forEach(cell => {
                if(cell.classList.contains('has-data') && cell.classList.contains('selected')) {
                    cell.classList.remove('selected');
                    this.selectedDates = this.selectedDates.filter(date => date !== cell.id);
                    if(this.selectedDates.length === 0) {
                        this.floatingSelectionUI.style.display = 'none';
                    }
                }
            });
        }

        
    }

    getCalendarCoord(date) {
        const offset = this.firstDayOfWeek - 1 ;
        const convert = offset + date;
        const row = Math.floor(convert / 7);
        const col = convert % 7;
        return { row, col };
    }

    setCellData(cell, id, roomType, overnightStatus, overnightPrice, overnightOpenClose, dailyStatus, dailyPrice, dailyOpenClose, dailyUsageTime) {
        if(cell.className !== 'sales-calendar-day has-data') return;
        
        const dataBox = cell.querySelector('.room-data-box');
        let dataItems = null;


        dataBox.querySelectorAll('.room-data-items').forEach(item => {
            if(item.id === JSON.stringify(id)) {
                const roomNameItem = item.querySelector('.room-name');
                if(roomNameItem.textContent === roomType) {
                    dataItems = item;
                    item.innerHTML = '';
                }
            }
        });
        if(!dataItems){
            dataItems = document.createElement('div');
            dataItems.className = 'room-data-items';
            dataItems.id = id;
            dataBox.appendChild(dataItems);
        }


        const status = this.isOvernight ? overnightStatus : dailyStatus;
        const price = this.isOvernight ? overnightPrice : dailyPrice;
        const openClose = this.isOvernight ? overnightOpenClose : dailyOpenClose;
        const usageTime = this.isOvernight ? null : dailyUsageTime;

        const roomstatus = document.createElement('span');
        roomstatus.className = `room-status ${status? 'sale' : 'closed'}`;
        roomstatus.textContent = parseInt(status) ? '판매' : '마감';
        dataItems.appendChild(roomstatus);

        const roomName = document.createElement('div');
        roomName.className = 'room-name';
        roomName.textContent = roomType;
        dataItems.appendChild(roomName);

        const roomDetails = document.createElement('div');
        roomDetails.className = 'room-details';
        roomDetails.textContent = `${openClose[0]}시~${openClose[1]}시`;
        dataItems.appendChild(roomDetails);

        if(usageTime) {
            const usageTimeText = document.createElement('span');
            usageTimeText.className = 'room-details';
            usageTimeText.textContent = `${usageTime}시간`;
            dataItems.appendChild(usageTimeText);
        }

        const roomPrice = document.createElement('div');
        roomPrice.className = 'room-price';
        roomPrice.textContent = `${price}원`;
        dataItems.appendChild(roomPrice);


    }

    adjustCheckboxHeight(weekRow) {
        // 체크박스 셀 (첫 번째 요소)
        const checkboxCell = weekRow[0];
        
        // 같은 행의 보이는 셀들 중 가장 높은 높이 찾기
        let maxHeight = 0;
        for (let i = 1; i < weekRow.length; i++) {
            const cell = weekRow[i];
            if (cell.style.visibility !== 'hidden') {
                const cellHeight = cell.offsetHeight;
                if (cellHeight > maxHeight) {
                    maxHeight = cellHeight;
                }
            }
        }
        
        // 체크박스 셀 높이 조정
        if (maxHeight > 0) {
            checkboxCell.style.height = `${maxHeight}px`;
        }
    }


    updateMonthDisplay() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        document.getElementById('sales-current-month').textContent = `${year}년 ${month + 1}월`;
    }

    updateSettingsButton() {
        const floatingUI = document.getElementById('floating-selection-ui');
        const selectedCount = document.getElementById('selected-count');
        
        if (this.selectedDates.length > 0) {
            selectedCount.textContent = `${this.selectedDates.length}개 선택됨`;
            floatingUI.style.display = 'flex';
        } else {
            floatingUI.style.display = 'none';
        }
    }

    async previousMonth() {
        if(this.curMonth === new Date().getMonth() 
            && this.curYear === new Date().getFullYear()) {
            return;
        }
        else if(--this.curMonth < 0) {
            this.curYear--;
            this.curMonth = 11;
        }
        this.selectedDates = [];
        await this.loadData();
    }

    async nextMonth() {
        if(++this.curMonth > 11) {
            this.curYear++;
            this.curMonth = 0;
        }
        this.selectedDates = [];
        await this.loadData();
    }

    async switchRoomType(isOvernight) {
        this.isOvernight = isOvernight;
        this.selectedDates = [];
        // 버튼 상태 업데이트
        document.querySelectorAll('.room-type-btn').forEach(btn => {
            if(btn.classList.contains('active')) {
                btn.classList.remove('active');
            }
            else {
                btn.classList.add('active');
            }
        });
        
        await this.loadData();
    }

    selectDate(cell) {
        if(cell.classList.contains('selected')) {
            cell.classList.remove('selected');
            this.selectedDates = this.selectedDates.filter(d => d !== cell.id);

            if(this.selectedDates.length === 0) {
                this.floatingSelectionUI.style.display = 'none';
            }
        }
        else {
            cell.classList.add('selected');
            this.selectedDates.push(cell.id);
            this.floatingSelectionUI.style.display = 'flex';
            this.lastSelectedCell = cell;
        }

    }

    toggleDateSelection(checkbox) {
        const dateString = checkbox.dataset.date;
        
        if (checkbox.checked) {
            if (!this.selectedDates.includes(dateString)) {
                this.selectedDates.push(dateString);
            }
        } else {
            this.selectedDates = this.selectedDates.filter(d => d !== dateString);
        }
        
        this.updateSettingsButton();
        this.updateCellSelections();
    }


    clearAllSelections() {
        this.selectedDates = [];
        this.updateSettingsButton();
        this.updateCellSelections();
        
        // 모든 체크박스 해제
        document.querySelectorAll('.date-checkbox').forEach(cb => {
            cb.checked = false;
        });
        
        document.querySelectorAll('.weekday-cell input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        document.getElementById('select-all-dates').checked = false;
    }

    openSettings() {
        if (this.selectedDates.length === 0) return;
        console.log('DailyPrice openSettings - this.isOvernight:', this.isOvernight);
        console.log('DailyPrice openSettings - typeof this.isOvernight:', typeof this.isOvernight);
        console.log('DailyPrice openSettings - this.lastSelectedCell:', this.lastSelectedCell);
        console.log('DailyPrice openSettings - room-data-box:', this.lastSelectedCell?.querySelector('.room-data-box'));
        
        const popup = new DailyPricePopup(
            this.selectedDates,
            this.lastSelectedCell.querySelector('.room-data-box'),
            this.isOvernight,
            () => this.loadData()
        );
        
        window.popupCanvas.append('판매 설정', popup);
    }

    async reload() {
        await this.loadData();
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}