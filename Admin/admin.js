let allReservations = [];
let currentFilter = 'pending';

function fetchReservations() {
    fetch('/api/admin/reservations')
        .then(res => res.json())
        .then(data => {
            allReservations = data;
            renderTable();
        });
}



function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btns button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter-' + filter).classList.add('active');
    renderTable();
}

function renderTable() {
    const tbody = document.querySelector('#reservationTable tbody');
    let data = allReservations;
    if (currentFilter === 'pending') data = data.filter(r => !r.confirmed);
    else if (currentFilter === 'confirmed') data = data.filter(r => r.confirmed);
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="7">예약이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.username || '-'}</td>
            <td>${r.phone || '-'}</td>
            <td>${r.room || '-'}</td>
            <td>${r.start_date || ''} ~ ${r.end_date || ''}</td>
            <td>${r.confirmed ? '<span class="confirmed">확정</span>' : '<span class="pending">대기</span>'}</td>
            <td>
                <button class="btn" ${r.confirmed ? 'disabled' : ''} onclick="confirmReservation(${r.id}, this)">확정</button>
            </td>
        </tr>
    `).join('');
}

function confirmReservation(id, btn) {
    if (!confirm('이 예약을 확정하시겠습니까?')) return;
    btn.disabled = true;
    fetch('/api/admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('예약이 확정되었습니다!');
            fetchReservations();
            fetchRoomCounts();
        } else {
            alert('오류: ' + (data.error || '확정 실패'));
            btn.disabled = false;
        }
    })
    .catch(() => {
        alert('서버 오류');
        btn.disabled = false;
    });
}





// 탭 전환 함수
function switchTab(tabName) {
    // 모든 탭 버튼에서 active 클래스 제거
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 모든 패널에서 active 클래스 제거
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 선택된 탭 버튼에 active 클래스 추가
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // 선택된 패널에 active 클래스 추가
    document.getElementById(`panel-${tabName}`).classList.add('active');
}

// 초기화 및 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 초기 데이터 로드
    fetchReservations();
    
    // 객실 데이터 로드
    loadRoomsFromDB();

    // Socket.IO 클라이언트 연결 및 실시간 갱신
    const socket = io();
    socket.emit('admin'); // 'admin' 방에 join
    socket.on('reservation-updated', () => {
        fetchReservations();
    });
}); 

// 객실 관리 함수들
// 기존 addRoom 함수 대체
function addRoom() {
    // 새로운 객실 ID 및 이름 생성
    const roomCount = Object.keys(roomData).length;
    const newRoomId = `room${String.fromCharCode(65 + roomCount)}`; // roomC, roomD ...
    const newRoomName = `객실 ${String.fromCharCode(65 + roomCount)}`;

    // 기본 데이터 생성 (초기값)
    roomData[newRoomId] = {
        name: newRoomName,
        data: {
            checkInOut: Array(7).fill('15:00~11:00'),
            price: Array(7).fill('0원'),
            status: Array(7).fill('판매'),
            usageTime: Array(7).fill('5시간'),
            openClose: Array(7).fill('09:00~18:00'),
            rentalPrice: Array(7).fill('0원'),
            rentalStatus: Array(7).fill('판매')
        }
    };

    // UI 업데이트
    renderRoomButtons();
    renderRoomList();

    // 새 객실로 전환
    switchRoom(newRoomId);
    
    // DB에 새 객실 저장
    saveRoomToDB(newRoomId);
    
    // 바로 수정 모드 진입
    setTimeout(() => {
        const editBtn = document.querySelector(`[onclick="editRoom('${newRoomId}')"]`);
        if (editBtn) editBtn.click();
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
        
        // 입실/퇴실시간 행 수정
        const checkInOutCells = roomTable.querySelectorAll('tr:nth-child(1) td:not(:first-child)');
        checkInOutCells.forEach((cell, cellIndex) => {
            const currentTime = cell.textContent.trim();
            const [checkIn, checkOut] = currentTime.split('~');
            const [checkInHour, checkInMin] = checkIn.split(':');
            const [checkOutHour, checkOutMin] = checkOut.split(':');
            
            cell.innerHTML = `
                <div class="time-inputs">
                    <div class="custom-dropdown" id="checkin-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${checkInHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkInHour}')">
                        <div class="dropdown-display">${checkInHour}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                    <span class="time-separator">:</span>
                    <div class="custom-dropdown" id="checkin-min-${cellIndex}" onmouseenter="showDropdown(this, 'min', 0, 59, '${checkInMin}', 5)" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkInMin}')">
                        <div class="dropdown-display">${checkInMin}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                    <span class="time-separator">~</span>
                    <div class="custom-dropdown" id="checkout-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${checkOutHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkOutHour}')">
                        <div class="dropdown-display">${checkOutHour}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                    <span class="time-separator">:</span>
                    <div class="custom-dropdown" id="checkout-min-${cellIndex}" onmouseenter="showDropdown(this, 'min', 0, 59, '${checkOutMin}', 5)" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${checkOutMin}')">
                        <div class="dropdown-display">${checkOutMin}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                </div>
            `;
        });
        
        // 판매/마감 행의 모든 셀을 버튼으로 변경
        const saleStatusCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
        const saleStatusCells2 = roomTable.querySelectorAll('tr:nth-child(7) td:not(:first-child)');
        
        saleStatusCells.forEach((cell, index) => {
            const currentStatus = cell.textContent.trim();
            cell.innerHTML = `
                <div class="status-buttons">
                    <button class="status-btn ${currentStatus === '판매' ? 'active' : ''}" onclick="changeStatus(this, '판매')">판매</button>
                    <button class="status-btn ${currentStatus === '마감' ? 'active' : ''}" onclick="changeStatus(this, '마감')">마감</button>
                </div>
            `;
        });
        
        saleStatusCells2.forEach((cell, index) => {
            const currentStatus = cell.textContent.trim();
            cell.innerHTML = `
                <div class="status-buttons">
                    <button class="status-btn ${currentStatus === '판매' ? 'active' : ''}" onclick="changeStatus(this, '판매')">판매</button>
                    <button class="status-btn ${currentStatus === '마감' ? 'active' : ''}" onclick="changeStatus(this, '마감')">마감</button>
                </div>
            `;
        });
        
        // 개시/마감시간 행 수정
        const openCloseCells = roomTable.querySelectorAll('tr:nth-child(5) td:not(:first-child)');
        openCloseCells.forEach((cell, cellIndex) => {
            const currentTime = cell.textContent.trim();
            const [open, close] = currentTime.split('~');
            const [openHour, openMin] = open.split(':');
            const [closeHour, closeMin] = close.split(':');
            
            cell.innerHTML = `
                <div class="time-inputs">
                    <div class="custom-dropdown" id="open-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${openHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${openHour}')">
                        <div class="dropdown-display">${openHour}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                    <span class="time-separator">:</span>
                    <div class="custom-dropdown" id="open-min-${cellIndex}" onmouseenter="showDropdown(this, 'min', 0, 59, '${openMin}', 5)" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${openMin}')">
                        <div class="dropdown-display">${openMin}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                    <span class="time-separator">~</span>
                    <div class="custom-dropdown" id="close-hour-${cellIndex}" onmouseenter="showDropdown(this, 'hour', 0, 23, '${closeHour}')" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${closeHour}')">
                        <div class="dropdown-display">${closeHour}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                    <span class="time-separator">:</span>
                    <div class="custom-dropdown" id="close-min-${cellIndex}" onmouseenter="showDropdown(this, 'min', 0, 59, '${closeMin}', 5)" onmouseleave="hideDropdown(this)" onclick="toggleInputMode(this, '${closeMin}')">
                        <div class="dropdown-display">${closeMin}</div>
                        <div class="dropdown-options" style="display: none;"></div>
                    </div>
                </div>
            `;
        });
        // 이용시간 행 수정
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

        // 판매가(숙박) 행 수정
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

        // 판매가(대실) 행 수정
        const rentalPriceCells = roomTable.querySelectorAll('tr:nth-child(6) td:not(:first-child)');
        rentalPriceCells.forEach((cell, cellIndex) => {
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
        }
    };
    
    input.onblur = function() {
        display.textContent = this.value;
        this.remove();
    };
    
    // 기존 텍스트를 숨기고 input 추가
    display.textContent = '';
    display.appendChild(input);
    input.focus();
    input.select();
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
        const roomName = roomNameInput ? roomNameInput.value : (currentRoom ? roomData[currentRoom].name : '새 객실');
        roomNameElement.innerHTML = `<h3>${roomName}</h3>`;
        
        // 현재 객실 데이터 업데이트
        if (currentRoom) {
            roomData[currentRoom].name = roomName;
            
            // 객실 버튼 텍스트 즉시 업데이트
            const roomButtons = document.querySelectorAll('.room-btn');
            const buttonIndex = Object.keys(roomData).indexOf(currentRoom);
            if (roomButtons[buttonIndex]) {
                roomButtons[buttonIndex].textContent = roomName;
            }
        }
        
        // 특정 객실의 테이블을 찾기
        const roomTable = roomItem.querySelector('.room-table');
        
        // 판매/마감 상태 복원
        const statusCells = roomTable.querySelectorAll('tr:nth-child(3) td:not(:first-child)');
        statusCells.forEach((cell, cellIndex) => {
            const activeButton = cell.querySelector('.status-btn.active');
            const status = activeButton ? activeButton.textContent : '판매';
            cell.innerHTML = `<span>${status}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.status[cellIndex] = status;
            }
        });

        // 입실/퇴실시간 복원
        const checkInOutCells = roomTable.querySelectorAll('tr:nth-child(1) td:not(:first-child)');
        checkInOutCells.forEach((cell, cellIndex) => {
            const timeInputs = cell.querySelectorAll('.custom-dropdown .dropdown-display');
            const checkInHour = timeInputs[0] ? timeInputs[0].textContent : '15';
            const checkInMin = timeInputs[1] ? timeInputs[1].textContent : '00';
            const checkOutHour = timeInputs[2] ? timeInputs[2].textContent : '11';
            const checkOutMin = timeInputs[3] ? timeInputs[3].textContent : '00';
            const timeString = `${checkInHour}:${checkInMin}~${checkOutHour}:${checkOutMin}`;
            cell.innerHTML = `<span>${timeString}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.checkInOut[cellIndex] = timeString;
            }
        });

        // 판매가(숙박) 복원
        const priceCells = roomTable.querySelectorAll('tr:nth-child(2) td:not(:first-child)');
        priceCells.forEach((cell, cellIndex) => {
            const priceInput = cell.querySelector('.price-input');
            const price = priceInput ? priceInput.value : '60000';
            const priceString = `${price}원`;
            cell.innerHTML = `<span>${priceString}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.price[cellIndex] = priceString;
            }
        });

        // 이용시간 복원
        const usageCells = roomTable.querySelectorAll('tr:nth-child(4) td:not(:first-child)');
        usageCells.forEach((cell, cellIndex) => {
            const usageDisplay = cell.querySelector('.dropdown-display');
            const hours = usageDisplay ? usageDisplay.textContent : '5';
            const usageString = `${hours}시간`;
            cell.innerHTML = `<span>${usageString}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.usageTime[cellIndex] = usageString;
            }
        });

        // 개시/마감시간 복원
        const openCloseCells = roomTable.querySelectorAll('tr:nth-child(5) td:not(:first-child)');
        openCloseCells.forEach((cell, cellIndex) => {
            const timeInputs = cell.querySelectorAll('.custom-dropdown .dropdown-display');
            const openHour = timeInputs[0] ? timeInputs[0].textContent : '09';
            const openMin = timeInputs[1] ? timeInputs[1].textContent : '00';
            const closeHour = timeInputs[2] ? timeInputs[2].textContent : '18';
            const closeMin = timeInputs[3] ? timeInputs[3].textContent : '00';
            const timeString = `${openHour}:${openMin}~${closeHour}:${closeMin}`;
            cell.innerHTML = `<span>${timeString}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.openClose[cellIndex] = timeString;
            }
        });

        // 판매가(대실) 복원
        const rentalPriceCells = roomTable.querySelectorAll('tr:nth-child(6) td:not(:first-child)');
        rentalPriceCells.forEach((cell, cellIndex) => {
            const priceInput = cell.querySelector('.price-input');
            const price = priceInput ? priceInput.value : '30000';
            const priceString = `${price}원`;
            cell.innerHTML = `<span>${priceString}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.rentalPrice[cellIndex] = priceString;
            }
        });

        // 판매/마감(대실) 복원
        const rentalStatusCells = roomTable.querySelectorAll('tr:nth-child(7) td:not(:first-child)');
        rentalStatusCells.forEach((cell, cellIndex) => {
            const activeButton = cell.querySelector('.status-btn.active');
            const status = activeButton ? activeButton.textContent : '판매';
            cell.innerHTML = `<span>${status}</span>`;
            if (currentRoom) {
                roomData[currentRoom].data.rentalStatus[cellIndex] = status;
            }
        });

        // DB에 저장
        if (currentRoom) {
            saveRoomToDB(currentRoom);
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
}

function changeStatus(button, status) {
    // 같은 행의 다른 버튼들의 active 클래스 제거
    const buttons = button.parentElement.querySelectorAll('.status-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 클릭된 버튼에 active 클래스 추가
    button.classList.add('active');
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
        console.error('객실 저장 오류:', error);
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
                renderRoomButtons();
                renderRoomList();
                
                // 현재 선택된 객실이 삭제된 객실이면 첫 번째 객실로 이동
                if (currentRoom === roomId) {
                    const firstRoomId = Object.keys(roomData)[0];
                    if (firstRoomId) {
                        switchRoom(firstRoomId);
                    } else {
                        // 객실이 없으면 빈 상태로
                        currentRoom = null;
                        document.querySelector('.room-list').innerHTML = '<p>등록된 객실이 없습니다.</p>';
                    }
                }
                
                alert('객실이 삭제되었습니다.');
            } else {
                alert('객실 삭제에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('객실 삭제 오류:', error);
            alert('객실 삭제 중 오류가 발생했습니다.');
        });
    }
}

// 객실 데이터
const roomData = {};

let currentRoom = null;

// DB에서 객실 데이터 로드
function loadRoomsFromDB() {
    fetch('/api/admin/rooms')
        .then(res => res.json())
        .then(rooms => {
            // 기존 roomData 초기화
            Object.keys(roomData).forEach(key => delete roomData[key]);
            
            // DB에서 로드한 데이터로 roomData 구성
            rooms.forEach(room => {
                roomData[room.id] = {
                    name: room.name,
                    data: {
                        checkInOut: JSON.parse(room.checkInOut || '[]'),
                        price: JSON.parse(room.price || '[]'),
                        status: JSON.parse(room.status || '[]'),
                        usageTime: JSON.parse(room.usageTime || '[]'),
                        openClose: JSON.parse(room.openClose || '[]'),
                        rentalPrice: JSON.parse(room.rentalPrice || '[]'),
                        rentalStatus: JSON.parse(room.rentalStatus || '[]')
                    }
                };
            });
            
            // UI 업데이트
            renderRoomButtons();
            renderRoomList();
            
            // 첫 번째 객실이 있으면 선택
            const firstRoomId = Object.keys(roomData)[0];
            if (firstRoomId) {
                switchRoom(firstRoomId);
            } else {
                // 객실이 없으면 빈 상태로 설정
                currentRoom = null;
                const roomList = document.querySelector('.room-list');
                roomList.innerHTML = '<p>등록된 객실이 없습니다.</p>';
            }
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
function renderRoomButtons() {
    const roomButtons = document.querySelector('.room-buttons');
    roomButtons.innerHTML = '';
    
    const roomIds = Object.keys(roomData);
    
    if (roomIds.length === 0) {
        return; // 객실이 없으면 버튼도 표시하지 않음
    }
    
    roomIds.forEach(roomId => {
        const btn = document.createElement('button');
        btn.className = 'room-btn';
        btn.textContent = roomData[roomId].name;
        btn.onclick = function(e) { switchRoom(roomId); };
        roomButtons.appendChild(btn);
    });
}

// 객실 목록 렌더링
function renderRoomList() {
    const roomList = document.querySelector('.room-list');
    roomList.innerHTML = '';
    
    const roomIds = Object.keys(roomData);
    
    if (roomIds.length === 0) {
        roomList.innerHTML = '<p>등록된 객실이 없습니다.</p>';
        return;
    }
    
    roomIds.forEach(roomId => {
        const room = roomData[roomId];
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        roomItem.style.display = 'none';
        
        roomItem.innerHTML = `
            <div class="room-item-header">
                <h3>${room.name}</h3>
                <div class="room-actions">
                    <button class="btn btn-edit" onclick="editRoom('${roomId}')">수정</button>
                    <button class="btn btn-delete" onclick="deleteRoom('${roomId}')">삭제</button>
                </div>
            </div>
            <div class="room-table-container">
                <table class="room-table">
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
                        <tr><td>입실/퇴실시간</td>${room.data.checkInOut.map(v => `<td>${v}</td>`).join('')}</tr>
                        <tr><td>판매가</td>${room.data.price.map(v => `<td>${v}</td>`).join('')}</tr>
                        <tr><td>판매/마감</td>${room.data.status.map(v => `<td>${v}</td>`).join('')}</tr>
                        <tr><td>이용시간</td>${room.data.usageTime.map(v => `<td>${v}</td>`).join('')}</tr>
                        <tr><td>개시/마감시간</td>${room.data.openClose.map(v => `<td>${v}</td>`).join('')}</tr>
                        <tr><td>판매가</td>${room.data.rentalPrice.map(v => `<td>${v}</td>`).join('')}</tr>
                        <tr><td>판매/마감</td>${room.data.rentalStatus.map(v => `<td>${v}</td>`).join('')}</tr>
                    </tbody>
                </table>
            </div>
        `;
        roomList.appendChild(roomItem);
    });
}

// 객실 전환 함수
function switchRoom(roomId) {
    if (!roomData[roomId]) return;
    
    currentRoom = roomId;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.room-btn').forEach(btn => btn.classList.remove('active'));
    // 버튼 찾기
    const btns = Array.from(document.querySelectorAll('.room-btn'));
    const idx = Object.keys(roomData).indexOf(roomId);
    if (btns[idx]) btns[idx].classList.add('active');
    // room-item 표시/숨김
    const items = document.querySelectorAll('.room-item');
    items.forEach((item, i) => {
        item.style.display = (i === idx) ? '' : 'none';
    });
}

// 테이블 데이터 업데이트 함수
function updateRoomTable(roomId) {
    if (!roomData[roomId]) return;
    
    const data = roomData[roomId].data;
    
    // 입실/퇴실시간
    const checkInOutCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(1) td:not(:first-child)');
    checkInOutCells.forEach((cell, index) => {
        cell.textContent = data.checkInOut[index];
    });
    
    // 판매가
    const priceCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(2) td:not(:first-child)');
    priceCells.forEach((cell, index) => {
        cell.textContent = data.price[index];
    });
    
    // 판매/마감
    const statusCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(3) td:not(:first-child)');
    statusCells.forEach((cell, index) => {
        cell.textContent = data.status[index];
    });
    
    // 이용시간
    const usageCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(4) td:not(:first-child)');
    usageCells.forEach((cell, index) => {
        cell.textContent = data.usageTime[index];
    });
    
    // 개시/마감시간
    const openCloseCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(5) td:not(:first-child)');
    openCloseCells.forEach((cell, index) => {
        cell.textContent = data.openClose[index];
    });
    
    // 판매가(대실)
    const rentalPriceCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(6) td:not(:first-child)');
    rentalPriceCells.forEach((cell, index) => {
        cell.textContent = data.rentalPrice[index];
    });
    
    // 판매/마감(대실)
    const rentalStatusCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(7) td:not(:first-child)');
    rentalStatusCells.forEach((cell, index) => {
        cell.textContent = data.rentalStatus[index];
    });
}