import { useState, useEffect } from "react";
import axios from "axios";

function Location({ form_dta, set_form_dta }) {
    const [pincodeData, setPincodeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch location data when PIN code changes
    useEffect(() => {
        if (form_dta.pincode && form_dta.pincode.length === 6) {
            fetchPincodeData(form_dta.pincode);
        } else {
            setPincodeData(null);
            // Clear location fields when PIN is invalid
            set_form_dta(prev => ({
                ...prev,
                state: "",
                district: "",
                city: ""
            }));
        }
    }, [form_dta.pincode]);

    const fetchPincodeData = async (pincode) => {
        setLoading(true);
        setError("");
        
        try {
            const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
            
            if (response.data && response.data[0].Status === "Success") {
                const data = response.data[0].PostOffice[0];
                setPincodeData(data);
                
                // Auto-populate state, district, city
                set_form_dta(prev => ({
                    ...prev,
                    state: data.State,
                    district: data.District,
                    city: data.Block || data.District
                }));
            } else {
                setError("Invalid PIN code");
                setPincodeData(null);
            }
        } catch (err) {
            setError("Failed to fetch location data");
            setPincodeData(null);
        } finally {
            setLoading(false);
        }
    };

    function handlePincodeChange(e) {
        const { name, value } = e.target;
        
        // Allow only numbers
        const numericValue = value.replace(/\D/g, "");
        
        set_form_dta(prev => ({
            ...prev,
            [name]: numericValue
        }));
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        set_form_dta(prev => ({
            ...prev,
            [name]: value
        }));
    }

    return (
        <>
            <div className="collectionagent-field">
                <label>PIN Code</label>
                <input
                    type="text"
                    name="pincode"
                    placeholder="Enter 6-digit PIN code"
                    value={form_dta.pincode}
                    onChange={handlePincodeChange}
                    maxLength={6}
                    className={error ? "input-error" : ""}
                />
                {loading && <div className="loading-text">Fetching location...</div>}
                {error && <div className="error-message">{error}</div>}
            </div>

            {pincodeData && (
                <>
                    <div className="collectionagent-field">
                        <label>State</label>
                        <input
                            type="text"
                            name="state"
                            value={form_dta.state}
                            onChange={handleInputChange}
                            readOnly
                            className="readonly-field"
                        />
                    </div>

                    <div className="collectionagent-field">
                        <label>District</label>
                        <input
                            type="text"
                            name="district"
                            value={form_dta.district}
                            onChange={handleInputChange}
                            readOnly
                            className="readonly-field"
                        />
                    </div>

                    <div className="collectionagent-field">
                        <label>City/Taluk</label>
                        <input
                            type="text"
                            name="city"
                            value={form_dta.city}
                            onChange={handleInputChange}
                            readOnly
                            className="readonly-field"
                        />
                    </div>
                </>
            )}
        </>
    );
}

export default Location;