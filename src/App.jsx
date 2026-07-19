import { Routes, Route } from "react-router-dom";

import Home from "./pages/home/home";
import Login from "./pages/login/Login";
import Forgot_password from "./pages/forgot password/Forgot_password";
import Signup from "./pages/signup/Signup";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<Forgot_password />} />
            <Route path="/signup" element={<Signup/>}/>
        </Routes>
    );
}

export default App;