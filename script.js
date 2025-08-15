let inventory = {};
let employees = [];
const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

window.onload = () => {
  fetch('inventory.json')
    .then(res => res.json())
    .then(data => {
      inventory = data;
      updateInventoryTable();
    });

  fetch('employee.json')
    .then(res => res.json())
    .then(data => {
      employees = data;
      populateEmployeeDropdown();
    });

  document.getElementById('excelUpload').addEventListener('change', handleExcelUpload);
};

function populateEmployeeDropdown() {
  const select = document.getElementById('employeeSelect');
  select.innerHTML = '';
  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = `${emp.name} (${emp.id})`;
    select.appendChild(option);
  });
}

function handleExcelUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const workbook = XLSX.read(e.target.result, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    employees = data.map(row => ({ id: row.ID, name: row.Name }));
    populateEmployeeDropdown();
  };
  reader.readAsBinaryString(file);
}

function addInventory() {
  const type = document.getElementById('addType').value;
  const size = document.getElementById('addSize').value;
  const qty = parseInt(document.getElementById('addQty').value);
  if (!qty || qty <= 0) return;

  inventory[type][size] = (inventory[type][size] || 0) + qty;
  updateInventoryTable();
}

function pickupUniform() {
  const empId = document.getElementById('employeeSelect').value;
  const type = document.getElementById('pickupType').value;
  const size = document.getElementById('pickupSize').value;
  const qty = parseInt(document.getElementById('pickupQty').value);
  if (!qty || qty <= 0) return;

  if (inventory[type][size] < qty) {
    alert('库存不足');
    return;
  }

  inventory[type][size] -= qty;
  const time = new Date().toLocaleString();
  console.log(`员工 ${empId} 于 ${time} 领取 ${type} ${size} x${qty}`);
  updateInventoryTable();
}

function updateInventoryTable() {
  const table = document.getElementById('inventoryTable');
  let html = '<thead><tr><th>制服类型</th>' + sizes.map(s => `<th>${s}</th>`).join('') + '</tr></thead><tbody>';

  for (let type in inventory) {
    html += `<tr><td>${type}</td>`;
    sizes.forEach(size => {
      const qty = inventory[type][size] ?? 0;
      const cls = qty < 10 ? 'low-stock' : '';
      html += `<td class="${cls}">${qty}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody>';
  table.innerHTML = html;
}
