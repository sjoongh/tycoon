import { Capacitor } from "@capacitor/core";

// 스크랩·결말 공유 카드 — 가상 신문 1면 이미지(1080×1350)를 만들어 기기 공유 시트로 보낸다.
// Android WebView 에는 Web Share 가 없어 네이티브는 Filesystem(캐시) + Share 플러그인, 웹은 navigator.share → 다운로드 순.
const W = 1080;
const H = 1350;
const PAPER = "#f3ead7";
const INK = "#2a211a";
const RED = "#a3242f";
const SOFT = "#6d5f50";

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const para of String(text).split("\n")) {
    let line = "";
    for (const ch of para) {
      const next = line + ch;
      if (line && ctx.measureText(next).width > maxWidth) {
        // 공백 앞에서 끊을 수 있으면 단어를 살린다
        const cut = line.lastIndexOf(" ");
        if (cut > line.length * 0.5) {
          lines.push(line.slice(0, cut));
          line = line.slice(cut + 1) + ch;
        } else {
          lines.push(line);
          line = ch;
        }
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function drawLines(ctx, lines, x, y, lh, max) {
  const shown = lines.slice(0, max);
  if (lines.length > max) shown[max - 1] = `${shown[max - 1].slice(0, -1)}…`;
  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return y + shown.length * lh;
}

function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

// card: { kicker, outlet, title, dateline, body?, photo? }
export async function renderShareCanvas(card) {
  try { await Promise.all([document.fonts.load('80px "Jua"'), document.fonts.load('40px "DoHyeon"')]); } catch { /* 시스템 글꼴로 대체 */ }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const bold = (px) => `${px}px "Jua", "DoHyeon", sans-serif`;
  const body = (px) => `${px}px "DoHyeon", "Jua", sans-serif`;
  const M = 80;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // 제호
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = bold(96);
  ctx.fillText("개표국 일보", W / 2, 170);
  ctx.fillRect(M, 200, W - M * 2, 6);
  ctx.fillRect(M, 214, W - M * 2, 2);
  ctx.font = body(34);
  ctx.fillStyle = SOFT;
  ctx.fillText(card.dateline, W / 2, 268);

  // 꼭지(특종/결말) + 매체
  ctx.textAlign = "left";
  ctx.font = bold(40);
  const kw = ctx.measureText(card.kicker).width + 44;
  ctx.fillStyle = RED;
  ctx.fillRect(M, 320, kw, 66);
  ctx.fillStyle = "#fff";
  ctx.fillText(card.kicker, M + 22, 368);
  ctx.fillStyle = SOFT;
  ctx.font = body(38);
  ctx.fillText(card.outlet, M + kw + 24, 366);

  // 헤드라인
  ctx.fillStyle = INK;
  ctx.font = bold(84);
  let y = drawLines(ctx, wrapLines(ctx, card.title, W - M * 2), M, 510, 108, 4);

  if (card.body) {
    y += 20;
    ctx.fillStyle = INK;
    ctx.fillRect(M, y, W - M * 2, 3);
    ctx.font = body(42);
    ctx.fillStyle = "#3d3127";
    y = drawLines(ctx, wrapLines(ctx, card.body, W - M * 2), M, y + 80, 64, 6);
  }
  // 남는 자리에 국장 사진(현재 성장 단계)
  const room = H - 200 - (y + 30);
  const img = card.photo && room >= 260 ? await loadImage(card.photo) : null;
  if (img) {
    const boxH = Math.min(room, 520);
    const boxY = y + 30 + (room - boxH) / 2;
    ctx.fillStyle = "#e3d6bd";
    ctx.fillRect(M, boxY, W - M * 2, boxH);
    ctx.strokeStyle = "#b9a888";
    ctx.lineWidth = 3;
    ctx.strokeRect(M, boxY, W - M * 2, boxH);
    const ih = boxH - 40;
    const iw = (img.width / img.height) * ih;
    ctx.drawImage(img, (W - iw) / 2, boxY + 20, iw, ih);
  }

  // 하단
  ctx.fillStyle = INK;
  ctx.fillRect(M, H - 170, W - M * 2, 3);
  ctx.textAlign = "center";
  ctx.font = bold(46);
  ctx.fillText("믿어주세요 개표국", W / 2, H - 100);
  ctx.font = body(28);
  ctx.fillStyle = SOFT;
  ctx.fillText("창작 픽션 · 실존 기관·인물·단체와 무관", W / 2, H - 58);
  return c;
}

const toBlob = (canvas) => new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png"));

// 결과: "shared" | "saved" | "cancelled" | "failed"
export async function shareCard(card) {
  const canvas = await renderShareCanvas(card);
  const name = `gaepyo-${Date.now()}.png`;
  const text = `${card.outlet} — ${card.title}`;
  try {
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
      const data = canvas.toDataURL("image/png").split(",")[1];
      const file = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
      await Share.share({ title: "믿어주세요 개표국", text, files: [file.uri], dialogTitle: "공유" });
      return "shared";
    }
    const blob = await toBlob(canvas);
    const file = new File([blob], name, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "믿어주세요 개표국", text });
      return "shared";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "saved";
  } catch (err) {
    // 사용자가 공유 시트를 닫은 경우는 실패로 보지 않는다
    const msg = String(err?.message || err);
    if (err?.name === "AbortError" || /cancel/i.test(msg)) return "cancelled";
    console.warn("[share]", err);
    return "failed";
  }
}
