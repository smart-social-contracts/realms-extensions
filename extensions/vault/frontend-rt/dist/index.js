var bs = Object.defineProperty;
var vi = (e) => {
  throw TypeError(e);
};
var ms = (e, t, r) => t in e ? bs(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var it = (e, t, r) => ms(e, typeof t != "symbol" ? t + "" : t, r), ua = (e, t, r) => t.has(e) || vi("Cannot " + r);
var f = (e, t, r) => (ua(e, t, "read from private field"), r ? r.call(e) : t.get(e)), W = (e, t, r) => t.has(e) ? vi("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), H = (e, t, r, a) => (ua(e, t, "write to private field"), a ? a.call(e, r) : t.set(e, r), r), ne = (e, t, r) => (ua(e, t, "access private method"), r);
var Fa = Array.isArray, ks = Array.prototype.indexOf, On = Array.prototype.includes, qn = Array.from, ws = Object.defineProperty, un = Object.getOwnPropertyDescriptor, Ss = Object.getOwnPropertyDescriptors, Es = Object.prototype, Ts = Array.prototype, Li = Object.getPrototypeOf, hi = Object.isExtensible;
const As = () => {
};
function Ms(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Oi() {
  var e, t, r = new Promise((a, i) => {
    e = a, t = i;
  });
  return { promise: r, resolve: e, reject: t };
}
function Ns(e, t) {
  if (Array.isArray(e))
    return e;
  if (!(Symbol.iterator in e))
    return Array.from(e);
  const r = [];
  for (const a of e)
    if (r.push(a), r.length === t) break;
  return r;
}
const Ve = 2, qr = 4, Un = 8, Ci = 1 << 24, Tt = 16, yt = 32, Kt = 64, ka = 128, _t = 512, Pe = 1024, Fe = 2048, Nt = 4096, Ke = 8192, xt = 16384, Gr = 32768, pi = 1 << 25, Er = 65536, Cn = 1 << 17, Rs = 1 << 18, Kr = 1 << 19, Ds = 1 << 20, It = 1 << 25, Tr = 65536, In = 1 << 21, Ir = 1 << 22, ir = 1 << 23, fn = Symbol("$state"), An = Symbol("attributes"), wa = Symbol("class"), Ls = Symbol("style"), nn = Symbol("text"), Mn = Symbol("form reset"), bn = new class extends Error {
  constructor() {
    super(...arguments);
    it(this, "name", "StaleReactionError");
    it(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function Os(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Cs() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Is(e, t, r) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Ps(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Fs() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function js(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Bs() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Vs() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Hs() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function zs() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function qs() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Us = 1, Ws = 2, Ii = 4, Ys = 8, Js = 16, Gs = 1, Ks = 2, Ie = Symbol("uninitialized"), Xs = "http://www.w3.org/1999/xhtml";
function Zs() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Qs() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function $s() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Pi(e) {
  return e === this.v;
}
function el(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function Fi(e) {
  return !el(e, this.v);
}
let Xe = null;
function Ur(e) {
  Xe = e;
}
function ji(e, t = !1, r) {
  Xe = {
    p: Xe,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      ie
    ),
    l: null
  };
}
function Bi(e) {
  var t = (
    /** @type {ComponentContext} */
    Xe
  ), r = t.e;
  if (r !== null) {
    t.e = null;
    for (var a of r)
      oo(a);
  }
  return t.i = !0, Xe = t.p, /** @type {T} */
  {};
}
function Vi() {
  return !0;
}
let pr = [];
function Hi() {
  var e = pr;
  pr = [], Ms(e);
}
function Gt(e) {
  if (pr.length === 0 && !dn) {
    var t = pr;
    queueMicrotask(() => {
      t === pr && Hi();
    });
  }
  pr.push(e);
}
function tl() {
  for (; pr.length > 0; )
    Hi();
}
function zi(e) {
  var t = ie;
  if (t === null)
    return $.f |= ir, e;
  if ((t.f & Gr) === 0 && (t.f & qr) === 0)
    throw e;
  ar(e, t);
}
function ar(e, t) {
  if (!(t !== null && (t.f & xt) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & ka) !== 0) {
        if ((t.f & Gr) === 0)
          throw e;
        try {
          t.b.error(e);
          return;
        } catch (r) {
          e = r;
        }
      }
      t = t.parent;
    }
    throw e;
  }
}
const rl = -7169;
function Me(e, t) {
  e.f = e.f & rl | t;
}
function ja(e) {
  (e.f & _t) !== 0 || e.deps === null ? Me(e, Pe) : Me(e, Nt);
}
function qi(e) {
  if (e !== null)
    for (const t of e)
      (t.f & Ve) === 0 || (t.f & Tr) === 0 || (t.f ^= Tr, qi(
        /** @type {Derived} */
        t.deps
      ));
}
function Ui(e, t, r) {
  (e.f & Fe) !== 0 ? t.add(e) : (e.f & Nt) !== 0 && r.add(e), qi(e.deps), Me(e, Pe);
}
let gi = !1;
function nl() {
  gi || (gi = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t[Mn]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function Xr(e) {
  var t = $, r = ie;
  bt(null), jt(null);
  try {
    return e();
  } finally {
    bt(t), jt(r);
  }
}
function Wi(e, t, r, a = r) {
  e.addEventListener(t, () => Xr(r));
  const i = (
    /** @type {any} */
    e[Mn]
  );
  i ? e[Mn] = () => {
    i(), a(!0);
  } : e[Mn] = () => a(!0), nl();
}
function al(e) {
  let t = 0, r = Mr(0), a;
  return () => {
    qa() && (n(r), so(() => (t === 0 && (a = Ja(() => e(() => cn(r)))), t += 1, () => {
      Gt(() => {
        t -= 1, t === 0 && (a?.(), a = void 0, cn(r));
      });
    })));
  };
}
var il = Er | Kr;
function ol(e, t, r, a) {
  new sl(e, t, r, a);
}
var vt, Pa, ht, xr, Qe, pt, Ge, st, Ut, yr, rr, Pr, pn, gn, Wt, Vn, me, ll, ul, Sa, fl, Ea, Nn, Rn, Ta, Aa;
class sl {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, r, a, i) {
    W(this, me);
    /** @type {Boundary | null} */
    it(this, "parent");
    it(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    it(this, "transform_error");
    /** @type {TemplateNode} */
    W(this, vt);
    /** @type {TemplateNode | null} */
    W(this, Pa, null);
    /** @type {BoundaryProps} */
    W(this, ht);
    /** @type {((anchor: Node) => void)} */
    W(this, xr);
    /** @type {Effect} */
    W(this, Qe);
    /** @type {Effect | null} */
    W(this, pt, null);
    /** @type {Effect | null} */
    W(this, Ge, null);
    /** @type {Effect | null} */
    W(this, st, null);
    /** @type {DocumentFragment | null} */
    W(this, Ut, null);
    W(this, yr, 0);
    W(this, rr, 0);
    W(this, Pr, !1);
    /** @type {Set<Effect>} */
    W(this, pn, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    W(this, gn, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    W(this, Wt, null);
    W(this, Vn, al(() => (H(this, Wt, Mr(f(this, yr))), () => {
      H(this, Wt, null);
    })));
    H(this, vt, t), H(this, ht, r), H(this, xr, (o) => {
      var c = (
        /** @type {Effect} */
        ie
      );
      c.b = this, c.f |= ka, a(o);
    }), this.parent = /** @type {Effect} */
    ie.b, this.transform_error = i ?? this.parent?.transform_error ?? ((o) => o), H(this, Qe, Wn(() => {
      ne(this, me, Ea).call(this);
    }, il));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    Ui(t, f(this, pn), f(this, gn));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!f(this, ht).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, r) {
    ne(this, me, Ta).call(this, t, r), H(this, yr, f(this, yr) + t), !(!f(this, Wt) || f(this, Pr)) && (H(this, Pr, !0), Gt(() => {
      H(this, Pr, !1), f(this, Wt) && Wr(f(this, Wt), f(this, yr));
    }));
  }
  get_effect_pending() {
    return f(this, Vn).call(this), n(
      /** @type {Source<number>} */
      f(this, Wt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!f(this, ht).onerror && !f(this, ht).failed)
      throw t;
    Y?.is_fork ? (f(this, pt) && Y.skip_effect(f(this, pt)), f(this, Ge) && Y.skip_effect(f(this, Ge)), f(this, st) && Y.skip_effect(f(this, st)), Y.oncommit(() => {
      ne(this, me, Aa).call(this, t);
    })) : ne(this, me, Aa).call(this, t);
  }
}
vt = new WeakMap(), Pa = new WeakMap(), ht = new WeakMap(), xr = new WeakMap(), Qe = new WeakMap(), pt = new WeakMap(), Ge = new WeakMap(), st = new WeakMap(), Ut = new WeakMap(), yr = new WeakMap(), rr = new WeakMap(), Pr = new WeakMap(), pn = new WeakMap(), gn = new WeakMap(), Wt = new WeakMap(), Vn = new WeakMap(), me = new WeakSet(), ll = function() {
  try {
    H(this, pt, gt(() => f(this, xr).call(this, f(this, vt))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
ul = function(t) {
  const r = f(this, ht).failed, { reset: a, invoke_onerror: i } = ne(this, me, Sa).call(this, t);
  Gt(i), r && H(this, st, gt(() => {
    r(
      f(this, vt),
      () => t,
      () => a
    );
  }));
}, /**
 * Creates the `reset` function for a failed boundary, along with a function
 * that invokes `onerror` with it (if provided)
 * @param {unknown} error
 * @returns {{ reset: () => void, invoke_onerror: () => void }}
 */
Sa = function(t) {
  var r = !1, a = !1;
  const i = () => {
    if (r) {
      $s();
      return;
    }
    r = !0, a && qs(), f(this, st) !== null && wr(f(this, st), () => {
      H(this, st, null);
    }), ne(this, me, Rn).call(this, () => {
      ne(this, me, Ea).call(this);
    });
  };
  return { reset: i, invoke_onerror: () => {
    try {
      a = !0, f(this, ht).onerror?.(t, i), a = !1;
    } catch (c) {
      ar(c, f(this, Qe) && f(this, Qe).parent);
    }
  } };
}, fl = function() {
  const t = f(this, ht).pending;
  t && (this.is_pending = !0, H(this, Ge, gt(() => t(f(this, vt)))), Gt(() => {
    var r = H(this, Ut, document.createDocumentFragment()), a = or();
    r.append(a), H(this, pt, ne(this, me, Rn).call(this, () => gt(() => f(this, xr).call(this, a)))), f(this, rr) === 0 && (f(this, vt).before(r), H(this, Ut, null), wr(
      /** @type {Effect} */
      f(this, Ge),
      () => {
        H(this, Ge, null);
      }
    ), ne(this, me, Nn).call(
      this,
      /** @type {Batch} */
      Y
    ));
  }));
}, Ea = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), H(this, rr, 0), H(this, yr, 0), H(this, pt, gt(() => {
      f(this, xr).call(this, f(this, vt));
    })), f(this, rr) > 0) {
      var t = H(this, Ut, document.createDocumentFragment());
      Ya(f(this, pt), t);
      const r = (
        /** @type {(anchor: Node) => void} */
        f(this, ht).pending
      );
      H(this, Ge, gt(() => r(f(this, vt))));
    } else
      ne(this, me, Nn).call(
        this,
        /** @type {Batch} */
        Y
      );
  } catch (r) {
    this.error(r);
  }
}, /**
 * @param {Batch} batch
 */
Nn = function(t) {
  this.is_pending = !1, t.transfer_effects(f(this, pn), f(this, gn));
}, /**
 * @template T
 * @param {() => T} fn
 */
Rn = function(t) {
  var r = ie, a = $, i = Xe;
  jt(f(this, Qe)), bt(f(this, Qe)), Ur(f(this, Qe).ctx);
  try {
    return Ar.ensure(), t();
  } catch (o) {
    return zi(o), null;
  } finally {
    jt(r), bt(a), Ur(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Ta = function(t, r) {
  var a;
  if (!this.has_pending_snippet()) {
    this.parent && ne(a = this.parent, me, Ta).call(a, t, r);
    return;
  }
  H(this, rr, f(this, rr) + t), f(this, rr) === 0 && (ne(this, me, Nn).call(this, r), f(this, Ge) && wr(f(this, Ge), () => {
    H(this, Ge, null);
  }), f(this, Ut) && (f(this, vt).before(f(this, Ut)), H(this, Ut, null)));
}, /**
 * @param {unknown} error
 */
Aa = function(t) {
  f(this, pt) && (rt(f(this, pt)), H(this, pt, null)), f(this, Ge) && (rt(f(this, Ge)), H(this, Ge, null)), f(this, st) && (rt(f(this, st)), H(this, st, null));
  let r = f(this, ht).failed;
  const a = (i) => {
    const { reset: o, invoke_onerror: c } = ne(this, me, Sa).call(this, i);
    c(), r && H(this, st, ne(this, me, Rn).call(this, () => {
      try {
        return gt(() => {
          var h = (
            /** @type {Effect} */
            ie
          );
          h.b = this, h.f |= ka, r(
            f(this, vt),
            () => i,
            () => o
          );
        });
      } catch (h) {
        return ar(
          h,
          /** @type {Effect} */
          f(this, Qe).parent
        ), null;
      }
    }));
  };
  Gt(() => {
    var i;
    try {
      i = this.transform_error(t);
    } catch (o) {
      ar(o, f(this, Qe) && f(this, Qe).parent);
      return;
    }
    i !== null && typeof i == "object" && typeof /** @type {any} */
    i.then == "function" ? i.then(
      a,
      /** @param {unknown} e */
      (o) => ar(o, f(this, Qe) && f(this, Qe).parent)
    ) : a(i);
  });
};
function dl(e, t, r, a) {
  const i = Ba;
  var o = e.filter((w) => !w.settled), c = t.map(i);
  if (r.length === 0 && o.length === 0) {
    a(c);
    return;
  }
  var h = (
    /** @type {Effect} */
    ie
  ), v = cl(), p = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((w) => w.promise)) : null;
  function g(w) {
    if ((h.f & xt) === 0) {
      v();
      try {
        a([...c, ...w]);
      } catch (S) {
        ar(S, h);
      }
      Pn();
    }
  }
  var k = Yi();
  if (r.length === 0) {
    p.then(() => g([])).finally(k);
    return;
  }
  function b() {
    Promise.all(r.map((w) => /* @__PURE__ */ vl(w))).then(g).catch((w) => ar(w, h)).finally(k);
  }
  p ? p.then(() => {
    v(), b(), Pn();
  }) : b();
}
function cl() {
  var e = (
    /** @type {Effect} */
    ie
  ), t = $, r = Xe, a = (
    /** @type {Batch} */
    Y
  );
  return function(o = !0) {
    jt(e), bt(t), Ur(r), o && (e.f & xt) === 0 && (a?.activate(), a?.apply());
  };
}
function Pn(e = !0) {
  jt(null), bt(null), Ur(null), e && Y?.deactivate();
}
function Yi() {
  var e = (
    /** @type {Effect} */
    ie
  ), t = e.b, r = (
    /** @type {Batch} */
    Y
  ), a = !!t?.is_rendered();
  return t?.update_pending_count(1, r), r.increment(a, e), () => {
    t?.update_pending_count(-1, r), r.decrement(a, e);
  };
}
// @__NO_SIDE_EFFECTS__
function Ba(e) {
  var t = Ve | Fe;
  return ie !== null && (ie.f |= Kr), {
    ctx: Xe,
    deps: null,
    effects: null,
    equals: Pi,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Ie
    ),
    wv: 0,
    parent: ie,
    ac: null
  };
}
const an = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function vl(e, t, r) {
  let a = (
    /** @type {Effect | null} */
    ie
  );
  a === null && Cs();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = Mr(
    /** @type {V} */
    Ie
  ), c = !$, h = /* @__PURE__ */ new Set();
  return Ll(() => {
    var v = (
      /** @type {Effect} */
      ie
    ), p = Oi();
    i = p.promise;
    try {
      Promise.resolve(e()).then(p.resolve, (w) => {
        w !== bn && p.reject(w);
      }).finally(Pn);
    } catch (w) {
      p.reject(w), Pn();
    }
    var g = (
      /** @type {Batch} */
      Y
    );
    if (c) {
      if ((v.f & Gr) !== 0)
        var k = Yi();
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        a.b?.is_rendered()
      )
        g.async_deriveds.get(v)?.reject(an);
      else
        for (const w of h.values())
          w.reject(an);
      h.add(p), g.async_deriveds.set(v, p);
    }
    const b = (w, S = void 0) => {
      k?.(), h.delete(p), S !== an && (g.activate(), S ? (o.f |= ir, Wr(o, S)) : ((o.f & ir) !== 0 && (o.f ^= ir), Wr(o, w)), g.deactivate());
    };
    p.promise.then(b, (w) => b(null, w || "unknown"));
  }), Ua(() => {
    for (const v of h)
      v.reject(an);
  }), new Promise((v) => {
    function p(g) {
      function k() {
        g === i ? v(o) : p(i);
      }
      g.then(k, k);
    }
    p(i);
  });
}
// @__NO_SIDE_EFFECTS__
function ae(e) {
  const t = /* @__PURE__ */ Ba(e);
  return vo(t), t;
}
// @__NO_SIDE_EFFECTS__
function hl(e) {
  const t = /* @__PURE__ */ Ba(e);
  return t.equals = Fi, t;
}
function pl(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var r = 0; r < t.length; r += 1)
      rt(
        /** @type {Effect} */
        t[r]
      );
  }
}
function Va(e) {
  var t, r = ie, a = e.parent;
  if (!sr && a !== null && e.v !== Ie && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (a.f & (xt | Ke)) !== 0)
    return Zs(), e.v;
  jt(a);
  try {
    e.f &= ~Tr, pl(e), t = _o(e);
  } finally {
    jt(r);
  }
  return t;
}
function Ji(e) {
  var t = Va(e);
  if (!e.equals(t) && (e.wv = po(), (!Y?.is_fork || e.deps === null) && (Y !== null ? (Y.capture(e, t, !0), Ma?.capture(e, t, !0)) : e.v = t, e.deps === null))) {
    Me(e, Pe);
    return;
  }
  sr || (At !== null ? (qa() || Y?.is_fork) && At.set(e, t) : ja(e));
}
function gl(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && Xr(() => {
        t.ac.abort(bn), t.ac = null;
      }), t.fn !== null && (t.teardown = As), hn(t, 0), Wa(t));
}
function Gi(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Jr(t);
}
let fa = null, Lr = null, Y = null, Ma = null, At = null, Na = null, dn = !1, da = !1, Cr = null, Dn = null;
var _i = 0;
let _l = 1;
var Fr, nr, br, jr, Br, Vr, Yt, Hr, $e, _n, Jt, St, Ot, zr, mr, ce, Ra, on, Da, Ki, Xi, Or, xl, sn;
const Hn = class Hn {
  constructor() {
    W(this, ce);
    it(this, "id", _l++);
    /** True as soon as `#process` was called */
    W(this, Fr, !1);
    it(this, "linked", !0);
    /** @type {Batch | null} */
    W(this, nr, null);
    /** @type {Batch | null} */
    W(this, br, null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    it(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    it(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    it(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    W(this, jr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    W(this, Br, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    W(this, Vr, 0);
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    W(this, Yt, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    W(this, Hr, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    W(this, $e, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    W(this, _n, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    W(this, Jt, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    W(this, St, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    W(this, Ot, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    W(this, zr, /* @__PURE__ */ new Set());
    it(this, "is_fork", !1);
    W(this, mr, !1);
    Lr === null ? fa = Lr = this : (H(Lr, br, this), H(this, nr, Lr)), Lr = this;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    f(this, Ot).has(t) || f(this, Ot).set(t, { d: [], m: [] }), f(this, zr).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, r = (a) => this.schedule(a)) {
    var a = f(this, Ot).get(t);
    if (a) {
      f(this, Ot).delete(t);
      for (var i of a.d)
        Me(i, Fe), r(i);
      for (i of a.m)
        Me(i, Nt), r(i);
    }
    f(this, zr).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, r, a = !1) {
    t.v !== Ie && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & ir) === 0 && (this.current.set(t, [r, a]), At?.set(t, r)), this.is_fork || (t.v = r);
  }
  activate() {
    Y = this;
  }
  deactivate() {
    Y = null, At = null;
  }
  flush() {
    try {
      da = !0, Y = this, ne(this, ce, on).call(this);
    } finally {
      _i = 0, Na = null, Cr = null, Dn = null, da = !1, Y = null, At = null, Pt.clear();
    }
  }
  discard() {
    for (const t of f(this, Br)) t(this);
    f(this, Br).clear();
    for (const t of this.async_deriveds.values())
      t.reject(an);
    ne(this, ce, sn).call(this), f(this, Hr)?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    f(this, _n).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, r) {
    if (H(this, Vr, f(this, Vr) + 1), t) {
      let a = f(this, Yt).get(r) ?? 0;
      f(this, Yt).set(r, a + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(t, r) {
    if (H(this, Vr, f(this, Vr) - 1), t) {
      let a = f(this, Yt).get(r) ?? 0;
      a === 1 ? f(this, Yt).delete(r) : f(this, Yt).set(r, a - 1);
    }
    f(this, mr) || (H(this, mr, !0), Gt(() => {
      H(this, mr, !1), this.linked && this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, r) {
    for (const a of t)
      f(this, Jt).add(a);
    for (const a of r)
      f(this, St).add(a);
    t.clear(), r.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    f(this, jr).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    f(this, Br).add(t);
  }
  settled() {
    return (f(this, Hr) ?? H(this, Hr, Oi())).promise;
  }
  static ensure() {
    if (Y === null) {
      const t = Y = new Hn();
      !da && !dn && Gt(() => {
        f(t, Fr) || t.flush();
      });
    }
    return Y;
  }
  apply() {
    {
      At = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    if (Na = t, t.b?.is_pending && (t.f & (qr | Un | Ci)) !== 0 && (t.f & Gr) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var r = t; r.parent !== null; ) {
      r = r.parent;
      var a = r.f;
      if (Cr !== null && r === ie && ($ === null || ($.f & Ve) === 0))
        return;
      if ((a & (Kt | yt)) !== 0) {
        if ((a & Pe) === 0)
          return;
        r.f ^= Pe;
      }
    }
    f(this, $e).push(r);
  }
};
Fr = new WeakMap(), nr = new WeakMap(), br = new WeakMap(), jr = new WeakMap(), Br = new WeakMap(), Vr = new WeakMap(), Yt = new WeakMap(), Hr = new WeakMap(), $e = new WeakMap(), _n = new WeakMap(), Jt = new WeakMap(), St = new WeakMap(), Ot = new WeakMap(), zr = new WeakMap(), mr = new WeakMap(), ce = new WeakSet(), Ra = function() {
  if (this.is_fork) return !0;
  for (const a of f(this, Yt).keys()) {
    for (var t = a, r = !1; t.parent !== null; ) {
      if (f(this, Ot).has(t)) {
        r = !0;
        break;
      }
      t = t.parent;
    }
    if (!r)
      return !0;
  }
  return !1;
}, on = function() {
  var v, p, g;
  H(this, Fr, !0), _i++ > 1e3 && (ne(this, ce, sn).call(this), bl());
  for (const k of f(this, Jt))
    f(this, St).delete(k), Me(k, Fe), this.schedule(k);
  for (const k of f(this, St))
    Me(k, Nt), this.schedule(k);
  const t = f(this, $e);
  H(this, $e, []), this.apply();
  var r = Cr = [], a = [], i = Dn = [];
  for (const k of t)
    try {
      ne(this, ce, Da).call(this, k, r, a);
    } catch (b) {
      throw $i(k), ne(this, ce, Ra).call(this) || this.discard(), b;
    }
  if (Y = null, i.length > 0) {
    var o = Hn.ensure();
    for (const k of i)
      o.schedule(k);
  }
  if (Cr = null, Dn = null, ne(this, ce, Ra).call(this)) {
    ne(this, ce, Or).call(this, a), ne(this, ce, Or).call(this, r);
    for (const [k, b] of f(this, Ot))
      Qi(k, b);
    i.length > 0 && /** @type {unknown} */
    ne(v = Y, ce, on).call(v);
    return;
  }
  const c = ne(this, ce, Ki).call(this);
  if (c) {
    ne(this, ce, Or).call(this, a), ne(this, ce, Or).call(this, r), ne(p = c, ce, Xi).call(p, this);
    return;
  }
  f(this, Jt).clear(), f(this, St).clear();
  for (const k of f(this, jr)) k(this);
  f(this, jr).clear(), Ma = this, xi(a), xi(r), Ma = null, f(this, Hr)?.resolve();
  var h = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    Y
  );
  if (f(this, Vr) === 0 && (f(this, $e).length === 0 || h !== null) && ne(this, ce, sn).call(this), f(this, $e).length > 0)
    if (h !== null) {
      const k = h;
      f(k, $e).push(...f(this, $e).filter((b) => !f(k, $e).includes(b)));
    } else
      h = this;
  h !== null && (Pt.clear(), ne(g = h, ce, on).call(g));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Da = function(t, r, a) {
  t.f ^= Pe;
  for (var i = t.first; i !== null; ) {
    var o = i.f, c = (o & (yt | Kt)) !== 0, h = c && (o & Pe) !== 0, v = h || (o & Ke) !== 0 || f(this, Ot).has(i);
    if (!v && i.fn !== null) {
      c ? i.f ^= Pe : (o & qr) !== 0 ? r.push(i) : kn(i) && ((o & Tt) !== 0 && f(this, St).add(i), Jr(i));
      var p = i.first;
      if (p !== null) {
        i = p;
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
}, Ki = function() {
  for (var t = f(this, nr); t !== null; ) {
    if (!t.is_fork) {
      for (const [r, [, a]] of this.current)
        if (t.current.has(r) && !a)
          return t;
    }
    t = f(t, nr);
  }
  return null;
}, /**
 * @param {Batch} batch
 */
Xi = function(t) {
  var a;
  for (const [i, o] of t.current)
    !this.previous.has(i) && t.previous.has(i) && this.previous.set(i, t.previous.get(i)), this.current.set(i, o);
  for (const [i, o] of t.async_deriveds) {
    const c = this.async_deriveds.get(i);
    c && o.promise.then(c.resolve).catch(c.reject);
  }
  t.async_deriveds.clear(), this.transfer_effects(f(t, Jt), f(t, St));
  const r = (i) => {
    var o = i.reactions;
    if (o !== null && !((i.f & Ve) !== 0 && (i.f & (Fe | Nt)) === 0))
      for (const v of o) {
        var c = v.f;
        if ((c & Ve) !== 0)
          r(
            /** @type {Derived} */
            v
          );
        else {
          var h = (
            /** @type {Effect} */
            v
          );
          c & (Ir | Tt) && !this.async_deriveds.has(h) && (f(this, St).delete(h), Me(h, Fe), this.schedule(h));
        }
      }
  };
  for (const i of this.current.keys())
    r(i);
  this.oncommit(() => t.discard()), ne(a = t, ce, sn).call(a), Y = this, ne(this, ce, on).call(this);
}, /**
 * @param {Effect[]} effects
 */
Or = function(t) {
  for (var r = 0; r < t.length; r += 1)
    Ui(t[r], f(this, Jt), f(this, St));
}, xl = function() {
  var k;
  for (let b = fa; b !== null; b = f(b, br)) {
    var t = b.id < this.id, r = [];
    for (const [w, [S, R]] of this.current) {
      if (b.current.has(w)) {
        var a = (
          /** @type {[any, boolean]} */
          b.current.get(w)[0]
        );
        if (t && S !== a)
          b.current.set(w, [S, R]);
        else
          continue;
      }
      r.push(w);
    }
    if (t)
      for (const [w, S] of this.async_deriveds) {
        const R = b.async_deriveds.get(w);
        R && S.promise.then(R.resolve).catch(R.reject);
      }
    var i = [...b.current.keys()].filter(
      (w) => !/** @type {[any, boolean]} */
      b.current.get(w)[1]
    );
    if (!(!f(b, Fr) || i.length === 0)) {
      var o = i.filter((w) => !this.current.has(w));
      if (o.length === 0)
        t && b.discard();
      else if (r.length > 0) {
        if (t)
          for (const w of f(this, zr))
            b.unskip_effect(w, (S) => {
              var R;
              (S.f & (Tt | Ir)) !== 0 ? b.schedule(S) : ne(R = b, ce, Or).call(R, [S]);
            });
        b.activate();
        var c = /* @__PURE__ */ new Set(), h = /* @__PURE__ */ new Map();
        for (var v of r)
          Zi(v, o, c, h);
        h = /* @__PURE__ */ new Map();
        var p = [...b.current].filter(([w, S]) => {
          const R = this.current.get(w);
          return R ? R[0] !== S[0] || R[1] !== S[1] : !0;
        }).map(([w]) => w);
        if (p.length > 0)
          for (const w of f(this, _n))
            (w.f & (xt | Ke | Cn)) === 0 && Ha(w, p, h) && ((w.f & (Ir | Tt)) !== 0 ? (Me(w, Fe), b.schedule(w)) : f(b, Jt).add(w));
        if (f(b, $e).length > 0 && !f(b, mr)) {
          b.apply();
          for (var g of f(b, $e))
            ne(k = b, ce, Da).call(k, g, [], []);
          H(b, $e, []);
        }
        b.deactivate();
      }
    }
  }
}, sn = function() {
  if (this.linked) {
    var t = f(this, nr), r = f(this, br);
    t === null ? fa = r : H(t, br, r), r === null ? Lr = t : H(r, nr, t), this.linked = !1;
  }
};
let Ar = Hn;
function yl(e) {
  var t = dn;
  dn = !0;
  try {
    for (var r; ; ) {
      if (tl(), Y === null)
        return (
          /** @type {T} */
          r
        );
      Y.flush();
    }
  } finally {
    dn = t;
  }
}
function bl() {
  try {
    Bs();
  } catch (e) {
    ar(e, Na);
  }
}
let qt = null;
function xi(e) {
  var t = e.length;
  if (t !== 0) {
    for (var r = 0; r < t; ) {
      var a = e[r++];
      if ((a.f & (xt | Ke)) === 0 && kn(a) && (qt = /* @__PURE__ */ new Set(), Jr(a), a.deps === null && a.first === null && a.nodes === null && a.teardown === null && a.ac === null && uo(a), qt?.size > 0)) {
        Pt.clear();
        for (const i of qt) {
          if ((i.f & (xt | Ke)) !== 0) continue;
          const o = [i];
          let c = i.parent;
          for (; c !== null; )
            qt.has(c) && (qt.delete(c), o.push(c)), c = c.parent;
          for (let h = o.length - 1; h >= 0; h--) {
            const v = o[h];
            (v.f & (xt | Ke)) === 0 && Jr(v);
          }
        }
        qt.clear();
      }
    }
    qt = null;
  }
}
function Zi(e, t, r, a) {
  if (!r.has(e) && (r.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & Ve) !== 0 ? Zi(
        /** @type {Derived} */
        i,
        t,
        r,
        a
      ) : (o & (Ir | Tt)) !== 0 && (o & Fe) === 0 && Ha(i, t, a) && (Me(i, Fe), za(
        /** @type {Effect} */
        i
      ));
    }
}
function Ha(e, t, r) {
  const a = r.get(e);
  if (a !== void 0) return a;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (On.call(t, i))
        return !0;
      if ((i.f & Ve) !== 0 && Ha(
        /** @type {Derived} */
        i,
        t,
        r
      ))
        return r.set(
          /** @type {Derived} */
          i,
          !0
        ), !0;
    }
  return r.set(e, !1), !1;
}
function za(e) {
  Y.schedule(e);
}
function Qi(e, t) {
  if (!((e.f & yt) !== 0 && (e.f & Pe) !== 0)) {
    (e.f & Fe) !== 0 ? t.d.push(e) : (e.f & Nt) !== 0 && t.m.push(e), Me(e, Pe);
    for (var r = e.first; r !== null; )
      Qi(r, t), r = r.next;
  }
}
function $i(e) {
  Me(e, Pe);
  for (var t = e.first; t !== null; )
    $i(t), t = t.next;
}
let Fn = /* @__PURE__ */ new Set();
const Pt = /* @__PURE__ */ new Map();
let eo = !1;
function Mr(e, t) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Pi,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function Z(e, t) {
  const r = Mr(e);
  return vo(r), r;
}
// @__NO_SIDE_EFFECTS__
function ml(e, t = !1, r = !0) {
  const a = Mr(e);
  return t || (a.equals = Fi), a;
}
function m(e, t, r = !1) {
  $ !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Mt || ($.f & Cn) !== 0) && Vi() && ($.f & (Ve | Tt | Ir | Cn)) !== 0 && (Ft === null || !Ft.has(e)) && zs();
  let a = r ? et(t) : t;
  return Wr(e, a, Dn);
}
function Wr(e, t, r = null) {
  if (!e.equals(t)) {
    sr ? Pt.set(e, t) : Pt.has(e) || Pt.set(e, e.v);
    var a = Ar.ensure();
    if (a.capture(e, t), (e.f & Ve) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & Fe) !== 0 && Va(i), At === null && ja(i);
    }
    e.wv = po(), to(e, Fe, r), ie !== null && (ie.f & Pe) !== 0 && (ie.f & (yt | Kt)) === 0 && (ct === null ? Il([e]) : ct.push(e)), !a.is_fork && Fn.size > 0 && !eo && kl();
  }
  return t;
}
function kl() {
  eo = !1;
  for (const e of Fn) {
    (e.f & Pe) !== 0 && Me(e, Nt);
    let t;
    try {
      t = kn(e);
    } catch {
      t = !0;
    }
    t && Jr(e);
  }
  Fn.clear();
}
function cn(e) {
  m(e, e.v + 1);
}
function to(e, t, r) {
  var a = e.reactions;
  if (a !== null)
    for (var i = a.length, o = 0; o < i; o++) {
      var c = a[o], h = c.f, v = (h & Fe) === 0;
      if (v && Me(c, t), (h & Cn) !== 0)
        Fn.add(
          /** @type {Effect} */
          c
        );
      else if ((h & Ve) !== 0) {
        var p = (
          /** @type {Derived} */
          c
        );
        At?.delete(p), (h & Tr) === 0 && (h & _t && (ie === null || (ie.f & In) === 0) && (c.f |= Tr), to(p, Nt, r));
      } else if (v) {
        var g = (
          /** @type {Effect} */
          c
        );
        (h & Tt) !== 0 && qt !== null && qt.add(g), r !== null ? r.push(g) : za(g);
      }
    }
}
function et(e) {
  if (typeof e != "object" || e === null || fn in e)
    return e;
  const t = Li(e);
  if (t !== Es && t !== Ts)
    return e;
  var r = /* @__PURE__ */ new Map(), a = Fa(e), i = /* @__PURE__ */ Z(0), o = Sr, c = (h) => {
    if (Sr === o)
      return h();
    var v = $, p = Sr;
    bt(null), ki(o);
    var g = h();
    return bt(v), ki(p), g;
  };
  return a && r.set("length", /* @__PURE__ */ Z(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(h, v, p) {
        (!("value" in p) || p.configurable === !1 || p.enumerable === !1 || p.writable === !1) && Vs();
        var g = r.get(v);
        return g === void 0 ? c(() => {
          var k = /* @__PURE__ */ Z(p.value);
          return r.set(v, k), k;
        }) : m(g, p.value, !0), !0;
      },
      deleteProperty(h, v) {
        var p = r.get(v);
        if (p === void 0) {
          if (v in h) {
            const g = c(() => /* @__PURE__ */ Z(Ie));
            r.set(v, g), cn(i);
          }
        } else
          m(p, Ie), cn(i);
        return !0;
      },
      get(h, v, p) {
        if (v === fn)
          return e;
        var g = r.get(v), k = v in h;
        if (g === void 0 && (!k || un(h, v)?.writable) && (g = c(() => {
          var w = et(k ? h[v] : Ie), S = /* @__PURE__ */ Z(w);
          return S;
        }), r.set(v, g)), g !== void 0) {
          var b = n(g);
          return b === Ie ? void 0 : b;
        }
        return Reflect.get(h, v, p);
      },
      getOwnPropertyDescriptor(h, v) {
        var p = Reflect.getOwnPropertyDescriptor(h, v);
        if (p && "value" in p) {
          var g = r.get(v);
          g && (p.value = n(g));
        } else if (p === void 0) {
          var k = r.get(v), b = k?.v;
          if (k !== void 0 && b !== Ie)
            return {
              enumerable: !0,
              configurable: !0,
              value: b,
              writable: !0
            };
        }
        return p;
      },
      has(h, v) {
        if (v === fn)
          return !0;
        var p = r.get(v), g = p !== void 0 && p.v !== Ie || Reflect.has(h, v);
        if (p !== void 0 || ie !== null && (!g || un(h, v)?.writable)) {
          p === void 0 && (p = c(() => {
            var b = g ? et(h[v]) : Ie, w = /* @__PURE__ */ Z(b);
            return w;
          }), r.set(v, p));
          var k = n(p);
          if (k === Ie)
            return !1;
        }
        return g;
      },
      set(h, v, p, g) {
        var k = r.get(v), b = v in h;
        if (a && v === "length")
          for (var w = p; w < /** @type {Source<number>} */
          k.v; w += 1) {
            var S = r.get(w + "");
            S !== void 0 ? m(S, Ie) : w in h && (S = c(() => /* @__PURE__ */ Z(Ie)), r.set(w + "", S));
          }
        if (k === void 0)
          (!b || un(h, v)?.writable) && (k = c(() => /* @__PURE__ */ Z(void 0)), m(k, et(p)), r.set(v, k));
        else {
          b = k.v !== Ie;
          var R = c(() => et(p));
          m(k, R);
        }
        var T = Reflect.getOwnPropertyDescriptor(h, v);
        if (T?.set && T.set.call(g, p), !b) {
          if (a && typeof v == "string") {
            var te = (
              /** @type {Source<number>} */
              r.get("length")
            ), Ne = Number(v);
            Number.isInteger(Ne) && Ne >= te.v && m(te, Ne + 1);
          }
          cn(i);
        }
        return !0;
      },
      ownKeys(h) {
        n(i);
        var v = Reflect.ownKeys(h).filter((k) => {
          var b = r.get(k);
          return b === void 0 || b.v !== Ie;
        });
        for (var [p, g] of r)
          g.v !== Ie && !(p in h) && v.push(p);
        return v;
      },
      setPrototypeOf() {
        Hs();
      }
    }
  );
}
function yi(e) {
  try {
    if (e !== null && typeof e == "object" && fn in e)
      return e[fn];
  } catch {
  }
  return e;
}
function wl(e, t) {
  return Object.is(yi(e), yi(t));
}
var bi, ro, no, ao;
function Sl() {
  if (bi === void 0) {
    bi = window, ro = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, r = Text.prototype;
    no = un(t, "firstChild").get, ao = un(t, "nextSibling").get, hi(e) && (e[wa] = void 0, e[An] = null, e[Ls] = void 0, e.__e = void 0), hi(r) && (r[nn] = void 0);
  }
}
function or(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Yr(e) {
  return (
    /** @type {TemplateNode | null} */
    no.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function mn(e) {
  return (
    /** @type {TemplateNode | null} */
    ao.call(e)
  );
}
function _(e, t) {
  return /* @__PURE__ */ Yr(e);
}
function hr(e, t = !1) {
  {
    var r = /* @__PURE__ */ Yr(e);
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ mn(r) : r;
  }
}
function y(e, t = 1, r = !1) {
  let a = e;
  for (; t--; )
    a = /** @type {TemplateNode} */
    /* @__PURE__ */ mn(a);
  return a;
}
function El(e) {
  e.textContent = "";
}
function io() {
  return !1;
}
function Tl(e, t, r) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    r ? document.createElement(e, { is: r }) : document.createElement(e)
  );
}
function Al(e) {
  ie === null && ($ === null && js(), Fs()), sr && Ps();
}
function Ml(e, t) {
  var r = t.last;
  r === null ? t.last = t.first = e : (r.next = e, e.prev = r, t.last = e);
}
function Xt(e, t) {
  var r = ie;
  r !== null && (r.f & Ke) !== 0 && (e |= Ke);
  var a = {
    ctx: Xe,
    deps: null,
    nodes: null,
    f: e | Fe | _t,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: r,
    b: r && r.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  Y?.register_created_effect(a);
  var i = a;
  if ((e & qr) !== 0)
    Cr !== null ? Cr.push(a) : Ar.ensure().schedule(a);
  else if (t !== null) {
    try {
      Jr(a);
    } catch (c) {
      throw rt(a), c;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Kr) === 0 && (i = i.first, (e & Tt) !== 0 && (e & Er) !== 0 && i !== null && (i.f |= Er));
  }
  if (i !== null && (i.parent = r, r !== null && Ml(i, r), $ !== null && ($.f & Ve) !== 0 && (e & Kt) === 0)) {
    var o = (
      /** @type {Derived} */
      $
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return a;
}
function qa() {
  return $ !== null && !Mt;
}
function Ua(e) {
  const t = Xt(Un, null);
  return Me(t, Pe), t.teardown = e, t;
}
function Nl(e) {
  Al();
  var t = (
    /** @type {Effect} */
    ie.f
  ), r = !$ && (t & yt) !== 0 && Xe !== null && !Xe.i;
  if (r) {
    var a = (
      /** @type {ComponentContext} */
      Xe
    );
    (a.e ?? (a.e = [])).push(e);
  } else
    return oo(e);
}
function oo(e) {
  return Xt(qr | Ds, e);
}
function Rl(e) {
  Ar.ensure();
  const t = Xt(Kt | Kr, e);
  return (r = {}) => new Promise((a) => {
    r.outro ? wr(t, () => {
      rt(t), a(void 0);
    }) : (rt(t), a(void 0));
  });
}
function Dl(e) {
  return Xt(qr, e);
}
function Ll(e) {
  return Xt(Ir | Kr, e);
}
function so(e, t = 0) {
  return Xt(Un | t, e);
}
function N(e, t = [], r = [], a = []) {
  dl(a, t, r, (i) => {
    Xt(Un, () => {
      e(...i.map(n));
    });
  });
}
function Wn(e, t = 0) {
  var r = Xt(Tt | t, e);
  return r;
}
function gt(e) {
  return Xt(yt | Kr, e);
}
function lo(e) {
  var t = e.teardown;
  if (t !== null) {
    const r = sr, a = $;
    mi(!0), bt(null);
    try {
      t.call(null);
    } finally {
      mi(r), bt(a);
    }
  }
}
function Wa(e, t = !1) {
  var r = e.first;
  for (e.first = e.last = null; r !== null; ) {
    const i = r.ac;
    i !== null && Xr(() => {
      i.abort(bn);
    });
    var a = r.next;
    (r.f & Kt) !== 0 ? r.parent = null : rt(r, t), r = a;
  }
}
function Ol(e) {
  for (var t = e.first; t !== null; ) {
    var r = t.next;
    (t.f & yt) === 0 && rt(t), t = r;
  }
}
function rt(e, t = !0) {
  var r = !1;
  (t || (e.f & Rs) !== 0) && e.nodes !== null && e.nodes.end !== null && (Cl(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), r = !0), e.f |= pi, Wa(e, t && !r), hn(e, 0);
  var a = e.nodes && e.nodes.t;
  if (a !== null)
    for (const o of a)
      o.stop();
  lo(e), e.f ^= pi, e.f |= xt;
  var i = e.parent;
  i !== null && i.first !== null && uo(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Cl(e, t) {
  for (; e !== null; ) {
    var r = e === t ? null : /* @__PURE__ */ mn(e);
    e.remove(), e = r;
  }
}
function uo(e) {
  var t = e.parent, r = e.prev, a = e.next;
  r !== null && (r.next = a), a !== null && (a.prev = r), t !== null && (t.first === e && (t.first = a), t.last === e && (t.last = r));
}
function wr(e, t, r = !0) {
  var a = [];
  fo(e, a, !0);
  var i = () => {
    r && rt(e), t && t();
  }, o = a.length;
  if (o > 0) {
    var c = () => --o || i();
    for (var h of a)
      h.out(c);
  } else
    i();
}
function fo(e, t, r) {
  if ((e.f & Ke) === 0) {
    e.f ^= Ke;
    var a = e.nodes && e.nodes.t;
    if (a !== null)
      for (const h of a)
        (h.is_global || r) && t.push(h);
    for (var i = e.first; i !== null; ) {
      var o = i.next;
      if ((i.f & Kt) === 0) {
        var c = (i.f & Er) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (i.f & yt) !== 0 && (e.f & Tt) !== 0;
        fo(i, t, c ? r : !1);
      }
      i = o;
    }
  }
}
function jn(e) {
  co(e, !0);
}
function co(e, t) {
  if ((e.f & Ke) !== 0) {
    e.f ^= Ke, (e.f & Pe) === 0 && (Me(e, Fe), Ar.ensure().schedule(e));
    for (var r = e.first; r !== null; ) {
      var a = r.next, i = (r.f & Er) !== 0 || (r.f & yt) !== 0;
      co(r, i ? t : !1), r = a;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const c of o)
        (c.is_global || t) && c.in();
  }
}
function Ya(e, t) {
  if (e.nodes)
    for (var r = e.nodes.start, a = e.nodes.end; r !== null; ) {
      var i = r === a ? null : /* @__PURE__ */ mn(r);
      t.append(r), r = i;
    }
}
let Ln = !1, sr = !1;
function mi(e) {
  sr = e;
}
let $ = null, Mt = !1;
function bt(e) {
  $ = e;
}
let ie = null;
function jt(e) {
  ie = e;
}
let Ft = null;
function vo(e) {
  $ !== null && (Ft ?? (Ft = /* @__PURE__ */ new Set())).add(e);
}
let tt = null, ot = 0, ct = null;
function Il(e) {
  ct = e;
}
let ho = 1, gr = 0, Sr = gr;
function ki(e) {
  Sr = e;
}
function po() {
  return ++ho;
}
function kn(e) {
  var t = e.f;
  if ((t & Fe) !== 0)
    return !0;
  if (t & Ve && (e.f &= ~Tr), (t & Nt) !== 0) {
    for (var r = (
      /** @type {Value[]} */
      e.deps
    ), a = r.length, i = 0; i < a; i++) {
      var o = r[i];
      if (kn(
        /** @type {Derived} */
        o
      ) && Ji(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (t & _t) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    At === null && Me(e, Pe);
  }
  return !1;
}
function go(e, t, r = !0) {
  var a = e.reactions;
  if (a !== null && !(Ft !== null && Ft.has(e)))
    for (var i = 0; i < a.length; i++) {
      var o = a[i];
      (o.f & Ve) !== 0 ? go(
        /** @type {Derived} */
        o,
        t,
        !1
      ) : t === o && (r ? Me(o, Fe) : (o.f & Pe) !== 0 && Me(o, Nt), za(
        /** @type {Effect} */
        o
      ));
    }
}
function _o(e) {
  var R;
  var t = tt, r = ot, a = ct, i = $, o = Ft, c = Xe, h = Mt, v = Sr, p = e.f;
  tt = /** @type {null | Value[]} */
  null, ot = 0, ct = null, $ = (p & (yt | Kt)) === 0 ? e : null, Ft = null, Ur(e.ctx), Mt = !1, Sr = ++gr, e.ac !== null && (Xr(() => {
    e.ac.abort(bn);
  }), e.ac = null);
  try {
    e.f |= In;
    var g = (
      /** @type {Function} */
      e.fn
    ), k = g();
    e.f |= Gr;
    var b = e.deps, w = Y?.is_fork;
    if (tt !== null) {
      var S;
      if (w || hn(e, ot), b !== null && ot > 0)
        for (b.length = ot + tt.length, S = 0; S < tt.length; S++)
          b[ot + S] = tt[S];
      else
        e.deps = b = tt;
      if (qa() && (e.f & _t) !== 0)
        for (S = ot; S < b.length; S++)
          ((R = b[S]).reactions ?? (R.reactions = [])).push(e);
    } else !w && b !== null && ot < b.length && (hn(e, ot), b.length = ot);
    if (Vi() && ct !== null && !Mt && b !== null && (e.f & (Ve | Nt | Fe)) === 0)
      for (S = 0; S < /** @type {Source[]} */
      ct.length; S++)
        go(
          ct[S],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (gr++, i.deps !== null)
        for (let T = 0; T < r; T += 1)
          i.deps[T].rv = gr;
      if (t !== null)
        for (const T of t)
          T.rv = gr;
      ct !== null && (a === null ? a = ct : a.push(.../** @type {Source[]} */
      ct));
    }
    return (e.f & ir) !== 0 && (e.f ^= ir), k;
  } catch (T) {
    return zi(T);
  } finally {
    e.f ^= In, tt = t, ot = r, ct = a, $ = i, Ft = o, Ur(c), Mt = h, Sr = v;
  }
}
function Pl(e, t) {
  let r = t.reactions;
  if (r !== null) {
    var a = ks.call(r, e);
    if (a !== -1) {
      var i = r.length - 1;
      i === 0 ? r = t.reactions = null : (r[a] = r[i], r.pop());
    }
  }
  if (r === null && (t.f & Ve) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (tt === null || !On.call(tt, t))) {
    var o = (
      /** @type {Derived} */
      t
    );
    (o.f & _t) !== 0 && (o.f ^= _t, o.f &= ~Tr), o.v !== Ie && ja(o), o.ac !== null && Xr(() => {
      o.ac.abort(bn), o.ac = null, Me(o, Fe);
    }), gl(o), hn(o, 0);
  }
}
function hn(e, t) {
  var r = e.deps;
  if (r !== null)
    for (var a = t; a < r.length; a++)
      Pl(e, r[a]);
}
function Jr(e) {
  var t = e.f;
  if ((t & xt) === 0) {
    Me(e, Pe);
    var r = ie, a = Ln;
    ie = e, Ln = (t & (yt | Kt)) === 0;
    try {
      (t & (Tt | Ci)) !== 0 ? Ol(e) : Wa(e), lo(e);
      var i = _o(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = ho;
      var o;
    } finally {
      Ln = a, ie = r;
    }
  }
}
async function Fl() {
  await Promise.resolve(), yl();
}
function n(e) {
  var t = e.f, r = (t & Ve) !== 0;
  if ($ !== null && !Mt) {
    var a = ie !== null && (ie.f & xt) !== 0;
    if (!a && (Ft === null || !Ft.has(e))) {
      var i = $.deps;
      if (($.f & In) !== 0)
        e.rv < gr && (e.rv = gr, tt === null && i !== null && i[ot] === e ? ot++ : tt === null ? tt = [e] : tt.push(e));
      else {
        $.deps ?? ($.deps = []), On.call($.deps, e) || $.deps.push(e);
        var o = e.reactions;
        o === null ? e.reactions = [$] : On.call(o, $) || o.push($);
      }
    }
  }
  if (sr && Pt.has(e))
    return Pt.get(e);
  if (r) {
    var c = (
      /** @type {Derived} */
      e
    );
    if (sr) {
      var h = c.v;
      return ((c.f & Pe) === 0 && c.reactions !== null || yo(c)) && (h = Va(c)), Pt.set(c, h), h;
    }
    var v = (c.f & _t) === 0 && !Mt && $ !== null && (Ln || ($.f & _t) !== 0), p = (c.f & Gr) === 0;
    kn(c) && (v && (c.f |= _t), Ji(c)), v && !p && (Gi(c), xo(c));
  }
  if (At?.has(e))
    return At.get(e);
  if ((e.f & ir) !== 0)
    throw e.v;
  return e.v;
}
function xo(e) {
  if (e.f |= _t, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & Ve) !== 0 && (t.f & _t) === 0 && (Gi(
        /** @type {Derived} */
        t
      ), xo(
        /** @type {Derived} */
        t
      ));
}
function yo(e) {
  if (e.v === Ie) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Pt.has(t) || (t.f & Ve) !== 0 && yo(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ja(e) {
  var t = Mt;
  try {
    return Mt = !0, e();
  } finally {
    Mt = t;
  }
}
const jl = ["touchstart", "touchmove"];
function Bl(e) {
  return jl.includes(e);
}
const _r = Symbol("events"), bo = /* @__PURE__ */ new Set(), La = /* @__PURE__ */ new Set();
function Vl(e, t, r, a = {}) {
  function i(o) {
    if (a.capture || Oa.call(t, o), !o.cancelBubble)
      return Xr(() => r?.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Gt(() => {
    t.addEventListener(e, i, a);
  }) : t.addEventListener(e, i, a), i;
}
function wi(e, t, r, a, i) {
  var o = { capture: a, passive: i }, c = Vl(e, t, r, o);
  (t === document.body || // @ts-ignore
  t === window || // @ts-ignore
  t === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  t instanceof HTMLMediaElement) && Ua(() => {
    t.removeEventListener(e, c, o);
  });
}
function Be(e, t, r) {
  (t[_r] ?? (t[_r] = {}))[e] = r;
}
function Hl(e) {
  for (var t = 0; t < e.length; t++)
    bo.add(e[t]);
  for (var r of La)
    r(e);
}
let ca = null, va = !1;
function Oa(e) {
  var t = this, r = (
    /** @type {Node} */
    t.ownerDocument
  ), a = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  ca = e, va || (va = !0, setTimeout(() => {
    va = !1, ca = null;
  }));
  var c = 0, h = ca === e && e[_r];
  if (h) {
    var v = i.indexOf(h);
    if (v !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[_r] = t;
      return;
    }
    var p = i.indexOf(t);
    if (p === -1)
      return;
    v <= p && (c = v);
  }
  if (o = /** @type {Element} */
  i[c] || e.target, o !== t) {
    ws(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || r;
      }
    });
    var g = $, k = ie;
    bt(null), jt(null);
    try {
      for (var b, w = []; o !== null && o !== t; ) {
        try {
          var S = o[_r]?.[a];
          S != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && S.call(o, e);
        } catch (R) {
          b ? w.push(R) : b = R;
        }
        if (e.cancelBubble) break;
        c++, o = c < i.length ? (
          /** @type {Element} */
          i[c]
        ) : null;
      }
      if (b) {
        for (let R of w)
          queueMicrotask(() => {
            throw R;
          });
        throw b;
      }
    } finally {
      e[_r] = t, delete e.currentTarget, bt(g), jt(k);
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
function ql(e) {
  return (
    /** @type {string} */
    zl?.createHTML(e) ?? e
  );
}
function mo(e) {
  var t = Tl("template");
  return t.innerHTML = ql(e.replaceAll("<!>", "<!---->")), t.content;
}
function Bn(e, t) {
  var r = (
    /** @type {Effect} */
    ie
  );
  r.nodes === null && (r.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function j(e, t) {
  var r = (t & Gs) !== 0, a = (t & Ks) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = mo(o ? e : "<!>" + e), r || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ Yr(i)));
    var c = (
      /** @type {TemplateNode} */
      a || ro ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (r) {
      var h = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Yr(c)
      ), v = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      Bn(h, v);
    } else
      Bn(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Ul(e, t, r = "svg") {
  var a = !e.startsWith("<!>"), i = `<${r}>${a ? e : "<!>" + e}</${r}>`, o;
  return () => {
    if (!o) {
      var c = (
        /** @type {DocumentFragment} */
        mo(i)
      ), h = (
        /** @type {Element} */
        /* @__PURE__ */ Yr(c)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ Yr(h);
    }
    var v = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return Bn(v, v), v;
  };
}
// @__NO_SIDE_EFFECTS__
function Ga(e, t) {
  return /* @__PURE__ */ Ul(e, t, "svg");
}
function ha() {
  var e = document.createDocumentFragment(), t = document.createComment(""), r = or();
  return e.append(t, r), Bn(t, r), e;
}
function A(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function F(e, t) {
  var r = t == null ? "" : typeof t == "object" ? `${t}` : t;
  r !== /** @type {any} */
  (e[nn] ?? (e[nn] = e.nodeValue)) && (e[nn] = r, e.nodeValue = `${r}`);
}
function Wl(e, t) {
  return Yl(e, t);
}
const Tn = /* @__PURE__ */ new Map();
function Yl(e, { target: t, anchor: r, props: a = {}, events: i, context: o, intro: c = !0, transformError: h }) {
  Sl();
  var v = void 0, p = Rl(() => {
    var g = r ?? t.appendChild(or());
    ol(
      /** @type {TemplateNode} */
      g,
      {
        pending: () => {
        }
      },
      (w) => {
        ji({});
        var S = (
          /** @type {ComponentContext} */
          Xe
        );
        o && (S.c = o), i && (a.$$events = i), v = e(w, a) || {}, Bi();
      },
      h
    );
    var k = /* @__PURE__ */ new Set(), b = (w) => {
      for (var S = 0; S < w.length; S++) {
        var R = w[S];
        if (!k.has(R)) {
          k.add(R);
          var T = Bl(R);
          for (const ve of [t, document]) {
            var te = Tn.get(ve);
            te === void 0 && (te = /* @__PURE__ */ new Map(), Tn.set(ve, te));
            var Ne = te.get(R);
            Ne === void 0 ? (ve.addEventListener(R, Oa, { passive: T }), te.set(R, 1)) : te.set(R, Ne + 1);
          }
        }
      }
    };
    return b(qn(bo)), La.add(b), () => {
      for (var w of k)
        for (const T of [t, document]) {
          var S = (
            /** @type {Map<string, number>} */
            Tn.get(T)
          ), R = (
            /** @type {number} */
            S.get(w)
          );
          --R == 0 ? (T.removeEventListener(w, Oa), S.delete(w), S.size === 0 && Tn.delete(T)) : S.set(w, R);
        }
      La.delete(b), g !== r && g.parentNode?.removeChild(g);
    };
  });
  return Ca.set(v, p), v;
}
let Ca = /* @__PURE__ */ new WeakMap();
function Jl(e, t) {
  const r = Ca.get(e);
  return r ? (Ca.delete(e), r(t)) : Promise.resolve();
}
var Et, Ct, lt, kr, xn, yn, zn;
class ko {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, r = !0) {
    /** @type {TemplateNode} */
    it(this, "anchor");
    /** @type {Map<Batch, Key>} */
    W(this, Et, /* @__PURE__ */ new Map());
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
    W(this, Ct, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    W(this, lt, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    W(this, kr, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    W(this, xn, !0);
    /**
     * @param {Batch} batch
     */
    W(this, yn, (t) => {
      if (f(this, Et).has(t)) {
        var r = (
          /** @type {Key} */
          f(this, Et).get(t)
        ), a = f(this, Ct).get(r);
        if (a)
          jn(a), f(this, kr).delete(r);
        else {
          var i = f(this, lt).get(r);
          i && (jn(i.effect), f(this, Ct).set(r, i.effect), f(this, lt).delete(r), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), a = i.effect);
        }
        for (const [o, c] of f(this, Et)) {
          if (f(this, Et).delete(o), o === t)
            break;
          const h = f(this, lt).get(c);
          h && (rt(h.effect), f(this, lt).delete(c));
        }
        for (const [o, c] of f(this, Ct)) {
          if (o === r || f(this, kr).has(o)) continue;
          const h = () => {
            if (Array.from(f(this, Et).values()).includes(o)) {
              var p = document.createDocumentFragment();
              Ya(c, p), p.append(or()), f(this, lt).set(o, { effect: c, fragment: p });
            } else
              rt(c);
            f(this, kr).delete(o), f(this, Ct).delete(o);
          };
          f(this, xn) || !a ? (f(this, kr).add(o), wr(c, h, !1)) : h();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    W(this, zn, (t) => {
      f(this, Et).delete(t);
      const r = Array.from(f(this, Et).values());
      for (const [a, i] of f(this, lt))
        r.includes(a) || (rt(i.effect), f(this, lt).delete(a));
    });
    this.anchor = t, H(this, xn, r);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, r) {
    var a = (
      /** @type {Batch} */
      Y
    ), i = io();
    if (r && !f(this, Ct).has(t) && !f(this, lt).has(t))
      if (i) {
        var o = document.createDocumentFragment(), c = or();
        o.append(c), f(this, lt).set(t, {
          effect: gt(() => r(c)),
          fragment: o
        });
      } else
        f(this, Ct).set(
          t,
          gt(() => r(this.anchor))
        );
    if (f(this, Et).set(a, t), i) {
      for (const [h, v] of f(this, Ct))
        h === t ? a.unskip_effect(v) : a.skip_effect(v);
      for (const [h, v] of f(this, lt))
        h === t ? a.unskip_effect(v.effect) : a.skip_effect(v.effect);
      a.oncommit(f(this, yn)), a.ondiscard(f(this, zn));
    } else
      f(this, yn).call(this, a);
  }
}
Et = new WeakMap(), Ct = new WeakMap(), lt = new WeakMap(), kr = new WeakMap(), xn = new WeakMap(), yn = new WeakMap(), zn = new WeakMap();
function ee(e, t, r = !1) {
  var a = new ko(e), i = r ? Er : 0;
  function o(c, h) {
    a.ensure(c, h);
  }
  Wn(() => {
    var c = !1;
    t((h, v = 0) => {
      c = !0, o(v, h);
    }), c || o(-1, null);
  }, i);
}
function Si(e, t) {
  return t;
}
function Gl(e, t, r) {
  for (var a = [], i = t.length, o, c = t.length, h = 0; h < i; h++) {
    let k = t[h];
    wr(
      k,
      () => {
        if (o) {
          if (o.pending.delete(k), o.done.add(k), o.pending.size === 0) {
            var b = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Ia(e, qn(o.done)), b.delete(o), b.size === 0 && (e.outrogroups = null);
          }
        } else
          c -= 1;
      },
      !1
    );
  }
  if (c === 0) {
    var v = a.length === 0 && r !== null && e.pending.size === 0;
    if (v) {
      var p = (
        /** @type {Element} */
        r
      ), g = (
        /** @type {Element} */
        p.parentNode
      );
      El(g), g.append(p), e.items.clear();
    }
    Ia(e, t, !v);
  } else
    o = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function Ia(e, t, r = !0) {
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
  for (var i = 0; i < t.length; i++) {
    var o = t[i];
    if (a?.has(o)) {
      o.f |= It;
      const c = document.createDocumentFragment();
      Ya(o, c);
    } else
      rt(t[i], r);
  }
}
var Ei;
function wt(e, t, r, a, i, o = null) {
  var c = e, h = /* @__PURE__ */ new Map(), v = (t & Ii) !== 0;
  if (v) {
    var p = (
      /** @type {Element} */
      e
    );
    c = p.appendChild(or());
  }
  var g = null, k = /* @__PURE__ */ hl(() => {
    var ve = r();
    return (
      /** @type {V[]} */
      Fa(ve) ? ve : ve == null ? [] : qn(ve)
    );
  }), b, w = /* @__PURE__ */ new Map(), S = !0;
  function R(ve) {
    (Ne.effect.f & xt) === 0 && (Ne.pending.delete(ve), Ne.fallback = g, Kl(Ne, b, c, t, a), g !== null && (b.length === 0 ? (g.f & It) === 0 ? jn(g) : (g.f ^= It, ln(g, null, c)) : wr(g, () => {
      g = null;
    })));
  }
  function T(ve) {
    Ne.pending.delete(ve);
  }
  var te = Wn(() => {
    b = /** @type {V[]} */
    n(k);
    for (var ve = b.length, Ee = /* @__PURE__ */ new Set(), Re = (
      /** @type {Batch} */
      Y
    ), Rt = io(), Le = 0; Le < ve; Le += 1) {
      var Ue = b[Le], Bt = a(Ue, Le), Oe = S ? null : h.get(Bt);
      Oe ? (Oe.v && Wr(Oe.v, Ue), Oe.i && Wr(Oe.i, Le), Rt && Re.unskip_effect(Oe.e)) : (Oe = Xl(
        h,
        S ? c : Ei ?? (Ei = or()),
        Ue,
        Bt,
        Le,
        i,
        t,
        r
      ), S || (Oe.e.f |= It), h.set(Bt, Oe)), Ee.add(Bt);
    }
    if (ve === 0 && o && !g && (S ? g = gt(() => o(c)) : (g = gt(() => o(Ei ?? (Ei = or()))), g.f |= It)), ve > Ee.size && Is(), !S)
      if (w.set(Re, Ee), Rt) {
        for (const [ut, Nr] of h)
          Ee.has(ut) || Re.skip_effect(Nr.e);
        Re.oncommit(R), Re.ondiscard(T);
      } else
        R(Re);
    n(k);
  }), Ne = { effect: te, items: h, pending: w, outrogroups: null, fallback: g };
  S = !1;
}
function tn(e) {
  for (; e !== null && (e.f & yt) === 0; )
    e = e.next;
  return e;
}
function Kl(e, t, r, a, i) {
  var o = (a & Ys) !== 0, c = t.length, h = e.items, v = tn(e.effect.first), p, g = null, k, b = [], w = [], S, R, T, te;
  if (o)
    for (te = 0; te < c; te += 1)
      S = t[te], R = i(S, te), T = /** @type {EachItem} */
      h.get(R).e, (T.f & It) === 0 && (T.nodes?.a?.measure(), (k ?? (k = /* @__PURE__ */ new Set())).add(T));
  for (te = 0; te < c; te += 1) {
    if (S = t[te], R = i(S, te), T = /** @type {EachItem} */
    h.get(R).e, e.outrogroups !== null)
      for (const Oe of e.outrogroups)
        Oe.pending.delete(T), Oe.done.delete(T);
    if ((T.f & Ke) !== 0 && (jn(T), o && (T.nodes?.a?.unfix(), (k ?? (k = /* @__PURE__ */ new Set())).delete(T))), (T.f & It) !== 0)
      if (T.f ^= It, T === v)
        ln(T, null, r);
      else {
        var Ne = g ? g.next : v;
        T === e.effect.last && (e.effect.last = T.prev), T.prev && (T.prev.next = T.next), T.next && (T.next.prev = T.prev), er(e, g, T), er(e, T, Ne), ln(T, Ne, r), g = T, b = [], w = [], v = tn(g.next);
        continue;
      }
    if (T !== v) {
      if (p !== void 0 && p.has(T)) {
        if (b.length < w.length) {
          var ve = w[0], Ee;
          g = ve.prev;
          var Re = b[0], Rt = b[b.length - 1];
          for (Ee = 0; Ee < b.length; Ee += 1)
            ln(b[Ee], ve, r);
          for (Ee = 0; Ee < w.length; Ee += 1)
            p.delete(w[Ee]);
          er(e, Re.prev, Rt.next), er(e, g, Re), er(e, Rt, ve), v = ve, g = Rt, te -= 1, b = [], w = [];
        } else
          p.delete(T), ln(T, v, r), er(e, T.prev, T.next), er(e, T, g === null ? e.effect.first : g.next), er(e, g, T), g = T;
        continue;
      }
      for (b = [], w = []; v !== null && v !== T; )
        (p ?? (p = /* @__PURE__ */ new Set())).add(v), w.push(v), v = tn(v.next);
      if (v === null)
        continue;
    }
    (T.f & It) === 0 && b.push(T), g = T, v = tn(T.next);
  }
  if (e.outrogroups !== null) {
    for (const Oe of e.outrogroups)
      Oe.pending.size === 0 && (Ia(e, qn(Oe.done)), e.outrogroups?.delete(Oe));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (v !== null || p !== void 0) {
    var Le = [];
    if (p !== void 0)
      for (T of p)
        (T.f & Ke) === 0 && Le.push(T);
    for (; v !== null; )
      (v.f & Ke) === 0 && v !== e.fallback && Le.push(v), v = tn(v.next);
    var Ue = Le.length;
    if (Ue > 0) {
      var Bt = (a & Ii) !== 0 && c === 0 ? r : null;
      if (o) {
        for (te = 0; te < Ue; te += 1)
          Le[te].nodes?.a?.measure();
        for (te = 0; te < Ue; te += 1)
          Le[te].nodes?.a?.fix();
      }
      Gl(e, Le, Bt);
    }
  }
  o && Gt(() => {
    if (k !== void 0)
      for (T of k)
        T.nodes?.a?.apply();
  });
}
function Xl(e, t, r, a, i, o, c, h) {
  var v = (c & Us) !== 0 ? (c & Js) === 0 ? /* @__PURE__ */ ml(r, !1, !1) : Mr(r) : null, p = (c & Ws) !== 0 ? Mr(i) : null;
  return {
    v,
    i: p,
    e: gt(() => (o(t, v ?? r, p ?? i, h), () => {
      e.delete(a);
    }))
  };
}
function ln(e, t, r) {
  if (e.nodes)
    for (var a = e.nodes.start, i = e.nodes.end, o = t && (t.f & It) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : r; a !== null; ) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ mn(a)
      );
      if (o.before(a), a === i)
        return;
      a = c;
    }
}
function er(e, t, r) {
  t === null ? e.effect.first = r : t.next = r, r === null ? e.effect.last = t : r.prev = t;
}
function Zl(e, t, r) {
  var a = new ko(e);
  Wn(() => {
    var i = t() ?? null;
    a.ensure(i, i && ((o) => r(o, i)));
  }, Er);
}
function wo(e) {
  var t, r, a = "";
  if (typeof e == "string" || typeof e == "number") a += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var i = e.length;
    for (t = 0; t < i; t++) e[t] && (r = wo(e[t])) && (a && (a += " "), a += r);
  } else for (r in e) e[r] && (a && (a += " "), a += r);
  return a;
}
function Ql() {
  for (var e, t, r = 0, a = "", i = arguments.length; r < i; r++) (e = arguments[r]) && (t = wo(e)) && (a && (a += " "), a += t);
  return a;
}
function l(e) {
  return typeof e == "object" ? Ql(e) : e ?? "";
}
function $l(e, t, r) {
  var a = e == null ? "" : "" + e;
  return a === "" ? null : a;
}
function u(e, t, r, a, i, o) {
  var c = (
    /** @type {any} */
    e[wa]
  );
  if (c !== r || c === void 0) {
    var h = $l(r);
    h == null ? e.removeAttribute("class") : t ? e.className = h : e.setAttribute("class", h), e[wa] = r;
  }
  return o;
}
function So(e, t, r = !1) {
  if (e.multiple) {
    if (t == null)
      return;
    if (!Fa(t))
      return Qs();
    for (var a of e.options)
      a.selected = t.includes(vn(a));
    return;
  }
  for (a of e.options) {
    var i = vn(a);
    if (wl(i, t)) {
      a.selected = !0;
      return;
    }
  }
  (!r || t !== void 0) && (e.selectedIndex = -1);
}
function eu(e) {
  var t = new MutationObserver(() => {
    "__value" in e && So(e, e.__value);
  });
  t.observe(e, {
    // Listen to option element changes
    childList: !0,
    subtree: !0,
    // because of <optgroup>
    // Listen to option element value attribute changes
    // (doesn't get notified of select value changes,
    // because that property is not reflected as an attribute)
    attributes: !0,
    attributeFilter: ["value"]
  }), Ua(() => {
    t.disconnect();
  });
}
function tu(e, t, r = t) {
  var a = /* @__PURE__ */ new WeakSet(), i = !0;
  Wi(e, "change", (o) => {
    var c = o ? "[selected]" : ":checked", h;
    if (e.multiple)
      h = [].map.call(e.querySelectorAll(c), vn);
    else {
      var v = e.querySelector(c) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      h = v && vn(v);
    }
    r(h), e.__value = h, Y !== null && a.add(Y);
  }), Dl(() => {
    var o = t();
    if (e === document.activeElement) {
      var c = (
        /** @type {Batch} */
        Y
      );
      if (a.has(c))
        return;
    }
    if (So(e, o, i), i && o === void 0) {
      var h = e.querySelector(":checked");
      h !== null && (o = vn(h), r(o));
    }
    e.__value = o, i = !1;
  }), eu(e);
}
function vn(e) {
  return "__value" in e ? e.__value : e.value;
}
const ru = Symbol("is custom element"), nu = Symbol("is html");
function dt(e, t, r, a) {
  var i = au(e);
  i[t] !== (i[t] = r) && (r == null ? e.removeAttribute(t) : typeof r != "string" && iu(e).includes(t) ? e[t] = r : e.setAttribute(t, r));
}
function au(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[An] ?? (e[An] = {
      [ru]: e.nodeName.includes("-"),
      [nu]: e.namespaceURI === Xs
    })
  );
}
var Ti = /* @__PURE__ */ new Map();
function iu(e) {
  var t = e.getAttribute("is") || e.nodeName, r = Ti.get(t);
  if (r) return r;
  Ti.set(t, r = []);
  for (var a, i = e, o = Element.prototype; o !== i; ) {
    a = Ss(i);
    for (var c in a)
      a[c].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      c !== "innerHTML" && c !== "textContent" && c !== "innerText" && r.push(c);
    i = Li(i);
  }
  return r;
}
function tr(e, t, r = t) {
  var a = /* @__PURE__ */ new WeakSet();
  Wi(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = pa(e) ? ga(o) : o, r(o), Y !== null && a.add(Y), await Fl(), o !== (o = t())) {
      var c = e.selectionStart, h = e.selectionEnd, v = e.value.length;
      if (e.value = o ?? "", h !== null) {
        var p = e.value.length;
        c === h && h === v && p > v ? (e.selectionStart = p, e.selectionEnd = p) : (e.selectionStart = c, e.selectionEnd = Math.min(h, p));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Ja(t) == null && e.value && (r(pa(e) ? ga(e.value) : e.value), Y !== null && a.add(Y)), so(() => {
    var i = t();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        Y
      );
      if (a.has(o))
        return;
    }
    pa(e) && i === ga(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function pa(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function ga(e) {
  return e === "" ? null : +e;
}
function ou(e) {
  Xe === null && Os(), Nl(() => {
    const t = Ja(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
const su = "5";
var Di;
typeof window < "u" && ((Di = window.__svelte ?? (window.__svelte = {})).v ?? (Di.v = /* @__PURE__ */ new Set())).add(su);
const lu = "See token balances and transfer history for your realm's treasury, send payments when allowed, and look up balances tied to members or invoices.", Ai = (e) => {
  var t = du();
  A(e, t);
}, uu = (e) => {
  var t = cu();
  A(e, t);
}, fu = (e) => {
  var t = vu();
  A(e, t);
};
var du = /* @__PURE__ */ Ga('<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>'), cu = /* @__PURE__ */ Ga('<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4.93 4.93a10 10 0 0114.14 0M19.07 19.07a10 10 0 01-14.14 0"></path></svg>'), vu = /* @__PURE__ */ Ga('<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>'), hu = /* @__PURE__ */ j('<div><div><div> </div> <div> </div></div> <div><div> </div> <button type="button">Send</button></div></div>'), pu = /* @__PURE__ */ j("<div><div></div> <p>On-chain ledger balance for this realm's vault</p></div>"), gu = /* @__PURE__ */ j("<div><p>No token configured</p> <p>This realm's treasury has no active token yet, so the vault holds no balance.</p></div>"), _a = /* @__PURE__ */ j("<span>Copied!</span>"), _u = /* @__PURE__ */ j("<div><span>Last refresh:</span> <span> </span></div>"), xu = /* @__PURE__ */ j('<div><div> </div> <div> </div> <div> </div> <div> </div> <div><span>Ledger:</span> <button type="button"> </button> <!></div> <div><span>Indexer:</span> <button type="button"> </button> <!></div></div>'), yu = /* @__PURE__ */ j('<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>'), bu = /* @__PURE__ */ j("<details><summary>Show details</summary> <pre> </pre></details>"), mu = /* @__PURE__ */ j("<div><p> </p> <!></div>"), xa = /* @__PURE__ */ j('<button type="button"> </button>'), ku = /* @__PURE__ */ j('<button type="button"><!> Admin</button>'), wu = /* @__PURE__ */ j("<div><div></div> <div></div> <div></div> <div></div> <div></div></div>"), Mi = /* @__PURE__ */ j("<div></div>"), Su = /* @__PURE__ */ j('<div><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <p>No activity yet</p> <p>Transfers and ledger events will appear here after the vault syncs.</p></div>'), ya = /* @__PURE__ */ j("<span>✓</span>"), ba = /* @__PURE__ */ j('<button type="button"> </button> <!>', 1), Eu = /* @__PURE__ */ j("<span>—</span>"), ma = /* @__PURE__ */ j("<span> </span>"), Tu = /* @__PURE__ */ j("<tr><td><!> <div> </div></td><td><span> </span></td><td><!></td><td><!></td><td><span> </span></td></tr>"), Au = /* @__PURE__ */ j("<div><table><thead><tr><th>When</th><th>Type</th><th>From</th><th>To</th><th>Amount</th></tr></thead><tbody></tbody></table></div>"), Mu = /* @__PURE__ */ j("<span>…</span>"), Nu = /* @__PURE__ */ j('<div><button type="button">Prev</button> <!> <button type="button">Next</button></div>'), Ru = /* @__PURE__ */ j("<div><span> <!></span> <!></div>"), Du = /* @__PURE__ */ j("<div><h2>Activity</h2> <!> <!></div>"), Lu = /* @__PURE__ */ j("<p>No token is configured for this realm's treasury, so nothing can be sent yet.</p>"), rn = /* @__PURE__ */ j("<p> </p>"), Ni = /* @__PURE__ */ j("<option> </option>"), Ou = /* @__PURE__ */ j('<select id="v-token"></select>'), Cu = /* @__PURE__ */ j("<p>Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).</p>"), Iu = /* @__PURE__ */ j("<p>Principal ID of the recipient.</p>"), Ri = /* @__PURE__ */ j("<p>Must be exactly 64 hex characters.</p>"), Pu = /* @__PURE__ */ j('<div><h2>Send tokens</h2> <form><div><span>Token</span> <!></div> <div><label for="v-to">Recipient</label> <input id="v-to" type="text" placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"/> <!></div> <div><div><label for="v-amount"> </label> <button type="button">Max</button></div> <input id="v-amount" type="text" inputmode="decimal" placeholder="0.00"/> <!> <!></div> <details><summary>Advanced (subaccounts)</summary> <div><p>Optional 64-character hex subaccount values for source or destination.</p> <div><label for="v-to-sub">To subaccount</label> <input id="v-to-sub" type="text" placeholder="64-character hex"/> <!></div> <div><label for="v-from-sub">From subaccount</label> <input id="v-from-sub" type="text" placeholder="64-character hex"/> <!></div></div></details> <button type="submit"> </button></form></div>'), Fu = /* @__PURE__ */ j(`<p>Enter a raw 64-character hex subaccount. Member and invoice compartments are derived
						from principal or invoice ID using internal prefixes.</p>`), ju = /* @__PURE__ */ j('<input type="text" list="member-list" placeholder="Member principal or pick from list"/> <datalist id="member-list"></datalist>', 1), Bu = /* @__PURE__ */ j('<input type="text" placeholder="Invoice ID"/>'), Vu = /* @__PURE__ */ j('<input type="text" placeholder="64-character hex subaccount"/>'), Hu = /* @__PURE__ */ j("<div> </div>"), zu = /* @__PURE__ */ j("<div><span> </span> <div> </div></div>"), qu = /* @__PURE__ */ j("<p>No balances found for this subaccount.</p>"), Uu = /* @__PURE__ */ j('<div><div><div><div> </div> <!></div> <button type="button"> </button></div> <div></div> <!></div>'), Wu = /* @__PURE__ */ j(`<div><h2>Look up a balance</h2> <p>The vault holds funds in separate compartments for each member and each invoice. Look up
					the balance in one of them.</p> <div></div> <!> <form><!> <button type="submit"><!> </button></form> <!></div>`), Yu = /* @__PURE__ */ j("<div><div> </div> <div> </div></div>"), Ju = /* @__PURE__ */ j("<p>No balances found in system</p>"), Gu = /* @__PURE__ */ j("<p>No transfer data available</p>"), Ku = /* @__PURE__ */ j(`<div><h2>Vault Admin</h2> <div><button type="button"><!> </button></div> <div><h3>Auto-refresh settings</h3> <p>The Vault will only run an expensive full refresh on load if the last refresh is older
						than this threshold.</p> <div><label for="v-refresh-age">Max refresh age:</label> <input id="v-refresh-age" type="number" min="1"/> <span>minutes</span> <button type="button">Save</button></div></div> <div><div><h3> </h3> <!></div> <div><h3>All Transfers in System</h3> <!></div></div></div>`), Xu = /* @__PURE__ */ j('<div><div><div><h1>Vault</h1> <p> </p></div> <button type="button" aria-label="Refresh" title="Refresh"><span><!></span></button></div> <!> <details><summary>Technical details</summary> <div><div><span>Vault Principal:</span> <button type="button"> </button> <!></div> <!> <!></div></details> <!> <nav><!> <!></nav> <div><!></div></div>');
function Zu(e, t) {
  ji(t, !0);
  const r = t.ctx.theme?.cn ?? ((...s) => s.filter(Boolean).join(" ")), a = 3600 * 1e3, i = "vault_settings", o = "vault_last_refresh", c = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/, h = /^[0-9a-fA-F]{64}$/;
  let v = /* @__PURE__ */ Z("activity"), p = /* @__PURE__ */ Z(!1), g = /* @__PURE__ */ Z(""), k = /* @__PURE__ */ Z(""), b = /* @__PURE__ */ Z(et([])), w = /* @__PURE__ */ ae(() => n(b).includes("admin")), S = /* @__PURE__ */ Z(""), R = /* @__PURE__ */ Z(et({})), T = /* @__PURE__ */ Z(et({})), te = /* @__PURE__ */ Z(!1), Ne = /* @__PURE__ */ Z(et([])), ve = /* @__PURE__ */ Z(et([])), Ee = /* @__PURE__ */ Z(null), Re = /* @__PURE__ */ Z(0);
  const Rt = 10;
  let Le = /* @__PURE__ */ Z(null), Ue = /* @__PURE__ */ Z(""), Bt = /* @__PURE__ */ Z(et($n())), Oe = /* @__PURE__ */ Z(et(Math.round($n().maxRefreshAgeMs / 6e4))), ut = /* @__PURE__ */ Z(""), Nr = /* @__PURE__ */ Z(""), Zr = /* @__PURE__ */ Z(""), lr = /* @__PURE__ */ Z(""), ur = /* @__PURE__ */ Z(""), mt = /* @__PURE__ */ Z("user"), Zt = /* @__PURE__ */ Z(""), Qr = /* @__PURE__ */ Z(""), $r = /* @__PURE__ */ Z(""), Dt = /* @__PURE__ */ Z(null), Rr = /* @__PURE__ */ Z(!1), fr = /* @__PURE__ */ Z(et({})), Ka = /* @__PURE__ */ Z(et([])), Vt = /* @__PURE__ */ ae(() => Object.keys(n(R))), Eo = /* @__PURE__ */ ae(() => n(Ka).filter((s) => s.kind === "user")), Ye = /* @__PURE__ */ ae(() => n(ut) ? n(R)[n(ut)] : void 0), Yn = /* @__PURE__ */ ae(() => n(ut) && n(T)[n(ut)] || 0), Jn = /* @__PURE__ */ ae(() => n(Ye)?.fee ?? 0), Qt = /* @__PURE__ */ ae(() => Mo(n(Zr), n(Ye)?.decimals ?? 8)), Dr = /* @__PURE__ */ ae(() => n(Nr).trim()), Xa = /* @__PURE__ */ ae(() => n(Dr) !== "" && c.test(n(Dr))), Gn = /* @__PURE__ */ ae(() => n(fr)[n(Dr)] || ""), Kn = /* @__PURE__ */ ae(() => n(lr).trim() === "" || h.test(n(lr).trim())), Xn = /* @__PURE__ */ ae(() => n(ur).trim() === "" || h.test(n(ur).trim())), Za = /* @__PURE__ */ ae(() => n(Xa) && n(Qt) != null && n(Qt) > 0 && n(Kn) && n(Xn) && !n(p));
  function Zn(s) {
    return typeof s == "string" ? JSON.parse(s) : s;
  }
  function wn(s) {
    return s && typeof s == "object" && s.success === !0 && s.data != null ? s.data : s;
  }
  function To(s) {
    return n(R)[s]?.name ?? s;
  }
  function Ao(s, d) {
    return (s / Math.pow(10, d)).toLocaleString(void 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(d, 8)
    });
  }
  function $t(s, d, x) {
    return `${Ao(s, d)} ${x}`;
  }
  function dr(s) {
    return `${s.toLocaleString()} base units`;
  }
  function Mo(s, d) {
    const x = s.trim();
    if (!x) return null;
    const E = x.split(".");
    if (E.length > 2) return null;
    const M = E[0], L = E[1] ?? "";
    if (!/^\d+$/.test(M) || L && !/^\d+$/.test(L) || L.length > d) return null;
    const O = L.padEnd(d, "0"), G = d > 0 ? M + O : M, q = Number(G);
    return Number.isFinite(q) && q >= 0 ? q : null;
  }
  function No(s, d) {
    const x = String(s).padStart(d + 1, "0");
    if (d === 0) return x;
    const E = x.slice(0, -d) || "0";
    let M = x.slice(-d).replace(/0+$/, "");
    return M ? `${E}.${M}` : E;
  }
  function Qn(s) {
    const d = n(Vt).find((x) => n(R)[x]?.name === s);
    return d && n(R)[d] ? n(R)[d] : {
      ledger: "",
      indexer: "",
      decimals: 8,
      symbol: s,
      name: s,
      fee: 0
    };
  }
  function $n() {
    try {
      const s = localStorage.getItem(i);
      if (s) {
        const d = JSON.parse(s);
        if (typeof d.maxRefreshAgeMs == "number" && d.maxRefreshAgeMs > 0)
          return { maxRefreshAgeMs: d.maxRefreshAgeMs };
      }
    } catch {
    }
    return { maxRefreshAgeMs: a };
  }
  function Ro(s) {
    try {
      localStorage.setItem(i, JSON.stringify(s));
    } catch {
    }
  }
  function Do() {
    const s = Math.max(1, Math.round(n(Oe) || 1));
    m(Bt, { maxRefreshAgeMs: s * 6e4 }, !0), Ro(n(Bt));
  }
  function Qa() {
    try {
      const s = localStorage.getItem(o);
      if (s) {
        const d = JSON.parse(s);
        if (d && typeof d.timestamp == "number" && d.balances)
          return { timestamp: d.timestamp, balances: d.balances };
      }
    } catch {
    }
    return null;
  }
  function Lo(s, d) {
    try {
      localStorage.setItem(o, JSON.stringify({ timestamp: s, balances: d }));
    } catch {
    }
  }
  async function cr(s) {
    try {
      await navigator.clipboard.writeText(s), m(Ue, s, !0), setTimeout(() => m(Ue, ""), 2e3);
    } catch {
    }
  }
  function $a(s) {
    const d = Math.floor((Date.now() - s.getTime()) / 1e3);
    if (d < 60) return `${d}s ago`;
    const x = Math.floor(d / 60);
    if (x < 60) return `${x}m ago`;
    const E = Math.floor(x / 60);
    return E < 24 ? `${E}h ago` : `${Math.floor(E / 24)}d ago`;
  }
  function Oo(s) {
    const d = String(s);
    if (d.includes("T") || d.includes("-") || d.includes(":")) return new Date(d);
    try {
      return new Date(Number(BigInt(d) / BigInt(1e6)));
    } catch {
      return /* @__PURE__ */ new Date();
    }
  }
  function ei(s, d = 20) {
    if (s.length <= d) return s;
    const x = Math.floor((d - 1) / 2);
    return `${s.slice(0, x)}…${s.slice(-x)}`;
  }
  function ea(s) {
    return s ? s === "minting_account" ? { display: "Mint", title: s, copyable: !1 } : s === "burn" ? { display: "Burned", title: s, copyable: !1 } : s === n(S) ? { display: "This vault", title: s, copyable: !1 } : n(fr)[s] ? {
      display: n(fr)[s],
      title: s,
      copyable: !1
    } : { display: ei(s), title: s, copyable: !0 } : { display: "—", title: "", copyable: !1 };
  }
  function Co(s) {
    const d = s || "unknown";
    return d.charAt(0).toUpperCase() + d.slice(1);
  }
  function Io(s) {
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
  function Po(s) {
    const d = Qn(s.token), x = s.amount || 0, E = s.fee || 0, M = $t(x, d.decimals, d.symbol), L = s.principal_to === n(S) || s.kind === "mint", O = s.principal_from === n(S) || s.kind === "burn";
    let G = M, q = "text-gray-600 dark:text-gray-400";
    L ? (G = `+${M}`, q = "text-emerald-600 dark:text-emerald-400") : O && (G = `−${M}`, q = "text-rose-600 dark:text-rose-400");
    const z = E > 0 ? `${dr(x)} · Fee: ${dr(E)}` : dr(x);
    return { text: G, className: q, title: z };
  }
  function ti(s) {
    try {
      const E = JSON.parse(s);
      if (E && typeof E.error == "string") return E.error;
    } catch {
    }
    const d = s.match(/Reject text:\s*([^\n]+?)(?:\s+Error code|\s+Call context|$)/);
    if (d) return d[1].trim();
    const x = s.split(`
`)[0].trim();
    return x.length > 200 ? `${x.slice(0, 200)}…` : x;
  }
  function Fo() {
    return n(Dt) ? n(mt) === "user" ? `Member ${n(fr)[n(Zt).trim()] || ei(n(Zt).trim())}` : n(mt) === "invoice" ? `Invoice ${n(Qr).trim()}` : `Subaccount ${n($r).trim().substring(0, 16)}…` : "";
  }
  async function jo(s) {
    if (typeof t.ctx.openModal != "function") return !0;
    try {
      const { actionId: d } = await t.ctx.openModal({
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
      return d === "confirm";
    } catch {
      return !1;
    }
  }
  function Bo(s) {
    m(ut, s, !0), m(v, "send");
  }
  function Vo() {
    if (!n(Ye)) return;
    const s = Math.max(0, n(Yn) - n(Jn));
    m(Zr, No(s, n(Ye).decimals), !0);
  }
  async function Ho() {
    if (typeof t.ctx.backend?.directory_list == "function")
      try {
        const s = await t.ctx.backend.directory_list(), d = Zn(s);
        if (d?.success && d?.data?.message) {
          const E = JSON.parse(d.data.message).entries || [], M = {};
          for (const L of E)
            L.principal && L.label && (M[L.principal] = L.label);
          m(Ka, E, !0), m(fr, M, !0);
        }
      } catch {
      }
  }
  async function zo() {
    try {
      const d = wn(await t.ctx.callSync("get_active_tokens", {}))?.ActiveTokens || [], x = {}, E = {};
      for (const O of d) {
        const G = O.symbol || O.name, q = O.ledger_canister_id ?? O.ledger ?? "", z = O.indexer_canister_id ?? O.indexer ?? "";
        G && (x[G] = {
          ledger: q,
          indexer: z,
          decimals: O.decimals || 8,
          symbol: G,
          name: O.name,
          fee: O.fee || 0
        }, E[G] = 0);
      }
      m(R, x, !0), m(T, E, !0);
      const M = Qa();
      if (M?.balances) {
        for (const O of Object.keys(x))
          O in M.balances && (E[O] = M.balances[O]);
        m(T, E, !0), m(Le, new Date(M.timestamp), !0);
      }
      const L = Object.keys(x);
      L.length > 0 && !n(ut) && m(ut, L[0], !0), m(te, !0);
    } catch (s) {
      console.error("Failed to load tokens:", s);
    }
  }
  async function ta() {
    m(p, !0), m(g, ""), m(k, "");
    try {
      const s = await t.ctx.backend.get_objects_paginated("WalletBalance", 0, 100, "asc"), d = Zn(s);
      if (d?.success && d?.data?.objectsListPaginated) {
        const x = d.data.objectsListPaginated;
        m(Ne, x.objects.map((E) => JSON.parse(E)), !0);
      } else
        m(Ne, [], !0);
    } catch (s) {
      const d = t.ctx.ui?.accessDeniedOperation?.(s);
      d != null ? (m(k, d, !0), m(g, "")) : (m(k, ""), m(g, s?.message ?? String(s), !0));
    } finally {
      m(p, !1);
    }
  }
  async function Sn(s = n(Re)) {
    m(p, !0), m(g, ""), m(k, "");
    try {
      if (!n(S))
        try {
          if (typeof t.ctx.backend.get_canister_id == "function") {
            const E = await t.ctx.backend.get_canister_id();
            m(S, E || "", !0);
          }
        } catch {
          m(S, "");
        }
      const d = await t.ctx.backend.get_objects_paginated("WalletTransfer", s, Rt, "desc"), x = Zn(d);
      if (x?.success && x?.data?.objectsListPaginated) {
        const E = x.data.objectsListPaginated;
        m(Ee, E.pagination, !0), m(ve, E.objects.map((M) => JSON.parse(M)), !0);
      } else
        m(ve, [], !0);
    } catch (d) {
      const x = t.ctx.ui?.accessDeniedOperation?.(d);
      x != null ? (m(k, x, !0), m(g, "")) : (m(k, ""), m(g, d?.message ?? String(d), !0));
    } finally {
      m(p, !1);
    }
  }
  function qo(s) {
    return n(Vt).find((d) => n(R)[d]?.name === s);
  }
  function Uo(s) {
    for (const [d, x] of Object.entries(s)) {
      const E = qo(d) || d;
      n(R)[E] && (n(T)[E] = x?.balance || 0);
    }
    m(T, { ...n(T) }, !0);
  }
  async function Wo() {
    try {
      typeof t.ctx.backend.get_canister_id == "function" && m(S, await t.ctx.backend.get_canister_id() || n(S), !0);
    } catch {
    }
  }
  async function ra() {
    m(p, !0), m(g, ""), m(k, "");
    try {
      const s = wn(await t.ctx.callAsync("refresh", {}));
      if (s?.TransactionSummary == null) {
        m(g, "Failed to sync vault transactions");
        return;
      }
      Uo(s.TransactionSummary.per_token || {}), await Wo(), m(Le, /* @__PURE__ */ new Date(), !0), Lo(n(Le).getTime(), n(T)), await Promise.all([ta(), Sn(0)]);
    } catch (s) {
      const d = t.ctx.ui?.accessDeniedOperation?.(s);
      d != null ? (m(k, d, !0), m(g, "")) : (m(k, ""), m(g, s?.message ?? String(s), !0));
    } finally {
      m(p, !1);
    }
  }
  async function Yo() {
    if (!n(Za) || !n(Ye) || n(Qt) == null) return;
    const s = n(Ye).symbol, d = $t(n(Qt), n(Ye).decimals, s), x = n(Gn) || n(Dr);
    if (await jo({
      title: "Confirm send",
      body: `Send ${d} to ${x}? This cannot be undone.`,
      confirmLabel: "Send",
      danger: !0
    })) {
      m(p, !0), m(g, ""), m(k, "");
      try {
        const M = {
          to_principal: n(Dr),
          amount: n(Qt),
          token: To(n(ut))
        };
        n(lr).trim() && (M.to_subaccount = n(lr).trim()), n(ur).trim() && (M.from_subaccount = n(ur).trim()), wn(await t.ctx.callAsync("transfer", M)), typeof t.ctx.notify == "function" && t.ctx.notify("success", `Sent ${d}`), m(Nr, ""), m(Zr, ""), m(lr, ""), m(ur, ""), await ta(), await Sn();
      } catch (M) {
        const L = t.ctx.ui?.accessDeniedOperation?.(M);
        L != null ? (m(k, L, !0), m(g, "")) : (m(k, ""), m(g, M?.message ?? String(M), !0));
      } finally {
        m(p, !1);
      }
    }
  }
  async function Jo() {
    m(Rr, !0), m(Dt, null), m(g, ""), m(k, "");
    try {
      const s = {};
      if (n(mt) === "user" && n(Zt).trim())
        s.principal = n(Zt).trim();
      else if (n(mt) === "invoice" && n(Qr).trim())
        s.invoice_id = n(Qr).trim();
      else if (n(mt) === "raw" && n($r).trim())
        s.subaccount_hex = n($r).trim();
      else {
        m(g, "Please enter a value to look up"), m(Rr, !1);
        return;
      }
      const d = wn(await t.ctx.callAsync("lookup_balance", s));
      d?.LookupBalance ? m(Dt, d.LookupBalance, !0) : m(g, "Lookup failed");
    } catch (s) {
      const d = t.ctx.ui?.accessDeniedOperation?.(s);
      d != null ? (m(k, d, !0), m(g, "")) : (m(k, ""), m(g, s?.message ?? String(s), !0));
    } finally {
      m(Rr, !1);
    }
  }
  async function na(s) {
    m(Re, s, !0), await Sn(s);
  }
  function Go(s, d) {
    if (s <= 7) return Array.from({ length: s }, (E, M) => M);
    const x = [0];
    d > 3 && x.push("...");
    for (let E = Math.max(1, d - 1); E <= Math.min(s - 2, d + 1); E++) x.push(E);
    return d < s - 4 && x.push("..."), x.push(s - 1), x;
  }
  const Ko = [
    { id: "activity", label: "Activity" },
    { id: "send", label: "Send" },
    { id: "lookup", label: "Lookup" }
  ];
  ou(() => {
    const s = [];
    return t.ctx.userProfiles?.subscribe && s.push(t.ctx.userProfiles.subscribe((d) => {
      m(b, d || [], !0);
    })), (async () => {
      await Promise.all([zo(), Ho()]);
      const d = $n(), x = Qa(), E = Date.now();
      !x || E - x.timestamp > d.maxRefreshAgeMs ? await ra() : await Promise.all([ta(), Sn(0)]);
    })(), () => {
      for (const d of s) d();
    };
  });
  var aa = Xu(), ia = _(aa), ri = _(ia), ni = _(ri), ai = y(ni, 2), Xo = _(ai), En = y(ri, 2), ii = _(En), Zo = _(ii);
  uu(Zo);
  var oi = y(ia, 2);
  {
    var Qo = (s) => {
      var d = pu(), x = _(d);
      wt(x, 20, () => n(Vt), (M) => M, (M, L) => {
        const O = /* @__PURE__ */ ae(() => n(R)[L]), G = /* @__PURE__ */ ae(() => n(T)[L] || 0);
        var q = hu(), z = _(q), J = _(z), pe = _(J), le = y(J, 2), xe = _(le), he = y(z, 2), ke = _(he), De = _(ke), Te = y(ke, 2);
        N(
          (C, U, I, P, B, oe, K, ge) => {
            u(q, 1, C), dt(q, "title", U), u(J, 1, I), F(pe, n(O).symbol), u(le, 1, P), F(xe, n(O).name), u(he, 1, B), u(ke, 1, oe), F(De, K), u(Te, 1, ge);
          },
          [
            () => l(r("flex items-center justify-between gap-4 bg-white/60 dark:bg-gray-800/40 rounded-lg p-4")),
            () => dr(n(G)),
            () => l(r("text-sm font-semibold text-indigo-900 dark:text-indigo-200")),
            () => l(r("text-xs text-indigo-600/70 dark:text-indigo-400/70")),
            () => l(r("flex items-center gap-4")),
            () => l(r("text-2xl font-bold text-indigo-900 dark:text-indigo-100 tabular-nums")),
            () => $t(n(G), n(O).decimals, n(O).symbol),
            () => l(r("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 transition-colors shrink-0"))
          ]
        ), Be("click", Te, () => Bo(L)), A(M, q);
      });
      var E = y(x, 2);
      N(
        (M, L, O) => {
          u(d, 1, M), u(x, 1, L), u(E, 1, O);
        },
        [
          () => l(r("bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20", "border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5")),
          () => l(r("space-y-3")),
          () => l(r("mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium"))
        ]
      ), A(s, d);
    }, $o = (s) => {
      var d = gu(), x = _(d), E = y(x, 2);
      N(
        (M, L, O) => {
          u(d, 1, M), u(x, 1, L), u(E, 1, O);
        },
        [
          () => l(r("border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center", "bg-gray-50 dark:bg-gray-800/50")),
          () => l(r("text-sm font-medium text-gray-600 dark:text-gray-300")),
          () => l(r("text-xs text-gray-500 dark:text-gray-400 mt-1"))
        ]
      ), A(s, d);
    };
    ee(oi, (s) => {
      n(te) && n(Vt).length > 0 ? s(Qo) : n(te) && s($o, 1);
    });
  }
  var oa = y(oi, 2), si = _(oa), li = y(si, 2), sa = _(li), ui = _(sa), en = y(ui, 2), es = _(en), ts = y(en, 2);
  {
    var rs = (s) => {
      var d = _a();
      N((x) => u(d, 1, x), [
        () => l(r("text-xs text-green-600 dark:text-green-400"))
      ]), A(s, d);
    };
    ee(ts, (s) => {
      n(Ue) === n(S) && n(S) && s(rs);
    });
  }
  var fi = y(sa, 2);
  {
    var ns = (s) => {
      var d = _u(), x = _(d), E = y(x, 2), M = _(E);
      N(
        (L, O, G, q, z) => {
          u(d, 1, L), u(x, 1, O), u(E, 1, G), F(M, `${q ?? ""} (${z ?? ""})`);
        },
        [
          () => l(r("text-xs text-gray-600 dark:text-gray-400")),
          () => l(r("font-medium")),
          () => l(r("ml-1")),
          () => n(Le).toLocaleString(),
          () => $a(n(Le))
        ]
      ), A(s, d);
    };
    ee(fi, (s) => {
      n(Le) && s(ns);
    });
  }
  var as = y(fi, 2);
  wt(as, 16, () => n(Vt), (s) => s, (s, d) => {
    const x = /* @__PURE__ */ ae(() => n(R)[d]);
    var E = xu(), M = _(E), L = _(M), O = y(M, 2), G = _(O), q = y(O, 2), z = _(q), J = y(q, 2), pe = _(J), le = y(J, 2), xe = _(le), he = y(xe, 2), ke = _(he), De = y(he, 2);
    {
      var Te = (K) => {
        var ge = _a();
        N((we) => u(ge, 1, we), [() => l(r("text-green-600 dark:text-green-400"))]), A(K, ge);
      };
      ee(De, (K) => {
        n(Ue) === n(x).ledger && K(Te);
      });
    }
    var C = y(le, 2), U = _(C), I = y(U, 2), P = _(I), B = y(I, 2);
    {
      var oe = (K) => {
        var ge = _a();
        N((we) => u(ge, 1, we), [() => l(r("text-green-600 dark:text-green-400"))]), A(K, ge);
      };
      ee(B, (K) => {
        n(Ue) === n(x).indexer && K(oe);
      });
    }
    N(
      (K, ge, we, be, X, fe, ye, Se, Ce, Q, _e, Ae) => {
        u(E, 1, K), u(M, 1, ge), F(L, n(x).symbol), u(O, 1, we), F(G, `Name: ${n(x).name ?? ""}`), u(q, 1, be), F(z, `Decimals: ${n(x).decimals ?? ""}`), u(J, 1, X), F(pe, `Transfer fee: ${fe ?? ""}`), u(le, 1, ye), u(xe, 1, Se), u(he, 1, Ce), F(ke, n(x).ledger), u(C, 1, Q), u(U, 1, _e), u(I, 1, Ae), F(P, n(x).indexer);
      },
      [
        () => l(r("text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 first:border-0 first:pt-0")),
        () => l(r("font-semibold text-gray-700 dark:text-gray-300")),
        () => l(r("text-gray-500 dark:text-gray-400")),
        () => l(r("text-gray-500 dark:text-gray-400")),
        () => l(r("text-gray-500 dark:text-gray-400")),
        () => $t(n(x).fee, n(x).decimals, n(x).symbol),
        () => l(r("flex flex-wrap items-center gap-2")),
        () => l(r("text-gray-500 dark:text-gray-400")),
        () => l(r("font-mono text-indigo-600 dark:text-indigo-400 hover:underline")),
        () => l(r("flex flex-wrap items-center gap-2")),
        () => l(r("text-gray-500 dark:text-gray-400")),
        () => l(r("font-mono text-indigo-600 dark:text-indigo-400 hover:underline"))
      ]
    ), Be("click", he, () => cr(n(x).ledger)), Be("click", I, () => cr(n(x).indexer)), A(s, E);
  });
  var di = y(oa, 2);
  {
    var is = (s) => {
      var d = ha(), x = hr(d);
      {
        var E = (L) => {
          const O = /* @__PURE__ */ ae(() => t.ctx.ui.AccessDenied);
          var G = ha(), q = hr(G);
          Zl(q, () => n(O), (z, J) => {
            J(z, {
              get operation() {
                return n(k);
              }
            });
          }), A(L, G);
        }, M = (L) => {
          var O = yu();
          A(L, O);
        };
        ee(x, (L) => {
          t.ctx.ui?.AccessDenied ? L(E) : L(M, -1);
        });
      }
      A(s, d);
    }, os = (s) => {
      var d = mu(), x = _(d), E = _(x), M = y(x, 2);
      {
        var L = (G) => {
          var q = bu(), z = _(q), J = y(z, 2), pe = _(J);
          N(
            (le, xe, he) => {
              u(q, 1, le), u(z, 1, xe), u(J, 1, he), F(pe, n(g));
            },
            [
              () => l(r("mt-2")),
              () => l(r("text-xs cursor-pointer select-none opacity-80")),
              () => l(r("mt-2 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto opacity-90"))
            ]
          ), A(G, q);
        }, O = /* @__PURE__ */ ae(() => ti(n(g)) !== n(g));
        ee(M, (G) => {
          n(O) && G(L);
        });
      }
      N(
        (G, q, z) => {
          u(d, 1, G), u(x, 1, q), F(E, z);
        },
        [
          () => l(r("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300")),
          () => l(r("font-medium")),
          () => ti(n(g))
        ]
      ), A(s, d);
    };
    ee(di, (s) => {
      n(k) ? s(is) : n(g) && s(os, 1);
    });
  }
  var la = y(di, 2), ci = _(la);
  wt(ci, 17, () => Ko, (s) => s.id, (s, d) => {
    var x = xa(), E = _(x);
    N(
      (M) => {
        u(x, 1, M), F(E, n(d).label);
      },
      [
        () => l(r("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", n(v) === n(d).id ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"))
      ]
    ), Be("click", x, () => {
      m(v, n(d).id, !0);
    }), A(s, x);
  });
  var ss = y(ci, 2);
  {
    var ls = (s) => {
      var d = ku(), x = _(d);
      fu(x), N((E) => u(d, 1, E), [
        () => l(r("ml-auto px-4 py-2.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5", n(v) === "admin" ? "border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"))
      ]), Be("click", d, () => {
        m(v, "admin");
      }), A(s, d);
    };
    ee(ss, (s) => {
      n(w) && s(ls);
    });
  }
  var us = y(la, 2), fs = _(us);
  {
    var ds = (s) => {
      var d = Du(), x = _(d), E = y(x, 2);
      {
        var M = (z) => {
          var J = Mi();
          wt(J, 20, () => Array(4), Si, (pe, le) => {
            var xe = wu(), he = _(xe), ke = y(he, 2), De = y(ke, 2), Te = y(De, 2), C = y(Te, 2);
            N(
              (U, I, P, B, oe, K) => {
                u(xe, 1, U), u(he, 1, I), u(ke, 1, P), u(De, 1, B), u(Te, 1, oe), u(C, 1, K);
              },
              [
                () => l(r("px-4 py-4 animate-pulse flex gap-4")),
                () => l(r("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20")),
                () => l(r("h-4 bg-gray-200 dark:bg-gray-700 rounded w-16")),
                () => l(r("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 hidden sm:block")),
                () => l(r("h-4 bg-gray-200 dark:bg-gray-700 rounded w-24")),
                () => l(r("h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"))
              ]
            ), A(pe, xe);
          }), N((pe) => u(J, 1, pe), [
            () => l(r("divide-y divide-gray-100 dark:divide-gray-700"))
          ]), A(z, J);
        }, L = (z) => {
          var J = Su(), pe = _(J), le = y(pe, 2), xe = y(le, 2);
          N(
            (he, ke, De, Te) => {
              u(J, 1, he), u(pe, 0, ke), u(le, 1, De), u(xe, 1, Te);
            },
            [
              () => l(r("px-6 py-12 text-center")),
              () => l(r("w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3")),
              () => l(r("text-sm font-medium text-gray-500 dark:text-gray-400")),
              () => l(r("text-xs text-gray-400 dark:text-gray-500 mt-1"))
            ]
          ), A(z, J);
        }, O = (z) => {
          var J = Au(), pe = _(J), le = _(pe), xe = _(le), he = _(xe), ke = y(he), De = y(ke), Te = y(De), C = y(Te), U = y(le);
          wt(U, 21, () => n(ve), (I) => I._id || I.tx_id, (I, P) => {
            const B = /* @__PURE__ */ ae(() => n(P).timestamp ? Oo(n(P).timestamp) : null), oe = /* @__PURE__ */ ae(() => ea(n(P).principal_from)), K = /* @__PURE__ */ ae(() => ea(n(P).principal_to)), ge = /* @__PURE__ */ ae(() => Po(n(P)));
            var we = Tu(), be = _(we), X = _(be);
            {
              var fe = (re) => {
                var ue = ba(), de = hr(ue), at = _(de), Ht = y(de, 2);
                {
                  var zt = (Je) => {
                    var ft = ya();
                    N((vr) => u(ft, 1, vr), [
                      () => l(r("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(Je, ft);
                  }, qe = /* @__PURE__ */ ae(() => n(Ue) === n(B).toLocaleString());
                  ee(Ht, (Je) => {
                    n(qe) && Je(zt);
                  });
                }
                N(
                  (Je, ft, vr) => {
                    u(de, 1, Je), dt(de, "title", ft), F(at, vr);
                  },
                  [
                    () => l(r("text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left")),
                    () => n(B).toLocaleString(),
                    () => $a(n(B))
                  ]
                ), Be("click", de, () => cr(n(B).toLocaleString())), A(re, ue);
              }, ye = (re) => {
                var ue = Eu();
                N((de) => u(ue, 1, de), [() => l(r("text-gray-400"))]), A(re, ue);
              };
              ee(X, (re) => {
                n(B) ? re(fe) : re(ye, -1);
              });
            }
            var Se = y(X, 2), Ce = _(Se), Q = y(be), _e = _(Q), Ae = _(_e), je = y(Q), We = _(je);
            {
              var He = (re) => {
                var ue = ba(), de = hr(ue), at = _(de), Ht = y(de, 2);
                {
                  var zt = (qe) => {
                    var Je = ya();
                    N((ft) => u(Je, 1, ft), [
                      () => l(r("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(qe, Je);
                  };
                  ee(Ht, (qe) => {
                    n(Ue) === n(P).principal_from && qe(zt);
                  });
                }
                N(
                  (qe) => {
                    u(de, 1, qe), dt(de, "title", n(oe).title), F(at, n(oe).display);
                  },
                  [
                    () => l(r("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Be("click", de, () => cr(n(P).principal_from)), A(re, ue);
              }, Ze = (re) => {
                var ue = ma(), de = _(ue);
                N(
                  (at) => {
                    u(ue, 1, at), dt(ue, "title", n(oe).title), F(de, n(oe).display);
                  },
                  [() => l(r("text-xs text-gray-700 dark:text-gray-300"))]
                ), A(re, ue);
              };
              ee(We, (re) => {
                n(oe).copyable ? re(He) : re(Ze, -1);
              });
            }
            var nt = y(je), kt = _(nt);
            {
              var Lt = (re) => {
                var ue = ba(), de = hr(ue), at = _(de), Ht = y(de, 2);
                {
                  var zt = (qe) => {
                    var Je = ya();
                    N((ft) => u(Je, 1, ft), [
                      () => l(r("ml-1 text-xs text-green-600 dark:text-green-400"))
                    ]), A(qe, Je);
                  };
                  ee(Ht, (qe) => {
                    n(Ue) === n(P).principal_to && qe(zt);
                  });
                }
                N(
                  (qe) => {
                    u(de, 1, qe), dt(de, "title", n(K).title), F(at, n(K).display);
                  },
                  [
                    () => l(r("text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs"))
                  ]
                ), Be("click", de, () => cr(n(P).principal_to)), A(re, ue);
              }, D = (re) => {
                var ue = ma(), de = _(ue);
                N(
                  (at) => {
                    u(ue, 1, at), dt(ue, "title", n(K).title), F(de, n(K).display);
                  },
                  [() => l(r("text-xs text-gray-700 dark:text-gray-300"))]
                ), A(re, ue);
              };
              ee(kt, (re) => {
                n(K).copyable ? re(Lt) : re(D, -1);
              });
            }
            var V = y(nt), se = _(V), ze = _(se);
            N(
              (re, ue, de, at, Ht, zt, qe, Je, ft, vr) => {
                u(we, 1, re), u(be, 1, ue), u(Se, 1, de), F(Ce, `#${(n(P).tx_id || n(P)._id) ?? ""}`), u(Q, 1, at), u(_e, 1, Ht), F(Ae, zt), u(je, 1, qe), u(nt, 1, Je), u(V, 1, ft), u(se, 1, vr), dt(se, "title", n(ge).title), F(ze, n(ge).text);
              },
              [
                () => l(r("hover:bg-gray-50 dark:hover:bg-gray-700/30")),
                () => l(r("px-4 py-3")),
                () => l(r("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
                () => l(r("px-4 py-3")),
                () => l(r("px-2 py-0.5 rounded text-xs font-medium", Io(n(P).kind))),
                () => Co(n(P).kind),
                () => l(r("px-4 py-3 hidden sm:table-cell")),
                () => l(r("px-4 py-3")),
                () => l(r("px-4 py-3 text-right")),
                () => l(r("font-medium tabular-nums", n(ge).className))
              ]
            ), A(I, we);
          }), N(
            (I, P, B, oe, K, ge, we, be, X) => {
              u(J, 1, I), u(pe, 1, P), u(le, 1, B), u(he, 1, oe), u(ke, 1, K), u(De, 1, ge), u(Te, 1, we), u(C, 1, be), u(U, 1, X);
            },
            [
              () => l(r("overflow-x-auto")),
              () => l(r("w-full text-sm")),
              () => l(r("bg-gray-50 dark:bg-gray-700/50")),
              () => l(r("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(r("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(r("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell")),
              () => l(r("px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(r("px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase")),
              () => l(r("divide-y divide-gray-100 dark:divide-gray-700"))
            ]
          ), A(z, J);
        };
        ee(E, (z) => {
          n(p) && n(ve).length === 0 ? z(M) : n(ve).length === 0 ? z(L, 1) : z(O, -1);
        });
      }
      var G = y(E, 2);
      {
        var q = (z) => {
          const J = /* @__PURE__ */ ae(() => Number(n(Ee).total_items_count)), pe = /* @__PURE__ */ ae(() => n(J) > 0 ? n(Re) * Rt + 1 : 0), le = /* @__PURE__ */ ae(() => Math.min((n(Re) + 1) * Rt, n(J))), xe = /* @__PURE__ */ ae(() => Number(n(Ee).total_pages) > 1);
          var he = Ru(), ke = _(he), De = _(ke), Te = y(De);
          {
            var C = (P) => {
              var B = ma(), oe = _(B);
              N(
                (K) => {
                  u(B, 1, K), F(oe, `(Page ${n(Re) + 1} of ${n(Ee).total_pages ?? ""})`);
                },
                [() => l(r("ml-1"))]
              ), A(P, B);
            };
            ee(Te, (P) => {
              n(xe) && P(C);
            });
          }
          var U = y(ke, 2);
          {
            var I = (P) => {
              var B = Nu(), oe = _(B), K = y(oe, 2);
              wt(K, 17, () => Go(Number(n(Ee).total_pages), n(Re)), Si, (we, be) => {
                var X = ha(), fe = hr(X);
                {
                  var ye = (Ce) => {
                    var Q = Mu();
                    N((_e) => u(Q, 1, _e), [() => l(r("px-1.5 text-xs text-gray-400"))]), A(Ce, Q);
                  }, Se = (Ce) => {
                    var Q = xa(), _e = _(Q);
                    N(
                      (Ae) => {
                        u(Q, 1, Ae), F(_e, n(be) + 1);
                      },
                      [
                        () => l(r("px-2.5 py-1 text-xs border rounded", n(Re) === n(be) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"))
                      ]
                    ), Be("click", Q, () => na(n(be))), A(Ce, Q);
                  };
                  ee(fe, (Ce) => {
                    n(be) === "..." ? Ce(ye) : Ce(Se, -1);
                  });
                }
                A(we, X);
              });
              var ge = y(K, 2);
              N(
                (we, be, X, fe) => {
                  u(B, 1, we), oe.disabled = n(Re) === 0, u(oe, 1, be), ge.disabled = X, u(ge, 1, fe);
                },
                [
                  () => l(r("flex items-center gap-1")),
                  () => l(r("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed")),
                  () => n(Re) >= Number(n(Ee).total_pages) - 1,
                  () => l(r("px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"))
                ]
              ), Be("click", oe, () => na(n(Re) - 1)), Be("click", ge, () => na(n(Re) + 1)), A(P, B);
            };
            ee(U, (P) => {
              n(xe) && P(I);
            });
          }
          N(
            (P, B) => {
              u(he, 1, P), u(ke, 1, B), F(De, `Showing ${n(pe) ?? ""}–${n(le) ?? ""} of ${n(J) ?? ""} `);
            },
            [
              () => l(r("p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3")),
              () => l(r("text-xs text-gray-500 dark:text-gray-400"))
            ]
          ), A(z, he);
        };
        ee(G, (z) => {
          n(Ee) && n(ve).length > 0 && z(q);
        });
      }
      N(
        (z, J) => {
          u(d, 1, z), u(x, 1, J);
        },
        [
          () => l(r("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden")),
          () => l(r("text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"))
        ]
      ), A(s, d);
    }, cs = (s) => {
      var d = Pu(), x = _(d), E = y(x, 2), M = _(E), L = _(M), O = y(L, 2);
      {
        var G = (D) => {
          var V = Lu();
          N((se) => u(V, 1, se), [() => l(r("text-sm text-gray-500 dark:text-gray-400"))]), A(D, V);
        }, q = (D) => {
          var V = rn(), se = _(V);
          N(
            (ze) => {
              u(V, 1, ze), F(se, `Sending ${n(R)[n(Vt)[0]].symbol ?? ""}`);
            },
            [() => l(r("text-sm text-gray-900 dark:text-gray-100"))]
          ), A(D, V);
        }, z = (D) => {
          var V = Ou();
          wt(V, 20, () => n(Vt), (se) => se, (se, ze) => {
            var re = Ni(), ue = _(re), de = {};
            N(() => {
              F(ue, n(R)[ze].symbol), de !== (de = ze) && (re.value = (re.__value = ze) ?? "");
            }), A(se, re);
          }), N((se) => u(V, 1, se), [
            () => l(r("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), tu(V, () => n(ut), (se) => m(ut, se)), A(D, V);
        };
        ee(O, (D) => {
          n(Vt).length === 0 ? D(G) : n(Vt).length === 1 ? D(q, 1) : D(z, -1);
        });
      }
      var J = y(M, 2), pe = _(J), le = y(pe, 2), xe = y(le, 2);
      {
        var he = (D) => {
          var V = Cu();
          N((se) => u(V, 1, se), [
            () => l(r("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(D, V);
        }, ke = (D) => {
          var V = rn(), se = _(V);
          N(
            (ze) => {
              u(V, 1, ze), F(se, n(Gn));
            },
            [
              () => l(r("text-xs text-gray-600 dark:text-gray-400 mt-1"))
            ]
          ), A(D, V);
        }, De = (D) => {
          var V = Iu();
          N((se) => u(V, 1, se), [
            () => l(r("text-xs text-gray-500 dark:text-gray-400 mt-1"))
          ]), A(D, V);
        };
        ee(xe, (D) => {
          n(Dr) && !n(Xa) ? D(he) : n(Gn) ? D(ke, 1) : D(De, -1);
        });
      }
      var Te = y(J, 2), C = _(Te), U = _(C), I = _(U), P = y(U, 2), B = y(C, 2), oe = y(B, 2);
      {
        var K = (D) => {
          var V = rn(), se = _(V);
          N(
            (ze, re, ue) => {
              u(V, 1, ze), F(se, `Available ${re ?? ""}
								· Network fee ${ue ?? ""}`);
            },
            [
              () => l(r("text-xs text-gray-500 dark:text-gray-400 mt-1")),
              () => $t(n(Yn), n(Ye).decimals, n(Ye).symbol),
              () => $t(n(Jn), n(Ye).decimals, n(Ye).symbol)
            ]
          ), A(D, V);
        };
        ee(oe, (D) => {
          n(Ye) && D(K);
        });
      }
      var ge = y(oe, 2);
      {
        var we = (D) => {
          var V = rn(), se = _(V);
          N(
            (ze, re) => {
              u(V, 1, ze), F(se, `= ${re ?? ""}`);
            },
            [
              () => l(r("text-xs text-gray-400 dark:text-gray-500 mt-0.5")),
              () => dr(n(Qt))
            ]
          ), A(D, V);
        };
        ee(ge, (D) => {
          n(Qt) != null && n(Qt) > 0 && D(we);
        });
      }
      var be = y(Te, 2), X = _(be), fe = y(X, 2), ye = _(fe), Se = y(ye, 2), Ce = _(Se), Q = y(Ce, 2), _e = y(Q, 2);
      {
        var Ae = (D) => {
          var V = Ri();
          N((se) => u(V, 1, se), [
            () => l(r("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(D, V);
        };
        ee(_e, (D) => {
          n(Kn) || D(Ae);
        });
      }
      var je = y(Se, 2), We = _(je), He = y(We, 2), Ze = y(He, 2);
      {
        var nt = (D) => {
          var V = Ri();
          N((se) => u(V, 1, se), [
            () => l(r("text-xs text-red-600 dark:text-red-400 mt-1"))
          ]), A(D, V);
        };
        ee(Ze, (D) => {
          n(Xn) || D(nt);
        });
      }
      var kt = y(be, 2), Lt = _(kt);
      N(
        (D, V, se, ze, re, ue, de, at, Ht, zt, qe, Je, ft, vr, ps, gs, _s, xs, ys) => {
          u(d, 1, D), u(x, 1, V), u(E, 1, se), u(L, 1, ze), u(pe, 1, re), u(le, 1, ue), u(C, 1, de), u(U, 1, at), F(I, `Amount${n(Ye) ? ` (${n(Ye).symbol})` : ""}`), P.disabled = !n(Ye) || n(Yn) <= n(Jn), u(P, 1, Ht), u(B, 1, zt), u(be, 1, qe), u(X, 1, Je), u(fe, 1, ft), u(ye, 1, vr), u(Ce, 1, ps), u(Q, 1, gs), u(We, 1, _s), u(He, 1, xs), kt.disabled = !n(Za), u(kt, 1, ys), F(Lt, n(p) ? "Sending…" : "Send");
        },
        [
          () => l(r("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(r("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => l(r("space-y-4")),
          () => l(r("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(r("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5")),
          () => l(r("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(r("flex items-center justify-between mb-1.5")),
          () => l(r("text-sm font-medium text-gray-700 dark:text-gray-300")),
          () => l(r("text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40")),
          () => l(r("w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40")),
          () => l(r("rounded-lg border border-gray-200 dark:border-gray-700")),
          () => l(r("px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none")),
          () => l(r("px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3")),
          () => l(r("text-xs text-gray-500 dark:text-gray-400")),
          () => l(r("block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1")),
          () => l(r("w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40", n(Kn) ? "border-gray-300 dark:border-gray-600" : "border-red-400 dark:border-red-600")),
          () => l(r("block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1")),
          () => l(r("w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40", n(Xn) ? "border-gray-300 dark:border-gray-600" : "border-red-400 dark:border-red-600")),
          () => l(r("w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg", "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"))
        ]
      ), wi("submit", E, (D) => {
        D.preventDefault(), Yo();
      }), tr(le, () => n(Nr), (D) => m(Nr, D)), Be("click", P, Vo), tr(B, () => n(Zr), (D) => m(Zr, D)), tr(Q, () => n(lr), (D) => m(lr, D)), tr(He, () => n(ur), (D) => m(ur, D)), A(s, d);
    }, vs = (s) => {
      var d = Wu(), x = _(d), E = y(x, 2), M = y(E, 2);
      wt(
        M,
        20,
        () => [
          { id: "user", label: "Member" },
          { id: "invoice", label: "Invoice" },
          { id: "raw", label: "Advanced" }
        ],
        (C) => C.id,
        (C, U) => {
          var I = xa(), P = _(I);
          N(
            (B) => {
              u(I, 1, B), F(P, U.label);
            },
            [
              () => l(r("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", n(mt) === U.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"))
            ]
          ), Be("click", I, () => {
            m(mt, U.id, !0), m(Dt, null);
          }), A(C, I);
        }
      );
      var L = y(M, 2);
      {
        var O = (C) => {
          var U = Fu();
          N((I) => u(U, 1, I), [
            () => l(r("text-xs text-gray-500 dark:text-gray-400 mb-3"))
          ]), A(C, U);
        };
        ee(L, (C) => {
          n(mt) === "raw" && C(O);
        });
      }
      var G = y(L, 2), q = _(G);
      {
        var z = (C) => {
          var U = ju(), I = hr(U), P = y(I, 2);
          wt(P, 21, () => n(Eo), (B) => B.principal, (B, oe) => {
            var K = Ni(), ge = _(K), we = {};
            N(() => {
              F(ge, n(oe).label), we !== (we = n(oe).principal) && (K.value = (K.__value = n(oe).principal) ?? "");
            }), A(B, K);
          }), N((B) => u(I, 1, B), [
            () => l(r("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), tr(I, () => n(Zt), (B) => m(Zt, B)), A(C, U);
        }, J = (C) => {
          var U = Bu();
          N((I) => u(U, 1, I), [
            () => l(r("flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), tr(U, () => n(Qr), (I) => m(Qr, I)), A(C, U);
        }, pe = (C) => {
          var U = Vu();
          N((I) => u(U, 1, I), [
            () => l(r("flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40"))
          ]), tr(U, () => n($r), (I) => m($r, I)), A(C, U);
        };
        ee(q, (C) => {
          n(mt) === "user" ? C(z) : n(mt) === "invoice" ? C(J, 1) : C(pe, -1);
        });
      }
      var le = y(q, 2), xe = _(le);
      {
        var he = (C) => {
          Ai(C);
        };
        ee(xe, (C) => {
          n(Rr) && C(he);
        });
      }
      var ke = y(xe), De = y(G, 2);
      {
        var Te = (C) => {
          var U = Uu(), I = _(U), P = _(I), B = _(P), oe = _(B), K = y(B, 2);
          {
            var ge = (Q) => {
              var _e = Hu(), Ae = _(_e);
              N(
                (je, We) => {
                  u(_e, 1, je), F(Ae, We);
                },
                [
                  () => l(r("text-xs text-gray-500 dark:text-gray-400 mt-0.5")),
                  () => n(fr)[n(Zt).trim()]
                ]
              ), A(Q, _e);
            }, we = /* @__PURE__ */ ae(() => n(mt) === "user" && n(fr)[n(Zt).trim()]);
            ee(K, (Q) => {
              n(we) && Q(ge);
            });
          }
          var be = y(P, 2), X = _(be), fe = y(I, 2);
          wt(fe, 21, () => Object.entries(n(Dt).balances), ([Q, _e]) => Q, (Q, _e) => {
            var Ae = /* @__PURE__ */ ae(() => Ns(n(_e), 2));
            let je = () => n(Ae)[0], We = () => n(Ae)[1];
            const He = /* @__PURE__ */ ae(() => Qn(je()));
            var Ze = zu(), nt = _(Ze), kt = _(nt), Lt = y(nt, 2), D = _(Lt);
            N(
              (V, se, ze, re, ue) => {
                u(Ze, 1, V), dt(Ze, "title", se), u(nt, 1, ze), F(kt, n(He).symbol), u(Lt, 1, re), F(D, ue);
              },
              [
                () => l(r("flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3")),
                () => dr(Number(We())),
                () => l(r("text-sm font-semibold text-gray-700 dark:text-gray-300")),
                () => l(r("text-lg font-bold tabular-nums", Number(We()) > 0 ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-gray-500")),
                () => $t(Number(We()), n(He).decimals, n(He).symbol)
              ]
            ), A(Q, Ze);
          });
          var ye = y(fe, 2);
          {
            var Se = (Q) => {
              var _e = qu();
              N((Ae) => u(_e, 1, Ae), [() => l(r("text-sm text-gray-500 italic"))]), A(Q, _e);
            }, Ce = /* @__PURE__ */ ae(() => Object.values(n(Dt).balances).every((Q) => Number(Q) === 0));
            ee(ye, (Q) => {
              n(Ce) && Q(Se);
            });
          }
          N(
            (Q, _e, Ae, je, We, He, Ze) => {
              u(U, 1, Q), u(I, 1, _e), u(B, 1, Ae), F(oe, je), u(be, 1, We), dt(be, "title", n(Dt).subaccount_hex), F(X, `${He ?? ""}…`), u(fe, 1, Ze);
            },
            [
              () => l(r("bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3")),
              () => l(r("flex items-center justify-between gap-3")),
              () => l(r("text-sm font-semibold text-gray-800 dark:text-gray-200")),
              () => Fo(),
              () => l(r("text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono")),
              () => n(Dt).subaccount_hex.substring(0, 16),
              () => l(r("space-y-2"))
            ]
          ), Be("click", be, () => cr(n(Dt)?.subaccount_hex || "")), A(C, U);
        };
        ee(De, (C) => {
          n(Dt) && C(Te);
        });
      }
      N(
        (C, U, I, P, B, oe) => {
          u(d, 1, C), u(x, 1, U), u(E, 1, I), u(M, 1, P), u(G, 1, B), le.disabled = n(Rr), u(le, 1, oe), F(ke, ` ${n(Rr) ? "Looking up…" : "Look up"}`);
        },
        [
          () => l(r("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(r("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2")),
          () => l(r("text-sm text-gray-500 dark:text-gray-400 mb-4")),
          () => l(r("flex flex-wrap gap-2 mb-4")),
          () => l(r("flex gap-2 mb-4")),
          () => l(r("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"))
        ]
      ), wi("submit", G, (C) => {
        C.preventDefault(), Jo();
      }), A(s, d);
    }, hs = (s) => {
      var d = Ku(), x = _(d), E = y(x, 2), M = _(E), L = _(M);
      {
        var O = (X) => {
          Ai(X);
        };
        ee(L, (X) => {
          n(p) && X(O);
        });
      }
      var G = y(L), q = y(E, 2), z = _(q), J = y(z, 2), pe = y(J, 2), le = _(pe), xe = y(le, 2), he = y(xe, 2), ke = y(he, 2), De = y(q, 2), Te = _(De), C = _(Te), U = _(C), I = y(C, 2);
      {
        var P = (X) => {
          var fe = Mi();
          wt(fe, 23, () => n(Ne), (ye, Se) => ye._id ?? ye.principal ?? ye.id ?? Se, (ye, Se) => {
            const Ce = /* @__PURE__ */ ae(() => Qn(n(Se).token)), Q = /* @__PURE__ */ ae(() => n(Se).principal || n(Se)._id || n(Se).id), _e = /* @__PURE__ */ ae(() => ea(n(Q)));
            var Ae = Yu(), je = _(Ae), We = _(je), He = y(je, 2), Ze = _(He);
            N(
              (nt, kt, Lt, D, V) => {
                u(Ae, 1, nt), u(je, 1, kt), dt(je, "title", n(_e).title), F(We, n(_e).display), u(He, 1, Lt), dt(He, "title", D), F(Ze, V);
              },
              [
                () => l(r("p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg")),
                () => l(r("text-xs text-gray-600 dark:text-gray-400 mb-1")),
                () => l(r("text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums")),
                () => dr(n(Se).amount || 0),
                () => $t(n(Se).amount || 0, n(Ce).decimals, n(Ce).symbol)
              ]
            ), A(ye, Ae);
          }), N((ye) => u(fe, 1, ye), [() => l(r("space-y-2 max-h-80 overflow-auto"))]), A(X, fe);
        }, B = (X) => {
          var fe = Ju();
          N((ye) => u(fe, 1, ye), [() => l(r("text-gray-500 dark:text-gray-400 text-sm"))]), A(X, fe);
        };
        ee(I, (X) => {
          n(Ne).length > 0 ? X(P) : X(B, -1);
        });
      }
      var oe = y(Te, 2), K = _(oe), ge = y(K, 2);
      {
        var we = (X) => {
          var fe = rn(), ye = _(fe);
          N(
            (Se) => {
              u(fe, 1, Se), F(ye, `Total transfers: ${n(Ee).total_items_count ?? ""}`);
            },
            [() => l(r("text-sm text-gray-600 dark:text-gray-400"))]
          ), A(X, fe);
        }, be = (X) => {
          var fe = Gu();
          N((ye) => u(fe, 1, ye), [() => l(r("text-gray-500 dark:text-gray-400 text-sm"))]), A(X, fe);
        };
        ee(ge, (X) => {
          n(Ee) ? X(we) : X(be, -1);
        });
      }
      N(
        (X, fe, ye, Se, Ce, Q, _e, Ae, je, We, He, Ze, nt, kt, Lt) => {
          u(d, 1, X), u(x, 1, fe), u(E, 1, ye), M.disabled = n(p), u(M, 1, Se), F(G, ` ${n(p) ? "Refreshing…" : "Full Vault Refresh"}`), u(q, 1, Ce), u(z, 1, Q), u(J, 1, _e), u(pe, 1, Ae), u(le, 1, je), u(xe, 1, We), u(he, 1, He), u(ke, 1, Ze), u(De, 1, nt), u(C, 1, kt), F(U, `All Balances in System (${n(Ne).length ?? ""})`), u(K, 1, Lt);
        },
        [
          () => l(r("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6")),
          () => l(r("text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4")),
          () => l(r("mb-4")),
          () => l(r("px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2")),
          () => l(r("mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700")),
          () => l(r("text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => l(r("text-xs text-gray-500 dark:text-gray-400 mb-3")),
          () => l(r("flex items-center gap-3")),
          () => l(r("text-sm text-gray-700 dark:text-gray-300")),
          () => l(r("w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100")),
          () => l(r("text-sm text-gray-500 dark:text-gray-400")),
          () => l(r("px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60")),
          () => l(r("space-y-6")),
          () => l(r("font-semibold text-gray-700 dark:text-gray-300 mb-2")),
          () => l(r("font-semibold text-gray-700 dark:text-gray-300 mb-2"))
        ]
      ), Be("click", M, ra), tr(xe, () => n(Oe), (X) => m(Oe, X)), Be("click", ke, Do), A(s, d);
    };
    ee(fs, (s) => {
      n(v) === "activity" ? s(ds) : n(v) === "send" ? s(cs, 1) : n(v) === "lookup" ? s(vs, 2) : n(v) === "admin" && s(hs, 3);
    });
  }
  N(
    (s, d, x, E, M, L, O, G, q, z, J, pe, le) => {
      u(aa, 1, s), u(ia, 1, d), u(ni, 1, x), u(ai, 1, E), F(Xo, lu), En.disabled = n(p), u(En, 1, M), u(ii, 1, L), u(oa, 1, O), u(si, 1, G), u(li, 1, q), u(sa, 1, z), u(ui, 1, J), u(en, 1, pe), dt(en, "title", n(S)), F(es, n(S) || "Loading…"), u(la, 1, le);
    },
    [
      () => l(r("max-w-4xl mx-auto p-6 space-y-6")),
      () => l(r("flex justify-between items-start gap-4")),
      () => l(r("text-2xl font-bold text-gray-900 dark:text-gray-100")),
      () => l(r("text-sm text-gray-500 dark:text-gray-400 mt-1")),
      () => l(r("p-2 rounded-lg text-gray-500 dark:text-gray-400", "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200", "disabled:opacity-50 disabled:cursor-not-allowed transition-colors")),
      () => l(r(n(p) ? "inline-block animate-spin" : "")),
      () => l(r("rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50")),
      () => l(r("px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none")),
      () => l(r("px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3")),
      () => l(r("flex flex-wrap items-center gap-2")),
      () => l(r("text-xs font-medium text-gray-500 dark:text-gray-400")),
      () => l(r("font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline")),
      () => l(r("flex border-b border-gray-200 dark:border-gray-700"))
    ]
  ), Be("click", En, ra), Be("click", en, () => cr(n(S))), A(e, aa), Bi();
}
Hl(["click"]);
function ef(e, t) {
  const r = Wl(Zu, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        Jl(r);
      } catch {
      }
    }
  };
}
export {
  ef as default
};
