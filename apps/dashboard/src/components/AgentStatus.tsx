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
        // Filter messages for this agent
        const relevant = messages.filter(
            (m) =>
                m.type === "event" &&
                m.event === "agent.log" &&
                (m.payload.agentId === id || m.payload.source === id)
        );

        if (relevant.length > 0) {
            const last = relevant[relevant.length - 1];
            setLastLog(last.payload.message || JSON.stringify(last.payload));
            setStatus("working");

            // Auto-idle after 10s of no logs
            const timer = setTimeout(() => setStatus("idle"), 10000);
            return () => clearTimeout(timer);
        }
    }, [messages, id]);

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

            <div className="bg-black/50 rounded p-2 text-xs font-mono h-24 overflow-y-auto text-green-400/80">
                {lastLog || <span className="text-zinc-600 italic">Waiting for activity...</span>}
            </div>
        </div>
    );
}
