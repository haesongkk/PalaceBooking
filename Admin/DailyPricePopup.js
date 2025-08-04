class DailyPricePopup {
    constructor(selectedDates, currentRoomType, roomData, dailyPricesCache, onSave) {
        this.selectedDates = selectedDates;
        this.currentRoomType = currentRoomType;
        this.roomData = roomData;
        this.dailyPricesCache = dailyPricesCache;
        this.onSave = onSave;
        
        this.modal = this.createModal();
        this.initialValues = {};
        
        this.show();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'price-table-inner-container';
        
        modal.innerHTML = `
            <div class="price-table-inner-top-container">
                <div class="sales-info-bar">
                    <div class="selected-dates-info" id="selected-dates-info"></div>
                    <div class="current-room-type" id="current-room-type"></div>
                </div>
            </div>
            <table class="sales-form-table">
                <thead>
                    <tr>
                        <th>객실명</th>
                        <th>상태</th>
                        <th>가격</th>
                        <th id="details-header">시간</th>
                    </tr>
                </thead>
                <tbody id="form-rows">
                </tbody>
            </table>
        `;
        
        // 팝업 인스턴스를 모달에 저장
        modal.appendChild(document.createElement('div'));
        modal.querySelector('div:last-child').className = 'daily-price-popup';
        modal.querySelector('div:last-child').popupInstance = this;
        
        return modal;
    }

    show() {
        this.updateInfo();
        this.generateForm();
        this.setupEventListeners();
    }

    updateInfo() {
        const formattedDates = this.selectedDates.sort().map(dateString => {
            const date = new Date(dateString);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }).join(', ');
        
        const selectedDatesInfo = this.modal.querySelector('#selected-dates-info');
        const currentRoomType = this.modal.querySelector('#current-room-type');
        const detailsHeader = this.modal.querySelector('#details-header');
        
        if (selectedDatesInfo) {
            selectedDatesInfo.textContent = `선택한 날짜: ${formattedDates} (총 ${this.selectedDates.length}개)`;
        }
        
        if (currentRoomType) {
            currentRoomType.textContent = `현재 모드: ${this.currentRoomType === 'daily' ? '대실' : '숙박'}`;
        }
        
        // 헤더 업데이트
        if (detailsHeader) {
            if (this.currentRoomType === 'daily') {
                detailsHeader.className = 'split-header';
                detailsHeader.innerHTML = `
                    <div>개시/마감 시각</div>
                    <div>이용시간</div>
                `;
            } else {
                detailsHeader.className = '';
                detailsHeader.textContent = '입실/퇴실 시각';
            }
        }
    }

    async generateForm() {
        const formRows = this.modal.querySelector('#form-rows');
        const roomIds = Object.keys(this.roomData);
        
        if (!formRows) {
            console.error('form-rows 요소를 찾을 수 없습니다.');
            return;
        }
        
        if (roomIds.length === 0) {
            formRows.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">등록된 객실이 없습니다.</td></tr>';
            return;
        }
        
        // 선택된 날짜들의 기존 요금 정보 불러오기
        let existingPrices = {};
        if (this.selectedDates.length > 0) {
            const lastSelectedDate = this.selectedDates[0];
            roomIds.forEach(roomId => {
                const dailyPriceKey = `${lastSelectedDate}_${roomId}_${this.currentRoomType}`;
                const dailyPrice = this.dailyPricesCache[dailyPriceKey];
                if (dailyPrice) {
                    existingPrices[roomId] = dailyPrice;
                }
            });
        }
        
        formRows.innerHTML = '';
        
        roomIds.forEach(roomId => {
            const room = this.roomData[roomId];
            const existingPrice = existingPrices[roomId];
            
            const row = document.createElement('tr');
            row.className = 'form-row';
            
            // 객실명
            const nameCell = document.createElement('td');
            nameCell.textContent = room.name;
            row.appendChild(nameCell);
            
            // 상태 버튼
            const statusCell = document.createElement('td');
            const statusBtn = document.createElement('button');
            statusBtn.className = 'status-btn';
            statusBtn.textContent = '판매';
            statusBtn.dataset.roomId = roomId;
            statusBtn.onclick = () => this.changeStatus(roomId, '판매');
            
            const stoppedBtn = document.createElement('button');
            stoppedBtn.className = 'status-btn stopped';
            stoppedBtn.textContent = '판매중지';
            stoppedBtn.dataset.roomId = roomId;
            stoppedBtn.onclick = () => this.changeStatus(roomId, '판매중지');
            
            // 기존 상태 설정
            if (existingPrice) {
                if (existingPrice.status === 1) {
                    statusBtn.classList.add('active');
                } else {
                    stoppedBtn.classList.add('active');
                }
            } else {
                statusBtn.classList.add('active');
            }
            
            statusCell.appendChild(statusBtn);
            statusCell.appendChild(stoppedBtn);
            row.appendChild(statusCell);
            
            // 가격 입력
            const priceCell = document.createElement('td');
            const priceContainer = document.createElement('div');
            priceContainer.className = 'price-input-container';
            
            const priceInput = document.createElement('input');
            priceInput.type = 'text';
            priceInput.className = 'price-input';
            priceInput.dataset.roomId = roomId;
            priceInput.maxLength = 8;
            priceInput.oninput = (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
            };
            
            if (existingPrice) {
                priceInput.value = existingPrice.price || 0;
            } else {
                const dayOfWeek = new Date(this.selectedDates[0]).getDay();
                if (this.currentRoomType === 'daily') {
                    priceInput.value = room.data.rentalPrice[dayOfWeek] || 30000;
                } else {
                    priceInput.value = room.data.price[dayOfWeek] || 50000;
                }
            }
            
            const priceUnit = document.createElement('span');
            priceUnit.textContent = '원';
            priceUnit.style.marginLeft = '2px';
            priceUnit.style.fontSize = '0.75rem';
            
            priceContainer.appendChild(priceInput);
            priceContainer.appendChild(priceUnit);
            priceCell.appendChild(priceContainer);
            row.appendChild(priceCell);
            
            // 시간 설정
            const timeCell = document.createElement('td');
            if (this.currentRoomType === 'daily') {
                // 대실: 개시/마감 시각 + 이용시간
                const openHourDropdown = this.createTimeDropdown(
                    `sales-open-hour-${roomId}`, 6, 23, 
                    existingPrice ? JSON.parse(existingPrice.details)[0] : 14,
                    'open'
                );
                const closeHourDropdown = this.createTimeDropdown(
                    `sales-close-hour-${roomId}`, 6, 23,
                    existingPrice ? JSON.parse(existingPrice.details)[1] : 22,
                    'close'
                );
                const usageHourDropdown = this.createTimeDropdown(
                    `sales-usage-hour-${roomId}`, 1, 12,
                    existingPrice ? parseInt(existingPrice.usage_time) : 5,
                    'usage'
                );
                
                const timeInputs1 = document.createElement('div');
                timeInputs1.className = 'time-inputs';
                timeInputs1.style.justifyContent = 'center';
                
                const timeSeparator1 = document.createElement('span');
                timeSeparator1.className = 'time-separator';
                timeSeparator1.textContent = '시~';
                
                const timeSeparator2 = document.createElement('span');
                timeSeparator2.className = 'time-separator';
                timeSeparator2.textContent = '시';
                
                const timeSeparator3 = document.createElement('span');
                timeSeparator3.className = 'time-separator';
                timeSeparator3.textContent = '시간';
                
                timeInputs1.appendChild(openHourDropdown);
                timeInputs1.appendChild(timeSeparator1);
                timeInputs1.appendChild(closeHourDropdown);
                timeInputs1.appendChild(timeSeparator2);
                
                const timeInputs2 = document.createElement('div');
                timeInputs2.className = 'time-inputs';
                timeInputs2.style.justifyContent = 'center';
                timeInputs2.style.marginTop = '4px';
                
                timeInputs2.appendChild(usageHourDropdown);
                timeInputs2.appendChild(timeSeparator3);
                
                timeCell.appendChild(timeInputs1);
                timeCell.appendChild(timeInputs2);
            } else {
                // 숙박: 입실/퇴실 시각
                const checkinHourDropdown = this.createTimeDropdown(
                    `sales-checkin-hour-${roomId}`, 0, 23,
                    existingPrice ? JSON.parse(existingPrice.details)[0] : 16,
                    'checkin'
                );
                const checkoutHourDropdown = this.createTimeDropdown(
                    `sales-checkout-hour-${roomId}`, 0, 23,
                    existingPrice ? JSON.parse(existingPrice.details)[1] : 13,
                    'checkout'
                );
                
                const timeInputs = document.createElement('div');
                timeInputs.className = 'time-inputs';
                timeInputs.style.justifyContent = 'center';
                
                const timeSeparator1 = document.createElement('span');
                timeSeparator1.className = 'time-separator';
                timeSeparator1.textContent = '시~';
                
                const timeSeparator2 = document.createElement('span');
                timeSeparator2.className = 'time-separator';
                timeSeparator2.textContent = '시';
                
                timeInputs.appendChild(checkinHourDropdown);
                timeInputs.appendChild(timeSeparator1);
                timeInputs.appendChild(checkoutHourDropdown);
                timeInputs.appendChild(timeSeparator2);
                
                timeCell.appendChild(timeInputs);
            }
            
            row.appendChild(timeCell);
            formRows.appendChild(row);
        });
        
        // DOM 요소 생성 후 초기값 저장 (다음 틱에서 실행)
        setTimeout(() => {
            this.saveInitialValues();
        }, 0);
    }

    createTimeDropdown(id, min, max, currentValue, type) {
        const container = document.createElement('div');
        container.className = 'custom-dropdown';
        container.id = id;
        container.onmouseenter = () => this.showDropdown(container, type, min, max, currentValue);
        container.onmouseleave = () => this.hideDropdown(container);
        container.onclick = () => this.toggleInputMode(container, currentValue);
        
        const display = document.createElement('div');
        display.className = 'dropdown-display';
        display.textContent = currentValue;
        
        const options = document.createElement('div');
        options.className = 'dropdown-options';
        options.style.display = 'none';
        
        container.appendChild(display);
        container.appendChild(options);
        
        return container;
    }

    showDropdown(dropdown, type, min, max, currentValue) {
        const options = dropdown.querySelector('.dropdown-options');
        options.innerHTML = '';
        
        for (let i = min; i <= max; i++) {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.textContent = i;
            if (i.toString() === currentValue) {
                option.classList.add('selected');
            }
            option.onclick = () => {
                dropdown.querySelector('.dropdown-display').textContent = i;
                this.hideDropdown(dropdown);
            };
            options.appendChild(option);
        }
        
        options.style.display = 'block';
    }

    hideDropdown(dropdown) {
        const options = dropdown.querySelector('.dropdown-options');
        options.style.display = 'none';
    }

    toggleInputMode(dropdown, currentValue) {
        // 드롭다운 토글 기능 (필요시 구현)
    }

    changeStatus(roomId, status) {
        const statusBtns = this.modal.querySelectorAll(`.status-btn[data-room-id="${roomId}"]`);
        statusBtns.forEach(btn => btn.classList.remove('active'));
        
        const clickedBtn = event.target;
        clickedBtn.classList.add('active');
    }

    saveInitialValues() {
        const roomIds = Object.keys(this.roomData);
        
        roomIds.forEach(roomId => {
            const priceInput = this.modal.querySelector(`.price-input[data-room-id="${roomId}"]`);
            const statusBtn = this.modal.querySelector(`.status-btn[data-room-id="${roomId}"]`);
            
            // DOM 요소가 존재하지 않으면 기본값 사용
            if (!priceInput || !statusBtn) {
                console.warn(`DailyPricePopup: room ${roomId}의 DOM 요소를 찾을 수 없습니다. 기본값 사용.`);
                this.initialValues[roomId] = {
                    status: 1,
                    price: this.currentRoomType === 'daily' ? 30000 : 50000,
                    details: this.currentRoomType === 'daily' ? [14, 22] : [16, 13],
                    usage_time: this.currentRoomType === 'daily' ? '5시간' : ''
                };
                return;
            }
            
            const initialStatus = statusBtn.classList.contains('active') ? 1 : 0;
            const initialPrice = parseInt(priceInput.value) || 0;
            
            let initialDetails, initialUsageTime;
            
            if (this.currentRoomType === 'daily') {
                const openHour = parseInt(this.modal.querySelector(`#sales-open-hour-${roomId} .dropdown-display`)?.textContent || '14');
                const closeHour = parseInt(this.modal.querySelector(`#sales-close-hour-${roomId} .dropdown-display`)?.textContent || '22');
                const usageHours = this.modal.querySelector(`#sales-usage-hour-${roomId} .dropdown-display`)?.textContent || '5';
                
                initialDetails = [openHour, closeHour];
                initialUsageTime = `${usageHours}시간`;
            } else {
                const checkInHour = parseInt(this.modal.querySelector(`#sales-checkin-hour-${roomId} .dropdown-display`)?.textContent || '16');
                const checkOutHour = parseInt(this.modal.querySelector(`#sales-checkout-hour-${roomId} .dropdown-display`)?.textContent || '13');
                
                initialDetails = [checkInHour, checkOutHour];
                initialUsageTime = '';
            }
            
            this.initialValues[roomId] = {
                status: initialStatus,
                price: initialPrice,
                details: initialDetails,
                usage_time: initialUsageTime
            };
        });
    }

    async saveSettings() {
        try {
            const roomIds = Object.keys(this.roomData);
            const savePromises = [];
            
            for (const dateString of this.selectedDates) {
                for (const roomId of roomIds) {
                    const priceInput = this.modal.querySelector(`.price-input[data-room-id="${roomId}"]`);
                    const statusBtn = this.modal.querySelector(`.status-btn[data-room-id="${roomId}"]`);
                    
                    // DOM 요소가 존재하지 않으면 기본값 사용
                    if (!priceInput || !statusBtn) {
                        console.warn(`DailyPricePopup: room ${roomId}의 DOM 요소를 찾을 수 없습니다. 기본값 사용.`);
                        const status = 1;
                        const price = this.currentRoomType === 'daily' ? 30000 : 50000;
                        let details, usageTime;
                        
                        if (this.currentRoomType === 'daily') {
                            details = JSON.stringify([14, 22]);
                            usageTime = '5시간';
                        } else {
                            details = JSON.stringify([16, 13]);
                            usageTime = '';
                        }
                        
                        const priceData = {
                            date: dateString,
                            room_id: roomId,
                            room_type: this.currentRoomType,
                            status: status,
                            price: price,
                            details: details,
                            usage_time: usageTime
                        };
                        
                        // API 호출
                        const response = await fetch('/api/admin/daily-prices', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(priceData)
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Failed to save price data for ${dateString} ${roomId}`);
                        }
                        continue;
                    }
                    
                    const status = statusBtn.classList.contains('active') ? 1 : 0;
                    const price = parseInt(priceInput.value);
                    
                    let details, usageTime;
                    
                    if (this.currentRoomType === 'daily') {
                        const openHour = parseInt(this.modal.querySelector(`#sales-open-hour-${roomId} .dropdown-display`)?.textContent || '14');
                        const closeHour = parseInt(this.modal.querySelector(`#sales-close-hour-${roomId} .dropdown-display`)?.textContent || '22');
                        const usageHours = this.modal.querySelector(`#sales-usage-hour-${roomId} .dropdown-display`)?.textContent || '5';
                        
                        details = JSON.stringify([openHour, closeHour]);
                        usageTime = `${usageHours}시간`;
                    } else {
                        const checkInHour = parseInt(this.modal.querySelector(`#sales-checkin-hour-${roomId} .dropdown-display`)?.textContent || '16');
                        const checkOutHour = parseInt(this.modal.querySelector(`#sales-checkout-hour-${roomId} .dropdown-display`)?.textContent || '13');
                        
                        details = JSON.stringify([checkInHour, checkOutHour]);
                        usageTime = '';
                    }
                    
                    const priceData = {
                        date: dateString,
                        room_id: roomId,
                        room_type: this.currentRoomType,
                        status: status,
                        price: price,
                        details: details,
                        usage_time: usageTime
                    };
                    
                    // API 호출
                    const response = await fetch('/api/admin/daily-prices', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(priceData)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to save price data for ${dateString} ${roomId}`);
                    }
                }
            }
            
            console.log('판매 설정 저장 완료');
            
            if (this.onSave) {
                this.onSave();
            }
            
            // PopupCanvas 닫기
            if (window.popupCanvas) {
                window.popupCanvas.close();
            }
            
        } catch (error) {
            console.error('판매 설정 저장 실패:', error);
            alert('판매 설정 저장에 실패했습니다.');
        }
    }

    setupEventListeners() {
        // 마우스 호버 방식이므로 별도의 이벤트 리스너가 필요 없음
    }
    
    cleanupEventListeners() {
        // 마우스 호버 방식이므로 별도의 정리가 필요 없음
    }

    close() {
        // DOM 요소 제거
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        // 이벤트 리스너 정리
        this.cleanupEventListeners();
        
        // 인스턴스 정리
        this.modal = null;
        this.initialValues = {};
        this.selectedDates = [];
        this.roomData = {};
        this.dailyPricesCache = {};
        this.onSave = null;
    }

    getRootElement() {
        return this.modal;
    }

    remove() {
        this.close();
    }
} 