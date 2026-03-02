"use client";

import { Activity, Terminal, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AgentStatusProps {
    id: string;
    name: string;
    emoji: string;
    messages: any[]; // Stream of messages/events from gateway
    contextId?: string;
    isMyTurn?: boolean;
    isDone?: boolean;
}

export function AgentStatus({ id, name, emoji, messages, contextId, isMyTurn, isDone }: AgentStatusProps) {
    const [lastLog, setLastLog] = useState<string>("");
    const [status, setStatus] = useState<"idle" | "working" | "error" | "done">("idle");
    const [scratchLogs, setScratchLogs] = useState<any[]>([]);

    useEffect(() => {
        if (isDone) {
            setStatus("done");
        } else if (isMyTurn) {
            setStatus("working");
        } else {
            setStatus("idle");
        }
    }, [isMyTurn, isDone]);

    // Poll Scratchpad individually if there's a context and I am not done
    useEffect(() => {
        if (!contextId || isDone) return;

        const pollScratchpad = async () => {
            try {
                const res = await fetch(`/api/scratchpad?context_id=${contextId}&agent=${id}`);
                if (res.ok) {
                    const logs = await res.json();
                    if (Array.isArray(logs) && logs.length > 0) {
                        setScratchLogs(logs);
                    }
                }
            } catch (e) {
                console.error("Scratchpad fetch error", e);
            }
        };

        pollScratchpad();
        const interval = setInterval(pollScratchpad, 2000);
        return () => clearInterval(interval);
    }, [contextId, id, isDone]);

    // Format the display output
    useEffect(() => {
        // If we have scratchpad logs, show the most recent relevant one
        if (scratchLogs.length > 0) {
            const last = scratchLogs[scratchLogs.length - 1];
            if (last.type === "start") setLastLog(`[${id}] starting task: ${last.data.task.substring(0, 40)}...`);
            if (last.type === "tool_call") setLastLog(`Executing Skill: ${last.data.name}()`);
            if (last.type === "tool_result") setLastLog(`Result received from ${last.data.name}. Processing...`);
            if (last.type === "final_response") setLastLog(`Done! Final Result Generated.`);
            return;
        }

        // Fallback to boardroom messages
        if (!messages || messages.length === 0) {
            setLastLog("");
            return;
        }

        const myMessages = messages.filter(
            (m) => m.sender === name || m.sender === id
        );

        if (myMessages.length > 0) {
            const lastMsg = myMessages[myMessages.length - 1];
            setLastLog(lastMsg.content);
        }
    }, [scratchLogs, messages, id, name]);

    return (
        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800 text-zinc-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <h3 className="font-bold text-lg">{name}</h3>
                </div>
                <div>
                    {status === "working" && <Activity className="text-blue-400 animate-pulse" />}
                    {status === "idle" && <Terminal className="text-zinc-600" />}
                    {status === "done" && <CheckCircle className="text-green-500" />}
                    {status === "error" && <AlertCircle className="text-red-500" />}
                </div>
            </div>

            <div className="bg-black/50 rounded p-2 text-xs font-mono h-24 overflow-y-auto text-green-400/80 whitespace-pre-wrap">
                {lastLog || <span className="text-zinc-600 italic">Waiting for activity...</span>}
            </div>
        </div>
    );
}
