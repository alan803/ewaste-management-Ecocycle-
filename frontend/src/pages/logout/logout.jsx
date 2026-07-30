import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        // Remove stored authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("firstName");
        localStorage.removeItem("role");
        localStorage.removeItem("roleId");

        // Redirect to login page
        navigate("/login");
    }, [navigate]);

    return null;
}

export default Logout;