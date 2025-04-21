import { Routes, Route } from 'react-router-dom';
import Dashboard from '../layouts/Dashboard';
import ProcedimientosList from '../components/Procedimientos/ProcedimientosList';
import ProcedimientoForm from '../components/Procedimientos/ProcedimientoForm';
import PasosManager from '../components/Procedimientos/PasosManager';
import ProcedimientoViewer from '../components/Procedimientos/ProcedimientoViewer';
// Otras importaciones...

const AppRoutes = () => {
  return (
    <Routes>
      {/* Otras rutas... */}
      <Route path="/dashboard" element={<Dashboard />}>
        {/* Rutas de procedimientos */}
        <Route path="procedimientos" element={<ProcedimientosList />} />
        <Route path="procedimientos/nuevo" element={<ProcedimientoForm />} />
        <Route path="procedimientos/:id/editar" element={<ProcedimientoForm />} />
        <Route path="procedimientos/:id/pasos" element={<PasosManager />} />
        <Route path="procedimientos/:id/ver" element={<ProcedimientoViewer />} />
        {/* Otras rutas... */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;