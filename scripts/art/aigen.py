#!/usr/bin/env python3
"""gpt-image 생성/편집 러너 — 로컬 프록시(127.0.0.1:8317, Quotio CLIProxyAPI) 경유.
사용: python3 scripts/art/aigen.py jobs.json   (jobs: [{"chain":[{"out":..,"prompt":..,"ref":optional}]}, ...])
체인 안은 순차(앞 결과를 ref로 쓸 수 있음), 체인끼리는 병렬(기본 4)."""
import sys, json, base64, urllib.request, time, uuid, os, re
from concurrent.futures import ThreadPoolExecutor

BASE = os.environ.get("AIGEN_BASE", "http://127.0.0.1:8317/v1")
MODEL = os.environ.get("AIGEN_MODEL", "gpt-image-1.5")
QUALITY = os.environ.get("AIGEN_QUALITY", "medium")

def _key():
    k = os.environ.get("AIGEN_KEY")
    if k: return k
    cfg = os.path.expanduser("~/Library/Application Support/Quotio/config.yaml")
    m = re.search(r'api-keys:\s*\n\s*-\s*"?([^"\n]+)"?', open(cfg).read())
    return m.group(1).strip()

def _save(resp, out):
    img = json.loads(resp)["data"][0]
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    if "b64_json" in img: open(out, "wb").write(base64.b64decode(img["b64_json"]))
    else: urllib.request.urlretrieve(img["url"], out)

def generate(prompt, out, size="1024x1024"):
    body = {"model": MODEL, "prompt": prompt, "size": size, "n": 1, "background": "transparent", "output_format": "png", "quality": QUALITY}
    req = urllib.request.Request(f"{BASE}/images/generations", data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {_key()}", "Content-Type": "application/json"})
    _save(urllib.request.urlopen(req, timeout=900).read(), out)

def edit(prompt, ref, out, size="1024x1024"):
    b = uuid.uuid4().hex
    def part(name, val, filename=None, ctype=None):
        h = f'--{b}\r\nContent-Disposition: form-data; name="{name}"'
        if filename: h += f'; filename="{filename}"\r\nContent-Type: {ctype}'
        return h.encode() + b"\r\n\r\n" + (val if isinstance(val, bytes) else str(val).encode()) + b"\r\n"
    body = part("model", MODEL) + part("prompt", prompt) + part("size", size) + part("background", "transparent") + part("output_format", "png") + part("quality", QUALITY) \
        + part("image", open(ref, "rb").read(), os.path.basename(ref), "image/png") + f"--{b}--\r\n".encode()
    req = urllib.request.Request(f"{BASE}/images/edits", data=body, headers={"Authorization": f"Bearer {_key()}", "Content-Type": f"multipart/form-data; boundary={b}"})
    _save(urllib.request.urlopen(req, timeout=900).read(), out)

def run_step(s):
    if os.path.exists(s["out"]) and not s.get("force"): return f"skip {s['out']}"
    t = time.time()
    for attempt in range(3):
        try:
            if s.get("ref"): edit(s["prompt"], s["ref"], s["out"], s.get("size", "1024x1024"))
            else: generate(s["prompt"], s["out"], s.get("size", "1024x1024"))
            return f"ok {s['out']} {time.time()-t:.0f}s"
        except Exception as e:  # noqa
            err = getattr(e, "read", lambda: b"")()[:300]
            if attempt == 2: return f"FAIL {s['out']} {e} {err}"
            time.sleep(5)

def run_chain(chain):
    out = []
    for s in chain:
        r = run_step(s); out.append(r); print(r, flush=True)
        if r.startswith("FAIL"): break
    return out

if __name__ == "__main__":
    jobs = json.load(open(sys.argv[1]))
    par = int(os.environ.get("AIGEN_PAR", "4"))
    with ThreadPoolExecutor(par) as ex:
        list(ex.map(run_chain, [j["chain"] for j in jobs]))
