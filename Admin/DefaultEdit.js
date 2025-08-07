class DefaultEdit {
    constructor(onSubmitCallback, defaultData = null, isOvernight = false) {
        this.defaultData = defaultData;
        this.onSubmitCallback = onSubmitCallback;
        this.isOvernight = isOvernight;

        this.container = document.createElement('div');
        this.container.className = 'price-table-inner-container';

        this.createTable();
    }

    createTable() {
        const innerContainer = document.createElement('div');
        innerContainer.className = 'price-table-inner-top-container';
        this.container.appendChild(innerContainer);

        const h3 = document.createElement('h3');
        innerContainer.appendChild(h3);

        const roomNameInput = document.createElement('input');
        roomNameInput.type = 'text';
        roomNameInput.className = 'room-name-input';
        roomNameInput.value = this.defaultData.roomType;
        roomNameInput.style.cssText = 'font-size: 1.3rem; color: #1e293b; font-weight: 600; background: transparent; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; width: 200px;';
        h3.appendChild(roomNameInput);

        const table = document.createElement('table');
        this.container.appendChild(table);

        const thead = document.createElement('thead');
        table.appendChild(thead);
         
        const headerRow = document.createElement('tr');
        thead.appendChild(headerRow);

        const headers = ['항목/요일', '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        let rows = [];
        if(this.isOvernight) {
            rows = [
                { label: '판매/마감', data: JSON.parse(this.defaultData.overnightStatus) },
                { label: '판매가', data: JSON.parse(this.defaultData.overnightPrice) },
                { label: '입실/퇴실 시각', data: JSON.parse(this.defaultData.overnightOpenClose) },
            ];
        } 
        else {
            rows = [
                { label: '판매/마감', data: JSON.parse(this.defaultData.dailyStatus) },
                { label: '판매가', data: JSON.parse(this.defaultData.dailyPrice) },
                { label: '개시/마감 시각', data: JSON.parse(this.defaultData.dailyOpenClose) },
                { label: '이용시간', data: JSON.parse(this.defaultData.dailyUsageTime) }
            ];
        }

        let dataCells = [];
        rows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            tbody.appendChild(tr);
            const labelTd = document.createElement('td');
            labelTd.textContent = row.label;
            tr.appendChild(labelTd);
            
            dataCells[rowIndex] = [];
            row.data.forEach(value => {
                const td = document.createElement('td');
                tr.appendChild(td);

                dataCells[rowIndex].push({cell: td, value: value});
            });
        });

        dataCells[0].forEach((item, cellIndex) => {
            this.createToggleCell(item.cell, item.value, 'overnightToggle' + cellIndex);
        });
        dataCells[1].forEach((item, cellIndex) => {
            this.createInputCell(item.cell, item.value, 'overnightInput' + cellIndex);
        });
        dataCells[2].forEach((item, cellIndex) => {
            this.createDropdownCell2(item.cell, item.value, 'overnightDropdown' + cellIndex);
        });

        if(!this.isOvernight) {
            dataCells[3].forEach((item, cellIndex) => {
                this.createDropdownCell(item.cell, item.value, 'dailyDropdown' + cellIndex);
            });
        }
    }

    createToggleCell(cellContainer, data, id) {
        const statusButtons = document.createElement('div');
        statusButtons.className = 'status-buttons';
        statusButtons.id = `status-buttons-${id}`;
        cellContainer.appendChild(statusButtons);

        const saleBtn = document.createElement('button');
        saleBtn.className = `status-btn ${data ? 'active' : ''}`;
        saleBtn.textContent = '판매';
        saleBtn.onclick = () => this.toggleStatus(id);
        statusButtons.appendChild(saleBtn);
                    
        const closeBtn = document.createElement('button');
        closeBtn.className = `status-btn ${!data ? 'active' : ''}`;
        closeBtn.textContent = '마감';
        closeBtn.onclick = () => this.toggleStatus(id);
        statusButtons.appendChild(closeBtn);
    }

    createInputCell(cellContainer, data, id) {
        const priceContainer = document.createElement('div');
        priceContainer.className = 'price-input-container';
        cellContainer.appendChild(priceContainer);

        const priceInput = document.createElement('input');
        priceInput.type = 'text';
        priceInput.className = 'price-input';
        priceInput.value = data;
        priceInput.maxLength = 8;
        priceInput.oninput = (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
        };
        priceContainer.appendChild(priceInput);
             
        const priceUnit = document.createElement('span');
        priceUnit.textContent = '원';
        priceUnit.style.marginLeft = '2px';
        priceUnit.style.fontSize = '0.75rem';
        priceContainer.appendChild(priceUnit);
    }

    createDropdownCell2(cellContainer, data, id) {
        const timeInputs = document.createElement('div');
        timeInputs.className = 'time-inputs';
        cellContainer.appendChild(timeInputs);

        const openDropdown = document.createElement('div');
        openDropdown.className = 'custom-dropdown';
        openDropdown.id = `open-hour-${id}`;
        openDropdown.onmouseenter = () => this.showDropdown(openDropdown, 'hour', 0, 23, data[0]);
        openDropdown.onmouseleave = () => this.hideDropdown(openDropdown);
        timeInputs.appendChild(openDropdown);

        const openDisplay = document.createElement('div');
        openDisplay.className = 'dropdown-display';
        openDisplay.textContent = data[0];
        openDropdown.appendChild(openDisplay);
                
        const openOptions = document.createElement('div');
        openOptions.className = 'dropdown-options';
        openOptions.style.display = 'none';
        openDropdown.appendChild(openOptions);

        const timeSeparator1 = document.createElement('span');
        timeSeparator1.className = 'time-separator';
        timeSeparator1.textContent = '시~';
        timeInputs.appendChild(timeSeparator1);

        const closeDropdown = document.createElement('div');
        closeDropdown.className = 'custom-dropdown';
        closeDropdown.id = `close-hour-${id}`;
        closeDropdown.onmouseenter = () => this.showDropdown(closeDropdown, 'hour', 0, 23, data[1]);
        closeDropdown.onmouseleave = () => this.hideDropdown(closeDropdown);
        timeInputs.appendChild(closeDropdown);

        const closeDisplay = document.createElement('div');
        closeDisplay.className = 'dropdown-display';
        closeDisplay.textContent = data[1];
        closeDropdown.appendChild(closeDisplay);

        const closeOptions = document.createElement('div');
        closeOptions.className = 'dropdown-options';
        closeOptions.style.display = 'none';
        closeDropdown.appendChild(closeOptions);


        const timeSeparator2 = document.createElement('span');
        timeSeparator2.className = 'time-separator';
        timeSeparator2.textContent = '시';
        timeInputs.appendChild(timeSeparator2);
    }

    createDropdownCell(cellContainer, data, id) {
        const timeInputs = document.createElement('div');
        timeInputs.className = 'time-inputs';
        timeInputs.style.cssText = 'justify-content: center !important; align-items: center !important; gap: 2px !important; display: flex !important;';
        cellContainer.appendChild(timeInputs);

        const usageDropdown = document.createElement('div');
        usageDropdown.className = 'custom-dropdown';
        usageDropdown.id = `usage-hour-${id}`;
        usageDropdown.onmouseenter = () => this.showDropdown(usageDropdown, 'usage', 2, 12, data, 1);
        usageDropdown.onmouseleave = () => this.hideDropdown(usageDropdown);
        timeInputs.appendChild(usageDropdown);

        const usageDisplay = document.createElement('div');
        usageDisplay.className = 'dropdown-display';
        usageDisplay.textContent = data;
        usageDropdown.appendChild(usageDisplay);

        const usageOptions = document.createElement('div');
        usageOptions.className = 'dropdown-options';
        usageOptions.style.display = 'none';
        usageDropdown.appendChild(usageOptions);

        const usageUnit = document.createElement('span');
        usageUnit.style.cssText = 'font-size: 0.75rem !important; color: #374151 !important;';
        usageUnit.textContent = '시간';
        timeInputs.appendChild(usageUnit);   
    }

    toggleStatus(id) {
        const statusButtons = document.getElementById(`status-buttons-${id}`);
        const saleBtn = statusButtons.querySelector('.status-btn.active');
        const closeBtn = statusButtons.querySelector('.status-btn:not(.active)');

        if (saleBtn) {
            saleBtn.classList.remove('active');
            closeBtn.classList.add('active');
        } else {
            saleBtn.classList.add('active');
            closeBtn.classList.remove('active');
        }
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

    async submit() {

        const id = this.defaultData.id;
        const roomType = this.container.querySelector('.room-name-input').value;

        let dailyStatus = [];
        let dailyPrice = [];
        let dailyOpenClose = [];
        let dailyUsageTime = [];
        let overnightStatus = [];
        let overnightPrice = [];
        let overnightOpenClose = [];
        if(this.isOvernight) {
            dailyStatus = JSON.parse(this.defaultData.dailyStatus);
            dailyPrice = JSON.parse(this.defaultData.dailyPrice);
            dailyOpenClose = JSON.parse(this.defaultData.dailyOpenClose);
            dailyUsageTime = JSON.parse(this.defaultData.dailyUsageTime);
            const rows = this.container.querySelectorAll('tbody tr');
            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td:not(:first-child)'); 
                cells.forEach((cell, cellIndex) => {
                    if (rowIndex === 0) {
                        const activeCell =cell.querySelector('.status-btn.active');
                        if(activeCell.textContent === '판매') {
                            overnightStatus[cellIndex] = 1;
                        } 
                        else {
                            overnightStatus[cellIndex] = 0;
                        }
                    } 
                    else if (rowIndex === 1) {
                        const price = cell.querySelector('.price-input').value;
                        overnightPrice[cellIndex] = parseInt(price);    
                    } 
                    else if (rowIndex === 2) {
                        const dropdowns = cell.querySelectorAll('.dropdown-display');
                        const openTime = parseInt(dropdowns[0].textContent);
                        const closeTime = parseInt(dropdowns[1].textContent);
                        overnightOpenClose[cellIndex] = [openTime, closeTime];
                    }
                });
            });
        }
        else {
            const rows = this.container.querySelectorAll('tbody tr');
            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td:not(:first-child)'); 
                cells.forEach((cell, cellIndex) => {
                    overnightStatus = JSON.parse(this.defaultData.overnightStatus);
                    overnightPrice = JSON.parse(this.defaultData.overnightPrice);
                    overnightOpenClose = JSON.parse(this.defaultData.overnightOpenClose);

                    if (rowIndex === 0) {
                        const activeCell =cell.querySelector('.status-btn.active');
                        if(activeCell.textContent === '판매') {
                            dailyStatus[cellIndex] = 1;
                        } 
                        else {
                            dailyStatus[cellIndex] = 0;
                        }
                    } 
                    else if (rowIndex === 1) {
                        const price = cell.querySelector('.price-input').value;
                        dailyPrice[cellIndex] = parseInt(price);    
                    } 
                    else if (rowIndex === 2) {
                        const dropdowns = cell.querySelectorAll('.dropdown-display');
                        const openTime = parseInt(dropdowns[0].textContent);
                        const closeTime = parseInt(dropdowns[1].textContent);
                        dailyOpenClose[cellIndex] = [openTime, closeTime];
                    }
                    else if (rowIndex === 3) {
                        const usageTime = parseInt(cell.querySelector('.dropdown-display').textContent);
                        dailyUsageTime[cellIndex] = usageTime;
                    } 
                });
            });
        }

        const data = {
            id: id,
            roomType: roomType,
            overnightStatus: JSON.stringify(overnightStatus),
            overnightPrice: JSON.stringify(overnightPrice),
            overnightOpenClose: JSON.stringify(overnightOpenClose),
            dailyStatus: JSON.stringify(dailyStatus),
            dailyPrice: JSON.stringify(dailyPrice),
            dailyOpenClose: JSON.stringify(dailyOpenClose),
            dailyUsageTime: JSON.stringify(dailyUsageTime),
        };


        console.log(data);
        const res = await fetch(`/api/defaultSettings/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if(res.ok) {
            console.log(result.msg);
            this.onSubmitCallback();
            return true;
        }
        else {
            console.error(result.msg);
            return false;
        }
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}
