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

function fetchRoomCounts() {
    fetch('/api/admin/roomCounts')
        .then(res => res.json())
        .then(data => {
            const el = document.getElementById('roomCounts');
            el.innerHTML = Object.entries(data).map(([room, cnt]) => `${room}: <span style='color:${cnt>0?'green':'red'}'>${cnt}</span>`).join(' &nbsp; ');
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

// 특가 상품 관리
function fetchSpecials() {
    fetch('/api/admin/specials')
        .then(res => res.json())
        .then(data => renderSpecials(data));
}

function renderSpecials(list) {
    const box = document.getElementById('specialsBox');
    if (!list.length) {
        box.innerHTML = '<div>등록된 특가 상품이 없습니다.</div>';
        return;
    }
    box.innerHTML = `<table style='width:100%;margin-top:10px;'><thead><tr><th>ID</th><th>상품명</th><th>객실 타입</th><th>가격</th><th>수량</th><th>기간</th><th>관리</th></tr></thead><tbody>
    ${list.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.roomType||''}</td>
            <td>${s.price.toLocaleString()}원</td>
            <td>${s.stock ?? ''}</td>
            <td>${s.start_date||''} ~ ${s.end_date||''}</td>
            <td>
                <button class='btn' onclick='editSpecial(${JSON.stringify(s)})'>수정</button>
                <button class='btn' style='background:#dc3545' onclick='deleteSpecial(${s.id})'>삭제</button>
            </td>
        </tr>
    `).join('')}</tbody></table>`;
}

function editSpecial(s) {
    document.getElementById('specialId').value = s.id;
    document.getElementById('specialName').value = s.name;
    document.getElementById('specialRoomType').value = s.roomType||'';
    document.getElementById('specialPrice').value = s.price;
    document.getElementById('specialStock').value = s.stock ?? '';
    document.getElementById('specialStart').value = s.start_date||'';
    document.getElementById('specialEnd').value = s.end_date||'';
}

function deleteSpecial(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    fetch(`/api/admin/specials/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => fetchSpecials());
}

function resetSpecialForm() {
    document.getElementById('specialId').value = '';
    document.getElementById('specialName').value = '';
    document.getElementById('specialRoomType').value = '';
    document.getElementById('specialPrice').value = '';
    document.getElementById('specialStock').value = '';
    document.getElementById('specialStart').value = '';
    document.getElementById('specialEnd').value = '';
}

// --- 객실 재고 관리 달력 및 재고 표시 ---
function renderStockCalendar(year, month) {
    const today = new Date();
    year = year ?? today.getFullYear();
    month = month ?? today.getMonth();
    const firstDate = new Date(year, month, 1);
    const firstDay = firstDate.getDay();
    const startDate = new Date(year, month, 1 - firstDay);
    let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    html += `<button class="btn" style="padding:2px 10px;font-size:1.1em;" onclick="changeStockMonth(-1)">◀</button>`;
    html += `<span style="font-weight:bold;font-size:1.1em;">${year}년 ${month+1}월</span>`;
    html += `<button class="btn" style="padding:2px 10px;font-size:1.1em;" onclick="changeStockMonth(1)">▶</button>`;
    html += '</div>';
    html += '<div class="calendar">';
    ["일","월","화","수","목","금","토"].forEach(d=>{html+=`<div class="calendar-day">${d}</div>`});
    for(let i=0;i<42;i++){
        const d = new Date(startDate);
        d.setDate(startDate.getDate()+i);
        const isInMonth = d.getMonth()===month;
        const isToday = d.toDateString()===today.toDateString();
        html += `<div class="calendar-cell${isToday?' today':''}${isInMonth?'':' inactive'}" onclick="selectStockDate('${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}')">${d.getDate()}</div>`;
    }
    html += '</div>';
    document.getElementById('stock-calendar').innerHTML = html;
    window._stockCalYear = year;
    window._stockCalMonth = month;
}

function changeStockMonth(offset) {
    let y = window._stockCalYear, m = window._stockCalMonth;
    m += offset;
    if(m<0){m=11;y--;}else if(m>11){m=0;y++;}
    renderStockCalendar(y,m);
}

// 날짜를 YYYY-MM-DD 포맷으로 맞추는 함수
function formatDateYMD(date) {
    if (typeof date === 'string') date = new Date(date);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function selectStockDate(dateStr) {
    // 항상 YYYY-MM-DD로 맞춤
    const normDate = formatDateYMD(dateStr);
    document.getElementById('stock-room-list').innerHTML = `<b>${normDate}</b>의 객실별 예약 수를 불러오는 중...`;
    fetch(`/api/admin/roomStock?date=${normDate}`)
      .then(res=>res.json())
      .then(data=>{
        let html = `<b>${normDate}</b>의 객실별 예약 수<br><br>`;
        html += `<table style='width:100%;max-width:400px;margin:0 auto;'><thead><tr><th>객실</th><th>예약</th><th>조정</th></tr></thead><tbody>`;
        data.forEach(r => {
          const id = encodeURIComponent(r.room_type);
          const canPlus = r.reserved < r.total;
          const canMinus = r.reserved > 0;
          html += `<tr>
            <td>${r.room_type.replace(/\(.+\)/,'')}</td>
            <td><span id="stock-val-${id}">${r.reserved}</span> / ${r.total}</td>
            <td>
              <button class='btn' style='padding:2px 10px;' onclick="changeStock('${normDate}','${r.room_type}',${Number(r.reserved)+1},this)" ${canPlus ? '' : 'disabled'}>+</button>
              <button class='btn' style='padding:2px 10px;background:#aaa;' onclick="changeStock('${normDate}','${r.room_type}',${Number(r.reserved)-1},this)" ${canMinus ? '' : 'disabled'}>-</button>
            </td>
          </tr>`;
        });
        html += `</tbody></table>`;
        document.getElementById('stock-room-list').innerHTML = html;
      });
}

function changeStock(date, room_type, newReserved, btn) {
    // 항상 YYYY-MM-DD로 맞춤
    const normDate = formatDateYMD(date);
    btn.disabled = true;
    console.log('[예약조정][요청]', { date: normDate, room_type, reserved: newReserved });
    fetch('/api/admin/roomStock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: normDate, room_type, reserved: newReserved })
    })
    .then(res=>res.json())
    .then(data=>{
      console.log('[예약조정][응답]', data);
      if(data.success) {
        selectStockDate(normDate);
      } else {
        alert('예약 수 변경 실패');
      }
      btn.disabled = false;
    })
    .catch(()=>{ alert('서버 오류'); btn.disabled = false; });
}

// 초기화 및 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 특가 상품 폼 제출 이벤트
    document.getElementById('specialForm').onsubmit = function(e) {
        e.preventDefault();
        const id = document.getElementById('specialId').value;
        const name = document.getElementById('specialName').value;
        const roomType = document.getElementById('specialRoomType').value;
        const price = document.getElementById('specialPrice').value;
        const stock = document.getElementById('specialStock').value;
        const start_date = document.getElementById('specialStart').value;
        const end_date = document.getElementById('specialEnd').value;
        const payload = { name, roomType, price, stock, start_date, end_date };
        if (id) {
            fetch(`/api/admin/specials/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(res => res.json()).then(() => { fetchSpecials(); resetSpecialForm(); });
        } else {
            fetch('/api/admin/specials', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(res => res.json()).then(() => { fetchSpecials(); resetSpecialForm(); });
        }
    };

    // 초기 데이터 로드
    fetchReservations();
    fetchRoomCounts();
    fetchSpecials();
    renderStockCalendar();
    
    // 오늘 날짜를 기본 선택
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    selectStockDate(todayStr);

    // Socket.IO 클라이언트 연결 및 실시간 갱신
    const socket = io();
    socket.emit('admin'); // 'admin' 방에 join
    socket.on('reservation-updated', () => {
        fetchReservations();
        fetchRoomCounts();
    });
}); 