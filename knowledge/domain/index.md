# Domain Knowledge Base: Church OS AI

## Knowledge Taxonomy

### Primary Knowledge Domains

| Domain | Description | Data Sources | Update Frequency |
|--------|-------------|--------------|------------------|
| **Spiritual Formation** | Devotionals, scripture, theology, spiritual practices | Daily devotion content (`devotions` table), SOAP entries, sermon archives | Daily (devotion), On-demand (sermons) |
| **Member Management** | Profiles, roles, relationships, skills | Supabase `profiles`, `org_members`, `user_skills` tables | Real-time |
| **Pastoral Care** | Prophetic insights, risk scores, follow-ups | Supabase `prophetic_insights`, `attendance_logs` | Hourly |
| **Group Dynamics** | Small groups, attendance, participation | Supabase `bible_study_groups`, `group_members`, `attendance` | Real-time |
| **Church Operations** | Events, facilities, finances | Supabase `events`, `bookings`, `financial_summary` | Daily |
| **System Operations** | API status, error logs, user feedback | Log files, Supabase `audit_logs` | Real-time |

---

## Data Source Inventory

### Real-time Data (Supabase)

| Table | Purpose | Access Level | Used By Persona |
|-------|---------|--------------|-----------------|
| `profiles` | User identity and contact info | Role-based | All (self only for non-admins) |
| `org_members` | Role assignments (Admin, Leader, Pastor) | Admin only | Sentinel, Strategist, Shepherd |
| `prophetic_insights` | AI-generated risk alerts | Shepherd, Strategist | Shepherd, Strategist |
| `user_reflections` | Daily S.O.A.P and journal entries | User self + Admin | Disciple, Shepherd (summarized) |
| `attendance_logs` | Real-time service/group check-ins | Group leaders + Admin | Facilitator, Shepherd, Strategist |
| `kids_registry` | Junior church attendance and info | Guardian + Admin | Concierge, Shepherd |
| `audit_logs` | Internal system tracking | Admin only | Sentinel |

---

## API Tool Definitions

| Tool Name | Description | Input Parameters | Output | Persona Access |
|-----------|-------------|------------------|--------|----------------|
| `create_care_task` | Create pastoral follow-up | `member_id`, `task_type`, `due_date`, `notes` | Task ID | Shepherd |
| `update_profile` | Update user profile field | `field`, `value` | Success status | Steward (self), Sentinel (any) |
| `get_insight_summary` | Fetch all unvisited alerts | `org_id` | Array of insights | Shepherd, Strategist |
| `escalate_to_human` | Hand off to church staff | `reason`, `department` | Ticket ID | All |
| `check_system_health` | Monitor API status | None | Status object | Sentinel only |

---

## Security & Access Rules

### Rule 1: Self-Only Data
General users cannot see the journals or details of other members. Exceptions exist only for those explicitly assigned in `org_members` as `leader` or `pastor`.

### Rule 2: Multi-Tenant Isolation
All RAG queries MUST be scoped to the `org_id`. Data leak across organizations is a critical failure.

### Rule 3: Audit Trail
All tool calls and escalated conversations must be logged to the `audit_logs` table for 90 days.
