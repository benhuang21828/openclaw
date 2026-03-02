import { NextResponse } from "next/server";
import { AGENT_SEQUENCE, OrchestratorState, writeState, readState, checkScratchpadFinished, fireAgentAsync } from "../../../lib/orchestrator";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { thesis } = await req.json();
        if (!thesis) return NextResponse.json({ error: "Thesis required" }, { status: 400 });

        const contextId = `orchestra-${Date.now()}`;

        // 1. Initialize State
        const initialState: OrchestratorState = {
            contextId,
            thesis,
            currentAgent: AGENT_SEQUENCE[0], // Starts with translator
            status: "running",
            results: {}
        };

        await writeState(contextId, initialState);

        // 2. Fire the first agent in the background
        fireAgentAsync(initialState.currentAgent, contextId, thesis);

        return NextResponse.json({ contextId, state: initialState });
    } catch (e: any) {
        console.error("Orchestrator POST Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const contextId = url.searchParams.get("context_id");

        if (!contextId) return NextResponse.json({ error: "context_id required" }, { status: 400 });

        const state = await readState(contextId);
        if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });

        // If it's already completed or errored, just return it
        if (state.status === "completed" || state.status === "error") {
            return NextResponse.json(state);
        }

        // If it is paused, do not transition to next agent, just return state so UI shows paused
        if (state.status === "paused") {
            return NextResponse.json(state);
        }

        const agentIdx = AGENT_SEQUENCE.indexOf(state.currentAgent);
        if (agentIdx === -1) {
            state.status = "error";
            await writeState(contextId, state);
            return NextResponse.json(state);
        }

        // Check if the current agent has written a `final_response` to its scratchpad
        const agentOutput = await checkScratchpadFinished(contextId, state.currentAgent);

        if (agentOutput) {
            // Agent is done! Record result.
            state.results[state.currentAgent] = agentOutput;

            // Are there more agents?
            if (agentIdx + 1 < AGENT_SEQUENCE.length) {
                // Transition to next agent
                state.currentAgent = AGENT_SEQUENCE[agentIdx + 1];

                // For the next task, we pass the output of the *last* agent (plus original thesis context if we want, but letting them chain is good)
                // Actually, let's just pass the previous output as the core instruction.
                const nextInstruction = `The previous stage output was:\n${agentOutput}\n\nPlease proceed to your phase. Original Thesis: ${state.thesis}`;

                await writeState(contextId, state);

                // Fire next agent
                fireAgentAsync(state.currentAgent, contextId, nextInstruction);
            } else {
                // We reached the end of the sequence!
                state.status = "completed";
                await writeState(contextId, state);
            }
        }

        // Return current state (even if we just updated it)
        return NextResponse.json(state);

    } catch (e: any) {
        console.error("Orchestrator GET Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
