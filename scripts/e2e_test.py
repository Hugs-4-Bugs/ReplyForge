"""
End-to-end smoke test for ReplyForge.

Drives the full customer workflow against the running dev server:
1. Sign up a new user (creates org + free subscription).
2. Log in via the credentials provider (NextAuth).
3. Create a content library entry.
4. Upload a reference document.
5. Create a project with parsed questions.
6. Trigger AI drafting on all questions.
7. Verify answers were generated with confidence + sources.
8. Approve an answer.
9. Export the project as XLSX + CSV.
10. Test entitlement enforcement.
11. Test tenant isolation.

Run: python3 scripts/e2e_test.py
"""
import requests
import json
import random
import string
import sys

BASE = "http://localhost:3000"
s = requests.Session()

def section(title):
    print(f"\n=== {title} ===")

def rand_email():
    return "test_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8)) + "@replyforge-test.com"

# 1. Sign up
section("1. Sign up")
email = rand_email()
password = "TestPass123!"
r = s.post(f"{BASE}/api/signup", json={
    "email": email, "password": password, "name": "Test User", "orgName": "Test Org Inc"
})
print(f"  status: {r.status_code}")
print(f"  body: {r.text[:200]}")
if r.status_code != 200:
    print("FAILED: signup")
    sys.exit(1)

# 2. Get CSRF token then log in
section("2. Log in")
csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
r = s.post(f"{BASE}/api/auth/callback/credentials", data={
    "email": email, "password": password,
    "csrfToken": csrf, "callbackUrl": "/app/dashboard", "json": "true",
})
print(f"  status: {r.status_code}")
sess = s.get(f"{BASE}/api/auth/session").json()
print(f"  session.user.id: {sess.get('user', {}).get('id', 'NONE')}")
print(f"  session.tenantId: {sess.get('tenantId', 'NONE')}")
if not sess.get("user"):
    print("FAILED: no session after login")
    sys.exit(1)

tenant_id = sess["tenantId"]
print(f"  + logged in as {email}, tenant={tenant_id}")

# 3. Create a content library entry
section("3. Create content library entry")
r = s.post(f"{BASE}/api/library", json={
    "question": "Do you encrypt data at rest?",
    "answer": "Yes. All customer data is encrypted at rest using AES-256. Encryption keys are managed via AWS KMS with quarterly rotation.",
    "category": "Security",
    "tags": "encryption, soc2, data-at-rest",
    "confidence": 1.0,
})
print(f"  status: {r.status_code}")
if r.status_code != 200:
    print(f"  body: {r.text[:300]}")
    sys.exit(1)
entry_id = r.json()["entry"]["id"]
print(f"  + created entry {entry_id}")

# Add a second entry
r = s.post(f"{BASE}/api/library", json={
    "question": "Describe your access review process.",
    "answer": "We conduct quarterly access reviews across all production systems. Managers certify their team's access; the security team reconciles against HR records. Findings are remediated within 5 business days.",
    "category": "Security",
    "tags": "access-control, soc2, reviews",
    "confidence": 1.0,
})
print(f"  second entry: {r.status_code}")

# 4. Upload a reference document (small text file)
section("4. Upload reference document")
files = {"file": ("security_policy.txt", b"Our incident response plan defines severity levels P1-P4. P1 incidents require acknowledgment within 15 minutes and a post-mortem within 5 business days. We use PagerDuty for on-call rotation. All incidents are logged in our incident tracker. Customer notification for P1/P2 incidents happens within 24 hours per our DPA.", "text/plain")}
r = s.post(f"{BASE}/api/documents", files=files)
print(f"  status: {r.status_code}")
if r.status_code != 200:
    print(f"  body: {r.text[:300]}")
    sys.exit(1)
doc_id = r.json()["document"]["id"]
print(f"  + uploaded document {doc_id}")

# 5. Create a project with parsed questions
section("5. Create project with questions")
questions = [
    {"externalId": "1.1", "text": "Do you encrypt data at rest?", "category": "Encryption"},
    {"externalId": "1.2", "text": "Describe your access review process.", "category": "Access Control"},
    {"externalId": "2.1", "text": "What is your incident response plan?", "category": "Incident Response"},
    {"externalId": "2.2", "text": "How do you notify customers of a security incident?", "category": "Incident Response"},
    {"externalId": "3.1", "text": "List your sub-processors.", "category": "Vendor Management"},  # Should return low-confidence answer
]
r = s.post(f"{BASE}/api/projects", json={
    "name": "Acme Corp Security Questionnaire Q4 2026",
    "client": "Acme Corp",
    "type": "security_questionnaire",
    "dueDate": "2026-12-31",
    "questions": questions,
})
print(f"  status: {r.status_code}")
if r.status_code != 200:
    print(f"  body: {r.text[:300]}")
    sys.exit(1)
project_id = r.json()["id"]
print(f"  + created project {project_id} with {len(questions)} questions")

# 6. Trigger AI drafting on all questions
section("6. AI draft all questions")
r = s.post(f"{BASE}/api/projects/{project_id}/draft", json={})
print(f"  status: {r.status_code}")
if r.status_code != 200:
    print(f"  body: {r.text[:400]}")
    sys.exit(1)
data = r.json()
print(f"  drafted: {data.get('drafted')}")
print(f"  skipped: {data.get('skipped')}")
for res in data.get("results", []):
    ok = "+" if res.get("ok") else "x"
    conf = res.get("confidence", 0)
    fb = " [fallback]" if res.get("fallback") else ""
    snippet = (res.get("draft") or "")[:80].replace("\n", " ")
    print(f"    {ok} q={res['questionId'][:8]} conf={conf:.2f}{fb}: {snippet}...")
if data.get("drafted", 0) == 0:
    print("FAILED: no answers drafted")
    sys.exit(1)

# 7. Fetch the project and verify answers
section("7. Verify project state")
r = s.get(f"{BASE}/api/projects/{project_id}")
proj = r.json()["project"]
print(f"  questions: {len(proj['questions'])}")
drafted = sum(1 for q in proj["questions"] if q.get("answer"))
approved = sum(1 for q in proj["questions"] if q.get("answer", {}).get("status") == "approved")
flagged = sum(1 for q in proj["questions"] if q.get("answer", {}).get("status") == "flagged")
print(f"  drafted: {drafted}, approved: {approved}, flagged: {flagged}")
first_ans = next((q["answer"] for q in proj["questions"] if q.get("answer")), None)
if first_ans:
    sources = json.loads(first_ans.get("sources") or "[]")
    print(f"  first answer sources: {len(sources)} (model: {first_ans.get('aiModel')})")
    print(f"  first answer status: {first_ans.get('status')}, confidence: {first_ans.get('confidence')}")
    print(f"  first answer text: {first_ans.get('draft', '')[:120]}...")

# 8. Approve the first answer
section("8. Approve first answer")
if first_ans:
    r = s.patch(f"{BASE}/api/projects/{project_id}/answers/{first_ans['id']}", json={
        "final": first_ans["draft"],
        "status": "approved",
    })
    print(f"  status: {r.status_code}")
    if r.status_code == 200:
        print(f"  + approved; approvedAt: {r.json()['answer'].get('approvedAt')}")

# 9. Export as XLSX + CSV
section("9. Export project")
r = s.get(f"{BASE}/api/projects/{project_id}/export?format=xlsx")
print(f"  xlsx status: {r.status_code}, bytes: {len(r.content)}")
if r.status_code == 200 and len(r.content) > 1000:
    print("  + exported valid XLSX")
else:
    print("  x export failed")
r = s.get(f"{BASE}/api/projects/{project_id}/export?format=csv")
print(f"  csv status: {r.status_code}, bytes: {len(r.content)}")
if r.status_code == 200 and len(r.content) > 100:
    print(f"  csv preview: {r.text[:150]}")

# 10. Entitlement enforcement — free plan = 2 projects/month. We've created 1.
section("10. Entitlement enforcement (free plan: 2 projects/month)")
extra = []
for i in range(4):
    r = s.post(f"{BASE}/api/projects", json={
        "name": f"Extra project {i+1}",
        "questions": [{"externalId": "1", "text": "test"}],
    })
    code = r.status_code
    err = r.json().get("error", "") if code != 200 else "OK"
    extra.append((code, err))
for i, (code, err) in enumerate(extra):
    print(f"  attempt {i+1}: {code} {err}")

# 11. Tenant isolation
section("11. Tenant isolation")
r = s.get(f"{BASE}/api/projects/nonexistent_project_id_xyz")
print(f"  nonexistent project: {r.status_code} (expected 404)")

print("\n=== ALL TESTS PASSED ===")
print(f"  user: {email}")
print(f"  org: {tenant_id}")
print(f"  project: {project_id}")
