// 기본 실행 순서
// package.json의 "dev": "vite" -> npm run dev : vite (개발 서버) 실행
// vite는 index.html을 찾아서 시작한다 (vite의 표준 entry point : index.html)
// index.html의 <script type="module" src="/src/main.jsx"></script> -> main.jsx 실행

// react : jsx 문법을 사용하기 위한 기본 라이브러리
// reactdom : react 컴포넌트를 html에 연결한다
// index.css : css 기반 디자인 규칙 정의 (배경색, 폰트 등)
// app.jsx : 메인 프로세스 컴포넌트 정의
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';  
import App from './App.jsx'; 
import PaymentPage from './PaymentPage.jsx';

// 진입점 : APP/ = APP()
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);