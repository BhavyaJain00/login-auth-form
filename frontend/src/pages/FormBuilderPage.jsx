import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import {
  saveForm,
  getMyForms,
  getForm,
  deleteForm,
  submitForm,
  getMySubmissions,
  getFormSubmissions,
  updateMySubmission,
  adminGetForms,
  adminGetForm,
  adminCreateForm,
  adminUpdateForm,
  adminDeleteForm
} from "../services/api.js";

const PALETTE_FIELDS = [
  { type: "text", label: "Text input" },
  { type: "password", label: "Password" },
  { type: "email", label: "Email" },
  { type: "tel", label: "Phone" },
  { type: "url", label: "Website URL" },
  { type: "textarea", label: "Textarea" },
  { type: "checkbox", label: "Checkbox" },
  { type: "select", label: "Select dropdown" },
  { type: "radio", label: "Radio group" },
  { type: "date", label: "Date" },
  { type: "time", label: "Time" },
  { type: "datetime-local", label: "Date & time" },
  { type: "number", label: "Number" }
];

let idCounter = 1;

export default function FormBuilderPage() {
  const { user } = useAuth();
  const { formId } = useParams();  // Get formId from URL
  const isAdmin = user?.role === "ADMIN";
  
  const [mode, setMode] = useState("builder"); // "builder" or "submissions"
  const [fields, setFields] = useState([]);
  const [formValues, setFormValues] = useState({}); // Store actual form input values
  const [activeIndex, setActiveIndex] = useState(null);
  const [formTitle, setFormTitle] = useState("Form 1");
  const [formDescription, setFormDescription] = useState("");
  const [currentFormId, setCurrentFormId] = useState(null);
  const [savedForms, setSavedForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [submissionFormFilter, setSubmissionFormFilter] = useState("all");
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editingSubmissionData, setEditingSubmissionData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light"); // "light" or "dark"

  // Load form if editing an existing form (formId in URL)
  useEffect(() => {
    if (formId) {
      loadFormForEditing(formId);
    } else {
      loadForms();
      if (!isAdmin) {
        loadSubmissions();
      }
    }
  }, [formId, isAdmin]);

  const loadFormForEditing = async (id) => {
    try {
      setLoading(true);
      const apiCall = isAdmin ? adminGetForm : getForm;
      const { data } = await apiCall(id);
      const formData = data.form || data;
      
      // Normalize fields
      const normalizedFields = (formData.fields || []).map((f) => ({
        ...f,
        required: f.required || false,
        defaultValue: f.defaultValue || "",
        options: f.options || [],
        min: f.min || undefined,
        max: f.max || undefined,
        minLength: f.minLength || undefined,
        maxLength: f.maxLength || undefined,
        minDate: f.minDate || undefined,
        maxDate: f.maxDate || undefined
      }));
      
      setFields(normalizedFields);
      setFormTitle(formData.title || "Form 1");
      setFormDescription(formData.description || "");
      setCurrentFormId(formData._id);
      setMessage("Form loaded for editing");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage("Failed to load form for editing: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async () => {
    try {
      const apiCall = isAdmin ? adminGetForms : getMyForms;
      const { data } = await apiCall();
      setSavedForms(data.forms || []);
    } catch (error) {
      console.error("Failed to load forms:", error);
      setSavedForms([]);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data } = await getMySubmissions();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      setSubmissions([]);
    }
  };

  const startEditSubmission = (submission) => {
    setEditingSubmissionId(submission._id);
    // clone
    setEditingSubmissionData({ ...(submission.data || {}) });
  };

  const cancelEditSubmission = () => {
    setEditingSubmissionId(null);
    setEditingSubmissionData({});
  };

  const saveEditedSubmission = async () => {
    if (!editingSubmissionId) return;
    setLoading(true);
    setMessage("");
    try {
      await updateMySubmission(editingSubmissionId, editingSubmissionData);
      await loadSubmissions();
      setMessage("Submission updated successfully!");
      cancelEditSubmission();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update submission");
    } finally {
      setLoading(false);
    }
  };

  const handleDropFromPalette = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    const paletteItem = JSON.parse(data);
    addField(paletteItem);
  };

  const addField = (paletteItem) => {
    const newField = {
      id: `f_${idCounter++}`,
      type: paletteItem.type,
      label: paletteItem.label,
      placeholder: paletteItem.type === "button" ? "Submit" : paletteItem.label,
      options:
        paletteItem.type === "select" || paletteItem.type === "checkbox" || paletteItem.type === "radio"
          ? ["Option 1", "Option 2"]
          : [],
      required: false,
      defaultValue: "",
      min: paletteItem.type === "number" ? "" : undefined,
      max: paletteItem.type === "number" ? "" : undefined,
      minLength: paletteItem.type === "text" || paletteItem.type === "email" || paletteItem.type === "textarea" ? "" : undefined,
      maxLength: paletteItem.type === "text" || paletteItem.type === "email" || paletteItem.type === "textarea" ? "" : undefined,
      minDate: paletteItem.type === "date" ? "" : undefined,
      maxDate: paletteItem.type === "date" ? "" : undefined,
      pattern: paletteItem.type === "text" || paletteItem.type === "tel" ? "" : undefined
    };
    setFields((prev) => [...prev, newField]);
    setFormValues((prev) => ({ ...prev, [newField.id]: newField.defaultValue || "" }));
  };

  const handleReorderDrop = (e, index) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("field-id");
    if (!draggedId) return;
    setFields((prev) => {
      const currentIndex = prev.findIndex((f) => f.id === draggedId);
      if (currentIndex === -1) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(currentIndex, 1);
      copy.splice(index, 0, moved);
      return copy;
    });
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const handleFieldChange = (id, patch) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const handleFormValueChange = (fieldId, value) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleDeleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setFormValues((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setActiveIndex(null);
  };

  const handleSaveForm = async () => {
    if (fields.length === 0) {
      setMessage("Please add at least one field to save the form");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      let apiCall, payload;
      
      if (isAdmin) {
        if (currentFormId) {
          // Update existing form
          apiCall = adminUpdateForm;
          payload = currentFormId;
        } else {
          // Create new form
          apiCall = adminCreateForm;
          payload = {
            title: formTitle,
            description: formDescription,
            fields
          };
        }
      } else {
        // Regular users are not permitted to create/update forms on the server.
        // The backend does not expose POST /api/forms — only admins may create forms.
        setMessage("Only admins can create or save forms.");
        setLoading(false);
        return;
      }

      const { data } = isAdmin && currentFormId ? 
        await apiCall(payload, { title: formTitle, description: formDescription, fields }) :
        await apiCall(payload);
      
      setCurrentFormId(data.form?._id || data._id);
      setMessage("Form saved successfully!");
      await loadForms();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save form");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async () => {
    if (fields.length === 0) {
      setMessage("Please add fields to the form first");
      return;
    }
    if (!currentFormId) {
      setMessage("Please save the form first before submitting");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await submitForm(currentFormId, formValues);
      setMessage("Form submitted successfully!");
      setFormValues({});
      await loadSubmissions();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadForm = async (formId) => {
    try {
      const apiCall = isAdmin ? adminGetForm : getForm;
      const { data } = await apiCall(formId);
      const formData = data.form || data;
      // Ensure all fields have default properties
      const normalizedFields = (formData.fields || []).map((f) => ({
        ...f,
        required: f.required || false,
        defaultValue: f.defaultValue || "",
        options: f.options || [],
        min: f.min || undefined,
        max: f.max || undefined,
        minLength: f.minLength || undefined,
        maxLength: f.maxLength || undefined,
        minDate: f.minDate || undefined,
        maxDate: f.maxDate || undefined
      }));
      setFields(normalizedFields);
      setFormTitle(formData.title || "Form 1");
      setFormDescription(formData.description || "");
      setCurrentFormId(formData._id);
      // load submissions for this form (only current user's submissions)
      await loadFormSubmissions(formData._id);
      // Initialize form values with default values
      const initialValues = {};
      normalizedFields.forEach((f) => {
        initialValues[f.id] = f.defaultValue || "";
      });
      setFormValues(initialValues);
      setMode("builder");
      setMessage("Form loaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load form");
    }
  };

  const loadFormSubmissions = async (formId) => {
    try {
      // get current user's submissions then filter by form id
      const { data } = await getMySubmissions();
      const mine = data.submissions || [];
      const filtered = mine.filter((s) => (s.formId?._id || s.formId) === formId);
      setFormSubmissions(filtered);
    } catch (err) {
      console.error("Failed to load form submissions", err);
      setFormSubmissions([]);
    }
  };

  const handleDeleteSavedForm = async (formId) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    try {
      const apiCall = isAdmin ? adminDeleteForm : deleteForm;
      await apiCall(formId);
      await loadForms();
      if (currentFormId === formId) {
        setFields([]);
        setFormTitle("Form 1");
        setFormDescription("");
        setCurrentFormId(null);
        setFormValues({});
      }
      setMessage("Form deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete form");
    }
  };

  const handlePublishForm = async () => {
    if (!currentFormId) {
      setMessage("Please save the form first before publishing");
      return;
    }
    
    if (!isAdmin) {
      setMessage("Only admins can publish forms");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/forms/${currentFormId}/publish`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to publish form");

      setMessage(`Form published! Public link: ${data.publicLink}`);
      await loadForms();
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setMessage(error.message || "Failed to publish form");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewForm = () => {
    setFields([]);
    setFormTitle("Form 1");
    setFormDescription("");
    setCurrentFormId(null);
    setFormValues({});
    idCounter = 1;
    setActiveIndex(null);
    setMessage("New form created!");
    setTimeout(() => setMessage(""), 3000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const renderFieldInput = (field) => {
    const value = formValues[field.id] || (field.defaultValue || "");

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
            minLength={field.minLength || undefined}
            maxLength={field.maxLength || undefined}
          />
        );
      case "checkbox":
        // If options present, render a checkbox group (multiple selections)
        if ((field.options || []).length > 0) {
          const selected = Array.isArray(formValues[field.id]) ? formValues[field.id] : [];
          return (
            <div className="checkbox-group">
              {(field.options || []).map((opt, idx) => (
                <label key={idx} className="checkbox-option">
                  <input
                    type="checkbox"
                    name={`${field.id}-${idx}`}
                    value={opt}
                    checked={selected.includes(opt)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(opt); else next.delete(opt);
                      handleFormValueChange(field.id, Array.from(next));
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          );
        }
        // Single checkbox (boolean)
        return (
          <label className="checkbox-single">
            <input
              type="checkbox"
              checked={Boolean(formValues[field.id])}
              onChange={(e) => handleFormValueChange(field.id, e.target.checked)}
            />
            <span>{field.label}</span>
          </label>
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
          >
            <option value="">{field.placeholder || "Select an option"}</option>
            {(field.options || []).map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="radio-group">
            {(field.options || []).map((opt, idx) => (
              <label key={idx} className="radio-option">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleFormValueChange(field.id, e.target.value)}
                  required={field.required}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case "date":
        return (
          <input
            type="date"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
            min={field.minDate || undefined}
            max={field.maxDate || undefined}
          />
        );
      case "time":
        return (
          <input
            type="time"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      case "datetime-local":
        return (
          <input
            type="datetime-local"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
            min={field.min || undefined}
            max={field.max || undefined}
          />
        );
      default:
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFormValueChange(field.id, e.target.value)}
            required={field.required}
            minLength={field.minLength || undefined}
            maxLength={field.maxLength || undefined}
            pattern={field.pattern || undefined}
          />
        );
    }
  };

  if (mode === "submissions") {
    const filteredSubmissions =
      submissionFormFilter === "all"
        ? submissions
        : submissions.filter((s) => s.formId?._id === submissionFormFilter);

    return (
      <div className="builder-layout" style={{ background: theme === "dark" ? "#1f2937" : "#ffffff", color: theme === "dark" ? "#ffffff" : "#000000" }}>
        <div style={{ gridColumn: "1 / -1", background: theme === "dark" ? "#111827" : "#ffffff", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>My Submissions</h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                className="primary-btn"
                onClick={toggleTheme}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                {theme === "light" ? "🌙 Dark" : "☀️ Light"}
              </button>
              <select
                value={submissionFormFilter}
                onChange={(e) => setSubmissionFormFilter(e.target.value)}
                style={{ minWidth: "220px", background: theme === "dark" ? "#374151" : "#ffffff", color: theme === "dark" ? "#ffffff" : "#000000", border: `1px solid ${theme === "dark" ? "#4b5563" : "#e5e7eb"}` }}
              >
                <option value="all">All forms</option>
                {savedForms.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.title}
                  </option>
                ))}
              </select>
              <button className="primary-btn" onClick={() => setMode("builder")}>
                Back to Builder
              </button>
            </div>
          </div>

          {message && (
            <div
              className={message.toLowerCase().includes("success") ? "success-text" : "error-text"}
              style={{ marginBottom: "12px" }}
            >
              {message}
            </div>
          )}

          {filteredSubmissions.length === 0 ? (
            <p className="muted">No submissions yet. Create and submit a form to see submissions here.</p>
          ) : (
            <div className="submissions-list">
              {filteredSubmissions.map((submission) => (
                <div key={submission._id} className="submission-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3>{submission.formId?.title || "Untitled Form"}</h3>
                    <span className="muted-small">
                      {new Date(submission.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="submission-data">
                    {editingSubmissionId === submission._id ? (
                      Object.entries(editingSubmissionData).map(([key, value]) => (
                        <div key={key} className="submission-field">
                          <strong>{key}:</strong>{" "}
                          <input
                            type="text"
                            value={String(value ?? "")}
                            onChange={(e) =>
                              setEditingSubmissionData((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                          />
                        </div>
                      ))
                    ) : (
                      Object.entries(submission.data || {}).map(([key, value]) => (
                        <div key={key} className="submission-field">
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                    <button
                      className="primary-btn"
                      onClick={() => {
                        // Load the form and switch to builder mode
                        handleLoadForm(submission.formId._id);
                      }}
                    >
                      Open Form
                    </button>

                    {editingSubmissionId === submission._id ? (
                      <>
                        <button className="primary-btn" onClick={saveEditedSubmission} disabled={loading}>
                          {loading ? "Saving..." : "Save Submission"}
                        </button>
                        <button
                          className="primary-btn"
                          style={{ background: "#6b7280" }}
                          onClick={cancelEditSubmission}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="primary-btn"
                        style={{ background: "#111827" }}
                        onClick={() => startEditSubmission(submission)}
                      >
                        Edit Submission
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="builder-layout" style={{ background: theme === "dark" ? "#1f2937" : "#ffffff", color: theme === "dark" ? "#ffffff" : "#000000" }}>
      <aside className="builder-sidebar" style={{ background: theme === "dark" ? "#111827" : "#f9fafb", borderRight: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}` }}>
        <h3>Inputs</h3>
        <div className="palette-list">
          {PALETTE_FIELDS.map((item) => (
            <button
              key={item.type}
              className="palette-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify(item));
              }}
              onClick={() => addField(item)}
              style={{ background: theme === "dark" ? "#374151" : "#ffffff", color: theme === "dark" ? "#ffffff" : "#000000", border: `1px solid ${theme === "dark" ? "#4b5563" : "#e5e7eb"}` }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
          <button 
            className="primary-btn" 
            onClick={handleCreateNewForm}
            style={{ width: "100%", marginBottom: "15px" }}
          >
            Create New Form
          </button>
          <h3 style={{ fontSize: "0.95rem", marginBottom: "10px" }}>Saved Forms</h3>
          {savedForms.length === 0 ? (
            <p className="muted-small">No saved forms</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {savedForms.map((form) => (
                <div
                  key={form._id}
                  style={{
                    padding: "8px",
                    background: form._id === currentFormId ? (theme === "dark" ? "#3b82f6" : "#e0e7ff") : (theme === "dark" ? "#374151" : "#f9fafb"),
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: theme === "dark" ? "#ffffff" : "#000000"
                  }}
                  onClick={() => handleLoadForm(form._id)}
                >
                  <div style={{ fontWeight: 500 }}>{form.title}</div>
                  <div className="muted-small" style={{ fontSize: "0.75rem" }}>
                    {form.fields?.length || 0} fields
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section
        className="builder-canvas"
        onDrop={handleDropFromPalette}
        onDragOver={onDragOver}
        style={{ background: theme === "dark" ? "#1f2937" : "#ffffff" }}
      >
        <div className="canvas-header" style={{ background: theme === "dark" ? "#111827" : "#ffffff", borderBottom: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}` }}>
          <div>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                border: "none",
                background: "transparent",
                padding: "4px 8px",
                borderRadius: "4px",
                width: "100%",
                maxWidth: "400px",
                color: theme === "dark" ? "#ffffff" : "#000000"
              }}
              onFocus={(e) => (e.target.style.background = theme === "dark" ? "#374151" : "#ffffff")}
              onBlur={(e) => (e.target.style.background = "transparent")}
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Click here to enter a description"
              style={{
                fontSize: "0.9rem",
                border: "none",
                background: "transparent",
                padding: "4px 8px",
                borderRadius: "4px",
                width: "100%",
                maxWidth: "400px",
                resize: "vertical",
                minHeight: "40px",
                color: theme === "dark" ? "#ffffff" : "#000000"
              }}
              onFocus={(e) => (e.target.style.background = theme === "dark" ? "#374151" : "#ffffff")}
              onBlur={(e) => (e.target.style.background = "transparent")}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="primary-btn"
              onClick={toggleTheme}
              style={{ padding: "6px 12px", fontSize: "0.85rem" }}
            >
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>
            {isAdmin && (
              <button className="primary-btn" onClick={handleSaveForm} disabled={loading}>
                {loading ? "Saving..." : "Save Form"}
              </button>
            )}
            {isAdmin && (
              <button 
                className="primary-btn" 
                onClick={handlePublishForm} 
                disabled={loading || !currentFormId}
                style={{ background: "#10b981" }}
              >
                {loading ? "Publishing..." : "📢 Publish Form"}
              </button>
            )}
            <button
              className="primary-btn"
              onClick={() => setMode("submissions")}
              style={{ background: "#6b7280" }}
            >
              Submissions
            </button>
            <button
              className="primary-btn"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              style={{ background: "#ef4444" }}
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className={message.includes("success") ? "success-text" : "error-text"} style={{ marginBottom: "12px" }}>
            {message}
          </div>
        )}

        {fields.length === 0 && (
          <div className="canvas-empty">
            Drag fields here from the left, or click to add.
          </div>
        )}

        <div className="canvas-fields">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={`canvas-field ${index === activeIndex ? "active" : ""}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("field-id", field.id);
              }}
              onDrop={(e) => handleReorderDrop(e, index)}
              onDragOver={onDragOver}
              onClick={() => setActiveIndex(index)}
              style={{ background: theme === "dark" ? "#374151" : "#ffffff", border: `1px solid ${theme === "dark" ? "#4b5563" : "#e5e7eb"}`, color: theme === "dark" ? "#ffffff" : "#000000" }}
            >
              <label className="canvas-field-label">
                {field.label}{" "}
                <button
                  type="button"
                  className="field-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteField(field.id);
                  }}
                >
                  ✕
                </button>
              </label>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              className="primary-btn"
              onClick={handleSubmitForm}
              disabled={loading}
              style={{ padding: "12px 32px", fontSize: "1rem" }}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        )}
      </section>

      <aside className="builder-inspector" style={{ background: theme === "dark" ? "#111827" : "#f9fafb", borderLeft: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`, color: theme === "dark" ? "#ffffff" : "#000000" }}>
        <h3>Field settings</h3>
        {activeIndex == null ? (
          <p className="muted">Select a field on the canvas to edit.</p>
        ) : (
          (() => {
            const field = fields[activeIndex];
            if (!field) return <p className="muted">No field selected.</p>;
            return (
              <div className="inspector-form">
                <label style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}>
                  Label
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
                    style={{ background: theme === "dark" ? "#374151" : "#ffffff", color: theme === "dark" ? "#ffffff" : "#000000", border: `1px solid ${theme === "dark" ? "#4b5563" : "#e5e7eb"}` }}
                  />
                </label>
                {field.type !== "checkbox" && (
                  <label style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}>
                    Placeholder
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) =>
                        handleFieldChange(field.id, { placeholder: e.target.value })
                      }
                      style={{ background: theme === "dark" ? "#374151" : "#ffffff", color: theme === "dark" ? "#ffffff" : "#000000", border: `1px solid ${theme === "dark" ? "#4b5563" : "#e5e7eb"}` }}
                    />
                  </label>
                )}
                
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={field.required || false}
                    onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
                  />
                  <span>Required field</span>
                </label>

                {field.type !== "checkbox" && (
                  <label>
                    Default Value
                    <input
                      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                      value={field.defaultValue || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, { defaultValue: e.target.value })
                      }
                      placeholder="Default value"
                    />
                  </label>
                )}

                {(field.type === "select" || field.type === "checkbox" || field.type === "radio") && (
                  <label>
                    Options (comma-separated)
                    <input
                      type="text"
                      value={field.options?.join(", ") || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, {
                          options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </label>
                )}

                {(field.type === "text" || field.type === "email" || field.type === "textarea") && (
                  <>
                    <label>
                      Min Length
                      <input
                        type="number"
                        value={field.minLength || ""}
                        onChange={(e) =>
                          handleFieldChange(field.id, { minLength: e.target.value || undefined })
                        }
                        placeholder="Minimum characters"
                      />
                    </label>
                    <label>
                      Max Length
                      <input
                        type="number"
                        value={field.maxLength || ""}
                        onChange={(e) =>
                          handleFieldChange(field.id, { maxLength: e.target.value || undefined })
                        }
                        placeholder="Maximum characters"
                      />
                    </label>
                  </>
                )}

                {(field.type === "tel" || field.type === "text") && (
                  <label>
                    Pattern (regex)
                    <input
                      type="text"
                      value={field.pattern || ""}
                      onChange={(e) => handleFieldChange(field.id, { pattern: e.target.value || undefined })}
                      placeholder="Example: ^\\d{10}$"
                    />
                  </label>
                )}

                {field.type === "number" && (
                  <>
                    <label>
                      Min Value
                      <input
                        type="number"
                        value={field.min || ""}
                        onChange={(e) =>
                          handleFieldChange(field.id, { min: e.target.value || undefined })
                        }
                        placeholder="Minimum value"
                      />
                    </label>
                    <label>
                      Max Value
                      <input
                        type="number"
                        value={field.max || ""}
                        onChange={(e) =>
                          handleFieldChange(field.id, { max: e.target.value || undefined })
                        }
                        placeholder="Maximum value"
                      />
                    </label>
                  </>
                )}

                {field.type === "date" && (
                  <>
                    <label>
                      Min Date
                      <input
                        type="date"
                        value={field.minDate || ""}
                        onChange={(e) =>
                          handleFieldChange(field.id, { minDate: e.target.value || undefined })
                        }
                      />
                    </label>
                    <label>
                      Max Date
                      <input
                        type="date"
                        value={field.maxDate || ""}
                        onChange={(e) =>
                          handleFieldChange(field.id, { maxDate: e.target.value || undefined })
                        }
                      />
                    </label>
                  </>
                )}

                <p className="muted-small">Type: {field.type}</p>
                <button
                  className="primary-btn"
                  style={{ marginTop: "12px", background: "#ef4444" }}
                  onClick={() => handleDeleteField(field.id)}
                >
                  Delete Field
                </button>
              </div>
            );
          })()
        )}
      </aside>
    </div>
  );
}