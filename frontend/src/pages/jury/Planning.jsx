import { useState, useEffect } from "react";
import api from "../../services/api";
import { CalendarDays, Search, Calendar } from "lucide-react";

function getCountdownStatus(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soutenanceDate = new Date(dateStr);
  soutenanceDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((soutenanceDate - today) / (1000 * 60 * 60 * 24));
  if (days === 0) return { status: "today", label: "Aujourd'hui", days: 0 };
  if (days < 0) return { status: "done", label: "Terminé", days };
  return { status: "pending", label: `Dans ${days} jour${days > 1 ? "s" : ""}`, days };
}

function isSoutenanceTimePassed(dateStr) {
  return new Date() >= new Date(dateStr);
}

function roleLabel(r) {
  return r === "president" ? "Président" : r === "encadreur" ? "Encadrant" : "3ème Membre";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const FILTERS = ["Tous", "Aujourd'hui", "À venir", "Cette semaine", "Terminés"];

const ROLE_STYLES = {
  president: { stripe: "#7c3aed", badge: { background: "#EEEDFE", color: "#3C3489" } },
  encadreur: { stripe: "#10b981", badge: { background: "#EAF3DE", color: "#27500A" } },
  membre:    { stripe: "#9ca3af", badge: { background: "#f3f4f6", color: "#6b7280" } },
};

const STATUS_STYLES = {
  today:   { background: "#FAEEDA", color: "#633806" },
  pending: { background: "#E6F1FB", color: "#0C447C" },
  done:    { background: "#f3f4f6", color: "#9ca3af" },
};

function RoleStripe({ role }) {
  const color = ROLE_STYLES[role]?.stripe ?? ROLE_STYLES.membre.stripe;
  return (
    <div style={{
      width: 3, borderRadius: 3, alignSelf: "stretch", flexShrink: 0, background: color
    }} />
  );
}

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role]?.badge ?? ROLE_STYLES.membre.badge;
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700,
    }}>
      {roleLabel(role)}
    </span>
  );
}

function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.done;
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700, ...style
    }}>
      {label}
    </span>
  );
}

function MetaDot({ color }) {
  return <span style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block", flexShrink: 0, background: color }} />;
}

function ActionButton({ s }) {
  const isPresident = s.mon_role === "president";

  if (isPresident && s.note_finale != null)
    return (
      <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, fontWeight: 600, background: "#EAF3DE", color: "#27500A", display: "inline-flex", alignItems: "center", gap: 5 }}>
        Noté : {s.note_finale}/20
      </span>
    );

  if (!isPresident && s.mes_remarques)
    return (
      <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, fontWeight: 600, background: "#EAF3DE", color: "#27500A", display: "inline-flex", alignItems: "center", gap: 5 }}>
        Remarques envoyées
      </span>
    );

  if (s.date_soutenance && !isSoutenanceTimePassed(s.date_soutenance))
    return (
      <button disabled style={{
        fontSize: 11, padding: "6px 12px", borderRadius: 8, fontWeight: 600,
        background: "#f3f4f6", color: "#9ca3af",
        border: "0.5px solid #e5e7eb", cursor: "not-allowed",
        display: "inline-flex", alignItems: "center", gap: 5
      }}>
        Disponible le {formatDateShort(s.date_soutenance)}
      </button>
    );

  return (
    <a href={`/jury/evaluations/${s.id}`} style={{
      fontSize: 11, padding: "6px 12px", borderRadius: 8, fontWeight: 600,
      background: "#7c3aed", color: "white", textDecoration: "none",
      display: "inline-flex", alignItems: "center", gap: 5
    }}>
      {isPresident ? "Noter" : "Remarques"}
    </a>
  );
}

function SoutenanceCard({ s }) {
  const countdown = s.date_soutenance ? getCountdownStatus(s.date_soutenance) : null;

  return (
    <div style={{
      background: "white", border: "0.5px solid #e5e7eb", borderRadius: 12,
      padding: "14px 16px", marginBottom: 7,
      display: "flex", alignItems: "center", gap: 14,
      transition: "border-color 0.15s"
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#d1d5db"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
    >
      <RoleStripe role={s.mon_role} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1033" }}>
            {s.prenom} {s.nom}
          </span>
          <RoleBadge role={s.mon_role} />
          {countdown && <StatusBadge status={countdown.status} label={countdown.label} />}
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.sujet}
        </div>

        {s.date_soutenance && (
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
              <MetaDot color="#7c3aed" />{formatDate(s.date_soutenance)}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
              <MetaDot color="#378ADD" />{formatTime(s.date_soutenance)}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
              <MetaDot color="#E24B4A" />{s.salle}
            </span>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        <ActionButton s={s} />
      </div>
    </div>
  );
}

export default function JuryPlanning() {
  const [soutenances, setSoutenances] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jury/soutenances")
      .then(r => setSoutenances(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = soutenances.filter(s => {
    const matchSearch = !searchTerm.trim() || (
      s.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${s.prenom} ${s.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sujet?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchFilter = (() => {
      if (activeFilter === "Tous" || !s.date_soutenance) return true;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d = new Date(s.date_soutenance); d.setHours(0, 0, 0, 0);
      const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      if (activeFilter === "Aujourd'hui") return diff === 0;
      if (activeFilter === "À venir") return diff > 0;
      if (activeFilter === "Cette semaine") return diff >= 0 && diff <= 7;
      if (activeFilter === "Terminés") return diff < 0;
      return true;
    })();

    return matchSearch && matchFilter;
  });

  const grouped = filtered.reduce((acc, s) => {
    const key = s.date_soutenance
      ? formatDate(s.date_soutenance)
      : "Sans date";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <CalendarDays size={22} />
            </span>{" "}
            Planning des soutenances
          </h1>
          <p>Vos soutenances assignées et le calendrier d'évaluation</p>
        </div>
      </div>

      <div className="page-content">

        {/* Tip */}
        <div style={{
          background: "#E6F1FB", borderLeft: "3px solid #378ADD", borderRadius: 8,
          padding: "10px 14px", fontSize: 12, color: "#0C447C",
          marginBottom: 20, display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.5
        }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <span>
            Le <strong>Président</strong> saisit la note finale.
            Les autres membres laissent leurs <strong>remarques</strong> après la soutenance.
          </span>
        </div>

        {/* Recherche */}
        <div style={{ position: "relative", maxWidth: 360, marginBottom: 12 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Nom, prénom ou sujet…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 34px",
              border: "0.5px solid #d1d5db", borderRadius: 8,
              fontSize: 13, outline: "none", background: "white", color: "#111827"
            }}
            onFocus={e => e.target.style.borderColor = "#7c3aed"}
            onBlur={e => e.target.style.borderColor = "#d1d5db"}
          />
        </div>

        {/* Chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "4px 12px", borderRadius: 20, border: "0.5px solid",
                fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                fontWeight: activeFilter === f ? 600 : 400,
                background: activeFilter === f ? "#7c3aed" : "white",
                color: activeFilter === f ? "white" : "#6b7280",
                borderColor: activeFilter === f ? "#7c3aed" : "#e5e7eb",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>
          {filtered.length} soutenance{filtered.length > 1 ? "s" : ""}
          {searchTerm && ` · "${searchTerm}"`}
          {activeFilter !== "Tous" && ` · ${activeFilter}`}
        </div>

        {/* Liste ou vide */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb" }}>
            {searchTerm || activeFilter !== "Tous" ? (
              <>
                <Search size={36} color="#ddd6fe" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 12 }}>
                  Aucun résultat
                  {searchTerm && ` pour "${searchTerm}"`}
                  {activeFilter !== "Tous" && ` · filtre "${activeFilter}"`}
                </p>
                <button
                  onClick={() => { setSearchTerm(""); setActiveFilter("Tous"); }}
                  style={{ background: "#7c3aed", border: "none", color: "white", cursor: "pointer", fontSize: 12, padding: "7px 14px", borderRadius: 8 }}
                >
                  Réinitialiser
                </button>
              </>
            ) : (
              <>
                <Calendar size={36} color="#ddd6fe" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "#9ca3af", fontSize: 14 }}>Aucune soutenance assignée</p>
              </>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, items]) => {
            const isToday = items.some(s => s.date_soutenance && getCountdownStatus(s.date_soutenance).status === "today");
            return (
              <div key={dateKey} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#9ca3af",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 8
                }}>
                  {dateKey}{isToday && " — Aujourd'hui"}
                  <span style={{ flex: 1, height: "0.5px", background: "#f3f4f6" }} />
                </div>
                {items.map(s => <SoutenanceCard key={s.id} s={s} />)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}