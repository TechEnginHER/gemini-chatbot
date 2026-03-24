import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, history, imageBase64, imageMimeType } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Initialize the SDK
    // It automatically picks up the GEMINI_API_KEY environment variable
    const ai = new GoogleGenAI({});

    // Setup history array for memory
    const chatHistory = history ? history : [];

    // Create the chat session
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: chatHistory,
    });

    let messageContent: any = message;

    // Handle optional image
    if (imageBase64) {
      messageContent = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType || "image/jpeg",
          },
        },
        message,
      ];
    }

    // Call the model via stream
    const stream = await chat.sendMessageStream({
      message: messageContent,
    });

    // Create a readable stream to pipe to the frontend
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}
