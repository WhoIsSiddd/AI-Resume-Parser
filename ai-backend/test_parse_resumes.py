import requests
import json
import os

url = 'http://127.0.0.1:8000/api/parse'
resumes = [
    'f:/project_6th_semester/DavidClarkResume.pdf',
    'f:/project_6th_semester/HarperGarciaResume.pdf',
    'f:/project_6th_semester/JamesJonesResume.pdf',
    'f:/project_6th_semester/MARCUS DELGADO.docx'
]

jd_data = json.dumps({
    'title': 'Data Analyst',
    'requiredSkills': ['Python', 'SQL', 'Data Science', 'Pandas', 'NumPy'],
    'preferredSkills': ['Tableau', 'Power BI'],
    'minExperience': 3,
    'educationRequirements': ['Bachelor'],
    'certifications': []
})

results_summary = []
for r in resumes:
    if not os.path.exists(r):
        print(f"Path does not exist: {r}")
        continue
    with open(r, 'rb') as f:
        resp = requests.post(url, files={'file': f}, data={'jd_data': jd_data})
        if resp.status_code == 200:
            res = resp.json()
            summary = {
                "file": os.path.basename(r),
                "name": res.get("name"),
                "experienceYears": res.get("experienceYears"),
                "skills": res.get("skills"),
                "atsScore": res.get("atsScore"),
                "atsBreakdown": res.get("atsBreakdown")
            }
            results_summary.append(summary)
            print(f"Parsed {os.path.basename(r)}: Name={summary['name']}, Score={summary['atsScore']}")
        else:
            print(f"Failed {os.path.basename(r)}: Status {resp.status_code}")

with open("parse_summary.json", "w") as f:
    json.dump(results_summary, f, indent=2)
print("Saved summary to parse_summary.json")

