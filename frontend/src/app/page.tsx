"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "ai";
  text?: string;
  image?: string;
  isStreaming?: boolean;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isDragging]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    setError(null);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiMessageId, role: "ai", text: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          image: userMessage.image,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Stop loading once first stream chunk arrives
        setIsLoading(false);

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: fullText }
              : msg
          )
        );
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (err) {
      console.error(err);
      setError("Oops, something went wrong while asking the AI.");
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#E6E6FA]/80 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-[#FFD1DC] rounded-3xl m-4 pointer-events-none"
          >
            <p className="text-3xl text-[#301934] font-serif">
              Drop your memory here...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <h1 className="text-3xl sm:text-4xl text-[#301934] font-serif text-center px-4">
              Drop a memory here and I will write you a story.
            </h1>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-4 sm:p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(230,230,250,0.4)]
                  ${
                    msg.role === "user"
                      ? "bg-white/40 rounded-br-sm"
                      : "bg-white/60 rounded-bl-sm font-serif text-lg leading-relaxed text-[#301934]"
                  }
                `}
              >
                {msg.image && (
                  <div className="mb-4 relative rounded-2xl overflow-hidden shadow-sm inline-block">
                    <img
                      src={msg.image}
                      alt="Uploaded memory"
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}

                {msg.text && <p className={`whitespace-pre-wrap ${msg.role === "user" ? "font-sans text-[#301934]" : "text-[#301934]"}`}>{msg.text}</p>}

                {msg.isStreaming && msg.text === "" && isLoading && (
                  <div className="flex space-x-2 items-center h-6">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-[#301934]/50"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-[#301934]/50"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-[#301934]/50"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-t from-[#FDFBF7] to-transparent shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative flex flex-col items-center"
        >
          {error && (
             <div className="w-full text-center text-red-500 mb-2 font-sans text-sm">
                {error}
             </div>
          )}
          {selectedImage && (
            <div className="w-full mb-4 flex justify-start">
               <div className="relative group">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-white/50 shadow-md">
                     <img src={selectedImage} alt="Selected" className="object-cover w-full h-full" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-[#301934] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={14} />
                  </button>
               </div>
            </div>
          )}

          <div className="w-full flex items-center bg-white/50 backdrop-blur-xl border border-white/40 rounded-full p-2 shadow-[0_8px_32px_0_rgba(230,230,250,0.6)]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-[#301934]/60 hover:text-[#301934] hover:bg-white/40 rounded-full transition-colors focus:outline-none"
            >
              <Upload size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Add an optional note..." : "Type a message or drop an image..."}
              className="flex-1 bg-transparent px-4 py-3 outline-none font-sans text-[#301934] placeholder:text-[#301934]/40"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="p-3 bg-[#301934] text-white rounded-full hover:bg-[#301934]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} className={isLoading ? "animate-pulse" : ""} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
