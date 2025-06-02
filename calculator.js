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
        
        // Server backup costs
        this.backupOptions = {
            '300': 100,   // 300GB for $100
            '1000': 300,  // 1TB for $300
            '15000': 450  // 15TB for $450
        };

        // Advanced security costs per tier
        this.advancedSecurityCosts = {
            silver: 100,
            gold: 100,
            platinum: 0  // Included in platinum
        };
        
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
            platinum: ['soc', 'attackSim', 'vulnScan', 'penTest']
        };
        
        this.initializeEventListeners();
        this.initializeMspSection();
        this.initializeBoltOns();
        this.initializeServerBackup();
    }

    initializeEventListeners() {
        const form = document.getElementById('pricingForm');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.type === 'radio' && input.name === 'tier') {
                    this.updateBoltOnAvailability();
                    this.updateAdvancedSecurityPricing();
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

    initializeServerBackup() {
        const serverCheckbox = document.getElementById('server');
        const backupOptions = document.getElementById('serverBackupOptions');
        
        serverCheckbox.addEventListener('change', () => {
            backupOptions.style.display = serverCheckbox.checked ? 'block' : 'none';
            if (!serverCheckbox.checked) {
                // Uncheck all backup options when server is unchecked
                document.querySelectorAll('input[name="serverBackup"]').forEach(radio => {
                    radio.checked = false;
                });
            }
            this.calculatePrice();
        });

        // Add event listeners to backup option radios
        document.querySelectorAll('input[name="serverBackup"]').forEach(radio => {
            radio.addEventListener('change', () => this.calculatePrice());
        });
    }

    initializeBoltOns() {
        const boltOnCheckboxes = document.querySelectorAll('input[name="bolt_ons"], input[name="advanced_security"]');
        boltOnCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBoltOnAvailability();
                this.calculatePrice();
            });
        });

        // Initial update
        this.updateBoltOnAvailability();
        this.updateAdvancedSecurityPricing();
    }

    updateAdvancedSecurityPricing() {
        const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;
        if (!selectedTier) return;

        const vulnScanCheckbox = document.getElementById('vulnScan');
        const penTestCheckbox = document.getElementById('penTest');

        if (selectedTier === 'platinum') {
            vulnScanCheckbox.disabled = false;
            penTestCheckbox.disabled = false;
        } else {
            // Don't disable - they can still select for additional cost
        }
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
            if (!checkbox) return; // Skip if no checkbox (like for radio buttons)
            
            const label = option.querySelector('label');
            const featureId = checkbox.value;

            // Skip advanced security options
            if (checkbox.name === 'advanced_security') return;

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
        const serverBackup = document.querySelector('input[name="serverBackup"]:checked')?.value;
        const includeMsp = document.getElementById('includeMsp').checked;
        const mspHours = includeMsp ? parseFloat(document.getElementById('mspHours').value) || 0 : 0;

        if (!users || !devices || !emails || !tier) {
            return;
        }

        let basePrice = this.basePrices[tier] * devices;
        const extraEmails = Math.max(0, emails - users);
        const extraEmailCost = extraEmails * this.emailPrices[tier];
        const serverCost = server ? this.serverCost : 0;
        const backupCost = (server && serverBackup) ? this.backupOptions[serverBackup] : 0;
        const fixedLaborCost = this.fixedLaborHours[tier] * this.mspHourlyRate;

        // Calculate bolt-on costs
        const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
            .filter(checkbox => !this.includedFeatures[tier].includes(checkbox.value));
        const boltOnCost = selectedBoltOns.length * 10; // $10 per bolt-on

        // Calculate advanced security costs
        const advancedSecurityCost = Array.from(document.querySelectorAll('input[name="advanced_security"]:checked'))
            .filter(checkbox => !this.includedFeatures[tier].includes(checkbox.value))
            .reduce((total, checkbox) => total + this.advancedSecurityCosts[tier], 0);

        const subtotal = basePrice + extraEmailCost + serverCost + backupCost + fixedLaborCost + boltOnCost + advancedSecurityCost;

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
            backupCost,
            fixedLaborCost,
            boltOnCost,
            advancedSecurityCost,
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
            ${pricing.backupCost > 0 ? `<p>Server Backup Cost: $${pricing.backupCost.toFixed(2)}</p>` : ''}
            <p>Fixed Labor Cost (${this.fixedLaborHours[selectedTier]} hours @ $${this.mspHourlyRate}/hr): $${pricing.fixedLaborCost.toFixed(2)}</p>
            ${pricing.boltOnCost > 0 ? `<p>Additional Security Options Cost: $${pricing.boltOnCost.toFixed(2)}</p>` : ''}
            ${pricing.advancedSecurityCost > 0 ? `<p>Advanced Security Assessment Cost: $${pricing.advancedSecurityCost.toFixed(2)}</p>` : ''}
            ${pricing.mspCost > 0 ? `<p>Prepaid MSP Hours (${pricing.mspHours} hours @ $${this.mspHourlyRate}/hr): $${pricing.mspCost.toFixed(2)}</p>` : ''}
            ${pricing.discount > 0 ? `<p>Volume Discount: -$${pricing.discount.toFixed(2)}</p>` : ''}
            <p>Subtotal: $${pricing.subtotal.toFixed(2)}</p>
        `;

        total.innerHTML = `<h3>Monthly Total: $${pricing.total.toFixed(2)}</h3>`;
    }

    generatePDF() {
        // Make sure jsPDF is properly loaded
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Get the logo element
        const logoImg = document.querySelector('.logo');
        
        if (!logoImg || !logoImg.complete) {
            console.error('Logo image not found or not loaded');
            this.generatePDFContent(doc);
            return;
        }

        // Wait for image to load if it hasn't
        if (!logoImg.complete) {
            logoImg.onload = () => this.processLogoAndGeneratePDF(doc, logoImg);
            logoImg.onerror = () => {
                console.error('Error loading logo image');
                this.generatePDFContent(doc);
            };
            return;
        }

        this.processLogoAndGeneratePDF(doc, logoImg);
    }

    processLogoAndGeneratePDF(doc, logoImg) {
        try {
            // Create a canvas to draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match the logo's natural size
            canvas.width = logoImg.naturalWidth || logoImg.width;
            canvas.height = logoImg.naturalHeight || logoImg.height;
            
            // Draw the image on the canvas
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
            
            // Get the image data as PNG
            const dataUrl = canvas.toDataURL('image/png');
            
            // Calculate aspect ratio to maintain proportions
            const imgWidth = 40;  // Width in PDF units (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add image to PDF
            doc.addImage(dataUrl, 'PNG', 20, 10, imgWidth, imgHeight);
            
            // Generate the rest of the PDF content
            this.generatePDFContent(doc);
        } catch (error) {
            console.error('Error processing logo:', error);
            // If there's an error with the logo, still generate the PDF without it
            this.generatePDFContent(doc);
        }
    }

    generatePDFContent(doc) {
        try {
            const textColor = '#1a1a1a';
            let leftColY = 20;  // Y position for left column
            let rightColY = 20; // Y position for right column
            const rightColX = 120; // Starting X position for right column
            const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;
            if (!selectedTier) {
                throw new Error('No tier selected');
            }

            // Function to add header with logo
            const addHeader = (pageNum = 1) => {
                if (pageNum > 1) {
                    doc.addPage();
                }
                
                try {
                    // Add logo - using a simpler direct approach
                    const logoImg = document.querySelector('.logo');
                    if (logoImg && logoImg.complete) {
                        const imgWidth = 40;  // Width in PDF units (mm)
                        const imgHeight = (logoImg.naturalHeight * imgWidth) / logoImg.naturalWidth;
                        doc.addImage(logoImg, 'PNG', 20, 10, imgWidth, imgHeight);
                    }
                } catch (error) {
                    console.error('Error adding logo:', error);
                }
                
                // Header
                doc.setFontSize(24);
                doc.setTextColor(textColor);
                doc.text('IP Solutions Security Quote', 70, 25);
                
                // Date
                doc.setFontSize(10);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
            };

            // Add first page header
            addHeader();

            // Environment Details - now a function so we can reuse it
            const addEnvironmentDetails = (yStart) => {
                doc.setFontSize(16);
                doc.text('Environment Details', rightColX, yStart);
                doc.setFontSize(12);
                let envY = yStart + 10;
                const envDetails = [
                    `Users: ${document.getElementById('users').value}`,
                    `Devices: ${document.getElementById('devices').value}`,
                    `Emails: ${document.getElementById('emails').value}`,
                    `Server Protection: ${document.getElementById('server').checked ? 'Yes' : 'No'}`,
                    `MSP Hours: ${document.getElementById('includeMsp').checked ? document.getElementById('mspHours').value : 'None'}`
                ];
                envDetails.forEach(detail => {
                    doc.text(detail, rightColX, envY);
                    envY += 7;
                });
                return envY;
            };

            // Add environment details to first page
            rightColY = addEnvironmentDetails(45);

            // Selected Plan header (without features for page 2)
            const addSelectedPlan = (yStart, includeFeatures = true) => {
                doc.setFontSize(16);
                doc.text(`Selected Plan: ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`, 20, yStart);
                
                if (!includeFeatures) return yStart + 10;

                let planY = yStart + 10;
                doc.setFontSize(12);
                doc.text('Included Features:', 20, planY);
                planY += 7;

                // Get features based on tier
                const silverFeatures = Array.from(document.querySelector('#silver').closest('.tier-card')
                    .querySelectorAll('.features li:not(.sub-feature)'))
                    .map(li => li.textContent.trim())
                    .filter(text => !text.includes('Fixed Labor') && !text.includes('Choose'));

                silverFeatures.forEach(feature => {
                    doc.text(`• ${feature}`, 25, planY);
                    planY += 7;
                });

                if (selectedTier === 'gold' || selectedTier === 'platinum') {
                    const goldFeatures = Array.from(document.querySelector('#gold').closest('.tier-card')
                        .querySelectorAll('.features li:not(.sub-feature)'))
                        .map(li => li.textContent.trim())
                        .filter(text => !text.includes('Fixed Labor') && !text.includes('Everything in') && !text.includes('Choose'));
                    
                    goldFeatures.forEach(feature => {
                        doc.text(`• ${feature}`, 25, planY);
                        planY += 7;
                    });
                }

                if (selectedTier === 'platinum') {
                    const platinumFeatures = Array.from(document.querySelector('#platinum').closest('.tier-card')
                        .querySelectorAll('.features li:not(.sub-feature)'))
                        .map(li => li.textContent.trim())
                        .filter(text => !text.includes('Fixed Labor') && !text.includes('Everything in') && !text.includes('Choose'));
                    
                    platinumFeatures.forEach(feature => {
                        doc.text(`• ${feature}`, 25, planY);
                        planY += 7;
                    });
                }

                return planY;
            };

            // Add selected plan to first page
            leftColY = addSelectedPlan(45);

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

            // For Gold and Platinum, add pricing on second page
            if (selectedTier === 'gold' || selectedTier === 'platinum') {
                // Add note about pricing on next page
                doc.setFontSize(10);
                doc.text('(Pricing breakdown continued on next page)', 20, leftColY + 10);

                // Add second page with header and pricing
                addHeader(2);
                let page2Y = 45;

                // Add selected plan (without features) and environment details
                page2Y = addSelectedPlan(page2Y, false);
                page2Y = Math.max(page2Y, addEnvironmentDetails(45));

                // Add pricing breakdown
                doc.setFontSize(16);
                doc.text('Pricing Breakdown', 20, page2Y + 10);
                doc.setFontSize(12);
                let currentY = page2Y + 18;
                
                const breakdown = document.getElementById('breakdown')?.innerText;
                const total = document.getElementById('total')?.innerText;
                
                if (breakdown) {
                    const breakdownLines = breakdown.split('\n');
                    breakdownLines.forEach(line => {
                        doc.text(line, 20, currentY);
                        currentY += 7;
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
            } else {
                // For Silver tier, keep pricing on first page
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
                        currentY += 7;
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
            }

            // Footer on last page
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