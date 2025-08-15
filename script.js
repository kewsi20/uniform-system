// 初始化尺寸类型
const categories = ["新T-Shirt", "旧T-Shirt", "新Pants", "旧Pants"];
const sizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

// 从 localStorage 读取数据
let inventory = JSON.parse(localStorage.getItem("inventory")) || initInventory();
let records = JSON.parse(localStorage.getItem("records")) || [];
let employees = JSON.parse(localStorage.getItem("employees")) || [];

// 初始化库存对象
function initInventory() {
    let obj = {};
    categories.forEach(cat => {
        obj[cat] = {};
        sizes.forEach(size => {
            obj[cat][size] = 0;
        });
    });
    return obj;
}

// 更新库存表格 & 图表
function updateInventoryTable() {
    const table = document.getElementById("inventory-table");
    table.innerHTML = "";

    categories.forEach(cat => {
        let catRow = document.createElement("tr");
        catRow.innerHTML = `<th colspan="2" style="background:#f0f0f0">${cat}</th>`;
        table.appendChild(catRow);

        sizes.forEach(size => {
            const qty = inventory[cat][size];
            const row = document.createElement("tr");
            if (qty < 10) row.classList.add("low-stock");
            row.innerHTML = `<td>${size}</td><td>${qty}</td>`;
            table.appendChild(row);
        });
    });

    document.getElementById("lastUpdate").textContent = "最新更新时间：" + new Date().toLocaleString();
    saveData();
    updateChart();
}

// 保存数据到 localStorage
function saveData() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
    localStorage.setItem("records", JSON.stringify(records));
    localStorage.setItem("employees", JSON.stringify(employees));
}

// 增加库存
document.getElementById("stock-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const category = document.getElementById("stockCategory").value;
    const size = document.getElementById("stockSize").value;
    const qty = parseInt(document.getElementById("stockQty").value);

    inventory[category][size] += qty;
    updateInventoryTable();
});

// 员工领取登记
document.getElementById("receive-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("employeeId").value;
    const name = document.getElementById("employeeName").value;
    const category = document.getElementById("uniformCategory").value;
    const size = document.getElementById("uniformSize").value;
    const date = document.getElementById("receiveDate").value || new Date().toISOString().split("T")[0];

    if (!id || !name) return alert("请先选择员工！");
    if (inventory[category][size] > 0) {
        inventory[category][size]--;
        records.push({ id, name, category, size, date });
        updateInventoryTable();
        alert("领取成功！");
    } else {
        alert("库存不足！");
    }
});

// 上传员工 Excel
document.getElementById("employeeExcel").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        employees.length = 0;
        json.forEach(row => {
            if (row["ID"] && row["姓名"]) employees.push({ id: row["ID"], name: row["姓名"] });
        });
        renderEmployeeList();
        saveData();
    };
    reader.readAsArrayBuffer(file);
});

// 显示员工列表 & datalist
function renderEmployeeList() {
    const list = document.getElementById("employeeList");
    const datalist = document.getElementById("employeeIdList");
    list.innerHTML = employees.map(e => `<li>${e.id} - ${e.name}</li>`).join("");
    datalist.innerHTML = employees.map(e => `<option value="${e.id}">${e.name}</option>`).join("");
}

// 自动匹配姓名
document.getElementById("employeeId").addEventListener("input", (e) => {
    const emp = employees.find(emp => emp.id === e.target.value);
    document.getElementById("employeeName").value = emp ? emp.name : "";
});

// 导出 PDF
document.getElementById("exportPdf").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("员工领取报表", 20, 20);
    let y = 30;
    records.forEach((r, i) => {
        doc.text(`${i + 1}. ${r.id} - ${r.name} - ${r.category} - ${r.size} - ${r.date}`, 20, y);
        y += 10;
    });
    doc.save("领取报表.pdf");
});

// 导出 Excel
document.getElementById("exportExcel").addEventListener("click", () => {
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "领取记录");
    XLSX.writeFile(wb, "领取报表.xlsx");
});

// 库存图表
let chart;
function updateChart() {
    const ctx = document.getElementById("inventoryChart").getContext("2d");
    if (chart) chart.destroy();

    let labels = [];
    let data = [];
    categories.forEach(cat => {
        sizes.forEach(size => {
            labels.push(`${cat} - ${size}`);
            data.push(inventory[cat][size]);
        });
    });

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "库存数量",
                data: data,
                backgroundColor: "#4CAF50"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
                y: { beginAtZero: true }
            }
        }
    });
}

// 初始化
renderEmployeeList();
updateInventoryTable();
