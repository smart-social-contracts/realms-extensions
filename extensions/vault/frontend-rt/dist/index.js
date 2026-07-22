var ho = Object.defineProperty;
var Ma = (e) => {
  throw TypeError(e);
};
var po = (e, r, t) => r in e ? ho(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var ut = (e, r, t) => po(e, typeof r != "symbol" ? r + "" : r, t), qn = (e, r, t) => r.has(e) || Ma("Cannot " + t);
var l = (e, r, t) => (qn(e, r, "read from private field"), t ? t.call(e) : r.get(e)), q = (e, r, t) => r.has(e) ? Ma("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), G = (e, r, t, n) => (qn(e, r, "write to private field"), n ? n.call(e, t) : r.set(e, t), t), fe = (e, r, t) => (qn(e, r, "access private method"), t);
var oa = Array.isArray, bo = Array.prototype.indexOf, Lr = Array.prototype.includes, Sn = Array.from, xo = Object.defineProperty, Hr = Object.getOwnPropertyDescriptor, yo = Object.prototype, mo = Array.prototype, ko = Object.getPrototypeOf, Na = Object.isExtensible;
const wo = () => {
};
function Eo(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function qa() {
  var e, r, t = new Promise((n, i) => {
    e = n, r = i;
  });
  return { promise: t, resolve: e, reject: r };
}
function So(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const n of e)
    if (t.push(n), t.length === r) break;
  return t;
}
const Ce = 2, Pr = 4, Tn = 8, za = 1 << 24, wt = 16, ht = 32, Qt = 64, Gn = 128, rt = 512, Te = 1024, Oe = 2048, Et = 4096, je = 8192, nt = 16384, mr = 32768, Ra = 1 << 25, pr = 65536, Jn = 1 << 17, To = 1 << 18, Ir = 1 << 19, Ao = 1 << 20, kt = 1 << 25, br = 65536, yn = 1 << 21, Wr = 1 << 22, Kt = 1 << 23, qr = Symbol("$state"), Ct = new class extends Error {
  constructor() {
    super(...arguments);
    ut(this, "name", "StaleReactionError");
    ut(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Mo() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function No(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Ro(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Lo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Po(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Do() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Oo() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Co() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Io() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Fo() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const jo = 1, Bo = 2, Ua = 4, Vo = 8, Ho = 16, qo = 1, zo = 2, Ne = Symbol(), Ya = "http://www.w3.org/1999/xhtml", Uo = "http://www.w3.org/2000/svg", Yo = "http://www.w3.org/1998/Math/MathML";
function Wo() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Go() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Jo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Wa(e) {
  return e === this.v;
}
function Ko(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function Ga(e) {
  return !Ko(e, this.v);
}
let it = null;
function Dr(e) {
  it = e;
}
function Ja(e, r = !1, t) {
  it = {
    p: it,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      X
    ),
    l: null
  };
}
function Ka(e) {
  var r = (
    /** @type {ComponentContext} */
    it
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var n of t)
      hi(n);
  }
  return r.i = !0, it = r.p, /** @type {T} */
  {};
}
function Xa() {
  return !0;
}
let or = [];
function Za() {
  var e = or;
  or = [], Eo(e);
}
function Xt(e) {
  if (or.length === 0 && !zr) {
    var r = or;
    queueMicrotask(() => {
      r === or && Za();
    });
  }
  or.push(e);
}
function Xo() {
  for (; or.length > 0; )
    Za();
}
function Qa(e) {
  var r = X;
  if (r === null)
    return K.f |= Kt, e;
  if ((r.f & mr) === 0 && (r.f & Pr) === 0)
    throw e;
  Gt(e, r);
}
function Gt(e, r) {
  for (; r !== null; ) {
    if ((r.f & Gn) !== 0) {
      if ((r.f & mr) === 0)
        throw e;
      try {
        r.b.error(e);
        return;
      } catch (t) {
        e = t;
      }
    }
    r = r.parent;
  }
  throw e;
}
const Zo = -7169;
function Ee(e, r) {
  e.f = e.f & Zo | r;
}
function sa(e) {
  (e.f & rt) !== 0 || e.deps === null ? Ee(e, Te) : Ee(e, Et);
}
function $a(e) {
  if (e !== null)
    for (const r of e)
      (r.f & Ce) === 0 || (r.f & br) === 0 || (r.f ^= br, $a(
        /** @type {Derived} */
        r.deps
      ));
}
function ei(e, r, t) {
  (e.f & Oe) !== 0 ? r.add(e) : (e.f & Et) !== 0 && t.add(e), $a(e.deps), Ee(e, Te);
}
const ir = /* @__PURE__ */ new Set();
let B = null, _t = null, Kn = null, zr = !1, zn = !1, Sr = null, vn = null;
var La = 0;
let Qo = 1;
var Tr, Ar, fr, It, xt, Kr, We, Xr, Yt, Ft, yt, Mr, Nr, ur, Se, _n, ti, gn, Xn, hn, $o;
const kn = class kn {
  constructor() {
    q(this, Se);
    ut(this, "id", Qo++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    ut(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    ut(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    q(this, Tr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    q(this, Ar, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    q(this, fr, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    q(this, It, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    q(this, xt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    q(this, Kr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    q(this, We, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    q(this, Xr, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    q(this, Yt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    q(this, Ft, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    q(this, yt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    q(this, Mr, /* @__PURE__ */ new Set());
    ut(this, "is_fork", !1);
    q(this, Nr, !1);
    /** @type {Set<Batch>} */
    q(this, ur, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    l(this, yt).has(r) || l(this, yt).set(r, { d: [], m: [] }), l(this, Mr).delete(r);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(r, t = (n) => this.schedule(n)) {
    var n = l(this, yt).get(r);
    if (n) {
      l(this, yt).delete(r);
      for (var i of n.d)
        Ee(i, Oe), t(i);
      for (i of n.m)
        Ee(i, Et), t(i);
    }
    l(this, Mr).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, n = !1) {
    r.v !== Ne && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & Kt) === 0 && (this.current.set(r, [t, n]), _t?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    B = this;
  }
  deactivate() {
    B = null, _t = null;
  }
  flush() {
    try {
      zn = !0, B = this, fe(this, Se, gn).call(this);
    } finally {
      La = 0, Kn = null, Sr = null, vn = null, zn = !1, B = null, _t = null, _r.clear();
    }
  }
  discard() {
    for (const r of l(this, Ar)) r(this);
    l(this, Ar).clear(), l(this, fr).clear(), ir.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    l(this, Xr).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    let n = l(this, It).get(t) ?? 0;
    if (l(this, It).set(t, n + 1), r) {
      let i = l(this, xt).get(t) ?? 0;
      l(this, xt).set(t, i + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(r, t, n) {
    let i = l(this, It).get(t) ?? 0;
    if (i === 1 ? l(this, It).delete(t) : l(this, It).set(t, i - 1), r) {
      let o = l(this, xt).get(t) ?? 0;
      o === 1 ? l(this, xt).delete(t) : l(this, xt).set(t, o - 1);
    }
    l(this, Nr) || n || (G(this, Nr, !0), Xt(() => {
      G(this, Nr, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(r, t) {
    for (const n of r)
      l(this, Yt).add(n);
    for (const n of t)
      l(this, Ft).add(n);
    r.clear(), t.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(r) {
    l(this, Tr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    l(this, Ar).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(r) {
    l(this, fr).add(r);
  }
  run_fork_commit_callbacks() {
    for (const r of l(this, fr)) r(this);
    l(this, fr).clear();
  }
  settled() {
    return (l(this, Kr) ?? G(this, Kr, qa())).promise;
  }
  static ensure() {
    if (B === null) {
      const r = B = new kn();
      zn || (ir.add(B), zr || Xt(() => {
        B === r && r.flush();
      }));
    }
    return B;
  }
  apply() {
    {
      _t = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if (Kn = r, r.b?.is_pending && (r.f & (Pr | Tn | za)) !== 0 && (r.f & mr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var n = t.f;
      if (Sr !== null && t === X && (K === null || (K.f & Ce) === 0))
        return;
      if ((n & (Qt | ht)) !== 0) {
        if ((n & Te) === 0)
          return;
        t.f ^= Te;
      }
    }
    l(this, We).push(t);
  }
};
Tr = new WeakMap(), Ar = new WeakMap(), fr = new WeakMap(), It = new WeakMap(), xt = new WeakMap(), Kr = new WeakMap(), We = new WeakMap(), Xr = new WeakMap(), Yt = new WeakMap(), Ft = new WeakMap(), yt = new WeakMap(), Mr = new WeakMap(), Nr = new WeakMap(), ur = new WeakMap(), Se = new WeakSet(), _n = function() {
  return this.is_fork || l(this, xt).size > 0;
}, ti = function() {
  for (const n of l(this, ur))
    for (const i of l(n, xt).keys()) {
      for (var r = !1, t = i; t.parent !== null; ) {
        if (l(this, yt).has(t)) {
          r = !0;
          break;
        }
        t = t.parent;
      }
      if (!r)
        return !0;
    }
  return !1;
}, gn = function() {
  var d;
  if (La++ > 1e3 && (ir.delete(this), ts()), !fe(this, Se, _n).call(this)) {
    for (const s of l(this, Yt))
      l(this, Ft).delete(s), Ee(s, Oe), this.schedule(s);
    for (const s of l(this, Ft))
      Ee(s, Et), this.schedule(s);
  }
  const r = l(this, We);
  G(this, We, []), this.apply();
  var t = Sr = [], n = [], i = vn = [];
  for (const s of r)
    try {
      fe(this, Se, Xn).call(this, s, t, n);
    } catch (_) {
      throw ai(s), _;
    }
  if (B = null, i.length > 0) {
    var o = kn.ensure();
    for (const s of i)
      o.schedule(s);
  }
  if (Sr = null, vn = null, fe(this, Se, _n).call(this) || fe(this, Se, ti).call(this)) {
    fe(this, Se, hn).call(this, n), fe(this, Se, hn).call(this, t);
    for (const [s, _] of l(this, yt))
      ni(s, _);
  } else {
    l(this, It).size === 0 && ir.delete(this), l(this, Yt).clear(), l(this, Ft).clear();
    for (const s of l(this, Tr)) s(this);
    l(this, Tr).clear(), Pa(n), Pa(t), l(this, Kr)?.resolve();
  }
  var c = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    B
  );
  if (l(this, We).length > 0) {
    const s = c ?? (c = this);
    l(s, We).push(...l(this, We).filter((_) => !l(s, We).includes(_)));
  }
  c !== null && (ir.add(c), fe(d = c, Se, gn).call(d));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Xn = function(r, t, n) {
  r.f ^= Te;
  for (var i = r.first; i !== null; ) {
    var o = i.f, c = (o & (ht | Qt)) !== 0, d = c && (o & Te) !== 0, s = d || (o & je) !== 0 || l(this, yt).has(i);
    if (!s && i.fn !== null) {
      c ? i.f ^= Te : (o & Pr) !== 0 ? t.push(i) : rn(i) && ((o & wt) !== 0 && l(this, Ft).add(i), Cr(i));
      var _ = i.first;
      if (_ !== null) {
        i = _;
        continue;
      }
    }
    for (; i !== null; ) {
      var x = i.next;
      if (x !== null) {
        i = x;
        break;
      }
      i = i.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
hn = function(r) {
  for (var t = 0; t < r.length; t += 1)
    ei(r[t], l(this, Yt), l(this, Ft));
}, $o = function() {
  var x, S, b;
  for (const m of ir) {
    var r = m.id < this.id, t = [];
    for (const [k, [V, w]] of this.current) {
      if (m.current.has(k)) {
        var n = (
          /** @type {[any, boolean]} */
          m.current.get(k)[0]
        );
        if (r && V !== n)
          m.current.set(k, [V, w]);
        else
          continue;
      }
      t.push(k);
    }
    var i = [...m.current.keys()].filter((k) => !this.current.has(k));
    if (i.length === 0)
      r && m.discard();
    else if (t.length > 0) {
      if (r)
        for (const k of l(this, Mr))
          m.unskip_effect(k, (V) => {
            var w;
            (V.f & (wt | Wr)) !== 0 ? m.schedule(V) : fe(w = m, Se, hn).call(w, [V]);
          });
      m.activate();
      var o = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
      for (var d of t)
        ri(d, i, o, c);
      c = /* @__PURE__ */ new Map();
      var s = [...m.current.keys()].filter(
        (k) => this.current.has(k) ? (
          /** @type {[any, boolean]} */
          this.current.get(k)[0] !== k
        ) : !0
      );
      for (const k of l(this, Xr))
        (k.f & (nt | je | Jn)) === 0 && la(k, s, c) && ((k.f & (Wr | wt)) !== 0 ? (Ee(k, Oe), m.schedule(k)) : l(m, Yt).add(k));
      if (l(m, We).length > 0) {
        m.apply();
        for (var _ of l(m, We))
          fe(x = m, Se, Xn).call(x, _, [], []);
        G(m, We, []);
      }
      m.deactivate();
    }
  }
  for (const m of ir)
    l(m, ur).has(this) && (l(m, ur).delete(this), l(m, ur).size === 0 && !fe(S = m, Se, _n).call(S) && (m.activate(), fe(b = m, Se, gn).call(b)));
};
let xr = kn;
function es(e) {
  var r = zr;
  zr = !0;
  try {
    for (var t; ; ) {
      if (Xo(), B === null)
        return (
          /** @type {T} */
          t
        );
      B.flush();
    }
  } finally {
    zr = r;
  }
}
function ts() {
  try {
    Do();
  } catch (e) {
    Gt(e, Kn);
  }
}
let Ot = null;
function Pa(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var n = e[t++];
      if ((n.f & (nt | je)) === 0 && rn(n) && (Ot = /* @__PURE__ */ new Set(), Cr(n), n.deps === null && n.first === null && n.nodes === null && n.teardown === null && n.ac === null && yi(n), Ot?.size > 0)) {
        _r.clear();
        for (const i of Ot) {
          if ((i.f & (nt | je)) !== 0) continue;
          const o = [i];
          let c = i.parent;
          for (; c !== null; )
            Ot.has(c) && (Ot.delete(c), o.push(c)), c = c.parent;
          for (let d = o.length - 1; d >= 0; d--) {
            const s = o[d];
            (s.f & (nt | je)) === 0 && Cr(s);
          }
        }
        Ot.clear();
      }
    }
    Ot = null;
  }
}
function ri(e, r, t, n) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & Ce) !== 0 ? ri(
        /** @type {Derived} */
        i,
        r,
        t,
        n
      ) : (o & (Wr | wt)) !== 0 && (o & Oe) === 0 && la(i, r, n) && (Ee(i, Oe), fa(
        /** @type {Effect} */
        i
      ));
    }
}
function la(e, r, t) {
  const n = t.get(e);
  if (n !== void 0) return n;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (Lr.call(r, i))
        return !0;
      if ((i.f & Ce) !== 0 && la(
        /** @type {Derived} */
        i,
        r,
        t
      ))
        return t.set(
          /** @type {Derived} */
          i,
          !0
        ), !0;
    }
  return t.set(e, !1), !1;
}
function fa(e) {
  B.schedule(e);
}
function ni(e, r) {
  if (!((e.f & ht) !== 0 && (e.f & Te) !== 0)) {
    (e.f & Oe) !== 0 ? r.d.push(e) : (e.f & Et) !== 0 && r.m.push(e), Ee(e, Te);
    for (var t = e.first; t !== null; )
      ni(t, r), t = t.next;
  }
}
function ai(e) {
  Ee(e, Te);
  for (var r = e.first; r !== null; )
    ai(r), r = r.next;
}
function rs(e) {
  let r = 0, t = yr(0), n;
  return () => {
    ca() && (a(t), pi(() => (r === 0 && (n = Ri(() => e(() => Ur(t)))), r += 1, () => {
      Xt(() => {
        r -= 1, r === 0 && (n?.(), n = void 0, Ur(t));
      });
    })));
  };
}
var ns = pr | Ir;
function as(e, r, t, n) {
  new is(e, r, t, n);
}
var Qe, ia, $e, dr, Ve, et, Fe, Ge, jt, cr, Wt, Rr, Zr, Qr, Bt, wn, me, os, ss, ls, Zn, pn, bn, Qn, $n;
class is {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, n, i) {
    q(this, me);
    /** @type {Boundary | null} */
    ut(this, "parent");
    ut(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    ut(this, "transform_error");
    /** @type {TemplateNode} */
    q(this, Qe);
    /** @type {TemplateNode | null} */
    q(this, ia, null);
    /** @type {BoundaryProps} */
    q(this, $e);
    /** @type {((anchor: Node) => void)} */
    q(this, dr);
    /** @type {Effect} */
    q(this, Ve);
    /** @type {Effect | null} */
    q(this, et, null);
    /** @type {Effect | null} */
    q(this, Fe, null);
    /** @type {Effect | null} */
    q(this, Ge, null);
    /** @type {DocumentFragment | null} */
    q(this, jt, null);
    q(this, cr, 0);
    q(this, Wt, 0);
    q(this, Rr, !1);
    /** @type {Set<Effect>} */
    q(this, Zr, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    q(this, Qr, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    q(this, Bt, null);
    q(this, wn, rs(() => (G(this, Bt, yr(l(this, cr))), () => {
      G(this, Bt, null);
    })));
    G(this, Qe, r), G(this, $e, t), G(this, dr, (o) => {
      var c = (
        /** @type {Effect} */
        X
      );
      c.b = this, c.f |= Gn, n(o);
    }), this.parent = /** @type {Effect} */
    X.b, this.transform_error = i ?? this.parent?.transform_error ?? ((o) => o), G(this, Ve, Mn(() => {
      fe(this, me, Zn).call(this);
    }, ns));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    ei(r, l(this, Zr), l(this, Qr));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!l(this, $e).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    fe(this, me, Qn).call(this, r, t), G(this, cr, l(this, cr) + r), !(!l(this, Bt) || l(this, Rr)) && (G(this, Rr, !0), Xt(() => {
      G(this, Rr, !1), l(this, Bt) && Or(l(this, Bt), l(this, cr));
    }));
  }
  get_effect_pending() {
    return l(this, wn).call(this), a(
      /** @type {Source<number>} */
      l(this, Bt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!l(this, $e).onerror && !l(this, $e).failed)
      throw r;
    B?.is_fork ? (l(this, et) && B.skip_effect(l(this, et)), l(this, Fe) && B.skip_effect(l(this, Fe)), l(this, Ge) && B.skip_effect(l(this, Ge)), B.on_fork_commit(() => {
      fe(this, me, $n).call(this, r);
    })) : fe(this, me, $n).call(this, r);
  }
}
Qe = new WeakMap(), ia = new WeakMap(), $e = new WeakMap(), dr = new WeakMap(), Ve = new WeakMap(), et = new WeakMap(), Fe = new WeakMap(), Ge = new WeakMap(), jt = new WeakMap(), cr = new WeakMap(), Wt = new WeakMap(), Rr = new WeakMap(), Zr = new WeakMap(), Qr = new WeakMap(), Bt = new WeakMap(), wn = new WeakMap(), me = new WeakSet(), os = function() {
  try {
    G(this, et, tt(() => l(this, dr).call(this, l(this, Qe))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
ss = function(r) {
  const t = l(this, $e).failed;
  t && G(this, Ge, tt(() => {
    t(
      l(this, Qe),
      () => r,
      () => () => {
      }
    );
  }));
}, ls = function() {
  const r = l(this, $e).pending;
  r && (this.is_pending = !0, G(this, Fe, tt(() => r(l(this, Qe)))), Xt(() => {
    var t = G(this, jt, document.createDocumentFragment()), n = Zt();
    t.append(n), G(this, et, fe(this, me, bn).call(this, () => tt(() => l(this, dr).call(this, n)))), l(this, Wt) === 0 && (l(this, Qe).before(t), G(this, jt, null), gr(
      /** @type {Effect} */
      l(this, Fe),
      () => {
        G(this, Fe, null);
      }
    ), fe(this, me, pn).call(
      this,
      /** @type {Batch} */
      B
    ));
  }));
}, Zn = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), G(this, Wt, 0), G(this, cr, 0), G(this, et, tt(() => {
      l(this, dr).call(this, l(this, Qe));
    })), l(this, Wt) > 0) {
      var r = G(this, jt, document.createDocumentFragment());
      ha(l(this, et), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        l(this, $e).pending
      );
      G(this, Fe, tt(() => t(l(this, Qe))));
    } else
      fe(this, me, pn).call(
        this,
        /** @type {Batch} */
        B
      );
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {Batch} batch
 */
pn = function(r) {
  this.is_pending = !1, r.transfer_effects(l(this, Zr), l(this, Qr));
}, /**
 * @template T
 * @param {() => T} fn
 */
bn = function(r) {
  var t = X, n = K, i = it;
  St(l(this, Ve)), ot(l(this, Ve)), Dr(l(this, Ve).ctx);
  try {
    return xr.ensure(), r();
  } catch (o) {
    return Qa(o), null;
  } finally {
    St(t), ot(n), Dr(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Qn = function(r, t) {
  var n;
  if (!this.has_pending_snippet()) {
    this.parent && fe(n = this.parent, me, Qn).call(n, r, t);
    return;
  }
  G(this, Wt, l(this, Wt) + r), l(this, Wt) === 0 && (fe(this, me, pn).call(this, t), l(this, Fe) && gr(l(this, Fe), () => {
    G(this, Fe, null);
  }), l(this, jt) && (l(this, Qe).before(l(this, jt)), G(this, jt, null)));
}, /**
 * @param {unknown} error
 */
$n = function(r) {
  l(this, et) && (qe(l(this, et)), G(this, et, null)), l(this, Fe) && (qe(l(this, Fe)), G(this, Fe, null)), l(this, Ge) && (qe(l(this, Ge)), G(this, Ge, null));
  var t = l(this, $e).onerror;
  let n = l(this, $e).failed;
  var i = !1, o = !1;
  const c = () => {
    if (i) {
      Jo();
      return;
    }
    i = !0, o && Fo(), l(this, Ge) !== null && gr(l(this, Ge), () => {
      G(this, Ge, null);
    }), fe(this, me, bn).call(this, () => {
      fe(this, me, Zn).call(this);
    });
  }, d = (s) => {
    try {
      o = !0, t?.(s, c), o = !1;
    } catch (_) {
      Gt(_, l(this, Ve) && l(this, Ve).parent);
    }
    n && G(this, Ge, fe(this, me, bn).call(this, () => {
      try {
        return tt(() => {
          var _ = (
            /** @type {Effect} */
            X
          );
          _.b = this, _.f |= Gn, n(
            l(this, Qe),
            () => s,
            () => c
          );
        });
      } catch (_) {
        return Gt(
          _,
          /** @type {Effect} */
          l(this, Ve).parent
        ), null;
      }
    }));
  };
  Xt(() => {
    var s;
    try {
      s = this.transform_error(r);
    } catch (_) {
      Gt(_, l(this, Ve) && l(this, Ve).parent);
      return;
    }
    s !== null && typeof s == "object" && typeof /** @type {any} */
    s.then == "function" ? s.then(
      d,
      /** @param {unknown} e */
      (_) => Gt(_, l(this, Ve) && l(this, Ve).parent)
    ) : d(s);
  });
};
function fs(e, r, t, n) {
  const i = ua;
  var o = e.filter((b) => !b.settled);
  if (t.length === 0 && o.length === 0) {
    n(r.map(i));
    return;
  }
  var c = (
    /** @type {Effect} */
    X
  ), d = us(), s = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((b) => b.promise)) : null;
  function _(b) {
    d();
    try {
      n(b);
    } catch (m) {
      (c.f & nt) === 0 && Gt(m, c);
    }
    mn();
  }
  if (t.length === 0) {
    s.then(() => _(r.map(i)));
    return;
  }
  var x = ii();
  function S() {
    Promise.all(t.map((b) => /* @__PURE__ */ ds(b))).then((b) => _([...r.map(i), ...b])).catch((b) => Gt(b, c)).finally(() => x());
  }
  s ? s.then(() => {
    d(), S(), mn();
  }) : S();
}
function us() {
  var e = (
    /** @type {Effect} */
    X
  ), r = K, t = it, n = (
    /** @type {Batch} */
    B
  );
  return function(o = !0) {
    St(e), ot(r), Dr(t), o && (e.f & nt) === 0 && (n?.activate(), n?.apply());
  };
}
function mn(e = !0) {
  St(null), ot(null), Dr(null), e && B?.deactivate();
}
function ii() {
  var e = (
    /** @type {Effect} */
    X
  ), r = (
    /** @type {Boundary} */
    e.b
  ), t = (
    /** @type {Batch} */
    B
  ), n = r.is_rendered();
  return r.update_pending_count(1, t), t.increment(n, e), (i = !1) => {
    r.update_pending_count(-1, t), t.decrement(n, e, i);
  };
}
// @__NO_SIDE_EFFECTS__
function ua(e) {
  var r = Ce | Oe;
  return X !== null && (X.f |= Ir), {
    ctx: it,
    deps: null,
    effects: null,
    equals: Wa,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Ne
    ),
    wv: 0,
    parent: X,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function ds(e, r, t) {
  let n = (
    /** @type {Effect | null} */
    X
  );
  n === null && Mo();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = yr(
    /** @type {V} */
    Ne
  ), c = !K, d = /* @__PURE__ */ new Map();
  return Ts(() => {
    var s = (
      /** @type {Effect} */
      X
    ), _ = qa();
    i = _.promise;
    try {
      Promise.resolve(e()).then(_.resolve, _.reject).finally(mn);
    } catch (m) {
      _.reject(m), mn();
    }
    var x = (
      /** @type {Batch} */
      B
    );
    if (c) {
      if ((s.f & mr) !== 0)
        var S = ii();
      if (
        /** @type {Boundary} */
        n.b.is_rendered()
      )
        d.get(x)?.reject(Ct), d.delete(x);
      else {
        for (const m of d.values())
          m.reject(Ct);
        d.clear();
      }
      d.set(x, _);
    }
    const b = (m, k = void 0) => {
      if (S) {
        var V = k === Ct;
        S(V);
      }
      if (!(k === Ct || (s.f & nt) !== 0)) {
        if (x.activate(), k)
          o.f |= Kt, Or(o, k);
        else {
          (o.f & Kt) !== 0 && (o.f ^= Kt), Or(o, m);
          for (const [w, F] of d) {
            if (d.delete(w), w === x) break;
            F.reject(Ct);
          }
        }
        x.deactivate();
      }
    };
    _.promise.then(b, (m) => b(null, m || "unknown"));
  }), va(() => {
    for (const s of d.values())
      s.reject(Ct);
  }), new Promise((s) => {
    function _(x) {
      function S() {
        x === i ? s(o) : _(i);
      }
      x.then(S, S);
    }
    _(i);
  });
}
// @__NO_SIDE_EFFECTS__
function qt(e) {
  const r = /* @__PURE__ */ ua(e);
  return wi(r), r;
}
// @__NO_SIDE_EFFECTS__
function cs(e) {
  const r = /* @__PURE__ */ ua(e);
  return r.equals = Ga, r;
}
function vs(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      qe(
        /** @type {Effect} */
        r[t]
      );
  }
}
function da(e) {
  var r, t = X, n = e.parent;
  if (!$t && n !== null && (n.f & (nt | je)) !== 0)
    return Wo(), e.v;
  St(n);
  try {
    e.f &= ~br, vs(e), r = Ai(e);
  } finally {
    St(t);
  }
  return r;
}
function oi(e) {
  var r = da(e);
  if (!e.equals(r) && (e.wv = Si(), (!B?.is_fork || e.deps === null) && (B !== null ? B.capture(e, r, !0) : e.v = r, e.deps === null))) {
    Ee(e, Te);
    return;
  }
  $t || (_t !== null ? (ca() || B?.is_fork) && _t.set(e, r) : sa(e));
}
function _s(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(Ct), r.teardown = wo, r.ac = null, Gr(r, 0), _a(r));
}
function si(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && Cr(r);
}
let ea = /* @__PURE__ */ new Set();
const _r = /* @__PURE__ */ new Map();
let li = !1;
function yr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Wa,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function I(e, r) {
  const t = yr(e);
  return wi(t), t;
}
// @__NO_SIDE_EFFECTS__
function gs(e, r = !1, t = !0) {
  const n = yr(e);
  return r || (n.equals = Ga), n;
}
function p(e, r, t = !1) {
  K !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!gt || (K.f & Jn) !== 0) && Xa() && (K.f & (Ce | wt | Wr | Jn)) !== 0 && (at === null || !Lr.call(at, e)) && Io();
  let n = t ? Ke(r) : r;
  return Or(e, n, vn);
}
function Or(e, r, t = null) {
  if (!e.equals(r)) {
    _r.set(e, $t ? r : e.v);
    var n = xr.ensure();
    if (n.capture(e, r), (e.f & Ce) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & Oe) !== 0 && da(i), _t === null && sa(i);
    }
    e.wv = Si(), fi(e, Oe, t), X !== null && (X.f & Te) !== 0 && (X.f & (ht | Qt)) === 0 && (Ze === null ? Ms([e]) : Ze.push(e)), !n.is_fork && ea.size > 0 && !li && hs();
  }
  return r;
}
function hs() {
  li = !1;
  for (const e of ea)
    (e.f & Te) !== 0 && Ee(e, Et), rn(e) && Cr(e);
  ea.clear();
}
function Ur(e) {
  p(e, e.v + 1);
}
function fi(e, r, t) {
  var n = e.reactions;
  if (n !== null)
    for (var i = n.length, o = 0; o < i; o++) {
      var c = n[o], d = c.f, s = (d & Oe) === 0;
      if (s && Ee(c, r), (d & Ce) !== 0) {
        var _ = (
          /** @type {Derived} */
          c
        );
        _t?.delete(_), (d & br) === 0 && (d & rt && (X === null || (X.f & yn) === 0) && (c.f |= br), fi(_, Et, t));
      } else if (s) {
        var x = (
          /** @type {Effect} */
          c
        );
        (d & wt) !== 0 && Ot !== null && Ot.add(x), t !== null ? t.push(x) : fa(x);
      }
    }
}
function Ke(e) {
  if (typeof e != "object" || e === null || qr in e)
    return e;
  const r = ko(e);
  if (r !== yo && r !== mo)
    return e;
  var t = /* @__PURE__ */ new Map(), n = oa(e), i = /* @__PURE__ */ I(0), o = hr, c = (d) => {
    if (hr === o)
      return d();
    var s = K, _ = hr;
    ot(null), Fa(o);
    var x = d();
    return ot(s), Fa(_), x;
  };
  return n && t.set("length", /* @__PURE__ */ I(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(d, s, _) {
        (!("value" in _) || _.configurable === !1 || _.enumerable === !1 || _.writable === !1) && Oo();
        var x = t.get(s);
        return x === void 0 ? c(() => {
          var S = /* @__PURE__ */ I(_.value);
          return t.set(s, S), S;
        }) : p(x, _.value, !0), !0;
      },
      deleteProperty(d, s) {
        var _ = t.get(s);
        if (_ === void 0) {
          if (s in d) {
            const x = c(() => /* @__PURE__ */ I(Ne));
            t.set(s, x), Ur(i);
          }
        } else
          p(_, Ne), Ur(i);
        return !0;
      },
      get(d, s, _) {
        if (s === qr)
          return e;
        var x = t.get(s), S = s in d;
        if (x === void 0 && (!S || Hr(d, s)?.writable) && (x = c(() => {
          var m = Ke(S ? d[s] : Ne), k = /* @__PURE__ */ I(m);
          return k;
        }), t.set(s, x)), x !== void 0) {
          var b = a(x);
          return b === Ne ? void 0 : b;
        }
        return Reflect.get(d, s, _);
      },
      getOwnPropertyDescriptor(d, s) {
        var _ = Reflect.getOwnPropertyDescriptor(d, s);
        if (_ && "value" in _) {
          var x = t.get(s);
          x && (_.value = a(x));
        } else if (_ === void 0) {
          var S = t.get(s), b = S?.v;
          if (S !== void 0 && b !== Ne)
            return {
              enumerable: !0,
              configurable: !0,
              value: b,
              writable: !0
            };
        }
        return _;
      },
      has(d, s) {
        if (s === qr)
          return !0;
        var _ = t.get(s), x = _ !== void 0 && _.v !== Ne || Reflect.has(d, s);
        if (_ !== void 0 || X !== null && (!x || Hr(d, s)?.writable)) {
          _ === void 0 && (_ = c(() => {
            var b = x ? Ke(d[s]) : Ne, m = /* @__PURE__ */ I(b);
            return m;
          }), t.set(s, _));
          var S = a(_);
          if (S === Ne)
            return !1;
        }
        return x;
      },
      set(d, s, _, x) {
        var S = t.get(s), b = s in d;
        if (n && s === "length")
          for (var m = _; m < /** @type {Source<number>} */
          S.v; m += 1) {
            var k = t.get(m + "");
            k !== void 0 ? p(k, Ne) : m in d && (k = c(() => /* @__PURE__ */ I(Ne)), t.set(m + "", k));
          }
        if (S === void 0)
          (!b || Hr(d, s)?.writable) && (S = c(() => /* @__PURE__ */ I(void 0)), p(S, Ke(_)), t.set(s, S));
        else {
          b = S.v !== Ne;
          var V = c(() => Ke(_));
          p(S, V);
        }
        var w = Reflect.getOwnPropertyDescriptor(d, s);
        if (w?.set && w.set.call(x, _), !b) {
          if (n && typeof s == "string") {
            var F = (
              /** @type {Source<number>} */
              t.get("length")
            ), xe = Number(s);
            Number.isInteger(xe) && xe >= F.v && p(F, xe + 1);
          }
          Ur(i);
        }
        return !0;
      },
      ownKeys(d) {
        a(i);
        var s = Reflect.ownKeys(d).filter((S) => {
          var b = t.get(S);
          return b === void 0 || b.v !== Ne;
        });
        for (var [_, x] of t)
          x.v !== Ne && !(_ in d) && s.push(_);
        return s;
      },
      setPrototypeOf() {
        Co();
      }
    }
  );
}
function Da(e) {
  try {
    if (e !== null && typeof e == "object" && qr in e)
      return e[qr];
  } catch {
  }
  return e;
}
function ps(e, r) {
  return Object.is(Da(e), Da(r));
}
var Oa, ui, di, ci;
function bs() {
  if (Oa === void 0) {
    Oa = window, ui = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    di = Hr(r, "firstChild").get, ci = Hr(r, "nextSibling").get, Na(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Na(t) && (t.__t = void 0);
  }
}
function Zt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Jt(e) {
  return (
    /** @type {TemplateNode | null} */
    di.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function tn(e) {
  return (
    /** @type {TemplateNode | null} */
    ci.call(e)
  );
}
function h(e, r) {
  return /* @__PURE__ */ Jt(e);
}
function dt(e, r = !1) {
  {
    var t = /* @__PURE__ */ Jt(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ tn(t) : t;
  }
}
function y(e, r = 1, t = !1) {
  let n = e;
  for (; r--; )
    n = /** @type {TemplateNode} */
    /* @__PURE__ */ tn(n);
  return n;
}
function xs(e) {
  e.textContent = "";
}
function vi() {
  return !1;
}
function _i(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(r ?? Ya, e, void 0)
  );
}
let Ca = !1;
function ys() {
  Ca || (Ca = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const r of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            r.__on_r?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function An(e) {
  var r = K, t = X;
  ot(null), St(null);
  try {
    return e();
  } finally {
    ot(r), St(t);
  }
}
function gi(e, r, t, n = t) {
  e.addEventListener(r, () => An(t));
  const i = e.__on_r;
  i ? e.__on_r = () => {
    i(), n(!0);
  } : e.__on_r = () => n(!0), ys();
}
function ms(e) {
  X === null && (K === null && Po(), Lo()), $t && Ro();
}
function ks(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Vt(e, r) {
  var t = X;
  t !== null && (t.f & je) !== 0 && (e |= je);
  var n = {
    ctx: it,
    deps: null,
    nodes: null,
    f: e | Oe | rt,
    first: null,
    fn: r,
    last: null,
    next: null,
    parent: t,
    b: t && t.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  B?.register_created_effect(n);
  var i = n;
  if ((e & Pr) !== 0)
    Sr !== null ? Sr.push(n) : xr.ensure().schedule(n);
  else if (r !== null) {
    try {
      Cr(n);
    } catch (c) {
      throw qe(n), c;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Ir) === 0 && (i = i.first, (e & wt) !== 0 && (e & pr) !== 0 && i !== null && (i.f |= pr));
  }
  if (i !== null && (i.parent = t, t !== null && ks(i, t), K !== null && (K.f & Ce) !== 0 && (e & Qt) === 0)) {
    var o = (
      /** @type {Derived} */
      K
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return n;
}
function ca() {
  return K !== null && !gt;
}
function va(e) {
  const r = Vt(Tn, null);
  return Ee(r, Te), r.teardown = e, r;
}
function ws(e) {
  ms();
  var r = (
    /** @type {Effect} */
    X.f
  ), t = !K && (r & ht) !== 0 && (r & mr) === 0;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      it
    );
    (n.e ?? (n.e = [])).push(e);
  } else
    return hi(e);
}
function hi(e) {
  return Vt(Pr | Ao, e);
}
function Es(e) {
  xr.ensure();
  const r = Vt(Qt | Ir, e);
  return (t = {}) => new Promise((n) => {
    t.outro ? gr(r, () => {
      qe(r), n(void 0);
    }) : (qe(r), n(void 0));
  });
}
function Ss(e) {
  return Vt(Pr, e);
}
function Ts(e) {
  return Vt(Wr | Ir, e);
}
function pi(e, r = 0) {
  return Vt(Tn | r, e);
}
function D(e, r = [], t = [], n = []) {
  fs(n, r, t, (i) => {
    Vt(Tn, () => e(...i.map(a)));
  });
}
function Mn(e, r = 0) {
  var t = Vt(wt | r, e);
  return t;
}
function tt(e) {
  return Vt(ht | Ir, e);
}
function bi(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = $t, n = K;
    Ia(!0), ot(null);
    try {
      r.call(null);
    } finally {
      Ia(t), ot(n);
    }
  }
}
function _a(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const i = t.ac;
    i !== null && An(() => {
      i.abort(Ct);
    });
    var n = t.next;
    (t.f & Qt) !== 0 ? t.parent = null : qe(t, r), t = n;
  }
}
function As(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & ht) === 0 && qe(r), r = t;
  }
}
function qe(e, r = !0) {
  var t = !1;
  (r || (e.f & To) !== 0) && e.nodes !== null && e.nodes.end !== null && (xi(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), Ee(e, Ra), _a(e, r && !t), Gr(e, 0);
  var n = e.nodes && e.nodes.t;
  if (n !== null)
    for (const o of n)
      o.stop();
  bi(e), e.f ^= Ra, e.f |= nt;
  var i = e.parent;
  i !== null && i.first !== null && yi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function xi(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ tn(e);
    e.remove(), e = t;
  }
}
function yi(e) {
  var r = e.parent, t = e.prev, n = e.next;
  t !== null && (t.next = n), n !== null && (n.prev = t), r !== null && (r.first === e && (r.first = n), r.last === e && (r.last = t));
}
function gr(e, r, t = !0) {
  var n = [];
  mi(e, n, !0);
  var i = () => {
    t && qe(e), r && r();
  }, o = n.length;
  if (o > 0) {
    var c = () => --o || i();
    for (var d of n)
      d.out(c);
  } else
    i();
}
function mi(e, r, t) {
  if ((e.f & je) === 0) {
    e.f ^= je;
    var n = e.nodes && e.nodes.t;
    if (n !== null)
      for (const d of n)
        (d.is_global || t) && r.push(d);
    for (var i = e.first; i !== null; ) {
      var o = i.next;
      if ((i.f & Qt) === 0) {
        var c = (i.f & pr) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (i.f & ht) !== 0 && (e.f & wt) !== 0;
        mi(i, r, c ? t : !1);
      }
      i = o;
    }
  }
}
function ga(e) {
  ki(e, !0);
}
function ki(e, r) {
  if ((e.f & je) !== 0) {
    e.f ^= je, (e.f & Te) === 0 && (Ee(e, Oe), xr.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var n = t.next, i = (t.f & pr) !== 0 || (t.f & ht) !== 0;
      ki(t, i ? r : !1), t = n;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const c of o)
        (c.is_global || r) && c.in();
  }
}
function ha(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, n = e.nodes.end; t !== null; ) {
      var i = t === n ? null : /* @__PURE__ */ tn(t);
      r.append(t), t = i;
    }
}
let xn = !1, $t = !1;
function Ia(e) {
  $t = e;
}
let K = null, gt = !1;
function ot(e) {
  K = e;
}
let X = null;
function St(e) {
  X = e;
}
let at = null;
function wi(e) {
  K !== null && (at === null ? at = [e] : at.push(e));
}
let He = null, Ye = 0, Ze = null;
function Ms(e) {
  Ze = e;
}
let Ei = 1, sr = 0, hr = sr;
function Fa(e) {
  hr = e;
}
function Si() {
  return ++Ei;
}
function rn(e) {
  var r = e.f;
  if ((r & Oe) !== 0)
    return !0;
  if (r & Ce && (e.f &= ~br), (r & Et) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), n = t.length, i = 0; i < n; i++) {
      var o = t[i];
      if (rn(
        /** @type {Derived} */
        o
      ) && oi(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & rt) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    _t === null && Ee(e, Te);
  }
  return !1;
}
function Ti(e, r, t = !0) {
  var n = e.reactions;
  if (n !== null && !(at !== null && Lr.call(at, e)))
    for (var i = 0; i < n.length; i++) {
      var o = n[i];
      (o.f & Ce) !== 0 ? Ti(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? Ee(o, Oe) : (o.f & Te) !== 0 && Ee(o, Et), fa(
        /** @type {Effect} */
        o
      ));
    }
}
function Ai(e) {
  var V;
  var r = He, t = Ye, n = Ze, i = K, o = at, c = it, d = gt, s = hr, _ = e.f;
  He = /** @type {null | Value[]} */
  null, Ye = 0, Ze = null, K = (_ & (ht | Qt)) === 0 ? e : null, at = null, Dr(e.ctx), gt = !1, hr = ++sr, e.ac !== null && (An(() => {
    e.ac.abort(Ct);
  }), e.ac = null);
  try {
    e.f |= yn;
    var x = (
      /** @type {Function} */
      e.fn
    ), S = x();
    e.f |= mr;
    var b = e.deps, m = B?.is_fork;
    if (He !== null) {
      var k;
      if (m || Gr(e, Ye), b !== null && Ye > 0)
        for (b.length = Ye + He.length, k = 0; k < He.length; k++)
          b[Ye + k] = He[k];
      else
        e.deps = b = He;
      if (ca() && (e.f & rt) !== 0)
        for (k = Ye; k < b.length; k++)
          ((V = b[k]).reactions ?? (V.reactions = [])).push(e);
    } else !m && b !== null && Ye < b.length && (Gr(e, Ye), b.length = Ye);
    if (Xa() && Ze !== null && !gt && b !== null && (e.f & (Ce | Et | Oe)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      Ze.length; k++)
        Ti(
          Ze[k],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (sr++, i.deps !== null)
        for (let w = 0; w < t; w += 1)
          i.deps[w].rv = sr;
      if (r !== null)
        for (const w of r)
          w.rv = sr;
      Ze !== null && (n === null ? n = Ze : n.push(.../** @type {Source[]} */
      Ze));
    }
    return (e.f & Kt) !== 0 && (e.f ^= Kt), S;
  } catch (w) {
    return Qa(w);
  } finally {
    e.f ^= yn, He = r, Ye = t, Ze = n, K = i, at = o, Dr(c), gt = d, hr = s;
  }
}
function Ns(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var n = bo.call(t, e);
    if (n !== -1) {
      var i = t.length - 1;
      i === 0 ? t = r.reactions = null : (t[n] = t[i], t.pop());
    }
  }
  if (t === null && (r.f & Ce) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (He === null || !Lr.call(He, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & rt) !== 0 && (o.f ^= rt, o.f &= ~br), o.v !== Ne && sa(o), _s(o), Gr(o, 0);
  }
}
function Gr(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var n = r; n < t.length; n++)
      Ns(e, t[n]);
}
function Cr(e) {
  var r = e.f;
  if ((r & nt) === 0) {
    Ee(e, Te);
    var t = X, n = xn;
    X = e, xn = !0;
    try {
      (r & (wt | za)) !== 0 ? As(e) : _a(e), bi(e);
      var i = Ai(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = Ei;
      var o;
    } finally {
      xn = n, X = t;
    }
  }
}
async function Rs() {
  await Promise.resolve(), es();
}
function a(e) {
  var r = e.f, t = (r & Ce) !== 0;
  if (K !== null && !gt) {
    var n = X !== null && (X.f & nt) !== 0;
    if (!n && (at === null || !Lr.call(at, e))) {
      var i = K.deps;
      if ((K.f & yn) !== 0)
        e.rv < sr && (e.rv = sr, He === null && i !== null && i[Ye] === e ? Ye++ : He === null ? He = [e] : He.push(e));
      else {
        (K.deps ?? (K.deps = [])).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [K] : Lr.call(o, K) || o.push(K);
      }
    }
  }
  if ($t && _r.has(e))
    return _r.get(e);
  if (t) {
    var c = (
      /** @type {Derived} */
      e
    );
    if ($t) {
      var d = c.v;
      return ((c.f & Te) === 0 && c.reactions !== null || Ni(c)) && (d = da(c)), _r.set(c, d), d;
    }
    var s = (c.f & rt) === 0 && !gt && K !== null && (xn || (K.f & rt) !== 0), _ = (c.f & mr) === 0;
    rn(c) && (s && (c.f |= rt), oi(c)), s && !_ && (si(c), Mi(c));
  }
  if (_t?.has(e))
    return _t.get(e);
  if ((e.f & Kt) !== 0)
    throw e.v;
  return e.v;
}
function Mi(e) {
  if (e.f |= rt, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & Ce) !== 0 && (r.f & rt) === 0 && (si(
        /** @type {Derived} */
        r
      ), Mi(
        /** @type {Derived} */
        r
      ));
}
function Ni(e) {
  if (e.v === Ne) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (_r.has(r) || (r.f & Ce) !== 0 && Ni(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function Ri(e) {
  var r = gt;
  try {
    return gt = !0, e();
  } finally {
    gt = r;
  }
}
const Ls = ["touchstart", "touchmove"];
function Ps(e) {
  return Ls.includes(e);
}
const lr = Symbol("events"), Li = /* @__PURE__ */ new Set(), ta = /* @__PURE__ */ new Set();
function Ds(e, r, t, n = {}) {
  function i(o) {
    if (n.capture || ra.call(r, o), !o.cancelBubble)
      return An(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Xt(() => {
    r.addEventListener(e, i, n);
  }) : r.addEventListener(e, i, n), i;
}
function ja(e, r, t, n, i) {
  var o = { capture: n, passive: i }, c = Ds(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && va(() => {
    r.removeEventListener(e, c, o);
  });
}
function De(e, r, t) {
  (r[lr] ?? (r[lr] = {}))[e] = t;
}
function Os(e) {
  for (var r = 0; r < e.length; r++)
    Li.add(e[r]);
  for (var t of ta)
    t(e);
}
let Ba = null;
function ra(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), n = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  Ba = e;
  var c = 0, d = Ba === e && e[lr];
  if (d) {
    var s = i.indexOf(d);
    if (s !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[lr] = r;
      return;
    }
    var _ = i.indexOf(r);
    if (_ === -1)
      return;
    s <= _ && (c = s);
  }
  if (o = /** @type {Element} */
  i[c] || e.target, o !== r) {
    xo(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var x = K, S = X;
    ot(null), St(null);
    try {
      for (var b, m = []; o !== null; ) {
        var k = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var V = o[lr]?.[n];
          V != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && V.call(o, e);
        } catch (w) {
          b ? m.push(w) : b = w;
        }
        if (e.cancelBubble || k === r || k === null)
          break;
        o = k;
      }
      if (b) {
        for (let w of m)
          queueMicrotask(() => {
            throw w;
          });
        throw b;
      }
    } finally {
      e[lr] = r, delete e.currentTarget, ot(x), St(S);
    }
  }
}
const Cs = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Is(e) {
  return (
    /** @type {string} */
    Cs?.createHTML(e) ?? e
  );
}
function Fs(e) {
  var r = _i("template");
  return r.innerHTML = Is(e.replaceAll("<!>", "<!---->")), r.content;
}
function Jr(e, r) {
  var t = (
    /** @type {Effect} */
    X
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function O(e, r) {
  var t = (r & qo) !== 0, n = (r & zo) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = Fs(o ? e : "<!>" + e), t || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ Jt(i)));
    var c = (
      /** @type {TemplateNode} */
      n || ui ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (t) {
      var d = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Jt(c)
      ), s = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      Jr(d, s);
    } else
      Jr(c, c);
    return c;
  };
}
function Dt() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = Zt();
  return e.append(r, t), Jr(r, t), e;
}
function N(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function j(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = t, e.nodeValue = `${t}`);
}
function js(e, r) {
  return Bs(e, r);
}
const cn = /* @__PURE__ */ new Map();
function Bs(e, { target: r, anchor: t, props: n = {}, events: i, context: o, intro: c = !0, transformError: d }) {
  bs();
  var s = void 0, _ = Es(() => {
    var x = t ?? r.appendChild(Zt());
    as(
      /** @type {TemplateNode} */
      x,
      {
        pending: () => {
        }
      },
      (m) => {
        Ja({});
        var k = (
          /** @type {ComponentContext} */
          it
        );
        o && (k.c = o), i && (n.$$events = i), s = e(m, n) || {}, Ka();
      },
      d
    );
    var S = /* @__PURE__ */ new Set(), b = (m) => {
      for (var k = 0; k < m.length; k++) {
        var V = m[k];
        if (!S.has(V)) {
          S.add(V);
          var w = Ps(V);
          for (const _e of [r, document]) {
            var F = cn.get(_e);
            F === void 0 && (F = /* @__PURE__ */ new Map(), cn.set(_e, F));
            var xe = F.get(V);
            xe === void 0 ? (_e.addEventListener(V, ra, { passive: w }), F.set(V, 1)) : F.set(V, xe + 1);
          }
        }
      }
    };
    return b(Sn(Li)), ta.add(b), () => {
      for (var m of S)
        for (const w of [r, document]) {
          var k = (
            /** @type {Map<string, number>} */
            cn.get(w)
          ), V = (
            /** @type {number} */
            k.get(m)
          );
          --V == 0 ? (w.removeEventListener(m, ra), k.delete(m), k.size === 0 && cn.delete(w)) : k.set(m, V);
        }
      ta.delete(b), x !== t && x.parentNode?.removeChild(x);
    };
  });
  return na.set(s, _), s;
}
let na = /* @__PURE__ */ new WeakMap();
function Vs(e, r) {
  const t = na.get(e);
  return t ? (na.delete(e), t(r)) : Promise.resolve();
}
var vt, mt, Je, vr, $r, en, En;
class Pi {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    ut(this, "anchor");
    /** @type {Map<Batch, Key>} */
    q(this, vt, /* @__PURE__ */ new Map());
    /**
     * Map of keys to effects that are currently rendered in the DOM.
     * These effects are visible and actively part of the document tree.
     * Example:
     * ```
     * {#if condition}
     * 	foo
     * {:else}
     * 	bar
     * {/if}
     * ```
     * Can result in the entries `true->Effect` and `false->Effect`
     * @type {Map<Key, Effect>}
     */
    q(this, mt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    q(this, Je, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    q(this, vr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    q(this, $r, !0);
    /**
     * @param {Batch} batch
     */
    q(this, en, (r) => {
      if (l(this, vt).has(r)) {
        var t = (
          /** @type {Key} */
          l(this, vt).get(r)
        ), n = l(this, mt).get(t);
        if (n)
          ga(n), l(this, vr).delete(t);
        else {
          var i = l(this, Je).get(t);
          i && (l(this, mt).set(t, i.effect), l(this, Je).delete(t), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), n = i.effect);
        }
        for (const [o, c] of l(this, vt)) {
          if (l(this, vt).delete(o), o === r)
            break;
          const d = l(this, Je).get(c);
          d && (qe(d.effect), l(this, Je).delete(c));
        }
        for (const [o, c] of l(this, mt)) {
          if (o === t || l(this, vr).has(o)) continue;
          const d = () => {
            if (Array.from(l(this, vt).values()).includes(o)) {
              var _ = document.createDocumentFragment();
              ha(c, _), _.append(Zt()), l(this, Je).set(o, { effect: c, fragment: _ });
            } else
              qe(c);
            l(this, vr).delete(o), l(this, mt).delete(o);
          };
          l(this, $r) || !n ? (l(this, vr).add(o), gr(c, d, !1)) : d();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    q(this, En, (r) => {
      l(this, vt).delete(r);
      const t = Array.from(l(this, vt).values());
      for (const [n, i] of l(this, Je))
        t.includes(n) || (qe(i.effect), l(this, Je).delete(n));
    });
    this.anchor = r, G(this, $r, t);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(r, t) {
    var n = (
      /** @type {Batch} */
      B
    ), i = vi();
    if (t && !l(this, mt).has(r) && !l(this, Je).has(r))
      if (i) {
        var o = document.createDocumentFragment(), c = Zt();
        o.append(c), l(this, Je).set(r, {
          effect: tt(() => t(c)),
          fragment: o
        });
      } else
        l(this, mt).set(
          r,
          tt(() => t(this.anchor))
        );
    if (l(this, vt).set(n, r), i) {
      for (const [d, s] of l(this, mt))
        d === r ? n.unskip_effect(s) : n.skip_effect(s);
      for (const [d, s] of l(this, Je))
        d === r ? n.unskip_effect(s.effect) : n.skip_effect(s.effect);
      n.oncommit(l(this, en)), n.ondiscard(l(this, En));
    } else
      l(this, en).call(this, n);
  }
}
vt = new WeakMap(), mt = new WeakMap(), Je = new WeakMap(), vr = new WeakMap(), $r = new WeakMap(), en = new WeakMap(), En = new WeakMap();
function te(e, r, t = !1) {
  var n = new Pi(e), i = t ? pr : 0;
  function o(c, d) {
    n.ensure(c, d);
  }
  Mn(() => {
    var c = !1;
    r((d, s = 0) => {
      c = !0, o(s, d);
    }), c || o(-1, null);
  }, i);
}
function bt(e, r) {
  return r;
}
function Hs(e, r, t) {
  for (var n = [], i = r.length, o, c = r.length, d = 0; d < i; d++) {
    let S = r[d];
    gr(
      S,
      () => {
        if (o) {
          if (o.pending.delete(S), o.done.add(S), o.pending.size === 0) {
            var b = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            aa(e, Sn(o.done)), b.delete(o), b.size === 0 && (e.outrogroups = null);
          }
        } else
          c -= 1;
      },
      !1
    );
  }
  if (c === 0) {
    var s = n.length === 0 && t !== null;
    if (s) {
      var _ = (
        /** @type {Element} */
        t
      ), x = (
        /** @type {Element} */
        _.parentNode
      );
      xs(x), x.append(_), e.items.clear();
    }
    aa(e, r, !s);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function aa(e, r, t = !0) {
  var n;
  if (e.pending.size > 0) {
    n = /* @__PURE__ */ new Set();
    for (const c of e.pending.values())
      for (const d of c)
        n.add(
          /** @type {EachItem} */
          e.items.get(d).e
        );
  }
  for (var i = 0; i < r.length; i++) {
    var o = r[i];
    if (n?.has(o)) {
      o.f |= kt;
      const c = document.createDocumentFragment();
      ha(o, c);
    } else
      qe(r[i], t);
  }
}
var Va;
function ct(e, r, t, n, i, o = null) {
  var c = e, d = /* @__PURE__ */ new Map(), s = (r & Ua) !== 0;
  if (s) {
    var _ = (
      /** @type {Element} */
      e
    );
    c = _.appendChild(Zt());
  }
  var x = null, S = /* @__PURE__ */ cs(() => {
    var _e = t();
    return oa(_e) ? _e : _e == null ? [] : Sn(_e);
  }), b, m = /* @__PURE__ */ new Map(), k = !0;
  function V(_e) {
    (xe.effect.f & nt) === 0 && (xe.pending.delete(_e), xe.fallback = x, qs(xe, b, c, r, n), x !== null && (b.length === 0 ? (x.f & kt) === 0 ? ga(x) : (x.f ^= kt, Vr(x, null, c)) : gr(x, () => {
      x = null;
    })));
  }
  function w(_e) {
    xe.pending.delete(_e);
  }
  var F = Mn(() => {
    b = /** @type {V[]} */
    a(S);
    for (var _e = b.length, Re = /* @__PURE__ */ new Set(), Be = (
      /** @type {Batch} */
      B
    ), Pe = vi(), ge = 0; ge < _e; ge += 1) {
      var Tt = b[ge], pt = n(Tt, ge), he = k ? null : d.get(pt);
      he ? (he.v && Or(he.v, Tt), he.i && Or(he.i, ge), Pe && Be.unskip_effect(he.e)) : (he = zs(
        d,
        k ? c : Va ?? (Va = Zt()),
        Tt,
        pt,
        ge,
        i,
        r,
        t
      ), k || (he.e.f |= kt), d.set(pt, he)), Re.add(pt);
    }
    if (_e === 0 && o && !x && (k ? x = tt(() => o(c)) : (x = tt(() => o(Va ?? (Va = Zt()))), x.f |= kt)), _e > Re.size && No(), !k)
      if (m.set(Be, Re), Pe) {
        for (const [er, nn] of d)
          Re.has(er) || Be.skip_effect(nn.e);
        Be.oncommit(V), Be.ondiscard(w);
      } else
        V(Be);
    a(S);
  }), xe = { effect: F, items: d, pending: m, outrogroups: null, fallback: x };
  k = !1;
}
function Br(e) {
  for (; e !== null && (e.f & ht) === 0; )
    e = e.next;
  return e;
}
function qs(e, r, t, n, i) {
  var o = (n & Vo) !== 0, c = r.length, d = e.items, s = Br(e.effect.first), _, x = null, S, b = [], m = [], k, V, w, F;
  if (o)
    for (F = 0; F < c; F += 1)
      k = r[F], V = i(k, F), w = /** @type {EachItem} */
      d.get(V).e, (w.f & kt) === 0 && (w.nodes?.a?.measure(), (S ?? (S = /* @__PURE__ */ new Set())).add(w));
  for (F = 0; F < c; F += 1) {
    if (k = r[F], V = i(k, F), w = /** @type {EachItem} */
    d.get(V).e, e.outrogroups !== null)
      for (const he of e.outrogroups)
        he.pending.delete(w), he.done.delete(w);
    if ((w.f & je) !== 0 && (ga(w), o && (w.nodes?.a?.unfix(), (S ?? (S = /* @__PURE__ */ new Set())).delete(w))), (w.f & kt) !== 0)
      if (w.f ^= kt, w === s)
        Vr(w, null, t);
      else {
        var xe = x ? x.next : s;
        w === e.effect.last && (e.effect.last = w.prev), w.prev && (w.prev.next = w.next), w.next && (w.next.prev = w.prev), zt(e, x, w), zt(e, w, xe), Vr(w, xe, t), x = w, b = [], m = [], s = Br(x.next);
        continue;
      }
    if (w !== s) {
      if (_ !== void 0 && _.has(w)) {
        if (b.length < m.length) {
          var _e = m[0], Re;
          x = _e.prev;
          var Be = b[0], Pe = b[b.length - 1];
          for (Re = 0; Re < b.length; Re += 1)
            Vr(b[Re], _e, t);
          for (Re = 0; Re < m.length; Re += 1)
            _.delete(m[Re]);
          zt(e, Be.prev, Pe.next), zt(e, x, Be), zt(e, Pe, _e), s = _e, x = Pe, F -= 1, b = [], m = [];
        } else
          _.delete(w), Vr(w, s, t), zt(e, w.prev, w.next), zt(e, w, x === null ? e.effect.first : x.next), zt(e, x, w), x = w;
        continue;
      }
      for (b = [], m = []; s !== null && s !== w; )
        (_ ?? (_ = /* @__PURE__ */ new Set())).add(s), m.push(s), s = Br(s.next);
      if (s === null)
        continue;
    }
    (w.f & kt) === 0 && b.push(w), x = w, s = Br(w.next);
  }
  if (e.outrogroups !== null) {
    for (const he of e.outrogroups)
      he.pending.size === 0 && (aa(e, Sn(he.done)), e.outrogroups?.delete(he));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (s !== null || _ !== void 0) {
    var ge = [];
    if (_ !== void 0)
      for (w of _)
        (w.f & je) === 0 && ge.push(w);
    for (; s !== null; )
      (s.f & je) === 0 && s !== e.fallback && ge.push(s), s = Br(s.next);
    var Tt = ge.length;
    if (Tt > 0) {
      var pt = (n & Ua) !== 0 && c === 0 ? t : null;
      if (o) {
        for (F = 0; F < Tt; F += 1)
          ge[F].nodes?.a?.measure();
        for (F = 0; F < Tt; F += 1)
          ge[F].nodes?.a?.fix();
      }
      Hs(e, ge, pt);
    }
  }
  o && Xt(() => {
    if (S !== void 0)
      for (w of S)
        w.nodes?.a?.apply();
  });
}
function zs(e, r, t, n, i, o, c, d) {
  var s = (c & jo) !== 0 ? (c & Ho) === 0 ? /* @__PURE__ */ gs(t, !1, !1) : yr(t) : null, _ = (c & Bo) !== 0 ? yr(i) : null;
  return {
    v: s,
    i: _,
    e: tt(() => (o(r, s ?? t, _ ?? i, d), () => {
      e.delete(n);
    }))
  };
}
function Vr(e, r, t) {
  if (e.nodes)
    for (var n = e.nodes.start, i = e.nodes.end, o = r && (r.f & kt) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; n !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(n)
      );
      if (o.before(n), n === i)
        return;
      n = c;
    }
}
function zt(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function Un(e, r, t = !1, n = !1, i = !1, o = !1) {
  var c = e, d = "";
  if (t)
    var s = (
      /** @type {Element} */
      e
    );
  D(() => {
    var _ = (
      /** @type {Effect} */
      X
    );
    if (d !== (d = r() ?? "")) {
      if (t) {
        _.nodes = null, s.innerHTML = /** @type {string} */
        d, d !== "" && Jr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ Jt(s),
          /** @type {TemplateNode} */
          s.lastChild
        );
        return;
      }
      if (_.nodes !== null && (xi(
        _.nodes.start,
        /** @type {TemplateNode} */
        _.nodes.end
      ), _.nodes = null), d !== "") {
        var x = n ? Uo : i ? Yo : void 0, S = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          _i(n ? "svg" : i ? "math" : "template", x)
        );
        S.innerHTML = /** @type {any} */
        d;
        var b = n || i ? S : (
          /** @type {HTMLTemplateElement} */
          S.content
        );
        if (Jr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ Jt(b),
          /** @type {TemplateNode} */
          b.lastChild
        ), n || i)
          for (; /* @__PURE__ */ Jt(b); )
            c.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ Jt(b)
            );
        else
          c.before(b);
      }
    }
  });
}
function Us(e, r, t) {
  var n = new Pi(e);
  Mn(() => {
    var i = r() ?? null;
    n.ensure(i, i && ((o) => t(o, i)));
  }, pr);
}
function Di(e) {
  var r, t, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var i = e.length;
    for (r = 0; r < i; r++) e[r] && (t = Di(e[r])) && (n && (n += " "), n += t);
  } else for (t in e) e[t] && (n && (n += " "), n += t);
  return n;
}
function Ys() {
  for (var e, r, t = 0, n = "", i = arguments.length; t < i; t++) (e = arguments[t]) && (r = Di(e)) && (n && (n += " "), n += r);
  return n;
}
function f(e) {
  return typeof e == "object" ? Ys(e) : e ?? "";
}
function Ws(e, r, t) {
  var n = e == null ? "" : "" + e;
  return n === "" ? null : n;
}
function u(e, r, t, n, i, o) {
  var c = e.__className;
  if (c !== t || c === void 0) {
    var d = Ws(t);
    d == null ? e.removeAttribute("class") : e.className = d, e.__className = t;
  }
  return o;
}
function Oi(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!oa(r))
      return Go();
    for (var n of e.options)
      n.selected = r.includes(Yr(n));
    return;
  }
  for (n of e.options) {
    var i = Yr(n);
    if (ps(i, r)) {
      n.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function Gs(e) {
  var r = new MutationObserver(() => {
    Oi(e, e.__value);
  });
  r.observe(e, {
    // Listen to option element changes
    childList: !0,
    subtree: !0,
    // because of <optgroup>
    // Listen to option element value attribute changes
    // (doesn't get notified of select value changes,
    // because that property is not reflected as an attribute)
    attributes: !0,
    attributeFilter: ["value"]
  }), va(() => {
    r.disconnect();
  });
}
function Js(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet(), i = !0;
  gi(e, "change", (o) => {
    var c = o ? "[selected]" : ":checked", d;
    if (e.multiple)
      d = [].map.call(e.querySelectorAll(c), Yr);
    else {
      var s = e.querySelector(c) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      d = s && Yr(s);
    }
    t(d), e.__value = d, B !== null && n.add(B);
  }), Ss(() => {
    var o = r();
    if (e === document.activeElement) {
      var c = (
        /** @type {Batch} */
        B
      );
      if (n.has(c))
        return;
    }
    if (Oi(e, o, i), i && o === void 0) {
      var d = e.querySelector(":checked");
      d !== null && (o = Yr(d), t(o));
    }
    e.__value = o, i = !1;
  }), Gs(e);
}
function Yr(e) {
  return "__value" in e ? e.__value : e.value;
}
const Ks = Symbol("is custom element"), Xs = Symbol("is html");
function Zs(e, r) {
  var t = Qs(e);
  t.checked !== (t.checked = // treat null and undefined the same for the initial value
  r ?? void 0) && (e.checked = r);
}
function Qs(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [Ks]: e.nodeName.includes("-"),
      [Xs]: e.namespaceURI === Ya
    })
  );
}
function Ut(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet();
  gi(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = Yn(e) ? Wn(o) : o, t(o), B !== null && n.add(B), await Rs(), o !== (o = r())) {
      var c = e.selectionStart, d = e.selectionEnd, s = e.value.length;
      if (e.value = o ?? "", d !== null) {
        var _ = e.value.length;
        c === d && d === s && _ > s ? (e.selectionStart = _, e.selectionEnd = _) : (e.selectionStart = c, e.selectionEnd = Math.min(d, _));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ri(r) == null && e.value && (t(Yn(e) ? Wn(e.value) : e.value), B !== null && n.add(B)), pi(() => {
    var i = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        B
      );
      if (n.has(o))
        return;
    }
    Yn(e) && i === Wn(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function Yn(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function Wn(e) {
  return e === "" ? null : +e;
}
const $s = "5";
var Ha;
typeof window < "u" && ((Ha = window.__svelte ?? (window.__svelte = {})).v ?? (Ha.v = /* @__PURE__ */ new Set())).add($s);
var el = /* @__PURE__ */ O("<div><span> </span> <div><div> </div> <div> </div></div></div>"), tl = /* @__PURE__ */ O("<p>Select at least one token to view balances</p>"), rl = /* @__PURE__ */ O("<div><h3>Vault Balances</h3> <div><!> <!></div> <p>On-chain ledger balances for the vault canister</p></div>"), nl = /* @__PURE__ */ O("<span>Copied!</span>"), al = /* @__PURE__ */ O("<div><span>Last Refresh:</span> <span> </span></div>"), il = /* @__PURE__ */ O('<label><input type="checkbox"/> <span> </span></label>'), ol = /* @__PURE__ */ O("<div><h3>Active Tokens</h3> <div></div></div>"), sl = /* @__PURE__ */ O("<div><div> </div> <div><span>Ledger:</span> <button> </button></div> <div><span>Indexer:</span> <button> </button></div></div>"), ll = /* @__PURE__ */ O("<div><h3>Ledger Canisters</h3> <div></div></div>"), fl = /* @__PURE__ */ O('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), ul = /* @__PURE__ */ O("<div> </div>"), dl = /* @__PURE__ */ O("<button> </button>"), cl = /* @__PURE__ */ O("<div><span> </span> <div><div> </div> <div> </div></div></div>"), vl = /* @__PURE__ */ O("<p>Select at least one token to view balances</p>"), _l = /* @__PURE__ */ O("<div><p><span>Principal:</span> <span> </span></p></div>"), gl = /* @__PURE__ */ O("<div><h2>Your Balance</h2> <p>Personal balance for the logged-in principal. The vault canister balance is shown at the top.</p> <div><!> <!></div> <!></div>"), hl = /* @__PURE__ */ O("<span>✓</span>"), pl = /* @__PURE__ */ O("<button> </button> <!>", 1), bl = /* @__PURE__ */ O("<span>N/A</span>"), xl = /* @__PURE__ */ O("<span>✓</span>"), yl = /* @__PURE__ */ O("<button> </button> <!>", 1), ml = /* @__PURE__ */ O("<span>N/A</span>"), kl = /* @__PURE__ */ O("<button> </button>"), wl = /* @__PURE__ */ O("<span>N/A</span>"), El = /* @__PURE__ */ O("<tr><td> </td><td><span> </span></td><td><!></td><td><!></td><td> </td><td><!></td><td><span> </span></td></tr>"), Sl = /* @__PURE__ */ O('<tr><td colspan="7">No transactions found</td></tr>'), Tl = /* @__PURE__ */ O("<span>…</span>"), Al = /* @__PURE__ */ O("<button> </button>"), Ml = /* @__PURE__ */ O("<div><span> </span> <div><button>Prev</button> <!> <button>Next</button></div></div>"), Nl = /* @__PURE__ */ O("<div><h2>Transaction History</h2> <div><table><thead><tr><th>ID</th><th>Token</th><th>From</th><th>To</th><th>Amount</th><th>When</th><th>Type</th></tr></thead><tbody></tbody></table></div> <!></div>"), Rl = /* @__PURE__ */ O("<option> </option>"), Ll = /* @__PURE__ */ O('<div><h2>Transfer Tokens (Admin Only)</h2> <form><div><label for="v-token">Token</label> <select id="v-token"></select></div> <div><label for="v-to">Recipient Principal</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/></div> <div><label for="v-amount"> </label> <input id="v-amount" type="number" placeholder="100000000"/></div> <div><label for="v-to-sub">To Subaccount (optional, 64-char hex)</label> <input id="v-to-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <div><label for="v-from-sub">From Subaccount (optional, 64-char hex)</label> <input id="v-from-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <button type="submit"> </button></form></div>'), Pl = /* @__PURE__ */ O("<button> </button>"), Dl = /* @__PURE__ */ O('<input type="text" placeholder="Enter principal ID"/>'), Ol = /* @__PURE__ */ O('<input type="text" placeholder="Enter invoice ID"/>'), Cl = /* @__PURE__ */ O('<input type="text" placeholder="Enter 64-char hex subaccount"/>'), Il = /* @__PURE__ */ O("<div><span> </span> <div><div> </div> <div> </div></div></div>"), Fl = /* @__PURE__ */ O("<p>No balances found for this subaccount.</p>"), jl = /* @__PURE__ */ O("<div><div><div><span>Account:</span> <span> </span></div> <button> </button></div> <div></div> <!></div>"), Bl = /* @__PURE__ */ O(`<div><h2>Subaccount Lookup</h2> <p>Look up token balances for a user (by principal) or an invoice (by ID).
					The subaccount is derived using the <code>usr_</code> / <code>inv_</code> prefix convention.</p> <div></div> <form><!> <button type="submit"><!> </button></form> <!></div>`), Vl = /* @__PURE__ */ O("<div> </div>"), Hl = /* @__PURE__ */ O("<div><div> </div> <div> </div> <!></div>"), ql = /* @__PURE__ */ O("<div></div>"), zl = /* @__PURE__ */ O("<p>No balances found in system</p>"), Ul = /* @__PURE__ */ O("<p> </p>"), Yl = /* @__PURE__ */ O("<p>No transfer data available</p>"), Wl = /* @__PURE__ */ O('<div><h2>Vault Admin</h2> <div><button><!> </button></div> <div><h3>Auto-refresh settings</h3> <p>The Vault will only run an expensive full refresh on load if the last refresh is older than this threshold.</p> <div><label for="v-refresh-age">Max refresh age:</label> <input id="v-refresh-age" type="number" min="1"/> <span>minutes</span> <button>Save</button></div></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>'), Gl = /* @__PURE__ */ O("<div><div><h1>Vault</h1> <button><!> </button></div> <!> <div><div><span>Vault Principal:</span> <button> </button> <!></div> <!></div> <!> <!> <!> <nav></nav> <div><!></div></div>");
function Jl(e, r) {
  Ja(r, !0);
  const t = r.ctx.theme?.cn ?? ((...v) => v.filter(Boolean).join(" ")), n = 3600 * 1e3, i = "vault_settings", o = "vault_last_refresh";
  let c = /* @__PURE__ */ I("balance"), d = /* @__PURE__ */ I(!1), s = /* @__PURE__ */ I(""), _ = /* @__PURE__ */ I(""), x = /* @__PURE__ */ I(""), S = /* @__PURE__ */ I(""), b = /* @__PURE__ */ I(Ke({})), m = /* @__PURE__ */ I(Ke({})), k = /* @__PURE__ */ I(Ke({})), V = /* @__PURE__ */ I(!1), w = /* @__PURE__ */ I(0), F = /* @__PURE__ */ I(null), xe = /* @__PURE__ */ I(Ke([])), _e = /* @__PURE__ */ I(null), Re = /* @__PURE__ */ I(Ke({})), Be = /* @__PURE__ */ I(Ke([])), Pe = /* @__PURE__ */ I(null), ge = /* @__PURE__ */ I(0);
  const Tt = 10;
  let pt = /* @__PURE__ */ I(!1), he = /* @__PURE__ */ I(null), er = /* @__PURE__ */ I(""), nn = /* @__PURE__ */ I(Ke(Ln())), Nn = /* @__PURE__ */ I(Ke(Math.round(Ln().maxRefreshAgeMs / 6e4))), Ht = /* @__PURE__ */ I(""), kr = /* @__PURE__ */ I(""), wr = /* @__PURE__ */ I(0), Fr = /* @__PURE__ */ I(""), jr = /* @__PURE__ */ I(""), tr = /* @__PURE__ */ I("user"), an = /* @__PURE__ */ I(""), on = /* @__PURE__ */ I(""), sn = /* @__PURE__ */ I(""), At = /* @__PURE__ */ I(null), Er = /* @__PURE__ */ I(!1), rr = /* @__PURE__ */ qt(() => Object.keys(a(b))), Rn = /* @__PURE__ */ qt(() => Object.values(a(m)).some(Boolean));
  function pa(v) {
    return typeof v == "string" ? JSON.parse(v) : v;
  }
  function ln(v) {
    return v && typeof v == "object" && v.success === !0 && v.data != null ? v.data : v;
  }
  function Ci(v) {
    return a(b)[v]?.name ?? v;
  }
  function Ln() {
    try {
      const v = localStorage.getItem(i);
      if (v) {
        const g = JSON.parse(v);
        if (typeof g.maxRefreshAgeMs == "number" && g.maxRefreshAgeMs > 0)
          return { maxRefreshAgeMs: g.maxRefreshAgeMs };
      }
    } catch {
    }
    return { maxRefreshAgeMs: n };
  }
  function Ii(v) {
    try {
      localStorage.setItem(i, JSON.stringify(v));
    } catch {
    }
  }
  function Fi() {
    const v = Math.max(1, Math.round(a(Nn) || 1));
    p(nn, { maxRefreshAgeMs: v * 6e4 }, !0), Ii(a(nn));
  }
  function ba() {
    try {
      const v = localStorage.getItem(o);
      if (v) {
        const g = JSON.parse(v);
        if (g && typeof g.timestamp == "number" && g.balances)
          return { timestamp: g.timestamp, balances: g.balances };
      }
    } catch {
    }
    return null;
  }
  function ji(v, g) {
    try {
      localStorage.setItem(o, JSON.stringify({ timestamp: v, balances: g }));
    } catch {
    }
  }
  async function nr(v) {
    try {
      await navigator.clipboard.writeText(v), p(er, v, !0), setTimeout(() => p(er, ""), 2e3);
    } catch {
    }
  }
  function xa(v) {
    const g = Math.floor((Date.now() - v.getTime()) / 1e3);
    if (g < 60) return `${g}s ago`;
    const E = Math.floor(g / 60);
    if (E < 60) return `${E}m ago`;
    const A = Math.floor(E / 60);
    return A < 24 ? `${A}h ago` : `${Math.floor(A / 24)}d ago`;
  }
  function Bi(v) {
    const g = String(v);
    if (g.includes("T") || g.includes("-") || g.includes(":")) return new Date(g);
    try {
      return new Date(Number(BigInt(g) / BigInt(1e6)));
    } catch {
      return /* @__PURE__ */ new Date();
    }
  }
  function Pn(v, g) {
    return (v / Math.pow(10, g)).toFixed(g);
  }
  function ya(v, g = 20) {
    return v.length > g ? `${v.substring(0, g)}…` : v;
  }
  async function Vi() {
    try {
      const g = ln(await r.ctx.callSync("get_active_tokens", {}))?.ActiveTokens || [], E = {}, A = {}, M = {};
      for (const C of g) {
        const z = C.symbol || C.name, Z = C.ledger_canister_id ?? C.ledger ?? "", Y = C.indexer_canister_id ?? C.indexer ?? "";
        z && (E[z] = {
          ledger: Z,
          indexer: Y,
          decimals: C.decimals || 8,
          symbol: z,
          name: C.name
        }, A[z] = !0, M[z] = 0);
      }
      p(b, E, !0), p(m, A, !0), p(k, M, !0);
      const P = ba();
      if (P && P.balances) {
        for (const C of Object.keys(E))
          C in P.balances && (M[C] = P.balances[C]);
        p(k, M, !0), p(he, new Date(P.timestamp), !0);
      }
      const U = Object.keys(E);
      U.length > 0 && !a(Ht) && p(Ht, U[0], !0), p(V, !0);
    } catch (v) {
      console.error("Failed to load tokens:", v);
    }
  }
  async function Dn() {
    p(d, !0), p(s, ""), p(_, "");
    try {
      a(x) || p(x, r.ctx.principal || "", !0);
      const v = await r.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), g = pa(v);
      if (g?.success && g?.data?.objectsListPaginated) {
        const E = g.data.objectsListPaginated;
        p(_e, E.pagination, !0), p(xe, E.objects.map((M) => JSON.parse(M)), !0), p(F, a(xe).find((M) => M.principal === a(x) || M.id === a(x) || M._id === a(x)), !0), p(w, a(F) && a(F).amount || 0, !0);
        const A = {};
        for (const M of a(xe))
          (M.principal === a(x) || M.id === a(x) || M._id === a(x)) && M.token && (A[M.token] = M.amount || 0);
        p(Re, A, !0);
      } else
        p(w, 0), p(F, null), p(Re, {}, !0);
    } catch (v) {
      const g = r.ctx.ui?.accessDeniedOperation?.(v);
      g != null ? (p(_, g, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(d, !1);
    }
  }
  async function fn(v = a(ge)) {
    p(d, !0), p(s, ""), p(_, "");
    try {
      if (!a(S))
        try {
          if (typeof r.ctx.backend.get_canister_id == "function") {
            const A = await r.ctx.backend.get_canister_id();
            p(S, A || "", !0);
          }
        } catch {
          p(S, "");
        }
      const g = await r.ctx.backend.get_objects_paginated("WalletTransfer", v, Tt, "desc"), E = pa(g);
      if (E?.success && E?.data?.objectsListPaginated) {
        const A = E.data.objectsListPaginated;
        p(Pe, A.pagination, !0), p(Be, A.objects.map((M) => JSON.parse(M)), !0);
      } else
        p(Be, [], !0);
    } catch (g) {
      const E = r.ctx.ui?.accessDeniedOperation?.(g);
      E != null ? (p(_, E, !0), p(s, "")) : (p(_, ""), p(s, g?.message ?? String(g), !0));
    } finally {
      p(d, !1);
    }
  }
  function Hi(v) {
    return a(rr).find((g) => a(b)[g]?.name === v);
  }
  function qi(v) {
    for (const [g, E] of Object.entries(v)) {
      const A = Hi(g) || g;
      a(b)[A] && (a(k)[A] = E?.balance || 0);
    }
    p(k, { ...a(k) }, !0);
  }
  async function zi() {
    try {
      typeof r.ctx.backend.get_canister_id == "function" && p(S, await r.ctx.backend.get_canister_id() || a(S), !0);
    } catch {
    }
  }
  async function On() {
    p(d, !0), p(s, ""), p(_, "");
    try {
      const v = ln(await r.ctx.callAsync("refresh", {}));
      if (v?.TransactionSummary == null) {
        p(s, "Failed to sync vault transactions");
        return;
      }
      qi(v.TransactionSummary.per_token || {}), await zi(), p(he, /* @__PURE__ */ new Date(), !0), ji(a(he).getTime(), a(k)), await Promise.all([Dn(), fn(0)]);
    } catch (v) {
      const g = r.ctx.ui?.accessDeniedOperation?.(v);
      g != null ? (p(_, g, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(d, !1);
    }
  }
  async function Ui() {
    if (!a(kr) || a(wr) <= 0) {
      p(s, "Please enter valid recipient and amount");
      return;
    }
    p(d, !0), p(s, ""), p(_, "");
    try {
      const v = {
        to_principal: a(kr),
        amount: a(wr)
      };
      a(Fr).trim() && (v.to_subaccount = a(Fr).trim()), a(jr).trim() && (v.from_subaccount = a(jr).trim()), a(Ht) && (v.token = Ci(a(Ht))), ln(await r.ctx.callAsync("transfer", v)), p(kr, ""), p(wr, 0), p(Fr, ""), p(jr, ""), await Dn(), await fn();
    } catch (v) {
      const g = r.ctx.ui?.accessDeniedOperation?.(v);
      g != null ? (p(_, g, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(d, !1);
    }
  }
  async function Yi() {
    p(Er, !0), p(At, null), p(s, ""), p(_, "");
    try {
      const v = {};
      if (a(tr) === "user" && a(an).trim())
        v.principal = a(an).trim();
      else if (a(tr) === "invoice" && a(on).trim())
        v.invoice_id = a(on).trim();
      else if (a(tr) === "raw" && a(sn).trim())
        v.subaccount_hex = a(sn).trim();
      else {
        p(s, "Please enter a value to look up"), p(Er, !1);
        return;
      }
      const g = ln(await r.ctx.callAsync("lookup_balance", v));
      g?.LookupBalance ? p(At, g.LookupBalance, !0) : p(s, "Lookup failed");
    } catch (v) {
      const g = r.ctx.ui?.accessDeniedOperation?.(v);
      g != null ? (p(_, g, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(Er, !1);
    }
  }
  async function Cn(v) {
    p(ge, v, !0), await fn(v);
  }
  function Wi(v, g) {
    if (v <= 7) return Array.from({ length: v }, (A, M) => M);
    const E = [0];
    g > 3 && E.push("...");
    for (let A = Math.max(1, g - 1); A <= Math.min(v - 2, g + 1); A++) E.push(A);
    return g < v - 4 && E.push("..."), E.push(v - 1), E;
  }
  const Gi = [
    { id: "balance", label: "Balances" },
    { id: "transactions", label: "Transactions" },
    { id: "transfer", label: "Transfer" },
    { id: "lookup", label: "Lookup" },
    { id: "admin", label: "Admin" }
  ], In = '<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>';
  ws(() => {
    (async () => {
      await Vi();
      const v = Ln(), g = ba(), E = Date.now();
      !g || E - g.timestamp > v.maxRefreshAgeMs ? await On() : await Promise.all([Dn(), fn(0)]);
    })();
  });
  var Fn = Gl(), jn = h(Fn), ma = h(jn), un = y(ma, 2), ka = h(un);
  {
    var Ji = (v) => {
      var g = Dt(), E = dt(g);
      Un(E, () => In), N(v, g);
    };
    te(ka, (v) => {
      (a(d) || a(pt)) && v(Ji);
    });
  }
  var Ki = y(ka), wa = y(jn, 2);
  {
    var Xi = (v) => {
      var g = rl(), E = h(g), A = y(E, 2), M = h(A);
      ct(M, 17, () => a(rr), bt, (z, Z) => {
        var Y = Dt(), J = dt(Y);
        {
          var ae = (oe) => {
            var ye = el(), pe = h(ye), Ae = h(pe), ke = y(pe, 2), R = h(ke), T = h(R), L = y(R, 2), ne = h(L);
            D(
              (W, $, ie, se, ue, de, H) => {
                u(ye, 1, W), u(pe, 1, $), j(Ae, a(b)[a(Z)].symbol), u(ke, 1, ie), u(R, 1, se), j(T, ue), u(L, 1, de), j(ne, `${H ?? ""} units`);
              },
              [
                () => f(t("flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-lg p-3")),
                () => f(t("text-base font-semibold text-indigo-900 dark:text-indigo-200")),
                () => f(t("text-right")),
                () => f(t("text-xl font-bold text-indigo-900 dark:text-indigo-100")),
                () => Pn(a(k)[a(Z)] || 0, a(b)[a(Z)].decimals),
                () => f(t("text-xs text-indigo-600 dark:text-indigo-400")),
                () => (a(k)[a(Z)] || 0).toLocaleString()
              ]
            ), N(oe, ye);
          };
          te(J, (oe) => {
            a(m)[a(Z)] && oe(ae);
          });
        }
        N(z, Y);
      });
      var P = y(M, 2);
      {
        var U = (z) => {
          var Z = tl();
          D((Y) => u(Z, 1, Y), [() => f(t("text-sm text-gray-500 italic"))]), N(z, Z);
        };
        te(P, (z) => {
          a(Rn) || z(U);
        });
      }
      var C = y(A, 2);
      D(
        (z, Z, Y, J) => {
          u(g, 1, z), u(E, 1, Z), u(A, 1, Y), u(C, 1, J);
        },
        [
          () => f(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => f(t("text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3")),
          () => f(t("space-y-2")),
          () => f(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), N(v, g);
    };
    te(wa, (v) => {
      a(V) && v(Xi);
    });
  }
  var Bn = y(wa, 2), Vn = h(Bn), Ea = h(Vn), dn = y(Ea, 2), Zi = h(dn), Qi = y(dn, 2);
  {
    var $i = (v) => {
      var g = nl();
      D((E) => u(g, 1, E), [
        () => f(t("text-xs text-green-600 dark:text-green-400"))
      ]), N(v, g);
    };
    te(Qi, (v) => {
      a(er) === a(S) && a(S) && v($i);
    });
  }
  var eo = y(Vn, 2);
  {
    var to = (v) => {
      var g = al(), E = h(g), A = y(E, 2), M = h(A);
      D(
        (P, U, C, z) => {
          u(E, 1, P), u(A, 1, U), j(M, `${C ?? ""} (${z ?? ""})`);
        },
        [
          () => f(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
          () => f(t("ml-2 text-sm text-gray-700 dark:text-gray-300")),
          () => a(he).toLocaleString(),
          () => xa(a(he))
        ]
      ), N(v, g);
    };
    te(eo, (v) => {
      a(he) && v(to);
    });
  }
  var Sa = y(Bn, 2);
  {
    var ro = (v) => {
      var g = ol(), E = h(g), A = y(E, 2);
      ct(A, 21, () => a(rr), bt, (M, P) => {
        var U = il(), C = h(U), z = y(C, 2), Z = h(z);
        D(
          (Y, J, ae) => {
            u(U, 1, Y), Zs(C, a(m)[a(P)]), u(C, 1, J), u(z, 1, ae), j(Z, a(b)[a(P)].symbol);
          },
          [
            () => f(t("flex items-center gap-2 cursor-pointer")),
            () => f(t("w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500")),
            () => f(t("text-sm font-medium text-gray-700 dark:text-gray-300"))
          ]
        ), De("change", C, () => {
          a(m)[a(P)] = !a(m)[a(P)], p(m, { ...a(m) }, !0);
        }), N(M, U);
      }), D(
        (M, P, U) => {
          u(g, 1, M), u(E, 1, P), u(A, 1, U);
        },
        [
          () => f(t("bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4")),
          () => f(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => f(t("flex flex-wrap gap-4"))
        ]
      ), N(v, g);
    };
    te(Sa, (v) => {
      a(V) && a(rr).length > 0 && v(ro);
    });
  }
  var Ta = y(Sa, 2);
  {
    var no = (v) => {
      var g = ll(), E = h(g), A = y(E, 2);
      ct(A, 21, () => a(rr), bt, (M, P) => {
        var U = Dt(), C = dt(U);
        {
          var z = (Z) => {
            var Y = sl(), J = h(Y), ae = h(J), oe = y(J, 2), ye = h(oe), pe = y(ye, 2), Ae = h(pe), ke = y(oe, 2), R = h(ke), T = y(R, 2), L = h(T);
            D(
              (ne, W, $, ie, se, ue, de, H) => {
                u(Y, 1, ne), u(J, 1, W), j(ae, a(b)[a(P)].symbol), u(oe, 1, $), u(ye, 1, ie), u(pe, 1, se), j(Ae, a(b)[a(P)].ledger), u(ke, 1, ue), u(R, 1, de), u(T, 1, H), j(L, a(b)[a(P)].indexer);
              },
              [
                () => f(t("border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0")),
                () => f(t("text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1")),
                () => f(t("flex items-center justify-between text-xs")),
                () => f(t("text-gray-600 dark:text-gray-400")),
                () => f(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
                () => f(t("flex items-center justify-between text-xs mt-1")),
                () => f(t("text-gray-600 dark:text-gray-400")),
                () => f(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
              ]
            ), De("click", pe, () => nr(a(b)[a(P)].ledger)), De("click", T, () => nr(a(b)[a(P)].indexer)), N(Z, Y);
          };
          te(C, (Z) => {
            a(m)[a(P)] && Z(z);
          });
        }
        N(M, U);
      }), D(
        (M, P, U) => {
          u(g, 1, M), u(E, 1, P), u(A, 1, U);
        },
        [
          () => f(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4")),
          () => f(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => f(t("space-y-2"))
        ]
      ), N(v, g);
    };
    te(Ta, (v) => {
      a(V) && a(Rn) && v(no);
    });
  }
  var Aa = y(Ta, 2);
  {
    var ao = (v) => {
      var g = Dt(), E = dt(g);
      {
        var A = (P) => {
          var U = Dt(), C = dt(U);
          Us(C, () => r.ctx.ui.AccessDenied, (z, Z) => {
            Z(z, {
              get operation() {
                return a(_);
              }
            });
          }), N(P, U);
        }, M = (P) => {
          var U = fl();
          N(P, U);
        };
        te(E, (P) => {
          r.ctx.ui?.AccessDenied ? P(A) : P(M, -1);
        });
      }
      N(v, g);
    }, io = (v) => {
      var g = ul(), E = h(g);
      D(
        (A) => {
          u(g, 1, A), j(E, a(s));
        },
        [
          () => f(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300"))
        ]
      ), N(v, g);
    };
    te(Aa, (v) => {
      a(_) ? v(ao) : a(s) && v(io, 1);
    });
  }
  var Hn = y(Aa, 2);
  ct(Hn, 21, () => Gi, bt, (v, g) => {
    var E = dl(), A = h(E);
    D(
      (M) => {
        u(E, 1, M), j(A, a(g).label);
      },
      [
        () => f(t("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", a(c) === a(g).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), De("click", E, () => {
      p(c, a(g).id, !0);
    }), N(v, E);
  });
  var oo = y(Hn, 2), so = h(oo);
  {
    var lo = (v) => {
      var g = gl(), E = h(g), A = y(E, 2), M = y(A, 2), P = h(M);
      ct(P, 17, () => a(rr), bt, (Y, J) => {
        var ae = Dt(), oe = dt(ae);
        {
          var ye = (pe) => {
            const Ae = /* @__PURE__ */ qt(() => a(Re)[a(J)] ?? 0);
            var ke = cl(), R = h(ke), T = h(R), L = y(R, 2), ne = h(L), W = h(ne), $ = y(ne, 2), ie = h($);
            D(
              (se, ue, de, H, Q, re, ee) => {
                u(ke, 1, se), u(R, 1, ue), j(T, a(b)[a(J)].symbol), u(L, 1, de), u(ne, 1, H), j(W, Q), u($, 1, re), j(ie, `${ee ?? ""} units`);
              },
              [
                () => f(t("flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => f(t("text-base font-semibold text-gray-700 dark:text-gray-300")),
                () => f(t("text-right")),
                () => f(t("text-xl font-bold text-indigo-600 dark:text-indigo-400")),
                () => Pn(a(Ae), a(b)[a(J)].decimals),
                () => f(t("text-xs text-gray-500 dark:text-gray-400")),
                () => a(Ae).toLocaleString()
              ]
            ), N(pe, ke);
          };
          te(oe, (pe) => {
            a(m)[a(J)] && pe(ye);
          });
        }
        N(Y, ae);
      });
      var U = y(P, 2);
      {
        var C = (Y) => {
          var J = vl();
          D((ae) => u(J, 1, ae), [() => f(t("text-sm text-gray-500 italic"))]), N(Y, J);
        };
        te(U, (Y) => {
          a(Rn) || Y(C);
        });
      }
      var z = y(M, 2);
      {
        var Z = (Y) => {
          var J = _l(), ae = h(J), oe = h(ae), ye = y(oe, 2), pe = h(ye);
          D(
            (Ae, ke, R, T) => {
              u(J, 1, Ae), u(ae, 1, ke), u(oe, 1, R), u(ye, 1, T), j(pe, a(F)._id || a(F).id);
            },
            [
              () => f(t("mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
              () => f(t("text-sm text-gray-600 dark:text-gray-400")),
              () => f(t("font-medium")),
              () => f(t("font-mono text-xs ml-1"))
            ]
          ), N(Y, J);
        };
        te(z, (Y) => {
          a(F) && Y(Z);
        });
      }
      D(
        (Y, J, ae, oe) => {
          u(g, 1, Y), u(E, 1, J), u(A, 1, ae), u(M, 1, oe);
        },
        [
          () => f(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => f(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => f(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => f(t("space-y-3"))
        ]
      ), N(v, g);
    }, fo = (v) => {
      var g = Nl(), E = h(g), A = y(E, 2), M = h(A), P = h(M), U = h(P), C = h(U), z = y(C), Z = y(z), Y = y(Z), J = y(Y), ae = y(J), oe = y(ae), ye = y(P);
      ct(
        ye,
        21,
        () => a(Be),
        (R) => R._id || R.tx_id || Math.random(),
        (R, T) => {
          var L = El(), ne = h(L), W = h(ne), $ = y(ne), ie = h($), se = h(ie), ue = y($), de = h(ue);
          {
            var H = (le) => {
              var we = pl(), ve = dt(we), Rt = h(ve), Lt = y(ve, 2);
              {
                var Pt = (Ie) => {
                  var Ue = hl();
                  D((ar) => u(Ue, 1, ar), [() => f(t("ml-1 text-xs text-green-600"))]), N(Ie, Ue);
                };
                te(Lt, (Ie) => {
                  a(er) === a(T).principal_from && Ie(Pt);
                });
              }
              D(
                (Ie, Ue) => {
                  u(ve, 1, Ie), j(Rt, Ue);
                },
                [
                  () => f(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => ya(a(T).principal_from)
                ]
              ), De("click", ve, () => nr(a(T).principal_from)), N(le, we);
            }, Q = (le) => {
              var we = bl();
              D((ve) => u(we, 1, ve), [() => f(t("text-gray-400"))]), N(le, we);
            };
            te(de, (le) => {
              a(T).principal_from ? le(H) : le(Q, -1);
            });
          }
          var re = y(ue), ee = h(re);
          {
            var be = (le) => {
              var we = yl(), ve = dt(we), Rt = h(ve), Lt = y(ve, 2);
              {
                var Pt = (Ie) => {
                  var Ue = xl();
                  D((ar) => u(Ue, 1, ar), [() => f(t("ml-1 text-xs text-green-600"))]), N(Ie, Ue);
                };
                te(Lt, (Ie) => {
                  a(er) === a(T).principal_to && Ie(Pt);
                });
              }
              D(
                (Ie, Ue) => {
                  u(ve, 1, Ie), j(Rt, Ue);
                },
                [
                  () => f(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => ya(a(T).principal_to)
                ]
              ), De("click", ve, () => nr(a(T).principal_to)), N(le, we);
            }, ce = (le) => {
              var we = ml();
              D((ve) => u(we, 1, ve), [() => f(t("text-gray-400"))]), N(le, we);
            };
            te(ee, (le) => {
              a(T).principal_to ? le(be) : le(ce, -1);
            });
          }
          var Me = y(re), Le = h(Me), st = y(Me), lt = h(st);
          {
            var Mt = (le) => {
              const we = /* @__PURE__ */ qt(() => Bi(a(T).timestamp));
              var ve = kl(), Rt = h(ve);
              D(
                (Lt, Pt) => {
                  u(ve, 1, Lt), j(Rt, Pt);
                },
                [
                  () => f(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                  () => xa(a(we))
                ]
              ), De("click", ve, () => nr(a(we).toLocaleString())), N(le, ve);
            }, ft = (le) => {
              var we = wl();
              D((ve) => u(we, 1, ve), [() => f(t("text-gray-400"))]), N(le, we);
            };
            te(lt, (le) => {
              a(T).timestamp ? le(Mt) : le(ft, -1);
            });
          }
          var ze = y(st), Xe = h(ze), Nt = h(Xe);
          D(
            (le, we, ve, Rt, Lt, Pt, Ie, Ue, ar, _o, go) => {
              u(L, 1, le), u(ne, 1, we), j(W, a(T).tx_id || a(T)._id), u($, 1, ve), u(ie, 1, Rt), j(se, a(T).token || "—"), u(ue, 1, Lt), u(re, 1, Pt), u(Me, 1, Ie), j(Le, Ue), u(st, 1, ar), u(ze, 1, _o), u(Xe, 1, go), j(Nt, a(T).kind || "transfer");
            },
            [
              () => f(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
              () => f(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => f(t("px-4 py-3")),
              () => f(t("px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded text-xs font-medium")),
              () => f(t("px-4 py-3 font-mono text-xs")),
              () => f(t("px-4 py-3 font-mono text-xs")),
              () => f(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => (a(T).amount || 0).toLocaleString(),
              () => f(t("px-4 py-3")),
              () => f(t("px-4 py-3")),
              () => f(t("px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs"))
            ]
          ), N(R, L);
        },
        (R) => {
          var T = Sl(), L = h(T);
          D((ne) => u(L, 1, ne), [
            () => f(t("px-4 py-8 text-center text-gray-500 dark:text-gray-400"))
          ]), N(R, T);
        }
      );
      var pe = y(A, 2);
      {
        var Ae = (R) => {
          var T = Ml(), L = h(T), ne = h(L), W = y(L, 2), $ = h(W), ie = y($, 2);
          ct(ie, 17, () => Wi(Number(a(Pe).total_pages), a(ge)), bt, (ue, de) => {
            var H = Dt(), Q = dt(H);
            {
              var re = (be) => {
                var ce = Tl();
                D((Me) => u(ce, 1, Me), [() => f(t("px-1.5 text-xs text-gray-400"))]), N(be, ce);
              }, ee = (be) => {
                var ce = Al(), Me = h(ce);
                D(
                  (Le) => {
                    u(ce, 1, Le), j(Me, a(de) + 1);
                  },
                  [
                    () => f(t("px-2.5 py-1 text-xs border rounded", a(ge) === a(de) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                  ]
                ), De("click", ce, () => Cn(a(de))), N(be, ce);
              };
              te(Q, (be) => {
                a(de) === "..." ? be(re) : be(ee, -1);
              });
            }
            N(ue, H);
          });
          var se = y(ie, 2);
          D(
            (ue, de, H, Q, re, ee) => {
              u(T, 1, ue), u(L, 1, de), j(ne, `${a(Be).length ?? ""} of ${a(Pe).total_items_count ?? ""} (Page ${a(ge) + 1} / ${a(Pe).total_pages ?? ""})`), u(W, 1, H), $.disabled = a(ge) === 0, u($, 1, Q), se.disabled = re, u(se, 1, ee);
            },
            [
              () => f(t("p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between")),
              () => f(t("text-xs text-gray-500 dark:text-gray-400")),
              () => f(t("flex items-center gap-1")),
              () => f(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
              () => a(ge) >= Number(a(Pe).total_pages) - 1,
              () => f(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
            ]
          ), De("click", $, () => Cn(a(ge) - 1)), De("click", se, () => Cn(a(ge) + 1)), N(R, T);
        }, ke = /* @__PURE__ */ qt(() => a(Pe) && Number(a(Pe).total_pages) > 1);
        te(pe, (R) => {
          a(ke) && R(Ae);
        });
      }
      D(
        (R, T, L, ne, W, $, ie, se, ue, de, H, Q, re) => {
          u(g, 1, R), u(E, 1, T), u(A, 1, L), u(M, 1, ne), u(P, 1, W), u(C, 1, $), u(z, 1, ie), u(Z, 1, se), u(Y, 1, ue), u(J, 1, de), u(ae, 1, H), u(oe, 1, Q), u(ye, 1, re);
        },
        [
          () => f(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden")),
          () => f(t("text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100")),
          () => f(t("overflow-x-auto")),
          () => f(t("w-full text-sm")),
          () => f(t("bg-gray-50 dark:bg-gray-700/50")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => f(t("divide-y divide-gray-100 dark:divide-gray-700"))
        ]
      ), N(v, g);
    }, uo = (v) => {
      var g = Ll(), E = h(g), A = y(E, 2), M = h(A), P = h(M), U = y(P, 2);
      ct(U, 21, () => a(rr), bt, (W, $) => {
        var ie = Rl(), se = h(ie), ue = {};
        D(() => {
          j(se, a(b)[a($)].symbol), ue !== (ue = a($)) && (ie.value = (ie.__value = a($)) ?? "");
        }), N(W, ie);
      });
      var C = y(M, 2), z = h(C), Z = y(z, 2), Y = y(C, 2), J = h(Y), ae = h(J), oe = y(J, 2), ye = y(Y, 2), pe = h(ye), Ae = y(pe, 2), ke = y(ye, 2), R = h(ke), T = y(R, 2), L = y(ke, 2), ne = h(L);
      D(
        (W, $, ie, se, ue, de, H, Q, re, ee, be, ce, Me, Le) => {
          u(g, 1, W), u(E, 1, $), u(A, 1, ie), u(P, 1, se), u(U, 1, ue), u(z, 1, de), u(Z, 1, H), u(J, 1, Q), j(ae, `Amount (${(a(b)[a(Ht)]?.symbol || a(Ht) || "") ?? ""} units)`), u(oe, 1, re), u(pe, 1, ee), u(Ae, 1, be), u(R, 1, ce), u(T, 1, Me), L.disabled = a(d) || !a(kr) || a(wr) <= 0, u(L, 1, Le), j(ne, a(d) ? "Processing…" : "Transfer");
        },
        [
          () => f(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => f(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => f(t("space-y-4")),
          () => f(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => f(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => f(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => f(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => f(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => f(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => f(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => f(t("w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => f(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => f(t("w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => f(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), ja("submit", A, (W) => {
        W.preventDefault(), Ui();
      }), Js(U, () => a(Ht), (W) => p(Ht, W)), Ut(Z, () => a(kr), (W) => p(kr, W)), Ut(oe, () => a(wr), (W) => p(wr, W)), Ut(Ae, () => a(Fr), (W) => p(Fr, W)), Ut(T, () => a(jr), (W) => p(jr, W)), N(v, g);
    }, co = (v) => {
      var g = Bl(), E = h(g), A = y(E, 2), M = y(h(A)), P = y(M, 2), U = y(A, 2);
      ct(
        U,
        20,
        () => [
          { id: "user", label: "User (usr_)" },
          { id: "invoice", label: "Invoice (inv_)" },
          { id: "raw", label: "Raw Hex" }
        ],
        bt,
        (R, T) => {
          var L = Pl(), ne = h(L);
          D(
            (W) => {
              u(L, 1, W), j(ne, T.label);
            },
            [
              () => f(t("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", a(tr) === T.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
            ]
          ), De("click", L, () => {
            p(tr, T.id, !0), p(At, null);
          }), N(R, L);
        }
      );
      var C = y(U, 2), z = h(C);
      {
        var Z = (R) => {
          var T = Dl();
          D((L) => u(T, 1, L), [
            () => f(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ut(T, () => a(an), (L) => p(an, L)), N(R, T);
        }, Y = (R) => {
          var T = Ol();
          D((L) => u(T, 1, L), [
            () => f(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ut(T, () => a(on), (L) => p(on, L)), N(R, T);
        }, J = (R) => {
          var T = Cl();
          D((L) => u(T, 1, L), [
            () => f(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ut(T, () => a(sn), (L) => p(sn, L)), N(R, T);
        };
        te(z, (R) => {
          a(tr) === "user" ? R(Z) : a(tr) === "invoice" ? R(Y, 1) : R(J, -1);
        });
      }
      var ae = y(z, 2), oe = h(ae);
      {
        var ye = (R) => {
          var T = Dt(), L = dt(T);
          Un(L, () => In), N(R, T);
        };
        te(oe, (R) => {
          a(Er) && R(ye);
        });
      }
      var pe = y(oe), Ae = y(C, 2);
      {
        var ke = (R) => {
          var T = jl(), L = h(T), ne = h(L), W = h(ne), $ = y(W, 2), ie = h($), se = y(ne, 2), ue = h(se), de = y(L, 2);
          ct(de, 21, () => Object.entries(a(At).balances), bt, (ee, be) => {
            var ce = /* @__PURE__ */ qt(() => So(a(be), 2));
            let Me = () => a(ce)[0], Le = () => a(ce)[1];
            const st = /* @__PURE__ */ qt(() => a(b)[Me()]?.decimals || 8);
            var lt = Il(), Mt = h(lt), ft = h(Mt), ze = y(Mt, 2), Xe = h(ze), Nt = h(Xe), le = y(Xe, 2), we = h(le);
            D(
              (ve, Rt, Lt, Pt, Ie, Ue, ar) => {
                u(lt, 1, ve), u(Mt, 1, Rt), j(ft, Me()), u(ze, 1, Lt), u(Xe, 1, Pt), j(Nt, Ie), u(le, 1, Ue), j(we, `${ar ?? ""} units`);
              },
              [
                () => f(t("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => f(t("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => f(t("text-right")),
                () => f(t("text-lg font-bold", Number(Le()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400")),
                () => Pn(Number(Le()), a(st)),
                () => f(t("text-xs text-gray-500 dark:text-gray-400")),
                () => Number(Le()).toLocaleString()
              ]
            ), N(ee, lt);
          });
          var H = y(de, 2);
          {
            var Q = (ee) => {
              var be = Fl();
              D((ce) => u(be, 1, ce), [() => f(t("text-sm text-gray-500 italic"))]), N(ee, be);
            }, re = /* @__PURE__ */ qt(() => Object.values(a(At).balances).every((ee) => Number(ee) === 0));
            te(H, (ee) => {
              a(re) && ee(Q);
            });
          }
          D(
            (ee, be, ce, Me, Le, st, lt) => {
              u(T, 1, ee), u(L, 1, be), u(W, 1, ce), u($, 1, Me), j(ie, a(At).label), u(se, 1, Le), j(ue, `${st ?? ""}…`), u(de, 1, lt);
            },
            [
              () => f(t("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3")),
              () => f(t("flex items-center justify-between")),
              () => f(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
              () => f(t("ml-2 text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => f(t("text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono")),
              () => a(At).subaccount_hex.substring(0, 16),
              () => f(t("space-y-2"))
            ]
          ), De("click", se, () => nr(a(At)?.subaccount_hex || "")), N(R, T);
        };
        te(Ae, (R) => {
          a(At) && R(ke);
        });
      }
      D(
        (R, T, L, ne, W, $, ie, se) => {
          u(g, 1, R), u(E, 1, T), u(A, 1, L), u(M, 1, ne), u(P, 1, W), u(U, 1, $), u(C, 1, ie), ae.disabled = a(Er), u(ae, 1, se), j(pe, ` ${a(Er) ? "Looking up…" : "Lookup"}`);
        },
        [
          () => f(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => f(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => f(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => f(t("bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs")),
          () => f(t("bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs")),
          () => f(t("flex gap-2 mb-4")),
          () => f(t("flex gap-2 mb-4")),
          () => f(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"))
        ]
      ), ja("submit", C, (R) => {
        R.preventDefault(), Yi();
      }), N(v, g);
    }, vo = (v) => {
      var g = Wl(), E = h(g), A = y(E, 2), M = h(A), P = h(M);
      {
        var U = (H) => {
          var Q = Dt(), re = dt(Q);
          Un(re, () => In), N(H, Q);
        };
        te(P, (H) => {
          a(d) && H(U);
        });
      }
      var C = y(P), z = y(A, 2), Z = h(z), Y = y(Z, 2), J = y(Y, 2), ae = h(J), oe = y(ae, 2), ye = y(oe, 2), pe = y(ye, 2), Ae = y(z, 2), ke = h(Ae), R = h(ke), T = h(R), L = y(R, 2);
      {
        var ne = (H) => {
          var Q = ql();
          ct(Q, 21, () => a(xe), bt, (re, ee) => {
            var be = Hl(), ce = h(be), Me = h(ce), Le = y(ce, 2), st = h(Le), lt = y(Le, 2);
            {
              var Mt = (ft) => {
                var ze = Vl(), Xe = h(ze);
                D(
                  (Nt) => {
                    u(ze, 1, Nt), j(Xe, `Token: ${a(ee).token ?? ""}`);
                  },
                  [
                    () => f(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
                  ]
                ), N(ft, ze);
              };
              te(lt, (ft) => {
                a(ee).token && ft(Mt);
              });
            }
            D(
              (ft, ze, Xe, Nt) => {
                u(be, 1, ft), u(ce, 1, ze), j(Me, `Principal: ${(a(ee).principal || a(ee)._id || a(ee).id) ?? ""}`), u(Le, 1, Xe), j(st, `${Nt ?? ""} units`);
              },
              [
                () => f(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => f(t("font-mono text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => f(t("text-sm font-semibold text-gray-800 dark:text-gray-200")),
                () => (a(ee).amount || 0).toLocaleString()
              ]
            ), N(re, be);
          }), D((re) => u(Q, 1, re), [() => f(t("space-y-2 max-h-80 overflow-auto"))]), N(H, Q);
        }, W = (H) => {
          var Q = zl();
          D((re) => u(Q, 1, re), [() => f(t("text-gray-500 dark:text-gray-400 text-sm"))]), N(H, Q);
        };
        te(L, (H) => {
          a(xe).length > 0 ? H(ne) : H(W, -1);
        });
      }
      var $ = y(ke, 2), ie = h($), se = y(ie, 2);
      {
        var ue = (H) => {
          var Q = Ul(), re = h(Q);
          D(
            (ee) => {
              u(Q, 1, ee), j(re, `Total transfers: ${a(Pe).total_items_count ?? ""}`);
            },
            [() => f(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), N(H, Q);
        }, de = (H) => {
          var Q = Yl();
          D((re) => u(Q, 1, re), [() => f(t("text-gray-500 dark:text-gray-400 text-sm"))]), N(H, Q);
        };
        te(se, (H) => {
          a(Pe) ? H(ue) : H(de, -1);
        });
      }
      D(
        (H, Q, re, ee, be, ce, Me, Le, st, lt, Mt, ft, ze, Xe, Nt) => {
          u(g, 1, H), u(E, 1, Q), u(A, 1, re), M.disabled = a(d), u(M, 1, ee), j(C, ` ${a(d) ? "Refreshing…" : "Full Vault Refresh"}`), u(z, 1, be), u(Z, 1, ce), u(Y, 1, Me), u(J, 1, Le), u(ae, 1, st), u(oe, 1, lt), u(ye, 1, Mt), u(pe, 1, ft), u(Ae, 1, ze), u(R, 1, Xe), j(T, `All Balances in System (${a(xe).length ?? ""})`), u(ie, 1, Nt);
        },
        [
          () => f(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => f(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => f(t("mb-4")),
          () => f(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => f(t("mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700")),
          () => f(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => f(t("text-xs text-gray-500 dark:text-gray-400 mb-3")),
          () => f(t("flex items-center gap-3")),
          () => f(t("text-sm text-gray-700 dark:text-gray-300")),
          () => f(t("w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100")),
          () => f(t("text-sm text-gray-500 dark:text-gray-400")),
          () => f(t("px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60")),
          () => f(t("space-y-6")),
          () => f(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => f(t("font-semibold text-gray-700 dark:text-gray-300 mb-2"))
        ]
      ), De("click", M, On), Ut(oe, () => a(Nn), (H) => p(Nn, H)), De("click", pe, Fi), N(v, g);
    };
    te(so, (v) => {
      a(c) === "balance" ? v(lo) : a(c) === "transactions" ? v(fo, 1) : a(c) === "transfer" ? v(uo, 2) : a(c) === "lookup" ? v(co, 3) : a(c) === "admin" && v(vo, 4);
    });
  }
  D(
    (v, g, E, A, M, P, U, C, z) => {
      u(Fn, 1, v), u(jn, 1, g), u(ma, 1, E), un.disabled = a(d) || a(pt), u(un, 1, A), j(Ki, ` ${a(d) || a(pt) ? "Refreshing…" : "Refresh"}`), u(Bn, 1, M), u(Vn, 1, P), u(Ea, 1, U), u(dn, 1, C), j(Zi, a(S) || "Loading…"), u(Hn, 1, z);
    },
    [
      () => f(t("max-w-4xl mx-auto p-6 space-y-6")),
      () => f(t("flex justify-between items-center")),
      () => f(t("text-2xl font-bold text-gray-900 dark:text-gray-100")),
      () => f(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed", "inline-flex items-center gap-2 transition-colors")),
      () => f(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2")),
      () => f(t("flex items-center gap-2")),
      () => f(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
      () => f(t("font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline")),
      () => f(t("flex border-b border-gray-200 dark:border-gray-700"))
    ]
  ), De("click", un, On), De("click", dn, () => nr(a(S))), N(e, Fn), Ka();
}
Os(["click", "change"]);
function Zl(e, r) {
  const t = js(Jl, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        Vs(t);
      } catch {
      }
    }
  };
}
export {
  Zl as default
};
