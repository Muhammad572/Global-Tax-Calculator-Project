// ==============================================================================
// 🧠 Core Tax Calculation Logic (Hybrid Strategy)
// ==============================================================================

import {
    INCOME_TAX_DATA,
    SALES_TAX_DATA,
    GLOBAL_DEFAULT_RATE,
    COUNTRIES
} from './taxData.js';

export { COUNTRIES };

// ==============================================================================
// NEW FEATURE: Simulated API Fetch for Real-Time Data
// (In a real application, this would call a service like TaxJar, Quaderno, etc.)
// ==============================================================================

/**
 * SIMULATES fetching up-to-date, complex tax data from an external API.
 * This is the ultimate solution for "all nations" accuracy.
 * @param {string} countryCode - The country code.
 * @param {string} taxType - 'Income' or 'Sales'.
 * @returns {Promise<object|null>} Tax data object or null if API fails/is unavailable.
 */
async function fetchTaxDataFromAPI(countryCode, taxType) {
    // ⚠️ CRITICAL NOTE: This is where you would integrate an actual API call.
    // For now, we simulate a delay and failure for countries not in our static data.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50)); 

    // For countries in static data, we don't need the API (simplifies the demo)
    if (INCOME_TAX_DATA[countryCode] || SALES_TAX_DATA[countryCode]) {
        return null;
    }

    // SIMULATION: Only return data for a new example country to demonstrate success
    if (countryCode === "CN") { // Example: China
        if (taxType === 'Income') {
            return {
                type: 'progressive',
                brackets: [
                    { "min": 0, "max": 36000, "rate": 0.03 },
                    { "min": 36001, "max": 144000, "rate": 0.10 }
                ],
                source: 'API_CN'
            };
        } else if (taxType === 'Sales') {
            return { rate: 0.13, label: "VAT (API)", source: 'API_CN' };
        }
    }
    
    // If the country is not hardcoded here, we assume the API failed or is not configured
    return null;
}
// ==============================================================================


// ==============================================================================
// UPDATED CORE CALCULATION LOGIC
// ==============================================================================

// Helper function remains the same (Progressive Tax)
function applyProgressiveTax(amount, brackets, defaultLabel) {
    let totalTax = 0;
    let finalRate = 0;
    
    for (const bracket of brackets) {
        if (amount > bracket.min) {
            const taxableInBracket = Math.min(amount, bracket.max) - (bracket.min > 0 ? bracket.min : 0);
            totalTax += taxableInBracket * bracket.rate;
            finalRate = bracket.rate;
        }
    }

    const effectiveRate = amount > 0 ? totalTax / amount : 0;
    const netAmount = amount - totalTax;

    return {
        taxAmount: totalTax,
        effectiveRate: effectiveRate,
        taxLabel: defaultLabel || `Marginal Rate: ${(finalRate * 100).toFixed(1)}%`,
        netAmount: netAmount
    };
}


/**
 * Main dispatcher function - NOW ASYNCHRONOUS
 */
export async function calculateTax(taxType, amount, countryCode) {
    // 1. Attempt to get data from API first
    const apiData = await fetchTaxDataFromAPI(countryCode, taxType);

    if (taxType === 'Income') {
        let brackets = INCOME_TAX_DATA[countryCode];
        let label = null;

        if (apiData && apiData.type === 'progressive') {
            brackets = apiData.brackets;
            label = `API Brackets (Marginal)`;
        } 
        
        if (brackets) {
            // Use API data or Static data
            return applyProgressiveTax(amount, brackets, label);
        }

        // 2. Fallback to Global Default Rate
        const taxAmount = amount * GLOBAL_DEFAULT_RATE;
        return {
            taxAmount: taxAmount,
            effectiveRate: GLOBAL_DEFAULT_RATE,
            taxLabel: `Flat Rate (${(GLOBAL_DEFAULT_RATE * 100).toFixed(1)}% Default)`,
            netAmount: amount - taxAmount
        };

    } else if (taxType === 'Sales') {
        let rate = GLOBAL_DEFAULT_RATE;
        let label = `Default Flat Tax (${(GLOBAL_DEFAULT_RATE * 100).toFixed(1)}%)`;
        
        // Use API data if available
        if (apiData && apiData.rate) {
            rate = apiData.rate;
            label = apiData.label;
        } 
        // OR use Static data if available
        else if (SALES_TAX_DATA[countryCode]) {
            const data = SALES_TAX_DATA[countryCode];
            rate = data.rate;
            label = `${data.label} (${(rate * 100).toFixed(1)}%)`;
        }

        const taxAmount = amount * rate;
        return {
            taxAmount: taxAmount,
            effectiveRate: rate,
            taxLabel: label,
            netAmount: amount + taxAmount // Sales tax is added
        };
    }
    
    return { taxAmount: 0, effectiveRate: 0, taxLabel: "Invalid Type", netAmount: amount };
}