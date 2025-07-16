import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Filters({ filters = {}, setFilters, uniqueValues = {} }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setFilters((prev) => ({ ...prev, rangoFechas: [start, end] }));
  };

  const limpiarFiltros = () => {
    setFilters({
      facultad: "",
      escuela: "",
      genero: "",
      estado: "",
      area: "",
      rangoFechas: null,
    });
  };

  return (
    <div className="card p-3 mb-4">
      <div className="row mb-3">
        <div className="col-md-3">
          <label>Área</label>
          <select
            className="form-control"
            name="area"
            value={filters.area || ""}
            onChange={handleInputChange}
          >
            <option value="">Todas</option>
            <option value="PPP">PPP</option>
            <option value="Tesis">Tesis</option>
          </select>
        </div>
        <div className="col-md-3">
          <label>Facultad</label>
          <select
            className="form-control"
            name="facultad"
            value={filters.facultad || ""}
            onChange={handleInputChange}
          >
            <option value="">Todas</option>
            {uniqueValues.facultad?.map((fac, idx) => (
              <option key={idx} value={fac}>
                {fac}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label>Escuela</label>
          <select
            className="form-control"
            name="escuela"
            value={filters.escuela || ""}
            onChange={handleInputChange}
          >
            <option value="">Todas</option>
            {uniqueValues.escuela?.map((esc, idx) => (
              <option key={idx} value={esc}>
                {esc}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label>Género</label>
          <select
            className="form-control"
            name="genero"
            value={filters.genero || ""}
            onChange={handleInputChange}
          >
            <option value="">Todos</option>
            {uniqueValues.genero?.map((gen, idx) => (
              <option key={idx} value={gen}>
                {gen}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Estado</label>
          <select
            className="form-control"
            name="estado"
            value={filters.estado || ""}
            onChange={handleInputChange}
          >
            <option value="">Todos</option>
            {uniqueValues.estado?.map((est, idx) => (
              <option key={idx} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>Rango de Fechas</label>
          <DatePicker
            selected={filters.rangoFechas ? filters.rangoFechas[0] : null}
            onChange={handleDateChange}
            startDate={filters.rangoFechas ? filters.rangoFechas[0] : null}
            endDate={filters.rangoFechas ? filters.rangoFechas[1] : null}
            selectsRange
            className="form-control"
            placeholderText="Selecciona un rango"
            dateFormat="yyyy-MM-dd"
            isClearable
          />
        </div>

        <div className="col-md-5 d-flex align-items-end gap-2">
          <button className="btn btn-primary w-50" onClick={() => setFilters({ ...filters })}>
            Aplicar Filtros
          </button>
          <button className="btn btn-secondary w-50" onClick={limpiarFiltros}>
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
