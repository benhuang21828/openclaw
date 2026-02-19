"use client";

import { useRef, useEffect } from "react";
import { Terminal } from "lucide-react";

interface LogMessage {
    timestamp: string;
    sender: string;
    content: string;
}

interface BoardroomLoggerProps {
    messages: LogMessage[];
}

export function BoardroomLogger({ messages }: BoardroomLoggerProps) {
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    // Auto-scroll disabled by user request
    // useEffect(() => {
    //     endRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [messages]);

    return (
        <div className="border rounded-lg bg-zinc-950 border-zinc-800 flex flex-col h-[400px]">
            <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-zinc-900/50">
                <Terminal size={18} className="text-zinc-400" />
                <h3 className="font-mono text-sm text-zinc-300">Mission Log (Boardroom)</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3">
                {messages.length === 0 && (
                    <div className="text-zinc-600 italic">No activity recorded...</div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className="flex gap-2 group hover:bg-zinc-900/50 p-1 rounded">
                        <span className="text-zinc-500 shrink-0 select-none">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex-1 break-words">
                            <span className={`font-bold mr-2 ${getSenderColor(msg.sender)}`}>
                                [{msg.sender}]
                            </span>
                            <span className="text-zinc-300 whitespace-pre-wrap">
                                {msg.content}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}

function getSenderColor(sender: string) {
    if (sender === "User") return "text-blue-400";
    if (sender === "Translator") return "text-purple-400";
    if (sender === "Monitor") return "text-cyan-400";
    if (sender === "Researcher") return "text-orange-400";
    if (sender === "Scorer") return "text-yellow-400";
    if (sender.includes("Risk")) return "text-red-400";
    return "text-zinc-400";
}
