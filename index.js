// index.js
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// PART 1 — BASIC TEXT CHAT

async function textChat() {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [],
  });

  const response = await chat.sendMessage({
    message: "Hey, what can you help me with today?",
  });

  console.log(response.text);
}

// PART 2 — OUTPUT STREAMING

async function streamingChat() {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [],
  });

  const stream = await chat.sendMessageStream({
    message: "Tell me something interesting about Node.js",
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.text);
  }
  console.log();
}

// PART 3 — IMAGE + TEXT INPUT

function prepareImage(imagePath, mimeType = "image/jpeg") {
  const imageData = readFileSync(imagePath);
  return {
    inlineData: {
      data: imageData.toString("base64"),
      mimeType: mimeType,
    },
  };
}

async function imageInput() {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [],
  });

  const imagePart = prepareImage("./test.jpg");

  // First — open ended description
  const stream1 = await chat.sendMessageStream({
    message: [
      imagePart,
      "What do you see in this image? Describe it in detail.",
    ],
  });

  for await (const chunk of stream1) {
    process.stdout.write(chunk.text);
  }
  console.log("\n");

  // Second — specific question about the same image
  const stream2 = await chat.sendMessageStream({
    message: "What is the dominant colour in this image?",
  });

  for await (const chunk of stream2) {
    process.stdout.write(chunk.text);
  }
  console.log();
}


// PART 4 — CONVERSATION MEMORY

async function conversationMemory() {
  // Memory in action ---
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [],
  });

  const stream1 = await chat.sendMessageStream({
    message: "My name is Chi and I'm a software engineer.",
  });
  for await (const chunk of stream1) process.stdout.write(chunk.text);
  console.log("\n");

  const stream2 = await chat.sendMessageStream({
    message: "What do you know about me so far?",
  });
  for await (const chunk of stream2) process.stdout.write(chunk.text);
  console.log("\n");

  //  Pre-loading history / giving the model a persona ---
  const chatWithPersona = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You are a helpful assistant for a portfolio site. Keep responses concise and technical.",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Got it. I'm ready to help with your developer portfolio.",
          },
        ],
      },
    ],
  });

  const stream3 = await chatWithPersona.sendMessageStream({
    message: "What kind of projects should I include in my portfolio?",
  });
  for await (const chunk of stream3) process.stdout.write(chunk.text);
  console.log();
}


await textChat();
await streamingChat();
await imageInput();
await conversationMemory();