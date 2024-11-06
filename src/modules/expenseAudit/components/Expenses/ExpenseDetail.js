import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import { useAuth } from "../../../../components/AuthProvider";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import ExpenseImage from "./ExpenseImage";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import {
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  Image,
  Loader,
  StickyNote,
  XCircle,
  Check,
  X,
  User,
  Mail,
  Trash2,
} from "lucide-react";

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    expenseReports,
    loading: reportsLoading,
    setExpenseReports,
    service,
    userDepartmentRole,
  } = useExpenseAudit();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const returnPath =
    location.state?.from?.pathname || EXPENSE_AUDIT_ROUTES.EXPENSES.LIST;
  const { user } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "approve",
    title: "",
    message: "",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    title: "¿Confirmar eliminación?",
    message:
      "¿Está seguro que desea eliminar este gasto? Esta acción no se puede deshacer.",
  });

  useEffect(() => {
    if (!reportsLoading && expenseReports.length > 0) {
      const foundExpense = expenseReports.find((exp) => exp.id === id);
      setExpense(foundExpense);
      setLoading(false);
    }
  }, [id, expenseReports, reportsLoading]);

  const handleBack = () => {
    navigate(returnPath);
  };

  const handleEdit = () => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.EDIT(id), {
      state: { from: location.state?.from },
    });
  };

  const canDelete = () => {
    if (!userDepartmentRole || !expense) return false;

    if (
      userDepartmentRole.username === expense.createdBy.email &&
      !expense.bloqueoEdicion
    ) {
      return true;
    }

    if (
      userDepartmentRole.role === "Jefe" ||
      userDepartmentRole.role === "Asistente"
    ) {
      return true;
    }

    if (
      userDepartmentRole.department &&
      userDepartmentRole.department.departamento &&
      userDepartmentRole.department.departamento
        .toLowerCase()
        .includes("contabilidad")
    ) {
      return true;
    }

    return false;
  };

  const handleDelete = () => {
    setDeleteDialog((prev) => ({ ...prev, isOpen: true }));
  };

  const handleConfirmDelete = async () => {
    try {
      await service.deleteExpenseReport(id);

      setExpenseReports((prevReports) =>
        prevReports.filter((report) => report.id !== id)
      );

      navigate(returnPath);
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const canEdit = () => {
    if (!userDepartmentRole || !expense) return false;
  
    if (userDepartmentRole.role === "Jefe" || userDepartmentRole.role === "Asistente") {
      return true;
    }
  
    
    return (
      userDepartmentRole.username === expense.createdBy.email &&
      !expense.bloqueoEdicion
    );
  };

  if (loading || reportsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader size={48} className="animate-spin mb-4" />
        <p>Cargando detalles del gasto...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error mb-4" />
        <h2 className="text-xl font-semibold mb-4">Gasto no encontrado</h2>
        <Button
          variant="outline"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.LIST)}
        >
          Volver a la lista
        </Button>
      </div>
    );
  }

  const approvalStatus = [
    {
      title: "Revisión de Asistente",
      approved: expense.aprobacionAsistente,
    },
    {
      title: "Aprobación de Jefatura",
      approved: expense.aprobacionJefatura,
    },
    {
      title: "Aprobación de Contabilidad",
      approved: expense.aprobacionContabilidad,
    },
  ];

  const getStatusClass = (status) => {
    if (status === "Aprobada") return "text-success bg-success/10";
    if (status === "No aprobada") return "text-error bg-error/10";
    return "text-gray-400 bg-gray-100";
  };

  const getStatusIcon = (status) => {
    if (status === "Aprobada") return <CheckCircle size={24} />;
    if (status === "No aprobada") return <XCircle size={24} />;
    return <Clock size={24} />;
  };

  const getApprovalType = () => {
    if (!userDepartmentRole) return null;
    
    const isAccountant = (userDepartmentRole.department?.departamento || '')
      .toLowerCase()
      .includes('contabilidad');

    if (isAccountant) return "accounting";
    return userDepartmentRole.role === "Jefe" ? "boss" : "assistant";
  };

  const handleApprove = async () => {
    setConfirmDialog({
      isOpen: true,
      type: "approve",
      title: "¿Confirmar aprobación?",
      message: "¿Está seguro que desea aprobar este gasto?",
    });
  };

  const handleReject = async () => {
    setConfirmDialog({
      isOpen: true,
      type: "reject",
      title: "¿Confirmar rechazo?",
      message:
        "¿Está seguro que desea rechazar este gasto? Debe proporcionar una nota de revisión.",
    });
  };

  const handleConfirmAction = async (notes = "") => {
    try {
      const type = getApprovalType();
      const status =
        confirmDialog.type === "approve" ? "Aprobada" : "No aprobada";

      await service.updateApprovalStatus(id, status, type, notes);

      setExpense((prev) => ({
        ...prev,
        bloqueoEdicion: true,
        notasRevision: notes,
        aprobacionAsistente:
          type === "assistant" ? status : prev.aprobacionAsistente,
        aprobacionJefatura: type === "boss" ? status : prev.aprobacionJefatura,
        aprobacionContabilidad:
          type === "accounting" ? status : prev.aprobacionContabilidad,
      }));

      setExpenseReports((prevReports) =>
        prevReports.map((report) =>
          report.id === id
            ? {
                ...report,
                bloqueoEdicion: true,
                notasRevision: notes,
                aprobacionAsistente:
                  type === "assistant" ? status : report.aprobacionAsistente,
                aprobacionJefatura:
                  type === "boss" ? status : report.aprobacionJefatura,
                aprobacionContabilidad:
                  type === "accounting"
                    ? status
                    : report.aprobacionContabilidad,
              }
            : report
        )
      );
    } catch (error) {
      console.error("Error updating approval status:", error);
    }
  };

  const canApprove = () => {
    if (!user || !expense || !service || !userDepartmentRole) return false;
    
    return service.canApprove(
      expense,
      userDepartmentRole.role,
      userDepartmentRole.department?.departamento
    );
  };

  

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            startIcon={<ArrowLeft size={16} />}
            onClick={handleBack}
          >
            Volver
          </Button>
          {canDelete() && (
            <Button
              variant="outline"
              className="text-error hover:bg-error/10"
              startIcon={<Trash2 size={16} />}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          )}
          {canEdit() && (
            <Button
              variant="outline"
              startIcon={<Edit size={16} />}
              onClick={handleEdit}
            >
              Editar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-semibold">Descripción factura</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-sm text-gray-500">Rubro</span>
                  <p className="text-gray-900 mt-1">{expense.rubro}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fecha</span>
                  <p className="text-gray-900 mt-1">
                    {expense.fecha.toLocaleDateString("es-CR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ST</span>
                  <p className="text-gray-900 mt-1">{expense.st}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Monto</span>
                  <p className="text-gray-900 mt-1 font-semibold">
                    {expense.monto.toLocaleString("es-CR", {
                      style: "currency",
                      currency: "CRC",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fondos Propios</span>
                  <p className="text-gray-900 mt-1">
                    {expense.fondosPropios ? "Sí" : "No"}
                  </p>
                </div>
                {expense.fondosPropios && (
                  <div className="col-span-3">
                    <span className="text-sm text-gray-500">Motivo</span>
                    <p className="text-gray-900 mt-1 break-words">
                      {expense.motivo || "No especificado"}
                    </p>
                  </div>
                )}
                {expense.facturaDividida && (
                  <>
                    <div>
                      <span className="text-sm text-gray-500">
                        Factura Dividida
                      </span>
                      <p className="text-gray-900 mt-1">Sí</p>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-gray-500">Integrantes</span>
                      <p className="text-gray-900 mt-1 break-words">
                        {expense.integrantes || "No especificados"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-1">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Solicitante</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Nombre</span>
                    <p className="text-gray-900">{expense.createdBy.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="text-gray-900">{expense.createdBy.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comprobante</h3>
              {expense.comprobante ? (
                <ExpenseImage itemId={expense.comprobante} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50 rounded-lg">
                  <Image size={48} className="mb-2" />
                  <p>No hay comprobante adjunto</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-3">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">
                Estado de Aprobación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {approvalStatus.map((status, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-4 rounded-lg ${getStatusClass(
                      status.approved
                    )}`}
                  >
                    <div className="mr-4">{getStatusIcon(status.approved)}</div>
                    <span className="font-medium">{status.title}</span>
                  </div>
                ))}
              </div>

              {expense.notasRevision && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center mb-2">
                    <StickyNote size={20} className="mr-2" />
                    <h4 className="font-medium">Notas de revisión</h4>
                  </div>
                  <p className="p-4 bg-gray-50 rounded-lg text-gray-700">
                    {expense.notasRevision}
                  </p>
                </div>
              )}
            </div>
            {canApprove() && (
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="text-success hover:bg-success/10"
                  startIcon={<Check size={16} />}
                  onClick={handleApprove}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outline"
                  className="text-error hover:bg-error/10"
                  startIcon={<X size={16} />}
                  onClick={handleReject}
                >
                  Rechazar
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        type="delete"
        title={deleteDialog.title}
        message={deleteDialog.message}
      />
    </>
  );
};

export default ExpenseDetail;