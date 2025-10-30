import React, { useState } from "react";
import styles from "./EditarUsuario.module.css";

const EditarUsuario = ({ usuario, onClose, onGuardar }) => {
  const [editado, setEditado] = useState({
    usuario: usuario.usuario || "",
    correo: usuario.correo || "",
    foto: usuario.foto || null,
  });
  const [mensaje, setMensaje] = useState("");
  const [fotoPreview, setFotoPreview] = useState(usuario.foto || null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto") {
      const file = files[0];
      setEditado({ ...editado, foto: file });
      if (file) setFotoPreview(URL.createObjectURL(file));
      else setFotoPreview(usuario.foto || null);
    } else {
      setEditado({ ...editado, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("usuario", editado.usuario);
    formData.append("correo", editado.correo);
    if (editado.foto instanceof File) formData.append("foto", editado.foto);

    try {
      const res = await fetch(`http://localhost:8000/usuarios/${usuario.id}`, {
        method: "PUT",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        onGuardar(editado);
        setMensaje(data.mensaje);
        setTimeout(() => {
          setMensaje("");
          onClose();
        }, 2000);
      } else {
        setMensaje(data.error);
      }
    } catch {
      setMensaje("Error al actualizar usuario");
    }
  };

  const handleEliminar = async () => {
    try {
      const res = await fetch(`http://localhost:8000/usuarios/${usuario.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(data.mensaje);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMensaje(data.error);
      }
    } catch {
      setMensaje("Error al eliminar usuario");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Editar Usuario</h2>
        {mensaje && <div className={styles.mensajeExito}>{mensaje}</div>}
        <form className={styles.formulario} onSubmit={handleSubmit}>
          <div className={styles.camposGrid}>
            <div>
              <label>Usuario</label>
              <input
                type="text"
                name="usuario"
                value={editado.usuario}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Correo</label>
              <input
                type="email"
                name="correo"
                value={editado.correo}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Foto Usuario</label>
              <input
                type="file"
                name="foto"
                accept="image/*"
                onChange={handleChange}
              />
              {fotoPreview && (
                <img
                  src={fotoPreview}
                  alt="Vista previa"
                  className={styles.previewFoto}
                />
              )}
            </div>
          </div>
          <div className={styles.botones}>
            <button type="submit" className={styles.guardar}>
              Guardar
            </button>
            <button
              type="button"
              className={styles.cancelar}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.eliminar}
              onClick={handleEliminar}
            >
              Eliminar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuario;