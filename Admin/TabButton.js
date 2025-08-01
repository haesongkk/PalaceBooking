class TabButton {
    constructor(container, tabName) {
        this.tabButton = document.createElement('div');
        container.appendChild(this.tabButton);

        this.tabButton.textContent = tabName;
        this.tabButton.contentEditable = false;

        this.tabButton.style.padding = '12px 24px';
        this.tabButton.style.border = 'none';
        this.tabButton.style.borderRadius = '8px';

        this.tabButton.style.background = '#f1f5f9';
        this.tabButton.style.color = '#64748b';
        this.tabButton.style.fontWeight = '500';

        this.tabButton.style.cursor = 'pointer';
        this.tabButton.style.transition = 'all 0.2s';
        this.tabButton.style.fontSize = '0.95rem';


        this.tabButton.addEventListener('click', () => {
            this.tabButton.style.background = '#3b82f6';
            this.tabButton.style.color = '#fff';
        });
    }

    hide() {
        this.tabButton.style.background = '#f1f5f9';
        this.tabButton.style.color = '#64748b';
    }
}
