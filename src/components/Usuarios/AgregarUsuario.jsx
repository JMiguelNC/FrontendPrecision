import React, { useState, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import styles from "./AgregarUsuario.module.css";

const ModalAgregarUsuario = ({ cerrarModal }) => {
  const [formData, setFormData] = useState({
    rol: "",
    rango: "",
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    ci: "",
    fechaNacimiento: "",
    usuario: "",
    correo: "",
    contraseña: "",
    celular: "",
    foto: null,
    usuarioManual: false,
    correoManual: false,
  });

  const [roles, setRoles] = useState([]);
  const [errores, setErrores] = useState({});
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/roles")
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let nuevoForm = { ...formData };
    if (files) {
      nuevoForm[name] = files[0];
      setPreviewFoto(URL.createObjectURL(files[0]));
    } else {
      nuevoForm[name] = value;
    }
    if ((name === "nombres" || name === "apellidoPaterno") && !nuevoForm.usuarioManual) {
      if (nuevoForm.nombres && nuevoForm.apellidoPaterno) {
        nuevoForm.usuario = nuevoForm.nombres.charAt(0).toLowerCase() + nuevoForm.apellidoPaterno.toLowerCase() + "_fbm";
      }
    }
    if ((name === "nombres" || name === "apellidoPaterno") && !nuevoForm.correoManual) {
      if (nuevoForm.nombres && nuevoForm.apellidoPaterno) {
        nuevoForm.correo = nuevoForm.nombres.charAt(0).toLowerCase() + nuevoForm.apellidoPaterno.toLowerCase() + "_fbm@hotmail.com";
      }
    }
    if ((name === "apellidoPaterno" || name === "fechaNacimiento") && nuevoForm.apellidoPaterno && nuevoForm.fechaNacimiento) {
      nuevoForm.contraseña = nuevoForm.apellidoPaterno + new Date(nuevoForm.fechaNacimiento).getFullYear();
    }
    setFormData(nuevoForm);
    setErrores({ ...errores, [name]: "" });
  };

  const handleGuardar = () => {
    let nuevosErrores = {};
    for (const key in formData) {
      if (!formData[key] && key !== "usuarioManual" && key !== "correoManual") {
        nuevosErrores[key] = "Este campo es obligatorio";
      }
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const rolSeleccionado = roles.find(r => r.nombre_rol === formData.rol);
    if (!rolSeleccionado) {
      setErrores({...errores, rol:"Rol inválido"});
      return;
    }

    const form = new FormData();
    form.append("nombres", formData.nombres);
    form.append("ap_paterno", formData.apellidoPaterno);
    form.append("ap_materno", formData.apellidoMaterno);
    form.append("ci", formData.ci);
    form.append("fecha_nacimiento", formData.fechaNacimiento);
    form.append("usuario", formData.usuario);
    form.append("correo", formData.correo);
    form.append("contrasena", formData.contraseña);
    form.append("celular", formData.celular);
    form.append("rango", formData.rango);
    form.append("rol_id", rolSeleccionado.id);
    if (formData.foto) form.append("foto", formData.foto);

    fetch("http://localhost:8000/usuarios", { method: "POST", body: form })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setErrores(prev => ({ ...prev, general: data.error }));
        } else {
          setMensajeExito("Usuario registrado con éxito ✅");
          setFormData({
            rol:"", rango:"", nombres:"", apellidoPaterno:"", apellidoMaterno:"",
            ci:"", fechaNacimiento:"", usuario:"", correo:"", contraseña:"",
            celular:"", foto:null, usuarioManual:false, correoManual:false
          });
          setPreviewFoto(null);
          setTimeout(() => { setMensajeExito(""); cerrarModal(); }, 2000);
        }
      })
      .catch(err => setErrores(prev => ({ ...prev, general: "Error en el servidor" })));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Registrar Nuevo Usuario</h3>
        {mensajeExito && <div className={styles.mensajeExito}>{mensajeExito}</div>}
        {errores.general && <div className={styles.error}>{errores.general}</div>}
        <div className={styles.modalFormulario}>
          <div className={styles.inputGroupRow}>
            <div className={styles.inputGroup}>
              <label>Rol *</label>
              <select name="rol" value={formData.rol} onChange={handleChange}>
                <option value="">Seleccionar Rol</option>
                {roles.map(r => <option key={r.id} value={r.nombre_rol}>{r.nombre_rol}</option>)}
              </select>
              {errores.rol && <span className={styles.error}>{errores.rol}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>Rango *</label>
              <input type="text" name="rango" value={formData.rango} onChange={handleChange} />
              {errores.rango && <span className={styles.error}>{errores.rango}</span>}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Nombre(s) *</label>
            <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} />
            {errores.nombres && <span className={styles.error}>{errores.nombres}</span>}
          </div>
          <div className={styles.inputGroupRow}>
            <div className={styles.inputGroup}>
              <label>Apellido Paterno *</label>
              <input type="text" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} />
              {errores.apellidoPaterno && <span className={styles.error}>{errores.apellidoPaterno}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>Apellido Materno *</label>
              <input type="text" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} />
              {errores.apellidoMaterno && <span className={styles.error}>{errores.apellidoMaterno}</span>}
            </div>
          </div>
          <div className={styles.inputGroupRow}>
            <div className={styles.inputGroup}>
              <label>CI *</label>
              <input type="text" name="ci" maxLength={8} value={formData.ci} onChange={e => {
                const valor = e.target.value.replace(/\D/g,"");
                if (valor.length <=8) handleChange({target:{name:"ci", value:valor}});
              }} />
              {errores.ci && <span className={styles.error}>{errores.ci}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>Fecha Nacimiento *</label>
              <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} 
                min={new Date(new Date().setFullYear(new Date().getFullYear()-60)).toISOString().split("T")[0]} 
                max={new Date(new Date().setFullYear(new Date().getFullYear()-20)).toISOString().split("T")[0]} />
              {errores.fechaNacimiento && <span className={styles.error}>{errores.fechaNacimiento}</span>}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Usuario *</label>
            <input type="text" name="usuario" value={formData.usuario} onChange={e=>setFormData({...formData, usuario:e.target.value, usuarioManual:true})} />
            {errores.usuario && <span className={styles.error}>{errores.usuario}</span>}
          </div>
          <div className={styles.inputGroupRow}>
            <div className={styles.inputGroup}>
              <label>Correo *</label>
              <input type="email" name="correo" value={formData.correo} onChange={e=>setFormData({...formData, correo:e.target.value, correoManual:true})} />
              {errores.correo && <span className={styles.error}>{errores.correo}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>Contraseña *</label>
              <div className={styles.inputPassword}>
                <input type={mostrarPassword ? "text" : "password"} name="contraseña" value={formData.contraseña} readOnly />
                <button type="button" onClick={()=>setMostrarPassword(!mostrarPassword)} className={styles.togglePassword}><FaEye /></button>
              </div>
              {errores.contraseña && <span className={styles.error}>{errores.contraseña}</span>}
            </div>
          </div>
          <div className={styles.inputGroupRow}>
            <div className={styles.inputGroup}>
              <label>Celular *</label>
              <input type="tel" name="celular" maxLength={8} value={formData.celular} onChange={e=>{
                const valor = e.target.value.replace(/\D/g,"");
                if(valor.length<=8) handleChange({target:{name:"celular", value:valor}});
              }} />
              {errores.celular && <span className={styles.error}>{errores.celular}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>Foto Usuario *</label>
              <input type="file" name="foto" accept="image/png,image/jpeg" onChange={handleChange} />
              {previewFoto && <div className={styles.previewFoto}><img src={previewFoto} alt="Vista previa" /></div>}
              {errores.foto && <span className={styles.error}>{errores.foto}</span>}
            </div>
          </div>
        </div>
        <div className={styles.modalBotones}>
          <button className={styles.botonAgregar} onClick={handleGuardar}>Guardar</button>
          <button className={styles.botonCancelar} onClick={cerrarModal}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregarUsuario;