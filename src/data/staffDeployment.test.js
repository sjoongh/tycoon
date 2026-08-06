import { describe, expect, it } from "vitest";
import {
  STAFF_SLOT_LIMIT,
  normalizeStaffSlots,
  staffDeploymentBonusFor,
  staffDeploymentEffectFor,
  staffDeploymentEffectText,
  staffRankForLevel,
} from "./staffDeployment.js";

describe("직원 직급", () => {
  it("Lv.5/10/15/20에서 다섯 단계 외형 직급으로 승급한다", () => {
    expect([0, 1, 4, 5, 9, 10, 14, 15, 19, 20].map((level) => staffRankForLevel(level).tier))
      .toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5]);
  });

  it("직원별 배치 보너스를 현재 직급에 맞춰 설명한다", () => {
    expect(staffDeploymentBonusFor("clerk", 10)).toBe(3);
    expect(staffDeploymentBonusFor("engineer", 20)).toBeCloseTo(0.15, 6);
    expect(staffDeploymentEffectText("auditor", 5)).toBe("사건 불신 방어 +12%");
  });
});

describe("직원 현장 슬롯", () => {
  it("미채용·중복·알 수 없는 직원과 네 번째 슬롯을 제거한다", () => {
    const staff = { clerk: 2, auditor: 0, runner: 5, engineer: 1, analyst: 2 };
    expect(normalizeStaffSlots(["clerk", "clerk", "auditor", "unknown", "runner", "engineer", "analyst"], staff))
      .toEqual(["clerk", "runner", "engineer"]);
    expect(STAFF_SLOT_LIMIT).toBe(3);
  });

  it("구 세이브는 채용 순서에서 최대 세 명을 자동 배치한다", () => {
    const staff = { clerk: 0, auditor: 2, runner: 1, engineer: 0, analyst: 3, speaker: 4 };
    expect(normalizeStaffSlots(undefined, staff, { autofill: true })).toEqual(["auditor", "runner", "analyst"]);
  });

  it("배치된 직원의 같은 효과 키만 합산한다", () => {
    const data = {
      staff: { clerk: 10, engineer: 20, analyst: 15 },
      staffSlots: ["clerk", "engineer", "analyst"],
    };
    expect(staffDeploymentEffectFor(data, "clickFlat")).toBe(3);
    expect(staffDeploymentEffectFor(data, "cpsPct")).toBeCloseTo(0.15, 6);
    expect(staffDeploymentEffectFor(data, "explainPct")).toBe(0);
  });
});
