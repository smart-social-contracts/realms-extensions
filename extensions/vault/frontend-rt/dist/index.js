var ao = Object.defineProperty;
var ya = (e) => {
  throw TypeError(e);
};
var io = (e, r, t) => r in e ? ao(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var ot = (e, r, t) => io(e, typeof r != "symbol" ? r + "" : r, t), On = (e, r, t) => r.has(e) || ya("Cannot " + t);
var l = (e, r, t) => (On(e, r, "read from private field"), t ? t.call(e) : r.get(e)), H = (e, r, t) => r.has(e) ? ya("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), G = (e, r, t, n) => (On(e, r, "write to private field"), n ? n.call(e, t) : r.set(e, t), t), ue = (e, r, t) => (On(e, r, "access private method"), t);
var Qn = Array.isArray, oo = Array.prototype.indexOf, Sr = Array.prototype.includes, pn = Array.from, so = Object.defineProperty, Rr = Object.getOwnPropertyDescriptor, lo = Object.prototype, fo = Array.prototype, uo = Object.getPrototypeOf, ma = Object.isExtensible;
const co = () => {
};
function vo(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function Oa() {
  var e, r, t = new Promise((n, a) => {
    e = n, r = a;
  });
  return { promise: t, resolve: e, reject: r };
}
function _o(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const n of e)
    if (t.push(n), t.length === r) break;
  return t;
}
const Le = 2, Tr = 4, bn = 8, Ra = 1 << 24, xt = 16, ct = 32, qt = 64, Bn = 128, $e = 512, Se = 1024, Pe = 2048, yt = 4096, Ie = 8192, et = 16384, gr = 32768, ka = 1 << 25, cr = 65536, Vn = 1 << 17, ho = 1 << 18, Pr = 1 << 19, go = 1 << 20, bt = 1 << 25, vr = 65536, cn = 1 << 21, Vr = 1 << 22, Bt = 1 << 23, Fr = Symbol("$state"), Nt = new class extends Error {
  constructor() {
    super(...arguments);
    ot(this, "name", "StaleReactionError");
    ot(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function po() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function bo(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function xo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function yo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function mo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function ko() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function wo() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Eo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function So() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function To() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Ao = 1, No = 2, Fa = 4, Mo = 8, Po = 16, Lo = 1, Do = 2, Ae = Symbol(), Ia = "http://www.w3.org/1999/xhtml", Co = "http://www.w3.org/2000/svg", Oo = "http://www.w3.org/1998/Math/MathML";
function Ro() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Fo() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Io() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function ja(e) {
  return e === this.v;
}
function jo(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function Ba(e) {
  return !jo(e, this.v);
}
let rt = null;
function Ar(e) {
  rt = e;
}
function Va(e, r = !1, t) {
  rt = {
    p: rt,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      J
    ),
    l: null
  };
}
function Ha(e) {
  var r = (
    /** @type {ComponentContext} */
    rt
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var n of t)
      li(n);
  }
  return r.i = !0, rt = r.p, /** @type {T} */
  {};
}
function qa() {
  return !0;
}
let tr = [];
function za() {
  var e = tr;
  tr = [], vo(e);
}
function Vt(e) {
  if (tr.length === 0 && !Ir) {
    var r = tr;
    queueMicrotask(() => {
      r === tr && za();
    });
  }
  tr.push(e);
}
function Bo() {
  for (; tr.length > 0; )
    za();
}
function Ua(e) {
  var r = J;
  if (r === null)
    return K.f |= Bt, e;
  if ((r.f & gr) === 0 && (r.f & Tr) === 0)
    throw e;
  It(e, r);
}
function It(e, r) {
  for (; r !== null; ) {
    if ((r.f & Bn) !== 0) {
      if ((r.f & gr) === 0)
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
const Vo = -7169;
function xe(e, r) {
  e.f = e.f & Vo | r;
}
function $n(e) {
  (e.f & $e) !== 0 || e.deps === null ? xe(e, Se) : xe(e, yt);
}
function Ya(e) {
  if (e !== null)
    for (const r of e)
      (r.f & Le) === 0 || (r.f & vr) === 0 || (r.f ^= vr, Ya(
        /** @type {Derived} */
        r.deps
      ));
}
function Wa(e, r, t) {
  (e.f & Pe) !== 0 ? r.add(e) : (e.f & yt) !== 0 && t.add(e), Ya(e.deps), xe(e, Se);
}
const Qt = /* @__PURE__ */ new Set();
let V = null, ut = null, Hn = null, Ir = !1, Rn = !1, xr = null, an = null;
var wa = 0;
let Ho = 1;
var yr, mr, ar, Mt, _t, zr, Ye, Ur, Rt, Pt, ht, kr, wr, ir, ke, on, Ga, sn, qn, ln, qo;
const _n = class _n {
  constructor() {
    H(this, ke);
    ot(this, "id", Ho++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    ot(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    ot(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    H(this, yr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    H(this, mr, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    H(this, ar, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    H(this, Mt, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    H(this, _t, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    H(this, zr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    H(this, Ye, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    H(this, Ur, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    H(this, Rt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    H(this, Pt, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    H(this, ht, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    H(this, kr, /* @__PURE__ */ new Set());
    ot(this, "is_fork", !1);
    H(this, wr, !1);
    /** @type {Set<Batch>} */
    H(this, ir, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    l(this, ht).has(r) || l(this, ht).set(r, { d: [], m: [] }), l(this, kr).delete(r);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(r, t = (n) => this.schedule(n)) {
    var n = l(this, ht).get(r);
    if (n) {
      l(this, ht).delete(r);
      for (var a of n.d)
        xe(a, Pe), t(a);
      for (a of n.m)
        xe(a, yt), t(a);
    }
    l(this, kr).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, n = !1) {
    r.v !== Ae && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & Bt) === 0 && (this.current.set(r, [t, n]), ut?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    V = this;
  }
  deactivate() {
    V = null, ut = null;
  }
  flush() {
    try {
      Rn = !0, V = this, ue(this, ke, sn).call(this);
    } finally {
      wa = 0, Hn = null, xr = null, an = null, Rn = !1, V = null, ut = null, fr.clear();
    }
  }
  discard() {
    for (const r of l(this, mr)) r(this);
    l(this, mr).clear(), l(this, ar).clear(), Qt.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    l(this, Ur).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    let n = l(this, Mt).get(t) ?? 0;
    if (l(this, Mt).set(t, n + 1), r) {
      let a = l(this, _t).get(t) ?? 0;
      l(this, _t).set(t, a + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(r, t, n) {
    let a = l(this, Mt).get(t) ?? 0;
    if (a === 1 ? l(this, Mt).delete(t) : l(this, Mt).set(t, a - 1), r) {
      let o = l(this, _t).get(t) ?? 0;
      o === 1 ? l(this, _t).delete(t) : l(this, _t).set(t, o - 1);
    }
    l(this, wr) || n || (G(this, wr, !0), Vt(() => {
      G(this, wr, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(r, t) {
    for (const n of r)
      l(this, Rt).add(n);
    for (const n of t)
      l(this, Pt).add(n);
    r.clear(), t.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(r) {
    l(this, yr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    l(this, mr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(r) {
    l(this, ar).add(r);
  }
  run_fork_commit_callbacks() {
    for (const r of l(this, ar)) r(this);
    l(this, ar).clear();
  }
  settled() {
    return (l(this, zr) ?? G(this, zr, Oa())).promise;
  }
  static ensure() {
    if (V === null) {
      const r = V = new _n();
      Rn || (Qt.add(V), Ir || Vt(() => {
        V === r && r.flush();
      }));
    }
    return V;
  }
  apply() {
    {
      ut = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if (Hn = r, r.b?.is_pending && (r.f & (Tr | bn | Ra)) !== 0 && (r.f & gr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var n = t.f;
      if (xr !== null && t === J && (K === null || (K.f & Le) === 0))
        return;
      if ((n & (qt | ct)) !== 0) {
        if ((n & Se) === 0)
          return;
        t.f ^= Se;
      }
    }
    l(this, Ye).push(t);
  }
};
yr = new WeakMap(), mr = new WeakMap(), ar = new WeakMap(), Mt = new WeakMap(), _t = new WeakMap(), zr = new WeakMap(), Ye = new WeakMap(), Ur = new WeakMap(), Rt = new WeakMap(), Pt = new WeakMap(), ht = new WeakMap(), kr = new WeakMap(), wr = new WeakMap(), ir = new WeakMap(), ke = new WeakSet(), on = function() {
  return this.is_fork || l(this, _t).size > 0;
}, Ga = function() {
  for (const n of l(this, ir))
    for (const a of l(n, _t).keys()) {
      for (var r = !1, t = a; t.parent !== null; ) {
        if (l(this, ht).has(t)) {
          r = !0;
          break;
        }
        t = t.parent;
      }
      if (!r)
        return !0;
    }
  return !1;
}, sn = function() {
  var c;
  if (wa++ > 1e3 && (Qt.delete(this), Uo()), !ue(this, ke, on).call(this)) {
    for (const s of l(this, Rt))
      l(this, Pt).delete(s), xe(s, Pe), this.schedule(s);
    for (const s of l(this, Pt))
      xe(s, yt), this.schedule(s);
  }
  const r = l(this, Ye);
  G(this, Ye, []), this.apply();
  var t = xr = [], n = [], a = an = [];
  for (const s of r)
    try {
      ue(this, ke, qn).call(this, s, t, n);
    } catch (v) {
      throw Xa(s), v;
    }
  if (V = null, a.length > 0) {
    var o = _n.ensure();
    for (const s of a)
      o.schedule(s);
  }
  if (xr = null, an = null, ue(this, ke, on).call(this) || ue(this, ke, Ga).call(this)) {
    ue(this, ke, ln).call(this, n), ue(this, ke, ln).call(this, t);
    for (const [s, v] of l(this, ht))
      Ja(s, v);
  } else {
    l(this, Mt).size === 0 && Qt.delete(this), l(this, Rt).clear(), l(this, Pt).clear();
    for (const s of l(this, yr)) s(this);
    l(this, yr).clear(), Ea(n), Ea(t), l(this, zr)?.resolve();
  }
  var f = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    V
  );
  if (l(this, Ye).length > 0) {
    const s = f ?? (f = this);
    l(s, Ye).push(...l(this, Ye).filter((v) => !l(s, Ye).includes(v)));
  }
  f !== null && (Qt.add(f), ue(c = f, ke, sn).call(c));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
qn = function(r, t, n) {
  r.f ^= Se;
  for (var a = r.first; a !== null; ) {
    var o = a.f, f = (o & (ct | qt)) !== 0, c = f && (o & Se) !== 0, s = c || (o & Ie) !== 0 || l(this, ht).has(a);
    if (!s && a.fn !== null) {
      f ? a.f ^= Se : (o & Tr) !== 0 ? t.push(a) : Xr(a) && ((o & xt) !== 0 && l(this, Pt).add(a), Mr(a));
      var v = a.first;
      if (v !== null) {
        a = v;
        continue;
      }
    }
    for (; a !== null; ) {
      var p = a.next;
      if (p !== null) {
        a = p;
        break;
      }
      a = a.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
ln = function(r) {
  for (var t = 0; t < r.length; t += 1)
    Wa(r[t], l(this, Rt), l(this, Pt));
}, qo = function() {
  var p, N, y;
  for (const w of Qt) {
    var r = w.id < this.id, t = [];
    for (const [k, [I, m]] of this.current) {
      if (w.current.has(k)) {
        var n = (
          /** @type {[any, boolean]} */
          w.current.get(k)[0]
        );
        if (r && I !== n)
          w.current.set(k, [I, m]);
        else
          continue;
      }
      t.push(k);
    }
    var a = [...w.current.keys()].filter((k) => !this.current.has(k));
    if (a.length === 0)
      r && w.discard();
    else if (t.length > 0) {
      if (r)
        for (const k of l(this, kr))
          w.unskip_effect(k, (I) => {
            var m;
            (I.f & (xt | Vr)) !== 0 ? w.schedule(I) : ue(m = w, ke, ln).call(m, [I]);
          });
      w.activate();
      var o = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
      for (var c of t)
        Ka(c, a, o, f);
      f = /* @__PURE__ */ new Map();
      var s = [...w.current.keys()].filter(
        (k) => this.current.has(k) ? (
          /** @type {[any, boolean]} */
          this.current.get(k)[0] !== k
        ) : !0
      );
      for (const k of l(this, Ur))
        (k.f & (et | Ie | Vn)) === 0 && ea(k, s, f) && ((k.f & (Vr | xt)) !== 0 ? (xe(k, Pe), w.schedule(k)) : l(w, Rt).add(k));
      if (l(w, Ye).length > 0) {
        w.apply();
        for (var v of l(w, Ye))
          ue(p = w, ke, qn).call(p, v, [], []);
        G(w, Ye, []);
      }
      w.deactivate();
    }
  }
  for (const w of Qt)
    l(w, ir).has(this) && (l(w, ir).delete(this), l(w, ir).size === 0 && !ue(N = w, ke, on).call(N) && (w.activate(), ue(y = w, ke, sn).call(y)));
};
let _r = _n;
function zo(e) {
  var r = Ir;
  Ir = !0;
  try {
    for (var t; ; ) {
      if (Bo(), V === null)
        return (
          /** @type {T} */
          t
        );
      V.flush();
    }
  } finally {
    Ir = r;
  }
}
function Uo() {
  try {
    ko();
  } catch (e) {
    It(e, Hn);
  }
}
let At = null;
function Ea(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var n = e[t++];
      if ((n.f & (et | Ie)) === 0 && Xr(n) && (At = /* @__PURE__ */ new Set(), Mr(n), n.deps === null && n.first === null && n.nodes === null && n.teardown === null && n.ac === null && ci(n), At?.size > 0)) {
        fr.clear();
        for (const a of At) {
          if ((a.f & (et | Ie)) !== 0) continue;
          const o = [a];
          let f = a.parent;
          for (; f !== null; )
            At.has(f) && (At.delete(f), o.push(f)), f = f.parent;
          for (let c = o.length - 1; c >= 0; c--) {
            const s = o[c];
            (s.f & (et | Ie)) === 0 && Mr(s);
          }
        }
        At.clear();
      }
    }
    At = null;
  }
}
function Ka(e, r, t, n) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const a of e.reactions) {
      const o = a.f;
      (o & Le) !== 0 ? Ka(
        /** @type {Derived} */
        a,
        r,
        t,
        n
      ) : (o & (Vr | xt)) !== 0 && (o & Pe) === 0 && ea(a, r, n) && (xe(a, Pe), ta(
        /** @type {Effect} */
        a
      ));
    }
}
function ea(e, r, t) {
  const n = t.get(e);
  if (n !== void 0) return n;
  if (e.deps !== null)
    for (const a of e.deps) {
      if (Sr.call(r, a))
        return !0;
      if ((a.f & Le) !== 0 && ea(
        /** @type {Derived} */
        a,
        r,
        t
      ))
        return t.set(
          /** @type {Derived} */
          a,
          !0
        ), !0;
    }
  return t.set(e, !1), !1;
}
function ta(e) {
  V.schedule(e);
}
function Ja(e, r) {
  if (!((e.f & ct) !== 0 && (e.f & Se) !== 0)) {
    (e.f & Pe) !== 0 ? r.d.push(e) : (e.f & yt) !== 0 && r.m.push(e), xe(e, Se);
    for (var t = e.first; t !== null; )
      Ja(t, r), t = t.next;
  }
}
function Xa(e) {
  xe(e, Se);
  for (var r = e.first; r !== null; )
    Xa(r), r = r.next;
}
function Yo(e) {
  let r = 0, t = hr(0), n;
  return () => {
    aa() && (i(t), fi(() => (r === 0 && (n = ki(() => e(() => jr(t)))), r += 1, () => {
      Vt(() => {
        r -= 1, r === 0 && (n?.(), n = void 0, jr(t));
      });
    })));
  };
}
var Wo = cr | Pr;
function Go(e, r, t, n) {
  new Ko(e, r, t, n);
}
var Je, Zn, Xe, or, je, Ze, Fe, We, Lt, sr, Ft, Er, Yr, Wr, Dt, hn, pe, Jo, Xo, Zo, zn, fn, un, Un, Yn;
class Ko {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, n, a) {
    H(this, pe);
    /** @type {Boundary | null} */
    ot(this, "parent");
    ot(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    ot(this, "transform_error");
    /** @type {TemplateNode} */
    H(this, Je);
    /** @type {TemplateNode | null} */
    H(this, Zn, null);
    /** @type {BoundaryProps} */
    H(this, Xe);
    /** @type {((anchor: Node) => void)} */
    H(this, or);
    /** @type {Effect} */
    H(this, je);
    /** @type {Effect | null} */
    H(this, Ze, null);
    /** @type {Effect | null} */
    H(this, Fe, null);
    /** @type {Effect | null} */
    H(this, We, null);
    /** @type {DocumentFragment | null} */
    H(this, Lt, null);
    H(this, sr, 0);
    H(this, Ft, 0);
    H(this, Er, !1);
    /** @type {Set<Effect>} */
    H(this, Yr, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    H(this, Wr, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    H(this, Dt, null);
    H(this, hn, Yo(() => (G(this, Dt, hr(l(this, sr))), () => {
      G(this, Dt, null);
    })));
    G(this, Je, r), G(this, Xe, t), G(this, or, (o) => {
      var f = (
        /** @type {Effect} */
        J
      );
      f.b = this, f.f |= Bn, n(o);
    }), this.parent = /** @type {Effect} */
    J.b, this.transform_error = a ?? this.parent?.transform_error ?? ((o) => o), G(this, je, yn(() => {
      ue(this, pe, zn).call(this);
    }, Wo));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    Wa(r, l(this, Yr), l(this, Wr));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!l(this, Xe).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    ue(this, pe, Un).call(this, r, t), G(this, sr, l(this, sr) + r), !(!l(this, Dt) || l(this, Er)) && (G(this, Er, !0), Vt(() => {
      G(this, Er, !1), l(this, Dt) && Nr(l(this, Dt), l(this, sr));
    }));
  }
  get_effect_pending() {
    return l(this, hn).call(this), i(
      /** @type {Source<number>} */
      l(this, Dt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!l(this, Xe).onerror && !l(this, Xe).failed)
      throw r;
    V?.is_fork ? (l(this, Ze) && V.skip_effect(l(this, Ze)), l(this, Fe) && V.skip_effect(l(this, Fe)), l(this, We) && V.skip_effect(l(this, We)), V.on_fork_commit(() => {
      ue(this, pe, Yn).call(this, r);
    })) : ue(this, pe, Yn).call(this, r);
  }
}
Je = new WeakMap(), Zn = new WeakMap(), Xe = new WeakMap(), or = new WeakMap(), je = new WeakMap(), Ze = new WeakMap(), Fe = new WeakMap(), We = new WeakMap(), Lt = new WeakMap(), sr = new WeakMap(), Ft = new WeakMap(), Er = new WeakMap(), Yr = new WeakMap(), Wr = new WeakMap(), Dt = new WeakMap(), hn = new WeakMap(), pe = new WeakSet(), Jo = function() {
  try {
    G(this, Ze, Qe(() => l(this, or).call(this, l(this, Je))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Xo = function(r) {
  const t = l(this, Xe).failed;
  t && G(this, We, Qe(() => {
    t(
      l(this, Je),
      () => r,
      () => () => {
      }
    );
  }));
}, Zo = function() {
  const r = l(this, Xe).pending;
  r && (this.is_pending = !0, G(this, Fe, Qe(() => r(l(this, Je)))), Vt(() => {
    var t = G(this, Lt, document.createDocumentFragment()), n = Ht();
    t.append(n), G(this, Ze, ue(this, pe, un).call(this, () => Qe(() => l(this, or).call(this, n)))), l(this, Ft) === 0 && (l(this, Je).before(t), G(this, Lt, null), ur(
      /** @type {Effect} */
      l(this, Fe),
      () => {
        G(this, Fe, null);
      }
    ), ue(this, pe, fn).call(
      this,
      /** @type {Batch} */
      V
    ));
  }));
}, zn = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), G(this, Ft, 0), G(this, sr, 0), G(this, Ze, Qe(() => {
      l(this, or).call(this, l(this, Je));
    })), l(this, Ft) > 0) {
      var r = G(this, Lt, document.createDocumentFragment());
      la(l(this, Ze), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        l(this, Xe).pending
      );
      G(this, Fe, Qe(() => t(l(this, Je))));
    } else
      ue(this, pe, fn).call(
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
fn = function(r) {
  this.is_pending = !1, r.transfer_effects(l(this, Yr), l(this, Wr));
}, /**
 * @template T
 * @param {() => T} fn
 */
un = function(r) {
  var t = J, n = K, a = rt;
  mt(l(this, je)), nt(l(this, je)), Ar(l(this, je).ctx);
  try {
    return _r.ensure(), r();
  } catch (o) {
    return Ua(o), null;
  } finally {
    mt(t), nt(n), Ar(a);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Un = function(r, t) {
  var n;
  if (!this.has_pending_snippet()) {
    this.parent && ue(n = this.parent, pe, Un).call(n, r, t);
    return;
  }
  G(this, Ft, l(this, Ft) + r), l(this, Ft) === 0 && (ue(this, pe, fn).call(this, t), l(this, Fe) && ur(l(this, Fe), () => {
    G(this, Fe, null);
  }), l(this, Lt) && (l(this, Je).before(l(this, Lt)), G(this, Lt, null)));
}, /**
 * @param {unknown} error
 */
Yn = function(r) {
  l(this, Ze) && (Ve(l(this, Ze)), G(this, Ze, null)), l(this, Fe) && (Ve(l(this, Fe)), G(this, Fe, null)), l(this, We) && (Ve(l(this, We)), G(this, We, null));
  var t = l(this, Xe).onerror;
  let n = l(this, Xe).failed;
  var a = !1, o = !1;
  const f = () => {
    if (a) {
      Io();
      return;
    }
    a = !0, o && To(), l(this, We) !== null && ur(l(this, We), () => {
      G(this, We, null);
    }), ue(this, pe, un).call(this, () => {
      ue(this, pe, zn).call(this);
    });
  }, c = (s) => {
    try {
      o = !0, t?.(s, f), o = !1;
    } catch (v) {
      It(v, l(this, je) && l(this, je).parent);
    }
    n && G(this, We, ue(this, pe, un).call(this, () => {
      try {
        return Qe(() => {
          var v = (
            /** @type {Effect} */
            J
          );
          v.b = this, v.f |= Bn, n(
            l(this, Je),
            () => s,
            () => f
          );
        });
      } catch (v) {
        return It(
          v,
          /** @type {Effect} */
          l(this, je).parent
        ), null;
      }
    }));
  };
  Vt(() => {
    var s;
    try {
      s = this.transform_error(r);
    } catch (v) {
      It(v, l(this, je) && l(this, je).parent);
      return;
    }
    s !== null && typeof s == "object" && typeof /** @type {any} */
    s.then == "function" ? s.then(
      c,
      /** @param {unknown} e */
      (v) => It(v, l(this, je) && l(this, je).parent)
    ) : c(s);
  });
};
function Qo(e, r, t, n) {
  const a = ra;
  var o = e.filter((y) => !y.settled);
  if (t.length === 0 && o.length === 0) {
    n(r.map(a));
    return;
  }
  var f = (
    /** @type {Effect} */
    J
  ), c = $o(), s = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((y) => y.promise)) : null;
  function v(y) {
    c();
    try {
      n(y);
    } catch (w) {
      (f.f & et) === 0 && It(w, f);
    }
    vn();
  }
  if (t.length === 0) {
    s.then(() => v(r.map(a)));
    return;
  }
  var p = Za();
  function N() {
    Promise.all(t.map((y) => /* @__PURE__ */ es(y))).then((y) => v([...r.map(a), ...y])).catch((y) => It(y, f)).finally(() => p());
  }
  s ? s.then(() => {
    c(), N(), vn();
  }) : N();
}
function $o() {
  var e = (
    /** @type {Effect} */
    J
  ), r = K, t = rt, n = (
    /** @type {Batch} */
    V
  );
  return function(o = !0) {
    mt(e), nt(r), Ar(t), o && (e.f & et) === 0 && (n?.activate(), n?.apply());
  };
}
function vn(e = !0) {
  mt(null), nt(null), Ar(null), e && V?.deactivate();
}
function Za() {
  var e = (
    /** @type {Effect} */
    J
  ), r = (
    /** @type {Boundary} */
    e.b
  ), t = (
    /** @type {Batch} */
    V
  ), n = r.is_rendered();
  return r.update_pending_count(1, t), t.increment(n, e), (a = !1) => {
    r.update_pending_count(-1, t), t.decrement(n, e, a);
  };
}
// @__NO_SIDE_EFFECTS__
function ra(e) {
  var r = Le | Pe;
  return J !== null && (J.f |= Pr), {
    ctx: rt,
    deps: null,
    effects: null,
    equals: ja,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Ae
    ),
    wv: 0,
    parent: J,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function es(e, r, t) {
  let n = (
    /** @type {Effect | null} */
    J
  );
  n === null && po();
  var a = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = hr(
    /** @type {V} */
    Ae
  ), f = !K, c = /* @__PURE__ */ new Map();
  return hs(() => {
    var s = (
      /** @type {Effect} */
      J
    ), v = Oa();
    a = v.promise;
    try {
      Promise.resolve(e()).then(v.resolve, v.reject).finally(vn);
    } catch (w) {
      v.reject(w), vn();
    }
    var p = (
      /** @type {Batch} */
      V
    );
    if (f) {
      if ((s.f & gr) !== 0)
        var N = Za();
      if (
        /** @type {Boundary} */
        n.b.is_rendered()
      )
        c.get(p)?.reject(Nt), c.delete(p);
      else {
        for (const w of c.values())
          w.reject(Nt);
        c.clear();
      }
      c.set(p, v);
    }
    const y = (w, k = void 0) => {
      if (N) {
        var I = k === Nt;
        N(I);
      }
      if (!(k === Nt || (s.f & et) !== 0)) {
        if (p.activate(), k)
          o.f |= Bt, Nr(o, k);
        else {
          (o.f & Bt) !== 0 && (o.f ^= Bt), Nr(o, w);
          for (const [m, U] of c) {
            if (c.delete(m), m === p) break;
            U.reject(Nt);
          }
        }
        p.deactivate();
      }
    };
    v.promise.then(y, (w) => y(null, w || "unknown"));
  }), ia(() => {
    for (const s of c.values())
      s.reject(Nt);
  }), new Promise((s) => {
    function v(p) {
      function N() {
        p === a ? s(o) : v(a);
      }
      p.then(N, N);
    }
    v(a);
  });
}
// @__NO_SIDE_EFFECTS__
function $t(e) {
  const r = /* @__PURE__ */ ra(e);
  return hi(r), r;
}
// @__NO_SIDE_EFFECTS__
function ts(e) {
  const r = /* @__PURE__ */ ra(e);
  return r.equals = Ba, r;
}
function rs(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      Ve(
        /** @type {Effect} */
        r[t]
      );
  }
}
function na(e) {
  var r, t = J, n = e.parent;
  if (!zt && n !== null && (n.f & (et | Ie)) !== 0)
    return Ro(), e.v;
  mt(n);
  try {
    e.f &= ~vr, rs(e), r = xi(e);
  } finally {
    mt(t);
  }
  return r;
}
function Qa(e) {
  var r = na(e);
  if (!e.equals(r) && (e.wv = pi(), (!V?.is_fork || e.deps === null) && (V !== null ? V.capture(e, r, !0) : e.v = r, e.deps === null))) {
    xe(e, Se);
    return;
  }
  zt || (ut !== null ? (aa() || V?.is_fork) && ut.set(e, r) : $n(e));
}
function ns(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(Nt), r.teardown = co, r.ac = null, Hr(r, 0), oa(r));
}
function $a(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && Mr(r);
}
let Wn = /* @__PURE__ */ new Set();
const fr = /* @__PURE__ */ new Map();
let ei = !1;
function hr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: ja,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function z(e, r) {
  const t = hr(e);
  return hi(t), t;
}
// @__NO_SIDE_EFFECTS__
function as(e, r = !1, t = !0) {
  const n = hr(e);
  return r || (n.equals = Ba), n;
}
function b(e, r, t = !1) {
  K !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!dt || (K.f & Vn) !== 0) && qa() && (K.f & (Le | xt | Vr | Vn)) !== 0 && (tt === null || !Sr.call(tt, e)) && So();
  let n = t ? pt(r) : r;
  return Nr(e, n, an);
}
function Nr(e, r, t = null) {
  if (!e.equals(r)) {
    fr.set(e, zt ? r : e.v);
    var n = _r.ensure();
    if (n.capture(e, r), (e.f & Le) !== 0) {
      const a = (
        /** @type {Derived} */
        e
      );
      (e.f & Pe) !== 0 && na(a), ut === null && $n(a);
    }
    e.wv = pi(), ti(e, Pe, t), J !== null && (J.f & Se) !== 0 && (J.f & (ct | qt)) === 0 && (Ke === null ? ps([e]) : Ke.push(e)), !n.is_fork && Wn.size > 0 && !ei && is();
  }
  return r;
}
function is() {
  ei = !1;
  for (const e of Wn)
    (e.f & Se) !== 0 && xe(e, yt), Xr(e) && Mr(e);
  Wn.clear();
}
function jr(e) {
  b(e, e.v + 1);
}
function ti(e, r, t) {
  var n = e.reactions;
  if (n !== null)
    for (var a = n.length, o = 0; o < a; o++) {
      var f = n[o], c = f.f, s = (c & Pe) === 0;
      if (s && xe(f, r), (c & Le) !== 0) {
        var v = (
          /** @type {Derived} */
          f
        );
        ut?.delete(v), (c & vr) === 0 && (c & $e && (J === null || (J.f & cn) === 0) && (f.f |= vr), ti(v, yt, t));
      } else if (s) {
        var p = (
          /** @type {Effect} */
          f
        );
        (c & xt) !== 0 && At !== null && At.add(p), t !== null ? t.push(p) : ta(p);
      }
    }
}
function pt(e) {
  if (typeof e != "object" || e === null || Fr in e)
    return e;
  const r = uo(e);
  if (r !== lo && r !== fo)
    return e;
  var t = /* @__PURE__ */ new Map(), n = Qn(e), a = /* @__PURE__ */ z(0), o = dr, f = (c) => {
    if (dr === o)
      return c();
    var s = K, v = dr;
    nt(null), Ma(o);
    var p = c();
    return nt(s), Ma(v), p;
  };
  return n && t.set("length", /* @__PURE__ */ z(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(c, s, v) {
        (!("value" in v) || v.configurable === !1 || v.enumerable === !1 || v.writable === !1) && wo();
        var p = t.get(s);
        return p === void 0 ? f(() => {
          var N = /* @__PURE__ */ z(v.value);
          return t.set(s, N), N;
        }) : b(p, v.value, !0), !0;
      },
      deleteProperty(c, s) {
        var v = t.get(s);
        if (v === void 0) {
          if (s in c) {
            const p = f(() => /* @__PURE__ */ z(Ae));
            t.set(s, p), jr(a);
          }
        } else
          b(v, Ae), jr(a);
        return !0;
      },
      get(c, s, v) {
        if (s === Fr)
          return e;
        var p = t.get(s), N = s in c;
        if (p === void 0 && (!N || Rr(c, s)?.writable) && (p = f(() => {
          var w = pt(N ? c[s] : Ae), k = /* @__PURE__ */ z(w);
          return k;
        }), t.set(s, p)), p !== void 0) {
          var y = i(p);
          return y === Ae ? void 0 : y;
        }
        return Reflect.get(c, s, v);
      },
      getOwnPropertyDescriptor(c, s) {
        var v = Reflect.getOwnPropertyDescriptor(c, s);
        if (v && "value" in v) {
          var p = t.get(s);
          p && (v.value = i(p));
        } else if (v === void 0) {
          var N = t.get(s), y = N?.v;
          if (N !== void 0 && y !== Ae)
            return {
              enumerable: !0,
              configurable: !0,
              value: y,
              writable: !0
            };
        }
        return v;
      },
      has(c, s) {
        if (s === Fr)
          return !0;
        var v = t.get(s), p = v !== void 0 && v.v !== Ae || Reflect.has(c, s);
        if (v !== void 0 || J !== null && (!p || Rr(c, s)?.writable)) {
          v === void 0 && (v = f(() => {
            var y = p ? pt(c[s]) : Ae, w = /* @__PURE__ */ z(y);
            return w;
          }), t.set(s, v));
          var N = i(v);
          if (N === Ae)
            return !1;
        }
        return p;
      },
      set(c, s, v, p) {
        var N = t.get(s), y = s in c;
        if (n && s === "length")
          for (var w = v; w < /** @type {Source<number>} */
          N.v; w += 1) {
            var k = t.get(w + "");
            k !== void 0 ? b(k, Ae) : w in c && (k = f(() => /* @__PURE__ */ z(Ae)), t.set(w + "", k));
          }
        if (N === void 0)
          (!y || Rr(c, s)?.writable) && (N = f(() => /* @__PURE__ */ z(void 0)), b(N, pt(v)), t.set(s, N));
        else {
          y = N.v !== Ae;
          var I = f(() => pt(v));
          b(N, I);
        }
        var m = Reflect.getOwnPropertyDescriptor(c, s);
        if (m?.set && m.set.call(p, v), !y) {
          if (n && typeof s == "string") {
            var U = (
              /** @type {Source<number>} */
              t.get("length")
            ), se = Number(s);
            Number.isInteger(se) && se >= U.v && b(U, se + 1);
          }
          jr(a);
        }
        return !0;
      },
      ownKeys(c) {
        i(a);
        var s = Reflect.ownKeys(c).filter((N) => {
          var y = t.get(N);
          return y === void 0 || y.v !== Ae;
        });
        for (var [v, p] of t)
          p.v !== Ae && !(v in c) && s.push(v);
        return s;
      },
      setPrototypeOf() {
        Eo();
      }
    }
  );
}
function Sa(e) {
  try {
    if (e !== null && typeof e == "object" && Fr in e)
      return e[Fr];
  } catch {
  }
  return e;
}
function os(e, r) {
  return Object.is(Sa(e), Sa(r));
}
var Ta, ri, ni, ai;
function ss() {
  if (Ta === void 0) {
    Ta = window, ri = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    ni = Rr(r, "firstChild").get, ai = Rr(r, "nextSibling").get, ma(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), ma(t) && (t.__t = void 0);
  }
}
function Ht(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function jt(e) {
  return (
    /** @type {TemplateNode | null} */
    ni.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Jr(e) {
  return (
    /** @type {TemplateNode | null} */
    ai.call(e)
  );
}
function g(e, r) {
  return /* @__PURE__ */ jt(e);
}
function st(e, r = !1) {
  {
    var t = /* @__PURE__ */ jt(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ Jr(t) : t;
  }
}
function x(e, r = 1, t = !1) {
  let n = e;
  for (; r--; )
    n = /** @type {TemplateNode} */
    /* @__PURE__ */ Jr(n);
  return n;
}
function ls(e) {
  e.textContent = "";
}
function ii() {
  return !1;
}
function oi(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(r ?? Ia, e, void 0)
  );
}
let Aa = !1;
function fs() {
  Aa || (Aa = !0, document.addEventListener(
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
function xn(e) {
  var r = K, t = J;
  nt(null), mt(null);
  try {
    return e();
  } finally {
    nt(r), mt(t);
  }
}
function si(e, r, t, n = t) {
  e.addEventListener(r, () => xn(t));
  const a = e.__on_r;
  a ? e.__on_r = () => {
    a(), n(!0);
  } : e.__on_r = () => n(!0), fs();
}
function us(e) {
  J === null && (K === null && mo(), yo()), zt && xo();
}
function ds(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Ct(e, r) {
  var t = J;
  t !== null && (t.f & Ie) !== 0 && (e |= Ie);
  var n = {
    ctx: rt,
    deps: null,
    nodes: null,
    f: e | Pe | $e,
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
  var a = n;
  if ((e & Tr) !== 0)
    xr !== null ? xr.push(n) : _r.ensure().schedule(n);
  else if (r !== null) {
    try {
      Mr(n);
    } catch (f) {
      throw Ve(n), f;
    }
    a.deps === null && a.teardown === null && a.nodes === null && a.first === a.last && // either `null`, or a singular child
    (a.f & Pr) === 0 && (a = a.first, (e & xt) !== 0 && (e & cr) !== 0 && a !== null && (a.f |= cr));
  }
  if (a !== null && (a.parent = t, t !== null && ds(a, t), K !== null && (K.f & Le) !== 0 && (e & qt) === 0)) {
    var o = (
      /** @type {Derived} */
      K
    );
    (o.effects ?? (o.effects = [])).push(a);
  }
  return n;
}
function aa() {
  return K !== null && !dt;
}
function ia(e) {
  const r = Ct(bn, null);
  return xe(r, Se), r.teardown = e, r;
}
function cs(e) {
  us();
  var r = (
    /** @type {Effect} */
    J.f
  ), t = !K && (r & ct) !== 0 && (r & gr) === 0;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      rt
    );
    (n.e ?? (n.e = [])).push(e);
  } else
    return li(e);
}
function li(e) {
  return Ct(Tr | go, e);
}
function vs(e) {
  _r.ensure();
  const r = Ct(qt | Pr, e);
  return (t = {}) => new Promise((n) => {
    t.outro ? ur(r, () => {
      Ve(r), n(void 0);
    }) : (Ve(r), n(void 0));
  });
}
function _s(e) {
  return Ct(Tr, e);
}
function hs(e) {
  return Ct(Vr | Pr, e);
}
function fi(e, r = 0) {
  return Ct(bn | r, e);
}
function D(e, r = [], t = [], n = []) {
  Qo(n, r, t, (a) => {
    Ct(bn, () => e(...a.map(i)));
  });
}
function yn(e, r = 0) {
  var t = Ct(xt | r, e);
  return t;
}
function Qe(e) {
  return Ct(ct | Pr, e);
}
function ui(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = zt, n = K;
    Na(!0), nt(null);
    try {
      r.call(null);
    } finally {
      Na(t), nt(n);
    }
  }
}
function oa(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const a = t.ac;
    a !== null && xn(() => {
      a.abort(Nt);
    });
    var n = t.next;
    (t.f & qt) !== 0 ? t.parent = null : Ve(t, r), t = n;
  }
}
function gs(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & ct) === 0 && Ve(r), r = t;
  }
}
function Ve(e, r = !0) {
  var t = !1;
  (r || (e.f & ho) !== 0) && e.nodes !== null && e.nodes.end !== null && (di(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), xe(e, ka), oa(e, r && !t), Hr(e, 0);
  var n = e.nodes && e.nodes.t;
  if (n !== null)
    for (const o of n)
      o.stop();
  ui(e), e.f ^= ka, e.f |= et;
  var a = e.parent;
  a !== null && a.first !== null && ci(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function di(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ Jr(e);
    e.remove(), e = t;
  }
}
function ci(e) {
  var r = e.parent, t = e.prev, n = e.next;
  t !== null && (t.next = n), n !== null && (n.prev = t), r !== null && (r.first === e && (r.first = n), r.last === e && (r.last = t));
}
function ur(e, r, t = !0) {
  var n = [];
  vi(e, n, !0);
  var a = () => {
    t && Ve(e), r && r();
  }, o = n.length;
  if (o > 0) {
    var f = () => --o || a();
    for (var c of n)
      c.out(f);
  } else
    a();
}
function vi(e, r, t) {
  if ((e.f & Ie) === 0) {
    e.f ^= Ie;
    var n = e.nodes && e.nodes.t;
    if (n !== null)
      for (const c of n)
        (c.is_global || t) && r.push(c);
    for (var a = e.first; a !== null; ) {
      var o = a.next;
      if ((a.f & qt) === 0) {
        var f = (a.f & cr) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (a.f & ct) !== 0 && (e.f & xt) !== 0;
        vi(a, r, f ? t : !1);
      }
      a = o;
    }
  }
}
function sa(e) {
  _i(e, !0);
}
function _i(e, r) {
  if ((e.f & Ie) !== 0) {
    e.f ^= Ie, (e.f & Se) === 0 && (xe(e, Pe), _r.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var n = t.next, a = (t.f & cr) !== 0 || (t.f & ct) !== 0;
      _i(t, a ? r : !1), t = n;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const f of o)
        (f.is_global || r) && f.in();
  }
}
function la(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, n = e.nodes.end; t !== null; ) {
      var a = t === n ? null : /* @__PURE__ */ Jr(t);
      r.append(t), t = a;
    }
}
let dn = !1, zt = !1;
function Na(e) {
  zt = e;
}
let K = null, dt = !1;
function nt(e) {
  K = e;
}
let J = null;
function mt(e) {
  J = e;
}
let tt = null;
function hi(e) {
  K !== null && (tt === null ? tt = [e] : tt.push(e));
}
let Be = null, Ue = 0, Ke = null;
function ps(e) {
  Ke = e;
}
let gi = 1, rr = 0, dr = rr;
function Ma(e) {
  dr = e;
}
function pi() {
  return ++gi;
}
function Xr(e) {
  var r = e.f;
  if ((r & Pe) !== 0)
    return !0;
  if (r & Le && (e.f &= ~vr), (r & yt) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), n = t.length, a = 0; a < n; a++) {
      var o = t[a];
      if (Xr(
        /** @type {Derived} */
        o
      ) && Qa(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & $e) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    ut === null && xe(e, Se);
  }
  return !1;
}
function bi(e, r, t = !0) {
  var n = e.reactions;
  if (n !== null && !(tt !== null && Sr.call(tt, e)))
    for (var a = 0; a < n.length; a++) {
      var o = n[a];
      (o.f & Le) !== 0 ? bi(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? xe(o, Pe) : (o.f & Se) !== 0 && xe(o, yt), ta(
        /** @type {Effect} */
        o
      ));
    }
}
function xi(e) {
  var I;
  var r = Be, t = Ue, n = Ke, a = K, o = tt, f = rt, c = dt, s = dr, v = e.f;
  Be = /** @type {null | Value[]} */
  null, Ue = 0, Ke = null, K = (v & (ct | qt)) === 0 ? e : null, tt = null, Ar(e.ctx), dt = !1, dr = ++rr, e.ac !== null && (xn(() => {
    e.ac.abort(Nt);
  }), e.ac = null);
  try {
    e.f |= cn;
    var p = (
      /** @type {Function} */
      e.fn
    ), N = p();
    e.f |= gr;
    var y = e.deps, w = V?.is_fork;
    if (Be !== null) {
      var k;
      if (w || Hr(e, Ue), y !== null && Ue > 0)
        for (y.length = Ue + Be.length, k = 0; k < Be.length; k++)
          y[Ue + k] = Be[k];
      else
        e.deps = y = Be;
      if (aa() && (e.f & $e) !== 0)
        for (k = Ue; k < y.length; k++)
          ((I = y[k]).reactions ?? (I.reactions = [])).push(e);
    } else !w && y !== null && Ue < y.length && (Hr(e, Ue), y.length = Ue);
    if (qa() && Ke !== null && !dt && y !== null && (e.f & (Le | yt | Pe)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      Ke.length; k++)
        bi(
          Ke[k],
          /** @type {Effect} */
          e
        );
    if (a !== null && a !== e) {
      if (rr++, a.deps !== null)
        for (let m = 0; m < t; m += 1)
          a.deps[m].rv = rr;
      if (r !== null)
        for (const m of r)
          m.rv = rr;
      Ke !== null && (n === null ? n = Ke : n.push(.../** @type {Source[]} */
      Ke));
    }
    return (e.f & Bt) !== 0 && (e.f ^= Bt), N;
  } catch (m) {
    return Ua(m);
  } finally {
    e.f ^= cn, Be = r, Ue = t, Ke = n, K = a, tt = o, Ar(f), dt = c, dr = s;
  }
}
function bs(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var n = oo.call(t, e);
    if (n !== -1) {
      var a = t.length - 1;
      a === 0 ? t = r.reactions = null : (t[n] = t[a], t.pop());
    }
  }
  if (t === null && (r.f & Le) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Be === null || !Sr.call(Be, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & $e) !== 0 && (o.f ^= $e, o.f &= ~vr), o.v !== Ae && $n(o), ns(o), Hr(o, 0);
  }
}
function Hr(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var n = r; n < t.length; n++)
      bs(e, t[n]);
}
function Mr(e) {
  var r = e.f;
  if ((r & et) === 0) {
    xe(e, Se);
    var t = J, n = dn;
    J = e, dn = !0;
    try {
      (r & (xt | Ra)) !== 0 ? gs(e) : oa(e), ui(e);
      var a = xi(e);
      e.teardown = typeof a == "function" ? a : null, e.wv = gi;
      var o;
    } finally {
      dn = n, J = t;
    }
  }
}
async function xs() {
  await Promise.resolve(), zo();
}
function i(e) {
  var r = e.f, t = (r & Le) !== 0;
  if (K !== null && !dt) {
    var n = J !== null && (J.f & et) !== 0;
    if (!n && (tt === null || !Sr.call(tt, e))) {
      var a = K.deps;
      if ((K.f & cn) !== 0)
        e.rv < rr && (e.rv = rr, Be === null && a !== null && a[Ue] === e ? Ue++ : Be === null ? Be = [e] : Be.push(e));
      else {
        (K.deps ?? (K.deps = [])).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [K] : Sr.call(o, K) || o.push(K);
      }
    }
  }
  if (zt && fr.has(e))
    return fr.get(e);
  if (t) {
    var f = (
      /** @type {Derived} */
      e
    );
    if (zt) {
      var c = f.v;
      return ((f.f & Se) === 0 && f.reactions !== null || mi(f)) && (c = na(f)), fr.set(f, c), c;
    }
    var s = (f.f & $e) === 0 && !dt && K !== null && (dn || (K.f & $e) !== 0), v = (f.f & gr) === 0;
    Xr(f) && (s && (f.f |= $e), Qa(f)), s && !v && ($a(f), yi(f));
  }
  if (ut?.has(e))
    return ut.get(e);
  if ((e.f & Bt) !== 0)
    throw e.v;
  return e.v;
}
function yi(e) {
  if (e.f |= $e, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & Le) !== 0 && (r.f & $e) === 0 && ($a(
        /** @type {Derived} */
        r
      ), yi(
        /** @type {Derived} */
        r
      ));
}
function mi(e) {
  if (e.v === Ae) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (fr.has(r) || (r.f & Le) !== 0 && mi(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function ki(e) {
  var r = dt;
  try {
    return dt = !0, e();
  } finally {
    dt = r;
  }
}
const ys = ["touchstart", "touchmove"];
function ms(e) {
  return ys.includes(e);
}
const nr = Symbol("events"), wi = /* @__PURE__ */ new Set(), Gn = /* @__PURE__ */ new Set();
function ks(e, r, t, n = {}) {
  function a(o) {
    if (n.capture || Kn.call(r, o), !o.cancelBubble)
      return xn(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Vt(() => {
    r.addEventListener(e, a, n);
  }) : r.addEventListener(e, a, n), a;
}
function Pa(e, r, t, n, a) {
  var o = { capture: n, passive: a }, f = ks(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && ia(() => {
    r.removeEventListener(e, f, o);
  });
}
function Re(e, r, t) {
  (r[nr] ?? (r[nr] = {}))[e] = t;
}
function ws(e) {
  for (var r = 0; r < e.length; r++)
    wi.add(e[r]);
  for (var t of Gn)
    t(e);
}
let La = null;
function Kn(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), n = e.type, a = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    a[0] || e.target
  );
  La = e;
  var f = 0, c = La === e && e[nr];
  if (c) {
    var s = a.indexOf(c);
    if (s !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[nr] = r;
      return;
    }
    var v = a.indexOf(r);
    if (v === -1)
      return;
    s <= v && (f = s);
  }
  if (o = /** @type {Element} */
  a[f] || e.target, o !== r) {
    so(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var p = K, N = J;
    nt(null), mt(null);
    try {
      for (var y, w = []; o !== null; ) {
        var k = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var I = o[nr]?.[n];
          I != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && I.call(o, e);
        } catch (m) {
          y ? w.push(m) : y = m;
        }
        if (e.cancelBubble || k === r || k === null)
          break;
        o = k;
      }
      if (y) {
        for (let m of w)
          queueMicrotask(() => {
            throw m;
          });
        throw y;
      }
    } finally {
      e[nr] = r, delete e.currentTarget, nt(p), mt(N);
    }
  }
}
const Es = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Ss(e) {
  return (
    /** @type {string} */
    Es?.createHTML(e) ?? e
  );
}
function Ts(e) {
  var r = oi("template");
  return r.innerHTML = Ss(e.replaceAll("<!>", "<!---->")), r.content;
}
function qr(e, r) {
  var t = (
    /** @type {Effect} */
    J
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function C(e, r) {
  var t = (r & Lo) !== 0, n = (r & Do) !== 0, a, o = !e.startsWith("<!>");
  return () => {
    a === void 0 && (a = Ts(o ? e : "<!>" + e), t || (a = /** @type {TemplateNode} */
    /* @__PURE__ */ jt(a)));
    var f = (
      /** @type {TemplateNode} */
      n || ri ? document.importNode(a, !0) : a.cloneNode(!0)
    );
    if (t) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ jt(f)
      ), s = (
        /** @type {TemplateNode} */
        f.lastChild
      );
      qr(c, s);
    } else
      qr(f, f);
    return f;
  };
}
function Tt() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = Ht();
  return e.append(r, t), qr(r, t), e;
}
function M(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function B(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = t, e.nodeValue = `${t}`);
}
function As(e, r) {
  return Ns(e, r);
}
const nn = /* @__PURE__ */ new Map();
function Ns(e, { target: r, anchor: t, props: n = {}, events: a, context: o, intro: f = !0, transformError: c }) {
  ss();
  var s = void 0, v = vs(() => {
    var p = t ?? r.appendChild(Ht());
    Go(
      /** @type {TemplateNode} */
      p,
      {
        pending: () => {
        }
      },
      (w) => {
        Va({});
        var k = (
          /** @type {ComponentContext} */
          rt
        );
        o && (k.c = o), a && (n.$$events = a), s = e(w, n) || {}, Ha();
      },
      c
    );
    var N = /* @__PURE__ */ new Set(), y = (w) => {
      for (var k = 0; k < w.length; k++) {
        var I = w[k];
        if (!N.has(I)) {
          N.add(I);
          var m = ms(I);
          for (const $ of [r, document]) {
            var U = nn.get($);
            U === void 0 && (U = /* @__PURE__ */ new Map(), nn.set($, U));
            var se = U.get(I);
            se === void 0 ? ($.addEventListener(I, Kn, { passive: m }), U.set(I, 1)) : U.set(I, se + 1);
          }
        }
      }
    };
    return y(pn(wi)), Gn.add(y), () => {
      for (var w of N)
        for (const m of [r, document]) {
          var k = (
            /** @type {Map<string, number>} */
            nn.get(m)
          ), I = (
            /** @type {number} */
            k.get(w)
          );
          --I == 0 ? (m.removeEventListener(w, Kn), k.delete(w), k.size === 0 && nn.delete(m)) : k.set(w, I);
        }
      Gn.delete(y), p !== t && p.parentNode?.removeChild(p);
    };
  });
  return Jn.set(s, v), s;
}
let Jn = /* @__PURE__ */ new WeakMap();
function Ms(e, r) {
  const t = Jn.get(e);
  return t ? (Jn.delete(e), t(r)) : Promise.resolve();
}
var ft, gt, Ge, lr, Gr, Kr, gn;
class Ei {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    ot(this, "anchor");
    /** @type {Map<Batch, Key>} */
    H(this, ft, /* @__PURE__ */ new Map());
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
    H(this, gt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    H(this, Ge, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    H(this, lr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    H(this, Gr, !0);
    /**
     * @param {Batch} batch
     */
    H(this, Kr, (r) => {
      if (l(this, ft).has(r)) {
        var t = (
          /** @type {Key} */
          l(this, ft).get(r)
        ), n = l(this, gt).get(t);
        if (n)
          sa(n), l(this, lr).delete(t);
        else {
          var a = l(this, Ge).get(t);
          a && (l(this, gt).set(t, a.effect), l(this, Ge).delete(t), a.fragment.lastChild.remove(), this.anchor.before(a.fragment), n = a.effect);
        }
        for (const [o, f] of l(this, ft)) {
          if (l(this, ft).delete(o), o === r)
            break;
          const c = l(this, Ge).get(f);
          c && (Ve(c.effect), l(this, Ge).delete(f));
        }
        for (const [o, f] of l(this, gt)) {
          if (o === t || l(this, lr).has(o)) continue;
          const c = () => {
            if (Array.from(l(this, ft).values()).includes(o)) {
              var v = document.createDocumentFragment();
              la(f, v), v.append(Ht()), l(this, Ge).set(o, { effect: f, fragment: v });
            } else
              Ve(f);
            l(this, lr).delete(o), l(this, gt).delete(o);
          };
          l(this, Gr) || !n ? (l(this, lr).add(o), ur(f, c, !1)) : c();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    H(this, gn, (r) => {
      l(this, ft).delete(r);
      const t = Array.from(l(this, ft).values());
      for (const [n, a] of l(this, Ge))
        t.includes(n) || (Ve(a.effect), l(this, Ge).delete(n));
    });
    this.anchor = r, G(this, Gr, t);
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
    ), a = ii();
    if (t && !l(this, gt).has(r) && !l(this, Ge).has(r))
      if (a) {
        var o = document.createDocumentFragment(), f = Ht();
        o.append(f), l(this, Ge).set(r, {
          effect: Qe(() => t(f)),
          fragment: o
        });
      } else
        l(this, gt).set(
          r,
          Qe(() => t(this.anchor))
        );
    if (l(this, ft).set(n, r), a) {
      for (const [c, s] of l(this, gt))
        c === r ? n.unskip_effect(s) : n.skip_effect(s);
      for (const [c, s] of l(this, Ge))
        c === r ? n.unskip_effect(s.effect) : n.skip_effect(s.effect);
      n.oncommit(l(this, Kr)), n.ondiscard(l(this, gn));
    } else
      l(this, Kr).call(this, n);
  }
}
ft = new WeakMap(), gt = new WeakMap(), Ge = new WeakMap(), lr = new WeakMap(), Gr = new WeakMap(), Kr = new WeakMap(), gn = new WeakMap();
function ee(e, r, t = !1) {
  var n = new Ei(e), a = t ? cr : 0;
  function o(f, c) {
    n.ensure(f, c);
  }
  yn(() => {
    var f = !1;
    r((c, s = 0) => {
      f = !0, o(s, c);
    }), f || o(-1, null);
  }, a);
}
function vt(e, r) {
  return r;
}
function Ps(e, r, t) {
  for (var n = [], a = r.length, o, f = r.length, c = 0; c < a; c++) {
    let N = r[c];
    ur(
      N,
      () => {
        if (o) {
          if (o.pending.delete(N), o.done.add(N), o.pending.size === 0) {
            var y = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Xn(e, pn(o.done)), y.delete(o), y.size === 0 && (e.outrogroups = null);
          }
        } else
          f -= 1;
      },
      !1
    );
  }
  if (f === 0) {
    var s = n.length === 0 && t !== null;
    if (s) {
      var v = (
        /** @type {Element} */
        t
      ), p = (
        /** @type {Element} */
        v.parentNode
      );
      ls(p), p.append(v), e.items.clear();
    }
    Xn(e, r, !s);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function Xn(e, r, t = !0) {
  var n;
  if (e.pending.size > 0) {
    n = /* @__PURE__ */ new Set();
    for (const f of e.pending.values())
      for (const c of f)
        n.add(
          /** @type {EachItem} */
          e.items.get(c).e
        );
  }
  for (var a = 0; a < r.length; a++) {
    var o = r[a];
    if (n?.has(o)) {
      o.f |= bt;
      const f = document.createDocumentFragment();
      la(o, f);
    } else
      Ve(r[a], t);
  }
}
var Da;
function lt(e, r, t, n, a, o = null) {
  var f = e, c = /* @__PURE__ */ new Map(), s = (r & Fa) !== 0;
  if (s) {
    var v = (
      /** @type {Element} */
      e
    );
    f = v.appendChild(Ht());
  }
  var p = null, N = /* @__PURE__ */ ts(() => {
    var $ = t();
    return Qn($) ? $ : $ == null ? [] : pn($);
  }), y, w = /* @__PURE__ */ new Map(), k = !0;
  function I($) {
    (se.effect.f & et) === 0 && (se.pending.delete($), se.fallback = p, Ls(se, y, f, r, n), p !== null && (y.length === 0 ? (p.f & bt) === 0 ? sa(p) : (p.f ^= bt, Or(p, null, f)) : ur(p, () => {
      p = null;
    })));
  }
  function m($) {
    se.pending.delete($);
  }
  var U = yn(() => {
    y = /** @type {V[]} */
    i(N);
    for (var $ = y.length, De = /* @__PURE__ */ new Set(), He = (
      /** @type {Batch} */
      V
    ), at = ii(), we = 0; we < $; we += 1) {
      var Me = y[we], qe = n(Me, we), ce = k ? null : c.get(qe);
      ce ? (ce.v && Nr(ce.v, Me), ce.i && Nr(ce.i, we), at && He.unskip_effect(ce.e)) : (ce = Ds(
        c,
        k ? f : Da ?? (Da = Ht()),
        Me,
        qe,
        we,
        a,
        r,
        t
      ), k || (ce.e.f |= bt), c.set(qe, ce)), De.add(qe);
    }
    if ($ === 0 && o && !p && (k ? p = Qe(() => o(f)) : (p = Qe(() => o(Da ?? (Da = Ht()))), p.f |= bt)), $ > De.size && bo(), !k)
      if (w.set(He, De), at) {
        for (const [Ut, Yt] of c)
          De.has(Ut) || He.skip_effect(Yt.e);
        He.oncommit(I), He.ondiscard(m);
      } else
        I(He);
    i(N);
  }), se = { effect: U, items: c, pending: w, outrogroups: null, fallback: p };
  k = !1;
}
function Cr(e) {
  for (; e !== null && (e.f & ct) === 0; )
    e = e.next;
  return e;
}
function Ls(e, r, t, n, a) {
  var o = (n & Mo) !== 0, f = r.length, c = e.items, s = Cr(e.effect.first), v, p = null, N, y = [], w = [], k, I, m, U;
  if (o)
    for (U = 0; U < f; U += 1)
      k = r[U], I = a(k, U), m = /** @type {EachItem} */
      c.get(I).e, (m.f & bt) === 0 && (m.nodes?.a?.measure(), (N ?? (N = /* @__PURE__ */ new Set())).add(m));
  for (U = 0; U < f; U += 1) {
    if (k = r[U], I = a(k, U), m = /** @type {EachItem} */
    c.get(I).e, e.outrogroups !== null)
      for (const ce of e.outrogroups)
        ce.pending.delete(m), ce.done.delete(m);
    if ((m.f & Ie) !== 0 && (sa(m), o && (m.nodes?.a?.unfix(), (N ?? (N = /* @__PURE__ */ new Set())).delete(m))), (m.f & bt) !== 0)
      if (m.f ^= bt, m === s)
        Or(m, null, t);
      else {
        var se = p ? p.next : s;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), Ot(e, p, m), Ot(e, m, se), Or(m, se, t), p = m, y = [], w = [], s = Cr(p.next);
        continue;
      }
    if (m !== s) {
      if (v !== void 0 && v.has(m)) {
        if (y.length < w.length) {
          var $ = w[0], De;
          p = $.prev;
          var He = y[0], at = y[y.length - 1];
          for (De = 0; De < y.length; De += 1)
            Or(y[De], $, t);
          for (De = 0; De < w.length; De += 1)
            v.delete(w[De]);
          Ot(e, He.prev, at.next), Ot(e, p, He), Ot(e, at, $), s = $, p = at, U -= 1, y = [], w = [];
        } else
          v.delete(m), Or(m, s, t), Ot(e, m.prev, m.next), Ot(e, m, p === null ? e.effect.first : p.next), Ot(e, p, m), p = m;
        continue;
      }
      for (y = [], w = []; s !== null && s !== m; )
        (v ?? (v = /* @__PURE__ */ new Set())).add(s), w.push(s), s = Cr(s.next);
      if (s === null)
        continue;
    }
    (m.f & bt) === 0 && y.push(m), p = m, s = Cr(m.next);
  }
  if (e.outrogroups !== null) {
    for (const ce of e.outrogroups)
      ce.pending.size === 0 && (Xn(e, pn(ce.done)), e.outrogroups?.delete(ce));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (s !== null || v !== void 0) {
    var we = [];
    if (v !== void 0)
      for (m of v)
        (m.f & Ie) === 0 && we.push(m);
    for (; s !== null; )
      (s.f & Ie) === 0 && s !== e.fallback && we.push(s), s = Cr(s.next);
    var Me = we.length;
    if (Me > 0) {
      var qe = (n & Fa) !== 0 && f === 0 ? t : null;
      if (o) {
        for (U = 0; U < Me; U += 1)
          we[U].nodes?.a?.measure();
        for (U = 0; U < Me; U += 1)
          we[U].nodes?.a?.fix();
      }
      Ps(e, we, qe);
    }
  }
  o && Vt(() => {
    if (N !== void 0)
      for (m of N)
        m.nodes?.a?.apply();
  });
}
function Ds(e, r, t, n, a, o, f, c) {
  var s = (f & Ao) !== 0 ? (f & Po) === 0 ? /* @__PURE__ */ as(t, !1, !1) : hr(t) : null, v = (f & No) !== 0 ? hr(a) : null;
  return {
    v: s,
    i: v,
    e: Qe(() => (o(r, s ?? t, v ?? a, c), () => {
      e.delete(n);
    }))
  };
}
function Or(e, r, t) {
  if (e.nodes)
    for (var n = e.nodes.start, a = e.nodes.end, o = r && (r.f & bt) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; n !== null; ) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Jr(n)
      );
      if (o.before(n), n === a)
        return;
      n = f;
    }
}
function Ot(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function Fn(e, r, t = !1, n = !1, a = !1, o = !1) {
  var f = e, c = "";
  if (t)
    var s = (
      /** @type {Element} */
      e
    );
  D(() => {
    var v = (
      /** @type {Effect} */
      J
    );
    if (c !== (c = r() ?? "")) {
      if (t) {
        v.nodes = null, s.innerHTML = /** @type {string} */
        c, c !== "" && qr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ jt(s),
          /** @type {TemplateNode} */
          s.lastChild
        );
        return;
      }
      if (v.nodes !== null && (di(
        v.nodes.start,
        /** @type {TemplateNode} */
        v.nodes.end
      ), v.nodes = null), c !== "") {
        var p = n ? Co : a ? Oo : void 0, N = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          oi(n ? "svg" : a ? "math" : "template", p)
        );
        N.innerHTML = /** @type {any} */
        c;
        var y = n || a ? N : (
          /** @type {HTMLTemplateElement} */
          N.content
        );
        if (qr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ jt(y),
          /** @type {TemplateNode} */
          y.lastChild
        ), n || a)
          for (; /* @__PURE__ */ jt(y); )
            f.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ jt(y)
            );
        else
          f.before(y);
      }
    }
  });
}
function Cs(e, r, t) {
  var n = new Ei(e);
  yn(() => {
    var a = r() ?? null;
    n.ensure(a, a && ((o) => t(o, a)));
  }, cr);
}
function Si(e) {
  var r, t, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var a = e.length;
    for (r = 0; r < a; r++) e[r] && (t = Si(e[r])) && (n && (n += " "), n += t);
  } else for (t in e) e[t] && (n && (n += " "), n += t);
  return n;
}
function Os() {
  for (var e, r, t = 0, n = "", a = arguments.length; t < a; t++) (e = arguments[t]) && (r = Si(e)) && (n && (n += " "), n += r);
  return n;
}
function u(e) {
  return typeof e == "object" ? Os(e) : e ?? "";
}
function Rs(e, r, t) {
  var n = e == null ? "" : "" + e;
  return n === "" ? null : n;
}
function d(e, r, t, n, a, o) {
  var f = e.__className;
  if (f !== t || f === void 0) {
    var c = Rs(t);
    c == null ? e.removeAttribute("class") : e.className = c, e.__className = t;
  }
  return o;
}
function Ti(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!Qn(r))
      return Fo();
    for (var n of e.options)
      n.selected = r.includes(Br(n));
    return;
  }
  for (n of e.options) {
    var a = Br(n);
    if (os(a, r)) {
      n.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function Fs(e) {
  var r = new MutationObserver(() => {
    Ti(e, e.__value);
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
  }), ia(() => {
    r.disconnect();
  });
}
function Is(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet(), a = !0;
  si(e, "change", (o) => {
    var f = o ? "[selected]" : ":checked", c;
    if (e.multiple)
      c = [].map.call(e.querySelectorAll(f), Br);
    else {
      var s = e.querySelector(f) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      c = s && Br(s);
    }
    t(c), e.__value = c, V !== null && n.add(V);
  }), _s(() => {
    var o = r();
    if (e === document.activeElement) {
      var f = (
        /** @type {Batch} */
        V
      );
      if (n.has(f))
        return;
    }
    if (Ti(e, o, a), a && o === void 0) {
      var c = e.querySelector(":checked");
      c !== null && (o = Br(c), t(o));
    }
    e.__value = o, a = !1;
  }), Fs(e);
}
function Br(e) {
  return "__value" in e ? e.__value : e.value;
}
const js = Symbol("is custom element"), Bs = Symbol("is html");
function Vs(e, r) {
  var t = Hs(e);
  t.checked !== (t.checked = // treat null and undefined the same for the initial value
  r ?? void 0) && (e.checked = r);
}
function Hs(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [js]: e.nodeName.includes("-"),
      [Bs]: e.namespaceURI === Ia
    })
  );
}
function er(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet();
  si(e, "input", async (a) => {
    var o = a ? e.defaultValue : e.value;
    if (o = In(e) ? jn(o) : o, t(o), V !== null && n.add(V), await xs(), o !== (o = r())) {
      var f = e.selectionStart, c = e.selectionEnd, s = e.value.length;
      if (e.value = o ?? "", c !== null) {
        var v = e.value.length;
        f === c && c === s && v > s ? (e.selectionStart = v, e.selectionEnd = v) : (e.selectionStart = f, e.selectionEnd = Math.min(c, v));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  ki(r) == null && e.value && (t(In(e) ? jn(e.value) : e.value), V !== null && n.add(V)), fi(() => {
    var a = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        V
      );
      if (n.has(o))
        return;
    }
    In(e) && a === jn(e.value) || e.type === "date" && !a && !e.value || a !== e.value && (e.value = a ?? "");
  });
}
function In(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function jn(e) {
  return e === "" ? null : +e;
}
const qs = "5";
var Ca;
typeof window < "u" && ((Ca = window.__svelte ?? (window.__svelte = {})).v ?? (Ca.v = /* @__PURE__ */ new Set())).add(qs);
var zs = /* @__PURE__ */ C("<div><span> </span> <div><div> </div> <div> </div></div></div>"), Us = /* @__PURE__ */ C("<p>Select at least one token to view balances</p>"), Ys = /* @__PURE__ */ C("<div><h3>Vault Balances</h3> <div><!> <!></div> <p>On-chain ledger balances for the vault canister</p></div>"), Ws = /* @__PURE__ */ C("<span>Copied!</span>"), Gs = /* @__PURE__ */ C("<div><span>Last Refresh:</span> <span> </span></div>"), Ks = /* @__PURE__ */ C('<label><input type="checkbox"/> <span> </span></label>'), Js = /* @__PURE__ */ C("<div><h3>Active Tokens</h3> <div></div></div>"), Xs = /* @__PURE__ */ C("<div><div> </div> <div><span>Ledger:</span> <button> </button></div> <div><span>Indexer:</span> <button> </button></div></div>"), Zs = /* @__PURE__ */ C("<div><h3>Ledger Canisters</h3> <div></div></div>"), Qs = /* @__PURE__ */ C('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), $s = /* @__PURE__ */ C("<div> </div>"), el = /* @__PURE__ */ C("<button> </button>"), tl = /* @__PURE__ */ C("<div><span> </span> <div><div> </div> <div> </div></div></div>"), rl = /* @__PURE__ */ C("<p>Select at least one token to view balances</p>"), nl = /* @__PURE__ */ C("<div><p><span>Principal:</span> <span> </span></p></div>"), al = /* @__PURE__ */ C("<p> </p>"), il = /* @__PURE__ */ C("<div><h2>Your Balance</h2> <div><!> <!></div> <!> <!></div>"), ol = /* @__PURE__ */ C("<span>✓</span>"), sl = /* @__PURE__ */ C("<button> </button> <!>", 1), ll = /* @__PURE__ */ C("<span>N/A</span>"), fl = /* @__PURE__ */ C("<span>✓</span>"), ul = /* @__PURE__ */ C("<button> </button> <!>", 1), dl = /* @__PURE__ */ C("<span>N/A</span>"), cl = /* @__PURE__ */ C("<button> </button>"), vl = /* @__PURE__ */ C("<span>N/A</span>"), _l = /* @__PURE__ */ C("<tr><td> </td><td><span> </span></td><td><!></td><td><!></td><td> </td><td><!></td><td><span> </span></td></tr>"), hl = /* @__PURE__ */ C('<tr><td colspan="7">No transactions found</td></tr>'), gl = /* @__PURE__ */ C("<span>…</span>"), pl = /* @__PURE__ */ C("<button> </button>"), bl = /* @__PURE__ */ C("<div><span> </span> <div><button>Prev</button> <!> <button>Next</button></div></div>"), xl = /* @__PURE__ */ C("<div><h2>Transaction History</h2> <div><table><thead><tr><th>ID</th><th>Token</th><th>From</th><th>To</th><th>Amount</th><th>When</th><th>Type</th></tr></thead><tbody></tbody></table></div> <!></div>"), yl = /* @__PURE__ */ C("<option> </option>"), ml = /* @__PURE__ */ C('<div><h2>Transfer Tokens (Admin Only)</h2> <form><div><label for="v-token">Token</label> <select id="v-token"></select></div> <div><label for="v-to">Recipient Principal</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/></div> <div><label for="v-amount"> </label> <input id="v-amount" type="number" placeholder="100000000"/></div> <div><label for="v-to-sub">To Subaccount (optional, 64-char hex)</label> <input id="v-to-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <div><label for="v-from-sub">From Subaccount (optional, 64-char hex)</label> <input id="v-from-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <button type="submit"> </button></form></div>'), kl = /* @__PURE__ */ C("<button> </button>"), wl = /* @__PURE__ */ C('<input type="text" placeholder="Enter principal ID"/>'), El = /* @__PURE__ */ C('<input type="text" placeholder="Enter invoice ID"/>'), Sl = /* @__PURE__ */ C('<input type="text" placeholder="Enter 64-char hex subaccount"/>'), Tl = /* @__PURE__ */ C("<div><span> </span> <div><div> </div> <div> </div></div></div>"), Al = /* @__PURE__ */ C("<p>No balances found for this subaccount.</p>"), Nl = /* @__PURE__ */ C("<div><div><div><span>Account:</span> <span> </span></div> <button> </button></div> <div></div> <!></div>"), Ml = /* @__PURE__ */ C(`<div><h2>Subaccount Lookup</h2> <p>Look up token balances for a user (by principal) or an invoice (by ID).
					The subaccount is derived using the <code>usr_</code> / <code>inv_</code> prefix convention.</p> <div></div> <form><!> <button type="submit"><!> </button></form> <!></div>`), Pl = /* @__PURE__ */ C("<div> </div>"), Ll = /* @__PURE__ */ C("<div><div> </div> <div> </div> <!></div>"), Dl = /* @__PURE__ */ C("<div></div>"), Cl = /* @__PURE__ */ C("<p>No balances found in system</p>"), Ol = /* @__PURE__ */ C("<p> </p>"), Rl = /* @__PURE__ */ C("<p>No transfer data available</p>"), Fl = /* @__PURE__ */ C("<div><h2>Vault Admin</h2> <div><button><!> </button></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>"), Il = /* @__PURE__ */ C("<div><div><h1>Vault</h1> <button><!> </button></div> <!> <div><div><span>Vault Principal:</span> <button> </button> <!></div> <!></div> <!> <!> <!> <nav></nav> <div><!></div></div>");
function jl(e, r) {
  Va(r, !0);
  const t = r.ctx.theme?.cn ?? ((..._) => _.filter(Boolean).join(" "));
  let n = /* @__PURE__ */ z("balance"), a = /* @__PURE__ */ z(!1), o = /* @__PURE__ */ z(""), f = /* @__PURE__ */ z(""), c = /* @__PURE__ */ z(""), s = /* @__PURE__ */ z(""), v = /* @__PURE__ */ z(pt({})), p = /* @__PURE__ */ z(pt({})), N = /* @__PURE__ */ z(pt({})), y = /* @__PURE__ */ z(!1), w = /* @__PURE__ */ z(0), k = /* @__PURE__ */ z(null), I = /* @__PURE__ */ z(pt([])), m = /* @__PURE__ */ z(null), U = /* @__PURE__ */ z(pt([])), se = /* @__PURE__ */ z(null), $ = /* @__PURE__ */ z(0);
  const De = 10;
  let He = /* @__PURE__ */ z(!1), at = /* @__PURE__ */ z(null), we = /* @__PURE__ */ z(""), Me = /* @__PURE__ */ z(""), qe = /* @__PURE__ */ z(""), ce = /* @__PURE__ */ z(0), Ut = /* @__PURE__ */ z(""), Yt = /* @__PURE__ */ z(""), Wt = /* @__PURE__ */ z("user"), Zr = /* @__PURE__ */ z(""), Qr = /* @__PURE__ */ z(""), $r = /* @__PURE__ */ z(""), kt = /* @__PURE__ */ z(null), pr = /* @__PURE__ */ z(!1), Gt = /* @__PURE__ */ $t(() => Object.keys(i(v))), mn = /* @__PURE__ */ $t(() => Object.values(i(p)).some(Boolean));
  function fa(_) {
    return typeof _ == "string" ? JSON.parse(_) : _;
  }
  function en(_) {
    return _ && typeof _ == "object" && _.success === !0 && _.data != null ? _.data : _;
  }
  function Ai(_) {
    return i(v)[_]?.name ?? _;
  }
  async function Kt(_) {
    try {
      await navigator.clipboard.writeText(_), b(we, _, !0), setTimeout(() => b(we, ""), 2e3);
    } catch {
    }
  }
  function ua(_) {
    const h = Math.floor((Date.now() - _.getTime()) / 1e3);
    if (h < 60) return `${h}s ago`;
    const S = Math.floor(h / 60);
    if (S < 60) return `${S}m ago`;
    const T = Math.floor(S / 60);
    return T < 24 ? `${T}h ago` : `${Math.floor(T / 24)}d ago`;
  }
  function Ni(_) {
    const h = String(_);
    if (h.includes("T") || h.includes("-") || h.includes(":")) return new Date(h);
    try {
      return new Date(Number(BigInt(h) / BigInt(1e6)));
    } catch {
      return /* @__PURE__ */ new Date();
    }
  }
  function kn(_, h) {
    return (_ / Math.pow(10, h)).toFixed(h);
  }
  function da(_, h = 20) {
    return _.length > h ? `${_.substring(0, h)}…` : _;
  }
  async function Mi() {
    try {
      const h = en(await r.ctx.callSync("get_active_tokens", {}))?.ActiveTokens || [], S = {}, T = {}, j = {};
      for (const F of h) {
        const Y = F.symbol || F.name, X = F.ledger_canister_id ?? F.ledger ?? "", Z = F.indexer_canister_id ?? F.indexer ?? "";
        Y && (S[Y] = {
          ledger: X,
          indexer: Z,
          decimals: F.decimals || 8,
          symbol: Y,
          name: F.name
        }, T[Y] = !0, j[Y] = 0);
      }
      b(v, S, !0), b(p, T, !0), b(N, j, !0);
      const O = Object.keys(S);
      O.length > 0 && !i(Me) && b(Me, O[0], !0), b(y, !0);
    } catch (_) {
      console.error("Failed to load tokens:", _);
    }
  }
  async function ca() {
    b(a, !0), b(o, ""), b(f, "");
    try {
      i(c) || b(c, r.ctx.principal || "", !0);
      const _ = await r.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), h = fa(_);
      if (h?.success && h?.data?.objectsListPaginated) {
        const S = h.data.objectsListPaginated;
        b(m, S.pagination, !0), b(I, S.objects.map((T) => JSON.parse(T)), !0), b(k, i(I).find((T) => T.principal === i(c) || T.id === i(c) || T._id === i(c)), !0), b(w, i(k) && i(k).amount || 0, !0);
      } else
        b(w, 0), b(k, null);
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(a, !1);
    }
  }
  async function wn(_ = i($)) {
    b(a, !0), b(o, ""), b(f, "");
    try {
      if (!i(s))
        try {
          if (typeof r.ctx.backend.get_canister_id == "function") {
            const T = await r.ctx.backend.get_canister_id();
            b(s, T || "", !0);
          }
        } catch {
          b(s, "");
        }
      const h = await r.ctx.backend.get_objects_paginated("WalletTransfer", _, De, "desc"), S = fa(h);
      if (S?.success && S?.data?.objectsListPaginated) {
        const T = S.data.objectsListPaginated;
        b(se, T.pagination, !0), b(U, T.objects.map((j) => JSON.parse(j)), !0);
      } else
        b(U, [], !0);
    } catch (h) {
      const S = r.ctx.ui?.accessDeniedOperation?.(h);
      S != null ? (b(f, S, !0), b(o, "")) : (b(f, ""), b(o, h?.message ?? String(h), !0));
    } finally {
      b(a, !1);
    }
  }
  function Pi(_) {
    return i(Gt).find((h) => i(v)[h]?.name === _);
  }
  function Li(_) {
    for (const [h, S] of Object.entries(_)) {
      const T = Pi(h) || h;
      i(v)[T] && (i(N)[T] = S?.balance || 0);
    }
    b(N, { ...i(N) }, !0);
  }
  async function Di() {
    try {
      typeof r.ctx.backend.get_canister_id == "function" && b(s, await r.ctx.backend.get_canister_id() || i(s), !0);
    } catch {
    }
  }
  async function En() {
    b(a, !0), b(o, ""), b(f, "");
    try {
      const _ = en(await r.ctx.callAsync("refresh", {}));
      if (_?.TransactionSummary == null) {
        b(o, "Failed to sync vault transactions");
        return;
      }
      Li(_.TransactionSummary.per_token || {}), await Di(), b(at, /* @__PURE__ */ new Date(), !0), await Promise.all([ca(), wn(0)]);
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(a, !1);
    }
  }
  async function Ci() {
    if (!i(qe) || i(ce) <= 0) {
      b(o, "Please enter valid recipient and amount");
      return;
    }
    b(a, !0), b(o, ""), b(f, "");
    try {
      const _ = {
        to_principal: i(qe),
        amount: i(ce)
      };
      i(Ut).trim() && (_.to_subaccount = i(Ut).trim()), i(Yt).trim() && (_.from_subaccount = i(Yt).trim()), i(Me) && (_.token = Ai(i(Me))), en(await r.ctx.callAsync("transfer", _)), b(qe, ""), b(ce, 0), b(Ut, ""), b(Yt, ""), await ca(), await wn();
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(a, !1);
    }
  }
  async function Oi() {
    b(pr, !0), b(kt, null), b(o, ""), b(f, "");
    try {
      const _ = {};
      if (i(Wt) === "user" && i(Zr).trim())
        _.principal = i(Zr).trim();
      else if (i(Wt) === "invoice" && i(Qr).trim())
        _.invoice_id = i(Qr).trim();
      else if (i(Wt) === "raw" && i($r).trim())
        _.subaccount_hex = i($r).trim();
      else {
        b(o, "Please enter a value to look up"), b(pr, !1);
        return;
      }
      const h = en(await r.ctx.callAsync("lookup_balance", _));
      h?.LookupBalance ? b(kt, h.LookupBalance, !0) : b(o, "Lookup failed");
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(pr, !1);
    }
  }
  async function Sn(_) {
    b($, _, !0), await wn(_);
  }
  function Ri(_, h) {
    if (_ <= 7) return Array.from({ length: _ }, (T, j) => j);
    const S = [0];
    h > 3 && S.push("...");
    for (let T = Math.max(1, h - 1); T <= Math.min(_ - 2, h + 1); T++) S.push(T);
    return h < _ - 4 && S.push("..."), S.push(_ - 1), S;
  }
  const Fi = [
    { id: "balance", label: "Balances" },
    { id: "transactions", label: "Transactions" },
    { id: "transfer", label: "Transfer" },
    { id: "lookup", label: "Lookup" },
    { id: "admin", label: "Admin" }
  ], Tn = '<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>';
  cs(() => {
    (async () => (await Mi(), await En()))();
  });
  var An = Il(), Nn = g(An), va = g(Nn), tn = x(va, 2), _a = g(tn);
  {
    var Ii = (_) => {
      var h = Tt(), S = st(h);
      Fn(S, () => Tn), M(_, h);
    };
    ee(_a, (_) => {
      (i(a) || i(He)) && _(Ii);
    });
  }
  var ji = x(_a), ha = x(Nn, 2);
  {
    var Bi = (_) => {
      var h = Ys(), S = g(h), T = x(S, 2), j = g(T);
      lt(j, 17, () => i(Gt), vt, (X, Z) => {
        var ae = Tt(), W = st(ae);
        {
          var Q = (re) => {
            var ve = zs(), _e = g(ve), Ee = g(_e), ye = x(_e, 2), P = g(ye), A = g(P), E = x(P, 2), R = g(E);
            D(
              (L, q, te, ne, ie, oe, me) => {
                d(ve, 1, L), d(_e, 1, q), B(Ee, i(v)[i(Z)].symbol), d(ye, 1, te), d(P, 1, ne), B(A, ie), d(E, 1, oe), B(R, `${me ?? ""} units`);
              },
              [
                () => u(t("flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-lg p-3")),
                () => u(t("text-base font-semibold text-indigo-900 dark:text-indigo-200")),
                () => u(t("text-right")),
                () => u(t("text-xl font-bold text-indigo-900 dark:text-indigo-100")),
                () => kn(i(N)[i(Z)] || 0, i(v)[i(Z)].decimals),
                () => u(t("text-xs text-indigo-600 dark:text-indigo-400")),
                () => (i(N)[i(Z)] || 0).toLocaleString()
              ]
            ), M(re, ve);
          };
          ee(W, (re) => {
            i(p)[i(Z)] && re(Q);
          });
        }
        M(X, ae);
      });
      var O = x(j, 2);
      {
        var F = (X) => {
          var Z = Us();
          D((ae) => d(Z, 1, ae), [() => u(t("text-sm text-gray-500 italic"))]), M(X, Z);
        };
        ee(O, (X) => {
          i(mn) || X(F);
        });
      }
      var Y = x(T, 2);
      D(
        (X, Z, ae, W) => {
          d(h, 1, X), d(S, 1, Z), d(T, 1, ae), d(Y, 1, W);
        },
        [
          () => u(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => u(t("text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3")),
          () => u(t("space-y-2")),
          () => u(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), M(_, h);
    };
    ee(ha, (_) => {
      i(y) && _(Bi);
    });
  }
  var Mn = x(ha, 2), Pn = g(Mn), ga = g(Pn), rn = x(ga, 2), Vi = g(rn), Hi = x(rn, 2);
  {
    var qi = (_) => {
      var h = Ws();
      D((S) => d(h, 1, S), [
        () => u(t("text-xs text-green-600 dark:text-green-400"))
      ]), M(_, h);
    };
    ee(Hi, (_) => {
      i(we) === i(s) && i(s) && _(qi);
    });
  }
  var zi = x(Pn, 2);
  {
    var Ui = (_) => {
      var h = Gs(), S = g(h), T = x(S, 2), j = g(T);
      D(
        (O, F, Y, X) => {
          d(S, 1, O), d(T, 1, F), B(j, `${Y ?? ""} (${X ?? ""})`);
        },
        [
          () => u(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
          () => u(t("ml-2 text-sm text-gray-700 dark:text-gray-300")),
          () => i(at).toLocaleString(),
          () => ua(i(at))
        ]
      ), M(_, h);
    };
    ee(zi, (_) => {
      i(at) && _(Ui);
    });
  }
  var pa = x(Mn, 2);
  {
    var Yi = (_) => {
      var h = Js(), S = g(h), T = x(S, 2);
      lt(T, 21, () => i(Gt), vt, (j, O) => {
        var F = Ks(), Y = g(F), X = x(Y, 2), Z = g(X);
        D(
          (ae, W, Q) => {
            d(F, 1, ae), Vs(Y, i(p)[i(O)]), d(Y, 1, W), d(X, 1, Q), B(Z, i(v)[i(O)].symbol);
          },
          [
            () => u(t("flex items-center gap-2 cursor-pointer")),
            () => u(t("w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500")),
            () => u(t("text-sm font-medium text-gray-700 dark:text-gray-300"))
          ]
        ), Re("change", Y, () => {
          i(p)[i(O)] = !i(p)[i(O)], b(p, { ...i(p) }, !0);
        }), M(j, F);
      }), D(
        (j, O, F) => {
          d(h, 1, j), d(S, 1, O), d(T, 1, F);
        },
        [
          () => u(t("bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4")),
          () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("flex flex-wrap gap-4"))
        ]
      ), M(_, h);
    };
    ee(pa, (_) => {
      i(y) && i(Gt).length > 0 && _(Yi);
    });
  }
  var ba = x(pa, 2);
  {
    var Wi = (_) => {
      var h = Zs(), S = g(h), T = x(S, 2);
      lt(T, 21, () => i(Gt), vt, (j, O) => {
        var F = Tt(), Y = st(F);
        {
          var X = (Z) => {
            var ae = Xs(), W = g(ae), Q = g(W), re = x(W, 2), ve = g(re), _e = x(ve, 2), Ee = g(_e), ye = x(re, 2), P = g(ye), A = x(P, 2), E = g(A);
            D(
              (R, L, q, te, ne, ie, oe, me) => {
                d(ae, 1, R), d(W, 1, L), B(Q, i(v)[i(O)].symbol), d(re, 1, q), d(ve, 1, te), d(_e, 1, ne), B(Ee, i(v)[i(O)].ledger), d(ye, 1, ie), d(P, 1, oe), d(A, 1, me), B(E, i(v)[i(O)].indexer);
              },
              [
                () => u(t("border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0")),
                () => u(t("text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1")),
                () => u(t("flex items-center justify-between text-xs")),
                () => u(t("text-gray-600 dark:text-gray-400")),
                () => u(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
                () => u(t("flex items-center justify-between text-xs mt-1")),
                () => u(t("text-gray-600 dark:text-gray-400")),
                () => u(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
              ]
            ), Re("click", _e, () => Kt(i(v)[i(O)].ledger)), Re("click", A, () => Kt(i(v)[i(O)].indexer)), M(Z, ae);
          };
          ee(Y, (Z) => {
            i(p)[i(O)] && Z(X);
          });
        }
        M(j, F);
      }), D(
        (j, O, F) => {
          d(h, 1, j), d(S, 1, O), d(T, 1, F);
        },
        [
          () => u(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4")),
          () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("space-y-2"))
        ]
      ), M(_, h);
    };
    ee(ba, (_) => {
      i(y) && i(mn) && _(Wi);
    });
  }
  var xa = x(ba, 2);
  {
    var Gi = (_) => {
      var h = Tt(), S = st(h);
      {
        var T = (O) => {
          var F = Tt(), Y = st(F);
          Cs(Y, () => r.ctx.ui.AccessDenied, (X, Z) => {
            Z(X, {
              get operation() {
                return i(f);
              }
            });
          }), M(O, F);
        }, j = (O) => {
          var F = Qs();
          M(O, F);
        };
        ee(S, (O) => {
          r.ctx.ui?.AccessDenied ? O(T) : O(j, -1);
        });
      }
      M(_, h);
    }, Ki = (_) => {
      var h = $s(), S = g(h);
      D(
        (T) => {
          d(h, 1, T), B(S, i(o));
        },
        [
          () => u(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300"))
        ]
      ), M(_, h);
    };
    ee(xa, (_) => {
      i(f) ? _(Gi) : i(o) && _(Ki, 1);
    });
  }
  var Ln = x(xa, 2);
  lt(Ln, 21, () => Fi, vt, (_, h) => {
    var S = el(), T = g(S);
    D(
      (j) => {
        d(S, 1, j), B(T, i(h).label);
      },
      [
        () => u(t("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", i(n) === i(h).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Re("click", S, () => {
      b(n, i(h).id, !0);
    }), M(_, S);
  });
  var Ji = x(Ln, 2), Xi = g(Ji);
  {
    var Zi = (_) => {
      var h = il(), S = g(h), T = x(S, 2), j = g(T);
      lt(j, 17, () => i(Gt), vt, (W, Q) => {
        var re = Tt(), ve = st(re);
        {
          var _e = (Ee) => {
            var ye = tl(), P = g(ye), A = g(P), E = x(P, 2), R = g(E), L = g(R), q = x(R, 2), te = g(q);
            D(
              (ne, ie, oe, me, Ce, Ne, le) => {
                d(ye, 1, ne), d(P, 1, ie), B(A, i(v)[i(Q)].symbol), d(E, 1, oe), d(R, 1, me), B(L, Ce), d(q, 1, Ne), B(te, `${le ?? ""} units`);
              },
              [
                () => u(t("flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => u(t("text-base font-semibold text-gray-700 dark:text-gray-300")),
                () => u(t("text-right")),
                () => u(t("text-xl font-bold text-indigo-600 dark:text-indigo-400")),
                () => kn(i(w), i(v)[i(Q)].decimals),
                () => u(t("text-xs text-gray-500 dark:text-gray-400")),
                () => i(w).toLocaleString()
              ]
            ), M(Ee, ye);
          };
          ee(ve, (Ee) => {
            i(p)[i(Q)] && Ee(_e);
          });
        }
        M(W, re);
      });
      var O = x(j, 2);
      {
        var F = (W) => {
          var Q = rl();
          D((re) => d(Q, 1, re), [() => u(t("text-sm text-gray-500 italic"))]), M(W, Q);
        };
        ee(O, (W) => {
          i(mn) || W(F);
        });
      }
      var Y = x(T, 2);
      {
        var X = (W) => {
          var Q = nl(), re = g(Q), ve = g(re), _e = x(ve, 2), Ee = g(_e);
          D(
            (ye, P, A, E) => {
              d(Q, 1, ye), d(re, 1, P), d(ve, 1, A), d(_e, 1, E), B(Ee, i(k)._id || i(k).id);
            },
            [
              () => u(t("mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
              () => u(t("text-sm text-gray-600 dark:text-gray-400")),
              () => u(t("font-medium")),
              () => u(t("font-mono text-xs ml-1"))
            ]
          ), M(W, Q);
        };
        ee(Y, (W) => {
          i(k) && W(X);
        });
      }
      var Z = x(Y, 2);
      {
        var ae = (W) => {
          var Q = al(), re = g(Q);
          D(
            (ve, _e) => {
              d(Q, 1, ve), B(re, `Showing ${i(I).length ?? ""} balance(s) (Page ${_e ?? ""} of ${i(m).total_pages ?? ""})`);
            },
            [
              () => u(t("mt-3 text-xs text-gray-500 dark:text-gray-400")),
              () => Number(i(m).page_num) + 1
            ]
          ), M(W, Q);
        };
        ee(Z, (W) => {
          i(m) && W(ae);
        });
      }
      D(
        (W, Q, re) => {
          d(h, 1, W), d(S, 1, Q), d(T, 1, re);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => u(t("space-y-3"))
        ]
      ), M(_, h);
    }, Qi = (_) => {
      var h = xl(), S = g(h), T = x(S, 2), j = g(T), O = g(j), F = g(O), Y = g(F), X = x(Y), Z = x(X), ae = x(Z), W = x(ae), Q = x(W), re = x(Q), ve = x(O);
      lt(
        ve,
        21,
        () => i(U),
        (P) => P._id || P.tx_id || Math.random(),
        (P, A) => {
          var E = _l(), R = g(E), L = g(R), q = x(R), te = g(q), ne = g(te), ie = x(q), oe = g(ie);
          {
            var me = (fe) => {
              var be = sl(), de = st(be), wt = g(de), Et = x(de, 2);
              {
                var St = (Oe) => {
                  var ze = ol();
                  D((Zt) => d(ze, 1, Zt), [() => u(t("ml-1 text-xs text-green-600"))]), M(Oe, ze);
                };
                ee(Et, (Oe) => {
                  i(we) === i(A).principal_from && Oe(St);
                });
              }
              D(
                (Oe, ze) => {
                  d(de, 1, Oe), B(wt, ze);
                },
                [
                  () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => da(i(A).principal_from)
                ]
              ), Re("click", de, () => Kt(i(A).principal_from)), M(fe, be);
            }, Ce = (fe) => {
              var be = ll();
              D((de) => d(be, 1, de), [() => u(t("text-gray-400"))]), M(fe, be);
            };
            ee(oe, (fe) => {
              i(A).principal_from ? fe(me) : fe(Ce, -1);
            });
          }
          var Ne = x(ie), le = g(Ne);
          {
            var he = (fe) => {
              var be = ul(), de = st(be), wt = g(de), Et = x(de, 2);
              {
                var St = (Oe) => {
                  var ze = fl();
                  D((Zt) => d(ze, 1, Zt), [() => u(t("ml-1 text-xs text-green-600"))]), M(Oe, ze);
                };
                ee(Et, (Oe) => {
                  i(we) === i(A).principal_to && Oe(St);
                });
              }
              D(
                (Oe, ze) => {
                  d(de, 1, Oe), B(wt, ze);
                },
                [
                  () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => da(i(A).principal_to)
                ]
              ), Re("click", de, () => Kt(i(A).principal_to)), M(fe, be);
            }, ge = (fe) => {
              var be = dl();
              D((de) => d(be, 1, de), [() => u(t("text-gray-400"))]), M(fe, be);
            };
            ee(le, (fe) => {
              i(A).principal_to ? fe(he) : fe(ge, -1);
            });
          }
          var Te = x(Ne), it = g(Te), Jt = x(Te), Xt = g(Jt);
          {
            var Lr = (fe) => {
              const be = /* @__PURE__ */ $t(() => Ni(i(A).timestamp));
              var de = cl(), wt = g(de);
              D(
                (Et, St) => {
                  d(de, 1, Et), B(wt, St);
                },
                [
                  () => u(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                  () => ua(i(be))
                ]
              ), Re("click", de, () => Kt(i(be).toLocaleString())), M(fe, de);
            }, Dn = (fe) => {
              var be = vl();
              D((de) => d(be, 1, de), [() => u(t("text-gray-400"))]), M(fe, be);
            };
            ee(Xt, (fe) => {
              i(A).timestamp ? fe(Lr) : fe(Dn, -1);
            });
          }
          var Dr = x(Jt), br = g(Dr), Cn = g(br);
          D(
            (fe, be, de, wt, Et, St, Oe, ze, Zt, ro, no) => {
              d(E, 1, fe), d(R, 1, be), B(L, i(A).tx_id || i(A)._id), d(q, 1, de), d(te, 1, wt), B(ne, i(A).token || "—"), d(ie, 1, Et), d(Ne, 1, St), d(Te, 1, Oe), B(it, ze), d(Jt, 1, Zt), d(Dr, 1, ro), d(br, 1, no), B(Cn, i(A).kind || "transfer");
            },
            [
              () => u(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
              () => u(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => u(t("px-4 py-3")),
              () => u(t("px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded text-xs font-medium")),
              () => u(t("px-4 py-3 font-mono text-xs")),
              () => u(t("px-4 py-3 font-mono text-xs")),
              () => u(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => (i(A).amount || 0).toLocaleString(),
              () => u(t("px-4 py-3")),
              () => u(t("px-4 py-3")),
              () => u(t("px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs"))
            ]
          ), M(P, E);
        },
        (P) => {
          var A = hl(), E = g(A);
          D((R) => d(E, 1, R), [
            () => u(t("px-4 py-8 text-center text-gray-500 dark:text-gray-400"))
          ]), M(P, A);
        }
      );
      var _e = x(T, 2);
      {
        var Ee = (P) => {
          var A = bl(), E = g(A), R = g(E), L = x(E, 2), q = g(L), te = x(q, 2);
          lt(te, 17, () => Ri(Number(i(se).total_pages), i($)), vt, (ie, oe) => {
            var me = Tt(), Ce = st(me);
            {
              var Ne = (he) => {
                var ge = gl();
                D((Te) => d(ge, 1, Te), [() => u(t("px-1.5 text-xs text-gray-400"))]), M(he, ge);
              }, le = (he) => {
                var ge = pl(), Te = g(ge);
                D(
                  (it) => {
                    d(ge, 1, it), B(Te, i(oe) + 1);
                  },
                  [
                    () => u(t("px-2.5 py-1 text-xs border rounded", i($) === i(oe) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                  ]
                ), Re("click", ge, () => Sn(i(oe))), M(he, ge);
              };
              ee(Ce, (he) => {
                i(oe) === "..." ? he(Ne) : he(le, -1);
              });
            }
            M(ie, me);
          });
          var ne = x(te, 2);
          D(
            (ie, oe, me, Ce, Ne, le) => {
              d(A, 1, ie), d(E, 1, oe), B(R, `${i(U).length ?? ""} of ${i(se).total_items_count ?? ""} (Page ${i($) + 1} / ${i(se).total_pages ?? ""})`), d(L, 1, me), q.disabled = i($) === 0, d(q, 1, Ce), ne.disabled = Ne, d(ne, 1, le);
            },
            [
              () => u(t("p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between")),
              () => u(t("text-xs text-gray-500 dark:text-gray-400")),
              () => u(t("flex items-center gap-1")),
              () => u(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
              () => i($) >= Number(i(se).total_pages) - 1,
              () => u(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
            ]
          ), Re("click", q, () => Sn(i($) - 1)), Re("click", ne, () => Sn(i($) + 1)), M(P, A);
        }, ye = /* @__PURE__ */ $t(() => i(se) && Number(i(se).total_pages) > 1);
        ee(_e, (P) => {
          i(ye) && P(Ee);
        });
      }
      D(
        (P, A, E, R, L, q, te, ne, ie, oe, me, Ce, Ne) => {
          d(h, 1, P), d(S, 1, A), d(T, 1, E), d(j, 1, R), d(O, 1, L), d(Y, 1, q), d(X, 1, te), d(Z, 1, ne), d(ae, 1, ie), d(W, 1, oe), d(Q, 1, me), d(re, 1, Ce), d(ve, 1, Ne);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden")),
          () => u(t("text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100")),
          () => u(t("overflow-x-auto")),
          () => u(t("w-full text-sm")),
          () => u(t("bg-gray-50 dark:bg-gray-700/50")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => u(t("divide-y divide-gray-100 dark:divide-gray-700"))
        ]
      ), M(_, h);
    }, $i = (_) => {
      var h = ml(), S = g(h), T = x(S, 2), j = g(T), O = g(j), F = x(O, 2);
      lt(F, 21, () => i(Gt), vt, (L, q) => {
        var te = yl(), ne = g(te), ie = {};
        D(() => {
          B(ne, i(v)[i(q)].symbol), ie !== (ie = i(q)) && (te.value = (te.__value = i(q)) ?? "");
        }), M(L, te);
      });
      var Y = x(j, 2), X = g(Y), Z = x(X, 2), ae = x(Y, 2), W = g(ae), Q = g(W), re = x(W, 2), ve = x(ae, 2), _e = g(ve), Ee = x(_e, 2), ye = x(ve, 2), P = g(ye), A = x(P, 2), E = x(ye, 2), R = g(E);
      D(
        (L, q, te, ne, ie, oe, me, Ce, Ne, le, he, ge, Te, it) => {
          d(h, 1, L), d(S, 1, q), d(T, 1, te), d(O, 1, ne), d(F, 1, ie), d(X, 1, oe), d(Z, 1, me), d(W, 1, Ce), B(Q, `Amount (${(i(v)[i(Me)]?.symbol || i(Me) || "") ?? ""} units)`), d(re, 1, Ne), d(_e, 1, le), d(Ee, 1, he), d(P, 1, ge), d(A, 1, Te), E.disabled = i(a) || !i(qe) || i(ce) <= 0, d(E, 1, it), B(R, i(a) ? "Processing…" : "Transfer");
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => u(t("space-y-4")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => u(t("w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => u(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), Pa("submit", T, (L) => {
        L.preventDefault(), Ci();
      }), Is(F, () => i(Me), (L) => b(Me, L)), er(Z, () => i(qe), (L) => b(qe, L)), er(re, () => i(ce), (L) => b(ce, L)), er(Ee, () => i(Ut), (L) => b(Ut, L)), er(A, () => i(Yt), (L) => b(Yt, L)), M(_, h);
    }, eo = (_) => {
      var h = Ml(), S = g(h), T = x(S, 2), j = x(g(T)), O = x(j, 2), F = x(T, 2);
      lt(
        F,
        20,
        () => [
          { id: "user", label: "User (usr_)" },
          { id: "invoice", label: "Invoice (inv_)" },
          { id: "raw", label: "Raw Hex" }
        ],
        vt,
        (P, A) => {
          var E = kl(), R = g(E);
          D(
            (L) => {
              d(E, 1, L), B(R, A.label);
            },
            [
              () => u(t("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", i(Wt) === A.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
            ]
          ), Re("click", E, () => {
            b(Wt, A.id, !0), b(kt, null);
          }), M(P, E);
        }
      );
      var Y = x(F, 2), X = g(Y);
      {
        var Z = (P) => {
          var A = wl();
          D((E) => d(A, 1, E), [
            () => u(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), er(A, () => i(Zr), (E) => b(Zr, E)), M(P, A);
        }, ae = (P) => {
          var A = El();
          D((E) => d(A, 1, E), [
            () => u(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), er(A, () => i(Qr), (E) => b(Qr, E)), M(P, A);
        }, W = (P) => {
          var A = Sl();
          D((E) => d(A, 1, E), [
            () => u(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), er(A, () => i($r), (E) => b($r, E)), M(P, A);
        };
        ee(X, (P) => {
          i(Wt) === "user" ? P(Z) : i(Wt) === "invoice" ? P(ae, 1) : P(W, -1);
        });
      }
      var Q = x(X, 2), re = g(Q);
      {
        var ve = (P) => {
          var A = Tt(), E = st(A);
          Fn(E, () => Tn), M(P, A);
        };
        ee(re, (P) => {
          i(pr) && P(ve);
        });
      }
      var _e = x(re), Ee = x(Y, 2);
      {
        var ye = (P) => {
          var A = Nl(), E = g(A), R = g(E), L = g(R), q = x(L, 2), te = g(q), ne = x(R, 2), ie = g(ne), oe = x(E, 2);
          lt(oe, 21, () => Object.entries(i(kt).balances), vt, (le, he) => {
            var ge = /* @__PURE__ */ $t(() => _o(i(he), 2));
            let Te = () => i(ge)[0], it = () => i(ge)[1];
            const Jt = /* @__PURE__ */ $t(() => i(v)[Te()]?.decimals || 8);
            var Xt = Tl(), Lr = g(Xt), Dn = g(Lr), Dr = x(Lr, 2), br = g(Dr), Cn = g(br), fe = x(br, 2), be = g(fe);
            D(
              (de, wt, Et, St, Oe, ze, Zt) => {
                d(Xt, 1, de), d(Lr, 1, wt), B(Dn, Te()), d(Dr, 1, Et), d(br, 1, St), B(Cn, Oe), d(fe, 1, ze), B(be, `${Zt ?? ""} units`);
              },
              [
                () => u(t("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => u(t("text-right")),
                () => u(t("text-lg font-bold", Number(it()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400")),
                () => kn(Number(it()), i(Jt)),
                () => u(t("text-xs text-gray-500 dark:text-gray-400")),
                () => Number(it()).toLocaleString()
              ]
            ), M(le, Xt);
          });
          var me = x(oe, 2);
          {
            var Ce = (le) => {
              var he = Al();
              D((ge) => d(he, 1, ge), [() => u(t("text-sm text-gray-500 italic"))]), M(le, he);
            }, Ne = /* @__PURE__ */ $t(() => Object.values(i(kt).balances).every((le) => Number(le) === 0));
            ee(me, (le) => {
              i(Ne) && le(Ce);
            });
          }
          D(
            (le, he, ge, Te, it, Jt, Xt) => {
              d(A, 1, le), d(E, 1, he), d(L, 1, ge), d(q, 1, Te), B(te, i(kt).label), d(ne, 1, it), B(ie, `${Jt ?? ""}…`), d(oe, 1, Xt);
            },
            [
              () => u(t("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3")),
              () => u(t("flex items-center justify-between")),
              () => u(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
              () => u(t("ml-2 text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => u(t("text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono")),
              () => i(kt).subaccount_hex.substring(0, 16),
              () => u(t("space-y-2"))
            ]
          ), Re("click", ne, () => Kt(i(kt)?.subaccount_hex || "")), M(P, A);
        };
        ee(Ee, (P) => {
          i(kt) && P(ye);
        });
      }
      D(
        (P, A, E, R, L, q, te, ne) => {
          d(h, 1, P), d(S, 1, A), d(T, 1, E), d(j, 1, R), d(O, 1, L), d(F, 1, q), d(Y, 1, te), Q.disabled = i(pr), d(Q, 1, ne), B(_e, ` ${i(pr) ? "Looking up…" : "Lookup"}`);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => u(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => u(t("bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs")),
          () => u(t("bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs")),
          () => u(t("flex gap-2 mb-4")),
          () => u(t("flex gap-2 mb-4")),
          () => u(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"))
        ]
      ), Pa("submit", Y, (P) => {
        P.preventDefault(), Oi();
      }), M(_, h);
    }, to = (_) => {
      var h = Fl(), S = g(h), T = x(S, 2), j = g(T), O = g(j);
      {
        var F = (E) => {
          var R = Tt(), L = st(R);
          Fn(L, () => Tn), M(E, R);
        };
        ee(O, (E) => {
          i(a) && E(F);
        });
      }
      var Y = x(O), X = x(T, 2), Z = g(X), ae = g(Z), W = g(ae), Q = x(ae, 2);
      {
        var re = (E) => {
          var R = Dl();
          lt(R, 21, () => i(I), vt, (L, q) => {
            var te = Ll(), ne = g(te), ie = g(ne), oe = x(ne, 2), me = g(oe), Ce = x(oe, 2);
            {
              var Ne = (le) => {
                var he = Pl(), ge = g(he);
                D(
                  (Te) => {
                    d(he, 1, Te), B(ge, `Token: ${i(q).token ?? ""}`);
                  },
                  [
                    () => u(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
                  ]
                ), M(le, he);
              };
              ee(Ce, (le) => {
                i(q).token && le(Ne);
              });
            }
            D(
              (le, he, ge, Te) => {
                d(te, 1, le), d(ne, 1, he), B(ie, `Principal: ${(i(q).principal || i(q)._id || i(q).id) ?? ""}`), d(oe, 1, ge), B(me, `${Te ?? ""} units`);
              },
              [
                () => u(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => u(t("font-mono text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => u(t("text-sm font-semibold text-gray-800 dark:text-gray-200")),
                () => (i(q).amount || 0).toLocaleString()
              ]
            ), M(L, te);
          }), D((L) => d(R, 1, L), [() => u(t("space-y-2 max-h-80 overflow-auto"))]), M(E, R);
        }, ve = (E) => {
          var R = Cl();
          D((L) => d(R, 1, L), [() => u(t("text-gray-500 dark:text-gray-400 text-sm"))]), M(E, R);
        };
        ee(Q, (E) => {
          i(I).length > 0 ? E(re) : E(ve, -1);
        });
      }
      var _e = x(Z, 2), Ee = g(_e), ye = x(Ee, 2);
      {
        var P = (E) => {
          var R = Ol(), L = g(R);
          D(
            (q) => {
              d(R, 1, q), B(L, `Total transfers: ${i(se).total_items_count ?? ""}`);
            },
            [() => u(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), M(E, R);
        }, A = (E) => {
          var R = Rl();
          D((L) => d(R, 1, L), [() => u(t("text-gray-500 dark:text-gray-400 text-sm"))]), M(E, R);
        };
        ee(ye, (E) => {
          i(se) ? E(P) : E(A, -1);
        });
      }
      D(
        (E, R, L, q, te, ne, ie) => {
          d(h, 1, E), d(S, 1, R), d(T, 1, L), j.disabled = i(a), d(j, 1, q), B(Y, ` ${i(a) ? "Refreshing…" : "Full Vault Refresh"}`), d(X, 1, te), d(ae, 1, ne), B(W, `All Balances in System (${i(I).length ?? ""})`), d(Ee, 1, ie);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => u(t("mb-4")),
          () => u(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => u(t("space-y-6")),
          () => u(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("font-semibold text-gray-700 dark:text-gray-300 mb-2"))
        ]
      ), Re("click", j, En), M(_, h);
    };
    ee(Xi, (_) => {
      i(n) === "balance" ? _(Zi) : i(n) === "transactions" ? _(Qi, 1) : i(n) === "transfer" ? _($i, 2) : i(n) === "lookup" ? _(eo, 3) : i(n) === "admin" && _(to, 4);
    });
  }
  D(
    (_, h, S, T, j, O, F, Y, X) => {
      d(An, 1, _), d(Nn, 1, h), d(va, 1, S), tn.disabled = i(a) || i(He), d(tn, 1, T), B(ji, ` ${i(a) || i(He) ? "Refreshing…" : "Refresh"}`), d(Mn, 1, j), d(Pn, 1, O), d(ga, 1, F), d(rn, 1, Y), B(Vi, i(s) || "Loading…"), d(Ln, 1, X);
    },
    [
      () => u(t("max-w-4xl mx-auto p-6 space-y-6")),
      () => u(t("flex justify-between items-center")),
      () => u(t("text-2xl font-bold text-gray-900 dark:text-gray-100")),
      () => u(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed", "inline-flex items-center gap-2 transition-colors")),
      () => u(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2")),
      () => u(t("flex items-center gap-2")),
      () => u(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
      () => u(t("font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline")),
      () => u(t("flex border-b border-gray-200 dark:border-gray-700"))
    ]
  ), Re("click", tn, En), Re("click", rn, () => Kt(i(s))), M(e, An), Ha();
}
ws(["click", "change"]);
function Hl(e, r) {
  const t = As(jl, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        Ms(t);
      } catch {
      }
    }
  };
}
export {
  Hl as default
};
