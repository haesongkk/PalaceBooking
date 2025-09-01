class RoomEdit {
    constructor(id, submitCallback) {
        this.id = id;
        this.submitCallback = submitCallback;

        this.container = document.createElement('div');
        this.container.classList.add('room-edit-container');

        this.imageList = [];

        this.createTable();
    }

    createTable() {
        fetch(`/api/rooms/${this.id}`)
        .then(res => res.json())
        .then(data => {
            this.container.innerHTML = `
                <label>객실 이름</label>
                <input 
                    type="text" 
                    id="room-name" 
                    value="${data.name}"
                    placeholder="객실 이름을 입력해주세요."
                >
                <label>객실 이미지</label>
                <input 
                    type="file" 
                    id="room-image-input" 
                    multiple
                >
                <div class="room-edit-preview"></div>
                <label>객실 설명</label>
                <textarea 
                    id="room-description" 
                    placeholder="객실 설명을 입력해주세요."
                >${data.description}</textarea>
            `;

            const roomImagePreview = this.container.querySelector('.room-edit-preview');

            for(const image of data.images) {
                this.imageList.push(image);
                const preview = document.createElement('img');
                roomImagePreview.appendChild(preview);

                preview.src = `/api/image/${image}`;
                preview.style.width = '100px';
                preview.style.height = '100px';
                preview.addEventListener('click', () => {
                    if(confirm('이미지를 삭제하시겠습니까?')) {
                        this.imageList.splice(this.imageList.indexOf(image), 1);
                        preview.remove();
                    }
                });
            }

            const roomImageInput = this.container.querySelector('#room-image-input');
            roomImageInput.addEventListener('change', (e) => {
                const addedFiles = e.target.files;
                const formData = new FormData();
                for(const file of addedFiles) {
                    formData.append('image', file);
                }
                fetch('/api/image', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if(data.error) {
                        alert(data.error);
                        return;
                    }

                    for(const id of data) {
                        this.imageList.push(id);
                        const preview = document.createElement('img');
                        roomImagePreview.appendChild(preview);

                        preview.src = `/api/image/${id}`;
                        preview.style.width = '100px';
                        preview.style.height = '100px';
                        preview.addEventListener('click', () => {
                            if(confirm('이미지를 삭제하시겠습니까?')) {
                                this.imageList.splice(this.imageList.indexOf(id), 1);
                                preview.remove();
                            }
                        });
                    }
                });
            });
        });
    }

    async submit() {
        await fetch(`/api/rooms/${this.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.container.querySelector('#room-name').value,
                description: this.container.querySelector('#room-description').value,
                images: this.imageList
            })
        });
        this.submitCallback();
        return true;
    }


    getRootElement() {
        return this.container;
    }

    remove() {
        this.container.remove();
    }
}
