import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import logo from "../../assets/logo_fbm.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username || !password) {
      setErrorMessage("Debe ingresar usuario y contraseña");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: username, contrasena: password })
      });

      const data = await response.json();

      if (data.success) {
        // Guardamos todos los datos del usuario incluyendo el rol real
        localStorage.setItem(
          "usuario",
          JSON.stringify({
            id: data.user.id,
            rol: data.user.rol_nombre,    // Nombre real del rol
            nombres: data.user.nombres,
            ap_paterno: data.user.ap_paterno,
            ap_materno: data.user.ap_materno,
            primer_inicio: data.user.primer_inicio
          })
        );
        navigate("/dashboard");
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage("Error al conectar con el servidor");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo FBM" className={styles.logo} />
        </div>
        <div className={styles.formContainer}>
          <h2 className={styles.title}>Iniciar Sesión</h2>
          <form className={styles.form} onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              autoFocus
            />
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#34495e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#34495e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.23 20.23 0 015.06-6.44" />
                    <path d="M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
            <button type="submit" className={styles.button}>
              Entrar
            </button>
            {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
