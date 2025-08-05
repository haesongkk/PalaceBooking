class MenuBar {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'menu-bar';

        this.buttons = [];
        for (const name of ['고객 등록', '예약 승인', '요금표 관리', '판매 캘린더']) {
            const button = document.createElement('button');
            //button.className = 'menu-button';
            button.textContent = name;
            button.addEventListener('click', () => {
                this.switchTab(name);
            });

            this.container.appendChild(button);
            this.buttons.push(button);
        }
    
        document.querySelector('.admin-3col').appendChild(this.container);
        
        // mainCanvas가 초기화된 후에 switchTab 호출
        setTimeout(() => {
            this.switchTab('고객 등록');
        }, 0);
    }   

    switchTab(tabName) {
        this.buttons.forEach(btn => btn.classList.remove('active'));
        this.buttons.find(btn => btn.textContent === tabName).classList.add('active');
        
        let tabContent;
        switch(tabName){
            case '고객 등록':
                tabContent = new CustomerList();
                break;
            case '예약 승인':
                tabContent = new ReserveList();
                break;
            case '요금표 관리':
                tabContent = new DefaultSettings();
                break;
            case '판매 캘린더':
                tabContent = new DailyPrice();
                break;
        }
        mainCanvas.append(tabContent, tabName);

    }
}