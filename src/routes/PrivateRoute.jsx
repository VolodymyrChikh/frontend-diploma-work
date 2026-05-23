import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/auth-context.js";
import { createSignInRedirect, isPrivateRouteAllowed } from "../auth/guards.js";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();
  const routeState = isPrivateRouteAllowed({ loading, isAuthenticated });
  
  if (routeState.status === 'loading') {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Завантаження...</div>;
  }

  if (routeState.status === 'allow') {
    return children;
  }
  
  const redirect = createSignInRedirect(location);
  return <Navigate to={redirect.to} {...redirect.options} />;
};

export default PrivateRoute;
