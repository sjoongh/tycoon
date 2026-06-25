import Phaser from "phaser";
import { SAVE_KEY } from "../config.js";
import { facilities } from "../data/facilities.js";
import { prestigeUpgrades } from "../data/prestige.js";
import { questDefinitions } from "../data/quests.js";
import { staffDefinitions } from "../data/staff.js";
import { achievementDefinitions } from "../data/achievements.js";

const DAY_MS = 86400000;
const DAILY_STREAK_CAP = 7;
const TRUST_CRISIS = 20; // 이 미만이면 불신 위기(생산 페널티)
const TRUST_BONUS = 90; // 이 이상이면 신뢰 보너스(생산 서지)
const EVENT_COOLDOWN_MS = 45000; // 사건 대응 후 재대기 시간(스팸 방지 + 주기적 참여 비트)
const FACILITY_MILESTONES = [25, 50, 100]; // 시설 레벨 마일스톤: 도달 시 해당 시설 생산 ×2(영구, 누적). Lv25 미만은 영향 0 → 초반 곡선 보존

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
  },
  stats: {
    totalVotes: 0,
    totalClicks: 0,
    totalUpgrades: 0,
    totalEvents: 0,
    totalOfflineMs: 0,
  },
  achievements: {},
  quests: {},
  endless: 0,
  daily: { day: 0, streak: 0 },
  eventReadyAt: 0,
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
      stats: { ...fallbackState.stats, ...(parsed?.stats || {}) },
      stage: { ...fallbackState.stage, ...(parsed?.stage || {}) },
      prestige: { ...fallbackState.prestige, ...(parsed?.prestige || {}) },
      tutorial: { ...fallbackState.tutorial, ...(parsed?.tutorial || {}) },
      daily: { ...fallbackState.daily, ...(parsed?.daily || {}) },
    };
    data.daily.day = Math.max(0, Math.floor(Number(data.daily.day) || 0));
    data.daily.streak = Math.max(0, Math.floor(Number(data.daily.streak) || 0));

    data.votes = Math.max(0, Number(data.votes) || 0);
    data.explain = Math.max(0, Number(data.explain) || 0);
    data.trust = Phaser.Math.Clamp(Number(data.trust) || fallbackState.trust, 0, 100);
    data.days = Math.max(0, Number(data.days) || fallbackState.days);
    data.endless = Math.max(0, Math.floor(Number(data.endless) || 0));
    data.eventReadyAt = Math.max(0, Number(data.eventReadyAt) || 0);
    data.stage.area = Math.max(1, Number(data.stage.area) || 1);
    data.stage.target = this.stageTarget(data.stage.area);
    data.stage.progress = Phaser.Math.Clamp(Number(data.stage.progress) || 0, 0, data.stage.target);
    data.lastSavedAt = Number(data.lastSavedAt) || now;
    data.lastSeenAt = Number(data.lastSeenAt) || now;
    data.prestige.seals = Math.max(0, Number(data.prestige.seals) || 0);
    data.prestige.runs = Math.max(0, Number(data.prestige.runs) || 0);
    data.prestige.bestArea = Math.max(1, Number(data.prestige.bestArea) || 1);
    data.prestige.totalSeals = Math.max(0, Number(data.prestige.totalSeals) || 0);
    data.prestige.upgrades = { ...fallbackState.prestige.upgrades, ...(data.prestige.upgrades || {}) };
    prestigeUpgrades.forEach((upgrade) => {
      data.prestige.upgrades[upgrade.id] = Phaser.Math.Clamp(Number(data.prestige.upgrades[upgrade.id]) || 0, 0, upgrade.maxLevel);
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

  consumeOfflineReward() {
    const reward = this.offlineReward;
    this.offlineReward = null;
    return reward;
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
    const amount = this.clickPower();
    this.addVotes(amount);
    this.data.stats.totalClicks += 1;
    this.advanceTutorial("click");
    this.emit("ballots", { x, y, count: 6 });
    this.emit("float", { text: `+${amount}`, x, y: y - 26, color: "#ffc857" });
    this.checkProgression();
    this.emit("changed");
  }

  tick() {
    if (this.data.paused) return;
    this.addVotes(this.cps());
    this.data.explain += this.explainPerSecond();
    this.data.trust = Phaser.Math.Clamp(this.data.trust - this.trustDecay() + this.level("notice") * 0.035, 0, 100);
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
    return Math.min(50, this.stageTarget(this.data.stage.area) / this.stageTarget(1));
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
    this.data.eventReadyAt = Date.now() + EVENT_COOLDOWN_MS;
    this.advanceTutorial("event");
    this.addLog(`사건 대응: 믿음 ${Math.round(this.data.trust)}%`);
    this.emit("float", { text: "대응완료", x: 195, y: 540, color: "#89d98b" });
    this.checkProgression();
    this.emit("changed");
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
    const projectedSeal = 1 + (p.totalSeals + earned) * 0.025 + (p.runs + 1) * 0.05;
    return { earned, current, projected: projectedSeal * cpsFactor };
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

  canPrestige() {
    return this.data.stage.area >= 4 || this.facilityTotal() >= 55 || this.data.stage.completed >= 3;
  }

  prestigePreview() {
    if (!this.canPrestige()) return 0;
    const areaValue = Math.max(0, this.data.stage.area - 3) * 4;
    const facilityValue = Math.floor(this.facilityTotal() / 12);
    const eventValue = Math.floor(this.data.stats.totalEvents / 3);
    const base = Math.max(4, areaValue + facilityValue + eventValue);
    // 정밀 감사반: 인장 획득량 증가
    return Math.floor(base * (1 + this.permanentEffectFor(this.data, "sealPct")));
  }

  prestigeReset() {
    const earned = this.prestigePreview();
    if (earned <= 0) {
      this.emit("float", { text: "아직 감사불가", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }

    const kept = {
      prestige: {
        seals: this.data.prestige.seals + earned,
        runs: this.data.prestige.runs + 1,
        bestArea: Math.max(this.data.prestige.bestArea, this.data.stage.area),
        totalSeals: this.data.prestige.totalSeals + earned,
        upgrades: this.data.prestige.upgrades,
      },
      achievements: this.data.achievements,
      tutorial: this.data.tutorial, // 베테랑이 감사(프레스티지) 후 신규 오프닝/튜토리얼을 다시 보지 않도록 유지
    };

    this.data = this.normalize({
      ...structuredClone(fallbackState),
      ...kept,
      explain: fallbackState.explain + earned * 3,
      votes: this.startingVotesFor(kept.prestige),
      trust: Math.min(90, fallbackState.trust + kept.prestige.runs),
      log: [`감사 완료: 제도인장 +${earned}`, "개표국 재정비"],
    }, Date.now());
    // 상비 인력: 접수창구 시작 레벨 / 여론전: 시작 믿음 상향(감사 영구 업그레이드 효과)
    const startDesk = Math.round(this.permanentEffectFor(this.data, "startDesk"));
    if (startDesk > 0) this.data.facilities.desk = Math.max(this.data.facilities.desk, 1 + startDesk);
    const startTrust = this.permanentEffectFor(this.data, "startTrust");
    if (startTrust > 0) this.data.trust = Phaser.Math.Clamp(this.data.trust + startTrust, 0, 95);
    this.offlineReward = null;
    this.emit("float", { text: `제도인장 +${earned}`, x: 195, y: 190, color: "#bba2ff" });
    this.emit("changed");
    this.save(false);
    return true;
  }

  buyPrestigeUpgrade(id) {
    const upgrade = prestigeUpgrades.find((item) => item.id === id);
    if (!upgrade) return false;
    const level = this.prestigeUpgradeLevel(id);
    if (level >= upgrade.maxLevel) {
      this.emit("float", { text: "최대레벨", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }
    const cost = this.prestigeUpgradeCost(id);
    if (this.data.prestige.seals < cost) {
      this.emit("float", { text: "인장부족", x: 195, y: 720, color: "#ff8e8e" });
      return false;
    }
    this.data.prestige.seals -= cost;
    this.data.prestige.upgrades[id] = level + 1;
    this.addLog(`${upgrade.shortName} Lv.${level + 1}`);
    this.emit("float", { text: `${upgrade.shortName} 강화`, x: 195, y: 604, color: "#bba2ff" });
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
    const votes = Math.max(150, Math.round(this.cps() * 120)) * s;
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
    return this.cpsFor(this.data);
  }

  cpsFor(data) {
    const raw = facilities.reduce((sum, item) => {
      const lv = data.facilities[item.id] || 0;
      return sum + lv * item.cps * this.facilityMilestoneFactor(lv);
    }, 0);
    return raw * (0.9 + data.trust / 230) * this.trustModifier(data.trust) * this.staffMultiplierFor(data) * this.prestigeMultiplierFor(data) * (1 + this.permanentEffectFor(data, "cpsPct"));
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
    const base = 1 + staffDefinitions.reduce((sum, staff) => {
      const lv = data.staff?.[staff.id] || 0;
      let s = lv * (staff.cpsBonus || 0);
      // 데이터 구동 스킬: skill.cpsBonus가 정의된 직원은 언락 레벨 이상에서 추가 생산
      if (staff.skill?.cpsBonus && lv >= staff.skill.unlockLevel) s += lv * staff.skill.cpsBonus;
      return sum + s;
    }, 0);
    const engineerSkill = (data.staff?.engineer || 0) >= 4 ? (data.facilities?.server || 0) * 0.006 : 0;
    return base + engineerSkill;
  }

  prestigeMultiplierFor(data) {
    return 1 + (data.prestige?.totalSeals || 0) * 0.025 + (data.prestige?.runs || 0) * 0.05;
  }

  explainPerSecond() {
    return this.explainPerSecondFor(this.data);
  }

  explainPerSecondFor(data) {
    const raw = 0.55 + (data.facilities.notice || 0) * 0.2 + (data.facilities.server || 0) * 0.16 + (data.facilities.studio || 0) * 0.12;
    return raw * (1 + this.permanentEffectFor(data, "explainPct"));
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
    return Math.floor(raw * (1 + this.permanentEffectFor(this.data, "clickPct")));
  }

  trustDecay() {
    const reduction = staffDefinitions.reduce((sum, staff) => sum + this.staffLevel(staff.id) * (staff.trustBonus || 0), 0);
    return Math.max(0.015, 0.06 - reduction);
  }

  offlineRateFor(data) {
    return 0.72 * (1 + this.permanentEffectFor(data, "offlinePct"));
  }

  // 기록 보관소: 기본 8시간 + 레벨당 1시간
  offlineCapMsFor(data) {
    const hours = 8 + this.permanentEffectFor(data, "offlineHr");
    return hours * 3600000;
  }

  permanentEffectFor(data, key) {
    return prestigeUpgrades.reduce((sum, upgrade) => {
      const level = data.prestige?.upgrades?.[upgrade.id] || 0;
      return sum + level * (upgrade.effect[key] || 0);
    }, 0);
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
    return this.data.prestige.upgrades[id] || 0;
  }

  prestigeUpgradeCost(id) {
    const upgrade = prestigeUpgrades.find((item) => item.id === id);
    return Math.floor(upgrade.baseCost * 1.55 ** this.prestigeUpgradeLevel(id));
  }

  startingVotesFor(prestige) {
    return Math.floor(120 * (prestige.runs || 0) ** 1.28);
  }

  stageTarget(area) {
    // 초반 가속: base/지수 완화로 1구역을 빠르게 클리어(후반은 지수로 난도 유지)
    return Math.floor(1100 * area ** 1.38);
  }
}
