
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
let finalAmount = 0; // 전역 변수로 선언

const botMessages = {
    welcome: [
        "팔레스 호텔 팀이 함께 인사드립니다!",
        "![image](DAR06253-Enhanced-NR.jpg)",
        "더 빠른 예약 안내를 위해 연락처를 남겨주시면 입력하신 번호는 예약 안내에만 안전하게 사용됩니다. 😊",
        "원하시는 메뉴를 선택해 주세요.",
    ],

    register: [
        "✔️ 재방문 할인과 빠른 예약 안내만을 위해 고객 정보를 사용합니다.",
        "❌ 불필요한 마케팅 문자는 보내지 않으니 안심하고 등록해 주세요.",
        "등록 안내 문자를 받으실 핸드폰 번호를 입력해주세요."
    ],

    registerSuccess: [
        "🎉 고객 등록이 완료되었습니다!",
        "다음 예약 시 금방 받으신 문자(010-9363-9955)안에 링크를 통해 언제든 간편하게 예약하실 수 있습니다.",
        "혹시 지금 바로 예약을 원하시면 아래 [예약하기] 버튼을 눌러주세요.",
        "✨ 팔레스호텔은 당신의 특별한 순간을 언제나 기다리고 있습니다."
    ],

    reservation: [
       "등록하신 번호를 입력해주세요!",
    ],

}

class ReservationInfo{
    constructor(){
        this.roomID;
        this.startDate;
        this.endDate;
        this.price;
    }
}
let reservationInfo = new ReservationInfo();
let curHandler = (text) => {};

function setFloating(menus){
    const floatingBar = document.querySelector(".floating-buttons");
    floatingBar.innerHTML = "";
    menus.forEach(menu => {
        const button = document.createElement("button");
        button.textContent = menu;
        button.className = "floating-btn";
        button.addEventListener("click", async () => {
            await handleMenu(menu);
        });
        floatingBar.appendChild(button);
    });
}

let username;
let userPhone = "01090909090";
let userID = null;
let recentStartDate;
let recentEndDate;
let recentRoomType;
let isFirstVisit = true;

function registerHandler(input)
{
    if (!/^\d{10,11}$/.test(input)){
        appendMessage("전화번호 형식이 올바르지 않습니다. 다시 입력해주세요.", "bot");
        return;
    }
    userPhone = input;
    updateHeader(userPhone.slice(-4));
    fetch(`/api/customers/register/${userPhone}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => {  

        if(res.status === 200)
            botMessages.registerSuccess.forEach(msg => {
                appendMessage(msg, "bot");
            });
        else if(res.status === 400)
            appendMessage(`${userPhone.slice(-4)}님은 이미 등록된 고객입니다.`, "bot");
        else
            appendMessage("고객 등록에 실패했습니다. 다시 시도해주세요.", "bot");

        curHandler = defaultHandler;
        setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);
    });
}

function phoneHandler(input){
    if (!/^\d{10,11}$/.test(input)){
        appendMessage("전화번호 형식이 올바르지 않습니다. 다시 입력해주세요.", "bot");
        return;
    }
    userPhone = input;
    updateHeader(userPhone.slice(-4));

    palaceAPI.connectSocket(userPhone);
    setupSocketEventListeners();


    fetch(`/api/chatbot/certify/${userPhone}`)
    .then(res => res.json()).then(data => {
        if(data.error){
            appendMessage(data.error, "bot");
            return;
        }
        data.msg.forEach(msg => {
            appendMessage(msg, "bot");
        });
        setFloating(data.floatings);
        curHandler = defaultHandler;
        if(data.id) userID = data.id;
    });
}

function historyHandler(input){
    if (!/^\d{10,11}$/.test(input)){
        appendMessage("전화번호 형식이 올바르지 않습니다. 다시 입력해주세요.", "bot");
        return;
    }
    userPhone = input;
    updateHeader(userPhone.slice(-4));

    const container = document.createElement("div");
    container.className = "message bot";
    document.querySelector(".chat-window").appendChild(container);

    // 나중에는 등록된 고객인지 확인 후 예약 내역 출력 
    // (등록된 고객이 아니면 헤더 업데이트 x)
    fetch(`/reservationList?phone=${userPhone}`).then(res => res.json()).then(data => {
        if(data.length === 0){
            container.innerHTML = "현재 예약 내역이 없습니다.";
            setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);
            return;
        }
        data.forEach(reservation => {
        const item = document.createElement("div");
        item.className = "reservation";
        container.appendChild(item);

        const reservationInfo = document.createElement("div");
        reservationInfo.className = "reservation-info";
        reservationInfo.textContent = `${reservation.room} ${reservation.start_date}${reservation.end_date? ` ~ ${reservation.end_date}` : ''} ${reservation.state === 0 ? "(대기)" : reservation.state === 1 ? "(확정)" : "(취소)"}`;
        item.appendChild(reservationInfo);

        });
    });
    setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);

}

function showCalendar(year, month, container){
    container.innerHTML = "";

    let displayYear = year;
    let displayMonth = month;

    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const calendarNav = document.createElement("div");
    calendarNav.className = "calendar-nav";
    container.appendChild(calendarNav);

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀";
    prevBtn.onclick = () => {
        if(displayMonth === todayMonth && displayYear === todayYear){
            return;
        }
        displayMonth--;
        if(displayMonth < 0){
            displayMonth = 11;
            displayYear--;
        }
        showCalendar(displayYear, displayMonth, container);
    };
    calendarNav.appendChild(prevBtn);

    const calendarTitle = document.createElement("div");
    calendarTitle.className = "calendar-title";
    calendarTitle.textContent = `${year}년 ${month + 1}월`;
    calendarNav.appendChild(calendarTitle);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "▶";
    nextBtn.onclick = () => {
        displayMonth++;
        if(displayMonth > 11){
            displayMonth = 0; 
            displayYear++;
        }
        showCalendar(displayYear, displayMonth, container);
    };
    calendarNav.appendChild(nextBtn);

    const calendarGrid = document.createElement("div");
    calendarGrid.className = "calendar-grid";
    container.appendChild(calendarGrid);
    
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    days.forEach(day => {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day-label";
        dayCell.textContent = day;
        calendarGrid.appendChild(dayCell);
    });

    const dayCells = [];
    for(let i = 0; i < 6; i++){
        dayCells[i] = [];
        for(let j = 0; j < 7; j++){
        const dayCell = document.createElement("button");
            dayCell.className = "calendar-cell";
            dayCells[i][j] = dayCell;
            calendarGrid.appendChild(dayCell);
        }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const lastMonthDate = new Date(year, month, 0).getDate();


    const prevMonth = new Date(year, month-1, 1);
    const nextMonth = new Date(year, month + 1, 1);
    

    for(let i = 0; i < startDay; i++){
        const dayCell = dayCells[0][i];
        dayCell.textContent = lastMonthDate - startDay + i + 1;
        dayCell.classList.add("inactive");
        dayCell.id = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dayCell.textContent);

    }
    for(let i = 0; i < daysInMonth; i++){
        const offset = i + startDay;
        const dayCell = dayCells[Math.floor(offset / 7)][offset % 7];
        dayCell.textContent = i + 1;
        dayCell.id = new Date(year, month, i + 1);
        dayCell.onclick = () => {
            const date = new Date(year, month, i + 1).setHours(0, 0, 0, 0);
            if(!reservationInfo.startDate){
                reservationInfo.startDate = date;
                dayCell.classList.add("selected");
            }
            else{
                if(!reservationInfo.endDate && date > reservationInfo.startDate){
                    reservationInfo.endDate = date;
                    console.log("case 1");
                }
                else if(!reservationInfo.endDate && date < reservationInfo.startDate){
                    reservationInfo.endDate = reservationInfo.startDate;
                    reservationInfo.startDate = date;
                    console.log("case 2");
                }
                else if(!reservationInfo.endDate && date === reservationInfo.startDate){
                    reservationInfo.startDate = null;
                    console.log("case 3");
                }
                else if(reservationInfo.endDate){
                    reservationInfo.startDate = date;
                    reservationInfo.endDate = null;
                    console.log("case 4");
                }
            }
            showCalendar(year, month, container);
            
        };
        if(year === todayYear && month === todayMonth){
            if(i + 1 === todayDate){
                dayCell.classList.add("today");

            }
            else if(i + 1 < todayDate){
                dayCell.classList.add("inactive");
                
            }
        }

    }
    for(let i=0; i<42-daysInMonth-startDay; i++){
        const offset = i + startDay + daysInMonth;
        const dayCell = dayCells[Math.floor(offset / 7)][offset % 7];
        dayCell.textContent = i + 1;
        dayCell.classList.add("inactive");
        dayCell.id = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dayCell.textContent);
        
    }
    if(42-daysInMonth-startDay >= 7){
        dayCells[5].forEach(cell => {
            cell.style.display = "none";
        });
    }

    if(reservationInfo.startDate){
        const rangeStart = new Date(reservationInfo.startDate).setHours(0, 0, 0, 0);
        const rangeEnd = new Date(reservationInfo.endDate? reservationInfo.endDate : reservationInfo.startDate).setHours(0, 0, 0, 0);
        console.log(rangeStart, rangeEnd);
    
        for(let i = 0; i < 42; i++){
            const dayCell = dayCells[Math.floor(i / 7)][i % 7];
            const date = new Date(dayCell.id).setHours(0, 0, 0, 0);

            if(date > rangeStart && date < rangeEnd){
                dayCell.classList.add("range");

            }
            if(date === rangeStart || date === rangeEnd){
                dayCell.classList.add("selected");
            }
        }

        let range = new Date(rangeStart).toLocaleDateString();
        if(reservationInfo.endDate){
            range += " ~ " + new Date(rangeEnd).toLocaleDateString();
        }
        setFloating([range, "취소하기"]);

    }
    else{
        setFloating(["객실 선택하기", "취소하기"]);
    }


}

function showRooms(){
    fetch(`api/rooms`).then(res => res.json()).then(data => {
        document.querySelector(".chat-window").innerHTML += `
            <div class="message bot">
                <div class="room-viewport">
                    ${data.map(room => `
                        <div class="room-card" id="${room.id}-${room.name}">
                            <h3>${room.name}</h3>
                            ${JSON.parse(room.image).map(img => `
                                <img src="${img}" style="width: 100px; height: 100px; object-fit: cover;">
                            `).join('')}
                            <p>${room.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        const thisChat = document.querySelector(".message.bot:last-child");
        const viewport = thisChat.querySelector(".room-viewport");
        const roomCards = viewport.querySelectorAll(".room-card");

        viewport.onscroll = () => {
            const cardWidth = roomCards[0].clientWidth;
            const index = Math.floor(viewport.scrollLeft / cardWidth);
            const curCard = roomCards[index];
            setFloating(["객실: " + curCard.id.split("-")[1], "취소하기"]);
            reservationInfo.roomID = curCard.id.split("-")[0];
        }
        setFloating(["객실: " + roomCards[0].id.split("-")[1], "취소하기"]);
        reservationInfo.roomID = roomCards[0].id.split("-")[0];

    });
}



async function confirmReservation(){
    if(!reservationInfo.roomID) return false;
    if(!reservationInfo.startDate) return false;

    await fetch(`/api/chatbot/confirmReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerID: userID,
            roomID: Number(reservationInfo.roomID),
            checkinDate: new Date(reservationInfo.startDate).toLocaleDateString(),
            checkoutDate: new Date(reservationInfo.endDate).toLocaleDateString(),
            price: 0
        })
    }).then(res => res.json()).then(data => {
        if(data.error) {
            appendMessage(data.error, "bot");
        }
        data.msg.forEach(msg => {
            appendMessage(msg, "bot");
        });
        setFloating(data.floatings);
        curHandler = defaultHandler;

        reservationInfo.roomID = null;
        reservationInfo.startDate = null;
        reservationInfo.endDate = null;
        reservationInfo.price = null;
    });

    return true;
}

async function checkReservation(){
    if(!reservationInfo.roomID) return false;
    if(!reservationInfo.startDate) return false;

    if(!reservationInfo.endDate) reservationInfo.endDate = new Date(reservationInfo.startDate).toLocaleDateString();
    reservationInfo.endDate = new Date(reservationInfo.endDate).setDate(new Date(reservationInfo.endDate).getDate() + 1);

    const ok = await fetch(`/api/chatbot/getReservationPrice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerID: userID,
            roomID: reservationInfo.roomID,
            checkinDate: reservationInfo.startDate,
            checkoutDate: reservationInfo.endDate
        })
    }).then(res => res.json()).then(data => {
        console.log(data);
        if(data.error) {
            appendMessage(data.error, "bot");
            return false;
        }

        data.msg.forEach(msg => {
            appendMessage(msg, "bot");
        });
        setFloating(data.floatings);
        curHandler = defaultHandler;

        return true;
    });
    return ok;
}

function disableLastBotMessage(){
    const botMessages = document.querySelectorAll('.message.bot');
    botMessages[botMessages.length - 1].querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        btn.onclick = null;
        btn.style.opacity = '0.8';
    })
}

function askHandler(text){
    appendMessage("답변 받으실 번호를 입력해주세요!", "bot");
    const menus = userPhone? [userPhone, "익명으로 보내기", "취소하기"] : ["익명으로 보내기", "취소하기"];
    curHandler = askPhoneHandler;
    setFloating(menus);
}

function askPhoneHandler(text){
    appendMessage("문의 내용을 관리자에게 전달하겠습니다.", "bot");
    setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);
    curHandler = defaultHandler;
}

async function handleMenu(type, bAppend = true) {
    disableLastBotMessage();


    
        
    if(bAppend) appendMessage(type, "user");
    let menu = type;
    if(type.includes(".")){
        menu = '객실 선택하기';
    }
    if(type.includes(":")){
        menu = '날짜 선택하기';
    }
    if(type.includes("010")){
        onSend(type, false);
    }
    if(type == "익명으로 보내기"){
        onSend(type, false);
    }

    switch(menu) {
        case '고객 등록':
            botMessages.register.forEach(msg => {
                appendMessage(msg, "bot");
            });
            curHandler = registerHandler;
            setFloating(["취소하기"]);
            break;
        case '예약하기':
            const confirmResult = await confirmReservation();
            if(!confirmResult){
                botMessages.reservation.forEach(msg => {
                    appendMessage(msg, "bot");
                });
                curHandler = phoneHandler;
                const menus = userPhone? [userPhone, "취소하기"] : ["취소하기"];
                    setFloating(menus);
            }
            break;
        case '날짜 선택하기':
            const checkResult = await checkReservation();
            if(!checkResult){
                appendMessage("이용하실 날짜를 선택해주세요.");
                    curHandler = defaultHandler;
                    setFloating(["객실 선택하기", "취소하기"]);

                    const today = new Date();
                    const calendarBox = document.createElement("div");
                    calendarBox.className = "message bot";
                    calendarBox.id = "calendarBox";
                    document.querySelector(".chat-window").appendChild(calendarBox);

                    showCalendar(today.getFullYear(), today.getMonth(), calendarBox);
            }
            
            break;
        case '객실 선택하기':
            const checkResult2 = await checkReservation();
            if(!checkResult2){
                appendMessage("이용하실 객실을 선택해주세요.");
                curHandler = defaultHandler;
                setFloating(["날짜 선택하기", "취소하기"]);
                showRooms();
            }
            break;

            
        case '예약 내역':
            appendMessage("예약하신 전화번호로 예약 내역을 확인해 드릴게요!", "bot");
            curHandler = historyHandler;
            const menus = userPhone? [userPhone, "취소하기"] : ["취소하기"];
            setFloating(menus);

            break;
        case '문의하기':
            appendMessage("문의하실 내용을 남겨주세요!", "bot");
            curHandler = askHandler;
            setFloating(["취소하기"]);

            break;

        case '객실 소개':
            appendMessage("🛏️ 객실 소개\n- 2PC, 멀티플렉스, 노래방, 스탠다드, 트윈 등 다양한 객실이 준비되어 있습니다.\n상세 요금 및 시설은 예약 메뉴에서 확인해 주세요.", "bot");

            break;
        case '팔레스 소개':
            appendMessage("🏰 팔레스 소개\n- 팔레스는 프리미엄 게스트하우스/모텔로 쾌적한 환경과 다양한 부대시설을 제공합니다.", "bot");
            break;
        case '취소하기':
            reservationInfo.startDate = null;
            reservationInfo.endDate = null;
            reservationInfo.roomID = null;
            reservationInfo.price = null;
            curHandler = defaultHandler;
            appendMessage("무엇을 도와드릴까요?");
            setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);
            break;
        case '날짜 변경하기':
            reservationInfo.startDate = null;
            reservationInfo.endDate = null;
            handleMenu('날짜 선택하기', false);
            break;
        case '객실 변경하기':
            reservationInfo.roomID = null;
            handleMenu('객실 선택하기', false);
            break;

        case '취소하기':
            reservationInfo.roomType = null;
            reservationInfo.startDate = null;
            reservationInfo.endDate = null;
            curHandler = defaultHandler;
            setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);
            break;
    }
}


function appendMessage(text, sender = "bot", type = "text") {
	console.log(sender, ": ", text);
	
    const chatBox = document.getElementById("chat");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    
    // 이미지 마크다운 처리
    if (text.includes("![image](") && text.includes(")")) {
        const imgMatch = text.match(/!\[image\]\(([^)]+)\)/);
        if (imgMatch) {
            const imgSrc = imgMatch[1];
            const img = document.createElement("img");
            img.src = imgSrc;
            img.alt = "이미지";
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.borderRadius = "8px";
            img.style.marginTop = "8px";
            msg.appendChild(img);
        }
    } else {
        msg.innerHTML = text;
    }
    
    chatBox.appendChild(msg); // 메시지를 맨 아래에 추가
    
    
    // 메시지 추가 후 스크롤 아래로 이동
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}


function onSend(text, bAppend = true){
    if(bAppend) appendMessage(text, "user");
    curHandler(text);
}
document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("customInput");

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            const text = input.textContent;
            if(text) {
                input.innerHTML = "";
                onSend(text);
            }
        }
    });
    document.querySelector('.submit-btn').onclick = () => {
        const text = input.textContent;
        if(text) {
            input.innerHTML = "";
            onSend(text);
        }
    };

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
    botMessages.welcome.forEach(msg => {
        appendMessage(msg, "bot");
    });
};


window.addEventListener('resize', () => {
  window.scrollTo(0, 0);
});


function updateHeader(nick){
    const el = document.querySelector(".chat-title");
    el.textContent = nick;
}

function defaultHandler(input) { }



function toggleQuickMenuBar() {
    const quickMenuBar = document.getElementById("quickMenuBar");
    if (!quickMenuBar) return;
    quickMenuBar.classList.toggle("hidden");
}




function cancelReservation(id) {
    fetch(`/api/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
    }).then(res => res.json()).then(data => {
        appendMessage(data.msg, "bot");
        setFloating(["고객 등록", "예약하기", "예약 내역", "문의하기"]);


    })
    .catch(() => {
        appendMessage(`❌ 서버 통신 오류로 예약 취소에 실패했습니다.`, "bot");
    });
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
            appendMessage('🎉 예약이 확정되었습니다! 팔레스호텔에서 정성껏 모시겠습니다.', 'bot');
        }, 100);
    });

    palaceAPI.onSocketEvent('reservation-cancelled', (data) => {
        // 관리자 취소 후 예약 취소 알림
        setTimeout(() => {
            appendMessage('❌ 객실 마감으로 예약이 취소되었습니다.', 'bot');
        }, 100);
    });
}



