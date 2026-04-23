import requests
import json

url = "https://routellm.abacus.ai/v1/chat/completions"
headers = {
    "Authorization": "Bearer s2_62050fd5ff3147f9aa502485fab405e6",
    "Content-Type": "application/json"
}
payload = {
    "model": "route-llm",
    "messages": [{"role": "user", "content": "What is the meaning of life?"}],
    "stream": False
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print(f"Status: {response.status_code}")
print(json.dumps(response.json(), indent=2))
