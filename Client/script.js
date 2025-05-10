let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let rangeStart = null;
let rangeEnd = null;
let calendarEnabled = true;
let selectedRoom = '';

let selectedMode = "date-first";
let selectedProduct = "";

let recommendedDate = new Date(2025, 3, 20);
let recommendedRoom = "디럭스룸 (2인) - 90,000원";

let waitingForNickname = false;
let waitingForPhone = false;


let reservations = [
    { id: 1, text: "디럭스룸 (2인) - 4/15", cancelled: false },
    { id: 2, text: "스탠다드룸 (2인) - 4/20", cancelled: false }
];

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("customInput");

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // 줄바꿈 방지
            const text = input.innerText.trim();
            if (text) {
                handleUserInput(text); // 기존 흐름 재사용
                input.innerHTML = "";  // 입력창 초기화
            }
        }
    });
});


// ✅ 페이지 접속 시 사용자 정보 초기 흐름
window.onload = () => {
    const cachedNickname = localStorage.getItem("cachedNickname");
    const cachedPhone = localStorage.getItem("cachedPhone");

    if (cachedNickname && cachedPhone) {
        updateHeaderNickname(cachedNickname, cachedPhone);
        appendMessage("무엇을 도와드릴까요?", "bot");
        showQuickMenuInChat();
    } else {
        nickname = cachedNickname || generateRandomNickname();
        updateHeaderNickname(nickname, null);
        appendMessage(`안녕하세요. '${nickname}'님.`, "bot");
        askForPhone();
    }
};

// ✅ 랜덤 닉네임 생성
function generateRandomNickname() {
    const names = ["라이언", "어피치", "춘식이", "제이지"];
    return names[Math.floor(Math.random() * names.length)];
}

// ✅ 전화번호 입력 요청 흐름
function askForPhone() {
    waitingForPhone = true;
    appendMessage("예약을 위해 전화번호를 입력해주세요.", "bot");
}

// ✅ 상단 닉네임 표시 업데이트
function updateHeaderNickname(nick, phone) {
    const el = document.querySelector(".chat-title");
    if (nick && phone) {
        el.textContent = `${nick}(${phone.slice(-4)})`;
    } else {
        el.textContent = `${nick}`;
    }
}

// ✅ 사용자 입력 처리 흐름
function handleUserInput(text) {
    const trimmed = text.trim();

    if (waitingForPhone) {
        if (!/^\d{10,11}$/.test(trimmed)) {
            appendMessage("전화번호 형식이 올바르지 않습니다. 다시 입력해주세요.", "bot");
            return;
        }
        phone = trimmed;
        waitingForPhone = false;
        appendMessage(phone, "user");

        appendMessage("(전화번호가 DB에 있다면 그대로 진행, 없다면 인증 1회 -> 웹 첫결제 반값때문)", "bot");  // 인증 시뮬레이션 텍스트

        localStorage.setItem("cachedNickname", nickname);
        localStorage.setItem("cachedPhone", phone);
        updateHeaderNickname(nickname, phone);
        appendMessage("감사합니다. 이제 예약을 도와드릴게요.", "bot");
        appendMessage("무엇을 도와드릴까요?", "bot");
        showQuickMenuInChat();
        return;
    }

    appendMessage(trimmed, "user");
    appendMessage("기능 준비 중입니다.", "bot");
}



//window.onload = () => {
//    const storedNickname = localStorage.getItem("cachedNickname");
//    const storedPhone = localStorage.getItem("cachedPhone");

//    if (storedNickname && storedPhone) {
//        updateHeaderNickname(storedNickname, storedPhone);
//        showInitialQuickMenu();
//    } else {
//        appendMessage("안녕하세요! 먼저 예약자 정보를 입력해주세요.", "bot");
//        askForNickname();
//    }

//    appendMessage("무엇을 도와드릴까요?", "bot");
//    const container = document.createElement("div");
//    container.className = "message bot";

//    const options = [
//        "💰 재방문 할인 예약",
//        "🔥 오늘 예약",
//        "📄 예약 내역",
//    ];

//    options.forEach(label => {
//        const btn = document.createElement("button");
//        btn.className = "bot-option";
//        btn.textContent = label;
//        btn.onclick = () => sendQuick(label);
//        container.appendChild(btn);
//    });

//    document.getElementById("chat").insertBefore(container, document.getElementById("chat").firstChild);
//};

function appendMessage(text, sender = "bot") {
    const chatBox = document.getElementById("chat");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.textContent = text;
    chatBox.insertBefore(msg, chatBox.firstChild);
}


function getNextSameWeekday(baseDateStr) {
    const base = new Date(baseDateStr);
    const now = new Date();
    const baseDay = base.getDay();
    const diff = (7 + baseDay - now.getDay()) % 7 || 7;
    now.setDate(now.getDate() + diff);
    return now;
}



// ✅ 수정된 handleReturnCustomer 함수
function handleReturnCustomer(nickname, phone) {
    fetch(`/api/last-reservation?nickname=${encodeURIComponent(nickname)}&phone=${encodeURIComponent(phone)}`)
        .then(res => res.ok ? res.json() : Promise.reject("이전 예약 없음"))
        .then(data => {
            const { start_date, room } = data;
            const lastDate = new Date(start_date);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            if (lastDate < threeMonthsAgo) {
                appendMessage("❌ 3개월 이내 숙박 이력이 없어 할인 대상이 아닙니다.");
                selectedMode = "return-customer";
                calendarEnabled = true;
                appendMessage("일반 예약 흐름으로 계속 진행합니다. 날짜를 선택해주세요.");
                showReturnCalendar();
                showRoomButtons();
                return;
            }

            const suggestedDate = getNextSameWeekday(start_date);
            selectedMode = "return-customer";
            rangeStart = suggestedDate;
            rangeEnd = null;
            selectedRoom = room;
            updateSelectedRangeUI();
            appendMessage("지난 숙박 이력을 바탕으로 추천 정보를 불러왔습니다.");
            showReturnCalendar();     // ✅ 추천 날짜 표시
            showRoomButtons(true);    // ✅ 추천 객실 강조 표시
            // ❌ 자동 확정 제거: submitSelectedDate() 호출하지 않음
        })
        .catch(() => {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            selectedMode = "return-customer";
            rangeStart = today;
            rangeEnd = tomorrow;
            selectedRoom = "디럭스룸 (2인)";
            updateSelectedRangeUI();
            appendMessage("이전 예약 이력이 없어 오늘~내일로 기본 추천되었습니다.");
            showReturnCalendar();
            showRoomButtons(true);
            // ❌ 자동 확정 제거: submitSelectedDate() 호출하지 않음
        });
}

// ✅ 수정된 showReturnCalendar 함수
function showReturnCalendar() {
    calendarEnabled = true;
    const cal = document.createElement("div");
    cal.className = "message bot";
    cal.id = "calendarBox";
    cal.innerHTML = renderCalendar(rangeStart, rangeEnd);  // ✅ 추천 날짜 표시
    document.getElementById("chat").insertBefore(cal, document.getElementById("chat").firstChild);
}

// ✅ 수정된 selectPay 함수 (요청 바디 콘솔 출력 추가)
function selectPay(method) {
    appendMessage(`💳 ${method} 선택`, "user");
    appendMessage(`(결제 과정)`, "bot");


    const payload = {
        nickname: "라이언",  // 테스트용 값
        phone: "01012345678",
        room: selectedRoom,
        startDate: rangeStart?.toISOString().split('T')[0],
        endDate: rangeEnd?.toISOString().split('T')[0] || null
    };

    console.log("📌 상태 확인:", {
        rangeStart,
        rangeEnd,
        selectedRoom
    });


    console.log("📦 서버 전송 데이터:", payload);
    if (!selectedRoom || !rangeStart) {
        appendMessage("❌ 날짜나 객실이 선택되지 않았습니다. 다시 시도해주세요.", "bot");
        return;
    }

    fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            appendMessage(`✅ 예약이 완료되었습니다!\n${selectedRoom}`, "bot");
        })
        .catch(err => {
            appendMessage(`❌ 서버에 예약 저장 중 오류 발생`, "bot");
        });
}




function sendQuick(label) {
    appendMessage(label, "user");

    if (label.includes("재방문")) {
        const nickname = localStorage.getItem("cachedNickname");
        const phone = localStorage.getItem("cachedPhone");

        handleReturnCustomer(nickname, phone);
    }
    else if (label.includes("오늘")) {
        selectedMode = "today";
        const todayText = formatDate(new Date());
        appendMessage(`${todayText} 오늘 예약 가능한 객실을 보여드릴게요.`);
        showRoomButtons();
    }
    else if (label.includes("예약 내역")) {
        appendMessage("📄 현재 예약 내역입니다:");
        showReservationList();
    } 
    else {
        appendMessage("기능 준비 중입니다.");
    }
}

function showQuickMenuInChat() {
    const container = document.createElement("div");
    container.className = "message bot";

    const options = [
        "💰 재방문 할인예약",
        "🔥 오늘 예약",
        "📄 예약 내역"
    ];

    options.forEach(label => {
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = label;
        btn.onclick = () => sendQuick(label);
        container.appendChild(btn);
    });

    document.getElementById("chat").insertBefore(container, document.getElementById("chat").firstChild);
}

function toggleQuickMenuBar() {
    document.getElementById("quickMenuBar")?.classList.toggle("hidden");
}

function toggleSettings() {
    alert("⚙️ 설정 또는 도움말 기능은 준비 중입니다.");
}

function searchChat() {
    const keyword = prompt("검색할 단어나 문장을 입력하세요:");
    if (!keyword) return;
    const messages = document.querySelectorAll(".chat-window .message");
    messages.forEach(msg => {
        msg.style.outline = msg.textContent.includes(keyword) ? "2px solid var(--color-primary)" : "none";
    });
}

function showReservationList() {
    const chatBox = document.getElementById("chat");
    const container = document.createElement("div");
    container.className = "message bot";

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
        appendMessage(`🗑️ '${target.text}' 예약이 취소되었습니다.`, "bot");
        showReservationList();
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

function renderCalendar(customStart = null, customEnd = null) {
    console.log("📅 renderCalendar 호출됨:", {
        customStart,
        customEnd
    });

    const year = calendarYear;
    const month = calendarMonth;

    const firstDate = new Date(year, month, 1);
    const firstDay = firstDate.getDay(); // 0: Sun
    const startDate = new Date(firstDate);
    startDate.setDate(1 - firstDay); // 달력 시작일 (일요일)

    let html = `
        <div class="calendar-nav">
            <button onclick="changeMonth(-1)">◀</button>
            <div class="calendar-title"><strong>${year}년 ${month + 1}월</strong></div>
            <button onclick="changeMonth(1)">▶</button>
         </div>
        <div class="calendar-grid">
        ${["일", "월", "화", "수", "목", "금", "토"].map(d => `<div class="calendar-day-label">${d}</div>`).join("")}`;

    for (let i = 0; i < 35; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const isInMonth = currentDate.getMonth() === month;
        const isStart = customStart && currentDate.toDateString() === customStart.toDateString();
        const isEnd = customEnd && currentDate.toDateString() === customEnd.toDateString();
        const isInRange = customStart && customEnd && currentDate > customStart && currentDate < customEnd;
        const isToday = currentDate.toDateString() === new Date().toDateString();

        let classes = "calendar-cell";
        if (isToday) classes += " today";
        if (!isInMonth) classes += " inactive";
        if (isStart || isEnd) classes += " selected";
        else if (isInRange) classes += " range";

        html += `
            <button class="${classes}" onclick="selectDate('${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}')">
                ${currentDate.getDate()}
            </button>
        `;
    }

    html += `</div>`;
    return html;
}



function changeMonth(offset) {
    if (!calendarEnabled) return;
    calendarMonth += offset;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    else if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    const cal = document.getElementById("calendarBox");
    if (cal) cal.innerHTML = renderCalendar(rangeStart, rangeEnd);
}

function selectDate(dateStr) {
    console.log("📅 selectDate 호출됨:", dateStr);
    if (!calendarEnabled) return;

    const d = new Date(dateStr);
    if (!rangeStart || (rangeStart && rangeEnd))
    {
        rangeStart = d;
        rangeEnd = null;
    }
    else
    {
        if (d < rangeStart) rangeStart = d;
        else rangeEnd = d;
    }

    updateSelectedRangeUI();
}

function updateSelectedRangeUI() {
    const wrap = document.getElementById("customInput");
    if (!wrap) return;

    // 기존 날짜 캡슐 제거
    const existing = wrap.querySelector(".capsule");
    if (existing) wrap.removeChild(existing);

    // 캡슐 텍스트 구성
    if (rangeStart) {
        const startText = formatDate(rangeStart);
        const endText = rangeEnd ? formatDate(rangeEnd) : null;
        const label = endText ? `${startText} ~ ${endText}` : `${startText}`;

        const capsule = document.createElement("span");
        capsule.className = "capsule";
        capsule.textContent = label;

        // 캡슐 삽입
        wrap.insertBefore(capsule, wrap.firstChild);
    }

    // 달력 갱신
    const cal = document.getElementById("calendarBox");
    if (cal) cal.innerHTML = renderCalendar(rangeStart, rangeEnd);
}



function formatDate(d) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function submitSelectedDate() {
    if (!rangeStart) return appendMessage("날짜를 선택해주세요.", "bot");

    const summary = rangeEnd
        ? `${formatDate(rangeStart)} ~ ${formatDate(rangeEnd)}`
        : `${formatDate(rangeStart)} 당일`;

    if (selectedMode === "product-first") {
        appendMessage(`${selectedProduct}\n📅 ${summary}`, "user");
        selectedRoom = `${selectedProduct}\n📅 ${summary}`;
        showPaymentOptions();
    } else if (selectedMode === "return-customer") {
        appendMessage(`${selectedRoom}\n📅 ${summary}`, "user");
        showPaymentOptions();
    } else {
        appendMessage(`${summary} 예약`, "user");
        appendMessage("해당 날짜로 예약 가능한 객실을 확인 중입니다...");
        showRoomButtons();
    }

    calendarEnabled = false;
    updateSelectedRangeUI();

    // ✅ 입력창 초기화
    document.getElementById("customInput").innerHTML = "";
}

function showRoomButtons(highlight = false) {
    const chatBox = document.getElementById("chat");
    const container = document.createElement("div");
    container.className = "message bot";

    const rooms = [
        "🖥️ 2PC (60,000원)",
        "🎥 멀티플렉스 (50,000원)",
        "🎤 노래방 (60,000원)",
        "🛏️ 스탠다드 (45,000원)",
        "🛌 트윈 (50,000원)"
    ];

    rooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = room;

        // 강조 추천일 경우
        if (highlight && room === recommendedRoom) {
            btn.style.background = "black";
            btn.style.color = "white";
        }

        btn.onclick = () => {
            selectedRoom = room;

            // ✅ 버튼 강조 초기화
            const allButtons = container.querySelectorAll("button");
            allButtons.forEach(b => {
                b.style.background = "";
                b.style.color = "";
            });

            // ✅ 현재 버튼 강조
            btn.style.background = "black";
            btn.style.color = "white";

            // ✅ 입력창에 캡슐 표시
            const input = document.getElementById("customInput");
            const old = input.querySelector(".capsule-room");
            if (old) input.removeChild(old);

            const capsule = document.createElement("span");
            capsule.className = "capsule capsule-room";
            capsule.textContent = room;
            input.appendChild(capsule);
        };

        container.appendChild(btn);
    });

    chatBox.insertBefore(container, chatBox.firstChild);
}

function selectRoom(room) {
    selectedRoom = room;
    appendMessage(room, "user");

    if (selectedMode === "today") {
        const todayText = formatDate(new Date());
        selectedRoom = `${room}\n📅 ${todayText}`;
    }

    showPaymentOptions();
}

function showPaymentOptions() {
    const chatBox = document.getElementById("chat");
    const container = document.createElement("div");
    container.className = "message bot";

    const methods = [
        "🏦 계좌이체",
        "💳 일반결제 (신용카드)",
        "💛 카카오페이",
        "💚 네이버페이"
    ];

    methods.forEach(m => {
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = m;
        btn.onclick = () => selectPay(m);
        container.appendChild(btn);
    });

    chatBox.insertBefore(container, chatBox.firstChild);
}


function showProductList() {
    const chatBox = document.getElementById("chat");
    const container = document.createElement("div");
    container.className = "message bot";

    const products = [
        "🖥️ 2PC (60,000원)",
        "🎥 멀티플렉스 (50,000원)",
        "🎤 노래방 (60,000원)",
        "🛏️ 스탠다드 (45,000원)",
        "🛌 트윈 (50,000원)"
    ];

    products.forEach(p => {
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = p;
        btn.onclick = () => selectProduct(p);
        container.appendChild(btn);
    });

    chatBox.insertBefore(container, chatBox.firstChild);
}

function selectProduct(p) {
    selectedProduct = p;
    appendMessage(p, "user");
    appendMessage("이용하실 날짜를 선택해주세요.");

    calendarEnabled = true;
    const cal = document.createElement("div");
    cal.className = "message bot";
    cal.id = "calendarBox";
    cal.innerHTML = renderCalendar();
    document.getElementById("chat").insertBefore(cal, document.getElementById("chat").firstChild);
}

function handleBackspace(event) {
    if (event.key === "Backspace") {
        if (rangeEnd) rangeEnd = null;
        else if (rangeStart) rangeStart = null;
        updateSelectedRangeUI();
    }
}
