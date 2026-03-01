from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import os
from textwrap import wrap
import time

class ReportGenerator:
    def __init__(self, filename="vulnerability_report.pdf"):
        self.filename = filename
        self.styles = getSampleStyleSheet()
        self.story = []
        
        # Add Custom Title
        self.story.append(Paragraph("<b><font size=18>Vulnerability Scan Report</font></b>", self.styles["Title"]))
        self.story.append(Paragraph(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}", self.styles["Normal"]))
        self.story.append(Spacer(1, 20))

    def add_section(self, title, content):
        """
        Add a neatly formatted section to the PDF.
        - dict => table
        - list => bullet points
        - str  => paragraph
        """
        # Section header
        self.story.append(Paragraph(f"<b><font size=14 color='#003366'>{title}</font></b>", self.styles["Heading2"]))
        self.story.append(Spacer(1, 10))

        if not content:
            self.story.append(Paragraph("No data available for this section.", self.styles["Normal"]))
            self.story.append(Spacer(1, 20))
            return

        if isinstance(content, dict):
            # Use Paragraphs instead of Table to avoid layout crashes with large data
            for k, v in content.items():
                if isinstance(v, (list, dict)):
                    v = str(v)
                
                # Sanitize text
                v = str(v).replace('<', '&lt;').replace('>', '&gt;')
                k = str(k).replace('<', '&lt;').replace('>', '&gt;')
                
                # Header for Item
                self.story.append(Paragraph(f"<b>{k}:</b>", self.styles["Heading4"]))
                # Content
                # Limit content length to prevent insane memory usage on huge outputs
                if len(v) > 5000:
                    v = v[:5000] + "... (truncated)"
                
                self.story.append(Paragraph(v, self.styles["Normal"]))
                self.story.append(Spacer(1, 8))

        elif isinstance(content, list):
            # Bullet points for lists
            for item in content:
                text = str(item)
                if isinstance(item, dict):
                    text = ", ".join([f"{k}: {v}" for k,v in item.items()])
                
                text = text.replace('<', '&lt;').replace('>', '&gt;')
                self.story.append(Paragraph(f"• {text}", self.styles["Normal"]))
                self.story.append(Spacer(1, 4))

        else:
            # Paragraph for plain strings
            self.story.append(Paragraph(str(content), self.styles["Normal"]))

        self.story.append(Spacer(1, 20))

    def add_cve_section(self, title, vuln_data):
        """
        Formatted CVE listing as a Table with Colors.
        """
        self.story.append(Paragraph(f"<b><font size=14 color='#8B0000'>{title}</font></b>", self.styles["Heading2"]))
        self.story.append(Spacer(1, 10))
        
        if not vuln_data:
             self.story.append(Paragraph("No vulnerabilities found or CVE scan failed.", self.styles["Normal"]))
             return

        # Sort Logic: Critical > High > Medium > Low > others
        severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Informational": 4, "Unknown": 5}
        
        # Sort data
        vuln_data.sort(key=lambda x: severity_order.get(x.get("severity", "Unknown"), 5))

        # Table Header
        data = [["ID", "Severity", "CVSS", "Description"]]
        
        # Row Colors
        row_colors = []
        
        for vuln in vuln_data:
            cve_id = vuln.get('id', 'N/A')
            # Normalize severity to Title Case (CRITICAL -> Critical)
            severity_raw = vuln.get('severity', 'Unknown')
            severity = str(severity_raw).capitalize()
            
            cvss = str(vuln.get('cvss_score', 'N/A'))
            # Wrap description to fit in table
            desc = "\n".join(wrap(vuln.get('description', 'No description available.'), 60))
            
            data.append([cve_id, severity, cvss, desc])
            
            # Determine color
            if severity == "Critical":
                row_colors.append(colors.red)
            elif severity == "High":
                row_colors.append(colors.HexColor("#FF7F7F")) # Light Red
            elif severity == "Medium":
                row_colors.append(colors.yellow)
            elif severity == "Low":
                row_colors.append(colors.green)
            else:
                row_colors.append(colors.white)

        # Create Table
        # Widths: ID=80, Sev=60, CVSS=40, Desc=320
        table = Table(data, colWidths=[90, 70, 40, 300], repeatRows=1)
        
        # Base Style
        style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#333333")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]

        # Apply row colors
        for i, color in enumerate(row_colors):
            text_color = colors.black
            if color in [colors.red, colors.blue]: # Dark backgrounds
                text_color = colors.white
                
            style.append(('BACKGROUND', (0, i+1), (-1, i+1), color))
            style.append(('TEXTCOLOR', (0, i+1), (-1, i+1), text_color))

        table.setStyle(TableStyle(style))
        self.story.append(table)
        self.story.append(Spacer(1, 20))

    def add_severity_summary(self, vulnerabilities):
        """
        Adds a color-coded summary table of vulnerabilities at the end.
        """
        self.story.append(PageBreak())
        self.story.append(Paragraph("<b><font size=16 color='#003366'>Severity Summary</font></b>", self.styles["Heading2"]))
        self.story.append(Spacer(1, 10))

        if not vulnerabilities:
            self.story.append(Paragraph("No vulnerabilities detected.", self.styles["Normal"]))
            return

        # Explicitly define counts
        counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0, "Unknown": 0}
        for v in vulnerabilities:
            sev = v.get("severity", "Unknown")
            if sev in counts:
                counts[sev] += 1
            else:
                counts["Unknown"] += 1
        
        # Create Table Data
        data = [["Severity Level", "Count", "Status"]]
        
        # Color mapping
        colors_map = {
            "Critical": colors.red,
            "High": colors.orange,
            "Medium": colors.yellow,
            "Low": colors.green,
            "Informational": colors.blue,
            "Unknown": colors.grey
        }

        for level in ["Critical", "High", "Medium", "Low", "Informational", "Unknown"]:
            count = counts[level]
            if count > 0:
                data.append([level, str(count), "DETECTED" if count > 0 else "CLEAN"])

        table = Table(data, colWidths=[150, 100, 150])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.black),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ]))
        
        # Apply row colors based on severity
        row_idx = 1
        for level in ["Critical", "High", "Medium", "Low", "Informational", "Unknown"]:
            if counts[level] > 0:
                bg_color = colors_map.get(level, colors.white)
                # Apply background color to the ENTIRE ROW
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, row_idx), (-1, row_idx), bg_color),
                    ('TEXTCOLOR', (0, row_idx), (-1, row_idx), colors.black if level in ["Medium", "Low", "Unknown"] else colors.white)
                ]))
                row_idx += 1

        self.story.append(table)

    def add_image(self, image_path, caption="Network Map"):
        """
        Add an image (network graph) to the PDF.
        """
        if image_path and os.path.exists(image_path):
            self.story.append(PageBreak())
            try:
                img = Image(image_path, width=450, height=300)
                self.story.append(img)
                self.story.append(Spacer(1, 10))
                self.story.append(Paragraph(f"<i>{caption}</i>", self.styles["Italic"]))
                self.story.append(Spacer(1, 20))
            except Exception as e:
                self.story.append(Paragraph(f"[Error embedding image: {e}]", self.styles["Normal"]))

    def build(self):
        try:
            doc = SimpleDocTemplate(self.filename, pagesize=letter)
            doc.build(self.story)
            print(f"[+] Clean PDF report generated: {self.filename}")
            return True
        except Exception as e:
            print(f"[!] Report generation failed: {e}")
            return False
