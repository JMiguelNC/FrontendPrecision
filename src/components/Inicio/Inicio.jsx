import React, { useState, useEffect } from "react";
import styles from "./Inicio.module.css";
import { FaCheckCircle, FaTimesCircle, FaClipboardList } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
} from "recharts";

const colores = ["#4CAF50", "#F44336"];
const BIMESTRES = ["Ene-Feb", "Mar-Abr", "May-Jun", "Jul-Ago", "Sep-Oct", "Nov-Dic"];
const MESES = [
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

function obtenerBimestre(fechaStr) {
  const fecha = new Date(fechaStr);
  const mes = fecha.getMonth();
  if (mes <= 1) return "Ene-Feb";
  if (mes <= 3) return "Mar-Abr";
  if (mes <= 5) return "May-Jun";
  if (mes <= 7) return "Jul-Ago";
  if (mes <= 9) return "Sep-Oct";
  return "Nov-Dic";
}

const Inicio = () => {
  const [resumen, setResumen] = useState({ total: 0, aprobados: 0, rechazados: 0 });
  const [tendencia, setTendencia] = useState([]);
  const [dispersión, setDispersión] = useState([]);
  const [municiones, setMuniciones] = useState([]);
  const [filtroMunicion, setFiltroMunicion] = useState("");
  const [filtroAño, setFiltroAño] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const fetchMuniciones = async () => {
      try {
        const res = await fetch("http://localhost:8000/municiones");
        const data = await res.json();
        setMuniciones(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchMuniciones();
  }, []);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const res = await fetch("http://localhost:8000/resumen_pruebas");
        const data = await res.json();
        setResumen(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchResumen();
  }, []);

  useEffect(() => {
    const fetchPruebas = async () => {
      setCargando(true);
      try {
        const res = await fetch("http://localhost:8000/obtener_pruebas");
        const data = await res.json();

        const bimestresTendencia = BIMESTRES.map(b => ({ periodo: b, aceptados: 0, rechazados: 0 }));
        const bimestresDispersión = BIMESTRES.map(b => ({ periodo: b, total: 0, count: 0 }));
        let total = 0;
        let aprobados = 0;
        let rechazados = 0;

        data.forEach(prueba => {
          if (filtroMunicion && prueba.series[0]?.calibre !== filtroMunicion) return;
          prueba.series.forEach(serie => {
            const fecha = new Date(serie.fecha);
            if (filtroAño && fecha.getFullYear() !== parseInt(filtroAño)) return;
            if (filtroMes && fecha.getMonth() + 1 !== parseInt(filtroMes)) return;

            total += 1;
            if (serie.estado === "APROBADO") aprobados += 1;
            else if (serie.estado === "RECHAZADO") rechazados += 1;

            const bimestre = obtenerBimestre(serie.fecha);
            const tIndex = bimestresTendencia.findIndex(b => b.periodo === bimestre);
            if (tIndex !== -1) {
              if (serie.estado === "APROBADO") bimestresTendencia[tIndex].aceptados += 1;
              else if (serie.estado === "RECHAZADO") bimestresTendencia[tIndex].rechazados += 1;
            }
            const dIndex = bimestresDispersión.findIndex(b => b.periodo === bimestre);
            if (dIndex !== -1) {
              bimestresDispersión[dIndex].total += serie.altura || 0;
              bimestresDispersión[dIndex].count += 1;
            }
          });
        });

        const mediaDispersión = bimestresDispersión.map(b => ({
          periodo: b.periodo,
          media: b.count ? +(b.total / b.count).toFixed(2) : 0,
        }));

        setResumen({ total, aprobados, rechazados });
        setTendencia(bimestresTendencia);
        setDispersión(mediaDispersión);
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => setCargando(false), 600);
      }
    };
    fetchPruebas();
  }, [filtroMunicion, filtroAño, filtroMes]);

  const datosResumen = [
    { nombre: "Aceptados", valor: resumen.aprobados },
    { nombre: "Rechazados", valor: resumen.rechazados },
  ];

  const añosDisponibles = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className={styles.inicioContainer}>
      <h2 className={styles.bienvenida}>¡Bienvenido al Sistema de Pruebas de Precisión Balística!</h2>

      <div className={styles.filtrosContainer}>
        <select className={styles.selectFiltro} value={filtroMunicion} onChange={e => setFiltroMunicion(e.target.value)}>
          <option value="">Todas las Municiones</option>
          {municiones.map(m => (
            <option key={m.id} value={m.calibre}>{m.calibre}</option>
          ))}
        </select>
        <select className={styles.selectFiltro} value={filtroAño} onChange={e => setFiltroAño(e.target.value)}>
          <option value="">Todos los Años</option>
          {añosDisponibles.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select className={styles.selectFiltro} value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los Meses</option>
          {MESES.map((nombre, i) => (
            <option key={i + 1} value={i + 1}>{nombre}</option>
          ))}
        </select>
      </div>

      <div className={styles.tarjetasContainer}>
        <div className={`${styles.tarjeta} ${styles.realizadas}`}>
          <div className={styles.iconoContainer}><FaClipboardList className={styles.icono} /></div>
          <div className={styles.contenido}>
            <span className={styles.texto}>Pruebas Realizadas</span>
            <span className={styles.numero}>{resumen.total}</span>
          </div>
        </div>
        <div className={`${styles.tarjeta} ${styles.aceptados}`}>
          <div className={styles.iconoContainer}><FaCheckCircle className={styles.icono} /></div>
          <div className={styles.contenido}>
            <span className={styles.texto}>Lotes Aceptados</span>
            <span className={styles.numero}>{resumen.aprobados}</span>
          </div>
        </div>
        <div className={`${styles.tarjeta} ${styles.rechazados}`}>
          <div className={styles.iconoContainer}><FaTimesCircle className={styles.icono} /></div>
          <div className={styles.contenido}>
            <span className={styles.texto}>Lotes Rechazados</span>
            <span className={styles.numero}>{resumen.rechazados}</span>
          </div>
        </div>
      </div>

      <div className={styles.graficosContainer}>
        {cargando && (
          <div className={styles.overlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
        <div className={styles.grafico}>
          <h3 style={{ textAlign: "center" }}>Comparación de Aceptados vs Rechazados</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosResumen}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor">
                {datosResumen.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.nombre === "Aceptados" ? "#4CAF50" : "#F44336"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", marginTop: "10px", fontWeight: "bold" }}>
            Total de Pruebas: {resumen.total}
          </div>
        </div>

        <div className={styles.grafico}>
          <h3>Distribución (Circular)</h3>
          <div style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={datosResumen}
                  dataKey="valor"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  style={{ fontSize: "30px", fontWeight: "bold" }}
                >
                  {datosResumen.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.grafico}>
          <h3>Tendencia de Lotes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="aceptados" stroke="#4CAF50" />
              <Line type="monotone" dataKey="rechazados" stroke="#F44336" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.grafico}>
          <h3>Media de Dispersión por Bimestre (cm)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dispersión}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="media">
                {dispersión.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.media > 15 ? "#F44336" : "#4CAF50"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Inicio;
