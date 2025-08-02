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
        if(this.content) {
            console.log(this.content.getData());
        }
        this.close();
    }


}