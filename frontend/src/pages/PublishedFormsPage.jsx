import React, { useEffect, useState } from "react";
import { getPublishedForms } from "../services/api";
import { Link } from "react-router-dom";

export default function PublishedFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let mounted = true;
    getPublishedForms()
      .then((res) => {
        if (mounted) setForms(res.data.forms || []);
      })
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, []);

  const handleCopy = async (id, token) => {
    try {
      const url = `${window.location.origin}/form/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Failed to copy URL");
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ textAlign: "center", color: "#6b7280" }}>Loading published forms…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>Error: {error}</div>
        </div>
      </div>
    );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Published Forms</h1>
            <p style={styles.subtitle}>
              {forms.length} {forms.length === 1 ? "form" : "forms"} available
            </p>
          </div>
        </div>

        {forms.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h3 style={{ margin: "0 0 6px", color: "#374151" }}>No Published Forms</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
              There are no published forms available yet.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {forms.map((f) => {
              const publicUrl = `${window.location.origin}/form/${f.publicFormToken}`;
              const isCopied = copiedId === f._id;

              return (
                <div key={f._id} style={styles.card}>
                  {/* Card accent bar */}
                  <div style={styles.cardAccent} />

                  <div style={styles.cardBody}>
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{f.title || "Untitled Form"}</h3>
                      {f.description && (
                        <p style={styles.cardDesc}>{f.description}</p>
                      )}
                      <div style={styles.meta}>
                        <span style={styles.badge}>
                          📝 {f.fields?.length || 0} fields
                        </span>
                        {f.createdAt && (
                          <span style={styles.date}>
                            {new Date(f.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={styles.cardActions}>
                      <Link
                        to={`/form/${f.publicFormToken}`}
                        style={styles.openBtn}
                      >
                        Open Form →
                      </Link>
                      <button
                        onClick={() => handleCopy(f._id, f.publicFormToken)}
                        style={{
                          ...styles.copyBtn,
                          ...(isCopied ? styles.copiedBtn : {}),
                        }}
                      >
                        {isCopied ? "✓ Copied!" : "📋 Copy URL"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "32px 16px 60px",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
  },
  header: {
    marginBottom: 28,
  },
  heading: {
    margin: 0,
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#1f2933",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "0.92rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#ffffff",
    borderRadius: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardAccent: {
    height: 4,
    background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)",
  },
  cardBody: {
    padding: "20px 24px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    margin: "0 0 6px",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1f2933",
  },
  cardDesc: {
    margin: "0 0 10px",
    fontSize: "0.88rem",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    fontSize: "0.78rem",
    background: "#eef2ff",
    color: "#4338ca",
    padding: "3px 10px",
    borderRadius: 99,
    fontWeight: 600,
  },
  date: {
    fontSize: "0.78rem",
    color: "#9ca3af",
  },
  cardActions: {
    display: "flex",
    gap: 10,
  },
  openBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.88rem",
    textDecoration: "none",
    transition: "opacity 0.2s",
    boxShadow: "0 3px 10px rgba(102,126,234,0.3)",
  },
  copyBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: 10,
    background: "#f3f4f6",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.88rem",
    border: "1.5px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  copiedBtn: {
    background: "#ecfdf5",
    color: "#059669",
    borderColor: "#a7f3d0",
  },
  emptyCard: {
    background: "#ffffff",
    borderRadius: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    padding: "60px 24px",
    textAlign: "center",
  },
  errorBox: {
    padding: "14px 20px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    color: "#b91c1c",
    fontSize: "0.9rem",
  },
};
