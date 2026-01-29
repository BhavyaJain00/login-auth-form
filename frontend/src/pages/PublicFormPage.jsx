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
    try {
      await submitPublicForm(publicFormToken, answers);
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!form) return <div>Form not found.</div>;
  if (submitted) return <div>Thank you — your response has been recorded.</div>;

  return (
    <div>
      <h2>{form.title}</h2>
      <p>{form.description}</p>
      <form onSubmit={handleSubmit}>
        {form.fields && form.fields.map((field) => (
          <div key={field._id} style={{ marginBottom: 12 }}>
            <label>{field.label}</label>
            {field.type === 'text' && (
              <input
                value={answers[field._id] || ''}
                onChange={(e) => handleChange(field._id, e.target.value)}
              />
            )}
            {field.type === 'textarea' && (
              <textarea
                value={answers[field._id] || ''}
                onChange={(e) => handleChange(field._id, e.target.value)}
              />
            )}
            {field.type === 'select' && (
              <select
                value={answers[field._id] || ''}
                onChange={(e) => handleChange(field._id, e.target.value)}
              >
                <option value="">-- select --</option>
                {field.options && field.options.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {field.type === 'checkbox' && (
              <input
                type="checkbox"
                checked={!!answers[field._id]}
                onChange={(e) => handleChange(field._id, e.target.checked)}
              />
            )}
            {field.type === 'radio' && field.options && field.options.map((opt, idx) => (
              <label key={idx} style={{ display: 'block' }}>
                <input
                  type="radio"
                  name={field._id}
                  value={opt}
                  checked={answers[field._id] === opt}
                  onChange={(e) => handleChange(field._id, e.target.value)}
                /> {opt}
              </label>
            ))}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
