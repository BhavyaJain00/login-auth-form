import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicForm, submitPublicForm } from "../services/api";

export default function PublicFormPage() {
  const { publicFormToken } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!publicFormToken) return;
    setLoading(true);
    getPublicForm(publicFormToken)
      .then((res) => setForm(res.data.form))
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [publicFormToken]);

  const handleChange = (fieldId, value) => {
    setAnswers((a) => ({ ...a, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitPublicForm(publicFormToken, answers);
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Loading / Error / Success states ---------- */
  if (loading)
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={{ textAlign: "center", color: "#6b7280", marginTop: 12 }}>Loading form…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, ...styles.alertCard }}>
          <div style={styles.alertIcon}>⚠️</div>
          <h2 style={styles.alertTitle}>Something went wrong</h2>
          <p style={styles.alertMsg}>{error}</p>
        </div>
      </div>
    );

  if (!form)
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, ...styles.alertCard }}>
          <div style={styles.alertIcon}>🔍</div>
          <h2 style={styles.alertTitle}>Form Not Found</h2>
          <p style={styles.alertMsg}>The form you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );

  if (submitted)
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, ...styles.alertCard }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={{ ...styles.alertTitle, color: "#059669" }}>Thank You!</h2>
          <p style={styles.alertMsg}>Your response has been recorded successfully.</p>
        </div>
      </div>
    );

  /* ---------- Render a single field ---------- */
  const renderField = (field) => {
    const val = answers[field._id] || "";

    // Input-based types
    const inputTypes = {
      text: "text",
      password: "password",
      email: "email",
      phone: "tel",
      url: "url",
      number: "number",
      date: "date",
      time: "time",
      "datetime-local": "datetime-local",
    };

    if (inputTypes[field.type]) {
      return (
        <input
          type={inputTypes[field.type]}
          value={val}
          onChange={(e) => handleChange(field._id, e.target.value)}
          placeholder={field.placeholder || `Enter ${field.label || field.type}`}
          required={field.required}
          style={styles.input}
        />
      );
    }

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            value={val}
            onChange={(e) => handleChange(field._id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label || "text"}`}
            required={field.required}
            rows={4}
            style={{ ...styles.input, resize: "vertical", minHeight: 80 }}
          />
        );

      case "select":
        return (
          <select
            value={val}
            onChange={(e) => handleChange(field._id, e.target.value)}
            required={field.required}
            style={styles.input}
          >
            <option value="">— Select an option —</option>
            {field.options &&
              field.options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
          </select>
        );

      case "checkbox":
        return (
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!!answers[field._id]}
              onChange={(e) => handleChange(field._id, e.target.checked)}
              style={styles.checkbox}
            />
            <span>{field.placeholder || field.label}</span>
          </label>
        );

      case "radio":
        return (
          <div style={styles.radioGroup}>
            {field.options &&
              field.options.map((opt, idx) => (
                <label key={idx} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name={field._id}
                    value={opt}
                    checked={answers[field._id] === opt}
                    onChange={(e) => handleChange(field._id, e.target.value)}
                    style={styles.radio}
                  />
                  <span>{opt}</span>
                </label>
              ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => handleChange(field._id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label || field.type}`}
            style={styles.input}
          />
        );
    }
  };

  /* ---------- Main form ---------- */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header banner */}
        <div style={styles.banner}>
          <h1 style={styles.title}>{form.title}</h1>
          {form.description && <p style={styles.description}>{form.description}</p>}
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {form.fields &&
            form.fields.map((field) => (
              <div key={field._id} style={styles.fieldGroup}>
                <label style={styles.label}>
                  {field.label}
                  {field.required && <span style={styles.required}> *</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              ...(submitting ? styles.submitBtnDisabled : {}),
            }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px 60px",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
    overflow: "hidden",
  },
  banner: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "32px 32px 24px",
    color: "#fff",
  },
  title: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  description: {
    margin: "8px 0 0",
    fontSize: "0.95rem",
    opacity: 0.9,
    lineHeight: 1.5,
  },
  form: {
    padding: "28px 32px 36px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#374151",
    display: "block",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    fontFamily: "inherit",
    fontSize: "0.92rem",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1.5px solid #d1d5db",
    background: "#f9fafb",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: "0.92rem",
    color: "#374151",
    cursor: "pointer",
    padding: "6px 0",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#667eea",
    cursor: "pointer",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: "0.92rem",
    color: "#374151",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    transition: "background 0.15s",
  },
  radio: {
    width: 18,
    height: 18,
    accentColor: "#667eea",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: 8,
    padding: "13px 24px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "opacity 0.2s, transform 0.15s",
    boxShadow: "0 4px 14px rgba(102,126,234,0.4)",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  errorBox: {
    margin: "16px 32px 0",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#b91c1c",
    fontSize: "0.88rem",
  },

  /* State screens */
  alertCard: {
    padding: "60px 32px",
    textAlign: "center",
  },
  alertIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  alertTitle: {
    margin: "0 0 8px",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#1f2933",
  },
  alertMsg: {
    margin: 0,
    color: "#6b7280",
    fontSize: "0.95rem",
    lineHeight: 1.5,
  },

  /* Spinner */
  spinner: {
    width: 36,
    height: 36,
    margin: "0 auto",
    border: "3px solid #e5e7eb",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};

/* Inject spin keyframes once */
if (typeof document !== "undefined" && !document.getElementById("public-form-spin")) {
  const styleEl = document.createElement("style");
  styleEl.id = "public-form-spin";
  styleEl.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .public-form-input:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.15) !important;
    }
  `;
  document.head.appendChild(styleEl);
}
