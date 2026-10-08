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
import DeviceInspection from "./pages/Inspection Technician/Device_inspection";
import InspectionReport from "./pages/Inspection Technician/Inspection_report";
import RefurbishmentCenter_signup from "./pages/signup/refurbishmentcenter_signup";
import Refurbishment_dashboard from "./pages/Refurbishment Center/Refurbishmentcenter_dashboard";
import RefurbishmentPerform from "./pages/Refurbishment Center/Refurbishment_perform";
import RecyclingCenter_signup from "./pages/signup/recyclingcenter_signup";
import Recycling_dashboard from "./pages/Recycling Center/Recyclingcenter_dashboard";
import RecyclingPerform from "./pages/Recycling Center/Recycling_perform";
import RecyclingDelivery from "./pages/Recycling Center/recycling_delivery";
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
import ManageMaterialPrices from "./pages/Administrator/Manage_materialprices";
import ManageModelPrices from "./pages/Administrator/Manage_modelprices";
import Managerefurbishment from "./pages/Administrator/Managerefurbishment";
import Managerecyclingcenter from "./pages/Administrator/Managerecyclingcenter";
import Managetechnician from "./pages/Administrator/Managetechnican";
import View_device from "./pages/citizen/View_device";
import Manage_assignmentandpickups from "./pages/Administrator/Manage_assignmentandpickups";
import Manage_userprofile from "./pages/citizen/Manage_userprofile";
import Technician_notification from "./pages/Inspection Technician/Technician_notification";
import TechnicianPenalties from "./pages/Inspection Technician/Technician_penalties";
import Recyclingcenter_notification from "./pages/Recycling Center/Recyclingcenter_notification";
import Refurbishmentcenter_notification from "./pages/Refurbishment Center/Refurbishmentcenter_notification";
import Profile from "./pages/Collection Agent/Profile";
import Insp_profile from "./pages/Inspection Technician/Insp_profile";
import RefurbishmentProfile from "./pages/Refurbishment Center/refurbishment_profile";
import RecycleProfile from "./pages/Recycling Center/recycle_profile";
import Pickup_collectionagent from "./pages/Administrator/Pickup_collectionagent";
import Pickupdetails from "./pages/citizen/Pickupdetails";
import Pickups from "./pages/Collection Agent/Pickups";
import TechnicianDelivery from "./pages/Inspection Technician/technician_delivery";
import ManagePickup from "./pages/Administrator/Manage_pickup";
import ManageDelivery from "./pages/Administrator/Manage_delivery";
import ManageInspection from "./pages/Administrator/Manage_inspection";
import AllocateRecyclingCenter from "./pages/Administrator/Allocate_recyclingcenter";
import RefurbishmentAllocation from "./pages/Administrator/Refurbishment_allocation";
import ManageRecyclingAllocation from "./pages/Administrator/Manage_recyclingallocation";
import ManageRefurbishmentAllocation from "./pages/Administrator/Manage_refurbishmentallocation";
import ManageCenterAllocation from "./pages/Administrator/Manage_centerallocation";
import CitizenDeviceReport from "./pages/citizen/Device_report";
import CitizenCertificates from "./pages/citizen/Certificates";
import ManagePenalties from "./pages/Administrator/Manage_penalties";
import ManageRecyclingProcess from "./pages/Administrator/Manage_recyclingprocess";
import ManageRefurbishmentProcess from "./pages/Administrator/Manage_refurbishmentprocess";
import ManageMaterialRecovery from "./pages/Administrator/Manage_materialrecovery";
import ManageCompletedDevices from "./pages/Administrator/Manage_completeddevices";
import ManageTransactions from "./pages/Administrator/Manage_transactions";

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
            <Route path="/manage-collectionagent" element={<ManageCollectionAgent />}></Route>
            <Route path="/manage-collectionagents" element={<ManageCollectionAgent />}></Route>
            <Route path="/view-collectionagent/:id" element={<View_collectionagent />} />
            <Route path="/manage-technicians" element={<Managetechnician />} />
            <Route path="/view-technician/:id" element={<View_technician />} />
            <Route path="/manage-recyclingcenter" element={<Managerecyclingcenter />} />
            <Route path="/view-recyclingcenter/:id" element={<View_recyclingagent />} />
            <Route path="/view-recyclingagent/:id" element={<View_recyclingagent />} />
            <Route path="/manage-refurbishmentcenter" element={<Managerefurbishment />} />
            <Route path="/view-refurbishmentcenter/:id" element={<View_refurbishmentcenter />} />
            <Route path="/manage-users" element={<Manage_users />} />
            <Route path="/add-device" element={<Add_device />} />
            <Route path="/manage-device" element={<Manage_device/>}/>
            <Route path="/admin/refurbishment-devices" element={<RefurbishmentAllocation />}/>
            <Route path="/admin/recycling-devices" element={<AllocateRecyclingCenter />}/>
            <Route path="/allocate-recycling" element={<AllocateRecyclingCenter />}/>
            <Route path="/allocate-recyclingcenter" element={<AllocateRecyclingCenter />}/>
            <Route path="/allocate-refurbishment" element={<RefurbishmentAllocation />}/>
            <Route path="/manage-recyclingallocation" element={<ManageRecyclingAllocation />}/>
            <Route path="/manage-refurbishmentallocation" element={<ManageRefurbishmentAllocation />}/>
            <Route path="/manage-centerallocation" element={<ManageCenterAllocation />}/>
            <Route path="/manage-centerallocations" element={<ManageCenterAllocation />}/>
            <Route path="/manage-recyclingcenterallocation" element={<ManageCenterAllocation />}/>
            <Route path="/manage-refurbishment" element={<Managerefurbishment/>}/>
            <Route path="/manage-recyclingcenters" element={<Managerecyclingcenter/>}/>
            <Route path="/managetechnicians" element={<Managetechnician/>}/>
            <Route path="/view-device" element={<View_device/>}/>
            <Route path="/manage-assignmentandpickups" element={<Manage_assignmentandpickups/>}/>
            <Route path="/manage-userprofile" element={<Manage_userprofile/>}/>
            <Route path="/technician-notification" element={<Technician_notification/>}/>
            <Route path="/technician/notifications" element={<Technician_notification/>}/>
            <Route path="/technician/notification" element={<Technician_notification/>}/>
            <Route path="/recyclingcenter-notification" element={<Recyclingcenter_notification/>}/>
            <Route path="/recyclingcenter_notification" element={<Recyclingcenter_notification/>}/>
            <Route path="/recyclingcenter/notifications" element={<Recyclingcenter_notification/>}/>
            <Route path="/recyclingcenter/notification" element={<Recyclingcenter_notification/>}/>
            <Route path="/refurbishmentcenter-notification" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/refurbishmentcenter_notification" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/refurbishmentcenter/notifications" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/refurbishmentcenter/notification" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/refurbishment-notification" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/refurbishment/notification" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/refurbishment/notifications" element={<Refurbishmentcenter_notification/>}/>
            <Route path="/agent-profile" element={<Profile/>}/>
            <Route path="/collectionagent/profile" element={<Profile/>}/>
            <Route path="/technician/profile" element={<Insp_profile/>}/>
            <Route path="/insp_profile" element={<Insp_profile/>}/>
            <Route path="/refurbishment/profile" element={<RefurbishmentProfile/>}/>
            <Route path="/refurbishment_profile" element={<RefurbishmentProfile/>}/>
            <Route path="/refurbishmentcenter_profile" element={<RefurbishmentProfile/>}/>
            <Route path="/refurbishment_perform" element={<RefurbishmentPerform/>}/>
            <Route path="/refurbishment_perform/:id" element={<RefurbishmentPerform/>}/>
            <Route path="/refurbishmentcenter_perform" element={<RefurbishmentPerform/>}/>
            <Route path="/refurbishmentcenter_perform/:id" element={<RefurbishmentPerform/>}/>
            <Route path="/refurbishment/perform" element={<RefurbishmentPerform/>}/>
            <Route path="/refurbishment/perform/:id" element={<RefurbishmentPerform/>}/>
            <Route path="/refurbishment/process/:id" element={<RefurbishmentPerform/>}/>
            <Route path="/recycling/profile" element={<RecycleProfile/>}/>
            <Route path="/recycle_profile" element={<RecycleProfile/>}/>
            <Route path="/recyclingcenter_profile" element={<RecycleProfile/>}/>
            <Route path="/recyclingcenter/profile" element={<RecycleProfile/>}/>
            <Route path="/recycling_perform" element={<RecyclingPerform/>}/>
            <Route path="/recyclingcenter_perform" element={<RecyclingPerform/>}/>
            <Route path="/recycling/perform" element={<RecyclingPerform/>}/>
            <Route path="/recycling_delivery" element={<RecyclingDelivery/>}/>
            <Route path="/recyclingcenter_delivery" element={<RecyclingDelivery/>}/>
            <Route path="/recycling/deliveries" element={<RecyclingDelivery/>}/>
            <Route path="/recyclingcenter/deliveries" element={<RecyclingDelivery/>}/>
            <Route path="/collectionagent-pickup" element={<Pickup_collectionagent/>}/>
            <Route path="/collectionagent/pickups" element={<Pickups/>}/>
            <Route path="/agent-pickups" element={<Pickups/>}/>
            <Route path="/pickupuser" element={<Pickupdetails/>}/>
            <Route path="/citizen/reports" element={<CitizenDeviceReport/>}/>
            <Route path="/citizen-reports" element={<CitizenDeviceReport/>}/>
            <Route path="/citizen/device-reports" element={<CitizenDeviceReport/>}/>
            <Route path="/certificates" element={<CitizenCertificates/>}/>
            <Route path="/citizen/certificates" element={<CitizenCertificates/>}/>
            <Route path="/citizen-certificates" element={<CitizenCertificates/>}/>
            <Route path="/citizen/rewards" element={<CitizenCertificates/>}/>
            <Route path="/citizen-rewards" element={<CitizenCertificates/>}/>
            <Route path="/technician/deliveries" element={<TechnicianDelivery/>}/>
            <Route path="/technician-deliveries" element={<TechnicianDelivery/>}/>
            <Route path="/technician-delivery" element={<TechnicianDelivery/>}/>
            <Route path="/technician_delivery" element={<TechnicianDelivery/>}/>
            <Route path="/technician/inspect" element={<DeviceInspection/>}/>
            <Route path="/technician/device-inspection" element={<DeviceInspection/>}/>
            <Route path="/technician-inspect" element={<DeviceInspection/>}/>
            <Route path="/device-inspection" element={<DeviceInspection/>}/>
            <Route path="/device_inspection" element={<DeviceInspection/>}/>
            <Route path="/technician-device-inspection" element={<DeviceInspection/>}/>
            <Route path="/technician/reports" element={<InspectionReport/>}/>
            <Route path="/technician-reports" element={<InspectionReport/>}/>
            <Route path="/technician/inspection-report" element={<InspectionReport/>}/>
            <Route path="/technician/penalties" element={<TechnicianPenalties/>}/>
            <Route path="/technician-penalties" element={<TechnicianPenalties/>}/>
            <Route path="/technician_penalties" element={<TechnicianPenalties/>}/>

            <Route path="/manage-pickup" element={<ManagePickup/>}/>
            <Route path="/manage-pickups" element={<ManagePickup/>}/>
            <Route path="/manage_pickup" element={<ManagePickup/>}/>
            <Route path="/manage-delivery" element={<ManageDelivery/>}/>
            <Route path="/manage-deliveries" element={<ManageDelivery/>}/>
            <Route path="/manage_delivery" element={<ManageDelivery/>}/>
            <Route path="/manage-inspection" element={<ManageInspection/>}/>
            <Route path="/manage-inspections" element={<ManageInspection/>}/>
            <Route path="/manage_inspection" element={<ManageInspection/>}/>
            <Route path="/manage-penalties" element={<ManagePenalties/>}/>
            <Route path="/manage-technician-penalties" element={<ManagePenalties/>}/>
            <Route path="/admin/technician-penalties" element={<ManagePenalties/>}/>
            <Route path="/admin/penalties" element={<ManagePenalties/>}/>

            <Route path="/manage-materialprices" element={<ManageMaterialPrices/>}/>
            <Route path="/manage-material-prices" element={<ManageMaterialPrices/>}/>
            <Route path="/admin/material-prices" element={<ManageMaterialPrices/>}/>

            <Route path="/manage-modelprices" element={<ManageModelPrices/>}/>
            <Route path="/manage-model-prices" element={<ManageModelPrices/>}/>
            <Route path="/admin/model-prices" element={<ManageModelPrices/>}/>
            <Route path="/admin/device-model-prices" element={<ManageModelPrices/>}/>

            <Route path="/manage-refurbishmentprocess" element={<ManageRefurbishmentProcess/>}/>
            <Route path="/manage-refurbishmentprocesses" element={<ManageRefurbishmentProcess/>}/>
            <Route path="/manage_refurbishmentprocess" element={<ManageRefurbishmentProcess/>}/>
            <Route path="/admin/refurbishment-processes" element={<ManageRefurbishmentProcess/>}/>
            <Route path="/admin/refurbishmentprocess" element={<ManageRefurbishmentProcess/>}/>

            <Route path="/manage-recyclingprocess" element={<ManageRecyclingProcess/>}/>
            <Route path="/manage-recyclingprocesses" element={<ManageRecyclingProcess/>}/>
            <Route path="/manage_recyclingprocess" element={<ManageRecyclingProcess/>}/>
            <Route path="/admin/recycling-processes" element={<ManageRecyclingProcess/>}/>
            <Route path="/admin/recyclingprocess" element={<ManageRecyclingProcess/>}/>

            <Route path="/manage-materialrecovery" element={<ManageMaterialRecovery/>}/>
            <Route path="/manage-material-recovery" element={<ManageMaterialRecovery/>}/>
            <Route path="/manage_materialrecovery" element={<ManageMaterialRecovery/>}/>
            <Route path="/admin/material-recovery" element={<ManageMaterialRecovery/>}/>

            <Route path="/manage-completeddevices" element={<ManageCompletedDevices/>}/>
            <Route path="/manage-completed-devices" element={<ManageCompletedDevices/>}/>
            <Route path="/manage_completeddevices" element={<ManageCompletedDevices/>}/>
            <Route path="/admin/completed-devices" element={<ManageCompletedDevices/>}/>
            <Route path="/admin/completeddevices" element={<ManageCompletedDevices/>}/>

            <Route path="/manage-transactions" element={<ManageTransactions/>}/>
            <Route path="/manage-transaction" element={<ManageTransactions/>}/>
            <Route path="/manage_transactions" element={<ManageTransactions/>}/>
            <Route path="/admin/transactions" element={<ManageTransactions/>}/>
            <Route path="/admin/financials" element={<ManageTransactions/>}/>
            <Route path="/admin/escrow" element={<ManageTransactions/>}/>
        </Routes>
    );
}

export default App;