import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ─── SCHEMA ────────────────────────────────────────────────────────────────
// To add/remove questions: edit SECTIONS below.
// Each field: { k: "unique_key", l: "Label", t: "text"|"area"|"yn" }
// Subsection headers: { t: "sub", l: "Label" }
// Table sections: { n, name, tbl: true, tkey: "storage_key", cols: [...] }

export const SECTIONS = [
  { n: 1, name: "Header", fields: [
    { k: "customer_name", l: "Customer (commercial / DBA name)", t: "text" },
    { k: "industry", l: "Industry / vertical", t: "text" },
    { k: "state", l: "State", t: "text" },
    { k: "timezone", l: "Time zone", t: "text" },
    { k: "primary_contact", l: "Primary contact (name, role, email, phone)", t: "area" },
    { k: "it_contact", l: "IT / technical contact (name, role, email, phone)", t: "area" },
    { k: "impl_lead", l: "Implementation lead (Laceup side)", t: "text" },
    { k: "erp", l: "Accounting / ERP system", t: "text" },
    { k: "golive", l: "Target go-live date", t: "text" },
    { k: "num_users", l: "Number of users (licenses)", t: "text" },
  ]},
  { n: 2, name: "Hardware", fields: [
    { t: "sub", l: "Scanners / mobile devices" },
    { k: "sc_qty", l: "Quantity", t: "text" },
    { k: "sc_model", l: "Model(s)", t: "text" },
    { k: "sc_by", l: "Provided by Laceup or client?", t: "text" },
    { t: "sub", l: "Printers" },
    { k: "pr_qty", l: "Quantity", t: "text" },
    { k: "pr_model", l: "Model (default: ZD421)", t: "text" },
    { k: "pr_by", l: "Provided by Laceup or client?", t: "text" },
    { k: "pr_special", l: "Special requests", t: "area" },
    { t: "sub", l: "Labels" },
    { k: "lbl_loc", l: "Location label — dimensions and quantity", t: "text" },
    { k: "lbl_pallet", l: "Pallet label — dimensions and quantity", t: "text" },
    { k: "lbl_pack", l: "Pack label — dimensions and quantity", t: "text" },
    { k: "lbl_custom", l: "Customization details", t: "area" },
  ]},
  { n: 3, name: "Structure", fields: [
    { t: "sub", l: "Warehouse" },
    { k: "wh_erp", l: "Warehouses in accounting system", t: "text" },
    { k: "wh_live", l: "Warehouses going live (codes)", t: "text" },
    { k: "pick_areas", l: "Picking areas (freezer, cooler, dry…)", t: "text" },
    { t: "sub", l: "Slotting definition" },
    { k: "slot_sent", l: "Template sent to client", t: "yn" },
    { k: "slot_recv", l: "Template received back", t: "yn" },
    { k: "slot_file", l: "File location / link", t: "text" },
    { k: "slot_ok", l: "Validated by Laceup", t: "yn" },
    { k: "slot_notes", l: "Notes", t: "area" },
    { t: "sub", l: "Bin structure list" },
    { k: "bin_sent", l: "Template sent to client", t: "yn" },
    { k: "bin_recv", l: "Template received back", t: "yn" },
    { k: "bin_file", l: "File location / link", t: "text" },
    { k: "bin_ok", l: "Validated by Laceup", t: "yn" },
    { k: "bin_notes", l: "Notes", t: "area" },
    { t: "sub", l: "Users & parameters" },
    { k: "users_roles", l: "Users per role", t: "area" },
    { k: "p_lot", l: "Lot tracking", t: "yn" },
    { k: "p_exp", l: "Expiration date tracking", t: "yn" },
    { k: "p_serial", l: "Serial numbers", t: "yn" },
    { k: "p_vpn", l: "Vendor Part Numbers", t: "yn" },
    { k: "p_other", l: "Other parameters", t: "area" },
  ]},
  { n: 4, name: "Integration", fields: [
    { k: "int_system", l: "System name + version", t: "text" },
    { k: "int_method", l: "Integration method (Integrasys / direct API / file-based / manual)", t: "text" },
    { k: "int_hosted", l: "Hosted by (Client / Laceup / third party)", t: "text" },
    { k: "int_test", l: "Test environment available?", t: "yn" },
    { k: "int_voice", l: "Voice picking integration?", t: "yn" },
    { k: "int_apis", l: "Custom APIs", t: "area" },
  ]},
  { n: 5, name: "Master Data", fields: [
    { k: "md_cw", l: "Catch weight items?", t: "yn" },
    { k: "md_pallet_erp", l: "Pallet tracking in ERP?", t: "yn" },
    { k: "md_gs1", l: "GS1 barcodes?", t: "yn" },
    { k: "md_deposit", l: "Deposit items?", t: "yn" },
    { k: "md_multi_code", l: "1 product → more than 1 item code in ERP?", t: "yn" },
    { k: "md_parent", l: "Parent-child relationship in products?", t: "yn" },
  ]},
  { n: 6, name: "Receiving", fields: [
    { k: "r_blind", l: "Blind receiving or against PO?", t: "text" },
    { k: "r_partial", l: "Multiple receipts per PO allowed (partial receiving)?", t: "yn" },
    { k: "r_over", l: "Allow over-receipt?", t: "yn" },
    { k: "r_damaged", l: "Allow receiving damaged items?", t: "yn" },
    { k: "r_cw_scan", l: "Catch weight: scan case by case or by pallet?", t: "text" },
    { k: "r_uom", l: "UOM of POs", t: "text" },
    { k: "r_finalize", l: "Finalize PO from scanner or back office?", t: "text" },
    { k: "r_print", l: "Print label per qty received?", t: "yn" },
    { k: "r_uom_change", l: "Change UOM in receiving allowed?", t: "yn" },
    { k: "r_ind_ir", l: "Individual IR (without PO) allowed?", t: "yn" },
    { k: "r_auto_qty", l: "Auto-populate qty received?", t: "yn" },
    { k: "r_special", l: "Special cases", t: "area" },
  ]},
  { n: 7, name: "Put Away", fields: [
    { k: "pa_who", l: "Who initiates: receiver / separate put-away user?", t: "text" },
  ]},
  { n: 8, name: "Replenishments", fields: [
    { k: "rep_trigger", l: "By allocation / by capacity / both?", t: "text" },
    { k: "rep_gen", l: "Manual vs. automatic generation?", t: "text" },
    { k: "rep_lpn", l: "Scan LPN mandatory?", t: "yn" },
    { k: "rep_pallet", l: "Complete pallets or flow racking?", t: "text" },
    { k: "rep_minmax", l: "Where Min/Max values live (Luna slotting / synced from ERP)", t: "text" },
    { k: "rep_special", l: "Special flows", t: "area" },
  ]},
  { n: 9, name: "Picking", fields: [
    { t: "sub", l: "Sales order source" },
    { k: "pk_src", l: "If Integrasys: Create SO / Load Orders / Summary?", t: "text" },
    { k: "pk_alloc", l: "Use allocation?", t: "yn" },
    { k: "pk_oos", l: "Include out-of-stock items?", t: "yn" },
    { k: "pk_auto", l: "Auto-send to picking?", t: "yn" },
    { t: "sub", l: "Picking structures" },
    { k: "pk_struct", l: "Picking structures? Pallet cart?", t: "text" },
    { k: "pk_sep_bulk", l: "Separate / bulk / consolidate?", t: "text" },
    { k: "pk_by", l: "Pick by structure or by order/summary?", t: "text" },
    { k: "pk_logic", l: "Logic to summarize or keep separate", t: "area" },
    { k: "pk_struct_logic", l: "If by structure: logic to build structure", t: "area" },
    { k: "pk_to_same", l: "Transfer Orders picked with same logic as Sales Orders?", t: "yn" },
    { k: "pk_bulk", l: "When bulk: maximize structure or prioritize stop sequence?", t: "text" },
    { k: "pk_vol", l: "Bulk logic by total or by area? Units or volume?", t: "text" },
    { t: "sub", l: "Pick mode & validation" },
    { k: "pk_mode", l: "Single Item Pick or regular pick?", t: "text" },
    { k: "pk_add_sub", l: "Add/substitute product in picking?", t: "yn" },
    { k: "pk_verify", l: "Verify all lines required?", t: "yn" },
    { k: "pk_scan_bin", l: "Scan bin location first required?", t: "yn" },
    { k: "pk_scan_pick", l: "Scan to pick required?", t: "yn" },
    { k: "pk_backstock", l: "Allow picking from backstock?", t: "yn" },
    { t: "sub", l: "Picker assignment" },
    { k: "pk_lock", l: "Picklist auto-assigned to picker who starts it (locking)?", t: "yn" },
    { k: "pk_manual", l: "Manual assignment from back office?", t: "yn" },
    { k: "pk_visibility", l: "Picker visibility (All / Assigned+Any / Only Assigned)", t: "text" },
    { t: "sub", l: "Finalization & output" },
    { k: "pk_fin", l: "Auto-finalize completed picklist?", t: "yn" },
    { k: "pk_fin_short", l: "Auto-finalize short picklist?", t: "yn" },
    { k: "pk_print", l: "Print order/pack label? When?", t: "area" },
  ]},
  { n: 10, name: "Shipping / Checker", fields: [
    { k: "sh_checker", l: "Checker step mandatory?", t: "yn" },
    { k: "sh_merge", l: "Merge packs?", t: "yn" },
    { k: "sh_transfer", l: "Transfer packs?", t: "yn" },
    { k: "sh_locations", l: "Multiple shipping locations or just the dock?", t: "text" },
  ]},
  { n: 11, name: "Load Truck", fields: [
    { k: "lt_route_eq", l: "One route = same physical truck always?", t: "yn" },
    { k: "lt_picked", l: "When loading: all orders already picked, or some still in picking?", t: "text" },
    { k: "lt_shipdate", l: "Ship date in ERP reliable for validation?", t: "yn" },
    { k: "lt_alt_date", l: "If not, what date is best for validation?", t: "text" },
    { k: "lt_notes", l: "Any more details", t: "area" },
  ]},
  { n: 12, name: "Transfer Orders", fields: [
    { t: "sub", l: "Picking (outbound leg)" },
    { k: "to_same", l: "Same picking logic as Sales Orders?", t: "yn" },
    { k: "to_diff", l: "If different, describe", t: "area" },
    { k: "to_timing", l: "Shipped right after picking or days after?", t: "text" },
    { t: "sub", l: "Receiving (inbound leg)" },
    { k: "to_recv_more", l: "Non-live → Live: receive more than ordered? Add products?", t: "area" },
    { k: "to_putaway", l: "Put-away during receiving or as separate process?", t: "text" },
    { k: "to_complete", l: "Who completes the TO: scanner user or back office?", t: "text" },
  ]},
  { n: 13, name: "Cycle Count & Adjustments", fields: [
    { k: "cc_who", l: "Who can perform cycle counts: all warehouse users / specific role?", t: "text" },
    { k: "adj_who", l: "Who can create adjustments from back office: all users / specific role?", t: "text" },
  ]},
  { n: 14, name: "Other Configurations", fields: [
    { k: "other", l: "Notes (free text)", t: "area" },
  ]},
  { n: 15, name: "Volume of Data", fields: [
    { k: "v_skus", l: "Active SKUs", t: "text" },
    { k: "v_routes", l: "Number of routes", t: "text" },
    { k: "v_orders", l: "Average orders / day", t: "text" },
    { k: "v_lines_order", l: "Average lines / order", t: "text" },
    { k: "v_pos", l: "Average POs / week", t: "text" },
    { k: "v_lines_po", l: "Average lines / PO", t: "text" },
    { k: "v_pallets", l: "Average pallets received per item in a PO/TO", t: "text" },
    { k: "v_bins", l: "Bin locations (approx.)", t: "text" },
  ]},
  { n: 16, name: "Customizations from Agreement", tbl: true, tkey: "cust_agr", cols: ["#", "Description", "Status", "Notes"] },
  { n: 17, name: "Additional Customizations (Implementation)", tbl: true, tkey: "cust_impl", cols: ["#", "Description", "Quoted?", "Status", "Notes"] },
  { n: 18, name: "Returns", fields: [
    { k: "ret_general", l: "How are returns currently captured in the accounting system?", t: "area" },
    { t: "sub", l: "If DSD Manager" },
    { k: "ret_route_types", l: "House routes and regular routes, or only one type?", t: "text" },
    { k: "ret_transfers", l: "Drivers create transfers to WH? From handheld / back office / not at all?", t: "area" },
    { k: "ret_reasons", l: "Reason codes in DSD handheld? List reasons and inventory effects.", t: "area" },
    { k: "ret_use_rr", l: "Use Route Returns in Laceup?", t: "yn" },
    { k: "ret_autocomplete", l: "If yes: auto-complete on import or manual receiving in scanner?", t: "text" },
    { t: "sub", l: "Other return types" },
    { k: "ret_pack", l: "Pack returns (customer returns at back office)?", t: "yn" },
    { k: "ret_credit", l: "Credit returns?", t: "yn" },
    { k: "ret_item", l: "Item returns (not tied to route or customer)?", t: "yn" },
  ]},
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function countFields(sec, data = {}) {
  if (sec.tbl) {
    const rows = data[sec.tkey] || [];
    const has = rows.some(r => Object.values(r).some(v => v && String(v).trim()));
    return { filled: has ? 1 : 0, total: 1 };
  }
  const flds = (sec.fields || []).filter(f => f.k);
  const filled = flds.filter(f => data[f.k] && String(data[f.k]).trim() !== "").length;
  return { filled, total: flds.length };
}

const G = {
  green: "#1D9E75", greenDark: "#0F6E56", greenLight: "#E1F5EE",
  border: "#e5e7eb", bg: "#f9fafb", white: "#fff",
  text: "#111827", muted: "#6b7280", faint: "#9ca3af",
  danger: "#fef2f2", dangerText: "#b91c1c", dangerBorder: "#fecaca",
  blue: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
};

function btn(bg, color, border) {
  return {
    height: 33, padding: "0 14px", borderRadius: 7, fontSize: 13,
    cursor: "pointer", border: `1px solid ${border || bg}`,
    background: bg, color, display: "inline-flex", alignItems: "center", gap: 5,
    whiteSpace: "nowrap", fontFamily: "inherit",
  };
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────
function YNField({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {["yes", "no"].map(v => (
        <button key={v} onClick={() => onChange(value === v ? "" : v)} style={{
          height: 30, padding: "0 16px", borderRadius: 6, fontSize: 12,
          cursor: "pointer", fontFamily: "inherit",
          border: value === v ? (v === "yes" ? `1px solid ${G.green}` : "1px solid #e24b4a") : `1px solid ${G.border}`,
          background: value === v ? (v === "yes" ? G.greenLight : G.danger) : "transparent",
          color: value === v ? (v === "yes" ? G.greenDark : G.dangerText) : G.muted,
          fontWeight: value === v ? 500 : 400,
        }}>{v === "yes" ? "Yes" : "No"}</button>
      ))}
    </div>
  );
}

function TableSection({ sec, data, onChange }) {
  const rows = (data[sec.tkey] || [{}]);
  const statusOpts = ["", "In progress", "Done", "Blocked"];
  const quotedOpts = ["", "Yes", "No", "TBD"];

  const updateCell = (ri, col, val) => {
    const updated = [...rows];
    if (!updated[ri]) updated[ri] = {};
    updated[ri] = { ...updated[ri], [col.toLowerCase().replace(/\W+/g, "_")]: val };
    onChange(sec.tkey, updated);
  };

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>{sec.cols.map(c => (
              <th key={c} style={{ fontSize: 11, color: G.faint, fontWeight: 500, padding: "6px 8px", borderBottom: `1px solid ${G.border}`, textAlign: "left" }}>{c}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {sec.cols.map((col, ci) => {
                  const k = col.toLowerCase().replace(/\W+/g, "_");
                  const v = row[k] || "";
                  if (col === "#") return <td key={ci} style={{ padding: "3px 6px", width: 32, color: G.faint, fontSize: 12 }}>{ri + 1}</td>;
                  if (col === "Status" || col === "Quoted?") {
                    const opts = col === "Quoted?" ? quotedOpts : statusOpts;
                    return (
                      <td key={ci} style={{ padding: 3 }}>
                        <select value={v} onChange={e => updateCell(ri, col, e.target.value)}
                          style={{ width: "100%", height: 28, fontSize: 12, border: "none", background: "transparent", color: G.text, fontFamily: "inherit" }}>
                          {opts.map(o => <option key={o} value={o}>{o || "—"}</option>)}
                        </select>
                      </td>
                    );
                  }
                  return (
                    <td key={ci} style={{ padding: 3 }}>
                      <input value={v} onChange={e => updateCell(ri, col, e.target.value)}
                        style={{ width: "100%", height: 28, fontSize: 12, border: "none", background: "transparent", color: G.text, padding: "0 4px", fontFamily: "inherit" }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => onChange(sec.tkey, [...rows, {}])} style={{
        marginTop: 8, height: 28, padding: "0 12px", fontSize: 12, cursor: "pointer",
        border: `1px dashed ${G.border}`, borderRadius: 6, background: "transparent",
        color: G.muted, fontFamily: "inherit",
      }}>+ Add row</button>
    </div>
  );
}

function SectionCard({ sec, data, onFieldChange, onTableChange }) {
  const [open, setOpen] = useState(false);
  const { filled, total } = countFields(sec, data);
  const complete = total > 0 && filled === total;

  const inputStyle = {
    width: "100%", height: 34, fontSize: 13,
    border: `1px solid ${G.border}`, borderRadius: 7,
    padding: "0 10px", color: G.text, background: G.white,
    fontFamily: "inherit",
  };
  const areaStyle = {
    ...inputStyle, height: "auto", minHeight: 60,
    padding: "8px 10px", resize: "vertical", lineHeight: 1.5,
  };

  return (
    <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, background: G.white, overflow: "hidden", marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: G.faint, background: G.bg, border: `1px solid ${G.border}`, borderRadius: 5, padding: "2px 7px", minWidth: 24, textAlign: "center" }}>{sec.n}</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: G.text }}>{sec.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {total > 0 && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, fontWeight: 500, background: complete ? G.greenLight : G.bg, color: complete ? G.greenDark : G.faint, border: `1px solid ${complete ? G.green : G.border}` }}>
              {filled} / {total}
            </span>
          )}
          <span style={{ fontSize: 13, color: G.faint, display: "inline-block", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: 16, borderTop: `1px solid ${G.bg}` }}>
          {sec.tbl ? (
            <TableSection sec={sec} data={data} onChange={onTableChange} />
          ) : (
            (sec.fields || []).map((f, i) => {
              if (f.t === "sub") return (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: G.faint, textTransform: "uppercase", letterSpacing: ".05em", marginTop: i > 0 ? 16 : 0, marginBottom: 10, paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? `1px solid ${G.bg}` : "none" }}>{f.l}</div>
              );
              const v = data[f.k] || "";
              return (
                <div key={f.k} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: G.muted, display: "block", marginBottom: 5 }}>{f.l}</label>
                  {f.t === "yn" ? (
                    <YNField value={v} onChange={val => onFieldChange(f.k, val)} />
                  ) : f.t === "area" ? (
                    <textarea value={v} onChange={e => onFieldChange(f.k, e.target.value)} style={areaStyle} />
                  ) : (
                    <input value={v} onChange={e => onFieldChange(f.k, e.target.value)} style={inputStyle} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── ASK CLAUDE PANEL ──────────────────────────────────────────────────────
function AskPanel({ clients, onClose }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const db = JSON.stringify(clients, null, 2);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: "You are a helpful assistant for LaceUp WMS implementation team. Answer questions about the client handoff database concisely and clearly. The database contains client specifications for warehouse management system implementations.",
          messages: [{ role: "user", content: `Client database:\n${db}\n\nQuestion: ${question}` }],
        }),
      });
      const data = await res.json();
      setAnswer(data.content?.[0]?.text || "No response.");
    } catch (e) {
      setAnswer("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ border: `1px solid ${G.blueBorder}`, borderRadius: 10, background: G.blue, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: G.blueText }}>Ask Claude about your clients</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: G.faint, fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 10, lineHeight: 1.6 }}>
        e.g. "How many clients use deposit items?" · "Which clients haven't set a go-live date?" · "What ERP does client X use?"
      </div>
      <textarea
        autoFocus value={question} onChange={e => setQuestion(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
        placeholder="Type your question... (Enter to send)"
        style={{ width: "100%", minHeight: 64, fontSize: 13, border: `1px solid ${G.blueBorder}`, borderRadius: 7, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, background: G.white, color: G.text, marginBottom: 10 }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: answer ? 12 : 0 }}>
        <button onClick={ask} disabled={loading || !question.trim()} style={btn(loading || !question.trim() ? G.border : G.blueText, G.white, loading || !question.trim() ? G.border : G.blueText)}>
          {loading ? "Thinking…" : "Ask ↗"}
        </button>
      </div>
      {answer && (
        <div style={{ background: G.white, border: `1px solid ${G.blueBorder}`, borderRadius: 8, padding: 14, fontSize: 13, color: G.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {answer}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [clients, setClients] = useState([]);   // [{id, name, data}]
  const [curId, setCurId] = useState(null);
  const [newName, setNewName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  // Load all clients on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("clients").select("*").order("name");
      if (data) setClients(data);
      setLoading(false);
    })();
  }, []);

  const curClient = clients.find(c => c.id === curId);
  const clientData = curClient?.data || {};

  const updateField = useCallback((key, val) => {
    setClients(prev => prev.map(c => c.id === curId ? { ...c, data: { ...c.data, [key]: val } } : c));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const cur = clients.find(c => c.id === curId);
      if (!cur) return;
      const newData = { ...cur.data, [key]: val };
      await supabase.from("clients").update({ data: newData, updated_at: new Date().toISOString() }).eq("id", curId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }, [curId, clients]);

  const updateTable = useCallback((tkey, rows) => {
    setClients(prev => prev.map(c => c.id === curId ? { ...c, data: { ...c.data, [tkey]: rows } } : c));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const cur = clients.find(c => c.id === curId);
      if (!cur) return;
      const newData = { ...cur.data, [tkey]: rows };
      await supabase.from("clients").update({ data: newData, updated_at: new Date().toISOString() }).eq("id", curId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }, [curId, clients]);

  const createClient = async () => {
    const name = newName.trim();
    if (!name) return;
    const { data, error } = await supabase.from("clients").insert({ name, data: {} }).select().single();
    if (!error && data) {
      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCurId(data.id);
    }
    setNewName("");
    setShowModal(false);
  };

  const deleteClient = async () => {
    if (!curId || !window.confirm(`Delete "${curClient?.name}"? This cannot be undone.`)) return;
    await supabase.from("clients").delete().eq("id", curId);
    setClients(prev => prev.filter(c => c.id !== curId));
    setCurId(null);
  };

  const totalFilled = SECTIONS.reduce((acc, s) => acc + countFields(s, clientData).filled, 0);
  const totalFields = SECTIONS.reduce((acc, s) => acc + countFields(s, clientData).total, 0);
  const progress = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

  const clientsForAsk = Object.fromEntries(clients.map(c => [c.name, c.data]));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: G.faint, fontFamily: "system-ui, sans-serif" }}>
      Loading…
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: G.bg, minHeight: "100vh" }}>
      {/* Top nav */}
      <div style={{ background: G.white, borderBottom: `1px solid ${G.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: G.text }}>
          Lace<span style={{ color: G.green }}>Up</span>
          <span style={{ color: G.faint, fontWeight: 400, fontSize: 13, marginLeft: 8 }}>/ Client Handoff</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 11, color: G.green }}>✓ Saved</span>}
          <select value={curId || ""} onChange={e => setCurId(e.target.value || null)}
            style={{ height: 33, border: `1px solid ${G.border}`, borderRadius: 7, padding: "0 10px", fontSize: 13, background: G.white, color: G.text, minWidth: 160, fontFamily: "inherit" }}>
            <option value="">— select client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} style={btn(G.green, G.white)}>+ New client</button>
          <button onClick={() => setShowAsk(o => !o)} style={btn(G.blue, G.blueText, G.blueBorder)}>Ask Claude ↗</button>
          {curId && <button onClick={deleteClient} style={btn(G.danger, G.dangerText, G.dangerBorder)}>🗑</button>}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>

        {showAsk && <AskPanel clients={clientsForAsk} onClose={() => setShowAsk(false)} />}

        {!curId ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: G.faint, fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            {clients.length === 0 ? "Create your first client to get started." : "Select a client or create a new one."}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G.faint, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: G.text, fontSize: 14 }}>{curClient?.name}</span>
                <span>{progress}% complete — {totalFilled} / {totalFields} fields</span>
              </div>
              <div style={{ height: 4, background: G.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: G.green, borderRadius: 2, transition: "width .3s" }} />
              </div>
            </div>
            {SECTIONS.map(sec => (
              <SectionCard key={sec.n} sec={sec} data={clientData} onFieldChange={updateField} onTableChange={updateTable} />
            ))}
          </>
        )}
      </div>

      {/* New client modal */}
      {showModal && (
        <div onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: G.white, borderRadius: 12, padding: 24, width: 320, boxShadow: "0 8px 32px rgba(0,0,0,.12)" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 14 }}>New client</div>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createClient()}
              placeholder="Client name…"
              style={{ width: "100%", height: 36, border: `1px solid ${G.border}`, borderRadius: 7, padding: "0 10px", fontSize: 13, color: G.text, fontFamily: "inherit", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={btn("transparent", G.muted, G.border)}>Cancel</button>
              <button onClick={createClient} style={btn(G.green, G.white)}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
