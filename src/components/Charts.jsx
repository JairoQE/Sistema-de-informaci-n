import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, LineChart, Line, ResponsiveContainer
} from "recharts";
import GaugeChart from "react-gauge-chart";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Charts = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    area: [],
    facultad: [],
    escuela: [],
    estado: [],
    genero: [],
    desde: null,
    hasta: null
  });

  useEffect(() => {
    const fetchExcel = async () => {
      const response = await fetch("/data/datos_unificados_ppp_tesis.xlsx");
      const blob = await response.arrayBuffer();
      const workbook = XLSX.read(blob, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      setData(parsedData);
      setFiltered(parsedData);
    };
    fetchExcel();
  }, []);

  const getUniqueOptions = (key) => {
    const values = data.map(item => item[key]).filter(Boolean);
    return [...new Set(values)].map(val => ({ label: val, value: val }));
  };

  const handleApplyFilters = () => {
    let result = [...data];
    const { area, facultad, escuela, estado, genero, desde, hasta } = filters;

    if (area.length) {
      result = result.filter(row =>
        (area.includes("PPP") && row["hizo_ppp"] === "Sí") ||
        (area.includes("Tesis") && row["hizo_tesis"] === "Sí")
      );
    }

    if (facultad.length) result = result.filter(row => facultad.includes(row.facultad));
    if (escuela.length) result = result.filter(row => escuela.includes(row.escuela));
    if (estado.length) {
      result = result.filter(row =>
        estado.includes(row.estado_ppp) || estado.includes(row.estado_tesis)
      );
    }
    if (genero.length) result = result.filter(row => genero.includes(row.genero));

    if (desde && hasta) {
      const desdeDate = new Date(desde);
      const hastaDate = new Date(hasta);
      result = result.filter(row => {
        const fechas = [
          new Date(row.fecha_inicio_ppp),
          new Date(row.fecha_fin_ppp),
          new Date(row.fecha_inicio_tesis),
          new Date(row.fecha_sustentacion)
        ].filter(f => !isNaN(f));
        return fechas.some(f => f >= desdeDate && f <= hastaDate);
      });
    }

    setFiltered(result);
  };

  const handleClearFilters = () => {
    setFilters({
      area: [],
      facultad: [],
      escuela: [],
      estado: [],
      genero: [],
      desde: null,
      hasta: null
    });
    setFiltered(data);
  };

  const getChartDataBy = (key) => {
    const countMap = {};
    filtered.forEach(item => {
      const val = item[key];
      if (val) countMap[val] = (countMap[val] || 0) + 1;
    });
    return Object.entries(countMap).map(([name, value]) => ({ name, value }));
  };

  const getEstadoData = () => {
    const estados = {};
    filtered.forEach(item => {
      const ppp = item.estado_ppp;
      const tesis = item.estado_tesis;
      if (ppp) estados[ppp] = (estados[ppp] || 0) + 1;
      if (tesis) estados[tesis] = (estados[tesis] || 0) + 1;
    });
    return Object.entries(estados).map(([name, value]) => ({ name, value }));
  };

  const parseFecha = (value) => {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const fecha = new Date(value);
      return isNaN(fecha) ? null : fecha;
    }
    if (!isNaN(value)) {
      const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  const getEvolucionComparativa = () => {
    const añosPPP = {};
    const añosTesis = {};
    const { desde, hasta, area } = filters;

    const desdeDate = desde ? new Date(desde) : null;
    const hastaDate = hasta ? new Date(hasta) : null;

    filtered.forEach(item => {
      const addYear = (fechaRaw, tipo) => {
        const fecha = parseFecha(fechaRaw);
        if (!fecha) return;
        if (desdeDate && fecha < desdeDate) return;
        if (hastaDate && fecha > hastaDate) return;
        const año = fecha.getFullYear();
        if (año < 2000 || año > new Date().getFullYear()) return;

        if (tipo === "PPP") añosPPP[año] = (añosPPP[año] || 0) + 1;
        if (tipo === "Tesis") añosTesis[año] = (añosTesis[año] || 0) + 1;
      };

      if (!area.length || area.includes("PPP")) {
        addYear(item.fecha_inicio_ppp, "PPP");
      }
      if (!area.length || area.includes("Tesis")) {
        addYear(item.fecha_inicio_tesis, "Tesis");
        addYear(item.fecha_sustentacion, "Tesis");
      }
    });

    const allYears = new Set([
      ...Object.keys(añosPPP),
      ...Object.keys(añosTesis)
    ]);

    const resultado = Array.from(allYears)
      .map(year => ({
        year,
        PPP: añosPPP[year] || 0,
        Tesis: añosTesis[year] || 0
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    return resultado;
  };

  const getPromedioMensual = () => {
    const mesesPPP = {};
    const mesesTesis = {};
    const { desde, hasta, area } = filters;

    const desdeDate = desde ? new Date(desde) : null;
    const hastaDate = hasta ? new Date(hasta) : null;

    filtered.forEach(item => {
      const addMonth = (fechaRaw, tipo) => {
        const fecha = parseFecha(fechaRaw);
        if (!fecha) return;
        if (desdeDate && fecha < desdeDate) return;
        if (hastaDate && fecha > hastaDate) return;
        
        const mes = fecha.getMonth(); // 0-11
        const nombreMes = [
          "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
        ][mes];

        if (tipo === "PPP") mesesPPP[nombreMes] = (mesesPPP[nombreMes] || 0) + 1;
        if (tipo === "Tesis") mesesTesis[nombreMes] = (mesesTesis[nombreMes] || 0) + 1;
      };

      if (!area.length || area.includes("PPP")) {
        addMonth(item.fecha_inicio_ppp, "PPP");
        addMonth(item.fecha_fin_ppp, "PPP");
      }
      if (!area.length || area.includes("Tesis")) {
        addMonth(item.fecha_inicio_tesis, "Tesis");
        addMonth(item.fecha_sustentacion, "Tesis");
      }
    });

    // Ordenar por meses del año
    const ordenMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    const resultado = ordenMeses.map(mes => ({
      mes,
      PPP: mesesPPP[mes] || 0,
      Tesis: mesesTesis[mes] || 0
    }));

    return resultado;
  };

  const getPromedioNotasPorFacultad = () => {
    const facultades = {};
    
    filtered.forEach(item => {
      // Solo considerar registros con tesis y calificación válida
      if (item.hizo_tesis === "Sí" && item.calificacion_final && item.calificacion_final !== "N/A") {
        const nota = parseFloat(item.calificacion_final);
        if (!isNaN(nota)) {
          if (!facultades[item.facultad]) {
            facultades[item.facultad] = { sum: 0, count: 0 };
          }
          facultades[item.facultad].sum += nota;
          facultades[item.facultad].count += 1;
        }
      }
    });

    return Object.entries(facultades).map(([facultad, { sum, count }]) => ({
      facultad,
      promedio: sum / count
    })).sort((a, b) => b.promedio - a.promedio);
  };

  const getTopEscuelas = (top = 10, order = 'desc') => {
    const counts = {};
    filtered.forEach(item => {
      if (!item.escuela) return;
      counts[item.escuela] = (counts[item.escuela] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => order === 'desc' ? b - a : a - b)
      .slice(0, top)
      .map(([name, value]) => ({ name, value }));
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF4444", "#AA66CC", "#33B5E5"];

  return (
    <div className="container" style={{ padding: "20px" }}>
      {/* FILTROS */}
      <div className="card mt-3 p-3 shadow-sm">
        <div className="row">
          {[
            { label: "Área", key: "area", options: ["PPP", "Tesis"] },
            { label: "Facultad", key: "facultad", options: getUniqueOptions("facultad") },
            { label: "Escuela", key: "escuela", options: getUniqueOptions("escuela") },
            { label: "Estado", key: "estado", options: getUniqueOptions("estado_ppp").concat(getUniqueOptions("estado_tesis")) },
            { label: "Género", key: "genero", options: getUniqueOptions("genero") }
          ].map(({ label, key, options }) => (
            <div className="col-md-2 mb-2" key={key}>
              <label className="form-label">{label}</label>
              <Select
                isMulti
                options={options.map(opt => typeof opt === "string" ? { label: opt, value: opt } : opt)}
                value={filters[key].map(v => ({ label: v, value: v }))}
                onChange={selected => setFilters(prev => ({
                  ...prev,
                  [key]: selected.map(opt => opt.value)
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>
          ))}

          <div className="col-md-2 mb-2">
            <label className="form-label">Desde</label>
            <DatePicker
              className="form-control"
              selected={filters.desde}
              onChange={(date) => setFilters(prev => ({ ...prev, desde: date }))}
              placeholderText="Inicio"
              dateFormat="yyyy-MM-dd"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Hasta</label>
            <DatePicker
              className="form-control"
              selected={filters.hasta}
              onChange={(date) => setFilters(prev => ({ ...prev, hasta: date }))}
              placeholderText="Fin"
              dateFormat="yyyy-MM-dd"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
          <div className="col-md-2 d-flex align-items-end mb-2">
            <button className="btn btn-primary w-100" onClick={handleApplyFilters}>
              Aplicar Filtros
            </button>
          </div>
          <div className="col-md-2 d-flex align-items-end mb-2">
            <button className="btn btn-outline-secondary w-100" onClick={handleClearFilters}>
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="row mt-4">
        {/* Gráfico 1: Distribución por Facultad */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Distribución por Facultad</h5>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={getChartDataBy("facultad")} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {getChartDataBy("facultad").map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Estados de Actividad */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Estados de Actividad (PPP o Tesis)</h5>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getEstadoData()}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Comparativa Anual */}
        <div className="col-md-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Comparativa de Evolución Anual: PPP vs Tesis</h5>
              <div style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getEvolucionComparativa()}>
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="PPP" stroke="#0088FE" name="PPP" />
                    <Line type="monotone" dataKey="Tesis" stroke="#FF8042" name="Tesis" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 4: Promedio Mensual */}
        <div className="col-md-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Distribución Mensual: PPP vs Tesis</h5>
              <div style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPromedioMensual()}>
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="PPP" fill="#0088FE" name="PPP" />
                    <Bar dataKey="Tesis" fill="#FF8042" name="Tesis" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 5: Indicador de Progreso */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Indicador de Progreso General</h5>
              <div style={{ height: "250px" }}>
                <GaugeChart
                  id="gauge-chart"
                  nrOfLevels={20}
                  percent={filtered.length / (data.length || 1)}
                  textColor="#000"
                  colors={["#FF5F6D", "#FFC371"]}
                  arcWidth={0.3}
                />
              </div>
              <p className="text-center mt-2">
                {filtered.length} de {data.length} registros ({Math.round((filtered.length / (data.length || 1)) * 100)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico 6: Top 10 Escuelas con más registros */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Top 10 Escuelas con más registros</h5>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getTopEscuelas(10, 'desc')}
                    layout="vertical"
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" name="Proyectos" fill="#40C4FF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 7: Top 10 Escuelas con menos registros */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Top 10 Escuelas con menos registros</h5>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getTopEscuelas(10, 'asc')}
                    layout="vertical"
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" name="Proyectos" fill="#FF7043" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 8: Promedio de notas de tesis por facultad */}
        <div className="col-md-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Promedio de calificaciones de tesis por Facultad</h5>
              <div style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getPromedioNotasPorFacultad()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="facultad" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="promedio" name="Promedio de calificación" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;