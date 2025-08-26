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

        this.reply = {
            floatings: [],
            chats: [],
        }

        this.state = this.transitions.main;

        this.transitions = {
            main: [
                { 
                    next: 'register',
                    trigger: (msg) => msg === '고객 등록' 
                },
                { 
                    next: 'reservation',
                    trigger: (msg) => msg === '예약 확인' 
                },
                { 
                    next: 'history',
                    trigger: (msg) => msg === '예약 내역' 
                },
                { 
                    next: 'contact',
                    trigger: (msg) => msg === '문의하기' 
                },
            ],
            register: [ 
                { 
                    next: 'main',
                    trigger: (msg) => onRegister(msg),
                    action: () => sendMessage(this.user.szPhone)
                },
                { 
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
            reservation: [ 
                {
                    next: 'ask_reservation',
                    trigger: (msg) => onAuthorize(msg)
                },
                { 
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
            ask_reservation: [ 
                {
                    next: 'ask_date',
                    trigger: (msg) => msg === '날짜로 예약하기'
                },
                {
                    next: 'ask_room',
                    trigger: (msg) => msg === '객실로 예약하기'
                },
                { 
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
            ask_date: [ 
                {
                    next: 'confirm_reservation',
                    trigger: (msg) => isReadyToReservation(msg)
                },
                {
                    next: 'ask_room',
                    trigger: (msg) => setDate(msg)
                },
                {
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
            ask_room: [ 
                {
                    next: 'confirm_reservation',
                    trigger: (msg) => isReadyToReservation(msg)
                },
                {
                    next: 'ask_date',
                    trigger: (msg) => setRoom(msg)
                },
                {
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
            confirm_reservation: [ 
                {
                    next: 'ask_date',
                    trigger: (msg) => msg === '날짜 변경하기',
                    action: () => this.reservation.szDateRange = [null, null]
                },
                {
                    next: 'ask_room',
                    trigger: (msg) => msg === '객실 변경하기',
                    action: () => this.reservation.nRoomId = null
                },
                {
                    next: 'main',
                    trigger: (msg) => msg === '예약하기'
                },
                {
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                }
            ],
            history: [ 
                {
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
            contact: [ 
                {
                    next: 'ask_contact',
                    trigger: (msg) => msg !== '취소하기'
                },
                { 
                    next: 'main',
                    trigger: (msg) => msg === '취소하기' 
                },
            ],
        }
    }


    

    reply(szMessage) {
        this.state.forEach(transition => {
            if(transition.trigger(szMessage)) {
                transition.action();

                this.state = transition.next;
                this.reply= this.replies[this.state];

                return this.reply;
            }
        });
    }
}
