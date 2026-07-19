import "./Navbar.css";
import logo from "../../assets/images/n_logo.png";
import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav>
            <div>
                <img src={logo} alt="Logo" />
            </div>

            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/login">Login</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;