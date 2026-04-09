import { useState } from "react";


const Login = () => {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("black");

  const apiUrl = "http://localhost:4000/api";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value.trim();
    const password = (form.password as HTMLInputElement).value;

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setColor("red");
        setMessage(result.error || "Error al iniciar sesión");
        return;
      }

      setColor("green");
      setMessage(`Bienvenido ${result.user.firstname}!`);
    } catch (err) {
      setColor("red");
      setMessage("No se pudo conectar al servidor.");
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-header">
          <h1 className="auth-title">Iniciar Sesión</h1>
          <p className="auth-subtitle">Accede a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <div className="auth-group">
            <label>Correo Electrónico</label>
            <input type="email" name="email" className="auth-input" required />
          </div>

          <div className="auth-group">
            <label>Contraseña</label>
            <input type="password" name="password" className="auth-input" required />
          </div>

          <button className="auth-button">Iniciar Sesión</button>
        </form>

        <p className="auth-message" style={{ color }}>
          {message}
        </p>

      </div>
    </div>
  );
};

export default Login;