var ro = Object.defineProperty;
var xr = (e) => {
  throw TypeError(e);
};
var io = (e, t, n) => t in e ? ro(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ye = (e, t, n) => io(e, typeof t != "symbol" ? t + "" : t, n), Ls = (e, t, n) => t.has(e) || xr("Cannot " + n);
var l = (e, t, n) => (Ls(e, t, "read from private field"), n ? n.call(e) : t.get(e)), A = (e, t, n) => t.has(e) ? xr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), N = (e, t, n, s) => (Ls(e, t, "write to private field"), s ? s.call(e, n) : t.set(e, n), n), G = (e, t, n) => (Ls(e, t, "access private method"), n);
var jr = Array.isArray, oo = Array.prototype.indexOf, wn = Array.prototype.includes, ms = Array.from, ao = Object.defineProperty, Un = Object.getOwnPropertyDescriptor, lo = Object.getOwnPropertyDescriptors, co = Object.prototype, fo = Array.prototype, Fr = Object.getPrototypeOf, yr = Object.isExtensible;
const uo = () => {
};
function vo(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Hr() {
  var e, t, n = new Promise((s, r) => {
    e = s, t = r;
  });
  return { promise: n, resolve: e, reject: t };
}
const be = 2, xn = 4, ws = 8, Ur = 1 << 24, it = 16, Je = 32, It = 64, js = 128, Ue = 512, ie = 1024, ge = 2048, ot = 4096, ke = 8192, Be = 16384, nn = 32768, Fs = 1 << 25, yn = 65536, Hs = 1 << 17, po = 1 << 18, An = 1 << 19, ho = 1 << 20, st = 1 << 25, Qt = 65536, Us = 1 << 21, qn = 1 << 22, Pt = 1 << 23, as = Symbol("$state"), go = Symbol(""), pt = new class extends Error {
  constructor() {
    super(...arguments);
    Ye(this, "name", "StaleReactionError");
    Ye(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function bo(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function _o() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function ko(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function mo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function wo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function xo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function yo() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Eo() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function So() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function To() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Ao() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Co = 1, Mo = 2, Br = 4, Po = 8, Io = 16, No = 1, Lo = 2, ce = Symbol(), Vr = "http://www.w3.org/1999/xhtml", Ro = "http://www.w3.org/2000/svg", zo = "http://www.w3.org/1998/Math/MathML";
function Do() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Oo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function qr(e) {
  return e === this.v;
}
function jo(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function Yr(e) {
  return !jo(e, this.v);
}
let Se = null;
function En(e) {
  Se = e;
}
function Gr(e, t = !1, n) {
  Se = {
    p: Se,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      R
    ),
    l: null
  };
}
function Wr(e) {
  var t = (
    /** @type {ComponentContext} */
    Se
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var s of n)
      vi(s);
  }
  return t.i = !0, Se = t.p, /** @type {T} */
  {};
}
function Kr() {
  return !0;
}
let Ht = [];
function $r() {
  var e = Ht;
  Ht = [], vo(e);
}
function Kt(e) {
  if (Ht.length === 0 && !Bn) {
    var t = Ht;
    queueMicrotask(() => {
      t === Ht && $r();
    });
  }
  Ht.push(e);
}
function Fo() {
  for (; Ht.length > 0; )
    $r();
}
function Jr(e) {
  var t = R;
  if (t === null)
    return L.f |= Pt, e;
  if ((t.f & nn) === 0 && (t.f & xn) === 0)
    throw e;
  Mt(e, t);
}
function Mt(e, t) {
  for (; t !== null; ) {
    if ((t.f & js) !== 0) {
      if ((t.f & nn) === 0)
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
const Ho = -7169;
function Q(e, t) {
  e.f = e.f & Ho | t;
}
function Qs(e) {
  (e.f & Ue) !== 0 || e.deps === null ? Q(e, ie) : Q(e, ot);
}
function Xr(e) {
  if (e !== null)
    for (const t of e)
      (t.f & be) === 0 || (t.f & Qt) === 0 || (t.f ^= Qt, Xr(
        /** @type {Derived} */
        t.deps
      ));
}
function Qr(e, t, n) {
  (e.f & ge) !== 0 ? t.add(e) : (e.f & ot) !== 0 && n.add(e), Xr(e.deps), Q(e, ie);
}
const Ot = /* @__PURE__ */ new Set();
let I = null, Ke = null, Bs = null, Bn = !1, Rs = !1, hn = null, ls = null;
var Er = 0;
let Uo = 1;
var gn, bn, Vt, ht, et, Gn, Pe, Wn, At, gt, tt, _n, kn, qt, ee, cs, Zr, fs, Vs, us, Bo;
const bs = class bs {
  constructor() {
    A(this, ee);
    Ye(this, "id", Uo++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    Ye(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    Ye(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    A(this, gn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    A(this, bn, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    A(this, Vt, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    A(this, ht, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    A(this, et, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    A(this, Gn, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    A(this, Pe, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    A(this, Wn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    A(this, At, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    A(this, gt, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    A(this, tt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    A(this, _n, /* @__PURE__ */ new Set());
    Ye(this, "is_fork", !1);
    A(this, kn, !1);
    /** @type {Set<Batch>} */
    A(this, qt, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    l(this, tt).has(t) || l(this, tt).set(t, { d: [], m: [] }), l(this, _n).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (s) => this.schedule(s)) {
    var s = l(this, tt).get(t);
    if (s) {
      l(this, tt).delete(t);
      for (var r of s.d)
        Q(r, ge), n(r);
      for (r of s.m)
        Q(r, ot), n(r);
    }
    l(this, _n).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, s = !1) {
    t.v !== ce && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Pt) === 0 && (this.current.set(t, [n, s]), Ke?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    I = this;
  }
  deactivate() {
    I = null, Ke = null;
  }
  flush() {
    try {
      Rs = !0, I = this, G(this, ee, fs).call(this);
    } finally {
      Er = 0, Bs = null, hn = null, ls = null, Rs = !1, I = null, Ke = null, $t.clear();
    }
  }
  discard() {
    for (const t of l(this, bn)) t(this);
    l(this, bn).clear(), l(this, Vt).clear(), Ot.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    l(this, Wn).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    let s = l(this, ht).get(n) ?? 0;
    if (l(this, ht).set(n, s + 1), t) {
      let r = l(this, et).get(n) ?? 0;
      l(this, et).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(t, n, s) {
    let r = l(this, ht).get(n) ?? 0;
    if (r === 1 ? l(this, ht).delete(n) : l(this, ht).set(n, r - 1), t) {
      let i = l(this, et).get(n) ?? 0;
      i === 1 ? l(this, et).delete(n) : l(this, et).set(n, i - 1);
    }
    l(this, kn) || s || (N(this, kn, !0), Kt(() => {
      N(this, kn, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const s of t)
      l(this, At).add(s);
    for (const s of n)
      l(this, gt).add(s);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    l(this, gn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    l(this, bn).add(t);
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
    return (l(this, Gn) ?? N(this, Gn, Hr())).promise;
  }
  static ensure() {
    if (I === null) {
      const t = I = new bs();
      Rs || (Ot.add(I), Bn || Kt(() => {
        I === t && t.flush();
      }));
    }
    return I;
  }
  apply() {
    {
      Ke = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    if (Bs = t, t.b?.is_pending && (t.f & (xn | ws | Ur)) !== 0 && (t.f & nn) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var s = n.f;
      if (hn !== null && n === R && (L === null || (L.f & be) === 0))
        return;
      if ((s & (It | Je)) !== 0) {
        if ((s & ie) === 0)
          return;
        n.f ^= ie;
      }
    }
    l(this, Pe).push(n);
  }
};
gn = new WeakMap(), bn = new WeakMap(), Vt = new WeakMap(), ht = new WeakMap(), et = new WeakMap(), Gn = new WeakMap(), Pe = new WeakMap(), Wn = new WeakMap(), At = new WeakMap(), gt = new WeakMap(), tt = new WeakMap(), _n = new WeakMap(), kn = new WeakMap(), qt = new WeakMap(), ee = new WeakSet(), cs = function() {
  return this.is_fork || l(this, et).size > 0;
}, Zr = function() {
  for (const s of l(this, qt))
    for (const r of l(s, et).keys()) {
      for (var t = !1, n = r; n.parent !== null; ) {
        if (l(this, tt).has(n)) {
          t = !0;
          break;
        }
        n = n.parent;
      }
      if (!t)
        return !0;
    }
  return !1;
}, fs = function() {
  var f;
  if (Er++ > 1e3 && (Ot.delete(this), qo()), !G(this, ee, cs).call(this)) {
    for (const a of l(this, At))
      l(this, gt).delete(a), Q(a, ge), this.schedule(a);
    for (const a of l(this, gt))
      Q(a, ot), this.schedule(a);
  }
  const t = l(this, Pe);
  N(this, Pe, []), this.apply();
  var n = hn = [], s = [], r = ls = [];
  for (const a of t)
    try {
      G(this, ee, Vs).call(this, a, n, s);
    } catch (u) {
      throw ni(a), u;
    }
  if (I = null, r.length > 0) {
    var i = bs.ensure();
    for (const a of r)
      i.schedule(a);
  }
  if (hn = null, ls = null, G(this, ee, cs).call(this) || G(this, ee, Zr).call(this)) {
    G(this, ee, us).call(this, s), G(this, ee, us).call(this, n);
    for (const [a, u] of l(this, tt))
      ti(a, u);
  } else {
    l(this, ht).size === 0 && Ot.delete(this), l(this, At).clear(), l(this, gt).clear();
    for (const a of l(this, gn)) a(this);
    l(this, gn).clear(), Sr(s), Sr(n), l(this, Gn)?.resolve();
  }
  var c = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    I
  );
  if (l(this, Pe).length > 0) {
    const a = c ?? (c = this);
    l(a, Pe).push(...l(this, Pe).filter((u) => !l(a, Pe).includes(u)));
  }
  c !== null && (Ot.add(c), G(f = c, ee, fs).call(f));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Vs = function(t, n, s) {
  t.f ^= ie;
  for (var r = t.first; r !== null; ) {
    var i = r.f, c = (i & (Je | It)) !== 0, f = c && (i & ie) !== 0, a = f || (i & ke) !== 0 || l(this, tt).has(r);
    if (!a && r.fn !== null) {
      c ? r.f ^= ie : (i & xn) !== 0 ? n.push(r) : Zn(r) && ((i & it) !== 0 && l(this, gt).add(r), Tn(r));
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
}, /**
 * @param {Effect[]} effects
 */
us = function(t) {
  for (var n = 0; n < t.length; n += 1)
    Qr(t[n], l(this, At), l(this, gt));
}, Bo = function() {
  var v, w, g;
  for (const k of Ot) {
    var t = k.id < this.id, n = [];
    for (const [b, [T, _]] of this.current) {
      if (k.current.has(b)) {
        var s = (
          /** @type {[any, boolean]} */
          k.current.get(b)[0]
        );
        if (t && T !== s)
          k.current.set(b, [T, _]);
        else
          continue;
      }
      n.push(b);
    }
    var r = [...k.current.keys()].filter((b) => !this.current.has(b));
    if (r.length === 0)
      t && k.discard();
    else if (n.length > 0) {
      if (t)
        for (const b of l(this, _n))
          k.unskip_effect(b, (T) => {
            var _;
            (T.f & (it | qn)) !== 0 ? k.schedule(T) : G(_ = k, ee, us).call(_, [T]);
          });
      k.activate();
      var i = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
      for (var f of n)
        ei(f, r, i, c);
      c = /* @__PURE__ */ new Map();
      var a = [...k.current.keys()].filter(
        (b) => this.current.has(b) ? (
          /** @type {[any, boolean]} */
          this.current.get(b)[0] !== b
        ) : !0
      );
      for (const b of l(this, Wn))
        (b.f & (Be | ke | Hs)) === 0 && Zs(b, a, c) && ((b.f & (qn | it)) !== 0 ? (Q(b, ge), k.schedule(b)) : l(k, At).add(b));
      if (l(k, Pe).length > 0) {
        k.apply();
        for (var u of l(k, Pe))
          G(v = k, ee, Vs).call(v, u, [], []);
        N(k, Pe, []);
      }
      k.deactivate();
    }
  }
  for (const k of Ot)
    l(k, qt).has(this) && (l(k, qt).delete(this), l(k, qt).size === 0 && !G(w = k, ee, cs).call(w) && (k.activate(), G(g = k, ee, fs).call(g)));
};
let Zt = bs;
function Vo(e) {
  var t = Bn;
  Bn = !0;
  try {
    for (var n; ; ) {
      if (Fo(), I === null)
        return (
          /** @type {T} */
          n
        );
      I.flush();
    }
  } finally {
    Bn = t;
  }
}
function qo() {
  try {
    yo();
  } catch (e) {
    Mt(e, Bs);
  }
}
let vt = null;
function Sr(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var s = e[n++];
      if ((s.f & (Be | ke)) === 0 && Zn(s) && (vt = /* @__PURE__ */ new Set(), Tn(s), s.deps === null && s.first === null && s.nodes === null && s.teardown === null && s.ac === null && bi(s), vt?.size > 0)) {
        $t.clear();
        for (const r of vt) {
          if ((r.f & (Be | ke)) !== 0) continue;
          const i = [r];
          let c = r.parent;
          for (; c !== null; )
            vt.has(c) && (vt.delete(c), i.push(c)), c = c.parent;
          for (let f = i.length - 1; f >= 0; f--) {
            const a = i[f];
            (a.f & (Be | ke)) === 0 && Tn(a);
          }
        }
        vt.clear();
      }
    }
    vt = null;
  }
}
function ei(e, t, n, s) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const r of e.reactions) {
      const i = r.f;
      (i & be) !== 0 ? ei(
        /** @type {Derived} */
        r,
        t,
        n,
        s
      ) : (i & (qn | it)) !== 0 && (i & ge) === 0 && Zs(r, t, s) && (Q(r, ge), er(
        /** @type {Effect} */
        r
      ));
    }
}
function Zs(e, t, n) {
  const s = n.get(e);
  if (s !== void 0) return s;
  if (e.deps !== null)
    for (const r of e.deps) {
      if (wn.call(t, r))
        return !0;
      if ((r.f & be) !== 0 && Zs(
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
function er(e) {
  I.schedule(e);
}
function ti(e, t) {
  if (!((e.f & Je) !== 0 && (e.f & ie) !== 0)) {
    (e.f & ge) !== 0 ? t.d.push(e) : (e.f & ot) !== 0 && t.m.push(e), Q(e, ie);
    for (var n = e.first; n !== null; )
      ti(n, t), n = n.next;
  }
}
function ni(e) {
  Q(e, ie);
  for (var t = e.first; t !== null; )
    ni(t), t = t.next;
}
function Yo(e) {
  let t = 0, n = en(0), s;
  return () => {
    rr() && (o(n), ir(() => (t === 0 && (s = xs(() => e(() => Vn(n)))), t += 1, () => {
      Kt(() => {
        t -= 1, t === 0 && (s?.(), s = void 0, Vn(n));
      });
    })));
  };
}
var Go = yn | An;
function Wo(e, t, n, s) {
  new Ko(e, t, n, s);
}
var Oe, Xs, je, Yt, xe, Fe, _e, Ie, bt, Gt, Ct, mn, Kn, $n, _t, _s, X, $o, Jo, Xo, qs, ds, vs, Ys, Gs;
class Ko {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, s, r) {
    A(this, X);
    /** @type {Boundary | null} */
    Ye(this, "parent");
    Ye(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Ye(this, "transform_error");
    /** @type {TemplateNode} */
    A(this, Oe);
    /** @type {TemplateNode | null} */
    A(this, Xs, null);
    /** @type {BoundaryProps} */
    A(this, je);
    /** @type {((anchor: Node) => void)} */
    A(this, Yt);
    /** @type {Effect} */
    A(this, xe);
    /** @type {Effect | null} */
    A(this, Fe, null);
    /** @type {Effect | null} */
    A(this, _e, null);
    /** @type {Effect | null} */
    A(this, Ie, null);
    /** @type {DocumentFragment | null} */
    A(this, bt, null);
    A(this, Gt, 0);
    A(this, Ct, 0);
    A(this, mn, !1);
    /** @type {Set<Effect>} */
    A(this, Kn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    A(this, $n, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    A(this, _t, null);
    A(this, _s, Yo(() => (N(this, _t, en(l(this, Gt))), () => {
      N(this, _t, null);
    })));
    N(this, Oe, t), N(this, je, n), N(this, Yt, (i) => {
      var c = (
        /** @type {Effect} */
        R
      );
      c.b = this, c.f |= js, s(i);
    }), this.parent = /** @type {Effect} */
    R.b, this.transform_error = r ?? this.parent?.transform_error ?? ((i) => i), N(this, xe, or(() => {
      G(this, X, qs).call(this);
    }, Go));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    Qr(t, l(this, Kn), l(this, $n));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!l(this, je).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    G(this, X, Ys).call(this, t, n), N(this, Gt, l(this, Gt) + t), !(!l(this, _t) || l(this, mn)) && (N(this, mn, !0), Kt(() => {
      N(this, mn, !1), l(this, _t) && Sn(l(this, _t), l(this, Gt));
    }));
  }
  get_effect_pending() {
    return l(this, _s).call(this), o(
      /** @type {Source<number>} */
      l(this, _t)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!l(this, je).onerror && !l(this, je).failed)
      throw t;
    I?.is_fork ? (l(this, Fe) && I.skip_effect(l(this, Fe)), l(this, _e) && I.skip_effect(l(this, _e)), l(this, Ie) && I.skip_effect(l(this, Ie)), I.on_fork_commit(() => {
      G(this, X, Gs).call(this, t);
    })) : G(this, X, Gs).call(this, t);
  }
}
Oe = new WeakMap(), Xs = new WeakMap(), je = new WeakMap(), Yt = new WeakMap(), xe = new WeakMap(), Fe = new WeakMap(), _e = new WeakMap(), Ie = new WeakMap(), bt = new WeakMap(), Gt = new WeakMap(), Ct = new WeakMap(), mn = new WeakMap(), Kn = new WeakMap(), $n = new WeakMap(), _t = new WeakMap(), _s = new WeakMap(), X = new WeakSet(), $o = function() {
  try {
    N(this, Fe, He(() => l(this, Yt).call(this, l(this, Oe))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Jo = function(t) {
  const n = l(this, je).failed;
  n && N(this, Ie, He(() => {
    n(
      l(this, Oe),
      () => t,
      () => () => {
      }
    );
  }));
}, Xo = function() {
  const t = l(this, je).pending;
  t && (this.is_pending = !0, N(this, _e, He(() => t(l(this, Oe)))), Kt(() => {
    var n = N(this, bt, document.createDocumentFragment()), s = kt();
    n.append(s), N(this, Fe, G(this, X, vs).call(this, () => He(() => l(this, Yt).call(this, s)))), l(this, Ct) === 0 && (l(this, Oe).before(n), N(this, bt, null), Jt(
      /** @type {Effect} */
      l(this, _e),
      () => {
        N(this, _e, null);
      }
    ), G(this, X, ds).call(
      this,
      /** @type {Batch} */
      I
    ));
  }));
}, qs = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), N(this, Ct, 0), N(this, Gt, 0), N(this, Fe, He(() => {
      l(this, Yt).call(this, l(this, Oe));
    })), l(this, Ct) > 0) {
      var t = N(this, bt, document.createDocumentFragment());
      cr(l(this, Fe), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        l(this, je).pending
      );
      N(this, _e, He(() => n(l(this, Oe))));
    } else
      G(this, X, ds).call(
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
ds = function(t) {
  this.is_pending = !1, t.transfer_effects(l(this, Kn), l(this, $n));
}, /**
 * @template T
 * @param {() => T} fn
 */
vs = function(t) {
  var n = R, s = L, r = Se;
  at(l(this, xe)), qe(l(this, xe)), En(l(this, xe).ctx);
  try {
    return Zt.ensure(), t();
  } catch (i) {
    return Jr(i), null;
  } finally {
    at(n), qe(s), En(r);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Ys = function(t, n) {
  var s;
  if (!this.has_pending_snippet()) {
    this.parent && G(s = this.parent, X, Ys).call(s, t, n);
    return;
  }
  N(this, Ct, l(this, Ct) + t), l(this, Ct) === 0 && (G(this, X, ds).call(this, n), l(this, _e) && Jt(l(this, _e), () => {
    N(this, _e, null);
  }), l(this, bt) && (l(this, Oe).before(l(this, bt)), N(this, bt, null)));
}, /**
 * @param {unknown} error
 */
Gs = function(t) {
  l(this, Fe) && (Ee(l(this, Fe)), N(this, Fe, null)), l(this, _e) && (Ee(l(this, _e)), N(this, _e, null)), l(this, Ie) && (Ee(l(this, Ie)), N(this, Ie, null));
  var n = l(this, je).onerror;
  let s = l(this, je).failed;
  var r = !1, i = !1;
  const c = () => {
    if (r) {
      Oo();
      return;
    }
    r = !0, i && Ao(), l(this, Ie) !== null && Jt(l(this, Ie), () => {
      N(this, Ie, null);
    }), G(this, X, vs).call(this, () => {
      G(this, X, qs).call(this);
    });
  }, f = (a) => {
    try {
      i = !0, n?.(a, c), i = !1;
    } catch (u) {
      Mt(u, l(this, xe) && l(this, xe).parent);
    }
    s && N(this, Ie, G(this, X, vs).call(this, () => {
      try {
        return He(() => {
          var u = (
            /** @type {Effect} */
            R
          );
          u.b = this, u.f |= js, s(
            l(this, Oe),
            () => a,
            () => c
          );
        });
      } catch (u) {
        return Mt(
          u,
          /** @type {Effect} */
          l(this, xe).parent
        ), null;
      }
    }));
  };
  Kt(() => {
    var a;
    try {
      a = this.transform_error(t);
    } catch (u) {
      Mt(u, l(this, xe) && l(this, xe).parent);
      return;
    }
    a !== null && typeof a == "object" && typeof /** @type {any} */
    a.then == "function" ? a.then(
      f,
      /** @param {unknown} e */
      (u) => Mt(u, l(this, xe) && l(this, xe).parent)
    ) : f(a);
  });
};
function Qo(e, t, n, s) {
  const r = ri;
  var i = e.filter((g) => !g.settled);
  if (n.length === 0 && i.length === 0) {
    s(t.map(r));
    return;
  }
  var c = (
    /** @type {Effect} */
    R
  ), f = Zo(), a = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((g) => g.promise)) : null;
  function u(g) {
    f();
    try {
      s(g);
    } catch (k) {
      (c.f & Be) === 0 && Mt(k, c);
    }
    gs();
  }
  if (n.length === 0) {
    a.then(() => u(t.map(r)));
    return;
  }
  var v = si();
  function w() {
    Promise.all(n.map((g) => /* @__PURE__ */ ea(g))).then((g) => u([...t.map(r), ...g])).catch((g) => Mt(g, c)).finally(() => v());
  }
  a ? a.then(() => {
    f(), w(), gs();
  }) : w();
}
function Zo() {
  var e = (
    /** @type {Effect} */
    R
  ), t = L, n = Se, s = (
    /** @type {Batch} */
    I
  );
  return function(i = !0) {
    at(e), qe(t), En(n), i && (e.f & Be) === 0 && (s?.activate(), s?.apply());
  };
}
function gs(e = !0) {
  at(null), qe(null), En(null), e && I?.deactivate();
}
function si() {
  var e = (
    /** @type {Effect} */
    R
  ), t = (
    /** @type {Boundary} */
    e.b
  ), n = (
    /** @type {Batch} */
    I
  ), s = t.is_rendered();
  return t.update_pending_count(1, n), n.increment(s, e), (r = !1) => {
    t.update_pending_count(-1, n), n.decrement(s, e, r);
  };
}
// @__NO_SIDE_EFFECTS__
function ri(e) {
  var t = be | ge;
  return R !== null && (R.f |= An), {
    ctx: Se,
    deps: null,
    effects: null,
    equals: qr,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      ce
    ),
    wv: 0,
    parent: R,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function ea(e, t, n) {
  let s = (
    /** @type {Effect | null} */
    R
  );
  s === null && _o();
  var r = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = en(
    /** @type {V} */
    ce
  ), c = !L, f = /* @__PURE__ */ new Map();
  return pa(() => {
    var a = (
      /** @type {Effect} */
      R
    ), u = Hr();
    r = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, u.reject).finally(gs);
    } catch (k) {
      u.reject(k), gs();
    }
    var v = (
      /** @type {Batch} */
      I
    );
    if (c) {
      if ((a.f & nn) !== 0)
        var w = si();
      if (
        /** @type {Boundary} */
        s.b.is_rendered()
      )
        f.get(v)?.reject(pt), f.delete(v);
      else {
        for (const k of f.values())
          k.reject(pt);
        f.clear();
      }
      f.set(v, u);
    }
    const g = (k, b = void 0) => {
      if (w) {
        var T = b === pt;
        w(T);
      }
      if (!(b === pt || (a.f & Be) !== 0)) {
        if (v.activate(), b)
          i.f |= Pt, Sn(i, b);
        else {
          (i.f & Pt) !== 0 && (i.f ^= Pt), Sn(i, k);
          for (const [_, P] of f) {
            if (f.delete(_), _ === v) break;
            P.reject(pt);
          }
        }
        v.deactivate();
      }
    };
    u.promise.then(g, (k) => g(null, k || "unknown"));
  }), da(() => {
    for (const a of f.values())
      a.reject(pt);
  }), new Promise((a) => {
    function u(v) {
      function w() {
        v === r ? a(i) : u(r);
      }
      v.then(w, w);
    }
    u(r);
  });
}
// @__NO_SIDE_EFFECTS__
function ta(e) {
  const t = /* @__PURE__ */ ri(e);
  return t.equals = Yr, t;
}
function na(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Ee(
        /** @type {Effect} */
        t[n]
      );
  }
}
function tr(e) {
  var t, n = R, s = e.parent;
  if (!Nt && s !== null && (s.f & (Be | ke)) !== 0)
    return Do(), e.v;
  at(s);
  try {
    e.f &= ~Qt, na(e), t = yi(e);
  } finally {
    at(n);
  }
  return t;
}
function ii(e) {
  var t = tr(e);
  if (!e.equals(t) && (e.wv = wi(), (!I?.is_fork || e.deps === null) && (I !== null ? I.capture(e, t, !0) : e.v = t, e.deps === null))) {
    Q(e, ie);
    return;
  }
  Nt || (Ke !== null ? (rr() || I?.is_fork) && Ke.set(e, t) : Qs(e));
}
function sa(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(pt), t.teardown = uo, t.ac = null, Yn(t, 0), ar(t));
}
function oi(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && Tn(t);
}
let Ws = /* @__PURE__ */ new Set();
const $t = /* @__PURE__ */ new Map();
let ai = !1;
function en(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: qr,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function C(e, t) {
  const n = en(e);
  return ga(n), n;
}
// @__NO_SIDE_EFFECTS__
function ra(e, t = !1, n = !0) {
  const s = en(e);
  return t || (s.equals = Yr), s;
}
function p(e, t, n = !1) {
  L !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!$e || (L.f & Hs) !== 0) && Kr() && (L.f & (be | it | qn | Hs)) !== 0 && (Ve === null || !wn.call(Ve, e)) && To();
  let s = n ? We(t) : t;
  return Sn(e, s, ls);
}
function Sn(e, t, n = null) {
  if (!e.equals(t)) {
    $t.set(e, Nt ? t : e.v);
    var s = Zt.ensure();
    if (s.capture(e, t), (e.f & be) !== 0) {
      const r = (
        /** @type {Derived} */
        e
      );
      (e.f & ge) !== 0 && tr(r), Ke === null && Qs(r);
    }
    e.wv = wi(), li(e, ge, n), R !== null && (R.f & ie) !== 0 && (R.f & (Je | It)) === 0 && (De === null ? ba([e]) : De.push(e)), !s.is_fork && Ws.size > 0 && !ai && ia();
  }
  return t;
}
function ia() {
  ai = !1;
  for (const e of Ws)
    (e.f & ie) !== 0 && Q(e, ot), Zn(e) && Tn(e);
  Ws.clear();
}
function Vn(e) {
  p(e, e.v + 1);
}
function li(e, t, n) {
  var s = e.reactions;
  if (s !== null)
    for (var r = s.length, i = 0; i < r; i++) {
      var c = s[i], f = c.f, a = (f & ge) === 0;
      if (a && Q(c, t), (f & be) !== 0) {
        var u = (
          /** @type {Derived} */
          c
        );
        Ke?.delete(u), (f & Qt) === 0 && (f & Ue && (c.f |= Qt), li(u, ot, n));
      } else if (a) {
        var v = (
          /** @type {Effect} */
          c
        );
        (f & it) !== 0 && vt !== null && vt.add(v), n !== null ? n.push(v) : er(v);
      }
    }
}
function We(e) {
  if (typeof e != "object" || e === null || as in e)
    return e;
  const t = Fr(e);
  if (t !== co && t !== fo)
    return e;
  var n = /* @__PURE__ */ new Map(), s = jr(e), r = /* @__PURE__ */ C(0), i = Xt, c = (f) => {
    if (Xt === i)
      return f();
    var a = L, u = Xt;
    qe(null), Mr(i);
    var v = f();
    return qe(a), Mr(u), v;
  };
  return s && n.set("length", /* @__PURE__ */ C(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, a, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && Eo();
        var v = n.get(a);
        return v === void 0 ? c(() => {
          var w = /* @__PURE__ */ C(u.value);
          return n.set(a, w), w;
        }) : p(v, u.value, !0), !0;
      },
      deleteProperty(f, a) {
        var u = n.get(a);
        if (u === void 0) {
          if (a in f) {
            const v = c(() => /* @__PURE__ */ C(ce));
            n.set(a, v), Vn(r);
          }
        } else
          p(u, ce), Vn(r);
        return !0;
      },
      get(f, a, u) {
        if (a === as)
          return e;
        var v = n.get(a), w = a in f;
        if (v === void 0 && (!w || Un(f, a)?.writable) && (v = c(() => {
          var k = We(w ? f[a] : ce), b = /* @__PURE__ */ C(k);
          return b;
        }), n.set(a, v)), v !== void 0) {
          var g = o(v);
          return g === ce ? void 0 : g;
        }
        return Reflect.get(f, a, u);
      },
      getOwnPropertyDescriptor(f, a) {
        var u = Reflect.getOwnPropertyDescriptor(f, a);
        if (u && "value" in u) {
          var v = n.get(a);
          v && (u.value = o(v));
        } else if (u === void 0) {
          var w = n.get(a), g = w?.v;
          if (w !== void 0 && g !== ce)
            return {
              enumerable: !0,
              configurable: !0,
              value: g,
              writable: !0
            };
        }
        return u;
      },
      has(f, a) {
        if (a === as)
          return !0;
        var u = n.get(a), v = u !== void 0 && u.v !== ce || Reflect.has(f, a);
        if (u !== void 0 || R !== null && (!v || Un(f, a)?.writable)) {
          u === void 0 && (u = c(() => {
            var g = v ? We(f[a]) : ce, k = /* @__PURE__ */ C(g);
            return k;
          }), n.set(a, u));
          var w = o(u);
          if (w === ce)
            return !1;
        }
        return v;
      },
      set(f, a, u, v) {
        var w = n.get(a), g = a in f;
        if (s && a === "length")
          for (var k = u; k < /** @type {Source<number>} */
          w.v; k += 1) {
            var b = n.get(k + "");
            b !== void 0 ? p(b, ce) : k in f && (b = c(() => /* @__PURE__ */ C(ce)), n.set(k + "", b));
          }
        if (w === void 0)
          (!g || Un(f, a)?.writable) && (w = c(() => /* @__PURE__ */ C(void 0)), p(w, We(u)), n.set(a, w));
        else {
          g = w.v !== ce;
          var T = c(() => We(u));
          p(w, T);
        }
        var _ = Reflect.getOwnPropertyDescriptor(f, a);
        if (_?.set && _.set.call(v, u), !g) {
          if (s && typeof a == "string") {
            var P = (
              /** @type {Source<number>} */
              n.get("length")
            ), te = Number(a);
            Number.isInteger(te) && te >= P.v && p(P, te + 1);
          }
          Vn(r);
        }
        return !0;
      },
      ownKeys(f) {
        o(r);
        var a = Reflect.ownKeys(f).filter((w) => {
          var g = n.get(w);
          return g === void 0 || g.v !== ce;
        });
        for (var [u, v] of n)
          v.v !== ce && !(u in f) && a.push(u);
        return a;
      },
      setPrototypeOf() {
        So();
      }
    }
  );
}
var Tr, ci, fi, ui;
function oa() {
  if (Tr === void 0) {
    Tr = window, ci = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    fi = Un(t, "firstChild").get, ui = Un(t, "nextSibling").get, yr(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), yr(n) && (n.__t = void 0);
  }
}
function kt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function rt(e) {
  return (
    /** @type {TemplateNode | null} */
    fi.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Qn(e) {
  return (
    /** @type {TemplateNode | null} */
    ui.call(e)
  );
}
function y(e, t) {
  return /* @__PURE__ */ rt(e);
}
function jt(e, t = !1) {
  {
    var n = /* @__PURE__ */ rt(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ Qn(n) : n;
  }
}
function M(e, t = 1, n = !1) {
  let s = e;
  for (; t--; )
    s = /** @type {TemplateNode} */
    /* @__PURE__ */ Qn(s);
  return s;
}
function aa(e) {
  e.textContent = "";
}
function di() {
  return !1;
}
function nr(e, t, n) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t ?? Vr, e, void 0)
  );
}
let Ar = !1;
function la() {
  Ar || (Ar = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t.__on_r?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function sr(e) {
  var t = L, n = R;
  qe(null), at(null);
  try {
    return e();
  } finally {
    qe(t), at(n);
  }
}
function ca(e, t, n, s = n) {
  e.addEventListener(t, () => sr(n));
  const r = e.__on_r;
  r ? e.__on_r = () => {
    r(), s(!0);
  } : e.__on_r = () => s(!0), la();
}
function fa(e) {
  R === null && (L === null && xo(), wo()), Nt && mo();
}
function ua(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function mt(e, t) {
  var n = R;
  n !== null && (n.f & ke) !== 0 && (e |= ke);
  var s = {
    ctx: Se,
    deps: null,
    nodes: null,
    f: e | ge | Ue,
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
    hn !== null ? hn.push(s) : Zt.ensure().schedule(s);
  else if (t !== null) {
    try {
      Tn(s);
    } catch (c) {
      throw Ee(s), c;
    }
    r.deps === null && r.teardown === null && r.nodes === null && r.first === r.last && // either `null`, or a singular child
    (r.f & An) === 0 && (r = r.first, (e & it) !== 0 && (e & yn) !== 0 && r !== null && (r.f |= yn));
  }
  if (r !== null && (r.parent = n, n !== null && ua(r, n), L !== null && (L.f & be) !== 0 && (e & It) === 0)) {
    var i = (
      /** @type {Derived} */
      L
    );
    (i.effects ?? (i.effects = [])).push(r);
  }
  return s;
}
function rr() {
  return L !== null && !$e;
}
function da(e) {
  const t = mt(ws, null);
  return Q(t, ie), t.teardown = e, t;
}
function ps(e) {
  fa();
  var t = (
    /** @type {Effect} */
    R.f
  ), n = !L && (t & Je) !== 0 && (t & nn) === 0;
  if (n) {
    var s = (
      /** @type {ComponentContext} */
      Se
    );
    (s.e ?? (s.e = [])).push(e);
  } else
    return vi(e);
}
function vi(e) {
  return mt(xn | ho, e);
}
function va(e) {
  Zt.ensure();
  const t = mt(It | An, e);
  return (n = {}) => new Promise((s) => {
    n.outro ? Jt(t, () => {
      Ee(t), s(void 0);
    }) : (Ee(t), s(void 0));
  });
}
function pi(e) {
  return mt(xn, e);
}
function pa(e) {
  return mt(qn | An, e);
}
function ir(e, t = 0) {
  return mt(ws | t, e);
}
function he(e, t = [], n = [], s = []) {
  Qo(s, t, n, (r) => {
    mt(ws, () => e(...r.map(o)));
  });
}
function or(e, t = 0) {
  var n = mt(it | t, e);
  return n;
}
function He(e) {
  return mt(Je | An, e);
}
function hi(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Nt, s = L;
    Cr(!0), qe(null);
    try {
      t.call(null);
    } finally {
      Cr(n), qe(s);
    }
  }
}
function ar(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const r = n.ac;
    r !== null && sr(() => {
      r.abort(pt);
    });
    var s = n.next;
    (n.f & It) !== 0 ? n.parent = null : Ee(n, t), n = s;
  }
}
function ha(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Je) === 0 && Ee(t), t = n;
  }
}
function Ee(e, t = !0) {
  var n = !1;
  (t || (e.f & po) !== 0) && e.nodes !== null && e.nodes.end !== null && (gi(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), Q(e, Fs), ar(e, t && !n), Yn(e, 0);
  var s = e.nodes && e.nodes.t;
  if (s !== null)
    for (const i of s)
      i.stop();
  hi(e), e.f ^= Fs, e.f |= Be;
  var r = e.parent;
  r !== null && r.first !== null && bi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function gi(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ Qn(e);
    e.remove(), e = n;
  }
}
function bi(e) {
  var t = e.parent, n = e.prev, s = e.next;
  n !== null && (n.next = s), s !== null && (s.prev = n), t !== null && (t.first === e && (t.first = s), t.last === e && (t.last = n));
}
function Jt(e, t, n = !0) {
  var s = [];
  _i(e, s, !0);
  var r = () => {
    n && Ee(e), t && t();
  }, i = s.length;
  if (i > 0) {
    var c = () => --i || r();
    for (var f of s)
      f.out(c);
  } else
    r();
}
function _i(e, t, n) {
  if ((e.f & ke) === 0) {
    e.f ^= ke;
    var s = e.nodes && e.nodes.t;
    if (s !== null)
      for (const f of s)
        (f.is_global || n) && t.push(f);
    for (var r = e.first; r !== null; ) {
      var i = r.next;
      if ((r.f & It) === 0) {
        var c = (r.f & yn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (r.f & Je) !== 0 && (e.f & it) !== 0;
        _i(r, t, c ? n : !1);
      }
      r = i;
    }
  }
}
function lr(e) {
  ki(e, !0);
}
function ki(e, t) {
  if ((e.f & ke) !== 0) {
    e.f ^= ke, (e.f & ie) === 0 && (Q(e, ge), Zt.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var s = n.next, r = (n.f & yn) !== 0 || (n.f & Je) !== 0;
      ki(n, r ? t : !1), n = s;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const c of i)
        (c.is_global || t) && c.in();
  }
}
function cr(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, s = e.nodes.end; n !== null; ) {
      var r = n === s ? null : /* @__PURE__ */ Qn(n);
      t.append(n), n = r;
    }
}
let hs = !1, Nt = !1;
function Cr(e) {
  Nt = e;
}
let L = null, $e = !1;
function qe(e) {
  L = e;
}
let R = null;
function at(e) {
  R = e;
}
let Ve = null;
function ga(e) {
  L !== null && (Ve === null ? Ve = [e] : Ve.push(e));
}
let ye = null, Me = 0, De = null;
function ba(e) {
  De = e;
}
let mi = 1, Ut = 0, Xt = Ut;
function Mr(e) {
  Xt = e;
}
function wi() {
  return ++mi;
}
function Zn(e) {
  var t = e.f;
  if ((t & ge) !== 0)
    return !0;
  if (t & be && (e.f &= ~Qt), (t & ot) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), s = n.length, r = 0; r < s; r++) {
      var i = n[r];
      if (Zn(
        /** @type {Derived} */
        i
      ) && ii(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & Ue) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Ke === null && Q(e, ie);
  }
  return !1;
}
function xi(e, t, n = !0) {
  var s = e.reactions;
  if (s !== null && !(Ve !== null && wn.call(Ve, e)))
    for (var r = 0; r < s.length; r++) {
      var i = s[r];
      (i.f & be) !== 0 ? xi(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? Q(i, ge) : (i.f & ie) !== 0 && Q(i, ot), er(
        /** @type {Effect} */
        i
      ));
    }
}
function yi(e) {
  var T;
  var t = ye, n = Me, s = De, r = L, i = Ve, c = Se, f = $e, a = Xt, u = e.f;
  ye = /** @type {null | Value[]} */
  null, Me = 0, De = null, L = (u & (Je | It)) === 0 ? e : null, Ve = null, En(e.ctx), $e = !1, Xt = ++Ut, e.ac !== null && (sr(() => {
    e.ac.abort(pt);
  }), e.ac = null);
  try {
    e.f |= Us;
    var v = (
      /** @type {Function} */
      e.fn
    ), w = v();
    e.f |= nn;
    var g = e.deps, k = I?.is_fork;
    if (ye !== null) {
      var b;
      if (k || Yn(e, Me), g !== null && Me > 0)
        for (g.length = Me + ye.length, b = 0; b < ye.length; b++)
          g[Me + b] = ye[b];
      else
        e.deps = g = ye;
      if (rr() && (e.f & Ue) !== 0)
        for (b = Me; b < g.length; b++)
          ((T = g[b]).reactions ?? (T.reactions = [])).push(e);
    } else !k && g !== null && Me < g.length && (Yn(e, Me), g.length = Me);
    if (Kr() && De !== null && !$e && g !== null && (e.f & (be | ot | ge)) === 0)
      for (b = 0; b < /** @type {Source[]} */
      De.length; b++)
        xi(
          De[b],
          /** @type {Effect} */
          e
        );
    if (r !== null && r !== e) {
      if (Ut++, r.deps !== null)
        for (let _ = 0; _ < n; _ += 1)
          r.deps[_].rv = Ut;
      if (t !== null)
        for (const _ of t)
          _.rv = Ut;
      De !== null && (s === null ? s = De : s.push(.../** @type {Source[]} */
      De));
    }
    return (e.f & Pt) !== 0 && (e.f ^= Pt), w;
  } catch (_) {
    return Jr(_);
  } finally {
    e.f ^= Us, ye = t, Me = n, De = s, L = r, Ve = i, En(c), $e = f, Xt = a;
  }
}
function _a(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var s = oo.call(n, e);
    if (s !== -1) {
      var r = n.length - 1;
      r === 0 ? n = t.reactions = null : (n[s] = n[r], n.pop());
    }
  }
  if (n === null && (t.f & be) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (ye === null || !wn.call(ye, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & Ue) !== 0 && (i.f ^= Ue, i.f &= ~Qt), i.v !== ce && Qs(i), sa(i), Yn(i, 0);
  }
}
function Yn(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var s = t; s < n.length; s++)
      _a(e, n[s]);
}
function Tn(e) {
  var t = e.f;
  if ((t & Be) === 0) {
    Q(e, ie);
    var n = R, s = hs;
    R = e, hs = !0;
    try {
      (t & (it | Ur)) !== 0 ? ha(e) : ar(e), hi(e);
      var r = yi(e);
      e.teardown = typeof r == "function" ? r : null, e.wv = mi;
      var i;
    } finally {
      hs = s, R = n;
    }
  }
}
async function pn() {
  await Promise.resolve(), Vo();
}
function o(e) {
  var t = e.f, n = (t & be) !== 0;
  if (L !== null && !$e) {
    var s = R !== null && (R.f & Be) !== 0;
    if (!s && (Ve === null || !wn.call(Ve, e))) {
      var r = L.deps;
      if ((L.f & Us) !== 0)
        e.rv < Ut && (e.rv = Ut, ye === null && r !== null && r[Me] === e ? Me++ : ye === null ? ye = [e] : ye.push(e));
      else {
        (L.deps ?? (L.deps = [])).push(e);
        var i = e.reactions;
        i === null ? e.reactions = [L] : wn.call(i, L) || i.push(L);
      }
    }
  }
  if (Nt && $t.has(e))
    return $t.get(e);
  if (n) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (Nt) {
      var f = c.v;
      return ((c.f & ie) === 0 && c.reactions !== null || Si(c)) && (f = tr(c)), $t.set(c, f), f;
    }
    var a = (c.f & Ue) === 0 && !$e && L !== null && (hs || (L.f & Ue) !== 0), u = (c.f & nn) === 0;
    Zn(c) && (a && (c.f |= Ue), ii(c)), a && !u && (oi(c), Ei(c));
  }
  if (Ke?.has(e))
    return Ke.get(e);
  if ((e.f & Pt) !== 0)
    throw e.v;
  return e.v;
}
function Ei(e) {
  if (e.f |= Ue, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & be) !== 0 && (t.f & Ue) === 0 && (oi(
        /** @type {Derived} */
        t
      ), Ei(
        /** @type {Derived} */
        t
      ));
}
function Si(e) {
  if (e.v === ce) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if ($t.has(t) || (t.f & be) !== 0 && Si(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function xs(e) {
  var t = $e;
  try {
    return $e = !0, e();
  } finally {
    $e = t;
  }
}
const ka = ["touchstart", "touchmove"];
function ma(e) {
  return ka.includes(e);
}
const Bt = Symbol("events"), Ti = /* @__PURE__ */ new Set(), Ks = /* @__PURE__ */ new Set();
function Z(e, t, n) {
  (t[Bt] ?? (t[Bt] = {}))[e] = n;
}
function wa(e) {
  for (var t = 0; t < e.length; t++)
    Ti.add(e[t]);
  for (var n of Ks)
    n(e);
}
let Pr = null;
function Ir(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), s = e.type, r = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    r[0] || e.target
  );
  Pr = e;
  var c = 0, f = Pr === e && e[Bt];
  if (f) {
    var a = r.indexOf(f);
    if (a !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Bt] = t;
      return;
    }
    var u = r.indexOf(t);
    if (u === -1)
      return;
    a <= u && (c = a);
  }
  if (i = /** @type {Element} */
  r[c] || e.target, i !== t) {
    ao(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var v = L, w = R;
    qe(null), at(null);
    try {
      for (var g, k = []; i !== null; ) {
        var b = i.assignedSlot || i.parentNode || /** @type {any} */
        i.host || null;
        try {
          var T = i[Bt]?.[s];
          T != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i) && T.call(i, e);
        } catch (_) {
          g ? k.push(_) : g = _;
        }
        if (e.cancelBubble || b === t || b === null)
          break;
        i = b;
      }
      if (g) {
        for (let _ of k)
          queueMicrotask(() => {
            throw _;
          });
        throw g;
      }
    } finally {
      e[Bt] = t, delete e.currentTarget, qe(v), at(w);
    }
  }
}
const xa = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function ya(e) {
  return (
    /** @type {string} */
    xa?.createHTML(e) ?? e
  );
}
function Ai(e) {
  var t = nr("template");
  return t.innerHTML = ya(e.replaceAll("<!>", "<!---->")), t.content;
}
function tn(e, t) {
  var n = (
    /** @type {Effect} */
    R
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function D(e, t) {
  var n = (t & No) !== 0, s = (t & Lo) !== 0, r, i = !e.startsWith("<!>");
  return () => {
    r === void 0 && (r = Ai(i ? e : "<!>" + e), n || (r = /** @type {TemplateNode} */
    /* @__PURE__ */ rt(r)));
    var c = (
      /** @type {TemplateNode} */
      s || ci ? document.importNode(r, !0) : r.cloneNode(!0)
    );
    if (n) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ rt(c)
      ), a = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      tn(f, a);
    } else
      tn(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Ea(e, t, n = "svg") {
  var s = !e.startsWith("<!>"), r = `<${n}>${s ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var c = (
        /** @type {DocumentFragment} */
        Ai(r)
      ), f = (
        /** @type {Element} */
        /* @__PURE__ */ rt(c)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ rt(f);
    }
    var a = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return tn(a, a), a;
  };
}
// @__NO_SIDE_EFFECTS__
function Cn(e, t) {
  return /* @__PURE__ */ Ea(e, t, "svg");
}
function fn(e = "") {
  {
    var t = kt(e + "");
    return tn(t, t), t;
  }
}
function un() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = kt();
  return e.append(t, n), tn(t, n), e;
}
function S(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function pe(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = n, e.nodeValue = `${n}`);
}
function Sa(e, t) {
  return Ta(e, t);
}
const is = /* @__PURE__ */ new Map();
function Ta(e, { target: t, anchor: n, props: s = {}, events: r, context: i, intro: c = !0, transformError: f }) {
  oa();
  var a = void 0, u = va(() => {
    var v = n ?? t.appendChild(kt());
    Wo(
      /** @type {TemplateNode} */
      v,
      {
        pending: () => {
        }
      },
      (k) => {
        Gr({});
        var b = (
          /** @type {ComponentContext} */
          Se
        );
        i && (b.c = i), r && (s.$$events = r), a = e(k, s) || {}, Wr();
      },
      f
    );
    var w = /* @__PURE__ */ new Set(), g = (k) => {
      for (var b = 0; b < k.length; b++) {
        var T = k[b];
        if (!w.has(T)) {
          w.add(T);
          var _ = ma(T);
          for (const W of [t, document]) {
            var P = is.get(W);
            P === void 0 && (P = /* @__PURE__ */ new Map(), is.set(W, P));
            var te = P.get(T);
            te === void 0 ? (W.addEventListener(T, Ir, { passive: _ }), P.set(T, 1)) : P.set(T, te + 1);
          }
        }
      }
    };
    return g(ms(Ti)), Ks.add(g), () => {
      for (var k of w)
        for (const _ of [t, document]) {
          var b = (
            /** @type {Map<string, number>} */
            is.get(_)
          ), T = (
            /** @type {number} */
            b.get(k)
          );
          --T == 0 ? (_.removeEventListener(k, Ir), b.delete(k), b.size === 0 && is.delete(_)) : b.set(k, T);
        }
      Ks.delete(g), v !== n && v.parentNode?.removeChild(v);
    };
  });
  return $s.set(a, u), a;
}
let $s = /* @__PURE__ */ new WeakMap();
function Aa(e, t) {
  const n = $s.get(e);
  return n ? ($s.delete(e), n(t)) : Promise.resolve();
}
var Ge, nt, Ne, Wt, Jn, Xn, ks;
class Ca {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Ye(this, "anchor");
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
    A(this, nt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    A(this, Ne, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    A(this, Wt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    A(this, Jn, !0);
    /**
     * @param {Batch} batch
     */
    A(this, Xn, (t) => {
      if (l(this, Ge).has(t)) {
        var n = (
          /** @type {Key} */
          l(this, Ge).get(t)
        ), s = l(this, nt).get(n);
        if (s)
          lr(s), l(this, Wt).delete(n);
        else {
          var r = l(this, Ne).get(n);
          r && (l(this, nt).set(n, r.effect), l(this, Ne).delete(n), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), s = r.effect);
        }
        for (const [i, c] of l(this, Ge)) {
          if (l(this, Ge).delete(i), i === t)
            break;
          const f = l(this, Ne).get(c);
          f && (Ee(f.effect), l(this, Ne).delete(c));
        }
        for (const [i, c] of l(this, nt)) {
          if (i === n || l(this, Wt).has(i)) continue;
          const f = () => {
            if (Array.from(l(this, Ge).values()).includes(i)) {
              var u = document.createDocumentFragment();
              cr(c, u), u.append(kt()), l(this, Ne).set(i, { effect: c, fragment: u });
            } else
              Ee(c);
            l(this, Wt).delete(i), l(this, nt).delete(i);
          };
          l(this, Jn) || !s ? (l(this, Wt).add(i), Jt(c, f, !1)) : f();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    A(this, ks, (t) => {
      l(this, Ge).delete(t);
      const n = Array.from(l(this, Ge).values());
      for (const [s, r] of l(this, Ne))
        n.includes(s) || (Ee(r.effect), l(this, Ne).delete(s));
    });
    this.anchor = t, N(this, Jn, n);
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
    ), r = di();
    if (n && !l(this, nt).has(t) && !l(this, Ne).has(t))
      if (r) {
        var i = document.createDocumentFragment(), c = kt();
        i.append(c), l(this, Ne).set(t, {
          effect: He(() => n(c)),
          fragment: i
        });
      } else
        l(this, nt).set(
          t,
          He(() => n(this.anchor))
        );
    if (l(this, Ge).set(s, t), r) {
      for (const [f, a] of l(this, nt))
        f === t ? s.unskip_effect(a) : s.skip_effect(a);
      for (const [f, a] of l(this, Ne))
        f === t ? s.unskip_effect(a.effect) : s.skip_effect(a.effect);
      s.oncommit(l(this, Xn)), s.ondiscard(l(this, ks));
    } else
      l(this, Xn).call(this, s);
  }
}
Ge = new WeakMap(), nt = new WeakMap(), Ne = new WeakMap(), Wt = new WeakMap(), Jn = new WeakMap(), Xn = new WeakMap(), ks = new WeakMap();
function B(e, t, n = !1) {
  var s = new Ca(e), r = n ? yn : 0;
  function i(c, f) {
    s.ensure(c, f);
  }
  or(() => {
    var c = !1;
    t((f, a = 0) => {
      c = !0, i(a, f);
    }), c || i(-1, null);
  }, r);
}
function dn(e, t) {
  return t;
}
function Ma(e, t, n) {
  for (var s = [], r = t.length, i, c = t.length, f = 0; f < r; f++) {
    let w = t[f];
    Jt(
      w,
      () => {
        if (i) {
          if (i.pending.delete(w), i.done.add(w), i.pending.size === 0) {
            var g = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Js(e, ms(i.done)), g.delete(i), g.size === 0 && (e.outrogroups = null);
          }
        } else
          c -= 1;
      },
      !1
    );
  }
  if (c === 0) {
    var a = s.length === 0 && n !== null;
    if (a) {
      var u = (
        /** @type {Element} */
        n
      ), v = (
        /** @type {Element} */
        u.parentNode
      );
      aa(v), v.append(u), e.items.clear();
    }
    Js(e, t, !a);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function Js(e, t, n = !0) {
  var s;
  if (e.pending.size > 0) {
    s = /* @__PURE__ */ new Set();
    for (const c of e.pending.values())
      for (const f of c)
        s.add(
          /** @type {EachItem} */
          e.items.get(f).e
        );
  }
  for (var r = 0; r < t.length; r++) {
    var i = t[r];
    if (s?.has(i)) {
      i.f |= st;
      const c = document.createDocumentFragment();
      cr(i, c);
    } else
      Ee(t[r], n);
  }
}
var Nr;
function vn(e, t, n, s, r, i = null) {
  var c = e, f = /* @__PURE__ */ new Map(), a = (t & Br) !== 0;
  if (a) {
    var u = (
      /** @type {Element} */
      e
    );
    c = u.appendChild(kt());
  }
  var v = null, w = /* @__PURE__ */ ta(() => {
    var W = n();
    return jr(W) ? W : W == null ? [] : ms(W);
  }), g, k = /* @__PURE__ */ new Map(), b = !0;
  function T(W) {
    (te.effect.f & Be) === 0 && (te.pending.delete(W), te.fallback = v, Pa(te, g, c, t, s), v !== null && (g.length === 0 ? (v.f & st) === 0 ? lr(v) : (v.f ^= st, Hn(v, null, c)) : Jt(v, () => {
      v = null;
    })));
  }
  function _(W) {
    te.pending.delete(W);
  }
  var P = or(() => {
    g = /** @type {V[]} */
    o(w);
    for (var W = g.length, oe = /* @__PURE__ */ new Set(), ne = (
      /** @type {Batch} */
      I
    ), ae = di(), ue = 0; ue < W; ue += 1) {
      var Xe = g[ue], lt = s(Xe, ue), V = b ? null : f.get(lt);
      V ? (V.v && Sn(V.v, Xe), V.i && Sn(V.i, ue), ae && ne.unskip_effect(V.e)) : (V = Ia(
        f,
        b ? c : Nr ?? (Nr = kt()),
        Xe,
        lt,
        ue,
        r,
        t,
        n
      ), b || (V.e.f |= st), f.set(lt, V)), oe.add(lt);
    }
    if (W === 0 && i && !v && (b ? v = He(() => i(c)) : (v = He(() => i(Nr ?? (Nr = kt()))), v.f |= st)), W > oe.size && ko(), !b)
      if (k.set(ne, oe), ae) {
        for (const [Le, Qe] of f)
          oe.has(Le) || ne.skip_effect(Qe.e);
        ne.oncommit(T), ne.ondiscard(_);
      } else
        T(ne);
    o(w);
  }), te = { effect: P, items: f, pending: k, outrogroups: null, fallback: v };
  b = !1;
}
function Fn(e) {
  for (; e !== null && (e.f & Je) === 0; )
    e = e.next;
  return e;
}
function Pa(e, t, n, s, r) {
  var i = (s & Po) !== 0, c = t.length, f = e.items, a = Fn(e.effect.first), u, v = null, w, g = [], k = [], b, T, _, P;
  if (i)
    for (P = 0; P < c; P += 1)
      b = t[P], T = r(b, P), _ = /** @type {EachItem} */
      f.get(T).e, (_.f & st) === 0 && (_.nodes?.a?.measure(), (w ?? (w = /* @__PURE__ */ new Set())).add(_));
  for (P = 0; P < c; P += 1) {
    if (b = t[P], T = r(b, P), _ = /** @type {EachItem} */
    f.get(T).e, e.outrogroups !== null)
      for (const V of e.outrogroups)
        V.pending.delete(_), V.done.delete(_);
    if ((_.f & ke) !== 0 && (lr(_), i && (_.nodes?.a?.unfix(), (w ?? (w = /* @__PURE__ */ new Set())).delete(_))), (_.f & st) !== 0)
      if (_.f ^= st, _ === a)
        Hn(_, null, n);
      else {
        var te = v ? v.next : a;
        _ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Tt(e, v, _), Tt(e, _, te), Hn(_, te, n), v = _, g = [], k = [], a = Fn(v.next);
        continue;
      }
    if (_ !== a) {
      if (u !== void 0 && u.has(_)) {
        if (g.length < k.length) {
          var W = k[0], oe;
          v = W.prev;
          var ne = g[0], ae = g[g.length - 1];
          for (oe = 0; oe < g.length; oe += 1)
            Hn(g[oe], W, n);
          for (oe = 0; oe < k.length; oe += 1)
            u.delete(k[oe]);
          Tt(e, ne.prev, ae.next), Tt(e, v, ne), Tt(e, ae, W), a = W, v = ae, P -= 1, g = [], k = [];
        } else
          u.delete(_), Hn(_, a, n), Tt(e, _.prev, _.next), Tt(e, _, v === null ? e.effect.first : v.next), Tt(e, v, _), v = _;
        continue;
      }
      for (g = [], k = []; a !== null && a !== _; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(a), k.push(a), a = Fn(a.next);
      if (a === null)
        continue;
    }
    (_.f & st) === 0 && g.push(_), v = _, a = Fn(_.next);
  }
  if (e.outrogroups !== null) {
    for (const V of e.outrogroups)
      V.pending.size === 0 && (Js(e, ms(V.done)), e.outrogroups?.delete(V));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (a !== null || u !== void 0) {
    var ue = [];
    if (u !== void 0)
      for (_ of u)
        (_.f & ke) === 0 && ue.push(_);
    for (; a !== null; )
      (a.f & ke) === 0 && a !== e.fallback && ue.push(a), a = Fn(a.next);
    var Xe = ue.length;
    if (Xe > 0) {
      var lt = (s & Br) !== 0 && c === 0 ? n : null;
      if (i) {
        for (P = 0; P < Xe; P += 1)
          ue[P].nodes?.a?.measure();
        for (P = 0; P < Xe; P += 1)
          ue[P].nodes?.a?.fix();
      }
      Ma(e, ue, lt);
    }
  }
  i && Kt(() => {
    if (w !== void 0)
      for (_ of w)
        _.nodes?.a?.apply();
  });
}
function Ia(e, t, n, s, r, i, c, f) {
  var a = (c & Co) !== 0 ? (c & Io) === 0 ? /* @__PURE__ */ ra(n, !1, !1) : en(n) : null, u = (c & Mo) !== 0 ? en(r) : null;
  return {
    v: a,
    i: u,
    e: He(() => (i(t, a ?? n, u ?? r, f), () => {
      e.delete(s);
    }))
  };
}
function Hn(e, t, n) {
  if (e.nodes)
    for (var s = e.nodes.start, r = e.nodes.end, i = t && (t.f & st) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; s !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Qn(s)
      );
      if (i.before(s), s === r)
        return;
      s = c;
    }
}
function Tt(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Na(e, t, n = !1, s = !1, r = !1, i = !1) {
  var c = e, f = "";
  if (n)
    var a = (
      /** @type {Element} */
      e
    );
  he(() => {
    var u = (
      /** @type {Effect} */
      R
    );
    if (f !== (f = t() ?? "")) {
      if (n) {
        u.nodes = null, a.innerHTML = /** @type {string} */
        f, f !== "" && tn(
          /** @type {TemplateNode} */
          /* @__PURE__ */ rt(a),
          /** @type {TemplateNode} */
          a.lastChild
        );
        return;
      }
      if (u.nodes !== null && (gi(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), f !== "") {
        var v = s ? Ro : r ? zo : void 0, w = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          nr(s ? "svg" : r ? "math" : "template", v)
        );
        w.innerHTML = /** @type {any} */
        f;
        var g = s || r ? w : (
          /** @type {HTMLTemplateElement} */
          w.content
        );
        if (tn(
          /** @type {TemplateNode} */
          /* @__PURE__ */ rt(g),
          /** @type {TemplateNode} */
          g.lastChild
        ), s || r)
          for (; /* @__PURE__ */ rt(g); )
            c.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ rt(g)
            );
        else
          c.before(g);
      }
    }
  });
}
function La(e, t) {
  pi(() => {
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
      const r = nr("style");
      r.id = t.hash, r.textContent = t.code, s.appendChild(r);
    }
  });
}
const Lr = [...` 	
\r\f \v\uFEFF`];
function Ra(e, t, n) {
  var s = e == null ? "" : "" + e;
  if (t && (s = s ? s + " " + t : t), n) {
    for (var r of Object.keys(n))
      if (n[r])
        s = s ? s + " " + r : r;
      else if (s.length)
        for (var i = r.length, c = 0; (c = s.indexOf(r, c)) >= 0; ) {
          var f = c + i;
          (c === 0 || Lr.includes(s[c - 1])) && (f === s.length || Lr.includes(s[f])) ? s = (c === 0 ? "" : s.substring(0, c)) + s.substring(f + 1) : c = f;
        }
  }
  return s === "" ? null : s;
}
function za(e, t) {
  return e == null ? null : String(e);
}
function Ft(e, t, n, s, r, i) {
  var c = e.__className;
  if (c !== n || c === void 0) {
    var f = Ra(n, s, i);
    f == null ? e.removeAttribute("class") : e.className = f, e.__className = n;
  } else if (i && r !== i)
    for (var a in i) {
      var u = !!i[a];
      (r == null || u !== !!r[a]) && e.classList.toggle(a, u);
    }
  return i;
}
function Rr(e, t, n, s) {
  var r = e.__style;
  if (r !== t) {
    var i = za(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e.__style = t;
  }
  return s;
}
const Da = Symbol("is custom element"), Oa = Symbol("is html");
function os(e, t, n, s) {
  var r = ja(e);
  r[t] !== (r[t] = n) && (t === "loading" && (e[go] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Fa(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function ja(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [Da]: e.nodeName.includes("-"),
      [Oa]: e.namespaceURI === Vr
    })
  );
}
var zr = /* @__PURE__ */ new Map();
function Fa(e) {
  var t = e.getAttribute("is") || e.nodeName, n = zr.get(t);
  if (n) return n;
  zr.set(t, n = []);
  for (var s, r = e, i = Element.prototype; i !== r; ) {
    s = lo(r);
    for (var c in s)
      s[c].set && n.push(c);
    r = Fr(r);
  }
  return n;
}
function Ha(e, t, n = t) {
  var s = /* @__PURE__ */ new WeakSet();
  ca(e, "input", async (r) => {
    var i = r ? e.defaultValue : e.value;
    if (i = zs(e) ? Ds(i) : i, n(i), I !== null && s.add(I), await pn(), i !== (i = t())) {
      var c = e.selectionStart, f = e.selectionEnd, a = e.value.length;
      if (e.value = i ?? "", f !== null) {
        var u = e.value.length;
        c === f && f === a && u > a ? (e.selectionStart = u, e.selectionEnd = u) : (e.selectionStart = c, e.selectionEnd = Math.min(f, u));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  xs(t) == null && e.value && (n(zs(e) ? Ds(e.value) : e.value), I !== null && s.add(I)), ir(() => {
    var r = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        I
      );
      if (s.has(i))
        return;
    }
    zs(e) && r === Ds(e.value) || e.type === "date" && !r && !e.value || r !== e.value && (e.value = r ?? "");
  });
}
function zs(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function Ds(e) {
  return e === "" ? null : +e;
}
function Dr(e, t) {
  return e === t || e?.[as] === t;
}
function Os(e = {}, t, n, s) {
  var r = (
    /** @type {ComponentContext} */
    Se.r
  ), i = (
    /** @type {Effect} */
    R
  );
  return pi(() => {
    var c, f;
    return ir(() => {
      c = f, f = [], xs(() => {
        e !== n(...f) && (t(e, ...f), c && Dr(n(...c), e) && t(null, ...c));
      });
    }), () => {
      let a = i;
      for (; a !== r && a.parent !== null && a.parent.f & Fs; )
        a = a.parent;
      const u = () => {
        f && Dr(n(...f), e) && t(null, ...f);
      }, v = a.teardown;
      a.teardown = () => {
        u(), v?.();
      };
    };
  }), e;
}
function Ua(e) {
  Se === null && bo(), ps(() => {
    const t = xs(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const Ba = "5";
var Or;
typeof window < "u" && ((Or = window.__svelte ?? (window.__svelte = {})).v ?? (Or.v = /* @__PURE__ */ new Set())).add(Ba);
const Va = "Ask questions about your realm — its governance, proposals, rules, and more — and get answers from an AI assistant in chat.";
var qa = /* @__PURE__ */ D('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), Ya = /* @__PURE__ */ D('<div class="settings-assistant-grid svelte-beco3k"></div>'), Ga = /* @__PURE__ */ D('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), Wa = /* @__PURE__ */ D('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), Ka = /* @__PURE__ */ D('<div class="settings-history-list svelte-beco3k"></div>'), $a = /* @__PURE__ */ D('<p class="settings-section-desc svelte-beco3k"> </p>'), Ja = /* @__PURE__ */ D('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), Xa = /* @__PURE__ */ D(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <p class="settings-page-desc svelte-beco3k"> </p> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), Qa = /* @__PURE__ */ D('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), Za = /* @__PURE__ */ D('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), el = /* @__PURE__ */ D('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), tl = /* @__PURE__ */ D('<div class="assistant-selector svelte-beco3k"></div>'), nl = /* @__PURE__ */ D('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), sl = /* @__PURE__ */ D('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), rl = /* @__PURE__ */ D('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), il = /* @__PURE__ */ D('<div class="history-panel svelte-beco3k"><!></div>'), ol = /* @__PURE__ */ D(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), al = /* @__PURE__ */ D(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), ll = /* @__PURE__ */ D('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), cl = /* @__PURE__ */ Cn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), fl = /* @__PURE__ */ Cn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), ul = /* @__PURE__ */ D('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), dl = /* @__PURE__ */ D('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), vl = /* @__PURE__ */ Cn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), pl = /* @__PURE__ */ Cn('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), hl = /* @__PURE__ */ D('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), gl = /* @__PURE__ */ D('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), bl = /* @__PURE__ */ D('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), _l = /* @__PURE__ */ D('<p class="stream-status svelte-beco3k"> </p>'), kl = /* @__PURE__ */ D('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), ml = /* @__PURE__ */ D('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), wl = /* @__PURE__ */ D('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), xl = /* @__PURE__ */ D("<!> <!> <!>", 1), yl = /* @__PURE__ */ D('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), El = /* @__PURE__ */ D('<button class="suggestion-chip svelte-beco3k"> </button>'), Sl = /* @__PURE__ */ D('<div class="suggestions svelte-beco3k"><!></div>'), Tl = /* @__PURE__ */ Cn('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Al = /* @__PURE__ */ Cn('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Cl = /* @__PURE__ */ D('<div><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const Ml = {
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
function Pl(e, t) {
  Gr(t, !0), La(e, Ml);
  function n() {
    const d = t.ctx.config?.network;
    if (d && d !== "ic") return d;
    const h = globalThis.__CANISTER_IDS;
    return h?.network && h.network !== "ic" ? h.network : window.location.hostname.includes("icp0.io") ? "test" : "staging";
  }
  let s = /* @__PURE__ */ C(We([])), r = /* @__PURE__ */ C(""), i = /* @__PURE__ */ C(!1), c = /* @__PURE__ */ C(""), f = /* @__PURE__ */ C(!1), a = /* @__PURE__ */ C(We(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), u = /* @__PURE__ */ C(""), v = /* @__PURE__ */ C(void 0), w = /* @__PURE__ */ C(We([])), g = /* @__PURE__ */ C(!1), k = /* @__PURE__ */ C(void 0), b = /* @__PURE__ */ C(We([])), T = /* @__PURE__ */ C(null), _ = /* @__PURE__ */ C(!1), P = /* @__PURE__ */ C(null), te = /* @__PURE__ */ C(void 0), W = /* @__PURE__ */ C("100%"), oe = /* @__PURE__ */ C(null), ne = /* @__PURE__ */ C(!1), ae = /* @__PURE__ */ C(null), ue = /* @__PURE__ */ C(0), Xe, lt, V = /* @__PURE__ */ C(null), Le = /* @__PURE__ */ C(We([])), Qe = /* @__PURE__ */ C(!1), es = /* @__PURE__ */ C(!1);
  const Mn = "https://geister-api.realmsgos.dev/", Ci = 36e4;
  let Mi = `${Mn}api/ask`, Pi = `${Mn}suggestions`, Ii = `${Mn}api/personas/assistants`, Pn = `${Mn}api/conversations`;
  function Ni(d) {
    if (!d) return null;
    const h = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!h) return null;
    try {
      return decodeURIComponent(h[1]);
    } catch {
      return h[1];
    }
  }
  function fr(d) {
    if (!d) return null;
    const h = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!h) return null;
    try {
      return decodeURIComponent(h[1]);
    } catch {
      return h[1];
    }
  }
  function Li(d) {
    !d || d.id === o(ue) || (p(ue, d.id, !0), p(r, d.message, !0), p(ne, !0), d.autoSend ? setTimeout(() => void on(), 150) : pn().then(Cs));
  }
  function Ri() {
    if (fr(o(ae)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function zi() {
    Xe = t.ctx.host?.pendingPrompt?.subscribe?.(Li), lt = t.ctx.host?.focus?.subscribe?.((d) => {
      p(ae, d, !0);
    });
  }
  function ur(d, h) {
    if (h === 503 && d instanceof Error && d.message) {
      const m = d.message.toLowerCase();
      return m.includes("pod") || m.includes("llm backend") || m.includes("ollama") || m.includes("waking up") || m.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return h === 502 || h === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : h === 504 || h === 524 ? "The request timed out before the server could respond. Please try again." : h && h >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? ur(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function Di(d) {
    const h = d.toLowerCase();
    return h.includes("llm backend") || h.includes("cannot reach ollama") || h.includes("ollama at");
  }
  function In() {
    p(a, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function dr() {
    p(a, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function Oi(d) {
    const h = d.toLowerCase();
    return h.includes("waking up") || h.includes("still starting");
  }
  function ys() {
    p(c, ""), p(f, !1);
  }
  function ts(d, h) {
    d.trim() && (p(f, !0), p(c, ""));
    const m = { text: d, isUser: !1, ...h.trim() ? { thinking: h } : {} }, E = o(s)[o(s).length - 1];
    !E || E.isUser ? p(s, [...o(s), m], !0) : p(s, o(s).map((z, Re) => Re === o(s).length - 1 ? { ...z, ...m } : z), !0), pn().then(Ts);
  }
  function ji(d, h) {
    const m = typeof d.type == "string" ? d.type : d.text ? "text" : "", E = typeof d.text == "string" ? d.text : "";
    if (m === "status" && E) {
      In(), p(c, E, !0);
      return;
    }
    if (m === "thinking" && E) {
      In(), h.thinking += E, ts(h.text, h.thinking);
      return;
    }
    E && (In(), h.text += E, ts(h.text, h.thinking));
  }
  let Nn = "", wt = "", vr, pr, xt = /* @__PURE__ */ C(!1);
  const sn = !!t.ctx.sidebarPanel, hr = "llm_chat_prefs";
  function Fi() {
    try {
      return JSON.parse(localStorage.getItem(hr) || "{}");
    } catch {
      return {};
    }
  }
  function Hi(d) {
    try {
      localStorage.setItem(hr, JSON.stringify(d));
    } catch {
    }
  }
  const Es = Fi();
  let rn = /* @__PURE__ */ C(We(Es.defaultAssistant || "")), Lt = /* @__PURE__ */ C(Es.showSuggestions !== !1), Ln = /* @__PURE__ */ C(Es.sharePageContext !== !1);
  ps(() => {
    Hi({
      defaultAssistant: o(rn),
      showSuggestions: o(Lt),
      sharePageContext: o(Ln)
    });
  });
  let Rn = /* @__PURE__ */ C("unknown"), ns = /* @__PURE__ */ C(!1), Ss = /* @__PURE__ */ C(!1);
  async function gr() {
    try {
      const d = await fetch(`${Mn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      p(Rn, d.ok ? "online" : "offline", !0);
    } catch {
      p(Rn, "offline");
    }
  }
  async function Ui() {
    if (!(!wt || !o(xt))) {
      p(ns, !0);
      try {
        await As(), await Promise.all(o(Le).map((d) => fetch(`${Pn}/${d.conversation_id}`, { method: "DELETE" }))), p(Le, [], !0), p(s, [], !0), p(V, null), p(Ss, !0), setTimeout(
          () => {
            p(Ss, !1);
          },
          2e3
        );
      } catch {
      } finally {
        p(ns, !1);
      }
    }
  }
  Ua(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", h = t.ctx.config?.canisterId || "";
    if (Nn = d || h, vr = t.ctx.principal?.subscribe?.((m) => {
      wt = m || "";
    }), pr = t.ctx.isAuthenticated?.subscribe?.((m) => {
      p(xt, m, !0);
    }), !sn) {
      const m = window.visualViewport;
      if (m) {
        const E = () => {
          const z = o(te)?.getBoundingClientRect().top ?? m.offsetTop, Re = Math.max(Math.round(m.height - z), 200);
          p(W, `${Re}px`);
        };
        await pn(), E(), m.addEventListener("resize", E), m.addEventListener("scroll", E), window.addEventListener("resize", E), window.__chatVpCleanup = () => {
          m.removeEventListener("resize", E), m.removeEventListener("scroll", E), window.removeEventListener("resize", E);
        };
      }
    }
    if (Bi(), zi(), await Vi(), o(rn) && o(b).length > 0) {
      const m = o(b).find((E) => E.id === o(rn));
      m && p(T, m, !0);
    }
    !o(ne) && o(Lt) && await ss(), sn || (gr(), o(xt) && await As());
  });
  function Bi() {
    try {
      const d = new URLSearchParams(window.location.search), h = d.get("explain");
      if (!h) return;
      const [m, E] = h.split(":");
      if (m === "codex" && E)
        p(ne, !0), p(oe, E, !0), p(r, `Please explain this codex: [${E}](/extensions/codex_viewer/${E})`), setTimeout(() => on(), 300);
      else if (m === "financial_statements") {
        p(ne, !0);
        const z = d.get("context") || "";
        p(r, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${z}`), setTimeout(() => on(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  ps(() => {
    o(s), pn().then(Ts);
  });
  function Ts() {
    o(v) && (o(v).scrollTop = o(v).scrollHeight);
  }
  async function Vi() {
    if (!o(_)) {
      p(_, !0);
      try {
        const d = await fetch(Ii, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        const h = await d.json();
        h.assistants && Array.isArray(h.assistants) && (p(b, h.assistants, !0), o(b).length > 0 && !o(T) && p(T, o(b)[0], !0));
      } catch (d) {
        console.error("Error fetching assistants:", d);
      } finally {
        p(_, !1);
      }
    }
  }
  async function ss() {
    if (!o(g)) {
      p(g, !0);
      try {
        const d = new URLSearchParams({
          user_principal: wt || "",
          realm_principal: Nn || "",
          persona: o(T)?.id || "ashoka"
        }), h = await fetch(`${Pi}?${d.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!h.ok) throw new Error(`HTTP ${h.status}`);
        const m = await h.json();
        m.suggestions && Array.isArray(m.suggestions) && p(w, m.suggestions, !0);
      } catch (d) {
        console.error("Error fetching suggestions:", d);
      } finally {
        p(g, !1);
      }
    }
  }
  async function on() {
    if (!o(r).trim()) return;
    p(u, ""), p(
      s,
      [
        ...o(s),
        { text: o(r), isUser: !0 }
      ],
      !0
    );
    const d = o(r);
    p(r, ""), p(i, !0), ys(), p(c, o(a) ? "Thinking…" : "", !0);
    try {
      await Wi();
      const h = n(), m = {
        question: d,
        realm_principal: Nn,
        user_principal: wt,
        stream: !0,
        verbosity: 1,
        persona: o(T)?.id || "ashoka",
        network: h,
        ...o(V) ? { conversation_id: o(V) } : {}
      };
      if (o(oe))
        m.explain_codex_id = o(oe), p(oe, null);
      else {
        const fe = Ni(o(ae)?.uri);
        fe && (m.explain_codex_id = fe);
      }
      const E = fr(o(ae)?.uri);
      E && (m.explain_proposal_id = E, m.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(ae)?.label || "Proposal",
        proposalId: E
      }), o(ae) && (m.focus = {
        uri: o(ae).uri,
        label: o(ae).label
      });
      const z = await fetch(Mi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(m),
        signal: AbortSignal.timeout(Ci)
      });
      if (!z.ok) {
        let fe = "";
        try {
          const Te = await z.json();
          fe = typeof Te?.error == "string" ? Te.error : "";
        } catch {
        }
        throw fe ? Object.assign(new Error(fe), { httpStatus: z.status }) : Object.assign(new Error(`HTTP error! Status: ${z.status}`), { httpStatus: z.status });
      }
      const Re = z.body?.getReader();
      if (!Re) throw new Error("Response body is not readable");
      const zn = new TextDecoder(), me = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: fe, value: Te } = await Re.read();
          if (fe) break;
          const cn = zn.decode(Te, { stream: !0 }).split(`
`);
          for (const ct of cn)
            if (ct.startsWith("data: ")) {
              const Rt = ct.slice(6);
              if (Rt === "[DONE]") continue;
              try {
                ji(JSON.parse(Rt), me);
              } catch {
                me.text += Rt, ts(me.text, me.thinking);
              }
            } else ct.trim() && !ct.startsWith(":") && (me.text += ct, ts(me.text, me.thinking));
        }
      } finally {
        Re.releaseLock();
      }
      const yt = me.text, an = me.thinking;
      yt.trim() ? Di(yt) ? (p(u, "The AI backend is temporarily offline. Please try again in a few minutes."), dr()) : yt.trim() && In() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? p(s, o(s).map((fe, Te) => Te === o(s).length - 1 ? { ...fe, text: "No response from LLM" } : fe), !0) : p(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), p(i, !1), ys(), p(ne, !1), await ss();
    } catch (h) {
      console.error("Error calling LLM:", h), p(u, ur(h, h?.httpStatus), !0), Oi(o(u)) && dr(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && p(s, o(s).slice(0, -1), !0);
    } finally {
      p(i, !1), ys(), p(ne, !1);
    }
  }
  function qi() {
    p(u, "");
  }
  async function As() {
    if (!(!wt || !o(xt))) {
      p(es, !0);
      try {
        const d = new URLSearchParams({
          user_principal: wt,
          realm_principal: Nn
        }), h = await fetch(`${Pn}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!h.ok) return;
        const m = await h.json();
        p(Le, (m.conversations || []).sort((E, z) => new Date(z.updated_at).getTime() - new Date(E.updated_at).getTime()), !0);
      } catch {
      } finally {
        p(es, !1);
      }
    }
  }
  async function br(d) {
    p(Qe, !1), p(s, [], !0), p(V, d.conversation_id, !0);
    const h = o(b).find((m) => m.id === d.persona);
    h && p(T, h, !0);
    try {
      const m = await fetch(`${Pn}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!m.ok) return;
      const E = await m.json();
      p(s, Ki(E.messages || []), !0), o(s).some((z) => !z.isUser) && In(), await pn(), Ts();
    } catch {
    }
  }
  async function Yi() {
    p(Qe, !1), p(s, [], !0), p(V, null), p(u, ""), p(w, [], !0), await ss();
  }
  async function _r(d, h) {
    h.stopPropagation();
    try {
      await fetch(`${Pn}/${d}`, { method: "DELETE" }), p(Le, o(Le).filter((m) => m.conversation_id !== d), !0), o(V) === d && (p(s, [], !0), p(V, null));
    } catch {
    }
  }
  async function Gi() {
    p(Qe, !0), await As();
  }
  function kr(d) {
    const h = new Date(d), E = (/* @__PURE__ */ new Date()).getTime() - h.getTime(), z = Math.floor(E / 864e5);
    return z === 0 ? h.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : z === 1 ? "Yesterday" : z < 7 ? h.toLocaleDateString([], { weekday: "short" }) : h.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function Wi() {
    if (!(o(V) || !wt || !o(xt)))
      try {
        const d = await fetch(Pn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: wt,
            realm_principal: Nn,
            persona: o(T)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const h = await d.json();
          p(V, h.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function mr(d, h) {
    const m = () => {
      p(P, h, !0), setTimeout(
        () => {
          p(P, null);
        },
        1500
      );
    }, E = () => {
      const z = document.createElement("textarea");
      z.value = d, z.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(z), z.focus(), z.select();
      try {
        document.execCommand("copy"), m();
      } catch {
      }
      document.body.removeChild(z);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(m).catch(E) : E();
  }
  function Ki(d) {
    const h = [];
    for (const m of d) {
      if (!m || typeof m != "object") continue;
      const E = m;
      if (E.role && E.content != null) {
        h.push({ text: String(E.content), isUser: E.role === "user" });
        continue;
      }
      E.question != null && String(E.question).trim() && h.push({ text: String(E.question), isUser: !0 }), E.response != null && String(E.response).trim() && h.push({ text: String(E.response), isUser: !1 });
    }
    return h;
  }
  function $i(d) {
    if (!d) return "";
    let h = d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return h = h.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), h;
  }
  function Cs() {
    if (o(k)) {
      o(k).style.height = "auto";
      const d = Math.max(40, Math.min(o(k).scrollHeight, 120));
      o(k).style.height = d + "px";
    }
  }
  function Ji(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), on()), setTimeout(Cs, 0);
  }
  function Xi(d) {
    p(r, d, !0), on();
  }
  function Qi(d) {
    p(T, d, !0), p(s, [], !0), ss();
  }
  ps(() => () => {
    vr?.(), pr?.(), Xe?.(), lt?.(), window.__chatVpCleanup?.();
  });
  var wr = un(), Zi = jt(wr);
  {
    var eo = (d) => {
      var h = Xa(), m = M(y(h), 2), E = y(m), z = M(m, 2), Re = M(y(z), 4);
      {
        var zn = ($) => {
          var x = Ya();
          vn(x, 21, () => o(b), dn, (F, Y) => {
            var q = qa(), K = y(q), se = y(K), H = M(K, 2), U = y(H);
            he(() => {
              Ft(q, 1, `settings-assistant-btn ${o(rn) === o(Y).id || !o(rn) && o(b)[0].id === o(Y).id ? "selected" : ""}`, "svelte-beco3k"), pe(se, o(Y).emoji), pe(U, o(Y).name);
            }), Z("click", q, () => p(rn, o(Y).id, !0)), S(F, q);
          }), S($, x);
        }, me = ($) => {
          var x = Ga();
          S($, x);
        };
        B(Re, ($) => {
          o(b).length > 0 ? $(zn) : $(me, -1);
        });
      }
      var yt = M(z, 2), an = M(y(yt), 2), fe = M(y(an), 2), Te = M(an, 2), ln = M(y(Te), 2), cn = M(yt, 2);
      {
        var ct = ($) => {
          var x = Ja(), F = M(y(x), 2);
          {
            var Y = (O) => {
              var j = Ka();
              vn(j, 21, () => o(Le), dn, (de, Ae) => {
                var ft = Wa(), Ce = y(ft), ze = y(Ce), re = y(ze), le = M(ze, 2), ve = y(le), Dt = M(Ce, 2);
                he(
                  (ut) => {
                    pe(re, o(Ae).title), pe(ve, `${ut ?? ""} · ${o(Ae).message_count ?? ""} message${o(Ae).message_count === 1 ? "" : "s"}`);
                  },
                  [() => kr(o(Ae).updated_at)]
                ), Z("click", Dt, (ut) => _r(o(Ae).conversation_id, ut)), S(de, ft);
              }), S(O, j);
            }, q = (O) => {
              var j = $a(), de = y(j);
              he(() => pe(de, o(es) ? "Loading…" : "No conversations yet.")), S(O, j);
            };
            B(F, (O) => {
              o(Le).length > 0 ? O(Y) : O(q, -1);
            });
          }
          var K = M(F, 2), se = y(K);
          {
            var H = (O) => {
              var j = fn("✓ History cleared");
              S(O, j);
            }, U = (O) => {
              var j = fn("Clearing…");
              S(O, j);
            }, J = (O) => {
              var j = fn("Clear all history");
              S(O, j);
            };
            B(se, (O) => {
              o(Ss) ? O(H) : o(ns) ? O(U, 1) : O(J, -1);
            });
          }
          he(() => K.disabled = o(ns) || o(Le).length === 0), Z("click", K, Ui), S($, x);
        };
        B(cn, ($) => {
          o(xt) && $(ct);
        });
      }
      var Rt = M(cn, 2), Dn = M(y(Rt), 4), rs = M(y(Dn), 2), Ms = y(rs);
      {
        var zt = ($) => {
          var x = fn("● Online");
          S($, x);
        }, On = ($) => {
          var x = fn("● Offline");
          S($, x);
        }, Ps = ($) => {
          var x = fn("Checking…");
          S($, x);
        };
        B(Ms, ($) => {
          o(Rn) === "online" ? $(zt) : o(Rn) === "offline" ? $(On, 1) : $(Ps, -1);
        });
      }
      var Is = M(Dn, 2);
      he(() => {
        pe(E, Va), Ft(fe, 1, `settings-switch ${o(Lt) ? "on" : ""}`, "svelte-beco3k"), os(fe, "aria-checked", o(Lt)), Ft(ln, 1, `settings-switch ${o(Ln) ? "on" : ""}`, "svelte-beco3k"), os(ln, "aria-checked", o(Ln)), Ft(rs, 1, `settings-api-status ${o(Rn) ?? ""}`, "svelte-beco3k");
      }), Z("click", fe, () => p(Lt, !o(Lt))), Z("click", ln, () => p(Ln, !o(Ln))), Z("click", Is, gr), S(d, h);
    }, to = (d) => {
      var h = Cl();
      let m;
      var E = y(h);
      {
        var z = (x) => {
          var F = Qa(), Y = y(F), q = M(Y, 2);
          he(() => Ft(q, 1, `toolbar-btn ${o(Qe) ? "active" : ""}`, "svelte-beco3k")), Z("click", Y, Yi), Z("click", q, function(...K) {
            (o(Qe) ? () => p(Qe, !1) : Gi)?.apply(this, K);
          }), S(x, F);
        };
        B(E, (x) => {
          o(xt) && x(z);
        });
      }
      var Re = M(E, 2);
      {
        var zn = (x) => {
          var F = Za(), Y = y(F), q = y(Y), K = M(Y, 2);
          he(() => {
            os(Y, "title", o(ae).uri), pe(q, o(ae).label);
          }), Z("click", K, Ri), S(x, F);
        };
        B(Re, (x) => {
          sn && o(ae)?.label && x(zn);
        });
      }
      var me = M(Re, 2);
      {
        var yt = (x) => {
          var F = tl();
          vn(F, 21, () => o(b), dn, (Y, q) => {
            var K = el(), se = y(K), H = y(se), U = M(se, 2), J = y(U);
            he(() => {
              Ft(K, 1, `assistant-btn ${o(T)?.id === o(q).id ? "active" : ""}`, "svelte-beco3k"), os(K, "title", o(q).description), pe(H, o(q).emoji), pe(J, o(q).name);
            }), Z("click", K, () => Qi(o(q))), S(Y, K);
          }), S(x, F);
        };
        B(me, (x) => {
          o(b).length > 1 && x(yt);
        });
      }
      var an = M(me, 2);
      {
        var fe = (x) => {
          var F = il(), Y = y(F);
          {
            var q = (H) => {
              var U = nl();
              S(H, U);
            }, K = (H) => {
              var U = sl();
              S(H, U);
            }, se = (H) => {
              var U = un(), J = jt(U);
              vn(J, 17, () => o(Le), dn, (O, j) => {
                var de = rl(), Ae = y(de), ft = y(Ae), Ce = y(ft), ze = M(ft, 2), re = y(ze), le = M(Ae, 2);
                he(
                  (ve) => {
                    pe(Ce, o(j).title), pe(re, `${ve ?? ""} · ${o(j).message_count ?? ""} msg${o(j).message_count === 1 ? "" : "s"}`);
                  },
                  [() => kr(o(j).updated_at)]
                ), Z("click", de, () => br(o(j))), Z("keydown", de, (ve) => ve.key === "Enter" && br(o(j))), Z("click", le, (ve) => _r(o(j).conversation_id, ve)), S(O, de);
              }), S(H, U);
            };
            B(Y, (H) => {
              o(es) ? H(q) : o(Le).length === 0 ? H(K, 1) : H(se, -1);
            });
          }
          S(x, F);
        };
        B(an, (x) => {
          o(Qe) && x(fe);
        });
      }
      var Te = M(an, 2), ln = y(Te);
      {
        var cn = (x) => {
          var F = ll(), Y = y(F), q = y(Y);
          {
            var K = (H) => {
              var U = ol();
              S(H, U);
            }, se = (H) => {
              var U = al();
              S(H, U);
            };
            B(q, (H) => {
              o(xt) ? H(K) : H(se, -1);
            });
          }
          S(x, F);
        }, ct = (x) => {
          var F = xl(), Y = jt(F);
          vn(Y, 17, () => o(s), dn, (U, J, O) => {
            var j = un(), de = jt(j);
            {
              var Ae = (Ce) => {
                var ze = ul(), re = y(ze), le = y(re), ve = y(le);
                {
                  var Dt = (St) => {
                    var jn = cl();
                    S(St, jn);
                  }, ut = (St) => {
                    var jn = fl();
                    S(St, jn);
                  };
                  B(ve, (St) => {
                    o(P) === O ? St(Dt) : St(ut, -1);
                  });
                }
                var Ze = M(le, 2), Et = y(Ze);
                he(() => pe(Et, o(J).text)), Z("click", le, () => mr(o(J).text, O)), S(Ce, ze);
              }, ft = (Ce) => {
                var ze = hl(), re = y(ze), le = y(re), ve = y(le);
                {
                  var Dt = (we) => {
                    var dt = dl(), Ns = M(y(dt), 2), so = y(Ns);
                    he(() => pe(so, o(J).thinking)), S(we, dt);
                  };
                  B(ve, (we) => {
                    o(J).thinking && we(Dt);
                  });
                }
                var ut = M(ve, 2);
                {
                  var Ze = (we) => {
                    var dt = un(), Ns = jt(dt);
                    Na(Ns, () => $i(o(J).text)), S(we, dt);
                  };
                  B(ut, (we) => {
                    o(J).text && we(Ze);
                  });
                }
                var Et = M(le, 2), St = y(Et);
                {
                  var jn = (we) => {
                    var dt = vl();
                    S(we, dt);
                  }, no = (we) => {
                    var dt = pl();
                    S(we, dt);
                  };
                  B(St, (we) => {
                    o(P) === O ? we(jn) : we(no, -1);
                  });
                }
                Z("click", Et, () => mr(o(J).text, O)), S(Ce, ze);
              };
              B(de, (Ce) => {
                o(J).isUser ? Ce(Ae) : Ce(ft, -1);
              });
            }
            S(U, j);
          });
          var q = M(Y, 2);
          {
            var K = (U) => {
              var J = ml(), O = y(J), j = y(O);
              {
                var de = (re) => {
                  var le = un(), ve = jt(le);
                  {
                    var Dt = (Ze) => {
                      var Et = gl();
                      S(Ze, Et);
                    }, ut = (Ze) => {
                      var Et = bl();
                      S(Ze, Et);
                    };
                    B(ve, (Ze) => {
                      o(ne) ? Ze(Dt) : !o(a) && !o(c) && Ze(ut, 1);
                    });
                  }
                  S(re, le);
                };
                B(j, (re) => {
                  o(f) || re(de);
                });
              }
              var Ae = M(j, 2);
              {
                var ft = (re) => {
                  var le = _l(), ve = y(le);
                  he(() => pe(ve, o(c))), S(re, le);
                };
                B(Ae, (re) => {
                  o(c) && re(ft);
                });
              }
              var Ce = M(Ae, 2);
              {
                var ze = (re) => {
                  var le = kl();
                  S(re, le);
                };
                B(Ce, (re) => {
                  !o(f) && !o(c) && o(a) && !o(ne) && re(ze);
                });
              }
              S(U, J);
            };
            B(q, (U) => {
              o(i) && (!o(f) || o(c)) && U(K);
            });
          }
          var se = M(q, 2);
          {
            var H = (U) => {
              var J = wl(), O = y(J), j = y(O), de = M(O, 2);
              he(() => pe(j, o(u))), Z("click", de, qi), S(U, J);
            };
            B(se, (U) => {
              o(u) && U(H);
            });
          }
          S(x, F);
        };
        B(ln, (x) => {
          o(s).length === 0 && !o(ne) ? x(cn) : x(ct, -1);
        });
      }
      Os(Te, (x) => p(v, x), () => o(v));
      var Rt = M(Te, 2), Dn = y(Rt);
      {
        var rs = (x) => {
          var F = Sl(), Y = y(F);
          {
            var q = (se) => {
              var H = yl();
              S(se, H);
            }, K = (se) => {
              var H = un(), U = jt(H);
              vn(U, 17, () => o(w), dn, (J, O) => {
                var j = El(), de = y(j);
                he(() => pe(de, o(O))), Z("click", j, () => Xi(o(O))), S(J, j);
              }), S(se, H);
            };
            B(Y, (se) => {
              o(g) ? se(q) : se(K, -1);
            });
          }
          S(x, F);
        };
        B(Dn, (x) => {
          o(Lt) && (o(w).length > 0 || o(g)) && x(rs);
        });
      }
      var Ms = M(Dn, 2), zt = y(Ms);
      Os(zt, (x) => p(k, x), () => o(k));
      var On = M(zt, 2), Ps = y(On);
      {
        var Is = (x) => {
          var F = Tl();
          S(x, F);
        }, $ = (x) => {
          var F = Al();
          S(x, F);
        };
        B(Ps, (x) => {
          o(i) ? x(Is) : x($, -1);
        });
      }
      Os(h, (x) => p(te, x), () => o(te)), he(
        (x) => {
          m = Ft(h, 1, "llm-chat-root svelte-beco3k", null, m, { "sidebar-panel": sn }), Rr(h, sn ? void 0 : `height: ${o(W)}`), Rr(Te, o(Qe) ? "display:none" : ""), On.disabled = x;
        },
        [() => o(i) || !o(r).trim()]
      ), Z("keydown", zt, Ji), Z("input", zt, () => Cs()), Ha(zt, () => o(r), (x) => p(r, x)), Z("click", On, () => on()), S(d, h);
    };
    B(Zi, (d) => {
      sn ? d(to, -1) : d(eo);
    });
  }
  S(e, wr), Wr();
}
wa(["click", "keydown", "input"]);
function Ll(e, t) {
  const n = Sa(Pl, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Aa(n);
      } catch {
      }
    }
  };
}
export {
  Ll as default
};
