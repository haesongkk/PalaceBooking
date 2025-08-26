class RoomList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'room-settings-container';
        this.container.innerHTML = `
            <div class="room-settings-top-container">
                <button class="room-settings-add-button">객실 추가</button>
            </div>
            <div class="room-settings-bottom-container">
            </div>
        `;

        this.container.querySelector('.room-settings-add-button').addEventListener('click', () => {
            this.addRoom();
        });

        this.updateRoomList();
    }

    updateRoomList() {
        console.log(this.container);
        const bottomContainer = this.container.querySelector('.room-settings-bottom-container');
        console.log(bottomContainer);
        bottomContainer.innerHTML = '';

        fetch('/api/rooms')
        .then(res => res.json())
        .then(data => {
            data.forEach(room => {
                console.log(room);
                const roomItem = `
                    <div class="room-settings-item">
                        <h3>${room.name}</h3>
                        ${JSON.parse(room.image).map(image => `
                            <img 
                                src="${image}" 
                                style="width: 100px; height: 100px;"
                            >`).join('')}
                        ${room.description.split('\n').map(line => `
                            <p>${line}</p>
                            `).join('')}
                        <div class="room-settings-buttons">
                            <button 
                                class="room-settings-edit-button" 
                                id="${room.id}"
                            >수정</button>
                            <button 
                                class="room-settings-delete-button" 
                                id="${room.id}"
                            >삭제</button>
                        </div>
                    </div>
                `;

                bottomContainer.innerHTML += roomItem;
            });
            bottomContainer.querySelectorAll('.room-settings-edit-button').forEach(button => {
                button.addEventListener('click', () => {
                    this.editRoom(button.id);
                });
            });
            bottomContainer.querySelectorAll('.room-settings-delete-button').forEach(button => {
                button.addEventListener('click', () => {
                    this.deleteRoom(button.id);
                });
            });
        })
    }

    addRoom() {
        fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: '새 객실',
                image: JSON.stringify(['/uploads/default.png']),
                description: '새 객실 설명'
            })
        })
        .then(res => {
            this.updateRoomList();
        })
    }

    editRoom(id) {
        window.popupCanvas.append(
            '객실 수정', 
            new RoomEdit(id, () => this.updateRoomList()),
        );
    }

    deleteRoom(id) {
        fetch(`/api/rooms/${id}`, {
            method: 'DELETE'
        })
        .then(res => {
            if(res.status !== 200) {
                confirm(res.json().error);
                return;
            }
            this.updateRoomList();
        })
    }

    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}