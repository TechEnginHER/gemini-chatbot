"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface Message {
  role: "user" | "model";
  content: string;
  image?: string; // base64 string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;

    let base64Image = undefined;
    let mimeType = undefined;
    let userImagePreview = undefined;

    if (imageFile) {
      // Convert image to base64
      base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract base64 part
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(imageFile);
      });
      mimeType = imageFile.type;
      userImagePreview = imagePreview as string;
    }

    // Add user message to UI
    const newMessage: Message = {
      role: "user",
      content: input,
      image: userImagePreview
    };

    setMessages((prev) => [...prev, newMessage]);

    // Clear input
    const currentInput = input;
    setInput("");
    removeImage();
    setIsLoading(true);

    // Format history for the API
    const history = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    try {
      // Add empty assistant message that will be updated
      setMessages((prev) => [...prev, { role: "model", content: "" }]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput || "Analyze this image", // Default text if only image is sent
          history,
          imageBase64: base64Image,
          imageMimeType: mimeType
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Handle stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Update the last message (the assistant's response) with the new chunk
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + chunk
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the empty/partial assistant message on error
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === "model" && !newMessages[newMessages.length - 1].content) {
          return newMessages.slice(0, -1);
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-neutral-800 bg-neutral-950">
        <h1 className="text-xl font-medium tracking-tight">Gemini Chat</h1>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4">
            <div className="p-4 bg-neutral-900 rounded-full">
              <SparklesIcon className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-lg font-medium text-neutral-400">How can I help you today?</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "model" && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col max-w-[85%] rounded-2xl px-5 py-3 ${
                    message.role === "user"
                      ? "bg-neutral-800 text-white rounded-br-sm"
                      : "bg-transparent text-neutral-200 border border-neutral-800 rounded-bl-sm"
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="User uploaded"
                      className="max-w-sm rounded-lg mb-3 object-contain border border-neutral-700"
                    />
                  )}
                  {message.content && (
                    <div
                      className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 break-words"
                      dangerouslySetInnerHTML={{ __html: md.render(message.content) }}
                    />
                  )}
                  {message.role === "model" && !message.content && isLoading && index === messages.length - 1 && (
                    <div className="flex space-x-1.5 h-6 items-center">
                      <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></div>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-auto rounded-lg border border-neutral-700 object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-neutral-800 text-neutral-300 hover:text-white rounded-full p-1 border border-neutral-700 shadow-sm transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="relative flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-neutral-700 focus-within:border-neutral-700 transition-all shadow-sm"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() || imageFile) onSubmit(e as any);
                }
              }}
              placeholder="Message Gemini..."
              className="flex-1 bg-transparent border-0 resize-none max-h-32 min-h-[44px] py-3 px-2 text-neutral-100 placeholder:text-neutral-500 focus:ring-0 outline-none"
              rows={1}
              style={{
                height: "auto",
              }}
            />

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !imageFile)}
              className="p-3 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-colors shrink-0 font-medium disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-xs text-neutral-500">Gemini may display inaccurate info, so double-check its responses.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple icons for the UI
function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
