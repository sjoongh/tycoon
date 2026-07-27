// 노드 테스트용 Phaser 최소 스텁 — GameState가 쓰는 표면(EventEmitter, Math.Clamp)만 제공.
// vitest.config.js의 alias("phaser" → 이 파일)로 주입되어 헤드리스로 GameState를 직접 테스트한다.
class EventEmitter {
  constructor() { this._l = new Map(); }
  on(ev, fn, ctx) { (this._l.get(ev) || this._l.set(ev, []).get(ev)).push([fn, ctx]); return this; }
  once(ev, fn, ctx) { return this.on(ev, fn, ctx); }
  off() { return this; }
  emit(ev, ...args) {
    (this._l.get(ev) || []).forEach(([fn, ctx]) => fn.call(ctx, ...args));
    return true;
  }
  removeAllListeners() { this._l.clear(); return this; }
}

export default {
  Events: { EventEmitter },
  Math: { Clamp: (v, min, max) => Math.min(max, Math.max(min, v)) },
};
