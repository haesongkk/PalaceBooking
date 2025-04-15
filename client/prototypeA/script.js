
let start = null, end = null, people = 2;
let roomType = "";
let specialDealPrice = null;
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function applyDeal() {
  start = new Date("2025-04-14");
  end = new Date("2025-04-15");
  roomType = "디럭스룸 (2인)";
  people = 2;
  specialDealPrice = 25000;
  goToStep(3);
}

function isDealTime() {
  return new Date().getHours() >= 19;
}

function goToStep(n) {
  document.querySelectorAll('.step').forEach((el, idx) => {
    el.classList.toggle('active', idx === n - 1);
  });
  const dateText = start ? `${format(start)}${end ? `~${format(end)}` : ''}` : '';
  if (n === 2) {
    document.getElementById('progress-summary-step2').textContent = dateText;
  }
  if (n === 3) {
    const summaryText = `${dateText}, ${roomType}, ${people}명`;
    document.getElementById('progress-summary-step3').textContent = summaryText;
  }
  const banner = document.getElementById('deal-banner');
  if (banner) banner.style.display = (n === 1 && isDealTime()) ? 'block' : 'none';
}

function changeMonth(offset) {
  calendarMonth += offset;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  } else if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
}

function selectRoom(el) {
  document.querySelectorAll('.room-types div').forEach(div => div.classList.remove('selected'));
  el.classList.add('selected');
  roomType = el.textContent;
}

function changePeople(delta) {
  people = Math.min(4, Math.max(1, people + delta));
  document.getElementById('people-num').textContent = people;
}

function format(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function renderCalendar() {
  const cal = document.getElementById('calendar');
  const monthLabel = document.getElementById('calendar-month');
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  cal.innerHTML = '';
  monthLabel.textContent = `${year}년 ${month + 1}월`;
  for (let i = 0; i < firstDay; i++) cal.appendChild(document.createElement('div'));
  for (let d = 1; d <= lastDate; d++) {
    const btn = document.createElement('div');
    btn.className = 'day';
    btn.textContent = d;
    const thisDate = new Date(year, month, d);
    btn.setAttribute('data-date', thisDate.toISOString().split('T')[0]);
    btn.onclick = () => selectDate(thisDate, btn);
    cal.appendChild(btn);
  }
}

function selectDate(date, el) {
  if (!start || (start && end)) {
    start = date;
    end = null;
  } else {
    if (date < start) {
      start = date;
    } else {
      end = date;
    }
  }
  updateCalendarUI();
}

function updateCalendarUI() {
  document.querySelectorAll('.day').forEach(el => el.classList.remove('selected', 'range'));
  if (!start) return;

  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end?.toISOString().split('T')[0];

  document.querySelectorAll('.day').forEach(el => {
    const dateStr = el.getAttribute('data-date');
    if (dateStr === startDateStr || dateStr === endDateStr) {
      el.classList.add('selected');
    } else if (start && end && dateStr > startDateStr && dateStr < endDateStr) {
      el.classList.add('range');
    }
  });

  document.getElementById('selected-dates').textContent = end
    ? `${format(start)} ~ ${format(end)}`
    : format(start);
}

renderCalendar();
if (isDealTime()) document.getElementById('deal-banner').style.display = 'block';
