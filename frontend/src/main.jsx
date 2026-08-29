import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./index.css";

const clientId = "687616550946-oijv7g0d8395er7461qr7shuiob75k05.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </GoogleOAuthProvider>
);