
class DailyPricePopup {
    constructor(selectedDates, dataBox, isOvernight, onSaveCallback) {
        this.selectedDates = selectedDates;
        this.dataBox = dataBox;
        this.onSaveCallback = onSaveCallback;
        this.isOvernight = isOvernight;
        
        this.modal = this.createModal();
        this.initialValues = {};

        this.updateInfo();
        this.generateForm();
        
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'price-table-inner-container';
        
        modal.innerHTML = `
            <div class="price-table-inner-top-container">
                <div class="sales-info-bar">
                    <div class="selected-dates-info" id="selected-dates-info"></div>
                    <div class="current-room-type" id="current-room-type"></div>
                </div>
            </div>
            <table class="sales-form-table">
                <tbody id="form-rows">
                </tbody>
            </table>
        `;
        
        modal.appendChild(document.createElement('div'));
        modal.querySelector('div:last-child').className = 'daily-price-popup';
        modal.querySelector('div:last-child').popupInstance = this;
        
        return modal;
    }


    updateInfo() {
        
        const selectedDatesInfo = this.modal.querySelector('#selected-dates-info');
        console.log(this.selectedDates);
        const datesString = this.selectedDates.sort().map(dateString => {
            const date = new Date(dateString);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }).join(', ');
        console.log(datesString);
        selectedDatesInfo.textContent = `선택한 날짜: ${datesString} (총 ${this.selectedDates.length}개)` + `현재 모드: ${this.isOvernight ? '숙박' : '대실'}`;


        // const currentRoomType = this.modal.querySelector('#current-room-type');
        // currentRoomType.textContent = `현재 모드: ${this.currentRoomType === 'daily' ? '대실' : '숙박'}`;

        const table = this.modal.querySelector('.sales-form-table');

        const thead = document.createElement('thead');
        table.appendChild(thead);

        const tr = document.createElement('tr');
        thead.appendChild(tr);

        const th1 = document.createElement('th');
        th1.textContent = '객실명';
        tr.appendChild(th1);

        const th2 = document.createElement('th');
        th2.textContent = '상태';
        tr.appendChild(th2);

        const th3 = document.createElement('th');
        th3.textContent = '가격';
        tr.appendChild(th3);

        console.log(this.isOvernight);
        if (!this.isOvernight) {
            const th4 = document.createElement('th');
            th4.textContent = '개시/마감 시각';
            tr.appendChild(th4);

            const th5 = document.createElement('th');
            th5.textContent = '이용시간';
            tr.appendChild(th5);

        } 
        else {
            const th4 = document.createElement('th');
            th4.textContent = '입실/퇴실 시각';
            tr.appendChild(th4);
        }
    }

    generateForm() {
        const formRows = this.modal.querySelector('#form-rows');
        console.log(this.dataBox);
        this.rows = [];
        this.dataBox.querySelectorAll('.room-data-items').forEach(item => {
            const row = document.createElement('tr');
            row.id = item.id;
            //row.className = 'form-row';
            formRows.appendChild(row);
            this.rows.push(row);

            // 객실명
            const nameCell = document.createElement('td');
            nameCell.textContent = item.querySelector('.room-name').textContent;
            row.appendChild(nameCell);

            // 판매 상태 
            const status = item.querySelector('.room-status').textContent === '판매' ? 1 : 0;
            
            const statusCell = document.createElement('td');
            row.appendChild(statusCell);

            const statusBtn1 = document.createElement('button');
            statusBtn1.className = 'status-btn';
            statusBtn1.textContent = '판매';
            statusBtn1.onclick = () => this.onClickStatusBtn(statusCell);
            statusCell.appendChild(statusBtn1);

            const statusBtn2 = document.createElement('button');
            statusBtn2.className = 'status-btn stopped';
            statusBtn2.textContent = '마감';
            statusBtn2.onclick = () => this.onClickStatusBtn(statusCell);
            statusCell.appendChild(statusBtn2);

            if(status) statusBtn1.classList.add('active');
            else statusBtn2.classList.add('active');
            
            const price = item.querySelector('.room-price').textContent.split('원')[0];

            const priceCell = document.createElement('td');
            row.appendChild(priceCell);

            const priceContainer = document.createElement('div');
            priceContainer.className = 'price-input-container';
            priceCell.appendChild(priceContainer);
            
            const priceInput = document.createElement('input');
            priceInput.type = 'text';
            priceInput.className = 'price-input';
            priceInput.maxLength = 8;
            priceInput.oninput = (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
            };
            priceInput.value = price;
            priceContainer.appendChild(priceInput);

            const priceUnit = document.createElement('span');
            priceUnit.textContent = '원';
            priceUnit.style.marginLeft = '2px';
            priceUnit.style.fontSize = '0.75rem';
            priceContainer.appendChild(priceUnit);

            const details = item.querySelectorAll('.room-details');
            if(!this.isOvernight) {
                const match = [
                    details[0].textContent.match(/(\d+)시~(\d+)시/),
                    details[1].textContent.match(/(\d+)시/)
                ]

                const timeCell = document.createElement('td');
                row.appendChild(timeCell);

                const timeInputs1 = document.createElement('div');
                timeInputs1.className = 'time-inputs';
                timeInputs1.style.justifyContent = 'center';
                timeCell.appendChild(timeInputs1);
                
                const openHourDropdown = this.createTimeDropdown(
                    `sales-open-hour-${item.id}`, 6, 23, 
                    match[0][1],
                    'open'
                );
                timeInputs1.appendChild(openHourDropdown);

                const timeSeparator1 = document.createElement('span');
                timeSeparator1.className = 'time-separator';
                timeSeparator1.textContent = '시~';
                timeInputs1.appendChild(timeSeparator1);

                const closeHourDropdown = this.createTimeDropdown(
                    `sales-close-hour-${item.id}`, 6, 23,
                    match[0][2],
                    'close'
                );
                timeInputs1.appendChild(closeHourDropdown);
                
                const timeSeparator2 = document.createElement('span');
                timeSeparator2.className = 'time-separator';
                timeSeparator2.textContent = '시';
                timeInputs1.appendChild(timeSeparator2);


                const usageTimeCell = document.createElement('td');
                row.appendChild(usageTimeCell);

                const timeInputs2 = document.createElement('div');
                timeInputs2.className = 'time-inputs';
                timeInputs2.style.justifyContent = 'center';
                usageTimeCell.appendChild(timeInputs2);

                const usageHourDropdown = this.createTimeDropdown(
                    `sales-usage-hour-${item.id}`, 1, 12,
                    match[1][1],
                    'usage'
                );
                timeInputs2.appendChild(usageHourDropdown);

                
                const timeSeparator3 = document.createElement('span');
                timeSeparator3.className = 'time-separator';
                timeSeparator3.textContent = '시간';
                timeInputs2.appendChild(timeSeparator3);
                
            }
            else {
                const match = details[0].textContent.match(/(\d+)시~(\d+)시/);

                const timeCell = document.createElement('td');
                row.appendChild(timeCell);

                const checkinHourDropdown = this.createTimeDropdown(
                    `sales-checkin-hour-${item.id}`, 0, 23,
                    match[1],
                    'checkin'
                );

                const checkoutHourDropdown = this.createTimeDropdown(
                    `sales-checkout-hour-${item.id}`, 0, 23,
                    match[2],
                    'checkout'
                );
                
                const timeInputs = document.createElement('div');
                timeInputs.className = 'time-inputs';
                timeInputs.style.justifyContent = 'center';
                
                const timeSeparator1 = document.createElement('span');
                timeSeparator1.className = 'time-separator';
                timeSeparator1.textContent = '시~';
                
                const timeSeparator2 = document.createElement('span');
                timeSeparator2.className = 'time-separator';
                timeSeparator2.textContent = '시';
                
                timeInputs.appendChild(checkinHourDropdown);
                timeInputs.appendChild(timeSeparator1);
                timeInputs.appendChild(checkoutHourDropdown);
                timeInputs.appendChild(timeSeparator2);
                
                timeCell.appendChild(timeInputs);
            }

            
        });
    }

    onClickStatusBtn(statusCell) {
        const statusBtns = statusCell.querySelectorAll('.status-btn');
        statusBtns.forEach(btn => {
            if(btn.classList.contains('active')) {
                btn.classList.remove('active');
            }
            else {
                btn.classList.add('active');
            }
        });
    }

    createTimeDropdown(id, min, max, currentValue, type) {
        const container = document.createElement('div');
        container.className = 'custom-dropdown';
        container.id = id;
        container.onmouseenter = () => this.showDropdown(container, type, min, max, currentValue);
        container.onmouseleave = () => this.hideDropdown(container);
        container.onclick = () => this.toggleInputMode(container, currentValue);
        
        const display = document.createElement('div');
        display.className = 'dropdown-display';
        display.textContent = currentValue;
        
        const options = document.createElement('div');
        options.className = 'dropdown-options';
        options.style.display = 'none';
        
        container.appendChild(display);
        container.appendChild(options);
        
        return container;
    }

    showDropdown(dropdown, type, min, max, currentValue) {
        const options = dropdown.querySelector('.dropdown-options');
        options.innerHTML = '';
        
        for (let i = min; i <= max; i++) {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.textContent = i;
            if (i.toString() === currentValue) {
                option.classList.add('selected');
            }
            option.onclick = () => {
                dropdown.querySelector('.dropdown-display').textContent = i;
                this.hideDropdown(dropdown);
            };
            options.appendChild(option);
        }
        
        options.style.display = 'block';
    }

    hideDropdown(dropdown) {
        const options = dropdown.querySelector('.dropdown-options');
        options.style.display = 'none';
    }
    
    changeStatus(roomId, status) {
        const statusBtns = this.modal.querySelectorAll(`.status-btn[data-room-id="${roomId}"]`);
        statusBtns.forEach(btn => btn.classList.remove('active'));
        
        const clickedBtn = event.target;
        clickedBtn.classList.add('active');
    }
    
    // 저장 기능 구현 중...
    // 캔버스에서 정보 받아오기 구현 중...
    async submit() {
        const days = [];
        this.selectedDates.forEach(dateString => {
            const date = new Date(dateString);
            days.push({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                date: date.getDate(),
            });
        });

        const settings = [];
        const rows = this.modal.querySelector('#form-rows').querySelectorAll('tr');
        
        rows.forEach(row => { 
            // 행별로 데이터 파싱해서 Db 저장하기
            const statusBtn = row.querySelector('.status-btn:first-child');
            const status = statusBtn.classList.contains('active')? 1 : 0;

            const price = row.querySelector('.price-input').value;


            const timeRange = row.querySelectorAll('.dropdown-display');
            const openClose = [ JSON.parse(timeRange[0].textContent), JSON.parse(timeRange[1].textContent) ];



            const usageTime = this.isOvernight ? '0' : timeRange[2].textContent;




            // const rowData = this.getRowData(row);
            settings.push({
                roomId: row.id,
                isOvernight: this.isOvernight? 1 : 0,

                status: status,
                price: price,
                openClose: JSON.stringify(openClose),
                usageTime: usageTime    
            });
        });

        const data = {
            days: days,
            settings: settings
        }

        console.log(data);

        const res = await fetch('/api/dailySettings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(res.ok) {
            console.log(result.msg);
            this.onSaveCallback();
            return true;
        }
        else {
            console.error(result.msg);
            return false;
        }
    }

    remove() {
        this.modal.remove();
    }

    getRootElement() {
        return this.modal;
    }
} 