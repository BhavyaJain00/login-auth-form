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

  const toggleCheckboxOption = (fieldId, option) => {
    setAnswers((a) => {
      const current = Array.isArray(a[fieldId]) ? a[fieldId] : [];
      const exists = current.includes(option);
      return { ...a, [fieldId]: exists ? current.filter(x => x !== option) : [...current, option] };
    });
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

  if (loading) return <div className="p-6">Loading form...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!form) return <div className="p-6">Form not found.</div>;
  if (submitted) return <div className="p-6 text-green-700">Thank you — your response has been recorded.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h2>
        {form.description && <p className="text-gray-600 mb-6">{form.description}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields && form.fields.map((field) => {
            const fid = field._id || field.id;
            return (
            <div key={fid} className="">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}{field.required ? <span className="text-red-500"> *</span> : null}</label>

              {field.type === 'text' && (
                <input
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder={field.placeholder || ''}
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}

              {field.type === 'email' && (
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder={field.placeholder || ''}
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}

              {field.type === 'tel' && (
                <input
                  type="tel"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder={field.placeholder || ''}
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}

              {field.type === 'url' && (
                <input
                  type="url"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder={field.placeholder || ''}
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}

              {field.type === 'password' && (
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={answers[field._id] || ''}
                  onChange={(e) => handleChange(field._id, e.target.value)}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  className="w-full border border-gray-200 rounded px-3 py-2 min-h-[120px] resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder={field.placeholder || ''}
                  value={answers[field._id] || ''}
                  onChange={(e) => handleChange(field._id, e.target.value)}
                />
              )}

              {field.type === 'select' && (
                <select
                  className="w-full border border-gray-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                <div className="flex flex-col gap-2">
                  {field.options && field.options.length > 0 ? (
                    field.options.map((opt, idx) => (
                      <label key={idx} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600"
                          checked={Array.isArray(answers[fid]) && answers[fid].includes(opt)}
                          onChange={() => toggleCheckboxOption(fid, opt)}
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        id={`cb-${fid}`}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={!!answers[fid]}
                        onChange={(e) => handleChange(fid, e.target.checked)}
                      />
                      <label htmlFor={`cb-${fid}`} className="text-sm text-gray-700">{field.helpText || ''}</label>
                    </div>
                  )}
                </div>
              )}

              {field.type === 'radio' && field.options && (
                <div className="flex flex-col gap-2">
                  {field.options.map((opt, idx) => (
                    <label key={idx} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={fid}
                        value={opt}
                        className="h-4 w-4 text-blue-600"
                        checked={answers[fid] === opt}
                        onChange={(e) => handleChange(fid, e.target.value)}
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}

              {field.type === 'time' && (
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={answers[fid] || ''}
                  onChange={(e) => handleChange(fid, e.target.value)}
                />
              )}
            </div>
          )})}

          <div className="pt-4">
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
