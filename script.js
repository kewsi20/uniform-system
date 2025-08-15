let employees = [];
let inventory = {};
const records = [];

document.getElementById('excelUpload').addEventListener('change', handleExcelUpload);
document.getElementById('submitBtn').addEventListener('click', submitRecord);
document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
document.getElementById('addStockBtn').addEventListener('click', addStock);
document.getElementById('employeeSearch').addEventListener('input', filterEmployees);

async function loadInventory() {
  const res = await fetch('inventory.json');
  inventory = await res.json();
  updateInventoryTable();
}

async function loadEmployeesFromJson() {
  try {
    const res = await fetch('employees.json');
    const json = await res.json();
    employees = json;
    populateEmployeeSelect(employees);
  } catch (e) {
    console.warn('未找到 employees.json，請上傳 Excel');
  }
}

function handleExcelUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    employees = json.map(row => ({
      id: String(row['employee id']).trim(),
      name: String(row['name']).trim()
    }));
    populateEmployeeSelect(employees);
  };
  reader.readAsArrayBuffer(file);
}

function populateEmployeeSelect(list) {
  const select = document.getElementById('employeeSelect');
  select.innerHTML = '';
  list.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = `${emp.id} - ${emp.name}`;
    select.appendChild(option);
  });
}

function filterEmployees() {
  const keyword = document.getElementById('employeeSearch').value.toLowerCase();
  const filtered = employees.filter(e =>
    e.id.toLowerCase().includes(keyword) || e.name.toLowerCase().includes(keyword)
  );
  populateEmployeeSelect(filtered);
}

function updateInventoryTable() {
  const table = document.getElementById('inventoryTable');
  table.innerHTML = '<tr><th>類型</th><th>尺寸</th><th>數量</th></tr>';
  for (let type in inventory) {
    for (let size in inventory[type]) {
      const qty = inventory[type][size];
      const style = qty < 10 ? 'low-stock' : '';
      table.innerHTML += `<tr><td>${type}</td><td>${size}</td><td class="${style}">${qty}</td></tr>`;
    }
  }
  const now = new Date().toLocaleString();
  document.getElementById('lastUpdated').textContent = `最後更新時間：${now}`;
}

function submitRecord() {
  const id = document.getElementById('employeeSelect').value;
  const type = document.getElementById('uniformType').value;
  const size = document.getElementById('size').value;
  const result = document.getElementById('result');

  const employee = employees.find(e => e.id === id);
  if (!employee) {
    result.textContent = '❌ 員工不存在';
    return;
  }

  if (inventory[type][size] > 0) {
    inventory[type][size]--;
    const date = new Date().toISOString().split('T')[0];
    records.push({ id, name: employee.name, date, type, size });
    updateInventoryTable();
    result.textContent = `✅ ${employee.name} 成功領取 ${type} 尺寸 ${size}`;
  } else {
    result.textContent = `⚠️ ${type} 尺寸 ${size} 已無庫存`;
  }
}

function addStock() {
  const type = document.getElementById('addType').value;
  const size = document.getElementById('addSize').value;
  const qty = parseInt(document.get
