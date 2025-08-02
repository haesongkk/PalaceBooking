class CustomerList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'customer-list-container';

        this.topContainer = document.createElement('div');
        this.topContainer.className = 'customer-list-top-container';

        this.searchBox = document.createElement('input');
        this.searchBox.className = 'customer-list-top-search-input';
        this.searchBox.placeholder = '고객명을 입력하세요.';

        this.searchButton = document.createElement('button');
        this.searchButton.className = 'customer-list-top-search-button';
        this.searchButton.textContent = '검색';

        this.registerButton = document.createElement('button');
        this.registerButton.className = 'customer-list-top-register-button';
        this.registerButton.textContent = '등록';

        this.container.appendChild(this.topContainer);

        this.topContainer.appendChild(this.searchBox);
        this.topContainer.appendChild(this.searchButton);
        this.topContainer.appendChild(this.registerButton);

        this.registerButton.addEventListener('click', () => {
            console.log('등록 버튼 클릭');
            window.popupCanvas.append('고객 등록', new CustomerInfo());
        });

        this.searchButton.addEventListener('click', () => {
            console.log('검색 버튼 클릭');
        });

        
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}