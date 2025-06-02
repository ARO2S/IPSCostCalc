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
            let leftColY = 20;
            let rightColY = 20;
            const rightColX = 120;
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
                    // Add logo if we have the data URL
                    if (logoDataUrl) {
                        const imgWidth = 40;
                        const imgHeight = 20;
                        doc.addImage(logoDataUrl, 'PNG', 20, 10, imgWidth, imgHeight);
                    }
                } catch (error) {
                    console.error('Error adding logo:', error);
                }
                
                // Header
                doc.setFontSize(24);
                doc.setTextColor(textColor);
                if (isModern) {
                    doc.setTextColor(primaryColor);
                }
                doc.text('IP Solutions Security Quote', 70, 25);
                
                // Date
                doc.setFontSize(10);
                doc.setTextColor(textColor);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
            };

            // Add first page header
            addHeader();

            // Environment Details
            doc.setFontSize(16);
            if (isModern) {
                doc.setTextColor(primaryColor);
            }
            doc.text('Environment Details', rightColX, 45);
            doc.setFontSize(12);
            doc.setTextColor(textColor);
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

            // Selected Plan
            leftColY = 45;
            doc.setFontSize(16);
            if (isModern) {
                doc.setTextColor(primaryColor);
            }
            doc.text(`Selected Plan: ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`, 20, leftColY);
            
            leftColY += 10;
            doc.setFontSize(12);
            doc.setTextColor(textColor);
            doc.text('Included Features:', 20, leftColY);
            leftColY += 7;

            // Get features based on tier
            const features = Array.from(document.querySelector(`#${selectedTier}`).closest('.tier-card')
                .querySelectorAll('.features li'))
                .map(li => li.textContent.trim());

            features.forEach(feature => {
                doc.text(`• ${feature}`, 25, leftColY);
                leftColY += 7;
            });

            // Pricing Breakdown
            const startY = Math.max(leftColY, rightColY) + 10;
            doc.setFontSize(16);
            if (isModern) {
                doc.setTextColor(primaryColor);
            }
            doc.text('Pricing Breakdown', 20, startY);
            doc.setFontSize(12);
            doc.setTextColor(textColor);
            let currentY = startY + 8;

            const breakdown = document.getElementById('breakdown')?.innerText;
            if (breakdown) {
                const breakdownLines = breakdown.split('\n');
                breakdownLines.forEach(line => {
                    doc.text(line, 20, currentY);
                    currentY += 7;
                });
            }

            // Total with box
            const totalAmount = document.querySelector('#total .total-box h3')?.textContent.match(/\$[\d,]+\.\d{2}/)?.[0];
            if (totalAmount) {
                currentY += 3;
                doc.setFontSize(14);
                
                const totalText = `Monthly Total: ${totalAmount}`;
                const textWidth = doc.getStringUnitWidth(totalText) * 14 / doc.internal.scaleFactor;
                const padding = 5;
                
                if (isModern) {
                    // Modern total box with gradient-like effect
                    doc.setFillColor(primaryColor);
                    doc.setTextColor('#ffffff');
                    doc.roundedRect(20 - padding, currentY - 7, textWidth + (padding * 2), 14, 3, 3, 'F');
                } else {
                    doc.rect(20 - padding, currentY - 7, textWidth + (padding * 2), 14);
                }
                
                doc.text(totalText, 20, currentY);
                currentY += 7;
            }

            // MSP Hours Disclaimer
            if (document.getElementById('includeMsp').checked) {
                currentY += 5;
                doc.setFontSize(12);
                doc.setTextColor(textColor);
                const note = 'Any additional hours generated through support tickets will be billed at the discounted rate of $120/hour.';
                
                const splitNote = doc.splitTextToSize(note, 170);
                splitNote.forEach(line => {
                    doc.text(line, 20, currentY);
                    currentY += 5;
                });
            }

            // Footer
            doc.setFontSize(10);
            if (isModern) {
                doc.setTextColor(secondaryColor);
            }
            doc.text('For questions or to proceed with this quote, please contact IP Solutions.', 105, 270, { align: 'center' });
            doc.text('Call (574) 259-6000 or email sales@phonedatasupport.net', 105, 277, { align: 'center' });

            // Save the PDF with appropriate name
            const filename = isModern ? 'IP_Solutions_Security_Quote_Modern.pdf' : 'IP_Solutions_Security_Quote.pdf';
            doc.save(filename);
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
            // Set up document styling with simpler color handling
            const colors = {
                primary: [103, 199, 31],  // Company green
                text: [30, 41, 59],      // #1e293b
                white: [255, 255, 255]
            };

            // Helper function to create section headers
            const addSectionHeader = (text, y) => {
                doc.setFillColor(...colors.primary);
                doc.rect(0, y - 15, doc.internal.pageSize.width, 2, 'F');
                doc.setTextColor(...colors.text);
                doc.setFontSize(18);
                doc.text(text, 20, y);
            };

            // Cover Page
            if (logoImg) {
                try {
                    // Make the logo larger on the cover page
                    const maxWidth = 100;  // Increased from 60
                    const maxHeight = 50;  // Increased from 30
                    let width = maxWidth;
                    let height = maxHeight;
                    
                    if (logoImg.naturalWidth && logoImg.naturalHeight) {
                        const ratio = Math.min(maxWidth / logoImg.naturalWidth, maxHeight / logoImg.naturalHeight);
                        width = logoImg.naturalWidth * ratio;
                        height = logoImg.naturalHeight * ratio;
                    }
                    
                    // Position logo higher on the page
                    doc.addImage(
                        logoImg,
                        'PNG',
                        doc.internal.pageSize.width / 2 - width / 2,
                        20,  // Moved up more
                        width,
                        height
                    );
                } catch (error) {
                    console.warn('Failed to add logo:', error);
                }
            }

            // Company name moved down slightly
            doc.setTextColor(...colors.primary);
            doc.setFontSize(28);
            doc.text('IP Solutions, Inc.', doc.internal.pageSize.width / 2, 85, { align: 'center' });

            // Cover page text adjusted down slightly
            doc.setTextColor(...colors.text);
            doc.setFontSize(36);
            doc.text('Managed Security Services', doc.internal.pageSize.width / 2, 115, { align: 'center' });
            doc.setFontSize(24);
            doc.text('Planning Document', doc.internal.pageSize.width / 2, 135, { align: 'center' });
            doc.setFontSize(14);
            doc.text(new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }), doc.internal.pageSize.width / 2, 155, { align: 'center' });

            // Add tagline
            doc.setFontSize(20);
            doc.text('Secure. Monitor. Respond.', doc.internal.pageSize.width / 2, 185, { align: 'center' });

            // Executive Summary Page
            doc.addPage();
            addSectionHeader('Executive Summary', 30);

            // Get form values
            const users = document.getElementById('users').value;
            const devices = document.getElementById('devices').value;
            const emails = document.getElementById('emails').value;
            const server = document.getElementById('server').checked;
            const mspHours = document.getElementById('includeMsp').checked ? 
                document.getElementById('mspHours').value : 'None';

            // Metrics box
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(20, 70, 170, 70, 3, 3, 'F');
            doc.setFontSize(12);
            doc.setTextColor(...colors.text);

            const metrics = [
                { label: 'Users', value: users },
                { label: 'Devices', value: devices },
                { label: 'Emails', value: emails },
                { label: 'Server Protection', value: server ? 'Yes' : 'No' },
                { label: 'MSP Hours', value: mspHours }
            ];

            let yPos = 85;
            metrics.forEach(metric => {
                doc.text(`${metric.label}: ${metric.value}`, 30, yPos);
                yPos += 10;
            });

            // Add MSP Hours explanation if included
            if (document.getElementById('includeMsp').checked) {
                yPos += 10;
                doc.setFontSize(11);
                const mspText = `Based on your organization size (${users} users, ${devices} devices), we've included ${mspHours} prepaid MSP hours per month. This allocation is designed to cover anticipated support tickets and routine technical requests from your team. Additional hours, if needed, will be billed at our standard rate of $${this.mspHourlyRate}/hour.`;
                const mspLines = doc.splitTextToSize(mspText, 160);
                doc.text(mspLines, 20, yPos);
                yPos += mspLines.length * 7;
            }

            // Features section adjusted down if MSP text was added
            yPos = Math.max(yPos + 20, 160);
            // ... rest of features section ...

            // Pricing table
            doc.addPage();
            addSectionHeader('Pricing Breakdown', 30);
            yPos = 60; // Increased from 50 for more margin at top

            // Table header with more margin on sides
            doc.setFillColor(...colors.primary);
            doc.rect(30, yPos, 150, 10, 'F'); // Adjusted width and position
            doc.setFontSize(11);
            doc.setTextColor(...colors.white);
            doc.text('Item', 35, yPos + 7); // Adjusted x position
            doc.text('Details', 85, yPos + 7); // Adjusted x position
            doc.text('Monthly Cost', 155, yPos + 7); // Adjusted x position

            yPos += 15;
            let total = 0;
            pricingItems.forEach((item, index) => {
                // Calculate height needed for description
                const descLines = doc.splitTextToSize(item.desc, 80); // Slightly narrower for margin
                const itemHeight = Math.max(descLines.length * 5 + 8, 10);

                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(30, yPos - 5, 150, itemHeight, 'F'); // Adjusted width and position
                }

                doc.setTextColor(...colors.text);
                // Item name
                doc.setFontSize(11);
                doc.text(item.name, 35, yPos); // Adjusted x position
                
                // Calculation and description
                doc.setFontSize(10);
                doc.text(item.calc, 85, yPos); // Adjusted x position
                doc.setFontSize(9);
                doc.text(descLines, 85, yPos + 5); // Adjusted x position

                // Cost
                doc.setFontSize(11);
                doc.text(`$${item.cost.toFixed(2)}`, 155, yPos); // Adjusted x position

                total += item.cost;
                yPos += itemHeight + 2;
            });

            // Total row with adjusted margins
            doc.setFillColor(...colors.primary);
            doc.rect(30, yPos, 150, 12, 'F'); // Adjusted width and position
            doc.setTextColor(...colors.white);
            doc.setFontSize(12);
            doc.text('Monthly Total:', 35, yPos + 8); // Adjusted x position
            doc.text(`$${total.toFixed(2)}`, 155, yPos + 8); // Adjusted x position

            // Contact Information
            doc.addPage();
            addSectionHeader('Contact Information', 30);
            doc.setTextColor(...colors.text);
            doc.setFontSize(12);
            doc.text([
                'For questions or to proceed with this quote, please contact:',
                '',
                'IP Solutions',
                'Phone: (574) 259-6000',
                'Email: sales@phonedatasupport.net',
                '',
                'This quote is valid for 30 days. Taxes not included.',
                'Subject to MSP master service agreement.'
            ], 20, 50);

            // Save the PDF
            doc.save('IP_Solutions_Security_Quote_Modern.pdf');
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        try {
            // Create a promise to load the image
            const loadImage = () => {
                return new Promise((resolve, reject) => {
                    // First try to get the image from the page
                    const existingImg = document.querySelector('.logo');
                    if (existingImg && existingImg.complete) {
                        // For local development, just use the image directly
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
            
            // Generate PDF with the image object directly
            calculator.generateModernPDFContent(doc, logoImg);
        } catch (error) {
            console.error('Error generating modern PDF:', error);
            // Try to generate PDF without logo if there's an error
            calculator.generateModernPDFContent(doc, null);
        }
    });
});