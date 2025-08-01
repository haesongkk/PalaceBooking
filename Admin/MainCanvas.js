class MainCanvasHeader {
    constructor(container, title) {
        this.div = document.createElement('div');
        container.appendChild(this.div);

        this.div.style.display = 'flex';
        this.div.style.alignItems = 'center';
        this.div.style.justifyContent = 'center';

        this.div.style.marginBottom = '20px';

        this.div.style.fontSize = '1.2rem';
        this.div.style.fontWeight = 'bold';
        this.div.style.color = '#333';

        this.div.textContent = title;  
    }

}

class MainCanvasBody {
    constructor(container) {
        this.div = document.createElement('div');
        container.appendChild(this.div);

        this.div.style.display = 'flex';
        this.div.style.flexDirection = 'column';
        this.div.style.gap = '24px';

        this.div.style.maxHeight = 'calc(100vh - 200px)';
        this.div.style.overflowY = 'auto';
        this.div.style.paddingRight = '8px';

    }
}

class MainCanvas {
    constructor(container, title) {
        this.mainCanvas = document.createElement('div');
        container.appendChild(this.mainCanvas);

        this.mainCanvas.style.background = '#fff';
        this.mainCanvas.style.borderRadius = '18px';
        this.mainCanvas.style.boxShadow = '0 4px 24px #0002';
        this.mainCanvas.style.padding = '32px';

        this.mainCanvas.style.width = '90%';
        this.mainCanvas.style.maxWidth = '1200px';
        this.mainCanvas.style.height = '80vh';

        this.mainCanvas.style.flexDirection = 'column';
        this.mainCanvas.style.transition = 'all 0.2s';

        this.mainCanvas.style.display = 'none';

        this.header = new MainCanvasHeader(this.mainCanvas, title);
        this.body = new MainCanvasBody(this.mainCanvas);

    }

    appendBetween(element) {
        // header와 body 사이에 element를 삽입
        this.mainCanvas.insertBefore(element, this.body.div);
    }


    show() {
        this.mainCanvas.style.display = 'flex';
    }

    hide() {
        this.mainCanvas.style.display = 'none';
    }
}

