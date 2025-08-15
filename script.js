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
};

function populateEmployeeDropdown() {
  const select = document.getElementById('employeeSelect');
  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = `${emp.name} (${emp.id})`;
    select.appendChild(option);
  });
}

function handleUniformPickup() {
  const employeeId = document.getElementById('employeeSelect').value;
  const type = document.getElementById('uniformType').value;
  const size = document.getElementById('sizeSelect').value;
  const qty = parseInt(document.getElementById('quantityInput').value);

  if (!inventory[type][size] || inventory[type][size] < qty) {
    alert('库存不足，无法领取');
    return;
  }

  inventory[type][size] -= qty;
  updateInventoryTable();
}

function updateInventoryTable() {
  const table = document.getElementById('inventoryTable');
  let html = '<tr><th>制服类型</th>' + sizes.map(s => `<th>${s}</th>`).join('') + '</tr>';

  for (let type in inventory) {
    html += `<tr><td>${type}</td>`;
    sizes.forEach(size => {
      const qty = inventory[type][size] ?? 0;
      const style = qty < 10 ? 'low-stock' : '';
      html += `<td class="${style}">${qty}</td>`;
    });
    html += '</tr>';
  }

  table.innerHTML = html;
}
