class MainCanvas {
    constructor() {
        this.mainCanvas = document.createElement('div');

        this.mainCanvas.style.background = '#fff';
        this.mainCanvas.style.borderRadius = '18px';
        this.mainCanvas.style.boxShadow = '0 4px 24px #0002';
        this.mainCanvas.style.padding = '32px';

        this.mainCanvas.style.width = '90%';
        this.mainCanvas.style.maxWidth = '1200px';
        this.mainCanvas.style.height = '80vh';

        this.mainCanvas.style.flexDirection = 'column';
        this.mainCanvas.style.transition = 'all 0.2s';

        this.mainCanvas.style.display = 'flex';

        document.querySelector('.admin-3col').appendChild(this.mainCanvas);
    }

    append(content) {
        this.content?.remove();
        this.content = content;
        this.mainCanvas.appendChild(content.getRootElement());
        console.log(content);
    }


}

