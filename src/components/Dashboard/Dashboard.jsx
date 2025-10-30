import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import logo from "../../assets/logo_fbm.png";
import user from "../../assets/avatar.png";
import { FaHome, FaChartBar, FaCrosshairs, FaUser, FaSignOutAlt } from 'react-icons/fa';
import Inicio from '../Inicio/Inicio.jsx';
import EjecutarPrueba from '../EjecutarPrueba/EjecutarPrueba.jsx';
import Resultados from '../Resultados/Resultados.jsx'; 
import Usuarios from '../Usuarios/Usuarios.jsx';

export default function Dashboard() {
  const [sidebarOculto, setSidebarOculto] = useState(false);
  const [activePage, setActivePage] = useState("inicio");
  const [rol, setRol] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario"));
    if (userData) {
      setRol(userData.rol || "Sin Rol");
      setNombreCompleto(`${userData.nombres || ""} ${userData.ap_paterno || ""} ${userData.ap_materno || ""}`.trim());
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className={styles.dashboard}>
      <aside className={`${styles.sidebar} ${sidebarOculto ? styles.sidebarOculto : ''}`}>
        <div 
          className={styles.logoContainer} 
          onClick={() => setSidebarOculto(!sidebarOculto)} 
        >
          <img src={logo} alt="Logo FBM" className={styles.logo} />
        </div>
        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={() => setActivePage("inicio")}>
            <FaHome className={styles.icon} /><span>Inicio</span>
          </button>

          {rol !== "Gerente" && (
            <button className={styles.navItem} onClick={() => setActivePage("ejecutar")}>
              <FaCrosshairs className={styles.icon} /><span>Ejecutar Prueba</span>
            </button>
          )}

          <button className={styles.navItem} onClick={() => setActivePage("resultados")}>
            <FaChartBar className={styles.icon} /><span>Resultados</span>
          </button>

          {rol === "Gerente" && (
            <button className={styles.navItem} onClick={() => setActivePage("usuarios")}>
              <FaUser className={styles.icon} /><span>Usuarios</span>
            </button>
          )}

          <button className={styles.navItem} onClick={handleLogout}>
            <FaSignOutAlt className={styles.icon} /><span>Salir</span>
          </button>
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>PRUEBAS DE PRECISIÓN BALÍSTICA</h1>
          <div className={styles.user}>
            <img src={user} alt="Usuario" className={styles.avatar} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}>
              <span style={{ fontWeight: "bold", display: "block" }}>{rol}</span>
              <span style={{ display: "block" }}>{nombreCompleto}</span>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {activePage === "inicio" && <Inicio />}
          {activePage === "ejecutar" && <EjecutarPrueba />}
          {activePage === "resultados" && <Resultados />}
          {activePage === "usuarios" && <Usuarios />}
        </main>
      </div>
    </div>
  );
}
