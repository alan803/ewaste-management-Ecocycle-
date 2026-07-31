import { useState, useEffect } from "react";
import axios from "axios";

function Location({ form_dta, set_form_dta })
{
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const API_KEY = "a9bb5f8339670c040d90ee13d2448a598b2bc2b70f4aa5fd78ead02a983f490a";


    // Load Countries
    useEffect(() => {

        axios.get(
            "https://api.countrystatecity.in/v1/countries",
            {
                headers: {
                    "X-CSCAPI-KEY": API_KEY
                }
            }
        )
        .then(response => {
            setCountries(response.data);
        })
        .catch(error => {
            console.log(error);
        });

    }, []);



    // Load States when Country changes
    useEffect(() => {

        if(form_dta.country)
        {
            axios.get(
                `https://api.countrystatecity.in/v1/countries/${form_dta.country}/states`,
                {
                    headers:{
                        "X-CSCAPI-KEY": API_KEY
                    }
                }
            )
            .then(response => {

                setStates(response.data);

            })
            .catch(error => {

                console.log(error);

            });


            // clear old state and city
            set_form_dta(prev => ({
                ...prev,
                state:"",
                city:""
            }));

        }

    },[form_dta.country]);




    // Load Cities when State changes
    useEffect(()=>{

        if(form_dta.state)
        {

            axios.get(
                `https://api.countrystatecity.in/v1/countries/${form_dta.country}/states/${form_dta.state}/cities`,
                {
                    headers:{
                        "X-CSCAPI-KEY":API_KEY
                    }
                }
            )
            .then(response=>{

                setCities(response.data);

            })
            .catch(error=>{

                console.log(error);

            });

        }

    },[form_dta.state]);




    function handleLocationChange(e)
    {
        const {name,value}=e.target;

        set_form_dta(prev=>({

            ...prev,
            [name]:value

        }));

    }



    return(

        <>


        <div className="collectionagent-field">

            <label>Country</label>

            <select
            name="country"
            value={form_dta.country}
            onChange={handleLocationChange}
            >

                <option value="">
                    Select Country
                </option>


                {
                    countries.map(country=>(

                        <option
                        key={country.iso2}
                        value={country.iso2}
                        >

                            {country.name}

                        </option>

                    ))
                }

            </select>

        </div>



        <div className="collectionagent-field">

            <label>State</label>

            <select
            name="state"
            value={form_dta.state}
            onChange={handleLocationChange}
            >

                <option value="">
                    Select State
                </option>


                {
                    states.map(state=>(

                        <option
                        key={state.iso2}
                        value={state.iso2}
                        >

                            {state.name}

                        </option>

                    ))
                }

            </select>

        </div>




        <div className="collectionagent-field">

            <label>City</label>

            <select
            name="city"
            value={form_dta.city}
            onChange={handleLocationChange}
            >

                <option value="">
                    Select City
                </option>


                {
                    cities.map(city=>(

                        <option
                        key={city.id}
                        value={city.name}
                        >

                            {city.name}

                        </option>

                    ))
                }

            </select>

        </div>


        </>

    );

}


export default Location;