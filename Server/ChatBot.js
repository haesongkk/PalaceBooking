class ChatBot {
    constructor() {
        this.user = {
            nCustomerId: null,
            szPhone: null,
        }

        this.reservation = {
            nRoomId: null,
            szDateRange: [null, null],
        }

        this.handler = this.onInit;

        this.fsm = {};
        this.fsm["init"] = {
            enter: () => {
                this.setFltn([
                    "고객 등록",
                    "예약하기",
                    "예약 조회",
                    "문의하기"
                ]);
                this.sendMsg([
                    "팔레스 호텔 팀이 함께 인사드립니다!",
                    "![image](DAR06253-Enhanced-NR.jpg)",
                    "더 빠른 예약 안내를 위해 연락처를 남겨주시면 입력하신 번호는 예약 안내에만 안전하게 사용됩니다. 😊",
                    "원하시는 메뉴를 선택해 주세요.",
                ]);
            },
            on: (msg)=>{ this.setState("처음으로"); },
            exit: () => { }
        };

        this.fsm["처음으로"] = {
            enter: () => {
                this.setFltn([ 
                    "고객 등록", 
                    "예약하기", 
                    "예약 조회", 
                    "문의하기" 
                ]);
                this.sendMsg([ "무엇을 도와드릴까요?" ]);
            },
            on: (msg)=>{ 
                if(!msg.endsWith("-fltn")) return false;
                const fltn = msg.split("-fltn")[0];
                this.setState(fltn);
                return true;
            },
            exit: () => { }
        }

        this.fsm["고객 등록"] = {
            enter: () => {
                this.setFltn(["[userPhone]", "처음으로"]);
                this.sendMsg([
                    "✔️ 재방문 할인과 빠른 예약 안내만을 위해 고객 정보를 사용합니다.",
                    "❌ 불필요한 마케팅 문자는 보내지 않으니 안심하고 등록해 주세요.",
                    "등록 안내 문자를 받으실 핸드폰 번호를 입력해주세요."
                ]);
            },
            on: (msg)=>{
                if(msg.endsWith("-fltn")) {
                    const fltn = msg.split("-fltn")[0];
                    this.setState(fltn);
                    return true;
                }
                if(!/^~?\d{10,11}$/.test(msg)) {
                    this.set([], [
                        "올바른 휴대폰 번호를 입력해주세요."
                    ]);
                    return true;
                }
                this.user.szPhone = msg;
                this.setState("고객 등록 완료");
                return true;
            },
            exit: () => { }
        };
    }

    setFltn(fltnList) {

    }

    sendMsg(msgList) {

    }

    setState(state) {
        this.curState.exit();
        this.curState = this.fsm[state];
        this.curState.enter();
    }

    receive(szMessage) {
        if(!this.curState.on(szMessage)) {
            // state에서 응답을 처리하지 않은 경우 기본 응답 처리
            this.sendMsg([ "처리할 수 없는 요청입니다." ]);
        }
    }
}


