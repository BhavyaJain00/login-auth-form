import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import { resetPassword } from "../services/api.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token") || "";
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await resetPassword({ token, password });
      setMessage(data.message || "Password has been reset.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Set new password"
      submitLabel={loading ? "Saving..." : "Save password"}
      onSubmit={handleSubmit}
      footer={
        <p>
          Go back to <Link to="/login">login</Link>
        </p>
      }
    >
      {error && <div className="error-text">{error}</div>}
      {message && <div className="success-text">{message}</div>}
      <label>
        New password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <label>
        Confirm password
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </label>
    </AuthForm>
  );
}

