let employees = [];
let inventory = {};
const records = [];

async function loadEmployees() {
  const res = await fetch('employees.json');
  employees = await res.json();
  const select = document.getElementById('employeeSelect');
  select.innerHTML = '';
  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = `${emp.id} - ${emp.name}`;
    select.appendChild(option);
  });
}

async function loadInventory() {
  const res = await fetch('inventory.json');
  inventory = await res.json();
  updateInventoryTable();
}

function updateInventoryTable() {
  const table = document.getElementById('inventoryTable');
  table.innerHTML = '<tr><th>類型</th><th>尺寸</th><th>數量</th></tr>';
  for (let type in inventory) {
    for (let size in inventory[type]) {
      table.innerHTML += `<tr><td>${type}</td><td>${size}</td><td>${inventory[type][size]}</td></tr>`;
    }
  }
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
    records.push({ id, name: employee.name, type, size, date: new Date().toISOString().split('T')[0] });
    updateInventoryTable();
    result.textContent = `✅ ${employee.name} 成功領取 ${type} 尺寸 ${size}`;
  } else {
    result.textContent = `⚠️ ${type} 尺寸 ${size} 已無庫存`;
  }
}

document.getElementById('submitBtn').addEventListener('click', submitRecord);
window.onload = () => {
  loadEmployees();
  loadInventory();
};
