import React, { useState, useEffect } from "react";
import styles from "./Resultados.module.css";
import DetalleResultado from "./DetalleResultado";
import axios from "axios";

const Resultados = () => {
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const res = await axios.get("http://localhost:8000/obtener_pruebas");
        setDatos(res.data);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };
    fetchDatos();
  }, []);

  const calibresUnicos = Array.from(new Set(datos.flatMap(item => item.series.map(serie => serie.calibre))));
  const añosUnicos = Array.from(new Set(datos.flatMap(item => item.series.map(serie => serie.fecha?.slice(0, 4)))));
  const mesesTexto = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const [filtroCalibre, setFiltroCalibre] = React.useState("Todos");
  const [filtroEstado, setFiltroEstado] = React.useState("Todos");
  const [filtroAño, setFiltroAño] = React.useState("Todos");
  const [filtroMes, setFiltroMes] = React.useState("Todos");

  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth(); 

  const mesesDisponibles = filtroAño === "Todos"
    ? mesesTexto
    : parseInt(filtroAño) === añoActual
      ? mesesTexto.slice(0, mesActual + 1)
      : mesesTexto;

  // Aplanar todas las filas filtradas
  const filasPlanas = [];
  datos.forEach(item => {
    item.series.forEach(serie => {
      if (!serie.fecha) return;
      const serieFecha = new Date(serie.fecha);
      const matchCalibre = filtroCalibre === "Todos" || serie.calibre === filtroCalibre;
      const matchEstado = filtroEstado === "Todos" || serie.estado === filtroEstado;
      const matchAño = filtroAño === "Todos" || serieFecha.getFullYear() === parseInt(filtroAño);
      const matchMes = filtroMes === "Todos" || mesesTexto[serieFecha.getMonth()] === filtroMes;
      if (matchCalibre && matchEstado && matchAño && matchMes) {
        filasPlanas.push({
          nro: item.nro,
          ...serie
        });
      }
    });
  });

  // Ordenar por fecha ascendente y nro
  filasPlanas.sort((a, b) => {
    if (a.fecha < b.fecha) return -1;
    if (a.fecha > b.fecha) return 1;
    return a.nro - b.nro;
  });

  const formatoFecha = (fecha) => {
    if (!fecha) return "-";
    const [year, month, day] = fecha.split("-");
    return `${day}-${month}-${year}`;
  };

  return (
    <div className={styles.resultadosContainer}>
      <h1 className={styles.tituloPrincipal}>Resultados de Pruebas Balísticas</h1>

      <div className={styles.filtros}>
        <select value={filtroCalibre} onChange={(e) => setFiltroCalibre(e.target.value)} className={styles.selectFiltro}>
          <option value="Todos">Todos los calibres</option>
          {calibresUnicos.map((calibre, i) => <option key={i} value={calibre}>{calibre}</option>)}
        </select>

        <select value={filtroAño} onChange={(e) => { setFiltroAño(e.target.value); setFiltroMes("Todos"); }} className={styles.selectFiltro}>
          <option value="Todos">Todos los años</option>
          {añosUnicos.map((año, i) => <option key={i} value={año}>{año}</option>)}
        </select>

        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className={styles.selectFiltro} disabled={filtroAño === "Todos"}>
          <option value="Todos">Todos los meses</option>
          {mesesDisponibles.map((mes, i) => <option key={i} value={mes}>{mes}</option>)}
        </select>

        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.selectFiltro}>
          <option value="Todos">Todos los estados</option>
          <option value="APROBADO">Aprobado</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
      </div>

      <div className={styles.tablaWrapper}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th>Nro</th>
              <th>Serie</th>
              <th>Calibre</th>
              <th>Base (cm)</th>
              <th>Altura (cm)</th>
              <th>Área Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filasPlanas.map((fila, idx) => {
              const fechaAnterior = idx > 0 ? filasPlanas[idx - 1].fecha : null;
              return (
                <React.Fragment key={idx}>
                  {fechaAnterior && fechaAnterior !== fila.fecha && (
                    <tr>
                      <td colSpan={9} style={{ borderBottom: "10px dashed #00227eff", height: "10px", padding: 1 }}></td>
                    </tr>
                  )}
                  <tr>
                    <td>{fila.nro}</td>
                    <td>{fila.nombre}</td>
                    <td>{fila.calibre}</td>
                    <td>{fila.base}</td>
                    <td>{fila.altura}</td>
                    <td>{fila.area}</td>
                    <td className={fila.estado === "APROBADO" ? styles.aprobado : styles.rechazado}>{fila.estado}</td>
                    <td>{formatoFecha(fila.fecha)}</td>
                    <td>
                      <button className={styles.botonVer} onClick={() => setFilaSeleccionada(fila)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filaSeleccionada && (
        <DetalleResultado onClose={() => setFilaSeleccionada(null)} datos={filaSeleccionada} />
      )}
    </div>
  );
};

export default Resultados;
