"use client";

import { useGateway } from "../lib/gateway";
import { AgentStatus } from "../components/AgentStatus";
import { useState } from "react";
import { Play, Send, LayoutDashboard } from "lucide-react";

const AGENTS = [
    { id: "translator", name: "Translator", emoji: "🗣️" },
    { id: "monitor", name: "Monitor", emoji: "📡" },
    { id: "researcher", name: "Researcher", emoji: "🔬" },
    { id: "risk-world", name: "Global Risk", emoji: "🌍" },
    { id: "risk-portfolio", name: "Portfolio Risk", emoji: "💼" },
    { id: "scorer", name: "Scorer", emoji: "⚖️" },
];

export default function Home() {
    const { isConnected, messages, call } = useGateway();
    const [thesis, setThesis] = useState("");

    const sendThesis = async () => {
        if (!thesis.trim()) return;
        try {
            // Send chat message to Translator agent
            await call("chat.send", {
                agentId: "translator",
                text: `Thesis: ${thesis}`,
            });
            setThesis("");
        } catch (e: any) {
            console.error("Failed to send thesis", e);
            alert("Failed to send: " + (e.message || String(e)));
        }
    };

    const startArmy = async () => {
        // Maybe trigger a specific 'start' event or just rely on them being running
        // For now, we just log locally or assume they are running.
        console.log("Army Started");
    };

    return (
        <main className="min-h-screen bg-black text-white p-8">
            <header className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Hedge Fund Army
                        </h1>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-zinc-400">{isConnected ? "Connected to Gateway" : "Disconnected"}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={startArmy}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors"
                >
                    <Play size={16} /> Start Operation
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {AGENTS.map((agent) => (
                    <AgentStatus
                        key={agent.id}
                        {...agent}
                        messages={messages}
                    />
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Send size={20} className="text-blue-400" />
                    Inject Thesis
                </h2>
                <div className="flex gap-4">
                    <textarea
                        value={thesis}
                        onChange={(e) => setThesis(e.target.value)}
                        placeholder="Enter high-level investment thesis here (e.g., 'Long NVDA due to new Blackwell chip...')"
                        className="flex-1 bg-black border border-zinc-700 rounded-lg p-4 h-32 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    <button
                        onClick={sendThesis}
                        disabled={!isConnected || !thesis.trim()}
                        className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors self-end h-12"
                    >
                        Dispatch
                    </button>
                </div>
            </div>
        </main>
    );
}
