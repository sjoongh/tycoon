import { describe, expect, it } from "vitest";
import {
  OPERATION_FAMILIES,
  normalizeOperationPicks,
  operationById,
  operationChoices,
  operationDefinitions,
} from "./operations.js";

describe("operationChoices", () => {
  it("같은 감사/구역/선택 상태에는 같은 세 장을 반환한다", () => {
    const picks = { "manual-count": 2, "night-shift": 1 };
    expect(operationChoices(7, 2, picks)).toEqual(operationChoices(7, 2, picks));
  });

  it("현장·운영·대응 축을 한 장씩 중복 없이 제안한다", () => {
    const ids = operationChoices(4, 1, {});
    const definitions = ids.map(operationById);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(new Set(definitions.map((operation) => operation.family))).toEqual(new Set(Object.keys(OPERATION_FAMILIES)));
  });

  it("각 계열 네 장씩 총 12종의 작전을 제공한다", () => {
    expect(operationDefinitions).toHaveLength(12);
    Object.keys(OPERATION_FAMILIES).forEach((family) => {
      expect(operationDefinitions.filter((operation) => operation.family === family)).toHaveLength(4);
    });
  });
});

describe("normalizeOperationPicks", () => {
  it("손상된 레벨은 0~99 사이 정수로 복구한다", () => {
    const normalized = normalizeOperationPicks({
      "manual-count": -3,
      "night-shift": 4.8,
      paperwork: Infinity,
      unknown: 1000,
    });
    expect(normalized["manual-count"]).toBe(0);
    expect(normalized["night-shift"]).toBe(4);
    expect(normalized.paperwork).toBe(99);
    expect(normalized.unknown).toBeUndefined();
  });
});
