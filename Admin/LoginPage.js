class LoginPage {
    constructor() {
        

        this.background = document.createElement('div');
        
        this.background.style.width = '100%';
        this.background.style.height = '100%';
        this.background.style.position = 'fixed';
        this.background.style.top = '0';
        this.background.style.left = '0';

        this.background.style.justifyContent = 'center';
        this.background.style.alignItems = 'center';
        this.background.style.display = 'flex';

        this.background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        document.body.appendChild(this.background);

        const form = document.createElement('form');
        form.style.width = '400px';
        form.style.height = '400px';
        
        form.style.backgroundColor = 'white';
        
        
        form.style.borderRadius = '18px';
        form.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';

        form.style.display = 'flex';
        form.style.flexDirection = 'column';
        form.style.justifyContent = 'center';
        form.style.alignItems = 'center';

        // 폼 제출 시 페이지 새로고침 방지
        form.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        this.background.appendChild(form);

        const title = document.createElement('h3');
        title.textContent = '팔레스 관리자 페이지';
        form.appendChild(title);

        const description = document.createElement('h5');
        description.textContent = '접속을 위해 비밀번호를 입력해주세요.';
        description.style.color = '#2a2a3a';
        form.appendChild(description);

        // 숨겨진 username 필드 (접근성을 위해)
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.name = 'username';
        usernameInput.autocomplete = 'username';
        usernameInput.style.display = 'none';
        usernameInput.value = 'admin';

        form.appendChild(usernameInput);

        const loginBox = document.createElement('div');
        loginBox.style.display = 'flex';
        loginBox.style.flexDirection = 'row';
        loginBox.style.gap = '10px';
        form.appendChild(loginBox);

        // 비밀번호 입력 필드
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = '비밀번호';
        passwordInput.name = 'password';
        passwordInput.autocomplete = 'current-password';
        passwordInput.style.width = '200px';
        passwordInput.style.height = '40px';
        passwordInput.style.borderRadius = '18px';
        passwordInput.style.border = '1px solid #e0e0e0';
        passwordInput.style.padding = '0 16px';
        passwordInput.style.marginBottom = '16px';

        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();  // 폼 제출 방지
                this.onSubmit(passwordInput);
            }
        });
        loginBox.appendChild(passwordInput);


        const loginButton = document.createElement('button');
        loginButton.textContent = 'OK';
        loginButton.style.width = '40px';
        loginButton.style.height = '40px';
        loginButton.style.borderRadius = '18px';
        loginButton.style.border = '1px solid #e0e0e0';
        loginButton.style.backgroundColor = '#2a2a3a';
        loginButton.style.color = 'white';
        loginButton.style.cursor = 'pointer';
        loginButton.style.fontSize = '16px';
        loginButton.style.fontWeight = 'bold';

        loginButton.addEventListener('click', () => {
            this.onSubmit(passwordInput);
        });
        loginBox.appendChild(loginButton);


        const token = localStorage.getItem('palace-admin-token');
        console.log(token);
        if(token) {
            fetch(`/api/admin/${token}`, {
                method: 'post',
            })
            .then(response => response.json())
            .then(data => {
                if(data.error) {
                    alert(data.error);
                    return;
                }
                
                if(data.msg === 'success') this.onLoginSuccess();
            });
        }
        
    }
    
    async onSubmit(passwordInput) {
        const password = passwordInput.value;
        if(!password) return;
        
        const response = await fetch(`/api/admin/login/${password}`);
        const result = await response.json();
        console.log(result);

        if(result != -1) {
            localStorage.setItem('palace-admin-token', result);
            this.onLoginSuccess();
        }
        else {
            alert('비밀번호가 일치하지 않습니다.');
        }

        passwordInput.value = '';
    }

    onLoginSuccess() {
        this.background.remove();
        new MenuBar();
        window.mainCanvas = new MainCanvas();
        window.popupCanvas = new PopupCanvas();
    }
}