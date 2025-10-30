import React, { useState, useEffect } from "react";
import usuariosStyles from "./Usuarios.module.css";
import AgregarUsuario from "./AgregarUsuario.jsx";
import DatosUsuario from "./DatosUsuario.jsx";
import EditarUsuario from "./EditarUsuario.jsx";

const Usuarios = () => {
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  const obtenerUsuarios = () => {
    fetch("http://localhost:8000/usuarios")
      .then(res => res.json())
      .then(data => {
        const activos = data.filter(u => u.estado === true);
        setUsuarios(activos);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const abrirModalVer = (usuario) => setUsuarioSeleccionado(usuario);
  const cerrarModalVer = () => setUsuarioSeleccionado(null);

  const abrirModalEditar = (usuario) => setUsuarioEditar(usuario);
  const cerrarModalEditar = () => {
    setUsuarioEditar(null);
    obtenerUsuarios();
  };

  const guardarUsuarioEditado = (datosEditados) => {
    setUsuarios(prev =>
      prev.map(u => u.id === usuarioEditar.id ? { ...u, ...datosEditados } : u)
    );
  };

  const cerrarModalAgregar = () => {
    setMostrarModalAgregar(false);
    obtenerUsuarios();
  };

  return (
    <div className={usuariosStyles.tablaContainer}>
      <div className={usuariosStyles.headerTabla}>
        <h2>Lista de Usuarios</h2>
        <button
          className={usuariosStyles.botonAgregar}
          onClick={() => setMostrarModalAgregar(true)}
        >
          Agregar Usuario
        </button>
      </div>

      <div className={usuariosStyles.tablaResponsive}>
        <table className={usuariosStyles.tabla}>
          <thead>
            <tr>
              <th>Nro</th>
              <th>Nombre(s)</th>
              <th>Apellido Paterno</th>
              <th>Apellido Materno</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, index) => (
              <tr key={usuario.id}>
                <td data-label="Nro">{index + 1}</td>
                <td data-label="Nombre(s)">{usuario.nombres}</td>
                <td data-label="Apellido Paterno">{usuario.apellidoPaterno}</td>
                <td data-label="Apellido Materno">{usuario.apellidoMaterno}</td>
                <td data-label="Usuario">{usuario.usuario}</td>
                <td data-label="Correo">{usuario.correo}</td>
                <td data-label="Rol">{usuario.rol}</td>
                <td data-label="Acciones" className={usuariosStyles.acciones}>
                  <button
                    className={`${usuariosStyles.boton} ${usuariosStyles.botonEditar}`}
                    onClick={() => abrirModalEditar(usuario)}
                  >
                    Editar
                  </button>
                  <button
                    className={`${usuariosStyles.boton} ${usuariosStyles.botonVer}`}
                    onClick={() => abrirModalVer(usuario)}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModalAgregar && (
        <AgregarUsuario cerrarModal={cerrarModalAgregar} />
      )}

      {usuarioSeleccionado && (
        <DatosUsuario usuario={usuarioSeleccionado} onClose={cerrarModalVer} />
      )}

      {usuarioEditar && (
        <EditarUsuario
          usuario={usuarioEditar}
          onClose={cerrarModalEditar}
          onGuardar={guardarUsuarioEditado}
        />
      )}
    </div>
  );
};

export default Usuarios;