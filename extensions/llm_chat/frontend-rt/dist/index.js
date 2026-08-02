var mo = Object.defineProperty;
var Rr = (e) => {
  throw TypeError(e);
};
var ko = (e, t, n) => t in e ? mo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Pe = (e, t, n) => ko(e, typeof t != "symbol" ? t + "" : t, n), Vs = (e, t, n) => t.has(e) || Rr("Cannot " + n);
var l = (e, t, n) => (Vs(e, t, "read from private field"), n ? n.call(e) : t.get(e)), M = (e, t, n) => t.has(e) ? Rr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), A = (e, t, n, r) => (Vs(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), F = (e, t, n) => (Vs(e, t, "access private method"), n);
var Qr = Array.isArray, wo = Array.prototype.indexOf, ks = Array.prototype.includes, Ms = Array.from, xo = Object.defineProperty, Wn = Object.getOwnPropertyDescriptor, yo = Object.getOwnPropertyDescriptors, Eo = Object.prototype, So = Array.prototype, Xr = Object.getPrototypeOf, Dr = Object.isExtensible;
const To = () => {
};
function Ao(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Zr() {
  var e, t, n = new Promise((r, s) => {
    e = r, t = s;
  });
  return { promise: n, resolve: e, reject: t };
}
const ve = 2, xn = 4, Ps = 8, ei = 1 << 24, Je = 16, Xe = 32, Nt = 64, $s = 128, Ue = 512, ie = 1024, de = 2048, lt = 4096, we = 8192, qe = 16384, An = 32768, Qs = 1 << 25, yn = 65536, ws = 1 << 17, Co = 1 << 18, Cn = 1 << 19, Mo = 1 << 20, it = 1 << 25, Qt = 65536, xs = 1 << 21, pn = 1 << 22, Lt = 1 << 23, ds = Symbol("$state"), Po = Symbol(""), vs = Symbol("attributes"), Xs = Symbol("class"), Zs = Symbol("style"), qn = Symbol("text"), ps = Symbol("form reset"), Is = new class extends Error {
  constructor() {
    super(...arguments);
    Pe(this, "name", "StaleReactionError");
    Pe(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Io(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Lo() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function No(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Ro(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Do() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Oo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function zo() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function jo() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Fo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Ho() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Uo() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const qo = 1, Vo = 2, ti = 4, Bo = 8, Yo = 16, Go = 1, Wo = 2, re = Symbol("uninitialized"), ni = "http://www.w3.org/1999/xhtml", Ko = "http://www.w3.org/2000/svg", Jo = "http://www.w3.org/1998/Math/MathML";
function $o() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Qo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function si(e) {
  return e === this.v;
}
function Xo(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function ri(e) {
  return !Xo(e, this.v);
}
let ge = null;
function En(e) {
  ge = e;
}
function ii(e, t = !1, n) {
  ge = {
    p: ge,
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
function oi(e) {
  var t = (
    /** @type {ComponentContext} */
    ge
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      Ai(r);
  }
  return t.i = !0, ge = t.p, /** @type {T} */
  {};
}
function ai() {
  return !0;
}
let Ft = [];
function li() {
  var e = Ft;
  Ft = [], Ao(e);
}
function Wt(e) {
  if (Ft.length === 0 && !Kn) {
    var t = Ft;
    queueMicrotask(() => {
      t === Ft && li();
    });
  }
  Ft.push(e);
}
function Zo() {
  for (; Ft.length > 0; )
    li();
}
function ci(e) {
  var t = D;
  if (t === null)
    return R.f |= Lt, e;
  if ((t.f & An) === 0 && (t.f & xn) === 0)
    throw e;
  It(e, t);
}
function It(e, t) {
  if (!(t !== null && (t.f & qe) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & $s) !== 0) {
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
const ea = -7169;
function X(e, t) {
  e.f = e.f & ea | t;
}
function ur(e) {
  (e.f & Ue) !== 0 || e.deps === null ? X(e, ie) : X(e, lt);
}
function fi(e) {
  if (e !== null)
    for (const t of e)
      (t.f & ve) === 0 || (t.f & Qt) === 0 || (t.f ^= Qt, fi(
        /** @type {Derived} */
        t.deps
      ));
}
function ui(e, t, n) {
  (e.f & de) !== 0 ? t.add(e) : (e.f & lt) !== 0 && n.add(e), fi(e.deps), X(e, ie);
}
function ta(e) {
  let t = 0, n = Zt(0), r;
  return () => {
    br() && (o(n), _r(() => (t === 0 && (r = Ls(() => e(() => Jn(n)))), t += 1, () => {
      Wt(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, Jn(n));
      });
    })));
  };
}
var na = yn | Cn;
function sa(e, t, n, r) {
  new ra(e, t, n, r);
}
var ze, fr, je, qt, Se, Fe, ke, Le, ht, Vt, Mt, hn, Qn, Xn, gt, Ts, $, ia, oa, aa, er, hs, gs, tr, nr;
class ra {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, s) {
    M(this, $);
    /** @type {Boundary | null} */
    Pe(this, "parent");
    Pe(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Pe(this, "transform_error");
    /** @type {TemplateNode} */
    M(this, ze);
    /** @type {TemplateNode | null} */
    M(this, fr, null);
    /** @type {BoundaryProps} */
    M(this, je);
    /** @type {((anchor: Node) => void)} */
    M(this, qt);
    /** @type {Effect} */
    M(this, Se);
    /** @type {Effect | null} */
    M(this, Fe, null);
    /** @type {Effect | null} */
    M(this, ke, null);
    /** @type {Effect | null} */
    M(this, Le, null);
    /** @type {DocumentFragment | null} */
    M(this, ht, null);
    M(this, Vt, 0);
    M(this, Mt, 0);
    M(this, hn, !1);
    /** @type {Set<Effect>} */
    M(this, Qn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    M(this, Xn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    M(this, gt, null);
    M(this, Ts, ta(() => (A(this, gt, Zt(l(this, Vt))), () => {
      A(this, gt, null);
    })));
    A(this, ze, t), A(this, je, n), A(this, qt, (i) => {
      var a = (
        /** @type {Effect} */
        D
      );
      a.b = this, a.f |= $s, r(i);
    }), this.parent = /** @type {Effect} */
    D.b, this.transform_error = s ?? this.parent?.transform_error ?? ((i) => i), A(this, Se, mr(() => {
      F(this, $, er).call(this);
    }, na));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    ui(t, l(this, Qn), l(this, Xn));
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
    F(this, $, tr).call(this, t, n), A(this, Vt, l(this, Vt) + t), !(!l(this, gt) || l(this, hn)) && (A(this, hn, !0), Wt(() => {
      A(this, hn, !1), l(this, gt) && Sn(l(this, gt), l(this, Vt));
    }));
  }
  get_effect_pending() {
    return l(this, Ts).call(this), o(
      /** @type {Source<number>} */
      l(this, gt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!l(this, je).onerror && !l(this, je).failed)
      throw t;
    N?.is_fork ? (l(this, Fe) && N.skip_effect(l(this, Fe)), l(this, ke) && N.skip_effect(l(this, ke)), l(this, Le) && N.skip_effect(l(this, Le)), N.oncommit(() => {
      F(this, $, nr).call(this, t);
    })) : F(this, $, nr).call(this, t);
  }
}
ze = new WeakMap(), fr = new WeakMap(), je = new WeakMap(), qt = new WeakMap(), Se = new WeakMap(), Fe = new WeakMap(), ke = new WeakMap(), Le = new WeakMap(), ht = new WeakMap(), Vt = new WeakMap(), Mt = new WeakMap(), hn = new WeakMap(), Qn = new WeakMap(), Xn = new WeakMap(), gt = new WeakMap(), Ts = new WeakMap(), $ = new WeakSet(), ia = function() {
  try {
    A(this, Fe, He(() => l(this, qt).call(this, l(this, ze))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
oa = function(t) {
  const n = l(this, je).failed;
  n && A(this, Le, He(() => {
    n(
      l(this, ze),
      () => t,
      () => () => {
      }
    );
  }));
}, aa = function() {
  const t = l(this, je).pending;
  t && (this.is_pending = !0, A(this, ke, He(() => t(l(this, ze)))), Wt(() => {
    var n = A(this, ht, document.createDocumentFragment()), r = mt();
    n.append(r), A(this, Fe, F(this, $, gs).call(this, () => He(() => l(this, qt).call(this, r)))), l(this, Mt) === 0 && (l(this, ze).before(n), A(this, ht, null), Jt(
      /** @type {Effect} */
      l(this, ke),
      () => {
        A(this, ke, null);
      }
    ), F(this, $, hs).call(
      this,
      /** @type {Batch} */
      N
    ));
  }));
}, er = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), A(this, Mt, 0), A(this, Vt, 0), A(this, Fe, He(() => {
      l(this, qt).call(this, l(this, ze));
    })), l(this, Mt) > 0) {
      var t = A(this, ht, document.createDocumentFragment());
      wr(l(this, Fe), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        l(this, je).pending
      );
      A(this, ke, He(() => n(l(this, ze))));
    } else
      F(this, $, hs).call(
        this,
        /** @type {Batch} */
        N
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
hs = function(t) {
  this.is_pending = !1, t.transfer_effects(l(this, Qn), l(this, Xn));
}, /**
 * @template T
 * @param {() => T} fn
 */
gs = function(t) {
  var n = D, r = R, s = ge;
  ct(l(this, Se)), Ve(l(this, Se)), En(l(this, Se).ctx);
  try {
    return Xt.ensure(), t();
  } catch (i) {
    return ci(i), null;
  } finally {
    ct(n), Ve(r), En(s);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
tr = function(t, n) {
  var r;
  if (!this.has_pending_snippet()) {
    this.parent && F(r = this.parent, $, tr).call(r, t, n);
    return;
  }
  A(this, Mt, l(this, Mt) + t), l(this, Mt) === 0 && (F(this, $, hs).call(this, n), l(this, ke) && Jt(l(this, ke), () => {
    A(this, ke, null);
  }), l(this, ht) && (l(this, ze).before(l(this, ht)), A(this, ht, null)));
}, /**
 * @param {unknown} error
 */
nr = function(t) {
  l(this, Fe) && (Ce(l(this, Fe)), A(this, Fe, null)), l(this, ke) && (Ce(l(this, ke)), A(this, ke, null)), l(this, Le) && (Ce(l(this, Le)), A(this, Le, null));
  var n = l(this, je).onerror;
  let r = l(this, je).failed;
  var s = !1, i = !1;
  const a = () => {
    if (s) {
      Qo();
      return;
    }
    s = !0, i && Uo(), l(this, Le) !== null && Jt(l(this, Le), () => {
      A(this, Le, null);
    }), F(this, $, gs).call(this, () => {
      F(this, $, er).call(this);
    });
  }, f = (c) => {
    try {
      i = !0, n?.(c, a), i = !1;
    } catch (u) {
      It(u, l(this, Se) && l(this, Se).parent);
    }
    r && A(this, Le, F(this, $, gs).call(this, () => {
      try {
        return He(() => {
          var u = (
            /** @type {Effect} */
            D
          );
          u.b = this, u.f |= $s, r(
            l(this, ze),
            () => c,
            () => a
          );
        });
      } catch (u) {
        return It(
          u,
          /** @type {Effect} */
          l(this, Se).parent
        ), null;
      }
    }));
  };
  Wt(() => {
    var c;
    try {
      c = this.transform_error(t);
    } catch (u) {
      It(u, l(this, Se) && l(this, Se).parent);
      return;
    }
    c !== null && typeof c == "object" && typeof /** @type {any} */
    c.then == "function" ? c.then(
      f,
      /** @param {unknown} e */
      (u) => It(u, l(this, Se) && l(this, Se).parent)
    ) : f(c);
  });
};
function la(e, t, n, r) {
  const s = vi;
  var i = e.filter((b) => !b.settled), a = t.map(s);
  if (n.length === 0 && i.length === 0) {
    r(a);
    return;
  }
  var f = (
    /** @type {Effect} */
    D
  ), c = ca(), u = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((b) => b.promise)) : null;
  function p(b) {
    if ((f.f & qe) === 0) {
      c();
      try {
        r([...a, ...b]);
      } catch (k) {
        It(k, f);
      }
      ys();
    }
  }
  var _ = di();
  if (n.length === 0) {
    u.then(() => p([])).finally(_);
    return;
  }
  function v() {
    Promise.all(n.map((b) => /* @__PURE__ */ fa(b))).then(p).catch((b) => It(b, f)).finally(_);
  }
  u ? u.then(() => {
    c(), v(), ys();
  }) : v();
}
function ca() {
  var e = (
    /** @type {Effect} */
    D
  ), t = R, n = ge, r = (
    /** @type {Batch} */
    N
  );
  return function(i = !0) {
    ct(e), Ve(t), En(n), i && (e.f & qe) === 0 && (r?.activate(), r?.apply());
  };
}
function ys(e = !0) {
  ct(null), Ve(null), En(null), e && N?.deactivate();
}
function di() {
  var e = (
    /** @type {Effect} */
    D
  ), t = e.b, n = (
    /** @type {Batch} */
    N
  ), r = !!t?.is_rendered();
  return t?.update_pending_count(1, n), n.increment(r, e), () => {
    t?.update_pending_count(-1, n), n.decrement(r, e);
  };
}
// @__NO_SIDE_EFFECTS__
function vi(e) {
  var t = ve | de;
  return D !== null && (D.f |= Cn), {
    ctx: ge,
    deps: null,
    effects: null,
    equals: si,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      re
    ),
    wv: 0,
    parent: D,
    ac: null
  };
}
const Vn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function fa(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    D
  );
  r === null && Lo();
  var s = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = Zt(
    /** @type {V} */
    re
  ), a = !R, f = /* @__PURE__ */ new Set();
  return Ca(() => {
    var c = (
      /** @type {Effect} */
      D
    ), u = Zr();
    s = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, (b) => {
        b !== Is && u.reject(b);
      }).finally(ys);
    } catch (b) {
      u.reject(b), ys();
    }
    var p = (
      /** @type {Batch} */
      N
    );
    if (a) {
      if ((c.f & An) !== 0)
        var _ = di();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        r.b?.is_rendered()
      )
        p.async_deriveds.get(c)?.reject(Vn);
      else
        for (const b of f.values())
          b.reject(Vn);
      f.add(u), p.async_deriveds.set(c, u);
    }
    const v = (b, k = void 0) => {
      _?.(), f.delete(u), k !== Vn && (p.activate(), k ? (i.f |= Lt, Sn(i, k)) : ((i.f & Lt) !== 0 && (i.f ^= Lt), Sn(i, b)), p.deactivate());
    };
    u.promise.then(v, (b) => v(null, b || "unknown"));
  }), Ta(() => {
    for (const c of f)
      c.reject(Vn);
  }), new Promise((c) => {
    function u(p) {
      function _() {
        p === s ? c(i) : u(s);
      }
      p.then(_, _);
    }
    u(s);
  });
}
// @__NO_SIDE_EFFECTS__
function ua(e) {
  const t = /* @__PURE__ */ vi(e);
  return t.equals = ri, t;
}
function da(e) {
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
function dr(e) {
  var t, n = D, r = e.parent;
  if (!Rt && r !== null && e.v !== re && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (r.f & (qe | we)) !== 0)
    return $o(), e.v;
  ct(r);
  try {
    e.f &= ~Qt, da(e), t = zi(e);
  } finally {
    ct(n);
  }
  return t;
}
function pi(e) {
  var t = dr(e);
  if (!e.equals(t) && (e.wv = Di(), (!N?.is_fork || e.deps === null) && (N !== null ? (N.capture(e, t, !0), sr?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    X(e, ie);
    return;
  }
  Rt || ($e !== null ? (br() || N?.is_fork) && $e.set(e, t) : ur(e));
}
function va(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(Is), t.fn !== null && (t.teardown = To), t.ac = null, $n(t, 0), kr(t));
}
function hi(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Tn(t);
}
let Bs = null, on = null, N = null, sr = null, $e = null, rr = null, Kn = !1, Ys = !1, vn = null, bs = null;
var Or = 0;
let pa = 1;
var gn, Pt, Bt, bn, _n, mn, bt, kn, Te, Zn, _t, Ge, st, wn, Yt, U, ir, Bn, or, gi, bi, un, ha, Yn;
const As = class As {
  constructor() {
    M(this, U);
    Pe(this, "id", pa++);
    /** True as soon as `#process` was called */
    M(this, gn, !1);
    Pe(this, "linked", !0);
    /** @type {Batch | null} */
    M(this, Pt, null);
    /** @type {Batch | null} */
    M(this, Bt, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    Pe(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    Pe(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    Pe(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    M(this, bn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    M(this, _n, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    M(this, mn, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    M(this, bt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    M(this, kn, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    M(this, Te, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    M(this, Zn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    M(this, _t, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    M(this, Ge, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    M(this, st, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    M(this, wn, /* @__PURE__ */ new Set());
    Pe(this, "is_fork", !1);
    M(this, Yt, !1);
    on === null ? Bs = on = this : (A(on, Bt, this), A(this, Pt, on)), on = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    l(this, st).has(t) || l(this, st).set(t, { d: [], m: [] }), l(this, wn).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (r) => this.schedule(r)) {
    var r = l(this, st).get(t);
    if (r) {
      l(this, st).delete(t);
      for (var s of r.d)
        X(s, de), n(s);
      for (s of r.m)
        X(s, lt), n(s);
    }
    l(this, wn).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, r = !1) {
    t.v !== re && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Lt) === 0 && (this.current.set(t, [n, r]), $e?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    N = this;
  }
  deactivate() {
    N = null, $e = null;
  }
  flush() {
    try {
      Ys = !0, N = this, F(this, U, Bn).call(this);
    } finally {
      Or = 0, rr = null, vn = null, bs = null, Ys = !1, N = null, $e = null, Kt.clear();
    }
  }
  discard() {
    for (const t of l(this, _n)) t(this);
    l(this, _n).clear();
    for (const t of this.async_deriveds.values())
      t.reject(Vn);
    F(this, U, Yn).call(this), l(this, kn)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    l(this, Zn).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    if (A(this, mn, l(this, mn) + 1), t) {
      let r = l(this, bt).get(n) ?? 0;
      l(this, bt).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, n) {
    if (A(this, mn, l(this, mn) - 1), t) {
      let r = l(this, bt).get(n) ?? 0;
      r === 1 ? l(this, bt).delete(n) : l(this, bt).set(n, r - 1);
    }
    l(this, Yt) || (A(this, Yt, !0), Wt(() => {
      A(this, Yt, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const r of t)
      l(this, _t).add(r);
    for (const r of n)
      l(this, Ge).add(r);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    l(this, bn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    l(this, _n).add(t);
  }
  settled() {
    return (l(this, kn) ?? A(this, kn, Zr())).promise;
  }
  static ensure() {
    if (N === null) {
      const t = N = new As();
      !Ys && !Kn && Wt(() => {
        l(t, gn) || t.flush();
      });
    }
    return N;
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
    if (rr = t, t.b?.is_pending && (t.f & (xn | Ps | ei)) !== 0 && (t.f & An) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var r = n.f;
      if (vn !== null && n === D && (R === null || (R.f & ve) === 0))
        return;
      if ((r & (Nt | Xe)) !== 0) {
        if ((r & ie) === 0)
          return;
        n.f ^= ie;
      }
    }
    l(this, Te).push(n);
  }
};
gn = new WeakMap(), Pt = new WeakMap(), Bt = new WeakMap(), bn = new WeakMap(), _n = new WeakMap(), mn = new WeakMap(), bt = new WeakMap(), kn = new WeakMap(), Te = new WeakMap(), Zn = new WeakMap(), _t = new WeakMap(), Ge = new WeakMap(), st = new WeakMap(), wn = new WeakMap(), Yt = new WeakMap(), U = new WeakSet(), ir = function() {
  if (this.is_fork) return !0;
  for (const r of l(this, bt).keys()) {
    for (var t = r, n = !1; t.parent !== null; ) {
      if (l(this, st).has(t)) {
        n = !0;
        break;
      }
      t = t.parent;
    }
    if (!n)
      return !0;
  }
  return !1;
}, Bn = function() {
  var c, u, p;
  A(this, gn, !0), Or++ > 1e3 && (F(this, U, Yn).call(this), ba());
  for (const _ of l(this, _t))
    l(this, Ge).delete(_), X(_, de), this.schedule(_);
  for (const _ of l(this, Ge))
    X(_, lt), this.schedule(_);
  const t = l(this, Te);
  A(this, Te, []), this.apply();
  var n = vn = [], r = [], s = bs = [];
  for (const _ of t)
    try {
      F(this, U, or).call(this, _, n, r);
    } catch (v) {
      throw ki(_), F(this, U, ir).call(this) || this.discard(), v;
    }
  if (N = null, s.length > 0) {
    var i = As.ensure();
    for (const _ of s)
      i.schedule(_);
  }
  if (vn = null, bs = null, F(this, U, ir).call(this)) {
    F(this, U, un).call(this, r), F(this, U, un).call(this, n);
    for (const [_, v] of l(this, st))
      mi(_, v);
    s.length > 0 && /** @type {unknown} */
    F(c = N, U, Bn).call(c);
    return;
  }
  const a = F(this, U, gi).call(this);
  if (a) {
    F(this, U, un).call(this, r), F(this, U, un).call(this, n), F(u = a, U, bi).call(u, this);
    return;
  }
  l(this, _t).clear(), l(this, Ge).clear();
  for (const _ of l(this, bn)) _(this);
  l(this, bn).clear(), sr = this, zr(r), zr(n), sr = null, l(this, kn)?.resolve();
  var f = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    N
  );
  if (l(this, mn) === 0 && (l(this, Te).length === 0 || f !== null) && F(this, U, Yn).call(this), l(this, Te).length > 0)
    if (f !== null) {
      const _ = f;
      l(_, Te).push(...l(this, Te).filter((v) => !l(_, Te).includes(v)));
    } else
      f = this;
  f !== null && F(p = f, U, Bn).call(p);
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
or = function(t, n, r) {
  t.f ^= ie;
  for (var s = t.first; s !== null; ) {
    var i = s.f, a = (i & (Xe | Nt)) !== 0, f = a && (i & ie) !== 0, c = f || (i & we) !== 0 || l(this, st).has(s);
    if (!c && s.fn !== null) {
      a ? s.f ^= ie : (i & xn) !== 0 ? n.push(s) : ss(s) && ((i & Je) !== 0 && l(this, Ge).add(s), Tn(s));
      var u = s.first;
      if (u !== null) {
        s = u;
        continue;
      }
    }
    for (; s !== null; ) {
      var p = s.next;
      if (p !== null) {
        s = p;
        break;
      }
      s = s.parent;
    }
  }
}, gi = function() {
  for (var t = l(this, Pt); t !== null; ) {
    if (!t.is_fork) {
      for (const [n, [, r]] of this.current)
        if (t.current.has(n) && !r)
          return t;
    }
    t = l(t, Pt);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
bi = function(t) {
  var r;
  for (const [s, i] of t.current)
    !this.previous.has(s) && t.previous.has(s) && this.previous.set(s, t.previous.get(s)), this.current.set(s, i);
  for (const [s, i] of t.async_deriveds) {
    const a = this.async_deriveds.get(s);
    a && i.promise.then(a.resolve).catch(a.reject);
  }
  t.async_deriveds.clear(), this.transfer_effects(l(t, _t), l(t, Ge));
  const n = (s) => {
    var i = s.reactions;
    if (i !== null)
      for (const c of i) {
        var a = c.f;
        if ((a & ve) !== 0)
          n(
            /** @type {Derived} */
            c
          );
        else {
          var f = (
            /** @type {Effect} */
            c
          );
          a & (pn | Je) && !this.async_deriveds.has(f) && (l(this, Ge).delete(f), X(f, de), this.schedule(f));
        }
      }
  };
  for (const s of this.current.keys())
    n(s);
  this.oncommit(() => t.discard()), F(r = t, U, Yn).call(r), N = this, F(this, U, Bn).call(this);
}, /**
 * @param {Effect[]} effects
 */
un = function(t) {
  for (var n = 0; n < t.length; n += 1)
    ui(t[n], l(this, _t), l(this, Ge));
}, ha = function() {
  var _;
  for (let v = Bs; v !== null; v = l(v, Bt)) {
    var t = v.id < this.id, n = [];
    for (const [b, [k, y]] of this.current) {
      if (v.current.has(b)) {
        var r = (
          /** @type {[any, boolean]} */
          v.current.get(b)[0]
        );
        if (t && k !== r)
          v.current.set(b, [k, y]);
        else
          continue;
      }
      n.push(b);
    }
    if (t)
      for (const [b, k] of this.async_deriveds) {
        const y = v.async_deriveds.get(b);
        y && k.promise.then(y.resolve).catch(y.reject);
      }
    var s = [...v.current.keys()].filter(
      (b) => !/** @type {[any, boolean]} */
      v.current.get(b)[1]
    );
    if (!(!l(v, gn) || s.length === 0)) {
      var i = s.filter((b) => !this.current.has(b));
      if (i.length === 0)
        t && v.discard();
      else if (n.length > 0) {
        if (t)
          for (const b of l(this, wn))
            v.unskip_effect(b, (k) => {
              var y;
              (k.f & (Je | pn)) !== 0 ? v.schedule(k) : F(y = v, U, un).call(y, [k]);
            });
        v.activate();
        var a = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
        for (var c of n)
          _i(c, i, a, f);
        f = /* @__PURE__ */ new Map();
        var u = [...v.current].filter(([b, k]) => {
          const y = this.current.get(b);
          return y ? y[0] !== k[0] || y[1] !== k[1] : !0;
        }).map(([b]) => b);
        if (u.length > 0)
          for (const b of l(this, Zn))
            (b.f & (qe | we | ws)) === 0 && vr(b, u, f) && ((b.f & (pn | Je)) !== 0 ? (X(b, de), v.schedule(b)) : l(v, _t).add(b));
        if (l(v, Te).length > 0 && !l(v, Yt)) {
          v.apply();
          for (var p of l(v, Te))
            F(_ = v, U, or).call(_, p, [], []);
          A(v, Te, []);
        }
        v.deactivate();
      }
    }
  }
}, Yn = function() {
  if (this.linked) {
    var t = l(this, Pt), n = l(this, Bt);
    t === null ? Bs = n : A(t, Bt, n), n === null ? on = t : A(n, Pt, t), this.linked = !1;
  }
};
let Xt = As;
function ga(e) {
  var t = Kn;
  Kn = !0;
  try {
    for (var n; ; ) {
      if (Zo(), N === null)
        return (
          /** @type {T} */
          n
        );
      N.flush();
    }
  } finally {
    Kn = t;
  }
}
function ba() {
  try {
    zo();
  } catch (e) {
    It(e, rr);
  }
}
let pt = null;
function zr(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (qe | we)) === 0 && ss(r) && (pt = /* @__PURE__ */ new Set(), Tn(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Ii(r), pt?.size > 0)) {
        Kt.clear();
        for (const s of pt) {
          if ((s.f & (qe | we)) !== 0) continue;
          const i = [s];
          let a = s.parent;
          for (; a !== null; )
            pt.has(a) && (pt.delete(a), i.push(a)), a = a.parent;
          for (let f = i.length - 1; f >= 0; f--) {
            const c = i[f];
            (c.f & (qe | we)) === 0 && Tn(c);
          }
        }
        pt.clear();
      }
    }
    pt = null;
  }
}
function _i(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const s of e.reactions) {
      const i = s.f;
      (i & ve) !== 0 ? _i(
        /** @type {Derived} */
        s,
        t,
        n,
        r
      ) : (i & (pn | Je)) !== 0 && (i & de) === 0 && vr(s, t, r) && (X(s, de), pr(
        /** @type {Effect} */
        s
      ));
    }
}
function vr(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const s of e.deps) {
      if (ks.call(t, s))
        return !0;
      if ((s.f & ve) !== 0 && vr(
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
function pr(e) {
  N.schedule(e);
}
function mi(e, t) {
  if (!((e.f & Xe) !== 0 && (e.f & ie) !== 0)) {
    (e.f & de) !== 0 ? t.d.push(e) : (e.f & lt) !== 0 && t.m.push(e), X(e, ie);
    for (var n = e.first; n !== null; )
      mi(n, t), n = n.next;
  }
}
function ki(e) {
  X(e, ie);
  for (var t = e.first; t !== null; )
    ki(t), t = t.next;
}
let Es = /* @__PURE__ */ new Set();
const Kt = /* @__PURE__ */ new Map();
let wi = !1;
function Zt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: si,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function P(e, t) {
  const n = Zt(e);
  return Pa(n), n;
}
// @__NO_SIDE_EFFECTS__
function _a(e, t = !1, n = !0) {
  const r = Zt(e);
  return t || (r.equals = ri), r;
}
function h(e, t, n = !1) {
  R !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Qe || (R.f & ws) !== 0) && ai() && (R.f & (ve | Je | pn | ws)) !== 0 && (at === null || !at.has(e)) && Ho();
  let r = n ? Ke(t) : t;
  return Sn(e, r, bs);
}
function Sn(e, t, n = null) {
  if (!e.equals(t)) {
    Kt.set(e, Rt ? t : e.v);
    var r = Xt.ensure();
    if (r.capture(e, t), (e.f & ve) !== 0) {
      const s = (
        /** @type {Derived} */
        e
      );
      (e.f & de) !== 0 && dr(s), $e === null && ur(s);
    }
    e.wv = Di(), xi(e, de, n), D !== null && (D.f & ie) !== 0 && (D.f & (Xe | Nt)) === 0 && (Oe === null ? Ia([e]) : Oe.push(e)), !r.is_fork && Es.size > 0 && !wi && ma();
  }
  return t;
}
function ma() {
  wi = !1;
  for (const e of Es) {
    (e.f & ie) !== 0 && X(e, lt);
    let t;
    try {
      t = ss(e);
    } catch {
      t = !0;
    }
    t && Tn(e);
  }
  Es.clear();
}
function Jn(e) {
  h(e, e.v + 1);
}
function xi(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var s = r.length, i = 0; i < s; i++) {
      var a = r[i], f = a.f, c = (f & de) === 0;
      if (c && X(a, t), (f & ws) !== 0)
        Es.add(
          /** @type {Effect} */
          a
        );
      else if ((f & ve) !== 0) {
        var u = (
          /** @type {Derived} */
          a
        );
        $e?.delete(u), (f & Qt) === 0 && (f & Ue && (D === null || (D.f & xs) === 0) && (a.f |= Qt), xi(u, lt, n));
      } else if (c) {
        var p = (
          /** @type {Effect} */
          a
        );
        (f & Je) !== 0 && pt !== null && pt.add(p), n !== null ? n.push(p) : pr(p);
      }
    }
}
function Ke(e) {
  if (typeof e != "object" || e === null || ds in e)
    return e;
  const t = Xr(e);
  if (t !== Eo && t !== So)
    return e;
  var n = /* @__PURE__ */ new Map(), r = Qr(e), s = /* @__PURE__ */ P(0), i = $t, a = (f) => {
    if ($t === i)
      return f();
    var c = R, u = $t;
    Ve(null), Ur(i);
    var p = f();
    return Ve(c), Ur(u), p;
  };
  return r && n.set("length", /* @__PURE__ */ P(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, c, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && jo();
        var p = n.get(c);
        return p === void 0 ? a(() => {
          var _ = /* @__PURE__ */ P(u.value);
          return n.set(c, _), _;
        }) : h(p, u.value, !0), !0;
      },
      deleteProperty(f, c) {
        var u = n.get(c);
        if (u === void 0) {
          if (c in f) {
            const p = a(() => /* @__PURE__ */ P(re));
            n.set(c, p), Jn(s);
          }
        } else
          h(u, re), Jn(s);
        return !0;
      },
      get(f, c, u) {
        if (c === ds)
          return e;
        var p = n.get(c), _ = c in f;
        if (p === void 0 && (!_ || Wn(f, c)?.writable) && (p = a(() => {
          var b = Ke(_ ? f[c] : re), k = /* @__PURE__ */ P(b);
          return k;
        }), n.set(c, p)), p !== void 0) {
          var v = o(p);
          return v === re ? void 0 : v;
        }
        return Reflect.get(f, c, u);
      },
      getOwnPropertyDescriptor(f, c) {
        var u = Reflect.getOwnPropertyDescriptor(f, c);
        if (u && "value" in u) {
          var p = n.get(c);
          p && (u.value = o(p));
        } else if (u === void 0) {
          var _ = n.get(c), v = _?.v;
          if (_ !== void 0 && v !== re)
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
        if (c === ds)
          return !0;
        var u = n.get(c), p = u !== void 0 && u.v !== re || Reflect.has(f, c);
        if (u !== void 0 || D !== null && (!p || Wn(f, c)?.writable)) {
          u === void 0 && (u = a(() => {
            var v = p ? Ke(f[c]) : re, b = /* @__PURE__ */ P(v);
            return b;
          }), n.set(c, u));
          var _ = o(u);
          if (_ === re)
            return !1;
        }
        return p;
      },
      set(f, c, u, p) {
        var _ = n.get(c), v = c in f;
        if (r && c === "length")
          for (var b = u; b < /** @type {Source<number>} */
          _.v; b += 1) {
            var k = n.get(b + "");
            k !== void 0 ? h(k, re) : b in f && (k = a(() => /* @__PURE__ */ P(re)), n.set(b + "", k));
          }
        if (_ === void 0)
          (!v || Wn(f, c)?.writable) && (_ = a(() => /* @__PURE__ */ P(void 0)), h(_, Ke(u)), n.set(c, _));
        else {
          v = _.v !== re;
          var y = a(() => Ke(u));
          h(_, y);
        }
        var m = Reflect.getOwnPropertyDescriptor(f, c);
        if (m?.set && m.set.call(p, u), !v) {
          if (r && typeof c == "string") {
            var O = (
              /** @type {Source<number>} */
              n.get("length")
            ), Z = Number(c);
            Number.isInteger(Z) && Z >= O.v && h(O, Z + 1);
          }
          Jn(s);
        }
        return !0;
      },
      ownKeys(f) {
        o(s);
        var c = Reflect.ownKeys(f).filter((_) => {
          var v = n.get(_);
          return v === void 0 || v.v !== re;
        });
        for (var [u, p] of n)
          p.v !== re && !(u in f) && c.push(u);
        return c;
      },
      setPrototypeOf() {
        Fo();
      }
    }
  );
}
var jr, yi, Ei, Si;
function ka() {
  if (jr === void 0) {
    jr = window, yi = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Ei = Wn(t, "firstChild").get, Si = Wn(t, "nextSibling").get, Dr(e) && (e[Xs] = void 0, e[vs] = null, e[Zs] = void 0, e.__e = void 0), Dr(n) && (n[qn] = void 0);
  }
}
function mt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function ot(e) {
  return (
    /** @type {TemplateNode | null} */
    Ei.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function ns(e) {
  return (
    /** @type {TemplateNode | null} */
    Si.call(e)
  );
}
function E(e, t) {
  return /* @__PURE__ */ ot(e);
}
function zt(e, t = !1) {
  {
    var n = /* @__PURE__ */ ot(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ ns(n) : n;
  }
}
function L(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ ns(r);
  return r;
}
function wa(e) {
  e.textContent = "";
}
function Ti() {
  return !1;
}
function hr(e, t, n) {
  return t == null || t === ni ? (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElement(e)
  ) : (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t, e)
  );
}
let Fr = !1;
function xa() {
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
            t[ps]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function gr(e) {
  var t = R, n = D;
  Ve(null), ct(null);
  try {
    return e();
  } finally {
    Ve(t), ct(n);
  }
}
function ya(e, t, n, r = n) {
  e.addEventListener(t, () => gr(n));
  const s = (
    /** @type {any} */
    e[ps]
  );
  s ? e[ps] = () => {
    s(), r(!0);
  } : e[ps] = () => r(!0), xa();
}
function Ea(e) {
  D === null && (R === null && Oo(), Do()), Rt && Ro();
}
function Sa(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function kt(e, t) {
  var n = D;
  n !== null && (n.f & we) !== 0 && (e |= we);
  var r = {
    ctx: ge,
    deps: null,
    nodes: null,
    f: e | de | Ue,
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
  N?.register_created_effect(r);
  var s = r;
  if ((e & xn) !== 0)
    vn !== null ? vn.push(r) : Xt.ensure().schedule(r);
  else if (t !== null) {
    try {
      Tn(r);
    } catch (a) {
      throw Ce(r), a;
    }
    s.deps === null && s.teardown === null && s.nodes === null && s.first === s.last && // either `null`, or a singular child
    (s.f & Cn) === 0 && (s = s.first, (e & Je) !== 0 && (e & yn) !== 0 && s !== null && (s.f |= yn));
  }
  if (s !== null && (s.parent = n, n !== null && Sa(s, n), R !== null && (R.f & ve) !== 0 && (e & Nt) === 0)) {
    var i = (
      /** @type {Derived} */
      R
    );
    (i.effects ?? (i.effects = [])).push(s);
  }
  return r;
}
function br() {
  return R !== null && !Qe;
}
function Ta(e) {
  const t = kt(Ps, null);
  return X(t, ie), t.teardown = e, t;
}
function _s(e) {
  Ea();
  var t = (
    /** @type {Effect} */
    D.f
  ), n = !R && (t & Xe) !== 0 && ge !== null && !ge.i;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      ge
    );
    (r.e ?? (r.e = [])).push(e);
  } else
    return Ai(e);
}
function Ai(e) {
  return kt(xn | Mo, e);
}
function Aa(e) {
  Xt.ensure();
  const t = kt(Nt | Cn, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? Jt(t, () => {
      Ce(t), r(void 0);
    }) : (Ce(t), r(void 0));
  });
}
function Ci(e) {
  return kt(xn, e);
}
function Ca(e) {
  return kt(pn | Cn, e);
}
function _r(e, t = 0) {
  return kt(Ps | t, e);
}
function he(e, t = [], n = [], r = []) {
  la(r, t, n, (s) => {
    kt(Ps, () => {
      e(...s.map(o));
    });
  });
}
function mr(e, t = 0) {
  var n = kt(Je | t, e);
  return n;
}
function He(e) {
  return kt(Xe | Cn, e);
}
function Mi(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Rt, r = R;
    Hr(!0), Ve(null);
    try {
      t.call(null);
    } finally {
      Hr(n), Ve(r);
    }
  }
}
function kr(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const s = n.ac;
    s !== null && gr(() => {
      s.abort(Is);
    });
    var r = n.next;
    (n.f & Nt) !== 0 ? n.parent = null : Ce(n, t), n = r;
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
  (t || (e.f & Co) !== 0) && e.nodes !== null && e.nodes.end !== null && (Pi(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), e.f |= Qs, kr(e, t && !n), $n(e, 0);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const i of r)
      i.stop();
  Mi(e), e.f ^= Qs, e.f |= qe;
  var s = e.parent;
  s !== null && s.first !== null && Ii(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Pi(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ ns(e);
    e.remove(), e = n;
  }
}
function Ii(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Jt(e, t, n = !0) {
  var r = [];
  Li(e, r, !0);
  var s = () => {
    n && Ce(e), t && t();
  }, i = r.length;
  if (i > 0) {
    var a = () => --i || s();
    for (var f of r)
      f.out(a);
  } else
    s();
}
function Li(e, t, n) {
  if ((e.f & we) === 0) {
    e.f ^= we;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const f of r)
        (f.is_global || n) && t.push(f);
    for (var s = e.first; s !== null; ) {
      var i = s.next;
      if ((s.f & Nt) === 0) {
        var a = (s.f & yn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (s.f & Xe) !== 0 && (e.f & Je) !== 0;
        Li(s, t, a ? n : !1);
      }
      s = i;
    }
  }
}
function Ss(e) {
  Ni(e, !0);
}
function Ni(e, t) {
  if ((e.f & we) !== 0) {
    e.f ^= we, (e.f & ie) === 0 && (X(e, de), Xt.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, s = (n.f & yn) !== 0 || (n.f & Xe) !== 0;
      Ni(n, s ? t : !1), n = r;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const a of i)
        (a.is_global || t) && a.in();
  }
}
function wr(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var s = n === r ? null : /* @__PURE__ */ ns(n);
      t.append(n), n = s;
    }
}
let ms = !1, Rt = !1;
function Hr(e) {
  Rt = e;
}
let R = null, Qe = !1;
function Ve(e) {
  R = e;
}
let D = null;
function ct(e) {
  D = e;
}
let at = null;
function Pa(e) {
  R !== null && (at ?? (at = /* @__PURE__ */ new Set())).add(e);
}
let Ae = null, Ie = 0, Oe = null;
function Ia(e) {
  Oe = e;
}
let Ri = 1, Ht = 0, $t = Ht;
function Ur(e) {
  $t = e;
}
function Di() {
  return ++Ri;
}
function ss(e) {
  var t = e.f;
  if ((t & de) !== 0)
    return !0;
  if (t & ve && (e.f &= ~Qt), (t & lt) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, s = 0; s < r; s++) {
      var i = n[s];
      if (ss(
        /** @type {Derived} */
        i
      ) && pi(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & Ue) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    $e === null && X(e, ie);
  }
  return !1;
}
function Oi(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(at !== null && at.has(e)))
    for (var s = 0; s < r.length; s++) {
      var i = r[s];
      (i.f & ve) !== 0 ? Oi(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? X(i, de) : (i.f & ie) !== 0 && X(i, lt), pr(
        /** @type {Effect} */
        i
      ));
    }
}
function zi(e) {
  var y;
  var t = Ae, n = Ie, r = Oe, s = R, i = at, a = ge, f = Qe, c = $t, u = e.f;
  Ae = /** @type {null | Value[]} */
  null, Ie = 0, Oe = null, R = (u & (Xe | Nt)) === 0 ? e : null, at = null, En(e.ctx), Qe = !1, $t = ++Ht, e.ac !== null && (gr(() => {
    e.ac.abort(Is);
  }), e.ac = null);
  try {
    e.f |= xs;
    var p = (
      /** @type {Function} */
      e.fn
    ), _ = p();
    e.f |= An;
    var v = e.deps, b = N?.is_fork;
    if (Ae !== null) {
      var k;
      if (b || $n(e, Ie), v !== null && Ie > 0)
        for (v.length = Ie + Ae.length, k = 0; k < Ae.length; k++)
          v[Ie + k] = Ae[k];
      else
        e.deps = v = Ae;
      if (br() && (e.f & Ue) !== 0)
        for (k = Ie; k < v.length; k++)
          ((y = v[k]).reactions ?? (y.reactions = [])).push(e);
    } else !b && v !== null && Ie < v.length && ($n(e, Ie), v.length = Ie);
    if (ai() && Oe !== null && !Qe && v !== null && (e.f & (ve | lt | de)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      Oe.length; k++)
        Oi(
          Oe[k],
          /** @type {Effect} */
          e
        );
    if (s !== null && s !== e) {
      if (Ht++, s.deps !== null)
        for (let m = 0; m < n; m += 1)
          s.deps[m].rv = Ht;
      if (t !== null)
        for (const m of t)
          m.rv = Ht;
      Oe !== null && (r === null ? r = Oe : r.push(.../** @type {Source[]} */
      Oe));
    }
    return (e.f & Lt) !== 0 && (e.f ^= Lt), _;
  } catch (m) {
    return ci(m);
  } finally {
    e.f ^= xs, Ae = t, Ie = n, Oe = r, R = s, at = i, En(a), Qe = f, $t = c;
  }
}
function La(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = wo.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? n = t.reactions = null : (n[r] = n[s], n.pop());
    }
  }
  if (n === null && (t.f & ve) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Ae === null || !ks.call(Ae, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & Ue) !== 0 && (i.f ^= Ue, i.f &= ~Qt), i.v !== re && ur(i), va(i), $n(i, 0);
  }
}
function $n(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      La(e, n[r]);
}
function Tn(e) {
  var t = e.f;
  if ((t & qe) === 0) {
    X(e, ie);
    var n = D, r = ms;
    D = e, ms = !0;
    try {
      (t & (Je | ei)) !== 0 ? Ma(e) : kr(e), Mi(e);
      var s = zi(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = Ri;
      var i;
    } finally {
      ms = r, D = n;
    }
  }
}
async function dn() {
  await Promise.resolve(), ga();
}
function o(e) {
  var t = e.f, n = (t & ve) !== 0;
  if (R !== null && !Qe) {
    var r = D !== null && (D.f & qe) !== 0;
    if (!r && (at === null || !at.has(e))) {
      var s = R.deps;
      if ((R.f & xs) !== 0)
        e.rv < Ht && (e.rv = Ht, Ae === null && s !== null && s[Ie] === e ? Ie++ : Ae === null ? Ae = [e] : Ae.push(e));
      else {
        R.deps ?? (R.deps = []), ks.call(R.deps, e) || R.deps.push(e);
        var i = e.reactions;
        i === null ? e.reactions = [R] : ks.call(i, R) || i.push(R);
      }
    }
  }
  if (Rt && Kt.has(e))
    return Kt.get(e);
  if (n) {
    var a = (
      /** @type {Derived} */
      e
    );
    if (Rt) {
      var f = a.v;
      return ((a.f & ie) === 0 && a.reactions !== null || Fi(a)) && (f = dr(a)), Kt.set(a, f), f;
    }
    var c = (a.f & Ue) === 0 && !Qe && R !== null && (ms || (R.f & Ue) !== 0), u = (a.f & An) === 0;
    ss(a) && (c && (a.f |= Ue), pi(a)), c && !u && (hi(a), ji(a));
  }
  if ($e?.has(e))
    return $e.get(e);
  if ((e.f & Lt) !== 0)
    throw e.v;
  return e.v;
}
function ji(e) {
  if (e.f |= Ue, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & ve) !== 0 && (t.f & Ue) === 0 && (hi(
        /** @type {Derived} */
        t
      ), ji(
        /** @type {Derived} */
        t
      ));
}
function Fi(e) {
  if (e.v === re) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Kt.has(t) || (t.f & ve) !== 0 && Fi(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ls(e) {
  var t = Qe;
  try {
    return Qe = !0, e();
  } finally {
    Qe = t;
  }
}
const Na = ["touchstart", "touchmove"];
function Ra(e) {
  return Na.includes(e);
}
const Ut = Symbol("events"), Hi = /* @__PURE__ */ new Set(), ar = /* @__PURE__ */ new Set();
function ee(e, t, n) {
  (t[Ut] ?? (t[Ut] = {}))[e] = n;
}
function Da(e) {
  for (var t = 0; t < e.length; t++)
    Hi.add(e[t]);
  for (var n of ar)
    n(e);
}
let qr = null;
function Vr(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, s = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    s[0] || e.target
  );
  qr = e;
  var a = 0, f = qr === e && e[Ut];
  if (f) {
    var c = s.indexOf(f);
    if (c !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Ut] = t;
      return;
    }
    var u = s.indexOf(t);
    if (u === -1)
      return;
    c <= u && (a = c);
  }
  if (i = /** @type {Element} */
  s[a] || e.target, i !== t) {
    xo(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var p = R, _ = D;
    Ve(null), ct(null);
    try {
      for (var v, b = []; i !== null && i !== t; ) {
        try {
          var k = i[Ut]?.[r];
          k != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i) && k.call(i, e);
        } catch (y) {
          v ? b.push(y) : v = y;
        }
        if (e.cancelBubble) break;
        a++, i = a < s.length ? (
          /** @type {Element} */
          s[a]
        ) : null;
      }
      if (v) {
        for (let y of b)
          queueMicrotask(() => {
            throw y;
          });
        throw v;
      }
    } finally {
      e[Ut] = t, delete e.currentTarget, Ve(p), ct(_);
    }
  }
}
const Oa = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function za(e) {
  return (
    /** @type {string} */
    Oa?.createHTML(e) ?? e
  );
}
function Ui(e) {
  var t = hr("template");
  return t.innerHTML = za(e.replaceAll("<!>", "<!---->")), t.content;
}
function en(e, t) {
  var n = (
    /** @type {Effect} */
    D
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function z(e, t) {
  var n = (t & Go) !== 0, r = (t & Wo) !== 0, s, i = !e.startsWith("<!>");
  return () => {
    s === void 0 && (s = Ui(i ? e : "<!>" + e), n || (s = /** @type {TemplateNode} */
    /* @__PURE__ */ ot(s)));
    var a = (
      /** @type {TemplateNode} */
      r || yi ? document.importNode(s, !0) : s.cloneNode(!0)
    );
    if (n) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ ot(a)
      ), c = (
        /** @type {TemplateNode} */
        a.lastChild
      );
      en(f, c);
    } else
      en(a, a);
    return a;
  };
}
// @__NO_SIDE_EFFECTS__
function ja(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), s = `<${n}>${r ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var a = (
        /** @type {DocumentFragment} */
        Ui(s)
      ), f = (
        /** @type {Element} */
        /* @__PURE__ */ ot(a)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ ot(f);
    }
    var c = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return en(c, c), c;
  };
}
// @__NO_SIDE_EFFECTS__
function Ns(e, t) {
  return /* @__PURE__ */ ja(e, t, "svg");
}
function an(e = "") {
  {
    var t = mt(e + "");
    return en(t, t), t;
  }
}
function ln() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = mt();
  return e.append(t, n), en(t, n), e;
}
function T(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function me(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== /** @type {any} */
  (e[qn] ?? (e[qn] = e.nodeValue)) && (e[qn] = n, e.nodeValue = `${n}`);
}
function Fa(e, t) {
  return Ha(e, t);
}
const fs = /* @__PURE__ */ new Map();
function Ha(e, { target: t, anchor: n, props: r = {}, events: s, context: i, intro: a = !0, transformError: f }) {
  ka();
  var c = void 0, u = Aa(() => {
    var p = n ?? t.appendChild(mt());
    sa(
      /** @type {TemplateNode} */
      p,
      {
        pending: () => {
        }
      },
      (b) => {
        ii({});
        var k = (
          /** @type {ComponentContext} */
          ge
        );
        i && (k.c = i), s && (r.$$events = s), c = e(b, r) || {}, oi();
      },
      f
    );
    var _ = /* @__PURE__ */ new Set(), v = (b) => {
      for (var k = 0; k < b.length; k++) {
        var y = b[k];
        if (!_.has(y)) {
          _.add(y);
          var m = Ra(y);
          for (const B of [t, document]) {
            var O = fs.get(B);
            O === void 0 && (O = /* @__PURE__ */ new Map(), fs.set(B, O));
            var Z = O.get(y);
            Z === void 0 ? (B.addEventListener(y, Vr, { passive: m }), O.set(y, 1)) : O.set(y, Z + 1);
          }
        }
      }
    };
    return v(Ms(Hi)), ar.add(v), () => {
      for (var b of _)
        for (const m of [t, document]) {
          var k = (
            /** @type {Map<string, number>} */
            fs.get(m)
          ), y = (
            /** @type {number} */
            k.get(b)
          );
          --y == 0 ? (m.removeEventListener(b, Vr), k.delete(b), k.size === 0 && fs.delete(m)) : k.set(b, y);
        }
      ar.delete(v), p !== n && p.parentNode?.removeChild(p);
    };
  });
  return lr.set(c, u), c;
}
let lr = /* @__PURE__ */ new WeakMap();
function Ua(e, t) {
  const n = lr.get(e);
  return n ? (lr.delete(e), n(t)) : Promise.resolve();
}
var We, rt, Ne, Gt, es, ts, Cs;
class qa {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Pe(this, "anchor");
    /** @type {Map<Batch, Key>} */
    M(this, We, /* @__PURE__ */ new Map());
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
    M(this, rt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    M(this, Ne, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    M(this, Gt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    M(this, es, !0);
    /**
     * @param {Batch} batch
     */
    M(this, ts, (t) => {
      if (l(this, We).has(t)) {
        var n = (
          /** @type {Key} */
          l(this, We).get(t)
        ), r = l(this, rt).get(n);
        if (r)
          Ss(r), l(this, Gt).delete(n);
        else {
          var s = l(this, Ne).get(n);
          s && (Ss(s.effect), l(this, rt).set(n, s.effect), l(this, Ne).delete(n), s.fragment.lastChild.remove(), this.anchor.before(s.fragment), r = s.effect);
        }
        for (const [i, a] of l(this, We)) {
          if (l(this, We).delete(i), i === t)
            break;
          const f = l(this, Ne).get(a);
          f && (Ce(f.effect), l(this, Ne).delete(a));
        }
        for (const [i, a] of l(this, rt)) {
          if (i === n || l(this, Gt).has(i)) continue;
          const f = () => {
            if (Array.from(l(this, We).values()).includes(i)) {
              var u = document.createDocumentFragment();
              wr(a, u), u.append(mt()), l(this, Ne).set(i, { effect: a, fragment: u });
            } else
              Ce(a);
            l(this, Gt).delete(i), l(this, rt).delete(i);
          };
          l(this, es) || !r ? (l(this, Gt).add(i), Jt(a, f, !1)) : f();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    M(this, Cs, (t) => {
      l(this, We).delete(t);
      const n = Array.from(l(this, We).values());
      for (const [r, s] of l(this, Ne))
        n.includes(r) || (Ce(s.effect), l(this, Ne).delete(r));
    });
    this.anchor = t, A(this, es, n);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var r = (
      /** @type {Batch} */
      N
    ), s = Ti();
    if (n && !l(this, rt).has(t) && !l(this, Ne).has(t))
      if (s) {
        var i = document.createDocumentFragment(), a = mt();
        i.append(a), l(this, Ne).set(t, {
          effect: He(() => n(a)),
          fragment: i
        });
      } else
        l(this, rt).set(
          t,
          He(() => n(this.anchor))
        );
    if (l(this, We).set(r, t), s) {
      for (const [f, c] of l(this, rt))
        f === t ? r.unskip_effect(c) : r.skip_effect(c);
      for (const [f, c] of l(this, Ne))
        f === t ? r.unskip_effect(c.effect) : r.skip_effect(c.effect);
      r.oncommit(l(this, ts)), r.ondiscard(l(this, Cs));
    } else
      l(this, ts).call(this, r);
  }
}
We = new WeakMap(), rt = new WeakMap(), Ne = new WeakMap(), Gt = new WeakMap(), es = new WeakMap(), ts = new WeakMap(), Cs = new WeakMap();
function V(e, t, n = !1) {
  var r = new qa(e), s = n ? yn : 0;
  function i(a, f) {
    r.ensure(a, f);
  }
  mr(() => {
    var a = !1;
    t((f, c = 0) => {
      a = !0, i(c, f);
    }), a || i(-1, null);
  }, s);
}
function cn(e, t) {
  return t;
}
function Va(e, t, n) {
  for (var r = [], s = t.length, i, a = t.length, f = 0; f < s; f++) {
    let _ = t[f];
    Jt(
      _,
      () => {
        if (i) {
          if (i.pending.delete(_), i.done.add(_), i.pending.size === 0) {
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
    var c = r.length === 0 && n !== null;
    if (c) {
      var u = (
        /** @type {Element} */
        n
      ), p = (
        /** @type {Element} */
        u.parentNode
      );
      wa(p), p.append(u), e.items.clear();
    }
    cr(e, t, !c);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function cr(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = /* @__PURE__ */ new Set();
    for (const a of e.pending.values())
      for (const f of a)
        r.add(
          /** @type {EachItem} */
          e.items.get(f).e
        );
  }
  for (var s = 0; s < t.length; s++) {
    var i = t[s];
    if (r?.has(i)) {
      i.f |= it;
      const a = document.createDocumentFragment();
      wr(i, a);
    } else
      Ce(t[s], n);
  }
}
var Br;
function fn(e, t, n, r, s, i = null) {
  var a = e, f = /* @__PURE__ */ new Map(), c = (t & ti) !== 0;
  if (c) {
    var u = (
      /** @type {Element} */
      e
    );
    a = u.appendChild(mt());
  }
  var p = null, _ = /* @__PURE__ */ ua(() => {
    var B = n();
    return (
      /** @type {V[]} */
      Qr(B) ? B : B == null ? [] : Ms(B)
    );
  }), v, b = /* @__PURE__ */ new Map(), k = !0;
  function y(B) {
    (Z.effect.f & qe) === 0 && (Z.pending.delete(B), Z.fallback = p, Ba(Z, v, a, t, r), p !== null && (v.length === 0 ? (p.f & it) === 0 ? Ss(p) : (p.f ^= it, Gn(p, null, a)) : Jt(p, () => {
      p = null;
    })));
  }
  function m(B) {
    Z.pending.delete(B);
  }
  var O = mr(() => {
    v = /** @type {V[]} */
    o(_);
    for (var B = v.length, pe = /* @__PURE__ */ new Set(), xe = (
      /** @type {Batch} */
      N
    ), ce = Ti(), Y = 0; Y < B; Y += 1) {
      var Ze = v[Y], ft = r(Ze, Y), te = k ? null : f.get(ft);
      te ? (te.v && Sn(te.v, Ze), te.i && Sn(te.i, Y), ce && xe.unskip_effect(te.e)) : (te = Ya(
        f,
        k ? a : Br ?? (Br = mt()),
        Ze,
        ft,
        Y,
        s,
        t,
        n
      ), k || (te.e.f |= it), f.set(ft, te)), pe.add(ft);
    }
    if (B === 0 && i && !p && (k ? p = He(() => i(a)) : (p = He(() => i(Br ?? (Br = mt()))), p.f |= it)), B > pe.size && No(), !k)
      if (b.set(xe, pe), ce) {
        for (const [Be, Re] of f)
          pe.has(Be) || xe.skip_effect(Re.e);
        xe.oncommit(y), xe.ondiscard(m);
      } else
        y(xe);
    o(_);
  }), Z = { effect: O, items: f, pending: b, outrogroups: null, fallback: p };
  k = !1;
}
function Un(e) {
  for (; e !== null && (e.f & Xe) === 0; )
    e = e.next;
  return e;
}
function Ba(e, t, n, r, s) {
  var i = (r & Bo) !== 0, a = t.length, f = e.items, c = Un(e.effect.first), u, p = null, _, v = [], b = [], k, y, m, O;
  if (i)
    for (O = 0; O < a; O += 1)
      k = t[O], y = s(k, O), m = /** @type {EachItem} */
      f.get(y).e, (m.f & it) === 0 && (m.nodes?.a?.measure(), (_ ?? (_ = /* @__PURE__ */ new Set())).add(m));
  for (O = 0; O < a; O += 1) {
    if (k = t[O], y = s(k, O), m = /** @type {EachItem} */
    f.get(y).e, e.outrogroups !== null)
      for (const te of e.outrogroups)
        te.pending.delete(m), te.done.delete(m);
    if ((m.f & we) !== 0 && (Ss(m), i && (m.nodes?.a?.unfix(), (_ ?? (_ = /* @__PURE__ */ new Set())).delete(m))), (m.f & it) !== 0)
      if (m.f ^= it, m === c)
        Gn(m, null, n);
      else {
        var Z = p ? p.next : c;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), Ct(e, p, m), Ct(e, m, Z), Gn(m, Z, n), p = m, v = [], b = [], c = Un(p.next);
        continue;
      }
    if (m !== c) {
      if (u !== void 0 && u.has(m)) {
        if (v.length < b.length) {
          var B = b[0], pe;
          p = B.prev;
          var xe = v[0], ce = v[v.length - 1];
          for (pe = 0; pe < v.length; pe += 1)
            Gn(v[pe], B, n);
          for (pe = 0; pe < b.length; pe += 1)
            u.delete(b[pe]);
          Ct(e, xe.prev, ce.next), Ct(e, p, xe), Ct(e, ce, B), c = B, p = ce, O -= 1, v = [], b = [];
        } else
          u.delete(m), Gn(m, c, n), Ct(e, m.prev, m.next), Ct(e, m, p === null ? e.effect.first : p.next), Ct(e, p, m), p = m;
        continue;
      }
      for (v = [], b = []; c !== null && c !== m; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(c), b.push(c), c = Un(c.next);
      if (c === null)
        continue;
    }
    (m.f & it) === 0 && v.push(m), p = m, c = Un(m.next);
  }
  if (e.outrogroups !== null) {
    for (const te of e.outrogroups)
      te.pending.size === 0 && (cr(e, Ms(te.done)), e.outrogroups?.delete(te));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (c !== null || u !== void 0) {
    var Y = [];
    if (u !== void 0)
      for (m of u)
        (m.f & we) === 0 && Y.push(m);
    for (; c !== null; )
      (c.f & we) === 0 && c !== e.fallback && Y.push(c), c = Un(c.next);
    var Ze = Y.length;
    if (Ze > 0) {
      var ft = (r & ti) !== 0 && a === 0 ? n : null;
      if (i) {
        for (O = 0; O < Ze; O += 1)
          Y[O].nodes?.a?.measure();
        for (O = 0; O < Ze; O += 1)
          Y[O].nodes?.a?.fix();
      }
      Va(e, Y, ft);
    }
  }
  i && Wt(() => {
    if (_ !== void 0)
      for (m of _)
        m.nodes?.a?.apply();
  });
}
function Ya(e, t, n, r, s, i, a, f) {
  var c = (a & qo) !== 0 ? (a & Yo) === 0 ? /* @__PURE__ */ _a(n, !1, !1) : Zt(n) : null, u = (a & Vo) !== 0 ? Zt(s) : null;
  return {
    v: c,
    i: u,
    e: He(() => (i(t, c ?? n, u ?? s, f), () => {
      e.delete(r);
    }))
  };
}
function Gn(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, s = e.nodes.end, i = t && (t.f & it) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ ns(r)
      );
      if (i.before(r), r === s)
        return;
      r = a;
    }
}
function Ct(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Ga(e, t, n = !1, r = !1, s = !1, i = !1) {
  var a = e, f = "";
  if (n)
    var c = (
      /** @type {Element} */
      e
    );
  he(() => {
    var u = (
      /** @type {Effect} */
      D
    );
    if (f !== (f = t() ?? "")) {
      if (n) {
        u.nodes = null, c.innerHTML = /** @type {string} */
        f, f !== "" && en(
          /** @type {TemplateNode} */
          /* @__PURE__ */ ot(c),
          /** @type {TemplateNode} */
          c.lastChild
        );
        return;
      }
      if (u.nodes !== null && (Pi(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), f !== "") {
        var p = r ? Ko : s ? Jo : void 0, _ = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          hr(r ? "svg" : s ? "math" : "template", p)
        );
        _.innerHTML = /** @type {any} */
        f;
        var v = r || s ? _ : (
          /** @type {HTMLTemplateElement} */
          _.content
        );
        if (en(
          /** @type {TemplateNode} */
          /* @__PURE__ */ ot(v),
          /** @type {TemplateNode} */
          v.lastChild
        ), r || s)
          for (; /* @__PURE__ */ ot(v); )
            a.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ ot(v)
            );
        else
          a.before(v);
      }
    }
  });
}
function Wa(e, t) {
  Ci(() => {
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
      const s = hr("style");
      s.id = t.hash, s.textContent = t.code, r.appendChild(s);
    }
  });
}
const Yr = [...` 	
\r\f \v\uFEFF`];
function Ka(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (t && (r = r ? r + " " + t : t), n) {
    for (var s of Object.keys(n))
      if (n[s])
        r = r ? r + " " + s : s;
      else if (r.length)
        for (var i = s.length, a = 0; (a = r.indexOf(s, a)) >= 0; ) {
          var f = a + i;
          (a === 0 || Yr.includes(r[a - 1])) && (f === r.length || Yr.includes(r[f])) ? r = (a === 0 ? "" : r.substring(0, a)) + r.substring(f + 1) : a = f;
        }
  }
  return r === "" ? null : r;
}
function Ja(e, t) {
  return e == null ? null : String(e);
}
function jt(e, t, n, r, s, i) {
  var a = (
    /** @type {any} */
    e[Xs]
  );
  if (a !== n || a === void 0) {
    var f = Ka(n, r, i);
    f == null ? e.removeAttribute("class") : e.className = f, e[Xs] = n;
  } else if (i && s !== i)
    for (var c in i) {
      var u = !!i[c];
      (s == null || u !== !!s[c]) && e.classList.toggle(c, u);
    }
  return i;
}
function Gr(e, t, n, r) {
  var s = (
    /** @type {any} */
    e[Zs]
  );
  if (s !== t) {
    var i = Ja(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e[Zs] = t;
  }
  return r;
}
const $a = Symbol("is custom element"), Qa = Symbol("is html");
function us(e, t, n, r) {
  var s = Xa(e);
  s[t] !== (s[t] = n) && (t === "loading" && (e[Po] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Za(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Xa(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[vs] ?? (e[vs] = {
      [$a]: e.nodeName.includes("-"),
      [Qa]: e.namespaceURI === ni
    })
  );
}
var Wr = /* @__PURE__ */ new Map();
function Za(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Wr.get(t);
  if (n) return n;
  Wr.set(t, n = []);
  for (var r, s = e, i = Element.prototype; i !== s; ) {
    r = yo(s);
    for (var a in r)
      r[a].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      a !== "innerHTML" && a !== "textContent" && a !== "innerText" && n.push(a);
    s = Xr(s);
  }
  return n;
}
function el(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet();
  ya(e, "input", async (s) => {
    var i = s ? e.defaultValue : e.value;
    if (i = Gs(e) ? Ws(i) : i, n(i), N !== null && r.add(N), await dn(), i !== (i = t())) {
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
  Ls(t) == null && e.value && (n(Gs(e) ? Ws(e.value) : e.value), N !== null && r.add(N)), _r(() => {
    var s = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        N
      );
      if (r.has(i))
        return;
    }
    Gs(e) && s === Ws(e.value) || e.type === "date" && !s && !e.value || s !== e.value && (e.value = s ?? "");
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
  return e === t || e?.[ds] === t;
}
function Js(e = {}, t, n, r) {
  var s = (
    /** @type {ComponentContext} */
    ge.r
  ), i = (
    /** @type {Effect} */
    D
  );
  return Ci(() => {
    var a, f;
    return _r(() => {
      a = f, f = [], Ls(() => {
        Ks(n(...f), e) || (t(e, ...f), a && Ks(n(...a), e) && t(null, ...a));
      });
    }), () => {
      let c = i;
      for (; c !== s && c.parent !== null && c.parent.f & Qs; )
        c = c.parent;
      const u = () => {
        f && Ks(n(...f), e) && t(null, ...f);
      }, p = c.teardown;
      c.teardown = () => {
        u(), p?.();
      };
    };
  }), e;
}
function tl(e) {
  ge === null && Io(), _s(() => {
    const t = Ls(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const nl = "5";
var $r;
typeof window < "u" && (($r = window.__svelte ?? (window.__svelte = {})).v ?? ($r.v = /* @__PURE__ */ new Set())).add(nl);
var sl = /* @__PURE__ */ z('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), rl = /* @__PURE__ */ z('<div class="settings-assistant-grid svelte-beco3k"></div>'), il = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), ol = /* @__PURE__ */ z('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), al = /* @__PURE__ */ z('<div class="settings-history-list svelte-beco3k"></div>'), ll = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k"> </p>'), cl = /* @__PURE__ */ z('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), fl = /* @__PURE__ */ z(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), ul = /* @__PURE__ */ z('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), dl = /* @__PURE__ */ z('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), vl = /* @__PURE__ */ z('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), pl = /* @__PURE__ */ z('<div class="assistant-selector svelte-beco3k"></div>'), hl = /* @__PURE__ */ z('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), gl = /* @__PURE__ */ z('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), bl = /* @__PURE__ */ z('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), _l = /* @__PURE__ */ z('<div class="history-panel svelte-beco3k"><!></div>'), ml = /* @__PURE__ */ z(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), kl = /* @__PURE__ */ z(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), wl = /* @__PURE__ */ z('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), Kr = /* @__PURE__ */ Ns('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Jr = /* @__PURE__ */ Ns('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), xl = /* @__PURE__ */ z('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), yl = /* @__PURE__ */ z('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), El = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), Sl = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), Tl = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), Al = /* @__PURE__ */ z('<p class="stream-status svelte-beco3k"> </p>'), Cl = /* @__PURE__ */ z('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), Ml = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), Pl = /* @__PURE__ */ z('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), Il = /* @__PURE__ */ z("<!> <!> <!>", 1), Ll = /* @__PURE__ */ z('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), Nl = /* @__PURE__ */ z('<button class="suggestion-chip svelte-beco3k"> </button>'), Rl = /* @__PURE__ */ z('<div class="suggestions svelte-beco3k"><!></div>'), Dl = /* @__PURE__ */ Ns('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Ol = /* @__PURE__ */ Ns('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), zl = /* @__PURE__ */ z('<div><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const jl = {
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

	/* ══════════════════════ Settings page ══════════════════════ */.settings-page.svelte-beco3k {max-width:680px;margin:0 auto;padding:36px 24px 60px;font-family:inherit;color:#111;}.settings-title.svelte-beco3k {font-size:1.35rem;font-weight:700;margin:0 0 32px;color:#111;}.settings-section.svelte-beco3k {background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:18px;display:flex;flex-direction:column;gap:14px;}.settings-section-title.svelte-beco3k {font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0;}.settings-section-desc.svelte-beco3k {font-size:0.875rem;color:#6b7280;margin:-8px 0 0;}

	/* Default assistant grid */.settings-assistant-grid.svelte-beco3k {display:flex;flex-wrap:wrap;gap:10px;}.settings-assistant-btn.svelte-beco3k {display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;transition:border-color 0.15s, background 0.15s;min-width:80px;}.settings-assistant-btn.selected.svelte-beco3k {border-color:#4f46e5;background:#eef2ff;}.settings-assistant-emoji.svelte-beco3k {font-size:1.5rem;}.settings-assistant-name.svelte-beco3k {font-size:0.8rem;font-weight:500;color:#374151;}

	/* Toggle rows */.settings-toggle.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;}.settings-toggle-info.svelte-beco3k {display:flex;flex-direction:column;gap:2px;}.settings-toggle-label.svelte-beco3k {font-size:0.9rem;font-weight:500;color:#111;}.settings-toggle-desc.svelte-beco3k {font-size:0.8rem;color:#6b7280;}.settings-switch.svelte-beco3k {flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#d1d5db;border:none;position:relative;cursor:pointer;transition:background 0.2s;outline:none;padding:0;}.settings-switch.svelte-beco3k::after {content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s;}.settings-switch.on.svelte-beco3k {background:#4f46e5;}.settings-switch.on.svelte-beco3k::after {transform:translateX(18px);}

	/* History list */.settings-history-list.svelte-beco3k {display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;}.settings-history-item.svelte-beco3k {display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:#f9fafb;}.settings-history-body.svelte-beco3k {flex:1;min-width:0;}.settings-history-title.svelte-beco3k {font-size:0.875rem;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.settings-history-meta.svelte-beco3k {font-size:0.75rem;color:#9ca3af;margin-top:2px;}.settings-history-delete.svelte-beco3k {flex-shrink:0;width:28px;height:28px;border:none;background:transparent;cursor:pointer;border-radius:6px;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 0.15s, color 0.15s;}.settings-history-delete.svelte-beco3k:hover {background:#fee2e2;color:#dc2626;}.settings-danger-btn.svelte-beco3k {align-self:flex-start;padding:7px 14px;border:1.5px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;font-size:0.85rem;font-weight:500;cursor:pointer;transition:background 0.15s;}.settings-danger-btn.svelte-beco3k:hover:not(:disabled) {background:#fee2e2;}.settings-danger-btn.svelte-beco3k:disabled {opacity:0.5;cursor:not-allowed;}

	/* About */.settings-about-row.svelte-beco3k {display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;}.settings-about-label.svelte-beco3k {color:#6b7280;}.settings-about-value.svelte-beco3k {font-weight:500;color:#111;}.settings-api-status.svelte-beco3k {font-size:0.85rem;font-weight:500;}.settings-api-status.online.svelte-beco3k {color:#16a34a;}.settings-api-status.offline.svelte-beco3k {color:#dc2626;}.settings-api-status.unknown.svelte-beco3k {color:#9ca3af;}.settings-link-btn.svelte-beco3k {align-self:flex-start;padding:6px 12px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;color:#4f46e5;font-size:0.8rem;cursor:pointer;transition:background 0.15s;}.settings-link-btn.svelte-beco3k:hover {background:#eef2ff;}`
};
function Fl(e, t) {
  ii(t, !0), Wa(e, jl);
  const n = {
    "vi64l-3aaaa-aaaae-qj4va-cai": "demo",
    "uq2mu-kaaaa-aaaah-avqcq-cai": "test",
    "iebdk-kqaaa-aaaau-agoxq-cai": "staging"
  };
  function r() {
    const d = t.ctx.config?.network;
    if (d && d !== "ic") return d;
    const g = globalThis.__CANISTER_IDS;
    if (g?.network && g.network !== "ic") return g.network;
    const w = t.ctx.config?.fileRegistryCanisterId || g?.file_registry || "";
    return w && n[w] ? n[w] : window.location.hostname.includes("icp0.io") ? "test" : "staging";
  }
  let s = /* @__PURE__ */ P(Ke([])), i = /* @__PURE__ */ P(""), a = /* @__PURE__ */ P(!1), f = /* @__PURE__ */ P(""), c = /* @__PURE__ */ P(!1), u = /* @__PURE__ */ P(Ke(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), p = /* @__PURE__ */ P(""), _ = /* @__PURE__ */ P(void 0), v = /* @__PURE__ */ P(Ke([])), b = /* @__PURE__ */ P(!1), k = /* @__PURE__ */ P(void 0), y = /* @__PURE__ */ P(Ke([])), m = /* @__PURE__ */ P(null), O = /* @__PURE__ */ P(!1), Z = /* @__PURE__ */ P(null), B = /* @__PURE__ */ P(void 0), pe = /* @__PURE__ */ P("100%"), xe = /* @__PURE__ */ P(null), ce = /* @__PURE__ */ P(!1), Y = /* @__PURE__ */ P(null), Ze = /* @__PURE__ */ P(0), ft, te, Be = /* @__PURE__ */ P(null), Re = /* @__PURE__ */ P(Ke([])), wt = /* @__PURE__ */ P(!1), rs = /* @__PURE__ */ P(!1);
  const Mn = "https://geister-api.realmsgos.dev/", qi = 36e4;
  let Vi = `${Mn}api/ask`, Bi = `${Mn}suggestions`, Yi = `${Mn}api/personas/assistants`, Pn = `${Mn}api/conversations`;
  function Gi(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function xr(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function Wi(d) {
    !d || d.id === o(Ze) || (h(Ze, d.id, !0), h(i, d.message, !0), h(ce, !0), d.autoSend ? setTimeout(() => void sn(), 150) : dn().then(Fs));
  }
  function Ki() {
    if (xr(o(Y)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function Ji() {
    ft = t.ctx.host?.pendingPrompt?.subscribe?.(Wi), te = t.ctx.host?.focus?.subscribe?.((d) => {
      h(Y, d, !0);
    });
  }
  function yr(d, g) {
    if (g === 503 && d instanceof Error && d.message) {
      const w = d.message.toLowerCase();
      return w.includes("pod") || w.includes("llm backend") || w.includes("ollama") || w.includes("waking up") || w.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return g === 502 || g === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : g === 504 || g === 524 ? "The request timed out before the server could respond. Please try again." : g && g >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? yr(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function $i(d) {
    const g = d.toLowerCase();
    return g.includes("llm backend") || g.includes("cannot reach ollama") || g.includes("ollama at");
  }
  function In() {
    h(u, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function Er() {
    h(u, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function Qi(d) {
    const g = d.toLowerCase();
    return g.includes("waking up") || g.includes("still starting");
  }
  function Rs() {
    h(f, ""), h(c, !1);
  }
  function is(d, g) {
    d.trim() && (h(c, !0), h(f, ""));
    const w = { text: d, isUser: !1, ...g.trim() ? { thinking: g } : {} }, x = o(s)[o(s).length - 1];
    !x || x.isUser ? h(s, [...o(s), w], !0) : h(s, o(s).map((I, Me) => Me === o(s).length - 1 ? { ...I, ...w } : I), !0), dn().then(zs);
  }
  function Xi(d, g) {
    const w = typeof d.type == "string" ? d.type : d.text ? "text" : "", x = typeof d.text == "string" ? d.text : "";
    if (w === "status" && x) {
      In(), h(f, x, !0);
      return;
    }
    if (w === "thinking" && x) {
      In(), g.thinking += x, is(g.text, g.thinking);
      return;
    }
    x && (In(), g.text += x, is(g.text, g.thinking));
  }
  let Ln = "", xt = "", Sr, Tr, yt = /* @__PURE__ */ P(!1);
  const tn = !!t.ctx.sidebarPanel, Ar = "llm_chat_prefs";
  function Zi() {
    try {
      return JSON.parse(localStorage.getItem(Ar) || "{}");
    } catch {
      return {};
    }
  }
  function eo(d) {
    try {
      localStorage.setItem(Ar, JSON.stringify(d));
    } catch {
    }
  }
  const Ds = Zi();
  let nn = /* @__PURE__ */ P(Ke(Ds.defaultAssistant || "")), Dt = /* @__PURE__ */ P(Ds.showSuggestions !== !1), Nn = /* @__PURE__ */ P(Ds.sharePageContext !== !1);
  _s(() => {
    eo({
      defaultAssistant: o(nn),
      showSuggestions: o(Dt),
      sharePageContext: o(Nn)
    });
  });
  let Rn = /* @__PURE__ */ P("unknown"), os = /* @__PURE__ */ P(!1), Os = /* @__PURE__ */ P(!1);
  async function Cr() {
    try {
      const d = await fetch(`${Mn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      h(Rn, d.ok ? "online" : "offline", !0);
    } catch {
      h(Rn, "offline");
    }
  }
  async function to() {
    if (!(!xt || !o(yt))) {
      h(os, !0);
      try {
        await js(), await Promise.all(o(Re).map((d) => fetch(`${Pn}/${d.conversation_id}`, { method: "DELETE" }))), h(Re, [], !0), h(s, [], !0), h(Be, null), h(Os, !0), setTimeout(
          () => {
            h(Os, !1);
          },
          2e3
        );
      } catch {
      } finally {
        h(os, !1);
      }
    }
  }
  tl(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", g = t.ctx.config?.canisterId || "";
    if (Ln = d || g, Sr = t.ctx.principal?.subscribe?.((w) => {
      xt = w || "";
    }), Tr = t.ctx.isAuthenticated?.subscribe?.((w) => {
      h(yt, w, !0);
    }), !tn) {
      const w = window.visualViewport;
      if (w) {
        const x = () => {
          const I = o(B)?.getBoundingClientRect().top ?? w.offsetTop, Me = Math.max(Math.round(w.height - I), 200);
          h(pe, `${Me}px`);
        };
        await dn(), x(), w.addEventListener("resize", x), w.addEventListener("scroll", x), window.addEventListener("resize", x), window.__chatVpCleanup = () => {
          w.removeEventListener("resize", x), w.removeEventListener("scroll", x), window.removeEventListener("resize", x);
        };
      }
    }
    if (no(), Ji(), await so(), o(nn) && o(y).length > 0) {
      const w = o(y).find((x) => x.id === o(nn));
      w && h(m, w, !0);
    }
    !o(ce) && o(Dt) && await as(), tn || (Cr(), o(yt) && await js());
  });
  function no() {
    try {
      const d = new URLSearchParams(window.location.search), g = d.get("explain");
      if (!g) return;
      const [w, x] = g.split(":");
      if (w === "codex" && x)
        h(ce, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: x })).then((I) => {
          if (I.success) {
            const Et = (typeof I.response == "string" ? JSON.parse(I.response) : I.response).codex?.name || `codex_${x}`, fe = `/extensions/codex_viewer/${x}`;
            h(xe, x, !0), h(i, `Please explain this codex: [${Et}](${fe})`), setTimeout(() => sn(), 300);
          }
        }).catch((I) => {
          console.error("Failed to fetch codex for explanation:", I), h(ce, !1);
        });
      else if (w === "financial_statements") {
        h(ce, !0);
        const I = d.get("context") || "";
        h(i, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${I}`), setTimeout(() => sn(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  _s(() => {
    o(s), dn().then(zs);
  });
  function zs() {
    o(_) && (o(_).scrollTop = o(_).scrollHeight);
  }
  async function so() {
    if (!o(O)) {
      h(O, !0);
      try {
        const d = await fetch(Yi, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        const g = await d.json();
        g.assistants && Array.isArray(g.assistants) && (h(y, g.assistants, !0), o(y).length > 0 && !o(m) && h(m, o(y)[0], !0));
      } catch (d) {
        console.error("Error fetching assistants:", d);
      } finally {
        h(O, !1);
      }
    }
  }
  async function as() {
    if (!o(b)) {
      h(b, !0);
      try {
        const d = new URLSearchParams({
          user_principal: xt || "",
          realm_principal: Ln || "",
          persona: o(m)?.id || "ashoka"
        }), g = await fetch(`${Bi}?${d.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!g.ok) throw new Error(`HTTP ${g.status}`);
        const w = await g.json();
        w.suggestions && Array.isArray(w.suggestions) && h(v, w.suggestions, !0);
      } catch (d) {
        console.error("Error fetching suggestions:", d);
      } finally {
        h(b, !1);
      }
    }
  }
  async function sn() {
    if (!o(i).trim()) return;
    h(p, ""), h(
      s,
      [
        ...o(s),
        { text: o(i), isUser: !0 }
      ],
      !0
    );
    const d = o(i);
    h(i, ""), h(a, !0), Rs(), h(f, o(u) ? "Thinking…" : "", !0);
    try {
      await ao();
      const g = r(), w = {
        question: d,
        realm_principal: Ln,
        user_principal: xt,
        stream: !0,
        verbosity: 1,
        persona: o(m)?.id || "ashoka",
        network: g,
        ...o(Be) ? { conversation_id: o(Be) } : {}
      };
      if (o(xe))
        w.explain_codex_id = o(xe), h(xe, null);
      else {
        const ue = Gi(o(Y)?.uri);
        ue && (w.explain_codex_id = ue);
      }
      const x = xr(o(Y)?.uri);
      x && (w.explain_proposal_id = x, w.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(Y)?.label || "Proposal",
        proposalId: x
      }), o(Y) && (w.focus = {
        uri: o(Y).uri,
        label: o(Y).label
      });
      const I = await fetch(Vi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(w),
        signal: AbortSignal.timeout(qi)
      });
      if (!I.ok) {
        let ue = "";
        try {
          const ye = await I.json();
          ue = typeof ye?.error == "string" ? ye.error : "";
        } catch {
        }
        throw ue ? Object.assign(new Error(ue), { httpStatus: I.status }) : Object.assign(new Error(`HTTP error! Status: ${I.status}`), { httpStatus: I.status });
      }
      const Me = I.body?.getReader();
      if (!Me) throw new Error("Response body is not readable");
      const Et = new TextDecoder(), fe = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: ue, value: ye } = await Me.read();
          if (ue) break;
          const On = Et.decode(ye, { stream: !0 }).split(`
`);
          for (const et of On)
            if (et.startsWith("data: ")) {
              const St = et.slice(6);
              if (St === "[DONE]") continue;
              try {
                Xi(JSON.parse(St), fe);
              } catch {
                fe.text += St, is(fe.text, fe.thinking);
              }
            } else et.trim() && !et.startsWith(":") && (fe.text += et, is(fe.text, fe.thinking));
        }
      } finally {
        Me.releaseLock();
      }
      const ut = fe.text, Dn = fe.thinking;
      ut.trim() ? $i(ut) ? (h(p, "The AI backend is temporarily offline. Please try again in a few minutes."), Er()) : ut.trim() && In() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? h(s, o(s).map((ue, ye) => ye === o(s).length - 1 ? { ...ue, text: "No response from LLM" } : ue), !0) : h(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), h(a, !1), Rs(), h(ce, !1), await as();
    } catch (g) {
      console.error("Error calling LLM:", g), h(p, yr(g, g?.httpStatus), !0), Qi(o(p)) && Er(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && h(s, o(s).slice(0, -1), !0);
    } finally {
      h(a, !1), Rs(), h(ce, !1);
    }
  }
  function ro() {
    h(p, "");
  }
  async function js() {
    if (!(!xt || !o(yt))) {
      h(rs, !0);
      try {
        const d = new URLSearchParams({
          user_principal: xt,
          realm_principal: Ln
        }), g = await fetch(`${Pn}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!g.ok) return;
        const w = await g.json();
        h(Re, (w.conversations || []).sort((x, I) => new Date(I.updated_at).getTime() - new Date(x.updated_at).getTime()), !0);
      } catch {
      } finally {
        h(rs, !1);
      }
    }
  }
  async function Mr(d) {
    h(wt, !1), h(s, [], !0), h(Be, d.conversation_id, !0);
    const g = o(y).find((w) => w.id === d.persona);
    g && h(m, g, !0);
    try {
      const w = await fetch(`${Pn}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!w.ok) return;
      const x = await w.json();
      h(s, lo(x.messages || []), !0), o(s).some((I) => !I.isUser) && In(), await dn(), zs();
    } catch {
    }
  }
  async function io() {
    h(wt, !1), h(s, [], !0), h(Be, null), h(p, ""), h(v, [], !0), await as();
  }
  async function Pr(d, g) {
    g.stopPropagation();
    try {
      await fetch(`${Pn}/${d}`, { method: "DELETE" }), h(Re, o(Re).filter((w) => w.conversation_id !== d), !0), o(Be) === d && (h(s, [], !0), h(Be, null));
    } catch {
    }
  }
  async function oo() {
    h(wt, !0), await js();
  }
  function Ir(d) {
    const g = new Date(d), x = (/* @__PURE__ */ new Date()).getTime() - g.getTime(), I = Math.floor(x / 864e5);
    return I === 0 ? g.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : I === 1 ? "Yesterday" : I < 7 ? g.toLocaleDateString([], { weekday: "short" }) : g.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function ao() {
    if (!(o(Be) || !xt || !o(yt)))
      try {
        const d = await fetch(Pn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: xt,
            realm_principal: Ln,
            persona: o(m)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const g = await d.json();
          h(Be, g.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function Lr(d, g) {
    const w = () => {
      h(Z, g, !0), setTimeout(
        () => {
          h(Z, null);
        },
        1500
      );
    }, x = () => {
      const I = document.createElement("textarea");
      I.value = d, I.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(I), I.focus(), I.select();
      try {
        document.execCommand("copy"), w();
      } catch {
      }
      document.body.removeChild(I);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(w).catch(x) : x();
  }
  function lo(d) {
    const g = [];
    for (const w of d) {
      if (!w || typeof w != "object") continue;
      const x = w;
      if (x.role && x.content != null) {
        g.push({ text: String(x.content), isUser: x.role === "user" });
        continue;
      }
      x.question != null && String(x.question).trim() && g.push({ text: String(x.question), isUser: !0 }), x.response != null && String(x.response).trim() && g.push({ text: String(x.response), isUser: !1 });
    }
    return g;
  }
  function co(d) {
    if (!d) return "";
    let g = d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return g = g.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), g;
  }
  function Fs() {
    if (o(k)) {
      o(k).style.height = "auto";
      const d = Math.max(40, Math.min(o(k).scrollHeight, 120));
      o(k).style.height = d + "px";
    }
  }
  function fo(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), sn()), setTimeout(Fs, 0);
  }
  function uo(d) {
    h(i, d, !0), sn();
  }
  function vo(d) {
    h(m, d, !0), h(s, [], !0), as();
  }
  _s(() => () => {
    Sr?.(), Tr?.(), ft?.(), te?.(), window.__chatVpCleanup?.();
  });
  var Nr = ln(), po = zt(Nr);
  {
    var ho = (d) => {
      var g = fl(), w = L(E(g), 2), x = L(E(w), 4);
      {
        var I = (J) => {
          var be = rl();
          fn(be, 21, () => o(y), cn, (rn, S) => {
            var H = sl(), W = E(H), K = E(W), Q = L(W, 2), ne = E(Q);
            he(() => {
              jt(H, 1, `settings-assistant-btn ${o(nn) === o(S).id || !o(nn) && o(y)[0].id === o(S).id ? "selected" : ""}`, "svelte-beco3k"), me(K, o(S).emoji), me(ne, o(S).name);
            }), ee("click", H, () => h(nn, o(S).id, !0)), T(rn, H);
          }), T(J, be);
        }, Me = (J) => {
          var be = il();
          T(J, be);
        };
        V(x, (J) => {
          o(y).length > 0 ? J(I) : J(Me, -1);
        });
      }
      var Et = L(w, 2), fe = L(E(Et), 2), ut = L(E(fe), 2), Dn = L(fe, 2), ue = L(E(Dn), 2), ye = L(Et, 2);
      {
        var ls = (J) => {
          var be = cl(), rn = L(E(be), 2);
          {
            var S = (C) => {
              var j = al();
              fn(j, 21, () => o(Re), cn, (oe, G) => {
                var _e = ol(), tt = E(_e), dt = E(tt), De = E(dt), Ye = L(dt, 2), se = E(Ye), ae = L(tt, 2);
                he(
                  (le) => {
                    me(De, o(G).title), me(se, `${le ?? ""} · ${o(G).message_count ?? ""} message${o(G).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Ir(o(G).updated_at)]
                ), ee("click", ae, (le) => Pr(o(G).conversation_id, le)), T(oe, _e);
              }), T(C, j);
            }, H = (C) => {
              var j = ll(), oe = E(j);
              he(() => me(oe, o(rs) ? "Loading…" : "No conversations yet.")), T(C, j);
            };
            V(rn, (C) => {
              o(Re).length > 0 ? C(S) : C(H, -1);
            });
          }
          var W = L(rn, 2), K = E(W);
          {
            var Q = (C) => {
              var j = an("✓ History cleared");
              T(C, j);
            }, ne = (C) => {
              var j = an("Clearing…");
              T(C, j);
            }, q = (C) => {
              var j = an("Clear all history");
              T(C, j);
            };
            V(K, (C) => {
              o(Os) ? C(Q) : o(os) ? C(ne, 1) : C(q, -1);
            });
          }
          he(() => W.disabled = o(os) || o(Re).length === 0), ee("click", W, to), T(J, be);
        };
        V(ye, (J) => {
          o(yt) && J(ls);
        });
      }
      var On = L(ye, 2), et = L(E(On), 4), St = L(E(et), 2), cs = E(St);
      {
        var Hs = (J) => {
          var be = an("● Online");
          T(J, be);
        }, Us = (J) => {
          var be = an("● Offline");
          T(J, be);
        }, Ot = (J) => {
          var be = an("Checking…");
          T(J, be);
        };
        V(cs, (J) => {
          o(Rn) === "online" ? J(Hs) : o(Rn) === "offline" ? J(Us, 1) : J(Ot, -1);
        });
      }
      var zn = L(et, 2);
      he(() => {
        jt(ut, 1, `settings-switch ${o(Dt) ? "on" : ""}`, "svelte-beco3k"), us(ut, "aria-checked", o(Dt)), jt(ue, 1, `settings-switch ${o(Nn) ? "on" : ""}`, "svelte-beco3k"), us(ue, "aria-checked", o(Nn)), jt(St, 1, `settings-api-status ${o(Rn) ?? ""}`, "svelte-beco3k");
      }), ee("click", ut, () => h(Dt, !o(Dt))), ee("click", ue, () => h(Nn, !o(Nn))), ee("click", zn, Cr), T(d, g);
    }, go = (d) => {
      var g = zl();
      let w;
      var x = E(g);
      {
        var I = (S) => {
          var H = ul(), W = E(H), K = L(W, 2);
          he(() => jt(K, 1, `toolbar-btn ${o(wt) ? "active" : ""}`, "svelte-beco3k")), ee("click", W, io), ee("click", K, function(...Q) {
            (o(wt) ? () => h(wt, !1) : oo)?.apply(this, Q);
          }), T(S, H);
        };
        V(x, (S) => {
          o(yt) && S(I);
        });
      }
      var Me = L(x, 2);
      {
        var Et = (S) => {
          var H = dl(), W = E(H), K = E(W), Q = L(W, 2);
          he(() => {
            us(W, "title", o(Y).uri), me(K, o(Y).label);
          }), ee("click", Q, Ki), T(S, H);
        };
        V(Me, (S) => {
          tn && o(Y)?.label && S(Et);
        });
      }
      var fe = L(Me, 2);
      {
        var ut = (S) => {
          var H = pl();
          fn(H, 21, () => o(y), cn, (W, K) => {
            var Q = vl(), ne = E(Q), q = E(ne), C = L(ne, 2), j = E(C);
            he(() => {
              jt(Q, 1, `assistant-btn ${o(m)?.id === o(K).id ? "active" : ""}`, "svelte-beco3k"), us(Q, "title", o(K).description), me(q, o(K).emoji), me(j, o(K).name);
            }), ee("click", Q, () => vo(o(K))), T(W, Q);
          }), T(S, H);
        };
        V(fe, (S) => {
          o(y).length > 1 && S(ut);
        });
      }
      var Dn = L(fe, 2);
      {
        var ue = (S) => {
          var H = _l(), W = E(H);
          {
            var K = (q) => {
              var C = hl();
              T(q, C);
            }, Q = (q) => {
              var C = gl();
              T(q, C);
            }, ne = (q) => {
              var C = ln(), j = zt(C);
              fn(j, 17, () => o(Re), cn, (oe, G) => {
                var _e = bl(), tt = E(_e), dt = E(tt), De = E(dt), Ye = L(dt, 2), se = E(Ye), ae = L(tt, 2);
                he(
                  (le) => {
                    me(De, o(G).title), me(se, `${le ?? ""} · ${o(G).message_count ?? ""} msg${o(G).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Ir(o(G).updated_at)]
                ), ee("click", _e, () => Mr(o(G))), ee("keydown", _e, (le) => le.key === "Enter" && Mr(o(G))), ee("click", ae, (le) => Pr(o(G).conversation_id, le)), T(oe, _e);
              }), T(q, C);
            };
            V(W, (q) => {
              o(rs) ? q(K) : o(Re).length === 0 ? q(Q, 1) : q(ne, -1);
            });
          }
          T(S, H);
        };
        V(Dn, (S) => {
          o(wt) && S(ue);
        });
      }
      var ye = L(Dn, 2), ls = E(ye);
      {
        var On = (S) => {
          var H = wl(), W = E(H), K = E(W);
          {
            var Q = (q) => {
              var C = ml();
              T(q, C);
            }, ne = (q) => {
              var C = kl();
              T(q, C);
            };
            V(K, (q) => {
              o(yt) ? q(Q) : q(ne, -1);
            });
          }
          T(S, H);
        }, et = (S) => {
          var H = Il(), W = zt(H);
          fn(W, 17, () => o(s), cn, (C, j, oe) => {
            var G = ln(), _e = zt(G);
            {
              var tt = (De) => {
                var Ye = xl(), se = E(Ye), ae = E(se), le = E(ae);
                {
                  var jn = (At) => {
                    var Hn = Kr();
                    T(At, Hn);
                  }, Fn = (At) => {
                    var Hn = Jr();
                    T(At, Hn);
                  };
                  V(le, (At) => {
                    o(Z) === oe ? At(jn) : At(Fn, -1);
                  });
                }
                var nt = L(ae, 2), Tt = E(nt);
                he(() => me(Tt, o(j).text)), ee("click", ae, () => Lr(o(j).text, oe)), T(De, Ye);
              }, dt = (De) => {
                var Ye = El(), se = E(Ye), ae = E(se), le = E(ae);
                {
                  var jn = (Ee) => {
                    var vt = yl(), qs = L(E(vt), 2), _o = E(qs);
                    he(() => me(_o, o(j).thinking)), T(Ee, vt);
                  };
                  V(le, (Ee) => {
                    o(j).thinking && Ee(jn);
                  });
                }
                var Fn = L(le, 2);
                {
                  var nt = (Ee) => {
                    var vt = ln(), qs = zt(vt);
                    Ga(qs, () => co(o(j).text)), T(Ee, vt);
                  };
                  V(Fn, (Ee) => {
                    o(j).text && Ee(nt);
                  });
                }
                var Tt = L(ae, 2), At = E(Tt);
                {
                  var Hn = (Ee) => {
                    var vt = Kr();
                    T(Ee, vt);
                  }, bo = (Ee) => {
                    var vt = Jr();
                    T(Ee, vt);
                  };
                  V(At, (Ee) => {
                    o(Z) === oe ? Ee(Hn) : Ee(bo, -1);
                  });
                }
                ee("click", Tt, () => Lr(o(j).text, oe)), T(De, Ye);
              };
              V(_e, (De) => {
                o(j).isUser ? De(tt) : De(dt, -1);
              });
            }
            T(C, G);
          });
          var K = L(W, 2);
          {
            var Q = (C) => {
              var j = Ml(), oe = E(j), G = E(oe);
              {
                var _e = (se) => {
                  var ae = ln(), le = zt(ae);
                  {
                    var jn = (nt) => {
                      var Tt = Sl();
                      T(nt, Tt);
                    }, Fn = (nt) => {
                      var Tt = Tl();
                      T(nt, Tt);
                    };
                    V(le, (nt) => {
                      o(ce) ? nt(jn) : !o(u) && !o(f) && nt(Fn, 1);
                    });
                  }
                  T(se, ae);
                };
                V(G, (se) => {
                  o(c) || se(_e);
                });
              }
              var tt = L(G, 2);
              {
                var dt = (se) => {
                  var ae = Al(), le = E(ae);
                  he(() => me(le, o(f))), T(se, ae);
                };
                V(tt, (se) => {
                  o(f) && se(dt);
                });
              }
              var De = L(tt, 2);
              {
                var Ye = (se) => {
                  var ae = Cl();
                  T(se, ae);
                };
                V(De, (se) => {
                  !o(c) && !o(f) && o(u) && !o(ce) && se(Ye);
                });
              }
              T(C, j);
            };
            V(K, (C) => {
              o(a) && (!o(c) || o(f)) && C(Q);
            });
          }
          var ne = L(K, 2);
          {
            var q = (C) => {
              var j = Pl(), oe = E(j), G = E(oe), _e = L(oe, 2);
              he(() => me(G, o(p))), ee("click", _e, ro), T(C, j);
            };
            V(ne, (C) => {
              o(p) && C(q);
            });
          }
          T(S, H);
        };
        V(ls, (S) => {
          o(s).length === 0 && !o(ce) ? S(On) : S(et, -1);
        });
      }
      Js(ye, (S) => h(_, S), () => o(_));
      var St = L(ye, 2), cs = E(St);
      {
        var Hs = (S) => {
          var H = Rl(), W = E(H);
          {
            var K = (ne) => {
              var q = Ll();
              T(ne, q);
            }, Q = (ne) => {
              var q = ln(), C = zt(q);
              fn(C, 17, () => o(v), cn, (j, oe) => {
                var G = Nl(), _e = E(G);
                he(() => me(_e, o(oe))), ee("click", G, () => uo(o(oe))), T(j, G);
              }), T(ne, q);
            };
            V(W, (ne) => {
              o(b) ? ne(K) : ne(Q, -1);
            });
          }
          T(S, H);
        };
        V(cs, (S) => {
          o(Dt) && (o(v).length > 0 || o(b)) && S(Hs);
        });
      }
      var Us = L(cs, 2), Ot = E(Us);
      Js(Ot, (S) => h(k, S), () => o(k));
      var zn = L(Ot, 2), J = E(zn);
      {
        var be = (S) => {
          var H = Dl();
          T(S, H);
        }, rn = (S) => {
          var H = Ol();
          T(S, H);
        };
        V(J, (S) => {
          o(a) ? S(be) : S(rn, -1);
        });
      }
      Js(g, (S) => h(B, S), () => o(B)), he(
        (S) => {
          w = jt(g, 1, "llm-chat-root svelte-beco3k", null, w, { "sidebar-panel": tn }), Gr(g, tn ? void 0 : `height: ${o(pe)}`), Gr(ye, o(wt) ? "display:none" : ""), zn.disabled = S;
        },
        [() => o(a) || !o(i).trim()]
      ), ee("keydown", Ot, fo), ee("input", Ot, () => Fs()), el(Ot, () => o(i), (S) => h(i, S)), ee("click", zn, () => sn()), T(d, g);
    };
    V(po, (d) => {
      tn ? d(go, -1) : d(ho);
    });
  }
  T(e, Nr), oi();
}
Da(["click", "keydown", "input"]);
function ql(e, t) {
  const n = Fa(Fl, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Ua(n);
      } catch {
      }
    }
  };
}
export {
  ql as default
};
