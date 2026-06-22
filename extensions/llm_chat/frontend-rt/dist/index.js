var go = Object.defineProperty;
var Ir = (e) => {
  throw TypeError(e);
};
var bo = (e, t, n) => t in e ? go(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Me = (e, t, n) => bo(e, typeof t != "symbol" ? t + "" : t, n), Us = (e, t, n) => t.has(e) || Ir("Cannot " + n);
var a = (e, t, n) => (Us(e, t, "read from private field"), n ? n.call(e) : t.get(e)), C = (e, t, n) => t.has(e) ? Ir("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), A = (e, t, n, r) => (Us(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), F = (e, t, n) => (Us(e, t, "access private method"), n);
var Kr = Array.isArray, _o = Array.prototype.indexOf, gs = Array.prototype.includes, Ss = Array.from, ko = Object.defineProperty, Vn = Object.getOwnPropertyDescriptor, mo = Object.getOwnPropertyDescriptors, wo = Object.prototype, xo = Array.prototype, Jr = Object.getPrototypeOf, Nr = Object.isExtensible;
const yo = () => {
};
function Eo(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function $r() {
  var e, t, n = new Promise((r, s) => {
    e = r, t = s;
  });
  return { promise: n, resolve: e, reject: t };
}
const ve = 2, kn = 4, Ts = 8, Qr = 1 << 24, We = 16, $e = 32, Lt = 64, Ws = 128, Fe = 512, ae = 1024, de = 2048, ct = 4096, xe = 8192, He = 16384, En = 32768, Ks = 1 << 25, mn = 65536, bs = 1 << 17, So = 1 << 18, Sn = 1 << 19, To = 1 << 20, ot = 1 << 25, $t = 65536, _s = 1 << 21, un = 1 << 22, Nt = 1 << 23, ls = Symbol("$state"), Ao = Symbol(""), cs = Symbol("attributes"), Js = Symbol("class"), $s = Symbol("style"), zn = Symbol("text"), fs = Symbol("form reset"), As = new class extends Error {
  constructor() {
    super(...arguments);
    Me(this, "name", "StaleReactionError");
    Me(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Co(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Mo() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Po(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Io(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function No() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Lo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Ro() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Do() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Oo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function zo() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function jo() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Fo = 1, Ho = 2, Xr = 4, Uo = 8, qo = 16, Vo = 1, Bo = 2, oe = Symbol("uninitialized"), Zr = "http://www.w3.org/1999/xhtml", Yo = "http://www.w3.org/2000/svg", Go = "http://www.w3.org/1998/Math/MathML";
function Wo() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Ko() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function ei(e) {
  return e === this.v;
}
function Jo(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function ti(e) {
  return !Jo(e, this.v);
}
let _e = null;
function wn(e) {
  _e = e;
}
function ni(e, t = !1, n) {
  _e = {
    p: _e,
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
function si(e) {
  var t = (
    /** @type {ComponentContext} */
    _e
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      Ei(r);
  }
  return t.i = !0, _e = t.p, /** @type {T} */
  {};
}
function ri() {
  return !0;
}
let jt = [];
function ii() {
  var e = jt;
  jt = [], Eo(e);
}
function Gt(e) {
  if (jt.length === 0 && !Bn) {
    var t = jt;
    queueMicrotask(() => {
      t === jt && ii();
    });
  }
  jt.push(e);
}
function $o() {
  for (; jt.length > 0; )
    ii();
}
function oi(e) {
  var t = D;
  if (t === null)
    return R.f |= Nt, e;
  if ((t.f & En) === 0 && (t.f & kn) === 0)
    throw e;
  It(e, t);
}
function It(e, t) {
  if (!(t !== null && (t.f & He) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & Ws) !== 0) {
        if ((t.f & En) === 0)
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
const Qo = -7169;
function Z(e, t) {
  e.f = e.f & Qo | t;
}
function lr(e) {
  (e.f & Fe) !== 0 || e.deps === null ? Z(e, ae) : Z(e, ct);
}
function ai(e) {
  if (e !== null)
    for (const t of e)
      (t.f & ve) === 0 || (t.f & $t) === 0 || (t.f ^= $t, ai(
        /** @type {Derived} */
        t.deps
      ));
}
function li(e, t, n) {
  (e.f & de) !== 0 ? t.add(e) : (e.f & ct) !== 0 && n.add(e), ai(e.deps), Z(e, ae);
}
function Xo(e) {
  let t = 0, n = Xt(0), r;
  return () => {
    pr() && (o(n), hr(() => (t === 0 && (r = Cs(() => e(() => Yn(n)))), t += 1, () => {
      Gt(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, Yn(n));
      });
    })));
  };
}
var Zo = mn | Sn;
function ea(e, t, n, r) {
  new ta(e, t, n, r);
}
var De, ar, Oe, Ut, Ee, ze, we, Ie, _t, qt, Mt, dn, Wn, Kn, kt, xs, Q, na, sa, ra, Qs, us, ds, Xs, Zs;
class ta {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, s) {
    C(this, Q);
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
    C(this, De);
    /** @type {TemplateNode | null} */
    C(this, ar, null);
    /** @type {BoundaryProps} */
    C(this, Oe);
    /** @type {((anchor: Node) => void)} */
    C(this, Ut);
    /** @type {Effect} */
    C(this, Ee);
    /** @type {Effect | null} */
    C(this, ze, null);
    /** @type {Effect | null} */
    C(this, we, null);
    /** @type {Effect | null} */
    C(this, Ie, null);
    /** @type {DocumentFragment | null} */
    C(this, _t, null);
    C(this, qt, 0);
    C(this, Mt, 0);
    C(this, dn, !1);
    /** @type {Set<Effect>} */
    C(this, Wn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    C(this, Kn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    C(this, kt, null);
    C(this, xs, Xo(() => (A(this, kt, Xt(a(this, qt))), () => {
      A(this, kt, null);
    })));
    A(this, De, t), A(this, Oe, n), A(this, Ut, (i) => {
      var c = (
        /** @type {Effect} */
        D
      );
      c.b = this, c.f |= Ws, r(i);
    }), this.parent = /** @type {Effect} */
    D.b, this.transform_error = s ?? this.parent?.transform_error ?? ((i) => i), A(this, Ee, gr(() => {
      F(this, Q, Qs).call(this);
    }, Zo));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    li(t, a(this, Wn), a(this, Kn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!a(this, Oe).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    F(this, Q, Xs).call(this, t, n), A(this, qt, a(this, qt) + t), !(!a(this, kt) || a(this, dn)) && (A(this, dn, !0), Gt(() => {
      A(this, dn, !1), a(this, kt) && xn(a(this, kt), a(this, qt));
    }));
  }
  get_effect_pending() {
    return a(this, xs).call(this), o(
      /** @type {Source<number>} */
      a(this, kt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!a(this, Oe).onerror && !a(this, Oe).failed)
      throw t;
    N?.is_fork ? (a(this, ze) && N.skip_effect(a(this, ze)), a(this, we) && N.skip_effect(a(this, we)), a(this, Ie) && N.skip_effect(a(this, Ie)), N.oncommit(() => {
      F(this, Q, Zs).call(this, t);
    })) : F(this, Q, Zs).call(this, t);
  }
}
De = new WeakMap(), ar = new WeakMap(), Oe = new WeakMap(), Ut = new WeakMap(), Ee = new WeakMap(), ze = new WeakMap(), we = new WeakMap(), Ie = new WeakMap(), _t = new WeakMap(), qt = new WeakMap(), Mt = new WeakMap(), dn = new WeakMap(), Wn = new WeakMap(), Kn = new WeakMap(), kt = new WeakMap(), xs = new WeakMap(), Q = new WeakSet(), na = function() {
  try {
    A(this, ze, je(() => a(this, Ut).call(this, a(this, De))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
sa = function(t) {
  const n = a(this, Oe).failed;
  n && A(this, Ie, je(() => {
    n(
      a(this, De),
      () => t,
      () => () => {
      }
    );
  }));
}, ra = function() {
  const t = a(this, Oe).pending;
  t && (this.is_pending = !0, A(this, we, je(() => t(a(this, De)))), Gt(() => {
    var n = A(this, _t, document.createDocumentFragment()), r = xt();
    n.append(r), A(this, ze, F(this, Q, ds).call(this, () => je(() => a(this, Ut).call(this, r)))), a(this, Mt) === 0 && (a(this, De).before(n), A(this, _t, null), Kt(
      /** @type {Effect} */
      a(this, we),
      () => {
        A(this, we, null);
      }
    ), F(this, Q, us).call(
      this,
      /** @type {Batch} */
      N
    ));
  }));
}, Qs = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), A(this, Mt, 0), A(this, qt, 0), A(this, ze, je(() => {
      a(this, Ut).call(this, a(this, De));
    })), a(this, Mt) > 0) {
      var t = A(this, _t, document.createDocumentFragment());
      _r(a(this, ze), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        a(this, Oe).pending
      );
      A(this, we, je(() => n(a(this, De))));
    } else
      F(this, Q, us).call(
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
us = function(t) {
  this.is_pending = !1, t.transfer_effects(a(this, Wn), a(this, Kn));
}, /**
 * @template T
 * @param {() => T} fn
 */
ds = function(t) {
  var n = D, r = R, s = _e;
  ft(a(this, Ee)), Ue(a(this, Ee)), wn(a(this, Ee).ctx);
  try {
    return Qt.ensure(), t();
  } catch (i) {
    return oi(i), null;
  } finally {
    ft(n), Ue(r), wn(s);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Xs = function(t, n) {
  var r;
  if (!this.has_pending_snippet()) {
    this.parent && F(r = this.parent, Q, Xs).call(r, t, n);
    return;
  }
  A(this, Mt, a(this, Mt) + t), a(this, Mt) === 0 && (F(this, Q, us).call(this, n), a(this, we) && Kt(a(this, we), () => {
    A(this, we, null);
  }), a(this, _t) && (a(this, De).before(a(this, _t)), A(this, _t, null)));
}, /**
 * @param {unknown} error
 */
Zs = function(t) {
  a(this, ze) && (Ae(a(this, ze)), A(this, ze, null)), a(this, we) && (Ae(a(this, we)), A(this, we, null)), a(this, Ie) && (Ae(a(this, Ie)), A(this, Ie, null));
  var n = a(this, Oe).onerror;
  let r = a(this, Oe).failed;
  var s = !1, i = !1;
  const c = () => {
    if (s) {
      Ko();
      return;
    }
    s = !0, i && jo(), a(this, Ie) !== null && Kt(a(this, Ie), () => {
      A(this, Ie, null);
    }), F(this, Q, ds).call(this, () => {
      F(this, Q, Qs).call(this);
    });
  }, f = (l) => {
    try {
      i = !0, n?.(l, c), i = !1;
    } catch (u) {
      It(u, a(this, Ee) && a(this, Ee).parent);
    }
    r && A(this, Ie, F(this, Q, ds).call(this, () => {
      try {
        return je(() => {
          var u = (
            /** @type {Effect} */
            D
          );
          u.b = this, u.f |= Ws, r(
            a(this, De),
            () => l,
            () => c
          );
        });
      } catch (u) {
        return It(
          u,
          /** @type {Effect} */
          a(this, Ee).parent
        ), null;
      }
    }));
  };
  Gt(() => {
    var l;
    try {
      l = this.transform_error(t);
    } catch (u) {
      It(u, a(this, Ee) && a(this, Ee).parent);
      return;
    }
    l !== null && typeof l == "object" && typeof /** @type {any} */
    l.then == "function" ? l.then(
      f,
      /** @param {unknown} e */
      (u) => It(u, a(this, Ee) && a(this, Ee).parent)
    ) : f(l);
  });
};
function ia(e, t, n, r) {
  const s = fi;
  var i = e.filter((b) => !b.settled), c = t.map(s);
  if (n.length === 0 && i.length === 0) {
    r(c);
    return;
  }
  var f = (
    /** @type {Effect} */
    D
  ), l = oa(), u = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((b) => b.promise)) : null;
  function p(b) {
    if ((f.f & He) === 0) {
      l();
      try {
        r([...c, ...b]);
      } catch (m) {
        It(m, f);
      }
      ks();
    }
  }
  var _ = ci();
  if (n.length === 0) {
    u.then(() => p([])).finally(_);
    return;
  }
  function v() {
    Promise.all(n.map((b) => /* @__PURE__ */ aa(b))).then(p).catch((b) => It(b, f)).finally(_);
  }
  u ? u.then(() => {
    l(), v(), ks();
  }) : v();
}
function oa() {
  var e = (
    /** @type {Effect} */
    D
  ), t = R, n = _e, r = (
    /** @type {Batch} */
    N
  );
  return function(i = !0) {
    ft(e), Ue(t), wn(n), i && (e.f & He) === 0 && (r?.activate(), r?.apply());
  };
}
function ks(e = !0) {
  ft(null), Ue(null), wn(null), e && N?.deactivate();
}
function ci() {
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
function fi(e) {
  var t = ve | de;
  return D !== null && (D.f |= Sn), {
    ctx: _e,
    deps: null,
    effects: null,
    equals: ei,
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
const jn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function aa(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    D
  );
  r === null && Mo();
  var s = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = Xt(
    /** @type {V} */
    oe
  ), c = !R, f = /* @__PURE__ */ new Set();
  return Sa(() => {
    var l = (
      /** @type {Effect} */
      D
    ), u = $r();
    s = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, (b) => {
        b !== As && u.reject(b);
      }).finally(ks);
    } catch (b) {
      u.reject(b), ks();
    }
    var p = (
      /** @type {Batch} */
      N
    );
    if (c) {
      if ((l.f & En) !== 0)
        var _ = ci();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        r.b?.is_rendered()
      )
        p.async_deriveds.get(l)?.reject(jn);
      else
        for (const b of f.values())
          b.reject(jn);
      f.add(u), p.async_deriveds.set(l, u);
    }
    const v = (b, m = void 0) => {
      _?.(), f.delete(u), m !== jn && (p.activate(), m ? (i.f |= Nt, xn(i, m)) : ((i.f & Nt) !== 0 && (i.f ^= Nt), xn(i, b)), p.deactivate());
    };
    u.promise.then(v, (b) => v(null, b || "unknown"));
  }), ya(() => {
    for (const l of f)
      l.reject(jn);
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
function la(e) {
  const t = /* @__PURE__ */ fi(e);
  return t.equals = ti, t;
}
function ca(e) {
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
function cr(e) {
  var t, n = D, r = e.parent;
  if (!Rt && r !== null && e.v !== oe && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (r.f & (He | xe)) !== 0)
    return Wo(), e.v;
  ft(r);
  try {
    e.f &= ~$t, ca(e), t = Ri(e);
  } finally {
    ft(n);
  }
  return t;
}
function ui(e) {
  var t = cr(e);
  if (!e.equals(t) && (e.wv = Ni(), (!N?.is_fork || e.deps === null) && (N !== null ? (N.capture(e, t, !0), er?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    Z(e, ae);
    return;
  }
  Rt || (Ke !== null ? (pr() || N?.is_fork) && Ke.set(e, t) : lr(e));
}
function fa(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(As), t.fn !== null && (t.teardown = yo), t.ac = null, Gn(t, 0), br(t));
}
function di(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && yn(t);
}
let qs = null, nn = null, N = null, er = null, Ke = null, tr = null, Bn = !1, Vs = !1, fn = null, vs = null;
var Lr = 0;
let ua = 1;
var vn, Pt, Vt, pn, hn, gn, mt, bn, Se, Jn, wt, Be, rt, _n, Bt, U, nr, Fn, sr, vi, pi, cn, da, Hn;
const ys = class ys {
  constructor() {
    C(this, U);
    Me(this, "id", ua++);
    /** True as soon as `#process` was called */
    C(this, vn, !1);
    Me(this, "linked", !0);
    /** @type {Batch | null} */
    C(this, Pt, null);
    /** @type {Batch | null} */
    C(this, Vt, null);
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
    C(this, pn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    C(this, hn, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    C(this, gn, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    C(this, mt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    C(this, bn, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    C(this, Se, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    C(this, Jn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    C(this, wt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    C(this, Be, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    C(this, rt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    C(this, _n, /* @__PURE__ */ new Set());
    Me(this, "is_fork", !1);
    C(this, Bt, !1);
    nn === null ? qs = nn = this : (A(nn, Vt, this), A(this, Pt, nn)), nn = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    a(this, rt).has(t) || a(this, rt).set(t, { d: [], m: [] }), a(this, _n).delete(t);
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
        Z(s, de), n(s);
      for (s of r.m)
        Z(s, ct), n(s);
    }
    a(this, _n).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, r = !1) {
    t.v !== oe && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Nt) === 0 && (this.current.set(t, [n, r]), Ke?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    N = this;
  }
  deactivate() {
    N = null, Ke = null;
  }
  flush() {
    try {
      Vs = !0, N = this, F(this, U, Fn).call(this);
    } finally {
      Lr = 0, tr = null, fn = null, vs = null, Vs = !1, N = null, Ke = null, Wt.clear();
    }
  }
  discard() {
    for (const t of a(this, hn)) t(this);
    a(this, hn).clear();
    for (const t of this.async_deriveds.values())
      t.reject(jn);
    F(this, U, Hn).call(this), a(this, bn)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    a(this, Jn).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    if (A(this, gn, a(this, gn) + 1), t) {
      let r = a(this, mt).get(n) ?? 0;
      a(this, mt).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, n) {
    if (A(this, gn, a(this, gn) - 1), t) {
      let r = a(this, mt).get(n) ?? 0;
      r === 1 ? a(this, mt).delete(n) : a(this, mt).set(n, r - 1);
    }
    a(this, Bt) || (A(this, Bt, !0), Gt(() => {
      A(this, Bt, !1), this.linked && this.flush();
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
      a(this, Be).add(r);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    a(this, pn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    a(this, hn).add(t);
  }
  settled() {
    return (a(this, bn) ?? A(this, bn, $r())).promise;
  }
  static ensure() {
    if (N === null) {
      const t = N = new ys();
      !Vs && !Bn && Gt(() => {
        a(t, vn) || t.flush();
      });
    }
    return N;
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
    if (tr = t, t.b?.is_pending && (t.f & (kn | Ts | Qr)) !== 0 && (t.f & En) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var r = n.f;
      if (fn !== null && n === D && (R === null || (R.f & ve) === 0))
        return;
      if ((r & (Lt | $e)) !== 0) {
        if ((r & ae) === 0)
          return;
        n.f ^= ae;
      }
    }
    a(this, Se).push(n);
  }
};
vn = new WeakMap(), Pt = new WeakMap(), Vt = new WeakMap(), pn = new WeakMap(), hn = new WeakMap(), gn = new WeakMap(), mt = new WeakMap(), bn = new WeakMap(), Se = new WeakMap(), Jn = new WeakMap(), wt = new WeakMap(), Be = new WeakMap(), rt = new WeakMap(), _n = new WeakMap(), Bt = new WeakMap(), U = new WeakSet(), nr = function() {
  if (this.is_fork) return !0;
  for (const r of a(this, mt).keys()) {
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
}, Fn = function() {
  var l, u, p;
  A(this, vn, !0), Lr++ > 1e3 && (F(this, U, Hn).call(this), pa());
  for (const _ of a(this, wt))
    a(this, Be).delete(_), Z(_, de), this.schedule(_);
  for (const _ of a(this, Be))
    Z(_, ct), this.schedule(_);
  const t = a(this, Se);
  A(this, Se, []), this.apply();
  var n = fn = [], r = [], s = vs = [];
  for (const _ of t)
    try {
      F(this, U, sr).call(this, _, n, r);
    } catch (v) {
      throw bi(_), F(this, U, nr).call(this) || this.discard(), v;
    }
  if (N = null, s.length > 0) {
    var i = ys.ensure();
    for (const _ of s)
      i.schedule(_);
  }
  if (fn = null, vs = null, F(this, U, nr).call(this)) {
    F(this, U, cn).call(this, r), F(this, U, cn).call(this, n);
    for (const [_, v] of a(this, rt))
      gi(_, v);
    s.length > 0 && /** @type {unknown} */
    F(l = N, U, Fn).call(l);
    return;
  }
  const c = F(this, U, vi).call(this);
  if (c) {
    F(this, U, cn).call(this, r), F(this, U, cn).call(this, n), F(u = c, U, pi).call(u, this);
    return;
  }
  a(this, wt).clear(), a(this, Be).clear();
  for (const _ of a(this, pn)) _(this);
  a(this, pn).clear(), er = this, Rr(r), Rr(n), er = null, a(this, bn)?.resolve();
  var f = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    N
  );
  if (a(this, gn) === 0 && (a(this, Se).length === 0 || f !== null) && F(this, U, Hn).call(this), a(this, Se).length > 0)
    if (f !== null) {
      const _ = f;
      a(_, Se).push(...a(this, Se).filter((v) => !a(_, Se).includes(v)));
    } else
      f = this;
  f !== null && F(p = f, U, Fn).call(p);
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
sr = function(t, n, r) {
  t.f ^= ae;
  for (var s = t.first; s !== null; ) {
    var i = s.f, c = (i & ($e | Lt)) !== 0, f = c && (i & ae) !== 0, l = f || (i & xe) !== 0 || a(this, rt).has(s);
    if (!l && s.fn !== null) {
      c ? s.f ^= ae : (i & kn) !== 0 ? n.push(s) : Zn(s) && ((i & We) !== 0 && a(this, Be).add(s), yn(s));
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
}, vi = function() {
  for (var t = a(this, Pt); t !== null; ) {
    if (!t.is_fork) {
      for (const [n, [, r]] of this.current)
        if (t.current.has(n) && !r)
          return t;
    }
    t = a(t, Pt);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
pi = function(t) {
  var r;
  for (const [s, i] of t.current)
    !this.previous.has(s) && t.previous.has(s) && this.previous.set(s, t.previous.get(s)), this.current.set(s, i);
  for (const [s, i] of t.async_deriveds) {
    const c = this.async_deriveds.get(s);
    c && i.promise.then(c.resolve).catch(c.reject);
  }
  t.async_deriveds.clear(), this.transfer_effects(a(t, wt), a(t, Be));
  const n = (s) => {
    var i = s.reactions;
    if (i !== null)
      for (const l of i) {
        var c = l.f;
        if ((c & ve) !== 0)
          n(
            /** @type {Derived} */
            l
          );
        else {
          var f = (
            /** @type {Effect} */
            l
          );
          c & (un | We) && !this.async_deriveds.has(f) && (a(this, Be).delete(f), Z(f, de), this.schedule(f));
        }
      }
  };
  for (const s of this.current.keys())
    n(s);
  this.oncommit(() => t.discard()), F(r = t, U, Hn).call(r), N = this, F(this, U, Fn).call(this);
}, /**
 * @param {Effect[]} effects
 */
cn = function(t) {
  for (var n = 0; n < t.length; n += 1)
    li(t[n], a(this, wt), a(this, Be));
}, da = function() {
  var _;
  for (let v = qs; v !== null; v = a(v, Vt)) {
    var t = v.id < this.id, n = [];
    for (const [b, [m, y]] of this.current) {
      if (v.current.has(b)) {
        var r = (
          /** @type {[any, boolean]} */
          v.current.get(b)[0]
        );
        if (t && m !== r)
          v.current.set(b, [m, y]);
        else
          continue;
      }
      n.push(b);
    }
    if (t)
      for (const [b, m] of this.async_deriveds) {
        const y = v.async_deriveds.get(b);
        y && m.promise.then(y.resolve).catch(y.reject);
      }
    var s = [...v.current.keys()].filter(
      (b) => !/** @type {[any, boolean]} */
      v.current.get(b)[1]
    );
    if (!(!a(v, vn) || s.length === 0)) {
      var i = s.filter((b) => !this.current.has(b));
      if (i.length === 0)
        t && v.discard();
      else if (n.length > 0) {
        if (t)
          for (const b of a(this, _n))
            v.unskip_effect(b, (m) => {
              var y;
              (m.f & (We | un)) !== 0 ? v.schedule(m) : F(y = v, U, cn).call(y, [m]);
            });
        v.activate();
        var c = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
        for (var l of n)
          hi(l, i, c, f);
        f = /* @__PURE__ */ new Map();
        var u = [...v.current].filter(([b, m]) => {
          const y = this.current.get(b);
          return y ? y[0] !== m[0] || y[1] !== m[1] : !0;
        }).map(([b]) => b);
        if (u.length > 0)
          for (const b of a(this, Jn))
            (b.f & (He | xe | bs)) === 0 && fr(b, u, f) && ((b.f & (un | We)) !== 0 ? (Z(b, de), v.schedule(b)) : a(v, wt).add(b));
        if (a(v, Se).length > 0 && !a(v, Bt)) {
          v.apply();
          for (var p of a(v, Se))
            F(_ = v, U, sr).call(_, p, [], []);
          A(v, Se, []);
        }
        v.deactivate();
      }
    }
  }
}, Hn = function() {
  if (this.linked) {
    var t = a(this, Pt), n = a(this, Vt);
    t === null ? qs = n : A(t, Vt, n), n === null ? nn = t : A(n, Pt, t), this.linked = !1;
  }
};
let Qt = ys;
function va(e) {
  var t = Bn;
  Bn = !0;
  try {
    for (var n; ; ) {
      if ($o(), N === null)
        return (
          /** @type {T} */
          n
        );
      N.flush();
    }
  } finally {
    Bn = t;
  }
}
function pa() {
  try {
    Ro();
  } catch (e) {
    It(e, tr);
  }
}
let bt = null;
function Rr(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (He | xe)) === 0 && Zn(r) && (bt = /* @__PURE__ */ new Set(), yn(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Ci(r), bt?.size > 0)) {
        Wt.clear();
        for (const s of bt) {
          if ((s.f & (He | xe)) !== 0) continue;
          const i = [s];
          let c = s.parent;
          for (; c !== null; )
            bt.has(c) && (bt.delete(c), i.push(c)), c = c.parent;
          for (let f = i.length - 1; f >= 0; f--) {
            const l = i[f];
            (l.f & (He | xe)) === 0 && yn(l);
          }
        }
        bt.clear();
      }
    }
    bt = null;
  }
}
function hi(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const s of e.reactions) {
      const i = s.f;
      (i & ve) !== 0 ? hi(
        /** @type {Derived} */
        s,
        t,
        n,
        r
      ) : (i & (un | We)) !== 0 && (i & de) === 0 && fr(s, t, r) && (Z(s, de), ur(
        /** @type {Effect} */
        s
      ));
    }
}
function fr(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const s of e.deps) {
      if (gs.call(t, s))
        return !0;
      if ((s.f & ve) !== 0 && fr(
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
function ur(e) {
  N.schedule(e);
}
function gi(e, t) {
  if (!((e.f & $e) !== 0 && (e.f & ae) !== 0)) {
    (e.f & de) !== 0 ? t.d.push(e) : (e.f & ct) !== 0 && t.m.push(e), Z(e, ae);
    for (var n = e.first; n !== null; )
      gi(n, t), n = n.next;
  }
}
function bi(e) {
  Z(e, ae);
  for (var t = e.first; t !== null; )
    bi(t), t = t.next;
}
let ms = /* @__PURE__ */ new Set();
const Wt = /* @__PURE__ */ new Map();
let _i = !1;
function Xt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: ei,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function P(e, t) {
  const n = Xt(e);
  return Aa(n), n;
}
// @__NO_SIDE_EFFECTS__
function ha(e, t = !1, n = !0) {
  const r = Xt(e);
  return t || (r.equals = ti), r;
}
function h(e, t, n = !1) {
  R !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Je || (R.f & bs) !== 0) && ri() && (R.f & (ve | We | un | bs)) !== 0 && (lt === null || !lt.has(e)) && zo();
  let r = n ? Ge(t) : t;
  return xn(e, r, vs);
}
function xn(e, t, n = null) {
  if (!e.equals(t)) {
    Wt.set(e, Rt ? t : e.v);
    var r = Qt.ensure();
    if (r.capture(e, t), (e.f & ve) !== 0) {
      const s = (
        /** @type {Derived} */
        e
      );
      (e.f & de) !== 0 && cr(s), Ke === null && lr(s);
    }
    e.wv = Ni(), ki(e, de, n), D !== null && (D.f & ae) !== 0 && (D.f & ($e | Lt)) === 0 && (Re === null ? Ca([e]) : Re.push(e)), !r.is_fork && ms.size > 0 && !_i && ga();
  }
  return t;
}
function ga() {
  _i = !1;
  for (const e of ms) {
    (e.f & ae) !== 0 && Z(e, ct);
    let t;
    try {
      t = Zn(e);
    } catch {
      t = !0;
    }
    t && yn(e);
  }
  ms.clear();
}
function Yn(e) {
  h(e, e.v + 1);
}
function ki(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var s = r.length, i = 0; i < s; i++) {
      var c = r[i], f = c.f, l = (f & de) === 0;
      if (l && Z(c, t), (f & bs) !== 0)
        ms.add(
          /** @type {Effect} */
          c
        );
      else if ((f & ve) !== 0) {
        var u = (
          /** @type {Derived} */
          c
        );
        Ke?.delete(u), (f & $t) === 0 && (f & Fe && (D === null || (D.f & _s) === 0) && (c.f |= $t), ki(u, ct, n));
      } else if (l) {
        var p = (
          /** @type {Effect} */
          c
        );
        (f & We) !== 0 && bt !== null && bt.add(p), n !== null ? n.push(p) : ur(p);
      }
    }
}
function Ge(e) {
  if (typeof e != "object" || e === null || ls in e)
    return e;
  const t = Jr(e);
  if (t !== wo && t !== xo)
    return e;
  var n = /* @__PURE__ */ new Map(), r = Kr(e), s = /* @__PURE__ */ P(0), i = Jt, c = (f) => {
    if (Jt === i)
      return f();
    var l = R, u = Jt;
    Ue(null), jr(i);
    var p = f();
    return Ue(l), jr(u), p;
  };
  return r && n.set("length", /* @__PURE__ */ P(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, l, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && Do();
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
            n.set(l, p), Yn(s);
          }
        } else
          h(u, oe), Yn(s);
        return !0;
      },
      get(f, l, u) {
        if (l === ls)
          return e;
        var p = n.get(l), _ = l in f;
        if (p === void 0 && (!_ || Vn(f, l)?.writable) && (p = c(() => {
          var b = Ge(_ ? f[l] : oe), m = /* @__PURE__ */ P(b);
          return m;
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
        if (l === ls)
          return !0;
        var u = n.get(l), p = u !== void 0 && u.v !== oe || Reflect.has(f, l);
        if (u !== void 0 || D !== null && (!p || Vn(f, l)?.writable)) {
          u === void 0 && (u = c(() => {
            var v = p ? Ge(f[l]) : oe, b = /* @__PURE__ */ P(v);
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
            var m = n.get(b + "");
            m !== void 0 ? h(m, oe) : b in f && (m = c(() => /* @__PURE__ */ P(oe)), n.set(b + "", m));
          }
        if (_ === void 0)
          (!v || Vn(f, l)?.writable) && (_ = c(() => /* @__PURE__ */ P(void 0)), h(_, Ge(u)), n.set(l, _));
        else {
          v = _.v !== oe;
          var y = c(() => Ge(u));
          h(_, y);
        }
        var k = Reflect.getOwnPropertyDescriptor(f, l);
        if (k?.set && k.set.call(p, u), !v) {
          if (r && typeof l == "string") {
            var O = (
              /** @type {Source<number>} */
              n.get("length")
            ), ee = Number(l);
            Number.isInteger(ee) && ee >= O.v && h(O, ee + 1);
          }
          Yn(s);
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
        Oo();
      }
    }
  );
}
var Dr, mi, wi, xi;
function ba() {
  if (Dr === void 0) {
    Dr = window, mi = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    wi = Vn(t, "firstChild").get, xi = Vn(t, "nextSibling").get, Nr(e) && (e[Js] = void 0, e[cs] = null, e[$s] = void 0, e.__e = void 0), Nr(n) && (n[zn] = void 0);
  }
}
function xt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function at(e) {
  return (
    /** @type {TemplateNode | null} */
    wi.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Xn(e) {
  return (
    /** @type {TemplateNode | null} */
    xi.call(e)
  );
}
function E(e, t) {
  return /* @__PURE__ */ at(e);
}
function zt(e, t = !1) {
  {
    var n = /* @__PURE__ */ at(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ Xn(n) : n;
  }
}
function I(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ Xn(r);
  return r;
}
function _a(e) {
  e.textContent = "";
}
function yi() {
  return !1;
}
function dr(e, t, n) {
  return t == null || t === Zr ? (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElement(e)
  ) : (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t, e)
  );
}
let Or = !1;
function ka() {
  Or || (Or = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t[fs]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function vr(e) {
  var t = R, n = D;
  Ue(null), ft(null);
  try {
    return e();
  } finally {
    Ue(t), ft(n);
  }
}
function ma(e, t, n, r = n) {
  e.addEventListener(t, () => vr(n));
  const s = (
    /** @type {any} */
    e[fs]
  );
  s ? e[fs] = () => {
    s(), r(!0);
  } : e[fs] = () => r(!0), ka();
}
function wa(e) {
  D === null && (R === null && Lo(), No()), Rt && Io();
}
function xa(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function yt(e, t) {
  var n = D;
  n !== null && (n.f & xe) !== 0 && (e |= xe);
  var r = {
    ctx: _e,
    deps: null,
    nodes: null,
    f: e | de | Fe,
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
  if ((e & kn) !== 0)
    fn !== null ? fn.push(r) : Qt.ensure().schedule(r);
  else if (t !== null) {
    try {
      yn(r);
    } catch (c) {
      throw Ae(r), c;
    }
    s.deps === null && s.teardown === null && s.nodes === null && s.first === s.last && // either `null`, or a singular child
    (s.f & Sn) === 0 && (s = s.first, (e & We) !== 0 && (e & mn) !== 0 && s !== null && (s.f |= mn));
  }
  if (s !== null && (s.parent = n, n !== null && xa(s, n), R !== null && (R.f & ve) !== 0 && (e & Lt) === 0)) {
    var i = (
      /** @type {Derived} */
      R
    );
    (i.effects ?? (i.effects = [])).push(s);
  }
  return r;
}
function pr() {
  return R !== null && !Je;
}
function ya(e) {
  const t = yt(Ts, null);
  return Z(t, ae), t.teardown = e, t;
}
function ps(e) {
  wa();
  var t = (
    /** @type {Effect} */
    D.f
  ), n = !R && (t & $e) !== 0 && _e !== null && !_e.i;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      _e
    );
    (r.e ?? (r.e = [])).push(e);
  } else
    return Ei(e);
}
function Ei(e) {
  return yt(kn | To, e);
}
function Ea(e) {
  Qt.ensure();
  const t = yt(Lt | Sn, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? Kt(t, () => {
      Ae(t), r(void 0);
    }) : (Ae(t), r(void 0));
  });
}
function Si(e) {
  return yt(kn, e);
}
function Sa(e) {
  return yt(un | Sn, e);
}
function hr(e, t = 0) {
  return yt(Ts | t, e);
}
function be(e, t = [], n = [], r = []) {
  ia(r, t, n, (s) => {
    yt(Ts, () => {
      e(...s.map(o));
    });
  });
}
function gr(e, t = 0) {
  var n = yt(We | t, e);
  return n;
}
function je(e) {
  return yt($e | Sn, e);
}
function Ti(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Rt, r = R;
    zr(!0), Ue(null);
    try {
      t.call(null);
    } finally {
      zr(n), Ue(r);
    }
  }
}
function br(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const s = n.ac;
    s !== null && vr(() => {
      s.abort(As);
    });
    var r = n.next;
    (n.f & Lt) !== 0 ? n.parent = null : Ae(n, t), n = r;
  }
}
function Ta(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & $e) === 0 && Ae(t), t = n;
  }
}
function Ae(e, t = !0) {
  var n = !1;
  (t || (e.f & So) !== 0) && e.nodes !== null && e.nodes.end !== null && (Ai(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), e.f |= Ks, br(e, t && !n), Gn(e, 0);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const i of r)
      i.stop();
  Ti(e), e.f ^= Ks, e.f |= He;
  var s = e.parent;
  s !== null && s.first !== null && Ci(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Ai(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ Xn(e);
    e.remove(), e = n;
  }
}
function Ci(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Kt(e, t, n = !0) {
  var r = [];
  Mi(e, r, !0);
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
function Mi(e, t, n) {
  if ((e.f & xe) === 0) {
    e.f ^= xe;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const f of r)
        (f.is_global || n) && t.push(f);
    for (var s = e.first; s !== null; ) {
      var i = s.next;
      if ((s.f & Lt) === 0) {
        var c = (s.f & mn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (s.f & $e) !== 0 && (e.f & We) !== 0;
        Mi(s, t, c ? n : !1);
      }
      s = i;
    }
  }
}
function ws(e) {
  Pi(e, !0);
}
function Pi(e, t) {
  if ((e.f & xe) !== 0) {
    e.f ^= xe, (e.f & ae) === 0 && (Z(e, de), Qt.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, s = (n.f & mn) !== 0 || (n.f & $e) !== 0;
      Pi(n, s ? t : !1), n = r;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const c of i)
        (c.is_global || t) && c.in();
  }
}
function _r(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var s = n === r ? null : /* @__PURE__ */ Xn(n);
      t.append(n), n = s;
    }
}
let hs = !1, Rt = !1;
function zr(e) {
  Rt = e;
}
let R = null, Je = !1;
function Ue(e) {
  R = e;
}
let D = null;
function ft(e) {
  D = e;
}
let lt = null;
function Aa(e) {
  R !== null && (lt ?? (lt = /* @__PURE__ */ new Set())).add(e);
}
let Te = null, Pe = 0, Re = null;
function Ca(e) {
  Re = e;
}
let Ii = 1, Ft = 0, Jt = Ft;
function jr(e) {
  Jt = e;
}
function Ni() {
  return ++Ii;
}
function Zn(e) {
  var t = e.f;
  if ((t & de) !== 0)
    return !0;
  if (t & ve && (e.f &= ~$t), (t & ct) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, s = 0; s < r; s++) {
      var i = n[s];
      if (Zn(
        /** @type {Derived} */
        i
      ) && ui(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & Fe) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Ke === null && Z(e, ae);
  }
  return !1;
}
function Li(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(lt !== null && lt.has(e)))
    for (var s = 0; s < r.length; s++) {
      var i = r[s];
      (i.f & ve) !== 0 ? Li(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? Z(i, de) : (i.f & ae) !== 0 && Z(i, ct), ur(
        /** @type {Effect} */
        i
      ));
    }
}
function Ri(e) {
  var y;
  var t = Te, n = Pe, r = Re, s = R, i = lt, c = _e, f = Je, l = Jt, u = e.f;
  Te = /** @type {null | Value[]} */
  null, Pe = 0, Re = null, R = (u & ($e | Lt)) === 0 ? e : null, lt = null, wn(e.ctx), Je = !1, Jt = ++Ft, e.ac !== null && (vr(() => {
    e.ac.abort(As);
  }), e.ac = null);
  try {
    e.f |= _s;
    var p = (
      /** @type {Function} */
      e.fn
    ), _ = p();
    e.f |= En;
    var v = e.deps, b = N?.is_fork;
    if (Te !== null) {
      var m;
      if (b || Gn(e, Pe), v !== null && Pe > 0)
        for (v.length = Pe + Te.length, m = 0; m < Te.length; m++)
          v[Pe + m] = Te[m];
      else
        e.deps = v = Te;
      if (pr() && (e.f & Fe) !== 0)
        for (m = Pe; m < v.length; m++)
          ((y = v[m]).reactions ?? (y.reactions = [])).push(e);
    } else !b && v !== null && Pe < v.length && (Gn(e, Pe), v.length = Pe);
    if (ri() && Re !== null && !Je && v !== null && (e.f & (ve | ct | de)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      Re.length; m++)
        Li(
          Re[m],
          /** @type {Effect} */
          e
        );
    if (s !== null && s !== e) {
      if (Ft++, s.deps !== null)
        for (let k = 0; k < n; k += 1)
          s.deps[k].rv = Ft;
      if (t !== null)
        for (const k of t)
          k.rv = Ft;
      Re !== null && (r === null ? r = Re : r.push(.../** @type {Source[]} */
      Re));
    }
    return (e.f & Nt) !== 0 && (e.f ^= Nt), _;
  } catch (k) {
    return oi(k);
  } finally {
    e.f ^= _s, Te = t, Pe = n, Re = r, R = s, lt = i, wn(c), Je = f, Jt = l;
  }
}
function Ma(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = _o.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? n = t.reactions = null : (n[r] = n[s], n.pop());
    }
  }
  if (n === null && (t.f & ve) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Te === null || !gs.call(Te, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & Fe) !== 0 && (i.f ^= Fe, i.f &= ~$t), i.v !== oe && lr(i), fa(i), Gn(i, 0);
  }
}
function Gn(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      Ma(e, n[r]);
}
function yn(e) {
  var t = e.f;
  if ((t & He) === 0) {
    Z(e, ae);
    var n = D, r = hs;
    D = e, hs = !0;
    try {
      (t & (We | Qr)) !== 0 ? Ta(e) : br(e), Ti(e);
      var s = Ri(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = Ii;
      var i;
    } finally {
      hs = r, D = n;
    }
  }
}
async function Un() {
  await Promise.resolve(), va();
}
function o(e) {
  var t = e.f, n = (t & ve) !== 0;
  if (R !== null && !Je) {
    var r = D !== null && (D.f & He) !== 0;
    if (!r && (lt === null || !lt.has(e))) {
      var s = R.deps;
      if ((R.f & _s) !== 0)
        e.rv < Ft && (e.rv = Ft, Te === null && s !== null && s[Pe] === e ? Pe++ : Te === null ? Te = [e] : Te.push(e));
      else {
        R.deps ?? (R.deps = []), gs.call(R.deps, e) || R.deps.push(e);
        var i = e.reactions;
        i === null ? e.reactions = [R] : gs.call(i, R) || i.push(R);
      }
    }
  }
  if (Rt && Wt.has(e))
    return Wt.get(e);
  if (n) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (Rt) {
      var f = c.v;
      return ((c.f & ae) === 0 && c.reactions !== null || Oi(c)) && (f = cr(c)), Wt.set(c, f), f;
    }
    var l = (c.f & Fe) === 0 && !Je && R !== null && (hs || (R.f & Fe) !== 0), u = (c.f & En) === 0;
    Zn(c) && (l && (c.f |= Fe), ui(c)), l && !u && (di(c), Di(c));
  }
  if (Ke?.has(e))
    return Ke.get(e);
  if ((e.f & Nt) !== 0)
    throw e.v;
  return e.v;
}
function Di(e) {
  if (e.f |= Fe, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & ve) !== 0 && (t.f & Fe) === 0 && (di(
        /** @type {Derived} */
        t
      ), Di(
        /** @type {Derived} */
        t
      ));
}
function Oi(e) {
  if (e.v === oe) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Wt.has(t) || (t.f & ve) !== 0 && Oi(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Cs(e) {
  var t = Je;
  try {
    return Je = !0, e();
  } finally {
    Je = t;
  }
}
const Pa = ["touchstart", "touchmove"];
function Ia(e) {
  return Pa.includes(e);
}
const Ht = Symbol("events"), zi = /* @__PURE__ */ new Set(), rr = /* @__PURE__ */ new Set();
function se(e, t, n) {
  (t[Ht] ?? (t[Ht] = {}))[e] = n;
}
function Na(e) {
  for (var t = 0; t < e.length; t++)
    zi.add(e[t]);
  for (var n of rr)
    n(e);
}
let Fr = null;
function Hr(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, s = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    s[0] || e.target
  );
  Fr = e;
  var c = 0, f = Fr === e && e[Ht];
  if (f) {
    var l = s.indexOf(f);
    if (l !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Ht] = t;
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
    Ue(null), ft(null);
    try {
      for (var v, b = []; i !== null && i !== t; ) {
        try {
          var m = i[Ht]?.[r];
          m != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i) && m.call(i, e);
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
      e[Ht] = t, delete e.currentTarget, Ue(p), ft(_);
    }
  }
}
const La = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Ra(e) {
  return (
    /** @type {string} */
    La?.createHTML(e) ?? e
  );
}
function ji(e) {
  var t = dr("template");
  return t.innerHTML = Ra(e.replaceAll("<!>", "<!---->")), t.content;
}
function Zt(e, t) {
  var n = (
    /** @type {Effect} */
    D
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function z(e, t) {
  var n = (t & Vo) !== 0, r = (t & Bo) !== 0, s, i = !e.startsWith("<!>");
  return () => {
    s === void 0 && (s = ji(i ? e : "<!>" + e), n || (s = /** @type {TemplateNode} */
    /* @__PURE__ */ at(s)));
    var c = (
      /** @type {TemplateNode} */
      r || mi ? document.importNode(s, !0) : s.cloneNode(!0)
    );
    if (n) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ at(c)
      ), l = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      Zt(f, l);
    } else
      Zt(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Da(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), s = `<${n}>${r ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var c = (
        /** @type {DocumentFragment} */
        ji(s)
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
    return Zt(l, l), l;
  };
}
// @__NO_SIDE_EFFECTS__
function Ms(e, t) {
  return /* @__PURE__ */ Da(e, t, "svg");
}
function sn(e = "") {
  {
    var t = xt(e + "");
    return Zt(t, t), t;
  }
}
function rn() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = xt();
  return e.append(t, n), Zt(t, n), e;
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
  (e[zn] ?? (e[zn] = e.nodeValue)) && (e[zn] = n, e.nodeValue = `${n}`);
}
function Oa(e, t) {
  return za(e, t);
}
const os = /* @__PURE__ */ new Map();
function za(e, { target: t, anchor: n, props: r = {}, events: s, context: i, intro: c = !0, transformError: f }) {
  ba();
  var l = void 0, u = Ea(() => {
    var p = n ?? t.appendChild(xt());
    ea(
      /** @type {TemplateNode} */
      p,
      {
        pending: () => {
        }
      },
      (b) => {
        ni({});
        var m = (
          /** @type {ComponentContext} */
          _e
        );
        i && (m.c = i), s && (r.$$events = s), l = e(b, r) || {}, si();
      },
      f
    );
    var _ = /* @__PURE__ */ new Set(), v = (b) => {
      for (var m = 0; m < b.length; m++) {
        var y = b[m];
        if (!_.has(y)) {
          _.add(y);
          var k = Ia(y);
          for (const W of [t, document]) {
            var O = os.get(W);
            O === void 0 && (O = /* @__PURE__ */ new Map(), os.set(W, O));
            var ee = O.get(y);
            ee === void 0 ? (W.addEventListener(y, Hr, { passive: k }), O.set(y, 1)) : O.set(y, ee + 1);
          }
        }
      }
    };
    return v(Ss(zi)), rr.add(v), () => {
      for (var b of _)
        for (const k of [t, document]) {
          var m = (
            /** @type {Map<string, number>} */
            os.get(k)
          ), y = (
            /** @type {number} */
            m.get(b)
          );
          --y == 0 ? (k.removeEventListener(b, Hr), m.delete(b), m.size === 0 && os.delete(k)) : m.set(b, y);
        }
      rr.delete(v), p !== n && p.parentNode?.removeChild(p);
    };
  });
  return ir.set(l, u), l;
}
let ir = /* @__PURE__ */ new WeakMap();
function ja(e, t) {
  const n = ir.get(e);
  return n ? (ir.delete(e), n(t)) : Promise.resolve();
}
var Ye, it, Ne, Yt, $n, Qn, Es;
class Fa {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Me(this, "anchor");
    /** @type {Map<Batch, Key>} */
    C(this, Ye, /* @__PURE__ */ new Map());
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
    C(this, it, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    C(this, Ne, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    C(this, Yt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    C(this, $n, !0);
    /**
     * @param {Batch} batch
     */
    C(this, Qn, (t) => {
      if (a(this, Ye).has(t)) {
        var n = (
          /** @type {Key} */
          a(this, Ye).get(t)
        ), r = a(this, it).get(n);
        if (r)
          ws(r), a(this, Yt).delete(n);
        else {
          var s = a(this, Ne).get(n);
          s && (ws(s.effect), a(this, it).set(n, s.effect), a(this, Ne).delete(n), s.fragment.lastChild.remove(), this.anchor.before(s.fragment), r = s.effect);
        }
        for (const [i, c] of a(this, Ye)) {
          if (a(this, Ye).delete(i), i === t)
            break;
          const f = a(this, Ne).get(c);
          f && (Ae(f.effect), a(this, Ne).delete(c));
        }
        for (const [i, c] of a(this, it)) {
          if (i === n || a(this, Yt).has(i)) continue;
          const f = () => {
            if (Array.from(a(this, Ye).values()).includes(i)) {
              var u = document.createDocumentFragment();
              _r(c, u), u.append(xt()), a(this, Ne).set(i, { effect: c, fragment: u });
            } else
              Ae(c);
            a(this, Yt).delete(i), a(this, it).delete(i);
          };
          a(this, $n) || !r ? (a(this, Yt).add(i), Kt(c, f, !1)) : f();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    C(this, Es, (t) => {
      a(this, Ye).delete(t);
      const n = Array.from(a(this, Ye).values());
      for (const [r, s] of a(this, Ne))
        n.includes(r) || (Ae(s.effect), a(this, Ne).delete(r));
    });
    this.anchor = t, A(this, $n, n);
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
    ), s = yi();
    if (n && !a(this, it).has(t) && !a(this, Ne).has(t))
      if (s) {
        var i = document.createDocumentFragment(), c = xt();
        i.append(c), a(this, Ne).set(t, {
          effect: je(() => n(c)),
          fragment: i
        });
      } else
        a(this, it).set(
          t,
          je(() => n(this.anchor))
        );
    if (a(this, Ye).set(r, t), s) {
      for (const [f, l] of a(this, it))
        f === t ? r.unskip_effect(l) : r.skip_effect(l);
      for (const [f, l] of a(this, Ne))
        f === t ? r.unskip_effect(l.effect) : r.skip_effect(l.effect);
      r.oncommit(a(this, Qn)), r.ondiscard(a(this, Es));
    } else
      a(this, Qn).call(this, r);
  }
}
Ye = new WeakMap(), it = new WeakMap(), Ne = new WeakMap(), Yt = new WeakMap(), $n = new WeakMap(), Qn = new WeakMap(), Es = new WeakMap();
function q(e, t, n = !1) {
  var r = new Fa(e), s = n ? mn : 0;
  function i(c, f) {
    r.ensure(c, f);
  }
  gr(() => {
    var c = !1;
    t((f, l = 0) => {
      c = !0, i(l, f);
    }), c || i(-1, null);
  }, s);
}
function on(e, t) {
  return t;
}
function Ha(e, t, n) {
  for (var r = [], s = t.length, i, c = t.length, f = 0; f < s; f++) {
    let _ = t[f];
    Kt(
      _,
      () => {
        if (i) {
          if (i.pending.delete(_), i.done.add(_), i.pending.size === 0) {
            var v = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            or(e, Ss(i.done)), v.delete(i), v.size === 0 && (e.outrogroups = null);
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
      _a(p), p.append(u), e.items.clear();
    }
    or(e, t, !l);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function or(e, t, n = !0) {
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
      _r(i, c);
    } else
      Ae(t[s], n);
  }
}
var Ur;
function an(e, t, n, r, s, i = null) {
  var c = e, f = /* @__PURE__ */ new Map(), l = (t & Xr) !== 0;
  if (l) {
    var u = (
      /** @type {Element} */
      e
    );
    c = u.appendChild(xt());
  }
  var p = null, _ = /* @__PURE__ */ la(() => {
    var W = n();
    return (
      /** @type {V[]} */
      Kr(W) ? W : W == null ? [] : Ss(W)
    );
  }), v, b = /* @__PURE__ */ new Map(), m = !0;
  function y(W) {
    (ee.effect.f & He) === 0 && (ee.pending.delete(W), ee.fallback = p, Ua(ee, v, c, t, r), p !== null && (v.length === 0 ? (p.f & ot) === 0 ? ws(p) : (p.f ^= ot, qn(p, null, c)) : Kt(p, () => {
      p = null;
    })));
  }
  function k(W) {
    ee.pending.delete(W);
  }
  var O = gr(() => {
    v = /** @type {V[]} */
    o(_);
    for (var W = v.length, le = /* @__PURE__ */ new Set(), te = (
      /** @type {Batch} */
      N
    ), ce = yi(), pe = 0; pe < W; pe += 1) {
      var Qe = v[pe], ut = r(Qe, pe), V = m ? null : f.get(ut);
      V ? (V.v && xn(V.v, Qe), V.i && xn(V.i, pe), ce && te.unskip_effect(V.e)) : (V = qa(
        f,
        m ? c : Ur ?? (Ur = xt()),
        Qe,
        ut,
        pe,
        s,
        t,
        n
      ), m || (V.e.f |= ot), f.set(ut, V)), le.add(ut);
    }
    if (W === 0 && i && !p && (m ? p = je(() => i(c)) : (p = je(() => i(Ur ?? (Ur = xt()))), p.f |= ot)), W > le.size && Po(), !m)
      if (b.set(te, le), ce) {
        for (const [Le, Xe] of f)
          le.has(Le) || te.skip_effect(Xe.e);
        te.oncommit(y), te.ondiscard(k);
      } else
        y(te);
    o(_);
  }), ee = { effect: O, items: f, pending: b, outrogroups: null, fallback: p };
  m = !1;
}
function On(e) {
  for (; e !== null && (e.f & $e) === 0; )
    e = e.next;
  return e;
}
function Ua(e, t, n, r, s) {
  var i = (r & Uo) !== 0, c = t.length, f = e.items, l = On(e.effect.first), u, p = null, _, v = [], b = [], m, y, k, O;
  if (i)
    for (O = 0; O < c; O += 1)
      m = t[O], y = s(m, O), k = /** @type {EachItem} */
      f.get(y).e, (k.f & ot) === 0 && (k.nodes?.a?.measure(), (_ ?? (_ = /* @__PURE__ */ new Set())).add(k));
  for (O = 0; O < c; O += 1) {
    if (m = t[O], y = s(m, O), k = /** @type {EachItem} */
    f.get(y).e, e.outrogroups !== null)
      for (const V of e.outrogroups)
        V.pending.delete(k), V.done.delete(k);
    if ((k.f & xe) !== 0 && (ws(k), i && (k.nodes?.a?.unfix(), (_ ?? (_ = /* @__PURE__ */ new Set())).delete(k))), (k.f & ot) !== 0)
      if (k.f ^= ot, k === l)
        qn(k, null, n);
      else {
        var ee = p ? p.next : l;
        k === e.effect.last && (e.effect.last = k.prev), k.prev && (k.prev.next = k.next), k.next && (k.next.prev = k.prev), Ct(e, p, k), Ct(e, k, ee), qn(k, ee, n), p = k, v = [], b = [], l = On(p.next);
        continue;
      }
    if (k !== l) {
      if (u !== void 0 && u.has(k)) {
        if (v.length < b.length) {
          var W = b[0], le;
          p = W.prev;
          var te = v[0], ce = v[v.length - 1];
          for (le = 0; le < v.length; le += 1)
            qn(v[le], W, n);
          for (le = 0; le < b.length; le += 1)
            u.delete(b[le]);
          Ct(e, te.prev, ce.next), Ct(e, p, te), Ct(e, ce, W), l = W, p = ce, O -= 1, v = [], b = [];
        } else
          u.delete(k), qn(k, l, n), Ct(e, k.prev, k.next), Ct(e, k, p === null ? e.effect.first : p.next), Ct(e, p, k), p = k;
        continue;
      }
      for (v = [], b = []; l !== null && l !== k; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(l), b.push(l), l = On(l.next);
      if (l === null)
        continue;
    }
    (k.f & ot) === 0 && v.push(k), p = k, l = On(k.next);
  }
  if (e.outrogroups !== null) {
    for (const V of e.outrogroups)
      V.pending.size === 0 && (or(e, Ss(V.done)), e.outrogroups?.delete(V));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var pe = [];
    if (u !== void 0)
      for (k of u)
        (k.f & xe) === 0 && pe.push(k);
    for (; l !== null; )
      (l.f & xe) === 0 && l !== e.fallback && pe.push(l), l = On(l.next);
    var Qe = pe.length;
    if (Qe > 0) {
      var ut = (r & Xr) !== 0 && c === 0 ? n : null;
      if (i) {
        for (O = 0; O < Qe; O += 1)
          pe[O].nodes?.a?.measure();
        for (O = 0; O < Qe; O += 1)
          pe[O].nodes?.a?.fix();
      }
      Ha(e, pe, ut);
    }
  }
  i && Gt(() => {
    if (_ !== void 0)
      for (k of _)
        k.nodes?.a?.apply();
  });
}
function qa(e, t, n, r, s, i, c, f) {
  var l = (c & Fo) !== 0 ? (c & qo) === 0 ? /* @__PURE__ */ ha(n, !1, !1) : Xt(n) : null, u = (c & Ho) !== 0 ? Xt(s) : null;
  return {
    v: l,
    i: u,
    e: je(() => (i(t, l ?? n, u ?? s, f), () => {
      e.delete(r);
    }))
  };
}
function qn(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, s = e.nodes.end, i = t && (t.f & ot) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Xn(r)
      );
      if (i.before(r), r === s)
        return;
      r = c;
    }
}
function Ct(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Va(e, t, n = !1, r = !1, s = !1, i = !1) {
  var c = e, f = "";
  if (n)
    var l = (
      /** @type {Element} */
      e
    );
  be(() => {
    var u = (
      /** @type {Effect} */
      D
    );
    if (f !== (f = t() ?? "")) {
      if (n) {
        u.nodes = null, l.innerHTML = /** @type {string} */
        f, f !== "" && Zt(
          /** @type {TemplateNode} */
          /* @__PURE__ */ at(l),
          /** @type {TemplateNode} */
          l.lastChild
        );
        return;
      }
      if (u.nodes !== null && (Ai(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), f !== "") {
        var p = r ? Yo : s ? Go : void 0, _ = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          dr(r ? "svg" : s ? "math" : "template", p)
        );
        _.innerHTML = /** @type {any} */
        f;
        var v = r || s ? _ : (
          /** @type {HTMLTemplateElement} */
          _.content
        );
        if (Zt(
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
function Ba(e, t) {
  Si(() => {
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
      const s = dr("style");
      s.id = t.hash, s.textContent = t.code, r.appendChild(s);
    }
  });
}
function Ya(e, t, n) {
  var r = e == null ? "" : "" + e;
  return r = r ? r + " " + t : t, r === "" ? null : r;
}
function Ga(e, t) {
  return e == null ? null : String(e);
}
function ln(e, t, n, r, s, i) {
  var c = (
    /** @type {any} */
    e[Js]
  );
  if (c !== n || c === void 0) {
    var f = Ya(n, r);
    f == null ? e.removeAttribute("class") : e.className = f, e[Js] = n;
  }
  return i;
}
function qr(e, t, n, r) {
  var s = (
    /** @type {any} */
    e[$s]
  );
  if (s !== t) {
    var i = Ga(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e[$s] = t;
  }
  return r;
}
const Wa = Symbol("is custom element"), Ka = Symbol("is html");
function as(e, t, n, r) {
  var s = Ja(e);
  s[t] !== (s[t] = n) && (t === "loading" && (e[Ao] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && $a(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Ja(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[cs] ?? (e[cs] = {
      [Wa]: e.nodeName.includes("-"),
      [Ka]: e.namespaceURI === Zr
    })
  );
}
var Vr = /* @__PURE__ */ new Map();
function $a(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Vr.get(t);
  if (n) return n;
  Vr.set(t, n = []);
  for (var r, s = e, i = Element.prototype; i !== s; ) {
    r = mo(s);
    for (var c in r)
      r[c].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      c !== "innerHTML" && c !== "textContent" && c !== "innerText" && n.push(c);
    s = Jr(s);
  }
  return n;
}
function Qa(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet();
  ma(e, "input", async (s) => {
    var i = s ? e.defaultValue : e.value;
    if (i = Bs(e) ? Ys(i) : i, n(i), N !== null && r.add(N), await Un(), i !== (i = t())) {
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
  Cs(t) == null && e.value && (n(Bs(e) ? Ys(e.value) : e.value), N !== null && r.add(N)), hr(() => {
    var s = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        N
      );
      if (r.has(i))
        return;
    }
    Bs(e) && s === Ys(e.value) || e.type === "date" && !s && !e.value || s !== e.value && (e.value = s ?? "");
  });
}
function Bs(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function Ys(e) {
  return e === "" ? null : +e;
}
function Gs(e, t) {
  return e === t || e?.[ls] === t;
}
function Br(e = {}, t, n, r) {
  var s = (
    /** @type {ComponentContext} */
    _e.r
  ), i = (
    /** @type {Effect} */
    D
  );
  return Si(() => {
    var c, f;
    return hr(() => {
      c = f, f = [], Cs(() => {
        Gs(n(...f), e) || (t(e, ...f), c && Gs(n(...c), e) && t(null, ...c));
      });
    }), () => {
      let l = i;
      for (; l !== s && l.parent !== null && l.parent.f & Ks; )
        l = l.parent;
      const u = () => {
        f && Gs(n(...f), e) && t(null, ...f);
      }, p = l.teardown;
      l.teardown = () => {
        u(), p?.();
      };
    };
  }), e;
}
function Xa(e) {
  _e === null && Co(), ps(() => {
    const t = Cs(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const Za = "5";
var Wr;
typeof window < "u" && ((Wr = window.__svelte ?? (window.__svelte = {})).v ?? (Wr.v = /* @__PURE__ */ new Set())).add(Za);
var el = /* @__PURE__ */ z('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), tl = /* @__PURE__ */ z('<div class="settings-assistant-grid svelte-beco3k"></div>'), nl = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), sl = /* @__PURE__ */ z('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), rl = /* @__PURE__ */ z('<div class="settings-history-list svelte-beco3k"></div>'), il = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k"> </p>'), ol = /* @__PURE__ */ z('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), al = /* @__PURE__ */ z(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), ll = /* @__PURE__ */ z('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), cl = /* @__PURE__ */ z('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), fl = /* @__PURE__ */ z('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), ul = /* @__PURE__ */ z('<div class="assistant-selector svelte-beco3k"></div>'), dl = /* @__PURE__ */ z('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), vl = /* @__PURE__ */ z('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), pl = /* @__PURE__ */ z('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), hl = /* @__PURE__ */ z('<div class="history-panel svelte-beco3k"><!></div>'), gl = /* @__PURE__ */ z(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), bl = /* @__PURE__ */ z(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), _l = /* @__PURE__ */ z('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), Yr = /* @__PURE__ */ Ms('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Gr = /* @__PURE__ */ Ms('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), kl = /* @__PURE__ */ z('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), ml = /* @__PURE__ */ z('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), wl = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), xl = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), yl = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), El = /* @__PURE__ */ z('<p class="stream-status svelte-beco3k"> </p>'), Sl = /* @__PURE__ */ z('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), Tl = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), Al = /* @__PURE__ */ z('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), Cl = /* @__PURE__ */ z("<!> <!> <!>", 1), Ml = /* @__PURE__ */ z('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), Pl = /* @__PURE__ */ z('<button class="suggestion-chip svelte-beco3k"> </button>'), Il = /* @__PURE__ */ z('<div class="suggestions svelte-beco3k"><!></div>'), Nl = /* @__PURE__ */ Ms('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Ll = /* @__PURE__ */ Ms('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Rl = /* @__PURE__ */ z('<div class="llm-chat-root svelte-beco3k"><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const Dl = {
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

	/* Input section */.input-section.svelte-beco3k {flex-shrink:0;padding:10px 14px;border-top:1px solid #e5e7eb;background:transparent;}.suggestions.svelte-beco3k {display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;justify-content:center;}.suggestion-loading.svelte-beco3k {font-size:12px;color:#9ca3af;}.suggestion-chip.svelte-beco3k {padding:5px 12px;font-size:12px;border-radius:16px;border:1px solid #e5e7eb;background:#f9fafb;color:#4b5563;cursor:pointer;transition:all 0.15s ease;white-space:nowrap;}.suggestion-chip.svelte-beco3k:hover {background:#eef2ff;border-color:#c7d2fe;color:#4338ca;}.input-row.svelte-beco3k {display:flex;gap:8px;align-items:flex-end;}.chat-input.svelte-beco3k {flex:1;resize:none;padding:10px 14px;border-radius:12px;border:1px solid #d1d5db;font-size:16px; /* 16px prevents iOS auto-zoom on focus */line-height:1.4;min-height:42px;max-height:120px;overflow-y:auto;transition:border-color 0.15s ease, box-shadow 0.15s ease;outline:none;touch-action:manipulation;}.chat-input.svelte-beco3k:focus {border-color:#6366f1;box-shadow:0 0 0 3px rgba(99, 102, 241, 0.1);}.chat-input.svelte-beco3k::placeholder {color:#9ca3af;}.send-btn.svelte-beco3k {display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:none;background:#4f46e5;color:#fff;cursor:pointer;transition:background 0.15s ease, opacity 0.15s ease;flex-shrink:0;}.send-btn.svelte-beco3k:hover:not(:disabled) {background:#4338ca;}.send-btn.svelte-beco3k:disabled {opacity:0.4;cursor:not-allowed;}

	/* ══════════════════════ Settings page ══════════════════════ */.settings-page.svelte-beco3k {max-width:680px;margin:0 auto;padding:36px 24px 60px;font-family:inherit;color:#111;}.settings-title.svelte-beco3k {font-size:1.35rem;font-weight:700;margin:0 0 32px;color:#111;}.settings-section.svelte-beco3k {background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:18px;display:flex;flex-direction:column;gap:14px;}.settings-section-title.svelte-beco3k {font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0;}.settings-section-desc.svelte-beco3k {font-size:0.875rem;color:#6b7280;margin:-8px 0 0;}

	/* Default assistant grid */.settings-assistant-grid.svelte-beco3k {display:flex;flex-wrap:wrap;gap:10px;}.settings-assistant-btn.svelte-beco3k {display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;transition:border-color 0.15s, background 0.15s;min-width:80px;}.settings-assistant-btn.selected.svelte-beco3k {border-color:#4f46e5;background:#eef2ff;}.settings-assistant-emoji.svelte-beco3k {font-size:1.5rem;}.settings-assistant-name.svelte-beco3k {font-size:0.8rem;font-weight:500;color:#374151;}

	/* Toggle rows */.settings-toggle.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;}.settings-toggle-info.svelte-beco3k {display:flex;flex-direction:column;gap:2px;}.settings-toggle-label.svelte-beco3k {font-size:0.9rem;font-weight:500;color:#111;}.settings-toggle-desc.svelte-beco3k {font-size:0.8rem;color:#6b7280;}.settings-switch.svelte-beco3k {flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#d1d5db;border:none;position:relative;cursor:pointer;transition:background 0.2s;outline:none;padding:0;}.settings-switch.svelte-beco3k::after {content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s;}.settings-switch.on.svelte-beco3k {background:#4f46e5;}.settings-switch.on.svelte-beco3k::after {transform:translateX(18px);}

	/* History list */.settings-history-list.svelte-beco3k {display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;}.settings-history-item.svelte-beco3k {display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:#f9fafb;}.settings-history-body.svelte-beco3k {flex:1;min-width:0;}.settings-history-title.svelte-beco3k {font-size:0.875rem;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.settings-history-meta.svelte-beco3k {font-size:0.75rem;color:#9ca3af;margin-top:2px;}.settings-history-delete.svelte-beco3k {flex-shrink:0;width:28px;height:28px;border:none;background:transparent;cursor:pointer;border-radius:6px;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 0.15s, color 0.15s;}.settings-history-delete.svelte-beco3k:hover {background:#fee2e2;color:#dc2626;}.settings-danger-btn.svelte-beco3k {align-self:flex-start;padding:7px 14px;border:1.5px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;font-size:0.85rem;font-weight:500;cursor:pointer;transition:background 0.15s;}.settings-danger-btn.svelte-beco3k:hover:not(:disabled) {background:#fee2e2;}.settings-danger-btn.svelte-beco3k:disabled {opacity:0.5;cursor:not-allowed;}

	/* About */.settings-about-row.svelte-beco3k {display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;}.settings-about-label.svelte-beco3k {color:#6b7280;}.settings-about-value.svelte-beco3k {font-weight:500;color:#111;}.settings-api-status.svelte-beco3k {font-size:0.85rem;font-weight:500;}.settings-api-status.online.svelte-beco3k {color:#16a34a;}.settings-api-status.offline.svelte-beco3k {color:#dc2626;}.settings-api-status.unknown.svelte-beco3k {color:#9ca3af;}.settings-link-btn.svelte-beco3k {align-self:flex-start;padding:6px 12px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;color:#4f46e5;font-size:0.8rem;cursor:pointer;transition:background 0.15s;}.settings-link-btn.svelte-beco3k:hover {background:#eef2ff;}`
};
function Ol(e, t) {
  ni(t, !0), Ba(e, Dl);
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
  let s = /* @__PURE__ */ P(Ge([])), i = /* @__PURE__ */ P(""), c = /* @__PURE__ */ P(!1), f = /* @__PURE__ */ P(""), l = /* @__PURE__ */ P(!1), u = /* @__PURE__ */ P(Ge(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), p = /* @__PURE__ */ P(""), _ = /* @__PURE__ */ P(void 0), v = /* @__PURE__ */ P(Ge([])), b = /* @__PURE__ */ P(!1), m = /* @__PURE__ */ P(void 0), y = /* @__PURE__ */ P(Ge([])), k = /* @__PURE__ */ P(null), O = /* @__PURE__ */ P(!1), ee = /* @__PURE__ */ P(null), W = /* @__PURE__ */ P("calc(100dvh - 102px)"), le = /* @__PURE__ */ P(null), te = /* @__PURE__ */ P(!1), ce = /* @__PURE__ */ P(null), pe = /* @__PURE__ */ P(0), Qe, ut, V = /* @__PURE__ */ P(null), Le = /* @__PURE__ */ P(Ge([])), Xe = /* @__PURE__ */ P(!1), es = /* @__PURE__ */ P(!1);
  const Tn = "https://geister-api.realmsgos.dev/", Fi = 36e4;
  let Hi = `${Tn}api/ask`, Ui = `${Tn}suggestions`, qi = `${Tn}api/personas/assistants`, An = `${Tn}api/conversations`;
  function Vi(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function kr(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function Bi(d) {
    !d || d.id === o(pe) || (h(pe, d.id, !0), h(i, d.message, !0), h(te, !0), d.autoSend ? setTimeout(() => void tn(), 150) : Un().then(Os));
  }
  function Yi() {
    if (kr(o(ce)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function Gi() {
    Qe = t.ctx.host?.pendingPrompt?.subscribe?.(Bi), ut = t.ctx.host?.focus?.subscribe?.((d) => {
      h(ce, d, !0);
    });
  }
  function mr(d, g) {
    if (g === 503 && d instanceof Error && d.message) {
      const w = d.message.toLowerCase();
      return w.includes("pod") || w.includes("llm backend") || w.includes("ollama") || w.includes("waking up") || w.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return g === 502 || g === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : g === 504 || g === 524 ? "The request timed out before the server could respond. Please try again." : g && g >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? mr(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function Wi(d) {
    const g = d.toLowerCase();
    return g.includes("llm backend") || g.includes("cannot reach ollama") || g.includes("ollama at");
  }
  function Cn() {
    h(u, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function wr() {
    h(u, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function Ki(d) {
    const g = d.toLowerCase();
    return g.includes("waking up") || g.includes("still starting");
  }
  function Ps() {
    h(f, ""), h(l, !1);
  }
  function ts(d, g) {
    d.trim() && (h(l, !0), h(f, ""));
    const w = { text: d, isUser: !1, ...g.trim() ? { thinking: g } : {} }, x = o(s)[o(s).length - 1];
    !x || x.isUser ? h(s, [...o(s), w], !0) : h(s, o(s).map((M, Ze) => Ze === o(s).length - 1 ? { ...M, ...w } : M), !0), Un().then(Rs);
  }
  function Ji(d, g) {
    const w = typeof d.type == "string" ? d.type : d.text ? "text" : "", x = typeof d.text == "string" ? d.text : "";
    if (w === "status" && x) {
      Cn(), h(f, x, !0);
      return;
    }
    if (w === "thinking" && x) {
      Cn(), g.thinking += x, ts(g.text, g.thinking);
      return;
    }
    x && (Cn(), g.text += x, ts(g.text, g.thinking));
  }
  let Mn = "", Et = "", xr, yr, St = /* @__PURE__ */ P(!1);
  const Is = !!t.ctx.sidebarPanel, Er = "llm_chat_prefs";
  function $i() {
    try {
      return JSON.parse(localStorage.getItem(Er) || "{}");
    } catch {
      return {};
    }
  }
  function Qi(d) {
    try {
      localStorage.setItem(Er, JSON.stringify(d));
    } catch {
    }
  }
  const Ns = $i();
  let en = /* @__PURE__ */ P(Ge(Ns.defaultAssistant || "")), Dt = /* @__PURE__ */ P(Ns.showSuggestions !== !1), Pn = /* @__PURE__ */ P(Ns.sharePageContext !== !1);
  ps(() => {
    Qi({
      defaultAssistant: o(en),
      showSuggestions: o(Dt),
      sharePageContext: o(Pn)
    });
  });
  let In = /* @__PURE__ */ P("unknown"), ns = /* @__PURE__ */ P(!1), Ls = /* @__PURE__ */ P(!1);
  async function Sr() {
    try {
      const d = await fetch(`${Tn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      h(In, d.ok ? "online" : "offline", !0);
    } catch {
      h(In, "offline");
    }
  }
  async function Xi() {
    if (!(!Et || !o(St))) {
      h(ns, !0);
      try {
        await Ds(), await Promise.all(o(Le).map((d) => fetch(`${An}/${d.conversation_id}`, { method: "DELETE" }))), h(Le, [], !0), h(s, [], !0), h(V, null), h(Ls, !0), setTimeout(
          () => {
            h(Ls, !1);
          },
          2e3
        );
      } catch {
      } finally {
        h(ns, !1);
      }
    }
  }
  Xa(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", g = t.ctx.config?.canisterId || "";
    Mn = d || g, xr = t.ctx.principal?.subscribe?.((x) => {
      Et = x || "";
    }), yr = t.ctx.isAuthenticated?.subscribe?.((x) => {
      h(St, x, !0);
    });
    const w = window.visualViewport;
    if (w) {
      const x = () => {
        h(W, `${w.height - w.offsetTop}px`);
      };
      x(), w.addEventListener("resize", x), w.addEventListener("scroll", x), window.__chatVpCleanup = () => {
        w.removeEventListener("resize", x), w.removeEventListener("scroll", x);
      };
    }
    if (Zi(), Gi(), await eo(), o(en) && o(y).length > 0) {
      const x = o(y).find((M) => M.id === o(en));
      x && h(k, x, !0);
    }
    !o(te) && o(Dt) && await ss(), Is || (Sr(), o(St) && await Ds());
  });
  function Zi() {
    try {
      const d = new URLSearchParams(window.location.search), g = d.get("explain");
      if (!g) return;
      const [w, x] = g.split(":");
      if (w === "codex" && x)
        h(te, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: x })).then((M) => {
          if (M.success) {
            const dt = (typeof M.response == "string" ? JSON.parse(M.response) : M.response).codex?.name || `codex_${x}`, he = `/extensions/codex_viewer/${x}`;
            h(le, x, !0), h(i, `Please explain this codex: [${dt}](${he})`), setTimeout(() => tn(), 300);
          }
        }).catch((M) => {
          console.error("Failed to fetch codex for explanation:", M), h(te, !1);
        });
      else if (w === "financial_statements") {
        h(te, !0);
        const M = d.get("context") || "";
        h(i, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${M}`), setTimeout(() => tn(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  ps(() => {
    o(s), Un().then(Rs);
  });
  function Rs() {
    o(_) && (o(_).scrollTop = o(_).scrollHeight);
  }
  async function eo() {
    if (!o(O)) {
      h(O, !0);
      try {
        const d = await fetch(qi, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        const g = await d.json();
        g.assistants && Array.isArray(g.assistants) && (h(y, g.assistants, !0), o(y).length > 0 && !o(k) && h(k, o(y)[0], !0));
      } catch (d) {
        console.error("Error fetching assistants:", d);
      } finally {
        h(O, !1);
      }
    }
  }
  async function ss() {
    if (!o(b)) {
      h(b, !0);
      try {
        const d = new URLSearchParams({
          user_principal: Et || "",
          realm_principal: Mn || "",
          persona: o(k)?.id || "ashoka"
        }), g = await fetch(`${Ui}?${d.toString()}`, {
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
  async function tn() {
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
    h(i, ""), h(c, !0), Ps(), h(f, o(u) ? "Thinking…" : "", !0);
    try {
      await ro();
      const g = r(), w = {
        question: d,
        realm_principal: Mn,
        user_principal: Et,
        stream: !0,
        verbosity: 1,
        persona: o(k)?.id || "ashoka",
        network: g,
        ...o(V) ? { conversation_id: o(V) } : {}
      };
      if (o(le))
        w.explain_codex_id = o(le), h(le, null);
      else {
        const ne = Vi(o(ce)?.uri);
        ne && (w.explain_codex_id = ne);
      }
      const x = kr(o(ce)?.uri);
      x && (w.explain_proposal_id = x, w.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(ce)?.label || "Proposal",
        proposalId: x
      }), o(ce) && (w.focus = {
        uri: o(ce).uri,
        label: o(ce).label
      });
      const M = await fetch(Hi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(w),
        signal: AbortSignal.timeout(Fi)
      });
      if (!M.ok) {
        let ne = "";
        try {
          const qe = await M.json();
          ne = typeof qe?.error == "string" ? qe.error : "";
        } catch {
        }
        throw ne ? Object.assign(new Error(ne), { httpStatus: M.status }) : Object.assign(new Error(`HTTP error! Status: ${M.status}`), { httpStatus: M.status });
      }
      const Ze = M.body?.getReader();
      if (!Ze) throw new Error("Response body is not readable");
      const dt = new TextDecoder(), he = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: ne, value: qe } = await Ze.read();
          if (ne) break;
          const Nn = dt.decode(qe, { stream: !0 }).split(`
`);
          for (const tt of Nn)
            if (tt.startsWith("data: ")) {
              const vt = tt.slice(6);
              if (vt === "[DONE]") continue;
              try {
                Ji(JSON.parse(vt), he);
              } catch {
                he.text += vt, ts(he.text, he.thinking);
              }
            } else tt.trim() && !tt.startsWith(":") && (he.text += tt, ts(he.text, he.thinking));
        }
      } finally {
        Ze.releaseLock();
      }
      const et = he.text, rs = he.thinking;
      et.trim() ? Wi(et) ? (h(p, "The AI backend is temporarily offline. Please try again in a few minutes."), wr()) : et.trim() && Cn() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? h(s, o(s).map((ne, qe) => qe === o(s).length - 1 ? { ...ne, text: "No response from LLM" } : ne), !0) : h(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), h(c, !1), Ps(), h(te, !1), await ss();
    } catch (g) {
      console.error("Error calling LLM:", g), h(p, mr(g, g?.httpStatus), !0), Ki(o(p)) && wr(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && h(s, o(s).slice(0, -1), !0);
    } finally {
      h(c, !1), Ps(), h(te, !1);
    }
  }
  function to() {
    h(p, "");
  }
  async function Ds() {
    if (!(!Et || !o(St))) {
      h(es, !0);
      try {
        const d = new URLSearchParams({
          user_principal: Et,
          realm_principal: Mn
        }), g = await fetch(`${An}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!g.ok) return;
        const w = await g.json();
        h(Le, (w.conversations || []).sort((x, M) => new Date(M.updated_at).getTime() - new Date(x.updated_at).getTime()), !0);
      } catch {
      } finally {
        h(es, !1);
      }
    }
  }
  async function Tr(d) {
    h(Xe, !1), h(s, [], !0), h(V, d.conversation_id, !0);
    const g = o(y).find((w) => w.id === d.persona);
    g && h(k, g, !0);
    try {
      const w = await fetch(`${An}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!w.ok) return;
      const x = await w.json();
      h(s, io(x.messages || []), !0), o(s).some((M) => !M.isUser) && Cn(), await Un(), Rs();
    } catch {
    }
  }
  async function no() {
    h(Xe, !1), h(s, [], !0), h(V, null), h(p, ""), h(v, [], !0), await ss();
  }
  async function Ar(d, g) {
    g.stopPropagation();
    try {
      await fetch(`${An}/${d}`, { method: "DELETE" }), h(Le, o(Le).filter((w) => w.conversation_id !== d), !0), o(V) === d && (h(s, [], !0), h(V, null));
    } catch {
    }
  }
  async function so() {
    h(Xe, !0), await Ds();
  }
  function Cr(d) {
    const g = new Date(d), x = (/* @__PURE__ */ new Date()).getTime() - g.getTime(), M = Math.floor(x / 864e5);
    return M === 0 ? g.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : M === 1 ? "Yesterday" : M < 7 ? g.toLocaleDateString([], { weekday: "short" }) : g.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function ro() {
    if (!(o(V) || !Et || !o(St)))
      try {
        const d = await fetch(An, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: Et,
            realm_principal: Mn,
            persona: o(k)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const g = await d.json();
          h(V, g.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function Mr(d, g) {
    const w = () => {
      h(ee, g, !0), setTimeout(
        () => {
          h(ee, null);
        },
        1500
      );
    }, x = () => {
      const M = document.createElement("textarea");
      M.value = d, M.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(M), M.focus(), M.select();
      try {
        document.execCommand("copy"), w();
      } catch {
      }
      document.body.removeChild(M);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(w).catch(x) : x();
  }
  function io(d) {
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
  function oo(d) {
    if (!d) return "";
    let g = d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return g = g.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), g;
  }
  function Os() {
    if (o(m)) {
      o(m).style.height = "auto";
      const d = Math.max(40, Math.min(o(m).scrollHeight, 120));
      o(m).style.height = d + "px";
    }
  }
  function ao(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), tn()), setTimeout(Os, 0);
  }
  function lo(d) {
    h(i, d, !0), tn();
  }
  function co(d) {
    h(k, d, !0), h(s, [], !0), ss();
  }
  ps(() => () => {
    xr?.(), yr?.(), Qe?.(), ut?.(), window.__chatVpCleanup?.();
  });
  var Pr = rn(), fo = zt(Pr);
  {
    var uo = (d) => {
      var g = al(), w = I(E(g), 2), x = I(E(w), 4);
      {
        var M = ($) => {
          var ke = tl();
          an(ke, 21, () => o(y), on, (T, j) => {
            var K = el(), B = E(K), X = E(B), re = I(B, 2), H = E(re);
            be(() => {
              ln(K, 1, `settings-assistant-btn ${o(en) === o(j).id || !o(en) && o(y)[0].id === o(j).id ? "selected" : ""}`, "svelte-beco3k"), me(X, o(j).emoji), me(H, o(j).name);
            }), se("click", K, () => h(en, o(j).id, !0)), S(T, K);
          }), S($, ke);
        }, Ze = ($) => {
          var ke = nl();
          S($, ke);
        };
        q(x, ($) => {
          o(y).length > 0 ? $(M) : $(Ze, -1);
        });
      }
      var dt = I(w, 2), he = I(E(dt), 2), et = I(E(he), 2), rs = I(he, 2), ne = I(E(rs), 2), qe = I(dt, 2);
      {
        var is = ($) => {
          var ke = ol(), T = I(E(ke), 2);
          {
            var j = (L) => {
              var G = rl();
              an(G, 21, () => o(Le), on, (J, fe) => {
                var nt = sl(), pt = E(nt), Ce = E(pt), Ve = E(Ce), ie = I(Ce, 2), ue = E(ie), ge = I(pt, 2);
                be(
                  (ht) => {
                    me(Ve, o(fe).title), me(ue, `${ht ?? ""} · ${o(fe).message_count ?? ""} message${o(fe).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Cr(o(fe).updated_at)]
                ), se("click", ge, (ht) => Ar(o(fe).conversation_id, ht)), S(J, nt);
              }), S(L, G);
            }, K = (L) => {
              var G = il(), J = E(G);
              be(() => me(J, o(es) ? "Loading…" : "No conversations yet.")), S(L, G);
            };
            q(T, (L) => {
              o(Le).length > 0 ? L(j) : L(K, -1);
            });
          }
          var B = I(T, 2), X = E(B);
          {
            var re = (L) => {
              var G = sn("✓ History cleared");
              S(L, G);
            }, H = (L) => {
              var G = sn("Clearing…");
              S(L, G);
            }, Y = (L) => {
              var G = sn("Clear all history");
              S(L, G);
            };
            q(X, (L) => {
              o(Ls) ? L(re) : o(ns) ? L(H, 1) : L(Y, -1);
            });
          }
          be(() => B.disabled = o(ns) || o(Le).length === 0), se("click", B, Xi), S($, ke);
        };
        q(qe, ($) => {
          o(St) && $(is);
        });
      }
      var Nn = I(qe, 2), tt = I(E(Nn), 4), vt = I(E(tt), 2), zs = E(vt);
      {
        var js = ($) => {
          var ke = sn("● Online");
          S($, ke);
        }, Ot = ($) => {
          var ke = sn("● Offline");
          S($, ke);
        }, Ln = ($) => {
          var ke = sn("Checking…");
          S($, ke);
        };
        q(zs, ($) => {
          o(In) === "online" ? $(js) : o(In) === "offline" ? $(Ot, 1) : $(Ln, -1);
        });
      }
      var Fs = I(tt, 2);
      be(() => {
        ln(et, 1, `settings-switch ${o(Dt) ? "on" : ""}`, "svelte-beco3k"), as(et, "aria-checked", o(Dt)), ln(ne, 1, `settings-switch ${o(Pn) ? "on" : ""}`, "svelte-beco3k"), as(ne, "aria-checked", o(Pn)), ln(vt, 1, `settings-api-status ${o(In) ?? ""}`, "svelte-beco3k");
      }), se("click", et, () => h(Dt, !o(Dt))), se("click", ne, () => h(Pn, !o(Pn))), se("click", Fs, Sr), S(d, g);
    }, vo = (d) => {
      var g = Rl(), w = E(g);
      {
        var x = (T) => {
          var j = ll(), K = E(j), B = I(K, 2);
          be(() => ln(B, 1, `toolbar-btn ${o(Xe) ? "active" : ""}`, "svelte-beco3k")), se("click", K, no), se("click", B, function(...X) {
            (o(Xe) ? () => h(Xe, !1) : so)?.apply(this, X);
          }), S(T, j);
        };
        q(w, (T) => {
          o(St) && T(x);
        });
      }
      var M = I(w, 2);
      {
        var Ze = (T) => {
          var j = cl(), K = E(j), B = E(K), X = I(K, 2);
          be(() => {
            as(K, "title", o(ce).uri), me(B, o(ce).label);
          }), se("click", X, Yi), S(T, j);
        };
        q(M, (T) => {
          Is && o(ce)?.label && T(Ze);
        });
      }
      var dt = I(M, 2);
      {
        var he = (T) => {
          var j = ul();
          an(j, 21, () => o(y), on, (K, B) => {
            var X = fl(), re = E(X), H = E(re), Y = I(re, 2), L = E(Y);
            be(() => {
              ln(X, 1, `assistant-btn ${o(k)?.id === o(B).id ? "active" : ""}`, "svelte-beco3k"), as(X, "title", o(B).description), me(H, o(B).emoji), me(L, o(B).name);
            }), se("click", X, () => co(o(B))), S(K, X);
          }), S(T, j);
        };
        q(dt, (T) => {
          o(y).length > 1 && T(he);
        });
      }
      var et = I(dt, 2);
      {
        var rs = (T) => {
          var j = hl(), K = E(j);
          {
            var B = (H) => {
              var Y = dl();
              S(H, Y);
            }, X = (H) => {
              var Y = vl();
              S(H, Y);
            }, re = (H) => {
              var Y = rn(), L = zt(Y);
              an(L, 17, () => o(Le), on, (G, J) => {
                var fe = pl(), nt = E(fe), pt = E(nt), Ce = E(pt), Ve = I(pt, 2), ie = E(Ve), ue = I(nt, 2);
                be(
                  (ge) => {
                    me(Ce, o(J).title), me(ie, `${ge ?? ""} · ${o(J).message_count ?? ""} msg${o(J).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Cr(o(J).updated_at)]
                ), se("click", fe, () => Tr(o(J))), se("keydown", fe, (ge) => ge.key === "Enter" && Tr(o(J))), se("click", ue, (ge) => Ar(o(J).conversation_id, ge)), S(G, fe);
              }), S(H, Y);
            };
            q(K, (H) => {
              o(es) ? H(B) : o(Le).length === 0 ? H(X, 1) : H(re, -1);
            });
          }
          S(T, j);
        };
        q(et, (T) => {
          o(Xe) && T(rs);
        });
      }
      var ne = I(et, 2), qe = E(ne);
      {
        var is = (T) => {
          var j = _l(), K = E(j), B = E(K);
          {
            var X = (H) => {
              var Y = gl();
              S(H, Y);
            }, re = (H) => {
              var Y = bl();
              S(H, Y);
            };
            q(B, (H) => {
              o(St) ? H(X) : H(re, -1);
            });
          }
          S(T, j);
        }, Nn = (T) => {
          var j = Cl(), K = zt(j);
          an(K, 17, () => o(s), on, (Y, L, G) => {
            var J = rn(), fe = zt(J);
            {
              var nt = (Ce) => {
                var Ve = kl(), ie = E(Ve), ue = E(ie), ge = E(ue);
                {
                  var ht = (At) => {
                    var Dn = Yr();
                    S(At, Dn);
                  }, Rn = (At) => {
                    var Dn = Gr();
                    S(At, Dn);
                  };
                  q(ge, (At) => {
                    o(ee) === G ? At(ht) : At(Rn, -1);
                  });
                }
                var st = I(ue, 2), Tt = E(st);
                be(() => me(Tt, o(L).text)), se("click", ue, () => Mr(o(L).text, G)), S(Ce, Ve);
              }, pt = (Ce) => {
                var Ve = wl(), ie = E(Ve), ue = E(ie), ge = E(ue);
                {
                  var ht = (ye) => {
                    var gt = ml(), Hs = I(E(gt), 2), ho = E(Hs);
                    be(() => me(ho, o(L).thinking)), S(ye, gt);
                  };
                  q(ge, (ye) => {
                    o(L).thinking && ye(ht);
                  });
                }
                var Rn = I(ge, 2);
                {
                  var st = (ye) => {
                    var gt = rn(), Hs = zt(gt);
                    Va(Hs, () => oo(o(L).text)), S(ye, gt);
                  };
                  q(Rn, (ye) => {
                    o(L).text && ye(st);
                  });
                }
                var Tt = I(ue, 2), At = E(Tt);
                {
                  var Dn = (ye) => {
                    var gt = Yr();
                    S(ye, gt);
                  }, po = (ye) => {
                    var gt = Gr();
                    S(ye, gt);
                  };
                  q(At, (ye) => {
                    o(ee) === G ? ye(Dn) : ye(po, -1);
                  });
                }
                se("click", Tt, () => Mr(o(L).text, G)), S(Ce, Ve);
              };
              q(fe, (Ce) => {
                o(L).isUser ? Ce(nt) : Ce(pt, -1);
              });
            }
            S(Y, J);
          });
          var B = I(K, 2);
          {
            var X = (Y) => {
              var L = Tl(), G = E(L), J = E(G);
              {
                var fe = (ie) => {
                  var ue = rn(), ge = zt(ue);
                  {
                    var ht = (st) => {
                      var Tt = xl();
                      S(st, Tt);
                    }, Rn = (st) => {
                      var Tt = yl();
                      S(st, Tt);
                    };
                    q(ge, (st) => {
                      o(te) ? st(ht) : !o(u) && !o(f) && st(Rn, 1);
                    });
                  }
                  S(ie, ue);
                };
                q(J, (ie) => {
                  o(l) || ie(fe);
                });
              }
              var nt = I(J, 2);
              {
                var pt = (ie) => {
                  var ue = El(), ge = E(ue);
                  be(() => me(ge, o(f))), S(ie, ue);
                };
                q(nt, (ie) => {
                  o(f) && ie(pt);
                });
              }
              var Ce = I(nt, 2);
              {
                var Ve = (ie) => {
                  var ue = Sl();
                  S(ie, ue);
                };
                q(Ce, (ie) => {
                  !o(l) && !o(f) && o(u) && !o(te) && ie(Ve);
                });
              }
              S(Y, L);
            };
            q(B, (Y) => {
              o(c) && (!o(l) || o(f)) && Y(X);
            });
          }
          var re = I(B, 2);
          {
            var H = (Y) => {
              var L = Al(), G = E(L), J = E(G), fe = I(G, 2);
              be(() => me(J, o(p))), se("click", fe, to), S(Y, L);
            };
            q(re, (Y) => {
              o(p) && Y(H);
            });
          }
          S(T, j);
        };
        q(qe, (T) => {
          o(s).length === 0 && !o(te) ? T(is) : T(Nn, -1);
        });
      }
      Br(ne, (T) => h(_, T), () => o(_));
      var tt = I(ne, 2), vt = E(tt);
      {
        var zs = (T) => {
          var j = Il(), K = E(j);
          {
            var B = (re) => {
              var H = Ml();
              S(re, H);
            }, X = (re) => {
              var H = rn(), Y = zt(H);
              an(Y, 17, () => o(v), on, (L, G) => {
                var J = Pl(), fe = E(J);
                be(() => me(fe, o(G))), se("click", J, () => lo(o(G))), S(L, J);
              }), S(re, H);
            };
            q(K, (re) => {
              o(b) ? re(B) : re(X, -1);
            });
          }
          S(T, j);
        };
        q(vt, (T) => {
          o(Dt) && (o(v).length > 0 || o(b)) && T(zs);
        });
      }
      var js = I(vt, 2), Ot = E(js);
      Br(Ot, (T) => h(m, T), () => o(m));
      var Ln = I(Ot, 2), Fs = E(Ln);
      {
        var $ = (T) => {
          var j = Nl();
          S(T, j);
        }, ke = (T) => {
          var j = Ll();
          S(T, j);
        };
        q(Fs, (T) => {
          o(c) ? T($) : T(ke, -1);
        });
      }
      be(
        (T) => {
          qr(g, `height: ${o(W) ?? ""}`), qr(ne, o(Xe) ? "display:none" : ""), Ln.disabled = T;
        },
        [() => o(c) || !o(i).trim()]
      ), se("keydown", Ot, ao), se("input", Ot, () => Os()), Qa(Ot, () => o(i), (T) => h(i, T)), se("click", Ln, () => tn()), S(d, g);
    };
    q(fo, (d) => {
      Is ? d(vo, -1) : d(uo);
    });
  }
  S(e, Pr), si();
}
Na(["click", "keydown", "input"]);
function Fl(e, t) {
  const n = Oa(Ol, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        ja(n);
      } catch {
      }
    }
  };
}
export {
  Fl as default
};
