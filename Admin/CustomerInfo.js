class CustomerInfo {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'customer-info-container';

        this.name = document.createElement('div');
        this.name.className = 'customer-info-item';
        
        this.phone = document.createElement('div');
        this.phone.className = 'customer-info-item';

        this.memo = document.createElement('div');
        this.memo.className = 'customer-info-item';

        this.container.appendChild(this.name);
        this.container.appendChild(this.phone);
        this.container.appendChild(this.memo);

        this.nameLabel = document.createElement('label');
        this.nameLabel.textContent = '이름';
        
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = '이름을 입력하세요';
        
        this.name.appendChild(this.nameLabel);
        this.name.appendChild(this.nameInput);

        this.phoneLabel = document.createElement('label');
        this.phoneLabel.textContent = '전화번호';
        
        this.phoneInput = document.createElement('input');
        this.phoneInput.type = 'text';
        this.phoneInput.placeholder = '전화번호를 입력하세요';
        
        this.phone.appendChild(this.phoneLabel);
        this.phone.appendChild(this.phoneInput);

        this.memoLabel = document.createElement('label');
        this.memoLabel.textContent = '메모';
        
        this.memoInput = document.createElement('input');
        this.memoInput.placeholder = '메모를 입력하세요';
        
        this.memo.appendChild(this.memoLabel);
        this.memo.appendChild(this.memoInput);


    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }

    submit() {
        const data = this.getData();
        console.log('CustomerInfo submit - data:', data);
        
        // TODO: 실제 저장 로직 구현
        // 현재는 콘솔 출력만
    }

    getData() {
        return {
            name: this.nameInput.value,
            phone: this.phoneInput.value,
            memo: this.memoInput.value
        };
    }
    
}



