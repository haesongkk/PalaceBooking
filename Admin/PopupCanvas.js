class PopupCanvas {
    constructor() {
        // 팝업 캔버스 배경
        this.bg = document.createElement('div');
        this.bg.className = 'popup-canvas-background';
        document.body.appendChild(this.bg);

        // 팝업 캔버스
        this.canvas = document.createElement('div');
        this.canvas.className = 'popup-canvas';
        this.bg.appendChild(this.canvas);

        // 팝업 캔버스 내부 요소
        this.topContainer = document.createElement('div');
        this.topContainer.className = 'popup-canvas-top';
        this.canvas.appendChild(this.topContainer);
        
        this.middleContainer = document.createElement('div');
        this.middleContainer.className = 'popup-canvas-middle';
        this.canvas.appendChild(this.middleContainer);
        
        this.bottomContainer = document.createElement('div');
        this.bottomContainer.className = 'popup-canvas-bottom';
        this.canvas.appendChild(this.bottomContainer);
        
        // 팝업 캔버스 상단 내부 요소
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

        // 팝업 캔버스 하단 내부 요소
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

    }
    
    append(title = null, content) {
        if(!content) 
            console.error('팝업 캔버스 내에 내용이 없습니다.');
        else if(!content.getRootElement()) 
            console.error('getRootElement 함수 없음');
        else if (!content.submit) 
            console.error('submit 함수 없음');
        else if (!content.remove) 
            console.error('remove 함수 없음');
        else {
            this.titleElement.textContent = title;
            this.content = content;
            this.bg.style.display = 'flex';
            this.middleContainer.appendChild(this.content.getRootElement());
        }   
    }

    close() {
        this.bg.style.display = 'none';
        this.content.remove();
    }

    async submit() {
        const saveSuccess = await this.content.submit();
        if(saveSuccess) this.close();
        else console.error('submit 실패');
    }
}