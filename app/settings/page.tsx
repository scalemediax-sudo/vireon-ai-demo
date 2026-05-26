"use client";

import { useEffect, useState } from "react";
import { Building2, Bot, Clock, Bell, Save, Check } from "lucide-react";

const TABS = [
  { id: "clinic",        label: "Clinic Profile",   icon: Building2 },
  { id: "bot",           label: "Bot Settings",      icon: Bot },
  { id: "hours",         label: "Business Hours",    icon: Clock },
  { id: "notifications", label: "Notifications",     icon: Bell },
];

const SERVICES = [
  "General Consultation", "Physiotherapy", "Dermatology",
  "Cardiology", "Orthopedics", "Pediatrics", "Neurology", "ENT",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DayHours = { open: boolean; from: string; to: string };

interface Settings {
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  botName: string;
  greetingMessage: string;
  responseStyle: string;
  language: string;
  services: string[];
  notificationsEnabled: boolean;
  notificationEmail: string;
  dailySummary: boolean;
  unreadAlert: boolean;
  followUpEnabled: boolean;
  reminderEnabled: boolean;
  reEngagementEnabled: boolean;
  businessHours: Record<string, DayHours>;
}

const DEFAULTS: Settings = {
  clinicName: "City Health Clinic",
  clinicPhone: "+91 98765 43210",
  clinicEmail: "info@cityhealthclinic.com",
  clinicAddress: "123 Medical Street, Mumbai 400001",
  botName: "Dr. AI Assistant",
  greetingMessage: "Hello! 👋 Welcome to City Health Clinic. Are you looking to book an appointment?",
  responseStyle: "friendly",
  language: "English",
  services: ["General Consultation", "Physiotherapy", "Dermatology"],
  notificationsEnabled: true,
  notificationEmail: "",
  dailySummary: true,
  unreadAlert: true,
  followUpEnabled: true,
  reminderEnabled: true,
  reEngagementEnabled: false,
  businessHours: {
    Monday:    { open: true,  from: "09:00", to: "19:00" },
    Tuesday:   { open: true,  from: "09:00", to: "19:00" },
    Wednesday: { open: true,  from: "09:00", to: "19:00" },
    Thursday:  { open: true,  from: "09:00", to: "19:00" },
    Friday:    { open: true,  from: "09:00", to: "19:00" },
    Saturday:  { open: true,  from: "09:00", to: "17:00" },
    Sunday:    { open: false, from: "09:00", to: "17:00" },
  },
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0"
      style={{ background: value ? "var(--blue)" : "var(--border)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{hint}</p>}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors";
const inputStyle = { background: "var(--surface-2)", border: "1px solid var(--border-light)", color: "var(--text-primary)" };

export default function SettingsPage() {
  const [tab, setTab] = useState("clinic");
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { if (d && !d.error) setSettings(s => ({ ...s, ...d })); })
      .catch(() => {});
  }, []);

  const set = (key: keyof Settings, value: any) => setSettings(s => ({ ...s, [key]: value }));

  const setHour = (day: string, field: keyof DayHours, value: any) =>
    setSettings(s => ({ ...s, businessHours: { ...s.businessHours, [day]: { ...s.businessHours[day], [field]: value } } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>Configure your clinic, AI bot, and notifications</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: saved ? "var(--green)" : "var(--blue)", opacity: saving ? 0.7 : 1 }}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all"
              style={{
                background: tab === id ? "var(--blue-light)" : "transparent",
                color: tab === id ? "var(--blue)" : "var(--text-secondary)",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="flex-1 rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>

          {/* ── Clinic Profile ── */}
          {tab === "clinic" && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Clinic Profile</h2>
              {([
                { key: "clinicName",    label: "Clinic Name",     placeholder: "City Health Clinic" },
                { key: "clinicPhone",   label: "Phone Number",    placeholder: "+91 98765 43210" },
                { key: "clinicEmail",   label: "Email Address",   placeholder: "info@clinic.com" },
                { key: "clinicAddress", label: "Street Address",  placeholder: "123 Medical Street, Mumbai" },
              ] as { key: keyof Settings; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                <Field key={key} label={label}>
                  <input
                    type="text"
                    value={settings[key] as string}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              ))}
            </div>
          )}

          {/* ── Bot Settings ── */}
          {tab === "bot" && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Bot Configuration</h2>

              <Field label="Bot Display Name">
                <input type="text" value={settings.botName} onChange={e => set("botName", e.target.value)}
                  className={inputClass} style={inputStyle} />
              </Field>

              <Field label="Greeting Message" hint="First message sent to every new patient on WhatsApp">
                <textarea
                  value={settings.greetingMessage}
                  onChange={e => set("greetingMessage", e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Response Style">
                  <select value={settings.responseStyle} onChange={e => set("responseStyle", e.target.value)}
                    className={inputClass} style={inputStyle}>
                    <option value="friendly">Friendly & Warm</option>
                    <option value="professional">Professional & Formal</option>
                    <option value="concise">Concise & Direct</option>
                  </select>
                </Field>
                <Field label="Language">
                  <select value={settings.language} onChange={e => set("language", e.target.value)}
                    className={inputClass} style={inputStyle}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Hinglish</option>
                    <option>Gujarati</option>
                    <option>Marathi</option>
                  </select>
                </Field>
              </div>

              <Field label="Services Offered" hint="Bot will mention these when patients ask what the clinic treats">
                <div className="flex flex-wrap gap-2 mt-1">
                  {SERVICES.map(svc => {
                    const on = settings.services.includes(svc);
                    return (
                      <button
                        key={svc}
                        onClick={() => set("services", on ? settings.services.filter(s => s !== svc) : [...settings.services, svc])}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: on ? "var(--blue)" : "var(--surface-2)",
                          color: on ? "white" : "var(--text-secondary)",
                          border: on ? "none" : "1px solid var(--border-light)",
                        }}
                      >
                        {svc}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Live preview */}
              <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border-light)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>PREVIEW — How patients see it</p>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: "var(--blue)" }}>
                    {settings.botName[0] ?? "B"}
                  </div>
                  <div className="px-3 py-2 rounded-xl rounded-tl-none text-sm max-w-xs" style={{ background: "white", boxShadow: "var(--shadow-sm)", color: "var(--text-primary)" }}>
                    {settings.greetingMessage || "…"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Business Hours ── */}
          {tab === "hours" && (
            <div className="space-y-4">
              <div className="mb-2">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Business Hours</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>The AI bot uses these when telling patients when you are open</p>
              </div>
              {DAYS.map(day => {
                const h: DayHours = settings.businessHours[day] ?? { open: false, from: "09:00", to: "17:00" };
                return (
                  <div key={day} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-28 shrink-0" style={{ color: h.open ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                      {day}
                    </span>
                    <button
                      onClick={() => setHour(day, "open", !h.open)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all w-16 shrink-0"
                      style={{
                        background: h.open ? "var(--green-light)" : "var(--surface-2)",
                        color: h.open ? "var(--green)" : "var(--text-tertiary)",
                        border: `1px solid ${h.open ? "var(--green)" : "var(--border-light)"}`,
                      }}
                    >
                      {h.open ? "Open" : "Closed"}
                    </button>
                    {h.open && (
                      <div className="flex items-center gap-2">
                        <input type="time" value={h.from} onChange={e => setHour(day, "from", e.target.value)}
                          className="px-2 py-1 rounded-lg text-sm outline-none" style={inputStyle} />
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>to</span>
                        <input type="time" value={h.to} onChange={e => setHour(day, "to", e.target.value)}
                          className="px-2 py-1 rounded-lg text-sm outline-none" style={inputStyle} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notification Settings</h2>
              {([
                { key: "notificationsEnabled", label: "New Booking Alerts",        desc: "Get notified when a patient confirms an appointment" },
                { key: "dailySummary",          label: "Daily Summary Email",       desc: "Morning digest of all conversations and bookings" },
                { key: "unreadAlert",           label: "Unread Chat Notifications", desc: "Alert when a patient sends a new message" },
                { key: "followUpEnabled",       label: "Follow-Up Automations",     desc: "Allow AI to send 24h follow-up messages automatically" },
                { key: "reminderEnabled",       label: "Appointment Reminders",     desc: "AI sends a reminder 1h before each appointment" },
                { key: "reEngagementEnabled",   label: "7-Day Re-Engagement",       desc: "Re-contact cold leads who haven't responded in a week" },
              ] as { key: keyof Settings; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{desc}</p>
                  </div>
                  <Toggle value={settings[key] as boolean} onChange={v => set(key, v)} />
                </div>
              ))}

              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "20px" }}>
                <Field label="Notification Email" hint="Booking confirmations and daily summaries go here">
                  <input
                    type="email"
                    value={settings.notificationEmail}
                    onChange={e => set("notificationEmail", e.target.value)}
                    placeholder="doctor@yourclinic.com"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
