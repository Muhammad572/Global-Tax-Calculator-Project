// app.js

import { calculateTax, COUNTRIES } from './taxCalculator.js';

// ====================================================================
// A. Initialization and Event Listeners
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    populateCountryDropdown();
    
    const calculateBtn = document.getElementById('calculateBtn');
    
    // Add event listeners to the main controls
    calculateBtn.addEventListener('click', runCalculation);
    document.getElementById('taxType').addEventListener('change', updateInputLabel);
    
    // Initial call to set the correct label based on default tax type
    updateInputLabel(); 
});

// ====================================================================
// B. DOM Manipulation Functions
// ====================================================================

/**
 * Populates the country dropdown using the static data from taxData.js.
 */
function populateCountryDropdown() {
    const countrySelect = document.getElementById('country');
    countrySelect.innerHTML = ''; // Clear the initial 'Loading' option

    COUNTRIES.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
    
    // Set a default country for easy testing (e.g., US)
    countrySelect.value = "US";
}

/**
 * Updates the input label based on whether Income or Sales Tax is selected.
 */
function updateInputLabel() {
    const taxType = document.getElementById('taxType').value;
    const label = document.getElementById('amountLabel');
    const netTotalLabel = document.getElementById('netTotalLabel');
    
    if (taxType === 'Income') {
        label.textContent = "Annual Income (in local currency):";
        netTotalLabel.textContent = "Net Total (After Income Tax):";
    } else {
        label.textContent = "Pre-Tax Amount (in local currency):";
        netTotalLabel.textContent = "Total Cost (With Sales/VAT Tax):";
    }
}

/**
 * Main function to read inputs, call the calculator, and display results.
 */
async function runCalculation() { // <-- ADD ASYNC HERE
    const taxType = document.getElementById('taxType').value;
    const countryCode = document.getElementById('country').value;
    const amountInput = document.getElementById('amount').value;
    const amount = parseFloat(amountInput);
    
    // ... rest of input validation code remains the same ...
    
    // Call the core calculation function using await
    const result = await calculateTax(taxType, amount, countryCode); // <-- ADD AWAIT HERE

    // Format the numbers for display
    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    
    const formatNumber = (num) => formatter.format(num);

    // Update the results display (rest of code remains the same)
    // ...
    document.getElementById('resultAmount').textContent = formatNumber(amount);
    
    // The Rate label changes based on the tax type
    document.getElementById('taxLabel').textContent = result.taxLabel; 
    
    // ... rest of display update code remains the same ...
    
    // Show the results section
    resultsDiv.style.display = 'block';
}