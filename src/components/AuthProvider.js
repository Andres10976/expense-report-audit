import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/AuthConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const appContext = useAppContext();

  const getUserDepartmentInfo = (email) => {
    if (!appContext?.roles || !appContext?.departments) return null;
    
    // Find the user's role
    const userRole = appContext.roles.find(role => role.empleado?.email === email);
    if (!userRole) return null;

    // Find the department
    const department = appContext.departments.find(dept => dept.id === userRole.departamentoId.toString());
    if (!department) return null;

    // Determine role type
    let roleType = 'Empleado';
    if (department.asistentes.some(asst => asst.email === email)) {
      roleType = 'Asistente';
    } else if (department.jefes.some(boss => boss.email === email)) {
      roleType = 'Jefe';
    }

    return {
      departamento: department.departamento,
      tipo: roleType
    };
  };

  useEffect(() => {
    if (accounts.length > 0 && appContext?.roles && appContext?.departments) {
      const departmentInfo = getUserDepartmentInfo(accounts[0].username);
      setUser(prev => ({
        ...accounts[0],
        department: departmentInfo?.departamento || 'No asignado',
        role: departmentInfo?.tipo || 'No asignado'
      }));
    }
  }, [accounts, appContext?.roles, appContext?.departments]);

  const login = async () => {
    try {
      const result = await instance.loginPopup(loginRequest);
      if (result.account) {
        const departmentInfo = getUserDepartmentInfo(result.account.username);
        setUser({
          ...result.account,
          department: departmentInfo?.departamento || 'No asignado',
          role: departmentInfo?.tipo || 'No asignado'
        });
        const returnUrl = location.state?.from?.pathname || '/dashboard';
        navigate(returnUrl);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await instance.logoutPopup();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      navigate('/login');
    }
  };

  const value = {
    user,
    login,
    logout,
    inProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}