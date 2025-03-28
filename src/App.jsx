import React, { useState, useMemo, useCallback } from "react";

export default function App() {
  // 날짜 선택 상태: 시작일과 종료일
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 객실 종류 선택
  const [roomType, setRoomType] = useState("스탠다드룸 (기본 2인)");
  const [showRoomList, setShowRoomList] = useState(false);

  // 사용자 정보 입력
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 달력 현재 월 상태
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const roomOptions = [
    "스탠다드룸 (기본 2인)",
    "디럭스룸 (기본 2인)",
    "패밀리룸 (기본 4인)",
  ];

  const formatDate = (date) =>
    date ? `${date.getMonth() + 1}/${date.getDate()}` : "";

  // 날짜 클릭 로직 최적화
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

  return (
    <div className="bg-[#0b0b24] text-white min-h-screen flex justify-center items-center">
      <div className="border border-white rounded-2xl p-4 w-72 space-y-3">
        <div className="text-center text-sm">팔레스 빠른 예약</div>

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
        <button className="w-full py-2 bg-white text-black rounded font-bold">
          30000원 결제
        </button>
      </div>
    </div>
  );
}