# import ollama

# client = ollama.Client()

# model = "gemma3:1b"
# prompt = "what is python?"

# response = client.generate(model=model, prompt=prompt)
# print(response.response)

import ollama
import json
from datetime import datetime, timezone

# Assuming you have these defined somewhere
SYSTEM_PROMPT = "You are a climate education expert give responses that are beginner friendly and accurate."  # Replace with actual SYSTEM_PROMPT
MODEL = "gemma3:1b"  # From your target example
OLLAMA_URL = "http://localhost:11434/api/generate"  # Not needed for ollama library, but keeping for reference

# Simplified chat management without DB
chats = {}  # In-memory storage for chats, key: chat_id, value: {'title': str, 'messages': list}

client = ollama.Client()

def send_message(user_id: int, message: str, chat_id: int = None):
    try:
        if chat_id is None:
            utc_now = datetime.now(timezone.utc)
            chat_id = len(chats) + 1  # Simple ID generation
            chats[chat_id] = {
                "title": f"Chat {utc_now.strftime('%Y-%m-%d %H:%M')}",
                "messages": []
            }

        if chat_id not in chats:
            raise ValueError("Chat not found")

        chat = chats[chat_id]
        chat["messages"].append({"role": "user", "content": message})

        full_prompt = SYSTEM_PROMPT + "\n\n" + "\n".join(
            [f"{msg['role']}: {msg['content']}" for msg in chat["messages"]]
        )

        try:
            # Using ollama.generate instead of requests
            response = client.generate(model=MODEL, prompt=full_prompt, format="json")
            
            try:
                ai_response_json = json.loads(response.get("response", "{}"))
                ai_response = ai_response_json.get("response", "Sorry, I couldn't generate a response.")
            except json.JSONDecodeError:
                ai_response = "Error: Invalid JSON from model."

            chat["messages"].append({"role": "assistant", "content": ai_response})
            
            return {"chat_id": chat_id, "response": ai_response}
        except Exception as e:
            raise ValueError(f"Ollama error: {str(e)}")
    except Exception as e:
        raise ValueError(f"Chat error: {str(e)}")

# Example usage
if __name__ == "__main__":
    try:
        result = send_message(user_id=1, message="what is python?")
        print(json.dumps(result, indent=2))
    except ValueError as e:
        print(str(e))
