let currentDB = null;
let currentTables = {};
let availableDBs = [];

// 페이지 로드 시 DB 목록 로드
window.onload = function() {
  loadDBList();
};

function loadDBList() {
  const dbSelector = document.getElementById('dbSelector');
  const container = document.getElementById('dataContainer');
  
  container.innerHTML = '<div class="loading">DB 목록을 불러오는 중...</div>';
  
  fetch('/api/dev/dbs')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      availableDBs = data;
      displayDBList(data);
    })
    .catch(error => {
      container.innerHTML = `
        <div class="error">
          <strong>오류 발생:</strong> ${error.message}
          <br><br>
          <small>서버가 실행 중인지 확인해주세요.</small>
        </div>
      `;
    });
}

function displayDBList(data) {
  const dbSelector = document.getElementById('dbSelector');
  const container = document.getElementById('dataContainer');
  
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-data">사용 가능한 DB 파일이 없습니다.</div>';
    return;
  }
  
  // DB 버튼들 생성
  dbSelector.innerHTML = data.map((db, index) => {
    const isActive = index === 0 ? 'active' : '';
    return `
      <button class="db-button ${isActive}" onclick="selectDB('${db.displayName}', event)">
        ${db.icon} ${db.name}
      </button>
    `;
  }).join('');
  
  // 첫 번째 DB 자동 선택
  if (data.length > 0) {
    selectDB(data[0].displayName);
  }
}

function selectDB(dbName, event = null) {
  currentDB = dbName;
  
  // 버튼 상태 업데이트
  document.querySelectorAll('.db-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // event가 있을 때만 target 사용
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    // event가 없으면 해당 DB 버튼을 찾아서 활성화
    document.querySelectorAll('.db-button').forEach(btn => {
      if (btn.textContent.includes(dbName)) {
        btn.classList.add('active');
      }
    });
  }
  
  // 테이블 목록 로드
  loadTableList(dbName);
}

function loadTableList(dbName) {
  const container = document.getElementById('dataContainer');
  const tableSelector = document.getElementById('tableSelector');
  
  container.innerHTML = '<div class="loading">테이블 목록을 불러오는 중...</div>';
  tableSelector.style.display = 'none';
  
  fetch(`/api/dev/db/${dbName}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      currentTables = data;
      displayTableList(data, dbName);
      
      // 첫 번째 테이블 자동 선택
      const tableNames = Object.keys(data);
      if (tableNames.length > 0) {
        selectTable(tableNames[0]);
      }
    })
    .catch(error => {
      container.innerHTML = `
        <div class="error">
          <strong>오류 발생:</strong> ${error.message}
          <br><br>
          <small>서버가 실행 중인지 확인해주세요.</small>
        </div>
      `;
    });
}

function displayTableList(data, dbName) {
  const container = document.getElementById('dataContainer');
  const tableSelector = document.getElementById('tableSelector');
  
  if (!data || Object.keys(data).length === 0) {
    container.innerHTML = '<div class="empty-data">테이블이 없습니다.</div>';
    return;
  }
  
  // 테이블 버튼들 생성
  const tableNames = Object.keys(data);
  tableSelector.innerHTML = tableNames.map(tableName => {
    const itemCount = Array.isArray(data[tableName]) ? data[tableName].length : 'N/A';
    return `
      <button class="table-button" onclick="selectTable('${tableName}', event)">
        📋 ${tableName} (${itemCount}개)
      </button>
    `;
  }).join('');
  
  tableSelector.style.display = 'flex';
  container.innerHTML = '<div class="empty-data">테이블을 선택해주세요.</div>';
}

function selectTable(tableName, event = null) {
  const container = document.getElementById('dataContainer');
  const tableSelector = document.getElementById('tableSelector');
  
  // 테이블 버튼 상태 업데이트
  document.querySelectorAll('.table-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // event가 있을 때만 target 사용
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    // event가 없으면 해당 테이블 버튼을 찾아서 활성화
    document.querySelectorAll('.table-button').forEach(btn => {
      if (btn.textContent.includes(tableName)) {
        btn.classList.add('active');
      }
    });
  }
  
  const tableData = currentTables[tableName];
  displayTableData(tableName, tableData);
}

function displayTableData(tableName, tableData) {
  const container = document.getElementById('dataContainer');
  
  let html = `
    <div class="section-title">📋 ${tableName} (${Array.isArray(tableData) ? tableData.length : 'N/A'}개 항목)</div>
  `;
  
  if (Array.isArray(tableData)) {
    if (tableData.length === 0) {
      html += '<div class="empty-data">빈 배열</div>';
    } else {
      tableData.forEach((item, index) => {
        html += `
          <div class="data-item">
            <div class="data-key">[${index}] 항목</div>
            <div class="data-value">${formatValue(item)}</div>
          </div>
        `;
      });
    }
  } else {
    html += `
      <div class="data-item">
        <div class="data-value">${formatValue(tableData)}</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function showTableList() {
  displayTableList(currentTables, currentDB);
  
  // 모든 테이블 버튼 비활성화
  document.querySelectorAll('.table-button').forEach(btn => {
    btn.classList.remove('active');
  });
}

function formatValue(value) {
  if (value === null) {
    return '<span class="null-value">null</span>';
  }
  
  if (typeof value === 'undefined') {
    return '<span class="null-value">undefined</span>';
  }
  
  if (typeof value === 'boolean') {
    return `<span class="boolean-value">${value}</span>`;
  }
  
  if (typeof value === 'number') {
    return `<span class="number-value">${value}</span>`;
  }
  
  if (typeof value === 'string') {
    return `<span class="string-value">"${escapeHtml(value)}"</span>`;
  }
  
  if (typeof value === 'object') {
    try {
      return formatObject(value);
    } catch (e) {
      return `<span class="string-value">${escapeHtml(String(value))}</span>`;
    }
  }
  
  return `<span class="string-value">${escapeHtml(String(value))}</span>`;
}

function formatObject(obj) {
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => formatValue(item)).join(', ') + ']';
  }
  
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return '{}';
  }
  
  const formattedEntries = entries.map(([key, value]) => {
    return `"${escapeHtml(key)}": ${formatValue(value)}`;
  });
  
  return '{\n  ' + formattedEntries.join(',\n  ') + '\n}';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

 