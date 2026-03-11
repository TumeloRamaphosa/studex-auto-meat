---
name: naledi-influencer-creator
description: "Creates consistent AI influencer content for Naledi (StudEx Meat brand). Uses the 'Character Sheet Prompt' method (AI Samson / Nano Banana). Generates consistent character images across different outfits and settings. Use when: creating Naledi content, generating influencer images, maintaining character consistency across posts."
---

# Naledi AI Influencer Creator Skill
## Based on: "This ONE Prompt Fixes AI Character Consistency" — AI Samson

---

## The Core Method: Character Sheet Prompting

The secret is a **single master prompt** that locks in Naledi's appearance, then referenced in EVERY subsequent generation.

### Step 1: The Master Character Sheet Prompt

Use this EXACT prompt structure with Nano Banana Pro (Gemini Image API):

```
CHARACTER SHEET - Naledi:
A 24-year-old South African woman, warm brown skin tone, natural 4C coily hair 
worn in a puff or loose afro, almond-shaped dark brown eyes, high cheekbones, 
warm confident smile, slim athletic build (squash player physique), 
5'6" tall, small nose, full lips, no heavy makeup (natural/minimal look).

[SCENE VARIATION - replace this line per image]:
Wearing a white UCT lab coat, standing in a modern medical laboratory, 
holding a clipboard, warm laboratory lighting.

Style: photorealistic lifestyle photography, Canon EOS R5, 
85mm lens, f/1.8, natural lighting, 4K resolution, 
shot by professional photographer
```

### Step 2: Scene Variations (swap the middle section)

**Lab/Medical content:**
```
Wearing a white UCT lab coat, modern medical laboratory background, 
holding scientific equipment, focused expression, warm lighting
```

**Squash/Sports content:**
```
Wearing a navy blue squash kit with white trim, on a squash court, 
racket in hand, athletic stance, sports hall lighting, action-ready pose
```

**Meal Prep / StudEx Meat content:**
```
Wearing a casual cream hoodie and jeans, modern kitchen background, 
preparing a high-protein meal, StudEx Meat packaging visible, 
golden hour window light, relaxed home environment
```

**Study session content:**
```
Wearing a UCT university sweatshirt, sitting at a library desk, 
textbooks and laptop open, coffee cup nearby, focused studying, 
warm library lighting
```

**Lifestyle/Elegant content:**
```
Wearing a stylish earth-tone outfit, Cape Town waterfront background, 
Table Mountain visible in distance, golden sunset light, 
relaxed confident pose, lifestyle photography
```

---

## How to Generate Images

### Via Gemini API (Nano Banana Pro):

```python
import google.generativeai as genai
import base64
from datetime import datetime

genai.configure(api_key="GEMINI_API_KEY")

def generate_naledi(scene_prompt, filename=None):
    """Generate a Naledi character image with consistent appearance"""
    
    master_prompt = """CHARACTER SHEET - Naledi:
A 24-year-old South African woman, warm brown skin tone, natural 4C coily hair 
worn in a puff or loose afro, almond-shaped dark brown eyes, high cheekbones, 
warm confident smile, slim athletic build (squash player physique), 
5'6" tall, small nose, full lips, no heavy makeup (natural/minimal look).

""" + scene_prompt + """

Style: photorealistic lifestyle photography, Canon EOS R5, 
85mm lens, f/1.8, natural lighting, 4K resolution, 
shot by professional photographer"""

    model = genai.GenerativeModel("gemini-2.0-flash-exp-image-generation")
    response = model.generate_content(
        master_prompt,
        generation_config={"response_modalities": ["image"]}
    )
    
    if filename is None:
        filename = f"{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}-naledi.png"
    
    for part in response.candidates[0].content.parts:
        if part.inline_data:
            with open(filename, "wb") as f:
                f.write(base64.b64decode(part.inline_data.data))
            print(f"Saved: {filename}")
            return filename
    
    return None

# Usage examples:
# generate_naledi(LAB_SCENE, "naledi-lab-01.png")
# generate_naledi(SQUASH_SCENE, "naledi-squash-01.png")
# generate_naledi(KITCHEN_SCENE, "naledi-meal-prep-01.png")
```

---

## The "3x3 Grid" Method (for consistency testing)

Generate 9 images at once with the same master prompt, slight variations.
Pick the best 3. Use those 3 as your "seed images" for all future content.

---

## Workflow: Image → Video → Post

```
1. Generate image (Nano Banana / Gemini)
        ↓
2. Animate to video (Kling 3.0 API)
   - Use image as first frame
   - Prompt: "Naledi smiles and looks at camera, slight head movement, natural breathing"
        ↓
3. Add voiceover (Google TTS - free)
   - Script written by Claude/OpenAI
   - Voice: en-ZA-Standard-A (South African English female)
        ↓
4. Lip sync (Sync Labs / HeyGen)
        ↓
5. Add StudEx Meat branding + CTA
   - "Visit studexmeat.com" lower third
        ↓
6. Post via Blotato API → Instagram + TikTok + YouTube Shorts
```

---

## Google TTS (Free Alternative to ElevenLabs)

```python
from google.cloud import texttospeech

def generate_naledi_voice(script, output_file):
    client = texttospeech.TextToSpeechClient()
    
    synthesis_input = texttospeech.SynthesisInput(text=script)
    
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-ZA",  # South African English
        name="en-ZA-Standard-A",  # Female voice
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95,  # Slightly slower = more natural
        pitch=1.0
    )
    
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    
    with open(output_file, "wb") as out:
        out.write(response.audio_content)
    
    return output_file
```

---

## Caption Templates (StudEx Meat)

**Meal prep style:**
```
POV: You're a med student who actually fuels properly 🔬🥩

Between 6-hour lab sessions and studying the human body,
I've learned one thing: your body is only as good as what you put in it.

That's why I don't compromise on protein. @studexmeat has been
my go-to since year 3. Quality you can taste. Delivered to your door.

Link in bio → studexmeat.com 🍖

#MedStudent #UCT #StudExMeat #ProteinMeal #CapeTown #AIInfluencer
```

**Sports/Recovery style:**
```
Training session done ✅ Recovery starts now 💪

As a former national squash champion, I know recovery nutrition isn't optional.
It's the difference between performing and breaking down.

Naledi's recovery stack: @studexmeat high-protein cut + water + sleep 💤

What's your post-training meal? 👇

studexmeat.com | #Squash #SportNutrition #CapeTown #MedStudent
```

---

## Content Calendar

| Post | Scene | Caption Type | CTA |
|------|-------|-------------|-----|
| Mon | Lab coat | Science explains protein | studexmeat.com |
| Tue | Squash court | Recovery nutrition | studexmeat.com |
| Wed | Kitchen meal prep | What I eat as a med student | studexmeat.com |
| Thu | Study session | Brain food focus | studexmeat.com |
| Fri | Lifestyle Cape Town | Week wins + haul | studexmeat.com |

---

## References
- Video: "This ONE Prompt Fixes AI Character Consistency" — AI Samson
- Method: Character Sheet Prompting + 3x3 Grid Seeding
- Tools: Nano Banana Pro → Kling 3.0 → Google TTS → Blotato → Instagram/TikTok
