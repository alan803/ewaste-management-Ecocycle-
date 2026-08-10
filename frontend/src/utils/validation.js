// Validation functions for forms

// Name validations
export function validate_first_name(value) {
    if (value === "") {
        return "First name is required";
    }
    else if (!/^[a-zA-Z\s]+$/.test(value) || value.length < 3) {
        return "Name must be at least 3 characters long and contain only letters and spaces.";
    }
    return "";
}

export function validate_last_name(value) {
    if (value === "") {
        return "Last name is required";
    }
    else if (!/^[a-zA-Z\s]+$/.test(value) || value.length < 3) {
        return "Last name must be at least 3 characters long and contain only letters and spaces.";
    }
    return "";
}

// Email validation
export function validate_email(value) {
    if (value === "") {
        return "Email is required";
    }
    else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value)) {
        return "Email must be a valid Gmail address.";
    }
    return "";
}

// Phone validations
export function validate_phone(value) {
    if (value === "") {
        return "Phone number is required";
    }
    if (!/^[6-9]\d{9}$/.test(value)) {
        return "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
    }
    if (/(\d)\1{4}/.test(value)) {
        return "Phone number cannot contain 5 or more consecutive identical digits.";
    }
    return "";
}

export function alternate_validate_phone(value) {
    if (value === "") {
        return "Phone number is required";
    }
    if (!/^[6-9]\d{9}$/.test(value)) {
        return "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
    }
    if (/(\d)\1{4}/.test(value)) {
        return "Phone number cannot contain 5 or more consecutive identical digits.";
    }
    return "";
}

// Password validations
export function validate_password(value, forLiveValidation = false) {
    if (value === "") {
        return forLiveValidation ? "" : "Password is required";
    }
    if (value.length < 8 || value.length > 15 || !/^[a-zA-Z0-9@#$%^&*!~(),.?":{}|<>\s]+$/.test(value)) {
        return "Password must be 8-15 characters long and can contain only letters, numbers, and special characters";
    }
    return "";
}

export function validate_password_simple(value, forLiveValidation = false) {
    if (value === "") {
        return forLiveValidation ? "" : "";
    }
    if (value.length < 6) {
        return "Password must be at least 6 characters";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return "Password must contain at least one special character";
    }
    return "";
}

export function validate_confirm_password(value, password, forLiveValidation = false) {
    if (value === "") {
        return forLiveValidation ? "" : "Confirm password is required";
    }
    if (value !== password) {
        return "Passwords do not match";
    }
    return "";
}

export function validate_address(value) {
    if (value === "") {
        return "Address is required";
    }
    if (value.length < 5 || !/^[a-zA-Z\s,.-]+$/.test(value)) {
        return "Address should be at least 5 characters long and contain only alphabets, spaces, commas, and hyphens";
    }
    return "";
}

export function validate_state(value) {
    if (value === "") {
        return "State is required";
    }
    if (value.length < 2 || !/^[a-zA-Z\s]+$/.test(value)) {
        return "State should be at least 2 characters long and contain only alphabets and spaces";
    }
    return "";
}

export function validate_district(value) {
    if (value === "") {
        return "District is required";
    }
    if (value.length < 2 || !/^[A-Za-z\s]+$/.test(value)) {
        return "District should be at least 2 characters long and contain only alphabets and spaces";
    }
    return "";
}

export function validate_city(value) {
    if (value === "") {
        return "City is required";
    }
    if (value.length < 2 || !/^[a-zA-Z\s]+$/.test(value)) {
        return "City should be at least 2 characters long and contain only alphabets and spaces";
    }
    return "";
}

export function validate_pincode(value) {
    if (value === "") {
        return "PIN code is required";
    }
    if (!/^[1-9][0-9]{5}$/.test(value)) {
        return "Please enter a valid 6-digit PIN code.";
    }
    if (value.startsWith('0')) {
        return "PIN code cannot start with 0.";
    }
    if (/^(\d)\1{5}$/.test(value)) {
        return "PIN code cannot have all identical digits.";
    }
    return "";
}

// Personal validations
export function validate_gender(value) {
    if (!value || String(value).trim() === "") {
        return "Gender is required";
    }
    const validGenders = ["male", "female", "other"];
    if (!validGenders.includes(String(value).trim().toLowerCase())) {
        return "Please select a valid gender";
    }
    return "";
}
export function validate_street(value) {
    const street = value.trim();

    if (street === "") {
        return "Street is required";
    }

    if (street.length < 3) {
        return "Street must be at least 3 characters";
    }

    if (!/^[a-zA-Z0-9\s.,'\/-]+$/.test(street)) {
        return "Street contains invalid characters";
    }

    return "";
}
export function validate_dob(value) {
    if (value === "") {
        return "Date of birth is required";
    }
    const today = new Date();
    const dob = new Date(value);
    const age = today.getFullYear() - dob.getFullYear();
    if (dob > today) {
        return "Date of birth cannot be in the future.";
    }
    else if (age < 18) {
        return "You must be at least 18 years old to sign up.";
    }
    return "";
}

// Aadhaar validation
export function validate_adhaarNumber(value) {
    if (value === "") {
        return "Adhaar number is required";
    }
    if (!/^[1-9]\d{11}$/.test(value)) {
        return "Adhaar number must be 12 digits and start with 1-9";
    }
    return "";
}

// File validations
export function validateFile(file) {
    if (!file) {
        return "Please select a file";
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];

    if (!allowedTypes.includes(file.type)) {
        return "Only JPG, PNG files are allowed";
    }
    if (file.size > 2 * 1024 * 1024) {
        return "File size must be less than 2 MB";
    }
    return "";
}

export function validateDocument(file) {
    if (!file) {
        return "Please select a document";
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    if (!allowedTypes.includes(file.type)) {
        return "Only JPG, PNG or PDF files are allowed";
    }

    if (file.size > 5 * 1024 * 1024) {
        return "File size must be less than 5 MB";
    }

    return "";
}

// Vehicle validations
export function validate_vehicleType(value) {
    if (value === "") {
        return "Please select a vehicle type.";
    }
    return "";
}

export function validate_vehicleNumber(value) {
    if (value.trim() === "") {
        return "Vehicle number is required.";
    }

    const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;

    if (!vehicleRegex.test(value.toUpperCase())) {
        return "Enter a valid vehicle number.";
    }
    return "";
}

export function validate_licenseNumber(value) {
    if (value.trim() === "") {
        return "Driving license number is required.";
    }

    const licenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;

    if (!licenseRegex.test(value.toUpperCase())) {
        return "Enter a valid driving license number.";
    }

    return "";
}

export function validate_vehicleInsurance(file) {
    if (!file) {
        return "Vehicle insurance document is required";
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
        return "Only JPG, PNG, or PDF files are allowed";
    }
    if (file.size > 5 * 1024 * 1024) {
        return "File size must be less than 5 MB";
    }
    return "";
}

export function validate_vehiclePollution(file) {
    if (!file) {
        return "Vehicle pollution certificate is required";
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
        return "Only JPG, PNG, or PDF files are allowed";
    }
    if (file.size > 5 * 1024 * 1024) {
        return "File size must be less than 5 MB";
    }
    return "";
}

// Bank validations
export function validate_accountHolder(value) {
    if (value.trim() === "") {
        return "Account holder name is required";
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
        return "Account holder name should contain only letters and spaces";
    }
    return "";
}

export function validate_bankName(value) {
    if (value.trim() === "") {
        return "Bank name is required";
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
        return "Bank name should contain only letters and spaces";
    }
    return "";
}

export function validate_accountNumber(value) {
    if (value.trim() === "") {
        return "Account number is required";
    }
    if (!/^\d{9,18}$/.test(value)) {
        return "Account number must be 9-18 digits";
    }
    return "";
}

export function validate_ifscCode(value) {
    if (value.trim() === "") {
        return "IFSC code is required";
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
        return "Please enter a valid IFSC code";
    }
    return "";
}
export function validate_centrename(value)
{
    if(value==="")
    {
            return "Centre Name is required";
    }
    if(value.length < 5 || value.length > 100)
    {
        return "Centre Name must be 5-100 characters long";
    }
    if(!/^[a-zA-Z\s&]+$/.test(value))
    {
        return "Only letters, spaces and & are allowed";
    }
    return "";
}

export function validate_employeeId(value)
{
    if(value==="")
    {
        return "Employee ID is required";
    }
    if(value.length < 5 || value.length > 20)
    {
        return "Employee ID must be 5-20 characters long";
    }
    if(!/^[a-zA-Z0-9_-]+$/.test(value))
    {
        return "Only letters, numbers, _, and - are allowed";
    }
    return "";
}

export function validate_jobTitle(value)
{
    if(value==="")
    {
        return "Job title is required";
    }
    if(value.length < 5 || value.length > 50)
    {
        return "Job title must be 5-50 characters long";
    }
    if(!/^[a-zA-Z\s]+$/.test(value))
    {
        return "Only letters and spaces are allowed";
    }
    return "";
}

export function validate_dateOfJoining(value)
{
    if(value==="")
    {
        return "Date of joining is required";
    }
    const today = new Date();
    const joiningDate = new Date(value);
    if(joiningDate > today)
    {
        return "Date of joining cannot be in the future";
    }
    return "";
}

export function validate_experience(value)
{
    if(value==="")
    {
        return "Experience is required";
    }
    const exp = parseFloat(value);
    if(isNaN(exp) || exp < 0 || exp > 50)
    {
        return "Experience must be between 0 and 50 years";
    }
    return "";
}

export function validate_specialization(value)
{
    if(value==="")
    {
        return "Feild is required";
    }
    if(value.length < 3 || value.length > 100 || !/^[a-zA-Z\s&]+$/.test(value))
    {
        return "Must be 3-100 characters long and contain only letters, spaces and &";
    }
    return "";
}

export function validate_issuingInstitute(value)
{
    if(value==="")
    {
        return "Issuing institute is required";
    }
    if(value.length < 6 || value.length > 100)
    {
        return "Issuing institute must be 6-100 characters long";
    }
    if(!/^[a-zA-Z\s]+$/.test(value))
    {
        return "Only letters and spaces are allowed";
    }
    return "";
}

export function validate_certificateNumber(value)
{
    if(value==="")
    {
        return "Certificate number is required";
    }
    if(value.length < 6 || value.length > 50)
    {
        return "Certificate number must be 6-50 characters long";
    }
    if(!/^[a-zA-Z0-9-]+$/.test(value))
    {
        return "Only letters, numbers, and - are allowed";
    }
    return "";
}

export function validate_certificateIssueDate(value)
{
    if(value==="")
    {
        return "Certificate issue date is required";
    }
    const today = new Date();
    const issueDate = new Date(value);
    if(issueDate > today)
    {
        return "Certificate issue date cannot be in the future";
    }
    return "";
}

export function validate_certificateExpiryDate(expiryDate, issueDate)
{
    if (expiryDate==="") {
        return "Expiry date is required";
    }

    if (!issueDate) {
        return "Enter certificate issue date first";
    }

    if (new Date(expiryDate) <= new Date(issueDate)) {
        return "Expiry date must be after issue date";
    }

    return "";
}

export function validate_governmentIdType(value)
{
    if (!value || value.trim() === "") {
        return "Government ID type is required";
    }

    return "";
}

export function validate_panCard(value)
{
    if(value==="")
    {
        return "PAN card number is required";
    }
    if(!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase()))
    {
        return "Please enter a valid PAN card number (e.g., ABCDE1234F)";
    }
    return "";
}

export function validate_passport(value)
{
    if(value==="")
    {
        return "Passport number is required";
    }
    if(!/^[A-Z]{1}[0-9]{7}$/.test(value.toUpperCase()))
    {
        return "Please enter a valid passport number (e.g., A1234567)";
    }
    return "";
}

export function validate_employeeIdCard(file)
{
    if(!file)
    {
        return "Employee ID card is required";
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if(!allowedTypes.includes(file.type))
    {
        return "Only JPG, PNG, or PDF files are allowed";
    }
    if(file.size > 5 * 1024 * 1024)
    {
        return "File size must be less than 5 MB";
    }
    return "";
}
export function validate_businessRegistrationNumber(value)
{
    if (value === "") {
        return "Business registration number is required";
    }

    if (!/^[A-Za-z]{2}[0-9]+$/.test(value)) {
        return "Starting 2 characters should be alphabets and the rest should be numbers";
    }

    if (value.length < 3 || value.length > 15) {
        return "Business registration number must be 3-15 characters long";
    }

    return "";
}
export function validate_years(value)
{
    if(value==="")
    {
        return "Year of experience is required"
    }
    if(value<0)
    {
        return "Year of experience cannot be negative"
    }
    if(value>20)
    {
        return "Year of experience cannot be more than 20"
    }
    return "";
}
export function validate_gst(value)
{
    if (value === "") 
    {
        return "GST number is required";
    }

    const gst = value.toUpperCase();

    if (gst.length !== 15) {
        return "GST number must be exactly 15 characters";
    }

    if (!/^[A-Z0-9]+$/.test(gst)) {
        return "GST number can contain only letters and numbers";
    }

    return "";
}
export function validate_centerlicense(value) {
    if (value === "") {
        return "License number is required";
    }

    if (!/^[A-Za-z]{2}[0-9]{12}$/.test(value)) {
        return "Enter a valid license number (e.g., MH123456789012)";
    }

    return "";
}
export function validate_buildingno(value)
{
    if(value==="")
    {
        return "Building number is required";
    }
    if(!/^[0-9]+$/.test(value)||value.length<3 || value.length>10)
    {
        return "Please enter a valid building number (3-10 digits)";
    }
    return "";
}
export function validate_techniciancount(value)
{
    if(value==="")
    {
        return "Technician count is required";
    }
    if(value<0 || value>20)
    {
        return "Please enter a valid technician count (0-20)";
    }
    return "";
}
export function validate_reason(value)
{
    if(value==="")
    {
        return "Reason is required";
    }
    if(value.length<10 || value.length>100)
    {
        return "Reason must be between 10 and 100 characters";
    }
    return "";
}
export function validate_modelname(value)
{
    if(value==="")
    {
        return "Model name is required";
    }
    if(!/^[A-Za-z][a-zA-Z0-9-]+$/.test(value)||value.length<=4 || value.lenght>=20)
    {
        return "Model name must start with a letter and can contain letters, numbers, and hyphens (3-20 characters)";
    }
    if (/^(.)\1+$/.test(value)) 
    {
        return "Model name cannot contain the same character repeatedly";
    }
    return "";
}
export function validate_modelnumber(value) 
{
    if (value.trim() === "") 
    {
        return "";
    }

    if (!/^[A-Za-z0-9-]+$/.test(value)) 
    {
        return "Model number can contain letters, numbers and hyphens";
    }

    return "";
}
export function validate_serialnumber(value) 
{
    if (value.trim() === "") 
    {
        return "Serial number is required";
    }

    if (!/^[A-Za-z0-9-]+$/.test(value)) 
    {
        return "Serial number can contain letters, numbers and hyphens";
    }

    return "";
}
export function validate_quantity(value)
{
    if(value==="")
    {
        return "Quantity is required"
    }
    if(value<0)
    {
        return "Quantity cannot be negative"
    }
    if(value>10)
    {
        return "Quantity cannot be more than 10"
    }
    return "";
}
export function validate_condition(value) 
{
    if (value === "") 
    {
        return "Feild is requried";
    }

    return "";
}
export function validate_physicaldamage(value) 
{
    if (value.trim() === "") 
    {
        return "Please describe the physical damage";
    }
    if(!/^[A-Za-z0-9\s]+$/.test(value) || value.length < 5)
    {
        return "Physical damage description must be at least 5 characters long and contain only letters, numbers, spaces";
    }
    return "";
}
export function validate_pickupdate(value)
{
    if(value==="")
    {
        return "Pickup date is required"
    }
    const selectedDate=new Date(value);
    const today=new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 10);

    if (selectedDate < today) 
    {
        return "Pickup date cannot be in the past";
    }

    if (selectedDate > maxDate) 
    {
        return "Pickup date cannot be more than 10 days from today";
    }

    return "";
}
export function validate_confirmation(value) 
{
    if (!value) 
    {
        return "Please confirm the ownership and agree to the Terms & Services";
    }

    return "";
}
export const validateBrand = (value) => {
    // Only letters, numbers, spaces, &, ., and -
    if (!/^[A-Za-z0-9&.\- ]*$/.test(value)) {
        return "Only letters, numbers, spaces, &, . and - are allowed";
    }

    // Must contain at least one letter
    if (value && !/[A-Za-z]/.test(value)) {
        return "Brand name must contain letters";
    }

    // Prevent excessive repeated patterns like abababab
    if (/(.{2,})\1{2,}/i.test(value)) {
        return "Invalid brand name";
    }

    return "";
};

export function validate_brand(value) {
    if (!value || !value.trim()) {
        return "Brand is required";
    }
    return validateBrand(value);
}
export function validate_timeslot(value)
{
    if (!value || value.trim() === "")
    {
        return "Please select a time slot";
    }
    return "";
}
export function validate_custom_address(value)
{
    if (!value || value.trim() === "")
    {
        return "Address is required";
    }
    if (!/^[a-zA-Z\s,]+$/.test(value))
    {
        return "Address must contain only alphabets, spaces, and commas";
    }
    return "";
}