/**
 * PalaceBooking API Wrapper
 * 서버와의 모든 통신을 랩핑하여 사용하기 쉽게 만든 클래스
 */
class PalaceBookingAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.socket = null;
    }

    /**
     * Socket.IO 연결 설정
     * @param {string} phone - 사용자 전화번호
     */
    connectSocket(phone) {
        if (typeof io === 'undefined') {
            setTimeout(() => this.connectSocket(phone), 200);
            return;
        }
        
        this.socket = io();
        this.socket.emit('join', phone);
        
        return this.socket;
    }

    /**
     * 예약 생성
     * @param {Object} reservationData - 예약 데이터
     * @param {string} reservationData.username - 사용자 이름
     * @param {string} reservationData.phone - 전화번호
     * @param {string} reservationData.room - 객실 타입
     * @param {string} reservationData.startDate - 시작 날짜
     * @param {string} reservationData.endDate - 종료 날짜
     * @returns {Promise<Object>} 예약 결과
     */
    async createReservation(reservationData) {
        try {
            const response = await fetch(`${this.baseURL}/api/reserve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservationData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('예약 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 결제 예약 생성
     * @param {Object} paymentData - 결제 예약 데이터
     * @param {string} paymentData.username - 사용자 이름
     * @param {string} paymentData.phone - 전화번호
     * @param {string} paymentData.room - 객실 타입
     * @param {string} paymentData.startDate - 시작 날짜
     * @param {string} paymentData.endDate - 종료 날짜
     * @param {string} paymentData.paymentMethod - 결제 방법
     * @returns {Promise<Object>} 결제 예약 결과
     */
    async createPaymentReservation(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/api/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('결제 예약 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 예약 취소
     * @param {number} reservationId - 예약 ID
     * @returns {Promise<Object>} 취소 결과
     */
    async cancelReservation(reservationId) {
        try {
            const response = await fetch(`${this.baseURL}/api/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reservationId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('예약 취소 실패:', error);
            throw error;
        }
    }

    /**
     * 최근 예약 조회
     * @param {string} phone - 전화번호
     * @returns {Promise<Object>} 최근 예약 정보
     */
    async getRecentReservation(phone) {
        try {
            const response = await fetch(`${this.baseURL}/recentReserve?phone=${encodeURIComponent(phone)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('최근 예약 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 예약 내역 조회
     * @param {string} phone - 전화번호
     * @returns {Promise<Array>} 예약 내역 배열
     */
    async getReservationList(phone) {
        try {
            const response = await fetch(`${this.baseURL}/reservationList?phone=${encodeURIComponent(phone)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('예약 내역 조회 실패:', error);
            throw error;
        }
    }



    /**
     * 객실 목록 조회
     * @returns {Promise<Array>} 객실 목록
     */
    async getRooms() {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/rooms`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('객실 목록 조회 실패:', error);
            return []; // 실패 시 빈 배열 반환
        }
    }

    /**
     * 객실 재고 조회
     * @param {string} date - 날짜 (YYYY-MM-DD)
     * @returns {Promise<Array>} 객실 재고 정보
     */
    async getRoomStock(date) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/roomStock?date=${date}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('객실 재고 조회 실패:', error);
            return []; // 실패 시 빈 배열 반환
        }
    }

    /**
     * 로그 저장
     * @param {Object} logData - 로그 데이터
     * @param {string} logData.nick - 닉네임
     * @param {string} logData.sender - 발신자
     * @param {string} logData.type - 로그 타입
     * @param {string} logData.content - 로그 내용
     * @param {string} logData.timestamp - 타임스탬프
     * @returns {Promise<Object>} 저장 결과
     */
    async saveLog(logData) {
        try {
            const response = await fetch(`${this.baseURL}/api/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('로그 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 모든 로그 닉네임 조회
     * @returns {Promise<Array>} 닉네임 목록
     */
    async getAllLogNicks() {
        try {
            const response = await fetch(`${this.baseURL}/api/logs/all`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('로그 닉네임 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 특정 닉네임의 로그 조회
     * @param {string} nick - 닉네임
     * @returns {Promise<Array>} 로그 배열
     */
    async getLogsByNick(nick) {
        try {
            const response = await fetch(`${this.baseURL}/api/logs?nick=${encodeURIComponent(nick)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('로그 조회 실패:', error);
            throw error;
        }
    }

    /**
     * Socket.IO 이벤트 리스너 등록
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    onSocketEvent(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Socket.IO 연결 해제
     */
    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

// 전역 인스턴스 생성
window.palaceAPI = new PalaceBookingAPI(); 