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
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb - cd[i2];
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
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
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
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i2 = 0; i2 < d.length; ++i2) {
    if (d[i2])
      t.push({ s: i2, f: d[i2] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i22].f ? i0++ : i22++];
    r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i2 = 1; i2 < s; ++i2) {
    if (t2[i2].s > maxSym)
      maxSym = t2[i2].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i2 = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i2 < s; ++i2) {
      var i2_1 = t2[i2].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i2].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i2;
    }
    for (; i2 >= 0 && dt; --i2) {
      var i2_3 = t2[i2].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i2 = 1; i2 <= s; ++i2) {
    if (c[i2] == cln && i2 != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i2];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i2 = 0; i2 < cl.length; ++i2)
    l += cf[i2] * cl[i2];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i2 = 0; i2 < s; ++i2)
    out[o + i2 + 4] = dat[i2];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i2 = 0; i2 < lclt.length; ++i2)
    ++lcfreq[lclt[i2] & 31];
  for (var i2 = 0; i2 < lcdt.length; ++i2)
    ++lcfreq[lcdt[i2] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i2 = 0; i2 < nlcc; ++i2)
      wbits(out, p + 3 * i2, lct[clim[i2]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i2 = 0; i2 < clct.length; ++i2) {
        var len = clct[i2] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i2 = 0; i2 < li; ++i2) {
    var sym = syms[i2];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i3) {
      return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i2 + 2 < s; ++i2) {
      var hv = hsh(i2);
      var imod = i2 & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i2) {
        var rem = s - i2;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
          li = lc_1 = eb = 0, bs = i2;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i2 - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i2);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i2 + l] == dat[i2 + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i2 - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i2 + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i2];
          ++lf[dat[i2]];
        }
      }
    }
    for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
      syms[li++] = dat[i2];
      ++lf[dat[i2]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i2, st.w = wi;
    }
  } else {
    for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
      var e = i2 + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i2, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
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
    const crc322 = dv.getUint32(p + 16, true);
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
      crc32: crc322,
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

// src/core/zip-writer.js
var U32_MAX2 = 4294967295;
var SIG_CDH2 = 33639248;
function dosDateTime(d) {
  return {
    time: d.getHours() << 11 | d.getMinutes() << 5 | d.getSeconds() >> 1,
    date: d.getFullYear() - 1980 << 9 | d.getMonth() + 1 << 5 | d.getDate()
  };
}
var CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 4294967295;
  for (let i2 = 0; i2 < bytes.length; i2++) c = CRC_TABLE[(c ^ bytes[i2]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
var ZipWriteError = class extends Error {
};
function setU64(dv, off, n) {
  dv.setUint32(off, n % 2 ** 32, true);
  dv.setUint32(off + 4, Math.floor(n / 2 ** 32), true);
}
async function* rewriteZip(zip, replacements, { chunkSize = 8 << 20, level = 6, additions = /* @__PURE__ */ new Map() } = {}) {
  for (const name of replacements.keys()) {
    if (!zip.has(name)) throw new ZipWriteError(`cannot replace missing entry ${name}`);
  }
  const physical = [...zip.entries].sort((a, b) => a.localHeaderOffset - b.localHeaderOffset);
  const newCd = /* @__PURE__ */ new Map();
  let pos = 0;
  for (const e of physical) {
    const offset = pos;
    if (offset > U32_MAX2) throw new ZipWriteError("output needs zip64 offsets (over 4 GB); not supported in v1");
    const repl = replacements.get(e.name);
    if (repl) {
      if (e.zip64) throw new ZipWriteError(`cannot replace zip64 entry ${e.name}`);
      const method = e.method === 0 ? 0 : 8;
      const data = method === 8 ? deflateSync(repl, { level }) : repl;
      const crc = crc32(repl);
      const flags = e.flags & 2048;
      const orig = new DataView(e.cdRecord.buffer, e.cdRecord.byteOffset, e.cdRecord.byteLength);
      const lh = new Uint8Array(30 + e.nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 67324752, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, flags, true);
      lv.setUint16(8, method, true);
      lv.setUint16(10, orig.getUint16(12, true), true);
      lv.setUint16(12, orig.getUint16(14, true), true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, repl.length, true);
      lv.setUint16(26, e.nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(e.nameBytes, 30);
      yield lh;
      yield data;
      pos += lh.length + data.length;
      const rec = e.cdRecord.slice();
      const rv = new DataView(rec.buffer);
      rv.setUint16(6, 20, true);
      rv.setUint16(8, flags, true);
      rv.setUint16(10, method, true);
      rv.setUint32(16, crc, true);
      rv.setUint32(20, data.length, true);
      rv.setUint32(24, repl.length, true);
      rv.setUint32(42, offset, true);
      newCd.set(e, rec);
    } else {
      const { start, end } = await e.localSpan();
      for (let p = start; p < end; p += chunkSize) {
        const chunk = await zip.source.read(p, Math.min(chunkSize, end - p));
        yield chunk;
      }
      pos += end - start;
      const rec = e.cdRecord.slice();
      const rv = new DataView(rec.buffer);
      if (e.lhoField > 0) rv.setUint32(e.lhoField, offset, true);
      else setU64(rv, -e.lhoField, offset);
      newCd.set(e, rec);
    }
  }
  const addedCd = [];
  const enc4 = new TextEncoder();
  const { time, date } = dosDateTime(/* @__PURE__ */ new Date());
  for (const [name, bytes] of additions) {
    if (zip.has(name)) throw new ZipWriteError(`cannot add existing entry ${name}`);
    const offset = pos;
    if (offset > U32_MAX2) throw new ZipWriteError("output needs zip64 offsets (over 4 GB); not supported in v1");
    const nameBytes = enc4.encode(name);
    const data = deflateSync(bytes, { level });
    const crc = crc32(bytes);
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 67324752, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 2048, true);
    lv.setUint16(8, 8, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, bytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lh.set(nameBytes, 30);
    yield lh;
    yield data;
    pos += lh.length + data.length;
    const rec = new Uint8Array(46 + nameBytes.length);
    const rv = new DataView(rec.buffer);
    rv.setUint32(0, SIG_CDH2, true);
    rv.setUint16(4, 20, true);
    rv.setUint16(6, 20, true);
    rv.setUint16(8, 2048, true);
    rv.setUint16(10, 8, true);
    rv.setUint16(12, time, true);
    rv.setUint16(14, date, true);
    rv.setUint32(16, crc, true);
    rv.setUint32(20, data.length, true);
    rv.setUint32(24, bytes.length, true);
    rv.setUint16(28, nameBytes.length, true);
    rv.setUint32(42, offset, true);
    rec.set(nameBytes, 46);
    addedCd.push(rec);
  }
  const cdOffset = pos;
  let cdSize = 0;
  for (const e of zip.entries) {
    const rec = newCd.get(e);
    yield rec;
    cdSize += rec.length;
  }
  for (const rec of addedCd) {
    yield rec;
    cdSize += rec.length;
  }
  const count = zip.entries.length + addedCd.length;
  if (cdOffset > U32_MAX2 || cdSize > U32_MAX2 || count > 65535) {
    throw new ZipWriteError("output needs zip64 (over 4 GB or 65535 entries); not supported in v1");
  }
  const eocd = new Uint8Array(22 + zip.comment.length);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 101010256, true);
  ev.setUint16(8, count, true);
  ev.setUint16(10, count, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);
  ev.setUint16(20, zip.comment.length, true);
  eocd.set(zip.comment, 22);
  yield eocd;
}
async function rewriteZipToBytes(zip, replacements, o) {
  const parts = [];
  for await (const c of rewriteZip(zip, replacements, o)) parts.push(c.slice());
  const out = new Uint8Array(parts.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of parts) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

// src/core/wav.js
var FMT_PCM = 1;
var FMT_FLOAT = 3;
var FMT_EXTENSIBLE = 65534;
function fourcc(dv, off) {
  return String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));
}
function parseWavHeader(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 12 || fourcc(dv, 0) !== "RIFF" || fourcc(dv, 8) !== "WAVE") throw new Error("Not a RIFF/WAVE file");
  let p = 12;
  let fmt = null;
  while (p + 8 <= bytes.length) {
    const id = fourcc(dv, p);
    const size = dv.getUint32(p + 4, true);
    const body = p + 8;
    if (id === "fmt ") {
      let tag = dv.getUint16(body, true);
      const channels = dv.getUint16(body + 2, true);
      const sampleRate = dv.getUint32(body + 4, true);
      const blockAlign = dv.getUint16(body + 12, true);
      const bitsPerSample = dv.getUint16(body + 14, true);
      let channelMask = null;
      if (tag === FMT_EXTENSIBLE && size >= 40) {
        channelMask = dv.getUint32(body + 20, true);
        tag = dv.getUint16(body + 24, true);
      }
      if (tag !== FMT_PCM && tag !== FMT_FLOAT) throw new Error(`Unsupported WAV format tag ${tag}`);
      fmt = { format: tag === FMT_FLOAT ? "float" : "pcm", channels, sampleRate, blockAlign, bitsPerSample, channelMask };
    } else if (id === "data") {
      if (!fmt) throw new Error("WAV data chunk before fmt chunk");
      const dataLength = Math.min(size, bytes.length - body);
      return { ...fmt, dataOffset: body, dataLength, frames: Math.floor(dataLength / fmt.blockAlign) };
    }
    p = body + size + (size & 1);
  }
  throw new Error("WAV has no data chunk");
}
function decodeWav(bytes) {
  const h = parseWavHeader(bytes);
  return { sampleRate: h.sampleRate, channels: pcmToPlanar(bytes, h, h.dataOffset, h.frames), header: h };
}
function pcmToPlanar(bytes, h, start, frames) {
  const { channels: C, bitsPerSample: bits2, blockAlign } = h;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out = Array.from({ length: C }, () => new Float32Array(frames));
  const bps = bits2 / 8;
  for (let f = 0; f < frames; f++) {
    const base = start + f * blockAlign;
    for (let c = 0; c < C; c++) {
      const o = base + c * bps;
      let v;
      if (h.format === "float") v = bits2 === 64 ? dv.getFloat64(o, true) : dv.getFloat32(o, true);
      else if (bits2 === 16) v = dv.getInt16(o, true) / 32768;
      else if (bits2 === 24) v = ((dv.getUint8(o + 2) << 24 | dv.getUint8(o + 1) << 16 | dv.getUint8(o) << 8) >> 8) / 8388608;
      else if (bits2 === 32) v = dv.getInt32(o, true) / 2147483648;
      else if (bits2 === 8) v = (dv.getUint8(o) - 128) / 128;
      else throw new Error(`Unsupported bit depth ${bits2}`);
      out[c][f] = v;
    }
  }
  return out;
}
function encodeWav(channels, sampleRate, { bits: bits2 = 24, float = false } = {}) {
  if (float) bits2 = 32;
  const C = channels.length;
  const frames = channels[0].length;
  const bps = bits2 / 8;
  const blockAlign = C * bps;
  const dataLen = frames * blockAlign;
  const buf = new Uint8Array(44 + dataLen + (dataLen & 1));
  const dv = new DataView(buf.buffer);
  const w4 = (o2, s) => {
    for (let i2 = 0; i2 < 4; i2++) buf[o2 + i2] = s.charCodeAt(i2);
  };
  w4(0, "RIFF");
  dv.setUint32(4, buf.length - 8, true);
  w4(8, "WAVE");
  w4(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, float ? FMT_FLOAT : FMT_PCM, true);
  dv.setUint16(22, C, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, bits2, true);
  w4(36, "data");
  dv.setUint32(40, dataLen, true);
  let o = 44;
  for (let f = 0; f < frames; f++) {
    for (let c = 0; c < C; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][f]));
      if (float) dv.setFloat32(o, v, true);
      else if (bits2 === 16) dv.setInt16(o, Math.round(v * 32767), true);
      else if (bits2 === 24) {
        const i2 = Math.round(v * 8388607);
        buf[o] = i2 & 255;
        buf[o + 1] = i2 >> 8 & 255;
        buf[o + 2] = i2 >> 16 & 255;
      } else throw new Error(`Unsupported bit depth ${bits2}`);
      o += bps;
    }
  }
  return buf;
}

// src/core/xml.js
var XML_NS = "http://www.w3.org/XML/1998/namespace";
var XMLNS_NS = "http://www.w3.org/2000/xmlns/";
var NS = {
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  p14: "http://schemas.microsoft.com/office/powerpoint/2010/main",
  mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships"
};
var XmlError = class extends Error {
};
var ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeEntities(s) {
  if (!s.includes("&")) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, ent) => {
    if (ent[0] === "#") {
      const code = ent[1] === "x" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[ent] ?? m;
  });
}
function splitQName(name) {
  const i2 = name.indexOf(":");
  return i2 < 0 ? ["", name] : [name.slice(0, i2), name.slice(i2 + 1)];
}
var WS = /* @__PURE__ */ new Set([" ", "	", "\n", "\r"]);
var NAME_END = /* @__PURE__ */ new Set([" ", "	", "\n", "\r", "/", ">", "="]);
function parseXml(text) {
  const doc = { name: "#document", children: [], parent: null, scope: { xml: XML_NS } };
  const stack = [doc];
  let i2 = 0;
  const n = text.length;
  const skipPast = (marker, from) => {
    const j = text.indexOf(marker, from);
    if (j < 0) throw new XmlError(`Unterminated construct, expected "${marker}"`);
    return j + marker.length;
  };
  while (i2 < n) {
    const lt = text.indexOf("<", i2);
    if (lt < 0) break;
    const c1 = text[lt + 1];
    if (c1 === "?") {
      i2 = skipPast("?>", lt + 2);
      continue;
    }
    if (c1 === "!") {
      if (text.startsWith("<!--", lt)) {
        i2 = skipPast("-->", lt + 4);
        continue;
      }
      if (text.startsWith("<![CDATA[", lt)) {
        i2 = skipPast("]]>", lt + 9);
        continue;
      }
      i2 = skipPast(">", lt + 2);
      continue;
    }
    if (c1 === "/") {
      const gt = text.indexOf(">", lt + 2);
      if (gt < 0) throw new XmlError("Unterminated end tag");
      const name2 = text.slice(lt + 2, gt).trim();
      const el2 = stack.pop();
      if (!el2 || el2.name !== name2) {
        throw new XmlError(`Mismatched end tag </${name2}> at ${lt}, expected </${el2?.name}>`);
      }
      el2.end = gt + 1;
      i2 = gt + 1;
      continue;
    }
    let j = lt + 1;
    while (j < n && !NAME_END.has(text[j])) j++;
    const name = text.slice(lt + 1, j);
    const attrs = [];
    let selfClosing = false;
    for (; ; ) {
      while (j < n && WS.has(text[j])) j++;
      if (j >= n) throw new XmlError("Unterminated start tag");
      if (text[j] === ">") {
        j++;
        break;
      }
      if (text[j] === "/" && text[j + 1] === ">") {
        j += 2;
        selfClosing = true;
        break;
      }
      const aStart = j;
      while (j < n && !NAME_END.has(text[j])) j++;
      const aName = text.slice(aStart, j);
      while (j < n && WS.has(text[j])) j++;
      if (text[j] !== "=") throw new XmlError(`Expected "=" after attribute ${aName} at ${j}`);
      j++;
      while (j < n && WS.has(text[j])) j++;
      const q = text[j];
      if (q !== '"' && q !== "'") throw new XmlError(`Expected quote for attribute ${aName} at ${j}`);
      const vEnd = text.indexOf(q, j + 1);
      if (vEnd < 0) throw new XmlError(`Unterminated attribute value for ${aName}`);
      attrs.push({ name: aName, start: aStart, valueStart: j + 1, valueEnd: vEnd, value: decodeEntities(text.slice(j + 1, vEnd)) });
      j = vEnd + 1;
    }
    const parent = stack[stack.length - 1];
    let scope = parent.scope;
    for (const a of attrs) {
      if (a.name === "xmlns" || a.name.startsWith("xmlns:")) {
        if (scope === parent.scope) scope = Object.create(parent.scope);
        scope[a.name === "xmlns" ? "" : a.name.slice(6)] = a.value;
      }
    }
    const [prefix, local] = splitQName(name);
    const ns = scope[prefix] ?? null;
    if (prefix && ns == null) throw new XmlError(`Undeclared namespace prefix "${prefix}" on <${name}>`);
    for (const a of attrs) {
      const [ap, al] = splitQName(a.name);
      a.prefix = ap;
      a.local = al;
      a.ns = a.name === "xmlns" || ap === "xmlns" ? XMLNS_NS : ap ? scope[ap] ?? null : null;
    }
    const el = { name, prefix, local, ns, attrs, start: lt, tagEnd: j, end: selfClosing ? j : -1, parent, children: [], scope };
    parent.children.push(el);
    if (!selfClosing) stack.push(el);
    i2 = j;
  }
  if (stack.length !== 1) throw new XmlError(`Unclosed element <${stack[stack.length - 1].name}>`);
  const root = doc.children[0];
  if (!root) throw new XmlError("No root element");
  return { root, text };
}
function is(el, ns, local) {
  return el.ns === ns && el.local === local;
}
function children(el, ns, local) {
  return el.children.filter((c) => is(c, ns, local));
}
function child(el, ns, local) {
  return el.children.find((c) => is(c, ns, local)) ?? null;
}
function path(el, ...steps) {
  let cur = el;
  for (const [ns, local] of steps) {
    cur = cur && child(cur, ns, local);
  }
  return cur ?? null;
}
function descendants(el, ns, local, out = []) {
  for (const c of el.children) {
    if (is(c, ns, local)) out.push(c);
    descendants(c, ns, local, out);
  }
  return out;
}
function ancestor(el, ns, local) {
  for (let p = el.parent; p; p = p.parent) if (is(p, ns, local)) return p;
  return null;
}
function attr(el, local, ns = null) {
  return el.attrs.find((a) => a.local === local && a.ns === ns && a.prefix !== "xmlns") ?? null;
}
function attrValue(el, local, ns = null) {
  return attr(el, local, ns)?.value ?? null;
}

// src/core/pptx.js
var P = NS.p;
var A = NS.a;
var R = NS.r;
var P14 = NS.p14;
var MC = NS.mc;
var VOL_SCHEMA_DEFAULT = 5e4;
var PART_RE = /^ppt\/(slides|slideLayouts|slideMasters)\/([^/]+)\.xml$/;
var CONTAINER = { slides: "slide", slideLayouts: "layout", slideMasters: "master" };
var STATUS = {
  OK: "ok",
  LINKED: "skipped-linked",
  MUTED: "skipped-muted",
  VOL0: "skipped-vol0",
  NO_TIMING: "no-timing-node",
  MISSING_MEDIA: "missing-media"
};
function relsPathFor(partName) {
  const i2 = partName.lastIndexOf("/");
  return `${partName.slice(0, i2)}/_rels/${partName.slice(i2 + 1)}.rels`;
}
function resolveTarget(partName, target) {
  let t = target;
  try {
    t = decodeURIComponent(target);
  } catch {
  }
  if (t.startsWith("/")) return t.slice(1);
  const segs = partName.split("/").slice(0, -1);
  for (const s of t.split("/")) {
    if (s === "..") segs.pop();
    else if (s !== "." && s !== "") segs.push(s);
  }
  return segs.join("/");
}
function parseRels(xmlText, partName) {
  const map = /* @__PURE__ */ new Map();
  if (!xmlText) return map;
  const { root } = parseXml(xmlText);
  for (const r of children(root, NS.rel, "Relationship")) {
    const id = attrValue(r, "Id");
    const target = attrValue(r, "Target") ?? "";
    const external = attrValue(r, "TargetMode") === "External";
    map.set(id, {
      id,
      type: attrValue(r, "Type"),
      target,
      external,
      resolved: external ? null : resolveTarget(partName, target)
    });
  }
  return map;
}
function parsePercentage(s) {
  if (s == null) return null;
  const t = s.trim();
  if (t.endsWith("%")) {
    const v2 = Number(t.slice(0, -1));
    return Number.isFinite(v2) ? Math.round(v2 * 1e3) : null;
  }
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v) : null;
}
function parseBool(s, dflt2) {
  if (s == null) return dflt2;
  return s === "1" || s === "true";
}
function parseMs(s) {
  if (s == null) return 0;
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? v : 0;
}
async function readSlideOrder(zip) {
  const order = /* @__PURE__ */ new Map();
  const presName = "ppt/presentation.xml";
  const presXml = await zip.text(presName);
  if (!presXml) return order;
  const rels = parseRels(await zip.text(relsPathFor(presName)), presName);
  const { root } = parseXml(presXml);
  const list = child(root, P, "sldIdLst");
  if (!list) return order;
  let n = 0;
  for (const s of children(list, P, "sldId")) {
    n++;
    const rel = rels.get(attrValue(s, "id", R));
    if (rel?.resolved) order.set(rel.resolved, n);
  }
  return order;
}
function mediaNodeInfo(cm) {
  const volA = attr(cm, "vol");
  const muteA = attr(cm, "mute");
  const cTn = child(cm, P, "cTn");
  return {
    kind: cm.parent?.local ?? null,
    // 'video' | 'audio'
    vol: volA ? parsePercentage(volA.value) : null,
    volRaw: volA?.value ?? null,
    mute: parseBool(muteA?.value, false),
    numSld: attrValue(cm, "numSld"),
    repeatCount: cTn ? attrValue(cTn, "repeatCount") : null,
    // Offsets into the part's XML text, for the string-level writer.
    patch: {
      elementStart: cm.start,
      nameEnd: cm.start + 1 + cm.name.length,
      // insertion point for a new attribute
      vol: volA ? { valueStart: volA.valueStart, valueEnd: volA.valueEnd } : null,
      mute: muteA ? { valueStart: muteA.valueStart, valueEnd: muteA.valueEnd } : null
    }
  };
}
async function readPptx(zip, { fileName = "" } = {}) {
  const slideOrder = await readSlideOrder(zip);
  const deckWarnings = [];
  const parts = [];
  const clips = [];
  if (!zip.has("ppt/presentation.xml")) deckWarnings.push("no-presentation-part");
  const partEntries = zip.entries.map((e) => ({ e, m: PART_RE.exec(e.name) })).filter((x2) => x2.m);
  for (const { e, m } of partEntries) {
    const partName = e.name;
    const container = CONTAINER[m[1]];
    const xml = await zip.text(partName);
    if (!/videoFile|audioFile|cMediaNode/.test(xml)) {
      if (container === "slide") parts.push({ partName, container, slideNumber: slideOrder.get(partName) ?? null, mediaCount: 0 });
      continue;
    }
    const { root } = parseXml(xml);
    const rels = parseRels(await zip.text(relsPathFor(partName)), partName);
    const slideNumber = container === "slide" ? slideOrder.get(partName) ?? null : null;
    const hidden = container === "slide" && attrValue(root, "show") === "0";
    const timing = /* @__PURE__ */ new Map();
    for (const cm of descendants(root, P, "cMediaNode")) {
      const spTgt = path(cm, [P, "tgtEl"], [P, "spTgt"]);
      const spid = spTgt ? attrValue(spTgt, "spid")?.trim() : null;
      if (spid == null) continue;
      if (!timing.has(spid)) timing.set(spid, []);
      timing.get(spid).push(cm);
    }
    const matchedSpids = /* @__PURE__ */ new Set();
    let instance = 0;
    for (const pic of descendants(root, P, "pic")) {
      const nvPr = path(pic, [P, "nvPicPr"], [P, "nvPr"]);
      if (!nvPr) continue;
      const fileEl = child(nvPr, A, "videoFile") ?? child(nvPr, A, "audioFile");
      if (!fileEl) continue;
      if (ancestor(pic, MC, "Fallback")) continue;
      instance++;
      const warnings = [];
      const cNvPr = path(pic, [P, "nvPicPr"], [P, "cNvPr"]);
      const shapeId = cNvPr ? attrValue(cNvPr, "id") : null;
      const shapeName = cNvPr ? attrValue(cNvPr, "name") : null;
      const kind = fileEl.local === "videoFile" ? "video" : "audio";
      const p14media = descendants(nvPr, P14, "media")[0] ?? null;
      const embedId = p14media ? attrValue(p14media, "embed", R) : null;
      const linkId = attrValue(fileEl, "link", R);
      const embedRel = embedId ? rels.get(embedId) ?? null : null;
      const linkRel = linkId ? rels.get(linkId) ?? null : null;
      const mediaRel = embedRel ?? linkRel;
      const linked = mediaRel?.external === true;
      if (embedId && !embedRel) warnings.push("embed-rel-missing");
      if (!mediaRel) warnings.push("no-media-rel");
      const trimEl = p14media ? child(p14media, P14, "trim") : null;
      const fadeEl = p14media ? child(p14media, P14, "fade") : null;
      const trim = { startMs: parseMs(trimEl && attrValue(trimEl, "st")), endMs: parseMs(trimEl && attrValue(trimEl, "end")) };
      const fade = { inMs: parseMs(fadeEl && attrValue(fadeEl, "in")), outMs: parseMs(fadeEl && attrValue(fadeEl, "out")) };
      let mediaPart = null, mediaEntry = null;
      if (mediaRel && !mediaRel.external) {
        mediaPart = mediaRel.resolved;
        const ze = zip.get(mediaPart);
        if (ze) mediaEntry = { size: ze.uncompressedSize, stored: ze.method === 0 };
      }
      const nodes = shapeId != null ? timing.get(shapeId) ?? [] : [];
      if (shapeId != null) matchedSpids.add(shapeId);
      if (nodes.length > 1) warnings.push("multiple-timing-nodes");
      const node = nodes.length ? mediaNodeInfo(nodes[0]) : null;
      if (node && node.kind !== kind) warnings.push(`timing-kind-mismatch:${node.kind}`);
      if (node && node.volRaw == null) warnings.push("vol-absent");
      if (ancestor(pic, MC, "Choice")) warnings.push("in-alternate-content");
      if (ancestor(pic, P, "grpSp")) warnings.push("in-group");
      if (container !== "slide") warnings.push(`on-${container}`);
      if (hidden) warnings.push("hidden-slide");
      const vol = node ? node.vol ?? VOL_SCHEMA_DEFAULT : null;
      let status = STATUS.OK;
      if (linked) status = STATUS.LINKED;
      else if (!mediaEntry) status = STATUS.MISSING_MEDIA;
      else if (!node) status = STATUS.NO_TIMING;
      else if (node.mute) status = STATUS.MUTED;
      else if (vol <= 0) status = STATUS.VOL0;
      clips.push({
        fileName,
        partName,
        container,
        slideNumber,
        instance,
        shapeId,
        shapeName,
        kind,
        mediaPart,
        mediaSize: mediaEntry?.size ?? null,
        mediaStored: mediaEntry?.stored ?? null,
        linkTarget: mediaRel?.external ? mediaRel.target : null,
        trim,
        fade,
        vol,
        volExplicit: node ? node.volRaw != null : false,
        volRaw: node?.volRaw ?? null,
        mute: node?.mute ?? false,
        repeatCount: node?.repeatCount ?? null,
        timingNodes: nodes.length,
        patch: node?.patch ?? null,
        status,
        warnings
      });
    }
    for (const [spid] of timing) {
      if (!matchedSpids.has(spid)) deckWarnings.push(`orphan-timing-node:${partName}#${spid}`);
    }
    parts.push({ partName, container, slideNumber, mediaCount: instance });
  }
  const settings = await readShowSettings(zip);
  const hasVideo = clips.some((c) => c.kind === "video" && c.status !== STATUS.LINKED);
  if (hasVideo && settings.showMediaControls) {
    deckWarnings.push(settings.showMediaControlsExplicit ? "media-controls-shown" : "media-controls-default");
  }
  return { fileName, slideCount: slideOrder.size, parts, clips, settings, warnings: deckWarnings };
}
async function readShowSettings(zip) {
  const out = { showMediaControls: true, showMediaControlsExplicit: false, loop: false, showType: "present" };
  const xml = await zip.text("ppt/presProps.xml");
  if (!xml) return out;
  const { root } = parseXml(xml);
  const showPr = child(root, P, "showPr");
  if (showPr) {
    out.loop = attrValue(showPr, "loop") === "1" || attrValue(showPr, "loop") === "true";
    if (child(showPr, P, "browse")) out.showType = "browse";
    else if (child(showPr, P, "kiosk")) out.showType = "kiosk";
  }
  const ctrl = descendants(root, P14, "showMediaCtrls")[0];
  if (ctrl) {
    const v = attrValue(ctrl, "val");
    out.showMediaControls = !(v === "0" || v === "false");
    out.showMediaControlsExplicit = true;
  }
  return out;
}

// src/core/patch.js
var enc = new TextEncoder();
var dec = new TextDecoder("utf-8", { ignoreBOM: true });

// src/core/tone.js
var enc2 = new TextEncoder();
var dec2 = new TextDecoder("utf-8", { ignoreBOM: true });
function generateTone({ lufs, seconds = 30, sampleRate = 48e3, channels = 2, fadeMs = 0, freq = 1e3 }) {
  if (!Number.isFinite(lufs)) throw new Error("tone level must be a finite LUFS value");
  const amp = Math.min(1, Math.pow(10, lufs / 20));
  const cycles = Math.max(1, Math.round(seconds * freq));
  const n = Math.round(cycles * sampleRate / freq);
  const fade = fadeMs > 0 ? Math.max(1, Math.round(fadeMs / 1e3 * sampleRate)) : 0;
  const x2 = new Float32Array(n);
  for (let i2 = 0; i2 < n; i2++) {
    let g = 1;
    if (i2 < fade) g = 0.5 - 0.5 * Math.cos(Math.PI * i2 / fade);
    else if (fade && i2 >= n - fade) g = 0.5 - 0.5 * Math.cos(Math.PI * (n - 1 - i2) / fade);
    x2[i2] = amp * g * Math.sin(2 * Math.PI * freq * i2 / sampleRate);
  }
  return Array.from({ length: channels }, (_, c) => c === 0 ? x2 : x2.slice());
}
var xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function paragraphs(lines, sz) {
  return lines.map((l) => {
    const rPr = `<a:rPr lang="en-AU"${sz ? ` sz="${sz}"` : ""} dirty="0"/>`;
    return `<a:p><a:r>${rPr}<a:t>${xmlEsc(l)}</a:t></a:r></a:p>`;
  }).join("");
}
function setPlaceholderText(xml, phType, lines, sz) {
  const { root } = parseXml(xml);
  const sp = descendants(root, NS.p, "sp").find((s) => {
    const ph = path(s, [NS.p, "nvSpPr"], [NS.p, "nvPr"], [NS.p, "ph"]);
    return ph && attrValue(ph, "type") === phType;
  });
  if (!sp) throw new Error(`template slide has no ${phType} placeholder`);
  const tx = child(sp, NS.p, "txBody");
  const paras = tx.children.filter((c) => c.ns === NS.a && c.local === "p");
  if (!paras.length) throw new Error(`${phType} placeholder has no paragraph`);
  const start = paras[0].start;
  const end = paras[paras.length - 1].end;
  return xml.slice(0, start) + paragraphs(lines, sz) + xml.slice(end);
}
function setPlayDuration(xml, ms) {
  return xml.replace(/(<p:cmd\b[^>]*\bcmd="playFrom[^"]*"[^>]*>\s*<p:cBhvr>\s*<p:cTn\b[^>]*?\bdur=")\d+(")/g, (m, a, b) => `${a}${Math.round(ms)}${b}`);
}

// src/core/volume-curve.js
var VOL_MAX = 1e5;
function validateCurve(curve) {
  if (!curve || typeof curve.version !== "string") throw new Error("volume curve: missing version");
  if (curve.type === "amplitude") return curve;
  if (curve.type !== "table") throw new Error(`volume curve: unknown type ${curve.type}`);
  const pts = [...curve.points].sort((a, b) => a[0] - b[0]);
  if (pts.length < 2) throw new Error("volume curve: need at least 2 points");
  for (let i2 = 0; i2 < pts.length; i2++) {
    const [v, db] = pts[i2];
    if (!(v > 0 && v <= VOL_MAX) || !Number.isFinite(db)) throw new Error(`volume curve: bad point ${pts[i2]}`);
    if (i2 && !(v > pts[i2 - 1][0] && db > pts[i2 - 1][1])) throw new Error("volume curve: points must be strictly increasing in vol and dB");
  }
  if (pts[pts.length - 1][0] !== VOL_MAX || pts[pts.length - 1][1] !== 0) throw new Error("volume curve: last point must be [100000, 0]");
  return { ...curve, points: pts };
}
function interp(x2, xs, ys) {
  let i2 = 1;
  while (i2 < xs.length - 1 && x2 > xs[i2]) i2++;
  const t = (x2 - xs[i2 - 1]) / (xs[i2] - xs[i2 - 1]);
  return ys[i2 - 1] + t * (ys[i2] - ys[i2 - 1]);
}
function volToDb(vol, curve) {
  if (!(vol > 0)) return -Infinity;
  if (curve.type === "amplitude") return 20 * Math.log10(vol / VOL_MAX);
  const xs = curve.points.map((p) => Math.log10(p[0]));
  const ys = curve.points.map((p) => p[1]);
  return interp(Math.log10(vol), xs, ys);
}

// src/core/calibration.js
var CAL_STEPS = [1e5, 9e4, 8e4, 7e4, 6e4, 5e4, 4e4, 3e4, 25e3, 2e4, 15e3, 1e4, 7e3, 5e3, 3e3, 2e3, 1e3, 1e5];
var CAL_TONE_LUFS = -6;
var CAL_SILENCE_S = 0.5;
var CAL_TONE_S = 3.5;
var CAL_ADVANCE_S = 4.5;
var CALIBRATION_DECK_NAME = "VOLUME_CALIBRATION.pptx";
var enc3 = new TextEncoder();
var dec3 = new TextDecoder("utf-8", { ignoreBOM: true });
var SLIDE_CT = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
var SLIDE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide";
var pctLabel = (vol) => `${+(vol / 1e3).toFixed(1)}%`;
function calibrationWav(channels) {
  const fs = 48e3;
  const silence = Math.round(CAL_SILENCE_S * fs);
  const tone = generateTone({ lufs: CAL_TONE_LUFS, seconds: CAL_TONE_S, sampleRate: fs, channels, fadeMs: 5 });
  const out = tone.map((t) => {
    const x2 = new Float32Array(silence + t.length);
    x2.set(t, silence);
    return x2;
  });
  return encodeWav(out, fs, { bits: 24 });
}
var rand32 = () => Math.floor(Math.random() * 4294967294) + 1;
var guid = () => "{" + [8, 4, 4, 4, 12].map((n) => Array.from({ length: n }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("")).join("-") + "}";
function stepSlideXml(xml, vol, k, n) {
  let s = xml.replace(/(<p:cMediaNode\b[^>]*?\bvol=")[^"]*(")/, `$1${vol}$2`).replace(/ repeatCount="indefinite"/g, "").replace(/<p:transition\b[^>]*\/>|<p:transition\b[\s\S]*?<\/p:transition>/g, "").replace(/<p:timing>/, `<p:transition spd="fast" advTm="${Math.round(CAL_ADVANCE_S * 1e3)}"/><p:timing>`).replace(/(<p14:creationId\b[^>]*\bval=")\d+(")/g, (m, a, b) => `${a}${rand32()}${b}`).replace(/(<a16:creationId\b[^>]*\bid=")\{[0-9A-Fa-f-]+\}(")/g, (m, a, b) => `${a}${guid()}${b}`);
  if (!/<p:cMediaNode\b[^>]*\bvol=/.test(s)) s = s.replace(/<p:cMediaNode\b/, `<p:cMediaNode vol="${vol}"`);
  s = setPlayDuration(s, (CAL_SILENCE_S + CAL_TONE_S) * 1e3);
  s = setPlaceholderText(s, "ctrTitle", [`Calibration step ${k + 1} of ${n} \xB7 volume ${pctLabel(vol)}`]);
  s = setPlaceholderText(s, "subTitle", [
    k === 0 ? "Start your loopback recording, then start this slide show. It advances on its own." : `Step ${k + 1}: the same tone at ${pctLabel(vol)} volume.`,
    `Each step: ${CAL_SILENCE_S} s silence, then ${CAL_TONE_S} s of 1 kHz tone. ${n} steps, about ${Math.round(n * CAL_ADVANCE_S)} s in total.`,
    k === n - 1 ? "Last step (100% again, to check nothing changed). Stop the recording after this tone." : "Don't touch any volume control until the run has finished."
  ], 1400);
  return s;
}
async function buildCalibrationDeck(templateZip, { steps = CAL_STEPS } = {}) {
  const deck = await readPptx(templateZip, { fileName: "template" });
  const clips = deck.clips.filter((c) => c.container === "slide" && c.mediaPart).sort((a, b) => a.slideNumber - b.slideNumber);
  if (clips.length < 2) throw new Error("template needs two slides with audio");
  const [first, second] = clips;
  const n = steps.length;
  const replacements = /* @__PURE__ */ new Map();
  const additions = /* @__PURE__ */ new Map();
  const text = async (name) => dec3.decode(await templateZip.get(name).bytes());
  const relsOf = (part) => part.replace(/([^/]+)$/, "_rels/$1.rels");
  replacements.set(first.mediaPart, calibrationWav(1));
  replacements.set(second.mediaPart, calibrationWav(2));
  const baseXml = await text(second.partName);
  const baseRels = await text(relsOf(second.partName));
  replacements.set(first.partName, enc3.encode(stepSlideXml(await text(first.partName), steps[0], 0, n)));
  replacements.set(second.partName, enc3.encode(stepSlideXml(baseXml, steps[1], 1, n)));
  const pres = await text("ppt/presentation.xml");
  const presRels = await text("ppt/_rels/presentation.xml.rels");
  const types = await text("[Content_Types].xml");
  let maxId = Math.max(...[...pres.matchAll(/<p:sldId\b[^>]*\bid="(\d+)"/g)].map((m) => Number(m[1])));
  const dir = second.partName.replace(/[^/]+$/, "");
  const sldIds = [], rels = [], overrides = [];
  for (let k = 2; k < n; k++) {
    const part = `${dir}calibration${k + 1}.xml`;
    additions.set(part, enc3.encode(stepSlideXml(baseXml, steps[k], k, n)));
    additions.set(relsOf(part), enc3.encode(baseRels));
    const rId = `rIdCal${k + 1}`;
    sldIds.push(`<p:sldId id="${++maxId}" r:id="${rId}"/>`);
    rels.push(`<Relationship Id="${rId}" Type="${SLIDE_REL}" Target="${part.replace(/^ppt\//, "")}"/>`);
    overrides.push(`<Override PartName="/${part}" ContentType="${SLIDE_CT}"/>`);
  }
  if (!pres.includes("</p:sldIdLst>")) throw new Error("template has no slide list");
  replacements.set("ppt/presentation.xml", enc3.encode(pres.replace("</p:sldIdLst>", sldIds.join("") + "</p:sldIdLst>")));
  replacements.set("ppt/_rels/presentation.xml.rels", enc3.encode(presRels.replace("</Relationships>", rels.join("") + "</Relationships>")));
  replacements.set("[Content_Types].xml", enc3.encode(types.replace("</Types>", overrides.join("") + "</Types>")));
  const props = await templateZip.text("ppt/presProps.xml");
  if (props) {
    replacements.set("ppt/presProps.xml", enc3.encode(props.replace(/ useTimings="[^"]*"/, ' useTimings="1"').replace(/ loop="1"/, ' loop="0"')));
  }
  return { replacements, additions, steps };
}
function analyzeCalibration(planar, fs, { steps = CAL_STEPS, silenceDb = -120, minToneS = 1.5, trimS = 0.3 } = {}) {
  const win = Math.max(1, Math.round(fs * 0.02));
  const n = planar[0].length;
  const thr = Math.pow(10, silenceDb / 10);
  const nWin = Math.floor(n / win);
  const active = new Uint8Array(nWin);
  for (let w = 0; w < nWin; w++) {
    let m = 0;
    for (const ch of planar) {
      let s = 0;
      for (let i2 = w * win, e = i2 + win; i2 < e; i2++) s += ch[i2] * ch[i2];
      m = Math.max(m, s / win);
    }
    active[w] = m > thr ? 1 : 0;
  }
  const runs = [];
  const bridge = Math.round(0.1 / 0.02);
  let start = -1, lastOn = -1;
  for (let w = 0; w <= nWin; w++) {
    if (w < nWin && active[w]) {
      if (start < 0) start = w;
      lastOn = w;
    } else if (start >= 0 && (w === nWin || w - lastOn > bridge)) {
      runs.push([start * win, (lastOn + 1) * win]);
      start = -1;
    }
  }
  const segments = runs.filter(([a, b]) => (b - a) / fs >= minToneS).map(([a, b]) => {
    const t = Math.round(trimS * fs);
    const s0 = a + t, s1 = b - t;
    let sum = 0;
    for (const ch of planar) for (let i2 = s0; i2 < s1; i2++) sum += ch[i2] * ch[i2];
    const ms = sum / ((s1 - s0) * planar.length);
    return { startS: a / fs, endS: b / fs, levelDb: 10 * Math.log10(ms) };
  });
  if (segments.length !== steps.length) {
    return {
      ok: false,
      segments,
      error: `Found ${segments.length} tone burst${segments.length === 1 ? "" : "s"}; the calibration deck has ${steps.length}. Record the whole run from the first slide to the last, with nothing else playing.`
    };
  }
  const ref = segments[0].levelDb;
  const driftDb = segments[segments.length - 1].levelDb - ref;
  const byVol = /* @__PURE__ */ new Map();
  steps.forEach((vol, k) => {
    if (k === steps.length - 1 || vol === 1e5) return;
    byVol.set(vol, segments[k].levelDb - ref);
  });
  const points = [...byVol].sort((a, b) => a[0] - b[0]).map(([v, db]) => [v, Math.round(db * 100) / 100]);
  points.push([1e5, 0]);
  for (let i2 = 1; i2 < points.length; i2++) {
    if (!(points[i2][1] > points[i2 - 1][1])) {
      return { ok: false, segments, error: `The level didn't fall at every step (${pctLabel(points[i2 - 1][0])} vs ${pctLabel(points[i2][0])}). Was a volume changed during the run?` };
    }
  }
  const curve = validateCurve({
    version: `measured-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`,
    description: "Measured with a Volume Fix calibration deck and a loopback recording.",
    type: "table",
    points,
    measuredAt: (/* @__PURE__ */ new Date()).toISOString(),
    driftDb: Math.round(driftDb * 100) / 100
  });
  const maxDeviationDb = Math.max(...points.map(([v, db]) => Math.abs(db - 20 * Math.log10(v / 1e5))));
  return { ok: true, points, driftDb, segments, curve, maxDeviationDb };
}

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

// config/volume-curve.json
var volume_curve_default = {
  version: "ppt16-measured-2026-11-11",
  description: "Measured with the Volume Fix calibration deck and a WASAPI loopback recording on Office 365 PowerPoint 16.0.20527: PowerPoint's per-clip vol is linear amplitude, dB = 20*log10(vol/100000). All 17 steps from 100% to 1% matched the formula to within 0.01 dB, and the drift check was 0.000 dB.",
  powerpoint: "Office 365 PowerPoint 16.0.20527 (Windows 11)",
  type: "amplitude",
  measuredAt: "2026-11-11",
  measuredPoints: [[1e3, -40], [2e3, -33.98], [3e3, -30.46], [5e3, -26.02], [7e3, -23.1], [1e4, -20], [15e3, -16.48], [2e4, -13.98], [25e3, -12.04], [3e4, -10.46], [4e4, -7.96], [5e4, -6.02], [6e4, -4.44], [7e4, -3.1], [8e4, -1.94], [9e4, -0.92], [1e5, 0]]
};

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
function saveCurve(curve) {
  const valid = validateCurve(curve);
  localStorage.setItem(KEY, JSON.stringify(valid));
  return valid;
}
function clearCurve() {
  try {
    localStorage.removeItem(KEY);
  } catch {
  }
}

// src/ui/calibrate.js
var VERSION = true ? "0.4.0" : "dev";
var $ = (id) => document.getElementById(id);
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var n1 = (x2) => x2 == null || !Number.isFinite(x2) ? "\u2013" : x2.toFixed(1).replace("-", "\u2212");
var pct = (v) => `${+(v / 1e3).toFixed(1)}%`;
var result = null;
function showActive() {
  const { curve, measured } = loadCurve();
  $("active-curve").textContent = measured ? `a curve measured on this computer (${curve.version})` : `the default, measured on Office 365 PowerPoint 16 (${curve.version})`;
  $("reset").hidden = !measured;
}
$("deck-desc").textContent = `${CAL_STEPS.length} slides: the same 1 kHz tone at volume ${CAL_STEPS.slice(0, -1).map(pct).join(", ")}, then 100% again to check nothing changed. Each slide plays for ${CAL_ADVANCE_S} s and advances on its own. The tone is loud in the file (${CAL_TONE_LUFS} LUFS) so the quietest steps can still be measured.`;
$("make-deck").onclick = async () => {
  const s = $("deck-status");
  s.textContent = "Building\u2026";
  try {
    const res = await fetch("assets/reference_template.pptx");
    if (!res.ok) throw new Error(`template not found (HTTP ${res.status})`);
    const zip = await openZip(blobSource(await res.blob()));
    const { replacements, additions } = await buildCalibrationDeck(zip);
    const bytes = await rewriteZipToBytes(zip, replacements, { additions });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: CALIBRATION_DECK_NAME });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 6e4);
    s.textContent = `Saved ${CALIBRATION_DECK_NAME} to your downloads.`;
  } catch (e) {
    s.textContent = `Couldn't build the deck: ${e.message}`;
  }
};
function chart(points) {
  const W = 640, H = 260, L = 48, R2 = 12, T = 12, B = 34;
  const minDb = Math.min(-40, Math.floor(Math.min(...points.map((p) => p[1]), volToDb(CAL_STEPS.at(-2), DEFAULT_CURVE)) / 10) * 10);
  const x2 = (v) => L + v / 1e5 * (W - L - R2);
  const y = (db) => T + db / minDb * (H - T - B);
  const vols = [.../* @__PURE__ */ new Set([1e3, ...points.map((p) => p[0])])].sort((a, b) => a - b);
  const line = (fn) => vols.map((v) => `${x2(v).toFixed(1)},${y(fn(v)).toFixed(1)}`).join(" ");
  const measured = new Map(points);
  let grid = "";
  for (let db = 0; db >= minDb; db -= 10) grid += `<line x1="${L}" x2="${W - R2}" y1="${y(db)}" y2="${y(db)}" class="g"/><text x="${L - 6}" y="${y(db) + 4}" text-anchor="end">${db}</text>`;
  for (let v = 0; v <= 1e5; v += 2e4) grid += `<text x="${x2(v)}" y="${H - 12}" text-anchor="middle">${v / 1e3}%</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Measured level against volume setting, compared with the default curve">
<style>.g{stroke:var(--line)} text{fill:var(--muted);font-size:11px} .d{fill:none;stroke:var(--muted);stroke-width:1.5;stroke-dasharray:4 4} .m{fill:none;stroke:var(--accent);stroke-width:2.5} .p{fill:var(--accent)}</style>
${grid}
<polyline class="d" points="${line((v) => volToDb(v, DEFAULT_CURVE))}"/>
<polyline class="m" points="${points.map(([v, db]) => `${x2(v).toFixed(1)},${y(db).toFixed(1)}`).join(" ")}"/>
${points.map(([v, db]) => `<circle class="p" cx="${x2(v).toFixed(1)}" cy="${y(db).toFixed(1)}" r="3"/>`).join("")}
<text x="${x2(1e4) + 10}" y="${y(measured.get(1e4) ?? -20) + 4}" text-anchor="start" style="fill:var(--accent)">Measured</text>
<text x="${x2(3e4)}" y="${y(volToDb(3e4, DEFAULT_CURVE)) + 16}" text-anchor="start">Default</text>
<text x="10" y="${T + 4}" transform="rotate(-90 10 ${T + 4})" text-anchor="end">dB</text>
</svg>`;
}
async function analyse(file) {
  $("error").hidden = true;
  $("result").hidden = true;
  result = null;
  try {
    if (!/\.wav$/i.test(file.name)) throw new Error("Please export the recording as a WAV file.");
    const { sampleRate, channels } = decodeWav(new Uint8Array(await file.arrayBuffer()));
    const r = analyzeCalibration(channels, sampleRate);
    if (!r.ok) throw new Error(r.error);
    result = r;
    const metrics = [
      ["Steps found", `${r.segments.length} of ${CAL_STEPS.length}`, "Every tone burst was found"],
      ["Drift", `${n1(r.driftDb)} dB`, Math.abs(r.driftDb) <= 0.2 ? "First and last 100% match" : "Something changed during the run; consider recording again"],
      ["Largest difference", `${n1(r.maxDeviationDb)} dB`, "From the default curve"]
    ];
    $("summary").innerHTML = metrics.map(([k, v, s]) => `<div class="metric"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`).join("");
    $("chart").innerHTML = chart(r.points);
    $("points").querySelector("tbody").innerHTML = [...r.points].reverse().map(([v, db]) => {
      const d = volToDb(v, DEFAULT_CURVE);
      return `<tr><td>${pct(v)}</td><td class="c-n">${n1(db)} dB</td><td class="c-n">${n1(d)} dB</td><td class="c-n">${n1(db - d)} dB</td></tr>`;
    }).join("");
    $("use-status").textContent = "";
    $("result").hidden = false;
  } catch (e) {
    $("error").textContent = e.message;
    $("error").hidden = false;
  }
}
$("use").onclick = () => {
  if (!result) return;
  try {
    const c = saveCurve(result.curve);
    $("use-status").textContent = `Saved. Volume Fix on this computer now uses ${c.version}.`;
    showActive();
  } catch (e) {
    $("use-status").textContent = e.message;
  }
};
$("download").onclick = () => {
  if (!result) return;
  const blob = new Blob([JSON.stringify({ ...result.curve, powerpoint: "fill in: e.g. Office 365 PowerPoint 16.0.20527", app: `volume-fix ${VERSION}` }, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `volume-curve-${result.curve.version}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
};
$("reset").onclick = () => {
  clearCurve();
  showActive();
};
var drop = $("drop");
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  const f = e.dataTransfer?.files?.[0];
  if (f) analyse(f);
});
drop.addEventListener("click", (e) => {
  if (e.target.id !== "pick") $("file").click();
});
drop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    $("file").click();
  }
});
$("pick").onclick = (e) => {
  e.stopPropagation();
  $("file").click();
};
$("file").onchange = (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (f) analyse(f);
};
$("version").textContent = `Volume Fix ${VERSION}`;
showActive();
window.__calibrate = { analyse };
