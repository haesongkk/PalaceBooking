let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let rangeStart = null;
let rangeEnd = null;
let calendarEnabled = true;
let selectedRoom = '';

let selectedMode = "date-first"; // 기본은 날짜기반
let selectedProduct = "";

let recommendedDate = new Date(2025, 3, 20); // 2025-04-20 추천 날짜 (예시)
let recommendedRoom = "디럭스룸 (2인) - 90,000원";

let reservations = [
  { id: 1, text: "디럭스룸 (2인) - 4/15", cancelled: false },
  { id: 2, text: "스탠다드룸 (2인) - 4/20", cancelled: false }
];


function appendMessage(text, sender = 'bot') {
  const chatBox = document.getElementById('chat');
  const msg = document.createElement('div');
  msg.className = 'message ' + sender;
  msg.textContent = text;
  chatBox.insertBefore(msg, chatBox.firstChild);
}

function sendQuick(label) {
  appendMessage(label, 'user');
  if (label.includes('날짜')) {
    calendarEnabled = true;
    appendMessage('예약하실 날짜를 선택해주세요.');
    const cal = document.createElement('div');
    cal.className = 'message bot';
    cal.id = 'calendarBox';
    cal.innerHTML = renderCalendar();
    document.getElementById('chat').insertBefore(cal, document.getElementById('chat').firstChild);
  } 
  else if (label.includes("상품으로")) {
	selectedMode = "product-first";
	selectedProduct = "";
	calendarEnabled = false;
	appendMessage("예약하실 상품을 선택해주세요.");
	showProductList();
  }
  else if (label.includes("재방문")) {
	selectedMode = "return-customer";
	rangeStart = recommendedDate;
	rangeEnd = null;
	selectedRoom = recommendedRoom;
	updateSelectedRangeUI(); // 캡슐 UI에 날짜/객실 표시
	
	appendMessage("지난 숙박 이력을 바탕으로 추천 정보를 불러왔습니다.");
	showReturnCalendar(); // 추천 날짜가 표시된 달력
	showRoomButtons(true); // 추천 객실이 자동 선택된 상태
  }
  else if (label.includes("오늘")) {
	selectedMode = "today";
	const todayText = formatDate(new Date());
	appendMessage(`${todayText} 오늘 예약 가능한 객실을 보여드릴게요.`);
	showRoomButtons(); // 기존과 동일한 버튼 사용
  }
  else if (label.includes("예약 내역")) {
	appendMessage("📄 현재 예약 내역입니다:");
	showReservationList();
  }

  else {
    appendMessage("기능 준비 중입니다.");
  }
}

function showReturnCalendar() {
  calendarEnabled = true;
  const cal = document.createElement('div');
  cal.className = 'message bot';
  cal.id = 'calendarBox';
  cal.innerHTML = renderCalendar(recommendedDate, null);
  document.getElementById('chat').insertBefore(cal, document.getElementById('chat').firstChild);
}
function showReservationList() {
  const chatBox = document.getElementById('chat');
  const container = document.createElement('div');
  container.className = 'message bot';

  let html = `<div class="room-list">`;
  let hasActive = false;
  reservations.forEach(res => {
    if (!res.cancelled) {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <span>${res.text}</span>
        <button onclick="cancelReservation(${res.id})" style="background:red;color:white;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;">취소</button>
      </div>`;
      hasActive = true;
    }
  });

  if (!hasActive) html += `<div>❌ 현재 예약된 내역이 없습니다.</div>`;
  html += `</div>`;

  container.innerHTML = html;
  chatBox.insertBefore(container, chatBox.firstChild);
}

function cancelReservation(id) {
  const target = reservations.find(r => r.id === id);
  if (target) {
    target.cancelled = true;
    appendMessage(`🗑️ '${target.text}' 예약이 취소되었습니다.`, 'bot');
    showReservationList(); // 새로고침처럼 다시 보여줌
  }
}


function resetFlow() {
  calendarEnabled = false;
  rangeStart = null;
  rangeEnd = null;
  selectedRoom = '';
  updateSelectedRangeUI();
  appendMessage("진행 중인 예약을 초기화했어요. 무엇을 도와드릴까요?");
}

// 달력
function renderCalendar(customStart = null, customEnd = null) {
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  let html = `<div style="margin-bottom:4px; display:flex; justify-content:space-between;">
    <button onclick="changeMonth(-1)">◀</button>
    <strong>${year}년 ${month + 1}월</strong>
    <button onclick="changeMonth(1)">▶</button>
  </div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">`;

  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let d = 1; d <= lastDate; d++) {
    const thisDate = new Date(year, month, d);

    const isStart = customStart && thisDate.toDateString() === customStart.toDateString();
    const isEnd = customEnd && thisDate.toDateString() === customEnd.toDateString();
    const isInRange =
      customStart && customEnd && thisDate > customStart && thisDate < customEnd;

    let bgColor = "#ffd600";
    if (isStart || isEnd) bgColor = "white";
    if (isInRange) bgColor = "gray";

    html += `<button onclick="selectDate('${year}-${month + 1}-${d}')"
      style="padding:6px;border-radius:8px;
      background:${bgColor};
      color:${(isStart || isEnd) ? "black" : "black"};
      font-weight:bold;">${d}</button>`;
  }

  html += `</div>`;
  return html;
}


function changeMonth(offset) {
  if (!calendarEnabled) return;
  calendarMonth += offset;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  else if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  const cal = document.getElementById('calendarBox');
  if (cal) cal.innerHTML = renderCalendar(rangeStart, rangeEnd);
}

function selectDate(dateStr) {
  if (!calendarEnabled) return;
  const d = new Date(dateStr);
  if (!rangeStart || (rangeStart && rangeEnd)) {
    rangeStart = d;
    rangeEnd = null;
  } else {
    if (d < rangeStart) rangeStart = d;
    else rangeEnd = d;
  }
  updateSelectedRangeUI();
  renderCalendar();
}

function updateSelectedRangeUI() {
  const wrap = document.getElementById("selectedRange");
  wrap.innerHTML = "";
  if (rangeStart && !rangeEnd)
    wrap.innerHTML = `<span class='capsule'>${formatDate(rangeStart)}</span>`;
  else if (rangeStart && rangeEnd)
    wrap.innerHTML = `<span class='capsule'>${formatDate(rangeStart)}</span> ~ 
                      <span class='capsule'>${formatDate(rangeEnd)}</span>`;

  // ✅ 캘린더 다시 그리기!
  const cal = document.getElementById("calendarBox");
  if (cal) cal.innerHTML = renderCalendar(rangeStart, rangeEnd);
}


function formatDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function submitSelectedDate() {
  if (!rangeStart) return appendMessage("날짜를 선택해주세요.", 'bot');

  const summary = rangeEnd
    ? `${formatDate(rangeStart)} ~ ${formatDate(rangeEnd)}`
    : `${formatDate(rangeStart)} 당일`;

  if (selectedMode === "product-first") {
    appendMessage(`${selectedProduct}\n📅 ${summary}`, 'user');
    selectedRoom = `${selectedProduct}\n📅 ${summary}`;
    showPaymentOptions();
  } else if (selectedMode === "return-customer") {
    // ✅ 재방문 할인예약: 이미 선택된 상태라 바로 결제
    appendMessage(`${selectedRoom}\n📅 ${summary}`, 'user');
    showPaymentOptions();
  } else {
    // 📅 날짜로 예약
    appendMessage(`${summary} 예약`, 'user');
    appendMessage("해당 날짜로 예약 가능한 객실을 확인 중입니다...");
    showRoomButtons();
  }

  calendarEnabled = false;
  rangeStart = null;
  rangeEnd = null;
  updateSelectedRangeUI();
}



function showRoomButtons(highlight = false) {
  const chatBox = document.getElementById('chat');
  const container = document.createElement('div');
  container.className = 'message bot';

  const rooms = [
    "디럭스룸 (2인) - 90,000원",
    "스탠다드룸 (2인) - 70,000원",
    "패밀리룸 (4인) - 120,000원"
  ];

  let html = '<div class="room-list">';
  rooms.forEach(room => {
    const isSelected = highlight && room === recommendedRoom;
    html += `<button onclick="selectRoom('${room}')" 
               style="${isSelected ? 'background:black;color:white;' : ''}">
               ${room}</button>`;
  });
  html += '</div>';
  container.innerHTML = html;
  chatBox.insertBefore(container, chatBox.firstChild);
}

function selectRoom(room) {
  selectedRoom = room;
  appendMessage(room, 'user');

  if (selectedMode === "today") {
    // ✅ 오늘 날짜 포함 결제 진행
    const todayText = formatDate(new Date());
    selectedRoom = `${room}\n📅 ${todayText}`;
    showPaymentOptions();
  } else {
    showPaymentOptions();
  }
}


function showPaymentOptions() {
  const chatBox = document.getElementById('chat');
  const container = document.createElement('div');
  container.className = 'message bot';
  container.innerHTML = `
    <div class="pay-list">
      <button onclick="selectPay('계좌이체')">🏦 계좌이체</button>
      <button onclick="selectPay('일반결제')">💳 일반결제 (신용카드)</button>
      <button onclick="selectPay('카카오페이')">💛 카카오페이</button>
      <button onclick="selectPay('네이버페이')">💚 네이버페이</button>
    </div>
  `;
  chatBox.insertBefore(container, chatBox.firstChild);
}

function selectPay(method) {
  appendMessage(`💳 ${method} 선택`, 'user');
  appendMessage(`(결제 과정)`, 'bot');
  // ✅ 서버에 예약 정보 전송
  fetch('http://localhost:3000/api/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: selectedRoom })
  })
  .then(res => res.json())
  .then(data => {
    appendMessage(`✅ 예약이 완료되었습니다!\n${selectedRoom}`, 'bot');
  })
  .catch(err => {
    appendMessage(`❌ 서버에 예약 저장 중 오류 발생`, 'bot');
  });
}
function showProductList() {
  const container = document.createElement('div');
  container.className = 'message bot';
  container.innerHTML = `
    <div class="room-list">
      <button onclick="selectProduct('2PC (60,000원)')">🖥️ 2PC (60,000원)</button>
      <button onclick="selectProduct('멀티플렉스 (50,000원)')">🎥 멀티플렉스 (50,000원)</button>
      <button onclick="selectProduct('노래방 (60,000원)')">🎤 노래방 (60,000원)</button>
      <button onclick="selectProduct('스탠다드 (45,000원)')">🛏️ 스탠다드 (45,000원)</button>
      <button onclick="selectProduct('트윈 (50,000원)')">🛌 트윈 (50,000원)</button>
    </div>`;
  document.getElementById('chat').insertBefore(container, document.getElementById('chat').firstChild);
}

function selectProduct(product) {
  selectedProduct = product;
  appendMessage(product, 'user');
  appendMessage("이용하실 날짜를 선택해주세요.");
  calendarEnabled = true;
  const cal = document.createElement('div');
  cal.className = 'message bot';
  cal.id = 'calendarBox';
  cal.innerHTML = renderCalendar();
  document.getElementById('chat').insertBefore(cal, document.getElementById('chat').firstChild);
}

function handleBackspace(event) {
  if (event.key === 'Backspace') {
    if (rangeEnd) rangeEnd = null;
    else if (rangeStart) rangeStart = null;
    updateSelectedRangeUI();
  }
}