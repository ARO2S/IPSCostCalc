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

        // Maximum bolt-ons per tier
        this.maxBoltOns = {
            silver: 1,
            gold: 3,
            platinum: 5
        };

        // Included features per tier (these won't count towards bolt-on limits)
        this.includedFeatures = {
            silver: [],
            gold: ['soc'],
            platinum: ['soc', 'attackSim']
        };
        
        this.initializeEventListeners();
        this.initializeMspSection();
        this.initializeBoltOns();
    }

    initializeEventListeners() {
        const form = document.getElementById('pricingForm');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.type === 'radio' && input.name === 'tier') {
                    this.updateBoltOnAvailability();
                }
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

        document.getElementById('exportPdf').addEventListener('click', () => {
            this.generatePDF();
        });
    }

    initializeBoltOns() {
        const boltOnCheckboxes = document.querySelectorAll('input[name="bolt_ons"]');
        boltOnCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBoltOnAvailability();
                this.calculatePrice();
            });
        });

        // Initial update
        this.updateBoltOnAvailability();
    }

    updateBoltOnAvailability() {
        const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;
        if (!selectedTier) return;

        const maxAllowed = this.maxBoltOns[selectedTier];
        const includedFeatures = this.includedFeatures[selectedTier];
        const boltOnOptions = document.querySelectorAll('.bolt-on-option');
        const checkedCount = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
            .filter(checkbox => !includedFeatures.includes(checkbox.value))
            .length;

        // Update remaining options text
        const remainingOptions = document.getElementById('remainingOptions');
        remainingOptions.textContent = `${maxAllowed - checkedCount} options remaining for ${selectedTier} tier`;

        boltOnOptions.forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            const label = option.querySelector('label');
            const featureId = checkbox.value;

            // Check if this feature is included in the tier
            if (includedFeatures.includes(featureId)) {
                checkbox.checked = true;
                checkbox.disabled = true;
                option.classList.add('disabled');
                if (!label.querySelector('.included-text')) {
                    const includedText = document.createElement('span');
                    includedText.className = 'included-text';
                    includedText.textContent = '(Included in tier)';
                    label.appendChild(includedText);
                }
            } else {
                // Remove the "included" text if it exists
                const includedText = label.querySelector('.included-text');
                if (includedText) {
                    includedText.remove();
                }

                // Handle availability based on selection limit
                if (!checkbox.checked && checkedCount >= maxAllowed) {
                    checkbox.disabled = true;
                    option.classList.add('disabled');
                } else {
                    checkbox.disabled = false;
                    option.classList.remove('disabled');
                }
            }
        });
    }

    initializeMspSection() {
        const mspCheckbox = document.getElementById('includeMsp');
        const mspDetails = document.getElementById('mspDetails');
        const mspHours = document.getElementById('mspHours');

        mspDetails.style.display = 'none';

        mspCheckbox.addEventListener('change', () => {
            mspDetails.style.display = mspCheckbox.checked ? 'block' : 'none';
            this.calculatePrice();
        });

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
        
        if (!mspHoursInput.value || mspHoursInput.dataset.wasRecommended === 'true') {
            mspHoursInput.value = recommendedHours;
            mspHoursInput.dataset.wasRecommended = 'true';
        }
    }

    getRecommendedMspHours(devices) {
        if (devices <= 25) return 2;
        if (devices <= 50) return 4;
        if (devices <= 100) return 6;
        return 8;
    }

    calculatePrice() {
        const users = parseInt(document.getElementById('users').value) || 0;
        const devices = parseInt(document.getElementById('devices').value) || 0;
        const emails = parseInt(document.getElementById('emails').value) || 0;
        const tier = document.querySelector('input[name="tier"]:checked')?.value;
        const server = document.getElementById('server').checked;
        const includeMsp = document.getElementById('includeMsp').checked;
        const mspHours = includeMsp ? parseFloat(document.getElementById('mspHours').value) || 0 : 0;

        if (!users || !devices || !emails || !tier) {
            return;
        }

        let basePrice = this.basePrices[tier] * devices;
        const extraEmails = Math.max(0, emails - users);
        const extraEmailCost = extraEmails * this.emailPrices[tier];
        const serverCost = server ? this.serverCost : 0;
        const fixedLaborCost = this.fixedLaborHours[tier] * this.mspHourlyRate;

        // Calculate bolt-on costs
        const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
            .filter(checkbox => !this.includedFeatures[tier].includes(checkbox.value));
        const boltOnCost = selectedBoltOns.length * 10; // $10 per bolt-on

        const subtotal = basePrice + extraEmailCost + serverCost + fixedLaborCost + boltOnCost;

        let discount = 0;
        if (users > 50) {
            discount = subtotal * 0.10;
        } else if (users > 25) {
            discount = subtotal * 0.05;
        }

        const mspCost = mspHours * this.mspHourlyRate;
        const total = subtotal - discount + mspCost;

        this.updateDisplay({
            basePrice,
            extraEmailCost,
            serverCost,
            fixedLaborCost,
            boltOnCost,
            mspCost,
            discount,
            total,
            users,
            devices,
            subtotal,
            mspHours,
            tier,
            selectedBoltOns
        });
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
            ${pricing.boltOnCost > 0 ? `<p>Additional Security Options (${pricing.selectedBoltOns.length} @ $10 each): $${pricing.boltOnCost.toFixed(2)}</p>` : ''}
            ${pricing.mspCost > 0 ? `<p>Prepaid MSP Support (${pricing.mspHours} hours @ $${this.mspHourlyRate}/hr): $${pricing.mspCost.toFixed(2)}</p>` : ''}
            <p>Subtotal: $${pricing.subtotal.toFixed(2)}</p>
            ${pricing.discount > 0 ? `<p>Volume Discount (${pricing.users > 50 ? '10' : '5'}%): -$${pricing.discount.toFixed(2)}</p>` : ''}
        `;

        total.innerHTML = `Total Monthly Cost: $${pricing.total.toFixed(2)}`;
    }

    calculateTierCost(tier, users, devices, emails) {
        const extraDevices = Math.max(0, devices - users);
        const extraDeviceCost = extraDevices * this.devicePrices[tier];

        const extraEmails = Math.max(0, emails - users);
        const extraEmailCost = extraEmails * this.emailPrices[tier];

        const totalExtraCost = extraDeviceCost + extraEmailCost;
        return totalExtraCost / users;
    }

    updateAllTierPrices(users, devices, emails) {
        const tiers = ['silver', 'gold', 'platinum'];
        
        tiers.forEach(tier => {
            const priceElement = document.querySelector(`label[for="${tier}"] .price`);
            if (!priceElement) return;
            
            const extraCostPerSeat = this.calculateTierCost(tier, users, devices, emails);
            const adjustedPrice = this.basePrices[tier] + extraCostPerSeat;

            if (adjustedPrice < this.basePrices[tier]) {
                priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/device <span class="original-price">was $${this.basePrices[tier].toFixed(2)}</span>`;
            } else {
                priceElement.innerHTML = `$${adjustedPrice.toFixed(2)}/device`;
            }
        });
    }

    generatePDF() {
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const logoImg = document.querySelector('.logo');
        
        if (!logoImg) {
            console.error('Logo image not found on page');
            this.generatePDFContent(doc);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                const imgWidth = 40;
                const imgHeight = (img.height * imgWidth) / img.width;
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
            let leftColY = 20;
            let rightColY = 20;
            const rightColX = 120;

            doc.setFontSize(24);
            doc.setTextColor(textColor);
            doc.text('IP Solutions Security Quote', 70, 25);
            
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

            doc.setFontSize(16);
            doc.text('Environment Details', rightColX, 45);
            doc.setFontSize(12);
            rightColY = 55;
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

            // Get selected bolt-ons
            const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
                .map(checkbox => checkbox.parentElement.querySelector('label').textContent);

            // Base features for all tiers
            const baseFeatures = [
                'Endpoint Protection',
                'Daily/Weekly Device Updates',
                'Remote Monitoring and Management'
            ];

            baseFeatures.forEach(feature => {
                doc.text(`• ${feature}`, 25, leftColY);
                leftColY += 7;
            });

            if (selectedTier === 'gold' || selectedTier === 'platinum') {
                doc.text(`• Security Operations Center (SOC)`, 25, leftColY);
                leftColY += 7;
            }

            if (selectedTier === 'platinum') {
                doc.text(`• Attack Simulation`, 25, leftColY);
                leftColY += 7;
            }

            // Add selected bolt-ons
            if (selectedBoltOns.length > 0) {
                leftColY += 5;
                doc.text('Selected Additional Options:', 20, leftColY);
                leftColY += 7;
                selectedBoltOns.forEach(feature => {
                    doc.text(`• ${feature}`, 25, leftColY);
                    leftColY += 7;
                });
            }

            // Fixed Labor Hours
            leftColY += 5;
            doc.text('Fixed Monthly Labor:', 20, leftColY);
            leftColY += 7;
            doc.text(`• ${this.fixedLaborHours[selectedTier]} Hours Total:`, 25, leftColY);
            leftColY += 7;
            doc.text('  - Security Review Meeting (30 minutes)', 30, leftColY);
            leftColY += 7;
            doc.text(`  - Deliverables & Reports (${this.fixedLaborHours[selectedTier] - 0.5} hours)`, 30, leftColY);

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
            
            if (total) {
                currentY += 3;
                doc.setFontSize(14);
                doc.text(total, 20, currentY);
            }

            if (document.getElementById('includeMsp').checked) {
                currentY += 10;
                doc.setFontSize(10);
                doc.text('Note: Any additional hours generated through support tickets will be billed at the', 20, currentY);
                currentY += 5;
                doc.text('discounted rate of $120/hour.', 20, currentY);
            }

            doc.setFontSize(10);
            doc.text('For questions or to proceed with this quote, please contact IP Solutions.', 105, 270, { align: 'center' });
            doc.text('Call (574) 259-6000 or email sales@phonedatasupport.net', 105, 277, { align: 'center' });

            doc.save('IP_Solutions_Security_Quote.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('There was an error generating the PDF. Please make sure all fields are filled out correctly.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PricingCalculator();
}); 