# ⛪ Church OS: Mock Testing & Credentials Guide

This document provides a comprehensive list of fictitious churches, user roles, and credentials used for testing the Church OS ecosystem, including the AI Onboarding and Member App flows.

---

## 🏗 Core Architecture: Mock Organizations

| Organization Name | Church ID (org_id) | Context / DNA |
|-------------------|-------------------|---------------|
| **JKC Church** | `fa547adf-f820-412f-9458-d6bade11517d` | **Canonical Reference**. Multi-lingual (EN/JP), Prophetic emphasis. |
| **Grace Fellowship** | `67f02034-4566-44b5-af4e-d31cddbab25f` | **Secondary Tenant**. Evangelical, size 250+, worship-focused. |
| **Test Church Alpha** | `(Generated during onboarding)` | Used for testing the **3-step AI provisioning** flow. |

---

## 👤 Recommended Test Accounts

> [!NOTE]
> Since passwords in Supabase Auth are securely hashed, we recommend **creating these accounts manually** via the Sign Up page or Magic Link, as the `profiles` table is currently a fresh slate.

### 1. The Senior Pastor (Super Admin)
- **Email**: `pastor@jkc.church`
- **Role**: `pastor` / `owner`
- **Use Case**: Full access to **Pastor HQ**, Strategic Dashboard, and Missionary Control.
- **Organization**: JKC Church

### 2. Ministry Leader (Grace Fellowship)
- **Email**: `sarah@gracefellowship.ai`
- **Role**: `leader`
- **Use Case**: Testing multi-tenant isolation. Should *only* see Grace Fellowship data in the Ministry Hub.
- **Organization**: Grace Fellowship

### 3. New Church Prospect (Onboarding Flow)
- **Email**: `onboarding@newchurch.org`
- **Role**: `pending_owner`
- **Use Case**: Testing the **AI-provisioning wizard** from Step 1 (Identity) to Step 3 (Intelligence DNA).
- **Organization**: Dynamic creation.

### 4. General Member (Daily Devotion)
- **Email**: `member@jkc.church`
- **Role**: `member`
- **Use Case**: Testing the **Member Devotion App**, SOAP journaling, and Sentiment Analysis.
- **Organization**: JKC Church

---

## 🧪 Testing Workflows

### A. The Onboarding Experience
1. **Navigate to**: `/onboarding`
2. **Action**: Fill out the 3-step form.
3. **Verify**:
   - Check Supabase `organizations` for a new entry.
   - Check `organization_intelligence` for status: `processing` -> `completed`.
   - Check `prophetic_insights` for the AI-generated welcome blueprint.

### B. The Invite Magic Link
1. **Trigger**: Use the "Invite" button in the Admin Dashboard.
2. **Action**: Enter `onboarding@test.church`.
3. **Verify**:
   - Invitation record created in `onboarding_invitations`.
   - Email received via **Brevo** (if API key is active).
   - Clicking the link should pre-fill the church name on `/onboarding`.

### C. The Member App
1. **Navigate to**: `/welcome/devotion`
2. **Action**: Log in as `member@jkc.church`.
3. **Verify**:
   - SOAP entries are saved with `org_id`.
   - AI Sentiment analysis runs in the background.
   - Statistics (streak, completion) are scoped correctly.

---

## 🔑 Common Mock Passwords
In our testing environment, we recommend using a standard strong password for all mock accounts to simplify your testing:
- **Default Test Password**: `TestPass123!` (or any consistent value you prefer).
