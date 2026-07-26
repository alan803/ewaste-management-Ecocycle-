import { Routes, Route } from "react-router-dom";

import Home from "./pages/home/home";
import Login from "./pages/login/Login";
import Forgot_password from "./pages/forgot password/Forgot_password";
import Signup from "./pages/signup/Signup";
import Citizen from "./pages/citizen/Citizendashboard";
import Admin from "./pages/Administrator/Admindashboard";
import collectionagent from "./pages/Collection Agent/Collectionagent_dashboard";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<Forgot_password />} />
            <Route path="/signup" element={<Signup/>}/>
            <Route path="/citizen" element={<Citizen/>}/>
            <Route path="/admin" element={<Admin/>}/>
            <Route path="/collectionagent" element={<collectionagent/>}/>
        </Routes>
    );
}

export default App;