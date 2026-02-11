import React, { useEffect, useState } from "react";
import { getPublishedForms } from "../services/api";
import { Link } from "react-router-dom";

export default function PublishedFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleCopy = async (token) => {
    try {
      const url = `${window.location.origin}/form/${token}`;
      await navigator.clipboard.writeText(url);
      alert("Public URL copied to clipboard");
    } catch (err) {
      alert("Failed to copy URL");
    }
  };

  if (loading) return <div className="p-8">Loading published forms...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold mb-6">Published Forms</h2>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No published forms available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((f) => (
            <div key={f._id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to={`/form/${f.publicFormToken}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleCopy(f.publicFormToken)}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
                >
                  Copy URL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
