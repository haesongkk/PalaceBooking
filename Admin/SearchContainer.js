class SearchBox {
    constructor(container) {
        this.input = document.createElement('input');
        container.appendChild(this.input);

        this.input.type = 'text';
        this.input.placeholder = '검색어를 입력하세요...';
        
        // 기본 스타일
        this.input.style.padding = '8px 12px';
        this.input.style.border = '1px solid #ddd';
        this.input.style.borderRadius = '6px';
        this.input.style.fontSize = '14px';
        this.input.style.width = '200px';
        this.input.style.outline = 'none';
        this.input.style.transition = 'border-color 0.2s';
        
        // 이벤트 리스너
        this.input.addEventListener('input', (e) => {
        });
        
        this.input.addEventListener('focus', () => {
            this.input.style.borderColor = '#007bff';
        });
        
        this.input.addEventListener('blur', () => {
            this.input.style.borderColor = '#ddd';
        });
    }
} 


class SearchButton {
    constructor(container, text = '검색') {
        this.searchButton = document.createElement('button');
        container.appendChild(this.searchButton);

        // 기본 설정
        this.searchButton.textContent = text;
        this.searchButton.className = 'search-button';
        this.searchButton.type = 'button';

        // 스타일링
        this.searchButton.style.padding = '12px 20px';
        this.searchButton.style.backgroundColor = '#3b82f6';
        this.searchButton.style.color = 'white';
        this.searchButton.style.border = 'none';
        this.searchButton.style.borderRadius = '8px';
        this.searchButton.style.fontSize = '14px';
        this.searchButton.style.fontWeight = '500';
        this.searchButton.style.cursor = 'pointer';
        this.searchButton.style.transition = 'background-color 0.2s';
        this.searchButton.style.marginLeft = '8px';

        // 호버 효과
        this.searchButton.addEventListener('mouseenter', () => {
            this.searchButton.style.backgroundColor = '#2563eb';
        });

        this.searchButton.addEventListener('mouseleave', () => {
            this.searchButton.style.backgroundColor = '#3b82f6';
        });

        // 클릭 이벤트
        this.searchButton.addEventListener('click', () => {
            console.log('검색 버튼 클릭됨');
        });
    }

} 

class RegisterButton {
    constructor(container, text = '등록하기') {
        this.registerButton = document.createElement('button');
        container.appendChild(this.registerButton);

        // 기본 설정
        this.registerButton.textContent = text;
        this.registerButton.className = 'register-button';
        this.registerButton.type = 'button';

        // 스타일링
        this.registerButton.style.padding = '12px 24px';
        this.registerButton.style.backgroundColor = '#10b981';
        this.registerButton.style.color = 'white';
        this.registerButton.style.border = 'none';
        this.registerButton.style.borderRadius = '8px';
        this.registerButton.style.fontSize = '14px';
        this.registerButton.style.fontWeight = '500';
        this.registerButton.style.cursor = 'pointer';
        this.registerButton.style.transition = 'background-color 0.2s';
        this.registerButton.style.marginLeft = '12px';

        // 호버 효과
        this.registerButton.addEventListener('mouseenter', () => {
            this.registerButton.style.backgroundColor = '#059669';
        });

        this.registerButton.addEventListener('mouseleave', () => {
            this.registerButton.style.backgroundColor = '#10b981';
        });

        // 클릭 이벤트
        this.registerButton.addEventListener('click', () => {
            console.log('등록하기 버튼 클릭됨');
        });
    }

} 
class SearchContainer {
    constructor() {
        this.div = document.createElement('div');

        // 컨테이너 스타일링
        this.div.style.display = 'flex';
        this.div.style.alignItems = 'center';
        //this.div.style.gap = '12px';
        //this.div.style.marginBottom = '24px';
        //this.div.style.padding = '16px';
        //this.div.style.backgroundColor = '#f8fafc';
        //this.div.style.borderRadius = '12px';
        //this.div.style.border = '1px solid #e2e8f0';

        this.searchBox = new SearchBox(this.div);
        this.searchButton = new SearchButton(this.div);
        this.registerButton = new RegisterButton(this.div);
    }

} 