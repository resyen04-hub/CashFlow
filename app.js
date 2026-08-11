(function () {
  var rate = 15850;
  var currency = "IDR";
  var entryType = "income";
  var idCounter = 1;

  var sources = {
    income: ["Pekerjaan", "Orang tua", "Investasi — forex", "Investasi — saham", "Bisnis", "Lainnya"],
    expense: ["Sewa", "Makanan", "Perangkat", "Gaji karyawan", "Transportasi", "Persediaan", "Lainnya"]
  };

  var txns = [
    { id: idCounter++, date: "2026-01-12", time: "09:15", desc: "Pembayaran klien — Toko Melati", source: "Pekerjaan", idr: 47710000 },
    { id: idCounter++, date: "2026-01-24", time: "10:00", desc: "Sewa kantor", source: "Sewa", idr: -15057500 },
    { id: idCounter++, date: "2026-02-03", time: "14:30", desc: "Retainer konsultasi", source: "Pekerjaan", idr: 66570000 },
    { id: idCounter++, date: "2026-02-18", time: "11:45", desc: "Perlengkapan gudang", source: "Persediaan", idr: -10144000 },
    { id: idCounter++, date: "2026-03-05", time: "16:20", desc: "Keuntungan trading forex", source: "Investasi — forex", idr: 21556000 },
    { id: idCounter++, date: "2026-03-21", time: "09:50", desc: "Pembayaran kontraktor", source: "Gaji karyawan", idr: -17752000 },
    { id: idCounter++, date: "2026-04-09", time: "13:10", desc: "Penjualan produk", source: "Pekerjaan", idr: 24726000 },
    { id: idCounter++, date: "2026-04-15", time: "08:30", desc: "Langganan perangkat lunak", source: "Perangkat", idr: -2948100 },
    { id: idCounter++, date: "2026-05-02", time: "19:00", desc: "Bantuan dari orang tua", source: "Orang tua", idr: 14265000 },
    { id: idCounter++, date: "2026-05-19", time: "15:40", desc: "Pembayaran klien — Studio Rahayo", source: "Pekerjaan", idr: 45017000 },
    { id: idCounter++, date: "2026-06-01", time: "10:05", desc: "Dividen saham", source: "Investasi — saham", idr: 12363000 },
    { id: idCounter++, date: "2026-06-14", time: "17:25", desc: "Transportasi dan logistik", source: "Transportasi", idr: -6498500 }
  ];

  var initialBalance = 63340000;

  function formatMoney(idrValue) {
    if (currency === "IDR") {
      return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(idrValue));
    }
    var usdValue = idrValue / rate;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usdValue);
  }

  function formatAxis(idrValue) {
    if (currency === "IDR") {
      if (idrValue === 0) return "Rp 0";
      return "Rp " + Math.round(idrValue / 1000000) + "jt";
    }
    var usdValue = idrValue / rate;
    var abs = Math.abs(usdValue);
    return (usdValue < 0 ? "-$" : "$") + (abs >= 1000 ? Math.round(abs / 1000) + "k" : Math.round(abs));
  }

  function monthLabel(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { month: "short" });
  }

  function monthKey(dateStr) {
    return dateStr.slice(0, 7);
  }

  function aggregateMonthly() {
    var map = {};
    txns.forEach(function (t) {
      var key = monthKey(t.date);
      if (!map[key]) map[key] = { key: key, label: monthLabel(t.date), income: 0, expense: 0 };
      if (t.idr >= 0) map[key].income += t.idr;
      else map[key].expense += Math.abs(t.idr);
    });
    var keys = Object.keys(map).sort();
    var last = keys.slice(-6);
    return last.map(function (k) { return map[k]; });
  }

  function buildChart() {
    var svg = document.getElementById("chart");
    svg.innerHTML = "";
    var months = aggregateMonthly();

    if (months.length === 0) {
      svg.innerHTML = '<text class="empty-note" x="320" y="130" text-anchor="middle">Belum ada catatan — tambahkan di bawah untuk melihat grafik.</text>';
      return;
    }

    var maxVal = 0;
    months.forEach(function (m) {
      maxVal = Math.max(maxVal, m.income, m.expense);
    });
    if (maxVal === 0) maxVal = 1000000;
    var niceMax = Math.ceil(maxVal / 1000000) * 1000000 * 1.15;

    var left = 54, right = 600, top = 20, bottom = 220;
    var stepCount = months.length > 1 ? months.length - 1 : 1;
    var stepX = (right - left) / stepCount;

    function xFor(i) { return months.length === 1 ? (left + right) / 2 : left + i * stepX; }
    function yFor(v) { return bottom - (v / niceMax) * (bottom - top); }

    var svgNS = "http://www.w3.org/2000/svg";
    var frag = document.createDocumentFragment();

    [0, 0.25, 0.5, 0.75, 1].forEach(function (frac) {
      var y = top + frac * (bottom - top);
      var line = document.createElementNS(svgNS, "line");
      line.setAttribute("class", "grid-line");
      line.setAttribute("x1", left - 4); line.setAttribute("x2", right);
      line.setAttribute("y1", y); line.setAttribute("y2", y);
      frag.appendChild(line);

      var val = Math.round(niceMax * (1 - frac));
      var text = document.createElementNS(svgNS, "text");
      text.setAttribute("class", "axis-label");
      text.setAttribute("x", 4); text.setAttribute("y", y + 4);
      text.textContent = formatAxis(val);
      frag.appendChild(text);
    });

    var incomePts = [], expensePts = [];
    months.forEach(function (m, i) {
      var x = xFor(i);
      incomePts.push(x + "," + yFor(m.income));
      expensePts.push(x + "," + yFor(m.expense));

      var mlabel = document.createElementNS(svgNS, "text");
      mlabel.setAttribute("class", "month-label");
      mlabel.setAttribute("x", x); mlabel.setAttribute("y", 245);
      mlabel.setAttribute("text-anchor", "middle");
      mlabel.textContent = m.label;
      frag.appendChild(mlabel);
    });

    var incomeLine = document.createElementNS(svgNS, "polyline");
    incomeLine.setAttribute("class", "line-income");
    incomeLine.setAttribute("points", incomePts.join(" "));
    frag.appendChild(incomeLine);

    var expenseLine = document.createElementNS(svgNS, "polyline");
    expenseLine.setAttribute("class", "line-expense");
    expenseLine.setAttribute("points", expensePts.join(" "));
    frag.appendChild(expenseLine);

    months.forEach(function (m, i) {
      var x = xFor(i);
      var cIn = document.createElementNS(svgNS, "circle");
      cIn.setAttribute("class", "pt-income"); cIn.setAttribute("r", 3);
      cIn.setAttribute("cx", x); cIn.setAttribute("cy", yFor(m.income));
      frag.appendChild(cIn);

      var cOut = document.createElementNS(svgNS, "circle");
      cOut.setAttribute("class", "pt-expense"); cOut.setAttribute("r", 3);
      cOut.setAttribute("cx", x); cOut.setAttribute("cy", yFor(m.expense));
      frag.appendChild(cOut);
    });

    svg.appendChild(frag);
  }

  function renderLedger() {
    var body = document.getElementById("ledger-body");
    body.innerHTML = "";
    var sorted = txns.slice().sort(function (a, b) {
      var da = a.date + " " + a.time, db = b.date + " " + b.time;
      return db.localeCompare(da);
    });

    if (sorted.length === 0) {
      body.innerHTML = '<tr class="empty-row"><td colspan="5">Belum ada catatan.</td></tr>';
      return;
    }

    sorted.forEach(function (t) {
      var tr = document.createElement("tr");
      var dir = t.idr >= 0 ? "in" : "out";
      var sign = t.idr >= 0 ? "+" : "\u2212";
      var d = new Date(t.date + "T00:00:00");
      var dateDisplay = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + ", " + t.time;
      tr.innerHTML =
        '<td class="chk"><input type="checkbox" class="row-check" data-id="' + t.id + '" aria-label="Pilih catatan"></td>' +
        '<td class="date" data-label="Tanggal">' + dateDisplay + '</td>' +
        '<td class="desc" data-label="Keterangan">' + t.desc + '</td>' +
        '<td class="cat" data-label="Sumber">' + t.source + '</td>' +
        '<td class="amt ' + dir + '" data-label="Jumlah">' +
          '<span class="money" data-idr="' + t.idr + '">' + sign + formatMoney(Math.abs(t.idr)) + '</span>' +
        '</td>';
      body.appendChild(tr);
    });
  }

  function renderCards() {
    var income = 0, expense = 0;
    txns.forEach(function (t) {
      if (t.idr >= 0) income += t.idr; else expense += Math.abs(t.idr);
    });
    var balance = initialBalance + income - expense;

    var balEl = document.getElementById("card-balance");
    var incEl = document.getElementById("card-income");
    var expEl = document.getElementById("card-expense");

    balEl.setAttribute("data-idr", balance);
    incEl.setAttribute("data-idr", income);
    expEl.setAttribute("data-idr", expense);

    balEl.textContent = formatMoney(balance);
    incEl.textContent = formatMoney(income);
    expEl.textContent = formatMoney(expense);
  }

  function refreshAll() {
    renderCards();
    renderLedger();
    buildChart();
    var selectAll = document.getElementById("select-all");
    if (selectAll) selectAll.checked = false;
  }

  function morphSwitch(newCurrency) {
    if (newCurrency === currency) return;
    var els = document.querySelectorAll(".money");
    els.forEach(function (el) { el.classList.add("morph"); });
    setTimeout(function () {
      currency = newCurrency;
      refreshAll();
      document.querySelectorAll(".money").forEach(function (el) { el.classList.remove("morph"); });
    }, 160);
  }

  function populateSources() {
    var select = document.getElementById("f-source");
    select.innerHTML = "";
    sources[entryType].forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      select.appendChild(opt);
    });
  }

  document.getElementById("btn-idr").addEventListener("click", function () {
    document.getElementById("btn-idr").classList.add("active");
    document.getElementById("btn-usd").classList.remove("active");
    morphSwitch("IDR");
  });

  document.getElementById("btn-usd").addEventListener("click", function () {
    document.getElementById("btn-usd").classList.add("active");
    document.getElementById("btn-idr").classList.remove("active");
    morphSwitch("USD");
  });

  document.getElementById("theme-toggle").addEventListener("click", function () {
    var html = document.documentElement;
    var isDark = html.getAttribute("data-theme") === "dark";
    html.setAttribute("data-theme", isDark ? "light" : "dark");
    document.getElementById("theme-thumb").textContent = isDark ? "☀" : "☾";
  });

  var typeToggle = document.getElementById("type-toggle");
  typeToggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      typeToggle.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      entryType = btn.getAttribute("data-type");
      populateSources();
    });
  });

  document.getElementById("entry-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var amount = parseFloat(document.getElementById("f-amount").value);
    if (!amount || amount <= 0) return;

    var idrValue = entryType === "expense" ? -Math.abs(amount) : Math.abs(amount);

    var source = document.getElementById("f-source").value;
    var date = document.getElementById("f-date").value || new Date().toISOString().slice(0, 10);
    var time = document.getElementById("f-time").value || "00:00";
    var note = document.getElementById("f-note").value.trim() || source;

    txns.push({
      id: idCounter++,
      date: date,
      time: time,
      desc: note,
      source: source,
      idr: Math.round(idrValue)
    });

    document.getElementById("f-amount").value = "";
    document.getElementById("f-note").value = "";

    refreshAll();
  });

  document.getElementById("select-all").addEventListener("change", function () {
    var checked = this.checked;
    document.querySelectorAll(".row-check").forEach(function (cb) { cb.checked = checked; });
  });

  document.getElementById("delete-selected").addEventListener("click", function () {
    var idsToDelete = [];
    document.querySelectorAll(".row-check:checked").forEach(function (cb) {
      idsToDelete.push(parseInt(cb.getAttribute("data-id"), 10));
    });
    if (idsToDelete.length === 0) return;
    txns = txns.filter(function (t) { return idsToDelete.indexOf(t.id) === -1; });
    refreshAll();
  });

  var now = new Date();
  document.getElementById("f-date").value = now.toISOString().slice(0, 10);
  document.getElementById("f-time").value = now.toTimeString().slice(0, 5);

  populateSources();
  refreshAll();
})();
