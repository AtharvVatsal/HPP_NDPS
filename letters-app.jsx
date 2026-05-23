import React from 'react';

// IO fill-in form + Letters Window popup.
// Major features:
//   • Officer details typed in manually (names vary across postings)
//   • All relatives rows are add/delete-able; relation column is editable
//   • Share link encodes the form state in the URL hash — open on any device
//   • Mobile-responsive (top bar wraps, popup goes full-screen, etc.)
//   • Auto-saves to localStorage

const { useState: lfUseState, useEffect: lfUseEffect, useMemo: lfUseMemo, useRef: lfUseRef } = React;

// ─────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────
function blankAccused() {
  return { name: "", fatherName: "", address: "", id: "", passport: "", status: "Individual", pan: "" };
}
function blankRelative(relation = "") {
  return { relation, name: "", fatherOrHusband: "", address: "",
    livesWith: false, occupation: "", income: "", bank: "", account: "", pan: "",
    property: "", financialDealings: "", remarks: "" };
}
function defaultRelativesRows() {
  // pre-fill the 18 fixed relations so the IO sees the standard list — but
  // every row is fully editable / deletable.
  return window.LETTERS_DATA.RELATIONS.map(rel => blankRelative(rel));
}

const STORAGE_KEY = "ndps_letters_form_v2";

function defaultForm() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  return {
    officer: { name: "", rank: "", role: "Investigating Officer", phone: "", email: "" },
    // Editable letterhead — every field is plain text. No dropdowns; works for
    // any police station across Himachal Pradesh.
    letterhead: {
      govt: "GOVERNMENT OF HIMACHAL PRADESH",
      dept: "Himachal Pradesh Police",
      stationName: "",
      district: "",
      subdivision: "",
      state: "Himachal Pradesh",
      pin: "",
      address: "",
      phone: "",
      email: "",
    },
    fir: { no: "", date: "", sections: "8(c) r/w 21(c)", contraband: "", arrestDate: "" },
    accused: [blankAccused()],
    suspects: [],
    relatives: defaultRelativesRows(),
    letterDate: iso,
    ayFrom: "2019-20", ayTo: "2024-25",
    perLetterDays: {},
    refNo: {},
    slotData: {},
    selectedLetters: window.LETTERS_DATA.AUTHORITIES.map(a => a.id).concat(["L13"]),
    // Per-letter dispatch log: { L1: { sent: true, date: 'YYYY-MM-DD', dispatchNo: 'No. xxx/xx/...' } }
    sentLog: {},
    // User-uploaded letter templates — see CustomTemplatesStep below
    customTemplates: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Share-link encode / decode (URL hash, UTF-8 safe base64)
// ─────────────────────────────────────────────────────────────────────────
function encodeForm(f) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(f)))); }
  catch { return ""; }
}
function decodeForm(s) {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  catch { return null; }
}
function readHashForm() {
  const h = (location.hash || "").replace(/^#/, "");
  if (h.startsWith("d=")) {
    const data = decodeForm(h.slice(2));
    if (data && typeof data === "object") return data;
  }
  return null;
}
function loadForm() {
  // URL hash takes precedence (a shared link)
  const fromHash = readHashForm();
  if (fromHash) return { ...defaultForm(), ...fromHash };
  // else localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultForm();
    const f = JSON.parse(raw);
    return { ...defaultForm(), ...f, officer: { ...defaultForm().officer, ...(f.officer || {}) } };
  } catch { return defaultForm(); }
}

// ─────────────────────────────────────────────────────────────────────────
// Form primitives
// ─────────────────────────────────────────────────────────────────────────
function Field({ label, hint, children, span = 1 }) {
  return (
    <label className="lf-field" style={{ gridColumn: `span ${span}` }}>
      <div className="lf-lbl">{label} {hint && <span className="lf-hint">· {hint}</span>}</div>
      {children}
    </label>
  );
}
function TI({ value, onChange, placeholder, type = "text", style }) {
  return <input className="lf-input" type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />;
}
function TA({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className="lf-input lf-ta" rows={rows} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}
function Select({ value, onChange, options }) {
  return (
    <select className="lf-input" value={value || ""} onChange={e => onChange(e.target.value)}>
      {options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Btn({ children, onClick, variant = "ghost", disabled, title, type = "button" }) {
  return <button type={type} className={"lf-btn lf-btn-" + variant} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

function CollapsibleSection({ title, sub, children, defaultOpen = true, badge, color }) {
  const [open, setOpen] = lfUseState(defaultOpen);
  return (
    <section className="lf-section" data-open={open}>
      <header className="lf-section-hd" onClick={() => setOpen(!open)} style={{ borderLeftColor: color }}>
        <div className="lf-section-caret">{open ? "▾" : "▸"}</div>
        <div className="lf-section-title">{title}{badge != null && <span className="lf-section-badge">{badge}</span>}</div>
        <div className="lf-section-sub">{sub}</div>
      </header>
      {open && <div className="lf-section-body">{children}</div>}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 1 — Station & (manual) Officer
// ─────────────────────────────────────────────────────────────────────────
function StationStep({ form, set }) {
  const lh = form.letterhead || {};
  const setLH = (patch) => set({ letterhead: { ...lh, ...patch } });
  const setOfficer = (patch) => set({ officer: { ...form.officer, ...patch } });
  return (
    <CollapsibleSection title="1 · Police Station Letterhead & Investigating Officer" sub="type your station and officer details — these appear at the top of every letter">
      <div className="lf-subhead">Letterhead — text shown at the top of every letter</div>
      <div className="lf-grid lf-grid-2">
        <Field label="Government heading" hint="shown at the very top" span={2}>
          <TI value={lh.govt} onChange={v => setLH({ govt: v })} placeholder="GOVERNMENT OF HIMACHAL PRADESH" />
        </Field>
        <Field label="Department / Force" span={2}>
          <TI value={lh.dept} onChange={v => setLH({ dept: v })} placeholder="Himachal Pradesh Police" />
        </Field>
        <Field label="Police Station name" hint="e.g. Police Station Mandi Sadar" span={2}>
          <TI value={lh.stationName} onChange={v => setLH({ stationName: v })} placeholder="Police Station ____" />
        </Field>
        <Field label="District" span={1}>
          <TI value={lh.district} onChange={v => setLH({ district: v })} placeholder="District ____" />
        </Field>
        <Field label="Sub-Division (if any)" span={1}>
          <TI value={lh.subdivision} onChange={v => setLH({ subdivision: v })} placeholder="optional" />
        </Field>
        <Field label="State" span={1}>
          <TI value={lh.state} onChange={v => setLH({ state: v })} placeholder="Himachal Pradesh" />
        </Field>
        <Field label="PIN code" span={1}>
          <TI value={lh.pin} onChange={v => setLH({ pin: v })} placeholder="171xxx" />
        </Field>
        <Field label="Full postal address" hint="appears under the station name" span={2}>
          <TA value={lh.address} onChange={v => setLH({ address: v })} placeholder="House / Building, Street, Tehsil, District, State – PIN" rows={2} />
        </Field>
        <Field label="Office phone" span={1}>
          <TI value={lh.phone} onChange={v => setLH({ phone: v })} placeholder="01XXX-XXXXXX" />
        </Field>
        <Field label="Office email" span={1}>
          <TI value={lh.email} onChange={v => setLH({ email: v })} placeholder="ps.____@hppolice.gov.in" />
        </Field>
        <Field label="Letter date" span={2}>
          <TI type="date" value={form.letterDate} onChange={v => set({ letterDate: v })} />
        </Field>
      </div>

      <div className="lf-subhead" style={{ marginTop: 12 }}>Investigating Officer (signs at the foot of every letter)</div>
      <div className="lf-grid lf-grid-2">
        <Field label="Officer name" hint="as you would sign" span={1}>
          <TI value={form.officer.name} onChange={v => setOfficer({ name: v })} placeholder="e.g. Devinder Singh" />
        </Field>
        <Field label="Rank" hint="Inspector / SI / ASI / Head Constable / DSP / …" span={1}>
          <TI value={form.officer.rank} onChange={v => setOfficer({ rank: v })} placeholder="Type rank exactly as it should print" />
        </Field>
        <Field label="Role / designation" span={1}>
          <TI value={form.officer.role} onChange={v => setOfficer({ role: v })} placeholder="Investigating Officer / SHO / Add'l SHO" />
        </Field>
        <Field label="Mobile / phone" span={1}>
          <TI value={form.officer.phone} onChange={v => setOfficer({ phone: v })} placeholder="+91-XXXXX-XXXXX" />
        </Field>
        <Field label="Officer email" hint="used in transmission block" span={2}>
          <TI value={form.officer.email} onChange={v => setOfficer({ email: v })} placeholder="officer@hppolice.gov.in" />
        </Field>
      </div>
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — FIR
// ─────────────────────────────────────────────────────────────────────────
function FirStep({ form, set }) {
  return (
    <CollapsibleSection title="2 · FIR & Case Particulars" sub="referenced verbatim in every letter">
      <div className="lf-grid lf-grid-4">
        <Field label="FIR No." span={1}><TI value={form.fir.no} onChange={v => set({ fir: { ...form.fir, no: v } })} placeholder="47/2024" /></Field>
        <Field label="FIR date" span={1}><TI type="date" value={form.fir.date} onChange={v => set({ fir: { ...form.fir, date: v } })} /></Field>
        <Field label="Section(s) of NDPS Act" span={2}><TI value={form.fir.sections} onChange={v => set({ fir: { ...form.fir, sections: v } })} placeholder="8(c) r/w 21(c)" /></Field>
        <Field label="Contraband seized" span={2}><TI value={form.fir.contraband} onChange={v => set({ fir: { ...form.fir, contraband: v } })} placeholder="Heroin · 612 g (commercial quantity)" /></Field>
        <Field label="Date of arrest" span={1}><TI type="date" value={form.fir.arrestDate} onChange={v => set({ fir: { ...form.fir, arrestDate: v } })} /></Field>
        <Field label="AY range — for ITR (L2)" hint="six AYs" span={1}>
          <div style={{ display: "flex", gap: 6 }}>
            <TI value={form.ayFrom} onChange={v => set({ ayFrom: v })} placeholder="2019-20" />
            <span style={{ alignSelf: "center", color: "#605e5c" }}>to</span>
            <TI value={form.ayTo} onChange={v => set({ ayTo: v })} placeholder="2024-25" />
          </div>
        </Field>
      </div>
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3 — Accused & Suspects
// ─────────────────────────────────────────────────────────────────────────
function PersonTable({ title, rows, onChange, includePassport }) {
  const setRow = (i, patch) => onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r));
  const add = () => onChange([...rows, blankAccused()]);
  const del = (i) => onChange(rows.filter((_, j) => j !== i));
  return (
    <div className="lf-persontable">
      <div className="lf-persontable-hd">
        <span>{title} <span className="lf-count">{rows.length}</span></span>
        <Btn variant="primary" onClick={add}>+ Add row</Btn>
      </div>
      <div className="lf-table-scroll">
        <table className="lf-ptable">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th style={{ minWidth: 140 }}>Name</th>
              <th style={{ minWidth: 140 }}>Father's / Mother's name</th>
              <th style={{ minWidth: 220 }}>Address</th>
              <th style={{ width: 150 }}>Aadhaar / PAN / Other</th>
              {includePassport && <th style={{ width: 110 }}>Passport No.</th>}
              <th style={{ width: 110 }}>PAN (for L2)</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={includePassport ? 8 : 7} className="lf-empty">No rows — click + Add row.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="num">{i + 1}</td>
                <td><TI value={r.name} onChange={v => setRow(i, { name: v })} placeholder="Accused A" /></td>
                <td><TI value={r.fatherName} onChange={v => setRow(i, { fatherName: v })} placeholder="S/o ____" /></td>
                <td><TI value={r.address} onChange={v => setRow(i, { address: v })} placeholder="V.&P.O. ____, Distt. ____" /></td>
                <td><TI value={r.id} onChange={v => setRow(i, { id: v })} placeholder="Aadhaar XXXX-XXXX-1234" /></td>
                {includePassport && <td><TI value={r.passport} onChange={v => setRow(i, { passport: v })} placeholder="P1234567" /></td>}
                <td><TI value={r.pan} onChange={v => setRow(i, { pan: v })} placeholder="ABCDE1234F" /></td>
                <td><Btn variant="danger" onClick={() => del(i)} title="Remove this row">✕</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonsStep({ form, set }) {
  return (
    <CollapsibleSection title="3 · Accused & Suspects" sub="appears in every letter's particulars table" badge={form.accused.length + form.suspects.length}>
      <PersonTable title="Accused (arrested)" rows={form.accused} onChange={v => set({ accused: v })} />
      <PersonTable title="Suspects (under investigation)" rows={form.suspects} onChange={v => set({ suspects: v })} includePassport />
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 4 — Relatives  (all rows add/delete-able; relation is editable)
// ─────────────────────────────────────────────────────────────────────────
function RelativesStep({ form, set }) {
  const rows = form.relatives;
  const setRow = (i, patch) => set({ relatives: rows.map((r, j) => j === i ? { ...r, ...patch } : r) });
  const insertAt = (i, relation = "") => set({ relatives: [...rows.slice(0, i), blankRelative(relation), ...rows.slice(i)] });
  const del = (i) => set({ relatives: rows.filter((_, j) => j !== i) });
  const restore18 = () => {
    if (confirm("Restore the 18 default relations? Existing rows will be replaced.")) {
      set({ relatives: defaultRelativesRows() });
    }
  };
  const filled = rows.filter(r => r.name && r.name.trim()).length;
  return (
    <CollapsibleSection title="4 · Relatives & Associates" sub="every row deletable; relation column editable; insert anywhere" badge={`${filled} filled · ${rows.length} rows`} defaultOpen={false}>
      <div className="lf-rel-bar">
        <Btn variant="primary" onClick={() => insertAt(rows.length)}>+ Add row at end</Btn>
        <Btn onClick={() => insertAt(0)}>+ Add row at top</Btn>
        <Btn onClick={restore18}>↻ Restore 18 default relations</Btn>
        <span style={{ marginLeft: "auto", color: "#605e5c", fontSize: 11 }}>
          Quick check: any cash deposits / property after FIR / property beyond income / frequent transfers / suspected benami?
        </span>
      </div>
      <div className="lf-table-scroll">
        <table className="lf-ptable lf-rel-table">
          <thead>
            <tr>
              <th style={{ width: 26 }}>#</th>
              <th style={{ width: 140 }}>Relation</th>
              <th style={{ minWidth: 130 }}>Name</th>
              <th style={{ minWidth: 130 }}>Father / Husband</th>
              <th style={{ minWidth: 180 }}>Address</th>
              <th style={{ width: 70 }}>Lives w/ accused</th>
              <th style={{ width: 110 }}>Occupation</th>
              <th style={{ width: 90 }}>Income (₹)</th>
              <th style={{ width: 110 }}>Bank(s)</th>
              <th style={{ width: 110 }}>A/c No.</th>
              <th style={{ width: 100 }}>PAN</th>
              <th style={{ minWidth: 140 }}>Property in name</th>
              <th style={{ minWidth: 140 }}>Financial dealings w/ accused</th>
              <th style={{ minWidth: 140 }}>Remarks</th>
              <th style={{ width: 60 }}>Row</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={15} className="lf-empty">No rows. Click "+ Add row" or "Restore 18 default relations".</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="num">{i + 1}</td>
                <td><TI value={r.relation} onChange={v => setRow(i, { relation: v })} placeholder="e.g. Wife / Brother / Friend" /></td>
                <td><TI value={r.name} onChange={v => setRow(i, { name: v })} /></td>
                <td><TI value={r.fatherOrHusband} onChange={v => setRow(i, { fatherOrHusband: v })} /></td>
                <td><TI value={r.address} onChange={v => setRow(i, { address: v })} /></td>
                <td className="num"><input type="checkbox" checked={!!r.livesWith} onChange={e => setRow(i, { livesWith: e.target.checked })} /></td>
                <td><TI value={r.occupation} onChange={v => setRow(i, { occupation: v })} /></td>
                <td><TI value={r.income} onChange={v => setRow(i, { income: v })} /></td>
                <td><TI value={r.bank} onChange={v => setRow(i, { bank: v })} /></td>
                <td><TI value={r.account} onChange={v => setRow(i, { account: v })} /></td>
                <td><TI value={r.pan} onChange={v => setRow(i, { pan: v })} /></td>
                <td><TI value={r.property} onChange={v => setRow(i, { property: v })} /></td>
                <td><TI value={r.financialDealings} onChange={v => setRow(i, { financialDealings: v })} /></td>
                <td><TI value={r.remarks} onChange={v => setRow(i, { remarks: v })} /></td>
                <td className="lf-row-actions">
                  <button className="lf-rowbtn" title="Insert row above" onClick={() => insertAt(i)}>▴</button>
                  <button className="lf-rowbtn" title="Insert row below" onClick={() => insertAt(i + 1)}>▾</button>
                  <button className="lf-rowbtn lf-rowbtn-danger" title="Delete this row" onClick={() => del(i)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 5 — Authorities
// ─────────────────────────────────────────────────────────────────────────
function AuthoritiesStep({ form, set }) {
  const { AUTHORITIES } = window.LETTERS_DATA;
  const setSlot = (lid, k, v) => set({ slotData: { ...form.slotData, [lid]: { ...(form.slotData?.[lid] || {}), [k]: v } } });
  const setRef = (lid, v) => set({ refNo: { ...form.refNo, [lid]: v } });
  const setDays = (lid, v) => set({ perLetterDays: { ...form.perLetterDays, [lid]: Number(v) || 0 } });
  const toggleLetter = (lid) => set({
    selectedLetters: form.selectedLetters.includes(lid)
      ? form.selectedLetters.filter(x => x !== lid)
      : [...form.selectedLetters, lid]
  });

  // Auto-fill every empty slot with its placeholder template. Already-typed
  // values are preserved.
  const autofillAllSlots = () => {
    const next = { ...(form.slotData || {}) };
    AUTHORITIES.forEach(a => {
      if (!a.slots) return;
      const cur = next[a.id] || {};
      const patched = { ...cur };
      a.slots.forEach(slot => {
        if (!patched[slot.id] && slot.placeholder) patched[slot.id] = slot.placeholder;
      });
      next[a.id] = patched;
    });
    set({ slotData: next });
  };
  const fillOne = (a) => {
    const cur = (form.slotData || {})[a.id] || {};
    const patched = { ...cur };
    (a.slots || []).forEach(slot => { if (!patched[slot.id] && slot.placeholder) patched[slot.id] = slot.placeholder; });
    set({ slotData: { ...(form.slotData || {}), [a.id]: patched } });
  };

  return (
    <CollapsibleSection title="5 · Authority-specific details" sub="addresses & reply windows per letter" defaultOpen={false} badge={form.selectedLetters.length + " / " + (AUTHORITIES.length + 1) + " selected"}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 10px' }}>
        <Btn variant="primary" onClick={autofillAllSlots} title="Copy every placeholder template into the addressee slots — only fills empty fields, never overwrites typed values">
          ↻ Auto-fill blank addressee templates
        </Btn>
        <span style={{ fontSize: 11, color: "#605e5c" }}>Drops the placeholder template (with blanks for district / tehsil) into every empty slot. Already-typed values are kept.</span>
      </div>
      <div className="lf-auth-grid">
        {AUTHORITIES.map(a => {
          const selected = form.selectedLetters.includes(a.id);
          return (
            <div key={a.id} className={"lf-auth-card " + (selected ? "on" : "")}>
              <div className="lf-auth-hd">
                <label className="lf-auth-toggle">
                  <input type="checkbox" checked={selected} onChange={() => toggleLetter(a.id)} />
                  <span className="lf-auth-id">{a.id}</span>
                  <span className="lf-auth-title" dangerouslySetInnerHTML={{ __html: a.title }} />
                </label>
                <div className="lf-auth-sub" dangerouslySetInnerHTML={{ __html: a.subtitle }} />
              </div>
              <div className="lf-auth-body">
                <div className="lf-grid lf-grid-2">
                  <Field label="Office Ref. No." span={1}>
                    <TI value={form.refNo?.[a.id] || ""} onChange={v => setRef(a.id, v)} placeholder={`__/${a.code}/${form.fir.no || "FIR"}`} />
                  </Field>
                  <Field label="Reply in (days)" span={1}>
                    <TI type="number" value={form.perLetterDays?.[a.id] ?? a.defaultDays} onChange={v => setDays(a.id, v)} />
                  </Field>
                </div>
                {a.slots?.length > 0 && (
                  <div className="lf-grid lf-grid-1" style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => fillOne(a)} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #d4d4d4', background: '#fff', borderRadius: 3, cursor: 'pointer' }} title="Fill empty slots in this card with the standard addresses">↻ Use suggested</button>
                    </div>
                    {a.slots.map(slot => (
                      <Field key={slot.id} label={<span dangerouslySetInnerHTML={{ __html: slot.label }} />} span={1}>
                        {slot.multiline
                          ? <TA value={form.slotData?.[a.id]?.[slot.id] || ""} onChange={v => setSlot(a.id, slot.id, v)} placeholder={slot.placeholder} />
                          : <TI value={form.slotData?.[a.id]?.[slot.id] || ""} onChange={v => setSlot(a.id, slot.id, v)} placeholder={slot.placeholder} />}
                      </Field>
                    ))}
                  </div>
                )}
                {a.fixedAddress && (
                  <div className="lf-fixedaddr">Address fixed by statute / regulator. No fields to fill.</div>
                )}
              </div>
            </div>
          );
        })}
        <div className={"lf-auth-card " + (form.selectedLetters.includes("L13") ? "on" : "")}>
          <div className="lf-auth-hd">
            <label className="lf-auth-toggle">
              <input type="checkbox" checked={form.selectedLetters.includes("L13")} onChange={() => toggleLetter("L13")} />
              <span className="lf-auth-id" style={{ background: "#7a3aa8" }}>L13</span>
              <span className="lf-auth-title">Annexure — Master Relative Details Form</span>
            </label>
            <div className="lf-auth-sub">Compiled from Step 4; attach as confidential annexure.</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 6 — Custom letter templates
// User can upload .txt / .html / .docx OR paste a body. Placeholders like
// {{fir.no}}, {{accused.name}}, {{station.name}} get auto-filled from form
// data. The custom letter shows up in the popup alongside the 13 built-ins.
// ─────────────────────────────────────────────────────────────────────────
const PLACEHOLDER_HELP = [
  ['{{fir.no}}',           'FIR number'],
  ['{{fir.date}}',         'FIR date (dd-mm-yyyy)'],
  ['{{fir.sections}}',     'NDPS Act sections'],
  ['{{fir.contraband}}',   'Contraband seized'],
  ['{{fir.arrestDate}}',   'Date of arrest'],
  ['{{station.name}}',     'Police station name'],
  ['{{station.district}}', 'District'],
  ['{{station.state}}',    'State'],
  ['{{station.pin}}',      'PIN code'],
  ['{{station.address}}',  'Postal address'],
  ['{{station.phone}}',    'Office phone'],
  ['{{station.email}}',    'Office email'],
  ['{{io.name}}',          'Investigating Officer name'],
  ['{{io.rank}}',          'Officer rank'],
  ['{{io.role}}',          'Officer role / designation'],
  ['{{io.phone}}',         'Officer phone'],
  ['{{io.email}}',         'Officer email'],
  ['{{letterDate}}',       'Letter date (dd-mm-yyyy)'],
  ['{{accused.name}}',     'First accused — name'],
  ['{{accused.fatherName}}', 'First accused — father/mother'],
  ['{{accused.address}}',  'First accused — address'],
  ['{{accused.id}}',       'First accused — Aadhaar/PAN'],
  ['{{accusedList}}',      'Comma-separated names of all accused'],
  ['{{ayFrom}}',           'AY from (for IT)'],
  ['{{ayTo}}',             'AY to (for IT)'],
];

function newCustomTemplateId() {
  return 'CT_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function blankCustomTemplate() {
  return {
    id: newCustomTemplateId(),
    code: 'Custom',
    title: 'New custom letter',
    subtitle: 'Custom template',
    subject: 'Notice under <b>Section 94 BNSS, 2023</b> in connection with FIR No. <b>{{fir.no}}</b>',
    toAddress: 'The ____________,\n____________,\n____________',
    body: '<p>Sir / Madam,</p>\n<p>You are hereby requested to furnish ____________ for the last six (6) years in respect of the above-mentioned persons.</p>',
    defaultDays: 15,
    includeLetterhead: true,
    includeStandardOpening: true,
    includeAccusedTable: true,
    includeTransmission: true,
    includeSignature: true,
    urgent: 'URGENT MATTER / TIME BOUND',
  };
}

function CustomTemplatesStep({ form, set }) {
  const templates = form.customTemplates || [];
  const [helpOpen, setHelpOpen] = lfUseState(false);
  const [editingIdx, setEditingIdx] = lfUseState(null);
  const fileTextRef = lfUseRef(null);
  const fileDocxRef = lfUseRef(null);

  const addAndSelect = (tpl) => {
    set({
      customTemplates: [...templates, tpl],
      selectedLetters: [...(form.selectedLetters || []), tpl.id],
    });
    setEditingIdx(templates.length);
  };
  const updateAt = (i, patch) => set({
    customTemplates: templates.map((t, j) => j === i ? { ...t, ...patch } : t),
  });
  const deleteAt = (i) => {
    if (!confirm('Delete this custom template?')) return;
    const id = templates[i].id;
    set({
      customTemplates: templates.filter((_, j) => j !== i),
      selectedLetters: (form.selectedLetters || []).filter(x => x !== id),
    });
    if (editingIdx === i) setEditingIdx(null);
  };
  const toggleSelected = (id) => set({
    selectedLetters: (form.selectedLetters || []).includes(id)
      ? (form.selectedLetters || []).filter(x => x !== id)
      : [...(form.selectedLetters || []), id]
  });

  const handlePaste = () => {
    addAndSelect(blankCustomTemplate());
  };

  const handleTextFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const tpl = blankCustomTemplate();
      tpl.title = file.name.replace(/\.(txt|html?|md)$/i, '');
      // If file looks like plain text, wrap each paragraph in <p>; if HTML, keep as-is
      tpl.body = /<[a-z][\s\S]*>/i.test(text)
        ? text
        : text.split(/\n\s*\n/).map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`).join('\n');
      addAndSelect(tpl);
    } catch (err) {
      alert('Could not read text file — ' + err.message);
    }
    e.target.value = '';
  };

  const handleDocxFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammothMod = await import('mammoth/mammoth.browser.js');
      const mammoth = mammothMod.default || mammothMod;
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const tpl = blankCustomTemplate();
      tpl.title = file.name.replace(/\.docx$/i, '');
      tpl.body = result.value || '<p>(no content extracted)</p>';
      addAndSelect(tpl);
    } catch (err) {
      console.error(err);
      alert('Could not read .docx — ' + (err.message || err));
    }
    e.target.value = '';
  };

  return (
    <CollapsibleSection
      title="6 · Custom letter templates"
      sub="upload .docx / .txt / .html — placeholders auto-fill from this form"
      badge={templates.length}
      defaultOpen={false}
    >
      <div className="lf-rel-bar">
        <Btn variant="primary" onClick={() => fileDocxRef.current?.click()}>📎 Upload .docx</Btn>
        <Btn onClick={() => fileTextRef.current?.click()}>📄 Upload .txt / .html</Btn>
        <Btn onClick={handlePaste}>✎ Paste / type new template</Btn>
        <Btn onClick={() => setHelpOpen(o => !o)}>{helpOpen ? '▴' : '▾'} Placeholder reference</Btn>
        <input ref={fileTextRef} type="file" accept=".txt,.html,.htm,.md,text/plain,text/html" style={{ display: 'none' }} onChange={handleTextFile} />
        <input ref={fileDocxRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={handleDocxFile} />
      </div>

      {helpOpen && (
        <div className="lf-ct-help">
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--brand-deep)' }}>
            Placeholder reference — paste these anywhere in the body, subject or To-address
          </div>
          <div className="lf-ct-help-grid">
            {PLACEHOLDER_HELP.map(([code, label]) => (
              <div key={code} className="lf-ct-help-row">
                <code>{code}</code>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            Anything you don't include is just left out. Standard letterhead, transmission paragraph and signature
            can be toggled per template. The accused / suspects table is inserted automatically unless you turn it off.
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="lf-ct-empty">
          No custom templates yet. Upload a Word file you already use, paste body text, or start a blank template.
          Use <code>{'{{firNo}}'}</code>-style placeholders to auto-fill from the form.
        </div>
      )}

      {templates.map((tpl, i) => {
        const isOpen = editingIdx === i;
        const selected = (form.selectedLetters || []).includes(tpl.id);
        return (
          <div key={tpl.id} className={"lf-ct-card " + (selected ? 'on' : '')}>
            <div className="lf-ct-card-hd">
              <label className="lf-auth-toggle">
                <input type="checkbox" checked={selected} onChange={() => toggleSelected(tpl.id)} />
                <span className="lf-auth-id" style={{ background: '#7a3aa8' }}>{tpl.id.slice(-4).toUpperCase()}</span>
                <input
                  className="lf-input"
                  value={tpl.title}
                  onChange={e => updateAt(i, { title: e.target.value })}
                  placeholder="Title"
                  style={{ flex: 1, fontWeight: 600 }}
                />
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn onClick={() => setEditingIdx(isOpen ? null : i)}>{isOpen ? '▴ Hide' : '▾ Edit'}</Btn>
                <Btn variant="danger" onClick={() => deleteAt(i)}>✕</Btn>
              </div>
            </div>
            {isOpen && (
              <div className="lf-ct-card-body">
                <div className="lf-grid lf-grid-2">
                  <Field label="Short code (used in filename)" span={1}>
                    <TI value={tpl.code} onChange={v => updateAt(i, { code: v })} placeholder="Custom" />
                  </Field>
                  <Field label="Reply in (days)" span={1}>
                    <TI type="number" value={tpl.defaultDays} onChange={v => updateAt(i, { defaultDays: Number(v) || 15 })} />
                  </Field>
                  <Field label="Urgent banner text" span={2}>
                    <TI value={tpl.urgent} onChange={v => updateAt(i, { urgent: v })} placeholder="URGENT MATTER / TIME BOUND" />
                  </Field>
                  <Field label="Subject line (HTML and placeholders OK)" span={2}>
                    <TA rows={2} value={tpl.subject} onChange={v => updateAt(i, { subject: v })} />
                  </Field>
                  <Field label="To address (one line per row, placeholders OK)" span={2}>
                    <TA rows={4} value={tpl.toAddress} onChange={v => updateAt(i, { toAddress: v })} placeholder="The ____,\n____________" />
                  </Field>
                  <Field label="Body (HTML and placeholders, e.g. {{fir.no}})" hint="add <p>, <ol>, <li> etc. as needed" span={2}>
                    <TA rows={10} value={tpl.body} onChange={v => updateAt(i, { body: v })} />
                  </Field>
                </div>
                <div className="lf-ct-toggles">
                  {['includeLetterhead','includeStandardOpening','includeAccusedTable','includeTransmission','includeSignature'].map(key => (
                    <label key={key} className="lf-ct-toggle">
                      <input type="checkbox" checked={tpl[key] !== false} onChange={e => updateAt(i, { [key]: e.target.checked })} />
                      {key.replace(/^include/, '')}
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: 8 }}>
                  Tip — open the Generate window with this template selected, switch on <b>✎ Edit text</b> to
                  fine-tune wording, then Save as PDF / Word.
                </div>
              </div>
            )}
          </div>
        );
      })}
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Build the caseData object the letter templates need
// ─────────────────────────────────────────────────────────────────────────
function buildCaseData(form) {
  const lh = form.letterhead || {};
  const officer = form.officer || {};
  const station = {
    name:        lh.stationName || "",
    district:    lh.district || "",
    subdivision: lh.subdivision || "",
    state:       lh.state || "",
    pin:         lh.pin || "",
    address:     lh.address || "",
    phone:       lh.phone || "",
    email:       lh.email || "",
    // legacy fields a few templates still reference
    code:        "",
  };
  const io = {
    name:  officer.name  || "",
    rank:  officer.rank  || "",
    role:  officer.role  || "Investigating Officer",
    phone: officer.phone || "",
    email: officer.email || lh.email || "",
  };
  return {
    station,
    letterheadTitles: { govt: lh.govt || "GOVERNMENT OF HIMACHAL PRADESH", dept: lh.dept || "Himachal Pradesh Police" },
    io,
    fir: form.fir,
    accused: (form.accused || []).filter(a => a.name && a.name.trim() !== ""),
    suspects: (form.suspects || []).filter(a => a.name && a.name.trim() !== ""),
    relatives: form.relatives || [],
    letterDate: form.letterDate,
    ayFrom: form.ayFrom,
    ayTo: form.ayTo,
    slotData: form.slotData || {},
    refNo: form.refNo || {},
    perLetterDays: form.perLetterDays || {},
    customTemplates: form.customTemplates || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Toast (for "link copied" etc.)
// ─────────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  lfUseEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className="lf-toast" role="status">{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────
// Share modal — copy URL or open native share
// ─────────────────────────────────────────────────────────────────────────
function ShareModal({ form, onClose, onToast }) {
  const url = lfUseMemo(() => {
    const u = new URL(location.href);
    u.hash = "d=" + encodeForm(form);
    return u.toString();
  }, [form]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); onToast("✓ Link copied to clipboard"); }
    catch {
      // fallback — select the input
      const ip = document.getElementById("lf-share-url");
      if (ip) { ip.select(); document.execCommand("copy"); onToast("✓ Link copied"); }
    }
  };
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "NDPS Letters · Pre-filled form", text: "Open this link to view the pre-filled NDPS letters form.", url });
        onToast("✓ Shared");
      } catch {/* user cancelled */}
    } else {
      copy();
    }
  };
  const sizeKb = (new Blob([url])).size / 1024;
  return (
    <div className="lf-modal-back" onClick={(e) => { if (e.target.classList.contains("lf-modal-back")) onClose(); }}>
      <div className="lf-modal">
        <div className="lf-modal-hd">
          <div className="lf-modal-title">🔗  Share this form</div>
          <button className="lf-modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="lf-modal-body">
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
            This link includes <b>all of your form data</b> in its address. Open it on any device — phone,
            laptop, station computer — and the form will load pre-filled. Nothing is uploaded; the data
            travels with the URL itself.
          </p>
          <input id="lf-share-url" type="text" readOnly className="lf-input" value={url}
                 onFocus={(e) => e.target.select()}
                 style={{ marginBottom: 10, fontFamily: "'Roboto Mono', monospace", fontSize: 11 }} />
          <div className="lf-share-meta">
            <span>Size: <b>{sizeKb.toFixed(1)} KB</b></span>
            <span>Format: <b>UTF-8 base64 in URL hash</b></span>
            <span>Privacy: <b>data never leaves the browser</b></span>
          </div>
          <div className="lf-share-actions">
            <Btn variant="primary" onClick={copy}>📋  Copy link</Btn>
            {typeof navigator !== "undefined" && navigator.share && (
              <Btn onClick={nativeShare}>📱  Share via…</Btn>
            )}
            <a className="lf-btn lf-btn-ghost" href={`mailto:?subject=${encodeURIComponent("NDPS Letters · pre-filled form")}&body=${encodeURIComponent("Please open this link to view the pre-filled letters form:\n\n" + url)}`}>✉  Email</a>
            <a className="lf-btn lf-btn-ghost" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent("NDPS Letters — pre-filled form: " + url)}`}>WhatsApp</a>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
            Note — anyone with this link will see every field you've entered. Treat it like a confidential
            file. For absolute privacy use only on devices you control, and clear the link after sharing.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Email helpers — open the user's chosen mail service with the letter as a
// PDF attachment + a pre-filled subject + body. PDF is generated in-browser
// via html2pdf.js (lazy-loaded so it doesn't bloat the initial bundle).
// ─────────────────────────────────────────────────────────────────────────
function buildEmailSubject(authority, caseData) {
  const firNo = caseData.fir?.no || '____';
  const code = authority.code || authority.id;
  return `Section 94 BNSS Notice — FIR No. ${firNo} — ${code}`;
}

function buildEmailBody(authority, caseData) {
  const fir = caseData.fir || {};
  const stn = caseData.station || {};
  const io  = caseData.io || {};
  const days = caseData.perLetterDays?.[authority.id] ?? authority.defaultDays ?? 15;
  const contactLine = [
    io.phone ? `Mobile: ${io.phone}` : null,
    io.email ? `Email: ${io.email}` : null,
  ].filter(Boolean).join(' · ');
  return `Sir / Madam,

Please find attached an official communication dated ${caseData.letterDate || '____'} in connection with FIR No. ${fir.no || '____'} dated ${fir.date || '____'} registered at ${stn.name || 'Police Station ____'} under Sections ${fir.sections || '____'} of the NDPS Act, 1985.

The investigation is being conducted under Chapter VA (Forfeiture of Illegally Acquired Property) of the NDPS Act. The information, records, and documents listed in the attached notice may kindly be furnished within ${days} days from the date of receipt.

For any clarification, please contact the undersigned.

Yours faithfully,
${io.name || '____'}
${io.rank ? io.rank + ' · ' : ''}${io.role || 'Investigating Officer'}
${stn.name || ''}${contactLine ? '\n' + contactLine : ''}`;
}

function buildComposeUrl(provider, { to = '', subject = '', body = '' }) {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  const t = encodeURIComponent(to);
  switch (provider) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${t}&su=${s}&body=${b}`;
    case 'outlook':
      return `https://outlook.live.com/owa/?path=/mail/action/compose&to=${t}&subject=${s}&body=${b}`;
    case 'yahoo':
      return `https://compose.mail.yahoo.com/?to=${t}&subject=${s}&body=${b}`;
    case 'mailto':
    default:
      return `mailto:${t}?subject=${s}&body=${b}`;
  }
}

async function generateLetterPdfBlob(letterId, fileName) {
  const html2pdf = (await import('html2pdf.js')).default;
  const wrap = document.querySelector(`.lf-popup-printregion .lf-letter-wrap[data-letter="${letterId}"]`);
  const element = wrap?.querySelector('.ll-page');
  if (!element) throw new Error('Letter not found — open the Generate window first.');
  // Force full opacity & scale on the target wrap so html2canvas captures it
  // at native quality regardless of focus state, then restore.
  const prev = { opacity: wrap.style.opacity, transform: wrap.style.transform };
  wrap.style.opacity = '1';
  wrap.style.transform = 'none';
  try {
    return await html2pdf()
      .set({
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(element)
      .toPdf()
      .get('pdf')
      .then(pdf => pdf.output('blob'));
  } finally {
    wrap.style.opacity = prev.opacity;
    wrap.style.transform = prev.transform;
  }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─────────────────────────────────────────────────────────────────────────
// Word (.doc) export — wraps a single letter's HTML with the MS-Office
// preamble so Word opens it as an editable document, preserving tables,
// bold, headings and the letterhead. Uses the .doc extension + msword MIME
// for maximum compatibility (true .docx would need a heavy library).
// ─────────────────────────────────────────────────────────────────────────
function collectAppCss() {
  return Array.from(document.styleSheets).map(s => {
    try { return Array.from(s.cssRules).map(r => r.cssText).join("\n"); }
    catch { return ""; }
  }).join("\n");
}

function buildWordHtml(letterOuterHtml, title) {
  const css = collectAppCss();
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title.replace(/[<>&]/g, '')}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
@page { size: 210mm 297mm; mso-page-orientation: portrait; margin: 14mm 14mm 14mm 14mm; }
${css}
/* Word-specific tweaks — printable preview, hide watermark image, kill shadows */
.ll-watermark { display: none !important; }
.ll-page { box-shadow: none !important; margin: 0 0 12mm !important; page-break-after: always; }
.ll-page:last-child { page-break-after: auto; }
[contenteditable] { outline: none !important; }
</style>
</head>
<body>
${letterOuterHtml}
</body>
</html>`;
}

function saveLetterAsWord(letterId, fileName) {
  const wrap = document.querySelector(`.lf-popup-printregion .lf-letter-wrap[data-letter="${letterId}"]`);
  const page = wrap?.querySelector('.ll-page');
  if (!page) throw new Error('Letter not found — open the Generate window first.');
  const html = buildWordHtml(page.outerHTML, fileName);
  // BOM helps Word detect UTF-8 reliably
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  downloadBlob(blob, fileName);
}

async function saveLetterAsPdf(letterId, fileName) {
  const blob = await generateLetterPdfBlob(letterId, fileName);
  downloadBlob(blob, fileName);
}

// Stagger multiple downloads so browsers don't dedupe / block them
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function canNativelyShareFiles() {
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false;
  try {
    const probe = new File([new Blob(['x'], { type: 'application/pdf' })], 'probe.pdf', { type: 'application/pdf' });
    return navigator.canShare({ files: [probe] });
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────
// Send Email dialog — chooser + pre-filled subject/body + PDF generation
// ─────────────────────────────────────────────────────────────────────────
function SendEmailDialog({ authority, caseData, onClose, onToast }) {
  const [to, setTo] = lfUseState('');
  const [subject, setSubject] = lfUseState(buildEmailSubject(authority, caseData));
  const [body, setBody] = lfUseState(buildEmailBody(authority, caseData));
  const [working, setWorking] = lfUseState(false);
  const [error, setError] = lfUseState('');
  const fileName = `${authority.id}_${authority.code || 'letter'}_${(caseData.fir.no || 'FIR').replace(/\//g, '-')}.pdf`;
  const shareFiles = lfUseMemo(canNativelyShareFiles, []);

  const handleSend = async (provider) => {
    setWorking(true); setError('');
    try {
      const blob = await generateLetterPdfBlob(authority.id, fileName);

      if (provider === 'native') {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        await navigator.share({ title: subject, text: body, files: [file] });
        onToast && onToast('✓ Shared via system');
        onClose();
        return;
      }

      // For all webmail / mailto providers: download + open compose URL.
      downloadBlob(blob, fileName);
      const composeUrl = buildComposeUrl(provider, { to, subject, body });
      window.open(composeUrl, '_blank', 'noopener,noreferrer');
      onToast && onToast(`✓ ${fileName} downloaded — attach it in the compose window`);
      onClose();
    } catch (e) {
      // AbortError = user cancelled the share sheet; not really an error.
      if (e && e.name === 'AbortError') { setWorking(false); return; }
      console.error('email send failed:', e);
      setError(e.message || 'Could not generate PDF');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="lf-modal-back" onClick={(e) => { if (e.target.classList.contains('lf-modal-back')) onClose(); }}>
      <div className="lf-modal" style={{ maxWidth: 640 }}>
        <div className="lf-modal-hd">
          <div className="lf-modal-title">📧 Send by email · {authority.id} · <span dangerouslySetInnerHTML={{ __html: authority.title }} /></div>
          <button className="lf-modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="lf-modal-body">
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            Pick your mail service below. The letter will be generated as a PDF and
            downloaded; the compose window opens with the subject and body already
            filled in. <b>On mobile</b>, the <b>Share…</b> option attaches the PDF
            automatically.
          </p>
          <div className="lf-grid lf-grid-1">
            <Field label="Recipient email" hint="optional — pre-fills the 'To' field">
              <TI value={to} onChange={setTo} placeholder="recipient@example.in" />
            </Field>
            <Field label="Subject"><TI value={subject} onChange={setSubject} /></Field>
            <Field label="Email body (edit as needed)"><TA value={body} onChange={setBody} rows={10} /></Field>
          </div>
          {error && <div style={{ background: 'var(--bad-soft)', color: 'var(--bad)', padding: 10, borderRadius: 6, fontSize: 12, marginTop: 10, fontWeight: 500 }}>{error}</div>}
          <div style={{ marginTop: 14, padding: 12, background: 'var(--brand-acc-soft)', border: '1px dashed var(--brand-acc)', borderRadius: 8, fontSize: 11.5, color: 'var(--brand-deep)', lineHeight: 1.55 }}>
            <b>What happens next:</b> the PDF downloads to your computer, then a new
            tab opens for your chosen mail service. <b>Drag the PDF from the
            downloads bar into the compose window</b> (or use the paperclip / attach
            button), then add the recipient and send. The subject and body are
            already in place.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
            <Btn variant="primary" onClick={() => handleSend('gmail')} disabled={working}>
              {working ? 'Preparing PDF…' : '📨 Gmail'}
            </Btn>
            <Btn onClick={() => handleSend('outlook')} disabled={working}>Outlook</Btn>
            <Btn onClick={() => handleSend('yahoo')} disabled={working}>Yahoo Mail</Btn>
            <Btn onClick={() => handleSend('mailto')} disabled={working}>Default Mail App</Btn>
            {shareFiles && (
              <Btn onClick={() => handleSend('native')} disabled={working}>📱 Share…</Btn>
            )}
            <div style={{ flex: 1 }} />
            <Btn onClick={onClose} disabled={working}>Cancel</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Memoised letter renderer — built-ins + custom templates. Memoising keeps
// the underlying DOM stable as long as caseData identity doesn't change, so
// contentEditable edits made by the user inside the popup are not wiped by
// re-renders triggered by sidebar / focus / hide-sent toggles.
// ─────────────────────────────────────────────────────────────────────────
const LetterBody = React.memo(function LetterBody({ id, caseData, customTemplates }) {
  if (typeof id === 'string' && id.startsWith('CT_')) {
    const tpl = (customTemplates || []).find(t => t.id === id);
    if (!tpl) return null;
    const Custom = window.LETTER_CUSTOM_RENDERER;
    return <Custom caseData={caseData} template={tpl} />;
  }
  const Comp = window.LETTER_COMPONENTS[id];
  if (!Comp) return null;
  return <Comp caseData={caseData} />;
});

// ─────────────────────────────────────────────────────────────────────────
// Pop-up Letters Window
// ─────────────────────────────────────────────────────────────────────────
function LettersPopup({ form, set, onClose, onToast }) {
  const caseData = lfUseMemo(() => buildCaseData(form), [form]);
  const builtIn = window.LETTERS_DATA.AUTHORITIES.concat([{ id: "L13", code: "Relatives", title: "Annexure · Master Relative Details", subtitle: "Confidential annexure to every outgoing letter" }]);
  const customs = (form.customTemplates || []).map(t => ({ id: t.id, code: t.code || 'Custom', title: t.title || 'Custom letter', subtitle: t.subtitle || 'Custom template', isCustom: true }));
  const all = builtIn.concat(customs);
  const selectedAll = all.filter(a => form.selectedLetters.includes(a.id));
  const [focus, setFocus] = lfUseState(selectedAll[0]?.id);
  const [showSidebar, setShowSidebar] = lfUseState(true);
  const [editSentFor, setEditSentFor] = lfUseState(null);
  const [emailFor, setEmailFor] = lfUseState(null);
  const [hideSent, setHideSent] = lfUseState(false);
  const [editMode, setEditMode] = lfUseState(false);
  const [savingAll, setSavingAll] = lfUseState(false);
  const sentLog = form.sentLog || {};
  const visibleAll = hideSent ? selectedAll.filter(a => !sentLog[a.id]?.sent) : selectedAll;

  const safeFileBase = (a) => {
    const code = a?.code || a?.id || 'letter';
    const fir = (caseData.fir.no || 'FIR').replace(/[\\\/:*?"<>|]/g, '-');
    return `${a.id}_${code}_${fir}`.replace(/\s+/g, '_');
  };

  // ── Save handlers ──────────────────────────────────────────────
  const saveOnePdf = async (a) => {
    try {
      await saveLetterAsPdf(a.id, `${safeFileBase(a)}.pdf`);
      onToast && onToast(`✓ ${a.id} saved as PDF`);
    } catch (e) { console.error(e); onToast && onToast('✗ PDF save failed — ' + e.message); }
  };
  const saveOneWord = (a) => {
    try {
      saveLetterAsWord(a.id, `${safeFileBase(a)}.doc`);
      onToast && onToast(`✓ ${a.id} saved as Word`);
    } catch (e) { console.error(e); onToast && onToast('✗ Word save failed — ' + e.message); }
  };
  const saveAllPdf = async () => {
    setSavingAll(true);
    try {
      for (let i = 0; i < selectedAll.length; i++) {
        const a = selectedAll[i];
        await saveLetterAsPdf(a.id, `${safeFileBase(a)}.pdf`);
        await delay(350);
      }
      onToast && onToast(`✓ Saved ${selectedAll.length} PDFs (one per letter)`);
    } catch (e) { console.error(e); onToast && onToast('✗ Save all failed — ' + e.message); }
    finally { setSavingAll(false); }
  };
  const saveAllWord = async () => {
    setSavingAll(true);
    try {
      for (let i = 0; i < selectedAll.length; i++) {
        const a = selectedAll[i];
        saveLetterAsWord(a.id, `${safeFileBase(a)}.doc`);
        await delay(250);
      }
      onToast && onToast(`✓ Saved ${selectedAll.length} Word files (one per letter)`);
    } catch (e) { console.error(e); onToast && onToast('✗ Save all failed — ' + e.message); }
    finally { setSavingAll(false); }
  };

  const markSent = (lid, patch) => {
    const cur = sentLog[lid] || {};
    set({ sentLog: { ...sentLog, [lid]: { ...cur, ...patch } } });
  };

  // Direct print: window.print() must be called from a user gesture, so we
  // toggle the CSS class synchronously and call print() in the same tick.
  // (No setTimeout / debounce — that breaks the gesture chain on some
  //  browsers, which used to leave the user stuck having to download HTML.)
  const printOne = () => {
    document.body.classList.add("lf-printing-one");
    document.documentElement.dataset.printOnly = focus;
    try { window.print(); }
    finally {
      document.body.classList.remove("lf-printing-one");
      delete document.documentElement.dataset.printOnly;
    }
  };
  const printAll = () => {
    document.body.classList.add("lf-printing-all");
    try { window.print(); }
    finally { document.body.classList.remove("lf-printing-all"); }
  };
  const printUnsent = () => {
    const wraps = document.querySelectorAll('.lf-popup-printregion .lf-letter-wrap');
    const hidden = [];
    wraps.forEach(w => {
      const id = w.dataset.letter;
      if (sentLog[id]?.sent) { hidden.push(w); w.style.display = 'none'; }
    });
    document.body.classList.add('lf-printing-all');
    try { window.print(); }
    finally {
      document.body.classList.remove('lf-printing-all');
      hidden.forEach(w => w.style.display = '');
    }
  };

  const downloadHtml = () => {
    const node = document.querySelector(".lf-popup-printregion");
    const css = Array.from(document.styleSheets).map(s => {
      try { return Array.from(s.cssRules).map(r => r.cssText).join("\n"); }
      catch { return ""; }
    }).join("\n");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>NDPS Letters</title><style>${css}\n@page{size:A4;margin:14mm}body{background:#fff}.lf-popup-chrome,.lf-popup-side{display:none!important}.ll-page{box-shadow:none;margin:0 auto;page-break-after:always}</style></head><body><div class="lf-popup-printregion">${node ? node.innerHTML : ""}</div></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `NDPS_Letters_${caseData.station.code}_FIR-${(caseData.fir.no || "").replace(/\//g, "-")}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    onToast && onToast("✓ Bundle downloaded — open in Word / Save as PDF");
  };

  return (
    <div className="lf-popup-back" onClick={(e) => { if (e.target.classList.contains("lf-popup-back")) onClose(); }}>
      <div className="lf-popup">
        <header className="lf-popup-chrome">
          <div className="lf-popup-tab">
            <button className="lf-popup-mobilebar" title="Show letter list" onClick={() => setShowSidebar(s => !s)}>☰</button>
            <div className="lf-popup-dot" />
            <div className="lf-popup-titles">
              <div className="lf-popup-title">Letters Window · NDPS Financial Investigation</div>
              <div className="lf-popup-sub">
                {caseData.station.name} &nbsp;·&nbsp; FIR No. {caseData.fir.no || "—"} &nbsp;·&nbsp; By {caseData.io.name || "(officer)"}
                &nbsp;·&nbsp; {selectedAll.length} letters
              </div>
            </div>
          </div>
          <div className="lf-popup-actions">
            <Btn variant={editMode ? 'primary' : 'ghost'} onClick={() => setEditMode(e => !e)} title="Toggle direct editing of letter content">
              {editMode ? '🔓 Editing on' : '✎ Edit text'}
            </Btn>
            <Btn variant="primary" onClick={printOne}>🖨 Print this</Btn>
            <Btn onClick={printAll}>📄 Print all ({selectedAll.length})</Btn>
            <Btn onClick={() => printUnsent()}>📤 Print unsent</Btn>
            <Btn variant="primary" onClick={() => { const a = selectedAll.find(x => x.id === focus); if (a) saveOnePdf(a); }} disabled={savingAll}>💾 PDF (this)</Btn>
            <Btn variant="primary" onClick={() => { const a = selectedAll.find(x => x.id === focus); if (a) saveOneWord(a); }} disabled={savingAll}>📝 Word (this)</Btn>
            <Btn onClick={saveAllPdf} disabled={savingAll}>{savingAll ? 'Saving…' : `💾 PDF × ${selectedAll.length}`}</Btn>
            <Btn onClick={saveAllWord} disabled={savingAll}>{savingAll ? 'Saving…' : `📝 Word × ${selectedAll.length}`}</Btn>
            <Btn onClick={onClose}>✕ Close</Btn>
          </div>
        </header>
        <div className="lf-popup-body" data-sidebar={showSidebar ? "on" : "off"}>
          <aside className="lf-popup-side">
            <div className="lf-popup-side-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Letters · click to focus</span>
              <label style={{ fontSize: 10, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={hideSent} onChange={e => setHideSent(e.target.checked)} />
                Hide sent
              </label>
            </div>
            <ul className="lf-popup-list">
              {visibleAll.map(a => {
                const sl = sentLog[a.id] || {};
                return (
                  <li key={a.id} className={focus === a.id ? "on" : ""} onClick={() => { setFocus(a.id); if (window.innerWidth < 700) setShowSidebar(false); }} style={{ position: 'relative' }}>
                    <span className="id">{a.id}</span>
                    <span className="t" dangerouslySetInnerHTML={{ __html: a.title }} />
                    {sl.sent && (
                      <div style={{ fontSize: 10, color: '#0a6e2a', marginTop: 2, paddingLeft: 30 }}>
                        ✓ Sent {sl.date} {sl.dispatchNo && <>· {sl.dispatchNo}</>}
                      </div>
                    )}
                    <div style={{ position: 'absolute', right: 6, top: 6, display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEmailFor(a); }}
                        title="Send this letter by email (Gmail / Outlook / …)"
                        style={{ background: '#fff', color: 'var(--brand-deep)', border: '1px solid var(--brand-acc)', borderRadius: 3, fontSize: 10, padding: '1px 7px', cursor: 'pointer', fontWeight: 600 }}
                      >📧 Email</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditSentFor(editSentFor === a.id ? null : a.id); }}
                        title={sl.sent ? 'Edit dispatch details' : 'Mark this letter as sent'}
                        style={{ background: sl.sent ? '#0a6e2a' : '#fff', color: sl.sent ? '#fff' : '#0a6e2a', border: '1px solid ' + (sl.sent ? '#0a6e2a' : '#c6efce'), borderRadius: 3, fontSize: 10, padding: '1px 6px', cursor: 'pointer' }}
                      >{sl.sent ? '✓' : 'Mark sent'}</button>
                    </div>
                    {editSentFor === a.id && (
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: 6, padding: 8, background: '#fff', border: '1px solid #ece7da', borderRadius: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <label style={{ fontSize: 10, color: '#605e5c', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={!!sl.sent} onChange={e => markSent(a.id, { sent: e.target.checked, date: sl.date || new Date().toISOString().slice(0, 10) })} />
                          <span>Mark as despatched</span>
                        </label>
                        <label style={{ fontSize: 10, color: '#605e5c' }}>
                          Despatch date
                          <input type="date" value={sl.date || ''} onChange={e => markSent(a.id, { date: e.target.value })} style={{ width: '100%', fontSize: 11, padding: 2, border: '1px solid #d4d4d4', borderRadius: 2 }} />
                        </label>
                        <label style={{ fontSize: 10, color: '#605e5c' }}>
                          Despatch No.
                          <input type="text" value={sl.dispatchNo || ''} onChange={e => markSent(a.id, { dispatchNo: e.target.value })} placeholder="No. xxx/PS-Code/Year" style={{ width: '100%', fontSize: 11, padding: 2, border: '1px solid #d4d4d4', borderRadius: 2 }} />
                        </label>
                        <button onClick={() => setEditSentFor(null)} style={{ gridColumn: 'span 2', fontSize: 10, padding: 4, border: '1px solid #d4d4d4', background: '#fff', borderRadius: 2, cursor: 'pointer' }}>Done</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="lf-popup-side-foot">
              <div>{selectedAll.filter(a => sentLog[a.id]?.sent).length} of {selectedAll.length} marked sent.</div>
              <div style={{ marginTop: 6 }}><i>Print unsent only</i> sends only letters not yet despatched.</div>
            </div>
          </aside>
          <main className="lf-popup-main">
            {editMode && (
              <div className="lf-editbar">
                ✎ Edit mode is ON — click any text in a letter to edit. Changes are kept until you close this window; save as PDF / Word to keep them permanently.
              </div>
            )}
            <div className={"lf-popup-printregion " + (editMode ? 'is-editing' : '')}>
              {selectedAll.map(a => (
                <div
                  key={a.id}
                  className={"lf-letter-wrap " + (focus === a.id ? "is-focus" : "is-other")}
                  data-letter={a.id}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  spellCheck={editMode}
                  onClick={() => setFocus(a.id)}
                >
                  <LetterBody id={a.id} caseData={caseData} customTemplates={form.customTemplates} />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
      {emailFor && <SendEmailDialog authority={emailFor} caseData={caseData} onClose={() => setEmailFor(null)} onToast={onToast} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Top-level app
// ─────────────────────────────────────────────────────────────────────────
function LettersApp() {
  const [form, setForm] = lfUseState(loadForm);
  const [popup, setPopup] = lfUseState(false);
  const [share, setShare] = lfUseState(false);
  const [toast, setToast] = lfUseState("");
  const [showHashLoaded, setShowHashLoaded] = lfUseState(!!readHashForm());

  const { STATIONS, AUTHORITIES } = window.LETTERS_DATA;

  // persist to localStorage (debounced)
  lfUseEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [form]);

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const reset = () => {
    if (confirm("Reset the entire form? This clears all entered data.")) {
      setForm(defaultForm());
      // clear hash so the link no longer "preloads"
      history.replaceState(null, "", location.pathname + location.search);
      setShowHashLoaded(false);
    }
  };
  // (Sample/demo data removed — this tool is for the whole Himachal Pradesh
  //  Police. Every officer enters their own station and case details.)

  const ready = {
    firOK: !!(form.fir.no && form.fir.date && form.fir.sections),
    accusedOK: form.accused.some(a => a.name && a.name.trim()),
    officerOK: !!(form.officer?.name && form.officer.name.trim()),
    selectedOK: form.selectedLetters.length > 0,
  };
  const allReady = ready.firOK && ready.accusedOK && ready.officerOK && ready.selectedOK;

  return (
    <div className="lf-shell">
      <header className="lf-topbar">
        <div className="lf-topbar-l">
          <img src="/HPP.png" alt="Himachal Pradesh Police" style={{ width: 56, height: 56, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
          <div>
            <div className="lf-topbar-title">NDPS Financial Investigation · Letters Generator</div>
            <div className="lf-topbar-sub">
              Himachal Pradesh Police &nbsp;·&nbsp; हिमाचल प्रदेश पुलिस &nbsp;·&nbsp;
              Ch. V-A NDPS Act, 1985 &nbsp;·&nbsp; § 94 BNSS, 2023
            </div>
          </div>
        </div>
        <div className="lf-topbar-r">
          <Btn onClick={() => setShare(true)} title="Create a shareable URL containing this form's data">🔗 Share link</Btn>
          <Btn onClick={reset}>⌫ Reset</Btn>
          <Btn variant="primary" disabled={!allReady} onClick={() => setPopup(true)}>
            📄 Generate {form.selectedLetters.length} →
          </Btn>
        </div>
      </header>

      {showHashLoaded && (
        <div className="lf-hashbar">
          🔗  Form loaded from a shared link. Edits stay on this device — share again to send your changes.
          <button onClick={() => setShowHashLoaded(false)} className="lf-hashbar-x">✕</button>
        </div>
      )}

      <div className="lf-main">
        <div className="lf-form">
          <StationStep form={form} set={set} />
          <FirStep form={form} set={set} />
          <PersonsStep form={form} set={set} />
          <RelativesStep form={form} set={set} />
          <AuthoritiesStep form={form} set={set} />
          <CustomTemplatesStep form={form} set={set} />

          <div className="lf-cta">
            <div className="lf-cta-l">
              <div className={"lf-cta-stat " + (ready.officerOK ? "ok" : "bad")}>{ready.officerOK ? "✓" : "✗"} Officer name</div>
              <div className={"lf-cta-stat " + (ready.firOK ? "ok" : "bad")}>{ready.firOK ? "✓" : "✗"} FIR particulars</div>
              <div className={"lf-cta-stat " + (ready.accusedOK ? "ok" : "bad")}>{ready.accusedOK ? "✓" : "✗"} At least one accused</div>
              <div className={"lf-cta-stat " + (ready.selectedOK ? "ok" : "bad")}>{ready.selectedOK ? "✓" : "✗"} {form.selectedLetters.length} letters</div>
            </div>
            <Btn variant="primary" disabled={!allReady} onClick={() => setPopup(true)}>
              📄 Generate {form.selectedLetters.length} letters →
            </Btn>
          </div>
        </div>

        <aside className="lf-preview">
          <div className="lf-preview-hd">
            <div className="lf-preview-title">Live preview</div>
            <div className="lf-preview-sub">First selected letter — full view opens when you click <b>Generate</b>.</div>
          </div>
          <div className="lf-preview-frame">
            {(() => {
              const firstId = form.selectedLetters[0];
              if (!firstId) return <div style={{ padding: 40, textAlign: "center", color: "#605e5c" }}>Select at least one authority in Step 5 or add a custom template in Step 6.</div>;
              const cd = buildCaseData(form);
              if (typeof firstId === 'string' && firstId.startsWith('CT_')) {
                const tpl = (form.customTemplates || []).find(t => t.id === firstId);
                if (!tpl) return <div style={{ padding: 40, textAlign: "center", color: "#605e5c" }}>Custom template not found.</div>;
                const Custom = window.LETTER_CUSTOM_RENDERER;
                return <Custom caseData={cd} template={tpl} />;
              }
              const Comp = window.LETTER_COMPONENTS[firstId];
              if (!Comp) return <div style={{ padding: 40, textAlign: "center", color: "#605e5c" }}>Select at least one authority in Step 5.</div>;
              return <Comp caseData={cd} />;
            })()}
          </div>
        </aside>
      </div>

      {popup && <LettersPopup form={form} set={set} onClose={() => setPopup(false)} onToast={setToast} />}
      {share && <ShareModal form={form} onClose={() => setShare(false)} onToast={setToast} />}
      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

window.LettersApp = LettersApp;
