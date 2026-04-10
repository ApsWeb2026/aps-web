# APS_CANON_REVISION.md
**Governance Protocol for Canonical Content Revision in APS**

---

## 1. Purpose

This document defines the protocol by which **canonical APS content may be revised**.

It complements `APS_CANON_GUARDRAILS.md`, which defines the conceptual constraints that must not be violated.

> Canonical content in APS is stabilised for use, but remains open to disciplined revision.

---

## 2. Definition of Canonical Content

In APS, *canonical* does not mean final or immutable.

> **Canonical content is provisionally stabilised for consistent use across the framework.**

Canonical entries:

- Anchor conceptual coherence  
- Support communication across APS domains  
- Provide stable reference points for articles, glossary, and papers  

They are **locked for operational use**, but **revisable under defined conditions**.

---

## 3. Core Principle

> APS develops through **disciplined conceptual evolution**.

Revision must:

- Preserve coherence  
- Increase explanatory power  
- Respect APS guardrails  

---

## 4. Criteria for Revision

A canonical entry may be revised only if at least one of the following applies:

### 4.1 Internal Inconsistency
- Conflicts with other canonical definitions  
- Violates APS explanatory grammar  

---

### 4.2 Explanatory Limitation
- Cannot adequately account for a biological case  
- Produces ambiguity or conceptual confusion  

---

### 4.3 Conceptual Compression Opportunity
- A clearer or more precise formulation is available  
- Improves integration across the framework  

---

### 4.4 Empirical Interface Pressure
- Limits operationalisation (e.g. diagnosis, biosignatures)  
- Cannot support testing or intervention  

---

## 5. Revision Protocol

All revisions must follow this sequence:

---

### Step 1 — Flag for Review

Mark the entry (optional):

```yaml
underReview: true

```
No content changes at this stage.

---

### Step 2 — Diagnostic Statement

State clearly:

- What is the issue?  
- Where does it arise?  
- Which revision criterion applies?  

---

### Step 3 — Proposed Revision

Provide:

- Current version  
- Revised version  
- Justification  

---

### Step 4 — Integration Check

Evaluate against APS core commitments:

- Agency  
- Constraint Closure  
- Normativity  
- Viability-Oriented Organisation  
- Evolution  
- Scale  

> A revision must improve system-wide coherence, not just local clarity.

---

### Step 5 — Approval and Lock

If accepted:

- Update `revised:` date  
- Retain `canonical: true`  
- Remove `underReview` flag (if used)  

---

## 6. Revision Logging (Recommended)

Significant revisions should be recorded.

Example:

```markdown
### Revision Note — YYYY-MM-DD
- Entry: [Term or Article]
- Type: Clarification / Compression / Correction
- Summary: [What changed]
- Rationale: [Why it changed]

```
## 7. Constraints and Prohibitions

The following are not permitted:

❌ Silent Revision

Changes without documentation or justification

❌ Local Optimisation

Improving one entry while degrading overall coherence

❌ Premature Canonicalisation

Locking content before cross-context testing

❌ Over-Revision

Frequent minor edits that destabilise definitions

## 8. Relationship to APS Guardrails

All revisions must comply with APS_CANON_GUARDRAILS.md.

## 9. Operational Rule

Does this revision increase the explanatory power and coherence of APS as a whole?

If yes → proceed
If no → do not revise

## 10. Summary

Canonical content in APS is:

Stable but not static
Authoritative but revisable
Locked for use, open to disciplined change

APS evolves through structured revision, not accumulation or drift

**Status:** Canonical Governance Document
**Applies to:** APS_MONO, APS_GLOSSARY, APS_WEB, APS_DIAG
**Effective from:** 2026-04-10