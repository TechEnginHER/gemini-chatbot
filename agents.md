# AGENTS.md

## Project: Chatbot Backend 
This is a Node.js backend that uses Google's Gemini 3 Flash model to power a multimodal chatbot. It utilizes the `@google/genai` SDK and supports text input, image input, streamed responses and conversation memory.

### Tech Stack
* **Node.js** with ES modules (`"type": "module"` in `package.json`)
* **@google/genai** for the Gemini SDK
* **dotenv** for managing environment variables

### Project Structure
The core logic resides in `index.js` which contains four async functions demonstrating different capabilities of the Gemini API:
1. `textChat`
2. `streamingChat`
3. `imageInput`
4. `conversationMemory`

### Environment & Execution Constraints
* A live `GEMINI_API_KEY` is provided in the active environment variables.
* **Agent Instruction:** Run the development server to visually verify the frontend build. Iterating on the UI and checking the live aesthetic against the prompt requirements is a critical part of this task.

### API Specifics
* Chat sessions are initialized using `ai.chats.create` with the model `gemini-3-flash-preview`.
* Messages are transmitted using either `sendMessage` or `sendMessageStream`.
* Image input is handled via an `inlineData` object containing base64 encoded image data.
* Conversation context is automatically maintained by the `history` array within `ai.chats.create`.

### Task Context and Requirements
The immediate next task for Jules is to build a Next.js frontend that connects to this backend logic. 

* Scaffold a new Next.js application with Tailwind CSS
* Create an API route that wraps the existing Gemini chat logic.
* Build a clean, minimal chat UI with the following features:
  * Text input support.
  * Image upload functionality.
  * Real-time display of streamed responses rendering token by token.