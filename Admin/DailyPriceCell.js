class DailyPriceCell {
    constructor(date, roomData, currentRoomType, dailyPricesCache, onDateSelect) {
        this.date = date;
        this.roomData = roomData;
        this.currentRoomType = currentRoomType;
        this.dailyPricesCache = dailyPricesCache;
        this.onDateSelect = onDateSelect;
    }

    generateRoomData() {
        const dateString = this.formatDate(this.date);
        const dayOfWeek = this.date.getDay(); // 0: 일요일, 1: 월요일, ...
        const roomIds = Object.keys(this.roomData || {});
        
        console.log(`DailyPriceCell: ${dateString}, dayOfWeek: ${dayOfWeek}, roomIds:`, roomIds);
        console.log(`DailyPriceCell: roomData:`, this.roomData);
        
        if (roomIds.length === 0) return '';
        
        let roomDataHTML = '';
        
        roomIds.forEach(roomId => {
            const room = this.roomData[roomId];
            
            // room.data가 없는 경우 기본값 사용
            if (!room || !room.data) {
                console.warn(`DailyPriceCell: room ${roomId}에 data가 없습니다.`);
                return;
            }
            
            let status, price, time, usageTime;
            
            // daily_prices 테이블에서 해당 날짜의 데이터 확인
            const dailyPriceKey = `${dateString}_${roomId}_${this.currentRoomType}`;
            const dailyPrice = this.dailyPricesCache[dailyPriceKey];
            
            console.log(`[DailyPriceCell] ${dateString} ${roomId} ${this.currentRoomType}:`, {
                dailyPriceKey,
                dailyPrice: dailyPrice ? {
                    status: dailyPrice.status,
                    statusType: typeof dailyPrice.status,
                    price: dailyPrice.price,
                    details: dailyPrice.details,
                    usage_time: dailyPrice.usage_time
                } : 'null',
                roomDataStatus: this.currentRoomType === 'daily' ? 
                    room.data.rentalStatus[dayOfWeek] : 
                    room.data.status[dayOfWeek],
                roomDataPrice: this.currentRoomType === 'daily' ? 
                    room.data.rentalPrice[dayOfWeek] : 
                    room.data.price[dayOfWeek],
                roomDataTime: this.currentRoomType === 'daily' ? 
                    room.data.openClose[dayOfWeek] : 
                    room.data.checkInOut[dayOfWeek],
                roomDataUsageTime: this.currentRoomType === 'daily' ? 
                    room.data.usageTime[dayOfWeek] : 
                    'N/A'
            });
            
            if (dailyPrice) {
                // daily_prices 테이블에 데이터가 있으면 사용
                status = this.getStatusText(dailyPrice.status);
                const dailyPriceValue = dailyPrice.price !== undefined ? dailyPrice.price : 0;
                price = dailyPriceValue + '원';
                
                // details를 시간 형식으로 변환
                let timeDisplay = '';
                if (dailyPrice.details) {
                    try {
                        // JSON 문자열인 경우 파싱
                        const details = typeof dailyPrice.details === 'string' ? 
                            JSON.parse(dailyPrice.details) : dailyPrice.details;
                        
                        if (Array.isArray(details) && details.length >= 2) {
                            timeDisplay = `${details[0]}시~${details[1]}시`;
                        } else {
                            timeDisplay = dailyPrice.details;
                        }
                    } catch (error) {
                        timeDisplay = dailyPrice.details;
                    }
                }
                time = timeDisplay;
                
                const dailyUsageTime = dailyPrice.usage_time !== undefined ? dailyPrice.usage_time : '';
                usageTime = dailyUsageTime;
                
                console.log(`[DailyPriceCell] daily_prices 사용:`, {
                    status: `${dailyPrice.status} → ${status}`,
                    price: `${dailyPrice.price} → ${price}`,
                    time: `${dailyPrice.details} → ${time}`,
                    usageTime: `${dailyPrice.usage_time} → ${usageTime}`
                });
            } else {
                // 없으면 기존 rooms 테이블의 기본값 사용
                if (this.currentRoomType === 'daily') {
                    const actualStatus = room.data.rentalStatus[dayOfWeek];
                    const finalStatus = actualStatus !== undefined ? actualStatus : 1;
                    console.log(`[DailyPriceCell] 대실 모드: dayOfWeek=${dayOfWeek}, actualStatus=${actualStatus}, finalStatus=${finalStatus}`);
                    status = this.getStatusText(finalStatus);
                    const rentalPriceValue = room.data.rentalPrice[dayOfWeek] !== undefined ? room.data.rentalPrice[dayOfWeek] : 30000;
                    price = rentalPriceValue + '원';
                    // 시간 데이터 처리 - 원본과 동일하게
                    const timeTuple = room.data.openClose[dayOfWeek] || [14, 22];
                    time = Array.isArray(timeTuple) ? `${timeTuple[0]}시~${timeTuple[1]}시` : timeTuple;
                    const usageTimeValue = room.data.usageTime[dayOfWeek] !== undefined ? room.data.usageTime[dayOfWeek] : 5;
                    usageTime = usageTimeValue + '시간';
                } else {
                    const actualStatus = room.data.status[dayOfWeek];
                    const finalStatus = actualStatus !== undefined ? actualStatus : 1;
                    console.log(`[DailyPriceCell] 숙박 모드: dayOfWeek=${dayOfWeek}, actualStatus=${actualStatus}, finalStatus=${finalStatus}`);
                    status = this.getStatusText(finalStatus);
                    const priceValue = room.data.price[dayOfWeek] !== undefined ? room.data.price[dayOfWeek] : 50000;
                    price = priceValue + '원';
                    // 시간 데이터 처리 - 원본과 동일하게
                    const timeTuple = room.data.checkInOut[dayOfWeek] || [16, 13];
                    time = Array.isArray(timeTuple) ? `${timeTuple[0]}시~${timeTuple[1]}시` : timeTuple;
                    usageTime = '';
                }
                
                console.log(`[DailyPriceCell] rooms 기본값 사용:`, {
                    mode: this.currentRoomType,
                    dayOfWeek: dayOfWeek,
                    status: `${this.currentRoomType === 'daily' ? room.data.rentalStatus[dayOfWeek] : room.data.status[dayOfWeek]} → ${status}`,
                    price: `${this.currentRoomType === 'daily' ? room.data.rentalPrice[dayOfWeek] : room.data.price[dayOfWeek]} → ${price}`,
                    time: `${this.currentRoomType === 'daily' ? room.data.openClose[dayOfWeek] : room.data.checkInOut[dayOfWeek]} → ${time}`,
                    usageTime: this.currentRoomType === 'daily' ? `${room.data.usageTime[dayOfWeek]} → ${usageTime}` : 'N/A'
                });
            }
            
            // 상태에 따른 클래스 결정 (기존과 동일)
            let statusClass = 'sale';
            if (status === '마감') statusClass = 'closed';
            else if (status === '매진') statusClass = 'soldout';
            
            roomDataHTML += `
                <div class="room-data-item">
                    <span class="room-status ${statusClass}">${status}</span>
                    <div class="room-name">${room.name}</div>
                    <div class="room-details">${time}</div>
                    ${usageTime ? `<div class="room-details">${usageTime}</div>` : ''}
                    <div class="room-price">${price}</div>
                </div>
            `;
        });
        
        return roomDataHTML;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getStatusText(status) {
        return status === 1 ? '판매' : '마감';
    }

    setSelected(selected) {
        // 이 메서드는 더 이상 사용되지 않음
        console.log('setSelected called but not implemented');
    }

    getRootElement() {
        // 이 메서드는 더 이상 사용되지 않음
        console.log('getRootElement called but not implemented');
        return null;
    }

    remove() {
        // 이 메서드는 더 이상 사용되지 않음
        console.log('remove called but not implemented');
    }
} 