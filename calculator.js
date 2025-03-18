class PricingCalculator {
    constructor() {
        this.basePrices = {
            silver: 25,
            gold: 35,
            platinum: 45
        };
        
        this.devicePrices = {
            silver: 8,
            gold: 10,
            platinum: 12
        };
        
        this.emailPrices = {
            silver: 6,
            gold: 8,
            platinum: 10
        };

        this.serverCost = 22.50;
        this.mspHourlyRate = 120;
        
        // Fixed labor hours per tier
        this.fixedLaborHours = {
            silver: 2,
            gold: 2.5,
            platinum: 3
        };
        
        this.initializeEventListeners();
        this.initializeMspSection();
    }

    initializeEventListeners() {
        const form = document.getElementById('pricingForm');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const users = parseInt(document.getElementById('users').value) || 0;
                const devices = parseInt(document.getElementById('devices').value) || 0;
                const emails = parseInt(document.getElementById('emails').value) || 0;
                
                if (users && devices && emails) {
                    this.updateAllTierPrices(users, devices, emails);
                }
                this.calculatePrice();
            });
            input.addEventListener('input', () => {
                const users = parseInt(document.getElementById('users').value) || 0;
                const devices = parseInt(document.getElementById('devices').value) || 0;
                const emails = parseInt(document.getElementById('emails').value) || 0;
                
                if (users && devices && emails) {
                    this.updateAllTierPrices(users, devices, emails);
                }
                this.calculatePrice();
            });
        });

        // Add export button listener
        document.getElementById('exportPdf').addEventListener('click', () => {
            this.generatePDF();
        });
    }

    initializeMspSection() {
        const mspCheckbox = document.getElementById('includeMsp');
        const mspDetails = document.getElementById('mspDetails');
        const mspHours = document.getElementById('mspHours');

        // Initially hide MSP details
        mspDetails.style.display = 'none';

        mspCheckbox.addEventListener('change', () => {
            mspDetails.style.display = mspCheckbox.checked ? 'block' : 'none';
            this.calculatePrice();
        });

        // Update recommended hours when device count changes
        document.getElementById('devices').addEventListener('input', () => {
            this.updateRecommendedMspHours();
        });
    }

    updateRecommendedMspHours() {
        const devices = parseInt(document.getElementById('devices').value) || 0;
        const recommendedHours = this.getRecommendedMspHours(devices);
        const recommendedSpan = document.getElementById('recommendedHours');
        const mspHoursInput = document.getElementById('mspHours');

        recommendedSpan.textContent = `(Recommended: ${recommendedHours} hours)`;
        
        // Auto-fill recommended hours if the input is empty or if the current value is the previous recommendation
        if (!mspHoursInput.value || mspHoursInput.dataset.wasRecommended === 'true') {
            mspHoursInput.value = recommendedHours;
            mspHoursInput.dataset.wasRecommended = 'true';
        }
    }

    getRecommendedMspHours(devices) {
        if (devices <= 25) return 2;
        if (devices <= 50) return 4;
        if (devices <= 100) return 6;
        return 8; // For larger organizations
    }

    calculatePrice() {
        const users = parseInt(document.getElementById('users').value) || 0;
        const devices = parseInt(document.getElementById('devices').value) || 0;
        const emails = parseInt(document.getElementById('emails').value) || 0;
        const tier = document.querySelector('input[name="tier"]:checked')?.value;
        const server = document.getElementById('server').checked;
        const includeMsp = document.getElementById('includeMsp').checked;
        const mspHours = includeMsp ? parseFloat(document.getElementById('mspHours').value) || 0 : 0;

        console.log('Calculating price:', { users, devices, emails, tier, server, includeMsp, mspHours });

        if (!users || !devices || !emails || !tier) {
            console.log('Missing required fields');
            return;
        }

        // Base cost calculation (per device)
        let basePrice = this.basePrices[tier] * devices;

        // Extra emails cost
        const extraEmails = Math.max(0, emails - users);
        const extraEmailCost = extraEmails * this.emailPrices[tier];

        // Server and fixed labor costs
        const serverCost = server ? this.serverCost : 0;
        const fixedLaborCost = this.fixedLaborHours[tier] * this.mspHourlyRate;

        // Calculate subtotal before MSP hours and discount
        const subtotal = basePrice + extraEmailCost + serverCost + fixedLaborCost;

        // Apply volume discount
        let discount = 0;
        if (users > 50) {
            discount = subtotal * 0.10;
        } else if (users > 25) {
            discount = subtotal * 0.05;
        }

        // Add MSP hours cost after discount
        const mspCost = mspHours * this.mspHourlyRate;
        const total = subtotal - discount + mspCost;

        console.log('Calculated values:', {
            basePrice,
            extraEmailCost,
            serverCost,
            fixedLaborCost,
            mspCost,
            discount,
            total,
            subtotal
        });

        this.updateDisplay({
            basePrice,
            extraEmailCost,
            serverCost,
            fixedLaborCost,
            mspCost,
            discount,
            total,
            users,
            devices,
            subtotal,
            mspHours,
            tier
        });
    }

    // New method to calculate per-seat cost for any tier
    calculateTierCost(tier, users, devices, emails) {
        const extraDevices = Math.max(0, devices - users);
        const extraDeviceCost = extraDevices * this.devicePrices[tier];

        const extraEmails = Math.max(0, emails - users);
        const extraEmailCost = extraEmails * this.emailPrices[tier];

        // Don't include server cost in per-seat calculation
        const totalExtraCost = extraDeviceCost + extraEmailCost;
        return totalExtraCost / users;
    }

    // New method to update all tier prices
    updateAllTierPrices(users, devices, emails) {
        const tiers = ['silver', 'gold', 'platinum'];
        
        tiers.forEach(tier => {
            // Fix the selector to properly find the price element within the tier-label
            const priceElement = document.querySelector(`label[for="${tier}"] .price`);
            if (!priceElement) return; // Skip if element not found
            
            const extraCostPerSeat = this.calculateTierCost(tier, users, devices, emails);
            const adjustedPrice = this.basePrices[tier] + extraCostPerSeat;

            if (adjustedPrice < this.basePrices[tier]) {
                priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/device <span class="original-price">was $${this.basePrices[tier].toFixed(2)}</span>`;
            } else {
                priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/device`;
            }
        });
    }

    // Replace the old updateTierPrices method with this simpler version
    updateTierPrices(selectedTier, extraCostPerSeat) {
        const priceElement = document.querySelector(`label[for="${selectedTier}"] .price`);
        if (!priceElement) return;
        
        const adjustedPrice = this.basePrices[selectedTier] + extraCostPerSeat;
        
        if (adjustedPrice < this.basePrices[selectedTier]) {
            priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/device <span class="original-price">was $${this.basePrices[selectedTier].toFixed(2)}</span>`;
        } else {
            priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/device`;
        }
    }

    updateDisplay(pricing) {
        const breakdown = document.getElementById('breakdown');
        const total = document.getElementById('total');
        const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;

        if (!breakdown || !total) return;

        breakdown.innerHTML = `
            <p>Base Security Cost (${pricing.devices} devices @ $${this.basePrices[selectedTier]}/device): $${pricing.basePrice.toFixed(2)}</p>
            ${pricing.extraEmailCost > 0 ? `<p>Extra Emails Cost: $${pricing.extraEmailCost.toFixed(2)}</p>` : ''}
            ${pricing.serverCost > 0 ? `<p>Server Protection Cost: $${pricing.serverCost.toFixed(2)}</p>` : ''}
            <p>Fixed Monthly Labor (${this.fixedLaborHours[selectedTier]} hours @ $${this.mspHourlyRate}/hr): $${pricing.fixedLaborCost.toFixed(2)}</p>
            ${pricing.mspCost > 0 ? `<p>Prepaid MSP Support (${pricing.mspHours} hours @ $${this.mspHourlyRate}/hr): $${pricing.mspCost.toFixed(2)}</p>` : ''}
            <p>Subtotal: $${pricing.subtotal.toFixed(2)}</p>
            ${pricing.discount > 0 ? `<p>Volume Discount (${pricing.users > 50 ? '10' : '5'}%): -$${pricing.discount.toFixed(2)}</p>` : ''}
        `;

        total.innerHTML = `Total Monthly Cost: $${pricing.total.toFixed(2)}`;
    }

    generatePDF() {
        // Make sure jsPDF is properly loaded
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Get the logo element from the page
        const logoImg = document.querySelector('.logo');
        
        if (!logoImg) {
            console.error('Logo image not found on page');
            this.generatePDFContent(doc);
            return;
        }

        // Create new image with crossOrigin set
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                // Calculate aspect ratio to maintain proportions
                const imgWidth = 40;  // Width in PDF units (mm)
                const imgHeight = (img.height * imgWidth) / img.width;
                
                // Add image to PDF
                doc.addImage(img, 'PNG', 20, 10, imgWidth, imgHeight);
                this.generatePDFContent(doc);
            } catch (error) {
                console.error('Error adding logo to PDF:', error);
                this.generatePDFContent(doc);
            }
        };

        img.onerror = () => {
            console.error('Error loading logo image');
            this.generatePDFContent(doc);
        };

        // Convert the image to a data URL by creating a blob
        fetch(logoImg.src)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                img.src = url;
            })
            .catch(error => {
                console.error('Error fetching logo:', error);
                this.generatePDFContent(doc);
            });
    }

    generatePDFContent(doc) {
        try {
            const textColor = '#1a1a1a';
            let leftColY = 20;  // Y position for left column
            let rightColY = 20; // Y position for right column
            const rightColX = 120; // Starting X position for right column

            // Header - moved down and to the right to accommodate logo
            doc.setFontSize(24);
            doc.setTextColor(textColor);
            doc.text('IP Solutions Security Quote', 105, 35, { align: 'center' });
            
            // Date - moved down accordingly
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

            // Right Column: Environment Details - adjusted Y positions
            doc.setFontSize(16);
            doc.text('Environment Details', rightColX, 55);
            doc.setFontSize(12);
            rightColY = 65;
            const envDetails = [
                `Users: ${document.getElementById('users').value}`,
                `Devices: ${document.getElementById('devices').value}`,
                `Emails: ${document.getElementById('emails').value}`,
                `Server Protection: ${document.getElementById('server').checked ? 'Yes' : 'No'}`,
                `MSP Hours: ${document.getElementById('includeMsp').checked ? document.getElementById('mspHours').value : 'None'}`
            ];
            envDetails.forEach(detail => {
                doc.text(detail, rightColX, rightColY);
                rightColY += 7;
            });

            // Left Column: Selected Plan and Features
            leftColY = 45;
            const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;
            if (!selectedTier) {
                throw new Error('No tier selected');
            }
            
            doc.setFontSize(16);
            doc.text(`Selected Plan: ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`, 20, leftColY);
            
            leftColY += 10;
            doc.setFontSize(12);
            doc.text('Included Features:', 20, leftColY);
            leftColY += 7;

            // Get Silver features
            const silverFeatures = Array.from(document.querySelector('#silver').closest('.tier-card')
                .querySelectorAll('.features li:not(.sub-feature)'))
                .map(li => li.textContent.trim())
                .filter(text => !text.includes('Fixed Labor'));

            silverFeatures.forEach(feature => {
                doc.text(`• ${feature}`, 25, leftColY);
                leftColY += 7;
            });

            if (selectedTier === 'gold' || selectedTier === 'platinum') {
                const goldFeatures = Array.from(document.querySelector('#gold').closest('.tier-card')
                    .querySelectorAll('.features li:not(.sub-feature)'))
                    .map(li => li.textContent.trim())
                    .filter(text => !text.includes('Fixed Labor') && !text.includes('Everything in'));
                
                goldFeatures.forEach(feature => {
                    doc.text(`• ${feature}`, 25, leftColY);
                    leftColY += 7;
                });
            }

            if (selectedTier === 'platinum') {
                const platinumFeatures = Array.from(document.querySelector('#platinum').closest('.tier-card')
                    .querySelectorAll('.features li:not(.sub-feature)'))
                    .map(li => li.textContent.trim())
                    .filter(text => !text.includes('Fixed Labor') && !text.includes('Everything in'));
                
                platinumFeatures.forEach(feature => {
                    doc.text(`• ${feature}`, 25, leftColY);
                    leftColY += 7;
                });
            }

            // Fixed Labor Hours Breakdown
            leftColY += 5;
            doc.text('Fixed Monthly Labor Breakdown:', 20, leftColY);
            leftColY += 7;
            doc.text('• Security Review Meeting (30 minutes)', 25, leftColY);
            leftColY += 7;
            doc.text('• Deliverables & Reports:', 25, leftColY);
            leftColY += 7;
            doc.text(`  - Endpoint Security Report`, 30, leftColY);
            leftColY += 7;
            doc.text(`  - Asset Inventory Report and Patching Review`, 30, leftColY);
            leftColY += 7;
            if (selectedTier === 'gold' || selectedTier === 'platinum') {
                doc.text(`  - SIEM Analysis & Review`, 30, leftColY);
                leftColY += 7;
            }
            if (selectedTier === 'platinum') {
                doc.text(`  - Vulnerability Assessment Report`, 30, leftColY);
                leftColY += 7;
            }

            // Pricing Breakdown
            const startY = Math.max(leftColY, rightColY) + 10;
            doc.setFontSize(16);
            doc.text('Pricing Breakdown', 20, startY);
            doc.setFontSize(12);
            let currentY = startY + 8;
            
            const breakdown = document.getElementById('breakdown')?.innerText;
            const total = document.getElementById('total')?.innerText;
            
            if (breakdown) {
                const breakdownLines = breakdown.split('\n');
                breakdownLines.forEach(line => {
                    doc.text(line, 20, currentY);
                    currentY += 5;
                });
            }
            
            // Total
            if (total) {
                currentY += 3;
                doc.setFontSize(14);
                doc.text(total, 20, currentY);
            }

            // MSP Hours Disclaimer
            if (document.getElementById('includeMsp').checked) {
                currentY += 10;
                doc.setFontSize(10);
                doc.text('Note: Any additional hours generated through support tickets will be billed at the', 20, currentY);
                currentY += 5;
                doc.text('discounted rate of $120/hour.', 20, currentY);
            }

            // Footer
            doc.setFontSize(10);
            doc.text('For questions or to proceed with this quote, please contact IP Solutions.', 105, 270, { align: 'center' });
            doc.text('Call (574) 259-6000 or email sales@phonedatasupport.net', 105, 277, { align: 'center' });

            // Save the PDF
            doc.save('IP_Solutions_Security_Quote.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('There was an error generating the PDF. Please make sure all fields are filled out correctly.');
        }
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PricingCalculator();
});