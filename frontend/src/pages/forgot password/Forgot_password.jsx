import "./Forgot_password.css";
import { useState } from "react";
function Forgot_password(){
    const[form_dta,set_form_dta]=useState({
        email:""
    });
    const[error_message,set_error_message]=useState(
    {
        email_err:""
    }
    );
    function handleInputChange(e)
    {
        const{name,value}=e.target;
        set_form_dta({
            ...form_dta,
            [name]:value
        });
        if(name==="email")
        {
            set_error_message({
                ...error_message,
                email_err:validate_email(value)
            });
        }
    }
    function validate_email(value)
    {
        if(value==="")
            {
                return "Email is required";
            }
            if(!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value))
            {
                return "Invalid email address";
            }
            return "";
    }
    return(
        <form onSubmit={handleInputChange}>
            <input type="email" name="email" placeholder="Enter your linked email address" onChange={handleInputChange} /><br></br>
            <div className="error-message">
                {error_message.email_err}
            </div>
            <button type="submit">Send</button>
        </form>
    );
}
export default Forgot_password;