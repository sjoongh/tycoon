// 배경음 곡 데이터 — 시대(regions.eraTheme)마다 다른 곡(AdVenture Capitalist 행성별 BGM, Egg Inc 패턴).
// 외부 음원 없이 bgm.js 가 이 악보를 Web Audio 로 연주한다. 순수 데이터·함수만 두어 node 테스트가 가능하다.
// 화음: bass = 베이스 MIDI, v = 건반 보이싱(MIDI). 한 마디 = 16분음표 16칸.

export const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

// 재현 가능한 난수(같은 곡은 매번 같은 선율 — 반복 청취 시 익숙해지도록)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const C = (bass, v) => ({ bass, v });

export const SONGS = {
  // 1~3구역: 첫인상 곡. 밝은 로파이(F장조 I–vi–ii–V), 일렉 피아노 + 마림바 선율
  force: {
    bpm: 90, swing: 0.14, seed: 11, lead: "marimba", comp: "lofi", bass: "lofi", drums: "lofi", range: [65, 81],
    scale: [0, 2, 4, 5, 7, 9, 11], tonic: 5,
    sections: {
      A: [C(41, [57, 60, 64, 67]), C(38, [53, 57, 60, 64]), C(43, [53, 57, 58, 62]), C(36, [52, 55, 58, 62])],
      B: [C(46, [57, 60, 62, 65]), C(45, [55, 60, 64, 67]), C(43, [53, 57, 58, 62]), C(36, [53, 55, 58, 62])],
    },
    form: ["A", "A", "B", "A"],
  },
  // 4~6구역: 살짝 수상한 단조(A단조), 뮤직박스 벨
  red: {
    bpm: 84, swing: 0.1, seed: 23, lead: "bell", comp: "lofi", bass: "lofi", drums: "lofi", range: [64, 81],
    scale: [0, 2, 3, 5, 7, 8, 10], tonic: 9,
    sections: {
      A: [C(45, [55, 59, 60, 64]), C(41, [57, 60, 64, 67]), C(38, [53, 57, 60, 64]), C(40, [56, 59, 62, 65])],
      B: [C(48, [55, 59, 64, 67]), C(43, [55, 59, 62, 65]), C(45, [55, 60, 64, 67]), C(40, [56, 59, 62, 64])],
    },
    form: ["A", "A", "B", "A"],
  },
  // 7~9구역: 민주 시대 — 경쾌한 보사노바(G장조)
  demo: {
    bpm: 104, swing: 0, seed: 37, lead: "flute", comp: "bossa", bass: "bossa", drums: "bossa", range: [67, 83],
    scale: [0, 2, 4, 5, 7, 9, 11], tonic: 7,
    sections: {
      A: [C(43, [54, 59, 62, 66]), C(40, [55, 59, 62, 66]), C(45, [55, 60, 64, 67]), C(38, [54, 57, 60, 64])],
      B: [C(48, [55, 59, 64, 66]), C(47, [57, 62, 64, 67]), C(45, [55, 60, 64, 67]), C(38, [54, 57, 60, 62])],
    },
    form: ["A", "B", "A", "B"],
  },
  // 10~12구역: 미래 시대 — 16분 아르페지오 신스팝(E♭장조)
  future: {
    bpm: 108, swing: 0, seed: 41, lead: "synth", comp: "arp", bass: "pulse", drums: "electro", range: [67, 82],
    scale: [0, 2, 4, 5, 7, 9, 11], tonic: 3,
    sections: {
      A: [C(39, [55, 58, 62, 65]), C(36, [55, 58, 62, 63]), C(44, [55, 60, 63, 67]), C(46, [55, 58, 62, 65])],
      B: [C(41, [56, 60, 63, 65]), C(43, [55, 58, 62, 65]), C(44, [55, 60, 63, 67]), C(46, [53, 58, 62, 65])],
    },
    form: ["A", "A", "B", "B"],
  },
  // 13~15구역: 우주 시대 — 느린 앰비언트(C 리디안), 패드 + 드문 벨
  space: {
    bpm: 72, swing: 0, seed: 53, lead: "bell", comp: "pad", bass: "long", drums: "shaker", range: [72, 88], sparse: true,
    scale: [0, 2, 4, 6, 7, 9, 11], tonic: 0,
    sections: {
      A: [C(36, [52, 55, 59, 62]), C(38, [54, 57, 62, 64]), C(45, [55, 59, 60, 64]), C(41, [55, 57, 59, 64])],
      B: [C(40, [55, 59, 62, 64]), C(41, [57, 60, 64, 67]), C(43, [55, 59, 62, 66]), C(36, [55, 59, 62, 64])],
    },
    form: ["A", "B"],
  },
  // 16구역~: 신화 시대 — 하프 아르페지오(D장조)
  myth: {
    bpm: 84, swing: 0.08, seed: 67, lead: "flute", comp: "harp", bass: "long", drums: "soft", range: [69, 86],
    scale: [0, 2, 4, 6, 7, 9, 11], tonic: 2,
    sections: {
      A: [C(38, [54, 57, 61, 64]), C(47, [54, 57, 62, 66]), C(43, [54, 59, 62, 66]), C(45, [52, 57, 61, 64])],
      B: [C(43, [54, 57, 59, 62]), C(45, [55, 57, 61, 64]), C(47, [54, 57, 62, 66]), C(45, [55, 57, 59, 64])],
    },
    form: ["A", "A", "B", "A"],
  },
};

export const ERA_KEYS = Object.keys(SONGS);

// 선율 리듬 틀: [시작 칸, 길이]. 마지막 틀은 프레이즈 끝(긴 음으로 쉼).
const RHYTHMS = [
  [[0, 3], [3, 3], [6, 2], [8, 6]],
  [[2, 2], [4, 2], [6, 4], [10, 2], [12, 4]],
  [[0, 6], [8, 2], [10, 2], [12, 4]],
  [[4, 2], [6, 2], [8, 8]],
  [[0, 2], [2, 2], [4, 4], [10, 6]],
];
const ENDING = [[0, 4], [4, 4], [8, 8]];
const SPARSE = [[[0, 12]], [[4, 12]], [[0, 6], [8, 8]]];

const pc = (m) => ((m % 12) + 12) % 12;

// 화음 구성음(베이스 포함)을 선율 음역에 펼친 후보
function chordTones(chord, [lo, hi]) {
  const pcs = new Set([pc(chord.bass), ...chord.v.map(pc)]);
  const out = [];
  for (let m = lo; m <= hi; m += 1) if (pcs.has(pc(m))) out.push(m);
  return out;
}

function scaleTones(song) {
  const [lo, hi] = song.range;
  const pcs = new Set(song.scale.map((s) => (s + song.tonic) % 12));
  const out = [];
  for (let m = lo; m <= hi; m += 1) if (pcs.has(pc(m))) out.push(m);
  return out;
}

// 한 섹션(4마디)의 선율: [{bar, step, len, midi}] — 이전 음에서 가까운 화음음으로 움직이고 약박엔 음계 경과음을 섞는다.
export function sectionMelody(song, name) {
  const chords = song.sections[name];
  const rand = rng(song.seed * 31 + name.charCodeAt(0));
  const scale = scaleTones(song);
  const notes = [];
  let prev = Math.round((song.range[0] + song.range[1]) / 2);
  chords.forEach((chord, bar) => {
    const last = bar === chords.length - 1;
    const pool = song.sparse ? SPARSE : RHYTHMS;
    const rhythm = last && !song.sparse ? ENDING : pool[Math.floor(rand() * pool.length)];
    const tones = chordTones(chord, song.range);
    rhythm.forEach(([step, len], k) => {
      const strong = step % 4 === 0;
      let cand = strong || rand() < 0.6 ? tones : scale;
      if (last && k === rhythm.length - 1) {
        // 프레이즈 끝은 화음 근음/3음으로 안착
        const rootPcs = [pc(chord.bass), pc(chord.v[0])];
        cand = tones.filter((m) => rootPcs.includes(pc(m)));
        if (!cand.length) cand = tones;
      }
      const leap = rand() < 0.2 ? 5 : 2.5;
      const near = cand.filter((m) => Math.abs(m - prev) <= leap && m !== prev);
      const choices = near.length ? near : cand;
      const midi = choices[Math.floor(rand() * choices.length)];
      notes.push({ bar, step, len, midi });
      prev = midi;
    });
  });
  return notes;
}

// 곡 전체 악보(마디 배열). 각 마디: { chord, melody: [{step,len,midi}] }
export function arrange(song) {
  const mel = {};
  Object.keys(song.sections).forEach((name) => { mel[name] = sectionMelody(song, name); });
  const bars = [];
  song.form.forEach((name) => {
    song.sections[name].forEach((chord, b) => {
      bars.push({ section: name, chord, melody: mel[name].filter((n) => n.bar === b) });
    });
  });
  return bars;
}

// 반주 패턴: [칸, 길이, 세기]
export const COMP = {
  lofi: [[0, 6, 0.8], [6, 2, 0.45], [10, 6, 0.6]],
  bossa: [[0, 2, 0.7], [3, 2, 0.5], [6, 2, 0.6], [10, 2, 0.55], [12, 2, 0.5]],
};
// 베이스 패턴: [칸, 길이, 음(0=근음, 7=5도, 12=옥타브)]
export const BASS = {
  lofi: [[0, 6, 0], [6, 2, 7], [8, 5, 0], [14, 2, 12]],
  bossa: [[0, 4, 0], [6, 2, 7], [8, 4, 0], [14, 2, 7]],
  pulse: [[0, 2, 0], [2, 2, 0], [4, 2, 12], [6, 2, 0], [8, 2, 0], [10, 2, 0], [12, 2, 12], [14, 2, 7]],
  long: [[0, 16, 0]],
};
// 드럼: kick/rim/hat 칸 + 셰이커 세기
export const DRUMS = {
  lofi: { kick: [0, 7, 10], rim: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatVel: 0.5 },
  bossa: { kick: [0, 6, 8, 14], rim: [3, 6, 10, 13], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatVel: 0.32 },
  electro: { kick: [0, 4, 8, 12], rim: [4, 12], hat: [2, 6, 10, 14], hatVel: 0.55 },
  shaker: { kick: [], rim: [], hat: [4, 12], hatVel: 0.35 },
  soft: { kick: [0, 8], rim: [], hat: [4, 12], hatVel: 0.35 },
};
