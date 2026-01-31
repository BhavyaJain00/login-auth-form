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

  if (loading) return <div className="p-8">Loading form...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!form) return <div className="p-8">Form not found.</div>;
  if (submitted)
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Thank you</h3>
          <p className="text-gray-600">Your response has been recorded.</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">{form.title}</h2>
        {form.description && <p className="text-gray-600 mb-4">{form.description}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields &&
            form.fields.map((field) => (
              <div key={field._id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>

                {field.type === "text" && (
                  <input
                    className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={answers[field._id] || ""}
                    onChange={(e) => handleChange(field._id, e.target.value)}
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={answers[field._id] || ""}
                    onChange={(e) => handleChange(field._id, e.target.value)}
                  />
                )}

                {field.type === "select" && (
                  <select
                    className="w-full border border-gray-200 rounded px-3 py-2"
                    value={answers[field._id] || ""}
                    onChange={(e) => handleChange(field._id, e.target.value)}
                  >
                    <option value="">-- select --</option>
                    {field.options &&
                      field.options.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                )}

                {field.type === "checkbox" && (
                  <div className="flex items-center">
                    <input
                      id={field._id}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600"
                      checked={!!answers[field._id]}
                      onChange={(e) => handleChange(field._id, e.target.checked)}
                    />
                    <label htmlFor={field._id} className="ml-2 text-sm text-gray-700">
                      {field.helpText || ""}
                    </label>
                  </div>
                )}

                {field.type === "radio" &&
                  field.options &&
                  field.options.map((opt, idx) => (
                    <label key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={field._id}
                        value={opt}
                        checked={answers[field._id] === opt}
                        onChange={(e) => handleChange(field._id, e.target.value)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
              </div>
            ))}

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
