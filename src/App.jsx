// React 객체 :
// useState : 상태 관리
// useMemo : 값을 기억해서 불필요한 계산 방지 -> 렌더링 최적화
// useCallback : 함수 자체를 기억해서 어쩌구
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

  // 상태가 바뀔 때 마다 React가 컴포넌트를 다시 실행한다 : App() 함수 재실행 
export default function App() {
	const navigate = useNavigate(); 

  // useState를 사용해 React의 내부 상태 슬롯에 상태 저장 공간을 할당한다
  // 해당 상태값과 이를 변경할 수 있는 setter 함수를 함께 반환한다
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [roomType, setRoomType] = useState("스탠다드룸 (기본 2인)");
  const [showRoomList, setShowRoomList] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const roomOptions = [
    "스탠다드룸 (기본 2인)",
    "디럭스룸 (기본 2인)",
    "패밀리룸 (기본 4인)",
  ];
  
  const specialDeals = [
  {
    id: "deal1",
    title: "🔥 오늘만! 스탠다드룸 1박 25,000원",
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    roomType: "스탠다드룸 (기본 2인)",
    price: 25000,
  },
  {
    id: "deal2",
    title: "🌙 주말 디럭스 2박 50,000원",
    startDate: new Date("2025-04-05"),
    endDate: new Date("2025-04-07"),
    roomType: "디럭스룸 (기본 2인)",
    price: 50000,
  },
];

const extraOptionsList = [
  { id: "extraPerson", label: "인원 추가 (+10,000원)", price: 10000 },
  { id: "breakfast", label: "조식 포함 (+5,000원)", price: 5000 },
];


const [selectedDeal, setSelectedDeal] = useState(null);
const [showDeals, setShowDeals] = useState(false);

const [selectedOptions, setSelectedOptions] = useState([]);
const [showExtras, setShowExtras] = useState(false);


  // 유틸 함수
  const formatDate = (date) =>
    date ? `${date.getMonth() + 1}/${date.getDate()}` : "";
  const handleDayClick = useCallback((day) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else {
      if (day < startDate) {
        setStartDate(day);
        setEndDate(null);
      } else {
        setEndDate(day);
      }
    }
  }, [startDate, endDate]);
  
  const toggleOption = (id) => {
  setSelectedOptions((prev) =>
    prev.includes(id) ? prev.filter((opt) => opt !== id) : [...prev, id]
  );
};

  // 달력 렌더 최적화
  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    for (let i = 1; i <= lastDate; i++) {
      const thisDate = new Date(year, month, i);
      const isSelected =
        (startDate && thisDate.toDateString() === startDate.toDateString()) ||
        (endDate && thisDate.toDateString() === endDate.toDateString());
      const inRange =
        startDate &&
        endDate &&
        thisDate > startDate &&
        thisDate < endDate;

      days.push(
        <button
          key={i}
          className={`w-8 h-8 text-sm rounded-full transition
            ${isSelected ? "bg-white text-black font-bold" : ""}
            ${inRange ? "bg-gray-400 text-white" : ""}
            ${!isSelected && !inRange ? "hover:bg-gray-600" : ""}`}
          onClick={() => handleDayClick(thisDate)}
        >
          {i}
        </button>
      );
    }

    return days;
  }, [currentMonth, startDate, endDate, handleDayClick]);

  const handlePayment = () => {
    if (!startDate || !endDate || !name || !phone) {
      alert("날짜, 이름, 연락처를 모두 입력해주세요.");
      return;
    }

    const ok = confirm("결제하시겠습니까?");
    if (ok) {
      navigate("/payment", {
        state: {
          name,
          phone,
          startDate,
          endDate,
          roomType,
		  price: calculatePrice,
        },
      });
    }
  };
  
const calculatePrice = useMemo(() => {
  if (!startDate || !endDate) return 0;

  let basePrice = selectedDeal
    ? selectedDeal.price
    : ((endDate - startDate) / (1000 * 60 * 60 * 24) || 1) * 30000;

  const extrasPrice = selectedOptions
    .map((id) => extraOptionsList.find((opt) => opt.id === id)?.price || 0)
    .reduce((a, b) => a + b, 0);

  return basePrice + extrasPrice;
}, [startDate, endDate, selectedDeal, selectedOptions]);

  
  // 실제 렌더링 되는 부분
  return (
    <div className="bg-[#0b0b24] text-white w-screen h-screen flex justify-center items-center">
	 <div className="border border-white rounded-2xl p-4 w-[90vw] max-w-sm space-y-3">
        <div className="text-center text-sm">팔레스 빠른 예약</div>
		
		<div className="bg-yellow-400 text-black text-sm rounded px-2 py-1 text-center">
		  🎁 현재 특가 상품이 있습니다!
		</div>

		<div className="relative">
		  <button
			className="w-full py-2 border rounded-lg text-sm bg-black/10"
			onClick={() => setShowDeals((prev) => !prev)}
		  >
			{selectedDeal ? selectedDeal.title : "특가 상품 선택 ▾"}
		  </button>
		  {showDeals && (
			<div className="absolute w-full mt-1 bg-black border rounded z-10 max-h-40 overflow-y-auto">
			  {specialDeals.map((deal) => (
				<div
				  key={deal.id}
				  className="px-2 py-1 hover:bg-gray-700 text-sm cursor-pointer"
				  onClick={() => {
					setSelectedDeal(deal);
					setStartDate(deal.startDate);
					setEndDate(deal.endDate);
					setRoomType(deal.roomType);
					setShowDeals(false);
				  }}
				>
				  {deal.title}
				</div>
			  ))}
			</div>
		  )}
		</div>


        {/* 달력 */}
        <div className="bg-black/20 p-2 rounded-xl text-center space-y-2">
          <div className="flex justify-between items-center">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
              ◀
            </button>
            <span>
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{calendarDays}</div>

          <div className="text-xs">
            ({formatDate(startDate)}{endDate ? ` ~ ${formatDate(endDate)}` : ""})
          </div>
        </div>

        {/* 객실 선택 */}
        <div className="relative">
          <button
            className="w-full py-2 border rounded-lg text-sm"
            onClick={() => setShowRoomList(!showRoomList)}
          >
            {roomType} ▾
          </button>
          {showRoomList && (
            <div className="absolute w-full mt-1 bg-black border rounded z-10">
              {roomOptions.map((opt) => (
                <div
                  key={opt}
                  className="px-2 py-1 hover:bg-gray-700 text-sm cursor-pointer"
                  onClick={() => {
                    setRoomType(opt);
                    setShowRoomList(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
<div className="relative">
  <button
    className="w-full py-2 border rounded-lg text-sm bg-black/10"
    onClick={() => setShowExtras((prev) => !prev)}
  >
    추가 옵션 선택 ▾
  </button>
  {showExtras && (
    <div className="absolute w-full mt-1 bg-black border rounded z-10">
      {extraOptionsList.map((opt) => (
        <div
          key={opt.id}
          className={`px-2 py-1 hover:bg-gray-700 text-sm cursor-pointer ${
            selectedOptions.includes(opt.id) ? "bg-gray-700" : ""
          }`}
          onClick={() => toggleOption(opt.id)}
        >
          {opt.label}
        </div>
      ))}
    </div>
  )}
</div>
{selectedOptions.length > 0 && (
  <div className="text-xs text-gray-300">
    선택한 옵션: {selectedOptions.map((id) => extraOptionsList.find((o) => o.id === id)?.label).join(", ")}
  </div>
)}
        {/* 이름/연락처 입력 */}
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full py-2 px-2 border rounded bg-black/20 text-sm"
        />
        <input
          type="text"
          placeholder="연락처 (예: 010-1234-5678)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full py-2 px-2 border rounded bg-black/20 text-sm"
        />

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          className="w-full py-2 bg-white text-black rounded font-bold"
        >
			{calculatePrice.toLocaleString()}원 결제
        </button>
      </div>
    </div>
  );
}