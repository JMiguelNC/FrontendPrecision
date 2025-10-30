import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./Informe.module.css";
import fbm from "../../assets/fbm.jpg";
import pliego from "../../assets/Pliego.png";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const API_BASE_URL = "http://localhost:8000";
const CONSTANTES = {
  armamento: "Mesa de tiro",
  distancia: "100 m",
  limiteSuma: 15,
};

const obtenerFechas = () => {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const fecha = new Date();
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  return {
    formateada: `${dia} de ${meses[mes]} del ${anio}`,
    corta: `${dia}/${(mes + 1).toString().padStart(2, "0")}/${anio}`,
  };
};

const FilaUsuario = ({ index, valor, onChange, onAgregar, styles }) => {
  const esCompleto =
    valor.includes(",") &&
    !valor.includes("no existente") &&
    !valor.includes("No permitido");
  return (
    <tr>
      <td>
        <input
          type="text"
          className={styles.inputTablaFila}
          value={valor}
          readOnly={esCompleto}
          onChange={(e) => onChange(index, e.target.value)}
        />
        <button
          className={styles.botonAgregar}
          onClick={() => onAgregar(index)}
        >
          {esCompleto ? "Quitar" : "Agregar"}
        </button>
      </td>
      <td>
        <span className={styles.negrita}>FIRMA:</span>
      </td>
    </tr>
  );
};

const Informe = ({ onClose, imagenInforme, imagenCanvas, medidas }) => {
  const [municiones, setMuniciones] = useState([]);
  const [municionSeleccionada, setMunicionSeleccionada] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [inputUsuarios, setInputUsuarios] = useState(["", "", ""]);
  const [idsParticipantes, setIdsParticipantes] = useState([]);
  const [escalaImagen, setEscalaImagen] = useState(1);
  const [decisionFinal, setDecisionFinal] = useState("");
  const [error, setError] = useState(null);
  const [series, setSeries] = useState([]);
  const [serieActual, setSerieActual] = useState(null);
  const [serieMostrada, setSerieMostrada] = useState(null);
  const [seriesGuardadas, setSeriesGuardadas] = useState([]);
  const [primeraSerieGuardada, setPrimeraSerieGuardada] = useState(false);

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const mensajeTimer = useRef(null);

  const { formateada: fechaActual, corta: fechaDDMMAAAA } = useMemo(
    () => obtenerFechas(),
    []
  );

  // Función para mostrar mensajes de error o éxito
  const mostrarMensaje = (mensaje, tipo = "error") => {
    if (mensajeTimer.current) clearTimeout(mensajeTimer.current);

    if (tipo === "error") {
      setMensajeError(mensaje);
      setMensajeExito("");
    } else {
      setMensajeExito(mensaje);
      setMensajeError("");
    }

    mensajeTimer.current = setTimeout(() => {
      if (tipo === "error") setMensajeError("");
      else setMensajeExito("");
      mensajeTimer.current = null;
    }, 3000);
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (mensajeTimer.current) clearTimeout(mensajeTimer.current);
    };
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setError(null);
        const [municionesRes, usuariosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/municiones`),
          axios.get(`${API_BASE_URL}/usuarios`),
        ]);
        setMuniciones(municionesRes.data);
        if (municionesRes.data.length > 0)
          setMunicionSeleccionada(municionesRes.data[0].id);
        setUsuarios(usuariosRes.data);
      } catch (err) {
        setError(
          "No se pudieron cargar los datos. Por favor, intente nuevamente."
        );
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const cargarSeries = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/series`);
        setSeries(res.data);
        if (res.data.length > 0) setSerieActual(res.data[0]);
      } catch (err) {
        console.error("Error al cargar series", err);
      }
    };
    cargarSeries();
  }, []);

  useEffect(() => {
    const sumaValor = parseFloat(medidas?.suma);
    setDecisionFinal(
      !isNaN(sumaValor)
        ? sumaValor <= CONSTANTES.limiteSuma
          ? "APROBADO"
          : "RECHAZADO"
        : ""
    );
  }, [medidas?.suma]);

  useEffect(() => {
    const primeraGuardada =
      localStorage.getItem("primeraSerieGuardada") === "true";
    setPrimeraSerieGuardada(primeraGuardada);

    const segundaSeriePendiente =
      localStorage.getItem("segundaSeriePendiente") === "true";

    if (segundaSeriePendiente || primeraGuardada) {
      setSerieMostrada({ nro_serie: "11/2da Serie" });
    } else {
      setSerieMostrada(serieActual);
    }
  }, [serieActual]);

  const handleAgregar = (index) => {
    const valorInput = inputUsuarios[index].trim();
    const nuevosInputs = [...inputUsuarios];
    const nuevosIds = [...idsParticipantes];
    if (
      valorInput.includes(",") &&
      !valorInput.includes("no existente") &&
      !valorInput.includes("No permitido")
    ) {
      nuevosInputs[index] = "";
      nuevosIds[index] = null;
    } else {
      const usuario = usuarios.find(
        (u) => u.usuario === valorInput && u.estado === true
      );
      if (!usuario) {
        nuevosInputs[index] = "Usuario no existente";
        nuevosIds[index] = null;
      } else if (
        inputUsuarios.some(
          (val, i) => i !== index && val.startsWith(usuario.rango)
        )
      ) {
        nuevosInputs[index] = "No permitido";
        nuevosIds[index] = null;
      } else {
        nuevosInputs[
          index
        ] = `${usuario.rango}, ${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`;
        nuevosIds[index] = usuario.id;
      }
    }
    setInputUsuarios(nuevosInputs);
    setIdsParticipantes(nuevosIds);
  };

  const handleChangeUsuario = (index, valor) => {
    const nuevosInputs = [...inputUsuarios];
    nuevosInputs[index] = valor;
    setInputUsuarios(nuevosInputs);
  };

  const [camposEditables, setCamposEditables] = useState({
    ot: "",
    lote: "",
    tamano: "",
    muestra: "",
  });

  const handleCampoChange = (campo, valor) => {
    setCamposEditables((prev) => ({ ...prev, [campo]: valor }));
  };

  const renderInput = (
    label,
    value,
    readOnly = true,
    className = styles.input,
    onChange = null
  ) => (
    <>
      <label className={styles.labelNegrita}>{label}</label>
      <input
        type="text"
        className={className}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        data-value={value}
      />
    </>
  );

  const generarPDFBase64 = async () => {
    const formulario = document.querySelector(`.${styles.hojaCarta}`);

    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 100));

    const pdf = new jsPDF("p", "mm", "letter");

    const canvas = await html2canvas(formulario, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
      letterRendering: true,
      foreignObjectRendering: false,
      windowWidth: formulario.scrollWidth,
      windowHeight: formulario.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector(`.${styles.hojaCarta}`);
        if (clonedElement) {
          // Reemplazar inputs por divs con estilos exactos
          const inputs = clonedElement.querySelectorAll('input[type="text"]');
          inputs.forEach((input) => {
            const span = clonedDoc.createElement("div");
            const valor = input.value || input.getAttribute("data-value") || "";
            span.textContent = valor;

            const computedStyle = window.getComputedStyle(input);
            span.style.cssText = `
            width: ${computedStyle.width};
            height: ${computedStyle.height};
            padding: ${computedStyle.padding};
            margin: ${computedStyle.margin};
            font-size: ${computedStyle.fontSize};
            font-family: ${computedStyle.fontFamily};
            font-weight: ${computedStyle.fontWeight};
            color: ${computedStyle.color};
            text-align: ${computedStyle.textAlign};
            line-height: ${computedStyle.lineHeight};
            box-sizing: border-box;
            display: inline-block;
            vertical-align: middle;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          `;

            input.parentNode.replaceChild(span, input);
          });

          // Reemplazar selects por divs
          const selects = clonedElement.querySelectorAll("select");
          selects.forEach((select) => {
            const span = clonedDoc.createElement("div");
            const selectedOption = select.options[select.selectedIndex];
            span.textContent = selectedOption ? selectedOption.text : "";

            const computedStyle = window.getComputedStyle(select);
            span.style.cssText = `
            padding: ${computedStyle.padding};
            font-size: ${computedStyle.fontSize};
            font-family: ${computedStyle.fontFamily};
            line-height: ${computedStyle.lineHeight};
            display: inline-block;
            vertical-align: middle;
          `;

            select.parentNode.replaceChild(span, select);
          });

          // Ocultar botones
          const botones = clonedElement.querySelectorAll("button");
          botones.forEach((boton) => (boton.style.display = "none"));

          // Tablas con border-collapse
          const tables = clonedElement.querySelectorAll("table");
          tables.forEach((table) => (table.style.borderCollapse = "collapse"));
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgWidth = 210;
    const pageHeight = 279.4;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pageHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, pageHeight);
    } else {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    }

    return pdf.output("datauristring").split(",")[1];
  };

  const validarCampos = () => {
    if (!camposEditables.ot.trim()) {
      mostrarMensaje("Por favor, complete el campo OT", "error");
      return false;
    }
    if (!camposEditables.lote.trim()) {
      mostrarMensaje("Por favor, complete el campo Lote", "error");
      return false;
    }
    if (!camposEditables.tamano.trim()) {
      mostrarMensaje("Por favor, complete el campo Tamaño", "error");
      return false;
    }
    if (!camposEditables.muestra.trim()) {
      mostrarMensaje("Por favor, complete el campo Muestra", "error");
      return false;
    }
    if (!imagenInforme) {
      mostrarMensaje("Por favor, capture una foto antes de guardar", "error");
      return false;
    }
    const primerUsuario = inputUsuarios[0].trim();
    if (
      !primerUsuario ||
      primerUsuario === "Usuario no existente" ||
      primerUsuario === "No permitido" ||
      !primerUsuario.includes(",")
    ) {
      mostrarMensaje(
        "Por favor, agregue al menos un usuario válido en el primer campo",
        "error"
      );
      return false;
    }
    if (!municionSeleccionada) {
      mostrarMensaje("Por favor, seleccione una munición", "error");
      return false;
    }
    if (!medidas?.ancho || !medidas?.alto || !medidas?.suma) {
      mostrarMensaje("No se han calculado las medidas correctamente", "error");
      return false;
    }
    return true;
  };

  const guardarSerie = async (numeroSerie) => {
    if (!validarCampos()) return;

    try {
      const dataEnvio = {
        fecha: fechaDDMMAAAA,
        ordentiro: camposEditables.ot,
        lote: camposEditables.lote,
        tamano: camposEditables.tamano,
        muestra: camposEditables.muestra,
        armamento: CONSTANTES.armamento,
        distancia_tiro: CONSTANTES.distancia,
        base: medidas?.ancho || null,
        altura: medidas?.alto || null,
        area_impactos: medidas?.suma || null,
        decision: decisionFinal,
        id_municion: municionSeleccionada,
        series: [...seriesGuardadas, numeroSerie].filter(Boolean),
        usuarios: idsParticipantes.filter((id) => id),
        foto: imagenInforme?.split(",")[1] || null,
        informe: await generarPDFBase64(),
      };

      await axios.post(`${API_BASE_URL}/guardar_prueba`, dataEnvio);

      // Mostrar mensaje y cerrar modal según tipo de serie
      if (numeroSerie === null) {
        mostrarMensaje("Resultado guardado correctamente ✅", "exito");
        setTimeout(() => onClose(), 300); // cerrar después de 300ms
      } else if (numeroSerie === 1) {
        mostrarMensaje("Primera serie guardada correctamente ✅", "exito");
        setPrimeraSerieGuardada(true);
        setSeriesGuardadas((prev) => [...prev, numeroSerie]);
        localStorage.setItem("primeraSerieGuardada", "true");
        localStorage.setItem("segundaSeriePendiente", "true");
        setTimeout(() => onClose(), 300);
      } else if (numeroSerie === 2) {
        mostrarMensaje("Segunda serie guardada correctamente ✅", "exito");
        setPrimeraSerieGuardada(false);
        setSeriesGuardadas((prev) => [...prev, numeroSerie]);
        localStorage.removeItem("primeraSerieGuardada");
        localStorage.removeItem("segundaSeriePendiente");

        // Preparar siguiente serie si existe
        const siguienteSerie = series.find(
          (s) => ![...seriesGuardadas, numeroSerie].includes(s.id)
        );
        if (siguienteSerie) {
          setSerieActual(siguienteSerie);
          setSerieMostrada(siguienteSerie);
        }
        setTimeout(() => onClose(), 300);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje(
        "Ocurrió un error al guardar la serie. Intente nuevamente.",
        "error"
      );
    }
  };

  const municionTexto =
    municiones.find((m) => m.id === municionSeleccionada)?.calibre || "";

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.formulario}>
          <div className={styles.hojaCarta}>
            {imagenCanvas && (
              <img
                src={imagenCanvas}
                alt="Captura Canvas"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  pointerEvents: "none",
                  zIndex: 30,
                }}
              />
            )}
            <table className={styles.tablaEncabezado}>
              <tbody>
                <tr>
                  <th rowSpan="2">
                    <img src={fbm} alt="Logo" className={styles.imagenCelda} />
                  </th>
                  <th rowSpan="2" className={styles.textoSegundaColumna}>
                    PLIEGO DE PRECISIÓN
                  </th>
                  <th className={styles.subCelda}>CC-R-058</th>
                </tr>
                <tr>
                  <th className={styles.subCelda}>Revisión: 2</th>
                </tr>
              </tbody>
            </table>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.inputGroup}>
              <label className={styles.labelNegrita}>
                Fecha de Inspección:
              </label>
              <input
                type="text"
                className={styles.inputFechaInspeccion}
                value={fechaActual}
                readOnly
              />
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelNegrita}>Munición:</span>
              <span className={styles.labelNormal}>Cartuchos de guerra</span>
              <select
                className={styles.select}
                value={municionSeleccionada}
                onChange={(e) => setMunicionSeleccionada(e.target.value)}
                data-value={municionTexto}
              >
                {municiones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.calibre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              {renderInput(
                "OT:",
                camposEditables.ot,
                false,
                styles.input,
                (e) => handleCampoChange("ot", e.target.value)
              )}
              {renderInput(
                "Lote:",
                camposEditables.lote,
                false,
                styles.input,
                (e) => handleCampoChange("lote", e.target.value)
              )}
              {renderInput(
                "Tamaño:",
                camposEditables.tamano,
                false,
                styles.input,
                (e) => handleCampoChange("tamano", e.target.value)
              )}
              {renderInput(
                "Muestra:",
                camposEditables.muestra,
                false,
                styles.input,
                (e) => handleCampoChange("muestra", e.target.value)
              )}
            </div>
            <div className={styles.inputGroup}>
              {renderInput("Armamento:", CONSTANTES.armamento)}
              {renderInput("Cant. de tiros:", serieMostrada?.nro_serie || "")}
            </div>
            <div className={styles.inputGroup}>
              {renderInput("Distancia de tiro:", CONSTANTES.distancia)}
              <label className={styles.labelNegrita}>Área de impactos:</label>
              <span>B + H = </span>
              <input
                type="text"
                className={styles.inputPequeno}
                value={medidas?.ancho || ""}
                readOnly
                data-value={medidas?.ancho || ""}
              />
              <span> cm + </span>
              <input
                type="text"
                className={styles.inputPequeno}
                value={medidas?.alto || ""}
                readOnly
                data-value={medidas?.alto || ""}
              />
              <span> cm = </span>
              <input
                type="text"
                className={styles.inputPequeno}
                value={medidas?.suma || ""}
                readOnly
                data-value={medidas?.suma || ""}
              />
              <span> cm / 15 cm</span>
            </div>
            <div className={styles.pliegoContainer}>
              <img src={pliego} alt="Pliego" className={styles.pliego} />
            </div>
            <div className={styles.tablaInferiorContainer}>
              <table className={styles.tablaInferior}>
                <tbody>
                  <tr>
                    <td>
                      <span className={styles.negrita}>
                        DECISIÓN FINAL PRUEBA:
                      </span>
                      <input
                        type="text"
                        className={styles.inputTabla}
                        value={decisionFinal}
                        readOnly
                        style={{
                          color:
                            decisionFinal === "APROBADO"
                              ? "green"
                              : decisionFinal === "RECHAZADO"
                              ? "red"
                              : "black",
                          fontWeight: "bold",
                        }}
                        data-value={decisionFinal}
                      />
                    </td>
                    <td>
                      <span className={styles.negrita}>FECHA:</span>
                      <input
                        type="text"
                        className={styles.inputTabla}
                        value={fechaDDMMAAAA}
                        readOnly
                        data-value={fechaDDMMAAAA}
                      />
                    </td>
                  </tr>
                  {[0, 1, 2].map((i) => (
                    <FilaUsuario
                      key={i}
                      index={i}
                      valor={inputUsuarios[i]}
                      onChange={handleChangeUsuario}
                      onAgregar={handleAgregar}
                      styles={styles}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.seccionFoto}>
          <div className={styles.foto}>
            {imagenInforme ? (
              <img
                src={imagenInforme}
                alt="Captura de prueba"
                className={styles.imagenSubida}
                style={{ transform: `scale(${escalaImagen})` }}
              />
            ) : (
              <p>Aquí irá la foto</p>
            )}
          </div>

          <div className={styles.controlesImagen}>
            <label>Zoom:</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={escalaImagen}
              onChange={(e) => setEscalaImagen(e.target.value)}
            />
            <span>{Math.round(escalaImagen * 100)}%</span>
          </div>

          <div className={styles.botonesFoto}>
            {decisionFinal === "APROBADO" && !primeraSerieGuardada && (
              <button
                className={styles.botonFoto}
                onClick={() => guardarSerie(null)}
              >
                Guardar Resultado
              </button>
            )}

            {decisionFinal === "RECHAZADO" && !primeraSerieGuardada && (
              <button
                className={styles.botonFoto}
                onClick={() => guardarSerie(1)}
              >
                Guardar 1ra Serie
              </button>
            )}

            {primeraSerieGuardada && (
              <button
                className={styles.botonFoto}
                onClick={() => guardarSerie(2)}
              >
                Guardar 2da Serie
              </button>
            )}
          </div>

          {/* Mensajes de error o éxito */}
          {mensajeError && (
            <div className={styles.mensajeError}>{mensajeError}</div>
          )}
          {mensajeExito && (
            <div className={styles.mensajeExito}>{mensajeExito}</div>
          )}
        </div>

        <button className={styles.botonCerrar} onClick={onClose}></button>
      </div>
    </div>
  );
};

export default Informe;