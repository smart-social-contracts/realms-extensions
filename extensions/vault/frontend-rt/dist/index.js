var es = Object.defineProperty;
var Ka = (e) => {
  throw TypeError(e);
};
var ts = (e, r, t) => r in e ? es(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var kt = (e, r, t) => ts(e, typeof r != "symbol" ? r + "" : r, t), ea = (e, r, t) => r.has(e) || Ka("Cannot " + t);
var d = (e, r, t) => (ea(e, r, "read from private field"), t ? t.call(e) : r.get(e)), Y = (e, r, t) => r.has(e) ? Ka("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), $ = (e, r, t, a) => (ea(e, r, "write to private field"), a ? a.call(e, t) : r.set(e, t), t), xe = (e, r, t) => (ea(e, r, "access private method"), t);
var ba = Array.isArray, rs = Array.prototype.indexOf, Hr = Array.prototype.includes, Cn = Array.from, ns = Object.defineProperty, en = Object.getOwnPropertyDescriptor, as = Object.getOwnPropertyDescriptors, is = Object.prototype, os = Array.prototype, ci = Object.getPrototypeOf, Xa = Object.isExtensible;
const ss = () => {
};
function ls(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function vi() {
  var e, r, t = new Promise((a, i) => {
    e = a, r = i;
  });
  return { promise: t, resolve: e, reject: r };
}
function us(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const a of e)
    if (t.push(a), t.length === r) break;
  return t;
}
const We = 2, zr = 4, On = 8, pi = 1 << 24, It = 16, At = 32, or = 64, ia = 128, gt = 512, Ie = 1024, Ue = 2048, Pt = 4096, Ke = 8192, ht = 16384, Dr = 32768, Za = 1 << 25, Ar = 65536, oa = 1 << 17, fs = 1 << 18, Jr = 1 << 19, ds = 1 << 20, Ot = 1 << 25, Mr = 65536, An = 1 << 21, on = 1 << 22, nr = 1 << 23, tn = Symbol("$state"), qt = new class extends Error {
  constructor() {
    super(...arguments);
    kt(this, "name", "StaleReactionError");
    kt(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function cs(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function vs() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function ps(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function _s(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function gs() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function hs(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function bs() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function xs() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function ys() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function ms() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function ks() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const ws = 1, Ss = 2, _i = 4, Es = 8, Ts = 16, As = 1, Ms = 2, je = Symbol(), gi = "http://www.w3.org/1999/xhtml";
function Ns() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Rs() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Ds() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function hi(e) {
  return e === this.v;
}
function Ls(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function bi(e) {
  return !Ls(e, this.v);
}
let st = null;
function qr(e) {
  st = e;
}
function xi(e, r = !1, t) {
  st = {
    p: st,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      ae
    ),
    l: null
  };
}
function yi(e) {
  var r = (
    /** @type {ComponentContext} */
    st
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var a of t)
      Vi(a);
  }
  return r.i = !0, st = r.p, /** @type {T} */
  {};
}
function mi() {
  return !0;
}
let gr = [];
function ki() {
  var e = gr;
  gr = [], ls(e);
}
function ar(e) {
  if (gr.length === 0 && !rn) {
    var r = gr;
    queueMicrotask(() => {
      r === gr && ki();
    });
  }
  gr.push(e);
}
function Cs() {
  for (; gr.length > 0; )
    ki();
}
function wi(e) {
  var r = ae;
  if (r === null)
    return re.f |= nr, e;
  if ((r.f & Dr) === 0 && (r.f & zr) === 0)
    throw e;
  rr(e, r);
}
function rr(e, r) {
  for (; r !== null; ) {
    if ((r.f & ia) !== 0) {
      if ((r.f & Dr) === 0)
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
const Os = -7169;
function Re(e, r) {
  e.f = e.f & Os | r;
}
function xa(e) {
  (e.f & gt) !== 0 || e.deps === null ? Re(e, Ie) : Re(e, Pt);
}
function Si(e) {
  if (e !== null)
    for (const r of e)
      (r.f & We) === 0 || (r.f & Mr) === 0 || (r.f ^= Mr, Si(
        /** @type {Derived} */
        r.deps
      ));
}
function Ei(e, r, t) {
  (e.f & Ue) !== 0 ? r.add(e) : (e.f & Pt) !== 0 && t.add(e), Si(e.deps), Re(e, Ie);
}
const pr = /* @__PURE__ */ new Set();
let U = null, Et = null, sa = null, rn = !1, ta = !1, Ir = null, yn = null;
var Qa = 0;
let Is = 1;
var Pr, Fr, xr, Ut, Dt, ln, at, un, er, Wt, Lt, jr, Br, yr, Oe, mn, Ti, kn, la, wn, Ps;
const Rn = class Rn {
  constructor() {
    Y(this, Oe);
    kt(this, "id", Is++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    kt(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    kt(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    Y(this, Pr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    Y(this, Fr, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    Y(this, xr, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    Y(this, Ut, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    Y(this, Dt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    Y(this, ln, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    Y(this, at, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    Y(this, un, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    Y(this, er, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    Y(this, Wt, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    Y(this, Lt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    Y(this, jr, /* @__PURE__ */ new Set());
    kt(this, "is_fork", !1);
    Y(this, Br, !1);
    /** @type {Set<Batch>} */
    Y(this, yr, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    d(this, Lt).has(r) || d(this, Lt).set(r, { d: [], m: [] }), d(this, jr).delete(r);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(r, t = (a) => this.schedule(a)) {
    var a = d(this, Lt).get(r);
    if (a) {
      d(this, Lt).delete(r);
      for (var i of a.d)
        Re(i, Ue), t(i);
      for (i of a.m)
        Re(i, Pt), t(i);
    }
    d(this, jr).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, a = !1) {
    r.v !== je && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & nr) === 0 && (this.current.set(r, [t, a]), Et?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    U = this;
  }
  deactivate() {
    U = null, Et = null;
  }
  flush() {
    try {
      ta = !0, U = this, xe(this, Oe, kn).call(this);
    } finally {
      Qa = 0, sa = null, Ir = null, yn = null, ta = !1, U = null, Et = null, Sr.clear();
    }
  }
  discard() {
    for (const r of d(this, Fr)) r(this);
    d(this, Fr).clear(), d(this, xr).clear(), pr.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    d(this, un).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    let a = d(this, Ut).get(t) ?? 0;
    if (d(this, Ut).set(t, a + 1), r) {
      let i = d(this, Dt).get(t) ?? 0;
      d(this, Dt).set(t, i + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(r, t, a) {
    let i = d(this, Ut).get(t) ?? 0;
    if (i === 1 ? d(this, Ut).delete(t) : d(this, Ut).set(t, i - 1), r) {
      let o = d(this, Dt).get(t) ?? 0;
      o === 1 ? d(this, Dt).delete(t) : d(this, Dt).set(t, o - 1);
    }
    d(this, Br) || a || ($(this, Br, !0), ar(() => {
      $(this, Br, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(r, t) {
    for (const a of r)
      d(this, er).add(a);
    for (const a of t)
      d(this, Wt).add(a);
    r.clear(), t.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(r) {
    d(this, Pr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    d(this, Fr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(r) {
    d(this, xr).add(r);
  }
  run_fork_commit_callbacks() {
    for (const r of d(this, xr)) r(this);
    d(this, xr).clear();
  }
  settled() {
    return (d(this, ln) ?? $(this, ln, vi())).promise;
  }
  static ensure() {
    if (U === null) {
      const r = U = new Rn();
      ta || (pr.add(U), rn || ar(() => {
        U === r && r.flush();
      }));
    }
    return U;
  }
  apply() {
    {
      Et = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if (sa = r, r.b?.is_pending && (r.f & (zr | On | pi)) !== 0 && (r.f & Dr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var a = t.f;
      if (Ir !== null && t === ae && (re === null || (re.f & We) === 0))
        return;
      if ((a & (or | At)) !== 0) {
        if ((a & Ie) === 0)
          return;
        t.f ^= Ie;
      }
    }
    d(this, at).push(t);
  }
};
Pr = new WeakMap(), Fr = new WeakMap(), xr = new WeakMap(), Ut = new WeakMap(), Dt = new WeakMap(), ln = new WeakMap(), at = new WeakMap(), un = new WeakMap(), er = new WeakMap(), Wt = new WeakMap(), Lt = new WeakMap(), jr = new WeakMap(), Br = new WeakMap(), yr = new WeakMap(), Oe = new WeakSet(), mn = function() {
  return this.is_fork || d(this, Dt).size > 0;
}, Ti = function() {
  for (const a of d(this, yr))
    for (const i of d(a, Dt).keys()) {
      for (var r = !1, t = i; t.parent !== null; ) {
        if (d(this, Lt).has(t)) {
          r = !0;
          break;
        }
        t = t.parent;
      }
      if (!r)
        return !0;
    }
  return !1;
}, kn = function() {
  var p;
  if (Qa++ > 1e3 && (pr.delete(this), js()), !xe(this, Oe, mn).call(this)) {
    for (const f of d(this, er))
      d(this, Wt).delete(f), Re(f, Ue), this.schedule(f);
    for (const f of d(this, Wt))
      Re(f, Pt), this.schedule(f);
  }
  const r = d(this, at);
  $(this, at, []), this.apply();
  var t = Ir = [], a = [], i = yn = [];
  for (const f of r)
    try {
      xe(this, Oe, la).call(this, f, t, a);
    } catch (_) {
      throw Ni(f), _;
    }
  if (U = null, i.length > 0) {
    var o = Rn.ensure();
    for (const f of i)
      o.schedule(f);
  }
  if (Ir = null, yn = null, xe(this, Oe, mn).call(this) || xe(this, Oe, Ti).call(this)) {
    xe(this, Oe, wn).call(this, a), xe(this, Oe, wn).call(this, t);
    for (const [f, _] of d(this, Lt))
      Mi(f, _);
  } else {
    d(this, Ut).size === 0 && pr.delete(this), d(this, er).clear(), d(this, Wt).clear();
    for (const f of d(this, Pr)) f(this);
    d(this, Pr).clear(), $a(a), $a(t), d(this, ln)?.resolve();
  }
  var v = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    U
  );
  if (d(this, at).length > 0) {
    const f = v ?? (v = this);
    d(f, at).push(...d(this, at).filter((_) => !d(f, at).includes(_)));
  }
  v !== null && (pr.add(v), xe(p = v, Oe, kn).call(p));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
la = function(r, t, a) {
  r.f ^= Ie;
  for (var i = r.first; i !== null; ) {
    var o = i.f, v = (o & (At | or)) !== 0, p = v && (o & Ie) !== 0, f = p || (o & Ke) !== 0 || d(this, Lt).has(i);
    if (!f && i.fn !== null) {
      v ? i.f ^= Ie : (o & zr) !== 0 ? t.push(i) : _n(i) && ((o & It) !== 0 && d(this, Wt).add(i), Yr(i));
      var _ = i.first;
      if (_ !== null) {
        i = _;
        continue;
      }
    }
    for (; i !== null; ) {
      var g = i.next;
      if (g !== null) {
        i = g;
        break;
      }
      i = i.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
wn = function(r) {
  for (var t = 0; t < r.length; t += 1)
    Ei(r[t], d(this, er), d(this, Wt));
}, Ps = function() {
  var g, T, E;
  for (const S of pr) {
    var r = S.id < this.id, t = [];
    for (const [k, [C, m]] of this.current) {
      if (S.current.has(k)) {
        var a = (
          /** @type {[any, boolean]} */
          S.current.get(k)[0]
        );
        if (r && C !== a)
          S.current.set(k, [C, m]);
        else
          continue;
      }
      t.push(k);
    }
    var i = [...S.current.keys()].filter((k) => !this.current.has(k));
    if (i.length === 0)
      r && S.discard();
    else if (t.length > 0) {
      if (r)
        for (const k of d(this, jr))
          S.unskip_effect(k, (C) => {
            var m;
            (C.f & (It | on)) !== 0 ? S.schedule(C) : xe(m = S, Oe, wn).call(m, [C]);
          });
      S.activate();
      var o = /* @__PURE__ */ new Set(), v = /* @__PURE__ */ new Map();
      for (var p of t)
        Ai(p, i, o, v);
      v = /* @__PURE__ */ new Map();
      var f = [...S.current.keys()].filter(
        (k) => this.current.has(k) ? (
          /** @type {[any, boolean]} */
          this.current.get(k)[0] !== k
        ) : !0
      );
      for (const k of d(this, un))
        (k.f & (ht | Ke | oa)) === 0 && ya(k, f, v) && ((k.f & (on | It)) !== 0 ? (Re(k, Ue), S.schedule(k)) : d(S, er).add(k));
      if (d(S, at).length > 0) {
        S.apply();
        for (var _ of d(S, at))
          xe(g = S, Oe, la).call(g, _, [], []);
        $(S, at, []);
      }
      S.deactivate();
    }
  }
  for (const S of pr)
    d(S, yr).has(this) && (d(S, yr).delete(this), d(S, yr).size === 0 && !xe(T = S, Oe, mn).call(T) && (S.activate(), xe(E = S, Oe, kn).call(E)));
};
let Nr = Rn;
function Fs(e) {
  var r = rn;
  rn = !0;
  try {
    for (var t; ; ) {
      if (Cs(), U === null)
        return (
          /** @type {T} */
          t
        );
      U.flush();
    }
  } finally {
    rn = r;
  }
}
function js() {
  try {
    bs();
  } catch (e) {
    rr(e, sa);
  }
}
let zt = null;
function $a(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var a = e[t++];
      if ((a.f & (ht | Ke)) === 0 && _n(a) && (zt = /* @__PURE__ */ new Set(), Yr(a), a.deps === null && a.first === null && a.nodes === null && a.teardown === null && a.ac === null && qi(a), zt?.size > 0)) {
        Sr.clear();
        for (const i of zt) {
          if ((i.f & (ht | Ke)) !== 0) continue;
          const o = [i];
          let v = i.parent;
          for (; v !== null; )
            zt.has(v) && (zt.delete(v), o.push(v)), v = v.parent;
          for (let p = o.length - 1; p >= 0; p--) {
            const f = o[p];
            (f.f & (ht | Ke)) === 0 && Yr(f);
          }
        }
        zt.clear();
      }
    }
    zt = null;
  }
}
function Ai(e, r, t, a) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & We) !== 0 ? Ai(
        /** @type {Derived} */
        i,
        r,
        t,
        a
      ) : (o & (on | It)) !== 0 && (o & Ue) === 0 && ya(i, r, a) && (Re(i, Ue), ma(
        /** @type {Effect} */
        i
      ));
    }
}
function ya(e, r, t) {
  const a = t.get(e);
  if (a !== void 0) return a;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (Hr.call(r, i))
        return !0;
      if ((i.f & We) !== 0 && ya(
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
function ma(e) {
  U.schedule(e);
}
function Mi(e, r) {
  if (!((e.f & At) !== 0 && (e.f & Ie) !== 0)) {
    (e.f & Ue) !== 0 ? r.d.push(e) : (e.f & Pt) !== 0 && r.m.push(e), Re(e, Ie);
    for (var t = e.first; t !== null; )
      Mi(t, r), t = t.next;
  }
}
function Ni(e) {
  Re(e, Ie);
  for (var r = e.first; r !== null; )
    Ni(r), r = r.next;
}
function Bs(e) {
  let r = 0, t = Rr(0), a;
  return () => {
    Sa() && (n(t), Hi(() => (r === 0 && (a = Na(() => e(() => nn(t)))), r += 1, () => {
      ar(() => {
        r -= 1, r === 0 && (a?.(), a = void 0, nn(t));
      });
    })));
  };
}
var Vs = Ar | Jr;
function Hs(e, r, t, a) {
  new zs(e, r, t, a);
}
var ct, ha, vt, mr, Ze, pt, Ge, it, Yt, kr, tr, Vr, fn, dn, Jt, Dn, Te, qs, Us, Ws, ua, Sn, En, fa, da;
class zs {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, a, i) {
    Y(this, Te);
    /** @type {Boundary | null} */
    kt(this, "parent");
    kt(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    kt(this, "transform_error");
    /** @type {TemplateNode} */
    Y(this, ct);
    /** @type {TemplateNode | null} */
    Y(this, ha, null);
    /** @type {BoundaryProps} */
    Y(this, vt);
    /** @type {((anchor: Node) => void)} */
    Y(this, mr);
    /** @type {Effect} */
    Y(this, Ze);
    /** @type {Effect | null} */
    Y(this, pt, null);
    /** @type {Effect | null} */
    Y(this, Ge, null);
    /** @type {Effect | null} */
    Y(this, it, null);
    /** @type {DocumentFragment | null} */
    Y(this, Yt, null);
    Y(this, kr, 0);
    Y(this, tr, 0);
    Y(this, Vr, !1);
    /** @type {Set<Effect>} */
    Y(this, fn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    Y(this, dn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    Y(this, Jt, null);
    Y(this, Dn, Bs(() => ($(this, Jt, Rr(d(this, kr))), () => {
      $(this, Jt, null);
    })));
    $(this, ct, r), $(this, vt, t), $(this, mr, (o) => {
      var v = (
        /** @type {Effect} */
        ae
      );
      v.b = this, v.f |= ia, a(o);
    }), this.parent = /** @type {Effect} */
    ae.b, this.transform_error = i ?? this.parent?.transform_error ?? ((o) => o), $(this, Ze, Pn(() => {
      xe(this, Te, ua).call(this);
    }, Vs));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    Ei(r, d(this, fn), d(this, dn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!d(this, vt).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    xe(this, Te, fa).call(this, r, t), $(this, kr, d(this, kr) + r), !(!d(this, Jt) || d(this, Vr)) && ($(this, Vr, !0), ar(() => {
      $(this, Vr, !1), d(this, Jt) && Ur(d(this, Jt), d(this, kr));
    }));
  }
  get_effect_pending() {
    return d(this, Dn).call(this), n(
      /** @type {Source<number>} */
      d(this, Jt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!d(this, vt).onerror && !d(this, vt).failed)
      throw r;
    U?.is_fork ? (d(this, pt) && U.skip_effect(d(this, pt)), d(this, Ge) && U.skip_effect(d(this, Ge)), d(this, it) && U.skip_effect(d(this, it)), U.on_fork_commit(() => {
      xe(this, Te, da).call(this, r);
    })) : xe(this, Te, da).call(this, r);
  }
}
ct = new WeakMap(), ha = new WeakMap(), vt = new WeakMap(), mr = new WeakMap(), Ze = new WeakMap(), pt = new WeakMap(), Ge = new WeakMap(), it = new WeakMap(), Yt = new WeakMap(), kr = new WeakMap(), tr = new WeakMap(), Vr = new WeakMap(), fn = new WeakMap(), dn = new WeakMap(), Jt = new WeakMap(), Dn = new WeakMap(), Te = new WeakSet(), qs = function() {
  try {
    $(this, pt, _t(() => d(this, mr).call(this, d(this, ct))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Us = function(r) {
  const t = d(this, vt).failed;
  t && $(this, it, _t(() => {
    t(
      d(this, ct),
      () => r,
      () => () => {
      }
    );
  }));
}, Ws = function() {
  const r = d(this, vt).pending;
  r && (this.is_pending = !0, $(this, Ge, _t(() => r(d(this, ct)))), ar(() => {
    var t = $(this, Yt, document.createDocumentFragment()), a = ir();
    t.append(a), $(this, pt, xe(this, Te, En).call(this, () => _t(() => d(this, mr).call(this, a)))), d(this, tr) === 0 && (d(this, ct).before(t), $(this, Yt, null), Er(
      /** @type {Effect} */
      d(this, Ge),
      () => {
        $(this, Ge, null);
      }
    ), xe(this, Te, Sn).call(
      this,
      /** @type {Batch} */
      U
    ));
  }));
}, ua = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), $(this, tr, 0), $(this, kr, 0), $(this, pt, _t(() => {
      d(this, mr).call(this, d(this, ct));
    })), d(this, tr) > 0) {
      var r = $(this, Yt, document.createDocumentFragment());
      Ma(d(this, pt), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        d(this, vt).pending
      );
      $(this, Ge, _t(() => t(d(this, ct))));
    } else
      xe(this, Te, Sn).call(
        this,
        /** @type {Batch} */
        U
      );
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {Batch} batch
 */
Sn = function(r) {
  this.is_pending = !1, r.transfer_effects(d(this, fn), d(this, dn));
}, /**
 * @template T
 * @param {() => T} fn
 */
En = function(r) {
  var t = ae, a = re, i = st;
  Ft(d(this, Ze)), xt(d(this, Ze)), qr(d(this, Ze).ctx);
  try {
    return Nr.ensure(), r();
  } catch (o) {
    return wi(o), null;
  } finally {
    Ft(t), xt(a), qr(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
fa = function(r, t) {
  var a;
  if (!this.has_pending_snippet()) {
    this.parent && xe(a = this.parent, Te, fa).call(a, r, t);
    return;
  }
  $(this, tr, d(this, tr) + r), d(this, tr) === 0 && (xe(this, Te, Sn).call(this, t), d(this, Ge) && Er(d(this, Ge), () => {
    $(this, Ge, null);
  }), d(this, Yt) && (d(this, ct).before(d(this, Yt)), $(this, Yt, null)));
}, /**
 * @param {unknown} error
 */
da = function(r) {
  d(this, pt) && (et(d(this, pt)), $(this, pt, null)), d(this, Ge) && (et(d(this, Ge)), $(this, Ge, null)), d(this, it) && (et(d(this, it)), $(this, it, null));
  var t = d(this, vt).onerror;
  let a = d(this, vt).failed;
  var i = !1, o = !1;
  const v = () => {
    if (i) {
      Ds();
      return;
    }
    i = !0, o && ks(), d(this, it) !== null && Er(d(this, it), () => {
      $(this, it, null);
    }), xe(this, Te, En).call(this, () => {
      xe(this, Te, ua).call(this);
    });
  }, p = (f) => {
    try {
      o = !0, t?.(f, v), o = !1;
    } catch (_) {
      rr(_, d(this, Ze) && d(this, Ze).parent);
    }
    a && $(this, it, xe(this, Te, En).call(this, () => {
      try {
        return _t(() => {
          var _ = (
            /** @type {Effect} */
            ae
          );
          _.b = this, _.f |= ia, a(
            d(this, ct),
            () => f,
            () => v
          );
        });
      } catch (_) {
        return rr(
          _,
          /** @type {Effect} */
          d(this, Ze).parent
        ), null;
      }
    }));
  };
  ar(() => {
    var f;
    try {
      f = this.transform_error(r);
    } catch (_) {
      rr(_, d(this, Ze) && d(this, Ze).parent);
      return;
    }
    f !== null && typeof f == "object" && typeof /** @type {any} */
    f.then == "function" ? f.then(
      p,
      /** @param {unknown} e */
      (_) => rr(_, d(this, Ze) && d(this, Ze).parent)
    ) : p(f);
  });
};
function Ys(e, r, t, a) {
  const i = ka;
  var o = e.filter((E) => !E.settled);
  if (t.length === 0 && o.length === 0) {
    a(r.map(i));
    return;
  }
  var v = (
    /** @type {Effect} */
    ae
  ), p = Js(), f = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((E) => E.promise)) : null;
  function _(E) {
    p();
    try {
      a(E);
    } catch (S) {
      (v.f & ht) === 0 && rr(S, v);
    }
    Mn();
  }
  if (t.length === 0) {
    f.then(() => _(r.map(i)));
    return;
  }
  var g = Ri();
  function T() {
    Promise.all(t.map((E) => /* @__PURE__ */ Gs(E))).then((E) => _([...r.map(i), ...E])).catch((E) => rr(E, v)).finally(() => g());
  }
  f ? f.then(() => {
    p(), T(), Mn();
  }) : T();
}
function Js() {
  var e = (
    /** @type {Effect} */
    ae
  ), r = re, t = st, a = (
    /** @type {Batch} */
    U
  );
  return function(o = !0) {
    Ft(e), xt(r), qr(t), o && (e.f & ht) === 0 && (a?.activate(), a?.apply());
  };
}
function Mn(e = !0) {
  Ft(null), xt(null), qr(null), e && U?.deactivate();
}
function Ri() {
  var e = (
    /** @type {Effect} */
    ae
  ), r = (
    /** @type {Boundary} */
    e.b
  ), t = (
    /** @type {Batch} */
    U
  ), a = r.is_rendered();
  return r.update_pending_count(1, t), t.increment(a, e), (i = !1) => {
    r.update_pending_count(-1, t), t.decrement(a, e, i);
  };
}
// @__NO_SIDE_EFFECTS__
function ka(e) {
  var r = We | Ue;
  return ae !== null && (ae.f |= Jr), {
    ctx: st,
    deps: null,
    effects: null,
    equals: hi,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      je
    ),
    wv: 0,
    parent: ae,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function Gs(e, r, t) {
  let a = (
    /** @type {Effect | null} */
    ae
  );
  a === null && vs();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = Rr(
    /** @type {V} */
    je
  ), v = !re, p = /* @__PURE__ */ new Map();
  return fl(() => {
    var f = (
      /** @type {Effect} */
      ae
    ), _ = vi();
    i = _.promise;
    try {
      Promise.resolve(e()).then(_.resolve, _.reject).finally(Mn);
    } catch (S) {
      _.reject(S), Mn();
    }
    var g = (
      /** @type {Batch} */
      U
    );
    if (v) {
      if ((f.f & Dr) !== 0)
        var T = Ri();
      if (
        /** @type {Boundary} */
        a.b.is_rendered()
      )
        p.get(g)?.reject(qt), p.delete(g);
      else {
        for (const S of p.values())
          S.reject(qt);
        p.clear();
      }
      p.set(g, _);
    }
    const E = (S, k = void 0) => {
      if (T) {
        var C = k === qt;
        T(C);
      }
      if (!(k === qt || (f.f & ht) !== 0)) {
        if (g.activate(), k)
          o.f |= nr, Ur(o, k);
        else {
          (o.f & nr) !== 0 && (o.f ^= nr), Ur(o, S);
          for (const [m, Z] of p) {
            if (p.delete(m), m === g) break;
            Z.reject(qt);
          }
        }
        g.deactivate();
      }
    };
    _.promise.then(E, (S) => E(null, S || "unknown"));
  }), Ea(() => {
    for (const f of p.values())
      f.reject(qt);
  }), new Promise((f) => {
    function _(g) {
      function T() {
        g === i ? f(o) : _(i);
      }
      g.then(T, T);
    }
    _(i);
  });
}
// @__NO_SIDE_EFFECTS__
function ne(e) {
  const r = /* @__PURE__ */ ka(e);
  return Yi(r), r;
}
// @__NO_SIDE_EFFECTS__
function Ks(e) {
  const r = /* @__PURE__ */ ka(e);
  return r.equals = bi, r;
}
function Xs(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      et(
        /** @type {Effect} */
        r[t]
      );
  }
}
function wa(e) {
  var r, t = ae, a = e.parent;
  if (!sr && a !== null && (a.f & (ht | Ke)) !== 0)
    return Ns(), e.v;
  Ft(a);
  try {
    e.f &= ~Mr, Xs(e), r = Xi(e);
  } finally {
    Ft(t);
  }
  return r;
}
function Di(e) {
  var r = wa(e);
  if (!e.equals(r) && (e.wv = Gi(), (!U?.is_fork || e.deps === null) && (U !== null ? U.capture(e, r, !0) : e.v = r, e.deps === null))) {
    Re(e, Ie);
    return;
  }
  sr || (Et !== null ? (Sa() || U?.is_fork) && Et.set(e, r) : xa(e));
}
function Zs(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(qt), r.teardown = ss, r.ac = null, sn(r, 0), Ta(r));
}
function Li(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && Yr(r);
}
let ca = /* @__PURE__ */ new Set();
const Sr = /* @__PURE__ */ new Map();
let Ci = !1;
function Rr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: hi,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function X(e, r) {
  const t = Rr(e);
  return Yi(t), t;
}
// @__NO_SIDE_EFFECTS__
function Qs(e, r = !1, t = !0) {
  const a = Rr(e);
  return r || (a.equals = bi), a;
}
function y(e, r, t = !1) {
  re !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Tt || (re.f & oa) !== 0) && mi() && (re.f & (We | It | on | oa)) !== 0 && (bt === null || !Hr.call(bt, e)) && ms();
  let a = t ? Qe(r) : r;
  return Ur(e, a, yn);
}
function Ur(e, r, t = null) {
  if (!e.equals(r)) {
    Sr.set(e, sr ? r : e.v);
    var a = Nr.ensure();
    if (a.capture(e, r), (e.f & We) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & Ue) !== 0 && wa(i), Et === null && xa(i);
    }
    e.wv = Gi(), Oi(e, Ue, t), ae !== null && (ae.f & Ie) !== 0 && (ae.f & (At | or)) === 0 && (dt === null ? vl([e]) : dt.push(e)), !a.is_fork && ca.size > 0 && !Ci && $s();
  }
  return r;
}
function $s() {
  Ci = !1;
  for (const e of ca)
    (e.f & Ie) !== 0 && Re(e, Pt), _n(e) && Yr(e);
  ca.clear();
}
function nn(e) {
  y(e, e.v + 1);
}
function Oi(e, r, t) {
  var a = e.reactions;
  if (a !== null)
    for (var i = a.length, o = 0; o < i; o++) {
      var v = a[o], p = v.f, f = (p & Ue) === 0;
      if (f && Re(v, r), (p & We) !== 0) {
        var _ = (
          /** @type {Derived} */
          v
        );
        Et?.delete(_), (p & Mr) === 0 && (p & gt && (ae === null || (ae.f & An) === 0) && (v.f |= Mr), Oi(_, Pt, t));
      } else if (f) {
        var g = (
          /** @type {Effect} */
          v
        );
        (p & It) !== 0 && zt !== null && zt.add(g), t !== null ? t.push(g) : ma(g);
      }
    }
}
function Qe(e) {
  if (typeof e != "object" || e === null || tn in e)
    return e;
  const r = ci(e);
  if (r !== is && r !== os)
    return e;
  var t = /* @__PURE__ */ new Map(), a = ba(e), i = /* @__PURE__ */ X(0), o = Tr, v = (p) => {
    if (Tr === o)
      return p();
    var f = re, _ = Tr;
    xt(null), ai(o);
    var g = p();
    return xt(f), ai(_), g;
  };
  return a && t.set("length", /* @__PURE__ */ X(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(p, f, _) {
        (!("value" in _) || _.configurable === !1 || _.enumerable === !1 || _.writable === !1) && xs();
        var g = t.get(f);
        return g === void 0 ? v(() => {
          var T = /* @__PURE__ */ X(_.value);
          return t.set(f, T), T;
        }) : y(g, _.value, !0), !0;
      },
      deleteProperty(p, f) {
        var _ = t.get(f);
        if (_ === void 0) {
          if (f in p) {
            const g = v(() => /* @__PURE__ */ X(je));
            t.set(f, g), nn(i);
          }
        } else
          y(_, je), nn(i);
        return !0;
      },
      get(p, f, _) {
        if (f === tn)
          return e;
        var g = t.get(f), T = f in p;
        if (g === void 0 && (!T || en(p, f)?.writable) && (g = v(() => {
          var S = Qe(T ? p[f] : je), k = /* @__PURE__ */ X(S);
          return k;
        }), t.set(f, g)), g !== void 0) {
          var E = n(g);
          return E === je ? void 0 : E;
        }
        return Reflect.get(p, f, _);
      },
      getOwnPropertyDescriptor(p, f) {
        var _ = Reflect.getOwnPropertyDescriptor(p, f);
        if (_ && "value" in _) {
          var g = t.get(f);
          g && (_.value = n(g));
        } else if (_ === void 0) {
          var T = t.get(f), E = T?.v;
          if (T !== void 0 && E !== je)
            return {
              enumerable: !0,
              configurable: !0,
              value: E,
              writable: !0
            };
        }
        return _;
      },
      has(p, f) {
        if (f === tn)
          return !0;
        var _ = t.get(f), g = _ !== void 0 && _.v !== je || Reflect.has(p, f);
        if (_ !== void 0 || ae !== null && (!g || en(p, f)?.writable)) {
          _ === void 0 && (_ = v(() => {
            var E = g ? Qe(p[f]) : je, S = /* @__PURE__ */ X(E);
            return S;
          }), t.set(f, _));
          var T = n(_);
          if (T === je)
            return !1;
        }
        return g;
      },
      set(p, f, _, g) {
        var T = t.get(f), E = f in p;
        if (a && f === "length")
          for (var S = _; S < /** @type {Source<number>} */
          T.v; S += 1) {
            var k = t.get(S + "");
            k !== void 0 ? y(k, je) : S in p && (k = v(() => /* @__PURE__ */ X(je)), t.set(S + "", k));
          }
        if (T === void 0)
          (!E || en(p, f)?.writable) && (T = v(() => /* @__PURE__ */ X(void 0)), y(T, Qe(_)), t.set(f, T));
        else {
          E = T.v !== je;
          var C = v(() => Qe(_));
          y(T, C);
        }
        var m = Reflect.getOwnPropertyDescriptor(p, f);
        if (m?.set && m.set.call(g, _), !E) {
          if (a && typeof f == "string") {
            var Z = (
              /** @type {Source<number>} */
              t.get("length")
            ), Ae = Number(f);
            Number.isInteger(Ae) && Ae >= Z.v && y(Z, Ae + 1);
          }
          nn(i);
        }
        return !0;
      },
      ownKeys(p) {
        n(i);
        var f = Reflect.ownKeys(p).filter((T) => {
          var E = t.get(T);
          return E === void 0 || E.v !== je;
        });
        for (var [_, g] of t)
          g.v !== je && !(_ in p) && f.push(_);
        return f;
      },
      setPrototypeOf() {
        ys();
      }
    }
  );
}
function ei(e) {
  try {
    if (e !== null && typeof e == "object" && tn in e)
      return e[tn];
  } catch {
  }
  return e;
}
function el(e, r) {
  return Object.is(ei(e), ei(r));
}
var ti, Ii, Pi, Fi;
function tl() {
  if (ti === void 0) {
    ti = window, Ii = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    Pi = en(r, "firstChild").get, Fi = en(r, "nextSibling").get, Xa(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Xa(t) && (t.__t = void 0);
  }
}
function ir(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Wr(e) {
  return (
    /** @type {TemplateNode | null} */
    Pi.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function pn(e) {
  return (
    /** @type {TemplateNode | null} */
    Fi.call(e)
  );
}
function h(e, r) {
  return /* @__PURE__ */ Wr(e);
}
function _r(e, r = !1) {
  {
    var t = /* @__PURE__ */ Wr(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ pn(t) : t;
  }
}
function x(e, r = 1, t = !1) {
  let a = e;
  for (; r--; )
    a = /** @type {TemplateNode} */
    /* @__PURE__ */ pn(a);
  return a;
}
function rl(e) {
  e.textContent = "";
}
function ji() {
  return !1;
}
function nl(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(gi, e, void 0)
  );
}
let ri = !1;
function al() {
  ri || (ri = !0, document.addEventListener(
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
function In(e) {
  var r = re, t = ae;
  xt(null), Ft(null);
  try {
    return e();
  } finally {
    xt(r), Ft(t);
  }
}
function Bi(e, r, t, a = t) {
  e.addEventListener(r, () => In(t));
  const i = e.__on_r;
  i ? e.__on_r = () => {
    i(), a(!0);
  } : e.__on_r = () => a(!0), al();
}
function il(e) {
  ae === null && (re === null && hs(), gs()), sr && _s();
}
function ol(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Gt(e, r) {
  var t = ae;
  t !== null && (t.f & Ke) !== 0 && (e |= Ke);
  var a = {
    ctx: st,
    deps: null,
    nodes: null,
    f: e | Ue | gt,
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
  U?.register_created_effect(a);
  var i = a;
  if ((e & zr) !== 0)
    Ir !== null ? Ir.push(a) : Nr.ensure().schedule(a);
  else if (r !== null) {
    try {
      Yr(a);
    } catch (v) {
      throw et(a), v;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Jr) === 0 && (i = i.first, (e & It) !== 0 && (e & Ar) !== 0 && i !== null && (i.f |= Ar));
  }
  if (i !== null && (i.parent = t, t !== null && ol(i, t), re !== null && (re.f & We) !== 0 && (e & or) === 0)) {
    var o = (
      /** @type {Derived} */
      re
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return a;
}
function Sa() {
  return re !== null && !Tt;
}
function Ea(e) {
  const r = Gt(On, null);
  return Re(r, Ie), r.teardown = e, r;
}
function sl(e) {
  il();
  var r = (
    /** @type {Effect} */
    ae.f
  ), t = !re && (r & At) !== 0 && (r & Dr) === 0;
  if (t) {
    var a = (
      /** @type {ComponentContext} */
      st
    );
    (a.e ?? (a.e = [])).push(e);
  } else
    return Vi(e);
}
function Vi(e) {
  return Gt(zr | ds, e);
}
function ll(e) {
  Nr.ensure();
  const r = Gt(or | Jr, e);
  return (t = {}) => new Promise((a) => {
    t.outro ? Er(r, () => {
      et(r), a(void 0);
    }) : (et(r), a(void 0));
  });
}
function ul(e) {
  return Gt(zr, e);
}
function fl(e) {
  return Gt(on | Jr, e);
}
function Hi(e, r = 0) {
  return Gt(On | r, e);
}
function R(e, r = [], t = [], a = []) {
  Ys(a, r, t, (i) => {
    Gt(On, () => e(...i.map(n)));
  });
}
function Pn(e, r = 0) {
  var t = Gt(It | r, e);
  return t;
}
function _t(e) {
  return Gt(At | Jr, e);
}
function zi(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = sr, a = re;
    ni(!0), xt(null);
    try {
      r.call(null);
    } finally {
      ni(t), xt(a);
    }
  }
}
function Ta(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const i = t.ac;
    i !== null && In(() => {
      i.abort(qt);
    });
    var a = t.next;
    (t.f & or) !== 0 ? t.parent = null : et(t, r), t = a;
  }
}
function dl(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & At) === 0 && et(r), r = t;
  }
}
function et(e, r = !0) {
  var t = !1;
  (r || (e.f & fs) !== 0) && e.nodes !== null && e.nodes.end !== null && (cl(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), Re(e, Za), Ta(e, r && !t), sn(e, 0);
  var a = e.nodes && e.nodes.t;
  if (a !== null)
    for (const o of a)
      o.stop();
  zi(e), e.f ^= Za, e.f |= ht;
  var i = e.parent;
  i !== null && i.first !== null && qi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function cl(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ pn(e);
    e.remove(), e = t;
  }
}
function qi(e) {
  var r = e.parent, t = e.prev, a = e.next;
  t !== null && (t.next = a), a !== null && (a.prev = t), r !== null && (r.first === e && (r.first = a), r.last === e && (r.last = t));
}
function Er(e, r, t = !0) {
  var a = [];
  Ui(e, a, !0);
  var i = () => {
    t && et(e), r && r();
  }, o = a.length;
  if (o > 0) {
    var v = () => --o || i();
    for (var p of a)
      p.out(v);
  } else
    i();
}
function Ui(e, r, t) {
  if ((e.f & Ke) === 0) {
    e.f ^= Ke;
    var a = e.nodes && e.nodes.t;
    if (a !== null)
      for (const p of a)
        (p.is_global || t) && r.push(p);
    for (var i = e.first; i !== null; ) {
      var o = i.next;
      if ((i.f & or) === 0) {
        var v = (i.f & Ar) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (i.f & At) !== 0 && (e.f & It) !== 0;
        Ui(i, r, v ? t : !1);
      }
      i = o;
    }
  }
}
function Aa(e) {
  Wi(e, !0);
}
function Wi(e, r) {
  if ((e.f & Ke) !== 0) {
    e.f ^= Ke, (e.f & Ie) === 0 && (Re(e, Ue), Nr.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var a = t.next, i = (t.f & Ar) !== 0 || (t.f & At) !== 0;
      Wi(t, i ? r : !1), t = a;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const v of o)
        (v.is_global || r) && v.in();
  }
}
function Ma(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, a = e.nodes.end; t !== null; ) {
      var i = t === a ? null : /* @__PURE__ */ pn(t);
      r.append(t), t = i;
    }
}
let Tn = !1, sr = !1;
function ni(e) {
  sr = e;
}
let re = null, Tt = !1;
function xt(e) {
  re = e;
}
let ae = null;
function Ft(e) {
  ae = e;
}
let bt = null;
function Yi(e) {
  re !== null && (bt === null ? bt = [e] : bt.push(e));
}
let $e = null, nt = 0, dt = null;
function vl(e) {
  dt = e;
}
let Ji = 1, hr = 0, Tr = hr;
function ai(e) {
  Tr = e;
}
function Gi() {
  return ++Ji;
}
function _n(e) {
  var r = e.f;
  if ((r & Ue) !== 0)
    return !0;
  if (r & We && (e.f &= ~Mr), (r & Pt) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), a = t.length, i = 0; i < a; i++) {
      var o = t[i];
      if (_n(
        /** @type {Derived} */
        o
      ) && Di(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & gt) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Et === null && Re(e, Ie);
  }
  return !1;
}
function Ki(e, r, t = !0) {
  var a = e.reactions;
  if (a !== null && !(bt !== null && Hr.call(bt, e)))
    for (var i = 0; i < a.length; i++) {
      var o = a[i];
      (o.f & We) !== 0 ? Ki(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? Re(o, Ue) : (o.f & Ie) !== 0 && Re(o, Pt), ma(
        /** @type {Effect} */
        o
      ));
    }
}
function Xi(e) {
  var C;
  var r = $e, t = nt, a = dt, i = re, o = bt, v = st, p = Tt, f = Tr, _ = e.f;
  $e = /** @type {null | Value[]} */
  null, nt = 0, dt = null, re = (_ & (At | or)) === 0 ? e : null, bt = null, qr(e.ctx), Tt = !1, Tr = ++hr, e.ac !== null && (In(() => {
    e.ac.abort(qt);
  }), e.ac = null);
  try {
    e.f |= An;
    var g = (
      /** @type {Function} */
      e.fn
    ), T = g();
    e.f |= Dr;
    var E = e.deps, S = U?.is_fork;
    if ($e !== null) {
      var k;
      if (S || sn(e, nt), E !== null && nt > 0)
        for (E.length = nt + $e.length, k = 0; k < $e.length; k++)
          E[nt + k] = $e[k];
      else
        e.deps = E = $e;
      if (Sa() && (e.f & gt) !== 0)
        for (k = nt; k < E.length; k++)
          ((C = E[k]).reactions ?? (C.reactions = [])).push(e);
    } else !S && E !== null && nt < E.length && (sn(e, nt), E.length = nt);
    if (mi() && dt !== null && !Tt && E !== null && (e.f & (We | Pt | Ue)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      dt.length; k++)
        Ki(
          dt[k],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (hr++, i.deps !== null)
        for (let m = 0; m < t; m += 1)
          i.deps[m].rv = hr;
      if (r !== null)
        for (const m of r)
          m.rv = hr;
      dt !== null && (a === null ? a = dt : a.push(.../** @type {Source[]} */
      dt));
    }
    return (e.f & nr) !== 0 && (e.f ^= nr), T;
  } catch (m) {
    return wi(m);
  } finally {
    e.f ^= An, $e = r, nt = t, dt = a, re = i, bt = o, qr(v), Tt = p, Tr = f;
  }
}
function pl(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var a = rs.call(t, e);
    if (a !== -1) {
      var i = t.length - 1;
      i === 0 ? t = r.reactions = null : (t[a] = t[i], t.pop());
    }
  }
  if (t === null && (r.f & We) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  ($e === null || !Hr.call($e, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & gt) !== 0 && (o.f ^= gt, o.f &= ~Mr), o.v !== je && xa(o), Zs(o), sn(o, 0);
  }
}
function sn(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var a = r; a < t.length; a++)
      pl(e, t[a]);
}
function Yr(e) {
  var r = e.f;
  if ((r & ht) === 0) {
    Re(e, Ie);
    var t = ae, a = Tn;
    ae = e, Tn = !0;
    try {
      (r & (It | pi)) !== 0 ? dl(e) : Ta(e), zi(e);
      var i = Xi(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = Ji;
      var o;
    } finally {
      Tn = a, ae = t;
    }
  }
}
async function _l() {
  await Promise.resolve(), Fs();
}
function n(e) {
  var r = e.f, t = (r & We) !== 0;
  if (re !== null && !Tt) {
    var a = ae !== null && (ae.f & ht) !== 0;
    if (!a && (bt === null || !Hr.call(bt, e))) {
      var i = re.deps;
      if ((re.f & An) !== 0)
        e.rv < hr && (e.rv = hr, $e === null && i !== null && i[nt] === e ? nt++ : $e === null ? $e = [e] : $e.push(e));
      else {
        (re.deps ?? (re.deps = [])).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [re] : Hr.call(o, re) || o.push(re);
      }
    }
  }
  if (sr && Sr.has(e))
    return Sr.get(e);
  if (t) {
    var v = (
      /** @type {Derived} */
      e
    );
    if (sr) {
      var p = v.v;
      return ((v.f & Ie) === 0 && v.reactions !== null || Qi(v)) && (p = wa(v)), Sr.set(v, p), p;
    }
    var f = (v.f & gt) === 0 && !Tt && re !== null && (Tn || (re.f & gt) !== 0), _ = (v.f & Dr) === 0;
    _n(v) && (f && (v.f |= gt), Di(v)), f && !_ && (Li(v), Zi(v));
  }
  if (Et?.has(e))
    return Et.get(e);
  if ((e.f & nr) !== 0)
    throw e.v;
  return e.v;
}
function Zi(e) {
  if (e.f |= gt, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & We) !== 0 && (r.f & gt) === 0 && (Li(
        /** @type {Derived} */
        r
      ), Zi(
        /** @type {Derived} */
        r
      ));
}
function Qi(e) {
  if (e.v === je) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (Sr.has(r) || (r.f & We) !== 0 && Qi(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function Na(e) {
  var r = Tt;
  try {
    return Tt = !0, e();
  } finally {
    Tt = r;
  }
}
const gl = ["touchstart", "touchmove"];
function hl(e) {
  return gl.includes(e);
}
const br = Symbol("events"), $i = /* @__PURE__ */ new Set(), va = /* @__PURE__ */ new Set();
function bl(e, r, t, a = {}) {
  function i(o) {
    if (a.capture || pa.call(r, o), !o.cancelBubble)
      return In(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? ar(() => {
    r.addEventListener(e, i, a);
  }) : r.addEventListener(e, i, a), i;
}
function ii(e, r, t, a, i) {
  var o = { capture: a, passive: i }, v = bl(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && Ea(() => {
    r.removeEventListener(e, v, o);
  });
}
function Fe(e, r, t) {
  (r[br] ?? (r[br] = {}))[e] = t;
}
function xl(e) {
  for (var r = 0; r < e.length; r++)
    $i.add(e[r]);
  for (var t of va)
    t(e);
}
let oi = null;
function pa(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), a = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  oi = e;
  var v = 0, p = oi === e && e[br];
  if (p) {
    var f = i.indexOf(p);
    if (f !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[br] = r;
      return;
    }
    var _ = i.indexOf(r);
    if (_ === -1)
      return;
    f <= _ && (v = f);
  }
  if (o = /** @type {Element} */
  i[v] || e.target, o !== r) {
    ns(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var g = re, T = ae;
    xt(null), Ft(null);
    try {
      for (var E, S = []; o !== null; ) {
        var k = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var C = o[br]?.[a];
          C != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && C.call(o, e);
        } catch (m) {
          E ? S.push(m) : E = m;
        }
        if (e.cancelBubble || k === r || k === null)
          break;
        o = k;
      }
      if (E) {
        for (let m of S)
          queueMicrotask(() => {
            throw m;
          });
        throw E;
      }
    } finally {
      e[br] = r, delete e.currentTarget, xt(g), Ft(T);
    }
  }
}
const yl = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function ml(e) {
  return (
    /** @type {string} */
    yl?.createHTML(e) ?? e
  );
}
function eo(e) {
  var r = nl("template");
  return r.innerHTML = ml(e.replaceAll("<!>", "<!---->")), r.content;
}
function Nn(e, r) {
  var t = (
    /** @type {Effect} */
    ae
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function N(e, r) {
  var t = (r & As) !== 0, a = (r & Ms) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = eo(o ? e : "<!>" + e), t || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ Wr(i)));
    var v = (
      /** @type {TemplateNode} */
      a || Ii ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (t) {
      var p = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Wr(v)
      ), f = (
        /** @type {TemplateNode} */
        v.lastChild
      );
      Nn(p, f);
    } else
      Nn(v, v);
    return v;
  };
}
// @__NO_SIDE_EFFECTS__
function kl(e, r, t = "svg") {
  var a = !e.startsWith("<!>"), i = `<${t}>${a ? e : "<!>" + e}</${t}>`, o;
  return () => {
    if (!o) {
      var v = (
        /** @type {DocumentFragment} */
        eo(i)
      ), p = (
        /** @type {Element} */
        /* @__PURE__ */ Wr(v)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ Wr(p);
    }
    var f = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return Nn(f, f), f;
  };
}
// @__NO_SIDE_EFFECTS__
function Ra(e, r) {
  return /* @__PURE__ */ kl(e, r, "svg");
}
function ra() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = ir();
  return e.append(r, t), Nn(r, t), e;
}
function A(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function j(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = t, e.nodeValue = `${t}`);
}
function wl(e, r) {
  return Sl(e, r);
}
const xn = /* @__PURE__ */ new Map();
function Sl(e, { target: r, anchor: t, props: a = {}, events: i, context: o, intro: v = !0, transformError: p }) {
  tl();
  var f = void 0, _ = ll(() => {
    var g = t ?? r.appendChild(ir());
    Hs(
      /** @type {TemplateNode} */
      g,
      {
        pending: () => {
        }
      },
      (S) => {
        xi({});
        var k = (
          /** @type {ComponentContext} */
          st
        );
        o && (k.c = o), i && (a.$$events = i), f = e(S, a) || {}, yi();
      },
      p
    );
    var T = /* @__PURE__ */ new Set(), E = (S) => {
      for (var k = 0; k < S.length; k++) {
        var C = S[k];
        if (!T.has(C)) {
          T.add(C);
          var m = hl(C);
          for (const de of [r, document]) {
            var Z = xn.get(de);
            Z === void 0 && (Z = /* @__PURE__ */ new Map(), xn.set(de, Z));
            var Ae = Z.get(C);
            Ae === void 0 ? (de.addEventListener(C, pa, { passive: m }), Z.set(C, 1)) : Z.set(C, Ae + 1);
          }
        }
      }
    };
    return E(Cn($i)), va.add(E), () => {
      for (var S of T)
        for (const m of [r, document]) {
          var k = (
            /** @type {Map<string, number>} */
            xn.get(m)
          ), C = (
            /** @type {number} */
            k.get(S)
          );
          --C == 0 ? (m.removeEventListener(S, pa), k.delete(S), k.size === 0 && xn.delete(m)) : k.set(S, C);
        }
      va.delete(E), g !== t && g.parentNode?.removeChild(g);
    };
  });
  return _a.set(f, _), f;
}
let _a = /* @__PURE__ */ new WeakMap();
function El(e, r) {
  const t = _a.get(e);
  return t ? (_a.delete(e), t(r)) : Promise.resolve();
}
var St, Ct, ot, wr, cn, vn, Ln;
class to {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    kt(this, "anchor");
    /** @type {Map<Batch, Key>} */
    Y(this, St, /* @__PURE__ */ new Map());
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
    Y(this, Ct, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    Y(this, ot, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    Y(this, wr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    Y(this, cn, !0);
    /**
     * @param {Batch} batch
     */
    Y(this, vn, (r) => {
      if (d(this, St).has(r)) {
        var t = (
          /** @type {Key} */
          d(this, St).get(r)
        ), a = d(this, Ct).get(t);
        if (a)
          Aa(a), d(this, wr).delete(t);
        else {
          var i = d(this, ot).get(t);
          i && (d(this, Ct).set(t, i.effect), d(this, ot).delete(t), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), a = i.effect);
        }
        for (const [o, v] of d(this, St)) {
          if (d(this, St).delete(o), o === r)
            break;
          const p = d(this, ot).get(v);
          p && (et(p.effect), d(this, ot).delete(v));
        }
        for (const [o, v] of d(this, Ct)) {
          if (o === t || d(this, wr).has(o)) continue;
          const p = () => {
            if (Array.from(d(this, St).values()).includes(o)) {
              var _ = document.createDocumentFragment();
              Ma(v, _), _.append(ir()), d(this, ot).set(o, { effect: v, fragment: _ });
            } else
              et(v);
            d(this, wr).delete(o), d(this, Ct).delete(o);
          };
          d(this, cn) || !a ? (d(this, wr).add(o), Er(v, p, !1)) : p();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    Y(this, Ln, (r) => {
      d(this, St).delete(r);
      const t = Array.from(d(this, St).values());
      for (const [a, i] of d(this, ot))
        t.includes(a) || (et(i.effect), d(this, ot).delete(a));
    });
    this.anchor = r, $(this, cn, t);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(r, t) {
    var a = (
      /** @type {Batch} */
      U
    ), i = ji();
    if (t && !d(this, Ct).has(r) && !d(this, ot).has(r))
      if (i) {
        var o = document.createDocumentFragment(), v = ir();
        o.append(v), d(this, ot).set(r, {
          effect: _t(() => t(v)),
          fragment: o
        });
      } else
        d(this, Ct).set(
          r,
          _t(() => t(this.anchor))
        );
    if (d(this, St).set(a, r), i) {
      for (const [p, f] of d(this, Ct))
        p === r ? a.unskip_effect(f) : a.skip_effect(f);
      for (const [p, f] of d(this, ot))
        p === r ? a.unskip_effect(f.effect) : a.skip_effect(f.effect);
      a.oncommit(d(this, vn)), a.ondiscard(d(this, Ln));
    } else
      d(this, vn).call(this, a);
  }
}
St = new WeakMap(), Ct = new WeakMap(), ot = new WeakMap(), wr = new WeakMap(), cn = new WeakMap(), vn = new WeakMap(), Ln = new WeakMap();
function ee(e, r, t = !1) {
  var a = new to(e), i = t ? Ar : 0;
  function o(v, p) {
    a.ensure(v, p);
  }
  Pn(() => {
    var v = !1;
    r((p, f = 0) => {
      v = !0, o(f, p);
    }), v || o(-1, null);
  }, i);
}
function si(e, r) {
  return r;
}
function Tl(e, r, t) {
  for (var a = [], i = r.length, o, v = r.length, p = 0; p < i; p++) {
    let T = r[p];
    Er(
      T,
      () => {
        if (o) {
          if (o.pending.delete(T), o.done.add(T), o.pending.size === 0) {
            var E = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            ga(e, Cn(o.done)), E.delete(o), E.size === 0 && (e.outrogroups = null);
          }
        } else
          v -= 1;
      },
      !1
    );
  }
  if (v === 0) {
    var f = a.length === 0 && t !== null;
    if (f) {
      var _ = (
        /** @type {Element} */
        t
      ), g = (
        /** @type {Element} */
        _.parentNode
      );
      rl(g), g.append(_), e.items.clear();
    }
    ga(e, r, !f);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function ga(e, r, t = !0) {
  var a;
  if (e.pending.size > 0) {
    a = /* @__PURE__ */ new Set();
    for (const v of e.pending.values())
      for (const p of v)
        a.add(
          /** @type {EachItem} */
          e.items.get(p).e
        );
  }
  for (var i = 0; i < r.length; i++) {
    var o = r[i];
    if (a?.has(o)) {
      o.f |= Ot;
      const v = document.createDocumentFragment();
      Ma(o, v);
    } else
      et(r[i], t);
  }
}
var li;
function wt(e, r, t, a, i, o = null) {
  var v = e, p = /* @__PURE__ */ new Map(), f = (r & _i) !== 0;
  if (f) {
    var _ = (
      /** @type {Element} */
      e
    );
    v = _.appendChild(ir());
  }
  var g = null, T = /* @__PURE__ */ Ks(() => {
    var de = t();
    return ba(de) ? de : de == null ? [] : Cn(de);
  }), E, S = /* @__PURE__ */ new Map(), k = !0;
  function C(de) {
    (Ae.effect.f & ht) === 0 && (Ae.pending.delete(de), Ae.fallback = g, Al(Ae, E, v, r, a), g !== null && (E.length === 0 ? (g.f & Ot) === 0 ? Aa(g) : (g.f ^= Ot, $r(g, null, v)) : Er(g, () => {
      g = null;
    })));
  }
  function m(de) {
    Ae.pending.delete(de);
  }
  var Z = Pn(() => {
    E = /** @type {V[]} */
    n(T);
    for (var de = E.length, we = /* @__PURE__ */ new Set(), Me = (
      /** @type {Batch} */
      U
    ), Mt = ji(), De = 0; De < de; De += 1) {
      var ze = E[De], jt = a(ze, De), Le = k ? null : p.get(jt);
      Le ? (Le.v && Ur(Le.v, ze), Le.i && Ur(Le.i, De), Mt && Me.unskip_effect(Le.e)) : (Le = Ml(
        p,
        k ? v : li ?? (li = ir()),
        ze,
        jt,
        De,
        i,
        r,
        t
      ), k || (Le.e.f |= Ot), p.set(jt, Le)), we.add(jt);
    }
    if (de === 0 && o && !g && (k ? g = _t(() => o(v)) : (g = _t(() => o(li ?? (li = ir()))), g.f |= Ot)), de > we.size && ps(), !k)
      if (S.set(Me, we), Mt) {
        for (const [lt, Lr] of p)
          we.has(lt) || Me.skip_effect(Lr.e);
        Me.oncommit(C), Me.ondiscard(m);
      } else
        C(Me);
    n(T);
  }), Ae = { effect: Z, items: p, pending: S, outrogroups: null, fallback: g };
  k = !1;
}
function Qr(e) {
  for (; e !== null && (e.f & At) === 0; )
    e = e.next;
  return e;
}
function Al(e, r, t, a, i) {
  var o = (a & Es) !== 0, v = r.length, p = e.items, f = Qr(e.effect.first), _, g = null, T, E = [], S = [], k, C, m, Z;
  if (o)
    for (Z = 0; Z < v; Z += 1)
      k = r[Z], C = i(k, Z), m = /** @type {EachItem} */
      p.get(C).e, (m.f & Ot) === 0 && (m.nodes?.a?.measure(), (T ?? (T = /* @__PURE__ */ new Set())).add(m));
  for (Z = 0; Z < v; Z += 1) {
    if (k = r[Z], C = i(k, Z), m = /** @type {EachItem} */
    p.get(C).e, e.outrogroups !== null)
      for (const Le of e.outrogroups)
        Le.pending.delete(m), Le.done.delete(m);
    if ((m.f & Ke) !== 0 && (Aa(m), o && (m.nodes?.a?.unfix(), (T ?? (T = /* @__PURE__ */ new Set())).delete(m))), (m.f & Ot) !== 0)
      if (m.f ^= Ot, m === f)
        $r(m, null, t);
      else {
        var Ae = g ? g.next : f;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), Qt(e, g, m), Qt(e, m, Ae), $r(m, Ae, t), g = m, E = [], S = [], f = Qr(g.next);
        continue;
      }
    if (m !== f) {
      if (_ !== void 0 && _.has(m)) {
        if (E.length < S.length) {
          var de = S[0], we;
          g = de.prev;
          var Me = E[0], Mt = E[E.length - 1];
          for (we = 0; we < E.length; we += 1)
            $r(E[we], de, t);
          for (we = 0; we < S.length; we += 1)
            _.delete(S[we]);
          Qt(e, Me.prev, Mt.next), Qt(e, g, Me), Qt(e, Mt, de), f = de, g = Mt, Z -= 1, E = [], S = [];
        } else
          _.delete(m), $r(m, f, t), Qt(e, m.prev, m.next), Qt(e, m, g === null ? e.effect.first : g.next), Qt(e, g, m), g = m;
        continue;
      }
      for (E = [], S = []; f !== null && f !== m; )
        (_ ?? (_ = /* @__PURE__ */ new Set())).add(f), S.push(f), f = Qr(f.next);
      if (f === null)
        continue;
    }
    (m.f & Ot) === 0 && E.push(m), g = m, f = Qr(m.next);
  }
  if (e.outrogroups !== null) {
    for (const Le of e.outrogroups)
      Le.pending.size === 0 && (ga(e, Cn(Le.done)), e.outrogroups?.delete(Le));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (f !== null || _ !== void 0) {
    var De = [];
    if (_ !== void 0)
      for (m of _)
        (m.f & Ke) === 0 && De.push(m);
    for (; f !== null; )
      (f.f & Ke) === 0 && f !== e.fallback && De.push(f), f = Qr(f.next);
    var ze = De.length;
    if (ze > 0) {
      var jt = (a & _i) !== 0 && v === 0 ? t : null;
      if (o) {
        for (Z = 0; Z < ze; Z += 1)
          De[Z].nodes?.a?.measure();
        for (Z = 0; Z < ze; Z += 1)
          De[Z].nodes?.a?.fix();
      }
      Tl(e, De, jt);
    }
  }
  o && ar(() => {
    if (T !== void 0)
      for (m of T)
        m.nodes?.a?.apply();
  });
}
function Ml(e, r, t, a, i, o, v, p) {
  var f = (v & ws) !== 0 ? (v & Ts) === 0 ? /* @__PURE__ */ Qs(t, !1, !1) : Rr(t) : null, _ = (v & Ss) !== 0 ? Rr(i) : null;
  return {
    v: f,
    i: _,
    e: _t(() => (o(r, f ?? t, _ ?? i, p), () => {
      e.delete(a);
    }))
  };
}
function $r(e, r, t) {
  if (e.nodes)
    for (var a = e.nodes.start, i = e.nodes.end, o = r && (r.f & Ot) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; a !== null; ) {
      var v = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ pn(a)
      );
      if (o.before(a), a === i)
        return;
      a = v;
    }
}
function Qt(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function Nl(e, r, t) {
  var a = new to(e);
  Pn(() => {
    var i = r() ?? null;
    a.ensure(i, i && ((o) => t(o, i)));
  }, Ar);
}
function ro(e) {
  var r, t, a = "";
  if (typeof e == "string" || typeof e == "number") a += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var i = e.length;
    for (r = 0; r < i; r++) e[r] && (t = ro(e[r])) && (a && (a += " "), a += t);
  } else for (t in e) e[t] && (a && (a += " "), a += t);
  return a;
}
function Rl() {
  for (var e, r, t = 0, a = "", i = arguments.length; t < i; t++) (e = arguments[t]) && (r = ro(e)) && (a && (a += " "), a += r);
  return a;
}
function l(e) {
  return typeof e == "object" ? Rl(e) : e ?? "";
}
function Dl(e, r, t) {
  var a = e == null ? "" : "" + e;
  return a === "" ? null : a;
}
function u(e, r, t, a, i, o) {
  var v = e.__className;
  if (v !== t || v === void 0) {
    var p = Dl(t);
    p == null ? e.removeAttribute("class") : r ? e.className = p : e.setAttribute("class", p), e.__className = t;
  }
  return o;
}
function no(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!ba(r))
      return Rs();
    for (var a of e.options)
      a.selected = r.includes(an(a));
    return;
  }
  for (a of e.options) {
    var i = an(a);
    if (el(i, r)) {
      a.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function Ll(e) {
  var r = new MutationObserver(() => {
    no(e, e.__value);
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
  }), Ea(() => {
    r.disconnect();
  });
}
function Cl(e, r, t = r) {
  var a = /* @__PURE__ */ new WeakSet(), i = !0;
  Bi(e, "change", (o) => {
    var v = o ? "[selected]" : ":checked", p;
    if (e.multiple)
      p = [].map.call(e.querySelectorAll(v), an);
    else {
      var f = e.querySelector(v) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      p = f && an(f);
    }
    t(p), e.__value = p, U !== null && a.add(U);
  }), ul(() => {
    var o = r();
    if (e === document.activeElement) {
      var v = (
        /** @type {Batch} */
        U
      );
      if (a.has(v))
        return;
    }
    if (no(e, o, i), i && o === void 0) {
      var p = e.querySelector(":checked");
      p !== null && (o = an(p), t(o));
    }
    e.__value = o, i = !1;
  }), Ll(e);
}
function an(e) {
  return "__value" in e ? e.__value : e.value;
}
const Ol = Symbol("is custom element"), Il = Symbol("is html");
function ft(e, r, t, a) {
  var i = Pl(e);
  i[r] !== (i[r] = t) && (t == null ? e.removeAttribute(r) : typeof t != "string" && Fl(e).includes(r) ? e[r] = t : e.setAttribute(r, t));
}
function Pl(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [Ol]: e.nodeName.includes("-"),
      [Il]: e.namespaceURI === gi
    })
  );
}
var ui = /* @__PURE__ */ new Map();
function Fl(e) {
  var r = e.getAttribute("is") || e.nodeName, t = ui.get(r);
  if (t) return t;
  ui.set(r, t = []);
  for (var a, i = e, o = Element.prototype; o !== i; ) {
    a = as(i);
    for (var v in a)
      a[v].set && t.push(v);
    i = ci(i);
  }
  return t;
}
function $t(e, r, t = r) {
  var a = /* @__PURE__ */ new WeakSet();
  Bi(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = na(e) ? aa(o) : o, t(o), U !== null && a.add(U), await _l(), o !== (o = r())) {
      var v = e.selectionStart, p = e.selectionEnd, f = e.value.length;
      if (e.value = o ?? "", p !== null) {
        var _ = e.value.length;
        v === p && p === f && _ > f ? (e.selectionStart = _, e.selectionEnd = _) : (e.selectionStart = v, e.selectionEnd = Math.min(p, _));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Na(r) == null && e.value && (t(na(e) ? aa(e.value) : e.value), U !== null && a.add(U)), Hi(() => {
    var i = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        U
      );
      if (a.has(o))
        return;
    }
    na(e) && i === aa(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function na(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function aa(e) {
  return e === "" ? null : +e;
}
function jl(e) {
  st === null && cs(), sl(() => {
    const r = Na(e);
    if (typeof r == "function") return (
      /** @type {() => void} */
      r
    );
  });
}
const Bl = "5";
var di;
typeof window < "u" && ((di = window.__svelte ?? (window.__svelte = {})).v ?? (di.v = /* @__PURE__ */ new Set())).add(Bl);
const Vl = "See token balances and transfer history for your realm's treasury, send payments when allowed, and look up balances tied to members or invoices.", fi = (e) => {
  var r = ql();
  A(e, r);
}, Hl = (e) => {
  var r = Ul();
  A(e, r);
}, zl = (e) => {
  var r = Wl();
  A(e, r);
};
var ql = /* @__PURE__ */ Ra('<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>'), Ul = /* @__PURE__ */ Ra('<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4.93 4.93a10 10 0 0114.14 0M19.07 19.07a10 10 0 01-14.14 0"></path></svg>'), Wl = /* @__PURE__ */ Ra('<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>'), Yl = /* @__PURE__ */ N('<div><div><div> </div> <div> </div></div> <div><div> </div> <button type="button">Send</button></div></div>'), Jl = /* @__PURE__ */ N("<div><div></div> <p>On-chain ledger balance for this realm's vault</p></div>"), Gl = /* @__PURE__ */ N("<div><p>No token configured</p> <p>This realm's treasury has no active token yet, so the vault holds no balance.</p></div>"), Kl = /* @__PURE__ */ N("<span>Copied!</span>"), Xl = /* @__PURE__ */ N("<div><span>Last refresh:</span> <span> </span></div>"), Zl = /* @__PURE__ */ N("<span>Copied!</span>"), Ql = /* @__PURE__ */ N("<span>Copied!</span>"), $l = /* @__PURE__ */ N('<div><div> </div> <div> </div> <div> </div> <div> </div> <div><span>Ledger:</span> <button type="button"> </button> <!></div> <div><span>Indexer:</span> <button type="button"> </button> <!></div></div>'), eu = /* @__PURE__ */ N('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), tu = /* @__PURE__ */ N("<details><summary>Show details</summary> <pre> </pre></details>"), ru = /* @__PURE__ */ N("<div><p> </p> <!></div>"), nu = /* @__PURE__ */ N('<button type="button"> </button>'), au = /* @__PURE__ */ N('<button type="button"><!> Admin</button>'), iu = /* @__PURE__ */ N("<div><div></div> <div></div> <div></div> <div></div> <div></div></div>"), ou = /* @__PURE__ */ N("<div></div>"), su = /* @__PURE__ */ N('<div><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <p>No activity yet</p> <p>Transfers and ledger events will appear here after the vault syncs.</p></div>'), lu = /* @__PURE__ */ N("<span>✓</span>"), uu = /* @__PURE__ */ N('<button type="button"> </button> <!>', 1), fu = /* @__PURE__ */ N("<span>—</span>"), du = /* @__PURE__ */ N("<span>✓</span>"), cu = /* @__PURE__ */ N('<button type="button"> </button> <!>', 1), vu = /* @__PURE__ */ N("<span> </span>"), pu = /* @__PURE__ */ N("<span>✓</span>"), _u = /* @__PURE__ */ N('<button type="button"> </button> <!>', 1), gu = /* @__PURE__ */ N("<span> </span>"), hu = /* @__PURE__ */ N("<tr><td><!> <div> </div></td><td><span> </span></td><td><!></td><td><!></td><td><span> </span></td></tr>"), bu = /* @__PURE__ */ N("<div><table><thead><tr><th>When</th><th>Type</th><th>From</th><th>To</th><th>Amount</th></tr></thead><tbody></tbody></table></div>"), xu = /* @__PURE__ */ N("<span> </span>"), yu = /* @__PURE__ */ N("<span>…</span>"), mu = /* @__PURE__ */ N('<button type="button"> </button>'), ku = /* @__PURE__ */ N('<div><button type="button">Prev</button> <!> <button type="button">Next</button></div>'), wu = /* @__PURE__ */ N("<div><span> <!></span> <!></div>"), Su = /* @__PURE__ */ N("<div><h2>Activity</h2> <!> <!></div>"), Eu = /* @__PURE__ */ N("<p>No token is configured for this realm's treasury, so nothing can be sent yet.</p>"), Tu = /* @__PURE__ */ N("<p> </p>"), Au = /* @__PURE__ */ N("<option> </option>"), Mu = /* @__PURE__ */ N('<select id="v-token"></select>'), Nu = /* @__PURE__ */ N("<p>Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).</p>"), Ru = /* @__PURE__ */ N("<p> </p>"), Du = /* @__PURE__ */ N("<p>Principal ID of the recipient.</p>"), Lu = /* @__PURE__ */ N("<p> </p>"), Cu = /* @__PURE__ */ N("<p> </p>"), Ou = /* @__PURE__ */ N("<p>Must be exactly 64 hex characters.</p>"), Iu = /* @__PURE__ */ N("<p>Must be exactly 64 hex characters.</p>"), Pu = /* @__PURE__ */ N('<div><h2>Send tokens</h2> <form><div><span>Token</span> <!></div> <div><label for="v-to">Recipient</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/> <!></div> <div><div><label for="v-amount"> </label> <button type="button">Max</button></div> <input id="v-amount" type="text" inputmode="decimal" placeholder="0.00"/> <!> <!></div> <details><summary>Advanced (subaccounts)</summary> <div><p>Optional 64-character hex subaccount values for source or destination.</p> <div><label for="v-to-sub">To subaccount</label> <input id="v-to-sub" type="text" placeholder="64-character hex"/> <!></div> <div><label for="v-from-sub">From subaccount</label> <input id="v-from-sub" type="text" placeholder="64-character hex"/> <!></div></div></details> <button type="submit"> </button></form></div>'), Fu = /* @__PURE__ */ N('<button type="button"> </button>'), ju = /* @__PURE__ */ N(`<p>Enter a raw 64-character hex subaccount. Member and invoice compartments are derived
						from principal or invoice ID using internal prefixes.</p>`), Bu = /* @__PURE__ */ N("<option> </option>"), Vu = /* @__PURE__ */ N('<input type="text" list="member-list" placeholder="Member principal or pick from list"/> <datalist id="member-list"></datalist>', 1), Hu = /* @__PURE__ */ N('<input type="text" placeholder="Invoice ID"/>'), zu = /* @__PURE__ */ N('<input type="text" placeholder="64-character hex subaccount"/>'), qu = /* @__PURE__ */ N("<div> </div>"), Uu = /* @__PURE__ */ N("<div><span> </span> <div> </div></div>"), Wu = /* @__PURE__ */ N("<p>No balances found for this subaccount.</p>"), Yu = /* @__PURE__ */ N('<div><div><div><div> </div> <!></div> <button type="button"> </button></div> <div></div> <!></div>'), Ju = /* @__PURE__ */ N(`<div><h2>Look up a balance</h2> <p>The vault holds funds in separate compartments for each member and each invoice. Look up
					the balance in one of them.</p> <div></div> <!> <form><!> <button type="submit"><!> </button></form> <!></div>`), Gu = /* @__PURE__ */ N("<div><div> </div> <div> </div></div>"), Ku = /* @__PURE__ */ N("<div></div>"), Xu = /* @__PURE__ */ N("<p>No balances found in system</p>"), Zu = /* @__PURE__ */ N("<p> </p>"), Qu = /* @__PURE__ */ N("<p>No transfer data available</p>"), $u = /* @__PURE__ */ N(`<div><h2>Vault Admin</h2> <div><button type="button"><!> </button></div> <div><h3>Auto-refresh settings</h3> <p>The Vault will only run an expensive full refresh on load if the last refresh is older
						than this threshold.</p> <div><label for="v-refresh-age">Max refresh age:</label> <input id="v-refresh-age" type="number" min="1"/> <span>minutes</span> <button type="button">Save</button></div></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>`), ef = /* @__PURE__ */ N('<div><div><div><h1>Vault</h1> <p> </p></div> <button type="button" aria-label="Refresh" title="Refresh"><span><!></span></button></div> <!> <details><summary>Technical details</summary> <div><div><span>Vault Principal:</span> <button type="button"> </button> <!></div> <!> <!></div></details> <!> <nav><!> <!></nav> <div><!></div></div>');
function tf(e, r) {
  xi(r, !0);
  const t = r.ctx.theme?.cn ?? ((...s) => s.filter(Boolean).join(" ")), a = 3600 * 1e3, i = "vault_settings", o = "vault_last_refresh", v = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/, p = /^[0-9a-fA-F]{64}$/;
  let f = /* @__PURE__ */ X("activity"), _ = /* @__PURE__ */ X(!1), g = /* @__PURE__ */ X(""), T = /* @__PURE__ */ X(""), E = /* @__PURE__ */ X(Qe([])), S = /* @__PURE__ */ ne(() => n(E).includes("admin")), k = /* @__PURE__ */ X(""), C = /* @__PURE__ */ X(Qe({})), m = /* @__PURE__ */ X(Qe({})), Z = /* @__PURE__ */ X(!1), Ae = /* @__PURE__ */ X(Qe([])), de = /* @__PURE__ */ X(Qe([])), we = /* @__PURE__ */ X(null), Me = /* @__PURE__ */ X(0);
  const Mt = 10;
  let De = /* @__PURE__ */ X(null), ze = /* @__PURE__ */ X(""), jt = /* @__PURE__ */ X(Qe(Un())), Le = /* @__PURE__ */ X(Qe(Math.round(Un().maxRefreshAgeMs / 6e4))), lt = /* @__PURE__ */ X(""), Lr = /* @__PURE__ */ X(""), Gr = /* @__PURE__ */ X(""), lr = /* @__PURE__ */ X(""), ur = /* @__PURE__ */ X(""), yt = /* @__PURE__ */ X("user"), Kt = /* @__PURE__ */ X(""), Kr = /* @__PURE__ */ X(""), Xr = /* @__PURE__ */ X(""), Nt = /* @__PURE__ */ X(null), Cr = /* @__PURE__ */ X(!1), fr = /* @__PURE__ */ X(Qe({})), Da = /* @__PURE__ */ X(Qe([])), Bt = /* @__PURE__ */ ne(() => Object.keys(n(C))), ao = /* @__PURE__ */ ne(() => n(Da).filter((s) => s.kind === "user")), Ye = /* @__PURE__ */ ne(() => n(lt) ? n(C)[n(lt)] : void 0), Fn = /* @__PURE__ */ ne(() => n(lt) && n(m)[n(lt)] || 0), jn = /* @__PURE__ */ ne(() => n(Ye)?.fee ?? 0), Xt = /* @__PURE__ */ ne(() => so(n(Gr), n(Ye)?.decimals ?? 8)), Or = /* @__PURE__ */ ne(() => n(Lr).trim()), La = /* @__PURE__ */ ne(() => n(Or) !== "" && v.test(n(Or))), Bn = /* @__PURE__ */ ne(() => n(fr)[n(Or)] || ""), Vn = /* @__PURE__ */ ne(() => n(lr).trim() === "" || p.test(n(lr).trim())), Hn = /* @__PURE__ */ ne(() => n(ur).trim() === "" || p.test(n(ur).trim())), Ca = /* @__PURE__ */ ne(() => n(La) && n(Xt) != null && n(Xt) > 0 && n(Vn) && n(Hn) && !n(_));
  function zn(s) {
    return typeof s == "string" ? JSON.parse(s) : s;
  }
  function gn(s) {
    return s && typeof s == "object" && s.success === !0 && s.data != null ? s.data : s;
  }
  function io(s) {
    return n(C)[s]?.name ?? s;
  }
  function oo(s, c) {
    return (s / Math.pow(10, c)).toLocaleString(void 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(c, 8)
    });
  }
  function Zt(s, c, b) {
    return `${oo(s, c)} ${b}`;
  }
  function dr(s) {
    return `${s.toLocaleString()} base units`;
  }
  function so(s, c) {
    const b = s.trim();
    if (!b) return null;
    const w = b.split(".");
    if (w.length > 2) return null;
    const M = w[0], L = w[1] ?? "";
    if (!/^\d+$/.test(M) || L && !/^\d+$/.test(L) || L.length > c) return null;
    const O = L.padEnd(c, "0"), J = c > 0 ? M + O : M, z = Number(J);
    return Number.isFinite(z) && z >= 0 ? z : null;
  }
  function lo(s, c) {
    const b = String(s).padStart(c + 1, "0");
    if (c === 0) return b;
    const w = b.slice(0, -c) || "0";
    let M = b.slice(-c).replace(/0+$/, "");
    return M ? `${w}.${M}` : w;
  }
  function qn(s) {
    const c = n(Bt).find((b) => n(C)[b]?.name === s);
    return c && n(C)[c] ? n(C)[c] : {
      ledger: "",
      indexer: "",
      decimals: 8,
      symbol: s,
      name: s,
      fee: 0
    };
  }
  function Un() {
    try {
      const s = localStorage.getItem(i);
      if (s) {
        const c = JSON.parse(s);
        if (typeof c.maxRefreshAgeMs == "number" && c.maxRefreshAgeMs > 0)
          return { maxRefreshAgeMs: c.maxRefreshAgeMs };
      }
    } catch {
    }
    return { maxRefreshAgeMs: a };
  }
  function uo(s) {
    try {
      localStorage.setItem(i, JSON.stringify(s));
    } catch {
    }
  }
  function fo() {
    const s = Math.max(1, Math.round(n(Le) || 1));
    y(jt, { maxRefreshAgeMs: s * 6e4 }, !0), uo(n(jt));
  }
  function Oa() {
    try {
      const s = localStorage.getItem(o);
      if (s) {
        const c = JSON.parse(s);
        if (c && typeof c.timestamp == "number" && c.balances)
          return { timestamp: c.timestamp, balances: c.balances };
      }
    } catch {
    }
    return null;
  }
  function co(s, c) {
    try {
      localStorage.setItem(o, JSON.stringify({ timestamp: s, balances: c }));
    } catch {
    }
  }
  async function cr(s) {
    try {
      await navigator.clipboard.writeText(s), y(ze, s, !0), setTimeout(() => y(ze, ""), 2e3);
    } catch {
    }
  }
  function Ia(s) {
    const c = Math.floor((Date.now() - s.getTime()) / 1e3);
    if (c < 60) return `${c}s ago`;
    const b = Math.floor(c / 60);
    if (b < 60) return `${b}m ago`;
    const w = Math.floor(b / 60);
    return w < 24 ? `${w}h ago` : `${Math.floor(w / 24)}d ago`;
  }
  function vo(s) {
    const c = String(s);
    if (c.includes("T") || c.includes("-") || c.includes(":")) return new Date(c);
    try {
      return new Date(Number(BigInt(c) / BigInt(1e6)));
    } catch {
      return /* @__PURE__ */ new Date();
    }
  }
  function Pa(s, c = 20) {
    if (s.length <= c) return s;
    const b = Math.floor((c - 1) / 2);
    return `${s.slice(0, b)}…${s.slice(-b)}`;
  }
  function Wn(s) {
    return s ? s === "minting_account" ? { display: "Mint", title: s, copyable: !1 } : s === "burn" ? { display: "Burned", title: s, copyable: !1 } : s === n(k) ? { display: "This vault", title: s, copyable: !1 } : n(fr)[s] ? {
      display: n(fr)[s],
      title: s,
      copyable: !1
    } : { display: Pa(s), title: s, copyable: !0 } : { display: "—", title: "", copyable: !1 };
  }
  function po(s) {
    const c = s || "unknown";
    return c.charAt(0).toUpperCase() + c.slice(1);
  }
  function _o(s) {
    switch (s) {
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
  function go(s) {
    const c = qn(s.token), b = s.amount || 0, w = s.fee || 0, M = Zt(b, c.decimals, c.symbol), L = s.principal_to === n(k) || s.kind === "mint", O = s.principal_from === n(k) || s.kind === "burn";
    let J = M, z = "text-gray-600 dark:text-gray-400";
    L ? (J = `+${M}`, z = "text-emerald-600 dark:text-emerald-400") : O && (J = `−${M}`, z = "text-rose-600 dark:text-rose-400");
    const H = w > 0 ? `${dr(b)} · Fee: ${dr(w)}` : dr(b);
    return { text: J, className: z, title: H };
  }
  function Fa(s) {
    try {
      const w = JSON.parse(s);
      if (w && typeof w.error == "string") return w.error;
    } catch {
    }
    const c = s.match(/Reject text:\s*([^\n]+?)(?:\s+Error code|\s+Call context|$)/);
    if (c) return c[1].trim();
    const b = s.split(`
`)[0].trim();
    return b.length > 200 ? `${b.slice(0, 200)}…` : b;
  }
  function ho() {
    return n(Nt) ? n(yt) === "user" ? `Member ${n(fr)[n(Kt).trim()] || Pa(n(Kt).trim())}` : n(yt) === "invoice" ? `Invoice ${n(Kr).trim()}` : `Subaccount ${n(Xr).trim().substring(0, 16)}…` : "";
  }
  async function bo(s) {
    if (typeof r.ctx.openModal != "function") return !0;
    try {
      const { actionId: c } = await r.ctx.openModal({
        title: s.title,
        body: s.body,
        actions: [
          { id: "cancel", label: "Cancel", tone: "secondary" },
          {
            id: "confirm",
            label: s.confirmLabel || "Confirm",
            tone: s.danger ? "danger" : "primary"
          }
        ]
      });
      return c === "confirm";
    } catch {
      return !1;
    }
  }
  function xo(s) {
    y(lt, s, !0), y(f, "send");
  }
  function yo() {
    if (!n(Ye)) return;
    const s = Math.max(0, n(Fn) - n(jn));
    y(Gr, lo(s, n(Ye).decimals), !0);
  }
  async function mo() {
    if (typeof r.ctx.backend?.directory_list == "function")
      try {
        const s = await r.ctx.backend.directory_list(), c = zn(s);
        if (c?.success && c?.data?.message) {
          const w = JSON.parse(c.data.message).entries || [], M = {};
          for (const L of w)
            L.principal && L.label && (M[L.principal] = L.label);
          y(Da, w, !0), y(fr, M, !0);
        }
      } catch {
      }
  }
  async function ko() {
    try {
      const c = gn(await r.ctx.callSync("get_active_tokens", {}))?.ActiveTokens || [], b = {}, w = {};
      for (const O of c) {
        const J = O.symbol || O.name, z = O.ledger_canister_id ?? O.ledger ?? "", H = O.indexer_canister_id ?? O.indexer ?? "";
        J && (b[J] = {
          ledger: z,
          indexer: H,
          decimals: O.decimals || 8,
          symbol: J,
          name: O.name,
          fee: O.fee || 0
        }, w[J] = 0);
      }
      y(C, b, !0), y(m, w, !0);
      const M = Oa();
      if (M?.balances) {
        for (const O of Object.keys(b))
          O in M.balances && (w[O] = M.balances[O]);
        y(m, w, !0), y(De, new Date(M.timestamp), !0);
      }
      const L = Object.keys(b);
      L.length > 0 && !n(lt) && y(lt, L[0], !0), y(Z, !0);
    } catch (s) {
      console.error("Failed to load tokens:", s);
    }
  }
  async function Yn() {
    y(_, !0), y(g, ""), y(T, "");
    try {
      const s = await r.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), c = zn(s);
      if (c?.success && c?.data?.objectsListPaginated) {
        const b = c.data.objectsListPaginated;
        y(Ae, b.objects.map((w) => JSON.parse(w)), !0);
      } else
        y(Ae, [], !0);
    } catch (s) {
      const c = r.ctx.ui?.accessDeniedOperation?.(s);
      c != null ? (y(T, c, !0), y(g, "")) : (y(T, ""), y(g, s?.message ?? String(s), !0));
    } finally {
      y(_, !1);
    }
  }
  async function hn(s = n(Me)) {
    y(_, !0), y(g, ""), y(T, "");
    try {
      if (!n(k))
        try {
          if (typeof r.ctx.backend.get_canister_id == "function") {
            const w = await r.ctx.backend.get_canister_id();
            y(k, w || "", !0);
          }
        } catch {
          y(k, "");
        }
      const c = await r.ctx.backend.get_objects_paginated("WalletTransfer", s, Mt, "desc"), b = zn(c);
      if (b?.success && b?.data?.objectsListPaginated) {
        const w = b.data.objectsListPaginated;
        y(we, w.pagination, !0), y(de, w.objects.map((M) => JSON.parse(M)), !0);
      } else
        y(de, [], !0);
    } catch (c) {
      const b = r.ctx.ui?.accessDeniedOperation?.(c);
      b != null ? (y(T, b, !0), y(g, "")) : (y(T, ""), y(g, c?.message ?? String(c), !0));
    } finally {
      y(_, !1);
    }
  }
  function wo(s) {
    return n(Bt).find((c) => n(C)[c]?.name === s);
  }
  function So(s) {
    for (const [c, b] of Object.entries(s)) {
      const w = wo(c) || c;
      n(C)[w] && (n(m)[w] = b?.balance || 0);
    }
    y(m, { ...n(m) }, !0);
  }
  async function Eo() {
    try {
      typeof r.ctx.backend.get_canister_id == "function" && y(k, await r.ctx.backend.get_canister_id() || n(k), !0);
    } catch {
    }
  }
  async function Jn() {
    y(_, !0), y(g, ""), y(T, "");
    try {
      const s = gn(await r.ctx.callAsync("refresh", {}));
      if (s?.TransactionSummary == null) {
        y(g, "Failed to sync vault transactions");
        return;
      }
      So(s.TransactionSummary.per_token || {}), await Eo(), y(De, /* @__PURE__ */ new Date(), !0), co(n(De).getTime(), n(m)), await Promise.all([Yn(), hn(0)]);
    } catch (s) {
      const c = r.ctx.ui?.accessDeniedOperation?.(s);
      c != null ? (y(T, c, !0), y(g, "")) : (y(T, ""), y(g, s?.message ?? String(s), !0));
    } finally {
      y(_, !1);
    }
  }
  async function To() {
    if (!n(Ca) || !n(Ye) || n(Xt) == null) return;
    const s = n(Ye).symbol, c = Zt(n(Xt), n(Ye).decimals, s), b = n(Bn) || n(Or);
    if (await bo({
      title: "Confirm send",
      body: `Send ${c} to ${b}? This cannot be undone.`,
      confirmLabel: "Send",
      danger: !0
    })) {
      y(_, !0), y(g, ""), y(T, "");
      try {
        const M = {
          to_principal: n(Or),
          amount: n(Xt),
          token: io(n(lt))
        };
        n(lr).trim() && (M.to_subaccount = n(lr).trim()), n(ur).trim() && (M.from_subaccount = n(ur).trim()), gn(await r.ctx.callAsync("transfer", M)), typeof r.ctx.notify == "function" && r.ctx.notify("success", `Sent ${c}`), y(Lr, ""), y(Gr, ""), y(lr, ""), y(ur, ""), await Yn(), await hn();
      } catch (M) {
        const L = r.ctx.ui?.accessDeniedOperation?.(M);
        L != null ? (y(T, L, !0), y(g, "")) : (y(T, ""), y(g, M?.message ?? String(M), !0));
      } finally {
        y(_, !1);
      }
    }
  }
  async function Ao() {
    y(Cr, !0), y(Nt, null), y(g, ""), y(T, "");
    try {
      const s = {};
      if (n(yt) === "user" && n(Kt).trim())
        s.principal = n(Kt).trim();
      else if (n(yt) === "invoice" && n(Kr).trim())
        s.invoice_id = n(Kr).trim();
      else if (n(yt) === "raw" && n(Xr).trim())
        s.subaccount_hex = n(Xr).trim();
      else {
        y(g, "Please enter a value to look up"), y(Cr, !1);
        return;
      }
      const c = gn(await r.ctx.callAsync("lookup_balance", s));
      c?.LookupBalance ? y(Nt, c.LookupBalance, !0) : y(g, "Lookup failed");
    } catch (s) {
      const c = r.ctx.ui?.accessDeniedOperation?.(s);
      c != null ? (y(T, c, !0), y(g, "")) : (y(T, ""), y(g, s?.message ?? String(s), !0));
    } finally {
      y(Cr, !1);
    }
  }
  async function Gn(s) {
    y(Me, s, !0), await hn(s);
  }
  function Mo(s, c) {
    if (s <= 7) return Array.from({ length: s }, (w, M) => M);
    const b = [0];
    c > 3 && b.push("...");
    for (let w = Math.max(1, c - 1); w <= Math.min(s - 2, c + 1); w++) b.push(w);
    return c < s - 4 && b.push("..."), b.push(s - 1), b;
  }
  const No = [
    { id: "activity", label: "Activity" },
    { id: "send", label: "Send" },
    { id: "lookup", label: "Lookup" }
  ];
  jl(() => {
    const s = [];
    return r.ctx.userProfiles?.subscribe && s.push(r.ctx.userProfiles.subscribe((c) => {
      y(E, c || [], !0);
    })), (async () => {
      await Promise.all([ko(), mo()]);
      const c = Un(), b = Oa(), w = Date.now();
      !b || w - b.timestamp > c.maxRefreshAgeMs ? await Jn() : await Promise.all([Yn(), hn(0)]);
    })(), () => {
      for (const c of s) c();
    };
  });
  var Kn = ef(), Xn = h(Kn), ja = h(Xn), Ba = h(ja), Va = x(Ba, 2), Ro = h(Va), bn = x(ja, 2), Ha = h(bn), Do = h(Ha);
  Hl(Do);
  var za = x(Xn, 2);
  {
    var Lo = (s) => {
      var c = Jl(), b = h(c);
      wt(b, 20, () => n(Bt), (M) => M, (M, L) => {
        const O = /* @__PURE__ */ ne(() => n(C)[L]), J = /* @__PURE__ */ ne(() => n(m)[L] || 0);
        var z = Yl(), H = h(z), W = h(H), ve = h(W), se = x(W, 2), ge = h(se), ce = x(H, 2), ye = h(ce), Ne = h(ye), Se = x(ye, 2);
        R(
          (I, q, P, F, B, ie, G, pe) => {
            u(z, 1, I), ft(z, "title", q), u(W, 1, P), j(ve, n(O).symbol), u(se, 1, F), j(ge, n(O).name), u(ce, 1, B), u(ye, 1, ie), j(Ne, G), u(Se, 1, pe);
          },
          [
            () => l(t("flex items-center justify-between gap-4 bg-white/60 dark:bg-gray-800/40 rounded-lg p-4")),
            () => dr(n(J)),
            () => l(t("text-sm font-semibold text-indigo-900 dark:text-indigo-200")),
            () => l(t("text-xs text-indigo-600/70 dark:text-indigo-400/70")),
            () => l(t("flex items-center gap-4")),
            () => l(t("text-2xl font-bold text-indigo-900 dark:text-indigo-100 tabular-nums")),
            () => Zt(n(J), n(O).decimals, n(O).symbol),
            () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 transition-colors shrink-0"))
          ]
        ), Fe("click", Se, () => xo(L)), A(M, z);
      });
      var w = x(b, 2);
      R(
        (M, L, O) => {
          u(c, 1, M), u(b, 1, L), u(w, 1, O);
        },
        [
          () => l(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20", "border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => l(t("space-y-3")),
          () => l(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), A(s, c);
    }, Co = (s) => {
      var c = Gl(), b = h(c), w = x(b, 2);
      R(
        (M, L, O) => {
          u(c, 1, M), u(b, 1, L), u(w, 1, O);
        },
        [
          () => l(t("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => l(t("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), A(s, c);
    };
    ee(za, (s) => {
      n(Z) && n(Bt).length > 0 ? s(Lo) : n(Z) && s(Co, 1);
    });
  }
  var Zn = x(za, 2), qa = h(Zn), Ua = x(qa, 2), Qn = h(Ua), Wa = h(Qn), Zr = x(Wa, 2), Oo = h(Zr), Io = x(Zr, 2);
  {
    var Po = (s) => {
      var c = Kl();
      R((b) => u(c, 1, b), [
        () => l(t("text-xs text-green-600 dark:text-green-400"))
      ]), A(s, c);
    };
    ee(Io, (s) => {
      n(ze) === n(k) && n(k) && s(Po);
    });
  }
  var Ya = x(Qn, 2);
  {
    var Fo = (s) => {
      var c = Xl(), b = h(c), w = x(b, 2), M = h(w);
      R(
        (L, O, J, z, H) => {
          u(c, 1, L), u(b, 1, O), u(w, 1, J), j(M, `${z ?? ""} (${H ?? ""})`);
        },
        [
          () => l(t("text-xs text-gray-600 dark:text-gray-400")),
          () => l(t("font-medium")),
          () => l(t("ml-1")),
          () => n(De).toLocaleString(),
          () => Ia(n(De))
        ]
      ), A(s, c);
    };
    ee(Ya, (s) => {
      n(De) && s(Fo);
    });
  }
  var jo = x(Ya, 2);
  wt(jo, 16, () => n(Bt), (s) => s, (s, c) => {
    const b = /* @__PURE__ */ ne(() => n(C)[c]);
    var w = $l(), M = h(w), L = h(M), O = x(M, 2), J = h(O), z = x(O, 2), H = h(z), W = x(z, 2), ve = h(W), se = x(W, 2), ge = h(se), ce = x(ge, 2), ye = h(ce), Ne = x(ce, 2);
    {
      var Se = (G) => {
        var pe = Zl();
        R((me) => u(pe, 1, me), [() => l(t("text-green-600 dark:text-green-400"))]), A(G, pe);
      };
      ee(Ne, (G) => {
        n(ze) === n(b).ledger && G(Se);
      });
    }
    var I = x(se, 2), q = h(I), P = x(q, 2), F = h(P), B = x(P, 2);
    {
      var ie = (G) => {
        var pe = Ql();
        R((me) => u(pe, 1, me), [() => l(t("text-green-600 dark:text-green-400"))]), A(G, pe);
      };
      ee(B, (G) => {
        n(ze) === n(b).indexer && G(ie);
      });
    }
    R(
      (G, pe, me, be, K, ue, he, ke, Ce, Q, _e, Ee) => {
        u(w, 1, G), u(M, 1, pe), j(L, n(b).symbol), u(O, 1, me), j(J, `Name: ${n(b).name ?? ""}`), u(z, 1, be), j(H, `Decimals: ${n(b).decimals ?? ""}`), u(W, 1, K), j(ve, `Transfer fee: ${ue ?? ""}`), u(se, 1, he), u(ge, 1, ke), u(ce, 1, Ce), j(ye, n(b).ledger), u(I, 1, Q), u(q, 1, _e), u(P, 1, Ee), j(F, n(b).indexer);
      },
      [
        () => l(t("text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 first:border-0 first:pt-0")),
        () => l(t("font-semibold text-gray-700 dark:text-gray-300")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => Zt(n(b).fee, n(b).decimals, n(b).symbol),
        () => l(t("flex flex-wrap items-center gap-2")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
        () => l(t("flex flex-wrap items-center gap-2")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
      ]
    ), Fe("click", ce, () => cr(n(b).ledger)), Fe("click", P, () => cr(n(b).indexer)), A(s, w);
  });
  var Ja = x(Zn, 2);
  {
    var Bo = (s) => {
      var c = ra(), b = _r(c);
      {
        var w = (L) => {
          const O = /* @__PURE__ */ ne(() => r.ctx.ui.AccessDenied);
          var J = ra(), z = _r(J);
          Nl(z, () => n(O), (H, W) => {
            W(H, {
              get operation() {
                return n(T);
              }
            });
          }), A(L, J);
        }, M = (L) => {
          var O = eu();
          A(L, O);
        };
        ee(b, (L) => {
          r.ctx.ui?.AccessDenied ? L(w) : L(M, -1);
        });
      }
      A(s, c);
    }, Vo = (s) => {
      var c = ru(), b = h(c), w = h(b), M = x(b, 2);
      {
        var L = (J) => {
          var z = tu(), H = h(z), W = x(H, 2), ve = h(W);
          R(
            (se, ge, ce) => {
              u(z, 1, se), u(H, 1, ge), u(W, 1, ce), j(ve, n(g));
            },
            [
              () => l(t("mt-2")),
              () => l(t("text-xs cursor-pointer select-none opacity-80")),
              () => l(t("mt-2 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto opacity-90"))
            ]
          ), A(J, z);
        }, O = /* @__PURE__ */ ne(() => Fa(n(g)) !== n(g));
        ee(M, (J) => {
          n(O) && J(L);
        });
      }
      R(
        (J, z, H) => {
          u(c, 1, J), u(b, 1, z), j(w, H);
        },
        [
          () => l(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300")),
          () => l(t("font-medium")),
          () => Fa(n(g))
        ]
      ), A(s, c);
    };
    ee(Ja, (s) => {
      n(T) ? s(Bo) : n(g) && s(Vo, 1);
    });
  }
  var $n = x(Ja, 2), Ga = h($n);
  wt(Ga, 17, () => No, (s) => s.id, (s, c) => {
    var b = nu(), w = h(b);
    R(
      (M) => {
        u(b, 1, M), j(w, n(c).label);
      },
      [
        () => l(t("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", n(f) === n(c).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Fe("click", b, () => {
      y(f, n(c).id, !0);
    }), A(s, b);
  });
  var Ho = x(Ga, 2);
  {
    var zo = (s) => {
      var c = au(), b = h(c);
      zl(b), R((w) => u(c, 1, w), [
        () => l(t("ml-auto px-4 py-2.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5", n(f) === "admin" ? "border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"))
      ]), Fe("click", c, () => {
        y(f, "admin");
      }), A(s, c);
    };
    ee(Ho, (s) => {
      n(S) && s(zo);
    });
  }
  var qo = x($n, 2), Uo = h(qo);
  {
    var Wo = (s) => {
      var c = Su(), b = h(c), w = x(b, 2);
      {
        var M = (H) => {
          var W = ou();
          wt(W, 20, () => Array(4), si, (ve, se) => {
            var ge = iu(), ce = h(ge), ye = x(ce, 2), Ne = x(ye, 2), Se = x(Ne, 2), I = x(Se, 2);
            R(
              (q, P, F, B, ie, G) => {
                u(ge, 1, q), u(ce, 1, P), u(ye, 1, F), u(Ne, 1, B), u(Se, 1, ie), u(I, 1, G);
              },
              [
                () => l(t("px-4 py-4 animate-pulse flex gap-4")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-16")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 hidden sm:block")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"))
              ]
            ), A(ve, ge);
          }), R((ve) => u(W, 1, ve), [
            () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), A(H, W);
        }, L = (H) => {
          var W = su(), ve = h(W), se = x(ve, 2), ge = x(se, 2);
          R(
            (ce, ye, Ne, Se) => {
              u(W, 1, ce), u(ve, 0, ye), u(se, 1, Ne), u(ge, 1, Se);
            },
            [
              () => l(t("px-6 py-12 text-center")),
              () => l(t("w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3")),
              () => l(t("text-sm font-medium text-gray-500 dark:text-gray-400")),
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-1"))
            ]
          ), A(H, W);
        }, O = (H) => {
          var W = bu(), ve = h(W), se = h(ve), ge = h(se), ce = h(ge), ye = x(ce), Ne = x(ye), Se = x(Ne), I = x(Se), q = x(se);
          wt(q, 21, () => n(de), (P) => P._id || P.tx_id, (P, F) => {
            const B = /* @__PURE__ */ ne(() => n(F).timestamp ? vo(n(F).timestamp) : null), ie = /* @__PURE__ */ ne(() => Wn(n(F).principal_from)), G = /* @__PURE__ */ ne(() => Wn(n(F).principal_to)), pe = /* @__PURE__ */ ne(() => go(n(F)));
            var me = hu(), be = h(me), K = h(be);
            {
              var ue = (te) => {
                var le = uu(), fe = _r(le), rt = h(fe), Vt = x(fe, 2);
                {
                  var Ht = (Je) => {
                    var ut = lu();
                    R((vr) => u(ut, 1, vr), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(Je, ut);
                  }, He = /* @__PURE__ */ ne(() => n(ze) === n(B).toLocaleString());
                  ee(Vt, (Je) => {
                    n(He) && Je(Ht);
                  });
                }
                R(
                  (Je, ut, vr) => {
                    u(fe, 1, Je), ft(fe, "title", ut), j(rt, vr);
                  },
                  [
                    () => l(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                    () => n(B).toLocaleString(),
                    () => Ia(n(B))
                  ]
                ), Fe("click", fe, () => cr(n(B).toLocaleString())), A(te, le);
              }, he = (te) => {
                var le = fu();
                R((fe) => u(le, 1, fe), [() => l(t("text-gray-400"))]), A(te, le);
              };
              ee(K, (te) => {
                n(B) ? te(ue) : te(he, -1);
              });
            }
            var ke = x(K, 2), Ce = h(ke), Q = x(be), _e = h(Q), Ee = h(_e), Pe = x(Q), qe = h(Pe);
            {
              var Be = (te) => {
                var le = cu(), fe = _r(le), rt = h(fe), Vt = x(fe, 2);
                {
                  var Ht = (He) => {
                    var Je = du();
                    R((ut) => u(Je, 1, ut), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(He, Je);
                  };
                  ee(Vt, (He) => {
                    n(ze) === n(F).principal_from && He(Ht);
                  });
                }
                R(
                  (He) => {
                    u(fe, 1, He), ft(fe, "title", n(ie).title), j(rt, n(ie).display);
                  },
                  [
                    () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Fe("click", fe, () => cr(n(F).principal_from)), A(te, le);
              }, Xe = (te) => {
                var le = vu(), fe = h(le);
                R(
                  (rt) => {
                    u(le, 1, rt), ft(le, "title", n(ie).title), j(fe, n(ie).display);
                  },
                  [() => l(t("text-xs text-gray-700 dark:text-gray-300"))]
                ), A(te, le);
              };
              ee(qe, (te) => {
                n(ie).copyable ? te(Be) : te(Xe, -1);
              });
            }
            var tt = x(Pe), mt = h(tt);
            {
              var Rt = (te) => {
                var le = _u(), fe = _r(le), rt = h(fe), Vt = x(fe, 2);
                {
                  var Ht = (He) => {
                    var Je = pu();
                    R((ut) => u(Je, 1, ut), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(He, Je);
                  };
                  ee(Vt, (He) => {
                    n(ze) === n(F).principal_to && He(Ht);
                  });
                }
                R(
                  (He) => {
                    u(fe, 1, He), ft(fe, "title", n(G).title), j(rt, n(G).display);
                  },
                  [
                    () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Fe("click", fe, () => cr(n(F).principal_to)), A(te, le);
              }, D = (te) => {
                var le = gu(), fe = h(le);
                R(
                  (rt) => {
                    u(le, 1, rt), ft(le, "title", n(G).title), j(fe, n(G).display);
                  },
                  [() => l(t("text-xs text-gray-700 dark:text-gray-300"))]
                ), A(te, le);
              };
              ee(mt, (te) => {
                n(G).copyable ? te(Rt) : te(D, -1);
              });
            }
            var V = x(tt), oe = h(V), Ve = h(oe);
            R(
              (te, le, fe, rt, Vt, Ht, He, Je, ut, vr) => {
                u(me, 1, te), u(be, 1, le), u(ke, 1, fe), j(Ce, `#${(n(F).tx_id || n(F)._id) ?? ""}`), u(Q, 1, rt), u(_e, 1, Vt), j(Ee, Ht), u(Pe, 1, He), u(tt, 1, Je), u(V, 1, ut), u(oe, 1, vr), ft(oe, "title", n(pe).title), j(Ve, n(pe).text);
              },
              [
                () => l(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
                () => l(t("px-4 py-3")),
                () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
                () => l(t("px-4 py-3")),
                () => l(t("px-2 py-0.5 rounded text-xs font-medium", _o(n(F).kind))),
                () => po(n(F).kind),
                () => l(t("px-4 py-3 hidden sm:table-cell")),
                () => l(t("px-4 py-3")),
                () => l(t("px-4 py-3 text-right")),
                () => l(t("font-medium tabular-nums", n(pe).className))
              ]
            ), A(P, me);
          }), R(
            (P, F, B, ie, G, pe, me, be, K) => {
              u(W, 1, P), u(ve, 1, F), u(se, 1, B), u(ce, 1, ie), u(ye, 1, G), u(Ne, 1, pe), u(Se, 1, me), u(I, 1, be), u(q, 1, K);
            },
            [
              () => l(t("overflow-x-auto")),
              () => l(t("w-full text-sm")),
              () => l(t("bg-gray-50 dark:bg-gray-700/50")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
            ]
          ), A(H, W);
        };
        ee(w, (H) => {
          n(_) && n(de).length === 0 ? H(M) : n(de).length === 0 ? H(L, 1) : H(O, -1);
        });
      }
      var J = x(w, 2);
      {
        var z = (H) => {
          const W = /* @__PURE__ */ ne(() => Number(n(we).total_items_count)), ve = /* @__PURE__ */ ne(() => n(W) > 0 ? n(Me) * Mt + 1 : 0), se = /* @__PURE__ */ ne(() => Math.min((n(Me) + 1) * Mt, n(W))), ge = /* @__PURE__ */ ne(() => Number(n(we).total_pages) > 1);
          var ce = wu(), ye = h(ce), Ne = h(ye), Se = x(Ne);
          {
            var I = (F) => {
              var B = xu(), ie = h(B);
              R(
                (G) => {
                  u(B, 1, G), j(ie, `(Page ${n(Me) + 1} of ${n(we).total_pages ?? ""})`);
                },
                [() => l(t("ml-1"))]
              ), A(F, B);
            };
            ee(Se, (F) => {
              n(ge) && F(I);
            });
          }
          var q = x(ye, 2);
          {
            var P = (F) => {
              var B = ku(), ie = h(B), G = x(ie, 2);
              wt(G, 17, () => Mo(Number(n(we).total_pages), n(Me)), si, (me, be) => {
                var K = ra(), ue = _r(K);
                {
                  var he = (Ce) => {
                    var Q = yu();
                    R((_e) => u(Q, 1, _e), [() => l(t("px-1.5 text-xs text-gray-400"))]), A(Ce, Q);
                  }, ke = (Ce) => {
                    var Q = mu(), _e = h(Q);
                    R(
                      (Ee) => {
                        u(Q, 1, Ee), j(_e, n(be) + 1);
                      },
                      [
                        () => l(t("px-2.5 py-1 text-xs border rounded", n(Me) === n(be) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                      ]
                    ), Fe("click", Q, () => Gn(n(be))), A(Ce, Q);
                  };
                  ee(ue, (Ce) => {
                    n(be) === "..." ? Ce(he) : Ce(ke, -1);
                  });
                }
                A(me, K);
              });
              var pe = x(G, 2);
              R(
                (me, be, K, ue) => {
                  u(B, 1, me), ie.disabled = n(Me) === 0, u(ie, 1, be), pe.disabled = K, u(pe, 1, ue);
                },
                [
                  () => l(t("flex items-center gap-1")),
                  () => l(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
                  () => n(Me) >= Number(n(we).total_pages) - 1,
                  () => l(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
                ]
              ), Fe("click", ie, () => Gn(n(Me) - 1)), Fe("click", pe, () => Gn(n(Me) + 1)), A(F, B);
            };
            ee(q, (F) => {
              n(ge) && F(P);
            });
          }
          R(
            (F, B) => {
              u(ce, 1, F), u(ye, 1, B), j(Ne, `Showing ${n(ve) ?? ""}–${n(se) ?? ""} of ${n(W) ?? ""} `);
            },
            [
              () => l(t("p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3")),
              () => l(t("text-xs text-gray-500 dark:text-gray-400"))
            ]
          ), A(H, ce);
        };
        ee(J, (H) => {
          n(we) && n(de).length > 0 && H(z);
        });
      }
      R(
        (H, W) => {
          u(c, 1, H), u(b, 1, W);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden")),
          () => l(t("text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"))
        ]
      ), A(s, c);
    }, Yo = (s) => {
      var c = Pu(), b = h(c), w = x(b, 2), M = h(w), L = h(M), O = x(L, 2);
      {
        var J = (D) => {
          var V = Eu();
          R((oe) => u(V, 1, oe), [() => l(t("text-sm text-gray-500 dark:text-gray-400"))]), A(D, V);
        }, z = (D) => {
          var V = Tu(), oe = h(V);
          R(
            (Ve) => {
              u(V, 1, Ve), j(oe, `Sending ${n(C)[n(Bt)[0]].symbol ?? ""}`);
            },
            [() => l(t("text-sm text-gray-900 dark:text-gray-100"))]
          ), A(D, V);
        }, H = (D) => {
          var V = Mu();
          wt(V, 20, () => n(Bt), (oe) => oe, (oe, Ve) => {
            var te = Au(), le = h(te), fe = {};
            R(() => {
              j(le, n(C)[Ve].symbol), fe !== (fe = Ve) && (te.value = (te.__value = Ve) ?? "");
            }), A(oe, te);
          }), R((oe) => u(V, 1, oe), [
            () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Cl(V, () => n(lt), (oe) => y(lt, oe)), A(D, V);
        };
        ee(O, (D) => {
          n(Bt).length === 0 ? D(J) : n(Bt).length === 1 ? D(z, 1) : D(H, -1);
        });
      }
      var W = x(M, 2), ve = h(W), se = x(ve, 2), ge = x(se, 2);
      {
        var ce = (D) => {
          var V = Nu();
          R((oe) => u(V, 1, oe), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(D, V);
        }, ye = (D) => {
          var V = Ru(), oe = h(V);
          R(
            (Ve) => {
              u(V, 1, Ve), j(oe, n(Bn));
            },
            [
              () => l(t("text-xs text-gray-600 dark:text-gray-400 mt-1"))
            ]
          ), A(D, V);
        }, Ne = (D) => {
          var V = Du();
          R((oe) => u(V, 1, oe), [
            () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
          ]), A(D, V);
        };
        ee(ge, (D) => {
          n(Or) && !n(La) ? D(ce) : n(Bn) ? D(ye, 1) : D(Ne, -1);
        });
      }
      var Se = x(W, 2), I = h(Se), q = h(I), P = h(q), F = x(q, 2), B = x(I, 2), ie = x(B, 2);
      {
        var G = (D) => {
          var V = Lu(), oe = h(V);
          R(
            (Ve, te, le) => {
              u(V, 1, Ve), j(oe, `Available ${te ?? ""}
								· Network fee ${le ?? ""}`);
            },
            [
              () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1")),
              () => Zt(n(Fn), n(Ye).decimals, n(Ye).symbol),
              () => Zt(n(jn), n(Ye).decimals, n(Ye).symbol)
            ]
          ), A(D, V);
        };
        ee(ie, (D) => {
          n(Ye) && D(G);
        });
      }
      var pe = x(ie, 2);
      {
        var me = (D) => {
          var V = Cu(), oe = h(V);
          R(
            (Ve, te) => {
              u(V, 1, Ve), j(oe, `= ${te ?? ""}`);
            },
            [
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
              () => dr(n(Xt))
            ]
          ), A(D, V);
        };
        ee(pe, (D) => {
          n(Xt) != null && n(Xt) > 0 && D(me);
        });
      }
      var be = x(Se, 2), K = h(be), ue = x(K, 2), he = h(ue), ke = x(he, 2), Ce = h(ke), Q = x(Ce, 2), _e = x(Q, 2);
      {
        var Ee = (D) => {
          var V = Ou();
          R((oe) => u(V, 1, oe), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(D, V);
        };
        ee(_e, (D) => {
          n(Vn) || D(Ee);
        });
      }
      var Pe = x(ke, 2), qe = h(Pe), Be = x(qe, 2), Xe = x(Be, 2);
      {
        var tt = (D) => {
          var V = Iu();
          R((oe) => u(V, 1, oe), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(D, V);
        };
        ee(Xe, (D) => {
          n(Hn) || D(tt);
        });
      }
      var mt = x(be, 2), Rt = h(mt);
      R(
        (D, V, oe, Ve, te, le, fe, rt, Vt, Ht, He, Je, ut, vr, Ko, Xo, Zo, Qo, $o) => {
          u(c, 1, D), u(b, 1, V), u(w, 1, oe), u(L, 1, Ve), u(ve, 1, te), u(se, 1, le), u(I, 1, fe), u(q, 1, rt), j(P, `Amount${n(Ye) ? ` (${n(Ye).symbol})` : ""}`), F.disabled = !n(Ye) || n(Fn) <= n(jn), u(F, 1, Vt), u(B, 1, Ht), u(be, 1, He), u(K, 1, Je), u(ue, 1, ut), u(he, 1, vr), u(Ce, 1, Ko), u(Q, 1, Xo), u(qe, 1, Zo), u(Be, 1, Qo), mt.disabled = !n(Ca), u(mt, 1, $o), j(Rt, n(_) ? "Sending…" : "Send");
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => l(t("space-y-4")),
          () => l(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(t("flex items-center justify-between mb-1.5")),
          () => l(t("text-sm font-medium text-gray-700 dark:text-gray-300")),
          () => l(t("text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40")),
          () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(t("rounded-lg border border-gray-200 dark:border-gray-700")),
          () => l(t("px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none")),
          () => l(t("px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400")),
          () => l(t("block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1")),
          () => l(t("w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40", n(Vn) ? "border-gray-300 dark:border-gray-600" : "border-red-400 dark:border-red-600")),
          () => l(t("block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1")),
          () => l(t("w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40", n(Hn) ? "border-gray-300 dark:border-gray-600" : "border-red-400 dark:border-red-600")),
          () => l(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), ii("submit", w, (D) => {
        D.preventDefault(), To();
      }), $t(se, () => n(Lr), (D) => y(Lr, D)), Fe("click", F, yo), $t(B, () => n(Gr), (D) => y(Gr, D)), $t(Q, () => n(lr), (D) => y(lr, D)), $t(Be, () => n(ur), (D) => y(ur, D)), A(s, c);
    }, Jo = (s) => {
      var c = Ju(), b = h(c), w = x(b, 2), M = x(w, 2);
      wt(
        M,
        20,
        () => [
          { id: "user", label: "Member" },
          { id: "invoice", label: "Invoice" },
          { id: "raw", label: "Advanced" }
        ],
        (I) => I.id,
        (I, q) => {
          var P = Fu(), F = h(P);
          R(
            (B) => {
              u(P, 1, B), j(F, q.label);
            },
            [
              () => l(t("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", n(yt) === q.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
            ]
          ), Fe("click", P, () => {
            y(yt, q.id, !0), y(Nt, null);
          }), A(I, P);
        }
      );
      var L = x(M, 2);
      {
        var O = (I) => {
          var q = ju();
          R((P) => u(q, 1, P), [
            () => l(t("text-xs text-gray-500 dark:text-gray-400 mb-3"))
          ]), A(I, q);
        };
        ee(L, (I) => {
          n(yt) === "raw" && I(O);
        });
      }
      var J = x(L, 2), z = h(J);
      {
        var H = (I) => {
          var q = Vu(), P = _r(q), F = x(P, 2);
          wt(F, 21, () => n(ao), (B) => B.principal, (B, ie) => {
            var G = Bu(), pe = h(G), me = {};
            R(() => {
              j(pe, n(ie).label), me !== (me = n(ie).principal) && (G.value = (G.__value = n(ie).principal) ?? "");
            }), A(B, G);
          }), R((B) => u(P, 1, B), [
            () => l(t("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), $t(P, () => n(Kt), (B) => y(Kt, B)), A(I, q);
        }, W = (I) => {
          var q = Hu();
          R((P) => u(q, 1, P), [
            () => l(t("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), $t(q, () => n(Kr), (P) => y(Kr, P)), A(I, q);
        }, ve = (I) => {
          var q = zu();
          R((P) => u(q, 1, P), [
            () => l(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), $t(q, () => n(Xr), (P) => y(Xr, P)), A(I, q);
        };
        ee(z, (I) => {
          n(yt) === "user" ? I(H) : n(yt) === "invoice" ? I(W, 1) : I(ve, -1);
        });
      }
      var se = x(z, 2), ge = h(se);
      {
        var ce = (I) => {
          fi(I);
        };
        ee(ge, (I) => {
          n(Cr) && I(ce);
        });
      }
      var ye = x(ge), Ne = x(J, 2);
      {
        var Se = (I) => {
          var q = Yu(), P = h(q), F = h(P), B = h(F), ie = h(B), G = x(B, 2);
          {
            var pe = (Q) => {
              var _e = qu(), Ee = h(_e);
              R(
                (Pe, qe) => {
                  u(_e, 1, Pe), j(Ee, qe);
                },
                [
                  () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-0.5")),
                  () => n(fr)[n(Kt).trim()]
                ]
              ), A(Q, _e);
            }, me = /* @__PURE__ */ ne(() => n(yt) === "user" && n(fr)[n(Kt).trim()]);
            ee(G, (Q) => {
              n(me) && Q(pe);
            });
          }
          var be = x(F, 2), K = h(be), ue = x(P, 2);
          wt(ue, 21, () => Object.entries(n(Nt).balances), ([Q, _e]) => Q, (Q, _e) => {
            var Ee = /* @__PURE__ */ ne(() => us(n(_e), 2));
            let Pe = () => n(Ee)[0], qe = () => n(Ee)[1];
            const Be = /* @__PURE__ */ ne(() => qn(Pe()));
            var Xe = Uu(), tt = h(Xe), mt = h(tt), Rt = x(tt, 2), D = h(Rt);
            R(
              (V, oe, Ve, te, le) => {
                u(Xe, 1, V), ft(Xe, "title", oe), u(tt, 1, Ve), j(mt, n(Be).symbol), u(Rt, 1, te), j(D, le);
              },
              [
                () => l(t("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => dr(Number(qe())),
                () => l(t("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => l(t("text-lg font-bold tabular-nums", Number(qe()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-gray-500")),
                () => Zt(Number(qe()), n(Be).decimals, n(Be).symbol)
              ]
            ), A(Q, Xe);
          });
          var he = x(ue, 2);
          {
            var ke = (Q) => {
              var _e = Wu();
              R((Ee) => u(_e, 1, Ee), [() => l(t("text-sm text-gray-500 italic"))]), A(Q, _e);
            }, Ce = /* @__PURE__ */ ne(() => Object.values(n(Nt).balances).every((Q) => Number(Q) === 0));
            ee(he, (Q) => {
              n(Ce) && Q(ke);
            });
          }
          R(
            (Q, _e, Ee, Pe, qe, Be, Xe) => {
              u(q, 1, Q), u(P, 1, _e), u(B, 1, Ee), j(ie, Pe), u(be, 1, qe), ft(be, "title", n(Nt).subaccount_hex), j(K, `${Be ?? ""}…`), u(ue, 1, Xe);
            },
            [
              () => l(t("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3")),
              () => l(t("flex items-center justify-between gap-3")),
              () => l(t("text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => ho(),
              () => l(t("text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono")),
              () => n(Nt).subaccount_hex.substring(0, 16),
              () => l(t("space-y-2"))
            ]
          ), Fe("click", be, () => cr(n(Nt)?.subaccount_hex || "")), A(I, q);
        };
        ee(Ne, (I) => {
          n(Nt) && I(Se);
        });
      }
      R(
        (I, q, P, F, B, ie) => {
          u(c, 1, I), u(b, 1, q), u(w, 1, P), u(M, 1, F), u(J, 1, B), se.disabled = n(Cr), u(se, 1, ie), j(ye, ` ${n(Cr) ? "Looking up…" : "Look up"}`);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => l(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => l(t("flex flex-wrap gap-2 mb-4")),
          () => l(t("flex gap-2 mb-4")),
          () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"))
        ]
      ), ii("submit", J, (I) => {
        I.preventDefault(), Ao();
      }), A(s, c);
    }, Go = (s) => {
      var c = $u(), b = h(c), w = x(b, 2), M = h(w), L = h(M);
      {
        var O = (K) => {
          fi(K);
        };
        ee(L, (K) => {
          n(_) && K(O);
        });
      }
      var J = x(L), z = x(w, 2), H = h(z), W = x(H, 2), ve = x(W, 2), se = h(ve), ge = x(se, 2), ce = x(ge, 2), ye = x(ce, 2), Ne = x(z, 2), Se = h(Ne), I = h(Se), q = h(I), P = x(I, 2);
      {
        var F = (K) => {
          var ue = Ku();
          wt(ue, 23, () => n(Ae), (he, ke) => he._id ?? he.principal ?? he.id ?? ke, (he, ke) => {
            const Ce = /* @__PURE__ */ ne(() => qn(n(ke).token)), Q = /* @__PURE__ */ ne(() => n(ke).principal || n(ke)._id || n(ke).id), _e = /* @__PURE__ */ ne(() => Wn(n(Q)));
            var Ee = Gu(), Pe = h(Ee), qe = h(Pe), Be = x(Pe, 2), Xe = h(Be);
            R(
              (tt, mt, Rt, D, V) => {
                u(Ee, 1, tt), u(Pe, 1, mt), ft(Pe, "title", n(_e).title), j(qe, n(_e).display), u(Be, 1, Rt), ft(Be, "title", D), j(Xe, V);
              },
              [
                () => l(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => l(t("text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => l(t("text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums")),
                () => dr(n(ke).amount || 0),
                () => Zt(n(ke).amount || 0, n(Ce).decimals, n(Ce).symbol)
              ]
            ), A(he, Ee);
          }), R((he) => u(ue, 1, he), [() => l(t("space-y-2 max-h-80 overflow-auto"))]), A(K, ue);
        }, B = (K) => {
          var ue = Xu();
          R((he) => u(ue, 1, he), [() => l(t("text-gray-500 dark:text-gray-400 text-sm"))]), A(K, ue);
        };
        ee(P, (K) => {
          n(Ae).length > 0 ? K(F) : K(B, -1);
        });
      }
      var ie = x(Se, 2), G = h(ie), pe = x(G, 2);
      {
        var me = (K) => {
          var ue = Zu(), he = h(ue);
          R(
            (ke) => {
              u(ue, 1, ke), j(he, `Total transfers: ${n(we).total_items_count ?? ""}`);
            },
            [() => l(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), A(K, ue);
        }, be = (K) => {
          var ue = Qu();
          R((he) => u(ue, 1, he), [() => l(t("text-gray-500 dark:text-gray-400 text-sm"))]), A(K, ue);
        };
        ee(pe, (K) => {
          n(we) ? K(me) : K(be, -1);
        });
      }
      R(
        (K, ue, he, ke, Ce, Q, _e, Ee, Pe, qe, Be, Xe, tt, mt, Rt) => {
          u(c, 1, K), u(b, 1, ue), u(w, 1, he), M.disabled = n(_), u(M, 1, ke), j(J, ` ${n(_) ? "Refreshing…" : "Full Vault Refresh"}`), u(z, 1, Ce), u(H, 1, Q), u(W, 1, _e), u(ve, 1, Ee), u(se, 1, Pe), u(ge, 1, qe), u(ce, 1, Be), u(ye, 1, Xe), u(Ne, 1, tt), u(I, 1, mt), j(q, `All Balances in System (${n(Ae).length ?? ""})`), u(G, 1, Rt);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => l(t("mb-4")),
          () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => l(t("mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700")),
          () => l(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400 mb-3")),
          () => l(t("flex items-center gap-3")),
          () => l(t("text-sm text-gray-700 dark:text-gray-300")),
          () => l(t("w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100")),
          () => l(t("text-sm text-gray-500 dark:text-gray-400")),
          () => l(t("px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60")),
          () => l(t("space-y-6")),
          () => l(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => l(t("font-semibold text-gray-700 dark:text-gray-300 mb-2"))
        ]
      ), Fe("click", M, Jn), $t(ge, () => n(Le), (K) => y(Le, K)), Fe("click", ye, fo), A(s, c);
    };
    ee(Uo, (s) => {
      n(f) === "activity" ? s(Wo) : n(f) === "send" ? s(Yo, 1) : n(f) === "lookup" ? s(Jo, 2) : n(f) === "admin" && s(Go, 3);
    });
  }
  R(
    (s, c, b, w, M, L, O, J, z, H, W, ve, se) => {
      u(Kn, 1, s), u(Xn, 1, c), u(Ba, 1, b), u(Va, 1, w), j(Ro, Vl), bn.disabled = n(_), u(bn, 1, M), u(Ha, 1, L), u(Zn, 1, O), u(qa, 1, J), u(Ua, 1, z), u(Qn, 1, H), u(Wa, 1, W), u(Zr, 1, ve), ft(Zr, "title", n(k)), j(Oo, n(k) || "Loading…"), u($n, 1, se);
    },
    [
      () => l(t("max-w-4xl mx-auto p-6 space-y-6")),
      () => l(t("flex justify-between items-start gap-4")),
      () => l(t("text-2xl font-bold text-gray-900 dark:text-gray-100")),
      () => l(t("text-sm text-gray-500 dark:text-gray-400 mt-1")),
      () => l(t("p-2 rounded-lg text-gray-500 dark:text-gray-400", "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200", "disabled:opacity-50 disabled:cursor-not-allowed transition-colors")),
      () => l(t(n(_) ? "inline-block animate-spin" : "")),
      () => l(t("rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50")),
      () => l(t("px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none")),
      () => l(t("px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3")),
      () => l(t("flex flex-wrap items-center gap-2")),
      () => l(t("text-xs font-medium text-gray-500 dark:text-gray-400")),
      () => l(t("font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline")),
      () => l(t("flex border-b border-gray-200 dark:border-gray-700"))
    ]
  ), Fe("click", bn, Jn), Fe("click", Zr, () => cr(n(k))), A(e, Kn), yi();
}
xl(["click"]);
function af(e, r) {
  const t = wl(tf, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        El(t);
      } catch {
      }
    }
  };
}
export {
  af as default
};
