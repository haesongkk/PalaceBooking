class PopupCanvas {
    constructor(title) {
        this.bg = document.createElement('div');
        this.bg.style.position = 'fixed';
        this.bg.style.top = '0';
        this.bg.style.left = '0';
        this.bg.style.width = '100%';
        this.bg.style.height = '100%';
        this.bg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.bg.style.zIndex = '1000';
        this.bg.style.display = 'flex';
        this.bg.style.alignItems = 'center';
        this.bg.style.justifyContent = 'center';

        this.canvas = document.createElement('div');
        this.canvas.style.backgroundColor = 'white';
        this.canvas.style.borderRadius = '12px';
        this.canvas.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        this.canvas.style.padding = '24px';
        this.canvas.style.width = '60%';
        this.canvas.style.height = '60%';
        this.canvas.style.minWidth = '400px';
        this.canvas.style.overflow = 'hidden';
        this.canvas.style.margin = '20px';

        this.header = document.createElement('div');
        this.header.style.display = 'flex';
        this.header.style.justifyContent = 'space-between';
        this.header.style.alignItems = 'center';
        this.header.style.padding = '20px 25px';
        this.header.style.borderBottom = '1px solid #e5e7eb';
        this.header.style.background = '#f9fafb';

        this.title = document.createElement('h3');
        this.title.style.margin = '0';
        this.title.style.fontSize = '1.25rem';
        this.title.style.color = '#374151';
        this.title.style.fontWeight = '600';
        this.title.textContent = title;

        this.closeButton = document.createElement('button');
        this.closeButton.textContent = '×';
        this.closeButton.style.background = 'none';
        this.closeButton.style.border = 'none';
        this.closeButton.style.fontSize = '1.5rem';
        this.closeButton.style.color = '#6b7280';
        this.closeButton.style.cursor = 'pointer';
        this.closeButton.style.padding = '0';
        this.closeButton.style.width = '30px';
        this.closeButton.style.height = '30px';
        this.closeButton.style.display = 'flex';
        this.closeButton.style.alignItems = 'center';
        this.closeButton.style.justifyContent = 'center';
        this.closeButton.style.borderRadius = '6px';
        this.closeButton.style.transition = 'all 0.2s';
        this.closeButton.addEventListener('click', () => {
            this.destroy();
        });

        
        this.bg.appendChild(this.canvas);
        this.canvas.appendChild(this.header);
        this.header.appendChild(this.title);
        this.header.appendChild(this.closeButton);
        
        // body에 요소 추가
        document.body.appendChild(this.bg);
    }

    append(element) {
        this.canvas.appendChild(element);
    }

    destroy() {
        // DOM에서 요소 제거
        if (this.bg && this.bg.parentNode) {
            this.bg.parentNode.removeChild(this.bg);
        }
        
        // 이벤트 리스너 정리
        if (this.closeButton) {
            this.closeButton.removeEventListener('click', this.destroy);
        }
        
        // 참조 정리
        this.bg = null;
        this.canvas = null;
        this.header = null;
        this.title = null;
        this.closeButton = null;

        
    }
}