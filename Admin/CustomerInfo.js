class CustomerInfo {
    constructor(onSubmitCallback, customerInfo = null) {
        this.customerInfo = customerInfo;

        this.container = document.createElement('div');
        this.container.className = 'customer-info-container';
        this.onSubmitCallback = onSubmitCallback;

        this.name = document.createElement('div');
        this.name.className = 'customer-info-item';
        this.container.appendChild(this.name);
        
        this.phone = document.createElement('div');
        this.phone.className = 'customer-info-item';
        this.container.appendChild(this.phone);

        this.memo = document.createElement('div');
        this.memo.className = 'customer-info-item';
        this.container.appendChild(this.memo);


        this.nameLabel = document.createElement('label');
        this.nameLabel.textContent = '이름';
        this.name.appendChild(this.nameLabel);
        
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.name.appendChild(this.nameInput);
        

        this.phoneLabel = document.createElement('label');
        this.phoneLabel.textContent = '전화번호';
        this.phone.appendChild(this.phoneLabel);
        
        this.phoneInput = document.createElement('input');
        this.phoneInput.type = 'text';
        this.phone.appendChild(this.phoneInput);
        

        this.memoLabel = document.createElement('label');
        this.memoLabel.textContent = '메모';
        this.memo.appendChild(this.memoLabel);
        
        this.memoInput = document.createElement('input');
        this.memo.appendChild(this.memoInput);

        if(this.customerInfo) {
            this.nameInput.value = this.customerInfo.name;
            this.phoneInput.value = this.customerInfo.phone;
            this.memoInput.value = this.customerInfo.memo;
        }
        else {
            this.nameInput.placeholder = '이름을 입력하세요';
            this.phoneInput.placeholder = '전화번호를 입력하세요';
            this.memoInput.placeholder = '메모를 입력하세요';
        }
    }

    async submit() {
        const data = {  
            id: this.customerInfo ? this.customerInfo.id : null,
            name: this.nameInput.value,
            phone: this.phoneInput.value,
            memo: this.memoInput.value
        }

        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!res.ok) {
            console.error(result.msg);
            return false;
        }
        else {
            console.log(result.msg);
            
            if (this.onSubmitCallback) this.onSubmitCallback();     
            return true;
        }
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}



