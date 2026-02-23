"use client";

import { AgentStatus } from "../components/AgentStatus";
import { BoardroomLogger } from "../components/BoardroomLogger";
import { HoldingsManager } from "../components/HoldingsManager";
import { MonitorControl } from "../components/MonitorControl";
import { useState, useEffect } from "react";
import { Play, Send, LayoutDashboard } from "lucide-react";

const AGENTS = [
    { id: "translator", name: "Translator", emoji: "🗣️" },
    { id: "monitor", name: "Monitor", emoji: "📡" },
    { id: "researcher", name: "Researcher", emoji: "🔬" },
    { id: "equity-researcher", name: "Equity Researcher", emoji: "📊" },
    { id: "risk-world", name: "Global Risk", emoji: "🌍" },
    { id: "risk-portfolio", name: "Portfolio Risk", emoji: "💼" },
    { id: "scorer", name: "Scorer", emoji: "⚖️" },
];

export default function Home() {
    const [thesis, setThesis] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDocId, setNewDocId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Poll the Boardroom every 2 seconds
    useEffect(() => {
        const fetchBoardroom = async () => {
            try {
                const res = await fetch("/api/boardroom");
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                    setDocuments(data.documents || []);
                    setIsConnected(true);
                } else {
                    setIsConnected(false);
                }
            } catch (e) {
                console.error("Polling error", e);
                setIsConnected(false);
            }
        };

        fetchBoardroom();
        const interval = setInterval(fetchBoardroom, 2000);
        return () => clearInterval(interval);
    }, []);

    const sendThesis = async () => {
        if (!thesis.trim()) return;
        try {
            // Send direct message to doc
            await fetch("/api/boardroom", {
                method: "POST",
                body: JSON.stringify({
                    text: `@Translator ${thesis}`,
                    sender: "User",
                }),
            });
            setThesis("");
        } catch (e: any) {
            console.error("Failed to send thesis", e);
            alert("Failed to send: " + (e.message || String(e)));
        }
    };

    const startArmy = async () => {
        // Just a visual trigger for now
        console.log("Army Started");
    };

    const submitNewSession = async () => {
        if (!newDocId.trim()) return;
        try {
            setIsSubmitting(true);
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ docId: newDocId.trim() })
            });
            if (!res.ok) throw new Error("Failed to update active session");

            // Clear the local state to wipe the UI cards immediately
            setMessages([]);
            setThesis("");
            setNewDocId("");
            setIsModalOpen(false);

            // Fetch immediately to get the new empty doc
            const pollRes = await fetch("/api/boardroom");
            if (pollRes.ok) {
                const data = await pollRes.json();
                setMessages(data.messages || []);
                setDocuments(data.documents || []);
            }
        } catch (e: any) {
            console.error("Failed to start new session", e);
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-8">
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
                            <LayoutDashboard className="text-blue-400" size={20} /> Set Active Session
                        </h2>
                        <p className="text-sm text-zinc-400 mb-4">
                            Paste the ID of an existing Google Doc you own. The Molt Fund swarm will clear its logs and switch to this document immediately.
                        </p>
                        <input
                            type="text"
                            value={newDocId}
                            onChange={(e) => setNewDocId(e.target.value)}
                            placeholder="e.g. 1a7Ym1mzLBmOx..."
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-blue-500 mb-6 font-mono text-sm"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitNewSession}
                                disabled={isSubmitting || !newDocId.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm rounded-lg font-medium transition-colors"
                            >
                                {isSubmitting ? 'Updating...' : 'Set Active'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Molt Fund
                        </h1>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-zinc-400">{isConnected ? "Connected to Boardroom" : "Disconnected"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-md font-medium transition-colors border border-zinc-700 hover:border-zinc-600"
                    >
                        Set Active Session
                    </button>
                    <MonitorControl />
                    <button
                        onClick={startArmy}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors"
                    >
                        <Play size={16} /> Start Operation
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Thesis Injection Section - Left 2/3 */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Send size={20} className="text-blue-400" />
                        Inject Thesis
                    </h2>
                    <div className="flex gap-4">
                        <textarea
                            value={thesis}
                            onChange={(e) => setThesis(e.target.value)}
                            placeholder="Enter high-level investment thesis here..."
                            className="flex-1 bg-black border border-zinc-700 rounded-lg p-4 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                        />
                        <div className="flex flex-col gap-2 w-32">
                            <button
                                onClick={sendThesis}
                                disabled={!isConnected || !thesis.trim()}
                                className="w-full h-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                            >
                                Dispatch
                            </button>
                        </div>
                    </div>
                </div>

                {/* Holdings Manager - Right 1/3 */}
                <div className="lg:col-span-1">
                    <HoldingsManager />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {AGENTS.map((agent) => (
                    <AgentStatus
                        key={agent.id}
                        {...agent}
                        messages={messages}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <BoardroomLogger messages={messages} />

                    {/* Research History Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 text-zinc-200">Research History</h3>
                        <div className="space-y-2">
                            {documents.map((doc: any) => (
                                <a
                                    key={doc.id}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-3 bg-zinc-950 border border-zinc-800 rounded hover:border-blue-500 transition-colors group"
                                >
                                    <div className="font-medium text-blue-400 group-hover:text-blue-300 truncate">
                                        {doc.name}
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">
                                        Created: {new Date(doc.createdTime).toLocaleString()}
                                    </div>
                                </a>
                            ))}
                            {documents.length === 0 && (
                                <div className="text-zinc-500 italic text-sm">No research reports found.</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
