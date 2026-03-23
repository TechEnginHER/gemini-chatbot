AGENTS.md
Project: Gemini Chatbot Backend
This is a Node.js backend that uses Google's Gemini 3 Flash model to power a multimodal chatbot. It uses the @google/genai SDK and supports text input, image input, streamed responses and conversation memory.
Tech stack:
Node.js with ES modules (type: module in package.json)
@google/genai for the Gemini SDK
dotenv for environment variables
Project structure:
index.js contains four async functions: textChat, streamingChat, imageInput and conversationMemory. Each function demonstrates a different capability of the Gemini API. Only one function is uncommented and called at the bottom at a time.
Environment:
Requires a GEMINI_API_KEY in a .env file. This file is gitignored and will not be present in the repo. Jules should not attempt to run the project as it requires a live API key.
What Jules should know:
The chat sessions use ai.chats.create with model gemini-3-flash-preview. Messages are sent with sendMessage or sendMessageStream. Image input uses an inlineData object with base64 encoded image data. The history array in ai.chats.create maintains conversation context automatically.
Task context:
The next task for Jules is to build a Next.js frontend for this chatbot. The frontend should connect to this backend logic. Jules should scaffold a new Next.js app with Tailwind CSS inside this repo or as a separate directory, create an API route that wraps the Gemini chat logic, and build a clean minimal chat UI that supports text input, image uploads and displays streamed responses token by token.