# Schema v0.2 Changes — Summary for Product Owner

**Prepared for:** Photchanathorn P.
**Date:** 2026-04-01
**Issue:** internal-23

---

## What Changed

### Input Validation Ranges (2 fields updated)

| Field | v0.1 Range | v0.2 Range |
|-------|------------|------------|
| `rice_polish_ratio` | 30–90% | 30–100% |
| `moromi_duration_days` | 15–45 days | 10–120 days |

All other input fields are unchanged.

### Schema Version

The `schema_version` field in prediction responses now returns `v0.2` (was `v0.1`).

---

## What This Means in Practice

**Rice Polish Ratio:** The form and CSV upload now accept values up to 100% (previously capped at 90%). Values above 90% were previously rejected — they will now be accepted and scored.

**Moromi Duration:** The form and CSV upload now accept durations from 10 days (down from 15) to 120 days (up from 45). Batches with shorter or longer fermentation windows can now be entered directly.

**No database migration required.** Batch parameters are stored as flexible JSON, so existing batch records are unaffected.

---

## Mock Prediction Behavior

The mock prediction formulas have been recalibrated for the wider ranges:

- **Polish factor:** Uses the full 30–100% range. Highly polished rice (low ratio) still scores higher.
- **Duration factor:** Sweet spot remains ~30 days. The penalty curve is now spread across 10–120 days (instead of 15–45), so extreme durations score lower but still within the 1–5 quality scale.

Quality scores (1–5) remain valid across all new range extremes.

---

## Acceptance Criteria Verification

| Test | Expected |
|------|----------|
| Submit `rice_polish_ratio: 95` | Accepted ✓ |
| Submit `rice_polish_ratio: 101` | Rejected (above max) ✓ |
| Submit `moromi_duration_days: 10` | Accepted ✓ |
| Submit `moromi_duration_days: 120` | Accepted ✓ |
| Submit `moromi_duration_days: 9` | Rejected (below min) ✓ |
| Mock prediction at extremes | Score within 1–5 ✓ |
