import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) return <div className="text-white p-4">잘못된 접근입니다.</div>;

  const { name, phone, startDate, endDate, roomType, price } = state;

  const format = (d) => new Date(d).toLocaleDateString();

  return (
    <div className="bg-[#0b0b24] text-white w-screen h-screen flex flex-col justify-center items-center space-y-4">
      <div className="text-xl font-bold">결제 확인</div>
      <div>이름: {name}</div>
      <div>연락처: {phone}</div>
      <div>객실: {roomType}</div>
      <div>숙박일: {format(startDate)} ~ {format(endDate)}</div>
	  <div>총 결제 금액: {price.toLocaleString()}원</div>
      <button
        className="px-6 py-2 bg-white text-black rounded"
        onClick={() => alert("결제 완료 (구현 예정)")}
      >
        결제 확정
      </button>
      <button
        className="text-sm underline"
        onClick={() => navigate(-1)}
      >
        돌아가기
      </button>
    </div>
  );
}
