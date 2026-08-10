import "./Navbar.css";
import logo from "../../assets/images/n_logo.png";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";

function Navbar() {
    return (
        <nav className="main-site-navbar">
            <div>
                <img src={logo} alt="Logo" />
            </div>

            <ul>
                <li>
                    <HashLink smooth to="/#home">
                        Home
                    </HashLink>
                </li>
                <li>
                    <HashLink smooth to="/#about">
                        About
                    </HashLink>
                </li>
                <li>
                    <HashLink smooth to="/#services">
                        Services
                    </HashLink>
                </li>
                <li>
                    <HashLink smooth to="/#contact">
                        Contact
                    </HashLink>
                </li>
                <li><Link to="/login">Login</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;