import React from "react";
import * as XLSX from "xlsx";

const FileUploader = ({ onDataLoaded }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Normalizamos las fechas (en caso se necesite más adelante)
      const normalizeDate = (value) => {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
      };

      const parsedData = jsonData.map((row) => ({
        ...row,
        fecha_inicio_ppp: normalizeDate(row.fecha_inicio_ppp),
        fecha_inicio_tesis: normalizeDate(row.fecha_inicio_tesis),
      }));

      onDataLoaded(parsedData); // Enviamos los datos al componente padre
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mb-4">
      <label htmlFor="file-upload" className="form-label fw-bold">
        Cargar archivo Excel (.xlsx) de datos unificados PPP - Tesis
      </label>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="form-control"
        onChange={handleFileUpload}
        id="file-upload"
      />
    </div>
  );
};

export default FileUploader;
