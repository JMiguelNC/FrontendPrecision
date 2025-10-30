import React from "react";
import styles from "./DatosUsuario.module.css";

const DatosUsuario = ({ usuario, onClose }) => {
  if (!usuario) return null;

  const obtenerUrlFoto = (foto) => {
    if (!foto) return null;
    return foto;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.tituloModal}>Datos del Usuario</h2>
        <div className={styles.datosGrid}>
          <p><strong>Rol:</strong> {usuario.rol}</p>
          <p><strong>Rango:</strong> {usuario.rango}</p>
          <p><strong>Nombre(s):</strong> {usuario.nombres}</p>
          <p><strong>Apellido Paterno:</strong> {usuario.apellidoPaterno}</p>
          <p><strong>Apellido Materno:</strong> {usuario.apellidoMaterno}</p>
          <p><strong>Cédula de Identidad:</strong> {usuario.ci}</p>
          <p><strong>Fecha de Nacimiento:</strong> {usuario.fechaNacimiento}</p>
          <p><strong>Usuario:</strong> {usuario.usuario}</p>
          <p><strong>Correo:</strong> {usuario.correo}</p>
          <p><strong>Celular:</strong> {usuario.celular}</p>
          <div className={styles.foto}>
            <strong>Foto:</strong>
            <br />
            {usuario.foto ? (
              <img
                src={obtenerUrlFoto(usuario.foto)}
                alt="Foto del usuario"
                style={{ maxWidth: "200px", maxHeight: "200px" }}
              />
            ) : (
              <em>Sin foto</em>
            )}
          </div>
        </div>
        <button onClick={onClose} className={styles.btnCerrar}>Cerrar</button>
      </div>
    </div>
  );
};

export default DatosUsuario;
