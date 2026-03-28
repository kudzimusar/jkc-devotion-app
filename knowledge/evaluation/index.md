# Evaluation Matrix: Church OS AI

## Success Metrics by Persona

| Persona | Primary Metric | Target | Measurement Method |
|---------|----------------|--------|-------------------|
| Concierge | Onboarding completion rate | +15% vs no bot | A/B test |
| Concierge | Time-to-completion | -20% | User session tracking |
| Shepherd | Alert response time (risk >70%) | < 24 hours | Database timestamps |
| Shepherd | Follow-up completion rate | >80% | Care record tracking |
| Strategist | Leadership satisfaction | 4.5/5 | Quarterly survey |
| Disciple | Streak retention (7+ days) | >60% | Streak analysis |
| Facilitator | Group attendance rate | +10% | Attendance tracking |
| Sentinel | Issue detection time | < 1 hour | Log monitoring |

---

## Quality Benchmarks

### Response Quality

| Criteria | Definition | Threshold | How to Test |
|----------|------------|-----------|-------------|
| **Hallucination Rate** | Responses containing information not in context | < 2% | Random sampling + human review |
| **Refusal Rate** | "I cannot help" when bot could help | < 5% | User feedback + log analysis |
| **Accuracy** | Factually correct responses | >95% | Spot-check against source data |
| **Relevance** | Response addresses user's actual question | >90% | User thumbs up/down |
| **Conciseness** | Appropriate length for context | 80% appropriate | Human review |

### Technical Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response time (p95) | < 3 seconds | API monitoring |
| API availability | >99.5% | Uptime monitoring |
| Tool execution success | >98% | Error logging |
| Escalation handling time | < 5 minutes to human | Ticketing system |

---

## Testing Protocol

### Pre-Release Testing
For each persona update:
1. **Unit testing:** Individual tool calls.
2. **Integration testing:** Full conversation flows.
3. **Edge case testing:** Out-of-domain queries, malformed inputs.
4. **Security testing:** Attempts to access unauthorized data.

### Continuous Evaluation
- **Daily**: Review error logs, API failures.
- **Weekly**: Sample 50 conversations, rate quality.
- **Monthly**: Full persona evaluation against benchmarks.
- **Quarterly**: Deep persona review based on feedback analytics.

---

## Feedback Loop

Each conversation ends with an optional thumbs up/down rating that is saved to the `ai_feedback` table.

```typescript
interface Feedback {
  conversation_id: string;
  rating: 'up' | 'down';
  reason?: string;
  category?: 'accuracy' | 'helpfulness' | 'speed' | 'other';
}
```
Analysis of downvotes triggers automatic alerts to the engineering team for potential prompt refinement.
