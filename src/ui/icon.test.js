import { describe, it, expect } from "vitest";
import { ICONS, ICON_SHEETS } from "../assets/iconAtlas.js";
import { iconStyle, iconHtml, facilityIcon, staffIcon, tabIcon, regionIcon, bossIcon } from "./icon.js";
import { facilities } from "../data/facilities.js";
import { staffDefinitions } from "../data/staff.js";
import { govTitles } from "../data/titles.js";
import { cosmetics } from "../data/cosmetics.js";
import { characters } from "../data/characters.js";
import { randomItems as items } from "../data/items.js";
import { regions, eraTheme } from "../data/regions.js";
import { checkpointBosses } from "../data/bosses.js";
import { operationDefinitions, OPERATION_FAMILIES, FEVER_FAMILY_PROFILES } from "../data/operations.js";

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;

describe("icon atlas", () => {
  it("every data icon field resolves to an atlas frame", () => {
    const names = [
      ...facilities.map((f) => facilityIcon(f.id)),
      ...staffDefinitions.map((s) => staffIcon(s.id)),
      ...["facilities", "crew", "events", "goals", "prestige"].flatMap((t) => [tabIcon(t), tabIcon(t, true)]),
      ...govTitles.map((t) => t.icon),
      ...cosmetics.map((c) => c.icon),
      ...characters.map((c) => c.icon),
      ...items.map((i) => i.icon),
      ...regions.map((r) => r.icon),
      ...[1, 4, 7, 10, 13, 16].map((a) => eraTheme(a).icon),
      ...checkpointBosses.map((b) => b.icon),
      ...checkpointBosses.map((b) => bossIcon(b.id)),
      ...operationDefinitions.map((o) => o.icon),
      ...Object.values(OPERATION_FAMILIES).map((f) => f.icon),
      ...Object.values(FEVER_FAMILY_PROFILES).map((f) => f.icon),
      regionIcon(1), regionIcon(99),
      "res-votes", "res-explain", "res-trust", "ui-gear", "ui-lock", "ui-trophy", "ui-medal", "ui-map", "ui-book",
      "ui-calendar", "ui-bell", "ui-flag", "ui-upgrade", "ui-dice", "ui-people", "ui-clipboard", "ui-spark", "ui-warning", "op-moon",
    ];
    const missing = names.filter((n) => !ICONS[n]);
    expect(missing).toEqual([]);
  });

  it("no data icon is an emoji", () => {
    const all = [...govTitles, ...cosmetics, ...characters, ...items, ...regions, ...checkpointBosses, ...operationDefinitions];
    for (const def of all) {
      expect(def.emoji, `${def.id || def.name} still has emoji field`).toBeUndefined();
      expect(EMOJI.test(def.icon || ""), `${def.id || def.name} icon is emoji`).toBe(false);
    }
  });

  it("iconStyle maps frame coordinates as percentages so CSS can resize freely", () => {
    const [cell, x, y] = ICONS["res-votes"];
    const sheet = ICON_SHEETS[cell];
    const cols = sheet.width / cell;
    const rows = sheet.height / cell;
    const css = iconStyle("res-votes", 48);
    expect(css).toContain("width:48px;height:48px");
    expect(css).toContain(`background-size:${cols * 100}% ${rows * 100}%`);
    expect(css).toContain(`background-position:${(x / cell) / (cols - 1) * 100}% ${(y / cell) / (rows - 1) * 100}%`);
  });

  it("iconHtml renders a placeholder for unknown names instead of throwing", () => {
    expect(iconHtml("nope")).toContain("gp-ic--missing");
    expect(iconHtml("res-trust")).toContain('data-icon="res-trust"');
  });
});
