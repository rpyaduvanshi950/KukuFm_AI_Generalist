"""Create only the new synthetic audit PDF; preserve historical fixtures."""
from pathlib import Path
from reportlab.pdfgen import canvas
root=Path('tests/fixtures/audit');root.mkdir(exist_ok=True)
pdf=canvas.Canvas(str(root/'two-pages.pdf'),invariant=1)
for page,amount in [(1,830),(2,380)]:
    pdf.setFont('Helvetica',12)
    pdf.drawString(40,780,'SYNTHETIC AUDIT RECORD - NOT A REAL CASE')
    pdf.drawString(40,750,f'Page {page}: Amount INR {amount}.')
    pdf.drawString(40,720,'This page is an extraction and consent test only.')
    pdf.showPage()
pdf.save()
