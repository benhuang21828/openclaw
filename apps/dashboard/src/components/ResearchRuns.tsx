"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FileText, Database, ExternalLink } from "lucide-react";

export function ResearchRuns() {
    const [runs, setRuns] = useState<any[]>([]);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const fetchRuns = async () => {
            const { data } = await supabase
                .from('research_runs')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) {
                setRuns(data);
                if (data.length > 0 && !selectedRunId) {
                    setSelectedRunId(data[0].id);
                }
            }
        };
        fetchRuns();

        // Subscription for runs
        const runSub = supabase.channel('runs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'research_runs' }, fetchRuns)
            .subscribe();

        return () => { supabase.removeChannel(runSub) };
    }, []);

    useEffect(() => {
        if (!selectedRunId) return;
        const fetchActivities = async () => {
            const { data } = await supabase
                .from('run_activities')
                .select('*')
                .eq('run_id', selectedRunId)
                .order('created_at', { ascending: true });
            if (data) setActivities(data);
        };
        fetchActivities();

        const actSub = supabase.channel('activities')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'run_activities', filter: `run_id=eq.${selectedRunId}` }, fetchActivities)
            .subscribe();

        return () => { supabase.removeChannel(actSub) };
    }, [selectedRunId]);

    const activeRun = runs.find(r => r.id === selectedRunId);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-zinc-200 flex items-center gap-2">
                <Database className="text-blue-400" size={20} /> Mission Control
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Runs List (Left 1/3) */}
                <div className="col-span-1 space-y-3 max-h-96 overflow-y-auto pr-2 border-r border-zinc-800/50">
                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Research Runs</h4>
                    {runs.length === 0 && <div className="text-zinc-500 italic text-sm">No research runs in database.</div>}
                    {runs.map(run => (
                        <div
                            key={run.id}
                            onClick={() => setSelectedRunId(run.id)}
                            className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedRunId === run.id ? 'bg-blue-900/20 border-blue-500/50' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${run.status === 'running' ? 'bg-blue-500/20 text-blue-400' : run.status === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {run.status.toUpperCase()}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {new Date(run.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="text-sm text-zinc-300 line-clamp-2" title={run.thesis}>
                                {run.thesis}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected Run Details (Right 2/3) */}
                <div className="col-span-2 flex flex-col h-96 pl-2">
                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                        <span>Action Log</span>
                        {activeRun && (
                            <span className="text-xs font-normal text-zinc-500 truncate max-w-xs">{activeRun.thesis}</span>
                        )}
                    </h4>
                    {!selectedRunId ? (
                        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic border border-zinc-800/50 bg-black/50 rounded-lg">
                            Select a run to view its activity log.
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col border border-zinc-800 bg-black rounded-lg overflow-hidden">
                            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex gap-2">
                                {activeRun?.coordinator_file_url && (
                                    <a href={activeRun.coordinator_file_url} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors" rel="noreferrer">
                                        <FileText size={14} /> Boardroom
                                        <ExternalLink size={12} className="ml-1 opacity-70" />
                                    </a>
                                )}
                                {activeRun?.artifact_file_url && (
                                    <a href={activeRun.artifact_file_url} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors" rel="noreferrer">
                                        <FileText size={14} /> Final Artifact
                                        <ExternalLink size={12} className="ml-1 opacity-70" />
                                    </a>
                                )}
                                {!activeRun?.coordinator_file_url && !activeRun?.artifact_file_url && (
                                    <span className="text-xs text-zinc-500 italic py-1.5 px-2">No documents linked to this run yet.</span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {activities.length === 0 && <div className="text-zinc-500 italic text-sm text-center mt-10">Waiting for agent activity...</div>}
                                {activities.map(act => (
                                    <div key={act.id} className="text-sm">
                                        <div className="flex items-center gap-2 mb-1 border-l-2 border-blue-500 pl-2">
                                            <span className="font-semibold text-blue-400">{act.agent_name}</span>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(act.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-zinc-300 bg-zinc-900/50 p-3 rounded-r rounded-bl border border-zinc-800/50 leading-relaxed whitespace-pre-wrap ml-2 text-xs font-mono max-h-48 overflow-y-auto shadow-inner">
                                            {act.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
