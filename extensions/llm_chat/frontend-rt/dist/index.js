var Aa = Object.defineProperty;
var _i = (e) => {
  throw TypeError(e);
};
var Ca = (e, t, n) => t in e ? Aa(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var le = (e, t, n) => Ca(e, typeof t != "symbol" ? t + "" : t, n), fs = (e, t, n) => t.has(e) || _i("Cannot " + n);
var f = (e, t, n) => (fs(e, t, "read from private field"), n ? n.call(e) : t.get(e)), R = (e, t, n) => t.has(e) ? _i("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), O = (e, t, n, r) => (fs(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), y = (e, t, n) => (fs(e, t, "access private method"), n);
var ji = Array.isArray, Ma = Array.prototype.indexOf, Un = Array.prototype.includes, Kr = Array.from, Hi = Object.defineProperty, ar = Object.getOwnPropertyDescriptor, Ia = Object.getOwnPropertyDescriptors, Pa = Object.prototype, La = Array.prototype, Fi = Object.getPrototypeOf, bi = Object.isExtensible;
const za = () => {
};
function Na(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Ui() {
  var e, t, n = new Promise((r, s) => {
    e = r, t = s;
  });
  return { promise: n, resolve: e, reject: t };
}
const F = 2, dn = 4, Bs = 8, Ra = 1 << 24, ut = 16, $e = 32, Mt = 64, tn = 128, Vs = 256, Xe = 512, be = 1024, we = 2048, _e = 4096, Ae = 8192, ie = 16384, Bt = 32768, fr = 1 << 25, vn = 65536, Pn = 1 << 17, Oa = 1 << 18, qn = 1 << 19, Da = 1 << 20, Ne = 1 << 25, ur = 1 << 21, It = 1 << 22, He = 1 << 23, dr = 1 << 27, Ze = 1 << 26, Lr = Symbol("$state"), qi = Symbol("component"), ja = Symbol(""), zr = Symbol("attributes"), ms = Symbol("class"), xs = Symbol("style"), tr = Symbol("text"), Nr = Symbol("form reset"), Lf = Symbol("hmr anchor"), ys = new class extends Error {
  constructor() {
    super(...arguments);
    le(this, "name", "StaleReactionError");
    le(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}(), Ha = 1, Fa = 2, Bi = 4, Ua = 8, qa = 16, Ba = 1, Va = 2, Vi = {}, fe = Symbol("uninitialized"), Yi = "http://www.w3.org/1999/xhtml", Ya = "http://www.w3.org/2000/svg", Ga = "http://www.w3.org/1998/Math/MathML";
function $a() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function Wa() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Gi(e) {
  return e === this.v;
}
function Ka(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function $i(e) {
  return !Ka(e, this.v);
}
function Ja(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Qa(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Xa(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Za() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function el(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function tl() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function nl() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function rl() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function sl() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function il() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
let Ys = !1, nn = [];
function Wi() {
  var e = nn;
  nn = [], Na(e);
}
function Ct(e) {
  if (nn.length === 0 && !lr) {
    var t = nn;
    queueMicrotask(() => {
      t === nn && Wi();
    });
  }
  nn.push(e);
}
function ol() {
  for (; nn.length > 0; )
    Wi();
}
const al = -7169;
function Te(e, t) {
  e.f = e.f & al | t;
}
function wr(e) {
  (e.f & Xe) !== 0 || e.edges === null ? Te(e, be) : Te(e, _e);
}
let Ce = null;
function Dn(e) {
  Ce = e;
}
function Ki(e, t = !1, n) {
  Ce = {
    p: Ce,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      j
    ),
    l: null
  };
}
function Ji(e) {
  var t = (
    /** @type {ComponentContext} */
    Ce
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      Eo(r);
  }
  return t.i = !0, Ce = t.p, Gs(e);
}
function Gs(e = {}) {
  return Hi(e, qi, { value: !0 }), e;
}
function Qi() {
  return !0;
}
let Xi = null;
function ll(e, t, n, r) {
  var s = (
    /** @type {Effect} */
    j
  ), i = t.map(to), o = e.filter((h) => !h.settled);
  if (o.length > 0) {
    var a = cl(), l = eo(), u = o.length === 1 ? o[0].promise : Promise.all(o.map((h) => h.promise));
    u.then(() => {
      if ((s.f & ie) === 0) {
        a(o[0].run.get_batch());
        try {
          d();
        } catch (h) {
          _t(h, s);
        }
        Zi();
      }
    }).finally(l);
  } else
    d();
  function d() {
    if (!e.some((b) => b.failed)) {
      if (n.length === 0) {
        r(i);
        return;
      }
      var h = n.map((b) => /* @__PURE__ */ ul(b)), w = null;
      Xr(() => {
        for (var b of h)
          if (dl(b)) {
            c(b);
            return;
          }
        w !== null ? M.revalidate_branch(w) : w = Ye(() => {
          try {
            r([...i, ...h]);
          } catch (E) {
            _t(E, s);
          }
        });
      }, vn);
    }
  }
}
function cl() {
  var e = (
    /** @type {Effect} */
    j
  ), t = D, n = Ce, r = (
    /** @type {Batch} */
    M
  );
  return function(i = r) {
    kt(e), et(t), Dn(n), i !== null && (e.f & ie) === 0 && jn(i).activate();
  };
}
function Zi(e = !0) {
  kt(null), et(null), Dn(null), e && M?.deactivate();
}
let fl = null;
function eo() {
  for (var e = (
    /** @type {Effect} */
    j
  ), t = e.b, n = jn(
    /** @type {Batch} */
    M
  ), r = t; r && !r.is_pending; )
    r = r.parent;
  return n.increment(e), r?.increment(e, n), t?.update_effect_pending(1), () => {
    jn(n).decrement(e), r?.decrement(e, n), t?.update_effect_pending(-1);
  };
}
function jn(e) {
  for (; e.merged !== null; ) e = e.merged;
  return e;
}
// @__NO_SIDE_EFFECTS__
function to(e) {
  var t = F | we;
  return j !== null && (j.f |= qn), {
    ctx: Ce,
    deps: null,
    dv: null,
    edges: null,
    effects: null,
    equals: Gi,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      fe
    ),
    wv: 0,
    parent: j,
    ac: null
  };
}
const Ln = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function ul(e, t, n, r) {
  var s = hn(
    /** @type {V} */
    fe
  );
  s.f |= It;
  var i = /* @__PURE__ */ new Set(), o = fl;
  return Gl(() => {
    var a = (
      /** @type {Effect} */
      j
    ), l = Ui();
    try {
      var u = e();
      if (u === fe) return;
      var d = Promise.resolve(u), h = je?.signal;
      d.then(
        (C) => {
          h?.aborted || l.resolve(C);
        },
        (C) => {
          h?.aborted || C === ys && o === null || l.reject(C === ys ? Ln : C);
        }
      ).finally(Zi);
    } catch (C) {
      l.reject(C);
    }
    var w = (
      /** @type {Batch} */
      M
    ), b = eo();
    w.async_deriveds.get(a)?.reject(Ln), i.add(l), w.async_deriveds.set(a, l);
    const E = (C, p = void 0) => {
      if (b(), i.delete(l), !(p && p === Ln)) {
        var m = s.equals(C) && !p && (s.f & He) === 0;
        jn(w).capture(s, p ?? C, m, !!p), r?.(p), r = void 0;
      }
    };
    l.promise.then(E, (C) => E(null, C || "unknown"));
  }), Vl(() => {
    for (const a of i)
      a.reject(Ln);
  }), s;
}
function dl(e) {
  return (V?.get(e) ?? e).v === fe;
}
// @__NO_SIDE_EFFECTS__
function vl(e) {
  const t = /* @__PURE__ */ to(e);
  return t.equals = $i, t;
}
function hl(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Fe(
        /** @type {Effect} */
        t[n]
      );
  }
}
function Jr(e) {
  var t = j, n = e.parent;
  if (!Lt && n !== null && e.v !== fe && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (n.f & (ie | Ae)) !== 0)
    return $a(), wr(e), e.v;
  kt(n);
  try {
    return hl(e), Do(e);
  } finally {
    kt(t);
  }
}
function Qr(e) {
  var t = (
    /** @type {Derived} */
    e
  );
  if (Zr(t)) {
    var n = oe?.records, r = n?.get(t);
    r !== void 0 && Br(r.deps, r.dv) ? (n.delete(t), Fo(t, r)) : Jr(t);
  }
}
function $s(e) {
  var t = (
    /** @type {Map<Derived, Derived | DerivedRecord | BatchValue>} */
    lt
  ), n = t.get(e);
  if (n !== void 0) return n;
  var r = (
    /** @type {Batch} */
    oe
  ), s = (
    /** @type {Map<Value, BatchValue>} */
    V.get(e)
  ), i = s ?? e, o = s === void 0 ? (e.f & Ze) !== 0 : s.assigned, a = (
    /** @type {DerivedRecord | undefined} */
    r.get_record(e)
  );
  return o && !ti((a ?? e).deps, i.wv) ? n = i : a !== void 0 && Br(a.deps, a.dv) ? n = a : s === void 0 && !o && e.dv !== null && Br(e.deps, e.dv) ? n = e : (Jr(e), n = /** @type {DerivedRecord | undefined} */
  r.records?.get(e) ?? e), (e.f & Xe) !== 0 && t.set(e, n), n;
}
function pl(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      (t.teardown || (t.f & dr) !== 0) && (t.teardown?.(), ri(t), t.fn !== null && (t.teardown = za), si(t), Qs(t));
}
function no(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && t.fn !== null && Fn(t);
}
let De = null, Jt = null, M = null, Ar = null, ue = null;
function Es(e) {
  ue = e;
}
function jr(e) {
  var t = ue = {
    reverted_values: new Map(ue?.reverted_values),
    derived_cache: /* @__PURE__ */ new Map(),
    parent: ue
  };
  for (const [n, r] of e ?? []) t.reverted_values.set(n, r);
  return t;
}
function ro(e) {
  for (var t = ue; t !== null; t = t.parent)
    t.reverted_values.delete(e), t.derived_cache.clear();
}
let V = null, lt = null, oe = null, Ss = null;
var Cr = /* @__PURE__ */ new Set();
let lr = !1, cr = null, Rr = null;
var wi = 0, Qt = null, us = 0;
let gl = 1, ds = null;
var hr, pr, Le, Nn, rt, st, Ft, Ut, on, x, Ts, nr, so, As, io, oo, ao, lo, co, Cs, rr, en, fo, Ms, Is, Ps, uo, sr;
const Gr = class Gr {
  constructor() {
    R(this, x);
    le(this, "id", gl++);
    /** True as soon as `#process` was called */
    le(this, "started", !1);
    le(this, "linked", !0);
    /** @type {Batch | null} */
    le(this, "prev", null);
    /** @type {Batch | null} */
    le(this, "next", null);
    /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
    le(this, "async_deriveds", /* @__PURE__ */ new Map());
    /**
     * The current values (and their versions) of any sources that are updated in this batch,
     * including deriveds that were overridden via assignment — until it commits them (see `#commit`).
     * Its keys are those of `this.previous`, plus the sources this batch gave their first value. `e` says whether
     * the value is an error
     * @type {Map<Value, BatchValue>}
     */
    le(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values (and their versions) of any sources that are updated in this batch _before_ those updates took place.
     * For a derived, `assigned` says whether its value before was assigned, too (otherwise it was computed).
     * A source that this batch gave its first value (e.g. an async expression that resolved for the first time) has
     * no entry: there's no value from before it, so other views can't undo the write, and teardowns don't revert it.
     * @type {Map<Value, BatchValue>}
     */
    le(this, "previous", /* @__PURE__ */ new Map());
    /**
     * Results of reactions that belong to this batch rather than to the real world:
     * deriveds evaluated in this batch's view of the world with values that are not the
     * latest ones, and block/async effects that ran while this batch was processed.
     * Effect records become global state when the batch commits (see `promote_record`)
     * @type {Map<Reaction, BatchRecord> | null}
     */
    le(this, "records", null);
    /**
     * Earlier batches whose changes are part of this batch's view of the world, because
     * they intersect with it (this batch will be merged into them, see `#merge`)
     * @type {Batch[]}
     */
    le(this, "folded", []);
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks.
     * Each callback maps to the writes that apply in the teardowns it causes, if it was added
     * while block effects re-ran eagerly (see `eager_block_writes`)
     * @type {Map<(batch: Batch) => void, Map<Value, BatchValue> | null>}
     */
    R(this, hr, /* @__PURE__ */ new Map());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * (see `#commit_callbacks`)
     * @type {Map<(batch: Batch) => void, Map<Value, BatchValue> | null>}
     */
    R(this, pr, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    R(this, Le, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    R(this, Nn, null);
    /**
     * Effects to (re-)validate when this batch is processed next, and their status (DIRTY or MAYBE_DIRTY):
     * those that were scheduled while it wasn't being processed (see {@link schedule}), and those whose run
     * was deferred because it has pending work (see `#defer_effects`)
     * @type {Map<Effect, number>}
     */
    R(this, rt, /* @__PURE__ */ new Map());
    /**
     * Effects that were scheduled in this batch but not yet 'resolved' into the
     * root effects that need to be flushed. Resolving — the upwards traversal that
     * marks the path to each effect on the shared effect tree (see #resolve) — is
     * deferred until the batch is processed, so that the markers are created and
     * consumed within a single traversal. Scheduling into other batches (which can
     * happen concurrently, e.g. while a batch is committed) can therefore never
     * observe (and be confused by) this batch's markers.
     * May contain duplicates — deduplication happens during resolving
     * @type {Effect[]}
     */
    R(this, st, []);
    /**
     * Branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `#process`
     * @type {Set<Effect>}
     */
    R(this, Ft, /* @__PURE__ */ new Set());
    /**
     * Branches that this batch selected (see `unskip_effect`). A branch that is offscreen until
     * it is committed (see `EFFECT_OFFSCREEN`) only exists in the views of the batches that selected it
     * @type {Set<Effect>}
     */
    R(this, Ut, /* @__PURE__ */ new Set());
    le(this, "is_fork", !1);
    /**
     * The batch that this one was merged into, if any (see `#merge`). Its async work that is still in flight
     * continues as part of that one
     * @type {Batch | null}
     */
    le(this, "merged", null);
    /**
     * Batches whose runs this batch aborted. Merge into them before waiting for pending work.
     * Requests belong to this batch because a synchronous derived can abort outside traversal,
     * before an unrelated batch is processed (e.g. a fork being committed).
     * @type {Set<Batch>}
     */
    le(this, "merge_requests", /* @__PURE__ */ new Set());
    R(this, on, !1);
    Jt === null ? De = Jt = this : (Jt.next = this, this.prev = Jt), Jt = this;
  }
  /**
   * Whether `effect` is inside a branch that this batch skips, i.e. doesn't exist in its view of the world
   * @param {Effect} effect
   */
  is_skipped(t) {
    for (var n = (
      /** @type {Effect | null} */
      t
    ); n !== null; n = n.parent)
      if (y(this, x, nr).call(this, n)) return !0;
    return !1;
  }
  /**
   * Whether async work in `effect` holds up this batch — or, with `root`, the boundary whose content `root` is.
   * It doesn't if the effect is inside a branch that this batch skips (the branch is going to be destroyed),
   * or inside a boundary that is pending (which shows its pending snippet in the meantime).
   * Unlike a skipped branch, the content of a pending boundary does exist in the view of the batch: its
   * effects are still re-validated (see `#revalidate`), they just don't keep the batch from committing
   * @param {Effect} effect
   * @param {Effect | null} [root]
   */
  is_blocked_by(t, n = null) {
    for (var r = (
      /** @type {Effect | null} */
      t
    ); r !== null && r !== n; r = r.parent)
      if (y(this, x, nr).call(this, r) || (r.f & (tn | ie)) === tn && /** @type {Boundary} */
      r.b.is_pending)
        return !1;
    return !0;
  }
  /**
   * @param {Effect} effect
   */
  skip_effect(t) {
    f(this, Ft).add(t), f(this, Ut).delete(t);
  }
  /**
   * @param {Effect} effect
   */
  unskip_effect(t) {
    (f(this, Ft).delete(t) || !f(this, Ut).has(t) && ((t.f & Ne) !== 0 || this.folded.some((n) => f(n, Ft).has(t)))) && this.revalidate_branch(t), f(this, Ut).add(t);
  }
  /**
   * Like `unskip_effect`, for a branch that was just created offscreen while this batch is processed.
   * Its effects ran in this batch's view of the world when they were created, so there's nothing to re-validate
   * TODO can we skip revalidation in `unskip_effect` in more cases, by detecting whether things changed
   * inside a branch while it was skipped?
   * @param {Effect} effect
   */
  unskip_new_effect(t) {
    f(this, Ut).add(t);
  }
  /**
   * @param {Effect} effect
   */
  revalidate_branch(t) {
    for (var n = t.first; n !== null; n = n.next) {
      var r = n.f;
      (r & (ie | Ae)) === 0 && !y(this, x, nr).call(this, n) && ((r & ($e | Mt | Pn)) === 0 && n.fn !== null && this.schedule(n, _e), this.revalidate_branch(n));
    }
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values (and versions).
   * The source itself is only updated if this is its latest value, i.e. unless this
   * is a fork (whose writes only exist in its own view of the world) or a later batch
   * already wrote to it (e.g. because an async expression resolved in an earlier batch).
   * @param {Value} source
   * @param {any} value
   * @param {boolean} same whether the value equals the real one (it can, if this batch sees another one, see
   * `internal_set`) — in which case the source isn't updated, and the value gets the same version
   * @param {boolean} [error] whether the value is an error (thrown when read, see `runtime.js#get`)
   * @param {Effect[] | null} [updated_during_traversal]
   */
  capture(t, n, r, s = !1, i = null) {
    var o = this.previous.get(t), a = ml(this, t);
    o === void 0 && (o = a?.previous.get(t), o === void 0 && t.v !== fe && (o = {
      v: t.v,
      wv: t.wv,
      e: (t.f & He) !== 0,
      assigned: (t.f & Ze) !== 0
    }), o !== void 0 && this.previous.set(t, o)), Lt ? ro(t) : o !== void 0 && (ue?.reverted_values.set(t, o), ue?.derived_cache.clear());
    var l = {
      v: n,
      wv: r ? t.wv : ei(),
      e: s,
      // a write to a derived is an assignment
      assigned: (t.f & F) !== 0,
      async: (t.f & It) !== 0
    };
    this.current.set(t, l), Mr && (zn ?? (zn = /* @__PURE__ */ new Set())).add(t), V?.set(t, l), lt?.delete(
      /** @type {Derived} */
      t
    ), !this.is_fork && a !== null && a.previous.set(t, l), !this.is_fork && !r && a === null && xl(t, l), r || (Qt = null, us = 0, this.mark(t, we, i), Qt = null, Hr.size > 0 && !vo && Sl());
  }
  deactivate() {
    M = Ar = V = lt = oe = null;
  }
  flush() {
    var n;
    var t = jr(this.previous);
    try {
      if (y(this, x, As).call(this), Cr.size > 0)
        for (const r of Cr)
          Cr.delete(r), r.linked && !f(r, on) && y(n = r, x, As).call(n);
    } finally {
      wi = 0, Ss = null, cr = null, Rr = null, ue = t.parent, this.deactivate();
    }
  }
  discard() {
    y(this, x, Ms).call(this, f(this, pr));
    for (const t of this.async_deriveds.values())
      t.reject(Ln);
    y(this, x, sr).call(this), f(this, Nn)?.resolve();
  }
  /**
   * Make this batch's writes the real world, part of every other batch's view (see `#commit`).
   * If it has pending work it stays linked, coming first from now on (see `#move_to_front`)
   */
  commit_writes() {
    y(this, x, fo).call(this), this.linked && this.prev !== null && y(this, x, uo).call(this);
  }
  /**
   * @param {Effect} effect
   */
  increment(t) {
    var n = f(this, Le).get(t) ?? 0;
    f(this, Le).set(t, n + 1);
  }
  /**
   * @param {Effect} effect
   */
  decrement(t) {
    var n = f(this, Le).get(t) ?? 0;
    n === 1 ? f(this, Le).delete(t) : f(this, Le).set(t, n - 1), !f(this, on) && (O(this, on, !0), Ct(() => {
      O(this, on, !1), this.linked && this.flush();
    }));
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    f(this, hr).set(t, qt?.size ? qt : null);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    f(this, pr).set(t, qt?.size ? qt : null);
  }
  settled() {
    return (f(this, Nn) ?? O(this, Nn, Ui())).promise;
  }
  static ensure() {
    if (M === null) {
      const t = M = new Gr();
      Ar === null && !lr && Ct(() => {
        t.started || t.flush();
      });
    }
    return M;
  }
  /**
   * Make this the current batch, and its view of the world the active one
   */
  activate() {
    M = this, oe = this, ds !== this.id && (ds = null);
    {
      V = lt = null;
      return;
    }
  }
  /**
   * The record of `reaction` in this batch's view of the world, i.e. that of this batch
   * or of the (earlier) batches whose changes it includes, if any
   * @param {Reaction} reaction
   * @returns {BatchRecord | undefined}
   */
  get_record(t) {
    for (var n = this.records?.get(t), r = this.folded.length; n === void 0 && r--; )
      n = this.folded[r].records?.get(t);
    return n;
  }
  /**
   * @param {Value} signal
   * @param {number} status should be DIRTY or MAYBE_DIRTY
   * @param {Effect[] | null} [updated_during_traversal]
   * @returns {void}
   */
  mark(t, n, r = null) {
    var s = t.reactions;
    if (s !== null) {
      var i = s.length;
      if (us += i, us > 1e5 && Qt === null && (Qt = /* @__PURE__ */ new Set()), Qt !== null) {
        if (Qt.has(t)) return;
        Qt.add(t);
      }
      for (var o = 0; o < i; o++) {
        var a = s[o], l = a.f, u = (l & we) === 0;
        if ((l & Pn) !== 0)
          this.is_fork || (u && Te(a, n), Hr.add(
            /** @type {Effect} */
            a
          ));
        else if ((l & F) !== 0) {
          u && Te(a, n);
          var d = (
            /** @type {Derived} */
            a
          );
          lt?.delete(d), this.mark(d, _e, r);
        } else if (u) {
          var h = (
            /** @type {Effect} */
            a
          );
          (l & ut) !== 0 && St !== null && (Te(h, n), St.add(h)), r !== null ? (Te(h, n), r.push(h)) : this.schedule(h, n);
        }
      }
    }
  }
  /**
   * Schedule `effect` to be (re-)validated when this batch is processed. Its status only applies right
   * away if this is the batch that the current flush processes (next), or if a reaction is running (which
   * may have read what changed). Otherwise, whether an effect is dirty depends on this batch's view of the
   * world, so other batches (which may be processed first) mustn't see it: it is kept with this batch until
   * it is processed, and then checked against the exact versions of its dependencies (i.e. MAYBE_DIRTY)
   * @param {Effect} effect
   * @param {number} status DIRTY or MAYBE_DIRTY
   */
  schedule(t, n) {
    if (Ss = t, oe !== null && oe !== this && t !== D) {
      y(this, x, rr).call(this, t, (t.f & ur) !== 0 ? n : _e);
      return;
    }
    if (Ar !== this && D === null) {
      if (this.prev !== null || this.next !== null || this.is_fork) {
        y(this, x, rr).call(this, t, _e);
        return;
      }
      n = _e;
    }
    y(this, x, Is).call(this, t, n);
  }
};
hr = new WeakMap(), pr = new WeakMap(), Le = new WeakMap(), Nn = new WeakMap(), rt = new WeakMap(), st = new WeakMap(), Ft = new WeakMap(), Ut = new WeakMap(), on = new WeakMap(), x = new WeakSet(), Ts = function() {
  if (this.is_fork) return !0;
  for (const t of f(this, Le).keys())
    if (this.is_blocked_by(t))
      return !0;
  return !1;
}, /**
 * Whether `effect` is a branch that this batch skips, or that only exists offscreen for other batches
 * @param {Effect} effect
 */
nr = function(t) {
  return f(this, Ft).has(t) || (t.f & Ne) !== 0 && !f(this, Ut).has(t);
}, /**
 * Convert the effects that were scheduled in this batch into the root effects
 * that need to be traversed, marking the path to each effect (by clearing the
 * `CLEAN` flag on ancestor branches) so that the traversal can find them.
 * This happens right before traversal rather than at scheduling time, so that
 * the markers left on the (shared) effect tree are created and consumed within
 * a single traversal — scheduling into other batches can never observe them
 * @returns {Effect[]}
 */
so = function() {
  var t = [];
  for (const i of f(this, st))
    if (!((i.f & ie) !== 0 || (i.f & (we | _e)) === 0)) {
      for (var n = i, r = !1; n.parent !== null; ) {
        n = n.parent;
        var s = n.f;
        if ((s & (Mt | $e)) !== 0) {
          if ((s & be) === 0) {
            r = !0;
            break;
          }
          n.f ^= be;
        }
      }
      r || t.push(n);
    }
  return O(this, st, []), t;
}, As = function() {
  var n;
  for (var t = this; t !== null; )
    t = y(n = t, x, io).call(n);
}, /**
 * Processes this batch and returns the batch that needs to be processed next, if any
 * @returns {Batch | null}
 */
io = function() {
  var E, C;
  if (M = Ar = this, ue?.derived_cache.clear(), this.started = !0, ds = this.id, f(this, rt).size > 0) {
    for (const [p, m] of f(this, rt)) y(this, x, Is).call(this, p, m);
    f(this, rt).clear();
  }
  this.activate();
  for (var t = cr = [], n = [], r = [], s = Rr = []; f(this, st).length > 0; ) {
    wi++ > 1e3 && (y(this, x, sr).call(this), wl());
    for (const p of y(this, x, so).call(this))
      try {
        y(this, x, ao).call(this, p, t, n, r);
      } catch (m) {
        throw Ls(p, !0), y(this, x, Ts).call(this) || this.discard(), m;
      }
    if (f(this, st).length > 0) {
      for (const p of n) f(this, st).push(p);
      for (const p of t) f(this, st).push(p);
      n.length = 0, t.length = 0;
    }
  }
  if (M = null, s.length > 0) {
    var i = Gr.ensure();
    for (const p of s)
      (p.f & be) === 0 && i.schedule(p, _e);
  }
  if (cr = null, Rr = null, this.merge_requests.size > 0) {
    const p = Array.from(this.merge_requests, jn).filter((m) => m !== this && m.linked && !m.is_fork).sort((m, X) => m.id - X.id);
    if (this.merge_requests.clear(), p.length > 0) {
      y(this, x, en).call(this, n), y(this, x, en).call(this, t);
      for (var o = this, a = p.length; a--; ) {
        var l = p[a];
        l !== o && (y(E = l, x, Cs).call(E, o), o = l);
      }
      return o;
    }
  }
  if (y(this, x, Ts).call(this)) {
    y(this, x, en).call(this, n), y(this, x, en).call(this, t);
    for (const p of f(this, Ft))
      Ls(p);
    return s.length > 0 ? (
      /** @type {Batch} */
      /** @type {unknown} */
      M
    ) : null;
  }
  const u = y(this, x, lo).call(this);
  if (u)
    return y(this, x, en).call(this, n), y(this, x, en).call(this, t), y(C = u, x, Cs).call(C, this), u;
  for (const p of r)
    p.is_pending && p.is_ready(this) && p.reveal(t);
  y(this, x, Ps).call(this, !0), y(this, x, Ms).call(this, f(this, hr));
  var d = Mr, h = zn;
  try {
    Mr = !0;
    var w = ki(n);
    ki(t, w);
  } finally {
    Mr = d, zn = h;
  }
  f(this, Nn)?.resolve();
  var b = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    M
  );
  if (f(this, Le).size === 0 && (f(this, st).length === 0 || b !== null) && y(this, x, sr).call(this), b !== null && ue !== null)
    for (const [p, m] of ue.reverted_values)
      b.previous.get(p)?.wv !== m.wv && ue.reverted_values.delete(p);
  return b;
}, /**
 * Schedule the reactions that (transitively) depend on `sources` for re-validation in this batch.
 * They are marked MAYBE_DIRTY, which means that they are only re-run if the exact versions
 * of their dependencies differ from the ones they last saw (in this batch's view of the world)
 * @param {Iterable<Source>} sources
 */
oo = function(t) {
  var n = new Set(t), r = /* @__PURE__ */ new Set();
  for (const a of n) {
    var s = a.reactions;
    if (s !== null)
      for (const l of s) {
        var i = l.f;
        if ((i & F) !== 0) {
          (i & be) !== 0 && Te(l, _e), n.add(
            /** @type {Derived} */
            l
          );
          continue;
        }
        var o = (
          /** @type {Effect} */
          l
        );
        r.has(o) || (r.add(o), (i & (Pn | Ae | ie)) === 0 && // branches that this batch skips don't exist in its view of the world
        !this.is_skipped(o) && this.schedule(o, _e));
      }
  }
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 * @param {Boundary[]} revealed_boundaries
 */
ao = function(t, n, r, s) {
  t.f ^= be;
  for (var i = t.first; i !== null; ) {
    var o = i.f, a = (o & ($e | Mt)) !== 0, l = a && (o & be) !== 0, u = l || (o & (Ae | Pn)) !== 0 || y(this, x, nr).call(this, i);
    if (!u && i.fn !== null) {
      a ? i.f ^= be : (o & dn) !== 0 ? n.push(i) : Zr(i) && Fn(i);
      var d = i.first;
      if (d !== null) {
        i = d;
        continue;
      }
    }
    for (; i !== null; ) {
      if ((i.f & (tn | ie)) === tn) {
        var h = (
          /** @type {Boundary} */
          i.b
        );
        h.is_pending && h.is_ready(this) && s.push(h);
      }
      var w = i.next;
      if (w !== null) {
        i = w;
        break;
      }
      i = i.parent;
    }
  }
}, lo = function() {
  for (var t = this.prev; t !== null; t = t.prev)
    if (!t.is_fork && y(this, x, co).call(this, t)) return t;
  return null;
}, /** @param {Batch} batch */
co = function(t) {
  for (const n of this.current.keys())
    if (t.current.has(n)) return !0;
  return !1;
}, /**
 * Take over the writes of a later batch that depends on this one, because it finished first
 * or aborted one of this batch's runs.
 * Values it produced (async results, deriveds) remain valid; block effects select their
 * branches again for this batch, if needed (their selections are keyed by batch)
 * @param {Batch} batch
 */
Cs = function(t) {
  var s;
  for (const i of t.merge_requests) this.merge_requests.add(i);
  t.merge_requests.clear();
  for (const [i, o] of t.current) {
    if (!this.previous.has(i)) {
      const a = t.previous.get(i);
      a && this.previous.set(i, a);
    }
    this.current.set(i, o);
  }
  for (const [i, o] of t.async_deriveds) {
    const a = this.async_deriveds.get(i);
    a && a !== o && o.promise.then(a.resolve, a.reject), this.async_deriveds.set(i, o);
  }
  for (const [i, o] of t.records ?? [])
    if ((i.f & ut) === 0) {
      var n = this.records?.get(i);
      (this.records ?? (this.records = /* @__PURE__ */ new Map())).set(i, o), t.records?.delete(i), Vr(i, n);
    }
  if (t.async_deriveds.clear(), f(t, Le).size > 0) {
    for (const [i, o] of f(t, Le))
      f(this, Le).set(i, (f(this, Le).get(i) ?? 0) + o);
    f(t, Le).clear();
  }
  if (f(t, rt).size > 0) {
    for (const [i, o] of f(t, rt))
      y(this, x, rr).call(this, i, o);
    f(t, rt).clear();
  }
  const r = () => t.discard();
  this.oncommit(r), this.ondiscard(r), t.merged = this, y(s = t, x, sr).call(s);
}, /**
 * Note that `effect` needs to be (re-)validated, without downgrading a DIRTY effect to MAYBE_DIRTY
 * @param {Effect} effect
 * @param {number} status DIRTY or MAYBE_DIRTY
 */
rr = function(t, n) {
  (n === we || f(this, rt).get(t) !== we) && f(this, rt).set(t, n);
}, /**
 * @param {Effect[]} effects
 */
en = function(t) {
  for (var n = 0; n < t.length; n += 1) {
    var r = t[n], s = r.f & (we | _e);
    s !== 0 && (y(this, x, rr).call(this, r, r.dv === null ? _e : s), Te(r, be));
  }
}, fo = function() {
  var i;
  for (let o = De; o !== null; o = o.next)
    if (o !== this) {
      var t = o.id < this.id, n = [];
      for (const [a, l] of this.current) {
        var r = o.current.get(a);
        if (r !== void 0)
          if (t && l.v !== r.v && !r.async)
            o.current.set(a, l);
          else
            continue;
        n.push(a);
      }
      if (!(!o.started || o.current.size === 0)) {
        var s = !0;
        for (const a of o.current.keys())
          if (!this.current.has(a)) {
            s = !1;
            break;
          }
        s && t ? o.discard() : n.length > 0 && (y(i = o, x, oo).call(i, n), Cr.add(o));
      }
    }
  this.current.clear(), this.previous.clear();
}, /**
 * Runs the commit/discard callbacks.
 * A callback that was added while block effects re-ran eagerly detaches the branches that such a run
 * deselected (see `flush_queued_effects`). The teardowns it causes see the writes that applied in the
 * run's view, like they would have during the run: of the values that the current teardown context
 * reverts, the writes of the effects that ran before the one whose writes caused the run are restored.
 * Callbacks run untracked, because a batch can commit while an effect runs (e.g. one that calls `flushSync`)
 * @param {Map<(batch: Batch) => void, Map<Value, BatchValue> | null>} callbacks
 */
Ms = function(t) {
  mr(() => {
    for (const [r, s] of t) {
      if (s === null) {
        r(this);
        continue;
      }
      var n = jr();
      for (const [i, o] of s)
        n.reverted_values.has(i) && n.reverted_values.set(i, o);
      try {
        r(this);
      } finally {
        ue = n.parent;
      }
    }
  }), t.clear();
}, /**
 * @param {Effect} effect
 * @param {number} status
 */
Is = function(t, n) {
  (t.f & we) === 0 && Te(t, n), f(this, st).push(t);
}, /** @param {boolean} commit whether the effects' runs become global state */
Ps = function(t = !1) {
  var n = this.records;
  if (n !== null) {
    this.records = null;
    for (const [s, i] of n) {
      if ((s.f & (F | ie)) === 0) {
        var r = (s.f & It) !== 0 && Ns(i) && !Ns(s);
        if (t && !r && (Fo(s, i), (s.f & It) !== 0))
          for (let o = De; o !== null; o = o.next)
            o !== this && !o.records?.has(s) && o.async_deriveds.get(
              /** @type {Effect} */
              s
            )?.reject(Ln);
        rc(s);
      }
      Vr(s, i);
    }
  }
}, /**
 * A batch that committed while work inside a pending boundary was in flight stays linked, so that the results
 * arrive in it. Its writes are the real world now, part of every other batch's view, so it comes first from now
 * on: This ensures logic about who sees what values in intersects/merge/etc work correctly.
 */
uo = function() {
  var t = (
    /** @type {Batch} */
    this.prev
  ), n = (
    /** @type {Batch} */
    De
  );
  t.next = this.next, this.next === null ? Jt = t : this.next.prev = t, this.prev = null, this.next = n, n.prev = De = this, this.id = n.id - 1;
}, sr = function() {
  if (this.linked) {
    var t = this.prev, n = this.next;
    t === null ? De = n : t.next = n, n === null ? Jt = t : n.prev = t, this.linked = !1, y(this, x, Ps).call(this);
  }
};
let Vt = Gr, _l = null;
function bl(e) {
  var t = lr, n = oe !== M ? oe : null;
  lr = !0;
  try {
    for (var r; ; ) {
      if (ol(), M === null)
        return (
          /** @type {T} */
          r
        );
      M.flush();
    }
  } finally {
    lr = t, oe = n;
  }
}
function wl() {
  try {
    tl();
  } catch (e) {
    _t(e, Ss);
  }
}
var Mr = !1, zn = null;
let St = null, qt = null;
function kl(e) {
  if ((e.f & (dn | Bt)) !== dn) return !1;
  for (var t = e.b; t !== null; t = t.parent)
    if (t.is_pending)
      return t.defer_effect(e), !0;
  return !1;
}
function ki(e, t = null) {
  var n = e.length;
  if (n === 0) return t;
  for (var r = 0; r < n; ) {
    var s = e[r++];
    if ((s.f & (ie | Ae)) === 0 && // don't run if already marked for destruction in the next batch
    // (this can happen if an effect writes a value which e.g. makes an if block falsy)
    !M?.is_skipped(s) && !kl(s) && Zr(s)) {
      St = /* @__PURE__ */ new Set();
      var i = vr;
      if (Fn(s), s.edges === null && s.first === null && s.nodes === null && s.teardown === null && s.ac === null && Co(s), St?.size > 0) {
        var o = ue;
        t !== null && jr(t);
        var a = qt;
        qt = new Map(t);
        try {
          for (const u of St) {
            if ((u.f & (ie | Ae)) !== 0 || M?.is_skipped(u)) continue;
            const d = [u];
            let h = u.parent;
            for (; h !== null; )
              St.has(h) && (St.delete(h), d.push(h)), h = h.parent;
            for (let w = d.length - 1; w >= 0; w--) {
              const b = d[w];
              (b.f & (ie | Ae)) !== 0 || M?.is_skipped(b) || Fn(b);
            }
          }
        } finally {
          qt = a, St?.clear(), ue = o;
        }
      }
      if (vr !== i && M !== null && zn !== null)
        for (const u of zn) {
          var l = M.current.get(u);
          l !== void 0 && l.wv > i && (t ?? (t = /* @__PURE__ */ new Map())).set(u, l);
        }
    }
    zn?.clear();
  }
  return St = null, t;
}
function ml(e, t) {
  for (var n = e.next; n !== null && (n.is_fork || !n.current.has(t)); )
    n = n.next;
  return n;
}
function xl(e, t) {
  e.v = t.v, e.wv = t.wv, e.f = t.e ? e.f | He : e.f & ~He, (e.f & F) !== 0 && (e.f |= Ze, wr(
    /** @type {Derived} */
    e
  ));
}
function yl(e) {
  var t = V, n = lt, r = oe;
  V = lt = oe = null;
  try {
    e();
  } finally {
    V = t, lt = n, oe = r;
  }
}
function Ls(e, t = !1) {
  if (!(!t && (e.f & $e) !== 0 && (e.f & be) !== 0)) {
    Te(e, be);
    for (var n = e.first; n !== null; )
      Ls(n, t), n = n.next;
  }
}
let Hr = /* @__PURE__ */ new Set(), vo = !1;
function hn(e, t) {
  var n = {
    f: 0,
    v: e,
    reactions: null,
    equals: Gi,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function z(e, t) {
  const n = hn(e);
  return Jl(n), n;
}
// @__NO_SIDE_EFFECTS__
function El(e, t = !1, n = !0) {
  const r = hn(e);
  return t || (r.equals = $i), r;
}
function Or(e) {
  D !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!ft || (D.f & Pn) !== 0) && Qi() && (D.f & (F | ut | It | Pn)) !== 0 && (bt === null || !bt.has(e)) && sl();
}
function _(e, t, n = !1) {
  return Or(e), Ht(e, t, n);
}
function Ht(e, t, n = !1) {
  let r = n ? at(t) : t;
  return Fr(e, r, Rr);
}
function Fr(e, t, n = null) {
  var r = e.equals(t) && (e.f & He) === 0, s = V?.get(e);
  if (!r || s !== void 0 && (s.e || !e.equals.call(s, t))) {
    var i = Vt.ensure();
    (e.f & (F | we | Ze)) === (F | we) && Jr(
      /** @type {Derived} */
      e
    ), i.capture(e, t, r, !1, n), j !== null && (j.f & be) !== 0 && (j.f & ($e | Mt)) === 0 && (Ke === null ? Ql([e]) : Ke.push(e));
  } else Lt && ro(e);
  return t;
}
function Sl() {
  vo = !1, yl(Tl);
}
function Tl() {
  for (const e of Hr) {
    (e.f & be) !== 0 && Te(e, _e);
    let t;
    try {
      t = Zr(e);
    } catch {
      t = !0;
    }
    t && Fn(e);
  }
  Hr.clear();
}
function mi(e) {
  _(e, e.v + 1);
}
function vs(e) {
  Ht(e, e.v + 1);
}
function at(e) {
  if (typeof e != "object" || e === null || Lr in e || qi in e)
    return e;
  const t = Fi(e);
  if (t !== Pa && t !== La)
    return e;
  var n = /* @__PURE__ */ new Map(), r = ji(e), s = /* @__PURE__ */ z(0), i = un, o = (a) => {
    if (un === i)
      return a();
    var l = D, u = un;
    et(null), Si(i);
    var d = a();
    return et(l), Si(u), d;
  };
  return r && n.set("length", /* @__PURE__ */ z(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(a, l, u) {
        (!("value" in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) && nl(), Or(s);
        var d = n.get(l);
        return d === void 0 ? o(() => {
          var h = /* @__PURE__ */ z(u.value);
          return n.set(l, h), h;
        }) : Ht(d, u.value, !0), !0;
      },
      deleteProperty(a, l) {
        Or(s);
        var u = n.get(l);
        if (u === void 0) {
          if (l in a) {
            const d = o(() => /* @__PURE__ */ z(fe));
            n.set(l, d), vs(s);
          }
        } else
          Ht(u, fe), vs(s);
        return !0;
      },
      get(a, l, u) {
        if (l === Lr)
          return e;
        var d = n.get(l), h = l in a;
        if (d === void 0 && (!h || ar(a, l)?.writable) && (d = o(() => {
          var b = at(h ? a[l] : fe), E = /* @__PURE__ */ z(b);
          return E;
        }), n.set(l, d)), d !== void 0) {
          var w = c(d);
          return w === fe ? void 0 : w;
        }
        return Reflect.get(a, l, u);
      },
      getOwnPropertyDescriptor(a, l) {
        this.has?.(a, l);
        var u = Reflect.getOwnPropertyDescriptor(a, l), d = n.get(l);
        if (d !== void 0) {
          var h = c(d);
          if (h === fe)
            return;
          if (u && "value" in u)
            u.value = h;
          else
            return {
              enumerable: !0,
              configurable: !0,
              value: h,
              writable: !0
            };
        }
        return u;
      },
      has(a, l) {
        if (l === Lr)
          return !0;
        var u = n.get(l), d = u !== void 0 && u.v !== fe || Reflect.has(a, l);
        if (u !== void 0 || (j !== null || D !== null) && (!d || ar(a, l)?.writable)) {
          u === void 0 && (u = o(() => {
            var w = d ? at(a[l]) : fe, b = /* @__PURE__ */ z(w);
            return b;
          }), n.set(l, u));
          var h = c(u);
          if (h === fe)
            return !1;
        }
        return d;
      },
      set(a, l, u, d) {
        Or(s);
        var h = n.get(l), w = l in a;
        if (r && l === "length")
          for (var b = u; b < /** @type {Source<number>} */
          h.v; b += 1) {
            var E = n.get(b + "");
            E !== void 0 ? Ht(E, fe) : b in a && (E = o(() => /* @__PURE__ */ z(fe)), n.set(b + "", E));
          }
        if (h === void 0)
          (!w || ar(a, l)?.writable) && (h = o(() => /* @__PURE__ */ z(void 0)), Ht(h, at(u)), n.set(l, h));
        else {
          w = h.v !== fe;
          var C = o(() => at(u));
          Ht(h, C);
        }
        var p = Reflect.getOwnPropertyDescriptor(a, l);
        if (p?.set && p.set.call(d, u), !w) {
          if (r && typeof l == "string") {
            var m = (
              /** @type {Source<number>} */
              n.get("length")
            ), X = Number(l);
            Number.isInteger(X) && X >= m.v && Ht(m, X + 1);
          }
          vs(s);
        }
        return !0;
      },
      ownKeys(a) {
        c(s);
        var l = Reflect.ownKeys(a).filter((h) => {
          var w = n.get(h);
          return w === void 0 || w.v !== fe;
        });
        for (var [u, d] of n)
          d.v !== fe && !(u in a) && l.push(u);
        return l;
      },
      setPrototypeOf() {
        rl();
      }
    }
  );
}
var xi, ho, po, go;
function Al() {
  if (xi === void 0) {
    xi = window, ho = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    po = ar(t, "firstChild").get, go = ar(t, "nextSibling").get, bi(e) && (e[ms] = void 0, e[zr] = null, e[xs] = void 0, e.__e = void 0), bi(n) && (n[tr] = void 0);
  }
}
function Cl(e) {
  return document.createTextNode(e);
}
function pn() {
  return document.createTextNode("");
}
// @__NO_SIDE_EFFECTS__
function ct(e) {
  return (
    /** @type {TemplateNode | null} */
    po.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function kr(e) {
  return (
    /** @type {TemplateNode | null} */
    go.call(e)
  );
}
function N(e, t) {
  return /* @__PURE__ */ ct(e);
}
function Xt(e, t = !1) {
  {
    var n = /* @__PURE__ */ ct(e);
    return Ll(n) && mo(n) === "" ? /* @__PURE__ */ kr(n) : n;
  }
}
function me(e, t = !1) {
  return /* @__PURE__ */ ct(e);
}
function L(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ kr(r);
  return r;
}
function Ml(e) {
  e.textContent = "";
}
function _o() {
  if (qt === null) return !1;
  var e = (
    /** @type {Effect} */
    j.f
  );
  return (e & Bt) !== 0;
}
function Ws(e, t, n) {
  return t == null || t === Yi ? (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElement(e)
  ) : (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t, e)
  );
}
function Hn() {
  return document.createDocumentFragment();
}
function Il(e = "") {
  return document.createComment(e);
}
function Pl(e, t, n = "") {
  if (t.startsWith("xlink:")) {
    e.setAttributeNS("http://www.w3.org/1999/xlink", t, n);
    return;
  }
  return e.setAttribute(t, n);
}
function Ll(e) {
  return e instanceof Comment;
}
function bo(e) {
  return e.nodeName;
}
function Ur(e) {
  return (
    /** @type {TemplateNode | null} */
    e.lastChild
  );
}
function wo(e) {
  return (
    /** @type {TemplateNode | null} */
    e.parentNode
  );
}
function wt(e, t) {
  return e.appendChild(t);
}
function gn(e, t) {
  e.before(t);
}
function ko(e) {
  e.remove();
}
function zl(e, t) {
  return (
    /** @type {ChildNode} */
    e.removeChild(t)
  );
}
function Nl(e, t) {
  e.textContent = t;
}
function Rl(e, t) {
  e.nodeValue = t;
}
function mo(e) {
  return e.nodeValue;
}
function Ol(e, t) {
  return e.getAttribute(t);
}
function Ks(e, t) {
  e.removeAttribute(t);
}
function zs(e, t) {
  e.innerHTML = t;
}
function xo(e, t) {
  return e.cloneNode(t);
}
function Dl(e, t) {
  return document.importNode(e, t);
}
function jl(e, t, n, r) {
  e.addEventListener(t, n, r);
}
function Hl(e, t) {
  e.style.cssText = t;
}
function Fl(e, t, n) {
  e.classList.toggle(t, n);
}
function Ul(e) {
  var t = j;
  if (t === null)
    return e;
  if ((t.f & Bt) === 0 && (t.f & dn) === 0)
    throw e;
  _t(e, t);
}
function _t(e, t) {
  if (e === Vi)
    throw e;
  if (!(t !== null && (t.f & ie) !== 0)) {
    for (; t !== null; ) {
      if ((t.f & tn) !== 0 && (t.f & (ie | fr)) === 0) {
        if ((t.f & Bt) === 0)
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
function ql(e) {
  j === null && (D === null && el(), Za()), Lt && Xa();
}
function Bl(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Pt(e, t) {
  var n = j;
  n !== null && (n.f & Ae) !== 0 && (e |= Ae);
  var r = {
    ctx: Ce,
    deps: null,
    dv: null,
    edges: null,
    nodes: null,
    f: e | we | Xe,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: n,
    b: n && n.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null,
    r: Xi
  }, s = r;
  if ((e & dn) !== 0)
    cr !== null ? cr.push(r) : Vt.ensure().schedule(r, we);
  else if (t !== null) {
    try {
      Fn(r);
    } catch (o) {
      throw Fe(r), o;
    }
    s.edges === null && s.teardown === null && s.nodes === null && s.first === s.last && // either `null`, or a singular child
    (s.f & qn) === 0 && (s = s.first, (e & ut) !== 0 && (e & vn) !== 0 && s !== null && (s.f |= vn));
  }
  if (s !== null && (s.parent = n, n !== null && Bl(s, n), D !== null && (D.f & F) !== 0 && (e & Mt) === 0)) {
    var i = (
      /** @type {Derived} */
      D
    );
    (i.effects ?? (i.effects = [])).push(s);
  }
  return r;
}
function yo() {
  return D !== null && !ft;
}
function Vl(e) {
  const t = Pt(Bs, null);
  return Te(t, be), t.teardown = e, t;
}
function ir(e) {
  ql();
  var t = (
    /** @type {Effect} */
    j.f
  ), n = !D && (t & $e) !== 0 && Ce !== null && !Ce.i;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      Ce
    );
    (r.e ?? (r.e = [])).push(e);
  } else
    return Eo(e);
}
function Eo(e) {
  return Pt(dn | Da, e);
}
function Yl(e) {
  Vt.ensure();
  const t = Pt(Mt | qn, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? fn(t, () => {
      Fe(t), r(void 0);
    }) : (Fe(t), r(void 0));
  });
}
function So(e) {
  return Pt(dn, e);
}
function Gl(e) {
  return Pt(It | qn, e);
}
function Js(e, t = 0) {
  return Pt(Bs | t, e);
}
function Se(e, t = [], n = [], r = []) {
  ll(r, t, n, (s) => {
    Pt(Bs, () => {
      e(...s.map(c));
    });
  });
}
function Xr(e, t = 0) {
  var n = Pt(ut | t, e);
  return n;
}
function Ye(e) {
  return Pt($e | qn, e);
}
function To(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Lt, r = Zs, s = ue, i = D;
    Ei(!0), et(null);
    try {
      t.call(null);
    } catch (o) {
      _t(o, e.parent);
    } finally {
      Ei(n, r), Es(s), et(i);
    }
  }
}
function Qs(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    ri(n);
    var r = n.next;
    (n.f & Mt) !== 0 ? n.parent = null : Fe(n, t), n = r;
  }
}
function $l(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & $e) === 0 && Fe(t), t = n;
  }
}
function Fe(e, t = !0) {
  var n = !1;
  try {
    (t || (e.f & Oa) !== 0) && e.nodes !== null && e.nodes.end !== null && (Ao(
      e.nodes.start,
      /** @type {TemplateNode} */
      e.nodes.end
    ), n = !0), e.f |= fr, Qs(e, t && !n), si(e);
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const i of r)
        i.stop();
    To(e);
  } finally {
  }
  e.f ^= fr, e.f |= ie;
  var s = e.parent;
  s !== null && s.first !== null && Co(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.dv = e.edges = e.fn = e.nodes = e.ac = e.b = e.r = null;
}
function Ao(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ kr(e);
    ko(
      /** @type {ChildNode} */
      e
    ), e = n;
  }
}
function Co(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function fn(e, t, n = !0) {
  var r = [];
  e.f |= Vs, Mo(e, r, !0);
  var s = () => {
    n && Fe(e), t && t();
  }, i = r.length;
  if (i > 0) {
    var o = ue, a = () => {
      if (!--i) {
        var u = ue;
        try {
          o && (o.derived_cache.clear(), Es(o)), s();
        } finally {
          o && Es(u);
        }
      }
    };
    for (var l of r)
      l.out(a);
  } else
    s();
}
function Mo(e, t, n) {
  if ((e.f & Ae) === 0) {
    e.f ^= Ae;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const a of r)
        (a.is_global || n) && t.push(a);
    for (var s = e.first; s !== null; ) {
      var i = s.next;
      if ((s.f & Mt) === 0) {
        var o = (s.f & vn) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (s.f & $e) !== 0 && (e.f & ut) !== 0;
        Mo(s, t, o ? n : !1);
      }
      s = i;
    }
  }
}
function qr(e) {
  e.f &= ~Vs, Io(e, !0);
}
function Io(e, t) {
  if ((e.f & Vs) === 0 && (e.f & Ae) !== 0) {
    e.f ^= Ae, (e.f & be) === 0 && Vt.ensure().schedule(e, _e);
    for (var n = e.first; n !== null; ) {
      var r = n.next, s = (n.f & vn) !== 0 || (n.f & $e) !== 0;
      Io(n, s ? t : !1), n = r;
    }
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const o of i)
        (o.is_global || t) && o.in();
  }
}
function Xs(e, t) {
  if (e.nodes)
    try {
      for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
        var s = n === r ? null : /* @__PURE__ */ kr(n);
        wt(t, n), n = s;
      }
    } finally {
    }
}
let yi = !1;
function Wl() {
  yi || (yi = !0, jl(
    document,
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        if (!e.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            t[Nr]?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function Po(e) {
  var t = D, n = j;
  et(null), kt(null);
  try {
    return e();
  } finally {
    et(t), kt(n);
  }
}
function Kl(e, t, n, r = n) {
  e.addEventListener(t, () => Po(n));
  const s = (
    /** @type {any} */
    e[Nr]
  );
  s ? e[Nr] = () => {
    s(), r(!0);
  } : e[Nr] = () => r(!0), Wl();
}
let Lt = !1, Zs = 0;
function Ei(e, t = vr) {
  Lt = e, Zs = t;
}
let Lo = { v: void 0, wv: 0, e: !1, assigned: !1 }, D = null, ft = !1;
function et(e) {
  D = e;
}
let j = null;
function kt(e) {
  j = e;
}
let bt = null;
function Jl(e) {
  D !== null && ((D.f & ur) !== 0 || (D.f & F) !== 0) && (bt ?? (bt = /* @__PURE__ */ new Set())).add(e);
}
let se = null, Ge = 0, Ke = null;
function Ql(e) {
  Ke = e;
}
let vr = 1, rn = 0, un = rn;
function Si(e) {
  un = e;
}
function ei() {
  return ++vr;
}
function zo(e) {
  return V === null ? (Qr(e), e.wv) : (e.f & F) !== 0 ? $s(
    /** @type {Derived} */
    e
  ).wv : (V.get(e) ?? e).wv;
}
function Br(e, t) {
  if (e !== null) {
    for (var n = 0; n < t.length; n++)
      if (zo(e[n]) !== t[n]) return !1;
  }
  return !0;
}
function ti(e, t, n = null) {
  if (e !== null)
    for (var r = 0; r < e.length; r++) {
      var s = e[r];
      if ((s.f & F) === 0) {
        if (zo(s) > t) return !0;
        continue;
      }
      var i = (
        /** @type {Derived} */
        s
      );
      if (V === null ? Qr(
        /** @type {Derived} */
        s
      ) : i = $s(
        /** @type {Derived} */
        s
      ), i.wv > t) {
        var o = i === s ? (s.f & Ze) !== 0 : !("dv" in i);
        if (o) return !0;
        if (n === null)
          n = /* @__PURE__ */ new Set();
        else if (n.has(i))
          continue;
        if (ti(
          /** @type {DerivedRecord} */
          i.deps,
          t,
          n
        ))
          return !0;
        n.add(i);
      }
    }
  return !1;
}
function No(e) {
  return (e.f & (ut | It)) !== 0 && oe?.get_record(e) || e;
}
function Zr(e) {
  var t = e.f;
  if ((t & (we | _e)) === 0)
    return !1;
  if ((t & Ze) !== 0) {
    if (ti(e.deps, e.wv)) return !0;
  } else {
    if ((t & we) !== 0)
      return !0;
    var n = No(e), r = n.deps, s = n.dv;
    if (s === null) return !0;
    if (V === null)
      for (var i = 0, o = s.length; i < o; i++) {
        var a = (
          /** @type {Value[]} */
          r[i]
        );
        if (Qr(a), a.wv !== s[i]) return !0;
      }
    else if (!Br(r, s))
      return !0;
  }
  return (t & Xe) !== 0 && Te(e, be), !1;
}
function Ro(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(bt !== null && bt.has(e)))
    for (var s = 0; s < r.length; s++) {
      var i = r[s];
      (i.f & F) !== 0 ? Ro(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && M.schedule(
        /** @type {Effect} */
        i,
        n ? we : _e
      );
    }
}
let je = null;
function Yt(e) {
  e && Po(() => e.abort(ys));
}
function Vr(e, t, n = !1) {
  if (t?.ac) {
    for (var r = De; r !== null; r = r.next)
      if (r.records?.get(e) === t && !(n && (r === oe || ni(M, r))))
        return;
    Yt(t.ac), t.ac = null;
  }
}
function Xl(e, t) {
  var n = M, r = (t & F) !== 0;
  if (!(r && Lt)) {
    var s = n === null || !n.is_fork;
    Vr(e, oe?.records?.get(e), !0), (r ? V === null || s && Ns(e) : s) && Yt(e.ac);
    for (var i = De; i !== null; i = i.next)
      ni(n, i) && Vr(e, i.records?.get(e), !0);
  }
}
function Oo(e) {
  Yt(e.ac), e.ac = je;
}
function Ns({ deps: e, dv: t }) {
  return t === null || t.some((n, r) => (
    /** @type {Value[]} */
    e[r].wv !== n
  ));
}
function ni(e, t) {
  return e !== null && !e.is_fork && !t.is_fork && t.id < e.id && (V === null || t.previous.size === 0 || e.folded.includes(t));
}
function ri(e) {
  if ((e.f & dr) === 0) return !1;
  e.f ^= dr, Yt(e.ac), e.ac = null;
  for (var t = De; t !== null; t = t.next) {
    var n = t.records?.get(e);
    n?.ac && (Yt(n.ac), n.ac = null);
  }
  return !0;
}
function Zl(e) {
  return (e & It) === 0 && (e & (ut | Bt)) !== (ut | Bt) ? !1 : oe !== null && oe === M;
}
function Do(e) {
  const t = M;
  var n = se, r = Ge, s = Ke, i = D, o = bt, a = Ce, l = ft, u = un, d = e.f;
  se = /** @type {null | Value[]} */
  null, Ge = 0, Ke = null, D = (d & ($e | Mt)) === 0 ? e : null, bt = null, Dn(e.ctx), ft = !1, un = ++rn;
  var h = je;
  je = null, (d & dr) !== 0 && Xl(e, d);
  try {
    e.f |= ur;
    var w = (
      /** @type {Function} */
      e.fn
    ), b = w();
    if (e.f |= Bt, Ti(e, d, b, !1), Qi() && Ke !== null && !ft && // bail out if the effect didn't read anything
    (se !== null || Ge > 0) && (e.f & (F | _e | we)) === 0)
      for (var E = 0; E < /** @type {Source[]} */
      Ke.length; E++)
        Ro(
          Ke[E],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (rn++, i.deps !== null)
        for (let m = 0; m < r; m += 1)
          i.deps[m].rv = rn;
      if (n !== null)
        for (const m of n)
          m.rv = rn;
      Ke !== null && (s === null ? s = Ke : s.push(.../** @type {Source[]} */
      Ke));
    }
    return b;
  } catch (m) {
    var C = m;
    try {
      C = Ul(m);
    } finally {
      Ti(e, d, C, C === m);
    }
    return C;
  } finally {
    var p = (
      /** @type {AbortController | null} */
      je?.signal
    );
    t !== null && p !== void 0 && p.addEventListener("abort", () => {
      if (M !== null) {
        const m = jn(t);
        m !== M && m.linked && !m.is_fork && M.merge_requests.add(m);
      }
    }), e.f ^= ur, se = n, Ge = r, Ke = s, D = i, bt = o, Dn(a), ft = l, un = u, je = h;
  }
}
function Ti(e, t, n, r) {
  var s = e.deps, i = Ge + (se === null ? 0 : se.length), o = e.dv;
  if ((e.f & ie) !== 0) {
    Yt(je);
    return;
  }
  if (je !== null && (e.f & dr) === 0 && (Yt(je), je = null), (t & F) !== 0 && Lt) {
    for (var a = 0, l = 0; l < i; l++) {
      var u = l < Ge ? (
        /** @type {Value[]} */
        s[l]
      ) : (
        /** @type {Value[]} */
        se[l - Ge]
      );
      a = Math.max(a, Yo(u));
    }
    Lo = { v: n, wv: a, e: r, assigned: (t & Ze) !== 0 };
    return;
  }
  if ((t & F) !== 0 && V === null && De !== null && De.next !== null && Ho(
    /** @type {Derived} */
    e,
    t
  ), se === null && V === null && o !== null && i === s?.length && e.edges === s && (t & (ut | It)) === 0) {
    for (var d = 0; d < i; d++) o[d] = s[d].wv;
    o.length !== i && (o.length = i), (t & F) !== 0 && jo(
      /** @type {Derived} */
      e,
      n,
      r
    ), (e.ac || je) && Oo(e);
    return;
  }
  ec(e, t, i, n, r);
}
function jo(e, t, n) {
  var r = e.f & ~Ze;
  (n || (r & He) !== 0 || !e.equals(t)) && (e.v = t, e.wv = ei(), r = n ? r | He : r & ~He), e.f = r, wr(e);
}
function ec(e, t, n, r, s) {
  var i = Zl(t);
  if (V !== null && (t & F) !== 0) {
    var o = V.get(
      /** @type {Derived} */
      e
    );
    o !== void 0 && o.wv !== /** @type {Derived} */
    e.wv && (i = !0);
  }
  var a = e.deps, l = a;
  (se !== null || Ge !== a?.length) && (l = Ge === 0 ? se : (
    /** @type {Value[]} */
    a.slice(0, Ge).concat(se ?? [])
  ));
  for (var u = !i && V === null && e.dv !== null ? e.dv : [], d = 0; d < n; d++) {
    var h = (
      /** @type {Value[]} */
      l[d]
    );
    u[d] = tc(h), V !== null && (t & F) !== 0 && (u[d] !== h.wv || (h.f & (F | be)) === F) && (i = !0);
  }
  u.length !== n && (u.length = n), !i && V !== null && (t & F) !== 0 && Ho(
    /** @type {Derived} */
    e,
    t
  );
  var w = i || Uo(e), b = yo() && (e.f & Xe) !== 0, E = e.edges;
  if (w && E !== null) {
    if (se !== null) {
      e.edges = E = E.slice();
      for (h of se)
        Un.call(E, h) || (E.push(h), b && (h.reactions ?? (h.reactions = [])).push(e));
    }
  } else {
    if (E === a) {
      if (E !== null)
        for (d = Ge; d < E.length; d++) Yr(e, E[d]);
      if (b && se !== null)
        for (h of se) (h.reactions ?? (h.reactions = [])).push(e);
    } else {
      var C = new Set(l);
      for (
        h of
        /** @type {Value[]} */
        E
      )
        C.delete(h) || Yr(e, h);
      if (b)
        for (h of C) (h.reactions ?? (h.reactions = [])).push(e);
    }
    e.edges = l;
  }
  if (i) {
    var p = (
      /** @type {Batch} */
      oe
    );
    (p.records ?? (p.records = /* @__PURE__ */ new Map())).set(
      e,
      (t & F) !== 0 ? {
        deps: l,
        dv: u,
        v: r,
        e: s,
        wv: nc(
          /** @type {Derived} */
          e,
          p,
          r,
          s
        ),
        ac: je
      } : { deps: l, dv: u, ac: je }
    );
  } else
    e.deps = l, e.dv = u, (e.ac || je) && Oo(e), (t & F) !== 0 && (jo(
      /** @type {Derived} */
      e,
      r,
      s
    ), oe?.records?.delete(e));
}
function Ho(e, t) {
  var n = e.dv;
  if (
    // no valid run, or one that doesn't depend on anything — which is only run again if it was invalidated
    !(n === null || n.length === 0 || // an assigned value isn't a run, see `get_view`
    (t & Ze) !== 0)
  ) {
    for (var r, s = e.ac, i = s !== null && M !== null && M.is_fork && !s.signal.aborted, o = De; o !== null; o = o.next)
      o !== oe && !o.records?.has(e) && // otherwise, the run's signal was aborted when the derived ran again, or is about to be (see `set_global_signal`)
      (s === null || i || ni(M, o)) && (r ?? (r = {
        deps: e.deps,
        dv: n.slice(),
        v: e.v,
        wv: e.wv,
        e: (t & He) !== 0
      }), (o.records ?? (o.records = /* @__PURE__ */ new Map())).set(e, r));
    i && r !== void 0 && (r.ac = s, e.ac = null);
  }
}
function tc(e) {
  if (V === null) return e.wv;
  if ((e.f & F) !== 0) {
    var t = (
      /** @type {Map<Derived, Derived | DerivedRecord | BatchValue>} */
      lt
    );
    return t.get(
      /** @type {Derived} */
      e
    )?.wv ?? -1;
  }
  return (V.get(e) ?? e).wv;
}
function nc(e, t, n, r) {
  if (!r) {
    var s = (
      /** @type {DerivedRecord | undefined} */
      t.get_record(e)
    );
    if (s !== void 0 && !s.e && e.equals.call(s, n))
      return s.wv;
    if ((e.f & He) === 0 && e.equals(n)) return e.wv;
  }
  return ei();
}
function Fo(e, t) {
  if (e.deps = t.deps, e.dv = (e.f & F) !== 0 ? t.dv.slice() : t.dv, (e.f & F) !== 0) {
    var n = (
      /** @type {Derived} */
      e
    );
    n.v = t.v, n.wv = /** @type {number} */
    t.wv, n.f = (t.e ? n.f | He : n.f & ~He) & ~Ze, wr(n);
  }
  Yt(e.ac), e.ac = t.ac ?? null, t.ac = null;
}
function Uo(e) {
  for (var t = De; t !== null; t = t.next)
    if (t.records?.has(e)) return !0;
  return !1;
}
function rc(e) {
  var t = e.edges, n = e.deps;
  if (!(t === n || Uo(e))) {
    for (
      var r of
      /** @type {Value[]} */
      t
    )
      (n === null || !Un.call(n, r)) && Yr(e, r);
    e.edges = n;
  }
}
function qo(e, t) {
  var n = e.reactions ?? (e.reactions = []);
  Un.call(n, t) || n.push(t);
}
function Yr(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = Ma.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? n = t.reactions = null : (n[r] = n[s], n.pop());
    }
  }
  if (n === null && (t.f & F) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (se === null || !Un.call(se, t))) {
    var i = (
      /** @type {Derived} */
      t
    );
    if ((i.f & Xe) !== 0 && (i.f ^= Xe, lt?.delete(i)), i.v !== fe && wr(i), ri(i)) {
      Te(i, we), i.dv = null;
      for (var o = De; o !== null; o = o.next) o.records?.delete(i);
      lt?.delete(i);
    }
    pl(i), si(i);
  }
}
function si(e) {
  var t = e.edges;
  if (t !== null)
    for (var n = 0; n < t.length; n++)
      Yr(e, t[n]);
}
function Fn(e) {
  var t = e.f;
  if ((t & ie) === 0) {
    Te(e, be);
    var n = j;
    j = e;
    try {
      (t & (ut | Ra)) !== 0 ? $l(e) : Qs(e), To(e);
      var r = Do(e);
      e.teardown = typeof r == "function" ? r : null, e.wv = vr;
      var s;
    } finally {
      j = n;
    }
  }
}
async function In() {
  await Promise.resolve(), bl();
}
function c(e) {
  var t = e.f, n = (t & F) !== 0, r = null;
  if (D !== null && !ft) {
    var s = j !== null && (j.f & ie) !== 0;
    if (!s && (bt === null || !bt.has(e))) {
      var i = D.deps;
      if ((D.f & ur) !== 0)
        e.rv < rn && (e.rv = rn, se === null && i !== null && i[Ge] === e ? Ge++ : se === null ? se = [e] : se.push(e));
      else {
        r = D;
        var o = D.edges;
        (o === null || !Un.call(o, e)) && (D.edges = o === null ? [e] : [...o, e]), qo(e, D);
      }
    }
  }
  if (Lt) {
    var a = Vo(e);
    if (a !== void 0) {
      if (a.e) throw a.v;
      return a.v;
    }
  }
  var l;
  if (n) {
    var u = (
      /** @type {Derived} */
      e
    ), d = (u.f & Xe) === 0 && !ft && D !== null && (D.f & Xe) !== 0, h = (u.f & Bt) === 0;
    d && (u.f |= Xe), V !== null ? l = $s(u) : Qr(u), d && !h && (no(u), Bo(u));
  } else V !== null && (l = V.get(e));
  if (r !== null && sc(r, e, l === void 0 ? e.wv : l.wv), l !== void 0 && l !== e) {
    if (l.e) throw l.v;
    return l.v;
  }
  if ((e.f & He) !== 0)
    throw e.v;
  return e.v;
}
function sc(e, t, n) {
  var r = No(e), s = r.deps;
  r.dv !== null && (s === null || !Un.call(s, t)) && (r.deps = s === null ? [t] : [...s, t], r.dv.push(n));
}
function Bo(e) {
  if (e.f |= Xe, e.edges !== null)
    for (const t of e.edges)
      qo(t, e), (t.f & F) !== 0 && (t.f & Xe) === 0 && (no(
        /** @type {Derived} */
        t
      ), Bo(
        /** @type {Derived} */
        t
      ));
}
function Vo(e) {
  var t = e.wv > Zs ? void 0 : ue?.reverted_values.get(e);
  if ((e.f & F) === 0) return t;
  var n = (
    /** @type {Derived} */
    e
  ), r = (ue ?? jr()).derived_cache, s = r.get(n);
  if (s !== void 0) return s;
  var i = t ?? V?.get(n), o = i === void 0 ? (n.f & Ze) !== 0 : i.assigned, a = i === void 0 && !o ? n.dv : null, l = n.deps ?? [], u = o || a !== null, d = a?.length ?? l.length;
  i ?? (i = {
    v: n.v,
    wv: n.wv,
    e: (n.f & He) !== 0,
    assigned: (n.f & Ze) !== 0
  });
  for (var h = 0; u && h < d; h++) {
    var w = Yo(l[h]);
    u = a === null ? w <= i.wv : w === a[h];
  }
  return u ? s = i : (Jr(n), s = Lo, i.wv < s.wv && !i.e && !s.e && n.equals.call(i, s.v) && (s.wv = i.wv)), r.set(n, s), s;
}
function Yo(e) {
  return (Vo(e) ?? V?.get(e) ?? e).wv;
}
function mr(e) {
  var t = ft;
  try {
    return ft = !0, e();
  } finally {
    ft = t;
  }
}
const ic = ["touchstart", "touchmove"];
function oc(e) {
  return ic.includes(e);
}
const sn = Symbol("events"), hs = Symbol("propagation stopped at"), Go = /* @__PURE__ */ new Set(), Rs = /* @__PURE__ */ new Set();
function ce(e, t, n) {
  (t[sn] ?? (t[sn] = {}))[e] = n;
}
function ac(e) {
  for (var t = 0; t < e.length; t++)
    Go.add(e[t]);
  for (var n of Rs)
    n(e);
}
const Ir = /* @__PURE__ */ new Map();
function lc(e) {
  var t = /* @__PURE__ */ new Set(), n = (r) => {
    for (var s = 0; s < r.length; s++) {
      var i = r[s];
      if (!t.has(i)) {
        t.add(i);
        var o = oc(i);
        for (const u of [e, document]) {
          var a = Ir.get(u);
          a === void 0 && (a = /* @__PURE__ */ new Map(), Ir.set(u, a));
          var l = a.get(i);
          l === void 0 ? (u.addEventListener(i, Ai, { passive: o }), a.set(i, 1)) : a.set(i, l + 1);
        }
      }
    }
  };
  return n(Kr(Go)), Rs.add(n), () => {
    for (var r of t)
      for (const o of [e, document]) {
        var s = (
          /** @type {Map<string, number>} */
          Ir.get(o)
        ), i = (
          /** @type {number} */
          s.get(r)
        );
        --i == 0 ? (o.removeEventListener(r, Ai), s.delete(r), s.size === 0 && Ir.delete(o)) : s.set(r, i);
      }
    Rs.delete(n);
  };
}
let ps = null, gs = !1;
function Ai(e) {
  var t = this, n = e.cancelBubble;
  if (!(n && e[hs] === t)) {
    n || delete e[hs];
    var r = (
      /** @type {Node} */
      t.ownerDocument
    ), s = e.type, i = e.composedPath?.() || [], o = (
      /** @type {null | Element} */
      i[0] || e.target
    );
    ps = e, gs || (gs = !0, setTimeout(() => {
      gs = !1, ps = null;
    }));
    var a = 0, l = ps === e && e[sn];
    if (l) {
      var u = i.indexOf(l);
      if (u !== -1 && (t === document || t === /** @type {any} */
      window)) {
        e[sn] = t;
        return;
      }
      var d = i.indexOf(t);
      if (d === -1)
        return;
      u <= d && (a = u);
    }
    if (o = /** @type {Element} */
    i[a] || e.target, o !== t) {
      Hi(e, "currentTarget", {
        configurable: !0,
        get() {
          return o || r;
        }
      });
      var h = D, w = j;
      et(null), kt(null);
      try {
        for (var b, E = []; o !== null && o !== t; ) {
          try {
            var C = o[sn]?.[s];
            C != null && (!/** @type {any} */
            o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
            // -> the target could not have been disabled because it emits the event in the first place
            e.target === o) && C.call(o, e);
          } catch (p) {
            b ? E.push(p) : b = p;
          }
          if (e.cancelBubble) {
            n || (e[hs] = t);
            break;
          }
          a++, o = a < i.length ? (
            /** @type {Element} */
            i[a]
          ) : null;
        }
        if (b) {
          for (let p of E)
            queueMicrotask(() => {
              throw p;
            });
          throw b;
        }
      } finally {
        e[sn] = t, delete e.currentTarget, et(h), kt(w);
      }
    }
  }
}
const cc = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function fc(e) {
  return (
    /** @type {string} */
    cc?.createHTML(e) ?? e
  );
}
function $o(e) {
  var t = Ws("template");
  return zs(t, fc(e.replaceAll("<!>", "<!---->"))), t.content;
}
function _n(e, t) {
  var n = (
    /** @type {Effect} */
    j
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function U(e, t) {
  var n = (t & Ba) !== 0, r = (t & Va) !== 0, s, i = !e.startsWith("<!>");
  return () => {
    s === void 0 && (s = $o(i ? e : "<!>" + e), n || (s = /** @type {TemplateNode} */
    /* @__PURE__ */ ct(s)));
    var o = (
      /** @type {TemplateNode} */
      r || ho ? Dl(s, !0) : xo(s, !0)
    );
    if (n) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ ct(o)
      ), l = (
        /** @type {TemplateNode} */
        Ur(o)
      );
      _n(a, l);
    } else
      _n(o, o);
    return o;
  };
}
// @__NO_SIDE_EFFECTS__
function uc(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), s = `<${n}>${r ? e : "<!>" + e}</${n}>`, i;
  return () => {
    if (!i) {
      var o = (
        /** @type {DocumentFragment} */
        $o(s)
      ), a = (
        /** @type {Element} */
        /* @__PURE__ */ ct(o)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ ct(a);
    }
    var l = (
      /** @type {TemplateNode} */
      xo(i, !0)
    );
    return _n(l, l), l;
  };
}
// @__NO_SIDE_EFFECTS__
function es(e, t) {
  return /* @__PURE__ */ uc(e, t, "svg");
}
function Tn(e = "") {
  {
    var t = Cl(e + "");
    return _n(t, t), t;
  }
}
function An() {
  var e = Hn(), t = Il(""), n = pn();
  return wt(e, t), wt(e, n), _n(t, n), e;
}
function A(e, t) {
  e !== null && gn(
    e,
    /** @type {Node} */
    t
  );
}
function Wo(e) {
  let t = 0, n = hn(0), r;
  return () => {
    yo() && (c(n), Js(() => (t === 0 && (r = mr(() => e(() => mi(n)))), t += 1, () => {
      Ct(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, mi(n));
      });
    })));
  };
}
var dc = vn | qn;
function vc(e, t, n, r) {
  new hc(e, t, n, r);
}
var Je, qs, Qe, an, ye, Oe, ze, Ve, Tt, ln, Rn, On, it, At, $r, $, pc, gc, Os, Et, _c, Ds, Dr, js;
class hc {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, s) {
    R(this, $);
    /** @type {Boundary | null} */
    le(this, "parent");
    le(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    le(this, "transform_error");
    /** @type {TemplateNode} */
    R(this, Je);
    /** @type {TemplateNode | null} */
    R(this, qs, null);
    /** @type {BoundaryProps} */
    R(this, Qe);
    /** @type {((anchor: Node) => void)} */
    R(this, an);
    /** @type {Effect} */
    R(this, ye);
    /** @type {Effect | null} */
    R(this, Oe, null);
    /** @type {Effect | null} */
    R(this, ze, null);
    /** @type {Effect | null} */
    R(this, Ve, null);
    /** @type {DocumentFragment | null} */
    R(this, Tt, null);
    R(this, ln, 0);
    R(this, Rn, !1);
    /**
     * User effects created inside this boundary. They will run when the boundary is revealed
     * @type {Effect[]}
     */
    R(this, On, []);
    /**
     * Async effects that are currently in flight, grouped by the batch that started them.
     * A speculative fork's work must not hold up the real world's boundary.
     * @type {Map<Batch, Map<Effect, number>>}
     */
    R(this, it, /* @__PURE__ */ new Map());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    R(this, At, null);
    R(this, $r, Wo(() => (O(this, At, hn(f(this, ln))), () => {
      O(this, At, null);
    })));
    O(this, Je, t), O(this, Qe, n), O(this, an, (i) => {
      var o = (
        /** @type {Effect} */
        j
      );
      o.b = this, o.f |= tn, r(i);
    }), this.parent = /** @type {Effect} */
    j.b, this.transform_error = s ?? this.parent?.transform_error ?? ((i) => i), O(this, ye, Xr(() => {
      y(this, $, Ds).call(this);
    }, dc));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    f(this, On).push(t);
  }
  has_pending_snippet() {
    return !!f(this, Qe).pending;
  }
  /**
   * @param {Batch} batch
   */
  is_ready(t) {
    if (t.is_fork && f(this, it).size > 0)
      return !1;
    for (const [n, r] of f(this, it))
      if (!n.is_fork) {
        for (const s of r.keys())
          if (t.is_blocked_by(s, f(this, Oe)))
            return !1;
      }
    return !0;
  }
  /**
   * @param {Effect[]} effects
   */
  reveal(t) {
    this.is_pending = !1;
    for (const n of f(this, On))
      Te(n, we), t.push(n);
    if (f(this, On).length = 0, f(this, ze) && fn(f(this, ze), () => {
      O(this, ze, null);
    }), f(this, Tt))
      try {
        gn(f(this, Je), f(this, Tt)), O(this, Tt, null);
      } finally {
      }
  }
  /**
   * @param {Effect} effect
   * @param {Batch} batch
   */
  increment(t, n) {
    var r = f(this, it).get(n);
    r === void 0 && f(this, it).set(n, r = /* @__PURE__ */ new Map());
    var s = r.get(t) ?? 0;
    r.set(t, s + 1);
  }
  /**
   * @param {Effect} effect
   * @param {Batch} batch
   */
  decrement(t, n) {
    var r = (
      /** @type {Map<Effect, number>} */
      f(this, it).get(n)
    ), s = (
      /** @type {number} */
      r.get(t)
    );
    s === 1 ? (r.delete(t), r.size === 0 && f(this, it).delete(n), Ct(() => {
      this.is_pending && !y(this, $, Et).call(this) && Vt.ensure().schedule(f(this, ye), _e);
    })) : r.set(t, s - 1);
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary.
   * Do not call from inside the class
   * @param {1 | -1} d
   */
  update_effect_pending(t) {
    O(this, ln, f(this, ln) + t), !(!f(this, At) || f(this, Rn)) && (O(this, Rn, !0), Ct(() => {
      O(this, Rn, !1), f(this, At) && Fr(f(this, At), f(this, ln));
    }));
  }
  get_effect_pending() {
    return f(this, $r).call(this), c(
      /** @type {Source<number>} */
      f(this, At)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (t === Vi || !f(this, Qe).onerror && !f(this, Qe).failed)
      throw t;
    M?.is_fork ? (f(this, Oe) && M.skip_effect(f(this, Oe)), f(this, ze) && M.skip_effect(f(this, ze)), f(this, Ve) && M.skip_effect(f(this, Ve)), M.oncommit(() => {
      y(this, $, Et).call(this) || y(this, $, js).call(this, t);
    })) : y(this, $, js).call(this, t);
  }
}
Je = new WeakMap(), qs = new WeakMap(), Qe = new WeakMap(), an = new WeakMap(), ye = new WeakMap(), Oe = new WeakMap(), ze = new WeakMap(), Ve = new WeakMap(), Tt = new WeakMap(), ln = new WeakMap(), Rn = new WeakMap(), On = new WeakMap(), it = new WeakMap(), At = new WeakMap(), $r = new WeakMap(), $ = new WeakSet(), pc = function() {
  try {
    O(this, Oe, Ye(() => f(this, an).call(this, f(this, Je))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
gc = function(t) {
  const n = f(this, Qe).failed, { reset: r, invoke_onerror: s } = y(this, $, Os).call(this, t);
  Ct(s), n && O(this, Ve, Ye(() => {
    n(
      f(this, Je),
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
Os = function(t) {
  var n = !1, r = !1;
  const s = () => {
    if (!y(this, $, Et).call(this)) {
      if (n) {
        Wa();
        return;
      }
      n = !0, r && il(), f(this, Ve) !== null && fn(f(this, Ve), () => {
        O(this, Ve, null);
      }), y(this, $, Dr).call(this, () => {
        y(this, $, Ds).call(this);
      });
    }
  };
  return { reset: s, invoke_onerror: () => {
    if (!y(this, $, Et).call(this))
      try {
        r = !0, f(this, Qe).onerror?.(t, s), r = !1;
      } catch (o) {
        _t(o, f(this, ye) && f(this, ye).parent);
      }
  } };
}, Et = function() {
  return (f(this, ye).f & (ie | fr)) !== 0;
}, _c = function() {
  const t = f(this, Qe).pending;
  t && (this.is_pending = !0, O(this, ze, Ye(() => t(f(this, Je)))), Ct(() => {
    if (!y(this, $, Et).call(this))
      try {
        var n = O(this, Tt, Hn()), r = pn();
        wt(n, r), O(this, Oe, y(this, $, Dr).call(this, () => {
          try {
            return Ye(() => f(this, an).call(this, r));
          } catch (s) {
            try {
              this.error(s);
            } catch (i) {
              _t(i, f(this, ye).parent);
            }
            return null;
          }
        })), f(this, Oe) !== null && f(this, it).size === 0 && (this.is_pending = !1, gn(f(this, Je), n), O(this, Tt, null), fn(
          /** @type {Effect} */
          f(this, ze),
          () => {
            O(this, ze, null);
          }
        ));
      } finally {
      }
  }));
}, Ds = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), O(this, ln, 0), O(this, Oe, Ye(() => {
      f(this, an).call(this, f(this, Je));
    })), f(this, it).size === 0)
      this.is_pending = !1;
    else {
      const n = f(this, Qe).pending;
      if (n) {
        var t = O(this, Tt, Hn());
        Xs(f(this, Oe), t), O(this, ze, Ye(() => n(f(this, Je))));
      }
    }
  } catch (n) {
    this.error(n);
  }
}, /**
 * @template T
 * @param {() => T} fn
 */
Dr = function(t) {
  var n = j, r = D, s = Ce;
  kt(f(this, ye)), et(f(this, ye)), Dn(f(this, ye).ctx);
  try {
    return Vt.ensure(), t();
  } finally {
    kt(n), et(r), Dn(s);
  }
}, /**
 * @param {unknown} error
 */
js = function(t) {
  f(this, Oe) && (Fe(f(this, Oe)), O(this, Oe, null)), f(this, ze) && (Fe(f(this, ze)), O(this, ze, null)), f(this, Ve) && (Fe(f(this, Ve)), O(this, Ve, null));
  let n = f(this, Qe).failed;
  const r = (s) => {
    if (y(this, $, Et).call(this)) return;
    const { reset: i, invoke_onerror: o } = y(this, $, Os).call(this, s);
    o(), n && !y(this, $, Et).call(this) && O(this, Ve, y(this, $, Dr).call(this, () => {
      try {
        return Ye(() => {
          var a = (
            /** @type {Effect} */
            j
          );
          a.b = this, a.f |= tn, n(
            f(this, Je),
            () => s,
            () => i
          );
        });
      } catch (a) {
        return _t(
          a,
          /** @type {Effect} */
          f(this, ye).parent
        ), null;
      }
    }));
  };
  Ct(() => {
    if (!y(this, $, Et).call(this)) {
      var s;
      try {
        s = this.transform_error(t);
      } catch (i) {
        _t(i, f(this, ye) && f(this, ye).parent);
        return;
      }
      s !== null && typeof s == "object" && typeof /** @type {any} */
      s.then == "function" ? s.then(
        r,
        /** @param {unknown} e */
        (i) => _t(i, f(this, ye) && f(this, ye).parent)
      ) : r(s);
    }
  });
};
function xe(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== /** @type {any} */
  (e[tr] ?? (e[tr] = mo(e))) && (e[tr] = n, Rl(e, `${n}`));
}
function bc(e, t) {
  return wc(e, t);
}
function wc(e, t) {
  return kc(e, t);
}
function kc(e, { target: t, anchor: n, props: r = {}, events: s, context: i, intro: o = !0, transformError: a, renderer: l }) {
  var u = void 0, d = Yl(() => {
    var h = n ?? /** @type {Text} */
    wt(
      /** @type {Node} */
      t,
      pn()
    );
    vc(
      /** @type {TemplateNode} */
      h,
      {
        pending: () => {
        }
      },
      (b) => {
        Ki({});
        var E = (
          /** @type {ComponentContext} */
          Ce
        );
        i && (E.c = i), s && (r.$$events = s), u = e(b, r) || Gs(), Ji();
      },
      a
    );
    var w = l ? null : lc(
      /** @type {EventTarget} */
      t
    );
    return () => {
      if (w?.(), h !== n) {
        var b = wo(
          /** @type {Node} */
          h
        );
        b && zl(
          b,
          /** @type {ChildNode} */
          h
        );
      }
    };
  });
  return Hs.set(u, d), u;
}
let Hs = /* @__PURE__ */ new WeakMap();
function mc(e, t) {
  const n = Hs.get(e);
  return n ? (Hs.delete(e), n(t)) : Promise.resolve();
}
var pt, gt, ot, cn, gr, Wr, _r, br;
class xc {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    le(this, "anchor");
    /** @type {Map<Batch, Key>} */
    R(this, pt, /* @__PURE__ */ new Map());
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
    R(this, gt, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    R(this, ot, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    R(this, cn, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    R(this, gr, !0);
    /**
     * The renderer that was active when this BranchManager was created.
     * Needed so that #commit can push the correct renderer when doing DOM operations
     * outside of an effect context (e.g. as a batch commit callback).
     * @type {Renderer | null}
     */
    R(this, Wr, null);
    /**
     * @param {Batch} batch
     */
    R(this, _r, (t) => {
      if (f(this, pt).has(t))
        try {
          var n = (
            /** @type {Key} */
            f(this, pt).get(t)
          ), r = f(this, gt).get(n);
          if (r)
            qr(r), f(this, cn).delete(n);
          else {
            var s = f(this, ot).get(n);
            s && (qr(s.effect), f(this, gt).set(n, s.effect), f(this, ot).delete(n), ko(
              /** @type {ChildNode} */
              Ur(s.fragment)
            ), gn(this.anchor, s.fragment), r = s.effect, r.f &= ~Ne);
          }
          f(this, br).call(this, t);
          for (const [i, o] of f(this, gt)) {
            if (i === n || f(this, cn).has(i)) continue;
            const a = () => {
              if (Array.from(f(this, pt).values()).includes(i)) {
                var u = Hn();
                Xs(o, u), wt(u, pn()), f(this, ot).set(i, { effect: o, fragment: u });
              } else
                Fe(o);
              f(this, cn).delete(i), f(this, gt).delete(i);
            };
            f(this, gr) || !r ? (f(this, cn).add(i), fn(o, a, !1)) : a();
          }
        } finally {
        }
    });
    /**
     * @param {Batch} batch
     */
    R(this, br, (t) => {
      for (const r of f(this, pt).keys())
        (r === t || !r.linked) && f(this, pt).delete(r);
      const n = Array.from(f(this, pt).values());
      for (const [r, s] of f(this, ot))
        n.includes(r) || (Fe(s.effect), f(this, ot).delete(r));
    });
    this.anchor = t, O(this, gr, n), O(this, Wr, Xi);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var r = (
      /** @type {Batch} */
      M
    ), s = _o();
    if (n && !f(this, gt).has(t) && !f(this, ot).has(t))
      if (s) {
        var i = Hn(), o = pn();
        wt(i, o);
        var a = Ye(() => n(o));
        a.f |= Ne, r.unskip_new_effect(a), f(this, ot).set(t, { effect: a, fragment: i });
      } else
        f(this, gt).set(
          t,
          Ye(() => n(this.anchor))
        );
    if (f(this, pt).set(r, t), s) {
      for (const [l, u] of f(this, gt))
        l === t ? r.unskip_effect(u) : r.skip_effect(u);
      for (const [l, u] of f(this, ot))
        l === t ? r.unskip_effect(u.effect) : r.skip_effect(u.effect);
      r.oncommit(f(this, _r)), r.ondiscard(f(this, br));
    } else
      f(this, _r).call(this, r);
  }
}
pt = new WeakMap(), gt = new WeakMap(), ot = new WeakMap(), cn = new WeakMap(), gr = new WeakMap(), Wr = new WeakMap(), _r = new WeakMap(), br = new WeakMap();
function G(e, t, n = !1) {
  var r = new xc(e), s = n ? vn : 0;
  function i(o, a) {
    r.ensure(o, a);
  }
  Xr(() => {
    var o = !1;
    t((a, l = 0) => {
      o = !0, i(l, a);
    }), o || i(-1, null);
  }, s);
}
const Ci = [...` 	
\r\f \v\uFEFF`];
function yc(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (t && (r = r ? r + " " + t : t), n) {
    for (var s of Object.keys(n))
      if (n[s])
        r = r ? r + " " + s : s;
      else if (r.length)
        for (var i = s.length, o = 0; (o = r.indexOf(s, o)) >= 0; ) {
          var a = o + i;
          (o === 0 || Ci.includes(r[o - 1])) && (a === r.length || Ci.includes(r[a])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(a + 1) : o = a;
        }
  }
  return r === "" ? null : r;
}
function Ec(e, t) {
  return e == null ? null : String(e);
}
function Cn(e, t) {
  return t;
}
function Sc(e, t, n) {
  for (var r = [], s = t.length, i, o = 0; o < s; o++) {
    let d = t[o];
    fn(
      d,
      () => {
        if (i) {
          if (i.pending.delete(d), i.done.add(d), i.pending.size === 0) {
            var h = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Fs(e, Kr(i.done)), h.delete(i), h.size === 0 && (e.outrogroups = null);
          }
        } else
          r.push(d);
      },
      !1
    );
  }
  if (r.length === s) {
    var a = n !== null && e.pending.size === 0;
    if (a) {
      var l = (
        /** @type {Element} */
        n
      ), u = (
        /** @type {Element} */
        wo(l)
      );
      Ml(u), wt(u, l), e.items.clear();
    }
    Fs(e, t, !a);
  } else {
    i = {
      pending: new Set(t),
      done: new Set(r)
    };
    for (const d of r)
      i.pending.delete(d);
    (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(i);
  }
}
function Ko(e) {
  var t = /* @__PURE__ */ new Set();
  for (const n of e.pending.values())
    for (const r of n)
      t.add(
        /** @type {EachItem} */
        e.items.get(r).e
      );
  return t;
}
function Fs(e, t, n = !0) {
  for (var r = e.pending.size > 0 ? Ko(e) : void 0, s = 0; s < t.length; s++) {
    var i = t[s];
    if (r?.has(i)) {
      i.f |= Ne;
      const o = Hn();
      Xs(i, o), i !== e.effect.last && (nt(e, i.prev, i.next), nt(e, e.effect.last, i), nt(e, i, null));
    } else
      Fe(t[s], n);
  }
}
function Tc(e, t) {
  if (e.outrogroups !== null) {
    for (const n of e.outrogroups)
      if (n.pending.has(t) || n.done.has(t)) return !0;
  }
  return !1;
}
var Mi = /* @__PURE__ */ new WeakMap(), Ii = {};
function Pi() {
  var e = Mi.get(Ii);
  if (e) return e;
  var t = pn();
  return Mi.set(Ii, t), t;
}
function Mn(e, t, n, r, s, i = null) {
  var o = e, a = /* @__PURE__ */ new Map(), l = (t & Bi) !== 0;
  if (l) {
    var u = (
      /** @type {Element} */
      e
    );
    o = /** @type {Text} */
    wt(u, pn());
  }
  var d = null, h = /* @__PURE__ */ vl(() => {
    var Z = n();
    return (
      /** @type {V[]} */
      ji(Z) ? Z : Z == null ? [] : Kr(Z)
    );
  }), w = /* @__PURE__ */ new Map(), b = !0;
  function E(Z) {
    if ((X.effect.f & ie) === 0) {
      try {
        X.pending.delete(Z);
        var B = c(h);
        X.fallback = d, Ac(X, B, o, t, r), d !== null && (B.length === 0 ? (d.f & Ne) === 0 ? qr(d) : (d.f ^= Ne, or(d, null, o)) : fn(d, () => {
          d = null;
        }));
      } finally {
      }
      p();
    }
  }
  function C(Z) {
    X.pending.delete(Z), (X.effect.f & ie) === 0 && p();
  }
  function p() {
    for (var Z, B = X.effect.last; B !== null; ) {
      var ae = B.prev;
      if ((B.f & $e) !== 0 && B !== d) {
        if ((B.f & Ne) === 0) break;
        Z ?? (Z = Ko(X)), !Z.has(B) && !Tc(X, B) && Fe(B);
      }
      B = ae;
    }
  }
  var m = Xr(() => {
    for (var Z = (
      /** @type {V[]} */
      c(h)
    ), B = Z.length, ae = /* @__PURE__ */ new Set(), W = (
      /** @type {Batch} */
      M
    ), Me = _o(), Ue = 0; Ue < B; Ue += 1) {
      var zt = Z[Ue], te = r(zt, Ue), ne = b ? null : a.get(te);
      ne ? (ne.v && Fr(ne.v, zt), ne.i && Fr(ne.i, Ue), Me && W.unskip_effect(ne.e)) : (ne = Cc(
        a,
        b ? o : Pi(),
        zt,
        te,
        Ue,
        s,
        t,
        n
      ), b || (ne.e.f |= Ne, Me && W.unskip_new_effect(ne.e)), a.set(te, ne)), ae.add(te);
    }
    if (B === 0 && i && !d && (b ? d = Ye(() => i(o)) : (d = Ye(() => i(Pi())), d.f |= Ne, Me && W.unskip_new_effect(d))), Me && d !== null && (B === 0 ? W.unskip_effect(d) : W.skip_effect(d)), B > ae.size && Qa(), !b)
      if (w.set(W, ae), Me) {
        for (const [dt, bn] of a)
          ae.has(dt) || W.skip_effect(bn.e);
        W.oncommit(E), W.ondiscard(C);
      } else
        E(W);
    c(h);
  }), X = { effect: m, flags: t, items: a, pending: w, outrogroups: null, fallback: d };
  b = !1;
}
function er(e) {
  for (; e !== null && (e.f & $e) === 0; )
    e = e.next;
  return e;
}
function Ac(e, t, n, r, s) {
  var i = (r & Ua) !== 0, o = t.length, a = e.items, l = er(e.effect.first), u, d = null, h, w = [], b = [], E, C, p, m;
  if (i)
    for (m = 0; m < o; m += 1)
      E = t[m], C = s(E, m), p = /** @type {EachItem} */
      a.get(C).e, (p.f & Ne) === 0 && (p.nodes?.a?.measure(), (h ?? (h = /* @__PURE__ */ new Set())).add(p));
  for (m = 0; m < o; m += 1) {
    if (E = t[m], C = s(E, m), p = /** @type {EachItem} */
    a.get(C).e, e.outrogroups !== null)
      for (const te of e.outrogroups)
        te.pending.delete(p), te.done.delete(p);
    if ((p.f & Ae) !== 0 && (qr(p), i && (p.nodes?.a?.unfix(), (h ?? (h = /* @__PURE__ */ new Set())).delete(p))), (p.f & Ne) !== 0)
      if (p.f ^= Ne, p === l)
        or(p, null, n);
      else {
        var X = d ? d.next : l;
        p === e.effect.last && (e.effect.last = p.prev), p.prev && (p.prev.next = p.next), p.next && (p.next.prev = p.prev), nt(e, d, p), nt(e, p, X), or(p, X, n), d = p, w = [], b = [], l = er(d.next);
        continue;
      }
    if (p !== l) {
      if (u !== void 0 && u.has(p)) {
        if (w.length < b.length) {
          var Z = b[0], B;
          d = Z.prev;
          var ae = w[0], W = w[w.length - 1];
          for (B = 0; B < w.length; B += 1)
            or(w[B], Z, n);
          for (B = 0; B < b.length; B += 1)
            u.delete(b[B]);
          nt(e, ae.prev, W.next), nt(e, d, ae), nt(e, W, Z), l = Z, d = W, m -= 1, w = [], b = [];
        } else
          u.delete(p), or(p, l, n), nt(e, p.prev, p.next), nt(e, p, d === null ? e.effect.first : d.next), nt(e, d, p), d = p;
        continue;
      }
      for (w = [], b = []; l !== null && l !== p; )
        (u ?? (u = /* @__PURE__ */ new Set())).add(l), b.push(l), l = er(l.next);
      if (l === null)
        continue;
    }
    (p.f & Ne) === 0 && w.push(p), d = p, l = er(p.next);
  }
  if (e.outrogroups !== null) {
    for (const te of e.outrogroups)
      te.pending.size === 0 && (Fs(e, Kr(te.done)), e.outrogroups?.delete(te));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var Me = [];
    if (u !== void 0)
      for (p of u)
        (p.f & Ae) === 0 && Me.push(p);
    for (; l !== null; )
      (l.f & Ae) === 0 && l !== e.fallback && Me.push(l), l = er(l.next);
    var Ue = Me.length;
    if (Ue > 0) {
      var zt = (r & Bi) !== 0 && o === 0 ? n : null;
      if (i) {
        for (m = 0; m < Ue; m += 1)
          Me[m].nodes?.a?.measure();
        for (m = 0; m < Ue; m += 1)
          Me[m].nodes?.a?.fix();
      }
      Sc(e, Me, zt);
    }
  }
  i && Ct(() => {
    if (h !== void 0)
      for (p of h)
        p.nodes?.a?.apply();
  });
}
function Cc(e, t, n, r, s, i, o, a) {
  var l = (o & Ha) !== 0 ? (o & qa) === 0 ? /* @__PURE__ */ El(n, !1, !1) : hn(n) : null, u = (o & Fa) !== 0 ? hn(s) : null;
  return {
    v: l,
    i: u,
    e: Ye(() => (i(t, l ?? n, u ?? s, a), () => {
      e.delete(r);
    }))
  };
}
function or(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, s = e.nodes.end, i = t && (t.f & Ne) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var o = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ kr(r)
      );
      if (gn(i, r), r === s)
        return;
      r = o;
    }
}
function nt(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Mc(e, t, n = !1, r = !1, s = !1, i = !1, o) {
  var a = e, l = "";
  if (n)
    var u = (
      /** @type {Element} */
      e
    );
  Se(() => {
    var d = (
      /** @type {Effect} */
      j
    );
    if (l !== (l = t() ?? "")) {
      if (n) {
        d.nodes = null, zs(
          u,
          /** @type {string} */
          l
        ), l !== "" && _n(
          /** @type {TemplateNode} */
          /* @__PURE__ */ ct(u),
          /** @type {TemplateNode} */
          Ur(u)
        );
        return;
      }
      if (d.nodes !== null && (Ao(
        d.nodes.start,
        /** @type {TemplateNode} */
        d.nodes.end
      ), d.nodes = null), l !== "") {
        var h = r ? Ya : s ? Ga : void 0, w = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          Ws(r ? "svg" : s ? "math" : "template", h)
        );
        zs(
          w,
          /** @type {any} */
          l
        );
        var b = r || s ? w : (
          /** @type {HTMLTemplateElement} */
          w.content
        );
        if (_n(
          /** @type {TemplateNode} */
          /* @__PURE__ */ ct(b),
          /** @type {TemplateNode} */
          Ur(b)
        ), r || s)
          for (; /* @__PURE__ */ ct(b); )
            gn(
              a,
              /** @type {TemplateNode} */
              /* @__PURE__ */ ct(b)
            );
        else
          gn(a, b);
      }
    }
  });
}
function Ic(e, t) {
  So(() => {
    e = j?.parent?.nodes?.start ?? e;
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
    if (!/** @type {Element} */
    r.querySelector("#" + t.hash)) {
      const s = Ws("style");
      s.id = t.hash, Nl(s, t.code), wt(r, s);
    }
  });
}
function Zt(e, t, n, r, s, i) {
  var o = (
    /** @type {any} */
    e[ms]
  );
  if (o !== n || o === void 0 || // for edge case of `class={undefined}`
  // custom renderers only deal in attributes, so rather than toggling individual classes
  // (which would mean editing the `class` attribute), always set the whole thing
  Ys) {
    var a = yc(n, r, i);
    a == null ? Ks(e, "class") : e.className = a, e[ms] = n;
  } else if (i && s !== i)
    for (var l in i) {
      var u = !!i[l];
      (s == null || u !== !!s[l]) && Fl(
        /** @type {HTMLElement} */
        e,
        l,
        u
      );
    }
  return i;
}
function Li(e, t, n, r) {
  var s = (
    /** @type {any} */
    e[xs]
  );
  if (s !== t || Ys) {
    var i = Ec(t);
    i == null ? Ks(e, "style") : Hl(
      /** @type {HTMLElement} */
      e,
      i
    ), e[xs] = t;
  }
  return r;
}
const Pc = Symbol("is custom element"), Lc = Symbol("is html");
function Pr(e, t, n, r) {
  var s = zc(e), i = s[t];
  i !== (s[t] = n) && (t === "loading" && (e[ja] = n), n == null ? Ks(e, t) : typeof n != "string" && Nc(e).has(t) ? e[t] = n : Pl(e, t, n));
}
function zc(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    e[zr] ?? (e[zr] = {
      [Pc]: bo(e).includes("-"),
      [Lc]: e.namespaceURI === Yi
    })
  );
}
var zi = /* @__PURE__ */ new Map();
function Nc(e) {
  var t = Ol(e, "is"), n = t || bo(e), r = zi.get(n);
  if (r) return r;
  r = /* @__PURE__ */ new Set(), (!customElements || !(t || n.includes("-")) || customElements.get(t || n.toLowerCase())) && zi.set(n, r);
  for (var s, i = e, o = Element.prototype; o !== i; ) {
    s = Ia(i);
    for (var a in s)
      s[a].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      a !== "innerHTML" && a !== "textContent" && a !== "innerText" && r.add(a);
    i = Fi(i);
  }
  return r;
}
function Rc(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet();
  Kl(e, "input", async (s) => {
    var i = s ? e.defaultValue : e.value;
    if (i = _s(e) ? bs(i) : i, n(i), M !== null && r.add(M), await In(), i !== (i = t())) {
      var o = e.selectionStart, a = e.selectionEnd, l = e.value.length;
      if (e.value = i ?? "", a !== null) {
        var u = e.value.length;
        o === a && a === l && u > l ? (e.selectionStart = u, e.selectionEnd = u) : (e.selectionStart = o, e.selectionEnd = Math.min(a, u));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  mr(t) == null && e.value && (n(_s(e) ? bs(e.value) : e.value), M !== null && r.add(M)), Js(() => {
    var s = t();
    e === document.activeElement && r.has(
      /** @type {Batch} */
      oe
    ) || _s(e) && s === bs(e.value) || e.type === "date" && !s && !e.value || s !== e.value && (e.value = s ?? "");
  });
}
function _s(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function bs(e) {
  return e === "" ? null : +e;
}
function ws(e, t) {
  return e === t || e?.[Lr] === t;
}
function ks(e = Gs(), t, n, r) {
  var s = (
    /** @type {ComponentContext} */
    Ce.r
  ), i = (
    /** @type {Effect} */
    j
  );
  return So(() => {
    var o, a;
    return Js(() => {
      o = a, a = [], mr(() => {
        ws(n(...a), e) || (t(e, ...a), o && ws(n(...o), e) && t(null, ...o));
      });
    }), () => {
      let l = i;
      for (; l !== s && l.parent !== null && l.parent.f & fr; )
        l = l.parent;
      const u = () => {
        a && ws(n(...a), e) && t(null, ...a);
      }, d = l.teardown;
      l.teardown = () => {
        u(), d?.();
      };
    };
  }), e;
}
function Oc(e) {
  Ce === null && Ja(), ir(() => {
    const t = mr(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
Al();
const Dc = "5";
var Di;
typeof window < "u" && ((Di = globalThis.__svelte ?? (globalThis.__svelte = {})).v ?? (Di.v = /* @__PURE__ */ new Set())).add(Dc);
const jc = "1.0.23", Hc = "Ask questions about your realm — its governance, proposals, rules, and more — and get answers from an AI assistant in chat.", Fc = "Answers are written by an AI and can be wrong", Uc = {
  ai_answers_can_be_wrong: Fc
};
function qc(e, t = {}) {
  return e.replace(
    /\{(\w+)\}/g,
    (n, r) => t[r] != null ? String(t[r]) : `{${r}}`
  );
}
function Bc(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e)) return null;
  const n = e, r = n.extensions;
  if (r && typeof r == "object" && !Array.isArray(r)) {
    const s = r[t];
    if (s && typeof s == "object" && !Array.isArray(s))
      return s;
  }
  return n;
}
function Vc(e) {
  const t = { ...e.fallback };
  let n = { ...t };
  const { extensionId: r, version: s } = e;
  function i(a, l) {
    const u = n[a] ?? t[a] ?? a;
    return l ? qc(u, l) : u;
  }
  async function o(a) {
    const l = (a || "en").trim() || "en", u = [`/ext/${r}/${s}/frontend/i18n/${l}.json`];
    l !== "en" && u.push(`/ext/${r}/${s}/frontend/i18n/en.json`);
    for (const d of u)
      try {
        const h = await fetch(d);
        if (!h.ok) continue;
        const w = Bc(await h.json(), r);
        if (w) {
          n = { ...t, ...w };
          return;
        }
      } catch {
      }
    n = { ...t };
  }
  return { t: i, load: o };
}
const Jo = Vc({
  extensionId: "llm_chat",
  version: jc,
  fallback: Uc
});
let Us = () => {
};
const Yc = Wo((e) => (Us = e, () => {
  Us = () => {
  };
}));
function Gc(e, t) {
  return Yc(), Jo.t(e, t);
}
async function Ni(e) {
  await Jo.load(e), Us();
}
var $c = /* @__PURE__ */ U('<button><span class="settings-assistant-emoji svelte-beco3k"> </span> <span class="settings-assistant-name svelte-beco3k"> </span></button>'), Wc = /* @__PURE__ */ U('<div class="settings-assistant-grid svelte-beco3k"></div>'), Kc = /* @__PURE__ */ U('<p class="settings-section-desc svelte-beco3k">Loading assistants…</p>'), Jc = /* @__PURE__ */ U('<div class="settings-history-item svelte-beco3k"><div class="settings-history-body svelte-beco3k"><div class="settings-history-title svelte-beco3k"> </div> <div class="settings-history-meta svelte-beco3k"> </div></div> <button class="settings-history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), Qc = /* @__PURE__ */ U('<div class="settings-history-list svelte-beco3k"></div>'), Xc = /* @__PURE__ */ U('<p class="settings-section-desc svelte-beco3k"> </p>'), Zc = /* @__PURE__ */ U('<section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Conversation history</h2> <!> <button class="settings-danger-btn svelte-beco3k"><!></button></section>'), ef = /* @__PURE__ */ U(`<div class="settings-page svelte-beco3k"><h1 class="settings-title svelte-beco3k">AI Assistant — Settings</h1> <p class="settings-page-desc svelte-beco3k"> </p> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Default assistant</h2> <p class="settings-section-desc svelte-beco3k">Which persona opens when you start a new conversation.</p> <!></section> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">Preferences</h2> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Show suggestion chips</span> <span class="settings-toggle-desc svelte-beco3k">Display quick-reply suggestions after each response.</span></div> <button role="switch" aria-label="Show suggestion chips"></button></div> <div class="settings-toggle svelte-beco3k"><div class="settings-toggle-info svelte-beco3k"><span class="settings-toggle-label svelte-beco3k">Share page context</span> <span class="settings-toggle-desc svelte-beco3k">Send the current page you're viewing as context to the assistant.</span></div> <button role="switch" aria-label="Share page context"></button></div></section> <!> <section class="settings-section svelte-beco3k"><h2 class="settings-section-title svelte-beco3k">About</h2> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">Extension version</span> <span class="settings-about-value svelte-beco3k">1.0.1</span></div> <div class="settings-about-row svelte-beco3k"><span class="settings-about-label svelte-beco3k">API status</span> <span><!></span></div> <button class="settings-link-btn svelte-beco3k">Check again</button></section></div>`), tf = /* @__PURE__ */ U('<div class="chat-toolbar svelte-beco3k"><button class="toolbar-btn svelte-beco3k" title="New conversation"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">New chat</span></button> <button title="Conversation history"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" class="svelte-beco3k"></circle><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg> <span class="svelte-beco3k">History</span></button></div>'), nf = /* @__PURE__ */ U('<div class="focus-chip svelte-beco3k"><span class="focus-chip-label svelte-beco3k"> </span> <button class="focus-chip-btn svelte-beco3k" title="Explain current selection">Explain this</button></div>'), rf = /* @__PURE__ */ U('<button><span class="text-lg svelte-beco3k"> </span> <span class="text-sm font-medium svelte-beco3k"> </span></button>'), sf = /* @__PURE__ */ U('<div class="assistant-selector svelte-beco3k"></div>'), of = /* @__PURE__ */ U('<div class="history-loading svelte-beco3k">Loading conversations…</div>'), af = /* @__PURE__ */ U('<div class="history-empty svelte-beco3k">No past conversations yet. Start chatting!</div>'), lf = /* @__PURE__ */ U('<div class="history-item svelte-beco3k" role="button" tabindex="0"><div class="history-item-body svelte-beco3k"><div class="history-title svelte-beco3k"> </div> <div class="history-meta svelte-beco3k"> </div></div> <button class="history-delete svelte-beco3k" title="Delete"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg></button></div>'), cf = /* @__PURE__ */ U('<div class="history-panel svelte-beco3k"><!></div>'), ff = /* @__PURE__ */ U(`<p class="svelte-beco3k">Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>`), uf = /* @__PURE__ */ U(`<p class="svelte-beco3k">Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>`), df = /* @__PURE__ */ U('<div class="welcome-message svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!></div></div>'), Ri = /* @__PURE__ */ es('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-beco3k"></path></svg>'), Oi = /* @__PURE__ */ es('<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-beco3k"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" class="svelte-beco3k"></rect><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-beco3k"></path></svg>'), vf = /* @__PURE__ */ U('<div class="message-row user-row svelte-beco3k"><div class="user-message-wrap svelte-beco3k"><button class="copy-btn svelte-beco3k" title="Copy"><!></button> <div class="bubble user-bubble svelte-beco3k"> </div></div></div>'), hf = /* @__PURE__ */ U('<details class="thinking-block svelte-beco3k"><summary class="svelte-beco3k">Reasoning</summary> <div class="thinking-text svelte-beco3k"> </div></details>'), pf = /* @__PURE__ */ U('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-message-wrap svelte-beco3k"><div class="assistant-content markdown-content svelte-beco3k"><!> <!></div> <button class="copy-btn copy-btn--assistant svelte-beco3k" title="Copy"><!></button></div></div>'), gf = /* @__PURE__ */ U('<p class="explain-wait svelte-beco3k">Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.</p>'), _f = /* @__PURE__ */ U('<p class="explain-wait svelte-beco3k">Awakening the AI assistant. This may take a few minutes.</p>'), bf = /* @__PURE__ */ U('<p class="stream-status svelte-beco3k"> </p>'), wf = /* @__PURE__ */ U('<div class="typing-animation svelte-beco3k"><span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span> <span class="svelte-beco3k"></span></div>'), kf = /* @__PURE__ */ U('<div class="message-row assistant-row svelte-beco3k"><div class="assistant-content svelte-beco3k"><!> <!> <!></div></div>'), mf = /* @__PURE__ */ U('<div class="error-banner svelte-beco3k"><span class="svelte-beco3k"> </span> <button class="error-dismiss svelte-beco3k" title="Dismiss">&times;</button></div>'), xf = /* @__PURE__ */ U("<!> <!> <!>", 1), yf = /* @__PURE__ */ U('<span class="suggestion-loading svelte-beco3k">Loading suggestions...</span>'), Ef = /* @__PURE__ */ U('<button class="suggestion-chip svelte-beco3k"> </button>'), Sf = /* @__PURE__ */ U('<div class="suggestions svelte-beco3k"><!></div>'), Tf = /* @__PURE__ */ es('<svg class="animate-spin h-5 w-5 svelte-beco3k" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-beco3k" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-beco3k" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'), Af = /* @__PURE__ */ es('<svg class="h-5 w-5 svelte-beco3k" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-beco3k"></path></svg>'), Cf = /* @__PURE__ */ U('<div><!> <!> <!> <!> <div class="messages-area svelte-beco3k"><!></div> <div class="input-section svelte-beco3k"><!> <div class="input-row svelte-beco3k"><textarea class="chat-input svelte-beco3k" placeholder="Type a message..." rows="1"></textarea> <button class="send-btn svelte-beco3k" title="Send message (Enter)"><!></button></div> <p class="ai-notice svelte-beco3k"> </p></div></div>');
const Mf = {
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

	/* Input section */.input-section.svelte-beco3k {flex-shrink:0;padding:10px 14px;padding-bottom:max(10px, env(safe-area-inset-bottom, 0px));border-top:1px solid #e5e7eb;background:#fff;}.suggestions.svelte-beco3k {display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;justify-content:center;}.suggestion-loading.svelte-beco3k {font-size:12px;color:#9ca3af;}.suggestion-chip.svelte-beco3k {padding:5px 12px;font-size:12px;border-radius:16px;border:1px solid #e5e7eb;background:#f9fafb;color:#4b5563;cursor:pointer;transition:all 0.15s ease;white-space:nowrap;}.suggestion-chip.svelte-beco3k:hover {background:#eef2ff;border-color:#c7d2fe;color:#4338ca;}.input-row.svelte-beco3k {display:flex;gap:8px;align-items:flex-end;}.ai-notice.svelte-beco3k {margin:6px 0 0;font-size:0.75rem;line-height:1.3;color:#6b7280;text-align:center;}.chat-input.svelte-beco3k {flex:1;resize:none;padding:10px 14px;border-radius:12px;border:1px solid #d1d5db;font-size:16px; /* 16px prevents iOS auto-zoom on focus */line-height:1.4;min-height:42px;max-height:120px;overflow-y:auto;transition:border-color 0.15s ease, box-shadow 0.15s ease;outline:none;touch-action:manipulation;}.chat-input.svelte-beco3k:focus {border-color:#6366f1;box-shadow:0 0 0 3px rgba(99, 102, 241, 0.1);}.chat-input.svelte-beco3k::placeholder {color:#9ca3af;}.send-btn.svelte-beco3k {display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:none;background:#4f46e5;color:#fff;cursor:pointer;transition:background 0.15s ease, opacity 0.15s ease;flex-shrink:0;}.send-btn.svelte-beco3k:hover:not(:disabled) {background:#4338ca;}.send-btn.svelte-beco3k:disabled {opacity:0.4;cursor:not-allowed;}

	/* ══════════════════════ Settings page ══════════════════════ */.settings-page.svelte-beco3k {max-width:none;width:100%;margin:0;padding:36px 0 60px;font-family:inherit;color:#111;}.settings-title.svelte-beco3k {font-size:1.35rem;font-weight:700;margin:0 0 8px;color:#111;}.settings-page-desc.svelte-beco3k {font-size:0.9rem;color:#6b7280;margin:0 0 32px;line-height:1.45;}.settings-section.svelte-beco3k {background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:18px;display:flex;flex-direction:column;gap:14px;}.settings-section-title.svelte-beco3k {font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0;}.settings-section-desc.svelte-beco3k {font-size:0.875rem;color:#6b7280;margin:-8px 0 0;}

	/* Default assistant grid */.settings-assistant-grid.svelte-beco3k {display:flex;flex-wrap:wrap;gap:10px;}.settings-assistant-btn.svelte-beco3k {display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;transition:border-color 0.15s, background 0.15s;min-width:80px;}.settings-assistant-btn.selected.svelte-beco3k {border-color:#4f46e5;background:#eef2ff;}.settings-assistant-emoji.svelte-beco3k {font-size:1.5rem;}.settings-assistant-name.svelte-beco3k {font-size:0.8rem;font-weight:500;color:#374151;}

	/* Toggle rows */.settings-toggle.svelte-beco3k {display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;}.settings-toggle-info.svelte-beco3k {display:flex;flex-direction:column;gap:2px;}.settings-toggle-label.svelte-beco3k {font-size:0.9rem;font-weight:500;color:#111;}.settings-toggle-desc.svelte-beco3k {font-size:0.8rem;color:#6b7280;}.settings-switch.svelte-beco3k {flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#d1d5db;border:none;position:relative;cursor:pointer;transition:background 0.2s;outline:none;padding:0;}.settings-switch.svelte-beco3k::after {content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s;}.settings-switch.on.svelte-beco3k {background:#4f46e5;}.settings-switch.on.svelte-beco3k::after {transform:translateX(18px);}

	/* History list */.settings-history-list.svelte-beco3k {display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;}.settings-history-item.svelte-beco3k {display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:#f9fafb;}.settings-history-body.svelte-beco3k {flex:1;min-width:0;}.settings-history-title.svelte-beco3k {font-size:0.875rem;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.settings-history-meta.svelte-beco3k {font-size:0.75rem;color:#9ca3af;margin-top:2px;}.settings-history-delete.svelte-beco3k {flex-shrink:0;width:28px;height:28px;border:none;background:transparent;cursor:pointer;border-radius:6px;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 0.15s, color 0.15s;}.settings-history-delete.svelte-beco3k:hover {background:#fee2e2;color:#dc2626;}.settings-danger-btn.svelte-beco3k {align-self:flex-start;padding:7px 14px;border:1.5px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;font-size:0.85rem;font-weight:500;cursor:pointer;transition:background 0.15s;}.settings-danger-btn.svelte-beco3k:hover:not(:disabled) {background:#fee2e2;}.settings-danger-btn.svelte-beco3k:disabled {opacity:0.5;cursor:not-allowed;}

	/* About */.settings-about-row.svelte-beco3k {display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;}.settings-about-label.svelte-beco3k {color:#6b7280;}.settings-about-value.svelte-beco3k {font-weight:500;color:#111;}.settings-api-status.svelte-beco3k {font-size:0.85rem;font-weight:500;}.settings-api-status.online.svelte-beco3k {color:#16a34a;}.settings-api-status.offline.svelte-beco3k {color:#dc2626;}.settings-api-status.unknown.svelte-beco3k {color:#9ca3af;}.settings-link-btn.svelte-beco3k {align-self:flex-start;padding:6px 12px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;color:#4f46e5;font-size:0.8rem;cursor:pointer;transition:background 0.15s;}.settings-link-btn.svelte-beco3k:hover {background:#eef2ff;}`
};
function If(e, t) {
  Ki(t, !0), Ic(e, Mf), ir(() => {
    const v = t.ctx?.locale;
    if (!v?.subscribe) {
      Ni("en");
      return;
    }
    return v.subscribe((g) => void Ni(g || "en"));
  });
  function n() {
    const v = t.ctx.config?.network;
    if (v && v !== "ic") return v;
    const g = globalThis.__CANISTER_IDS;
    return g?.network && g.network !== "ic" ? g.network : window.location.hostname.includes("icp0.io") ? "test" : "staging";
  }
  let r = /* @__PURE__ */ z(at([])), s = /* @__PURE__ */ z(""), i = /* @__PURE__ */ z(!1), o = /* @__PURE__ */ z(""), a = /* @__PURE__ */ z(!1), l = /* @__PURE__ */ z(at(typeof sessionStorage < "u" && sessionStorage.getItem("llm-chat-backend-awake") === "1")), u = /* @__PURE__ */ z(""), d = /* @__PURE__ */ z(void 0), h = /* @__PURE__ */ z(at([])), w = /* @__PURE__ */ z(!1), b = /* @__PURE__ */ z(void 0), E = /* @__PURE__ */ z(at([])), C = /* @__PURE__ */ z(null), p = /* @__PURE__ */ z(!1), m = /* @__PURE__ */ z(null), X = /* @__PURE__ */ z(void 0), Z = /* @__PURE__ */ z("100%"), B = /* @__PURE__ */ z(null), ae = /* @__PURE__ */ z(!1), W = /* @__PURE__ */ z(null), Me = /* @__PURE__ */ z(0), Ue, zt, te = /* @__PURE__ */ z(null), ne = /* @__PURE__ */ z(at([])), dt = /* @__PURE__ */ z(!1), bn = /* @__PURE__ */ z(!1);
  const Bn = "https://geister-api.realmsgos.dev/", Qo = 36e4;
  let Xo = `${Bn}api/ask`, Zo = `${Bn}suggestions`, ea = `${Bn}api/personas/assistants`, Vn = `${Bn}api/conversations`;
  function ta(v) {
    if (!v) return null;
    const g = v.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function ii(v) {
    if (!v) return null;
    const g = v.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
    if (!g) return null;
    try {
      return decodeURIComponent(g[1]);
    } catch {
      return g[1];
    }
  }
  function na(v) {
    !v || v.id === c(Me) || (_(Me, v.id, !0), _(s, v.message, !0), _(ae, !0), v.autoSend ? setTimeout(() => void mn(), 150) : In().then(os));
  }
  function ra() {
    if (ii(c(W)?.uri)) {
      t.ctx.host?.dispatch?.({
        type: "assistant.prompt",
        message: "Explain this proposal — its purpose, governance impact, and the main code or policy changes.",
        autoSend: !0
      });
      return;
    }
    t.ctx.host?.dispatch?.({ type: "assistant.prompt", autoSend: !0 });
  }
  function sa() {
    Ue = t.ctx.host?.pendingPrompt?.subscribe?.(na), zt = t.ctx.host?.focus?.subscribe?.((v) => {
      _(W, v, !0);
    });
  }
  function oi(v, g) {
    if (g === 503 && v instanceof Error && v.message) {
      const k = v.message.toLowerCase();
      return k.includes("pod") || k.includes("llm backend") || k.includes("ollama") || k.includes("waking up") || k.includes("still starting") ? "The AI assistant is still waking up. Please try again in a few minutes." : v.message;
    }
    return g === 502 || g === 530 ? "The AI backend is temporarily offline. Please try again in a few minutes." : g === 504 || g === 524 ? "The request timed out before the server could respond. Please try again." : g && g >= 500 ? "Server error. Please try again later." : v instanceof DOMException && v.name === "TimeoutError" || v instanceof Error && v.name === "AbortError" ? "The request timed out before the server could respond. Please try again." : v instanceof TypeError || v instanceof Error && v.message.includes("fetch") ? "Could not reach the AI service. Check your network or try again shortly." : v instanceof Error && v.message.includes("HTTP error") ? oi(v, Number(v.message.match(/Status:\s*(\d+)/)?.[1])) : "Failed to get a response. Please try again.";
  }
  function ia(v) {
    const g = v.toLowerCase();
    return g.includes("llm backend") || g.includes("cannot reach ollama") || g.includes("ollama at");
  }
  function Yn() {
    _(l, !0);
    try {
      sessionStorage.setItem("llm-chat-backend-awake", "1");
    } catch {
    }
  }
  function ai() {
    _(l, !1);
    try {
      sessionStorage.removeItem("llm-chat-backend-awake");
    } catch {
    }
  }
  function oa(v) {
    const g = v.toLowerCase();
    return g.includes("waking up") || g.includes("still starting");
  }
  function ts() {
    _(o, ""), _(a, !1);
  }
  function xr(v, g) {
    v.trim() && (_(a, !0), _(o, ""));
    const k = { text: v, isUser: !1, ...g.trim() ? { thinking: g } : {} }, S = c(r)[c(r).length - 1];
    !S || S.isUser ? _(r, [...c(r), k], !0) : _(r, c(r).map((P, qe) => qe === c(r).length - 1 ? { ...P, ...k } : P), !0), In().then(ss);
  }
  function aa(v, g) {
    const k = typeof v.type == "string" ? v.type : v.text ? "text" : "", S = typeof v.text == "string" ? v.text : "";
    if (k === "status" && S) {
      Yn(), _(o, S, !0);
      return;
    }
    if (k === "thinking" && S) {
      Yn(), g.thinking += S, xr(g.text, g.thinking);
      return;
    }
    S && (Yn(), g.text += S, xr(g.text, g.thinking));
  }
  let Gn = "", Nt = "", li, ci, Rt = /* @__PURE__ */ z(!1);
  const wn = !!t.ctx.sidebarPanel, fi = "llm_chat_prefs";
  function la() {
    try {
      return JSON.parse(localStorage.getItem(fi) || "{}");
    } catch {
      return {};
    }
  }
  function ca(v) {
    try {
      localStorage.setItem(fi, JSON.stringify(v));
    } catch {
    }
  }
  const ns = la();
  let kn = /* @__PURE__ */ z(at(ns.defaultAssistant || "")), Gt = /* @__PURE__ */ z(ns.showSuggestions !== !1), $n = /* @__PURE__ */ z(ns.sharePageContext !== !1);
  ir(() => {
    ca({
      defaultAssistant: c(kn),
      showSuggestions: c(Gt),
      sharePageContext: c($n)
    });
  });
  let Wn = /* @__PURE__ */ z("unknown"), yr = /* @__PURE__ */ z(!1), rs = /* @__PURE__ */ z(!1);
  async function ui() {
    try {
      const v = await fetch(`${Bn}api/personas/assistants`, { method: "HEAD", signal: AbortSignal.timeout(5e3) });
      _(Wn, v.ok ? "online" : "offline", !0);
    } catch {
      _(Wn, "offline");
    }
  }
  async function fa() {
    if (!(!Nt || !c(Rt))) {
      _(yr, !0);
      try {
        await is(), await Promise.all(c(ne).map((v) => fetch(`${Vn}/${v.conversation_id}`, { method: "DELETE" }))), _(ne, [], !0), _(r, [], !0), _(te, null), _(rs, !0), setTimeout(
          () => {
            _(rs, !1);
          },
          2e3
        );
      } catch {
      } finally {
        _(yr, !1);
      }
    }
  }
  Oc(async () => {
    const v = globalThis.__CANISTER_IDS?.realm_backend || "", g = t.ctx.config?.canisterId || "";
    if (Gn = v || g, li = t.ctx.principal?.subscribe?.((k) => {
      Nt = k || "";
    }), ci = t.ctx.isAuthenticated?.subscribe?.((k) => {
      _(Rt, k, !0);
    }), !wn) {
      const k = window.visualViewport;
      if (k) {
        const S = () => {
          const P = c(X)?.getBoundingClientRect().top ?? k.offsetTop, qe = Math.max(Math.round(k.height - P), 200);
          _(Z, `${qe}px`);
        };
        await In(), S(), k.addEventListener("resize", S), k.addEventListener("scroll", S), window.addEventListener("resize", S), window.__chatVpCleanup = () => {
          k.removeEventListener("resize", S), k.removeEventListener("scroll", S), window.removeEventListener("resize", S);
        };
      }
    }
    if (ua(), sa(), await da(), c(kn) && c(E).length > 0) {
      const k = c(E).find((S) => S.id === c(kn));
      k && _(C, k, !0);
    }
    !c(ae) && c(Gt) && await Er(), wn || (ui(), c(Rt) && await is());
  });
  function ua() {
    try {
      const v = new URLSearchParams(window.location.search), g = v.get("explain");
      if (!g) return;
      const [k, S] = g.split(":");
      if (k === "codex" && S)
        _(ae, !0), t.ctx.backend.extension_sync_call("codex_viewer", "get_codex_details", JSON.stringify({ codex_id: S })).then((P) => {
          if (P.success) {
            const $t = (typeof P.response == "string" ? JSON.parse(P.response) : P.response).codex?.name || `codex_${S}`, Ee = `/extensions/codex_viewer/${S}`;
            _(B, S, !0), _(s, `Please explain this codex: [${$t}](${Ee})`), setTimeout(() => mn(), 300);
          }
        }).catch((P) => {
          console.error("Failed to fetch codex for explanation:", P), _(ae, !1);
        });
      else if (k === "financial_statements") {
        _(ae, !0);
        const P = v.get("context") || "";
        _(s, `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:

${P}`), setTimeout(() => mn(), 300);
      }
    } catch (v) {
      console.error("Error handling explain param:", v);
    }
  }
  ir(() => {
    c(r), In().then(ss);
  });
  function ss() {
    c(d) && (c(d).scrollTop = c(d).scrollHeight);
  }
  async function da() {
    if (!c(p)) {
      _(p, !0);
      try {
        const v = await fetch(ea, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!v.ok) throw new Error(`HTTP ${v.status}`);
        const g = await v.json();
        g.assistants && Array.isArray(g.assistants) && (_(E, g.assistants, !0), c(E).length > 0 && !c(C) && _(C, c(E)[0], !0));
      } catch (v) {
        console.error("Error fetching assistants:", v);
      } finally {
        _(p, !1);
      }
    }
  }
  async function Er() {
    if (!c(w)) {
      _(w, !0);
      try {
        const v = new URLSearchParams({
          user_principal: Nt || "",
          realm_principal: Gn || "",
          persona: c(C)?.id || "ashoka"
        }), g = await fetch(`${Zo}?${v.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!g.ok) throw new Error(`HTTP ${g.status}`);
        const k = await g.json();
        k.suggestions && Array.isArray(k.suggestions) && _(h, k.suggestions, !0);
      } catch (v) {
        console.error("Error fetching suggestions:", v);
      } finally {
        _(w, !1);
      }
    }
  }
  async function mn() {
    if (!c(s).trim()) return;
    _(u, ""), _(
      r,
      [
        ...c(r),
        { text: c(s), isUser: !0 }
      ],
      !0
    );
    const v = c(s);
    _(s, ""), _(i, !0), ts(), _(o, c(l) ? "Thinking…" : "", !0);
    try {
      await ga();
      const g = n(), k = {
        question: v,
        realm_principal: Gn,
        user_principal: Nt,
        stream: !0,
        verbosity: 1,
        persona: c(C)?.id || "ashoka",
        network: g,
        ...c(te) ? { conversation_id: c(te) } : {}
      };
      if (c(B))
        k.explain_codex_id = c(B), _(B, null);
      else {
        const ke = ta(c(W)?.uri);
        ke && (k.explain_codex_id = ke);
      }
      const S = ii(c(W)?.uri);
      S && (k.explain_proposal_id = S, k.page_context = {
        pathname: typeof window < "u" ? window.location.pathname : "",
        extensionId: "voting",
        title: c(W)?.label || "Proposal",
        proposalId: S
      }), c(W) && (k.focus = {
        uri: c(W).uri,
        label: c(W).label
      });
      const P = await fetch(Xo, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(k),
        signal: AbortSignal.timeout(Qo)
      });
      if (!P.ok) {
        let ke = "";
        try {
          const Be = await P.json();
          ke = typeof Be?.error == "string" ? Be.error : "";
        } catch {
        }
        throw ke ? Object.assign(new Error(ke), { httpStatus: P.status }) : Object.assign(new Error(`HTTP error! Status: ${P.status}`), { httpStatus: P.status });
      }
      const qe = P.body?.getReader();
      if (!qe) throw new Error("Response body is not readable");
      const $t = new TextDecoder(), Ee = { text: "", thinking: "" };
      try {
        for (; ; ) {
          const { done: ke, value: Be } = await qe.read();
          if (ke) break;
          const En = $t.decode(Be, { stream: !0 }).split(`
`);
          for (const mt of En)
            if (mt.startsWith("data: ")) {
              const Wt = mt.slice(6);
              if (Wt === "[DONE]") continue;
              try {
                aa(JSON.parse(Wt), Ee);
              } catch {
                Ee.text += Wt, xr(Ee.text, Ee.thinking);
              }
            } else mt.trim() && !mt.startsWith(":") && (Ee.text += mt, xr(Ee.text, Ee.thinking));
        }
      } finally {
        qe.releaseLock();
      }
      const Ot = Ee.text, xn = Ee.thinking;
      Ot.trim() ? ia(Ot) ? (_(u, "The AI backend is temporarily offline. Please try again in a few minutes."), ai()) : Ot.trim() && Yn() : c(r).length > 0 && !c(r)[c(r).length - 1].isUser ? _(r, c(r).map((ke, Be) => Be === c(r).length - 1 ? { ...ke, text: "No response from LLM" } : ke), !0) : _(
        r,
        [
          ...c(r),
          { text: "No response from LLM", isUser: !1 }
        ],
        !0
      ), _(i, !1), ts(), _(ae, !1), await Er();
    } catch (g) {
      console.error("Error calling LLM:", g), _(u, oi(g, g?.httpStatus), !0), oa(c(u)) && ai(), c(r).length > 0 && !c(r)[c(r).length - 1].isUser && _(r, c(r).slice(0, -1), !0);
    } finally {
      _(i, !1), ts(), _(ae, !1);
    }
  }
  function va() {
    _(u, "");
  }
  async function is() {
    if (!(!Nt || !c(Rt))) {
      _(bn, !0);
      try {
        const v = new URLSearchParams({
          user_principal: Nt,
          realm_principal: Gn
        }), g = await fetch(`${Vn}?${v}`, { headers: { "Content-Type": "application/json" } });
        if (!g.ok) return;
        const k = await g.json();
        _(ne, (k.conversations || []).sort((S, P) => new Date(P.updated_at).getTime() - new Date(S.updated_at).getTime()), !0);
      } catch {
      } finally {
        _(bn, !1);
      }
    }
  }
  async function di(v) {
    _(dt, !1), _(r, [], !0), _(te, v.conversation_id, !0);
    const g = c(E).find((k) => k.id === v.persona);
    g && _(C, g, !0);
    try {
      const k = await fetch(`${Vn}/${v.conversation_id}/messages`, { headers: { "Content-Type": "application/json" } });
      if (!k.ok) return;
      const S = await k.json();
      _(r, _a(S.messages || []), !0), c(r).some((P) => !P.isUser) && Yn(), await In(), ss();
    } catch {
    }
  }
  async function ha() {
    _(dt, !1), _(r, [], !0), _(te, null), _(u, ""), _(h, [], !0), await Er();
  }
  async function vi(v, g) {
    g.stopPropagation();
    try {
      await fetch(`${Vn}/${v}`, { method: "DELETE" }), _(ne, c(ne).filter((k) => k.conversation_id !== v), !0), c(te) === v && (_(r, [], !0), _(te, null));
    } catch {
    }
  }
  async function pa() {
    _(dt, !0), await is();
  }
  function hi(v) {
    const g = new Date(v), S = (/* @__PURE__ */ new Date()).getTime() - g.getTime(), P = Math.floor(S / 864e5);
    return P === 0 ? g.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : P === 1 ? "Yesterday" : P < 7 ? g.toLocaleDateString([], { weekday: "short" }) : g.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  async function ga() {
    if (!(c(te) || !Nt || !c(Rt)))
      try {
        const v = await fetch(Vn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_principal: Nt,
            realm_principal: Gn,
            persona: c(C)?.id || "ashoka"
          })
        });
        if (v.ok) {
          const g = await v.json();
          _(te, g.conversation_id || null, !0);
        }
      } catch {
      }
  }
  function pi(v, g) {
    const k = () => {
      _(m, g, !0), setTimeout(
        () => {
          _(m, null);
        },
        1500
      );
    }, S = () => {
      const P = document.createElement("textarea");
      P.value = v, P.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0", document.body.appendChild(P), P.focus(), P.select();
      try {
        document.execCommand("copy"), k();
      } catch {
      }
      document.body.removeChild(P);
    };
    navigator.clipboard ? navigator.clipboard.writeText(v).then(k).catch(S) : S();
  }
  function _a(v) {
    const g = [];
    for (const k of v) {
      if (!k || typeof k != "object") continue;
      const S = k;
      if (S.role && S.content != null) {
        g.push({ text: String(S.content), isUser: S.role === "user" });
        continue;
      }
      S.question != null && String(S.question).trim() && g.push({ text: String(S.question), isUser: !0 }), S.response != null && String(S.response).trim() && g.push({ text: String(S.response), isUser: !1 });
    }
    return g;
  }
  function ba(v) {
    if (!v) return "";
    let g = v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return g = g.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>').replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>"), g;
  }
  function os() {
    if (c(b)) {
      c(b).style.height = "auto";
      const v = Math.max(40, Math.min(c(b).scrollHeight, 120));
      c(b).style.height = v + "px";
    }
  }
  function wa(v) {
    v.key === "Enter" && !v.shiftKey && (v.preventDefault(), mn()), setTimeout(os, 0);
  }
  function ka(v) {
    _(s, v, !0), mn();
  }
  function ma(v) {
    _(C, v, !0), _(r, [], !0), Er();
  }
  ir(() => () => {
    li?.(), ci?.(), Ue?.(), zt?.(), window.__chatVpCleanup?.();
  });
  var gi = An(), xa = Xt(gi);
  {
    var ya = (v) => {
      var g = ef(), k = L(N(g), 2), S = me(k, !0), P = L(k, 2), qe = L(N(P), 4);
      {
        var $t = (ee) => {
          var Ie = Wc();
          Mn(Ie, 21, () => c(E), Cn, (Sn, T) => {
            var H = $c(), J = N(H), Q = me(J, !0), re = L(J, 2), de = me(re, !0);
            Se(() => {
              Zt(H, 1, `settings-assistant-btn ${c(kn) === c(T).id || !c(kn) && c(E)[0].id === c(T).id ? "selected" : ""}`, "svelte-beco3k"), xe(Q, c(T).emoji), xe(de, c(T).name);
            }), ce("click", H, () => _(kn, c(T).id, !0)), A(Sn, H);
          }), A(ee, Ie);
        }, Ee = (ee) => {
          var Ie = Kc();
          A(ee, Ie);
        };
        G(qe, (ee) => {
          c(E).length > 0 ? ee($t) : ee(Ee, -1);
        });
      }
      var Ot = L(P, 2), xn = L(N(Ot), 2), ke = L(N(xn), 2), Be = L(xn, 2), yn = L(N(Be), 2), En = L(Ot, 2);
      {
        var mt = (ee) => {
          var Ie = Zc(), Sn = L(N(Ie), 2);
          {
            var T = (I) => {
              var q = Qc();
              Mn(q, 21, () => c(ne), Cn, (he, K) => {
                var Pe = Jc(), vt = N(Pe), xt = N(vt), We = me(xt, !0), tt = L(xt, 2), ve = me(tt), pe = L(vt, 2);
                Se(
                  (ge) => {
                    xe(We, c(K).title), xe(ve, `${ge ?? ""} · ${c(K).message_count ?? ""} message${c(K).message_count === 1 ? "" : "s"}`);
                  },
                  [() => hi(c(K).updated_at)]
                ), ce("click", pe, (ge) => vi(c(K).conversation_id, ge)), A(he, Pe);
              }), A(I, q);
            }, H = (I) => {
              var q = Xc(), he = me(q, !0);
              Se(() => xe(he, c(bn) ? "Loading…" : "No conversations yet.")), A(I, q);
            };
            G(Sn, (I) => {
              c(ne).length > 0 ? I(T) : I(H, -1);
            });
          }
          var J = L(Sn, 2), Q = N(J);
          {
            var re = (I) => {
              var q = Tn("✓ History cleared");
              A(I, q);
            }, de = (I) => {
              var q = Tn("Clearing…");
              A(I, q);
            }, Y = (I) => {
              var q = Tn("Clear all history");
              A(I, q);
            };
            G(Q, (I) => {
              c(rs) ? I(re) : c(yr) ? I(de, 1) : I(Y, -1);
            });
          }
          Se(() => J.disabled = c(yr) || c(ne).length === 0), ce("click", J, fa), A(ee, Ie);
        };
        G(En, (ee) => {
          c(Rt) && ee(mt);
        });
      }
      var Wt = L(En, 2), Kn = L(N(Wt), 4), Sr = L(N(Kn), 2), Tr = N(Sr);
      {
        var Kt = (ee) => {
          var Ie = Tn("● Online");
          A(ee, Ie);
        }, Jn = (ee) => {
          var Ie = Tn("● Offline");
          A(ee, Ie);
        }, as = (ee) => {
          var Ie = Tn("Checking…");
          A(ee, Ie);
        };
        G(Tr, (ee) => {
          c(Wn) === "online" ? ee(Kt) : c(Wn) === "offline" ? ee(Jn, 1) : ee(as, -1);
        });
      }
      var ls = L(Kn, 2);
      Se(() => {
        xe(S, Hc), Zt(ke, 1, `settings-switch ${c(Gt) ? "on" : ""}`, "svelte-beco3k"), Pr(ke, "aria-checked", c(Gt)), Zt(yn, 1, `settings-switch ${c($n) ? "on" : ""}`, "svelte-beco3k"), Pr(yn, "aria-checked", c($n)), Zt(Sr, 1, `settings-api-status ${c(Wn) ?? ""}`, "svelte-beco3k");
      }), ce("click", ke, () => _(Gt, !c(Gt))), ce("click", yn, () => _($n, !c($n))), ce("click", ls, ui), A(v, g);
    }, Ea = (v) => {
      var g = Cf();
      let k;
      var S = N(g);
      {
        var P = (T) => {
          var H = tf(), J = N(H), Q = L(J, 2);
          Se(() => Zt(Q, 1, `toolbar-btn ${c(dt) ? "active" : ""}`, "svelte-beco3k")), ce("click", J, ha), ce("click", Q, function(...re) {
            (c(dt) ? () => _(dt, !1) : pa)?.apply(this, re);
          }), A(T, H);
        };
        G(S, (T) => {
          c(Rt) && T(P);
        });
      }
      var qe = L(S, 2);
      {
        var $t = (T) => {
          var H = nf(), J = N(H), Q = me(J, !0), re = L(J, 2);
          Se(() => {
            Pr(J, "title", c(W).uri), xe(Q, c(W).label);
          }), ce("click", re, ra), A(T, H);
        };
        G(qe, (T) => {
          wn && c(W)?.label && T($t);
        });
      }
      var Ee = L(qe, 2);
      {
        var Ot = (T) => {
          var H = sf();
          Mn(H, 21, () => c(E), Cn, (J, Q) => {
            var re = rf(), de = N(re), Y = me(de, !0), I = L(de, 2), q = me(I, !0);
            Se(() => {
              Zt(re, 1, `assistant-btn ${c(C)?.id === c(Q).id ? "active" : ""}`, "svelte-beco3k"), Pr(re, "title", c(Q).description), xe(Y, c(Q).emoji), xe(q, c(Q).name);
            }), ce("click", re, () => ma(c(Q))), A(J, re);
          }), A(T, H);
        };
        G(Ee, (T) => {
          c(E).length > 1 && T(Ot);
        });
      }
      var xn = L(Ee, 2);
      {
        var ke = (T) => {
          var H = cf(), J = N(H);
          {
            var Q = (Y) => {
              var I = of();
              A(Y, I);
            }, re = (Y) => {
              var I = af();
              A(Y, I);
            }, de = (Y) => {
              var I = An(), q = Xt(I);
              Mn(q, 17, () => c(ne), Cn, (he, K) => {
                var Pe = lf(), vt = N(Pe), xt = N(vt), We = me(xt, !0), tt = L(xt, 2), ve = me(tt), pe = L(vt, 2);
                Se(
                  (ge) => {
                    xe(We, c(K).title), xe(ve, `${ge ?? ""} · ${c(K).message_count ?? ""} msg${c(K).message_count === 1 ? "" : "s"}`);
                  },
                  [() => hi(c(K).updated_at)]
                ), ce("click", Pe, () => di(c(K))), ce("keydown", Pe, (ge) => ge.key === "Enter" && di(c(K))), ce("click", pe, (ge) => vi(c(K).conversation_id, ge)), A(he, Pe);
              }), A(Y, I);
            };
            G(J, (Y) => {
              c(bn) ? Y(Q) : c(ne).length === 0 ? Y(re, 1) : Y(de, -1);
            });
          }
          A(T, H);
        };
        G(xn, (T) => {
          c(dt) && T(ke);
        });
      }
      var Be = L(xn, 2), yn = N(Be);
      {
        var En = (T) => {
          var H = df(), J = N(H), Q = N(J);
          {
            var re = (Y) => {
              var I = ff();
              A(Y, I);
            }, de = (Y) => {
              var I = uf();
              A(Y, I);
            };
            G(Q, (Y) => {
              c(Rt) ? Y(re) : Y(de, -1);
            });
          }
          A(T, H);
        }, mt = (T) => {
          var H = xf(), J = Xt(H);
          Mn(J, 17, () => c(r), Cn, (I, q, he) => {
            var K = An(), Pe = Xt(K);
            {
              var vt = (We) => {
                var tt = vf(), ve = N(tt), pe = N(ve), ge = N(pe);
                {
                  var Qn = (jt) => {
                    var Zn = Ri();
                    A(jt, Zn);
                  }, Xn = (jt) => {
                    var Zn = Oi();
                    A(jt, Zn);
                  };
                  G(ge, (jt) => {
                    c(m) === he ? jt(Qn) : jt(Xn, -1);
                  });
                }
                var ht = L(pe, 2), Dt = me(ht, !0);
                Se(() => xe(Dt, c(q).text)), ce("click", pe, () => pi(c(q).text, he)), A(We, tt);
              }, xt = (We) => {
                var tt = pf(), ve = N(tt), pe = N(ve), ge = N(pe);
                {
                  var Qn = (Re) => {
                    var yt = hf(), cs = L(N(yt), 2), Ta = me(cs, !0);
                    Se(() => xe(Ta, c(q).thinking)), A(Re, yt);
                  };
                  G(ge, (Re) => {
                    c(q).thinking && Re(Qn);
                  });
                }
                var Xn = L(ge, 2);
                {
                  var ht = (Re) => {
                    var yt = An(), cs = Xt(yt);
                    Mc(cs, () => ba(c(q).text)), A(Re, yt);
                  };
                  G(Xn, (Re) => {
                    c(q).text && Re(ht);
                  });
                }
                var Dt = L(pe, 2), jt = N(Dt);
                {
                  var Zn = (Re) => {
                    var yt = Ri();
                    A(Re, yt);
                  }, Sa = (Re) => {
                    var yt = Oi();
                    A(Re, yt);
                  };
                  G(jt, (Re) => {
                    c(m) === he ? Re(Zn) : Re(Sa, -1);
                  });
                }
                ce("click", Dt, () => pi(c(q).text, he)), A(We, tt);
              };
              G(Pe, (We) => {
                c(q).isUser ? We(vt) : We(xt, -1);
              });
            }
            A(I, K);
          });
          var Q = L(J, 2);
          {
            var re = (I) => {
              var q = kf(), he = N(q), K = N(he);
              {
                var Pe = (ve) => {
                  var pe = An(), ge = Xt(pe);
                  {
                    var Qn = (ht) => {
                      var Dt = gf();
                      A(ht, Dt);
                    }, Xn = (ht) => {
                      var Dt = _f();
                      A(ht, Dt);
                    };
                    G(ge, (ht) => {
                      c(ae) ? ht(Qn) : !c(l) && !c(o) && ht(Xn, 1);
                    });
                  }
                  A(ve, pe);
                };
                G(K, (ve) => {
                  c(a) || ve(Pe);
                });
              }
              var vt = L(K, 2);
              {
                var xt = (ve) => {
                  var pe = bf(), ge = me(pe, !0);
                  Se(() => xe(ge, c(o))), A(ve, pe);
                };
                G(vt, (ve) => {
                  c(o) && ve(xt);
                });
              }
              var We = L(vt, 2);
              {
                var tt = (ve) => {
                  var pe = wf();
                  A(ve, pe);
                };
                G(We, (ve) => {
                  !c(a) && !c(o) && c(l) && !c(ae) && ve(tt);
                });
              }
              A(I, q);
            };
            G(Q, (I) => {
              c(i) && (!c(a) || c(o)) && I(re);
            });
          }
          var de = L(Q, 2);
          {
            var Y = (I) => {
              var q = mf(), he = N(q), K = me(he, !0), Pe = L(he, 2);
              Se(() => xe(K, c(u))), ce("click", Pe, va), A(I, q);
            };
            G(de, (I) => {
              c(u) && I(Y);
            });
          }
          A(T, H);
        };
        G(yn, (T) => {
          c(r).length === 0 && !c(ae) ? T(En) : T(mt, -1);
        });
      }
      ks(Be, (T) => _(d, T), () => c(d));
      var Wt = L(Be, 2), Kn = N(Wt);
      {
        var Sr = (T) => {
          var H = Sf(), J = N(H);
          {
            var Q = (de) => {
              var Y = yf();
              A(de, Y);
            }, re = (de) => {
              var Y = An(), I = Xt(Y);
              Mn(I, 17, () => c(h), Cn, (q, he) => {
                var K = Ef(), Pe = me(K, !0);
                Se(() => xe(Pe, c(he))), ce("click", K, () => ka(c(he))), A(q, K);
              }), A(de, Y);
            };
            G(J, (de) => {
              c(w) ? de(Q) : de(re, -1);
            });
          }
          A(T, H);
        };
        G(Kn, (T) => {
          c(Gt) && (c(h).length > 0 || c(w)) && T(Sr);
        });
      }
      var Tr = L(Kn, 2), Kt = N(Tr);
      ks(Kt, (T) => _(b, T), () => c(b));
      var Jn = L(Kt, 2), as = N(Jn);
      {
        var ls = (T) => {
          var H = Tf();
          A(T, H);
        }, ee = (T) => {
          var H = Af();
          A(T, H);
        };
        G(as, (T) => {
          c(i) ? T(ls) : T(ee, -1);
        });
      }
      var Ie = L(Tr, 2), Sn = me(Ie, !0);
      ks(g, (T) => _(X, T), () => c(X)), Se(
        (T, H) => {
          k = Zt(g, 1, "llm-chat-root svelte-beco3k", null, k, { "sidebar-panel": wn }), Li(g, wn ? void 0 : `height: ${c(Z)}`), Li(Be, c(dt) ? "display:none" : ""), Jn.disabled = T, xe(Sn, H);
        },
        [
          () => c(i) || !c(s).trim(),
          () => Gc("ai_answers_can_be_wrong")
        ]
      ), ce("keydown", Kt, wa), ce("input", Kt, () => os()), Rc(Kt, () => c(s), (T) => _(s, T)), ce("click", Jn, () => mn()), A(v, g);
    };
    G(xa, (v) => {
      wn ? v(Ea, -1) : v(ya);
    });
  }
  A(e, gi), Ji();
}
ac(["click", "keydown", "input"]);
function Nf(e, t) {
  const n = bc(If, { target: e, props: { ctx: t } });
  return {
    unmount() {
      try {
        mc(n);
      } catch {
      }
    }
  };
}
export {
  Nf as default
};
