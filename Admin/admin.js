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

    // Socket.IO 클라이언트 연결 및 실시간 갱신
    const socket = io();
    socket.emit('admin'); // 'admin' 방에 join
    socket.on('reservation-updated', () => {
        fetchReservations();
    });
}); 

// 객실 관리 함수들
function addRoom() {
    alert('객실 추가 기능이 준비 중입니다.');
}

function editRoom(roomId) {
    const editButton = event.target;
    
    if (editButton.textContent === '수정') {
        // 수정 모드 시작
        editButton.textContent = '저장';
        editButton.classList.add('btn-save');
        
        // 입실/퇴실시간 행 수정
        const checkInOutCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(1) td:not(:first-child)');
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
        const saleStatusCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(3) td:not(:first-child)');
        const saleStatusCells2 = document.querySelectorAll('#panel-room .room-table tr:nth-child(7) td:not(:first-child)');
        
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
        const openCloseCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(5) td:not(:first-child)');
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
        const usageTimeCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(4) td:not(:first-child)');
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
        const priceCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(2) td:not(:first-child)');
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
        const rentalPriceCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(6) td:not(:first-child)');
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

        // 수정된 데이터를 기존 UI로 복원
        // 판매/마감 상태 복원
        const statusCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(3) td:not(:first-child)');
        statusCells.forEach((cell, cellIndex) => {
            const activeButton = cell.querySelector('.status-btn.active');
            const status = activeButton ? activeButton.textContent : '판매';
            cell.innerHTML = `<span>${status}</span>`;
        });

        // 입실/퇴실시간 복원
        const checkInOutCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(1) td:not(:first-child)');
        checkInOutCells.forEach((cell, cellIndex) => {
            const timeInputs = cell.querySelectorAll('.custom-dropdown .dropdown-display');
            const checkInHour = timeInputs[0] ? timeInputs[0].textContent : '15';
            const checkInMin = timeInputs[1] ? timeInputs[1].textContent : '00';
            const checkOutHour = timeInputs[2] ? timeInputs[2].textContent : '11';
            const checkOutMin = timeInputs[3] ? timeInputs[3].textContent : '00';
            cell.innerHTML = `<span>${checkInHour}:${checkInMin}~${checkOutHour}:${checkOutMin}</span>`;
        });

        // 판매가(숙박) 복원
        const priceCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(2) td:not(:first-child)');
        priceCells.forEach((cell, cellIndex) => {
            const priceInput = cell.querySelector('.price-input');
            const price = priceInput ? priceInput.value : '60000';
            cell.innerHTML = `<span>${price}원</span>`;
        });

        // 이용시간 복원
        const usageCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(4) td:not(:first-child)');
        usageCells.forEach((cell, cellIndex) => {
            const usageDisplay = cell.querySelector('.dropdown-display');
            const hours = usageDisplay ? usageDisplay.textContent : '5';
            cell.innerHTML = `<span>${hours}시간</span>`;
        });

        // 개시/마감시간 복원
        const openCloseCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(5) td:not(:first-child)');
        openCloseCells.forEach((cell, cellIndex) => {
            const timeInputs = cell.querySelectorAll('.custom-dropdown .dropdown-display');
            const openHour = timeInputs[0] ? timeInputs[0].textContent : '09';
            const openMin = timeInputs[1] ? timeInputs[1].textContent : '00';
            const closeHour = timeInputs[2] ? timeInputs[2].textContent : '18';
            const closeMin = timeInputs[3] ? timeInputs[3].textContent : '00';
            cell.innerHTML = `<span>${openHour}:${openMin}~${closeHour}:${closeMin}</span>`;
        });

        // 판매가(대실) 복원
        const rentalPriceCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(6) td:not(:first-child)');
        rentalPriceCells.forEach((cell, cellIndex) => {
            const priceInput = cell.querySelector('.price-input');
            const price = priceInput ? priceInput.value : '30000';
            cell.innerHTML = `<span>${price}원</span>`;
        });

        // 판매/마감(대실) 복원
        const rentalStatusCells = document.querySelectorAll('#panel-room .room-table tr:nth-child(7) td:not(:first-child)');
        rentalStatusCells.forEach((cell, cellIndex) => {
            const activeButton = cell.querySelector('.status-btn.active');
            const status = activeButton ? activeButton.textContent : '판매';
            cell.innerHTML = `<span>${status}</span>`;
        });
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

function deleteRoom(roomId) {
    if (confirm('정말로 이 객실을 삭제하시겠습니까?')) {
        alert('객실 삭제 기능이 준비 중입니다.');
    }
}