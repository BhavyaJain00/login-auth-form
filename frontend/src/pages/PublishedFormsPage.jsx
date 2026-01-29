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
        if (mounted) {
          setForms(res.data.forms || []);
        }
      })
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) return <div>Loading published forms...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Published Forms</h2>
      {forms.length === 0 ? (
        <div>No published forms available.</div>
      ) : (
        <ul>
          {forms.map((f) => (
            <li key={f._id}>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <Link to={`/form/${f.publicFormToken}`}>Open form</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
