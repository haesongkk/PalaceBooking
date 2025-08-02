/**
 * PalaceBooking Admin API Wrapper
 * 관리자 페이지에서 서버와의 모든 통신을 랩핑하여 사용하기 쉽게 만든 클래스
 */
class PalaceBookingAdminAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.socket = null;
        this.allReservations = []; // 예약 목록 저장
    }

    /**
     * Socket.IO 연결 설정 (관리자용)
     */
    connectSocket() {
        if (typeof io === 'undefined') {
            setTimeout(() => this.connectSocket(), 200);
            return;
        }
        
        this.socket = io();
        this.socket.emit('admin'); // 'admin' 방에 join
        
        return this.socket;
    }

    // ===== 예약 관리 API =====

    /**
     * 모든 예약 목록 조회 및 저장
     * @returns {Promise<Array>} 예약 목록
     */
    async fetchReservations() {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/reservations`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.allReservations = await response.json();
            return this.allReservations;
        } catch (error) {
            console.error('예약 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 저장된 예약 목록 반환
     * @returns {Array} 예약 목록
     */
    getAllReservations() {
        return this.allReservations;
    }

    /**
     * 예약 목록 새로고침
     * @returns {Promise<Array>} 새로운 예약 목록
     */
    async refreshReservations() {
        return await this.fetchReservations();
    }

    /**
     * 예약 확정
     * @param {number} reservationId - 예약 ID
     * @returns {Promise<Object>} 확정 결과
     */
    async confirmReservation(reservationId) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reservationId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('예약 확정 실패:', error);
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

    // ===== 특가 상품 관리 API =====

    /**
     * 특가 상품 목록 조회
     * @returns {Promise<Array>} 특가 상품 목록
     */
    async getSpecialProducts() {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/specials`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('특가 상품 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 특가 상품 추가
     * @param {Object} productData - 상품 데이터
     * @param {string} productData.name - 상품명
     * @param {string} productData.roomType - 객실 타입
     * @param {number} productData.price - 가격
     * @param {string} productData.start_date - 시작 날짜
     * @param {string} productData.end_date - 종료 날짜
     * @param {number} productData.stock - 재고
     * @returns {Promise<Object>} 추가 결과
     */
    async addSpecialProduct(productData) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/specials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('특가 상품 추가 실패:', error);
            throw error;
        }
    }

    /**
     * 특가 상품 수정
     * @param {number} productId - 상품 ID
     * @param {Object} productData - 상품 데이터
     * @returns {Promise<Object>} 수정 결과
     */
    async updateSpecialProduct(productId, productData) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/specials/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('특가 상품 수정 실패:', error);
            throw error;
        }
    }

    /**
     * 특가 상품 삭제
     * @param {number} productId - 상품 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteSpecialProduct(productId) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/specials/${productId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('특가 상품 삭제 실패:', error);
            throw error;
        }
    }

    // ===== 객실 관리 API =====

    /**
     * 모든 객실 조회
     * @returns {Promise<Array>} 객실 목록
     */
    async getAllRooms() {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/rooms`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('객실 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 객실 저장/수정 (upsert)
     * @param {Object} roomData - 객실 데이터
     * @param {string} roomData.id - 객실 ID
     * @param {string} roomData.name - 객실명
     * @param {string} roomData.checkInOut - 입실/퇴실 시간 (JSON)
     * @param {string} roomData.price - 가격 (JSON)
     * @param {string} roomData.status - 상태 (JSON)
     * @param {string} roomData.usageTime - 이용시간 (JSON, 정수 배열)
     * @param {string} roomData.openClose - 개시/마감 시간 (JSON)
     * @param {string} roomData.rentalPrice - 대실 가격 (JSON)
     * @param {string} roomData.rentalStatus - 대실 상태 (JSON)
     * @returns {Promise<Object>} 저장 결과
     */
    async saveRoom(roomData) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('객실 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 객실 삭제
     * @param {string} roomId - 객실 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteRoom(roomId) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/rooms/${roomId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('객실 삭제 실패:', error);
            throw error;
        }
    }

    // ===== 마감 설정 관리 API =====



    // ===== 객실 재고 관리 API =====

    /**
     * 객실별 남은 객실 수 조회
     * @returns {Promise<Object>} 객실별 재고 정보
     */
    async getRoomCounts() {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/roomCounts`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('객실 재고 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 날짜별 객실 재고 조회
     * @param {string} date - 날짜 (YYYY-MM-DD)
     * @returns {Promise<Array>} 날짜별 재고 정보
     */
    async getRoomStock(date) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/roomStock?date=${date}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('날짜별 재고 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 날짜별 객실 재고 수정
     * @param {Object} stockData - 재고 데이터
     * @param {string} stockData.date - 날짜
     * @param {string} stockData.room_type - 객실 타입
     * @param {number} stockData.reserved - 예약 수
     * @returns {Promise<Object>} 수정 결과
     */
    async updateRoomStock(stockData) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/roomStock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('재고 수정 실패:', error);
            throw error;
        }
    }

    // ===== 날짜별 요금 관리 API =====

    /**
     * 특정 날짜의 모든 객실 요금 조회
     * @param {string} date - 날짜 (YYYY-MM-DD)
     * @param {string} room_type - 객실 타입 ('daily' 또는 'overnight', 선택사항)
     * @returns {Promise<Array>} 요금 목록
     */
    async getDailyPrices(date, room_type = null) {
        try {
            let url = `${this.baseURL}/api/admin/daily-prices?date=${date}`;
            if (room_type) {
                url += `&room_type=${room_type}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('날짜별 요금 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 날짜별 요금 저장/수정
     * @param {Object} priceData - 요금 데이터
     * @param {string} priceData.date - 날짜
     * @param {string} priceData.room_id - 객실 ID
     * @param {string} priceData.room_type - 객실 타입 ('daily' 또는 'overnight')
     * @param {number} priceData.price - 가격
     * @param {number} priceData.status - 상태 (1: 판매, 0: 마감)
     * @param {string} priceData.details - 시간 정보
     * @param {string} priceData.usage_time - 이용시간 (대실용)
     * @returns {Promise<Object>} 저장 결과
     */
    async saveDailyPrice(priceData) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/daily-prices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(priceData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('날짜별 요금 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 여러 날짜의 요금 일괄 저장
     * @param {Array} prices - 요금 데이터 배열
     * @returns {Promise<Object>} 저장 결과
     */
    async saveDailyPricesBulk(prices) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/daily-prices/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prices })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('날짜별 요금 일괄 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 여러 날짜의 요금 일괄 저장 (새로운 구조 - 날짜별로 모든 객실 정보를 한 항목에 저장)
     * @param {Object} dateGroups - 날짜별 그룹화된 데이터
     * @returns {Promise<Object>} 저장 결과
     */
    async saveDailyPricesBulkNew(dateGroups) {
        try {
            // 기존 API와 호환성을 위해 prices 배열 형태로 변환
            const prices = [];
            Object.values(dateGroups).forEach(({ date, room_type, rooms_data }) => {
                Object.keys(rooms_data).forEach(room_id => {
                    const roomData = rooms_data[room_id];
                    prices.push({
                        date,
                        room_id,
                        room_type,
                        price: roomData.price,
                        status: roomData.status,
                        details: roomData.details,
                        usage_time: roomData.usage_time
                    });
                });
            });

            const response = await fetch(`${this.baseURL}/api/admin/daily-prices/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prices })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('날짜별 요금 일괄 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 날짜별 요금 삭제
     * @param {string} date - 날짜
     * @param {string} room_type - 객실 타입
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteDailyPrice(date, room_type) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/daily-prices/${date}/${room_type}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('날짜별 요금 삭제 실패:', error);
            throw error;
        }
    }

    /**
     * 스마트 저장 - 기본값과 다를 때만 저장
     * @param {Object} data - 저장 데이터
     * @param {string} data.date - 날짜
     * @param {string} data.room_type - 객실 타입
     * @param {Object} data.rooms_data - 객실별 데이터
     * @param {Object} data.default_values - 기본값 데이터
     * @returns {Promise<Object>} 저장 결과
     */
    async smartSaveDailyPrices(data) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/daily-prices/smart-save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('스마트 저장 실패:', error);
            throw error;
        }
    }

    // ===== 로그 관리 API =====

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

    // ===== Socket.IO 이벤트 관리 =====

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

    // ===== 유틸리티 메서드 =====

    /**
     * 날짜 포맷팅 (YYYY-MM-DD)
     * @param {Date} date - 날짜 객체
     * @returns {string} 포맷된 날짜 문자열
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 에러 처리 헬퍼
     * @param {Error} error - 에러 객체
     * @param {string} operation - 작업명
     */
    handleError(error, operation) {
        console.error(`${operation} 실패:`, error);
        alert(`${operation} 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 전역 인스턴스 생성
window.adminAPI = new PalaceBookingAdminAPI(); 