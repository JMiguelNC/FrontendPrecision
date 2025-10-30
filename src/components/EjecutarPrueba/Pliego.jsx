import React from "react";
import styles from "./Pliego.module.css";
import fbmImg from "../../assets/fbm.jpg";
import pliegoImg from "../../assets/Pliego.png";

const Pliego = ({
  fechaInspeccion,
  municion,
  ot,
  lote,
  tamano,
  muestra,
  armamento = "Mesa de tiro",
  cantidadTiros,
  distanciaTiro = "100 m",
  base,
  altura,
  suma,
  decisionFinal,
  fechaFormateada,
  participantes = [],
}) => {
  return (
    <div className={styles.hojaCarta}>
      <div className={styles.contenidoMinInterlineado}>
        <table className={styles.tabla}>
          <tbody>
            <tr>
              <td className={styles.columna1}>
                <img src={fbmImg} alt="Logo" className={styles.imagen} />
              </td>
              <td className={styles.columna2}>PLIEGO DE PRECISIÓN</td>
              <td className={styles.columna3}>
                <table className={styles.tablaInterna}>
                  <tbody>
                    <tr>
                      <td className={styles.filaInterna}>CC-R-058</td>
                    </tr>
                    <tr>
                      <td className={styles.filaInterna}>Revisión: 2</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div className={styles.fechaInspeccion}>
          <span className={styles.etiqueta}>Fecha de Inspección:</span>{" "}
          <span className={styles.valorFecha}>{fechaInspeccion}</span>
        </div>

        <div className={styles.municion}>
          <span className={styles.etiqueta}>Munición:</span>{" "}
          <span className={styles.valorFecha}>{municion}</span>
        </div>

        <div className={styles.lineaDatos}>
          <div>
            <span className={styles.etiqueta}>OT:</span>{" "}
            <span className={styles.valorFecha}>{ot}</span>
          </div>
          <div>
            <span className={styles.etiqueta}>Lote:</span>{" "}
            <span className={styles.valorFecha}>{lote}</span>
          </div>
          <div>
            <span className={styles.etiqueta}>Tamaño:</span>{" "}
            <span className={styles.valorFecha}>{tamano}</span>
          </div>
          <div>
            <span className={styles.etiqueta}>Muestra:</span>{" "}
            <span className={styles.valorFecha}>{muestra}</span>
          </div>
        </div>

        <div className={styles.lineaDatos}>
          <div>
            <span className={styles.etiqueta}>Armamento:</span>{" "}
            <span className={styles.valorFecha}>{armamento}</span>
          </div>
          <div>
            <span className={styles.etiqueta}>Cant. de tiros:</span>{" "}
            <span className={styles.valorFecha}>{cantidadTiros}</span>
          </div>
        </div>

        <div className={styles.lineaDatos}>
          <div>
            <span className={styles.etiqueta}>Distancia de tiro:</span>{" "}
            <span className={styles.valorFecha}>{distanciaTiro}</span>
          </div>
          <div>
            <span className={styles.etiqueta}>Área de impactos:</span>{" "}
            <span className={styles.valorFecha}>
              B + H = {base} cm + {altura} cm = {suma} cm / 15 cm
            </span>
          </div>
        </div>

        <img src={pliegoImg} alt="Pliego" className={styles.imagenPliego} />

        <table className={`${styles.tablaFinal} ${styles.tablaFinalBold}`}>
          <tbody>
            <tr>
              <td className={styles.columnaFinal1}>
                DECISIÓN FINAL PRUEBA: {decisionFinal}
              </td>
              <td className={styles.columnaFinal2}>
                FECHA: {fechaFormateada}
              </td>
            </tr>

            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td className={styles.columnaFinal1}>
                  {participantes[i]
                    ? `${participantes[i].rango} ${participantes[i].nombres} ${participantes[i].apellidoPaterno} ${participantes[i].apellidoMaterno}`
                    : ""}
                </td>
                <td className={styles.columnaFinal2}>FIRMA:</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pliego;