from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def create_dummy_resume(path):
    c = canvas.Canvas(path, pagesize=letter)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(100, 750, "John Doe")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 730, "Software Engineer")
    c.drawString(100, 715, "Email: john.doe@example.com | Phone: +1 555-0100")
    c.drawString(100, 700, "LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe")
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 670, "Summary")
    c.setFont("Helvetica", 12)
    c.drawString(100, 655, "Experienced software engineer with 5 years of experience in full-stack development.")
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 620, "Skills")
    c.setFont("Helvetica", 12)
    c.drawString(100, 605, "JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, AWS, Docker")
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 570, "Experience")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 555, "Senior Developer at Tech Corp (2020 - Present)")
    c.setFont("Helvetica", 12)
    c.drawString(100, 540, "Developed scalable microservices using Node.js and AWS.")
    
    c.showPage()
    c.save()

if __name__ == "__main__":
    resume_path = os.path.abspath("test_resume.pdf")
    create_dummy_resume(resume_path)
    print(f"Dummy resume created at: {resume_path}")
