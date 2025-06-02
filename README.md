# IP Solutions Security Services Calculator

A dynamic web-based calculator for generating security service quotes. This tool helps calculate and present pricing for different security tiers and add-on services.

## Features

### Security Tiers
- **Silver Tier** ($25/seat)
  - Endpoint Protection
  - Daily/Weekly Device Updates
  - Remote Monitoring and Management
  - 2 Hours Fixed Labor Monthly
  - 1 Bolt-on Option

- **Gold Tier** ($35/seat)
  - All Silver features
  - Security Operations Center (SOC)
  - 2.5 Hours Fixed Labor Monthly
  - 3 Bolt-on Options
  - HIPAA Standard Compliant

- **Platinum Tier** ($45/seat)
  - All Gold features
  - Attack Simulation
  - 3 Hours Fixed Labor Monthly
  - 5 Bolt-on Options
  - Includes Advanced Security Assessment features

### Server Protection
- Base server protection includes 1 host and up to 2 VMs
- Optional backup storage tiers:
  - 300GB Storage: $100/month
  - 1TB Storage: $300/month
  - 15TB Storage: $450/month

### Additional Security Options (Bolt-ons)
- SIEM Integration
- Email Backup
- Attack Simulation
- DarkWeb Monitoring

### Advanced Security Assessment
- Vulnerability Scanning
  - Included in Platinum tier
  - $100/month additional cost for Silver/Gold tiers
- Penetration Testing
  - Included in Platinum tier
  - $100/month additional cost for Silver/Gold tiers

### MSP Support
- Optional prepaid MSP hours
- Automatic recommendation based on device count:
  - ≤25 devices: 2 hours
  - ≤50 devices: 4 hours
  - ≤100 devices: 6 hours
  - >100 devices: 8 hours
- Additional hours billed at $120/hour

### Volume Discounts
- 5% discount for 26-50 users
- 10% discount for 51+ users

### Quote Generation
- Detailed PDF quote generation
- For Silver tier: Single-page quote with all details
- For Gold/Platinum tiers: 
  - First page: Features and specifications
  - Second page: Complete pricing breakdown
- Includes:
  - IP Solutions branding
  - Environment details
  - Selected plan features
  - Fixed labor breakdown
  - Pricing itemization
  - Contact information

## Technical Details
- Pure JavaScript implementation
- No external dependencies for core functionality
- Uses jsPDF for PDF generation
- Responsive design for all screen sizes
- Modern UI with dynamic updates
- Real-time price calculations

## Recent Updates
1. Moved test version to production (index_test.html → index.html)
2. Added server backup storage options with tiered pricing
3. Separated Advanced Security Assessment options from regular bolt-ons
4. Updated PDF generation to use two-page layout for Gold/Platinum tiers
5. Removed visible pricing from Advanced Security Assessment options
6. Improved pricing breakdown display in PDF
7. Enhanced UI for server backup options
8. Updated pricing calculations to handle new features

## Contact
For questions or to proceed with a quote, please contact IP Solutions:
- Phone: (574) 259-6000
- Email: sales@phonedatasupport.net