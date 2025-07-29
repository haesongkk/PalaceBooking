# PalaceBooking API 랩퍼 사용 가이드

이 문서는 PalaceBooking 프로젝트에서 서버 API를 랩핑하여 사용하는 방법을 설명합니다.

## 개요

서버와의 모든 통신을 랩핑하여 다음과 같은 이점을 제공합니다:

- **일관된 에러 처리**: 모든 API 호출에서 동일한 에러 처리 방식
- **코드 재사용성**: 중복된 fetch 코드 제거
- **유지보수성**: API 엔드포인트 변경 시 한 곳에서만 수정
- **타입 안전성**: JSDoc을 통한 매개변수 타입 명시

## 클라이언트 API 랩퍼 (PalaceBookingAPI)

### 초기화

```javascript
// 전역 인스턴스가 자동으로 생성됩니다
// window.palaceAPI로 접근 가능
```

### 예약 관련 API

#### 예약 생성
```javascript
const reservationData = {
    username: "홍길동",
    phone: "01012345678",
    room: "🛏️ 스탠다드 (45,000원)",
    startDate: "2024-01-15",
    endDate: "2024-01-16"
};

try {
    const result = await palaceAPI.createReservation(reservationData);
    console.log('예약 성공:', result);
} catch (error) {
    console.error('예약 실패:', error);
}
```

#### 예약 취소
```javascript
try {
    const result = await palaceAPI.cancelReservation(123);
    if (result.success) {
        console.log('예약 취소 성공');
    }
} catch (error) {
    console.error('예약 취소 실패:', error);
}
```

#### 최근 예약 조회
```javascript
try {
    const recentReservation = await palaceAPI.getRecentReservation("01012345678");
    console.log('최근 예약:', recentReservation);
} catch (error) {
    console.error('최근 예약 조회 실패:', error);
}
```

#### 예약 내역 조회
```javascript
try {
    const reservations = await palaceAPI.getReservationList("01012345678");
    console.log('예약 내역:', reservations);
} catch (error) {
    console.error('예약 내역 조회 실패:', error);
}
```

### 특가 상품 API

#### 특가 상품 목록 조회
```javascript
try {
    const specials = await palaceAPI.getSpecialProducts();
    console.log('특가 상품:', specials);
} catch (error) {
    console.error('특가 상품 조회 실패:', error);
}
```

### 객실 재고 API

#### 날짜별 객실 재고 조회
```javascript
try {
    const stock = await palaceAPI.getRoomStock("2024-01-15");
    console.log('객실 재고:', stock);
} catch (error) {
    console.error('재고 조회 실패:', error);
}
```

### 로그 API

#### 로그 저장
```javascript
const logData = {
    nick: "사용자닉네임",
    sender: "user",
    type: "text",
    content: "안녕하세요",
    timestamp: new Date().toISOString()
};

try {
    await palaceAPI.saveLog(logData);
    console.log('로그 저장 성공');
} catch (error) {
    console.error('로그 저장 실패:', error);
}
```

#### 로그 닉네임 목록 조회
```javascript
try {
    const nicks = await palaceAPI.getAllLogNicks();
    console.log('로그 닉네임 목록:', nicks);
} catch (error) {
    console.error('로그 닉네임 조회 실패:', error);
}
```

#### 특정 닉네임의 로그 조회
```javascript
try {
    const logs = await palaceAPI.getLogsByNick("사용자닉네임");
    console.log('사용자 로그:', logs);
} catch (error) {
    console.error('로그 조회 실패:', error);
}
```

### Socket.IO 연결

#### 소켓 연결
```javascript
// 전화번호로 소켓 연결
palaceAPI.connectSocket("01012345678");
```

#### 이벤트 리스너 등록
```javascript
// 예약 확정 이벤트 리스너
palaceAPI.onSocketEvent('reservation-confirmed', (data) => {
    console.log('예약이 확정되었습니다:', data);
    // UI 업데이트 로직
});
```

#### 소켓 연결 해제
```javascript
palaceAPI.disconnectSocket();
```

## 관리자 API 랩퍼 (PalaceBookingAdminAPI)

### 초기화

```javascript
// 전역 인스턴스가 자동으로 생성됩니다
// window.adminAPI로 접근 가능
```

### 예약 관리 API

#### 모든 예약 목록 조회
```javascript
try {
    const reservations = await adminAPI.getAllReservations();
    console.log('모든 예약:', reservations);
} catch (error) {
    console.error('예약 목록 조회 실패:', error);
}
```

#### 예약 확정
```javascript
try {
    const result = await adminAPI.confirmReservation(123);
    if (result.success) {
        console.log('예약 확정 성공');
    }
} catch (error) {
    adminAPI.handleError(error, '예약 확정');
}
```

### 특가 상품 관리 API

#### 특가 상품 추가
```javascript
const productData = {
    name: "특가 상품명",
    roomType: "🛏️ 스탠다드 (45,000원)",
    price: 35000,
    start_date: "2024-01-15",
    end_date: "2024-01-31",
    stock: 10
};

try {
    const result = await adminAPI.addSpecialProduct(productData);
    console.log('특가 상품 추가 성공:', result);
} catch (error) {
    adminAPI.handleError(error, '특가 상품 추가');
}
```

#### 특가 상품 수정
```javascript
const updateData = {
    name: "수정된 상품명",
    price: 40000
};

try {
    const result = await adminAPI.updateSpecialProduct(1, updateData);
    console.log('특가 상품 수정 성공:', result);
} catch (error) {
    adminAPI.handleError(error, '특가 상품 수정');
}
```

#### 특가 상품 삭제
```javascript
try {
    const result = await adminAPI.deleteSpecialProduct(1);
    if (result.success) {
        console.log('특가 상품 삭제 성공');
    }
} catch (error) {
    adminAPI.handleError(error, '특가 상품 삭제');
}
```

### 객실 관리 API

#### 객실 저장/수정
```javascript
const roomData = {
    id: "roomA",
    name: "객실 A",
    checkInOut: JSON.stringify(Array(7).fill("16:00~13:00")),
    price: JSON.stringify(Array(7).fill("50000원")),
    status: JSON.stringify(Array(7).fill(1)),
    usageTime: JSON.stringify(Array(7).fill(5)),
    openClose: JSON.stringify(Array(7).fill("14:00~22:00")),
    rentalPrice: JSON.stringify(Array(7).fill("30000원")),
    rentalStatus: JSON.stringify(Array(7).fill(1))
};

try {
    const result = await adminAPI.saveRoom(roomData);
    console.log('객실 저장 성공:', result);
} catch (error) {
    adminAPI.handleError(error, '객실 저장');
}
```

#### 객실 삭제
```javascript
try {
    const result = await adminAPI.deleteRoom("roomA");
    if (result.success) {
        console.log('객실 삭제 성공');
    }
} catch (error) {
    adminAPI.handleError(error, '객실 삭제');
}
```

### 마감 설정 관리 API

#### 마감 설정 저장
```javascript
const closureData = {
    id: "closure_20240115",
    date: "2024-01-15",
    rooms: JSON.stringify(["객실 A", "객실 B"])
};

try {
    const result = await adminAPI.saveClosure(closureData);
    console.log('마감 설정 저장 성공:', result);
} catch (error) {
    adminAPI.handleError(error, '마감 설정 저장');
}
```

### 객실 재고 관리 API

#### 객실별 재고 조회
```javascript
try {
    const counts = await adminAPI.getRoomCounts();
    console.log('객실별 재고:', counts);
} catch (error) {
    adminAPI.handleError(error, '재고 조회');
}
```

#### 날짜별 재고 수정
```javascript
const stockData = {
    date: "2024-01-15",
    room_type: "🛏️ 스탠다드 (45,000원)",
    reserved: 3
};

try {
    const result = await adminAPI.updateRoomStock(stockData);
    console.log('재고 수정 성공:', result);
} catch (error) {
    adminAPI.handleError(error, '재고 수정');
}
```

### 유틸리티 메서드

#### 날짜 포맷팅
```javascript
const date = new Date();
const formattedDate = adminAPI.formatDate(date);
console.log('포맷된 날짜:', formattedDate); // "2024-01-15"
```

#### 에러 처리
```javascript
try {
    // API 호출
} catch (error) {
    adminAPI.handleError(error, '작업명');
    // 자동으로 콘솔 에러 출력 및 알림 표시
}
```

## 에러 처리

모든 API 메서드는 Promise를 반환하며, 에러가 발생하면 다음과 같이 처리됩니다:

### 클라이언트 API
```javascript
try {
    const result = await palaceAPI.createReservation(data);
    // 성공 처리
} catch (error) {
    console.error('API 호출 실패:', error);
    // 사용자에게 에러 메시지 표시
}
```

### 관리자 API
```javascript
try {
    const result = await adminAPI.saveRoom(data);
    // 성공 처리
} catch (error) {
    adminAPI.handleError(error, '객실 저장');
    // 자동으로 에러 처리 (콘솔 출력 + 알림)
}
```

## Socket.IO 이벤트

### 클라이언트 이벤트
- `reservation-confirmed`: 예약 확정 알림

### 관리자 이벤트
- `reservation-updated`: 예약 업데이트 알림

## 주의사항

1. **비동기 처리**: 모든 API 메서드는 비동기이므로 `await` 또는 `.then()`을 사용해야 합니다.
2. **에러 처리**: 항상 try-catch 블록으로 에러를 처리하세요.
3. **데이터 검증**: 서버로 전송하기 전에 클라이언트에서 데이터를 검증하세요.
4. **Socket.IO 연결**: 페이지를 벗어날 때 `disconnectSocket()`을 호출하여 연결을 정리하세요.

## 파일 구조

```
PalaceBooking/
├── Client/
│   ├── api-wrapper.js          # 클라이언트 API 랩퍼
│   ├── script.js               # 클라이언트 메인 스크립트
│   └── index.html
├── Admin/
│   ├── admin-api-wrapper.js    # 관리자 API 랩퍼
│   ├── admin.js                # 관리자 메인 스크립트
│   └── index.html
└── Server/
    └── server.js               # 서버 API 엔드포인트
```

이제 모든 서버 통신이 API 랩퍼를 통해 이루어지므로, 코드의 일관성과 유지보수성이 크게 향상되었습니다. 