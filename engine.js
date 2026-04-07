/**
 * D&D Quiz Engine
 * Manages state, renders nodes, handles navigation.
 * Data-driven: works with any scenario file that follows the schema in PLAN.md
 */

import { scenario as recruiterScenario } from "./scenarios/recruiter.js";
import { scenario as hrdScenario } from "./scenarios/hrd.js";
import { scenario as ceoScenario } from "./scenarios/ceo.js";
import { scenario as ownerScenario } from "./scenarios/owner.js";
import { scenario as strategistScenario } from "./scenarios/strategist.js";
import { scenario as cfoScenario } from "./scenarios/cfo.js";
import { scenario as cooScenario } from "./scenarios/coo.js";
import { scenario as ccoScenario } from "./scenarios/cco.js";

// ─── Registry ───────────────────────────────────────────────────────────────
const SCENARIOS = {
  recruiter: recruiterScenario,
  hrd: hrdScenario,
  ceo: ceoScenario,
  owner: ownerScenario,
  strategist: strategistScenario,
  cfo: cfoScenario,
  coo: cooScenario,
  cco: ccoScenario,
};

// ─── State ───────────────────────────────────────────────────────────────────
let state = {
  screen: "character_select", // character_select | scene | ending
  characterId: null,
  nodeId: null,
  history: [], // for back-navigation (optional future feature)
};

// ─── Entry point ─────────────────────────────────────────────────────────────
export function init() {
  renderCharacterSelect();
}

// ─── Screens ─────────────────────────────────────────────────────────────────
function renderCharacterSelect() {
  state = { screen: "character_select", characterId: null, nodeId: null, history: [] };

  const characters = Object.values(SCENARIOS).map((s) => s.character);

  setContent(`
    <div class="character-select">
      <div class="quest-header">
        <p class="quest-subtitle">Аналитика Рынка Труда</p>
        <h1 class="quest-title">Выбери своего героя</h1>
        <p class="quest-intro">Каждый путь начинается с выбора. Кто ты в этом мире?</p>
      </div>
      <div class="character-grid">
        ${characters.map((c) => renderCharacterCard(c)).join("")}
      </div>
    </div>
  `);

  // Bind character selection
  document.querySelectorAll(".character-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectCharacter(card.dataset.characterId);
    });
  });
}

function renderCharacterCard(character) {
  return `
    <div class="character-card" data-character-id="${character.id}">
      <div class="character-image-wrap">
        <img
          src="assets/images/${character.image}"
          alt="${character.name}"
          onerror="this.style.display='none'"
        />
        <div class="character-image-placeholder">⚔️</div>
      </div>
      <div class="character-info">
        <h2 class="character-name">${character.name}</h2>
        <p class="character-role">${character.role}</p>
        <p class="character-desc">${character.description}</p>
      </div>
      <button class="btn btn-choose">Выбрать</button>
    </div>
  `;
}

function selectCharacter(characterId) {
  state.characterId = characterId;
  const scenario = SCENARIOS[characterId];
  navigateTo(scenario.startNode);
}

function navigateTo(nodeId) {
  const scenario = SCENARIOS[state.characterId];
  const node = scenario.nodes[nodeId];

  if (!node) {
    console.error(`Node not found: ${nodeId}`);
    return;
  }

  state.nodeId = nodeId;
  state.history.push(nodeId);
  state.screen = node.type;

  if (node.type === "scene") {
    renderScene(node);
  } else if (node.type === "ending") {
    renderEnding(node, scenario.character);
  }
}

function renderScene(node) {
  setContent(`
    <div class="scene">
      ${
        node.image
          ? `<div class="scene-image-wrap">
               <img src="assets/images/${node.image}" alt="" onerror="this.parentElement.style.display='none'" />
             </div>`
          : ""
      }
      <div class="scene-content">
        <p class="scene-chapter">Глава ${state.history.length}</p>
        <h2 class="scene-title">${node.title}</h2>
        <p class="scene-text">${formatText(node.text)}</p>
        <div class="choices">
          ${node.choices.map((c, i) => renderChoice(c, i)).join("")}
        </div>
      </div>
    </div>
  `);

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateTo(btn.dataset.next);
    });
  });
}

function renderChoice(choice, index) {
  return `
    <button class="choice-btn" data-next="${choice.next}" data-index="${index}">
      <span class="choice-text">${choice.text}</span>
      <span class="choice-arrow">→</span>
    </button>
  `;
}

function renderEnding(node, character) {
  const svc = node.service;

  setContent(`
    <div class="ending">
      ${
        node.image
          ? `<div class="ending-image-wrap">
               <img src="assets/images/${node.image}" alt="" onerror="this.parentElement.style.display='none'" />
             </div>`
          : ""
      }
      <div class="ending-content">
        <div class="ending-badge">⚔️ Квест завершён</div>
        <h2 class="ending-title">${node.title}</h2>
        <p class="ending-text">${formatText(node.text)}</p>

        <div class="service-card">
          <div class="service-card-inner">
            <p class="service-label">Твой инструмент</p>
            <h3 class="service-name">${svc.name}</h3>
            <p class="service-desc">${svc.description}</p>
            <p class="service-price">${svc.price}</p>
            <a href="${svc.url}" class="btn btn-cta">${svc.cta}</a>
          </div>
        </div>

        <div class="lead-magnet" id="lead-magnet">
          ${renderLeadMagnet()}
        </div>

        <div class="ending-actions">
          <button class="btn btn-secondary" id="restart-btn">
            ↩ Начать заново
          </button>
        </div>
      </div>
    </div>
  `);

  document.getElementById("restart-btn").addEventListener("click", () => {
    renderCharacterSelect();
  });

  initLeadMagnet();
}

// ─── Lead Magnet ──────────────────────────────────────────────────────────────
function renderLeadMagnet() {
  return `
    <div class="lm-prompt">
      <p class="lm-title">Хочешь знать, что происходит в твоей отрасли прямо сейчас?</p>
      <p class="lm-subtitle">Введи отрасль — получи 3 изменения на рынке труда, которые уже влияют на найм.</p>
      <div class="lm-form">
        <input
          type="text"
          id="lm-industry"
          class="lm-input"
          placeholder="Например: IT, ритейл, производство..."
        />
        <button class="btn btn-lm" id="lm-submit">Узнать →</button>
      </div>
      <div id="lm-result" class="lm-result hidden"></div>
      <div id="lm-contact-form" class="lm-contact-form hidden">
        <p class="lm-contact-title">Получи полный материал</p>
        <input type="email" id="lm-contact" class="lm-input" placeholder="Твой email" />
        <button class="btn btn-lm" id="lm-send">Отправить</button>
        <p class="lm-thanks hidden" id="lm-thanks">✓ Сергей пришлёт материалы в течение дня</p>
      </div>
    </div>
  `;
}

// Synonym map: canonical key → list of strings to match (lowercase, partial)
const INDUSTRY_SYNONYMS = {
  it:            ["it", "айти", "разработка", "tech", "технологии", "software", "программирование", "цифровой"],
  ритейл:        ["ритейл", "retail", "розница", "торговля", "fmcg", "фмсг", "магазин", "сеть магазинов"],
  производство:  ["производство", "промышленность", "завод", "фабрика", "manufacturing", "индустрия", "металлург"],
  строительство: ["строительство", "стройка", "девелопмент", "девелопер", "застройщик", "нострой"],
  медицина:      ["медицина", "фарма", "healthcare", "клиника", "больница", "здравоохранение", "фармацевтика"],
  кадровый:      ["кадровое агентство", "рекрутинг", "аутстаффинг", "аутсорсинг", "кадровый бизнес", "подбор персонала", "hr-агентство"],
  государство:   ["государство", "госструктура", "госслужба", "госкомпания", "муниципалитет", "министерство", "федеральный", "бюджетная организация", "фгуп", "гуп", "администрация"],
};

function findIndustryKey(input) {
  const lower = input.toLowerCase();
  for (const [key, synonyms] of Object.entries(INDUSTRY_SYNONYMS)) {
    if (synonyms.some((s) => lower.includes(s))) return key;
  }
  return "default";
}

const INDUSTRY_TRENDS = {
  default: [
    "Дефицит линейного персонала достиг пика: компании конкурируют за кандидатов с 2–3 месяцами опыта",
    "Сроки закрытия вакансий выросли на 40–60% по сравнению с 2022 годом — рынок не вернётся к прежним темпам",
    "Кандидаты сравнивают несколько офферов одновременно: скорость принятия решения стала конкурентным преимуществом",
  ],
  it: [
    "Рынок IT-найма сместился: Junior и Middle позиции закрываются сложнее, чем Senior — из-за волны претендентов без реального опыта",
    "Удалёнка как стандарт исчезает: возврат к гибридному формату сужает кандидатскую базу для региональных компаний",
    "Зарплатные ожидания Senior-разработчиков выросли на 25–35% — преимущественно из-за международного спроса и релокации",
  ],
  ритейл: [
    "Текучесть линейного персонала в ритейле — 100–200% годовых: адаптация и удержание важнее найма",
    "Каждый новый магазин или склад — отдельный рынок труда: без карты регионов компании открываются вслепую",
    "Зависимость складов и логистики от мигрантов делает миграционные законы прямым риском для операционных затрат",
  ],
  производство: [
    "Демографическая яма плюс отток в города: физический дефицит рабочих специальностей достигает 30–40% по ряду направлений",
    "Рост ФОТ опережает рост производительности — CFO видит цифры, но не понимает, это рынок движется или компания переплачивает",
    "Зависимость от иностранной рабочей силы делает каждое изменение миграционного законодательства прямым ударом по себестоимости",
  ],
  строительство: [
    "40–70% рабочей силы на крупных площадках — иностранные граждане: каждое изменение миграционного законодательства меняет себестоимость проекта",
    "Компании узнают о законодательных рисках за 6 недель, а не за 6–12 месяцев — времени на перестройку не остаётся",
    "Сезонность и проектная структура делают долгосрочное кадровое планирование невозможным без внешней аналитики",
  ],
  медицина: [
    "Дефицит узких специалистов — структурный, не циклический: его нельзя закрыть просто увеличив бюджет на подбор",
    "Зарплатная гонка между частными и государственными клиниками: выигрывает тот, кто быстрее делает оффер, а не тот, кто платит больше",
    "Москва и Санкт-Петербург пылесосят кадры из регионов — региональные сети теряют специалистов не к конкурентам, а к столичному рынку",
  ],
  кадровый: [
    "Законодательные риски (переквалификация занятости, миграционные ужесточения) способны изменить бизнес-модель за полгода",
    "Ценовой демпинг давит на маржу: без собственной аналитики сложно обосновать стоимость услуг перед крупным заказчиком",
    "Компании, перешедшие на решения на основе данных, выигрывают тендеры и удерживают клиентов — те, кто работает на опыте, проигрывают",
  ],
  государство: [
    "Конкуренция с частным сектором при фиксированном бюджетном ФОТ: госструктуры теряют специалистов не к другим ведомствам, а к рынку",
    "Цифровая трансформация создала новый дефицит — IT и аналитические компетенции, которые бюджет не удерживает",
    "Старение кадрового состава: молодые специалисты не рассматривают госслужбу как приоритет — разрыв поколений нарастает",
  ],
};

function initLeadMagnet() {
  document.getElementById("lm-submit").addEventListener("click", () => {
    const industry = document.getElementById("lm-industry").value.trim();
    const key = findIndustryKey(industry);
    const trends = INDUSTRY_TRENDS[key];

    const resultEl = document.getElementById("lm-result");
    resultEl.innerHTML = `
      <p class="lm-result-title">3 изменения на рынке труда${industry ? ` в сфере "${industry}"` : ""} прямо сейчас:</p>
      <ol class="lm-trend-list">
        ${trends.map((t) => `<li>${t}</li>`).join("")}
      </ol>
    `;
    resultEl.classList.remove("hidden");
    document.getElementById("lm-contact-form").classList.remove("hidden");
  });

  document.getElementById("lm-send").addEventListener("click", async () => {
    const contact = document.getElementById("lm-contact").value.trim();
    if (!contact) return;
    const industry = document.getElementById("lm-industry").value.trim();
    const btn = document.getElementById("lm-send");
    btn.disabled = true;
    btn.textContent = "Отправляем...";
    try {
      await fetch("https://formspree.io/f/xpqobvlq", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: contact, industry, character: state.characterId }),
      });
    } catch (_) {
      // silent fail — lead still shown as sent to user
    }
    btn.style.display = "none";
    document.getElementById("lm-thanks").classList.remove("hidden");
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setContent(html) {
  document.getElementById("app").innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatText(text) {
  // Convert newlines to <br> for multi-paragraph text
  return text
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
