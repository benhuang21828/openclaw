"use client";

import { Activity, Terminal, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AgentStatusProps {
    id: string;
    name: string;
    emoji: string;
    messages: any[]; // Stream of messages/events from gateway
}

export function AgentStatus({ id, name, emoji, messages }: AgentStatusProps) {
    const [lastLog, setLastLog] = useState<string>("");
    const [status, setStatus] = useState<"idle" | "working" | "error">("idle");

    useEffect(() => {
        // If the parent clears messages (e.g. New Session), reset our local state too
        if (!messages || messages.length === 0) {
            setLastLog("");
            setStatus("idle");
            return;
        }

        // Find messages from this agent
        // The messages prop is now { timestamp, sender, content }[]
        const myMessages = messages.filter(
            (m) => m.sender === name || m.sender === id
        );

        if (myMessages.length > 0) {
            const lastMsg = myMessages[myMessages.length - 1];
            setLastLog(lastMsg.content);

            // If the message is recent (within last 20 seconds), show working status
            const msgTime = new Date(lastMsg.timestamp).getTime();
            const now = Date.now();
            if (now - msgTime < 20000) {
                setStatus("working");
            } else {
                setStatus("idle");
            }
        }
    }, [messages, id, name]);

    return (
        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800 text-zinc-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <h3 className="font-bold text-lg">{name}</h3>
                </div>
                <div>
                    {status === "working" && <Activity className="text-blue-400 animate-pulse" />}
                    {status === "idle" && <CheckCircle className="text-zinc-600" />}
                    {status === "error" && <AlertCircle className="text-red-500" />}
                </div>
            </div>

            <div className="bg-black/50 rounded p-2 text-xs font-mono h-24 overflow-y-auto text-green-400/80 whitespace-pre-wrap">
                {lastLog || <span className="text-zinc-600 italic">Waiting for activity...</span>}
            </div>
        </div>
    );
}
