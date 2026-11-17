var bs = Object.defineProperty;
var ki = (e) => {
  throw TypeError(e);
};
var ks = (e, r, t) => r in e ? bs(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var rt = (e, r, t) => ks(e, typeof r != "symbol" ? r + "" : r, t), va = (e, r, t) => r.has(e) || ki("Cannot " + t);
var f = (e, r, t) => (va(e, r, "read from private field"), t ? t.call(e) : r.get(e)), z = (e, r, t) => r.has(e) ? ki("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), B = (e, r, t, a) => (va(e, r, "write to private field"), a ? a.call(e, t) : r.set(e, t), t), se = (e, r, t) => (va(e, r, "access private method"), t);
var Oa = Array.isArray, ws = Array.prototype.indexOf, Fn = Array.prototype.includes, $n = Array.from, Es = Object.defineProperty, un = Object.getOwnPropertyDescriptor, Ss = Object.getOwnPropertyDescriptors, As = Object.prototype, Ts = Array.prototype, Wi = Object.getPrototypeOf, wi = Object.isExtensible;
const Ms = () => {
};
function Cs(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function Yi() {
  var e, r, t = new Promise((a, i) => {
    e = a, r = i;
  });
  return { promise: t, resolve: e, reject: r };
}
function Ns(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const a of e)
    if (t.push(a), t.length === r) break;
  return t;
}
const Be = 2, qr = 4, Gn = 8, $i = 1 << 24, At = 16, Nt = 32, nr = 64, ka = 128, xt = 512, Ie = 1024, Ve = 2048, Vt = 4096, $e = 8192, Ct = 16384, Gr = 32768, Ei = 1 << 25, zr = 65536, jn = 1 << 17, Ds = 1 << 18, Kr = 1 << 19, Ls = 1 << 20, Ft = 1 << 25, Er = 65536, Vn = 1 << 21, Ir = 1 << 22, er = 1 << 23, fn = Symbol("$state"), Dn = Symbol("attributes"), wa = Symbol("class"), Rs = Symbol("style"), an = Symbol("text"), Ln = Symbol("form reset"), Kn = new class extends Error {
  constructor() {
    super(...arguments);
    rt(this, "name", "StaleReactionError");
    rt(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Is(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Ps() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Os(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Fs(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function js() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Vs(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Bs() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Hs() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function qs() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function zs() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Us() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Ws = 1, Ys = 2, Gi = 4, $s = 8, Gs = 16, Ks = 1, Xs = 2, Re = Symbol("uninitialized"), Js = "http://www.w3.org/1999/xhtml";
function Zs() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Qs() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function el() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Ki(e) {
  return e === this.v;
}
function tl(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function Xi(e) {
  return !tl(e, this.v);
}
let Ge = null;
function Ur(e) {
  Ge = e;
}
function Fa(e, r = !1, t) {
  Ge = {
    p: Ge,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      ne
    ),
    l: null
  };
}
function ja(e) {
  var r = (
    /** @type {ComponentContext} */
    Ge
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var a of t)
      xo(a);
  }
  return r.i = !0, Ge = r.p, /** @type {T} */
  {};
}
function Ji() {
  return !0;
}
let vr = [];
function Zi() {
  var e = vr;
  vr = [], Cs(e);
}
function tr(e) {
  if (vr.length === 0 && !dn) {
    var r = vr;
    queueMicrotask(() => {
      r === vr && Zi();
    });
  }
  vr.push(e);
}
function rl() {
  for (; vr.length > 0; )
    Zi();
}
function Qi(e) {
  var r = ne;
  if (r === null)
    return X.f |= er, e;
  if ((r.f & Gr) === 0 && (r.f & qr) === 0)
    throw e;
  Qt(e, r);
}
function Qt(e, r) {
  for (; r !== null; ) {
    if ((r.f & ka) !== 0) {
      if ((r.f & Gr) === 0)
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
const nl = -7169;
function Ae(e, r) {
  e.f = e.f & nl | r;
}
function Va(e) {
  (e.f & xt) !== 0 || e.deps === null ? Ae(e, Ie) : Ae(e, Vt);
}
function eo(e) {
  if (e !== null)
    for (const r of e)
      (r.f & Be) === 0 || (r.f & Er) === 0 || (r.f ^= Er, eo(
        /** @type {Derived} */
        r.deps
      ));
}
function to(e, r, t) {
  (e.f & Ve) !== 0 ? r.add(e) : (e.f & Vt) !== 0 && t.add(e), eo(e.deps), Ae(e, Ie);
}
let ha = null, Nr = null, U = null, Ea = null, Tt = null, Sa = null, dn = !1, pa = !1, Rr = null, Rn = null;
var Si = 0;
let al = 1;
var Pr, Jt, gr, Or, Fr, jr, zt, Vr, Xe, pn, Ut, Et, Pt, Br, _r, de, Aa, on, Ta, ro, no, Lr, il, sn;
const Un = class Un {
  constructor() {
    z(this, de);
    rt(this, "id", al++);
    /** True as soon as `#process` was called */
    z(this, Pr, !1);
    rt(this, "linked", !0);
    /** @type {Batch | null} */
    z(this, Jt, null);
    /** @type {Batch | null} */
    z(this, gr, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    rt(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    rt(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    rt(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    z(this, Or, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    z(this, Fr, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    z(this, jr, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    z(this, zt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    z(this, Vr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    z(this, Xe, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    z(this, pn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    z(this, Ut, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    z(this, Et, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    z(this, Pt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    z(this, Br, /* @__PURE__ */ new Set());
    rt(this, "is_fork", !1);
    z(this, _r, !1);
    Nr === null ? ha = Nr = this : (B(Nr, gr, this), B(this, Jt, Nr)), Nr = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    f(this, Pt).has(r) || f(this, Pt).set(r, { d: [], m: [] }), f(this, Br).delete(r);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(r, t = (a) => this.schedule(a)) {
    var a = f(this, Pt).get(r);
    if (a) {
      f(this, Pt).delete(r);
      for (var i of a.d)
        Ae(i, Ve), t(i);
      for (i of a.m)
        Ae(i, Vt), t(i);
    }
    f(this, Br).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, a = !1) {
    r.v !== Re && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & er) === 0 && (this.current.set(r, [t, a]), Tt?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    U = this;
  }
  deactivate() {
    U = null, Tt = null;
  }
  flush() {
    try {
      pa = !0, U = this, se(this, de, on).call(this);
    } finally {
      Si = 0, Sa = null, Rr = null, Rn = null, pa = !1, U = null, Tt = null, br.clear();
    }
  }
  discard() {
    for (const r of f(this, Fr)) r(this);
    f(this, Fr).clear(), se(this, de, sn).call(this), f(this, Vr)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    f(this, pn).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    if (B(this, jr, f(this, jr) + 1), r) {
      let a = f(this, zt).get(t) ?? 0;
      f(this, zt).set(t, a + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(r, t) {
    if (B(this, jr, f(this, jr) - 1), r) {
      let a = f(this, zt).get(t) ?? 0;
      a === 1 ? f(this, zt).delete(t) : f(this, zt).set(t, a - 1);
    }
    f(this, _r) || (B(this, _r, !0), tr(() => {
      B(this, _r, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(r, t) {
    for (const a of r)
      f(this, Ut).add(a);
    for (const a of t)
      f(this, Et).add(a);
    r.clear(), t.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(r) {
    f(this, Or).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    f(this, Fr).add(r);
  }
  settled() {
    return (f(this, Vr) ?? B(this, Vr, Yi())).promise;
  }
  static ensure() {
    if (U === null) {
      const r = U = new Un();
      !pa && !dn && tr(() => {
        f(r, Pr) || r.flush();
      });
    }
    return U;
  }
  apply() {
    {
      Tt = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if (Sa = r, r.b?.is_pending && (r.f & (qr | Gn | $i)) !== 0 && (r.f & Gr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var a = t.f;
      if (Rr !== null && t === ne && (X === null || (X.f & Be) === 0))
        return;
      if ((a & (nr | Nt)) !== 0) {
        if ((a & Ie) === 0)
          return;
        t.f ^= Ie;
      }
    }
    f(this, Xe).push(t);
  }
};
Pr = new WeakMap(), Jt = new WeakMap(), gr = new WeakMap(), Or = new WeakMap(), Fr = new WeakMap(), jr = new WeakMap(), zt = new WeakMap(), Vr = new WeakMap(), Xe = new WeakMap(), pn = new WeakMap(), Ut = new WeakMap(), Et = new WeakMap(), Pt = new WeakMap(), Br = new WeakMap(), _r = new WeakMap(), de = new WeakSet(), Aa = function() {
  if (this.is_fork) return !0;
  for (const a of f(this, zt).keys()) {
    for (var r = a, t = !1; r.parent !== null; ) {
      if (f(this, Pt).has(r)) {
        t = !0;
        break;
      }
      r = r.parent;
    }
    if (!t)
      return !0;
  }
  return !1;
}, on = function() {
  var d, _, b;
  B(this, Pr, !0), Si++ > 1e3 && (se(this, de, sn).call(this), sl());
  for (const y of f(this, Ut))
    f(this, Et).delete(y), Ae(y, Ve), this.schedule(y);
  for (const y of f(this, Et))
    Ae(y, Vt), this.schedule(y);
  const r = f(this, Xe);
  B(this, Xe, []), this.apply();
  var t = Rr = [], a = [], i = Rn = [];
  for (const y of r)
    try {
      se(this, de, Ta).call(this, y, t, a);
    } catch (x) {
      throw oo(y), se(this, de, Aa).call(this) || this.discard(), x;
    }
  if (U = null, i.length > 0) {
    var o = Un.ensure();
    for (const y of i)
      o.schedule(y);
  }
  if (Rr = null, Rn = null, se(this, de, Aa).call(this)) {
    se(this, de, Lr).call(this, a), se(this, de, Lr).call(this, t);
    for (const [y, x] of f(this, Pt))
      io(y, x);
    i.length > 0 && /** @type {unknown} */
    se(d = U, de, on).call(d);
    return;
  }
  const c = se(this, de, ro).call(this);
  if (c) {
    se(this, de, Lr).call(this, a), se(this, de, Lr).call(this, t), se(_ = c, de, no).call(_, this);
    return;
  }
  f(this, Ut).clear(), f(this, Et).clear();
  for (const y of f(this, Or)) y(this);
  f(this, Or).clear(), Ea = this, Ai(a), Ai(t), Ea = null, f(this, Vr)?.resolve();
  var h = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    U
  );
  if (f(this, jr) === 0 && (f(this, Xe).length === 0 || h !== null) && se(this, de, sn).call(this), f(this, Xe).length > 0)
    if (h !== null) {
      const y = h;
      f(y, Xe).push(...f(this, Xe).filter((x) => !f(y, Xe).includes(x)));
    } else
      h = this;
  h !== null && se(b = h, de, on).call(b);
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Ta = function(r, t, a) {
  r.f ^= Ie;
  for (var i = r.first; i !== null; ) {
    var o = i.f, c = (o & (Nt | nr)) !== 0, h = c && (o & Ie) !== 0, d = h || (o & $e) !== 0 || f(this, Pt).has(i);
    if (!d && i.fn !== null) {
      c ? i.f ^= Ie : (o & qr) !== 0 ? t.push(i) : bn(i) && ((o & At) !== 0 && f(this, Et).add(i), $r(i));
      var _ = i.first;
      if (_ !== null) {
        i = _;
        continue;
      }
    }
    for (; i !== null; ) {
      var b = i.next;
      if (b !== null) {
        i = b;
        break;
      }
      i = i.parent;
    }
  }
}, ro = function() {
  for (var r = f(this, Jt); r !== null; ) {
    if (!r.is_fork) {
      for (const [t, [, a]] of this.current)
        if (r.current.has(t) && !a)
          return r;
    }
    r = f(r, Jt);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
no = function(r) {
  var a;
  for (const [i, o] of r.current)
    !this.previous.has(i) && r.previous.has(i) && this.previous.set(i, r.previous.get(i)), this.current.set(i, o);
  for (const [i, o] of r.async_deriveds) {
    const c = this.async_deriveds.get(i);
    c && o.promise.then(c.resolve).catch(c.reject);
  }
  this.transfer_effects(f(r, Ut), f(r, Et));
  const t = (i) => {
    var o = i.reactions;
    if (o !== null)
      for (const d of o) {
        var c = d.f;
        if ((c & Be) !== 0)
          t(
            /** @type {Derived} */
            d
          );
        else {
          var h = (
            /** @type {Effect} */
            d
          );
          c & (Ir | At) && !this.async_deriveds.has(h) && (f(this, Et).delete(h), Ae(h, Ve), this.schedule(h));
        }
      }
  };
  for (const i of this.current.keys())
    t(i);
  this.oncommit(() => r.discard()), se(a = r, de, sn).call(a), U = this, se(this, de, on).call(this);
}, /**
 * @param {Effect[]} effects
 */
Lr = function(r) {
  for (var t = 0; t < r.length; t += 1)
    to(r[t], f(this, Ut), f(this, Et));
}, il = function() {
  var b;
  for (let y = ha; y !== null; y = f(y, gr)) {
    var r = y.id < this.id, t = [];
    for (const [x, [E, C]] of this.current) {
      if (y.current.has(x)) {
        var a = (
          /** @type {[any, boolean]} */
          y.current.get(x)[0]
        );
        if (r && E !== a)
          y.current.set(x, [E, C]);
        else
          continue;
      }
      t.push(x);
    }
    if (r)
      for (const [x, E] of this.async_deriveds) {
        const C = y.async_deriveds.get(x);
        C && E.promise.then(C.resolve).catch(C.reject);
      }
    if (f(y, Pr)) {
      var i = [...y.current.keys()].filter(
        (x) => !/** @type {[any, boolean]} */
        y.current.get(x)[1] && !this.current.has(x)
      );
      if (i.length === 0)
        r && y.discard();
      else if (t.length > 0) {
        if (r)
          for (const x of f(this, Br))
            y.unskip_effect(x, (E) => {
              var C;
              (E.f & (At | Ir)) !== 0 ? y.schedule(E) : se(C = y, de, Lr).call(C, [E]);
            });
        y.activate();
        var o = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
        for (var h of t)
          ao(h, i, o, c);
        c = /* @__PURE__ */ new Map();
        var d = [...y.current].filter(([x, E]) => {
          const C = this.current.get(x);
          return C ? C[0] !== E[0] || C[1] !== E[1] : !0;
        }).map(([x]) => x);
        if (d.length > 0)
          for (const x of f(this, pn))
            (x.f & (Ct | $e | jn)) === 0 && Ba(x, d, c) && ((x.f & (Ir | At)) !== 0 ? (Ae(x, Ve), y.schedule(x)) : f(y, Ut).add(x));
        if (f(y, Xe).length > 0 && !f(y, _r)) {
          y.apply();
          for (var _ of f(y, Xe))
            se(b = y, de, Ta).call(b, _, [], []);
          B(y, Xe, []);
        }
        y.deactivate();
      }
    }
  }
}, sn = function() {
  if (this.linked) {
    var r = f(this, Jt), t = f(this, gr);
    r === null ? ha = t : B(r, gr, t), t === null ? Nr = r : B(t, Jt, r), this.linked = !1;
  }
};
let Sr = Un;
function ol(e) {
  var r = dn;
  dn = !0;
  try {
    for (var t; ; ) {
      if (rl(), U === null)
        return (
          /** @type {T} */
          t
        );
      U.flush();
    }
  } finally {
    dn = r;
  }
}
function sl() {
  try {
    Bs();
  } catch (e) {
    Qt(e, Sa);
  }
}
let qt = null;
function Ai(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var a = e[t++];
      if ((a.f & (Ct | $e)) === 0 && bn(a) && (qt = /* @__PURE__ */ new Set(), $r(a), a.deps === null && a.first === null && a.nodes === null && a.teardown === null && a.ac === null && bo(a), qt?.size > 0)) {
        br.clear();
        for (const i of qt) {
          if ((i.f & (Ct | $e)) !== 0) continue;
          const o = [i];
          let c = i.parent;
          for (; c !== null; )
            qt.has(c) && (qt.delete(c), o.push(c)), c = c.parent;
          for (let h = o.length - 1; h >= 0; h--) {
            const d = o[h];
            (d.f & (Ct | $e)) === 0 && $r(d);
          }
        }
        qt.clear();
      }
    }
    qt = null;
  }
}
function ao(e, r, t, a) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & Be) !== 0 ? ao(
        /** @type {Derived} */
        i,
        r,
        t,
        a
      ) : (o & (Ir | At)) !== 0 && (o & Ve) === 0 && Ba(i, r, a) && (Ae(i, Ve), Ha(
        /** @type {Effect} */
        i
      ));
    }
}
function Ba(e, r, t) {
  const a = t.get(e);
  if (a !== void 0) return a;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (Fn.call(r, i))
        return !0;
      if ((i.f & Be) !== 0 && Ba(
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
function Ha(e) {
  U.schedule(e);
}
function io(e, r) {
  if (!((e.f & Nt) !== 0 && (e.f & Ie) !== 0)) {
    (e.f & Ve) !== 0 ? r.d.push(e) : (e.f & Vt) !== 0 && r.m.push(e), Ae(e, Ie);
    for (var t = e.first; t !== null; )
      io(t, r), t = t.next;
  }
}
function oo(e) {
  Ae(e, Ie);
  for (var r = e.first; r !== null; )
    oo(r), r = r.next;
}
function ll(e) {
  let r = 0, t = Ar(0), a;
  return () => {
    Ua() && (n(t), yo(() => (r === 0 && (a = Ka(() => e(() => cn(t)))), r += 1, () => {
      tr(() => {
        r -= 1, r === 0 && (a?.(), a = void 0, cn(t));
      });
    })));
  };
}
var ul = zr | Kr;
function fl(e, r, t, a) {
  new dl(e, r, t, a);
}
var ht, Pa, pt, xr, Je, gt, Ye, at, Wt, yr, Zt, Hr, gn, _n, Yt, Wn, Te, cl, vl, hl, Ma, In, Pn, Ca, Na;
class dl {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, a, i) {
    z(this, Te);
    /** @type {Boundary | null} */
    rt(this, "parent");
    rt(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    rt(this, "transform_error");
    /** @type {TemplateNode} */
    z(this, ht);
    /** @type {TemplateNode | null} */
    z(this, Pa, null);
    /** @type {BoundaryProps} */
    z(this, pt);
    /** @type {((anchor: Node) => void)} */
    z(this, xr);
    /** @type {Effect} */
    z(this, Je);
    /** @type {Effect | null} */
    z(this, gt, null);
    /** @type {Effect | null} */
    z(this, Ye, null);
    /** @type {Effect | null} */
    z(this, at, null);
    /** @type {DocumentFragment | null} */
    z(this, Wt, null);
    z(this, yr, 0);
    z(this, Zt, 0);
    z(this, Hr, !1);
    /** @type {Set<Effect>} */
    z(this, gn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    z(this, _n, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    z(this, Yt, null);
    z(this, Wn, ll(() => (B(this, Yt, Ar(f(this, yr))), () => {
      B(this, Yt, null);
    })));
    B(this, ht, r), B(this, pt, t), B(this, xr, (o) => {
      var c = (
        /** @type {Effect} */
        ne
      );
      c.b = this, c.f |= ka, a(o);
    }), this.parent = /** @type {Effect} */
    ne.b, this.transform_error = i ?? this.parent?.transform_error ?? ((o) => o), B(this, Je, Ya(() => {
      se(this, Te, Ma).call(this);
    }, ul));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    to(r, f(this, gn), f(this, _n));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!f(this, pt).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    se(this, Te, Ca).call(this, r, t), B(this, yr, f(this, yr) + r), !(!f(this, Yt) || f(this, Hr)) && (B(this, Hr, !0), tr(() => {
      B(this, Hr, !1), f(this, Yt) && Wr(f(this, Yt), f(this, yr));
    }));
  }
  get_effect_pending() {
    return f(this, Wn).call(this), n(
      /** @type {Source<number>} */
      f(this, Yt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!f(this, pt).onerror && !f(this, pt).failed)
      throw r;
    U?.is_fork ? (f(this, gt) && U.skip_effect(f(this, gt)), f(this, Ye) && U.skip_effect(f(this, Ye)), f(this, at) && U.skip_effect(f(this, at)), U.oncommit(() => {
      se(this, Te, Na).call(this, r);
    })) : se(this, Te, Na).call(this, r);
  }
}
ht = new WeakMap(), Pa = new WeakMap(), pt = new WeakMap(), xr = new WeakMap(), Je = new WeakMap(), gt = new WeakMap(), Ye = new WeakMap(), at = new WeakMap(), Wt = new WeakMap(), yr = new WeakMap(), Zt = new WeakMap(), Hr = new WeakMap(), gn = new WeakMap(), _n = new WeakMap(), Yt = new WeakMap(), Wn = new WeakMap(), Te = new WeakSet(), cl = function() {
  try {
    B(this, gt, _t(() => f(this, xr).call(this, f(this, ht))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
vl = function(r) {
  const t = f(this, pt).failed;
  t && B(this, at, _t(() => {
    t(
      f(this, ht),
      () => r,
      () => () => {
      }
    );
  }));
}, hl = function() {
  const r = f(this, pt).pending;
  r && (this.is_pending = !0, B(this, Ye, _t(() => r(f(this, ht)))), tr(() => {
    var t = B(this, Wt, document.createDocumentFragment()), a = rr();
    t.append(a), B(this, gt, se(this, Te, Pn).call(this, () => _t(() => f(this, xr).call(this, a)))), f(this, Zt) === 0 && (f(this, ht).before(t), B(this, Wt, null), kr(
      /** @type {Effect} */
      f(this, Ye),
      () => {
        B(this, Ye, null);
      }
    ), se(this, Te, In).call(
      this,
      /** @type {Batch} */
      U
    ));
  }));
}, Ma = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), B(this, Zt, 0), B(this, yr, 0), B(this, gt, _t(() => {
      f(this, xr).call(this, f(this, ht));
    })), f(this, Zt) > 0) {
      var r = B(this, Wt, document.createDocumentFragment());
      Ga(f(this, gt), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        f(this, pt).pending
      );
      B(this, Ye, _t(() => t(f(this, ht))));
    } else
      se(this, Te, In).call(
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
In = function(r) {
  this.is_pending = !1, r.transfer_effects(f(this, gn), f(this, _n));
}, /**
 * @template T
 * @param {() => T} fn
 */
Pn = function(r) {
  var t = ne, a = X, i = Ge;
  Bt(f(this, Je)), yt(f(this, Je)), Ur(f(this, Je).ctx);
  try {
    return Sr.ensure(), r();
  } catch (o) {
    return Qi(o), null;
  } finally {
    Bt(t), yt(a), Ur(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Ca = function(r, t) {
  var a;
  if (!this.has_pending_snippet()) {
    this.parent && se(a = this.parent, Te, Ca).call(a, r, t);
    return;
  }
  B(this, Zt, f(this, Zt) + r), f(this, Zt) === 0 && (se(this, Te, In).call(this, t), f(this, Ye) && kr(f(this, Ye), () => {
    B(this, Ye, null);
  }), f(this, Wt) && (f(this, ht).before(f(this, Wt)), B(this, Wt, null)));
}, /**
 * @param {unknown} error
 */
Na = function(r) {
  f(this, gt) && (Qe(f(this, gt)), B(this, gt, null)), f(this, Ye) && (Qe(f(this, Ye)), B(this, Ye, null)), f(this, at) && (Qe(f(this, at)), B(this, at, null));
  var t = f(this, pt).onerror;
  let a = f(this, pt).failed;
  var i = !1, o = !1;
  const c = () => {
    if (i) {
      el();
      return;
    }
    i = !0, o && Us(), f(this, at) !== null && kr(f(this, at), () => {
      B(this, at, null);
    }), se(this, Te, Pn).call(this, () => {
      se(this, Te, Ma).call(this);
    });
  }, h = (d) => {
    try {
      o = !0, t?.(d, c), o = !1;
    } catch (_) {
      Qt(_, f(this, Je) && f(this, Je).parent);
    }
    a && B(this, at, se(this, Te, Pn).call(this, () => {
      try {
        return _t(() => {
          var _ = (
            /** @type {Effect} */
            ne
          );
          _.b = this, _.f |= ka, a(
            f(this, ht),
            () => d,
            () => c
          );
        });
      } catch (_) {
        return Qt(
          _,
          /** @type {Effect} */
          f(this, Je).parent
        ), null;
      }
    }));
  };
  tr(() => {
    var d;
    try {
      d = this.transform_error(r);
    } catch (_) {
      Qt(_, f(this, Je) && f(this, Je).parent);
      return;
    }
    d !== null && typeof d == "object" && typeof /** @type {any} */
    d.then == "function" ? d.then(
      h,
      /** @param {unknown} e */
      (_) => Qt(_, f(this, Je) && f(this, Je).parent)
    ) : h(d);
  });
};
function pl(e, r, t, a) {
  const i = qa;
  var o = e.filter((x) => !x.settled);
  if (t.length === 0 && o.length === 0) {
    a(r.map(i));
    return;
  }
  var c = (
    /** @type {Effect} */
    ne
  ), h = gl(), d = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((x) => x.promise)) : null;
  function _(x) {
    if ((c.f & Ct) === 0) {
      h();
      try {
        a(x);
      } catch (E) {
        Qt(E, c);
      }
      Bn();
    }
  }
  var b = so();
  if (t.length === 0) {
    d.then(() => _(r.map(i))).finally(b);
    return;
  }
  function y() {
    Promise.all(t.map((x) => /* @__PURE__ */ _l(x))).then((x) => _([...r.map(i), ...x])).catch((x) => Qt(x, c)).finally(b);
  }
  d ? d.then(() => {
    h(), y(), Bn();
  }) : y();
}
function gl() {
  var e = (
    /** @type {Effect} */
    ne
  ), r = X, t = Ge, a = (
    /** @type {Batch} */
    U
  );
  return function(o = !0) {
    Bt(e), yt(r), Ur(t), o && (e.f & Ct) === 0 && (a?.activate(), a?.apply());
  };
}
function Bn(e = !0) {
  Bt(null), yt(null), Ur(null), e && U?.deactivate();
}
function so() {
  var e = (
    /** @type {Effect} */
    ne
  ), r = e.b, t = (
    /** @type {Batch} */
    U
  ), a = !!r?.is_rendered();
  return r?.update_pending_count(1, t), t.increment(a, e), () => {
    r?.update_pending_count(-1, t), t.decrement(a, e);
  };
}
// @__NO_SIDE_EFFECTS__
function qa(e) {
  var r = Be | Ve;
  return ne !== null && (ne.f |= Kr), {
    ctx: Ge,
    deps: null,
    effects: null,
    equals: Ki,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Re
    ),
    wv: 0,
    parent: ne,
    ac: null
  };
}
const Tn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function _l(e, r, t) {
  let a = (
    /** @type {Effect | null} */
    ne
  );
  a === null && Ps();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = Ar(
    /** @type {V} */
    Re
  ), c = !X, h = /* @__PURE__ */ new Set();
  return Rl(() => {
    var d = (
      /** @type {Effect} */
      ne
    ), _ = Yi();
    i = _.promise;
    try {
      Promise.resolve(e()).then(_.resolve, (E) => {
        E !== Kn && _.reject(E);
      }).finally(Bn);
    } catch (E) {
      _.reject(E), Bn();
    }
    var b = (
      /** @type {Batch} */
      U
    );
    if (c) {
      if ((d.f & Gr) !== 0)
        var y = so();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        a.b?.is_rendered()
      )
        b.async_deriveds.get(d)?.reject(Tn);
      else
        for (const E of h.values())
          E.reject(Tn);
      h.add(_), b.async_deriveds.set(d, _);
    }
    const x = (E, C = void 0) => {
      y?.(), h.delete(_), C !== Tn && (b.activate(), C ? (o.f |= er, Wr(o, C)) : ((o.f & er) !== 0 && (o.f ^= er), Wr(o, E)), b.deactivate());
    };
    _.promise.then(x, (E) => x(null, E || "unknown"));
  }), Wa(() => {
    for (const d of h)
      d.reject(Tn);
  }), new Promise((d) => {
    function _(b) {
      function y() {
        b === i ? d(o) : _(i);
      }
      b.then(y, y);
    }
    _(i);
  });
}
// @__NO_SIDE_EFFECTS__
function le(e) {
  const r = /* @__PURE__ */ qa(e);
  return Eo(r), r;
}
// @__NO_SIDE_EFFECTS__
function xl(e) {
  const r = /* @__PURE__ */ qa(e);
  return r.equals = Xi, r;
}
function yl(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      Qe(
        /** @type {Effect} */
        r[t]
      );
  }
}
function za(e) {
  var r, t = ne, a = e.parent;
  if (!ar && a !== null && e.v !== Re && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (a.f & (Ct | $e)) !== 0)
    return Zs(), e.v;
  Bt(a);
  try {
    e.f &= ~Er, yl(e), r = Mo(e);
  } finally {
    Bt(t);
  }
  return r;
}
function lo(e) {
  var r = za(e);
  if (!e.equals(r) && (e.wv = Ao(), (!U?.is_fork || e.deps === null) && (U !== null ? (U.capture(e, r, !0), Ea?.capture(e, r, !0)) : e.v = r, e.deps === null))) {
    Ae(e, Ie);
    return;
  }
  ar || (Tt !== null ? (Ua() || U?.is_fork) && Tt.set(e, r) : Va(e));
}
function ml(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(Kn), r.fn !== null && (r.teardown = Ms), r.ac = null, hn(r, 0), $a(r));
}
function uo(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && r.fn !== null && $r(r);
}
let Hn = /* @__PURE__ */ new Set();
const br = /* @__PURE__ */ new Map();
let fo = !1;
function Ar(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Ki,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function Y(e, r) {
  const t = Ar(e);
  return Eo(t), t;
}
// @__NO_SIDE_EFFECTS__
function bl(e, r = !1, t = !0) {
  const a = Ar(e);
  return r || (a.equals = Xi), a;
}
function S(e, r, t = !1) {
  X !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Mt || (X.f & jn) !== 0) && Ji() && (X.f & (Be | At | Ir | jn)) !== 0 && (jt === null || !jt.has(e)) && zs();
  let a = t ? ot(r) : r;
  return Wr(e, a, Rn);
}
function Wr(e, r, t = null) {
  if (!e.equals(r)) {
    br.set(e, ar ? r : e.v);
    var a = Sr.ensure();
    if (a.capture(e, r), (e.f & Be) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & Ve) !== 0 && za(i), Tt === null && Va(i);
    }
    e.wv = Ao(), co(e, Ve, t), ne !== null && (ne.f & Ie) !== 0 && (ne.f & (Nt | nr)) === 0 && (vt === null ? Ol([e]) : vt.push(e)), !a.is_fork && Hn.size > 0 && !fo && kl();
  }
  return r;
}
function kl() {
  fo = !1;
  for (const e of Hn) {
    (e.f & Ie) !== 0 && Ae(e, Vt);
    let r;
    try {
      r = bn(e);
    } catch {
      r = !0;
    }
    r && $r(e);
  }
  Hn.clear();
}
function cn(e) {
  S(e, e.v + 1);
}
function co(e, r, t) {
  var a = e.reactions;
  if (a !== null)
    for (var i = a.length, o = 0; o < i; o++) {
      var c = a[o], h = c.f, d = (h & Ve) === 0;
      if (d && Ae(c, r), (h & jn) !== 0)
        Hn.add(
          /** @type {Effect} */
          c
        );
      else if ((h & Be) !== 0) {
        var _ = (
          /** @type {Derived} */
          c
        );
        Tt?.delete(_), (h & Er) === 0 && (h & xt && (ne === null || (ne.f & Vn) === 0) && (c.f |= Er), co(_, Vt, t));
      } else if (d) {
        var b = (
          /** @type {Effect} */
          c
        );
        (h & At) !== 0 && qt !== null && qt.add(b), t !== null ? t.push(b) : Ha(b);
      }
    }
}
function ot(e) {
  if (typeof e != "object" || e === null || fn in e)
    return e;
  const r = Wi(e);
  if (r !== As && r !== Ts)
    return e;
  var t = /* @__PURE__ */ new Map(), a = Oa(e), i = /* @__PURE__ */ Y(0), o = wr, c = (h) => {
    if (wr === o)
      return h();
    var d = X, _ = wr;
    yt(null), Di(o);
    var b = h();
    return yt(d), Di(_), b;
  };
  return a && t.set("length", /* @__PURE__ */ Y(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(h, d, _) {
        (!("value" in _) || _.configurable === !1 || _.enumerable === !1 || _.writable === !1) && Hs();
        var b = t.get(d);
        return b === void 0 ? c(() => {
          var y = /* @__PURE__ */ Y(_.value);
          return t.set(d, y), y;
        }) : S(b, _.value, !0), !0;
      },
      deleteProperty(h, d) {
        var _ = t.get(d);
        if (_ === void 0) {
          if (d in h) {
            const b = c(() => /* @__PURE__ */ Y(Re));
            t.set(d, b), cn(i);
          }
        } else
          S(_, Re), cn(i);
        return !0;
      },
      get(h, d, _) {
        if (d === fn)
          return e;
        var b = t.get(d), y = d in h;
        if (b === void 0 && (!y || un(h, d)?.writable) && (b = c(() => {
          var E = ot(y ? h[d] : Re), C = /* @__PURE__ */ Y(E);
          return C;
        }), t.set(d, b)), b !== void 0) {
          var x = n(b);
          return x === Re ? void 0 : x;
        }
        return Reflect.get(h, d, _);
      },
      getOwnPropertyDescriptor(h, d) {
        var _ = Reflect.getOwnPropertyDescriptor(h, d);
        if (_ && "value" in _) {
          var b = t.get(d);
          b && (_.value = n(b));
        } else if (_ === void 0) {
          var y = t.get(d), x = y?.v;
          if (y !== void 0 && x !== Re)
            return {
              enumerable: !0,
              configurable: !0,
              value: x,
              writable: !0
            };
        }
        return _;
      },
      has(h, d) {
        if (d === fn)
          return !0;
        var _ = t.get(d), b = _ !== void 0 && _.v !== Re || Reflect.has(h, d);
        if (_ !== void 0 || ne !== null && (!b || un(h, d)?.writable)) {
          _ === void 0 && (_ = c(() => {
            var x = b ? ot(h[d]) : Re, E = /* @__PURE__ */ Y(x);
            return E;
          }), t.set(d, _));
          var y = n(_);
          if (y === Re)
            return !1;
        }
        return b;
      },
      set(h, d, _, b) {
        var y = t.get(d), x = d in h;
        if (a && d === "length")
          for (var E = _; E < /** @type {Source<number>} */
          y.v; E += 1) {
            var C = t.get(E + "");
            C !== void 0 ? S(C, Re) : E in h && (C = c(() => /* @__PURE__ */ Y(Re)), t.set(E + "", C));
          }
        if (y === void 0)
          (!x || un(h, d)?.writable) && (y = c(() => /* @__PURE__ */ Y(void 0)), S(y, ot(_)), t.set(d, y));
        else {
          x = y.v !== Re;
          var K = c(() => ot(_));
          S(y, K);
        }
        var A = Reflect.getOwnPropertyDescriptor(h, d);
        if (A?.set && A.set.call(b, _), !x) {
          if (a && typeof d == "string") {
            var ee = (
              /** @type {Source<number>} */
              t.get("length")
            ), pe = Number(d);
            Number.isInteger(pe) && pe >= ee.v && S(ee, pe + 1);
          }
          cn(i);
        }
        return !0;
      },
      ownKeys(h) {
        n(i);
        var d = Reflect.ownKeys(h).filter((y) => {
          var x = t.get(y);
          return x === void 0 || x.v !== Re;
        });
        for (var [_, b] of t)
          b.v !== Re && !(_ in h) && d.push(_);
        return d;
      },
      setPrototypeOf() {
        qs();
      }
    }
  );
}
function Ti(e) {
  try {
    if (e !== null && typeof e == "object" && fn in e)
      return e[fn];
  } catch {
  }
  return e;
}
function wl(e, r) {
  return Object.is(Ti(e), Ti(r));
}
var Mi, vo, ho, po;
function El() {
  if (Mi === void 0) {
    Mi = window, vo = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    ho = un(r, "firstChild").get, po = un(r, "nextSibling").get, wi(e) && (e[wa] = void 0, e[Dn] = null, e[Rs] = void 0, e.__e = void 0), wi(t) && (t[an] = void 0);
  }
}
function rr(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Yr(e) {
  return (
    /** @type {TemplateNode | null} */
    ho.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function mn(e) {
  return (
    /** @type {TemplateNode | null} */
    po.call(e)
  );
}
function g(e, r) {
  return /* @__PURE__ */ Yr(e);
}
function rn(e, r = !1) {
  {
    var t = /* @__PURE__ */ Yr(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ mn(t) : t;
  }
}
function m(e, r = 1, t = !1) {
  let a = e;
  for (; r--; )
    a = /** @type {TemplateNode} */
    /* @__PURE__ */ mn(a);
  return a;
}
function Sl(e) {
  e.textContent = "";
}
function go() {
  return !1;
}
function Al(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    t ? document.createElement(e, { is: t }) : document.createElement(e)
  );
}
let Ci = !1;
function Tl() {
  Ci || (Ci = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const r of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            r[Ln]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function Xn(e) {
  var r = X, t = ne;
  yt(null), Bt(null);
  try {
    return e();
  } finally {
    yt(r), Bt(t);
  }
}
function _o(e, r, t, a = t) {
  e.addEventListener(r, () => Xn(t));
  const i = (
    /** @type {any} */
    e[Ln]
  );
  i ? e[Ln] = () => {
    i(), a(!0);
  } : e[Ln] = () => a(!0), Tl();
}
function Ml(e) {
  ne === null && (X === null && Vs(), js()), ar && Fs();
}
function Cl(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function $t(e, r) {
  var t = ne;
  t !== null && (t.f & $e) !== 0 && (e |= $e);
  var a = {
    ctx: Ge,
    deps: null,
    nodes: null,
    f: e | Ve | xt,
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
  if ((e & qr) !== 0)
    Rr !== null ? Rr.push(a) : Sr.ensure().schedule(a);
  else if (r !== null) {
    try {
      $r(a);
    } catch (c) {
      throw Qe(a), c;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Kr) === 0 && (i = i.first, (e & At) !== 0 && (e & zr) !== 0 && i !== null && (i.f |= zr));
  }
  if (i !== null && (i.parent = t, t !== null && Cl(i, t), X !== null && (X.f & Be) !== 0 && (e & nr) === 0)) {
    var o = (
      /** @type {Derived} */
      X
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return a;
}
function Ua() {
  return X !== null && !Mt;
}
function Wa(e) {
  const r = $t(Gn, null);
  return Ae(r, Ie), r.teardown = e, r;
}
function Nl(e) {
  Ml();
  var r = (
    /** @type {Effect} */
    ne.f
  ), t = !X && (r & Nt) !== 0 && Ge !== null && !Ge.i;
  if (t) {
    var a = (
      /** @type {ComponentContext} */
      Ge
    );
    (a.e ?? (a.e = [])).push(e);
  } else
    return xo(e);
}
function xo(e) {
  return $t(qr | Ls, e);
}
function Dl(e) {
  Sr.ensure();
  const r = $t(nr | Kr, e);
  return (t = {}) => new Promise((a) => {
    t.outro ? kr(r, () => {
      Qe(r), a(void 0);
    }) : (Qe(r), a(void 0));
  });
}
function Ll(e) {
  return $t(qr, e);
}
function Rl(e) {
  return $t(Ir | Kr, e);
}
function yo(e, r = 0) {
  return $t(Gn | r, e);
}
function D(e, r = [], t = [], a = []) {
  pl(a, r, t, (i) => {
    $t(Gn, () => e(...i.map(n)));
  });
}
function Ya(e, r = 0) {
  var t = $t(At | r, e);
  return t;
}
function _t(e) {
  return $t(Nt | Kr, e);
}
function mo(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = ar, a = X;
    Ni(!0), yt(null);
    try {
      r.call(null);
    } finally {
      Ni(t), yt(a);
    }
  }
}
function $a(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const i = t.ac;
    i !== null && Xn(() => {
      i.abort(Kn);
    });
    var a = t.next;
    (t.f & nr) !== 0 ? t.parent = null : Qe(t, r), t = a;
  }
}
function Il(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & Nt) === 0 && Qe(r), r = t;
  }
}
function Qe(e, r = !0) {
  var t = !1;
  (r || (e.f & Ds) !== 0) && e.nodes !== null && e.nodes.end !== null && (Pl(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), Ae(e, Ei), $a(e, r && !t), hn(e, 0);
  var a = e.nodes && e.nodes.t;
  if (a !== null)
    for (const o of a)
      o.stop();
  mo(e), e.f ^= Ei, e.f |= Ct;
  var i = e.parent;
  i !== null && i.first !== null && bo(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Pl(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ mn(e);
    e.remove(), e = t;
  }
}
function bo(e) {
  var r = e.parent, t = e.prev, a = e.next;
  t !== null && (t.next = a), a !== null && (a.prev = t), r !== null && (r.first === e && (r.first = a), r.last === e && (r.last = t));
}
function kr(e, r, t = !0) {
  var a = [];
  ko(e, a, !0);
  var i = () => {
    t && Qe(e), r && r();
  }, o = a.length;
  if (o > 0) {
    var c = () => --o || i();
    for (var h of a)
      h.out(c);
  } else
    i();
}
function ko(e, r, t) {
  if ((e.f & $e) === 0) {
    e.f ^= $e;
    var a = e.nodes && e.nodes.t;
    if (a !== null)
      for (const h of a)
        (h.is_global || t) && r.push(h);
    for (var i = e.first; i !== null; ) {
      var o = i.next;
      if ((i.f & nr) === 0) {
        var c = (i.f & zr) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (i.f & Nt) !== 0 && (e.f & At) !== 0;
        ko(i, r, c ? t : !1);
      }
      i = o;
    }
  }
}
function qn(e) {
  wo(e, !0);
}
function wo(e, r) {
  if ((e.f & $e) !== 0) {
    e.f ^= $e, (e.f & Ie) === 0 && (Ae(e, Ve), Sr.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var a = t.next, i = (t.f & zr) !== 0 || (t.f & Nt) !== 0;
      wo(t, i ? r : !1), t = a;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const c of o)
        (c.is_global || r) && c.in();
  }
}
function Ga(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, a = e.nodes.end; t !== null; ) {
      var i = t === a ? null : /* @__PURE__ */ mn(t);
      r.append(t), t = i;
    }
}
let On = !1, ar = !1;
function Ni(e) {
  ar = e;
}
let X = null, Mt = !1;
function yt(e) {
  X = e;
}
let ne = null;
function Bt(e) {
  ne = e;
}
let jt = null;
function Eo(e) {
  X !== null && (jt ?? (jt = /* @__PURE__ */ new Set())).add(e);
}
let Ze = null, nt = 0, vt = null;
function Ol(e) {
  vt = e;
}
let So = 1, hr = 0, wr = hr;
function Di(e) {
  wr = e;
}
function Ao() {
  return ++So;
}
function bn(e) {
  var r = e.f;
  if ((r & Ve) !== 0)
    return !0;
  if (r & Be && (e.f &= ~Er), (r & Vt) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), a = t.length, i = 0; i < a; i++) {
      var o = t[i];
      if (bn(
        /** @type {Derived} */
        o
      ) && lo(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & xt) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Tt === null && Ae(e, Ie);
  }
  return !1;
}
function To(e, r, t = !0) {
  var a = e.reactions;
  if (a !== null && !(jt !== null && jt.has(e)))
    for (var i = 0; i < a.length; i++) {
      var o = a[i];
      (o.f & Be) !== 0 ? To(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? Ae(o, Ve) : (o.f & Ie) !== 0 && Ae(o, Vt), Ha(
        /** @type {Effect} */
        o
      ));
    }
}
function Mo(e) {
  var K;
  var r = Ze, t = nt, a = vt, i = X, o = jt, c = Ge, h = Mt, d = wr, _ = e.f;
  Ze = /** @type {null | Value[]} */
  null, nt = 0, vt = null, X = (_ & (Nt | nr)) === 0 ? e : null, jt = null, Ur(e.ctx), Mt = !1, wr = ++hr, e.ac !== null && (Xn(() => {
    e.ac.abort(Kn);
  }), e.ac = null);
  try {
    e.f |= Vn;
    var b = (
      /** @type {Function} */
      e.fn
    ), y = b();
    e.f |= Gr;
    var x = e.deps, E = U?.is_fork;
    if (Ze !== null) {
      var C;
      if (E || hn(e, nt), x !== null && nt > 0)
        for (x.length = nt + Ze.length, C = 0; C < Ze.length; C++)
          x[nt + C] = Ze[C];
      else
        e.deps = x = Ze;
      if (Ua() && (e.f & xt) !== 0)
        for (C = nt; C < x.length; C++)
          ((K = x[C]).reactions ?? (K.reactions = [])).push(e);
    } else !E && x !== null && nt < x.length && (hn(e, nt), x.length = nt);
    if (Ji() && vt !== null && !Mt && x !== null && (e.f & (Be | Vt | Ve)) === 0)
      for (C = 0; C < /** @type {Source[]} */
      vt.length; C++)
        To(
          vt[C],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (hr++, i.deps !== null)
        for (let A = 0; A < t; A += 1)
          i.deps[A].rv = hr;
      if (r !== null)
        for (const A of r)
          A.rv = hr;
      vt !== null && (a === null ? a = vt : a.push(.../** @type {Source[]} */
      vt));
    }
    return (e.f & er) !== 0 && (e.f ^= er), y;
  } catch (A) {
    return Qi(A);
  } finally {
    e.f ^= Vn, Ze = r, nt = t, vt = a, X = i, jt = o, Ur(c), Mt = h, wr = d;
  }
}
function Fl(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var a = ws.call(t, e);
    if (a !== -1) {
      var i = t.length - 1;
      i === 0 ? t = r.reactions = null : (t[a] = t[i], t.pop());
    }
  }
  if (t === null && (r.f & Be) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Ze === null || !Fn.call(Ze, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & xt) !== 0 && (o.f ^= xt, o.f &= ~Er), o.v !== Re && Va(o), ml(o), hn(o, 0);
  }
}
function hn(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var a = r; a < t.length; a++)
      Fl(e, t[a]);
}
function $r(e) {
  var r = e.f;
  if ((r & Ct) === 0) {
    Ae(e, Ie);
    var t = ne, a = On;
    ne = e, On = !0;
    try {
      (r & (At | $i)) !== 0 ? Il(e) : $a(e), mo(e);
      var i = Mo(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = So;
      var o;
    } finally {
      On = a, ne = t;
    }
  }
}
async function jl() {
  await Promise.resolve(), ol();
}
function n(e) {
  var r = e.f, t = (r & Be) !== 0;
  if (X !== null && !Mt) {
    var a = ne !== null && (ne.f & Ct) !== 0;
    if (!a && (jt === null || !jt.has(e))) {
      var i = X.deps;
      if ((X.f & Vn) !== 0)
        e.rv < hr && (e.rv = hr, Ze === null && i !== null && i[nt] === e ? nt++ : Ze === null ? Ze = [e] : Ze.push(e));
      else {
        X.deps ?? (X.deps = []), Fn.call(X.deps, e) || X.deps.push(e);
        var o = e.reactions;
        o === null ? e.reactions = [X] : Fn.call(o, X) || o.push(X);
      }
    }
  }
  if (ar && br.has(e))
    return br.get(e);
  if (t) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (ar) {
      var h = c.v;
      return ((c.f & Ie) === 0 && c.reactions !== null || No(c)) && (h = za(c)), br.set(c, h), h;
    }
    var d = (c.f & xt) === 0 && !Mt && X !== null && (On || (X.f & xt) !== 0), _ = (c.f & Gr) === 0;
    bn(c) && (d && (c.f |= xt), lo(c)), d && !_ && (uo(c), Co(c));
  }
  if (Tt?.has(e))
    return Tt.get(e);
  if ((e.f & er) !== 0)
    throw e.v;
  return e.v;
}
function Co(e) {
  if (e.f |= xt, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & Be) !== 0 && (r.f & xt) === 0 && (uo(
        /** @type {Derived} */
        r
      ), Co(
        /** @type {Derived} */
        r
      ));
}
function No(e) {
  if (e.v === Re) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (br.has(r) || (r.f & Be) !== 0 && No(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function Ka(e) {
  var r = Mt;
  try {
    return Mt = !0, e();
  } finally {
    Mt = r;
  }
}
const Vl = ["touchstart", "touchmove"];
function Bl(e) {
  return Vl.includes(e);
}
const pr = Symbol("events"), Do = /* @__PURE__ */ new Set(), Da = /* @__PURE__ */ new Set();
function Hl(e, r, t, a = {}) {
  function i(o) {
    if (a.capture || La.call(r, o), !o.cancelBubble)
      return Xn(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? tr(() => {
    r.addEventListener(e, i, a);
  }) : r.addEventListener(e, i, a), i;
}
function Li(e, r, t, a, i) {
  var o = { capture: a, passive: i }, c = Hl(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && Wa(() => {
    r.removeEventListener(e, c, o);
  });
}
function je(e, r, t) {
  (r[pr] ?? (r[pr] = {}))[e] = t;
}
function ql(e) {
  for (var r = 0; r < e.length; r++)
    Do.add(e[r]);
  for (var t of Da)
    t(e);
}
let Ri = null;
function La(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), a = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  Ri = e;
  var c = 0, h = Ri === e && e[pr];
  if (h) {
    var d = i.indexOf(h);
    if (d !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[pr] = r;
      return;
    }
    var _ = i.indexOf(r);
    if (_ === -1)
      return;
    d <= _ && (c = d);
  }
  if (o = /** @type {Element} */
  i[c] || e.target, o !== r) {
    Es(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var b = X, y = ne;
    yt(null), Bt(null);
    try {
      for (var x, E = []; o !== null && o !== r; ) {
        try {
          var C = o[pr]?.[a];
          C != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && C.call(o, e);
        } catch (K) {
          x ? E.push(K) : x = K;
        }
        if (e.cancelBubble) break;
        c++, o = c < i.length ? (
          /** @type {Element} */
          i[c]
        ) : null;
      }
      if (x) {
        for (let K of E)
          queueMicrotask(() => {
            throw K;
          });
        throw x;
      }
    } finally {
      e[pr] = r, delete e.currentTarget, yt(b), Bt(y);
    }
  }
}
const zl = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Ul(e) {
  return (
    /** @type {string} */
    zl?.createHTML(e) ?? e
  );
}
function Lo(e) {
  var r = Al("template");
  return r.innerHTML = Ul(e.replaceAll("<!>", "<!---->")), r.content;
}
function zn(e, r) {
  var t = (
    /** @type {Effect} */
    ne
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function P(e, r) {
  var t = (r & Ks) !== 0, a = (r & Xs) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = Lo(o ? e : "<!>" + e), t || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ Yr(i)));
    var c = (
      /** @type {TemplateNode} */
      a || vo ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (t) {
      var h = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Yr(c)
      ), d = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      zn(h, d);
    } else
      zn(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Wl(e, r, t = "svg") {
  var a = !e.startsWith("<!>"), i = `<${t}>${a ? e : "<!>" + e}</${t}>`, o;
  return () => {
    if (!o) {
      var c = (
        /** @type {DocumentFragment} */
        Lo(i)
      ), h = (
        /** @type {Element} */
        /* @__PURE__ */ Yr(c)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ Yr(h);
    }
    var d = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return zn(d, d), d;
  };
}
// @__NO_SIDE_EFFECTS__
function Xa(e, r) {
  return /* @__PURE__ */ Wl(e, r, "svg");
}
function Ii() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = rr();
  return e.append(r, t), zn(r, t), e;
}
function T(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function R(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== /** @type {any} */
  (e[an] ?? (e[an] = e.nodeValue)) && (e[an] = t, e.nodeValue = `${t}`);
}
function Yl(e, r) {
  return $l(e, r);
}
const Mn = /* @__PURE__ */ new Map();
function $l(e, { target: r, anchor: t, props: a = {}, events: i, context: o, intro: c = !0, transformError: h }) {
  El();
  var d = void 0, _ = Dl(() => {
    var b = t ?? r.appendChild(rr());
    fl(
      /** @type {TemplateNode} */
      b,
      {
        pending: () => {
        }
      },
      (E) => {
        Fa({});
        var C = (
          /** @type {ComponentContext} */
          Ge
        );
        o && (C.c = o), i && (a.$$events = i), d = e(E, a) || {}, ja();
      },
      h
    );
    var y = /* @__PURE__ */ new Set(), x = (E) => {
      for (var C = 0; C < E.length; C++) {
        var K = E[C];
        if (!y.has(K)) {
          y.add(K);
          var A = Bl(K);
          for (const ae of [r, document]) {
            var ee = Mn.get(ae);
            ee === void 0 && (ee = /* @__PURE__ */ new Map(), Mn.set(ae, ee));
            var pe = ee.get(K);
            pe === void 0 ? (ae.addEventListener(K, La, { passive: A }), ee.set(K, 1)) : ee.set(K, pe + 1);
          }
        }
      }
    };
    return x($n(Do)), Da.add(x), () => {
      for (var E of y)
        for (const A of [r, document]) {
          var C = (
            /** @type {Map<string, number>} */
            Mn.get(A)
          ), K = (
            /** @type {number} */
            C.get(E)
          );
          --K == 0 ? (A.removeEventListener(E, La), C.delete(E), C.size === 0 && Mn.delete(A)) : C.set(E, K);
        }
      Da.delete(x), b !== t && b.parentNode?.removeChild(b);
    };
  });
  return Ra.set(d, _), d;
}
let Ra = /* @__PURE__ */ new WeakMap();
function Gl(e, r) {
  const t = Ra.get(e);
  return t ? (Ra.delete(e), t(r)) : Promise.resolve();
}
var St, Ot, it, mr, xn, yn, Yn;
class Kl {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    rt(this, "anchor");
    /** @type {Map<Batch, Key>} */
    z(this, St, /* @__PURE__ */ new Map());
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
    z(this, Ot, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    z(this, it, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    z(this, mr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    z(this, xn, !0);
    /**
     * @param {Batch} batch
     */
    z(this, yn, (r) => {
      if (f(this, St).has(r)) {
        var t = (
          /** @type {Key} */
          f(this, St).get(r)
        ), a = f(this, Ot).get(t);
        if (a)
          qn(a), f(this, mr).delete(t);
        else {
          var i = f(this, it).get(t);
          i && (qn(i.effect), f(this, Ot).set(t, i.effect), f(this, it).delete(t), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), a = i.effect);
        }
        for (const [o, c] of f(this, St)) {
          if (f(this, St).delete(o), o === r)
            break;
          const h = f(this, it).get(c);
          h && (Qe(h.effect), f(this, it).delete(c));
        }
        for (const [o, c] of f(this, Ot)) {
          if (o === t || f(this, mr).has(o)) continue;
          const h = () => {
            if (Array.from(f(this, St).values()).includes(o)) {
              var _ = document.createDocumentFragment();
              Ga(c, _), _.append(rr()), f(this, it).set(o, { effect: c, fragment: _ });
            } else
              Qe(c);
            f(this, mr).delete(o), f(this, Ot).delete(o);
          };
          f(this, xn) || !a ? (f(this, mr).add(o), kr(c, h, !1)) : h();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    z(this, Yn, (r) => {
      f(this, St).delete(r);
      const t = Array.from(f(this, St).values());
      for (const [a, i] of f(this, it))
        t.includes(a) || (Qe(i.effect), f(this, it).delete(a));
    });
    this.anchor = r, B(this, xn, t);
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
    ), i = go();
    if (t && !f(this, Ot).has(r) && !f(this, it).has(r))
      if (i) {
        var o = document.createDocumentFragment(), c = rr();
        o.append(c), f(this, it).set(r, {
          effect: _t(() => t(c)),
          fragment: o
        });
      } else
        f(this, Ot).set(
          r,
          _t(() => t(this.anchor))
        );
    if (f(this, St).set(a, r), i) {
      for (const [h, d] of f(this, Ot))
        h === r ? a.unskip_effect(d) : a.skip_effect(d);
      for (const [h, d] of f(this, it))
        h === r ? a.unskip_effect(d.effect) : a.skip_effect(d.effect);
      a.oncommit(f(this, yn)), a.ondiscard(f(this, Yn));
    } else
      f(this, yn).call(this, a);
  }
}
St = new WeakMap(), Ot = new WeakMap(), it = new WeakMap(), mr = new WeakMap(), xn = new WeakMap(), yn = new WeakMap(), Yn = new WeakMap();
function Q(e, r, t = !1) {
  var a = new Kl(e), i = t ? zr : 0;
  function o(c, h) {
    a.ensure(c, h);
  }
  Ya(() => {
    var c = !1;
    r((h, d = 0) => {
      c = !0, o(d, h);
    }), c || o(-1, null);
  }, i);
}
function Pi(e, r) {
  return r;
}
function Xl(e, r, t) {
  for (var a = [], i = r.length, o, c = r.length, h = 0; h < i; h++) {
    let y = r[h];
    kr(
      y,
      () => {
        if (o) {
          if (o.pending.delete(y), o.done.add(y), o.pending.size === 0) {
            var x = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Ia(e, $n(o.done)), x.delete(o), x.size === 0 && (e.outrogroups = null);
          }
        } else
          c -= 1;
      },
      !1
    );
  }
  if (c === 0) {
    var d = a.length === 0 && t !== null;
    if (d) {
      var _ = (
        /** @type {Element} */
        t
      ), b = (
        /** @type {Element} */
        _.parentNode
      );
      Sl(b), b.append(_), e.items.clear();
    }
    Ia(e, r, !d);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function Ia(e, r, t = !0) {
  var a;
  if (e.pending.size > 0) {
    a = /* @__PURE__ */ new Set();
    for (const c of e.pending.values())
      for (const h of c)
        a.add(
          /** @type {EachItem} */
          e.items.get(h).e
        );
  }
  for (var i = 0; i < r.length; i++) {
    var o = r[i];
    if (a?.has(o)) {
      o.f |= Ft;
      const c = document.createDocumentFragment();
      Ga(o, c);
    } else
      Qe(r[i], t);
  }
}
var Oi;
function ct(e, r, t, a, i, o = null) {
  var c = e, h = /* @__PURE__ */ new Map(), d = (r & Gi) !== 0;
  if (d) {
    var _ = (
      /** @type {Element} */
      e
    );
    c = _.appendChild(rr());
  }
  var b = null, y = /* @__PURE__ */ xl(() => {
    var ae = t();
    return Oa(ae) ? ae : ae == null ? [] : $n(ae);
  }), x, E = /* @__PURE__ */ new Map(), C = !0;
  function K(ae) {
    (pe.effect.f & Ct) === 0 && (pe.pending.delete(ae), pe.fallback = b, Jl(pe, x, c, r, a), b !== null && (x.length === 0 ? (b.f & Ft) === 0 ? qn(b) : (b.f ^= Ft, ln(b, null, c)) : kr(b, () => {
      b = null;
    })));
  }
  function A(ae) {
    pe.pending.delete(ae);
  }
  var ee = Ya(() => {
    x = /** @type {V[]} */
    n(y);
    for (var ae = x.length, Fe = /* @__PURE__ */ new Set(), Le = (
      /** @type {Batch} */
      U
    ), Dt = go(), He = 0; He < ae; He += 1) {
      var we = x[He], st = a(we, He), Me = C ? null : h.get(st);
      Me ? (Me.v && Wr(Me.v, we), Me.i && Wr(Me.i, He), Dt && Le.unskip_effect(Me.e)) : (Me = Zl(
        h,
        C ? c : Oi ?? (Oi = rr()),
        we,
        st,
        He,
        i,
        r,
        t
      ), C || (Me.e.f |= Ft), h.set(st, Me)), Fe.add(st);
    }
    if (ae === 0 && o && !b && (C ? b = _t(() => o(c)) : (b = _t(() => o(Oi ?? (Oi = rr()))), b.f |= Ft)), ae > Fe.size && Os(), !C)
      if (E.set(Le, Fe), Dt) {
        for (const [Ht, lt] of h)
          Fe.has(Ht) || Le.skip_effect(lt.e);
        Le.oncommit(K), Le.ondiscard(A);
      } else
        K(Le);
    n(y);
  }), pe = { effect: ee, items: h, pending: E, outrogroups: null, fallback: b };
  C = !1;
}
function nn(e) {
  for (; e !== null && (e.f & Nt) === 0; )
    e = e.next;
  return e;
}
function Jl(e, r, t, a, i) {
  var o = (a & $s) !== 0, c = r.length, h = e.items, d = nn(e.effect.first), _, b = null, y, x = [], E = [], C, K, A, ee;
  if (o)
    for (ee = 0; ee < c; ee += 1)
      C = r[ee], K = i(C, ee), A = /** @type {EachItem} */
      h.get(K).e, (A.f & Ft) === 0 && (A.nodes?.a?.measure(), (y ?? (y = /* @__PURE__ */ new Set())).add(A));
  for (ee = 0; ee < c; ee += 1) {
    if (C = r[ee], K = i(C, ee), A = /** @type {EachItem} */
    h.get(K).e, e.outrogroups !== null)
      for (const Me of e.outrogroups)
        Me.pending.delete(A), Me.done.delete(A);
    if ((A.f & $e) !== 0 && (qn(A), o && (A.nodes?.a?.unfix(), (y ?? (y = /* @__PURE__ */ new Set())).delete(A))), (A.f & Ft) !== 0)
      if (A.f ^= Ft, A === d)
        ln(A, null, t);
      else {
        var pe = b ? b.next : d;
        A === e.effect.last && (e.effect.last = A.prev), A.prev && (A.prev.next = A.next), A.next && (A.next.prev = A.prev), Xt(e, b, A), Xt(e, A, pe), ln(A, pe, t), b = A, x = [], E = [], d = nn(b.next);
        continue;
      }
    if (A !== d) {
      if (_ !== void 0 && _.has(A)) {
        if (x.length < E.length) {
          var ae = E[0], Fe;
          b = ae.prev;
          var Le = x[0], Dt = x[x.length - 1];
          for (Fe = 0; Fe < x.length; Fe += 1)
            ln(x[Fe], ae, t);
          for (Fe = 0; Fe < E.length; Fe += 1)
            _.delete(E[Fe]);
          Xt(e, Le.prev, Dt.next), Xt(e, b, Le), Xt(e, Dt, ae), d = ae, b = Dt, ee -= 1, x = [], E = [];
        } else
          _.delete(A), ln(A, d, t), Xt(e, A.prev, A.next), Xt(e, A, b === null ? e.effect.first : b.next), Xt(e, b, A), b = A;
        continue;
      }
      for (x = [], E = []; d !== null && d !== A; )
        (_ ?? (_ = /* @__PURE__ */ new Set())).add(d), E.push(d), d = nn(d.next);
      if (d === null)
        continue;
    }
    (A.f & Ft) === 0 && x.push(A), b = A, d = nn(A.next);
  }
  if (e.outrogroups !== null) {
    for (const Me of e.outrogroups)
      Me.pending.size === 0 && (Ia(e, $n(Me.done)), e.outrogroups?.delete(Me));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (d !== null || _ !== void 0) {
    var He = [];
    if (_ !== void 0)
      for (A of _)
        (A.f & $e) === 0 && He.push(A);
    for (; d !== null; )
      (d.f & $e) === 0 && d !== e.fallback && He.push(d), d = nn(d.next);
    var we = He.length;
    if (we > 0) {
      var st = (a & Gi) !== 0 && c === 0 ? t : null;
      if (o) {
        for (ee = 0; ee < we; ee += 1)
          He[ee].nodes?.a?.measure();
        for (ee = 0; ee < we; ee += 1)
          He[ee].nodes?.a?.fix();
      }
      Xl(e, He, st);
    }
  }
  o && tr(() => {
    if (y !== void 0)
      for (A of y)
        A.nodes?.a?.apply();
  });
}
function Zl(e, r, t, a, i, o, c, h) {
  var d = (c & Ws) !== 0 ? (c & Gs) === 0 ? /* @__PURE__ */ bl(t, !1, !1) : Ar(t) : null, _ = (c & Ys) !== 0 ? Ar(i) : null;
  return {
    v: d,
    i: _,
    e: _t(() => (o(r, d ?? t, _ ?? i, h), () => {
      e.delete(a);
    }))
  };
}
function ln(e, r, t) {
  if (e.nodes)
    for (var a = e.nodes.start, i = e.nodes.end, o = r && (r.f & Ft) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; a !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ mn(a)
      );
      if (o.before(a), a === i)
        return;
      a = c;
    }
}
function Xt(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function Ro(e) {
  var r, t, a = "";
  if (typeof e == "string" || typeof e == "number") a += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var i = e.length;
    for (r = 0; r < i; r++) e[r] && (t = Ro(e[r])) && (a && (a += " "), a += t);
  } else for (t in e) e[t] && (a && (a += " "), a += t);
  return a;
}
function Ql() {
  for (var e, r, t = 0, a = "", i = arguments.length; t < i; t++) (e = arguments[t]) && (r = Ro(e)) && (a && (a += " "), a += r);
  return a;
}
function l(e) {
  return typeof e == "object" ? Ql(e) : e ?? "";
}
function eu(e, r, t) {
  var a = e == null ? "" : "" + e;
  return a === "" ? null : a;
}
function u(e, r, t, a, i, o) {
  var c = (
    /** @type {any} */
    e[wa]
  );
  if (c !== t || c === void 0) {
    var h = eu(t);
    h == null ? e.removeAttribute("class") : r ? e.className = h : e.setAttribute("class", h), e[wa] = t;
  }
  return o;
}
function Io(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!Oa(r))
      return Qs();
    for (var a of e.options)
      a.selected = r.includes(vn(a));
    return;
  }
  for (a of e.options) {
    var i = vn(a);
    if (wl(i, r)) {
      a.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function tu(e) {
  var r = new MutationObserver(() => {
    Io(e, e.__value);
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
  }), Wa(() => {
    r.disconnect();
  });
}
function Fi(e, r, t = r) {
  var a = /* @__PURE__ */ new WeakSet(), i = !0;
  _o(e, "change", (o) => {
    var c = o ? "[selected]" : ":checked", h;
    if (e.multiple)
      h = [].map.call(e.querySelectorAll(c), vn);
    else {
      var d = e.querySelector(c) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      h = d && vn(d);
    }
    t(h), e.__value = h, U !== null && a.add(U);
  }), Ll(() => {
    var o = r();
    if (e === document.activeElement) {
      var c = (
        /** @type {Batch} */
        U
      );
      if (a.has(c))
        return;
    }
    if (Io(e, o, i), i && o === void 0) {
      var h = e.querySelector(":checked");
      h !== null && (o = vn(h), t(o));
    }
    e.__value = o, i = !1;
  }), tu(e);
}
function vn(e) {
  return "__value" in e ? e.__value : e.value;
}
const ru = Symbol("is custom element"), nu = Symbol("is html");
function wt(e, r, t, a) {
  var i = au(e);
  i[r] !== (i[r] = t) && (t == null ? e.removeAttribute(r) : typeof t != "string" && iu(e).includes(r) ? e[r] = t : e.setAttribute(r, t));
}
function au(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[Dn] ?? (e[Dn] = {
      [ru]: e.nodeName.includes("-"),
      [nu]: e.namespaceURI === Js
    })
  );
}
var ji = /* @__PURE__ */ new Map();
function iu(e) {
  var r = e.getAttribute("is") || e.nodeName, t = ji.get(r);
  if (t) return t;
  ji.set(r, t = []);
  for (var a, i = e, o = Element.prototype; o !== i; ) {
    a = Ss(i);
    for (var c in a)
      a[c].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      c !== "innerHTML" && c !== "textContent" && c !== "innerText" && t.push(c);
    i = Wi(i);
  }
  return t;
}
function ga(e, r, t = r) {
  var a = /* @__PURE__ */ new WeakSet();
  _o(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = _a(e) ? xa(o) : o, t(o), U !== null && a.add(U), await jl(), o !== (o = r())) {
      var c = e.selectionStart, h = e.selectionEnd, d = e.value.length;
      if (e.value = o ?? "", h !== null) {
        var _ = e.value.length;
        c === h && h === d && _ > d ? (e.selectionStart = _, e.selectionEnd = _) : (e.selectionStart = c, e.selectionEnd = Math.min(h, _));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ka(r) == null && e.value && (t(_a(e) ? xa(e.value) : e.value), U !== null && a.add(U)), yo(() => {
    var i = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        U
      );
      if (a.has(o))
        return;
    }
    _a(e) && i === xa(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function _a(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function xa(e) {
  return e === "" ? null : +e;
}
function Vi(e, r, t, a) {
  var i = (
    /** @type {V} */
    a
  ), o = !0, c = () => (o && (o = !1, i = /** @type {V} */
  a), i), h;
  h = /** @type {V} */
  e[r], h === void 0 && a !== void 0 && (h = c());
  var d;
  return d = () => {
    var _ = (
      /** @type {V} */
      e[r]
    );
    return _ === void 0 ? c() : (o = !0, _);
  }, d;
}
function ou(e) {
  Ge === null && Is(), Nl(() => {
    const r = Ka(e);
    if (typeof r == "function") return (
      /** @type {() => void} */
      r
    );
  });
}
const su = "5";
var Ui;
typeof window < "u" && ((Ui = window.__svelte ?? (window.__svelte = {})).v ?? (Ui.v = /* @__PURE__ */ new Set())).add(su);
const lu = "See token balances and transfer history for your realm's treasury, send payments when allowed, and look up balances tied to members or invoices.";
var uu = /* @__PURE__ */ P('<p class="mt-2 text-xs text-gray-400 dark:text-gray-500 font-mono"> </p>'), fu = /* @__PURE__ */ P('<div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50"><svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path></svg> <div><h3 class="text-sm font-medium text-gray-700 dark:text-gray-300"> </h3> <p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> </p> <!></div></div>');
function du(e, r) {
  Fa(r, !0);
  const t = {
    title: "Additional permissions needed",
    body: "You need additional permissions to view this page."
  };
  let a = Vi(r, "operation", 3, ""), i = Vi(r, "t", 3, (E) => t[E] ?? E);
  var o = fu(), c = m(g(o), 2), h = g(c), d = g(h), _ = m(h, 2), b = g(_), y = m(_, 2);
  {
    var x = (E) => {
      var C = uu(), K = g(C);
      D(() => R(K, a())), T(E, C);
    };
    Q(y, (E) => {
      a() && E(x);
    });
  }
  D(
    (E, C) => {
      R(d, E), R(b, C);
    },
    [() => i()("title"), () => i()("body")]
  ), T(e, o), ja();
}
const Po = "(max-width: 720px)";
function cu() {
  return typeof window > "u" ? !1 : window.matchMedia(Po).matches;
}
function vu(e) {
  if (typeof window > "u") return () => {
  };
  const r = window.matchMedia(Po), t = () => e(r.matches);
  return t(), r.addEventListener("change", t), () => r.removeEventListener("change", t);
}
const Bi = (e) => {
  var r = gu();
  T(e, r);
}, hu = (e) => {
  var r = _u();
  T(e, r);
}, pu = (e) => {
  var r = xu();
  T(e, r);
};
var gu = /* @__PURE__ */ Xa('<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>'), _u = /* @__PURE__ */ Xa('<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4.93 4.93a10 10 0 0114.14 0M19.07 19.07a10 10 0 01-14.14 0"></path></svg>'), xu = /* @__PURE__ */ Xa('<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>'), yu = /* @__PURE__ */ P("<div><p>Treasury not visible to you</p> <p> </p></div>"), mu = /* @__PURE__ */ P("<div><p>Treasury unavailable</p> <p>The realm did not return its treasury just now. Use refresh to try again.</p></div>"), bu = /* @__PURE__ */ P('<div><div><div> </div> <div> </div></div> <div><div> </div> <button type="button">Send</button></div></div>'), ku = /* @__PURE__ */ P("<div><div></div> <p> </p></div>"), wu = /* @__PURE__ */ P("<div><p>No token configured</p> <p>This realm's treasury has no active token yet, so the vault holds no balance.</p></div>"), ya = /* @__PURE__ */ P("<span>Copied!</span>"), Eu = /* @__PURE__ */ P("<div><span>Last loaded:</span> <span> </span></div>"), Su = /* @__PURE__ */ P('<div><div> </div> <div> </div> <div> </div> <div> </div> <div><span>Ledger:</span> <button type="button"> </button> <!></div> <div><span>Indexer:</span> <button type="button"> </button> <!></div></div>'), Au = /* @__PURE__ */ P("<details><summary>Show details</summary> <pre> </pre></details>"), Tu = /* @__PURE__ */ P("<div><p> </p> <!></div>"), Cn = /* @__PURE__ */ P('<button type="button"> </button>'), Mu = /* @__PURE__ */ P('<button type="button" title="Admin" aria-label="Admin"><!> <span class="hidden sm:inline">Admin</span></button>'), Cu = /* @__PURE__ */ P("<div><div></div> <div></div> <div></div> <div></div> <div></div></div>"), ma = /* @__PURE__ */ P("<div></div>"), Nu = /* @__PURE__ */ P("<div><p>No activity to show</p> <p>Treasury activity is shown to members who may view the treasury.</p></div>"), Du = /* @__PURE__ */ P(`<div><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <p>No activity yet</p> <p>Payments into and out of the treasury's funds will appear here.</p></div>`), Nn = /* @__PURE__ */ P("<span> </span>"), Lu = /* @__PURE__ */ P("· <!>", 1), Ru = /* @__PURE__ */ P("<article><div><div><div> </div> <div> </div> <div> <!></div></div> <div><div> </div> <!></div></div></article>"), Hi = /* @__PURE__ */ P("<span>✓</span>"), qi = /* @__PURE__ */ P('<button type="button"> </button> <!>', 1), Iu = /* @__PURE__ */ P("<span>—</span>"), Pu = /* @__PURE__ */ P("<tr><td><!> <div> </div></td><td><span> </span></td><td><span> </span></td><td><div> </div> <!></td><td><span> </span></td></tr>"), Ou = /* @__PURE__ */ P("<div><table><thead><tr><th>When</th><th>Type</th><th>Fund</th><th>Details</th><th>Amount</th></tr></thead><tbody></tbody></table></div>"), Fu = /* @__PURE__ */ P("<span>…</span>"), ju = /* @__PURE__ */ P('<div><button type="button">Prev</button> <!> <button type="button">Next</button></div>'), Vu = /* @__PURE__ */ P("<div><span> <!> <!></span> <!></div>"), Bu = /* @__PURE__ */ P("<div><h2>Activity</h2> <!> <!></div>"), Hu = /* @__PURE__ */ P("<p>No token is configured for this realm's treasury, so nothing can be sent yet.</p>"), Dr = /* @__PURE__ */ P("<p> </p>"), ba = /* @__PURE__ */ P("<option> </option>"), qu = /* @__PURE__ */ P('<select id="v-token"></select>'), zu = /* @__PURE__ */ P("<p>The treasury has no fund yet, so nothing can be sent.</p>"), Uu = /* @__PURE__ */ P('<select id="v-fund"></select>'), Wu = /* @__PURE__ */ P("<p>Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).</p>"), Yu = /* @__PURE__ */ P("<p>Principal ID of the recipient, or pick a member.</p>"), zi = /* @__PURE__ */ P("<div> </div>"), $u = /* @__PURE__ */ P(`<div><button type="button">← Activity</button> <h2>Send tokens</h2> <form><div><span>Token</span> <!></div> <div><span>From fund</span> <!></div> <div><label for="v-to">Recipient</label> <input id="v-to" type="text" list="v-member-list" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/> <datalist id="v-member-list"></datalist> <!></div> <div><div><label for="v-amount"> </label> <button type="button">Max</button></div> <input id="v-amount" type="text" inputmode="decimal" placeholder="0.00"/> <!> <!></div> <p>Payments go to the recipient's main account; subaccount transfers are not offered by this realm.
						A governed fund files the payment as a proposal for a vote.</p> <button type="submit"> </button></form> <!></div>`), Gu = /* @__PURE__ */ P("<div><div> </div> <span> </span></div>"), Ku = /* @__PURE__ */ P(`<div><h2>Check an invoice</h2> <p>Each invoice has its own account on the token ledger. Checking asks the ledger whether it was
					paid and books the payment into the treasury if so.</p> <form><input type="text" placeholder="Invoice ID (e.g. INV-1)"/> <button type="submit"><!> </button></form> <!> <!> <p>Per-member and raw subaccount balances are not kept by this realm, so they cannot be looked up here.</p></div>`), Xu = /* @__PURE__ */ P("<div>Empty</div>"), Ju = /* @__PURE__ */ P("<div><div> </div> <!></div>"), Zu = /* @__PURE__ */ P("<p>No funds in the treasury yet</p>"), Qu = /* @__PURE__ */ P('<div><h2>Vault Admin</h2> <div><button type="button"><!> </button> <p> </p></div> <div><div><h3> </h3> <!></div> <div><h3>Cash movements on the books</h3> <p> </p></div></div></div>'), ef = /* @__PURE__ */ P('<div><div><div><div><h1>Vault</h1> <p> </p></div> <button type="button" aria-label="Refresh" title="Refresh"><span><!></span></button></div></div> <!> <details><summary>Technical details</summary> <div><div><span>Vault Principal:</span> <button type="button"> </button> <!></div> <!> <!></div></details> <!> <nav><!> <!></nav> <div><!></div></div>');
function tf(e, r) {
  Fa(r, !0);
  const t = r.ctx.theme?.cn ?? ((...s) => s.filter(Boolean).join(" ")), a = 500, i = 1e4, o = 2e3, c = /^\S+ needs (\S+)$/, h = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/;
  let d = /* @__PURE__ */ Y("activity"), _ = /* @__PURE__ */ Y(!0), b = /* @__PURE__ */ Y(!1), y = /* @__PURE__ */ Y(""), x = /* @__PURE__ */ Y(""), E = /* @__PURE__ */ Y(ot([])), C = /* @__PURE__ */ le(() => n(E).includes("admin")), K = /* @__PURE__ */ Y(""), A = /* @__PURE__ */ Y("ok"), ee = /* @__PURE__ */ Y(""), pe = /* @__PURE__ */ Y(ot({})), ae = /* @__PURE__ */ Y(ot({})), Fe = /* @__PURE__ */ Y(!1), Le = /* @__PURE__ */ Y(ot([])), Dt = /* @__PURE__ */ Y(!1), He = /* @__PURE__ */ Y(ot({})), we = /* @__PURE__ */ Y(0);
  const st = 10;
  let Me = /* @__PURE__ */ Y(null), Ht = /* @__PURE__ */ Y(""), lt = /* @__PURE__ */ Y(""), Ue = /* @__PURE__ */ Y(""), kn = /* @__PURE__ */ Y(""), Xr = /* @__PURE__ */ Y(""), ut = /* @__PURE__ */ Y(null), Jn = /* @__PURE__ */ Y(""), ir = /* @__PURE__ */ Y(null), Jr = /* @__PURE__ */ Y(""), Zr = /* @__PURE__ */ Y(!1), Qr = /* @__PURE__ */ Y(!1), wn = /* @__PURE__ */ Y(""), En = /* @__PURE__ */ Y(ot({})), Ja = /* @__PURE__ */ Y(ot([])), Gt = /* @__PURE__ */ le(() => Object.keys(n(pe))), Lt = /* @__PURE__ */ le(() => Object.keys(n(ae))), Oo = /* @__PURE__ */ le(() => {
    const s = {};
    for (const v of n(Gt)) s[v] = 0;
    for (const v of Object.values(n(ae)))
      for (const [p, k] of Object.entries(v ?? {}))
        p in s && (s[p] += et(k));
    return s;
  }), Tr = /* @__PURE__ */ le(() => Math.max(1, Math.ceil(n(Le).length / st))), Za = /* @__PURE__ */ le(() => n(Le).slice(n(we) * st, (n(we) + 1) * st)), qe = /* @__PURE__ */ le(() => n(lt) ? n(pe)[n(lt)] : void 0), Zn = /* @__PURE__ */ le(() => n(lt) && n(Ue) ? et(n(ae)[n(Ue)]?.[n(lt)]) : 0), Qn = /* @__PURE__ */ le(() => n(qe)?.fee ?? 0), Kt = /* @__PURE__ */ le(() => jo(n(Xr), n(qe)?.decimals ?? 8)), Mr = /* @__PURE__ */ le(() => n(kn).trim()), Sn = /* @__PURE__ */ le(() => n(En)[n(Mr)] || ""), Qa = /* @__PURE__ */ le(() => n(Mr) !== "" && (h.test(n(Mr)) || n(Sn) !== "")), ei = /* @__PURE__ */ le(() => n(Qa) && n(Kt) != null && n(Kt) > 0 && !!n(qe) && n(Ue) !== "" && !n(b));
  function et(s) {
    const v = Number(s);
    return Number.isFinite(v) ? v : 0;
  }
  function Fo(s, v) {
    return (s / Math.pow(10, v)).toLocaleString(void 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(v, 8)
    });
  }
  function or(s, v, p) {
    return `${Fo(s, v)} ${p}`;
  }
  function Cr(s) {
    return `${s.toLocaleString()} base units`;
  }
  function jo(s, v) {
    const p = s.trim();
    if (!p) return null;
    const k = p.split(".");
    if (k.length > 2) return null;
    const w = k[0], N = k[1] ?? "";
    if (!/^\d+$/.test(w) || N && !/^\d+$/.test(N) || N.length > v) return null;
    const j = N.padEnd(v, "0"), q = v > 0 ? w + j : w, fe = Number(q);
    return Number.isFinite(fe) && fe >= 0 ? fe : null;
  }
  function Vo(s, v) {
    const p = String(s).padStart(v + 1, "0");
    if (v === 0) return p;
    const k = p.slice(0, -v) || "0";
    let w = p.slice(-v).replace(/0+$/, "");
    return w ? `${k}.${w}` : k;
  }
  function ti(s) {
    return n(pe)[s] ?? {
      ledger: "",
      indexer: "",
      decimals: 8,
      symbol: s,
      name: s,
      fee: 0
    };
  }
  async function sr(s) {
    try {
      await navigator.clipboard.writeText(s), S(Ht, s, !0), setTimeout(() => S(Ht, ""), 2e3);
    } catch {
    }
  }
  function ea(s) {
    const v = Math.floor((Date.now() - s.getTime()) / 1e3);
    if (v < 60) return `${v}s ago`;
    const p = Math.floor(v / 60);
    if (p < 60) return `${p}m ago`;
    const k = Math.floor(p / 60);
    return k < 24 ? `${k}h ago` : `${Math.floor(k / 24)}d ago`;
  }
  function ri(s) {
    return s.at > 0 ? new Date(s.at * 1e3) : null;
  }
  function Bo(s, v = 20) {
    if (s.length <= v) return s;
    const p = Math.floor((v - 1) / 2);
    return `${s.slice(0, p)}…${s.slice(-p)}`;
  }
  function ni(s) {
    return s ? s === n(K) ? { display: "This vault", title: s, copyable: !1 } : n(En)[s] ? {
      display: n(En)[s],
      title: s,
      copyable: !1
    } : { display: Bo(s), title: s, copyable: !0 } : { display: "—", title: "", copyable: !1 };
  }
  function ta(s) {
    return s.description.startsWith("reversal of ") ? "reversal" : n(He)[s.transaction] || (s.category === "cash" ? "allocation" : s.category) || "cash";
  }
  function ra(s) {
    const v = (s || "cash").replace(/_/g, " ");
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
  function ai(s) {
    if (ta(s) === "reversal")
      return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300";
    const v = s.debit - s.credit;
    return v > 0 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300" : v < 0 ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  }
  function ii(s) {
    const v = ti(s.symbol), p = s.debit - s.credit, k = or(Math.abs(p), v.decimals, v.symbol);
    return p > 0 ? {
      text: `+${k}`,
      className: "text-emerald-600 dark:text-emerald-400",
      title: Cr(p)
    } : p < 0 ? {
      text: `−${k}`,
      className: "text-rose-600 dark:text-rose-400",
      title: Cr(-p)
    } : {
      text: k,
      className: "text-gray-600 dark:text-gray-400",
      title: Cr(0)
    };
  }
  function na(s) {
    try {
      const k = JSON.parse(s);
      if (k && typeof k.error == "string") return k.error;
    } catch {
    }
    const v = s.match(/Reject text:\s*([^\n]+?)(?:\s+Error code|\s+Call context|$)/);
    if (v) return v[1].trim();
    const p = s.split(`
`)[0].trim();
    return p.length > 200 ? `${p.slice(0, 200)}…` : p;
  }
  async function Ho(s) {
    if (typeof r.ctx.openModal != "function") return !0;
    try {
      const { actionId: v } = await r.ctx.openModal({
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
      return v === "confirm";
    } catch {
      return !1;
    }
  }
  function qo(s) {
    if (S(lt, s, !0), !n(Ue) || !(n(Ue) in n(ae))) {
      const v = [...n(Lt)].sort((p, k) => et(n(ae)[k]?.[s]) - et(n(ae)[p]?.[s]))[0];
      S(Ue, v ?? "", !0);
    }
    S(ut, null), S(d, "send");
  }
  function zo() {
    if (!n(qe)) return;
    const s = Math.max(0, n(Zn) - n(Qn));
    S(Xr, Vo(s, n(qe).decimals), !0);
  }
  async function lr(s, v, p = {}) {
    try {
      const k = await r.ctx[s](v, p);
      return k && typeof k == "object" ? k : { ok: !1, error: `${v} gave no reply` };
    } catch (k) {
      return console.warn(`${v} failed:`, k), { ok: !1, error: k?.message ?? String(k) };
    }
  }
  function aa(s) {
    const v = String(s ?? "");
    return v === "sign in first" ? "" : v.match(c)?.[1] ?? null;
  }
  function Uo(s) {
    const v = aa(s);
    S(x, v ?? "", !0), S(
      y,
      v == null ? String(s ?? "") || "The realm refused the request." : "",
      !0
    );
  }
  async function oi(s, v, p, k = {}) {
    const w = [];
    let N = 1, j = !1;
    for (; N != null; ) {
      if (w.length >= p) {
        j = !0;
        break;
      }
      const q = await lr("read", s, { ...k, from: N, count: a });
      if (!q.ok) {
        if (N === 1) return { reply: q, rows: null, more: !1 };
        break;
      }
      Array.isArray(q[v]) && w.push(...q[v]), N = q.next ?? null;
    }
    return { reply: null, rows: w, more: j };
  }
  async function Wo() {
    const { rows: s } = await oi("user_list", "users", o), v = {}, p = [];
    for (const k of s ?? []) {
      const w = String(k?.id ?? "");
      if (!w) continue;
      const N = String(k?.nickname ?? "").trim();
      N && (v[w] = N), p.push({ principal: w, label: N || w });
    }
    S(En, v, !0), S(Ja, p, !0);
  }
  async function Yo() {
    const s = {};
    let v = [], p = 1;
    for (; p != null; ) {
      const k = await lr("read", "treasury_view", { from: p, count: a });
      if (!k.ok) {
        if (p === 1) return k;
        break;
      }
      Object.assign(s, k.funds ?? {}), Array.isArray(k.tokens) && (v = k.tokens), p = k.next ?? null;
    }
    return { ok: !0, funds: s, tokens: v };
  }
  async function $o() {
    const { rows: s, more: v } = await oi("ledger_view", "entries", i), p = {}, k = [];
    for (const w of s ?? []) {
      const N = {
        id: String(w?.id ?? ""),
        transaction: String(w?.transaction ?? ""),
        kind: String(w?.kind ?? ""),
        category: String(w?.category ?? ""),
        debit: et(w?.debit),
        credit: et(w?.credit),
        symbol: String(w?.symbol ?? ""),
        at: et(w?.at),
        description: String(w?.description ?? ""),
        user: String(w?.user ?? ""),
        fund: String(w?.fund ?? "")
      };
      N.kind === "asset" ? k.push(N) : N.category && N.category !== "ledger_fee" && !p[N.transaction] && (p[N.transaction] = N.category);
    }
    S(He, p, !0), S(Le, k.reverse(), !0), S(Dt, v, !0), n(we) >= n(Tr) && S(we, 0);
  }
  async function en() {
    S(_, !0), S(y, ""), S(x, "");
    try {
      const [s, v, p] = await Promise.all([
        lr("read", "status"),
        lr("read", "token_catalog"),
        Yo(),
        Wo()
      ]);
      S(K, String(s.ok && s.canister || r.ctx.config?.canisterId || ""), !0);
      const k = {};
      for (const N of v.ok && Array.isArray(v.tokens) ? v.tokens : [])
        N?.symbol && N?.name && (k[String(N.symbol)] = String(N.name));
      if (!p.ok) {
        const N = aa(p.error);
        S(A, N == null ? "unavailable" : "denied", !0), S(ee, N ?? "", !0), S(pe, {}, !0), S(ae, {}, !0), S(Le, [], !0);
        return;
      }
      S(A, "ok");
      const w = {};
      for (const N of p.tokens ?? []) {
        const j = String(N?.id ?? "");
        if (!j) continue;
        const q = Number(N?.decimals);
        w[j] = {
          ledger: String(N?.ledger ?? ""),
          indexer: String(N?.indexer ?? ""),
          decimals: Number.isInteger(q) && q >= 0 ? q : 8,
          symbol: j,
          name: k[j] || j,
          fee: et(N?.fee)
        };
      }
      S(pe, w, !0), S(ae, p.funds ?? {}, !0), (!n(lt) || !(n(lt) in w)) && S(lt, Object.keys(w)[0] ?? "", !0), (!n(Ue) || !(n(Ue) in n(ae))) && S(Ue, Object.keys(n(ae))[0] ?? "", !0), await $o();
    } finally {
      S(Fe, !0), S(Me, /* @__PURE__ */ new Date(), !0), S(_, !1);
    }
  }
  function si(s) {
    const v = aa(s);
    return v == null ? na(String(s ?? "")) : v ? `Checking invoices needs the ${v} permission.` : "Sign in to check invoices.";
  }
  async function Go() {
    S(Qr, !0), S(wn, "");
    try {
      const s = await lr("run", "invoice_refresh");
      if (!s.ok) {
        S(wn, si(s.error), !0);
        return;
      }
      const v = et(s.checked), p = et(s.paid);
      S(
        wn,
        v === 0 ? "No open invoices to check." : `Checked ${v} open invoice${v === 1 ? "" : "s"}; ${p} newly paid.` + (s.next != null ? " More remain: run it again." : ""),
        !0
      ), p > 0 && await en();
    } finally {
      S(Qr, !1);
    }
  }
  async function Ko() {
    if (!n(ei) || !n(qe) || n(Kt) == null) return;
    const s = n(qe).symbol, v = or(n(Kt), n(qe).decimals, s), p = n(Sn) || n(Mr);
    if (await Ho({
      title: "Confirm send",
      body: `Send ${v} from fund ${n(Ue)} to ${p}? This cannot be undone.`,
      confirmLabel: "Send",
      danger: !0
    })) {
      S(b, !0), S(y, ""), S(x, ""), S(ut, null);
      try {
        const w = await lr("run", "transfer_create", {
          fund: n(Ue),
          to: n(Mr),
          amount: n(Kt),
          symbol: s
        });
        if (!w.ok) {
          Uo(w.error);
          return;
        }
        const N = String(w.transfer ?? "");
        w.proposal ? S(
          ut,
          {
            tone: "info",
            text: `Submitted for a vote as proposal ${w.proposal}. The payment is made once it is approved.`
          },
          !0
        ) : w.status === "completed" ? S(
          ut,
          {
            tone: "success",
            text: `Sent ${v} to ${p}.`
          },
          !0
        ) : w.status === "pending" ? S(
          ut,
          {
            tone: "warning",
            text: `Transfer ${N} is pending: the ledger call did not go through, so the amount stays reserved.`
          },
          !0
        ) : S(
          ut,
          {
            tone: "warning",
            text: `The ledger did not accept transfer ${N}; the fund was refunded.`
          },
          !0
        ), typeof r.ctx.notify == "function" && r.ctx.notify(n(ut).tone, n(ut).text), (w.proposal || w.status === "completed") && (S(kn, ""), S(Xr, "")), await en();
      } finally {
        S(b, !1);
      }
    }
  }
  async function Xo() {
    const s = n(Jn).trim();
    if (S(ir, null), S(Jr, ""), !s) {
      S(Jr, "Enter an invoice ID to check.");
      return;
    }
    S(Zr, !0);
    try {
      const v = await lr("run", "invoice_refresh", { invoice: s });
      if (!v.ok) {
        S(Jr, si(v.error), !0);
        return;
      }
      const p = v.invoices && typeof v.invoices == "object" ? v.invoices : {}, k = p[s] ?? Object.values(p)[0];
      S(ir, { invoice: s, status: String(k ?? "unknown") }, !0), et(v.paid) > 0 && await en();
    } finally {
      S(Zr, !1);
    }
  }
  function ia(s) {
    S(we, Math.max(0, Math.min(s, n(Tr) - 1)), !0);
  }
  function Jo(s, v) {
    if (s <= 7) return Array.from({ length: s }, (k, w) => w);
    const p = [0];
    v > 3 && p.push("...");
    for (let k = Math.max(1, v - 1); k <= Math.min(s - 2, v + 1); k++) p.push(k);
    return v < s - 4 && p.push("..."), p.push(s - 1), p;
  }
  const Zo = [
    { id: "activity", label: "Activity" },
    { id: "lookup", label: "Lookup" }
  ];
  let li = /* @__PURE__ */ Y(ot(cu()));
  ou(() => {
    const s = [
      vu((v) => {
        S(li, v, !0);
      })
    ];
    return r.ctx.userProfiles?.subscribe && s.push(r.ctx.userProfiles.subscribe((v) => {
      S(E, v || [], !0);
    })), en(), () => {
      for (const v of s) v();
    };
  });
  var oa = ef(), sa = g(oa), ui = g(sa), fi = g(ui), di = g(fi), ci = m(di, 2), Qo = g(ci), An = m(fi, 2), vi = g(An), es = g(vi);
  hu(es);
  var hi = m(sa, 2);
  {
    var ts = (s) => {
      var v = yu(), p = g(v), k = m(p, 2), w = g(k);
      D(
        (N, j, q) => {
          u(v, 1, N), u(p, 1, j), u(k, 1, q), R(w, `Viewing the vault needs the ${(n(ee) || "signed-in") ?? ""} permission.`);
        },
        [
          () => l(t("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => l(t("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), T(s, v);
    }, rs = (s) => {
      var v = mu(), p = g(v), k = m(p, 2);
      D(
        (w, N, j) => {
          u(v, 1, w), u(p, 1, N), u(k, 1, j);
        },
        [
          () => l(t("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => l(t("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), T(s, v);
    }, ns = (s) => {
      var v = ku(), p = g(v);
      ct(p, 20, () => n(Gt), (N) => N, (N, j) => {
        const q = /* @__PURE__ */ le(() => n(pe)[j]), fe = /* @__PURE__ */ le(() => n(Oo)[j] || 0);
        var xe = bu(), Ce = g(xe), $ = g(Ce), O = g($), J = m($, 2), Z = g(J), F = m(Ce, 2), G = g(F), te = g(G), oe = m(G, 2);
        D(
          (ue, ge, ie, ce, W, re, V, H) => {
            u(xe, 1, ue), wt(xe, "title", ge), u($, 1, ie), R(O, n(q).symbol), u(J, 1, ce), R(Z, n(q).name), u(F, 1, W), u(G, 1, re), R(te, V), u(oe, 1, H);
          },
          [
            () => l(t("flex items-center justify-between gap-4 py-3 sm:bg-white/60 sm:dark:bg-gray-800/40 sm:rounded-lg sm:p-4", "border-b border-indigo-200/60 last:border-0 dark:border-indigo-800/40 sm:border-0")),
            () => Cr(n(fe)),
            () => l(t("text-sm font-semibold text-indigo-900 dark:text-indigo-200")),
            () => l(t("text-xs text-indigo-600/70 dark:text-indigo-400/70")),
            () => l(t("flex items-center gap-4")),
            () => l(t("text-2xl font-bold text-indigo-900 dark:text-indigo-100 tabular-nums")),
            () => or(n(fe), n(q).decimals, n(q).symbol),
            () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 transition-colors shrink-0"))
          ]
        ), je("click", oe, () => qo(j)), T(N, xe);
      });
      var k = m(p, 2), w = g(k);
      D(
        (N, j, q) => {
          u(v, 1, N), u(p, 1, j), u(k, 1, q), R(w, `Booked balance across the treasury's ${n(Lt).length ?? ""} fund${n(Lt).length === 1 ? "" : "s"}`);
        },
        [
          () => l(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20", "border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => l(t("space-y-3")),
          () => l(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), T(s, v);
    }, as = (s) => {
      var v = wu(), p = g(v), k = m(p, 2);
      D(
        (w, N, j) => {
          u(v, 1, w), u(p, 1, N), u(k, 1, j);
        },
        [
          () => l(t("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => l(t("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), T(s, v);
    };
    Q(hi, (s) => {
      n(A) === "denied" ? s(ts) : n(A) === "unavailable" ? s(rs, 1) : n(Fe) && n(Gt).length > 0 ? s(ns, 2) : n(Fe) && s(as, 3);
    });
  }
  var la = m(hi, 2), pi = g(la), gi = m(pi, 2), ua = g(gi), _i = g(ua), tn = m(_i, 2), is = g(tn), os = m(tn, 2);
  {
    var ss = (s) => {
      var v = ya();
      D((p) => u(v, 1, p), [
        () => l(t("text-xs text-green-600 dark:text-green-400"))
      ]), T(s, v);
    };
    Q(os, (s) => {
      n(Ht) === n(K) && n(K) && s(ss);
    });
  }
  var xi = m(ua, 2);
  {
    var ls = (s) => {
      var v = Eu(), p = g(v), k = m(p, 2), w = g(k);
      D(
        (N, j, q, fe, xe) => {
          u(v, 1, N), u(p, 1, j), u(k, 1, q), R(w, `${fe ?? ""} (${xe ?? ""})`);
        },
        [
          () => l(t("text-xs text-gray-600 dark:text-gray-400")),
          () => l(t("font-medium")),
          () => l(t("ml-1")),
          () => n(Me).toLocaleString(),
          () => ea(n(Me))
        ]
      ), T(s, v);
    };
    Q(xi, (s) => {
      n(Me) && s(ls);
    });
  }
  var us = m(xi, 2);
  ct(us, 16, () => n(Gt), (s) => s, (s, v) => {
    const p = /* @__PURE__ */ le(() => n(pe)[v]);
    var k = Su(), w = g(k), N = g(w), j = m(w, 2), q = g(j), fe = m(j, 2), xe = g(fe), Ce = m(fe, 2), $ = g(Ce), O = m(Ce, 2), J = g(O), Z = m(J, 2), F = g(Z), G = m(Z, 2);
    {
      var te = (re) => {
        var V = ya();
        D((H) => u(V, 1, H), [() => l(t("text-green-600 dark:text-green-400"))]), T(re, V);
      };
      Q(G, (re) => {
        n(Ht) === n(p).ledger && re(te);
      });
    }
    var oe = m(O, 2), ue = g(oe), ge = m(ue, 2), ie = g(ge), ce = m(ge, 2);
    {
      var W = (re) => {
        var V = ya();
        D((H) => u(V, 1, H), [() => l(t("text-green-600 dark:text-green-400"))]), T(re, V);
      };
      Q(ce, (re) => {
        n(Ht) === n(p).indexer && re(W);
      });
    }
    D(
      (re, V, H, ve, Ee, ye, he, me, Pe, mt, Se, be) => {
        u(k, 1, re), u(w, 1, V), R(N, n(p).symbol), u(j, 1, H), R(q, `Name: ${n(p).name ?? ""}`), u(fe, 1, ve), R(xe, `Decimals: ${n(p).decimals ?? ""}`), u(Ce, 1, Ee), R($, `Transfer fee: ${ye ?? ""}`), u(O, 1, he), u(J, 1, me), u(Z, 1, Pe), R(F, n(p).ledger || "—"), u(oe, 1, mt), u(ue, 1, Se), u(ge, 1, be), R(ie, n(p).indexer || "—");
      },
      [
        () => l(t("text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 first:border-0 first:pt-0")),
        () => l(t("font-semibold text-gray-700 dark:text-gray-300")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => or(n(p).fee, n(p).decimals, n(p).symbol),
        () => l(t("flex flex-wrap items-center gap-2")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
        () => l(t("flex flex-wrap items-center gap-2")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
      ]
    ), je("click", Z, () => sr(n(p).ledger)), je("click", ge, () => sr(n(p).indexer)), T(s, k);
  });
  var yi = m(la, 2);
  {
    var fs = (s) => {
      du(s, {
        get operation() {
          return n(x);
        }
      });
    }, ds = (s) => {
      var v = Tu(), p = g(v), k = g(p), w = m(p, 2);
      {
        var N = (q) => {
          var fe = Au(), xe = g(fe), Ce = m(xe, 2), $ = g(Ce);
          D(
            (O, J, Z) => {
              u(fe, 1, O), u(xe, 1, J), u(Ce, 1, Z), R($, n(y));
            },
            [
              () => l(t("mt-2")),
              () => l(t("text-xs cursor-pointer select-none opacity-80")),
              () => l(t("mt-2 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto opacity-90"))
            ]
          ), T(q, fe);
        }, j = /* @__PURE__ */ le(() => na(n(y)) !== n(y));
        Q(w, (q) => {
          n(j) && q(N);
        });
      }
      D(
        (q, fe, xe) => {
          u(v, 1, q), u(p, 1, fe), R(k, xe);
        },
        [
          () => l(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300")),
          () => l(t("font-medium")),
          () => na(n(y))
        ]
      ), T(s, v);
    };
    Q(yi, (s) => {
      n(x) ? s(fs) : n(y) && s(ds, 1);
    });
  }
  var fa = m(yi, 2), mi = g(fa);
  ct(mi, 17, () => Zo, (s) => s.id, (s, v) => {
    var p = Cn(), k = g(p);
    D(
      (w) => {
        u(p, 1, w), R(k, n(v).label);
      },
      [
        () => l(t("px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors", n(d) === n(v).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), je("click", p, () => {
      S(d, n(v).id, !0);
    }), T(s, p);
  });
  var cs = m(mi, 2);
  {
    var vs = (s) => {
      var v = Mu(), p = g(v);
      pu(p), D((k) => u(v, 1, k), [
        () => l(t("ml-auto px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5", n(d) === "admin" ? "border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"))
      ]), je("click", v, () => {
        S(d, "admin");
      }), T(s, v);
    };
    Q(cs, (s) => {
      n(C) && s(vs);
    });
  }
  var hs = m(fa, 2), ps = g(hs);
  {
    var gs = (s) => {
      var v = Bu(), p = g(v), k = m(p, 2);
      {
        var w = ($) => {
          var O = ma();
          ct(O, 20, () => Array(4), Pi, (J, Z) => {
            var F = Cu(), G = g(F), te = m(G, 2), oe = m(te, 2), ue = m(oe, 2), ge = m(ue, 2);
            D(
              (ie, ce, W, re, V, H) => {
                u(F, 1, ie), u(G, 1, ce), u(te, 1, W), u(oe, 1, re), u(ue, 1, V), u(ge, 1, H);
              },
              [
                () => l(t("px-4 py-4 animate-pulse flex gap-4")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-16")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 hidden sm:block")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"))
              ]
            ), T(J, F);
          }), D((J) => u(O, 1, J), [
            () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), T($, O);
        }, N = ($) => {
          var O = Nu(), J = g(O), Z = m(J, 2);
          D(
            (F, G, te) => {
              u(O, 1, F), u(J, 1, G), u(Z, 1, te);
            },
            [
              () => l(t("px-6 py-12 text-center")),
              () => l(t("text-sm font-medium text-gray-500 dark:text-gray-400")),
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-1"))
            ]
          ), T($, O);
        }, j = ($) => {
          var O = Du(), J = g(O), Z = m(J, 2), F = m(Z, 2);
          D(
            (G, te, oe, ue) => {
              u(O, 1, G), u(J, 0, te), u(Z, 1, oe), u(F, 1, ue);
            },
            [
              () => l(t("px-6 py-12 text-center")),
              () => l(t("w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3")),
              () => l(t("text-sm font-medium text-gray-500 dark:text-gray-400")),
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-1"))
            ]
          ), T($, O);
        }, q = ($) => {
          var O = ma();
          ct(O, 21, () => n(Za), (J) => J.id, (J, Z) => {
            const F = /* @__PURE__ */ le(() => ri(n(Z))), G = /* @__PURE__ */ le(() => ni(n(Z).user)), te = /* @__PURE__ */ le(() => ii(n(Z)));
            var oe = Ru(), ue = g(oe), ge = g(ue), ie = g(ge), ce = g(ie), W = m(ie, 2), re = g(W), V = m(W, 2), H = g(V), ve = m(H);
            {
              var Ee = (Se) => {
                var be = Lu(), ke = m(rn(be));
                {
                  var Ne = (Oe) => {
                    var M = Cn(), L = g(M);
                    D(
                      (I) => {
                        u(M, 1, I), wt(M, "title", n(G).title), R(L, n(G).display);
                      },
                      [
                        () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline"))
                      ]
                    ), je("click", M, () => sr(n(Z).user)), T(Oe, M);
                  }, ze = (Oe) => {
                    var M = Nn(), L = g(M);
                    D(() => {
                      wt(M, "title", n(G).title), R(L, n(G).display);
                    }), T(Oe, M);
                  };
                  Q(ke, (Oe) => {
                    n(G).copyable ? Oe(Ne) : Oe(ze, -1);
                  });
                }
                T(Se, be);
              };
              Q(ve, (Se) => {
                n(Z).user && Se(Ee);
              });
            }
            var ye = m(ge, 2), he = g(ye), me = g(he), Pe = m(he, 2);
            {
              var mt = (Se) => {
                var be = Cn(), ke = g(be);
                D(
                  (Ne, ze, Oe) => {
                    u(be, 1, Ne), wt(be, "title", ze), R(ke, Oe);
                  },
                  [
                    () => l(t("text-xs text-gray-400 hover:underline")),
                    () => n(F).toLocaleString(),
                    () => ea(n(F))
                  ]
                ), je("click", be, () => sr(n(F).toLocaleString())), T(Se, be);
              };
              Q(Pe, (Se) => {
                n(F) && Se(mt);
              });
            }
            D(
              (Se, be, ke, Ne, ze, Oe, M, L, I) => {
                u(oe, 1, Se), u(ue, 1, be), u(ge, 1, ke), u(ie, 1, Ne), R(ce, ze), u(W, 1, Oe), R(re, n(Z).description || "—"), u(V, 1, M), R(H, `Fund ${(n(Z).fund || "—") ?? ""} `), u(ye, 1, L), u(he, 1, I), wt(he, "title", n(te).title), R(me, n(te).text);
              },
              [
                () => l(t("px-4 py-3")),
                () => l(t("flex items-start justify-between gap-3")),
                () => l(t("min-w-0")),
                () => l(t("inline-block px-1.5 rounded text-xs font-medium", ai(n(Z)))),
                () => ra(ta(n(Z))),
                () => l(t("mt-1 text-xs text-gray-500 dark:text-gray-400 break-words")),
                () => l(t("mt-0.5 text-xs text-gray-400")),
                () => l(t("text-right shrink-0")),
                () => l(t("font-medium tabular-nums text-sm", n(te).className))
              ]
            ), T(J, oe);
          }), D((J) => u(O, 1, J), [
            () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), T($, O);
        }, fe = ($) => {
          var O = Ou(), J = g(O), Z = g(J), F = g(Z), G = g(F), te = m(G), oe = m(te), ue = m(oe), ge = m(ue), ie = m(Z);
          ct(ie, 21, () => n(Za), (ce) => ce.id, (ce, W) => {
            const re = /* @__PURE__ */ le(() => ri(n(W))), V = /* @__PURE__ */ le(() => ni(n(W).user)), H = /* @__PURE__ */ le(() => ii(n(W)));
            var ve = Pu(), Ee = g(ve), ye = g(Ee);
            {
              var he = (Ke) => {
                var ft = qi(), tt = rn(ft), ur = g(tt), fr = m(tt, 2);
                {
                  var dt = (We) => {
                    var It = Hi();
                    D((dr) => u(It, 1, dr), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), T(We, It);
                  }, kt = /* @__PURE__ */ le(() => n(Ht) === n(re).toLocaleString());
                  Q(fr, (We) => {
                    n(kt) && We(dt);
                  });
                }
                D(
                  (We, It, dr) => {
                    u(tt, 1, We), wt(tt, "title", It), R(ur, dr);
                  },
                  [
                    () => l(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                    () => n(re).toLocaleString(),
                    () => ea(n(re))
                  ]
                ), je("click", tt, () => sr(n(re).toLocaleString())), T(Ke, ft);
              }, me = (Ke) => {
                var ft = Iu();
                D((tt) => u(ft, 1, tt), [() => l(t("text-gray-400"))]), T(Ke, ft);
              };
              Q(ye, (Ke) => {
                n(re) ? Ke(he) : Ke(me, -1);
              });
            }
            var Pe = m(ye, 2), mt = g(Pe), Se = m(Ee), be = g(Se), ke = g(be), Ne = m(Se), ze = g(Ne), Oe = g(ze), M = m(Ne), L = g(M), I = g(L), _e = m(L, 2);
            {
              var De = (Ke) => {
                var ft = Ii(), tt = rn(ft);
                {
                  var ur = (dt) => {
                    var kt = qi(), We = rn(kt), It = g(We), dr = m(We, 2);
                    {
                      var ca = (cr) => {
                        var bi = Hi();
                        D((ms) => u(bi, 1, ms), [
                          () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                        ]), T(cr, bi);
                      };
                      Q(dr, (cr) => {
                        n(Ht) === n(W).user && cr(ca);
                      });
                    }
                    D(
                      (cr) => {
                        u(We, 1, cr), wt(We, "title", n(V).title), R(It, n(V).display);
                      },
                      [
                        () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                      ]
                    ), je("click", We, () => sr(n(W).user)), T(dt, kt);
                  }, fr = (dt) => {
                    var kt = Nn(), We = g(kt);
                    D(
                      (It) => {
                        u(kt, 1, It), wt(kt, "title", n(V).title), R(We, n(V).display);
                      },
                      [() => l(t("text-xs text-gray-500 dark:text-gray-400"))]
                    ), T(dt, kt);
                  };
                  Q(tt, (dt) => {
                    n(V).copyable ? dt(ur) : dt(fr, -1);
                  });
                }
                T(Ke, ft);
              };
              Q(_e, (Ke) => {
                n(W).user && Ke(De);
              });
            }
            var Rt = m(M), bt = g(Rt), da = g(bt);
            D(
              (Ke, ft, tt, ur, fr, dt, kt, We, It, dr, ca, cr) => {
                u(ve, 1, Ke), u(Ee, 1, ft), u(Pe, 1, tt), R(mt, n(W).transaction || n(W).id), u(Se, 1, ur), u(be, 1, fr), R(ke, dt), u(Ne, 1, kt), u(ze, 1, We), R(Oe, n(W).fund || "—"), u(M, 1, It), u(L, 1, dr), R(I, n(W).description || "—"), u(Rt, 1, ca), u(bt, 1, cr), wt(bt, "title", n(H).title), R(da, n(H).text);
              },
              [
                () => l(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
                () => l(t("px-4 py-3")),
                () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
                () => l(t("px-4 py-3")),
                () => l(t("px-2 py-0.5 rounded text-xs font-medium", ai(n(W)))),
                () => ra(ta(n(W))),
                () => l(t("px-4 py-3")),
                () => l(t("text-xs text-gray-700 dark:text-gray-300")),
                () => l(t("px-4 py-3")),
                () => l(t("text-xs text-gray-700 dark:text-gray-300")),
                () => l(t("px-4 py-3 text-right")),
                () => l(t("font-medium tabular-nums", n(H).className))
              ]
            ), T(ce, ve);
          }), D(
            (ce, W, re, V, H, ve, Ee, ye, he) => {
              u(O, 1, ce), u(J, 1, W), u(Z, 1, re), u(G, 1, V), u(te, 1, H), u(oe, 1, ve), u(ue, 1, Ee), u(ge, 1, ye), u(ie, 1, he);
            },
            [
              () => l(t("overflow-x-auto")),
              () => l(t("w-full text-sm")),
              () => l(t("bg-gray-50 dark:bg-gray-700/50")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
            ]
          ), T($, O);
        };
        Q(k, ($) => {
          n(_) && n(Le).length === 0 ? $(w) : n(A) !== "ok" ? $(N, 1) : n(Le).length === 0 ? $(j, 2) : n(li) ? $(q, 3) : $(fe, -1);
        });
      }
      var xe = m(k, 2);
      {
        var Ce = ($) => {
          const O = /* @__PURE__ */ le(() => n(Le).length), J = /* @__PURE__ */ le(() => n(we) * st + 1), Z = /* @__PURE__ */ le(() => Math.min((n(we) + 1) * st, n(O))), F = /* @__PURE__ */ le(() => n(Tr) > 1);
          var G = Vu(), te = g(G), oe = g(te), ue = m(oe);
          {
            var ge = (V) => {
              var H = Nn(), ve = g(H);
              D(
                (Ee) => {
                  u(H, 1, Ee), R(ve, `(Page ${n(we) + 1} of ${n(Tr) ?? ""})`);
                },
                [() => l(t("ml-1"))]
              ), T(V, H);
            };
            Q(ue, (V) => {
              n(F) && V(ge);
            });
          }
          var ie = m(ue, 2);
          {
            var ce = (V) => {
              var H = Nn(), ve = g(H);
              D(
                (Ee, ye) => {
                  u(H, 1, Ee), R(ve, `· from the first ${ye ?? ""} ledger entries`);
                },
                [() => l(t("ml-1")), () => i.toLocaleString()]
              ), T(V, H);
            };
            Q(ie, (V) => {
              n(Dt) && V(ce);
            });
          }
          var W = m(te, 2);
          {
            var re = (V) => {
              var H = ju(), ve = g(H), Ee = m(ve, 2);
              ct(Ee, 17, () => Jo(n(Tr), n(we)), Pi, (he, me) => {
                var Pe = Ii(), mt = rn(Pe);
                {
                  var Se = (ke) => {
                    var Ne = Fu();
                    D((ze) => u(Ne, 1, ze), [() => l(t("px-1.5 text-xs text-gray-400"))]), T(ke, Ne);
                  }, be = (ke) => {
                    var Ne = Cn(), ze = g(Ne);
                    D(
                      (Oe) => {
                        u(Ne, 1, Oe), R(ze, n(me) + 1);
                      },
                      [
                        () => l(t("px-2.5 py-1 text-xs border rounded", n(we) === n(me) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                      ]
                    ), je("click", Ne, () => ia(n(me))), T(ke, Ne);
                  };
                  Q(mt, (ke) => {
                    n(me) === "..." ? ke(Se) : ke(be, -1);
                  });
                }
                T(he, Pe);
              });
              var ye = m(Ee, 2);
              D(
                (he, me, Pe) => {
                  u(H, 1, he), ve.disabled = n(we) === 0, u(ve, 1, me), ye.disabled = n(we) >= n(Tr) - 1, u(ye, 1, Pe);
                },
                [
                  () => l(t("flex items-center gap-1")),
                  () => l(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
                  () => l(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
                ]
              ), je("click", ve, () => ia(n(we) - 1)), je("click", ye, () => ia(n(we) + 1)), T(V, H);
            };
            Q(W, (V) => {
              n(F) && V(re);
            });
          }
          D(
            (V, H) => {
              u(G, 1, V), u(te, 1, H), R(oe, `Showing ${n(J) ?? ""}–${n(Z) ?? ""} of ${n(O) ?? ""} `);
            },
            [
              () => l(t("p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3")),
              () => l(t("text-xs text-gray-500 dark:text-gray-400"))
            ]
          ), T($, G);
        };
        Q(xe, ($) => {
          n(A) === "ok" && n(Le).length > 0 && $(Ce);
        });
      }
      D(
        ($, O) => {
          u(v, 1, $), u(p, 1, O);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 overflow-hidden sm:border sm:rounded-xl")),
          () => l(t("text-lg font-semibold px-4 py-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"))
        ]
      ), T(s, v);
    }, _s = (s) => {
      var v = $u(), p = g(v), k = m(p, 2), w = m(k, 2), N = g(w), j = g(N), q = m(j, 2);
      {
        var fe = (M) => {
          var L = Hu();
          D((I) => u(L, 1, I), [() => l(t("text-sm text-gray-500 dark:text-gray-400"))]), T(M, L);
        }, xe = (M) => {
          var L = Dr(), I = g(L);
          D(
            (_e) => {
              u(L, 1, _e), R(I, `Sending ${n(pe)[n(Gt)[0]].symbol ?? ""}`);
            },
            [() => l(t("text-sm text-gray-900 dark:text-gray-100"))]
          ), T(M, L);
        }, Ce = (M) => {
          var L = qu();
          ct(L, 20, () => n(Gt), (I) => I, (I, _e) => {
            var De = ba(), Rt = g(De), bt = {};
            D(() => {
              R(Rt, n(pe)[_e].symbol), bt !== (bt = _e) && (De.value = (De.__value = _e) ?? "");
            }), T(I, De);
          }), D((I) => u(L, 1, I), [
            () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Fi(L, () => n(lt), (I) => S(lt, I)), T(M, L);
        };
        Q(q, (M) => {
          n(Gt).length === 0 ? M(fe) : n(Gt).length === 1 ? M(xe, 1) : M(Ce, -1);
        });
      }
      var $ = m(N, 2), O = g($), J = m(O, 2);
      {
        var Z = (M) => {
          var L = zu();
          D((I) => u(L, 1, I), [() => l(t("text-sm text-gray-500 dark:text-gray-400"))]), T(M, L);
        }, F = (M) => {
          var L = Dr(), I = g(L);
          D(
            (_e) => {
              u(L, 1, _e), R(I, `Paying from fund ${n(Lt)[0] ?? ""}`);
            },
            [() => l(t("text-sm text-gray-900 dark:text-gray-100"))]
          ), T(M, L);
        }, G = (M) => {
          var L = Uu();
          ct(L, 20, () => n(Lt), (I) => I, (I, _e) => {
            var De = ba(), Rt = g(De), bt = {};
            D(() => {
              R(Rt, _e), bt !== (bt = _e) && (De.value = (De.__value = _e) ?? "");
            }), T(I, De);
          }), D((I) => u(L, 1, I), [
            () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Fi(L, () => n(Ue), (I) => S(Ue, I)), T(M, L);
        };
        Q(J, (M) => {
          n(Lt).length === 0 ? M(Z) : n(Lt).length === 1 ? M(F, 1) : M(G, -1);
        });
      }
      var te = m($, 2), oe = g(te), ue = m(oe, 2), ge = m(ue, 2);
      ct(ge, 21, () => n(Ja), (M) => M.principal, (M, L) => {
        var I = ba(), _e = g(I), De = {};
        D(() => {
          R(_e, n(L).label), De !== (De = n(L).principal) && (I.value = (I.__value = n(L).principal) ?? "");
        }), T(M, I);
      });
      var ie = m(ge, 2);
      {
        var ce = (M) => {
          var L = Wu();
          D((I) => u(L, 1, I), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), T(M, L);
        }, W = (M) => {
          var L = Dr(), I = g(L);
          D(
            (_e) => {
              u(L, 1, _e), R(I, n(Sn));
            },
            [
              () => l(t("text-xs text-gray-600 dark:text-gray-400 mt-1"))
            ]
          ), T(M, L);
        }, re = (M) => {
          var L = Yu();
          D((I) => u(L, 1, I), [
            () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
          ]), T(M, L);
        };
        Q(ie, (M) => {
          n(Mr) && !n(Qa) ? M(ce) : n(Sn) ? M(W, 1) : M(re, -1);
        });
      }
      var V = m(te, 2), H = g(V), ve = g(H), Ee = g(ve), ye = m(ve, 2), he = m(H, 2), me = m(he, 2);
      {
        var Pe = (M) => {
          var L = Dr(), I = g(L);
          D(
            (_e, De, Rt) => {
              u(L, 1, _e), R(I, `Available in ${n(Ue) ?? ""}: ${De ?? ""}
								· Network fee ${Rt ?? ""}`);
            },
            [
              () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1")),
              () => or(n(Zn), n(qe).decimals, n(qe).symbol),
              () => or(n(Qn), n(qe).decimals, n(qe).symbol)
            ]
          ), T(M, L);
        };
        Q(me, (M) => {
          n(qe) && n(Ue) && M(Pe);
        });
      }
      var mt = m(me, 2);
      {
        var Se = (M) => {
          var L = Dr(), I = g(L);
          D(
            (_e, De) => {
              u(L, 1, _e), R(I, `= ${De ?? ""}`);
            },
            [
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
              () => Cr(n(Kt))
            ]
          ), T(M, L);
        };
        Q(mt, (M) => {
          n(Kt) != null && n(Kt) > 0 && M(Se);
        });
      }
      var be = m(V, 2), ke = m(be, 2), Ne = g(ke), ze = m(w, 2);
      {
        var Oe = (M) => {
          var L = zi(), I = g(L);
          D(
            (_e) => {
              u(L, 1, _e), R(I, n(ut).text);
            },
            [
              () => l(t("mt-4 p-3 rounded-lg border text-sm", n(ut).tone === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300" : n(ut).tone === "info" ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"))
            ]
          ), T(M, L);
        };
        Q(ze, (M) => {
          n(ut) && M(Oe);
        });
      }
      D(
        (M, L, I, _e, De, Rt, bt, da, Ke, ft, tt, ur, fr, dt) => {
          u(v, 1, M), u(p, 1, L), u(k, 1, I), u(w, 1, _e), u(j, 1, De), u(O, 1, Rt), u(oe, 1, bt), u(ue, 1, da), u(H, 1, Ke), u(ve, 1, ft), R(Ee, `Amount${n(qe) ? ` (${n(qe).symbol})` : ""}`), ye.disabled = !n(qe) || n(Zn) <= n(Qn), u(ye, 1, tt), u(he, 1, ur), u(be, 1, fr), ke.disabled = !n(ei), u(ke, 1, dt), R(Ne, n(b) ? "Sending…" : "Send");
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 p-4 sm:border sm:rounded-xl sm:p-6")),
          () => l(t("text-sm text-indigo-600 dark:text-indigo-400 mb-3 inline-flex items-center gap-1")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => l(t("space-y-4")),
          () => l(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(t("flex items-center justify-between mb-1.5")),
          () => l(t("text-sm font-medium text-gray-700 dark:text-gray-300")),
          () => l(t("text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40")),
          () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(t("text-xs text-gray-400 dark:text-gray-500")),
          () => l(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), je("click", p, () => {
        S(d, "activity");
      }), Li("submit", w, (M) => {
        M.preventDefault(), Ko();
      }), ga(ue, () => n(kn), (M) => S(kn, M)), je("click", ye, zo), ga(he, () => n(Xr), (M) => S(Xr, M)), T(s, v);
    }, xs = (s) => {
      var v = Ku(), p = g(v), k = m(p, 2), w = m(k, 2), N = g(w), j = m(N, 2), q = g(j);
      {
        var fe = (F) => {
          Bi(F);
        };
        Q(q, (F) => {
          n(Zr) && F(fe);
        });
      }
      var xe = m(q), Ce = m(w, 2);
      {
        var $ = (F) => {
          var G = Dr(), te = g(G);
          D(
            (oe) => {
              u(G, 1, oe), R(te, n(Jr));
            },
            [
              () => l(t("text-sm text-gray-600 dark:text-gray-400 mb-4"))
            ]
          ), T(F, G);
        };
        Q(Ce, (F) => {
          n(Jr) && F($);
        });
      }
      var O = m(Ce, 2);
      {
        var J = (F) => {
          var G = Gu(), te = g(G), oe = g(te), ue = m(te, 2), ge = g(ue);
          D(
            (ie, ce, W, re) => {
              u(G, 1, ie), u(te, 1, ce), R(oe, `Invoice ${n(ir).invoice ?? ""}`), u(ue, 1, W), R(ge, re);
            },
            [
              () => l(t("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between gap-3")),
              () => l(t("text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => l(t("px-2 py-0.5 rounded text-xs font-medium", n(ir).status === "paid" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300" : n(ir).status === "overdue" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400")),
              () => ra(n(ir).status)
            ]
          ), T(F, G);
        };
        Q(O, (F) => {
          n(ir) && F(J);
        });
      }
      var Z = m(O, 2);
      D(
        (F, G, te, oe, ue, ge, ie) => {
          u(v, 1, F), u(p, 1, G), u(k, 1, te), u(w, 1, oe), u(N, 1, ue), j.disabled = n(Zr), u(j, 1, ge), R(xe, ` ${n(Zr) ? "Checking…" : "Check"}`), u(Z, 1, ie);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => l(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => l(t("flex gap-2 mb-4")),
          () => l(t("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => l(t("mt-4 text-xs text-gray-400 dark:text-gray-500"))
        ]
      ), Li("submit", w, (F) => {
        F.preventDefault(), Xo();
      }), ga(N, () => n(Jn), (F) => S(Jn, F)), T(s, v);
    }, ys = (s) => {
      var v = Qu(), p = g(v), k = m(p, 2), w = g(k), N = g(w);
      {
        var j = (ie) => {
          Bi(ie);
        };
        Q(N, (ie) => {
          n(Qr) && ie(j);
        });
      }
      var q = m(N), fe = m(w, 2), xe = g(fe), Ce = m(k, 2), $ = g(Ce), O = g($), J = g(O), Z = m(O, 2);
      {
        var F = (ie) => {
          var ce = ma();
          ct(ce, 20, () => n(Lt), (W) => W, (W, re) => {
            const V = /* @__PURE__ */ le(() => Object.entries(n(ae)[re] ?? {}));
            var H = Ju(), ve = g(H), Ee = g(ve), ye = m(ve, 2);
            ct(
              ye,
              17,
              () => n(V),
              ([he, me]) => he,
              (he, me) => {
                var Pe = /* @__PURE__ */ le(() => Ns(n(me), 2));
                let mt = () => n(Pe)[0], Se = () => n(Pe)[1];
                const be = /* @__PURE__ */ le(() => ti(mt()));
                var ke = zi(), Ne = g(ke);
                D(
                  (ze, Oe, M) => {
                    u(ke, 1, ze), wt(ke, "title", Oe), R(Ne, M);
                  },
                  [
                    () => l(t("text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums")),
                    () => Cr(et(Se())),
                    () => or(et(Se()), n(be).decimals, n(be).symbol)
                  ]
                ), T(he, ke);
              },
              (he) => {
                var me = Xu();
                D((Pe) => u(me, 1, Pe), [() => l(t("text-sm text-gray-400 dark:text-gray-500"))]), T(he, me);
              }
            ), D(
              (he, me) => {
                u(H, 1, he), u(ve, 1, me), R(Ee, re);
              },
              [
                () => l(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => l(t("text-xs text-gray-600 dark:text-gray-400 mb-1"))
              ]
            ), T(W, H);
          }), D((W) => u(ce, 1, W), [() => l(t("space-y-2 max-h-80 overflow-auto"))]), T(ie, ce);
        }, G = (ie) => {
          var ce = Zu();
          D((W) => u(ce, 1, W), [() => l(t("text-gray-500 dark:text-gray-400 text-sm"))]), T(ie, ce);
        };
        Q(Z, (ie) => {
          n(Lt).length > 0 ? ie(F) : ie(G, -1);
        });
      }
      var te = m($, 2), oe = g(te), ue = m(oe, 2), ge = g(ue);
      D(
        (ie, ce, W, re, V, H, ve, Ee, ye, he) => {
          u(v, 1, ie), u(p, 1, ce), u(k, 1, W), w.disabled = n(Qr), u(w, 1, re), R(q, ` ${n(Qr) ? "Checking…" : "Check invoice payments"}`), u(fe, 1, V), R(xe, n(wn) || "Asks the token ledgers whether open invoices were paid, a batch at a time, and books the payments."), u(Ce, 1, H), u(O, 1, ve), R(J, `Balances by fund (${n(Lt).length ?? ""})`), u(oe, 1, Ee), u(ue, 1, ye), R(ge, `Total: ${he ?? ""}${n(Dt) ? "+" : ""}`);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => l(t("mb-6")),
          () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => l(t("mt-2 text-xs text-gray-500 dark:text-gray-400")),
          () => l(t("space-y-6")),
          () => l(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => l(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => l(t("text-sm text-gray-600 dark:text-gray-400")),
          () => n(Le).length.toLocaleString()
        ]
      ), je("click", w, Go), T(s, v);
    };
    Q(ps, (s) => {
      n(d) === "activity" ? s(gs) : n(d) === "send" ? s(_s, 1) : n(d) === "lookup" ? s(xs, 2) : n(d) === "admin" && s(ys, 3);
    });
  }
  D(
    (s, v, p, k, w, N, j, q, fe, xe, Ce, $, O, J) => {
      u(oa, 1, s), u(sa, 1, v), u(ui, 1, p), u(di, 1, k), u(ci, 1, w), R(Qo, lu), An.disabled = n(_), u(An, 1, N), u(vi, 1, j), u(la, 1, q), u(pi, 1, fe), u(gi, 1, xe), u(ua, 1, Ce), u(_i, 1, $), u(tn, 1, O), wt(tn, "title", n(K)), R(is, n(K) || "—"), u(fa, 1, J);
    },
    [
      () => l(t("w-full py-3 sm:py-6 space-y-4 sm:space-y-6")),
      () => l(t("flex flex-col gap-2")),
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
  ), je("click", An, en), je("click", tn, () => sr(n(K))), T(e, oa), ja();
}
ql(["click"]);
function af(e, r) {
  const t = Yl(tf, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        Gl(t);
      } catch {
      }
    }
  };
}
export {
  af as default
};
