// config/volume-curve.json
var volume_curve_default = {
  version: "ppt16-measured-2026-11-11",
  description: "Measured with the Volume Fix calibration deck and a WASAPI loopback recording on Office 365 PowerPoint 16.0.20527: PowerPoint's per-clip vol is linear amplitude, dB = 20*log10(vol/100000). All 17 steps from 100% to 1% matched the formula to within 0.01 dB, and the drift check was 0.000 dB.",
  powerpoint: "Office 365 PowerPoint 16.0.20527 (Windows 11)",
  type: "amplitude",
  measuredAt: "2026-11-11",
  measuredPoints: [[1e3, -40], [2e3, -33.98], [3e3, -30.46], [5e3, -26.02], [7e3, -23.1], [1e4, -20], [15e3, -16.48], [2e4, -13.98], [25e3, -12.04], [3e4, -10.46], [4e4, -7.96], [5e4, -6.02], [6e4, -4.44], [7e4, -3.1], [8e4, -1.94], [9e4, -0.92], [1e5, 0]]
};

// src/core/volume-curve.js
var VOL_MAX = 1e5;
var VOL_MIN = 1;
function validateCurve(curve2) {
  if (!curve2 || typeof curve2.version !== "string") throw new Error("volume curve: missing version");
  if (curve2.type === "amplitude") return curve2;
  if (curve2.type !== "table") throw new Error(`volume curve: unknown type ${curve2.type}`);
  const pts = [...curve2.points].sort((a, b) => a[0] - b[0]);
  if (pts.length < 2) throw new Error("volume curve: need at least 2 points");
  for (let i2 = 0; i2 < pts.length; i2++) {
    const [v, db] = pts[i2];
    if (!(v > 0 && v <= VOL_MAX) || !Number.isFinite(db)) throw new Error(`volume curve: bad point ${pts[i2]}`);
    if (i2 && !(v > pts[i2 - 1][0] && db > pts[i2 - 1][1])) throw new Error("volume curve: points must be strictly increasing in vol and dB");
  }
  if (pts[pts.length - 1][0] !== VOL_MAX || pts[pts.length - 1][1] !== 0) throw new Error("volume curve: last point must be [100000, 0]");
  return { ...curve2, points: pts };
}
function interp(x2, xs, ys) {
  let i2 = 1;
  while (i2 < xs.length - 1 && x2 > xs[i2]) i2++;
  const t = (x2 - xs[i2 - 1]) / (xs[i2] - xs[i2 - 1]);
  return ys[i2 - 1] + t * (ys[i2] - ys[i2 - 1]);
}
function volToDb(vol, curve2) {
  if (!(vol > 0)) return -Infinity;
  if (curve2.type === "amplitude") return 20 * Math.log10(vol / VOL_MAX);
  const xs = curve2.points.map((p) => Math.log10(p[0]));
  const ys = curve2.points.map((p) => p[1]);
  return interp(Math.log10(vol), xs, ys);
}
function dbToVol(db, curve2) {
  if (db === -Infinity) return 0;
  if (curve2.type === "amplitude") return VOL_MAX * Math.pow(10, db / 20);
  const xs = curve2.points.map((p) => p[1]);
  const ys = curve2.points.map((p) => Math.log10(p[0]));
  return Math.pow(10, interp(db, xs, ys));
}
function beyondCurve(db, curve2) {
  return curve2.type === "table" && db < curve2.points[0][1];
}

// src/ui/curve-store.js
var KEY = "volume-fix:curve";
var DEFAULT_CURVE = validateCurve(volume_curve_default);
function loadCurve() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { curve: validateCurve(JSON.parse(raw)), measured: true };
  } catch {
  }
  return { curve: DEFAULT_CURVE, measured: false };
}

// src/core/xml.js
var NS = {
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  p14: "http://schemas.microsoft.com/office/powerpoint/2010/main",
  mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships"
};

// src/core/pptx.js
var P = NS.p;
var A = NS.a;
var R = NS.r;
var P14 = NS.p14;
var MC = NS.mc;
var STATUS = {
  OK: "ok",
  LINKED: "skipped-linked",
  MUTED: "skipped-muted",
  VOL0: "skipped-vol0",
  NO_TIMING: "no-timing-node",
  MISSING_MEDIA: "missing-media"
};
function clipKey(c) {
  const where = c.container === "slide" && c.slideNumber != null ? `slide${c.slideNumber}` : c.partName;
  return `${c.fileName}|${where}|${c.instance}`;
}

// src/core/gain.js
var DEFAULTS = {
  keepOriginalVolume: false,
  warnAttenuationDb: 15,
  /** An opted-out clip this far from the anchor level gets a warning. */
  optOutWarnDb: 1
};
function planGains(items, opts) {
  const o = { ...DEFAULTS, ...opts };
  if (!o.curve) throw new Error("planGains: curve required");
  const eligible = (it) => it.status === "ok" && !it.optOut && !it.silent && Number.isFinite(it.loudness);
  const pool = items.filter(eligible);
  const lref = pool.length ? Math.min(...pool.map((it) => it.loudness)) : null;
  const loudest = pool.length ? Math.max(...pool.map((it) => it.loudness)) : null;
  const out = items.map((it) => {
    const base = { key: it.key, oldVol: it.vol, loudness: it.loudness, newVol: null, gainDb: null, change: false, warnings: [] };
    if (!eligible(it)) {
      let role = "skipped";
      let reason = it.status;
      if (it.status === "ok" && it.optOut) {
        role = "opted-out";
        reason = "opted-out";
      } else if (it.status === "ok" && (it.silent || !Number.isFinite(it.loudness))) reason = "silent";
      const r = { ...base, role, reason };
      if (role === "opted-out" && lref != null && Number.isFinite(it.loudness) && it.vol > 0) {
        r.levelVsAnchorDb = it.loudness + volToDb(it.vol, o.curve) - lref;
        if (r.levelVsAnchorDb < -o.optOutWarnDb) r.warnings.push("will-play-quiet");
        if (r.levelVsAnchorDb > o.optOutWarnDb) r.warnings.push("will-play-loud");
      }
      return r;
    }
    let gainDb = lref - it.loudness;
    if (o.keepOriginalVolume && it.vol > 0) gainDb += volToDb(it.vol, o.curve);
    const raw = dbToVol(gainDb, o.curve);
    const warnings = [];
    let newVol = Math.round(raw);
    if (newVol < VOL_MIN) {
      newVol = VOL_MIN;
      warnings.push("clamped-to-min-vol");
    }
    if (newVol > VOL_MAX) {
      newVol = VOL_MAX;
      warnings.push("clamped-to-max-vol");
    }
    if (-(lref - it.loudness) > o.warnAttenuationDb) warnings.push("large-attenuation");
    if (beyondCurve(gainDb, o.curve)) warnings.push("beyond-measured-curve");
    return {
      ...base,
      role: it.loudness === lref ? "anchor" : "normalised",
      reason: null,
      gainDb,
      newVol,
      // Quantisation/clamping error of the written value, in dB.
      errorDb: volToDb(newVol, o.curve) - gainDb,
      change: newVol !== it.vol || it.volExplicit === false,
      warnings
    };
  });
  return {
    lref,
    spreadDb: lref == null ? null : loudest - lref,
    eligibleCount: pool.length,
    anchorKeys: out.filter((r) => r.role === "anchor").map((r) => r.key),
    options: { keepOriginalVolume: o.keepOriginalVolume, warnAttenuationDb: o.warnAttenuationDb, curveVersion: o.curve.version },
    items: out
  };
}

// src/ui/batch.js
var DEFAULT_OPTIONS = {
  keepOriginalVolume: false,
  warnAttenuationDb: 15,
  copyUnchanged: false,
  verify: true,
  toneDeck: true,
  toneSeconds: 30,
  excerpts: true
};
var UNSAFE = /[<>:"/\\|?*\u0000-\u001f]/g;
function deckFolderName(fileName) {
  return fileName.replace(/\.pptx$/i, "").replace(UNSAFE, "_").replace(/[. ]+$/, "") || "presentation";
}
function clipMediaName(clip) {
  const ext = (clip.mediaPart?.match(/\.[^./]+$/)?.[0] ?? "").toLowerCase();
  const where = clip.container === "slide" && clip.slideNumber != null ? `slide${clip.slideNumber}` : clip.partName.split("/").pop().replace(/\.xml$/i, "");
  return `${where}-clip${clip.instance}${ext}`;
}
function hasEmbeddedMedia(clip) {
  return !!clip.mediaPart && clip.status !== "skipped-linked" && clip.status !== "missing-media";
}
function playoutGainsText(plan, { date = /* @__PURE__ */ new Date() } = {}) {
  const fmt2 = (x2) => Math.abs(x2) < 0.05 ? "0.0" : (x2 > 0 ? "+" : "") + x2.toFixed(1);
  const lines = [
    "Volume Fix - playback gains for the extracted media files",
    `Made ${date.toLocaleString()}`,
    ""
  ];
  if (plan.lref == null) {
    lines.push("No clip has been measured yet, so there are no gains to suggest.");
    return lines.join("\r\n") + "\r\n";
  }
  const anchor = plan.rows.find((r) => r.plan?.role === "anchor");
  lines.push(
    `Reference: ${plan.lref.toFixed(1)} LUFS, the quietest clip, set to 0.0 dB.`,
    "Apply each gain in your playout software so every clip plays at the same loudness.",
    "Then align your desk to the reference tone deck, or to the first clip.",
    ""
  );
  const rows = plan.rows.filter((r) => hasEmbeddedMedia(r.clip)).map((r) => {
    const path2 = `${deckFolderName(r.deck)}\\${clipMediaName(r.clip)}`;
    let gain = "", note = "";
    if (Number.isFinite(r.loudness) && !r.silent) {
      gain = fmt2(plan.lref - r.loudness);
      if (r.plan?.role === "anchor" || r.key === anchor?.key) note = "reference";
      else if (r.plan?.role === "opted-out") note = "not normalised in the presentation";
    } else if (r.status === "no-audio-track") note = "no audio";
    else if (r.silent) note = "silent";
    else if (r.status === "pending") note = "not measured yet";
    else note = r.status;
    return { gain, path: path2, lufs: Number.isFinite(r.loudness) ? r.loudness.toFixed(1) : "", note };
  });
  const w = Math.max(4, ...rows.map((r) => r.path.length));
  lines.push(`${"Gain dB".padStart(7)}  ${"File".padEnd(w)}  ${"LUFS".padStart(6)}  Note`);
  lines.push(`${"-".repeat(7)}  ${"-".repeat(w)}  ${"-".repeat(6)}  ----`);
  for (const r of rows) lines.push(`${r.gain.padStart(7)}  ${r.path.padEnd(w)}  ${r.lufs.padStart(6)}  ${r.note}`.trimEnd());
  return lines.join("\r\n") + "\r\n";
}
function outputName(fileName) {
  return fileName.replace(/\.pptx$/i, "") + "_normalized.pptx";
}
var Batch = class {
  constructor({ curve: curve2, options = {} } = {}) {
    if (!curve2) throw new Error("Batch needs a volume curve");
    this.curve = curve2;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.decks = /* @__PURE__ */ new Map();
    this.optOut = /* @__PURE__ */ new Set();
  }
  /**
   * Add a deck. Returns false (and adds nothing) if a deck with the same file
   * name is already in the batch: names must be unique because outputs and
   * clip keys are derived from them.
   */
  addDeck({ name, size, file, handle = null }) {
    if (this.decks.has(name)) return false;
    this.decks.set(name, { name, size, file, handle, status: "queued", error: null, inventory: null, results: /* @__PURE__ */ new Map(), progress: null, write: null });
    return true;
  }
  removeDeck(name) {
    this.decks.delete(name);
  }
  get analysing() {
    return [...this.decks.values()].some((d) => d.status === "queued" || d.status === "analysing");
  }
  get ready() {
    return this.decks.size > 0 && !this.analysing;
  }
  /** Decks sorted by name: this order defines the numeric clip ids. */
  sortedDecks() {
    return [...this.decks.values()].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  }
  /**
   * One row per media clip across the batch, in id order.
   * status: reader status, or 'pending' while unmeasured, or the measurement status.
   */
  items() {
    const rows = [];
    for (const d of this.sortedDecks()) {
      if (!d.inventory) continue;
      for (const c of d.inventory.clips) {
        const key = clipKey(c);
        const m = d.results.get(key) ?? null;
        let status = c.status;
        if (status === STATUS.OK) status = m ? m.status : d.status === "error" ? "decode-failed" : "pending";
        const loudness = m?.loudness?.integrated ?? null;
        rows.push({
          id: rows.length + 1,
          key,
          deck: d.name,
          clip: c,
          measure: m,
          status,
          loudness,
          silent: m?.loudness?.silent ?? false,
          vol: c.vol,
          volExplicit: c.volExplicit,
          optOut: this.optOut.has(key),
          warnings: [.../* @__PURE__ */ new Set([...c.warnings, ...m?.warnings ?? [], ...m?.loudness?.flags ?? []])]
        });
      }
    }
    return rows;
  }
  /** Gain plan for the current state. Items still pending are treated as not eligible. */
  plan() {
    const items = this.items();
    const plan = planGains(items, {
      curve: this.curve,
      keepOriginalVolume: this.options.keepOriginalVolume,
      warnAttenuationDb: this.options.warnAttenuationDb
    });
    const byKey = new Map(plan.items.map((p) => [p.key, p]));
    return { ...plan, rows: items.map((it) => ({ ...it, plan: byKey.get(it.key) })), byKey };
  }
  /** Plan entries for one deck, in the form the writer worker expects. */
  deckPlan(plan, deckName) {
    return plan.rows.filter((r) => r.deck === deckName && r.plan).map((r) => [r.key, { change: r.plan.change, newVol: r.plan.newVol }]);
  }
  /** Decks that would produce an output file under the current options. */
  decksToWrite(plan) {
    return this.sortedDecks().filter((d) => {
      if (d.status !== "done") return false;
      const changes = plan.rows.some((r) => r.deck === d.name && r.plan?.change);
      return changes || this.options.copyUnchanged;
    });
  }
  setOptOut(key, on) {
    if (on) this.optOut.add(key);
    else this.optOut.delete(key);
  }
  /** Accepts { optOut: [...] } or a report with clips[].optOut / clips[].role === 'opted-out'. */
  importOptOut(json) {
    let keys = [];
    if (Array.isArray(json?.optOut)) keys = json.optOut;
    else if (Array.isArray(json?.clips)) keys = json.clips.filter((c) => c.optOut || c.role === "opted-out").map((c) => c.key);
    else throw new Error('Not an opt-out list: expected {"optOut": [...]}');
    let known = 0;
    const all = new Set(this.items().map((r) => r.key));
    for (const k of keys) {
      if (typeof k !== "string") continue;
      this.optOut.add(k);
      if (all.has(k)) known++;
    }
    return { total: keys.length, matched: known };
  }
  exportOptOut() {
    return { app: "pptx-leveler", kind: "opt-out", createdAt: (/* @__PURE__ */ new Date()).toISOString(), optOut: [...this.optOut].sort() };
  }
};

// src/ui/idb.js
var DB = "pptx-leveler";
var STORE = "kv";
function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req?.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}
var kvGet = (key) => tx("readonly", (s) => s.get(key)).catch(() => void 0);
var kvSet = (key, value) => tx("readwrite", (s) => s.put(value, key)).catch(() => {
});

// src/core/patch.js
var enc = new TextEncoder();
var dec = new TextDecoder("utf-8", { ignoreBOM: true });

// src/core/tone.js
var enc2 = new TextEncoder();
var dec2 = new TextDecoder("utf-8", { ignoreBOM: true });
var fmt = (x2) => (Math.round(x2 * 10) / 10).toFixed(1);
function toneDeckName(batchId, lref) {
  return `REFERENCE_TONE_${batchId}_${fmt(lref)}LUFS.pptx`;
}

// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start += 1 << eb[i2 - 1];
  }
  var r = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j = b[i2]; j < b[i2 + 1]; ++j) {
      r[j] = j - b[i2] << 5 | i2;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb2, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb2);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb2);
  for (i2 = 1; i2 < mb2; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb2);
    var rvb = 15 - mb2;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb2 - cd[i2];
        var v = le[cd[i2] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i2 = 1; i2 < a.length; ++i2) {
    if (a[i2] > m)
      m = a[i2];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i2 = 0; i2 < hcLen; ++i2) {
          clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i2 = 0; i2 < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i2++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i2++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i2 = sym - 257, b = fleb[i2];
          add = bits(dat, pos, (1 << b) - 1) + fl[i2];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}

// src/core/zip.js
var SIG_EOCD = 101010256;
var SIG_ZIP64_LOCATOR = 117853008;
var SIG_ZIP64_EOCD = 101075792;
var SIG_CDH = 33639248;
var SIG_LFH = 67324752;
var U16_MAX = 65535;
var U32_MAX = 4294967295;
var utf8 = new TextDecoder("utf-8", { ignoreBOM: true });
function view(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
function u64(dv, off) {
  const lo = dv.getUint32(off, true);
  const hi = dv.getUint32(off + 4, true);
  const n = hi * 2 ** 32 + lo;
  if (!Number.isSafeInteger(n)) throw new Error("zip: 64-bit value exceeds safe integer range");
  return n;
}
var ZipError = class extends Error {
};
async function openZip(source) {
  const { size } = source;
  if (size < 22) throw new ZipError("Not a zip file (too small)");
  const tailLen = Math.min(size, 22 + U16_MAX);
  const tailStart = size - tailLen;
  const tail = await source.read(tailStart, tailLen);
  const tdv = view(tail);
  let eocd = -1;
  for (let i2 = tail.length - 22; i2 >= 0; i2--) {
    if (tdv.getUint32(i2, true) === SIG_EOCD) {
      eocd = i2;
      break;
    }
  }
  if (eocd < 0) throw new ZipError("Not a zip file (no end-of-central-directory record)");
  let count = tdv.getUint16(eocd + 10, true);
  let cdSize = tdv.getUint32(eocd + 12, true);
  let cdOffset = tdv.getUint32(eocd + 16, true);
  if (count === U16_MAX || cdSize === U32_MAX || cdOffset === U32_MAX) {
    const loc = eocd - 20;
    if (loc < 0 || tdv.getUint32(loc, true) !== SIG_ZIP64_LOCATOR) {
      throw new ZipError("zip64 locator missing");
    }
    const z64Off = u64(tdv, loc + 8);
    const z64 = view(await source.read(z64Off, 56));
    if (z64.getUint32(0, true) !== SIG_ZIP64_EOCD) throw new ZipError("zip64 EOCD missing");
    count = u64(z64, 32);
    cdSize = u64(z64, 40);
    cdOffset = u64(z64, 48);
  }
  const cd = await source.read(cdOffset, cdSize);
  const dv = view(cd);
  const entries = [];
  let p = 0;
  for (let i2 = 0; i2 < count; i2++) {
    if (dv.getUint32(p, true) !== SIG_CDH) throw new ZipError(`Bad central directory header at entry ${i2}`);
    const flags = dv.getUint16(p + 8, true);
    const method = dv.getUint16(p + 10, true);
    const crc32 = dv.getUint32(p + 16, true);
    let compressedSize = dv.getUint32(p + 20, true);
    let uncompressedSize = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen2 = dv.getUint16(p + 32, true);
    let localHeaderOffset = dv.getUint32(p + 42, true);
    const name = utf8.decode(cd.subarray(p + 46, p + 46 + nameLen));
    let e = p + 46 + nameLen;
    const eEnd = e + extraLen;
    let lhoField = 42;
    let zip64 = false;
    while (e + 4 <= eEnd) {
      const id = dv.getUint16(e, true);
      const len = dv.getUint16(e + 2, true);
      if (id === 1) {
        zip64 = true;
        let q = e + 4;
        if (uncompressedSize === U32_MAX) {
          uncompressedSize = u64(dv, q);
          q += 8;
        }
        if (compressedSize === U32_MAX) {
          compressedSize = u64(dv, q);
          q += 8;
        }
        if (localHeaderOffset === U32_MAX) {
          localHeaderOffset = u64(dv, q);
          lhoField = -(q - p);
          q += 8;
        }
      }
      e += 4 + len;
    }
    const recLen = 46 + nameLen + extraLen + commentLen2;
    entries.push(new ZipEntry(source, {
      index: i2,
      name,
      flags,
      method,
      crc32,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      // Raw central directory record, kept so the writer can copy it unchanged.
      // lhoField > 0: 32-bit offset at that position; < 0: 64-bit offset at -lhoField.
      cdRecord: cd.slice(p, p + recLen),
      nameBytes: cd.slice(p + 46, p + 46 + nameLen),
      lhoField,
      zip64
    }));
    p += recLen;
  }
  const commentLen = tdv.getUint16(eocd + 20, true);
  const comment = tail.slice(eocd + 22, eocd + 22 + commentLen);
  return new Zip(source, entries, comment);
}
var Zip = class {
  constructor(source, entries, comment = new Uint8Array(0)) {
    this.source = source;
    this.comment = comment;
    this.entries = entries;
    this.byName = new Map(entries.map((e) => [e.name, e]));
  }
  get(name) {
    return this.byName.get(name) ?? null;
  }
  has(name) {
    return this.byName.has(name);
  }
  /** Read and decode a (small) text entry, or null if absent. */
  async text(name) {
    const e = this.get(name);
    if (!e) return null;
    return utf8.decode(await e.bytes());
  }
};
var ZipEntry = class {
  constructor(source, info) {
    this.source = source;
    Object.assign(this, info);
    this._dataOffset = null;
  }
  get isDirectory() {
    return this.name.endsWith("/");
  }
  get isEncrypted() {
    return (this.flags & 1) !== 0;
  }
  /** Absolute offset of this entry's (possibly compressed) data in the source. */
  async dataOffset() {
    if (this._dataOffset == null) {
      const h = view(await this.source.read(this.localHeaderOffset, 30));
      if (h.getUint32(0, true) !== SIG_LFH) throw new ZipError(`Bad local header for ${this.name}`);
      const nameLen = h.getUint16(26, true);
      const extraLen = h.getUint16(28, true);
      this._dataOffset = this.localHeaderOffset + 30 + nameLen + extraLen;
    }
    return this._dataOffset;
  }
  /**
   * Byte span of the whole local record: header + data + data descriptor (if any).
   * The writer copies this span verbatim for unchanged entries.
   */
  async localSpan() {
    const dataOffset = await this.dataOffset();
    let end = dataOffset + this.compressedSize;
    if (this.flags & 8) {
      const peek = view(await this.source.read(end, 4));
      const sig = peek.getUint32(0, true) === 134695760 ? 4 : 0;
      end += sig + 4 + (this.zip64 ? 16 : 8);
    }
    return { start: this.localHeaderOffset, end };
  }
  /** Raw (still compressed if method != 0) bytes of the entry. */
  async rawBytes() {
    return this.source.read(await this.dataOffset(), this.compressedSize);
  }
  /**
   * Uncompressed bytes. Intended for XML parts and small media.
   * For large stored media prefer {@link range} and read slices from the source.
   */
  async bytes() {
    if (this.isEncrypted) throw new ZipError(`${this.name} is encrypted`);
    const raw = await this.rawBytes();
    if (this.method === 0) return raw;
    if (this.method === 8) return inflateSync(raw, { out: new Uint8Array(this.uncompressedSize) });
    throw new ZipError(`${this.name}: unsupported compression method ${this.method}`);
  }
  /**
   * For stored (uncompressed) entries: the absolute byte range in the source,
   * so the content can be read or sliced without copying. Null if compressed.
   */
  async range() {
    if (this.method !== 0) return null;
    const offset = await this.dataOffset();
    return { offset, length: this.uncompressedSize };
  }
};

// src/browser/blob-source.js
function blobSource(blob, name = blob.name ?? "") {
  return {
    size: blob.size,
    name,
    blob,
    async read(offset, length) {
      if (offset < 0 || offset + length > blob.size) throw new Error(`read out of range: ${offset}+${length} > ${blob.size}`);
      return new Uint8Array(await blob.slice(offset, offset + length).arrayBuffer());
    },
    close: async () => {
    }
  };
}

// src/core/report.js
function buildReport({ batchId, appVersion, curve: curve2, plan, rows, files = {}, createdAt = (/* @__PURE__ */ new Date()).toISOString() }) {
  const anchor = rows.find((r) => r.plan?.role === "anchor");
  return {
    app: "pptx-leveler",
    appVersion,
    batchId,
    createdAt,
    lref: plan.lref,
    spreadDb: plan.spreadDb,
    anchor: anchor ? { id: anchor.id, key: anchor.key } : null,
    options: plan.options,
    curve: { version: curve2.version, type: curve2.type },
    files,
    clips: rows.map((r) => {
      const c = r.clip, m = r.measure, l = m?.loudness, p = r.plan ?? {};
      return {
        id: r.id,
        key: r.key,
        file: r.deck,
        slide: c.slideNumber,
        part: c.partName,
        instance: c.instance,
        shapeId: c.shapeId,
        shapeName: c.shapeName,
        kind: c.kind,
        mediaPart: c.mediaPart,
        trimStart_ms: c.trim.startMs,
        trimEnd_ms: c.trim.endMs,
        window_s: l?.durationS ?? null,
        channels: l?.inputChannels ?? m?.info?.channels ?? null,
        codec: m?.info?.codec ?? null,
        decoder: m?.decoder ?? null,
        LUFS: Number.isFinite(r.loudness) ? r.loudness : null,
        peak_dBFS: Number.isFinite(l?.samplePeakDb) ? l.samplePeakDb : null,
        oldVol: c.vol,
        gain_dB: p.gainDb ?? null,
        newVol: p.newVol ?? null,
        changed: !!p.change,
        // Linear gain PowerPoint applies at the volume it will use (per the curve);
        // the HTML log plays excerpts at this level for spot checks.
        playGain: (() => {
          const v = p.change ? p.newVol : c.vol;
          return v > 0 ? Math.min(1, Math.pow(10, volToDb(v, curve2) / 20)) : 0;
        })(),
        role: p.role ?? null,
        optOut: !!r.optOut,
        status: r.status,
        warnings: [.../* @__PURE__ */ new Set([...r.warnings ?? [], ...p.warnings ?? []])],
        media: r.media ?? null
      };
    })
  };
}
var CSV_COLUMNS = [
  "batchId",
  "id",
  "file",
  "slide",
  "instance",
  "shapeId",
  "shapeName",
  "kind",
  "mediaPart",
  "trimStart_ms",
  "trimEnd_ms",
  "window_s",
  "channels",
  "codec",
  "LUFS",
  "peak_dBFS",
  "oldVol",
  "gain_dB",
  "newVol",
  "role",
  "optOut",
  "status",
  "warnings",
  "mediaFile",
  "key"
];
function csvCell(v) {
  if (v == null) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(Math.round(v * 1e3) / 1e3) : "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function reportToCsv(report) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const c of report.clips) {
    const row = { ...c, batchId: report.batchId, warnings: c.warnings.join(" "), mediaFile: c.media?.path ?? "" };
    lines.push(CSV_COLUMNS.map((k) => csvCell(row[k])).join(","));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
function reportToJson(report) {
  return JSON.stringify(report, (k, v) => typeof v === "number" && !Number.isFinite(v) ? null : v, 2);
}
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var n1 = (x2) => x2 == null || !Number.isFinite(x2) ? "\u2013" : x2.toFixed(1).replace("-", "\u2212");
var pct = (v) => v == null ? "\u2013" : `${+(v / 1e3).toFixed(1)}%`;
function dur(s) {
  if (s == null || !Number.isFinite(s)) return "\u2013";
  const m = Math.floor(s / 60), r = Math.round(s - m * 60);
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
function mediaControlsNote(list) {
  if (!list?.length) return "";
  return `<p class="note"><strong>Media controls are on</strong> in ${list.map((m) => `${esc(m.deck)}${m.setting === "default" ? " (PowerPoint default)" : ""}`).join(", ")}. These presentations have video: moving the mouse over a playing video, including the preview in Presenter View, can show a progress bar over it. To turn it off: Slide Show \u2192 Set Up Slide Show \u2192 untick "Show media controls".</p>`;
}
var ROLE_LABEL = { anchor: "Anchor", normalised: "Normalised", "opted-out": "Not normalised", skipped: "Skipped" };
function reportToHtml(report) {
  const rows = report.clips.map((c) => {
    const canOptOut = c.status === "ok" && c.LUFS != null;
    const media = c.media?.path ? `<button type="button" class="play" data-src="${esc(encodeURI(c.media.path))}" data-gain="${c.playGain.toFixed(4)}" title="Play at the level PowerPoint will use">\u25B6</button> <a href="${esc(encodeURI(c.media.path))}" target="_blank">${c.media.kind === "excerpt" ? `first ${c.media.seconds ?? 5} s` : "clip"}</a>` : c.media?.error ? `<span class="muted" title="${esc(c.media.error)}">unavailable</span>` : "\u2013";
    const notes2 = [c.status !== "ok" ? c.status : "", ...c.warnings].filter(Boolean).join(", ");
    return `<tr class="${c.role === "anchor" ? "anchor" : ""}${c.role === "normalised" || c.role === "anchor" ? "" : " inactive"}">
<td class="c"><input type="checkbox" data-key="${esc(c.key)}" ${c.optOut ? "checked" : ""} ${canOptOut ? "" : "disabled"} aria-label="Don't normalise clip ${c.id}"></td>
<td class="n">${c.id}</td><td>${esc(c.file)}</td><td class="n">${c.slide ?? esc(c.part)}</td><td class="n">${c.instance}</td>
<td>${esc(c.shapeName ?? "")} <span class="muted">${esc(c.kind)}</span></td><td class="m">${media}</td>
<td class="n">${dur(c.window_s)}</td><td class="n">${n1(c.LUFS)}</td><td class="n">${n1(c.gain_dB)}</td>
<td class="n">${c.changed ? `${pct(c.oldVol)} \u2192 ${pct(c.newVol)}` : pct(c.oldVol)}</td>
<td>${esc(ROLE_LABEL[c.role] ?? "")}</td><td class="muted">${esc(notes2)}</td></tr>`;
  }).join("\n");
  const counts = report.clips.reduce((a, c) => (a[c.role ?? "skipped"] = (a[c.role ?? "skipped"] ?? 0) + 1, a), {});
  const decks = (report.files?.decks ?? []).map((d) => `<li>${esc(d.input)} \u2192 ${d.output ? esc(d.output) : '<span class="muted">not saved</span>'}${d.outcome && d.outcome !== "written" ? ` <span class="muted">(${esc(d.outcome)})</span>` : ""}</li>`).join("");
  const data = JSON.stringify({ batchId: report.batchId, keys: report.clips.map((c) => c.key) }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Batch ${esc(report.batchId)} \xB7 Volume Fix</title>
<style>
:root{--bg:#fff;--fg:#1c1c1e;--muted:#67676e;--line:#e2e2de;--accent:#1f5fbf;--anchor:#f0eafb;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#17171a;--fg:#ececee;--muted:#9c9ca5;--line:#2e2e33;--accent:#6ea3ff;--anchor:#2a2140;color-scheme:dark}}
body{background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;margin:16px}
h1{font-size:20px;margin:0 0 4px}.muted{color:var(--muted)}a{color:var(--accent)}
.meta{display:flex;flex-wrap:wrap;gap:6px 24px;margin:8px 0 12px}.meta b{font-variant-numeric:tabular-nums}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px}table{border-collapse:collapse;width:100%}
th,td{padding:5px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--muted);white-space:nowrap}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}td.m{white-space:nowrap}td.c{text-align:center}tr.anchor td{background:var(--anchor)}tr.inactive td{color:var(--muted)}
button{font:inherit;padding:6px 14px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer}
button.play{width:26px;height:22px;padding:0;font-size:10px;border-radius:11px;background:transparent;color:var(--accent)}button.play.on{background:var(--accent);color:#fff}
.bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin:12px 0}
.note{border:1px solid #e3a64a;background:rgba(227,166,74,.12);border-radius:6px;padding:8px 10px;margin:8px 0}
</style></head><body>
<h1>Batch ${esc(report.batchId)}</h1>
<div class="muted">Volume Fix ${esc(report.appVersion)} \xB7 ${esc(new Date(report.createdAt).toLocaleString())} \xB7 volume curve ${esc(report.curve.version)}</div>
<div class="meta">
<span>Reference level <b>${n1(report.lref)} LUFS</b>${report.anchor ? ` (anchor #${report.anchor.id})` : ""}</span>
<span>Spread <b>${n1(report.spreadDb)} dB</b></span>
<span>Clips <b>${report.clips.length}</b>: ${counts.normalised ?? 0} normalised, ${counts.anchor ?? 0} anchor, ${counts["opted-out"] ?? 0} not normalised, ${counts.skipped ?? 0} skipped</span>
${report.files?.toneDeck ? `<span>Tone deck <b>${esc(report.files.toneDeck)}</b></span>` : ""}
</div>
${mediaControlsNote(report.files?.mediaControls)}
${decks ? `<details><summary>Files</summary><ul>${decks}</ul></details>` : ""}
<div class="bar"><button type="button" id="export">Export opt-out list</button>
<span class="muted">Tick clips that should not be normalised, export the list, and load it in Volume Fix at https://volume-fix.com/ (Options \u2192 Load opt-out list) to re-run this batch.</span></div>
<div class="wrap"><table>
<thead><tr><th>Skip</th><th>#</th><th>Presentation</th><th>Slide</th><th>Pos</th><th>Clip</th><th>Media</th><th>Length</th><th>LUFS</th><th>Change dB</th><th>Volume</th><th>Result</th><th>Notes</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
<script type="application/json" id="batch-data">${data}<\/script>
<script>
document.getElementById('export').onclick = function () {
  var d = JSON.parse(document.getElementById('batch-data').textContent);
  var keys = Array.prototype.map.call(document.querySelectorAll('input[data-key]:checked'), function (el) { return el.getAttribute('data-key'); });
  var blob = new Blob([JSON.stringify({ app: 'pptx-leveler', kind: 'opt-out', batchId: d.batchId, createdAt: new Date().toISOString(), optOut: keys }, null, 2)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'optout_' + d.batchId + '.json'; document.body.appendChild(a); a.click(); a.remove();
};
// Spot-check playback at the level PowerPoint will use.
var player = new Audio(), current = null;
function stop() { player.pause(); if (current) { current.classList.remove('on'); current.textContent = '\\u25B6'; } current = null; }
player.addEventListener('ended', stop);
player.addEventListener('error', function () { var b = current; stop(); if (b) b.title = 'This browser cannot play this file'; });
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('button.play');
  if (!b) return;
  if (current === b) { stop(); return; }
  stop();
  player.src = b.getAttribute('data-src');
  player.volume = Math.max(0, Math.min(1, parseFloat(b.getAttribute('data-gain')) || 0));
  current = b; b.classList.add('on'); b.textContent = '\\u25A0';
  player.play().catch(function () { stop(); });
});
<\/script>
</body></html>
`;
}
function slug(s, max2 = 40) {
  return String(s ?? "").normalize("NFKD").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, max2) || "clip";
}
function mediaFileName(row, ext) {
  return `${String(row.id).padStart(3, "0")}_s${row.clip.slideNumber ?? "x"}_${slug(row.clip.shapeName)}${ext}`;
}
function batchFileNames(batchId) {
  return { json: `report_${batchId}.json`, csv: `report_${batchId}.csv`, log: `log_${batchId}.html`, mediaDir: `media_${batchId}` };
}
function makeBatchId(d = /* @__PURE__ */ new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// src/ui/app.js
var VERSION = true ? "0.4.0" : "dev";
var $ = (id) => document.getElementById(id);
var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var ffmpegBase = new URL("vendor/", document.baseURI).href;
var { curve, measured: curveMeasured } = loadCurve();
var batch = new Batch({ curve, options: loadOptions() });
var outDir = null;
var outGranted = false;
var writing = false;
function loadOptions() {
  try {
    return JSON.parse(localStorage.getItem("pptx-leveler:options") ?? "{}");
  } catch {
    return {};
  }
}
function saveOptions() {
  try {
    localStorage.setItem("pptx-leveler:options", JSON.stringify(batch.options));
  } catch {
  }
}
var worker = new Worker(new URL("worker.js", document.baseURI), { type: "module" });
var pending = /* @__PURE__ */ new Map();
worker.onmessage = (e) => {
  const m = e.data;
  const h = pending.get(m.id);
  if (!h) return;
  if (m.type === "error") {
    pending.delete(m.id);
    h.reject(new Error(m.message));
    return;
  }
  h.on?.(m);
  if (m.type === "done" || m.type === "written" || m.type === "excerpted" || m.type === "toned") {
    pending.delete(m.id);
    h.resolve(m);
  }
};
function call(msg, on) {
  const id = Math.random().toString(36).slice(2);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, on });
    worker.postMessage({ ...msg, id });
  });
}
var scheduled = false;
function render() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    renderDecks();
    renderDeckNotes();
    renderReview();
    renderWrite();
  });
}
var mb = (n) => n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;
var num = (x2, d = 1) => x2 == null || !Number.isFinite(x2) ? "\u2013" : x2.toFixed(d).replace("-", "\u2212");
var pct2 = (vol) => vol == null ? "\u2013" : `${+(vol / 1e3).toFixed(vol % 1e3 ? 1 : 0)}%`;
function dur2(s) {
  if (s == null || !Number.isFinite(s)) return "\u2013";
  const m = Math.floor(s / 60), r = Math.round(s - m * 60);
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}
var MEDIA_CONTROLS_TIP = `PowerPoint's "Show media controls" is on and this presentation has video. Moving the mouse over a playing video, including the preview in Presenter View, can put a progress bar over the full-screen video. To turn it off: Slide Show \u2192 Set Up Slide Show \u2192 untick "Show media controls". Volume Fix does not change this setting.`;
function mediaControlsWarning(d) {
  return d.inventory?.warnings?.find((w) => w === "media-controls-shown" || w === "media-controls-default") ?? null;
}
function renderDeckNotes() {
  const flagged = batch.sortedDecks().filter((d) => mediaControlsWarning(d));
  const el = $("deck-notes");
  el.hidden = !flagged.length;
  if (!flagged.length) {
    el.innerHTML = "";
    return;
  }
  const n = flagged.length;
  const anyDefault = flagged.some((d) => mediaControlsWarning(d) === "media-controls-default");
  el.innerHTML = `<p><strong>Media controls are on in ${n} presentation${n === 1 ? "" : "s"} with video:</strong> ${flagged.map((d) => esc2(d.name)).join(", ")}.</p><p>During the show, moving the mouse over a playing video, including the preview in Presenter View, can put a progress bar over the full-screen video. If that isn't wanted, open the presentation in PowerPoint, go to <em>Slide Show \u2192 Set Up Slide Show</em> and untick <em>Show media controls</em>. Volume Fix doesn't change this setting.</p>` + (anyDefault ? `<p class="muted small">"(default)": the file doesn't store the setting, so PowerPoint's default (on) is assumed.</p>` : "");
}
function renderDecks() {
  const ul = $("decks");
  ul.innerHTML = batch.sortedDecks().map((d) => {
    let meta = mb(d.size);
    let frac = 0;
    if (d.status === "queued") meta += " \xB7 waiting";
    else if (d.status === "analysing") {
      const clips = d.inventory?.clips.filter((c) => c.status === "ok").length ?? 0;
      const doneN = d.results.size;
      frac = clips ? (doneN + (d.progress ?? 0)) / clips : 0;
      meta += d.inventory ? ` \xB7 measuring ${Math.min(doneN + 1, clips)} of ${clips}` : " \xB7 reading";
    } else if (d.status === "done") {
      const n = d.inventory.clips.length;
      meta += ` \xB7 ${n === 0 ? "no media" : `${n} clip${n === 1 ? "" : "s"}`}`;
      frac = 1;
    } else if (d.status === "error") meta += ` \xB7 ${d.error}`;
    const mc = mediaControlsWarning(d);
    const badge = mc ? `<span class="badge warn" title="${esc2(MEDIA_CONTROLS_TIP)}">Media controls on${mc === "media-controls-default" ? " (default)" : ""}</span>` : "";
    return `<li class="deck ${d.status}"><span class="name">${esc2(d.name)}${badge}</span><span class="meta">${esc2(meta)}</span><button type="button" class="icon" data-remove="${esc2(d.name)}" ${d.status === "analysing" || writing ? "disabled" : ""} aria-label="Remove ${esc2(d.name)}">Remove</button>${d.status === "analysing" || d.status === "queued" ? `<div class="bar"><span style="width:${(frac * 100).toFixed(1)}%"></span></div>` : ""}</li>`;
  }).join("");
}
var STATUS_NOTE = {
  "skipped-muted": ["Muted", "info"],
  "skipped-vol0": ["Volume 0", "info"],
  "skipped-linked": ["Linked file, not embedded", "warn"],
  "no-timing-node": ["No playback settings", "warn"],
  "missing-media": ["Media file missing", "bad"],
  "no-audio-track": ["No audio", "info"],
  "decode-failed": ["Couldn't decode", "bad"],
  "trim-empty": ["Trimmed to nothing", "warn"],
  pending: ["Measuring\u2026", "info"]
};
function notes(r, warnDb) {
  const out = [];
  const p = r.plan;
  if (p?.role === "anchor") out.push(["Anchor \xB7 quietest clip", "anchor"]);
  if (r.status !== "ok" && STATUS_NOTE[r.status]) {
    const [t, c] = STATUS_NOTE[r.status];
    out.push([t, c, r.measure?.error]);
  } else if (r.status === "ok" && r.silent) out.push(["Silent", "info"]);
  if (p?.role === "opted-out") {
    out.push(["Not normalised", "info"]);
    if (p.levelVsAnchorDb != null && Math.abs(p.levelVsAnchorDb) > 1) {
      out.push([`Plays ${num(Math.abs(p.levelVsAnchorDb))} dB ${p.levelVsAnchorDb < 0 ? "quieter" : "louder"}`, "warn"]);
    }
  }
  const w = /* @__PURE__ */ new Set([...r.warnings ?? [], ...p?.warnings ?? []]);
  if (w.has("large-attenuation")) out.push([`Cut by more than ${warnDb} dB`, "warn"]);
  if (w.has("clamped-to-min-vol")) out.push(["At minimum volume", "bad"]);
  if (w.has("vol-absent")) out.push(["No volume set (assumed 50%)", "warn"]);
  if (w.has("multiple-timing-nodes")) out.push(["Several playback settings", "warn"]);
  if (w.has("short")) out.push(["Under 0.4 s", "info"]);
  if (w.has("hidden-slide")) out.push(["Hidden slide", "info"]);
  if (w.has("on-layout")) out.push(["On a layout", "info"]);
  if (w.has("on-master")) out.push(["On a master", "info"]);
  if (w.has("fade-applied")) out.push(["Fades included", "info"]);
  return out.map(([t, c, title]) => `<span class="badge ${c}"${title ? ` title="${esc2(title)}"` : ""}>${esc2(t)}</span>`).join("");
}
function renderReview() {
  const plan = batch.plan();
  const rows = plan.rows;
  $("empty").hidden = rows.length > 0 || batch.decks.size > 0;
  if (batch.decks.size > 0 && rows.length === 0) {
    $("empty").hidden = false;
    $("empty").textContent = batch.analysing ? "Reading presentations\u2026" : "None of these presentations contain audio or video.";
  } else $("empty").textContent = "Add presentations to see their clips here.";
  const counts = { norm: 0, skipped: 0, optout: 0, warn: 0 };
  for (const r of rows) {
    if (r.plan?.role === "normalised" || r.plan?.role === "anchor") counts.norm++;
    else if (r.plan?.role === "opted-out") counts.optout++;
    else counts.skipped++;
    if ((r.plan?.warnings ?? []).length || r.status === "decode-failed") counts.warn++;
  }
  const anchor = rows.find((r) => r.plan?.role === "anchor");
  const analysingN = batch.sortedDecks().filter((d) => d.status === "queued" || d.status === "analysing").length;
  const metrics = [];
  if (analysingN) metrics.push(["Status", `Measuring`, `${analysingN} presentation${analysingN === 1 ? "" : "s"} left`]);
  metrics.push(["Reference level", plan.lref == null ? "\u2013" : `${num(plan.lref)} LUFS`, anchor ? `Anchor: #${anchor.id}, ${anchor.deck}, slide ${anchor.clip.slideNumber ?? "\u2013"}` : "The quietest clip plays at 100%"]);
  metrics.push(["Spread", plan.spreadDb == null ? "\u2013" : `${num(plan.spreadDb)} dB`, "Loudest minus quietest"]);
  metrics.push(["Clips", String(rows.length), `${counts.norm} normalised \xB7 ${counts.skipped} skipped \xB7 ${counts.optout} not normalised`]);
  metrics.push(["Need attention", String(counts.warn), counts.warn ? "See Notes" : "Nothing flagged"]);
  $("summary").innerHTML = rows.length || analysingN ? metrics.map(([k, v, s]) => {
    const toneBtn = k === "Reference level" && plan.lref != null ? ` <button type="button" class="play${tone ? " on" : ""}" id="tone-btn" title="Play a 1 kHz reference tone at this level in the browser. It should sound as loud as the clips. A rough guide only; use the tone deck in PowerPoint to align the console." aria-label="${tone ? "Stop" : "Play"} reference tone">${tone ? "\u25A0" : "\u25B6"}</button>` : "";
    return `<div class="metric"><div class="k">${esc2(k)}</div><div class="v">${esc2(v)}${toneBtn}</div><div class="s">${esc2(s)}</div></div>`;
  }).join("") : "";
  const warnDb = batch.options.warnAttenuationDb;
  $("clips").querySelector("tbody").innerHTML = rows.map((r) => {
    const p = r.plan;
    const active = p?.role === "normalised" || p?.role === "anchor";
    const canOptOut = r.status === "ok" && !r.silent;
    const c = r.clip;
    const trimmed = c.trim.startMs || c.trim.endMs;
    const vol = p?.newVol != null && p.change ? `${pct2(r.vol)} <span class="arrow">\u2192</span> ${pct2(p.newVol)}` : pct2(r.vol);
    return `<tr class="${active ? "" : "inactive"} ${p?.role === "anchor" ? "anchor" : ""}"><td class="c-skip"><input type="checkbox" data-key="${esc2(r.key)}" ${r.optOut ? "checked" : ""} ${canOptOut && !writing ? "" : "disabled"} aria-label="Don't normalise clip ${r.id}"></td><td class="c-id">${r.id}</td><td class="c-play"><span class="acts">${r.status === "ok" && !r.silent ? `<button type="button" class="play${playing?.key === r.key ? " on" : ""}" data-play="${esc2(r.key)}" title="Play at the ${active ? "normalised" : "current"} level (Alt-click: original level)" aria-label="${playing?.key === r.key ? "Stop" : "Play"} clip ${r.id}">${playing?.key === r.key ? "\u25A0" : "\u25B6"}</button>` : ""}${hasEmbeddedMedia(c) ? `<button type="button" class="dl" data-dl="${esc2(r.key)}" title="Download the original media file (${esc2(clipMediaName(c))}). The presentation isn't changed." aria-label="Download media for clip ${r.id}">\u2913</button>` : ""}</span></td><td class="deck-name">${esc2(r.deck)}</td><td class="c-n">${c.slideNumber ?? esc2(c.container)}${c.instance > 1 ? `<span class="muted"> \xB7${c.instance}</span>` : ""}</td><td class="clip-name">${esc2(c.shapeName ?? "")} <span class="muted small">${c.kind}</span></td><td class="c-n">${dur2(r.measure?.loudness?.durationS)}${trimmed ? ' <span class="muted small">trimmed</span>' : ""}</td><td class="c-n">${r.loudness != null && Number.isFinite(r.loudness) ? `${num(r.loudness)}` : r.silent ? "silent" : "\u2013"}</td><td class="c-n">${p?.gainDb != null ? `${num(p.gainDb)} dB` : "\u2013"}</td><td class="c-n">${vol}</td><td>${notes(r, warnDb)}</td></tr>`;
  }).join("");
}
function renderWrite() {
  const plan = batch.plan();
  const toWrite = batch.decksToWrite(plan);
  const btn = $("write");
  btn.disabled = writing || !batch.ready || !outDir || plan.rows.length === 0;
  btn.textContent = toWrite.length ? `Save ${toWrite.length} presentation${toWrite.length === 1 ? "" : "s"} and batch log` : "Save batch log";
  if (!writing) {
    let s = "";
    if (!batch.decks.size) s = "Add presentations first.";
    else if (batch.analysing) s = "Waiting for measurements to finish.";
    else if (!outDir) s = "Choose an output folder first.";
    else if (!plan.rows.length) s = "No clips to report on.";
    else if (!toWrite.length) s = "No presentation needs changing; the batch log can still be saved.";
    $("write-status").textContent = s;
  }
  $("out-status").textContent = outDir ? `${outDir.name}${outGranted ? "" : " (click to reconnect)"}` : "No folder chosen.";
  $("pick-out").textContent = outDir && !outGranted ? "Reconnect folder" : outDir ? "Change folder\u2026" : "Choose folder\u2026";
}
var isDeck = (name) => /\.pptx$/i.test(name) && !name.startsWith("~$");
async function addFiles(entries) {
  const rejected = [];
  for (const { file, handle } of entries) {
    if (!isDeck(file.name)) {
      rejected.push(`${file.name} (not a .pptx)`);
      continue;
    }
    if (!batch.addDeck({ name: file.name, size: file.size, file, handle })) rejected.push(`${file.name} (already added)`);
  }
  if (rejected.length) toast(`Skipped: ${rejected.join(", ")}`);
  render();
  pump();
}
async function fromHandle(h, out) {
  if (h.kind === "file") {
    if (isDeck(h.name)) out.push({ file: await h.getFile(), handle: h });
  } else if (h.kind === "directory") {
    for await (const child2 of h.values()) if (child2.kind === "file" && isDeck(child2.name)) out.push({ file: await child2.getFile(), handle: child2 });
  }
}
function setupDrop() {
  const drop = $("drop");
  const over = (on) => drop.classList.toggle("over", on);
  for (const el of [drop, document.body]) {
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      over(true);
    });
    el.addEventListener("dragleave", (e) => {
      if (e.target === drop || e.target === document.body) over(false);
    });
  }
  document.body.addEventListener("drop", async (e) => {
    e.preventDefault();
    over(false);
    const items = [...e.dataTransfer?.items ?? []].filter((i2) => i2.kind === "file");
    const handles = items.map((i2) => i2.getAsFileSystemHandle?.() ?? null);
    const files = [...e.dataTransfer?.files ?? []];
    const out = [];
    if (handles.length && handles.every(Boolean)) {
      for (const hp of handles) {
        const h = await hp;
        if (h) await fromHandle(h, out);
      }
    } else {
      for (const f of files) out.push({ file: f });
    }
    addFiles(out);
  });
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pickFiles();
    }
  });
  drop.addEventListener("click", (e) => {
    if (e.target === drop || e.target.tagName === "P" || e.target.tagName === "STRONG") pickFiles();
  });
  $("add").onclick = (e) => {
    e.stopPropagation();
    pickFiles();
  };
  $("file-input").onchange = (e) => {
    addFiles([...e.target.files].map((file) => ({ file })));
    e.target.value = "";
  };
}
async function pickFiles() {
  if (window.showOpenFilePicker) {
    try {
      const hs = await showOpenFilePicker({ multiple: true, id: "pptx-leveler-in", types: [{ description: "PowerPoint", accept: { "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] } }] });
      const out = [];
      for (const h of hs) await fromHandle(h, out);
      addFiles(out);
    } catch (e) {
      if (e.name !== "AbortError") toast(e.message);
    }
  } else $("file-input").click();
}
var pumping = false;
async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    for (; ; ) {
      const d = batch.sortedDecks().find((x2) => x2.status === "queued");
      if (!d) break;
      d.status = "analysing";
      render();
      try {
        await call({ type: "analyze", file: d.file, fileName: d.name, ffmpegBase }, (m) => {
          if (!batch.decks.has(d.name)) return;
          if (m.type === "deck") d.inventory = m.deck;
          else if (m.type === "progress") d.progress = m.fraction;
          else if (m.type === "clip") {
            d.results.set(m.key, m.result);
            d.progress = 0;
          }
          render();
        });
        d.status = "done";
      } catch (e) {
        d.status = "error";
        d.error = e.message;
      }
      render();
    }
  } finally {
    pumping = false;
  }
}
async function restoreOutDir() {
  const h = await kvGet("outDir");
  if (!h) return;
  outDir = h;
  outGranted = await h.queryPermission?.({ mode: "readwrite" }) === "granted";
  render();
}
async function ensureOutPermission() {
  if (!outDir) return false;
  if (await outDir.queryPermission({ mode: "readwrite" }) === "granted") return outGranted = true;
  outGranted = await outDir.requestPermission({ mode: "readwrite" }) === "granted";
  render();
  return outGranted;
}
async function pickOutDir() {
  if (outDir && !outGranted) {
    await ensureOutPermission();
    return;
  }
  try {
    const h = await showDirectoryPicker({ id: "pptx-leveler-out", mode: "readwrite" });
    outDir = h;
    outGranted = true;
    await kvSet("outDir", h);
    render();
  } catch (e) {
    if (e.name !== "AbortError") toast(e.message);
  }
}
async function exists(dir, name) {
  try {
    return await dir.getFileHandle(name);
  } catch {
    return null;
  }
}
function dialog(title, bodyHtml, okLabel = "OK") {
  const dlg = $("dlg");
  $("dlg-title").textContent = title;
  $("dlg-body").innerHTML = bodyHtml;
  $("dlg-ok").textContent = okLabel;
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true }));
}
async function writeAll() {
  if (writing || !await ensureOutPermission()) return;
  const plan = batch.plan();
  const decks = batch.decksToWrite(plan);
  if (!plan.rows.length) return;
  const collisions = [];
  for (const d of decks) {
    const name = outputName(d.name);
    const h = await exists(outDir, name);
    if (!h) continue;
    if (d.handle && await d.handle.isSameEntry(h)) {
      toast(`${d.name} is itself named like an output file; rename it first.`);
      return;
    }
    collisions.push(name);
  }
  if (collisions.length && !await dialog(
    `Replace ${collisions.length} existing file${collisions.length === 1 ? "" : "s"}?`,
    `<p>These already exist in <strong>${esc2(outDir.name)}</strong>:</p><ul>${collisions.map((n) => `<li>${esc2(n)}</li>`).join("")}</ul>`,
    "Replace"
  )) return;
  writing = true;
  const ul = $("written");
  ul.innerHTML = "";
  render();
  const o = batch.options;
  const batchId = makeBatchId();
  const names = batchFileNames(batchId);
  const files = {
    decks: [],
    ...names,
    toneDeck: null,
    mediaControls: batch.sortedDecks().filter((d) => mediaControlsWarning(d)).map((d) => ({ deck: d.name, setting: mediaControlsWarning(d) === "media-controls-default" ? "default" : "shown" }))
  };
  const line = (text, cls = "") => {
    const li = document.createElement("li");
    li.className = cls;
    li.textContent = text;
    ul.appendChild(li);
    return li;
  };
  let failed = 0;
  for (const [i2, d] of decks.entries()) {
    const name = outputName(d.name);
    $("write-status").textContent = `Saving ${i2 + 1} of ${decks.length}: ${name}`;
    const li = line(`${name} \u2026`);
    try {
      const r = await call({
        type: "write",
        file: d.file,
        fileName: d.name,
        outDir,
        outName: name,
        plan: batch.deckPlan(plan, d.name),
        verify: o.verify,
        copyUnchanged: o.copyUnchanged,
        overwrite: true
      }, (m) => {
        if (m.type === "write-progress") li.textContent = `${name} \u2026 ${Math.round(m.fraction * 100)}%`;
      });
      d.write = r;
      files.decks.push({ input: d.name, output: r.outcome === "written" ? name : null, outcome: r.outcome, changes: r.changes.length });
      if (r.outcome === "written") {
        li.className = "ok";
        li.textContent = `\u2713 ${name} \xB7 ${r.changes.length} clip${r.changes.length === 1 ? "" : "s"} adjusted${r.verified ? " \xB7 checked" : ""}`;
      } else {
        li.className = "skip";
        li.textContent = `\u2013 ${name} \xB7 ${r.outcome === "exists" ? "already exists, not replaced" : "no change needed"}`;
      }
    } catch (e) {
      failed++;
      files.decks.push({ input: d.name, output: null, outcome: "failed", error: e.message });
      li.className = "bad";
      li.textContent = `\u2717 ${name} \xB7 ${e.message}`;
    }
  }
  if (o.toneDeck && plan.lref != null) {
    const name = toneDeckName(batchId, plan.lref);
    $("write-status").textContent = `Saving ${name}`;
    const li = line(`${name} \u2026`);
    try {
      const r = await call({
        type: "tone",
        templateUrl: new URL("assets/reference_template.pptx", document.baseURI).href,
        outDir,
        outName: name,
        lref: plan.lref,
        batchId,
        date: (/* @__PURE__ */ new Date()).toLocaleDateString(),
        deckCount: files.decks.filter((x2) => x2.output).length,
        clipCount: plan.rows.filter((x2) => x2.plan?.role === "normalised" || x2.plan?.role === "anchor").length,
        seconds: o.toneSeconds
      });
      const ok = r.measured.every((m) => Math.abs(m.lufs - plan.lref) <= 0.1 && m.vol === 1e5);
      files.toneDeck = name;
      li.className = ok ? "ok" : "bad";
      li.textContent = `${ok ? "\u2713" : "\u2717"} ${name} \xB7 tones measure ${r.measured.map((m) => `${num(m.lufs)} (${m.channels === 1 ? "mono" : "stereo"})`).join(", ")} LUFS`;
      if (!ok) failed++;
    } catch (e) {
      failed++;
      li.className = "bad";
      li.textContent = `\u2717 ${name} \xB7 ${e.message}`;
    }
  }
  const rows = plan.rows.map((r) => ({ ...r }));
  if (o.excerpts) {
    const want = rows.filter((r) => r.clip.mediaPart && !["skipped-linked", "missing-media"].includes(r.clip.status));
    if (want.length) {
      const li = line(`${names.mediaDir}/ \u2026`);
      const mediaDir = await outDir.getDirectoryHandle(names.mediaDir, { create: true });
      const done = /* @__PURE__ */ new Map();
      let n = 0, bad = 0;
      for (const r of want) {
        n++;
        $("write-status").textContent = `Saving media ${n} of ${want.length}`;
        const k = `${r.deck}|${r.clip.mediaPart}|${r.clip.trim.startMs}`;
        if (!done.has(k)) {
          const d = batch.decks.get(r.deck);
          try {
            const res = await call({
              type: "excerpt",
              file: d.file,
              fileName: d.name,
              mediaPart: r.clip.mediaPart,
              startMs: r.clip.trim.startMs,
              mediaDir,
              baseName: mediaFileName(r, "").replace(/\.$/, ""),
              maxFullBytes: 1 << 20,
              seconds: 5,
              ffmpegBase
            });
            done.set(k, { path: `${names.mediaDir}/${res.name}`, kind: res.kind, seconds: res.seconds });
          } catch (e) {
            bad++;
            done.set(k, { error: e.message });
          }
        }
        r.media = done.get(k);
      }
      li.className = bad ? "bad" : "ok";
      li.textContent = `${bad ? "\u2717" : "\u2713"} ${names.mediaDir}/ \xB7 ${done.size - bad} media file${done.size - bad === 1 ? "" : "s"}${bad ? `, ${bad} failed` : ""}`;
    }
  }
  try {
    const report = buildReport({ batchId, appVersion: VERSION, curve, plan, rows, files });
    await writeText(names.json, reportToJson(report), "application/json");
    await writeText(names.csv, reportToCsv(report), "text/csv");
    await writeText(names.log, reportToHtml(report), "text/html");
    line(`\u2713 ${names.log}, ${names.csv}, ${names.json}`, "ok");
  } catch (e) {
    failed++;
    line(`\u2717 reports \xB7 ${e.message}`, "bad");
  }
  writing = false;
  $("write-status").textContent = failed ? `Finished with ${failed} problem${failed === 1 ? "" : "s"}; see the list below.` : `Saved batch ${batchId} to ${outDir.name}. Open ${names.log} there to review it.`;
  render();
}
async function writeText(name, text, type) {
  const fh = await outDir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(new Blob([text], { type }));
  await w.close();
}
var player = new Audio();
player.preload = "none";
var playing = null;
var MIME = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".mov": "video/mp4", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav" };
var audioCtx = null;
var tone = null;
function stopTone() {
  if (!tone) return;
  const { osc, gain } = tone;
  const t = audioCtx.currentTime;
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.01);
  osc.stop(t + 0.02);
  tone = null;
  render();
}
function toggleTone() {
  if (tone) {
    stopTone();
    return;
  }
  const lref = batch.plan().lref;
  if (lref == null) return;
  stopPlayback();
  audioCtx ??= new AudioContext();
  audioCtx.resume();
  const osc = new OscillatorNode(audioCtx, { type: "sine", frequency: 1e3 });
  const gain = new GainNode(audioCtx, { gain: 0 });
  osc.connect(gain).connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(Math.pow(10, lref / 20), t + 0.01);
  osc.start(t);
  tone = { osc, gain };
  render();
}
function stopPlayback() {
  player.pause();
  if (playing?.url) URL.revokeObjectURL(playing.url);
  playing = null;
  render();
}
player.addEventListener("timeupdate", () => {
  if (playing?.endS != null && player.currentTime >= playing.endS) stopPlayback();
});
player.addEventListener("ended", stopPlayback);
player.addEventListener("error", () => {
  const key = playing?.key;
  stopPlayback();
  if (key) toast("This browser can't play that clip's format; it is still measured and normalised.");
});
async function clipBlob(d, clip) {
  d.zip ??= await openZip(blobSource(d.file, d.name));
  const entry = d.zip.get(clip.mediaPart);
  if (!entry) throw new Error(`${clip.mediaPart} is missing from ${d.name}`);
  const ext = (clip.mediaPart.match(/\.[^./]+$/)?.[0] ?? "").toLowerCase();
  const range = await entry.range();
  const data = range ? d.file.slice(range.offset, range.offset + range.length) : await entry.bytes();
  return new Blob([data], { type: MIME[ext] ?? "application/octet-stream" });
}
async function downloadClip(key) {
  const row = batch.items().find((r) => r.key === key);
  const d = row && batch.decks.get(row.deck);
  if (!row || !d?.file) return;
  try {
    const url = URL.createObjectURL(await clipBlob(d, row.clip));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${deckFolderName(d.name)} ${clipMediaName(row.clip)}` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1e3);
  } catch (e) {
    toast(`Couldn't extract that clip: ${e.message}`);
  }
}
var savingMedia = false;
var GAINS_FILE = "volume-fix-gains.txt";
async function saveAllMedia(rootOverride = null) {
  if (savingMedia) return;
  const jobs = [];
  for (const d of batch.sortedDecks()) {
    for (const c of d.inventory?.clips ?? []) if (hasEmbeddedMedia(c)) jobs.push({ d, c, folder: deckFolderName(d.name), name: clipMediaName(c) });
  }
  const status = $("media-status");
  if (!jobs.length) {
    status.textContent = batch.decks.size ? "No embedded media to save." : "Add presentations first.";
    return;
  }
  let root = rootOverride;
  if (!root) {
    try {
      root = await showDirectoryPicker({ id: "volume-fix-media", mode: "readwrite", startIn: outDir ?? "documents" });
    } catch (e) {
      if (e.name !== "AbortError") status.textContent = e.message;
      return;
    }
  }
  savingMedia = true;
  try {
    const existing = [];
    for (const j of jobs) {
      try {
        const sub = await root.getDirectoryHandle(j.folder);
        await sub.getFileHandle(j.name);
        existing.push(`${j.folder}/${j.name}`);
      } catch {
      }
    }
    if (existing.length && !await dialog(
      `Replace ${existing.length} existing file${existing.length === 1 ? "" : "s"}?`,
      `<p>These already exist in <strong>${esc2(root.name)}</strong>:</p><ul>${existing.slice(0, 50).map((n) => `<li>${esc2(n)}</li>`).join("")}${existing.length > 50 ? `<li>\u2026and ${existing.length - 50} more</li>` : ""}</ul>`,
      "Replace"
    )) {
      status.textContent = "";
      return;
    }
    let done = 0, failed = 0, bytes = 0;
    for (const j of jobs) {
      status.textContent = `Saving ${done + failed + 1} of ${jobs.length}: ${j.folder}/${j.name}`;
      try {
        const sub = await root.getDirectoryHandle(j.folder, { create: true });
        const fh = await sub.getFileHandle(j.name, { create: true });
        const blob = await clipBlob(j.d, j.c);
        await blob.stream().pipeTo(await fh.createWritable());
        bytes += blob.size;
        done++;
      } catch (e) {
        failed++;
        console.warn(`Couldn't save ${j.folder}/${j.name}:`, e);
      }
    }
    let gainsNote = "";
    try {
      const fh = await root.getFileHandle(GAINS_FILE, { create: true });
      const w = await fh.createWritable();
      await w.write(new Blob([playoutGainsText(batch.plan())], { type: "text/plain" }));
      await w.close();
      gainsNote = ` Gains for your playout software are in ${GAINS_FILE}.`;
    } catch (e) {
      gainsNote = ` (Couldn't write ${GAINS_FILE}: ${e.message})`;
    }
    const decks = new Set(jobs.map((j) => j.folder)).size;
    status.textContent = `Saved ${done} media file${done === 1 ? "" : "s"} (${mb(bytes)}) from ${decks} presentation${decks === 1 ? "" : "s"} to ${root.name}${failed ? `; ${failed} failed` : ""}.${gainsNote}`;
  } finally {
    savingMedia = false;
  }
}
async function playClip(key, original = false) {
  if (playing?.key === key) {
    stopPlayback();
    return;
  }
  stopPlayback();
  stopTone();
  const row = batch.plan().rows.find((r) => r.key === key);
  const d = row && batch.decks.get(row.deck);
  if (!row || !d?.file) return;
  let blob;
  try {
    blob = await clipBlob(d, row.clip);
  } catch {
    return;
  }
  const url = URL.createObjectURL(blob);
  const vol = original || !row.plan?.change ? row.vol : row.plan.newVol;
  const startS = row.clip.trim.startMs / 1e3;
  const lenS = row.measure?.loudness?.durationS;
  playing = { key, url, endS: lenS != null ? startS + lenS : null };
  player.src = url;
  player.volume = Math.max(0, Math.min(1, Math.pow(10, volToDb(vol ?? 0, curve) / 20)));
  player.currentTime = startS;
  render();
  try {
    await player.play();
  } catch (e) {
    if (e.name !== "AbortError") {
      stopPlayback();
      toast(`Can't play this clip: ${e.message}`);
    }
  }
}
function setupOptions() {
  const o = batch.options;
  const bind = (id, key, read) => {
    const el = $(id);
    if (el.type === "checkbox") el.checked = !!o[key];
    else el.value = o[key];
    el.addEventListener("change", () => {
      o[key] = read(el);
      saveOptions();
      render();
    });
  };
  bind("opt-keep", "keepOriginalVolume", (el) => el.checked);
  bind("opt-warn", "warnAttenuationDb", (el) => Math.max(1, Math.min(60, Number(el.value) || 15)));
  bind("opt-copy", "copyUnchanged", (el) => el.checked);
  bind("opt-verify", "verify", (el) => el.checked);
  bind("opt-tone", "toneDeck", (el) => el.checked);
  bind("opt-tone-s", "toneSeconds", (el) => Math.max(5, Math.min(600, Number(el.value) || 30)));
  bind("opt-excerpts", "excerpts", (el) => el.checked);
  for (const btn of document.querySelectorAll(".help-btn")) {
    btn.addEventListener("click", () => {
      const panel = $(btn.getAttribute("aria-controls"));
      const open2 = panel.hidden;
      panel.hidden = !open2;
      btn.setAttribute("aria-expanded", String(open2));
    });
  }
  $("optout-load").onclick = () => $("optout-input").click();
  $("optout-input").onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const r = batch.importOptOut(JSON.parse(await f.text()));
      $("optout-status").textContent = `Loaded ${r.total} clip${r.total === 1 ? "" : "s"}; ${r.matched} match this batch.`;
      render();
    } catch (err2) {
      $("optout-status").textContent = err2.message;
    }
  };
  $("optout-save").onclick = () => {
    const blob = new Blob([JSON.stringify(batch.exportOptOut(), null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "optout.json" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
  };
  $("summary").addEventListener("click", (e) => {
    if (e.target.closest?.("#tone-btn")) toggleTone();
  });
  $("clips").addEventListener("click", (e) => {
    const btn = e.target.closest?.("button[data-play]");
    if (btn) playClip(btn.dataset.play, e.altKey);
    const dl = e.target.closest?.("button[data-dl]");
    if (dl) downloadClip(dl.dataset.dl);
  });
  $("clips").addEventListener("change", (e) => {
    const key = e.target.dataset?.key;
    if (!key) return;
    batch.setOptOut(key, e.target.checked);
    render();
  });
  $("decks").addEventListener("click", (e) => {
    const name = e.target.dataset?.remove;
    if (!name) return;
    batch.removeDeck(name);
    render();
  });
}
var toastTimer;
function toast(msg) {
  const s = $("write-status");
  s.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => render(), 6e3);
}
function isChromium() {
  if (new URLSearchParams(location.search).get("browser") === "other") return false;
  return !!navigator.userAgentData?.brands?.some((b) => b.brand === "Chromium");
}
function setupEnv() {
  const chips = [];
  const fsa = "showDirectoryPicker" in window;
  if (!isChromium()) chips.push(["Works best in Chrome or Edge", "warn", "Volume Fix uses folder access and WebCodecs, which Chrome and Edge support fully."]);
  chips.push([`ffmpeg ${self.crossOriginIsolated ? "multithreaded" : "single-threaded"}`, self.crossOriginIsolated ? "ok" : "warn"]);
  chips.push([`WebCodecs ${"AudioDecoder" in window ? "on" : "off"}`, "AudioDecoder" in window ? "ok" : "warn"]);
  $("env").innerHTML = chips.map(([t, c, title]) => `<span class="chip ${c}"${title ? ` title="${esc2(title)}"` : ""}>${esc2(t)}</span>`).join("");
  if (!fsa || !("Worker" in window)) {
    const n = $("unsupported");
    n.hidden = false;
    n.textContent = "This browser can't save files to a folder. Use Chrome or Edge on Windows or macOS.";
  }
  $("version").textContent = `Volume Fix ${VERSION}`;
  $("curve").textContent = curveMeasured ? `${curve.version} (measured on this computer)` : `${curve.version} (default)`;
  $("curve-opt").textContent = curveMeasured ? `measured on this computer (${curve.version})` : `the default, measured on Office 365 PowerPoint 16 (${curve.version})`;
}
setupEnv();
setupDrop();
setupOptions();
$("pick-out").onclick = pickOutDir;
$("save-media").onclick = () => saveAllMedia();
$("write").onclick = writeAll;
restoreOutDir();
render();
window.__pptxLeveler = {
  batch,
  addFiles,
  setOutDir: async (h) => {
    outDir = h;
    outGranted = true;
    render();
  },
  writeAll,
  saveAllMedia,
  idle: () => !batch.analysing && !writing
};
