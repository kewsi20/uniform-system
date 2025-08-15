// ========================= 基本常量与工具 =========================
const SIZES = ["S","M","L","XL","2XL","3XL","4XL","5XL"];
const CATEGORY_LABEL = {
  tshirt_new: "T-shirt（新）",
  tshirt_old: "T-shirt（旧）",
  pants_new : "Pants（新）",
  pants_old : "Pants（旧）",
};
const LOW_STOCK_THRESHOLD = 10;

const nowStr = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// ========================= 状态与持久化 =========================
let state = {
  inventory: {
    tshirt_new: Object.fromEntries(SIZES.map(s=>[s,0])),
    tshirt_old: Object.fromEntries(SIZES.map(s=>[s,0])),
    pants_new : Object.fromEntries(SIZES.map(s=>[s,0])),
    pants_old : Object.fromEntries(SIZES.map(s=>[s,0])),
  },
  employees: [],   // {id,name}
  records: [],     // {date,id,name,category,size,qty}
  lastUpdated: "--"
};

const LS_KEY = "uniform_manager_v1";

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw);
      return Promise.resolve();
    } catch {}
  }
  // 若本地没有，则尝试加载仓库中的 JSON 作为初始值
  return Promise.allSettled([
    fetch("inventory.json").then(r=>r.ok?r.json():null).catch(()=>null),
    fetch("employee.json").then(r=>r.ok?r.json():null).catch(()=>null),
  ]).then(([invRes, empRes])=>{
    if (invRes.status==="fulfilled" && invRes.value) {
      // 兼容旧结构：如果是平面结构，迁移为四类
      if (!invRes.value.tshirt_new) {
        ["tshirt_new","tshirt_old","pants_new","pants_old"].forEach(k=>{
          state.inventory[k] = Object.fromEntries(SIZES.map(s=>[s, invRes.value[s] || 0]));
        });
      } else {
        state.inventory = invRes.value;
      }
    }
    if (empRes.status==="fulfilled" && Array.isArray(empRes.value)) {
      // 兼容字段名
      state.employees = empRes.value.map(e => ({
        id: e.id || e.ID || e["Employee ID"] || "",
        name: e.name || e["姓名"] || e["Employee Name"] || ""
      })).filter(e=>e.id && e.name);
    }
    saveState();
  });
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  document.getElementById("lastUpdatedSpan").textContent = state.lastUpdated || "--";
}

// ========================= DOM 引用 =========================
const inventoryTbody = document.getElementById("inventoryTbody");
const recordsTbody   = document.getElementById("recordsTbody");
const employeeList   = document.getElementById("employeeList");

const stockForm      = document.getElementById("stockForm");
const stockCategory  = document.getElementById("stockCategory");
const stockSize      = document.getElementById("stockSize");
const stockQty       = document.getElementById("stockQty");

const receiveForm    = document.getElementById("receiveForm");
const empIdInput     = document.getElementById("empId");
const empNameInput   = document.getElementById("empName");
const recvCategory   = document.getElementById("recvCategory");
const recvSize       = document.getElementById("recvSize");
const recvQty        = document.getElementById("recvQty");
const recvDate       = document.getElementById("recvDate");

const chartCategory  = document.getElementById("chartCategory");
const filterCategory = document.getElementById("inventoryFilterCategory");

const exportPdfBtn   = document.getElementById("exportPdf");
const exportExcelBtn = document.getElementById("exportExcel");
const exportJsonBtn  = document.getElementById("exportJson");
const clearAllBtn    = document.getElementById("clearAll");

// ========================= 渲染：库存表 =========================
function renderInventoryTable() {
  const fc = filterCategory.value;
  inventoryTbody.innerHTML = "";
  Object.entries(state.inventory).forEach(([cat, sizes])=>{
    if (fc !== "all" && fc !== cat) return;
    SIZES.forEach(size=>{
      const qty = sizes[size] || 0;
      const tr = document.createElement("tr");
      if (qty < LOW_STOCK_THRESHOLD) tr.classList.add("low");
      tr.innerHTML = `
        <td>${CATEGORY_LABEL[cat]}</td>
        <td>${size}</td>
        <td class="right">${qty}</td>
      `;
      inventoryTbody.appendChild(tr);
    });
  });
}

// ========================= 渲染：员工列表 =========================
function renderEmployees() {
  employeeList.innerHTML = state.employees
    .map(e=>`<li>${e.id} - ${e.name}</li>`)
    .join("");
}

// ========================= 渲染：记录表 =========================
function renderRecords() {
  recordsTbody.innerHTML = state.records.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${CATEGORY_LABEL[r.category]||r.category}</td>
      <td>${r.size}</td>
      <td class="right">${r.qty}</td>
    </tr>
  `).join("");
}

// ========================= 图表 =========================
let chart;
function renderChart() {
  const ctx = document.getElementById("inventoryChart");
  const cat = chartCategory.value;
  const labels = SIZES.slice();
  const data = SIZES.map(s => state.inventory[cat]?.[s] ?? 0);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${CATEGORY_LABEL[cat]} 当前库存`,
        data,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision:0 } } },
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      }
    }
  });
}

// ========================= 业务：增加库存 =========================
stockForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const cat = stockCategory.value;
  const size = stockSize.value;
  const qty = Math.max(1, parseInt(stockQty.value||"1",10));
  state.inventory[cat][size] = (state.inventory[cat][size]||0) + qty;
  state.lastUpdated = nowStr();
  saveState();
  renderInventoryTable();
  renderChart();
  stockForm.reset();
});

// ========================= 业务：员工领取登记 =========================
receiveForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const id   = empIdInput.value.trim();
  const name = empNameInput.value.trim();
  const cat  = recvCategory.value;
  const size = recvSize.value;
  const qty  = Math.max(1, parseInt(recvQty.value||"1",10));
  const date = recvDate.value || new Date().toISOString().slice(0,10);

  // 库存检查
  const current = state.inventory[cat][size]||0;
  if (current < qty) {
    alert(`库存不足（当前 ${current} 件）`);
    return;
  }
  state.inventory[cat][size] = current - qty;

  // 写记录
  state.records.push({ date, id, name, category: cat, size, qty });

  // 员工名单去重加入
  if (id && name && !state.employees.some(e=>e.id===id)) {
    state.employees.push({ id, name });
  }

  state.lastUpdated = nowStr();
  saveState();
  renderInventoryTable();
  renderRecords();
  renderChart();
  receiveForm.reset();
});

// ========================= 导入：员工 Excel =========================
document.getElementById("employeeExcel").addEventListener("change", e=>{
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt=>{
    const data = new Uint8Array(evt.target.result);
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(r=>{
      const id = r["Employee ID"] || r["ID"] || r["员工ID"] || r["工号"] || r["编号"];
      const name = r["Employee Name"] || r["姓名"] || r["Name"];
      if (id && name && !state.employees.some(e=>e.id===String(id))) {
        state.employees.push({ id: String(id), name: String(name) });
      }
    });
    saveState();
    renderEmployees();
    e.target.value = "";
  };
  reader.readAsArrayBuffer(file);
});

// ========================= 导出：PDF =========================
exportPdfBtn.addEventListener("click", ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text("员工领取记录", 40, 40);

  const rows = state.records.map(r=>[
    r.date, r.id, r.name, CATEGORY_LABEL[r.category]||r.category, r.size, r.qty
  ]);

  doc.autoTable({
    head: [["日期","员工ID","姓名","类别","尺寸","数量"]],
    body: rows,
    startY: 60,
    styles: { fontSize: 10 }
  });

  doc.setFontSize(10);
  doc.text(`Generated at: ${nowStr()}`, 40, doc.lastAutoTable.finalY + 24);
  doc.text(`Latest Updated: ${state.lastUpdated || "--"}`, 40, doc.lastAutoTable.finalY + 40);

  doc.save(`Uniform_Records_${new Date().toISOString().slice(0,10)}.pdf`);
});

// ========================= 导出：Excel =========================
exportExcelBtn.addEventListener("click", ()=>{
  // Sheet1: 领取记录
  const recSheet = XLSX.utils.json_to_sheet(state.records.map(r=>({
    Date: r.date,
    EmployeeID: r.id,
    EmployeeName: r.name,
    Category: CATEGORY_LABEL[r.category]||r.category,
    Size: r.size,
    Qty: r.qty
  })));

  // Sheet2: 当前库存快照（每类一行每尺码一列）
  const invRows = Object.entries(state.inventory).map(([cat, sizes])=>{
    const row = { Category: CATEGORY_LABEL[cat] };
    SIZES.forEach(s=> row[s] = sizes[s]||0 );
    return row;
  });
  const invSheet = XLSX.utils.json_to_sheet(invRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, recSheet, "Records");
  XLSX.utils.book_append_sheet(wb, invSheet, "Inventory Snapshot");
  XLSX.writeFile(wb, `Uniform_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
});

// ========================= 导出：JSON 备份 =========================
exportJsonBtn.addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Uniform_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ========================= 清空本地数据 =========================
clearAllBtn.addEventListener("click", ()=>{
  if (!confirm("确认清空本地所有数据？此操作不可撤销。")) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
});

// ========================= 事件：筛选 & 图表类别 =========================
filterCategory.addEventListener("change", renderInventoryTable);
chartCategory.addEventListener("change", renderChart);

// ========================= 启动：加载 & 渲染 =========================
loadState().then(()=>{
  document.getElementById("lastUpdatedSpan").textContent = state.lastUpdated || "--";
  renderInventoryTable();
  renderEmployees();
  renderRecords();
  renderChart();
});
