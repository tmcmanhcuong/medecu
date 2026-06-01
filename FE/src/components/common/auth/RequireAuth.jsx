import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function RequireAuth() {
    const { authed, initializing } = useAuth();

    if (initializing) {
        return <div>Loading...</div>;
    }
    if (!authed) {
        return <Navigate to="/signin" replace />;
    }
    return <Outlet />;
}

export default RequireAuth;
