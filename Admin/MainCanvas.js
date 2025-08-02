class MainCanvas {
    constructor() {
        this.mainCanvas = document.createElement('div');
        this.mainCanvas.className = 'main-canvas';

        this.title = document.createElement('h2');
        this.title.textContent = null;

        this.mainCanvas.appendChild(this.title);

        document.querySelector('.admin-3col').appendChild(this.mainCanvas);
    }

    append(content, title = null) {
        this.title.textContent = title;
        this.content?.remove();
        this.content = content;
        this.mainCanvas.appendChild(content.getRootElement());
    }

}

