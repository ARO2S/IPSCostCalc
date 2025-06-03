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

        // Flat rate of $10 per user for any additional security features
        this.boltOnCostPerUser = 10;

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

        // Calculate bolt-on costs - flat $10 per user if any features are selected
        const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
            .filter(checkbox => !this.includedFeatures[tier].includes(checkbox.value));
        const boltOnCost = selectedBoltOns.length > 0 ? this.boltOnCostPerUser * users : 0; // Just $10 per user if any features selected

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
            ${pricing.boltOnCost > 0 ? `<p>Additional Security Options (${pricing.users} users × $${this.boltOnCostPerUser}/user): $${pricing.boltOnCost.toFixed(2)}</p>` : ''}
            ${pricing.advancedSecurityCost > 0 ? `<p>Advanced Security Assessment Cost: $${pricing.advancedSecurityCost.toFixed(2)}</p>` : ''}
            ${pricing.mspCost > 0 ? `<p>Prepaid MSP Hours (${pricing.mspHours} hours @ $${this.mspHourlyRate}/hr): $${pricing.mspCost.toFixed(2)}</p>` : ''}
            ${pricing.discount > 0 ? `<p>Volume Discount: -$${pricing.discount.toFixed(2)}</p>` : ''}
            <p>Subtotal: $${pricing.subtotal.toFixed(2)}</p>
        `;

        total.innerHTML = `
            <div class="total-box">
                <h3>Monthly Total: $${pricing.total.toFixed(2)}</h3>
            </div>
            ${document.getElementById('includeMsp').checked ? 
                `<p class="total-note">Note: Any additional hours generated through support tickets will be billed at the discounted rate of $120/hour.</p>` 
                : ''}
        `;
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
            this.generatePDFContent(doc, null);
            return;
        }

        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match the logo's natural size
        canvas.width = logoImg.naturalWidth || logoImg.width;
        canvas.height = logoImg.naturalHeight || logoImg.height;
        
        try {
            // Draw the image on the canvas
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
            
            // Get the image data as PNG
            const dataUrl = canvas.toDataURL('image/png');
            
            // Generate PDF with the logo
            this.generatePDFContent(doc, dataUrl);
        } catch (error) {
            console.error('Error processing logo:', error);
            // If there's an error with the logo, still generate the PDF without it
            this.generatePDFContent(doc, null);
        }
    }

    processLogoAndGeneratePDF(doc, logoImg) {
        // This method is now deprecated - keeping for reference
        this.generatePDFContent(doc, null);
    }

    generatePDFContent(doc, logoDataUrl, isModern = false) {
        try {
            const textColor = isModern ? '#1e293b' : '#1a1a1a';
            const primaryColor = isModern ? '#2563eb' : '#000000';
            const secondaryColor = isModern ? '#059669' : '#666666';
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const maxContentHeight = pageHeight - 40; // Leave margin at bottom
            let leftColY = 45;
            const rightColX = pageWidth - 65; // Position environment details closer to right margin
            const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;
            
            if (!selectedTier) {
                throw new Error('No tier selected');
            }

            // Function to measure content height
            const measureContentHeight = (baseFontSize) => {
                let testY = 45; // Starting Y position after header

                // Environment details are now in top right, so don't count in vertical space
                
                // Base features height
                testY += 20; // Section header
                const features = Array.from(document.querySelector(`#${selectedTier}`).closest('.tier-card')
                    .querySelectorAll('.features li'))
                    .map(li => li.textContent.trim());
                testY += (features.length * (baseFontSize + (baseFontSize * 0.4)));

                // Selected bolt-ons height
                const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
                    .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));
                if (selectedBoltOns.length > 0) {
                    testY += 20; // Section header
                    selectedBoltOns.forEach(() => {
                        testY += (baseFontSize * 2 + (baseFontSize * 0.4)); // Approximate height for wrapped text
                    });
                }

                // Advanced security height
                const selectedAdvancedSecurity = Array.from(document.querySelectorAll('input[name="advanced_security"]:checked'))
                    .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));
                if (selectedAdvancedSecurity.length > 0) {
                    testY += 20; // Section header
                    selectedAdvancedSecurity.forEach(() => {
                        testY += (baseFontSize * 2 + (baseFontSize * 0.4)); // Approximate height for wrapped text
                    });
                }

                return testY;
            };

            // Find appropriate font size
            let baseFontSize = 12;
            let contentHeight = measureContentHeight(baseFontSize);
            while (contentHeight > maxContentHeight && baseFontSize > 8) {
                baseFontSize -= 0.5;
                contentHeight = measureContentHeight(baseFontSize);
            }

            // Now render with calculated font size
            const lineSpacing = baseFontSize * 0.4;

            // Add header
            doc.setFontSize(24);
            doc.setTextColor(textColor);
            if (isModern) {
                doc.setTextColor(primaryColor);
            }
            doc.text('IP Solutions Security Quote', 20, 25);
            
            // Date
            doc.setFontSize(10);
            doc.setTextColor(textColor);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

            // Environment Details - Compact format in top right
            const envDetails = {
                users: document.getElementById('users').value,
                devices: document.getElementById('devices').value,
                emails: document.getElementById('emails').value,
                server: document.getElementById('server').checked ? 'Yes' : 'No',
                msp: document.getElementById('includeMsp').checked ? document.getElementById('mspHours').value : 'None'
            };

            // Draw a light box around environment details
            const envBoxPadding = 5;
            const envBoxWidth = 80;
            const envBoxHeight = 50;
            const envBoxX = rightColX - envBoxPadding;
            const envBoxY = 15;

            // Add subtle box if modern style
            if (isModern) {
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(envBoxX, envBoxY, envBoxWidth, envBoxHeight, 2, 2, 'F');
            }

            doc.setFontSize(baseFontSize - 2); // Slightly smaller font for environment details
            doc.setTextColor(textColor);
            
            // Compact environment details
            doc.text(`Users: ${envDetails.users}`, rightColX, 25);
            doc.text(`Devices: ${envDetails.devices}`, rightColX, 32);
            doc.text(`Emails: ${envDetails.emails}`, rightColX, 39);
            doc.text(`Server: ${envDetails.server}`, rightColX, 46);
            doc.text(`MSP Hrs: ${envDetails.msp}`, rightColX, 53);

            // Selected Plan
            doc.setFontSize(baseFontSize + 4);
            if (isModern) {
                doc.setTextColor(primaryColor);
            }
            doc.text(`Selected Plan: ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`, 20, leftColY);
            
            leftColY += baseFontSize + lineSpacing;
            doc.setFontSize(baseFontSize);
            doc.setTextColor(textColor);
            doc.text('Included Features:', 20, leftColY);
            leftColY += baseFontSize + lineSpacing;

            // Base features
            const features = Array.from(document.querySelector(`#${selectedTier}`).closest('.tier-card')
                .querySelectorAll('.features li'))
                .map(li => li.textContent.trim());

            features.forEach(feature => {
                doc.text(`• ${feature}`, 25, leftColY);
                leftColY += baseFontSize + lineSpacing;
            });

            // Selected bolt-ons
            const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
                .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));

            if (selectedBoltOns.length > 0) {
                leftColY += lineSpacing;
                doc.setFontSize(baseFontSize);
                doc.setTextColor(textColor);
                doc.text('Selected Additional Security Features:', 20, leftColY);
                leftColY += baseFontSize + lineSpacing;

                const featureDescriptions = {
                    'soc': 'Security Operations Center (SOC) - 24/7 monitoring and response to security threats.',
                    'siem': 'Security Information and Event Management (SIEM) - Advanced log collection and analysis.',
                    'darkWeb': 'Dark Web Monitoring - Continuous monitoring of dark web for compromised credentials.',
                    'vulnScan': 'Vulnerability Scanning - Regular automated scans to identify vulnerabilities.',
                    'attackSim': 'Attack Simulation - Periodic phishing tests and security awareness training.',
                    'penTest': 'Penetration Testing - Quarterly external penetration tests.',
                    'mfa': 'Multi-Factor Authentication - Enhanced login security.',
                    'dnsFilter': 'DNS Filtering - Advanced web protection blocking malicious sites.'
                };

                selectedBoltOns.forEach(checkbox => {
                    const featureId = checkbox.value;
                    const description = featureDescriptions[featureId] || checkbox.parentElement.querySelector('label').textContent.trim();
                    const maxWidth = 160 * (12 / baseFontSize); // Adjust width based on font size
                    const lines = doc.splitTextToSize(description, maxWidth);
                    doc.text('•', 25, leftColY);
                    lines.forEach((line, index) => {
                        doc.text(line, 30, leftColY + (index * (baseFontSize * 0.8)));
                    });
                    leftColY += (lines.length * (baseFontSize * 0.8)) + lineSpacing;
                });
            }

            // Advanced security assessments
            const selectedAdvancedSecurity = Array.from(document.querySelectorAll('input[name="advanced_security"]:checked'))
                .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));

            if (selectedAdvancedSecurity.length > 0) {
                leftColY += lineSpacing;
                doc.setFontSize(baseFontSize);
                doc.setTextColor(textColor);
                doc.text('Selected Advanced Security Assessments:', 20, leftColY);
                leftColY += baseFontSize + lineSpacing;

                const assessmentDescriptions = {
                    'vulnScan': 'Comprehensive Vulnerability Assessment - Detailed system security scanning.',
                    'penTest': 'External Penetration Testing - Simulated cyber attacks to identify weaknesses.'
                };

                selectedAdvancedSecurity.forEach(checkbox => {
                    const assessmentId = checkbox.value;
                    const description = assessmentDescriptions[assessmentId] || checkbox.parentElement.querySelector('label').textContent.trim();
                    const maxWidth = 160 * (12 / baseFontSize);
                    const lines = doc.splitTextToSize(description, maxWidth);
                    doc.text('•', 25, leftColY);
                    lines.forEach((line, index) => {
                        doc.text(line, 30, leftColY + (index * (baseFontSize * 0.8)));
                    });
                    leftColY += (lines.length * (baseFontSize * 0.8)) + lineSpacing;
                });
            }

            // Add page break before pricing
            doc.addPage();

            // Continue with pricing breakdown...
            // ... rest of the existing code ...
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('There was an error generating the PDF. Please make sure all fields are filled out correctly.');
        }
    }

    // Add watermark helper method
    addWatermark(doc, logoImg) {
        if (logoImg) {
            try {
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.1 }));
                
                // Calculate dimensions while maintaining aspect ratio
                const maxWidth = 60;
                const maxHeight = 30;
                let width = maxWidth;
                let height = maxHeight;
                
                if (logoImg.naturalWidth && logoImg.naturalHeight) {
                    const ratio = Math.min(maxWidth / logoImg.naturalWidth, maxHeight / logoImg.naturalHeight);
                    width = logoImg.naturalWidth * ratio;
                    height = logoImg.naturalHeight * ratio;
                }
                
                doc.addImage(
                    logoImg, 
                    'PNG', 
                    doc.internal.pageSize.width / 2 - width / 2,
                    doc.internal.pageSize.height / 2 - height / 2,
                    width,
                    height
                );
                doc.restoreGraphicsState();
            } catch (error) {
                console.warn('Failed to add watermark:', error);
            }
        }
    }

    generateModernPDFContent(doc, logoImg) {
        try {
            // Set up document styling
            const colors = {
                primary: { r: 103, g: 199, b: 31 },  // Company green
                text: { r: 30, g: 41, b: 59 },      // #1e293b
                white: { r: 255, g: 255, b: 255 }
            };

            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const maxContentHeight = pageHeight - 40; // Leave margin at bottom
            let leftColY = 45;
            const rightColX = pageWidth - 65; // Position environment details closer to right margin

            // Helper functions for colors
            const setFillColor = (color) => {
                doc.setFillColor(color.r, color.g, color.b);
            };

            const setTextColor = (color) => {
                doc.setTextColor(color.r, color.g, color.b);
            };

            // Function to measure content height
            const measureContentHeight = (baseFontSize) => {
                let testY = 45; // Starting Y position after header

                // Base features height
                testY += 20; // Section header
                const features = Array.from(document.querySelector(`#${selectedTier}`).closest('.tier-card')
                    .querySelectorAll('.features li'))
                    .map(li => li.textContent.trim());
                testY += (features.length * (baseFontSize + (baseFontSize * 0.4)));

                // Selected bolt-ons height
                const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
                    .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));
                if (selectedBoltOns.length > 0) {
                    testY += 20; // Section header
                    selectedBoltOns.forEach(() => {
                        testY += (baseFontSize * 2 + (baseFontSize * 0.4));
                    });
                }

                // Advanced security height
                const selectedAdvancedSecurity = Array.from(document.querySelectorAll('input[name="advanced_security"]:checked'))
                    .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));
                if (selectedAdvancedSecurity.length > 0) {
                    testY += 20; // Section header
                    selectedAdvancedSecurity.forEach(() => {
                        testY += (baseFontSize * 2 + (baseFontSize * 0.4));
                    });
                }

                return testY;
            };

            // Find appropriate font size
            let baseFontSize = 12;
            let contentHeight = measureContentHeight(baseFontSize);
            while (contentHeight > maxContentHeight && baseFontSize > 8) {
                baseFontSize -= 0.5;
                contentHeight = measureContentHeight(baseFontSize);
            }

            // Now render with calculated font size
            const lineSpacing = baseFontSize * 0.4;

            // Add header
            setTextColor(colors.primary);
            doc.setFontSize(24);
            doc.text('IP Solutions Security Quote', 20, 25);

            // Date
            setTextColor(colors.text);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

            // Environment Details - Compact format in top right
            const envDetails = {
                users: document.getElementById('users').value,
                devices: document.getElementById('devices').value,
                emails: document.getElementById('emails').value,
                server: document.getElementById('server').checked ? 'Yes' : 'No',
                msp: document.getElementById('includeMsp').checked ? document.getElementById('mspHours').value : 'None'
            };

            // Draw a light box around environment details
            const envBoxPadding = 5;
            const envBoxWidth = 80;
            const envBoxHeight = 50;
            const envBoxX = rightColX - envBoxPadding;
            const envBoxY = 15;

            // Add subtle box with modern styling
            setFillColor({ r: 245, g: 245, b: 245 });
            doc.roundedRect(envBoxX, envBoxY, envBoxWidth, envBoxHeight, 2, 2, 'F');

            // Add environment details
            doc.setFontSize(baseFontSize - 2);
            setTextColor(colors.text);
            doc.text(`Users: ${envDetails.users}`, rightColX, 25);
            doc.text(`Devices: ${envDetails.devices}`, rightColX, 32);
            doc.text(`Emails: ${envDetails.emails}`, rightColX, 39);
            doc.text(`Server: ${envDetails.server}`, rightColX, 46);
            doc.text(`MSP Hrs: ${envDetails.msp}`, rightColX, 53);

            // Selected Plan
            setTextColor(colors.primary);
            doc.setFontSize(baseFontSize + 4);
            doc.text(`Selected Plan: ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`, 20, leftColY);

            leftColY += baseFontSize + lineSpacing;
            doc.setFontSize(baseFontSize);
            setTextColor(colors.text);
            doc.text('Included Features:', 20, leftColY);
            leftColY += baseFontSize + lineSpacing;

            // Base features
            const features = Array.from(document.querySelector(`#${selectedTier}`).closest('.tier-card')
                .querySelectorAll('.features li'))
                .map(li => li.textContent.trim());

            features.forEach(feature => {
                doc.text(`• ${feature}`, 25, leftColY);
                leftColY += baseFontSize + lineSpacing;
            });

            // Selected bolt-ons
            const selectedBoltOns = Array.from(document.querySelectorAll('input[name="bolt_ons"]:checked'))
                .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));

            if (selectedBoltOns.length > 0) {
                leftColY += lineSpacing;
                setTextColor(colors.primary);
                doc.text('Selected Additional Security Features:', 20, leftColY);
                leftColY += baseFontSize + lineSpacing;

                const featureDescriptions = {
                    'soc': 'Security Operations Center (SOC) - 24/7 monitoring and response to security threats.',
                    'siem': 'Security Information and Event Management (SIEM) - Advanced log collection and analysis.',
                    'darkWeb': 'Dark Web Monitoring - Continuous monitoring of dark web for compromised credentials.',
                    'vulnScan': 'Vulnerability Scanning - Regular automated scans to identify vulnerabilities.',
                    'attackSim': 'Attack Simulation - Periodic phishing tests and security awareness training.',
                    'penTest': 'Penetration Testing - Quarterly external penetration tests.',
                    'mfa': 'Multi-Factor Authentication - Enhanced login security.',
                    'dnsFilter': 'DNS Filtering - Advanced web protection blocking malicious sites.'
                };

                setTextColor(colors.text);
                selectedBoltOns.forEach(checkbox => {
                    const featureId = checkbox.value;
                    const description = featureDescriptions[featureId] || checkbox.parentElement.querySelector('label').textContent.trim();
                    const maxWidth = 160 * (12 / baseFontSize);
                    const lines = doc.splitTextToSize(description, maxWidth);
                    doc.text('•', 25, leftColY);
                    lines.forEach((line, index) => {
                        doc.text(line, 30, leftColY + (index * (baseFontSize * 0.8)));
                    });
                    leftColY += (lines.length * (baseFontSize * 0.8)) + lineSpacing;
                });
            }

            // Advanced security assessments
            const selectedAdvancedSecurity = Array.from(document.querySelectorAll('input[name="advanced_security"]:checked'))
                .filter(checkbox => !this.includedFeatures[selectedTier].includes(checkbox.value));

            if (selectedAdvancedSecurity.length > 0) {
                leftColY += lineSpacing;
                setTextColor(colors.primary);
                doc.text('Selected Advanced Security Assessments:', 20, leftColY);
                leftColY += baseFontSize + lineSpacing;

                const assessmentDescriptions = {
                    'vulnScan': 'Comprehensive Vulnerability Assessment - Detailed system security scanning.',
                    'penTest': 'External Penetration Testing - Simulated cyber attacks to identify weaknesses.'
                };

                setTextColor(colors.text);
                selectedAdvancedSecurity.forEach(checkbox => {
                    const assessmentId = checkbox.value;
                    const description = assessmentDescriptions[assessmentId] || checkbox.parentElement.querySelector('label').textContent.trim();
                    const maxWidth = 160 * (12 / baseFontSize);
                    const lines = doc.splitTextToSize(description, maxWidth);
                    doc.text('•', 25, leftColY);
                    lines.forEach((line, index) => {
                        doc.text(line, 30, leftColY + (index * (baseFontSize * 0.8)));
                    });
                    leftColY += (lines.length * (baseFontSize * 0.8)) + lineSpacing;
                });
            }

            // Add page break before pricing
            doc.addPage();

            // Continue with pricing breakdown...
            // ... rest of the existing code ...
        } catch (error) {
            console.error('Error generating modern PDF:', error);
            alert('There was an error generating the PDF. Please make sure all fields are filled out correctly.');
        }
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new PricingCalculator();
    
    document.getElementById('exportPdf').addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        try {
            // Get logo as data URL
            const img = document.querySelector('.logo');
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const logoDataUrl = canvas.toDataURL('image/png');
            
            calculator.generatePDFContent(doc, logoDataUrl, false);
        } catch (error) {
            console.error('Error with logo:', error);
            calculator.generatePDFContent(doc, null, false);
        }
    });

    document.getElementById('exportModernPdf').addEventListener('click', async () => {
        try {
            // Create a promise to load the image
            const loadImage = () => {
                return new Promise((resolve, reject) => {
                    // First try to get the image from the page
                    const existingImg = document.querySelector('.logo');
                    if (existingImg && existingImg.complete) {
                        resolve(existingImg);
                        return;
                    }

                    // If that doesn't work, try loading it fresh
                    const img = new Image();
                    img.crossOrigin = "anonymous"; // Try with CORS
                    img.onload = () => {
                        resolve(img);
                    };
                    img.onerror = () => {
                        console.warn('Failed to load logo, continuing without it');
                        resolve(null);
                    };
                    // Try loading with timestamp to avoid caching
                    img.src = './IPSLogo.png?' + new Date().getTime();
                });
            };

            // Wait for image to load before generating PDF
            const logoImg = await loadImage();
            
            // Create a new document for the modern quote
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Generate PDF with the image object directly
            calculator.generateModernPDFContent(doc, logoImg);
        } catch (error) {
            console.error('Error generating modern PDF:', error);
            // Try to generate PDF without logo if there's an error
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            calculator.generateModernPDFContent(doc, null);
        }
    });
});