from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import requests

response = requests.get(
    "https://huggingface.co/google/flan-t5-large/resolve/main/model.safetensors",
    timeout=(20, 300)  # (connect timeout, read timeout)
)

model_name = "google/flan-t5-large"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

def generate_lessons(title):
    prompt = f"You are a teacher speaking to kids. Explain the topic simply and clearly:\n\nTopic: {title}\n\nTeach as you would to a child."

    input = tokenizer(prompt, return_tensor='pt', truncation=True, max_length=1024)
    output = model.generate(
        **input,
        max_new_tokens=256,
        tempreture = 0.7,
        do_sample = True,
        top_p = 0.9,
        num_return_sequence = 1
    )
    return tokenizer.decode(output[0], skip_special_tokens=True)

text = "what is climate change?"
story = generate_lessons(text)
print(story)
