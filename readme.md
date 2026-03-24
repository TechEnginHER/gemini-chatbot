# Gemini Multimodal Chatbot Backend

A Node.js backend demonstrating a multimodal chatbot powered by Google's Gemini 3 Flash model. This project provides a foundation for interacting with the `@google/genai` SDK, supporting text, images, streamed text generation, and ongoing conversation context.

---

## Features

* **Text Input:** Standard text-based chat generation.
* **Image Input:** Multimodal capabilities allowing the model to analyze and respond to base64-encoded image data.
* **Streamed Responses:** Real-time, token-by-token output generation for lower perceived latency.
* **Conversation Memory:** Maintains chat history arrays for contextual, multi-turn interactions.

---

## Setup

Follow these steps to configure and run the project locally:

### 1. Clone the repository

```bash
git clone <https://github.com/TechEnginHER/gemini-chatbot>
cd <gemini-chatbot>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory of the project.

Obtain a Gemini API key from Google AI Studio and add it:

```env
GEMINI_API_KEY=your_api_key_here
```

---

## Usage

Run the application using Node.js:

```bash
node index.js
```

---

## Testing Different Capabilities

The `index.js` file contains four distinct functions, each demonstrating a different feature of the Gemini API:

* `textChat()`
* `streamingChat()`
* `imageInput()`
* `conversationMemory()`

To test a specific capability:

1. Open `index.js`
2. Scroll to the bottom of the file
3. Ensure only the function you want to run is uncommented
4. Execute the script again

---

## Notes

* Ensure your `.env` file is properly configured before running the project.
* Only one test function should be active at a time to avoid conflicts.
* This project is intended as a foundational example for building multimodal AI applications using the Gemini SDK.
