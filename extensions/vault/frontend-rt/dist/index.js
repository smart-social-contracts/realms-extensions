var co = Object.defineProperty;
var Sa = (e) => {
  throw TypeError(e);
};
var vo = (e, r, t) => r in e ? co(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var ut = (e, r, t) => vo(e, typeof r != "symbol" ? r + "" : r, t), Fn = (e, r, t) => r.has(e) || Sa("Cannot " + t);
var l = (e, r, t) => (Fn(e, r, "read from private field"), t ? t.call(e) : r.get(e)), j = (e, r, t) => r.has(e) ? Sa("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), Y = (e, r, t, n) => (Fn(e, r, "write to private field"), n ? n.call(e, t) : r.set(e, t), t), ie = (e, r, t) => (Fn(e, r, "access private method"), t);
var ta = Array.isArray, _o = Array.prototype.indexOf, Rr = Array.prototype.includes, wn = Array.from, ho = Object.defineProperty, Vr = Object.getOwnPropertyDescriptor, go = Object.prototype, po = Array.prototype, bo = Object.getPrototypeOf, Ta = Object.isExtensible;
const xo = () => {
};
function yo(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function Ba() {
  var e, r, t = new Promise((n, a) => {
    e = n, r = a;
  });
  return { promise: t, resolve: e, reject: r };
}
function mo(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const n of e)
    if (t.push(n), t.length === r) break;
  return t;
}
const De = 2, Lr = 4, En = 8, Va = 1 << 24, wt = 16, _t = 32, Qt = 64, qn = 128, tt = 512, we = 1024, Le = 2048, Et = 4096, Ie = 8192, rt = 16384, yr = 32768, Aa = 1 << 25, gr = 65536, zn = 1 << 17, ko = 1 << 18, Cr = 1 << 19, wo = 1 << 20, kt = 1 << 25, pr = 65536, bn = 1 << 21, Yr = 1 << 22, Kt = 1 << 23, Hr = Symbol("$state"), Ct = new class extends Error {
  constructor() {
    super(...arguments);
    ut(this, "name", "StaleReactionError");
    ut(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Eo() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function So(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function To(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Ao() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Mo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function No() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Ro() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Lo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Do() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Po() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Oo = 1, Co = 2, Ha = 4, Io = 8, Fo = 16, jo = 1, Bo = 2, Se = Symbol(), qa = "http://www.w3.org/1999/xhtml", Vo = "http://www.w3.org/2000/svg", Ho = "http://www.w3.org/1998/Math/MathML";
function qo() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function zo() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Uo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function za(e) {
  return e === this.v;
}
function Yo(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function Ua(e) {
  return !Yo(e, this.v);
}
let at = null;
function Dr(e) {
  at = e;
}
function Ya(e, r = !1, t) {
  at = {
    p: at,
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
function Wa(e) {
  var r = (
    /** @type {ComponentContext} */
    at
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var n of t)
      vi(n);
  }
  return r.i = !0, at = r.p, /** @type {T} */
  {};
}
function Ga() {
  return !0;
}
let ir = [];
function Ja() {
  var e = ir;
  ir = [], yo(e);
}
function Xt(e) {
  if (ir.length === 0 && !qr) {
    var r = ir;
    queueMicrotask(() => {
      r === ir && Ja();
    });
  }
  ir.push(e);
}
function Wo() {
  for (; ir.length > 0; )
    Ja();
}
function Ka(e) {
  var r = J;
  if (r === null)
    return G.f |= Kt, e;
  if ((r.f & yr) === 0 && (r.f & Lr) === 0)
    throw e;
  Gt(e, r);
}
function Gt(e, r) {
  for (; r !== null; ) {
    if ((r.f & qn) !== 0) {
      if ((r.f & yr) === 0)
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
const Go = -7169;
function pe(e, r) {
  e.f = e.f & Go | r;
}
function ra(e) {
  (e.f & tt) !== 0 || e.deps === null ? pe(e, we) : pe(e, Et);
}
function Xa(e) {
  if (e !== null)
    for (const r of e)
      (r.f & De) === 0 || (r.f & pr) === 0 || (r.f ^= pr, Xa(
        /** @type {Derived} */
        r.deps
      ));
}
function Za(e, r, t) {
  (e.f & Le) !== 0 ? r.add(e) : (e.f & Et) !== 0 && t.add(e), Xa(e.deps), pe(e, we);
}
const nr = /* @__PURE__ */ new Set();
let C = null, ct = null, Un = null, qr = !1, jn = !1, Er = null, dn = null;
var Ma = 0;
let Jo = 1;
var Sr, Tr, lr, It, xt, Jr, Ye, Kr, Yt, Ft, yt, Ar, Mr, fr, me, cn, Qa, vn, Yn, _n, Ko;
const yn = class yn {
  constructor() {
    j(this, me);
    ut(this, "id", Jo++);
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
    j(this, Sr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    j(this, Tr, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    j(this, lr, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    j(this, It, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    j(this, xt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    j(this, Jr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    j(this, Ye, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    j(this, Kr, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    j(this, Yt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    j(this, Ft, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    j(this, yt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    j(this, Ar, /* @__PURE__ */ new Set());
    ut(this, "is_fork", !1);
    j(this, Mr, !1);
    /** @type {Set<Batch>} */
    j(this, fr, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    l(this, yt).has(r) || l(this, yt).set(r, { d: [], m: [] }), l(this, Ar).delete(r);
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
      for (var a of n.d)
        pe(a, Le), t(a);
      for (a of n.m)
        pe(a, Et), t(a);
    }
    l(this, Ar).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, n = !1) {
    r.v !== Se && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & Kt) === 0 && (this.current.set(r, [t, n]), ct?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    C = this;
  }
  deactivate() {
    C = null, ct = null;
  }
  flush() {
    try {
      jn = !0, C = this, ie(this, me, vn).call(this);
    } finally {
      Ma = 0, Un = null, Er = null, dn = null, jn = !1, C = null, ct = null, vr.clear();
    }
  }
  discard() {
    for (const r of l(this, Tr)) r(this);
    l(this, Tr).clear(), l(this, lr).clear(), nr.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    l(this, Kr).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    let n = l(this, It).get(t) ?? 0;
    if (l(this, It).set(t, n + 1), r) {
      let a = l(this, xt).get(t) ?? 0;
      l(this, xt).set(t, a + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(r, t, n) {
    let a = l(this, It).get(t) ?? 0;
    if (a === 1 ? l(this, It).delete(t) : l(this, It).set(t, a - 1), r) {
      let o = l(this, xt).get(t) ?? 0;
      o === 1 ? l(this, xt).delete(t) : l(this, xt).set(t, o - 1);
    }
    l(this, Mr) || n || (Y(this, Mr, !0), Xt(() => {
      Y(this, Mr, !1), this.flush();
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
    l(this, Sr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    l(this, Tr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(r) {
    l(this, lr).add(r);
  }
  run_fork_commit_callbacks() {
    for (const r of l(this, lr)) r(this);
    l(this, lr).clear();
  }
  settled() {
    return (l(this, Jr) ?? Y(this, Jr, Ba())).promise;
  }
  static ensure() {
    if (C === null) {
      const r = C = new yn();
      jn || (nr.add(C), qr || Xt(() => {
        C === r && r.flush();
      }));
    }
    return C;
  }
  apply() {
    {
      ct = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if (Un = r, r.b?.is_pending && (r.f & (Lr | En | Va)) !== 0 && (r.f & yr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var n = t.f;
      if (Er !== null && t === J && (G === null || (G.f & De) === 0))
        return;
      if ((n & (Qt | _t)) !== 0) {
        if ((n & we) === 0)
          return;
        t.f ^= we;
      }
    }
    l(this, Ye).push(t);
  }
};
Sr = new WeakMap(), Tr = new WeakMap(), lr = new WeakMap(), It = new WeakMap(), xt = new WeakMap(), Jr = new WeakMap(), Ye = new WeakMap(), Kr = new WeakMap(), Yt = new WeakMap(), Ft = new WeakMap(), yt = new WeakMap(), Ar = new WeakMap(), Mr = new WeakMap(), fr = new WeakMap(), me = new WeakSet(), cn = function() {
  return this.is_fork || l(this, xt).size > 0;
}, Qa = function() {
  for (const n of l(this, fr))
    for (const a of l(n, xt).keys()) {
      for (var r = !1, t = a; t.parent !== null; ) {
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
}, vn = function() {
  var f;
  if (Ma++ > 1e3 && (nr.delete(this), Zo()), !ie(this, me, cn).call(this)) {
    for (const s of l(this, Yt))
      l(this, Ft).delete(s), pe(s, Le), this.schedule(s);
    for (const s of l(this, Ft))
      pe(s, Et), this.schedule(s);
  }
  const r = l(this, Ye);
  Y(this, Ye, []), this.apply();
  var t = Er = [], n = [], a = dn = [];
  for (const s of r)
    try {
      ie(this, me, Yn).call(this, s, t, n);
    } catch (_) {
      throw ti(s), _;
    }
  if (C = null, a.length > 0) {
    var o = yn.ensure();
    for (const s of a)
      o.schedule(s);
  }
  if (Er = null, dn = null, ie(this, me, cn).call(this) || ie(this, me, Qa).call(this)) {
    ie(this, me, _n).call(this, n), ie(this, me, _n).call(this, t);
    for (const [s, _] of l(this, yt))
      ei(s, _);
  } else {
    l(this, It).size === 0 && nr.delete(this), l(this, Yt).clear(), l(this, Ft).clear();
    for (const s of l(this, Sr)) s(this);
    l(this, Sr).clear(), Na(n), Na(t), l(this, Jr)?.resolve();
  }
  var u = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    C
  );
  if (l(this, Ye).length > 0) {
    const s = u ?? (u = this);
    l(s, Ye).push(...l(this, Ye).filter((_) => !l(s, Ye).includes(_)));
  }
  u !== null && (nr.add(u), ie(f = u, me, vn).call(f));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Yn = function(r, t, n) {
  r.f ^= we;
  for (var a = r.first; a !== null; ) {
    var o = a.f, u = (o & (_t | Qt)) !== 0, f = u && (o & we) !== 0, s = f || (o & Ie) !== 0 || l(this, yt).has(a);
    if (!s && a.fn !== null) {
      u ? a.f ^= we : (o & Lr) !== 0 ? t.push(a) : tn(a) && ((o & wt) !== 0 && l(this, Ft).add(a), Or(a));
      var _ = a.first;
      if (_ !== null) {
        a = _;
        continue;
      }
    }
    for (; a !== null; ) {
      var b = a.next;
      if (b !== null) {
        a = b;
        break;
      }
      a = a.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
_n = function(r) {
  for (var t = 0; t < r.length; t += 1)
    Za(r[t], l(this, Yt), l(this, Ft));
}, Ko = function() {
  var b, S, g;
  for (const y of nr) {
    var r = y.id < this.id, t = [];
    for (const [w, [I, m]] of this.current) {
      if (y.current.has(w)) {
        var n = (
          /** @type {[any, boolean]} */
          y.current.get(w)[0]
        );
        if (r && I !== n)
          y.current.set(w, [I, m]);
        else
          continue;
      }
      t.push(w);
    }
    var a = [...y.current.keys()].filter((w) => !this.current.has(w));
    if (a.length === 0)
      r && y.discard();
    else if (t.length > 0) {
      if (r)
        for (const w of l(this, Ar))
          y.unskip_effect(w, (I) => {
            var m;
            (I.f & (wt | Yr)) !== 0 ? y.schedule(I) : ie(m = y, me, _n).call(m, [I]);
          });
      y.activate();
      var o = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
      for (var f of t)
        $a(f, a, o, u);
      u = /* @__PURE__ */ new Map();
      var s = [...y.current.keys()].filter(
        (w) => this.current.has(w) ? (
          /** @type {[any, boolean]} */
          this.current.get(w)[0] !== w
        ) : !0
      );
      for (const w of l(this, Kr))
        (w.f & (rt | Ie | zn)) === 0 && na(w, s, u) && ((w.f & (Yr | wt)) !== 0 ? (pe(w, Le), y.schedule(w)) : l(y, Yt).add(w));
      if (l(y, Ye).length > 0) {
        y.apply();
        for (var _ of l(y, Ye))
          ie(b = y, me, Yn).call(b, _, [], []);
        Y(y, Ye, []);
      }
      y.deactivate();
    }
  }
  for (const y of nr)
    l(y, fr).has(this) && (l(y, fr).delete(this), l(y, fr).size === 0 && !ie(S = y, me, cn).call(S) && (y.activate(), ie(g = y, me, vn).call(g)));
};
let br = yn;
function Xo(e) {
  var r = qr;
  qr = !0;
  try {
    for (var t; ; ) {
      if (Wo(), C === null)
        return (
          /** @type {T} */
          t
        );
      C.flush();
    }
  } finally {
    qr = r;
  }
}
function Zo() {
  try {
    No();
  } catch (e) {
    Gt(e, Un);
  }
}
let Ot = null;
function Na(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var n = e[t++];
      if ((n.f & (rt | Ie)) === 0 && tn(n) && (Ot = /* @__PURE__ */ new Set(), Or(n), n.deps === null && n.first === null && n.nodes === null && n.teardown === null && n.ac === null && pi(n), Ot?.size > 0)) {
        vr.clear();
        for (const a of Ot) {
          if ((a.f & (rt | Ie)) !== 0) continue;
          const o = [a];
          let u = a.parent;
          for (; u !== null; )
            Ot.has(u) && (Ot.delete(u), o.push(u)), u = u.parent;
          for (let f = o.length - 1; f >= 0; f--) {
            const s = o[f];
            (s.f & (rt | Ie)) === 0 && Or(s);
          }
        }
        Ot.clear();
      }
    }
    Ot = null;
  }
}
function $a(e, r, t, n) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const a of e.reactions) {
      const o = a.f;
      (o & De) !== 0 ? $a(
        /** @type {Derived} */
        a,
        r,
        t,
        n
      ) : (o & (Yr | wt)) !== 0 && (o & Le) === 0 && na(a, r, n) && (pe(a, Le), aa(
        /** @type {Effect} */
        a
      ));
    }
}
function na(e, r, t) {
  const n = t.get(e);
  if (n !== void 0) return n;
  if (e.deps !== null)
    for (const a of e.deps) {
      if (Rr.call(r, a))
        return !0;
      if ((a.f & De) !== 0 && na(
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
function aa(e) {
  C.schedule(e);
}
function ei(e, r) {
  if (!((e.f & _t) !== 0 && (e.f & we) !== 0)) {
    (e.f & Le) !== 0 ? r.d.push(e) : (e.f & Et) !== 0 && r.m.push(e), pe(e, we);
    for (var t = e.first; t !== null; )
      ei(t, r), t = t.next;
  }
}
function ti(e) {
  pe(e, we);
  for (var r = e.first; r !== null; )
    ti(r), r = r.next;
}
function Qo(e) {
  let r = 0, t = xr(0), n;
  return () => {
    sa() && (i(t), _i(() => (r === 0 && (n = Ai(() => e(() => zr(t)))), r += 1, () => {
      Xt(() => {
        r -= 1, r === 0 && (n?.(), n = void 0, zr(t));
      });
    })));
  };
}
var $o = gr | Cr;
function es(e, r, t, n) {
  new ts(e, r, t, n);
}
var Xe, ea, Ze, ur, Fe, Qe, Ce, We, jt, dr, Wt, Nr, Xr, Zr, Bt, mn, _e, rs, ns, as, Wn, hn, gn, Gn, Jn;
class ts {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, n, a) {
    j(this, _e);
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
    j(this, Xe);
    /** @type {TemplateNode | null} */
    j(this, ea, null);
    /** @type {BoundaryProps} */
    j(this, Ze);
    /** @type {((anchor: Node) => void)} */
    j(this, ur);
    /** @type {Effect} */
    j(this, Fe);
    /** @type {Effect | null} */
    j(this, Qe, null);
    /** @type {Effect | null} */
    j(this, Ce, null);
    /** @type {Effect | null} */
    j(this, We, null);
    /** @type {DocumentFragment | null} */
    j(this, jt, null);
    j(this, dr, 0);
    j(this, Wt, 0);
    j(this, Nr, !1);
    /** @type {Set<Effect>} */
    j(this, Xr, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    j(this, Zr, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    j(this, Bt, null);
    j(this, mn, Qo(() => (Y(this, Bt, xr(l(this, dr))), () => {
      Y(this, Bt, null);
    })));
    Y(this, Xe, r), Y(this, Ze, t), Y(this, ur, (o) => {
      var u = (
        /** @type {Effect} */
        J
      );
      u.b = this, u.f |= qn, n(o);
    }), this.parent = /** @type {Effect} */
    J.b, this.transform_error = a ?? this.parent?.transform_error ?? ((o) => o), Y(this, Fe, Tn(() => {
      ie(this, _e, Wn).call(this);
    }, $o));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    Za(r, l(this, Xr), l(this, Zr));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!l(this, Ze).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    ie(this, _e, Gn).call(this, r, t), Y(this, dr, l(this, dr) + r), !(!l(this, Bt) || l(this, Nr)) && (Y(this, Nr, !0), Xt(() => {
      Y(this, Nr, !1), l(this, Bt) && Pr(l(this, Bt), l(this, dr));
    }));
  }
  get_effect_pending() {
    return l(this, mn).call(this), i(
      /** @type {Source<number>} */
      l(this, Bt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!l(this, Ze).onerror && !l(this, Ze).failed)
      throw r;
    C?.is_fork ? (l(this, Qe) && C.skip_effect(l(this, Qe)), l(this, Ce) && C.skip_effect(l(this, Ce)), l(this, We) && C.skip_effect(l(this, We)), C.on_fork_commit(() => {
      ie(this, _e, Jn).call(this, r);
    })) : ie(this, _e, Jn).call(this, r);
  }
}
Xe = new WeakMap(), ea = new WeakMap(), Ze = new WeakMap(), ur = new WeakMap(), Fe = new WeakMap(), Qe = new WeakMap(), Ce = new WeakMap(), We = new WeakMap(), jt = new WeakMap(), dr = new WeakMap(), Wt = new WeakMap(), Nr = new WeakMap(), Xr = new WeakMap(), Zr = new WeakMap(), Bt = new WeakMap(), mn = new WeakMap(), _e = new WeakSet(), rs = function() {
  try {
    Y(this, Qe, et(() => l(this, ur).call(this, l(this, Xe))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
ns = function(r) {
  const t = l(this, Ze).failed;
  t && Y(this, We, et(() => {
    t(
      l(this, Xe),
      () => r,
      () => () => {
      }
    );
  }));
}, as = function() {
  const r = l(this, Ze).pending;
  r && (this.is_pending = !0, Y(this, Ce, et(() => r(l(this, Xe)))), Xt(() => {
    var t = Y(this, jt, document.createDocumentFragment()), n = Zt();
    t.append(n), Y(this, Qe, ie(this, _e, gn).call(this, () => et(() => l(this, ur).call(this, n)))), l(this, Wt) === 0 && (l(this, Xe).before(t), Y(this, jt, null), _r(
      /** @type {Effect} */
      l(this, Ce),
      () => {
        Y(this, Ce, null);
      }
    ), ie(this, _e, hn).call(
      this,
      /** @type {Batch} */
      C
    ));
  }));
}, Wn = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), Y(this, Wt, 0), Y(this, dr, 0), Y(this, Qe, et(() => {
      l(this, ur).call(this, l(this, Xe));
    })), l(this, Wt) > 0) {
      var r = Y(this, jt, document.createDocumentFragment());
      da(l(this, Qe), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        l(this, Ze).pending
      );
      Y(this, Ce, et(() => t(l(this, Xe))));
    } else
      ie(this, _e, hn).call(
        this,
        /** @type {Batch} */
        C
      );
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {Batch} batch
 */
hn = function(r) {
  this.is_pending = !1, r.transfer_effects(l(this, Xr), l(this, Zr));
}, /**
 * @template T
 * @param {() => T} fn
 */
gn = function(r) {
  var t = J, n = G, a = at;
  St(l(this, Fe)), it(l(this, Fe)), Dr(l(this, Fe).ctx);
  try {
    return br.ensure(), r();
  } catch (o) {
    return Ka(o), null;
  } finally {
    St(t), it(n), Dr(a);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Gn = function(r, t) {
  var n;
  if (!this.has_pending_snippet()) {
    this.parent && ie(n = this.parent, _e, Gn).call(n, r, t);
    return;
  }
  Y(this, Wt, l(this, Wt) + r), l(this, Wt) === 0 && (ie(this, _e, hn).call(this, t), l(this, Ce) && _r(l(this, Ce), () => {
    Y(this, Ce, null);
  }), l(this, jt) && (l(this, Xe).before(l(this, jt)), Y(this, jt, null)));
}, /**
 * @param {unknown} error
 */
Jn = function(r) {
  l(this, Qe) && (Be(l(this, Qe)), Y(this, Qe, null)), l(this, Ce) && (Be(l(this, Ce)), Y(this, Ce, null)), l(this, We) && (Be(l(this, We)), Y(this, We, null));
  var t = l(this, Ze).onerror;
  let n = l(this, Ze).failed;
  var a = !1, o = !1;
  const u = () => {
    if (a) {
      Uo();
      return;
    }
    a = !0, o && Po(), l(this, We) !== null && _r(l(this, We), () => {
      Y(this, We, null);
    }), ie(this, _e, gn).call(this, () => {
      ie(this, _e, Wn).call(this);
    });
  }, f = (s) => {
    try {
      o = !0, t?.(s, u), o = !1;
    } catch (_) {
      Gt(_, l(this, Fe) && l(this, Fe).parent);
    }
    n && Y(this, We, ie(this, _e, gn).call(this, () => {
      try {
        return et(() => {
          var _ = (
            /** @type {Effect} */
            J
          );
          _.b = this, _.f |= qn, n(
            l(this, Xe),
            () => s,
            () => u
          );
        });
      } catch (_) {
        return Gt(
          _,
          /** @type {Effect} */
          l(this, Fe).parent
        ), null;
      }
    }));
  };
  Xt(() => {
    var s;
    try {
      s = this.transform_error(r);
    } catch (_) {
      Gt(_, l(this, Fe) && l(this, Fe).parent);
      return;
    }
    s !== null && typeof s == "object" && typeof /** @type {any} */
    s.then == "function" ? s.then(
      f,
      /** @param {unknown} e */
      (_) => Gt(_, l(this, Fe) && l(this, Fe).parent)
    ) : f(s);
  });
};
function is(e, r, t, n) {
  const a = ia;
  var o = e.filter((g) => !g.settled);
  if (t.length === 0 && o.length === 0) {
    n(r.map(a));
    return;
  }
  var u = (
    /** @type {Effect} */
    J
  ), f = os(), s = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((g) => g.promise)) : null;
  function _(g) {
    f();
    try {
      n(g);
    } catch (y) {
      (u.f & rt) === 0 && Gt(y, u);
    }
    xn();
  }
  if (t.length === 0) {
    s.then(() => _(r.map(a)));
    return;
  }
  var b = ri();
  function S() {
    Promise.all(t.map((g) => /* @__PURE__ */ ss(g))).then((g) => _([...r.map(a), ...g])).catch((g) => Gt(g, u)).finally(() => b());
  }
  s ? s.then(() => {
    f(), S(), xn();
  }) : S();
}
function os() {
  var e = (
    /** @type {Effect} */
    J
  ), r = G, t = at, n = (
    /** @type {Batch} */
    C
  );
  return function(o = !0) {
    St(e), it(r), Dr(t), o && (e.f & rt) === 0 && (n?.activate(), n?.apply());
  };
}
function xn(e = !0) {
  St(null), it(null), Dr(null), e && C?.deactivate();
}
function ri() {
  var e = (
    /** @type {Effect} */
    J
  ), r = (
    /** @type {Boundary} */
    e.b
  ), t = (
    /** @type {Batch} */
    C
  ), n = r.is_rendered();
  return r.update_pending_count(1, t), t.increment(n, e), (a = !1) => {
    r.update_pending_count(-1, t), t.decrement(n, e, a);
  };
}
// @__NO_SIDE_EFFECTS__
function ia(e) {
  var r = De | Le;
  return J !== null && (J.f |= Cr), {
    ctx: at,
    deps: null,
    effects: null,
    equals: za,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Se
    ),
    wv: 0,
    parent: J,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function ss(e, r, t) {
  let n = (
    /** @type {Effect | null} */
    J
  );
  n === null && Eo();
  var a = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = xr(
    /** @type {V} */
    Se
  ), u = !G, f = /* @__PURE__ */ new Map();
  return ks(() => {
    var s = (
      /** @type {Effect} */
      J
    ), _ = Ba();
    a = _.promise;
    try {
      Promise.resolve(e()).then(_.resolve, _.reject).finally(xn);
    } catch (y) {
      _.reject(y), xn();
    }
    var b = (
      /** @type {Batch} */
      C
    );
    if (u) {
      if ((s.f & yr) !== 0)
        var S = ri();
      if (
        /** @type {Boundary} */
        n.b.is_rendered()
      )
        f.get(b)?.reject(Ct), f.delete(b);
      else {
        for (const y of f.values())
          y.reject(Ct);
        f.clear();
      }
      f.set(b, _);
    }
    const g = (y, w = void 0) => {
      if (S) {
        var I = w === Ct;
        S(I);
      }
      if (!(w === Ct || (s.f & rt) !== 0)) {
        if (b.activate(), w)
          o.f |= Kt, Pr(o, w);
        else {
          (o.f & Kt) !== 0 && (o.f ^= Kt), Pr(o, y);
          for (const [m, z] of f) {
            if (f.delete(m), m === b) break;
            z.reject(Ct);
          }
        }
        b.deactivate();
      }
    };
    _.promise.then(g, (y) => g(null, y || "unknown"));
  }), la(() => {
    for (const s of f.values())
      s.reject(Ct);
  }), new Promise((s) => {
    function _(b) {
      function S() {
        b === a ? s(o) : _(a);
      }
      b.then(S, S);
    }
    _(a);
  });
}
// @__NO_SIDE_EFFECTS__
function ar(e) {
  const r = /* @__PURE__ */ ia(e);
  return yi(r), r;
}
// @__NO_SIDE_EFFECTS__
function ls(e) {
  const r = /* @__PURE__ */ ia(e);
  return r.equals = Ua, r;
}
function fs(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      Be(
        /** @type {Effect} */
        r[t]
      );
  }
}
function oa(e) {
  var r, t = J, n = e.parent;
  if (!$t && n !== null && (n.f & (rt | Ie)) !== 0)
    return qo(), e.v;
  St(n);
  try {
    e.f &= ~pr, fs(e), r = Ei(e);
  } finally {
    St(t);
  }
  return r;
}
function ni(e) {
  var r = oa(e);
  if (!e.equals(r) && (e.wv = ki(), (!C?.is_fork || e.deps === null) && (C !== null ? C.capture(e, r, !0) : e.v = r, e.deps === null))) {
    pe(e, we);
    return;
  }
  $t || (ct !== null ? (sa() || C?.is_fork) && ct.set(e, r) : ra(e));
}
function us(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac?.abort(Ct), r.teardown = xo, r.ac = null, Wr(r, 0), fa(r));
}
function ai(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && Or(r);
}
let Kn = /* @__PURE__ */ new Set();
const vr = /* @__PURE__ */ new Map();
let ii = !1;
function xr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: za,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function B(e, r) {
  const t = xr(e);
  return yi(t), t;
}
// @__NO_SIDE_EFFECTS__
function ds(e, r = !1, t = !0) {
  const n = xr(e);
  return r || (n.equals = Ua), n;
}
function p(e, r, t = !1) {
  G !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!vt || (G.f & zn) !== 0) && Ga() && (G.f & (De | wt | Yr | zn)) !== 0 && (nt === null || !Rr.call(nt, e)) && Do();
  let n = t ? $e(r) : r;
  return Pr(e, n, dn);
}
function Pr(e, r, t = null) {
  if (!e.equals(r)) {
    vr.set(e, $t ? r : e.v);
    var n = br.ensure();
    if (n.capture(e, r), (e.f & De) !== 0) {
      const a = (
        /** @type {Derived} */
        e
      );
      (e.f & Le) !== 0 && oa(a), ct === null && ra(a);
    }
    e.wv = ki(), oi(e, Le, t), J !== null && (J.f & we) !== 0 && (J.f & (_t | Qt)) === 0 && (Ke === null ? Es([e]) : Ke.push(e)), !n.is_fork && Kn.size > 0 && !ii && cs();
  }
  return r;
}
function cs() {
  ii = !1;
  for (const e of Kn)
    (e.f & we) !== 0 && pe(e, Et), tn(e) && Or(e);
  Kn.clear();
}
function zr(e) {
  p(e, e.v + 1);
}
function oi(e, r, t) {
  var n = e.reactions;
  if (n !== null)
    for (var a = n.length, o = 0; o < a; o++) {
      var u = n[o], f = u.f, s = (f & Le) === 0;
      if (s && pe(u, r), (f & De) !== 0) {
        var _ = (
          /** @type {Derived} */
          u
        );
        ct?.delete(_), (f & pr) === 0 && (f & tt && (J === null || (J.f & bn) === 0) && (u.f |= pr), oi(_, Et, t));
      } else if (s) {
        var b = (
          /** @type {Effect} */
          u
        );
        (f & wt) !== 0 && Ot !== null && Ot.add(b), t !== null ? t.push(b) : aa(b);
      }
    }
}
function $e(e) {
  if (typeof e != "object" || e === null || Hr in e)
    return e;
  const r = bo(e);
  if (r !== go && r !== po)
    return e;
  var t = /* @__PURE__ */ new Map(), n = ta(e), a = /* @__PURE__ */ B(0), o = hr, u = (f) => {
    if (hr === o)
      return f();
    var s = G, _ = hr;
    it(null), Oa(o);
    var b = f();
    return it(s), Oa(_), b;
  };
  return n && t.set("length", /* @__PURE__ */ B(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, s, _) {
        (!("value" in _) || _.configurable === !1 || _.enumerable === !1 || _.writable === !1) && Ro();
        var b = t.get(s);
        return b === void 0 ? u(() => {
          var S = /* @__PURE__ */ B(_.value);
          return t.set(s, S), S;
        }) : p(b, _.value, !0), !0;
      },
      deleteProperty(f, s) {
        var _ = t.get(s);
        if (_ === void 0) {
          if (s in f) {
            const b = u(() => /* @__PURE__ */ B(Se));
            t.set(s, b), zr(a);
          }
        } else
          p(_, Se), zr(a);
        return !0;
      },
      get(f, s, _) {
        if (s === Hr)
          return e;
        var b = t.get(s), S = s in f;
        if (b === void 0 && (!S || Vr(f, s)?.writable) && (b = u(() => {
          var y = $e(S ? f[s] : Se), w = /* @__PURE__ */ B(y);
          return w;
        }), t.set(s, b)), b !== void 0) {
          var g = i(b);
          return g === Se ? void 0 : g;
        }
        return Reflect.get(f, s, _);
      },
      getOwnPropertyDescriptor(f, s) {
        var _ = Reflect.getOwnPropertyDescriptor(f, s);
        if (_ && "value" in _) {
          var b = t.get(s);
          b && (_.value = i(b));
        } else if (_ === void 0) {
          var S = t.get(s), g = S?.v;
          if (S !== void 0 && g !== Se)
            return {
              enumerable: !0,
              configurable: !0,
              value: g,
              writable: !0
            };
        }
        return _;
      },
      has(f, s) {
        if (s === Hr)
          return !0;
        var _ = t.get(s), b = _ !== void 0 && _.v !== Se || Reflect.has(f, s);
        if (_ !== void 0 || J !== null && (!b || Vr(f, s)?.writable)) {
          _ === void 0 && (_ = u(() => {
            var g = b ? $e(f[s]) : Se, y = /* @__PURE__ */ B(g);
            return y;
          }), t.set(s, _));
          var S = i(_);
          if (S === Se)
            return !1;
        }
        return b;
      },
      set(f, s, _, b) {
        var S = t.get(s), g = s in f;
        if (n && s === "length")
          for (var y = _; y < /** @type {Source<number>} */
          S.v; y += 1) {
            var w = t.get(y + "");
            w !== void 0 ? p(w, Se) : y in f && (w = u(() => /* @__PURE__ */ B(Se)), t.set(y + "", w));
          }
        if (S === void 0)
          (!g || Vr(f, s)?.writable) && (S = u(() => /* @__PURE__ */ B(void 0)), p(S, $e(_)), t.set(s, S));
        else {
          g = S.v !== Se;
          var I = u(() => $e(_));
          p(S, I);
        }
        var m = Reflect.getOwnPropertyDescriptor(f, s);
        if (m?.set && m.set.call(b, _), !g) {
          if (n && typeof s == "string") {
            var z = (
              /** @type {Source<number>} */
              t.get("length")
            ), be = Number(s);
            Number.isInteger(be) && be >= z.v && p(z, be + 1);
          }
          zr(a);
        }
        return !0;
      },
      ownKeys(f) {
        i(a);
        var s = Reflect.ownKeys(f).filter((S) => {
          var g = t.get(S);
          return g === void 0 || g.v !== Se;
        });
        for (var [_, b] of t)
          b.v !== Se && !(_ in f) && s.push(_);
        return s;
      },
      setPrototypeOf() {
        Lo();
      }
    }
  );
}
function Ra(e) {
  try {
    if (e !== null && typeof e == "object" && Hr in e)
      return e[Hr];
  } catch {
  }
  return e;
}
function vs(e, r) {
  return Object.is(Ra(e), Ra(r));
}
var La, si, li, fi;
function _s() {
  if (La === void 0) {
    La = window, si = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    li = Vr(r, "firstChild").get, fi = Vr(r, "nextSibling").get, Ta(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Ta(t) && (t.__t = void 0);
  }
}
function Zt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Jt(e) {
  return (
    /** @type {TemplateNode | null} */
    li.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function en(e) {
  return (
    /** @type {TemplateNode | null} */
    fi.call(e)
  );
}
function x(e, r) {
  return /* @__PURE__ */ Jt(e);
}
function pt(e, r = !1) {
  {
    var t = /* @__PURE__ */ Jt(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ en(t) : t;
  }
}
function k(e, r = 1, t = !1) {
  let n = e;
  for (; r--; )
    n = /** @type {TemplateNode} */
    /* @__PURE__ */ en(n);
  return n;
}
function hs(e) {
  e.textContent = "";
}
function ui() {
  return !1;
}
function di(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(r ?? qa, e, void 0)
  );
}
let Da = !1;
function gs() {
  Da || (Da = !0, document.addEventListener(
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
function Sn(e) {
  var r = G, t = J;
  it(null), St(null);
  try {
    return e();
  } finally {
    it(r), St(t);
  }
}
function ci(e, r, t, n = t) {
  e.addEventListener(r, () => Sn(t));
  const a = e.__on_r;
  a ? e.__on_r = () => {
    a(), n(!0);
  } : e.__on_r = () => n(!0), gs();
}
function ps(e) {
  J === null && (G === null && Mo(), Ao()), $t && To();
}
function bs(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Vt(e, r) {
  var t = J;
  t !== null && (t.f & Ie) !== 0 && (e |= Ie);
  var n = {
    ctx: at,
    deps: null,
    nodes: null,
    f: e | Le | tt,
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
  C?.register_created_effect(n);
  var a = n;
  if ((e & Lr) !== 0)
    Er !== null ? Er.push(n) : br.ensure().schedule(n);
  else if (r !== null) {
    try {
      Or(n);
    } catch (u) {
      throw Be(n), u;
    }
    a.deps === null && a.teardown === null && a.nodes === null && a.first === a.last && // either `null`, or a singular child
    (a.f & Cr) === 0 && (a = a.first, (e & wt) !== 0 && (e & gr) !== 0 && a !== null && (a.f |= gr));
  }
  if (a !== null && (a.parent = t, t !== null && bs(a, t), G !== null && (G.f & De) !== 0 && (e & Qt) === 0)) {
    var o = (
      /** @type {Derived} */
      G
    );
    (o.effects ?? (o.effects = [])).push(a);
  }
  return n;
}
function sa() {
  return G !== null && !vt;
}
function la(e) {
  const r = Vt(En, null);
  return pe(r, we), r.teardown = e, r;
}
function xs(e) {
  ps();
  var r = (
    /** @type {Effect} */
    J.f
  ), t = !G && (r & _t) !== 0 && (r & yr) === 0;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      at
    );
    (n.e ?? (n.e = [])).push(e);
  } else
    return vi(e);
}
function vi(e) {
  return Vt(Lr | wo, e);
}
function ys(e) {
  br.ensure();
  const r = Vt(Qt | Cr, e);
  return (t = {}) => new Promise((n) => {
    t.outro ? _r(r, () => {
      Be(r), n(void 0);
    }) : (Be(r), n(void 0));
  });
}
function ms(e) {
  return Vt(Lr, e);
}
function ks(e) {
  return Vt(Yr | Cr, e);
}
function _i(e, r = 0) {
  return Vt(En | r, e);
}
function D(e, r = [], t = [], n = []) {
  is(n, r, t, (a) => {
    Vt(En, () => e(...a.map(i)));
  });
}
function Tn(e, r = 0) {
  var t = Vt(wt | r, e);
  return t;
}
function et(e) {
  return Vt(_t | Cr, e);
}
function hi(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = $t, n = G;
    Pa(!0), it(null);
    try {
      r.call(null);
    } finally {
      Pa(t), it(n);
    }
  }
}
function fa(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const a = t.ac;
    a !== null && Sn(() => {
      a.abort(Ct);
    });
    var n = t.next;
    (t.f & Qt) !== 0 ? t.parent = null : Be(t, r), t = n;
  }
}
function ws(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & _t) === 0 && Be(r), r = t;
  }
}
function Be(e, r = !0) {
  var t = !1;
  (r || (e.f & ko) !== 0) && e.nodes !== null && e.nodes.end !== null && (gi(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), pe(e, Aa), fa(e, r && !t), Wr(e, 0);
  var n = e.nodes && e.nodes.t;
  if (n !== null)
    for (const o of n)
      o.stop();
  hi(e), e.f ^= Aa, e.f |= rt;
  var a = e.parent;
  a !== null && a.first !== null && pi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function gi(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ en(e);
    e.remove(), e = t;
  }
}
function pi(e) {
  var r = e.parent, t = e.prev, n = e.next;
  t !== null && (t.next = n), n !== null && (n.prev = t), r !== null && (r.first === e && (r.first = n), r.last === e && (r.last = t));
}
function _r(e, r, t = !0) {
  var n = [];
  bi(e, n, !0);
  var a = () => {
    t && Be(e), r && r();
  }, o = n.length;
  if (o > 0) {
    var u = () => --o || a();
    for (var f of n)
      f.out(u);
  } else
    a();
}
function bi(e, r, t) {
  if ((e.f & Ie) === 0) {
    e.f ^= Ie;
    var n = e.nodes && e.nodes.t;
    if (n !== null)
      for (const f of n)
        (f.is_global || t) && r.push(f);
    for (var a = e.first; a !== null; ) {
      var o = a.next;
      if ((a.f & Qt) === 0) {
        var u = (a.f & gr) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (a.f & _t) !== 0 && (e.f & wt) !== 0;
        bi(a, r, u ? t : !1);
      }
      a = o;
    }
  }
}
function ua(e) {
  xi(e, !0);
}
function xi(e, r) {
  if ((e.f & Ie) !== 0) {
    e.f ^= Ie, (e.f & we) === 0 && (pe(e, Le), br.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var n = t.next, a = (t.f & gr) !== 0 || (t.f & _t) !== 0;
      xi(t, a ? r : !1), t = n;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const u of o)
        (u.is_global || r) && u.in();
  }
}
function da(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, n = e.nodes.end; t !== null; ) {
      var a = t === n ? null : /* @__PURE__ */ en(t);
      r.append(t), t = a;
    }
}
let pn = !1, $t = !1;
function Pa(e) {
  $t = e;
}
let G = null, vt = !1;
function it(e) {
  G = e;
}
let J = null;
function St(e) {
  J = e;
}
let nt = null;
function yi(e) {
  G !== null && (nt === null ? nt = [e] : nt.push(e));
}
let je = null, Ue = 0, Ke = null;
function Es(e) {
  Ke = e;
}
let mi = 1, or = 0, hr = or;
function Oa(e) {
  hr = e;
}
function ki() {
  return ++mi;
}
function tn(e) {
  var r = e.f;
  if ((r & Le) !== 0)
    return !0;
  if (r & De && (e.f &= ~pr), (r & Et) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), n = t.length, a = 0; a < n; a++) {
      var o = t[a];
      if (tn(
        /** @type {Derived} */
        o
      ) && ni(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & tt) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    ct === null && pe(e, we);
  }
  return !1;
}
function wi(e, r, t = !0) {
  var n = e.reactions;
  if (n !== null && !(nt !== null && Rr.call(nt, e)))
    for (var a = 0; a < n.length; a++) {
      var o = n[a];
      (o.f & De) !== 0 ? wi(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? pe(o, Le) : (o.f & we) !== 0 && pe(o, Et), aa(
        /** @type {Effect} */
        o
      ));
    }
}
function Ei(e) {
  var I;
  var r = je, t = Ue, n = Ke, a = G, o = nt, u = at, f = vt, s = hr, _ = e.f;
  je = /** @type {null | Value[]} */
  null, Ue = 0, Ke = null, G = (_ & (_t | Qt)) === 0 ? e : null, nt = null, Dr(e.ctx), vt = !1, hr = ++or, e.ac !== null && (Sn(() => {
    e.ac.abort(Ct);
  }), e.ac = null);
  try {
    e.f |= bn;
    var b = (
      /** @type {Function} */
      e.fn
    ), S = b();
    e.f |= yr;
    var g = e.deps, y = C?.is_fork;
    if (je !== null) {
      var w;
      if (y || Wr(e, Ue), g !== null && Ue > 0)
        for (g.length = Ue + je.length, w = 0; w < je.length; w++)
          g[Ue + w] = je[w];
      else
        e.deps = g = je;
      if (sa() && (e.f & tt) !== 0)
        for (w = Ue; w < g.length; w++)
          ((I = g[w]).reactions ?? (I.reactions = [])).push(e);
    } else !y && g !== null && Ue < g.length && (Wr(e, Ue), g.length = Ue);
    if (Ga() && Ke !== null && !vt && g !== null && (e.f & (De | Et | Le)) === 0)
      for (w = 0; w < /** @type {Source[]} */
      Ke.length; w++)
        wi(
          Ke[w],
          /** @type {Effect} */
          e
        );
    if (a !== null && a !== e) {
      if (or++, a.deps !== null)
        for (let m = 0; m < t; m += 1)
          a.deps[m].rv = or;
      if (r !== null)
        for (const m of r)
          m.rv = or;
      Ke !== null && (n === null ? n = Ke : n.push(.../** @type {Source[]} */
      Ke));
    }
    return (e.f & Kt) !== 0 && (e.f ^= Kt), S;
  } catch (m) {
    return Ka(m);
  } finally {
    e.f ^= bn, je = r, Ue = t, Ke = n, G = a, nt = o, Dr(u), vt = f, hr = s;
  }
}
function Ss(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var n = _o.call(t, e);
    if (n !== -1) {
      var a = t.length - 1;
      a === 0 ? t = r.reactions = null : (t[n] = t[a], t.pop());
    }
  }
  if (t === null && (r.f & De) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (je === null || !Rr.call(je, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & tt) !== 0 && (o.f ^= tt, o.f &= ~pr), o.v !== Se && ra(o), us(o), Wr(o, 0);
  }
}
function Wr(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var n = r; n < t.length; n++)
      Ss(e, t[n]);
}
function Or(e) {
  var r = e.f;
  if ((r & rt) === 0) {
    pe(e, we);
    var t = J, n = pn;
    J = e, pn = !0;
    try {
      (r & (wt | Va)) !== 0 ? ws(e) : fa(e), hi(e);
      var a = Ei(e);
      e.teardown = typeof a == "function" ? a : null, e.wv = mi;
      var o;
    } finally {
      pn = n, J = t;
    }
  }
}
async function Ts() {
  await Promise.resolve(), Xo();
}
function i(e) {
  var r = e.f, t = (r & De) !== 0;
  if (G !== null && !vt) {
    var n = J !== null && (J.f & rt) !== 0;
    if (!n && (nt === null || !Rr.call(nt, e))) {
      var a = G.deps;
      if ((G.f & bn) !== 0)
        e.rv < or && (e.rv = or, je === null && a !== null && a[Ue] === e ? Ue++ : je === null ? je = [e] : je.push(e));
      else {
        (G.deps ?? (G.deps = [])).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [G] : Rr.call(o, G) || o.push(G);
      }
    }
  }
  if ($t && vr.has(e))
    return vr.get(e);
  if (t) {
    var u = (
      /** @type {Derived} */
      e
    );
    if ($t) {
      var f = u.v;
      return ((u.f & we) === 0 && u.reactions !== null || Ti(u)) && (f = oa(u)), vr.set(u, f), f;
    }
    var s = (u.f & tt) === 0 && !vt && G !== null && (pn || (G.f & tt) !== 0), _ = (u.f & yr) === 0;
    tn(u) && (s && (u.f |= tt), ni(u)), s && !_ && (ai(u), Si(u));
  }
  if (ct?.has(e))
    return ct.get(e);
  if ((e.f & Kt) !== 0)
    throw e.v;
  return e.v;
}
function Si(e) {
  if (e.f |= tt, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & De) !== 0 && (r.f & tt) === 0 && (ai(
        /** @type {Derived} */
        r
      ), Si(
        /** @type {Derived} */
        r
      ));
}
function Ti(e) {
  if (e.v === Se) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (vr.has(r) || (r.f & De) !== 0 && Ti(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function Ai(e) {
  var r = vt;
  try {
    return vt = !0, e();
  } finally {
    vt = r;
  }
}
const As = ["touchstart", "touchmove"];
function Ms(e) {
  return As.includes(e);
}
const sr = Symbol("events"), Mi = /* @__PURE__ */ new Set(), Xn = /* @__PURE__ */ new Set();
function Ns(e, r, t, n = {}) {
  function a(o) {
    if (n.capture || Zn.call(r, o), !o.cancelBubble)
      return Sn(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Xt(() => {
    r.addEventListener(e, a, n);
  }) : r.addEventListener(e, a, n), a;
}
function Ca(e, r, t, n, a) {
  var o = { capture: n, passive: a }, u = Ns(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && la(() => {
    r.removeEventListener(e, u, o);
  });
}
function Re(e, r, t) {
  (r[sr] ?? (r[sr] = {}))[e] = t;
}
function Rs(e) {
  for (var r = 0; r < e.length; r++)
    Mi.add(e[r]);
  for (var t of Xn)
    t(e);
}
let Ia = null;
function Zn(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), n = e.type, a = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    a[0] || e.target
  );
  Ia = e;
  var u = 0, f = Ia === e && e[sr];
  if (f) {
    var s = a.indexOf(f);
    if (s !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[sr] = r;
      return;
    }
    var _ = a.indexOf(r);
    if (_ === -1)
      return;
    s <= _ && (u = s);
  }
  if (o = /** @type {Element} */
  a[u] || e.target, o !== r) {
    ho(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var b = G, S = J;
    it(null), St(null);
    try {
      for (var g, y = []; o !== null; ) {
        var w = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var I = o[sr]?.[n];
          I != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && I.call(o, e);
        } catch (m) {
          g ? y.push(m) : g = m;
        }
        if (e.cancelBubble || w === r || w === null)
          break;
        o = w;
      }
      if (g) {
        for (let m of y)
          queueMicrotask(() => {
            throw m;
          });
        throw g;
      }
    } finally {
      e[sr] = r, delete e.currentTarget, it(b), St(S);
    }
  }
}
const Ls = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Ds(e) {
  return (
    /** @type {string} */
    Ls?.createHTML(e) ?? e
  );
}
function Ps(e) {
  var r = di("template");
  return r.innerHTML = Ds(e.replaceAll("<!>", "<!---->")), r.content;
}
function Gr(e, r) {
  var t = (
    /** @type {Effect} */
    J
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function P(e, r) {
  var t = (r & jo) !== 0, n = (r & Bo) !== 0, a, o = !e.startsWith("<!>");
  return () => {
    a === void 0 && (a = Ps(o ? e : "<!>" + e), t || (a = /** @type {TemplateNode} */
    /* @__PURE__ */ Jt(a)));
    var u = (
      /** @type {TemplateNode} */
      n || si ? document.importNode(a, !0) : a.cloneNode(!0)
    );
    if (t) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Jt(u)
      ), s = (
        /** @type {TemplateNode} */
        u.lastChild
      );
      Gr(f, s);
    } else
      Gr(u, u);
    return u;
  };
}
function qt() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = Zt();
  return e.append(r, t), Gr(r, t), e;
}
function M(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function q(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = t, e.nodeValue = `${t}`);
}
function Os(e, r) {
  return Cs(e, r);
}
const un = /* @__PURE__ */ new Map();
function Cs(e, { target: r, anchor: t, props: n = {}, events: a, context: o, intro: u = !0, transformError: f }) {
  _s();
  var s = void 0, _ = ys(() => {
    var b = t ?? r.appendChild(Zt());
    es(
      /** @type {TemplateNode} */
      b,
      {
        pending: () => {
        }
      },
      (y) => {
        Ya({});
        var w = (
          /** @type {ComponentContext} */
          at
        );
        o && (w.c = o), a && (n.$$events = a), s = e(y, n) || {}, Wa();
      },
      f
    );
    var S = /* @__PURE__ */ new Set(), g = (y) => {
      for (var w = 0; w < y.length; w++) {
        var I = y[w];
        if (!S.has(I)) {
          S.add(I);
          var m = Ms(I);
          for (const K of [r, document]) {
            var z = un.get(K);
            z === void 0 && (z = /* @__PURE__ */ new Map(), un.set(K, z));
            var be = z.get(I);
            be === void 0 ? (K.addEventListener(I, Zn, { passive: m }), z.set(I, 1)) : z.set(I, be + 1);
          }
        }
      }
    };
    return g(wn(Mi)), Xn.add(g), () => {
      for (var y of S)
        for (const m of [r, document]) {
          var w = (
            /** @type {Map<string, number>} */
            un.get(m)
          ), I = (
            /** @type {number} */
            w.get(y)
          );
          --I == 0 ? (m.removeEventListener(y, Zn), w.delete(y), w.size === 0 && un.delete(m)) : w.set(y, I);
        }
      Xn.delete(g), b !== t && b.parentNode?.removeChild(b);
    };
  });
  return Qn.set(s, _), s;
}
let Qn = /* @__PURE__ */ new WeakMap();
function Is(e, r) {
  const t = Qn.get(e);
  return t ? (Qn.delete(e), t(r)) : Promise.resolve();
}
var dt, mt, Ge, cr, Qr, $r, kn;
class Ni {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    ut(this, "anchor");
    /** @type {Map<Batch, Key>} */
    j(this, dt, /* @__PURE__ */ new Map());
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
    j(this, mt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    j(this, Ge, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    j(this, cr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    j(this, Qr, !0);
    /**
     * @param {Batch} batch
     */
    j(this, $r, (r) => {
      if (l(this, dt).has(r)) {
        var t = (
          /** @type {Key} */
          l(this, dt).get(r)
        ), n = l(this, mt).get(t);
        if (n)
          ua(n), l(this, cr).delete(t);
        else {
          var a = l(this, Ge).get(t);
          a && (l(this, mt).set(t, a.effect), l(this, Ge).delete(t), a.fragment.lastChild.remove(), this.anchor.before(a.fragment), n = a.effect);
        }
        for (const [o, u] of l(this, dt)) {
          if (l(this, dt).delete(o), o === r)
            break;
          const f = l(this, Ge).get(u);
          f && (Be(f.effect), l(this, Ge).delete(u));
        }
        for (const [o, u] of l(this, mt)) {
          if (o === t || l(this, cr).has(o)) continue;
          const f = () => {
            if (Array.from(l(this, dt).values()).includes(o)) {
              var _ = document.createDocumentFragment();
              da(u, _), _.append(Zt()), l(this, Ge).set(o, { effect: u, fragment: _ });
            } else
              Be(u);
            l(this, cr).delete(o), l(this, mt).delete(o);
          };
          l(this, Qr) || !n ? (l(this, cr).add(o), _r(u, f, !1)) : f();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    j(this, kn, (r) => {
      l(this, dt).delete(r);
      const t = Array.from(l(this, dt).values());
      for (const [n, a] of l(this, Ge))
        t.includes(n) || (Be(a.effect), l(this, Ge).delete(n));
    });
    this.anchor = r, Y(this, Qr, t);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(r, t) {
    var n = (
      /** @type {Batch} */
      C
    ), a = ui();
    if (t && !l(this, mt).has(r) && !l(this, Ge).has(r))
      if (a) {
        var o = document.createDocumentFragment(), u = Zt();
        o.append(u), l(this, Ge).set(r, {
          effect: et(() => t(u)),
          fragment: o
        });
      } else
        l(this, mt).set(
          r,
          et(() => t(this.anchor))
        );
    if (l(this, dt).set(n, r), a) {
      for (const [f, s] of l(this, mt))
        f === r ? n.unskip_effect(s) : n.skip_effect(s);
      for (const [f, s] of l(this, Ge))
        f === r ? n.unskip_effect(s.effect) : n.skip_effect(s.effect);
      n.oncommit(l(this, $r)), n.ondiscard(l(this, kn));
    } else
      l(this, $r).call(this, n);
  }
}
dt = new WeakMap(), mt = new WeakMap(), Ge = new WeakMap(), cr = new WeakMap(), Qr = new WeakMap(), $r = new WeakMap(), kn = new WeakMap();
function te(e, r, t = !1) {
  var n = new Ni(e), a = t ? gr : 0;
  function o(u, f) {
    n.ensure(u, f);
  }
  Tn(() => {
    var u = !1;
    r((f, s = 0) => {
      u = !0, o(s, f);
    }), u || o(-1, null);
  }, a);
}
function Pt(e, r) {
  return r;
}
function Fs(e, r, t) {
  for (var n = [], a = r.length, o, u = r.length, f = 0; f < a; f++) {
    let S = r[f];
    _r(
      S,
      () => {
        if (o) {
          if (o.pending.delete(S), o.done.add(S), o.pending.size === 0) {
            var g = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            $n(e, wn(o.done)), g.delete(o), g.size === 0 && (e.outrogroups = null);
          }
        } else
          u -= 1;
      },
      !1
    );
  }
  if (u === 0) {
    var s = n.length === 0 && t !== null;
    if (s) {
      var _ = (
        /** @type {Element} */
        t
      ), b = (
        /** @type {Element} */
        _.parentNode
      );
      hs(b), b.append(_), e.items.clear();
    }
    $n(e, r, !s);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function $n(e, r, t = !0) {
  var n;
  if (e.pending.size > 0) {
    n = /* @__PURE__ */ new Set();
    for (const u of e.pending.values())
      for (const f of u)
        n.add(
          /** @type {EachItem} */
          e.items.get(f).e
        );
  }
  for (var a = 0; a < r.length; a++) {
    var o = r[a];
    if (n?.has(o)) {
      o.f |= kt;
      const u = document.createDocumentFragment();
      da(o, u);
    } else
      Be(r[a], t);
  }
}
var Fa;
function bt(e, r, t, n, a, o = null) {
  var u = e, f = /* @__PURE__ */ new Map(), s = (r & Ha) !== 0;
  if (s) {
    var _ = (
      /** @type {Element} */
      e
    );
    u = _.appendChild(Zt());
  }
  var b = null, S = /* @__PURE__ */ ls(() => {
    var K = t();
    return ta(K) ? K : K == null ? [] : wn(K);
  }), g, y = /* @__PURE__ */ new Map(), w = !0;
  function I(K) {
    (be.effect.f & rt) === 0 && (be.pending.delete(K), be.fallback = b, js(be, g, u, r, n), b !== null && (g.length === 0 ? (b.f & kt) === 0 ? ua(b) : (b.f ^= kt, Br(b, null, u)) : _r(b, () => {
      b = null;
    })));
  }
  function m(K) {
    be.pending.delete(K);
  }
  var z = Tn(() => {
    g = /** @type {V[]} */
    i(S);
    for (var K = g.length, fe = /* @__PURE__ */ new Set(), ot = (
      /** @type {Batch} */
      C
    ), ht = ui(), xe = 0; xe < K; xe += 1) {
      var Ve = g[xe], Tt = n(Ve, xe), ye = w ? null : f.get(Tt);
      ye ? (ye.v && Pr(ye.v, Ve), ye.i && Pr(ye.i, xe), ht && ot.unskip_effect(ye.e)) : (ye = Bs(
        f,
        w ? u : Fa ?? (Fa = Zt()),
        Ve,
        Tt,
        xe,
        a,
        r,
        t
      ), w || (ye.e.f |= kt), f.set(Tt, ye)), fe.add(Tt);
    }
    if (K === 0 && o && !b && (w ? b = et(() => o(u)) : (b = et(() => o(Fa ?? (Fa = Zt()))), b.f |= kt)), K > fe.size && So(), !w)
      if (y.set(ot, fe), ht) {
        for (const [gt, Ht] of f)
          fe.has(gt) || ot.skip_effect(Ht.e);
        ot.oncommit(I), ot.ondiscard(m);
      } else
        I(ot);
    i(S);
  }), be = { effect: z, items: f, pending: y, outrogroups: null, fallback: b };
  w = !1;
}
function jr(e) {
  for (; e !== null && (e.f & _t) === 0; )
    e = e.next;
  return e;
}
function js(e, r, t, n, a) {
  var o = (n & Io) !== 0, u = r.length, f = e.items, s = jr(e.effect.first), _, b = null, S, g = [], y = [], w, I, m, z;
  if (o)
    for (z = 0; z < u; z += 1)
      w = r[z], I = a(w, z), m = /** @type {EachItem} */
      f.get(I).e, (m.f & kt) === 0 && (m.nodes?.a?.measure(), (S ?? (S = /* @__PURE__ */ new Set())).add(m));
  for (z = 0; z < u; z += 1) {
    if (w = r[z], I = a(w, z), m = /** @type {EachItem} */
    f.get(I).e, e.outrogroups !== null)
      for (const ye of e.outrogroups)
        ye.pending.delete(m), ye.done.delete(m);
    if ((m.f & Ie) !== 0 && (ua(m), o && (m.nodes?.a?.unfix(), (S ?? (S = /* @__PURE__ */ new Set())).delete(m))), (m.f & kt) !== 0)
      if (m.f ^= kt, m === s)
        Br(m, null, t);
      else {
        var be = b ? b.next : s;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), zt(e, b, m), zt(e, m, be), Br(m, be, t), b = m, g = [], y = [], s = jr(b.next);
        continue;
      }
    if (m !== s) {
      if (_ !== void 0 && _.has(m)) {
        if (g.length < y.length) {
          var K = y[0], fe;
          b = K.prev;
          var ot = g[0], ht = g[g.length - 1];
          for (fe = 0; fe < g.length; fe += 1)
            Br(g[fe], K, t);
          for (fe = 0; fe < y.length; fe += 1)
            _.delete(y[fe]);
          zt(e, ot.prev, ht.next), zt(e, b, ot), zt(e, ht, K), s = K, b = ht, z -= 1, g = [], y = [];
        } else
          _.delete(m), Br(m, s, t), zt(e, m.prev, m.next), zt(e, m, b === null ? e.effect.first : b.next), zt(e, b, m), b = m;
        continue;
      }
      for (g = [], y = []; s !== null && s !== m; )
        (_ ?? (_ = /* @__PURE__ */ new Set())).add(s), y.push(s), s = jr(s.next);
      if (s === null)
        continue;
    }
    (m.f & kt) === 0 && g.push(m), b = m, s = jr(m.next);
  }
  if (e.outrogroups !== null) {
    for (const ye of e.outrogroups)
      ye.pending.size === 0 && ($n(e, wn(ye.done)), e.outrogroups?.delete(ye));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (s !== null || _ !== void 0) {
    var xe = [];
    if (_ !== void 0)
      for (m of _)
        (m.f & Ie) === 0 && xe.push(m);
    for (; s !== null; )
      (s.f & Ie) === 0 && s !== e.fallback && xe.push(s), s = jr(s.next);
    var Ve = xe.length;
    if (Ve > 0) {
      var Tt = (n & Ha) !== 0 && u === 0 ? t : null;
      if (o) {
        for (z = 0; z < Ve; z += 1)
          xe[z].nodes?.a?.measure();
        for (z = 0; z < Ve; z += 1)
          xe[z].nodes?.a?.fix();
      }
      Fs(e, xe, Tt);
    }
  }
  o && Xt(() => {
    if (S !== void 0)
      for (m of S)
        m.nodes?.a?.apply();
  });
}
function Bs(e, r, t, n, a, o, u, f) {
  var s = (u & Oo) !== 0 ? (u & Fo) === 0 ? /* @__PURE__ */ ds(t, !1, !1) : xr(t) : null, _ = (u & Co) !== 0 ? xr(a) : null;
  return {
    v: s,
    i: _,
    e: et(() => (o(r, s ?? t, _ ?? a, f), () => {
      e.delete(n);
    }))
  };
}
function Br(e, r, t) {
  if (e.nodes)
    for (var n = e.nodes.start, a = e.nodes.end, o = r && (r.f & kt) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; n !== null; ) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ en(n)
      );
      if (o.before(n), n === a)
        return;
      n = u;
    }
}
function zt(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function Bn(e, r, t = !1, n = !1, a = !1, o = !1) {
  var u = e, f = "";
  if (t)
    var s = (
      /** @type {Element} */
      e
    );
  D(() => {
    var _ = (
      /** @type {Effect} */
      J
    );
    if (f !== (f = r() ?? "")) {
      if (t) {
        _.nodes = null, s.innerHTML = /** @type {string} */
        f, f !== "" && Gr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ Jt(s),
          /** @type {TemplateNode} */
          s.lastChild
        );
        return;
      }
      if (_.nodes !== null && (gi(
        _.nodes.start,
        /** @type {TemplateNode} */
        _.nodes.end
      ), _.nodes = null), f !== "") {
        var b = n ? Vo : a ? Ho : void 0, S = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          di(n ? "svg" : a ? "math" : "template", b)
        );
        S.innerHTML = /** @type {any} */
        f;
        var g = n || a ? S : (
          /** @type {HTMLTemplateElement} */
          S.content
        );
        if (Gr(
          /** @type {TemplateNode} */
          /* @__PURE__ */ Jt(g),
          /** @type {TemplateNode} */
          g.lastChild
        ), n || a)
          for (; /* @__PURE__ */ Jt(g); )
            u.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ Jt(g)
            );
        else
          u.before(g);
      }
    }
  });
}
function Vs(e, r, t) {
  var n = new Ni(e);
  Tn(() => {
    var a = r() ?? null;
    n.ensure(a, a && ((o) => t(o, a)));
  }, gr);
}
function Ri(e) {
  var r, t, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var a = e.length;
    for (r = 0; r < a; r++) e[r] && (t = Ri(e[r])) && (n && (n += " "), n += t);
  } else for (t in e) e[t] && (n && (n += " "), n += t);
  return n;
}
function Hs() {
  for (var e, r, t = 0, n = "", a = arguments.length; t < a; t++) (e = arguments[t]) && (r = Ri(e)) && (n && (n += " "), n += r);
  return n;
}
function d(e) {
  return typeof e == "object" ? Hs(e) : e ?? "";
}
function qs(e, r, t) {
  var n = e == null ? "" : "" + e;
  return n === "" ? null : n;
}
function c(e, r, t, n, a, o) {
  var u = e.__className;
  if (u !== t || u === void 0) {
    var f = qs(t);
    f == null ? e.removeAttribute("class") : e.className = f, e.__className = t;
  }
  return o;
}
function Li(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!ta(r))
      return zo();
    for (var n of e.options)
      n.selected = r.includes(Ur(n));
    return;
  }
  for (n of e.options) {
    var a = Ur(n);
    if (vs(a, r)) {
      n.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function zs(e) {
  var r = new MutationObserver(() => {
    Li(e, e.__value);
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
  }), la(() => {
    r.disconnect();
  });
}
function Us(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet(), a = !0;
  ci(e, "change", (o) => {
    var u = o ? "[selected]" : ":checked", f;
    if (e.multiple)
      f = [].map.call(e.querySelectorAll(u), Ur);
    else {
      var s = e.querySelector(u) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      f = s && Ur(s);
    }
    t(f), e.__value = f, C !== null && n.add(C);
  }), ms(() => {
    var o = r();
    if (e === document.activeElement) {
      var u = (
        /** @type {Batch} */
        C
      );
      if (n.has(u))
        return;
    }
    if (Li(e, o, a), a && o === void 0) {
      var f = e.querySelector(":checked");
      f !== null && (o = Ur(f), t(o));
    }
    e.__value = o, a = !1;
  }), zs(e);
}
function Ur(e) {
  return "__value" in e ? e.__value : e.value;
}
const Ys = Symbol("is custom element"), Ws = Symbol("is html");
function Gs(e, r) {
  var t = Js(e);
  t.checked !== (t.checked = // treat null and undefined the same for the initial value
  r ?? void 0) && (e.checked = r);
}
function Js(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [Ys]: e.nodeName.includes("-"),
      [Ws]: e.namespaceURI === qa
    })
  );
}
function Ut(e, r, t = r) {
  var n = /* @__PURE__ */ new WeakSet();
  ci(e, "input", async (a) => {
    var o = a ? e.defaultValue : e.value;
    if (o = Vn(e) ? Hn(o) : o, t(o), C !== null && n.add(C), await Ts(), o !== (o = r())) {
      var u = e.selectionStart, f = e.selectionEnd, s = e.value.length;
      if (e.value = o ?? "", f !== null) {
        var _ = e.value.length;
        u === f && f === s && _ > s ? (e.selectionStart = _, e.selectionEnd = _) : (e.selectionStart = u, e.selectionEnd = Math.min(f, _));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ai(r) == null && e.value && (t(Vn(e) ? Hn(e.value) : e.value), C !== null && n.add(C)), _i(() => {
    var a = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        C
      );
      if (n.has(o))
        return;
    }
    Vn(e) && a === Hn(e.value) || e.type === "date" && !a && !e.value || a !== e.value && (e.value = a ?? "");
  });
}
function Vn(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function Hn(e) {
  return e === "" ? null : +e;
}
const Ks = "5";
var ja;
typeof window < "u" && ((ja = window.__svelte ?? (window.__svelte = {})).v ?? (ja.v = /* @__PURE__ */ new Set())).add(Ks);
var Xs = /* @__PURE__ */ P("<div><span> </span> <div><div> </div> <div> </div></div></div>"), Zs = /* @__PURE__ */ P("<p>Select at least one token to view balances</p>"), Qs = /* @__PURE__ */ P("<div><h3>Vault Balances</h3> <div><!> <!></div> <p>On-chain ledger balances for the vault canister</p></div>"), $s = /* @__PURE__ */ P("<span>Copied!</span>"), el = /* @__PURE__ */ P("<div><span>Last Refresh:</span> <span> </span></div>"), tl = /* @__PURE__ */ P('<label><input type="checkbox"/> <span> </span></label>'), rl = /* @__PURE__ */ P("<div><h3>Active Tokens</h3> <div></div></div>"), nl = /* @__PURE__ */ P("<div><div> </div> <div><span>Ledger:</span> <button> </button></div> <div><span>Indexer:</span> <button> </button></div></div>"), al = /* @__PURE__ */ P("<div><h3>Ledger Canisters</h3> <div></div></div>"), il = /* @__PURE__ */ P('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), ol = /* @__PURE__ */ P("<div> </div>"), sl = /* @__PURE__ */ P("<button> </button>"), ll = /* @__PURE__ */ P("<span>✓</span>"), fl = /* @__PURE__ */ P("<button> </button> <!>", 1), ul = /* @__PURE__ */ P("<span>N/A</span>"), dl = /* @__PURE__ */ P("<span>✓</span>"), cl = /* @__PURE__ */ P("<button> </button> <!>", 1), vl = /* @__PURE__ */ P("<span>N/A</span>"), _l = /* @__PURE__ */ P("<button> </button>"), hl = /* @__PURE__ */ P("<span>N/A</span>"), gl = /* @__PURE__ */ P("<tr><td> </td><td><span> </span></td><td><!></td><td><!></td><td> </td><td><!></td><td><span> </span></td></tr>"), pl = /* @__PURE__ */ P('<tr><td colspan="7">No transactions found</td></tr>'), bl = /* @__PURE__ */ P("<span>…</span>"), xl = /* @__PURE__ */ P("<button> </button>"), yl = /* @__PURE__ */ P("<div><span> </span> <div><button>Prev</button> <!> <button>Next</button></div></div>"), ml = /* @__PURE__ */ P("<div><h2>Transaction History</h2> <div><table><thead><tr><th>ID</th><th>Token</th><th>From</th><th>To</th><th>Amount</th><th>When</th><th>Type</th></tr></thead><tbody></tbody></table></div> <!></div>"), kl = /* @__PURE__ */ P("<option> </option>"), wl = /* @__PURE__ */ P('<div><h2>Transfer Tokens (Admin Only)</h2> <form><div><label for="v-token">Token</label> <select id="v-token"></select></div> <div><label for="v-to">Recipient Principal</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/></div> <div><label for="v-amount"> </label> <input id="v-amount" type="number" placeholder="100000000"/></div> <div><label for="v-to-sub">To Subaccount (optional, 64-char hex)</label> <input id="v-to-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <div><label for="v-from-sub">From Subaccount (optional, 64-char hex)</label> <input id="v-from-sub" type="text" placeholder="0000000000000000000000000000000000000000000000000000000000000000"/></div> <button type="submit"> </button></form></div>'), El = /* @__PURE__ */ P("<button> </button>"), Sl = /* @__PURE__ */ P('<input type="text" placeholder="Enter principal ID"/>'), Tl = /* @__PURE__ */ P('<input type="text" placeholder="Enter invoice ID"/>'), Al = /* @__PURE__ */ P('<input type="text" placeholder="Enter 64-char hex subaccount"/>'), Ml = /* @__PURE__ */ P("<div><span> </span> <div><div> </div> <div> </div></div></div>"), Nl = /* @__PURE__ */ P("<p>No balances found for this subaccount.</p>"), Rl = /* @__PURE__ */ P("<div><div><div><span>Account:</span> <span> </span></div> <button> </button></div> <div></div> <!></div>"), Ll = /* @__PURE__ */ P(`<div><h2>Subaccount Lookup</h2> <p>Look up token balances for a user (by principal) or an invoice (by ID).
					The subaccount is derived using the <code>usr_</code> / <code>inv_</code> prefix convention.</p> <div></div> <form><!> <button type="submit"><!> </button></form> <!></div>`), Dl = /* @__PURE__ */ P("<div> </div>"), Pl = /* @__PURE__ */ P("<div><div> </div> <div> </div> <!></div>"), Ol = /* @__PURE__ */ P("<div></div>"), Cl = /* @__PURE__ */ P("<p>No balances found in system</p>"), Il = /* @__PURE__ */ P("<p> </p>"), Fl = /* @__PURE__ */ P("<p>No transfer data available</p>"), jl = /* @__PURE__ */ P('<div><h2>Vault Admin</h2> <div><button><!> </button></div> <div><h3>Auto-refresh settings</h3> <p>The Vault will only run an expensive full refresh on load if the last refresh is older than this threshold.</p> <div><label for="v-refresh-age">Max refresh age:</label> <input id="v-refresh-age" type="number" min="1"/> <span>minutes</span> <button>Save</button></div></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>'), Bl = /* @__PURE__ */ P("<div><div><h1>Vault</h1> <button><!> </button></div> <!> <div><div><span>Vault Principal:</span> <button> </button> <!></div> <!></div> <!> <!> <!> <nav></nav> <div><!></div></div>");
function Vl(e, r) {
  Ya(r, !0);
  const t = r.ctx.theme?.cn ?? ((...v) => v.filter(Boolean).join(" ")), n = 3600 * 1e3, a = "vault_settings", o = "vault_last_refresh";
  let u = /* @__PURE__ */ B("transactions"), f = /* @__PURE__ */ B(!1), s = /* @__PURE__ */ B(""), _ = /* @__PURE__ */ B(""), b = /* @__PURE__ */ B(""), S = /* @__PURE__ */ B(""), g = /* @__PURE__ */ B($e({})), y = /* @__PURE__ */ B($e({})), w = /* @__PURE__ */ B($e({})), I = /* @__PURE__ */ B(!1), m = /* @__PURE__ */ B($e([])), z = /* @__PURE__ */ B(null), be = /* @__PURE__ */ B($e([])), K = /* @__PURE__ */ B(null), fe = /* @__PURE__ */ B(0);
  const ot = 10;
  let ht = /* @__PURE__ */ B(!1), xe = /* @__PURE__ */ B(null), Ve = /* @__PURE__ */ B(""), Tt = /* @__PURE__ */ B($e(An())), ye = /* @__PURE__ */ B($e(Math.round(An().maxRefreshAgeMs / 6e4))), gt = /* @__PURE__ */ B(""), Ht = /* @__PURE__ */ B(""), mr = /* @__PURE__ */ B(0), Ir = /* @__PURE__ */ B(""), Fr = /* @__PURE__ */ B(""), er = /* @__PURE__ */ B("user"), rn = /* @__PURE__ */ B(""), nn = /* @__PURE__ */ B(""), an = /* @__PURE__ */ B(""), At = /* @__PURE__ */ B(null), kr = /* @__PURE__ */ B(!1), wr = /* @__PURE__ */ ar(() => Object.keys(i(g))), ca = /* @__PURE__ */ ar(() => Object.values(i(y)).some(Boolean));
  function va(v) {
    return typeof v == "string" ? JSON.parse(v) : v;
  }
  function on(v) {
    return v && typeof v == "object" && v.success === !0 && v.data != null ? v.data : v;
  }
  function Di(v) {
    return i(g)[v]?.name ?? v;
  }
  function An() {
    try {
      const v = localStorage.getItem(a);
      if (v) {
        const h = JSON.parse(v);
        if (typeof h.maxRefreshAgeMs == "number" && h.maxRefreshAgeMs > 0)
          return { maxRefreshAgeMs: h.maxRefreshAgeMs };
      }
    } catch {
    }
    return { maxRefreshAgeMs: n };
  }
  function Pi(v) {
    try {
      localStorage.setItem(a, JSON.stringify(v));
    } catch {
    }
  }
  function Oi() {
    const v = Math.max(1, Math.round(i(ye) || 1));
    p(Tt, { maxRefreshAgeMs: v * 6e4 }, !0), Pi(i(Tt));
  }
  function _a() {
    try {
      const v = localStorage.getItem(o);
      if (v) {
        const h = JSON.parse(v);
        if (h && typeof h.timestamp == "number" && h.balances)
          return { timestamp: h.timestamp, balances: h.balances };
      }
    } catch {
    }
    return null;
  }
  function Ci(v, h) {
    try {
      localStorage.setItem(o, JSON.stringify({ timestamp: v, balances: h }));
    } catch {
    }
  }
  async function tr(v) {
    try {
      await navigator.clipboard.writeText(v), p(Ve, v, !0), setTimeout(() => p(Ve, ""), 2e3);
    } catch {
    }
  }
  function ha(v) {
    const h = Math.floor((Date.now() - v.getTime()) / 1e3);
    if (h < 60) return `${h}s ago`;
    const E = Math.floor(h / 60);
    if (E < 60) return `${E}m ago`;
    const A = Math.floor(E / 60);
    return A < 24 ? `${A}h ago` : `${Math.floor(A / 24)}d ago`;
  }
  function Ii(v) {
    const h = String(v);
    if (h.includes("T") || h.includes("-") || h.includes(":")) return new Date(h);
    try {
      return new Date(Number(BigInt(h) / BigInt(1e6)));
    } catch {
      return /* @__PURE__ */ new Date();
    }
  }
  function ga(v, h) {
    return (v / Math.pow(10, h)).toFixed(h);
  }
  function pa(v, h = 20) {
    return v.length > h ? `${v.substring(0, h)}…` : v;
  }
  async function Fi() {
    try {
      const h = on(await r.ctx.callSync("get_active_tokens", {}))?.ActiveTokens || [], E = {}, A = {}, O = {};
      for (const F of h) {
        const H = F.symbol || F.name, X = F.ledger_canister_id ?? F.ledger ?? "", re = F.indexer_canister_id ?? F.indexer ?? "";
        H && (E[H] = {
          ledger: X,
          indexer: re,
          decimals: F.decimals || 8,
          symbol: H,
          name: F.name
        }, A[H] = !0, O[H] = 0);
      }
      p(g, E, !0), p(y, A, !0), p(w, O, !0);
      const L = _a();
      if (L && L.balances) {
        for (const F of Object.keys(E))
          F in L.balances && (O[F] = L.balances[F]);
        p(w, O, !0), p(xe, new Date(L.timestamp), !0);
      }
      const U = Object.keys(E);
      U.length > 0 && !i(gt) && p(gt, U[0], !0), p(I, !0);
    } catch (v) {
      console.error("Failed to load tokens:", v);
    }
  }
  async function Mn() {
    p(f, !0), p(s, ""), p(_, "");
    try {
      i(b) || p(b, r.ctx.principal || "", !0);
      const v = await r.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), h = va(v);
      if (h?.success && h?.data?.objectsListPaginated) {
        const E = h.data.objectsListPaginated;
        p(z, E.pagination, !0), p(m, E.objects.map((A) => JSON.parse(A)), !0);
      } else
        p(m, [], !0), p(z, null);
    } catch (v) {
      const h = r.ctx.ui?.accessDeniedOperation?.(v);
      h != null ? (p(_, h, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(f, !1);
    }
  }
  async function sn(v = i(fe)) {
    p(f, !0), p(s, ""), p(_, "");
    try {
      if (!i(S))
        try {
          if (typeof r.ctx.backend.get_canister_id == "function") {
            const A = await r.ctx.backend.get_canister_id();
            p(S, A || "", !0);
          }
        } catch {
          p(S, "");
        }
      const h = await r.ctx.backend.get_objects_paginated("WalletTransfer", v, ot, "desc"), E = va(h);
      if (E?.success && E?.data?.objectsListPaginated) {
        const A = E.data.objectsListPaginated;
        p(K, A.pagination, !0), p(be, A.objects.map((O) => JSON.parse(O)), !0);
      } else
        p(be, [], !0);
    } catch (h) {
      const E = r.ctx.ui?.accessDeniedOperation?.(h);
      E != null ? (p(_, E, !0), p(s, "")) : (p(_, ""), p(s, h?.message ?? String(h), !0));
    } finally {
      p(f, !1);
    }
  }
  function ji(v) {
    return i(wr).find((h) => i(g)[h]?.name === v);
  }
  function Bi(v) {
    for (const [h, E] of Object.entries(v)) {
      const A = ji(h) || h;
      i(g)[A] && (i(w)[A] = E?.balance || 0);
    }
    p(w, { ...i(w) }, !0);
  }
  async function Vi() {
    try {
      typeof r.ctx.backend.get_canister_id == "function" && p(S, await r.ctx.backend.get_canister_id() || i(S), !0);
    } catch {
    }
  }
  async function Nn() {
    p(f, !0), p(s, ""), p(_, "");
    try {
      const v = on(await r.ctx.callAsync("refresh", {}));
      if (v?.TransactionSummary == null) {
        p(s, "Failed to sync vault transactions");
        return;
      }
      Bi(v.TransactionSummary.per_token || {}), await Vi(), p(xe, /* @__PURE__ */ new Date(), !0), Ci(i(xe).getTime(), i(w)), await Promise.all([Mn(), sn(0)]);
    } catch (v) {
      const h = r.ctx.ui?.accessDeniedOperation?.(v);
      h != null ? (p(_, h, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(f, !1);
    }
  }
  async function Hi() {
    if (!i(Ht) || i(mr) <= 0) {
      p(s, "Please enter valid recipient and amount");
      return;
    }
    p(f, !0), p(s, ""), p(_, "");
    try {
      const v = {
        to_principal: i(Ht),
        amount: i(mr)
      };
      i(Ir).trim() && (v.to_subaccount = i(Ir).trim()), i(Fr).trim() && (v.from_subaccount = i(Fr).trim()), i(gt) && (v.token = Di(i(gt))), on(await r.ctx.callAsync("transfer", v)), p(Ht, ""), p(mr, 0), p(Ir, ""), p(Fr, ""), await Mn(), await sn();
    } catch (v) {
      const h = r.ctx.ui?.accessDeniedOperation?.(v);
      h != null ? (p(_, h, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(f, !1);
    }
  }
  async function qi() {
    p(kr, !0), p(At, null), p(s, ""), p(_, "");
    try {
      const v = {};
      if (i(er) === "user" && i(rn).trim())
        v.principal = i(rn).trim();
      else if (i(er) === "invoice" && i(nn).trim())
        v.invoice_id = i(nn).trim();
      else if (i(er) === "raw" && i(an).trim())
        v.subaccount_hex = i(an).trim();
      else {
        p(s, "Please enter a value to look up"), p(kr, !1);
        return;
      }
      const h = on(await r.ctx.callAsync("lookup_balance", v));
      h?.LookupBalance ? p(At, h.LookupBalance, !0) : p(s, "Lookup failed");
    } catch (v) {
      const h = r.ctx.ui?.accessDeniedOperation?.(v);
      h != null ? (p(_, h, !0), p(s, "")) : (p(_, ""), p(s, v?.message ?? String(v), !0));
    } finally {
      p(kr, !1);
    }
  }
  async function Rn(v) {
    p(fe, v, !0), await sn(v);
  }
  function zi(v, h) {
    if (v <= 7) return Array.from({ length: v }, (A, O) => O);
    const E = [0];
    h > 3 && E.push("...");
    for (let A = Math.max(1, h - 1); A <= Math.min(v - 2, h + 1); A++) E.push(A);
    return h < v - 4 && E.push("..."), E.push(v - 1), E;
  }
  const Ui = [
    { id: "transactions", label: "Transactions" },
    { id: "transfer", label: "Transfer" },
    { id: "lookup", label: "Lookup" },
    { id: "admin", label: "Admin" }
  ], Ln = '<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>';
  xs(() => {
    (async () => {
      await Fi();
      const v = An(), h = _a(), E = Date.now();
      !h || E - h.timestamp > v.maxRefreshAgeMs ? await Nn() : await Promise.all([Mn(), sn(0)]);
    })();
  });
  var Dn = Bl(), Pn = x(Dn), ba = x(Pn), ln = k(ba, 2), xa = x(ln);
  {
    var Yi = (v) => {
      var h = qt(), E = pt(h);
      Bn(E, () => Ln), M(v, h);
    };
    te(xa, (v) => {
      (i(f) || i(ht)) && v(Yi);
    });
  }
  var Wi = k(xa), ya = k(Pn, 2);
  {
    var Gi = (v) => {
      var h = Qs(), E = x(h), A = k(E, 2), O = x(A);
      bt(O, 17, () => i(wr), Pt, (H, X) => {
        var re = qt(), he = pt(re);
        {
          var Te = (ke) => {
            var Ae = Xs(), Me = x(Ae), He = x(Me), Pe = k(Me, 2), N = x(Pe), T = x(N), R = k(N, 2), oe = x(R);
            D(
              (W, $, ne, ue, ce, ve, V) => {
                c(Ae, 1, W), c(Me, 1, $), q(He, i(g)[i(X)].symbol), c(Pe, 1, ne), c(N, 1, ue), q(T, ce), c(R, 1, ve), q(oe, `${V ?? ""} units`);
              },
              [
                () => d(t("flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-lg p-3")),
                () => d(t("text-base font-semibold text-indigo-900 dark:text-indigo-200")),
                () => d(t("text-right")),
                () => d(t("text-xl font-bold text-indigo-900 dark:text-indigo-100")),
                () => ga(i(w)[i(X)] || 0, i(g)[i(X)].decimals),
                () => d(t("text-xs text-indigo-600 dark:text-indigo-400")),
                () => (i(w)[i(X)] || 0).toLocaleString()
              ]
            ), M(ke, Ae);
          };
          te(he, (ke) => {
            i(y)[i(X)] && ke(Te);
          });
        }
        M(H, re);
      });
      var L = k(O, 2);
      {
        var U = (H) => {
          var X = Zs();
          D((re) => c(X, 1, re), [() => d(t("text-sm text-gray-500 italic"))]), M(H, X);
        };
        te(L, (H) => {
          i(ca) || H(U);
        });
      }
      var F = k(A, 2);
      D(
        (H, X, re, he) => {
          c(h, 1, H), c(E, 1, X), c(A, 1, re), c(F, 1, he);
        },
        [
          () => d(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => d(t("text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3")),
          () => d(t("space-y-2")),
          () => d(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), M(v, h);
    };
    te(ya, (v) => {
      i(I) && v(Gi);
    });
  }
  var On = k(ya, 2), Cn = x(On), ma = x(Cn), fn = k(ma, 2), Ji = x(fn), Ki = k(fn, 2);
  {
    var Xi = (v) => {
      var h = $s();
      D((E) => c(h, 1, E), [
        () => d(t("text-xs text-green-600 dark:text-green-400"))
      ]), M(v, h);
    };
    te(Ki, (v) => {
      i(Ve) === i(S) && i(S) && v(Xi);
    });
  }
  var Zi = k(Cn, 2);
  {
    var Qi = (v) => {
      var h = el(), E = x(h), A = k(E, 2), O = x(A);
      D(
        (L, U, F, H) => {
          c(E, 1, L), c(A, 1, U), q(O, `${F ?? ""} (${H ?? ""})`);
        },
        [
          () => d(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
          () => d(t("ml-2 text-sm text-gray-700 dark:text-gray-300")),
          () => i(xe).toLocaleString(),
          () => ha(i(xe))
        ]
      ), M(v, h);
    };
    te(Zi, (v) => {
      i(xe) && v(Qi);
    });
  }
  var ka = k(On, 2);
  {
    var $i = (v) => {
      var h = rl(), E = x(h), A = k(E, 2);
      bt(A, 21, () => i(wr), Pt, (O, L) => {
        var U = tl(), F = x(U), H = k(F, 2), X = x(H);
        D(
          (re, he, Te) => {
            c(U, 1, re), Gs(F, i(y)[i(L)]), c(F, 1, he), c(H, 1, Te), q(X, i(g)[i(L)].symbol);
          },
          [
            () => d(t("flex items-center gap-2 cursor-pointer")),
            () => d(t("w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500")),
            () => d(t("text-sm font-medium text-gray-700 dark:text-gray-300"))
          ]
        ), Re("change", F, () => {
          i(y)[i(L)] = !i(y)[i(L)], p(y, { ...i(y) }, !0);
        }), M(O, U);
      }), D(
        (O, L, U) => {
          c(h, 1, O), c(E, 1, L), c(A, 1, U);
        },
        [
          () => d(t("bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4")),
          () => d(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => d(t("flex flex-wrap gap-4"))
        ]
      ), M(v, h);
    };
    te(ka, (v) => {
      i(I) && i(wr).length > 0 && v($i);
    });
  }
  var wa = k(ka, 2);
  {
    var eo = (v) => {
      var h = al(), E = x(h), A = k(E, 2);
      bt(A, 21, () => i(wr), Pt, (O, L) => {
        var U = qt(), F = pt(U);
        {
          var H = (X) => {
            var re = nl(), he = x(re), Te = x(he), ke = k(he, 2), Ae = x(ke), Me = k(Ae, 2), He = x(Me), Pe = k(ke, 2), N = x(Pe), T = k(N, 2), R = x(T);
            D(
              (oe, W, $, ne, ue, ce, ve, V) => {
                c(re, 1, oe), c(he, 1, W), q(Te, i(g)[i(L)].symbol), c(ke, 1, $), c(Ae, 1, ne), c(Me, 1, ue), q(He, i(g)[i(L)].ledger), c(Pe, 1, ce), c(N, 1, ve), c(T, 1, V), q(R, i(g)[i(L)].indexer);
              },
              [
                () => d(t("border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0")),
                () => d(t("text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1")),
                () => d(t("flex items-center justify-between text-xs")),
                () => d(t("text-gray-600 dark:text-gray-400")),
                () => d(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
                () => d(t("flex items-center justify-between text-xs mt-1")),
                () => d(t("text-gray-600 dark:text-gray-400")),
                () => d(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
              ]
            ), Re("click", Me, () => tr(i(g)[i(L)].ledger)), Re("click", T, () => tr(i(g)[i(L)].indexer)), M(X, re);
          };
          te(F, (X) => {
            i(y)[i(L)] && X(H);
          });
        }
        M(O, U);
      }), D(
        (O, L, U) => {
          c(h, 1, O), c(E, 1, L), c(A, 1, U);
        },
        [
          () => d(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4")),
          () => d(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => d(t("space-y-2"))
        ]
      ), M(v, h);
    };
    te(wa, (v) => {
      i(I) && i(ca) && v(eo);
    });
  }
  var Ea = k(wa, 2);
  {
    var to = (v) => {
      var h = qt(), E = pt(h);
      {
        var A = (L) => {
          var U = qt(), F = pt(U);
          Vs(F, () => r.ctx.ui.AccessDenied, (H, X) => {
            X(H, {
              get operation() {
                return i(_);
              }
            });
          }), M(L, U);
        }, O = (L) => {
          var U = il();
          M(L, U);
        };
        te(E, (L) => {
          r.ctx.ui?.AccessDenied ? L(A) : L(O, -1);
        });
      }
      M(v, h);
    }, ro = (v) => {
      var h = ol(), E = x(h);
      D(
        (A) => {
          c(h, 1, A), q(E, i(s));
        },
        [
          () => d(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300"))
        ]
      ), M(v, h);
    };
    te(Ea, (v) => {
      i(_) ? v(to) : i(s) && v(ro, 1);
    });
  }
  var In = k(Ea, 2);
  bt(In, 21, () => Ui, Pt, (v, h) => {
    var E = sl(), A = x(E);
    D(
      (O) => {
        c(E, 1, O), q(A, i(h).label);
      },
      [
        () => d(t("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", i(u) === i(h).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Re("click", E, () => {
      p(u, i(h).id, !0);
    }), M(v, E);
  });
  var no = k(In, 2), ao = x(no);
  {
    var io = (v) => {
      var h = ml(), E = x(h), A = k(E, 2), O = x(A), L = x(O), U = x(L), F = x(U), H = k(F), X = k(H), re = k(X), he = k(re), Te = k(he), ke = k(Te), Ae = k(L);
      bt(
        Ae,
        21,
        () => i(be),
        (N) => N._id || N.tx_id || Math.random(),
        (N, T) => {
          var R = gl(), oe = x(R), W = x(oe), $ = k(oe), ne = x($), ue = x(ne), ce = k($), ve = x(ce);
          {
            var V = (ae) => {
              var ge = fl(), le = pt(ge), Rt = x(le), Lt = k(le, 2);
              {
                var Dt = (Oe) => {
                  var ze = ll();
                  D((rr) => c(ze, 1, rr), [() => d(t("ml-1 text-xs text-green-600"))]), M(Oe, ze);
                };
                te(Lt, (Oe) => {
                  i(Ve) === i(T).principal_from && Oe(Dt);
                });
              }
              D(
                (Oe, ze) => {
                  c(le, 1, Oe), q(Rt, ze);
                },
                [
                  () => d(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => pa(i(T).principal_from)
                ]
              ), Re("click", le, () => tr(i(T).principal_from)), M(ae, ge);
            }, Z = (ae) => {
              var ge = ul();
              D((le) => c(ge, 1, le), [() => d(t("text-gray-400"))]), M(ae, ge);
            };
            te(ve, (ae) => {
              i(T).principal_from ? ae(V) : ae(Z, -1);
            });
          }
          var ee = k(ce), Q = x(ee);
          {
            var de = (ae) => {
              var ge = cl(), le = pt(ge), Rt = x(le), Lt = k(le, 2);
              {
                var Dt = (Oe) => {
                  var ze = dl();
                  D((rr) => c(ze, 1, rr), [() => d(t("ml-1 text-xs text-green-600"))]), M(Oe, ze);
                };
                te(Lt, (Oe) => {
                  i(Ve) === i(T).principal_to && Oe(Dt);
                });
              }
              D(
                (Oe, ze) => {
                  c(le, 1, Oe), q(Rt, ze);
                },
                [
                  () => d(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left")),
                  () => pa(i(T).principal_to)
                ]
              ), Re("click", le, () => tr(i(T).principal_to)), M(ae, ge);
            }, se = (ae) => {
              var ge = vl();
              D((le) => c(ge, 1, le), [() => d(t("text-gray-400"))]), M(ae, ge);
            };
            te(Q, (ae) => {
              i(T).principal_to ? ae(de) : ae(se, -1);
            });
          }
          var Ee = k(ee), Ne = x(Ee), st = k(Ee), lt = x(st);
          {
            var Mt = (ae) => {
              const ge = /* @__PURE__ */ ar(() => Ii(i(T).timestamp));
              var le = _l(), Rt = x(le);
              D(
                (Lt, Dt) => {
                  c(le, 1, Lt), q(Rt, Dt);
                },
                [
                  () => d(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                  () => ha(i(ge))
                ]
              ), Re("click", le, () => tr(i(ge).toLocaleString())), M(ae, le);
            }, ft = (ae) => {
              var ge = hl();
              D((le) => c(ge, 1, le), [() => d(t("text-gray-400"))]), M(ae, ge);
            };
            te(lt, (ae) => {
              i(T).timestamp ? ae(Mt) : ae(ft, -1);
            });
          }
          var qe = k(st), Je = x(qe), Nt = x(Je);
          D(
            (ae, ge, le, Rt, Lt, Dt, Oe, ze, rr, fo, uo) => {
              c(R, 1, ae), c(oe, 1, ge), q(W, i(T).tx_id || i(T)._id), c($, 1, le), c(ne, 1, Rt), q(ue, i(T).token || "—"), c(ce, 1, Lt), c(ee, 1, Dt), c(Ee, 1, Oe), q(Ne, ze), c(st, 1, rr), c(qe, 1, fo), c(Je, 1, uo), q(Nt, i(T).kind || "transfer");
            },
            [
              () => d(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
              () => d(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => d(t("px-4 py-3")),
              () => d(t("px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded text-xs font-medium")),
              () => d(t("px-4 py-3 font-mono text-xs")),
              () => d(t("px-4 py-3 font-mono text-xs")),
              () => d(t("px-4 py-3 text-gray-700 dark:text-gray-300")),
              () => (i(T).amount || 0).toLocaleString(),
              () => d(t("px-4 py-3")),
              () => d(t("px-4 py-3")),
              () => d(t("px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs"))
            ]
          ), M(N, R);
        },
        (N) => {
          var T = pl(), R = x(T);
          D((oe) => c(R, 1, oe), [
            () => d(t("px-4 py-8 text-center text-gray-500 dark:text-gray-400"))
          ]), M(N, T);
        }
      );
      var Me = k(A, 2);
      {
        var He = (N) => {
          var T = yl(), R = x(T), oe = x(R), W = k(R, 2), $ = x(W), ne = k($, 2);
          bt(ne, 17, () => zi(Number(i(K).total_pages), i(fe)), Pt, (ce, ve) => {
            var V = qt(), Z = pt(V);
            {
              var ee = (de) => {
                var se = bl();
                D((Ee) => c(se, 1, Ee), [() => d(t("px-1.5 text-xs text-gray-400"))]), M(de, se);
              }, Q = (de) => {
                var se = xl(), Ee = x(se);
                D(
                  (Ne) => {
                    c(se, 1, Ne), q(Ee, i(ve) + 1);
                  },
                  [
                    () => d(t("px-2.5 py-1 text-xs border rounded", i(fe) === i(ve) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                  ]
                ), Re("click", se, () => Rn(i(ve))), M(de, se);
              };
              te(Z, (de) => {
                i(ve) === "..." ? de(ee) : de(Q, -1);
              });
            }
            M(ce, V);
          });
          var ue = k(ne, 2);
          D(
            (ce, ve, V, Z, ee, Q) => {
              c(T, 1, ce), c(R, 1, ve), q(oe, `${i(be).length ?? ""} of ${i(K).total_items_count ?? ""} (Page ${i(fe) + 1} / ${i(K).total_pages ?? ""})`), c(W, 1, V), $.disabled = i(fe) === 0, c($, 1, Z), ue.disabled = ee, c(ue, 1, Q);
            },
            [
              () => d(t("p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between")),
              () => d(t("text-xs text-gray-500 dark:text-gray-400")),
              () => d(t("flex items-center gap-1")),
              () => d(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
              () => i(fe) >= Number(i(K).total_pages) - 1,
              () => d(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
            ]
          ), Re("click", $, () => Rn(i(fe) - 1)), Re("click", ue, () => Rn(i(fe) + 1)), M(N, T);
        }, Pe = /* @__PURE__ */ ar(() => i(K) && Number(i(K).total_pages) > 1);
        te(Me, (N) => {
          i(Pe) && N(He);
        });
      }
      D(
        (N, T, R, oe, W, $, ne, ue, ce, ve, V, Z, ee) => {
          c(h, 1, N), c(E, 1, T), c(A, 1, R), c(O, 1, oe), c(L, 1, W), c(F, 1, $), c(H, 1, ne), c(X, 1, ue), c(re, 1, ce), c(he, 1, ve), c(Te, 1, V), c(ke, 1, Z), c(Ae, 1, ee);
        },
        [
          () => d(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden")),
          () => d(t("text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100")),
          () => d(t("overflow-x-auto")),
          () => d(t("w-full text-sm")),
          () => d(t("bg-gray-50 dark:bg-gray-700/50")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
          () => d(t("divide-y divide-gray-100 dark:divide-gray-700"))
        ]
      ), M(v, h);
    }, oo = (v) => {
      var h = wl(), E = x(h), A = k(E, 2), O = x(A), L = x(O), U = k(L, 2);
      bt(U, 21, () => i(wr), Pt, (W, $) => {
        var ne = kl(), ue = x(ne), ce = {};
        D(() => {
          q(ue, i(g)[i($)].symbol), ce !== (ce = i($)) && (ne.value = (ne.__value = i($)) ?? "");
        }), M(W, ne);
      });
      var F = k(O, 2), H = x(F), X = k(H, 2), re = k(F, 2), he = x(re), Te = x(he), ke = k(he, 2), Ae = k(re, 2), Me = x(Ae), He = k(Me, 2), Pe = k(Ae, 2), N = x(Pe), T = k(N, 2), R = k(Pe, 2), oe = x(R);
      D(
        (W, $, ne, ue, ce, ve, V, Z, ee, Q, de, se, Ee, Ne) => {
          c(h, 1, W), c(E, 1, $), c(A, 1, ne), c(L, 1, ue), c(U, 1, ce), c(H, 1, ve), c(X, 1, V), c(he, 1, Z), q(Te, `Amount (${(i(g)[i(gt)]?.symbol || i(gt) || "") ?? ""} units)`), c(ke, 1, ee), c(Me, 1, Q), c(He, 1, de), c(N, 1, se), c(T, 1, Ee), R.disabled = i(f) || !i(Ht) || i(mr) <= 0, c(R, 1, Ne), q(oe, i(f) ? "Processing…" : "Transfer");
        },
        [
          () => d(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => d(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => d(t("space-y-4")),
          () => d(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => d(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => d(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => d(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => d(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => d(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => d(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => d(t("w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => d(t("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => d(t("w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => d(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), Ca("submit", A, (W) => {
        W.preventDefault(), Hi();
      }), Us(U, () => i(gt), (W) => p(gt, W)), Ut(X, () => i(Ht), (W) => p(Ht, W)), Ut(ke, () => i(mr), (W) => p(mr, W)), Ut(He, () => i(Ir), (W) => p(Ir, W)), Ut(T, () => i(Fr), (W) => p(Fr, W)), M(v, h);
    }, so = (v) => {
      var h = Ll(), E = x(h), A = k(E, 2), O = k(x(A)), L = k(O, 2), U = k(A, 2);
      bt(
        U,
        20,
        () => [
          { id: "user", label: "User (usr_)" },
          { id: "invoice", label: "Invoice (inv_)" },
          { id: "raw", label: "Raw Hex" }
        ],
        Pt,
        (N, T) => {
          var R = El(), oe = x(R);
          D(
            (W) => {
              c(R, 1, W), q(oe, T.label);
            },
            [
              () => d(t("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", i(er) === T.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
            ]
          ), Re("click", R, () => {
            p(er, T.id, !0), p(At, null);
          }), M(N, R);
        }
      );
      var F = k(U, 2), H = x(F);
      {
        var X = (N) => {
          var T = Sl();
          D((R) => c(T, 1, R), [
            () => d(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ut(T, () => i(rn), (R) => p(rn, R)), M(N, T);
        }, re = (N) => {
          var T = Tl();
          D((R) => c(T, 1, R), [
            () => d(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ut(T, () => i(nn), (R) => p(nn, R)), M(N, T);
        }, he = (N) => {
          var T = Al();
          D((R) => c(T, 1, R), [
            () => d(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ut(T, () => i(an), (R) => p(an, R)), M(N, T);
        };
        te(H, (N) => {
          i(er) === "user" ? N(X) : i(er) === "invoice" ? N(re, 1) : N(he, -1);
        });
      }
      var Te = k(H, 2), ke = x(Te);
      {
        var Ae = (N) => {
          var T = qt(), R = pt(T);
          Bn(R, () => Ln), M(N, T);
        };
        te(ke, (N) => {
          i(kr) && N(Ae);
        });
      }
      var Me = k(ke), He = k(F, 2);
      {
        var Pe = (N) => {
          var T = Rl(), R = x(T), oe = x(R), W = x(oe), $ = k(W, 2), ne = x($), ue = k(oe, 2), ce = x(ue), ve = k(R, 2);
          bt(ve, 21, () => Object.entries(i(At).balances), Pt, (Q, de) => {
            var se = /* @__PURE__ */ ar(() => mo(i(de), 2));
            let Ee = () => i(se)[0], Ne = () => i(se)[1];
            const st = /* @__PURE__ */ ar(() => i(g)[Ee()]?.decimals || 8);
            var lt = Ml(), Mt = x(lt), ft = x(Mt), qe = k(Mt, 2), Je = x(qe), Nt = x(Je), ae = k(Je, 2), ge = x(ae);
            D(
              (le, Rt, Lt, Dt, Oe, ze, rr) => {
                c(lt, 1, le), c(Mt, 1, Rt), q(ft, Ee()), c(qe, 1, Lt), c(Je, 1, Dt), q(Nt, Oe), c(ae, 1, ze), q(ge, `${rr ?? ""} units`);
              },
              [
                () => d(t("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => d(t("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => d(t("text-right")),
                () => d(t("text-lg font-bold", Number(Ne()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400")),
                () => ga(Number(Ne()), i(st)),
                () => d(t("text-xs text-gray-500 dark:text-gray-400")),
                () => Number(Ne()).toLocaleString()
              ]
            ), M(Q, lt);
          });
          var V = k(ve, 2);
          {
            var Z = (Q) => {
              var de = Nl();
              D((se) => c(de, 1, se), [() => d(t("text-sm text-gray-500 italic"))]), M(Q, de);
            }, ee = /* @__PURE__ */ ar(() => Object.values(i(At).balances).every((Q) => Number(Q) === 0));
            te(V, (Q) => {
              i(ee) && Q(Z);
            });
          }
          D(
            (Q, de, se, Ee, Ne, st, lt) => {
              c(T, 1, Q), c(R, 1, de), c(W, 1, se), c($, 1, Ee), q(ne, i(At).label), c(ue, 1, Ne), q(ce, `${st ?? ""}…`), c(ve, 1, lt);
            },
            [
              () => d(t("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3")),
              () => d(t("flex items-center justify-between")),
              () => d(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
              () => d(t("ml-2 text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => d(t("text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono")),
              () => i(At).subaccount_hex.substring(0, 16),
              () => d(t("space-y-2"))
            ]
          ), Re("click", ue, () => tr(i(At)?.subaccount_hex || "")), M(N, T);
        };
        te(He, (N) => {
          i(At) && N(Pe);
        });
      }
      D(
        (N, T, R, oe, W, $, ne, ue) => {
          c(h, 1, N), c(E, 1, T), c(A, 1, R), c(O, 1, oe), c(L, 1, W), c(U, 1, $), c(F, 1, ne), Te.disabled = i(kr), c(Te, 1, ue), q(Me, ` ${i(kr) ? "Looking up…" : "Lookup"}`);
        },
        [
          () => d(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => d(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => d(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => d(t("bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs")),
          () => d(t("bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs")),
          () => d(t("flex gap-2 mb-4")),
          () => d(t("flex gap-2 mb-4")),
          () => d(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"))
        ]
      ), Ca("submit", F, (N) => {
        N.preventDefault(), qi();
      }), M(v, h);
    }, lo = (v) => {
      var h = jl(), E = x(h), A = k(E, 2), O = x(A), L = x(O);
      {
        var U = (V) => {
          var Z = qt(), ee = pt(Z);
          Bn(ee, () => Ln), M(V, Z);
        };
        te(L, (V) => {
          i(f) && V(U);
        });
      }
      var F = k(L), H = k(A, 2), X = x(H), re = k(X, 2), he = k(re, 2), Te = x(he), ke = k(Te, 2), Ae = k(ke, 2), Me = k(Ae, 2), He = k(H, 2), Pe = x(He), N = x(Pe), T = x(N), R = k(N, 2);
      {
        var oe = (V) => {
          var Z = Ol();
          bt(Z, 21, () => i(m), Pt, (ee, Q) => {
            var de = Pl(), se = x(de), Ee = x(se), Ne = k(se, 2), st = x(Ne), lt = k(Ne, 2);
            {
              var Mt = (ft) => {
                var qe = Dl(), Je = x(qe);
                D(
                  (Nt) => {
                    c(qe, 1, Nt), q(Je, `Token: ${i(Q).token ?? ""}`);
                  },
                  [
                    () => d(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
                  ]
                ), M(ft, qe);
              };
              te(lt, (ft) => {
                i(Q).token && ft(Mt);
              });
            }
            D(
              (ft, qe, Je, Nt) => {
                c(de, 1, ft), c(se, 1, qe), q(Ee, `Principal: ${(i(Q).principal || i(Q)._id || i(Q).id) ?? ""}`), c(Ne, 1, Je), q(st, `${Nt ?? ""} units`);
              },
              [
                () => d(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => d(t("font-mono text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => d(t("text-sm font-semibold text-gray-800 dark:text-gray-200")),
                () => (i(Q).amount || 0).toLocaleString()
              ]
            ), M(ee, de);
          }), D((ee) => c(Z, 1, ee), [() => d(t("space-y-2 max-h-80 overflow-auto"))]), M(V, Z);
        }, W = (V) => {
          var Z = Cl();
          D((ee) => c(Z, 1, ee), [() => d(t("text-gray-500 dark:text-gray-400 text-sm"))]), M(V, Z);
        };
        te(R, (V) => {
          i(m).length > 0 ? V(oe) : V(W, -1);
        });
      }
      var $ = k(Pe, 2), ne = x($), ue = k(ne, 2);
      {
        var ce = (V) => {
          var Z = Il(), ee = x(Z);
          D(
            (Q) => {
              c(Z, 1, Q), q(ee, `Total transfers: ${i(K).total_items_count ?? ""}`);
            },
            [() => d(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), M(V, Z);
        }, ve = (V) => {
          var Z = Fl();
          D((ee) => c(Z, 1, ee), [() => d(t("text-gray-500 dark:text-gray-400 text-sm"))]), M(V, Z);
        };
        te(ue, (V) => {
          i(K) ? V(ce) : V(ve, -1);
        });
      }
      D(
        (V, Z, ee, Q, de, se, Ee, Ne, st, lt, Mt, ft, qe, Je, Nt) => {
          c(h, 1, V), c(E, 1, Z), c(A, 1, ee), O.disabled = i(f), c(O, 1, Q), q(F, ` ${i(f) ? "Refreshing…" : "Full Vault Refresh"}`), c(H, 1, de), c(X, 1, se), c(re, 1, Ee), c(he, 1, Ne), c(Te, 1, st), c(ke, 1, lt), c(Ae, 1, Mt), c(Me, 1, ft), c(He, 1, qe), c(N, 1, Je), q(T, `All Balances in System (${i(m).length ?? ""})`), c(ne, 1, Nt);
        },
        [
          () => d(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => d(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => d(t("mb-4")),
          () => d(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => d(t("mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700")),
          () => d(t("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => d(t("text-xs text-gray-500 dark:text-gray-400 mb-3")),
          () => d(t("flex items-center gap-3")),
          () => d(t("text-sm text-gray-700 dark:text-gray-300")),
          () => d(t("w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100")),
          () => d(t("text-sm text-gray-500 dark:text-gray-400")),
          () => d(t("px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60")),
          () => d(t("space-y-6")),
          () => d(t("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => d(t("font-semibold text-gray-700 dark:text-gray-300 mb-2"))
        ]
      ), Re("click", O, Nn), Ut(ke, () => i(ye), (V) => p(ye, V)), Re("click", Me, Oi), M(v, h);
    };
    te(ao, (v) => {
      i(u) === "transactions" ? v(io) : i(u) === "transfer" ? v(oo, 1) : i(u) === "lookup" ? v(so, 2) : i(u) === "admin" && v(lo, 3);
    });
  }
  D(
    (v, h, E, A, O, L, U, F, H) => {
      c(Dn, 1, v), c(Pn, 1, h), c(ba, 1, E), ln.disabled = i(f) || i(ht), c(ln, 1, A), q(Wi, ` ${i(f) || i(ht) ? "Refreshing…" : "Refresh"}`), c(On, 1, O), c(Cn, 1, L), c(ma, 1, U), c(fn, 1, F), q(Ji, i(S) || "Loading…"), c(In, 1, H);
    },
    [
      () => d(t("max-w-4xl mx-auto p-6 space-y-6")),
      () => d(t("flex justify-between items-center")),
      () => d(t("text-2xl font-bold text-gray-900 dark:text-gray-100")),
      () => d(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed", "inline-flex items-center gap-2 transition-colors")),
      () => d(t("bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2")),
      () => d(t("flex items-center gap-2")),
      () => d(t("text-sm font-medium text-gray-600 dark:text-gray-400")),
      () => d(t("font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline")),
      () => d(t("flex border-b border-gray-200 dark:border-gray-700"))
    ]
  ), Re("click", ln, Nn), Re("click", fn, () => tr(i(S))), M(e, Dn), Wa();
}
Rs(["click", "change"]);
function zl(e, r) {
  const t = Os(Vl, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        Is(t);
      } catch {
      }
    }
  };
}
export {
  zl as default
};
