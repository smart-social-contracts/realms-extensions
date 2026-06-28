var bo = Object.defineProperty;
var Nr = (e) => {
  throw TypeError(e);
};
var _o = (e, t, n) => t in e ? bo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Me = (e, t, n) => _o(e, typeof t != "symbol" ? t + "" : t, n), qs = (e, t, n) => t.has(e) || Nr("Cannot " + n);
var a = (e, t, n) => (qs(e, t, "read from private field"), n ? n.call(e) : t.get(e)), M = (e, t, n) => t.has(e) ? Nr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), A = (e, t, n, r) => (qs(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), F = (e, t, n) => (qs(e, t, "access private method"), n);
var Jr = Array.isArray, mo = Array.prototype.indexOf, bs = Array.prototype.includes, Ts = Array.from, ko = Object.defineProperty, Bn = Object.getOwnPropertyDescriptor, wo = Object.getOwnPropertyDescriptors, xo = Object.prototype, yo = Array.prototype, $r = Object.getPrototypeOf, Rr = Object.isExtensible;
const Eo = () => {
};
function So(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Qr() {
  var e, t, n = new Promise((r, s) => {
    e = r, t = s;
  });
  return { promise: n, resolve: e, reject: t };
}
const de = 2, wn = 4, As = 8, Xr = 1 << 24, Je = 16, Xe = 32, Rt = 64, Js = 128, He = 512, ae = 1024, ue = 2048, ct = 4096, we = 8192, Ue = 16384, Tn = 32768, $s = 1 << 25, xn = 65536, _s = 1 << 17, To = 1 << 18, An = 1 << 19, Ao = 1 << 20, ot = 1 << 25, Qt = 65536, ms = 1 << 21, vn = 1 << 22, Nt = 1 << 23, cs = Symbol("$state"), Co = Symbol(""), fs = Symbol("attributes"), Qs = Symbol("class"), Xs = Symbol("style"), Fn = Symbol("text"), us = Symbol("form reset"), Cs = new class extends Error {
  constructor() {
    super(...arguments);
    Me(this, "name", "StaleReactionError");
    Me(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Mo(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Po() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Io(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Lo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function No() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Ro(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Do() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Oo() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function zo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function jo() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Fo() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Ho = 1, Uo = 2, Zr = 4, qo = 8, Vo = 16, Bo = 1, Yo = 2, oe = Symbol("uninitialized"), ei = "http://www.w3.org/1999/xhtml", Go = "http://www.w3.org/2000/svg", Wo = "http://www.w3.org/1998/Math/MathML";
function Ko() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Jo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function ti(e) {
  return e === this.v;
}
function $o(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function ni(e) {
  return !$o(e, this.v);
}
let be = null;
function yn(e) {
  be = e;
}
function si(e, t = !1, n) {
  be = {
    p: be,
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
function ri(e) {
  var t = (
    /** @type {ComponentContext} */
    be
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      Si(r);
  }
  return t.i = !0, be = t.p, /** @type {T} */
  {};
}
function ii() {
  return !0;
}
let Ft = [];
function oi() {
  var e = Ft;
  Ft = [], So(e);
}
function Wt(e) {
  if (Ft.length === 0 && !Yn) {
    var t = Ft;
    queueMicrotask(() => {
      t === Ft && oi();
    });
  }
  Ft.push(e);
}
function Qo() {
  for (; Ft.length > 0; )
    oi();
}
function ai(e) {
  var t = D;
  if (t === null)
    return R.f |= Nt, e;
  if ((t.f & Tn) === 0 && (t.f & wn) === 0)
    throw e;
  Lt(e, t);
}
function Lt(e, t) {
  if (!(t !== null && (t.f & Ue) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & Js) !== 0) {
        if ((t.f & Tn) === 0)
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
const Xo = -7169;
function Z(e, t) {
  e.f = e.f & Xo | t;
}
function fr(e) {
  (e.f & He) !== 0 || e.deps === null ? Z(e, ae) : Z(e, ct);
}
function li(e) {
  if (e !== null)
    for (const t of e)
      (t.f & de) === 0 || (t.f & Qt) === 0 || (t.f ^= Qt, li(
        /** @type {Derived} */
        t.deps
      ));
}
function ci(e, t, n) {
  (e.f & ue) !== 0 ? t.add(e) : (e.f & ct) !== 0 && n.add(e), li(e.deps), Z(e, ae);
}
function Zo(e) {
  let t = 0, n = Zt(0), r;
  return () => {
    gr() && (o(n), br(() => (t === 0 && (r = Ms(() => e(() => Gn(n)))), t += 1, () => {
      Wt(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, Gn(n));
      });
    })));
  };
}
var ea = xn | An;
function ta(e, t, n, r) {
  new na(e, t, n, r);
}
var Oe, cr, ze, qt, Ee, je, ke, Ie, _t, Vt, Pt, pn, Kn, Jn, mt, ys, Q, sa, ra, ia, Zs, ds, vs, er, tr;
class na {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, s) {
    M(this, Q);
    /** @type {Boundary | null} */
    Me(this, "parent");
    Me(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Me(this, "transform_error");
    /** @type {TemplateNode} */
    M(this, Oe);
    /** @type {TemplateNode | null} */
    M(this, cr, null);
    /** @type {BoundaryProps} */
    M(this, ze);
    /** @type {((anchor: Node) => void)} */
    M(this, qt);
    /** @type {Effect} */
    M(this, Ee);
    /** @type {Effect | null} */
    M(this, je, null);
    /** @type {Effect | null} */
    M(this, ke, null);
    /** @type {Effect | null} */
    M(this, Ie, null);
    /** @type {DocumentFragment | null} */
    M(this, _t, null);
    M(this, Vt, 0);
    M(this, Pt, 0);
    M(this, pn, !1);
    /** @type {Set<Effect>} */
    M(this, Kn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    M(this, Jn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    M(this, mt, null);
    M(this, ys, Zo(() => (A(this, mt, Zt(a(this, Vt))), () => {
      A(this, mt, null);
    })));
    A(this, Oe, t), A(this, ze, n), A(this, qt, (i) => {
      var c = (
        /** @type {Effect} */
        D
      );
      c.b = this, c.f |= Js, r(i);
    }), this.parent = /** @type {Effect} */
    D.b, this.transform_error = s ?? this.parent?.transform_error ?? ((i) => i), A(this, Ee, _r(() => {
      F(this, Q, Zs).call(this);
    }, ea));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    ci(t, a(this, Kn), a(this, Jn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!a(this, ze).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    F(this, Q, er).call(this, t, n), A(this, Vt, a(this, Vt) + t), !(!a(this, mt) || a(this, pn)) && (A(this, pn, !0), Wt(() => {
      A(this, pn, !1), a(this, mt) && En(a(this, mt), a(this, Vt));
    }));
  }
  get_effect_pending() {
    return a(this, ys).call(this), o(
      /** @type {Source<number>} */
      a(this, mt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!a(this, ze).onerror && !a(this, ze).failed)
      throw t;
    L?.is_fork ? (a(this, je) && L.skip_effect(a(this, je)), a(this, ke) && L.skip_effect(a(this, ke)), a(this, Ie) && L.skip_effect(a(this, Ie)), L.oncommit(() => {
      F(this, Q, tr).call(this, t);
    })) : F(this, Q, tr).call(this, t);
  }
}
Oe = new WeakMap(), cr = new WeakMap(), ze = new WeakMap(), qt = new WeakMap(), Ee = new WeakMap(), je = new WeakMap(), ke = new WeakMap(), Ie = new WeakMap(), _t = new WeakMap(), Vt = new WeakMap(), Pt = new WeakMap(), pn = new WeakMap(), Kn = new WeakMap(), Jn = new WeakMap(), mt = new WeakMap(), ys = new WeakMap(), Q = new WeakSet(), sa = function() {
  try {
    A(this, je, Fe(() => a(this, qt).call(this, a(this, Oe))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
ra = function(t) {
  const n = a(this, ze).failed;
  n && A(this, Ie, Fe(() => {
    n(
      a(this, Oe),
      () => t,
      () => () => {
      }
    );
  }));
}, ia = function() {
  const t = a(this, ze).pending;
  t && (this.is_pending = !0, A(this, ke, Fe(() => t(a(this, Oe)))), Wt(() => {
    var n = A(this, _t, document.createDocumentFragment()), r = xt();
    n.append(r), A(this, je, F(this, Q, vs).call(this, () => Fe(() => a(this, qt).call(this, r)))), a(this, Pt) === 0 && (a(this, Oe).before(n), A(this, _t, null), Jt(
      /** @type {Effect} */
      a(this, ke),
      () => {
        A(this, ke, null);
      }
    ), F(this, Q, ds).call(
      this,
      /** @type {Batch} */
      L
    ));
  }));
}, Zs = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), A(this, Pt, 0), A(this, Vt, 0), A(this, je, Fe(() => {
      a(this, qt).call(this, a(this, Oe));
    })), a(this, Pt) > 0) {
      var t = A(this, _t, document.createDocumentFragment());
      kr(a(this, je), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        a(this, ze).pending
      );
      A(this, ke, Fe(() => n(a(this, Oe))));
    } else
      F(this, Q, ds).call(
        this,
        /** @type {Batch} */
        L
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
ds = function(t) {
  this.is_pending = !1, t.transfer_effects(a(this, Kn), a(this, Jn));
}, /**
 * @template T
 * @param {() => T} fn
 */
vs = function(t) {
  var n = D, r = R, s = be;
  ft(a(this, Ee)), qe(a(this, Ee)), yn(a(this, Ee).ctx);
  try {
    return Xt.ensure(), t();
  } catch (i) {
    return ai(i), null;
  } finally {
    ft(n), qe(r), yn(s);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
er = function(t, n) {
  var r;
  if (!this.has_pending_snippet()) {
    this.parent && F(r = this.parent, Q, er).call(r, t, n);
    return;
  }
  A(this, Pt, a(this, Pt) + t), a(this, Pt) === 0 && (F(this, Q, ds).call(this, n), a(this, ke) && Jt(a(this, ke), () => {
    A(this, ke, null);
  }), a(this, _t) && (a(this, Oe).before(a(this, _t)), A(this, _t, null)));
}, /**
 * @param {unknown} error
 */
tr = function(t) {
  a(this, je) && (Ae(a(this, je)), A(this, je, null)), a(this, ke) && (Ae(a(this, ke)), A(this, ke, null)), a(this, Ie) && (Ae(a(this, Ie)), A(this, Ie, null));
  var n = a(this, ze).onerror;
  let r = a(this, ze).failed;
  var s = !1, i = !1;
  const c = () => {
    if (s) {
      Jo();
      return;
    }
    s = !0, i && Fo(), a(this, Ie) !== null && Jt(a(this, Ie), () => {
      A(this, Ie, null);
    }), F(this, Q, vs).call(this, () => {
      F(this, Q, Zs).call(this);
    });
  }, f = (l) => {
    try {
      i = !0, n?.(l, c), i = !1;
    } catch (u) {
      Lt(u, a(this, Ee) && a(this, Ee).parent);
    }
    r && A(this, Ie, F(this, Q, vs).call(this, () => {
      try {
        return Fe(() => {
          var u = (
            /** @type {Effect} */
            D
          );
          u.b = this, u.f |= Js, r(
            a(this, Oe),
            () => l,
            () => c
          );
        });
      } catch (u) {
        return Lt(
          u,
          /** @type {Effect} */
          a(this, Ee).parent
        ), null;
      }
    }));
  };
  Wt(() => {
    var l;
    try {
      l = this.transform_error(t);
    } catch (u) {
      Lt(u, a(this, Ee) && a(this, Ee).parent);
      return;
    }
    l !== null && typeof l == "object" && typeof /** @type {any} */
    l.then == "function" ? l.then(
      f,
      /** @param {unknown} e */
      (u) => Lt(u, a(this, Ee) && a(this, Ee).parent)
    ) : f(l);
  });
};
function oa(e, t, n, r) {
  const s = ui;
  var i = e.filter((b) => !b.settled), c = t.map(s);
  if (n.length === 0 && i.length === 0) {
    r(c);
    return;
  }
  var f = (
    /** @type {Effect} */
    D
  ), l = aa(), u = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((b) => b.promise)) : null;
  function p(b) {
    if ((f.f & Ue) === 0) {
      l();
      try {
        r([...c, ...b]);
      } catch (k) {
        Lt(k, f);
      }
      ks();
    }
  }
  var _ = fi();
  if (n.length === 0) {
    u.then(() => p([])).finally(_);
    return;
  }
  function v() {
    Promise.all(n.map((b) => /* @__PURE__ */ la(b))).then(p).catch((b) => Lt(b, f)).finally(_);
  }
  u ? u.then(() => {
    l(), v(), ks();
  }) : v();
}
function aa() {
  var e = (
    /** @type {Effect} */
    D
  ), t = R, n = be, r = (
    /** @type {Batch} */
    L
  );
  return function(i = !0) {
    ft(e), qe(t), yn(n), i && (e.f & Ue) === 0 && (r?.activate(), r?.apply());
  };
}
function ks(e = !0) {
  ft(null), qe(null), yn(null), e && L?.deactivate();
}
function fi() {
  var e = (
    /** @type {Effect} */
    D
  ), t = e.b, n = (
    /** @type {Batch} */
    L
  ), r = !!t?.is_rendered();
  return t?.update_pending_count(1, n), n.increment(r, e), () => {
    t?.update_pending_count(-1, n), n.decrement(r, e);
  };
}
// @__NO_SIDE_EFFECTS__
function ui(e) {
  var t = de | ue;
  return D !== null && (D.f |= An), {
    ctx: be,
    deps: null,
    effects: null,
    equals: ti,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      oe
    ),
    wv: 0,
    parent: D,
    ac: null
  };
}
const Hn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function la(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    D
  );
  r === null && Po();
  var s = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = Zt(
    /** @type {V} */
    oe
  ), c = !R, f = /* @__PURE__ */ new Set();
  return Ta(() => {
    var l = (
      /** @type {Effect} */
      D
    ), u = Qr();
    s = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, (b) => {
        b !== Cs && u.reject(b);
      }).finally(ks);
    } catch (b) {
      u.reject(b), ks();
    }
    var p = (
      /** @type {Batch} */
      L
    );
    if (c) {
      if ((l.f & Tn) !== 0)
        var _ = fi();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        r.b?.is_rendered()
      )
        p.async_deriveds.get(l)?.reject(Hn);
      else
        for (const b of f.values())
          b.reject(Hn);
      f.add(u), p.async_deriveds.set(l, u);
    }
    const v = (b, k = void 0) => {
      _?.(), f.delete(u), k !== Hn && (p.activate(), k ? (i.f |= Nt, En(i, k)) : ((i.f & Nt) !== 0 && (i.f ^= Nt), En(i, b)), p.deactivate());
    };
    u.promise.then(v, (b) => v(null, b || "unknown"));
  }), Ea(() => {
    for (const l of f)
      l.reject(Hn);
  }), new Promise((l) => {
    function u(p) {
      function _() {
        p === s ? l(i) : u(s);
      }
      p.then(_, _);
    }
    u(s);
  });
}
// @__NO_SIDE_EFFECTS__
function ca(e) {
  const t = /* @__PURE__ */ ui(e);
  return t.equals = ni, t;
}
function fa(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Ae(
        /** @type {Effect} */
        t[n]
      );
  }
}
function ur(e) {
  var t, n = D, r = e.parent;
  if (!Dt && r !== null && e.v !== oe && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (r.f & (Ue | we)) !== 0)
    return Ko(), e.v;
  ft(r);
  try {
    e.f &= ~Qt, fa(e), t = Di(e);
  } finally {
    ft(n);
  }
  return t;
}
function di(e) {
  var t = ur(e);
  if (!e.equals(t) && (e.wv = Ni(), (!L?.is_fork || e.deps === null) && (L !== null ? (L.capture(e, t, !0), nr?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    Z(e, ae);
    return;
  }
  Dt || ($e !== null ? (gr() || L?.is_fork) && $e.set(e, t) : fr(e));
}
function ua(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(Cs), t.fn !== null && (t.teardown = Eo), t.ac = null, Wn(t, 0), mr(t));
}
function vi(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Sn(t);
}
let Vs = null, sn = null, L = null, nr = null, $e = null, sr = null, Yn = !1, Bs = !1, dn = null, ps = null;
var Dr = 0;
let da = 1;
var hn, It, Bt, gn, bn, _n, kt, mn, Se, $n, wt, Ge, rt, kn, Yt, U, rr, Un, ir, pi, hi, fn, va, qn;
const Es = class Es {
  constructor() {
    M(this, U);
    Me(this, "id", da++);
    /** True as soon as `#process` was called */
    M(this, hn, !1);
    Me(this, "linked", !0);
    /** @type {Batch | null} */
    M(this, It, null);
    /** @type {Batch | null} */
    M(this, Bt, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    Me(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    Me(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    Me(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    M(this, gn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    M(this, bn, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    M(this, _n, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    M(this, kt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    M(this, mn, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    M(this, Se, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    M(this, $n, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    M(this, wt, /* @__PURE__ */ new Set());
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
    M(this, rt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    M(this, kn, /* @__PURE__ */ new Set());
    Me(this, "is_fork", !1);
    M(this, Yt, !1);
    sn === null ? Vs = sn = this : (A(sn, Bt, this), A(this, It, sn)), sn = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    a(this, rt).has(t) || a(this, rt).set(t, { d: [], m: [] }), a(this, kn).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (r) => this.schedule(r)) {
    var r = a(this, rt).get(t);
    if (r) {
      a(this, rt).delete(t);
      for (var s of r.d)
        Z(s, ue), n(s);
      for (s of r.m)
        Z(s, ct), n(s);
    }
    a(this, kn).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, r = !1) {
    t.v !== oe && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Nt) === 0 && (this.current.set(t, [n, r]), $e?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    L = this;
  }
  deactivate() {
    L = null, $e = null;
  }
  flush() {
    try {
      Bs = !0, L = this, F(this, U, Un).call(this);
    } finally {
      Dr = 0, sr = null, dn = null, ps = null, Bs = !1, L = null, $e = null, Kt.clear();
    }
  }
  discard() {
    for (const t of a(this, bn)) t(this);
    a(this, bn).clear();
    for (const t of this.async_deriveds.values())
      t.reject(Hn);
    F(this, U, qn).call(this), a(this, mn)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    a(this, $n).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    if (A(this, _n, a(this, _n) + 1), t) {
      let r = a(this, kt).get(n) ?? 0;
      a(this, kt).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, n) {
    if (A(this, _n, a(this, _n) - 1), t) {
      let r = a(this, kt).get(n) ?? 0;
      r === 1 ? a(this, kt).delete(n) : a(this, kt).set(n, r - 1);
    }
    a(this, Yt) || (A(this, Yt, !0), Wt(() => {
      A(this, Yt, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const r of t)
      a(this, wt).add(r);
    for (const r of n)
      a(this, Ge).add(r);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    a(this, gn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    a(this, bn).add(t);
  }
  settled() {
    return (a(this, mn) ?? A(this, mn, Qr())).promise;
  }
  static ensure() {
    if (L === null) {
      const t = L = new Es();
      !Bs && !Yn && Wt(() => {
        a(t, hn) || t.flush();
      });
    }
    return L;
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
    if (sr = t, t.b?.is_pending && (t.f & (wn | As | Xr)) !== 0 && (t.f & Tn) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var r = n.f;
      if (dn !== null && n === D && (R === null || (R.f & de) === 0))
        return;
      if ((r & (Rt | Xe)) !== 0) {
        if ((r & ae) === 0)
          return;
        n.f ^= ae;
      }
    }
    a(this, Se).push(n);
  }
};
hn = new WeakMap(), It = new WeakMap(), Bt = new WeakMap(), gn = new WeakMap(), bn = new WeakMap(), _n = new WeakMap(), kt = new WeakMap(), mn = new WeakMap(), Se = new WeakMap(), $n = new WeakMap(), wt = new WeakMap(), Ge = new WeakMap(), rt = new WeakMap(), kn = new WeakMap(), Yt = new WeakMap(), U = new WeakSet(), rr = function() {
  if (this.is_fork) return !0;
  for (const r of a(this, kt).keys()) {
    for (var t = r, n = !1; t.parent !== null; ) {
      if (a(this, rt).has(t)) {
        n = !0;
        break;
      }
      t = t.parent;
    }
    if (!n)
      return !0;
  }
  return !1;
}, Un = function() {
  var l, u, p;
  A(this, hn, !0), Dr++ > 1e3 && (F(this, U, qn).call(this), ha());
  for (const _ of a(this, wt))
    a(this, Ge).delete(_), Z(_, ue), this.schedule(_);
  for (const _ of a(this, Ge))
    Z(_, ct), this.schedule(_);
  const t = a(this, Se);
  A(this, Se, []), this.apply();
  var n = dn = [], r = [], s = ps = [];
  for (const _ of t)
    try {
      F(this, U, ir).call(this, _, n, r);
    } catch (v) {
      throw _i(_), F(this, U, rr).call(this) || this.discard(), v;
    }
  if (L = null, s.length > 0) {
    var i = Es.ensure();
    for (const _ of s)
      i.schedule(_);
  }
  if (dn = null, ps = null, F(this, U, rr).call(this)) {
    F(this, U, fn).call(this, r), F(this, U, fn).call(this, n);
    for (const [_, v] of a(this, rt))
      bi(_, v);
    s.length > 0 && /** @type {unknown} */
    F(l = L, U, Un).call(l);
    return;
  }
  const c = F(this, U, pi).call(this);
  if (c) {
    F(this, U, fn).call(this, r), F(this, U, fn).call(this, n), F(u = c, U, hi).call(u, this);
    return;
  }
  a(this, wt).clear(), a(this, Ge).clear();
  for (const _ of a(this, gn)) _(this);
  a(this, gn).clear(), nr = this, Or(r), Or(n), nr = null, a(this, mn)?.resolve();
  var f = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    L
  );
  if (a(this, _n) === 0 && (a(this, Se).length === 0 || f !== null) && F(this, U, qn).call(this), a(this, Se).length > 0)
    if (f !== null) {
      const _ = f;
      a(_, Se).push(...a(this, Se).filter((v) => !a(_, Se).includes(v)));
    } else
      f = this;
  f !== null && F(p = f, U, Un).call(p);
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
ir = function(t, n, r) {
  t.f ^= ae;
  for (var s = t.first; s !== null; ) {
    var i = s.f, c = (i & (Xe | Rt)) !== 0, f = c && (i & ae) !== 0, l = f || (i & we) !== 0 || a(this, rt).has(s);
    if (!l && s.fn !== null) {
      c ? s.f ^= ae : (i & wn) !== 0 ? n.push(s) : es(s) && ((i & Je) !== 0 && a(this, Ge).add(s), Sn(s));
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
}, pi = function() {
  for (var t = a(this, It); t !== null; ) {
    if (!t.is_fork) {
      for (const [n, [, r]] of this.current)
        if (t.current.has(n) && !r)
          return t;
    }
    t = a(t, It);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
hi = function(t) {
  var r;
  for (const [s, i] of t.current)
    !this.previous.has(s) && t.previous.has(s) && this.previous.set(s, t.previous.get(s)), this.current.set(s, i);
  for (const [s, i] of t.async_deriveds) {
    const c = this.async_deriveds.get(s);
    c && i.promise.then(c.resolve).catch(c.reject);
  }
  t.async_deriveds.clear(), this.transfer_effects(a(t, wt), a(t, Ge));
  const n = (s) => {
    var i = s.reactions;
    if (i !== null)
      for (const l of i) {
        var c = l.f;
        if ((c & de) !== 0)
          n(
            /** @type {Derived} */
            l
          );
        else {
          var f = (
            /** @type {Effect} */
            l
          );
          c & (vn | Je) && !this.async_deriveds.has(f) && (a(this, Ge).delete(f), Z(f, ue), this.schedule(f));
        }
      }
  };
  for (const s of this.current.keys())
    n(s);
  this.oncommit(() => t.discard()), F(r = t, U, qn).call(r), L = this, F(this, U, Un).call(this);
}, /**
 * @param {Effect[]} effects
 */
fn = function(t) {
  for (var n = 0; n < t.length; n += 1)
    ci(t[n], a(this, wt), a(this, Ge));
}, va = function() {
  var _;
  for (let v = Vs; v !== null; v = a(v, Bt)) {
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
    if (!(!a(v, hn) || s.length === 0)) {
      var i = s.filter((b) => !this.current.has(b));
      if (i.length === 0)
        t && v.discard();
      else if (n.length > 0) {
        if (t)
          for (const b of a(this, kn))
            v.unskip_effect(b, (k) => {
              var y;
              (k.f & (Je | vn)) !== 0 ? v.schedule(k) : F(y = v, U, fn).call(y, [k]);
            });
        v.activate();
        var c = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
        for (var l of n)
          gi(l, i, c, f);
        f = /* @__PURE__ */ new Map();
        var u = [...v.current].filter(([b, k]) => {
          const y = this.current.get(b);
          return y ? y[0] !== k[0] || y[1] !== k[1] : !0;
        }).map(([b]) => b);
        if (u.length > 0)
          for (const b of a(this, $n))
            (b.f & (Ue | we | _s)) === 0 && dr(b, u, f) && ((b.f & (vn | Je)) !== 0 ? (Z(b, ue), v.schedule(b)) : a(v, wt).add(b));
        if (a(v, Se).length > 0 && !a(v, Yt)) {
          v.apply();
          for (var p of a(v, Se))
            F(_ = v, U, ir).call(_, p, [], []);
          A(v, Se, []);
        }
        v.deactivate();
      }
    }
  }
}, qn = function() {
  if (this.linked) {
    var t = a(this, It), n = a(this, Bt);
    t === null ? Vs = n : A(t, Bt, n), n === null ? sn = t : A(n, It, t), this.linked = !1;
  }
};
let Xt = Es;
function pa(e) {
  var t = Yn;
  Yn = !0;
  try {
    for (var n; ; ) {
      if (Qo(), L === null)
        return (
          /** @type {T} */
          n
        );
      L.flush();
    }
  } finally {
    Yn = t;
  }
}
function ha() {
  try {
    Do();
  } catch (e) {
    Lt(e, sr);
  }
}
let bt = null;
function Or(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (Ue | we)) === 0 && es(r) && (bt = /* @__PURE__ */ new Set(), Sn(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Mi(r), bt?.size > 0)) {
        Kt.clear();
        for (const s of bt) {
          if ((s.f & (Ue | we)) !== 0) continue;
          const i = [s];
          let c = s.parent;
          for (; c !== null; )
            bt.has(c) && (bt.delete(c), i.push(c)), c = c.parent;
          for (let f = i.length - 1; f >= 0; f--) {
            const l = i[f];
            (l.f & (Ue | we)) === 0 && Sn(l);
          }
        }
        bt.clear();
      }
    }
    bt = null;
  }
}
function gi(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const s of e.reactions) {
      const i = s.f;
      (i & de) !== 0 ? gi(
        /** @type {Derived} */
        s,
        t,
        n,
        r
      ) : (i & (vn | Je)) !== 0 && (i & ue) === 0 && dr(s, t, r) && (Z(s, ue), vr(
        /** @type {Effect} */
        s
      ));
    }
}
function dr(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const s of e.deps) {
      if (bs.call(t, s))
        return !0;
      if ((s.f & de) !== 0 && dr(
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
function vr(e) {
  L.schedule(e);
}
function bi(e, t) {
  if (!((e.f & Xe) !== 0 && (e.f & ae) !== 0)) {
    (e.f & ue) !== 0 ? t.d.push(e) : (e.f & ct) !== 0 && t.m.push(e), Z(e, ae);
    for (var n = e.first; n !== null; )
      bi(n, t), n = n.next;
  }
}
function _i(e) {
  Z(e, ae);
  for (var t = e.first; t !== null; )
    _i(t), t = t.next;
}
let ws = /* @__PURE__ */ new Set();
const Kt = /* @__PURE__ */ new Map();
let mi = !1;
function Zt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: ti,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function P(e, t) {
  const n = Zt(e);
  return Ca(n), n;
}
// @__NO_SIDE_EFFECTS__
function ga(e, t = !1, n = !0) {
  const r = Zt(e);
  return t || (r.equals = ni), r;
}
function h(e, t, n = !1) {
  R !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Qe || (R.f & _s) !== 0) && ii() && (R.f & (de | Je | vn | _s)) !== 0 && (lt === null || !lt.has(e)) && jo();
  let r = n ? Ke(t) : t;
  return En(e, r, ps);
}
function En(e, t, n = null) {
  if (!e.equals(t)) {
    Kt.set(e, Dt ? t : e.v);
    var r = Xt.ensure();
    if (r.capture(e, t), (e.f & de) !== 0) {
      const s = (
        /** @type {Derived} */
        e
      );
      (e.f & ue) !== 0 && ur(s), $e === null && fr(s);
    }
    e.wv = Ni(), ki(e, ue, n), D !== null && (D.f & ae) !== 0 && (D.f & (Xe | Rt)) === 0 && (De === null ? Ma([e]) : De.push(e)), !r.is_fork && ws.size > 0 && !mi && ba();
  }
  return t;
}
function ba() {
  mi = !1;
  for (const e of ws) {
    (e.f & ae) !== 0 && Z(e, ct);
    let t;
    try {
      t = es(e);
    } catch {
      t = !0;
    }
    t && Sn(e);
  }
  ws.clear();
}
function Gn(e) {
  h(e, e.v + 1);
}
function ki(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var s = r.length, i = 0; i < s; i++) {
      var c = r[i], f = c.f, l = (f & ue) === 0;
      if (l && Z(c, t), (f & _s) !== 0)
        ws.add(
          /** @type {Effect} */
          c
        );
      else if ((f & de) !== 0) {
        var u = (
          /** @type {Derived} */
          c
        );
        $e?.delete(u), (f & Qt) === 0 && (f & He && (D === null || (D.f & ms) === 0) && (c.f |= Qt), ki(u, ct, n));
      } else if (l) {
        var p = (
          /** @type {Effect} */
          c
        );
        (f & Je) !== 0 && bt !== null && bt.add(p), n !== null ? n.push(p) : vr(p);
      }
    }
}
function Ke(e) {
  if (typeof e != "object" || e === null || cs in e)
    return e;
  const t = $r(e);
  if (t !== xo && t !== yo)
    return e;
  var n = /* @__PURE__ */ new Map(), r = Jr(e), s = /* @__PURE__ */ P(0), i = $t, c = (f) => {
    if ($t === i)
      return f();
    var l = R, u = $t;
    qe(null), Hr(i);
    var p = f();
    return qe(l), Hr(u), p;
  };
  return r && n.set("length", /* @__PURE__ */ P(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, l, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && Oo();
        var p = n.get(l);
        return p === void 0 ? c(() => {
          var _ = /* @__PURE__ */ P(u.value);
          return n.set(l, _), _;
        }) : h(p, u.value, !0), !0;
      },
      deleteProperty(f, l) {
        var u = n.get(l);
        if (u === void 0) {
          if (l in f) {
            const p = c(() => /* @__PURE__ */ P(oe));
            n.set(l, p), Gn(s);
          }
        } else
          h(u, oe), Gn(s);
        return !0;
      },
      get(f, l, u) {
        if (l === cs)
          return e;
        var p = n.get(l), _ = l in f;
        if (p === void 0 && (!_ || Bn(f, l)?.writable) && (p = c(() => {
          var b = Ke(_ ? f[l] : oe), k = /* @__PURE__ */ P(b);
          return k;
        }), n.set(l, p)), p !== void 0) {
          var v = o(p);
          return v === oe ? void 0 : v;
        }
        return Reflect.get(f, l, u);
      },
      getOwnPropertyDescriptor(f, l) {
        var u = Reflect.getOwnPropertyDescriptor(f, l);
        if (u && "value" in u) {
          var p = n.get(l);
          p && (u.value = o(p));
        } else if (u === void 0) {
          var _ = n.get(l), v = _?.v;
          if (_ !== void 0 && v !== oe)
            return {
              enumerable: !0,
              configurable: !0,
              value: v,
              writable: !0
            };
        }
        return u;
      },
      has(f, l) {
        if (l === cs)
          return !0;
        var u = n.get(l), p = u !== void 0 && u.v !== oe || Reflect.has(f, l);
        if (u !== void 0 || D !== null && (!p || Bn(f, l)?.writable)) {
          u === void 0 && (u = c(() => {
            var v = p ? Ke(f[l]) : oe, b = /* @__PURE__ */ P(v);
            return b;
          }), n.set(l, u));
          var _ = o(u);
          if (_ === oe)
            return !1;
        }
        return p;
      },
      set(f, l, u, p) {
        var _ = n.get(l), v = l in f;
        if (r && l === "length")
          for (var b = u; b < /** @type {Source<number>} */
          _.v; b += 1) {
            var k = n.get(b + "");
            k !== void 0 ? h(k, oe) : b in f && (k = c(() => /* @__PURE__ */ P(oe)), n.set(b + "", k));
          }
        if (_ === void 0)
          (!v || Bn(f, l)?.writable) && (_ = c(() => /* @__PURE__ */ P(void 0)), h(_, Ke(u)), n.set(l, _));
        else {
          v = _.v !== oe;
          var y = c(() => Ke(u));
          h(_, y);
        }
        var m = Reflect.getOwnPropertyDescriptor(f, l);
        if (m?.set && m.set.call(p, u), !v) {
          if (r && typeof l == "string") {
            var O = (
              /** @type {Source<number>} */
              n.get("length")
            ), ee = Number(l);
            Number.isInteger(ee) && ee >= O.v && h(O, ee + 1);
          }
          Gn(s);
        }
        return !0;
      },
      ownKeys(f) {
        o(s);
        var l = Reflect.ownKeys(f).filter((_) => {
          var v = n.get(_);
          return v === void 0 || v.v !== oe;
        });
        for (var [u, p] of n)
          p.v !== oe && !(u in f) && l.push(u);
        return l;
      },
      setPrototypeOf() {
        zo();
      }
    }
  );
}
var zr, wi, xi, yi;
function _a() {
  if (zr === void 0) {
    zr = window, wi = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    xi = Bn(t, "firstChild").get, yi = Bn(t, "nextSibling").get, Rr(e) && (e[Qs] = void 0, e[fs] = null, e[Xs] = void 0, e.__e = void 0), Rr(n) && (n[Fn] = void 0);
  }
}
function xt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function at(e) {
  return (
    /** @type {TemplateNode | null} */
    xi.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Zn(e) {
  return (
    /** @type {TemplateNode | null} */
    yi.call(e)
  );
}
function E(e, t) {
  return /* @__PURE__ */ at(e);
}
function jt(e, t = !1) {
  {
    var n = /* @__PURE__ */ at(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ Zn(n) : n;
  }
}
function I(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ Zn(r);
  return r;
}
function ma(e) {
  e.textContent = "";
}
function Ei() {
  return !1;
}
function pr(e, t, n) {
  return t == null || t === ei ? (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElement(e)
  ) : (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t, e)
  );
}
let jr = !1;
function ka() {
  jr || (jr = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t[us]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function hr(e) {
  var t = R, n = D;
  qe(null), ft(null);
  try {
    return e();
  } finally {
    qe(t), ft(n);
  }
}
function wa(e, t, n, r = n) {
  e.addEventListener(t, () => hr(n));
  const s = (
    /** @type {any} */
    e[us]
  );
  s ? e[us] = () => {
    s(), r(!0);
  } : e[us] = () => r(!0), ka();
}
function xa(e) {
  D === null && (R === null && Ro(), No()), Dt && Lo();
}
function ya(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function yt(e, t) {
  var n = D;
  n !== null && (n.f & we) !== 0 && (e |= we);
  var r = {
    ctx: be,
    deps: null,
    nodes: null,
    f: e | ue | He,
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
  L?.register_created_effect(r);
  var s = r;
  if ((e & wn) !== 0)
    dn !== null ? dn.push(r) : Xt.ensure().schedule(r);
  else if (t !== null) {
    try {
      Sn(r);
    } catch (c) {
      throw Ae(r), c;
    }
    s.deps === null && s.teardown === null && s.nodes === null && s.first === s.last && // either `null`, or a singular child
    (s.f & An) === 0 && (s = s.first, (e & Je) !== 0 && (e & xn) !== 0 && s !== null && (s.f |= xn));
  }
  if (s !== null && (s.parent = n, n !== null && ya(s, n), R !== null && (R.f & de) !== 0 && (e & Rt) === 0)) {
    var i = (
      /** @type {Derived} */
      R
    );
    (i.effects ?? (i.effects = [])).push(s);
  }
  return r;
}
function gr() {
  return R !== null && !Qe;
}
function Ea(e) {
  const t = yt(As, null);
  return Z(t, ae), t.teardown = e, t;
}
function hs(e) {
  xa();
  var t = (
    /** @type {Effect} */
    D.f
  ), n = !R && (t & Xe) !== 0 && be !== null && !be.i;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      be
    );
    (r.e ?? (r.e = [])).push(e);
  } else
    return Si(e);
}
function Si(e) {
  return yt(wn | Ao, e);
}
function Sa(e) {
  Xt.ensure();
  const t = yt(Rt | An, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? Jt(t, () => {
      Ae(t), r(void 0);
    }) : (Ae(t), r(void 0));
  });
}
function Ti(e) {
  return yt(wn, e);
}
function Ta(e) {
  return yt(vn | An, e);
}
function br(e, t = 0) {
  return yt(As | t, e);
}
function ge(e, t = [], n = [], r = []) {
  oa(r, t, n, (s) => {
    yt(As, () => {
      e(...s.map(o));
    });
  });
}
function _r(e, t = 0) {
  var n = yt(Je | t, e);
  return n;
}
function Fe(e) {
  return yt(Xe | An, e);
}
function Ai(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Dt, r = R;
    Fr(!0), qe(null);
    try {
      t.call(null);
    } finally {
      Fr(n), qe(r);
    }
  }
}
function mr(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const s = n.ac;
    s !== null && hr(() => {
      s.abort(Cs);
    });
    var r = n.next;
    (n.f & Rt) !== 0 ? n.parent = null : Ae(n, t), n = r;
  }
}
function Aa(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Xe) === 0 && Ae(t), t = n;
  }
}
function Ae(e, t = !0) {
  var n = !1;
  (t || (e.f & To) !== 0) && e.nodes !== null && e.nodes.end !== null && (Ci(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), e.f |= $s, mr(e, t && !n), Wn(e, 0);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const i of r)
      i.stop();
  Ai(e), e.f ^= $s, e.f |= Ue;
  var s = e.parent;
  s !== null && s.first !== null && Mi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Ci(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ Zn(e);
    e.remove(), e = n;
  }
}
function Mi(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Jt(e, t, n = !0) {
  var r = [];
  Pi(e, r, !0);
  var s = () => {
    n && Ae(e), t && t();
  }, i = r.length;
  if (i > 0) {
    var c = () => --i || s();
    for (var f of r)
      f.out(c);
  } else
    s();
}
function Pi(e, t, n) {
  if ((e.f & we) === 0) {
    e.f ^= we;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const f of r)
        (f.is_global || n) && t.push(f);
    for (var s = e.first; s !== null; ) {
      var i = s.next;
      if ((s.f & Rt) === 0) {
        var c = (s.f & xn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (s.f & Xe) !== 0 && (e.f & Je) !== 0;
        Pi(s, t, c ? n : !1);
      }
      s = i;
    }
  }
}
function xs(e) {
  Ii(e, !0);
}
function Ii(e, t) {
  if ((e.f & we) !== 0) {
    e.f ^= we, (e.f & ae) === 0 && (Z(e, ue), Xt.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, s = (n.f & xn) !== 0 || (n.f & Xe) !== 0;
      Ii(n, s ? t : !1), n = r;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const c of i)
        (c.is_global || t) && c.in();
  }
}
function kr(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var s = n === r ? null : /* @__PURE__ */ Zn(n);
      t.append(n), n = s;
    }
}
let gs = !1, Dt = !1;
function Fr(e) {
  Dt = e;
}
let R = null, Qe = !1;
function qe(e) {
  R = e;
}
let D = null;
function ft(e) {
  D = e;
}
let lt = null;
function Ca(e) {
  R !== null && (lt ?? (lt = /* @__PURE__ */ new Set())).add(e);
}
let Te = null, Pe = 0, De = null;
function Ma(e) {
  De = e;
}
let Li = 1, Ht = 0, $t = Ht;
function Hr(e) {
  $t = e;
}
function Ni() {
  return ++Li;
}
function es(e) {
  var t = e.f;
  if ((t & ue) !== 0)
    return !0;
  if (t & de && (e.f &= ~Qt), (t & ct) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, s = 0; s < r; s++) {
      var i = n[s];
      if (es(
        /** @type {Derived} */
        i
      ) && di(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & He) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    $e === null && Z(e, ae);
  }
  return !1;
}
function Ri(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(lt !== null && lt.has(e)))
    for (var s = 0; s < r.length; s++) {
      var i = r[s];
      (i.f & de) !== 0 ? Ri(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? Z(i, ue) : (i.f & ae) !== 0 && Z(i, ct), vr(
        /** @type {Effect} */
        i
      ));
    }
}
function Di(e) {
  var y;
  var t = Te, n = Pe, r = De, s = R, i = lt, c = be, f = Qe, l = $t, u = e.f;
  Te = /** @type {null | Value[]} */
  null, Pe = 0, De = null, R = (u & (Xe | Rt)) === 0 ? e : null, lt = null, yn(e.ctx), Qe = !1, $t = ++Ht, e.ac !== null && (hr(() => {
    e.ac.abort(Cs);
  }), e.ac = null);
  try {
    e.f |= ms;
    var p = (
      /** @type {Function} */
      e.fn
    ), _ = p();
    e.f |= Tn;
    var v = e.deps, b = L?.is_fork;
    if (Te !== null) {
      var k;
      if (b || Wn(e, Pe), v !== null && Pe > 0)
        for (v.length = Pe + Te.length, k = 0; k < Te.length; k++)
          v[Pe + k] = Te[k];
      else
        e.deps = v = Te;
      if (gr() && (e.f & He) !== 0)
        for (k = Pe; k < v.length; k++)
          ((y = v[k]).reactions ?? (y.reactions = [])).push(e);
    } else !b && v !== null && Pe < v.length && (Wn(e, Pe), v.length = Pe);
    if (ii() && De !== null && !Qe && v !== null && (e.f & (de | ct | ue)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      De.length; k++)
        Ri(
          De[k],
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
      De !== null && (r === null ? r = De : r.push(.../** @type {Source[]} */
      De));
    }
    return (e.f & Nt) !== 0 && (e.f ^= Nt), _;
  } catch (m) {
    return ai(m);
  } finally {
    e.f ^= ms, Te = t, Pe = n, De = r, R = s, lt = i, yn(c), Qe = f, $t = l;
  }
}
function Pa(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = mo.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? n = t.reactions = null : (n[r] = n[s], n.pop());
    }
  }
  if (n === null && (t.f & de) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Te === null || !bs.call(Te, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & He) !== 0 && (i.f ^= He, i.f &= ~Qt), i.v !== oe && fr(i), ua(i), Wn(i, 0);
  }
}
function Wn(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      Pa(e, n[r]);
}
function Sn(e) {
  var t = e.f;
  if ((t & Ue) === 0) {
    Z(e, ae);
    var n = D, r = gs;
    D = e, gs = !0;
    try {
      (t & (Je | Xr)) !== 0 ? Aa(e) : mr(e), Ai(e);
      var s = Di(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = Li;
      var i;
    } finally {
      gs = r, D = n;
    }
  }
}
async function un() {
  await Promise.resolve(), pa();
}
function o(e) {
  var t = e.f, n = (t & de) !== 0;
  if (R !== null && !Qe) {
    var r = D !== null && (D.f & Ue) !== 0;
    if (!r && (lt === null || !lt.has(e))) {
      var s = R.deps;
      if ((R.f & ms) !== 0)
        e.rv < Ht && (e.rv = Ht, Te === null && s !== null && s[Pe] === e ? Pe++ : Te === null ? Te = [e] : Te.push(e));
      else {
        R.deps ?? (R.deps = []), bs.call(R.deps, e) || R.deps.push(e);
        var i = e.reactions;
        i === null ? e.reactions = [R] : bs.call(i, R) || i.push(R);
      }
    }
  }
  if (Dt && Kt.has(e))
    return Kt.get(e);
  if (n) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (Dt) {
      var f = c.v;
      return ((c.f & ae) === 0 && c.reactions !== null || zi(c)) && (f = ur(c)), Kt.set(c, f), f;
    }
    var l = (c.f & He) === 0 && !Qe && R !== null && (gs || (R.f & He) !== 0), u = (c.f & Tn) === 0;
    es(c) && (l && (c.f |= He), di(c)), l && !u && (vi(c), Oi(c));
  }
  if ($e?.has(e))
    return $e.get(e);
  if ((e.f & Nt) !== 0)
    throw e.v;
  return e.v;
}
function Oi(e) {
  if (e.f |= He, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & de) !== 0 && (t.f & He) === 0 && (vi(
        /** @type {Derived} */
        t
      ), Oi(
        /** @type {Derived} */
        t
      ));
}
function zi(e) {
  if (e.v === oe) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Kt.has(t) || (t.f & de) !== 0 && zi(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ms(e) {
  var t = Qe;
  try {
    return Qe = !0, e();
  } finally {
    Qe = t;
  }
}
const Ia = ["touchstart", "touchmove"];
function La(e) {
  return Ia.includes(e);
}
const Ut = Symbol("events"), ji = /* @__PURE__ */ new Set(), or = /* @__PURE__ */ new Set();
function ne(e, t, n) {
  (t[Ut] ?? (t[Ut] = {}))[e] = n;
}
function Na(e) {
  for (var t = 0; t < e.length; t++)
    ji.add(e[t]);
  for (var n of or)
    n(e);
}
let Ur = null;
function qr(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, s = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    s[0] || e.target
  );
  Ur = e;
  var c = 0, f = Ur === e && e[Ut];
  if (f) {
    var l = s.indexOf(f);
    if (l !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Ut] = t;
      return;
    }
    var u = s.indexOf(t);
    if (u === -1)
      return;
    l <= u && (c = l);
  }
  if (i = /** @type {Element} */
  s[c] || e.target, i !== t) {
    ko(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var p = R, _ = D;
    qe(null), ft(null);
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
        c++, i = c < s.length ? (
          /** @type {Element} */
          s[c]
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
      e[Ut] = t, delete e.currentTarget, qe(p), ft(_);
    }
  }
}
const Ra = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Da(e) {
  return (
    /** @type {string} */
    Ra?.createHTML(e) ?? e
  );
}
function Fi(e) {
  var t = pr("template");
  return t.innerHTML = Da(e.replaceAll("<!>", "<!---->")), t.content;
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
  var n = (t & Bo) !== 0, r = (t & Yo) !== 0, s, i = !e.startsWith("<!>");
  return () => {
    s === void 0 && (s = Fi(i ? e : "<!>" + e), n || (s = /** @type {TemplateNode} */
    /* @__PURE__ */ at(s)));
    var c = (
      /** @type {TemplateNode} */
      r || wi ? document.importNode(s, !0) : s.cloneNode(!0)
    );
    if (n) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ at(c)
      ), l = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      en(f, l);
    } else
      en(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Oa(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), s = `<${n}>${r ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var c = (
        /** @type {DocumentFragment} */
        Fi(s)
      ), f = (
        /** @type {Element} */
        /* @__PURE__ */ at(c)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ at(f);
    }
    var l = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return en(l, l), l;
  };
}
// @__NO_SIDE_EFFECTS__
function Ps(e, t) {
  return /* @__PURE__ */ Oa(e, t, "svg");
}
function rn(e = "") {
  {
    var t = xt(e + "");
    return en(t, t), t;
  }
}
function on() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = xt();
  return e.append(t, n), en(t, n), e;
}
function S(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function me(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== /** @type {any} */
  (e[Fn] ?? (e[Fn] = e.nodeValue)) && (e[Fn] = n, e.nodeValue = `${n}`);
}
function za(e, t) {
  return ja(e, t);
}
const as = /* @__PURE__ */ new Map();
function ja(e, { target: t, anchor: n, props: r = {}, events: s, context: i, intro: c = !0, transformError: f }) {
  _a();
  var l = void 0, u = Sa(() => {
    var p = n ?? t.appendChild(xt());
    ta(
      /** @type {TemplateNode} */
      p,
      {
        pending: () => {
        }
      },
      (b) => {
        si({});
        var k = (
          /** @type {ComponentContext} */
          be
        );
        i && (k.c = i), s && (r.$$events = s), l = e(b, r) || {}, ri();
      },
      f
    );
    var _ = /* @__PURE__ */ new Set(), v = (b) => {
      for (var k = 0; k < b.length; k++) {
        var y = b[k];
        if (!_.has(y)) {
          _.add(y);
          var m = La(y);
          for (const G of [t, document]) {
            var O = as.get(G);
            O === void 0 && (O = /* @__PURE__ */ new Map(), as.set(G, O));
            var ee = O.get(y);
            ee === void 0 ? (G.addEventListener(y, qr, { passive: m }), O.set(y, 1)) : O.set(y, ee + 1);
          }
        }
      }
    };
    return v(Ts(ji)), or.add(v), () => {
      for (var b of _)
        for (const m of [t, document]) {
          var k = (
            /** @type {Map<string, number>} */
            as.get(m)
          ), y = (
            /** @type {number} */
            k.get(b)
          );
          --y == 0 ? (m.removeEventListener(b, qr), k.delete(b), k.size === 0 && as.delete(m)) : k.set(b, y);
        }
      or.delete(v), p !== n && p.parentNode?.removeChild(p);
    };
  });
  return ar.set(l, u), l;
}
let ar = /* @__PURE__ */ new WeakMap();
function Fa(e, t) {
  const n = ar.get(e);
  return n ? (ar.delete(e), n(t)) : Promise.resolve();
}
var We, it, Le, Gt, Qn, Xn, Ss;
class Ha {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Me(this, "anchor");
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
    M(this, it, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    M(this, Le, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    M(this, Gt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    M(this, Qn, !0);
    /**
     * @param {Batch} batch
     */
    M(this, Xn, (t) => {
      if (a(this, We).has(t)) {
        var n = (
          /** @type {Key} */
          a(this, We).get(t)
        ), r = a(this, it).get(n);
        if (r)
          xs(r), a(this, Gt).delete(n);
        else {
          var s = a(this, Le).get(n);
          s && (xs(s.effect), a(this, it).set(n, s.effect), a(this, Le).delete(n), s.fragment.lastChild.remove(), this.anchor.before(s.fragment), r = s.effect);
        }
        for (const [i, c] of a(this, We)) {
          if (a(this, We).delete(i), i === t)
            break;
          const f = a(this, Le).get(c);
          f && (Ae(f.effect), a(this, Le).delete(c));
        }
        for (const [i, c] of a(this, it)) {
          if (i === n || a(this, Gt).has(i)) continue;
          const f = () => {
            if (Array.from(a(this, We).values()).includes(i)) {
              var u = document.createDocumentFragment();
              kr(c, u), u.append(xt()), a(this, Le).set(i, { effect: c, fragment: u });
            } else
              Ae(c);
            a(this, Gt).delete(i), a(this, it).delete(i);
          };
          a(this, Qn) || !r ? (a(this, Gt).add(i), Jt(c, f, !1)) : f();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    M(this, Ss, (t) => {
      a(this, We).delete(t);
      const n = Array.from(a(this, We).values());
      for (const [r, s] of a(this, Le))
        n.includes(r) || (Ae(s.effect), a(this, Le).delete(r));
    });
    this.anchor = t, A(this, Qn, n);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var r = (
      /** @type {Batch} */
      L
    ), s = Ei();
    if (n && !a(this, it).has(t) && !a(this, Le).has(t))
      if (s) {
        var i = document.createDocumentFragment(), c = xt();
        i.append(c), a(this, Le).set(t, {
          effect: Fe(() => n(c)),
          fragment: i
        });
      } else
        a(this, it).set(
          t,
          Fe(() => n(this.anchor))
        );
    if (a(this, We).set(r, t), s) {
      for (const [f, l] of a(this, it))
        f === t ? r.unskip_effect(l) : r.skip_effect(l);
      for (const [f, l] of a(this, Le))
        f === t ? r.unskip_effect(l.effect) : r.skip_effect(l.effect);
      r.oncommit(a(this, Xn)), r.ondiscard(a(this, Ss));
    } else
      a(this, Xn).call(this, r);
  }
}
We = new WeakMap(), it = new WeakMap(), Le = new WeakMap(), Gt = new WeakMap(), Qn = new WeakMap(), Xn = new WeakMap(), Ss = new WeakMap();
function q(e, t, n = !1) {
  var r = new Ha(e), s = n ? xn : 0;
  function i(c, f) {
    r.ensure(c, f);
  }
  _r(() => {
    var c = !1;
    t((f, l = 0) => {
      c = !0, i(l, f);
    }), c || i(-1, null);
  }, s);
}
function an(e, t) {
  return t;
}
function Ua(e, t, n) {
  for (var r = [], s = t.length, i, c = t.length, f = 0; f < s; f++) {
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
            lr(e, Ts(i.done)), v.delete(i), v.size === 0 && (e.outrogroups = null);
          }
        } else
          c -= 1;
      },
      !1
    );
  }
  if (c === 0) {
    var l = r.length === 0 && n !== null;
    if (l) {
      var u = (
        /** @type {Element} */
        n
      ), p = (
        /** @type {Element} */
        u.parentNode
      );
      ma(p), p.append(u), e.items.clear();
    }
    lr(e, t, !l);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function lr(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = /* @__PURE__ */ new Set();
    for (const c of e.pending.values())
      for (const f of c)
        r.add(
          /** @type {EachItem} */
          e.items.get(f).e
        );
  }
  for (var s = 0; s < t.length; s++) {
    var i = t[s];
    if (r?.has(i)) {
      i.f |= ot;
      const c = document.createDocumentFragment();
      kr(i, c);
    } else
      Ae(t[s], n);
  }
}
var Vr;
function ln(e, t, n, r, s, i = null) {
  var c = e, f = /* @__PURE__ */ new Map(), l = (t & Zr) !== 0;
  if (l) {
    var u = (
      /** @type {Element} */
      e
    );
    c = u.appendChild(xt());
  }
  var p = null, _ = /* @__PURE__ */ ca(() => {
    var G = n();
    return (
      /** @type {V[]} */
      Jr(G) ? G : G == null ? [] : Ts(G)
    );
  }), v, b = /* @__PURE__ */ new Map(), k = !0;
  function y(G) {
    (ee.effect.f & Ue) === 0 && (ee.pending.delete(G), ee.fallback = p, qa(ee, v, c, t, r), p !== null && (v.length === 0 ? (p.f & ot) === 0 ? xs(p) : (p.f ^= ot, Vn(p, null, c)) : Jt(p, () => {
      p = null;
    })));
  }
  function m(G) {
    ee.pending.delete(G);
  }
  var O = _r(() => {
    v = /** @type {V[]} */
    o(_);
    for (var G = v.length, ve = /* @__PURE__ */ new Set(), xe = (
      /** @type {Batch} */
      L
    ), fe = Ei(), W = 0; W < G; W += 1) {
      var Ze = v[W], ut = r(Ze, W), se = k ? null : f.get(ut);
      se ? (se.v && En(se.v, Ze), se.i && En(se.i, W), fe && xe.unskip_effect(se.e)) : (se = Va(
        f,
        k ? c : Vr ?? (Vr = xt()),
        Ze,
        ut,
        W,
        s,
        t,
        n
      ), k || (se.e.f |= ot), f.set(ut, se)), ve.add(ut);
    }
    if (G === 0 && i && !p && (k ? p = Fe(() => i(c)) : (p = Fe(() => i(Vr ?? (Vr = xt()))), p.f |= ot)), G > ve.size && Io(), !k)
      if (b.set(xe, ve), fe) {
        for (const [Ve, Ne] of f)
          ve.has(Ve) || xe.skip_effect(Ne.e);
        xe.oncommit(y), xe.ondiscard(m);
      } else
        y(xe);
    o(_);
  }), ee = { effect: O, items: f, pending: b, outrogroups: null, fallback: p };
  k = !1;
}
function jn(e) {
  for (; e !== null && (e.f & Xe) === 0; )
    e = e.next;
  return e;
}
function qa(e, t, n, r, s) {
  var i = (r & qo) !== 0, c = t.length, f = e.items, l = jn(e.effect.first), u, p = null, _, v = [], b = [], k, y, m, O;
  if (i)
    for (O = 0; O < c; O += 1)
      k = t[O], y = s(k, O), m = /** @type {EachItem} */
      f.get(y).e, (m.f & ot) === 0 && (m.nodes?.a?.measure(), (_ ?? (_ = /* @__PURE__ */ new Set())).add(m));
  for (O = 0; O < c; O += 1) {
    if (k = t[O], y = s(k, O), m = /** @type {EachItem} */
    f.get(y).e, e.outrogroups !== null)
      for (const se of e.outrogroups)
        se.pending.delete(m), se.done.delete(m);
    if ((m.f & we) !== 0 && (xs(m), i && (m.nodes?.a?.unfix(), (_ ?? (_ = /* @__PURE__ */ new Set())).delete(m))), (m.f & ot) !== 0)
      if (m.f ^= ot, m === l)
        Vn(m, null, n);
      else {
        var ee = p ? p.next : l;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), Mt(e, p, m), Mt(e, m, ee), Vn(m, ee, n), p = m, v = [], b = [], l = jn(p.next);
        continue;
      }
    if (m !== l) {
      if (u !== void 0 && u.has(m)) {
        if (v.length < b.length) {
          var G = b[0], ve;
          p = G.prev;
          var xe = v[0], fe = v[v.length - 1];
          for (ve = 0; ve < v.length; ve += 1)
            Vn(v[ve], G, n);
          for (ve = 0; ve < b.length; ve += 1)
            u.delete(b[ve]);
          Mt(e, xe.prev, fe.next), Mt(e, p, xe), Mt(e, fe, G), l = G, p = fe, O -= 1, v = [], b = [];
        } else
          u.delete(m), Vn(m, l, n), Mt(e, m.prev, m.next), Mt(e, m, p === null ? e.effect.first : p.next), Mt(e, p, m), p = m;
        continue;
      }
      for (v = [], b = []; l !== null && l !== m; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(l), b.push(l), l = jn(l.next);
      if (l === null)
        continue;
    }
    (m.f & ot) === 0 && v.push(m), p = m, l = jn(m.next);
  }
  if (e.outrogroups !== null) {
    for (const se of e.outrogroups)
      se.pending.size === 0 && (lr(e, Ts(se.done)), e.outrogroups?.delete(se));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var W = [];
    if (u !== void 0)
      for (m of u)
        (m.f & we) === 0 && W.push(m);
    for (; l !== null; )
      (l.f & we) === 0 && l !== e.fallback && W.push(l), l = jn(l.next);
    var Ze = W.length;
    if (Ze > 0) {
      var ut = (r & Zr) !== 0 && c === 0 ? n : null;
      if (i) {
        for (O = 0; O < Ze; O += 1)
          W[O].nodes?.a?.measure();
        for (O = 0; O < Ze; O += 1)
          W[O].nodes?.a?.fix();
      }
      Ua(e, W, ut);
    }
  }
  i && Wt(() => {
    if (_ !== void 0)
      for (m of _)
        m.nodes?.a?.apply();
  });
}
function Va(e, t, n, r, s, i, c, f) {
  var l = (c & Ho) !== 0 ? (c & Vo) === 0 ? /* @__PURE__ */ ga(n, !1, !1) : Zt(n) : null, u = (c & Uo) !== 0 ? Zt(s) : null;
  return {
    v: l,
    i: u,
    e: Fe(() => (i(t, l ?? n, u ?? s, f), () => {
      e.delete(r);
    }))
  };
}
function Vn(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, s = e.nodes.end, i = t && (t.f & ot) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Zn(r)
      );
      if (i.before(r), r === s)
        return;
      r = c;
    }
}
function Mt(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Ba(e, t, n = !1, r = !1, s = !1, i = !1) {
  var c = e, f = "";
  if (n)
    var l = (
      /** @type {Element} */
      e
    );
  ge(() => {
    var u = (
      /** @type {Effect} */
      D
    );
    if (f !== (f = t() ?? "")) {
      if (n) {
        u.nodes = null, l.innerHTML = /** @type {string} */
        f, f !== "" && en(
          /** @type {TemplateNode} */
          /* @__PURE__ */ at(l),
          /** @type {TemplateNode} */
          l.lastChild
        );
        return;
      }
      if (u.nodes !== null && (Ci(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), f !== "") {
        var p = r ? Go : s ? Wo : void 0, _ = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          pr(r ? "svg" : s ? "math" : "template", p)
        );
        _.innerHTML = /** @type {any} */
        f;
        var v = r || s ? _ : (
          /** @type {HTMLTemplateElement} */
          _.content
        );
        if (en(
          /** @type {TemplateNode} */
          /* @__PURE__ */ at(v),
          /** @type {TemplateNode} */
          v.lastChild
        ), r || s)
          for (; /* @__PURE__ */ at(v); )
            c.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ at(v)
            );
        else
          c.before(v);
      }
    }
  });
}
function Ya(e, t) {
  Ti(() => {
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
      const s = pr("style");
      s.id = t.hash, s.textContent = t.code, r.appendChild(s);
    }
  });
}
function Ga(e, t, n) {
  var r = e == null ? "" : "" + e;
  return r = r ? r + " " + t : t, r === "" ? null : r;
}
function Wa(e, t) {
  return e == null ? null : String(e);
}
function cn(e, t, n, r, s, i) {
  var c = (
    /** @type {any} */
    e[Qs]
  );
  if (c !== n || c === void 0) {
    var f = Ga(n, r);
    f == null ? e.removeAttribute("class") : e.className = f, e[Qs] = n;
  }
  return i;
}
function Br(e, t, n, r) {
  var s = (
    /** @type {any} */
    e[Xs]
  );
  if (s !== t) {
    var i = Wa(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e[Xs] = t;
  }
  return r;
}
const Ka = Symbol("is custom element"), Ja = Symbol("is html");
function ls(e, t, n, r) {
  var s = $a(e);
  s[t] !== (s[t] = n) && (t === "loading" && (e[Co] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Qa(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function $a(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[fs] ?? (e[fs] = {
      [Ka]: e.nodeName.includes("-"),
      [Ja]: e.namespaceURI === ei
    })
  );
}
var Yr = /* @__PURE__ */ new Map();
function Qa(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Yr.get(t);
  if (n) return n;
  Yr.set(t, n = []);
  for (var r, s = e, i = Element.prototype; i !== s; ) {
    r = wo(s);
    for (var c in r)
      r[c].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      c !== "innerHTML" && c !== "textContent" && c !== "innerText" && n.push(c);
    s = $r(s);
  }
  return n;
}
function Xa(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet();
  wa(e, "input", async (s) => {
    var i = s ? e.defaultValue : e.value;
    if (i = Ys(e) ? Gs(i) : i, n(i), L !== null && r.add(L), await un(), i !== (i = t())) {
      var c = e.selectionStart, f = e.selectionEnd, l = e.value.length;
      if (e.value = i ?? "", f !== null) {
        var u = e.value.length;
        c === f && f === l && u > l ? (e.selectionStart = u, e.selectionEnd = u) : (e.selectionStart = c, e.selectionEnd = Math.min(f, u));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ms(t) == null && e.value && (n(Ys(e) ? Gs(e.value) : e.value), L !== null && r.add(L)), br(() => {
    var s = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        L
      );
      if (r.has(i))
        return;
    }
    Ys(e) && s === Gs(e.value) || e.type === "date" && !s && !e.value || s !== e.value && (e.value = s ?? "");
  });
}
function Ys(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function Gs(e) {
  return e === "" ? null : +e;
}
function Ws(e, t) {
  return e === t || e?.[cs] === t;
}
function Ks(e = {}, t, n, r) {
  var s = (
    /** @type {ComponentContext} */
    be.r
  ), i = (
    /** @type {Effect} */
    D
  );
  return Ti(() => {
    var c, f;
    return br(() => {
      c = f, f = [], Ms(() => {
        Ws(n(...f), e) || (t(e, ...f), c && Ws(n(...c), e) && t(null, ...c));
      });
    }), () => {
      let l = i;
      for (; l !== s && l.parent !== null && l.parent.f & $s; )
        l = l.parent;
      const u = () => {
        f && Ws(n(...f), e) && t(null, ...f);
      }, p = l.teardown;
      l.teardown = () => {
        u(), p?.();
      };
    };
  }), e;
}
function Za(e) {
  be === null && Mo(), hs(() => {
    const t = Ms(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const el = "5";
var Kr;
typeof window < "u" && ((Kr = window.__svelte ?? (window.__svelte = {})).v ?? (Kr.v = /* @__PURE__ */ new Set())).add(el);
var tl = /* @__PURE__ */ z('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), nl = /* @__PURE__ */ z('<div class="settings-assistant-grid svelte-beco3k"></div>'), sl = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), rl = /* @__PURE__ */ z('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), il = /* @__PURE__ */ z('<div class="settings-history-list svelte-beco3k"></div>'), ol = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k"> </p>'), al = /* @__PURE__ */ z('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), ll = /* @__PURE__ */ z(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), cl = /* @__PURE__ */ z('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), fl = /* @__PURE__ */ z('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), ul = /* @__PURE__ */ z('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), dl = /* @__PURE__ */ z('<div class="assistant-selector svelte-beco3k"></div>'), vl = /* @__PURE__ */ z('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), pl = /* @__PURE__ */ z('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), hl = /* @__PURE__ */ z('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), gl = /* @__PURE__ */ z('<div class="history-panel svelte-beco3k"><!></div>'), bl = /* @__PURE__ */ z(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), _l = /* @__PURE__ */ z(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), ml = /* @__PURE__ */ z('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), Gr = /* @__PURE__ */ Ps('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Wr = /* @__PURE__ */ Ps('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), kl = /* @__PURE__ */ z('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), wl = /* @__PURE__ */ z('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), xl = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), yl = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), El = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), Sl = /* @__PURE__ */ z('<p class="stream-status svelte-beco3k"> </p>'), Tl = /* @__PURE__ */ z('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), Al = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), Cl = /* @__PURE__ */ z('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), Ml = /* @__PURE__ */ z("<!> <!> <!>", 1), Pl = /* @__PURE__ */ z('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), Il = /* @__PURE__ */ z('<button class="suggestion-chip svelte-beco3k"> </button>'), Ll = /* @__PURE__ */ z('<div class="suggestions svelte-beco3k"><!></div>'), Nl = /* @__PURE__ */ Ps('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Rl = /* @__PURE__ */ Ps('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Dl = /* @__PURE__ */ z('<div class="llm-chat-root svelte-beco3k"><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const Ol = {
  hash: "svelte-beco3k",
  code: `.llm-chat-root.svelte-beco3k {display:flex;flex-direction:column;
		/* height is set via inline style driven by visualViewport on mobile;
		   the fallback keeps it correct on desktop */max-height:100%;min-height:300px;overflow:hidden;background:transparent;
		/* Prevent the component itself from scrolling — only messages-area scrolls */overscroll-behavior:none;
		/* Flush to the top of the sidebar panel — no stray gap */margin-top:0;padding-top:0;}

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
function zl(e, t) {
  si(t, !0), Ya(e, Ol);
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
  let s = /* @__PURE__ */ P(Ke([])), i = /* @__PURE__ */ P(""), c = /* @__PURE__ */ P(!1), f = /* @__PURE__ */ P(""), l = /* @__PURE__ */ P(!1), u = /* @__PURE__ */ P(Ke(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), p = /* @__PURE__ */ P(""), _ = /* @__PURE__ */ P(void 0), v = /* @__PURE__ */ P(Ke([])), b = /* @__PURE__ */ P(!1), k = /* @__PURE__ */ P(void 0), y = /* @__PURE__ */ P(Ke([])), m = /* @__PURE__ */ P(null), O = /* @__PURE__ */ P(!1), ee = /* @__PURE__ */ P(null), G = /* @__PURE__ */ P(void 0), ve = /* @__PURE__ */ P("100%"), xe = /* @__PURE__ */ P(null), fe = /* @__PURE__ */ P(!1), W = /* @__PURE__ */ P(null), Ze = /* @__PURE__ */ P(0), ut, se, Ve = /* @__PURE__ */ P(null), Ne = /* @__PURE__ */ P(Ke([])), Et = /* @__PURE__ */ P(!1), ts = /* @__PURE__ */ P(!1);
  const Cn = "https://geister-api.realmsgos.dev/", Hi = 36e4;
  let Ui = `${Cn}api/ask`, qi = `${Cn}suggestions`, Vi = `${Cn}api/personas/assistants`, Mn = `${Cn}api/conversations`;
  function Bi(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function wr(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function Yi(d) {
    !d || d.id === o(Ze) || (h(Ze, d.id, !0), h(i, d.message, !0), h(fe, !0), d.autoSend ? setTimeout(() => void nn(), 150) : un().then(zs));
  }
  function Gi() {
    if (wr(o(W)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function Wi() {
    ut = t.ctx.host?.pendingPrompt?.subscribe?.(Yi), se = t.ctx.host?.focus?.subscribe?.((d) => {
      h(W, d, !0);
    });
  }
  function xr(d, g) {
    if (g === 503 && d instanceof Error && d.message) {
      const w = d.message.toLowerCase();
      return w.includes("pod") || w.includes("llm backend") || w.includes("ollama") || w.includes("waking up") || w.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return g === 502 || g === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : g === 504 || g === 524 ? "The request timed out before the server could respond. Please try again." : g && g >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? xr(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function Ki(d) {
    const g = d.toLowerCase();
    return g.includes("llm backend") || g.includes("cannot reach ollama") || g.includes("ollama at");
  }
  function Pn() {
    h(u, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function yr() {
    h(u, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function Ji(d) {
    const g = d.toLowerCase();
    return g.includes("waking up") || g.includes("still starting");
  }
  function Is() {
    h(f, ""), h(l, !1);
  }
  function ns(d, g) {
    d.trim() && (h(l, !0), h(f, ""));
    const w = { text: d, isUser: !1, ...g.trim() ? { thinking: g } : {} }, x = o(s)[o(s).length - 1];
    !x || x.isUser ? h(s, [...o(s), w], !0) : h(s, o(s).map((C, Re) => Re === o(s).length - 1 ? { ...C, ...w } : C), !0), un().then(Ds);
  }
  function $i(d, g) {
    const w = typeof d.type == "string" ? d.type : d.text ? "text" : "", x = typeof d.text == "string" ? d.text : "";
    if (w === "status" && x) {
      Pn(), h(f, x, !0);
      return;
    }
    if (w === "thinking" && x) {
      Pn(), g.thinking += x, ns(g.text, g.thinking);
      return;
    }
    x && (Pn(), g.text += x, ns(g.text, g.thinking));
  }
  let In = "", St = "", Er, Sr, Tt = /* @__PURE__ */ P(!1);
  const Ls = !!t.ctx.sidebarPanel, Tr = "llm_chat_prefs";
  function Qi() {
    try {
      return JSON.parse(localStorage.getItem(Tr) || "{}");
    } catch {
      return {};
    }
  }
  function Xi(d) {
    try {
      localStorage.setItem(Tr, JSON.stringify(d));
    } catch {
    }
  }
  const Ns = Qi();
  let tn = /* @__PURE__ */ P(Ke(Ns.defaultAssistant || "")), Ot = /* @__PURE__ */ P(Ns.showSuggestions !== !1), Ln = /* @__PURE__ */ P(Ns.sharePageContext !== !1);
  hs(() => {
    Xi({
      defaultAssistant: o(tn),
      showSuggestions: o(Ot),
      sharePageContext: o(Ln)
    });
  });
  let Nn = /* @__PURE__ */ P("unknown"), ss = /* @__PURE__ */ P(!1), Rs = /* @__PURE__ */ P(!1);
  async function Ar() {
    try {
      const d = await fetch(`${Cn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      h(Nn, d.ok ? "online" : "offline", !0);
    } catch {
      h(Nn, "offline");
    }
  }
  async function Zi() {
    if (!(!St || !o(Tt))) {
      h(ss, !0);
      try {
        await Os(), await Promise.all(o(Ne).map((d) => fetch(`${Mn}/${d.conversation_id}`, { method: "DELETE" }))), h(Ne, [], !0), h(s, [], !0), h(Ve, null), h(Rs, !0), setTimeout(
          () => {
            h(Rs, !1);
          },
          2e3
        );
      } catch {
      } finally {
        h(ss, !1);
      }
    }
  }
  Za(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", g = t.ctx.config?.canisterId || "";
    In = d || g, Er = t.ctx.principal?.subscribe?.((x) => {
      St = x || "";
    }), Sr = t.ctx.isAuthenticated?.subscribe?.((x) => {
      h(Tt, x, !0);
    });
    const w = window.visualViewport;
    if (w) {
      const x = () => {
        const C = o(G)?.getBoundingClientRect().top ?? w.offsetTop, Re = Math.max(Math.round(w.height - C), 200);
        h(ve, `${Re}px`);
      };
      await un(), x(), w.addEventListener("resize", x), w.addEventListener("scroll", x), window.addEventListener("resize", x), window.__chatVpCleanup = () => {
        w.removeEventListener("resize", x), w.removeEventListener("scroll", x), window.removeEventListener("resize", x);
      };
    }
    if (eo(), Wi(), await to(), o(tn) && o(y).length > 0) {
      const x = o(y).find((C) => C.id === o(tn));
      x && h(m, x, !0);
    }
    !o(fe) && o(Ot) && await rs(), Ls || (Ar(), o(Tt) && await Os());
  });
  function eo() {
    try {
      const d = new URLSearchParams(window.location.search), g = d.get("explain");
      if (!g) return;
      const [w, x] = g.split(":");
      if (w === "codex" && x)
        h(fe, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: x })).then((C) => {
          if (C.success) {
            const dt = (typeof C.response == "string" ? JSON.parse(C.response) : C.response).codex?.name || `codex_${x}`, pe = `/extensions/codex_viewer/${x}`;
            h(xe, x, !0), h(i, `Please explain this codex: [${dt}](${pe})`), setTimeout(() => nn(), 300);
          }
        }).catch((C) => {
          console.error("Failed to fetch codex for explanation:", C), h(fe, !1);
        });
      else if (w === "financial_statements") {
        h(fe, !0);
        const C = d.get("context") || "";
        h(i, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${C}`), setTimeout(() => nn(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  hs(() => {
    o(s), un().then(Ds);
  });
  function Ds() {
    o(_) && (o(_).scrollTop = o(_).scrollHeight);
  }
  async function to() {
    if (!o(O)) {
      h(O, !0);
      try {
        const d = await fetch(Vi, {
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
  async function rs() {
    if (!o(b)) {
      h(b, !0);
      try {
        const d = new URLSearchParams({
          user_principal: St || "",
          realm_principal: In || "",
          persona: o(m)?.id || "ashoka"
        }), g = await fetch(`${qi}?${d.toString()}`, {
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
  async function nn() {
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
    h(i, ""), h(c, !0), Is(), h(f, o(u) ? "Thinking…" : "", !0);
    try {
      await io();
      const g = r(), w = {
        question: d,
        realm_principal: In,
        user_principal: St,
        stream: !0,
        verbosity: 1,
        persona: o(m)?.id || "ashoka",
        network: g,
        ...o(Ve) ? { conversation_id: o(Ve) } : {}
      };
      if (o(xe))
        w.explain_codex_id = o(xe), h(xe, null);
      else {
        const te = Bi(o(W)?.uri);
        te && (w.explain_codex_id = te);
      }
      const x = wr(o(W)?.uri);
      x && (w.explain_proposal_id = x, w.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(W)?.label || "Proposal",
        proposalId: x
      }), o(W) && (w.focus = {
        uri: o(W).uri,
        label: o(W).label
      });
      const C = await fetch(Ui, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(w),
        signal: AbortSignal.timeout(Hi)
      });
      if (!C.ok) {
        let te = "";
        try {
          const Be = await C.json();
          te = typeof Be?.error == "string" ? Be.error : "";
        } catch {
        }
        throw te ? Object.assign(new Error(te), { httpStatus: C.status }) : Object.assign(new Error(`HTTP error! Status: ${C.status}`), { httpStatus: C.status });
      }
      const Re = C.body?.getReader();
      if (!Re) throw new Error("Response body is not readable");
      const dt = new TextDecoder(), pe = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: te, value: Be } = await Re.read();
          if (te) break;
          const Rn = dt.decode(Be, { stream: !0 }).split(`
`);
          for (const tt of Rn)
            if (tt.startsWith("data: ")) {
              const vt = tt.slice(6);
              if (vt === "[DONE]") continue;
              try {
                $i(JSON.parse(vt), pe);
              } catch {
                pe.text += vt, ns(pe.text, pe.thinking);
              }
            } else tt.trim() && !tt.startsWith(":") && (pe.text += tt, ns(pe.text, pe.thinking));
        }
      } finally {
        Re.releaseLock();
      }
      const et = pe.text, is = pe.thinking;
      et.trim() ? Ki(et) ? (h(p, "The AI backend is temporarily offline. Please try again in a few minutes."), yr()) : et.trim() && Pn() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? h(s, o(s).map((te, Be) => Be === o(s).length - 1 ? { ...te, text: "No response from LLM" } : te), !0) : h(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), h(c, !1), Is(), h(fe, !1), await rs();
    } catch (g) {
      console.error("Error calling LLM:", g), h(p, xr(g, g?.httpStatus), !0), Ji(o(p)) && yr(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && h(s, o(s).slice(0, -1), !0);
    } finally {
      h(c, !1), Is(), h(fe, !1);
    }
  }
  function no() {
    h(p, "");
  }
  async function Os() {
    if (!(!St || !o(Tt))) {
      h(ts, !0);
      try {
        const d = new URLSearchParams({
          user_principal: St,
          realm_principal: In
        }), g = await fetch(`${Mn}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!g.ok) return;
        const w = await g.json();
        h(Ne, (w.conversations || []).sort((x, C) => new Date(C.updated_at).getTime() - new Date(x.updated_at).getTime()), !0);
      } catch {
      } finally {
        h(ts, !1);
      }
    }
  }
  async function Cr(d) {
    h(Et, !1), h(s, [], !0), h(Ve, d.conversation_id, !0);
    const g = o(y).find((w) => w.id === d.persona);
    g && h(m, g, !0);
    try {
      const w = await fetch(`${Mn}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!w.ok) return;
      const x = await w.json();
      h(s, oo(x.messages || []), !0), o(s).some((C) => !C.isUser) && Pn(), await un(), Ds();
    } catch {
    }
  }
  async function so() {
    h(Et, !1), h(s, [], !0), h(Ve, null), h(p, ""), h(v, [], !0), await rs();
  }
  async function Mr(d, g) {
    g.stopPropagation();
    try {
      await fetch(`${Mn}/${d}`, { method: "DELETE" }), h(Ne, o(Ne).filter((w) => w.conversation_id !== d), !0), o(Ve) === d && (h(s, [], !0), h(Ve, null));
    } catch {
    }
  }
  async function ro() {
    h(Et, !0), await Os();
  }
  function Pr(d) {
    const g = new Date(d), x = (/* @__PURE__ */ new Date()).getTime() - g.getTime(), C = Math.floor(x / 864e5);
    return C === 0 ? g.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : C === 1 ? "Yesterday" : C < 7 ? g.toLocaleDateString([], { weekday: "short" }) : g.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function io() {
    if (!(o(Ve) || !St || !o(Tt)))
      try {
        const d = await fetch(Mn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: St,
            realm_principal: In,
            persona: o(m)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const g = await d.json();
          h(Ve, g.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function Ir(d, g) {
    const w = () => {
      h(ee, g, !0), setTimeout(
        () => {
          h(ee, null);
        },
        1500
      );
    }, x = () => {
      const C = document.createElement("textarea");
      C.value = d, C.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(C), C.focus(), C.select();
      try {
        document.execCommand("copy"), w();
      } catch {
      }
      document.body.removeChild(C);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(w).catch(x) : x();
  }
  function oo(d) {
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
  function ao(d) {
    if (!d) return "";
    let g = d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return g = g.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), g;
  }
  function zs() {
    if (o(k)) {
      o(k).style.height = "auto";
      const d = Math.max(40, Math.min(o(k).scrollHeight, 120));
      o(k).style.height = d + "px";
    }
  }
  function lo(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), nn()), setTimeout(zs, 0);
  }
  function co(d) {
    h(i, d, !0), nn();
  }
  function fo(d) {
    h(m, d, !0), h(s, [], !0), rs();
  }
  hs(() => () => {
    Er?.(), Sr?.(), ut?.(), se?.(), window.__chatVpCleanup?.();
  });
  var Lr = on(), uo = jt(Lr);
  {
    var vo = (d) => {
      var g = ll(), w = I(E(g), 2), x = I(E(w), 4);
      {
        var C = ($) => {
          var _e = nl();
          ln(_e, 21, () => o(y), an, (T, j) => {
            var K = tl(), V = E(K), X = E(V), re = I(V, 2), H = E(re);
            ge(() => {
              cn(K, 1, `settings-assistant-btn ${o(tn) === o(j).id || !o(tn) && o(y)[0].id === o(j).id ? "selected" : ""}`, "svelte-beco3k"), me(X, o(j).emoji), me(H, o(j).name);
            }), ne("click", K, () => h(tn, o(j).id, !0)), S(T, K);
          }), S($, _e);
        }, Re = ($) => {
          var _e = sl();
          S($, _e);
        };
        q(x, ($) => {
          o(y).length > 0 ? $(C) : $(Re, -1);
        });
      }
      var dt = I(w, 2), pe = I(E(dt), 2), et = I(E(pe), 2), is = I(pe, 2), te = I(E(is), 2), Be = I(dt, 2);
      {
        var os = ($) => {
          var _e = al(), T = I(E(_e), 2);
          {
            var j = (N) => {
              var Y = il();
              ln(Y, 21, () => o(Ne), an, (J, le) => {
                var nt = rl(), pt = E(nt), Ce = E(pt), Ye = E(Ce), ie = I(Ce, 2), ce = E(ie), he = I(pt, 2);
                ge(
                  (ht) => {
                    me(Ye, o(le).title), me(ce, `${ht ?? ""} · ${o(le).message_count ?? ""} message${o(le).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Pr(o(le).updated_at)]
                ), ne("click", he, (ht) => Mr(o(le).conversation_id, ht)), S(J, nt);
              }), S(N, Y);
            }, K = (N) => {
              var Y = ol(), J = E(Y);
              ge(() => me(J, o(ts) ? "Loading…" : "No conversations yet.")), S(N, Y);
            };
            q(T, (N) => {
              o(Ne).length > 0 ? N(j) : N(K, -1);
            });
          }
          var V = I(T, 2), X = E(V);
          {
            var re = (N) => {
              var Y = rn("✓ History cleared");
              S(N, Y);
            }, H = (N) => {
              var Y = rn("Clearing…");
              S(N, Y);
            }, B = (N) => {
              var Y = rn("Clear all history");
              S(N, Y);
            };
            q(X, (N) => {
              o(Rs) ? N(re) : o(ss) ? N(H, 1) : N(B, -1);
            });
          }
          ge(() => V.disabled = o(ss) || o(Ne).length === 0), ne("click", V, Zi), S($, _e);
        };
        q(Be, ($) => {
          o(Tt) && $(os);
        });
      }
      var Rn = I(Be, 2), tt = I(E(Rn), 4), vt = I(E(tt), 2), js = E(vt);
      {
        var Fs = ($) => {
          var _e = rn("● Online");
          S($, _e);
        }, zt = ($) => {
          var _e = rn("● Offline");
          S($, _e);
        }, Dn = ($) => {
          var _e = rn("Checking…");
          S($, _e);
        };
        q(js, ($) => {
          o(Nn) === "online" ? $(Fs) : o(Nn) === "offline" ? $(zt, 1) : $(Dn, -1);
        });
      }
      var Hs = I(tt, 2);
      ge(() => {
        cn(et, 1, `settings-switch ${o(Ot) ? "on" : ""}`, "svelte-beco3k"), ls(et, "aria-checked", o(Ot)), cn(te, 1, `settings-switch ${o(Ln) ? "on" : ""}`, "svelte-beco3k"), ls(te, "aria-checked", o(Ln)), cn(vt, 1, `settings-api-status ${o(Nn) ?? ""}`, "svelte-beco3k");
      }), ne("click", et, () => h(Ot, !o(Ot))), ne("click", te, () => h(Ln, !o(Ln))), ne("click", Hs, Ar), S(d, g);
    }, po = (d) => {
      var g = Dl(), w = E(g);
      {
        var x = (T) => {
          var j = cl(), K = E(j), V = I(K, 2);
          ge(() => cn(V, 1, `toolbar-btn ${o(Et) ? "active" : ""}`, "svelte-beco3k")), ne("click", K, so), ne("click", V, function(...X) {
            (o(Et) ? () => h(Et, !1) : ro)?.apply(this, X);
          }), S(T, j);
        };
        q(w, (T) => {
          o(Tt) && T(x);
        });
      }
      var C = I(w, 2);
      {
        var Re = (T) => {
          var j = fl(), K = E(j), V = E(K), X = I(K, 2);
          ge(() => {
            ls(K, "title", o(W).uri), me(V, o(W).label);
          }), ne("click", X, Gi), S(T, j);
        };
        q(C, (T) => {
          Ls && o(W)?.label && T(Re);
        });
      }
      var dt = I(C, 2);
      {
        var pe = (T) => {
          var j = dl();
          ln(j, 21, () => o(y), an, (K, V) => {
            var X = ul(), re = E(X), H = E(re), B = I(re, 2), N = E(B);
            ge(() => {
              cn(X, 1, `assistant-btn ${o(m)?.id === o(V).id ? "active" : ""}`, "svelte-beco3k"), ls(X, "title", o(V).description), me(H, o(V).emoji), me(N, o(V).name);
            }), ne("click", X, () => fo(o(V))), S(K, X);
          }), S(T, j);
        };
        q(dt, (T) => {
          o(y).length > 1 && T(pe);
        });
      }
      var et = I(dt, 2);
      {
        var is = (T) => {
          var j = gl(), K = E(j);
          {
            var V = (H) => {
              var B = vl();
              S(H, B);
            }, X = (H) => {
              var B = pl();
              S(H, B);
            }, re = (H) => {
              var B = on(), N = jt(B);
              ln(N, 17, () => o(Ne), an, (Y, J) => {
                var le = hl(), nt = E(le), pt = E(nt), Ce = E(pt), Ye = I(pt, 2), ie = E(Ye), ce = I(nt, 2);
                ge(
                  (he) => {
                    me(Ce, o(J).title), me(ie, `${he ?? ""} · ${o(J).message_count ?? ""} msg${o(J).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Pr(o(J).updated_at)]
                ), ne("click", le, () => Cr(o(J))), ne("keydown", le, (he) => he.key === "Enter" && Cr(o(J))), ne("click", ce, (he) => Mr(o(J).conversation_id, he)), S(Y, le);
              }), S(H, B);
            };
            q(K, (H) => {
              o(ts) ? H(V) : o(Ne).length === 0 ? H(X, 1) : H(re, -1);
            });
          }
          S(T, j);
        };
        q(et, (T) => {
          o(Et) && T(is);
        });
      }
      var te = I(et, 2), Be = E(te);
      {
        var os = (T) => {
          var j = ml(), K = E(j), V = E(K);
          {
            var X = (H) => {
              var B = bl();
              S(H, B);
            }, re = (H) => {
              var B = _l();
              S(H, B);
            };
            q(V, (H) => {
              o(Tt) ? H(X) : H(re, -1);
            });
          }
          S(T, j);
        }, Rn = (T) => {
          var j = Ml(), K = jt(j);
          ln(K, 17, () => o(s), an, (B, N, Y) => {
            var J = on(), le = jt(J);
            {
              var nt = (Ce) => {
                var Ye = kl(), ie = E(Ye), ce = E(ie), he = E(ce);
                {
                  var ht = (Ct) => {
                    var zn = Gr();
                    S(Ct, zn);
                  }, On = (Ct) => {
                    var zn = Wr();
                    S(Ct, zn);
                  };
                  q(he, (Ct) => {
                    o(ee) === Y ? Ct(ht) : Ct(On, -1);
                  });
                }
                var st = I(ce, 2), At = E(st);
                ge(() => me(At, o(N).text)), ne("click", ce, () => Ir(o(N).text, Y)), S(Ce, Ye);
              }, pt = (Ce) => {
                var Ye = xl(), ie = E(Ye), ce = E(ie), he = E(ce);
                {
                  var ht = (ye) => {
                    var gt = wl(), Us = I(E(gt), 2), go = E(Us);
                    ge(() => me(go, o(N).thinking)), S(ye, gt);
                  };
                  q(he, (ye) => {
                    o(N).thinking && ye(ht);
                  });
                }
                var On = I(he, 2);
                {
                  var st = (ye) => {
                    var gt = on(), Us = jt(gt);
                    Ba(Us, () => ao(o(N).text)), S(ye, gt);
                  };
                  q(On, (ye) => {
                    o(N).text && ye(st);
                  });
                }
                var At = I(ce, 2), Ct = E(At);
                {
                  var zn = (ye) => {
                    var gt = Gr();
                    S(ye, gt);
                  }, ho = (ye) => {
                    var gt = Wr();
                    S(ye, gt);
                  };
                  q(Ct, (ye) => {
                    o(ee) === Y ? ye(zn) : ye(ho, -1);
                  });
                }
                ne("click", At, () => Ir(o(N).text, Y)), S(Ce, Ye);
              };
              q(le, (Ce) => {
                o(N).isUser ? Ce(nt) : Ce(pt, -1);
              });
            }
            S(B, J);
          });
          var V = I(K, 2);
          {
            var X = (B) => {
              var N = Al(), Y = E(N), J = E(Y);
              {
                var le = (ie) => {
                  var ce = on(), he = jt(ce);
                  {
                    var ht = (st) => {
                      var At = yl();
                      S(st, At);
                    }, On = (st) => {
                      var At = El();
                      S(st, At);
                    };
                    q(he, (st) => {
                      o(fe) ? st(ht) : !o(u) && !o(f) && st(On, 1);
                    });
                  }
                  S(ie, ce);
                };
                q(J, (ie) => {
                  o(l) || ie(le);
                });
              }
              var nt = I(J, 2);
              {
                var pt = (ie) => {
                  var ce = Sl(), he = E(ce);
                  ge(() => me(he, o(f))), S(ie, ce);
                };
                q(nt, (ie) => {
                  o(f) && ie(pt);
                });
              }
              var Ce = I(nt, 2);
              {
                var Ye = (ie) => {
                  var ce = Tl();
                  S(ie, ce);
                };
                q(Ce, (ie) => {
                  !o(l) && !o(f) && o(u) && !o(fe) && ie(Ye);
                });
              }
              S(B, N);
            };
            q(V, (B) => {
              o(c) && (!o(l) || o(f)) && B(X);
            });
          }
          var re = I(V, 2);
          {
            var H = (B) => {
              var N = Cl(), Y = E(N), J = E(Y), le = I(Y, 2);
              ge(() => me(J, o(p))), ne("click", le, no), S(B, N);
            };
            q(re, (B) => {
              o(p) && B(H);
            });
          }
          S(T, j);
        };
        q(Be, (T) => {
          o(s).length === 0 && !o(fe) ? T(os) : T(Rn, -1);
        });
      }
      Ks(te, (T) => h(_, T), () => o(_));
      var tt = I(te, 2), vt = E(tt);
      {
        var js = (T) => {
          var j = Ll(), K = E(j);
          {
            var V = (re) => {
              var H = Pl();
              S(re, H);
            }, X = (re) => {
              var H = on(), B = jt(H);
              ln(B, 17, () => o(v), an, (N, Y) => {
                var J = Il(), le = E(J);
                ge(() => me(le, o(Y))), ne("click", J, () => co(o(Y))), S(N, J);
              }), S(re, H);
            };
            q(K, (re) => {
              o(b) ? re(V) : re(X, -1);
            });
          }
          S(T, j);
        };
        q(vt, (T) => {
          o(Ot) && (o(v).length > 0 || o(b)) && T(js);
        });
      }
      var Fs = I(vt, 2), zt = E(Fs);
      Ks(zt, (T) => h(k, T), () => o(k));
      var Dn = I(zt, 2), Hs = E(Dn);
      {
        var $ = (T) => {
          var j = Nl();
          S(T, j);
        }, _e = (T) => {
          var j = Rl();
          S(T, j);
        };
        q(Hs, (T) => {
          o(c) ? T($) : T(_e, -1);
        });
      }
      Ks(g, (T) => h(G, T), () => o(G)), ge(
        (T) => {
          Br(g, `height: ${o(ve) ?? ""}`), Br(te, o(Et) ? "display:none" : ""), Dn.disabled = T;
        },
        [() => o(c) || !o(i).trim()]
      ), ne("keydown", zt, lo), ne("input", zt, () => zs()), Xa(zt, () => o(i), (T) => h(i, T)), ne("click", Dn, () => nn()), S(d, g);
    };
    q(uo, (d) => {
      Ls ? d(po, -1) : d(vo);
    });
  }
  S(e, Lr), ri();
}
Na(["click", "keydown", "input"]);
function Hl(e, t) {
  const n = za(zl, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Fa(n);
      } catch {
      }
    }
  };
}
export {
  Hl as default
};
