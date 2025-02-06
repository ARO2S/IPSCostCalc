# IP Solutions CyberSecurity Price Calculator

A dynamic web-based calculator for estimating cybersecurity service costs with real-time pricing updates and detailed breakdowns.

## Overview

This calculator helps users estimate monthly costs for IT security services based on their environment size and security needs. It features:

- Dynamic per-seat pricing
- Volume discounts
- Additional service options
- Server protection add-ons
- Real-time calculations
- Detailed cost breakdowns

## Project Structure

```
project/
├── index.html      # Main HTML structure
├── styles.css      # Styling and theme
└── calculator.js   # Core calculation logic
```

## Core Features

### 1. Base Pricing Model
- Silver Tier: $20/seat
- Gold Tier: $30/seat
- Platinum Tier: $40/seat

### 2. Additional Costs
- Extra Devices: 
  - Silver: $6.50/device
  - Gold: $7.50/device
  - Platinum: $10/device
- Extra Emails:
  - Silver: $5/email
  - Gold: $6.50/email
  - Platinum: $8/email
- Server Protection: $22.50 flat rate

### 3. Volume Discounts
- 1-25 seats: No discount
- 26-50 seats: 5% off total
- 51+ seats: 10% off total

### 4. Add-on Services
- DarkWeb Monitoring: $100/month
- Attack Simulation: $75/month base + $5/email

## JavaScript Logic Explained

### Price Calculator Class

The `PricingCalculator` class handles all pricing logic:

```javascript
class PricingCalculator {
    constructor() {
        // Base price configuration per tier
        this.basePrices = {
            silver: 20,
            gold: 30,
            platinum: 40
        };
        
        // Device pricing per tier
        this.devicePrices = {
            silver: 6.50,
            gold: 7.50,
            platinum: 10
        };
        
        // Email pricing per tier
        this.emailPrices = {
            silver: 5,
            gold: 6.50,
            platinum: 8
        };

        // Server protection cost
        this.serverCost = 22.50;
    }
}
```

### Calculation Flow

1. **Input Collection**
```javascript
const users = parseInt(document.getElementById('users').value) || 0;
const devices = parseInt(document.getElementById('devices').value) || 0;
const emails = parseInt(document.getElementById('emails').value) || 0;
```

2. **Base Cost Calculation**
```javascript
let basePrice = this.basePrices[tier] * users;
```

3. **Extra Resource Calculations**
```javascript
const extraDevices = Math.max(0, devices - users);
const extraDeviceCost = extraDevices * this.devicePrices[tier];

const extraEmails = Math.max(0, emails - users);
const extraEmailCost = extraEmails * this.emailPrices[tier];
```

4. **Add-on Calculations**
```javascript
const serverCost = server ? this.serverCost : 0;
const darkwebCost = darkweb ? 100 : 0;
const attackSimCost = attack ? (75 + (emails * 5)) : 0;
```

5. **Per-Seat Price Adjustment**
```javascript
const totalExtraCost = extraDeviceCost + extraEmailCost + serverCost;
const extraCostPerSeat = totalExtraCost / users;
```

6. **Volume Discount Application**
```javascript
let discount = 0;
if (users > 50) {
    discount = subtotal * 0.10;
} else if (users > 25) {
    discount = subtotal * 0.05;
}
```

### Real-time Updates

The calculator updates prices in real-time through event listeners:

```javascript
initializeEventListeners() {
    const form = document.getElementById('pricingForm');
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('change', () => this.calculatePrice());
        input.addEventListener('input', () => this.calculatePrice());
    });
}
```

### Price Display Updates

The calculator updates both the per-seat prices in the tier cards and the detailed breakdown:

```javascript
updateTierPrices(selectedTier, extraCostPerSeat) {
    const tiers = ['silver', 'gold', 'platinum'];
    tiers.forEach(tier => {
        if (tier === selectedTier) {
            const adjustedPrice = this.basePrices[tier] + extraCostPerSeat;
            // Update price display with original and adjusted prices
        }
    });
}
```

## Setup Instructions

1. Clone the repository
2. Open `index.html` in a modern web browser
3. No server required - runs entirely in the browser

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development Notes

- Uses CSS variables for easy theme customization
- Responsive design with mobile-first approach
- No external dependencies
- Modern JavaScript (ES6+) features

## Customization

### Pricing Updates
To modify pricing, update the corresponding values in the `PricingCalculator` constructor:

```javascript
this.basePrices = {
    silver: 20,  // Modify base prices here
    gold: 30,
    platinum: 40
};
```

### Theme Customization
Update the CSS variables in `:root` to modify the color scheme:

```css
:root {
    --primary-color: #00ff9d;
    --background-color: #1a1a1a;
    /* etc */
}
```