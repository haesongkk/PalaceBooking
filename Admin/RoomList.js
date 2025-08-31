class RoomList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'room-list-container';
        this.container.innerHTML = `
            <div class="room-settings-top-container">
                <button class="room-settings-add-button">객실 추가</button>
            </div>
            <div class="room-list-bottom-container">
            </div>
        `;

        this.container.querySelector('.room-settings-add-button').onclick = () => {
            fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: '새 객실',
                    images: [],
                    description: '새 객실 설명'
                })
            })
            .then(res => res.json())
            .then(data => {
                if(data.error) {
                    alert(data.error);
                    return;
                }
                this.updateRoomList();
            })
        }

        this.updateRoomList();
    }

    updateRoomList() {
        const bottomContainer = this.container.querySelector('.room-list-bottom-container');
        bottomContainer.innerHTML = '';

        fetch('/api/rooms')
        .then(res => res.json())
        .then(data => {
            data.forEach(room => {
                const roomItem = `
                    <div class="room-settings-item">
                        <h3>${room.name}</h3>
                        ${room.images.map(image => `
                            <img 
                                src="/api/image/${image}" 
                                style="width: 100px; height: 100px;"
                            >`).join('')}
                        ${room.description.split('\n').map(line => `
                            <br>${line}
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

    editRoom(id) {
        window.popupCanvas.append(
            '객실 수정', 
            new RoomEdit(id, () => this.updateRoomList()),
        );
    }

    deleteRoom(id) {
        if(!confirm("정말 삭제하시겠습니까?")) return;
        fetch(`/api/rooms/${id}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
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