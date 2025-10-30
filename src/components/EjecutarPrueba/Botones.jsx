import React, { useState, useEffect, useRef } from "react";
import {
  FaSearchPlus,
  FaArrowsAlt,
  FaLock,
  FaPlus,
  FaTrash,
  FaSave,
  FaExpand,
  FaTimes,
} from "react-icons/fa";
import styles from "./Botones.module.css";
import Informe from "./Informe";

const Botones = ({
  onCerrar,
  onFullscreen,
  zoomActivo,
  setZoomActivo,
  moverActivo,
  setMoverActivo,
  fijarActivo,
  setFijarActivo,
  agregarImpactosActivo,
  setAgregarImpactosActivo,
  eliminarActivo,
  setEliminarActivo,
  containerRef,
  videoRef,
  canvasRef,
  zoom,
  offset,
  impactosManual,
  impactosEliminados,
}) => {
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [imagenInforme, setImagenInforme] = useState(null);
  const [imagenCanvas, setImagenCanvas] = useState(null);
  const [medidasInforme, setMedidasInforme] = useState({ ancho: "", alto: "", suma: "" });
  const [bloquearReanudado, setBloquearReanudado] = useState(false);
  const pliegoRefCallback = useRef(null);

  useEffect(() => {
    if (fijarActivo) {
      setZoomActivo(false);
      setMoverActivo(false);
      fetch("http://localhost:8000/pausar_deteccion");
    } else if (!mostrarInforme && !bloquearReanudado) {
      fetch("http://localhost:8000/reanudar_deteccion");
      setAgregarImpactosActivo(false);
      setEliminarActivo(false);
    }
  }, [fijarActivo, mostrarInforme, bloquearReanudado]);

  const handleEliminarImpactos = () => {
    setEliminarActivo((prev) => !prev);
    if (agregarImpactosActivo) setAgregarImpactosActivo(false);
  };

  const handleAgregarImpactos = () => {
    setAgregarImpactosActivo((prev) => !prev);
    if (eliminarActivo) setEliminarActivo(false);
  };

  const calcularAreaVisible = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return null;
    const VIDEO_WIDTH = 1280;
    const VIDEO_HEIGHT = 720;
    const sw = video.offsetWidth * zoom;
    const sh = video.offsetHeight * zoom;
    const x1 = Math.max(0, (-offset.x / sw) * VIDEO_WIDTH);
    const y1 = Math.max(0, (-offset.y / sh) * VIDEO_HEIGHT);
    return { 
      x1: Math.round(x1), 
      y1: Math.round(y1), 
      x2: Math.round(Math.min(VIDEO_WIDTH, x1 + (container.offsetWidth / sw) * VIDEO_WIDTH)), 
      y2: Math.round(Math.min(VIDEO_HEIGHT, y1 + (container.offsetHeight / sh) * VIDEO_HEIGHT)) 
    };
  };

  const recortarCanvasPorCelda = async (canvasOriginal) => {
    try {
      const response = await fetch("http://localhost:8000/obtener_celda_actual");
      const data = await response.json();
      
      if (!data || !data.hoja) {
        console.warn("No hay hoja detectada, usando canvas completo");
        return canvasOriginal;
      }

      const [x1_hoja, y1_hoja, x2_hoja, y2_hoja] = data.hoja;
      
      const video = videoRef.current;
      const container = containerRef.current;
      const VIDEO_WIDTH = 1280;
      const VIDEO_HEIGHT = 720;
      
      const sx = video.offsetWidth / VIDEO_WIDTH;
      const sy = video.offsetHeight / VIDEO_HEIGHT;
      
      const x1_video = x1_hoja * sx;
      const y1_video = y1_hoja * sy;
      const x2_video = x2_hoja * sx;
      const y2_video = y2_hoja * sy;
      
      const x1_canvas = x1_video * zoom + offset.x;
      const y1_canvas = y1_video * zoom + offset.y;
      const x2_canvas = x2_video * zoom + offset.x;
      const y2_canvas = y2_video * zoom + offset.y;
      
      const ancho_recorte = x2_canvas - x1_canvas;
      const alto_recorte = y2_canvas - y1_canvas;
      
      console.log("Coordenadas hoja detectada:", [x1_hoja, y1_hoja, x2_hoja, y2_hoja]);
      console.log("Coordenadas canvas a recortar:", [x1_canvas, y1_canvas, x2_canvas, y2_canvas]);
      console.log("Dimensiones recorte:", ancho_recorte, alto_recorte);
      
      const canvasRecortado = document.createElement("canvas");
      const ctx = canvasRecortado.getContext("2d");
      
      canvasRecortado.width = ancho_recorte;
      canvasRecortado.height = alto_recorte;
      
      ctx.drawImage(
        canvasOriginal,
        x1_canvas, y1_canvas, ancho_recorte, alto_recorte,
        0, 0, ancho_recorte, alto_recorte
      );
      
      return canvasRecortado;
    } catch (error) {
      console.error("Error al recortar canvas por celda:", error);
      return canvasOriginal;
    }
  };

  const handleVerInforme = async () => {
    if (!containerRef?.current) return;

    try {
      setBloquearReanudado(true);
      await fetch("http://localhost:8000/pausar_deteccion");

      // Calcular el área visible actual
      const areaVisible = calcularAreaVisible();
      if (!areaVisible) {
        console.error("No se pudo calcular el área visible");
        return;
      }

      // Calcular impactos en coordenadas absolutas
      const VIDEO_WIDTH = 1280;
      const VIDEO_HEIGHT = 720;
      const video = videoRef.current;
      const sx = video.offsetWidth / VIDEO_WIDTH;
      const sy = video.offsetHeight / VIDEO_HEIGHT;

      const impactosAbsolutos = impactosManual.map(i => ({ 
        bbox: [i.bbox[0]/sx, i.bbox[1]/sy, i.bbox[2]/sx, i.bbox[3]/sy] 
      }));

      // Solicitar detecciones del área visible ACTUAL con los impactos correctos
      const responseMedidas = await fetch(
        `http://localhost:8000/detecciones_area?x1=${areaVisible.x1}&y1=${areaVisible.y1}&x2=${areaVisible.x2}&y2=${areaVisible.y2}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            impactos_manual: impactosAbsolutos,
            impactos_eliminados: impactosEliminados
          })
        }
      );
      const dataMedidas = await responseMedidas.json();
      
      let medidas = { ancho: "", alto: "", suma: "" };
      if (dataMedidas && dataMedidas.medidas) {
        const texto = dataMedidas.medidas;
        const anchoMatch = texto.match(/Ancho:\s*([\d.]+)\s*cm/);
        const altoMatch = texto.match(/Alto:\s*([\d.]+)\s*cm/);
        const sumaMatch = texto.match(/Suma:\s*([\d.]+)\s*cm/);
        
        medidas = {
          ancho: anchoMatch ? anchoMatch[1] : "",
          alto: altoMatch ? altoMatch[1] : "",
          suma: sumaMatch ? sumaMatch[1] : ""
        };
      }

      if (canvasRef?.current && videoRef?.current) {
        const canvasOriginal = canvasRef.current;

        const canvasTemp = document.createElement("canvas");
        const ctx = canvasTemp.getContext("2d");

        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        canvasTemp.width = containerWidth;
        canvasTemp.height = containerHeight;

        ctx.drawImage(canvasOriginal, 0, 0);

        const canvasRecortado = await recortarCanvasPorCelda(canvasTemp);
        
        const capturaCanvas = canvasRecortado.toDataURL("image/png");
        setImagenCanvas(capturaCanvas);
      }

      const botonesElement = document.querySelector(
        `.${styles.contenedorBotones}`
      );
      if (botonesElement) botonesElement.style.display = "none";

      let congelada = null;
      if (canvasRef?.current) {
        const dataURL = canvasRef.current.toDataURL("image/png");
        congelada = document.createElement("img");
        congelada.src = dataURL;
        congelada.style.position = "absolute";
        congelada.style.top = "0";
        congelada.style.left = "0";
        congelada.style.width = "100%";
        congelada.style.height = "100%";
        congelada.style.pointerEvents = "none";
        congelada.classList.add("copiaCongelada");
        containerRef.current.appendChild(congelada);
      }

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: "#000000",
        scale: 0.75,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        logging: false,
        foreignObjectRendering: false,
        ignoreElements: (el) => el.classList.contains(styles.contenedorBotones),
      });

      const imagen = canvas.toDataURL("image/jpeg", 0.8);
      setImagenInforme(imagen);
      setMedidasInforme(medidas);

      if (congelada) congelada.remove();
      if (botonesElement) botonesElement.style.display = "";

      setTimeout(() => {
        setBloquearReanudado(false);
      }, 3000);
    } catch (error) {
      console.error("Error al capturar:", error);
      const botonesElement = document.querySelector(
        `.${styles.contenedorBotones}`
      );
      if (botonesElement) botonesElement.style.display = "";
      setBloquearReanudado(false);
    }

    setMostrarInforme(true);
    setAgregarImpactosActivo(false);
    setEliminarActivo(false);
  };

  return (
    <>
      <div className={styles.contenedorBotones}>
        <button
          className={`${styles.boton} ${zoomActivo ? styles.zoomActivo : ""}`}
          title="Zoom"
          onClick={() => setZoomActivo((prev) => !prev)}
          disabled={fijarActivo}
        >
          <FaSearchPlus />
        </button>

        <button
          className={`${styles.boton} ${moverActivo ? styles.moverActivo : ""}`}
          title="Mover"
          onClick={() => setMoverActivo((prev) => !prev)}
          disabled={fijarActivo}
        >
          <FaArrowsAlt />
        </button>

        <button
          className={`${styles.boton} ${fijarActivo ? styles.fijarActivo : ""}`}
          title="Fijar Datos"
          onClick={() => setFijarActivo((prev) => !prev)}
        >
          <FaLock />
        </button>

        <button
          className={`${styles.boton} ${
            agregarImpactosActivo ? styles.anadirActivo : ""
          }`}
          title="Agregar Impactos"
          disabled={!fijarActivo}
          onClick={handleAgregarImpactos}
        >
          <FaPlus />
        </button>

        <button
          className={`${styles.boton} ${
            eliminarActivo ? styles.eliminarActivo : ""
          }`}
          title="Eliminar Impactos"
          disabled={!fijarActivo}
          onClick={handleEliminarImpactos}
        >
          <FaTrash />
        </button>

        <button
          className={styles.boton}
          title="Ver Informe"
          onClick={handleVerInforme}
          disabled={!fijarActivo}
        >
          <FaSave />
        </button>

        <button
          className={styles.boton}
          title="Pantalla Completa"
          onClick={onFullscreen}
        >
          <FaExpand />
        </button>

        <button
          className={styles.boton}
          title="Cerrar Cámara"
          onClick={onCerrar}
        >
          <FaTimes />
        </button>
      </div>

      {mostrarInforme && (
        <Informe
          onClose={() => setMostrarInforme(false)}
          imagenInforme={imagenInforme}
          imagenCanvas={imagenCanvas}
          medidas={medidasInforme}
        />
      )}
    </>
  );
};

export default Botones;