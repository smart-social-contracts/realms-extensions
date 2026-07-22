var no = Object.defineProperty;
var ma = (e) => {
  throw TypeError(e);
};
var ao = (e, r, t) => r in e ? no(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var ot = (e, r, t) => ao(e, typeof r != "symbol" ? r + "" : r, t), Rn = (e, r, t) => r.has(e) || ma("Cannot " + t);
var l = (e, r, t) => (Rn(e, r, "read from private field"), t ? t.call(e) : r.get(e)), H = (e, r, t) => r.has(e) ? ma("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), J = (e, r, t, n) => (Rn(e, r, "write to private field"), n ? n.call(e, t) : r.set(e, t), t), ue = (e, r, t) => (Rn(e, r, "access private method"), t);
var $n = Array.isArray, io = Array.prototype.indexOf, Sr = Array.prototype.includes, pn = Array.from, oo = Object.defineProperty, Rr = Object.getOwnPropertyDescriptor, so = Object.prototype, lo = Array.prototype, fo = Object.getPrototypeOf, ka = Object.isExtensible;
const uo = () => {
};
function co(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function Ra() {
  var e, r, t = new Promise((n, a) => {
    e = n, r = a;
  });
  return { promise: t, resolve: e, reject: r };
}
function vo(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const n of e)
    if (t.push(n), t.length === r) break;
  return t;
}
const Pe = 2, Tr = 4, bn = 8, Fa = 1 << 24, xt = 16, ct = 32, qt = 64, Vn = 128, $e = 512, Se = 1024, Le = 2048, yt = 4096, je = 8192, et = 16384, gr = 32768, wa = 1 << 25, cr = 65536, Hn = 1 << 17, _o = 1 << 18, Lr = 1 << 19, ho = 1 << 20, bt = 1 << 25, vr = 65536, cn = 1 << 21, Vr = 1 << 22, Bt = 1 << 23, Fr = Symbol("$state"), Nt = new class extends Error {
  constructor() {
    super(...arguments);
    ot(this, "name", "StaleReactionError");
    ot(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function go() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function po(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function bo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function xo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function yo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function mo() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function ko() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function wo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Eo() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function So() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const To = 1, Ao = 2, ja = 4, No = 8, Mo = 16, Lo = 1, Po = 2, Ae = Symbol(), Ia = "http://www.w3.org/1999/xhtml", Do = "http://www.w3.org/2000/svg", Co = "http://www.w3.org/1998/Math/MathML";
function Oo() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Ro() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Fo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Ba(e) {
  return e === this.v;
}
function jo(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function Va(e) {
  return !jo(e, this.v);
}
let rt = null;
function Ar(e) {
  rt = e;
}
function Ha(e, r = !1, t) {
  rt = {
    p: rt,
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
function qa(e) {
  var r = (
    /** @type {ComponentContext} */
    rt
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var n of t)
      fi(n);
  }
  return r.i = !0, rt = r.p, /** @type {T} */
  {};
}
function za() {
  return !0;
}
let tr = [];
function Ua() {
  var e = tr;
  tr = [], co(e);
}
function Vt(e) {
  if (tr.length === 0 && !jr) {
    var r = tr;
    queueMicrotask(() => {
      r === tr && Ua();
    });
  }
  tr.push(e);
}
function Io() {
  for (; tr.length > 0; )
    Ua();
}
function Ya(e) {
  var r = X;
  if (r === null)
    return K.f |= Bt, e;
  if ((r.f & gr) === 0 && (r.f & Tr) === 0)
    throw e;
  jt(e, r);
}
function jt(e, r) {
  for (; r !== null; ) {
    if ((r.f & Vn) !== 0) {
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
const Bo = -7169;
function xe(e, r) {
  e.f = e.f & Bo | r;
}
function ea(e) {
  (e.f & $e) !== 0 || e.deps === null ? xe(e, Se) : xe(e, yt);
}
function Wa(e) {
  if (e !== null)
    for (const r of e)
      (r.f & Pe) === 0 || (r.f & vr) === 0 || (r.f ^= vr, Wa(
        /** @type {Derived} */
        r.deps
      ));
}
function Ga(e, r, t) {
  (e.f & Le) !== 0 ? r.add(e) : (e.f & yt) !== 0 && t.add(e), Wa(e.deps), xe(e, Se);
}
const Qt = /* @__PURE__ */ new Set();
let V = null, ut = null, qn = null, jr = !1, Fn = !1, xr = null, an = null;
var Ea = 0;
let Vo = 1;
var yr, mr, ar, Mt, _t, zr, Ye, Ur, Rt, Lt, ht, kr, wr, ir, ke, on, Ja, sn, zn, ln, Ho;
const _n = class _n {
  constructor() {
    H(this, ke);
    ot(this, "id", Vo++);
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
    H(this, Lt, /* @__PURE__ */ new Set());
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
        xe(a, Le), t(a);
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
      Fn = !0, V = this, ue(this, ke, sn).call(this);
    } finally {
      Ea = 0, qn = null, xr = null, an = null, Fn = !1, V = null, ut = null, fr.clear();
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
    l(this, wr) || n || (J(this, wr, !0), Vt(() => {
      J(this, wr, !1), this.flush();
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
      l(this, Lt).add(n);
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
    return (l(this, zr) ?? J(this, zr, Ra())).promise;
  }
  static ensure() {
    if (V === null) {
      const r = V = new _n();
      Fn || (Qt.add(V), jr || Vt(() => {
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
    if (qn = r, r.b?.is_pending && (r.f & (Tr | bn | Fa)) !== 0 && (r.f & gr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var n = t.f;
      if (xr !== null && t === X && (K === null || (K.f & Pe) === 0))
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
yr = new WeakMap(), mr = new WeakMap(), ar = new WeakMap(), Mt = new WeakMap(), _t = new WeakMap(), zr = new WeakMap(), Ye = new WeakMap(), Ur = new WeakMap(), Rt = new WeakMap(), Lt = new WeakMap(), ht = new WeakMap(), kr = new WeakMap(), wr = new WeakMap(), ir = new WeakMap(), ke = new WeakSet(), on = function() {
  return this.is_fork || l(this, _t).size > 0;
}, Ja = function() {
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
  if (Ea++ > 1e3 && (Qt.delete(this), zo()), !ue(this, ke, on).call(this)) {
    for (const s of l(this, Rt))
      l(this, Lt).delete(s), xe(s, Le), this.schedule(s);
    for (const s of l(this, Lt))
      xe(s, yt), this.schedule(s);
  }
  const r = l(this, Ye);
  J(this, Ye, []), this.apply();
  var t = xr = [], n = [], a = an = [];
  for (const s of r)
    try {
      ue(this, ke, zn).call(this, s, t, n);
    } catch (v) {
      throw Za(s), v;
    }
  if (V = null, a.length > 0) {
    var o = _n.ensure();
    for (const s of a)
      o.schedule(s);
  }
  if (xr = null, an = null, ue(this, ke, on).call(this) || ue(this, ke, Ja).call(this)) {
    ue(this, ke, ln).call(this, n), ue(this, ke, ln).call(this, t);
    for (const [s, v] of l(this, ht))
      Xa(s, v);
  } else {
    l(this, Mt).size === 0 && Qt.delete(this), l(this, Rt).clear(), l(this, Lt).clear();
    for (const s of l(this, yr)) s(this);
    l(this, yr).clear(), Sa(n), Sa(t), l(this, zr)?.resolve();
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
zn = function(r, t, n) {
  r.f ^= Se;
  for (var a = r.first; a !== null; ) {
    var o = a.f, f = (o & (ct | qt)) !== 0, c = f && (o & Se) !== 0, s = c || (o & je) !== 0 || l(this, ht).has(a);
    if (!s && a.fn !== null) {
      f ? a.f ^= Se : (o & Tr) !== 0 ? t.push(a) : Xr(a) && ((o & xt) !== 0 && l(this, Lt).add(a), Mr(a));
      var v = a.first;
      if (v !== null) {
        a = v;
        continue;
      }
    }
    for (; a !== null; ) {
      var g = a.next;
      if (g !== null) {
        a = g;
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
    Ga(r[t], l(this, Rt), l(this, Lt));
}, Ho = function() {
  var g, A, y;
  for (const w of Qt) {
    var r = w.id < this.id, t = [];
    for (const [k, [j, m]] of this.current) {
      if (w.current.has(k)) {
        var n = (
          /** @type {[any, boolean]} */
          w.current.get(k)[0]
        );
        if (r && j !== n)
          w.current.set(k, [j, m]);
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
          w.unskip_effect(k, (j) => {
            var m;
            (j.f & (xt | Vr)) !== 0 ? w.schedule(j) : ue(m = w, ke, ln).call(m, [j]);
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
        (k.f & (et | je | Hn)) === 0 && ta(k, s, f) && ((k.f & (Vr | xt)) !== 0 ? (xe(k, Le), w.schedule(k)) : l(w, Rt).add(k));
      if (l(w, Ye).length > 0) {
        w.apply();
        for (var v of l(w, Ye))
          ue(g = w, ke, zn).call(g, v, [], []);
        J(w, Ye, []);
      }
      w.deactivate();
    }
  }
  for (const w of Qt)
    l(w, ir).has(this) && (l(w, ir).delete(this), l(w, ir).size === 0 && !ue(A = w, ke, on).call(A) && (w.activate(), ue(y = w, ke, sn).call(y)));
};
let _r = _n;
function qo(e) {
  var r = jr;
  jr = !0;
  try {
    for (var t; ; ) {
      if (Io(), V === null)
        return (
          /** @type {T} */
          t
        );
      V.flush();
    }
  } finally {
    jr = r;
  }
}
function zo() {
  try {
    mo();
  } catch (e) {
    jt(e, qn);
  }
}
let At = null;
function Sa(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var n = e[t++];
      if ((n.f & (et | je)) === 0 && Xr(n) && (At = /* @__PURE__ */ new Set(), Mr(n), n.deps === null && n.first === null && n.nodes === null && n.teardown === null && n.ac === null && vi(n), At?.size > 0)) {
        fr.clear();
        for (const a of At) {
          if ((a.f & (et | je)) !== 0) continue;
          const o = [a];
          let f = a.parent;
          for (; f !== null; )
            At.has(f) && (At.delete(f), o.push(f)), f = f.parent;
          for (let c = o.length - 1; c >= 0; c--) {
            const s = o[c];
            (s.f & (et | je)) === 0 && Mr(s);
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
      (o & Pe) !== 0 ? Ka(
        /** @type {Derived} */
        a,
        r,
        t,
        n
      ) : (o & (Vr | xt)) !== 0 && (o & Le) === 0 && ta(a, r, n) && (xe(a, Le), ra(
        /** @type {Effect} */
        a
      ));
    }
}
function ta(e, r, t) {
  const n = t.get(e);
  if (n !== void 0) return n;
  if (e.deps !== null)
    for (const a of e.deps) {
      if (Sr.call(r, a))
        return !0;
      if ((a.f & Pe) !== 0 && ta(
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
function ra(e) {
  V.schedule(e);
}
function Xa(e, r) {
  if (!((e.f & ct) !== 0 && (e.f & Se) !== 0)) {
    (e.f & Le) !== 0 ? r.d.push(e) : (e.f & yt) !== 0 && r.m.push(e), xe(e, Se);
    for (var t = e.first; t !== null; )
      Xa(t, r), t = t.next;
  }
}
function Za(e) {
  xe(e, Se);
  for (var r = e.first; r !== null; )
    Za(r), r = r.next;
}
function Uo(e) {
  let r = 0, t = hr(0), n;
  return () => {
    ia() && (i(t), ui(() => (r === 0 && (n = wi(() => e(() => Ir(t)))), r += 1, () => {
      Vt(() => {
        r -= 1, r === 0 && (n?.(), n = void 0, Ir(t));
      });
    })));
  };
}
var Yo = cr | Lr;
function Wo(e, r, t, n) {
  new Go(e, r, t, n);
}
var Ke, Qn, Xe, or, Ie, Ze, Fe, We, Pt, sr, Ft, Er, Yr, Wr, Dt, hn, pe, Jo, Ko, Xo, Un, fn, un, Yn, Wn;
class Go {
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
    H(this, Ke);
    /** @type {TemplateNode | null} */
    H(this, Qn, null);
    /** @type {BoundaryProps} */
    H(this, Xe);
    /** @type {((anchor: Node) => void)} */
    H(this, or);
    /** @type {Effect} */
    H(this, Ie);
    /** @type {Effect | null} */
    H(this, Ze, null);
    /** @type {Effect | null} */
    H(this, Fe, null);
    /** @type {Effect | null} */
    H(this, We, null);
    /** @type {DocumentFragment | null} */
    H(this, Pt, null);
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
    H(this, hn, Uo(() => (J(this, Dt, hr(l(this, sr))), () => {
      J(this, Dt, null);
    })));
    J(this, Ke, r), J(this, Xe, t), J(this, or, (o) => {
      var f = (
        /** @type {Effect} */
        X
      );
      f.b = this, f.f |= Vn, n(o);
    }), this.parent = /** @type {Effect} */
    X.b, this.transform_error = a ?? this.parent?.transform_error ?? ((o) => o), J(this, Ie, yn(() => {
      ue(this, pe, Un).call(this);
    }, Yo));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    Ga(r, l(this, Yr), l(this, Wr));
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
    ue(this, pe, Yn).call(this, r, t), J(this, sr, l(this, sr) + r), !(!l(this, Dt) || l(this, Er)) && (J(this, Er, !0), Vt(() => {
      J(this, Er, !1), l(this, Dt) && Nr(l(this, Dt), l(this, sr));
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
      ue(this, pe, Wn).call(this, r);
    })) : ue(this, pe, Wn).call(this, r);
  }
}
Ke = new WeakMap(), Qn = new WeakMap(), Xe = new WeakMap(), or = new WeakMap(), Ie = new WeakMap(), Ze = new WeakMap(), Fe = new WeakMap(), We = new WeakMap(), Pt = new WeakMap(), sr = new WeakMap(), Ft = new WeakMap(), Er = new WeakMap(), Yr = new WeakMap(), Wr = new WeakMap(), Dt = new WeakMap(), hn = new WeakMap(), pe = new WeakSet(), Jo = function() {
  try {
    J(this, Ze, Qe(() => l(this, or).call(this, l(this, Ke))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Ko = function(r) {
  const t = l(this, Xe).failed;
  t && J(this, We, Qe(() => {
    t(
      l(this, Ke),
      () => r,
      () => () => {
      }
    );
  }));
}, Xo = function() {
  const r = l(this, Xe).pending;
  r && (this.is_pending = !0, J(this, Fe, Qe(() => r(l(this, Ke)))), Vt(() => {
    var t = J(this, Pt, document.createDocumentFragment()), n = Ht();
    t.append(n), J(this, Ze, ue(this, pe, un).call(this, () => Qe(() => l(this, or).call(this, n)))), l(this, Ft) === 0 && (l(this, Ke).before(t), J(this, Pt, null), ur(
      /** @type {Effect} */
      l(this, Fe),
      () => {
        J(this, Fe, null);
      }
    ), ue(this, pe, fn).call(
      this,
      /** @type {Batch} */
      V
    ));
  }));
}, Un = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), J(this, Ft, 0), J(this, sr, 0), J(this, Ze, Qe(() => {
      l(this, or).call(this, l(this, Ke));
    })), l(this, Ft) > 0) {
      var r = J(this, Pt, document.createDocumentFragment());
      fa(l(this, Ze), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        l(this, Xe).pending
      );
      J(this, Fe, Qe(() => t(l(this, Ke))));
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
  var t = X, n = K, a = rt;
  mt(l(this, Ie)), nt(l(this, Ie)), Ar(l(this, Ie).ctx);
  try {
    return _r.ensure(), r();
  } catch (o) {
    return Ya(o), null;
  } finally {
    mt(t), nt(n), Ar(a);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Yn = function(r, t) {
  var n;
  if (!this.has_pending_snippet()) {
    this.parent && ue(n = this.parent, pe, Yn).call(n, r, t);
    return;
  }
  J(this, Ft, l(this, Ft) + r), l(this, Ft) === 0 && (ue(this, pe, fn).call(this, t), l(this, Fe) && ur(l(this, Fe), () => {
    J(this, Fe, null);
  }), l(this, Pt) && (l(this, Ke).before(l(this, Pt)), J(this, Pt, null)));
}, /**
 * @param {unknown} error
 */
Wn = function(r) {
  l(this, Ze) && (Ve(l(this, Ze)), J(this, Ze, null)), l(this, Fe) && (Ve(l(this, Fe)), J(this, Fe, null)), l(this, We) && (Ve(l(this, We)), J(this, We, null));
  var t = l(this, Xe).onerror;
  let n = l(this, Xe).failed;
  var a = !1, o = !1;
  const f = () => {
    if (a) {
      Fo();
      return;
    }
    a = !0, o && So(), l(this, We) !== null && ur(l(this, We), () => {
      J(this, We, null);
    }), ue(this, pe, un).call(this, () => {
      ue(this, pe, Un).call(this);
    });
  }, c = (s) => {
    try {
      o = !0, t?.(s, f), o = !1;
    } catch (v) {
      jt(v, l(this, Ie) && l(this, Ie).parent);
    }
    n && J(this, We, ue(this, pe, un).call(this, () => {
      try {
        return Qe(() => {
          var v = (
            /** @type {Effect} */
            X
          );
          v.b = this, v.f |= Vn, n(
            l(this, Ke),
            () => s,
            () => f
          );
        });
      } catch (v) {
        return jt(
          v,
          /** @type {Effect} */
          l(this, Ie).parent
        ), null;
      }
    }));
  };
  Vt(() => {
    var s;
    try {
      s = this.transform_error(r);
    } catch (v) {
      jt(v, l(this, Ie) && l(this, Ie).parent);
      return;
    }
    s !== null && typeof s == "object" && typeof /** @type {any} */
    s.then == "function" ? s.then(
      c,
      /** @param {unknown} e */
      (v) => jt(v, l(this, Ie) && l(this, Ie).parent)
    ) : c(s);
  });
};
function Zo(e, r, t, n) {
  const a = na;
  var o = e.filter((y) => !y.settled);
  if (t.length === 0 && o.length === 0) {
    n(r.map(a));
    return;
  }
  var f = (
    /** @type {Effect} */
    X
  ), c = Qo(), s = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((y) => y.promise)) : null;
  function v(y) {
    c();
    try {
      n(y);
    } catch (w) {
      (f.f & et) === 0 && jt(w, f);
    }
    vn();
  }
  if (t.length === 0) {
    s.then(() => v(r.map(a)));
    return;
  }
  var g = Qa();
  function A() {
    Promise.all(t.map((y) => /* @__PURE__ */ $o(y))).then((y) => v([...r.map(a), ...y])).catch((y) => jt(y, f)).finally(() => g());
  }
  s ? s.then(() => {
    c(), A(), vn();
  }) : A();
}
function Qo() {
  var e = (
    /** @type {Effect} */
    X
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
function Qa() {
  var e = (
    /** @type {Effect} */
    X
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
function na(e) {
  var r = Pe | Le;
  return X !== null && (X.f |= Lr), {
    ctx: rt,
    deps: null,
    effects: null,
    equals: Ba,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Ae
    ),
    wv: 0,
    parent: X,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function $o(e, r, t) {
  let n = (
    /** @type {Effect | null} */
    X
  );
  n === null && go();
  var a = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = hr(
    /** @type {V} */
    Ae
  ), f = !K, c = /* @__PURE__ */ new Map();
  return _s(() => {
    var s = (
      /** @type {Effect} */
      X
    ), v = Ra();
    a = v.promise;
    try {
      Promise.resolve(e()).then(v.resolve, v.reject).finally(vn);
    } catch (w) {
      v.reject(w), vn();
    }
    var g = (
      /** @type {Batch} */
      V
    );
    if (f) {
      if ((s.f & gr) !== 0)
        var A = Qa();
      if (
        /** @type {Boundary} */
        n.b.is_rendered()
      )
        c.get(g)?.reject(Nt), c.delete(g);
      else {
        for (const w of c.values())
          w.reject(Nt);
        c.clear();
      }
      c.set(g, v);
    }
    const y = (w, k = void 0) => {
      if (A) {
        var j = k === Nt;
        A(j);
      }
      if (!(k === Nt || (s.f & et) !== 0)) {
        if (g.activate(), k)
          o.f |= Bt, Nr(o, k);
        else {
          (o.f & Bt) !== 0 && (o.f ^= Bt), Nr(o, w);
          for (const [m, U] of c) {
            if (c.delete(m), m === g) break;
            U.reject(Nt);
          }
        }
        g.deactivate();
      }
    };
    v.promise.then(y, (w) => y(null, w || "unknown"));
  }), oa(() => {
    for (const s of c.values())
      s.reject(Nt);
  }), new Promise((s) => {
    function v(g) {
      function A() {
        g === a ? s(o) : v(a);
      }
      g.then(A, A);
    }
    v(a);
  });
}
// @__NO_SIDE_EFFECTS__
function $t(e) {
  const r = /* @__PURE__ */ na(e);
  return gi(r), r;
}
// @__NO_SIDE_EFFECTS__
function es(e) {
  const r = /* @__PURE__ */ na(e);
  return r.equals = Va, r;
}
function ts(e) {
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
function aa(e) {
  var r, t = X, n = e.parent;
  if (!zt && n !== null && (n.f & (et | je)) !== 0)
    return Oo(), e.v;
  mt(n);
  try {
    e.f &= ~vr, ts(e), r = yi(e);
  } finally {
    mt(t);
  }
  return r;
}
function $a(e) {
  var r = aa(e);
  if (!e.equals(r) && (e.wv = bi(), (!V?.is_fork || e.deps === null) && (V !== null ? V.capture(e, r, !0) : e.v = r, e.deps === null))) {
    xe(e, Se);
    return;
  }
  zt || (ut !== null ? (ia() || V?.is_fork) && ut.set(e, r) : ea(e));
}
function rs(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(Nt), r.teardown = uo, r.ac = null, Hr(r, 0), sa(r));
}
function ei(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && Mr(r);
}
let Gn = /* @__PURE__ */ new Set();
const fr = /* @__PURE__ */ new Map();
let ti = !1;
function hr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Ba,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function z(e, r) {
  const t = hr(e);
  return gi(t), t;
}
// @__NO_SIDE_EFFECTS__
function ns(e, r = !1, t = !0) {
  const n = hr(e);
  return r || (n.equals = Va), n;
}
function b(e, r, t = !1) {
  K !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!dt || (K.f & Hn) !== 0) && za() && (K.f & (Pe | xt | Vr | Hn)) !== 0 && (tt === null || !Sr.call(tt, e)) && Eo();
  let n = t ? pt(r) : r;
  return Nr(e, n, an);
}
function Nr(e, r, t = null) {
  if (!e.equals(r)) {
    fr.set(e, zt ? r : e.v);
    var n = _r.ensure();
    if (n.capture(e, r), (e.f & Pe) !== 0) {
      const a = (
        /** @type {Derived} */
        e
      );
      (e.f & Le) !== 0 && aa(a), ut === null && ea(a);
    }
    e.wv = bi(), ri(e, Le, t), X !== null && (X.f & Se) !== 0 && (X.f & (ct | qt)) === 0 && (Je === null ? gs([e]) : Je.push(e)), !n.is_fork && Gn.size > 0 && !ti && as();
  }
  return r;
}
function as() {
  ti = !1;
  for (const e of Gn)
    (e.f & Se) !== 0 && xe(e, yt), Xr(e) && Mr(e);
  Gn.clear();
}
function Ir(e) {
  b(e, e.v + 1);
}
function ri(e, r, t) {
  var n = e.reactions;
  if (n !== null)
    for (var a = n.length, o = 0; o < a; o++) {
      var f = n[o], c = f.f, s = (c & Le) === 0;
      if (s && xe(f, r), (c & Pe) !== 0) {
        var v = (
          /** @type {Derived} */
          f
        );
        ut?.delete(v), (c & vr) === 0 && (c & $e && (X === null || (X.f & cn) === 0) && (f.f |= vr), ri(v, yt, t));
      } else if (s) {
        var g = (
          /** @type {Effect} */
          f
        );
        (c & xt) !== 0 && At !== null && At.add(g), t !== null ? t.push(g) : ra(g);
      }
    }
}
function pt(e) {
  if (typeof e != "object" || e === null || Fr in e)
    return e;
  const r = fo(e);
  if (r !== so && r !== lo)
    return e;
  var t = /* @__PURE__ */ new Map(), n = $n(e), a = /* @__PURE__ */ z(0), o = dr, f = (c) => {
    if (dr === o)
      return c();
    var s = K, v = dr;
    nt(null), La(o);
    var g = c();
    return nt(s), La(v), g;
  };
  return n && t.set("length", /* @__PURE__ */ z(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(c, s, v) {
        (!("value" in v) || v.configurable === !1 || v.enumerable === !1 || v.writable === !1) && ko();
        var g = t.get(s);
        return g === void 0 ? f(() => {
          var A = /* @__PURE__ */ z(v.value);
          return t.set(s, A), A;
        }) : b(g, v.value, !0), !0;
      },
      deleteProperty(c, s) {
        var v = t.get(s);
        if (v === void 0) {
          if (s in c) {
            const g = f(() => /* @__PURE__ */ z(Ae));
            t.set(s, g), Ir(a);
          }
        } else
          b(v, Ae), Ir(a);
        return !0;
      },
      get(c, s, v) {
        if (s === Fr)
          return e;
        var g = t.get(s), A = s in c;
        if (g === void 0 && (!A || Rr(c, s)?.writable) && (g = f(() => {
          var w = pt(A ? c[s] : Ae), k = /* @__PURE__ */ z(w);
          return k;
        }), t.set(s, g)), g !== void 0) {
          var y = i(g);
          return y === Ae ? void 0 : y;
        }
        return Reflect.get(c, s, v);
      },
      getOwnPropertyDescriptor(c, s) {
        var v = Reflect.getOwnPropertyDescriptor(c, s);
        if (v && "value" in v) {
          var g = t.get(s);
          g && (v.value = i(g));
        } else if (v === void 0) {
          var A = t.get(s), y = A?.v;
          if (A !== void 0 && y !== Ae)
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
        var v = t.get(s), g = v !== void 0 && v.v !== Ae || Reflect.has(c, s);
        if (v !== void 0 || X !== null && (!g || Rr(c, s)?.writable)) {
          v === void 0 && (v = f(() => {
            var y = g ? pt(c[s]) : Ae, w = /* @__PURE__ */ z(y);
            return w;
          }), t.set(s, v));
          var A = i(v);
          if (A === Ae)
            return !1;
        }
        return g;
      },
      set(c, s, v, g) {
        var A = t.get(s), y = s in c;
        if (n && s === "length")
          for (var w = v; w < /** @type {Source<number>} */
          A.v; w += 1) {
            var k = t.get(w + "");
            k !== void 0 ? b(k, Ae) : w in c && (k = f(() => /* @__PURE__ */ z(Ae)), t.set(w + "", k));
          }
        if (A === void 0)
          (!y || Rr(c, s)?.writable) && (A = f(() => /* @__PURE__ */ z(void 0)), b(A, pt(v)), t.set(s, A));
        else {
          y = A.v !== Ae;
          var j = f(() => pt(v));
          b(A, j);
        }
        var m = Reflect.getOwnPropertyDescriptor(c, s);
        if (m?.set && m.set.call(g, v), !y) {
          if (n && typeof s == "string") {
            var U = (
              /** @type {Source<number>} */
              t.get("length")
            ), se = Number(s);
            Number.isInteger(se) && se >= U.v && b(U, se + 1);
          }
          Ir(a);
        }
        return !0;
      },
      ownKeys(c) {
        i(a);
        var s = Reflect.ownKeys(c).filter((A) => {
          var y = t.get(A);
          return y === void 0 || y.v !== Ae;
        });
        for (var [v, g] of t)
          g.v !== Ae && !(v in c) && s.push(v);
        return s;
      },
      setPrototypeOf() {
        wo();
      }
    }
  );
}
function Ta(e) {
  try {
    if (e !== null && typeof e == "object" && Fr in e)
      return e[Fr];
  } catch {
  }
  return e;
}
function is(e, r) {
  return Object.is(Ta(e), Ta(r));
}
var Aa, ni, ai, ii;
function os() {
  if (Aa === void 0) {
    Aa = window, ni = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    ai = Rr(r, "firstChild").get, ii = Rr(r, "nextSibling").get, ka(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), ka(t) && (t.__t = void 0);
  }
}
function Ht(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function It(e) {
  return (
    /** @type {TemplateNode | null} */
    ai.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Kr(e) {
  return (
    /** @type {TemplateNode | null} */
    ii.call(e)
  );
}
function p(e, r) {
  return /* @__PURE__ */ It(e);
}
function st(e, r = !1) {
  {
    var t = /* @__PURE__ */ It(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ Kr(t) : t;
  }
}
function x(e, r = 1, t = !1) {
  let n = e;
  for (; r--; )
    n = /** @type {TemplateNode} */
    /* @__PURE__ */ Kr(n);
  return n;
}
function ss(e) {
  e.textContent = "";
}
function oi() {
  return !1;
}
function si(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(r ?? Ia, e, void 0)
  );
}
let Na = !1;
function ls() {
  Na || (Na = !0, document.addEventListener(
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
  var r = K, t = X;
  nt(null), mt(null);
  try {
    return e();
  } finally {
    nt(r), mt(t);
  }
}
function li(e, r, t, n = t) {
  e.addEventListener(r, () => xn(t));
  const a = e.__on_r;
  a ? e.__on_r = () => {
    a(), n(!0);
  } : e.__on_r = () => n(!0), ls();
}
function fs(e) {
  X === null && (K === null && yo(), xo()), zt && bo();
}
function us(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Ct(e, r) {
  var t = X;
  t !== null && (t.f & je) !== 0 && (e |= je);
  var n = {
    ctx: rt,
    deps: null,
    nodes: null,
    f: e | Le | $e,
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
    (a.f & Lr) === 0 && (a = a.first, (e & xt) !== 0 && (e & cr) !== 0 && a !== null && (a.f |= cr));
  }
  if (a !== null && (a.parent = t, t !== null && us(a, t), K !== null && (K.f & Pe) !== 0 && (e & qt) === 0)) {
    var o = (
      /** @type {Derived} */
      K
    );
    (o.effects ?? (o.effects = [])).push(a);
  }
  return n;
}
function ia() {
  return K !== null && !dt;
}
function oa(e) {
  const r = Ct(bn, null);
  return xe(r, Se), r.teardown = e, r;
}
function ds(e) {
  fs();
  var r = (
    /** @type {Effect} */
    X.f
  ), t = !K && (r & ct) !== 0 && (r & gr) === 0;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      rt
    );
    (n.e ?? (n.e = [])).push(e);
  } else
    return fi(e);
}
function fi(e) {
  return Ct(Tr | ho, e);
}
function cs(e) {
  _r.ensure();
  const r = Ct(qt | Lr, e);
  return (t = {}) => new Promise((n) => {
    t.outro ? ur(r, () => {
      Ve(r), n(void 0);
    }) : (Ve(r), n(void 0));
  });
}
function vs(e) {
  return Ct(Tr, e);
}
function _s(e) {
  return Ct(Vr | Lr, e);
}
function ui(e, r = 0) {
  return Ct(bn | r, e);
}
function D(e, r = [], t = [], n = []) {
  Zo(n, r, t, (a) => {
    Ct(bn, () => e(...a.map(i)));
  });
}
function yn(e, r = 0) {
  var t = Ct(xt | r, e);
  return t;
}
function Qe(e) {
  return Ct(ct | Lr, e);
}
function di(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = zt, n = K;
    Ma(!0), nt(null);
    try {
      r.call(null);
    } finally {
      Ma(t), nt(n);
    }
  }
}
function sa(e, r = !1) {
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
function hs(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & ct) === 0 && Ve(r), r = t;
  }
}
function Ve(e, r = !0) {
  var t = !1;
  (r || (e.f & _o) !== 0) && e.nodes !== null && e.nodes.end !== null && (ci(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), xe(e, wa), sa(e, r && !t), Hr(e, 0);
  var n = e.nodes && e.nodes.t;
  if (n !== null)
    for (const o of n)
      o.stop();
  di(e), e.f ^= wa, e.f |= et;
  var a = e.parent;
  a !== null && a.first !== null && vi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function ci(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ Kr(e);
    e.remove(), e = t;
  }
}
function vi(e) {
  var r = e.parent, t = e.prev, n = e.next;
  t !== null && (t.next = n), n !== null && (n.prev = t), r !== null && (r.first === e && (r.first = n), r.last === e && (r.last = t));
}
function ur(e, r, t = !0) {
  var n = [];
  _i(e, n, !0);
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
function _i(e, r, t) {
  if ((e.f & je) === 0) {
    e.f ^= je;
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
        _i(a, r, f ? t : !1);
      }
      a = o;
    }
  }
}
function la(e) {
  hi(e, !0);
}
function hi(e, r) {
  if ((e.f & je) !== 0) {
    e.f ^= je, (e.f & Se) === 0 && (xe(e, Le), _r.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var n = t.next, a = (t.f & cr) !== 0 || (t.f & ct) !== 0;
      hi(t, a ? r : !1), t = n;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const f of o)
        (f.is_global || r) && f.in();
  }
}
function fa(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, n = e.nodes.end; t !== null; ) {
      var a = t === n ? null : /* @__PURE__ */ Kr(t);
      r.append(t), t = a;
    }
}
let dn = !1, zt = !1;
function Ma(e) {
  zt = e;
}
let K = null, dt = !1;
function nt(e) {
  K = e;
}
let X = null;
function mt(e) {
  X = e;
}
let tt = null;
function gi(e) {
  K !== null && (tt === null ? tt = [e] : tt.push(e));
}
let Be = null, Ue = 0, Je = null;
function gs(e) {
  Je = e;
}
let pi = 1, rr = 0, dr = rr;
function La(e) {
  dr = e;
}
function bi() {
  return ++pi;
}
function Xr(e) {
  var r = e.f;
  if ((r & Le) !== 0)
    return !0;
  if (r & Pe && (e.f &= ~vr), (r & yt) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), n = t.length, a = 0; a < n; a++) {
      var o = t[a];
      if (Xr(
        /** @type {Derived} */
        o
      ) && $a(
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
function xi(e, r, t = !0) {
  var n = e.reactions;
  if (n !== null && !(tt !== null && Sr.call(tt, e)))
    for (var a = 0; a < n.length; a++) {
      var o = n[a];
      (o.f & Pe) !== 0 ? xi(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? xe(o, Le) : (o.f & Se) !== 0 && xe(o, yt), ra(
        /** @type {Effect} */
        o
      ));
    }
}
function yi(e) {
  var j;
  var r = Be, t = Ue, n = Je, a = K, o = tt, f = rt, c = dt, s = dr, v = e.f;
  Be = /** @type {null | Value[]} */
  null, Ue = 0, Je = null, K = (v & (ct | qt)) === 0 ? e : null, tt = null, Ar(e.ctx), dt = !1, dr = ++rr, e.ac !== null && (xn(() => {
    e.ac.abort(Nt);
  }), e.ac = null);
  try {
    e.f |= cn;
    var g = (
      /** @type {Function} */
      e.fn
    ), A = g();
    e.f |= gr;
    var y = e.deps, w = V?.is_fork;
    if (Be !== null) {
      var k;
      if (w || Hr(e, Ue), y !== null && Ue > 0)
        for (y.length = Ue + Be.length, k = 0; k < Be.length; k++)
          y[Ue + k] = Be[k];
      else
        e.deps = y = Be;
      if (ia() && (e.f & $e) !== 0)
        for (k = Ue; k < y.length; k++)
          ((j = y[k]).reactions ?? (j.reactions = [])).push(e);
    } else !w && y !== null && Ue < y.length && (Hr(e, Ue), y.length = Ue);
    if (za() && Je !== null && !dt && y !== null && (e.f & (Pe | yt | Le)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      Je.length; k++)
        xi(
          Je[k],
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
      Je !== null && (n === null ? n = Je : n.push(.../** @type {Source[]} */
      Je));
    }
    return (e.f & Bt) !== 0 && (e.f ^= Bt), A;
  } catch (m) {
    return Ya(m);
  } finally {
    e.f ^= cn, Be = r, Ue = t, Je = n, K = a, tt = o, Ar(f), dt = c, dr = s;
  }
}
function ps(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var n = io.call(t, e);
    if (n !== -1) {
      var a = t.length - 1;
      a === 0 ? t = r.reactions = null : (t[n] = t[a], t.pop());
    }
  }
  if (t === null && (r.f & Pe) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Be === null || !Sr.call(Be, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & $e) !== 0 && (o.f ^= $e, o.f &= ~vr), o.v !== Ae && ea(o), rs(o), Hr(o, 0);
  }
}
function Hr(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var n = r; n < t.length; n++)
      ps(e, t[n]);
}
function Mr(e) {
  var r = e.f;
  if ((r & et) === 0) {
    xe(e, Se);
    var t = X, n = dn;
    X = e, dn = !0;
    try {
      (r & (xt | Fa)) !== 0 ? hs(e) : sa(e), di(e);
      var a = yi(e);
      e.teardown = typeof a == "function" ? a : null, e.wv = pi;
      var o;
    } finally {
      dn = n, X = t;
    }
  }
}
async function bs() {
  await Promise.resolve(), qo();
}
function i(e) {
  var r = e.f, t = (r & Pe) !== 0;
  if (K !== null && !dt) {
    var n = X !== null && (X.f & et) !== 0;
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
      return ((f.f & Se) === 0 && f.reactions !== null || ki(f)) && (c = aa(f)), fr.set(f, c), c;
    }
    var s = (f.f & $e) === 0 && !dt && K !== null && (dn || (K.f & $e) !== 0), v = (f.f & gr) === 0;
    Xr(f) && (s && (f.f |= $e), $a(f)), s && !v && (ei(f), mi(f));
  }
  if (ut?.has(e))
    return ut.get(e);
  if ((e.f & Bt) !== 0)
    throw e.v;
  return e.v;
}
function mi(e) {
  if (e.f |= $e, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & Pe) !== 0 && (r.f & $e) === 0 && (ei(
        /** @type {Derived} */
        r
      ), mi(
        /** @type {Derived} */
        r
      ));
}
function ki(e) {
  if (e.v === Ae) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (fr.has(r) || (r.f & Pe) !== 0 && ki(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function wi(e) {
  var r = dt;
  try {
    return dt = !0, e();
  } finally {
    dt = r;
  }
}
const xs = ["touchstart", "touchmove"];
function ys(e) {
  return xs.includes(e);
}
const nr = Symbol("events"), Ei = /* @__PURE__ */ new Set(), Jn = /* @__PURE__ */ new Set();
function ms(e, r, t, n = {}) {
  function a(o) {
    if (n.capture || Kn.call(r, o), !o.cancelBubble)
      return xn(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Vt(() => {
    r.addEventListener(e, a, n);
  }) : r.addEventListener(e, a, n), a;
}
function Pa(e, r, t, n, a) {
  var o = { capture: n, passive: a }, f = ms(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && oa(() => {
    r.removeEventListener(e, f, o);
  });
}
function Re(e, r, t) {
  (r[nr] ?? (r[nr] = {}))[e] = t;
}
function ks(e) {
  for (var r = 0; r < e.length; r++)
    Ei.add(e[r]);
  for (var t of Jn)
    t(e);
}
let Da = null;
function Kn(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), n = e.type, a = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    a[0] || e.target
  );
  Da = e;
  var f = 0, c = Da === e && e[nr];
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
    oo(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var g = K, A = X;
    nt(null), mt(null);
    try {
      for (var y, w = []; o !== null; ) {
        var k = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var j = o[nr]?.[n];
          j != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && j.call(o, e);
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
      e[nr] = r, delete e.currentTarget, nt(g), mt(A);
    }
  }
}
const ws = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Es(e) {
  return (
    /** @type {string} */
    ws?.createHTML(e) ?? e
  );
}
function Ss(e) {
  var r = si("template");
  return r.innerHTML = Es(e.replaceAll("<!>", "<!---->")), r.content;
}
function qr(e, r) {
  var t = (
    /** @type {Effect} */
    X
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function C(e, r) {
  var t = (r & Lo) !== 0, n = (r & Po) !== 0, a, o = !e.startsWith("<!>");
  return () => {
    a === void 0 && (a = Ss(o ? e : "<!>" + e), t || (a = /** @type {TemplateNode} */
    /* @__PURE__ */ It(a)));
    var f = (
      /** @type {TemplateNode} */
      n || ni ? document.importNode(a, !0) : a.cloneNode(!0)
    );
    if (t) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ It(f)
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
function Ts(e, r) {
  return As(e, r);
}
const nn = /* @__PURE__ */ new Map();
function As(e, { target: r, anchor: t, props: n = {}, events: a, context: o, intro: f = !0, transformError: c }) {
  os();
  var s = void 0, v = cs(() => {
    var g = t ?? r.appendChild(Ht());
    Wo(
      /** @type {TemplateNode} */
      g,
      {
        pending: () => {
        }
      },
      (w) => {
        Ha({});
        var k = (
          /** @type {ComponentContext} */
          rt
        );
        o && (k.c = o), a && (n.$$events = a), s = e(w, n) || {}, qa();
      },
      c
    );
    var A = /* @__PURE__ */ new Set(), y = (w) => {
      for (var k = 0; k < w.length; k++) {
        var j = w[k];
        if (!A.has(j)) {
          A.add(j);
          var m = ys(j);
          for (const $ of [r, document]) {
            var U = nn.get($);
            U === void 0 && (U = /* @__PURE__ */ new Map(), nn.set($, U));
            var se = U.get(j);
            se === void 0 ? ($.addEventListener(j, Kn, { passive: m }), U.set(j, 1)) : U.set(j, se + 1);
          }
        }
      }
    };
    return y(pn(Ei)), Jn.add(y), () => {
      for (var w of A)
        for (const m of [r, document]) {
          var k = (
            /** @type {Map<string, number>} */
            nn.get(m)
          ), j = (
            /** @type {number} */
            k.get(w)
          );
          --j == 0 ? (m.removeEventListener(w, Kn), k.delete(w), k.size === 0 && nn.delete(m)) : k.set(w, j);
        }
      Jn.delete(y), g !== t && g.parentNode?.removeChild(g);
    };
  });
  return Xn.set(s, v), s;
}
let Xn = /* @__PURE__ */ new WeakMap();
function Ns(e, r) {
  const t = Xn.get(e);
  return t ? (Xn.delete(e), t(r)) : Promise.resolve();
}
var ft, gt, Ge, lr, Gr, Jr, gn;
class Si {
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
    H(this, Jr, (r) => {
      if (l(this, ft).has(r)) {
        var t = (
          /** @type {Key} */
          l(this, ft).get(r)
        ), n = l(this, gt).get(t);
        if (n)
          la(n), l(this, lr).delete(t);
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
              fa(f, v), v.append(Ht()), l(this, Ge).set(o, { effect: f, fragment: v });
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
    this.anchor = r, J(this, Gr, t);
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
    ), a = oi();
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
      n.oncommit(l(this, Jr)), n.ondiscard(l(this, gn));
    } else
      l(this, Jr).call(this, n);
  }
}
ft = new WeakMap(), gt = new WeakMap(), Ge = new WeakMap(), lr = new WeakMap(), Gr = new WeakMap(), Jr = new WeakMap(), gn = new WeakMap();
function ee(e, r, t = !1) {
  var n = new Si(e), a = t ? cr : 0;
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
function Ms(e, r, t) {
  for (var n = [], a = r.length, o, f = r.length, c = 0; c < a; c++) {
    let A = r[c];
    ur(
      A,
      () => {
        if (o) {
          if (o.pending.delete(A), o.done.add(A), o.pending.size === 0) {
            var y = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Zn(e, pn(o.done)), y.delete(o), y.size === 0 && (e.outrogroups = null);
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
      ), g = (
        /** @type {Element} */
        v.parentNode
      );
      ss(g), g.append(v), e.items.clear();
    }
    Zn(e, r, !s);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function Zn(e, r, t = !0) {
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
      fa(o, f);
    } else
      Ve(r[a], t);
  }
}
var Ca;
function lt(e, r, t, n, a, o = null) {
  var f = e, c = /* @__PURE__ */ new Map(), s = (r & ja) !== 0;
  if (s) {
    var v = (
      /** @type {Element} */
      e
    );
    f = v.appendChild(Ht());
  }
  var g = null, A = /* @__PURE__ */ es(() => {
    var $ = t();
    return $n($) ? $ : $ == null ? [] : pn($);
  }), y, w = /* @__PURE__ */ new Map(), k = !0;
  function j($) {
    (se.effect.f & et) === 0 && (se.pending.delete($), se.fallback = g, Ls(se, y, f, r, n), g !== null && (y.length === 0 ? (g.f & bt) === 0 ? la(g) : (g.f ^= bt, Or(g, null, f)) : ur(g, () => {
      g = null;
    })));
  }
  function m($) {
    se.pending.delete($);
  }
  var U = yn(() => {
    y = /** @type {V[]} */
    i(A);
    for (var $ = y.length, De = /* @__PURE__ */ new Set(), He = (
      /** @type {Batch} */
      V
    ), at = oi(), we = 0; we < $; we += 1) {
      var Me = y[we], qe = n(Me, we), ce = k ? null : c.get(qe);
      ce ? (ce.v && Nr(ce.v, Me), ce.i && Nr(ce.i, we), at && He.unskip_effect(ce.e)) : (ce = Ps(
        c,
        k ? f : Ca ?? (Ca = Ht()),
        Me,
        qe,
        we,
        a,
        r,
        t
      ), k || (ce.e.f |= bt), c.set(qe, ce)), De.add(qe);
    }
    if ($ === 0 && o && !g && (k ? g = Qe(() => o(f)) : (g = Qe(() => o(Ca ?? (Ca = Ht()))), g.f |= bt)), $ > De.size && po(), !k)
      if (w.set(He, De), at) {
        for (const [Ut, Yt] of c)
          De.has(Ut) || He.skip_effect(Yt.e);
        He.oncommit(j), He.ondiscard(m);
      } else
        j(He);
    i(A);
  }), se = { effect: U, items: c, pending: w, outrogroups: null, fallback: g };
  k = !1;
}
function Cr(e) {
  for (; e !== null && (e.f & ct) === 0; )
    e = e.next;
  return e;
}
function Ls(e, r, t, n, a) {
  var o = (n & No) !== 0, f = r.length, c = e.items, s = Cr(e.effect.first), v, g = null, A, y = [], w = [], k, j, m, U;
  if (o)
    for (U = 0; U < f; U += 1)
      k = r[U], j = a(k, U), m = /** @type {EachItem} */
      c.get(j).e, (m.f & bt) === 0 && (m.nodes?.a?.measure(), (A ?? (A = /* @__PURE__ */ new Set())).add(m));
  for (U = 0; U < f; U += 1) {
    if (k = r[U], j = a(k, U), m = /** @type {EachItem} */
    c.get(j).e, e.outrogroups !== null)
      for (const ce of e.outrogroups)
        ce.pending.delete(m), ce.done.delete(m);
    if ((m.f & je) !== 0 && (la(m), o && (m.nodes?.a?.unfix(), (A ?? (A = /* @__PURE__ */ new Set())).delete(m))), (m.f & bt) !== 0)
      if (m.f ^= bt, m === s)
        Or(m, null, t);
      else {
        var se = g ? g.next : s;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), Ot(e, g, m), Ot(e, m, se), Or(m, se, t), g = m, y = [], w = [], s = Cr(g.next);
        continue;
      }
    if (m !== s) {
      if (v !== void 0 && v.has(m)) {
        if (y.length < w.length) {
          var $ = w[0], De;
          g = $.prev;
          var He = y[0], at = y[y.length - 1];
          for (De = 0; De < y.length; De += 1)
            Or(y[De], $, t);
          for (De = 0; De < w.length; De += 1)
            v.delete(w[De]);
          Ot(e, He.prev, at.next), Ot(e, g, He), Ot(e, at, $), s = $, g = at, U -= 1, y = [], w = [];
        } else
          v.delete(m), Or(m, s, t), Ot(e, m.prev, m.next), Ot(e, m, g === null ? e.effect.first : g.next), Ot(e, g, m), g = m;
        continue;
      }
      for (y = [], w = []; s !== null && s !== m; )
        (v ?? (v = /* @__PURE__ */ new Set())).add(s), w.push(s), s = Cr(s.next);
      if (s === null)
        continue;
    }
    (m.f & bt) === 0 && y.push(m), g = m, s = Cr(m.next);
  }
  if (e.outrogroups !== null) {
    for (const ce of e.outrogroups)
      ce.pending.size === 0 && (Zn(e, pn(ce.done)), e.outrogroups?.delete(ce));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (s !== null || v !== void 0) {
    var we = [];
    if (v !== void 0)
      for (m of v)
        (m.f & je) === 0 && we.push(m);
    for (; s !== null; )
      (s.f & je) === 0 && s !== e.fallback && we.push(s), s = Cr(s.next);
    var Me = we.length;
    if (Me > 0) {
      var qe = (n & ja) !== 0 && f === 0 ? t : null;
      if (o) {
        for (U = 0; U < Me; U += 1)
          we[U].nodes?.a?.measure();
        for (U = 0; U < Me; U += 1)
          we[U].nodes?.a?.fix();
      }
      Ms(e, we, qe);
    }
  }
  o && Vt(() => {
    if (A !== void 0)
      for (m of A)
        m.nodes?.a?.apply();
  });
}
function Ps(e, r, t, n, a, o, f, c) {
  var s = (f & To) !== 0 ? (f & Mo) === 0 ? /* @__PURE__ */ ns(t, !1, !1) : hr(t) : null, v = (f & Ao) !== 0 ? hr(a) : null;
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
        /* @__PURE__ */ Kr(n)
      );
      if (o.before(n), n === a)
        return;
      n = f;
    }
}
function Ot(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function jn(e, r, t = !1, n = !1, a = !1, o = !1) {
  var f = e, c = "";
  if (t)
    var s = (
      /** @type {Element} */
      e
    );
  D(() => {
    var v = (
      /** @type {Effect} */
      X
    );
    if (c !== (c = r() ?? "")) {
      if (t) {
        v.nodes = null, s.innerHTML = /** @type {string} */
        c, c !== "" && qr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ It(s),
          /** @type {TemplateNode} */
          s.lastChild
        );
        return;
      }
      if (v.nodes !== null && (ci(
        v.nodes.start,
        /** @type {TemplateNode} */
        v.nodes.end
      ), v.nodes = null), c !== "") {
        var g = n ? Do : a ? Co : void 0, A = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          si(n ? "svg" : a ? "math" : "template", g)
        );
        A.innerHTML = /** @type {any} */
        c;
        var y = n || a ? A : (
          /** @type {HTMLTemplateElement} */
          A.content
        );
        if (qr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ It(y),
          /** @type {TemplateNode} */
          y.lastChild
        ), n || a)
          for (; /* @__PURE__ */ It(y); )
            f.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ It(y)
            );
        else
          f.before(y);
      }
    }
  });
}
function Ds(e, r, t) {
  var n = new Si(e);
  yn(() => {
    var a = r() ?? null;
    n.ensure(a, a && ((o) => t(o, a)));
  }, cr);
}
function Ti(e) {
  var r, t, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var a = e.length;
    for (r = 0; r < a; r++) e[r] && (t = Ti(e[r])) && (n && (n += " "), n += t);
  } else for (t in e) e[t] && (n && (n += " "), n += t);
  return n;
}
function Cs() {
  for (var e, r, t = 0, n = "", a = arguments.length; t < a; t++) (e = arguments[t]) && (r = Ti(e)) && (n && (n += " "), n += r);
  return n;
}
function u(e) {
  return typeof e == "object" ? Cs(e) : e ?? "";
}
function Os(e, r, t) {
  var n = e == null ? "" : "" + e;
  return n === "" ? null : n;
}
function d(e, r, t, n, a, o) {
  var f = e.__className;
  if (f !== t || f === void 0) {
    var c = Os(t);
    c == null ? e.removeAttribute("class") : e.className = c, e.__className = t;
  }
  return o;
}
function Ai(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!$n(r))
      return Ro();
    for (var n of e.options)
      n.selected = r.includes(Br(n));
    return;
  }
  for (n of e.options) {
    var a = Br(n);
    if (is(a, r)) {
      n.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function Rs(e) {
  var r = new MutationObserver(() => {
    Ai(e, e.__value);
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
  }), oa(() => {
    r.disconnect();
  });
}
function Fs(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet(), a = !0;
  li(e, "change", (o) => {
    var f = o ? "[selected]" : ":checked", c;
    if (e.multiple)
      c = [].map.call(e.querySelectorAll(f), Br);
    else {
      var s = e.querySelector(f) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      c = s && Br(s);
    }
    t(c), e.__value = c, V !== null && n.add(V);
  }), vs(() => {
    var o = r();
    if (e === document.activeElement) {
      var f = (
        /** @type {Batch} */
        V
      );
      if (n.has(f))
        return;
    }
    if (Ai(e, o, a), a && o === void 0) {
      var c = e.querySelector(":checked");
      c !== null && (o = Br(c), t(o));
    }
    e.__value = o, a = !1;
  }), Rs(e);
}
function Br(e) {
  return "__value" in e ? e.__value : e.value;
}
const js = Symbol("is custom element"), Is = Symbol("is html");
function Bs(e, r) {
  var t = Vs(e);
  t.checked !== (t.checked = // treat null and undefined the same for the initial value
  r ?? void 0) && (e.checked = r);
}
function Vs(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [js]: e.nodeName.includes("-"),
      [Is]: e.namespaceURI === Ia
    })
  );
}
function er(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet();
  li(e, "input", async (a) => {
    var o = a ? e.defaultValue : e.value;
    if (o = In(e) ? Bn(o) : o, t(o), V !== null && n.add(V), await bs(), o !== (o = r())) {
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
  wi(r) == null && e.value && (t(In(e) ? Bn(e.value) : e.value), V !== null && n.add(V)), ui(() => {
    var a = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        V
      );
      if (n.has(o))
        return;
    }
    In(e) && a === Bn(e.value) || e.type === "date" && !a && !e.value || a !== e.value && (e.value = a ?? "");
  });
}
function In(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function Bn(e) {
  return e === "" ? null : +e;
}
const Hs = "5";
var Oa;
typeof window < "u" && ((Oa = window.__svelte ?? (window.__svelte = {})).v ?? (Oa.v = /* @__PURE__ */ new Set())).add(Hs);
var qs = /* @__PURE__ */ C("<div><span> </span> <div><div> </div> <div> </div></div></div>"), zs = /* @__PURE__ */ C("<p>Select at least one token to view balances</p>"), Us = /* @__PURE__ */ C("<div><h3>Vault Balances</h3> <div><!> <!></div> <p>On-chain ledger balances for the vault canister</p></div>"), Ys = /* @__PURE__ */ C("<span>Copied!</span>"), Ws = /* @__PURE__ */ C("<div><span>Last Refresh:</span> <span> </span></div>"), Gs = /* @__PURE__ */ C('<label><input type="checkbox"/> <span> </span></label>'), Js = /* @__PURE__ */ C("<div><h3>Active Tokens</h3> <div></div></div>"), Ks = /* @__PURE__ */ C("<div><div> </div> <div><span>Ledger:</span> <button> </button></div> <div><span>Indexer:</span> <button> </button></div></div>"), Xs = /* @__PURE__ */ C("<div><h3>Ledger Canisters</h3> <div></div></div>"), Zs = /* @__PURE__ */ C('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), Qs = /* @__PURE__ */ C("<div> </div>"), $s = /* @__PURE__ */ C("<button> </button>"), el = /* @__PURE__ */ C("<div><span> </span> <div><div> </div> <div> </div></div></div>"), tl = /* @__PURE__ */ C("<p>Select at least one token to view balances</p>"), rl = /* @__PURE__ */ C("<div><p><span>Principal:</span> <span> </span></p></div>"), nl = /* @__PURE__ */ C("<p> </p>"), al = /* @__PURE__ */ C("<div><h2>Your Balance</h2> <div><!> <!></div> <!> <!></div>"), il = /* @__PURE__ */ C("<span>✓</span>"), ol = /* @__PURE__ */ C("<button> </button> <!>", 1), sl = /* @__PURE__ */ C("<span>N/A</span>"), ll = /* @__PURE__ */ C("<span>✓</span>"), fl = /* @__PURE__ */ C("<button> </button> <!>", 1), ul = /* @__PURE__ */ C("<span>N/A</span>"), dl = /* @__PURE__ */ C("<button> </button>"), cl = /* @__PURE__ */ C("<span>N/A</span>"), vl = /* @__PURE__ */ C("<tr><td> </td><td><span> </span></td><td><!></td><td><!></td><td> </td><td><!></td><td><span> </span></td></tr>"), _l = /* @__PURE__ */ C('<tr><td colspan="7">No transactions found</td></tr>'), hl = /* @__PURE__ */ C("<span>…</span>"), gl = /* @__PURE__ */ C("<button> </button>"), pl = /* @__PURE__ */ C("<div><span> </span> <div><button>Prev</button> <!> <button>Next</button></div></div>"), bl = /* @__PURE__ */ C("<div><h2>Transaction History</h2> <div><table><thead><tr><th>ID</th><th>Token</th><th>From</th><th>To</th><th>Amount</th><th>When</th><th>Type</th></tr></thead><tbody></tbody></table></div> <!></div>"), xl = /* @__PURE__ */ C("<option> </option>"), yl = /* @__PURE__ */ C('<div><h2>Transfer Tokens (Admin Only)</h2> <form><div><label for="v-token">Token</label> <select id="v-token"></select></div> <div><label for="v-to">Recipient Principal</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/></div> <div><label for="v-amount"> </label> <input id="v-amount" type="number" placeholder="100000000"/></div> <div><label for="v-to-sub">To Subaccount (optional, 64-char hex)</label> <input id="v-to-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <div><label for="v-from-sub">From Subaccount (optional, 64-char hex)</label> <input id="v-from-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <button type="submit"> </button></form></div>'), ml = /* @__PURE__ */ C("<button> </button>"), kl = /* @__PURE__ */ C('<input type="text" placeholder="Enter principal ID"/>'), wl = /* @__PURE__ */ C('<input type="text" placeholder="Enter invoice ID"/>'), El = /* @__PURE__ */ C('<input type="text" placeholder="Enter 64-char hex subaccount"/>'), Sl = /* @__PURE__ */ C("<div><span> </span> <div><div> </div> <div> </div></div></div>"), Tl = /* @__PURE__ */ C("<p>No balances found for this subaccount.</p>"), Al = /* @__PURE__ */ C("<div><div><div><span>Account:</span> <span> </span></div> <button> </button></div> <div></div> <!></div>"), Nl = /* @__PURE__ */ C(`<div><h2>Subaccount Lookup</h2> <p>Look up token balances for a user (by principal) or an invoice (by ID).
					The subaccount is derived using the <code>usr_</code> / <code>inv_</code> prefix convention.</p> <div></div> <form><!> <button type="submit"><!> </button></form> <!></div>`), Ml = /* @__PURE__ */ C("<div> </div>"), Ll = /* @__PURE__ */ C("<div><div> </div> <div> </div> <!></div>"), Pl = /* @__PURE__ */ C("<div></div>"), Dl = /* @__PURE__ */ C("<p>No balances found in system</p>"), Cl = /* @__PURE__ */ C("<p> </p>"), Ol = /* @__PURE__ */ C("<p>No transfer data available</p>"), Rl = /* @__PURE__ */ C("<div><h2>Vault Admin</h2> <div><button><!> </button></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>"), Fl = /* @__PURE__ */ C("<div><div><h1>Vault</h1> <button><!> </button></div> <!> <div><div><span>Vault Principal:</span> <button> </button> <!></div> <!></div> <!> <!> <!> <nav></nav> <div><!></div></div>");
function jl(e, r) {
  Ha(r, !0);
  const t = r.ctx.theme?.cn ?? ((..._) => _.filter(Boolean).join(" "));
  let n = /* @__PURE__ */ z("balance"), a = /* @__PURE__ */ z(!1), o = /* @__PURE__ */ z(""), f = /* @__PURE__ */ z(""), c = /* @__PURE__ */ z(""), s = /* @__PURE__ */ z(""), v = /* @__PURE__ */ z(pt({})), g = /* @__PURE__ */ z(pt({})), A = /* @__PURE__ */ z(pt({})), y = /* @__PURE__ */ z(!1), w = /* @__PURE__ */ z(0), k = /* @__PURE__ */ z(null), j = /* @__PURE__ */ z(pt([])), m = /* @__PURE__ */ z(null), U = /* @__PURE__ */ z(pt([])), se = /* @__PURE__ */ z(null), $ = /* @__PURE__ */ z(0);
  const De = 10;
  let He = /* @__PURE__ */ z(!1), at = /* @__PURE__ */ z(null), we = /* @__PURE__ */ z(""), Me = /* @__PURE__ */ z(""), qe = /* @__PURE__ */ z(""), ce = /* @__PURE__ */ z(0), Ut = /* @__PURE__ */ z(""), Yt = /* @__PURE__ */ z(""), Wt = /* @__PURE__ */ z("user"), Zr = /* @__PURE__ */ z(""), Qr = /* @__PURE__ */ z(""), $r = /* @__PURE__ */ z(""), kt = /* @__PURE__ */ z(null), pr = /* @__PURE__ */ z(!1), Gt = /* @__PURE__ */ $t(() => Object.keys(i(v))), mn = /* @__PURE__ */ $t(() => Object.values(i(g)).some(Boolean));
  function kn(_) {
    return typeof _ == "string" ? JSON.parse(_) : _;
  }
  function en(_) {
    return _ && typeof _ == "object" && _.success === !0 && _.data != null ? _.data : _;
  }
  function ua(_) {
    return i(v)[_]?.name ?? _;
  }
  async function Jt(_) {
    try {
      await navigator.clipboard.writeText(_), b(we, _, !0), setTimeout(() => b(we, ""), 2e3);
    } catch {
    }
  }
  function da(_) {
    const h = Math.floor((Date.now() - _.getTime()) / 1e3);
    if (h < 60) return `${h}s ago`;
    const N = Math.floor(h / 60);
    if (N < 60) return `${N}m ago`;
    const S = Math.floor(N / 60);
    return S < 24 ? `${S}h ago` : `${Math.floor(S / 24)}d ago`;
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
  function wn(_, h) {
    return (_ / Math.pow(10, h)).toFixed(h);
  }
  function ca(_, h = 20) {
    return _.length > h ? `${_.substring(0, h)}…` : _;
  }
  async function Mi() {
    try {
      const _ = await r.ctx.backend.get_objects_paginated("Token", 0, 100, "asc"), h = kn(_);
      if (h?.success && h?.data?.objectsListPaginated) {
        const N = h.data.objectsListPaginated.objects.map((F) => JSON.parse(F)), S = {}, I = {}, O = {};
        for (const F of N) {
          const Z = F.enabled ?? F._prop_enabled ?? "true", G = F.symbol ?? F._prop_symbol ?? F.name, ae = F.ledger_canister_id ?? F.ledger ?? "", W = F.indexer_canister_id ?? F.indexer ?? "";
          Z === "true" && G && (S[G] = {
            ledger: ae,
            indexer: W,
            decimals: F.decimals || 8,
            symbol: G,
            name: F.name
          }, I[G] = !0, O[G] = 0);
        }
        b(v, S, !0), b(g, I, !0), b(A, O, !0);
        const Y = Object.keys(S);
        Y.length > 0 && !i(Me) && b(Me, Y[0], !0), b(y, !0);
      }
    } catch (_) {
      console.error("Failed to load tokens:", _);
    }
  }
  async function va() {
    b(a, !0), b(o, ""), b(f, "");
    try {
      i(c) || b(c, r.ctx.principal || "", !0);
      const _ = await r.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), h = kn(_);
      if (h?.success && h?.data?.objectsListPaginated) {
        const N = h.data.objectsListPaginated;
        b(m, N.pagination, !0), b(j, N.objects.map((S) => JSON.parse(S)), !0), b(k, i(j).find((S) => S.principal === i(c) || S.id === i(c) || S._id === i(c)), !0), b(w, i(k) && i(k).amount || 0, !0);
      } else
        b(w, 0), b(k, null);
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(a, !1);
    }
  }
  async function En(_ = i($)) {
    b(a, !0), b(o, ""), b(f, "");
    try {
      if (!i(s))
        try {
          if (typeof r.ctx.backend.get_canister_id == "function") {
            const S = await r.ctx.backend.get_canister_id();
            b(s, S || "", !0);
          }
        } catch {
          b(s, "");
        }
      const h = await r.ctx.backend.get_objects_paginated("WalletTransfer", _, De, "desc"), N = kn(h);
      if (N?.success && N?.data?.objectsListPaginated) {
        const S = N.data.objectsListPaginated;
        b(se, S.pagination, !0), b(U, S.objects.map((I) => JSON.parse(I)), !0);
      } else
        b(U, [], !0);
    } catch (h) {
      const N = r.ctx.ui?.accessDeniedOperation?.(h);
      N != null ? (b(f, N, !0), b(o, "")) : (b(f, ""), b(o, h?.message ?? String(h), !0));
    } finally {
      b(a, !1);
    }
  }
  async function Li(_) {
    try {
      const h = en(await r.ctx.callSync("get_vault_balance", { token: ua(_) }));
      h?.Balance && (i(A)[_] = h.Balance.amount || 0, b(A, { ...i(A) }, !0), b(s, h.Balance.principal_id || i(s), !0));
    } catch (h) {
      console.error(`Failed to load vault balance for ${_}:`, h);
    }
  }
  async function Pi() {
    for (const _ of i(Gt))
      i(g)[_] && await Li(_);
  }
  async function Sn() {
    b(a, !0), b(o, ""), b(f, "");
    try {
      if (en(await r.ctx.callAsync("refresh", {}))?.TransactionSummary == null) {
        b(o, "Failed to sync vault transactions");
        return;
      }
      b(at, /* @__PURE__ */ new Date(), !0), await va(), await Pi(), await En(0);
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(a, !1);
    }
  }
  async function Di() {
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
      i(Ut).trim() && (_.to_subaccount = i(Ut).trim()), i(Yt).trim() && (_.from_subaccount = i(Yt).trim()), i(Me) && (_.token = ua(i(Me))), en(await r.ctx.callAsync("transfer", _)), b(qe, ""), b(ce, 0), b(Ut, ""), b(Yt, ""), await va(), await En();
    } catch (_) {
      const h = r.ctx.ui?.accessDeniedOperation?.(_);
      h != null ? (b(f, h, !0), b(o, "")) : (b(f, ""), b(o, _?.message ?? String(_), !0));
    } finally {
      b(a, !1);
    }
  }
  async function Ci() {
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
  async function Tn(_) {
    b($, _, !0), await En(_);
  }
  function Oi(_, h) {
    if (_ <= 7) return Array.from({ length: _ }, (S, I) => I);
    const N = [0];
    h > 3 && N.push("...");
    for (let S = Math.max(1, h - 1); S <= Math.min(_ - 2, h + 1); S++) N.push(S);
    return h < _ - 4 && N.push("..."), N.push(_ - 1), N;
  }
  const Ri = [
    { id: "balance", label: "Balances" },
    { id: "transactions", label: "Transactions" },
    { id: "transfer", label: "Transfer" },
    { id: "lookup", label: "Lookup" },
    { id: "admin", label: "Admin" }
  ], An = '<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>';
  ds(() => {
    (async () => (await Mi(), await Sn()))();
  });
  var Nn = Fl(), Mn = p(Nn), _a = p(Mn), tn = x(_a, 2), ha = p(tn);
  {
    var Fi = (_) => {
      var h = Tt(), N = st(h);
      jn(N, () => An), M(_, h);
    };
    ee(ha, (_) => {
      (i(a) || i(He)) && _(Fi);
    });
  }
  var ji = x(ha), ga = x(Mn, 2);
  {
    var Ii = (_) => {
      var h = Us(), N = p(h), S = x(N, 2), I = p(S);
      lt(I, 17, () => i(Gt), vt, (Z, G) => {
        var ae = Tt(), W = st(ae);
        {
          var Q = (re) => {
            var ve = qs(), _e = p(ve), Ee = p(_e), ye = x(_e, 2), L = p(ye), T = p(L), E = x(L, 2), R = p(E);
            D(
              (P, q, te, ne, ie, oe, me) => {
                d(ve, 1, P), d(_e, 1, q), B(Ee, i(v)[i(G)].symbol), d(ye, 1, te), d(L, 1, ne), B(T, ie), d(E, 1, oe), B(R, `${me ?? ""} units`);
              },
              [
                () => u(t("flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-lg p-3")),
                () => u(t("text-base font-semibold text-indigo-900 dark:text-indigo-200")),
                () => u(t("text-right")),
                () => u(t("text-xl font-bold text-indigo-900 dark:text-indigo-100")),
                () => wn(i(A)[i(G)] || 0, i(v)[i(G)].decimals),
                () => u(t("text-xs text-indigo-600 dark:text-indigo-400")),
                () => (i(A)[i(G)] || 0).toLocaleString()
              ]
            ), M(re, ve);
          };
          ee(W, (re) => {
            i(g)[i(G)] && re(Q);
          });
        }
        M(Z, ae);
      });
      var O = x(I, 2);
      {
        var Y = (Z) => {
          var G = zs();
          D((ae) => d(G, 1, ae), [() => u(t("text-sm text-gray-500 italic"))]), M(Z, G);
        };
        ee(O, (Z) => {
          i(mn) || Z(Y);
        });
      }
      var F = x(S, 2);
      D(
        (Z, G, ae, W) => {
          d(h, 1, Z), d(N, 1, G), d(S, 1, ae), d(F, 1, W);
        },
        [
          () => u(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => u(t("text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3")),
          () => u(t("space-y-2")),
          () => u(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), M(_, h);
    };
    ee(ga, (_) => {
      i(y) && _(Ii);
    });
  }
  var Ln = x(ga, 2), Pn = p(Ln), pa = p(Pn), rn = x(pa, 2), Bi = p(rn), Vi = x(rn, 2);
  {
    var Hi = (_) => {
      var h = Ys();
      D((N) => d(h, 1, N), [
        () => u(t("text-xs text-green-600 dark:text-green-400"))
      ]), M(_, h);
    };
    ee(Vi, (_) => {
      i(we) === i(s) && i(s) && _(Hi);
    });
  }
  var qi = x(Pn, 2);
  {
    var zi = (_) => {
      var h = Ws(), N = p(h), S = x(N, 2), I = p(S);
      D(
        (O, Y, F, Z) => {
          d(N, 1, O), d(S, 1, Y), B(I, `${F ?? ""} (${Z ?? ""})`);
        },
        [
          () => u(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
          () => u(t("ml-2 text-sm text-gray-700 dark:text-gray-300")),
          () => i(at).toLocaleString(),
          () => da(i(at))
        ]
      ), M(_, h);
    };
    ee(qi, (_) => {
      i(at) && _(zi);
    });
  }
  var ba = x(Ln, 2);
  {
    var Ui = (_) => {
      var h = Js(), N = p(h), S = x(N, 2);
      lt(S, 21, () => i(Gt), vt, (I, O) => {
        var Y = Gs(), F = p(Y), Z = x(F, 2), G = p(Z);
        D(
          (ae, W, Q) => {
            d(Y, 1, ae), Bs(F, i(g)[i(O)]), d(F, 1, W), d(Z, 1, Q), B(G, i(v)[i(O)].symbol);
          },
          [
            () => u(t("flex items-center gap-2 cursor-pointer")),
            () => u(t("w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500")),
            () => u(t("text-sm font-medium text-gray-700 dark:text-gray-300"))
          ]
        ), Re("change", F, () => {
          i(g)[i(O)] = !i(g)[i(O)], b(g, { ...i(g) }, !0);
        }), M(I, Y);
      }), D(
        (I, O, Y) => {
          d(h, 1, I), d(N, 1, O), d(S, 1, Y);
        },
        [
          () => u(t("bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4")),
          () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("flex flex-wrap gap-4"))
        ]
      ), M(_, h);
    };
    ee(ba, (_) => {
      i(y) && i(Gt).length > 0 && _(Ui);
    });
  }
  var xa = x(ba, 2);
  {
    var Yi = (_) => {
      var h = Xs(), N = p(h), S = x(N, 2);
      lt(S, 21, () => i(Gt), vt, (I, O) => {
        var Y = Tt(), F = st(Y);
        {
          var Z = (G) => {
            var ae = Ks(), W = p(ae), Q = p(W), re = x(W, 2), ve = p(re), _e = x(ve, 2), Ee = p(_e), ye = x(re, 2), L = p(ye), T = x(L, 2), E = p(T);
            D(
              (R, P, q, te, ne, ie, oe, me) => {
                d(ae, 1, R), d(W, 1, P), B(Q, i(v)[i(O)].symbol), d(re, 1, q), d(ve, 1, te), d(_e, 1, ne), B(Ee, i(v)[i(O)].ledger), d(ye, 1, ie), d(L, 1, oe), d(T, 1, me), B(E, i(v)[i(O)].indexer);
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
            ), Re("click", _e, () => Jt(i(v)[i(O)].ledger)), Re("click", T, () => Jt(i(v)[i(O)].indexer)), M(G, ae);
          };
          ee(F, (G) => {
            i(g)[i(O)] && G(Z);
          });
        }
        M(I, Y);
      }), D(
        (I, O, Y) => {
          d(h, 1, I), d(N, 1, O), d(S, 1, Y);
        },
        [
          () => u(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4")),
          () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => u(t("space-y-2"))
        ]
      ), M(_, h);
    };
    ee(xa, (_) => {
      i(y) && i(mn) && _(Yi);
    });
  }
  var ya = x(xa, 2);
  {
    var Wi = (_) => {
      var h = Tt(), N = st(h);
      {
        var S = (O) => {
          var Y = Tt(), F = st(Y);
          Ds(F, () => r.ctx.ui.AccessDenied, (Z, G) => {
            G(Z, {
              get operation() {
                return i(f);
              }
            });
          }), M(O, Y);
        }, I = (O) => {
          var Y = Zs();
          M(O, Y);
        };
        ee(N, (O) => {
          r.ctx.ui?.AccessDenied ? O(S) : O(I, -1);
        });
      }
      M(_, h);
    }, Gi = (_) => {
      var h = Qs(), N = p(h);
      D(
        (S) => {
          d(h, 1, S), B(N, i(o));
        },
        [
          () => u(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300"))
        ]
      ), M(_, h);
    };
    ee(ya, (_) => {
      i(f) ? _(Wi) : i(o) && _(Gi, 1);
    });
  }
  var Dn = x(ya, 2);
  lt(Dn, 21, () => Ri, vt, (_, h) => {
    var N = $s(), S = p(N);
    D(
      (I) => {
        d(N, 1, I), B(S, i(h).label);
      },
      [
        () => u(t("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", i(n) === i(h).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Re("click", N, () => {
      b(n, i(h).id, !0);
    }), M(_, N);
  });
  var Ji = x(Dn, 2), Ki = p(Ji);
  {
    var Xi = (_) => {
      var h = al(), N = p(h), S = x(N, 2), I = p(S);
      lt(I, 17, () => i(Gt), vt, (W, Q) => {
        var re = Tt(), ve = st(re);
        {
          var _e = (Ee) => {
            var ye = el(), L = p(ye), T = p(L), E = x(L, 2), R = p(E), P = p(R), q = x(R, 2), te = p(q);
            D(
              (ne, ie, oe, me, Ce, Ne, le) => {
                d(ye, 1, ne), d(L, 1, ie), B(T, i(v)[i(Q)].symbol), d(E, 1, oe), d(R, 1, me), B(P, Ce), d(q, 1, Ne), B(te, `${le ?? ""} units`);
              },
              [
                () => u(t("flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => u(t("text-base font-semibold text-gray-700 dark:text-gray-300")),
                () => u(t("text-right")),
                () => u(t("text-xl font-bold text-indigo-600 dark:text-indigo-400")),
                () => wn(i(w), i(v)[i(Q)].decimals),
                () => u(t("text-xs text-gray-500 dark:text-gray-400")),
                () => i(w).toLocaleString()
              ]
            ), M(Ee, ye);
          };
          ee(ve, (Ee) => {
            i(g)[i(Q)] && Ee(_e);
          });
        }
        M(W, re);
      });
      var O = x(I, 2);
      {
        var Y = (W) => {
          var Q = tl();
          D((re) => d(Q, 1, re), [() => u(t("text-sm text-gray-500 italic"))]), M(W, Q);
        };
        ee(O, (W) => {
          i(mn) || W(Y);
        });
      }
      var F = x(S, 2);
      {
        var Z = (W) => {
          var Q = rl(), re = p(Q), ve = p(re), _e = x(ve, 2), Ee = p(_e);
          D(
            (ye, L, T, E) => {
              d(Q, 1, ye), d(re, 1, L), d(ve, 1, T), d(_e, 1, E), B(Ee, i(k)._id || i(k).id);
            },
            [
              () => u(t("mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
              () => u(t("text-sm text-gray-600 dark:text-gray-400")),
              () => u(t("font-medium")),
              () => u(t("font-mono text-xs ml-1"))
            ]
          ), M(W, Q);
        };
        ee(F, (W) => {
          i(k) && W(Z);
        });
      }
      var G = x(F, 2);
      {
        var ae = (W) => {
          var Q = nl(), re = p(Q);
          D(
            (ve, _e) => {
              d(Q, 1, ve), B(re, `Showing ${i(j).length ?? ""} balance(s) (Page ${_e ?? ""} of ${i(m).total_pages ?? ""})`);
            },
            [
              () => u(t("mt-3 text-xs text-gray-500 dark:text-gray-400")),
              () => Number(i(m).page_num) + 1
            ]
          ), M(W, Q);
        };
        ee(G, (W) => {
          i(m) && W(ae);
        });
      }
      D(
        (W, Q, re) => {
          d(h, 1, W), d(N, 1, Q), d(S, 1, re);
        },
        [
          () => u(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => u(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => u(t("space-y-3"))
        ]
      ), M(_, h);
    }, Zi = (_) => {
      var h = bl(), N = p(h), S = x(N, 2), I = p(S), O = p(I), Y = p(O), F = p(Y), Z = x(F), G = x(Z), ae = x(G), W = x(ae), Q = x(W), re = x(Q), ve = x(O);
      lt(
        ve,
        21,
        () => i(U),
        (L) => L._id || L.tx_id || Math.random(),
        (L, T) => {
          var E = vl(), R = p(E), P = p(R), q = x(R), te = p(q), ne = p(te), ie = x(q), oe = p(ie);
          {
            var me = (fe) => {
              var be = ol(), de = st(be), wt = p(de), Et = x(de, 2);
              {
                var St = (Oe) => {
                  var ze = il();
                  D((Zt) => d(ze, 1, Zt), [() => u(t("ml-1 text-xs text-green-600"))]), M(Oe, ze);
                };
                ee(Et, (Oe) => {
                  i(we) === i(T).principal_from && Oe(St);
                });
              }
              D(
                (Oe, ze) => {
                  d(de, 1, Oe), B(wt, ze);
                },
                [
                  () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => ca(i(T).principal_from)
                ]
              ), Re("click", de, () => Jt(i(T).principal_from)), M(fe, be);
            }, Ce = (fe) => {
              var be = sl();
              D((de) => d(be, 1, de), [() => u(t("text-gray-400"))]), M(fe, be);
            };
            ee(oe, (fe) => {
              i(T).principal_from ? fe(me) : fe(Ce, -1);
            });
          }
          var Ne = x(ie), le = p(Ne);
          {
            var he = (fe) => {
              var be = fl(), de = st(be), wt = p(de), Et = x(de, 2);
              {
                var St = (Oe) => {
                  var ze = ll();
                  D((Zt) => d(ze, 1, Zt), [() => u(t("ml-1 text-xs text-green-600"))]), M(Oe, ze);
                };
                ee(Et, (Oe) => {
                  i(we) === i(T).principal_to && Oe(St);
                });
              }
              D(
                (Oe, ze) => {
                  d(de, 1, Oe), B(wt, ze);
                },
                [
                  () => u(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => ca(i(T).principal_to)
                ]
              ), Re("click", de, () => Jt(i(T).principal_to)), M(fe, be);
            }, ge = (fe) => {
              var be = ul();
              D((de) => d(be, 1, de), [() => u(t("text-gray-400"))]), M(fe, be);
            };
            ee(le, (fe) => {
              i(T).principal_to ? fe(he) : fe(ge, -1);
            });
          }
          var Te = x(Ne), it = p(Te), Kt = x(Te), Xt = p(Kt);
          {
            var Pr = (fe) => {
              const be = /* @__PURE__ */ $t(() => Ni(i(T).timestamp));
              var de = dl(), wt = p(de);
              D(
                (Et, St) => {
                  d(de, 1, Et), B(wt, St);
                },
                [
                  () => u(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                  () => da(i(be))
                ]
              ), Re("click", de, () => Jt(i(be).toLocaleString())), M(fe, de);
            }, Cn = (fe) => {
              var be = cl();
              D((de) => d(be, 1, de), [() => u(t("text-gray-400"))]), M(fe, be);
            };
            ee(Xt, (fe) => {
              i(T).timestamp ? fe(Pr) : fe(Cn, -1);
            });
          }
          var Dr = x(Kt), br = p(Dr), On = p(br);
          D(
            (fe, be, de, wt, Et, St, Oe, ze, Zt, to, ro) => {
              d(E, 1, fe), d(R, 1, be), B(P, i(T).tx_id || i(T)._id), d(q, 1, de), d(te, 1, wt), B(ne, i(T).token || "—"), d(ie, 1, Et), d(Ne, 1, St), d(Te, 1, Oe), B(it, ze), d(Kt, 1, Zt), d(Dr, 1, to), d(br, 1, ro), B(On, i(T).kind || "transfer");
            },
            [
              () => u(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
              () => u(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => u(t("px-4 py-3")),
              () => u(t("px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded text-xs font-medium")),
              () => u(t("px-4 py-3 font-mono text-xs")),
              () => u(t("px-4 py-3 font-mono text-xs")),
              () => u(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => (i(T).amount || 0).toLocaleString(),
              () => u(t("px-4 py-3")),
              () => u(t("px-4 py-3")),
              () => u(t("px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs"))
            ]
          ), M(L, E);
        },
        (L) => {
          var T = _l(), E = p(T);
          D((R) => d(E, 1, R), [
            () => u(t("px-4 py-8 text-center text-gray-500 dark:text-gray-400"))
          ]), M(L, T);
        }
      );
      var _e = x(S, 2);
      {
        var Ee = (L) => {
          var T = pl(), E = p(T), R = p(E), P = x(E, 2), q = p(P), te = x(q, 2);
          lt(te, 17, () => Oi(Number(i(se).total_pages), i($)), vt, (ie, oe) => {
            var me = Tt(), Ce = st(me);
            {
              var Ne = (he) => {
                var ge = hl();
                D((Te) => d(ge, 1, Te), [() => u(t("px-1.5 text-xs text-gray-400"))]), M(he, ge);
              }, le = (he) => {
                var ge = gl(), Te = p(ge);
                D(
                  (it) => {
                    d(ge, 1, it), B(Te, i(oe) + 1);
                  },
                  [
                    () => u(t("px-2.5 py-1 text-xs border rounded", i($) === i(oe) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                  ]
                ), Re("click", ge, () => Tn(i(oe))), M(he, ge);
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
              d(T, 1, ie), d(E, 1, oe), B(R, `${i(U).length ?? ""} of ${i(se).total_items_count ?? ""} (Page ${i($) + 1} / ${i(se).total_pages ?? ""})`), d(P, 1, me), q.disabled = i($) === 0, d(q, 1, Ce), ne.disabled = Ne, d(ne, 1, le);
            },
            [
              () => u(t("p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between")),
              () => u(t("text-xs text-gray-500 dark:text-gray-400")),
              () => u(t("flex items-center gap-1")),
              () => u(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
              () => i($) >= Number(i(se).total_pages) - 1,
              () => u(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
            ]
          ), Re("click", q, () => Tn(i($) - 1)), Re("click", ne, () => Tn(i($) + 1)), M(L, T);
        }, ye = /* @__PURE__ */ $t(() => i(se) && Number(i(se).total_pages) > 1);
        ee(_e, (L) => {
          i(ye) && L(Ee);
        });
      }
      D(
        (L, T, E, R, P, q, te, ne, ie, oe, me, Ce, Ne) => {
          d(h, 1, L), d(N, 1, T), d(S, 1, E), d(I, 1, R), d(O, 1, P), d(F, 1, q), d(Z, 1, te), d(G, 1, ne), d(ae, 1, ie), d(W, 1, oe), d(Q, 1, me), d(re, 1, Ce), d(ve, 1, Ne);
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
    }, Qi = (_) => {
      var h = yl(), N = p(h), S = x(N, 2), I = p(S), O = p(I), Y = x(O, 2);
      lt(Y, 21, () => i(Gt), vt, (P, q) => {
        var te = xl(), ne = p(te), ie = {};
        D(() => {
          B(ne, i(v)[i(q)].symbol), ie !== (ie = i(q)) && (te.value = (te.__value = i(q)) ?? "");
        }), M(P, te);
      });
      var F = x(I, 2), Z = p(F), G = x(Z, 2), ae = x(F, 2), W = p(ae), Q = p(W), re = x(W, 2), ve = x(ae, 2), _e = p(ve), Ee = x(_e, 2), ye = x(ve, 2), L = p(ye), T = x(L, 2), E = x(ye, 2), R = p(E);
      D(
        (P, q, te, ne, ie, oe, me, Ce, Ne, le, he, ge, Te, it) => {
          d(h, 1, P), d(N, 1, q), d(S, 1, te), d(O, 1, ne), d(Y, 1, ie), d(Z, 1, oe), d(G, 1, me), d(W, 1, Ce), B(Q, `Amount (${(i(v)[i(Me)]?.symbol || i(Me) || "") ?? ""} units)`), d(re, 1, Ne), d(_e, 1, le), d(Ee, 1, he), d(L, 1, ge), d(T, 1, Te), E.disabled = i(a) || !i(qe) || i(ce) <= 0, d(E, 1, it), B(R, i(a) ? "Processing…" : "Transfer");
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
      ), Pa("submit", S, (P) => {
        P.preventDefault(), Di();
      }), Fs(Y, () => i(Me), (P) => b(Me, P)), er(G, () => i(qe), (P) => b(qe, P)), er(re, () => i(ce), (P) => b(ce, P)), er(Ee, () => i(Ut), (P) => b(Ut, P)), er(T, () => i(Yt), (P) => b(Yt, P)), M(_, h);
    }, $i = (_) => {
      var h = Nl(), N = p(h), S = x(N, 2), I = x(p(S)), O = x(I, 2), Y = x(S, 2);
      lt(
        Y,
        20,
        () => [
          { id: "user", label: "User (usr_)" },
          { id: "invoice", label: "Invoice (inv_)" },
          { id: "raw", label: "Raw Hex" }
        ],
        vt,
        (L, T) => {
          var E = ml(), R = p(E);
          D(
            (P) => {
              d(E, 1, P), B(R, T.label);
            },
            [
              () => u(t("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", i(Wt) === T.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
            ]
          ), Re("click", E, () => {
            b(Wt, T.id, !0), b(kt, null);
          }), M(L, E);
        }
      );
      var F = x(Y, 2), Z = p(F);
      {
        var G = (L) => {
          var T = kl();
          D((E) => d(T, 1, E), [
            () => u(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), er(T, () => i(Zr), (E) => b(Zr, E)), M(L, T);
        }, ae = (L) => {
          var T = wl();
          D((E) => d(T, 1, E), [
            () => u(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), er(T, () => i(Qr), (E) => b(Qr, E)), M(L, T);
        }, W = (L) => {
          var T = El();
          D((E) => d(T, 1, E), [
            () => u(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), er(T, () => i($r), (E) => b($r, E)), M(L, T);
        };
        ee(Z, (L) => {
          i(Wt) === "user" ? L(G) : i(Wt) === "invoice" ? L(ae, 1) : L(W, -1);
        });
      }
      var Q = x(Z, 2), re = p(Q);
      {
        var ve = (L) => {
          var T = Tt(), E = st(T);
          jn(E, () => An), M(L, T);
        };
        ee(re, (L) => {
          i(pr) && L(ve);
        });
      }
      var _e = x(re), Ee = x(F, 2);
      {
        var ye = (L) => {
          var T = Al(), E = p(T), R = p(E), P = p(R), q = x(P, 2), te = p(q), ne = x(R, 2), ie = p(ne), oe = x(E, 2);
          lt(oe, 21, () => Object.entries(i(kt).balances), vt, (le, he) => {
            var ge = /* @__PURE__ */ $t(() => vo(i(he), 2));
            let Te = () => i(ge)[0], it = () => i(ge)[1];
            const Kt = /* @__PURE__ */ $t(() => i(v)[Te()]?.decimals || 8);
            var Xt = Sl(), Pr = p(Xt), Cn = p(Pr), Dr = x(Pr, 2), br = p(Dr), On = p(br), fe = x(br, 2), be = p(fe);
            D(
              (de, wt, Et, St, Oe, ze, Zt) => {
                d(Xt, 1, de), d(Pr, 1, wt), B(Cn, Te()), d(Dr, 1, Et), d(br, 1, St), B(On, Oe), d(fe, 1, ze), B(be, `${Zt ?? ""} units`);
              },
              [
                () => u(t("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => u(t("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => u(t("text-right")),
                () => u(t("text-lg font-bold", Number(it()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400")),
                () => wn(Number(it()), i(Kt)),
                () => u(t("text-xs text-gray-500 dark:text-gray-400")),
                () => Number(it()).toLocaleString()
              ]
            ), M(le, Xt);
          });
          var me = x(oe, 2);
          {
            var Ce = (le) => {
              var he = Tl();
              D((ge) => d(he, 1, ge), [() => u(t("text-sm text-gray-500 italic"))]), M(le, he);
            }, Ne = /* @__PURE__ */ $t(() => Object.values(i(kt).balances).every((le) => Number(le) === 0));
            ee(me, (le) => {
              i(Ne) && le(Ce);
            });
          }
          D(
            (le, he, ge, Te, it, Kt, Xt) => {
              d(T, 1, le), d(E, 1, he), d(P, 1, ge), d(q, 1, Te), B(te, i(kt).label), d(ne, 1, it), B(ie, `${Kt ?? ""}…`), d(oe, 1, Xt);
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
          ), Re("click", ne, () => Jt(i(kt)?.subaccount_hex || "")), M(L, T);
        };
        ee(Ee, (L) => {
          i(kt) && L(ye);
        });
      }
      D(
        (L, T, E, R, P, q, te, ne) => {
          d(h, 1, L), d(N, 1, T), d(S, 1, E), d(I, 1, R), d(O, 1, P), d(Y, 1, q), d(F, 1, te), Q.disabled = i(pr), d(Q, 1, ne), B(_e, ` ${i(pr) ? "Looking up…" : "Lookup"}`);
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
      ), Pa("submit", F, (L) => {
        L.preventDefault(), Ci();
      }), M(_, h);
    }, eo = (_) => {
      var h = Rl(), N = p(h), S = x(N, 2), I = p(S), O = p(I);
      {
        var Y = (E) => {
          var R = Tt(), P = st(R);
          jn(P, () => An), M(E, R);
        };
        ee(O, (E) => {
          i(a) && E(Y);
        });
      }
      var F = x(O), Z = x(S, 2), G = p(Z), ae = p(G), W = p(ae), Q = x(ae, 2);
      {
        var re = (E) => {
          var R = Pl();
          lt(R, 21, () => i(j), vt, (P, q) => {
            var te = Ll(), ne = p(te), ie = p(ne), oe = x(ne, 2), me = p(oe), Ce = x(oe, 2);
            {
              var Ne = (le) => {
                var he = Ml(), ge = p(he);
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
            ), M(P, te);
          }), D((P) => d(R, 1, P), [() => u(t("space-y-2 max-h-80 overflow-auto"))]), M(E, R);
        }, ve = (E) => {
          var R = Dl();
          D((P) => d(R, 1, P), [() => u(t("text-gray-500 dark:text-gray-400 text-sm"))]), M(E, R);
        };
        ee(Q, (E) => {
          i(j).length > 0 ? E(re) : E(ve, -1);
        });
      }
      var _e = x(G, 2), Ee = p(_e), ye = x(Ee, 2);
      {
        var L = (E) => {
          var R = Cl(), P = p(R);
          D(
            (q) => {
              d(R, 1, q), B(P, `Total transfers: ${i(se).total_items_count ?? ""}`);
            },
            [() => u(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), M(E, R);
        }, T = (E) => {
          var R = Ol();
          D((P) => d(R, 1, P), [() => u(t("text-gray-500 dark:text-gray-400 text-sm"))]), M(E, R);
        };
        ee(ye, (E) => {
          i(se) ? E(L) : E(T, -1);
        });
      }
      D(
        (E, R, P, q, te, ne, ie) => {
          d(h, 1, E), d(N, 1, R), d(S, 1, P), I.disabled = i(a), d(I, 1, q), B(F, ` ${i(a) ? "Refreshing…" : "Full Vault Refresh"}`), d(Z, 1, te), d(ae, 1, ne), B(W, `All Balances in System (${i(j).length ?? ""})`), d(Ee, 1, ie);
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
      ), Re("click", I, Sn), M(_, h);
    };
    ee(Ki, (_) => {
      i(n) === "balance" ? _(Xi) : i(n) === "transactions" ? _(Zi, 1) : i(n) === "transfer" ? _(Qi, 2) : i(n) === "lookup" ? _($i, 3) : i(n) === "admin" && _(eo, 4);
    });
  }
  D(
    (_, h, N, S, I, O, Y, F, Z) => {
      d(Nn, 1, _), d(Mn, 1, h), d(_a, 1, N), tn.disabled = i(a) || i(He), d(tn, 1, S), B(ji, ` ${i(a) || i(He) ? "Refreshing…" : "Refresh"}`), d(Ln, 1, I), d(Pn, 1, O), d(pa, 1, Y), d(rn, 1, F), B(Bi, i(s) || "Loading…"), d(Dn, 1, Z);
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
  ), Re("click", tn, Sn), Re("click", rn, () => Jt(i(s))), M(e, Nn), qa();
}
ks(["click", "change"]);
function Vl(e, r) {
  const t = Ts(jl, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        Ns(t);
      } catch {
      }
    }
  };
}
export {
  Vl as default
};
