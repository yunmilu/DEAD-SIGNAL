const SAVE_KEY = "dead_signal_save_v1";

const AudioSys = (() => {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  function beep(freq, dur, type = "sine", gainVal = 0.04) {
    ensure();
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gainVal, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function sfx(name) {
    if (name === "click") beep(640, 0.06, "square", 0.025);
    else if (name === "collect") {
      beep(523.25, 0.1, "sine", 0.045);
      setTimeout(() => beep(783.99, 0.18, "sine", 0.045), 80);
    } else if (name === "wrong") {
      beep(175, 0.24, "sawtooth", 0.04);
    } else if (name === "success") {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => beep(f, 0.25, "triangle", 0.045), i * 85);
      });
    }
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  return {
    sfx,
    toggleMute,
    get muted() {
      return muted;
    }
  };
})();

const PROLOGUE_LINES = [
  { who: "시스템", text: "해담시 경찰청 강력반 · 03:17 AM", type: "sys" },
  { who: "신고자", text: "폐모텔 2층 라이브 방송 중인데... 바닥에 사람이 누워 있어요.", type: "chat" },
  { who: "한태린", text: "(자리에서 일어나며) 폐모텔... 오빠가 오늘 밤 그쪽을 수사하러 갔는데.", type: "tarin" },
  { who: "시스템", text: "현장 도착. 신원 확인 — 한태건 경감.", type: "sys" },
  { who: "한태린", text: "6개월간 6명. 물가에서 발견된 탈수 사망 사건... 오빠가 남긴 흔적부터 찾자.", type: "tarin" }
];

const LOCATIONS = [
  {
    id: "dock",
    name: "해담만 부두",
    icon: "⚓",
    x: 24,
    y: 66,
    unlocked: true,
    desc: "차가운 바닷바람이 부는 부두. 물가 근처에서 이상 탈수 피해자들이 잇따라 발견되었다."
  },
  {
    id: "motel",
    name: "외곽 폐모텔",
    icon: "🏚️",
    x: 54,
    y: 34,
    unlocked: false,
    desc: "한태건 경감이 마지막으로 향했던 폐모텔 2층. 라이브 스트림 신호가 끊긴 곳이다."
  },
  {
    id: "lab",
    name: "시립 분석실",
    icon: "🔬",
    x: 78,
    y: 56,
    unlocked: false,
    desc: "부검 소견과 미확인 약물 성분을 대조하는 곳."
  }
];

const CLUES = [
  { id: "c1", loc: "dock", icon: "💧", title: "물가 앞 탈수 시신", desc: "수분이 충분한 물가 바로 옆에서 극심한 탈수로 숨진 흔적." },
  { id: "c2", loc: "dock", icon: "💊", title: "미확인 신경계 약물", desc: "혈액에서 검출된 변형 약물. 극심한 갈증과 물에 대한 공포를 유발한다." },
  { id: "c3", loc: "motel", icon: "📹", title: "라이브 캠 기록", desc: "03:15 AM 직전, 한태건 경감이 누군가와 대치하며 남긴 음성 파형." },
  { id: "c4", loc: "motel", icon: "🪪", title: "위조 출입증 조각", desc: "해담시 항만 물류 구역과 폐모텔을 오간 흔적이 남은 출입증." },
  { id: "c5", loc: "lab", icon: "🧪", title: "약물-물공포증 상관관계", desc: "약물 투여 후 물을 보면 공포 반응을 일으켜 섭취를 거부하게 됨." },
  { id: "c6", loc: "lab", icon: "📡", title: "중계 신호 로그", desc: "폐모텔 방송 신호가 항만 창고 서버를 거쳐 외부로 전송된 기록." }
];

const COMBINATIONS = [
  { a: "c1", b: "c5", id: "con1", icon: "🧠", title: "결론: 의도된 갈증과 물공포증", sub: "약물로 물 섭취를 막아 탈수사로 위장한 수법." },
  { a: "c3", b: "c6", id: "con2", icon: "📡", title: "결론: 외부 중계 및 은폐 조직", sub: "단순 사고가 아닌 조직적인 신호 조작과 증거 인멸." }
];

const SUSPECTS = [
  {
    id: "s1",
    name: "유튜버 '어반캠'",
    role: "최초 신고자",
    icon: "🎥",
    base: "저는 폐가 찍으려다 우연히 발견했을 뿐이에요. 진짜 아무것도 모릅니다!",
    clues: {
      c3: "어... 방송 끊기기 직전에 한 분이 '서버는 항만에 있다'고 말하긴 했어요.",
      c6: "제 영상이 부두 쪽 서버를 거쳤다고요? 저는 중계 설정 건드린 적 없어요!"
    }
  },
  {
    id: "s2",
    name: "박진우 과장",
    role: "항만 물류 관리책",
    icon: "🧥",
    base: "한태건 경감님이 왜 폐모텔에 갔는지는 나도 모릅니다. 내 구역은 부두뿐이에요.",
    clues: {
      c4: "그 출입증... 분실 신고가 늦긴 했죠. 하지만 그걸로 사람을 해치진 않았어요.",
      c2: "약물 얘기는 꺼내지도 마세요. 그 약을 누가 유통했는지 알면 다들 위험해집니다."
    }
  }
];

const QUIZZES = [
  {
    q: "1. 물가에서 발견된 피해자들이 극심한 탈수로 숨진 핵심 원인은 무엇인가?",
    opts: ["바닷물 염분 중독", "약물로 인한 갈증과 물공포증", "단순 등산 조난"],
    ans: 1,
    fb: "정답입니다. 변형 약물이 갈증과 물공포증을 유발해 물가에서도 물을 마시지 못하게 만들었습니다."
  },
  {
    q: "2. 폐모텔 라이브 신호가 향한 실제 배후 연결고리는 어디와 이어져 있는가?",
    opts: ["해담만 부두 물류 서버", "시립 도서관", "외곽 고속도로 휴게소"],
    ans: 0,
    fb: "정답입니다. 중계 로그와 출입증 기록이 해담만 부두 측을 가리키고 있습니다."
  },
  {
    q: "3. 한태린 경장이 사건의 진실에 도달하기 위해 반드시 밝혀낸 것은?",
    opts: ["단순 실종 처리", "약물 유통과 신호 조작의 공모", "목격자 증언 철회"],
    ans: 1,
    fb: "정답입니다. 탈수사 위장 약물과 신호 은폐가 하나의 사건으로 맞물려 있습니다."
  }
];

const DOSSIERS = [
  { icon: "🕵️‍♀️", name: "한태린", tag: "강력반 형사 · 주인공", info: "사망한 한태건 경감의 동생. 집요하게 사건의 단서를 추적한다." },
  { icon: "🎥", name: "어반캠", tag: "폐가 탐험 유튜버", info: "03:17 AM 최초 신고자. 라이브 방송 중 이상 상황을 목격했다." },
  { icon: "🧥", name: "박진우", tag: "항만 물류 관리책", info: "부두 출입 기록과 약물 유통 경로에 연결된 인물." }
];

const state = {
  screen: "title",
  storyIndex: 0,
  currentLoc: "dock",
  foundClues: [],
  unlockedLocs: ["dock"],
  boardMode: "link",
  selectedCards: [],
  links: [],
  conclusions: [],
  activeSuspect: "s1",
  interrogateLog: [],
  quizIndex: 0,
  quizSolved: 0
};

const $ = (sel) => document.querySelector(sel);

function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const target = $("#screen-" + id);
  if (target) target.classList.add("active");
  state.screen = id;
  if (id === "map") renderMap();
  if (id === "location") renderLocation(state.currentLoc);
  if (id === "board") renderBoard();
  if (id === "interrogate") renderInterrogate();
  if (id === "quiz") renderQuiz();
  if (id === "ending") renderEnding();
}

function saveGame(silent = false) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (!silent) showToast("진행 상황을 저장했습니다.");
  } catch (e) {
    if (!silent) showToast("저장에 실패했습니다.");
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    return true;
  } catch (e) {
    return false;
  }
}

function resetState() {
  state.storyIndex = 0;
  state.currentLoc = "dock";
  state.foundClues = [];
  state.unlockedLocs = ["dock"];
  state.boardMode = "link";
  state.selectedCards = [];
  state.links = [];
  state.conclusions = [];
  state.activeSuspect = "s1";
  state.interrogateLog = [];
  state.quizIndex = 0;
  state.quizSolved = 0;
}

function renderStory() {
  const total = PROLOGUE_LINES.length;
  if (state.storyIndex >= total) {
    showScreen("map");
    return;
  }
  const line = PROLOGUE_LINES[state.storyIndex];
  $("#story-chapter").textContent = "PROLOGUE · 03:17 AM";
  $("#story-step").textContent = `${state.storyIndex + 1} / ${total}`;
  const box = $("#story-text");
  const div = document.createElement("div");
  div.className = `story-line ${line.type || ""}`;
  div.innerHTML = `<span class="who">${line.who}</span><span class="text">${line.text}</span>`;
  box.innerHTML = "";
  box.appendChild(div);
}

function updateSignalMeter() {
  const pct = Math.min(100, Math.round((state.foundClues.length / CLUES.length) * 100));
  $("#signal-fill").style.width = pct + "%";
  $("#signal-pct").textContent = pct + "%";
  $("#map-progress").textContent = `단서 ${state.foundClues.length} / ${CLUES.length}`;
}

function checkUnlockLocations() {
  const dockClues = CLUES.filter((c) => c.loc === "dock").map((c) => c.id);
  const motelClues = CLUES.filter((c) => c.loc === "motel").map((c) => c.id);
  if (dockClues.every((id) => state.foundClues.includes(id)) && !state.unlockedLocs.includes("motel")) {
    state.unlockedLocs.push("motel");
    showToast("새 조사 구역 [외곽 폐모텔]이 열렸습니다.");
  }
  if (motelClues.every((id) => state.foundClues.includes(id)) && !state.unlockedLocs.includes("lab")) {
    state.unlockedLocs.push("lab");
    showToast("새 조사 구역 [시립 분석실]이 열렸습니다.");
  }
}

function renderMap() {
  updateSignalMeter();
  const wrap = $("#map-locations");
  wrap.innerHTML = "";
  LOCATIONS.forEach((loc) => {
    const unlocked = state.unlockedLocs.includes(loc.id);
    const locClues = CLUES.filter((c) => c.loc === loc.id);
    const foundCount = locClues.filter((c) => state.foundClues.includes(c.id)).length;
    const done = foundCount === locClues.length;

    const pin = document.createElement("div");
    pin.className = `loc-pin ${unlocked ? "" : "locked"} ${done ? "done" : ""}`;
    pin.style.left = loc.x + "%";
    pin.style.top = loc.y + "%";
    pin.innerHTML = `
      <div class="icon">${loc.icon}</div>
      <div class="badge">${unlocked ? `${foundCount}/${locClues.length}` : "🔒"}</div>
      <div class="label">${loc.name}</div>
    `;
    pin.addEventListener("click", () => {
      AudioSys.sfx("click");
      if (!unlocked) {
        showToast("이전 구역의 단서를 먼저 모두 수집하세요.");
        return;
      }
      state.currentLoc = loc.id;
      showScreen("location");
    });
    wrap.appendChild(pin);
  });

  const body = $("#case-file-body");
  if (state.foundClues.length === 0) {
    body.innerHTML = "<p>열린 장소를 선택해 단서를 수집하세요.</p>";
  } else {
    body.innerHTML = state.foundClues
      .map((id) => {
        const c = CLUES.find((x) => x.id === id);
        return `<div>• <b>${c.title}</b></div>`;
      })
      .join("");
  }
}

function renderLocation(locId) {
  const loc = LOCATIONS.find((l) => l.id === locId) || LOCATIONS[0];
  const items = CLUES.filter((c) => c.loc === loc.id);
  const foundHere = items.filter((c) => state.foundClues.includes(c.id)).length;

  $("#loc-name").textContent = loc.name;
  $("#loc-count").textContent = `${foundHere} / ${items.length}`;
  $("#loc-desc").textContent = loc.desc;

  const list = $("#clue-list");
  list.innerHTML = "";
  items.forEach((c) => {
    const isFound = state.foundClues.includes(c.id);
    const card = document.createElement("div");
    card.className = `clue-card ${isFound ? "found" : ""}`;
    card.innerHTML = `
      <div class="clue-icon">${c.icon}</div>
      <div class="clue-title">${c.title}</div>
      <div class="clue-desc">${c.desc}</div>
      <div class="clue-status">${isFound ? "✓ 수집 완료" : "클릭하여 단서 수집"}</div>
    `;
    if (!isFound) {
      card.addEventListener("click", () => {
        state.foundClues.push(c.id);
        AudioSys.sfx("collect");
        showToast(`단서 획득: ${c.title}`);
        checkUnlockLocations();
        updateSignalMeter();
        renderLocation(loc.id);
      });
    }
    list.appendChild(card);
  });
}

function renderBoard() {
  const availableClues = CLUES.filter((c) => state.foundClues.includes(c.id));
  const availableCons = COMBINATIONS.filter((x) => state.conclusions.includes(x.id));

  $("#board-count").textContent = `단서 ${availableClues.length} · 결론 ${availableCons.length}`;
  $("#btn-mode-link").classList.toggle("active", state.boardMode === "link");
  $("#btn-mode-combine").classList.toggle("active", state.boardMode === "combine");
  $("#board-status").textContent =
    state.boardMode === "link"
      ? "카드 두 개를 선택해 연결하세요."
      : "조합할 단서 카드 두 개를 선택하세요.";

  const grid = $("#board-cards");
  grid.innerHTML = "";

  const allCards = [
    ...availableClues.map((c) => ({ id: c.id, icon: c.icon, title: c.title, sub: c.desc, isCon: false })),
    ...availableCons.map((x) => ({ id: x.id, icon: x.icon, title: x.title, sub: x.sub, isCon: true }))
  ];

  if (allCards.length === 0) {
    grid.innerHTML = "<p style='color:var(--dim);font-size:14px'>아직 수집한 단서가 없습니다. 지도에서 장소를 조사해 보세요.</p>";
  }

  allCards.forEach((cardData) => {
    const selected = state.selectedCards.includes(cardData.id);
    const el = document.createElement("div");
    el.className = `board-card ${selected ? "selected" : ""} ${cardData.isCon ? "conclusion" : ""}`;
    el.innerHTML = `
      <div class="bc-icon">${cardData.icon}</div>
      <div class="bc-title">${cardData.title}</div>
      <div class="bc-sub">${cardData.sub}</div>
    `;
    el.addEventListener("click", () => {
      AudioSys.sfx("click");
      if (state.selectedCards.includes(cardData.id)) {
        state.selectedCards = state.selectedCards.filter((x) => x !== cardData.id);
      } else {
        state.selectedCards.push(cardData.id);
        if (state.selectedCards.length > 2) state.selectedCards.shift();
      }
      renderBoard();
    });
    grid.appendChild(el);
  });

  const combineBtn = $("#btn-combine");
  if (state.boardMode === "combine" && state.selectedCards.length === 2) {
    combineBtn.style.display = "inline-block";
  } else {
    combineBtn.style.display = "none";
  }

  if (state.boardMode === "link" && state.selectedCards.length === 2) {
    const [a, b] = state.selectedCards;
    const pair = [a, b].sort().join("--");
    if (!state.links.includes(pair)) {
      state.links.push(pair);
      AudioSys.sfx("collect");
      showToast("두 단서를 연결했습니다.");
    }
    state.selectedCards = [];
    renderBoard();
    return;
  }

  $("#links-summary").textContent = `연결된 단서: ${state.links.length}건`;
}

function doCombine() {
  if (state.selectedCards.length !== 2) return;
  const [x, y] = state.selectedCards;
  const match = COMBINATIONS.find(
    (c) => (c.a === x && c.b === y) || (c.a === y && c.b === x)
  );
  if (!match) {
    AudioSys.sfx("wrong");
    $("#combine-result").textContent = "이 두 단서로는 새로운 결론이 도출되지 않습니다.";
    showToast("다른 단서 조합을 시도해 보세요.");
    return;
  }
  if (!state.conclusions.includes(match.id)) {
    state.conclusions.push(match.id);
    AudioSys.sfx("success");
    showToast(`새 결론 도출: ${match.title}`);
  }
  $("#combine-result").textContent = `${match.title} — ${match.sub}`;
  state.selectedCards = [];
  renderBoard();
}

function renderInterrogate() {
  const list = $("#suspect-list");
  list.innerHTML = "";
  SUSPECTS.forEach((s) => {
    const item = document.createElement("div");
    item.className = `suspect ${state.activeSuspect === s.id ? "active" : ""}`;
    item.innerHTML = `
      <div class="sicon">${s.icon}</div>
      <div>
        <div class="sname">${s.name}</div>
        <div class="srole">${s.role}</div>
      </div>
    `;
    item.addEventListener("click", () => {
      AudioSys.sfx("click");
      state.activeSuspect = s.id;
      renderInterrogate();
    });
    list.appendChild(item);
  });

  const sus = SUSPECTS.find((s) => s.id === state.activeSuspect) || SUSPECTS[0];
  $("#interrogate-dialog").innerHTML = `
    <div class="dialog-name">${sus.name} · ${sus.role}</div>
    <div class="dialog-text">"${sus.base}"</div>
  `;

  const evBox = $("#present-evidence");
  evBox.innerHTML = "";
  if (state.foundClues.length === 0) {
    evBox.innerHTML = "<span>제시할 단서가 없습니다. 현장을 조사하세요.</span>";
  } else {
    state.foundClues.forEach((cid) => {
      const c = CLUES.find((x) => x.id === cid);
      const chip = document.createElement("button");
      chip.className = "ev-chip";
      chip.textContent = `${c.icon} ${c.title}`;
      chip.addEventListener("click", () => {
        const reply = sus.clues[cid] || "그 단서에 대해서는 아는 바가 없습니다.";
        AudioSys.sfx("click");
        $("#interrogate-dialog").innerHTML = `
          <div class="dialog-name">${sus.name} (증거 제시 반응)</div>
          <div class="dialog-text">"${reply}"</div>
        `;
        state.interrogateLog.unshift(`<b>[${sus.name}]</b> 증거 [${c.title}] 제시 → "${reply}"`);
        renderLog();
      });
      evBox.appendChild(chip);
    });
  }
  renderLog();
}

function renderLog() {
  $("#interrogate-log").innerHTML = state.interrogateLog
    .map((line) => `<div class="log-line">${line}</div>`)
    .join("");
}

function renderQuiz() {
  const q = QUIZZES[state.quizIndex];
  $("#quiz-progress").textContent = `${state.quizIndex + 1} / ${QUIZZES.length}`;
  const area = $("#quiz-area");
  if (!q) {
    showScreen("ending");
    return;
  }

  area.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-q">${q.q}</div>
      <div class="quiz-options">
        ${q.opts.map((opt, idx) => `<button class="quiz-opt" data-opt="${idx}">${opt}</button>`).join("")}
      </div>
      <div id="quiz-fb" class="quiz-fb"></div>
    </div>
  `;

  area.querySelectorAll(".quiz-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.opt);
      const fb = $("#quiz-fb");
      area.querySelectorAll(".quiz-opt").forEach((b) => (b.disabled = true));
      if (idx === q.ans) {
        btn.classList.add("correct");
        fb.className = "quiz-fb ok";
        fb.textContent = q.fb;
        state.quizSolved += 1;
        AudioSys.sfx("success");
      } else {
        btn.classList.add("wrong");
        fb.className = "quiz-fb no";
        fb.textContent = "추리가 맞지 않습니다. 단서와 증거 보드를 다시 떠올려 보세요.";
        AudioSys.sfx("wrong");
      }
      setTimeout(() => {
        state.quizIndex += 1;
        renderQuiz();
      }, 1350);
    });
  });
}

function renderEnding() {
  $("#ending-text").innerHTML = `
    <p>해담시 물가 연쇄 탈수 사망 사건과 한태건 경감의 죽음은 변형 약물로 인한 갈증·물공포증 유도, 그리고 해담만 부두 물류 서버를 통한 신호 조작과 연결되어 있었습니다.</p>
    <p>수집한 단서 ${state.foundClues.length}개, 도출한 결론 ${state.conclusions.length}개, 최종 추리 정답 ${state.quizSolved}/${QUIZZES.length}건을 바탕으로 사건의 실체가 드러났습니다.</p>
    <p>끊겼던 신호는 끝내 진실을 향해 이어졌습니다.</p>
  `;
}

function openDossier() {
  $("#dossier-content").innerHTML = DOSSIERS.map(
    (d) => `
      <div class="dossier">
        <div class="dossier-head">
          <span style="font-size:24px">${d.icon}</span>
          <b>${d.name}</b>
          <span style="margin-left:auto;font-size:12px;color:var(--gold)">${d.tag}</span>
        </div>
        <div class="dossier-row">${d.info}</div>
      </div>
    `
  ).join("");
  $("#modal-dossier").classList.add("open");
}

document.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) {
    if (state.screen === "story" && !e.target.closest(".story-foot")) {
      state.storyIndex += 1;
      renderStory();
    }
    return;
  }

  const action = actionEl.dataset.action;
  AudioSys.sfx("click");

  switch (action) {
    case "new-game":
      resetState();
      showScreen("story");
      renderStory();
      break;
    case "continue":
      if (loadGame()) {
        showScreen(state.screen === "title" ? "map" : state.screen);
        showToast("저장된 수사를 불러왔습니다.");
      } else {
        showToast("저장된 진행 데이터가 없습니다.");
      }
      break;
    case "howto":
      $("#modal-howto").classList.add("open");
      break;
    case "close-howto":
      $("#modal-howto").classList.remove("open");
      break;
    case "story-next":
      state.storyIndex += 1;
      renderStory();
      break;
    case "go-map":
      showScreen("map");
      break;
    case "go-board":
      state.selectedCards = [];
      $("#combine-result").textContent = "";
      showScreen("board");
      break;
    case "go-interrogate":
      showScreen("interrogate");
      break;
    case "go-quiz":
      state.quizIndex = 0;
      state.quizSolved = 0;
      showScreen("quiz");
      break;
    case "open-dossier":
      openDossier();
      break;
    case "close-dossier":
      $("#modal-dossier").classList.remove("open");
      break;
    case "to-title":
      showScreen("title");
      break;
    case "mode-link":
      state.boardMode = "link";
      state.selectedCards = [];
      renderBoard();
      break;
    case "mode-combine":
      state.boardMode = "combine";
      state.selectedCards = [];
      renderBoard();
      break;
    case "do-combine":
      doCombine();
      break;
    case "open-exit":
      $("#modal-exit").classList.add("open");
      break;
    case "exit-cancel":
      $("#modal-exit").classList.remove("open");
      break;
    case "exit-save":
      saveGame(true);
      $("#modal-exit").classList.remove("open");
      $("#exit-msg").textContent = "진행 상황을 저장하고 수사를 종료했습니다.";
      showScreen("exit");
      break;
    case "exit-nosave":
      $("#modal-exit").classList.remove("open");
      $("#exit-msg").textContent = "저장하지 않고 수사를 종료했습니다.";
      showScreen("exit");
      break;
    case "exit-to-title":
      showScreen("title");
      break;
    case "close-window":
      window.close();
      showToast("브라우저 탭을 직접 닫아주세요.");
      break;
  }
});

$("#sound-toggle").addEventListener("click", (e) => {
  e.stopPropagation();
  const muted = AudioSys.toggleMute();
  e.currentTarget.textContent = muted ? "🔇" : "🔊";
  showToast(muted ? "사운드를 껐습니다." : "사운드를 켰습니다.");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && state.screen === "story") {
    state.storyIndex += 1;
    renderStory();
  }
});

updateSignalMeter();
