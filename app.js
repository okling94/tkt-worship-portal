/*
  app.js
  用途：存放網站資料，並把資料填進 index.html 的空位。
  第一版沒有真實登入、沒有資料庫、也沒有連接 Google API。
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
    date: "2026年9月20日（日）",
    time: "上午 11:00",
    theme: "在主裡重新得力",
    mc: "陳曉晴",
    worshipLeader: "林子軒",
    guitar: "黃志偉",
    it: "張恩祈",
    communionPastor: "李牧師",
    communionArrangement: "蔡恩慈"
  },

  // 本月崇拜更表（表格會依陣列順序顯示）
  rosterMonth: "2026年9月",
  roster: [
    {
      date: "9月6日",
      theme: "恩典夠用",
      mc: "王嘉琳",
      worshipLeader: "周信",
      guitar: "吳浩然",
      it: "鄭一諾",
      communionPastor: "—",
      communionArrangement: "—"
    },
    {
      date: "9月13日",
      theme: "行走在光中",
      mc: "何詠思",
      worshipLeader: "陳曉晴",
      guitar: "黃志偉",
      it: "張恩祈",
      communionPastor: "—",
      communionArrangement: "—"
    },
    {
      date: "9月20日",
      theme: "在主裡重新得力",
      mc: "陳曉晴",
      worshipLeader: "林子軒",
      guitar: "黃志偉",
      it: "張恩祈",
      communionPastor: "李牧師",
      communionArrangement: "蔡恩慈"
    },
    {
      date: "9月27日",
      theme: "彼此相愛",
      mc: "劉子晴",
      worshipLeader: "周信",
      guitar: "吳浩然",
      it: "鄭一諾",
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

/* ---------- 填入歡迎字句 ---------- */
function renderWelcome() {
  $("#welcome-text").textContent = data.church.welcome;
}

/* ---------- 填入「下一次崇拜」資訊卡 ---------- */
function renderNextService() {
  const service = data.nextService;

  $("#next-service-card").innerHTML = `
    <div class="service-card-banner">
      <p>主日崇拜 · ${service.time}</p>
      <h3>${service.theme}</h3>
    </div>
    <div class="service-meta">
      <div class="meta-item"><span>日期</span><strong>${service.date}</strong></div>
      <div class="meta-item"><span>講題</span><strong>${service.theme}</strong></div>
      <div class="meta-item"><span>MC</span><strong>${service.mc}</strong></div>
      <div class="meta-item"><span>敬拜主領</span><strong>${service.worshipLeader}</strong></div>
      <div class="meta-item"><span>結他</span><strong>${service.guitar}</strong></div>
      <div class="meta-item"><span>IT</span><strong>${service.it}</strong></div>
      <div class="meta-item"><span>聖餐牧師</span><strong>${service.communionPastor}</strong></div>
      <div class="meta-item"><span>聖餐安排</span><strong>${service.communionArrangement}</strong></div>
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
      const isNext = data.nextService.date.includes(row.date);
      return `
        <tr class="${isNext ? "is-next" : ""}">
          <td>${row.date}</td>
          <td>${row.theme}</td>
          <td>${row.mc}</td>
          <td>${row.worshipLeader}</td>
          <td>${row.guitar}</td>
          <td>${row.it}</td>
          <td>${row.communionPastor}</td>
          <td>${row.communionArrangement}</td>
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
});
