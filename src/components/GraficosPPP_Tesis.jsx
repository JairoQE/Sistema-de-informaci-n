import React, { useState } from "react";
import Filters from "./Filters";
import Charts from "./Charts";

export default function GraficosPPPTesis() {
  const [filtros, setFiltros] = useState({
    facultad: [],
    escuela: [],
    genero: [],
    estado: [],
    area: [],
    rangoFechas: null,
  });

  return (
    <div className="container mt-4">
      <h2 className="text-center">Dashboard Estadístico PPP y Tesis - UNAS</h2>
      <h4 className="text-center">Análisis Estadístico de PPP y Tesis - SIGGTPP UNAS</h4>

      {/* Ya no usamos FileUploader porque el Excel está precargado */}

      <Charts filtros={filtros} />
    </div>
  );
}
