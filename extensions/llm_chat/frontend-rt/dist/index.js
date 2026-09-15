var bo = Object.defineProperty;
var Rr = (e) => {
  throw TypeError(e);
};
var _o = (e, t, n) => t in e ? bo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ie = (e, t, n) => _o(e, typeof t != "symbol" ? t + "" : t, n), Vs = (e, t, n) => t.has(e) || Rr("Cannot " + n);
var l = (e, t, n) => (Vs(e, t, "read from private field"), n ? n.call(e) : t.get(e)), A = (e, t, n) => t.has(e) ? Rr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), T = (e, t, n, s) => (Vs(e, t, "write to private field"), s ? s.call(e, n) : t.set(e, n), n), z = (e, t, n) => (Vs(e, t, "access private method"), n);
var $r = Array.isArray, mo = Array.prototype.indexOf, Kt = Array.prototype.includes, Ms = Array.from, ko = Object.defineProperty, Kn = Object.getOwnPropertyDescriptor, wo = Object.getOwnPropertyDescriptors, xo = Object.prototype, yo = Array.prototype, Jr = Object.getPrototypeOf, Dr = Object.isExtensible;
const Eo = () => {
};
function So(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Qr() {
  var e, t, n = new Promise((s, r) => {
    e = s, t = r;
  });
  return { promise: n, resolve: e, reject: t };
}
const de = 2, Tn = 4, Ps = 8, Xr = 1 << 24, Ke = 16, Xe = 32, Pt = 64, Js = 128, Be = 512, oe = 1024, ue = 2048, ot = 4096, we = 8192, Qe = 16384, In = 32768, Qs = 1 << 25, An = 65536, ws = 1 << 17, To = 1 << 18, Ln = 1 << 19, Ao = 1 << 20, rt = 1 << 25, Zt = 65536, xs = 1 << 21, _n = 1 << 22, Mt = 1 << 23, vs = Symbol("$state"), Co = Symbol(""), ps = Symbol("attributes"), Xs = Symbol("class"), Zs = Symbol("style"), qn = Symbol("text"), hs = Symbol("form reset"), Is = new class extends Error {
  constructor() {
    super(...arguments);
    Ie(this, "name", "StaleReactionError");
    Ie(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Mo(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Po() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Io(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Lo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function No() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Ro(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Do() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Oo() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function zo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function jo() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Fo() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Ho = 1, Uo = 2, Zr = 4, Bo = 8, Vo = 16, qo = 1, Yo = 2, ie = Symbol("uninitialized"), ei = "http://www.w3.org/1999/xhtml", Go = "http://www.w3.org/2000/svg", Wo = "http://www.w3.org/1998/Math/MathML";
function Ko() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function $o() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function ti(e) {
  return e === this.v;
}
function Jo(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function ni(e) {
  return !Jo(e, this.v);
}
let me = null;
function Cn(e) {
  me = e;
}
function si(e, t = !1, n) {
  me = {
    p: me,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      D
    ),
    l: null
  };
}
function ri(e) {
  var t = (
    /** @type {ComponentContext} */
    me
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var s of n)
      Si(s);
  }
  return t.i = !0, me = t.p, /** @type {T} */
  {};
}
function ii() {
  return !0;
}
let Ft = [];
function oi() {
  var e = Ft;
  Ft = [], So(e);
}
function $t(e) {
  if (Ft.length === 0 && !$n) {
    var t = Ft;
    queueMicrotask(() => {
      t === Ft && oi();
    });
  }
  Ft.push(e);
}
function Qo() {
  for (; Ft.length > 0; )
    oi();
}
function ai(e) {
  var t = D;
  if (t === null)
    return N.f |= Mt, e;
  if ((t.f & In) === 0 && (t.f & Tn) === 0)
    throw e;
  Ct(e, t);
}
function Ct(e, t) {
  for (; t !== null; ) {
    if ((t.f & Js) !== 0) {
      if ((t.f & In) === 0)
        throw e;
      try {
        t.b.error(e);
        return;
      } catch (n) {
        e = n;
      }
    }
    t = t.parent;
  }
  throw e;
}
const Xo = -7169;
function X(e, t) {
  e.f = e.f & Xo | t;
}
function ur(e) {
  (e.f & Be) !== 0 || e.deps === null ? X(e, oe) : X(e, ot);
}
function li(e) {
  if (e !== null)
    for (const t of e)
      (t.f & de) === 0 || (t.f & Zt) === 0 || (t.f ^= Zt, li(
        /** @type {Derived} */
        t.deps
      ));
}
function ci(e, t, n) {
  (e.f & ue) !== 0 ? t.add(e) : (e.f & ot) !== 0 && n.add(e), li(e.deps), X(e, oe);
}
let qs = null, fn = null, L = null, er = null, $e = null, tr = null, $n = !1, Ys = !1, bn = null, gs = null;
var Or = 0;
let Zo = 1;
var mn, Tt, Bt, kn, wn, Vt, xn, pt, yn, ye, Xn, ht, Ye, nt, En, qt, B, nr, Yn, sr, fi, ui, hn, ea, Gn;
const Ts = class Ts {
  constructor() {
    A(this, B);
    Ie(this, "id", Zo++);
    /** True as soon as `#process` was called */
    A(this, mn, !1);
    Ie(this, "linked", !0);
    /** @type {Batch | null} */
    A(this, Tt, null);
    /** @type {Batch | null} */
    A(this, Bt, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    Ie(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    Ie(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    Ie(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    A(this, kn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    A(this, wn, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    A(this, Vt, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    A(this, xn, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    A(this, pt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    A(this, yn, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    A(this, ye, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    A(this, Xn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    A(this, ht, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    A(this, Ye, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    A(this, nt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    A(this, En, /* @__PURE__ */ new Set());
    Ie(this, "is_fork", !1);
    A(this, qt, !1);
    fn === null ? qs = fn = this : (T(fn, Bt, this), T(this, Tt, fn)), fn = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    l(this, nt).has(t) || l(this, nt).set(t, { d: [], m: [] }), l(this, En).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (s) => this.schedule(s)) {
    var s = l(this, nt).get(t);
    if (s) {
      l(this, nt).delete(t);
      for (var r of s.d)
        X(r, ue), n(r);
      for (r of s.m)
        X(r, ot), n(r);
    }
    l(this, En).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, s = !1) {
    t.v !== ie && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Mt) === 0 && (this.current.set(t, [n, s]), $e?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    L = this;
  }
  deactivate() {
    L = null, $e = null;
  }
  flush() {
    try {
      Ys = !0, L = this, z(this, B, Yn).call(this);
    } finally {
      Or = 0, tr = null, bn = null, gs = null, Ys = !1, L = null, $e = null, Jt.clear();
    }
  }
  discard() {
    for (const t of l(this, wn)) t(this);
    l(this, wn).clear(), l(this, Vt).clear(), z(this, B, Gn).call(this), l(this, yn)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    l(this, Xn).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    if (T(this, xn, l(this, xn) + 1), t) {
      let s = l(this, pt).get(n) ?? 0;
      l(this, pt).set(n, s + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, n) {
    if (T(this, xn, l(this, xn) - 1), t) {
      let s = l(this, pt).get(n) ?? 0;
      s === 1 ? l(this, pt).delete(n) : l(this, pt).set(n, s - 1);
    }
    l(this, qt) || (T(this, qt, !0), $t(() => {
      T(this, qt, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const s of t)
      l(this, ht).add(s);
    for (const s of n)
      l(this, Ye).add(s);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    l(this, kn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    l(this, wn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(t) {
    l(this, Vt).add(t);
  }
  run_fork_commit_callbacks() {
    for (const t of l(this, Vt)) t(this);
    l(this, Vt).clear();
  }
  settled() {
    return (l(this, yn) ?? T(this, yn, Qr())).promise;
  }
  static ensure() {
    if (L === null) {
      const t = L = new Ts();
      !Ys && !$n && $t(() => {
        l(t, mn) || t.flush();
      });
    }
    return L;
  }
  apply() {
    {
      $e = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    if (tr = t, t.b?.is_pending && (t.f & (Tn | Ps | Xr)) !== 0 && (t.f & In) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var s = n.f;
      if (bn !== null && n === D && (N === null || (N.f & de) === 0))
        return;
      if ((s & (Pt | Xe)) !== 0) {
        if ((s & oe) === 0)
          return;
        n.f ^= oe;
      }
    }
    l(this, ye).push(n);
  }
};
mn = new WeakMap(), Tt = new WeakMap(), Bt = new WeakMap(), kn = new WeakMap(), wn = new WeakMap(), Vt = new WeakMap(), xn = new WeakMap(), pt = new WeakMap(), yn = new WeakMap(), ye = new WeakMap(), Xn = new WeakMap(), ht = new WeakMap(), Ye = new WeakMap(), nt = new WeakMap(), En = new WeakMap(), qt = new WeakMap(), B = new WeakSet(), nr = function() {
  if (this.is_fork) return !0;
  for (const s of l(this, pt).keys()) {
    for (var t = s, n = !1; t.parent !== null; ) {
      if (l(this, nt).has(t)) {
        n = !0;
        break;
      }
      t = t.parent;
    }
    if (!n)
      return !0;
  }
  return !1;
}, Yn = function() {
  var c, u, h;
  T(this, mn, !0), Or++ > 1e3 && (z(this, B, Gn).call(this), na());
  for (const p of l(this, ht))
    l(this, Ye).delete(p), X(p, ue), this.schedule(p);
  for (const p of l(this, Ye))
    X(p, ot), this.schedule(p);
  const t = l(this, ye);
  T(this, ye, []), this.apply();
  var n = bn = [], s = [], r = gs = [];
  for (const p of t)
    try {
      z(this, B, sr).call(this, p, n, s);
    } catch (v) {
      throw pi(p), z(this, B, nr).call(this) || this.discard(), v;
    }
  if (L = null, r.length > 0) {
    var i = Ts.ensure();
    for (const p of r)
      i.schedule(p);
  }
  if (bn = null, gs = null, z(this, B, nr).call(this)) {
    z(this, B, hn).call(this, s), z(this, B, hn).call(this, n);
    for (const [p, v] of l(this, nt))
      vi(p, v);
    r.length > 0 && /** @type {unknown} */
    z(c = L, B, Yn).call(c);
    return;
  }
  const a = z(this, B, fi).call(this);
  if (a) {
    z(this, B, hn).call(this, s), z(this, B, hn).call(this, n), z(u = a, B, ui).call(u, this);
    return;
  }
  l(this, ht).clear(), l(this, Ye).clear();
  for (const p of l(this, kn)) p(this);
  l(this, kn).clear(), er = this, zr(s), zr(n), er = null, l(this, yn)?.resolve();
  var f = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    L
  );
  if (l(this, xn) === 0 && (l(this, ye).length === 0 || f !== null) && z(this, B, Gn).call(this), l(this, ye).length > 0)
    if (f !== null) {
      const p = f;
      l(p, ye).push(...l(this, ye).filter((v) => !l(p, ye).includes(v)));
    } else
      f = this;
  f !== null && z(h = f, B, Yn).call(h);
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
sr = function(t, n, s) {
  t.f ^= oe;
  for (var r = t.first; r !== null; ) {
    var i = r.f, a = (i & (Xe | Pt)) !== 0, f = a && (i & oe) !== 0, c = f || (i & we) !== 0 || l(this, nt).has(r);
    if (!c && r.fn !== null) {
      a ? r.f ^= oe : (i & Tn) !== 0 ? n.push(r) : rs(r) && ((i & Ke) !== 0 && l(this, Ye).add(r), Pn(r));
      var u = r.first;
      if (u !== null) {
        r = u;
        continue;
      }
    }
    for (; r !== null; ) {
      var h = r.next;
      if (h !== null) {
        r = h;
        break;
      }
      r = r.parent;
    }
  }
}, fi = function() {
  for (var t = l(this, Tt); t !== null; ) {
    if (!t.is_fork) {
      for (const [n, [, s]] of this.current)
        if (t.current.has(n) && !s)
          return t;
    }
    t = l(t, Tt);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
ui = function(t) {
  var s;
  for (const [r, i] of t.current)
    !this.previous.has(r) && t.previous.has(r) && this.previous.set(r, t.previous.get(r)), this.current.set(r, i);
  for (const [r, i] of t.async_deriveds) {
    const a = this.async_deriveds.get(r);
    a && i.promise.then(a.resolve).catch(a.reject);
  }
  this.transfer_effects(l(t, ht), l(t, Ye));
  const n = (r) => {
    var i = r.reactions;
    if (i !== null)
      for (const c of i) {
        var a = c.f;
        if ((a & de) !== 0)
          n(
            /** @type {Derived} */
            c
          );
        else {
          var f = (
            /** @type {Effect} */
            c
          );
          a & (_n | Ke) && !this.async_deriveds.has(f) && (l(this, Ye).delete(f), X(f, ue), this.schedule(f));
        }
      }
  };
  for (const r of this.current.keys())
    n(r);
  this.oncommit(() => t.discard()), z(s = t, B, Gn).call(s), L = this, z(this, B, Yn).call(this);
}, /**
 * @param {Effect[]} effects
 */
hn = function(t) {
  for (var n = 0; n < t.length; n += 1)
    ci(t[n], l(this, ht), l(this, Ye));
}, ea = function() {
  var h;
  for (let p = qs; p !== null; p = l(p, Bt)) {
    var t = p.id < this.id, n = [];
    for (const [v, [m, _]] of this.current) {
      if (p.current.has(v)) {
        var s = (
          /** @type {[any, boolean]} */
          p.current.get(v)[0]
        );
        if (t && m !== s)
          p.current.set(v, [m, _]);
        else
          continue;
      }
      n.push(v);
    }
    if (t)
      for (const [v, m] of this.async_deriveds) {
        const _ = p.async_deriveds.get(v);
        _ && m.promise.then(_.resolve).catch(_.reject);
      }
    if (l(p, mn)) {
      var r = [...p.current.keys()].filter(
        (v) => !/** @type {[any, boolean]} */
        p.current.get(v)[1] && !this.current.has(v)
      );
      if (r.length === 0)
        t && p.discard();
      else if (n.length > 0) {
        if (t)
          for (const v of l(this, En))
            p.unskip_effect(v, (m) => {
              var _;
              (m.f & (Ke | _n)) !== 0 ? p.schedule(m) : z(_ = p, B, hn).call(_, [m]);
            });
        p.activate();
        var i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map();
        for (var f of n)
          di(f, r, i, a);
        a = /* @__PURE__ */ new Map();
        var c = [...p.current].filter(([v, m]) => {
          const _ = this.current.get(v);
          return _ ? _[0] !== m[0] || _[1] !== m[1] : !0;
        }).map(([v]) => v);
        if (c.length > 0)
          for (const v of l(this, Xn))
            (v.f & (Qe | we | ws)) === 0 && dr(v, c, a) && ((v.f & (_n | Ke)) !== 0 ? (X(v, ue), p.schedule(v)) : l(p, ht).add(v));
        if (l(p, ye).length > 0 && !l(p, qt)) {
          p.apply();
          for (var u of l(p, ye))
            z(h = p, B, sr).call(h, u, [], []);
          T(p, ye, []);
        }
        p.deactivate();
      }
    }
  }
}, Gn = function() {
  if (this.linked) {
    var t = l(this, Tt), n = l(this, Bt);
    t === null ? qs = n : T(t, Bt, n), n === null ? fn = t : T(n, Tt, t), this.linked = !1;
  }
};
let en = Ts;
function ta(e) {
  var t = $n;
  $n = !0;
  try {
    for (var n; ; ) {
      if (Qo(), L === null)
        return (
          /** @type {T} */
          n
        );
      L.flush();
    }
  } finally {
    $n = t;
  }
}
function na() {
  try {
    Do();
  } catch (e) {
    Ct(e, tr);
  }
}
let vt = null;
function zr(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var s = e[n++];
      if ((s.f & (Qe | we)) === 0 && rs(s) && (vt = /* @__PURE__ */ new Set(), Pn(s), s.deps === null && s.first === null && s.nodes === null && s.teardown === null && s.ac === null && Mi(s), vt?.size > 0)) {
        Jt.clear();
        for (const r of vt) {
          if ((r.f & (Qe | we)) !== 0) continue;
          const i = [r];
          let a = r.parent;
          for (; a !== null; )
            vt.has(a) && (vt.delete(a), i.push(a)), a = a.parent;
          for (let f = i.length - 1; f >= 0; f--) {
            const c = i[f];
            (c.f & (Qe | we)) === 0 && Pn(c);
          }
        }
        vt.clear();
      }
    }
    vt = null;
  }
}
function di(e, t, n, s) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const r of e.reactions) {
      const i = r.f;
      (i & de) !== 0 ? di(
        /** @type {Derived} */
        r,
        t,
        n,
        s
      ) : (i & (_n | Ke)) !== 0 && (i & ue) === 0 && dr(r, t, s) && (X(r, ue), vr(
        /** @type {Effect} */
        r
      ));
    }
}
function dr(e, t, n) {
  const s = n.get(e);
  if (s !== void 0) return s;
  if (e.deps !== null)
    for (const r of e.deps) {
      if (Kt.call(t, r))
        return !0;
      if ((r.f & de) !== 0 && dr(
        /** @type {Derived} */
        r,
        t,
        n
      ))
        return n.set(
          /** @type {Derived} */
          r,
          !0
        ), !0;
    }
  return n.set(e, !1), !1;
}
function vr(e) {
  L.schedule(e);
}
function vi(e, t) {
  if (!((e.f & Xe) !== 0 && (e.f & oe) !== 0)) {
    (e.f & ue) !== 0 ? t.d.push(e) : (e.f & ot) !== 0 && t.m.push(e), X(e, oe);
    for (var n = e.first; n !== null; )
      vi(n, t), n = n.next;
  }
}
function pi(e) {
  X(e, oe);
  for (var t = e.first; t !== null; )
    pi(t), t = t.next;
}
function sa(e) {
  let t = 0, n = tn(0), s;
  return () => {
    br() && (o(n), _r(() => (t === 0 && (s = Ls(() => e(() => Jn(n)))), t += 1, () => {
      $t(() => {
        t -= 1, t === 0 && (s?.(), s = void 0, Jn(n));
      });
    })));
  };
}
var ra = An | Ln;
function ia(e, t, n, s) {
  new oa(e, t, n, s);
}
var je, fr, Fe, Yt, Ee, He, ke, Ne, gt, Gt, At, Sn, Zn, es, bt, As, Z, aa, la, ca, rr, bs, _s, ir, or;
class oa {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, s, r) {
    A(this, Z);
    /** @type {Boundary | null} */
    Ie(this, "parent");
    Ie(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Ie(this, "transform_error");
    /** @type {TemplateNode} */
    A(this, je);
    /** @type {TemplateNode | null} */
    A(this, fr, null);
    /** @type {BoundaryProps} */
    A(this, Fe);
    /** @type {((anchor: Node) => void)} */
    A(this, Yt);
    /** @type {Effect} */
    A(this, Ee);
    /** @type {Effect | null} */
    A(this, He, null);
    /** @type {Effect | null} */
    A(this, ke, null);
    /** @type {Effect | null} */
    A(this, Ne, null);
    /** @type {DocumentFragment | null} */
    A(this, gt, null);
    A(this, Gt, 0);
    A(this, At, 0);
    A(this, Sn, !1);
    /** @type {Set<Effect>} */
    A(this, Zn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    A(this, es, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    A(this, bt, null);
    A(this, As, sa(() => (T(this, bt, tn(l(this, Gt))), () => {
      T(this, bt, null);
    })));
    T(this, je, t), T(this, Fe, n), T(this, Yt, (i) => {
      var a = (
        /** @type {Effect} */
        D
      );
      a.b = this, a.f |= Js, s(i);
    }), this.parent = /** @type {Effect} */
    D.b, this.transform_error = r ?? this.parent?.transform_error ?? ((i) => i), T(this, Ee, mr(() => {
      z(this, Z, rr).call(this);
    }, ra));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    ci(t, l(this, Zn), l(this, es));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!l(this, Fe).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    z(this, Z, ir).call(this, t, n), T(this, Gt, l(this, Gt) + t), !(!l(this, bt) || l(this, Sn)) && (T(this, Sn, !0), $t(() => {
      T(this, Sn, !1), l(this, bt) && Mn(l(this, bt), l(this, Gt));
    }));
  }
  get_effect_pending() {
    return l(this, As).call(this), o(
      /** @type {Source<number>} */
      l(this, bt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!l(this, Fe).onerror && !l(this, Fe).failed)
      throw t;
    L?.is_fork ? (l(this, He) && L.skip_effect(l(this, He)), l(this, ke) && L.skip_effect(l(this, ke)), l(this, Ne) && L.skip_effect(l(this, Ne)), L.on_fork_commit(() => {
      z(this, Z, or).call(this, t);
    })) : z(this, Z, or).call(this, t);
  }
}
je = new WeakMap(), fr = new WeakMap(), Fe = new WeakMap(), Yt = new WeakMap(), Ee = new WeakMap(), He = new WeakMap(), ke = new WeakMap(), Ne = new WeakMap(), gt = new WeakMap(), Gt = new WeakMap(), At = new WeakMap(), Sn = new WeakMap(), Zn = new WeakMap(), es = new WeakMap(), bt = new WeakMap(), As = new WeakMap(), Z = new WeakSet(), aa = function() {
  try {
    T(this, He, Ue(() => l(this, Yt).call(this, l(this, je))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
la = function(t) {
  const n = l(this, Fe).failed;
  n && T(this, Ne, Ue(() => {
    n(
      l(this, je),
      () => t,
      () => () => {
      }
    );
  }));
}, ca = function() {
  const t = l(this, Fe).pending;
  t && (this.is_pending = !0, T(this, ke, Ue(() => t(l(this, je)))), $t(() => {
    var n = T(this, gt, document.createDocumentFragment()), s = _t();
    n.append(s), T(this, He, z(this, Z, _s).call(this, () => Ue(() => l(this, Yt).call(this, s)))), l(this, At) === 0 && (l(this, je).before(n), T(this, gt, null), Qt(
      /** @type {Effect} */
      l(this, ke),
      () => {
        T(this, ke, null);
      }
    ), z(this, Z, bs).call(
      this,
      /** @type {Batch} */
      L
    ));
  }));
}, rr = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), T(this, At, 0), T(this, Gt, 0), T(this, He, Ue(() => {
      l(this, Yt).call(this, l(this, je));
    })), l(this, At) > 0) {
      var t = T(this, gt, document.createDocumentFragment());
      wr(l(this, He), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        l(this, Fe).pending
      );
      T(this, ke, Ue(() => n(l(this, je))));
    } else
      z(this, Z, bs).call(
        this,
        /** @type {Batch} */
        L
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
bs = function(t) {
  this.is_pending = !1, t.transfer_effects(l(this, Zn), l(this, es));
}, /**
 * @template T
 * @param {() => T} fn
 */
_s = function(t) {
  var n = D, s = N, r = me;
  at(l(this, Ee)), qe(l(this, Ee)), Cn(l(this, Ee).ctx);
  try {
    return en.ensure(), t();
  } catch (i) {
    return ai(i), null;
  } finally {
    at(n), qe(s), Cn(r);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
ir = function(t, n) {
  var s;
  if (!this.has_pending_snippet()) {
    this.parent && z(s = this.parent, Z, ir).call(s, t, n);
    return;
  }
  T(this, At, l(this, At) + t), l(this, At) === 0 && (z(this, Z, bs).call(this, n), l(this, ke) && Qt(l(this, ke), () => {
    T(this, ke, null);
  }), l(this, gt) && (l(this, je).before(l(this, gt)), T(this, gt, null)));
}, /**
 * @param {unknown} error
 */
or = function(t) {
  l(this, He) && (Te(l(this, He)), T(this, He, null)), l(this, ke) && (Te(l(this, ke)), T(this, ke, null)), l(this, Ne) && (Te(l(this, Ne)), T(this, Ne, null));
  var n = l(this, Fe).onerror;
  let s = l(this, Fe).failed;
  var r = !1, i = !1;
  const a = () => {
    if (r) {
      $o();
      return;
    }
    r = !0, i && Fo(), l(this, Ne) !== null && Qt(l(this, Ne), () => {
      T(this, Ne, null);
    }), z(this, Z, _s).call(this, () => {
      z(this, Z, rr).call(this);
    });
  }, f = (c) => {
    try {
      i = !0, n?.(c, a), i = !1;
    } catch (u) {
      Ct(u, l(this, Ee) && l(this, Ee).parent);
    }
    s && T(this, Ne, z(this, Z, _s).call(this, () => {
      try {
        return Ue(() => {
          var u = (
            /** @type {Effect} */
            D
          );
          u.b = this, u.f |= Js, s(
            l(this, je),
            () => c,
            () => a
          );
        });
      } catch (u) {
        return Ct(
          u,
          /** @type {Effect} */
          l(this, Ee).parent
        ), null;
      }
    }));
  };
  $t(() => {
    var c;
    try {
      c = this.transform_error(t);
    } catch (u) {
      Ct(u, l(this, Ee) && l(this, Ee).parent);
      return;
    }
    c !== null && typeof c == "object" && typeof /** @type {any} */
    c.then == "function" ? c.then(
      f,
      /** @param {unknown} e */
      (u) => Ct(u, l(this, Ee) && l(this, Ee).parent)
    ) : f(c);
  });
};
function fa(e, t, n, s) {
  const r = gi;
  var i = e.filter((v) => !v.settled);
  if (n.length === 0 && i.length === 0) {
    s(t.map(r));
    return;
  }
  var a = (
    /** @type {Effect} */
    D
  ), f = ua(), c = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((v) => v.promise)) : null;
  function u(v) {
    if ((a.f & Qe) === 0) {
      f();
      try {
        s(v);
      } catch (m) {
        Ct(m, a);
      }
      ys();
    }
  }
  var h = hi();
  if (n.length === 0) {
    c.then(() => u(t.map(r))).finally(h);
    return;
  }
  function p() {
    Promise.all(n.map((v) => /* @__PURE__ */ da(v))).then((v) => u([...t.map(r), ...v])).catch((v) => Ct(v, a)).finally(h);
  }
  c ? c.then(() => {
    f(), p(), ys();
  }) : p();
}
function ua() {
  var e = (
    /** @type {Effect} */
    D
  ), t = N, n = me, s = (
    /** @type {Batch} */
    L
  );
  return function(i = !0) {
    at(e), qe(t), Cn(n), i && (e.f & Qe) === 0 && (s?.activate(), s?.apply());
  };
}
function ys(e = !0) {
  at(null), qe(null), Cn(null), e && L?.deactivate();
}
function hi() {
  var e = (
    /** @type {Effect} */
    D
  ), t = e.b, n = (
    /** @type {Batch} */
    L
  ), s = !!t?.is_rendered();
  return t?.update_pending_count(1, n), n.increment(s, e), () => {
    t?.update_pending_count(-1, n), n.decrement(s, e);
  };
}
// @__NO_SIDE_EFFECTS__
function gi(e) {
  var t = de | ue;
  return D !== null && (D.f |= Ln), {
    ctx: me,
    deps: null,
    effects: null,
    equals: ti,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      ie
    ),
    wv: 0,
    parent: D,
    ac: null
  };
}
const fs = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function da(e, t, n) {
  let s = (
    /** @type {Effect | null} */
    D
  );
  s === null && Po();
  var r = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = tn(
    /** @type {V} */
    ie
  ), a = !N, f = /* @__PURE__ */ new Set();
  return Ta(() => {
    var c = (
      /** @type {Effect} */
      D
    ), u = Qr();
    r = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, (m) => {
        m !== Is && u.reject(m);
      }).finally(ys);
    } catch (m) {
      u.reject(m), ys();
    }
    var h = (
      /** @type {Batch} */
      L
    );
    if (a) {
      if ((c.f & In) !== 0)
        var p = hi();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        s.b?.is_rendered()
      )
        h.async_deriveds.get(c)?.reject(fs);
      else
        for (const m of f.values())
          m.reject(fs);
      f.add(u), h.async_deriveds.set(c, u);
    }
    const v = (m, _ = void 0) => {
      p?.(), f.delete(u), _ !== fs && (h.activate(), _ ? (i.f |= Mt, Mn(i, _)) : ((i.f & Mt) !== 0 && (i.f ^= Mt), Mn(i, m)), h.deactivate());
    };
    u.promise.then(v, (m) => v(null, m || "unknown"));
  }), Ea(() => {
    for (const c of f)
      c.reject(fs);
  }), new Promise((c) => {
    function u(h) {
      function p() {
        h === r ? c(i) : u(r);
      }
      h.then(p, p);
    }
    u(r);
  });
}
// @__NO_SIDE_EFFECTS__
function va(e) {
  const t = /* @__PURE__ */ gi(e);
  return t.equals = ni, t;
}
function pa(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Te(
        /** @type {Effect} */
        t[n]
      );
  }
}
function pr(e) {
  var t, n = D, s = e.parent;
  if (!It && s !== null && e.v !== ie && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (s.f & (Qe | we)) !== 0)
    return Ko(), e.v;
  at(s);
  try {
    e.f &= ~Zt, pa(e), t = Di(e);
  } finally {
    at(n);
  }
  return t;
}
function bi(e) {
  var t = pr(e);
  if (!e.equals(t) && (e.wv = Ni(), (!L?.is_fork || e.deps === null) && (L !== null ? (L.capture(e, t, !0), er?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    X(e, oe);
    return;
  }
  It || ($e !== null ? (br() || L?.is_fork) && $e.set(e, t) : ur(e));
}
function ha(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(Is), t.fn !== null && (t.teardown = Eo), t.ac = null, Qn(t, 0), kr(t));
}
function _i(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Pn(t);
}
let Es = /* @__PURE__ */ new Set();
const Jt = /* @__PURE__ */ new Map();
let mi = !1;
function tn(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: ti,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function M(e, t) {
  const n = tn(e);
  return Ca(n), n;
}
// @__NO_SIDE_EFFECTS__
function ga(e, t = !1, n = !0) {
  const s = tn(e);
  return t || (s.equals = ni), s;
}
function g(e, t, n = !1) {
  N !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Je || (N.f & ws) !== 0) && ii() && (N.f & (de | Ke | _n | ws)) !== 0 && (Ve === null || !Kt.call(Ve, e)) && jo();
  let s = n ? We(t) : t;
  return Mn(e, s, gs);
}
function Mn(e, t, n = null) {
  if (!e.equals(t)) {
    Jt.set(e, It ? t : e.v);
    var s = en.ensure();
    if (s.capture(e, t), (e.f & de) !== 0) {
      const r = (
        /** @type {Derived} */
        e
      );
      (e.f & ue) !== 0 && pr(r), $e === null && ur(r);
    }
    e.wv = Ni(), ki(e, ue, n), D !== null && (D.f & oe) !== 0 && (D.f & (Xe | Pt)) === 0 && (ze === null ? Ma([e]) : ze.push(e)), !s.is_fork && Es.size > 0 && !mi && ba();
  }
  return t;
}
function ba() {
  mi = !1;
  for (const e of Es) {
    (e.f & oe) !== 0 && X(e, ot);
    let t;
    try {
      t = rs(e);
    } catch {
      t = !0;
    }
    t && Pn(e);
  }
  Es.clear();
}
function Jn(e) {
  g(e, e.v + 1);
}
function ki(e, t, n) {
  var s = e.reactions;
  if (s !== null)
    for (var r = s.length, i = 0; i < r; i++) {
      var a = s[i], f = a.f, c = (f & ue) === 0;
      if (c && X(a, t), (f & ws) !== 0)
        Es.add(
          /** @type {Effect} */
          a
        );
      else if ((f & de) !== 0) {
        var u = (
          /** @type {Derived} */
          a
        );
        $e?.delete(u), (f & Zt) === 0 && (f & Be && (D === null || (D.f & xs) === 0) && (a.f |= Zt), ki(u, ot, n));
      } else if (c) {
        var h = (
          /** @type {Effect} */
          a
        );
        (f & Ke) !== 0 && vt !== null && vt.add(h), n !== null ? n.push(h) : vr(h);
      }
    }
}
function We(e) {
  if (typeof e != "object" || e === null || vs in e)
    return e;
  const t = Jr(e);
  if (t !== xo && t !== yo)
    return e;
  var n = /* @__PURE__ */ new Map(), s = $r(e), r = /* @__PURE__ */ M(0), i = Xt, a = (f) => {
    if (Xt === i)
      return f();
    var c = N, u = Xt;
    qe(null), Ur(i);
    var h = f();
    return qe(c), Ur(u), h;
  };
  return s && n.set("length", /* @__PURE__ */ M(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, c, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && Oo();
        var h = n.get(c);
        return h === void 0 ? a(() => {
          var p = /* @__PURE__ */ M(u.value);
          return n.set(c, p), p;
        }) : g(h, u.value, !0), !0;
      },
      deleteProperty(f, c) {
        var u = n.get(c);
        if (u === void 0) {
          if (c in f) {
            const h = a(() => /* @__PURE__ */ M(ie));
            n.set(c, h), Jn(r);
          }
        } else
          g(u, ie), Jn(r);
        return !0;
      },
      get(f, c, u) {
        if (c === vs)
          return e;
        var h = n.get(c), p = c in f;
        if (h === void 0 && (!p || Kn(f, c)?.writable) && (h = a(() => {
          var m = We(p ? f[c] : ie), _ = /* @__PURE__ */ M(m);
          return _;
        }), n.set(c, h)), h !== void 0) {
          var v = o(h);
          return v === ie ? void 0 : v;
        }
        return Reflect.get(f, c, u);
      },
      getOwnPropertyDescriptor(f, c) {
        var u = Reflect.getOwnPropertyDescriptor(f, c);
        if (u && "value" in u) {
          var h = n.get(c);
          h && (u.value = o(h));
        } else if (u === void 0) {
          var p = n.get(c), v = p?.v;
          if (p !== void 0 && v !== ie)
            return {
              enumerable: !0,
              configurable: !0,
              value: v,
              writable: !0
            };
        }
        return u;
      },
      has(f, c) {
        if (c === vs)
          return !0;
        var u = n.get(c), h = u !== void 0 && u.v !== ie || Reflect.has(f, c);
        if (u !== void 0 || D !== null && (!h || Kn(f, c)?.writable)) {
          u === void 0 && (u = a(() => {
            var v = h ? We(f[c]) : ie, m = /* @__PURE__ */ M(v);
            return m;
          }), n.set(c, u));
          var p = o(u);
          if (p === ie)
            return !1;
        }
        return h;
      },
      set(f, c, u, h) {
        var p = n.get(c), v = c in f;
        if (s && c === "length")
          for (var m = u; m < /** @type {Source<number>} */
          p.v; m += 1) {
            var _ = n.get(m + "");
            _ !== void 0 ? g(_, ie) : m in f && (_ = a(() => /* @__PURE__ */ M(ie)), n.set(m + "", _));
          }
        if (p === void 0)
          (!v || Kn(f, c)?.writable) && (p = a(() => /* @__PURE__ */ M(void 0)), g(p, We(u)), n.set(c, p));
        else {
          v = p.v !== ie;
          var I = a(() => We(u));
          g(p, I);
        }
        var k = Reflect.getOwnPropertyDescriptor(f, c);
        if (k?.set && k.set.call(h, u), !v) {
          if (s && typeof c == "string") {
            var R = (
              /** @type {Source<number>} */
              n.get("length")
            ), ne = Number(c);
            Number.isInteger(ne) && ne >= R.v && g(R, ne + 1);
          }
          Jn(r);
        }
        return !0;
      },
      ownKeys(f) {
        o(r);
        var c = Reflect.ownKeys(f).filter((p) => {
          var v = n.get(p);
          return v === void 0 || v.v !== ie;
        });
        for (var [u, h] of n)
          h.v !== ie && !(u in f) && c.push(u);
        return c;
      },
      setPrototypeOf() {
        zo();
      }
    }
  );
}
var jr, wi, xi, yi;
function _a() {
  if (jr === void 0) {
    jr = window, wi = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    xi = Kn(t, "firstChild").get, yi = Kn(t, "nextSibling").get, Dr(e) && (e[Xs] = void 0, e[ps] = null, e[Zs] = void 0, e.__e = void 0), Dr(n) && (n[qn] = void 0);
  }
}
function _t(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function it(e) {
  return (
    /** @type {TemplateNode | null} */
    xi.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function ss(e) {
  return (
    /** @type {TemplateNode | null} */
    yi.call(e)
  );
}
function E(e, t) {
  return /* @__PURE__ */ it(e);
}
function zt(e, t = !1) {
  {
    var n = /* @__PURE__ */ it(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ ss(n) : n;
  }
}
function P(e, t = 1, n = !1) {
  let s = e;
  for (; t--; )
    s = /** @type {TemplateNode} */
    /* @__PURE__ */ ss(s);
  return s;
}
function ma(e) {
  e.textContent = "";
}
function Ei() {
  return !1;
}
function hr(e, t, n) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t ?? ei, e, void 0)
  );
}
let Fr = !1;
function ka() {
  Fr || (Fr = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t[hs]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function gr(e) {
  var t = N, n = D;
  qe(null), at(null);
  try {
    return e();
  } finally {
    qe(t), at(n);
  }
}
function wa(e, t, n, s = n) {
  e.addEventListener(t, () => gr(n));
  const r = (
    /** @type {any} */
    e[hs]
  );
  r ? e[hs] = () => {
    r(), s(!0);
  } : e[hs] = () => s(!0), ka();
}
function xa(e) {
  D === null && (N === null && Ro(), No()), It && Lo();
}
function ya(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function mt(e, t) {
  var n = D;
  n !== null && (n.f & we) !== 0 && (e |= we);
  var s = {
    ctx: me,
    deps: null,
    nodes: null,
    f: e | ue | Be,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: n,
    b: n && n.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  L?.register_created_effect(s);
  var r = s;
  if ((e & Tn) !== 0)
    bn !== null ? bn.push(s) : en.ensure().schedule(s);
  else if (t !== null) {
    try {
      Pn(s);
    } catch (a) {
      throw Te(s), a;
    }
    r.deps === null && r.teardown === null && r.nodes === null && r.first === r.last && // either `null`, or a singular child
    (r.f & Ln) === 0 && (r = r.first, (e & Ke) !== 0 && (e & An) !== 0 && r !== null && (r.f |= An));
  }
  if (r !== null && (r.parent = n, n !== null && ya(r, n), N !== null && (N.f & de) !== 0 && (e & Pt) === 0)) {
    var i = (
      /** @type {Derived} */
      N
    );
    (i.effects ?? (i.effects = [])).push(r);
  }
  return s;
}
function br() {
  return N !== null && !Je;
}
function Ea(e) {
  const t = mt(Ps, null);
  return X(t, oe), t.teardown = e, t;
}
function ms(e) {
  xa();
  var t = (
    /** @type {Effect} */
    D.f
  ), n = !N && (t & Xe) !== 0 && me !== null && !me.i;
  if (n) {
    var s = (
      /** @type {ComponentContext} */
      me
    );
    (s.e ?? (s.e = [])).push(e);
  } else
    return Si(e);
}
function Si(e) {
  return mt(Tn | Ao, e);
}
function Sa(e) {
  en.ensure();
  const t = mt(Pt | Ln, e);
  return (n = {}) => new Promise((s) => {
    n.outro ? Qt(t, () => {
      Te(t), s(void 0);
    }) : (Te(t), s(void 0));
  });
}
function Ti(e) {
  return mt(Tn, e);
}
function Ta(e) {
  return mt(_n | Ln, e);
}
function _r(e, t = 0) {
  return mt(Ps | t, e);
}
function _e(e, t = [], n = [], s = []) {
  fa(s, t, n, (r) => {
    mt(Ps, () => e(...r.map(o)));
  });
}
function mr(e, t = 0) {
  var n = mt(Ke | t, e);
  return n;
}
function Ue(e) {
  return mt(Xe | Ln, e);
}
function Ai(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = It, s = N;
    Hr(!0), qe(null);
    try {
      t.call(null);
    } finally {
      Hr(n), qe(s);
    }
  }
}
function kr(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const r = n.ac;
    r !== null && gr(() => {
      r.abort(Is);
    });
    var s = n.next;
    (n.f & Pt) !== 0 ? n.parent = null : Te(n, t), n = s;
  }
}
function Aa(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Xe) === 0 && Te(t), t = n;
  }
}
function Te(e, t = !0) {
  var n = !1;
  (t || (e.f & To) !== 0) && e.nodes !== null && e.nodes.end !== null && (Ci(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), X(e, Qs), kr(e, t && !n), Qn(e, 0);
  var s = e.nodes && e.nodes.t;
  if (s !== null)
    for (const i of s)
      i.stop();
  Ai(e), e.f ^= Qs, e.f |= Qe;
  var r = e.parent;
  r !== null && r.first !== null && Mi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Ci(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ ss(e);
    e.remove(), e = n;
  }
}
function Mi(e) {
  var t = e.parent, n = e.prev, s = e.next;
  n !== null && (n.next = s), s !== null && (s.prev = n), t !== null && (t.first === e && (t.first = s), t.last === e && (t.last = n));
}
function Qt(e, t, n = !0) {
  var s = [];
  Pi(e, s, !0);
  var r = () => {
    n && Te(e), t && t();
  }, i = s.length;
  if (i > 0) {
    var a = () => --i || r();
    for (var f of s)
      f.out(a);
  } else
    r();
}
function Pi(e, t, n) {
  if ((e.f & we) === 0) {
    e.f ^= we;
    var s = e.nodes && e.nodes.t;
    if (s !== null)
      for (const f of s)
        (f.is_global || n) && t.push(f);
    for (var r = e.first; r !== null; ) {
      var i = r.next;
      if ((r.f & Pt) === 0) {
        var a = (r.f & An) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (r.f & Xe) !== 0 && (e.f & Ke) !== 0;
        Pi(r, t, a ? n : !1);
      }
      r = i;
    }
  }
}
function Ss(e) {
  Ii(e, !0);
}
function Ii(e, t) {
  if ((e.f & we) !== 0) {
    e.f ^= we, (e.f & oe) === 0 && (X(e, ue), en.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var s = n.next, r = (n.f & An) !== 0 || (n.f & Xe) !== 0;
      Ii(n, r ? t : !1), n = s;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const a of i)
        (a.is_global || t) && a.in();
  }
}
function wr(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, s = e.nodes.end; n !== null; ) {
      var r = n === s ? null : /* @__PURE__ */ ss(n);
      t.append(n), n = r;
    }
}
let ks = !1, It = !1;
function Hr(e) {
  It = e;
}
let N = null, Je = !1;
function qe(e) {
  N = e;
}
let D = null;
function at(e) {
  D = e;
}
let Ve = null;
function Ca(e) {
  N !== null && (Ve === null ? Ve = [e] : Ve.push(e));
}
let Se = null, Le = 0, ze = null;
function Ma(e) {
  ze = e;
}
let Li = 1, Ht = 0, Xt = Ht;
function Ur(e) {
  Xt = e;
}
function Ni() {
  return ++Li;
}
function rs(e) {
  var t = e.f;
  if ((t & ue) !== 0)
    return !0;
  if (t & de && (e.f &= ~Zt), (t & ot) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), s = n.length, r = 0; r < s; r++) {
      var i = n[r];
      if (rs(
        /** @type {Derived} */
        i
      ) && bi(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & Be) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    $e === null && X(e, oe);
  }
  return !1;
}
function Ri(e, t, n = !0) {
  var s = e.reactions;
  if (s !== null && !(Ve !== null && Kt.call(Ve, e)))
    for (var r = 0; r < s.length; r++) {
      var i = s[r];
      (i.f & de) !== 0 ? Ri(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? X(i, ue) : (i.f & oe) !== 0 && X(i, ot), vr(
        /** @type {Effect} */
        i
      ));
    }
}
function Di(e) {
  var I;
  var t = Se, n = Le, s = ze, r = N, i = Ve, a = me, f = Je, c = Xt, u = e.f;
  Se = /** @type {null | Value[]} */
  null, Le = 0, ze = null, N = (u & (Xe | Pt)) === 0 ? e : null, Ve = null, Cn(e.ctx), Je = !1, Xt = ++Ht, e.ac !== null && (gr(() => {
    e.ac.abort(Is);
  }), e.ac = null);
  try {
    e.f |= xs;
    var h = (
      /** @type {Function} */
      e.fn
    ), p = h();
    e.f |= In;
    var v = e.deps, m = L?.is_fork;
    if (Se !== null) {
      var _;
      if (m || Qn(e, Le), v !== null && Le > 0)
        for (v.length = Le + Se.length, _ = 0; _ < Se.length; _++)
          v[Le + _] = Se[_];
      else
        e.deps = v = Se;
      if (br() && (e.f & Be) !== 0)
        for (_ = Le; _ < v.length; _++)
          ((I = v[_]).reactions ?? (I.reactions = [])).push(e);
    } else !m && v !== null && Le < v.length && (Qn(e, Le), v.length = Le);
    if (ii() && ze !== null && !Je && v !== null && (e.f & (de | ot | ue)) === 0)
      for (_ = 0; _ < /** @type {Source[]} */
      ze.length; _++)
        Ri(
          ze[_],
          /** @type {Effect} */
          e
        );
    if (r !== null && r !== e) {
      if (Ht++, r.deps !== null)
        for (let k = 0; k < n; k += 1)
          r.deps[k].rv = Ht;
      if (t !== null)
        for (const k of t)
          k.rv = Ht;
      ze !== null && (s === null ? s = ze : s.push(.../** @type {Source[]} */
      ze));
    }
    return (e.f & Mt) !== 0 && (e.f ^= Mt), p;
  } catch (k) {
    return ai(k);
  } finally {
    e.f ^= xs, Se = t, Le = n, ze = s, N = r, Ve = i, Cn(a), Je = f, Xt = c;
  }
}
function Pa(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var s = mo.call(n, e);
    if (s !== -1) {
      var r = n.length - 1;
      r === 0 ? n = t.reactions = null : (n[s] = n[r], n.pop());
    }
  }
  if (n === null && (t.f & de) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Se === null || !Kt.call(Se, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & Be) !== 0 && (i.f ^= Be, i.f &= ~Zt), i.v !== ie && ur(i), ha(i), Qn(i, 0);
  }
}
function Qn(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var s = t; s < n.length; s++)
      Pa(e, n[s]);
}
function Pn(e) {
  var t = e.f;
  if ((t & Qe) === 0) {
    X(e, oe);
    var n = D, s = ks;
    D = e, ks = !0;
    try {
      (t & (Ke | Xr)) !== 0 ? Aa(e) : kr(e), Ai(e);
      var r = Di(e);
      e.teardown = typeof r == "function" ? r : null, e.wv = Li;
      var i;
    } finally {
      ks = s, D = n;
    }
  }
}
async function gn() {
  await Promise.resolve(), ta();
}
function o(e) {
  var t = e.f, n = (t & de) !== 0;
  if (N !== null && !Je) {
    var s = D !== null && (D.f & Qe) !== 0;
    if (!s && (Ve === null || !Kt.call(Ve, e))) {
      var r = N.deps;
      if ((N.f & xs) !== 0)
        e.rv < Ht && (e.rv = Ht, Se === null && r !== null && r[Le] === e ? Le++ : Se === null ? Se = [e] : Se.push(e));
      else {
        N.deps ?? (N.deps = []), Kt.call(N.deps, e) || N.deps.push(e);
        var i = e.reactions;
        i === null ? e.reactions = [N] : Kt.call(i, N) || i.push(N);
      }
    }
  }
  if (It && Jt.has(e))
    return Jt.get(e);
  if (n) {
    var a = (
      /** @type {Derived} */
      e
    );
    if (It) {
      var f = a.v;
      return ((a.f & oe) === 0 && a.reactions !== null || zi(a)) && (f = pr(a)), Jt.set(a, f), f;
    }
    var c = (a.f & Be) === 0 && !Je && N !== null && (ks || (N.f & Be) !== 0), u = (a.f & In) === 0;
    rs(a) && (c && (a.f |= Be), bi(a)), c && !u && (_i(a), Oi(a));
  }
  if ($e?.has(e))
    return $e.get(e);
  if ((e.f & Mt) !== 0)
    throw e.v;
  return e.v;
}
function Oi(e) {
  if (e.f |= Be, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & de) !== 0 && (t.f & Be) === 0 && (_i(
        /** @type {Derived} */
        t
      ), Oi(
        /** @type {Derived} */
        t
      ));
}
function zi(e) {
  if (e.v === ie) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Jt.has(t) || (t.f & de) !== 0 && zi(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ls(e) {
  var t = Je;
  try {
    return Je = !0, e();
  } finally {
    Je = t;
  }
}
const Ia = ["touchstart", "touchmove"];
function La(e) {
  return Ia.includes(e);
}
const Ut = Symbol("events"), ji = /* @__PURE__ */ new Set(), ar = /* @__PURE__ */ new Set();
function te(e, t, n) {
  (t[Ut] ?? (t[Ut] = {}))[e] = n;
}
function Na(e) {
  for (var t = 0; t < e.length; t++)
    ji.add(e[t]);
  for (var n of ar)
    n(e);
}
let Br = null;
function Vr(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), s = e.type, r = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    r[0] || e.target
  );
  Br = e;
  var a = 0, f = Br === e && e[Ut];
  if (f) {
    var c = r.indexOf(f);
    if (c !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Ut] = t;
      return;
    }
    var u = r.indexOf(t);
    if (u === -1)
      return;
    c <= u && (a = c);
  }
  if (i = /** @type {Element} */
  r[a] || e.target, i !== t) {
    ko(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var h = N, p = D;
    qe(null), at(null);
    try {
      for (var v, m = []; i !== null && i !== t; ) {
        try {
          var _ = i[Ut]?.[s];
          _ != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i) && _.call(i, e);
        } catch (I) {
          v ? m.push(I) : v = I;
        }
        if (e.cancelBubble) break;
        a++, i = a < r.length ? (
          /** @type {Element} */
          r[a]
        ) : null;
      }
      if (v) {
        for (let I of m)
          queueMicrotask(() => {
            throw I;
          });
        throw v;
      }
    } finally {
      e[Ut] = t, delete e.currentTarget, qe(h), at(p);
    }
  }
}
const Ra = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Da(e) {
  return (
    /** @type {string} */
    Ra?.createHTML(e) ?? e
  );
}
function Fi(e) {
  var t = hr("template");
  return t.innerHTML = Da(e.replaceAll("<!>", "<!---->")), t.content;
}
function nn(e, t) {
  var n = (
    /** @type {Effect} */
    D
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function O(e, t) {
  var n = (t & qo) !== 0, s = (t & Yo) !== 0, r, i = !e.startsWith("<!>");
  return () => {
    r === void 0 && (r = Fi(i ? e : "<!>" + e), n || (r = /** @type {TemplateNode} */
    /* @__PURE__ */ it(r)));
    var a = (
      /** @type {TemplateNode} */
      s || wi ? document.importNode(r, !0) : r.cloneNode(!0)
    );
    if (n) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ it(a)
      ), c = (
        /** @type {TemplateNode} */
        a.lastChild
      );
      nn(f, c);
    } else
      nn(a, a);
    return a;
  };
}
// @__NO_SIDE_EFFECTS__
function Oa(e, t, n = "svg") {
  var s = !e.startsWith("<!>"), r = `<${n}>${s ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var a = (
        /** @type {DocumentFragment} */
        Fi(r)
      ), f = (
        /** @type {Element} */
        /* @__PURE__ */ it(a)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ it(f);
    }
    var c = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return nn(c, c), c;
  };
}
// @__NO_SIDE_EFFECTS__
function Nn(e, t) {
  return /* @__PURE__ */ Oa(e, t, "svg");
}
function un(e = "") {
  {
    var t = _t(e + "");
    return nn(t, t), t;
  }
}
function dn() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = _t();
  return e.append(t, n), nn(t, n), e;
}
function S(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function be(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== /** @type {any} */
  (e[qn] ?? (e[qn] = e.nodeValue)) && (e[qn] = n, e.nodeValue = `${n}`);
}
function za(e, t) {
  return ja(e, t);
}
const us = /* @__PURE__ */ new Map();
function ja(e, { target: t, anchor: n, props: s = {}, events: r, context: i, intro: a = !0, transformError: f }) {
  _a();
  var c = void 0, u = Sa(() => {
    var h = n ?? t.appendChild(_t());
    ia(
      /** @type {TemplateNode} */
      h,
      {
        pending: () => {
        }
      },
      (m) => {
        si({});
        var _ = (
          /** @type {ComponentContext} */
          me
        );
        i && (_.c = i), r && (s.$$events = r), c = e(m, s) || {}, ri();
      },
      f
    );
    var p = /* @__PURE__ */ new Set(), v = (m) => {
      for (var _ = 0; _ < m.length; _++) {
        var I = m[_];
        if (!p.has(I)) {
          p.add(I);
          var k = La(I);
          for (const K of [t, document]) {
            var R = us.get(K);
            R === void 0 && (R = /* @__PURE__ */ new Map(), us.set(K, R));
            var ne = R.get(I);
            ne === void 0 ? (K.addEventListener(I, Vr, { passive: k }), R.set(I, 1)) : R.set(I, ne + 1);
          }
        }
      }
    };
    return v(Ms(ji)), ar.add(v), () => {
      for (var m of p)
        for (const k of [t, document]) {
          var _ = (
            /** @type {Map<string, number>} */
            us.get(k)
          ), I = (
            /** @type {number} */
            _.get(m)
          );
          --I == 0 ? (k.removeEventListener(m, Vr), _.delete(m), _.size === 0 && us.delete(k)) : _.set(m, I);
        }
      ar.delete(v), h !== n && h.parentNode?.removeChild(h);
    };
  });
  return lr.set(c, u), c;
}
let lr = /* @__PURE__ */ new WeakMap();
function Fa(e, t) {
  const n = lr.get(e);
  return n ? (lr.delete(e), n(t)) : Promise.resolve();
}
var Ge, st, Re, Wt, ts, ns, Cs;
class Ha {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Ie(this, "anchor");
    /** @type {Map<Batch, Key>} */
    A(this, Ge, /* @__PURE__ */ new Map());
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
    A(this, st, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    A(this, Re, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    A(this, Wt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    A(this, ts, !0);
    /**
     * @param {Batch} batch
     */
    A(this, ns, (t) => {
      if (l(this, Ge).has(t)) {
        var n = (
          /** @type {Key} */
          l(this, Ge).get(t)
        ), s = l(this, st).get(n);
        if (s)
          Ss(s), l(this, Wt).delete(n);
        else {
          var r = l(this, Re).get(n);
          r && (Ss(r.effect), l(this, st).set(n, r.effect), l(this, Re).delete(n), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), s = r.effect);
        }
        for (const [i, a] of l(this, Ge)) {
          if (l(this, Ge).delete(i), i === t)
            break;
          const f = l(this, Re).get(a);
          f && (Te(f.effect), l(this, Re).delete(a));
        }
        for (const [i, a] of l(this, st)) {
          if (i === n || l(this, Wt).has(i)) continue;
          const f = () => {
            if (Array.from(l(this, Ge).values()).includes(i)) {
              var u = document.createDocumentFragment();
              wr(a, u), u.append(_t()), l(this, Re).set(i, { effect: a, fragment: u });
            } else
              Te(a);
            l(this, Wt).delete(i), l(this, st).delete(i);
          };
          l(this, ts) || !s ? (l(this, Wt).add(i), Qt(a, f, !1)) : f();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    A(this, Cs, (t) => {
      l(this, Ge).delete(t);
      const n = Array.from(l(this, Ge).values());
      for (const [s, r] of l(this, Re))
        n.includes(s) || (Te(r.effect), l(this, Re).delete(s));
    });
    this.anchor = t, T(this, ts, n);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var s = (
      /** @type {Batch} */
      L
    ), r = Ei();
    if (n && !l(this, st).has(t) && !l(this, Re).has(t))
      if (r) {
        var i = document.createDocumentFragment(), a = _t();
        i.append(a), l(this, Re).set(t, {
          effect: Ue(() => n(a)),
          fragment: i
        });
      } else
        l(this, st).set(
          t,
          Ue(() => n(this.anchor))
        );
    if (l(this, Ge).set(s, t), r) {
      for (const [f, c] of l(this, st))
        f === t ? s.unskip_effect(c) : s.skip_effect(c);
      for (const [f, c] of l(this, Re))
        f === t ? s.unskip_effect(c.effect) : s.skip_effect(c.effect);
      s.oncommit(l(this, ns)), s.ondiscard(l(this, Cs));
    } else
      l(this, ns).call(this, s);
  }
}
Ge = new WeakMap(), st = new WeakMap(), Re = new WeakMap(), Wt = new WeakMap(), ts = new WeakMap(), ns = new WeakMap(), Cs = new WeakMap();
function q(e, t, n = !1) {
  var s = new Ha(e), r = n ? An : 0;
  function i(a, f) {
    s.ensure(a, f);
  }
  mr(() => {
    var a = !1;
    t((f, c = 0) => {
      a = !0, i(c, f);
    }), a || i(-1, null);
  }, r);
}
function vn(e, t) {
  return t;
}
function Ua(e, t, n) {
  for (var s = [], r = t.length, i, a = t.length, f = 0; f < r; f++) {
    let p = t[f];
    Qt(
      p,
      () => {
        if (i) {
          if (i.pending.delete(p), i.done.add(p), i.pending.size === 0) {
            var v = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            cr(e, Ms(i.done)), v.delete(i), v.size === 0 && (e.outrogroups = null);
          }
        } else
          a -= 1;
      },
      !1
    );
  }
  if (a === 0) {
    var c = s.length === 0 && n !== null;
    if (c) {
      var u = (
        /** @type {Element} */
        n
      ), h = (
        /** @type {Element} */
        u.parentNode
      );
      ma(h), h.append(u), e.items.clear();
    }
    cr(e, t, !c);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function cr(e, t, n = !0) {
  var s;
  if (e.pending.size > 0) {
    s = /* @__PURE__ */ new Set();
    for (const a of e.pending.values())
      for (const f of a)
        s.add(
          /** @type {EachItem} */
          e.items.get(f).e
        );
  }
  for (var r = 0; r < t.length; r++) {
    var i = t[r];
    if (s?.has(i)) {
      i.f |= rt;
      const a = document.createDocumentFragment();
      wr(i, a);
    } else
      Te(t[r], n);
  }
}
var qr;
function pn(e, t, n, s, r, i = null) {
  var a = e, f = /* @__PURE__ */ new Map(), c = (t & Zr) !== 0;
  if (c) {
    var u = (
      /** @type {Element} */
      e
    );
    a = u.appendChild(_t());
  }
  var h = null, p = /* @__PURE__ */ va(() => {
    var K = n();
    return $r(K) ? K : K == null ? [] : Ms(K);
  }), v, m = /* @__PURE__ */ new Map(), _ = !0;
  function I(K) {
    (ne.effect.f & Qe) === 0 && (ne.pending.delete(K), ne.fallback = h, Ba(ne, v, a, t, s), h !== null && (v.length === 0 ? (h.f & rt) === 0 ? Ss(h) : (h.f ^= rt, Wn(h, null, a)) : Qt(h, () => {
      h = null;
    })));
  }
  function k(K) {
    ne.pending.delete(K);
  }
  var R = mr(() => {
    v = /** @type {V[]} */
    o(p);
    for (var K = v.length, ae = /* @__PURE__ */ new Set(), ee = (
      /** @type {Batch} */
      L
    ), le = Ei(), ve = 0; ve < K; ve += 1) {
      var Ze = v[ve], lt = s(Ze, ve), Y = _ ? null : f.get(lt);
      Y ? (Y.v && Mn(Y.v, Ze), Y.i && Mn(Y.i, ve), le && ee.unskip_effect(Y.e)) : (Y = Va(
        f,
        _ ? a : qr ?? (qr = _t()),
        Ze,
        lt,
        ve,
        r,
        t,
        n
      ), _ || (Y.e.f |= rt), f.set(lt, Y)), ae.add(lt);
    }
    if (K === 0 && i && !h && (_ ? h = Ue(() => i(a)) : (h = Ue(() => i(qr ?? (qr = _t()))), h.f |= rt)), K > ae.size && Io(), !_)
      if (m.set(ee, ae), le) {
        for (const [De, et] of f)
          ae.has(De) || ee.skip_effect(et.e);
        ee.oncommit(I), ee.ondiscard(k);
      } else
        I(ee);
    o(p);
  }), ne = { effect: R, items: f, pending: m, outrogroups: null, fallback: h };
  _ = !1;
}
function Vn(e) {
  for (; e !== null && (e.f & Xe) === 0; )
    e = e.next;
  return e;
}
function Ba(e, t, n, s, r) {
  var i = (s & Bo) !== 0, a = t.length, f = e.items, c = Vn(e.effect.first), u, h = null, p, v = [], m = [], _, I, k, R;
  if (i)
    for (R = 0; R < a; R += 1)
      _ = t[R], I = r(_, R), k = /** @type {EachItem} */
      f.get(I).e, (k.f & rt) === 0 && (k.nodes?.a?.measure(), (p ?? (p = /* @__PURE__ */ new Set())).add(k));
  for (R = 0; R < a; R += 1) {
    if (_ = t[R], I = r(_, R), k = /** @type {EachItem} */
    f.get(I).e, e.outrogroups !== null)
      for (const Y of e.outrogroups)
        Y.pending.delete(k), Y.done.delete(k);
    if ((k.f & we) !== 0 && (Ss(k), i && (k.nodes?.a?.unfix(), (p ?? (p = /* @__PURE__ */ new Set())).delete(k))), (k.f & rt) !== 0)
      if (k.f ^= rt, k === c)
        Wn(k, null, n);
      else {
        var ne = h ? h.next : c;
        k === e.effect.last && (e.effect.last = k.prev), k.prev && (k.prev.next = k.next), k.next && (k.next.prev = k.prev), St(e, h, k), St(e, k, ne), Wn(k, ne, n), h = k, v = [], m = [], c = Vn(h.next);
        continue;
      }
    if (k !== c) {
      if (u !== void 0 && u.has(k)) {
        if (v.length < m.length) {
          var K = m[0], ae;
          h = K.prev;
          var ee = v[0], le = v[v.length - 1];
          for (ae = 0; ae < v.length; ae += 1)
            Wn(v[ae], K, n);
          for (ae = 0; ae < m.length; ae += 1)
            u.delete(m[ae]);
          St(e, ee.prev, le.next), St(e, h, ee), St(e, le, K), c = K, h = le, R -= 1, v = [], m = [];
        } else
          u.delete(k), Wn(k, c, n), St(e, k.prev, k.next), St(e, k, h === null ? e.effect.first : h.next), St(e, h, k), h = k;
        continue;
      }
      for (v = [], m = []; c !== null && c !== k; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(c), m.push(c), c = Vn(c.next);
      if (c === null)
        continue;
    }
    (k.f & rt) === 0 && v.push(k), h = k, c = Vn(k.next);
  }
  if (e.outrogroups !== null) {
    for (const Y of e.outrogroups)
      Y.pending.size === 0 && (cr(e, Ms(Y.done)), e.outrogroups?.delete(Y));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (c !== null || u !== void 0) {
    var ve = [];
    if (u !== void 0)
      for (k of u)
        (k.f & we) === 0 && ve.push(k);
    for (; c !== null; )
      (c.f & we) === 0 && c !== e.fallback && ve.push(c), c = Vn(c.next);
    var Ze = ve.length;
    if (Ze > 0) {
      var lt = (s & Zr) !== 0 && a === 0 ? n : null;
      if (i) {
        for (R = 0; R < Ze; R += 1)
          ve[R].nodes?.a?.measure();
        for (R = 0; R < Ze; R += 1)
          ve[R].nodes?.a?.fix();
      }
      Ua(e, ve, lt);
    }
  }
  i && $t(() => {
    if (p !== void 0)
      for (k of p)
        k.nodes?.a?.apply();
  });
}
function Va(e, t, n, s, r, i, a, f) {
  var c = (a & Ho) !== 0 ? (a & Vo) === 0 ? /* @__PURE__ */ ga(n, !1, !1) : tn(n) : null, u = (a & Uo) !== 0 ? tn(r) : null;
  return {
    v: c,
    i: u,
    e: Ue(() => (i(t, c ?? n, u ?? r, f), () => {
      e.delete(s);
    }))
  };
}
function Wn(e, t, n) {
  if (e.nodes)
    for (var s = e.nodes.start, r = e.nodes.end, i = t && (t.f & rt) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; s !== null; ) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ ss(s)
      );
      if (i.before(s), s === r)
        return;
      s = a;
    }
}
function St(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function qa(e, t, n = !1, s = !1, r = !1, i = !1) {
  var a = e, f = "";
  if (n)
    var c = (
      /** @type {Element} */
      e
    );
  _e(() => {
    var u = (
      /** @type {Effect} */
      D
    );
    if (f !== (f = t() ?? "")) {
      if (n) {
        u.nodes = null, c.innerHTML = /** @type {string} */
        f, f !== "" && nn(
          /** @type {TemplateNode} */
          /* @__PURE__ */ it(c),
          /** @type {TemplateNode} */
          c.lastChild
        );
        return;
      }
      if (u.nodes !== null && (Ci(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), f !== "") {
        var h = s ? Go : r ? Wo : void 0, p = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          hr(s ? "svg" : r ? "math" : "template", h)
        );
        p.innerHTML = /** @type {any} */
        f;
        var v = s || r ? p : (
          /** @type {HTMLTemplateElement} */
          p.content
        );
        if (nn(
          /** @type {TemplateNode} */
          /* @__PURE__ */ it(v),
          /** @type {TemplateNode} */
          v.lastChild
        ), s || r)
          for (; /* @__PURE__ */ it(v); )
            a.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ it(v)
            );
        else
          a.before(v);
      }
    }
  });
}
function Ya(e, t) {
  Ti(() => {
    var n = e.getRootNode(), s = (
      /** @type {ShadowRoot} */
      n.host ? (
        /** @type {ShadowRoot} */
        n
      ) : (
        /** @type {Document} */
        n.head ?? /** @type {Document} */
        n.ownerDocument.head
      )
    );
    if (!s.querySelector("#" + t.hash)) {
      const r = hr("style");
      r.id = t.hash, r.textContent = t.code, s.appendChild(r);
    }
  });
}
const Yr = [...` 	
\r\f \v\uFEFF`];
function Ga(e, t, n) {
  var s = e == null ? "" : "" + e;
  if (t && (s = s ? s + " " + t : t), n) {
    for (var r of Object.keys(n))
      if (n[r])
        s = s ? s + " " + r : r;
      else if (s.length)
        for (var i = r.length, a = 0; (a = s.indexOf(r, a)) >= 0; ) {
          var f = a + i;
          (a === 0 || Yr.includes(s[a - 1])) && (f === s.length || Yr.includes(s[f])) ? s = (a === 0 ? "" : s.substring(0, a)) + s.substring(f + 1) : a = f;
        }
  }
  return s === "" ? null : s;
}
function Wa(e, t) {
  return e == null ? null : String(e);
}
function jt(e, t, n, s, r, i) {
  var a = (
    /** @type {any} */
    e[Xs]
  );
  if (a !== n || a === void 0) {
    var f = Ga(n, s, i);
    f == null ? e.removeAttribute("class") : e.className = f, e[Xs] = n;
  } else if (i && r !== i)
    for (var c in i) {
      var u = !!i[c];
      (r == null || u !== !!r[c]) && e.classList.toggle(c, u);
    }
  return i;
}
function Gr(e, t, n, s) {
  var r = (
    /** @type {any} */
    e[Zs]
  );
  if (r !== t) {
    var i = Wa(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e[Zs] = t;
  }
  return s;
}
const Ka = Symbol("is custom element"), $a = Symbol("is html");
function ds(e, t, n, s) {
  var r = Ja(e);
  r[t] !== (r[t] = n) && (t === "loading" && (e[Co] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Qa(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Ja(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[ps] ?? (e[ps] = {
      [Ka]: e.nodeName.includes("-"),
      [$a]: e.namespaceURI === ei
    })
  );
}
var Wr = /* @__PURE__ */ new Map();
function Qa(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Wr.get(t);
  if (n) return n;
  Wr.set(t, n = []);
  for (var s, r = e, i = Element.prototype; i !== r; ) {
    s = wo(r);
    for (var a in s)
      s[a].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      a !== "innerHTML" && a !== "textContent" && a !== "innerText" && n.push(a);
    r = Jr(r);
  }
  return n;
}
function Xa(e, t, n = t) {
  var s = /* @__PURE__ */ new WeakSet();
  wa(e, "input", async (r) => {
    var i = r ? e.defaultValue : e.value;
    if (i = Gs(e) ? Ws(i) : i, n(i), L !== null && s.add(L), await gn(), i !== (i = t())) {
      var a = e.selectionStart, f = e.selectionEnd, c = e.value.length;
      if (e.value = i ?? "", f !== null) {
        var u = e.value.length;
        a === f && f === c && u > c ? (e.selectionStart = u, e.selectionEnd = u) : (e.selectionStart = a, e.selectionEnd = Math.min(f, u));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ls(t) == null && e.value && (n(Gs(e) ? Ws(e.value) : e.value), L !== null && s.add(L)), _r(() => {
    var r = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        L
      );
      if (s.has(i))
        return;
    }
    Gs(e) && r === Ws(e.value) || e.type === "date" && !r && !e.value || r !== e.value && (e.value = r ?? "");
  });
}
function Gs(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function Ws(e) {
  return e === "" ? null : +e;
}
function Ks(e, t) {
  return e === t || e?.[vs] === t;
}
function $s(e = {}, t, n, s) {
  var r = (
    /** @type {ComponentContext} */
    me.r
  ), i = (
    /** @type {Effect} */
    D
  );
  return Ti(() => {
    var a, f;
    return _r(() => {
      a = f, f = [], Ls(() => {
        Ks(n(...f), e) || (t(e, ...f), a && Ks(n(...a), e) && t(null, ...a));
      });
    }), () => {
      let c = i;
      for (; c !== r && c.parent !== null && c.parent.f & Qs; )
        c = c.parent;
      const u = () => {
        f && Ks(n(...f), e) && t(null, ...f);
      }, h = c.teardown;
      c.teardown = () => {
        u(), h?.();
      };
    };
  }), e;
}
function Za(e) {
  me === null && Mo(), ms(() => {
    const t = Ls(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const el = "5";
var Kr;
typeof window < "u" && ((Kr = window.__svelte ?? (window.__svelte = {})).v ?? (Kr.v = /* @__PURE__ */ new Set())).add(el);
const tl = "Ask questions about your realm — its governance, proposals, rules, and more — and get answers from an AI assistant in chat.";
var nl = /* @__PURE__ */ O('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), sl = /* @__PURE__ */ O('<div class="settings-assistant-grid svelte-beco3k"></div>'), rl = /* @__PURE__ */ O('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), il = /* @__PURE__ */ O('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), ol = /* @__PURE__ */ O('<div class="settings-history-list svelte-beco3k"></div>'), al = /* @__PURE__ */ O('<p class="settings-section-desc svelte-beco3k"> </p>'), ll = /* @__PURE__ */ O('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), cl = /* @__PURE__ */ O(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <p class="settings-page-desc svelte-beco3k"> </p> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), fl = /* @__PURE__ */ O('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), ul = /* @__PURE__ */ O('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), dl = /* @__PURE__ */ O('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), vl = /* @__PURE__ */ O('<div class="assistant-selector svelte-beco3k"></div>'), pl = /* @__PURE__ */ O('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), hl = /* @__PURE__ */ O('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), gl = /* @__PURE__ */ O('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), bl = /* @__PURE__ */ O('<div class="history-panel svelte-beco3k"><!></div>'), _l = /* @__PURE__ */ O(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), ml = /* @__PURE__ */ O(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), kl = /* @__PURE__ */ O('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), wl = /* @__PURE__ */ Nn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), xl = /* @__PURE__ */ Nn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), yl = /* @__PURE__ */ O('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), El = /* @__PURE__ */ O('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), Sl = /* @__PURE__ */ Nn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Tl = /* @__PURE__ */ Nn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), Al = /* @__PURE__ */ O('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), Cl = /* @__PURE__ */ O('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), Ml = /* @__PURE__ */ O('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), Pl = /* @__PURE__ */ O('<p class="stream-status svelte-beco3k"> </p>'), Il = /* @__PURE__ */ O('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), Ll = /* @__PURE__ */ O('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), Nl = /* @__PURE__ */ O('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), Rl = /* @__PURE__ */ O("<!> <!> <!>", 1), Dl = /* @__PURE__ */ O('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), Ol = /* @__PURE__ */ O('<button class="suggestion-chip svelte-beco3k"> </button>'), zl = /* @__PURE__ */ O('<div class="suggestions svelte-beco3k"><!></div>'), jl = /* @__PURE__ */ Nn('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Fl = /* @__PURE__ */ Nn('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Hl = /* @__PURE__ */ O('<div><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const Ul = {
  hash: "svelte-beco3k",
  code: `.llm-chat-root.svelte-beco3k {display:flex;flex-direction:column;
		/* Full-page: height via inline style + visualViewport. Sidebar: fill host panel. */max-height:100%;min-height:300px;overflow:hidden;background:transparent;
		/* Prevent the component itself from scrolling — only messages-area scrolls */overscroll-behavior:none;
		/* Flush to the top of the sidebar panel — no stray gap */margin-top:0;padding-top:0;}.llm-chat-root.sidebar-panel.svelte-beco3k {height:100%;min-height:0;flex:1;}

	/* Top toolbar */.chat-toolbar.svelte-beco3k {display:flex;gap:6px;padding:6px 14px;border-bottom:1px solid #e5e7eb;flex-shrink:0;}.toolbar-btn.svelte-beco3k {display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;color:#4b5563;font-size:13px;cursor:pointer;transition:all 0.15s ease;}.toolbar-btn.svelte-beco3k svg:where(.svelte-beco3k) {width:15px;height:15px;flex-shrink:0;}.toolbar-btn.svelte-beco3k:hover {background:#eef2ff;border-color:#c7d2fe;color:#4338ca;}.toolbar-btn.active.svelte-beco3k {background:#eef2ff;border-color:#6366f1;color:#4338ca;}

	/* History panel */.history-panel.svelte-beco3k {flex:1;min-height:0;overflow-y:auto;padding:8px 14px;display:flex;flex-direction:column;gap:4px;}.history-loading.svelte-beco3k,
	.history-empty.svelte-beco3k {padding:24px 0;text-align:center;color:#9ca3af;font-size:13px;}.history-item.svelte-beco3k {display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1px solid #f3f4f6;background:#fafafa;cursor:pointer;transition:background 0.12s ease, border-color 0.12s ease;}.history-item.svelte-beco3k:hover {background:#eef2ff;border-color:#c7d2fe;}.history-item-body.svelte-beco3k {flex:1;min-width:0;}.history-title.svelte-beco3k {font-size:13px;font-weight:500;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.history-meta.svelte-beco3k {font-size:11px;color:#9ca3af;margin-top:2px;}.history-delete.svelte-beco3k {flex-shrink:0;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;background:transparent;color:#d1d5db;cursor:pointer;border-radius:6px;padding:4px;transition:color 0.15s ease, background 0.15s ease;}.history-delete.svelte-beco3k svg:where(.svelte-beco3k) {width:14px;height:14px;}.history-delete.svelte-beco3k:hover {color:#ef4444;background:#fef2f2;}

	/* Document focus chip */.focus-chip.svelte-beco3k {display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;}.focus-chip-label.svelte-beco3k {flex:1;min-width:0;font-size:12px;color:#4b5563;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.focus-chip-btn.svelte-beco3k {flex-shrink:0;padding:4px 10px;font-size:12px;font-weight:500;border-radius:9999px;border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;cursor:pointer;}.focus-chip-btn.svelte-beco3k:hover {background:#e0e7ff;}

	/* Assistant selector */.assistant-selector.svelte-beco3k {display:flex;gap:8px;padding:10px 0;border-bottom:1px solid #e5e7eb;flex-shrink:0;overflow-x:auto;}.assistant-btn.svelte-beco3k {display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;transition:all 0.15s ease;white-space:nowrap;}.assistant-btn.svelte-beco3k:hover {background:#f3f4f6;border-color:#d1d5db;}.assistant-btn.active.svelte-beco3k {border-color:#6366f1;background:#eef2ff;color:#4338ca;}

	/* Messages area */.messages-area.svelte-beco3k {flex:1;min-height:0;overflow-y:auto;padding:8px 14px 16px;background:transparent;display:flex;flex-direction:column;gap:16px;}

	/* Welcome message */.welcome-message.svelte-beco3k {display:flex;align-items:flex-start;gap:12px;margin-top:4px;}

	/* Message rows */.message-row.svelte-beco3k {display:flex;gap:10px;max-width:100%;}.user-row.svelte-beco3k {justify-content:flex-end;}.assistant-row.svelte-beco3k {justify-content:flex-start;align-items:flex-start;}

	/* Avatar */.avatar.svelte-beco3k {flex-shrink:0;width:40px;height:40px;border-radius:50%;background:#fff;border:2px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 1px 3px rgba(0, 0, 0, 0.08);}.avatar.small.svelte-beco3k {width:32px;height:32px;font-size:16px;}

	/* User message wrapper (bubble + copy) */.user-message-wrap.svelte-beco3k {display:flex;align-items:flex-end;gap:6px;max-width:80%;}

	/* Assistant message wrapper (content + copy) */.assistant-message-wrap.svelte-beco3k {display:flex;flex-direction:column;flex:1;min-width:0;gap:4px;}

	/* Copy button */.copy-btn.svelte-beco3k {flex-shrink:0;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;background:transparent;color:#9ca3af;cursor:pointer;border-radius:6px;padding:4px;transition:color 0.15s ease, background 0.15s ease;}.copy-btn.svelte-beco3k:hover {color:#4f46e5;background:#eef2ff;}.copy-btn.svelte-beco3k svg:where(.svelte-beco3k) {width:14px;height:14px;}.copy-btn--assistant.svelte-beco3k {align-self:flex-start;margin-left:2px;}

	/* Bubbles */.bubble.svelte-beco3k {padding:10px 14px;border-radius:16px;line-height:1.5;font-size:14px;word-wrap:break-word;overflow-wrap:break-word;}.user-bubble.svelte-beco3k {background:#4f46e5;color:#fff;border-bottom-right-radius:4px;box-shadow:0 1px 3px rgba(79, 70, 229, 0.3);white-space:pre-wrap;}

	/* Assistant content — no bubble, full width */.assistant-content.svelte-beco3k {flex:1;min-width:0;line-height:1.6;font-size:14px;color:#1f2937;word-wrap:break-word;overflow-wrap:break-word;padding:2px 0;}

	/* Markdown content inside assistant messages */.markdown-content.svelte-beco3k h1,
	.markdown-content.svelte-beco3k h2,
	.markdown-content.svelte-beco3k h3 {margin-top:12px;margin-bottom:4px;font-weight:600;}.markdown-content.svelte-beco3k h1 {font-size:1.125rem;}.markdown-content.svelte-beco3k h2 {font-size:1rem;}.markdown-content.svelte-beco3k h3 {font-size:0.9375rem;}.markdown-content.svelte-beco3k li {margin-left:16px;margin-bottom:2px;}.markdown-content.svelte-beco3k pre {margin:8px 0;border-radius:6px;}.markdown-content.svelte-beco3k strong {font-weight:600;}.markdown-content.svelte-beco3k a {color:#4f46e5;text-decoration:underline;}

	/* Error banner */.error-banner.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 14px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:13px;}.error-dismiss.svelte-beco3k {background:none;border:none;font-size:18px;cursor:pointer;color:#991b1b;padding:0 4px;line-height:1;opacity:0.7;}.error-dismiss.svelte-beco3k:hover {opacity:1;}.explain-wait.svelte-beco3k {margin:0 0 6px;font-size:12px;color:#6b7280;}.stream-status.svelte-beco3k {margin:0;font-size:13px;color:#4b5563;font-style:italic;
		animation: svelte-beco3k-status-pulse 1.6s ease-in-out infinite;}

	@keyframes svelte-beco3k-status-pulse {
		0%, 100% { opacity: 0.55; }
		50% { opacity: 1; }
	}.thinking-block.svelte-beco3k {margin:0 0 10px;padding:8px 10px;border-radius:8px;background:#f5f3ff;border:1px solid #ddd6fe;font-size:12px;}.thinking-block.svelte-beco3k summary:where(.svelte-beco3k) {cursor:pointer;font-weight:600;color:#6d28d9;user-select:none;list-style:none;}.thinking-block.svelte-beco3k summary:where(.svelte-beco3k)::-webkit-details-marker {display:none;}.thinking-block.svelte-beco3k summary:where(.svelte-beco3k)::before {content:'▸ ';display:inline-block;transition:transform 0.15s ease;}.thinking-block[open].svelte-beco3k summary:where(.svelte-beco3k)::before {transform:rotate(90deg);}.thinking-text.svelte-beco3k {margin-top:8px;color:#4c1d95;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow-y:auto;}

	/* Typing animation */.typing-animation.svelte-beco3k {display:flex;align-items:center;gap:4px;padding:4px 0;}.typing-animation.svelte-beco3k span:where(.svelte-beco3k) {width:7px;height:7px;background-color:#9ca3af;border-radius:50%;
		animation: svelte-beco3k-typing 1.4s infinite ease-in-out;}.typing-animation.svelte-beco3k span:where(.svelte-beco3k):nth-child(1) {animation-delay:0s;}.typing-animation.svelte-beco3k span:where(.svelte-beco3k):nth-child(2) {animation-delay:0.2s;}.typing-animation.svelte-beco3k span:where(.svelte-beco3k):nth-child(3) {animation-delay:0.4s;}

	@keyframes svelte-beco3k-typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.4;
		}
		30% {
			transform: translateY(-6px);
			opacity: 1;
		}
	}

	/* Input section */.input-section.svelte-beco3k {flex-shrink:0;padding:10px 14px;padding-bottom:max(10px, env(safe-area-inset-bottom, 0px));border-top:1px solid #e5e7eb;background:#fff;}.suggestions.svelte-beco3k {display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;justify-content:center;}.suggestion-loading.svelte-beco3k {font-size:12px;color:#9ca3af;}.suggestion-chip.svelte-beco3k {padding:5px 12px;font-size:12px;border-radius:16px;border:1px solid #e5e7eb;background:#f9fafb;color:#4b5563;cursor:pointer;transition:all 0.15s ease;white-space:nowrap;}.suggestion-chip.svelte-beco3k:hover {background:#eef2ff;border-color:#c7d2fe;color:#4338ca;}.input-row.svelte-beco3k {display:flex;gap:8px;align-items:flex-end;}.chat-input.svelte-beco3k {flex:1;resize:none;padding:10px 14px;border-radius:12px;border:1px solid #d1d5db;font-size:16px; /* 16px prevents iOS auto-zoom on focus */line-height:1.4;min-height:42px;max-height:120px;overflow-y:auto;transition:border-color 0.15s ease, box-shadow 0.15s ease;outline:none;touch-action:manipulation;}.chat-input.svelte-beco3k:focus {border-color:#6366f1;box-shadow:0 0 0 3px rgba(99, 102, 241, 0.1);}.chat-input.svelte-beco3k::placeholder {color:#9ca3af;}.send-btn.svelte-beco3k {display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:none;background:#4f46e5;color:#fff;cursor:pointer;transition:background 0.15s ease, opacity 0.15s ease;flex-shrink:0;}.send-btn.svelte-beco3k:hover:not(:disabled) {background:#4338ca;}.send-btn.svelte-beco3k:disabled {opacity:0.4;cursor:not-allowed;}

	/* ══════════════════════ Settings page ══════════════════════ */.settings-page.svelte-beco3k {max-width:680px;margin:0 auto;padding:36px 24px 60px;font-family:inherit;color:#111;}.settings-title.svelte-beco3k {font-size:1.35rem;font-weight:700;margin:0 0 8px;color:#111;}.settings-page-desc.svelte-beco3k {font-size:0.9rem;color:#6b7280;margin:0 0 32px;line-height:1.45;}.settings-section.svelte-beco3k {background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:18px;display:flex;flex-direction:column;gap:14px;}.settings-section-title.svelte-beco3k {font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0;}.settings-section-desc.svelte-beco3k {font-size:0.875rem;color:#6b7280;margin:-8px 0 0;}

	/* Default assistant grid */.settings-assistant-grid.svelte-beco3k {display:flex;flex-wrap:wrap;gap:10px;}.settings-assistant-btn.svelte-beco3k {display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;transition:border-color 0.15s, background 0.15s;min-width:80px;}.settings-assistant-btn.selected.svelte-beco3k {border-color:#4f46e5;background:#eef2ff;}.settings-assistant-emoji.svelte-beco3k {font-size:1.5rem;}.settings-assistant-name.svelte-beco3k {font-size:0.8rem;font-weight:500;color:#374151;}

	/* Toggle rows */.settings-toggle.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;}.settings-toggle-info.svelte-beco3k {display:flex;flex-direction:column;gap:2px;}.settings-toggle-label.svelte-beco3k {font-size:0.9rem;font-weight:500;color:#111;}.settings-toggle-desc.svelte-beco3k {font-size:0.8rem;color:#6b7280;}.settings-switch.svelte-beco3k {flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#d1d5db;border:none;position:relative;cursor:pointer;transition:background 0.2s;outline:none;padding:0;}.settings-switch.svelte-beco3k::after {content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s;}.settings-switch.on.svelte-beco3k {background:#4f46e5;}.settings-switch.on.svelte-beco3k::after {transform:translateX(18px);}

	/* History list */.settings-history-list.svelte-beco3k {display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;}.settings-history-item.svelte-beco3k {display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:#f9fafb;}.settings-history-body.svelte-beco3k {flex:1;min-width:0;}.settings-history-title.svelte-beco3k {font-size:0.875rem;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.settings-history-meta.svelte-beco3k {font-size:0.75rem;color:#9ca3af;margin-top:2px;}.settings-history-delete.svelte-beco3k {flex-shrink:0;width:28px;height:28px;border:none;background:transparent;cursor:pointer;border-radius:6px;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 0.15s, color 0.15s;}.settings-history-delete.svelte-beco3k:hover {background:#fee2e2;color:#dc2626;}.settings-danger-btn.svelte-beco3k {align-self:flex-start;padding:7px 14px;border:1.5px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;font-size:0.85rem;font-weight:500;cursor:pointer;transition:background 0.15s;}.settings-danger-btn.svelte-beco3k:hover:not(:disabled) {background:#fee2e2;}.settings-danger-btn.svelte-beco3k:disabled {opacity:0.5;cursor:not-allowed;}

	/* About */.settings-about-row.svelte-beco3k {display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;}.settings-about-label.svelte-beco3k {color:#6b7280;}.settings-about-value.svelte-beco3k {font-weight:500;color:#111;}.settings-api-status.svelte-beco3k {font-size:0.85rem;font-weight:500;}.settings-api-status.online.svelte-beco3k {color:#16a34a;}.settings-api-status.offline.svelte-beco3k {color:#dc2626;}.settings-api-status.unknown.svelte-beco3k {color:#9ca3af;}.settings-link-btn.svelte-beco3k {align-self:flex-start;padding:6px 12px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;color:#4f46e5;font-size:0.8rem;cursor:pointer;transition:background 0.15s;}.settings-link-btn.svelte-beco3k:hover {background:#eef2ff;}`
};
function Bl(e, t) {
  si(t, !0), Ya(e, Ul);
  function n() {
    const d = t.ctx.config?.network;
    if (d && d !== "ic") return d;
    const b = globalThis.__CANISTER_IDS;
    return b?.network && b.network !== "ic" ? b.network : window.location.hostname.includes("icp0.io") ? "test" : "staging";
  }
  let s = /* @__PURE__ */ M(We([])), r = /* @__PURE__ */ M(""), i = /* @__PURE__ */ M(!1), a = /* @__PURE__ */ M(""), f = /* @__PURE__ */ M(!1), c = /* @__PURE__ */ M(We(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), u = /* @__PURE__ */ M(""), h = /* @__PURE__ */ M(void 0), p = /* @__PURE__ */ M(We([])), v = /* @__PURE__ */ M(!1), m = /* @__PURE__ */ M(void 0), _ = /* @__PURE__ */ M(We([])), I = /* @__PURE__ */ M(null), k = /* @__PURE__ */ M(!1), R = /* @__PURE__ */ M(null), ne = /* @__PURE__ */ M(void 0), K = /* @__PURE__ */ M("100%"), ae = /* @__PURE__ */ M(null), ee = /* @__PURE__ */ M(!1), le = /* @__PURE__ */ M(null), ve = /* @__PURE__ */ M(0), Ze, lt, Y = /* @__PURE__ */ M(null), De = /* @__PURE__ */ M(We([])), et = /* @__PURE__ */ M(!1), is = /* @__PURE__ */ M(!1);
  const Rn = "https://geister-api.realmsgos.dev/", Hi = 36e4;
  let Ui = `${Rn}api/ask`, Bi = `${Rn}suggestions`, Vi = `${Rn}api/personas/assistants`, Dn = `${Rn}api/conversations`;
  function qi(d) {
    if (!d) return null;
    const b = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!b) return null;
    try {
      return decodeURIComponent(b[1]);
    } catch {
      return b[1];
    }
  }
  function xr(d) {
    if (!d) return null;
    const b = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!b) return null;
    try {
      return decodeURIComponent(b[1]);
    } catch {
      return b[1];
    }
  }
  function Yi(d) {
    !d || d.id === o(ve) || (g(ve, d.id, !0), g(r, d.message, !0), g(ee, !0), d.autoSend ? setTimeout(() => void on(), 150) : gn().then(js));
  }
  function Gi() {
    if (xr(o(le)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function Wi() {
    Ze = t.ctx.host?.pendingPrompt?.subscribe?.(Yi), lt = t.ctx.host?.focus?.subscribe?.((d) => {
      g(le, d, !0);
    });
  }
  function yr(d, b) {
    if (b === 503 && d instanceof Error && d.message) {
      const w = d.message.toLowerCase();
      return w.includes("pod") || w.includes("llm backend") || w.includes("ollama") || w.includes("waking up") || w.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return b === 502 || b === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : b === 504 || b === 524 ? "The request timed out before the server could respond. Please try again." : b && b >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? yr(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function Ki(d) {
    const b = d.toLowerCase();
    return b.includes("llm backend") || b.includes("cannot reach ollama") || b.includes("ollama at");
  }
  function On() {
    g(c, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function Er() {
    g(c, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function $i(d) {
    const b = d.toLowerCase();
    return b.includes("waking up") || b.includes("still starting");
  }
  function Ns() {
    g(a, ""), g(f, !1);
  }
  function os(d, b) {
    d.trim() && (g(f, !0), g(a, ""));
    const w = { text: d, isUser: !1, ...b.trim() ? { thinking: b } : {} }, y = o(s)[o(s).length - 1];
    !y || y.isUser ? g(s, [...o(s), w], !0) : g(s, o(s).map((C, Ae) => Ae === o(s).length - 1 ? { ...C, ...w } : C), !0), gn().then(Os);
  }
  function Ji(d, b) {
    const w = typeof d.type == "string" ? d.type : d.text ? "text" : "", y = typeof d.text == "string" ? d.text : "";
    if (w === "status" && y) {
      On(), g(a, y, !0);
      return;
    }
    if (w === "thinking" && y) {
      On(), b.thinking += y, os(b.text, b.thinking);
      return;
    }
    y && (On(), b.text += y, os(b.text, b.thinking));
  }
  let zn = "", kt = "", Sr, Tr, wt = /* @__PURE__ */ M(!1);
  const sn = !!t.ctx.sidebarPanel, Ar = "llm_chat_prefs";
  function Qi() {
    try {
      return JSON.parse(localStorage.getItem(Ar) || "{}");
    } catch {
      return {};
    }
  }
  function Xi(d) {
    try {
      localStorage.setItem(Ar, JSON.stringify(d));
    } catch {
    }
  }
  const Rs = Qi();
  let rn = /* @__PURE__ */ M(We(Rs.defaultAssistant || "")), Lt = /* @__PURE__ */ M(Rs.showSuggestions !== !1), jn = /* @__PURE__ */ M(Rs.sharePageContext !== !1);
  ms(() => {
    Xi({
      defaultAssistant: o(rn),
      showSuggestions: o(Lt),
      sharePageContext: o(jn)
    });
  });
  let Fn = /* @__PURE__ */ M("unknown"), as = /* @__PURE__ */ M(!1), Ds = /* @__PURE__ */ M(!1);
  async function Cr() {
    try {
      const d = await fetch(`${Rn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      g(Fn, d.ok ? "online" : "offline", !0);
    } catch {
      g(Fn, "offline");
    }
  }
  async function Zi() {
    if (!(!kt || !o(wt))) {
      g(as, !0);
      try {
        await zs(), await Promise.all(o(De).map((d) => fetch(`${Dn}/${d.conversation_id}`, { method: "DELETE" }))), g(De, [], !0), g(s, [], !0), g(Y, null), g(Ds, !0), setTimeout(
          () => {
            g(Ds, !1);
          },
          2e3
        );
      } catch {
      } finally {
        g(as, !1);
      }
    }
  }
  Za(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", b = t.ctx.config?.canisterId || "";
    if (zn = d || b, Sr = t.ctx.principal?.subscribe?.((w) => {
      kt = w || "";
    }), Tr = t.ctx.isAuthenticated?.subscribe?.((w) => {
      g(wt, w, !0);
    }), !sn) {
      const w = window.visualViewport;
      if (w) {
        const y = () => {
          const C = o(ne)?.getBoundingClientRect().top ?? w.offsetTop, Ae = Math.max(Math.round(w.height - C), 200);
          g(K, `${Ae}px`);
        };
        await gn(), y(), w.addEventListener("resize", y), w.addEventListener("scroll", y), window.addEventListener("resize", y), window.__chatVpCleanup = () => {
          w.removeEventListener("resize", y), w.removeEventListener("scroll", y), window.removeEventListener("resize", y);
        };
      }
    }
    if (eo(), Wi(), await to(), o(rn) && o(_).length > 0) {
      const w = o(_).find((y) => y.id === o(rn));
      w && g(I, w, !0);
    }
    !o(ee) && o(Lt) && await ls(), sn || (Cr(), o(wt) && await zs());
  });
  function eo() {
    try {
      const d = new URLSearchParams(window.location.search), b = d.get("explain");
      if (!b) return;
      const [w, y] = b.split(":");
      if (w === "codex" && y)
        g(ee, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: y })).then((C) => {
          if (C.success) {
            const Nt = (typeof C.response == "string" ? JSON.parse(C.response) : C.response).codex?.name || `codex_${y}`, pe = `/extensions/codex_viewer/${y}`;
            g(ae, y, !0), g(r, `Please explain this codex: [${Nt}](${pe})`), setTimeout(() => on(), 300);
          }
        }).catch((C) => {
          console.error("Failed to fetch codex for explanation:", C), g(ee, !1);
        });
      else if (w === "financial_statements") {
        g(ee, !0);
        const C = d.get("context") || "";
        g(r, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${C}`), setTimeout(() => on(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  ms(() => {
    o(s), gn().then(Os);
  });
  function Os() {
    o(h) && (o(h).scrollTop = o(h).scrollHeight);
  }
  async function to() {
    if (!o(k)) {
      g(k, !0);
      try {
        const d = await fetch(Vi, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        const b = await d.json();
        b.assistants && Array.isArray(b.assistants) && (g(_, b.assistants, !0), o(_).length > 0 && !o(I) && g(I, o(_)[0], !0));
      } catch (d) {
        console.error("Error fetching assistants:", d);
      } finally {
        g(k, !1);
      }
    }
  }
  async function ls() {
    if (!o(v)) {
      g(v, !0);
      try {
        const d = new URLSearchParams({
          user_principal: kt || "",
          realm_principal: zn || "",
          persona: o(I)?.id || "ashoka"
        }), b = await fetch(`${Bi}?${d.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!b.ok) throw new Error(`HTTP ${b.status}`);
        const w = await b.json();
        w.suggestions && Array.isArray(w.suggestions) && g(p, w.suggestions, !0);
      } catch (d) {
        console.error("Error fetching suggestions:", d);
      } finally {
        g(v, !1);
      }
    }
  }
  async function on() {
    if (!o(r).trim()) return;
    g(u, ""), g(
      s,
      [
        ...o(s),
        { text: o(r), isUser: !0 }
      ],
      !0
    );
    const d = o(r);
    g(r, ""), g(i, !0), Ns(), g(a, o(c) ? "Thinking…" : "", !0);
    try {
      await io();
      const b = n(), w = {
        question: d,
        realm_principal: zn,
        user_principal: kt,
        stream: !0,
        verbosity: 1,
        persona: o(I)?.id || "ashoka",
        network: b,
        ...o(Y) ? { conversation_id: o(Y) } : {}
      };
      if (o(ae))
        w.explain_codex_id = o(ae), g(ae, null);
      else {
        const fe = qi(o(le)?.uri);
        fe && (w.explain_codex_id = fe);
      }
      const y = xr(o(le)?.uri);
      y && (w.explain_proposal_id = y, w.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(le)?.label || "Proposal",
        proposalId: y
      }), o(le) && (w.focus = {
        uri: o(le).uri,
        label: o(le).label
      });
      const C = await fetch(Ui, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(w),
        signal: AbortSignal.timeout(Hi)
      });
      if (!C.ok) {
        let fe = "";
        try {
          const Ce = await C.json();
          fe = typeof Ce?.error == "string" ? Ce.error : "";
        } catch {
        }
        throw fe ? Object.assign(new Error(fe), { httpStatus: C.status }) : Object.assign(new Error(`HTTP error! Status: ${C.status}`), { httpStatus: C.status });
      }
      const Ae = C.body?.getReader();
      if (!Ae) throw new Error("Response body is not readable");
      const Nt = new TextDecoder(), pe = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: fe, value: Ce } = await Ae.read();
          if (fe) break;
          const cn = Nt.decode(Ce, { stream: !0 }).split(`
`);
          for (const ct of cn)
            if (ct.startsWith("data: ")) {
              const Rt = ct.slice(6);
              if (Rt === "[DONE]") continue;
              try {
                Ji(JSON.parse(Rt), pe);
              } catch {
                pe.text += Rt, os(pe.text, pe.thinking);
              }
            } else ct.trim() && !ct.startsWith(":") && (pe.text += ct, os(pe.text, pe.thinking));
        }
      } finally {
        Ae.releaseLock();
      }
      const xt = pe.text, an = pe.thinking;
      xt.trim() ? Ki(xt) ? (g(u, "The AI backend is temporarily offline. Please try again in a few minutes."), Er()) : xt.trim() && On() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? g(s, o(s).map((fe, Ce) => Ce === o(s).length - 1 ? { ...fe, text: "No response from LLM" } : fe), !0) : g(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), g(i, !1), Ns(), g(ee, !1), await ls();
    } catch (b) {
      console.error("Error calling LLM:", b), g(u, yr(b, b?.httpStatus), !0), $i(o(u)) && Er(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && g(s, o(s).slice(0, -1), !0);
    } finally {
      g(i, !1), Ns(), g(ee, !1);
    }
  }
  function no() {
    g(u, "");
  }
  async function zs() {
    if (!(!kt || !o(wt))) {
      g(is, !0);
      try {
        const d = new URLSearchParams({
          user_principal: kt,
          realm_principal: zn
        }), b = await fetch(`${Dn}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!b.ok) return;
        const w = await b.json();
        g(De, (w.conversations || []).sort((y, C) => new Date(C.updated_at).getTime() - new Date(y.updated_at).getTime()), !0);
      } catch {
      } finally {
        g(is, !1);
      }
    }
  }
  async function Mr(d) {
    g(et, !1), g(s, [], !0), g(Y, d.conversation_id, !0);
    const b = o(_).find((w) => w.id === d.persona);
    b && g(I, b, !0);
    try {
      const w = await fetch(`${Dn}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!w.ok) return;
      const y = await w.json();
      g(s, oo(y.messages || []), !0), o(s).some((C) => !C.isUser) && On(), await gn(), Os();
    } catch {
    }
  }
  async function so() {
    g(et, !1), g(s, [], !0), g(Y, null), g(u, ""), g(p, [], !0), await ls();
  }
  async function Pr(d, b) {
    b.stopPropagation();
    try {
      await fetch(`${Dn}/${d}`, { method: "DELETE" }), g(De, o(De).filter((w) => w.conversation_id !== d), !0), o(Y) === d && (g(s, [], !0), g(Y, null));
    } catch {
    }
  }
  async function ro() {
    g(et, !0), await zs();
  }
  function Ir(d) {
    const b = new Date(d), y = (/* @__PURE__ */ new Date()).getTime() - b.getTime(), C = Math.floor(y / 864e5);
    return C === 0 ? b.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : C === 1 ? "Yesterday" : C < 7 ? b.toLocaleDateString([], { weekday: "short" }) : b.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function io() {
    if (!(o(Y) || !kt || !o(wt)))
      try {
        const d = await fetch(Dn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: kt,
            realm_principal: zn,
            persona: o(I)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const b = await d.json();
          g(Y, b.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function Lr(d, b) {
    const w = () => {
      g(R, b, !0), setTimeout(
        () => {
          g(R, null);
        },
        1500
      );
    }, y = () => {
      const C = document.createElement("textarea");
      C.value = d, C.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(C), C.focus(), C.select();
      try {
        document.execCommand("copy"), w();
      } catch {
      }
      document.body.removeChild(C);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(w).catch(y) : y();
  }
  function oo(d) {
    const b = [];
    for (const w of d) {
      if (!w || typeof w != "object") continue;
      const y = w;
      if (y.role && y.content != null) {
        b.push({ text: String(y.content), isUser: y.role === "user" });
        continue;
      }
      y.question != null && String(y.question).trim() && b.push({ text: String(y.question), isUser: !0 }), y.response != null && String(y.response).trim() && b.push({ text: String(y.response), isUser: !1 });
    }
    return b;
  }
  function ao(d) {
    if (!d) return "";
    let b = d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return b = b.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), b;
  }
  function js() {
    if (o(m)) {
      o(m).style.height = "auto";
      const d = Math.max(40, Math.min(o(m).scrollHeight, 120));
      o(m).style.height = d + "px";
    }
  }
  function lo(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), on()), setTimeout(js, 0);
  }
  function co(d) {
    g(r, d, !0), on();
  }
  function fo(d) {
    g(I, d, !0), g(s, [], !0), ls();
  }
  ms(() => () => {
    Sr?.(), Tr?.(), Ze?.(), lt?.(), window.__chatVpCleanup?.();
  });
  var Nr = dn(), uo = zt(Nr);
  {
    var vo = (d) => {
      var b = cl(), w = P(E(b), 2), y = E(w), C = P(w, 2), Ae = P(E(C), 4);
      {
        var Nt = (J) => {
          var x = sl();
          pn(x, 21, () => o(_), vn, (H, W) => {
            var G = nl(), $ = E(G), se = E($), U = P($, 2), V = E(U);
            _e(() => {
              jt(G, 1, `settings-assistant-btn ${o(rn) === o(W).id || !o(rn) && o(_)[0].id === o(W).id ? "selected" : ""}`, "svelte-beco3k"), be(se, o(W).emoji), be(V, o(W).name);
            }), te("click", G, () => g(rn, o(W).id, !0)), S(H, G);
          }), S(J, x);
        }, pe = (J) => {
          var x = rl();
          S(J, x);
        };
        q(Ae, (J) => {
          o(_).length > 0 ? J(Nt) : J(pe, -1);
        });
      }
      var xt = P(C, 2), an = P(E(xt), 2), fe = P(E(an), 2), Ce = P(an, 2), ln = P(E(Ce), 2), cn = P(xt, 2);
      {
        var ct = (J) => {
          var x = ll(), H = P(E(x), 2);
          {
            var W = (j) => {
              var F = ol();
              pn(F, 21, () => o(De), vn, (he, Me) => {
                var ft = il(), Pe = E(ft), Oe = E(Pe), re = E(Oe), ce = P(Oe, 2), ge = E(ce), Ot = P(Pe, 2);
                _e(
                  (ut) => {
                    be(re, o(Me).title), be(ge, `${ut ?? ""} · ${o(Me).message_count ?? ""} message${o(Me).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Ir(o(Me).updated_at)]
                ), te("click", Ot, (ut) => Pr(o(Me).conversation_id, ut)), S(he, ft);
              }), S(j, F);
            }, G = (j) => {
              var F = al(), he = E(F);
              _e(() => be(he, o(is) ? "Loading…" : "No conversations yet.")), S(j, F);
            };
            q(H, (j) => {
              o(De).length > 0 ? j(W) : j(G, -1);
            });
          }
          var $ = P(H, 2), se = E($);
          {
            var U = (j) => {
              var F = un("✓ History cleared");
              S(j, F);
            }, V = (j) => {
              var F = un("Clearing…");
              S(j, F);
            }, Q = (j) => {
              var F = un("Clear all history");
              S(j, F);
            };
            q(se, (j) => {
              o(Ds) ? j(U) : o(as) ? j(V, 1) : j(Q, -1);
            });
          }
          _e(() => $.disabled = o(as) || o(De).length === 0), te("click", $, Zi), S(J, x);
        };
        q(cn, (J) => {
          o(wt) && J(ct);
        });
      }
      var Rt = P(cn, 2), Hn = P(E(Rt), 4), cs = P(E(Hn), 2), Fs = E(cs);
      {
        var Dt = (J) => {
          var x = un("● Online");
          S(J, x);
        }, Un = (J) => {
          var x = un("● Offline");
          S(J, x);
        }, Hs = (J) => {
          var x = un("Checking…");
          S(J, x);
        };
        q(Fs, (J) => {
          o(Fn) === "online" ? J(Dt) : o(Fn) === "offline" ? J(Un, 1) : J(Hs, -1);
        });
      }
      var Us = P(Hn, 2);
      _e(() => {
        be(y, tl), jt(fe, 1, `settings-switch ${o(Lt) ? "on" : ""}`, "svelte-beco3k"), ds(fe, "aria-checked", o(Lt)), jt(ln, 1, `settings-switch ${o(jn) ? "on" : ""}`, "svelte-beco3k"), ds(ln, "aria-checked", o(jn)), jt(cs, 1, `settings-api-status ${o(Fn) ?? ""}`, "svelte-beco3k");
      }), te("click", fe, () => g(Lt, !o(Lt))), te("click", ln, () => g(jn, !o(jn))), te("click", Us, Cr), S(d, b);
    }, po = (d) => {
      var b = Hl();
      let w;
      var y = E(b);
      {
        var C = (x) => {
          var H = fl(), W = E(H), G = P(W, 2);
          _e(() => jt(G, 1, `toolbar-btn ${o(et) ? "active" : ""}`, "svelte-beco3k")), te("click", W, so), te("click", G, function(...$) {
            (o(et) ? () => g(et, !1) : ro)?.apply(this, $);
          }), S(x, H);
        };
        q(y, (x) => {
          o(wt) && x(C);
        });
      }
      var Ae = P(y, 2);
      {
        var Nt = (x) => {
          var H = ul(), W = E(H), G = E(W), $ = P(W, 2);
          _e(() => {
            ds(W, "title", o(le).uri), be(G, o(le).label);
          }), te("click", $, Gi), S(x, H);
        };
        q(Ae, (x) => {
          sn && o(le)?.label && x(Nt);
        });
      }
      var pe = P(Ae, 2);
      {
        var xt = (x) => {
          var H = vl();
          pn(H, 21, () => o(_), vn, (W, G) => {
            var $ = dl(), se = E($), U = E(se), V = P(se, 2), Q = E(V);
            _e(() => {
              jt($, 1, `assistant-btn ${o(I)?.id === o(G).id ? "active" : ""}`, "svelte-beco3k"), ds($, "title", o(G).description), be(U, o(G).emoji), be(Q, o(G).name);
            }), te("click", $, () => fo(o(G))), S(W, $);
          }), S(x, H);
        };
        q(pe, (x) => {
          o(_).length > 1 && x(xt);
        });
      }
      var an = P(pe, 2);
      {
        var fe = (x) => {
          var H = bl(), W = E(H);
          {
            var G = (U) => {
              var V = pl();
              S(U, V);
            }, $ = (U) => {
              var V = hl();
              S(U, V);
            }, se = (U) => {
              var V = dn(), Q = zt(V);
              pn(Q, 17, () => o(De), vn, (j, F) => {
                var he = gl(), Me = E(he), ft = E(Me), Pe = E(ft), Oe = P(ft, 2), re = E(Oe), ce = P(Me, 2);
                _e(
                  (ge) => {
                    be(Pe, o(F).title), be(re, `${ge ?? ""} · ${o(F).message_count ?? ""} msg${o(F).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Ir(o(F).updated_at)]
                ), te("click", he, () => Mr(o(F))), te("keydown", he, (ge) => ge.key === "Enter" && Mr(o(F))), te("click", ce, (ge) => Pr(o(F).conversation_id, ge)), S(j, he);
              }), S(U, V);
            };
            q(W, (U) => {
              o(is) ? U(G) : o(De).length === 0 ? U($, 1) : U(se, -1);
            });
          }
          S(x, H);
        };
        q(an, (x) => {
          o(et) && x(fe);
        });
      }
      var Ce = P(an, 2), ln = E(Ce);
      {
        var cn = (x) => {
          var H = kl(), W = E(H), G = E(W);
          {
            var $ = (U) => {
              var V = _l();
              S(U, V);
            }, se = (U) => {
              var V = ml();
              S(U, V);
            };
            q(G, (U) => {
              o(wt) ? U($) : U(se, -1);
            });
          }
          S(x, H);
        }, ct = (x) => {
          var H = Rl(), W = zt(H);
          pn(W, 17, () => o(s), vn, (V, Q, j) => {
            var F = dn(), he = zt(F);
            {
              var Me = (Pe) => {
                var Oe = yl(), re = E(Oe), ce = E(re), ge = E(ce);
                {
                  var Ot = (Et) => {
                    var Bn = wl();
                    S(Et, Bn);
                  }, ut = (Et) => {
                    var Bn = xl();
                    S(Et, Bn);
                  };
                  q(ge, (Et) => {
                    o(R) === j ? Et(Ot) : Et(ut, -1);
                  });
                }
                var tt = P(ce, 2), yt = E(tt);
                _e(() => be(yt, o(Q).text)), te("click", ce, () => Lr(o(Q).text, j)), S(Pe, Oe);
              }, ft = (Pe) => {
                var Oe = Al(), re = E(Oe), ce = E(re), ge = E(ce);
                {
                  var Ot = (xe) => {
                    var dt = El(), Bs = P(E(dt), 2), go = E(Bs);
                    _e(() => be(go, o(Q).thinking)), S(xe, dt);
                  };
                  q(ge, (xe) => {
                    o(Q).thinking && xe(Ot);
                  });
                }
                var ut = P(ge, 2);
                {
                  var tt = (xe) => {
                    var dt = dn(), Bs = zt(dt);
                    qa(Bs, () => ao(o(Q).text)), S(xe, dt);
                  };
                  q(ut, (xe) => {
                    o(Q).text && xe(tt);
                  });
                }
                var yt = P(ce, 2), Et = E(yt);
                {
                  var Bn = (xe) => {
                    var dt = Sl();
                    S(xe, dt);
                  }, ho = (xe) => {
                    var dt = Tl();
                    S(xe, dt);
                  };
                  q(Et, (xe) => {
                    o(R) === j ? xe(Bn) : xe(ho, -1);
                  });
                }
                te("click", yt, () => Lr(o(Q).text, j)), S(Pe, Oe);
              };
              q(he, (Pe) => {
                o(Q).isUser ? Pe(Me) : Pe(ft, -1);
              });
            }
            S(V, F);
          });
          var G = P(W, 2);
          {
            var $ = (V) => {
              var Q = Ll(), j = E(Q), F = E(j);
              {
                var he = (re) => {
                  var ce = dn(), ge = zt(ce);
                  {
                    var Ot = (tt) => {
                      var yt = Cl();
                      S(tt, yt);
                    }, ut = (tt) => {
                      var yt = Ml();
                      S(tt, yt);
                    };
                    q(ge, (tt) => {
                      o(ee) ? tt(Ot) : !o(c) && !o(a) && tt(ut, 1);
                    });
                  }
                  S(re, ce);
                };
                q(F, (re) => {
                  o(f) || re(he);
                });
              }
              var Me = P(F, 2);
              {
                var ft = (re) => {
                  var ce = Pl(), ge = E(ce);
                  _e(() => be(ge, o(a))), S(re, ce);
                };
                q(Me, (re) => {
                  o(a) && re(ft);
                });
              }
              var Pe = P(Me, 2);
              {
                var Oe = (re) => {
                  var ce = Il();
                  S(re, ce);
                };
                q(Pe, (re) => {
                  !o(f) && !o(a) && o(c) && !o(ee) && re(Oe);
                });
              }
              S(V, Q);
            };
            q(G, (V) => {
              o(i) && (!o(f) || o(a)) && V($);
            });
          }
          var se = P(G, 2);
          {
            var U = (V) => {
              var Q = Nl(), j = E(Q), F = E(j), he = P(j, 2);
              _e(() => be(F, o(u))), te("click", he, no), S(V, Q);
            };
            q(se, (V) => {
              o(u) && V(U);
            });
          }
          S(x, H);
        };
        q(ln, (x) => {
          o(s).length === 0 && !o(ee) ? x(cn) : x(ct, -1);
        });
      }
      $s(Ce, (x) => g(h, x), () => o(h));
      var Rt = P(Ce, 2), Hn = E(Rt);
      {
        var cs = (x) => {
          var H = zl(), W = E(H);
          {
            var G = (se) => {
              var U = Dl();
              S(se, U);
            }, $ = (se) => {
              var U = dn(), V = zt(U);
              pn(V, 17, () => o(p), vn, (Q, j) => {
                var F = Ol(), he = E(F);
                _e(() => be(he, o(j))), te("click", F, () => co(o(j))), S(Q, F);
              }), S(se, U);
            };
            q(W, (se) => {
              o(v) ? se(G) : se($, -1);
            });
          }
          S(x, H);
        };
        q(Hn, (x) => {
          o(Lt) && (o(p).length > 0 || o(v)) && x(cs);
        });
      }
      var Fs = P(Hn, 2), Dt = E(Fs);
      $s(Dt, (x) => g(m, x), () => o(m));
      var Un = P(Dt, 2), Hs = E(Un);
      {
        var Us = (x) => {
          var H = jl();
          S(x, H);
        }, J = (x) => {
          var H = Fl();
          S(x, H);
        };
        q(Hs, (x) => {
          o(i) ? x(Us) : x(J, -1);
        });
      }
      $s(b, (x) => g(ne, x), () => o(ne)), _e(
        (x) => {
          w = jt(b, 1, "llm-chat-root svelte-beco3k", null, w, { "sidebar-panel": sn }), Gr(b, sn ? void 0 : `height: ${o(K)}`), Gr(Ce, o(et) ? "display:none" : ""), Un.disabled = x;
        },
        [() => o(i) || !o(r).trim()]
      ), te("keydown", Dt, lo), te("input", Dt, () => js()), Xa(Dt, () => o(r), (x) => g(r, x)), te("click", Un, () => on()), S(d, b);
    };
    q(uo, (d) => {
      sn ? d(po, -1) : d(vo);
    });
  }
  S(e, Nr), ri();
}
Na(["click", "keydown", "input"]);
function Yl(e, t) {
  const n = za(Bl, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Fa(n);
      } catch {
      }
    }
  };
}
export {
  Yl as default
};
