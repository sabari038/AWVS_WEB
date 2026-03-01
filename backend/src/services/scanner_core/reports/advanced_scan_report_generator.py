from textwrap import wrap
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT


class AdvancedScanReportGenerator:
    def __init__(self, filename):
        self.filename = filename
        self.elements = []
        self.styles = getSampleStyleSheet()
        self.title_style = self.styles["Heading1"]
        self.subtitle_style = self.styles["Heading2"]
        self.normal_style = ParagraphStyle(
            'NormalCustom',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            alignment=TA_LEFT
        )

    def _get_value(self, item, *keys, default="N/A"):
        """Return first found key variant from item dict."""
        for k in keys:
            if isinstance(item, dict) and k in item and item[k] not in (None, ""):
                return item[k]
        return default

    def add_section(self, title, content):
        self.elements.append(Paragraph(f"<b>{title}</b>", self.subtitle_style))
        self.elements.append(Spacer(1, 8))

        if isinstance(content, dict):
            data = [["Key", "Value"]]
            for k, v in content.items():
                v_str = str(v)
                if len(v_str) > 2000:
                    v_str = v_str[:2000] + "... [TRUNCATED FOR PDF]"
                wrapped_text = "<br/>".join(wrap(v_str, 100))
                data.append([str(k), Paragraph(wrapped_text, self.normal_style)])
            table = Table(data, colWidths=[2.2 * inch, 4.5 * inch])

        elif isinstance(content, list):
            if not content:
                data = [["Info"], ["No data available"]]
                table = Table(data, colWidths=[6.8 * inch])
            elif all(isinstance(i, dict) for i in content):
                headers = list(content[0].keys())
                data = [headers]
                for row in content:
                    row_data = []
                    for h in headers:
                        val = str(row.get(h, ""))
                        if len(val) > 1000: val = val[:1000] + "..."
                        row_data.append(Paragraph("<br/>".join(wrap(val, 50)), self.normal_style))
                    data.append(row_data)
                col_width = 7.2 / len(headers)
                table = Table(data, colWidths=[col_width * inch] * len(headers))
            else:
                data = [["Value"]]
                for item in content:
                    v_str = str(item)
                    if len(v_str) > 2000: v_str = v_str[:2000] + "..."
                    wrapped = "<br/>".join(wrap(v_str, 100))
                    data.append([Paragraph(wrapped, self.normal_style)])
                table = Table(data, colWidths=[6.8 * inch])
        else:
            v_str = str(content)
            if len(v_str) > 2000: v_str = v_str[:2000] + "..."
            data = [["Value"], [Paragraph("<br/>".join(wrap(v_str, 100)), self.normal_style)]]
            table = Table(data, colWidths=[6.8 * inch])

        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4CAF50")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))

        self.elements.append(table)
        self.elements.append(Spacer(1, 16))

    def add_cve_section(self, title, cve_data):
        self.elements.append(PageBreak())
        self.elements.append(Paragraph(f"<b>{title}</b>", self.subtitle_style))
        self.elements.append(Spacer(1, 8))

        if not cve_data:
            self.elements.append(Paragraph("No CVE data found.", self.normal_style))
            return

        data = [["CVE ID", "Description", "CVSS Score", "Severity", "Published"]]

        for item in cve_data:
            # Get raw values from data
            cve_id = self._get_value(item, "id", "CVE ID", "cve_id", default="N/A")
            desc = self._get_value(item, "description", "Description", default="N/A")
            score = self._get_value(item, "cvss_score", "CVSS Score", "score", default="N/A")
            severity = self._get_value(item, "severity", "Severity", default="Unknown")
            published = self._get_value(item, "published", "Published", default="N/A")

            # 🔹 Dynamically determine severity based on CVSS score
            if severity in ("Unknown", "N/A") and str(score).replace('.', '', 1).isdigit():
                score_val = float(score)
                if score_val >= 9.0:
                    severity = "Critical"
                elif score_val >= 7.0:
                    severity = "High"
                elif score_val >= 4.0:
                    severity = "Medium"
                elif score_val > 0.0:
                    severity = "Low"
                else:
                    severity = "Informational"

            wrapped_desc = "<br/>".join(wrap(str(desc), 85))
            data.append([
                Paragraph(str(cve_id), self.normal_style),
                Paragraph(wrapped_desc, self.normal_style),
                Paragraph(str(score), self.normal_style),
                Paragraph(str(severity), self.normal_style),
                Paragraph(str(published), self.normal_style)
            ])

        table = Table(data, colWidths=[1.1 * inch, 3.6 * inch, 0.8 * inch, 0.9 * inch, 1.1 * inch])

        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4CAF50")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ])

        # 🔹 Severity-based row color mapping
        color_map = {
            "CRITICAL": colors.HexColor("#FF0000"),
            "HIGH": colors.HexColor("#FF6666"),
            "MEDIUM": colors.HexColor("#FFD580"),
            "LOW": colors.HexColor("#A8E6A1"),
            "INFORMATIONAL": colors.HexColor("#B0E0E6"),
            "UNKNOWN": colors.whitesmoke,
        }

        for i, item in enumerate(data[1:], start=1):  # Skip header
            sev_text = str(item[3].getPlainText()).upper()
            bg = color_map.get(sev_text, colors.whitesmoke)
            style.add('BACKGROUND', (0, i), (-1, i), bg)

        table.setStyle(style)
        self.elements.append(table)
        self.elements.append(Spacer(1, 16))

    def add_image(self, image_path, caption):
        try:
            self.elements.append(PageBreak())
            self.elements.append(Paragraph(f"<b>{caption}</b>", self.subtitle_style))
            self.elements.append(Spacer(1, 12))
            img = Image(image_path, width=6 * inch, height=4 * inch)
            self.elements.append(img)
            self.elements.append(Spacer(1, 12))
        except Exception as e:
            self.elements.append(Paragraph(f"Error loading image: {e}", self.normal_style))

    def build(self):
        doc = SimpleDocTemplate(
            self.filename,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=50,
            bottomMargin=40
        )
        self.elements.insert(0, Paragraph("CYBERSEC ADVANCED VULNERABILITY REPORT", self.title_style))
        self.elements.insert(1, Spacer(1, 20))
        doc.build(self.elements)
