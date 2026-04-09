import { useState } from "react";


const Register = () => {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("black");

  const apiUrl = "http://localhost:4000/api";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    const firstname = (form.firstname as HTMLInputElement).value.trim();
    const lastname = (form.lastname as HTMLInputElement).value.trim();
    const email = (form.email as HTMLInputElement).value.trim();
    const phone = (form.phone as HTMLInputElement).value.trim();
    const password = (form.password as HTMLInputElement).value;
    const confirmPassword = (form["confirm-password"] as HTMLInputElement).value;
    const terms = (form.terms as HTMLInputElement).checked;

    if (password !== confirmPassword) {
      setColor("red");
      setMessage("Las contraseñas no coinciden");
      return;
    }

    if (!terms) {
      setColor("red");
      setMessage("Debes aceptar los términos");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, lastname, email, phone, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setColor("red");
        setMessage(result.error || "Error al registrarse");
        return;
      }

      setColor("green");
      setMessage("Registro exitoso");
      form.reset();
    } catch (err) {
      setColor("red");
      setMessage("Error de conexión");
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-header">
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Registrate para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <input name="firstname" placeholder="Nombre" className="auth-input" required />
          <input name="lastname" placeholder="Apellido" className="auth-input" required />
          <input name="email" type="email" placeholder="Email" className="auth-input" required />
          <input name="phone" placeholder="Teléfono" className="auth-input" />

          <input name="password" type="password" placeholder="Contraseña" className="auth-input" required />
          <input name="confirm-password" type="password" placeholder="Confirmar contraseña" className="auth-input" required />

          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" name="terms" />
            Acepto términos
          </label>

          <button className="auth-button">Crear Cuenta</button>
        </form>

        <p className="auth-message" style={{ color }}>
          {message}
        </p>

      </div>
    </div>
  );
};

export default Register;