// ==============================================================================
// 💰 Tax Data: Global Framework for Income and Sales Tax
// BEST PRACTICE: Use Static Data for speed and specific country maintenance.
// Fallback to GLOBAL_DEFAULT_RATE for all other countries.
// ==============================================================================

// 1. GLOBAL DEFAULTS
export const GLOBAL_DEFAULT_RATE = 0.15; // 15% Flat Rate used when specific data is missing.

// 2. Progressive Income Tax Data (Detailed Brackets - Only maintained countries)
// NOTE: Rates are simplified for demonstration and single filer status.
export const INCOME_TAX_DATA = {
    // United States (US) - 2024 Federal Brackets (Simplified)
    "US": [
        { "min": 0, "max": 11600, "rate": 0.10 },
        { "min": 11601, "max": 47150, "rate": 0.12 },
        { "min": 47151, "max": 100000, "rate": 0.22 },
        { "min": 100001, "max": 500000, "rate": 0.24 },
        { "min": 500001, "max": 999999999, "rate": 0.32 }
    ],
    // United Kingdom (UK) - 2024/25 Rates (Simplified)
    "UK": [
        { "min": 0, "max": 12570, "rate": 0.0 },
        { "min": 12571, "max": 50270, "rate": 0.20 },
        { "min": 50271, "max": 125140, "rate": 0.40 },
        { "min": 125141, "max": 999999999, "rate": 0.45 }
    ],
    // Canada (CA) - 2024 Federal Rates (Simplified)
    "CA": [
        { "min": 0, "max": 53590, "rate": 0.15 },
        { "min": 53591, "max": 107179, "rate": 0.205 },
        { "min": 107180, "max": 165430, "rate": 0.26 },
        { "min": 165431, "max": 999999999, "rate": 0.29 }
    ]
    // Add other complex progressive tax countries here
};

// 3. Flat Sales/VAT/GST Tax Data (Specific rates for known countries)
// NOTE: These are typically standard rates and do not account for reduced or zero rates.
export const SALES_TAX_DATA = {
    "AU": { "rate": 0.10, "label": "GST" },        // Australia
    "UK": { "rate": 0.20, "label": "VAT" },        // United Kingdom
    "DE": { "rate": 0.19, "label": "VAT" },        // Germany
    "FR": { "rate": 0.20, "label": "VAT" },        // France
    "IT": { "rate": 0.22, "label": "VAT" },        // Italy
    "ES": { "rate": 0.21, "label": "VAT" },        // Spain
    "CA": { "rate": 0.05, "label": "GST (Federal)" },// Canada
    "NZ": { "rate": 0.15, "label": "GST" },        // New Zealand
    "JP": { "rate": 0.10, "label": "Consumption Tax" },// Japan
    "SG": { "rate": 0.09, "label": "GST" },        // Singapore
    "IN": { "rate": 0.18, "label": "GST" },        // India (Using a common slab)
    "MX": { "rate": 0.16, "label": "VAT" },        // Mexico
    "CH": { "rate": 0.081, "label": "VAT" },       // Switzerland
    "SA": { "rate": 0.15, "label": "VAT" }         // Saudi Arabia
};

// 4. COMPLETE LIST OF ALL COUNTRIES (ISO 3166-1 alpha-2)
// This list makes the calculator compatible with all nations globally.
// Currencies are added for clarity but are descriptive only (not used in calculation).
export const COUNTRIES = [
    // North America
    { code: "US", name: "United States (USD)" },
    { code: "CA", name: "Canada (CAD)" },
    { code: "MX", name: "Mexico (MXN)" },
    
    // Europe (Cleaned up: Removed redundant 'GB', keeping 'UK')
    { code: "UK", name: "United Kingdom (GBP)" },
    { code: "DE", name: "Germany (EUR)" },
    { code: "FR", name: "France (EUR)" },
    { code: "IT", name: "Italy (EUR)" },
    { code: "ES", name: "Spain (EUR)" },
    { code: "NL", name: "Netherlands (EUR)" },
    { code: "BE", name: "Belgium (EUR)" },
    { code: "CH", name: "Switzerland (CHF)" },
    { code: "SE", name: "Sweden (SEK)" },
    { code: "NO", name: "Norway (NOK)" },
    { code: "DK", name: "Denmark (DKK)" },
    { code: "FI", name: "Finland (EUR)" },
    { code: "AT", name: "Austria (EUR)" },
    { code: "IE", name: "Ireland (EUR)" },
    { code: "PT", name: "Portugal (EUR)" },
    { code: "GR", name: "Greece (EUR)" },
    { code: "PL", name: "Poland (PLN)" },
    { code: "CZ", name: "Czech Republic (CZK)" },
    { code: "HU", name: "Hungary (HUF)" },
    { code: "RO", name: "Romania (RON)" },
    { code: "BG", name: "Bulgaria (BGN)" },
    { code: "RS", name: "Serbia (RSD)" },
    { code: "HR", name: "Croatia (EUR)" },
    { code: "SK", name: "Slovakia (EUR)" },
    { code: "SI", name: "Slovenia (EUR)" },
    { code: "EE", name: "Estonia (EUR)" },
    { code: "LV", name: "Latvia (EUR)" },
    { code: "LT", name: "Lithuania (EUR)" },
    { code: "LU", name: "Luxembourg (EUR)" },
    { code: "MT", name: "Malta (EUR)" },
    { code: "CY", name: "Cyprus (EUR)" },
    { code: "IS", name: "Iceland (ISK)" },
    { code: "AL", name: "Albania (ALL)" },
    { code: "BA", name: "Bosnia and Herzegovina (BAM)" },
    { code: "MK", name: "North Macedonia (MKD)" },
    { code: "ME", name: "Montenegro (EUR)" },
    { code: "BY", name: "Belarus (BYN)" },
    { code: "UA", name: "Ukraine (UAH)" },
    { code: "MD", name: "Moldova (MDL)" },
    
    // Asia
    { code: "CN", name: "China (CNY)" },
    { code: "JP", name: "Japan (JPY)" },
    { code: "IN", name: "India (INR)" },
    { code: "KR", name: "South Korea (KRW)" },
    { code: "ID", name: "Indonesia (IDR)" },
    { code: "TH", name: "Thailand (THB)" },
    { code: "VN", name: "Vietnam (VND)" },
    { code: "MY", name: "Malaysia (MYR)" },
    { code: "SG", name: "Singapore (SGD)" },
    { code: "PH", name: "Philippines (PHP)" },
    { code: "PK", name: "Pakistan (PKR)" },
    { code: "BD", name: "Bangladesh (BDT)" },
    { code: "LK", name: "Sri Lanka (LKR)" },
    { code: "NP", name: "Nepal (NPR)" },
    { code: "MM", name: "Myanmar (MMK)" },
    { code: "KH", name: "Cambodia (KHR)" },
    { code: "LA", name: "Laos (LAK)" },
    { code: "MN", name: "Mongolia (MNT)" },
    { code: "TW", name: "Taiwan (TWD)" },
    { code: "HK", name: "Hong Kong (HKD)" },
    { code: "MO", name: "Macau (MOP)" },
    { code: "BN", name: "Brunei (BND)" },
    { code: "TL", name: "Timor-Leste (USD)" },
    { code: "MV", name: "Maldives (MVR)" },
    { code: "BT", name: "Bhutan (BTN)" },
    
    // Middle East
    { code: "SA", name: "Saudi Arabia (SAR)" },
    { code: "AE", name: "United Arab Emirates (AED)" },
    { code: "QA", name: "Qatar (QAR)" },
    { code: "KW", name: "Kuwait (KWD)" },
    { code: "OM", name: "Oman (OMR)" },
    { code: "BH", name: "Bahrain (BHD)" },
    { code: "TR", name: "Turkey (TRY)" },
    { code: "IL", name: "Israel (ILS)" },
    { code: "JO", name: "Jordan (JOD)" },
    { code: "LB", name: "Lebanon (LBP)" },
    { code: "SY", name: "Syria (SYP)" },
    { code: "IQ", name: "Iraq (IQD)" },
    { code: "IR", name: "Iran (IRR)" },
    { code: "AF", name: "Afghanistan (AFN)" },
    { code: "PS", name: "Palestine (ILS)" },
    { code: "YE", name: "Yemen (YER)" },
    
    // Africa
    { code: "ZA", name: "South Africa (ZAR)" },
    { code: "NG", name: "Nigeria (NGN)" },
    { code: "EG", name: "Egypt (EGP)" },
    { code: "KE", name: "Kenya (KES)" },
    { code: "ET", name: "Ethiopia (ETB)" },
    { code: "GH", name: "Ghana (GHS)" },
    { code: "TZ", name: "Tanzania (TZS)" },
    { code: "UG", name: "Uganda (UGX)" },
    { code: "DZ", name: "Algeria (DZD)" },
    { code: "MA", name: "Morocco (MAD)" },
    { code: "TN", name: "Tunisia (TND)" },
    { code: "LY", name: "Libya (LYD)" },
    { code: "SD", name: "Sudan (SDG)" },
    { code: "SS", name: "South Sudan (SSP)" },
    { code: "CD", name: "DR Congo (CDF)" },
    { code: "AO", name: "Angola (AOA)" },
    { code: "MZ", name: "Mozambique (MZN)" },
    { code: "ZM", name: "Zambia (ZMW)" },
    { code: "ZW", name: "Zimbabwe (USD)" },
    { code: "MG", name: "Madagascar (MGA)" },
    { code: "CM", name: "Cameroon (XAF)" },
    { code: "CI", name: "Ivory Coast (XOF)" },
    { code: "SN", name: "Senegal (XOF)" },
    { code: "BF", name: "Burkina Faso (XOF)" },
    { code: "ML", name: "Mali (XOF)" },
    { code: "NE", name: "Niger (XOF)" },
    { code: "TG", name: "Togo (XOF)" },
    { code: "BJ", name: "Benin (XOF)" },
    { code: "RW", name: "Rwanda (RWF)" },
    { code: "BI", name: "Burundi (BIF)" },
    { code: "SO", name: "Somalia (SOS)" },
    { code: "ER", name: "Eritrea (ERN)" },
    { code: "DJ", name: "Djibouti (DJF)" },
    { code: "SL", name: "Sierra Leone (SLL)" },
    { code: "LR", name: "Liberia (LRD)" },
    { code: "GM", name: "Gambia (GMD)" },
    { code: "GW", name: "Guinea-Bissau (XOF)" },
    { code: "GN", name: "Guinea (GNF)" },
    { code: "MR", name: "Mauritania (MRU)" },
    { code: "CV", name: "Cape Verde (CVE)" },
    { code: "ST", name: "São Tomé and Príncipe (STN)" },
    { code: "GA", name: "Gabon (XAF)" },
    { code: "GQ", name: "Equatorial Guinea (XAF)" },
    { code: "CF", name: "Central African Republic (XAF)" },
    { code: "TD", name: "Chad (XAF)" },
    { code: "KM", name: "Comoros (KMF)" },
    { code: "SC", name: "Seychelles (SCR)" },
    { code: "MU", name: "Mauritius (MUR)" },
    { code: "RE", name: "Réunion (EUR)" },
    
    // Oceania
    { code: "AU", name: "Australia (AUD)" },
    { code: "NZ", name: "New Zealand (NZD)" },
    { code: "PG", name: "Papua New Guinea (PGK)" },
    { code: "FJ", name: "Fiji (FJD)" },
    { code: "SB", name: "Solomon Islands (SBD)" },
    { code: "VU", name: "Vanuatu (VUV)" },
    { code: "NC", name: "New Caledonia (XPF)" },
    { code: "PF", name: "French Polynesia (XPF)" },
    { code: "WS", name: "Samoa (WST)" },
    { code: "TO", name: "Tonga (TOP)" },
    { code: "FM", name: "Micronesia (USD)" },
    { code: "MH", name: "Marshall Islands (USD)" },
    { code: "KI", name: "Kiribati (AUD)" },
    { code: "TV", name: "Tuvalu (AUD)" },
    { code: "NR", name: "Nauru (AUD)" },
    { code: "PW", name: "Palau (USD)" },
    
    // Americas (excluding North America)
    { code: "BR", name: "Brazil (BRL)" },
    { code: "AR", name: "Argentina (ARS)" },
    { code: "CO", name: "Colombia (COP)" },
    { code: "PE", name: "Peru (PEN)" },
    { code: "CL", name: "Chile (CLP)" },
    { code: "EC", name: "Ecuador (USD)" },
    { code: "VE", name: "Venezuela (VES)" },
    { code: "BO", name: "Bolivia (BOB)" },
    { code: "PY", name: "Paraguay (PYG)" },
    { code: "UY", name: "Uruguay (UYU)" },
    { code: "GY", name: "Guyana (GYD)" },
    { code: "SR", name: "Suriname (SRD)" },
    { code: "GF", name: "French Guiana (EUR)" },
    { code: "GT", name: "Guatemala (GTQ)" },
    { code: "HN", name: "Honduras (HNL)" },
    { code: "SV", name: "El Salvador (USD)" },
    { code: "NI", name: "Nicaragua (NIO)" },
    { code: "CR", name: "Costa Rica (CRC)" },
    { code: "PA", name: "Panama (PAB)" },
    { code: "CU", name: "Cuba (CUP)" },
    { code: "DO", name: "Dominican Republic (DOP)" },
    { code: "HT", name: "Haiti (HTG)" },
    { code: "JM", name: "Jamaica (JMD)" },
    { code: "TT", name: "Trinidad and Tobago (TTD)" },
    { code: "BS", name: "Bahamas (BSD)" },
    { code: "BB", name: "Barbados (BBD)" },
    { code: "LC", name: "Saint Lucia (XCD)" },
    { code: "VC", name: "Saint Vincent and the Grenadines (XCD)" },
    { code: "GD", name: "Grenada (XCD)" },
    { code: "DM", name: "Dominica (XCD)" },
    { code: "KN", name: "Saint Kitts and Nevis (XCD)" },
    { code: "AG", name: "Antigua and Barbuda (XCD)" },
    { code: "BZ", name: "Belize (BZD)" },
    
    // Caribbean & Others (Cleaned up: Removed redundant 'GY' and 'SR')
    { code: "PR", name: "Puerto Rico (USD)" },
    { code: "KY", name: "Cayman Islands (KYD)" },
    { code: "BM", name: "Bermuda (BMD)" },
    { code: "VG", name: "British Virgin Islands (USD)" },
    { code: "TC", name: "Turks and Caicos Islands (USD)" }
];