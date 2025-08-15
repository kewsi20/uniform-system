const sizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const inventory = Object.fromEntries(sizes.map(size => [size, 0]));
const records = [];
const employees = [];

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

document.getElementById("stock-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const size = document.getElementById("stockSize").value;
  const qty = parseInt(document.getElementById("stockQty").value);
  inventory[size] += qty;
  updateInventoryTable();
});

document.getElementById("receive-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("employeeId").value;
  const name = document.getElementById("employeeName").value;
  const size = document.getElementById("uniformSize").value;
  const date = document.getElementById("receiveDate").value || new Date().toISOString().split("T")[0];
  if (inventory[size] > 0) {
    inventory[size]--;
    records.push({ id, name, size, date });
    updateInventoryTable();
    alert("领取成功！");
  } else {
    alert("库存不足！");
  }
});

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
    const list = document.getElementById("employeeList");
    list.innerHTML = employees.map((e) => `<li>${e.id} - ${e.name}</li>`).join("");
 
