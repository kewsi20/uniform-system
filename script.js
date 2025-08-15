const categories = ["新T-Shirt","旧T-Shirt","新Pants","旧Pants"];
const sizes = ["S","M","L","XL","2XL","3XL","4XL","5XL"];

// Load or initialize data
let inventory = JSON.parse(localStorage.getItem("inventory")) || initInventory();
let records = JSON.parse(localStorage.getItem("records")) || [];
let employees = JSON.parse(localStorage.getItem("employees")) || [];

function initInventory(){
  const obj = {};
  categories.forEach(c => {
    obj[c] = {};
    sizes.forEach(s => obj[c][s] = 0);
  });
  return obj;
}

function saveData(){
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("records", JSON.stringify(records));
  localStorage.setItem("employees", JSON.stringify(employees));
}

function updateInventoryTable(){
  const tbody = document.getElementById("inventory-table");
  tbody.innerHTML = "";
  categories.forEach(c => {
    const row = document.createElement("tr");
    row.innerHTML = `<th colspan="2" style="background:#f0f0f0">${c}</th>`;
    tbody.appendChild(row);
    sizes.forEach(s => {
      const qty = inventory[c][s];
      const tr = document.createElement("tr");
      if(qty < 10) tr.classList.add("low-stock");
      tr.innerHTML = `<td>${s}</td><td>${qty}</td>`;
      tbody.appendChild(tr);
    });
  });
  document.getElementById("lastUpdate").textContent = `最新更新时间：${new Date().toLocaleString()}`;
  saveData();
  updateChart();
}

document.getElementById("stock-form").onsubmit = e => {
  e.preventDefault();
  const c = document.getElementById("stockCategory").value;
  const s = document.getElementById("stockSize").value;
  const q = parseInt(document.getElementById("stockQty").value);
  inventory[c][s] += q;
  updateInventoryTable();
};

document.getElementById("receive-form").onsubmit = e => {
  e.preventDefault();
  const id = document.getElementById("employeeId").value;
  const name = document.getElementById("employeeName").value;
  const c = document.getElementById("uniformCategory").value;
  const s = document.getElementById("uniformSize").value;
  const d = document.getElementById("receiveDate").value || (new Date().toISOString().split("T")[0]);

  if (!id || !name) return alert("请先选择员工。");
  if (inventory[c][s] > 0) {
    inventory[c][s]--;
    records.push({date: d, id, name, category: c, size: s});
    updateInventoryTable();
    alert("登记成功！");
  } else {
    alert("库存不足！");
  }
};

document.getElementById("employeeExcel").onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = evt => {
    const data = new Uint8Array(evt.target.result);
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    employees = [];
    json.forEach(r => {
      if (r["ID"] && r["姓名"]) employees.push({ id: r["ID"], name: r["姓名"] });
    });
    renderEmployeeOptions();
    saveData();
  };
  reader.readAsArrayBuffer(file);
};

function renderEmployeeOptions(){
  document.getElementById("employeeList").innerHTML = employees.map(e=>`<li>${e.id} - ${e.name}</li>`).join("");
  document.getElementById("employeeIdList").innerHTML = employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join("");
}

document.getElementById("employeeId").oninput = e => {
  const emp = employees.find(em => em.id === e.target.value);
  document.getElementById("employeeName").value = emp ? emp.name : "";
};

document.getElementById("exportPdf").onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("员工领取记录", 20, 20);
  records.forEach((r,i) => {
    doc.text(`${i+1}. ${r.date} | ${r.id} | ${r.name} | ${r.category} | ${r.size}`, 20, 30 + i*10);
  });
  doc.save("领取记录.pdf");
};

document.getElementById("exportExcel").onclick = () => {
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "领取记录");
  XLSX.writeFile(wb, "领取记录.xlsx");
};

let chart;
function updateChart(){
  const ctx = document.getElementById("inventoryChart").getContext("2d");
  if(chart) chart.destroy();
  const labels = [], data = [];
  categories.forEach(c => sizes.forEach(s => {labels.push(`${c}-${s}`); data.push(inventory[c][s]);}));
  chart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: "库存数量", data, backgroundColor: "#4CAF50" }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

renderEmployeeOptions();
updateInventoryTable();
