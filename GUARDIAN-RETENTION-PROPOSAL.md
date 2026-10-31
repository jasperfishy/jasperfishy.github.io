# Southern Taxis Ltd: Guardian retention schedule and implementation review

Status: Steve confirmed authority/approval in response to the company-approval question on 31 October 2026 for the 12-month operational-history/audit period and 90-day routine-diagnostic/backup period. These are approved target periods; automatic enforcement is not implemented or certified. Other privacy and contractual details remain under review.

Southern Taxis Ltd, 98 Warren Road, Brighton BN2 6BA. Contact: enquiries@southerntaxis.co.uk.

Steve has confirmed that there is no existing privacy or retention policy available to use. Guardian currently has retained operational history, audit journals and backups, without a verified comprehensive deletion schedule. Creating this document does not change that behaviour.

## Target periods and supporting criteria

The approved numerical periods are business choices, not statutory periods or a legal finding of necessity. Management still needs to document the justification and check complaint timescales, employment considerations, licensing conditions and other applicable obligations. Supporting review procedures and criteria below remain implementation proposals. This schedule covers Guardian's queue and audit data, not the taxi booking system, tax records or other records with separate retention requirements.

| Guardian record | Proposed period or criterion | Purpose and decision needed |
| --- | --- | --- |
| Current queue and operational driver/agent identifiers | While required for an active authorised role or an unresolved operational action; review on departure or role change | Keep live queues usable and permissions current. Removing access must be handled separately from removing historical evidence. |
| Allocation, no-fare, cancellation and queue-action history; agent attribution; linked audit journals; identifiable management reports | Approved target: 12 months from the event or report date, unless a documented hold applies | Investigate disputed actions and reliability issues across an annual operational cycle. Confirm whether an annual cycle is actually needed; shorten if it is not. Keep linked evidence consistently so that attribution and journal integrity are preserved. |
| Routine diagnostic logs that are not needed as action evidence | Approved target: 90 days from creation | Investigate recent faults. A relevant excerpt can be retained with an incident when justified. Classify logs before applying this rule; do not delete audit evidence as if it were routine telemetry. |
| Workbook backups, manual exports and copies containing personal information | Approved target: rolling 90 days from creation, except explicitly justified incident/restore evidence | Restore service after corruption or accidental changes. First inventory all copies, including annual/manual copies, prove restoration and determine whether this window covers fault discovery needs. Existing indefinite backups are not automatically covered by a purge job. |
| Records needed for a specific complaint, investigation or legal/licensing requirement | Only the relevant records, for the documented need or applicable required period; review each hold at least every three months | Record the owner, reason, scope, review date and release decision. A hold is not blanket permission to keep everything indefinitely. |
| Statistics intended for longer-term trends | Retain only genuinely anonymous aggregates after the identifiable retention period | Driver numbers, agent names, small groups or linkable event IDs may still identify people. Check re-identification risk; removing names alone is insufficient. |

## Read-only implementation findings: 31 October 2026

- Checked timestamp columns in all four live statistics tabs and all four local Guardian journals at 18:38 UK time. Found 570 statistics records and 1,292 journal entries; no parsed timestamp was older than the 12-month cutoff and none was unparseable. This does not certify other hidden logs, management reports, central journal copies, email, exports or provider copies.
- A metadata search for files older than 90 days in the known Guardian backup folder returned no accessible matches. This is not a complete backup inventory or a certification of backup expiry.
- Direct journal-row pruning is unsafe: the existing verifier starts from GENESIS, external checkpoints refer to row numbers and hashes, and central replication uses row cursors. Statistics shrinkage can also trip a safety stop. Retention implementation must coordinate linked evidence, checkpoints and cursors, with tests before deployment. Simply moving personal records into an indefinite archive would not satisfy deletion.
- No records, files, permissions, triggers or production script code were changed by this check.

## Adoption and implementation

1. Southern Taxis management records its chosen periods, business justifications, lawful bases, any applicable record-keeping requirements, responsible owner and effective date. Any legitimate-interests basis needs a documented assessment of purpose, necessity and the balance with people's rights; it is not automatically established by this proposal.
2. Inventory live workbooks, hidden journals/stats, emailed reports, owner/admin copies, provider copies and backups. Determine what is technically controlled by Guardian and what requires another owner's process.
3. Produce a read-only report of records that would be affected, exclusions and holds. Review it before enabling deletion. Reconcile all linked action and journal records and test the approach on private test copies. Preserve the system's audit-chain and restore requirements.
4. Establish and verify an erasure/anonymisation process, including backup expiry and the handling of records reintroduced by a restoration. Backups awaiting expiry need restricted use. Do not claim a universal 90-day deletion guarantee until the full process supports it.
5. Review records monthly against the adopted schedule; review the schedule annually and after material system or legal changes. Record disposal decisions without duplicating the deleted personal information.
6. Publish a privacy notice that reflects the adopted, working process and any honest transitional arrangements. Until then the current draft must continue to say that comprehensive automatic deletion is not verified.

No deletion, permission change or Guardian production-code change is authorised by this proposal alone.

## Guidance consulted

- ICO, storage limitation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/
- ICO, collecting and keeping employment records: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/employment-practices-and-data-protection-keeping-employment-records/collecting-and-keeping-employment-records
- ICO, guide to lawful basis: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/

The ICO explains that retention must be justified by purpose and applicable requirements; it does not prescribe the proposed 12-month or 90-day periods above.
