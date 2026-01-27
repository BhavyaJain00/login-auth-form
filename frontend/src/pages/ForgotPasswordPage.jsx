import { useState } from "react";
import { Link } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import { requestForgotPassword } from "../services/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await requestForgotPassword({ email });
      setMessage(data.message || "If that email exists, a reset link has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Forgot password"
      submitLabel={loading ? "Sending..." : "Send reset link"}
      onSubmit={handleSubmit}
      footer={
        <p>
          Remembered your password? <Link to="/login">Back to login</Link>
        </p>
      }
    >
      {error && <div className="error-text">{error}</div>}
      {message && <div className="success-text">{message}</div>}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
    </AuthForm>
  );
}

