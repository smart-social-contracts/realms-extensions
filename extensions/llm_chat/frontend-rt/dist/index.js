var wo = Object.defineProperty;
var zr = (e) => {
  throw TypeError(e);
};
var xo = (e, t, n) => t in e ? wo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ie = (e, t, n) => xo(e, typeof t != "symbol" ? t + "" : t, n), Bs = (e, t, n) => t.has(e) || zr("Cannot " + n);
var l = (e, t, n) => (Bs(e, t, "read from private field"), n ? n.call(e) : t.get(e)), C = (e, t, n) => t.has(e) ? zr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), A = (e, t, n, r) => (Bs(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), O = (e, t, n) => (Bs(e, t, "access private method"), n);
var Zr = Array.isArray, yo = Array.prototype.indexOf, ws = Array.prototype.includes, Ps = Array.from, Eo = Object.defineProperty, Wn = Object.getOwnPropertyDescriptor, So = Object.getOwnPropertyDescriptors, To = Object.prototype, Ao = Array.prototype, ei = Object.getPrototypeOf, jr = Object.isExtensible;
const Co = () => {
};
function Mo(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function ti() {
  var e, t, n = new Promise((r, s) => {
    e = r, t = s;
  });
  return { promise: n, resolve: e, reject: t };
}
const ce = 2, Sn = 4, Is = 8, ni = 1 << 24, $e = 16, Be = 32, kt = 64, Zs = 128, qe = 512, oe = 1024, ae = 2048, Ze = 4096, ke = 8192, Ve = 16384, Pn = 32768, er = 1 << 25, Tn = 65536, xs = 1 << 17, Po = 1 << 18, In = 1 << 19, Io = 1 << 20, rt = 1 << 25, Xt = 65536, ys = 1 << 21, bn = 1 << 22, Nt = 1 << 23, vs = Symbol("$state"), Lo = Symbol(""), ps = Symbol("attributes"), tr = Symbol("class"), nr = Symbol("style"), qn = Symbol("text"), hs = Symbol("form reset"), ns = new class extends Error {
  constructor() {
    super(...arguments);
    Ie(this, "name", "StaleReactionError");
    Ie(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function No(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Ro() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Do(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Oo(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function zo() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function jo(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Fo() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Ho() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Uo() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function qo() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Vo() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Bo = 1, Yo = 2, si = 4, Go = 8, Wo = 16, Ko = 1, Jo = 2, ie = Symbol("uninitialized"), ri = "http://www.w3.org/1999/xhtml", $o = "http://www.w3.org/2000/svg", Qo = "http://www.w3.org/1998/Math/MathML";
function Xo() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Zo() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function ii(e) {
  return e === this.v;
}
function ea(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function oi(e) {
  return !ea(e, this.v);
}
let _e = null;
function An(e) {
  _e = e;
}
function ai(e, t = !1, n) {
  _e = {
    p: _e,
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
function li(e) {
  var t = (
    /** @type {ComponentContext} */
    _e
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      Mi(r);
  }
  return t.i = !0, _e = t.p, /** @type {T} */
  {};
}
function ci() {
  return !0;
}
let qt = [];
function fi() {
  var e = qt;
  qt = [], Mo(e);
}
function It(e) {
  if (qt.length === 0 && !Kn) {
    var t = qt;
    queueMicrotask(() => {
      t === qt && fi();
    });
  }
  qt.push(e);
}
function ta() {
  for (; qt.length > 0; )
    fi();
}
function ui(e) {
  var t = R;
  if (t === null)
    return N.f |= Nt, e;
  if ((t.f & Pn) === 0 && (t.f & Sn) === 0)
    throw e;
  Lt(e, t);
}
function Lt(e, t) {
  if (!(t !== null && (t.f & Ve) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & Zs) !== 0) {
        if ((t.f & Pn) === 0)
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
const na = -7169;
function Z(e, t) {
  e.f = e.f & na | t;
}
function hr(e) {
  (e.f & qe) !== 0 || e.deps === null ? Z(e, oe) : Z(e, Ze);
}
function di(e) {
  if (e !== null)
    for (const t of e)
      (t.f & ce) === 0 || (t.f & Xt) === 0 || (t.f ^= Xt, di(
        /** @type {Derived} */
        t.deps
      ));
}
function vi(e, t, n) {
  (e.f & ae) !== 0 ? t.add(e) : (e.f & Ze) !== 0 && n.add(e), di(e.deps), Z(e, oe);
}
let Fr = !1;
function sa() {
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
            t[hs]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function ss(e) {
  var t = N, n = R;
  Ye(null), lt(null);
  try {
    return e();
  } finally {
    Ye(t), lt(n);
  }
}
function ra(e, t, n, r = n) {
  e.addEventListener(t, () => ss(n));
  const s = (
    /** @type {any} */
    e[hs]
  );
  s ? e[hs] = () => {
    s(), r(!0);
  } : e[hs] = () => r(!0), sa();
}
function ia(e) {
  let t = 0, n = en(0), r;
  return () => {
    kr() && (o(n), wr(() => (t === 0 && (r = Ls(() => e(() => Jn(n)))), t += 1, () => {
      It(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, Jn(n));
      });
    })));
  };
}
var oa = Tn | In;
function aa(e, t, n, r) {
  new la(e, t, n, r);
}
var je, pr, Fe, Yt, ye, He, me, Ne, ht, Gt, Mt, _n, Qn, Xn, gt, As, J, ca, fa, sr, ua, rr, gs, bs, ir, or;
class la {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, s) {
    C(this, J);
    /** @type {Boundary | null} */
    Ie(this, "parent");
    Ie(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Ie(this, "transform_error");
    /** @type {TemplateNode} */
    C(this, je);
    /** @type {TemplateNode | null} */
    C(this, pr, null);
    /** @type {BoundaryProps} */
    C(this, Fe);
    /** @type {((anchor: Node) => void)} */
    C(this, Yt);
    /** @type {Effect} */
    C(this, ye);
    /** @type {Effect | null} */
    C(this, He, null);
    /** @type {Effect | null} */
    C(this, me, null);
    /** @type {Effect | null} */
    C(this, Ne, null);
    /** @type {DocumentFragment | null} */
    C(this, ht, null);
    C(this, Gt, 0);
    C(this, Mt, 0);
    C(this, _n, !1);
    /** @type {Set<Effect>} */
    C(this, Qn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    C(this, Xn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    C(this, gt, null);
    C(this, As, ia(() => (A(this, gt, en(l(this, Gt))), () => {
      A(this, gt, null);
    })));
    A(this, je, t), A(this, Fe, n), A(this, Yt, (i) => {
      var a = (
        /** @type {Effect} */
        R
      );
      a.b = this, a.f |= Zs, r(i);
    }), this.parent = /** @type {Effect} */
    R.b, this.transform_error = s ?? this.parent?.transform_error ?? ((i) => i), A(this, ye, xr(() => {
      O(this, J, rr).call(this);
    }, oa));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    vi(t, l(this, Qn), l(this, Xn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!l(this, Fe).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    O(this, J, ir).call(this, t, n), A(this, Gt, l(this, Gt) + t), !(!l(this, gt) || l(this, _n)) && (A(this, _n, !0), It(() => {
      A(this, _n, !1), l(this, gt) && Cn(l(this, gt), l(this, Gt));
    }));
  }
  get_effect_pending() {
    return l(this, As).call(this), o(
      /** @type {Source<number>} */
      l(this, gt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!l(this, Fe).onerror && !l(this, Fe).failed)
      throw t;
    L?.is_fork ? (l(this, He) && L.skip_effect(l(this, He)), l(this, me) && L.skip_effect(l(this, me)), l(this, Ne) && L.skip_effect(l(this, Ne)), L.oncommit(() => {
      O(this, J, or).call(this, t);
    })) : O(this, J, or).call(this, t);
  }
}
je = new WeakMap(), pr = new WeakMap(), Fe = new WeakMap(), Yt = new WeakMap(), ye = new WeakMap(), He = new WeakMap(), me = new WeakMap(), Ne = new WeakMap(), ht = new WeakMap(), Gt = new WeakMap(), Mt = new WeakMap(), _n = new WeakMap(), Qn = new WeakMap(), Xn = new WeakMap(), gt = new WeakMap(), As = new WeakMap(), J = new WeakSet(), ca = function() {
  try {
    A(this, He, Ue(() => l(this, Yt).call(this, l(this, je))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
fa = function(t) {
  const n = l(this, Fe).failed, { reset: r, invoke_onerror: s } = O(this, J, sr).call(this, t);
  It(s), n && A(this, Ne, Ue(() => {
    n(
      l(this, je),
      () => t,
      () => r
    );
  }));
}, /**
 * Creates the `reset` function for a failed boundary, along with a function
 * that invokes `onerror` with it (if provided)
 * @param {unknown} error
 * @returns {{ reset: () => void, invoke_onerror: () => void }}
 */
sr = function(t) {
  var n = !1, r = !1;
  const s = () => {
    if (n) {
      Zo();
      return;
    }
    n = !0, r && Vo(), l(this, Ne) !== null && $t(l(this, Ne), () => {
      A(this, Ne, null);
    }), O(this, J, bs).call(this, () => {
      O(this, J, rr).call(this);
    });
  };
  return { reset: s, invoke_onerror: () => {
    try {
      r = !0, l(this, Fe).onerror?.(t, s), r = !1;
    } catch (a) {
      Lt(a, l(this, ye) && l(this, ye).parent);
    }
  } };
}, ua = function() {
  const t = l(this, Fe).pending;
  t && (this.is_pending = !0, A(this, me, Ue(() => t(l(this, je)))), It(() => {
    var n = A(this, ht, document.createDocumentFragment()), r = mt();
    n.append(r), A(this, He, O(this, J, bs).call(this, () => Ue(() => l(this, Yt).call(this, r)))), l(this, Mt) === 0 && (l(this, je).before(n), A(this, ht, null), $t(
      /** @type {Effect} */
      l(this, me),
      () => {
        A(this, me, null);
      }
    ), O(this, J, gs).call(
      this,
      /** @type {Batch} */
      L
    ));
  }));
}, rr = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), A(this, Mt, 0), A(this, Gt, 0), A(this, He, Ue(() => {
      l(this, Yt).call(this, l(this, je));
    })), l(this, Mt) > 0) {
      var t = A(this, ht, document.createDocumentFragment());
      Er(l(this, He), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        l(this, Fe).pending
      );
      A(this, me, Ue(() => n(l(this, je))));
    } else
      O(this, J, gs).call(
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
gs = function(t) {
  this.is_pending = !1, t.transfer_effects(l(this, Qn), l(this, Xn));
}, /**
 * @template T
 * @param {() => T} fn
 */
bs = function(t) {
  var n = R, r = N, s = _e;
  lt(l(this, ye)), Ye(l(this, ye)), An(l(this, ye).ctx);
  try {
    return Zt.ensure(), t();
  } catch (i) {
    return ui(i), null;
  } finally {
    lt(n), Ye(r), An(s);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
ir = function(t, n) {
  var r;
  if (!this.has_pending_snippet()) {
    this.parent && O(r = this.parent, J, ir).call(r, t, n);
    return;
  }
  A(this, Mt, l(this, Mt) + t), l(this, Mt) === 0 && (O(this, J, gs).call(this, n), l(this, me) && $t(l(this, me), () => {
    A(this, me, null);
  }), l(this, ht) && (l(this, je).before(l(this, ht)), A(this, ht, null)));
}, /**
 * @param {unknown} error
 */
or = function(t) {
  l(this, He) && (Te(l(this, He)), A(this, He, null)), l(this, me) && (Te(l(this, me)), A(this, me, null)), l(this, Ne) && (Te(l(this, Ne)), A(this, Ne, null));
  let n = l(this, Fe).failed;
  const r = (s) => {
    const { reset: i, invoke_onerror: a } = O(this, J, sr).call(this, s);
    a(), n && A(this, Ne, O(this, J, bs).call(this, () => {
      try {
        return Ue(() => {
          var c = (
            /** @type {Effect} */
            R
          );
          c.b = this, c.f |= Zs, n(
            l(this, je),
            () => s,
            () => i
          );
        });
      } catch (c) {
        return Lt(
          c,
          /** @type {Effect} */
          l(this, ye).parent
        ), null;
      }
    }));
  };
  It(() => {
    var s;
    try {
      s = this.transform_error(t);
    } catch (i) {
      Lt(i, l(this, ye) && l(this, ye).parent);
      return;
    }
    s !== null && typeof s == "object" && typeof /** @type {any} */
    s.then == "function" ? s.then(
      r,
      /** @param {unknown} e */
      (i) => Lt(i, l(this, ye) && l(this, ye).parent)
    ) : r(s);
  });
};
function da(e, t, n, r) {
  const s = hi;
  var i = e.filter((b) => !b.settled), a = t.map(s);
  if (n.length === 0 && i.length === 0) {
    r(a);
    return;
  }
  var c = (
    /** @type {Effect} */
    R
  ), f = va(), u = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((b) => b.promise)) : null;
  function p(b) {
    if ((c.f & Ve) === 0) {
      f();
      try {
        r([...a, ...b]);
      } catch (k) {
        Lt(k, c);
      }
      Es();
    }
  }
  var _ = pi();
  if (n.length === 0) {
    u.then(() => p([])).finally(_);
    return;
  }
  function v() {
    Promise.all(n.map((b) => /* @__PURE__ */ pa(b))).then(p).catch((b) => Lt(b, c)).finally(_);
  }
  u ? u.then(() => {
    f(), v(), Es();
  }) : v();
}
function va() {
  var e = (
    /** @type {Effect} */
    R
  ), t = N, n = _e, r = (
    /** @type {Batch} */
    L
  );
  return function(i = !0) {
    lt(e), Ye(t), An(n), i && (e.f & Ve) === 0 && (r?.activate(), r?.apply());
  };
}
function Es(e = !0) {
  lt(null), Ye(null), An(null), e && L?.deactivate();
}
function pi() {
  var e = (
    /** @type {Effect} */
    R
  ), t = e.b, n = (
    /** @type {Batch} */
    L
  ), r = !!t?.is_rendered();
  return t?.update_pending_count(1, n), n.increment(r, e), () => {
    t?.update_pending_count(-1, n), n.decrement(r, e);
  };
}
// @__NO_SIDE_EFFECTS__
function hi(e) {
  var t = ce | ae;
  return R !== null && (R.f |= In), {
    ctx: _e,
    deps: null,
    effects: null,
    equals: ii,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      ie
    ),
    wv: 0,
    parent: R,
    ac: null
  };
}
const Vn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function pa(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    R
  );
  r === null && Ro();
  var s = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = en(
    /** @type {V} */
    ie
  ), a = !N, c = /* @__PURE__ */ new Set();
  return Pa(() => {
    var f = (
      /** @type {Effect} */
      R
    ), u = ti();
    s = u.promise;
    try {
      Promise.resolve(e()).then(u.resolve, (b) => {
        b !== ns && u.reject(b);
      }).finally(Es);
    } catch (b) {
      u.reject(b), Es();
    }
    var p = (
      /** @type {Batch} */
      L
    );
    if (a) {
      if ((f.f & Pn) !== 0)
        var _ = pi();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        r.b?.is_rendered()
      )
        p.async_deriveds.get(f)?.reject(Vn);
      else
        for (const b of c.values())
          b.reject(Vn);
      c.add(u), p.async_deriveds.set(f, u);
    }
    const v = (b, k = void 0) => {
      _?.(), c.delete(u), k !== Vn && (p.activate(), k ? (i.f |= Nt, Cn(i, k)) : ((i.f & Nt) !== 0 && (i.f ^= Nt), Cn(i, b)), p.deactivate());
    };
    u.promise.then(v, (b) => v(null, b || "unknown"));
  }), Ca(() => {
    for (const f of c)
      f.reject(Vn);
  }), new Promise((f) => {
    function u(p) {
      function _() {
        p === s ? f(i) : u(s);
      }
      p.then(_, _);
    }
    u(s);
  });
}
// @__NO_SIDE_EFFECTS__
function ha(e) {
  const t = /* @__PURE__ */ hi(e);
  return t.equals = oi, t;
}
function ga(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Te(
        /** @type {Effect} */
        t[n]
      );
  }
}
function gr(e) {
  var t, n = R, r = e.parent;
  if (!Rt && r !== null && e.v !== ie && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (r.f & (Ve | ke)) !== 0)
    return Xo(), e.v;
  lt(r);
  try {
    e.f &= ~Xt, ga(e), t = Fi(e);
  } finally {
    lt(n);
  }
  return t;
}
function gi(e) {
  var t = gr(e);
  if (!e.equals(t) && (e.wv = zi(), (!L?.is_fork || e.deps === null) && (L !== null ? (L.capture(e, t, !0), ar?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    Z(e, oe);
    return;
  }
  Rt || (Qe !== null ? (kr() || L?.is_fork) && Qe.set(e, t) : hr(e));
}
function ba(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && ss(() => {
        t.ac.abort(ns), t.ac = null;
      }), t.fn !== null && (t.teardown = Co), $n(t, 0), yr(t));
}
function bi(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Mn(t);
}
let Ys = null, cn = null, L = null, ar = null, Qe = null, lr = null, Kn = !1, Gs = !1, gn = null, _s = null;
var Hr = 0;
let _a = 1;
var mn, Pt, Wt, kn, wn, xn, bt, yn, Ee, Zn, _t, We, nt, En, Kt, q, cr, Bn, fr, _i, mi, pn, ma, Yn;
const Cs = class Cs {
  constructor() {
    C(this, q);
    Ie(this, "id", _a++);
    /** True as soon as `#process` was called */
    C(this, mn, !1);
    Ie(this, "linked", !0);
    /** @type {Batch | null} */
    C(this, Pt, null);
    /** @type {Batch | null} */
    C(this, Wt, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    Ie(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    Ie(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    Ie(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    C(this, kn, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    C(this, wn, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    C(this, xn, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    C(this, bt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    C(this, yn, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    C(this, Ee, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    C(this, Zn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    C(this, _t, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    C(this, We, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    C(this, nt, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    C(this, En, /* @__PURE__ */ new Set());
    Ie(this, "is_fork", !1);
    C(this, Kt, !1);
    cn === null ? Ys = cn = this : (A(cn, Wt, this), A(this, Pt, cn)), cn = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    l(this, nt).has(t) || l(this, nt).set(t, { d: [], m: [] }), l(this, En).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (r) => this.schedule(r)) {
    var r = l(this, nt).get(t);
    if (r) {
      l(this, nt).delete(t);
      for (var s of r.d)
        Z(s, ae), n(s);
      for (s of r.m)
        Z(s, Ze), n(s);
    }
    l(this, En).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, r = !1) {
    t.v !== ie && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & Nt) === 0 && (this.current.set(t, [n, r]), Qe?.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    L = this;
  }
  deactivate() {
    L = null, Qe = null;
  }
  flush() {
    try {
      Gs = !0, L = this, O(this, q, Bn).call(this);
    } finally {
      Hr = 0, lr = null, gn = null, _s = null, Gs = !1, L = null, Qe = null, ot.clear();
    }
  }
  discard() {
    for (const t of l(this, wn)) t(this);
    l(this, wn).clear();
    for (const t of this.async_deriveds.values())
      t.reject(Vn);
    O(this, q, Yn).call(this), l(this, yn)?.resolve();
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
    if (A(this, xn, l(this, xn) + 1), t) {
      let r = l(this, bt).get(n) ?? 0;
      l(this, bt).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, n) {
    if (A(this, xn, l(this, xn) - 1), t) {
      let r = l(this, bt).get(n) ?? 0;
      r === 1 ? l(this, bt).delete(n) : l(this, bt).set(n, r - 1);
    }
    l(this, Kt) || (A(this, Kt, !0), It(() => {
      A(this, Kt, !1), this.linked && this.flush();
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
      l(this, We).add(r);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    l(this, kn).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    l(this, wn).add(t);
  }
  settled() {
    return (l(this, yn) ?? A(this, yn, ti())).promise;
  }
  static ensure() {
    if (L === null) {
      const t = L = new Cs();
      !Gs && !Kn && It(() => {
        l(t, mn) || t.flush();
      });
    }
    return L;
  }
  apply() {
    {
      Qe = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    if (lr = t, t.b?.is_pending && (t.f & (Sn | Is | ni)) !== 0 && (t.f & Pn) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var r = n.f;
      if (gn !== null && n === R && (N === null || (N.f & ce) === 0))
        return;
      if ((r & (kt | Be)) !== 0) {
        if ((r & oe) === 0)
          return;
        n.f ^= oe;
      }
    }
    l(this, Ee).push(n);
  }
};
mn = new WeakMap(), Pt = new WeakMap(), Wt = new WeakMap(), kn = new WeakMap(), wn = new WeakMap(), xn = new WeakMap(), bt = new WeakMap(), yn = new WeakMap(), Ee = new WeakMap(), Zn = new WeakMap(), _t = new WeakMap(), We = new WeakMap(), nt = new WeakMap(), En = new WeakMap(), Kt = new WeakMap(), q = new WeakSet(), cr = function() {
  if (this.is_fork) return !0;
  for (const r of l(this, bt).keys()) {
    for (var t = r, n = !1; t.parent !== null; ) {
      if (l(this, nt).has(t)) {
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
  var f, u, p;
  A(this, mn, !0), Hr++ > 1e3 && (O(this, q, Yn).call(this), wa());
  for (const _ of l(this, _t))
    l(this, We).delete(_), Z(_, ae), this.schedule(_);
  for (const _ of l(this, We))
    Z(_, Ze), this.schedule(_);
  const t = l(this, Ee);
  A(this, Ee, []), this.apply();
  var n = gn = [], r = [], s = _s = [];
  for (const _ of t)
    try {
      O(this, q, fr).call(this, _, n, r);
    } catch (v) {
      throw xi(_), O(this, q, cr).call(this) || this.discard(), v;
    }
  if (L = null, s.length > 0) {
    var i = Cs.ensure();
    for (const _ of s)
      i.schedule(_);
  }
  if (gn = null, _s = null, O(this, q, cr).call(this)) {
    O(this, q, pn).call(this, r), O(this, q, pn).call(this, n);
    for (const [_, v] of l(this, nt))
      wi(_, v);
    s.length > 0 && /** @type {unknown} */
    O(f = L, q, Bn).call(f);
    return;
  }
  const a = O(this, q, _i).call(this);
  if (a) {
    O(this, q, pn).call(this, r), O(this, q, pn).call(this, n), O(u = a, q, mi).call(u, this);
    return;
  }
  l(this, _t).clear(), l(this, We).clear();
  for (const _ of l(this, kn)) _(this);
  l(this, kn).clear(), ar = this, Ur(r), Ur(n), ar = null, l(this, yn)?.resolve();
  var c = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    L
  );
  if (l(this, xn) === 0 && (l(this, Ee).length === 0 || c !== null) && O(this, q, Yn).call(this), l(this, Ee).length > 0)
    if (c !== null) {
      const _ = c;
      l(_, Ee).push(...l(this, Ee).filter((v) => !l(_, Ee).includes(v)));
    } else
      c = this;
  c !== null && (ot.clear(), O(p = c, q, Bn).call(p));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
fr = function(t, n, r) {
  t.f ^= oe;
  for (var s = t.first; s !== null; ) {
    var i = s.f, a = (i & (Be | kt)) !== 0, c = a && (i & oe) !== 0, f = c || (i & ke) !== 0 || l(this, nt).has(s);
    if (!f && s.fn !== null) {
      a ? s.f ^= oe : (i & Sn) !== 0 ? n.push(s) : is(s) && ((i & $e) !== 0 && l(this, We).add(s), Mn(s));
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
}, _i = function() {
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
mi = function(t) {
  var r;
  for (const [s, i] of t.current)
    !this.previous.has(s) && t.previous.has(s) && this.previous.set(s, t.previous.get(s)), this.current.set(s, i);
  for (const [s, i] of t.async_deriveds) {
    const a = this.async_deriveds.get(s);
    a && i.promise.then(a.resolve).catch(a.reject);
  }
  t.async_deriveds.clear(), this.transfer_effects(l(t, _t), l(t, We));
  const n = (s) => {
    var i = s.reactions;
    if (i !== null && !((s.f & ce) !== 0 && (s.f & (ae | Ze)) === 0))
      for (const f of i) {
        var a = f.f;
        if ((a & ce) !== 0)
          n(
            /** @type {Derived} */
            f
          );
        else {
          var c = (
            /** @type {Effect} */
            f
          );
          a & (bn | $e) && !this.async_deriveds.has(c) && (l(this, We).delete(c), Z(c, ae), this.schedule(c));
        }
      }
  };
  for (const s of this.current.keys())
    n(s);
  this.oncommit(() => t.discard()), O(r = t, q, Yn).call(r), L = this, O(this, q, Bn).call(this);
}, /**
 * @param {Effect[]} effects
 */
pn = function(t) {
  for (var n = 0; n < t.length; n += 1)
    vi(t[n], l(this, _t), l(this, We));
}, ma = function() {
  var _;
  for (let v = Ys; v !== null; v = l(v, Wt)) {
    var t = v.id < this.id, n = [];
    for (const [b, [k, S]] of this.current) {
      if (v.current.has(b)) {
        var r = (
          /** @type {[any, boolean]} */
          v.current.get(b)[0]
        );
        if (t && k !== r)
          v.current.set(b, [k, S]);
        else
          continue;
      }
      n.push(b);
    }
    if (t)
      for (const [b, k] of this.async_deriveds) {
        const S = v.async_deriveds.get(b);
        S && k.promise.then(S.resolve).catch(S.reject);
      }
    var s = [...v.current.keys()].filter(
      (b) => !/** @type {[any, boolean]} */
      v.current.get(b)[1]
    );
    if (!(!l(v, mn) || s.length === 0)) {
      var i = s.filter((b) => !this.current.has(b));
      if (i.length === 0)
        t && v.discard();
      else if (n.length > 0) {
        if (t)
          for (const b of l(this, En))
            v.unskip_effect(b, (k) => {
              var S;
              (k.f & ($e | bn)) !== 0 ? v.schedule(k) : O(S = v, q, pn).call(S, [k]);
            });
        v.activate();
        var a = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
        for (var f of n)
          ki(f, i, a, c);
        c = /* @__PURE__ */ new Map();
        var u = [...v.current].filter(([b, k]) => {
          const S = this.current.get(b);
          return S ? S[0] !== k[0] || S[1] !== k[1] : !0;
        }).map(([b]) => b);
        if (u.length > 0)
          for (const b of l(this, Zn))
            (b.f & (Ve | ke | xs)) === 0 && br(b, u, c) && ((b.f & (bn | $e)) !== 0 ? (Z(b, ae), v.schedule(b)) : l(v, _t).add(b));
        if (l(v, Ee).length > 0 && !l(v, Kt)) {
          v.apply();
          for (var p of l(v, Ee))
            O(_ = v, q, fr).call(_, p, [], []);
          A(v, Ee, []);
        }
        v.deactivate();
      }
    }
  }
}, Yn = function() {
  if (this.linked) {
    var t = l(this, Pt), n = l(this, Wt);
    t === null ? Ys = n : A(t, Wt, n), n === null ? cn = t : A(n, Pt, t), this.linked = !1;
  }
};
let Zt = Cs;
function ka(e) {
  var t = Kn;
  Kn = !0;
  try {
    for (var n; ; ) {
      if (ta(), L === null)
        return (
          /** @type {T} */
          n
        );
      L.flush();
    }
  } finally {
    Kn = t;
  }
}
function wa() {
  try {
    Fo();
  } catch (e) {
    Lt(e, lr);
  }
}
let pt = null;
function Ur(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (Ve | ke)) === 0 && is(r) && (pt = /* @__PURE__ */ new Set(), Mn(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Ni(r), pt?.size > 0)) {
        ot.clear();
        for (const s of pt) {
          if ((s.f & (Ve | ke)) !== 0) continue;
          const i = [s];
          let a = s.parent;
          for (; a !== null; )
            pt.has(a) && (pt.delete(a), i.push(a)), a = a.parent;
          for (let c = i.length - 1; c >= 0; c--) {
            const f = i[c];
            (f.f & (Ve | ke)) === 0 && Mn(f);
          }
        }
        pt.clear();
      }
    }
    pt = null;
  }
}
function ki(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const s of e.reactions) {
      const i = s.f;
      (i & ce) !== 0 ? ki(
        /** @type {Derived} */
        s,
        t,
        n,
        r
      ) : (i & (bn | $e)) !== 0 && (i & ae) === 0 && br(s, t, r) && (Z(s, ae), _r(
        /** @type {Effect} */
        s
      ));
    }
}
function br(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const s of e.deps) {
      if (ws.call(t, s))
        return !0;
      if ((s.f & ce) !== 0 && br(
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
function _r(e) {
  L.schedule(e);
}
function wi(e, t) {
  if (!((e.f & Be) !== 0 && (e.f & oe) !== 0)) {
    (e.f & ae) !== 0 ? t.d.push(e) : (e.f & Ze) !== 0 && t.m.push(e), Z(e, oe);
    for (var n = e.first; n !== null; )
      wi(n, t), n = n.next;
  }
}
function xi(e) {
  Z(e, oe);
  for (var t = e.first; t !== null; )
    xi(t), t = t.next;
}
let Ss = /* @__PURE__ */ new Set();
const ot = /* @__PURE__ */ new Map();
let yi = !1;
function en(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: ii,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function P(e, t) {
  const n = en(e);
  return La(n), n;
}
// @__NO_SIDE_EFFECTS__
function xa(e, t = !1, n = !0) {
  const r = en(e);
  return t || (r.equals = oi), r;
}
function h(e, t, n = !1) {
  N !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Xe || (N.f & xs) !== 0) && ci() && (N.f & (ce | $e | bn | xs)) !== 0 && (at === null || !at.has(e)) && qo();
  let r = n ? Je(t) : t;
  return Cn(e, r, _s);
}
function Cn(e, t, n = null) {
  if (!e.equals(t)) {
    Rt ? ot.set(e, t) : ot.has(e) || ot.set(e, e.v);
    var r = Zt.ensure();
    if (r.capture(e, t), (e.f & ce) !== 0) {
      const s = (
        /** @type {Derived} */
        e
      );
      (e.f & ae) !== 0 && gr(s), Qe === null && hr(s);
    }
    e.wv = zi(), Ei(e, ae, n), R !== null && (R.f & oe) !== 0 && (R.f & (Be | kt)) === 0 && (ze === null ? Na([e]) : ze.push(e)), !r.is_fork && Ss.size > 0 && !yi && ya();
  }
  return t;
}
function ya() {
  yi = !1;
  for (const e of Ss) {
    (e.f & oe) !== 0 && Z(e, Ze);
    let t;
    try {
      t = is(e);
    } catch {
      t = !0;
    }
    t && Mn(e);
  }
  Ss.clear();
}
function Jn(e) {
  h(e, e.v + 1);
}
function Ei(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var s = r.length, i = 0; i < s; i++) {
      var a = r[i], c = a.f, f = (c & ae) === 0;
      if (f && Z(a, t), (c & xs) !== 0)
        Ss.add(
          /** @type {Effect} */
          a
        );
      else if ((c & ce) !== 0) {
        var u = (
          /** @type {Derived} */
          a
        );
        Qe?.delete(u), (c & Xt) === 0 && (c & qe && (R === null || (R.f & ys) === 0) && (a.f |= Xt), Ei(u, Ze, n));
      } else if (f) {
        var p = (
          /** @type {Effect} */
          a
        );
        (c & $e) !== 0 && pt !== null && pt.add(p), n !== null ? n.push(p) : _r(p);
      }
    }
}
function Je(e) {
  if (typeof e != "object" || e === null || vs in e)
    return e;
  const t = ei(e);
  if (t !== To && t !== Ao)
    return e;
  var n = /* @__PURE__ */ new Map(), r = Zr(e), s = /* @__PURE__ */ P(0), i = Qt, a = (c) => {
    if (Qt === i)
      return c();
    var f = N, u = Qt;
    Ye(null), Br(i);
    var p = c();
    return Ye(f), Br(u), p;
  };
  return r && n.set("length", /* @__PURE__ */ P(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(c, f, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && Ho();
        var p = n.get(f);
        return p === void 0 ? a(() => {
          var _ = /* @__PURE__ */ P(u.value);
          return n.set(f, _), _;
        }) : h(p, u.value, !0), !0;
      },
      deleteProperty(c, f) {
        var u = n.get(f);
        if (u === void 0) {
          if (f in c) {
            const p = a(() => /* @__PURE__ */ P(ie));
            n.set(f, p), Jn(s);
          }
        } else
          h(u, ie), Jn(s);
        return !0;
      },
      get(c, f, u) {
        if (f === vs)
          return e;
        var p = n.get(f), _ = f in c;
        if (p === void 0 && (!_ || Wn(c, f)?.writable) && (p = a(() => {
          var b = Je(_ ? c[f] : ie), k = /* @__PURE__ */ P(b);
          return k;
        }), n.set(f, p)), p !== void 0) {
          var v = o(p);
          return v === ie ? void 0 : v;
        }
        return Reflect.get(c, f, u);
      },
      getOwnPropertyDescriptor(c, f) {
        var u = Reflect.getOwnPropertyDescriptor(c, f);
        if (u && "value" in u) {
          var p = n.get(f);
          p && (u.value = o(p));
        } else if (u === void 0) {
          var _ = n.get(f), v = _?.v;
          if (_ !== void 0 && v !== ie)
            return {
              enumerable: !0,
              configurable: !0,
              value: v,
              writable: !0
            };
        }
        return u;
      },
      has(c, f) {
        if (f === vs)
          return !0;
        var u = n.get(f), p = u !== void 0 && u.v !== ie || Reflect.has(c, f);
        if (u !== void 0 || R !== null && (!p || Wn(c, f)?.writable)) {
          u === void 0 && (u = a(() => {
            var v = p ? Je(c[f]) : ie, b = /* @__PURE__ */ P(v);
            return b;
          }), n.set(f, u));
          var _ = o(u);
          if (_ === ie)
            return !1;
        }
        return p;
      },
      set(c, f, u, p) {
        var _ = n.get(f), v = f in c;
        if (r && f === "length")
          for (var b = u; b < /** @type {Source<number>} */
          _.v; b += 1) {
            var k = n.get(b + "");
            k !== void 0 ? h(k, ie) : b in c && (k = a(() => /* @__PURE__ */ P(ie)), n.set(b + "", k));
          }
        if (_ === void 0)
          (!v || Wn(c, f)?.writable) && (_ = a(() => /* @__PURE__ */ P(void 0)), h(_, Je(u)), n.set(f, _));
        else {
          v = _.v !== ie;
          var S = a(() => Je(u));
          h(_, S);
        }
        var m = Reflect.getOwnPropertyDescriptor(c, f);
        if (m?.set && m.set.call(p, u), !v) {
          if (r && typeof f == "string") {
            var D = (
              /** @type {Source<number>} */
              n.get("length")
            ), ee = Number(f);
            Number.isInteger(ee) && ee >= D.v && h(D, ee + 1);
          }
          Jn(s);
        }
        return !0;
      },
      ownKeys(c) {
        o(s);
        var f = Reflect.ownKeys(c).filter((_) => {
          var v = n.get(_);
          return v === void 0 || v.v !== ie;
        });
        for (var [u, p] of n)
          p.v !== ie && !(u in c) && f.push(u);
        return f;
      },
      setPrototypeOf() {
        Uo();
      }
    }
  );
}
var qr, Si, Ti, Ai;
function Ea() {
  if (qr === void 0) {
    qr = window, Si = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Ti = Wn(t, "firstChild").get, Ai = Wn(t, "nextSibling").get, jr(e) && (e[tr] = void 0, e[ps] = null, e[nr] = void 0, e.__e = void 0), jr(n) && (n[qn] = void 0);
  }
}
function mt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function it(e) {
  return (
    /** @type {TemplateNode | null} */
    Ti.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function rs(e) {
  return (
    /** @type {TemplateNode | null} */
    Ai.call(e)
  );
}
function E(e, t) {
  return /* @__PURE__ */ it(e);
}
function Ht(e, t = !1) {
  {
    var n = /* @__PURE__ */ it(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ rs(n) : n;
  }
}
function I(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ rs(r);
  return r;
}
function Sa(e) {
  e.textContent = "";
}
function Ci() {
  return !1;
}
function mr(e, t, n) {
  return t == null || t === ri ? (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElement(e)
  ) : (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t, e)
  );
}
function Ta(e) {
  R === null && (N === null && jo(), zo()), Rt && Oo();
}
function Aa(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function wt(e, t) {
  var n = R;
  n !== null && (n.f & ke) !== 0 && (e |= ke);
  var r = {
    ctx: _e,
    deps: null,
    nodes: null,
    f: e | ae | qe,
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
  if ((e & Sn) !== 0)
    gn !== null ? gn.push(r) : Zt.ensure().schedule(r);
  else if (t !== null) {
    try {
      Mn(r);
    } catch (a) {
      throw Te(r), a;
    }
    s.deps === null && s.teardown === null && s.nodes === null && s.first === s.last && // either `null`, or a singular child
    (s.f & In) === 0 && (s = s.first, (e & $e) !== 0 && (e & Tn) !== 0 && s !== null && (s.f |= Tn));
  }
  if (s !== null && (s.parent = n, n !== null && Aa(s, n), N !== null && (N.f & ce) !== 0 && (e & kt) === 0)) {
    var i = (
      /** @type {Derived} */
      N
    );
    (i.effects ?? (i.effects = [])).push(s);
  }
  return r;
}
function kr() {
  return N !== null && !Xe;
}
function Ca(e) {
  const t = wt(Is, null);
  return Z(t, oe), t.teardown = e, t;
}
function ms(e) {
  Ta();
  var t = (
    /** @type {Effect} */
    R.f
  ), n = !N && (t & Be) !== 0 && _e !== null && !_e.i;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      _e
    );
    (r.e ?? (r.e = [])).push(e);
  } else
    return Mi(e);
}
function Mi(e) {
  return wt(Sn | Io, e);
}
function Ma(e) {
  Zt.ensure();
  const t = wt(kt | In, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? $t(t, () => {
      Te(t), r(void 0);
    }) : (Te(t), r(void 0));
  });
}
function Pi(e) {
  return wt(Sn, e);
}
function Pa(e) {
  return wt(bn | In, e);
}
function wr(e, t = 0) {
  return wt(Is | t, e);
}
function be(e, t = [], n = [], r = []) {
  da(r, t, n, (s) => {
    wt(Is, () => {
      e(...s.map(o));
    });
  });
}
function xr(e, t = 0) {
  var n = wt($e | t, e);
  return n;
}
function Ue(e) {
  return wt(Be | In, e);
}
function Ii(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Rt, r = N;
    Vr(!0), Ye(null);
    try {
      t.call(null);
    } finally {
      Vr(n), Ye(r);
    }
  }
}
function yr(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const s = n.ac;
    s !== null && ss(() => {
      s.abort(ns);
    });
    var r = n.next;
    (n.f & kt) !== 0 ? n.parent = null : Te(n, t), n = r;
  }
}
function Ia(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Be) === 0 && Te(t), t = n;
  }
}
function Te(e, t = !0) {
  var n = !1;
  (t || (e.f & Po) !== 0) && e.nodes !== null && e.nodes.end !== null && (Li(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), e.f |= er, yr(e, t && !n), $n(e, 0);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const i of r)
      i.stop();
  Ii(e), e.f ^= er, e.f |= Ve;
  var s = e.parent;
  s !== null && s.first !== null && Ni(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Li(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ rs(e);
    e.remove(), e = n;
  }
}
function Ni(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function $t(e, t, n = !0) {
  var r = [];
  Ri(e, r, !0);
  var s = () => {
    n && Te(e), t && t();
  }, i = r.length;
  if (i > 0) {
    var a = () => --i || s();
    for (var c of r)
      c.out(a);
  } else
    s();
}
function Ri(e, t, n) {
  if ((e.f & ke) === 0) {
    e.f ^= ke;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const c of r)
        (c.is_global || n) && t.push(c);
    for (var s = e.first; s !== null; ) {
      var i = s.next;
      if ((s.f & kt) === 0) {
        var a = (s.f & Tn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (s.f & Be) !== 0 && (e.f & $e) !== 0;
        Ri(s, t, a ? n : !1);
      }
      s = i;
    }
  }
}
function Ts(e) {
  Di(e, !0);
}
function Di(e, t) {
  if ((e.f & ke) !== 0) {
    e.f ^= ke, (e.f & oe) === 0 && (Z(e, ae), Zt.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, s = (n.f & Tn) !== 0 || (n.f & Be) !== 0;
      Di(n, s ? t : !1), n = r;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const a of i)
        (a.is_global || t) && a.in();
  }
}
function Er(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var s = n === r ? null : /* @__PURE__ */ rs(n);
      t.append(n), n = s;
    }
}
let ks = !1, Rt = !1;
function Vr(e) {
  Rt = e;
}
let N = null, Xe = !1;
function Ye(e) {
  N = e;
}
let R = null;
function lt(e) {
  R = e;
}
let at = null;
function La(e) {
  N !== null && (at ?? (at = /* @__PURE__ */ new Set())).add(e);
}
let Se = null, Le = 0, ze = null;
function Na(e) {
  ze = e;
}
let Oi = 1, Vt = 0, Qt = Vt;
function Br(e) {
  Qt = e;
}
function zi() {
  return ++Oi;
}
function is(e) {
  var t = e.f;
  if ((t & ae) !== 0)
    return !0;
  if (t & ce && (e.f &= ~Xt), (t & Ze) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, s = 0; s < r; s++) {
      var i = n[s];
      if (is(
        /** @type {Derived} */
        i
      ) && gi(
        /** @type {Derived} */
        i
      ), i.wv > e.wv)
        return !0;
    }
    (t & qe) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Qe === null && Z(e, oe);
  }
  return !1;
}
function ji(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(at !== null && at.has(e)))
    for (var s = 0; s < r.length; s++) {
      var i = r[s];
      (i.f & ce) !== 0 ? ji(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? Z(i, ae) : (i.f & oe) !== 0 && Z(i, Ze), _r(
        /** @type {Effect} */
        i
      ));
    }
}
function Fi(e) {
  var S;
  var t = Se, n = Le, r = ze, s = N, i = at, a = _e, c = Xe, f = Qt, u = e.f;
  Se = /** @type {null | Value[]} */
  null, Le = 0, ze = null, N = (u & (Be | kt)) === 0 ? e : null, at = null, An(e.ctx), Xe = !1, Qt = ++Vt, e.ac !== null && (ss(() => {
    e.ac.abort(ns);
  }), e.ac = null);
  try {
    e.f |= ys;
    var p = (
      /** @type {Function} */
      e.fn
    ), _ = p();
    e.f |= Pn;
    var v = e.deps, b = L?.is_fork;
    if (Se !== null) {
      var k;
      if (b || $n(e, Le), v !== null && Le > 0)
        for (v.length = Le + Se.length, k = 0; k < Se.length; k++)
          v[Le + k] = Se[k];
      else
        e.deps = v = Se;
      if (kr() && (e.f & qe) !== 0)
        for (k = Le; k < v.length; k++)
          ((S = v[k]).reactions ?? (S.reactions = [])).push(e);
    } else !b && v !== null && Le < v.length && ($n(e, Le), v.length = Le);
    if (ci() && ze !== null && !Xe && v !== null && (e.f & (ce | Ze | ae)) === 0)
      for (k = 0; k < /** @type {Source[]} */
      ze.length; k++)
        ji(
          ze[k],
          /** @type {Effect} */
          e
        );
    if (s !== null && s !== e) {
      if (Vt++, s.deps !== null)
        for (let m = 0; m < n; m += 1)
          s.deps[m].rv = Vt;
      if (t !== null)
        for (const m of t)
          m.rv = Vt;
      ze !== null && (r === null ? r = ze : r.push(.../** @type {Source[]} */
      ze));
    }
    return (e.f & Nt) !== 0 && (e.f ^= Nt), _;
  } catch (m) {
    return ui(m);
  } finally {
    e.f ^= ys, Se = t, Le = n, ze = r, N = s, at = i, An(a), Xe = c, Qt = f;
  }
}
function Ra(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = yo.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? n = t.reactions = null : (n[r] = n[s], n.pop());
    }
  }
  if (n === null && (t.f & ce) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Se === null || !ws.call(Se, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    (i.f & qe) !== 0 && (i.f ^= qe, i.f &= ~Xt), i.v !== ie && hr(i), i.ac !== null && ss(() => {
      i.ac.abort(ns), i.ac = null, Z(i, ae);
    }), ba(i), $n(i, 0);
  }
}
function $n(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      Ra(e, n[r]);
}
function Mn(e) {
  var t = e.f;
  if ((t & Ve) === 0) {
    Z(e, oe);
    var n = R, r = ks;
    R = e, ks = (t & (Be | kt)) === 0;
    try {
      (t & ($e | ni)) !== 0 ? Ia(e) : yr(e), Ii(e);
      var s = Fi(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = Oi;
      var i;
    } finally {
      ks = r, R = n;
    }
  }
}
async function hn() {
  await Promise.resolve(), ka();
}
function o(e) {
  var t = e.f, n = (t & ce) !== 0;
  if (N !== null && !Xe) {
    var r = R !== null && (R.f & Ve) !== 0;
    if (!r && (at === null || !at.has(e))) {
      var s = N.deps;
      if ((N.f & ys) !== 0)
        e.rv < Vt && (e.rv = Vt, Se === null && s !== null && s[Le] === e ? Le++ : Se === null ? Se = [e] : Se.push(e));
      else {
        N.deps ?? (N.deps = []), ws.call(N.deps, e) || N.deps.push(e);
        var i = e.reactions;
        i === null ? e.reactions = [N] : ws.call(i, N) || i.push(N);
      }
    }
  }
  if (Rt && ot.has(e))
    return ot.get(e);
  if (n) {
    var a = (
      /** @type {Derived} */
      e
    );
    if (Rt) {
      var c = a.v;
      return ((a.f & oe) === 0 && a.reactions !== null || Ui(a)) && (c = gr(a)), ot.set(a, c), c;
    }
    var f = (a.f & qe) === 0 && !Xe && N !== null && (ks || (N.f & qe) !== 0), u = (a.f & Pn) === 0;
    is(a) && (f && (a.f |= qe), gi(a)), f && !u && (bi(a), Hi(a));
  }
  if (Qe?.has(e))
    return Qe.get(e);
  if ((e.f & Nt) !== 0)
    throw e.v;
  return e.v;
}
function Hi(e) {
  if (e.f |= qe, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & ce) !== 0 && (t.f & qe) === 0 && (bi(
        /** @type {Derived} */
        t
      ), Hi(
        /** @type {Derived} */
        t
      ));
}
function Ui(e) {
  if (e.v === ie) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (ot.has(t) || (t.f & ce) !== 0 && Ui(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ls(e) {
  var t = Xe;
  try {
    return Xe = !0, e();
  } finally {
    Xe = t;
  }
}
const Da = ["touchstart", "touchmove"];
function Oa(e) {
  return Da.includes(e);
}
const Bt = Symbol("events"), qi = /* @__PURE__ */ new Set(), ur = /* @__PURE__ */ new Set();
function te(e, t, n) {
  (t[Bt] ?? (t[Bt] = {}))[e] = n;
}
function za(e) {
  for (var t = 0; t < e.length; t++)
    qi.add(e[t]);
  for (var n of ur)
    n(e);
}
let Ws = null, Ks = !1;
function Yr(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, s = e.composedPath?.() || [], i = (
    /** @type {null | Element} */
    s[0] || e.target
  );
  Ws = e, Ks || (Ks = !0, setTimeout(() => {
    Ks = !1, Ws = null;
  }));
  var a = 0, c = Ws === e && e[Bt];
  if (c) {
    var f = s.indexOf(c);
    if (f !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[Bt] = t;
      return;
    }
    var u = s.indexOf(t);
    if (u === -1)
      return;
    f <= u && (a = f);
  }
  if (i = /** @type {Element} */
  s[a] || e.target, i !== t) {
    Eo(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var p = N, _ = R;
    Ye(null), lt(null);
    try {
      for (var v, b = []; i !== null && i !== t; ) {
        try {
          var k = i[Bt]?.[r];
          k != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i) && k.call(i, e);
        } catch (S) {
          v ? b.push(S) : v = S;
        }
        if (e.cancelBubble) break;
        a++, i = a < s.length ? (
          /** @type {Element} */
          s[a]
        ) : null;
      }
      if (v) {
        for (let S of b)
          queueMicrotask(() => {
            throw S;
          });
        throw v;
      }
    } finally {
      e[Bt] = t, delete e.currentTarget, Ye(p), lt(_);
    }
  }
}
const ja = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Fa(e) {
  return (
    /** @type {string} */
    ja?.createHTML(e) ?? e
  );
}
function Vi(e) {
  var t = mr("template");
  return t.innerHTML = Fa(e.replaceAll("<!>", "<!---->")), t.content;
}
function tn(e, t) {
  var n = (
    /** @type {Effect} */
    R
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function z(e, t) {
  var n = (t & Ko) !== 0, r = (t & Jo) !== 0, s, i = !e.startsWith("<!>");
  return () => {
    s === void 0 && (s = Vi(i ? e : "<!>" + e), n || (s = /** @type {TemplateNode} */
    /* @__PURE__ */ it(s)));
    var a = (
      /** @type {TemplateNode} */
      r || Si ? document.importNode(s, !0) : s.cloneNode(!0)
    );
    if (n) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ it(a)
      ), f = (
        /** @type {TemplateNode} */
        a.lastChild
      );
      tn(c, f);
    } else
      tn(a, a);
    return a;
  };
}
// @__NO_SIDE_EFFECTS__
function Ha(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), s = `<${n}>${r ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var a = (
        /** @type {DocumentFragment} */
        Vi(s)
      ), c = (
        /** @type {Element} */
        /* @__PURE__ */ it(a)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ it(c);
    }
    var f = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return tn(f, f), f;
  };
}
// @__NO_SIDE_EFFECTS__
function Ns(e, t) {
  return /* @__PURE__ */ Ha(e, t, "svg");
}
function fn(e = "") {
  {
    var t = mt(e + "");
    return tn(t, t), t;
  }
}
function un() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = mt();
  return e.append(t, n), tn(t, n), e;
}
function T(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function ge(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== /** @type {any} */
  (e[qn] ?? (e[qn] = e.nodeValue)) && (e[qn] = n, e.nodeValue = `${n}`);
}
function Ua(e, t) {
  return qa(e, t);
}
const us = /* @__PURE__ */ new Map();
function qa(e, { target: t, anchor: n, props: r = {}, events: s, context: i, intro: a = !0, transformError: c }) {
  Ea();
  var f = void 0, u = Ma(() => {
    var p = n ?? t.appendChild(mt());
    aa(
      /** @type {TemplateNode} */
      p,
      {
        pending: () => {
        }
      },
      (b) => {
        ai({});
        var k = (
          /** @type {ComponentContext} */
          _e
        );
        i && (k.c = i), s && (r.$$events = s), f = e(b, r) || {}, li();
      },
      c
    );
    var _ = /* @__PURE__ */ new Set(), v = (b) => {
      for (var k = 0; k < b.length; k++) {
        var S = b[k];
        if (!_.has(S)) {
          _.add(S);
          var m = Oa(S);
          for (const G of [t, document]) {
            var D = us.get(G);
            D === void 0 && (D = /* @__PURE__ */ new Map(), us.set(G, D));
            var ee = D.get(S);
            ee === void 0 ? (G.addEventListener(S, Yr, { passive: m }), D.set(S, 1)) : D.set(S, ee + 1);
          }
        }
      }
    };
    return v(Ps(qi)), ur.add(v), () => {
      for (var b of _)
        for (const m of [t, document]) {
          var k = (
            /** @type {Map<string, number>} */
            us.get(m)
          ), S = (
            /** @type {number} */
            k.get(b)
          );
          --S == 0 ? (m.removeEventListener(b, Yr), k.delete(b), k.size === 0 && us.delete(m)) : k.set(b, S);
        }
      ur.delete(v), p !== n && p.parentNode?.removeChild(p);
    };
  });
  return dr.set(f, u), f;
}
let dr = /* @__PURE__ */ new WeakMap();
function Va(e, t) {
  const n = dr.get(e);
  return n ? (dr.delete(e), n(t)) : Promise.resolve();
}
var Ke, st, Re, Jt, es, ts, Ms;
class Ba {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Ie(this, "anchor");
    /** @type {Map<Batch, Key>} */
    C(this, Ke, /* @__PURE__ */ new Map());
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
    C(this, st, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    C(this, Re, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    C(this, Jt, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    C(this, es, !0);
    /**
     * @param {Batch} batch
     */
    C(this, ts, (t) => {
      if (l(this, Ke).has(t)) {
        var n = (
          /** @type {Key} */
          l(this, Ke).get(t)
        ), r = l(this, st).get(n);
        if (r)
          Ts(r), l(this, Jt).delete(n);
        else {
          var s = l(this, Re).get(n);
          s && (Ts(s.effect), l(this, st).set(n, s.effect), l(this, Re).delete(n), s.fragment.lastChild.remove(), this.anchor.before(s.fragment), r = s.effect);
        }
        for (const [i, a] of l(this, Ke)) {
          if (l(this, Ke).delete(i), i === t)
            break;
          const c = l(this, Re).get(a);
          c && (Te(c.effect), l(this, Re).delete(a));
        }
        for (const [i, a] of l(this, st)) {
          if (i === n || l(this, Jt).has(i)) continue;
          const c = () => {
            if (Array.from(l(this, Ke).values()).includes(i)) {
              var u = document.createDocumentFragment();
              Er(a, u), u.append(mt()), l(this, Re).set(i, { effect: a, fragment: u });
            } else
              Te(a);
            l(this, Jt).delete(i), l(this, st).delete(i);
          };
          l(this, es) || !r ? (l(this, Jt).add(i), $t(a, c, !1)) : c();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    C(this, Ms, (t) => {
      l(this, Ke).delete(t);
      const n = Array.from(l(this, Ke).values());
      for (const [r, s] of l(this, Re))
        n.includes(r) || (Te(s.effect), l(this, Re).delete(r));
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
      L
    ), s = Ci();
    if (n && !l(this, st).has(t) && !l(this, Re).has(t))
      if (s) {
        var i = document.createDocumentFragment(), a = mt();
        i.append(a), l(this, Re).set(t, {
          effect: Ue(() => n(a)),
          fragment: i
        });
      } else
        l(this, st).set(
          t,
          Ue(() => n(this.anchor))
        );
    if (l(this, Ke).set(r, t), s) {
      for (const [c, f] of l(this, st))
        c === t ? r.unskip_effect(f) : r.skip_effect(f);
      for (const [c, f] of l(this, Re))
        c === t ? r.unskip_effect(f.effect) : r.skip_effect(f.effect);
      r.oncommit(l(this, ts)), r.ondiscard(l(this, Ms));
    } else
      l(this, ts).call(this, r);
  }
}
Ke = new WeakMap(), st = new WeakMap(), Re = new WeakMap(), Jt = new WeakMap(), es = new WeakMap(), ts = new WeakMap(), Ms = new WeakMap();
function B(e, t, n = !1) {
  var r = new Ba(e), s = n ? Tn : 0;
  function i(a, c) {
    r.ensure(a, c);
  }
  xr(() => {
    var a = !1;
    t((c, f = 0) => {
      a = !0, i(f, c);
    }), a || i(-1, null);
  }, s);
}
function dn(e, t) {
  return t;
}
function Ya(e, t, n) {
  for (var r = [], s = t.length, i, a = t.length, c = 0; c < s; c++) {
    let _ = t[c];
    $t(
      _,
      () => {
        if (i) {
          if (i.pending.delete(_), i.done.add(_), i.pending.size === 0) {
            var v = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            vr(e, Ps(i.done)), v.delete(i), v.size === 0 && (e.outrogroups = null);
          }
        } else
          a -= 1;
      },
      !1
    );
  }
  if (a === 0) {
    var f = r.length === 0 && n !== null && e.pending.size === 0;
    if (f) {
      var u = (
        /** @type {Element} */
        n
      ), p = (
        /** @type {Element} */
        u.parentNode
      );
      Sa(p), p.append(u), e.items.clear();
    }
    vr(e, t, !f);
  } else
    i = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
}
function vr(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = /* @__PURE__ */ new Set();
    for (const a of e.pending.values())
      for (const c of a)
        r.add(
          /** @type {EachItem} */
          e.items.get(c).e
        );
  }
  for (var s = 0; s < t.length; s++) {
    var i = t[s];
    if (r?.has(i)) {
      i.f |= rt;
      const a = document.createDocumentFragment();
      Er(i, a);
    } else
      Te(t[s], n);
  }
}
var Gr;
function vn(e, t, n, r, s, i = null) {
  var a = e, c = /* @__PURE__ */ new Map(), f = (t & si) !== 0;
  if (f) {
    var u = (
      /** @type {Element} */
      e
    );
    a = u.appendChild(mt());
  }
  var p = null, _ = /* @__PURE__ */ ha(() => {
    var G = n();
    return (
      /** @type {V[]} */
      Zr(G) ? G : G == null ? [] : Ps(G)
    );
  }), v, b = /* @__PURE__ */ new Map(), k = !0;
  function S(G) {
    (ee.effect.f & Ve) === 0 && (ee.pending.delete(G), ee.fallback = p, Ga(ee, v, a, t, r), p !== null && (v.length === 0 ? (p.f & rt) === 0 ? Ts(p) : (p.f ^= rt, Gn(p, null, a)) : $t(p, () => {
      p = null;
    })));
  }
  function m(G) {
    ee.pending.delete(G);
  }
  var D = xr(() => {
    v = /** @type {V[]} */
    o(_);
    for (var G = v.length, de = /* @__PURE__ */ new Set(), we = (
      /** @type {Batch} */
      L
    ), fe = Ci(), W = 0; W < G; W += 1) {
      var et = v[W], ct = r(et, W), ne = k ? null : c.get(ct);
      ne ? (ne.v && Cn(ne.v, et), ne.i && Cn(ne.i, W), fe && we.unskip_effect(ne.e)) : (ne = Wa(
        c,
        k ? a : Gr ?? (Gr = mt()),
        et,
        ct,
        W,
        s,
        t,
        n
      ), k || (ne.e.f |= rt), c.set(ct, ne)), de.add(ct);
    }
    if (G === 0 && i && !p && (k ? p = Ue(() => i(a)) : (p = Ue(() => i(Gr ?? (Gr = mt()))), p.f |= rt)), G > de.size && Do(), !k)
      if (b.set(we, de), fe) {
        for (const [Ge, De] of c)
          de.has(Ge) || we.skip_effect(De.e);
        we.oncommit(S), we.ondiscard(m);
      } else
        S(we);
    o(_);
  }), ee = { effect: D, items: c, pending: b, outrogroups: null, fallback: p };
  k = !1;
}
function Un(e) {
  for (; e !== null && (e.f & Be) === 0; )
    e = e.next;
  return e;
}
function Ga(e, t, n, r, s) {
  var i = (r & Go) !== 0, a = t.length, c = e.items, f = Un(e.effect.first), u, p = null, _, v = [], b = [], k, S, m, D;
  if (i)
    for (D = 0; D < a; D += 1)
      k = t[D], S = s(k, D), m = /** @type {EachItem} */
      c.get(S).e, (m.f & rt) === 0 && (m.nodes?.a?.measure(), (_ ?? (_ = /* @__PURE__ */ new Set())).add(m));
  for (D = 0; D < a; D += 1) {
    if (k = t[D], S = s(k, D), m = /** @type {EachItem} */
    c.get(S).e, e.outrogroups !== null)
      for (const ne of e.outrogroups)
        ne.pending.delete(m), ne.done.delete(m);
    if ((m.f & ke) !== 0 && (Ts(m), i && (m.nodes?.a?.unfix(), (_ ?? (_ = /* @__PURE__ */ new Set())).delete(m))), (m.f & rt) !== 0)
      if (m.f ^= rt, m === f)
        Gn(m, null, n);
      else {
        var ee = p ? p.next : f;
        m === e.effect.last && (e.effect.last = m.prev), m.prev && (m.prev.next = m.next), m.next && (m.next.prev = m.prev), Ct(e, p, m), Ct(e, m, ee), Gn(m, ee, n), p = m, v = [], b = [], f = Un(p.next);
        continue;
      }
    if (m !== f) {
      if (u !== void 0 && u.has(m)) {
        if (v.length < b.length) {
          var G = b[0], de;
          p = G.prev;
          var we = v[0], fe = v[v.length - 1];
          for (de = 0; de < v.length; de += 1)
            Gn(v[de], G, n);
          for (de = 0; de < b.length; de += 1)
            u.delete(b[de]);
          Ct(e, we.prev, fe.next), Ct(e, p, we), Ct(e, fe, G), f = G, p = fe, D -= 1, v = [], b = [];
        } else
          u.delete(m), Gn(m, f, n), Ct(e, m.prev, m.next), Ct(e, m, p === null ? e.effect.first : p.next), Ct(e, p, m), p = m;
        continue;
      }
      for (v = [], b = []; f !== null && f !== m; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(f), b.push(f), f = Un(f.next);
      if (f === null)
        continue;
    }
    (m.f & rt) === 0 && v.push(m), p = m, f = Un(m.next);
  }
  if (e.outrogroups !== null) {
    for (const ne of e.outrogroups)
      ne.pending.size === 0 && (vr(e, Ps(ne.done)), e.outrogroups?.delete(ne));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (f !== null || u !== void 0) {
    var W = [];
    if (u !== void 0)
      for (m of u)
        (m.f & ke) === 0 && W.push(m);
    for (; f !== null; )
      (f.f & ke) === 0 && f !== e.fallback && W.push(f), f = Un(f.next);
    var et = W.length;
    if (et > 0) {
      var ct = (r & si) !== 0 && a === 0 ? n : null;
      if (i) {
        for (D = 0; D < et; D += 1)
          W[D].nodes?.a?.measure();
        for (D = 0; D < et; D += 1)
          W[D].nodes?.a?.fix();
      }
      Ya(e, W, ct);
    }
  }
  i && It(() => {
    if (_ !== void 0)
      for (m of _)
        m.nodes?.a?.apply();
  });
}
function Wa(e, t, n, r, s, i, a, c) {
  var f = (a & Bo) !== 0 ? (a & Wo) === 0 ? /* @__PURE__ */ xa(n, !1, !1) : en(n) : null, u = (a & Yo) !== 0 ? en(s) : null;
  return {
    v: f,
    i: u,
    e: Ue(() => (i(t, f ?? n, u ?? s, c), () => {
      e.delete(r);
    }))
  };
}
function Gn(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, s = e.nodes.end, i = t && (t.f & rt) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ rs(r)
      );
      if (i.before(r), r === s)
        return;
      r = a;
    }
}
function Ct(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Ka(e, t, n = !1, r = !1, s = !1, i = !1) {
  var a = e, c = "";
  if (n)
    var f = (
      /** @type {Element} */
      e
    );
  be(() => {
    var u = (
      /** @type {Effect} */
      R
    );
    if (c !== (c = t() ?? "")) {
      if (n) {
        u.nodes = null, f.innerHTML = /** @type {string} */
        c, c !== "" && tn(
          /** @type {TemplateNode} */
          /* @__PURE__ */ it(f),
          /** @type {TemplateNode} */
          f.lastChild
        );
        return;
      }
      if (u.nodes !== null && (Li(
        u.nodes.start,
        /** @type {TemplateNode} */
        u.nodes.end
      ), u.nodes = null), c !== "") {
        var p = r ? $o : s ? Qo : void 0, _ = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          mr(r ? "svg" : s ? "math" : "template", p)
        );
        _.innerHTML = /** @type {any} */
        c;
        var v = r || s ? _ : (
          /** @type {HTMLTemplateElement} */
          _.content
        );
        if (tn(
          /** @type {TemplateNode} */
          /* @__PURE__ */ it(v),
          /** @type {TemplateNode} */
          v.lastChild
        ), r || s)
          for (; /* @__PURE__ */ it(v); )
            a.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ it(v)
            );
        else
          a.before(v);
      }
    }
  });
}
function Ja(e, t) {
  Pi(() => {
    e = R?.parent?.nodes?.start ?? e;
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
      const s = mr("style");
      s.id = t.hash, s.textContent = t.code, r.appendChild(s);
    }
  });
}
const Wr = [...` 	
\r\f \v\uFEFF`];
function $a(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (t && (r = r ? r + " " + t : t), n) {
    for (var s of Object.keys(n))
      if (n[s])
        r = r ? r + " " + s : s;
      else if (r.length)
        for (var i = s.length, a = 0; (a = r.indexOf(s, a)) >= 0; ) {
          var c = a + i;
          (a === 0 || Wr.includes(r[a - 1])) && (c === r.length || Wr.includes(r[c])) ? r = (a === 0 ? "" : r.substring(0, a)) + r.substring(c + 1) : a = c;
        }
  }
  return r === "" ? null : r;
}
function Qa(e, t) {
  return e == null ? null : String(e);
}
function Ut(e, t, n, r, s, i) {
  var a = (
    /** @type {any} */
    e[tr]
  );
  if (a !== n || a === void 0) {
    var c = $a(n, r, i);
    c == null ? e.removeAttribute("class") : e.className = c, e[tr] = n;
  } else if (i && s !== i)
    for (var f in i) {
      var u = !!i[f];
      (s == null || u !== !!s[f]) && e.classList.toggle(f, u);
    }
  return i;
}
function Kr(e, t, n, r) {
  var s = (
    /** @type {any} */
    e[nr]
  );
  if (s !== t) {
    var i = Qa(t);
    i == null ? e.removeAttribute("style") : e.style.cssText = i, e[nr] = t;
  }
  return r;
}
const Xa = Symbol("is custom element"), Za = Symbol("is html");
function ds(e, t, n, r) {
  var s = el(e);
  s[t] !== (s[t] = n) && (t === "loading" && (e[Lo] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && tl(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function el(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[ps] ?? (e[ps] = {
      [Xa]: e.nodeName.includes("-"),
      [Za]: e.namespaceURI === ri
    })
  );
}
var Jr = /* @__PURE__ */ new Map();
function tl(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Jr.get(t);
  if (n) return n;
  Jr.set(t, n = []);
  for (var r, s = e, i = Element.prototype; i !== s; ) {
    r = So(s);
    for (var a in r)
      r[a].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      a !== "innerHTML" && a !== "textContent" && a !== "innerText" && n.push(a);
    s = ei(s);
  }
  return n;
}
function nl(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet();
  ra(e, "input", async (s) => {
    var i = s ? e.defaultValue : e.value;
    if (i = Js(e) ? $s(i) : i, n(i), L !== null && r.add(L), await hn(), i !== (i = t())) {
      var a = e.selectionStart, c = e.selectionEnd, f = e.value.length;
      if (e.value = i ?? "", c !== null) {
        var u = e.value.length;
        a === c && c === f && u > f ? (e.selectionStart = u, e.selectionEnd = u) : (e.selectionStart = a, e.selectionEnd = Math.min(c, u));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ls(t) == null && e.value && (n(Js(e) ? $s(e.value) : e.value), L !== null && r.add(L)), wr(() => {
    var s = t();
    if (e === document.activeElement) {
      var i = (
        /** @type {Batch} */
        L
      );
      if (r.has(i))
        return;
    }
    Js(e) && s === $s(e.value) || e.type === "date" && !s && !e.value || s !== e.value && (e.value = s ?? "");
  });
}
function Js(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function $s(e) {
  return e === "" ? null : +e;
}
function Qs(e, t) {
  return e === t || e?.[vs] === t;
}
function Xs(e = {}, t, n, r) {
  var s = (
    /** @type {ComponentContext} */
    _e.r
  ), i = (
    /** @type {Effect} */
    R
  );
  return Pi(() => {
    var a, c;
    return wr(() => {
      a = c, c = [], Ls(() => {
        Qs(n(...c), e) || (t(e, ...c), a && Qs(n(...a), e) && t(null, ...a));
      });
    }), () => {
      let f = i;
      for (; f !== s && f.parent !== null && f.parent.f & er; )
        f = f.parent;
      const u = () => {
        c && Qs(n(...c), e) && t(null, ...c);
      }, p = f.teardown;
      f.teardown = () => {
        u(), p?.();
      };
    };
  }), e;
}
function sl(e) {
  _e === null && No(), ms(() => {
    const t = Ls(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const rl = "5";
var Xr;
typeof window < "u" && ((Xr = window.__svelte ?? (window.__svelte = {})).v ?? (Xr.v = /* @__PURE__ */ new Set())).add(rl);
const il = "Ask questions about your realm — its governance, proposals, rules, and more — and get answers from an AI assistant in chat.";
var ol = /* @__PURE__ */ z('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), al = /* @__PURE__ */ z('<div class="settings-assistant-grid svelte-beco3k"></div>'), ll = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), cl = /* @__PURE__ */ z('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), fl = /* @__PURE__ */ z('<div class="settings-history-list svelte-beco3k"></div>'), ul = /* @__PURE__ */ z('<p class="settings-section-desc svelte-beco3k"> </p>'), dl = /* @__PURE__ */ z('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), vl = /* @__PURE__ */ z(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <p class="settings-page-desc svelte-beco3k"> </p> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), pl = /* @__PURE__ */ z('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), hl = /* @__PURE__ */ z('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), gl = /* @__PURE__ */ z('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), bl = /* @__PURE__ */ z('<div class="assistant-selector svelte-beco3k"></div>'), _l = /* @__PURE__ */ z('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), ml = /* @__PURE__ */ z('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), kl = /* @__PURE__ */ z('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), wl = /* @__PURE__ */ z('<div class="history-panel svelte-beco3k"><!></div>'), xl = /* @__PURE__ */ z(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), yl = /* @__PURE__ */ z(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), El = /* @__PURE__ */ z('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), $r = /* @__PURE__ */ Ns('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Qr = /* @__PURE__ */ Ns('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), Sl = /* @__PURE__ */ z('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), Tl = /* @__PURE__ */ z('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), Al = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), Cl = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), Ml = /* @__PURE__ */ z('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), Pl = /* @__PURE__ */ z('<p class="stream-status svelte-beco3k"> </p>'), Il = /* @__PURE__ */ z('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), Ll = /* @__PURE__ */ z('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), Nl = /* @__PURE__ */ z('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), Rl = /* @__PURE__ */ z("<!> <!> <!>", 1), Dl = /* @__PURE__ */ z('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), Ol = /* @__PURE__ */ z('<button class="suggestion-chip svelte-beco3k"> </button>'), zl = /* @__PURE__ */ z('<div class="suggestions svelte-beco3k"><!></div>'), jl = /* @__PURE__ */ Ns('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Fl = /* @__PURE__ */ Ns('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Hl = /* @__PURE__ */ z('<div><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div></div></div>');
const Ul = {
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

	/* ══════════════════════ Settings page ══════════════════════ */.settings-page.svelte-beco3k {max-width:680px;margin:0 auto;padding:36px 24px 60px;font-family:inherit;color:#111;}.settings-title.svelte-beco3k {font-size:1.35rem;font-weight:700;margin:0 0 8px;color:#111;}.settings-page-desc.svelte-beco3k {font-size:0.9rem;color:#6b7280;margin:0 0 32px;line-height:1.45;}.settings-section.svelte-beco3k {background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:18px;display:flex;flex-direction:column;gap:14px;}.settings-section-title.svelte-beco3k {font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0;}.settings-section-desc.svelte-beco3k {font-size:0.875rem;color:#6b7280;margin:-8px 0 0;}

	/* Default assistant grid */.settings-assistant-grid.svelte-beco3k {display:flex;flex-wrap:wrap;gap:10px;}.settings-assistant-btn.svelte-beco3k {display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;transition:border-color 0.15s, background 0.15s;min-width:80px;}.settings-assistant-btn.selected.svelte-beco3k {border-color:#4f46e5;background:#eef2ff;}.settings-assistant-emoji.svelte-beco3k {font-size:1.5rem;}.settings-assistant-name.svelte-beco3k {font-size:0.8rem;font-weight:500;color:#374151;}

	/* Toggle rows */.settings-toggle.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;}.settings-toggle-info.svelte-beco3k {display:flex;flex-direction:column;gap:2px;}.settings-toggle-label.svelte-beco3k {font-size:0.9rem;font-weight:500;color:#111;}.settings-toggle-desc.svelte-beco3k {font-size:0.8rem;color:#6b7280;}.settings-switch.svelte-beco3k {flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#d1d5db;border:none;position:relative;cursor:pointer;transition:background 0.2s;outline:none;padding:0;}.settings-switch.svelte-beco3k::after {content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s;}.settings-switch.on.svelte-beco3k {background:#4f46e5;}.settings-switch.on.svelte-beco3k::after {transform:translateX(18px);}

	/* History list */.settings-history-list.svelte-beco3k {display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;}.settings-history-item.svelte-beco3k {display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:#f9fafb;}.settings-history-body.svelte-beco3k {flex:1;min-width:0;}.settings-history-title.svelte-beco3k {font-size:0.875rem;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.settings-history-meta.svelte-beco3k {font-size:0.75rem;color:#9ca3af;margin-top:2px;}.settings-history-delete.svelte-beco3k {flex-shrink:0;width:28px;height:28px;border:none;background:transparent;cursor:pointer;border-radius:6px;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 0.15s, color 0.15s;}.settings-history-delete.svelte-beco3k:hover {background:#fee2e2;color:#dc2626;}.settings-danger-btn.svelte-beco3k {align-self:flex-start;padding:7px 14px;border:1.5px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;font-size:0.85rem;font-weight:500;cursor:pointer;transition:background 0.15s;}.settings-danger-btn.svelte-beco3k:hover:not(:disabled) {background:#fee2e2;}.settings-danger-btn.svelte-beco3k:disabled {opacity:0.5;cursor:not-allowed;}

	/* About */.settings-about-row.svelte-beco3k {display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;}.settings-about-label.svelte-beco3k {color:#6b7280;}.settings-about-value.svelte-beco3k {font-weight:500;color:#111;}.settings-api-status.svelte-beco3k {font-size:0.85rem;font-weight:500;}.settings-api-status.online.svelte-beco3k {color:#16a34a;}.settings-api-status.offline.svelte-beco3k {color:#dc2626;}.settings-api-status.unknown.svelte-beco3k {color:#9ca3af;}.settings-link-btn.svelte-beco3k {align-self:flex-start;padding:6px 12px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;color:#4f46e5;font-size:0.8rem;cursor:pointer;transition:background 0.15s;}.settings-link-btn.svelte-beco3k:hover {background:#eef2ff;}`
};
function ql(e, t) {
  ai(t, !0), Ja(e, Ul);
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
  let s = /* @__PURE__ */ P(Je([])), i = /* @__PURE__ */ P(""), a = /* @__PURE__ */ P(!1), c = /* @__PURE__ */ P(""), f = /* @__PURE__ */ P(!1), u = /* @__PURE__ */ P(Je(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), p = /* @__PURE__ */ P(""), _ = /* @__PURE__ */ P(void 0), v = /* @__PURE__ */ P(Je([])), b = /* @__PURE__ */ P(!1), k = /* @__PURE__ */ P(void 0), S = /* @__PURE__ */ P(Je([])), m = /* @__PURE__ */ P(null), D = /* @__PURE__ */ P(!1), ee = /* @__PURE__ */ P(null), G = /* @__PURE__ */ P(void 0), de = /* @__PURE__ */ P("100%"), we = /* @__PURE__ */ P(null), fe = /* @__PURE__ */ P(!1), W = /* @__PURE__ */ P(null), et = /* @__PURE__ */ P(0), ct, ne, Ge = /* @__PURE__ */ P(null), De = /* @__PURE__ */ P(Je([])), xt = /* @__PURE__ */ P(!1), os = /* @__PURE__ */ P(!1);
  const Ln = "https://geister-api.realmsgos.dev/", Bi = 36e4;
  let Yi = `${Ln}api/ask`, Gi = `${Ln}suggestions`, Wi = `${Ln}api/personas/assistants`, Nn = `${Ln}api/conversations`;
  function Ki(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function Sr(d) {
    if (!d) return null;
    const g = d.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function Ji(d) {
    !d || d.id === o(et) || (h(et, d.id, !0), h(i, d.message, !0), h(fe, !0), d.autoSend ? setTimeout(() => void rn(), 150) : hn().then(Fs));
  }
  function $i() {
    if (Sr(o(W)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function Qi() {
    ct = t.ctx.host?.pendingPrompt?.subscribe?.(Ji), ne = t.ctx.host?.focus?.subscribe?.((d) => {
      h(W, d, !0);
    });
  }
  function Tr(d, g) {
    if (g === 503 && d instanceof Error && d.message) {
      const w = d.message.toLowerCase();
      return w.includes("pod") || w.includes("llm backend") || w.includes("ollama") || w.includes("waking up") || w.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : d.message;
    }
    return g === 502 || g === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : g === 504 || g === 524 ? "The request timed out before the server could respond. Please try again." : g && g >= 500 ? "Server error. Please try again later." : d instanceof DOMException && d.name === "TimeoutError" || d instanceof Error && d.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : d instanceof TypeError || d instanceof Error && d.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : d instanceof Error && d.message.includes("HTTP error") ? Tr(d, Number(d.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function Xi(d) {
    const g = d.toLowerCase();
    return g.includes("llm backend") || g.includes("cannot reach ollama") || g.includes("ollama at");
  }
  function Rn() {
    h(u, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function Ar() {
    h(u, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function Zi(d) {
    const g = d.toLowerCase();
    return g.includes("waking up") || g.includes("still starting");
  }
  function Rs() {
    h(c, ""), h(f, !1);
  }
  function as(d, g) {
    d.trim() && (h(f, !0), h(c, ""));
    const w = { text: d, isUser: !1, ...g.trim() ? { thinking: g } : {} }, y = o(s)[o(s).length - 1];
    !y || y.isUser ? h(s, [...o(s), w], !0) : h(s, o(s).map((M, Ae) => Ae === o(s).length - 1 ? { ...M, ...w } : M), !0), hn().then(zs);
  }
  function eo(d, g) {
    const w = typeof d.type == "string" ? d.type : d.text ? "text" : "", y = typeof d.text == "string" ? d.text : "";
    if (w === "status" && y) {
      Rn(), h(c, y, !0);
      return;
    }
    if (w === "thinking" && y) {
      Rn(), g.thinking += y, as(g.text, g.thinking);
      return;
    }
    y && (Rn(), g.text += y, as(g.text, g.thinking));
  }
  let Dn = "", yt = "", Cr, Mr, Et = /* @__PURE__ */ P(!1);
  const nn = !!t.ctx.sidebarPanel, Pr = "llm_chat_prefs";
  function to() {
    try {
      return JSON.parse(localStorage.getItem(Pr) || "{}");
    } catch {
      return {};
    }
  }
  function no(d) {
    try {
      localStorage.setItem(Pr, JSON.stringify(d));
    } catch {
    }
  }
  const Ds = to();
  let sn = /* @__PURE__ */ P(Je(Ds.defaultAssistant || "")), Dt = /* @__PURE__ */ P(Ds.showSuggestions !== !1), On = /* @__PURE__ */ P(Ds.sharePageContext !== !1);
  ms(() => {
    no({
      defaultAssistant: o(sn),
      showSuggestions: o(Dt),
      sharePageContext: o(On)
    });
  });
  let zn = /* @__PURE__ */ P("unknown"), ls = /* @__PURE__ */ P(!1), Os = /* @__PURE__ */ P(!1);
  async function Ir() {
    try {
      const d = await fetch(`${Ln}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      h(zn, d.ok ? "online" : "offline", !0);
    } catch {
      h(zn, "offline");
    }
  }
  async function so() {
    if (!(!yt || !o(Et))) {
      h(ls, !0);
      try {
        await js(), await Promise.all(o(De).map((d) => fetch(`${Nn}/${d.conversation_id}`, { method: "DELETE" }))), h(De, [], !0), h(s, [], !0), h(Ge, null), h(Os, !0), setTimeout(
          () => {
            h(Os, !1);
          },
          2e3
        );
      } catch {
      } finally {
        h(ls, !1);
      }
    }
  }
  sl(async () => {
    const d = globalThis.__CANISTER_IDS?.realm_backend || "", g = t.ctx.config?.canisterId || "";
    if (Dn = d || g, Cr = t.ctx.principal?.subscribe?.((w) => {
      yt = w || "";
    }), Mr = t.ctx.isAuthenticated?.subscribe?.((w) => {
      h(Et, w, !0);
    }), !nn) {
      const w = window.visualViewport;
      if (w) {
        const y = () => {
          const M = o(G)?.getBoundingClientRect().top ?? w.offsetTop, Ae = Math.max(Math.round(w.height - M), 200);
          h(de, `${Ae}px`);
        };
        await hn(), y(), w.addEventListener("resize", y), w.addEventListener("scroll", y), window.addEventListener("resize", y), window.__chatVpCleanup = () => {
          w.removeEventListener("resize", y), w.removeEventListener("scroll", y), window.removeEventListener("resize", y);
        };
      }
    }
    if (ro(), Qi(), await io(), o(sn) && o(S).length > 0) {
      const w = o(S).find((y) => y.id === o(sn));
      w && h(m, w, !0);
    }
    !o(fe) && o(Dt) && await cs(), nn || (Ir(), o(Et) && await js());
  });
  function ro() {
    try {
      const d = new URLSearchParams(window.location.search), g = d.get("explain");
      if (!g) return;
      const [w, y] = g.split(":");
      if (w === "codex" && y)
        h(fe, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: y })).then((M) => {
          if (M.success) {
            const Ot = (typeof M.response == "string" ? JSON.parse(M.response) : M.response).codex?.name || `codex_${y}`, ve = `/extensions/codex_viewer/${y}`;
            h(we, y, !0), h(i, `Please explain this codex: [${Ot}](${ve})`), setTimeout(() => rn(), 300);
          }
        }).catch((M) => {
          console.error("Failed to fetch codex for explanation:", M), h(fe, !1);
        });
      else if (w === "financial_statements") {
        h(fe, !0);
        const M = d.get("context") || "";
        h(i, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${M}`), setTimeout(() => rn(), 300);
      }
    } catch (d) {
      console.error("Error handling explain param:", d);
    }
  }
  ms(() => {
    o(s), hn().then(zs);
  });
  function zs() {
    o(_) && (o(_).scrollTop = o(_).scrollHeight);
  }
  async function io() {
    if (!o(D)) {
      h(D, !0);
      try {
        const d = await fetch(Wi, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        const g = await d.json();
        g.assistants && Array.isArray(g.assistants) && (h(S, g.assistants, !0), o(S).length > 0 && !o(m) && h(m, o(S)[0], !0));
      } catch (d) {
        console.error("Error fetching assistants:", d);
      } finally {
        h(D, !1);
      }
    }
  }
  async function cs() {
    if (!o(b)) {
      h(b, !0);
      try {
        const d = new URLSearchParams({
          user_principal: yt || "",
          realm_principal: Dn || "",
          persona: o(m)?.id || "ashoka"
        }), g = await fetch(`${Gi}?${d.toString()}`, {
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
  async function rn() {
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
    h(i, ""), h(a, !0), Rs(), h(c, o(u) ? "Thinking…" : "", !0);
    try {
      await co();
      const g = r(), w = {
        question: d,
        realm_principal: Dn,
        user_principal: yt,
        stream: !0,
        verbosity: 1,
        persona: o(m)?.id || "ashoka",
        network: g,
        ...o(Ge) ? { conversation_id: o(Ge) } : {}
      };
      if (o(we))
        w.explain_codex_id = o(we), h(we, null);
      else {
        const ue = Ki(o(W)?.uri);
        ue && (w.explain_codex_id = ue);
      }
      const y = Sr(o(W)?.uri);
      y && (w.explain_proposal_id = y, w.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: o(W)?.label || "Proposal",
        proposalId: y
      }), o(W) && (w.focus = {
        uri: o(W).uri,
        label: o(W).label
      });
      const M = await fetch(Yi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(w),
        signal: AbortSignal.timeout(Bi)
      });
      if (!M.ok) {
        let ue = "";
        try {
          const Ce = await M.json();
          ue = typeof Ce?.error == "string" ? Ce.error : "";
        } catch {
        }
        throw ue ? Object.assign(new Error(ue), { httpStatus: M.status }) : Object.assign(new Error(`HTTP error! Status: ${M.status}`), { httpStatus: M.status });
      }
      const Ae = M.body?.getReader();
      if (!Ae) throw new Error("Response body is not readable");
      const Ot = new TextDecoder(), ve = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: ue, value: Ce } = await Ae.read();
          if (ue) break;
          const ln = Ot.decode(Ce, { stream: !0 }).split(`
`);
          for (const ft of ln)
            if (ft.startsWith("data: ")) {
              const zt = ft.slice(6);
              if (zt === "[DONE]") continue;
              try {
                eo(JSON.parse(zt), ve);
              } catch {
                ve.text += zt, as(ve.text, ve.thinking);
              }
            } else ft.trim() && !ft.startsWith(":") && (ve.text += ft, as(ve.text, ve.thinking));
        }
      } finally {
        Ae.releaseLock();
      }
      const St = ve.text, on = ve.thinking;
      St.trim() ? Xi(St) ? (h(p, "The AI backend is temporarily offline. Please try again in a few minutes."), Ar()) : St.trim() && Rn() : o(s).length > 0 && !o(s)[o(s).length - 1].isUser ? h(s, o(s).map((ue, Ce) => Ce === o(s).length - 1 ? { ...ue, text: "No response from LLM" } : ue), !0) : h(
        s,
        [
          ...o(s),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), h(a, !1), Rs(), h(fe, !1), await cs();
    } catch (g) {
      console.error("Error calling LLM:", g), h(p, Tr(g, g?.httpStatus), !0), Zi(o(p)) && Ar(), o(s).length > 0 && !o(s)[o(s).length - 1].isUser && h(s, o(s).slice(0, -1), !0);
    } finally {
      h(a, !1), Rs(), h(fe, !1);
    }
  }
  function oo() {
    h(p, "");
  }
  async function js() {
    if (!(!yt || !o(Et))) {
      h(os, !0);
      try {
        const d = new URLSearchParams({
          user_principal: yt,
          realm_principal: Dn
        }), g = await fetch(`${Nn}?${d}`, { headers: { "Content-Type": "application/json" } });
        if (!g.ok) return;
        const w = await g.json();
        h(De, (w.conversations || []).sort((y, M) => new Date(M.updated_at).getTime() - new Date(y.updated_at).getTime()), !0);
      } catch {
      } finally {
        h(os, !1);
      }
    }
  }
  async function Lr(d) {
    h(xt, !1), h(s, [], !0), h(Ge, d.conversation_id, !0);
    const g = o(S).find((w) => w.id === d.persona);
    g && h(m, g, !0);
    try {
      const w = await fetch(`${Nn}/${d.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!w.ok) return;
      const y = await w.json();
      h(s, fo(y.messages || []), !0), o(s).some((M) => !M.isUser) && Rn(), await hn(), zs();
    } catch {
    }
  }
  async function ao() {
    h(xt, !1), h(s, [], !0), h(Ge, null), h(p, ""), h(v, [], !0), await cs();
  }
  async function Nr(d, g) {
    g.stopPropagation();
    try {
      await fetch(`${Nn}/${d}`, { method: "DELETE" }), h(De, o(De).filter((w) => w.conversation_id !== d), !0), o(Ge) === d && (h(s, [], !0), h(Ge, null));
    } catch {
    }
  }
  async function lo() {
    h(xt, !0), await js();
  }
  function Rr(d) {
    const g = new Date(d), y = (/* @__PURE__ */ new Date()).getTime() - g.getTime(), M = Math.floor(y / 864e5);
    return M === 0 ? g.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : M === 1 ? "Yesterday" : M < 7 ? g.toLocaleDateString([], { weekday: "short" }) : g.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function co() {
    if (!(o(Ge) || !yt || !o(Et)))
      try {
        const d = await fetch(Nn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: yt,
            realm_principal: Dn,
            persona: o(m)?.id || "ashoka"
          })
        });
        if (d.ok) {
          const g = await d.json();
          h(Ge, g.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function Dr(d, g) {
    const w = () => {
      h(ee, g, !0), setTimeout(
        () => {
          h(ee, null);
        },
        1500
      );
    }, y = () => {
      const M = document.createElement("textarea");
      M.value = d, M.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(M), M.focus(), M.select();
      try {
        document.execCommand("copy"), w();
      } catch {
      }
      document.body.removeChild(M);
    };
    navigator.clipboard ? navigator.clipboard.writeText(d).then(w).catch(y) : y();
  }
  function fo(d) {
    const g = [];
    for (const w of d) {
      if (!w || typeof w != "object") continue;
      const y = w;
      if (y.role && y.content != null) {
        g.push({ text: String(y.content), isUser: y.role === "user" });
        continue;
      }
      y.question != null && String(y.question).trim() && g.push({ text: String(y.question), isUser: !0 }), y.response != null && String(y.response).trim() && g.push({ text: String(y.response), isUser: !1 });
    }
    return g;
  }
  function uo(d) {
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
  function vo(d) {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), rn()), setTimeout(Fs, 0);
  }
  function po(d) {
    h(i, d, !0), rn();
  }
  function ho(d) {
    h(m, d, !0), h(s, [], !0), cs();
  }
  ms(() => () => {
    Cr?.(), Mr?.(), ct?.(), ne?.(), window.__chatVpCleanup?.();
  });
  var Or = un(), go = Ht(Or);
  {
    var bo = (d) => {
      var g = vl(), w = I(E(g), 2), y = E(w), M = I(w, 2), Ae = I(E(M), 4);
      {
        var Ot = (Q) => {
          var x = al();
          vn(x, 21, () => o(S), dn, (H, K) => {
            var Y = ol(), $ = E(Y), se = E($), U = I($, 2), V = E(U);
            be(() => {
              Ut(Y, 1, `settings-assistant-btn ${o(sn) === o(K).id || !o(sn) && o(S)[0].id === o(K).id ? "selected" : ""}`, "svelte-beco3k"), ge(se, o(K).emoji), ge(V, o(K).name);
            }), te("click", Y, () => h(sn, o(K).id, !0)), T(H, Y);
          }), T(Q, x);
        }, ve = (Q) => {
          var x = ll();
          T(Q, x);
        };
        B(Ae, (Q) => {
          o(S).length > 0 ? Q(Ot) : Q(ve, -1);
        });
      }
      var St = I(M, 2), on = I(E(St), 2), ue = I(E(on), 2), Ce = I(on, 2), an = I(E(Ce), 2), ln = I(St, 2);
      {
        var ft = (Q) => {
          var x = dl(), H = I(E(x), 2);
          {
            var K = (j) => {
              var F = fl();
              vn(F, 21, () => o(De), dn, (pe, Me) => {
                var ut = cl(), Pe = E(ut), Oe = E(Pe), re = E(Oe), le = I(Oe, 2), he = E(le), Ft = I(Pe, 2);
                be(
                  (dt) => {
                    ge(re, o(Me).title), ge(he, `${dt ?? ""} · ${o(Me).message_count ?? ""} message${o(Me).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Rr(o(Me).updated_at)]
                ), te("click", Ft, (dt) => Nr(o(Me).conversation_id, dt)), T(pe, ut);
              }), T(j, F);
            }, Y = (j) => {
              var F = ul(), pe = E(F);
              be(() => ge(pe, o(os) ? "Loading…" : "No conversations yet.")), T(j, F);
            };
            B(H, (j) => {
              o(De).length > 0 ? j(K) : j(Y, -1);
            });
          }
          var $ = I(H, 2), se = E($);
          {
            var U = (j) => {
              var F = fn("✓ History cleared");
              T(j, F);
            }, V = (j) => {
              var F = fn("Clearing…");
              T(j, F);
            }, X = (j) => {
              var F = fn("Clear all history");
              T(j, F);
            };
            B(se, (j) => {
              o(Os) ? j(U) : o(ls) ? j(V, 1) : j(X, -1);
            });
          }
          be(() => $.disabled = o(ls) || o(De).length === 0), te("click", $, so), T(Q, x);
        };
        B(ln, (Q) => {
          o(Et) && Q(ft);
        });
      }
      var zt = I(ln, 2), jn = I(E(zt), 4), fs = I(E(jn), 2), Hs = E(fs);
      {
        var jt = (Q) => {
          var x = fn("● Online");
          T(Q, x);
        }, Fn = (Q) => {
          var x = fn("● Offline");
          T(Q, x);
        }, Us = (Q) => {
          var x = fn("Checking…");
          T(Q, x);
        };
        B(Hs, (Q) => {
          o(zn) === "online" ? Q(jt) : o(zn) === "offline" ? Q(Fn, 1) : Q(Us, -1);
        });
      }
      var qs = I(jn, 2);
      be(() => {
        ge(y, il), Ut(ue, 1, `settings-switch ${o(Dt) ? "on" : ""}`, "svelte-beco3k"), ds(ue, "aria-checked", o(Dt)), Ut(an, 1, `settings-switch ${o(On) ? "on" : ""}`, "svelte-beco3k"), ds(an, "aria-checked", o(On)), Ut(fs, 1, `settings-api-status ${o(zn) ?? ""}`, "svelte-beco3k");
      }), te("click", ue, () => h(Dt, !o(Dt))), te("click", an, () => h(On, !o(On))), te("click", qs, Ir), T(d, g);
    }, _o = (d) => {
      var g = Hl();
      let w;
      var y = E(g);
      {
        var M = (x) => {
          var H = pl(), K = E(H), Y = I(K, 2);
          be(() => Ut(Y, 1, `toolbar-btn ${o(xt) ? "active" : ""}`, "svelte-beco3k")), te("click", K, ao), te("click", Y, function(...$) {
            (o(xt) ? () => h(xt, !1) : lo)?.apply(this, $);
          }), T(x, H);
        };
        B(y, (x) => {
          o(Et) && x(M);
        });
      }
      var Ae = I(y, 2);
      {
        var Ot = (x) => {
          var H = hl(), K = E(H), Y = E(K), $ = I(K, 2);
          be(() => {
            ds(K, "title", o(W).uri), ge(Y, o(W).label);
          }), te("click", $, $i), T(x, H);
        };
        B(Ae, (x) => {
          nn && o(W)?.label && x(Ot);
        });
      }
      var ve = I(Ae, 2);
      {
        var St = (x) => {
          var H = bl();
          vn(H, 21, () => o(S), dn, (K, Y) => {
            var $ = gl(), se = E($), U = E(se), V = I(se, 2), X = E(V);
            be(() => {
              Ut($, 1, `assistant-btn ${o(m)?.id === o(Y).id ? "active" : ""}`, "svelte-beco3k"), ds($, "title", o(Y).description), ge(U, o(Y).emoji), ge(X, o(Y).name);
            }), te("click", $, () => ho(o(Y))), T(K, $);
          }), T(x, H);
        };
        B(ve, (x) => {
          o(S).length > 1 && x(St);
        });
      }
      var on = I(ve, 2);
      {
        var ue = (x) => {
          var H = wl(), K = E(H);
          {
            var Y = (U) => {
              var V = _l();
              T(U, V);
            }, $ = (U) => {
              var V = ml();
              T(U, V);
            }, se = (U) => {
              var V = un(), X = Ht(V);
              vn(X, 17, () => o(De), dn, (j, F) => {
                var pe = kl(), Me = E(pe), ut = E(Me), Pe = E(ut), Oe = I(ut, 2), re = E(Oe), le = I(Me, 2);
                be(
                  (he) => {
                    ge(Pe, o(F).title), ge(re, `${he ?? ""} · ${o(F).message_count ?? ""} msg${o(F).message_count === 1 ? "" : "s"}`);
                  },
                  [() => Rr(o(F).updated_at)]
                ), te("click", pe, () => Lr(o(F))), te("keydown", pe, (he) => he.key === "Enter" && Lr(o(F))), te("click", le, (he) => Nr(o(F).conversation_id, he)), T(j, pe);
              }), T(U, V);
            };
            B(K, (U) => {
              o(os) ? U(Y) : o(De).length === 0 ? U($, 1) : U(se, -1);
            });
          }
          T(x, H);
        };
        B(on, (x) => {
          o(xt) && x(ue);
        });
      }
      var Ce = I(on, 2), an = E(Ce);
      {
        var ln = (x) => {
          var H = El(), K = E(H), Y = E(K);
          {
            var $ = (U) => {
              var V = xl();
              T(U, V);
            }, se = (U) => {
              var V = yl();
              T(U, V);
            };
            B(Y, (U) => {
              o(Et) ? U($) : U(se, -1);
            });
          }
          T(x, H);
        }, ft = (x) => {
          var H = Rl(), K = Ht(H);
          vn(K, 17, () => o(s), dn, (V, X, j) => {
            var F = un(), pe = Ht(F);
            {
              var Me = (Pe) => {
                var Oe = Sl(), re = E(Oe), le = E(re), he = E(le);
                {
                  var Ft = (At) => {
                    var Hn = $r();
                    T(At, Hn);
                  }, dt = (At) => {
                    var Hn = Qr();
                    T(At, Hn);
                  };
                  B(he, (At) => {
                    o(ee) === j ? At(Ft) : At(dt, -1);
                  });
                }
                var tt = I(le, 2), Tt = E(tt);
                be(() => ge(Tt, o(X).text)), te("click", le, () => Dr(o(X).text, j)), T(Pe, Oe);
              }, ut = (Pe) => {
                var Oe = Al(), re = E(Oe), le = E(re), he = E(le);
                {
                  var Ft = (xe) => {
                    var vt = Tl(), Vs = I(E(vt), 2), ko = E(Vs);
                    be(() => ge(ko, o(X).thinking)), T(xe, vt);
                  };
                  B(he, (xe) => {
                    o(X).thinking && xe(Ft);
                  });
                }
                var dt = I(he, 2);
                {
                  var tt = (xe) => {
                    var vt = un(), Vs = Ht(vt);
                    Ka(Vs, () => uo(o(X).text)), T(xe, vt);
                  };
                  B(dt, (xe) => {
                    o(X).text && xe(tt);
                  });
                }
                var Tt = I(le, 2), At = E(Tt);
                {
                  var Hn = (xe) => {
                    var vt = $r();
                    T(xe, vt);
                  }, mo = (xe) => {
                    var vt = Qr();
                    T(xe, vt);
                  };
                  B(At, (xe) => {
                    o(ee) === j ? xe(Hn) : xe(mo, -1);
                  });
                }
                te("click", Tt, () => Dr(o(X).text, j)), T(Pe, Oe);
              };
              B(pe, (Pe) => {
                o(X).isUser ? Pe(Me) : Pe(ut, -1);
              });
            }
            T(V, F);
          });
          var Y = I(K, 2);
          {
            var $ = (V) => {
              var X = Ll(), j = E(X), F = E(j);
              {
                var pe = (re) => {
                  var le = un(), he = Ht(le);
                  {
                    var Ft = (tt) => {
                      var Tt = Cl();
                      T(tt, Tt);
                    }, dt = (tt) => {
                      var Tt = Ml();
                      T(tt, Tt);
                    };
                    B(he, (tt) => {
                      o(fe) ? tt(Ft) : !o(u) && !o(c) && tt(dt, 1);
                    });
                  }
                  T(re, le);
                };
                B(F, (re) => {
                  o(f) || re(pe);
                });
              }
              var Me = I(F, 2);
              {
                var ut = (re) => {
                  var le = Pl(), he = E(le);
                  be(() => ge(he, o(c))), T(re, le);
                };
                B(Me, (re) => {
                  o(c) && re(ut);
                });
              }
              var Pe = I(Me, 2);
              {
                var Oe = (re) => {
                  var le = Il();
                  T(re, le);
                };
                B(Pe, (re) => {
                  !o(f) && !o(c) && o(u) && !o(fe) && re(Oe);
                });
              }
              T(V, X);
            };
            B(Y, (V) => {
              o(a) && (!o(f) || o(c)) && V($);
            });
          }
          var se = I(Y, 2);
          {
            var U = (V) => {
              var X = Nl(), j = E(X), F = E(j), pe = I(j, 2);
              be(() => ge(F, o(p))), te("click", pe, oo), T(V, X);
            };
            B(se, (V) => {
              o(p) && V(U);
            });
          }
          T(x, H);
        };
        B(an, (x) => {
          o(s).length === 0 && !o(fe) ? x(ln) : x(ft, -1);
        });
      }
      Xs(Ce, (x) => h(_, x), () => o(_));
      var zt = I(Ce, 2), jn = E(zt);
      {
        var fs = (x) => {
          var H = zl(), K = E(H);
          {
            var Y = (se) => {
              var U = Dl();
              T(se, U);
            }, $ = (se) => {
              var U = un(), V = Ht(U);
              vn(V, 17, () => o(v), dn, (X, j) => {
                var F = Ol(), pe = E(F);
                be(() => ge(pe, o(j))), te("click", F, () => po(o(j))), T(X, F);
              }), T(se, U);
            };
            B(K, (se) => {
              o(b) ? se(Y) : se($, -1);
            });
          }
          T(x, H);
        };
        B(jn, (x) => {
          o(Dt) && (o(v).length > 0 || o(b)) && x(fs);
        });
      }
      var Hs = I(jn, 2), jt = E(Hs);
      Xs(jt, (x) => h(k, x), () => o(k));
      var Fn = I(jt, 2), Us = E(Fn);
      {
        var qs = (x) => {
          var H = jl();
          T(x, H);
        }, Q = (x) => {
          var H = Fl();
          T(x, H);
        };
        B(Us, (x) => {
          o(a) ? x(qs) : x(Q, -1);
        });
      }
      Xs(g, (x) => h(G, x), () => o(G)), be(
        (x) => {
          w = Ut(g, 1, "llm-chat-root svelte-beco3k", null, w, { "sidebar-panel": nn }), Kr(g, nn ? void 0 : `height: ${o(de)}`), Kr(Ce, o(xt) ? "display:none" : ""), Fn.disabled = x;
        },
        [() => o(a) || !o(i).trim()]
      ), te("keydown", jt, vo), te("input", jt, () => Fs()), nl(jt, () => o(i), (x) => h(i, x)), te("click", Fn, () => rn()), T(d, g);
    };
    B(go, (d) => {
      nn ? d(_o, -1) : d(bo);
    });
  }
  T(e, Or), li();
}
za(["click", "keydown", "input"]);
function Yl(e, t) {
  const n = Ua(ql, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Va(n);
      } catch {
      }
    }
  };
}
export {
  Yl as default
};
