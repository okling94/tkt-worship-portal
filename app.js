// ===== Google Apps Script 公開更表 API =====
// 這是公開 Web App 網址（以 /exec 結尾），不是密碼、API Key、Sheet ID 或電郵。
// 若仍為「我稍後會貼上 /exec URL」，網站不會發請求，繼續使用下方假資料。
const SCHEDULE_API_URL =
  "https://script.google.com/macros/s/AKfycbyRZ5MkUwpqAJHoiVZ4HNcQaPA3z4UctmDhTVhtMzinVNO28YTuGArxedjaO4gEwGS13g/exec";

const SCHEDULE_JSONP_SCRIPT_ID = "portal-schedule-jsonp";
const SCHEDULE_TIMEOUT_MS = 20000;

// 只會讀取／顯示這些公開崇拜欄位，忽略電郵、電話、改更、家事等其他資料
const PUBLIC_SCHEDULE_FIELDS = [
  "崇拜ID",
  "日期",
  "主持（MC）",
  "MC",
  "敬拜主領",
  "敬拜結他",
  "IT（PowerPoint）",
  "IT",
  "領聖餐牧師",
  "聖餐安排",
  "講道",
  "講題",
  "經文",
  "歌單連結",
  "程序表連結",
  "PPT連結",
  "資料夾連結",
  "狀態",
  "最後更新"
];

/*
  app.js
  用途：存放網站資料，並把資料填進 index.html 的空位。
  第一版沒有真實登入、沒有資料庫。更表可選擇以 JSONP 讀取公開的 Apps Script Web App；
  若網址未設定或載入失敗，會自動改用下方假資料，頁面不會壞掉。
  初學者提示：想改日期、人名、講題，只需要改下面的 data 物件。
*/

/* =========================================================
   所有假資料都集中在這個物件。
   日後若要接 Google 試算表 / Apps Script，也可以先從這裡開始替換。
   ========================================================= */
const data = {
  // 教會基本資料
  church: {
    name: "天地福音堂",
    portalName: "崇拜部 Portal",
    welcome:
      "願主的平安與你同在。這裡是崇拜部同工的工作入口，方便大家查看更表、預備崇拜、提交家事，並一同服事。"
  },

  // 下一次崇拜資訊卡
  nextService: {
    date: "2026年9月19日（六）",
    time: "下午 20:00",
    theme: "在主裡重新得力",
    mc: "天地會",
    worshipLeader: "天地會",
    guitar: "天地會",
    it: "天地會",
    communionPastor: "天地會",
    communionArrangement: "天地會"
  },

  // 本月崇拜更表（表格會依陣列順序顯示）
  rosterMonth: "2026年9月",
  roster: [
    {
      date: "9月6日",
      theme: "恩典夠用",
      mc: "天地會",
      worshipLeader: "天地會",
      guitar: "天地會",
      it: "天地會",
      communionPastor: "—",
      communionArrangement: "—"
    },
    {
      date: "9月13日",
      theme: "行走在光中",
      mc: "天地會",
      worshipLeader: "天地會",
      guitar: "天地會",
      it: "天地會",
      communionPastor: "—",
      communionArrangement: "—"
    },
    {
      date: "9月20日",
      theme: "在主裡重新得力",
      mc: "天地會",
      worshipLeader: "天地會",
      guitar: "天地會",
      it: "天地會",
      communionPastor: "天地會",
      communionArrangement: "天地會"
    },
    {
      date: "9月27日",
      theme: "彼此相愛",
      mc: "天地會",
      worshipLeader: "天地會",
      guitar: "天地會",
      it: "天地會",
      communionPastor: "—",
      communionArrangement: "—"
    }
  ],

  // 近日待辦事項
  todos: [
    {
      title: "歌單初稿",
      due: "9月16日（二）晚上 9:00 前",
      note: "請主領以表單提交歌單初稿，交崇拜部核對。",
      status: "進行中"
    },
    {
      title: "家事截止",
      due: "9月18日（四）中午 12:00 前",
      note: "代禱、感恩與教會通告請於截止前交齊。",
      status: "待辦"
    },
    {
      title: "PPT 定稿",
      due: "9月19日（五）晚上 8:00 前",
      note: "歌詞、經文與家事投影片需完成最後校對。",
      status: "待辦"
    }
  ],

  /*
    常用功能按鈕的連結。
    第一版先用 "#" 作為 placeholder（點下去會停留在本頁頂部）。

    日後可把 "#" 換成真實網址，例如：
    - roster:        Google Drive / Google Sheets 更表連結
    - changeRequest: Google Form「申請改更」表單
    - songDraft:     Google Form「提交歌單初稿」表單（用法同家事）
    - housework:     Google Form「提交家事」表單
    - ppt:           Google Slides 崇拜 PPT，或 Apps Script 網頁連結
  */
  links: {
    roster: "#", // 日後可貼上 Google Drive / Google Sheets 更表連結
    changeRequest: "#", // 日後可貼上 Google Form「申請改更」連結
    songDraft: "#", // 日後可貼上 Google Form「提交歌單初稿」連結
    housework: "#", // 日後可貼上 Google Form「提交家事」連結
    ppt: "#" // 日後可貼上 Google Slides 或 Apps Script 網頁連結
  }
};

/* ---------- 小工具：找到頁面上的元素 ---------- */
function $(selector) {
  return document.querySelector(selector);
}

let scheduleFromApi = false;
let scheduleRequestTimer = null;
const fallbackSnapshot = {
  nextService: JSON.parse(JSON.stringify(data.nextService)),
  roster: JSON.parse(JSON.stringify(data.roster)),
  rosterMonth: data.rosterMonth
};

function isScheduleApiConfigured() {
  const url = String(SCHEDULE_API_URL || "").trim();
  if (!url) return false;
  if (url.includes("我稍後會貼上")) return false;
  return /\/exec\/?$/i.test(url.split("?")[0]);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseISODate(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getTodayHongKong() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function formatLongDate(value) {
  const date = parseISODate(value);
  if (!date) return String(value || "").trim() || "待定";
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
}

function formatShortDate(value) {
  const date = parseISODate(value);
  if (!date) return String(value || "").trim() || "待定";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function displayTheme(value) {
  const text = String(value ?? "").trim();
  return text ? text : "待定";
}

function displayRole(value) {
  const text = String(value ?? "").trim();
  return text ? text : "—";
}

function displayCommunionPastor(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "-" || text === "－") return "—";
  return text;
}

function readPublicField(row, keys) {
  if (!row || typeof row !== "object") return "";
  for (let i = 0; i < keys.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(row, keys[i])) {
      return row[keys[i]];
    }
  }
  return "";
}

function pickPublicRow(row) {
  const publicRow = {};
  if (!row || typeof row !== "object") return publicRow;
  PUBLIC_SCHEDULE_FIELDS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      publicRow[key] = row[key];
    }
  });
  return publicRow;
}

function setScheduleSyncStatus(text) {
  const el = $("#roster-sync-status");
  if (el) el.textContent = text;
}

function showFallbackNotice(visible) {
  const el = $("#schedule-fallback-notice");
  if (!el) return;
  if (visible) el.removeAttribute("hidden");
  else el.setAttribute("hidden", "");
}

function useFallbackSchedule(showNotice) {
  data.nextService = JSON.parse(JSON.stringify(fallbackSnapshot.nextService));
  data.roster = JSON.parse(JSON.stringify(fallbackSnapshot.roster));
  data.rosterMonth = fallbackSnapshot.rosterMonth;
  scheduleFromApi = false;
  if ($("#next-service-card")) renderNextService();
  if ($("#roster-body")) renderRoster();
  setScheduleSyncStatus("資料來源：網站暫存資料");
  showFallbackNotice(Boolean(showNotice));
}

function mapApiRowToRoster(row) {
  return {
    isoDate: String(readPublicField(row, ["日期"]) || "").trim(),
    date: formatShortDate(readPublicField(row, ["日期"])),
    theme: displayTheme(readPublicField(row, ["講道"])),
    mc: displayRole(readPublicField(row, ["主持（MC）", "MC"])),
    worshipLeader: displayRole(readPublicField(row, ["敬拜主領"])),
    guitar: displayRole(readPublicField(row, ["敬拜結他"])),
    it: displayRole(readPublicField(row, ["IT（PowerPoint）", "IT"])),
    communionPastor: displayCommunionPastor(readPublicField(row, ["領聖餐牧師"])),
    communionArrangement: displayCommunionPastor(readPublicField(row, ["聖餐安排"]))
  };
}

function mapApiRowToNextService(row) {
  return {
    isoDate: String(readPublicField(row, ["日期"]) || "").trim(),
    date: formatLongDate(readPublicField(row, ["日期"])),
    time: (data.nextService && data.nextService.time) || "上午 11:00",
    theme: displayTheme(readPublicField(row, ["講道"])),
    preacher: displayTheme(readPublicField(row, ["講道"])),
    scripture: displayTheme(readPublicField(row, ["經文"])),
    mc: displayRole(readPublicField(row, ["主持（MC）", "MC"])),
    worshipLeader: displayRole(readPublicField(row, ["敬拜主領"])),
    guitar: displayRole(readPublicField(row, ["敬拜結他"])),
    it: displayRole(readPublicField(row, ["IT（PowerPoint）", "IT"])),
    communionPastor: displayCommunionPastor(readPublicField(row, ["領聖餐牧師"])),
    communionArrangement: displayCommunionPastor(readPublicField(row, ["聖餐安排"]))
  };
}

function pickNextServiceRow(rows, todayHongKong) {
  return rows.find((row) => {
    const iso = String(readPublicField(row, ["日期"]) || "").trim();
    return iso >= todayHongKong;
  }) || null;
}

/* 只供 Console 開發測試，不會改畫面或 data.nextService */
window.testNextServiceDate = function (dateString) {
  const rows = Array.isArray(data.schedule)
    ? data.schedule
        .map(pickPublicRow)
        .filter((row) => String(readPublicField(row, ["日期"]) || "").trim())
        .sort((a, b) =>
          String(readPublicField(a, ["日期"])).localeCompare(String(readPublicField(b, ["日期"])))
        )
    : [];
  const nextRow = pickNextServiceRow(rows, String(dateString || "").trim());
  const nextDate = nextRow ? String(readPublicField(nextRow, ["日期"]) || "").trim() : null;
  console.log("下一次崇拜：", nextDate);
  return nextDate;
};

function deriveRosterMonthLabel(rows) {
  const months = [];
  rows.forEach((row) => {
    const date = parseISODate(readPublicField(row, ["日期"]));
    if (!date) return;
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    if (!months.includes(label)) months.push(label);
  });
  if (months.length === 1) return months[0];
  if (months.length > 1) return "近期崇拜";
  return data.rosterMonth;
}

function buildScheduleRequestUrl() {
  const base = String(SCHEDULE_API_URL || "").trim();
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}action=schedule&callback=portalScheduleCallback&_=${Date.now()}`;
}

function applyLiveSchedule(payload) {
  data.schedule = payload.schedule;

  const rows = data.schedule
    .map(pickPublicRow)
    .filter((row) => String(readPublicField(row, ["日期"]) || "").trim())
    .sort((a, b) =>
      String(readPublicField(a, ["日期"])).localeCompare(String(readPublicField(b, ["日期"])))
    );

  if (!rows.length) {
    useFallbackSchedule(true);
    return;
  }

  const todayHongKong = getTodayHongKong();
  const nextRow = pickNextServiceRow(rows, todayHongKong);
  data.roster = rows.map(mapApiRowToRoster);
  data.nextService = nextRow ? mapApiRowToNextService(nextRow) : null;
  data.rosterMonth = deriveRosterMonthLabel(rows);
  scheduleFromApi = true;

  console.log("香港今天日期：", todayHongKong);
  console.log("下一次崇拜：", data.nextService);

  renderNextService();
  renderRoster();
  setScheduleSyncStatus(`最後同步：${payload.updatedAt || "—"}`);
  showFallbackNotice(false);
}

function loadScheduleFromApi() {
  window.portalScheduleCallback = function (payload) {
    console.log("Schedule payload:", payload);

    if (scheduleRequestTimer) {
      clearTimeout(scheduleRequestTimer);
      scheduleRequestTimer = null;
    }

    const loadedScript = document.getElementById(SCHEDULE_JSONP_SCRIPT_ID);
    if (loadedScript) loadedScript.remove();

    try {
      if (!payload || payload.ok !== true || !Array.isArray(payload.schedule)) {
        useFallbackSchedule(true);
        return;
      }
      applyLiveSchedule(payload);
    } catch (error) {
      console.error("Schedule API error:", error);
      useFallbackSchedule(true);
    }
  };

  if (!isScheduleApiConfigured()) {
    useFallbackSchedule(false);
    return;
  }

  const oldScript = document.getElementById(SCHEDULE_JSONP_SCRIPT_ID);
  if (oldScript) oldScript.remove();

  if (scheduleRequestTimer) {
    clearTimeout(scheduleRequestTimer);
    scheduleRequestTimer = null;
  }

  const requestUrl = buildScheduleRequestUrl();
  console.log("Schedule API URL:", requestUrl);

  scheduleRequestTimer = setTimeout(() => {
    scheduleRequestTimer = null;
    const pending = document.getElementById(SCHEDULE_JSONP_SCRIPT_ID);
    if (pending) pending.remove();
    console.error("Schedule API error:", "timeout");
    useFallbackSchedule(true);
  }, SCHEDULE_TIMEOUT_MS);

  const script = document.createElement("script");
  script.id = SCHEDULE_JSONP_SCRIPT_ID;
  script.async = true;
  script.charset = "UTF-8";
  script.src = requestUrl;
  script.onerror = function (error) {
    console.error("Schedule API error:", error);
  };
  document.head.appendChild(script);
}

/* ---------- 填入歡迎字句 ---------- */
function renderWelcome() {
  $("#welcome-text").textContent = data.church.welcome;
}

/* ---------- 填入「下一次崇拜」資訊卡 ---------- */
function renderNextService() {
  const service = data.nextService;
  if (!service) {
    $("#next-service-card").innerHTML = `
      <div class="service-card-banner">
        <p>主日崇拜</p>
        <h3>暫未有下一次崇拜資料</h3>
      </div>
    `;
    return;
  }

  const scriptureLine = scheduleFromApi
    ? `<p>經文 ${escapeHtml(service.scripture || "待定")}</p>`
    : "";

  $("#next-service-card").innerHTML = `
    <div class="service-card-banner">
      <p>主日崇拜 · ${escapeHtml(service.time)}</p>
      <h3>${escapeHtml(service.theme)}</h3>
      ${scriptureLine}
    </div>
    <div class="service-meta">
      <div class="meta-item"><span>日期</span><strong>${escapeHtml(service.date)}</strong></div>
      <div class="meta-item"><span>講道</span><strong>${escapeHtml(service.theme)}</strong></div>
      <div class="meta-item"><span>MC</span><strong>${escapeHtml(service.mc)}</strong></div>
      <div class="meta-item"><span>敬拜主領</span><strong>${escapeHtml(service.worshipLeader)}</strong></div>
      <div class="meta-item"><span>結他</span><strong>${escapeHtml(service.guitar)}</strong></div>
      <div class="meta-item"><span>IT</span><strong>${escapeHtml(service.it)}</strong></div>
      <div class="meta-item"><span>聖餐牧師</span><strong>${escapeHtml(service.communionPastor)}</strong></div>
      <div class="meta-item"><span>聖餐安排</span><strong>${escapeHtml(service.communionArrangement)}</strong></div>
    </div>
  `;
}

/* ---------- 常用功能按鈕 ---------- */
function renderActions() {
  const actions = [
    {
      href: data.links.roster,
      title: "查看更表",
      desc: "本月崗位一覽",
      icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 3h2v2h6V3h2v2h3v16H4V5h3V3zm12 6H5v10h14V9zM7 11h4v3H7v-3z"/></svg>'
    },
    {
      href: data.links.changeRequest,
      title: "申請改更",
      desc: "調更或請假",
      icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M14 3l7 7-9.5 9.5H4.5v-7L14 3zm0 2.8L6.5 13.3V17.5h4.2L18.2 9.9 14 5.8z"/></svg>'
    },
    {
      href: data.links.songDraft,
      title: "提交歌單初稿",
      desc: "主領交歌單",
      icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M18 3v10.55A4 4 0 1 1 16 10V7h-6v8.55A4 4 0 1 1 8 12V3h10z"/></svg>'
    },
    {
      href: data.links.housework,
      title: "提交家事",
      desc: "代禱與通告",
      icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h12v18H6V3zm2 2v14h8V5H8zm1 2h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z"/></svg>'
    },
    {
      href: data.links.ppt,
      title: "開啟崇拜 PPT",
      desc: "投影片定稿",
      icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 4h16v12H4V4zm2 2v8h12V6H6zm6 13l4 3H8l4-3z"/></svg>'
    }
  ];

  $("#action-buttons").innerHTML = actions
    .map(
      (item) => `
        <a class="action-btn" href="${item.href}">
          ${item.icon}
          <strong>${item.title}</strong>
          <span>${item.desc}</span>
        </a>
      `
    )
    .join("");
}

/* ---------- 本月更表表格 ---------- */
function renderRoster() {
  $("#roster-month-label").textContent = `${data.rosterMonth} · 共 ${data.roster.length} 個主日`;

  $("#roster-body").innerHTML = data.roster
    .map((row) => {
      const isNext = Boolean(
        data.nextService &&
          row.isoDate &&
          data.nextService.isoDate &&
          row.isoDate === data.nextService.isoDate
      );
      return `
        <tr class="${isNext ? "is-next" : ""}">
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.theme)}</td>
          <td>${escapeHtml(row.mc)}</td>
          <td>${escapeHtml(row.worshipLeader)}</td>
          <td>${escapeHtml(row.guitar)}</td>
          <td>${escapeHtml(row.it)}</td>
          <td>${escapeHtml(row.communionPastor)}</td>
          <td>${escapeHtml(row.communionArrangement)}</td>
        </tr>
      `;
    })
    .join("");
}

/* ---------- 近日待辦事項 ---------- */
function renderTodos() {
  $("#todo-list").innerHTML = data.todos
    .map((item) => {
      const doneClass = item.status === "已完成" ? "is-done" : "";
      return `
        <li class="todo-item">
          <div>
            <h3>${item.title}</h3>
            <p>${item.due}<br />${item.note}</p>
          </div>
          <span class="status ${doneClass}">${item.status}</span>
        </li>
      `;
    })
    .join("");
}

/* ---------- 手機選單開合 ---------- */
function setupMobileMenu() {
  const toggle = $(".menu-toggle");
  const nav = $("#site-nav");

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "關閉選單" : "開啟選單");
  });

  // 點選任一導覽連結後自動收起手機選單
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "開啟選單");
    });
  });
}

/* ---------- 依目前捲動位置，標示導覽列的作用中項目 ---------- */
function setupActiveNav() {
  const links = document.querySelectorAll(".site-nav a");
  const sections = [...links]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function update() {
    const fromTop = window.scrollY + 120;
    let currentId = "home";

    sections.forEach((section) => {
      if (section.offsetTop <= fromTop) {
        currentId = section.id;
      }
    });

    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("is-active", isActive);
    });
  }

  window.addEventListener("scroll", update);
  update();
}

/* ---------- 把說明區塊裡的提交按鈕，接到同一個 data.links ---------- */
function setupFormButtons() {
  $("#song-draft-button").href = data.links.songDraft;
  $("#housework-button").href = data.links.housework;
}

/* ---------- 網頁載入完成後，依序把各區塊畫出來 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderWelcome();
  renderNextService();
  renderActions();
  renderRoster();
  renderTodos();
  setupFormButtons();
  setupMobileMenu();
  setupActiveNav();
  setScheduleSyncStatus("資料來源：網站暫存資料");
  loadScheduleFromApi();
});
