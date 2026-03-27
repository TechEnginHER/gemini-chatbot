import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, image } = body;

    const chat = ai.chats.create({
      model: "gemini-3-flash",
      history: [],
    });

    const parts = [];

    if (image) {
      // Assuming image is a base64 string directly from a FileReader
      const base64Data = image.split(",")[1] || image;
      const mimeTypeMatch = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    if (message) {
      parts.push(message);
    }

    // If no message, we need to pass an empty array to Gemini
    if (parts.length === 0) {
        parts.push(" ");
    }


    const stream = await chat.sendMessageStream({
      message: parts,
    });

    const encoder = new TextEncoder();

    // Stream text chunks to response
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Oops, something went wrong while asking the AI." },
      { status: 500 }
    );
  }
}
