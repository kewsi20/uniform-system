const sizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const inventory = JSON.parse(localStorage.getItem("inventory")) || Object.fromEntries(sizes.map(size => [size, 0]));
const records = JSON.parse(localStorage.getItem("records")) || [];
const employees = [];

function saveData() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("records", JSON.stringify(records));
}

function updateInventoryTable() {
  const table = document.getElementById("inventory-table");
  table.innerHTML = "";
  for (const size of sizes) {
    const qty = inventory[size];
    const row = document.createElement("tr");
    if (qty < 10) row.classList.add("low-stock");
    row.innerHTML = `<td>${size}</td><td>${qty}</td>`;
    table.appendChild(row);
  }
  document.getElementById("lastUpdate").textContent = new Date().toLocaleString();
}

function updateEmployeeDropdown() {
  const nameSelect = document.getElementById("employeeName");
  nameSelect.innerHTML = `<option value="">请选择员工</option>`;
  employees.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.name;
    option.textContent = `${emp.name} (${emp.id})`;
    nameSelect.appendChild(option);
  });
}

// 增加库存
document.getElementById("stock-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const size = document.getElementById("stockSize").value;
  const qty = parseInt(document.getElementById("stockQty").value);
  inventory[size] += qty;
  saveData();
  updateInventoryTable();
});

// 员工领取登记
document.getElementById("receive-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("employeeId").value.trim();
  const name = document.getElementById("employeeName").value.trim();
  const size = document.getElementById("uniformSize").value;
  const date = document.getElementById("receiveDate").value || new Date().toISOString().split("T")[0];

  if (!id || !name) {
    alert("请填写员工信息！");
    return;
  }

  if (inventory[size] > 0) {
    inventory[size]--;
    records.push({ id, name, size, date });
    saveData();
    updateInventoryTable();
    alert("领取成功！");
  } else {
    alert("库存不足！");
  }
});

// PDF 导出
document.getElementById("exportPdf").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("员工领取报表", 20, 20);
  let y = 30;
  records.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.id} - ${r.name} - ${r.size} - ${r.date}`, 20, y);
    y += 10;
  });
  doc.save("领取报表.pdf");
});

// 上传 Excel 员工名单
document.getElementById("employeeExcel").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    employees.length = 0;
    json.forEach((row) => {
      if (row["ID"] && row["姓名"]) employees.push({ id: row["ID"], name: row["姓名"] });
    });
    updateEmployeeDropdown();
    const list = document.getElementById("employeeList");
    list.innerHTML = employees.map((e) => `<li>${e.id} - ${e.name}</li>`).join("");
  };
  reader.readAsArrayBuffer(file);
});

// 输入员工 ID 自动填充姓名
document.getElementById("employeeId").addEventListener("input", () => {
  const idInput = document.getElementById("employeeId").value.trim();
  const found = employees.find(emp => emp.id === idInput);
  if (found) {
    document.getElementById("employeeName").value = found.name;
  }
});

// 选择姓名自动填充 ID
document.getElementById("employeeName").addEventListener("change", () => {
  const nameSelected = document.getElementById("employeeName").value;
  const found = employees.find(emp => emp.name === nameSelected);
  if (found) {
    document.getElementById("employeeId").value = found.id;
  }
});

updateInventoryTable();
