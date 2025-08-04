window.onload = function() {
    new MenuBar();
    window.mainCanvas = new MainCanvas();
    window.popupCanvas = new PopupCanvas();
}


// 탭 전환 함수
function switchTab(tabName) {

    
    // 판매 캘린더 탭을 클릭한 경우에만 데이터 로드
    if (tabName === 'sales') {
        console.log('판매 캘린더 탭 클릭 - 데이터 로드 시작');
        // DailyPrice 클래스가 자체적으로 데이터를 로드하므로 여기서는 아무것도 하지 않음
    }
    
    // 요금표 관리 탭을 클릭한 경우 숙박 모드로 기본 설정
    if (tabName === 'room') {
        // 숙박 버튼 활성화
        document.querySelectorAll('.room-type-btn').forEach(btn => btn.classList.remove('active'));
        const overnightBtn = document.querySelector('[onclick="switchRoomType(\'overnight\')"]');
        if (overnightBtn) {
            overnightBtn.classList.add('active');
        }
        currentRoomType = 'overnight';
        
        // 객실 목록 다시 렌더링
        renderRoomList();
    }
}

// 마감 설정 데이터


// 초기화 및 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 초기 데이터 로드
    // fetchReservations(); // 주석 처리 - 함수가 정의되지 않음
    
    // 객실 데이터 로드
    loadRoomsFromDB().then(() => {
        // 대실/숙박 버튼 초기화 (숙박 모드로 기본 설정)
        switchRoomType('overnight');
    });
    
    // Socket.IO 클라이언트 연결 및 실시간 갱신 (ReserveList에서 독자적으로 처리)
    // adminAPI.connectSocket();
    // adminAPI.onSocketEvent('reservation-updated', () => {
    //     fetchReservations();
    // });
}); 

// 객실 관리 함수들
// 기존 addRoom 함수 대체
function addRoom() {
    // 사용 가능한 첫 번째 빈 인덱스 찾기
    const roomLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    let availableIndex = 0;
    
    // 이미 존재하는 객실 ID들을 확인하여 빈 인덱스 찾기
    for (let i = 0; i < roomLetters.length; i++) {
        const testRoomId = `room${roomLetters[i]}`;
        if (!roomData[testRoomId]) {
            availableIndex = i;
            break;
        }
    }
    
    // 최대 12개 객실 제한
    if (availableIndex >= 12) {
        alert('최대 12개 객실까지 등록 가능합니다.');
        return;
    }
    
    // 객실 ID 및 이름 생성
    const newRoomId = `room${roomLetters[availableIndex]}`;
    const newRoomName = `객실 ${roomLetters[availableIndex]}`;
    
    console.log('사용 가능한 인덱스:', availableIndex, '새 객실 ID:', newRoomId);

    // 기본 데이터 생성 (기본값으로 시작)
    roomData[newRoomId] = {
        name: newRoomName,
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
    
    console.log('새 객실 데이터 초기화:', newRoomId, roomData[newRoomId]);

    // UI 업데이트 (기본값이 설정된 후 즉시 렌더링)
    renderRoomList();

    // 새 객실이 추가되었으므로 DB에 저장
    setTimeout(() => {
        // DB에 새 객실 저장
        saveRoomToDB(newRoomId);
        
        // 새로 추가된 객실의 수정 모드 진입
        setTimeout(() => {
            const editBtns = document.querySelectorAll(`[onclick="editRoom('${newRoomId}')"]`);
            if (editBtns.length > 0) {
                // 마지막에 추가된 객실의 수정 버튼 클릭
                editBtns[editBtns.length - 1].click();
            }
        }, 100);
    }, 100);
}

function editRoom(roomId) {
    const editButton = event.target;
    
    if (editButton.textContent === '수정') {
        // 수정 모드 시작
        editButton.textContent = '저장';
        editButton.classList.add('btn-save');
        
        // 객실 이름 수정 - 특정 객실의 제목을 찾기 위해 부모 요소를 통해 접근
        const roomItem = editButton.closest('.room-item');
        const roomNameElement = roomItem.querySelector('h3');
        const currentRoomName = roomNameElement.textContent;
        roomNameElement.innerHTML = `
            <input type="text" class="room-name-input" value="${currentRoomName}" 
                   style="width: 120px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 1rem; font-weight: bold;">
        `;
        
        // 특정 객실의 테이블을 찾기
        const roomTable = roomItem.querySelector('.room-table');
        
        // 시간 관련 행 수정 (대실/숙박에 따라 다름)
        if (currentRoomType === 'daily') {
            // 대실: 개시/마감 시각 행 수정
            const openCloseCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
            openCloseCells.forEach((cell, cellIndex) => {
                const currentTime = cell.textContent.trim();
                const [open, close] = currentTime.split('~');
                
                // 안전한 기본값 설정
                let openHour = '14';
                let closeHour = '22';
                
                if (open && close) {
                    openHour = open.replace('시', '') || '14';
                    closeHour = close.replace('시', '') || '22';
                }
                
                cell.innerHTML = `
                    <div class="time-inputs">
                        <div class="custom-dropdown" id="open-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${openHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${openHour}')">
                            <div class="dropdown-display">${openHour}</div>
                            <div class="dropdown-options" style="display: none;"></div>
                        </div>
                        <span class="time-separator">시~</span>
                        <div class="custom-dropdown" id="close-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${closeHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${closeHour}')">
                            <div class="dropdown-display">${closeHour}</div>
                            <div class="dropdown-options" style="display: none;"></div>
                        </div>
                        <span class="time-separator">시</span>
                    </div>
                `;
            });
        } else {
            // 숙박: 입실/퇴실 시각 행 수정
            const checkInOutCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
            checkInOutCells.forEach((cell, cellIndex) => {
                const currentTime = cell.textContent.trim();
                const [checkIn, checkOut] = currentTime.split('~');
                
                // 안전한 기본값 설정
                let checkInHour = '16';
                let checkOutHour = '13';
                
                if (checkIn && checkOut) {
                    checkInHour = checkIn.replace('시', '') || '16';
                    checkOutHour = checkOut.replace('시', '') || '13';
                }
                
                cell.innerHTML = `
                    <div class="time-inputs">
                        <div class="custom-dropdown" id="checkin-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${checkInHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkInHour}')">
                            <div class="dropdown-display">${checkInHour}</div>
                            <div class="dropdown-options" style="display: none;"></div>
                        </div>
                        <span class="time-separator">시~</span>
                        <div class="custom-dropdown" id="checkout-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${checkOutHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkOutHour}')">
                            <div class="dropdown-display">${checkOutHour}</div>
                            <div class="dropdown-options" style="display: none;"></div>
                        </div>
                        <span class="time-separator">시</span>
                    </div>
                `;
            });
        }
        
        // 판매/마감 행의 모든 셀을 버튼으로 변경
        const statusCells = roomTable.querySelectorAll('tr:nth-child(1) td:not(:first-child)');
        
        statusCells.forEach((cell, index) => {
            const actualStatus = currentRoomType === 'daily' ? 
                roomData[roomId].data.rentalStatus[index] : 
                roomData[roomId].data.status[index];
            const currentStatus = actualStatus !== undefined ? actualStatus : 1;
            console.log(`[editRoom] ${currentRoomType} 모드, index=${index}, actualStatus=${actualStatus}, currentStatus=${currentStatus}`);
            const statusText = getStatusText(currentStatus);
            cell.innerHTML = `
                <div class="status-buttons">
                    <button class="status-btn ${currentStatus === 1 ? 'active' : ''}" onclick="changeStatus(this, 1)">판매</button>
                    <button class="status-btn ${currentStatus === 0 ? 'active' : ''}" onclick="changeStatus(this, 0)">마감</button>
                </div>
            `;
        });
        

        // 이용시간 행 수정 (대실에만 해당)
        if (currentRoomType === 'daily') {
            const usageTimeCells = roomTable.querySelectorAll('tr:nth-child(4) td:not(:first-child)');
            usageTimeCells.forEach((cell, cellIndex) => {
                const currentTime = cell.textContent.trim();
                const hours = currentTime.replace('시간', '');
                
                cell.innerHTML = `
                    <div class="time-inputs" style="justify-content:center;align-items:center;gap:2px;">
                        <div class="custom-dropdown" id="usage-hour-${cellIndex}" onmouseenter="showDropdown(this, 'usage', 2, 12, '${hours}', 1)" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${hours}')">
                            <div class="dropdown-display">${hours}</div>
                            <div class="dropdown-options" style="display: none;"></div>
                        </div>
                        <span style="font-size:0.75rem;">시간</span>
                    </div>
                `;
            });
        }



        // 판매가 행 수정 (대실/숙박에 따라 다름)
        const priceCells = roomTable.querySelectorAll('tr:nth-child(2) td:not(:first-child)');
        priceCells.forEach((cell, cellIndex) => {
            const currentPrice = cell.textContent.trim().replace(/[^\d]/g, '');
            cell.innerHTML = `
                <div class="price-input-container">
                    <input type="text" class="price-input" value="${currentPrice}" maxlength="8" 
                           oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 8);" 
                           style="width: 60px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 4px; font-size: 0.75rem;">
                    <span style="margin-left: 2px; font-size: 0.75rem;">원</span>
                </div>
            `;
        });



// 드롭다운을 클릭하면 input 모드로 전환
window.toggleInputMode = function(dropdown, currentValue) {
    const display = dropdown.querySelector('.dropdown-display');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.maxLength = 2;
    input.style.cssText = 'width:100%;height:100%;border:none;text-align:center;font-size:0.75rem;background:transparent;outline:none;box-sizing:border-box;';
    
    // 숫자만 입력 가능
    input.oninput = function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2);
    };
    
    // 엔터키나 포커스 아웃 시 드롭다운 모드로 복귀
    input.onkeydown = function(e) {
        if (e.key === 'Enter') {
            display.textContent = this.value;
            this.remove();
            
            // 판매 설정의 커스텀 드롭다운인 경우 임시 데이터 업데이트
            updateSalesDataFromDropdown(dropdown);
        }
    };
    
    input.onblur = function() {
        display.textContent = this.value;
        this.remove();
        
        // 판매 설정의 커스텀 드롭다운인 경우 임시 데이터 업데이트
        updateSalesDataFromDropdown(dropdown);
    };
    
    // 기존 텍스트를 숨기고 input 추가
    display.textContent = '';
    display.appendChild(input);
    input.focus();
    input.select();
}

// 판매 설정의 커스텀 드롭다운에서 값이 변경될 때 임시 데이터 업데이트
function updateSalesDataFromDropdown(dropdown) {
    const elementId = dropdown.id;
    
    if (elementId && elementId.startsWith('sales-')) {
        const roomId = elementId.split('-').slice(-1)[0]; // 마지막 부분이 roomId
        
        if (elementId.includes('usage-hour')) {
            // 이용시간 변경
            updateSalesUsageTime(roomId);
        } else if (elementId.includes('open-hour') || elementId.includes('open-min') || 
                   elementId.includes('close-hour') || elementId.includes('close-min') ||
                   elementId.includes('checkin-hour') || elementId.includes('checkin-min') ||
                   elementId.includes('checkout-hour') || elementId.includes('checkout-min')) {
            // 시간 변경
            updateSalesTime(roomId);
        }
    }
}
    } else {
        // 저장 버튼 클릭 시
        editButton.textContent = '수정';
        editButton.classList.remove('btn-save');
        editButton.onclick = () => editRoom(roomId);

        // 수정된 데이터를 기존 UI로 복원하고 DB에 저장
        // 객실 이름 복원 - 특정 객실의 제목을 찾기 위해 부모 요소를 통해 접근
        const roomItem = editButton.closest('.room-item');
        const roomNameInput = roomItem.querySelector('.room-name-input');
        const roomNameElement = roomItem.querySelector('h3');
        const roomName = roomNameInput ? roomNameInput.value : (roomId ? roomData[roomId].name : '새 객실');
        roomNameElement.innerHTML = `<h3>${roomName}</h3>`;
        
        // 현재 객실 데이터 업데이트
        if (roomId) {
            roomData[roomId].name = roomName;
            
            // 객실 버튼 텍스트 즉시 업데이트
            const roomButtons = document.querySelectorAll('.room-btn');
            const buttonIndex = Object.keys(roomData).indexOf(roomId);
            if (roomButtons[buttonIndex]) {
                roomButtons[buttonIndex].textContent = roomName;
            }
        }
        
        // 특정 객실의 테이블을 찾기
        const roomTable = roomItem.querySelector('.room-table');
        
        // 판매/마감 상태 복원
        const statusCells = roomTable.querySelectorAll('tr:nth-child(1) td:not(:first-child)');
        statusCells.forEach((cell, cellIndex) => {
            const activeButton = cell.querySelector('.status-btn.active');
            const status = activeButton ? (activeButton.textContent === '판매' ? 1 : 0) : 1;
            const statusText = getStatusText(status);
            cell.innerHTML = `<span>${statusText}</span>`;
            if (roomId) {
                if (currentRoomType === 'daily') {
                    roomData[roomId].data.rentalStatus[cellIndex] = status;
                } else {
                    roomData[roomId].data.status[cellIndex] = status;
                }
            }
        });

        // 시간 관련 복원 (대실/숙박에 따라 다름)
        if (currentRoomType === 'daily') {
            // 대실: 개시/마감 시각 복원
            const openCloseCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
            openCloseCells.forEach((cell, cellIndex) => {
                const timeInputs = cell.querySelectorAll('.custom-dropdown .dropdown-display');
                const openHour = parseInt(timeInputs[0] ? timeInputs[0].textContent : '14');
                const closeHour = parseInt(timeInputs[1] ? timeInputs[1].textContent : '22');
                const timeTuple = [openHour, closeHour];
                const timeString = `${openHour}시~${closeHour}시`;
                cell.innerHTML = `<span>${timeString}</span>`;
                if (roomId) {
                    roomData[roomId].data.openClose[cellIndex] = timeTuple;
                }
            });
        } else {
            // 숙박: 입실/퇴실 시각 복원
            const checkInOutCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
            checkInOutCells.forEach((cell, cellIndex) => {
                const timeInputs = cell.querySelectorAll('.custom-dropdown .dropdown-display');
                const checkInHour = parseInt(timeInputs[0] ? timeInputs[0].textContent : '16');
                const checkOutHour = parseInt(timeInputs[1] ? timeInputs[1].textContent : '13');
                const timeTuple = [checkInHour, checkOutHour];
                const timeString = `${checkInHour}시~${checkOutHour}시`;
                cell.innerHTML = `<span>${timeString}</span>`;
                if (roomId) {
                    roomData[roomId].data.checkInOut[cellIndex] = timeTuple;
                }
            });
        }

        // 이용시간 복원 (대실에만 해당)
        if (currentRoomType === 'daily') {
            const usageCells = roomTable.querySelectorAll('tr:nth-child(4) td:not(:first-child)');
            usageCells.forEach((cell, cellIndex) => {
                const usageDisplay = cell.querySelector('.dropdown-display');
                const hours = usageDisplay ? usageDisplay.textContent : '5';
                const usageString = `${hours}시간`;
                cell.innerHTML = `<span>${usageString}</span>`;
                if (roomId) {
                    roomData[roomId].data.usageTime[cellIndex] = parseInt(hours);
                }
            });
        }



        // 판매가 복원 (대실/숙박에 따라 다름)
        const priceCellsForRestore = roomTable.querySelectorAll('tr:nth-child(2) td:not(:first-child)');
        priceCellsForRestore.forEach((cell, cellIndex) => {
            const priceInput = cell.querySelector('.price-input');
            const price = priceInput ? parseInt(priceInput.value) : (currentRoomType === 'daily' ? 30000 : 50000);
            const priceString = `${price}원`;
            cell.innerHTML = `<span>${priceString}</span>`;
            if (roomId) {
                if (currentRoomType === 'daily') {
                    roomData[roomId].data.rentalPrice[cellIndex] = price;
                } else {
                    roomData[roomId].data.price[cellIndex] = price;
                }
            }
        });



        // DB에 저장
        if (roomId) {
            saveRoomToDB(roomId);
        }
    }
}

function updateTimeDisplay(input) {
    // 시간 입력 시 실시간으로 표시 업데이트 (선택사항)
    // 현재는 저장 시에만 반영되도록 구현
}

function openDropdown(select) {
    // 드롭다운을 열기 위해 focus와 click을 순차적으로 실행
    setTimeout(() => {
        select.focus();
        select.click();
    }, 100);
}

function showDropdown(element, type, min, max, currentValue, step = 1) {
    // 기존 드롭다운 제거
    const existingDropdown = document.querySelector('.floating-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // 새로운 드롭다운 생성
    const dropdown = document.createElement('div');
    dropdown.className = 'floating-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '999999';
    
    // 드롭다운 위치 계산
    const rect = element.getBoundingClientRect();
    const dropdownWidth = 33;
    const offsetX = (rect.width - dropdownWidth) / 2;
    dropdown.style.left = (rect.left + offsetX) + 'px';
    dropdown.style.top = (rect.bottom + 2) + 'px';
    dropdown.style.width = dropdownWidth + 'px';
    dropdown.style.minWidth = dropdownWidth + 'px';
    
    // 옵션 생성
    let optionsHTML = '';
    for (let i = min; i <= max; i += step) {
        let value, displayValue;
        if (type === 'usage') {
            value = i.toString();
            displayValue = i.toString();
        } else {
            value = i.toString().padStart(2, '0');
            displayValue = value;
        }
        const isSelected = value === currentValue ? 'selected' : '';
        optionsHTML += `<div class="dropdown-option ${isSelected}" onclick="selectOption(this, '${value}', '${element.id}', '${type}')">${displayValue}</div>`;
    }
    
    dropdown.innerHTML = optionsHTML;
    document.body.appendChild(dropdown);
    
    // 드롭다운 위에 마우스가 있을 때는 유지
    dropdown.onmouseenter = () => {
        // 드롭다운 유지
    };
    
    // 드롭다운과 원본 요소 모두에서 마우스가 벗어나면 제거
    dropdown.onmouseleave = () => {
        setTimeout(() => {
            if (!element.matches(':hover') && !dropdown.matches(':hover')) {
                dropdown.remove();
            }
        }, 100);
    };
    
    // 원본 요소에서 마우스가 벗어날 때도 체크
    element.onmouseleave = () => {
        setTimeout(() => {
            if (!element.matches(':hover') && !dropdown.matches(':hover')) {
                dropdown.remove();
            }
        }, 100);
    };
}

function hideDropdown(element) {
    // floating-dropdown이 있고, 드롭다운 위에 마우스가 없을 때만 제거
    const floatingDropdown = document.querySelector('.floating-dropdown');
    if (floatingDropdown && !floatingDropdown.matches(':hover')) {
        setTimeout(() => {
            if (!element.matches(':hover') && !floatingDropdown.matches(':hover')) {
                floatingDropdown.remove();
            }
        }, 100);
    }
}

function selectOption(optionElement, value, elementId, type) {
    const dropdown = document.getElementById(elementId);
    const display = dropdown.querySelector('.dropdown-display');
    
    if (type === 'usage') {
        display.textContent = value;
    } else {
        display.textContent = value;
    }
    
    // 선택된 옵션 스타일 업데이트
    const options = dropdown.querySelectorAll('.dropdown-option');
    options.forEach(opt => opt.classList.remove('selected'));
    optionElement.classList.add('selected');
    
    hideDropdown(dropdown);
    
    // 판매 설정의 커스텀 드롭다운인 경우 임시 데이터 업데이트
    if (elementId.startsWith('sales-')) {
        const roomId = elementId.split('-').slice(-1)[0]; // 마지막 부분이 roomId
        
        if (elementId.includes('usage-hour')) {
            // 이용시간 변경
            updateSalesUsageTime(roomId);
        } else if (elementId.includes('open-hour') || elementId.includes('open-min') || 
                   elementId.includes('close-hour') || elementId.includes('close-min') ||
                   elementId.includes('checkin-hour') || elementId.includes('checkin-min') ||
                   elementId.includes('checkout-hour') || elementId.includes('checkout-min')) {
            // 시간 변경
            updateSalesTime(roomId);
        }
    }
}

function changeStatus(button, status) {
    // 같은 행의 다른 버튼들의 active 클래스 제거
    const buttons = button.parentElement.querySelectorAll('.status-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 클릭된 버튼에 active 클래스 추가
    button.classList.add('active');
    
    // 현재 편집 중인 객실의 데이터 업데이트
    if (currentRoom) {
        const cellIndex = Array.from(button.closest('td').parentElement.children).indexOf(button.closest('td')) - 1;
        if (currentRoomType === 'daily') {
            roomData[currentRoom].data.rentalStatus[cellIndex] = status;
        } else {
            roomData[currentRoom].data.status[cellIndex] = status;
        }
    }
}

// DB에 객실 저장
function saveRoomToDB(roomId) {
    if (!roomData[roomId]) return;
    
    const room = roomData[roomId];
    const roomDataForDB = {
        id: roomId,
        name: room.name,
        checkInOut: JSON.stringify(room.data.checkInOut),
        price: JSON.stringify(room.data.price),
        status: JSON.stringify(room.data.status),
        usageTime: JSON.stringify(room.data.usageTime),
        openClose: JSON.stringify(room.data.openClose),
        rentalPrice: JSON.stringify(room.data.rentalPrice),
        rentalStatus: JSON.stringify(room.data.rentalStatus)
    };

    fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomDataForDB)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('객실 저장 성공:', roomId);
        } else {
            console.error('객실 저장 실패:', data.error);
            alert('객실 저장에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
        }
    })
    .catch(error => {
        console.error('객실 저장 실패:', error);
        alert('객실 저장 중 오류가 발생했습니다.');
    });
}

function deleteRoom(roomId) {
    if (confirm('정말로 이 객실을 삭제하시겠습니까?')) {
        fetch(`/api/admin/rooms/${roomId}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // 로컬 데이터에서 제거
                delete roomData[roomId];
                
                // UI 업데이트
                renderRoomList();
                
                // 모든 객실이 표시되므로 switchRoom 호출이 필요하지 않음
                console.log('객실 삭제 완료 - 모든 객실이 세로로 표시됩니다');
                
                alert('객실이 삭제되었습니다.');
            } else {
                alert('객실 삭제에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('객실 삭제 실패:', error);
            alert('객실 삭제 중 오류가 발생했습니다.');
        });
    }
}

// 객실 데이터
window.roomData = {};

let currentRoom = null;
let currentRoomType = 'overnight'; // 'daily' 또는 'overnight'

// DB에서 객실 데이터 로드
window.loadRoomsFromDB = function() {
    return fetch('/api/admin/rooms')
        .then(res => res.json())
        .then(rooms => {
            // 기존 roomData 초기화
            Object.keys(roomData).forEach(key => delete roomData[key]);
            
            // DB에서 로드한 데이터로 roomData 구성
            rooms.forEach(room => {
                // 각 필드에 대해 안전한 파싱 및 기본값 설정
                const parseArray = (jsonString, defaultValue) => {
                    try {
                        if (!jsonString) return defaultValue;
                        
                        // 이미 배열인 경우 그대로 반환
                        if (Array.isArray(jsonString)) return jsonString;
                        
                        // 문자열이 아닌 경우 기본값 반환
                        if (typeof jsonString !== 'string') return defaultValue;
                        
                        // 빈 문자열인 경우 기본값 반환
                        if (jsonString.trim() === '') return defaultValue;
                        
                        // JSON 파싱 시도
                        const parsed = JSON.parse(jsonString);
                        
                        // 파싱된 결과가 배열이 아니면 기본값 반환
                        if (!Array.isArray(parsed)) return defaultValue;
                        
                        return parsed;
                    } catch (e) {
                        console.warn('JSON 파싱 오류:', e, '원본 데이터:', jsonString);
                        return defaultValue;
                    }
                };

                // 시간 데이터를 로드할 때 형식 변환 (정수 튜플 배열 -> HH시 형식)
                const checkInOutData = parseArray(room.checkInOut, Array(7).fill([16, 13]));
                const openCloseData = parseArray(room.openClose, Array(7).fill([14, 22]));
                
                // 정수 튜플 배열을 HH시 형식으로 변환
                const formatTimeArray = (timeArray) => {
                    return timeArray.map(timeTuple => {
                        if (Array.isArray(timeTuple) && timeTuple.length === 2) {
                            const [startHour, endHour] = timeTuple;
                            return `${startHour}시~${endHour}시`;
                        }
                        // 기존 문자열 형식이 남아있다면 변환
                        if (typeof timeTuple === 'string' && timeTuple.includes('~')) {
                            const [start, end] = timeTuple.split('~');
                            const formattedStart = formatTimeDisplay(start.trim());
                            const formattedEnd = formatTimeDisplay(end.trim());
                            return `${formattedStart}~${formattedEnd}`;
                        }
                        return '16시~13시'; // 기본값
                    });
                };
                
                roomData[room.id] = {
                    name: room.name,
                    data: {
                        checkInOut: formatTimeArray(checkInOutData),
                        price: parseArray(room.price, Array(7).fill(50000)),
                        status: parseArray(room.status, Array(7).fill(1)).map(v => typeof v === 'string' ? (v === '판매' ? 1 : 0) : v),
                        usageTime: parseArray(room.usageTime, Array(7).fill(5)).map(v => typeof v === 'string' ? parseInt(v.replace('시간', '')) || 5 : v),
                        openClose: formatTimeArray(openCloseData),
                        rentalPrice: parseArray(room.rentalPrice, Array(7).fill(30000)),
                        rentalStatus: parseArray(room.rentalStatus, Array(7).fill(1)).map(v => typeof v === 'string' ? (v === '판매' ? 1 : 0) : v)
                    }
                };
            });
            
            // UI 업데이트
            renderRoomList();
            
            // 모든 객실이 표시되므로 switchRoom 호출이 필요하지 않음
            console.log('객실 데이터 로드 완료 - 모든 객실이 세로로 표시됩니다');
        })
        .catch(error => {
            console.error('객실 데이터 로드 실패:', error);
            // 오류 발생 시에도 빈 상태로 설정
            currentRoom = null;
            const roomList = document.querySelector('.room-list');
            roomList.innerHTML = '<p>등록된 객실이 없습니다.</p>';
        });
}

// 객실 버튼 렌더링
// 객실 버튼 렌더링 함수 제거됨 - 모든 객실이 세로로 표시됩니다
function renderRoomButtons() {
    // 객실 버튼이 더 이상 필요하지 않으므로 빈 함수로 유지
    console.log('객실 버튼 렌더링이 비활성화되었습니다 - 모든 객실이 세로로 표시됩니다');
}

// status 값을 문자열로 변환하는 함수
function getStatusText(status) {
    console.log(`[getStatusText] 입력값: ${status} (${typeof status}), 값 비교: status === 1 = ${status === 1}, status == 1 = ${status == 1}`);
    const result = status === 1 ? '판매' : '마감';
    console.log(`[getStatusText] 결과: ${result}`);
    return result;
}

// 객실 목록 렌더링 - 모든 객실을 세로로 표시
function renderRoomList() {
    const roomList = document.querySelector('.room-list');
    
    // room-list 요소가 존재하지 않으면 함수 종료
    if (!roomList) {
        console.log('renderRoomList: .room-list 요소가 존재하지 않습니다. (다른 탭이 활성화됨)');
        return;
    }
    
    roomList.innerHTML = '';
    
    const roomIds = Object.keys(roomData);
    console.log('renderRoomList 호출, 객실 목록:', roomIds, '전체 데이터:', roomData);
    
    if (roomIds.length === 0) {
        roomList.innerHTML = '<p>등록된 객실이 없습니다.</p>';
        return;
    }
    
    roomIds.forEach(roomId => {
        const room = roomData[roomId];
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        // 모든 객실을 항상 표시
        roomItem.style.display = 'block';
        
        let tableContent = '';
        
        if (currentRoomType === 'daily') {
            // 대실 테이블
            tableContent = `
                <tbody>
                    <tr><td>판매/마감</td>${room.data.rentalStatus.map(v => `<td>${getStatusText(v)}</td>`).join('')}</tr>
                    <tr><td>판매가</td>${room.data.rentalPrice.map(v => `<td>${v}원</td>`).join('')}</tr>
                    <tr><td>개시/마감 시각</td>${room.data.openClose.map(v => {
                        if (Array.isArray(v) && v.length === 2) {
                            return `<td>${v[0]}시~${v[1]}시</td>`;
                        }
                        return `<td>${v}</td>`;
                    }).join('')}</tr>
                    <tr><td>이용시간</td>${room.data.usageTime.map(v => `<td>${v}시간</td>`).join('')}</tr>
                </tbody>
            `;
        } else {
            // 숙박 테이블
            tableContent = `
                <tbody>
                    <tr><td>판매/마감</td>${room.data.status.map(v => `<td>${getStatusText(v)}</td>`).join('')}</tr>
                    <tr><td>판매가</td>${room.data.price.map(v => `<td>${v}원</td>`).join('')}</tr>
                    <tr><td>입실/퇴실 시각</td>${room.data.checkInOut.map(v => {
                        if (Array.isArray(v) && v.length === 2) {
                            return `<td>${v[0]}시~${v[1]}시</td>`;
                        }
                        return `<td>${v}</td>`;
                    }).join('')}</tr>
                </tbody>
            `;
        }
        
        roomItem.innerHTML = `
            <div class="room-item-header">
                <h3>${room.name}</h3>
                <div class="room-actions">
                    <button class="btn btn-edit" onclick="editRoom('${roomId}')">수정</button>
                    <button class="btn btn-delete" onclick="deleteRoom('${roomId}')">삭제</button>
                </div>
            </div>
            <div class="room-table-container">
                <table class="room-table ${currentRoomType}">
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
                    ${tableContent}
                </table>
            </div>
        `;
        roomList.appendChild(roomItem);
    });
}

// 대실/숙박 전환 함수
function switchRoomType(type) {
    currentRoomType = type;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.room-type-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`[onclick="switchRoomType('${type}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // 테이블 내용 업데이트 (요금표 관리 탭에서만)
    const roomList = document.querySelector('.room-list');
    if (roomList) {
        renderRoomList();
    }
    
    // 현재 선택된 객실이 있으면 해당 객실 표시
    if (currentRoom) {
        switchRoom(currentRoom);
    }
}

// 객실 전환 함수
// 객실 전환 함수 - 더 이상 필요하지 않음 (모든 객실이 표시됨)
function switchRoom(roomId) {
    // 객실 버튼이 제거되었으므로 이 함수는 더 이상 사용되지 않습니다
    console.log('switchRoom 함수가 비활성화되었습니다 - 모든 객실이 세로로 표시됩니다');
}

// 시간 형식을 변환하는 함수 (HH:MM -> HH시)
function formatTimeDisplay(timeString) {
    if (!timeString || typeof timeString !== 'string') return timeString;
    
    // HH:MM 형식을 HH시 형식으로 변환
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hour = parseInt(match[1]);
        return `${hour}시`;
    }
    
    // 이미 HH시 형식이면 그대로 반환
    if (timeString.includes('시')) {
        return timeString;
    }
    
    return timeString;
}

// 시간 형식을 파싱하는 함수 (HH시 -> HH:00)
function parseTimeDisplay(timeString) {
    if (!timeString || typeof timeString !== 'string') return timeString;
    
    // HH시 형식을 HH:00 형식으로 변환
    const match = timeString.match(/^(\d{1,2})시$/);
    if (match) {
        const hour = parseInt(match[1]);
        return `${hour.toString().padStart(2, '0')}:00`;
    }
    
    // 이미 HH:MM 형식이면 그대로 반환
    if (timeString.includes(':')) {
        return timeString;
    }
    
    return timeString;
}

// 테이블 데이터 업데이트 함수
function updateRoomTable(roomId) {
    if (!roomData[roomId]) return;
    
    const data = roomData[roomId].data;
    console.log('updateRoomTable 호출:', roomId, '데이터:', data);
    
    // 현재 표시된 객실의 DOM 요소 확인
    const currentRoomItem = document.querySelector('.room-item[style*="display: none"]');
    const visibleRoomItem = document.querySelector('.room-item:not([style*="display: none"])');
    console.log('숨겨진 객실 요소:', currentRoomItem);
    console.log('표시된 객실 요소:', visibleRoomItem);
    console.log('현재 객실 타입:', currentRoomType);
    
    if (currentRoomType === 'daily') {
        console.log('대실 모드 테이블 업데이트 시작');
        // 현재 표시된 객실의 테이블만 선택
        const visibleRoomItem = document.querySelector('.room-item:not([style*="display: none"])');
        if (!visibleRoomItem) {
            console.log('표시된 객실을 찾을 수 없음');
            return;
        }
        const roomTable = visibleRoomItem.querySelector('.room-table');
        if (!roomTable) {
            console.log('객실 테이블을 찾을 수 없음');
            return;
        }
        
        // 대실 테이블 순서: 판매/마감, 판매가, 개시/마감 시각, 이용시간
        const rentalStatusCells = roomTable.querySelectorAll('tr:nth-child(1) td:not(:first-child)');
        console.log('판매/마감 셀 개수:', rentalStatusCells.length);
        rentalStatusCells.forEach((cell, index) => {
            cell.textContent = getStatusText(data.rentalStatus[index]);
        });
        
        const rentalPriceCells = roomTable.querySelectorAll('tr:nth-child(2) td:not(:first-child)');
        console.log('판매가 셀 개수:', rentalPriceCells.length);
        rentalPriceCells.forEach((cell, index) => {
            cell.textContent = data.rentalPrice[index];
        });
        
        const openCloseCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
        console.log('개시/마감 시각 셀 개수:', openCloseCells.length);
        openCloseCells.forEach((cell, index) => {
            const timeData = data.openClose[index];
            if (Array.isArray(timeData) && timeData.length === 2) {
                cell.textContent = `${timeData[0]}시~${timeData[1]}시`;
            } else {
                cell.textContent = timeData;
            }
        });
        
        const usageCells = roomTable.querySelectorAll('tr:nth-child(4) td:not(:first-child)');
        console.log('이용시간 셀 개수:', usageCells.length);
        usageCells.forEach((cell, index) => {
            cell.textContent = data.usageTime[index] + '시간';
        });
    } else {
        console.log('숙박 모드 테이블 업데이트 시작');
        // 현재 표시된 객실의 테이블만 선택
        const visibleRoomItem = document.querySelector('.room-item:not([style*="display: none"])');
        if (!visibleRoomItem) {
            console.log('표시된 객실을 찾을 수 없음');
            return;
        }
        const roomTable = visibleRoomItem.querySelector('.room-table');
        if (!roomTable) {
            console.log('객실 테이블을 찾을 수 없음');
            return;
        }
        
        // 숙박 테이블 순서: 판매/마감, 판매가, 입실/퇴실 시각
        const statusCells = roomTable.querySelectorAll('tr:nth-child(1) td:not(:first-child)');
        console.log('판매/마감 셀 개수:', statusCells.length);
        statusCells.forEach((cell, index) => {
            cell.textContent = getStatusText(data.status[index]);
        });
        
        const priceCells = roomTable.querySelectorAll('tr:nth-child(2) td:not(:first-child)');
        console.log('판매가 셀 개수:', priceCells.length);
        priceCells.forEach((cell, index) => {
            cell.textContent = data.price[index];
        });
        
        const checkInOutCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
        console.log('입실/퇴실 시각 셀 개수:', checkInOutCells.length);
        checkInOutCells.forEach((cell, index) => {
            const timeData = data.checkInOut[index];
            if (Array.isArray(timeData) && timeData.length === 2) {
                cell.textContent = `${timeData[0]}시~${timeData[1]}시`;
            } else {
                cell.textContent = timeData;
            }
        });
    }
}



// 마감 설정 관련 함수들




// 판매 캘린더 관련 변수들
let salesCurrentDate = new Date();
let salesSelectedDates = []; // 여러 날짜 선택을 위한 배열
let lastSelectedDate = null; // 마지막으로 선택된 날짜
let salesCurrentRoomType = 'overnight'; // 'daily' 또는 'overnight'
let dailyPricesCache = {}; // 날짜별 요금 데이터 캐시

// 해당 월의 날짜별 요금 데이터 로드
async function loadDailyPricesForMonth(year, month) {
    try {
        // 해당 월의 모든 날짜에 대해 요금 데이터 조회
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        // 캐시 초기화
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        Object.keys(dailyPricesCache).forEach(key => {
            if (key.startsWith(monthKey)) {
                delete dailyPricesCache[key];
            }
        });
        
        // 각 날짜별로 요금 데이터 조회
        for (let day = 1; day <= endDate.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateString = formatDate(date);
            
            try {
                const response = await fetch(`/api/admin/daily-prices?date=${dateString}&room_type=${salesCurrentRoomType}`);
                const prices = await response.json();
                
                // 캐시에 저장
                prices.forEach(price => {
                    const cacheKey = `${dateString}_${price.room_id}_${price.room_type}`;
                    dailyPricesCache[cacheKey] = price;
                    console.log(`[loadDailyPricesForMonth] 캐시 저장: ${cacheKey}`, {
                        status: price.status,
                        statusType: typeof price.status,
                        price: price.price,
                        details: price.details
                    });
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

// 달력 초기화
async function initCalendar() {
    console.log('판매 캘린더 데이터 로드 시작');
    
    // 캐시 초기화 (최신 데이터를 위해)
    dailyPricesCache = {};
    
    await renderSalesCalendar();
    
    // 판매 캘린더 초기화 - 숙박 버튼 활성화 및 월 이동 버튼 상태 업데이트
    setTimeout(() => {
        const overnightBtn = document.querySelector('#panel-sales [onclick="switchSalesRoomType(\'overnight\')"]');
        if (overnightBtn) {
            overnightBtn.classList.add('active');
        }
        updateMonthNavigationButtons();
        console.log('판매 캘린더 데이터 로드 완료');
    }, 100);
}









// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 판매 캘린더 렌더링
async function renderSalesCalendar() {
    const year = salesCurrentDate.getFullYear();
    const month = salesCurrentDate.getMonth();
    
    // 월 표시 업데이트
    document.getElementById('sales-current-month').textContent = `${year}년 ${month + 1}월`;
    
    // 월 이동 버튼 상태 업데이트
    updateMonthNavigationButtons();
    
    // 해당 월의 날짜별 요금 데이터 로드
    await loadDailyPricesForMonth(year, month);
    
    // 달력 날짜 생성
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 오늘 날짜 (과거 날짜 체크용)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 달력의 시작일 계산 (일요일부터 시작)
    const startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    const calendarDays = document.getElementById('sales-calendar-days');
    calendarDays.innerHTML = '';
    
    let currentDate = new Date(startDate);
    
    // 달력의 끝 날짜 계산 (마지막 날짜가 포함된 주의 토요일까지)
    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const daysToAdd = 6 - lastDayOfWeek; // 토요일까지 추가
    endDate.setDate(lastDay.getDate() + daysToAdd);
    
    // 주 단위로 반복
    while (currentDate <= endDate) {
        for (let dayOfWeek = 0; dayOfWeek < 8; dayOfWeek++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'sales-calendar-day';
            
            // 첫 번째 열은 체크박스로
            if (dayOfWeek === 0) {
                // 체크박스는 항상 생성
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'date-checkbox';
                checkbox.dataset.date = formatDate(currentDate);
                checkbox.onchange = (e) => toggleDateSelection(e.target);
                
                dayElement.appendChild(checkbox);
                dayElement.classList.add('checkbox-column');
            } else {
                // 현재 월의 날짜인 경우에만 셀 생성
                if (currentDate.getMonth() === month) {
                    // 과거 날짜인지 확인
                    const isPastDate = currentDate < today;
                    
                    // 날짜 표시 (과거든 미래든 숫자는 표시)
                    dayElement.textContent = currentDate.getDate();
                    
                    if (isPastDate) {
                        // 과거 날짜는 회색으로 표시하고 클릭 불가, 높이도 줄임
                        dayElement.classList.add('past-date');
                    } else {
                        // 미래 날짜는 정상 표시
                        dayElement.classList.remove('past-date');
                        
                        // 객실 데이터 표시
                        const roomDataContent = generateRoomDataForDate(currentDate);
                        if (roomDataContent) {
                            dayElement.classList.add('has-data');
                            dayElement.innerHTML = `
                                <div class="date-number">${currentDate.getDate()}</div>
                                <div class="room-data-box">
                                    ${roomDataContent}
                                </div>
                            `;
                        }
                        
                        // 선택된 날짜인지 확인
                        if (salesSelectedDates.includes(formatDate(currentDate))) {
                            dayElement.classList.add('selected');
                        }
                        
                        // 클릭 이벤트 - 현재 날짜의 복사본을 전달
                        const clickDate = new Date(currentDate);
                        dayElement.onclick = () => selectSalesDate(clickDate);
                    }
                } else {
                    // 다른 월의 날짜는 빈 셀로
                    dayElement.style.visibility = 'hidden';
                }
            }
            
            calendarDays.appendChild(dayElement);
            
            // 첫 번째 열(체크박스)이 아닌 경우에만 날짜 증가
            if (dayOfWeek > 0) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }
}

// 판매 캘린더 날짜 선택
function selectSalesDate(date) {
    const dateString = formatDate(date);
    
    // 과거 날짜는 선택하지 않음
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
        console.log('과거 날짜는 선택할 수 없습니다.');
        return;
    }
    
    // 해당 날짜의 셀을 찾기 (월과 일을 모두 고려)
    const dateElements = document.querySelectorAll('.sales-calendar-day');
    let targetElement = null;
    
    dateElements.forEach(element => {
        const dateNumber = element.querySelector('.date-number');
        if (dateNumber) {
            const dayNumber = parseInt(dateNumber.textContent);
            const month = salesCurrentDate.getMonth();
            const year = salesCurrentDate.getFullYear();
            
            // 해당 셀이 현재 표시된 월의 날짜인지 확인
            const cellDate = new Date(year, month, dayNumber);
            const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            if (cellDate.getTime() === targetDate.getTime()) {
                targetElement = element;
            }
        }
    });
    
    if (targetElement) {
        // 이미 선택된 날짜인지 확인
        if (targetElement.classList.contains('selected')) {
            // 선택 해제
            targetElement.classList.remove('selected');
            salesSelectedDates = salesSelectedDates.filter(d => d !== dateString);
            
            // 마지막 선택된 날짜가 해제된 날짜인 경우, 남은 날짜 중 마지막 것을 선택
            if (lastSelectedDate === dateString) {
                lastSelectedDate = salesSelectedDates.length > 0 ? salesSelectedDates[salesSelectedDates.length - 1] : null;
            }
            
            console.log('날짜 선택 해제:', dateString);
        } else {
            // 선택 추가
            targetElement.classList.add('selected');
            salesSelectedDates.push(dateString);
            lastSelectedDate = dateString; // 마지막 선택된 날짜 업데이트
            console.log('날짜 선택:', dateString);
        }
    }
    
    console.log('현재 선택된 날짜들:', salesSelectedDates);
    
    // 플로팅 UI 업데이트
    updateFloatingSelectionUI();
}

// 플로팅 선택 UI 업데이트
function updateFloatingSelectionUI() {
    const floatingUI = document.getElementById('floating-selection-ui');
    const selectedCount = document.getElementById('selected-count');
    
    if (salesSelectedDates.length === 0) {
        floatingUI.style.display = 'none';
        return;
    }
    
    selectedCount.textContent = `${salesSelectedDates.length}개 선택됨`;
    floatingUI.style.display = 'flex';
}

// 플로팅 UI 숨기기
function hideSelectionUI() {
    document.getElementById('floating-selection-ui').style.display = 'none';
}

// 모든 선택 취소
function clearAllSelections() {
    salesSelectedDates = [];
    lastSelectedDate = null; // 마지막 선택된 날짜 초기화
    
    // 모든 selected 클래스 제거
    document.querySelectorAll('.sales-calendar-day').forEach(element => {
        element.classList.remove('selected');
    });
    
    // 모든 체크박스 해제
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // 플로팅 UI 숨기기
    hideSelectionUI();
    
    console.log('모든 선택이 취소되었습니다.');
}

// 판매 설정 열기
async function openSalesSettings() {
    const modal = document.getElementById('sales-modal');
    
    // 모달 표시
    modal.style.display = 'flex';
    
    // 상단 정보 업데이트
    const formattedDates = salesSelectedDates.sort().map(dateString => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }).join(', ');
    
    document.getElementById('selected-dates-info').textContent = `선택한 날짜: ${formattedDates} (총 ${salesSelectedDates.length}개)`;
    document.getElementById('current-room-type').textContent = `현재 모드: ${salesCurrentRoomType === 'daily' ? '대실' : '숙박'}`;
    
    // 헤더 업데이트
    const detailsHeader = document.getElementById('details-header');
    if (salesCurrentRoomType === 'daily') {
        // 대실 모드일 때 헤더를 두 개로 나누기
        detailsHeader.className = 'split-header';
        detailsHeader.innerHTML = `
            <div>개시/마감 시각</div>
            <div>이용시간</div>
        `;
    } else {
        detailsHeader.className = '';
        detailsHeader.textContent = '입실/퇴실 시각';
    }
    
    // 폼 생성 (비동기 함수이므로 await 사용)
    await generateSalesForm();
    
    // DOM이 업데이트된 후 초기값을 저장 (변경 전 값)
    setTimeout(() => {
        const initialValues = {};
        const roomIds = Object.keys(roomData);
        
        roomIds.forEach(roomId => {
            const priceInput = document.querySelector(`.price-input[data-room-id="${roomId}"]`);
            const statusBtn = document.querySelector(`[onclick="changeSalesStatus('${roomId}', '판매')"]`);
            
            // 초기 상태 (판매 버튼이 active면 1, 아니면 0)
            const initialStatus = statusBtn.classList.contains('active') ? 1 : 0;
            
            // 초기 가격
            const initialPrice = parseInt(priceInput.value);
            
            // 초기 시간 정보
            let initialDetails, initialUsageTime;
            
            if (salesCurrentRoomType === 'daily') {
                const openHour = parseInt(document.querySelector(`#sales-open-hour-${roomId} .dropdown-display`)?.textContent || '14');
                const closeHour = parseInt(document.querySelector(`#sales-close-hour-${roomId} .dropdown-display`)?.textContent || '22');
                const usageHours = document.querySelector(`#sales-usage-hour-${roomId} .dropdown-display`)?.textContent || '5';
                
                initialDetails = [openHour, closeHour];
                initialUsageTime = `${usageHours}시간`;
            } else {
                const checkInHour = parseInt(document.querySelector(`#sales-checkin-hour-${roomId} .dropdown-display`)?.textContent || '16');
                const checkOutHour = parseInt(document.querySelector(`#sales-checkout-hour-${roomId} .dropdown-display`)?.textContent || '13');
                
                initialDetails = [checkInHour, checkOutHour];
                initialUsageTime = '';
            }
            
            initialValues[roomId] = {
                status: initialStatus,
                price: initialPrice,
                details: initialDetails,
                usage_time: initialUsageTime
            };
            
            console.log(`[모달 열릴 때 초기값 저장] ${roomId}:`, initialValues[roomId]);
        });
        
        // 전역 변수에 초기값 저장
        window.salesInitialValues = initialValues;
    }, 0);
    
    console.log('판매 설정 모달이 열렸습니다.');
}

// 판매 설정 폼 생성
async function generateSalesForm() {
    const formRows = document.getElementById('form-rows');
    const roomIds = Object.keys(roomData);
    
    if (roomIds.length === 0) {
        formRows.innerHTML = '<div class="form-row"><div colspan="4" style="text-align: center; padding: 40px;">등록된 객실이 없습니다.</div></div>';
        return;
    }
    
    // 선택된 날짜들의 기존 요금 정보 불러오기 (캘린더와 동일한 로직 사용)
    let existingPrices = {};
    if (salesSelectedDates.length > 0 && lastSelectedDate) {
            // 캘린더와 동일하게 dailyPricesCache에서 데이터 가져오기
    const roomIds = Object.keys(roomData);
    roomIds.forEach(roomId => {
        const dailyPriceKey = `${lastSelectedDate}_${roomId}_${salesCurrentRoomType}`;
        const dailyPrice = dailyPricesCache[dailyPriceKey];
        
        if (dailyPrice) {
            existingPrices[roomId] = dailyPrice;
        }
        
        console.log(`[generateSalesForm] 캐시 확인 ${roomId}:`, {
            dailyPriceKey: dailyPriceKey,
            dailyPrice: dailyPrice ? '있음' : '없음',
            cacheData: dailyPrice
        });
    });
    
    console.log('캘린더 캐시에서 기존 요금 정보 로드:', lastSelectedDate, existingPrices);
    }
    
    const formHTML = roomIds.map(roomId => {
        const room = roomData[roomId];
        
        // 기존 요금 정보가 있으면 사용, 없으면 기본값 사용
        const existingPrice = existingPrices[roomId];
        
        // 선택된 날짜의 요일을 기준으로 기본값 결정
        const lastDate = lastSelectedDate ? new Date(lastSelectedDate) : new Date(salesSelectedDates[salesSelectedDates.length - 1]);
        const dayOfWeek = lastDate.getDay(); // 0: 일요일, 1: 월요일, ...
        
        // 캘린더에서 사용하는 값과 동일하게 계산
        let currentStatus, currentPrice, currentDetails, currentUsageTime;
        
        if (existingPrice) {
            // 캘린더와 동일한 로직: daily_prices 데이터 사용
            // status를 숫자로 정규화 (0: 마감, 1: 판매)
            if (typeof existingPrice.status === 'number') {
                currentStatus = existingPrice.status;
            } else if (typeof existingPrice.status === 'string') {
                currentStatus = existingPrice.status === '판매' ? 1 : 0;
            } else {
                currentStatus = 1; // 기본값
            }
            currentPrice = existingPrice.price !== undefined ? existingPrice.price : 0;
            currentDetails = existingPrice.details || '';
            currentUsageTime = existingPrice.usage_time !== undefined ? existingPrice.usage_time : '';
        } else {
            // 캘린더와 동일한 로직: rooms 기본값 사용
            if (salesCurrentRoomType === 'daily') {
                const actualStatus = room.data.rentalStatus[dayOfWeek];
                currentStatus = actualStatus !== undefined ? actualStatus : 1;
                const rentalPriceValue = room.data.rentalPrice[dayOfWeek] !== undefined ? room.data.rentalPrice[dayOfWeek] : 30000;
                currentPrice = rentalPriceValue;
                const timeTuple = room.data.openClose[dayOfWeek] || [14, 22];
                currentDetails = Array.isArray(timeTuple) ? timeTuple : timeTuple;
                const usageTimeValue = room.data.usageTime[dayOfWeek] !== undefined ? room.data.usageTime[dayOfWeek] : 5;
                currentUsageTime = usageTimeValue;
            } else {
                const actualStatus = room.data.status[dayOfWeek];
                currentStatus = actualStatus !== undefined ? actualStatus : 1;
                const priceValue = room.data.price[dayOfWeek] !== undefined ? room.data.price[dayOfWeek] : 50000;
                currentPrice = priceValue;
                const timeTuple = room.data.checkInOut[dayOfWeek] || [16, 13];
                currentDetails = Array.isArray(timeTuple) ? timeTuple : timeTuple;
                currentUsageTime = '';
            }
        }
        
        // 로그 출력 - 캘린더와 비교용
        console.log(`[모달 열릴 때] ${roomId} ${salesCurrentRoomType}:`, {
            existingPrice: existingPrice ? '있음' : '없음',
            dayOfWeek: dayOfWeek,
            currentStatus: currentStatus,
            currentPrice: currentPrice,
            currentDetails: currentDetails,
            currentUsageTime: currentUsageTime,
            roomDataStatus: salesCurrentRoomType === 'daily' ? room.data.rentalStatus[dayOfWeek] : room.data.status[dayOfWeek],
            roomDataPrice: salesCurrentRoomType === 'daily' ? room.data.rentalPrice[dayOfWeek] : room.data.price[dayOfWeek],
            roomDataTime: salesCurrentRoomType === 'daily' ? room.data.openClose[dayOfWeek] : room.data.checkInOut[dayOfWeek]
        });
        
        if (salesCurrentRoomType === 'daily') {
            // 정수 튜플 배열에서 시간 추출
            let openHour, closeHour;
            if (Array.isArray(currentDetails) && currentDetails.length === 2) {
                [openHour, closeHour] = currentDetails;
            } else if (typeof currentDetails === 'string' && currentDetails.includes('~')) {
                const [open, close] = currentDetails.split('~');
                openHour = parseTimeDisplay(open).split(':')[0];
                closeHour = parseTimeDisplay(close).split(':')[0];
            } else {
                openHour = '14';
                closeHour = '22';
            }
            const usageHours = typeof currentUsageTime === 'string' ? currentUsageTime.replace('시간', '') : currentUsageTime.toString();
            
            return `
                <div class="form-row">
                    <div class="room-name">${room.name}</div>
                    <div>
                        <div class="status-buttons">
                            <button class="status-btn ${currentStatus === 1 ? 'active' : ''}" onclick="changeSalesStatus('${roomId}', '판매')">판매</button>
                            <button class="status-btn ${currentStatus === 0 ? 'active' : ''}" onclick="changeSalesStatus('${roomId}', '마감')">마감</button>
                        </div>
                    </div>
                    <div>
                        <div class="price-input-container">
                            <input type="number" class="price-input" data-room-id="${roomId}" value="${currentPrice}" placeholder="가격" min="0" max="99999999" maxlength="8" onchange="updateSalesPrice('${roomId}', this.value)">
                            <span class="price-unit" data-room-id="${roomId}">원</span>
                        </div>
                    </div>
                    <div class="split-cell">
                        <div>
                            <div class="time-inputs">
                                <div class="custom-dropdown" id="sales-open-hour-${roomId}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${openHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${openHour}')">
                                    <div class="dropdown-display">${openHour}</div>
                                    <div class="dropdown-options" style="display: none;"></div>
                                </div>
                                <span class="time-separator">시~</span>
                                <div class="custom-dropdown" id="sales-close-hour-${roomId}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${closeHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${closeHour}')">
                                    <div class="dropdown-display">${closeHour}</div>
                                    <div class="dropdown-options" style="display: none;"></div>
                                </div>
                                <span class="time-separator">시</span>
                            </div>
                        </div>
                        <div>
                            <div class="time-inputs" style="justify-content:center;align-items:center;gap:2px;">
                                <div class="custom-dropdown" id="sales-usage-hour-${roomId}" onmouseenter="showDropdown(this, 'usage', 2, 12, '${usageHours}', 1)" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${usageHours}')">
                                    <div class="dropdown-display">${usageHours}</div>
                                    <div class="dropdown-options" style="display: none;"></div>
                                </div>
                                <span style="font-size:0.75rem;">시간</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 정수 튜플 배열에서 시간 추출
            let checkInHour, checkOutHour;
            if (Array.isArray(currentDetails) && currentDetails.length === 2) {
                [checkInHour, checkOutHour] = currentDetails;
            } else if (typeof currentDetails === 'string' && currentDetails.includes('~')) {
                const [checkIn, checkOut] = currentDetails.split('~');
                checkInHour = parseTimeDisplay(checkIn).split(':')[0];
                checkOutHour = parseTimeDisplay(checkOut).split(':')[0];
            } else {
                checkInHour = '16';
                checkOutHour = '13';
            }
            
            return `
                <div class="form-row">
                    <div class="room-name">${room.name}</div>
                    <div>
                        <div class="status-buttons">
                            <button class="status-btn ${currentStatus === 1 ? 'active' : ''}" onclick="changeSalesStatus('${roomId}', '판매')">판매</button>
                            <button class="status-btn ${currentStatus === 0 ? 'active' : ''}" onclick="changeSalesStatus('${roomId}', '마감')">마감</button>
                        </div>
                    </div>
                    <div>
                        <div class="price-input-container">
                            <input type="number" class="price-input" data-room-id="${roomId}" value="${currentPrice}" placeholder="가격" min="0" max="99999999" maxlength="8" onchange="updateSalesPrice('${roomId}', this.value)">
                            <span class="price-unit" data-room-id="${roomId}">원</span>
                        </div>
                    </div>
                    <div>
                        <div class="time-inputs">
                            <div class="custom-dropdown" id="sales-checkin-hour-${roomId}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${checkInHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkInHour}')">
                                <div class="dropdown-display">${checkInHour}</div>
                                <div class="dropdown-options" style="display: none;"></div>
                            </div>
                            <span class="time-separator">시~</span>
                            <div class="custom-dropdown" id="sales-checkout-hour-${roomId}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${checkOutHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkOutHour}')">
                                <div class="dropdown-display">${checkOutHour}</div>
                                <div class="dropdown-options" style="display: none;"></div>
                            </div>
                            <span class="time-separator">시</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    formRows.innerHTML = formHTML;
}

// 판매 설정 상태 변경
function changeSalesStatus(roomId, status) {
    const buttons = document.querySelectorAll(`[onclick*="changeSalesStatus('${roomId}"]`);
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 임시 데이터 저장 (문자열을 boolean으로 변환)
    if (!window.salesTempData) window.salesTempData = {};
    if (!window.salesTempData[roomId]) window.salesTempData[roomId] = {};
    window.salesTempData[roomId].status = status === '판매' ? 1 : 0;
}

// 판매 설정 가격 변경
function updateSalesPrice(roomId, price) {
    if (!window.salesTempData) window.salesTempData = {};
    if (!window.salesTempData[roomId]) window.salesTempData[roomId] = {};
    window.salesTempData[roomId].price = parseInt(price);
    
    // 입력 필드 값도 업데이트
    const priceInput = document.querySelector(`.price-input[data-room-id="${roomId}"]`);
    if (priceInput) {
        priceInput.value = price;
    }
}

// 판매 설정 시간 변경 (커스텀 드롭다운용)
function updateSalesTime(roomId, type) {
    if (!window.salesTempData) window.salesTempData = {};
    if (!window.salesTempData[roomId]) window.salesTempData[roomId] = {};
    
    let timeString = '';
    
    if (salesCurrentRoomType === 'daily') {
        // 대실: 개시/마감 시각
        const openHour = parseInt(document.querySelector(`#sales-open-hour-${roomId} .dropdown-display`)?.textContent || '14');
        const closeHour = parseInt(document.querySelector(`#sales-close-hour-${roomId} .dropdown-display`)?.textContent || '22');
        
        timeString = [openHour, closeHour];
    } else {
        // 숙박: 입실/퇴실 시각
        const checkInHour = parseInt(document.querySelector(`#sales-checkin-hour-${roomId} .dropdown-display`)?.textContent || '16');
        const checkOutHour = parseInt(document.querySelector(`#sales-checkout-hour-${roomId} .dropdown-display`)?.textContent || '13');
        
        timeString = [checkInHour, checkOutHour];
    }
    
    window.salesTempData[roomId].details = timeString;
}

// 판매 설정 이용시간 변경 (커스텀 드롭다운용)
function updateSalesUsageTime(roomId, usageTime) {
    if (!window.salesTempData) window.salesTempData = {};
    if (!window.salesTempData[roomId]) window.salesTempData[roomId] = {};
    
    // 커스텀 드롭다운에서 시간 값 가져오기
    const usageHours = document.querySelector(`#sales-usage-hour-${roomId} .dropdown-display`)?.textContent || '5';
    window.salesTempData[roomId].usageTime = `${usageHours}시간`;
}

// 판매 설정 저장 (HTML에서 호출되는 래퍼 함수)
function saveSalesSettings() {
    saveSalesSettingsAsync().catch(error => {
        console.error('판매 설정 저장 중 오류 발생:', error);
        alert('판매 설정 저장 중 오류가 발생했습니다.');
    });
}

// 판매 설정 저장 (실제 비동기 처리)
async function saveSalesSettingsAsync() {
    const formData = {};
    const roomIds = Object.keys(roomData);
    
    // 폼 데이터 수집 (임시 데이터 우선, 없으면 현재 값 사용)
    roomIds.forEach(roomId => {
        const tempData = window.salesTempData && window.salesTempData[roomId] ? window.salesTempData[roomId] : {};
        const priceInput = document.querySelector(`.price-input[data-room-id="${roomId}"]`);
        
        // 커스텀 드롭다운에서 최신 값 가져오기
        let details = tempData.details || '';
        let usageTime = tempData.usageTime || '';
        
        if (salesCurrentRoomType === 'daily') {
            // 대실: 개시/마감 시각과 이용시간
            const openHour = parseInt(document.querySelector(`#sales-open-hour-${roomId} .dropdown-display`)?.textContent || '14');
            const closeHour = parseInt(document.querySelector(`#sales-close-hour-${roomId} .dropdown-display`)?.textContent || '22');
            const usageHours = document.querySelector(`#sales-usage-hour-${roomId} .dropdown-display`)?.textContent || '5';
            
            details = [openHour, closeHour];
            usageTime = `${usageHours}시간`;
        } else {
            // 숙박: 입실/퇴실 시각
            const checkInHour = parseInt(document.querySelector(`#sales-checkin-hour-${roomId} .dropdown-display`)?.textContent || '16');
            const checkOutHour = parseInt(document.querySelector(`#sales-checkout-hour-${roomId} .dropdown-display`)?.textContent || '13');
            
            details = [checkInHour, checkOutHour];
        }
        
        // 현재 활성화된 버튼에서 상태 가져오기
        const statusBtn = document.querySelector(`[onclick="changeSalesStatus('${roomId}', '판매')"]`);
        const currentStatus = statusBtn.classList.contains('active') ? 1 : 0;
        
        formData[roomId] = {
            status: tempData.status !== undefined ? tempData.status : currentStatus,
            price: tempData.price || parseInt(priceInput.value),
            details: details,
            usage_time: usageTime
        };
    });
    
    // 모달 열릴 때 저장해둔 초기값 사용
    const initialValues = window.salesInitialValues || {};
    

    
    // 변경사항이 있으면 저장
    try {
        let changedRooms;
        
        // 여러 날짜가 선택된 경우 변경사항 체크 건너뛰기
        if (salesSelectedDates.length > 1) {
            changedRooms = roomIds; // 모든 객실을 변경된 것으로 처리
        } else {
            // 단일 날짜인 경우에만 변경사항 체크
            changedRooms = roomIds.filter(roomId => {
                const formDataItem = formData[roomId];
                const initialItem = initialValues[roomId];
                
                const statusDiff = formDataItem.status !== initialItem.status;
                const priceDiff = formDataItem.price !== initialItem.price;
                const detailsDiff = JSON.stringify(formDataItem.details) !== JSON.stringify(initialItem.details);
                const usageTimeDiff = formDataItem.usage_time !== initialItem.usage_time;
                
                return statusDiff || priceDiff || detailsDiff || usageTimeDiff;
            });
            
            if (changedRooms.length === 0) {
                alert('수정사항이 없습니다.');
                closeSalesModal();
                return;
            }
        }
        
        // 모든 선택된 날짜에 변경사항이 있는 객실만 저장
        const allSavePromises = [];
        
        salesSelectedDates.forEach(date => {
            changedRooms.forEach(roomId => {
                const roomData = formData[roomId];
                        allSavePromises.push(
            fetch('/api/admin/daily-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: date,
                    room_id: roomId,
                    room_type: salesCurrentRoomType,
                    price: roomData.price,
                    status: roomData.status,
                    details: roomData.details,
                    usage_time: roomData.usage_time
                })
            }).then(res => res.json())
        );
            });
        });
        
        const results = await Promise.all(allSavePromises);
        const successCount = results.filter(result => result.success).length;
        const totalExpected = salesSelectedDates.length * changedRooms.length;
        
        if (successCount === totalExpected) {
            alert(`판매 설정이 저장되었습니다. (${salesSelectedDates.length}개 날짜, ${changedRooms.length}개 객실)`);
        } else {
            alert(`저장 중 오류가 발생했습니다. (${successCount}/${totalExpected} 성공)`);
        }
    } catch (error) {
        console.error('저장 실패:', error);
        alert('판매 설정 저장 중 오류가 발생했습니다.');
        return;
    }
    
    // 캘린더 다시 렌더링
    await renderSalesCalendar();
    
    // 모달 닫기
    closeSalesModal();
    

}

// 판매 설정 모달 닫기
function closeSalesModal() {
    document.getElementById('sales-modal').style.display = 'none';
    
    // 임시 데이터 초기화
    window.salesTempData = {};
    window.salesInitialValues = {};
    
    console.log('판매 설정 모달이 닫혔습니다.');
}

// 판매 캘린더 이전 월 (HTML에서 호출되는 래퍼 함수)
function previousSalesMonth() {
    previousSalesMonthAsync().catch(error => {
        console.error('이전 월 이동 중 오류 발생:', error);
    });
}

// 판매 캘린더 이전 월 (실제 비동기 처리)
async function previousSalesMonthAsync() {
    const currentYear = salesCurrentDate.getFullYear();
    const currentMonth = salesCurrentDate.getMonth();
    
    // 이전 월 계산
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 이전 월이 오늘의 월보다 이전이면 이동하지 않음 (같은 월은 허용)
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (previousMonth < todayMonth) {
        console.log('과거 월로는 이동할 수 없습니다.');
        return;
    }
    
    salesCurrentDate.setMonth(currentMonth - 1);
    await renderSalesCalendar();
    updateMonthNavigationButtons();
}

// 월 이동 버튼 상태 업데이트
function updateMonthNavigationButtons() {
    const prevButton = document.querySelector('#panel-sales .calendar-controls button:first-child');
    const nextButton = document.querySelector('#panel-sales .calendar-controls button:last-child');
    
    const currentYear = salesCurrentDate.getFullYear();
    const currentMonth = salesCurrentDate.getMonth();
    
    // 이전 월 계산
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 이전 월 버튼 상태 설정
    if (previousMonth < todayMonth) {
        // 과거 월로 이동 불가능
        prevButton.style.backgroundColor = '#9ca3af';
        prevButton.style.cursor = 'not-allowed';
        prevButton.title = '과거 월로는 이동할 수 없습니다';
    } else {
        // 정상 상태
        prevButton.style.backgroundColor = '#3b82f6';
        prevButton.style.cursor = 'pointer';
        prevButton.title = '이전 월';
    }
    
    // 다음 월 버튼은 항상 활성화
    nextButton.style.backgroundColor = '#3b82f6';
    nextButton.style.cursor = 'pointer';
    nextButton.title = '다음 월';
}

// 판매 캘린더 다음 월 (HTML에서 호출되는 래퍼 함수)
function nextSalesMonth() {
    nextSalesMonthAsync().catch(error => {
        console.error('다음 월 이동 중 오류 발생:', error);
    });
}

// 판매 캘린더 다음 월 (실제 비동기 처리)
async function nextSalesMonthAsync() {
    salesCurrentDate.setMonth(salesCurrentDate.getMonth() + 1);
    await renderSalesCalendar();
    updateMonthNavigationButtons();
}

// 판매 캘린더 대실/숙박 전환 함수 (HTML에서 호출되는 래퍼 함수)
function switchSalesRoomType(type) {
    switchSalesRoomTypeAsync(type).catch(error => {
        console.error('객실 타입 변경 중 오류 발생:', error);
    });
}

// 판매 캘린더 대실/숙박 전환 함수 (실제 비동기 처리)
async function switchSalesRoomTypeAsync(type) {
    salesCurrentRoomType = type;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('#panel-sales .room-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#panel-sales [onclick="switchSalesRoomType('${type}')"]`).classList.add('active');
    
    // 캘린더 다시 렌더링
    await renderSalesCalendar();
    
    console.log('판매 캘린더 타입 변경:', type);
}

// 전체 날짜 선택/해제
function toggleAllDates(checkbox) {
    if (checkbox.checked) {
        // 선택할 수 있는 날짜가 있는지 먼저 확인
        const allDateElements = document.querySelectorAll('.sales-calendar-day:not(.checkbox-column)');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let hasSelectableDates = false;
        allDateElements.forEach(element => {
            if (element.style.visibility !== 'hidden') {
                const dateString = element.querySelector('.date-number')?.textContent;
                if (dateString) {
                    const currentDate = new Date(salesCurrentDate.getFullYear(), salesCurrentDate.getMonth(), parseInt(dateString));
                    if (currentDate >= today) {
                        hasSelectableDates = true;
                    }
                }
            }
        });
        
        // 선택할 수 있는 날짜가 없으면 체크박스를 체크하지 않음
        if (!hasSelectableDates) {
            checkbox.checked = false;
            console.log('선택할 수 있는 날짜가 없습니다.');
            return;
        }
        
        // 좌측 체크박스들 체크
        const dateCheckboxes = document.querySelectorAll('.date-checkbox');
        dateCheckboxes.forEach(cb => {
            cb.checked = true;
        });
        
        // 요일 체크박스들도 체크
        const weekdayCheckboxes = document.querySelectorAll('.weekday-cell input[type="checkbox"]');
        weekdayCheckboxes.forEach(cb => {
            cb.checked = true;
        });
        
        // 모든 날짜 선택 (과거 날짜 제외)
        allDateElements.forEach(element => {
            if (element.style.visibility !== 'hidden') {
                const dateString = element.querySelector('.date-number')?.textContent;
                if (dateString) {
                    const currentDate = new Date(salesCurrentDate.getFullYear(), salesCurrentDate.getMonth(), parseInt(dateString));
                    
                    // 과거 날짜는 선택하지 않음
                    if (currentDate >= today) {
                        element.classList.add('selected');
                        const formattedDate = formatDate(currentDate);
                        if (!salesSelectedDates.includes(formattedDate)) {
                            salesSelectedDates.push(formattedDate);
                        }
                    }
                }
            }
        });
    } else {
        // 모든 날짜 선택 해제
        const dateCheckboxes = document.querySelectorAll('.date-checkbox');
        dateCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        const weekdayCheckboxes = document.querySelectorAll('.weekday-cell input[type="checkbox"]');
        weekdayCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        document.querySelectorAll('.sales-calendar-day').forEach(element => {
            element.classList.remove('selected');
        });
        salesSelectedDates = [];
    }
    
    console.log('전체 날짜 선택:', checkbox.checked, '선택된 날짜들:', salesSelectedDates);
    
    // 플로팅 UI 업데이트
    updateFloatingSelectionUI();
}

// 개별 날짜 선택/해제 (해당 행 전체 선택)
function toggleDateSelection(checkbox) {
    const dateString = checkbox.dataset.date;
    const date = new Date(dateString);
    
    // 해당 행(주)의 모든 날짜 찾기
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // 해당 주의 일요일로 설정
    
    if (checkbox.checked) {
        // 해당 주에 선택할 수 있는 날짜가 있는지 먼저 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let hasSelectableDates = false;
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(weekStart);
            weekDate.setDate(weekStart.getDate() + i);
            
            if (weekDate.getMonth() === salesCurrentDate.getMonth() && weekDate >= today) {
                hasSelectableDates = true;
                break;
            }
        }
        
        // 선택할 수 있는 날짜가 없으면 체크박스를 체크하지 않음
        if (!hasSelectableDates) {
            checkbox.checked = false;
            console.log('해당 주에 선택할 수 있는 날짜가 없습니다.');
            return;
        }
        
        // 해당 행(주)의 모든 날짜 선택 (과거 날짜 제외)
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(weekStart);
            weekDate.setDate(weekStart.getDate() + i);
            
            // 현재 월의 날짜이고 과거가 아닌 경우에만 선택
            if (weekDate.getMonth() === salesCurrentDate.getMonth() && weekDate >= today) {
                const formattedDate = formatDate(weekDate);
                if (!salesSelectedDates.includes(formattedDate)) {
                    salesSelectedDates.push(formattedDate);
                }
                
                // 해당 날짜 셀에 selected 클래스 추가
                const dateElements = document.querySelectorAll('.sales-calendar-day');
                dateElements.forEach(element => {
                    const dateNumber = element.querySelector('.date-number');
                    if (dateNumber && dateNumber.textContent == weekDate.getDate()) {
                        element.classList.add('selected');
                    }
                });
            }
        }
    } else {
        // 해당 행(주)의 모든 날짜 선택 해제
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(weekStart);
            weekDate.setDate(weekStart.getDate() + i);
            
            // 현재 월의 날짜인 경우에만 해제
            if (weekDate.getMonth() === salesCurrentDate.getMonth()) {
                const formattedDate = formatDate(weekDate);
                salesSelectedDates = salesSelectedDates.filter(d => d !== formattedDate);
                
                // 해당 날짜 셀에서 selected 클래스 제거
                const dateElements = document.querySelectorAll('.sales-calendar-day');
                dateElements.forEach(element => {
                    const dateNumber = element.querySelector('.date-number');
                    if (dateNumber && dateNumber.textContent == weekDate.getDate()) {
                        element.classList.remove('selected');
                    }
                });
            }
        }
    }
    
    console.log('행 선택:', dateString, checkbox.checked, '선택된 날짜들:', salesSelectedDates);
    
    // 플로팅 UI 업데이트
    updateFloatingSelectionUI();
}

// 특정 날짜의 객실 데이터 생성
function generateRoomDataForDate(date) {
    const dateString = formatDate(date);
    const dayOfWeek = date.getDay(); // 0: 일요일, 1: 월요일, ...
    const roomIds = Object.keys(roomData);
    
    if (roomIds.length === 0) return '';
    
    let roomDataHTML = '';
    
    roomIds.forEach(roomId => {
        const room = roomData[roomId];
        let status, price, time, usageTime;
        
        // daily_prices 테이블에서 해당 날짜의 데이터 확인
        const dailyPriceKey = `${dateString}_${roomId}_${salesCurrentRoomType}`;
        const dailyPrice = dailyPricesCache[dailyPriceKey];
        
        console.log(`[generateRoomDataForDate] ${dateString} ${roomId} ${salesCurrentRoomType}:`, {
            dailyPriceKey,
            dailyPrice: dailyPrice ? {
                status: dailyPrice.status,
                statusType: typeof dailyPrice.status,
                price: dailyPrice.price,
                details: dailyPrice.details,
                usage_time: dailyPrice.usage_time
            } : 'null',
            roomDataStatus: salesCurrentRoomType === 'daily' ? 
                room.data.rentalStatus[dayOfWeek] : 
                room.data.status[dayOfWeek],
            roomDataPrice: salesCurrentRoomType === 'daily' ? 
                room.data.rentalPrice[dayOfWeek] : 
                room.data.price[dayOfWeek],
            roomDataTime: salesCurrentRoomType === 'daily' ? 
                room.data.openClose[dayOfWeek] : 
                room.data.checkInOut[dayOfWeek],
            roomDataUsageTime: salesCurrentRoomType === 'daily' ? 
                room.data.usageTime[dayOfWeek] : 
                'N/A'
        });
        
        if (dailyPrice) {
            // daily_prices 테이블에 데이터가 있으면 사용
            status = getStatusText(dailyPrice.status);
            const dailyPriceValue = dailyPrice.price !== undefined ? dailyPrice.price : 0;
            price = dailyPriceValue + '원';
            
            // details를 시간 형식으로 변환
            let timeDisplay = '';
            if (dailyPrice.details) {
                try {
                    // JSON 문자열인 경우 파싱
                    const details = typeof dailyPrice.details === 'string' ? 
                        JSON.parse(dailyPrice.details) : dailyPrice.details;
                    
                    if (Array.isArray(details) && details.length >= 2) {
                        timeDisplay = `${details[0]}시~${details[1]}시`;
                    } else {
                        timeDisplay = dailyPrice.details;
                    }
                } catch (error) {
                    timeDisplay = dailyPrice.details;
                }
            }
            time = timeDisplay;
            
            const dailyUsageTime = dailyPrice.usage_time !== undefined ? dailyPrice.usage_time : '';
            usageTime = dailyUsageTime;
            
            console.log(`[generateRoomDataForDate] daily_prices 사용:`, {
                status: `${dailyPrice.status} → ${status}`,
                price: `${dailyPrice.price} → ${price}`,
                time: `${dailyPrice.details} → ${time}`,
                usageTime: `${dailyPrice.usage_time} → ${usageTime}`
            });
        } else {
            // 없으면 기존 rooms 테이블의 기본값 사용
            if (salesCurrentRoomType === 'daily') {
                const actualStatus = room.data.rentalStatus[dayOfWeek];
                const finalStatus = actualStatus !== undefined ? actualStatus : 1;
                console.log(`[generateRoomDataForDate] 대실 모드: dayOfWeek=${dayOfWeek}, actualStatus=${actualStatus}, finalStatus=${finalStatus}`);
                status = getStatusText(finalStatus);
                const rentalPriceValue = room.data.rentalPrice[dayOfWeek] !== undefined ? room.data.rentalPrice[dayOfWeek] : 30000;
                price = rentalPriceValue + '원';
                const timeTuple = room.data.openClose[dayOfWeek] || [14, 22];
                time = Array.isArray(timeTuple) ? `${timeTuple[0]}시~${timeTuple[1]}시` : timeTuple;
                const usageTimeValue = room.data.usageTime[dayOfWeek] !== undefined ? room.data.usageTime[dayOfWeek] : 5;
                usageTime = usageTimeValue + '시간';
            } else {
                const actualStatus = room.data.status[dayOfWeek];
                const finalStatus = actualStatus !== undefined ? actualStatus : 1;
                console.log(`[generateRoomDataForDate] 숙박 모드: dayOfWeek=${dayOfWeek}, actualStatus=${actualStatus}, finalStatus=${finalStatus}`);
                status = getStatusText(finalStatus);
                const priceValue = room.data.price[dayOfWeek] !== undefined ? room.data.price[dayOfWeek] : 50000;
                price = priceValue + '원';
                const timeTuple = room.data.checkInOut[dayOfWeek] || [16, 13];
                time = Array.isArray(timeTuple) ? `${timeTuple[0]}시~${timeTuple[1]}시` : timeTuple;
                usageTime = '';
            }
            
            console.log(`[generateRoomDataForDate] rooms 기본값 사용:`, {
                mode: salesCurrentRoomType,
                dayOfWeek: dayOfWeek,
                status: `${salesCurrentRoomType === 'daily' ? room.data.rentalStatus[dayOfWeek] : room.data.status[dayOfWeek]} → ${status}`,
                price: `${salesCurrentRoomType === 'daily' ? room.data.rentalPrice[dayOfWeek] : room.data.price[dayOfWeek]} → ${price}`,
                time: `${salesCurrentRoomType === 'daily' ? room.data.openClose[dayOfWeek] : room.data.checkInOut[dayOfWeek]} → ${time}`,
                usageTime: salesCurrentRoomType === 'daily' ? `${room.data.usageTime[dayOfWeek]} → ${usageTime}` : 'N/A'
            });
        }
        
        // 상태에 따른 클래스 결정
        let statusClass = 'sale';
        if (status === '마감') statusClass = 'closed';
        else if (status === '매진') statusClass = 'soldout';
        
        roomDataHTML += `
            <div class="room-data-item">
                <span class="room-status ${statusClass}">${status}</span>
                <div class="room-name">${room.name}</div>
                <div class="room-details">${time}</div>
                ${usageTime ? `<div class="room-details">${usageTime}</div>` : ''}
                <div class="room-price">${price}</div>
            </div>
        `;
    });
    
    return roomDataHTML;
}

// 요일별 선택/해제 (해당 열의 모든 날짜 선택)
function toggleWeekday(weekday, checkbox) {
    const dayIndex = {
        'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 
        'thu': 4, 'fri': 5, 'sat': 6
    };
    
    const targetDayOfWeek = dayIndex[weekday];
    const currentMonth = salesCurrentDate.getMonth();
    const currentYear = salesCurrentDate.getFullYear();
    
    if (checkbox.checked) {
        // 해당 요일에 선택할 수 있는 날짜가 있는지 먼저 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let hasSelectableDates = false;
        for (let day = 1; day <= 31; day++) {
            const checkDate = new Date(currentYear, currentMonth, day);
            if (checkDate.getMonth() === currentMonth && checkDate.getDay() === targetDayOfWeek && checkDate >= today) {
                hasSelectableDates = true;
                break;
            }
        }
        
        // 선택할 수 있는 날짜가 없으면 체크박스를 체크하지 않음
        if (!hasSelectableDates) {
            checkbox.checked = false;
            console.log('해당 요일에 선택할 수 있는 날짜가 없습니다.');
            return;
        }
        
        // 해당 요일의 모든 날짜 선택 (과거 날짜 제외)
        for (let day = 1; day <= 31; day++) {
            const checkDate = new Date(currentYear, currentMonth, day);
            if (checkDate.getMonth() === currentMonth && checkDate.getDay() === targetDayOfWeek && checkDate >= today) {
                const formattedDate = formatDate(checkDate);
                if (!salesSelectedDates.includes(formattedDate)) {
                    salesSelectedDates.push(formattedDate);
                }
                
                // 해당 날짜 셀에 selected 클래스 추가
                const dateElements = document.querySelectorAll('.sales-calendar-day');
                dateElements.forEach(element => {
                    const dateNumber = element.querySelector('.date-number');
                    if (dateNumber && dateNumber.textContent == day) {
                        element.classList.add('selected');
                    }
                });
            }
        }
    } else {
        // 해당 요일의 모든 날짜 선택 해제
        for (let day = 1; day <= 31; day++) {
            const checkDate = new Date(currentYear, currentMonth, day);
            if (checkDate.getMonth() === currentMonth && checkDate.getDay() === targetDayOfWeek) {
                const formattedDate = formatDate(checkDate);
                salesSelectedDates = salesSelectedDates.filter(d => d !== formattedDate);
                
                // 해당 날짜 셀에서 selected 클래스 제거
                const dateElements = document.querySelectorAll('.sales-calendar-day');
                dateElements.forEach(element => {
                    const dateNumber = element.querySelector('.date-number');
                    if (dateNumber && dateNumber.textContent == day) {
                        element.classList.remove('selected');
                    }
                });
            }
        }
    }
    
    console.log('요일 선택:', weekday, checkbox.checked, '선택된 날짜들:', salesSelectedDates);
    
    // 플로팅 UI 업데이트
    updateFloatingSelectionUI();
}

