const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../Client")));

app.post("/api/reserve", (req, res) => {
    const { nickname, phone, room, startDate, endDate } = req.body;
    if (!nickname || !phone || !room || !startDate) {
        return res.status(400).json({ error: "필수 정보 누락" });
    }
    const id = db.addDetailedReservation({ nickname, phone, room, startDate, endDate });
    res.json({ success: true, id });
});

app.get("/api/last-reservation", (req, res) => {
    const { nickname, phone } = req.query;
    console.log("📩 받은 요청:", { nickname, phone }); // ← 이 줄 추가
    if (!nickname || !phone) {
        return res.status(400).json({ error: "닉네임과 전화번호를 입력해주세요." });
    }
    const data = db.getLastReservation(nickname, phone);
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: "이전 예약 없음" });
    }
});



app.listen(PORT, () => {
    console.log(`서버 실행됨 http://localhost:${PORT}`);
});
