import { Routes, Route } from "react-router-dom";

import Home from "./pages/home/home";
import Login from "./pages/login/Login";
import Forgot_password from "./pages/forgot password/Forgot_password";
import Signup from "./pages/signup/Signup";
import Citizen from "./pages/citizen/Citizendashboard";
import Admin from "./pages/Administrator/Admindashboard";
import collectionagent from "./pages/Collection Agent/Collectionagent_dashboard";
import Logout from "./pages/logout/logout";
import Navbar from "./pages/Administrator/Navbar";
import Usermanagement from "./pages/Administrator/Usermanagement";
import CollectionAgent_signup from "./pages/signup/CollectionAgent_signup";
import CollectionAgent_dashboard from "./pages/Collection Agent/Collectionagent_dashboard";
import Technician_signup from "./pages/technician/Technician_signup";
import Inspectiontechnician_dashboard from "./pages/Inspection Technician/Inspectiontechnician_dashboard";
import RefurbishmentCenter_signup from "./pages/signup/refurbishmentcenter_signup";
import Refurbishment_dashboard from "./pages/refurbishment center/Refurbishmentcenter_dashboard"
import RecyclingCenter_signup from "./pages/signup/recyclingcenter_signup";
import Recycling_dashboard from "./pages/Recycling Center/Recyclingcenter_dashboard";
import Verify_otp from "./pages/forgot password/Verify_otp";
import Reset_passwprd from "./pages/forgot password/Reset_passwprd";
import Manage_collectionagent from "./pages/Administrator/Manage_collectionagent";
import View_collectionagent from "./pages/Administrator/View_collectionagent";
import Manage_technicians from "./pages/Administrator/Manage_technicians";
import View_technician from "./pages/Administrator/View_technician";
import Manage_recyclingcenter from "./pages/Administrator/Manage_recyclingcenter";
import View_recyclingagent from "./pages/Administrator/View_recyclingagent";
import Manage_refurbishmentcenter from "./pages/Administrator/Manage_refurbishmentcenter";
import View_refurbishmentcenter from "./pages/Administrator/View_refurbishmentcenter";
import Manage_users from "./pages/Administrator/Manage_users";
import ManageCollectionAgent from "./pages/Administrator/ManageCollectionAgent";
import Add_device from "./pages/citizen/Add_device";
import Manage_device from "./pages/Administrator/Manage_device";
import Managerefurbishment from "./pages/Administrator/Managerefurbishment";
import Managerecyclingcenter from "./pages/Administrator/Managerecyclingcenter";
import Managetechnician from "./pages/Administrator/Managetechnican";
import View_device from "./pages/citizen/View_device";
import Manage_assignmentandpickups from "./pages/Administrator/Manage_assignmentandpickups";
import Manage_userprofile from "./pages/citizen/Manage_userprofile";
import Technician_notification from "./pages/Inspection Technician/Technician_notification";
import Profile from "./pages/Collection Agent/Profile";
import Insp_profile from "./pages/Inspection Technician/Insp_profile";
import RefurbishmentProfile from "./pages/refurbishment center/refurbishment_profile";
import RecycleProfile from "./pages/Recycling Center/recycle_profile";
import Pickup_collectionagent from "./pages/Administrator/Pickup_collectionagent";
import Pickupdetails from "./pages/citizen/Pickupdetails";
import Pickups from "./pages/Collection Agent/Pickups";
import TechnicianDelivery from "./pages/Inspection Technician/technician_delivery";
import ManagePickup from "./pages/Administrator/Manage_pickup";
import ManageDelivery from "./pages/Administrator/Manage_delivery";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<Forgot_password />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/citizen" element={<Citizen />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/collectionagent" element={<collectionagent />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/navbar" element={<Navbar />} />
            <Route path="/usermanagement" element={<Usermanagement />} />
            <Route path="/signup/collection-agent" element={<CollectionAgent_signup />} />
            <Route path="/collectionagent/dashboard" element={<CollectionAgent_dashboard />} />
            <Route path="/technician_signup" element={<Technician_signup />}></Route>
            <Route path="/technician_dashboard" element={<Inspectiontechnician_dashboard />}></Route>
            <Route path="/signup/refurbishmententer_signup" element={<RefurbishmentCenter_signup />}></Route>
            <Route path="/refurbishment_dashboard" element={<Refurbishment_dashboard />}></Route>
            <Route path="/refurbishmentcenter_dashboard" element={<Refurbishment_dashboard />}></Route>
            <Route path="/refurbishmententer_dashboard" element={<Refurbishment_dashboard />}></Route>
            <Route path="/signup/recyclingenter_signup" element={<RecyclingCenter_signup />}></Route>
            <Route path="/signup/recyclingcenter_signup" element={<RecyclingCenter_signup />}></Route>
            <Route path="/signup/recycling-center" element={<RecyclingCenter_signup />}></Route>
            <Route path="/recyclingenter_dashboard" element={<Recycling_dashboard />}></Route>
            <Route path="/recyclingcenter_dashboard" element={<Recycling_dashboard />}></Route>
            <Route path="/recycling_dashboard" element={<Recycling_dashboard />}></Route>
            <Route path="/verify-otp" element={<Verify_otp />}></Route>
            <Route path="/reset-password" element={<Reset_passwprd />}></Route>
            <Route path="/manage-collectionagent" element={<Manage_collectionagent />}></Route>
            <Route path="/manage-collectionagents" element={<ManageCollectionAgent />}></Route>
            <Route path="/view-collectionagent/:id" element={<View_collectionagent />} />
            <Route path="/manage-technicians" element={<Manage_technicians />} />
            <Route path="/view-technician/:id" element={<View_technician />} />
            <Route path="/manage-recyclingcenter" element={<Manage_recyclingcenter />} />
            <Route path="/view-recyclingcenter/:id" element={<View_recyclingagent />} />
            <Route path="/view-recyclingagent/:id" element={<View_recyclingagent />} />
            <Route path="/manage-refurbishmentcenter" element={<Manage_refurbishmentcenter />} />
            <Route path="/view-refurbishmentcenter/:id" element={<View_refurbishmentcenter />} />
            <Route path="/manage-users" element={<Manage_users />} />
            <Route path="/add-device" element={<Add_device />} />
            <Route path="/manage-device" element={<Manage_device/>}/>
            <Route path="/manage-refurbishment" element={<Managerefurbishment/>}/>
            <Route path="/manage-recyclingcenters" element={<Managerecyclingcenter/>}/>
            <Route path="/managetechnicians" element={<Managetechnician/>}/>
            <Route path="/view-device" element={<View_device/>}/>
            <Route path="/manage-assignmentandpickups" element={<Manage_assignmentandpickups/>}/>
            <Route path="/manage-userprofile" element={<Manage_userprofile/>}/>
            <Route path="/technician-notification" element={<Technician_notification/>}/>
            <Route path="/agent-profile" element={<Profile/>}/>
            <Route path="/collectionagent/profile" element={<Profile/>}/>
            <Route path="/technician/profile" element={<Insp_profile/>}/>
            <Route path="/insp_profile" element={<Insp_profile/>}/>
            <Route path="/refurbishment/profile" element={<RefurbishmentProfile/>}/>
            <Route path="/refurbishment_profile" element={<RefurbishmentProfile/>}/>
            <Route path="/refurbishmentcenter_profile" element={<RefurbishmentProfile/>}/>
            <Route path="/recycling/profile" element={<RecycleProfile/>}/>
            <Route path="/recycle_profile" element={<RecycleProfile/>}/>
            <Route path="/recyclingcenter_profile" element={<RecycleProfile/>}/>
            <Route path="/recyclingcenter/profile" element={<RecycleProfile/>}/>
            <Route path="/collectionagent-pickup" element={<Pickup_collectionagent/>}/>
            <Route path="/collectionagent/pickups" element={<Pickups/>}/>
            <Route path="/agent-pickups" element={<Pickups/>}/>
            <Route path="/pickupuser" element={<Pickupdetails/>}/>
            <Route path="/technician/deliveries" element={<TechnicianDelivery/>}/>
            <Route path="/technician-deliveries" element={<TechnicianDelivery/>}/>
            <Route path="/technician_delivery" element={<TechnicianDelivery/>}/>

            <Route path="/manage-pickup" element={<ManagePickup/>}/>
            <Route path="/manage-pickups" element={<ManagePickup/>}/>
            <Route path="/manage_pickup" element={<ManagePickup/>}/>
            <Route path="/manage-delivery" element={<ManageDelivery/>}/>
            <Route path="/manage-deliveries" element={<ManageDelivery/>}/>
            <Route path="/manage_delivery" element={<ManageDelivery/>}/>

        </Routes>
    );
}

export default App;