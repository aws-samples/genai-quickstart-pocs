"""
PDF Generator for Insurance Claim Forms
"""
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import os
from .claim_system import ClaimForm

class ClaimFormPDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        self.section_style = ParagraphStyle(
            'SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
    
    def generate_claim_pdf(self, claim: ClaimForm, output_dir: str = "generated_claims") -> str:
        """Generate a PDF for the insurance claim form"""
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"insurance_claim_{claim.claim_id[:8]}_{timestamp}.pdf"
        filepath = os.path.join(output_dir, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(filepath, pagesize=letter,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Build the content
        story = []
        
        # Title
        story.append(Paragraph("AUTOMOBILE INSURANCE CLAIM FORM", self.title_style))
        story.append(Spacer(1, 20))
        
        # Claim Information Section
        story.append(Paragraph("CLAIM INFORMATION", self.section_style))
        claim_info_data = [
            ["Claim ID:", claim.claim_id],
            ["Date Filed:", claim.created_date.strftime("%B %d, %Y")],
            ["Status:", claim.status],
            ["Policy ID:", claim.policy_holder.policy_id]
        ]
        claim_table = Table(claim_info_data, colWidths=[2*inch, 4*inch])
        claim_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(claim_table)
        story.append(Spacer(1, 20))
        
        # Policy Holder Information
        story.append(Paragraph("POLICY HOLDER INFORMATION", self.section_style))
        holder_data = [
            ["Name:", claim.policy_holder.name],
            ["Phone:", claim.policy_holder.phone],
            ["Email:", claim.policy_holder.email],
            ["Address:", claim.policy_holder.address],
            ["Driver's License:", claim.policy_holder.drivers_license or "Not provided"]
        ]
        holder_table = Table(holder_data, colWidths=[2*inch, 4*inch])
        holder_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(holder_table)
        story.append(Spacer(1, 20))
        
        # Vehicle Information
        story.append(Paragraph("VEHICLE INFORMATION", self.section_style))
        vehicle_data = [
            ["Make:", claim.vehicle.make],
            ["Model:", claim.vehicle.model],
            ["Year:", str(claim.vehicle.year)],
            ["Color:", claim.vehicle.color],
            ["License Plate:", claim.vehicle.license_plate],
            ["VIN:", claim.vehicle.vin or "Not provided"]
        ]
        vehicle_table = Table(vehicle_data, colWidths=[2*inch, 4*inch])
        vehicle_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(vehicle_table)
        story.append(Spacer(1, 20))
        
        # Accident Details
        story.append(Paragraph("ACCIDENT DETAILS", self.section_style))
        accident_data = [
            ["Date of Accident:", claim.accident_details.accident_date.strftime("%B %d, %Y")],
            ["Time of Accident:", claim.accident_details.accident_time],
            ["Location:", claim.accident_details.location],
            ["Accident Type:", claim.accident_details.accident_type.value],
            ["Police Report #:", claim.accident_details.police_report_number or "Not provided"]
        ]
        accident_table = Table(accident_data, colWidths=[2*inch, 4*inch])
        accident_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(accident_table)
        story.append(Spacer(1, 15))
        
        # Accident Description
        story.append(Paragraph("<b>Description of Accident:</b>", self.styles['Normal']))
        story.append(Spacer(1, 6))
        story.append(Paragraph(claim.accident_details.description, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Other Party Information (if provided)
        if claim.accident_details.other_party_info:
            story.append(Paragraph("<b>Other Party Information:</b>", self.styles['Normal']))
            story.append(Spacer(1, 6))
            story.append(Paragraph(claim.accident_details.other_party_info, self.styles['Normal']))
            story.append(Spacer(1, 15))
        
        # Witnesses (if provided)
        if claim.accident_details.witnesses:
            story.append(Paragraph("<b>Witnesses:</b>", self.styles['Normal']))
            story.append(Spacer(1, 6))
            story.append(Paragraph(claim.accident_details.witnesses, self.styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Damage Assessment
        story.append(Paragraph("DAMAGE ASSESSMENT", self.section_style))
        damage_data = [
            ["Damage Level:", claim.damage_level.value],
            ["Estimated Cost:", f"${claim.estimated_damage_cost:,.2f}" if claim.estimated_damage_cost > 0 else "To be determined"]
        ]
        damage_table = Table(damage_data, colWidths=[2*inch, 4*inch])
        damage_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(damage_table)
        story.append(Spacer(1, 30))
        
        # Footer
        story.append(Paragraph("This claim form was generated electronically and is valid without signature.", 
                             self.styles['Normal']))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", 
                             self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        return filepath
