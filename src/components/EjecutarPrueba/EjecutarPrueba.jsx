import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import styles from "./EjecutarPrueba.module.css";
import iconoCamara from "../../assets/camara_icono.svg";
import Botones from "./Botones.jsx";

const EjecutarPrueba = () => {
  const [cargando, setCargando] = useState(false);
  const [mostrarConectar, setMostrarConectar] = useState(false);
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [ipDetectada, setIpDetectada] = useState(null);
  const [error, setError] = useState(null);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [zoomActivo, setZoomActivo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [moverActivo, setMoverActivo] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [fijarActivo, setFijarActivo] = useState(false);
  const [detecciones, setDetecciones] = useState(null);
  const [agregarImpactosActivo, setAgregarImpactosActivo] = useState(false);
  const [impactosManual, setImpactosManual] = useState([]);
  const [eliminarActivo, setEliminarActivo] = useState(false);
  const [impactosEliminados, setImpactosEliminados] = useState([]);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const VIDEO_WIDTH = 1280;
  const VIDEO_HEIGHT = 720;
  const OFFSET_CORRECTION = 3;

  const iniciarBusquedaCamara = async () => {
    setCargando(true);
    setError(null);
    setConectado(false);
    setCargandoCamara(false);
    setIpDetectada(null);
    setStreamKey(Date.now());
    try {
      const res = await fetch("http://localhost:8000/detectar_camara");
      const data = await res.json();
      data.ip ? (setIpDetectada(data.ip), setMostrarConectar(true)) : setError(data.error || "No se detectó ninguna cámara.");
    } catch {
      setError("Error de red al buscar la cámara.");
    } finally {
      setCargando(false);
    }
  };

  const handleConectar = () => {
    setMostrarConectar(false);
    setCargandoCamara(true);
    setStreamKey(Date.now());
    setTimeout(() => {
      setCargandoCamara(false);
      setConectado(true);
      centrarImagen();
    }, 1000);
  };

  const cerrarCamara = async () => {
    try { await fetch("http://localhost:8000/detener_camara"); } catch {}
    setConectado(false);
    setCargandoCamara(false);
    setIpDetectada(null);
    setStreamKey(Date.now());
    setZoom(1);
    setZoomActivo(false);
    setMoverActivo(false);
    setOffset({ x: 0, y: 0 });
    setFijarActivo(false);
    setDetecciones(null);
    setAgregarImpactosActivo(false);
    setImpactosManual([]);
    setEliminarActivo(false);
    setImpactosEliminados([]);
  };

  const centrarImagen = () => {
    if (!videoRef.current || !containerRef.current) return;
    const { offsetWidth: cw, offsetHeight: ch } = containerRef.current;
    const { offsetWidth: vw, offsetHeight: vh } = videoRef.current;
    setOffset({ x: (cw - vw * zoom) / 2, y: (ch - vh * zoom) / 2 });
  };

  const toggleFullscreen = () => {
    const vc = containerRef.current;
    if (!document.fullscreenElement) {
      (vc.requestFullscreen || vc.webkitRequestFullscreen || vc.msRequestFullscreen)?.call(vc);
      vc.classList.add(styles.fullscreen);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
      vc.classList.remove(styles.fullscreen);
    }
    setTimeout(centrarImagen, 50);
  };

  const handleWheel = (e) => {
    if (!zoomActivo || fijarActivo) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setZoom((pz) => {
      let nz = Math.max(1, Math.min(5, pz + delta));
      setOffset((po) => {
        const ratio = nz / pz;
        const sw = video.offsetWidth * nz;
        const sh = video.offsetHeight * nz;
        const minX = Math.min(0, container.offsetWidth - sw);
        const minY = Math.min(0, container.offsetHeight - sh);
        return {
          x: Math.max(Math.min(mx - (mx - po.x) * ratio, 0), minX),
          y: Math.max(Math.min(my - (my - po.y) * ratio, 0), minY)
        };
      });
      return nz;
    });
  };

  const handleMouseDown = (e) => {
    if (!moverActivo || fijarActivo) return;
    e.preventDefault();
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!moverActivo || fijarActivo || !dragStart || !videoRef.current || !containerRef.current) return;
    e.preventDefault();
    const { offsetWidth: cw, offsetHeight: ch } = containerRef.current;
    const { offsetWidth: vw, offsetHeight: vh } = videoRef.current;
    const sw = vw * zoom;
    const sh = vh * zoom;
    const minX = Math.min(0, cw - sw);
    const minY = Math.min(0, ch - sh);
    setOffset({ 
      x: Math.max(Math.min(e.clientX - dragStart.x, 0), minX), 
      y: Math.max(Math.min(e.clientY - dragStart.y, 0), minY) 
    });
  };

  const handleMouseUp = () => { if (moverActivo) setDragStart(null); };

  const calcularAreaVisible = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return null;
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

  const verificarClickEnImpacto = (cx, cy, [x1, y1, x2, y2]) => cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;

  const handleClickCanvas = (e) => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    const rect = container.getBoundingClientRect();
    const cx = (e.clientX - rect.left - offset.x) / zoom;
    const cy = (e.clientY - rect.top - offset.y) / zoom;

    if (agregarImpactosActivo) {
      const s = 20;
      setImpactosManual((p) => [...p, { bbox: [cx - s/2, cy - s/2, cx + s/2, cy + s/2] }]);
      return;
    }

    if (eliminarActivo) {
      const sx = video.offsetWidth / VIDEO_WIDTH;
      const sy = video.offsetHeight / VIDEO_HEIGHT;
      const im = impactosManual.findIndex(i => verificarClickEnImpacto(cx, cy, i.bbox));
      if (im !== -1) {
        setImpactosManual(p => p.filter((_, i) => i !== im));
        return;
      }
      if (detecciones?.impactos) {
        const found = detecciones.impactos.find(i => {
          const [x1, y1, x2, y2] = i.bbox;
          return verificarClickEnImpacto(cx, cy, [x1*sx, y1*sy, x2*sx, y2*sy]);
        });
        if (found) setImpactosEliminados(p => [...p, { bbox: found.bbox }]);
      }
    }
  };

  useEffect(() => {
    if (!conectado || !ipDetectada) return;
    const interval = setInterval(async () => {
      try {
        const area = calcularAreaVisible();
        if (!area) return;
        const sx = videoRef.current.offsetWidth / VIDEO_WIDTH;
        const sy = videoRef.current.offsetHeight / VIDEO_HEIGHT;
        const impactosAbsolutos = impactosManual.map(i => ({ 
          bbox: [i.bbox[0]/sx, i.bbox[1]/sy, i.bbox[2]/sx, i.bbox[3]/sy] 
        }));
        const params = new URLSearchParams(area);
        const res = await fetch(`http://localhost:8000/detecciones_area?${params}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ impactos_manual: impactosAbsolutos, impactos_eliminados: impactosEliminados })
        });
        setDetecciones(await res.json());
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [conectado, ipDetectada, zoom, offset, impactosManual, impactosEliminados]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = video.offsetWidth / VIDEO_WIDTH;
    const sy = video.offsetHeight / VIDEO_HEIGHT;
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    if (detecciones) {
      if (detecciones.hoja) {
        const [x1, y1, x2, y2] = detecciones.hoja;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(x1*sx + OFFSET_CORRECTION, y1*sy, (x2-x1)*sx, (y2-y1)*sy);
      }
      if (detecciones.impactos) {
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 4 / zoom;
        detecciones.impactos.forEach(i => {
          const [x1, y1, x2, y2] = i.bbox;
          ctx.strokeRect(x1*sx + OFFSET_CORRECTION, y1*sy, (x2-x1)*sx, (y2-y1)*sy);
        });
      }
      if (detecciones.celda) {
        const [x1, y1, x2, y2] = detecciones.celda;
        const m = detecciones.medidas;
        const sumaMatch = m?.match(/Suma:\s*([\d.]+)/);
        const suma = sumaMatch ? parseFloat(sumaMatch[1]) : 0;
        ctx.strokeStyle = suma > 15 ? "red" : "lime";
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(x1*sx + OFFSET_CORRECTION, y1*sy, (x2-x1)*sx, (y2-y1)*sy);
        const fs = 14 / zoom;
        ctx.font = `${fs}px Arial`;
        const tw = ctx.measureText(m).width;
        const th = fs * 1.2;
        const p = 4 / zoom;
        const mg = 30 / zoom;
        ctx.fillStyle = "rgba(0,0,0,0.64)";
        ctx.fillRect(x1*sx + OFFSET_CORRECTION, y2*sy + mg, tw + p*2, th + p*2);
        ctx.fillStyle = "white";
        ctx.fillText(m, x1*sx + OFFSET_CORRECTION + p, y2*sy + mg + th);
      }
    }

    if (!fijarActivo && impactosManual.length > 0) {
      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 4 / zoom;
      impactosManual.forEach(i => {
        const [x1, y1, x2, y2] = i.bbox;
        ctx.strokeRect(x1, y1, x2-x1, y2-y1);
      });
    }

    ctx.restore();
  }, [detecciones, zoom, offset, impactosManual, fijarActivo]);
  
  useEffect(() => {
    window.addEventListener("resize", centrarImagen);
    return () => window.removeEventListener("resize", centrarImagen);
  }, [zoom]);

  useEffect(() => {
    if (!fijarActivo) {
      setImpactosManual([]);
      setAgregarImpactosActivo(false);
      setEliminarActivo(false);
      setImpactosEliminados([]);
    }
  }, [fijarActivo]);

  return (
    <div className={styles.container}>
      {!cargando && !mostrarConectar && !cargandoCamara && !conectado && (
        <div className={styles.introCard}>
          <img src={iconoCamara} alt="Camara" className={styles.iconoIntro} />
          <h2 className={styles.titulo}>Ejecución de Pruebas Balísticas</h2>
          <button className={styles.botonPrincipal} onClick={iniciarBusquedaCamara}>Iniciar Cámara</button>
        </div>
      )}
      {cargando && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.loader}></div>
            <p>Buscando cámara...</p>
          </div>
        </div>
      )}
      {mostrarConectar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p className={styles.ipText}>📷 Cámara detectada en: <strong>{ipDetectada}</strong></p>
            <button className={styles.botonPrincipal} onClick={handleConectar}>Conectar</button>
          </div>
        </div>
      )}
      {error && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p className={styles.error}>{error}</p>
            <button className={styles.botonPrincipal} onClick={() => setError(null)}>Cerrar</button>
          </div>
        </div>
      )}
      {(cargandoCamara || conectado) && ipDetectada && (
        <div className={styles.videoContainer} ref={containerRef}>
          {cargandoCamara && (
            <div className={styles.loaderOverlay}>
              <div className={styles.loader}></div>
              <p style={{ color: "#fff", marginTop: "10px" }}>Cargando transmisión...</p>
            </div>
          )}
          {conectado && (
            <>
              <img
                ref={videoRef}
                key={streamKey}
                src={`http://localhost:8000/video_feed?ip=${ipDetectada}&t=${streamKey}`}
                alt="Cámara de seguridad"
                className={styles.videoStream}
                style={{ 
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, 
                  cursor: moverActivo ? "grab" : (agregarImpactosActivo || eliminarActivo) ? "crosshair" : "default", 
                  transition: dragStart ? "none" : "transform 0.1s" 
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClickCanvas}
              />
              <canvas ref={canvasRef} className={styles.canvasOverlay}></canvas>
            </>
          )}
          <Botones
            onCerrar={cerrarCamara}
            onFullscreen={toggleFullscreen}
            zoomActivo={zoomActivo}
            setZoomActivo={setZoomActivo}
            moverActivo={moverActivo}
            setMoverActivo={setMoverActivo}
            fijarActivo={fijarActivo}
            setFijarActivo={setFijarActivo}
            agregarImpactosActivo={agregarImpactosActivo}
            setAgregarImpactosActivo={setAgregarImpactosActivo}
            eliminarActivo={eliminarActivo}
            setEliminarActivo={setEliminarActivo}
            containerRef={containerRef}
            videoRef={videoRef}
            canvasRef={canvasRef}
            zoom={zoom}
            offset={offset}
            impactosManual={impactosManual}
            impactosEliminados={impactosEliminados}
          />
        </div>
      )}
    </div>
  );
};

export default EjecutarPrueba;