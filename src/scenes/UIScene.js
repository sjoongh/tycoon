import Phaser from "phaser";
import { facilities } from "../data/facilities.js";
import { officeEvents } from "../data/events.js";
import { prestigeUpgrades } from "../data/prestige.js";
import { rarityColors, staffDefinitions } from "../data/staff.js";
import { FloatTextPool } from "../pools/FloatTextPool.js";
import { shortNumber, textStyle } from "../utils/format.js";

const tabs = [
  ["facilities", "시설", "building"],
  ["crew", "직원", "people"],
  ["events", "사건", "bell"],
  ["goals", "목표", "chart"],
  ["prestige", "감사", "shield"],
];

const tutorialMessages = [
  "분류 버튼을 눌러 첫 표를 처리하세요.",
  "시설 탭에서 접수창구를 업그레이드하세요.",
  "직원 탭에서 첫 직원을 채용하세요.",
  "사건 탭에서 대응 카드를 확인하세요.",
  "진행률을 채운 뒤 지역완료를 누르세요.",
];

export class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.floatTexts = new FloatTextPool(this);
    this.eventOpen = false;
    this.nextEventAt = 16000;

    this.createHud();
    this.createPrimaryAction();
    this.createBottomShell();
    this.showOfflineReward();
    this.refresh();

    this.gameState.on("changed", this.refresh, this);
    this.gameState.on("saved", this.showSaved, this);
    this.events.once("shutdown", () => {
      this.gameState.off("changed", this.refresh, this);
      this.gameState.off("saved", this.showSaved, this);
    });
  }

  update(time, delta) {
    this.nextEventAt -= delta;
    if (!this.eventOpen && this.nextEventAt <= 0) this.openEvent();
  }

  createHud() {
    this.add.rectangle(195, 39, 376, 66, 0x171322, 0.96).setStrokeStyle(3, 0x4b3428);
    this.add.rectangle(195, 39, 360, 50, 0x241e34, 0.94).setStrokeStyle(2, 0x4b3428);
    this.add.text(24, 15, "믿어주세요 개표국", textStyle(18, "#fff4cf")).setOrigin(0, 0);
    this.stageText = this.add.text(24, 43, "", textStyle(11, "#ffc857")).setOrigin(0, 0);
    this.saveButton = this.add.text(342, 21, "저장", textStyle(12, "#fff4cf")).setInteractive({ useHandCursor: true });
    this.saveButton.on("pointerdown", () => this.gameState.save());

    this.voteText = this.resourceText(16, 80, "표", "#ffc857", 0x3a2e22);
    this.explainText = this.resourceText(139, 80, "해명", "#7fc8ff", 0x233342);
    this.trustText = this.resourceText(262, 80, "믿음", "#89d98b", 0x253a2c);

    this.progressBack = this.add.rectangle(195, 143, 350, 18, 0x171322).setStrokeStyle(3, 0x4b3428);
    this.progressFill = this.add.rectangle(21, 143, 0, 10, 0xffc857).setOrigin(0, 0.5);
    this.progressText = this.add.text(195, 164, "", textStyle(11, "#fff4cf")).setOrigin(0.5);
    this.tutorialBox = this.add.rectangle(195, 194, 346, 36, 0xfff9e8, 0.97).setStrokeStyle(3, 0x4b3428);
    this.tutorialText = this.add.text(195, 194, "", textStyle(12, "#4b3428")).setOrigin(0.5);
  }

  resourceText(x, y, label, color, fill) {
    this.add.rectangle(x + 52, y + 21, 104, 42, fill).setStrokeStyle(3, 0x4b3428);
    this.add.text(x + 10, y + 6, label, textStyle(10, "#fff4cf")).setOrigin(0, 0);
    const dot = this.add.circle(x + 18, y + 27, 5, Phaser.Display.Color.HexStringToColor(color).color);
    dot.setStrokeStyle(2, 0x4b3428);
    return this.add.text(x + 60, y + 24, "0", textStyle(14, "#fff9e8")).setOrigin(0.5);
  }

  createPrimaryAction() {
    this.add.rectangle(306, 580, 142, 64, 0x4b3428, 0.24);
    this.stamp = this.add.rectangle(306, 574, 136, 58, 0xff5f6d).setStrokeStyle(5, 0x4b3428).setInteractive({ useHandCursor: true });
    this.add.rectangle(306, 556, 104, 8, 0xfff9e8, 0.28);
    this.stampLabel = this.add.text(306, 574, "안심분류\n+1", textStyle(17, "#fff9e8")).setOrigin(0.5);
    this.stamp.on("pointerdown", () => this.gameState.processClick(306, 574));

    this.add.rectangle(84, 580, 124, 58, 0x4b3428, 0.18);
    this.stageButton = this.add.rectangle(84, 574, 118, 52, 0xbba2ff).setStrokeStyle(4, 0x4b3428).setInteractive({ useHandCursor: true });
    this.stageButtonLabel = this.add.text(84, 574, "지역완료", textStyle(14, "#271f36")).setOrigin(0.5);
    this.stageButton.on("pointerdown", () => this.gameState.advanceStage());
  }

  createBottomShell() {
    this.bottom = this.add.container(0, 620);
    this.bottom.add(this.add.rectangle(195, 112, 390, 224, 0x171322, 0.99).setStrokeStyle(5, 0x4b3428));
    this.bottom.add(this.add.rectangle(195, 194, 376, 48, 0x241e34, 0.99).setStrokeStyle(3, 0x4b3428));
    this.tabButtons = {};
    tabs.forEach(([id, label, icon], index) => {
      const x = 37 + index * 79;
      const box = this.add.rectangle(x, 194, 68, 38, 0x312a43).setStrokeStyle(2, 0x4b3428).setInteractive({ useHandCursor: true });
      const iconView = this.drawTabIcon(x, 187, icon, 0xfff4cf);
      const text = this.add.text(x, 204, label, textStyle(9, "#fff4cf")).setOrigin(0.5);
      box.on("pointerdown", () => this.gameState.setTab(id));
      this.bottom.add([box, iconView, text]);
      this.tabButtons[id] = { box, icon: iconView, text };
    });
    this.panel = this.add.container(0, 0);
    this.bottom.add(this.panel);
  }

  refresh() {
    const data = this.gameState.data;
    const stageRatio = data.stage.progress / data.stage.target;
    this.voteText.setText(shortNumber(data.votes));
    this.explainText.setText(shortNumber(data.explain));
    this.trustText.setText(`${Math.round(data.trust)}%`);
    this.stageText.setText(`${data.stage.area}구역 · D-${data.days} · 초당 ${this.gameState.cps().toFixed(1)}표 · 인장 ${data.prestige.seals}`);
    this.progressFill.width = 350 * Phaser.Math.Clamp(stageRatio, 0, 1);
    this.progressText.setText(`${shortNumber(data.stage.progress)} / ${shortNumber(data.stage.target)} 처리`);
    this.stampLabel.setText(`안심분류\n+${this.gameState.clickPower()}`);

    const complete = data.stage.progress >= data.stage.target;
    this.stageButton.setFillStyle(complete ? 0x89d98b : 0x5a516f);
    this.stageButtonLabel.setText(complete ? "지역완료" : `${Math.floor(stageRatio * 100)}%`);
    this.stageButtonLabel.setColor(complete ? "#271f36" : "#d8c9ff");
    this.stageButton.setAlpha(complete ? 1 : 0.72);
    this.stageButtonLabel.setAlpha(complete ? 1 : 0.86);
    this.tutorialBox.setVisible(!data.tutorial.done);
    this.tutorialText.setVisible(!data.tutorial.done);
    this.tutorialText.setText(tutorialMessages[data.tutorial.step] || "");

    tabs.forEach(([id]) => {
      const active = data.activeTab === id;
      this.tabButtons[id].box.setFillStyle(active ? 0xffc857 : 0x312a43);
      this.tabButtons[id].box.setScale(active ? 1.04 : 1);
      this.tabButtons[id].icon.setScale(active ? 1.08 : 1);
      this.tabButtons[id].text.setColor(active ? "#271f36" : "#fff4cf");
    });

    this.renderPanel();
  }

  drawTabIcon(x, y, type, color) {
    const icon = this.add.container(x, y);
    const stroke = 0x4b3428;
    if (type === "building") {
      icon.add(this.add.rectangle(0, 1, 18, 15, color).setStrokeStyle(2, stroke));
      icon.add(this.add.rectangle(0, -8, 14, 7, 0xffc857).setStrokeStyle(2, stroke));
      [-5, 0, 5].forEach((dx) => icon.add(this.add.rectangle(dx, 2, 3, 5, 0x241e34)));
    } else if (type === "people") {
      icon.add(this.add.circle(-5, -4, 5, color).setStrokeStyle(2, stroke));
      icon.add(this.add.circle(6, -3, 5, 0xff8e8e).setStrokeStyle(2, stroke));
      icon.add(this.add.rectangle(0, 6, 22, 10, color).setStrokeStyle(2, stroke));
    } else if (type === "bell") {
      icon.add(this.add.circle(0, 0, 10, 0xff8e8e).setStrokeStyle(2, stroke));
      icon.add(this.add.rectangle(0, 8, 18, 5, color).setStrokeStyle(2, stroke));
      icon.add(this.add.circle(0, 12, 3, 0xffc857));
    } else if (type === "chart") {
      [-7, 0, 7].forEach((dx, index) => {
        icon.add(this.add.rectangle(dx, 5 - index * 4, 5, 12 + index * 5, [0x7fc8ff, 0x89d98b, 0xffc857][index]).setStrokeStyle(2, stroke));
      });
    } else {
      icon.add(this.add.rectangle(0, 0, 18, 20, 0xbba2ff).setStrokeStyle(2, stroke));
      icon.add(this.add.circle(0, -2, 5, 0xfff4cf));
      icon.add(this.add.rectangle(0, 7, 10, 3, 0xfff4cf));
    }
    return icon;
  }

  renderPanel() {
    this.panel.removeAll(true);
    if (this.gameState.data.activeTab === "facilities") this.renderFacilities();
    if (this.gameState.data.activeTab === "crew") this.renderCrew();
    if (this.gameState.data.activeTab === "events") this.renderEvents();
    if (this.gameState.data.activeTab === "goals") this.renderGoals();
    if (this.gameState.data.activeTab === "prestige") this.renderPrestige();
  }

  renderFacilities() {
    const selected = this.gameState.facility(this.gameState.data.selected);
    const level = this.gameState.level(selected.id);
    const canBuy = this.gameState.data.votes >= this.gameState.cost(selected.id) && this.gameState.data.explain >= this.gameState.explainCost(selected.id);
    const missingVotes = Math.max(0, this.gameState.cost(selected.id) - this.gameState.data.votes);
    const missingExplain = Math.max(0, this.gameState.explainCost(selected.id) - this.gameState.data.explain);

    this.panel.add(this.add.rectangle(143, 104, 250, 118, 0x241e34).setStrokeStyle(3, 0x4b3428));
    this.panel.add(this.add.rectangle(143, 51, 250, 6, selected.color));
    this.panel.add(this.add.rectangle(33, 70, 42, 42, selected.color).setStrokeStyle(3, 0x4b3428));
    this.panel.add(this.add.text(64, 55, `${selected.name} Lv.${level}`, textStyle(16, "#fff4cf")));
    this.panel.add(this.add.text(64, 80, selected.desc, textStyle(11, "#d8c9ff")).setWordWrapWidth(200));
    this.panel.add(this.add.text(28, 122, selected.effect, textStyle(10, "#89d98b")).setWordWrapWidth(228));
    const costLine = canBuy
      ? `${shortNumber(this.gameState.cost(selected.id))}표 · 해명 ${this.gameState.explainCost(selected.id)}`
      : `부족 ${missingVotes ? `${shortNumber(missingVotes)}표 ` : ""}${missingExplain ? `해명 ${shortNumber(missingExplain)}` : ""}`;
    this.panel.add(this.add.text(28, 150, costLine, textStyle(12, canBuy ? "#ffc857" : "#ff8e8e")));

    const upgradeButton = this.add.rectangle(315, 105, 118, 82, canBuy ? 0x89d98b : 0x5a516f).setStrokeStyle(4, 0x4b3428).setInteractive({ useHandCursor: true });
    const upgradeLabel = this.add.text(315, 94, canBuy ? "업그레이드" : "자원부족", textStyle(14, canBuy ? "#271f36" : "#d8c9ff")).setOrigin(0.5);
    const gainLabel = this.add.text(315, 121, `+${selected.cps.toFixed(1)}/s`, textStyle(11, canBuy ? "#271f36" : "#d8c9ff")).setOrigin(0.5);
    upgradeButton.on("pointerdown", () => this.gameState.upgrade());
    this.panel.add([upgradeButton, upgradeLabel, gainLabel]);

    facilities.forEach((facility, index) => {
      const x = 24 + index * 57;
      const y = 174;
      const unlocked = this.gameState.isUnlocked(facility.id);
      const isSelected = facility.id === selected.id;
      const canUpgrade = unlocked && this.gameState.data.votes >= this.gameState.cost(facility.id) && this.gameState.data.explain >= this.gameState.explainCost(facility.id);
      const mini = this.add.rectangle(x + 22, y, 48, 28, isSelected ? facility.color : 0x312a43).setStrokeStyle(canUpgrade ? 3 : 2, canUpgrade ? 0x89d98b : 0x4b3428).setInteractive({ useHandCursor: true });
      const lv = this.add.text(x + 22, y - 5, unlocked ? `Lv.${this.gameState.level(facility.id)}` : `${facility.unlock}구`, textStyle(8, isSelected ? "#271f36" : "#fff4cf")).setOrigin(0.5);
      const mark = this.add.text(x + 22, y + 7, facility.role, textStyle(8, isSelected ? "#271f36" : "#d8c9ff")).setOrigin(0.5);
      mini.on("pointerdown", () => this.gameState.select(facility.id));
      this.panel.add([mini, lv, mark]);
    });
  }

  renderCrew() {
    this.panel.add(this.add.text(18, 51, "직원 카드", textStyle(16, "#fff4cf")));
    staffDefinitions.forEach((staff, index) => {
      const x = 18 + (index % 2) * 178;
      const y = 78 + Math.floor(index / 2) * 56;
      const level = this.gameState.staffLevel(staff.id);
      const canHire = this.gameState.data.votes >= this.gameState.staffCost(staff.id) && this.gameState.data.explain >= this.gameState.staffExplainCost(staff.id);
      const fill = canHire ? 0xfff9e8 : 0x312a43;
      const card = this.add.rectangle(x + 80, y + 19, 160, 50, fill).setStrokeStyle(3, rarityColors[staff.rarity]).setInteractive({ useHandCursor: true });
      const dot = this.add.rectangle(x + 16, y + 13, 18, 18, staff.color).setStrokeStyle(2, 0x4b3428);
      const title = this.add.text(x + 31, y + 2, `${staff.name}`, textStyle(10, canHire ? "#4b3428" : "#fff4cf"));
      const skill = this.gameState.staffSkillActive(staff.id) ? staff.skill.name : `스킬 Lv.${staff.skill.unlockLevel}`;
      const rarity = this.add.text(x + 31, y + 17, `${staff.rarityName} · ${skill}`, textStyle(8, canHire ? "#84624d" : "#d8c9ff"));
      const meta = this.add.text(x + 10, y + 32, `Lv.${level} · ${shortNumber(this.gameState.staffCost(staff.id))}표`, textStyle(9, canHire ? "#4b3428" : "#d8c9ff"));
      card.on("pointerdown", () => this.gameState.hireStaff(staff.id));
      this.panel.add([card, dot, title, rarity, meta]);
    });
    this.panel.add(this.add.text(198, 51, `생산 x${this.gameState.staffMultiplierFor(this.gameState.data).toFixed(2)}`, textStyle(11, "#89d98b")));
  }

  renderEvents() {
    this.panel.add(this.add.rectangle(143, 108, 250, 118, 0x241e34).setStrokeStyle(3, 0x4b3428));
    this.panel.add(this.add.text(18, 51, "사건 대응실", textStyle(16, "#fff4cf")));
    this.panel.add(this.add.text(26, 80, `다음 사건까지 ${Math.max(0, Math.ceil(this.nextEventAt / 1000))}초`, textStyle(12, "#ffc857")));
    this.panel.add(this.add.text(26, 104, `처리한 사건 ${this.gameState.data.stats.totalEvents}건`, textStyle(12, "#d8c9ff")));
    const latest = this.gameState.data.log.slice(0, 2);
    latest.forEach((item, index) => {
      this.panel.add(this.add.text(26, 130 + index * 17, item, textStyle(10, "#fff4cf")).setWordWrapWidth(220));
    });
    const button = this.add.rectangle(315, 112, 118, 72, 0x7fc8ff).setStrokeStyle(4, 0x4b3428).setInteractive({ useHandCursor: true });
    const label = this.add.text(315, 112, "사건확인", textStyle(14, "#271f36")).setOrigin(0.5);
    button.on("pointerdown", () => this.openEvent(true));
    this.panel.add([button, label]);
  }

  renderGoals() {
    const quest = this.gameState.nextQuest();
    this.panel.add(this.add.text(18, 51, "운영 목표", textStyle(16, "#fff4cf")));
    if (!quest) {
      this.panel.add(this.add.text(18, 82, "현재 목표를 모두 완료했습니다.", textStyle(13, "#89d98b")));
      return;
    }
    const progress = this.gameState.questProgress(quest);
    const ratio = Phaser.Math.Clamp(progress / quest.target, 0, 1);
    this.panel.add(this.add.rectangle(195, 112, 342, 106, 0x241e34).setStrokeStyle(3, 0x4b3428));
    this.panel.add(this.add.text(32, 76, quest.title, textStyle(14, "#ffc857")));
    this.panel.add(this.add.text(32, 100, quest.desc, textStyle(11, "#d8c9ff")));
    this.panel.add(this.add.rectangle(195, 138, 312, 14, 0x171322).setStrokeStyle(2, 0x4b3428));
    this.panel.add(this.add.rectangle(39, 138, 312 * ratio, 8, 0x89d98b).setOrigin(0, 0.5));
    this.panel.add(this.add.text(195, 160, `${shortNumber(progress)} / ${shortNumber(quest.target)}`, textStyle(10, "#fff4cf")).setOrigin(0.5));
  }

  renderPrestige() {
    const preview = this.gameState.prestigePreview();
    const canPrestige = preview > 0;
    this.panel.add(this.add.text(18, 51, "감사 재정비", textStyle(16, "#fff4cf")));
    this.panel.add(this.add.rectangle(112, 108, 188, 118, 0x241e34).setStrokeStyle(3, 0x4b3428));
    this.panel.add(this.add.text(26, 78, `제도인장 ${this.gameState.data.prestige.seals}`, textStyle(13, "#bba2ff")));
    this.panel.add(this.add.text(26, 100, `영구 생산 x${this.gameState.prestigeMultiplierFor(this.gameState.data).toFixed(2)}`, textStyle(11, "#89d98b")));
    this.panel.add(this.add.text(26, 121, `예상 획득 +${preview}`, textStyle(11, canPrestige ? "#ffc857" : "#ff8e8e")));

    prestigeUpgrades.forEach((upgrade, index) => {
      const x = 222 + (index % 2) * 78;
      const y = 65 + Math.floor(index / 2) * 50;
      const level = this.gameState.prestigeUpgradeLevel(upgrade.id);
      const cost = this.gameState.prestigeUpgradeCost(upgrade.id);
      const canBuy = this.gameState.data.prestige.seals >= cost && level < upgrade.maxLevel;
      const card = this.add.rectangle(x + 34, y + 18, 72, 42, canBuy ? 0xfff9e8 : 0x312a43).setStrokeStyle(2, 0xbba2ff).setInteractive({ useHandCursor: true });
      const name = this.add.text(x, y + 3, upgrade.shortName, textStyle(8, canBuy ? "#4b3428" : "#fff4cf"));
      const meta = this.add.text(x, y + 18, `Lv.${level} / ${cost}`, textStyle(8, canBuy ? "#84624d" : "#d8c9ff"));
      card.on("pointerdown", () => this.gameState.buyPrestigeUpgrade(upgrade.id));
      this.panel.add([card, name, meta]);
    });

    const button = this.add.rectangle(106, 158, 154, 34, canPrestige ? 0xbba2ff : 0x5a516f).setStrokeStyle(3, 0x4b3428).setInteractive({ useHandCursor: true });
    const label = this.add.text(106, 158, canPrestige ? "감사실행" : "조건부족", textStyle(12, canPrestige ? "#271f36" : "#d8c9ff")).setOrigin(0.5);
    button.on("pointerdown", () => this.gameState.prestigeReset());
    this.panel.add([button, label]);
  }

  openEvent(force = false) {
    if (this.eventOpen) return;
    const event = this.pickEvent();
    if (!event && !force) return;
    this.eventOpen = true;

    const panel = this.add.container(195, 424);
    panel.add(this.add.rectangle(0, 0, 390, 844, 0x000000, 0.34));
    panel.add(this.add.rectangle(0, 0, 348, 238, 0x4b3428, 0.2));
    panel.add(this.add.rectangle(0, -4, 348, 238, 0xfff9e8).setStrokeStyle(5, 0x4b3428));
    panel.add(this.add.rectangle(0, -112, 300, 8, 0xff5f6d));
    panel.add(this.add.text(0, -90, event.title, textStyle(20, "#4b3428")).setOrigin(0.5));
    panel.add(this.add.text(0, -58, event.body, textStyle(12, "#84624d")).setOrigin(0.5).setWordWrapWidth(284));
    const left = this.eventButton(panel, -82, 36, event.left);
    const right = this.eventButton(panel, 82, 36, event.right);
    panel.add([left.box, left.text, left.desc, right.box, right.text, right.desc]);
    this.tweens.add({ targets: panel, scale: { from: 0.92, to: 1 }, duration: 150 });
    this.eventPanel = panel;
  }

  pickEvent() {
    const available = officeEvents.filter((event) => this.gameState.data.stage.area >= (event.minStage || 1));
    const totalWeight = available.reduce((sum, event) => sum + (event.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    return available.find((event) => {
      roll -= event.weight || 1;
      return roll <= 0;
    }) || available[0];
  }

  eventButton(panel, x, y, choice) {
    const [label, effect, desc] = choice;
    const box = this.add.rectangle(x, y, 142, 60, 0xffc857).setStrokeStyle(3, 0x4b3428).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y - 8, label, textStyle(14, "#4b3428")).setOrigin(0.5);
    const descText = this.add.text(x, y + 48, desc, textStyle(10, "#84624d")).setOrigin(0.5, 0).setWordWrapWidth(132).setAlign("center");
    box.on("pointerdown", () => {
      this.gameState.applyEffect(effect);
      panel.destroy();
      this.eventOpen = false;
      this.nextEventAt = 22000;
    });
    return { box, text, desc: descText };
  }

  showOfflineReward() {
    const reward = this.gameState.consumeOfflineReward();
    if (!reward) return;
    const minutes = Math.max(1, Math.floor(reward.elapsed / 60000));
    const panel = this.add.container(195, 300);
    panel.add(this.add.rectangle(0, 0, 314, 124, 0xfff9e8).setStrokeStyle(5, 0x4b3428));
    panel.add(this.add.text(0, -38, "오프라인 정산", textStyle(19, "#4b3428")).setOrigin(0.5));
    panel.add(this.add.text(0, -8, `${minutes}분 동안`, textStyle(12, "#84624d")).setOrigin(0.5));
    panel.add(this.add.text(0, 20, `+${shortNumber(reward.votes)}표 · +${shortNumber(reward.explain)}해명`, textStyle(15, "#4b3428")).setOrigin(0.5));
    const close = this.add.rectangle(0, 58, 118, 30, 0x89d98b).setStrokeStyle(3, 0x4b3428).setInteractive({ useHandCursor: true });
    const label = this.add.text(0, 58, "확인", textStyle(13, "#271f36")).setOrigin(0.5);
    close.on("pointerdown", () => panel.destroy());
    panel.add([close, label]);
  }

  showSaved() {
    this.floatTexts.show("저장완료", 195, 190, "#89d98b");
  }
}
