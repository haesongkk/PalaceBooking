const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());

// ✅ 이 줄이 핵심입니다: Client 폴더 정적 제공
app.use(express.static(path.join(__dirname, '../Client')));

// ✅ API 라우트 (예시)
app.post('/api/reserve', (req, res) => {
  const { text } = req.body;
  const id = db.addReservation(text);
  console.log('📥 예약 저장됨:', text);
  res.json({ success: true, id });
});

app.get('/api/reservations', (req, res) => {
  const data = db.getReservations();
  res.json(data);
});

app.post('/api/cancel', (req, res) => {
  const { id } = req.body;
  const result = db.cancelReservation(id);
  if (result.changes > 0) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '해당 ID 없음' });
  }
});


// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
