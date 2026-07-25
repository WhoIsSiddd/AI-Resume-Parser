from sentence_transformers import SentenceTransformer, util
import re
from typing import List

# Reuse the spaCy model from resume_parser instead of loading a second copy
from ai_engine.resume_parser import nlp

# Load embedding model (small, fast)
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Warning: Could not load sentence-transformer. {e}")
    embedding_model = None

# Internal robust skill database
MASTER_SKILLS = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "Rust", "PHP", "Swift", "Kotlin",
    "React", "React Native", "Angular", "Vue", "Svelte", "Node.js", "Express", "Django", "Flask", "Spring Boot",
    "FastAPI", "Next.js", "Nuxt.js",
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "GraphQL", "REST API", "Microservices",
    "Machine Learning", "Artificial Intelligence", "AI", "Data Science", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn",
    "HTML", "CSS", "Tailwind CSS", "SASS", "Figma", "UX/UI Design", "User Experience", "User Interface",
    "Agile", "Scrum", "Jira", "Git", "Linux", "Bash", "Shell"
]

# Pre-compute embeddings for master skills once at startup
if embedding_model:
    MASTER_SKILLS_EMBEDDINGS = embedding_model.encode(MASTER_SKILLS, convert_to_tensor=True)
else:
    MASTER_SKILLS_EMBEDDINGS = None

# Maximum number of sentences to run through the semantic model
MAX_SEMANTIC_SENTENCES = 25

def extract_skills(text: str) -> List[str]:
    """
    Extracts skills using:
      1. Fast exact/regex keyword matching (always runs)
      2. Semantic similarity (limited to MAX_SEMANTIC_SENTENCES to avoid slowness)
    """
    if not text.strip():
        return []

    extracted_skills: set[str] = set()
    text_lower = text.lower()

    # 1. Exact / Regex Keyword Match (fast path — catches obvious mentions)
    for skill in MASTER_SKILLS:
        escaped_skill = re.escape(skill.lower())
        pattern = r'\b' + escaped_skill + r'\b'
        if re.search(pattern, text_lower):
            extracted_skills.add(skill)

    # 2. Semantic Extraction (limited scope for performance)
    if embedding_model and nlp and MASTER_SKILLS_EMBEDDINGS is not None:
        doc = nlp(text)
        sentences = [sent.text for sent in doc.sents]

        # Cap the number of sentences to avoid processing huge resumes
        if len(sentences) > MAX_SEMANTIC_SENTENCES:
            sentences = sentences[:MAX_SEMANTIC_SENTENCES]

        if sentences:
            sentence_embeddings = embedding_model.encode(sentences, convert_to_tensor=True)
            cosine_scores = util.cos_sim(sentence_embeddings, MASTER_SKILLS_EMBEDDINGS)

            THRESHOLD = 0.72  # Higher threshold reduces false-positive skill matches

            for i in range(len(sentences)):
                for j in range(len(MASTER_SKILLS)):
                    if cosine_scores[i][j] > THRESHOLD:
                        extracted_skills.add(MASTER_SKILLS[j])

    return list(extracted_skills)
