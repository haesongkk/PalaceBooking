class DiscountEdit {
    constructor(onSubmitCallback) {
        this.onSubmitCallback = onSubmitCallback;
        this.rootElement = document.createElement('div');

        fetch(`/api/discount`)
            .then(res => res.json())
            .then(json => {
                if(json.err) {
                    throw new Error(json.err);
                }
                if(!json.data) {
                    throw new Error("no data in json");
                }
                if(!json.data.firstVisitDiscount) {
                    throw new Error("no firstVisitDiscount in data");
                } 
                if(!json.data.recentVisitDiscount) {
                    throw new Error("no recentVisitDiscount in data");
                }

                this.rootElement.innerHTML = `
                    <div class="first-visit-discount-container">
                        <h3 class="first-visit-discount-title">
                            첫 방문 할인 금액 (원/1박)
                        </h3>
                        <input class="first-visit-discount-input" value="${json.data.firstVisitDiscount}">
                    </div>
                    <div class="recent-visit-discount-container">
                        <h3 class="recent-visit-discount-title">
                            최근 방문 할인 금액 (원/1박)
                        </h3>
                        <input class="recent-visit-discount-input" value="${json.data.recentVisitDiscount}">
                    </div>
                `;
            })
            .catch(err => console.error(err));
    }

    async submit() {
        const szFirstVisitDiscount = this.rootElement.querySelector('.first-visit-discount-input').value;
        const szRecentVisitDiscount = this.rootElement.querySelector('.recent-visit-discount-input').value;

        if(!/^-?\d+$/.test(szFirstVisitDiscount) || !/^-?\d+$/.test(szRecentVisitDiscount)) {
            alert("할인 금액은 숫자여야 합니다.");
            return false;
        }

        const nFirstVisitDiscount = parseInt(szFirstVisitDiscount);
        const nRecentVisitDiscount = parseInt(szRecentVisitDiscount);

        const res = await fetch(`/api/discount`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                firstVisitDiscount: nFirstVisitDiscount, 
                recentVisitDiscount: nRecentVisitDiscount 
            })
        })
        const json = await res.json();
        if(json.err) {
            alert(json.err);
            return false;
        }
        this.onSubmitCallback();
        return true;
    }
    
    getRootElement() {
        return this.rootElement;
    }

    remove() {
        this.rootElement.remove();
    }

}