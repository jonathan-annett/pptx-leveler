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
function clipKey(c) {
  const where = c.container === "slide" && c.slideNumber != null ? `slide${c.slideNumber}` : c.partName;
  return `${c.fileName}|${where}|${c.instance}`;
}

// src/core/patch.js
var enc = new TextEncoder();
var dec = new TextDecoder("utf-8", { ignoreBOM: true });
var PatchError = class extends Error {
};
function formatVol(newVol, oldRaw) {
  if (oldRaw != null && oldRaw.trim().endsWith("%")) return `${+(newVol / 1e3).toFixed(3)}%`;
  return String(newVol);
}
function patchVolumes(bytes, edits) {
  if (!edits.length) return bytes;
  const text = dec.decode(bytes);
  const byteAt = (charOff) => enc.encode(text.slice(0, charOff)).length;
  const ascii = (a, b) => String.fromCharCode(...bytes.subarray(a, b));
  const ops = edits.map(({ patch, newVol, oldRaw = null }) => {
    if (!Number.isInteger(newVol) || newVol < 0 || newVol > 1e5) throw new PatchError(`bad vol ${newVol}`);
    const tagStart = byteAt(patch.elementStart);
    const nameEnd = byteAt(patch.nameEnd);
    const tagName = ascii(tagStart, nameEnd);
    if (!/^<([A-Za-z_][\w.-]*:)?cMediaNode$/.test(tagName)) {
      throw new PatchError(`offset ${patch.elementStart} is not a cMediaNode start tag (found "${tagName}")`);
    }
    if (patch.vol) {
      const a = byteAt(patch.vol.valueStart);
      const b = byteAt(patch.vol.valueEnd);
      const cur = ascii(a, b);
      if (oldRaw != null && cur !== oldRaw) throw new PatchError(`vol value at ${a} is "${cur}", expected "${oldRaw}"`);
      if (!/^\s*[\d.]+%?\s*$/.test(cur)) throw new PatchError(`vol value at ${a} is not numeric: "${cur}"`);
      return { at: a, end: b, insert: enc.encode(formatVol(newVol, cur)) };
    }
    return { at: nameEnd, end: nameEnd, insert: enc.encode(` vol="${newVol}"`) };
  });
  ops.sort((x2, y) => x2.at - y.at);
  for (let i2 = 1; i2 < ops.length; i2++) {
    if (ops[i2].at < ops[i2 - 1].end) throw new PatchError("overlapping vol patches");
  }
  const delta = ops.reduce((d, op) => d + op.insert.length - (op.end - op.at), 0);
  const out = new Uint8Array(bytes.length + delta);
  let src = 0, dst = 0;
  for (const op of ops) {
    out.set(bytes.subarray(src, op.at), dst);
    dst += op.at - src;
    out.set(op.insert, dst);
    dst += op.insert.length;
    src = op.end;
  }
  out.set(bytes.subarray(src), dst);
  return out;
}

// src/core/normalize.js
async function buildReplacements(zip, deck, planByKey) {
  const byPart = /* @__PURE__ */ new Map();
  const changes = [];
  for (const c of deck.clips) {
    const p = planByKey.get(clipKey(c));
    if (!p || !p.change) continue;
    if (!c.patch) throw new Error(`${clipKey(c)}: planned a change but the clip has no timing node`);
    if (!byPart.has(c.partName)) byPart.set(c.partName, []);
    byPart.get(c.partName).push({ patch: c.patch, newVol: p.newVol, oldRaw: c.volRaw });
    changes.push({ key: clipKey(c), partName: c.partName, oldVol: c.vol, volExplicit: c.volExplicit, newVol: p.newVol });
  }
  const replacements = /* @__PURE__ */ new Map();
  for (const [partName, edits] of byPart) {
    const bytes = await zip.get(partName).bytes();
    replacements.set(partName, patchVolumes(bytes, edits));
  }
  return { replacements, changes };
}

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
  const enc3 = new TextEncoder();
  const { time, date } = dosDateTime(/* @__PURE__ */ new Date());
  for (const [name, bytes] of additions) {
    if (zip.has(name)) throw new ZipWriteError(`cannot add existing entry ${name}`);
    const offset = pos;
    if (offset > U32_MAX2) throw new ZipWriteError("output needs zip64 offsets (over 4 GB); not supported in v1");
    const nameBytes = enc3.encode(name);
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

// src/core/verify.js
var CHUNK = 8 << 20;
async function verifyRewrite(input, output, replaced) {
  if (output.entries.length !== input.entries.length) throw new Error("entry count differs");
  for (let i2 = 0; i2 < input.entries.length; i2++) {
    const a = input.entries[i2], b = output.entries[i2];
    if (a.name !== b.name) throw new Error(`entry ${i2} name differs`);
    if (replaced.has(a.name)) {
      const got = await b.bytes();
      const want = replaced.get(a.name);
      if (got.length !== want.length) throw new Error(`${a.name}: patched size differs`);
      for (let k = 0; k < got.length; k++) if (got[k] !== want[k]) throw new Error(`${a.name}: patched content differs`);
      continue;
    }
    const sa = await a.localSpan(), sb = await b.localSpan();
    const len = sa.end - sa.start;
    if (len !== sb.end - sb.start) throw new Error(`${a.name}: size differs`);
    for (let p = 0; p < len; p += CHUNK) {
      const n = Math.min(CHUNK, len - p);
      const [x2, y] = await Promise.all([a.source.read(sa.start + p, n), b.source.read(sb.start + p, n)]);
      for (let k = 0; k < n; k++) if (x2[k] !== y[k]) throw new Error(`${a.name}: byte ${p + k} differs`);
    }
  }
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
  let fmt2 = null;
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
      fmt2 = { format: tag === FMT_FLOAT ? "float" : "pcm", channels, sampleRate, blockAlign, bitsPerSample, channelMask };
    } else if (id === "data") {
      if (!fmt2) throw new Error("WAV data chunk before fmt chunk");
      const dataLength = Math.min(size, bytes.length - body);
      return { ...fmt2, dataOffset: body, dataLength, frames: Math.floor(dataLength / fmt2.blockAlign) };
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
function removeTrim(xml) {
  const { root } = parseXml(xml);
  const trims = descendants(root, NS.p14, "trim");
  let out = xml;
  for (const t of trims.reverse()) out = out.slice(0, t.start) + out.slice(t.end);
  return out;
}
var fmt = (x2) => (Math.round(x2 * 10) / 10).toFixed(1);
async function buildToneDeck(templateZip, { lref, batchId, date, deckCount, clipCount, seconds = 30 }) {
  const deck = await readPptx(templateZip, { fileName: "template" });
  const clips = deck.clips.filter((c) => c.container === "slide" && c.mediaPart && c.patch);
  if (!clips.length) throw new Error("template has no embedded audio on a slide");
  const replacements = /* @__PURE__ */ new Map();
  const tones = [];
  const byPart = /* @__PURE__ */ new Map();
  for (const c of clips) {
    if (!byPart.has(c.partName)) byPart.set(c.partName, []);
    byPart.get(c.partName).push(c);
  }
  for (const [partName, partClips] of byPart) {
    for (const c of partClips) {
      const h = parseWavHeader(await templateZip.get(c.mediaPart).bytes());
      const channels2 = Math.min(2, h.channels);
      replacements.set(c.mediaPart, encodeWav(generateTone({ lufs: lref, seconds, channels: channels2 }), 48e3, { bits: 24 }));
      tones.push({ slide: c.slideNumber, channels: channels2, mediaPart: c.mediaPart });
    }
    let bytes = patchVolumes(await templateZip.get(partName).bytes(), partClips.map((c) => ({ patch: c.patch, newVol: 1e5, oldRaw: c.volRaw })));
    let xml = setPlayDuration(removeTrim(dec2.decode(bytes)), seconds * 1e3);
    const channels = tones.find((t) => t.mediaPart === partClips[0].mediaPart).channels;
    xml = setPlaceholderText(xml, "ctrTitle", [`Reference tone \xB7 ${channels === 1 ? "mono" : "stereo"} \xB7 ${fmt(lref)} LUFS`]);
    xml = setPlaceholderText(xml, "subTitle", [
      `Batch ${batchId} \xB7 ${date} \xB7 ${deckCount} presentation${deckCount === 1 ? "" : "s"}, ${clipCount} clip${clipCount === 1 ? "" : "s"} normalised`,
      `Tone = ${fmt(lref)} LUFS = the quietest clip (anchor). Every normalised clip plays at this level.`,
      "Play this slide and set the console input to your reference mark.",
      "Afterwards, do not change Windows or PowerPoint volume.",
      "Turn off Windows Loudness Equalization and other audio enhancements. Keep the same output device.",
      "The mono and stereo slides should read the same level."
    ], 1400);
    replacements.set(partName, enc2.encode(xml));
  }
  return { replacements, tones };
}

// src/core/loudness.js
var ABS_GATE_LUFS = -70;
var REL_GATE_LU = -10;
var OFFSET = -0.691;
function kWeightingCoefficients(fs) {
  return [highShelf(fs), rlbHighPass(fs)];
}
function highShelf(fs) {
  const f0 = 1681.974450955533;
  const G = 3.999843853973347;
  const Q = 0.7071752369554196;
  const K = Math.tan(Math.PI * f0 / fs);
  const Vh = Math.pow(10, G / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const a0 = 1 + K / Q + K * K;
  return {
    b0: (Vh + Vb * K / Q + K * K) / a0,
    b1: 2 * (K * K - Vh) / a0,
    b2: (Vh - Vb * K / Q + K * K) / a0,
    a1: 2 * (K * K - 1) / a0,
    a2: (1 - K / Q + K * K) / a0
  };
}
function rlbHighPass(fs) {
  const f0 = 38.13547087602444;
  const Q = 0.5003270373238773;
  const K = Math.tan(Math.PI * f0 / fs);
  const d = 1 + K / Q + K * K;
  return { b0: 1, b1: -2, b2: 1, a1: 2 * (K * K - 1) / d, a2: (1 - K / Q + K * K) / d };
}
function lufsFromEnergy(e) {
  return e > 0 ? OFFSET + 10 * Math.log10(e) : -Infinity;
}
var LoudnessMeter = class {
  constructor({ sampleRate, channels, weights }) {
    if (!(sampleRate > 0)) throw new Error("sampleRate required");
    if (!(channels >= 1)) throw new Error("channels required");
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.weights = Float64Array.from(weights ?? new Array(channels).fill(1));
    if (this.weights.length !== channels) throw new Error("weights length must equal channels");
    const [s, h] = kWeightingCoefficients(sampleRate);
    this.s = s;
    this.h = h;
    this.state = new Float64Array(channels * 4);
    this.subLen = Math.round(sampleRate / 10);
    this.subPos = 0;
    this.subAcc = new Float64Array(channels);
    this.subBlocks = [];
    this.totalAcc = 0;
    this.frames = 0;
    this.peak = new Float64Array(channels);
  }
  /** @param {Float32Array[]} planar one array per channel, equal lengths */
  push(planar) {
    const C = this.channels;
    if (planar.length !== C) throw new Error(`expected ${C} channels, got ${planar.length}`);
    const n = planar[0].length;
    const { b0: sb0, b1: sb1, b2: sb2, a1: sa1, a2: sa2 } = this.s;
    const { b0: hb0, b1: hb1, b2: hb2, a1: ha1, a2: ha2 } = this.h;
    const st = this.state;
    let done = 0;
    while (done < n) {
      const take = Math.min(n - done, this.subLen - this.subPos);
      for (let c = 0; c < C; c++) {
        const x2 = planar[c];
        let z1 = st[c * 4], z2 = st[c * 4 + 1], z3 = st[c * 4 + 2], z4 = st[c * 4 + 3];
        let acc = 0;
        let pk = this.peak[c];
        for (let i2 = done, end = done + take; i2 < end; i2++) {
          const v = x2[i2];
          const av = v < 0 ? -v : v;
          if (av > pk) pk = av;
          const y1 = sb0 * v + z1;
          z1 = sb1 * v - sa1 * y1 + z2;
          z2 = sb2 * v - sa2 * y1;
          const y2 = hb0 * y1 + z3;
          z3 = hb1 * y1 - ha1 * y2 + z4;
          z4 = hb2 * y1 - ha2 * y2;
          acc += y2 * y2;
        }
        st[c * 4] = z1;
        st[c * 4 + 1] = z2;
        st[c * 4 + 2] = z3;
        st[c * 4 + 3] = z4;
        this.subAcc[c] += acc;
        this.peak[c] = pk;
      }
      this.subPos += take;
      this.frames += take;
      done += take;
      if (this.subPos === this.subLen) this._closeSubBlock();
    }
  }
  _closeSubBlock() {
    let w = 0;
    for (let c = 0; c < this.channels; c++) {
      w += this.weights[c] * this.subAcc[c];
      this.subAcc[c] = 0;
    }
    this.subBlocks.push(w);
    this.totalAcc += w;
    this.subPos = 0;
  }
  /**
   * @returns {{
   *   integrated: number,     // LUFS (-Infinity if digital silence)
   *   method: 'gated'|'ungated',
   *   flags: string[],        // 'short' (<400 ms), 'below-absolute-gate', 'digital-silence'
   *   silent: boolean,        // true if it should be treated as silent (excluded from anchor)
   *   ungated: number,        // K-weighted loudness of the whole window, no gating
   *   relativeGate: number|null,
   *   blocks: number, blocksAboveAbsolute: number, blocksGated: number,
   *   samplePeak: number, samplePeakDb: number,
   *   frames: number, durationS: number,
   * }}
   */
  finish() {
    let partial = 0;
    for (let c = 0; c < this.channels; c++) partial += this.weights[c] * this.subAcc[c];
    const total = this.totalAcc + partial;
    const flags = [];
    const ungated = this.frames ? lufsFromEnergy(total / this.frames) : -Infinity;
    const sb = this.subBlocks;
    const blockFrames = 4 * this.subLen;
    const nBlocks = Math.max(0, sb.length - 3);
    const energies = new Float64Array(nBlocks);
    for (let j = 0; j < nBlocks; j++) energies[j] = (sb[j] + sb[j + 1] + sb[j + 2] + sb[j + 3]) / blockFrames;
    let integrated = ungated;
    let method = "ungated";
    let relativeGate = null;
    let aboveAbs = 0;
    let gated = 0;
    if (nBlocks === 0) {
      flags.push("short");
    } else {
      let sumAbs = 0;
      for (let j = 0; j < nBlocks; j++) {
        if (lufsFromEnergy(energies[j]) > ABS_GATE_LUFS) {
          sumAbs += energies[j];
          aboveAbs++;
        }
      }
      if (aboveAbs === 0) {
        flags.push("below-absolute-gate");
      } else {
        relativeGate = lufsFromEnergy(sumAbs / aboveAbs) + REL_GATE_LU;
        let sumRel = 0;
        for (let j = 0; j < nBlocks; j++) {
          const l = lufsFromEnergy(energies[j]);
          if (l > ABS_GATE_LUFS && l > relativeGate) {
            sumRel += energies[j];
            gated++;
          }
        }
        integrated = lufsFromEnergy(sumRel / gated);
        method = "gated";
      }
    }
    if (total === 0) flags.push("digital-silence");
    const samplePeak = Math.max(0, ...this.peak);
    return {
      integrated,
      method,
      flags,
      silent: !Number.isFinite(integrated) || flags.includes("below-absolute-gate"),
      ungated,
      relativeGate,
      blocks: nBlocks,
      blocksAboveAbsolute: aboveAbs,
      blocksGated: gated,
      samplePeak,
      samplePeakDb: samplePeak > 0 ? 20 * Math.log10(samplePeak) : -Infinity,
      frames: this.frames,
      durationS: this.frames / this.sampleRate
    };
  }
};
function measureLoudness(planar, sampleRate, { weights, chunk = 65536 } = {}) {
  const m = new LoudnessMeter({ sampleRate, channels: planar.length, weights });
  const n = planar[0]?.length ?? 0;
  for (let i2 = 0; i2 < n; i2 += chunk) m.push(planar.map((ch) => ch.subarray(i2, Math.min(n, i2 + chunk))));
  return m.finish();
}

// src/core/channels.js
var M3DB = Math.SQRT1_2;
var LAYOUT = {
  WAV_51: ["L", "R", "C", "LFE", "Ls", "Rs"],
  AAC_51: ["C", "L", "R", "Ls", "Rs", "LFE"]
};
function defaultLayout(n) {
  if (n === 1) return ["M"];
  if (n === 2) return ["L", "R"];
  if (n === 3) return ["L", "R", "C"];
  if (n === 4) return ["L", "R", "Ls", "Rs"];
  if (n === 5) return ["L", "R", "C", "Ls", "Rs"];
  if (n === 6) return LAYOUT.WAV_51;
  return null;
}
var DOWNMIX = {
  M: [M3DB, M3DB],
  L: [1, 0],
  R: [0, 1],
  C: [M3DB, M3DB],
  LFE: [0, 0],
  Ls: [M3DB, 0],
  Rs: [0, M3DB],
  Lb: [M3DB, 0],
  Rb: [0, M3DB]
};
function planChannels(channelCount, layout) {
  if (channelCount === 1) return { mode: "dual-mono", weights: [2], mix: null };
  if (channelCount === 2) return { mode: "stereo", weights: [1, 1], mix: null };
  const labels = layout ?? defaultLayout(channelCount);
  if (!labels || labels.length !== channelCount) throw new Error(`No downmix layout for ${channelCount} channels`);
  const gains = labels.map((l) => {
    const g = DOWNMIX[l];
    if (!g) throw new Error(`Unknown channel label ${l}`);
    return g;
  });
  return { mode: "downmix", weights: [1, 1], mix: [gains.map((g) => g[0]), gains.map((g) => g[1])] };
}
function applyMix(planar, mix) {
  if (!mix) return planar;
  const n = planar[0].length;
  return mix.map((row) => {
    const out = new Float32Array(n);
    for (let c = 0; c < planar.length; c++) {
      const g = row[c];
      if (!g) continue;
      const x2 = planar[c];
      for (let i2 = 0; i2 < n; i2++) out[i2] += g * x2[i2];
    }
    return out;
  });
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
function mediaSource(deckBlob, range, name) {
  return blobSource(deckBlob.slice(range.offset, range.offset + range.length), name);
}
function httpSource(url, size, base = 0, name = "") {
  return {
    size,
    name,
    async read(offset, length) {
      if (offset < 0 || offset + length > size) throw new Error(`read out of range: ${offset}+${length} > ${size}`);
      if (!length) return new Uint8Array(0);
      const a = base + offset;
      const res = await fetch(url, { headers: { Range: `bytes=${a}-${a + length - 1}` } });
      if (res.status !== 206) throw new Error(`range request failed: HTTP ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    },
    async getBlob() {
      const res = await fetch(url, { headers: { Range: `bytes=${base}-${base + size - 1}` } });
      return res.blob();
    },
    sub(range, subName) {
      return httpSource(url, range.length, base + range.offset, subName);
    },
    close: async () => {
    }
  };
}

// src/core/mp4.js
var Mp4Error = class extends Error {
};
var td2 = new TextDecoder("latin1");
var Reader = class {
  constructor(bytes, pos = 0, end = bytes.length) {
    this.b = bytes;
    this.dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.p = pos;
    this.end = end;
  }
  u8() {
    return this.dv.getUint8(this.p++);
  }
  u16() {
    const v = this.dv.getUint16(this.p);
    this.p += 2;
    return v;
  }
  u24() {
    const v = this.dv.getUint16(this.p) << 8 | this.dv.getUint8(this.p + 2);
    this.p += 3;
    return v;
  }
  u32() {
    const v = this.dv.getUint32(this.p);
    this.p += 4;
    return v;
  }
  i32() {
    const v = this.dv.getInt32(this.p);
    this.p += 4;
    return v;
  }
  u64() {
    const hi = this.dv.getUint32(this.p), lo = this.dv.getUint32(this.p + 4);
    this.p += 8;
    return hi * 2 ** 32 + lo;
  }
  i64() {
    const hi = this.dv.getInt32(this.p), lo = this.dv.getUint32(this.p + 4);
    this.p += 8;
    return hi * 2 ** 32 + lo;
  }
  type() {
    const s = td2.decode(this.b.subarray(this.p, this.p + 4));
    this.p += 4;
    return s;
  }
  skip(n) {
    this.p += n;
  }
  bytes(n) {
    const v = this.b.subarray(this.p, this.p + n);
    this.p += n;
    return v;
  }
  get left() {
    return this.end - this.p;
  }
};
function* children2(bytes, start, end) {
  const r = new Reader(bytes, start, end);
  while (r.left >= 8) {
    const at = r.p;
    let size = r.u32();
    const type = r.type();
    let hdr = 8;
    if (size === 1) {
      size = r.u64();
      hdr = 16;
    } else if (size === 0) size = end - at;
    if (size < hdr || at + size > end) throw new Mp4Error(`bad ${type} box size ${size} at ${at}`);
    yield { type, start: at, body: at + hdr, end: at + size };
    r.p = at + size;
  }
}
function child2(bytes, box, type) {
  for (const c of children2(bytes, box.body, box.end)) if (c.type === type) return c;
  return null;
}
function path2(bytes, box, ...types) {
  let cur = box;
  for (const t of types) {
    cur = cur && child2(bytes, cur, t);
  }
  return cur;
}
async function topLevel(src) {
  const boxes = [];
  let pos = 0;
  while (pos + 8 <= src.size) {
    const h = new Reader(await src.read(pos, Math.min(16, src.size - pos)));
    let size = h.u32();
    const type = h.type();
    let hdr = 8;
    if (size === 1) {
      size = h.u64();
      hdr = 16;
    } else if (size === 0) size = src.size - pos;
    if (size < hdr) throw new Mp4Error(`bad top-level ${type} size ${size} at ${pos}`);
    boxes.push({ type, start: pos, hdr, size });
    pos += size;
  }
  return boxes;
}
function readDescriptorHeader(r) {
  const tag = r.u8();
  let len = 0;
  for (let i2 = 0; i2 < 4; i2++) {
    const b = r.u8();
    len = len << 7 | b & 127;
    if (!(b & 128)) break;
  }
  return { tag, len, end: r.p + len };
}
function parseEsds(bytes, box) {
  const r = new Reader(bytes, box.body + 4, box.end);
  const es = readDescriptorHeader(r);
  if (es.tag !== 3) throw new Mp4Error("esds: no ES_Descriptor");
  r.skip(2);
  const flags = r.u8();
  if (flags & 128) r.skip(2);
  if (flags & 64) r.skip(r.u8());
  if (flags & 32) r.skip(2);
  let oti = null, dsi = null;
  while (r.p < es.end) {
    const d = readDescriptorHeader(r);
    if (d.tag === 4) {
      oti = r.u8();
      r.skip(12);
      while (r.p < d.end) {
        const s = readDescriptorHeader(r);
        if (s.tag === 5) dsi = r.bytes(s.len).slice();
        r.p = s.end;
      }
    }
    r.p = d.end;
  }
  return { oti, dsi };
}
function parseAsc(dsi) {
  let bit = 0;
  const bits2 = (n) => {
    let v = 0;
    for (let i2 = 0; i2 < n; i2++, bit++) v = v << 1 | dsi[bit >> 3] >> 7 - (bit & 7) & 1;
    return v;
  };
  const RATES2 = [96e3, 88200, 64e3, 48e3, 44100, 32e3, 24e3, 22050, 16e3, 12e3, 11025, 8e3, 7350];
  const aotBits = () => {
    const a = bits2(5);
    return a === 31 ? 32 + bits2(6) : a;
  };
  const rate = () => {
    const fi = bits2(4);
    return fi === 15 ? bits2(24) : RATES2[fi];
  };
  const aot = aotBits();
  let sampleRate = rate();
  let channels = bits2(4);
  if (aot === 5 || aot === 29) {
    sampleRate = rate();
    if (aot === 29) channels = 2;
  }
  return { aot, sampleRate, channels };
}
var AUDIO_PCM = /* @__PURE__ */ new Set(["twos", "sowt", "lpcm", "in24", "in32", "fl32", "fl64", "raw ", "ipcm", "fpcm"]);
function findEsds(bytes, start, end, depth = 0) {
  for (const c of children2(bytes, start, end)) {
    if (c.type === "esds") return c;
    if (c.type === "wave" && depth < 3) {
      const e = findEsds(bytes, c.body, c.end, depth + 1);
      if (e) return e;
    }
  }
  return null;
}
function parseAudioSampleEntry(bytes, entry) {
  const r = new Reader(bytes, entry.body, entry.end);
  r.skip(8);
  const version = r.u16();
  r.skip(6);
  let channels = r.u16();
  r.skip(6);
  let sampleRate = r.u32() / 65536;
  if (version === 1) r.skip(16);
  else if (version === 2) {
    r.skip(4);
    sampleRate = r.dv.getFloat64(r.p);
    r.skip(8);
    channels = r.u32();
    r.skip(20);
  }
  const info = { format: entry.type, channels, sampleRate, codec: null, description: null, oti: null };
  if (entry.type === "mp4a" || entry.type === "enca") {
    const esdsBox = r.left >= 8 ? findEsds(bytes, r.p, entry.end) : null;
    if (!esdsBox) {
      return info;
    }
    const { oti, dsi } = parseEsds(bytes, esdsBox);
    info.oti = oti;
    if (oti === 64 || oti === 102 || oti === 103 || oti === 104) {
      if (!dsi) return info;
      const asc = parseAsc(dsi);
      info.codec = oti === 64 ? `mp4a.40.${asc.aot}` : "mp4a.67";
      info.description = dsi;
      info.asc = asc;
      if (asc.channels) info.channels = asc.channels;
      if (asc.sampleRate) info.sampleRate = asc.sampleRate;
    } else if (oti === 105 || oti === 107) {
      info.codec = "mp3";
    }
  } else if (entry.type === ".mp3" || entry.type === "mp3 ") {
    info.codec = "mp3";
  } else if (entry.type === "Opus") {
    info.codec = "opus";
  } else if (entry.type === "ac-3") {
    info.codec = "ac-3";
  } else if (entry.type === "ec-3") {
    info.codec = "ec-3";
  } else if (entry.type === "alac") {
    info.codec = "alac";
  } else if (entry.type === "fLaC") {
    info.codec = "flac";
  } else if (AUDIO_PCM.has(entry.type)) {
    info.codec = "pcm";
  }
  return info;
}
function parseTrak(bytes, trak, movieTimescale) {
  const tkhd = child2(bytes, trak, "tkhd");
  const tr = new Reader(bytes, tkhd.body);
  const tkv = tr.u8();
  tr.skip(3);
  tr.skip(tkv === 1 ? 16 : 8);
  const trackId = tr.u32();
  const mdia = child2(bytes, trak, "mdia");
  const hdlr = child2(bytes, mdia, "hdlr");
  const handler = td2.decode(bytes.subarray(hdlr.body + 8, hdlr.body + 12));
  const mdhd = child2(bytes, mdia, "mdhd");
  const mr = new Reader(bytes, mdhd.body);
  const mv = mr.u8();
  mr.skip(3);
  mr.skip(mv === 1 ? 16 : 8);
  const timescale = mr.u32();
  const mediaDuration = mv === 1 ? mr.u64() : mr.u32();
  let emptyDelay = 0;
  let mediaStart = 0;
  let presentDuration = null;
  const elst = path2(bytes, trak, "edts", "elst");
  if (elst) {
    const er = new Reader(bytes, elst.body);
    const ev = er.u8();
    er.skip(3);
    const n = er.u32();
    for (let i2 = 0; i2 < n; i2++) {
      const segDur = ev === 1 ? er.u64() : er.u32();
      const mediaTime = ev === 1 ? er.i64() : er.i32();
      er.skip(4);
      if (mediaTime === -1) {
        emptyDelay += segDur;
        continue;
      }
      mediaStart = mediaTime;
      presentDuration = segDur || null;
      break;
    }
  }
  const stbl = path2(bytes, mdia, "minf", "stbl");
  let entry = null;
  if (stbl) {
    const stsd = child2(bytes, stbl, "stsd");
    if (stsd) {
      for (const e of children2(bytes, stsd.body + 8, stsd.end)) {
        entry = e;
        break;
      }
    }
  }
  return {
    trackId,
    handler,
    timescale,
    mediaDuration,
    stbl,
    entry,
    edit: { emptyDelayS: emptyDelay / movieTimescale, mediaStart, presentDurationS: presentDuration == null ? null : presentDuration / movieTimescale }
  };
}
function stblSamples(bytes, stbl) {
  const get = (t2) => child2(bytes, stbl, t2);
  const stsz = get("stsz") ?? get("stz2");
  if (!stsz) return null;
  let sizes;
  {
    const r = new Reader(bytes, stsz.body + 4);
    if (stsz.type === "stsz") {
      const constSize = r.u32();
      const n2 = r.u32();
      sizes = new Uint32Array(n2);
      if (constSize) sizes.fill(constSize);
      else for (let i2 = 0; i2 < n2; i2++) sizes[i2] = r.u32();
    } else {
      r.skip(3);
      const fieldSize = r.u8();
      const n2 = r.u32();
      sizes = new Uint32Array(n2);
      for (let i2 = 0; i2 < n2; i2++) {
        if (fieldSize === 4) {
          const b = bytes[r.p + (i2 >> 1)];
          sizes[i2] = i2 & 1 ? b & 15 : b >> 4;
        } else sizes[i2] = fieldSize === 8 ? r.u8() : r.u16();
      }
    }
  }
  const n = sizes.length;
  const co = get("stco") ?? get("co64");
  const cr = new Reader(bytes, co.body + 4);
  const nChunks = cr.u32();
  const chunkOff = new Float64Array(nChunks);
  for (let i2 = 0; i2 < nChunks; i2++) chunkOff[i2] = co.type === "co64" ? cr.u64() : cr.u32();
  const stsc = get("stsc");
  const sr = new Reader(bytes, stsc.body + 4);
  const nRuns = sr.u32();
  const runs = [];
  for (let i2 = 0; i2 < nRuns; i2++) {
    runs.push([sr.u32(), sr.u32()]);
    sr.skip(4);
  }
  const offsets = new Float64Array(n);
  let s = 0;
  for (let ri = 0; ri < runs.length && s < n; ri++) {
    const firstChunk = runs[ri][0] - 1;
    const lastChunk = ri + 1 < runs.length ? runs[ri + 1][0] - 1 : nChunks;
    const per = runs[ri][1];
    for (let c = firstChunk; c < lastChunk && s < n; c++) {
      let off = chunkOff[c];
      for (let k = 0; k < per && s < n; k++, s++) {
        offsets[s] = off;
        off += sizes[s];
      }
    }
  }
  const stts = get("stts");
  const tr = new Reader(bytes, stts.body + 4);
  const nT = tr.u32();
  const dts = new Float64Array(n);
  const durations = new Uint32Array(n);
  let t = 0;
  s = 0;
  for (let i2 = 0; i2 < nT && s < n; i2++) {
    const count = tr.u32(), delta = tr.u32();
    for (let k = 0; k < count && s < n; k++, s++) {
      dts[s] = t;
      durations[s] = delta;
      t += delta;
    }
  }
  return { count: n, offsets, sizes, dts, durations };
}
function moofSamples(bytes, moofStartAbs, trackId, trex, out, state) {
  const moof = { body: 8, end: bytes.length };
  for (const traf of children2(bytes, moof.body, moof.end)) {
    if (traf.type !== "traf") continue;
    const tfhd = child2(bytes, traf, "tfhd");
    const hr = new Reader(bytes, tfhd.body);
    hr.skip(1);
    const flags = hr.u24();
    const id = hr.u32();
    if (id !== trackId) continue;
    let base = moofStartAbs;
    if (flags & 1) base = hr.u64();
    if (flags & 2) hr.skip(4);
    const defDur = flags & 8 ? hr.u32() : trex.duration;
    const defSize = flags & 16 ? hr.u32() : trex.size;
    const tfdt = child2(bytes, traf, "tfdt");
    if (tfdt) {
      const r = new Reader(bytes, tfdt.body);
      const v = r.u8();
      r.skip(3);
      state.t = v === 1 ? r.u64() : r.u32();
    }
    for (const trun of children2(bytes, traf.body, traf.end)) {
      if (trun.type !== "trun") continue;
      const r = new Reader(bytes, trun.body);
      r.skip(1);
      const tf = r.u24();
      const count = r.u32();
      let off = base + (tf & 1 ? r.i32() : 0);
      if (tf & 4) r.skip(4);
      for (let i2 = 0; i2 < count; i2++) {
        const dur = tf & 256 ? r.u32() : defDur;
        const size = tf & 512 ? r.u32() : defSize;
        if (tf & 1024) r.skip(4);
        if (tf & 2048) r.skip(4);
        out.offsets.push(off);
        out.sizes.push(size);
        out.dts.push(state.t);
        out.durations.push(dur);
        off += size;
        state.t += dur;
      }
    }
  }
}
async function readMp4Index(src) {
  const top = await topLevel(src);
  const ftyp = top.find((b) => b.type === "ftyp");
  const moovBox = top.find((b) => b.type === "moov");
  if (!moovBox) throw new Mp4Error("no moov box");
  let brand = null;
  if (ftyp) brand = td2.decode(await src.read(ftyp.start + ftyp.hdr, 4));
  const moovBytes = await src.read(moovBox.start, moovBox.size);
  const moov = { body: moovBox.hdr, end: moovBytes.length };
  const mvhd = child2(moovBytes, moov, "mvhd");
  const mvr = new Reader(moovBytes, mvhd.body);
  const mvv = mvr.u8();
  mvr.skip(3);
  mvr.skip(mvv === 1 ? 16 : 8);
  const movieTimescale = mvr.u32();
  const traks = [...children2(moovBytes, moov.body, moov.end)].filter((b) => b.type === "trak").map((t) => parseTrak(moovBytes, t, movieTimescale));
  const hasVideo = traks.some((t) => t.handler === "vide");
  const a = traks.find((t) => t.handler === "soun");
  const mvex = child2(moovBytes, moov, "mvex");
  const fragmented = !!mvex;
  if (!a) return { brand, fragmented, hasVideo, audio: null };
  const info = a.entry ? parseAudioSampleEntry(moovBytes, a.entry) : { format: null, channels: 0, sampleRate: 0, codec: null, description: null };
  let samples = a.stbl ? stblSamples(moovBytes, a.stbl) : null;
  if (fragmented) {
    let trex = { duration: 0, size: 0 };
    for (const t of children2(moovBytes, mvex.body, mvex.end)) {
      if (t.type !== "trex") continue;
      const r = new Reader(moovBytes, t.body + 4);
      if (r.u32() === a.trackId) {
        r.skip(4);
        trex = { duration: r.u32(), size: r.u32() };
      }
    }
    const acc = { offsets: [], sizes: [], dts: [], durations: [] };
    if (samples) for (let i2 = 0; i2 < samples.count; i2++) {
      acc.offsets.push(samples.offsets[i2]);
      acc.sizes.push(samples.sizes[i2]);
      acc.dts.push(samples.dts[i2]);
      acc.durations.push(samples.durations[i2]);
    }
    const state = { t: acc.dts.length ? acc.dts[acc.dts.length - 1] + acc.durations[acc.durations.length - 1] : 0 };
    for (const b of top) {
      if (b.type !== "moof") continue;
      const bytes = await src.read(b.start, b.size);
      moofSamples(bytes, b.start, a.trackId, trex, acc, state);
    }
    samples = {
      count: acc.sizes.length,
      offsets: Float64Array.from(acc.offsets),
      sizes: Uint32Array.from(acc.sizes),
      dts: Float64Array.from(acc.dts),
      durations: Uint32Array.from(acc.durations)
    };
  }
  if (!samples || !samples.count) return { brand, fragmented, hasVideo, audio: null };
  const ts = a.timescale;
  const { emptyDelayS, mediaStart, presentDurationS } = a.edit;
  const lastEnd = samples.dts[samples.count - 1] + samples.durations[samples.count - 1];
  let durationS = (lastEnd - mediaStart) / ts;
  if (presentDurationS != null) durationS = Math.min(durationS, presentDurationS);
  durationS += emptyDelayS;
  return {
    brand,
    fragmented,
    hasVideo,
    audio: {
      trackId: a.trackId,
      timescale: ts,
      ...info,
      durationS,
      samples,
      edit: a.edit,
      timeOf: (i2) => (samples.dts[i2] - mediaStart) / ts + emptyDelayS
    }
  };
}

// src/core/mp3.js
var BITRATES = {
  // [version][layer] kbps tables; version 1 = MPEG-1, 2 = MPEG-2/2.5
  1: {
    1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
  },
  2: {
    1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
  }
};
var RATES = { 3: [44100, 48e3, 32e3], 2: [22050, 24e3, 16e3], 0: [11025, 12e3, 8e3] };
function parseHeader(b0, b1, b2, b3) {
  if (b0 !== 255 || (b1 & 224) !== 224) return null;
  const vbits = b1 >> 3 & 3;
  const lbits = b1 >> 1 & 3;
  if (vbits === 1 || lbits === 0) return null;
  const layer = 4 - lbits;
  const bi = b2 >> 4 & 15;
  const si = b2 >> 2 & 3;
  if (bi === 0 || bi === 15 || si === 3) return null;
  const version = vbits === 3 ? 1 : 2;
  const bitrate = BITRATES[version][layer][bi] * 1e3;
  const sampleRate = RATES[vbits][si];
  const padding = b2 >> 1 & 1;
  const channels = (b3 >> 6 & 3) === 3 ? 1 : 2;
  let samplesPerFrame, frameLength;
  if (layer === 1) {
    samplesPerFrame = 384;
    frameLength = (Math.floor(12 * bitrate / sampleRate) + padding) * 4;
  } else if (layer === 2) {
    samplesPerFrame = 1152;
    frameLength = Math.floor(144 * bitrate / sampleRate) + padding;
  } else {
    samplesPerFrame = version === 1 ? 1152 : 576;
    frameLength = Math.floor((version === 1 ? 144 : 72) * bitrate / sampleRate) + padding;
  }
  return { version, vbits, layer, bitrate, sampleRate, channels, padding, samplesPerFrame, frameLength };
}
var sameStream = (a, b) => a.vbits === b.vbits && a.layer === b.layer && a.sampleRate === b.sampleRate;
async function indexMp3(src) {
  const WIN = 1 << 20;
  let buf = new Uint8Array(0), bufStart = 0;
  const at = async (pos2, n) => {
    if (pos2 < bufStart || pos2 + n > bufStart + buf.length) {
      bufStart = pos2;
      buf = await src.read(pos2, Math.min(WIN, src.size - pos2));
    }
    return buf.subarray(pos2 - bufStart, pos2 - bufStart + n);
  };
  let pos = 0;
  while (pos + 10 <= src.size) {
    const h = await at(pos, 10);
    if (h[0] !== 73 || h[1] !== 68 || h[2] !== 51) break;
    const size = (h[6] & 127) << 21 | (h[7] & 127) << 14 | (h[8] & 127) << 7 | h[9] & 127;
    pos += 10 + size + (h[5] & 16 ? 10 : 0);
  }
  let end = src.size;
  if (end >= 128) {
    const t = await at(end - 128, 3);
    if (t[0] === 84 && t[1] === 65 && t[2] === 71) end -= 128;
  }
  const offsets = [], sizes = [];
  let first = null, resyncs = 0, skippedXing = false;
  const headerAt = async (p) => {
    if (p + 4 > end) return null;
    const h = await at(p, 4);
    return parseHeader(h[0], h[1], h[2], h[3]);
  };
  while (pos + 4 <= end) {
    const h = await headerAt(pos);
    let ok = h && pos + h.frameLength <= end && (!first || sameStream(first, h));
    if (ok && !first) {
      const n = pos + h.frameLength < end ? await headerAt(pos + h.frameLength) : h;
      ok = !!n && sameStream(h, n);
    }
    if (!ok) {
      pos++;
      if (first) resyncs++;
      continue;
    }
    if (!first) {
      first = h;
      const sideInfo = h.version === 1 ? h.channels === 1 ? 17 : 32 : h.channels === 1 ? 9 : 17;
      const tag = await at(pos + 4 + sideInfo, 4);
      const vbri = await at(pos + 36, 4);
      const s = String.fromCharCode(...tag), v = String.fromCharCode(...vbri);
      if (s === "Xing" || s === "Info" || v === "VBRI") {
        skippedXing = true;
        pos += h.frameLength;
        continue;
      }
    }
    offsets.push(pos);
    sizes.push(h.frameLength);
    pos += h.frameLength;
  }
  if (!first) return null;
  const count = offsets.length;
  return {
    codec: "mp3",
    sampleRate: first.sampleRate,
    channels: first.channels,
    layer: first.layer,
    samplesPerFrame: first.samplesPerFrame,
    frames: { count, offsets: Float64Array.from(offsets), sizes: Uint32Array.from(sizes) },
    durationS: count * first.samplesPerFrame / first.sampleRate,
    skippedXing,
    resyncs
  };
}

// src/core/window-sink.js
var WindowSink = class {
  /**
   * @param {object} o
   * @param {number} [o.startS=0]       window start, presentation seconds
   * @param {number|null} [o.endS=null] window end; null = until the decoder stops
   * @param {number} [o.fadeInS=0]
   * @param {number} [o.fadeOutS=0]     needs endS
   * @param {string[]} [o.layout]       channel labels if the decoder knows them
   */
  constructor({ startS = 0, endS = null, fadeInS = 0, fadeOutS = 0, layout } = {}) {
    if (fadeOutS > 0 && endS == null) throw new Error("fade-out needs a known window end");
    this.startS = startS;
    this.endS = endS;
    this.fadeInS = fadeInS;
    this.fadeOutS = fadeOutS;
    this.layout = layout;
    this.meter = null;
    this.plan = null;
    this.sampleRate = null;
    this.inChannels = null;
    this.lastEndS = -Infinity;
    this.gaps = 0;
  }
  /** True once audio at or beyond the window end has been seen. */
  get done() {
    return this.endS != null && this.lastEndS >= this.endS;
  }
  /**
   * @param {Float32Array[]} planar decoded frames, one array per channel
   * @param {number} sampleRate
   * @param {number} timestampS presentation time of the first frame
   */
  push(planar, sampleRate, timestampS) {
    const n = planar[0]?.length ?? 0;
    if (!n) return;
    if (!this.meter) {
      this.sampleRate = sampleRate;
      this.inChannels = planar.length;
      this.plan = planChannels(planar.length, this.layout);
      this.meter = new LoudnessMeter({ sampleRate, channels: this.plan.mix ? 2 : planar.length, weights: this.plan.weights });
    } else if (sampleRate !== this.sampleRate || planar.length !== this.inChannels) {
      throw new Error(`stream changed format mid-clip (${this.sampleRate} Hz ${this.inChannels}ch \u2192 ${sampleRate} Hz ${planar.length}ch)`);
    }
    const t0 = timestampS;
    const t1 = t0 + n / sampleRate;
    if (Number.isFinite(this.lastEndS) && Math.abs(t0 - this.lastEndS) > 1.5 / sampleRate) this.gaps++;
    this.lastEndS = Math.max(this.lastEndS, t1);
    let a = Math.max(0, Math.ceil((this.startS - t0) * sampleRate - 1e-6));
    let b = this.endS == null ? n : Math.min(n, Math.ceil((this.endS - t0) * sampleRate - 1e-6));
    if (b <= a) return;
    let chunk = planar.map((ch) => ch.subarray(a, b));
    if (this.fadeInS > 0 || this.fadeOutS > 0) chunk = this._fade(chunk, t0 + a / sampleRate, sampleRate);
    this.meter.push(applyMix(chunk, this.plan.mix));
  }
  _fade(chunk, tStart, fs) {
    const n = chunk[0].length;
    const fiEnd = this.startS + this.fadeInS;
    const foStart = this.endS != null ? this.endS - this.fadeOutS : Infinity;
    if (tStart >= fiEnd && tStart + n / fs <= foStart) return chunk;
    const g = new Float32Array(n);
    for (let i2 = 0; i2 < n; i2++) {
      const t = tStart + i2 / fs;
      let v = 1;
      if (this.fadeInS > 0 && t < fiEnd) v = Math.min(v, (t - this.startS) / this.fadeInS);
      if (this.fadeOutS > 0 && t > foStart) v = Math.min(v, (this.endS - t) / this.fadeOutS);
      g[i2] = Math.max(0, v);
    }
    return chunk.map((ch) => {
      const out = new Float32Array(n);
      for (let i2 = 0; i2 < n; i2++) out[i2] = ch[i2] * g[i2];
      return out;
    });
  }
  /**
   * @returns {object|null} meter result plus { channelMode, inputChannels, sampleRate, gaps }, or null if no audio arrived
   */
  finish() {
    if (!this.meter) return null;
    return { ...this.meter.finish(), channelMode: this.plan.mode, inputChannels: this.inChannels, sampleRate: this.sampleRate, gaps: this.gaps };
  }
};

// src/browser/decode.js
var READ_BATCH = 1 << 20;
var MAX_QUEUE = 48;
var PREROLL_S = 0.25;
var FFMPEG_SEGMENT_S = 120;
function sniff(head, name = "") {
  const s = (a, b) => String.fromCharCode(...head.subarray(a, b));
  if (s(0, 4) === "RIFF" && s(8, 12) === "WAVE") return "wav";
  if (["ftyp", "moov", "mdat", "free", "wide", "skip", "pnot"].includes(s(4, 8))) return "mp4";
  if (s(0, 3) === "ID3") return "mp3";
  if (head[0] === 255 && (head[1] & 224) === 224) return "mp3";
  if (head[0] === 48 && head[1] === 38 && head[2] === 178 && head[3] === 117) return "asf";
  if (/\.(mp4|m4a|m4v|mov)$/i.test(name)) return "mp4";
  if (/\.mp3$/i.test(name)) return "mp3";
  return "other";
}
function windowFor(durationS, trim, fade) {
  const startS = (trim?.startMs ?? 0) / 1e3;
  const endS = durationS != null ? durationS - (trim?.endMs ?? 0) / 1e3 : null;
  return { startS, endS, fadeInS: (fade?.inMs ?? 0) / 1e3, fadeOutS: endS == null ? 0 : (fade?.outMs ?? 0) / 1e3 };
}
async function measureWav(media, w0, onProgress) {
  const head = await media.read(0, Math.min(media.size, 1 << 20));
  const h = parseWavHeader(head);
  const durationS = h.frames / h.sampleRate;
  const w = windowFor(durationS, w0.trim, w0.fade);
  const sink = new WindowSink(w);
  const first = Math.max(0, Math.floor(w.startS * h.sampleRate));
  const last = Math.min(h.frames, Math.ceil(w.endS * h.sampleRate));
  const step = Math.max(1, Math.floor((4 << 20) / h.blockAlign));
  for (let f = first; f < last; f += step) {
    const n = Math.min(step, last - f);
    const bytes = await media.read(h.dataOffset + f * h.blockAlign, n * h.blockAlign);
    sink.push(pcmToPlanar(bytes, h, 0, n), h.sampleRate, f / h.sampleRate);
    onProgress?.((f + n - first) / (last - first));
  }
  return { decoder: "wav", info: { codec: `pcm${h.bitsPerSample}${h.format === "float" ? "f" : ""}`, sampleRate: h.sampleRate, channels: h.channels, durationS }, sink };
}
function audioDataToPlanar(ad) {
  const n = ad.numberOfFrames;
  const out = [];
  for (let c = 0; c < ad.numberOfChannels; c++) {
    const a = new Float32Array(n);
    ad.copyTo(a, { planeIndex: c, format: "f32-planar" });
    out.push(a);
  }
  return out;
}
async function runAudioDecoder(media, config, units, sink, w, onProgress) {
  let error = null;
  const decoder = new AudioDecoder({
    output: (ad) => {
      try {
        if (!error) sink.push(audioDataToPlanar(ad), ad.sampleRate, ad.timestamp / 1e6);
      } catch (e) {
        error = e;
      } finally {
        ad.close();
      }
    },
    error: (e) => {
      error = e;
    }
  });
  decoder.configure(config);
  let i2 = 0;
  const from = w.startS - PREROLL_S;
  if (from > 0) {
    let lo = 0, hi = units.count - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (units.timeOf(mid) <= from) lo = mid;
      else hi = mid - 1;
    }
    i2 = lo;
  }
  const span = (w.endS ?? units.timeOf(units.count - 1)) - w.startS || 1;
  while (i2 < units.count && !error) {
    if (w.endS != null && units.timeOf(i2) >= w.endS) break;
    let j = i2 + 1;
    let bytes = units.sizes[i2];
    while (j < units.count && units.offsets[j] === units.offsets[j - 1] + units.sizes[j - 1] && bytes + units.sizes[j] <= READ_BATCH) {
      bytes += units.sizes[j];
      j++;
    }
    const buf = await media.read(units.offsets[i2], bytes);
    let p = 0;
    for (let k = i2; k < j; k++) {
      const size = units.sizes[k];
      decoder.decode(new EncodedAudioChunk({
        type: "key",
        timestamp: Math.round(units.timeOf(k) * 1e6),
        duration: Math.round(units.durationOf(k) * 1e6),
        data: buf.subarray(p, p + size)
      }));
      p += size;
    }
    i2 = j;
    while (decoder.decodeQueueSize > MAX_QUEUE && !error) {
      await new Promise((r) => decoder.addEventListener("dequeue", r, { once: true }));
    }
    onProgress?.(Math.min(1, (units.timeOf(Math.min(i2, units.count - 1)) - w.startS) / span));
    if (sink.done) break;
  }
  if (!error) await decoder.flush().catch((e) => {
    error = e;
  });
  decoder.close();
  if (error) throw error;
}
async function supported(config) {
  if (typeof AudioDecoder === "undefined") return false;
  try {
    return (await AudioDecoder.isConfigSupported(config)).supported;
  } catch {
    return false;
  }
}
async function measureMp4(media, w0, onProgress) {
  const idx = await readMp4Index(media);
  if (!idx.audio) return { status: "no-audio-track", info: { hasVideo: idx.hasVideo } };
  const a = idx.audio;
  const info = { codec: a.codec ?? a.format, sampleRate: a.sampleRate, channels: a.channels, durationS: a.durationS, fragmented: idx.fragmented, hasVideo: idx.hasVideo };
  const config = a.codec && { codec: a.codec, sampleRate: a.sampleRate, numberOfChannels: a.channels, ...a.description ? { description: a.description } : {} };
  if (!config || !await supported(config)) return { fallback: true, info, reason: `WebCodecs cannot decode ${info.codec}` };
  const w = windowFor(a.durationS, w0.trim, w0.fade);
  const sink = new WindowSink(w);
  const s = a.samples;
  await runAudioDecoder(media, config, {
    count: s.count,
    offsets: s.offsets,
    sizes: s.sizes,
    timeOf: a.timeOf,
    durationOf: (i2) => s.durations[i2] / a.timescale
  }, sink, w, onProgress);
  return { decoder: "webcodecs", info, sink };
}
async function measureMp3(media, w0, onProgress) {
  const idx = await indexMp3(media);
  if (!idx) return { fallback: true, info: {}, reason: "no MPEG audio frames found" };
  const info = { codec: idx.layer === 3 ? "mp3" : `mp${idx.layer}`, sampleRate: idx.sampleRate, channels: idx.channels, durationS: idx.durationS };
  const config = { codec: "mp3", sampleRate: idx.sampleRate, numberOfChannels: idx.channels };
  if (idx.layer !== 3 || !await supported(config)) return { fallback: true, info, reason: "WebCodecs cannot decode this MPEG audio" };
  const w = windowFor(idx.durationS, w0.trim, w0.fade);
  const sink = new WindowSink(w);
  const f = idx.frames, dur = idx.samplesPerFrame / idx.sampleRate;
  await runAudioDecoder(media, config, {
    count: f.count,
    offsets: f.offsets,
    sizes: f.sizes,
    timeOf: (i2) => i2 * dur,
    durationOf: () => dur
  }, sink, w, onProgress);
  return { decoder: "webcodecs", info, sink, warnings: idx.resyncs ? [`mp3-resyncs:${idx.resyncs}`] : [] };
}
var corePromise = null;
async function wasmUrl(base) {
  const res = await fetch(base + "ffmpeg-core.wasm.gz");
  if (!res.ok) return base + "ffmpeg-core.wasm";
  let blob = await res.blob();
  const magic = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (magic[0] === 31 && magic[1] === 139) {
    blob = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).blob();
  }
  return URL.createObjectURL(new Blob([blob], { type: "application/wasm" }));
}
function loadFfmpeg(baseUrl) {
  if (!corePromise) {
    corePromise = (async () => {
      const mt = self.crossOriginIsolated === true && typeof SharedArrayBuffer !== "undefined";
      const base = new URL(mt ? "ffmpeg-core-mt/" : "ffmpeg-core/", baseUrl).href;
      const coreURL = base + "ffmpeg-core.js";
      const { default: createFFmpegCore } = await import(
        /* @vite-ignore */
        coreURL
      );
      const hash = btoa(JSON.stringify({ wasmURL: await wasmUrl(base), workerURL: mt ? base + "ffmpeg-core.worker.js" : void 0 }));
      const core = await createFFmpegCore({ mainScriptUrlOrBlob: `${coreURL}#${hash}` });
      core.multithreaded = mt;
      core.FS.mkdir("/mnt");
      return core;
    })();
    corePromise.catch(() => {
      corePromise = null;
    });
  }
  return corePromise;
}
function ffRun(core, args, log) {
  core.setLogger(({ message }) => log.push(message));
  core.exec(...args);
  const ret = core.ret;
  core.reset();
  return ret;
}
async function measureFfmpeg(media, w0, onProgress, ffmpegBase) {
  const blob = media.blob ?? await media.getBlob?.();
  if (!blob) throw new Error("ffmpeg fallback needs a Blob");
  const core = await loadFfmpeg(ffmpegBase);
  const log = [];
  core.FS.mount(core.FS.filesystems.WORKERFS, { blobs: [{ name: "in", data: blob }] }, "/mnt");
  try {
    core.setLogger(({ message }) => log.push(message));
    core.ffprobe("-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels:format=duration", "-of", "json", "/mnt/in", "-o", "/probe.json");
    core.reset();
    const probe = JSON.parse(new TextDecoder().decode(core.FS.readFile("/probe.json")));
    core.FS.unlink("/probe.json");
    const st = probe.streams?.[0];
    const durationS = Number(probe.format?.duration);
    if (!st) return { status: "no-audio-track", info: { durationS } };
    const sampleRate = Number(st.sample_rate);
    const inCh = st.channels;
    const outCh = inCh > 2 ? 2 : inCh;
    const info = { codec: st.codec_name, sampleRate, channels: inCh, durationS };
    const w = windowFor(durationS, w0.trim, w0.fade);
    const sink = new WindowSink(w);
    const warnings = inCh > 2 ? ["downmixed-by-ffmpeg"] : [];
    for (let s = w.startS; s < w.endS; s += FFMPEG_SEGMENT_S) {
      const len = Math.min(FFMPEG_SEGMENT_S, w.endS - s);
      const ret = ffRun(core, [
        "-v",
        "error",
        "-ss",
        s.toFixed(6),
        "-t",
        len.toFixed(6),
        "-i",
        "/mnt/in",
        "-map",
        "0:a:0",
        ...inCh > 2 ? ["-ac", "2"] : [],
        "-ar",
        String(sampleRate),
        "-f",
        "f32le",
        "-acodec",
        "pcm_f32le",
        "/seg.pcm"
      ], log);
      if (ret !== 0) throw new Error(`ffmpeg failed (${ret}): ${log.slice(-3).join(" ")}`);
      const raw = core.FS.readFile("/seg.pcm");
      core.FS.unlink("/seg.pcm");
      const f32 = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength >> 2);
      const frames = Math.floor(f32.length / outCh);
      const planar = Array.from({ length: outCh }, () => new Float32Array(frames));
      for (let i2 = 0, k = 0; i2 < frames; i2++) for (let c = 0; c < outCh; c++) planar[c][i2] = f32[k++];
      sink.push(planar, sampleRate, s);
      onProgress?.((s + len - w.startS) / (w.endS - w.startS));
    }
    return { decoder: core.multithreaded ? "ffmpeg.wasm-mt" : "ffmpeg.wasm", info, sink, warnings };
  } finally {
    core.FS.unmount("/mnt");
  }
}
async function ffmpegExcerpt(blob, ext, startS, seconds, ffmpegBase, maxBytes = 4 << 20) {
  const core = await loadFfmpeg(ffmpegBase);
  const log = [];
  core.FS.mount(core.FS.filesystems.WORKERFS, { blobs: [{ name: "in", data: blob }] }, "/mnt");
  try {
    const seek = startS > 0 ? ["-ss", startS.toFixed(3)] : [];
    const isoLike = /^\.(mp4|m4a|m4v|mov)$/.test(ext);
    const attempts = [
      { out: `/ex${ext}`, ext, args: ["-map", "0:v:0?", "-map", "0:a:0?", "-c", "copy", ...isoLike ? ["-movflags", "+faststart"] : []] },
      { out: "/ex.wav", ext: ".wav", args: ["-map", "0:a:0", "-c:a", "pcm_s16le"] }
    ];
    const cut = (a, timeoutMs = -1) => {
      core.setTimeout(timeoutMs);
      const ret = ffRun(core, ["-v", "error", ...seek, "-i", "/mnt/in", "-t", String(seconds), ...a.args, a.out], log);
      core.setTimeout(-1);
      let bytes = null;
      if (ret === 0) bytes = core.FS.readFile(a.out);
      try {
        core.FS.unlink(a.out);
      } catch {
      }
      return bytes?.length ? { bytes, ext: a.ext, kind: "excerpt" } : null;
    };
    for (const a of attempts) {
      const r = cut(a);
      if (!r) continue;
      if (r.bytes.length > maxBytes && a.ext !== ".wav") {
        const small = cut({
          out: "/small.mp4",
          ext: ".mp4",
          // One thread: libx264 in the multithreaded wasm build can exhaust the
          // fixed pthread pool and deadlock.
          args: [
            "-threads",
            "1",
            "-filter_threads",
            "1",
            "-map",
            "0:v:0",
            "-map",
            "0:a:0?",
            "-vf",
            "scale=-2:360",
            "-c:v",
            "libx264",
            "-x264-params",
            "threads=1",
            "-preset",
            "ultrafast",
            "-crf",
            "30",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-movflags",
            "+faststart"
          ]
        }, 6e4);
        if (small && small.bytes.length < r.bytes.length) return small;
      }
      return r;
    }
    throw new Error(`ffmpeg could not cut an excerpt: ${log.slice(-2).join(" ")}`);
  } finally {
    core.FS.unmount("/mnt");
  }
}
async function measureMedia(media, o) {
  const w0 = { trim: o.trim, fade: o.fade };
  const warnings = [];
  const kind = sniff(await media.read(0, Math.min(16, media.size)), media.name);
  let r = null;
  let fallbackReason = null;
  try {
    if (!o.forceFfmpeg) {
      if (kind === "wav") r = await measureWav(media, w0, o.onProgress);
      else if (kind === "mp4") r = await measureMp4(media, w0, o.onProgress);
      else if (kind === "mp3") r = await measureMp3(media, w0, o.onProgress);
      else fallbackReason = `no native decoder for ${kind}`;
    }
  } catch (e) {
    fallbackReason = `${e instanceof Mp4Error ? "mp4 index" : "native decode"} failed: ${e.message}`;
    r = null;
  }
  if (r?.status === "no-audio-track") return { status: "no-audio-track", info: r.info, warnings };
  if (r?.fallback) {
    fallbackReason = r.reason;
    r = null;
  }
  if (o.forceFfmpeg) fallbackReason = "forced";
  if (!r) {
    try {
      r = await measureFfmpeg(media, w0, o.onProgress, o.ffmpegBase);
    } catch (e) {
      return { status: "decode-failed", error: e.message, fallbackReason, warnings };
    }
    if (r.status === "no-audio-track") return { status: "no-audio-track", info: r.info, warnings, fallbackReason };
  }
  warnings.push(...r.warnings ?? []);
  const loudness = r.sink.finish();
  if (!loudness) return { status: "decode-failed", error: "decoder produced no audio", decoder: r.decoder, info: r.info, warnings, fallbackReason };
  if (loudness.gaps) warnings.push(`timestamp-gaps:${loudness.gaps}`);
  if (o.fade?.inMs || o.fade?.outMs) warnings.push("fade-applied");
  return { status: "ok", decoder: r.decoder, info: r.info, loudness, warnings, fallbackReason };
}

// src/browser/worker.js
var MAX_INFLATE = 256 << 20;
async function analyze({ id, file, url, size, fileName, ffmpegBase, forceFfmpeg }) {
  const t0 = performance.now();
  const src = file ? blobSource(file, fileName) : httpSource(url, size, 0, fileName);
  const zip = await openZip(src);
  const deck = await readPptx(zip, { fileName });
  postMessage({ type: "deck", id, deck });
  const cache = /* @__PURE__ */ new Map();
  for (const c of deck.clips) {
    if (c.status !== STATUS.OK) continue;
    const key = clipKey(c);
    const ck = `${c.mediaPart}|${c.trim.startMs}|${c.trim.endMs}|${c.fade.inMs}|${c.fade.outMs}`;
    if (!cache.has(ck)) {
      const t1 = performance.now();
      const entry = zip.get(c.mediaPart);
      const range = await entry.range();
      let media;
      if (range) media = file ? mediaSource(file, range, c.mediaPart) : src.sub(range, c.mediaPart);
      else if (entry.uncompressedSize <= MAX_INFLATE) media = blobSource(new Blob([await entry.bytes()]), c.mediaPart);
      else {
        cache.set(ck, { status: "decode-failed", error: "media is compressed inside the zip and too large to inflate", warnings: [] });
        postMessage({ type: "clip", id, key, result: cache.get(ck) });
        continue;
      }
      let last = 0;
      const result = await measureMedia(media, {
        trim: c.trim,
        fade: c.fade,
        ffmpegBase,
        forceFfmpeg,
        onProgress: (fraction) => {
          const now = performance.now();
          if (now - last > 200) {
            last = now;
            postMessage({ type: "progress", id, key, fraction });
          }
        }
      });
      result.ms = performance.now() - t1;
      cache.set(ck, result);
    }
    postMessage({ type: "clip", id, key, result: cache.get(ck) });
  }
  postMessage({ type: "done", id, ms: performance.now() - t0 });
}
async function exists(dir, name) {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch (e) {
    if (e.name === "NotFoundError") return false;
    throw e;
  }
}
async function write({ id, file, fileName, outDir, outName, plan, verify = true, copyUnchanged = false, overwrite = false }) {
  const t0 = performance.now();
  const zip = await openZip(blobSource(file, fileName));
  const deck = await readPptx(zip, { fileName });
  const { replacements, changes } = await buildReplacements(zip, deck, new Map(plan));
  if (!changes.length && !copyUnchanged) {
    postMessage({ type: "written", id, outcome: "skipped-unchanged", changes, ms: performance.now() - t0 });
    return;
  }
  if (!overwrite && await exists(outDir, outName)) {
    postMessage({ type: "written", id, outcome: "exists", changes, ms: performance.now() - t0 });
    return;
  }
  const fh = await outDir.getFileHandle(outName, { create: true });
  const w = await fh.createWritable();
  let bytes = 0, last = 0;
  try {
    for await (const chunk of rewriteZip(zip, replacements)) {
      await w.write(chunk);
      bytes += chunk.length;
      const now = performance.now();
      if (now - last > 200) {
        last = now;
        postMessage({ type: "write-progress", id, fraction: Math.min(1, bytes / file.size) * (verify ? 0.5 : 1) });
      }
    }
    await w.close();
  } catch (e) {
    await w.abort().catch(() => {
    });
    throw e;
  }
  if (verify) {
    try {
      await verifyRewrite(zip, await openZip(blobSource(await fh.getFile(), outName)), replacements);
    } catch (e) {
      await outDir.removeEntry(outName).catch(() => {
      });
      throw new Error(`verification failed, output removed: ${e.message}`);
    }
  }
  postMessage({ type: "written", id, outcome: "written", changes, bytes, verified: verify, ms: performance.now() - t0 });
}
async function writeFile(dir, name, data) {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  try {
    await w.write(data);
    await w.close();
  } catch (e) {
    await w.abort().catch(() => {
    });
    throw e;
  }
  return fh;
}
async function excerpt({ id, file, fileName, mediaPart, startMs = 0, mediaDir, baseName, maxFullBytes = 1 << 20, seconds = 5, ffmpegBase }) {
  const zip = await openZip(blobSource(file, fileName));
  const entry = zip.get(mediaPart);
  if (!entry) throw new Error(`${mediaPart} not found`);
  const ext = (mediaPart.match(/\.[^./]+$/)?.[0] ?? ".bin").toLowerCase();
  const range = await entry.range();
  const blob = range ? file.slice(range.offset, range.offset + range.length) : new Blob([await entry.bytes()]);
  if (blob.size <= maxFullBytes) {
    await writeFile(mediaDir, baseName + ext, blob);
    postMessage({ type: "excerpted", id, name: baseName + ext, kind: "full" });
    return;
  }
  const r = await ffmpegExcerpt(blob, ext, startMs / 1e3, seconds, ffmpegBase);
  await writeFile(mediaDir, baseName + r.ext, r.bytes);
  postMessage({ type: "excerpted", id, name: baseName + r.ext, kind: "excerpt", seconds });
}
async function tone({ id, templateUrl, outDir, outName, lref, batchId, date, deckCount, clipCount, seconds = 30 }) {
  const res = await fetch(templateUrl);
  if (!res.ok) throw new Error(`template not found (HTTP ${res.status})`);
  const tzip = await openZip(blobSource(await res.blob(), "template.pptx"));
  const { replacements } = await buildToneDeck(tzip, { lref, batchId, date, deckCount, clipCount, seconds });
  const fh = await outDir.getFileHandle(outName, { create: true });
  const w = await fh.createWritable();
  try {
    for await (const chunk of rewriteZip(tzip, replacements)) await w.write(chunk);
    await w.close();
  } catch (e) {
    await w.abort().catch(() => {
    });
    throw e;
  }
  const out = await openZip(blobSource(await fh.getFile(), outName));
  const deck = await readPptx(out, { fileName: outName });
  const measured = [];
  for (const c of deck.clips) {
    const { channels, sampleRate } = decodeWav(await out.get(c.mediaPart).bytes());
    const r = measureLoudness(channels, sampleRate, { weights: planChannels(channels.length).weights });
    measured.push({ slide: c.slideNumber, channels: channels.length, lufs: r.integrated, vol: c.vol });
  }
  postMessage({ type: "toned", id, name: outName, measured });
}
self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === "analyze") await analyze(msg);
    else if (msg.type === "write") await write(msg);
    else if (msg.type === "excerpt") await excerpt(msg);
    else if (msg.type === "tone") await tone(msg);
  } catch (err2) {
    postMessage({ type: "error", id: msg.id, message: err2?.message ?? String(err2) });
  }
};
