class PriceTableItem {
    constructor(room, currentRoomType) {
        // 객실 데이터 저장
        this.room = room;
        this.currentRoomType = currentRoomType;

        // 데이터 파싱
        const parsedData = this.parseRoomData();

        // PriceTableMain을 사용하여 테이블 생성
        this.tableMain = new PriceTableMain(room, currentRoomType, parsedData);
        this.container = this.tableMain.getRootElement();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    parseRoomData() {
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
        const checkInOutData = parseArray(this.room.checkInOut, Array(7).fill([16, 13]));
        const openCloseData = parseArray(this.room.openClose, Array(7).fill([14, 22]));
        const priceData = parseArray(this.room.price, Array(7).fill(50000));
        const statusData = parseArray(this.room.status, Array(7).fill(1)).map(v => 
            typeof v === 'string' ? (v === '판매' ? 1 : 0) : v);
        const usageTimeData = parseArray(this.room.usageTime, Array(7).fill(5)).map(v => 
            typeof v === 'string' ? parseInt(v.replace('시간', '')) || 5 : v);
        const rentalPriceData = parseArray(this.room.rentalPrice, Array(7).fill(30000));
        const rentalStatusData = parseArray(this.room.rentalStatus, Array(7).fill(1)).map(v => 
            typeof v === 'string' ? (v === '판매' ? 1 : 0) : v);

        const formattedCheckInOut = formatTimeArray(checkInOutData);
        const formattedOpenClose = formatTimeArray(openCloseData);

        return {
            checkInOutData,
            openCloseData,
            priceData,
            statusData,
            usageTimeData,
            rentalPriceData,
            rentalStatusData,
            formattedCheckInOut,
            formattedOpenClose
        };
    }

    setupEventListeners() {
        const editButton = this.container.querySelector('button.edit');
        const deleteButton = this.container.querySelector('button.delete');
        
        editButton.addEventListener('click', () => {
            this.editCurrentRoom();
        });
        
        deleteButton.addEventListener('click', () => {
            this.deleteCurrentRoom();
        });
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
        // 편집용 복사본 생성
        const editItem = this.createEditCopy();
        window.popupCanvas.append('객실 수정', editItem);
    }

    createEditCopy() {
        // 파싱된 데이터를 PriceTablePopup에 전달
        const parsedData = this.parseRoomData();
        const editItem = new PriceTablePopup(this.room, this.currentRoomType, parsedData);
        
        // 편집 모드 활성화
        editItem.enableEditMode();
        
        // 원본 참조 저장 (저장 시 사용)
        editItem.originalItem = this;
        
        return editItem;
    }

    updateFromData(formData) {
        // 객실 이름 업데이트
        const h3 = this.container.querySelector('h3');
        if (h3 && formData.name) {
            h3.textContent = formData.name;
        }
        
        // 편집된 데이터로 원본 테이블 업데이트
        const tbody = this.container.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td:not(:first-child)');
            
            cells.forEach((cell, cellIndex) => {
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                const dayName = dayNames[cellIndex];
                
                if (rowIndex === 0) {
                    // 판매/마감 행
                    const status = formData.status[dayName] || '판매';
                    cell.textContent = status;
                } else if (rowIndex === 1) {
                    // 판매가 행
                    const price = formData.price[dayName] || '50000';
                    cell.textContent = `${price}원`;
                } else if (rowIndex === 2) {
                    // 입실/퇴실 시각 행
                    const time = formData.checkInOut[dayName] || '16시~13시';
                    cell.textContent = time;
                }
            });
        });
    }
    
    getRootElement() {
        return this.container;
    }
    
    remove() {
        this.container.remove();
    }
}

class PriceTableMain {
    constructor(room, currentRoomType, parsedData) {
        this.room = room;
        this.currentRoomType = currentRoomType;
        
        // 테이블 생성
        this.container = this.createTable(parsedData);
    }
    
    createTable(parsedData) {
        const container = document.createElement('div');
        container.className = 'price-table-inner-container';
            
        const topContainer = document.createElement('div');
        topContainer.className = 'price-table-inner-top-container';
        container.appendChild(topContainer);
            
        const h3 = document.createElement('h3');
        h3.textContent = this.room.name;
            
        const editButton = document.createElement('button');
        editButton.className = 'edit';
        editButton.textContent = '수정';
            
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete';
        deleteButton.textContent = '삭제';
            
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
            
        const headerRow = document.createElement('tr');
        const headers = ['항목/요일', '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        // 셀 데이터 채우기
        let rows = [];
        if(this.currentRoomType === 'daily'){
            rows = [
                { label: '판매/마감', data: parsedData.rentalStatusData.map(v => v === 1 ? '판매' : '마감') },
                { label: '판매가', data: parsedData.rentalPriceData.map(v => `${v}원`) },
                { label: '개시/마감 시각', data: parsedData.formattedOpenClose },
                { label: '이용시간', data: parsedData.usageTimeData.map(v => `${v}시간`) }
            ];
        }else{
            rows = [
                { label: '판매/마감', data: parsedData.statusData.map(v => v === 1 ? '판매' : '마감') },
                { label: '판매가', data: parsedData.priceData.map(v => `${v}원`) },
                { label: '입실/퇴실 시각', data: parsedData.formattedCheckInOut }
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
                
            tbody.appendChild(tr);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);
        table.appendChild(tbody);

        topContainer.appendChild(h3);
        topContainer.appendChild(editButton);
        topContainer.appendChild(deleteButton);
        container.appendChild(table);
        
        return container;
    }
    
    getRootElement() {
        return this.container;
    }
    
    remove() {
        this.container.remove();
    }
}

class PriceTablePopup {
    constructor(room, currentRoomType, parsedData) {
        this.room = room;
        this.currentRoomType = currentRoomType;
        
        // 테이블 생성
        this.container = this.createTable(parsedData);
    }
    
    createTable(parsedData) {
        const container = document.createElement('div');
        container.className = 'price-table-inner-container';
            
        const topContainer = document.createElement('div');
        topContainer.className = 'price-table-inner-top-container';
        container.appendChild(topContainer);
            
        const h3 = document.createElement('h3');
        h3.textContent = this.room.name;
            
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
            
        const headerRow = document.createElement('tr');
        const headers = ['항목/요일', '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        // 셀 데이터 채우기
        let rows = [];
        if(this.currentRoomType === 'daily'){
            rows = [
                { label: '판매/마감', data: parsedData.rentalStatusData.map(v => v === 1 ? '판매' : '마감') },
                { label: '판매가', data: parsedData.rentalPriceData.map(v => `${v}원`) },
                { label: '개시/마감 시각', data: parsedData.formattedOpenClose },
                { label: '이용시간', data: parsedData.usageTimeData.map(v => `${v}시간`) }
            ];
        }else{
            rows = [
                { label: '판매/마감', data: parsedData.statusData.map(v => v === 1 ? '판매' : '마감') },
                { label: '판매가', data: parsedData.priceData.map(v => `${v}원`) },
                { label: '입실/퇴실 시각', data: parsedData.formattedCheckInOut }
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
                
            tbody.appendChild(tr);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);
        table.appendChild(tbody);

        topContainer.appendChild(h3);
        container.appendChild(table);
        
        return container;
    }
    
    enableEditMode() {
        // 객실 이름을 편집 가능하게 변경
        const h3 = this.container.querySelector('h3');
        const roomNameInput = document.createElement('input');
        roomNameInput.type = 'text';
        roomNameInput.className = 'room-name-input';
        roomNameInput.value = h3.textContent;
        roomNameInput.style.cssText = 'font-size: 1.3rem; color: #1e293b; font-weight: 600; background: transparent; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; width: 200px;';
        
        h3.innerHTML = '';
        h3.appendChild(roomNameInput);
        
        // 테이블 셀들을 수정 가능하게 변경
        const tbody = this.container.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td:not(:first-child)');
            
            cells.forEach((cell, cellIndex) => {
                const originalText = cell.textContent;
                
                if (rowIndex === 0) {
                    // 판매/마감 행
                    const isSale = originalText === '판매';
                    const statusButtons = document.createElement('div');
                    statusButtons.className = 'status-buttons';
                    
                    const saleBtn = document.createElement('button');
                    saleBtn.className = `status-btn ${isSale ? 'active' : ''}`;
                    saleBtn.textContent = '판매';
                    saleBtn.onclick = () => this.changeStatus(saleBtn, 1, cellIndex);
                    
                    const closeBtn = document.createElement('button');
                    closeBtn.className = `status-btn ${!isSale ? 'active' : ''}`;
                    closeBtn.textContent = '마감';
                    closeBtn.onclick = () => this.changeStatus(closeBtn, 0, cellIndex);
                    
                    statusButtons.appendChild(saleBtn);
                    statusButtons.appendChild(closeBtn);
                    
                    cell.innerHTML = '';
                    cell.appendChild(statusButtons);
                    
                } else if (rowIndex === 1) {
                    // 판매가 행
                    const priceValue = originalText.replace(/[^0-9]/g, '') || '50000';
                    const priceContainer = document.createElement('div');
                    priceContainer.className = 'price-input-container';
                    
                    const priceInput = document.createElement('input');
                    priceInput.type = 'text';
                    priceInput.className = 'price-input';
                    priceInput.value = priceValue;
                    priceInput.maxLength = 8;
                    priceInput.oninput = (e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                    };
                    
                    const priceUnit = document.createElement('span');
                    priceUnit.textContent = '원';
                    priceUnit.style.marginLeft = '2px';
                    priceUnit.style.fontSize = '0.75rem';
                    
                    priceContainer.appendChild(priceInput);
                    priceContainer.appendChild(priceUnit);
                    
                    cell.innerHTML = '';
                    cell.appendChild(priceContainer);
                    
                } else if (rowIndex === 2) {
                    if (this.currentRoomType === 'daily') {
                        // 대실: 개시/마감 시각 행
                        const timeMatch = originalText.match(/(\d+)시~(\d+)시/);
                        const openHour = timeMatch ? timeMatch[1] : '16';
                        const closeHour = timeMatch ? timeMatch[2] : '13';
                        
                        const timeInputs = document.createElement('div');
                        timeInputs.className = 'time-inputs';
                        
                        const openDropdown = document.createElement('div');
                        openDropdown.className = 'custom-dropdown';
                        openDropdown.id = `open-hour-${cellIndex}`;
                        openDropdown.onmouseenter = () => this.showDropdown(openDropdown, 'hour', 0, 23, openHour);
                        openDropdown.onmouseleave = () => this.hideDropdown(openDropdown);
                        openDropdown.onclick = () => this.toggleInputMode(openDropdown, openHour);
                        
                        const openDisplay = document.createElement('div');
                        openDisplay.className = 'dropdown-display';
                        openDisplay.textContent = openHour;
                        
                        const openOptions = document.createElement('div');
                        openOptions.className = 'dropdown-options';
                        openOptions.style.display = 'none';
                        
                        openDropdown.appendChild(openDisplay);
                        openDropdown.appendChild(openOptions);
                        
                        const timeSeparator1 = document.createElement('span');
                        timeSeparator1.className = 'time-separator';
                        timeSeparator1.textContent = '시~';
                        
                        const closeDropdown = document.createElement('div');
                        closeDropdown.className = 'custom-dropdown';
                        closeDropdown.id = `close-hour-${cellIndex}`;
                        closeDropdown.onmouseenter = () => this.showDropdown(closeDropdown, 'hour', 0, 23, closeHour);
                        closeDropdown.onmouseleave = () => this.hideDropdown(closeDropdown);
                        closeDropdown.onclick = () => this.toggleInputMode(closeDropdown, closeHour);
                        
                        const closeDisplay = document.createElement('div');
                        closeDisplay.className = 'dropdown-display';
                        closeDisplay.textContent = closeHour;
                        
                        const closeOptions = document.createElement('div');
                        closeOptions.className = 'dropdown-options';
                        closeOptions.style.display = 'none';
                        
                        closeDropdown.appendChild(closeDisplay);
                        closeDropdown.appendChild(closeOptions);
                        
                        const timeSeparator2 = document.createElement('span');
                        timeSeparator2.className = 'time-separator';
                        timeSeparator2.textContent = '시';
                        
                        timeInputs.appendChild(openDropdown);
                        timeInputs.appendChild(timeSeparator1);
                        timeInputs.appendChild(closeDropdown);
                        timeInputs.appendChild(timeSeparator2);
                        
                        cell.innerHTML = '';
                        cell.appendChild(timeInputs);
                    } else {
                        // 숙박: 입실/퇴실 시각 행
                        const timeMatch = originalText.match(/(\d+)시~(\d+)시/);
                        const checkinHour = timeMatch ? timeMatch[1] : '16';
                        const checkoutHour = timeMatch ? timeMatch[2] : '13';
                        
                        const timeInputs = document.createElement('div');
                        timeInputs.className = 'time-inputs';
                        
                        const checkinDropdown = document.createElement('div');
                        checkinDropdown.className = 'custom-dropdown';
                        checkinDropdown.id = `checkin-hour-${cellIndex}`;
                        checkinDropdown.onmouseenter = () => this.showDropdown(checkinDropdown, 'hour', 0, 23, checkinHour);
                        checkinDropdown.onmouseleave = () => this.hideDropdown(checkinDropdown);
                        checkinDropdown.onclick = () => this.toggleInputMode(checkinDropdown, checkinHour);
                        
                        const checkinDisplay = document.createElement('div');
                        checkinDisplay.className = 'dropdown-display';
                        checkinDisplay.textContent = checkinHour;
                        
                        const checkinOptions = document.createElement('div');
                        checkinOptions.className = 'dropdown-options';
                        checkinOptions.style.display = 'none';
                        
                        checkinDropdown.appendChild(checkinDisplay);
                        checkinDropdown.appendChild(checkinOptions);
                        
                        const timeSeparator1 = document.createElement('span');
                        timeSeparator1.className = 'time-separator';
                        timeSeparator1.textContent = '시~';
                        
                        const checkoutDropdown = document.createElement('div');
                        checkoutDropdown.className = 'custom-dropdown';
                        checkoutDropdown.id = `checkout-hour-${cellIndex}`;
                        checkoutDropdown.onmouseenter = () => this.showDropdown(checkoutDropdown, 'hour', 0, 23, checkoutHour);
                        checkoutDropdown.onmouseleave = () => this.hideDropdown(checkoutDropdown);
                        checkoutDropdown.onclick = () => this.toggleInputMode(checkoutDropdown, checkoutHour);
                        
                        const checkoutDisplay = document.createElement('div');
                        checkoutDisplay.className = 'dropdown-display';
                        checkoutDisplay.textContent = checkoutHour;
                        
                        const checkoutOptions = document.createElement('div');
                        checkoutOptions.className = 'dropdown-options';
                        checkoutOptions.style.display = 'none';
                        
                        checkoutDropdown.appendChild(checkoutDisplay);
                        checkoutDropdown.appendChild(checkoutOptions);
                        
                        const timeSeparator2 = document.createElement('span');
                        timeSeparator2.className = 'time-separator';
                        timeSeparator2.textContent = '시';
                        
                        timeInputs.appendChild(checkinDropdown);
                        timeInputs.appendChild(timeSeparator1);
                        timeInputs.appendChild(checkoutDropdown);
                        timeInputs.appendChild(timeSeparator2);
                        
                        cell.innerHTML = '';
                        cell.appendChild(timeInputs);
                    }
                } else if (rowIndex === 3 && this.currentRoomType === 'daily') {
                    // 대실: 이용시간 행
                    const usageMatch = originalText.match(/(\d+)시간/);
                    const usageHour = usageMatch ? usageMatch[1] : '5';
                    
                    const timeInputs = document.createElement('div');
                    timeInputs.className = 'time-inputs';
                    timeInputs.style.cssText = 'justify-content: center !important; align-items: center !important; gap: 2px !important; display: flex !important;';
                    
                    const usageDropdown = document.createElement('div');
                    usageDropdown.className = 'custom-dropdown';
                    usageDropdown.id = `usage-hour-${cellIndex}`;
                    usageDropdown.onmouseenter = () => this.showDropdown(usageDropdown, 'usage', 2, 12, usageHour, 1);
                    usageDropdown.onmouseleave = () => this.hideDropdown(usageDropdown);
                    usageDropdown.onclick = () => this.toggleInputMode(usageDropdown, usageHour);
                    
                    const usageDisplay = document.createElement('div');
                    usageDisplay.className = 'dropdown-display';
                    usageDisplay.textContent = usageHour;
                    
                    const usageOptions = document.createElement('div');
                    usageOptions.className = 'dropdown-options';
                    usageOptions.style.display = 'none';
                    
                    usageDropdown.appendChild(usageDisplay);
                    usageDropdown.appendChild(usageOptions);
                    
                    const usageUnit = document.createElement('span');
                    usageUnit.style.cssText = 'font-size: 0.75rem !important; color: #374151 !important;';
                    usageUnit.textContent = '시간';
                    
                    timeInputs.appendChild(usageDropdown);
                    timeInputs.appendChild(usageUnit);
                    
                    cell.innerHTML = '';
                    cell.appendChild(timeInputs);
                }
            });
        });
    }

    changeStatus(clickedBtn, status, dayIndex) {
        const container = clickedBtn.parentElement;
        const buttons = container.querySelectorAll('.status-btn');
        
        buttons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        clickedBtn.classList.add('active');
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

    async submit() {
        try {
            const data = this.getData();
            console.log('PriceTablePopup submit - data:', data);
            
            // 객실 데이터 업데이트
            this.room.name = data.name;
            this.room.checkInOut = data.checkInOut;
            this.room.price = data.price;
            this.room.status = data.status;
            this.room.usageTime = data.usageTime;
            this.room.openClose = data.openClose;
            this.room.rentalPrice = data.rentalPrice;
            this.room.rentalStatus = data.rentalStatus;
            
            // DB에 저장
            const response = await fetch(`/api/admin/rooms/${this.room.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.room)
            });
            
            if (response.ok) {
                console.log('PriceTablePopup: 객실 수정 완료');
                
                // 원본 PriceTableItem 업데이트
                if (this.originalItem) {
                    this.originalItem.updateFromData(data);
                }
                
                // 부모 PriceTable 업데이트
                if (this.originalItem && this.originalItem.parentTable) {
                    this.originalItem.parentTable.updateRoom();
                }
            } else {
                console.error('PriceTablePopup: 객실 수정 실패');
                alert('객실 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('PriceTablePopup: 객실 수정 오류:', error);
            alert('객실 수정에 실패했습니다.');
        }
    }

    getData() {
        const data = {
            id: this.room.id,
            name: this.container.querySelector('.room-name-input')?.value || this.room.name,
            checkInOut: [],
            price: [],
            status: [],
            usageTime: [],
            openClose: [],
            rentalPrice: [],
            rentalStatus: []
        };

        // 원본 객실 데이터 파싱
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

        // 원본 객실 데이터에서 기본값 추출
        const originalCheckInOut = parseArray(this.room.checkInOut, Array(7).fill([16, 13]));
        const originalPrice = parseArray(this.room.price, Array(7).fill(50000));
        const originalStatus = parseArray(this.room.status, Array(7).fill(1)).map(v => 
            typeof v === 'string' ? (v === '판매' ? 1 : 0) : v);
        const originalUsageTime = parseArray(this.room.usageTime, Array(7).fill(5)).map(v => 
            typeof v === 'string' ? parseInt(v.replace('시간', '')) || 5 : v);
        const originalOpenClose = parseArray(this.room.openClose, Array(7).fill([14, 22]));
        const originalRentalPrice = parseArray(this.room.rentalPrice, Array(7).fill(30000));
        const originalRentalStatus = parseArray(this.room.rentalStatus, Array(7).fill(1)).map(v => 
            typeof v === 'string' ? (v === '판매' ? 1 : 0) : v);

        // 일월화수목금토 순서로 배열 초기화
        for (let i = 0; i < 7; i++) {
            if (this.currentRoomType === 'daily') {
                // 대실 편집 시: 대실 데이터는 팝업에서 수집, 숙박 데이터는 원본 사용
                data.checkInOut[i] = originalCheckInOut[i];
                data.price[i] = originalPrice[i];
                data.status[i] = originalStatus[i];
                data.usageTime[i] = originalUsageTime[i]; // 원본 사용
                data.openClose[i] = originalOpenClose[i]; // 원본 사용
                data.rentalPrice[i] = originalRentalPrice[i]; // 원본 사용
                data.rentalStatus[i] = originalRentalStatus[i]; // 원본 사용
            } else {
                // 숙박 편집 시: 숙박 데이터는 팝업에서 수집, 대실 데이터는 원본 사용
                data.checkInOut[i] = originalCheckInOut[i]; // 원본 사용
                data.price[i] = originalPrice[i]; // 원본 사용
                data.status[i] = originalStatus[i]; // 원본 사용
                data.usageTime[i] = originalUsageTime[i];
                data.openClose[i] = originalOpenClose[i];
                data.rentalPrice[i] = originalRentalPrice[i];
                data.rentalStatus[i] = originalRentalStatus[i];
            }
        }
        
        const tbody = this.container.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td:not(:first-child)');
            
            cells.forEach((cell, cellIndex) => {
                if (rowIndex === 0) {
                    // 판매/마감 행
                    const activeBtn = cell.querySelector('.status-btn.active');
                    if (this.currentRoomType === 'daily') {
                        data.rentalStatus[cellIndex] = activeBtn && activeBtn.textContent === '판매' ? 1 : 0;
                    } else {
                        data.status[cellIndex] = activeBtn && activeBtn.textContent === '판매' ? 1 : 0;
                    }
                } else if (rowIndex === 1) {
                    // 판매가 행
                    const priceInput = cell.querySelector('.price-input');
                    if (this.currentRoomType === 'daily') {
                        data.rentalPrice[cellIndex] = priceInput ? parseInt(priceInput.value) : 30000;
                    } else {
                        data.price[cellIndex] = priceInput ? parseInt(priceInput.value) : 50000;
                    }
                } else if (rowIndex === 2) {
                    if (this.currentRoomType === 'daily') {
                        // 대실: 개시/마감 시각 행
                        const openDisplay = cell.querySelector('#open-hour-' + cellIndex + ' .dropdown-display');
                        const closeDisplay = cell.querySelector('#close-hour-' + cellIndex + ' .dropdown-display');
                        const openHour = openDisplay ? parseInt(openDisplay.textContent) : 14;
                        const closeHour = closeDisplay ? parseInt(closeDisplay.textContent) : 22;
                        data.openClose[cellIndex] = [openHour, closeHour];
                        console.log(`대실 개시/마감 시각 [${cellIndex}]:`, data.openClose[cellIndex]);
                    } else {
                        // 숙박: 입실/퇴실 시각 행
                        const checkinDisplay = cell.querySelector('#checkin-hour-' + cellIndex + ' .dropdown-display');
                        const checkoutDisplay = cell.querySelector('#checkout-hour-' + cellIndex + ' .dropdown-display');
                        const checkinHour = checkinDisplay ? parseInt(checkinDisplay.textContent) : 16;
                        const checkoutHour = checkoutDisplay ? parseInt(checkoutDisplay.textContent) : 13;
                        data.checkInOut[cellIndex] = [checkinHour, checkoutHour];
                        console.log(`숙박 입실/퇴실 시각 [${cellIndex}]:`, data.checkInOut[cellIndex]);
                    }
                } else if (rowIndex === 3 && this.currentRoomType === 'daily') {
                    // 대실: 이용시간 행
                    const usageDisplay = cell.querySelector('#usage-hour-' + cellIndex + ' .dropdown-display');
                    const usageHour = usageDisplay ? parseInt(usageDisplay.textContent) : 5;
                    data.usageTime[cellIndex] = usageHour;
                }
            });
        });

        return data;
    }
    
    getRootElement() {
        return this.container;
    }
    
    remove() {
        this.container.remove();
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
