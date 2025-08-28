class PalaceBookingAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.socket = null;
    }

    connectSocket(phone) {
        if (typeof io === 'undefined') {
            setTimeout(() => this.connectSocket(phone), 200);
            return;
        }
        
        this.socket = io();
        this.socket.emit('join', phone);
        
        // 연결 완료 후 콜백 실행
        this.socket.on('connect', () => {
            console.log('Socket.IO 연결 완료');
        });
        
        return this.socket;
    }

    onSocketEvent(event, callback) {
        if (this.socket) {
            // 기존 이벤트 리스너 제거 (중복 등록 방지)
            this.socket.off(event);
            // 새로운 이벤트 리스너 등록
            this.socket.on(event, callback);
        }
    }

    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

window.palaceAPI = new PalaceBookingAPI(); 