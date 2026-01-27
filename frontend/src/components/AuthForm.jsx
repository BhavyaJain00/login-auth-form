export default function AuthForm({ title, onSubmit, submitLabel, children, footer }) {
  return (
    <div className="auth-card">
      <h2>{title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className="auth-form"
      >
        {children}
        <button type="submit" className="primary-btn">
          {submitLabel}
        </button>
      </form>
      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
}

