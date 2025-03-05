import React from 'react';
import { X } from 'lucide-react';
import { useCursoControl } from '../../context/cursoControlContext';
import Button from '../../../../components/common/Button';

const FilterBar = () => {
  const {
    personasFilters,
    setPersonasFilters,
    empresas
  } = useCursoControl();

  const handleResetFilters = () => {
    setPersonasFilters({
      empresa: ""
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Empresa filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          <select
            value={personasFilters.empresa}
            onChange={(e) => setPersonasFilters({ empresa: e.target.value })}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((empresa) => (
              <option key={empresa} value={empresa}>
                {empresa}
              </option>
            ))}
          </select>
        </div>
        
        {/* Reset filters button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            size="default"
            startIcon={<X size={16} />}
            onClick={handleResetFilters}
            className="w-full md:w-auto"
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;