var _r = Object.defineProperty;
var on = (e) => {
  throw TypeError(e);
};
var pr = (e, t, n) => t in e ? _r(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var $ = (e, t, n) => pr(e, typeof t != "symbol" ? t + "" : t, n), Dt = (e, t, n) => t.has(e) || on("Cannot " + n);
var i = (e, t, n) => (Dt(e, t, "read from private field"), n ? n.call(e) : t.get(e)), p = (e, t, n) => t.has(e) ? on("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), m = (e, t, n, r) => (Dt(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), k = (e, t, n) => (Dt(e, t, "access private method"), n);
var mr = Array.isArray, gr = Array.prototype.indexOf, Ze = Array.prototype.includes, wr = Array.from, br = Object.defineProperty, it = Object.getOwnPropertyDescriptor, yr = Object.prototype, xr = Array.prototype, kr = Object.getPrototypeOf, un = Object.isExtensible;
const Er = () => {
};
function jr(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function xn() {
  var e, t, n = new Promise((r, s) => {
    e = r, t = s;
  });
  return { promise: n, resolve: e, reject: t };
}
const M = 2, Qe = 4, Ct = 8, kn = 1 << 24, oe = 16, be = 32, Te = 64, qt = 128, J = 512, A = 1024, N = 2048, ue = 4096, Z = 8192, se = 16384, tt = 32768, cn = 1 << 25, Xe = 65536, Bt = 1 << 17, Sr = 1 << 18, nt = 1 << 19, Tr = 1 << 20, ze = 65536, Ut = 1 << 21, at = 1 << 22, Se = 1 << 23, Ot = Symbol("$state"), _e = new class extends Error {
  constructor() {
    super(...arguments);
    $(this, "name", "StaleReactionError");
    $(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Ar() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Rr() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Nr() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Mr() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Cr() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Pr() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Fr = 2, R = Symbol(), Dr = "http://www.w3.org/1999/xhtml";
function Or() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Ir() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function En(e) {
  return e === this.v;
}
let ie = null;
function $e(e) {
  ie = e;
}
function jn(e, t = !1, n) {
  ie = {
    p: ie,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      x
    ),
    l: null
  };
}
function Sn(e) {
  var t = (
    /** @type {ComponentContext} */
    ie
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      fs(r);
  }
  return t.i = !0, ie = t.p, /** @type {T} */
  {};
}
function Tn() {
  return !0;
}
let Ue = [];
function zr() {
  var e = Ue;
  Ue = [], jr(e);
}
function Ye(e) {
  if (Ue.length === 0) {
    var t = Ue;
    queueMicrotask(() => {
      t === Ue && zr();
    });
  }
  Ue.push(e);
}
function An(e) {
  var t = x;
  if (t === null)
    return g.f |= Se, e;
  if ((t.f & tt) === 0 && (t.f & Qe) === 0)
    throw e;
  je(e, t);
}
function je(e, t) {
  for (; t !== null; ) {
    if ((t.f & qt) !== 0) {
      if ((t.f & tt) === 0)
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
const Lr = -7169;
function j(e, t) {
  e.f = e.f & Lr | t;
}
function Xt(e) {
  (e.f & J) !== 0 || e.deps === null ? j(e, A) : j(e, ue);
}
function Rn(e) {
  if (e !== null)
    for (const t of e)
      (t.f & M) === 0 || (t.f & ze) === 0 || (t.f ^= ze, Rn(
        /** @type {Derived} */
        t.deps
      ));
}
function Nn(e, t, n) {
  (e.f & N) !== 0 ? t.add(e) : (e.f & ue) !== 0 && n.add(e), Rn(e.deps), j(e, A);
}
const Ae = /* @__PURE__ */ new Set();
let y = null, ne = null, Vt = null, It = !1, Ve = null, wt = null;
var dn = 0;
let qr = 1;
var He, Ke, Me, pe, le, ut, z, ct, ke, me, fe, Ge, We, Ce, T, bt, Mn, yt, Yt, xt, Br;
const Rt = class Rt {
  constructor() {
    p(this, T);
    $(this, "id", qr++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    $(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    $(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    p(this, He, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    p(this, Ke, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    p(this, Me, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    p(this, pe, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    p(this, le, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    p(this, ut, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    p(this, z, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    p(this, ct, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    p(this, ke, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    p(this, me, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    p(this, fe, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    p(this, Ge, /* @__PURE__ */ new Set());
    $(this, "is_fork", !1);
    p(this, We, !1);
    /** @type {Set<Batch>} */
    p(this, Ce, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    i(this, fe).has(t) || i(this, fe).set(t, { d: [], m: [] }), i(this, Ge).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (r) => this.schedule(r)) {
    var r = i(this, fe).get(t);
    if (r) {
      i(this, fe).delete(t);
      for (var s of r.d)
        j(s, N), n(s);
      for (s of r.m)
        j(s, ue), n(s);
    }
    i(this, Ge).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, r = !1) {
    t.v !== R && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Se) === 0 && (this.current.set(t, [n, r]), ne?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    y = this;
  }
  deactivate() {
    y = null, ne = null;
  }
  flush() {
    try {
      It = !0, y = this, k(this, T, yt).call(this);
    } finally {
      dn = 0, Vt = null, Ve = null, wt = null, It = !1, y = null, ne = null, Oe.clear();
    }
  }
  discard() {
    for (const t of i(this, Ke)) t(this);
    i(this, Ke).clear(), i(this, Me).clear(), Ae.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    i(this, ct).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    let r = i(this, pe).get(n) ?? 0;
    if (i(this, pe).set(n, r + 1), t) {
      let s = i(this, le).get(n) ?? 0;
      i(this, le).set(n, s + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(t, n, r) {
    let s = i(this, pe).get(n) ?? 0;
    if (s === 1 ? i(this, pe).delete(n) : i(this, pe).set(n, s - 1), t) {
      let l = i(this, le).get(n) ?? 0;
      l === 1 ? i(this, le).delete(n) : i(this, le).set(n, l - 1);
    }
    i(this, We) || r || (m(this, We, !0), Ye(() => {
      m(this, We, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const r of t)
      i(this, ke).add(r);
    for (const r of n)
      i(this, me).add(r);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    i(this, He).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    i(this, Ke).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(t) {
    i(this, Me).add(t);
  }
  run_fork_commit_callbacks() {
    for (const t of i(this, Me)) t(this);
    i(this, Me).clear();
  }
  settled() {
    return (i(this, ut) ?? m(this, ut, xn())).promise;
  }
  static ensure() {
    if (y === null) {
      const t = y = new Rt();
      It || (Ae.add(y), Ye(() => {
        y === t && t.flush();
      }));
    }
    return y;
  }
  apply() {
    {
      ne = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    if (Vt = t, t.b?.is_pending && (t.f & (Qe | Ct | kn)) !== 0 && (t.f & tt) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var r = n.f;
      if (Ve !== null && n === x && (g === null || (g.f & M) === 0))
        return;
      if ((r & (Te | be)) !== 0) {
        if ((r & A) === 0)
          return;
        n.f ^= A;
      }
    }
    i(this, z).push(n);
  }
};
He = new WeakMap(), Ke = new WeakMap(), Me = new WeakMap(), pe = new WeakMap(), le = new WeakMap(), ut = new WeakMap(), z = new WeakMap(), ct = new WeakMap(), ke = new WeakMap(), me = new WeakMap(), fe = new WeakMap(), Ge = new WeakMap(), We = new WeakMap(), Ce = new WeakMap(), T = new WeakSet(), bt = function() {
  return this.is_fork || i(this, le).size > 0;
}, Mn = function() {
  for (const r of i(this, Ce))
    for (const s of i(r, le).keys()) {
      for (var t = !1, n = s; n.parent !== null; ) {
        if (i(this, fe).has(n)) {
          t = !0;
          break;
        }
        n = n.parent;
      }
      if (!t)
        return !0;
    }
  return !1;
}, yt = function() {
  var o;
  if (dn++ > 1e3 && (Ae.delete(this), Ur()), !k(this, T, bt).call(this)) {
    for (const f of i(this, ke))
      i(this, me).delete(f), j(f, N), this.schedule(f);
    for (const f of i(this, me))
      j(f, ue), this.schedule(f);
  }
  const t = i(this, z);
  m(this, z, []), this.apply();
  var n = Ve = [], r = [], s = wt = [];
  for (const f of t)
    try {
      k(this, T, Yt).call(this, f, n, r);
    } catch (u) {
      throw Fn(f), u;
    }
  if (y = null, s.length > 0) {
    var l = Rt.ensure();
    for (const f of s)
      l.schedule(f);
  }
  if (Ve = null, wt = null, k(this, T, bt).call(this) || k(this, T, Mn).call(this)) {
    k(this, T, xt).call(this, r), k(this, T, xt).call(this, n);
    for (const [f, u] of i(this, fe))
      Pn(f, u);
  } else {
    i(this, pe).size === 0 && Ae.delete(this), i(this, ke).clear(), i(this, me).clear();
    for (const f of i(this, He)) f(this);
    i(this, He).clear(), hn(r), hn(n), i(this, ut)?.resolve();
  }
  var a = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    y
  );
  if (i(this, z).length > 0) {
    const f = a ?? (a = this);
    i(f, z).push(...i(this, z).filter((u) => !i(f, z).includes(u)));
  }
  a !== null && (Ae.add(a), k(o = a, T, yt).call(o));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Yt = function(t, n, r) {
  t.f ^= A;
  for (var s = t.first; s !== null; ) {
    var l = s.f, a = (l & (be | Te)) !== 0, o = a && (l & A) !== 0, f = o || (l & Z) !== 0 || i(this, fe).has(s);
    if (!f && s.fn !== null) {
      a ? s.f ^= A : (l & Qe) !== 0 ? n.push(s) : pt(s) && ((l & oe) !== 0 && i(this, me).add(s), et(s));
      var u = s.first;
      if (u !== null) {
        s = u;
        continue;
      }
    }
    for (; s !== null; ) {
      var h = s.next;
      if (h !== null) {
        s = h;
        break;
      }
      s = s.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
xt = function(t) {
  for (var n = 0; n < t.length; n += 1)
    Nn(t[n], i(this, ke), i(this, me));
}, Br = function() {
  var h, _, v;
  for (const c of Ae) {
    var t = c.id < this.id, n = [];
    for (const [d, [b, w]] of this.current) {
      if (c.current.has(d)) {
        var r = (
          /** @type {[any, boolean]} */
          c.current.get(d)[0]
        );
        if (t && b !== r)
          c.current.set(d, [b, w]);
        else
          continue;
      }
      n.push(d);
    }
    var s = [...c.current.keys()].filter((d) => !this.current.has(d));
    if (s.length === 0)
      t && c.discard();
    else if (n.length > 0) {
      if (t)
        for (const d of i(this, Ge))
          c.unskip_effect(d, (b) => {
            var w;
            (b.f & (oe | at)) !== 0 ? c.schedule(b) : k(w = c, T, xt).call(w, [b]);
          });
      c.activate();
      var l = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map();
      for (var o of n)
        Cn(o, s, l, a);
      a = /* @__PURE__ */ new Map();
      var f = [...c.current.keys()].filter(
        (d) => this.current.has(d) ? (
          /** @type {[any, boolean]} */
          this.current.get(d)[0] !== d
        ) : !0
      );
      for (const d of i(this, ct))
        (d.f & (se | Z | Bt)) === 0 && $t(d, f, a) && ((d.f & (at | oe)) !== 0 ? (j(d, N), c.schedule(d)) : i(c, ke).add(d));
      if (i(c, z).length > 0) {
        c.apply();
        for (var u of i(c, z))
          k(h = c, T, Yt).call(h, u, [], []);
        m(c, z, []);
      }
      c.deactivate();
    }
  }
  for (const c of Ae)
    i(c, Ce).has(this) && (i(c, Ce).delete(this), i(c, Ce).size === 0 && !k(_ = c, T, bt).call(_) && (c.activate(), k(v = c, T, yt).call(v)));
};
let Le = Rt;
function Ur() {
  try {
    Rr();
  } catch (e) {
    je(e, Vt);
  }
}
let he = null;
function hn(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (se | Z)) === 0 && pt(r) && (he = /* @__PURE__ */ new Set(), et(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Wn(r), he?.size > 0)) {
        Oe.clear();
        for (const s of he) {
          if ((s.f & (se | Z)) !== 0) continue;
          const l = [s];
          let a = s.parent;
          for (; a !== null; )
            he.has(a) && (he.delete(a), l.push(a)), a = a.parent;
          for (let o = l.length - 1; o >= 0; o--) {
            const f = l[o];
            (f.f & (se | Z)) === 0 && et(f);
          }
        }
        he.clear();
      }
    }
    he = null;
  }
}
function Cn(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const s of e.reactions) {
      const l = s.f;
      (l & M) !== 0 ? Cn(
        /** @type {Derived} */
        s,
        t,
        n,
        r
      ) : (l & (at | oe)) !== 0 && (l & N) === 0 && $t(s, t, r) && (j(s, N), en(
        /** @type {Effect} */
        s
      ));
    }
}
function $t(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const s of e.deps) {
      if (Ze.call(t, s))
        return !0;
      if ((s.f & M) !== 0 && $t(
        /** @type {Derived} */
        s,
        t,
        n
      ))
        return n.set(
          /** @type {Derived} */
          s,
          !0
        ), !0;
    }
  return n.set(e, !1), !1;
}
function en(e) {
  y.schedule(e);
}
function Pn(e, t) {
  if (!((e.f & be) !== 0 && (e.f & A) !== 0)) {
    (e.f & N) !== 0 ? t.d.push(e) : (e.f & ue) !== 0 && t.m.push(e), j(e, A);
    for (var n = e.first; n !== null; )
      Pn(n, t), n = n.next;
  }
}
function Fn(e) {
  j(e, A);
  for (var t = e.first; t !== null; )
    Fn(t), t = t.next;
}
function Vr(e) {
  let t = 0, n = Pt(0), r;
  return () => {
    rn() && (U(n), cs(() => (t === 0 && (r = gs(() => e(() => lt(n)))), t += 1, () => {
      Ye(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, lt(n));
      });
    })));
  };
}
var Yr = Xe | nt;
function Hr(e, t, n, r) {
  new Kr(e, t, n, r);
}
var K, Qt, G, Pe, D, W, P, L, ge, Fe, Ee, Je, dt, ht, we, Nt, E, Gr, Wr, Jr, Ht, kt, Et, Kt, Gt;
class Kr {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, s) {
    p(this, E);
    /** @type {Boundary | null} */
    $(this, "parent");
    $(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    $(this, "transform_error");
    /** @type {TemplateNode} */
    p(this, K);
    /** @type {TemplateNode | null} */
    p(this, Qt, null);
    /** @type {BoundaryProps} */
    p(this, G);
    /** @type {((anchor: Node) => void)} */
    p(this, Pe);
    /** @type {Effect} */
    p(this, D);
    /** @type {Effect | null} */
    p(this, W, null);
    /** @type {Effect | null} */
    p(this, P, null);
    /** @type {Effect | null} */
    p(this, L, null);
    /** @type {DocumentFragment | null} */
    p(this, ge, null);
    p(this, Fe, 0);
    p(this, Ee, 0);
    p(this, Je, !1);
    /** @type {Set<Effect>} */
    p(this, dt, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    p(this, ht, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    p(this, we, null);
    p(this, Nt, Vr(() => (m(this, we, Pt(i(this, Fe))), () => {
      m(this, we, null);
    })));
    m(this, K, t), m(this, G, n), m(this, Pe, (l) => {
      var a = (
        /** @type {Effect} */
        x
      );
      a.b = this, a.f |= qt, r(l);
    }), this.parent = /** @type {Effect} */
    x.b, this.transform_error = s ?? this.parent?.transform_error ?? ((l) => l), m(this, D, Kn(() => {
      k(this, E, Ht).call(this);
    }, Yr));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    Nn(t, i(this, dt), i(this, ht));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!i(this, G).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    k(this, E, Kt).call(this, t, n), m(this, Fe, i(this, Fe) + t), !(!i(this, we) || i(this, Je)) && (m(this, Je, !0), Ye(() => {
      m(this, Je, !1), i(this, we) && Tt(i(this, we), i(this, Fe));
    }));
  }
  get_effect_pending() {
    return i(this, Nt).call(this), U(
      /** @type {Source<number>} */
      i(this, we)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!i(this, G).onerror && !i(this, G).failed)
      throw t;
    y?.is_fork ? (i(this, W) && y.skip_effect(i(this, W)), i(this, P) && y.skip_effect(i(this, P)), i(this, L) && y.skip_effect(i(this, L)), y.on_fork_commit(() => {
      k(this, E, Gt).call(this, t);
    })) : k(this, E, Gt).call(this, t);
  }
}
K = new WeakMap(), Qt = new WeakMap(), G = new WeakMap(), Pe = new WeakMap(), D = new WeakMap(), W = new WeakMap(), P = new WeakMap(), L = new WeakMap(), ge = new WeakMap(), Fe = new WeakMap(), Ee = new WeakMap(), Je = new WeakMap(), dt = new WeakMap(), ht = new WeakMap(), we = new WeakMap(), Nt = new WeakMap(), E = new WeakSet(), Gr = function() {
  try {
    m(this, W, ve(() => i(this, Pe).call(this, i(this, K))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Wr = function(t) {
  const n = i(this, G).failed;
  n && m(this, L, ve(() => {
    n(
      i(this, K),
      () => t,
      () => () => {
      }
    );
  }));
}, Jr = function() {
  const t = i(this, G).pending;
  t && (this.is_pending = !0, m(this, P, ve(() => t(i(this, K)))), Ye(() => {
    var n = m(this, ge, document.createDocumentFragment()), r = At();
    n.append(r), m(this, W, k(this, E, Et).call(this, () => ve(() => i(this, Pe).call(this, r)))), i(this, Ee) === 0 && (i(this, K).before(n), m(this, ge, null), ft(
      /** @type {Effect} */
      i(this, P),
      () => {
        m(this, P, null);
      }
    ), k(this, E, kt).call(
      this,
      /** @type {Batch} */
      y
    ));
  }));
}, Ht = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), m(this, Ee, 0), m(this, Fe, 0), m(this, W, ve(() => {
      i(this, Pe).call(this, i(this, K));
    })), i(this, Ee) > 0) {
      var t = m(this, ge, document.createDocumentFragment());
      Qn(i(this, W), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        i(this, G).pending
      );
      m(this, P, ve(() => n(i(this, K))));
    } else
      k(this, E, kt).call(
        this,
        /** @type {Batch} */
        y
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
kt = function(t) {
  this.is_pending = !1, t.transfer_effects(i(this, dt), i(this, ht));
}, /**
 * @template T
 * @param {() => T} fn
 */
Et = function(t) {
  var n = x, r = g, s = ie;
  ce(i(this, D)), X(i(this, D)), $e(i(this, D).ctx);
  try {
    return Le.ensure(), t();
  } catch (l) {
    return An(l), null;
  } finally {
    ce(n), X(r), $e(s);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Kt = function(t, n) {
  var r;
  if (!this.has_pending_snippet()) {
    this.parent && k(r = this.parent, E, Kt).call(r, t, n);
    return;
  }
  m(this, Ee, i(this, Ee) + t), i(this, Ee) === 0 && (k(this, E, kt).call(this, n), i(this, P) && ft(i(this, P), () => {
    m(this, P, null);
  }), i(this, ge) && (i(this, K).before(i(this, ge)), m(this, ge, null)));
}, /**
 * @param {unknown} error
 */
Gt = function(t) {
  i(this, W) && (V(i(this, W)), m(this, W, null)), i(this, P) && (V(i(this, P)), m(this, P, null)), i(this, L) && (V(i(this, L)), m(this, L, null));
  var n = i(this, G).onerror;
  let r = i(this, G).failed;
  var s = !1, l = !1;
  const a = () => {
    if (s) {
      Ir();
      return;
    }
    s = !0, l && Pr(), i(this, L) !== null && ft(i(this, L), () => {
      m(this, L, null);
    }), k(this, E, Et).call(this, () => {
      k(this, E, Ht).call(this);
    });
  }, o = (f) => {
    try {
      l = !0, n?.(f, a), l = !1;
    } catch (u) {
      je(u, i(this, D) && i(this, D).parent);
    }
    r && m(this, L, k(this, E, Et).call(this, () => {
      try {
        return ve(() => {
          var u = (
            /** @type {Effect} */
            x
          );
          u.b = this, u.f |= qt, r(
            i(this, K),
            () => f,
            () => a
          );
        });
      } catch (u) {
        return je(
          u,
          /** @type {Effect} */
          i(this, D).parent
        ), null;
      }
    }));
  };
  Ye(() => {
    var f;
    try {
      f = this.transform_error(t);
    } catch (u) {
      je(u, i(this, D) && i(this, D).parent);
      return;
    }
    f !== null && typeof f == "object" && typeof /** @type {any} */
    f.then == "function" ? f.then(
      o,
      /** @param {unknown} e */
      (u) => je(u, i(this, D) && i(this, D).parent)
    ) : o(f);
  });
};
function Zr(e, t, n, r) {
  const s = Xr;
  var l = e.filter((v) => !v.settled);
  if (n.length === 0 && l.length === 0) {
    r(t.map(s));
    return;
  }
  var a = (
    /** @type {Effect} */
    x
  ), o = Qr(), f = l.length === 1 ? l[0].promise : l.length > 1 ? Promise.all(l.map((v) => v.promise)) : null;
  function u(v) {
    o();
    try {
      r(v);
    } catch (c) {
      (a.f & se) === 0 && je(c, a);
    }
    St();
  }
  if (n.length === 0) {
    f.then(() => u(t.map(s)));
    return;
  }
  var h = Dn();
  function _() {
    Promise.all(n.map((v) => /* @__PURE__ */ $r(v))).then((v) => u([...t.map(s), ...v])).catch((v) => je(v, a)).finally(() => h());
  }
  f ? f.then(() => {
    o(), _(), St();
  }) : _();
}
function Qr() {
  var e = (
    /** @type {Effect} */
    x
  ), t = g, n = ie, r = (
    /** @type {Batch} */
    y
  );
  return function(l = !0) {
    ce(e), X(t), $e(n), l && (e.f & se) === 0 && (r?.activate(), r?.apply());
  };
}
function St(e = !0) {
  ce(null), X(null), $e(null), e && y?.deactivate();
}
function Dn() {
  var e = (
    /** @type {Effect} */
    x
  ), t = (
    /** @type {Boundary} */
    e.b
  ), n = (
    /** @type {Batch} */
    y
  ), r = t.is_rendered();
  return t.update_pending_count(1, n), n.increment(r, e), (s = !1) => {
    t.update_pending_count(-1, n), n.decrement(r, e, s);
  };
}
// @__NO_SIDE_EFFECTS__
function Xr(e) {
  var t = M | N;
  return x !== null && (x.f |= nt), {
    ctx: ie,
    deps: null,
    effects: null,
    equals: En,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      R
    ),
    wv: 0,
    parent: x,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function $r(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    x
  );
  r === null && Ar();
  var s = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), l = Pt(
    /** @type {V} */
    R
  ), a = !g, o = /* @__PURE__ */ new Map();
  return us(() => {
    var f = (
      /** @type {Effect} */
      x
    ), u = xn();
    s = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, u.reject).finally(St);
    } catch (c) {
      u.reject(c), St();
    }
    var h = (
      /** @type {Batch} */
      y
    );
    if (a) {
      if ((f.f & tt) !== 0)
        var _ = Dn();
      if (
        /** @type {Boundary} */
        r.b.is_rendered()
      )
        o.get(h)?.reject(_e), o.delete(h);
      else {
        for (const c of o.values())
          c.reject(_e);
        o.clear();
      }
      o.set(h, u);
    }
    const v = (c, d = void 0) => {
      if (_) {
        var b = d === _e;
        _(b);
      }
      if (!(d === _e || (f.f & se) !== 0)) {
        if (h.activate(), d)
          l.f |= Se, Tt(l, d);
        else {
          (l.f & Se) !== 0 && (l.f ^= Se), Tt(l, c);
          for (const [w, F] of o) {
            if (o.delete(w), w === h) break;
            F.reject(_e);
          }
        }
        h.deactivate();
      }
    };
    u.promise.then(v, (c) => v(null, c || "unknown"));
  }), ls(() => {
    for (const f of o.values())
      f.reject(_e);
  }), new Promise((f) => {
    function u(h) {
      function _() {
        h === s ? f(l) : u(s);
      }
      h.then(_, _);
    }
    u(s);
  });
}
function es(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      V(
        /** @type {Effect} */
        t[n]
      );
  }
}
function tn(e) {
  var t, n = x, r = e.parent;
  if (!qe && r !== null && (r.f & (se | Z)) !== 0)
    return Or(), e.v;
  ce(r);
  try {
    e.f &= ~ze, es(e), t = tr(e);
  } finally {
    ce(n);
  }
  return t;
}
function On(e) {
  var t = tn(e);
  if (!e.equals(t) && (e.wv = $n(), (!y?.is_fork || e.deps === null) && (y !== null ? y.capture(e, t, !0) : e.v = t, e.deps === null))) {
    j(e, A);
    return;
  }
  qe || (ne !== null ? (rn() || y?.is_fork) && ne.set(e, t) : Xt(e));
}
function ts(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(_e), t.teardown = Er, t.ac = null, ot(t, 0), sn(t));
}
function In(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && et(t);
}
let Wt = /* @__PURE__ */ new Set();
const Oe = /* @__PURE__ */ new Map();
let zn = !1;
function Pt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: En,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function ee(e, t) {
  const n = Pt(e);
  return _s(n), n;
}
function B(e, t, n = !1) {
  g !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!re || (g.f & Bt) !== 0) && Tn() && (g.f & (M | oe | at | Bt)) !== 0 && (Q === null || !Ze.call(Q, e)) && Cr();
  let r = n ? st(t) : t;
  return Tt(e, r, wt);
}
function Tt(e, t, n = null) {
  if (!e.equals(t)) {
    Oe.set(e, qe ? t : e.v);
    var r = Le.ensure();
    if (r.capture(e, t), (e.f & M) !== 0) {
      const s = (
        /** @type {Derived} */
        e
      );
      (e.f & N) !== 0 && tn(s), ne === null && Xt(s);
    }
    e.wv = $n(), Ln(e, N, n), x !== null && (x.f & A) !== 0 && (x.f & (be | Te)) === 0 && (H === null ? ps([e]) : H.push(e)), !r.is_fork && Wt.size > 0 && !zn && ns();
  }
  return t;
}
function ns() {
  zn = !1;
  for (const e of Wt)
    (e.f & A) !== 0 && j(e, ue), pt(e) && et(e);
  Wt.clear();
}
function lt(e) {
  B(e, e.v + 1);
}
function Ln(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var s = r.length, l = 0; l < s; l++) {
      var a = r[l], o = a.f, f = (o & N) === 0;
      if (f && j(a, t), (o & M) !== 0) {
        var u = (
          /** @type {Derived} */
          a
        );
        ne?.delete(u), (o & ze) === 0 && (o & J && (a.f |= ze), Ln(u, ue, n));
      } else if (f) {
        var h = (
          /** @type {Effect} */
          a
        );
        (o & oe) !== 0 && he !== null && he.add(h), n !== null ? n.push(h) : en(h);
      }
    }
}
function st(e) {
  if (typeof e != "object" || e === null || Ot in e)
    return e;
  const t = kr(e);
  if (t !== yr && t !== xr)
    return e;
  var n = /* @__PURE__ */ new Map(), r = mr(e), s = /* @__PURE__ */ ee(0), l = Ie, a = (o) => {
    if (Ie === l)
      return o();
    var f = g, u = Ie;
    X(null), pn(l);
    var h = o();
    return X(f), pn(u), h;
  };
  return r && n.set("length", /* @__PURE__ */ ee(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(o, f, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && Nr();
        var h = n.get(f);
        return h === void 0 ? a(() => {
          var _ = /* @__PURE__ */ ee(u.value);
          return n.set(f, _), _;
        }) : B(h, u.value, !0), !0;
      },
      deleteProperty(o, f) {
        var u = n.get(f);
        if (u === void 0) {
          if (f in o) {
            const h = a(() => /* @__PURE__ */ ee(R));
            n.set(f, h), lt(s);
          }
        } else
          B(u, R), lt(s);
        return !0;
      },
      get(o, f, u) {
        if (f === Ot)
          return e;
        var h = n.get(f), _ = f in o;
        if (h === void 0 && (!_ || it(o, f)?.writable) && (h = a(() => {
          var c = st(_ ? o[f] : R), d = /* @__PURE__ */ ee(c);
          return d;
        }), n.set(f, h)), h !== void 0) {
          var v = U(h);
          return v === R ? void 0 : v;
        }
        return Reflect.get(o, f, u);
      },
      getOwnPropertyDescriptor(o, f) {
        var u = Reflect.getOwnPropertyDescriptor(o, f);
        if (u && "value" in u) {
          var h = n.get(f);
          h && (u.value = U(h));
        } else if (u === void 0) {
          var _ = n.get(f), v = _?.v;
          if (_ !== void 0 && v !== R)
            return {
              enumerable: !0,
              configurable: !0,
              value: v,
              writable: !0
            };
        }
        return u;
      },
      has(o, f) {
        if (f === Ot)
          return !0;
        var u = n.get(f), h = u !== void 0 && u.v !== R || Reflect.has(o, f);
        if (u !== void 0 || x !== null && (!h || it(o, f)?.writable)) {
          u === void 0 && (u = a(() => {
            var v = h ? st(o[f]) : R, c = /* @__PURE__ */ ee(v);
            return c;
          }), n.set(f, u));
          var _ = U(u);
          if (_ === R)
            return !1;
        }
        return h;
      },
      set(o, f, u, h) {
        var _ = n.get(f), v = f in o;
        if (r && f === "length")
          for (var c = u; c < /** @type {Source<number>} */
          _.v; c += 1) {
            var d = n.get(c + "");
            d !== void 0 ? B(d, R) : c in o && (d = a(() => /* @__PURE__ */ ee(R)), n.set(c + "", d));
          }
        if (_ === void 0)
          (!v || it(o, f)?.writable) && (_ = a(() => /* @__PURE__ */ ee(void 0)), B(_, st(u)), n.set(f, _));
        else {
          v = _.v !== R;
          var b = a(() => st(u));
          B(_, b);
        }
        var w = Reflect.getOwnPropertyDescriptor(o, f);
        if (w?.set && w.set.call(h, u), !v) {
          if (r && typeof f == "string") {
            var F = (
              /** @type {Source<number>} */
              n.get("length")
            ), xe = Number(f);
            Number.isInteger(xe) && xe >= F.v && B(F, xe + 1);
          }
          lt(s);
        }
        return !0;
      },
      ownKeys(o) {
        U(s);
        var f = Reflect.ownKeys(o).filter((_) => {
          var v = n.get(_);
          return v === void 0 || v.v !== R;
        });
        for (var [u, h] of n)
          h.v !== R && !(u in o) && f.push(u);
        return f;
      },
      setPrototypeOf() {
        Mr();
      }
    }
  );
}
var vn, qn, Bn, Un;
function rs() {
  if (vn === void 0) {
    vn = window, qn = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Bn = it(t, "firstChild").get, Un = it(t, "nextSibling").get, un(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), un(n) && (n.__t = void 0);
  }
}
function At(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Vn(e) {
  return (
    /** @type {TemplateNode | null} */
    Bn.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function nn(e) {
  return (
    /** @type {TemplateNode | null} */
    Un.call(e)
  );
}
function C(e, t) {
  return /* @__PURE__ */ Vn(e);
}
function Y(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ nn(r);
  return r;
}
function ss() {
  return !1;
}
function Yn(e, t, n) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(Dr, e, void 0)
  );
}
function Hn(e) {
  var t = g, n = x;
  X(null), ce(null);
  try {
    return e();
  } finally {
    X(t), ce(n);
  }
}
function is(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function ye(e, t) {
  var n = x;
  n !== null && (n.f & Z) !== 0 && (e |= Z);
  var r = {
    ctx: ie,
    deps: null,
    nodes: null,
    f: e | N | J,
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
  y?.register_created_effect(r);
  var s = r;
  if ((e & Qe) !== 0)
    Ve !== null ? Ve.push(r) : Le.ensure().schedule(r);
  else if (t !== null) {
    try {
      et(r);
    } catch (a) {
      throw V(r), a;
    }
    s.deps === null && s.teardown === null && s.nodes === null && s.first === s.last && // either `null`, or a singular child
    (s.f & nt) === 0 && (s = s.first, (e & oe) !== 0 && (e & Xe) !== 0 && s !== null && (s.f |= Xe));
  }
  if (s !== null && (s.parent = n, n !== null && is(s, n), g !== null && (g.f & M) !== 0 && (e & Te) === 0)) {
    var l = (
      /** @type {Derived} */
      g
    );
    (l.effects ?? (l.effects = [])).push(s);
  }
  return r;
}
function rn() {
  return g !== null && !re;
}
function ls(e) {
  const t = ye(Ct, null);
  return j(t, A), t.teardown = e, t;
}
function fs(e) {
  return ye(Qe | Tr, e);
}
function as(e) {
  Le.ensure();
  const t = ye(Te | nt, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? ft(t, () => {
      V(t), r(void 0);
    }) : (V(t), r(void 0));
  });
}
function os(e) {
  return ye(Qe, e);
}
function us(e) {
  return ye(at | nt, e);
}
function cs(e, t = 0) {
  return ye(Ct | t, e);
}
function zt(e, t = [], n = [], r = []) {
  Zr(r, t, n, (s) => {
    ye(Ct, () => e(...s.map(U)));
  });
}
function Kn(e, t = 0) {
  var n = ye(oe | t, e);
  return n;
}
function ve(e) {
  return ye(be | nt, e);
}
function Gn(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = qe, r = g;
    _n(!0), X(null);
    try {
      t.call(null);
    } finally {
      _n(n), X(r);
    }
  }
}
function sn(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const s = n.ac;
    s !== null && Hn(() => {
      s.abort(_e);
    });
    var r = n.next;
    (n.f & Te) !== 0 ? n.parent = null : V(n, t), n = r;
  }
}
function ds(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & be) === 0 && V(t), t = n;
  }
}
function V(e, t = !0) {
  var n = !1;
  (t || (e.f & Sr) !== 0) && e.nodes !== null && e.nodes.end !== null && (hs(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), j(e, cn), sn(e, t && !n), ot(e, 0);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const l of r)
      l.stop();
  Gn(e), e.f ^= cn, e.f |= se;
  var s = e.parent;
  s !== null && s.first !== null && Wn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function hs(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ nn(e);
    e.remove(), e = n;
  }
}
function Wn(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function ft(e, t, n = !0) {
  var r = [];
  Jn(e, r, !0);
  var s = () => {
    n && V(e), t && t();
  }, l = r.length;
  if (l > 0) {
    var a = () => --l || s();
    for (var o of r)
      o.out(a);
  } else
    s();
}
function Jn(e, t, n) {
  if ((e.f & Z) === 0) {
    e.f ^= Z;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const o of r)
        (o.is_global || n) && t.push(o);
    for (var s = e.first; s !== null; ) {
      var l = s.next;
      if ((s.f & Te) === 0) {
        var a = (s.f & Xe) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (s.f & be) !== 0 && (e.f & oe) !== 0;
        Jn(s, t, a ? n : !1);
      }
      s = l;
    }
  }
}
function vs(e) {
  Zn(e, !0);
}
function Zn(e, t) {
  if ((e.f & Z) !== 0) {
    e.f ^= Z, (e.f & A) === 0 && (j(e, N), Le.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, s = (n.f & Xe) !== 0 || (n.f & be) !== 0;
      Zn(n, s ? t : !1), n = r;
    }
    var l = e.nodes && e.nodes.t;
    if (l !== null)
      for (const a of l)
        (a.is_global || t) && a.in();
  }
}
function Qn(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var s = n === r ? null : /* @__PURE__ */ nn(n);
      t.append(n), n = s;
    }
}
let jt = !1, qe = !1;
function _n(e) {
  qe = e;
}
let g = null, re = !1;
function X(e) {
  g = e;
}
let x = null;
function ce(e) {
  x = e;
}
let Q = null;
function _s(e) {
  g !== null && (Q === null ? Q = [e] : Q.push(e));
}
let O = null, I = 0, H = null;
function ps(e) {
  H = e;
}
let Xn = 1, Re = 0, Ie = Re;
function pn(e) {
  Ie = e;
}
function $n() {
  return ++Xn;
}
function pt(e) {
  var t = e.f;
  if ((t & N) !== 0)
    return !0;
  if (t & M && (e.f &= ~ze), (t & ue) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, s = 0; s < r; s++) {
      var l = n[s];
      if (pt(
        /** @type {Derived} */
        l
      ) && On(
        /** @type {Derived} */
        l
      ), l.wv > e.wv)
        return !0;
    }
    (t & J) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    ne === null && j(e, A);
  }
  return !1;
}
function er(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(Q !== null && Ze.call(Q, e)))
    for (var s = 0; s < r.length; s++) {
      var l = r[s];
      (l.f & M) !== 0 ? er(
        /** @type {Derived} */
        l,
        t,
        !1
      ) : t === l && (n ? j(l, N) : (l.f & A) !== 0 && j(l, ue), en(
        /** @type {Effect} */
        l
      ));
    }
}
function tr(e) {
  var b;
  var t = O, n = I, r = H, s = g, l = Q, a = ie, o = re, f = Ie, u = e.f;
  O = /** @type {null | Value[]} */
  null, I = 0, H = null, g = (u & (be | Te)) === 0 ? e : null, Q = null, $e(e.ctx), re = !1, Ie = ++Re, e.ac !== null && (Hn(() => {
    e.ac.abort(_e);
  }), e.ac = null);
  try {
    e.f |= Ut;
    var h = (
      /** @type {Function} */
      e.fn
    ), _ = h();
    e.f |= tt;
    var v = e.deps, c = y?.is_fork;
    if (O !== null) {
      var d;
      if (c || ot(e, I), v !== null && I > 0)
        for (v.length = I + O.length, d = 0; d < O.length; d++)
          v[I + d] = O[d];
      else
        e.deps = v = O;
      if (rn() && (e.f & J) !== 0)
        for (d = I; d < v.length; d++)
          ((b = v[d]).reactions ?? (b.reactions = [])).push(e);
    } else !c && v !== null && I < v.length && (ot(e, I), v.length = I);
    if (Tn() && H !== null && !re && v !== null && (e.f & (M | ue | N)) === 0)
      for (d = 0; d < /** @type {Source[]} */
      H.length; d++)
        er(
          H[d],
          /** @type {Effect} */
          e
        );
    if (s !== null && s !== e) {
      if (Re++, s.deps !== null)
        for (let w = 0; w < n; w += 1)
          s.deps[w].rv = Re;
      if (t !== null)
        for (const w of t)
          w.rv = Re;
      H !== null && (r === null ? r = H : r.push(.../** @type {Source[]} */
      H));
    }
    return (e.f & Se) !== 0 && (e.f ^= Se), _;
  } catch (w) {
    return An(w);
  } finally {
    e.f ^= Ut, O = t, I = n, H = r, g = s, Q = l, $e(a), re = o, Ie = f;
  }
}
function ms(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = gr.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? n = t.reactions = null : (n[r] = n[s], n.pop());
    }
  }
  if (n === null && (t.f & M) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (O === null || !Ze.call(O, t))) {
    var l = (
      /** @type {Derived} */
      t
    );
    (l.f & J) !== 0 && (l.f ^= J, l.f &= ~ze), l.v !== R && Xt(l), ts(l), ot(l, 0);
  }
}
function ot(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      ms(e, n[r]);
}
function et(e) {
  var t = e.f;
  if ((t & se) === 0) {
    j(e, A);
    var n = x, r = jt;
    x = e, jt = !0;
    try {
      (t & (oe | kn)) !== 0 ? ds(e) : sn(e), Gn(e);
      var s = tr(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = Xn;
      var l;
    } finally {
      jt = r, x = n;
    }
  }
}
function U(e) {
  var t = e.f, n = (t & M) !== 0;
  if (g !== null && !re) {
    var r = x !== null && (x.f & se) !== 0;
    if (!r && (Q === null || !Ze.call(Q, e))) {
      var s = g.deps;
      if ((g.f & Ut) !== 0)
        e.rv < Re && (e.rv = Re, O === null && s !== null && s[I] === e ? I++ : O === null ? O = [e] : O.push(e));
      else {
        (g.deps ?? (g.deps = [])).push(e);
        var l = e.reactions;
        l === null ? e.reactions = [g] : Ze.call(l, g) || l.push(g);
      }
    }
  }
  if (qe && Oe.has(e))
    return Oe.get(e);
  if (n) {
    var a = (
      /** @type {Derived} */
      e
    );
    if (qe) {
      var o = a.v;
      return ((a.f & A) === 0 && a.reactions !== null || rr(a)) && (o = tn(a)), Oe.set(a, o), o;
    }
    var f = (a.f & J) === 0 && !re && g !== null && (jt || (g.f & J) !== 0), u = (a.f & tt) === 0;
    pt(a) && (f && (a.f |= J), On(a)), f && !u && (In(a), nr(a));
  }
  if (ne?.has(e))
    return ne.get(e);
  if ((e.f & Se) !== 0)
    throw e.v;
  return e.v;
}
function nr(e) {
  if (e.f |= J, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & M) !== 0 && (t.f & J) === 0 && (In(
        /** @type {Derived} */
        t
      ), nr(
        /** @type {Derived} */
        t
      ));
}
function rr(e) {
  if (e.v === R) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Oe.has(t) || (t.f & M) !== 0 && rr(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function gs(e) {
  var t = re;
  try {
    return re = !0, e();
  } finally {
    re = t;
  }
}
const ws = ["touchstart", "touchmove"];
function bs(e) {
  return ws.includes(e);
}
const Ne = Symbol("events"), sr = /* @__PURE__ */ new Set(), Jt = /* @__PURE__ */ new Set();
function ys(e, t, n) {
  (t[Ne] ?? (t[Ne] = {}))[e] = n;
}
function xs(e) {
  for (var t = 0; t < e.length; t++)
    sr.add(e[t]);
  for (var n of Jt)
    n(e);
}
let mn = null;
function gn(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, s = e.composedPath?.() || [], l = (
    /** @type {null | Element} */
    s[0] || e.target
  );
  mn = e;
  var a = 0, o = mn === e && e[Ne];
  if (o) {
    var f = s.indexOf(o);
    if (f !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Ne] = t;
      return;
    }
    var u = s.indexOf(t);
    if (u === -1)
      return;
    f <= u && (a = f);
  }
  if (l = /** @type {Element} */
  s[a] || e.target, l !== t) {
    br(e, "currentTarget", {
      configurable: !0,
      get() {
        return l || n;
      }
    });
    var h = g, _ = x;
    X(null), ce(null);
    try {
      for (var v, c = []; l !== null; ) {
        var d = l.assignedSlot || l.parentNode || /** @type {any} */
        l.host || null;
        try {
          var b = l[Ne]?.[r];
          b != null && (!/** @type {any} */
          l.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === l) && b.call(l, e);
        } catch (w) {
          v ? c.push(w) : v = w;
        }
        if (e.cancelBubble || d === t || d === null)
          break;
        l = d;
      }
      if (v) {
        for (let w of c)
          queueMicrotask(() => {
            throw w;
          });
        throw v;
      }
    } finally {
      e[Ne] = t, delete e.currentTarget, X(h), ce(_);
    }
  }
}
const ks = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Es(e) {
  return (
    /** @type {string} */
    ks?.createHTML(e) ?? e
  );
}
function js(e) {
  var t = Yn("template");
  return t.innerHTML = Es(e.replaceAll("<!>", "<!---->")), t.content;
}
function Ss(e, t) {
  var n = (
    /** @type {Effect} */
    x
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function ln(e, t) {
  var n = (t & Fr) !== 0, r, s = !e.startsWith("<!>");
  return () => {
    r === void 0 && (r = js(s ? e : "<!>" + e), r = /** @type {TemplateNode} */
    /* @__PURE__ */ Vn(r));
    var l = (
      /** @type {TemplateNode} */
      n || qn ? document.importNode(r, !0) : r.cloneNode(!0)
    );
    return Ss(l, l), l;
  };
}
function Lt(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function de(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = n, e.nodeValue = `${n}`);
}
function Ts(e, t) {
  return As(e, t);
}
const gt = /* @__PURE__ */ new Map();
function As(e, { target: t, anchor: n, props: r = {}, events: s, context: l, intro: a = !0, transformError: o }) {
  rs();
  var f = void 0, u = as(() => {
    var h = n ?? t.appendChild(At());
    Hr(
      /** @type {TemplateNode} */
      h,
      {
        pending: () => {
        }
      },
      (c) => {
        jn({});
        var d = (
          /** @type {ComponentContext} */
          ie
        );
        l && (d.c = l), s && (r.$$events = s), f = e(c, r) || {}, Sn();
      },
      o
    );
    var _ = /* @__PURE__ */ new Set(), v = (c) => {
      for (var d = 0; d < c.length; d++) {
        var b = c[d];
        if (!_.has(b)) {
          _.add(b);
          var w = bs(b);
          for (const Be of [t, document]) {
            var F = gt.get(Be);
            F === void 0 && (F = /* @__PURE__ */ new Map(), gt.set(Be, F));
            var xe = F.get(b);
            xe === void 0 ? (Be.addEventListener(b, gn, { passive: w }), F.set(b, 1)) : F.set(b, xe + 1);
          }
        }
      }
    };
    return v(wr(sr)), Jt.add(v), () => {
      for (var c of _)
        for (const w of [t, document]) {
          var d = (
            /** @type {Map<string, number>} */
            gt.get(w)
          ), b = (
            /** @type {number} */
            d.get(c)
          );
          --b == 0 ? (w.removeEventListener(c, gn), d.delete(c), d.size === 0 && gt.delete(w)) : d.set(c, b);
        }
      Jt.delete(v), h !== n && h.parentNode?.removeChild(h);
    };
  });
  return Zt.set(f, u), f;
}
let Zt = /* @__PURE__ */ new WeakMap();
function Rs(e, t) {
  const n = Zt.get(e);
  return n ? (Zt.delete(e), n(t)) : Promise.resolve();
}
var te, ae, q, De, vt, _t, Mt;
class Ns {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    $(this, "anchor");
    /** @type {Map<Batch, Key>} */
    p(this, te, /* @__PURE__ */ new Map());
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
    p(this, ae, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    p(this, q, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    p(this, De, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    p(this, vt, !0);
    /**
     * @param {Batch} batch
     */
    p(this, _t, (t) => {
      if (i(this, te).has(t)) {
        var n = (
          /** @type {Key} */
          i(this, te).get(t)
        ), r = i(this, ae).get(n);
        if (r)
          vs(r), i(this, De).delete(n);
        else {
          var s = i(this, q).get(n);
          s && (i(this, ae).set(n, s.effect), i(this, q).delete(n), s.fragment.lastChild.remove(), this.anchor.before(s.fragment), r = s.effect);
        }
        for (const [l, a] of i(this, te)) {
          if (i(this, te).delete(l), l === t)
            break;
          const o = i(this, q).get(a);
          o && (V(o.effect), i(this, q).delete(a));
        }
        for (const [l, a] of i(this, ae)) {
          if (l === n || i(this, De).has(l)) continue;
          const o = () => {
            if (Array.from(i(this, te).values()).includes(l)) {
              var u = document.createDocumentFragment();
              Qn(a, u), u.append(At()), i(this, q).set(l, { effect: a, fragment: u });
            } else
              V(a);
            i(this, De).delete(l), i(this, ae).delete(l);
          };
          i(this, vt) || !r ? (i(this, De).add(l), ft(a, o, !1)) : o();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    p(this, Mt, (t) => {
      i(this, te).delete(t);
      const n = Array.from(i(this, te).values());
      for (const [r, s] of i(this, q))
        n.includes(r) || (V(s.effect), i(this, q).delete(r));
    });
    this.anchor = t, m(this, vt, n);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var r = (
      /** @type {Batch} */
      y
    ), s = ss();
    if (n && !i(this, ae).has(t) && !i(this, q).has(t))
      if (s) {
        var l = document.createDocumentFragment(), a = At();
        l.append(a), i(this, q).set(t, {
          effect: ve(() => n(a)),
          fragment: l
        });
      } else
        i(this, ae).set(
          t,
          ve(() => n(this.anchor))
        );
    if (i(this, te).set(r, t), s) {
      for (const [o, f] of i(this, ae))
        o === t ? r.unskip_effect(f) : r.skip_effect(f);
      for (const [o, f] of i(this, q))
        o === t ? r.unskip_effect(f.effect) : r.skip_effect(f.effect);
      r.oncommit(i(this, _t)), r.ondiscard(i(this, Mt));
    } else
      i(this, _t).call(this, r);
  }
}
te = new WeakMap(), ae = new WeakMap(), q = new WeakMap(), De = new WeakMap(), vt = new WeakMap(), _t = new WeakMap(), Mt = new WeakMap();
function wn(e, t, n = !1) {
  var r = new Ns(e), s = n ? Xe : 0;
  function l(a, o) {
    r.ensure(a, o);
  }
  Kn(() => {
    var a = !1;
    t((o, f = 0) => {
      a = !0, l(f, o);
    }), a || l(-1, null);
  }, s);
}
function Ms(e, t) {
  os(() => {
    var n = e.getRootNode(), r = (
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
    if (!r.querySelector("#" + t.hash)) {
      const s = Yn("style");
      s.id = t.hash, s.textContent = t.code, r.appendChild(s);
    }
  });
}
function bn(e, t, n, r) {
  var s = (
    /** @type {V} */
    r
  ), l = !0, a = () => (l && (l = !1, s = /** @type {V} */
  r), s), o;
  o = /** @type {V} */
  e[t], o === void 0 && r !== void 0 && (o = a());
  var f;
  return f = () => {
    var u = (
      /** @type {V} */
      e[t]
    );
    return u === void 0 ? a() : (l = !0, u);
  }, f;
}
const Cs = "5";
var yn;
typeof window < "u" && ((yn = window.__svelte ?? (window.__svelte = {})).v ?? (yn.v = /* @__PURE__ */ new Set())).add(Cs);
var Ps = /* @__PURE__ */ ln('<pre class="out err svelte-1jnrmus"> </pre>'), Fs = /* @__PURE__ */ ln('<pre class="out svelte-1jnrmus"> </pre>'), Ds = /* @__PURE__ */ ln(`<div class="rt-root svelte-1jnrmus"><header class="hero svelte-1jnrmus"><span class="badge svelte-1jnrmus"> </span> <h1 class="svelte-1jnrmus"> <small class="svelte-1jnrmus">(runtime-loaded)</small></h1> <p class="sub svelte-1jnrmus">This bundle was fetched from <code class="svelte-1jnrmus">file_registry</code> at runtime —
			no bundled extension code is shipped in the host realm WASM.</p></header> <section class="card svelte-1jnrmus"><header class="card-head svelte-1jnrmus"><h2 class="svelte-1jnrmus">Host context</h2></header> <dl class="kv svelte-1jnrmus"><dt class="svelte-1jnrmus">Authenticated</dt> <dd class="svelte-1jnrmus"> </dd> <dt class="svelte-1jnrmus">Principal</dt> <dd class="mono svelte-1jnrmus"> </dd> <dt class="svelte-1jnrmus">Bundle</dt> <dd class="mono svelte-1jnrmus"> </dd></dl></section> <section class="card svelte-1jnrmus"><header class="card-head svelte-1jnrmus"><h2 class="svelte-1jnrmus">Backend smoke test</h2></header> <p class="sub svelte-1jnrmus">Calls <code class="svelte-1jnrmus"> </code>.
			If this extension does not implement <code class="svelte-1jnrmus">health</code>, expect a <code class="svelte-1jnrmus">function_not_found</code> response — that still proves the call
			reached the runtime-installed extension.</p> <button class="btn svelte-1jnrmus"> </button> <!> <!></section> <footer class="rt-foot svelte-1jnrmus">Scaffolded by <code class="svelte-1jnrmus">scripts/scaffold_runtime_bundles.py</code> — replace <code class="svelte-1jnrmus">src/Placeholder.svelte</code> with the real UI and re-build.</footer></div>`);
const Os = {
  hash: "svelte-1jnrmus",
  code: ".rt-root.svelte-1jnrmus {font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;color:#0f172a;max-width:960px;display:flex;flex-direction:column;gap:18px;}.hero.svelte-1jnrmus {border:2px solid #3b82f6;border-radius:12px;padding:18px 20px;background:linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);color:#1e3a8a;}.hero.svelte-1jnrmus h1:where(.svelte-1jnrmus) {margin:6px 0 4px;font-size:22px;}.hero.svelte-1jnrmus h1:where(.svelte-1jnrmus) small:where(.svelte-1jnrmus) {font-size:14px;font-weight:500;color:#1e40af;}.sub.svelte-1jnrmus {margin:4px 0;font-size:13px;opacity:0.85;}.badge.svelte-1jnrmus {display:inline-block;background:#1d4ed8;color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;}.card.svelte-1jnrmus {background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;}.card-head.svelte-1jnrmus h2:where(.svelte-1jnrmus) {margin:0 0 8px;font-size:16px;}.kv.svelte-1jnrmus {display:grid;grid-template-columns:max-content 1fr;column-gap:14px;row-gap:4px;margin:0;}.kv.svelte-1jnrmus dt:where(.svelte-1jnrmus) {font-size:12px;color:#64748b;}.kv.svelte-1jnrmus dd:where(.svelte-1jnrmus) {margin:0;font-size:13px;}.mono.svelte-1jnrmus {font-family:ui-monospace, SFMono-Regular, Consolas, monospace;}.btn.svelte-1jnrmus {background:#1d4ed8;color:#fff;border:0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;}.btn.svelte-1jnrmus:disabled {opacity:0.6;cursor:progress;}.out.svelte-1jnrmus {margin-top:10px;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px;font-size:12px;overflow-x:auto;}.out.err.svelte-1jnrmus {background:#7f1d1d;color:#fee2e2;}code.svelte-1jnrmus {background:rgba(0, 0, 0, 0.06);padding:1px 5px;border-radius:4px;font-family:ui-monospace, SFMono-Regular, Consolas, monospace;font-size:0.92em;}.rt-foot.svelte-1jnrmus {font-size:11px;color:#94a3b8;text-align:center;padding-top:4px;}"
};
function Is(e, t) {
  jn(t, !0), Ms(e, Os);
  let n = bn(t, "principal", 3, ""), r = bn(t, "isAuthenticated", 3, !1), s = /* @__PURE__ */ ee(null), l = /* @__PURE__ */ ee(null), a = /* @__PURE__ */ ee(!1);
  async function o() {
    B(a, !0), B(l, null), B(s, null);
    try {
      const S = await t.backend.extension_sync_call({
        extension_name: t.extensionId,
        function_name: "health",
        args: "{}"
      });
      B(s, JSON.stringify(S, null, 2), !0);
    } catch (S) {
      B(l, S?.message ?? String(S), !0);
    } finally {
      B(a, !1);
    }
  }
  function f(S) {
    return S ? S.length <= 14 ? S : S.slice(0, 6) + "…" + S.slice(-4) : "";
  }
  var u = Ds(), h = C(u), _ = C(h), v = C(_), c = Y(_, 2), d = C(c), b = Y(h, 2), w = Y(C(b), 2), F = Y(C(w), 2), xe = C(F), Be = Y(F, 4), ir = C(Be), lr = Y(Be, 4), fr = C(lr), ar = Y(b, 2), fn = Y(C(ar), 2), or = Y(C(fn)), ur = C(or), mt = Y(fn, 2), cr = C(mt), an = Y(mt, 2);
  {
    var dr = (S) => {
      var rt = Ps(), Ft = C(rt);
      zt(() => de(Ft, U(l))), Lt(S, rt);
    };
    wn(an, (S) => {
      U(l) && S(dr);
    });
  }
  var hr = Y(an, 2);
  {
    var vr = (S) => {
      var rt = Fs(), Ft = C(rt);
      zt(() => de(Ft, U(s))), Lt(S, rt);
    };
    wn(hr, (S) => {
      U(s) && S(vr);
    });
  }
  zt(
    (S) => {
      de(v, `v${t.version ?? ""}`), de(d, `${t.extensionId ?? ""} `), de(xe, r() ? "yes" : "no"), de(ir, S), de(fr, `ext/${t.extensionId ?? ""}/${t.version ?? ""}/frontend/dist/index.js`), de(ur, `backend.extension_sync_call({ extension_name: '${t.extensionId}', function_name: 'health', args: '{}' })`), mt.disabled = U(a), de(cr, U(a) ? "Pinging…" : "Run health()");
    },
    [() => f(n()) || "(anonymous)"]
  ), ys("click", mt, o), Lt(e, u), Sn();
}
xs(["click"]);
function qs(e, t) {
  const n = Ts(Is, { target: e, props: t });
  return {
    unmount() {
      try {
        Rs(n);
      } catch {
      }
    }
  };
}
export {
  qs as default
};
