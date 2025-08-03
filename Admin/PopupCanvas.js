class PopupCanvas {
    constructor() {
        this.bg = document.createElement('div');
        this.bg.className = 'popup-canvas-background';

        this.canvas = document.createElement('div');
        this.canvas.className = 'popup-canvas';

        this.bg.appendChild(this.canvas);
        
        this.topContainer = document.createElement('div');
        this.topContainer.className = 'popup-canvas-top';
        
        this.middleContainer = document.createElement('div');
        this.middleContainer.className = 'popup-canvas-middle';
        
        this.bottomContainer = document.createElement('div');
        this.bottomContainer.className = 'popup-canvas-bottom';
        
        this.canvas.appendChild(this.topContainer);
        this.canvas.appendChild(this.middleContainer);
        this.canvas.appendChild(this.bottomContainer);

        this.titleElement = document.createElement('h3');
        this.titleElement.textContent = null;
        this.topContainer.appendChild(this.titleElement);

        this.closeButton = document.createElement('button');
        this.closeButton.className = 'close-btn';
        this.closeButton.textContent = '×';
        this.closeButton.addEventListener('click', () => {
            this.close();
        });
        this.topContainer.appendChild(this.closeButton);

        this.submitButton = document.createElement('button');
        this.submitButton.className = 'submit-btn';
        this.submitButton.textContent = '저장';
        this.submitButton.addEventListener('click', () => {
            this.submit();
        });
        this.bottomContainer.appendChild(this.submitButton);

        this.cancelButton = document.createElement('button');
        this.cancelButton.className = 'cancel-btn';
        this.cancelButton.textContent = '취소';
        this.cancelButton.addEventListener('click', () => {
            this.close();
        });
        this.bottomContainer.appendChild(this.cancelButton);

        // body에 요소 추가
        document.body.appendChild(this.bg);
    }
    
    append(title = null, content) {
        this.titleElement.textContent = title;
        this.content = content;

        this.bg.style.display = 'flex';
        this.middleContainer.appendChild(content.getRootElement());
    }

    close() {
        this.bg.style.display = 'none';
        if(this.content) {
            this.content.remove();
        }
    }

    submit() {
        if(this.content && this.content.submit) {
            this.content.submit();
        }
        this.close();
    }

    async submitPriceTableItem() {
        try {
            const formData = this.content.getData();
            const room = this.content.room;
            const originalItem = this.content.originalItem;
            
            // 객실 데이터 업데이트
            room.name = formData.name;
            room.checkInOut = formData.checkInOut;
            room.price = formData.price;
            room.status = formData.status;
            room.usageTime = formData.usageTime;
            room.openClose = formData.openClose;
            room.rentalPrice = formData.rentalPrice;
            room.rentalStatus = formData.rentalStatus;
            
            // DB에 저장
            const response = await fetch(`/api/admin/rooms/${room.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(room)
            });
            
            if (response.ok) {
                console.log('PopupCanvas: 객실 수정 완료');
                
                // 원본 PriceTableItem 업데이트
                if (originalItem) {
                    originalItem.updateFromData(formData);
                }
                
                // 부모 PriceTable 업데이트
                if (originalItem && originalItem.parentTable) {
                    originalItem.parentTable.updateRoom();
                }
            } else {
                console.error('PopupCanvas: 객실 수정 실패');
                alert('객실 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('PopupCanvas: 객실 수정 오류:', error);
            alert('객실 수정에 실패했습니다.');
        }
    }


}