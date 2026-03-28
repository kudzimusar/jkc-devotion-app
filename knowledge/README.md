# Church OS Knowledge Architecture

This directory contains the central source of truth for the AI ecosystem within Church OS. It's designed to ensure clear governance, persona-based intelligence, and consistent data grounding across all layers.

## ┌─── 1. Persona Specifications
Defined in `knowledge/personas/` - The "WHO" for each layer (Concierge, Shepherd, Strategist, etc.).

## ┌─── 2. Domain Knowledge Base
Defined in `knowledge/domain/` - The "WHAT." Data sources, real-time tables, and API tool definitions.

## ┌─── 3. Prompt Library
Defined in `knowledge/prompts/` - The "HOW." System prompt templates and context-switching patterns.

## ┌─── 4. Evaluation Matrix
Defined in `knowledge/evaluation/` - The "HOW GOOD." Monitoring, feedback loops, and KPIs.

---

### Integration Guide for Developers

All AI-related services (e.g., `src/lib/ai-service.ts`) must reference these specifications to maintain system-wide consistency.

- **For New Features:** Always check the `domain/` base before deciding on RAG or static grounding.
- **For New UI Layers:** Consult the `personas/` spec to determine which bot should be active in your route.
