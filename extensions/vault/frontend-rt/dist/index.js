var Oo = Object.defineProperty;
var Wa = (e) => {
  throw TypeError(e);
};
var Po = (e, r, t) => r in e ? Oo(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var gt = (e, r, t) => Po(e, typeof r != "symbol" ? r + "" : r, t), Un = (e, r, t) => r.has(e) || Wa("Cannot " + t);
var f = (e, r, t) => (Un(e, r, "read from private field"), t ? t.call(e) : r.get(e)), q = (e, r, t) => r.has(e) ? Wa("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), X = (e, r, t, n) => (Un(e, r, "write to private field"), n ? n.call(e, t) : r.set(e, t), t), he = (e, r, t) => (Un(e, r, "access private method"), t);
var ua = Array.isArray, jo = Array.prototype.indexOf, Nr = Array.prototype.includes, En = Array.from, Vo = Object.defineProperty, Ur = Object.getOwnPropertyDescriptor, Bo = Object.getOwnPropertyDescriptors, qo = Object.prototype, Ho = Array.prototype, oi = Object.getPrototypeOf, Ya = Object.isExtensible;
const zo = () => {
};
function Uo(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function si() {
  var e, r, t = new Promise((n, i) => {
    e = n, r = i;
  });
  return { promise: t, resolve: e, reject: r };
}
const He = 2, Rr = 4, Sn = 8, li = 1 << 24, Tt = 16, bt = 32, Jt = 64, Xn = 128, ct = 512, Ie = 1024, qe = 2048, Mt = 4096, Ye = 8192, vt = 16384, xr = 32768, Ga = 1 << 25, pr = 65536, Zn = 1 << 17, Wo = 1 << 18, Fr = 1 << 19, Yo = 1 << 20, At = 1 << 25, hr = 65536, Qn = 1 << 21, Jr = 1 << 22, Yt = 1 << 23, Wr = Symbol("$state"), Ft = new class extends Error {
  constructor() {
    super(...arguments);
    gt(this, "name", "StaleReactionError");
    gt(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Go(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Ko() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Jo(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Xo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Zo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Qo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function $o() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function es() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function ts() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function rs() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function ns() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const as = 1, is = 2, fi = 4, os = 8, ss = 16, ls = 1, fs = 2, je = Symbol(), ui = "http://www.w3.org/1999/xhtml";
function us() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function ds() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function cs() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function di(e) {
  return e === this.v;
}
function vs(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function ci(e) {
  return !vs(e, this.v);
}
let it = null;
function Cr(e) {
  it = e;
}
function vi(e, r = !1, t) {
  it = {
    p: it,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      re
    ),
    l: null
  };
}
function _i(e) {
  var r = (
    /** @type {ComponentContext} */
    it
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var n of t)
      Ii(n);
  }
  return r.i = !0, it = r.p, /** @type {T} */
  {};
}
function pi() {
  return !0;
}
let ar = [];
function hi() {
  var e = ar;
  ar = [], Uo(e);
}
function Gt(e) {
  if (ar.length === 0 && !Yr) {
    var r = ar;
    queueMicrotask(() => {
      r === ar && hi();
    });
  }
  ar.push(e);
}
function _s() {
  for (; ar.length > 0; )
    hi();
}
function gi(e) {
  var r = re;
  if (r === null)
    return Z.f |= Yt, e;
  if ((r.f & xr) === 0 && (r.f & Rr) === 0)
    throw e;
  Wt(e, r);
}
function Wt(e, r) {
  for (; r !== null; ) {
    if ((r.f & Xn) !== 0) {
      if ((r.f & xr) === 0)
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
const ps = -7169;
function Ae(e, r) {
  e.f = e.f & ps | r;
}
function da(e) {
  (e.f & ct) !== 0 || e.deps === null ? Ae(e, Ie) : Ae(e, Mt);
}
function mi(e) {
  if (e !== null)
    for (const r of e)
      (r.f & He) === 0 || (r.f & hr) === 0 || (r.f ^= hr, mi(
        /** @type {Derived} */
        r.deps
      ));
}
function xi(e, r, t) {
  (e.f & qe) !== 0 ? r.add(e) : (e.f & Mt) !== 0 && t.add(e), mi(e.deps), Ae(e, Ie);
}
const nr = /* @__PURE__ */ new Set();
let V = null, xt = null, $n = null, Yr = !1, Wn = !1, wr = null, cn = null;
var Ka = 0;
let hs = 1;
var Er, Sr, sr, Ot, wt, Zr, rt, Qr, zt, Pt, Et, Ar, Tr, lr, Ne, vn, yi, _n, ea, pn, gs;
const bn = class bn {
  constructor() {
    q(this, Ne);
    gt(this, "id", hs++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    gt(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    gt(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    q(this, Er, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    q(this, Sr, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    q(this, sr, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    q(this, Ot, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    q(this, wt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    q(this, Zr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    q(this, rt, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    q(this, Qr, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    q(this, zt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    q(this, Pt, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    q(this, Et, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    q(this, Ar, /* @__PURE__ */ new Set());
    gt(this, "is_fork", !1);
    q(this, Tr, !1);
    /** @type {Set<Batch>} */
    q(this, lr, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    f(this, Et).has(r) || f(this, Et).set(r, { d: [], m: [] }), f(this, Ar).delete(r);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(r, t = (n) => this.schedule(n)) {
    var n = f(this, Et).get(r);
    if (n) {
      f(this, Et).delete(r);
      for (var i of n.d)
        Ae(i, qe), t(i);
      for (i of n.m)
        Ae(i, Mt), t(i);
    }
    f(this, Ar).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, n = !1) {
    r.v !== je && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & Yt) === 0 && (this.current.set(r, [t, n]), xt?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    V = this;
  }
  deactivate() {
    V = null, xt = null;
  }
  flush() {
    try {
      Wn = !0, V = this, he(this, Ne, _n).call(this);
    } finally {
      Ka = 0, $n = null, wr = null, cn = null, Wn = !1, V = null, xt = null, cr.clear();
    }
  }
  discard() {
    for (const r of f(this, Sr)) r(this);
    f(this, Sr).clear(), f(this, sr).clear(), nr.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    f(this, Qr).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    let n = f(this, Ot).get(t) ?? 0;
    if (f(this, Ot).set(t, n + 1), r) {
      let i = f(this, wt).get(t) ?? 0;
      f(this, wt).set(t, i + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(r, t, n) {
    let i = f(this, Ot).get(t) ?? 0;
    if (i === 1 ? f(this, Ot).delete(t) : f(this, Ot).set(t, i - 1), r) {
      let o = f(this, wt).get(t) ?? 0;
      o === 1 ? f(this, wt).delete(t) : f(this, wt).set(t, o - 1);
    }
    f(this, Tr) || n || (X(this, Tr, !0), Gt(() => {
      X(this, Tr, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(r, t) {
    for (const n of r)
      f(this, zt).add(n);
    for (const n of t)
      f(this, Pt).add(n);
    r.clear(), t.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(r) {
    f(this, Er).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    f(this, Sr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(r) {
    f(this, sr).add(r);
  }
  run_fork_commit_callbacks() {
    for (const r of f(this, sr)) r(this);
    f(this, sr).clear();
  }
  settled() {
    return (f(this, Zr) ?? X(this, Zr, si())).promise;
  }
  static ensure() {
    if (V === null) {
      const r = V = new bn();
      Wn || (nr.add(V), Yr || Gt(() => {
        V === r && r.flush();
      }));
    }
    return V;
  }
  apply() {
    {
      xt = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if ($n = r, r.b?.is_pending && (r.f & (Rr | Sn | li)) !== 0 && (r.f & xr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var n = t.f;
      if (wr !== null && t === re && (Z === null || (Z.f & He) === 0))
        return;
      if ((n & (Jt | bt)) !== 0) {
        if ((n & Ie) === 0)
          return;
        t.f ^= Ie;
      }
    }
    f(this, rt).push(t);
  }
};
Er = new WeakMap(), Sr = new WeakMap(), sr = new WeakMap(), Ot = new WeakMap(), wt = new WeakMap(), Zr = new WeakMap(), rt = new WeakMap(), Qr = new WeakMap(), zt = new WeakMap(), Pt = new WeakMap(), Et = new WeakMap(), Ar = new WeakMap(), Tr = new WeakMap(), lr = new WeakMap(), Ne = new WeakSet(), vn = function() {
  return this.is_fork || f(this, wt).size > 0;
}, yi = function() {
  for (const n of f(this, lr))
    for (const i of f(n, wt).keys()) {
      for (var r = !1, t = i; t.parent !== null; ) {
        if (f(this, Et).has(t)) {
          r = !0;
          break;
        }
        t = t.parent;
      }
      if (!r)
        return !0;
    }
  return !1;
}, _n = function() {
  var _;
  if (Ka++ > 1e3 && (nr.delete(this), xs()), !he(this, Ne, vn).call(this)) {
    for (const s of f(this, zt))
      f(this, Pt).delete(s), Ae(s, qe), this.schedule(s);
    for (const s of f(this, Pt))
      Ae(s, Mt), this.schedule(s);
  }
  const r = f(this, rt);
  X(this, rt, []), this.apply();
  var t = wr = [], n = [], i = cn = [];
  for (const s of r)
    try {
      he(this, Ne, ea).call(this, s, t, n);
    } catch (p) {
      throw wi(s), p;
    }
  if (V = null, i.length > 0) {
    var o = bn.ensure();
    for (const s of i)
      o.schedule(s);
  }
  if (wr = null, cn = null, he(this, Ne, vn).call(this) || he(this, Ne, yi).call(this)) {
    he(this, Ne, pn).call(this, n), he(this, Ne, pn).call(this, t);
    for (const [s, p] of f(this, Et))
      ki(s, p);
  } else {
    f(this, Ot).size === 0 && nr.delete(this), f(this, zt).clear(), f(this, Pt).clear();
    for (const s of f(this, Er)) s(this);
    f(this, Er).clear(), Ja(n), Ja(t), f(this, Zr)?.resolve();
  }
  var c = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    V
  );
  if (f(this, rt).length > 0) {
    const s = c ?? (c = this);
    f(s, rt).push(...f(this, rt).filter((p) => !f(s, rt).includes(p)));
  }
  c !== null && (nr.add(c), he(_ = c, Ne, _n).call(_));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
ea = function(r, t, n) {
  r.f ^= Ie;
  for (var i = r.first; i !== null; ) {
    var o = i.f, c = (o & (bt | Jt)) !== 0, _ = c && (o & Ie) !== 0, s = _ || (o & Ye) !== 0 || f(this, Et).has(i);
    if (!s && i.fn !== null) {
      c ? i.f ^= Ie : (o & Rr) !== 0 ? t.push(i) : an(i) && ((o & Tt) !== 0 && f(this, Pt).add(i), Ir(i));
      var p = i.first;
      if (p !== null) {
        i = p;
        continue;
      }
    }
    for (; i !== null; ) {
      var m = i.next;
      if (m !== null) {
        i = m;
        break;
      }
      i = i.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
pn = function(r) {
  for (var t = 0; t < r.length; t += 1)
    xi(r[t], f(this, zt), f(this, Pt));
}, gs = function() {
  var m, R, w;
  for (const y of nr) {
    var r = y.id < this.id, t = [];
    for (const [b, [W, k]] of this.current) {
      if (y.current.has(b)) {
        var n = (
          /** @type {[any, boolean]} */
          y.current.get(b)[0]
        );
        if (r && W !== n)
          y.current.set(b, [W, k]);
        else
          continue;
      }
      t.push(b);
    }
    var i = [...y.current.keys()].filter((b) => !this.current.has(b));
    if (i.length === 0)
      r && y.discard();
    else if (t.length > 0) {
      if (r)
        for (const b of f(this, Ar))
          y.unskip_effect(b, (W) => {
            var k;
            (W.f & (Tt | Jr)) !== 0 ? y.schedule(W) : he(k = y, Ne, pn).call(k, [W]);
          });
      y.activate();
      var o = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
      for (var _ of t)
        bi(_, i, o, c);
      c = /* @__PURE__ */ new Map();
      var s = [...y.current.keys()].filter(
        (b) => this.current.has(b) ? (
          /** @type {[any, boolean]} */
          this.current.get(b)[0] !== b
        ) : !0
      );
      for (const b of f(this, Qr))
        (b.f & (vt | Ye | Zn)) === 0 && ca(b, s, c) && ((b.f & (Jr | Tt)) !== 0 ? (Ae(b, qe), y.schedule(b)) : f(y, zt).add(b));
      if (f(y, rt).length > 0) {
        y.apply();
        for (var p of f(y, rt))
          he(m = y, Ne, ea).call(m, p, [], []);
        X(y, rt, []);
      }
      y.deactivate();
    }
  }
  for (const y of nr)
    f(y, lr).has(this) && (f(y, lr).delete(this), f(y, lr).size === 0 && !he(R = y, Ne, vn).call(R) && (y.activate(), he(w = y, Ne, _n).call(w)));
};
let gr = bn;
function ms(e) {
  var r = Yr;
  Yr = !0;
  try {
    for (var t; ; ) {
      if (_s(), V === null)
        return (
          /** @type {T} */
          t
        );
      V.flush();
    }
  } finally {
    Yr = r;
  }
}
function xs() {
  try {
    $o();
  } catch (e) {
    Wt(e, $n);
  }
}
let It = null;
function Ja(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var n = e[t++];
      if ((n.f & (vt | Ye)) === 0 && an(n) && (It = /* @__PURE__ */ new Set(), Ir(n), n.deps === null && n.first === null && n.nodes === null && n.teardown === null && n.ac === null && Pi(n), It?.size > 0)) {
        cr.clear();
        for (const i of It) {
          if ((i.f & (vt | Ye)) !== 0) continue;
          const o = [i];
          let c = i.parent;
          for (; c !== null; )
            It.has(c) && (It.delete(c), o.push(c)), c = c.parent;
          for (let _ = o.length - 1; _ >= 0; _--) {
            const s = o[_];
            (s.f & (vt | Ye)) === 0 && Ir(s);
          }
        }
        It.clear();
      }
    }
    It = null;
  }
}
function bi(e, r, t, n) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & He) !== 0 ? bi(
        /** @type {Derived} */
        i,
        r,
        t,
        n
      ) : (o & (Jr | Tt)) !== 0 && (o & qe) === 0 && ca(i, r, n) && (Ae(i, qe), va(
        /** @type {Effect} */
        i
      ));
    }
}
function ca(e, r, t) {
  const n = t.get(e);
  if (n !== void 0) return n;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (Nr.call(r, i))
        return !0;
      if ((i.f & He) !== 0 && ca(
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
function va(e) {
  V.schedule(e);
}
function ki(e, r) {
  if (!((e.f & bt) !== 0 && (e.f & Ie) !== 0)) {
    (e.f & qe) !== 0 ? r.d.push(e) : (e.f & Mt) !== 0 && r.m.push(e), Ae(e, Ie);
    for (var t = e.first; t !== null; )
      ki(t, r), t = t.next;
  }
}
function wi(e) {
  Ae(e, Ie);
  for (var r = e.first; r !== null; )
    wi(r), r = r.next;
}
function ys(e) {
  let r = 0, t = mr(0), n;
  return () => {
    ha() && (a(t), Fi(() => (r === 0 && (n = ba(() => e(() => Gr(t)))), r += 1, () => {
      Gt(() => {
        r -= 1, r === 0 && (n?.(), n = void 0, Gr(t));
      });
    })));
  };
}
var bs = pr | Fr;
function ks(e, r, t, n) {
  new ws(e, r, t, n);
}
var lt, fa, ft, fr, Ke, ut, We, nt, jt, ur, Ut, Mr, $r, en, Vt, kn, Ee, Es, Ss, As, ta, hn, gn, ra, na;
class ws {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, n, i) {
    q(this, Ee);
    /** @type {Boundary | null} */
    gt(this, "parent");
    gt(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    gt(this, "transform_error");
    /** @type {TemplateNode} */
    q(this, lt);
    /** @type {TemplateNode | null} */
    q(this, fa, null);
    /** @type {BoundaryProps} */
    q(this, ft);
    /** @type {((anchor: Node) => void)} */
    q(this, fr);
    /** @type {Effect} */
    q(this, Ke);
    /** @type {Effect | null} */
    q(this, ut, null);
    /** @type {Effect | null} */
    q(this, We, null);
    /** @type {Effect | null} */
    q(this, nt, null);
    /** @type {DocumentFragment | null} */
    q(this, jt, null);
    q(this, ur, 0);
    q(this, Ut, 0);
    q(this, Mr, !1);
    /** @type {Set<Effect>} */
    q(this, $r, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    q(this, en, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    q(this, Vt, null);
    q(this, kn, ys(() => (X(this, Vt, mr(f(this, ur))), () => {
      X(this, Vt, null);
    })));
    X(this, lt, r), X(this, ft, t), X(this, fr, (o) => {
      var c = (
        /** @type {Effect} */
        re
      );
      c.b = this, c.f |= Xn, n(o);
    }), this.parent = /** @type {Effect} */
    re.b, this.transform_error = i ?? this.parent?.transform_error ?? ((o) => o), X(this, Ke, Tn(() => {
      he(this, Ee, ta).call(this);
    }, bs));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    xi(r, f(this, $r), f(this, en));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!f(this, ft).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    he(this, Ee, ra).call(this, r, t), X(this, ur, f(this, ur) + r), !(!f(this, Vt) || f(this, Mr)) && (X(this, Mr, !0), Gt(() => {
      X(this, Mr, !1), f(this, Vt) && Dr(f(this, Vt), f(this, ur));
    }));
  }
  get_effect_pending() {
    return f(this, kn).call(this), a(
      /** @type {Source<number>} */
      f(this, Vt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!f(this, ft).onerror && !f(this, ft).failed)
      throw r;
    V?.is_fork ? (f(this, ut) && V.skip_effect(f(this, ut)), f(this, We) && V.skip_effect(f(this, We)), f(this, nt) && V.skip_effect(f(this, nt)), V.on_fork_commit(() => {
      he(this, Ee, na).call(this, r);
    })) : he(this, Ee, na).call(this, r);
  }
}
lt = new WeakMap(), fa = new WeakMap(), ft = new WeakMap(), fr = new WeakMap(), Ke = new WeakMap(), ut = new WeakMap(), We = new WeakMap(), nt = new WeakMap(), jt = new WeakMap(), ur = new WeakMap(), Ut = new WeakMap(), Mr = new WeakMap(), $r = new WeakMap(), en = new WeakMap(), Vt = new WeakMap(), kn = new WeakMap(), Ee = new WeakSet(), Es = function() {
  try {
    X(this, ut, dt(() => f(this, fr).call(this, f(this, lt))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Ss = function(r) {
  const t = f(this, ft).failed;
  t && X(this, nt, dt(() => {
    t(
      f(this, lt),
      () => r,
      () => () => {
      }
    );
  }));
}, As = function() {
  const r = f(this, ft).pending;
  r && (this.is_pending = !0, X(this, We, dt(() => r(f(this, lt)))), Gt(() => {
    var t = X(this, jt, document.createDocumentFragment()), n = Kt();
    t.append(n), X(this, ut, he(this, Ee, gn).call(this, () => dt(() => f(this, fr).call(this, n)))), f(this, Ut) === 0 && (f(this, lt).before(t), X(this, jt, null), vr(
      /** @type {Effect} */
      f(this, We),
      () => {
        X(this, We, null);
      }
    ), he(this, Ee, hn).call(
      this,
      /** @type {Batch} */
      V
    ));
  }));
}, ta = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), X(this, Ut, 0), X(this, ur, 0), X(this, ut, dt(() => {
      f(this, fr).call(this, f(this, lt));
    })), f(this, Ut) > 0) {
      var r = X(this, jt, document.createDocumentFragment());
      ya(f(this, ut), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        f(this, ft).pending
      );
      X(this, We, dt(() => t(f(this, lt))));
    } else
      he(this, Ee, hn).call(
        this,
        /** @type {Batch} */
        V
      );
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {Batch} batch
 */
hn = function(r) {
  this.is_pending = !1, r.transfer_effects(f(this, $r), f(this, en));
}, /**
 * @template T
 * @param {() => T} fn
 */
gn = function(r) {
  var t = re, n = Z, i = it;
  Nt(f(this, Ke)), pt(f(this, Ke)), Cr(f(this, Ke).ctx);
  try {
    return gr.ensure(), r();
  } catch (o) {
    return gi(o), null;
  } finally {
    Nt(t), pt(n), Cr(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
ra = function(r, t) {
  var n;
  if (!this.has_pending_snippet()) {
    this.parent && he(n = this.parent, Ee, ra).call(n, r, t);
    return;
  }
  X(this, Ut, f(this, Ut) + r), f(this, Ut) === 0 && (he(this, Ee, hn).call(this, t), f(this, We) && vr(f(this, We), () => {
    X(this, We, null);
  }), f(this, jt) && (f(this, lt).before(f(this, jt)), X(this, jt, null)));
}, /**
 * @param {unknown} error
 */
na = function(r) {
  f(this, ut) && (Ze(f(this, ut)), X(this, ut, null)), f(this, We) && (Ze(f(this, We)), X(this, We, null)), f(this, nt) && (Ze(f(this, nt)), X(this, nt, null));
  var t = f(this, ft).onerror;
  let n = f(this, ft).failed;
  var i = !1, o = !1;
  const c = () => {
    if (i) {
      cs();
      return;
    }
    i = !0, o && ns(), f(this, nt) !== null && vr(f(this, nt), () => {
      X(this, nt, null);
    }), he(this, Ee, gn).call(this, () => {
      he(this, Ee, ta).call(this);
    });
  }, _ = (s) => {
    try {
      o = !0, t?.(s, c), o = !1;
    } catch (p) {
      Wt(p, f(this, Ke) && f(this, Ke).parent);
    }
    n && X(this, nt, he(this, Ee, gn).call(this, () => {
      try {
        return dt(() => {
          var p = (
            /** @type {Effect} */
            re
          );
          p.b = this, p.f |= Xn, n(
            f(this, lt),
            () => s,
            () => c
          );
        });
      } catch (p) {
        return Wt(
          p,
          /** @type {Effect} */
          f(this, Ke).parent
        ), null;
      }
    }));
  };
  Gt(() => {
    var s;
    try {
      s = this.transform_error(r);
    } catch (p) {
      Wt(p, f(this, Ke) && f(this, Ke).parent);
      return;
    }
    s !== null && typeof s == "object" && typeof /** @type {any} */
    s.then == "function" ? s.then(
      _,
      /** @param {unknown} e */
      (p) => Wt(p, f(this, Ke) && f(this, Ke).parent)
    ) : _(s);
  });
};
function Ts(e, r, t, n) {
  const i = _a;
  var o = e.filter((w) => !w.settled);
  if (t.length === 0 && o.length === 0) {
    n(r.map(i));
    return;
  }
  var c = (
    /** @type {Effect} */
    re
  ), _ = Ms(), s = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((w) => w.promise)) : null;
  function p(w) {
    _();
    try {
      n(w);
    } catch (y) {
      (c.f & vt) === 0 && Wt(y, c);
    }
    xn();
  }
  if (t.length === 0) {
    s.then(() => p(r.map(i)));
    return;
  }
  var m = Ei();
  function R() {
    Promise.all(t.map((w) => /* @__PURE__ */ Ns(w))).then((w) => p([...r.map(i), ...w])).catch((w) => Wt(w, c)).finally(() => m());
  }
  s ? s.then(() => {
    _(), R(), xn();
  }) : R();
}
function Ms() {
  var e = (
    /** @type {Effect} */
    re
  ), r = Z, t = it, n = (
    /** @type {Batch} */
    V
  );
  return function(o = !0) {
    Nt(e), pt(r), Cr(t), o && (e.f & vt) === 0 && (n?.activate(), n?.apply());
  };
}
function xn(e = !0) {
  Nt(null), pt(null), Cr(null), e && V?.deactivate();
}
function Ei() {
  var e = (
    /** @type {Effect} */
    re
  ), r = (
    /** @type {Boundary} */
    e.b
  ), t = (
    /** @type {Batch} */
    V
  ), n = r.is_rendered();
  return r.update_pending_count(1, t), t.increment(n, e), (i = !1) => {
    r.update_pending_count(-1, t), t.decrement(n, e, i);
  };
}
// @__NO_SIDE_EFFECTS__
function _a(e) {
  var r = He | qe;
  return re !== null && (re.f |= Fr), {
    ctx: it,
    deps: null,
    effects: null,
    equals: di,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      je
    ),
    wv: 0,
    parent: re,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function Ns(e, r, t) {
  let n = (
    /** @type {Effect | null} */
    re
  );
  n === null && Ko();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = mr(
    /** @type {V} */
    je
  ), c = !Z, _ = /* @__PURE__ */ new Map();
  return Ws(() => {
    var s = (
      /** @type {Effect} */
      re
    ), p = si();
    i = p.promise;
    try {
      Promise.resolve(e()).then(p.resolve, p.reject).finally(xn);
    } catch (y) {
      p.reject(y), xn();
    }
    var m = (
      /** @type {Batch} */
      V
    );
    if (c) {
      if ((s.f & xr) !== 0)
        var R = Ei();
      if (
        /** @type {Boundary} */
        n.b.is_rendered()
      )
        _.get(m)?.reject(Ft), _.delete(m);
      else {
        for (const y of _.values())
          y.reject(Ft);
        _.clear();
      }
      _.set(m, p);
    }
    const w = (y, b = void 0) => {
      if (R) {
        var W = b === Ft;
        R(W);
      }
      if (!(b === Ft || (s.f & vt) !== 0)) {
        if (m.activate(), b)
          o.f |= Yt, Dr(o, b);
        else {
          (o.f & Yt) !== 0 && (o.f ^= Yt), Dr(o, y);
          for (const [k, Y] of _) {
            if (_.delete(k), k === m) break;
            Y.reject(Ft);
          }
        }
        m.deactivate();
      }
    };
    p.promise.then(w, (y) => w(null, y || "unknown"));
  }), ga(() => {
    for (const s of _.values())
      s.reject(Ft);
  }), new Promise((s) => {
    function p(m) {
      function R() {
        m === i ? s(o) : p(i);
      }
      m.then(R, R);
    }
    p(i);
  });
}
// @__NO_SIDE_EFFECTS__
function ee(e) {
  const r = /* @__PURE__ */ _a(e);
  return Bi(r), r;
}
// @__NO_SIDE_EFFECTS__
function Rs(e) {
  const r = /* @__PURE__ */ _a(e);
  return r.equals = ci, r;
}
function Cs(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      Ze(
        /** @type {Effect} */
        r[t]
      );
  }
}
function pa(e) {
  var r, t = re, n = e.parent;
  if (!Xt && n !== null && (n.f & (vt | Ye)) !== 0)
    return us(), e.v;
  Nt(n);
  try {
    e.f &= ~hr, Cs(e), r = Ui(e);
  } finally {
    Nt(t);
  }
  return r;
}
function Si(e) {
  var r = pa(e);
  if (!e.equals(r) && (e.wv = Hi(), (!V?.is_fork || e.deps === null) && (V !== null ? V.capture(e, r, !0) : e.v = r, e.deps === null))) {
    Ae(e, Ie);
    return;
  }
  Xt || (xt !== null ? (ha() || V?.is_fork) && xt.set(e, r) : da(e));
}
function Ds(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(Ft), r.teardown = zo, r.ac = null, Xr(r, 0), ma(r));
}
function Ai(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && Ir(r);
}
let aa = /* @__PURE__ */ new Set();
const cr = /* @__PURE__ */ new Map();
let Ti = !1;
function mr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: di,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function se(e, r) {
  const t = mr(e);
  return Bi(t), t;
}
// @__NO_SIDE_EFFECTS__
function Ls(e, r = !1, t = !0) {
  const n = mr(e);
  return r || (n.equals = ci), n;
}
function L(e, r, t = !1) {
  Z !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!yt || (Z.f & Zn) !== 0) && pi() && (Z.f & (He | Tt | Jr | Zn)) !== 0 && (_t === null || !Nr.call(_t, e)) && rs();
  let n = t ? Je(r) : r;
  return Dr(e, n, cn);
}
function Dr(e, r, t = null) {
  if (!e.equals(r)) {
    cr.set(e, Xt ? r : e.v);
    var n = gr.ensure();
    if (n.capture(e, r), (e.f & He) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & qe) !== 0 && pa(i), xt === null && da(i);
    }
    e.wv = Hi(), Mi(e, qe, t), re !== null && (re.f & Ie) !== 0 && (re.f & (bt | Jt)) === 0 && (st === null ? Ks([e]) : st.push(e)), !n.is_fork && aa.size > 0 && !Ti && Is();
  }
  return r;
}
function Is() {
  Ti = !1;
  for (const e of aa)
    (e.f & Ie) !== 0 && Ae(e, Mt), an(e) && Ir(e);
  aa.clear();
}
function Gr(e) {
  L(e, e.v + 1);
}
function Mi(e, r, t) {
  var n = e.reactions;
  if (n !== null)
    for (var i = n.length, o = 0; o < i; o++) {
      var c = n[o], _ = c.f, s = (_ & qe) === 0;
      if (s && Ae(c, r), (_ & He) !== 0) {
        var p = (
          /** @type {Derived} */
          c
        );
        xt?.delete(p), (_ & hr) === 0 && (_ & ct && (c.f |= hr), Mi(p, Mt, t));
      } else if (s) {
        var m = (
          /** @type {Effect} */
          c
        );
        (_ & Tt) !== 0 && It !== null && It.add(m), t !== null ? t.push(m) : va(m);
      }
    }
}
function Je(e) {
  if (typeof e != "object" || e === null || Wr in e)
    return e;
  const r = oi(e);
  if (r !== qo && r !== Ho)
    return e;
  var t = /* @__PURE__ */ new Map(), n = ua(e), i = /* @__PURE__ */ se(0), o = _r, c = (_) => {
    if (_r === o)
      return _();
    var s = Z, p = _r;
    pt(null), ei(o);
    var m = _();
    return pt(s), ei(p), m;
  };
  return n && t.set("length", /* @__PURE__ */ se(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(_, s, p) {
        (!("value" in p) || p.configurable === !1 || p.enumerable === !1 || p.writable === !1) && es();
        var m = t.get(s);
        return m === void 0 ? c(() => {
          var R = /* @__PURE__ */ se(p.value);
          return t.set(s, R), R;
        }) : L(m, p.value, !0), !0;
      },
      deleteProperty(_, s) {
        var p = t.get(s);
        if (p === void 0) {
          if (s in _) {
            const m = c(() => /* @__PURE__ */ se(je));
            t.set(s, m), Gr(i);
          }
        } else
          L(p, je), Gr(i);
        return !0;
      },
      get(_, s, p) {
        if (s === Wr)
          return e;
        var m = t.get(s), R = s in _;
        if (m === void 0 && (!R || Ur(_, s)?.writable) && (m = c(() => {
          var y = Je(R ? _[s] : je), b = /* @__PURE__ */ se(y);
          return b;
        }), t.set(s, m)), m !== void 0) {
          var w = a(m);
          return w === je ? void 0 : w;
        }
        return Reflect.get(_, s, p);
      },
      getOwnPropertyDescriptor(_, s) {
        var p = Reflect.getOwnPropertyDescriptor(_, s);
        if (p && "value" in p) {
          var m = t.get(s);
          m && (p.value = a(m));
        } else if (p === void 0) {
          var R = t.get(s), w = R?.v;
          if (R !== void 0 && w !== je)
            return {
              enumerable: !0,
              configurable: !0,
              value: w,
              writable: !0
            };
        }
        return p;
      },
      has(_, s) {
        if (s === Wr)
          return !0;
        var p = t.get(s), m = p !== void 0 && p.v !== je || Reflect.has(_, s);
        if (p !== void 0 || re !== null && (!m || Ur(_, s)?.writable)) {
          p === void 0 && (p = c(() => {
            var w = m ? Je(_[s]) : je, y = /* @__PURE__ */ se(w);
            return y;
          }), t.set(s, p));
          var R = a(p);
          if (R === je)
            return !1;
        }
        return m;
      },
      set(_, s, p, m) {
        var R = t.get(s), w = s in _;
        if (n && s === "length")
          for (var y = p; y < /** @type {Source<number>} */
          R.v; y += 1) {
            var b = t.get(y + "");
            b !== void 0 ? L(b, je) : y in _ && (b = c(() => /* @__PURE__ */ se(je)), t.set(y + "", b));
          }
        if (R === void 0)
          (!w || Ur(_, s)?.writable) && (R = c(() => /* @__PURE__ */ se(void 0)), L(R, Je(p)), t.set(s, R));
        else {
          w = R.v !== je;
          var W = c(() => Je(p));
          L(R, W);
        }
        var k = Reflect.getOwnPropertyDescriptor(_, s);
        if (k?.set && k.set.call(m, p), !w) {
          if (n && typeof s == "string") {
            var Y = (
              /** @type {Source<number>} */
              t.get("length")
            ), Fe = Number(s);
            Number.isInteger(Fe) && Fe >= Y.v && L(Y, Fe + 1);
          }
          Gr(i);
        }
        return !0;
      },
      ownKeys(_) {
        a(i);
        var s = Reflect.ownKeys(_).filter((R) => {
          var w = t.get(R);
          return w === void 0 || w.v !== je;
        });
        for (var [p, m] of t)
          m.v !== je && !(p in _) && s.push(p);
        return s;
      },
      setPrototypeOf() {
        ts();
      }
    }
  );
}
function Xa(e) {
  try {
    if (e !== null && typeof e == "object" && Wr in e)
      return e[Wr];
  } catch {
  }
  return e;
}
function Fs(e, r) {
  return Object.is(Xa(e), Xa(r));
}
var Za, Ni, Ri, Ci;
function Os() {
  if (Za === void 0) {
    Za = window, Ni = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    Ri = Ur(r, "firstChild").get, Ci = Ur(r, "nextSibling").get, Ya(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Ya(t) && (t.__t = void 0);
  }
}
function Kt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Lr(e) {
  return (
    /** @type {TemplateNode | null} */
    Ri.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function nn(e) {
  return (
    /** @type {TemplateNode | null} */
    Ci.call(e)
  );
}
function h(e, r) {
  return /* @__PURE__ */ Lr(e);
}
function kr(e, r = !1) {
  {
    var t = /* @__PURE__ */ Lr(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ nn(t) : t;
  }
}
function x(e, r = 1, t = !1) {
  let n = e;
  for (; r--; )
    n = /** @type {TemplateNode} */
    /* @__PURE__ */ nn(n);
  return n;
}
function Ps(e) {
  e.textContent = "";
}
function Di() {
  return !1;
}
function js(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(ui, e, void 0)
  );
}
let Qa = !1;
function Vs() {
  Qa || (Qa = !0, document.addEventListener(
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
  var r = Z, t = re;
  pt(null), Nt(null);
  try {
    return e();
  } finally {
    pt(r), Nt(t);
  }
}
function Li(e, r, t, n = t) {
  e.addEventListener(r, () => An(t));
  const i = e.__on_r;
  i ? e.__on_r = () => {
    i(), n(!0);
  } : e.__on_r = () => n(!0), Vs();
}
function Bs(e) {
  re === null && (Z === null && Qo(), Zo()), Xt && Xo();
}
function qs(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Bt(e, r) {
  var t = re;
  t !== null && (t.f & Ye) !== 0 && (e |= Ye);
  var n = {
    ctx: it,
    deps: null,
    nodes: null,
    f: e | qe | ct,
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
  V?.register_created_effect(n);
  var i = n;
  if ((e & Rr) !== 0)
    wr !== null ? wr.push(n) : gr.ensure().schedule(n);
  else if (r !== null) {
    try {
      Ir(n);
    } catch (c) {
      throw Ze(n), c;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Fr) === 0 && (i = i.first, (e & Tt) !== 0 && (e & pr) !== 0 && i !== null && (i.f |= pr));
  }
  if (i !== null && (i.parent = t, t !== null && qs(i, t), Z !== null && (Z.f & He) !== 0 && (e & Jt) === 0)) {
    var o = (
      /** @type {Derived} */
      Z
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return n;
}
function ha() {
  return Z !== null && !yt;
}
function ga(e) {
  const r = Bt(Sn, null);
  return Ae(r, Ie), r.teardown = e, r;
}
function Hs(e) {
  Bs();
  var r = (
    /** @type {Effect} */
    re.f
  ), t = !Z && (r & bt) !== 0 && (r & xr) === 0;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      it
    );
    (n.e ?? (n.e = [])).push(e);
  } else
    return Ii(e);
}
function Ii(e) {
  return Bt(Rr | Yo, e);
}
function zs(e) {
  gr.ensure();
  const r = Bt(Jt | Fr, e);
  return (t = {}) => new Promise((n) => {
    t.outro ? vr(r, () => {
      Ze(r), n(void 0);
    }) : (Ze(r), n(void 0));
  });
}
function Us(e) {
  return Bt(Rr, e);
}
function Ws(e) {
  return Bt(Jr | Fr, e);
}
function Fi(e, r = 0) {
  return Bt(Sn | r, e);
}
function M(e, r = [], t = [], n = []) {
  Ts(n, r, t, (i) => {
    Bt(Sn, () => e(...i.map(a)));
  });
}
function Tn(e, r = 0) {
  var t = Bt(Tt | r, e);
  return t;
}
function dt(e) {
  return Bt(bt | Fr, e);
}
function Oi(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = Xt, n = Z;
    $a(!0), pt(null);
    try {
      r.call(null);
    } finally {
      $a(t), pt(n);
    }
  }
}
function ma(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const i = t.ac;
    i !== null && An(() => {
      i.abort(Ft);
    });
    var n = t.next;
    (t.f & Jt) !== 0 ? t.parent = null : Ze(t, r), t = n;
  }
}
function Ys(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & bt) === 0 && Ze(r), r = t;
  }
}
function Ze(e, r = !0) {
  var t = !1;
  (r || (e.f & Wo) !== 0) && e.nodes !== null && e.nodes.end !== null && (Gs(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), Ae(e, Ga), ma(e, r && !t), Xr(e, 0);
  var n = e.nodes && e.nodes.t;
  if (n !== null)
    for (const o of n)
      o.stop();
  Oi(e), e.f ^= Ga, e.f |= vt;
  var i = e.parent;
  i !== null && i.first !== null && Pi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Gs(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ nn(e);
    e.remove(), e = t;
  }
}
function Pi(e) {
  var r = e.parent, t = e.prev, n = e.next;
  t !== null && (t.next = n), n !== null && (n.prev = t), r !== null && (r.first === e && (r.first = n), r.last === e && (r.last = t));
}
function vr(e, r, t = !0) {
  var n = [];
  ji(e, n, !0);
  var i = () => {
    t && Ze(e), r && r();
  }, o = n.length;
  if (o > 0) {
    var c = () => --o || i();
    for (var _ of n)
      _.out(c);
  } else
    i();
}
function ji(e, r, t) {
  if ((e.f & Ye) === 0) {
    e.f ^= Ye;
    var n = e.nodes && e.nodes.t;
    if (n !== null)
      for (const _ of n)
        (_.is_global || t) && r.push(_);
    for (var i = e.first; i !== null; ) {
      var o = i.next;
      if ((i.f & Jt) === 0) {
        var c = (i.f & pr) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (i.f & bt) !== 0 && (e.f & Tt) !== 0;
        ji(i, r, c ? t : !1);
      }
      i = o;
    }
  }
}
function xa(e) {
  Vi(e, !0);
}
function Vi(e, r) {
  if ((e.f & Ye) !== 0) {
    e.f ^= Ye, (e.f & Ie) === 0 && (Ae(e, qe), gr.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var n = t.next, i = (t.f & pr) !== 0 || (t.f & bt) !== 0;
      Vi(t, i ? r : !1), t = n;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const c of o)
        (c.is_global || r) && c.in();
  }
}
function ya(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, n = e.nodes.end; t !== null; ) {
      var i = t === n ? null : /* @__PURE__ */ nn(t);
      r.append(t), t = i;
    }
}
let mn = !1, Xt = !1;
function $a(e) {
  Xt = e;
}
let Z = null, yt = !1;
function pt(e) {
  Z = e;
}
let re = null;
function Nt(e) {
  re = e;
}
let _t = null;
function Bi(e) {
  Z !== null && (_t === null ? _t = [e] : _t.push(e));
}
let Xe = null, tt = 0, st = null;
function Ks(e) {
  st = e;
}
let qi = 1, ir = 0, _r = ir;
function ei(e) {
  _r = e;
}
function Hi() {
  return ++qi;
}
function an(e) {
  var r = e.f;
  if ((r & qe) !== 0)
    return !0;
  if (r & He && (e.f &= ~hr), (r & Mt) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), n = t.length, i = 0; i < n; i++) {
      var o = t[i];
      if (an(
        /** @type {Derived} */
        o
      ) && Si(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & ct) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    xt === null && Ae(e, Ie);
  }
  return !1;
}
function zi(e, r, t = !0) {
  var n = e.reactions;
  if (n !== null && !(_t !== null && Nr.call(_t, e)))
    for (var i = 0; i < n.length; i++) {
      var o = n[i];
      (o.f & He) !== 0 ? zi(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? Ae(o, qe) : (o.f & Ie) !== 0 && Ae(o, Mt), va(
        /** @type {Effect} */
        o
      ));
    }
}
function Ui(e) {
  var W;
  var r = Xe, t = tt, n = st, i = Z, o = _t, c = it, _ = yt, s = _r, p = e.f;
  Xe = /** @type {null | Value[]} */
  null, tt = 0, st = null, Z = (p & (bt | Jt)) === 0 ? e : null, _t = null, Cr(e.ctx), yt = !1, _r = ++ir, e.ac !== null && (An(() => {
    e.ac.abort(Ft);
  }), e.ac = null);
  try {
    e.f |= Qn;
    var m = (
      /** @type {Function} */
      e.fn
    ), R = m();
    e.f |= xr;
    var w = e.deps, y = V?.is_fork;
    if (Xe !== null) {
      var b;
      if (y || Xr(e, tt), w !== null && tt > 0)
        for (w.length = tt + Xe.length, b = 0; b < Xe.length; b++)
          w[tt + b] = Xe[b];
      else
        e.deps = w = Xe;
      if (ha() && (e.f & ct) !== 0)
        for (b = tt; b < w.length; b++)
          ((W = w[b]).reactions ?? (W.reactions = [])).push(e);
    } else !y && w !== null && tt < w.length && (Xr(e, tt), w.length = tt);
    if (pi() && st !== null && !yt && w !== null && (e.f & (He | Mt | qe)) === 0)
      for (b = 0; b < /** @type {Source[]} */
      st.length; b++)
        zi(
          st[b],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (ir++, i.deps !== null)
        for (let k = 0; k < t; k += 1)
          i.deps[k].rv = ir;
      if (r !== null)
        for (const k of r)
          k.rv = ir;
      st !== null && (n === null ? n = st : n.push(.../** @type {Source[]} */
      st));
    }
    return (e.f & Yt) !== 0 && (e.f ^= Yt), R;
  } catch (k) {
    return gi(k);
  } finally {
    e.f ^= Qn, Xe = r, tt = t, st = n, Z = i, _t = o, Cr(c), yt = _, _r = s;
  }
}
function Js(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var n = jo.call(t, e);
    if (n !== -1) {
      var i = t.length - 1;
      i === 0 ? t = r.reactions = null : (t[n] = t[i], t.pop());
    }
  }
  if (t === null && (r.f & He) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Xe === null || !Nr.call(Xe, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & ct) !== 0 && (o.f ^= ct, o.f &= ~hr), o.v !== je && da(o), Ds(o), Xr(o, 0);
  }
}
function Xr(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var n = r; n < t.length; n++)
      Js(e, t[n]);
}
function Ir(e) {
  var r = e.f;
  if ((r & vt) === 0) {
    Ae(e, Ie);
    var t = re, n = mn;
    re = e, mn = !0;
    try {
      (r & (Tt | li)) !== 0 ? Ys(e) : ma(e), Oi(e);
      var i = Ui(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = qi;
      var o;
    } finally {
      mn = n, re = t;
    }
  }
}
async function Xs() {
  await Promise.resolve(), ms();
}
function a(e) {
  var r = e.f, t = (r & He) !== 0;
  if (Z !== null && !yt) {
    var n = re !== null && (re.f & vt) !== 0;
    if (!n && (_t === null || !Nr.call(_t, e))) {
      var i = Z.deps;
      if ((Z.f & Qn) !== 0)
        e.rv < ir && (e.rv = ir, Xe === null && i !== null && i[tt] === e ? tt++ : Xe === null ? Xe = [e] : Xe.push(e));
      else {
        (Z.deps ?? (Z.deps = [])).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [Z] : Nr.call(o, Z) || o.push(Z);
      }
    }
  }
  if (Xt && cr.has(e))
    return cr.get(e);
  if (t) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (Xt) {
      var _ = c.v;
      return ((c.f & Ie) === 0 && c.reactions !== null || Yi(c)) && (_ = pa(c)), cr.set(c, _), _;
    }
    var s = (c.f & ct) === 0 && !yt && Z !== null && (mn || (Z.f & ct) !== 0), p = (c.f & xr) === 0;
    an(c) && (s && (c.f |= ct), Si(c)), s && !p && (Ai(c), Wi(c));
  }
  if (xt?.has(e))
    return xt.get(e);
  if ((e.f & Yt) !== 0)
    throw e.v;
  return e.v;
}
function Wi(e) {
  if (e.f |= ct, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & He) !== 0 && (r.f & ct) === 0 && (Ai(
        /** @type {Derived} */
        r
      ), Wi(
        /** @type {Derived} */
        r
      ));
}
function Yi(e) {
  if (e.v === je) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (cr.has(r) || (r.f & He) !== 0 && Yi(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function ba(e) {
  var r = yt;
  try {
    return yt = !0, e();
  } finally {
    yt = r;
  }
}
const Zs = ["touchstart", "touchmove"];
function Qs(e) {
  return Zs.includes(e);
}
const or = Symbol("events"), Gi = /* @__PURE__ */ new Set(), ia = /* @__PURE__ */ new Set();
function $s(e, r, t, n = {}) {
  function i(o) {
    if (n.capture || oa.call(r, o), !o.cancelBubble)
      return An(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Gt(() => {
    r.addEventListener(e, i, n);
  }) : r.addEventListener(e, i, n), i;
}
function el(e, r, t, n, i) {
  var o = { capture: n, passive: i }, c = $s(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && ga(() => {
    r.removeEventListener(e, c, o);
  });
}
function Me(e, r, t) {
  (r[or] ?? (r[or] = {}))[e] = t;
}
function tl(e) {
  for (var r = 0; r < e.length; r++)
    Gi.add(e[r]);
  for (var t of ia)
    t(e);
}
let ti = null;
function oa(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), n = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  ti = e;
  var c = 0, _ = ti === e && e[or];
  if (_) {
    var s = i.indexOf(_);
    if (s !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[or] = r;
      return;
    }
    var p = i.indexOf(r);
    if (p === -1)
      return;
    s <= p && (c = s);
  }
  if (o = /** @type {Element} */
  i[c] || e.target, o !== r) {
    Vo(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var m = Z, R = re;
    pt(null), Nt(null);
    try {
      for (var w, y = []; o !== null; ) {
        var b = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var W = o[or]?.[n];
          W != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && W.call(o, e);
        } catch (k) {
          w ? y.push(k) : w = k;
        }
        if (e.cancelBubble || b === r || b === null)
          break;
        o = b;
      }
      if (w) {
        for (let k of y)
          queueMicrotask(() => {
            throw k;
          });
        throw w;
      }
    } finally {
      e[or] = r, delete e.currentTarget, pt(m), Nt(R);
    }
  }
}
const rl = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function nl(e) {
  return (
    /** @type {string} */
    rl?.createHTML(e) ?? e
  );
}
function Ki(e) {
  var r = js("template");
  return r.innerHTML = nl(e.replaceAll("<!>", "<!---->")), r.content;
}
function yn(e, r) {
  var t = (
    /** @type {Effect} */
    re
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function T(e, r) {
  var t = (r & ls) !== 0, n = (r & fs) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = Ki(o ? e : "<!>" + e), t || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ Lr(i)));
    var c = (
      /** @type {TemplateNode} */
      n || Ni ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (t) {
      var _ = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Lr(c)
      ), s = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      yn(_, s);
    } else
      yn(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function al(e, r, t = "svg") {
  var n = !e.startsWith("<!>"), i = `<${t}>${n ? e : "<!>" + e}</${t}>`, o;
  return () => {
    if (!o) {
      var c = (
        /** @type {DocumentFragment} */
        Ki(i)
      ), _ = (
        /** @type {Element} */
        /* @__PURE__ */ Lr(c)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ Lr(_);
    }
    var s = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return yn(s, s), s;
  };
}
// @__NO_SIDE_EFFECTS__
function ka(e, r) {
  return /* @__PURE__ */ al(e, r, "svg");
}
function Yn() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = Kt();
  return e.append(r, t), yn(r, t), e;
}
function A(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function O(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = t, e.nodeValue = `${t}`);
}
function il(e, r) {
  return ol(e, r);
}
const dn = /* @__PURE__ */ new Map();
function ol(e, { target: r, anchor: t, props: n = {}, events: i, context: o, intro: c = !0, transformError: _ }) {
  Os();
  var s = void 0, p = zs(() => {
    var m = t ?? r.appendChild(Kt());
    ks(
      /** @type {TemplateNode} */
      m,
      {
        pending: () => {
        }
      },
      (y) => {
        vi({});
        var b = (
          /** @type {ComponentContext} */
          it
        );
        o && (b.c = o), i && (n.$$events = i), s = e(y, n) || {}, _i();
      },
      _
    );
    var R = /* @__PURE__ */ new Set(), w = (y) => {
      for (var b = 0; b < y.length; b++) {
        var W = y[b];
        if (!R.has(W)) {
          R.add(W);
          var k = Qs(W);
          for (const de of [r, document]) {
            var Y = dn.get(de);
            Y === void 0 && (Y = /* @__PURE__ */ new Map(), dn.set(de, Y));
            var Fe = Y.get(W);
            Fe === void 0 ? (de.addEventListener(W, oa, { passive: k }), Y.set(W, 1)) : Y.set(W, Fe + 1);
          }
        }
      }
    };
    return w(En(Gi)), ia.add(w), () => {
      for (var y of R)
        for (const k of [r, document]) {
          var b = (
            /** @type {Map<string, number>} */
            dn.get(k)
          ), W = (
            /** @type {number} */
            b.get(y)
          );
          --W == 0 ? (k.removeEventListener(y, oa), b.delete(y), b.size === 0 && dn.delete(k)) : b.set(y, W);
        }
      ia.delete(w), m !== t && m.parentNode?.removeChild(m);
    };
  });
  return sa.set(s, p), s;
}
let sa = /* @__PURE__ */ new WeakMap();
function sl(e, r) {
  const t = sa.get(e);
  return t ? (sa.delete(e), t(r)) : Promise.resolve();
}
var mt, St, at, dr, tn, rn, wn;
class Ji {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    gt(this, "anchor");
    /** @type {Map<Batch, Key>} */
    q(this, mt, /* @__PURE__ */ new Map());
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
    q(this, St, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    q(this, at, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    q(this, dr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    q(this, tn, !0);
    /**
     * @param {Batch} batch
     */
    q(this, rn, (r) => {
      if (f(this, mt).has(r)) {
        var t = (
          /** @type {Key} */
          f(this, mt).get(r)
        ), n = f(this, St).get(t);
        if (n)
          xa(n), f(this, dr).delete(t);
        else {
          var i = f(this, at).get(t);
          i && (f(this, St).set(t, i.effect), f(this, at).delete(t), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), n = i.effect);
        }
        for (const [o, c] of f(this, mt)) {
          if (f(this, mt).delete(o), o === r)
            break;
          const _ = f(this, at).get(c);
          _ && (Ze(_.effect), f(this, at).delete(c));
        }
        for (const [o, c] of f(this, St)) {
          if (o === t || f(this, dr).has(o)) continue;
          const _ = () => {
            if (Array.from(f(this, mt).values()).includes(o)) {
              var p = document.createDocumentFragment();
              ya(c, p), p.append(Kt()), f(this, at).set(o, { effect: c, fragment: p });
            } else
              Ze(c);
            f(this, dr).delete(o), f(this, St).delete(o);
          };
          f(this, tn) || !n ? (f(this, dr).add(o), vr(c, _, !1)) : _();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    q(this, wn, (r) => {
      f(this, mt).delete(r);
      const t = Array.from(f(this, mt).values());
      for (const [n, i] of f(this, at))
        t.includes(n) || (Ze(i.effect), f(this, at).delete(n));
    });
    this.anchor = r, X(this, tn, t);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(r, t) {
    var n = (
      /** @type {Batch} */
      V
    ), i = Di();
    if (t && !f(this, St).has(r) && !f(this, at).has(r))
      if (i) {
        var o = document.createDocumentFragment(), c = Kt();
        o.append(c), f(this, at).set(r, {
          effect: dt(() => t(c)),
          fragment: o
        });
      } else
        f(this, St).set(
          r,
          dt(() => t(this.anchor))
        );
    if (f(this, mt).set(n, r), i) {
      for (const [_, s] of f(this, St))
        _ === r ? n.unskip_effect(s) : n.skip_effect(s);
      for (const [_, s] of f(this, at))
        _ === r ? n.unskip_effect(s.effect) : n.skip_effect(s.effect);
      n.oncommit(f(this, rn)), n.ondiscard(f(this, wn));
    } else
      f(this, rn).call(this, n);
  }
}
mt = new WeakMap(), St = new WeakMap(), at = new WeakMap(), dr = new WeakMap(), tn = new WeakMap(), rn = new WeakMap(), wn = new WeakMap();
function ne(e, r, t = !1) {
  var n = new Ji(e), i = t ? pr : 0;
  function o(c, _) {
    n.ensure(c, _);
  }
  Tn(() => {
    var c = !1;
    r((_, s = 0) => {
      c = !0, o(s, _);
    }), c || o(-1, null);
  }, i);
}
function ri(e, r) {
  return r;
}
function ll(e, r, t) {
  for (var n = [], i = r.length, o, c = r.length, _ = 0; _ < i; _++) {
    let R = r[_];
    vr(
      R,
      () => {
        if (o) {
          if (o.pending.delete(R), o.done.add(R), o.pending.size === 0) {
            var w = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            la(e, En(o.done)), w.delete(o), w.size === 0 && (e.outrogroups = null);
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
      var p = (
        /** @type {Element} */
        t
      ), m = (
        /** @type {Element} */
        p.parentNode
      );
      Ps(m), m.append(p), e.items.clear();
    }
    la(e, r, !s);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function la(e, r, t = !0) {
  var n;
  if (e.pending.size > 0) {
    n = /* @__PURE__ */ new Set();
    for (const c of e.pending.values())
      for (const _ of c)
        n.add(
          /** @type {EachItem} */
          e.items.get(_).e
        );
  }
  for (var i = 0; i < r.length; i++) {
    var o = r[i];
    if (n?.has(o)) {
      o.f |= At;
      const c = document.createDocumentFragment();
      ya(o, c);
    } else
      Ze(r[i], t);
  }
}
var ni;
function Lt(e, r, t, n, i, o = null) {
  var c = e, _ = /* @__PURE__ */ new Map(), s = (r & fi) !== 0;
  if (s) {
    var p = (
      /** @type {Element} */
      e
    );
    c = p.appendChild(Kt());
  }
  var m = null, R = /* @__PURE__ */ Rs(() => {
    var de = t();
    return ua(de) ? de : de == null ? [] : En(de);
  }), w, y = /* @__PURE__ */ new Map(), b = !0;
  function W(de) {
    (Fe.effect.f & vt) === 0 && (Fe.pending.delete(de), Fe.fallback = m, fl(Fe, w, c, r, n), m !== null && (w.length === 0 ? (m.f & At) === 0 ? xa(m) : (m.f ^= At, zr(m, null, c)) : vr(m, () => {
      m = null;
    })));
  }
  function k(de) {
    Fe.pending.delete(de);
  }
  var Y = Tn(() => {
    w = /** @type {V[]} */
    a(R);
    for (var de = w.length, Re = /* @__PURE__ */ new Set(), xe = (
      /** @type {Batch} */
      V
    ), ot = Di(), Ce = 0; Ce < de; Ce += 1) {
      var Ve = w[Ce], Qe = n(Ve, Ce), ve = b ? null : _.get(Qe);
      ve ? (ve.v && Dr(ve.v, Ve), ve.i && Dr(ve.i, Ce), ot && xe.unskip_effect(ve.e)) : (ve = ul(
        _,
        b ? c : ni ?? (ni = Kt()),
        Ve,
        Qe,
        Ce,
        i,
        r,
        t
      ), b || (ve.e.f |= At), _.set(Qe, ve)), Re.add(Qe);
    }
    if (de === 0 && o && !m && (b ? m = dt(() => o(c)) : (m = dt(() => o(ni ?? (ni = Kt()))), m.f |= At)), de > Re.size && Jo(), !b)
      if (y.set(xe, Re), ot) {
        for (const [on, Or] of _)
          Re.has(on) || xe.skip_effect(Or.e);
        xe.oncommit(W), xe.ondiscard(k);
      } else
        W(xe);
    a(R);
  }), Fe = { effect: Y, items: _, pending: y, outrogroups: null, fallback: m };
  b = !1;
}
function Hr(e) {
  for (; e !== null && (e.f & bt) === 0; )
    e = e.next;
  return e;
}
function fl(e, r, t, n, i) {
  var o = (n & os) !== 0, c = r.length, _ = e.items, s = Hr(e.effect.first), p, m = null, R, w = [], y = [], b, W, k, Y;
  if (o)
    for (Y = 0; Y < c; Y += 1)
      b = r[Y], W = i(b, Y), k = /** @type {EachItem} */
      _.get(W).e, (k.f & At) === 0 && (k.nodes?.a?.measure(), (R ?? (R = /* @__PURE__ */ new Set())).add(k));
  for (Y = 0; Y < c; Y += 1) {
    if (b = r[Y], W = i(b, Y), k = /** @type {EachItem} */
    _.get(W).e, e.outrogroups !== null)
      for (const ve of e.outrogroups)
        ve.pending.delete(k), ve.done.delete(k);
    if ((k.f & Ye) !== 0 && (xa(k), o && (k.nodes?.a?.unfix(), (R ?? (R = /* @__PURE__ */ new Set())).delete(k))), (k.f & At) !== 0)
      if (k.f ^= At, k === s)
        zr(k, null, t);
      else {
        var Fe = m ? m.next : s;
        k === e.effect.last && (e.effect.last = k.prev), k.prev && (k.prev.next = k.next), k.next && (k.next.prev = k.prev), Ht(e, m, k), Ht(e, k, Fe), zr(k, Fe, t), m = k, w = [], y = [], s = Hr(m.next);
        continue;
      }
    if (k !== s) {
      if (p !== void 0 && p.has(k)) {
        if (w.length < y.length) {
          var de = y[0], Re;
          m = de.prev;
          var xe = w[0], ot = w[w.length - 1];
          for (Re = 0; Re < w.length; Re += 1)
            zr(w[Re], de, t);
          for (Re = 0; Re < y.length; Re += 1)
            p.delete(y[Re]);
          Ht(e, xe.prev, ot.next), Ht(e, m, xe), Ht(e, ot, de), s = de, m = ot, Y -= 1, w = [], y = [];
        } else
          p.delete(k), zr(k, s, t), Ht(e, k.prev, k.next), Ht(e, k, m === null ? e.effect.first : m.next), Ht(e, m, k), m = k;
        continue;
      }
      for (w = [], y = []; s !== null && s !== k; )
        (p ?? (p = /* @__PURE__ */ new Set())).add(s), y.push(s), s = Hr(s.next);
      if (s === null)
        continue;
    }
    (k.f & At) === 0 && w.push(k), m = k, s = Hr(k.next);
  }
  if (e.outrogroups !== null) {
    for (const ve of e.outrogroups)
      ve.pending.size === 0 && (la(e, En(ve.done)), e.outrogroups?.delete(ve));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (s !== null || p !== void 0) {
    var Ce = [];
    if (p !== void 0)
      for (k of p)
        (k.f & Ye) === 0 && Ce.push(k);
    for (; s !== null; )
      (s.f & Ye) === 0 && s !== e.fallback && Ce.push(s), s = Hr(s.next);
    var Ve = Ce.length;
    if (Ve > 0) {
      var Qe = (n & fi) !== 0 && c === 0 ? t : null;
      if (o) {
        for (Y = 0; Y < Ve; Y += 1)
          Ce[Y].nodes?.a?.measure();
        for (Y = 0; Y < Ve; Y += 1)
          Ce[Y].nodes?.a?.fix();
      }
      ll(e, Ce, Qe);
    }
  }
  o && Gt(() => {
    if (R !== void 0)
      for (k of R)
        k.nodes?.a?.apply();
  });
}
function ul(e, r, t, n, i, o, c, _) {
  var s = (c & as) !== 0 ? (c & ss) === 0 ? /* @__PURE__ */ Ls(t, !1, !1) : mr(t) : null, p = (c & is) !== 0 ? mr(i) : null;
  return {
    v: s,
    i: p,
    e: dt(() => (o(r, s ?? t, p ?? i, _), () => {
      e.delete(n);
    }))
  };
}
function zr(e, r, t) {
  if (e.nodes)
    for (var n = e.nodes.start, i = e.nodes.end, o = r && (r.f & At) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; n !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ nn(n)
      );
      if (o.before(n), n === i)
        return;
      n = c;
    }
}
function Ht(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function dl(e, r, t) {
  var n = new Ji(e);
  Tn(() => {
    var i = r() ?? null;
    n.ensure(i, i && ((o) => t(o, i)));
  }, pr);
}
function Xi(e) {
  var r, t, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var i = e.length;
    for (r = 0; r < i; r++) e[r] && (t = Xi(e[r])) && (n && (n += " "), n += t);
  } else for (t in e) e[t] && (n && (n += " "), n += t);
  return n;
}
function cl() {
  for (var e, r, t = 0, n = "", i = arguments.length; t < i; t++) (e = arguments[t]) && (r = Xi(e)) && (n && (n += " "), n += r);
  return n;
}
function u(e) {
  return typeof e == "object" ? cl(e) : e ?? "";
}
function vl(e, r, t) {
  var n = e == null ? "" : "" + e;
  return n === "" ? null : n;
}
function d(e, r, t, n, i, o) {
  var c = e.__className;
  if (c !== t || c === void 0) {
    var _ = vl(t);
    _ == null ? e.removeAttribute("class") : r ? e.className = _ : e.setAttribute("class", _), e.__className = t;
  }
  return o;
}
function Zi(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!ua(r))
      return ds();
    for (var n of e.options)
      n.selected = r.includes(Kr(n));
    return;
  }
  for (n of e.options) {
    var i = Kr(n);
    if (Fs(i, r)) {
      n.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function _l(e) {
  var r = new MutationObserver(() => {
    Zi(e, e.__value);
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
  }), ga(() => {
    r.disconnect();
  });
}
function pl(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet(), i = !0;
  Li(e, "change", (o) => {
    var c = o ? "[selected]" : ":checked", _;
    if (e.multiple)
      _ = [].map.call(e.querySelectorAll(c), Kr);
    else {
      var s = e.querySelector(c) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      _ = s && Kr(s);
    }
    t(_), e.__value = _, V !== null && n.add(V);
  }), Us(() => {
    var o = r();
    if (e === document.activeElement) {
      var c = (
        /** @type {Batch} */
        V
      );
      if (n.has(c))
        return;
    }
    if (Zi(e, o, i), i && o === void 0) {
      var _ = e.querySelector(":checked");
      _ !== null && (o = Kr(_), t(o));
    }
    e.__value = o, i = !1;
  }), _l(e);
}
function Kr(e) {
  return "__value" in e ? e.__value : e.value;
}
const hl = Symbol("is custom element"), gl = Symbol("is html");
function Be(e, r, t, n) {
  var i = ml(e);
  i[r] !== (i[r] = t) && (t == null ? e.removeAttribute(r) : typeof t != "string" && xl(e).includes(r) ? e[r] = t : e.setAttribute(r, t));
}
function ml(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [hl]: e.nodeName.includes("-"),
      [gl]: e.namespaceURI === ui
    })
  );
}
var ai = /* @__PURE__ */ new Map();
function xl(e) {
  var r = e.getAttribute("is") || e.nodeName, t = ai.get(r);
  if (t) return t;
  ai.set(r, t = []);
  for (var n, i = e, o = Element.prototype; o !== i; ) {
    n = Bo(i);
    for (var c in n)
      n[c].set && t.push(c);
    i = oi(i);
  }
  return t;
}
function Gn(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet();
  Li(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = Kn(e) ? Jn(o) : o, t(o), V !== null && n.add(V), await Xs(), o !== (o = r())) {
      var c = e.selectionStart, _ = e.selectionEnd, s = e.value.length;
      if (e.value = o ?? "", _ !== null) {
        var p = e.value.length;
        c === _ && _ === s && p > s ? (e.selectionStart = p, e.selectionEnd = p) : (e.selectionStart = c, e.selectionEnd = Math.min(_, p));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  ba(r) == null && e.value && (t(Kn(e) ? Jn(e.value) : e.value), V !== null && n.add(V)), Fi(() => {
    var i = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        V
      );
      if (n.has(o))
        return;
    }
    Kn(e) && i === Jn(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function Kn(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function Jn(e) {
  return e === "" ? null : +e;
}
function yl(e) {
  it === null && Go(), Hs(() => {
    const r = ba(e);
    if (typeof r == "function") return (
      /** @type {() => void} */
      r
    );
  });
}
const bl = "5";
var ii;
typeof window < "u" && ((ii = window.__svelte ?? (window.__svelte = {})).v ?? (ii.v = /* @__PURE__ */ new Set())).add(bl);
const kl = "See token balances and transfer history for your realm's treasury, send payments when allowed, and look up balances tied to members or invoices.", Qi = "(max-width: 720px)";
function wl() {
  return typeof window > "u" ? !1 : window.matchMedia(Qi).matches;
}
function El(e) {
  if (typeof window > "u") return () => {
  };
  const r = window.matchMedia(Qi), t = () => e(r.matches);
  return t(), r.addEventListener("change", t), () => r.removeEventListener("change", t);
}
const Sl = (e) => {
  var r = Ml();
  A(e, r);
}, Al = (e) => {
  var r = Nl();
  A(e, r);
}, Tl = (e) => {
  var r = Rl();
  A(e, r);
};
var Ml = /* @__PURE__ */ ka('<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>'), Nl = /* @__PURE__ */ ka('<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4.93 4.93a10 10 0 0114.14 0M19.07 19.07a10 10 0 01-14.14 0"></path></svg>'), Rl = /* @__PURE__ */ ka('<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>'), Cl = /* @__PURE__ */ T('<div><div><div> </div> <div> </div></div> <div><div> </div> <button type="button">Send</button></div></div>'), Dl = /* @__PURE__ */ T("<div><div></div> <p>Balance booked across this realm's treasury funds</p></div>"), Ll = /* @__PURE__ */ T("<div><p>No token configured</p> <p>This realm's treasury has no active token yet, so the vault holds no balance.</p></div>"), Il = /* @__PURE__ */ T("<span>Copied!</span>"), Fl = /* @__PURE__ */ T("<div><span>Last refresh:</span> <span> </span></div>"), Ol = /* @__PURE__ */ T("<span>Copied!</span>"), Pl = /* @__PURE__ */ T("<span>Copied!</span>"), jl = /* @__PURE__ */ T('<div><div> </div> <div> </div> <div> </div> <div> </div> <div><span>Ledger:</span> <button type="button"> </button> <!></div> <div><span>Indexer:</span> <button type="button"> </button> <!></div></div>'), Vl = /* @__PURE__ */ T('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), Bl = /* @__PURE__ */ T("<details><summary>Show details</summary> <pre> </pre></details>"), ql = /* @__PURE__ */ T("<div><p> </p> <!></div>"), Hl = /* @__PURE__ */ T('<button type="button"> </button>'), zl = /* @__PURE__ */ T('<button type="button" title="Admin" aria-label="Admin"><!> <span class="hidden sm:inline">Admin</span></button>'), Ul = /* @__PURE__ */ T("<div><div></div> <div></div> <div></div> <div></div> <div></div></div>"), Wl = /* @__PURE__ */ T("<div></div>"), Yl = /* @__PURE__ */ T('<div><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <p>No activity yet</p> <p>Transfers and ledger events will appear here after the vault syncs.</p></div>'), Gl = /* @__PURE__ */ T('<button type="button"> </button>'), Kl = /* @__PURE__ */ T("<span> </span>"), Jl = /* @__PURE__ */ T('<button type="button"> </button>'), Xl = /* @__PURE__ */ T("<span> </span>"), Zl = /* @__PURE__ */ T('<button type="button"> </button>'), Ql = /* @__PURE__ */ T("<article><div><div><div> </div> <div>To <!></div> <div>From <!></div></div> <div><div> </div> <!></div></div></article>"), $l = /* @__PURE__ */ T("<div></div>"), ef = /* @__PURE__ */ T("<span>✓</span>"), tf = /* @__PURE__ */ T('<button type="button"> </button> <!>', 1), rf = /* @__PURE__ */ T("<span>—</span>"), nf = /* @__PURE__ */ T("<span>✓</span>"), af = /* @__PURE__ */ T('<button type="button"> </button> <!>', 1), of = /* @__PURE__ */ T("<span> </span>"), sf = /* @__PURE__ */ T("<span>✓</span>"), lf = /* @__PURE__ */ T('<button type="button"> </button> <!>', 1), ff = /* @__PURE__ */ T("<span> </span>"), uf = /* @__PURE__ */ T("<tr><td><!> <div> </div></td><td><span> </span></td><td><!></td><td><!></td><td><span> </span></td></tr>"), df = /* @__PURE__ */ T("<div><table><thead><tr><th>When</th><th>Type</th><th>From</th><th>To</th><th>Amount</th></tr></thead><tbody></tbody></table></div>"), cf = /* @__PURE__ */ T("<span> </span>"), vf = /* @__PURE__ */ T("<span>…</span>"), _f = /* @__PURE__ */ T('<button type="button"> </button>'), pf = /* @__PURE__ */ T('<div><button type="button">Prev</button> <!> <button type="button">Next</button></div>'), hf = /* @__PURE__ */ T("<div><span> <!></span> <!></div>"), gf = /* @__PURE__ */ T("<div><h2>Activity</h2> <!> <!></div>"), mf = /* @__PURE__ */ T("<p>No token is configured for this realm's treasury, so nothing can be sent yet.</p>"), xf = /* @__PURE__ */ T("<p> </p>"), yf = /* @__PURE__ */ T("<option> </option>"), bf = /* @__PURE__ */ T('<select id="v-token"></select>'), kf = /* @__PURE__ */ T("<p>Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).</p>"), wf = /* @__PURE__ */ T("<p> </p>"), Ef = /* @__PURE__ */ T("<p>Principal ID of the recipient.</p>"), Sf = /* @__PURE__ */ T("<p> </p>"), Af = /* @__PURE__ */ T("<p> </p>"), Tf = /* @__PURE__ */ T('<div><button type="button">← Activity</button> <h2>Send tokens</h2> <form><div><span>Token</span> <!></div> <div><label for="v-to">Recipient</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/> <!></div> <div><div><label for="v-amount"> </label> <button type="button">Max</button></div> <input id="v-amount" type="text" inputmode="decimal" placeholder="0.00"/> <!> <!></div> <details><summary>Advanced (subaccounts)</summary> <p> </p></details> <button type="submit"> </button></form></div>'), Mf = /* @__PURE__ */ T(`<div><h2>Look up a balance</h2> <p>Looking up a member's, an invoice's or a raw subaccount's balance is not supported by this
					realm version.</p></div>`), Nf = /* @__PURE__ */ T("<div><div> </div> <div> </div></div>"), Rf = /* @__PURE__ */ T("<div></div>"), Cf = /* @__PURE__ */ T("<p>No balances found in system</p>"), Df = /* @__PURE__ */ T("<p> </p>"), Lf = /* @__PURE__ */ T("<p>No transfer data available</p>"), If = /* @__PURE__ */ T(`<div><h2>Vault Admin</h2> <div><button type="button"><!> </button></div> <div><h3>Auto-refresh settings</h3> <p>The Vault will only run an expensive full refresh on load if the last refresh is older
						than this threshold.</p> <div><label for="v-refresh-age">Max refresh age:</label> <input id="v-refresh-age" type="number" min="1"/> <span>minutes</span> <button type="button">Save</button></div></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>`), Ff = /* @__PURE__ */ T('<div><div><div><div><h1>Vault</h1> <p> </p></div> <button type="button" aria-label="Refresh" title="Refresh"><span><!></span></button></div></div> <!> <details><summary>Technical details</summary> <div><div><span>Vault Principal:</span> <button type="button"> </button> <!></div> <!> <!></div></details> <!> <nav><!> <!></nav> <div><!></div></div>');
function Of(e, r) {
  vi(r, !0);
  const t = r.ctx.theme?.cn ?? ((...l) => l.filter(Boolean).join(" ")), n = 3600 * 1e3, i = "vault_settings", o = "vault_last_refresh", c = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/;
  let _ = /* @__PURE__ */ se("activity"), s = /* @__PURE__ */ se(!1), p = /* @__PURE__ */ se(""), m = /* @__PURE__ */ se(""), R = /* @__PURE__ */ se(Je([])), w = /* @__PURE__ */ ee(() => a(R).includes("admin"));
  const y = r.ctx.config?.canisterId ?? "";
  let b = /* @__PURE__ */ se(Je({})), W = /* @__PURE__ */ se(Je({})), k = /* @__PURE__ */ se(!1), Y = /* @__PURE__ */ se(""), Fe = /* @__PURE__ */ se(Je({})), de = /* @__PURE__ */ se(Je([])), Re = /* @__PURE__ */ se([]), xe = /* @__PURE__ */ se(0);
  const ot = 10;
  let Ce = /* @__PURE__ */ ee(() => a(Re).slice(a(xe) * ot, (a(xe) + 1) * ot)), Ve = /* @__PURE__ */ ee(() => a(Re).length ? {
    total_items_count: a(Re).length,
    total_pages: Math.ceil(a(Re).length / ot)
  } : null), Qe = /* @__PURE__ */ se(null), ve = /* @__PURE__ */ se(""), on = /* @__PURE__ */ se(Je(Cn())), Or = /* @__PURE__ */ se(Je(Math.round(Cn().maxRefreshAgeMs / 6e4))), Rt = /* @__PURE__ */ se(""), sn = /* @__PURE__ */ se(""), Pr = /* @__PURE__ */ se(""), ln = /* @__PURE__ */ se(Je({})), Zt = /* @__PURE__ */ ee(() => Object.keys(a(b))), ze = /* @__PURE__ */ ee(() => a(Rt) ? a(b)[a(Rt)] : void 0), Mn = /* @__PURE__ */ ee(() => a(Rt) && a(Fe)[a(Rt)] || 0), Nn = /* @__PURE__ */ ee(() => a(ze)?.fee ?? 0), qt = /* @__PURE__ */ ee(() => eo(a(Pr), a(ze)?.decimals ?? 8)), yr = /* @__PURE__ */ ee(() => a(sn).trim()), wa = /* @__PURE__ */ ee(() => a(yr) !== "" && c.test(a(yr))), Rn = /* @__PURE__ */ ee(() => a(ln)[a(yr)] || ""), Ea = /* @__PURE__ */ ee(() => a(wa) && a(qt) != null && a(qt) > 0 && !a(s));
  function $i(l, v) {
    return (l / Math.pow(10, v)).toLocaleString(void 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(v, 8)
    });
  }
  function Qt(l, v, g) {
    return `${$i(l, v)} ${g}`;
  }
  function br(l) {
    return `${l.toLocaleString()} base units`;
  }
  function eo(l, v) {
    const g = l.trim();
    if (!g) return null;
    const E = g.split(".");
    if (E.length > 2) return null;
    const S = E[0], P = E[1] ?? "";
    if (!/^\d+$/.test(S) || P && !/^\d+$/.test(P) || P.length > v) return null;
    const H = P.padEnd(v, "0"), Q = v > 0 ? S + H : S, z = Number(Q);
    return Number.isFinite(z) && z >= 0 ? z : null;
  }
  function to(l, v) {
    const g = String(l).padStart(v + 1, "0");
    if (v === 0) return g;
    const E = g.slice(0, -v) || "0";
    let S = g.slice(-v).replace(/0+$/, "");
    return S ? `${E}.${S}` : E;
  }
  function Sa(l) {
    return a(b)[l] ?? {
      ledger: "",
      indexer: "",
      decimals: 8,
      symbol: l,
      name: l,
      fee: 0
    };
  }
  function Cn() {
    try {
      const l = localStorage.getItem(i);
      if (l) {
        const v = JSON.parse(l);
        if (typeof v.maxRefreshAgeMs == "number" && v.maxRefreshAgeMs > 0)
          return { maxRefreshAgeMs: v.maxRefreshAgeMs };
      }
    } catch {
    }
    return { maxRefreshAgeMs: n };
  }
  function ro(l) {
    try {
      localStorage.setItem(i, JSON.stringify(l));
    } catch {
    }
  }
  function no() {
    const l = Math.max(1, Math.round(a(Or) || 1));
    L(on, { maxRefreshAgeMs: l * 6e4 }, !0), ro(a(on));
  }
  function ao() {
    try {
      const l = JSON.parse(localStorage.getItem(o) || "null");
      return typeof l?.timestamp == "number" ? l.timestamp : null;
    } catch {
      return null;
    }
  }
  function io(l) {
    try {
      localStorage.setItem(o, JSON.stringify({ timestamp: l }));
    } catch {
    }
  }
  async function Ct(l) {
    try {
      await navigator.clipboard.writeText(l), L(ve, l, !0), setTimeout(() => L(ve, ""), 2e3);
    } catch {
    }
  }
  function Dn(l) {
    const v = Math.floor((Date.now() - l.getTime()) / 1e3);
    if (v < 60) return `${v}s ago`;
    const g = Math.floor(v / 60);
    if (g < 60) return `${g}m ago`;
    const E = Math.floor(g / 60);
    return E < 24 ? `${E}h ago` : `${Math.floor(E / 24)}d ago`;
  }
  function Aa(l) {
    return new Date(l * 1e3);
  }
  function oo(l, v = 20) {
    if (l.length <= v) return l;
    const g = Math.floor((v - 1) / 2);
    return `${l.slice(0, g)}…${l.slice(-g)}`;
  }
  function jr(l) {
    return l ? l === y ? { display: "This vault", title: l, copyable: !1 } : a(ln)[l] ? {
      display: a(ln)[l],
      title: l,
      copyable: !1
    } : c.test(l) ? { display: oo(l), title: l, copyable: !0 } : { display: l, title: l, copyable: !1 } : { display: "—", title: "", copyable: !1 };
  }
  function Ta(l) {
    const v = l || "unknown";
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
  function Ma(l) {
    switch (l) {
      case "mint":
        return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300";
      case "burn":
        return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300";
      case "transfer":
        return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
    }
  }
  function Na(l) {
    const v = Sa(l.token), g = l.amount || 0, E = l.fee || 0, S = Qt(g, v.decimals, v.symbol), P = l.principal_to === y || l.kind === "mint", H = l.principal_from === y || l.kind === "burn";
    let Q = S, z = "text-gray-600 dark:text-gray-400";
    P ? (Q = `+${S}`, z = "text-emerald-600 dark:text-emerald-400") : H && (Q = `−${S}`, z = "text-rose-600 dark:text-rose-400");
    const ue = E > 0 ? `${br(g)} · Fee: ${br(E)}` : br(g);
    return { text: Q, className: z, title: ue };
  }
  function Ra(l) {
    const v = l.match(/Reject text:\s*([^\n]+?)(?:\s+Error code|\s+Call context|$)/);
    if (v) return v[1].trim();
    const g = l.split(`
`)[0].trim();
    return g.length > 200 ? `${g.slice(0, 200)}…` : g;
  }
  function Ln(l) {
    const v = r.ctx.ui?.accessDeniedOperation?.(l);
    v != null ? (L(m, v, !0), L(p, "")) : (L(m, ""), L(p, l?.message ?? String(l), !0));
  }
  async function so(l) {
    if (typeof r.ctx.openModal != "function") return !0;
    try {
      const { actionId: v } = await r.ctx.openModal({
        title: l.title,
        body: l.body,
        actions: [
          { id: "cancel", label: "Cancel", tone: "secondary" },
          {
            id: "confirm",
            label: l.confirmLabel || "Confirm",
            tone: l.danger ? "danger" : "primary"
          }
        ]
      });
      return v === "confirm";
    } catch {
      return !1;
    }
  }
  function lo(l) {
    L(Rt, l, !0), L(_, "send");
  }
  function fo() {
    if (!a(ze)) return;
    const l = Math.max(0, a(Mn) - a(Nn));
    L(Pr, to(l, a(ze).decimals), !0);
  }
  async function In(l, v = {}) {
    const g = await r.ctx.read(l, v);
    if (!g.ok) throw new Error(g.error);
    return g;
  }
  async function Ca(l, v, g) {
    const E = [];
    let S = 1;
    for (; S; ) {
      const P = await In(l, { ...v, from: S, count: 500 });
      E.push(...P[g]), S = P.next;
    }
    return E;
  }
  async function uo() {
    try {
      const l = await Ca("user_list", {}, "users");
      L(ln, Object.fromEntries(l.filter((v) => v.nickname).map((v) => [v.id, v.nickname])), !0);
    } catch {
    }
  }
  async function co() {
    const l = await In("realm_info"), v = {};
    let g, E = 1;
    for (; E; )
      g = await In("treasury_view", { from: E, count: 500 }), Object.assign(v, g.funds), E = g.next;
    const S = l.realm.accounting_currency, P = g.tokens.some((C) => C.id === S) ? g.tokens.filter((C) => C.id === S) : g.tokens, H = {}, Q = {}, z = [];
    for (const C of P) {
      H[C.id] = {
        ledger: C.ledger,
        indexer: C.indexer,
        decimals: C.decimals,
        symbol: C.id,
        name: C.id,
        fee: C.fee
      }, Q[C.id] = 0;
      for (const [G, K] of Object.entries(v)) {
        const B = K[C.id] ?? 0;
        Q[C.id] += B, B && z.push({
          _id: `${G}:${C.id}`,
          principal: `Fund ${G}`,
          token: C.id,
          amount: B
        });
      }
    }
    L(b, H, !0), L(W, Q, !0), L(de, z, !0), L(Y, g.config.source_fund, !0), L(Fe, v[a(Y)] ?? {}, !0);
    const ue = Object.keys(H);
    ue.length > 0 && !a(Rt) && L(Rt, ue[0], !0), L(k, !0);
  }
  async function vo() {
    const l = /* @__PURE__ */ new Map();
    for (const v of await Ca("ledger_view", { kind: "asset" }, "entries")) {
      if (v.category !== "cash" || !(v.symbol in a(b))) continue;
      const g = l.get(v.transaction) ?? { net: 0, first: v };
      g.net += v.debit - v.credit, l.set(v.transaction, g);
    }
    L(Re, [...l.entries()].filter(([, v]) => v.net !== 0).reverse().map(([v, { net: g, first: E }]) => ({
      tx_id: v,
      kind: "transfer",
      token: E.symbol,
      amount: Math.abs(g),
      timestamp: E.at,
      principal_from: g > 0 ? E.user || E.description : y,
      principal_to: g > 0 ? y : E.description
    })));
  }
  async function Fn() {
    L(s, !0), L(p, ""), L(m, "");
    try {
      await Promise.all([co(), uo()]), await vo();
    } catch (l) {
      Ln(l);
    } finally {
      L(s, !1);
    }
  }
  async function On() {
    L(s, !0), L(p, ""), L(m, "");
    try {
      let l = 1;
      for (; l; ) {
        const v = await r.ctx.run("invoice_refresh", { from: l, count: 20 });
        if (!v.ok) throw new Error(v.error);
        l = v.next;
      }
      L(Qe, /* @__PURE__ */ new Date(), !0), io(a(Qe).getTime()), L(xe, 0), await Fn();
    } catch (l) {
      Ln(l);
    } finally {
      L(s, !1);
    }
  }
  async function _o() {
    if (!a(Ea) || !a(ze) || a(qt) == null) return;
    const l = a(ze).symbol, v = Qt(a(qt), a(ze).decimals, l), g = a(Rn) || a(yr);
    if (await so({
      title: "Confirm send",
      body: `Send ${v} to ${g}? This cannot be undone.`,
      confirmLabel: "Send",
      danger: !0
    })) {
      L(s, !0), L(p, ""), L(m, "");
      try {
        const S = await r.ctx.run("transfer_create", {
          fund: a(Y),
          to: a(yr),
          amount: a(qt),
          symbol: l
        });
        if (!S.ok) throw new Error(S.error);
        if (S.requires_vote)
          r.ctx.notify?.("success", `Proposal ${S.proposal} created — a vote is required to send ${v}`);
        else {
          if (S.status !== "completed")
            throw new Error(S.error || `Transfer ${S.transfer} is ${S.status}`);
          r.ctx.notify?.("success", `Sent ${v}`);
        }
        L(sn, ""), L(Pr, ""), await Fn();
      } catch (S) {
        Ln(S);
      } finally {
        L(s, !1);
      }
    }
  }
  function Pn(l) {
    L(xe, l, !0);
  }
  function po(l, v) {
    if (l <= 7) return Array.from({ length: l }, (E, S) => S);
    const g = [0];
    v > 3 && g.push("...");
    for (let E = Math.max(1, v - 1); E <= Math.min(l - 2, v + 1); E++) g.push(E);
    return v < l - 4 && g.push("..."), g.push(l - 1), g;
  }
  const ho = [
    { id: "activity", label: "Activity" },
    { id: "lookup", label: "Lookup" }
  ];
  let Da = /* @__PURE__ */ se(Je(wl()));
  yl(() => {
    const l = [
      El((v) => {
        L(Da, v, !0);
      })
    ];
    return r.ctx.userProfiles?.subscribe && l.push(r.ctx.userProfiles.subscribe((v) => {
      L(R, v || [], !0);
    })), (async () => {
      const v = ao();
      v && L(Qe, new Date(v), !0), await Fn(), (!v || Date.now() - v > Cn().maxRefreshAgeMs) && await On();
    })(), () => {
      for (const v of l) v();
    };
  });
  var jn = Ff(), Vn = h(jn), La = h(Vn), Ia = h(La), Fa = h(Ia), Oa = x(Fa, 2), go = h(Oa), fn = x(Ia, 2), Pa = h(fn), mo = h(Pa);
  Al(mo);
  var ja = x(Vn, 2);
  {
    var xo = (l) => {
      var v = Dl(), g = h(v);
      Lt(g, 20, () => a(Zt), (S) => S, (S, P) => {
        const H = /* @__PURE__ */ ee(() => a(b)[P]), Q = /* @__PURE__ */ ee(() => a(W)[P] || 0);
        var z = Cl(), ue = h(z), C = h(ue), G = h(C), K = x(C, 2), B = h(K), ae = x(ue, 2), le = h(ae), ce = h(le), ge = x(le, 2);
        M(
          (_e, De, ye, we, U, $, J, ie) => {
            d(z, 1, _e), Be(z, "title", De), d(C, 1, ye), O(G, a(H).symbol), d(K, 1, we), O(B, a(H).name), d(ae, 1, U), d(le, 1, $), O(ce, J), d(ge, 1, ie);
          },
          [
            () => u(t("flex items-center justify-between gap-4 py-3 sm:bg-white/60 sm:dark:bg-gray-800/40 sm:rounded-lg sm:p-4", "border-b border-indigo-200/60 last:border-0 dark:border-indigo-800/40 sm:border-0")),
            () => br(a(Q)),
            () => u(t("text-sm font-semibold text-indigo-900 dark:text-indigo-200")),
            () => u(t("text-xs text-indigo-600/70 dark:text-indigo-400/70")),
            () => u(t("flex items-center gap-4")),
            () => u(t("text-2xl font-bold text-indigo-900 dark:text-indigo-100 tabular-nums")),
            () => Qt(a(Q), a(H).decimals, a(H).symbol),
            () => u(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 transition-colors shrink-0"))
          ]
        ), Me("click", ge, () => lo(P)), A(S, z);
      });
      var E = x(g, 2);
      M(
        (S, P, H) => {
          d(v, 1, S), d(g, 1, P), d(E, 1, H);
        },
        [
          () => u(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20", "border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => u(t("space-y-3")),
          () => u(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), A(l, v);
    }, yo = (l) => {
      var v = Ll(), g = h(v), E = x(g, 2);
      M(
        (S, P, H) => {
          d(v, 1, S), d(g, 1, P), d(E, 1, H);
        },
        [
          () => u(t("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => u(t("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => u(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), A(l, v);
    };
    ne(ja, (l) => {
      a(k) && a(Zt).length > 0 ? l(xo) : a(k) && l(yo, 1);
    });
  }
  var Bn = x(ja, 2), Va = h(Bn), Ba = x(Va, 2), qn = h(Ba), qa = h(qn), Vr = x(qa, 2), bo = h(Vr), ko = x(Vr, 2);
  {
    var wo = (l) => {
      var v = Il();
      M((g) => d(v, 1, g), [
        () => u(t("text-xs text-green-600 dark:text-green-400"))
      ]), A(l, v);
    };
    ne(ko, (l) => {
      a(ve) === y && y && l(wo);
    });
  }
  var Ha = x(qn, 2);
  {
    var Eo = (l) => {
      var v = Fl(), g = h(v), E = x(g, 2), S = h(E);
      M(
        (P, H, Q, z, ue) => {
          d(v, 1, P), d(g, 1, H), d(E, 1, Q), O(S, `${z ?? ""} (${ue ?? ""})`);
        },
        [
          () => u(t("text-xs text-gray-600 dark:text-gray-400")),
          () => u(t("font-medium")),
          () => u(t("ml-1")),
          () => a(Qe).toLocaleString(),
          () => Dn(a(Qe))
        ]
      ), A(l, v);
    };
    ne(Ha, (l) => {
      a(Qe) && l(Eo);
    });
  }
  var So = x(Ha, 2);
  Lt(So, 16, () => a(Zt), (l) => l, (l, v) => {
    const g = /* @__PURE__ */ ee(() => a(b)[v]);
    var E = jl(), S = h(E), P = h(S), H = x(S, 2), Q = h(H), z = x(H, 2), ue = h(z), C = x(z, 2), G = h(C), K = x(C, 2), B = h(K), ae = x(B, 2), le = h(ae), ce = x(ae, 2);
    {
      var ge = (J) => {
        var ie = Ol();
        M((Se) => d(ie, 1, Se), [() => u(t("text-green-600 dark:text-green-400"))]), A(J, ie);
      };
      ne(ce, (J) => {
        a(ve) === a(g).ledger && J(ge);
      });
    }
    var _e = x(K, 2), De = h(_e), ye = x(De, 2), we = h(ye), U = x(ye, 2);
    {
      var $ = (J) => {
        var ie = Pl();
        M((Se) => d(ie, 1, Se), [() => u(t("text-green-600 dark:text-green-400"))]), A(J, ie);
      };
      ne(U, (J) => {
        a(ve) === a(g).indexer && J($);
      });
    }
    M(
      (J, ie, Se, Oe, j, te, fe, be, Te, Pe, N, F) => {
        d(E, 1, J), d(S, 1, ie), O(P, a(g).symbol), d(H, 1, Se), O(Q, `Name: ${a(g).name ?? ""}`), d(z, 1, Oe), O(ue, `Decimals: ${a(g).decimals ?? ""}`), d(C, 1, j), O(G, `Transfer fee: ${te ?? ""}`), d(K, 1, fe), d(B, 1, be), d(ae, 1, Te), O(le, a(g).ledger), d(_e, 1, Pe), d(De, 1, N), d(ye, 1, F), O(we, a(g).indexer);
      },
      [
        () => u(t("text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 first:border-0 first:pt-0")),
        () => u(t("font-semibold text-gray-700 dark:text-gray-300")),
        () => u(t("text-gray-500 dark:text-gray-400")),
        () => u(t("text-gray-500 dark:text-gray-400")),
        () => u(t("text-gray-500 dark:text-gray-400")),
        () => Qt(a(g).fee, a(g).decimals, a(g).symbol),
        () => u(t("flex flex-wrap items-center gap-2")),
        () => u(t("text-gray-500 dark:text-gray-400")),
        () => u(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
        () => u(t("flex flex-wrap items-center gap-2")),
        () => u(t("text-gray-500 dark:text-gray-400")),
        () => u(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
      ]
    ), Me("click", ae, () => Ct(a(g).ledger)), Me("click", ye, () => Ct(a(g).indexer)), A(l, E);
  });
  var za = x(Bn, 2);
  {
    var Ao = (l) => {
      var v = Yn(), g = kr(v);
      {
        var E = (P) => {
          const H = /* @__PURE__ */ ee(() => r.ctx.ui.AccessDenied);
          var Q = Yn(), z = kr(Q);
          dl(z, () => a(H), (ue, C) => {
            C(ue, {
              get operation() {
                return a(m);
              }
            });
          }), A(P, Q);
        }, S = (P) => {
          var H = Vl();
          A(P, H);
        };
        ne(g, (P) => {
          r.ctx.ui?.AccessDenied ? P(E) : P(S, -1);
        });
      }
      A(l, v);
    }, To = (l) => {
      var v = ql(), g = h(v), E = h(g), S = x(g, 2);
      {
        var P = (Q) => {
          var z = Bl(), ue = h(z), C = x(ue, 2), G = h(C);
          M(
            (K, B, ae) => {
              d(z, 1, K), d(ue, 1, B), d(C, 1, ae), O(G, a(p));
            },
            [
              () => u(t("mt-2")),
              () => u(t("text-xs cursor-pointer select-none opacity-80")),
              () => u(t("mt-2 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto opacity-90"))
            ]
          ), A(Q, z);
        }, H = /* @__PURE__ */ ee(() => Ra(a(p)) !== a(p));
        ne(S, (Q) => {
          a(H) && Q(P);
        });
      }
      M(
        (Q, z, ue) => {
          d(v, 1, Q), d(g, 1, z), O(E, ue);
        },
        [
          () => u(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300")),
          () => u(t("font-medium")),
          () => Ra(a(p))
        ]
      ), A(l, v);
    };
    ne(za, (l) => {
      a(m) ? l(Ao) : a(p) && l(To, 1);
    });
  }
  var Hn = x(za, 2), Ua = h(Hn);
  Lt(Ua, 17, () => ho, (l) => l.id, (l, v) => {
    var g = Hl(), E = h(g);
    M(
      (S) => {
        d(g, 1, S), O(E, a(v).label);
      },
      [
        () => u(t("px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors", a(_) === a(v).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Me("click", g, () => {
      L(_, a(v).id, !0);
    }), A(l, g);
  });
  var Mo = x(Ua, 2);
  {
    var No = (l) => {
      var v = zl(), g = h(v);
      Tl(g), M((E) => d(v, 1, E), [
        () => u(t("ml-auto px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5", a(_) === "admin" ? "border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"))
      ]), Me("click", v, () => {
        L(_, "admin");
      }), A(l, v);
    };
    ne(Mo, (l) => {
      a(w) && l(No);
    });
  }
  var Ro = x(Hn, 2), Co = h(Ro);
  {
    var Do = (l) => {
      var v = gf(), g = h(v), E = x(g, 2);
      {
        var S = (C) => {
          var G = Wl();
          Lt(G, 20, () => Array(4), ri, (K, B) => {
            var ae = Ul(), le = h(ae), ce = x(le, 2), ge = x(ce, 2), _e = x(ge, 2), De = x(_e, 2);
            M(
              (ye, we, U, $, J, ie) => {
                d(ae, 1, ye), d(le, 1, we), d(ce, 1, U), d(ge, 1, $), d(_e, 1, J), d(De, 1, ie);
              },
              [
                () => u(t("px-4 py-4 animate-pulse flex gap-4")),
                () => u(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20")),
                () => u(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-16")),
                () => u(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 hidden sm:block")),
                () => u(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24")),
                () => u(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"))
              ]
            ), A(K, ae);
          }), M((K) => d(G, 1, K), [
            () => u(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), A(C, G);
        }, P = (C) => {
          var G = Yl(), K = h(G), B = x(K, 2), ae = x(B, 2);
          M(
            (le, ce, ge, _e) => {
              d(G, 1, le), d(K, 0, ce), d(B, 1, ge), d(ae, 1, _e);
            },
            [
              () => u(t("px-6 py-12 text-center")),
              () => u(t("w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3")),
              () => u(t("text-sm font-medium text-gray-500 dark:text-gray-400")),
              () => u(t("text-xs text-gray-400 dark:text-gray-500 mt-1"))
            ]
          ), A(C, G);
        }, H = (C) => {
          var G = $l();
          Lt(G, 21, () => a(Ce), (K) => K._id || K.tx_id, (K, B) => {
            const ae = /* @__PURE__ */ ee(() => a(B).timestamp ? Aa(a(B).timestamp) : null), le = /* @__PURE__ */ ee(() => jr(a(B).principal_from)), ce = /* @__PURE__ */ ee(() => jr(a(B).principal_to)), ge = /* @__PURE__ */ ee(() => Na(a(B)));
            var _e = Ql(), De = h(_e), ye = h(De), we = h(ye), U = h(we), $ = x(we, 2), J = x(h($));
            {
              var ie = (D) => {
                var I = Gl(), oe = h(I);
                M(
                  (Le) => {
                    d(I, 1, Le), Be(I, "title", a(ce).title), O(oe, a(ce).display);
                  },
                  [
                    () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline"))
                  ]
                ), Me("click", I, () => Ct(a(B).principal_to)), A(D, I);
              }, Se = (D) => {
                var I = Kl(), oe = h(I);
                M(() => {
                  Be(I, "title", a(ce).title), O(oe, a(ce).display);
                }), A(D, I);
              };
              ne(J, (D) => {
                a(ce).copyable ? D(ie) : D(Se, -1);
              });
            }
            var Oe = x($, 2), j = x(h(Oe));
            {
              var te = (D) => {
                var I = Jl(), oe = h(I);
                M(
                  (Le) => {
                    d(I, 1, Le), Be(I, "title", a(le).title), O(oe, a(le).display);
                  },
                  [
                    () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline"))
                  ]
                ), Me("click", I, () => Ct(a(B).principal_from)), A(D, I);
              }, fe = (D) => {
                var I = Xl(), oe = h(I);
                M(() => {
                  Be(I, "title", a(le).title), O(oe, a(le).display);
                }), A(D, I);
              };
              ne(j, (D) => {
                a(le).copyable ? D(te) : D(fe, -1);
              });
            }
            var be = x(ye, 2), Te = h(be), Pe = h(Te), N = x(Te, 2);
            {
              var F = (D) => {
                var I = Zl(), oe = h(I);
                M(
                  (Le, Ge, $e) => {
                    d(I, 1, Le), Be(I, "title", Ge), O(oe, $e);
                  },
                  [
                    () => u(t("text-xs text-gray-400 hover:underline")),
                    () => a(ae).toLocaleString(),
                    () => Dn(a(ae))
                  ]
                ), Me("click", I, () => Ct(a(ae).toLocaleString())), A(D, I);
              };
              ne(N, (D) => {
                a(ae) && D(F);
              });
            }
            M(
              (D, I, oe, Le, Ge, $e, Dt, $t, er) => {
                d(_e, 1, D), d(De, 1, I), d(ye, 1, oe), d(we, 1, Le), O(U, Ge), d($, 1, $e), d(Oe, 1, Dt), d(be, 1, $t), d(Te, 1, er), Be(Te, "title", a(ge).title), O(Pe, a(ge).text);
              },
              [
                () => u(t("px-4 py-3")),
                () => u(t("flex items-start justify-between gap-3")),
                () => u(t("min-w-0")),
                () => u(t("text-xs font-medium", Ma(a(B).kind))),
                () => Ta(a(B).kind),
                () => u(t("mt-1 text-xs text-gray-500 dark:text-gray-400")),
                () => u(t("mt-0.5 text-xs text-gray-400")),
                () => u(t("text-right shrink-0")),
                () => u(t("font-medium tabular-nums text-sm", a(ge).className))
              ]
            ), A(K, _e);
          }), M((K) => d(G, 1, K), [
            () => u(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), A(C, G);
        }, Q = (C) => {
          var G = df(), K = h(G), B = h(K), ae = h(B), le = h(ae), ce = x(le), ge = x(ce), _e = x(ge), De = x(_e), ye = x(B);
          Lt(ye, 21, () => a(Ce), (we) => we._id || we.tx_id, (we, U) => {
            const $ = /* @__PURE__ */ ee(() => a(U).timestamp ? Aa(a(U).timestamp) : null), J = /* @__PURE__ */ ee(() => jr(a(U).principal_from)), ie = /* @__PURE__ */ ee(() => jr(a(U).principal_to)), Se = /* @__PURE__ */ ee(() => Na(a(U)));
            var Oe = uf(), j = h(Oe), te = h(j);
            {
              var fe = (me) => {
                var ke = tf(), pe = kr(ke), ht = h(pe), tr = x(pe, 2);
                {
                  var rr = (et) => {
                    var kt = ef();
                    M((qr) => d(kt, 1, qr), [
                      () => u(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(et, kt);
                  }, Ue = /* @__PURE__ */ ee(() => a(ve) === a($).toLocaleString());
                  ne(tr, (et) => {
                    a(Ue) && et(rr);
                  });
                }
                M(
                  (et, kt, qr) => {
                    d(pe, 1, et), Be(pe, "title", kt), O(ht, qr);
                  },
                  [
                    () => u(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                    () => a($).toLocaleString(),
                    () => Dn(a($))
                  ]
                ), Me("click", pe, () => Ct(a($).toLocaleString())), A(me, ke);
              }, be = (me) => {
                var ke = rf();
                M((pe) => d(ke, 1, pe), [() => u(t("text-gray-400"))]), A(me, ke);
              };
              ne(te, (me) => {
                a($) ? me(fe) : me(be, -1);
              });
            }
            var Te = x(te, 2), Pe = h(Te), N = x(j), F = h(N), D = h(F), I = x(N), oe = h(I);
            {
              var Le = (me) => {
                var ke = af(), pe = kr(ke), ht = h(pe), tr = x(pe, 2);
                {
                  var rr = (Ue) => {
                    var et = nf();
                    M((kt) => d(et, 1, kt), [
                      () => u(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(Ue, et);
                  };
                  ne(tr, (Ue) => {
                    a(ve) === a(U).principal_from && Ue(rr);
                  });
                }
                M(
                  (Ue) => {
                    d(pe, 1, Ue), Be(pe, "title", a(J).title), O(ht, a(J).display);
                  },
                  [
                    () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Me("click", pe, () => Ct(a(U).principal_from)), A(me, ke);
              }, Ge = (me) => {
                var ke = of(), pe = h(ke);
                M(
                  (ht) => {
                    d(ke, 1, ht), Be(ke, "title", a(J).title), O(pe, a(J).display);
                  },
                  [() => u(t("text-xs text-gray-700 dark:text-gray-300"))]
                ), A(me, ke);
              };
              ne(oe, (me) => {
                a(J).copyable ? me(Le) : me(Ge, -1);
              });
            }
            var $e = x(I), Dt = h($e);
            {
              var $t = (me) => {
                var ke = lf(), pe = kr(ke), ht = h(pe), tr = x(pe, 2);
                {
                  var rr = (Ue) => {
                    var et = sf();
                    M((kt) => d(et, 1, kt), [
                      () => u(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(Ue, et);
                  };
                  ne(tr, (Ue) => {
                    a(ve) === a(U).principal_to && Ue(rr);
                  });
                }
                M(
                  (Ue) => {
                    d(pe, 1, Ue), Be(pe, "title", a(ie).title), O(ht, a(ie).display);
                  },
                  [
                    () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Me("click", pe, () => Ct(a(U).principal_to)), A(me, ke);
              }, er = (me) => {
                var ke = ff(), pe = h(ke);
                M(
                  (ht) => {
                    d(ke, 1, ht), Be(ke, "title", a(ie).title), O(pe, a(ie).display);
                  },
                  [() => u(t("text-xs text-gray-700 dark:text-gray-300"))]
                ), A(me, ke);
              };
              ne(Dt, (me) => {
                a(ie).copyable ? me($t) : me(er, -1);
              });
            }
            var un = x($e), Br = h(un), zn = h(Br);
            M(
              (me, ke, pe, ht, tr, rr, Ue, et, kt, qr) => {
                d(Oe, 1, me), d(j, 1, ke), d(Te, 1, pe), O(Pe, `#${(a(U).tx_id || a(U)._id) ?? ""}`), d(N, 1, ht), d(F, 1, tr), O(D, rr), d(I, 1, Ue), d($e, 1, et), d(un, 1, kt), d(Br, 1, qr), Be(Br, "title", a(Se).title), O(zn, a(Se).text);
              },
              [
                () => u(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
                () => u(t("px-4 py-3")),
                () => u(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
                () => u(t("px-4 py-3")),
                () => u(t("px-2 py-0.5 rounded text-xs font-medium", Ma(a(U).kind))),
                () => Ta(a(U).kind),
                () => u(t("px-4 py-3")),
                () => u(t("px-4 py-3")),
                () => u(t("px-4 py-3 text-right")),
                () => u(t("font-medium tabular-nums", a(Se).className))
              ]
            ), A(we, Oe);
          }), M(
            (we, U, $, J, ie, Se, Oe, j, te) => {
              d(G, 1, we), d(K, 1, U), d(B, 1, $), d(le, 1, J), d(ce, 1, ie), d(ge, 1, Se), d(_e, 1, Oe), d(De, 1, j), d(ye, 1, te);
            },
            [
              () => u(t("overflow-x-auto")),
              () => u(t("w-full text-sm")),
              () => u(t("bg-gray-50 dark:bg-gray-700/50")),
              () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => u(t("px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => u(t("divide-y divide-gray-100 dark:divide-gray-700"))
            ]
          ), A(C, G);
        };
        ne(E, (C) => {
          a(s) && a(Ce).length === 0 ? C(S) : a(Ce).length === 0 ? C(P, 1) : a(Da) ? C(H, 2) : C(Q, -1);
        });
      }
      var z = x(E, 2);
      {
        var ue = (C) => {
          const G = /* @__PURE__ */ ee(() => Number(a(Ve).total_items_count)), K = /* @__PURE__ */ ee(() => a(G) > 0 ? a(xe) * ot + 1 : 0), B = /* @__PURE__ */ ee(() => Math.min((a(xe) + 1) * ot, a(G))), ae = /* @__PURE__ */ ee(() => Number(a(Ve).total_pages) > 1);
          var le = hf(), ce = h(le), ge = h(ce), _e = x(ge);
          {
            var De = (U) => {
              var $ = cf(), J = h($);
              M(
                (ie) => {
                  d($, 1, ie), O(J, `(Page ${a(xe) + 1} of ${a(Ve).total_pages ?? ""})`);
                },
                [() => u(t("ml-1"))]
              ), A(U, $);
            };
            ne(_e, (U) => {
              a(ae) && U(De);
            });
          }
          var ye = x(ce, 2);
          {
            var we = (U) => {
              var $ = pf(), J = h($), ie = x(J, 2);
              Lt(ie, 17, () => po(Number(a(Ve).total_pages), a(xe)), ri, (Oe, j) => {
                var te = Yn(), fe = kr(te);
                {
                  var be = (Pe) => {
                    var N = vf();
                    M((F) => d(N, 1, F), [() => u(t("px-1.5 text-xs text-gray-400"))]), A(Pe, N);
                  }, Te = (Pe) => {
                    var N = _f(), F = h(N);
                    M(
                      (D) => {
                        d(N, 1, D), O(F, a(j) + 1);
                      },
                      [
                        () => u(t("px-2.5 py-1 text-xs border rounded", a(xe) === a(j) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                      ]
                    ), Me("click", N, () => Pn(a(j))), A(Pe, N);
                  };
                  ne(fe, (Pe) => {
                    a(j) === "..." ? Pe(be) : Pe(Te, -1);
                  });
                }
                A(Oe, te);
              });
              var Se = x(ie, 2);
              M(
                (Oe, j, te, fe) => {
                  d($, 1, Oe), J.disabled = a(xe) === 0, d(J, 1, j), Se.disabled = te, d(Se, 1, fe);
                },
                [
                  () => u(t("flex items-center gap-1")),
                  () => u(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
                  () => a(xe) >= Number(a(Ve).total_pages) - 1,
                  () => u(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
                ]
              ), Me("click", J, () => Pn(a(xe) - 1)), Me("click", Se, () => Pn(a(xe) + 1)), A(U, $);
            };
            ne(ye, (U) => {
              a(ae) && U(we);
            });
          }
          M(
            (U, $) => {
              d(le, 1, U), d(ce, 1, $), O(ge, `Showing ${a(K) ?? ""}–${a(B) ?? ""} of ${a(G) ?? ""} `);
            },
            [
              () => u(t("p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3")),
              () => u(t("text-xs text-gray-500 dark:text-gray-400"))
            ]
          ), A(C, le);
        };
        ne(z, (C) => {
          a(Ve) && a(Ce).length > 0 && C(ue);
        });
      }
      M(
        (C, G) => {
          d(v, 1, C), d(g, 1, G);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 overflow-hidden sm:border sm:rounded-xl")),
          () => u(t("text-lg font-semibold px-4 py-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"))
        ]
      ), A(l, v);
    }, Lo = (l) => {
      var v = Tf(), g = h(v), E = x(g, 2), S = x(E, 2), P = h(S), H = h(P), Q = x(H, 2);
      {
        var z = (N) => {
          var F = mf();
          M((D) => d(F, 1, D), [() => u(t("text-sm text-gray-500 dark:text-gray-400"))]), A(N, F);
        }, ue = (N) => {
          var F = xf(), D = h(F);
          M(
            (I) => {
              d(F, 1, I), O(D, `Sending ${a(b)[a(Zt)[0]].symbol ?? ""}`);
            },
            [() => u(t("text-sm text-gray-900 dark:text-gray-100"))]
          ), A(N, F);
        }, C = (N) => {
          var F = bf();
          Lt(F, 20, () => a(Zt), (D) => D, (D, I) => {
            var oe = yf(), Le = h(oe), Ge = {};
            M(() => {
              O(Le, a(b)[I].symbol), Ge !== (Ge = I) && (oe.value = (oe.__value = I) ?? "");
            }), A(D, oe);
          }), M((D) => d(F, 1, D), [
            () => u(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), pl(F, () => a(Rt), (D) => L(Rt, D)), A(N, F);
        };
        ne(Q, (N) => {
          a(Zt).length === 0 ? N(z) : a(Zt).length === 1 ? N(ue, 1) : N(C, -1);
        });
      }
      var G = x(P, 2), K = h(G), B = x(K, 2), ae = x(B, 2);
      {
        var le = (N) => {
          var F = kf();
          M((D) => d(F, 1, D), [
            () => u(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(N, F);
        }, ce = (N) => {
          var F = wf(), D = h(F);
          M(
            (I) => {
              d(F, 1, I), O(D, a(Rn));
            },
            [
              () => u(t("text-xs text-gray-600 dark:text-gray-400 mt-1"))
            ]
          ), A(N, F);
        }, ge = (N) => {
          var F = Ef();
          M((D) => d(F, 1, D), [
            () => u(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
          ]), A(N, F);
        };
        ne(ae, (N) => {
          a(yr) && !a(wa) ? N(le) : a(Rn) ? N(ce, 1) : N(ge, -1);
        });
      }
      var _e = x(G, 2), De = h(_e), ye = h(De), we = h(ye), U = x(ye, 2), $ = x(De, 2), J = x($, 2);
      {
        var ie = (N) => {
          var F = Sf(), D = h(F);
          M(
            (I, oe, Le) => {
              d(F, 1, I), O(D, `Available ${oe ?? ""}
								· Network fee ${Le ?? ""}`);
            },
            [
              () => u(t("text-xs text-gray-500 dark:text-gray-400 mt-1")),
              () => Qt(a(Mn), a(ze).decimals, a(ze).symbol),
              () => Qt(a(Nn), a(ze).decimals, a(ze).symbol)
            ]
          ), A(N, F);
        };
        ne(J, (N) => {
          a(ze) && N(ie);
        });
      }
      var Se = x(J, 2);
      {
        var Oe = (N) => {
          var F = Af(), D = h(F);
          M(
            (I, oe) => {
              d(F, 1, I), O(D, `= ${oe ?? ""}`);
            },
            [
              () => u(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
              () => br(a(qt))
            ]
          ), A(N, F);
        };
        ne(Se, (N) => {
          a(qt) != null && a(qt) > 0 && N(Oe);
        });
      }
      var j = x(_e, 2), te = h(j), fe = x(te, 2), be = h(fe), Te = x(j, 2), Pe = h(Te);
      M(
        (N, F, D, I, oe, Le, Ge, $e, Dt, $t, er, un, Br, zn, me) => {
          d(v, 1, N), d(g, 1, F), d(E, 1, D), d(S, 1, I), d(H, 1, oe), d(K, 1, Le), d(B, 1, Ge), d(De, 1, $e), d(ye, 1, Dt), O(we, `Amount${a(ze) ? ` (${a(ze).symbol})` : ""}`), U.disabled = !a(ze) || a(Mn) <= a(Nn), d(U, 1, $t), d($, 1, er), d(j, 1, un), d(te, 1, Br), d(fe, 1, zn), O(be, `Sending from or to a subaccount is not supported by this realm version. Payments leave
							from the ${a(Y) ?? ""} fund, to the recipient's payout account when they registered one.`), Te.disabled = !a(Ea), d(Te, 1, me), O(Pe, a(s) ? "Sending…" : "Send");
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 p-4 sm:border sm:rounded-xl sm:p-6")),
          () => u(t("text-sm text-indigo-600 dark:text-indigo-400 mb-3 inline-flex items-center gap-1")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => u(t("space-y-4")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("flex items-center justify-between mb-1.5")),
          () => u(t("text-sm font-medium text-gray-700 dark:text-gray-300")),
          () => u(t("text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40")),
          () => u(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("rounded-lg border border-gray-200 dark:border-gray-700")),
          () => u(t("px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none")),
          () => u(t("px-3 pb-3 pt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700")),
          () => u(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), Me("click", g, () => {
        L(_, "activity");
      }), el("submit", S, (N) => {
        N.preventDefault(), _o();
      }), Gn(B, () => a(sn), (N) => L(sn, N)), Me("click", U, fo), Gn($, () => a(Pr), (N) => L(Pr, N)), A(l, v);
    }, Io = (l) => {
      var v = Mf(), g = h(v), E = x(g, 2);
      M(
        (S, P, H) => {
          d(v, 1, S), d(g, 1, P), d(E, 1, H);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => u(t("text-sm text-amber-700 dark:text-amber-400"))
        ]
      ), A(l, v);
    }, Fo = (l) => {
      var v = If(), g = h(v), E = x(g, 2), S = h(E), P = h(S);
      {
        var H = (j) => {
          Sl(j);
        };
        ne(P, (j) => {
          a(s) && j(H);
        });
      }
      var Q = x(P), z = x(E, 2), ue = h(z), C = x(ue, 2), G = x(C, 2), K = h(G), B = x(K, 2), ae = x(B, 2), le = x(ae, 2), ce = x(z, 2), ge = h(ce), _e = h(ge), De = h(_e), ye = x(_e, 2);
      {
        var we = (j) => {
          var te = Rf();
          Lt(te, 23, () => a(de), (fe, be) => fe._id ?? fe.principal ?? fe.id ?? be, (fe, be) => {
            const Te = /* @__PURE__ */ ee(() => Sa(a(be).token)), Pe = /* @__PURE__ */ ee(() => a(be).principal || a(be)._id || a(be).id), N = /* @__PURE__ */ ee(() => jr(a(Pe)));
            var F = Nf(), D = h(F), I = h(D), oe = x(D, 2), Le = h(oe);
            M(
              (Ge, $e, Dt, $t, er) => {
                d(F, 1, Ge), d(D, 1, $e), Be(D, "title", a(N).title), O(I, a(N).display), d(oe, 1, Dt), Be(oe, "title", $t), O(Le, er);
              },
              [
                () => u(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => u(t("text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => u(t("text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums")),
                () => br(a(be).amount || 0),
                () => Qt(a(be).amount || 0, a(Te).decimals, a(Te).symbol)
              ]
            ), A(fe, F);
          }), M((fe) => d(te, 1, fe), [() => u(t("space-y-2 max-h-80 overflow-auto"))]), A(j, te);
        }, U = (j) => {
          var te = Cf();
          M((fe) => d(te, 1, fe), [() => u(t("text-gray-500 dark:text-gray-400 text-sm"))]), A(j, te);
        };
        ne(ye, (j) => {
          a(de).length > 0 ? j(we) : j(U, -1);
        });
      }
      var $ = x(ge, 2), J = h($), ie = x(J, 2);
      {
        var Se = (j) => {
          var te = Df(), fe = h(te);
          M(
            (be) => {
              d(te, 1, be), O(fe, `Total transfers: ${a(Ve).total_items_count ?? ""}`);
            },
            [() => u(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), A(j, te);
        }, Oe = (j) => {
          var te = Lf();
          M((fe) => d(te, 1, fe), [() => u(t("text-gray-500 dark:text-gray-400 text-sm"))]), A(j, te);
        };
        ne(ie, (j) => {
          a(Ve) ? j(Se) : j(Oe, -1);
        });
      }
      M(
        (j, te, fe, be, Te, Pe, N, F, D, I, oe, Le, Ge, $e, Dt) => {
          d(v, 1, j), d(g, 1, te), d(E, 1, fe), S.disabled = a(s), d(S, 1, be), O(Q, ` ${a(s) ? "Refreshing…" : "Full Vault Refresh"}`), d(z, 1, Te), d(ue, 1, Pe), d(C, 1, N), d(G, 1, F), d(K, 1, D), d(B, 1, I), d(ae, 1, oe), d(le, 1, Le), d(ce, 1, Ge), d(_e, 1, $e), O(De, `All Balances in System (${a(de).length ?? ""})`), d(J, 1, Dt);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => u(t("mb-4")),
          () => u(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => u(t("mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700")),
          () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("text-xs text-gray-500 dark:text-gray-400 mb-3")),
          () => u(t("flex items-center gap-3")),
          () => u(t("text-sm text-gray-700 dark:text-gray-300")),
          () => u(t("w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100")),
          () => u(t("text-sm text-gray-500 dark:text-gray-400")),
          () => u(t("px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60")),
          () => u(t("space-y-6")),
          () => u(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("font-semibold text-gray-700 dark:text-gray-300 mb-2"))
        ]
      ), Me("click", S, On), Gn(B, () => a(Or), (j) => L(Or, j)), Me("click", le, no), A(l, v);
    };
    ne(Co, (l) => {
      a(_) === "activity" ? l(Do) : a(_) === "send" ? l(Lo, 1) : a(_) === "lookup" ? l(Io, 2) : a(_) === "admin" && l(Fo, 3);
    });
  }
  M(
    (l, v, g, E, S, P, H, Q, z, ue, C, G, K, B) => {
      d(jn, 1, l), d(Vn, 1, v), d(La, 1, g), d(Fa, 1, E), d(Oa, 1, S), O(go, kl), fn.disabled = a(s), d(fn, 1, P), d(Pa, 1, H), d(Bn, 1, Q), d(Va, 1, z), d(Ba, 1, ue), d(qn, 1, C), d(qa, 1, G), d(Vr, 1, K), Be(Vr, "title", y), O(bo, y || "Loading…"), d(Hn, 1, B);
    },
    [
      () => u(t("w-full py-3 sm:py-6 space-y-4 sm:space-y-6")),
      () => u(t("flex flex-col gap-2")),
      () => u(t("flex justify-between items-start gap-4")),
      () => u(t("text-2xl font-bold text-gray-900 dark:text-gray-100")),
      () => u(t("text-sm text-gray-500 dark:text-gray-400 mt-1")),
      () => u(t("p-2 rounded-lg text-gray-500 dark:text-gray-400", "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200", "disabled:opacity-50 disabled:cursor-not-allowed transition-colors")),
      () => u(t(a(s) ? "inline-block animate-spin" : "")),
      () => u(t("rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50")),
      () => u(t("px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none")),
      () => u(t("px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3")),
      () => u(t("flex flex-wrap items-center gap-2")),
      () => u(t("text-xs font-medium text-gray-500 dark:text-gray-400")),
      () => u(t("font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline")),
      () => u(t("flex border-b border-gray-200 dark:border-gray-700"))
    ]
  ), Me("click", fn, On), Me("click", Vr, () => Ct(y)), A(e, jn), _i();
}
tl(["click"]);
function Vf(e, r) {
  const t = il(Of, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        sl(t);
      } catch {
      }
    }
  };
}
export {
  Vf as default
};
