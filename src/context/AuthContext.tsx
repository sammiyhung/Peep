import { useNavigate, useLocation } from "react-router-dom";
import { createContext, useContext, useEffect, useState, useRef } from "react";

import { IUser } from "@/types";
import { getCurrentUser } from "@/lib/api/api";

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
};

type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isCheckingAuth = useRef(false);
  const hasInitialized = useRef(false);

  const checkAuthUser = async () => {
    if (isCheckingAuth.current) return false;
    
    isCheckingAuth.current = true;
    setIsLoading(true);
    try {
      const currentAccount = await getCurrentUser();
      if (currentAccount) {
        setUser({
          id: currentAccount._id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          imageUrl: currentAccount.imageUrl,
          bio: currentAccount.bio,
        });
        setIsAuthenticated(true);

        return true;
      }

      return false;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  };

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = [
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/verify-email-prompt'
    ];

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

    const token = localStorage.getItem("token");
    
    // Initial check only
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      if (!token && !isPublicRoute) {
        navigate("/sign-in", { replace: true });
      } else if (token) {
        checkAuthUser();
      }
      return;
    }
    
    // Subsequent checks - only redirect if needed
    if (!token && !isPublicRoute && location.pathname !== '/sign-in') {
      navigate("/sign-in", { replace: true });
    }
  }, [location.pathname]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserContext = () => useContext(AuthContext);
