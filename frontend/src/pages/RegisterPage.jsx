import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import { register } from "../services/api.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    
    // Client-side validation
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await register({ 
        name: name.trim(), 
        email: email.trim(), 
        password 
      });
      localStorage.setItem("token", data.token);
      navigate("/builder");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (err.code === "ECONNABORTED") {
        setError("Request timeout - please check your internet connection");
      } else {
        setError(errorMsg || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Create account"
      submitLabel={loading ? "Creating..." : "Register"}
      onSubmit={handleSubmit}
      footer={
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      }
    >
      {error && <div className="error-text">{error}</div>}
      <label>
        Full name
        <input 
          type="text" 
          placeholder="Enter your full name"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          disabled={loading}
          required 
        />
      </label>
      <label>
        Email
        <input 
          type="email" 
          placeholder="Enter your email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          disabled={loading}
          required 
        />
      </label>
      <label>
        Password
        <input
          type="password"
          placeholder="Enter password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </label>
    </AuthForm>
  );
}

