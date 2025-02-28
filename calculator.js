class PricingCalculator {
    constructor() {
        this.basePrices = {
            silver: 20,
            gold: 30,
            platinum: 40
        };
        
        this.devicePrices = {
            silver: 6.50,
            gold: 7.50,
            platinum: 10
        };
        
        this.emailPrices = {
            silver: 5,
            gold: 6.50,
            platinum: 8
        };

        this.serverCost = 22.50;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const form = document.getElementById('pricingForm');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => this.calculatePrice());
            input.addEventListener('input', () => this.calculatePrice());
        });
    }

    calculatePrice() {
        const users = parseInt(document.getElementById('users').value) || 0;
        const devices = parseInt(document.getElementById('devices').value) || 0;
        const emails = parseInt(document.getElementById('emails').value) || 0;
        const tier = document.querySelector('input[name="tier"]:checked')?.value;
        const darkweb = document.getElementById('darkweb').checked;
        const attack = document.getElementById('attack').checked;
        const server = document.getElementById('server').checked;

        if (!users || !devices || !emails || !tier) {
            return;
        }

        // Base cost calculation
        let basePrice = this.basePrices[tier] * users;

        // Extra resources calculation
        const extraDevices = Math.max(0, devices - users);
        const extraDeviceCost = extraDevices * this.devicePrices[tier];

        const extraEmails = Math.max(0, emails - users);
        const extraEmailCost = extraEmails * this.emailPrices[tier];

        // Add-ons calculation
        const serverCost = server ? this.serverCost : 0;
        const darkwebCost = darkweb ? 100 : 0;
        const attackSimCost = attack ? (75 + (emails * 5)) : 0;

        // Calculate total extra costs and per-seat adjustment
        const totalExtraCost = extraDeviceCost + extraEmailCost + serverCost;
        const extraCostPerSeat = totalExtraCost / users;

        // Update displayed per-seat prices
        this.updateTierPrices(tier, extraCostPerSeat);

        // Calculate subtotal before discount
        const subtotal = basePrice + totalExtraCost + darkwebCost + attackSimCost;

        // Apply volume discount
        let discount = 0;
        if (users > 50) {
            discount = subtotal * 0.10;
        } else if (users > 25) {
            discount = subtotal * 0.05;
        }

        const total = subtotal - discount;

        // Scroll to results
        this.updateDisplay({
            basePrice,
            extraDeviceCost,
            extraEmailCost,
            serverCost,
            darkwebCost,
            attackSimCost,
            discount,
            total,
            users,
            subtotal
        });

        // Smooth scroll to results
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    }

    updateTierPrices(selectedTier, extraCostPerSeat) {
        const tiers = ['silver', 'gold', 'platinum'];
        tiers.forEach(tier => {
            const priceElement = document.querySelector(`#${tier} + .tier-label .price`);
            if (tier === selectedTier) {
                const adjustedPrice = this.basePrices[tier] + extraCostPerSeat;
                priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/seat <span class="original-price">was $${this.basePrices[tier].toFixed(2)}</span>`;
            } else {
                priceElement.innerHTML = `$${this.basePrices[tier].toFixed(2)}/seat`;
            }
        });
    }

    updateDisplay(pricing) {
        const breakdown = document.getElementById('breakdown');
        const total = document.getElementById('total');

        breakdown.innerHTML = `
            <p>Base Cost: $${pricing.basePrice.toFixed(2)}</p>
            ${pricing.extraDeviceCost > 0 ? `<p>Extra Devices Cost: $${pricing.extraDeviceCost.toFixed(2)}</p>` : ''}
            ${pricing.extraEmailCost > 0 ? `<p>Extra Emails Cost: $${pricing.extraEmailCost.toFixed(2)}</p>` : ''}
            ${pricing.serverCost > 0 ? `<p>Server Protection Cost: $${pricing.serverCost.toFixed(2)}</p>` : ''}
            ${pricing.darkwebCost > 0 ? `<p>DarkWeb Monitoring: $${pricing.darkwebCost.toFixed(2)}</p>` : ''}
            ${pricing.attackSimCost > 0 ? `<p>Attack Simulation: $${pricing.attackSimCost.toFixed(2)}</p>` : ''}
            <p>Subtotal: $${pricing.subtotal.toFixed(2)}</p>
            ${pricing.discount > 0 ? `<p>Volume Discount (${pricing.users > 50 ? '10' : '5'}%): -$${pricing.discount.toFixed(2)}</p>` : ''}
        `;

        total.innerHTML = `Total Monthly Cost: $${pricing.total.toFixed(2)}`;
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PricingCalculator();
});