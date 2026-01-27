import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import { login, googleLogin } from "../services/api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await login({ email: email.trim(), password });
      localStorage.setItem("token", data.token);
      navigate("/builder");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (err.code === "ECONNABORTED") {
        setError("Request timeout - please check your internet connection");
      } else {
        setError(errorMsg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await googleLogin({ token: credentialResponse.credential });
      localStorage.setItem("token", data.token);
      navigate("/builder");
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        
        // Use the One Tap UI
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap is not displayed, render the button
            window.google.accounts.id.renderButton(
              document.getElementById("google-btn-container"),
              { theme: "outline", size: "large", width: "100%" }
            );
          }
        });
      }
    };
    
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      document.head.appendChild(script);
    }
  };

  return (
    <AuthForm
      title="Login"
      submitLabel={loading ? "Logging in..." : "Login"}
      onSubmit={handleSubmit}
      footer={
        <>
          <p>Or Sign up Using</p>
          <div className="social-login">
            <button className="social-btn facebook" title="Login with Facebook" type="button" disabled>f</button>
            <button className="social-btn twitter" title="Login with Twitter" type="button" disabled>𝕏</button>
            <button className="social-btn google" title="Login with Google" type="button" onClick={handleGoogleClick}>G</button>
          </div>
          <div id="google-btn-container"></div>
          <p>
            Or Sign up Using<br />
            <Link to="/register">Sign up</Link>
          </p>
        </>
      }
    >
      {error && <div className="error-text">{error}</div>}
      <label>
        Username
        <input type="email" placeholder="Type your username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          placeholder="Type your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
        <Link to="/forgot-password" style={{ color: "#667eea", textDecoration: "none" }}>Forgot password?</Link>
      </div>
    </AuthForm>
  );
}

