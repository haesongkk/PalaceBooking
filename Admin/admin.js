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