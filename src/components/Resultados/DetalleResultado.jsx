import React from "react";
import styles from "./DetalleResultado.module.css";

const DetalleResultado = ({ onClose, datos }) => {
  const fotoURL = datos.foto ? `data:image/jpeg;base64,${datos.foto}` : null;
  const informeURL = datos.informe ? `data:application/pdf;base64,${datos.informe}` : null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>DETALLE DE RESULTADO</h2>
        </div>

        <div className={styles.seccionesContainer}>
          <div className={styles.seccionPliego}>
            {informeURL ? (
              <iframe
                src={informeURL}
                width="100%"
                height="500px"
                title="Informe PDF"
              />
            ) : (
              <span>No hay informe disponible</span>
            )}
          </div>

          <div className={styles.seccionFoto}>
            {fotoURL ? (
              <img
                src={fotoURL}
                alt="Foto de prueba"
                style={{ width: "100%", maxHeight: "400px", objectFit: "contain" }}
              />
            ) : (
              <span>No hay foto disponible</span>
            )}
          </div>
        </div>

        <div className={styles.contenedorBotones}>
          {informeURL && (
            <a
              href={informeURL}
              download={`informe_${datos.nombre || "serie"}.pdf`}
            >
              <button className={styles.botonAccion}>Descargar Informe</button>
            </a>
          )}
          <button className={styles.botonCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default DetalleResultado;
