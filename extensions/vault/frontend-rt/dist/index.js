var Es = Object.defineProperty;
var bi = (e) => {
  throw TypeError(e);
};
var As = (e, r, t) => r in e ? Es(e, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[r] = t;
var lt = (e, r, t) => As(e, typeof r != "symbol" ? r + "" : r, t), pa = (e, r, t) => r.has(e) || bi("Cannot " + t);
var d = (e, r, t) => (pa(e, r, "read from private field"), t ? t.call(e) : r.get(e)), G = (e, r, t) => r.has(e) ? bi("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), Y = (e, r, t, a) => (pa(e, r, "write to private field"), a ? a.call(e, t) : r.set(e, t), t), le = (e, r, t) => (pa(e, r, "access private method"), t);
var Ha = Array.isArray, Ts = Array.prototype.indexOf, Fn = Array.prototype.includes, Jn = Array.from, Ms = Object.defineProperty, fn = Object.getOwnPropertyDescriptor, Ns = Object.getOwnPropertyDescriptors, Rs = Object.prototype, Ls = Array.prototype, Bi = Object.getPrototypeOf, ki = Object.isExtensible;
const Ds = () => {
};
function Os(e) {
  for (var r = 0; r < e.length; r++)
    e[r]();
}
function Hi() {
  var e, r, t = new Promise((a, i) => {
    e = a, r = i;
  });
  return { promise: t, resolve: e, reject: r };
}
function Cs(e, r) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const t = [];
  for (const a of e)
    if (t.push(a), t.length === r) break;
  return t;
}
const Je = 2, zr = 4, Gn = 8, qi = 1 << 24, Mt = 16, yt = 32, Xt = 64, Ea = 128, ht = 512, qe = 1024, ze = 2048, Lt = 4096, tt = 8192, xt = 16384, Gr = 32768, wi = 1 << 25, Er = 65536, jn = 1 << 17, Is = 1 << 18, Kr = 1 << 19, Ps = 1 << 20, Pt = 1 << 25, Ar = 65536, Vn = 1 << 21, Ir = 1 << 22, sr = 1 << 23, cn = Symbol("$state"), Ln = Symbol("attributes"), Aa = Symbol("class"), Fs = Symbol("style"), on = Symbol("text"), Dn = Symbol("form reset"), bn = new class extends Error {
  constructor() {
    super(...arguments);
    lt(this, "name", "StaleReactionError");
    lt(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function js(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Vs() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Bs(e, r, t) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Hs(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function qs() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function zs(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Us() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Ws() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Ys() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Js() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Gs() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Ks = 1, Xs = 2, zi = 4, Zs = 8, Qs = 16, $s = 1, el = 2, He = Symbol("uninitialized"), tl = "http://www.w3.org/1999/xhtml";
function rl() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function nl() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function al() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Ui(e) {
  return e === this.v;
}
function il(e, r) {
  return e != e ? r == r : e !== r || e !== null && typeof e == "object" || typeof e == "function";
}
function Wi(e) {
  return !il(e, this.v);
}
let rt = null;
function Ur(e) {
  rt = e;
}
function Yi(e, r = !1, t) {
  rt = {
    p: rt,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      ue
    ),
    l: null
  };
}
function Ji(e) {
  var r = (
    /** @type {ComponentContext} */
    rt
  ), t = r.e;
  if (t !== null) {
    r.e = null;
    for (var a of t)
      po(a);
  }
  return r.i = !0, rt = r.p, /** @type {T} */
  {};
}
function Gi() {
  return !0;
}
let pr = [];
function Ki() {
  var e = pr;
  pr = [], Os(e);
}
function Kt(e) {
  if (pr.length === 0 && !vn) {
    var r = pr;
    queueMicrotask(() => {
      r === pr && Ki();
    });
  }
  pr.push(e);
}
function ol() {
  for (; pr.length > 0; )
    Ki();
}
function Xi(e) {
  var r = ue;
  if (r === null)
    return ie.f |= sr, e;
  if ((r.f & Gr) === 0 && (r.f & zr) === 0)
    throw e;
  or(e, r);
}
function or(e, r) {
  if (!(r !== null && (r.f & xt) !== 0)) {
    for (; r !== null; ) {
      if ((r.f & Ea) !== 0) {
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
}
const sl = -7169;
function Le(e, r) {
  e.f = e.f & sl | r;
}
function qa(e) {
  (e.f & ht) !== 0 || e.deps === null ? Le(e, qe) : Le(e, Lt);
}
function Zi(e) {
  if (e !== null)
    for (const r of e)
      (r.f & Je) === 0 || (r.f & Ar) === 0 || (r.f ^= Ar, Zi(
        /** @type {Derived} */
        r.deps
      ));
}
function Qi(e, r, t) {
  (e.f & ze) !== 0 ? r.add(e) : (e.f & Lt) !== 0 && t.add(e), Zi(e.deps), Le(e, qe);
}
let Si = !1;
function ll() {
  Si || (Si = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const r of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            r[Dn]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function Xr(e) {
  var r = ie, t = ue;
  mt(null), Vt(null);
  try {
    return e();
  } finally {
    mt(r), Vt(t);
  }
}
function $i(e, r, t, a = t) {
  e.addEventListener(r, () => Xr(t));
  const i = (
    /** @type {any} */
    e[Dn]
  );
  i ? e[Dn] = () => {
    i(), a(!0);
  } : e[Dn] = () => a(!0), ll();
}
function ul(e) {
  let r = 0, t = Mr(0), a;
  return () => {
    Ja() && (n(t), go(() => (r === 0 && (a = Za(() => e(() => pn(t)))), r += 1, () => {
      Kt(() => {
        r -= 1, r === 0 && (a?.(), a = void 0, pn(t));
      });
    })));
  };
}
var dl = Er | Kr;
function fl(e, r, t, a) {
  new cl(e, r, t, a);
}
var pt, Va, gt, hr, nt, _t, $e, dt, Ut, xr, ar, Pr, hn, xn, Wt, Un, Te, vl, pl, Ta, gl, Ma, On, Cn, Na, Ra;
class cl {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(r, t, a, i) {
    G(this, Te);
    /** @type {Boundary | null} */
    lt(this, "parent");
    lt(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    lt(this, "transform_error");
    /** @type {TemplateNode} */
    G(this, pt);
    /** @type {TemplateNode | null} */
    G(this, Va, null);
    /** @type {BoundaryProps} */
    G(this, gt);
    /** @type {((anchor: Node) => void)} */
    G(this, hr);
    /** @type {Effect} */
    G(this, nt);
    /** @type {Effect | null} */
    G(this, _t, null);
    /** @type {Effect | null} */
    G(this, $e, null);
    /** @type {Effect | null} */
    G(this, dt, null);
    /** @type {DocumentFragment | null} */
    G(this, Ut, null);
    G(this, xr, 0);
    G(this, ar, 0);
    G(this, Pr, !1);
    /** @type {Set<Effect>} */
    G(this, hn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    G(this, xn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    G(this, Wt, null);
    G(this, Un, ul(() => (Y(this, Wt, Mr(d(this, xr))), () => {
      Y(this, Wt, null);
    })));
    Y(this, pt, r), Y(this, gt, t), Y(this, hr, (o) => {
      var c = (
        /** @type {Effect} */
        ue
      );
      c.b = this, c.f |= Ea, a(o);
    }), this.parent = /** @type {Effect} */
    ue.b, this.transform_error = i ?? this.parent?.transform_error ?? ((o) => o), Y(this, nt, Kn(() => {
      le(this, Te, Ma).call(this);
    }, dl));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(r) {
    Qi(r, d(this, hn), d(this, xn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!d(this, gt).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(r, t) {
    le(this, Te, Na).call(this, r, t), Y(this, xr, d(this, xr) + r), !(!d(this, Wt) || d(this, Pr)) && (Y(this, Pr, !0), Kt(() => {
      Y(this, Pr, !1), d(this, Wt) && Wr(d(this, Wt), d(this, xr));
    }));
  }
  get_effect_pending() {
    return d(this, Un).call(this), n(
      /** @type {Source<number>} */
      d(this, Wt)
    );
  }
  /** @param {unknown} error */
  error(r) {
    if (!d(this, gt).onerror && !d(this, gt).failed)
      throw r;
    K?.is_fork ? (d(this, _t) && K.skip_effect(d(this, _t)), d(this, $e) && K.skip_effect(d(this, $e)), d(this, dt) && K.skip_effect(d(this, dt)), K.oncommit(() => {
      le(this, Te, Ra).call(this, r);
    })) : le(this, Te, Ra).call(this, r);
  }
}
pt = new WeakMap(), Va = new WeakMap(), gt = new WeakMap(), hr = new WeakMap(), nt = new WeakMap(), _t = new WeakMap(), $e = new WeakMap(), dt = new WeakMap(), Ut = new WeakMap(), xr = new WeakMap(), ar = new WeakMap(), Pr = new WeakMap(), hn = new WeakMap(), xn = new WeakMap(), Wt = new WeakMap(), Un = new WeakMap(), Te = new WeakSet(), vl = function() {
  try {
    Y(this, _t, Tt(() => d(this, hr).call(this, d(this, pt))));
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
pl = function(r) {
  const t = d(this, gt).failed, { reset: a, invoke_onerror: i } = le(this, Te, Ta).call(this, r);
  Kt(i), t && Y(this, dt, Tt(() => {
    t(
      d(this, pt),
      () => r,
      () => a
    );
  }));
}, /**
 * Creates the `reset` function for a failed boundary, along with a function
 * that invokes `onerror` with it (if provided)
 * @param {unknown} error
 * @returns {{ reset: () => void, invoke_onerror: () => void }}
 */
Ta = function(r) {
  var t = !1, a = !1;
  const i = () => {
    if (t) {
      al();
      return;
    }
    t = !0, a && Gs(), d(this, dt) !== null && wr(d(this, dt), () => {
      Y(this, dt, null);
    }), le(this, Te, Cn).call(this, () => {
      le(this, Te, Ma).call(this);
    });
  };
  return { reset: i, invoke_onerror: () => {
    try {
      a = !0, d(this, gt).onerror?.(r, i), a = !1;
    } catch (c) {
      or(c, d(this, nt) && d(this, nt).parent);
    }
  } };
}, gl = function() {
  const r = d(this, gt).pending;
  r && (this.is_pending = !0, Y(this, $e, Tt(() => r(d(this, pt)))), Kt(() => {
    var t = Y(this, Ut, document.createDocumentFragment()), a = kr();
    t.append(a), Y(this, _t, le(this, Te, Cn).call(this, () => Tt(() => d(this, hr).call(this, a)))), d(this, ar) === 0 && (d(this, pt).before(t), Y(this, Ut, null), wr(
      /** @type {Effect} */
      d(this, $e),
      () => {
        Y(this, $e, null);
      }
    ), le(this, Te, On).call(
      this,
      /** @type {Batch} */
      K
    ));
  }));
}, Ma = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), Y(this, ar, 0), Y(this, xr, 0), Y(this, _t, Tt(() => {
      d(this, hr).call(this, d(this, pt));
    })), d(this, ar) > 0) {
      var r = Y(this, Ut, document.createDocumentFragment());
      Xa(d(this, _t), r);
      const t = (
        /** @type {(anchor: Node) => void} */
        d(this, gt).pending
      );
      Y(this, $e, Tt(() => t(d(this, pt))));
    } else
      le(this, Te, On).call(
        this,
        /** @type {Batch} */
        K
      );
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {Batch} batch
 */
On = function(r) {
  this.is_pending = !1, r.transfer_effects(d(this, hn), d(this, xn));
}, /**
 * @template T
 * @param {() => T} fn
 */
Cn = function(r) {
  var t = ue, a = ie, i = rt;
  Vt(d(this, nt)), mt(d(this, nt)), Ur(d(this, nt).ctx);
  try {
    return Tr.ensure(), r();
  } catch (o) {
    return Xi(o), null;
  } finally {
    Vt(t), mt(a), Ur(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Na = function(r, t) {
  var a;
  if (!this.has_pending_snippet()) {
    this.parent && le(a = this.parent, Te, Na).call(a, r, t);
    return;
  }
  Y(this, ar, d(this, ar) + r), d(this, ar) === 0 && (le(this, Te, On).call(this, t), d(this, $e) && wr(d(this, $e), () => {
    Y(this, $e, null);
  }), d(this, Ut) && (d(this, pt).before(d(this, Ut)), Y(this, Ut, null)));
}, /**
 * @param {unknown} error
 */
Ra = function(r) {
  d(this, _t) && (ot(d(this, _t)), Y(this, _t, null)), d(this, $e) && (ot(d(this, $e)), Y(this, $e, null)), d(this, dt) && (ot(d(this, dt)), Y(this, dt, null));
  let t = d(this, gt).failed;
  const a = (i) => {
    const { reset: o, invoke_onerror: c } = le(this, Te, Ta).call(this, i);
    c(), t && Y(this, dt, le(this, Te, Cn).call(this, () => {
      try {
        return Tt(() => {
          var p = (
            /** @type {Effect} */
            ue
          );
          p.b = this, p.f |= Ea, t(
            d(this, pt),
            () => i,
            () => o
          );
        });
      } catch (p) {
        return or(
          p,
          /** @type {Effect} */
          d(this, nt).parent
        ), null;
      }
    }));
  };
  Kt(() => {
    var i;
    try {
      i = this.transform_error(r);
    } catch (o) {
      or(o, d(this, nt) && d(this, nt).parent);
      return;
    }
    i !== null && typeof i == "object" && typeof /** @type {any} */
    i.then == "function" ? i.then(
      a,
      /** @param {unknown} e */
      (o) => or(o, d(this, nt) && d(this, nt).parent)
    ) : a(i);
  });
};
function _l(e, r, t, a) {
  const i = za;
  var o = e.filter((w) => !w.settled), c = r.map(i);
  if (t.length === 0 && o.length === 0) {
    a(c);
    return;
  }
  var p = (
    /** @type {Effect} */
    ue
  ), v = hl(), _ = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((w) => w.promise)) : null;
  function h(w) {
    if ((p.f & xt) === 0) {
      v();
      try {
        a([...c, ...w]);
      } catch (S) {
        or(S, p);
      }
      Bn();
    }
  }
  var k = eo();
  if (t.length === 0) {
    _.then(() => h([])).finally(k);
    return;
  }
  function b() {
    Promise.all(t.map((w) => /* @__PURE__ */ xl(w))).then(h).catch((w) => or(w, p)).finally(k);
  }
  _ ? _.then(() => {
    v(), b(), Bn();
  }) : b();
}
function hl() {
  var e = (
    /** @type {Effect} */
    ue
  ), r = ie, t = rt, a = (
    /** @type {Batch} */
    K
  );
  return function(o = !0) {
    Vt(e), mt(r), Ur(t), o && (e.f & xt) === 0 && (a?.activate(), a?.apply());
  };
}
function Bn(e = !0) {
  Vt(null), mt(null), Ur(null), e && K?.deactivate();
}
function eo() {
  var e = (
    /** @type {Effect} */
    ue
  ), r = e.b, t = (
    /** @type {Batch} */
    K
  ), a = !!r?.is_rendered();
  return r?.update_pending_count(1, t), t.increment(a, e), () => {
    r?.update_pending_count(-1, t), t.decrement(a, e);
  };
}
// @__NO_SIDE_EFFECTS__
function za(e) {
  var r = Je | ze;
  return ue !== null && (ue.f |= Kr), {
    ctx: rt,
    deps: null,
    effects: null,
    equals: Ui,
    f: r,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      He
    ),
    wv: 0,
    parent: ue,
    ac: null
  };
}
const sn = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function xl(e, r, t) {
  let a = (
    /** @type {Effect | null} */
    ue
  );
  a === null && Vs();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = Mr(
    /** @type {V} */
    He
  ), c = !ie, p = /* @__PURE__ */ new Set();
  return Fl(() => {
    var v = (
      /** @type {Effect} */
      ue
    ), _ = Hi();
    i = _.promise;
    try {
      Promise.resolve(e()).then(_.resolve, (w) => {
        w !== bn && _.reject(w);
      }).finally(Bn);
    } catch (w) {
      _.reject(w), Bn();
    }
    var h = (
      /** @type {Batch} */
      K
    );
    if (c) {
      if ((v.f & Gr) !== 0)
        var k = eo();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        a.b?.is_rendered()
      )
        h.async_deriveds.get(v)?.reject(sn);
      else
        for (const w of p.values())
          w.reject(sn);
      p.add(_), h.async_deriveds.set(v, _);
    }
    const b = (w, S = void 0) => {
      k?.(), p.delete(_), S !== sn && (h.activate(), S ? (o.f |= sr, Wr(o, S)) : ((o.f & sr) !== 0 && (o.f ^= sr), Wr(o, w)), h.deactivate());
    };
    _.promise.then(b, (w) => b(null, w || "unknown"));
  }), Ga(() => {
    for (const v of p)
      v.reject(sn);
  }), new Promise((v) => {
    function _(h) {
      function k() {
        h === i ? v(o) : _(i);
      }
      h.then(k, k);
    }
    _(i);
  });
}
// @__NO_SIDE_EFFECTS__
function re(e) {
  const r = /* @__PURE__ */ za(e);
  return mo(r), r;
}
// @__NO_SIDE_EFFECTS__
function yl(e) {
  const r = /* @__PURE__ */ za(e);
  return r.equals = Wi, r;
}
function ml(e) {
  var r = e.effects;
  if (r !== null) {
    e.effects = null;
    for (var t = 0; t < r.length; t += 1)
      ot(
        /** @type {Effect} */
        r[t]
      );
  }
}
function Ua(e) {
  var r, t = ue, a = e.parent;
  if (!lr && a !== null && e.v !== He && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (a.f & (xt | tt)) !== 0)
    return rl(), e.v;
  Vt(a);
  try {
    e.f &= ~Ar, ml(e), r = So(e);
  } finally {
    Vt(t);
  }
  return r;
}
function to(e) {
  var r = Ua(e);
  if (!e.equals(r) && (e.wv = ko(), (!K?.is_fork || e.deps === null) && (K !== null ? (K.capture(e, r, !0), La?.capture(e, r, !0)) : e.v = r, e.deps === null))) {
    Le(e, qe);
    return;
  }
  lr || (Nt !== null ? (Ja() || K?.is_fork) && Nt.set(e, r) : qa(e));
}
function bl(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && (r.teardown?.(), r.ac !== null && Xr(() => {
        r.ac.abort(bn), r.ac = null;
      }), r.fn !== null && (r.teardown = Ds), _n(r, 0), Ka(r));
}
function ro(e) {
  if (e.effects !== null)
    for (const r of e.effects)
      r.teardown && r.fn !== null && Jr(r);
}
let ga = null, Lr = null, K = null, La = null, Nt = null, Da = null, vn = !1, _a = !1, Cr = null, In = null;
var Ei = 0;
let kl = 1;
var Fr, ir, yr, jr, Vr, Br, Yt, Hr, at, yn, Jt, St, It, qr, mr, xe, Oa, ln, Ca, no, ao, Or, wl, un;
const Wn = class Wn {
  constructor() {
    G(this, xe);
    lt(this, "id", kl++);
    /** True as soon as `#process` was called */
    G(this, Fr, !1);
    lt(this, "linked", !0);
    /** @type {Batch | null} */
    G(this, ir, null);
    /** @type {Batch | null} */
    G(this, yr, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    lt(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    lt(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    lt(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    G(this, jr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    G(this, Vr, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    G(this, Br, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    G(this, Yt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    G(this, Hr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    G(this, at, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    G(this, yn, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    G(this, Jt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    G(this, St, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    G(this, It, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    G(this, qr, /* @__PURE__ */ new Set());
    lt(this, "is_fork", !1);
    G(this, mr, !1);
    Lr === null ? ga = Lr = this : (Y(Lr, yr, this), Y(this, ir, Lr)), Lr = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(r) {
    d(this, It).has(r) || d(this, It).set(r, { d: [], m: [] }), d(this, qr).delete(r);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(r, t = (a) => this.schedule(a)) {
    var a = d(this, It).get(r);
    if (a) {
      d(this, It).delete(r);
      for (var i of a.d)
        Le(i, ze), t(i);
      for (i of a.m)
        Le(i, Lt), t(i);
    }
    d(this, qr).add(r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(r, t, a = !1) {
    r.v !== He && !this.previous.has(r) && this.previous.set(r, r.v), (r.f & sr) === 0 && (this.current.set(r, [t, a]), Nt?.set(r, t)), this.is_fork || (r.v = t);
  }
  activate() {
    K = this;
  }
  deactivate() {
    K = null, Nt = null;
  }
  flush() {
    try {
      _a = !0, K = this, le(this, xe, ln).call(this);
    } finally {
      Ei = 0, Da = null, Cr = null, In = null, _a = !1, K = null, Nt = null, Ft.clear();
    }
  }
  discard() {
    for (const r of d(this, Vr)) r(this);
    d(this, Vr).clear();
    for (const r of this.async_deriveds.values())
      r.reject(sn);
    le(this, xe, un).call(this), d(this, Hr)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(r) {
    d(this, yn).push(r);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(r, t) {
    if (Y(this, Br, d(this, Br) + 1), r) {
      let a = d(this, Yt).get(t) ?? 0;
      d(this, Yt).set(t, a + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(r, t) {
    if (Y(this, Br, d(this, Br) - 1), r) {
      let a = d(this, Yt).get(t) ?? 0;
      a === 1 ? d(this, Yt).delete(t) : d(this, Yt).set(t, a - 1);
    }
    d(this, mr) || (Y(this, mr, !0), Kt(() => {
      Y(this, mr, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(r, t) {
    for (const a of r)
      d(this, Jt).add(a);
    for (const a of t)
      d(this, St).add(a);
    r.clear(), t.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(r) {
    d(this, jr).add(r);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(r) {
    d(this, Vr).add(r);
  }
  settled() {
    return (d(this, Hr) ?? Y(this, Hr, Hi())).promise;
  }
  static ensure() {
    if (K === null) {
      const r = K = new Wn();
      !_a && !vn && Kt(() => {
        d(r, Fr) || r.flush();
      });
    }
    return K;
  }
  apply() {
    {
      Nt = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(r) {
    if (Da = r, r.b?.is_pending && (r.f & (zr | Gn | qi)) !== 0 && (r.f & Gr) === 0) {
      r.b.defer_effect(r);
      return;
    }
    for (var t = r; t.parent !== null; ) {
      t = t.parent;
      var a = t.f;
      if (Cr !== null && t === ue && (ie === null || (ie.f & Je) === 0))
        return;
      if ((a & (Xt | yt)) !== 0) {
        if ((a & qe) === 0)
          return;
        t.f ^= qe;
      }
    }
    d(this, at).push(t);
  }
};
Fr = new WeakMap(), ir = new WeakMap(), yr = new WeakMap(), jr = new WeakMap(), Vr = new WeakMap(), Br = new WeakMap(), Yt = new WeakMap(), Hr = new WeakMap(), at = new WeakMap(), yn = new WeakMap(), Jt = new WeakMap(), St = new WeakMap(), It = new WeakMap(), qr = new WeakMap(), mr = new WeakMap(), xe = new WeakSet(), Oa = function() {
  if (this.is_fork) return !0;
  for (const a of d(this, Yt).keys()) {
    for (var r = a, t = !1; r.parent !== null; ) {
      if (d(this, It).has(r)) {
        t = !0;
        break;
      }
      r = r.parent;
    }
    if (!t)
      return !0;
  }
  return !1;
}, ln = function() {
  var v, _, h;
  Y(this, Fr, !0), Ei++ > 1e3 && (le(this, xe, un).call(this), El());
  for (const k of d(this, Jt))
    d(this, St).delete(k), Le(k, ze), this.schedule(k);
  for (const k of d(this, St))
    Le(k, Lt), this.schedule(k);
  const r = d(this, at);
  Y(this, at, []), this.apply();
  var t = Cr = [], a = [], i = In = [];
  for (const k of r)
    try {
      le(this, xe, Ca).call(this, k, t, a);
    } catch (b) {
      throw so(k), le(this, xe, Oa).call(this) || this.discard(), b;
    }
  if (K = null, i.length > 0) {
    var o = Wn.ensure();
    for (const k of i)
      o.schedule(k);
  }
  if (Cr = null, In = null, le(this, xe, Oa).call(this)) {
    le(this, xe, Or).call(this, a), le(this, xe, Or).call(this, t);
    for (const [k, b] of d(this, It))
      oo(k, b);
    i.length > 0 && /** @type {unknown} */
    le(v = K, xe, ln).call(v);
    return;
  }
  const c = le(this, xe, no).call(this);
  if (c) {
    le(this, xe, Or).call(this, a), le(this, xe, Or).call(this, t), le(_ = c, xe, ao).call(_, this);
    return;
  }
  d(this, Jt).clear(), d(this, St).clear();
  for (const k of d(this, jr)) k(this);
  d(this, jr).clear(), La = this, Ai(a), Ai(t), La = null, d(this, Hr)?.resolve();
  var p = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    K
  );
  if (d(this, Br) === 0 && (d(this, at).length === 0 || p !== null) && le(this, xe, un).call(this), d(this, at).length > 0)
    if (p !== null) {
      const k = p;
      d(k, at).push(...d(this, at).filter((b) => !d(k, at).includes(b)));
    } else
      p = this;
  p !== null && (Ft.clear(), le(h = p, xe, ln).call(h));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Ca = function(r, t, a) {
  r.f ^= qe;
  for (var i = r.first; i !== null; ) {
    var o = i.f, c = (o & (yt | Xt)) !== 0, p = c && (o & qe) !== 0, v = p || (o & tt) !== 0 || d(this, It).has(i);
    if (!v && i.fn !== null) {
      c ? i.f ^= qe : (o & zr) !== 0 ? t.push(i) : wn(i) && ((o & Mt) !== 0 && d(this, St).add(i), Jr(i));
      var _ = i.first;
      if (_ !== null) {
        i = _;
        continue;
      }
    }
    for (; i !== null; ) {
      var h = i.next;
      if (h !== null) {
        i = h;
        break;
      }
      i = i.parent;
    }
  }
}, no = function() {
  for (var r = d(this, ir); r !== null; ) {
    if (!r.is_fork) {
      for (const [t, [, a]] of this.current)
        if (r.current.has(t) && !a)
          return r;
    }
    r = d(r, ir);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
ao = function(r) {
  var a;
  for (const [i, o] of r.current)
    !this.previous.has(i) && r.previous.has(i) && this.previous.set(i, r.previous.get(i)), this.current.set(i, o);
  for (const [i, o] of r.async_deriveds) {
    const c = this.async_deriveds.get(i);
    c && o.promise.then(c.resolve).catch(c.reject);
  }
  r.async_deriveds.clear(), this.transfer_effects(d(r, Jt), d(r, St));
  const t = (i) => {
    var o = i.reactions;
    if (o !== null && !((i.f & Je) !== 0 && (i.f & (ze | Lt)) === 0))
      for (const v of o) {
        var c = v.f;
        if ((c & Je) !== 0)
          t(
            /** @type {Derived} */
            v
          );
        else {
          var p = (
            /** @type {Effect} */
            v
          );
          c & (Ir | Mt) && !this.async_deriveds.has(p) && (d(this, St).delete(p), Le(p, ze), this.schedule(p));
        }
      }
  };
  for (const i of this.current.keys())
    t(i);
  this.oncommit(() => r.discard()), le(a = r, xe, un).call(a), K = this, le(this, xe, ln).call(this);
}, /**
 * @param {Effect[]} effects
 */
Or = function(r) {
  for (var t = 0; t < r.length; t += 1)
    Qi(r[t], d(this, Jt), d(this, St));
}, wl = function() {
  var k;
  for (let b = ga; b !== null; b = d(b, yr)) {
    var r = b.id < this.id, t = [];
    for (const [w, [S, C]] of this.current) {
      if (b.current.has(w)) {
        var a = (
          /** @type {[any, boolean]} */
          b.current.get(w)[0]
        );
        if (r && S !== a)
          b.current.set(w, [S, C]);
        else
          continue;
      }
      t.push(w);
    }
    if (r)
      for (const [w, S] of this.async_deriveds) {
        const C = b.async_deriveds.get(w);
        C && S.promise.then(C.resolve).catch(C.reject);
      }
    var i = [...b.current.keys()].filter(
      (w) => !/** @type {[any, boolean]} */
      b.current.get(w)[1]
    );
    if (!(!d(b, Fr) || i.length === 0)) {
      var o = i.filter((w) => !this.current.has(w));
      if (o.length === 0)
        r && b.discard();
      else if (t.length > 0) {
        if (r)
          for (const w of d(this, qr))
            b.unskip_effect(w, (S) => {
              var C;
              (S.f & (Mt | Ir)) !== 0 ? b.schedule(S) : le(C = b, xe, Or).call(C, [S]);
            });
        b.activate();
        var c = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Map();
        for (var v of t)
          io(v, o, c, p);
        p = /* @__PURE__ */ new Map();
        var _ = [...b.current].filter(([w, S]) => {
          const C = this.current.get(w);
          return C ? C[0] !== S[0] || C[1] !== S[1] : !0;
        }).map(([w]) => w);
        if (_.length > 0)
          for (const w of d(this, yn))
            (w.f & (xt | tt | jn)) === 0 && Wa(w, _, p) && ((w.f & (Ir | Mt)) !== 0 ? (Le(w, ze), b.schedule(w)) : d(b, Jt).add(w));
        if (d(b, at).length > 0 && !d(b, mr)) {
          b.apply();
          for (var h of d(b, at))
            le(k = b, xe, Ca).call(k, h, [], []);
          Y(b, at, []);
        }
        b.deactivate();
      }
    }
  }
}, un = function() {
  if (this.linked) {
    var r = d(this, ir), t = d(this, yr);
    r === null ? ga = t : Y(r, yr, t), t === null ? Lr = r : Y(t, ir, r), this.linked = !1;
  }
};
let Tr = Wn;
function Sl(e) {
  var r = vn;
  vn = !0;
  try {
    for (var t; ; ) {
      if (ol(), K === null)
        return (
          /** @type {T} */
          t
        );
      K.flush();
    }
  } finally {
    vn = r;
  }
}
function El() {
  try {
    Us();
  } catch (e) {
    or(e, Da);
  }
}
let zt = null;
function Ai(e) {
  var r = e.length;
  if (r !== 0) {
    for (var t = 0; t < r; ) {
      var a = e[t++];
      if ((a.f & (xt | tt)) === 0 && wn(a) && (zt = /* @__PURE__ */ new Set(), Jr(a), a.deps === null && a.first === null && a.nodes === null && a.teardown === null && a.ac === null && ho(a), zt?.size > 0)) {
        Ft.clear();
        for (const i of zt) {
          if ((i.f & (xt | tt)) !== 0) continue;
          const o = [i];
          let c = i.parent;
          for (; c !== null; )
            zt.has(c) && (zt.delete(c), o.push(c)), c = c.parent;
          for (let p = o.length - 1; p >= 0; p--) {
            const v = o[p];
            (v.f & (xt | tt)) === 0 && Jr(v);
          }
        }
        zt.clear();
      }
    }
    zt = null;
  }
}
function io(e, r, t, a) {
  if (!t.has(e) && (t.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & Je) !== 0 ? io(
        /** @type {Derived} */
        i,
        r,
        t,
        a
      ) : (o & (Ir | Mt)) !== 0 && (o & ze) === 0 && Wa(i, r, a) && (Le(i, ze), Ya(
        /** @type {Effect} */
        i
      ));
    }
}
function Wa(e, r, t) {
  const a = t.get(e);
  if (a !== void 0) return a;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (Fn.call(r, i))
        return !0;
      if ((i.f & Je) !== 0 && Wa(
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
function Ya(e) {
  K.schedule(e);
}
function oo(e, r) {
  if (!((e.f & yt) !== 0 && (e.f & qe) !== 0)) {
    (e.f & ze) !== 0 ? r.d.push(e) : (e.f & Lt) !== 0 && r.m.push(e), Le(e, qe);
    for (var t = e.first; t !== null; )
      oo(t, r), t = t.next;
  }
}
function so(e) {
  Le(e, qe);
  for (var r = e.first; r !== null; )
    so(r), r = r.next;
}
let Hn = /* @__PURE__ */ new Set();
const Ft = /* @__PURE__ */ new Map();
let lo = !1;
function Mr(e, r) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Ui,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function Z(e, r) {
  const t = Mr(e);
  return mo(t), t;
}
// @__NO_SIDE_EFFECTS__
function Al(e, r = !1, t = !0) {
  const a = Mr(e);
  return r || (a.equals = Wi), a;
}
function m(e, r, t = !1) {
  ie !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Rt || (ie.f & jn) !== 0) && Gi() && (ie.f & (Je | Mt | Ir | jn)) !== 0 && (jt === null || !jt.has(e)) && Js();
  let a = t ? et(r) : r;
  return Wr(e, a, In);
}
function Wr(e, r, t = null) {
  if (!e.equals(r)) {
    lr ? Ft.set(e, r) : Ft.has(e) || Ft.set(e, e.v);
    var a = Tr.ensure();
    if (a.capture(e, r), (e.f & Je) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & ze) !== 0 && Ua(i), Nt === null && qa(i);
    }
    e.wv = ko(), uo(e, ze, t), ue !== null && (ue.f & qe) !== 0 && (ue.f & (yt | Xt)) === 0 && (vt === null ? Bl([e]) : vt.push(e)), !a.is_fork && Hn.size > 0 && !lo && Tl();
  }
  return r;
}
function Tl() {
  lo = !1;
  for (const e of Hn) {
    (e.f & qe) !== 0 && Le(e, Lt);
    let r;
    try {
      r = wn(e);
    } catch {
      r = !0;
    }
    r && Jr(e);
  }
  Hn.clear();
}
function pn(e) {
  m(e, e.v + 1);
}
function uo(e, r, t) {
  var a = e.reactions;
  if (a !== null)
    for (var i = a.length, o = 0; o < i; o++) {
      var c = a[o], p = c.f, v = (p & ze) === 0;
      if (v && Le(c, r), (p & jn) !== 0)
        Hn.add(
          /** @type {Effect} */
          c
        );
      else if ((p & Je) !== 0) {
        var _ = (
          /** @type {Derived} */
          c
        );
        Nt?.delete(_), (p & Ar) === 0 && (p & ht && (ue === null || (ue.f & Vn) === 0) && (c.f |= Ar), uo(_, Lt, t));
      } else if (v) {
        var h = (
          /** @type {Effect} */
          c
        );
        (p & Mt) !== 0 && zt !== null && zt.add(h), t !== null ? t.push(h) : Ya(h);
      }
    }
}
function et(e) {
  if (typeof e != "object" || e === null || cn in e)
    return e;
  const r = Bi(e);
  if (r !== Rs && r !== Ls)
    return e;
  var t = /* @__PURE__ */ new Map(), a = Ha(e), i = /* @__PURE__ */ Z(0), o = Sr, c = (p) => {
    if (Sr === o)
      return p();
    var v = ie, _ = Sr;
    mt(null), Ri(o);
    var h = p();
    return mt(v), Ri(_), h;
  };
  return a && t.set("length", /* @__PURE__ */ Z(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(p, v, _) {
        (!("value" in _) || _.configurable === !1 || _.enumerable === !1 || _.writable === !1) && Ws();
        var h = t.get(v);
        return h === void 0 ? c(() => {
          var k = /* @__PURE__ */ Z(_.value);
          return t.set(v, k), k;
        }) : m(h, _.value, !0), !0;
      },
      deleteProperty(p, v) {
        var _ = t.get(v);
        if (_ === void 0) {
          if (v in p) {
            const h = c(() => /* @__PURE__ */ Z(He));
            t.set(v, h), pn(i);
          }
        } else
          m(_, He), pn(i);
        return !0;
      },
      get(p, v, _) {
        if (v === cn)
          return e;
        var h = t.get(v), k = v in p;
        if (h === void 0 && (!k || fn(p, v)?.writable) && (h = c(() => {
          var w = et(k ? p[v] : He), S = /* @__PURE__ */ Z(w);
          return S;
        }), t.set(v, h)), h !== void 0) {
          var b = n(h);
          return b === He ? void 0 : b;
        }
        return Reflect.get(p, v, _);
      },
      getOwnPropertyDescriptor(p, v) {
        var _ = Reflect.getOwnPropertyDescriptor(p, v);
        if (_ && "value" in _) {
          var h = t.get(v);
          h && (_.value = n(h));
        } else if (_ === void 0) {
          var k = t.get(v), b = k?.v;
          if (k !== void 0 && b !== He)
            return {
              enumerable: !0,
              configurable: !0,
              value: b,
              writable: !0
            };
        }
        return _;
      },
      has(p, v) {
        if (v === cn)
          return !0;
        var _ = t.get(v), h = _ !== void 0 && _.v !== He || Reflect.has(p, v);
        if (_ !== void 0 || ue !== null && (!h || fn(p, v)?.writable)) {
          _ === void 0 && (_ = c(() => {
            var b = h ? et(p[v]) : He, w = /* @__PURE__ */ Z(b);
            return w;
          }), t.set(v, _));
          var k = n(_);
          if (k === He)
            return !1;
        }
        return h;
      },
      set(p, v, _, h) {
        var k = t.get(v), b = v in p;
        if (a && v === "length")
          for (var w = _; w < /** @type {Source<number>} */
          k.v; w += 1) {
            var S = t.get(w + "");
            S !== void 0 ? m(S, He) : w in p && (S = c(() => /* @__PURE__ */ Z(He)), t.set(w + "", S));
          }
        if (k === void 0)
          (!b || fn(p, v)?.writable) && (k = c(() => /* @__PURE__ */ Z(void 0)), m(k, et(_)), t.set(v, k));
        else {
          b = k.v !== He;
          var C = c(() => et(_));
          m(k, C);
        }
        var T = Reflect.getOwnPropertyDescriptor(p, v);
        if (T?.set && T.set.call(h, _), !b) {
          if (a && typeof v == "string") {
            var Q = (
              /** @type {Source<number>} */
              t.get("length")
            ), ke = Number(v);
            Number.isInteger(ke) && ke >= Q.v && m(Q, ke + 1);
          }
          pn(i);
        }
        return !0;
      },
      ownKeys(p) {
        n(i);
        var v = Reflect.ownKeys(p).filter((k) => {
          var b = t.get(k);
          return b === void 0 || b.v !== He;
        });
        for (var [_, h] of t)
          h.v !== He && !(_ in p) && v.push(_);
        return v;
      },
      setPrototypeOf() {
        Ys();
      }
    }
  );
}
function Ti(e) {
  try {
    if (e !== null && typeof e == "object" && cn in e)
      return e[cn];
  } catch {
  }
  return e;
}
function Ml(e, r) {
  return Object.is(Ti(e), Ti(r));
}
var Mi, fo, co, vo;
function Nl() {
  if (Mi === void 0) {
    Mi = window, fo = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, r = Node.prototype, t = Text.prototype;
    co = fn(r, "firstChild").get, vo = fn(r, "nextSibling").get, ki(e) && (e[Aa] = void 0, e[Ln] = null, e[Fs] = void 0, e.__e = void 0), ki(t) && (t[on] = void 0);
  }
}
function kr(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Yr(e) {
  return (
    /** @type {TemplateNode | null} */
    co.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function kn(e) {
  return (
    /** @type {TemplateNode | null} */
    vo.call(e)
  );
}
function g(e, r) {
  return /* @__PURE__ */ Yr(e);
}
function tr(e, r = !1) {
  {
    var t = /* @__PURE__ */ Yr(e);
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ kn(t) : t;
  }
}
function x(e, r = 1, t = !1) {
  let a = e;
  for (; r--; )
    a = /** @type {TemplateNode} */
    /* @__PURE__ */ kn(a);
  return a;
}
function Rl(e) {
  e.textContent = "";
}
function Ll(e, r, t) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    t ? document.createElement(e, { is: t }) : document.createElement(e)
  );
}
function Dl(e) {
  ue === null && (ie === null && zs(), qs()), lr && Hs();
}
function Ol(e, r) {
  var t = r.last;
  t === null ? r.last = r.first = e : (t.next = e, e.prev = t, r.last = e);
}
function Zt(e, r) {
  var t = ue;
  t !== null && (t.f & tt) !== 0 && (e |= tt);
  var a = {
    ctx: rt,
    deps: null,
    nodes: null,
    f: e | ze | ht,
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
  K?.register_created_effect(a);
  var i = a;
  if ((e & zr) !== 0)
    Cr !== null ? Cr.push(a) : Tr.ensure().schedule(a);
  else if (r !== null) {
    try {
      Jr(a);
    } catch (c) {
      throw ot(a), c;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Kr) === 0 && (i = i.first, (e & Mt) !== 0 && (e & Er) !== 0 && i !== null && (i.f |= Er));
  }
  if (i !== null && (i.parent = t, t !== null && Ol(i, t), ie !== null && (ie.f & Je) !== 0 && (e & Xt) === 0)) {
    var o = (
      /** @type {Derived} */
      ie
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return a;
}
function Ja() {
  return ie !== null && !Rt;
}
function Ga(e) {
  const r = Zt(Gn, null);
  return Le(r, qe), r.teardown = e, r;
}
function Cl(e) {
  Dl();
  var r = (
    /** @type {Effect} */
    ue.f
  ), t = !ie && (r & yt) !== 0 && rt !== null && !rt.i;
  if (t) {
    var a = (
      /** @type {ComponentContext} */
      rt
    );
    (a.e ?? (a.e = [])).push(e);
  } else
    return po(e);
}
function po(e) {
  return Zt(zr | Ps, e);
}
function Il(e) {
  Tr.ensure();
  const r = Zt(Xt | Kr, e);
  return (t = {}) => new Promise((a) => {
    t.outro ? wr(r, () => {
      ot(r), a(void 0);
    }) : (ot(r), a(void 0));
  });
}
function Pl(e) {
  return Zt(zr, e);
}
function Fl(e) {
  return Zt(Ir | Kr, e);
}
function go(e, r = 0) {
  return Zt(Gn | r, e);
}
function M(e, r = [], t = [], a = []) {
  _l(a, r, t, (i) => {
    Zt(Gn, () => {
      e(...i.map(n));
    });
  });
}
function Kn(e, r = 0) {
  var t = Zt(Mt | r, e);
  return t;
}
function Tt(e) {
  return Zt(yt | Kr, e);
}
function _o(e) {
  var r = e.teardown;
  if (r !== null) {
    const t = lr, a = ie;
    Ni(!0), mt(null);
    try {
      r.call(null);
    } finally {
      Ni(t), mt(a);
    }
  }
}
function Ka(e, r = !1) {
  var t = e.first;
  for (e.first = e.last = null; t !== null; ) {
    const i = t.ac;
    i !== null && Xr(() => {
      i.abort(bn);
    });
    var a = t.next;
    (t.f & Xt) !== 0 ? t.parent = null : ot(t, r), t = a;
  }
}
function jl(e) {
  for (var r = e.first; r !== null; ) {
    var t = r.next;
    (r.f & yt) === 0 && ot(r), r = t;
  }
}
function ot(e, r = !0) {
  var t = !1;
  (r || (e.f & Is) !== 0) && e.nodes !== null && e.nodes.end !== null && (Vl(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), t = !0), e.f |= wi, Ka(e, r && !t), _n(e, 0);
  var a = e.nodes && e.nodes.t;
  if (a !== null)
    for (const o of a)
      o.stop();
  _o(e), e.f ^= wi, e.f |= xt;
  var i = e.parent;
  i !== null && i.first !== null && ho(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Vl(e, r) {
  for (; e !== null; ) {
    var t = e === r ? null : /* @__PURE__ */ kn(e);
    e.remove(), e = t;
  }
}
function ho(e) {
  var r = e.parent, t = e.prev, a = e.next;
  t !== null && (t.next = a), a !== null && (a.prev = t), r !== null && (r.first === e && (r.first = a), r.last === e && (r.last = t));
}
function wr(e, r, t = !0) {
  var a = [];
  xo(e, a, !0);
  var i = () => {
    t && ot(e), r && r();
  }, o = a.length;
  if (o > 0) {
    var c = () => --o || i();
    for (var p of a)
      p.out(c);
  } else
    i();
}
function xo(e, r, t) {
  if ((e.f & tt) === 0) {
    e.f ^= tt;
    var a = e.nodes && e.nodes.t;
    if (a !== null)
      for (const p of a)
        (p.is_global || t) && r.push(p);
    for (var i = e.first; i !== null; ) {
      var o = i.next;
      if ((i.f & Xt) === 0) {
        var c = (i.f & Er) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (i.f & yt) !== 0 && (e.f & Mt) !== 0;
        xo(i, r, c ? t : !1);
      }
      i = o;
    }
  }
}
function qn(e) {
  yo(e, !0);
}
function yo(e, r) {
  if ((e.f & tt) !== 0) {
    e.f ^= tt, (e.f & qe) === 0 && (Le(e, ze), Tr.ensure().schedule(e));
    for (var t = e.first; t !== null; ) {
      var a = t.next, i = (t.f & Er) !== 0 || (t.f & yt) !== 0;
      yo(t, i ? r : !1), t = a;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const c of o)
        (c.is_global || r) && c.in();
  }
}
function Xa(e, r) {
  if (e.nodes)
    for (var t = e.nodes.start, a = e.nodes.end; t !== null; ) {
      var i = t === a ? null : /* @__PURE__ */ kn(t);
      r.append(t), t = i;
    }
}
let Pn = !1, lr = !1;
function Ni(e) {
  lr = e;
}
let ie = null, Rt = !1;
function mt(e) {
  ie = e;
}
let ue = null;
function Vt(e) {
  ue = e;
}
let jt = null;
function mo(e) {
  ie !== null && (jt ?? (jt = /* @__PURE__ */ new Set())).add(e);
}
let it = null, ut = 0, vt = null;
function Bl(e) {
  vt = e;
}
let bo = 1, gr = 0, Sr = gr;
function Ri(e) {
  Sr = e;
}
function ko() {
  return ++bo;
}
function wn(e) {
  var r = e.f;
  if ((r & ze) !== 0)
    return !0;
  if (r & Je && (e.f &= ~Ar), (r & Lt) !== 0) {
    for (var t = (
      /** @type {Value[]} */
      e.deps
    ), a = t.length, i = 0; i < a; i++) {
      var o = t[i];
      if (wn(
        /** @type {Derived} */
        o
      ) && to(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (r & ht) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Nt === null && Le(e, qe);
  }
  return !1;
}
function wo(e, r, t = !0) {
  var a = e.reactions;
  if (a !== null && !(jt !== null && jt.has(e)))
    for (var i = 0; i < a.length; i++) {
      var o = a[i];
      (o.f & Je) !== 0 ? wo(
        /** @type {Derived} */
        o,
        r,
        !1
      ) : r === o && (t ? Le(o, ze) : (o.f & qe) !== 0 && Le(o, Lt), Ya(
        /** @type {Effect} */
        o
      ));
    }
}
function So(e) {
  var C;
  var r = it, t = ut, a = vt, i = ie, o = jt, c = rt, p = Rt, v = Sr, _ = e.f;
  it = /** @type {null | Value[]} */
  null, ut = 0, vt = null, ie = (_ & (yt | Xt)) === 0 ? e : null, jt = null, Ur(e.ctx), Rt = !1, Sr = ++gr, e.ac !== null && (Xr(() => {
    e.ac.abort(bn);
  }), e.ac = null);
  try {
    e.f |= Vn;
    var h = (
      /** @type {Function} */
      e.fn
    ), k = h();
    e.f |= Gr;
    var b = e.deps, w = K?.is_fork;
    if (it !== null) {
      var S;
      if (w || _n(e, ut), b !== null && ut > 0)
        for (b.length = ut + it.length, S = 0; S < it.length; S++)
          b[ut + S] = it[S];
      else
        e.deps = b = it;
      if (Ja() && (e.f & ht) !== 0)
        for (S = ut; S < b.length; S++)
          ((C = b[S]).reactions ?? (C.reactions = [])).push(e);
    } else !w && b !== null && ut < b.length && (_n(e, ut), b.length = ut);
    if (Gi() && vt !== null && !Rt && b !== null && (e.f & (Je | Lt | ze)) === 0)
      for (S = 0; S < /** @type {Source[]} */
      vt.length; S++)
        wo(
          vt[S],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (gr++, i.deps !== null)
        for (let T = 0; T < t; T += 1)
          i.deps[T].rv = gr;
      if (r !== null)
        for (const T of r)
          T.rv = gr;
      vt !== null && (a === null ? a = vt : a.push(.../** @type {Source[]} */
      vt));
    }
    return (e.f & sr) !== 0 && (e.f ^= sr), k;
  } catch (T) {
    return Xi(T);
  } finally {
    e.f ^= Vn, it = r, ut = t, vt = a, ie = i, jt = o, Ur(c), Rt = p, Sr = v;
  }
}
function Hl(e, r) {
  let t = r.reactions;
  if (t !== null) {
    var a = Ts.call(t, e);
    if (a !== -1) {
      var i = t.length - 1;
      i === 0 ? t = r.reactions = null : (t[a] = t[i], t.pop());
    }
  }
  if (t === null && (r.f & Je) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (it === null || !Fn.call(it, r))) {
    var o = (
      /** @type {Derived} */
      r
    );
    (o.f & ht) !== 0 && (o.f ^= ht, o.f &= ~Ar), o.v !== He && qa(o), o.ac !== null && Xr(() => {
      o.ac.abort(bn), o.ac = null, Le(o, ze);
    }), bl(o), _n(o, 0);
  }
}
function _n(e, r) {
  var t = e.deps;
  if (t !== null)
    for (var a = r; a < t.length; a++)
      Hl(e, t[a]);
}
function Jr(e) {
  var r = e.f;
  if ((r & xt) === 0) {
    Le(e, qe);
    var t = ue, a = Pn;
    ue = e, Pn = (r & (yt | Xt)) === 0;
    try {
      (r & (Mt | qi)) !== 0 ? jl(e) : Ka(e), _o(e);
      var i = So(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = bo;
      var o;
    } finally {
      Pn = a, ue = t;
    }
  }
}
async function ql() {
  await Promise.resolve(), Sl();
}
function n(e) {
  var r = e.f, t = (r & Je) !== 0;
  if (ie !== null && !Rt) {
    var a = ue !== null && (ue.f & xt) !== 0;
    if (!a && (jt === null || !jt.has(e))) {
      var i = ie.deps;
      if ((ie.f & Vn) !== 0)
        e.rv < gr && (e.rv = gr, it === null && i !== null && i[ut] === e ? ut++ : it === null ? it = [e] : it.push(e));
      else {
        ie.deps ?? (ie.deps = []), Fn.call(ie.deps, e) || ie.deps.push(e);
        var o = e.reactions;
        o === null ? e.reactions = [ie] : Fn.call(o, ie) || o.push(ie);
      }
    }
  }
  if (lr && Ft.has(e))
    return Ft.get(e);
  if (t) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (lr) {
      var p = c.v;
      return ((c.f & qe) === 0 && c.reactions !== null || Ao(c)) && (p = Ua(c)), Ft.set(c, p), p;
    }
    var v = (c.f & ht) === 0 && !Rt && ie !== null && (Pn || (ie.f & ht) !== 0), _ = (c.f & Gr) === 0;
    wn(c) && (v && (c.f |= ht), to(c)), v && !_ && (ro(c), Eo(c));
  }
  if (Nt?.has(e))
    return Nt.get(e);
  if ((e.f & sr) !== 0)
    throw e.v;
  return e.v;
}
function Eo(e) {
  if (e.f |= ht, e.deps !== null)
    for (const r of e.deps)
      (r.reactions ?? (r.reactions = [])).push(e), (r.f & Je) !== 0 && (r.f & ht) === 0 && (ro(
        /** @type {Derived} */
        r
      ), Eo(
        /** @type {Derived} */
        r
      ));
}
function Ao(e) {
  if (e.v === He) return !0;
  if (e.deps === null) return !1;
  for (const r of e.deps)
    if (Ft.has(r) || (r.f & Je) !== 0 && Ao(
      /** @type {Derived} */
      r
    ))
      return !0;
  return !1;
}
function Za(e) {
  var r = Rt;
  try {
    return Rt = !0, e();
  } finally {
    Rt = r;
  }
}
const zl = ["touchstart", "touchmove"];
function Ul(e) {
  return zl.includes(e);
}
const _r = Symbol("events"), To = /* @__PURE__ */ new Set(), Ia = /* @__PURE__ */ new Set();
function Wl(e, r, t, a = {}) {
  function i(o) {
    if (a.capture || Pa.call(r, o), !o.cancelBubble)
      return Xr(() => t?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Kt(() => {
    r.addEventListener(e, i, a);
  }) : r.addEventListener(e, i, a), i;
}
function Li(e, r, t, a, i) {
  var o = { capture: a, passive: i }, c = Wl(e, r, t, o);
  (r === document.body || // @ts-ignore
  r === window || // @ts-ignore
  r === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  r instanceof HTMLMediaElement) && Ga(() => {
    r.removeEventListener(e, c, o);
  });
}
function Re(e, r, t) {
  (r[_r] ?? (r[_r] = {}))[e] = t;
}
function Yl(e) {
  for (var r = 0; r < e.length; r++)
    To.add(e[r]);
  for (var t of Ia)
    t(e);
}
let ha = null, xa = !1;
function Pa(e) {
  var r = this, t = (
    /** @type {Node} */
    r.ownerDocument
  ), a = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  ha = e, xa || (xa = !0, setTimeout(() => {
    xa = !1, ha = null;
  }));
  var c = 0, p = ha === e && e[_r];
  if (p) {
    var v = i.indexOf(p);
    if (v !== -1 && (r === document || r === /** @type {any} */
    window)) {
      e[_r] = r;
      return;
    }
    var _ = i.indexOf(r);
    if (_ === -1)
      return;
    v <= _ && (c = v);
  }
  if (o = /** @type {Element} */
  i[c] || e.target, o !== r) {
    Ms(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || t;
      }
    });
    var h = ie, k = ue;
    mt(null), Vt(null);
    try {
      for (var b, w = []; o !== null && o !== r; ) {
        try {
          var S = o[_r]?.[a];
          S != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && S.call(o, e);
        } catch (C) {
          b ? w.push(C) : b = C;
        }
        if (e.cancelBubble) break;
        c++, o = c < i.length ? (
          /** @type {Element} */
          i[c]
        ) : null;
      }
      if (b) {
        for (let C of w)
          queueMicrotask(() => {
            throw C;
          });
        throw b;
      }
    } finally {
      e[_r] = r, delete e.currentTarget, mt(h), Vt(k);
    }
  }
}
const Jl = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function Gl(e) {
  return (
    /** @type {string} */
    Jl?.createHTML(e) ?? e
  );
}
function Mo(e) {
  var r = Ll("template");
  return r.innerHTML = Gl(e.replaceAll("<!>", "<!---->")), r.content;
}
function zn(e, r) {
  var t = (
    /** @type {Effect} */
    ue
  );
  t.nodes === null && (t.nodes = { start: e, end: r, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function z(e, r) {
  var t = (r & $s) !== 0, a = (r & el) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = Mo(o ? e : "<!>" + e), t || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ Yr(i)));
    var c = (
      /** @type {TemplateNode} */
      a || fo ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (t) {
      var p = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Yr(c)
      ), v = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      zn(p, v);
    } else
      zn(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Kl(e, r, t = "svg") {
  var a = !e.startsWith("<!>"), i = `<${t}>${a ? e : "<!>" + e}</${t}>`, o;
  return () => {
    if (!o) {
      var c = (
        /** @type {DocumentFragment} */
        Mo(i)
      ), p = (
        /** @type {Element} */
        /* @__PURE__ */ Yr(c)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ Yr(p);
    }
    var v = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return zn(v, v), v;
  };
}
// @__NO_SIDE_EFFECTS__
function Qa(e, r) {
  return /* @__PURE__ */ Kl(e, r, "svg");
}
function Nn() {
  var e = document.createDocumentFragment(), r = document.createComment(""), t = kr();
  return e.append(r, t), zn(r, t), e;
}
function E(e, r) {
  e !== null && e.before(
    /** @type {Node} */
    r
  );
}
function I(e, r) {
  var t = r == null ? "" : typeof r == "object" ? `${r}` : r;
  t !== /** @type {any} */
  (e[on] ?? (e[on] = e.nodeValue)) && (e[on] = t, e.nodeValue = `${t}`);
}
function Xl(e, r) {
  return Zl(e, r);
}
const Rn = /* @__PURE__ */ new Map();
function Zl(e, { target: r, anchor: t, props: a = {}, events: i, context: o, intro: c = !0, transformError: p }) {
  Nl();
  var v = void 0, _ = Il(() => {
    var h = t ?? r.appendChild(kr());
    fl(
      /** @type {TemplateNode} */
      h,
      {
        pending: () => {
        }
      },
      (w) => {
        Yi({});
        var S = (
          /** @type {ComponentContext} */
          rt
        );
        o && (S.c = o), i && (a.$$events = i), v = e(w, a) || {}, Ji();
      },
      p
    );
    var k = /* @__PURE__ */ new Set(), b = (w) => {
      for (var S = 0; S < w.length; S++) {
        var C = w[S];
        if (!k.has(C)) {
          k.add(C);
          var T = Ul(C);
          for (const Fe of [r, document]) {
            var Q = Rn.get(Fe);
            Q === void 0 && (Q = /* @__PURE__ */ new Map(), Rn.set(Fe, Q));
            var ke = Q.get(C);
            ke === void 0 ? (Fe.addEventListener(C, Pa, { passive: T }), Q.set(C, 1)) : Q.set(C, ke + 1);
          }
        }
      }
    };
    return b(Jn(To)), Ia.add(b), () => {
      for (var w of k)
        for (const T of [r, document]) {
          var S = (
            /** @type {Map<string, number>} */
            Rn.get(T)
          ), C = (
            /** @type {number} */
            S.get(w)
          );
          --C == 0 ? (T.removeEventListener(w, Pa), S.delete(w), S.size === 0 && Rn.delete(T)) : S.set(w, C);
        }
      Ia.delete(b), h !== t && h.parentNode?.removeChild(h);
    };
  });
  return Fa.set(v, _), v;
}
let Fa = /* @__PURE__ */ new WeakMap();
function Ql(e, r) {
  const t = Fa.get(e);
  return t ? (Fa.delete(e), t(r)) : Promise.resolve();
}
var Et, Gt, At, br, mn, Yn, Ba;
class No {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(r, t = !0) {
    /** @type {TemplateNode} */
    lt(this, "anchor");
    /** @type {Map<Batch, Key>} */
    G(this, Et, /* @__PURE__ */ new Map());
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
    G(this, Gt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    G(this, At, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    G(this, br, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    G(this, mn, !0);
    /**
     * @param {Batch} batch
     */
    G(this, Yn, (r) => {
      if (d(this, Et).has(r)) {
        var t = (
          /** @type {Key} */
          d(this, Et).get(r)
        ), a = d(this, Gt).get(t);
        if (a)
          qn(a), d(this, br).delete(t);
        else {
          var i = d(this, At).get(t);
          i && (qn(i.effect), d(this, Gt).set(t, i.effect), d(this, At).delete(t), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), a = i.effect);
        }
        for (const [o, c] of d(this, Et)) {
          if (d(this, Et).delete(o), o === r)
            break;
          const p = d(this, At).get(c);
          p && (ot(p.effect), d(this, At).delete(c));
        }
        for (const [o, c] of d(this, Gt)) {
          if (o === t || d(this, br).has(o)) continue;
          const p = () => {
            if (Array.from(d(this, Et).values()).includes(o)) {
              var _ = document.createDocumentFragment();
              Xa(c, _), _.append(kr()), d(this, At).set(o, { effect: c, fragment: _ });
            } else
              ot(c);
            d(this, br).delete(o), d(this, Gt).delete(o);
          };
          d(this, mn) || !a ? (d(this, br).add(o), wr(c, p, !1)) : p();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    G(this, Ba, (r) => {
      d(this, Et).delete(r);
      const t = Array.from(d(this, Et).values());
      for (const [a, i] of d(this, At))
        t.includes(a) || (ot(i.effect), d(this, At).delete(a));
    });
    this.anchor = r, Y(this, mn, t);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(r, t) {
    var a = (
      /** @type {Batch} */
      K
    );
    t && !d(this, Gt).has(r) && !d(this, At).has(r) && d(this, Gt).set(
      r,
      Tt(() => t(this.anchor))
    ), d(this, Et).set(a, r), d(this, Yn).call(this, a);
  }
}
Et = new WeakMap(), Gt = new WeakMap(), At = new WeakMap(), br = new WeakMap(), mn = new WeakMap(), Yn = new WeakMap(), Ba = new WeakMap();
function X(e, r, t = !1) {
  var a = new No(e), i = t ? Er : 0;
  function o(c, p) {
    a.ensure(c, p);
  }
  Kn(() => {
    var c = !1;
    r((p, v = 0) => {
      c = !0, o(v, p);
    }), c || o(-1, null);
  }, i);
}
function Di(e, r) {
  return r;
}
function $l(e, r, t) {
  for (var a = [], i = r.length, o, c = r.length, p = 0; p < i; p++) {
    let k = r[p];
    wr(
      k,
      () => {
        if (o) {
          if (o.pending.delete(k), o.done.add(k), o.pending.size === 0) {
            var b = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            ja(e, Jn(o.done)), b.delete(o), b.size === 0 && (e.outrogroups = null);
          }
        } else
          c -= 1;
      },
      !1
    );
  }
  if (c === 0) {
    var v = a.length === 0 && t !== null && e.pending.size === 0;
    if (v) {
      var _ = (
        /** @type {Element} */
        t
      ), h = (
        /** @type {Element} */
        _.parentNode
      );
      Rl(h), h.append(_), e.items.clear();
    }
    ja(e, r, !v);
  } else
    o = {
      pending: new Set(r),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function ja(e, r, t = !0) {
  var a;
  if (e.pending.size > 0) {
    a = /* @__PURE__ */ new Set();
    for (const c of e.pending.values())
      for (const p of c)
        a.add(
          /** @type {EachItem} */
          e.items.get(p).e
        );
  }
  for (var i = 0; i < r.length; i++) {
    var o = r[i];
    if (a?.has(o)) {
      o.f |= Pt;
      const c = document.createDocumentFragment();
      Xa(o, c);
    } else
      ot(r[i], t);
  }
}
var Oi;
function ct(e, r, t, a, i, o = null) {
  var c = e, p = /* @__PURE__ */ new Map(), v = (r & zi) !== 0;
  if (v) {
    var _ = (
      /** @type {Element} */
      e
    );
    c = _.appendChild(kr());
  }
  var h = null, k = /* @__PURE__ */ yl(() => {
    var ke = t();
    return (
      /** @type {V[]} */
      Ha(ke) ? ke : ke == null ? [] : Jn(ke)
    );
  }), b, w = /* @__PURE__ */ new Map(), S = !0;
  function C(ke) {
    (Q.effect.f & xt) === 0 && (Q.pending.delete(ke), Q.fallback = h, eu(Q, b, c, r, a), h !== null && (b.length === 0 ? (h.f & Pt) === 0 ? qn(h) : (h.f ^= Pt, dn(h, null, c)) : wr(h, () => {
      h = null;
    })));
  }
  var T = Kn(() => {
    b = /** @type {V[]} */
    n(k);
    for (var ke = b.length, Fe = /* @__PURE__ */ new Set(), De = (
      /** @type {Batch} */
      K
    ), Oe = 0; Oe < ke; Oe += 1) {
      var bt = b[Oe], Ue = a(bt, Oe), Ce = S ? null : p.get(Ue);
      Ce ? (Ce.v && Wr(Ce.v, bt), Ce.i && Wr(Ce.i, Oe)) : (Ce = tu(
        p,
        S ? c : Oi ?? (Oi = kr()),
        bt,
        Ue,
        Oe,
        i,
        r,
        t
      ), S || (Ce.e.f |= Pt), p.set(Ue, Ce)), Fe.add(Ue);
    }
    ke === 0 && o && !h && (S ? h = Tt(() => o(c)) : (h = Tt(() => o(Oi ?? (Oi = kr()))), h.f |= Pt)), ke > Fe.size && Bs(), S || (w.set(De, Fe), C(De)), n(k);
  }), Q = { effect: T, items: p, pending: w, outrogroups: null, fallback: h };
  S = !1;
}
function rn(e) {
  for (; e !== null && (e.f & yt) === 0; )
    e = e.next;
  return e;
}
function eu(e, r, t, a, i) {
  var o = (a & Zs) !== 0, c = r.length, p = e.items, v = rn(e.effect.first), _, h = null, k, b = [], w = [], S, C, T, Q;
  if (o)
    for (Q = 0; Q < c; Q += 1)
      S = r[Q], C = i(S, Q), T = /** @type {EachItem} */
      p.get(C).e, (T.f & Pt) === 0 && (T.nodes?.a?.measure(), (k ?? (k = /* @__PURE__ */ new Set())).add(T));
  for (Q = 0; Q < c; Q += 1) {
    if (S = r[Q], C = i(S, Q), T = /** @type {EachItem} */
    p.get(C).e, e.outrogroups !== null)
      for (const Dt of e.outrogroups)
        Dt.pending.delete(T), Dt.done.delete(T);
    if ((T.f & tt) !== 0 && (qn(T), o && (T.nodes?.a?.unfix(), (k ?? (k = /* @__PURE__ */ new Set())).delete(T))), (T.f & Pt) !== 0)
      if (T.f ^= Pt, T === v)
        dn(T, null, t);
      else {
        var ke = h ? h.next : v;
        T === e.effect.last && (e.effect.last = T.prev), T.prev && (T.prev.next = T.next), T.next && (T.next.prev = T.prev), rr(e, h, T), rr(e, T, ke), dn(T, ke, t), h = T, b = [], w = [], v = rn(h.next);
        continue;
      }
    if (T !== v) {
      if (_ !== void 0 && _.has(T)) {
        if (b.length < w.length) {
          var Fe = w[0], De;
          h = Fe.prev;
          var Oe = b[0], bt = b[b.length - 1];
          for (De = 0; De < b.length; De += 1)
            dn(b[De], Fe, t);
          for (De = 0; De < w.length; De += 1)
            _.delete(w[De]);
          rr(e, Oe.prev, bt.next), rr(e, h, Oe), rr(e, bt, Fe), v = Fe, h = bt, Q -= 1, b = [], w = [];
        } else
          _.delete(T), dn(T, v, t), rr(e, T.prev, T.next), rr(e, T, h === null ? e.effect.first : h.next), rr(e, h, T), h = T;
        continue;
      }
      for (b = [], w = []; v !== null && v !== T; )
        (_ ?? (_ = /* @__PURE__ */ new Set())).add(v), w.push(v), v = rn(v.next);
      if (v === null)
        continue;
    }
    (T.f & Pt) === 0 && b.push(T), h = T, v = rn(T.next);
  }
  if (e.outrogroups !== null) {
    for (const Dt of e.outrogroups)
      Dt.pending.size === 0 && (ja(e, Jn(Dt.done)), e.outrogroups?.delete(Dt));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (v !== null || _ !== void 0) {
    var Ue = [];
    if (_ !== void 0)
      for (T of _)
        (T.f & tt) === 0 && Ue.push(T);
    for (; v !== null; )
      (v.f & tt) === 0 && v !== e.fallback && Ue.push(v), v = rn(v.next);
    var Ce = Ue.length;
    if (Ce > 0) {
      var Sn = (a & zi) !== 0 && c === 0 ? t : null;
      if (o) {
        for (Q = 0; Q < Ce; Q += 1)
          Ue[Q].nodes?.a?.measure();
        for (Q = 0; Q < Ce; Q += 1)
          Ue[Q].nodes?.a?.fix();
      }
      $l(e, Ue, Sn);
    }
  }
  o && Kt(() => {
    if (k !== void 0)
      for (T of k)
        T.nodes?.a?.apply();
  });
}
function tu(e, r, t, a, i, o, c, p) {
  var v = (c & Ks) !== 0 ? (c & Qs) === 0 ? /* @__PURE__ */ Al(t, !1, !1) : Mr(t) : null, _ = (c & Xs) !== 0 ? Mr(i) : null;
  return {
    v,
    i: _,
    e: Tt(() => (o(r, v ?? t, _ ?? i, p), () => {
      e.delete(a);
    }))
  };
}
function dn(e, r, t) {
  if (e.nodes)
    for (var a = e.nodes.start, i = e.nodes.end, o = r && (r.f & Pt) === 0 ? (
      /** @type {EffectNodes} */
      r.nodes.start
    ) : t; a !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ kn(a)
      );
      if (o.before(a), a === i)
        return;
      a = c;
    }
}
function rr(e, r, t) {
  r === null ? e.effect.first = t : r.next = t, t === null ? e.effect.last = r : t.prev = r;
}
function ru(e, r, t) {
  var a = new No(e);
  Kn(() => {
    var i = r() ?? null;
    a.ensure(i, i && ((o) => t(o, i)));
  }, Er);
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
function nu() {
  for (var e, r, t = 0, a = "", i = arguments.length; t < i; t++) (e = arguments[t]) && (r = Ro(e)) && (a && (a += " "), a += r);
  return a;
}
function l(e) {
  return typeof e == "object" ? nu(e) : e ?? "";
}
function au(e, r, t) {
  var a = e == null ? "" : "" + e;
  return a === "" ? null : a;
}
function u(e, r, t, a, i, o) {
  var c = (
    /** @type {any} */
    e[Aa]
  );
  if (c !== t || c === void 0) {
    var p = au(t);
    p == null ? e.removeAttribute("class") : r ? e.className = p : e.setAttribute("class", p), e[Aa] = t;
  }
  return o;
}
function Lo(e, r, t = !1) {
  if (e.multiple) {
    if (r == null)
      return;
    if (!Ha(r))
      return nl();
    for (var a of e.options)
      a.selected = r.includes(gn(a));
    return;
  }
  for (a of e.options) {
    var i = gn(a);
    if (Ml(i, r)) {
      a.selected = !0;
      return;
    }
  }
  (!t || r !== void 0) && (e.selectedIndex = -1);
}
function iu(e) {
  var r = new MutationObserver(() => {
    "__value" in e && Lo(e, e.__value);
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
  }), Ga(() => {
    r.disconnect();
  });
}
function Ci(e, r, t = r) {
  var a = /* @__PURE__ */ new WeakSet(), i = !0;
  $i(e, "change", (o) => {
    var c = o ? "[selected]" : ":checked", p;
    if (e.multiple)
      p = [].map.call(e.querySelectorAll(c), gn);
    else {
      var v = e.querySelector(c) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      p = v && gn(v);
    }
    t(p), e.__value = p, K !== null && a.add(K);
  }), Pl(() => {
    var o = r();
    if (e === document.activeElement) {
      var c = (
        /** @type {Batch} */
        K
      );
      if (a.has(c))
        return;
    }
    if (Lo(e, o, i), i && o === void 0) {
      var p = e.querySelector(":checked");
      p !== null && (o = gn(p), t(o));
    }
    e.__value = o, i = !1;
  }), iu(e);
}
function gn(e) {
  return "__value" in e ? e.__value : e.value;
}
const ou = Symbol("is custom element"), su = Symbol("is html");
function Ye(e, r, t, a) {
  var i = lu(e);
  i[r] !== (i[r] = t) && (t == null ? e.removeAttribute(r) : typeof t != "string" && uu(e).includes(r) ? e[r] = t : e.setAttribute(r, t));
}
function lu(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[Ln] ?? (e[Ln] = {
      [ou]: e.nodeName.includes("-"),
      [su]: e.namespaceURI === tl
    })
  );
}
var Ii = /* @__PURE__ */ new Map();
function uu(e) {
  var r = e.getAttribute("is") || e.nodeName, t = Ii.get(r);
  if (t) return t;
  Ii.set(r, t = []);
  for (var a, i = e, o = Element.prototype; o !== i; ) {
    a = Ns(i);
    for (var c in a)
      a[c].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      c !== "innerHTML" && c !== "textContent" && c !== "innerText" && t.push(c);
    i = Bi(i);
  }
  return t;
}
function nr(e, r, t = r) {
  var a = /* @__PURE__ */ new WeakSet();
  $i(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = ya(e) ? ma(o) : o, t(o), K !== null && a.add(K), await ql(), o !== (o = r())) {
      var c = e.selectionStart, p = e.selectionEnd, v = e.value.length;
      if (e.value = o ?? "", p !== null) {
        var _ = e.value.length;
        c === p && p === v && _ > v ? (e.selectionStart = _, e.selectionEnd = _) : (e.selectionStart = c, e.selectionEnd = Math.min(p, _));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Za(r) == null && e.value && (t(ya(e) ? ma(e.value) : e.value), K !== null && a.add(K)), go(() => {
    var i = r();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        K
      );
      if (a.has(o))
        return;
    }
    ya(e) && i === ma(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function ya(e) {
  var r = e.type;
  return r === "number" || r === "range";
}
function ma(e) {
  return e === "" ? null : +e;
}
function du(e) {
  rt === null && js(), Cl(() => {
    const r = Za(e);
    if (typeof r == "function") return (
      /** @type {() => void} */
      r
    );
  });
}
const fu = "5";
var Vi;
typeof window < "u" && ((Vi = window.__svelte ?? (window.__svelte = {})).v ?? (Vi.v = /* @__PURE__ */ new Set())).add(fu);
const cu = "See token balances and transfer history for your realm's treasury, send payments when allowed, and look up balances tied to members or invoices.", Do = "(max-width: 720px)";
function vu() {
  return typeof window > "u" ? !1 : window.matchMedia(Do).matches;
}
function pu(e) {
  if (typeof window > "u") return () => {
  };
  const r = window.matchMedia(Do), t = () => e(r.matches);
  return t(), r.addEventListener("change", t), () => r.removeEventListener("change", t);
}
const Pi = (e) => {
  var r = hu();
  E(e, r);
}, gu = (e) => {
  var r = xu();
  E(e, r);
}, _u = (e) => {
  var r = yu();
  E(e, r);
};
var hu = /* @__PURE__ */ Qa('<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>'), xu = /* @__PURE__ */ Qa('<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4.93 4.93a10 10 0 0114.14 0M19.07 19.07a10 10 0 01-14.14 0"></path></svg>'), yu = /* @__PURE__ */ Qa('<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>'), mu = /* @__PURE__ */ z('<div><div><div> </div> <div> </div></div> <div><div> </div> <button type="button">Send</button></div></div>'), bu = /* @__PURE__ */ z("<div><div></div> <p>On-chain ledger balance for this realm's vault</p></div>"), ku = /* @__PURE__ */ z("<div><p>No token configured</p> <p>This realm's treasury has no active token yet, so the vault holds no balance.</p></div>"), ba = /* @__PURE__ */ z("<span>Copied!</span>"), wu = /* @__PURE__ */ z("<div><span>Last refresh:</span> <span> </span></div>"), Su = /* @__PURE__ */ z('<div><div> </div> <div> </div> <div> </div> <div> </div> <div><span>Ledger:</span> <button type="button"> </button> <!></div> <div><span>Indexer:</span> <button type="button"> </button> <!></div></div>'), Eu = /* @__PURE__ */ z('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), Au = /* @__PURE__ */ z("<details><summary>Show details</summary> <pre> </pre></details>"), Tu = /* @__PURE__ */ z("<div><p> </p> <!></div>"), Dr = /* @__PURE__ */ z('<button type="button"> </button>'), Mu = /* @__PURE__ */ z('<button type="button" title="Admin" aria-label="Admin"><!> <span class="hidden sm:inline">Admin</span></button>'), Nu = /* @__PURE__ */ z("<div><div></div> <div></div> <div></div> <div></div> <div></div></div>"), ka = /* @__PURE__ */ z("<div></div>"), Ru = /* @__PURE__ */ z('<div><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <p>No activity yet</p> <p>Transfers and ledger events will appear here after the vault syncs.</p></div>'), nn = /* @__PURE__ */ z("<span> </span>"), Lu = /* @__PURE__ */ z("<article><div><div><div> </div> <div>To <!></div> <div>From <!></div></div> <div><div> </div> <!></div></div></article>"), wa = /* @__PURE__ */ z("<span>✓</span>"), Sa = /* @__PURE__ */ z('<button type="button"> </button> <!>', 1), Du = /* @__PURE__ */ z("<span>—</span>"), Ou = /* @__PURE__ */ z("<tr><td><!> <div> </div></td><td><span> </span></td><td><!></td><td><!></td><td><span> </span></td></tr>"), Cu = /* @__PURE__ */ z("<div><table><thead><tr><th>When</th><th>Type</th><th>From</th><th>To</th><th>Amount</th></tr></thead><tbody></tbody></table></div>"), Iu = /* @__PURE__ */ z("<span>…</span>"), Pu = /* @__PURE__ */ z('<div><button type="button">Prev</button> <!> <button type="button">Next</button></div>'), Fu = /* @__PURE__ */ z("<div><span> <!></span> <!></div>"), ju = /* @__PURE__ */ z("<div><h2>Activity</h2> <!> <!></div>"), Vu = /* @__PURE__ */ z("<p>No token is configured for this realm's treasury, so nothing can be sent yet.</p>"), an = /* @__PURE__ */ z("<p> </p>"), Fi = /* @__PURE__ */ z("<option> </option>"), Bu = /* @__PURE__ */ z('<select id="v-token"></select>'), Hu = /* @__PURE__ */ z("<p>Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).</p>"), qu = /* @__PURE__ */ z("<p>Principal ID of the recipient.</p>"), ji = /* @__PURE__ */ z("<p>Must be exactly 64 hex characters.</p>"), zu = /* @__PURE__ */ z('<div><button type="button">← Activity</button> <h2>Send tokens</h2> <form><div><span>Token</span> <!></div> <div><label for="v-to">Recipient</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/> <!></div> <div><div><label for="v-amount"> </label> <button type="button">Max</button></div> <input id="v-amount" type="text" inputmode="decimal" placeholder="0.00"/> <!> <!></div> <details><summary>Advanced (subaccounts)</summary> <div><p>Optional 64-character hex subaccount values for source or destination.</p> <div><label for="v-to-sub">To subaccount</label> <input id="v-to-sub" type="text" placeholder="64-character hex"/> <!></div> <div><label for="v-from-sub">From subaccount</label> <input id="v-from-sub" type="text" placeholder="64-character hex"/> <!></div></div></details> <button type="submit"> </button></form></div>'), Uu = /* @__PURE__ */ z('<select aria-label="Lookup mode"><option>Member</option><option>Invoice</option><option>Advanced</option></select>'), Wu = /* @__PURE__ */ z(`<p>Enter a raw 64-character hex subaccount. Member and invoice compartments are derived
						from principal or invoice ID using internal prefixes.</p>`), Yu = /* @__PURE__ */ z('<input type="text" list="member-list" placeholder="Member principal or pick from list"/> <datalist id="member-list"></datalist>', 1), Ju = /* @__PURE__ */ z('<input type="text" placeholder="Invoice ID"/>'), Gu = /* @__PURE__ */ z('<input type="text" placeholder="64-character hex subaccount"/>'), Ku = /* @__PURE__ */ z("<div> </div>"), Xu = /* @__PURE__ */ z("<div><span> </span> <div> </div></div>"), Zu = /* @__PURE__ */ z("<p>No balances found for this subaccount.</p>"), Qu = /* @__PURE__ */ z('<div><div><div><div> </div> <!></div> <button type="button"> </button></div> <div></div> <!></div>'), $u = /* @__PURE__ */ z(`<div><h2>Look up a balance</h2> <p>The vault holds funds in separate compartments for each member and each invoice. Look up
					the balance in one of them.</p> <div><!></div> <!> <form><!> <button type="submit"><!> </button></form> <!></div>`), ed = /* @__PURE__ */ z("<div><div> </div> <div> </div></div>"), td = /* @__PURE__ */ z("<p>No balances found in system</p>"), rd = /* @__PURE__ */ z("<p>No transfer data available</p>"), nd = /* @__PURE__ */ z(`<div><h2>Vault Admin</h2> <div><button type="button"><!> </button></div> <div><h3>Auto-refresh settings</h3> <p>The Vault will only run an expensive full refresh on load if the last refresh is older
						than this threshold.</p> <div><label for="v-refresh-age">Max refresh age:</label> <input id="v-refresh-age" type="number" min="1"/> <span>minutes</span> <button type="button">Save</button></div></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>`), ad = /* @__PURE__ */ z('<div><div><div><div><h1>Vault</h1> <p> </p></div> <button type="button" aria-label="Refresh" title="Refresh"><span><!></span></button></div></div> <!> <details><summary>Technical details</summary> <div><div><span>Vault Principal:</span> <button type="button"> </button> <!></div> <!> <!></div></details> <!> <nav><!> <!></nav> <div><!></div></div>');
function id(e, r) {
  Yi(r, !0);
  const t = r.ctx.theme?.cn ?? ((...s) => s.filter(Boolean).join(" ")), a = 3600 * 1e3, i = "vault_settings", o = "vault_last_refresh", c = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/, p = /^[0-9a-fA-F]{64}$/;
  let v = /* @__PURE__ */ Z("activity"), _ = /* @__PURE__ */ Z(!1), h = /* @__PURE__ */ Z(""), k = /* @__PURE__ */ Z(""), b = /* @__PURE__ */ Z(et([])), w = /* @__PURE__ */ re(() => n(b).includes("admin")), S = /* @__PURE__ */ Z(""), C = /* @__PURE__ */ Z(et({})), T = /* @__PURE__ */ Z(et({})), Q = /* @__PURE__ */ Z(!1), ke = /* @__PURE__ */ Z(et([])), Fe = /* @__PURE__ */ Z(et([])), De = /* @__PURE__ */ Z(null), Oe = /* @__PURE__ */ Z(0);
  const bt = 10;
  let Ue = /* @__PURE__ */ Z(null), Ce = /* @__PURE__ */ Z(""), Sn = /* @__PURE__ */ Z(et(na())), Dt = /* @__PURE__ */ Z(et(Math.round(na().maxRefreshAgeMs / 6e4))), Ot = /* @__PURE__ */ Z(""), En = /* @__PURE__ */ Z(""), Zr = /* @__PURE__ */ Z(""), ur = /* @__PURE__ */ Z(""), dr = /* @__PURE__ */ Z(""), st = /* @__PURE__ */ Z("user"), Qt = /* @__PURE__ */ Z(""), Qr = /* @__PURE__ */ Z(""), $r = /* @__PURE__ */ Z(""), kt = /* @__PURE__ */ Z(null), Nr = /* @__PURE__ */ Z(!1), fr = /* @__PURE__ */ Z(et({})), $a = /* @__PURE__ */ Z(et([])), Bt = /* @__PURE__ */ re(() => Object.keys(n(C))), Oo = /* @__PURE__ */ re(() => n($a).filter((s) => s.kind === "user")), Xe = /* @__PURE__ */ re(() => n(Ot) ? n(C)[n(Ot)] : void 0), Xn = /* @__PURE__ */ re(() => n(Ot) && n(T)[n(Ot)] || 0), Zn = /* @__PURE__ */ re(() => n(Xe)?.fee ?? 0), $t = /* @__PURE__ */ re(() => Po(n(Zr), n(Xe)?.decimals ?? 8)), Rr = /* @__PURE__ */ re(() => n(En).trim()), ei = /* @__PURE__ */ re(() => n(Rr) !== "" && c.test(n(Rr))), Qn = /* @__PURE__ */ re(() => n(fr)[n(Rr)] || ""), $n = /* @__PURE__ */ re(() => n(ur).trim() === "" || p.test(n(ur).trim())), ea = /* @__PURE__ */ re(() => n(dr).trim() === "" || p.test(n(dr).trim())), ti = /* @__PURE__ */ re(() => n(ei) && n($t) != null && n($t) > 0 && n($n) && n(ea) && !n(_));
  function ta(s) {
    return typeof s == "string" ? JSON.parse(s) : s;
  }
  function An(s) {
    return s && typeof s == "object" && s.success === !0 && s.data != null ? s.data : s;
  }
  function Co(s) {
    return n(C)[s]?.name ?? s;
  }
  function Io(s, f) {
    return (s / Math.pow(10, f)).toLocaleString(void 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(f, 8)
    });
  }
  function er(s, f, y) {
    return `${Io(s, f)} ${y}`;
  }
  function cr(s) {
    return `${s.toLocaleString()} base units`;
  }
  function Po(s, f) {
    const y = s.trim();
    if (!y) return null;
    const A = y.split(".");
    if (A.length > 2) return null;
    const N = A[0], j = A[1] ?? "";
    if (!/^\d+$/.test(N) || j && !/^\d+$/.test(j) || j.length > f) return null;
    const V = j.padEnd(f, "0"), oe = f > 0 ? N + V : N, J = Number(oe);
    return Number.isFinite(J) && J >= 0 ? J : null;
  }
  function Fo(s, f) {
    const y = String(s).padStart(f + 1, "0");
    if (f === 0) return y;
    const A = y.slice(0, -f) || "0";
    let N = y.slice(-f).replace(/0+$/, "");
    return N ? `${A}.${N}` : A;
  }
  function ra(s) {
    const f = n(Bt).find((y) => n(C)[y]?.name === s);
    return f && n(C)[f] ? n(C)[f] : {
      ledger: "",
      indexer: "",
      decimals: 8,
      symbol: s,
      name: s,
      fee: 0
    };
  }
  function na() {
    try {
      const s = localStorage.getItem(i);
      if (s) {
        const f = JSON.parse(s);
        if (typeof f.maxRefreshAgeMs == "number" && f.maxRefreshAgeMs > 0)
          return { maxRefreshAgeMs: f.maxRefreshAgeMs };
      }
    } catch {
    }
    return { maxRefreshAgeMs: a };
  }
  function jo(s) {
    try {
      localStorage.setItem(i, JSON.stringify(s));
    } catch {
    }
  }
  function Vo() {
    const s = Math.max(1, Math.round(n(Dt) || 1));
    m(Sn, { maxRefreshAgeMs: s * 6e4 }, !0), jo(n(Sn));
  }
  function ri() {
    try {
      const s = localStorage.getItem(o);
      if (s) {
        const f = JSON.parse(s);
        if (f && typeof f.timestamp == "number" && f.balances)
          return { timestamp: f.timestamp, balances: f.balances };
      }
    } catch {
    }
    return null;
  }
  function Bo(s, f) {
    try {
      localStorage.setItem(o, JSON.stringify({ timestamp: s, balances: f }));
    } catch {
    }
  }
  async function Ct(s) {
    try {
      await navigator.clipboard.writeText(s), m(Ce, s, !0), setTimeout(() => m(Ce, ""), 2e3);
    } catch {
    }
  }
  function aa(s) {
    const f = Math.floor((Date.now() - s.getTime()) / 1e3);
    if (f < 60) return `${f}s ago`;
    const y = Math.floor(f / 60);
    if (y < 60) return `${y}m ago`;
    const A = Math.floor(y / 60);
    return A < 24 ? `${A}h ago` : `${Math.floor(A / 24)}d ago`;
  }
  function ni(s) {
    const f = String(s);
    if (f.includes("T") || f.includes("-") || f.includes(":")) return new Date(f);
    try {
      return new Date(Number(BigInt(f) / BigInt(1e6)));
    } catch {
      return /* @__PURE__ */ new Date();
    }
  }
  function ai(s, f = 20) {
    if (s.length <= f) return s;
    const y = Math.floor((f - 1) / 2);
    return `${s.slice(0, y)}…${s.slice(-y)}`;
  }
  function en(s) {
    return s ? s === "minting_account" ? { display: "Mint", title: s, copyable: !1 } : s === "burn" ? { display: "Burned", title: s, copyable: !1 } : s === n(S) ? { display: "This vault", title: s, copyable: !1 } : n(fr)[s] ? {
      display: n(fr)[s],
      title: s,
      copyable: !1
    } : { display: ai(s), title: s, copyable: !0 } : { display: "—", title: "", copyable: !1 };
  }
  function ii(s) {
    const f = s || "unknown";
    return f.charAt(0).toUpperCase() + f.slice(1);
  }
  function oi(s) {
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
  function si(s) {
    const f = ra(s.token), y = s.amount || 0, A = s.fee || 0, N = er(y, f.decimals, f.symbol), j = s.principal_to === n(S) || s.kind === "mint", V = s.principal_from === n(S) || s.kind === "burn";
    let oe = N, J = "text-gray-600 dark:text-gray-400";
    j ? (oe = `+${N}`, J = "text-emerald-600 dark:text-emerald-400") : V && (oe = `−${N}`, J = "text-rose-600 dark:text-rose-400");
    const ye = A > 0 ? `${cr(y)} · Fee: ${cr(A)}` : cr(y);
    return { text: oe, className: J, title: ye };
  }
  function li(s) {
    try {
      const A = JSON.parse(s);
      if (A && typeof A.error == "string") return A.error;
    } catch {
    }
    const f = s.match(/Reject text:\s*([^\n]+?)(?:\s+Error code|\s+Call context|$)/);
    if (f) return f[1].trim();
    const y = s.split(`
`)[0].trim();
    return y.length > 200 ? `${y.slice(0, 200)}…` : y;
  }
  function Ho() {
    return n(kt) ? n(st) === "user" ? `Member ${n(fr)[n(Qt).trim()] || ai(n(Qt).trim())}` : n(st) === "invoice" ? `Invoice ${n(Qr).trim()}` : `Subaccount ${n($r).trim().substring(0, 16)}…` : "";
  }
  async function qo(s) {
    if (typeof r.ctx.openModal != "function") return !0;
    try {
      const { actionId: f } = await r.ctx.openModal({
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
      return f === "confirm";
    } catch {
      return !1;
    }
  }
  function zo(s) {
    m(Ot, s, !0), m(v, "send");
  }
  function Uo() {
    if (!n(Xe)) return;
    const s = Math.max(0, n(Xn) - n(Zn));
    m(Zr, Fo(s, n(Xe).decimals), !0);
  }
  async function Wo() {
    if (typeof r.ctx.backend?.directory_list == "function")
      try {
        const s = await r.ctx.backend.directory_list(), f = ta(s);
        if (f?.success && f?.data?.message) {
          const A = JSON.parse(f.data.message).entries || [], N = {};
          for (const j of A)
            j.principal && j.label && (N[j.principal] = j.label);
          m($a, A, !0), m(fr, N, !0);
        }
      } catch {
      }
  }
  async function Yo() {
    try {
      const f = An(await r.ctx.callSync("get_active_tokens", {}))?.ActiveTokens || [], y = {}, A = {};
      for (const V of f) {
        const oe = V.symbol || V.name, J = V.ledger_canister_id ?? V.ledger ?? "", ye = V.indexer_canister_id ?? V.indexer ?? "";
        oe && (y[oe] = {
          ledger: J,
          indexer: ye,
          decimals: V.decimals || 8,
          symbol: oe,
          name: V.name,
          fee: V.fee || 0
        }, A[oe] = 0);
      }
      m(C, y, !0), m(T, A, !0);
      const N = ri();
      if (N?.balances) {
        for (const V of Object.keys(y))
          V in N.balances && (A[V] = N.balances[V]);
        m(T, A, !0), m(Ue, new Date(N.timestamp), !0);
      }
      const j = Object.keys(y);
      j.length > 0 && !n(Ot) && m(Ot, j[0], !0), m(Q, !0);
    } catch (s) {
      console.error("Failed to load tokens:", s);
    }
  }
  async function ia() {
    m(_, !0), m(h, ""), m(k, "");
    try {
      const s = await r.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), f = ta(s);
      if (f?.success && f?.data?.objectsListPaginated) {
        const y = f.data.objectsListPaginated;
        m(ke, y.objects.map((A) => JSON.parse(A)), !0);
      } else
        m(ke, [], !0);
    } catch (s) {
      const f = r.ctx.ui?.accessDeniedOperation?.(s);
      f != null ? (m(k, f, !0), m(h, "")) : (m(k, ""), m(h, s?.message ?? String(s), !0));
    } finally {
      m(_, !1);
    }
  }
  async function Tn(s = n(Oe)) {
    m(_, !0), m(h, ""), m(k, "");
    try {
      if (!n(S))
        try {
          if (typeof r.ctx.backend.get_canister_id == "function") {
            const A = await r.ctx.backend.get_canister_id();
            m(S, A || "", !0);
          }
        } catch {
          m(S, "");
        }
      const f = await r.ctx.backend.get_objects_paginated("WalletTransfer", s, bt, "desc"), y = ta(f);
      if (y?.success && y?.data?.objectsListPaginated) {
        const A = y.data.objectsListPaginated;
        m(De, A.pagination, !0), m(Fe, A.objects.map((N) => JSON.parse(N)), !0);
      } else
        m(Fe, [], !0);
    } catch (f) {
      const y = r.ctx.ui?.accessDeniedOperation?.(f);
      y != null ? (m(k, y, !0), m(h, "")) : (m(k, ""), m(h, f?.message ?? String(f), !0));
    } finally {
      m(_, !1);
    }
  }
  function Jo(s) {
    return n(Bt).find((f) => n(C)[f]?.name === s);
  }
  function Go(s) {
    for (const [f, y] of Object.entries(s)) {
      const A = Jo(f) || f;
      n(C)[A] && (n(T)[A] = y?.balance || 0);
    }
    m(T, { ...n(T) }, !0);
  }
  async function Ko() {
    try {
      typeof r.ctx.backend.get_canister_id == "function" && m(S, await r.ctx.backend.get_canister_id() || n(S), !0);
    } catch {
    }
  }
  async function oa() {
    m(_, !0), m(h, ""), m(k, "");
    try {
      const s = An(await r.ctx.callAsync("refresh", {}));
      if (s?.TransactionSummary == null) {
        m(h, "Failed to sync vault transactions");
        return;
      }
      Go(s.TransactionSummary.per_token || {}), await Ko(), m(Ue, /* @__PURE__ */ new Date(), !0), Bo(n(Ue).getTime(), n(T)), await Promise.all([ia(), Tn(0)]);
    } catch (s) {
      const f = r.ctx.ui?.accessDeniedOperation?.(s);
      f != null ? (m(k, f, !0), m(h, "")) : (m(k, ""), m(h, s?.message ?? String(s), !0));
    } finally {
      m(_, !1);
    }
  }
  async function Xo() {
    if (!n(ti) || !n(Xe) || n($t) == null) return;
    const s = n(Xe).symbol, f = er(n($t), n(Xe).decimals, s), y = n(Qn) || n(Rr);
    if (await qo({
      title: "Confirm send",
      body: `Send ${f} to ${y}? This cannot be undone.`,
      confirmLabel: "Send",
      danger: !0
    })) {
      m(_, !0), m(h, ""), m(k, "");
      try {
        const N = {
          to_principal: n(Rr),
          amount: n($t),
          token: Co(n(Ot))
        };
        n(ur).trim() && (N.to_subaccount = n(ur).trim()), n(dr).trim() && (N.from_subaccount = n(dr).trim()), An(await r.ctx.callAsync("transfer", N)), typeof r.ctx.notify == "function" && r.ctx.notify("success", `Sent ${f}`), m(En, ""), m(Zr, ""), m(ur, ""), m(dr, ""), await ia(), await Tn();
      } catch (N) {
        const j = r.ctx.ui?.accessDeniedOperation?.(N);
        j != null ? (m(k, j, !0), m(h, "")) : (m(k, ""), m(h, N?.message ?? String(N), !0));
      } finally {
        m(_, !1);
      }
    }
  }
  async function Zo() {
    m(Nr, !0), m(kt, null), m(h, ""), m(k, "");
    try {
      const s = {};
      if (n(st) === "user" && n(Qt).trim())
        s.principal = n(Qt).trim();
      else if (n(st) === "invoice" && n(Qr).trim())
        s.invoice_id = n(Qr).trim();
      else if (n(st) === "raw" && n($r).trim())
        s.subaccount_hex = n($r).trim();
      else {
        m(h, "Please enter a value to look up"), m(Nr, !1);
        return;
      }
      const f = An(await r.ctx.callAsync("lookup_balance", s));
      f?.LookupBalance ? m(kt, f.LookupBalance, !0) : m(h, "Lookup failed");
    } catch (s) {
      const f = r.ctx.ui?.accessDeniedOperation?.(s);
      f != null ? (m(k, f, !0), m(h, "")) : (m(k, ""), m(h, s?.message ?? String(s), !0));
    } finally {
      m(Nr, !1);
    }
  }
  async function sa(s) {
    m(Oe, s, !0), await Tn(s);
  }
  function Qo(s, f) {
    if (s <= 7) return Array.from({ length: s }, (A, N) => N);
    const y = [0];
    f > 3 && y.push("...");
    for (let A = Math.max(1, f - 1); A <= Math.min(s - 2, f + 1); A++) y.push(A);
    return f < s - 4 && y.push("..."), y.push(s - 1), y;
  }
  const $o = [
    { id: "activity", label: "Activity" },
    { id: "lookup", label: "Lookup" }
  ];
  let la = /* @__PURE__ */ Z(et(vu()));
  du(() => {
    const s = [
      pu((f) => {
        m(la, f, !0);
      })
    ];
    return r.ctx.userProfiles?.subscribe && s.push(r.ctx.userProfiles.subscribe((f) => {
      m(b, f || [], !0);
    })), (async () => {
      await Promise.all([Yo(), Wo()]);
      const f = na(), y = ri(), A = Date.now();
      !y || A - y.timestamp > f.maxRefreshAgeMs ? await oa() : await Promise.all([ia(), Tn(0)]);
    })(), () => {
      for (const f of s) f();
    };
  });
  var ua = ad(), da = g(ua), ui = g(da), di = g(ui), fi = g(di), ci = x(fi, 2), es = g(ci), Mn = x(di, 2), vi = g(Mn), ts = g(vi);
  gu(ts);
  var pi = x(da, 2);
  {
    var rs = (s) => {
      var f = bu(), y = g(f);
      ct(y, 20, () => n(Bt), (N) => N, (N, j) => {
        const V = /* @__PURE__ */ re(() => n(C)[j]), oe = /* @__PURE__ */ re(() => n(T)[j] || 0);
        var J = mu(), ye = g(J), U = g(ye), $ = g(U), ne = x(U, 2), ee = g(ne), ce = x(ye, 2), ve = g(ce), he = g(ve), we = x(ve, 2);
        M(
          (me, Ie, Ae, D, R, L, P, F) => {
            u(J, 1, me), Ye(J, "title", Ie), u(U, 1, Ae), I($, n(V).symbol), u(ne, 1, D), I(ee, n(V).name), u(ce, 1, R), u(ve, 1, L), I(he, P), u(we, 1, F);
          },
          [
            () => l(t("flex items-center justify-between gap-4 py-3 sm:bg-white/60 sm:dark:bg-gray-800/40 sm:rounded-lg sm:p-4", "border-b border-indigo-200/60 last:border-0 dark:border-indigo-800/40 sm:border-0")),
            () => cr(n(oe)),
            () => l(t("text-sm font-semibold text-indigo-900 dark:text-indigo-200")),
            () => l(t("text-xs text-indigo-600/70 dark:text-indigo-400/70")),
            () => l(t("flex items-center gap-4")),
            () => l(t("text-2xl font-bold text-indigo-900 dark:text-indigo-100 tabular-nums")),
            () => er(n(oe), n(V).decimals, n(V).symbol),
            () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 transition-colors shrink-0"))
          ]
        ), Re("click", we, () => zo(j)), E(N, J);
      });
      var A = x(y, 2);
      M(
        (N, j, V) => {
          u(f, 1, N), u(y, 1, j), u(A, 1, V);
        },
        [
          () => l(t("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20", "border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => l(t("space-y-3")),
          () => l(t("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), E(s, f);
    }, ns = (s) => {
      var f = ku(), y = g(f), A = x(y, 2);
      M(
        (N, j, V) => {
          u(f, 1, N), u(y, 1, j), u(A, 1, V);
        },
        [
          () => l(t("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => l(t("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), E(s, f);
    };
    X(pi, (s) => {
      n(Q) && n(Bt).length > 0 ? s(rs) : n(Q) && s(ns, 1);
    });
  }
  var fa = x(pi, 2), gi = g(fa), _i = x(gi, 2), ca = g(_i), hi = g(ca), tn = x(hi, 2), as = g(tn), is = x(tn, 2);
  {
    var os = (s) => {
      var f = ba();
      M((y) => u(f, 1, y), [
        () => l(t("text-xs text-green-600 dark:text-green-400"))
      ]), E(s, f);
    };
    X(is, (s) => {
      n(Ce) === n(S) && n(S) && s(os);
    });
  }
  var xi = x(ca, 2);
  {
    var ss = (s) => {
      var f = wu(), y = g(f), A = x(y, 2), N = g(A);
      M(
        (j, V, oe, J, ye) => {
          u(f, 1, j), u(y, 1, V), u(A, 1, oe), I(N, `${J ?? ""} (${ye ?? ""})`);
        },
        [
          () => l(t("text-xs text-gray-600 dark:text-gray-400")),
          () => l(t("font-medium")),
          () => l(t("ml-1")),
          () => n(Ue).toLocaleString(),
          () => aa(n(Ue))
        ]
      ), E(s, f);
    };
    X(xi, (s) => {
      n(Ue) && s(ss);
    });
  }
  var ls = x(xi, 2);
  ct(ls, 16, () => n(Bt), (s) => s, (s, f) => {
    const y = /* @__PURE__ */ re(() => n(C)[f]);
    var A = Su(), N = g(A), j = g(N), V = x(N, 2), oe = g(V), J = x(V, 2), ye = g(J), U = x(J, 2), $ = g(U), ne = x(U, 2), ee = g(ne), ce = x(ee, 2), ve = g(ce), he = x(ce, 2);
    {
      var we = (P) => {
        var F = ba();
        M((te) => u(F, 1, te), [() => l(t("text-green-600 dark:text-green-400"))]), E(P, F);
      };
      X(he, (P) => {
        n(Ce) === n(y).ledger && P(we);
      });
    }
    var me = x(ne, 2), Ie = g(me), Ae = x(Ie, 2), D = g(Ae), R = x(Ae, 2);
    {
      var L = (P) => {
        var F = ba();
        M((te) => u(F, 1, te), [() => l(t("text-green-600 dark:text-green-400"))]), E(P, F);
      };
      X(R, (P) => {
        n(Ce) === n(y).indexer && P(L);
      });
    }
    M(
      (P, F, te, be, H, ae, de, Se, Me, Pe, Ee, je) => {
        u(A, 1, P), u(N, 1, F), I(j, n(y).symbol), u(V, 1, te), I(oe, `Name: ${n(y).name ?? ""}`), u(J, 1, be), I(ye, `Decimals: ${n(y).decimals ?? ""}`), u(U, 1, H), I($, `Transfer fee: ${ae ?? ""}`), u(ne, 1, de), u(ee, 1, Se), u(ce, 1, Me), I(ve, n(y).ledger), u(me, 1, Pe), u(Ie, 1, Ee), u(Ae, 1, je), I(D, n(y).indexer);
      },
      [
        () => l(t("text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 first:border-0 first:pt-0")),
        () => l(t("font-semibold text-gray-700 dark:text-gray-300")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => er(n(y).fee, n(y).decimals, n(y).symbol),
        () => l(t("flex flex-wrap items-center gap-2")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
        () => l(t("flex flex-wrap items-center gap-2")),
        () => l(t("text-gray-500 dark:text-gray-400")),
        () => l(t("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
      ]
    ), Re("click", ce, () => Ct(n(y).ledger)), Re("click", Ae, () => Ct(n(y).indexer)), E(s, A);
  });
  var yi = x(fa, 2);
  {
    var us = (s) => {
      var f = Nn(), y = tr(f);
      {
        var A = (j) => {
          const V = /* @__PURE__ */ re(() => r.ctx.ui.AccessDenied);
          var oe = Nn(), J = tr(oe);
          ru(J, () => n(V), (ye, U) => {
            U(ye, {
              get operation() {
                return n(k);
              }
            });
          }), E(j, oe);
        }, N = (j) => {
          var V = Eu();
          E(j, V);
        };
        X(y, (j) => {
          r.ctx.ui?.AccessDenied ? j(A) : j(N, -1);
        });
      }
      E(s, f);
    }, ds = (s) => {
      var f = Tu(), y = g(f), A = g(y), N = x(y, 2);
      {
        var j = (oe) => {
          var J = Au(), ye = g(J), U = x(ye, 2), $ = g(U);
          M(
            (ne, ee, ce) => {
              u(J, 1, ne), u(ye, 1, ee), u(U, 1, ce), I($, n(h));
            },
            [
              () => l(t("mt-2")),
              () => l(t("text-xs cursor-pointer select-none opacity-80")),
              () => l(t("mt-2 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto opacity-90"))
            ]
          ), E(oe, J);
        }, V = /* @__PURE__ */ re(() => li(n(h)) !== n(h));
        X(N, (oe) => {
          n(V) && oe(j);
        });
      }
      M(
        (oe, J, ye) => {
          u(f, 1, oe), u(y, 1, J), I(A, ye);
        },
        [
          () => l(t("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300")),
          () => l(t("font-medium")),
          () => li(n(h))
        ]
      ), E(s, f);
    };
    X(yi, (s) => {
      n(k) ? s(us) : n(h) && s(ds, 1);
    });
  }
  var va = x(yi, 2), mi = g(va);
  ct(mi, 17, () => $o, (s) => s.id, (s, f) => {
    var y = Dr(), A = g(y);
    M(
      (N) => {
        u(y, 1, N), I(A, n(f).label);
      },
      [
        () => l(t("px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors", n(v) === n(f).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Re("click", y, () => {
      m(v, n(f).id, !0);
    }), E(s, y);
  });
  var fs = x(mi, 2);
  {
    var cs = (s) => {
      var f = Mu(), y = g(f);
      _u(y), M((A) => u(f, 1, A), [
        () => l(t("ml-auto px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5", n(v) === "admin" ? "border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"))
      ]), Re("click", f, () => {
        m(v, "admin");
      }), E(s, f);
    };
    X(fs, (s) => {
      n(w) && s(cs);
    });
  }
  var vs = x(va, 2), ps = g(vs);
  {
    var gs = (s) => {
      var f = ju(), y = g(f), A = x(y, 2);
      {
        var N = (U) => {
          var $ = ka();
          ct($, 20, () => Array(4), Di, (ne, ee) => {
            var ce = Nu(), ve = g(ce), he = x(ve, 2), we = x(he, 2), me = x(we, 2), Ie = x(me, 2);
            M(
              (Ae, D, R, L, P, F) => {
                u(ce, 1, Ae), u(ve, 1, D), u(he, 1, R), u(we, 1, L), u(me, 1, P), u(Ie, 1, F);
              },
              [
                () => l(t("px-4 py-4 animate-pulse flex gap-4")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-16")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 hidden sm:block")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24")),
                () => l(t("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"))
              ]
            ), E(ne, ce);
          }), M((ne) => u($, 1, ne), [
            () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), E(U, $);
        }, j = (U) => {
          var $ = Ru(), ne = g($), ee = x(ne, 2), ce = x(ee, 2);
          M(
            (ve, he, we, me) => {
              u($, 1, ve), u(ne, 0, he), u(ee, 1, we), u(ce, 1, me);
            },
            [
              () => l(t("px-6 py-12 text-center")),
              () => l(t("w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3")),
              () => l(t("text-sm font-medium text-gray-500 dark:text-gray-400")),
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-1"))
            ]
          ), E(U, $);
        }, V = (U) => {
          var $ = ka();
          ct($, 21, () => n(Fe), (ne) => ne._id || ne.tx_id, (ne, ee) => {
            const ce = /* @__PURE__ */ re(() => n(ee).timestamp ? ni(n(ee).timestamp) : null), ve = /* @__PURE__ */ re(() => en(n(ee).principal_from)), he = /* @__PURE__ */ re(() => en(n(ee).principal_to)), we = /* @__PURE__ */ re(() => si(n(ee)));
            var me = Lu(), Ie = g(me), Ae = g(Ie), D = g(Ae), R = g(D), L = x(D, 2), P = x(g(L));
            {
              var F = (q) => {
                var B = Dr(), ge = g(B);
                M(
                  (Ne) => {
                    u(B, 1, Ne), Ye(B, "title", n(he).title), I(ge, n(he).display);
                  },
                  [
                    () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline"))
                  ]
                ), Re("click", B, () => Ct(n(ee).principal_to)), E(q, B);
              }, te = (q) => {
                var B = nn(), ge = g(B);
                M(() => {
                  Ye(B, "title", n(he).title), I(ge, n(he).display);
                }), E(q, B);
              };
              X(P, (q) => {
                n(he).copyable ? q(F) : q(te, -1);
              });
            }
            var be = x(L, 2), H = x(g(be));
            {
              var ae = (q) => {
                var B = Dr(), ge = g(B);
                M(
                  (Ne) => {
                    u(B, 1, Ne), Ye(B, "title", n(ve).title), I(ge, n(ve).display);
                  },
                  [
                    () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline"))
                  ]
                ), Re("click", B, () => Ct(n(ee).principal_from)), E(q, B);
              }, de = (q) => {
                var B = nn(), ge = g(B);
                M(() => {
                  Ye(B, "title", n(ve).title), I(ge, n(ve).display);
                }), E(q, B);
              };
              X(H, (q) => {
                n(ve).copyable ? q(ae) : q(de, -1);
              });
            }
            var Se = x(Ae, 2), Me = g(Se), Pe = g(Me), Ee = x(Me, 2);
            {
              var je = (q) => {
                var B = Dr(), ge = g(B);
                M(
                  (Ne, Ve, Be) => {
                    u(B, 1, Ne), Ye(B, "title", Ve), I(ge, Be);
                  },
                  [
                    () => l(t("text-xs text-gray-400 hover:underline")),
                    () => n(ce).toLocaleString(),
                    () => aa(n(ce))
                  ]
                ), Re("click", B, () => Ct(n(ce).toLocaleString())), E(q, B);
              };
              X(Ee, (q) => {
                n(ce) && q(je);
              });
            }
            M(
              (q, B, ge, Ne, Ve, Be, We, wt, O) => {
                u(me, 1, q), u(Ie, 1, B), u(Ae, 1, ge), u(D, 1, Ne), I(R, Ve), u(L, 1, Be), u(be, 1, We), u(Se, 1, wt), u(Me, 1, O), Ye(Me, "title", n(we).title), I(Pe, n(we).text);
              },
              [
                () => l(t("px-4 py-3")),
                () => l(t("flex items-start justify-between gap-3")),
                () => l(t("min-w-0")),
                () => l(t("text-xs font-medium", oi(n(ee).kind))),
                () => ii(n(ee).kind),
                () => l(t("mt-1 text-xs text-gray-500 dark:text-gray-400")),
                () => l(t("mt-0.5 text-xs text-gray-400")),
                () => l(t("text-right shrink-0")),
                () => l(t("font-medium tabular-nums text-sm", n(we).className))
              ]
            ), E(ne, me);
          }), M((ne) => u($, 1, ne), [
            () => l(t("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), E(U, $);
        }, oe = (U) => {
          var $ = Cu(), ne = g($), ee = g(ne), ce = g(ee), ve = g(ce), he = x(ve), we = x(he), me = x(we), Ie = x(me), Ae = x(ee);
          ct(Ae, 21, () => n(Fe), (D) => D._id || D.tx_id, (D, R) => {
            const L = /* @__PURE__ */ re(() => n(R).timestamp ? ni(n(R).timestamp) : null), P = /* @__PURE__ */ re(() => en(n(R).principal_from)), F = /* @__PURE__ */ re(() => en(n(R).principal_to)), te = /* @__PURE__ */ re(() => si(n(R)));
            var be = Ou(), H = g(be), ae = g(H);
            {
              var de = (se) => {
                var _e = Sa(), pe = tr(_e), Ze = g(pe), Ht = x(pe, 2);
                {
                  var qt = (Qe) => {
                    var ft = wa();
                    M((vr) => u(ft, 1, vr), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), E(Qe, ft);
                  }, Ke = /* @__PURE__ */ re(() => n(Ce) === n(L).toLocaleString());
                  X(Ht, (Qe) => {
                    n(Ke) && Qe(qt);
                  });
                }
                M(
                  (Qe, ft, vr) => {
                    u(pe, 1, Qe), Ye(pe, "title", ft), I(Ze, vr);
                  },
                  [
                    () => l(t("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                    () => n(L).toLocaleString(),
                    () => aa(n(L))
                  ]
                ), Re("click", pe, () => Ct(n(L).toLocaleString())), E(se, _e);
              }, Se = (se) => {
                var _e = Du();
                M((pe) => u(_e, 1, pe), [() => l(t("text-gray-400"))]), E(se, _e);
              };
              X(ae, (se) => {
                n(L) ? se(de) : se(Se, -1);
              });
            }
            var Me = x(ae, 2), Pe = g(Me), Ee = x(H), je = g(Ee), q = g(je), B = x(Ee), ge = g(B);
            {
              var Ne = (se) => {
                var _e = Sa(), pe = tr(_e), Ze = g(pe), Ht = x(pe, 2);
                {
                  var qt = (Ke) => {
                    var Qe = wa();
                    M((ft) => u(Qe, 1, ft), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), E(Ke, Qe);
                  };
                  X(Ht, (Ke) => {
                    n(Ce) === n(R).principal_from && Ke(qt);
                  });
                }
                M(
                  (Ke) => {
                    u(pe, 1, Ke), Ye(pe, "title", n(P).title), I(Ze, n(P).display);
                  },
                  [
                    () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Re("click", pe, () => Ct(n(R).principal_from)), E(se, _e);
              }, Ve = (se) => {
                var _e = nn(), pe = g(_e);
                M(
                  (Ze) => {
                    u(_e, 1, Ze), Ye(_e, "title", n(P).title), I(pe, n(P).display);
                  },
                  [() => l(t("text-xs text-gray-700 dark:text-gray-300"))]
                ), E(se, _e);
              };
              X(ge, (se) => {
                n(P).copyable ? se(Ne) : se(Ve, -1);
              });
            }
            var Be = x(B), We = g(Be);
            {
              var wt = (se) => {
                var _e = Sa(), pe = tr(_e), Ze = g(pe), Ht = x(pe, 2);
                {
                  var qt = (Ke) => {
                    var Qe = wa();
                    M((ft) => u(Qe, 1, ft), [
                      () => l(t("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), E(Ke, Qe);
                  };
                  X(Ht, (Ke) => {
                    n(Ce) === n(R).principal_to && Ke(qt);
                  });
                }
                M(
                  (Ke) => {
                    u(pe, 1, Ke), Ye(pe, "title", n(F).title), I(Ze, n(F).display);
                  },
                  [
                    () => l(t("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Re("click", pe, () => Ct(n(R).principal_to)), E(se, _e);
              }, O = (se) => {
                var _e = nn(), pe = g(_e);
                M(
                  (Ze) => {
                    u(_e, 1, Ze), Ye(_e, "title", n(F).title), I(pe, n(F).display);
                  },
                  [() => l(t("text-xs text-gray-700 dark:text-gray-300"))]
                ), E(se, _e);
              };
              X(We, (se) => {
                n(F).copyable ? se(wt) : se(O, -1);
              });
            }
            var W = x(Be), fe = g(W), Ge = g(fe);
            M(
              (se, _e, pe, Ze, Ht, qt, Ke, Qe, ft, vr) => {
                u(be, 1, se), u(H, 1, _e), u(Me, 1, pe), I(Pe, `#${(n(R).tx_id || n(R)._id) ?? ""}`), u(Ee, 1, Ze), u(je, 1, Ht), I(q, qt), u(B, 1, Ke), u(Be, 1, Qe), u(W, 1, ft), u(fe, 1, vr), Ye(fe, "title", n(te).title), I(Ge, n(te).text);
              },
              [
                () => l(t("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
                () => l(t("px-4 py-3")),
                () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
                () => l(t("px-4 py-3")),
                () => l(t("px-2 py-0.5 rounded text-xs font-medium", oi(n(R).kind))),
                () => ii(n(R).kind),
                () => l(t("px-4 py-3")),
                () => l(t("px-4 py-3")),
                () => l(t("px-4 py-3 text-right")),
                () => l(t("font-medium tabular-nums", n(te).className))
              ]
            ), E(D, be);
          }), M(
            (D, R, L, P, F, te, be, H, ae) => {
              u($, 1, D), u(ne, 1, R), u(ee, 1, L), u(ve, 1, P), u(he, 1, F), u(we, 1, te), u(me, 1, be), u(Ie, 1, H), u(Ae, 1, ae);
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
          ), E(U, $);
        };
        X(A, (U) => {
          n(_) && n(Fe).length === 0 ? U(N) : n(Fe).length === 0 ? U(j, 1) : n(la) ? U(V, 2) : U(oe, -1);
        });
      }
      var J = x(A, 2);
      {
        var ye = (U) => {
          const $ = /* @__PURE__ */ re(() => Number(n(De).total_items_count)), ne = /* @__PURE__ */ re(() => n($) > 0 ? n(Oe) * bt + 1 : 0), ee = /* @__PURE__ */ re(() => Math.min((n(Oe) + 1) * bt, n($))), ce = /* @__PURE__ */ re(() => Number(n(De).total_pages) > 1);
          var ve = Fu(), he = g(ve), we = g(he), me = x(we);
          {
            var Ie = (R) => {
              var L = nn(), P = g(L);
              M(
                (F) => {
                  u(L, 1, F), I(P, `(Page ${n(Oe) + 1} of ${n(De).total_pages ?? ""})`);
                },
                [() => l(t("ml-1"))]
              ), E(R, L);
            };
            X(me, (R) => {
              n(ce) && R(Ie);
            });
          }
          var Ae = x(he, 2);
          {
            var D = (R) => {
              var L = Pu(), P = g(L), F = x(P, 2);
              ct(F, 17, () => Qo(Number(n(De).total_pages), n(Oe)), Di, (be, H) => {
                var ae = Nn(), de = tr(ae);
                {
                  var Se = (Pe) => {
                    var Ee = Iu();
                    M((je) => u(Ee, 1, je), [() => l(t("px-1.5 text-xs text-gray-400"))]), E(Pe, Ee);
                  }, Me = (Pe) => {
                    var Ee = Dr(), je = g(Ee);
                    M(
                      (q) => {
                        u(Ee, 1, q), I(je, n(H) + 1);
                      },
                      [
                        () => l(t("px-2.5 py-1 text-xs border rounded", n(Oe) === n(H) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                      ]
                    ), Re("click", Ee, () => sa(n(H))), E(Pe, Ee);
                  };
                  X(de, (Pe) => {
                    n(H) === "..." ? Pe(Se) : Pe(Me, -1);
                  });
                }
                E(be, ae);
              });
              var te = x(F, 2);
              M(
                (be, H, ae, de) => {
                  u(L, 1, be), P.disabled = n(Oe) === 0, u(P, 1, H), te.disabled = ae, u(te, 1, de);
                },
                [
                  () => l(t("flex items-center gap-1")),
                  () => l(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
                  () => n(Oe) >= Number(n(De).total_pages) - 1,
                  () => l(t("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
                ]
              ), Re("click", P, () => sa(n(Oe) - 1)), Re("click", te, () => sa(n(Oe) + 1)), E(R, L);
            };
            X(Ae, (R) => {
              n(ce) && R(D);
            });
          }
          M(
            (R, L) => {
              u(ve, 1, R), u(he, 1, L), I(we, `Showing ${n(ne) ?? ""}–${n(ee) ?? ""} of ${n($) ?? ""} `);
            },
            [
              () => l(t("p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3")),
              () => l(t("text-xs text-gray-500 dark:text-gray-400"))
            ]
          ), E(U, ve);
        };
        X(J, (U) => {
          n(De) && n(Fe).length > 0 && U(ye);
        });
      }
      M(
        (U, $) => {
          u(f, 1, U), u(y, 1, $);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 overflow-hidden sm:border sm:rounded-xl")),
          () => l(t("text-lg font-semibold px-4 py-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"))
        ]
      ), E(s, f);
    }, _s = (s) => {
      var f = zu(), y = g(f), A = x(y, 2), N = x(A, 2), j = g(N), V = g(j), oe = x(V, 2);
      {
        var J = (O) => {
          var W = Vu();
          M((fe) => u(W, 1, fe), [() => l(t("text-sm text-gray-500 dark:text-gray-400"))]), E(O, W);
        }, ye = (O) => {
          var W = an(), fe = g(W);
          M(
            (Ge) => {
              u(W, 1, Ge), I(fe, `Sending ${n(C)[n(Bt)[0]].symbol ?? ""}`);
            },
            [() => l(t("text-sm text-gray-900 dark:text-gray-100"))]
          ), E(O, W);
        }, U = (O) => {
          var W = Bu();
          ct(W, 20, () => n(Bt), (fe) => fe, (fe, Ge) => {
            var se = Fi(), _e = g(se), pe = {};
            M(() => {
              I(_e, n(C)[Ge].symbol), pe !== (pe = Ge) && (se.value = (se.__value = Ge) ?? "");
            }), E(fe, se);
          }), M((fe) => u(W, 1, fe), [
            () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), Ci(W, () => n(Ot), (fe) => m(Ot, fe)), E(O, W);
        };
        X(oe, (O) => {
          n(Bt).length === 0 ? O(J) : n(Bt).length === 1 ? O(ye, 1) : O(U, -1);
        });
      }
      var $ = x(j, 2), ne = g($), ee = x(ne, 2), ce = x(ee, 2);
      {
        var ve = (O) => {
          var W = Hu();
          M((fe) => u(W, 1, fe), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), E(O, W);
        }, he = (O) => {
          var W = an(), fe = g(W);
          M(
            (Ge) => {
              u(W, 1, Ge), I(fe, n(Qn));
            },
            [
              () => l(t("text-xs text-gray-600 dark:text-gray-400 mt-1"))
            ]
          ), E(O, W);
        }, we = (O) => {
          var W = qu();
          M((fe) => u(W, 1, fe), [
            () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1"))
          ]), E(O, W);
        };
        X(ce, (O) => {
          n(Rr) && !n(ei) ? O(ve) : n(Qn) ? O(he, 1) : O(we, -1);
        });
      }
      var me = x($, 2), Ie = g(me), Ae = g(Ie), D = g(Ae), R = x(Ae, 2), L = x(Ie, 2), P = x(L, 2);
      {
        var F = (O) => {
          var W = an(), fe = g(W);
          M(
            (Ge, se, _e) => {
              u(W, 1, Ge), I(fe, `Available ${se ?? ""}
								· Network fee ${_e ?? ""}`);
            },
            [
              () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-1")),
              () => er(n(Xn), n(Xe).decimals, n(Xe).symbol),
              () => er(n(Zn), n(Xe).decimals, n(Xe).symbol)
            ]
          ), E(O, W);
        };
        X(P, (O) => {
          n(Xe) && O(F);
        });
      }
      var te = x(P, 2);
      {
        var be = (O) => {
          var W = an(), fe = g(W);
          M(
            (Ge, se) => {
              u(W, 1, Ge), I(fe, `= ${se ?? ""}`);
            },
            [
              () => l(t("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
              () => cr(n($t))
            ]
          ), E(O, W);
        };
        X(te, (O) => {
          n($t) != null && n($t) > 0 && O(be);
        });
      }
      var H = x(me, 2), ae = g(H), de = x(ae, 2), Se = g(de), Me = x(Se, 2), Pe = g(Me), Ee = x(Pe, 2), je = x(Ee, 2);
      {
        var q = (O) => {
          var W = ji();
          M((fe) => u(W, 1, fe), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), E(O, W);
        };
        X(je, (O) => {
          n($n) || O(q);
        });
      }
      var B = x(Me, 2), ge = g(B), Ne = x(ge, 2), Ve = x(Ne, 2);
      {
        var Be = (O) => {
          var W = ji();
          M((fe) => u(W, 1, fe), [
            () => l(t("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), E(O, W);
        };
        X(Ve, (O) => {
          n(ea) || O(Be);
        });
      }
      var We = x(H, 2), wt = g(We);
      M(
        (O, W, fe, Ge, se, _e, pe, Ze, Ht, qt, Ke, Qe, ft, vr, ys, ms, bs, ks, ws, Ss) => {
          u(f, 1, O), u(y, 1, W), u(A, 1, fe), u(N, 1, Ge), u(V, 1, se), u(ne, 1, _e), u(ee, 1, pe), u(Ie, 1, Ze), u(Ae, 1, Ht), I(D, `Amount${n(Xe) ? ` (${n(Xe).symbol})` : ""}`), R.disabled = !n(Xe) || n(Xn) <= n(Zn), u(R, 1, qt), u(L, 1, Ke), u(H, 1, Qe), u(ae, 1, ft), u(de, 1, vr), u(Se, 1, ys), u(Pe, 1, ms), u(Ee, 1, bs), u(ge, 1, ks), u(Ne, 1, ws), We.disabled = !n(ti), u(We, 1, Ss), I(wt, n(_) ? "Sending…" : "Send");
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 p-4 sm:border sm:rounded-xl sm:p-6")),
          () => l(t("text-sm text-indigo-600 dark:text-indigo-400 mb-3 inline-flex items-center gap-1")),
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
          () => l(t("w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40", n($n) ? "border-gray-300 dark:border-gray-600" : "border-red-400 dark:border-red-600")),
          () => l(t("block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1")),
          () => l(t("w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40", n(ea) ? "border-gray-300 dark:border-gray-600" : "border-red-400 dark:border-red-600")),
          () => l(t("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), Re("click", y, () => {
        m(v, "activity");
      }), Li("submit", N, (O) => {
        O.preventDefault(), Xo();
      }), nr(ee, () => n(En), (O) => m(En, O)), Re("click", R, Uo), nr(L, () => n(Zr), (O) => m(Zr, O)), nr(Ee, () => n(ur), (O) => m(ur, O)), nr(Ne, () => n(dr), (O) => m(dr, O)), E(s, f);
    }, hs = (s) => {
      var f = $u(), y = g(f), A = x(y, 2), N = x(A, 2), j = g(N);
      {
        var V = (D) => {
          var R = Uu(), L = g(R);
          L.value = L.__value = "user";
          var P = x(L);
          P.value = P.__value = "invoice";
          var F = x(P);
          F.value = F.__value = "raw", M((te) => u(R, 1, te), [
            () => l(t("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"))
          ]), Re("change", R, () => {
            m(kt, null);
          }), Ci(R, () => n(st), (te) => m(st, te)), E(D, R);
        }, oe = (D) => {
          var R = Nn(), L = tr(R);
          ct(
            L,
            16,
            () => [
              { id: "user", label: "Member" },
              { id: "invoice", label: "Invoice" },
              { id: "raw", label: "Advanced" }
            ],
            (P) => P.id,
            (P, F) => {
              var te = Dr(), be = g(te);
              M(
                (H) => {
                  u(te, 1, H), I(be, F.label);
                },
                [
                  () => l(t("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", n(st) === F.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
                ]
              ), Re("click", te, () => {
                m(st, F.id, !0), m(kt, null);
              }), E(P, te);
            }
          ), E(D, R);
        };
        X(j, (D) => {
          n(la) ? D(V) : D(oe, -1);
        });
      }
      var J = x(N, 2);
      {
        var ye = (D) => {
          var R = Wu();
          M((L) => u(R, 1, L), [
            () => l(t("text-xs text-gray-500 dark:text-gray-400 mb-3"))
          ]), E(D, R);
        };
        X(J, (D) => {
          n(st) === "raw" && D(ye);
        });
      }
      var U = x(J, 2), $ = g(U);
      {
        var ne = (D) => {
          var R = Yu(), L = tr(R), P = x(L, 2);
          ct(P, 21, () => n(Oo), (F) => F.principal, (F, te) => {
            var be = Fi(), H = g(be), ae = {};
            M(() => {
              I(H, n(te).label), ae !== (ae = n(te).principal) && (be.value = (be.__value = n(te).principal) ?? "");
            }), E(F, be);
          }), M((F) => u(L, 1, F), [
            () => l(t("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), nr(L, () => n(Qt), (F) => m(Qt, F)), E(D, R);
        }, ee = (D) => {
          var R = Ju();
          M((L) => u(R, 1, L), [
            () => l(t("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), nr(R, () => n(Qr), (L) => m(Qr, L)), E(D, R);
        }, ce = (D) => {
          var R = Gu();
          M((L) => u(R, 1, L), [
            () => l(t("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), nr(R, () => n($r), (L) => m($r, L)), E(D, R);
        };
        X($, (D) => {
          n(st) === "user" ? D(ne) : n(st) === "invoice" ? D(ee, 1) : D(ce, -1);
        });
      }
      var ve = x($, 2), he = g(ve);
      {
        var we = (D) => {
          Pi(D);
        };
        X(he, (D) => {
          n(Nr) && D(we);
        });
      }
      var me = x(he), Ie = x(U, 2);
      {
        var Ae = (D) => {
          var R = Qu(), L = g(R), P = g(L), F = g(P), te = g(F), be = x(F, 2);
          {
            var H = (q) => {
              var B = Ku(), ge = g(B);
              M(
                (Ne, Ve) => {
                  u(B, 1, Ne), I(ge, Ve);
                },
                [
                  () => l(t("text-xs text-gray-500 dark:text-gray-400 mt-0.5")),
                  () => n(fr)[n(Qt).trim()]
                ]
              ), E(q, B);
            }, ae = /* @__PURE__ */ re(() => n(st) === "user" && n(fr)[n(Qt).trim()]);
            X(be, (q) => {
              n(ae) && q(H);
            });
          }
          var de = x(P, 2), Se = g(de), Me = x(L, 2);
          ct(Me, 21, () => Object.entries(n(kt).balances), ([q, B]) => q, (q, B) => {
            var ge = /* @__PURE__ */ re(() => Cs(n(B), 2));
            let Ne = () => n(ge)[0], Ve = () => n(ge)[1];
            const Be = /* @__PURE__ */ re(() => ra(Ne()));
            var We = Xu(), wt = g(We), O = g(wt), W = x(wt, 2), fe = g(W);
            M(
              (Ge, se, _e, pe, Ze) => {
                u(We, 1, Ge), Ye(We, "title", se), u(wt, 1, _e), I(O, n(Be).symbol), u(W, 1, pe), I(fe, Ze);
              },
              [
                () => l(t("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => cr(Number(Ve())),
                () => l(t("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => l(t("text-lg font-bold tabular-nums", Number(Ve()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-gray-500")),
                () => er(Number(Ve()), n(Be).decimals, n(Be).symbol)
              ]
            ), E(q, We);
          });
          var Pe = x(Me, 2);
          {
            var Ee = (q) => {
              var B = Zu();
              M((ge) => u(B, 1, ge), [() => l(t("text-sm text-gray-500 italic"))]), E(q, B);
            }, je = /* @__PURE__ */ re(() => Object.values(n(kt).balances).every((q) => Number(q) === 0));
            X(Pe, (q) => {
              n(je) && q(Ee);
            });
          }
          M(
            (q, B, ge, Ne, Ve, Be, We) => {
              u(R, 1, q), u(L, 1, B), u(F, 1, ge), I(te, Ne), u(de, 1, Ve), Ye(de, "title", n(kt).subaccount_hex), I(Se, `${Be ?? ""}…`), u(Me, 1, We);
            },
            [
              () => l(t("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3")),
              () => l(t("flex items-center justify-between gap-3")),
              () => l(t("text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => Ho(),
              () => l(t("text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono")),
              () => n(kt).subaccount_hex.substring(0, 16),
              () => l(t("space-y-2"))
            ]
          ), Re("click", de, () => Ct(n(kt)?.subaccount_hex || "")), E(D, R);
        };
        X(Ie, (D) => {
          n(kt) && D(Ae);
        });
      }
      M(
        (D, R, L, P, F, te) => {
          u(f, 1, D), u(y, 1, R), u(A, 1, L), u(N, 1, P), u(U, 1, F), ve.disabled = n(Nr), u(ve, 1, te), I(me, ` ${n(Nr) ? "Looking up…" : "Look up"}`);
        },
        [
          () => l(t("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(t("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => l(t("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => l(t("flex flex-wrap gap-2 mb-4")),
          () => l(t("flex gap-2 mb-4")),
          () => l(t("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"))
        ]
      ), Li("submit", U, (D) => {
        D.preventDefault(), Zo();
      }), E(s, f);
    }, xs = (s) => {
      var f = nd(), y = g(f), A = x(y, 2), N = g(A), j = g(N);
      {
        var V = (H) => {
          Pi(H);
        };
        X(j, (H) => {
          n(_) && H(V);
        });
      }
      var oe = x(j), J = x(A, 2), ye = g(J), U = x(ye, 2), $ = x(U, 2), ne = g($), ee = x(ne, 2), ce = x(ee, 2), ve = x(ce, 2), he = x(J, 2), we = g(he), me = g(we), Ie = g(me), Ae = x(me, 2);
      {
        var D = (H) => {
          var ae = ka();
          ct(ae, 23, () => n(ke), (de, Se) => de._id ?? de.principal ?? de.id ?? Se, (de, Se) => {
            const Me = /* @__PURE__ */ re(() => ra(n(Se).token)), Pe = /* @__PURE__ */ re(() => n(Se).principal || n(Se)._id || n(Se).id), Ee = /* @__PURE__ */ re(() => en(n(Pe)));
            var je = ed(), q = g(je), B = g(q), ge = x(q, 2), Ne = g(ge);
            M(
              (Ve, Be, We, wt, O) => {
                u(je, 1, Ve), u(q, 1, Be), Ye(q, "title", n(Ee).title), I(B, n(Ee).display), u(ge, 1, We), Ye(ge, "title", wt), I(Ne, O);
              },
              [
                () => l(t("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => l(t("text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => l(t("text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums")),
                () => cr(n(Se).amount || 0),
                () => er(n(Se).amount || 0, n(Me).decimals, n(Me).symbol)
              ]
            ), E(de, je);
          }), M((de) => u(ae, 1, de), [() => l(t("space-y-2 max-h-80 overflow-auto"))]), E(H, ae);
        }, R = (H) => {
          var ae = td();
          M((de) => u(ae, 1, de), [() => l(t("text-gray-500 dark:text-gray-400 text-sm"))]), E(H, ae);
        };
        X(Ae, (H) => {
          n(ke).length > 0 ? H(D) : H(R, -1);
        });
      }
      var L = x(we, 2), P = g(L), F = x(P, 2);
      {
        var te = (H) => {
          var ae = an(), de = g(ae);
          M(
            (Se) => {
              u(ae, 1, Se), I(de, `Total transfers: ${n(De).total_items_count ?? ""}`);
            },
            [() => l(t("text-sm text-gray-600 dark:text-gray-400"))]
          ), E(H, ae);
        }, be = (H) => {
          var ae = rd();
          M((de) => u(ae, 1, de), [() => l(t("text-gray-500 dark:text-gray-400 text-sm"))]), E(H, ae);
        };
        X(F, (H) => {
          n(De) ? H(te) : H(be, -1);
        });
      }
      M(
        (H, ae, de, Se, Me, Pe, Ee, je, q, B, ge, Ne, Ve, Be, We) => {
          u(f, 1, H), u(y, 1, ae), u(A, 1, de), N.disabled = n(_), u(N, 1, Se), I(oe, ` ${n(_) ? "Refreshing…" : "Full Vault Refresh"}`), u(J, 1, Me), u(ye, 1, Pe), u(U, 1, Ee), u($, 1, je), u(ne, 1, q), u(ee, 1, B), u(ce, 1, ge), u(ve, 1, Ne), u(he, 1, Ve), u(me, 1, Be), I(Ie, `All Balances in System (${n(ke).length ?? ""})`), u(P, 1, We);
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
      ), Re("click", N, oa), nr(ee, () => n(Dt), (H) => m(Dt, H)), Re("click", ve, Vo), E(s, f);
    };
    X(ps, (s) => {
      n(v) === "activity" ? s(gs) : n(v) === "send" ? s(_s, 1) : n(v) === "lookup" ? s(hs, 2) : n(v) === "admin" && s(xs, 3);
    });
  }
  M(
    (s, f, y, A, N, j, V, oe, J, ye, U, $, ne, ee) => {
      u(ua, 1, s), u(da, 1, f), u(ui, 1, y), u(fi, 1, A), u(ci, 1, N), I(es, cu), Mn.disabled = n(_), u(Mn, 1, j), u(vi, 1, V), u(fa, 1, oe), u(gi, 1, J), u(_i, 1, ye), u(ca, 1, U), u(hi, 1, $), u(tn, 1, ne), Ye(tn, "title", n(S)), I(as, n(S) || "Loading…"), u(va, 1, ee);
    },
    [
      () => l(t("max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6")),
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
  ), Re("click", Mn, oa), Re("click", tn, () => Ct(n(S))), E(e, ua), Ji();
}
Yl(["click", "change"]);
function ld(e, r) {
  const t = Xl(id, { target: e, props: { ctx: r } });
  return {
    unmount() {
      try {
        Ql(t);
      } catch {
      }
    }
  };
}
export {
  ld as default
};
