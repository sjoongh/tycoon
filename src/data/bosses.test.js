import { describe, expect, it } from "vitest";
import {
  BOSS_DURATION_MS,
  BOSS_REWARD_BONUS_PCT,
  bossForArea,
  bossRewardBonus,
  bossTargetFor,
  isCheckpointArea,
} from "./bosses.js";

describe("체크포인트 보스 데이터", () => {
  it("3구역 단위에서만 보스를 순환한다", () => {
    expect(isCheckpointArea(2)).toBe(false);
    expect(isCheckpointArea(3)).toBe(true);
    expect(bossForArea(3)).toMatchObject({ id: "district-inspection", area: 3, checkpoint: 1, cycle: 1 });
    expect(bossForArea(18)).toMatchObject({ id: "time-bureau", checkpoint: 6, cycle: 1 });
    expect(bossForArea(21)).toMatchObject({ id: "district-inspection", checkpoint: 7, cycle: 2 });
    expect(bossForArea(4)).toBeNull();
  });

  it("8초 비버프 생산과 기본 탭 12회분으로 목표를 만든다", () => {
    expect(BOSS_DURATION_MS).toBe(8000);
    expect(bossTargetFor({ cps: 10, clickPower: 5 })).toBe(140);
    expect(bossTargetFor({ cps: 0, clickPower: 0 })).toBe(40);
    expect(bossTargetFor({ cps: -10, clickPower: Number.NaN })).toBe(40);
  });

  it("성공 보너스는 기본 완료 표 보상의 35%를 내림한다", () => {
    expect(BOSS_REWARD_BONUS_PCT).toBe(0.35);
    expect(bossRewardBonus(1000)).toBe(350);
    expect(bossRewardBonus(999)).toBe(349);
    expect(bossRewardBonus(-1)).toBe(0);
  });
});
