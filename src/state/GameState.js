import Phaser from "phaser";
import { SAVE_KEY } from "../config.js";
import { facilities } from "../data/facilities.js";
import { prestigeUpgrades, medalUpgrades, allPrestigeUpgrades } from "../data/prestige.js";
import { govTitles, titleById, RARITY_ORDER } from "../data/titles.js";
import { questDefinitions } from "../data/quests.js";
import { staffDefinitions } from "../data/staff.js";
import { achievementDefinitions } from "../data/achievements.js";
import { dailyQuestDefinitions } from "../data/dailyQuests.js";
import { weeklyGoalDefinitions } from "../data/weeklyGoals.js";
import { shortNumber } from "../utils/format.js";

const DAY_MS = 86400000;
const DAILY_STREAK_CAP = 7;
const TRUST_CRISIS = 20; // 이 미만이면 불신 위기(생산 페널티)
const TRUST_BONUS = 90; // 이 이상이면 신뢰 보너스(생산 서지)
const EVENT_COOLDOWN_MS = 45000; // 사건 대응 후 재대기 시간(스팸 방지 + 주기적 참여 비트)
const FACILITY_MILESTONES = [25, 50, 100]; // 시설 레벨 마일스톤: 도달 시 해당 시설 생산 ×2(영구, 누적). Lv25 미만은 영향 0 → 초반 곡선 보존
const RUSH_DURATION_MS = 20000; // 긴급 개표(러시) 지속 20초
const RUSH_COOLDOWN_MS = 180000; // 재사용 대기 3분
const RUSH_MULT = 5; // 러시 중 초당 생산 ×5(액티브 플레이 비트)
const BRIEF_COOLDOWN_MS = 90000; // 긴급 브리핑 재사용 90초
const BRIEF_BUFF_MS = 15000; // 브리핑 생산 버프 15초
const BRIEF_TRUST = 12; // 브리핑 시 믿음 +12(능동적 트러스트 관리 — 위기 탈출/보너스 진입)
const BRIEF_BUFF_MULT = 1.5; // 브리핑 버프 중 초당 생산 ×1.5

// 사건 도감 수집 보상 — 누적 수집 종수가 마일스톤을 넘으면 영구 생산 보너스(프레스티지에도 유지되는 메타 진척).
// pct는 '도달한 최고 마일스톤'의 값(누적 합산 아님). 도감을 모을 동기 + 디스크리트한 해금 비트.
const DEX_MILESTONES = [
  { n: 10, pct: 0.03 },
  { n: 25, pct: 0.07 },
  { n: 40, pct: 0.12 },
  { n: 55, pct: 0.18 },
  { n: 72, pct: 0.25 }, // 전종 수집 완성(officeEvents 총수와 일치 — 사건 추가 시 함께 갱신)
];

const SAVE_VERSION = 3;

const fallbackState = {
  version: SAVE_VERSION,
  votes: 0,
  explain: 80,
  trust: 72,
  days: 30,
  paused: false,
  selected: "desk",
  activeTab: "facilities",
  tutorial: {
    step: 0,
    done: false,
  },
  lastSavedAt: 0,
  lastSeenAt: 0,
  facilities: {
    desk: 1,
    sorter: 0,
    notice: 0,
    server: 0,
    archive: 0,
    studio: 0,
  },
  staff: {
    clerk: 0,
    auditor: 0,
    runner: 0,
    engineer: 0,
    analyst: 0,
    speaker: 0,
  },
  stage: {
    area: 1,
    progress: 0,
    target: 2200,
    completed: 0,
  },
  prestige: {
    seals: 0,
    runs: 0,
    bestArea: 1,
    totalSeals: 0,
    upgrades: {
      procedure: 0,
      manual: 0,
      briefing: 0,
      night: 0,
    },
    // 2차 통화(훈장) — 새 구역 돌파 시에만 적립. medalBest = 훈장 적립 기준이 된 최고 구역(기본 4 = 감사 가능 최소 구역).
    medals: 0,
    totalMedals: 0,
    medalBest: 4,
    medalUpgrades: {},
  },
  stats: {
    totalVotes: 0,
    totalClicks: 0,
    totalUpgrades: 0,
    totalEvents: 0,
    totalOfflineMs: 0,
    totalItems: 0,
  },
  achievements: {},
  quests: {},
  seenEvents: {}, // 사건 도감 — 겪은(해결한) 사건 id 기록(영구, 프레스티지에도 유지)
  titles: {}, // 국장 칭호 — { titleId: level }. 뽑기로 획득, 중복=레벨업. 영구(프레스티지 유지)
  titleDraws: 0, // 누적 뽑기 횟수(비용 곡선용)
  equippedTitle: null, // 대표 칭호 id(월드 표시·자동 = 최고 희귀/레벨)
  endless: 0,
  daily: { day: 0, streak: 0, qday: 0, clicks: 0, events: 0, upgrades: 0, items: 0, newdex: 0, claimed: {} },
  weekly: { week: 0, baseVotes: 0, target: 0, claimed: false },
  eventReadyAt: 0,
  rushReadyAt: 0,
  rushEndsAt: 0,
  briefReadyAt: 0,
  briefEndsAt: 0,
  offline2xDay: 0,
  log: ["개표국 개국"],
};

export class GameState extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    const loaded = this.load();
    this.data = loaded.data;
    this.offlineReward = loaded.offlineReward;
    this.saveTimer = 0;
    this.bindLifecycleSave();
  }

  load() {
    const now = Date.now();
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      const data = this.normalize(parsed, now);
      const offlineReward = this.applyOfflineProgress(data, now);
      return { data, offlineReward };
    } catch {
      const data = this.normalize(null, now);
      return { data, offlineReward: null };
    }
  }

  normalize(parsed, now) {
    const data = {
      ...structuredClone(fallbackState),
      ...(parsed || {}),
      version: SAVE_VERSION,
      facilities: { ...fallbackState.facilities, ...(parsed?.facilities || {}) },
      staff: { ...fallbackState.staff, ...(parsed?.staff || {}) },
      achievements: { ...fallbackState.achievements, ...(parsed?.achievements || {}) },
      quests: { ...fallbackState.quests, ...(parsed?.quests || {}) },
      seenEvents: (parsed?.seenEvents && typeof parsed.seenEvents === "object") ? { ...parsed.seenEvents } : {},
      titles: (parsed?.titles && typeof parsed.titles === "object") ? { ...parsed.titles } : {},
      titleDraws: Math.max(0, Math.floor(Number(parsed?.titleDraws) || 0)),
      equippedTitle: (parsed?.equippedTitle && titleById(parsed.equippedTitle)) ? parsed.equippedTitle : null,
      stats: { ...fallbackState.stats, ...(parsed?.stats || {}) },
      stage: { ...fallbackState.stage, ...(parsed?.stage || {}) },
      prestige: { ...fallbackState.prestige, ...(parsed?.prestige || {}) },
      tutorial: { ...fallbackState.tutorial, ...(parsed?.tutorial || {}) },
      daily: { ...fallbackState.daily, ...(parsed?.daily || {}) },
    };
    data.daily.day = Math.max(0, Math.floor(Number(data.daily.day) || 0));
    data.daily.streak = Math.max(0, Math.floor(Number(data.daily.streak) || 0));
    data.daily.qday = Math.max(0, Math.floor(Number(data.daily.qday) || 0));
    data.daily.clicks = Math.max(0, Math.floor(Number(data.daily.clicks) || 0));
    data.daily.events = Math.max(0, Math.floor(Number(data.daily.events) || 0));
    data.daily.upgrades = Math.max(0, Math.floor(Number(data.daily.upgrades) || 0));
    data.daily.items = Math.max(0, Math.floor(Number(data.daily.items) || 0));
    data.daily.newdex = Math.max(0, Math.floor(Number(data.daily.newdex) || 0));
    data.daily.claimed = (data.daily.claimed && typeof data.daily.claimed === "object") ? data.daily.claimed : {};
    // 누적 통계 숫자 정규화(손상/NaN 방지 — 통계 화면·업적 metric이 의존)
    ["totalVotes", "totalClicks", "totalUpgrades", "totalEvents", "totalOfflineMs", "totalItems"].forEach((k) => {
      data.stats[k] = Math.max(0, Number(data.stats[k]) || 0);
    });
    data.weekly = { ...fallbackState.weekly, ...(parsed?.weekly || {}) };
    data.weekly.week = Math.max(0, Math.floor(Number(data.weekly.week) || 0));
    data.weekly.baseVotes = Math.max(0, Number(data.weekly.baseVotes) || 0);
    data.weekly.target = Math.max(0, Number(data.weekly.target) || 0);
    data.weekly.claimed = !!data.weekly.claimed;

    data.votes = Math.max(0, Number(data.votes) || 0);
    data.explain = Math.max(0, Number(data.explain) || 0);
    data.trust = Phaser.Math.Clamp(Number(data.trust) || fallbackState.trust, 0, 100);
    data.days = Math.max(0, Number(data.days) || fallbackState.days);
    data.endless = Math.max(0, Math.floor(Number(data.endless) || 0));
    data.eventReadyAt = Math.max(0, Number(data.eventReadyAt) || 0);
    data.rushReadyAt = Math.max(0, Number(data.rushReadyAt) || 0);
    data.rushEndsAt = Math.max(0, Number(data.rushEndsAt) || 0);
    data.briefReadyAt = Math.max(0, Number(data.briefReadyAt) || 0);
    data.briefEndsAt = Math.max(0, Number(data.briefEndsAt) || 0);
    // 미래값으로 변조되면 2배 보상이 영구 비활성되므로 오늘 인덱스로 상한 클램프
    data.offline2xDay = Phaser.Math.Clamp(Math.floor(Number(data.offline2xDay) || 0), 0, this._todayIndex());
    data.stage.area = Math.max(1, Number(data.stage.area) || 1);
    data.stage.target = this.stageTarget(data.stage.area);
    data.stage.progress = Phaser.Math.Clamp(Number(data.stage.progress) || 0, 0, data.stage.target);
    data.lastSavedAt = Number(data.lastSavedAt) || now;
    data.lastSeenAt = Number(data.lastSeenAt) || now;
    data.prestige.seals = Math.max(0, Number(data.prestige.seals) || 0);
    data.prestige.runs = Math.max(0, Number(data.prestige.runs) || 0);
    data.prestige.bestArea = Math.max(1, Number(data.prestige.bestArea) || 1);
    data.prestige.totalSeals = Math.max(0, Number(data.prestige.totalSeals) || 0);
    // 훈장(2차 통화) 정규화 — 인장 상한 클램프가 전당(capBoost)에 의존하므로 훈장 먼저 처리
    data.prestige.medals = Math.max(0, Number(data.prestige.medals) || 0);
    data.prestige.totalMedals = Math.max(0, Number(data.prestige.totalMedals) || 0);
    data.prestige.medalBest = Math.max(4, Number(data.prestige.medalBest) || 4);
    data.prestige.medalUpgrades = { ...(data.prestige.medalUpgrades || {}) };
    medalUpgrades.forEach((upgrade) => {
      data.prestige.medalUpgrades[upgrade.id] = Phaser.Math.Clamp(Number(data.prestige.medalUpgrades[upgrade.id]) || 0, 0, upgrade.maxLevel);
    });
    const capBoost = medalUpgrades.reduce((sum, up) => sum + (data.prestige.medalUpgrades[up.id] || 0) * (up.effect.capBoost || 0), 0);
    data.prestige.upgrades = { ...fallbackState.prestige.upgrades, ...(data.prestige.upgrades || {}) };
    prestigeUpgrades.forEach((upgrade) => {
      // 전당(capBoost)이 유한 인장 업그레이드의 상한을 올린다(무한 골든은 제외)
      const max = upgrade.maxLevel >= 999 ? upgrade.maxLevel : upgrade.maxLevel + capBoost;
      data.prestige.upgrades[upgrade.id] = Phaser.Math.Clamp(Number(data.prestige.upgrades[upgrade.id]) || 0, 0, max);
    });

    if (!facilities.some((facility) => facility.id === data.selected)) data.selected = "desk";
    facilities.forEach((facility) => {
      const level = Number(data.facilities[facility.id]) || 0;
      data.facilities[facility.id] = Phaser.Math.Clamp(level, 0, facility.maxLevel || 99);
    });
    staffDefinitions.forEach((staff) => {
      data.staff[staff.id] = Phaser.Math.Clamp(Number(data.staff[staff.id]) || 0, 0, 20);
    });

    return data;
  }

  bindLifecycleSave() {
    if (typeof window === "undefined") return;
    window.addEventListener("pagehide", () => this.save(false));
    // 모바일 OS가 백그라운드 탭을 정지/종료할 때 — pagehide보다 신뢰도 높은 마지막 저장 기회
    document.addEventListener("freeze", () => this.save(false));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.save(false);
    });
  }

  applyOfflineProgress(data, now) {
    const elapsed = Phaser.Math.Clamp(now - data.lastSeenAt, 0, this.offlineCapMsFor(data));
    if (elapsed < 30000) return null;

    const seconds = elapsed / 1000;
    const votes = this.cpsFor(data) * seconds * this.offlineRateFor(data);
    const explain = this.explainPerSecondFor(data) * seconds * 0.58;
    data.votes += votes;
    data.explain += explain;
    data.stage.progress = Phaser.Math.Clamp(data.stage.progress + votes, 0, data.stage.target);
    data.stats.totalVotes += votes;
    data.stats.totalOfflineMs += elapsed;

    return {
      elapsed,
      votes,
      explain,
    };
  }

  // 오프라인 기본 보상은 로드 시 자동 적용됨(applyOfflineProgress). 2배 받기는 같은 양을 한 번 더(하루 1회).
  offline2xAvailable() {
    return this._todayIndex() > (this.data.offline2xDay || 0);
  }

  claimOfflineBonus() {
    const r = this.offlineReward;
    if (!r || !this.offline2xAvailable()) return null;
    this.data.votes += r.votes;
    this.data.explain += r.explain;
    this.data.stage.progress = Phaser.Math.Clamp(this.data.stage.progress + r.votes, 0, this.data.stage.target);
    this.data.stats.totalVotes += r.votes;
    this.data.offline2xDay = this._todayIndex();
    this.offlineReward = null;
    this.emit("changed");
    this.save(false);
    return r;
  }

  save(notify = true) {
    const now = Date.now();
    this.data.lastSavedAt = now;
    this.data.lastSeenAt = now;
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    if (notify) this.emit("saved");
  }

  addLog(message) {
    this.data.log.unshift(message);
    this.data.log = this.data.log.slice(0, 12);
  }

  autosave(delta) {
    this.saveTimer += delta;
    if (this.saveTimer < 10000) return;
    this.saveTimer = 0;
    this.save(false);
  }

  setTab(tab) {
    this.data.activeTab = tab;
    this.emit("changed");
  }

  advanceTutorial(action) {
    if (this.data.tutorial.done) return;
    const expected = ["click", "upgrade", "staff", "event", "stage"];
    if (expected[this.data.tutorial.step] !== action) return;
    this.data.tutorial.step += 1;
    if (this.data.tutorial.step >= expected.length) {
      this.data.tutorial.done = true;
      this.data.explain += 30;
      this.addLog("운영 안내 완료");
      this.emit("float", { text: "튜토리얼 완료", x: 195, y: 190, color: "#89d98b" });
    }
  }

  select(id) {
    const facility = this.facility(id);
    if (!facility || !this.isUnlocked(id)) return;
    this.data.selected = id;
    this.data.activeTab = "facilities";
    this.emit("changed");
  }

  processClick(x, y) {
    // 연타 콤보: 600ms 안에 이어 누르면 콤보 누적, 5콤보마다 +0.5배(최대 ×3)
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    if (now - (this._lastClickAt || 0) < 600) this._clickCombo = (this._clickCombo || 0) + 1;
    else this._clickCombo = 1;
    this._lastClickAt = now;
    const comboMult = 1 + Math.min(4, Math.floor(this._clickCombo / 5)) * 0.5;
    const amount = Math.round(this.clickPower() * comboMult);
    this.addVotes(amount);
    this.data.stats.totalClicks += 1;
    this._bumpDaily("clicks");
    this.advanceTutorial("click");
    this.emit("ballots", { x, y, count: 6 });
    this.emit("float", { text: `+${shortNumber(amount)}${comboMult > 1 ? ` ×${comboMult}` : ""}`, x, y: y - 26, color: comboMult > 1 ? "#ffd34d" : "#ffc857" });
    // 콤보 마일스톤: 25/50/100 연타 도달 시 표 폭발 보너스 + 축포(액티브 손맛 절정)
    const msBonus = { 25: 40, 50: 120, 100: 300 }[this._clickCombo];
    if (msBonus) {
      const bonus = Math.round(this.clickPower() * msBonus);
      this.addVotes(bonus);
      this.emit("celebrate", { text: `🔥 ${this._clickCombo} 콤보! +${shortNumber(bonus)}표!` });
      this.emit("float", { text: `🔥 +${shortNumber(bonus)}`, x, y: y - 62, color: "#ff7a3c" });
      // 콤보 축하음은 celebrate 이벤트(achieve)로 처리됨 — 중복 디스패치 제거
    }
    this.checkProgression();
    this.emit("changed");
  }

  // 현재 클릭 콤보 수(WorldView 표시용)
  clickCombo() { return this._clickCombo || 0; }

  tick() {
    if (this.data.paused) return;
    this.addVotes(this.cps());
    this.data.explain += this.explainPerSecond();
    // 홍보(notice) 패시브 회복은 믿음이 높을수록 둔화 → 100%에 고정되지 않고 평형점에 수렴(위기/보너스 긴장 유지, 보너스는 능동 브리핑으로 진입).
    this.data.trust = Phaser.Math.Clamp(this.data.trust - this.trustDecay() + this.level("notice") * 0.035 * (1 - this.data.trust / 100), 0, 100);
    this.reduceDays();
    this.checkProgression();
    this.emit("changed");
  }

  reduceDays() {
    const targetProgress = this.data.stage.target || 1;
    const ratio = this.data.stage.progress / targetProgress;
    const expectedDays = Math.max(0, 30 - Math.floor(ratio * 30));
    this.data.days = Math.min(this.data.days, expectedDays);
  }

  addVotes(amount) {
    const value = Math.max(0, amount);
    this.data.votes += value;
    this.data.stage.progress = Phaser.Math.Clamp(this.data.stage.progress + value, 0, this.data.stage.target);
    this.data.stats.totalVotes += value;
  }

  // 사건 보상의 양수 votes/explain은 현재 구역 규모에 맞춰 스케일(후반에도 의미있게). 비용(음수)은 그대로.
  eventRewardScale() {
    const base = Math.min(50, this.stageTarget(this.data.stage.area) / this.stageTarget(1));
    return base * (1 + this.permanentEffectFor(this.data, "eventPct") + this.titleEffectFor(this.data, "eventPct")); // 특별 대응반 + 칭호(서기관)
  }

  applyEffect(effect) {
    const scale = this.eventRewardScale();
    const rawVotes = effect.votes || 0;
    const votes = rawVotes > 0 ? Math.round(rawVotes * scale) : rawVotes;
    const rawExplain = effect.explain || 0;
    const explain = rawExplain > 0 ? Math.round(rawExplain * scale) : rawExplain;

    this.data.votes = Math.max(0, this.data.votes + votes);
    if (votes > 0) {
      this.data.stage.progress = Phaser.Math.Clamp(this.data.stage.progress + votes, 0, this.data.stage.target);
      this.data.stats.totalVotes += votes;
    }
    this.data.explain = Math.max(0, this.data.explain + explain);
    this.data.trust = Phaser.Math.Clamp(this.data.trust + (effect.trust || 0), 0, 100);
    if ((effect.trust || 0) > 0) {
      this.data.trust = Phaser.Math.Clamp(this.data.trust + this.staffLevel("speaker") * 0.3, 0, 100);
    }
    this.data.stats.totalEvents += 1;
    this._bumpDaily("events");
    this.data.eventReadyAt = Date.now() + EVENT_COOLDOWN_MS;
    this.advanceTutorial("event");
    this.addLog(`사건 대응: 믿음 ${Math.round(this.data.trust)}%`);
    this.emit("float", { text: "대응완료", x: 195, y: 540, color: "#89d98b" });
    this.checkProgression();
    this.emit("changed");
  }

  // 사건 도감 — 해결한 사건 id를 영구 기록(중복은 무시). 새로 수집되면 true 반환(첫 수집 연출용).
  markEventSeen(id) {
    if (!id) return false;
    if (!this.data.seenEvents || typeof this.data.seenEvents !== "object") this.data.seenEvents = {};
    if (this.data.seenEvents[id]) return false;
    const before = this.seenEventCount();
    this.data.seenEvents[id] = 1;
    this._bumpDaily("newdex"); // 오늘의 도감 — 새 사건 첫 수집 카운트
    const after = before + 1;
    // 수집 보상 마일스톤을 새로 넘었으면 해금 연출 신호
    const crossed = DEX_MILESTONES.find((m) => m.n === after);
    if (crossed) {
      this.emit("float", { text: `도감 보상 +${Math.round(crossed.pct * 100)}%`, x: 195, y: 470, color: "#89d98b" });
      this.emit("dex-milestone", { n: crossed.n, pct: crossed.pct });
    }
    this.checkAchievements(); // 도감 수집 즉시 dexSeen 업적 판정(applyEffect의 checkProgression은 markEventSeen 이전에 돈다)
    this.emit("changed");
    return true;
  }

  // 현재 도감 수집 종수가 도달한 최고 마일스톤의 생산 보너스 비율(0~0.25)
  dexBonusPct(data = this.data) {
    const s = data?.seenEvents;
    const n = s && typeof s === "object" ? Object.keys(s).length : 0;
    let pct = 0;
    for (const m of DEX_MILESTONES) if (n >= m.n) pct = m.pct;
    return pct;
  }

  // 다음 도감 마일스톤(없으면 null) — UI 안내용
  nextDexMilestone(data = this.data) {
    const s = data?.seenEvents;
    const n = s && typeof s === "object" ? Object.keys(s).length : 0;
    return DEX_MILESTONES.find((m) => n < m.n) || null;
  }

  seenEventCount() {
    const s = this.data.seenEvents;
    return s && typeof s === "object" ? Object.keys(s).length : 0;
  }

  hasSeenEvent(id) {
    return !!(this.data.seenEvents && this.data.seenEvents[id]);
  }

  eventReady() {
    return Date.now() >= (this.data.eventReadyAt || 0);
  }

  eventCooldownRemainingMs() {
    return Math.max(0, (this.data.eventReadyAt || 0) - Date.now());
  }

  eventCooldownTotalMs() {
    return EVENT_COOLDOWN_MS;
  }

  // 감사(프레스티지) 실행 시 영구 생산 배율이 어떻게 오르는지 미리보기(초기화 공포 완화)
  prestigeProjection() {
    const earned = this.prestigePreview();
    const p = this.data.prestige;
    const cpsFactor = 1 + this.permanentEffectFor(this.data, "cpsPct");
    const current = this.prestigeMultiplierFor(this.data) * cpsFactor;
    const projectedSeal = this.prestigeMultiplierRaw(p.totalSeals + earned, p.runs + 1, this.permanentEffectFor(this.data, "runsMult"));
    return { earned, current, projected: projectedSeal * cpsFactor, medalEarned: this.medalPreview() };
  }

  upgrade(id = this.data.selected) {
    const facility = this.facility(id);
    if (!facility || !this.isUnlocked(id)) return false;
    const currentLevel = this.level(id);
    if (currentLevel >= (facility.maxLevel || 99)) {
      this.emit("float", { text: "최대레벨", x: 314, y: 666, color: "#ff8e8e" });
      return false;
    }

    const voteCost = this.cost(id);
    const explainCost = this.explainCost(id);
    if (this.data.votes < voteCost || this.data.explain < explainCost) {
      this.emit("float", { text: "자원부족", x: 314, y: 666, color: "#ff8e8e" });
      return false;
    }

    this.data.votes -= voteCost;
    this.data.explain -= explainCost;
    this.data.facilities[id] = currentLevel + 1;
    this.data.stats.totalUpgrades += 1;
    this._bumpDaily("upgrades");
    this.advanceTutorial("upgrade");
    this.addLog(`${facility.name} Lv.${this.level(id)}`);
    this.data.trust = Phaser.Math.Clamp(this.data.trust + (facility.trust || 0), 0, 100);
    this.emit("float", {
      text: `${facility.name} Lv.${this.level(id)}`,
      x: facility.x,
      y: facility.y - 60,
      color: "#ffc857",
    });
    this.emit("upgraded", facility);
    this.checkProgression();
    this.emit("changed");
    return true;
  }

  advanceStage() {
    if (this.data.stage.progress < this.data.stage.target) return false;
    const rewardVotes = Math.floor(450 * this.data.stage.area ** 1.35);
    const rewardExplain = Math.floor(30 + this.data.stage.area * 14);
    this.data.stage.completed += 1;
    this.advanceTutorial("stage");
    this.data.stage.area += 1;
    this.data.prestige.bestArea = Math.max(this.data.prestige.bestArea, this.data.stage.area);
    this.data.stage.progress = 0;
    this.data.stage.target = this.stageTarget(this.data.stage.area);
    this.data.days = 30;
    this.data.votes += rewardVotes;
    this.data.explain += rewardExplain;
    this.data.trust = Phaser.Math.Clamp(this.data.trust + 5, 0, 100);
    this.addLog(`${this.data.stage.area - 1}구역 완료`);
    this.emit("float", { text: `지역 ${this.data.stage.area} 개표`, x: 195, y: 188, color: "#bba2ff" });
    this.checkProgression();
    this.emit("changed");
    return true;
  }

  hireStaff(id) {
    const staff = this.staff(id);
    if (!staff) return false;
    const level = this.staffLevel(id);
    const voteCost = this.staffCost(id);
    const explainCost = this.staffExplainCost(id);
    if (this.data.votes < voteCost || this.data.explain < explainCost) {
      this.emit("float", { text: "채용자원부족", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }
    this.data.votes -= voteCost;
    this.data.explain -= explainCost;
    this.data.staff[id] = level + 1;
    this.advanceTutorial("staff");
    this.data.trust = Phaser.Math.Clamp(this.data.trust + (staff.trustBonus || 0) * 20, 0, 100);
    this.addLog(`${staff.name} Lv.${this.staffLevel(id)}`);
    this.emit("float", { text: `${staff.name} Lv.${this.staffLevel(id)}`, x: 195, y: 604, color: "#7fc8ff" });
    this.checkProgression();
    this.emit("changed");
    return true;
  }

  // ── 일괄구매(x1 / x10 / Max) ──────────────────────────────
  // qty: 숫자(정확히 N레벨) 또는 "max"(자원 한도까지). 등비 비용을 누적 합산한다.
  facilityBulkPlan(id, qty) {
    const item = this.facility(id);
    if (!item || !this.isUnlocked(id)) return { levels: 0, voteCost: 0, explainCost: 0 };
    const maxLv = item.maxLevel || 99;
    const want = qty === "max" ? Infinity : Math.max(1, qty);
    let lv = this.level(id), v = 0, e = 0, n = 0, bv = this.data.votes, be = this.data.explain;
    while (n < want && lv < maxLv && n < 2000) {
      const cv = Math.floor(item.cost * 1.48 ** lv);
      const ce = Math.floor(item.explain * 1.18 ** lv);
      if (qty === "max") { if (bv < cv || be < ce) break; bv -= cv; be -= ce; }
      v += cv; e += ce; lv++; n++;
    }
    return { levels: n, voteCost: v, explainCost: e };
  }

  staffBulkPlan(id, qty) {
    const staff = this.staff(id);
    if (!staff) return { levels: 0, voteCost: 0, explainCost: 0 };
    const want = qty === "max" ? Infinity : Math.max(1, qty);
    let lv = this.staffLevel(id), v = 0, e = 0, n = 0, bv = this.data.votes, be = this.data.explain;
    while (n < want && n < 2000) {
      const cv = Math.floor(staff.cost * 1.62 ** lv);
      const ce = Math.floor(staff.explain * 1.24 ** lv);
      if (qty === "max") { if (bv < cv || be < ce) break; bv -= cv; be -= ce; }
      v += cv; e += ce; lv++; n++;
    }
    return { levels: n, voteCost: v, explainCost: e };
  }

  bulkUpgrade(id = this.data.selected, qty = 1) {
    const plan = this.facilityBulkPlan(id, qty);
    if (plan.levels < 1 || this.data.votes < plan.voteCost || this.data.explain < plan.explainCost) {
      this.emit("float", { text: "자원부족", x: 195, y: 320, color: "#ff8e8e" });
      return false;
    }
    const fac = this.facility(id);
    this.data.votes -= plan.voteCost;
    this.data.explain -= plan.explainCost;
    this.data.facilities[id] = this.level(id) + plan.levels;
    this.data.stats.totalUpgrades += plan.levels;
    this._bumpDaily("upgrades");
    this.advanceTutorial("upgrade");
    this.data.trust = Phaser.Math.Clamp(this.data.trust + (fac.trust || 0) * plan.levels, 0, 100);
    this.addLog(`${fac.name} Lv.${this.level(id)}${plan.levels > 1 ? ` (+${plan.levels})` : ""}`);
    this.emit("float", { text: `${fac.name} +${plan.levels}Lv`, x: 195, y: 300, color: "#ffc857" });
    this.emit("upgraded", fac);
    this.checkProgression();
    this.emit("changed");
    return true;
  }

  bulkHire(id, qty = 1) {
    const plan = this.staffBulkPlan(id, qty);
    if (plan.levels < 1 || this.data.votes < plan.voteCost || this.data.explain < plan.explainCost) {
      this.emit("float", { text: "채용자원부족", x: 195, y: 320, color: "#ff8e8e" });
      return false;
    }
    const staff = this.staff(id);
    this.data.votes -= plan.voteCost;
    this.data.explain -= plan.explainCost;
    this.data.staff[id] = this.staffLevel(id) + plan.levels;
    this.advanceTutorial("staff");
    this.data.trust = Phaser.Math.Clamp(this.data.trust + (staff.trustBonus || 0) * 20 * plan.levels, 0, 100);
    this.addLog(`${staff.name} Lv.${this.staffLevel(id)}${plan.levels > 1 ? ` (+${plan.levels})` : ""}`);
    this.emit("float", { text: `${staff.name} +${plan.levels}Lv`, x: 195, y: 300, color: "#7fc8ff" });
    this.checkProgression();
    this.emit("changed");
    return true;
  }

  // 랜덤 아이템 효과 — 종류별 즉시 보상. cps에 비례해 후반에도 의미있게.
  applyRandomItem(id) {
    const cps = this.cps();
    let r = { icon: "📦", text: "" };
    switch (id) {
      case "parcel": {
        const v = Math.max(80, Math.floor(cps * 90));
        this.addVotes(v); r = { icon: "📦", text: `의문의 택배 +${shortNumber(v)}표` }; break;
      }
      case "doc": {
        const e = Math.max(30, Math.floor(this.explainPerSecond() * 120 + this.data.explain * 0.25));
        this.data.explain += e; r = { icon: "📜", text: `기밀 문서 해명+${shortNumber(e)}` }; break;
      }
      case "balloon": {
        this.data.trust = Phaser.Math.Clamp(this.data.trust + 8, 0, 100);
        r = { icon: "🎈", text: `응원 답지 믿음+8` }; break;
      }
      case "votes": {
        const v = Math.max(120, Math.floor(cps * 150));
        this.addVotes(v); r = { icon: "🗳️", text: `숨은 표뭉치 +${shortNumber(v)}표` }; break;
      }
      case "donation": {
        const v = Math.max(200, Math.floor(cps * 320));
        const e = Math.floor(this.data.explain * 0.2 + 50);
        this.addVotes(v); this.data.explain += e;
        r = { icon: "💰", text: `거액 후원 +${shortNumber(v)}표` }; break;
      }
      case "coffee": {
        const v = Math.max(100, Math.floor(cps * 110));
        this.addVotes(v); r = { icon: "☕", text: `야근 커피 +${shortNumber(v)}표` }; break;
      }
      case "stamp": {
        const v = Math.max(90, Math.floor(cps * 100));
        const e = Math.floor(this.data.explain * 0.12 + 30);
        this.addVotes(v); this.data.explain += e;
        r = { icon: "🧾", text: `결재 도장 +${shortNumber(v)}표` }; break;
      }
      case "ramen": {
        const v = Math.max(80, Math.floor(cps * 80));
        this.addVotes(v); this.data.trust = Phaser.Math.Clamp(this.data.trust + 5, 0, 100);
        r = { icon: "🍜", text: `야식 회식 +${shortNumber(v)}표·믿음+5` }; break;
      }
      case "jackpot": {
        const big = Math.random() < 0.5;
        const v = big ? Math.max(500, Math.floor(cps * 600)) : Math.max(60, Math.floor(cps * 40));
        this.addVotes(v);
        r = { icon: "🎰", text: big ? `🎉 복권 대박! +${shortNumber(v)}표` : `복권 꽝… +${shortNumber(v)}표` }; break;
      }
      case "pigeon": {
        const v = Math.max(90, Math.floor(cps * 95));
        this.addVotes(v); this.data.trust = Phaser.Math.Clamp(this.data.trust + 3, 0, 100);
        r = { icon: "🕊️", text: `🕊️ 비둘기 소동 수습 +${shortNumber(v)}표·믿음+3` }; break;
      }
      case "tip": {
        const e = Math.max(40, Math.floor(this.explainPerSecond() * 110 + this.data.explain * 0.15));
        this.data.explain += e; this.data.trust = Phaser.Math.Clamp(this.data.trust + 3, 0, 100);
        r = { icon: "📱", text: `📱 제보 전화 해명+${shortNumber(e)}·믿음+3` }; break;
      }
      default: break;
    }
    this.data.stats.totalItems = (this.data.stats.totalItems || 0) + 1;
    this._bumpDaily("items");
    this.addLog(r.text);
    this.emit("changed");
    return r;
  }

  canPrestige() {
    return this.data.stage.area >= 4 || this.facilityTotal() >= 55 || this.data.stage.completed >= 3;
  }

  prestigePreview() {
    if (!this.canPrestige()) return 0;
    const areaValue = Math.max(0, this.data.stage.area - 3) * 4;
    const facilityValue = Math.floor(this.facilityTotal() / 12);
    const eventValue = Math.floor(this.data.stats.totalEvents / 3);
    const base = Math.max(4, areaValue + facilityValue + eventValue);
    // 정밀 감사반(sealPct, 가산) × 포고령(sealMult, 곱연산) — 두 통화가 인장 수입에 함께 작용
    return Math.floor(base * (1 + this.permanentEffectFor(this.data, "sealPct")) * (1 + this.permanentEffectFor(this.data, "sealMult")));
  }

  // 훈장(2차 통화) 적립 = 이번 감사로 도달한 구역이 기존 최고치를 넘은 만큼만(구역당 1). 감사 스팸으론 못 캠 — 깊이를 밀어야 한다.
  medalPreview() {
    if (!this.canPrestige()) return 0;
    return Math.max(0, this.data.stage.area - (this.data.prestige.medalBest || 4));
  }

  prestigeReset() {
    const earned = this.prestigePreview();
    if (earned <= 0) {
      this.emit("float", { text: "아직 감사불가", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }
    const medalEarned = this.medalPreview();

    const kept = {
      prestige: {
        seals: this.data.prestige.seals + earned,
        runs: this.data.prestige.runs + 1,
        bestArea: Math.max(this.data.prestige.bestArea, this.data.stage.area),
        totalSeals: this.data.prestige.totalSeals + earned,
        upgrades: this.data.prestige.upgrades,
        // 훈장: 새 구역 돌파분 적립 + 기준 구역 갱신(다음엔 더 깊이 가야 적립)
        medals: this.data.prestige.medals + medalEarned,
        totalMedals: this.data.prestige.totalMedals + medalEarned,
        medalBest: Math.max(this.data.prestige.medalBest || 4, this.data.stage.area),
        medalUpgrades: this.data.prestige.medalUpgrades,
      },
      achievements: this.data.achievements,
      seenEvents: this.data.seenEvents, // 사건 도감은 평생 수집 기록 — 감사(프레스티지)에도 영구 유지
      titles: this.data.titles, // 국장 칭호(인사 발령)는 평생 컬렉션 — 감사에도 유지
      titleDraws: this.data.titleDraws,
      equippedTitle: this.data.equippedTitle,
      tutorial: this.data.tutorial, // 베테랑이 감사(프레스티지) 후 신규 오프닝/튜토리얼을 다시 보지 않도록 유지
      daily: this.data.daily, // 감사(프레스티지)는 진행이지 새 세이브가 아님 — 출석 연속/일일 진행 유지
      weekly: this.data.weekly, // 주간 한정 목표(주차/목표/수령여부) 유지 — 안 그러면 재청구 악용 + 목표 리셋
    };

    this.data = this.normalize({
      ...structuredClone(fallbackState),
      ...kept,
      explain: fallbackState.explain + earned * 3,
      votes: this.startingVotesFor(kept.prestige),
      trust: Math.min(90, fallbackState.trust + kept.prestige.runs),
      log: [medalEarned > 0 ? `감사 완료: 제도인장 +${earned} · 훈장 +${medalEarned}` : `감사 완료: 제도인장 +${earned}`, "개표국 재정비"],
    }, Date.now());
    // 감사로 stats.totalVotes가 0으로 리셋되므로 주간 기준점도 재정렬(안 하면 progress가 음수→0에 영구 고정)
    this.data.weekly.baseVotes = this.data.stats.totalVotes;
    // 아직 미수령이면 목표량도 감사 후(낮아진) 생산 기준으로 재계산 — 안 하면 감사 전 높은 cps 기준 목표가 도달 불가해짐(재청구는 claimed 유지로 차단)
    if (!this.data.weekly.claimed) {
      const wdef = this.weeklyDef();
      this.data.weekly.target = Math.max(wdef.minTarget, Math.round(this.cpsFor(this.data) * wdef.hours * 3600));
    }
    // 상비 인력: 접수창구 시작 레벨 / 여론전: 시작 믿음 상향(감사 영구 업그레이드 효과)
    const startDesk = Math.round(this.permanentEffectFor(this.data, "startDesk"));
    if (startDesk > 0) this.data.facilities.desk = Math.max(this.data.facilities.desk, 1 + startDesk);
    const startTrust = this.permanentEffectFor(this.data, "startTrust");
    if (startTrust > 0) this.data.trust = Phaser.Math.Clamp(this.data.trust + startTrust, 0, 95);
    this.offlineReward = null;
    this.emit("float", { text: `제도인장 +${earned}`, x: 195, y: 190, color: "#bba2ff" });
    if (medalEarned > 0) this.emit("float", { text: `훈장 +${medalEarned}`, x: 195, y: 158, color: "#ffd479" });
    this.emit("changed");
    this.save(false);
    return true;
  }

  buyPrestigeUpgrade(id) {
    const upgrade = allPrestigeUpgrades.find((item) => item.id === id);
    if (!upgrade) return false;
    const isMedal = upgrade.currency === "medal";
    const store = isMedal ? this.data.prestige.medalUpgrades : this.data.prestige.upgrades;
    const level = this.prestigeUpgradeLevel(id);
    if (level >= this.effectiveMaxLevel(upgrade)) {
      this.emit("float", { text: "최대레벨", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }
    const cost = this.prestigeUpgradeCost(id);
    const bank = isMedal ? this.data.prestige.medals : this.data.prestige.seals;
    if (bank < cost) {
      this.emit("float", { text: isMedal ? "훈장부족" : "인장부족", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }
    if (isMedal) this.data.prestige.medals -= cost;
    else this.data.prestige.seals -= cost;
    store[id] = level + 1;
    this.addLog(`${upgrade.shortName} Lv.${level + 1}`);
    this.emit("float", { text: `${upgrade.shortName} 강화`, x: 195, y: 604, color: isMedal ? "#ffd479" : "#bba2ff" });
    this.emit("changed");
    this.save(false);
    return true;
  }

  checkProgression() {
    this.checkAchievements();
    this.checkQuests();
  }

  checkAchievements() {
    achievementDefinitions.forEach((a) => {
      if (this.data.achievements[a.id]) return;
      if (this.achievementProgress(a.metric) < a.target) return;
      this.data.achievements[a.id] = true;
      const r = a.reward || {};
      this.data.explain += r.explain || 0;
      this.data.votes += r.votes || 0;
      if (r.trust) this.data.trust = Phaser.Math.Clamp(this.data.trust + r.trust, 0, 100);
      if (r.seals) this.data.prestige.seals += r.seals;
      this.emit("float", { text: `업적 ${a.name}`, x: 195, y: 210, color: "#bba2ff" });
      this.emit("celebrate", { text: `🏅 업적 달성 · ${a.name}` });
    });
  }

  achievementProgress(metric) {
    switch (metric) {
      case "totalVotes": return this.data.stats.totalVotes;
      case "cps": return this.cps();
      case "trust": return this.data.trust;
      case "facilityTotal": return this.facilityTotal();
      case "area": return this.data.stage.area;
      case "prestigeRuns": return this.data.prestige.runs;
      case "totalEvents": return this.data.stats.totalEvents;
      case "totalClicks": return this.data.stats.totalClicks || 0;
      case "totalItems": return this.data.stats.totalItems || 0;
      case "medals": return this.data.prestige.totalMedals || 0;
      case "dexSeen": return this.seenEventCount();
      default: return 0;
    }
  }

  // ----- 일일 출석 보상 -----
  _todayIndex() {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // 로컬 자정 기준 일자 인덱스
    return Math.floor(d.getTime() / DAY_MS);
  }

  dailyStatus() {
    const today = this._todayIndex();
    const last = this.data.daily.day;
    const available = today > last;
    // 어제 받았으면 연속, 아니면 1일차로 리셋
    const pendingStreak = available ? (today === last + 1 ? Math.min(this.data.daily.streak + 1, DAILY_STREAK_CAP) : 1) : this.data.daily.streak;
    return { available, streak: pendingStreak, reward: this.dailyReward(pendingStreak) };
  }

  dailyReward(streak) {
    const s = Phaser.Math.Clamp(Math.floor(streak || 1), 1, DAILY_STREAK_CAP);
    const explain = 25 * s;
    const votes = Math.max(150, Math.round(this.cpsFor(this.data) * 120)) * s; // 버프(러시) 제외한 기본 생산 기준 — 러시 중 수령 시 5배 악용 방지
    const seals = s >= DAILY_STREAK_CAP ? 1 : 0;
    return { explain, votes, seals, streak: s };
  }

  claimDaily() {
    const status = this.dailyStatus();
    if (!status.available) return null;
    const today = this._todayIndex();
    this.data.daily.streak = status.streak;
    this.data.daily.day = today;
    const r = status.reward;
    this.data.explain += r.explain;
    this.data.votes += r.votes;
    if (r.seals) this.data.prestige.seals += r.seals;
    this.save(false);
    this.emit("changed");
    return r;
  }

  // ----- 로테이팅 일일 퀘스트 (자정 리셋) -----
  _ensureDailyQuests() {
    const today = this._todayIndex();
    if (this.data.daily.qday !== today) {
      this.data.daily.qday = today;
      this.data.daily.clicks = 0;
      this.data.daily.events = 0;
      this.data.daily.upgrades = 0;
      this.data.daily.items = 0; // 버그 수정: items 미리셋 → 줍줍 데일리가 매일 stale 카운트로 자동완료되던 문제
      this.data.daily.newdex = 0; // 도감 신규 수집 데일리 카운터
      this.data.daily.claimed = {};
    }
  }
  _bumpDaily(field) {
    this._ensureDailyQuests();
    this.data.daily[field] = (this.data.daily[field] || 0) + 1;
  }
  dailyQuestProgress(id) {
    this._ensureDailyQuests();
    const q = dailyQuestDefinitions.find((d) => d.id === id);
    return q ? (this.data.daily[q.metric] || 0) : 0;
  }
  dailyQuestDone(id) {
    const q = dailyQuestDefinitions.find((d) => d.id === id);
    return q ? this.dailyQuestProgress(id) >= q.target : false;
  }
  dailyQuestClaimed(id) {
    this._ensureDailyQuests();
    return !!this.data.daily.claimed[id];
  }
  dailyQuestClaimable(id) {
    return this.dailyQuestDone(id) && !this.dailyQuestClaimed(id);
  }
  anyDailyQuestClaimable() {
    return dailyQuestDefinitions.some((q) => this.dailyQuestClaimable(q.id));
  }
  claimDailyQuest(id) {
    if (!this.dailyQuestClaimable(id)) return null;
    const q = dailyQuestDefinitions.find((d) => d.id === id);
    const r = q.reward || {};
    this.data.explain += r.explain || 0;
    this.data.votes += r.votes || 0;
    if (r.trust) this.data.trust = Phaser.Math.Clamp(this.data.trust + r.trust, 0, 100);
    if (r.seals) this.data.prestige.seals += r.seals;
    this.data.daily.claimed[id] = true;
    this.emit("celebrate", { text: `📅 일일 완료 · ${q.title}` });
    this.emit("changed");
    this.save(false);
    return r;
  }

  // 필드 황금 투표함 수령: 약 90초치 생산을 즉시 지급(액티브 손맛). 기존 addVotes 경유(주간/업적/구역 진행에 자연 반영).
  collectGoldenBallot() {
    const reward = Math.max(50, Math.round(this.cps() * 90));
    this.addVotes(reward);
    this.emit("celebrate", { text: `🌟 황금 투표함! +${shortNumber(reward)}표` });
    this.emit("changed");
    return reward;
  }

  // ----- 한정 시즌(주간) 목표 (date-seeded, 주차 변경 시 자동 교체) -----
  _weekIndex() {
    return Math.floor(this._todayIndex() / 7);
  }
  weeklyDef() {
    return weeklyGoalDefinitions[this._weekIndex() % weeklyGoalDefinitions.length];
  }
  _ensureWeekly() {
    const wk = this._weekIndex();
    if (this.data.weekly.week !== wk) {
      const def = weeklyGoalDefinitions[wk % weeklyGoalDefinitions.length];
      this.data.weekly.week = wk;
      this.data.weekly.baseVotes = this.data.stats.totalVotes;
      // 목표량은 주 시작 시점의 기본 생산(버프 제외) × hours로 동적 산정
      this.data.weekly.target = Math.max(def.minTarget, Math.round(this.cpsFor(this.data) * def.hours * 3600));
      this.data.weekly.claimed = false;
    }
  }
  weeklyProgress() {
    this._ensureWeekly();
    return Math.max(0, this.data.stats.totalVotes - this.data.weekly.baseVotes);
  }
  weeklyTarget() {
    this._ensureWeekly();
    return this.data.weekly.target;
  }
  weeklyDone() {
    return this.weeklyProgress() >= this.weeklyTarget();
  }
  weeklyClaimed() {
    this._ensureWeekly();
    return this.data.weekly.claimed;
  }
  weeklyClaimable() {
    return this.weeklyDone() && !this.weeklyClaimed();
  }
  weeklyDaysLeft() {
    return Math.max(1, (this._weekIndex() + 1) * 7 - this._todayIndex());
  }
  claimWeekly() {
    if (!this.weeklyClaimable()) return null;
    const def = this.weeklyDef();
    this.data.prestige.seals += def.seals || 0;
    this.data.weekly.claimed = true;
    this.emit("celebrate", { text: `🏆 ${def.title} 완료 · 인장 +${def.seals}` });
    this.emit("changed");
    this.save(false);
    return { seals: def.seals };
  }

  checkQuests() {
    const grant = (quest) => {
      this.data.votes += quest.reward.votes || 0;
      this.data.explain += quest.reward.explain || 0;
      this.data.trust = Phaser.Math.Clamp(this.data.trust + (quest.reward.trust || 0), 0, 100);
      this.emit("float", { text: `목표완료 ${quest.title}`, x: 195, y: 244, color: "#bba2ff" });
      this.emit("celebrate", { text: `✅ 목표 완료 · ${quest.title}` });
    };
    questDefinitions.forEach((quest) => {
      if (this.data.quests[quest.id]) return;
      if (this.questProgress(quest) < quest.target) return;
      this.data.quests[quest.id] = true;
      grant(quest);
    });
    // 정의된 목표를 모두 끝낸 뒤로는 끝없는 누적-표 목표가 계속 이어진다(후반 목표 고갈 방지)
    // 큰 점프(오프라인 복귀 등)에 한 프레임에 여러 티어가 몰려 보상·토스트가 폭주하지 않도록 호출당 1티어만 지급(틱마다 따라잡음)
    if (this.allDefinedQuestsDone()) {
      const eq = this.endlessQuest(this.data.endless);
      if (this.questProgress(eq) >= eq.target) {
        grant(eq);
        this.data.endless += 1;
      }
    }
  }

  allDefinedQuestsDone() {
    return questDefinitions.every((quest) => this.data.quests[quest.id]);
  }

  // tier 0,1,2…에 대해 누적 표 목표가 약 2.4배씩 증가하는 생성형 무한 목표
  endlessQuest(tier) {
    const t = Math.max(0, Math.floor(tier || 0));
    const target = Math.round(50000 * 2.4 ** t);
    return {
      id: `endless-${t}`,
      generated: true,
      title: `끝없는 개표 ${t + 1}`,
      desc: `누적 ${target.toLocaleString("en-US")}표를 처리하세요.`,
      metric: "totalVotes",
      target,
      reward: { explain: 40 * (t + 1), votes: Math.round(target * 0.12), trust: 1 },
    };
  }

  nextQuest() {
    return questDefinitions.find((quest) => !this.data.quests[quest.id]) || this.endlessQuest(this.data.endless);
  }

  questProgress(quest) {
    if (quest.metric === "totalVotes") return this.data.stats.totalVotes;
    if (quest.metric === "facility") return this.level(quest.facility);
    if (quest.metric === "trust") return this.data.trust;
    if (quest.metric === "cps") return this.cps();
    if (quest.metric === "stage") return this.data.stage.area;
    if (quest.metric === "facilityTotal") return this.facilityTotal();
    return 0;
  }

  availableFacilities() {
    return facilities.filter((facility) => this.isUnlocked(facility.id));
  }

  lockedFacilities() {
    return facilities.filter((facility) => !this.isUnlocked(facility.id));
  }

  isUnlocked(id) {
    const facility = this.facility(id);
    return Boolean(facility && this.data.stage.area >= (facility.unlock || 1));
  }

  cps() {
    // 러시·브리핑 버프는 실시간 생산에만 적용(오프라인 정산엔 미적용 — cpsFor를 직접 쓰는 경로)
    return this.cpsFor(this.data) * (this.rushActive() ? RUSH_MULT : 1) * (this.briefActive() ? BRIEF_BUFF_MULT : 1);
  }

  // ----- 긴급 브리핑(액티브 트러스트 액션): 해명 소비 → 믿음 회복 + 짧은 생산 버프 -----
  briefCost() {
    return Math.max(15, Math.round(this.explainPerSecond() * 20)); // 약 20초치 해명(스테이지 무관하게 의미 유지)
  }
  briefActive() {
    return Date.now() < (this.data.briefEndsAt || 0);
  }
  briefReady() {
    return !this.briefActive() && Date.now() >= (this.data.briefReadyAt || 0);
  }
  briefAffordable() {
    return this.data.explain >= this.briefCost();
  }
  briefCooldownRemainingMs() {
    return Math.max(0, (this.data.briefReadyAt || 0) - Date.now());
  }
  briefRemainingMs() {
    return Math.max(0, (this.data.briefEndsAt || 0) - Date.now());
  }
  activateBrief() {
    if (!this.briefReady() || !this.briefAffordable()) return false;
    const now = Date.now();
    this.data.explain -= this.briefCost();
    this.data.trust = Phaser.Math.Clamp(this.data.trust + BRIEF_TRUST, 0, 100);
    this.data.briefEndsAt = now + BRIEF_BUFF_MS;
    this.data.briefReadyAt = now + BRIEF_COOLDOWN_MS;
    this.emit("float", { text: `긴급 브리핑! 믿음 +${BRIEF_TRUST}`, x: 195, y: 330, color: "#8df0b0" });
    this.emit("celebrate", { text: `📢 긴급 브리핑! 믿음 +${BRIEF_TRUST}` }); // 토스트+플래시 스파이크
    this.emit("changed");
    return true;
  }

  // ----- 긴급 개표(러시) 부스트 -----
  rushActive() {
    return Date.now() < (this.data.rushEndsAt || 0);
  }
  rushReady() {
    return !this.rushActive() && Date.now() >= (this.data.rushReadyAt || 0);
  }
  rushRemainingMs() {
    return Math.max(0, (this.data.rushEndsAt || 0) - Date.now());
  }
  rushCooldownRemainingMs() {
    return Math.max(0, (this.data.rushReadyAt || 0) - Date.now());
  }
  rushTotalMs() {
    return RUSH_DURATION_MS;
  }
  activateRush() {
    if (!this.rushReady()) return false;
    const now = Date.now();
    this.data.rushEndsAt = now + RUSH_DURATION_MS;
    this.data.rushReadyAt = now + RUSH_COOLDOWN_MS;
    this.emit("float", { text: "긴급 개표! ×5", x: 195, y: 300, color: "#ffd34d" });
    this.emit("celebrate", { text: "⚡ 개표 폭주 시작! ×5" }); // 토스트+플래시 페이오프 스파이크
    this.emit("changed");
    return true;
  }

  cpsFor(data) {
    const raw = facilities.reduce((sum, item) => {
      const lv = data.facilities[item.id] || 0;
      return sum + lv * item.cps * this.facilityMilestoneFactor(lv);
    }, 0);
    return raw * (0.9 + data.trust / 230) * this.trustModifier(data.trust) * this.staffMultiplierFor(data) * this.prestigeMultiplierFor(data) * (1 + this.permanentEffectFor(data, "cpsPct") + this.titleEffectFor(data, "cpsPct")) * (1 + this.dexBonusPct(data));
  }

  // 시설 레벨이 마일스톤을 넘을 때마다 해당 시설 생산 ×2 누적(AdVenture Capitalist식 영구 보너스)
  facilityMilestoneFactor(level) {
    let f = 1;
    for (const m of FACILITY_MILESTONES) if (level >= m) f *= 2;
    return f;
  }

  // 해당 레벨 기준 다음 마일스톤(없으면 null) — 시설 카드 "다음 보너스 LvN" 표기용
  nextFacilityMilestone(level) {
    for (const m of FACILITY_MILESTONES) if (level < m) return m;
    return null;
  }

  // 불신 위기 / 신뢰 보너스: 20~90% 구간은 1.0(기존 밸런스 유지), 양 극단에서만 굽는다.
  // 믿음 <20%: 생산 페널티(불신 위기), 믿음 >=90%: 생산 보너스(신뢰 서지).
  trustModifier(trust) {
    if (trust < TRUST_CRISIS) return 0.55 + (trust / TRUST_CRISIS) * 0.45; // 0% →0.55, 20% →1.0
    if (trust >= TRUST_BONUS) return 1 + ((trust - TRUST_BONUS) / (100 - TRUST_BONUS)) * 0.25; // 90% →1.0, 100% →1.25
    return 1;
  }

  trustState() {
    if (this.data.trust < TRUST_CRISIS) return "crisis";
    if (this.data.trust >= TRUST_BONUS) return "bonus";
    return "normal";
  }

  staffMultiplierFor(data) {
    const bonus = staffDefinitions.reduce((sum, staff) => {
      const lv = data.staff?.[staff.id] || 0;
      if (!lv) return sum;
      let s = lv * (staff.cpsBonus || 0);
      // 데이터 구동 스킬: skill.cpsBonus가 정의된 직원은 언락 레벨 이상에서 추가 생산
      if (staff.skill?.cpsBonus && lv >= staff.skill.unlockLevel) s += lv * staff.skill.cpsBonus;
      // 시너지: 대응 시설 레벨 × 직원 레벨 × per (곱연산 — "시설 키운 만큼 직원도 키우자" 빌드 결정)
      if (staff.synergy) s += lv * (data.facilities?.[staff.synergy.facility] || 0) * staff.synergy.per;
      return sum + s;
    }, 0);
    return 1 + bonus;
  }

  // 직원의 현재 시너지 기여(표시용)
  staffSynergyValue(id) {
    const staff = this.staff(id);
    if (!staff?.synergy) return 0;
    return (this.staffLevel(id) || 0) * (this.level(staff.synergy.facility) || 0) * staff.synergy.per;
  }

  // 인장은 가산, 감사 횟수는 가산항과 곱해지는 복리식(매 감사가 누적 인장을 증폭 → "다음 감사가 더 빨라진다" 감각).
  // 감사 횟수 보너스는 소프트캡(runs/40)으로 후반 과인플레 방지. seals=0,runs=0 → 1.0 (기존과 연속).
  prestigeMultiplierRaw(totalSeals, runs, runsMult = 0) {
    const s = Math.max(0, totalSeals || 0);
    const r = Math.max(0, runs || 0);
    // 관록(runsMult): 감사 횟수 보너스의 기울기를 키운다(소프트캡은 유지 → 폭주 방지)
    const runsBonus = (0.06 * (1 + runsMult) * r) / (1 + r / 40);
    return (1 + s * 0.025) * (1 + runsBonus);
  }

  prestigeMultiplierFor(data) {
    return this.prestigeMultiplierRaw(data.prestige?.totalSeals || 0, data.prestige?.runs || 0, this.permanentEffectFor(data, "runsMult"));
  }

  explainPerSecond() {
    return this.explainPerSecondFor(this.data);
  }

  explainPerSecondFor(data) {
    const raw = 0.55 + (data.facilities.notice || 0) * 0.2 + (data.facilities.server || 0) * 0.16 + (data.facilities.studio || 0) * 0.12;
    return raw * (1 + this.permanentEffectFor(data, "explainPct") + this.titleEffectFor(data, "explainPct"));
  }

  clickPower() {
    const facilityPower = facilities.reduce((sum, item) => sum + this.level(item.id) * item.click, 0);
    const staffPower = staffDefinitions.reduce((sum, staff) => {
      const lv = this.staffLevel(staff.id);
      let s = lv * (staff.clickBonus || 0);
      // 데이터 구동 스킬: skill.clickBonus가 정의된 직원은 언락 레벨 이상에서 추가 클릭 처리
      if (staff.skill?.clickBonus && lv >= staff.skill.unlockLevel) s += lv * staff.skill.clickBonus;
      return sum + s;
    }, 0);
    const clerkSkill = Math.floor(this.staffLevel("clerk") / 5);
    const raw = 1 + facilityPower + staffPower + clerkSkill;
    return Math.round(raw * (1 + this.permanentEffectFor(this.data, "clickPct") + this.titleEffectFor(this.data, "clickPct"))); // round: 작은 raw에서 clickPct 보너스가 floor로 0이 되던 문제 보정
  }

  trustDecay() {
    const reduction = staffDefinitions.reduce((sum, staff) => sum + this.staffLevel(staff.id) * (staff.trustBonus || 0), 0);
    return Math.max(0.015, 0.06 - reduction);
  }

  offlineRateFor(data) {
    return 0.72 * (1 + this.permanentEffectFor(data, "offlinePct") + this.titleEffectFor(data, "offlinePct"));
  }

  // 기록 보관소: 기본 8시간 + 레벨당 1시간
  offlineCapMsFor(data) {
    const hours = 8 + this.permanentEffectFor(data, "offlineHr");
    return hours * 3600000;
  }

  // 인장+훈장 두 통화의 영구 효과를 한 번에 합산(키 단위). cpsPct처럼 양쪽이 같은 키를 가지면 자연히 더해진다.
  permanentEffectFor(data, key) {
    return allPrestigeUpgrades.reduce((sum, upgrade) => {
      const store = upgrade.currency === "medal" ? data.prestige?.medalUpgrades : data.prestige?.upgrades;
      const level = store?.[upgrade.id] || 0;
      return sum + level * (upgrade.effect[key] || 0);
    }, 0);
  }

  // ----- 국장 칭호(인사 발령 뽑기) -----
  // 보유 칭호 레벨 × 효과를 같은 key 버킷에 합산 — permanentEffectFor와 함께 수식에 들어간다.
  titleEffectFor(data, key) {
    const titles = data?.titles;
    if (!titles || typeof titles !== "object") return 0;
    return govTitles.reduce((sum, t) => sum + (titles[t.id] || 0) * (t.effect[key] || 0), 0);
  }

  ownedTitleCount() {
    const t = this.data.titles;
    return t && typeof t === "object" ? Object.keys(t).filter((id) => t[id] > 0).length : 0;
  }

  // 뽑기 비용(해명) — 누적 뽑기 수에 따라 1.22배씩 상승(초반 저렴→후반 묵직한 해명 소비처)
  gachaDrawCost() {
    return Math.floor(40 * Math.pow(1.22, this.data.titleDraws || 0));
  }

  canDrawGacha() {
    return this.data.explain >= this.gachaDrawCost();
  }

  // 대표 칭호 = 보유 중 최고 희귀도, 동률이면 최고 레벨. 월드 표시·꾸미기에 사용.
  bestTitleId() {
    const t = this.data.titles || {};
    let best = null, bestRank = -1, bestLv = 0;
    for (const def of govTitles) {
      const lv = t[def.id] || 0;
      if (lv <= 0) continue;
      const rank = RARITY_ORDER[def.rarity] ?? 0;
      if (rank > bestRank || (rank === bestRank && lv > bestLv)) { best = def.id; bestRank = rank; bestLv = lv; }
    }
    return best;
  }

  equippedTitleDef() {
    const id = this.data.equippedTitle || this.bestTitleId();
    return id ? titleById(id) : null;
  }

  _pickGachaTitle() {
    const total = govTitles.reduce((s, t) => s + (t.weight || 1), 0);
    let roll = Math.random() * total;
    for (const t of govTitles) { roll -= (t.weight || 1); if (roll < 0) return t; }
    return govTitles[govTitles.length - 1];
  }

  // 인사 발령 뽑기 1회 — 해명 차감, 칭호 획득(중복=레벨업), 대표 칭호 갱신. 결과 객체 반환(없으면 null).
  drawGacha() {
    const cost = this.gachaDrawCost();
    if (this.data.explain < cost) {
      this.emit("float", { text: "해명 부족", x: 195, y: 720, color: "#ff8e8e" });
      return null;
    }
    this.data.explain -= cost;
    this.data.titleDraws = (this.data.titleDraws || 0) + 1;
    const def = this._pickGachaTitle();
    if (!this.data.titles || typeof this.data.titles !== "object") this.data.titles = {};
    const prev = this.data.titles[def.id] || 0;
    const isNew = prev === 0;
    this.data.titles[def.id] = prev + 1;
    const level = prev + 1;
    // 대표 칭호 갱신(더 높은 등급/레벨이면 자동 장착)
    this.data.equippedTitle = this.bestTitleId();
    this.emit("celebrate", { text: `${isNew ? "🎉 신규 발령" : "⬆️ 승진"} · ${def.name}${isNew ? "" : ` Lv.${level}`}` });
    this.checkProgression();
    this.emit("changed");
    this.save(false);
    return { id: def.id, name: def.name, rarity: def.rarity, per: def.per, emoji: def.emoji, level, isNew };
  }

  // 유한 인장 업그레이드의 실효 상한 = 정의 상한 + 전당(capBoost). 무한(>=999)·훈장 업그레이드는 그대로.
  effectiveMaxLevel(upgrade) {
    if (upgrade.currency === "medal" || upgrade.maxLevel >= 999) return upgrade.maxLevel;
    return upgrade.maxLevel + Math.round(this.permanentEffectFor(this.data, "capBoost"));
  }

  level(id) {
    return this.data.facilities[id] || 0;
  }

  facilityTotal() {
    return facilities.reduce((sum, item) => sum + this.level(item.id), 0);
  }

  facility(id) {
    return facilities.find((item) => item.id === id);
  }

  staff(id) {
    return staffDefinitions.find((item) => item.id === id);
  }

  staffLevel(id) {
    return this.data.staff[id] || 0;
  }

  staffSkillActive(id) {
    const staff = this.staff(id);
    return Boolean(staff?.skill && this.staffLevel(id) >= staff.skill.unlockLevel);
  }

  staffCost(id) {
    const staff = this.staff(id);
    return Math.floor(staff.cost * 1.62 ** this.staffLevel(id));
  }

  staffExplainCost(id) {
    const staff = this.staff(id);
    return Math.floor(staff.explain * 1.24 ** this.staffLevel(id));
  }

  cost(id) {
    const item = this.facility(id);
    return Math.floor(item.cost * 1.48 ** this.level(id));
  }

  explainCost(id) {
    const item = this.facility(id);
    return Math.floor(item.explain * 1.18 ** this.level(id));
  }

  prestigeUpgradeLevel(id) {
    const upgrade = allPrestigeUpgrades.find((item) => item.id === id);
    const store = upgrade?.currency === "medal" ? this.data.prestige.medalUpgrades : this.data.prestige.upgrades;
    return store?.[id] || 0;
  }

  prestigeUpgradeCost(id) {
    const upgrade = allPrestigeUpgrades.find((item) => item.id === id);
    return Math.floor(upgrade.baseCost * (upgrade.costMul || 1.55) ** this.prestigeUpgradeLevel(id));
  }

  // 시작 표 = 감사 횟수 기반 + 유산(startVotesFlat) 평탄 가산. runs=0(첫 감사)에서도 유산이 즉시 도약을 준다.
  startingVotesFor(prestige) {
    const base = Math.floor(120 * (prestige.runs || 0) ** 1.28);
    const flat = medalUpgrades.reduce((sum, up) => sum + (prestige.medalUpgrades?.[up.id] || 0) * (up.effect.startVotesFlat || 0), 0);
    return base + flat;
  }

  stageTarget(area) {
    // 초반 가속: base/지수 완화로 1구역을 빠르게 클리어(후반은 지수로 난도 유지)
    return Math.floor(1100 * area ** 1.38);
  }
}
