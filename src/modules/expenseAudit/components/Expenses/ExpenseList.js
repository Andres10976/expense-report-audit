import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import { useAuth } from "../../../../components/AuthProvider";
import Card from "../../../../components/common/Card";
import Table from "../../../../components/common/Table";
import Button from "../../../../components/common/Button";
import DateRangePicker from "../../../../components/common/DateRangePicker";
import { Plus, Search, FileText } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";

const ExpenseList = () => {
  const today = new Date();
  const navigate = useNavigate();
  const { expenseReports, loading } = useExpenseAudit();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (value) =>
        value.toLocaleDateString("es-CR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    { key: "rubro", header: "Rubro" },
    {
      key: "monto",
      header: "Monto",
      render: (value) =>
        value.toLocaleString("es-CR", {
          style: "currency",
          currency: "CRC",
        }),
    },
    { key: "st", header: "ST" },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => {
        if (row.aprobacionAsistente === "No aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
              No aprobada
            </span>
          );
        }
        if (row.aprobacionContabilidad === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Aprobado
            </span>
          );
        }
        if (row.aprobacionJefatura === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Contabilidad
            </span>
          );
        }
        if (row.aprobacionAsistente === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Jefatura
            </span>
          );
        }
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Pendiente
          </span>
        );
      },
    },
  ];

  const filterExpenses = useCallback(() => {
    return expenseReports
      .filter((expense) => expense.createdBy.email === user?.username)
      .filter((expense) => {
        // Date range filter
        if (startDate && endDate) {
          const expenseDate = expense.fecha.getTime();
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // Include full end date
          if (expenseDate < start || expenseDate > end) return false;
        }

        // Search term filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            expense.rubro.toLowerCase().includes(search) ||
            expense.st.toLowerCase().includes(search)
          );
        }
        return true;
      });
  }, [expenseReports, user?.username, startDate, endDate, searchTerm]);

  const filteredExpenses = filterExpenses();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} gastos encontrados
          </p>
        </div>
        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={() => navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.NEW)}
        >
          Nuevo Gasto
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar por rubro o ST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            />
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            maxDate={today.toISOString().split("T")[0]}
            className="flex-1"
          />
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredExpenses}
          isLoading={loading}
          onRowClick={(expense) =>
            navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id))
          }
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron gastos
              </h3>
              <p className="text-sm text-gray-500">
                Intenta ajustar los filtros o crea un nuevo gasto
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default ExpenseList;
