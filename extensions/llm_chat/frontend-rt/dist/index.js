var To = Object.defineProperty;
var jr = (e) => {
  throw TypeError(e);
};
var Ao = (e, t, n) => t in e ? To(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var ge = (e, t, n) => Ao(e, typeof t != "symbol" ? t + "" : t, n), Bs = (e, t, n) => t.has(e) || jr("Cannot " + n);
var f = (e, t, n) => (Bs(e, t, "read from private field"), n ? n.call(e) : t.get(e)), O = (e, t, n) => t.has(e) ? jr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), L = (e, t, n, s) => (Bs(e, t, "write to private field"), s ? s.call(e, n) : t.set(e, n), n), T = (e, t, n) => (Bs(e, t, "access private method"), n);
var ti = Array.isArray, Co = Array.prototype.indexOf, Kn = Array.prototype.includes, Cs = Array.from, ni = Object.defineProperty, Yn = Object.getOwnPropertyDescriptor, Mo = Object.getOwnPropertyDescriptors, Po = Object.prototype, Io = Array.prototype, si = Object.getPrototypeOf, Fr = Object.isExtensible;
const Lo = () => {
};
function No(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function ri() {
  var e, t, n = new Promise((s, r) => {
    e = s, t = r;
  });
  return { promise: n, resolve: e, reject: t };
}
const ye = 2, xn = 4, Ms = 8, ii = 1 << 24, We = 16, Xe = 32, It = 64, Qs = 128, pr = 256, Qe = 512, oe = 1024, Q = 2048, ze = 4096, Se = 8192, we = 16384, An = 32768, $n = 1 << 25, yn = 65536, ks = 1 << 17, Ro = 1 << 18, Cn = 1 << 19, Oo = 1 << 20, at = 1 << 25, ws = 1 << 21, pn = 1 << 22, Pt = 1 << 23, ps = Symbol("$state"), oi = Symbol("component"), Do = Symbol(""), hs = Symbol("attributes"), Xs = Symbol("class"), Zs = Symbol("style"), Fn = Symbol("text"), gs = Symbol("form reset"), ns = new class extends Error {
  constructor() {
    super(...arguments);
    ge(this, "name", "StaleReactionError");
    ge(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}(), zo = 1, jo = 2, ai = 4, Fo = 8, Ho = 16, Uo = 1, Bo = 2, li = {}, ie = Symbol("uninitialized"), ci = "http://www.w3.org/1999/xhtml", Vo = "http://www.w3.org/2000/svg", qo = "http://www.w3.org/1998/Math/MathML";
function Yo() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Go() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function fi(e) {
  return e === this.v;
}
function Wo(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function ui(e) {
  return !Wo(e, this.v);
}
function Jo(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Ko() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function $o(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Qo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Xo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Zo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function ea() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function ta() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function na() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function sa() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function ra() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
let xe = null;
function En(e) {
  xe = e;
}
function di(e, t = !1, n) {
  xe = {
    p: xe,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      j
    ),
    l: null
  };
}
function vi(e) {
  var t = (
    /** @type {ComponentContext} */
    xe
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var s of n)
      Ri(s);
  }
  return t.i = !0, xe = t.p, hr(e);
}
function hr(e = {}) {
  return ni(e, oi, { value: !0 }), e;
}
function pi() {
  return !0;
}
let Bt = [];
function hi() {
  var e = Bt;
  Bt = [], No(e);
}
function Mt(e) {
  if (Bt.length === 0 && !Gn) {
    var t = Bt;
    queueMicrotask(() => {
      t === Bt && hi();
    });
  }
  Bt.push(e);
}
function ia() {
  for (; Bt.length > 0; )
    hi();
}
const oa = -7169;
function ee(e, t) {
  e.f = e.f & oa | t;
}
function gr(e) {
  (e.f & Qe) !== 0 || e.deps === null ? ee(e, oe) : ee(e, ze);
}
function gi(e, t) {
  (e.f & Q) !== 0 ? t.set(e, Q) : (e.f & ze) !== 0 && t.get(e) !== Q && t.set(e, ze), ee(e, oe);
}
let Hr = !1;
function aa() {
  Hr || (Hr = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t[gs]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function ss(e) {
  var t = R, n = j;
  qe(null), ft(null);
  try {
    return e();
  } finally {
    qe(t), ft(n);
  }
}
function la(e, t, n, s = n) {
  e.addEventListener(t, () => ss(n));
  const r = (
    /** @type {any} */
    e[gs]
  );
  r ? e[gs] = () => {
    r(), s(!0);
  } : e[gs] = () => s(!0), aa();
}
function ca(e, t, n, s) {
  const r = _i;
  var i = e.filter((p) => !p.settled), a = t.map(r);
  if (n.length === 0 && i.length === 0) {
    s(a);
    return;
  }
  var c = (
    /** @type {Effect} */
    j
  ), l = fa(), u = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((p) => p.promise)) : null;
  function v(p) {
    if ((c.f & we) === 0) {
      l();
      try {
        s([...a, ...p]);
      } catch (b) {
        ot(b, c);
      }
      xs();
    }
  }
  var m = bi();
  if (n.length === 0) {
    u.then(() => v([])).finally(m);
    return;
  }
  function w() {
    Promise.all(n.map((p) => /* @__PURE__ */ ua(p))).then(v).catch((p) => ot(p, c)).finally(m);
  }
  u ? u.then(() => {
    if ((c.f & we) !== 0) {
      m();
      return;
    }
    l(), w(), xs();
  }) : w();
}
function fa() {
  var e = (
    /** @type {Effect} */
    j
  ), t = R, n = xe, s = (
    /** @type {Batch} */
    I
  );
  return function(i = !0) {
    ft(e), qe(t), En(n), i && (e.f & we) === 0 && (s?.activate(), s?.apply());
  };
}
function xs(e = !0) {
  ft(null), qe(null), En(null), e && I?.deactivate();
}
function bi() {
  var e = (
    /** @type {Effect} */
    j
  ), t = e.b, n = (
    /** @type {Batch} */
    I
  ), s = !!t?.is_rendered();
  return t?.update_pending_count(1, n), n.increment(s, e), () => {
    t?.update_pending_count(-1, n), n.decrement(s, e);
  };
}
// @__NO_SIDE_EFFECTS__
function _i(e) {
  var t = ye | Q;
  return j !== null && (j.f |= Cn), {
    ctx: xe,
    deps: null,
    effects: null,
    equals: fi,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      ie
    ),
    wv: 0,
    parent: j,
    ac: null
  };
}
const Hn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function ua(e, t, n) {
  let s = (
    /** @type {Effect | null} */
    j
  );
  s === null && Ko();
  var r = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = Xt(
    /** @type {V} */
    ie
  ), a = !R, c = /* @__PURE__ */ new Set();
  return Ca(() => {
    var l = (
      /** @type {Effect} */
      j
    ), u = ri();
    r = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, (p) => {
        p !== ns && u.reject(p);
      }).finally(xs);
    } catch (p) {
      u.reject(p), xs();
    }
    var v = (
      /** @type {Batch} */
      I
    );
    if (a) {
      if ((l.f & An) !== 0)
        var m = bi();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        s.b?.is_rendered()
      )
        v.async_deriveds.get(l)?.reject(Hn);
      else
        for (const p of c.values())
          p.reject(Hn);
      c.add(u), v.async_deriveds.set(l, u);
    }
    const w = (p, b = void 0) => {
      m?.(), c.delete(u), b !== Hn && (v.activate(), b ? (i.f |= Pt, Sn(i, b)) : ((i.f & Pt) !== 0 && (i.f ^= Pt), Sn(i, p)), v.deactivate());
    };
    u.promise.then(w, (p) => w(null, p || "unknown"));
  }), Ta(() => {
    for (const l of c)
      l.reject(Hn);
  }), new Promise((l) => {
    function u(v) {
      function m() {
        v === r ? l(i) : u(r);
      }
      v.then(m, m);
    }
    u(r);
  });
}
// @__NO_SIDE_EFFECTS__
function da(e) {
  const t = /* @__PURE__ */ _i(e);
  return t.equals = ui, t;
}
function va(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Ce(
        /** @type {Effect} */
        t[n]
      );
  }
}
function br(e) {
  var t, n = j, s = e.parent;
  if (!Lt && s !== null && e.v !== ie && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (s.f & (we | Se)) !== 0)
    return Yo(), e.v;
  ft(s);
  try {
    va(e), t = qi(e);
  } finally {
    ft(n);
  }
  return t;
}
function mi(e) {
  var t = br(e);
  if (!e.equals(t) && (e.wv = Bi(), (!I?.is_fork || e.deps === null) && (I !== null ? (I.capture(e, t, !0), hn?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    ee(e, oe);
    return;
  }
  Lt || (Je !== null ? (wr() || I?.is_fork) && Je.set(e, t) : gr(e));
}
function pa(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && ss(() => {
        t.ac.abort(ns), t.ac = null;
      }), t.fn !== null && (t.teardown = Lo), Qn(t, 0), Er(t));
}
function ki(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Tn(t);
}
let Vs = null, an = null, I = null, hn = null, Je = null, er = null, Gn = !1, qs = !1, Wn = null, bs = null;
var Ur = 0;
let ha = 1;
var gn, bn, _n, bt, mn, _t, Xn, nt, st, kn, Yt, D, tr, wi, nr, Un, sr, xi, yi, Ei, dn, ga, Bn;
const Ss = class Ss {
  constructor() {
    O(this, D);
    ge(this, "id", ha++);
    /** True as soon as `#process` was called */
    ge(this, "started", !1);
    ge(this, "linked", !0);
    /** @type {Batch | null} */
    ge(this, "prev", null);
    /** @type {Batch | null} */
    ge(this, "next", null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    ge(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * The keys of this map are identical to `this.previous`
     * @type {Map<Value, [any, boolean]>}
     */
    ge(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * The keys of this map are identical to `this.current`
     * @type {Map<Value, any>}
     */
    ge(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    O(this, gn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    O(this, bn, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    O(this, _n, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    O(this, bt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    O(this, mn, null);
    /**
     * Effects that were scheduled in this batch but not yet 'resolved' into the
     * root effects that need to be flushed. Resolving — the upwards traversal that
     * marks the path to each effect on the shared effect tree (see #resolve) — is
     * deferred until the batch is processed, so that the markers are created and
     * consumed within a single traversal. Scheduling into other batches (which can
     * happen concurrently, e.g. while a batch is committed) can therefore never
     * observe (and be confused by) this batch's markers.
     * May contain duplicates — deduplication happens during resolving
     * @type {Effect[]}
     */
    O(this, _t, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    O(this, Xn, []);
    /**
     * Deferred effects (which run after async work has completed) and their status (DIRTY or MAYBE_DIRTY)
     * @type {Map<Effect, number>}
     */
    O(this, nt, /* @__PURE__ */ new Map());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    O(this, st, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    O(this, kn, /* @__PURE__ */ new Set());
    ge(this, "is_fork", !1);
    O(this, Yt, !1);
    an === null ? Vs = an = this : (an.next = this, this.prev = an), an = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    f(this, st).has(t) || f(this, st).set(t, { d: [], m: [] }), f(this, kn).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (s) => this.schedule(s)) {
    var s = f(this, st).get(t);
    if (s) {
      f(this, st).delete(t);
      for (var r of s.d)
        ee(r, Q), n(r);
      for (r of s.m)
        ee(r, ze), n(r);
    }
    f(this, kn).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, s = !1) {
    t.v !== ie && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Pt) === 0 && (this.current.set(t, [n, s]), Je?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    I = this;
  }
  deactivate() {
    I = null, Je = null;
  }
  flush() {
    try {
      qs = !0, I = this, T(this, D, Un).call(this);
    } finally {
      Ur = 0, er = null, Wn = null, bs = null, qs = !1, I = null, Je = null, lt.clear();
    }
  }
  discard() {
    for (const t of f(this, bn)) t(this);
    f(this, bn).clear();
    for (const t of this.async_deriveds.values())
      t.reject(Hn);
    T(this, D, Bn).call(this), f(this, mn)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    f(this, Xn).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    if (L(this, _n, f(this, _n) + 1), t) {
      let s = f(this, bt).get(n) ?? 0;
      f(this, bt).set(n, s + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, n) {
    if (L(this, _n, f(this, _n) - 1), t) {
      let s = f(this, bt).get(n) ?? 0;
      s === 1 ? f(this, bt).delete(n) : f(this, bt).set(n, s - 1);
    }
    f(this, Yt) || (L(this, Yt, !0), Mt(() => {
      L(this, Yt, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Map<Effect, number>} dirty_reactions
   */
  transfer_reactions(t) {
    for (const [n, s] of t)
      this.add_dirty_reaction(n, s);
    t.clear();
  }
  /**
   * @param {Effect} effect
   * @param {number} status
   */
  add_dirty_reaction(t, n) {
    (n === Q || f(this, nt).get(t) !== Q) && f(this, nt).set(t, n);
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    f(this, gn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    f(this, bn).add(t);
  }
  settled() {
    return (f(this, mn) ?? L(this, mn, ri())).promise;
  }
  static ensure() {
    if (I === null) {
      const t = I = new Ss();
      !qs && !Gn && Mt(() => {
        t.started || t.flush();
      });
    }
    return I;
  }
  apply() {
    {
      Je = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    if (er = t, t.b?.is_pending && (t.f & (xn | Ms | ii)) !== 0 && (t.f & An) === 0) {
      t.b.defer_effect(t);
      return;
    }
    f(this, _t).push(t);
  }
};
gn = new WeakMap(), bn = new WeakMap(), _n = new WeakMap(), bt = new WeakMap(), mn = new WeakMap(), _t = new WeakMap(), Xn = new WeakMap(), nt = new WeakMap(), st = new WeakMap(), kn = new WeakMap(), Yt = new WeakMap(), D = new WeakSet(), tr = function() {
  if (this.is_fork) return !0;
  for (const t of f(this, bt).keys())
    if (!T(this, D, wi).call(this, t))
      return !0;
  return !1;
}, /**
 * Whether `effect` is inside a branch that this batch skips
 * @param {Effect} effect
 */
wi = function(t) {
  for (var n = (
    /** @type {Effect | null} */
    t
  ); n !== null; n = n.parent)
    if (f(this, st).has(n)) return !0;
  return !1;
}, /**
 * Convert the effects that were scheduled in this batch into the root effects
 * that need to be traversed, marking the path to each effect (by clearing the
 * `CLEAN` flag on ancestor branches) so that the traversal can find them.
 * This happens right before traversal rather than at scheduling time, so that
 * the markers left on the (shared) effect tree are created and consumed within
 * a single traversal — scheduling into other batches can never observe them
 * @returns {Effect[]}
 */
nr = function() {
  var t = [];
  for (const i of f(this, _t))
    if (!((i.f & we) !== 0 || (i.f & (Q | ze)) === 0)) {
      for (var n = i, s = !1; n.parent !== null; ) {
        n = n.parent;
        var r = n.f;
        if ((r & (It | Xe)) !== 0) {
          if ((r & oe) === 0) {
            s = !0;
            break;
          }
          n.f ^= oe;
        }
      }
      s || t.push(n);
    }
  return L(this, _t, []), t;
}, Un = function() {
  var c, l, u;
  this.started = !0;
  for (const [v, m] of f(this, nt))
    ee(v, m), this.schedule(v);
  this.apply();
  for (var t = Wn = [], n = [], s = bs = []; f(this, _t).length > 0; ) {
    Ur++ > 1e3 && (T(this, D, Bn).call(this), _a());
    for (const v of T(this, D, nr).call(this))
      try {
        T(this, D, sr).call(this, v, t, n);
      } catch (m) {
        throw Ai(v), T(this, D, tr).call(this) || this.discard(), m;
      }
  }
  if (I = null, s.length > 0) {
    var r = Ss.ensure();
    for (const v of s)
      r.schedule(v);
  }
  if (Wn = null, bs = null, T(this, D, tr).call(this)) {
    T(this, D, dn).call(this, n), T(this, D, dn).call(this, t);
    for (const [v, m] of f(this, st))
      Ti(v, m);
    s.length > 0 && /** @type {unknown} */
    T(c = I, D, Un).call(c);
    return;
  }
  const i = T(this, D, xi).call(this);
  if (i) {
    T(this, D, dn).call(this, n), T(this, D, dn).call(this, t), T(l = i, D, Ei).call(l, this);
    return;
  }
  f(this, nt).clear();
  for (const v of f(this, gn)) v(this);
  f(this, gn).clear(), hn = this, Br(n), Br(t), hn = null, f(this, mn)?.resolve();
  var a = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    I
  );
  f(this, _n) === 0 && (f(this, _t).length === 0 || a !== null) && T(this, D, Bn).call(this), a !== null && (lt.clear(), T(u = a, D, Un).call(u));
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
    var i = r.f, a = (i & (Xe | It)) !== 0, c = a && (i & oe) !== 0, l = c || (i & Se) !== 0 || f(this, st).has(r);
    if (!l && r.fn !== null) {
      a ? r.f ^= oe : (i & xn) !== 0 ? n.push(r) : is(r) && ((i & We) !== 0 && this.add_dirty_reaction(r, ze), Tn(r));
      var u = r.first;
      if (u !== null) {
        r = u;
        continue;
      }
    }
    for (; r !== null; ) {
      var v = r.next;
      if (v !== null) {
        r = v;
        break;
      }
      r = r.parent;
    }
  }
}, xi = function() {
  for (var t = this.prev; t !== null; t = t.prev)
    if (!t.is_fork && T(this, D, yi).call(this, t)) return t;
  return null;
}, /** @param {Batch} batch */
yi = function(t) {
  for (const [n, [, s]] of this.current)
    if (!s && t.current.has(n))
      return !0;
  return !1;
}, /**
 * @param {Batch} batch
 */
Ei = function(t) {
  var s;
  for (const [r, i] of t.current)
    !this.previous.has(r) && t.previous.has(r) && this.previous.set(r, t.previous.get(r)), this.current.set(r, i);
  for (const [r, i] of t.async_deriveds) {
    const a = this.async_deriveds.get(r);
    a && i.promise.then(a.resolve).catch(a.reject);
  }
  t.async_deriveds.clear(), this.transfer_reactions(f(t, nt));
  const n = (r) => {
    var i = r.reactions;
    if (i !== null && !((r.f & ye) !== 0 && (r.f & (Q | ze)) === 0))
      for (const l of i) {
        var a = l.f;
        if ((a & ye) !== 0)
          n(
            /** @type {Derived} */
            l
          );
        else {
          var c = (
            /** @type {Effect} */
            l
          );
          a & (pn | We) && !this.async_deriveds.has(c) && (f(this, nt).delete(c), ee(c, Q), this.schedule(c));
        }
      }
  };
  for (const r of this.current.keys())
    n(r);
  this.oncommit(() => t.discard()), T(s = t, D, Bn).call(s), I = this, T(this, D, Un).call(this);
}, /**
 * @param {Effect[]} effects
 */
dn = function(t) {
  for (var n = 0; n < t.length; n += 1)
    gi(t[n], f(this, nt));
}, ga = function() {
  var m, w;
  for (let p = Vs; p !== null; p = p.next) {
    var t = p.id < this.id, n = [];
    for (const [b, [S, _]] of this.current) {
      if (p.current.has(b)) {
        var s = (
          /** @type {[any, boolean]} */
          p.current.get(b)[0]
        );
        if (t && S !== s)
          p.current.set(b, [S, _]);
        else
          continue;
      }
      n.push(b);
    }
    if (t)
      for (const [b, S] of this.async_deriveds) {
        const _ = p.async_deriveds.get(b);
        _ && S.promise.then(_.resolve).catch(_.reject);
      }
    var r = [...p.current.keys()].filter(
      (b) => !/** @type {[any, boolean]} */
      p.current.get(b)[1]
    );
    if (!(!p.started || r.length === 0)) {
      var i = r.filter((b) => !this.current.has(b));
      if (i.length === 0)
        t && p.discard();
      else if (n.length > 0) {
        if (t)
          for (const b of f(this, kn))
            p.unskip_effect(b, (S) => {
              var _;
              (S.f & (We | pn)) !== 0 ? p.schedule(S) : T(_ = p, D, dn).call(_, [S]);
            });
        p.activate();
        var a = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
        for (var l of n)
          Si(l, i, a, c);
        c = /* @__PURE__ */ new Map();
        var u = [...p.current].filter(([b, S]) => {
          const _ = this.current.get(b);
          return _ ? _[0] !== S[0] || _[1] !== S[1] : !0;
        }).map(([b]) => b);
        if (u.length > 0)
          for (const b of f(this, Xn))
            (b.f & (we | Se | ks)) === 0 && _r(b, u, c) && ((b.f & (pn | We)) !== 0 ? (ee(b, Q), p.schedule(b)) : p.add_dirty_reaction(b, Q));
        if (f(p, _t).length > 0 && !f(p, Yt)) {
          p.apply();
          for (var v of T(m = p, D, nr).call(m))
            T(w = p, D, sr).call(w, v, [], []);
        }
        p.deactivate();
      }
    }
  }
}, Bn = function() {
  if (this.linked) {
    var t = this.prev, n = this.next;
    t === null ? Vs = n : t.next = n, n === null ? an = t : n.prev = t, this.linked = !1;
  }
};
let Qt = Ss;
function ba(e) {
  var t = Gn, n = hn;
  hn = null, Gn = !0;
  try {
    for (var s; ; ) {
      if (ia(), I === null)
        return (
          /** @type {T} */
          s
        );
      I.flush();
    }
  } finally {
    Gn = t, hn = n;
  }
}
function _a() {
  try {
    ea();
  } catch (e) {
    ot(e, er);
  }
}
let gt = null;
function Br(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var s = e[n++];
      if ((s.f & (we | Se)) === 0 && is(s) && (gt = /* @__PURE__ */ new Set(), Tn(s), s.deps === null && s.first === null && s.nodes === null && s.teardown === null && s.ac === null && ji(s), gt?.size > 0)) {
        lt.clear();
        for (const r of gt) {
          if ((r.f & (we | Se)) !== 0) continue;
          const i = [r];
          let a = r.parent;
          for (; a !== null; )
            gt.has(a) && (gt.delete(a), i.push(a)), a = a.parent;
          for (let c = i.length - 1; c >= 0; c--) {
            const l = i[c];
            (l.f & (we | Se)) === 0 && Tn(l);
          }
        }
        gt.clear();
      }
    }
    gt = null;
  }
}
function Si(e, t, n, s) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const r of e.reactions) {
      const i = r.f;
      (i & ye) !== 0 ? Si(
        /** @type {Derived} */
        r,
        t,
        n,
        s
      ) : (i & (pn | We)) !== 0 && (i & Q) === 0 && _r(r, t, s) && (ee(r, Q), mr(
        /** @type {Effect} */
        r
      ));
    }
}
function _r(e, t, n) {
  const s = n.get(e);
  if (s !== void 0) return s;
  if (e.deps !== null)
    for (const r of e.deps) {
      if (Kn.call(t, r))
        return !0;
      if ((r.f & ye) !== 0 && _r(
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
function mr(e) {
  I.schedule(e);
}
function Ti(e, t) {
  if (!((e.f & Xe) !== 0 && (e.f & oe) !== 0)) {
    (e.f & Q) !== 0 ? t.d.push(e) : (e.f & ze) !== 0 && t.m.push(e), ee(e, oe);
    for (var n = e.first; n !== null; )
      Ti(n, t), n = n.next;
  }
}
function Ai(e) {
  ee(e, oe);
  for (var t = e.first; t !== null; )
    Ai(t), t = t.next;
}
let ys = /* @__PURE__ */ new Set();
const lt = /* @__PURE__ */ new Map();
let Ci = !1;
function Xt(e, t) {
  var n = {
    f: 0,
    v: e,
    reactions: null,
    equals: fi,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function M(e, t) {
  const n = Xt(e);
  return Pa(n), n;
}
// @__NO_SIDE_EFFECTS__
function ma(e, t = !1, n = !0) {
  const s = Xt(e);
  return t || (s.equals = ui), s;
}
function g(e, t, n = !1) {
  R !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!$e || (R.f & ks) !== 0) && pi() && (R.f & (ye | We | pn | ks)) !== 0 && (ct === null || !ct.has(e)) && sa();
  let s = n ? Ge(t) : t;
  return Sn(e, s, bs);
}
var Ut = null, rr = 0;
function Sn(e, t, n = null) {
  if (!e.equals(t)) {
    Lt ? lt.set(e, t) : lt.has(e) || lt.set(e, e.v);
    var s = Qt.ensure();
    if (s.capture(e, t), (e.f & ye) !== 0) {
      const r = (
        /** @type {Derived} */
        e
      );
      (e.f & Q) !== 0 && br(r), Je === null && gr(r);
    }
    e.wv = Bi(), Ut = null, rr = 0, Mi(e, Q, n), Ut = null, j !== null && (j.f & oe) !== 0 && (j.f & (Xe | It)) === 0 && (He === null ? Ia([e]) : He.push(e)), !s.is_fork && ys.size > 0 && !Ci && ka();
  }
  return t;
}
function ka() {
  Ci = !1;
  for (const e of ys) {
    (e.f & oe) !== 0 && ee(e, ze);
    let t;
    try {
      t = is(e);
    } catch {
      t = !0;
    }
    t && Tn(e);
  }
  ys.clear();
}
function Jn(e) {
  g(e, e.v + 1);
}
function Mi(e, t, n) {
  var s = e.reactions;
  if (s !== null) {
    var r = s.length;
    if (rr += r, rr > 1e5 && Ut === null && (Ut = /* @__PURE__ */ new Set()), Ut !== null) {
      if (Ut.has(e)) return;
      Ut.add(e);
    }
    for (var i = 0; i < r; i++) {
      var a = s[i], c = a.f, l = (c & Q) === 0;
      if (l && ee(a, t), (c & ks) !== 0)
        ys.add(
          /** @type {Effect} */
          a
        );
      else if ((c & ye) !== 0) {
        var u = (
          /** @type {Derived} */
          a
        );
        Je?.delete(u), Mi(u, ze, n);
      } else if (l) {
        var v = (
          /** @type {Effect} */
          a
        );
        (c & We) !== 0 && gt !== null && gt.add(v), n !== null ? n.push(v) : mr(v);
      }
    }
  }
}
function Ge(e) {
  if (typeof e != "object" || e === null || ps in e || oi in e)
    return e;
  const t = si(e);
  if (t !== Po && t !== Io)
    return e;
  var n = /* @__PURE__ */ new Map(), s = ti(e), r = /* @__PURE__ */ M(0), i = $t, a = (c) => {
    if ($t === i)
      return c();
    var l = R, u = $t;
    qe(null), Yr(i);
    var v = c();
    return qe(l), Yr(u), v;
  };
  return s && n.set("length", /* @__PURE__ */ M(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(c, l, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && ta();
        var v = n.get(l);
        return v === void 0 ? a(() => {
          var m = /* @__PURE__ */ M(u.value);
          return n.set(l, m), m;
        }) : g(v, u.value, !0), !0;
      },
      deleteProperty(c, l) {
        var u = n.get(l);
        if (u === void 0) {
          if (l in c) {
            const v = a(() => /* @__PURE__ */ M(ie));
            n.set(l, v), Jn(r);
          }
        } else
          g(u, ie), Jn(r);
        return !0;
      },
      get(c, l, u) {
        if (l === ps)
          return e;
        var v = n.get(l), m = l in c;
        if (v === void 0 && (!m || Yn(c, l)?.writable) && (v = a(() => {
          var p = Ge(m ? c[l] : ie), b = /* @__PURE__ */ M(p);
          return b;
        }), n.set(l, v)), v !== void 0) {
          var w = o(v);
          return w === ie ? void 0 : w;
        }
        return Reflect.get(c, l, u);
      },
      getOwnPropertyDescriptor(c, l) {
        this.has?.(c, l);
        var u = Reflect.getOwnPropertyDescriptor(c, l), v = n.get(l);
        if (v !== void 0) {
          var m = o(v);
          if (m === ie)
            return;
          if (u && "value" in u)
            u.value = m;
          else
            return {
              enumerable: !0,
              configurable: !0,
              value: m,
              writable: !0
            };
        }
        return u;
      },
      has(c, l) {
        if (l === ps)
          return !0;
        var u = n.get(l), v = u !== void 0 && u.v !== ie || Reflect.has(c, l);
        if (u !== void 0 || (j !== null || R !== null) && (!v || Yn(c, l)?.writable)) {
          u === void 0 && (u = a(() => {
            var w = v ? Ge(c[l]) : ie, p = /* @__PURE__ */ M(w);
            return p;
          }), n.set(l, u));
          var m = o(u);
          if (m === ie)
            return !1;
        }
        return v;
      },
      set(c, l, u, v) {
        var m = n.get(l), w = l in c;
        if (s && l === "length")
          for (var p = u; p < /** @type {Source<number>} */
          m.v; p += 1) {
            var b = n.get(p + "");
            b !== void 0 ? g(b, ie) : p in c && (b = a(() => /* @__PURE__ */ M(ie)), n.set(p + "", b));
          }
        if (m === void 0)
          (!w || Yn(c, l)?.writable) && (m = a(() => /* @__PURE__ */ M(void 0)), g(m, Ge(u)), n.set(l, m));
        else {
          w = m.v !== ie;
          var S = a(() => Ge(u));
          g(m, S);
        }
        var _ = Reflect.getOwnPropertyDescriptor(c, l);
        if (_?.set && _.set.call(v, u), !w) {
          if (s && typeof l == "string") {
            var A = (
              /** @type {Source<number>} */
              n.get("length")
            ), J = Number(l);
            Number.isInteger(J) && J >= A.v && g(A, J + 1);
          }
          Jn(r);
        }
        return !0;
      },
      ownKeys(c) {
        o(r);
        var l = Reflect.ownKeys(c).filter((m) => {
          var w = n.get(m);
          return w === void 0 || w.v !== ie;
        });
        for (var [u, v] of n)
          v.v !== ie && !(u in c) && l.push(u);
        return l;
      },
      setPrototypeOf() {
        na();
      }
    }
  );
}
var Vr, Pi, Ii, Li;
function wa() {
  if (Vr === void 0) {
    Vr = window, Pi = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Ii = Yn(t, "firstChild").get, Li = Yn(t, "nextSibling").get, Fr(e) && (e[Xs] = void 0, e[hs] = null, e[Zs] = void 0, e.__e = void 0), Fr(n) && (n[Fn] = void 0);
  }
}
function kt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Ke(e) {
  return (
    /** @type {TemplateNode | null} */
    Ii.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function rs(e) {
  return (
    /** @type {TemplateNode | null} */
    Li.call(e)
  );
}
function N(e, t) {
  return /* @__PURE__ */ Ke(e);
}
function Ft(e, t = !1) {
  {
    var n = /* @__PURE__ */ Ke(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ rs(n) : n;
  }
}
function be(e, t = !1) {
  return /* @__PURE__ */ Ke(e);
}
function P(e, t = 1, n = !1) {
  let s = e;
  for (; t--; )
    s = /** @type {TemplateNode} */
    /* @__PURE__ */ rs(s);
  return s;
}
function xa(e) {
  e.textContent = "";
}
function Ni() {
  return !1;
}
function kr(e, t, n) {
  return t == null || t === ci ? (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElement(e)
  ) : (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t, e)
  );
}
function ya(e) {
  var t = j;
  if (t === null)
    return R.f |= Pt, e;
  if ((t.f & An) === 0 && (t.f & xn) === 0)
    throw e;
  ot(e, t);
}
function ot(e, t) {
  if (e === li)
    throw e;
  if (!(t !== null && (t.f & we) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & Qs) !== 0 && (t.f & (we | $n)) === 0) {
        if ((t.f & An) === 0)
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
}
function Ea(e) {
  j === null && (R === null && Zo(), Xo()), Lt && Qo();
}
function Sa(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function wt(e, t) {
  var n = j;
  n !== null && (n.f & Se) !== 0 && (e |= Se);
  var s = {
    ctx: xe,
    deps: null,
    nodes: null,
    f: e | Q | Qe,
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
  I?.register_created_effect(s);
  var r = s;
  if ((e & xn) !== 0)
    Wn !== null ? Wn.push(s) : Qt.ensure().schedule(s);
  else if (t !== null) {
    try {
      Tn(s);
    } catch (a) {
      throw Ce(s), a;
    }
    r.deps === null && r.teardown === null && r.nodes === null && r.first === r.last && // either `null`, or a singular child
    (r.f & Cn) === 0 && (r = r.first, (e & We) !== 0 && (e & yn) !== 0 && r !== null && (r.f |= yn));
  }
  if (r !== null && (r.parent = n, n !== null && Sa(r, n), R !== null && (R.f & ye) !== 0 && (e & It) === 0)) {
    var i = (
      /** @type {Derived} */
      R
    );
    (i.effects ?? (i.effects = [])).push(r);
  }
  return s;
}
function wr() {
  return R !== null && !$e;
}
function Ta(e) {
  const t = wt(Ms, null);
  return ee(t, oe), t.teardown = e, t;
}
function _s(e) {
  Ea();
  var t = (
    /** @type {Effect} */
    j.f
  ), n = !R && (t & Xe) !== 0 && xe !== null && !xe.i;
  if (n) {
    var s = (
      /** @type {ComponentContext} */
      xe
    );
    (s.e ?? (s.e = [])).push(e);
  } else
    return Ri(e);
}
function Ri(e) {
  return wt(xn | Oo, e);
}
function Aa(e) {
  Qt.ensure();
  const t = wt(It | Cn, e);
  return (n = {}) => new Promise((s) => {
    n.outro ? Kt(t, () => {
      Ce(t), s(void 0);
    }) : (Ce(t), s(void 0));
  });
}
function Oi(e) {
  return wt(xn, e);
}
function Ca(e) {
  return wt(pn | Cn, e);
}
function xr(e, t = 0) {
  return wt(Ms | t, e);
}
function me(e, t = [], n = [], s = []) {
  ca(s, t, n, (r) => {
    wt(Ms, () => {
      e(...r.map(o));
    });
  });
}
function yr(e, t = 0) {
  var n = wt(We | t, e);
  return n;
}
function Ve(e) {
  return wt(Xe | Cn, e);
}
function Di(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Lt, s = R;
    qr(!0), qe(null);
    try {
      t.call(null);
    } catch (r) {
      ot(r, e.parent);
    } finally {
      qr(n), qe(s);
    }
  }
}
function Er(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const r = n.ac;
    r !== null && ss(() => {
      r.abort(ns);
    });
    var s = n.next;
    (n.f & It) !== 0 ? n.parent = null : Ce(n, t), n = s;
  }
}
function Ma(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Xe) === 0 && Ce(t), t = n;
  }
}
function Ce(e, t = !0) {
  var n = !1;
  (t || (e.f & Ro) !== 0) && e.nodes !== null && e.nodes.end !== null && (zi(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), e.f |= $n, Er(e, t && !n), Qn(e, 0);
  var s = e.nodes && e.nodes.t;
  if (s !== null)
    for (const i of s)
      i.stop();
  Di(e), e.f ^= $n, e.f |= we;
  var r = e.parent;
  r !== null && r.first !== null && ji(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function zi(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ rs(e);
    e.remove(), e = n;
  }
}
function ji(e) {
  var t = e.parent, n = e.prev, s = e.next;
  n !== null && (n.next = s), s !== null && (s.prev = n), t !== null && (t.first === e && (t.first = s), t.last === e && (t.last = n));
}
function Kt(e, t, n = !0) {
  var s = [];
  e.f |= pr, Fi(e, s, !0);
  var r = () => {
    n && Ce(e), t && t();
  }, i = s.length;
  if (i > 0) {
    var a = () => --i || r();
    for (var c of s)
      c.out(a);
  } else
    r();
}
function Fi(e, t, n) {
  if ((e.f & Se) === 0) {
    e.f ^= Se;
    var s = e.nodes && e.nodes.t;
    if (s !== null)
      for (const c of s)
        (c.is_global || n) && t.push(c);
    for (var r = e.first; r !== null; ) {
      var i = r.next;
      if ((r.f & It) === 0) {
        var a = (r.f & yn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (r.f & Xe) !== 0 && (e.f & We) !== 0;
        Fi(r, t, a ? n : !1);
      }
      r = i;
    }
  }
}
function Es(e) {
  e.f &= ~pr, Hi(e, !0);
}
function Hi(e, t) {
  if ((e.f & pr) === 0 && (e.f & Se) !== 0) {
    e.f ^= Se, (e.f & oe) === 0 && (ee(e, Q), Qt.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var s = n.next, r = (n.f & yn) !== 0 || (n.f & Xe) !== 0;
      Hi(n, r ? t : !1), n = s;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const a of i)
        (a.is_global || t) && a.in();
  }
}
function Sr(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, s = e.nodes.end; n !== null; ) {
      var r = n === s ? null : /* @__PURE__ */ rs(n);
      t.append(n), n = r;
    }
}
let Lt = !1;
function qr(e) {
  Lt = e;
}
let R = null, $e = !1;
function qe(e) {
  R = e;
}
let j = null;
function ft(e) {
  j = e;
}
let ct = null;
function Pa(e) {
  R !== null && ((R.f & ws) !== 0 || (R.f & ye) !== 0) && (ct ?? (ct = /* @__PURE__ */ new Set())).add(e);
}
let Ae = null, De = 0, He = null;
function Ia(e) {
  He = e;
}
let Ui = 1, Vt = 0, $t = Vt;
function Yr(e) {
  $t = e;
}
function Bi() {
  return ++Ui;
}
function is(e) {
  var t = e.f;
  if ((t & Q) !== 0)
    return !0;
  if ((t & ze) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), s = n.length, r = 0; r < s; r++) {
      var i = n[r];
      if (is(
        /** @type {Derived} */
        i
      ) && mi(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & Qe) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Je === null && ee(e, oe);
  }
  return !1;
}
function Vi(e, t, n = !0) {
  var s = e.reactions;
  if (s !== null && !(ct !== null && ct.has(e)))
    for (var r = 0; r < s.length; r++) {
      var i = s[r];
      (i.f & ye) !== 0 ? Vi(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? ee(i, Q) : (i.f & oe) !== 0 && ee(i, ze), mr(
        /** @type {Effect} */
        i
      ));
    }
}
function qi(e) {
  var t = Ae, n = De, s = He, r = R, i = ct, a = xe, c = $e, l = $t, u = e.f;
  Ae = /** @type {null | Value[]} */
  null, De = 0, He = null, R = (u & (Xe | It)) === 0 ? e : null, ct = null, En(e.ctx), $e = !1, $t = ++Vt, e.ac !== null && (ss(() => {
    e.ac.abort(ns);
  }), e.ac = null);
  try {
    e.f |= ws;
    var v = (
      /** @type {Function} */
      e.fn
    ), m = v();
    e.f |= An;
    var w = Gr(e);
    if (pi() && He !== null && !$e && w !== null && (e.f & (ye | ze | Q)) === 0)
      for (var p = 0; p < /** @type {Source[]} */
      He.length; p++)
        Vi(
          He[p],
          /** @type {Effect} */
          e
        );
    if (r !== null && r !== e) {
      if (Vt++, r.deps !== null)
        for (let b = 0; b < n; b += 1)
          r.deps[b].rv = Vt;
      if (t !== null)
        for (const b of t)
          b.rv = Vt;
      He !== null && (s === null ? s = He : s.push(.../** @type {Source[]} */
      He));
    }
    return (e.f & Pt) !== 0 && (e.f ^= Pt), m;
  } catch (b) {
    return Gr(e), ya(b);
  } finally {
    e.f ^= ws, Ae = t, De = n, He = s, R = r, ct = i, En(a), $e = c, $t = l;
  }
}
function Gr(e) {
  var r;
  var t = e.deps, n = I?.is_fork;
  if (Ae !== null) {
    var s;
    if (n || Qn(e, De), t !== null && De > 0)
      for (t.length = De + Ae.length, s = 0; s < Ae.length; s++)
        t[De + s] = Ae[s];
    else
      e.deps = t = Ae;
    if (wr() && (e.f & Qe) !== 0)
      for (s = De; s < t.length; s++)
        ((r = t[s]).reactions ?? (r.reactions = [])).push(e);
  } else !n && t !== null && De < t.length && (Qn(e, De), t.length = De);
  return t;
}
function La(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var s = Co.call(n, e);
    if (s !== -1) {
      var r = n.length - 1;
      r === 0 ? n = t.reactions = null : (n[s] = n[r], n.pop());
    }
  }
  if (n === null && (t.f & ye) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Ae === null || !Kn.call(Ae, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & Qe) !== 0 && (i.f ^= Qe), i.v !== ie && gr(i), i.ac !== null && ss(() => {
      i.ac.abort(ns), i.ac = null, ee(i, Q);
    }), pa(i), Qn(i, 0);
  }
}
function Qn(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var s = t; s < n.length; s++)
      La(e, n[s]);
}
function Tn(e) {
  var t = e.f;
  if ((t & we) === 0) {
    ee(e, oe);
    var n = j;
    j = e;
    try {
      (t & (We | ii)) !== 0 ? Ma(e) : Er(e), Di(e);
      var s = qi(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = Ui;
      var r;
    } finally {
      j = n;
    }
  }
}
async function vn() {
  await Promise.resolve(), ba();
}
function o(e) {
  var t = e.f, n = (t & ye) !== 0;
  if (R !== null && !$e) {
    var s = j !== null && (j.f & we) !== 0;
    if (!s && (ct === null || !ct.has(e))) {
      var r = R.deps;
      if ((R.f & ws) !== 0)
        e.rv < Vt && (e.rv = Vt, Ae === null && r !== null && r[De] === e ? De++ : Ae === null ? Ae = [e] : Ae.push(e));
      else {
        R.deps ?? (R.deps = []), Kn.call(R.deps, e) || R.deps.push(e);
        var i = e.reactions;
        i === null ? e.reactions = [R] : Kn.call(i, R) || i.push(R);
      }
    }
  }
  if (Lt && lt.has(e))
    return lt.get(e);
  if (n) {
    var a = (
      /** @type {Derived} */
      e
    );
    if (Lt) {
      var c = a.v;
      return ((a.f & oe) === 0 && a.reactions !== null || Gi(a)) && (c = br(a)), lt.set(a, c), c;
    }
    var l = (a.f & Qe) === 0 && !$e && R !== null && (R.f & Qe) !== 0, u = (a.f & An) === 0;
    is(a) && (l && (a.f |= Qe), mi(a)), l && !u && (ki(a), Yi(a));
  }
  if (Je?.has(e))
    return Je.get(e);
  if ((e.f & Pt) !== 0)
    throw e.v;
  return e.v;
}
function Yi(e) {
  if (e.f |= Qe, e.deps !== null)
    for (const n of e.deps) {
      var t = n.reactions;
      t === null ? n.reactions = [e] : Kn.call(t, e) || t.push(e), (n.f & ye) !== 0 && (n.f & Qe) === 0 && (ki(
        /** @type {Derived} */
        n
      ), Yi(
        /** @type {Derived} */
        n
      ));
    }
}
function Gi(e) {
  if (e.v === ie) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (lt.has(t) || (t.f & ye) !== 0 && Gi(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ps(e) {
  var t = $e;
  try {
    return $e = !0, e();
  } finally {
    $e = t;
  }
}
const Na = ["touchstart", "touchmove"];
function Ra(e) {
  return Na.includes(e);
}
const qt = Symbol("events"), Wi = /* @__PURE__ */ new Set(), ir = /* @__PURE__ */ new Set();
function ne(e, t, n) {
  (t[qt] ?? (t[qt] = {}))[e] = n;
}
function Oa(e) {
  for (var t = 0; t < e.length; t++)
    Wi.add(e[t]);
  for (var n of ir)
    n(e);
}
let Ys = null, Gs = !1;
function Wr(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), s = e.type, r = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    r[0] || e.target
  );
  Ys = e, Gs || (Gs = !0, setTimeout(() => {
    Gs = !1, Ys = null;
  }));
  var a = 0, c = Ys === e && e[qt];
  if (c) {
    var l = r.indexOf(c);
    if (l !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[qt] = t;
      return;
    }
    var u = r.indexOf(t);
    if (u === -1)
      return;
    l <= u && (a = l);
  }
  if (i = /** @type {Element} */
  r[a] || e.target, i !== t) {
    ni(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var v = R, m = j;
    qe(null), ft(null);
    try {
      for (var w, p = []; i !== null && i !== t; ) {
        try {
          var b = i[qt]?.[s];
          b != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i) && b.call(i, e);
        } catch (S) {
          w ? p.push(S) : w = S;
        }
        if (e.cancelBubble) break;
        a++, i = a < r.length ? (
          /** @type {Element} */
          r[a]
        ) : null;
      }
      if (w) {
        for (let S of p)
          queueMicrotask(() => {
            throw S;
          });
        throw w;
      }
    } finally {
      e[qt] = t, delete e.currentTarget, qe(v), ft(m);
    }
  }
}
const Da = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function za(e) {
  return (
    /** @type {string} */
    Da?.createHTML(e) ?? e
  );
}
function Ji(e) {
  var t = kr("template");
  return t.innerHTML = za(e.replaceAll("<!>", "<!---->")), t.content;
}
function Zt(e, t) {
  var n = (
    /** @type {Effect} */
    j
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function F(e, t) {
  var n = (t & Uo) !== 0, s = (t & Bo) !== 0, r, i = !e.startsWith("<!>");
  return () => {
    r === void 0 && (r = Ji(i ? e : "<!>" + e), n || (r = /** @type {TemplateNode} */
    /* @__PURE__ */ Ke(r)));
    var a = (
      /** @type {TemplateNode} */
      s || Pi ? document.importNode(r, !0) : r.cloneNode(!0)
    );
    if (n) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Ke(a)
      ), l = (
        /** @type {TemplateNode} */
        a.lastChild
      );
      Zt(c, l);
    } else
      Zt(a, a);
    return a;
  };
}
// @__NO_SIDE_EFFECTS__
function ja(e, t, n = "svg") {
  var s = !e.startsWith("<!>"), r = `<${n}>${s ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var a = (
        /** @type {DocumentFragment} */
        Ji(r)
      ), c = (
        /** @type {Element} */
        /* @__PURE__ */ Ke(a)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ Ke(c);
    }
    var l = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return Zt(l, l), l;
  };
}
// @__NO_SIDE_EFFECTS__
function Is(e, t) {
  return /* @__PURE__ */ ja(e, t, "svg");
}
function ln(e = "") {
  {
    var t = kt(e + "");
    return Zt(t, t), t;
  }
}
function cn() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = kt();
  return e.append(t, n), Zt(t, n), e;
}
function E(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function Fa(e) {
  let t = 0, n = Xt(0), s;
  return () => {
    wr() && (o(n), xr(() => (t === 0 && (s = Ps(() => e(() => Jn(n)))), t += 1, () => {
      Mt(() => {
        t -= 1, t === 0 && (s?.(), s = void 0, Jn(n));
      });
    })));
  };
}
var Ha = yn | Cn;
function Ua(e, t, n, s) {
  new Ba(e, t, n, s);
}
var Ue, vr, Be, Gt, ke, Ne, Ee, Re, rt, Wt, Ct, wn, Zn, mt, Ts, z, Va, qa, or, At, Ya, ar, Vn, ms, lr, cr;
class Ba {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, s, r) {
    O(this, z);
    /** @type {Boundary | null} */
    ge(this, "parent");
    ge(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    ge(this, "transform_error");
    /** @type {TemplateNode} */
    O(this, Ue);
    /** @type {TemplateNode | null} */
    O(this, vr, null);
    /** @type {BoundaryProps} */
    O(this, Be);
    /** @type {((anchor: Node) => void)} */
    O(this, Gt);
    /** @type {Effect} */
    O(this, ke);
    /** @type {Effect | null} */
    O(this, Ne, null);
    /** @type {Effect | null} */
    O(this, Ee, null);
    /** @type {Effect | null} */
    O(this, Re, null);
    /** @type {DocumentFragment | null} */
    O(this, rt, null);
    O(this, Wt, 0);
    O(this, Ct, 0);
    O(this, wn, !1);
    /** @type {Map<Effect, number>} */
    O(this, Zn, /* @__PURE__ */ new Map());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    O(this, mt, null);
    O(this, Ts, Fa(() => (L(this, mt, Xt(f(this, Wt))), () => {
      L(this, mt, null);
    })));
    L(this, Ue, t), L(this, Be, n), L(this, Gt, (i) => {
      var a = (
        /** @type {Effect} */
        j
      );
      a.b = this, a.f |= Qs, s(i);
    }), this.parent = /** @type {Effect} */
    j.b, this.transform_error = r ?? this.parent?.transform_error ?? ((i) => i), L(this, ke, yr(() => {
      T(this, z, ar).call(this);
    }, Ha));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    gi(t, f(this, Zn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!f(this, Be).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    T(this, z, lr).call(this, t, n), L(this, Wt, f(this, Wt) + t), !(!f(this, mt) || f(this, wn)) && (L(this, wn, !0), Mt(() => {
      L(this, wn, !1), f(this, mt) && Sn(f(this, mt), f(this, Wt));
    }));
  }
  get_effect_pending() {
    return f(this, Ts).call(this), o(
      /** @type {Source<number>} */
      f(this, mt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (t === li || !f(this, Be).onerror && !f(this, Be).failed)
      throw t;
    I?.is_fork ? (f(this, Ne) && I.skip_effect(f(this, Ne)), f(this, Ee) && I.skip_effect(f(this, Ee)), f(this, Re) && I.skip_effect(f(this, Re)), I.oncommit(() => {
      T(this, z, At).call(this) || T(this, z, cr).call(this, t);
    })) : T(this, z, cr).call(this, t);
  }
}
Ue = new WeakMap(), vr = new WeakMap(), Be = new WeakMap(), Gt = new WeakMap(), ke = new WeakMap(), Ne = new WeakMap(), Ee = new WeakMap(), Re = new WeakMap(), rt = new WeakMap(), Wt = new WeakMap(), Ct = new WeakMap(), wn = new WeakMap(), Zn = new WeakMap(), mt = new WeakMap(), Ts = new WeakMap(), z = new WeakSet(), Va = function() {
  try {
    L(this, Ne, Ve(() => f(this, Gt).call(this, f(this, Ue))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
qa = function(t) {
  const n = f(this, Be).failed, { reset: s, invoke_onerror: r } = T(this, z, or).call(this, t);
  Mt(r), n && L(this, Re, Ve(() => {
    n(
      f(this, Ue),
      () => t,
      () => s
    );
  }));
}, /**
 * Creates the `reset` function for a failed boundary, along with a function
 * that invokes `onerror` with it (if provided)
 * @param {unknown} error
 * @returns {{ reset: () => void, invoke_onerror: () => void }}
 */
or = function(t) {
  var n = !1, s = !1;
  const r = () => {
    if (!T(this, z, At).call(this)) {
      if (n) {
        Go();
        return;
      }
      n = !0, s && ra(), f(this, Re) !== null && Kt(f(this, Re), () => {
        L(this, Re, null);
      }), T(this, z, ms).call(this, () => {
        T(this, z, ar).call(this);
      });
    }
  };
  return { reset: r, invoke_onerror: () => {
    if (!T(this, z, At).call(this))
      try {
        s = !0, f(this, Be).onerror?.(t, r), s = !1;
      } catch (a) {
        ot(a, f(this, ke) && f(this, ke).parent);
      }
  } };
}, At = function() {
  return (f(this, ke).f & (we | $n)) !== 0;
}, Ya = function() {
  const t = f(this, Be).pending;
  t && (this.is_pending = !0, L(this, Ee, Ve(() => t(f(this, Ue)))), Mt(() => {
    if (!T(this, z, At).call(this)) {
      var n = L(this, rt, document.createDocumentFragment()), s = kt(), r = !1;
      if (n.append(s), L(this, Ne, T(this, z, ms).call(this, () => {
        try {
          return Ve(() => f(this, Gt).call(this, s));
        } catch (i) {
          try {
            this.error(i), r = !0;
          } catch (a) {
            ot(a, f(this, ke).parent);
          }
          return null;
        }
      })), f(this, Ne) === null) {
        L(this, rt, null), r && T(this, z, Vn).call(
          this,
          /** @type {Batch} */
          I
        );
        return;
      }
      f(this, Ct) === 0 && (f(this, Ue).before(n), L(this, rt, null), Kt(
        /** @type {Effect} */
        f(this, Ee),
        () => {
          L(this, Ee, null);
        }
      ), T(this, z, Vn).call(
        this,
        /** @type {Batch} */
        I
      ));
    }
  }));
}, ar = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), L(this, Ct, 0), L(this, Wt, 0), L(this, Ne, Ve(() => {
      f(this, Gt).call(this, f(this, Ue));
    })), f(this, Ct) > 0) {
      var t = L(this, rt, document.createDocumentFragment());
      Sr(f(this, Ne), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        f(this, Be).pending
      );
      L(this, Ee, Ve(() => n(f(this, Ue))));
    } else
      T(this, z, Vn).call(
        this,
        /** @type {Batch} */
        I
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
Vn = function(t) {
  this.is_pending = !1, t.transfer_reactions(f(this, Zn));
}, /**
 * @template T
 * @param {() => T} fn
 */
ms = function(t) {
  var n = j, s = R, r = xe;
  ft(f(this, ke)), qe(f(this, ke)), En(f(this, ke).ctx);
  try {
    return Qt.ensure(), t();
  } finally {
    ft(n), qe(s), En(r);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
lr = function(t, n) {
  var s;
  if (!this.has_pending_snippet()) {
    this.parent && T(s = this.parent, z, lr).call(s, t, n);
    return;
  }
  L(this, Ct, f(this, Ct) + t), f(this, Ct) === 0 && (T(this, z, Vn).call(this, n), f(this, Ee) && Kt(f(this, Ee), () => {
    L(this, Ee, null);
  }), f(this, rt) && (f(this, Ue).before(f(this, rt)), L(this, rt, null)));
}, /**
 * @param {unknown} error
 */
cr = function(t) {
  f(this, Ne) && (Ce(f(this, Ne)), L(this, Ne, null)), f(this, Ee) && (Ce(f(this, Ee)), L(this, Ee, null)), f(this, Re) && (Ce(f(this, Re)), L(this, Re, null));
  let n = f(this, Be).failed;
  const s = (r) => {
    if (T(this, z, At).call(this)) return;
    const { reset: i, invoke_onerror: a } = T(this, z, or).call(this, r);
    a(), n && !T(this, z, At).call(this) && L(this, Re, T(this, z, ms).call(this, () => {
      try {
        return Ve(() => {
          var c = (
            /** @type {Effect} */
            j
          );
          c.b = this, c.f |= Qs, n(
            f(this, Ue),
            () => r,
            () => i
          );
        });
      } catch (c) {
        return ot(
          c,
          /** @type {Effect} */
          f(this, ke).parent
        ), null;
      }
    }));
  };
  Mt(() => {
    if (!T(this, z, At).call(this)) {
      var r;
      try {
        r = this.transform_error(t);
      } catch (i) {
        ot(i, f(this, ke) && f(this, ke).parent);
        return;
      }
      r !== null && typeof r == "object" && typeof /** @type {any} */
      r.then == "function" ? r.then(
        s,
        /** @param {unknown} e */
        (i) => ot(i, f(this, ke) && f(this, ke).parent)
      ) : s(r);
    }
  });
};
function _e(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== /** @type {any} */
  (e[Fn] ?? (e[Fn] = e.nodeValue)) && (e[Fn] = n, e.nodeValue = `${n}`);
}
function Ga(e, t) {
  return Wa(e, t);
}
const ds = /* @__PURE__ */ new Map();
function Wa(e, { target: t, anchor: n, props: s = {}, events: r, context: i, intro: a = !0, transformError: c }) {
  wa();
  var l = void 0, u = Aa(() => {
    var v = n ?? t.appendChild(kt());
    Ua(
      /** @type {TemplateNode} */
      v,
      {
        pending: () => {
        }
      },
      (p) => {
        di({});
        var b = (
          /** @type {ComponentContext} */
          xe
        );
        i && (b.c = i), r && (s.$$events = r), l = e(p, s) || hr(), vi();
      },
      c
    );
    var m = /* @__PURE__ */ new Set(), w = (p) => {
      for (var b = 0; b < p.length; b++) {
        var S = p[b];
        if (!m.has(S)) {
          m.add(S);
          var _ = Ra(S);
          for (const ae of [t, document]) {
            var A = ds.get(ae);
            A === void 0 && (A = /* @__PURE__ */ new Map(), ds.set(ae, A));
            var J = A.get(S);
            J === void 0 ? (ae.addEventListener(S, Wr, { passive: _ }), A.set(S, 1)) : A.set(S, J + 1);
          }
        }
      }
    };
    return w(Cs(Wi)), ir.add(w), () => {
      for (var p of m)
        for (const _ of [t, document]) {
          var b = (
            /** @type {Map<string, number>} */
            ds.get(_)
          ), S = (
            /** @type {number} */
            b.get(p)
          );
          --S == 0 ? (_.removeEventListener(p, Wr), b.delete(p), b.size === 0 && ds.delete(_)) : b.set(p, S);
        }
      ir.delete(w), v !== n && v.parentNode?.removeChild(v);
    };
  });
  return fr.set(l, u), l;
}
let fr = /* @__PURE__ */ new WeakMap();
function Ja(e, t) {
  const n = fr.get(e);
  return n ? (fr.delete(e), n(t)) : Promise.resolve();
}
var Ye, it, Oe, Jt, es, ts, As;
class Ka {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    ge(this, "anchor");
    /** @type {Map<Batch, Key>} */
    O(this, Ye, /* @__PURE__ */ new Map());
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
    O(this, it, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    O(this, Oe, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    O(this, Jt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    O(this, es, !0);
    /**
     * @param {Batch} batch
     */
    O(this, ts, (t) => {
      if (f(this, Ye).has(t)) {
        var n = (
          /** @type {Key} */
          f(this, Ye).get(t)
        ), s = f(this, it).get(n);
        if (s)
          Es(s), f(this, Jt).delete(n);
        else {
          var r = f(this, Oe).get(n);
          r && (Es(r.effect), f(this, it).set(n, r.effect), f(this, Oe).delete(n), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), s = r.effect);
        }
        for (const [i, a] of f(this, Ye)) {
          if (f(this, Ye).delete(i), i === t)
            break;
          const c = f(this, Oe).get(a);
          c && (Ce(c.effect), f(this, Oe).delete(a));
        }
        for (const [i, a] of f(this, it)) {
          if (i === n || f(this, Jt).has(i)) continue;
          const c = () => {
            if (Array.from(f(this, Ye).values()).includes(i)) {
              var u = document.createDocumentFragment();
              Sr(a, u), u.append(kt()), f(this, Oe).set(i, { effect: a, fragment: u });
            } else
              Ce(a);
            f(this, Jt).delete(i), f(this, it).delete(i);
          };
          f(this, es) || !s ? (f(this, Jt).add(i), Kt(a, c, !1)) : c();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    O(this, As, (t) => {
      f(this, Ye).delete(t);
      const n = Array.from(f(this, Ye).values());
      for (const [s, r] of f(this, Oe))
        n.includes(s) || (Ce(r.effect), f(this, Oe).delete(s));
    });
    this.anchor = t, L(this, es, n);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var s = (
      /** @type {Batch} */
      I
    ), r = Ni();
    if (n && !f(this, it).has(t) && !f(this, Oe).has(t))
      if (r) {
        var i = document.createDocumentFragment(), a = kt();
        i.append(a), f(this, Oe).set(t, {
          effect: Ve(() => n(a)),
          fragment: i
        });
      } else
        f(this, it).set(
          t,
          Ve(() => n(this.anchor))
        );
    if (f(this, Ye).set(s, t), r) {
      for (const [c, l] of f(this, it))
        c === t ? s.unskip_effect(l) : s.skip_effect(l);
      for (const [c, l] of f(this, Oe))
        c === t ? s.unskip_effect(l.effect) : s.skip_effect(l.effect);
      s.oncommit(f(this, ts)), s.ondiscard(f(this, As));
    } else
      f(this, ts).call(this, s);
  }
}
Ye = new WeakMap(), it = new WeakMap(), Oe = new WeakMap(), Jt = new WeakMap(), es = new WeakMap(), ts = new WeakMap(), As = new WeakMap();
function Y(e, t, n = !1) {
  var s = new Ka(e), r = n ? yn : 0;
  function i(a, c) {
    s.ensure(a, c);
  }
  yr(() => {
    var a = !1;
    t((c, l = 0) => {
      a = !0, i(l, c);
    }), a || i(-1, null);
  }, r);
}
function fn(e, t) {
  return t;
}
function $a(e, t, n) {
  for (var s = [], r = t.length, i, a = t.length, c = 0; c < r; c++) {
    let m = t[c];
    Kt(
      m,
      () => {
        if (i) {
          if (i.pending.delete(m), i.done.add(m), i.pending.size === 0) {
            var w = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            ur(e, Cs(i.done)), w.delete(i), w.size === 0 && (e.outrogroups = null);
          }
        } else
          a -= 1;
      },
      !1
    );
  }
  if (a === 0) {
    var l = s.length === 0 && n !== null && e.pending.size === 0;
    if (l) {
      var u = (
        /** @type {Element} */
        n
      ), v = (
        /** @type {Element} */
        u.parentNode
      );
      xa(v), v.append(u), e.items.clear();
    }
    ur(e, t, !l);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function ur(e, t, n = !0) {
  var s;
  if (e.pending.size > 0) {
    s = /* @__PURE__ */ new Set();
    for (const a of e.pending.values())
      for (const c of a)
        s.add(
          /** @type {EachItem} */
          e.items.get(c).e
        );
  }
  for (var r = 0; r < t.length; r++) {
    var i = t[r];
    if (s?.has(i)) {
      i.f |= at;
      const a = document.createDocumentFragment();
      Sr(i, a);
    } else
      Ce(t[r], n);
  }
}
var Jr;
function un(e, t, n, s, r, i = null) {
  var a = e, c = /* @__PURE__ */ new Map(), l = (t & ai) !== 0;
  if (l) {
    var u = (
      /** @type {Element} */
      e
    );
    a = u.appendChild(kt());
  }
  var v = null, m = /* @__PURE__ */ da(() => {
    var J = n();
    return (
      /** @type {V[]} */
      ti(J) ? J : J == null ? [] : Cs(J)
    );
  }), w = /* @__PURE__ */ new Map(), p = !0;
  function b(J) {
    if ((A.effect.f & we) === 0) {
      A.pending.delete(J);
      var ae = o(m);
      A.fallback = v, Qa(A, ae, a, t, s), v !== null && (ae.length === 0 ? (v.f & at) === 0 ? Es(v) : (v.f ^= at, qn(v, null, a)) : Kt(v, () => {
        v = null;
      }));
    }
  }
  function S(J) {
    A.pending.delete(J);
  }
  var _ = yr(() => {
    for (var J = (
      /** @type {V[]} */
      o(m)
    ), ae = J.length, le = /* @__PURE__ */ new Set(), te = (
      /** @type {Batch} */
      I
    ), ce = Ni(), de = 0; de < ae; de += 1) {
      var Ze = J[de], ut = s(Ze, de), G = p ? null : c.get(ut);
      G ? (G.v && Sn(G.v, Ze), G.i && Sn(G.i, de), ce && te.unskip_effect(G.e)) : (G = Xa(
        c,
        p ? a : Jr ?? (Jr = kt()),
        Ze,
        ut,
        de,
        r,
        t,
        n
      ), p || (G.e.f |= at), c.set(ut, G)), le.add(ut);
    }
    if (ae === 0 && i && !v && (p ? v = Ve(() => i(a)) : (v = Ve(() => i(Jr ?? (Jr = kt()))), v.f |= at)), ae > le.size && $o(), !p)
      if (w.set(te, le), ce) {
        for (const [je, et] of c)
          le.has(je) || te.skip_effect(et.e);
        te.oncommit(b), te.ondiscard(S);
      } else
        b(te);
    o(m);
  }), A = { effect: _, items: c, pending: w, outrogroups: null, fallback: v };
  p = !1;
}
function jn(e) {
  for (; e !== null && (e.f & Xe) === 0; )
    e = e.next;
  return e;
}
function Qa(e, t, n, s, r) {
  var i = (s & Fo) !== 0, a = t.length, c = e.items, l = jn(e.effect.first), u, v = null, m, w = [], p = [], b, S, _, A;
  if (i)
    for (A = 0; A < a; A += 1)
      b = t[A], S = r(b, A), _ = /** @type {EachItem} */
      c.get(S).e, (_.f & at) === 0 && (_.nodes?.a?.measure(), (m ?? (m = /* @__PURE__ */ new Set())).add(_));
  for (A = 0; A < a; A += 1) {
    if (b = t[A], S = r(b, A), _ = /** @type {EachItem} */
    c.get(S).e, e.outrogroups !== null)
      for (const G of e.outrogroups)
        G.pending.delete(_), G.done.delete(_);
    if ((_.f & Se) !== 0 && (Es(_), i && (_.nodes?.a?.unfix(), (m ?? (m = /* @__PURE__ */ new Set())).delete(_))), (_.f & at) !== 0)
      if (_.f ^= at, _ === l)
        qn(_, null, n);
      else {
        var J = v ? v.next : l;
        _ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Tt(e, v, _), Tt(e, _, J), qn(_, J, n), v = _, w = [], p = [], l = jn(v.next);
        continue;
      }
    if (_ !== l) {
      if (u !== void 0 && u.has(_)) {
        if (w.length < p.length) {
          var ae = p[0], le;
          v = ae.prev;
          var te = w[0], ce = w[w.length - 1];
          for (le = 0; le < w.length; le += 1)
            qn(w[le], ae, n);
          for (le = 0; le < p.length; le += 1)
            u.delete(p[le]);
          Tt(e, te.prev, ce.next), Tt(e, v, te), Tt(e, ce, ae), l = ae, v = ce, A -= 1, w = [], p = [];
        } else
          u.delete(_), qn(_, l, n), Tt(e, _.prev, _.next), Tt(e, _, v === null ? e.effect.first : v.next), Tt(e, v, _), v = _;
        continue;
      }
      for (w = [], p = []; l !== null && l !== _; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(l), p.push(l), l = jn(l.next);
      if (l === null)
        continue;
    }
    (_.f & at) === 0 && w.push(_), v = _, l = jn(_.next);
  }
  if (e.outrogroups !== null) {
    for (const G of e.outrogroups)
      G.pending.size === 0 && (ur(e, Cs(G.done)), e.outrogroups?.delete(G));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var de = [];
    if (u !== void 0)
      for (_ of u)
        (_.f & Se) === 0 && de.push(_);
    for (; l !== null; )
      (l.f & Se) === 0 && l !== e.fallback && de.push(l), l = jn(l.next);
    var Ze = de.length;
    if (Ze > 0) {
      var ut = (s & ai) !== 0 && a === 0 ? n : null;
      if (i) {
        for (A = 0; A < Ze; A += 1)
          de[A].nodes?.a?.measure();
        for (A = 0; A < Ze; A += 1)
          de[A].nodes?.a?.fix();
      }
      $a(e, de, ut);
    }
  }
  i && Mt(() => {
    if (m !== void 0)
      for (_ of m)
        _.nodes?.a?.apply();
  });
}
function Xa(e, t, n, s, r, i, a, c) {
  var l = (a & zo) !== 0 ? (a & Ho) === 0 ? /* @__PURE__ */ ma(n, !1, !1) : Xt(n) : null, u = (a & jo) !== 0 ? Xt(r) : null;
  return {
    v: l,
    i: u,
    e: Ve(() => (i(t, l ?? n, u ?? r, c), () => {
      e.delete(s);
    }))
  };
}
function qn(e, t, n) {
  if (e.nodes)
    for (var s = e.nodes.start, r = e.nodes.end, i = t && (t.f & at) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; s !== null; ) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ rs(s)
      );
      if (i.before(s), s === r)
        return;
      s = a;
    }
}
function Tt(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Za(e, t, n = !1, s = !1, r = !1, i = !1) {
  var a = e, c = "";
  if (n)
    var l = (
      /** @type {Element} */
      e
    );
  me(() => {
    var u = (
      /** @type {Effect} */
      j
    );
    if (c !== (c = t() ?? "")) {
      if (n) {
        u.nodes = null, l.innerHTML = /** @type {string} */
        c, c !== "" && Zt(
          /** @type {TemplateNode} */
          /* @__PURE__ */ Ke(l),
          /** @type {TemplateNode} */
          l.lastChild
        );
        return;
      }
      if (u.nodes !== null && (zi(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), c !== "") {
        var v = s ? Vo : r ? qo : void 0, m = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          kr(s ? "svg" : r ? "math" : "template", v)
        );
        m.innerHTML = /** @type {any} */
        c;
        var w = s || r ? m : (
          /** @type {HTMLTemplateElement} */
          m.content
        );
        if (Zt(
          /** @type {TemplateNode} */
          /* @__PURE__ */ Ke(w),
          /** @type {TemplateNode} */
          w.lastChild
        ), s || r)
          for (; /* @__PURE__ */ Ke(w); )
            a.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ Ke(w)
            );
        else
          a.before(w);
      }
    }
  });
}
function el(e, t) {
  Oi(() => {
    e = j?.parent?.nodes?.start ?? e;
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
      const r = kr("style");
      r.id = t.hash, r.textContent = t.code, s.appendChild(r);
    }
  });
}
const Kr = [...` 	
\r\f \v\uFEFF`];
function tl(e, t, n) {
  var s = e == null ? "" : "" + e;
  if (t && (s = s ? s + " " + t : t), n) {
    for (var r of Object.keys(n))
      if (n[r])
        s = s ? s + " " + r : r;
      else if (s.length)
        for (var i = r.length, a = 0; (a = s.indexOf(r, a)) >= 0; ) {
          var c = a + i;
          (a === 0 || Kr.includes(s[a - 1])) && (c === s.length || Kr.includes(s[c])) ? s = (a === 0 ? "" : s.substring(0, a)) + s.substring(c + 1) : a = c;
        }
  }
  return s === "" ? null : s;
}
function nl(e, t) {
  return e == null ? null : String(e);
}
function Ht(e, t, n, s, r, i) {
  var a = (
    /** @type {any} */
    e[Xs]
  );
  if (a !== n || a === void 0) {
    var c = tl(n, s, i);
    c == null ? e.removeAttribute("class") : e.className = c, e[Xs] = n;
  } else if (i && r !== i)
    for (var l in i) {
      var u = !!i[l];
      (r == null || u !== !!r[l]) && e.classList.toggle(l, u);
    }
  return i;
}
function $r(e, t, n, s) {
  var r = (
    /** @type {any} */
    e[Zs]
  );
  if (r !== t) {
    var i = nl(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e[Zs] = t;
  }
  return s;
}
const sl = Symbol("is custom element"), rl = Symbol("is html");
function vs(e, t, n, s) {
  var r = il(e), i = r[t];
  i !== (r[t] = n) && (t === "loading" && (e[Do] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && ol(e).has(t) ? e[t] = n : e.setAttribute(t, n));
}
function il(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[hs] ?? (e[hs] = {
      [sl]: e.nodeName.includes("-"),
      [rl]: e.namespaceURI === ci
    })
  );
}
var Qr = /* @__PURE__ */ new Map();
function ol(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Qr.get(t);
  if (n) return n;
  Qr.set(t, n = /* @__PURE__ */ new Set());
  for (var s, r = e, i = Element.prototype; i !== r; ) {
    s = Mo(r);
    for (var a in s)
      s[a].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      a !== "innerHTML" && a !== "textContent" && a !== "innerText" && n.add(a);
    r = si(r);
  }
  return n;
}
function al(e, t, n = t) {
  var s = /* @__PURE__ */ new WeakSet();
  la(e, "input", async (r) => {
    var i = r ? e.defaultValue : e.value;
    if (i = Ws(e) ? Js(i) : i, n(i), I !== null && s.add(I), await vn(), i !== (i = t())) {
      var a = e.selectionStart, c = e.selectionEnd, l = e.value.length;
      if (e.value = i ?? "", c !== null) {
        var u = e.value.length;
        a === c && c === l && u > l ? (e.selectionStart = u, e.selectionEnd = u) : (e.selectionStart = a, e.selectionEnd = Math.min(c, u));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ps(t) == null && e.value && (n(Ws(e) ? Js(e.value) : e.value), I !== null && s.add(I)), xr(() => {
    var r = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        I
      );
      if (s.has(i))
        return;
    }
    Ws(e) && r === Js(e.value) || e.type === "date" && !r && !e.value || r !== e.value && (e.value = r ?? "");
  });
}
function Ws(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function Js(e) {
  return e === "" ? null : +e;
}
function Ks(e, t) {
  return e === t || e?.[ps] === t;
}
function $s(e = hr(), t, n, s) {
  var r = (
    /** @type {ComponentContext} */
    xe.r
  ), i = (
    /** @type {Effect} */
    j
  );
  return Oi(() => {
    var a, c;
    return xr(() => {
      a = c, c = [], Ps(() => {
        Ks(n(...c), e) || (t(e, ...c), a && Ks(n(...a), e) && t(null, ...a));
      });
    }), () => {
      let l = i;
      for (; l !== r && l.parent !== null && l.parent.f & $n; )
        l = l.parent;
      const u = () => {
        c && Ks(n(...c), e) && t(null, ...c);
      }, v = l.teardown;
      l.teardown = () => {
        u(), v?.();
      };
    };
  }), e;
}
function ll(e) {
  xe === null && Jo(), _s(() => {
    const t = Ps(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const cl = "5";
var ei;
typeof window < "u" && ((ei = window.__svelte ?? (window.__svelte = {})).v ?? (ei.v = /* @__PURE__ */ new Set())).add(cl);
const fl = "Ask questions about your realm — its governance, proposals, rules, and more — and get answers from an AI assistant in chat.";
class dr extends Error {
}
const ul = "This realm needs updating before the AI assistant can sign you in.";
async function dl(e, t) {
  if (!e) throw new dr(ul);
  try {
    return (await e.session({ renew: t })).token;
  } catch (n) {
    throw new dr(n instanceof Error ? n.message : String(n));
  }
}
async function vl(e, t, n = {}) {
  const s = async (i) => fetch(t, {
    ...n,
    headers: { ...n.headers, Authorization: `Bearer ${await dl(e, i)}` }
  }), r = await s(!1);
  return r.status === 401 ? s(!0) : r;
}
var pl = /* @__PURE__ */ F('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), hl = /* @__PURE__ */ F('<div class="settings-assistant-grid svelte-beco3k"></div>'), gl = /* @__PURE__ */ F('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), bl = /* @__PURE__ */ F('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), _l = /* @__PURE__ */ F('<div class="settings-history-list svelte-beco3k"></div>'), ml = /* @__PURE__ */ F('<p class="settings-section-desc svelte-beco3k"> </p>'), kl = /* @__PURE__ */ F('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), wl = /* @__PURE__ */ F(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <p class="settings-page-desc svelte-beco3k"> </p> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), xl = /* @__PURE__ */ F('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), yl = /* @__PURE__ */ F('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), El = /* @__PURE__ */ F('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), Sl = /* @__PURE__ */ F('<div class="assistant-selector svelte-beco3k"></div>'), Tl = /* @__PURE__ */ F('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), Al = /* @__PURE__ */ F('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), Cl = /* @__PURE__ */ F('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), Ml = /* @__PURE__ */ F('<div class="history-panel svelte-beco3k"><!></div>'), Pl = /* @__PURE__ */ F(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), Il = /* @__PURE__ */ F(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Sign in to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), Ll = /* @__PURE__ */ F('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), Xr = /* @__PURE__ */ Is('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Zr = /* @__PURE__ */ Is('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), Nl = /* @__PURE__ */ F('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), Rl = /* @__PURE__ */ F('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), Ol = /* @__PURE__ */ F('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), Dl = /* @__PURE__ */ F('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), zl = /* @__PURE__ */ F('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), jl = /* @__PURE__ */ F('<p class="stream-status svelte-beco3k"> </p>'), Fl = /* @__PURE__ */ F('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), Hl = /* @__PURE__ */ F('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), Ul = /* @__PURE__ */ F('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), Bl = /* @__PURE__ */ F("<!> <!> <!>", 1), Vl = /* @__PURE__ */ F('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), ql = /* @__PURE__ */ F('<button class="suggestion-chip svelte-beco3k"> </button>'), Yl = /* @__PURE__ */ F('<div class="suggestions svelte-beco3k"><!></div>'), Gl = /* @__PURE__ */ Is('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Wl = /* @__PURE__ */ Is('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Jl = /* @__PURE__ */ F('<div><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const Kl = {
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

	/* ══════════════════════ Settings page ══════════════════════ */.settings-page.svelte-beco3k {max-width:none;width:100%;margin:0;padding:36px 0 60px;font-family:inherit;color:#111;}.settings-title.svelte-beco3k {font-size:1.35rem;font-weight:700;margin:0 0 8px;color:#111;}.settings-page-desc.svelte-beco3k {font-size:0.9rem;color:#6b7280;margin:0 0 32px;line-height:1.45;}.settings-section.svelte-beco3k {background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:18px;display:flex;flex-direction:column;gap:14px;}.settings-section-title.svelte-beco3k {font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0;}.settings-section-desc.svelte-beco3k {font-size:0.875rem;color:#6b7280;margin:-8px 0 0;}

	/* Default assistant grid */.settings-assistant-grid.svelte-beco3k {display:flex;flex-wrap:wrap;gap:10px;}.settings-assistant-btn.svelte-beco3k {display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;transition:border-color 0.15s, background 0.15s;min-width:80px;}.settings-assistant-btn.selected.svelte-beco3k {border-color:#4f46e5;background:#eef2ff;}.settings-assistant-emoji.svelte-beco3k {font-size:1.5rem;}.settings-assistant-name.svelte-beco3k {font-size:0.8rem;font-weight:500;color:#374151;}

	/* Toggle rows */.settings-toggle.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;}.settings-toggle-info.svelte-beco3k {display:flex;flex-direction:column;gap:2px;}.settings-toggle-label.svelte-beco3k {font-size:0.9rem;font-weight:500;color:#111;}.settings-toggle-desc.svelte-beco3k {font-size:0.8rem;color:#6b7280;}.settings-switch.svelte-beco3k {flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#d1d5db;border:none;position:relative;cursor:pointer;transition:background 0.2s;outline:none;padding:0;}.settings-switch.svelte-beco3k::after {content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s;}.settings-switch.on.svelte-beco3k {background:#4f46e5;}.settings-switch.on.svelte-beco3k::after {transform:translateX(18px);}

	/* History list */.settings-history-list.svelte-beco3k {display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;}.settings-history-item.svelte-beco3k {display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:#f9fafb;}.settings-history-body.svelte-beco3k {flex:1;min-width:0;}.settings-history-title.svelte-beco3k {font-size:0.875rem;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.settings-history-meta.svelte-beco3k {font-size:0.75rem;color:#9ca3af;margin-top:2px;}.settings-history-delete.svelte-beco3k {flex-shrink:0;width:28px;height:28px;border:none;background:transparent;cursor:pointer;border-radius:6px;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 0.15s, color 0.15s;}.settings-history-delete.svelte-beco3k:hover {background:#fee2e2;color:#dc2626;}.settings-danger-btn.svelte-beco3k {align-self:flex-start;padding:7px 14px;border:1.5px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;font-size:0.85rem;font-weight:500;cursor:pointer;transition:background 0.15s;}.settings-danger-btn.svelte-beco3k:hover:not(:disabled) {background:#fee2e2;}.settings-danger-btn.svelte-beco3k:disabled {opacity:0.5;cursor:not-allowed;}

	/* About */.settings-about-row.svelte-beco3k {display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;}.settings-about-label.svelte-beco3k {color:#6b7280;}.settings-about-value.svelte-beco3k {font-weight:500;color:#111;}.settings-api-status.svelte-beco3k {font-size:0.85rem;font-weight:500;}.settings-api-status.online.svelte-beco3k {color:#16a34a;}.settings-api-status.offline.svelte-beco3k {color:#dc2626;}.settings-api-status.unknown.svelte-beco3k {color:#9ca3af;}.settings-link-btn.svelte-beco3k {align-self:flex-start;padding:6px 12px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;color:#4f46e5;font-size:0.8rem;cursor:pointer;transition:background 0.15s;}.settings-link-btn.svelte-beco3k:hover {background:#eef2ff;}`
};
function $l(e, t) {
  di(t, !0), el(e, Kl);
  function n() {
    const d = t.ctx.config?.network;
    if (d && d !== "ic") return d;
    const h = globalThis.__CANISTER_IDS;
    return h?.network && h.network !== "ic" ? h.network : window.location.hostname.includes("icp0.io") ? "test" : "staging";
  }
  let s = /* @__PURE__ */ M(Ge([])), r = /* @__PURE__ */ M(""), i = /* @__PURE__ */ M(!1), a = /* @__PURE__ */ M(""), c = /* @__PURE__ */ M(!1), l = /* @__PURE__ */ M(Ge(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), u = /* @__PURE__ */ M(""), v = /* @__PURE__ */ M(void 0), m = /* @__PURE__ */ M(Ge([])), w = /* @__PURE__ */ M(!1), p = /* @__PURE__ */ M(void 0), b = /* @__PURE__ */ M(Ge([])), S = /* @__PURE__ */ M(null), _ = /* @__PURE__ */ M(!1), A = /* @__PURE__ */ M(null), J = /* @__PURE__ */ M(void 0), ae = /* @__PURE__ */ M("100%"), le = /* @__PURE__ */ M(null), te = /* @__PURE__ */ M(!1), ce = /* @__PURE__ */ M(null), de = /* @__PURE__ */ M(0), Ze, ut, G = /* @__PURE__ */ M(null), je = /* @__PURE__ */ M(Ge([])), et = /* @__PURE__ */ M(!1), os = /* @__PURE__ */ M(!1);
  const Mn = "https://geister-api.realmsgos.dev/", Ki = 36e4;
  let $i = `${Mn}api/ask`, Qi = `${Mn}suggestions`, Xi = `${Mn}api/personas/assistants`, Pn = `${Mn}api/conversations`;
  const Nt = (d, h) => vl(t.ctx.ai, d, h);
  function Zi(d) {
    if (!d) return null;
    const h = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!h) return null;
    try {
      return decodeURIComponent(h[1]);
    } catch {
      return h[1];
    }
  }
  function Tr(d) {
    if (!d) return null;
    const h = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!h) return null;
    try {
      return decodeURIComponent(h[1]);
    } catch {
      return h[1];
    }
  }
  function eo(d) {
    !d || d.id === o(de) || (g(de, d.id, !0), g(r, d.message, !0), g(te, !0), d.autoSend ? setTimeout(() => void nn(), 150) : vn().then(zs));
  }
  function to() {
    if (Tr(o(ce)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function no() {
    Ze = t.ctx.host?.pendingPrompt?.subscribe?.(eo), ut = t.ctx.host?.focus?.subscribe?.((d) => {
      g(ce, d, !0);
    });
  }
  function Ar(d, h) {
    if (d instanceof dr) return d.message;
    if (h === 503 && d instanceof Error && d.message) {
      const k = d.message.toLowerCase();
      return k.includes("pod") || k.includes("llm backend") || k.includes("ollama") || k.includes("waking up") || k.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return h === 502 || h === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : h === 504 || h === 524 ? "The request timed out before the server could respond. Please try again." : h && h >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? Ar(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function so(d) {
    const h = d.toLowerCase();
    return h.includes("llm backend") || h.includes("cannot reach ollama") || h.includes("ollama at");
  }
  function In() {
    g(l, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function Cr() {
    g(l, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function ro(d) {
    const h = d.toLowerCase();
    return h.includes("waking up") || h.includes("still starting");
  }
  function Ls() {
    g(a, ""), g(c, !1);
  }
  function as(d, h) {
    d.trim() && (g(c, !0), g(a, ""));
    const k = { text: d, isUser: !1, ...h.trim() ? { thinking: h } : {} }, y = o(s)[o(s).length - 1];
    !y || y.isUser ? g(s, [...o(s), k], !0) : g(s, o(s).map((C, Me) => Me === o(s).length - 1 ? { ...C, ...k } : C), !0), vn().then(Os);
  }
  function io(d, h) {
    const k = typeof d.type == "string" ? d.type : d.text ? "text" : "", y = typeof d.text == "string" ? d.text : "";
    if (k === "status" && y) {
      In(), g(a, y, !0);
      return;
    }
    if (k === "thinking" && y) {
      In(), h.thinking += y, as(h.text, h.thinking);
      return;
    }
    y && (In(), h.text += y, as(h.text, h.thinking));
  }
  let Ln = "", ls = "", Mr, Pr, xt = /* @__PURE__ */ M(!1);
  const en = !!t.ctx.sidebarPanel, Ir = "llm_chat_prefs";
  function oo() {
    try {
      return JSON.parse(localStorage.getItem(Ir) || "{}");
    } catch {
      return {};
    }
  }
  function ao(d) {
    try {
      localStorage.setItem(Ir, JSON.stringify(d));
    } catch {
    }
  }
  const Ns = oo();
  let tn = /* @__PURE__ */ M(Ge(Ns.defaultAssistant || "")), Rt = /* @__PURE__ */ M(Ns.showSuggestions !== !1), Nn = /* @__PURE__ */ M(Ns.sharePageContext !== !1);
  _s(() => {
    ao({
      defaultAssistant: o(tn),
      showSuggestions: o(Rt),
      sharePageContext: o(Nn)
    });
  });
  let Rn = /* @__PURE__ */ M("unknown"), cs = /* @__PURE__ */ M(!1), Rs = /* @__PURE__ */ M(!1);
  async function Lr() {
    try {
      const d = await fetch(`${Mn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      g(Rn, d.ok ? "online" : "offline", !0);
    } catch {
      g(Rn, "offline");
    }
  }
  async function lo() {
    if (!(!ls || !o(xt))) {
      g(cs, !0);
      try {
        await Ds(), await Promise.all(o(je).map((d) => Nt(`${Pn}/${d.conversation_id}`, { method: "DELETE" }))), g(je, [], !0), g(s, [], !0), g(G, null), g(Rs, !0), setTimeout(
          () => {
            g(Rs, !1);
          },
          2e3
        );
      } catch {
      } finally {
        g(cs, !1);
      }
    }
  }
  ll(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", h = t.ctx.config?.canisterId || "";
    if (Ln = d || h, Mr = t.ctx.principal?.subscribe?.((k) => {
      ls = k || "";
    }), Pr = t.ctx.isAuthenticated?.subscribe?.((k) => {
      g(xt, k, !0);
    }), !en) {
      const k = window.visualViewport;
      if (k) {
        const y = () => {
          const C = o(J)?.getBoundingClientRect().top ?? k.offsetTop, Me = Math.max(Math.round(k.height - C), 200);
          g(ae, `${Me}px`);
        };
        await vn(), y(), k.addEventListener("resize", y), k.addEventListener("scroll", y), window.addEventListener("resize", y), window.__chatVpCleanup = () => {
          k.removeEventListener("resize", y), k.removeEventListener("scroll", y), window.removeEventListener("resize", y);
        };
      }
    }
    if (co(), no(), await fo(), o(tn) && o(b).length > 0) {
      const k = o(b).find((y) => y.id === o(tn));
      k && g(S, k, !0);
    }
    !o(te) && o(Rt) && await fs(), en || (Lr(), o(xt) && await Ds());
  });
  function co() {
    try {
      const d = new URLSearchParams(window.location.search), h = d.get("explain");
      if (!h) return;
      const [k, y] = h.split(":");
      if (k === "codex" && y)
        g(te, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: y })).then((C) => {
          if (C.success) {
            const Ot = (typeof C.response == "string" ? JSON.parse(C.response) : C.response).codex?.name || `codex_${y}`, ve = `/extensions/codex_viewer/${y}`;
            g(le, y, !0), g(r, `Please explain this codex: [${Ot}](${ve})`), setTimeout(() => nn(), 300);
          }
        }).catch((C) => {
          console.error("Failed to fetch codex for explanation:", C), g(te, !1);
        });
      else if (k === "financial_statements") {
        g(te, !0);
        const C = d.get("context") || "";
        g(r, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${C}`), setTimeout(() => nn(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  _s(() => {
    o(s), vn().then(Os);
  });
  function Os() {
    o(v) && (o(v).scrollTop = o(v).scrollHeight);
  }
  async function fo() {
    if (!o(_)) {
      g(_, !0);
      try {
        const d = await fetch(Xi, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        const h = await d.json();
        h.assistants && Array.isArray(h.assistants) && (g(b, h.assistants, !0), o(b).length > 0 && !o(S) && g(S, o(b)[0], !0));
      } catch (d) {
        console.error("Error fetching assistants:", d);
      } finally {
        g(_, !1);
      }
    }
  }
  async function fs() {
    if (!o(w)) {
      g(w, !0);
      try {
        const d = new URLSearchParams({
          realm_principal: Ln || "",
          persona: o(S)?.id || "ashoka"
        }), h = await Nt(`${Qi}?${d.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!h.ok) throw new Error(`HTTP ${h.status}`);
        const k = await h.json();
        k.suggestions && Array.isArray(k.suggestions) && g(m, k.suggestions, !0);
      } catch (d) {
        console.error("Error fetching suggestions:", d);
      } finally {
        g(w, !1);
      }
    }
  }
  async function nn() {
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
    g(r, ""), g(i, !0), Ls(), g(a, o(l) ? "Thinking…" : "", !0);
    try {
      await ho();
      const h = n(), k = {
        question: d,
        realm_principal: Ln,
        stream: !0,
        verbosity: 1,
        persona: o(S)?.id || "ashoka",
        network: h,
        ...o(G) ? { conversation_id: o(G) } : {}
      };
      if (o(le))
        k.explain_codex_id = o(le), g(le, null);
      else {
        const ue = Zi(o(ce)?.uri);
        ue && (k.explain_codex_id = ue);
      }
      const y = Tr(o(ce)?.uri);
      y && (k.explain_proposal_id = y, k.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(ce)?.label || "Proposal",
        proposalId: y
      }), o(ce) && (k.focus = {
        uri: o(ce).uri,
        label: o(ce).label
      });
      const C = await Nt($i, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(k),
        signal: AbortSignal.timeout(Ki)
      });
      if (!C.ok) {
        let ue = "";
        try {
          const Pe = await C.json();
          ue = typeof Pe?.error == "string" ? Pe.error : "";
        } catch {
        }
        throw ue ? Object.assign(new Error(ue), { httpStatus: C.status }) : Object.assign(new Error(`HTTP error! Status: ${C.status}`), { httpStatus: C.status });
      }
      const Me = C.body?.getReader();
      if (!Me) throw new Error("Response body is not readable");
      const Ot = new TextDecoder(), ve = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: ue, value: Pe } = await Me.read();
          if (ue) break;
          const on = Ot.decode(Pe, { stream: !0 }).split(`
`);
          for (const dt of on)
            if (dt.startsWith("data: ")) {
              const Dt = dt.slice(6);
              if (Dt === "[DONE]") continue;
              try {
                io(JSON.parse(Dt), ve);
              } catch {
                ve.text += Dt, as(ve.text, ve.thinking);
              }
            } else dt.trim() && !dt.startsWith(":") && (ve.text += dt, as(ve.text, ve.thinking));
        }
      } finally {
        Me.releaseLock();
      }
      const yt = ve.text, sn = ve.thinking;
      yt.trim() ? so(yt) ? (g(u, "The AI backend is temporarily offline. Please try again in a few minutes."), Cr()) : yt.trim() && In() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? g(s, o(s).map((ue, Pe) => Pe === o(s).length - 1 ? { ...ue, text: "No response from LLM" } : ue), !0) : g(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), g(i, !1), Ls(), g(te, !1), await fs();
    } catch (h) {
      console.error("Error calling LLM:", h), g(u, Ar(h, h?.httpStatus), !0), ro(o(u)) && Cr(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && g(s, o(s).slice(0, -1), !0);
    } finally {
      g(i, !1), Ls(), g(te, !1);
    }
  }
  function uo() {
    g(u, "");
  }
  async function Ds() {
    if (!(!ls || !o(xt))) {
      g(os, !0);
      try {
        const d = new URLSearchParams({ realm_principal: Ln }), h = await Nt(`${Pn}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!h.ok) return;
        const k = await h.json();
        g(je, (k.conversations || []).sort((y, C) => new Date(C.updated_at).getTime() - new Date(y.updated_at).getTime()), !0);
      } catch {
      } finally {
        g(os, !1);
      }
    }
  }
  async function Nr(d) {
    g(et, !1), g(s, [], !0), g(G, d.conversation_id, !0);
    const h = o(b).find((k) => k.id === d.persona);
    h && g(S, h, !0);
    try {
      const k = await Nt(`${Pn}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!k.ok) return;
      const y = await k.json();
      g(s, go(y.messages || []), !0), o(s).some((C) => !C.isUser) && In(), await vn(), Os();
    } catch {
    }
  }
  async function vo() {
    g(et, !1), g(s, [], !0), g(G, null), g(u, ""), g(m, [], !0), await fs();
  }
  async function Rr(d, h) {
    h.stopPropagation();
    try {
      await Nt(`${Pn}/${d}`, { method: "DELETE" }), g(je, o(je).filter((k) => k.conversation_id !== d), !0), o(G) === d && (g(s, [], !0), g(G, null));
    } catch {
    }
  }
  async function po() {
    g(et, !0), await Ds();
  }
  function Or(d) {
    const h = new Date(d), y = (/* @__PURE__ */ new Date()).getTime() - h.getTime(), C = Math.floor(y / 864e5);
    return C === 0 ? h.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : C === 1 ? "Yesterday" : C < 7 ? h.toLocaleDateString([], { weekday: "short" }) : h.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function ho() {
    if (!(o(G) || !ls || !o(xt)))
      try {
        const d = await Nt(Pn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            realm_principal: Ln,
            persona: o(S)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const h = await d.json();
          g(G, h.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function Dr(d, h) {
    const k = () => {
      g(A, h, !0), setTimeout(
        () => {
          g(A, null);
        },
        1500
      );
    }, y = () => {
      const C = document.createElement("textarea");
      C.value = d, C.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(C), C.focus(), C.select();
      try {
        document.execCommand("copy"), k();
      } catch {
      }
      document.body.removeChild(C);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(k).catch(y) : y();
  }
  function go(d) {
    const h = [];
    for (const k of d) {
      if (!k || typeof k != "object") continue;
      const y = k;
      if (y.role && y.content != null) {
        h.push({ text: String(y.content), isUser: y.role === "user" });
        continue;
      }
      y.question != null && String(y.question).trim() && h.push({ text: String(y.question), isUser: !0 }), y.response != null && String(y.response).trim() && h.push({ text: String(y.response), isUser: !1 });
    }
    return h;
  }
  function bo(d) {
    if (!d) return "";
    let h = d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return h = h.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), h;
  }
  function zs() {
    if (o(p)) {
      o(p).style.height = "auto";
      const d = Math.max(40, Math.min(o(p).scrollHeight, 120));
      o(p).style.height = d + "px";
    }
  }
  function _o(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), nn()), setTimeout(zs, 0);
  }
  function mo(d) {
    g(r, d, !0), nn();
  }
  function ko(d) {
    g(S, d, !0), g(s, [], !0), fs();
  }
  _s(() => () => {
    Mr?.(), Pr?.(), Ze?.(), ut?.(), window.__chatVpCleanup?.();
  });
  var zr = cn(), wo = Ft(zr);
  {
    var xo = (d) => {
      var h = wl(), k = P(N(h), 2), y = be(k, !0), C = P(k, 2), Me = P(N(C), 4);
      {
        var Ot = (X) => {
          var x = hl();
          un(x, 21, () => o(b), fn, (B, K) => {
            var W = pl(), $ = N(W), se = be($, !0), V = P($, 2), q = be(V, !0);
            me(() => {
              Ht(W, 1, `settings-assistant-btn ${o(tn) === o(K).id || !o(tn) && o(b)[0].id === o(K).id ? "selected" : ""}`, "svelte-beco3k"), _e(se, o(K).emoji), _e(q, o(K).name);
            }), ne("click", W, () => g(tn, o(K).id, !0)), E(B, W);
          }), E(X, x);
        }, ve = (X) => {
          var x = gl();
          E(X, x);
        };
        Y(Me, (X) => {
          o(b).length > 0 ? X(Ot) : X(ve, -1);
        });
      }
      var yt = P(C, 2), sn = P(N(yt), 2), ue = P(N(sn), 2), Pe = P(sn, 2), rn = P(N(Pe), 2), on = P(yt, 2);
      {
        var dt = (X) => {
          var x = kl(), B = P(N(x), 2);
          {
            var K = (H) => {
              var U = _l();
              un(U, 21, () => o(je), fn, (pe, Ie) => {
                var vt = bl(), Le = N(vt), Fe = N(Le), re = be(Fe, !0), fe = P(Fe, 2), he = be(fe), jt = P(Le, 2);
                me(
                  (pt) => {
                    _e(re, o(Ie).title), _e(he, `${pt ?? ""} · ${o(Ie).message_count ?? ""} message${o(Ie).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Or(o(Ie).updated_at)]
                ), ne("click", jt, (pt) => Rr(o(Ie).conversation_id, pt)), E(pe, vt);
              }), E(H, U);
            }, W = (H) => {
              var U = ml(), pe = be(U, !0);
              me(() => _e(pe, o(os) ? "Loading…" : "No conversations yet.")), E(H, U);
            };
            Y(B, (H) => {
              o(je).length > 0 ? H(K) : H(W, -1);
            });
          }
          var $ = P(B, 2), se = N($);
          {
            var V = (H) => {
              var U = ln("✓ History cleared");
              E(H, U);
            }, q = (H) => {
              var U = ln("Clearing…");
              E(H, U);
            }, Z = (H) => {
              var U = ln("Clear all history");
              E(H, U);
            };
            Y(se, (H) => {
              o(Rs) ? H(V) : o(cs) ? H(q, 1) : H(Z, -1);
            });
          }
          me(() => $.disabled = o(cs) || o(je).length === 0), ne("click", $, lo), E(X, x);
        };
        Y(on, (X) => {
          o(xt) && X(dt);
        });
      }
      var Dt = P(on, 2), On = P(N(Dt), 4), us = P(N(On), 2), js = N(us);
      {
        var zt = (X) => {
          var x = ln("● Online");
          E(X, x);
        }, Dn = (X) => {
          var x = ln("● Offline");
          E(X, x);
        }, Fs = (X) => {
          var x = ln("Checking…");
          E(X, x);
        };
        Y(js, (X) => {
          o(Rn) === "online" ? X(zt) : o(Rn) === "offline" ? X(Dn, 1) : X(Fs, -1);
        });
      }
      var Hs = P(On, 2);
      me(() => {
        _e(y, fl), Ht(ue, 1, `settings-switch ${o(Rt) ? "on" : ""}`, "svelte-beco3k"), vs(ue, "aria-checked", o(Rt)), Ht(rn, 1, `settings-switch ${o(Nn) ? "on" : ""}`, "svelte-beco3k"), vs(rn, "aria-checked", o(Nn)), Ht(us, 1, `settings-api-status ${o(Rn) ?? ""}`, "svelte-beco3k");
      }), ne("click", ue, () => g(Rt, !o(Rt))), ne("click", rn, () => g(Nn, !o(Nn))), ne("click", Hs, Lr), E(d, h);
    }, yo = (d) => {
      var h = Jl();
      let k;
      var y = N(h);
      {
        var C = (x) => {
          var B = xl(), K = N(B), W = P(K, 2);
          me(() => Ht(W, 1, `toolbar-btn ${o(et) ? "active" : ""}`, "svelte-beco3k")), ne("click", K, vo), ne("click", W, function(...$) {
            (o(et) ? () => g(et, !1) : po)?.apply(this, $);
          }), E(x, B);
        };
        Y(y, (x) => {
          o(xt) && x(C);
        });
      }
      var Me = P(y, 2);
      {
        var Ot = (x) => {
          var B = yl(), K = N(B), W = be(K, !0), $ = P(K, 2);
          me(() => {
            vs(K, "title", o(ce).uri), _e(W, o(ce).label);
          }), ne("click", $, to), E(x, B);
        };
        Y(Me, (x) => {
          en && o(ce)?.label && x(Ot);
        });
      }
      var ve = P(Me, 2);
      {
        var yt = (x) => {
          var B = Sl();
          un(B, 21, () => o(b), fn, (K, W) => {
            var $ = El(), se = N($), V = be(se, !0), q = P(se, 2), Z = be(q, !0);
            me(() => {
              Ht($, 1, `assistant-btn ${o(S)?.id === o(W).id ? "active" : ""}`, "svelte-beco3k"), vs($, "title", o(W).description), _e(V, o(W).emoji), _e(Z, o(W).name);
            }), ne("click", $, () => ko(o(W))), E(K, $);
          }), E(x, B);
        };
        Y(ve, (x) => {
          o(b).length > 1 && x(yt);
        });
      }
      var sn = P(ve, 2);
      {
        var ue = (x) => {
          var B = Ml(), K = N(B);
          {
            var W = (V) => {
              var q = Tl();
              E(V, q);
            }, $ = (V) => {
              var q = Al();
              E(V, q);
            }, se = (V) => {
              var q = cn(), Z = Ft(q);
              un(Z, 17, () => o(je), fn, (H, U) => {
                var pe = Cl(), Ie = N(pe), vt = N(Ie), Le = be(vt, !0), Fe = P(vt, 2), re = be(Fe), fe = P(Ie, 2);
                me(
                  (he) => {
                    _e(Le, o(U).title), _e(re, `${he ?? ""} · ${o(U).message_count ?? ""} msg${o(U).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Or(o(U).updated_at)]
                ), ne("click", pe, () => Nr(o(U))), ne("keydown", pe, (he) => he.key === "Enter" && Nr(o(U))), ne("click", fe, (he) => Rr(o(U).conversation_id, he)), E(H, pe);
              }), E(V, q);
            };
            Y(K, (V) => {
              o(os) ? V(W) : o(je).length === 0 ? V($, 1) : V(se, -1);
            });
          }
          E(x, B);
        };
        Y(sn, (x) => {
          o(et) && x(ue);
        });
      }
      var Pe = P(sn, 2), rn = N(Pe);
      {
        var on = (x) => {
          var B = Ll(), K = N(B), W = N(K);
          {
            var $ = (V) => {
              var q = Pl();
              E(V, q);
            }, se = (V) => {
              var q = Il();
              E(V, q);
            };
            Y(W, (V) => {
              o(xt) ? V($) : V(se, -1);
            });
          }
          E(x, B);
        }, dt = (x) => {
          var B = Bl(), K = Ft(B);
          un(K, 17, () => o(s), fn, (q, Z, H) => {
            var U = cn(), pe = Ft(U);
            {
              var Ie = (Le) => {
                var Fe = Nl(), re = N(Fe), fe = N(re), he = N(fe);
                {
                  var jt = (St) => {
                    var zn = Xr();
                    E(St, zn);
                  }, pt = (St) => {
                    var zn = Zr();
                    E(St, zn);
                  };
                  Y(he, (St) => {
                    o(A) === H ? St(jt) : St(pt, -1);
                  });
                }
                var tt = P(fe, 2), Et = be(tt, !0);
                me(() => _e(Et, o(Z).text)), ne("click", fe, () => Dr(o(Z).text, H)), E(Le, Fe);
              }, vt = (Le) => {
                var Fe = Ol(), re = N(Fe), fe = N(re), he = N(fe);
                {
                  var jt = (Te) => {
                    var ht = Rl(), Us = P(N(ht), 2), So = be(Us, !0);
                    me(() => _e(So, o(Z).thinking)), E(Te, ht);
                  };
                  Y(he, (Te) => {
                    o(Z).thinking && Te(jt);
                  });
                }
                var pt = P(he, 2);
                {
                  var tt = (Te) => {
                    var ht = cn(), Us = Ft(ht);
                    Za(Us, () => bo(o(Z).text)), E(Te, ht);
                  };
                  Y(pt, (Te) => {
                    o(Z).text && Te(tt);
                  });
                }
                var Et = P(fe, 2), St = N(Et);
                {
                  var zn = (Te) => {
                    var ht = Xr();
                    E(Te, ht);
                  }, Eo = (Te) => {
                    var ht = Zr();
                    E(Te, ht);
                  };
                  Y(St, (Te) => {
                    o(A) === H ? Te(zn) : Te(Eo, -1);
                  });
                }
                ne("click", Et, () => Dr(o(Z).text, H)), E(Le, Fe);
              };
              Y(pe, (Le) => {
                o(Z).isUser ? Le(Ie) : Le(vt, -1);
              });
            }
            E(q, U);
          });
          var W = P(K, 2);
          {
            var $ = (q) => {
              var Z = Hl(), H = N(Z), U = N(H);
              {
                var pe = (re) => {
                  var fe = cn(), he = Ft(fe);
                  {
                    var jt = (tt) => {
                      var Et = Dl();
                      E(tt, Et);
                    }, pt = (tt) => {
                      var Et = zl();
                      E(tt, Et);
                    };
                    Y(he, (tt) => {
                      o(te) ? tt(jt) : !o(l) && !o(a) && tt(pt, 1);
                    });
                  }
                  E(re, fe);
                };
                Y(U, (re) => {
                  o(c) || re(pe);
                });
              }
              var Ie = P(U, 2);
              {
                var vt = (re) => {
                  var fe = jl(), he = be(fe, !0);
                  me(() => _e(he, o(a))), E(re, fe);
                };
                Y(Ie, (re) => {
                  o(a) && re(vt);
                });
              }
              var Le = P(Ie, 2);
              {
                var Fe = (re) => {
                  var fe = Fl();
                  E(re, fe);
                };
                Y(Le, (re) => {
                  !o(c) && !o(a) && o(l) && !o(te) && re(Fe);
                });
              }
              E(q, Z);
            };
            Y(W, (q) => {
              o(i) && (!o(c) || o(a)) && q($);
            });
          }
          var se = P(W, 2);
          {
            var V = (q) => {
              var Z = Ul(), H = N(Z), U = be(H, !0), pe = P(H, 2);
              me(() => _e(U, o(u))), ne("click", pe, uo), E(q, Z);
            };
            Y(se, (q) => {
              o(u) && q(V);
            });
          }
          E(x, B);
        };
        Y(rn, (x) => {
          o(s).length === 0 && !o(te) ? x(on) : x(dt, -1);
        });
      }
      $s(Pe, (x) => g(v, x), () => o(v));
      var Dt = P(Pe, 2), On = N(Dt);
      {
        var us = (x) => {
          var B = Yl(), K = N(B);
          {
            var W = (se) => {
              var V = Vl();
              E(se, V);
            }, $ = (se) => {
              var V = cn(), q = Ft(V);
              un(q, 17, () => o(m), fn, (Z, H) => {
                var U = ql(), pe = be(U, !0);
                me(() => _e(pe, o(H))), ne("click", U, () => mo(o(H))), E(Z, U);
              }), E(se, V);
            };
            Y(K, (se) => {
              o(w) ? se(W) : se($, -1);
            });
          }
          E(x, B);
        };
        Y(On, (x) => {
          o(Rt) && (o(m).length > 0 || o(w)) && x(us);
        });
      }
      var js = P(On, 2), zt = N(js);
      $s(zt, (x) => g(p, x), () => o(p));
      var Dn = P(zt, 2), Fs = N(Dn);
      {
        var Hs = (x) => {
          var B = Gl();
          E(x, B);
        }, X = (x) => {
          var B = Wl();
          E(x, B);
        };
        Y(Fs, (x) => {
          o(i) ? x(Hs) : x(X, -1);
        });
      }
      $s(h, (x) => g(J, x), () => o(J)), me(
        (x) => {
          k = Ht(h, 1, "llm-chat-root svelte-beco3k", null, k, { "sidebar-panel": en }), $r(h, en ? void 0 : `height: ${o(ae)}`), $r(Pe, o(et) ? "display:none" : ""), Dn.disabled = x;
        },
        [() => o(i) || !o(r).trim()]
      ), ne("keydown", zt, _o), ne("input", zt, () => zs()), al(zt, () => o(r), (x) => g(r, x)), ne("click", Dn, () => nn()), E(d, h);
    };
    Y(wo, (d) => {
      en ? d(yo, -1) : d(xo);
    });
  }
  E(e, zr), vi();
}
Oa(["click", "keydown", "input"]);
function Zl(e, t) {
  const n = Ga($l, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Ja(n);
      } catch {
      }
    }
  };
}
export {
  Zl as default
};
