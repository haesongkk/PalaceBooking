class DailyPrice {
    constructor() {
        this.currentDate = new Date();
        this.selectedDates = [];
        this.currentRoomType = 'overnight';
        this.dailyPricesCache = {};
        this.roomData = {}; // 자체적으로 관리
        this.cells = [];
        
        this.container = this.createContainer();
        
        // 자체적으로 데이터 로드
        this.loadData();
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
        dailyBtn.onclick = () => this.switchRoomType('daily');
        
        const overnightBtn = document.createElement('button');
        overnightBtn.className = 'room-type-btn active';
        overnightBtn.textContent = '숙박';
        overnightBtn.onclick = () => this.switchRoomType('overnight');
        
        floatingRoomTypeButtons.appendChild(dailyBtn);
        floatingRoomTypeButtons.appendChild(overnightBtn);
        
        // 캘린더 컨트롤
        const calendarControls = document.createElement('div');
        calendarControls.className = 'calendar-controls';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav';
        prevBtn.innerHTML = '&lt;';
        prevBtn.title = '과거 월로는 이동할 수 없습니다';
        prevBtn.style.cssText = 'background-color: rgb(156, 163, 175); cursor: not-allowed;';
        prevBtn.onclick = () => this.previousMonth();
        
        const currentMonth = document.createElement('h3');
        currentMonth.id = 'sales-current-month';
        currentMonth.textContent = '2025년 8월';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav';
        nextBtn.innerHTML = '&gt;';
        nextBtn.title = '다음 월';
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
        
        weekdays.forEach((day, index) => {
            const weekdayCell = document.createElement('div');
            weekdayCell.className = 'weekday-cell';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `select-${weekdayIds[index]}`;
            checkbox.onchange = (e) => this.toggleWeekday(weekdayIds[index], e.target);
            
            const span = document.createElement('span');
            span.textContent = day;
            
            weekdayCell.appendChild(checkbox);
            weekdayCell.appendChild(span);
            calendarWeekdays.appendChild(weekdayCell);
        });
        
        calendarWeekdays.insertBefore(weekdayHeader, calendarWeekdays.firstChild);
        
        // 캘린더 콘텐츠
        const salesCalendarContent = document.createElement('div');
        salesCalendarContent.className = 'sales-calendar-content';
        
        const salesCalendarDays = document.createElement('div');
        salesCalendarDays.className = 'sales-calendar-days';
        salesCalendarDays.id = 'sales-calendar-days';
        
        salesCalendarContent.appendChild(salesCalendarDays);
        
        // 선택된 날짜 플로팅 UI
        const floatingSelectionUI = document.createElement('div');
        floatingSelectionUI.className = 'floating-selection-ui';
        floatingSelectionUI.id = 'floating-selection-ui';
        floatingSelectionUI.style.display = 'none';
        
        const selectedCount = document.createElement('span');
        selectedCount.id = 'selected-count';
        selectedCount.textContent = '0개 선택됨';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-cancel';
        cancelBtn.textContent = '선택 취소';
        cancelBtn.onclick = () => this.clearAllSelections();
        
        const salesBtn = document.createElement('button');
        salesBtn.className = 'btn btn-sales';
        salesBtn.textContent = '판매 설정';
        salesBtn.onclick = () => this.openSettings();
        
        floatingSelectionUI.appendChild(selectedCount);
        floatingSelectionUI.appendChild(cancelBtn);
        floatingSelectionUI.appendChild(salesBtn);
        
        container.appendChild(salesHeader);
        container.appendChild(calendarWeekdays);
        container.appendChild(salesCalendarContent);
        container.appendChild(floatingSelectionUI);
        
        return container;
    }

    async loadRoomsFirst() {
        console.log('DailyPrice: loadRoomsFirst 시작');
        await this.loadRoomsFromServer();
        await this.loadData();
    }

    async loadRoomsFromServer() {
        try {
            console.log('DailyPrice: 서버에서 객실 데이터 로드 시작');
            const response = await fetch('/api/admin/rooms');
            const rooms = await response.json();
            
            console.log('DailyPrice: 서버에서 받은 원본 데이터:', rooms);
            
            // 객실 데이터를 this.roomData에 저장
            this.roomData = {};
            rooms.forEach(room => {
                // 서버 데이터 구조에 따라 변환
                if (room.data) {
                    // 이미 data 속성이 있는 경우
                    this.roomData[room.id] = room;
                } else {
                    // data 속성이 없는 경우 기본 구조로 변환
                    console.log(`DailyPrice: room ${room.id} 데이터 변환 필요`);
                    this.roomData[room.id] = {
                        id: room.id,
                        name: room.name || `객실 ${room.id}`,
                        data: {
                            checkInOut: Array(7).fill([16, 13]),
                            price: Array(7).fill(50000),
                            status: Array(7).fill(1),
                            usageTime: Array(7).fill(5),
                            openClose: Array(7).fill([14, 22]),
                            rentalPrice: Array(7).fill(30000),
                            rentalStatus: Array(7).fill(1)
                        }
                    };
                }
            });
            
            console.log('DailyPrice: 서버에서 객실 데이터 로드 완료:', this.roomData);
        } catch (error) {
            console.error('DailyPrice: 객실 데이터 로드 실패:', error);
            
            // 서버에서 데이터를 가져오지 못하면 테스트 데이터 사용
            console.log('DailyPrice: 테스트 데이터 사용');
            this.roomData = {
                'test-room-1': {
                    id: 'test-room-1',
                    name: '객실 A',
                    data: {
                        checkInOut: Array(7).fill([16, 13]),
                        price: Array(7).fill(50000),
                        status: Array(7).fill(1),
                        usageTime: Array(7).fill(5),
                        openClose: Array(7).fill([14, 22]),
                        rentalPrice: Array(7).fill(30000),
                        rentalStatus: Array(7).fill(1)
                    }
                },
                'test-room-2': {
                    id: 'test-room-2',
                    name: '객실 B',
                    data: {
                        checkInOut: Array(7).fill([16, 13]),
                        price: Array(7).fill(50000),
                        status: Array(7).fill(1),
                        usageTime: Array(7).fill(5),
                        openClose: Array(7).fill([14, 22]),
                        rentalPrice: Array(7).fill(30000),
                        rentalStatus: Array(7).fill(1)
                    }
                }
            };
        }
    }

    async loadData() {
        console.log('DailyPrice: loadData 시작');
        
        // 객실 데이터가 없으면 서버에서 로드
        if (!this.roomData || Object.keys(this.roomData).length === 0) {
            await this.loadRoomsFromServer();
        }
        
        console.log('DailyPrice: roomData:', this.roomData);
        
        await this.loadDailyPricesForMonth();
        this.renderCalendar();
        this.updateMonthDisplay();
        this.updateSettingsButton();
        
        console.log('DailyPrice: loadData 완료');
    }

    async loadDailyPricesForMonth() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            // 캐시 초기화
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            Object.keys(this.dailyPricesCache).forEach(key => {
                if (key.startsWith(monthKey)) {
                    delete this.dailyPricesCache[key];
                }
            });
            
            // 해당 월의 모든 날짜에 대해 요금 데이터 조회
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            for (let day = 1; day <= endDate.getDate(); day++) {
                const date = new Date(year, month, day);
                const dateString = this.formatDate(date);
                
                try {
                    const response = await fetch(`/api/admin/daily-prices?date=${dateString}&room_type=${this.currentRoomType}`);
                    const prices = await response.json();
                    
                    // 캐시에 저장
                    prices.forEach(price => {
                        const cacheKey = `${dateString}_${price.room_id}_${price.room_type}`;
                        this.dailyPricesCache[cacheKey] = price;
                    });
                } catch (error) {
                    console.error(`${dateString} 요금 데이터 로드 실패:`, error);
                }
            }
            
            console.log(`${year}년 ${month + 1}월 요금 데이터 로드 완료`);
        } catch (error) {
            console.error('월별 요금 데이터 로드 실패:', error);
        }
    }

    renderCalendar() {
        const calendarDays = document.getElementById('sales-calendar-days');
        calendarDays.innerHTML = '';
        this.cells = []; // cells 배열 다시 추가
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 해당 월의 첫 번째 날과 마지막 날 계산
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 첫 번째 날의 요일 (0: 일요일, 1: 월요일, ...)
        const firstDayOfWeek = firstDay.getDay();
        
        // 달력 시작 날짜 (이전 달의 날짜부터)
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDayOfWeek);
        
        // 현재 날짜 (과거 날짜 판별용)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 행별로 높이를 추적하기 위한 배열
        const rowHeights = [];
        let currentRow = 0;
        
        console.log('DailyPrice: renderCalendar 시작, roomData:', this.roomData);
        
        // 6주 × 7일 = 42개 셀 생성
        for (let week = 0; week < 6; week++) {
            const weekRow = [];
            
            for (let dayOfWeek = 0; dayOfWeek < 8; dayOfWeek++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + dayOfWeek);
                
                const dayElement = document.createElement('div');
                
                if (dayOfWeek === 0) {
                    // 체크박스 열
                    dayElement.className = 'sales-calendar-day checkbox-column';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'date-checkbox';
                    checkbox.dataset.date = this.formatDate(currentDate);
                    checkbox.onchange = (e) => this.toggleDateSelection(e.target);
                    dayElement.appendChild(checkbox);
                    weekRow.push(dayElement);
                } else {
                    // 날짜 셀
                    const isCurrentMonth = currentDate.getMonth() === month;
                    const isPastDate = currentDate < today;
                    
                    if (isCurrentMonth) {
                        if (isPastDate) {
                            // 과거 날짜
                            dayElement.className = 'sales-calendar-day past-date';
                            dayElement.textContent = currentDate.getDate();
                        } else {
                            // 현재 월의 미래 날짜
                            dayElement.className = 'sales-calendar-day has-data';
                            
                            // 날짜 번호
                            const dateNumber = document.createElement('div');
                            dateNumber.className = 'date-number';
                            dateNumber.textContent = currentDate.getDate();
                            dayElement.appendChild(dateNumber);
                            
                            // 객실 데이터 박스
                            const roomDataBox = document.createElement('div');
                            roomDataBox.className = 'room-data-box';
                            
                            const cell = new DailyPriceCell(currentDate, this.roomData, this.currentRoomType, this.dailyPricesCache);
                            this.cells.push(cell); // cells 배열에 추가
                            roomDataBox.innerHTML = cell.generateRoomData();
                            dayElement.appendChild(roomDataBox);
                            
                            // 선택된 날짜인지 확인
                            if (this.selectedDates.includes(this.formatDate(currentDate))) {
                                dayElement.classList.add('selected');
                            }
                            
                            // 클릭 이벤트
                            const clickDate = new Date(currentDate);
                            dayElement.onclick = () => this.selectDate(clickDate);
                        }
                        weekRow.push(dayElement);
                    } else {
                        // 다른 월의 날짜는 빈 셀로
                        dayElement.style.visibility = 'hidden';
                        weekRow.push(dayElement);
                    }
                }
                
                calendarDays.appendChild(dayElement);
            }
            
            // 현재 행의 높이 계산 및 체크박스 셀 높이 조정
            setTimeout(() => {
                this.adjustCheckboxHeight(weekRow);
            }, 0);
        }
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

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.selectedDates = [];
        await this.loadData();
    }

    async nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.selectedDates = [];
        await this.loadData();
    }

    async switchRoomType(type) {
        this.currentRoomType = type;
        this.selectedDates = [];
        
        // 버튼 상태 업데이트
        document.querySelectorAll('.room-type-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        await this.loadData();
    }

    selectDate(date) {
        const dateString = this.formatDate(date);
        
        if (this.selectedDates.includes(dateString)) {
            this.selectedDates = this.selectedDates.filter(d => d !== dateString);
        } else {
            this.selectedDates.push(dateString);
        }
        
        this.updateSettingsButton();
        this.updateCellSelections();
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

    updateCellSelections() {
        // 선택된 날짜에 따라 셀의 selected 클래스 업데이트
        const dayElements = document.querySelectorAll('.sales-calendar-day.has-data');
        dayElements.forEach(element => {
            const dateNumber = element.querySelector('.date-number');
            if (dateNumber) {
                const day = parseInt(dateNumber.textContent);
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                const date = new Date(year, month, day);
                const dateString = this.formatDate(date);
                
                if (this.selectedDates.includes(dateString)) {
                    element.classList.add('selected');
                } else {
                    element.classList.remove('selected');
                }
            }
        });
    }

    toggleAllDates(checkbox) {
        if (checkbox.checked) {
            // 모든 날짜 선택
            this.cells.forEach(cell => {
                const dateString = this.formatDate(cell.date);
                if (!this.selectedDates.includes(dateString)) {
                    this.selectedDates.push(dateString);
                }
            });
        } else {
            // 모든 선택 해제
            this.selectedDates = [];
        }
        
        this.updateSettingsButton();
        this.updateCellSelections();
        
        // 체크박스 상태 업데이트
        document.querySelectorAll('.date-checkbox').forEach(cb => {
            cb.checked = checkbox.checked;
        });
    }

    toggleWeekday(weekday, checkbox) {
        const weekdayIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(weekday);
        
        this.cells.forEach(cell => {
            const dayOfWeek = cell.date.getDay();
            if (dayOfWeek === weekdayIndex) {
                const dateString = this.formatDate(cell.date);
                
                if (checkbox.checked) {
                    if (!this.selectedDates.includes(dateString)) {
                        this.selectedDates.push(dateString);
                    }
                } else {
                    this.selectedDates = this.selectedDates.filter(d => d !== dateString);
                }
            }
        });
        
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
        
        window.popupCanvas.append('판매 설정', new DailyPricePopup(
            this.selectedDates,
            this.currentRoomType,
            this.roomData || {},
            this.dailyPricesCache,
            () => {
                // 저장 후 캐시 갱신 및 캘린더 재렌더링
                this.loadData();
            }
        ));
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}