let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let calendarEnabled = true;

let rangeStart = null;
let rangeEnd = null;
let selectedRoom = '';

let selectedMode = "date-first";
let selectedProduct = "";

let logBuffer = [];
let userNick = null; // ex: "몽글몽글한 젤리(1234)"

function sendLogToServer(log) {
    palaceAPI.saveLog(log).catch(error => {
        console.error('로그 저장 실패:', error);
    });
}

function appendMessage(text, sender = "bot", type = "text") {
	console.log(sender, ": ", text);
	
    const chatBox = document.getElementById("chat");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.textContent = text;
    chatBox.appendChild(msg); // 메시지를 맨 아래에 추가
    
    // 봇 메시지인 경우 이전 봇 메시지들 비활성화
    if (sender === "bot") {
        disablePreviousBotMessages();
    }
    
    // 메시지 추가 후 스크롤 아래로 이동
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    // 로그 저장
    const log = {
        nick: userNick,
        sender,
        type,
        content: text,
        timestamp: new Date().toISOString()
    };
    if (!userNick) {
        logBuffer.push(log);
    } else {
        sendLogToServer(log);
    }
}

function disablePreviousBotMessages() {
    const botMessages = document.querySelectorAll('.message.bot');
    if (botMessages.length > 1) {
        // 마지막 봇 메시지를 제외한 모든 봇 메시지 비활성화
        for (let i = 0; i < botMessages.length - 1; i++) {
            const msg = botMessages[i];
            msg.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
	console.log("엔터 처리?");
	
    const input = document.getElementById("customInput");
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (rangeStart || selectedRoom) {
                submitSelectedDate();
            } else {
                const text = input.innerText.trim();
                if (text) {
                    if (typeof curHandler === 'function') {
                        handleUserInput(text);
                    }
                    input.innerHTML = "";
                }
            }
        }
    });
    // 전송 버튼도 동일하게 처리
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.onclick = () => {
            if (rangeStart || selectedRoom) {
                submitSelectedDate();
            } else {
                const text = input.innerText.trim();
                if (text) {
                    if (typeof curHandler === 'function') {
                        handleUserInput(text);
                    }
                    input.innerHTML = "";
                }
            }
        };
    }

    // 자동 스크롤 MutationObserver
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
        const observer = new MutationObserver(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        });
        observer.observe(chatWindow, { childList: true, subtree: true });
    }
});

window.onload = () => {
    appendMessage("안녕하세요. 예약을 도와드릴게요.");
    appendMessage("예약을 위해 전화번호를 입력해주세요.");
    
    curHandler = phoneHandler;
};

window.addEventListener('message', function(event) {
    if(event.data === 'payment-success') {
        appendMessage('✅ 결제가 완료되었습니다! 예약이 접수되었습니다. 관리자 승인 후 확정됩니다.', 'bot');
        // 필요하다면 예약 내역 새로고침 함수 호출
        // showReservationList();
    } else if(event.data === 'payment-fail') {
        appendMessage('❌ 결제에 실패했습니다. 다시 시도해주세요.', 'bot');
    }
});

window.addEventListener('resize', () => {
  window.scrollTo(0, 0);
});


const cuteAdjectives = [
  "몽글몽글한", "보들보들한", "말랑말랑한", "쫀득한", "수줍은",
  "도도한", "엉뚱한", "완벽한", "삐약삐약", "냠냠대는",
  "아기같은", "반짝이는", "알쏭달쏭한", "살금살금", "방긋웃는",
  "뚱뚱한", "깜찍한", "살짝삐친", "졸린", "해맑은",
  "반쯤자란", "새초롬한", "비밀스러운", "심통난", "심쿵한"
];
const foodAndAnimalNouns = [
  // 음식
  "젤리", "쿠키", "마카롱", "붕어빵", "떡볶이",
  "초밥", "라면", "팥빙수", "치즈볼", "아이스크림",
  "도넛", "카라멜", "빵", "찹쌀떡", "감자칩",

  // 동물
  "고양이", "강아지", "토끼", "너구리", "햄스터",
  "수달", "부엉이", "고슴도치", "펭귄", "다람쥐",
  "두더지", "곰돌이", "오리", "치타", "사막여우",
  
  // 캐릭터 느낌
  "푸우", "피카츄", "뽀로로", "짱구", "코난",
  "커비", "라이언", "무지", "어피치", "둘리",
  "도라에몽", "쿠로미", "헬로키티", "마이멜로디", "짱아"
];

function generateRandomNickname() {
  const adj = cuteAdjectives[Math.floor(Math.random() * cuteAdjectives.length)];
  const noun = foodAndAnimalNouns[Math.floor(Math.random() * foodAndAnimalNouns.length)];
  console.log("랜덤 닉네임 생성: ", adj, noun);
  return `${adj} ${noun}`; // 형용사와 명사 사이에 공백!
}

function updateHeaderNickname(nick, phone)
{
    const el = document.querySelector(".chat-title");
    if (nick && phone) {
        el.textContent = `${nick}(${phone.slice(-4)})`;
    } else {
        el.textContent = `${nick}`;
    }
}


// 전송 버튼 처리
let username;
let userphone;
let recentStartDate;
let recentEndDate;
let recentRoomType;
// 전역 변수로 고객 타입 저장
let userType = "old"; // "first", "recent", "old" 중 하나
function phoneHandler(input)
{
	if (!/^\d{10,11}$/.test(input))
    {
        appendMessage("전화번호 형식이 올바르지 않습니다. 다시 입력해주세요.", "bot");
        return;
    }

    // 전화번호 전송 → 닉네임 + 최근 예약 확인
    userphone = input;
    // 소켓 연결
    palaceAPI.connectSocket(userphone);
    // Socket 이벤트 리스너 설정
    setupSocketEventListeners();
    palaceAPI.getRecentReservation(userphone)
        .then(data => {
			console.log("데이터 조회 결과:", data);

            username = data.username || generateRandomNickname();
            recentRoomType = data.room || null;
            recentStartDate = data.start_date ? new Date(data.start_date) : null;
            recentEndDate = data.end_date ? new Date(data.end_date) : null;

            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            // 고객 타입별 환영 메시지 및 userType 세팅
            let welcomeMessage;
            if (!recentEndDate) {
                userType = "first";
                welcomeMessage = `🎉 첫방문하신 ${username}님! 반값할인을 준비했어요!`;
            }
            else if (recentEndDate >= threeMonthsAgo) {
                userType = "recent";
                welcomeMessage = `💰 재방문하신 ${username}님! 특별한 할인 혜택을 드려요!`;
            } else {
                userType = "old";
                welcomeMessage = `👋 오랜만이에요 ${username}님! 새로운 혜택을 확인해보세요!`;
            }

            // 통일된 메뉴 (고객 타입 구분 없음)
            const menuOptions = [
                "📅 날짜로 예약",
                "🛏️ 상품으로 예약"
            ];

            updateHeaderNickname(username, userphone);
            appendMessage(welcomeMessage);
            showQuickMenuWith(menuOptions);

            // 입력창 비우기
            const inputBox = document.getElementById("customInput");
            if (inputBox) inputBox.innerHTML = "";

            // curHandler를 예약 관련 handler로 변경
            curHandler = null; // 전화번호 입력 후에는 반복 안내 방지

            // 닉네임 할당 후 로그 전송
            onNicknameAssigned(username, userphone);
        })
        .catch(() => {
            console.log("[ERROR] 서버 통신 오류");
        });
}
function reserveHandler(input){
}
function defaultHandler(input)
{
	appendMessage("기능 준비 중입니다.");
}
let curHandler = defaultHandler;
function handleUserInput(text)
{
	console.log(text, "전송");
    const trimmed = text.trim();
    appendMessage(trimmed, "user");
	curHandler(trimmed);
}

async function showQuickMenuWith(labels = []) {
    removeOldCalendars(); // 기존 달력 삭제
    const container = document.createElement("div");
    container.className = "message bot";

    // 1. 기본 메뉴 버튼
    labels.forEach(label => {
        if (label === "📄 예약 내역 확인") return;
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = label;
        btn.onclick = () => sendQuick(label).catch(console.error);
        container.appendChild(btn);
    });





    // 4. 예약 내역 확인 버튼
    const btn = document.createElement("button");
    btn.className = "bot-option";
    btn.textContent = "📄 예약 내역 확인";
    btn.onclick = () => sendQuick("📄 예약 내역 확인").catch(console.error);
    container.appendChild(btn);

    document.getElementById("chat").appendChild(container);
}



let reserveStartDate;
let reserveEndDate;
let reserveRoomType;
async function sendQuick(label) {
    appendMessage(label, "user");

    if (label.includes("날짜로 예약")) {
        // 날짜 먼저 선택
        selectedMode = "date-first";
        appendMessage("이용하실 날짜를 선택해주세요.");
        removeOldCalendars(); // 기존 달력 삭제
        const cal = document.createElement("div");
        cal.className = "message bot";
        cal.id = "calendarBox";
        renderCalendar().then(html => {
            cal.innerHTML = html;
        });
        document.getElementById("chat").appendChild(cal);
    }
    else if (label.includes("상품으로 예약")) {
        // 상품 먼저 선택
        selectedMode = "product-first";
        appendMessage("이용하실 상품을 선택해주세요.");
        await showProductList();
    }
    else if (label.includes("예약 내역")) {
        appendMessage("📄 현재 예약 내역입니다:");
        showReservationList();
    }
    else {
        appendMessage("기능 준비 중입니다.");
    }
}

async function showRoomButtons() {
    const chatBox = document.getElementById("chat");
    // 기존 버튼 컨테이너가 있으면 삭제(중복 방지)
    const oldContainer = document.querySelector('.message.bot .bot-option')?.parentElement;
    if (oldContainer) oldContainer.remove();
    const container = document.createElement("div");
    container.className = "message bot";

    // 서버에서 객실 목록 가져오기
    let rooms = [];
    try {
        const roomData = await palaceAPI.getRooms();
        rooms = roomData.map(room => room.name);
        console.log('[객실목록] 서버에서 가져온 객실:', rooms);
    } catch (error) {
        console.error('[객실목록] 서버 조회 실패, 기본 객실 사용:', error);
        // 서버 조회 실패 시 기본 객실 목록 사용
        rooms = [
            "🖥️ 2PC",
            "🎥 멀티플렉스",
            "🎤 노래방",
            "🛏️ 스탠다드",
            "🛌 트윈"
        ];
    }



    // 날짜가 선택되어 있으면 해당 날짜의 객실별 판매/마감 상태 조회
    let stockMap = {};
    if (rangeStart) {
        try {
            // 새로운 판매/마감 상태 확인 함수 사용
            for (const room of rooms) {
                const isAvailable = await checkRoomAvailability(rangeStart, rangeEnd, room);
                stockMap[room] = isAvailable;
            }
            console.log('[stockMap]', stockMap);
        } catch (e) {
            console.log('[판매상태조회][에러]', e);
            // 오류 시 모든 객실을 예약 가능한 것으로 처리
            rooms.forEach(room => stockMap[room] = true);
        }
    }

    rooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = room;
        // 판매/마감 상태에 따라 버튼 활성화/비활성화
        if (rangeStart && stockMap[room] === false) {
            btn.disabled = true;
            btn.style.background = "#ccc";
            btn.style.color = "#888";
            btn.title = "마감";
        }
        btn.onclick = () => {
            // 마감된 객실은 절대 선택 불가
            if (btn.disabled || (rangeStart && stockMap[room] === false)) return;
            selectedRoom = room;

            // 버튼 강조 초기화/하이라이트 제거
            const allButtons = container.querySelectorAll("button");
            allButtons.forEach(b => {
                b.style.background = "";
                b.style.color = "";
            });

            // 현재 버튼 강조
            btn.style.background = "black";
            btn.style.color = "white";

            // 입력창에 캡슐 표시
            const input = document.getElementById("customInput");
            const old = input.querySelector(".capsule-room");
            if (old) input.removeChild(old);

            const capsule = document.createElement("span");
            capsule.className = "capsule capsule-room";
            capsule.textContent = room;
            input.appendChild(capsule);
        };
        container.appendChild(btn);
        // 버튼별 로그
        console.log('[room 버튼]', room, 'stockMap:', stockMap[room], 'btn.disabled:', btn.disabled);
    });

    chatBox.appendChild(container);
}



// ✅ 수정된 selectPay 함수 (토스페이먼츠 결제 시스템 사용)
function selectPay(method) {
    processPayment(method);
}


function showQuickMenuInChat() {
    const container = document.createElement("div");
    container.className = "message bot";

    const options = [
        "📅 날짜로 예약",
        "🛏️ 상품으로 예약"
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
    const quickMenuBar = document.getElementById("quickMenuBar");
    if (!quickMenuBar) return;
    quickMenuBar.classList.toggle("hidden");
    // 퀵메뉴 항목 교체
    quickMenuBar.innerHTML = `
        <div class="circle-btn" onclick="showRoomInfo()">
            <div class="icon">🛏️</div>
            <div class="label">객실 소개</div>
        </div>
        <div class="circle-btn" onclick="showPalaceInfo()">
            <div class="icon">🏰</div>
            <div class="label">팔레스 소개</div>
        </div>
        <div class="circle-btn" onclick="showHelp()">
            <div class="icon">❓</div>
            <div class="label">도움말</div>
        </div>
        <div class="circle-btn" onclick="showContact()">
            <div class="icon">💬</div>
            <div class="label">문의하기</div>
        </div>
    `;
}

function showRoomInfo() {
    appendMessage("🛏️ 객실 소개\n- 2PC, 멀티플렉스, 노래방, 스탠다드, 트윈 등 다양한 객실이 준비되어 있습니다.\n상세 요금 및 시설은 예약 메뉴에서 확인해 주세요.", "bot");
}
function showPalaceInfo() {
    appendMessage("🏰 팔레스 소개\n- 팔레스는 프리미엄 게스트하우스/모텔로 쾌적한 환경과 다양한 부대시설을 제공합니다.", "bot");
}
function showHelp() {
    appendMessage("❓ 도움말\n- 예약, 결제, 취소 등 궁금한 점이 있으시면 언제든 문의해 주세요!", "bot");
}
function showContact() {
    appendMessage("💬 문의하기\n- 전화: 010-0000-0000\n- 카카오톡: @palacebooking\n- 기타 문의는 채팅으로 남겨주세요.", "bot");
}

function refreshMenu() {
    if (!userphone) {
        appendMessage("먼저 전화번호를 입력해 주세요!", "bot");
        return;
    }
    // 입력창 비우기
    const input = document.getElementById("customInput");
    if (input) input.innerHTML = "";
    // 예약 관련 임시 상태값 초기화
    rangeStart = null;
    rangeEnd = null;
    selectedRoom = '';
    selectedProduct = '';
    selectedMode = "date-first";
    // 캡슐 등도 모두 제거됨
    appendMessage("메뉴를 다시 불러왔어요! 원하시는 예약 방법을 선택해 주세요.", "bot");
    const menuOptions = [
        "📅 날짜로 예약",
        "🛏️ 상품으로 예약",
        "📄 예약 내역 확인"
    ];
    showQuickMenuWith(menuOptions);
}

function toggleSettings() {
    // 기존: alert("⚙️ 설정 또는 도움말 기능은 준비 중입니다.");
    refreshMenu();
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

    palaceAPI.getReservationList(userphone)
        .then(data => {
            console.log("[예약내역] 서버 응답:", data);
            let html = `<div class=\"room-list\">`;
            if (Array.isArray(data) && data.length > 0) {
                html += `<div style=\"margin-bottom:8px;\">📄 현재 예약 내역입니다:</div>`;
                data.forEach(item => {
                    if (!item.cancelled) {
                        html += `<div style=\"display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#23233b;color:#fff;border-radius:10px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);\">
                            <div>
                                <strong style=\"color:#ffd700;font-size:1.08em;\">${item.room}</strong><br>
                                <small style=\"color:#b0b8d1;\">${item.start_date} ~ ${item.end_date || ''}</small>
                            </div>
                            <button onclick=\"cancelReservation(${item.id})\" style=\"background:#ff3b3b;color:#fff;font-weight:bold;border:none;padding:7px 16px;border-radius:8px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.08);transition:background 0.2s;\" onmouseover=\"this.style.background='#c62828'\" onmouseout=\"this.style.background='#ff3b3b'\">취소</button>
                        </div>`;
                    }
                });
            } else {
                html += `<div>❌ 현재 예약된 내역이 없습니다.</div>`;
            }
            html += `</div>`;
            container.innerHTML = html;
            chatBox.appendChild(container);
        })
        .catch(() => {
            container.innerHTML = `<div>❌ 예약 내역을 불러오는 중 오류가 발생했습니다.</div>`;
            chatBox.appendChild(container);
        });
}

function cancelReservation(id) {
    palaceAPI.cancelReservation(id)
    .then(data => {
        if (data.success) {
            appendMessage(`🗑️ 예약이 취소되었습니다.`);
            appendMessage(`💸 결제된 금액은 며칠내로 환불됩니다.`);
            // 나중에 여기에 환불 처리 로직 추가 !!!!!
            // 예약 내역 다시 로드
            setTimeout(() => {
                showReservationList();
            }, 1000);
        } else {
            appendMessage(`❌ 예약 취소 중 오류가 발생했습니다.`, "bot");
        }
    })
    .catch(() => {
        appendMessage(`❌ 서버 통신 오류로 예약 취소에 실패했습니다.`, "bot");
    });
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

    // 모든 달력 갱신
    document.querySelectorAll('#calendarBox').forEach(cal => {
        renderCalendar(rangeStart, rangeEnd).then(html => {
            cal.innerHTML = html;
        });
    });
}



function formatDate(d) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
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


async function showProductList() {
    const chatBox = document.getElementById("chat");
    const container = document.createElement("div");
    container.className = "message bot";

    // 서버에서 객실 목록 가져오기
    let products = [];
    try {
        const roomData = await palaceAPI.getRooms();
        products = roomData.map(room => room.name);
        console.log('[상품목록] 서버에서 가져온 상품:', products);
    } catch (error) {
        console.error('[상품목록] 서버 조회 실패, 기본 상품 사용:', error);
        // 서버 조회 실패 시 기본 상품 목록 사용
        products = [
            "🖥️ 2PC",
            "🎥 멀티플렉스",
            "🎤 노래방",
            "🛏️ 스탠다드",
            "🛌 트윈"
        ];
    }

    products.forEach(p => {
        const btn = document.createElement("button");
        btn.className = "bot-option";
        btn.textContent = p;
        btn.onclick = () => {
            // 상품 선택
            selectedProduct = p;
            selectedRoom = p;
            const input = document.getElementById("customInput");
            // 기존 캡슐 제거
            const old = input.querySelector(".capsule-room");
            if (old) input.removeChild(old);
            // 새 캡슐 추가
            const capsule = document.createElement("span");
            capsule.className = "capsule capsule-room";
            capsule.textContent = p;
            input.appendChild(capsule);
            
            // 상품 선택 후 달력 다시 렌더링 (마감된 날짜 비활성화)
            const cal = document.getElementById("calendarBox");
            if (cal) {
                renderCalendar(rangeStart, rangeEnd).then(html => {
                    cal.innerHTML = html;
                });
            }
        };
        container.appendChild(btn);
    });

    // 반드시 appendChild로 추가!
    chatBox.appendChild(container);
}

// selectProduct 함수는 더 이상 자동으로 날짜 선택으로 넘어가지 않도록 수정 또는 사용하지 않음

function handleBackspace(event) {
    if (event.key === "Backspace") {
        if (rangeEnd) rangeEnd = null;
        else if (rangeStart) rangeStart = null;
        updateSelectedRangeUI();
    }
}

async function submitSelectedDate() {
    // 입력창의 내용 가져오기
    const input = document.getElementById("customInput");
    const inputText = input.innerText.trim();
    
    // 입력창에 내용이 있으면 먼저 표시
    if (inputText) {
        appendMessage(inputText, "user");
        input.innerHTML = ""; // 입력창 비우기
    }
    
    // 상품으로 예약 플로우에서 객실이 비어있고 상품이 선택된 경우 자동 할당
    if (!selectedRoom && selectedProduct) {
        selectedRoom = selectedProduct;
    }

    // 날짜와 룸이 모두 선택되었는지 확인
    if (rangeStart && selectedRoom) {
        await showPaymentButton();
    } else if (rangeStart && !selectedRoom) {
        appendMessage("객실을 선택해주세요.");
        showRoomButtons();
    } else if (!rangeStart && selectedRoom) {
        appendMessage("날짜를 선택해주세요.");
        // 달력 띄우기
        removeOldCalendars(); // 기존 달력 삭제
        const cal = document.createElement("div");
        cal.className = "message bot";
        cal.id = "calendarBox";
        disableOldCalendars();
        renderCalendar().then(html => {
            cal.innerHTML = html;
        });
        document.getElementById("chat").appendChild(cal);
    } else {
        appendMessage("날짜와 객실을 모두 선택해주세요.");
    }
}



// 날짜를 YYYY-MM-DD 포맷으로 변환하는 함수
function formatDateYMD(date) {
    if (typeof date === 'string') date = new Date(date);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 요일을 숫자로 반환하는 함수 (0: 일요일, 1: 월요일, ..., 6: 토요일)
function getDayOfWeek(date) {
    if (typeof date === 'string') date = new Date(date);
    return date.getDay();
}

// 선택한 날짜 범위에서 객실 판매/마감 상태 확인
async function checkRoomAvailability(startDate, endDate, roomName) {
    console.log('[재고확인] 시작:', { startDate, endDate, roomName });
    try {
        const isOvernight = endDate && new Date(endDate) > new Date(startDate);
        const roomType = isOvernight ? 'overnight' : 'daily';
        console.log('[재고확인] 예약 타입:', { isOvernight, roomType });
        
        if (isOvernight) {
            // 숙박 예약 (이틀 이상) - 모든 날짜가 숙박 판매 상태여야 함
            console.log('[재고확인] 숙박 예약 확인');
            let isAvailable = true;
            for (let dt = new Date(startDate); dt < new Date(endDate); dt.setDate(dt.getDate() + 1)) {
                const dateStr = formatDateYMD(dt);
                console.log('[재고확인] 날짜 확인:', dateStr);
                
                // 1. daily_prices 테이블에서 숙박 상태 우선 확인
                const dailyPrices = await palaceAPI.getDailyPrices(dateStr, 'overnight');
                const roomDailyPrice = dailyPrices.find(p => 
                    p.room_id === roomName || 
                    p.room_type === roomName ||
                    p.room_id === roomName.replace('객실 ', 'room').toLowerCase() ||
                    p.room_id === roomName.replace('객실 ', 'room') ||
                    p.room_id === roomName.replace('객실 ', 'room').toUpperCase()
                );
                
                if (roomDailyPrice) {
                    // daily_prices에 데이터가 있으면 해당 상태 사용
                    if (roomDailyPrice.status !== 1) {
                        console.log('[재고확인] daily_prices 숙박 마감 발견:', { roomName, dateStr, status: roomDailyPrice.status });
                        isAvailable = false;
                        break;
                    }
                } else {
                    // 2. rooms 테이블에서 숙박 상태 확인
                    const roomInfo = await palaceAPI.getRoomInfo(roomName);
                    if (roomInfo && roomInfo.status) {
                        const dayOfWeek = getDayOfWeek(dt);
                        const statusArray = JSON.parse(roomInfo.status);
                        if (statusArray && statusArray[dayOfWeek] !== undefined && statusArray[dayOfWeek] !== 1) {
                            console.log('[재고확인] rooms 테이블 숙박 마감 발견:', { roomName, dateStr, dayOfWeek, status: statusArray[dayOfWeek] });
                            isAvailable = false;
                            break;
                        }
                    }
                }
            }
            console.log('[재고확인] 숙박 최종 결과:', isAvailable);
            return isAvailable;
        } else {
            // 대실 예약 (하루) - 해당 날짜가 대실 판매 상태여야 함
            console.log('[재고확인] 대실 예약 확인');
            const dateStr = formatDateYMD(startDate);
            console.log('[재고확인] 날짜 확인:', dateStr);
            
            // 1. daily_prices 테이블에서 대실 상태 우선 확인
            const dailyPrices = await palaceAPI.getDailyPrices(dateStr, 'daily');
            const roomDailyPrice = dailyPrices.find(p => 
                p.room_id === roomName || 
                p.room_type === roomName ||
                p.room_id === roomName.replace('객실 ', 'room').toLowerCase() ||
                p.room_id === roomName.replace('객실 ', 'room') ||
                p.room_id === roomName.replace('객실 ', 'room').toUpperCase()
            );
            
            if (roomDailyPrice) {
                // daily_prices에 데이터가 있으면 해당 상태 사용
                const result = roomDailyPrice.status === 1;
                console.log('[재고확인] daily_prices 대실 결과:', { roomName, dateStr, status: roomDailyPrice.status, result });
                return result;
            } else {
                // 2. rooms 테이블에서 대실 상태 확인
                const roomInfo = await palaceAPI.getRoomInfo(roomName);
                if (roomInfo && roomInfo.rentalStatus) {
                    const dayOfWeek = getDayOfWeek(startDate);
                    const rentalStatusArray = JSON.parse(roomInfo.rentalStatus);
                    const result = rentalStatusArray && rentalStatusArray[dayOfWeek] !== undefined ? rentalStatusArray[dayOfWeek] === 1 : true;
                    console.log('[재고확인] rooms 테이블 대실 결과:', { roomName, dateStr, dayOfWeek, status: rentalStatusArray?.[dayOfWeek], result });
                    return result;
                }
            }
            
            // 기본값: 예약 가능
            console.log('[재고확인] 대실 기본값: 예약 가능');
            return true;
        }
    } catch (error) {
        console.error('[재고확인] 오류:', error);
        return true; // 오류 시 예약 가능한 것으로 처리
    }
}

// 객실 가격 조회 (daily_price 우선, 없으면 rooms 테이블에서 요일별 가격)
async function getRoomPrice(startDate, endDate, roomName) {
    console.log('[가격조회] 시작:', { startDate, endDate, roomName });
    try {
        const isOvernight = endDate && new Date(endDate) > new Date(startDate);
        const roomType = isOvernight ? 'overnight' : 'daily';
        console.log('[가격조회] 예약 타입:', { isOvernight, roomType });
        
        // 1. daily_prices 테이블에서 우선 조회
        const startDateStr = formatDateYMD(startDate);
        console.log('[가격조회] daily_prices 조회:', { date: startDateStr, roomType });
        const dailyPrices = await palaceAPI.getDailyPrices(startDateStr, roomType);
        console.log('[가격조회] daily_prices 결과:', dailyPrices);
        const roomDailyPrice = dailyPrices.find(p => 
            p.room_id === roomName || 
            p.room_type === roomName ||
            p.room_id === roomName.replace('객실 ', 'room').toLowerCase() || // 객실 A -> roomA 매칭
            p.room_id === roomName.replace('객실 ', 'room') || // 객실 A -> roomA 매칭 (대소문자 유지)
            p.room_id === roomName.replace('객실 ', 'room').toUpperCase() // 객실 A -> ROOMA 매칭
        );
        console.log('[가격조회] 해당 객실 daily_price:', roomDailyPrice);
        
        if (roomDailyPrice && roomDailyPrice.status === 1) {
            console.log('[가격조회] daily_prices 사용:', roomDailyPrice);
            return roomDailyPrice.price;
        }
        
        // 2. daily_prices에 없으면 rooms 테이블에서 요일별 가격 조회
        console.log('[가격조회] rooms 테이블 조회:', roomName);
        const roomInfo = await palaceAPI.getRoomInfo(roomName);
        console.log('[가격조회] roomInfo 결과:', roomInfo);
        if (roomInfo) {
            const dayOfWeek = getDayOfWeek(startDate);
            console.log('[가격조회] 요일:', dayOfWeek);
            let priceArray;
            
            if (isOvernight) {
                // 숙박 가격
                priceArray = JSON.parse(roomInfo.price || '[]');
                console.log('[가격조회] 숙박 가격 배열:', priceArray);
            } else {
                // 대실 가격
                priceArray = JSON.parse(roomInfo.rentalPrice || '[]');
                console.log('[가격조회] 대실 가격 배열:', priceArray);
            }
            
            if (priceArray && priceArray[dayOfWeek] !== undefined) {
                console.log('[가격조회] rooms 테이블 사용:', { roomName, dayOfWeek, price: priceArray[dayOfWeek] });
                return priceArray[dayOfWeek];
            }
        }
        
        // 3. 가격 정보를 찾을 수 없음 - 통신 오류로 처리
        console.log('[가격조회] 가격 정보를 찾을 수 없음:', { roomName, isOvernight });
        throw new Error('가격 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
        
    } catch (error) {
        console.error('[가격조회] 오류:', error);
        throw new Error('가격 조회 중 통신 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
}

async function showPaymentButton() {
    const chatBox = document.getElementById("chat");
    const container = document.createElement("div");
    container.className = "message bot";

    // 판매/마감 상태 확인
    const isAvailable = await checkRoomAvailability(rangeStart, rangeEnd, selectedRoom);
    if (!isAvailable) {
        appendMessage("❌ 선택하신 날짜에 해당 객실이 마감되었습니다. 다른 날짜나 객실을 선택해주세요.", "bot");
        return;
    }

    // 박 수 계산
    let nights = 1;
    if (rangeStart && rangeEnd) {
        const ms = new Date(rangeEnd) - new Date(rangeStart);
        nights = Math.round(ms / (1000 * 60 * 60 * 24));
    }
    
    let amount;
    try {
        if (nights > 1) {
            // 숙박 예약: 마지막날을 제외한 날들의 숙박 가격을 더함
            console.log('[결제금액] 숙박 예약 가격 계산 시작');
            amount = 0;
            
            for (let dt = new Date(rangeStart); dt < new Date(rangeEnd); dt.setDate(dt.getDate() + 1)) {
                const dateStr = formatDateYMD(dt);
                const dayPrice = await getRoomPrice(dt, null, selectedRoom); // 해당 날짜의 숙박 가격
                console.log('[결제금액] 날짜별 가격:', { date: dateStr, price: dayPrice });
                amount += dayPrice;
            }
            
            console.log('[결제금액] 숙박 총 가격:', amount);
        } else {
            // 대실 예약: 해당 날짜의 대실 가격
            const price = await getRoomPrice(rangeStart, rangeEnd, selectedRoom);
            console.log('[결제금액] 선택된 객실:', selectedRoom, '가격:', price);
            amount = price;
        }
    } catch (error) {
        console.error('[결제금액] 가격 계산 오류:', error);
        appendMessage(`❌ ${error.message}`, "bot");
        return;
    }

    // 고객 타입별 할인 적용
    let discountMsg = "";
    let finalAmount = amount;
    if (userType === "first") {
        finalAmount = Math.round(amount * 0.5);
        discountMsg = `🎉 첫방문 고객 반값 할인 적용!\n원래 가격: ${amount.toLocaleString()}원 → 할인 가격: ${finalAmount.toLocaleString()}원`;
    } else if (userType === "recent") {
        finalAmount = Math.round(amount * 0.8);
        discountMsg = `💰 재방문 고객 20% 할인 적용!\n원래 가격: ${amount.toLocaleString()}원 → 할인 가격: ${finalAmount.toLocaleString()}원`;
    } else {
        discountMsg = `할인 없음 (오랜만에 방문해주셔서 감사합니다!)\n결제 금액: ${finalAmount.toLocaleString()}원`;
    }

    // 결제 버튼 위에 할인 안내 메시지 출력
    appendMessage(discountMsg, "bot");

    const btn = document.createElement("button");
    btn.className = "bot-option";
    btn.textContent = `${finalAmount.toLocaleString()}원 결제하기`;
    btn.onclick = () => processPayment("자동"); // 결제수단은 의미 없음

    container.appendChild(btn);
    chatBox.appendChild(container);
}

// 토스페이먼츠 결제 처리
function processPayment(paymentMethod) {
    appendMessage('⚠️ 테스트 페이지이므로 결제 과정 없이 예약이 바로 진행됩니다.', 'user');
    appendMessage("예약을 진행합니다...", "bot");
    // 서버에 예약 정보 요청 (결제 없이 바로 예약)
    const payload = {
        username: username,
        phone: userphone,
        room: selectedRoom,
        startDate: rangeStart?.toISOString().split('T')[0],
        endDate: rangeEnd?.toISOString().split('T')[0] || null,
        amount: finalAmount // 계산된 최종 가격 전송
    };
    palaceAPI.createReservation(payload)
    .then(data => {
        if (data.success) {
            appendMessage('✅ 예약이 접수되었습니다! 예약 확정 대기 중입니다.', 'bot');
            // 필요하다면 예약 내역 새로고침 함수 호출
            // showReservationList();
        } else {
            appendMessage("❌ 예약 처리 중 오류가 발생했습니다.", "bot");
        }
    })
    .catch(err => {
        appendMessage("❌ 서버 통신 오류가 발생했습니다.", "bot");
    });
}

function requestTossPayment(paymentData, paymentMethod) {
    const clientKey = "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
    const payType = getTossPayType(paymentMethod);

    console.log("결제 팝업 오픈 시도");
    const popupWidth = 700;
    const popupHeight = 900;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;
    const popup = window.open('', 'tossPopup', `width=${popupWidth},height=${popupHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
    if (!popup) {
        alert('팝업 차단을 해제해주세요!');
        return;
    }
    console.log("팝업 오픈 성공");

    // 1. HTML만 먼저 작성 (script 태그 없이)
    popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset=\"UTF-8\">
            <title>결제창</title>
        </head>
        <body>
            <p>결제창을 불러오는 중입니다...</p>
        </body>
        </html>
    `);
    popup.document.close(); // ★ 반드시 호출!

    // 2. 약간의 딜레이 후 script 삽입
    setTimeout(() => {
        console.log("팝업에 TossPayments 스크립트 삽입 시도");
        const script = popup.document.createElement('script');
        script.src = "https://js.tosspayments.com/v1/payment";
        script.onload = function() {
            console.log("[팝업] TossPayments 스크립트 로드됨");
            try {
                popup.TossPayments(clientKey)
                    .requestPayment(payType, {
                        amount: paymentData.amount,
                        orderId: paymentData.orderId,
                        orderName: paymentData.orderName,
                        customerName: paymentData.customerName,
                        customerEmail: paymentData.customerEmail,
                        successUrl: window.location.origin + "/success",
                        failUrl: window.location.origin + "/fail"
                    });
                console.log("[팝업] 결제 함수 호출됨");
            } catch (e) {
                console.error("[팝업] 결제 함수 에러:", e);
                popup.alert && popup.alert("[팝업] 결제 함수 에러: " + e.message);
            }
        };
        script.onerror = function() {
            console.error("[팝업] TossPayments 스크립트 로드 실패");
            popup.alert && popup.alert("[팝업] TossPayments 스크립트 로드 실패");
        };
        popup.document.body.appendChild(script);
    }, 100); // 100ms 딜레이

    function getTossPayType(method) {
        if (method.includes('카카오페이')) return '카카오페이';
        if (method.includes('네이버페이')) return '네이버페이';
        if (method.includes('계좌이체')) return '계좌이체';
        return '카드';
    }
}

// renderCalendar 함수 - 선택된 상품이 마감된 날짜들을 비활성화
async function renderCalendar(selectedStart = null, selectedEnd = null) {
    const year = calendarYear;
    const month = calendarMonth;

    const firstDate = new Date(year, month, 1);
    const firstDay = firstDate.getDay(); // 0: 일요일
    const startDate = new Date(firstDate);
    startDate.setDate(1 - firstDay); // 달력 시작일 (해당 월의 첫 일요일)

    let html = `
        <div class="calendar-nav">
            <button onclick="changeMonth(-1)">◀</button>
            <div class="calendar-title"><strong>${year}년 ${month + 1}월</strong></div>
            <button onclick="changeMonth(1)">▶</button>
        </div>
        <div class="calendar-grid">
            ${["일", "월", "화", "수", "목", "금", "토"].map(d => `<div class="calendar-day-label">${d}</div>`).join("")}
    `;

    const days = [];
    for (let i = 0; i < 35; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // 선택된 상품이 있으면 해당 상품의 마감된 날짜들 확인
    let unavailableDates = new Set();
    if (selectedProduct) {
        console.log('[달력] 선택된 상품 확인:', selectedProduct);
        try {
            // 해당 월의 모든 날짜에 대해 상품 가용성 확인
            for (let dt = new Date(year, month, 1); dt <= new Date(year, month + 1, 0); dt.setDate(dt.getDate() + 1)) {
                const isAvailable = await checkRoomAvailability(dt, null, selectedProduct);
                if (!isAvailable) {
                    unavailableDates.add(formatDateYMD(dt));
                }
            }
            console.log('[달력] 마감된 날짜들:', Array.from(unavailableDates));
        } catch (error) {
            console.error('[달력] 상품 가용성 확인 오류:', error);
        }
    }
    
    for (let i = 0; i < days.length; i++) {
        const currentDate = days[i];
        let classes = "calendar-cell";
        const isInMonth = currentDate.getMonth() === month;
        const isStart = selectedStart && currentDate.toDateString() === selectedStart.toDateString();
        const isEnd = selectedEnd && currentDate.toDateString() === selectedEnd.toDateString();
        const isInRange = selectedStart && selectedEnd && currentDate > selectedStart && currentDate < selectedEnd;
        const isToday = currentDate.toDateString() === today.toDateString();
        const isPast = currentDate < today;
        const isUnavailable = unavailableDates.has(formatDateYMD(currentDate));
        
        if (isToday) classes += " today";
        if (!isInMonth) classes += " inactive";
        if (isStart || isEnd) classes += " selected";
        else if (isInRange) classes += " range";
        if (isPast || isUnavailable) classes += " inactive";
        
        // 날짜 포맷을 항상 두 자리로 맞춤
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        
        const isDisabled = isPast || isUnavailable;
        html += `
            <button class="${classes}" ${isDisabled ? 'disabled' : ''} onclick="selectDate('${y}-${m}-${d}')">
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
    if (cal) {
        renderCalendar(rangeStart, rangeEnd).then(html => {
            cal.innerHTML = html;
        });
    }
}
window.changeMonth = changeMonth;

function selectDate(dateStr) {
    if (!calendarEnabled) return;
    const d = new Date(dateStr);
    // 같은 날짜를 두 번 클릭하면 선택 취소
    if (rangeStart && !rangeEnd && d.toDateString() === rangeStart.toDateString()) {
        rangeStart = null;
        rangeEnd = null;
        updateSelectedRangeUI();
        return;
    }
    if (!rangeStart || (rangeStart && rangeEnd)) {
        rangeStart = d;
        rangeEnd = null;
    } else {
        if (d < rangeStart) rangeStart = d;
        else rangeEnd = d;
    }
    updateSelectedRangeUI();
    // 다음 단계로 자동 진행하지 않음 (전송 버튼에서 처리)
}

// Socket.IO 클라이언트 라이브러리 로드
if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    document.head.appendChild(script);
}

// Socket.IO 이벤트 리스너 설정 함수
function setupSocketEventListeners() {
    palaceAPI.onSocketEvent('reservation-confirmed', (data) => {
        // 관리자 승인 후 예약 확정 알림
        setTimeout(() => {
            appendMessage('🎉 예약이 확정되었습니다! 관리자 승인 완료.', 'bot');
        }, 100);
    });

    palaceAPI.onSocketEvent('reservation-cancelled', (data) => {
        // 관리자 취소 후 예약 취소 알림
        setTimeout(() => {
            appendMessage('❌ 예약이 취소되었습니다. 관리자에 의해 취소 처리되었습니다.', 'bot');
        }, 100);
    });
}





function disableOldCalendars() {
    document.querySelectorAll('#calendarBox').forEach(el => {
        el.dataset.active = "false";
        el.querySelectorAll('button').forEach(btn => btn.disabled = true);
    });
}

function removeOldCalendars() {
    document.querySelectorAll('#calendarBox').forEach(el => el.remove());
}

// 달력 생성 전 기존 달력 비활성화, 새 달력만 활성화
function activateNewCalendar(cal) {
    // 기존 달력 모두 비활성화
    document.querySelectorAll('#calendarBox').forEach(el => {
        el.dataset.active = "false";
        el.querySelectorAll('button').forEach(btn => btn.disabled = true);
    });
    // 새 달력 활성화
    cal.dataset.active = "true";
}

// 닉네임+뒷번호가 정해지는 시점(전화번호 인증 후)
function onNicknameAssigned(nick, phone) {
    userNick = `${nick}(${phone.slice(-4)})`;
    // 지금까지 쌓인 로그를 서버로 전송
    logBuffer.forEach(log => {
        log.nick = userNick;
        sendLogToServer(log);
    });
    logBuffer = [];
}
