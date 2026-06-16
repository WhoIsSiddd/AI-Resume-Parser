import pydantic
print(f"Pydantic version: {pydantic.VERSION}")

try:
    from api.schemas import ParseResult
    print("Successfully imported ParseResult")
    # Try to instantiate with dummy data
    data = {
        "name": "test", "email": "test@test.com", "phone": "123", "location": "test",
        "linkedin": "test", "github": "test", "summary": "test", "skills": [],
        "experience": "test", "experienceYears": 0.0,
        "education": [], "projects": [], "certifications": [],
        "atsScore": 0,
        "atsBreakdown": {
            "skillScore": 0, "experienceScore": 0, "educationScore": 0,
            "projectScore": 0, "certificationScore": 0, "formattingScore": 0
        },
        "feedback": {
            "matchedSkills": [], "missingSkills": [], "experienceMatch": False, "recommendations": []
        }
    }
    obj = ParseResult(**data)
    print("Successfully instantiated ParseResult")
    print(obj.model_dump_json(indent=2))
except Exception as e:
    import traceback
    traceback.print_exc()
