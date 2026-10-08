/**
 * EcoCycle Refurbishment & Device Valuation Engine
 *
 * Formula:
 * EstimatedValue = ReferenceValue * AgeFactor * ConditionFactor
 *
 * Age Depreciation Table (from PurchaseDate):
 *  - 0–1 year:   85% (0.85)
 *  - 1–2 years:  70% (0.70)
 *  - 2–3 years:  55% (0.55)
 *  - 3–4 years:  40% (0.40)
 *  - 4–5 years:  30% (0.30)
 *  - 5+ years:   20% (0.20)
 *
 * Condition Factor Table:
 *  - Excellent:     100% (1.00)
 *  - Good:           85% (0.85)
 *  - Fair:           65% (0.65)
 *  - Poor:           40% (0.40)
 *  - Non-functional: 20% (0.20)
 */

export const CATEGORY_BASELINE_PRICES = {
    mobile: 22000,
    laptop: 35000,
    desktop: 28000,
    tablet: 18000,
    monitor: 9000,
    tv: 30000,
    printer: 7500,
    scanner: 5000,
    ups: 4500,
    router: 3000,
    peripherals: 2000,
    audio: 6000,
    camera: 18000,
    gaming: 26000,
    appliance: 9500
};

/**
 * Standard Fixed Operational Payout Fees:
 * - Collection Agent: Fixed ₹150 per pickup/leg
 * - Inspection Technician: Fixed ₹300 per certified diagnostic
 * - Center: No percentage payout share (Center keeps the physical repaired device or recovered components);
 *           Only their Operational/Repair Cost is tracked and displayed.
 */
export const STANDARD_PAYOUT_FEES = {
    COLLECTION_AGENT_FEE: 150,
    TECHNICIAN_FEE: 300,
    TRANSFER_AGENT_FEE: 150
};

/**
 * Calculates device age in fractional years from purchaseDate
 */
export const calculateAgeInYears = (purchaseDate, referenceDate = new Date()) => {
    if (!purchaseDate) return 1.0; // Default 1 year if unknown
    const pDate = new Date(purchaseDate);
    const refDate = new Date(referenceDate);
    if (isNaN(pDate.getTime())) return 1.0;

    const diffMs = refDate.getTime() - pDate.getTime();
    if (diffMs <= 0) return 0.1; // Brand new / current date

    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(years * 10) / 10;
};

/**
 * Calculates Age Depreciation Factor (Value Retained %)
 */
export const calculateAgeFactor = (purchaseDate, referenceDate = new Date()) => {
    const ageInYears = calculateAgeInYears(purchaseDate, referenceDate);

    if (ageInYears <= 1) return 0.85;
    if (ageInYears <= 2) return 0.70;
    if (ageInYears <= 3) return 0.55;
    if (ageInYears <= 4) return 0.40;
    if (ageInYears <= 5) return 0.30;
    return 0.20;
};

/**
 * Returns human-readable label for age factor tier
 */
export const getAgeTierLabel = (ageInYears) => {
    if (ageInYears <= 1) return "0–1 Year (85% Retained)";
    if (ageInYears <= 2) return "1–2 Years (70% Retained)";
    if (ageInYears <= 3) return "2–3 Years (55% Retained)";
    if (ageInYears <= 4) return "3–4 Years (40% Retained)";
    if (ageInYears <= 5) return "4–5 Years (30% Retained)";
    return "5+ Years (20% Retained)";
};

/**
 * Calculates Condition Factor (0.15 to 1.00) based on condition, working state, and inspection data
 */
export const calculateConditionFactor = (conditionStr, inspectionData = null, secondaryAttributes = {}) => {
    let baseFactor = 0.85; // Good by default

    const cond = String(conditionStr || "").toLowerCase().trim();
    if (cond === "excellent") {
        baseFactor = 1.00;
    } else if (cond === "good") {
        baseFactor = 0.85;
    } else if (cond === "fair") {
        baseFactor = 0.65;
    } else if (cond === "poor") {
        baseFactor = 0.40;
    } else if (cond.includes("non") || cond.includes("scrap") || cond.includes("broken")) {
        baseFactor = 0.20;
    }

    // Blend with real certified technician inspection diagnostic score if available
    if (inspectionData?.overallScore !== undefined && inspectionData?.overallScore !== null) {
        const score = Number(inspectionData.overallScore);
        if (!isNaN(score) && score > 0) {
            const diagFactor = score >= 90 ? 1.00 : score >= 75 ? 0.85 : score >= 55 ? 0.65 : score >= 35 ? 0.40 : 0.20;
            baseFactor = (baseFactor + diagFactor) / 2;
        }
    } else if (inspectionData?.results && Array.isArray(inspectionData.results) && inspectionData.results.length > 0) {
        const sumScore = inspectionData.results.reduce((acc, curr) => acc + (Number(curr.score) || 85), 0);
        const avgScore = sumScore / inspectionData.results.length;
        const diagFactor = avgScore >= 90 ? 1.00 : avgScore >= 75 ? 0.85 : avgScore >= 55 ? 0.65 : avgScore >= 35 ? 0.40 : 0.20;
        baseFactor = (baseFactor + diagFactor) / 2;
    }

    // Secondary attribute modifiers
    const working = String(secondaryAttributes?.working || "").toLowerCase().trim();
    if (working === "no") {
        baseFactor = Math.min(baseFactor, 0.25);
    } else if (working === "partially") {
        baseFactor = Math.min(baseFactor, 0.70);
    }

    const damage = String(secondaryAttributes?.physicalDamage || "").toLowerCase();
    if (damage.includes("severe") || damage.includes("damage") || damage.includes("cracked")) {
        baseFactor = Math.round(baseFactor * 0.85 * 100) / 100;
    }

    const display = String(secondaryAttributes?.displayCondition || "").toLowerCase();
    if (display.includes("fault") || display.includes("cracked") || display.includes("dead")) {
        baseFactor = Math.round(baseFactor * 0.85 * 100) / 100;
    }

    return Math.max(0.15, Math.min(1.00, Math.round(baseFactor * 100) / 100));
};

/**
 * Complete Estimated Device Valuation Calculator
 *
 * EstimatedValue = ReferenceValue * AgeFactor * ConditionFactor
 */
export const calculateEstimatedDeviceValue = ({
    referenceValue = 0,
    purchaseDate = null,
    condition = "Good",
    inspectionData = null,
    secondaryAttributes = {},
    quantity = 1,
    referenceDate = new Date()
} = {}) => {
    const refVal = Math.max(0, Number(referenceValue) || 0);
    const ageInYears = calculateAgeInYears(purchaseDate, referenceDate);
    const ageFactor = calculateAgeFactor(purchaseDate, referenceDate);
    const conditionFactor = calculateConditionFactor(condition, inspectionData, secondaryAttributes);

    // Formula: ReferenceValue * AgeFactor * ConditionFactor
    const unitEstimatedValue = Math.max(500, Math.round((refVal * ageFactor * conditionFactor) / 50) * 50);
    const qty = Math.max(1, Number(quantity) || 1);
    const totalEstimatedValue = unitEstimatedValue * qty;

    return {
        referenceValue: refVal,
        purchaseDate,
        ageInYears,
        ageFactor,
        ageTierLabel: getAgeTierLabel(ageInYears),
        conditionFactor,
        conditionScorePercent: Math.round(conditionFactor * 100),
        unitEstimatedValue,
        quantity: qty,
        totalEstimatedValue
    };
};
