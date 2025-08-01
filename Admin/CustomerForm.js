

class CustomerForm {
    constructor() {
        this.form = document.createElement('div');
        this.form.style.display = 'flex';
        this.form.style.flexDirection = 'column';
        this.form.style.gap = '20px';
        this.form.style.padding = '20px';
        this.form.style.overflowY = 'auto';
        this.form.style.maxHeight = 'calc(100% - 100px)';

        this.createFormFields();
    }

    createFormFields() {
        // 이름 필드
        this.createField('이름', 'text', '고객명을 입력하세요', true);
        
        // 연락처 필드
        this.createField('연락처', 'tel', '전화번호를 입력하세요', false);
        
        // 메모 필드
        this.createTextAreaField('메모', '메모를 입력하세요');
        
        // 저장 버튼
        this.createSaveButton();
    }

    createField(label, type, placeholder, required = false) {
        const fieldContainer = document.createElement('div');
        fieldContainer.style.display = 'flex';
        fieldContainer.style.flexDirection = 'column';
        fieldContainer.style.gap = '8px';

        const labelElement = document.createElement('label');
        labelElement.textContent = required ? `${label} *` : label;
        labelElement.style.fontWeight = '600';
        labelElement.style.color = '#374151';
        labelElement.style.fontSize = '0.9rem';

        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.style.padding = '12px 16px';
        input.style.border = '1px solid #d1d5db';
        input.style.borderRadius = '8px';
        input.style.fontSize = '0.9rem';
        input.style.backgroundColor = '#fff';
        input.style.transition = 'border-color 0.2s, box-shadow 0.2s';
        input.required = required;

        // 포커스 효과
        input.addEventListener('focus', () => {
            input.style.borderColor = '#3b82f6';
            input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = '#d1d5db';
            input.style.boxShadow = 'none';
        });

        fieldContainer.appendChild(labelElement);
        fieldContainer.appendChild(input);
        this.form.appendChild(fieldContainer);

        // 입력값 저장을 위해 참조 유지
        if (!this.inputs) this.inputs = {};
        this.inputs[label] = input;
    }

    createTextAreaField(label, placeholder) {
        const fieldContainer = document.createElement('div');
        fieldContainer.style.display = 'flex';
        fieldContainer.style.flexDirection = 'column';
        fieldContainer.style.gap = '8px';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.fontWeight = '600';
        labelElement.style.color = '#374151';
        labelElement.style.fontSize = '0.9rem';

        const textarea = document.createElement('textarea');
        textarea.placeholder = placeholder;
        textarea.style.padding = '12px 16px';
        textarea.style.border = '1px solid #d1d5db';
        textarea.style.borderRadius = '8px';
        textarea.style.fontSize = '0.9rem';
        textarea.style.backgroundColor = '#fff';
        textarea.style.transition = 'border-color 0.2s, box-shadow 0.2s';
        textarea.style.resize = 'vertical';
        textarea.style.minHeight = '100px';
        textarea.style.fontFamily = 'inherit';

        // 포커스 효과
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = '#3b82f6';
            textarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });

        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = '#d1d5db';
            textarea.style.boxShadow = 'none';
        });

        fieldContainer.appendChild(labelElement);
        fieldContainer.appendChild(textarea);
        this.form.appendChild(fieldContainer);

        // 입력값 저장을 위해 참조 유지
        if (!this.inputs) this.inputs = {};
        this.inputs[label] = textarea;
    }

    getFormData() {
        const data = {};
        if (this.inputs) {
            Object.keys(this.inputs).forEach(label => {
                data[label] = this.inputs[label].value.trim();
            });
        }
        return data;
    }

    setFormData(data) {
        if (this.inputs && data) {
            Object.keys(data).forEach(label => {
                if (this.inputs[label]) {
                    this.inputs[label].value = data[label] || '';
                }
            });
        }
    }

    validate() {
        const errors = [];
        
        if (this.inputs['이름'] && !this.inputs['이름'].value.trim()) {
            errors.push('이름은 필수 입력 항목입니다.');
        }

        if (this.inputs['연락처'] && this.inputs['연락처'].value.trim()) {
            const phoneRegex = /^[0-9-+\s()]+$/;
            if (!phoneRegex.test(this.inputs['연락처'].value.trim())) {
                errors.push('올바른 전화번호 형식을 입력해주세요.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    clear() {
        if (this.inputs) {
            Object.values(this.inputs).forEach(input => {
                input.value = '';
            });
        }
    }

    createSaveButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.marginTop = '30px';
        buttonContainer.style.paddingTop = '20px';
        buttonContainer.style.borderTop = '1px solid #e5e7eb';

        this.saveButton = document.createElement('button');
        this.saveButton.textContent = '저장하기';
        this.saveButton.style.padding = '12px 32px';
        this.saveButton.style.backgroundColor = '#3b82f6';
        this.saveButton.style.color = 'white';
        this.saveButton.style.border = 'none';
        this.saveButton.style.borderRadius = '8px';
        this.saveButton.style.fontSize = '1rem';
        this.saveButton.style.fontWeight = '600';
        this.saveButton.style.cursor = 'pointer';
        this.saveButton.style.transition = 'background-color 0.2s, transform 0.1s';
        this.saveButton.style.minWidth = '120px';

        // 호버 효과
        this.saveButton.addEventListener('mouseenter', () => {
            this.saveButton.style.backgroundColor = '#2563eb';
            this.saveButton.style.transform = 'translateY(-1px)';
        });

        this.saveButton.addEventListener('mouseleave', () => {
            this.saveButton.style.backgroundColor = '#3b82f6';
            this.saveButton.style.transform = 'translateY(0)';
        });

        // 클릭 효과
        this.saveButton.addEventListener('mousedown', () => {
            this.saveButton.style.transform = 'translateY(0)';
        });

        this.saveButton.addEventListener('mouseup', () => {
            this.saveButton.style.transform = 'translateY(-1px)';
        });

        // 저장 이벤트
        this.saveButton.addEventListener('click', () => {
            this.handleSave();
        });

        buttonContainer.appendChild(this.saveButton);
        this.form.appendChild(buttonContainer);
    }

    handleSave() {
        // 유효성 검사
        const validation = this.validate();
        if (!validation.isValid) {
            alert('❌ 오류:\n' + validation.errors.join('\n'));
            return;
        }

        // 저장 로직 실행
        const data = this.getFormData();
        console.log('저장할 데이터:', data);
        
        // 여기에 실제 저장 로직을 추가할 수 있습니다
        // 예: API 호출, 로컬 스토리지 저장 등
        
        alert('✅ 고객 정보가 저장되었습니다!');
        
        // 저장 후 폼 초기화 (선택사항)
        // this.clear();
    }

    getElement() {
        return this.form;
    }
} 