import { describe, it, expect } from "vitest";
import { vehicleTierFor, visitorCapForStage, freeQueueSlot, activeResidents, RESIDENT_MIN_LEVEL } from "./ambient.js";

describe("투표함 반입 차량", () => {
  it("시간당 득표 임계로 3단계가 바뀐다", () => {
    expect(vehicleTierFor(0).name).toBe("리어카");
    expect(vehicleTierFor(499_999).tier).toBe(1);
    expect(vehicleTierFor(500_000).name).toBe("1톤 트럭");
    expect(vehicleTierFor(10_000_000).name).toBe("호송차");
    expect(vehicleTierFor(1e15).tier).toBe(3);
  });
  it("다음 단계 정보를 준다(최고 단계는 null)", () => {
    expect(vehicleTierFor(10).next.perHour).toBe(500_000);
    expect(vehicleTierFor(2e7).next).toBeNull();
  });
  it("음수·NaN 은 첫 단계", () => {
    expect(vehicleTierFor(-5).tier).toBe(1);
    expect(vehicleTierFor(NaN).tier).toBe(1);
  });
});

describe("방문객 상한·대기 자리", () => {
  it("방 단계별 4/5/6/6명", () => {
    expect([0, 1, 2, 3, 9].map(visitorCapForStage)).toEqual([4, 5, 6, 6, 6]);
  });
  it("빈 자리 중 가장 앞 칸을 고르고, 가득 차면 -1", () => {
    expect(freeQueueSlot([], 4)).toBe(0);
    expect(freeQueueSlot([0, 2], 4)).toBe(1);
    expect(freeQueueSlot([1, 0, 2], 4)).toBe(3);
    expect(freeQueueSlot([0, 1, 2, 3], 4)).toBe(-1);
  });
});

describe("상주 NPC", () => {
  const lv = (m) => (id) => m[id] || 0;
  it("시설 티어 3(Lv.12) 이상이고 방에 자리가 있을 때만", () => {
    const all = () => true;
    expect(activeResidents(lv({ sorter: RESIDENT_MIN_LEVEL - 1 }), all)).toEqual([]);
    expect(activeResidents(lv({ sorter: 12, archive: 30, studio: 5 }), all).map((r) => r.key)).toEqual(["observer", "police"]);
  });
  it("5×5 방처럼 시설 자리가 없으면 제외", () => {
    const only = (id) => id === "sorter";
    expect(activeResidents(lv({ sorter: 12, archive: 12, studio: 12 }), only).map((r) => r.name)).toEqual(["참관인"]);
  });
});
