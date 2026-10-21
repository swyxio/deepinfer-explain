# DSpark: visual directions for one worked example

Each direction uses the same two requests and the same five-query-token budget. These are alternative visual treatments, not additional mechanisms.

## 1. Survival gates

A ghost cohort passes sequential gates. For B, 1,000 predicted possibilities narrow to 800, then 320, then 288. This makes it visible that a later candidate's score depends on reaching it: B3's local .90 is not its prefix score .288. Use translucent ribbons or beads whose widths or counts shrink; keep them visibly hypothetical, since these are predictions before verification.

**Best for:** explaining cumulative probability. **Risk:** a literal group of departing beads can look like already rejected tokens, so label the cohort as predicted.

## 2. Shared tickets

Two reserved tickets go to the base queries. Three remaining tickets slide onto the highest-scoring draft positions across both rows: A1, B1, A2. A linked train makes each row's prefix constraint visible. Group the winning tickets back by request to show query lengths A=3 and B=2.

**Best for:** showing one batch-wide budget, ranking, and allocation. **Risk:** a pure sorted table shows what wins without explaining why the scores shrink.

## 3. Inspection queue

Each request's selected prefix is a short train carrying an inspection ticket into a target-model checkpoint. The ticket permits verification; only the checkpoint decides which drafts survive. Do not show a particular acceptance result unless the example specifies one.

**Best for:** distinguishing scheduling from target verification. **Risk:** treating the verifier as a simple match/no-match gate can obscure the actual sampling procedure.

## 4. A paired counterfactual

Put the same two score rows above two budget trays. One tray allocates the three draft slots globally (A1, B1, A2); the other uses a fixed alternative allocation (A1, B1, B2). The score sums are 2.42 and 2.02 expected accepted drafts respectively, assuming these predicted scores. This communicates why allocation matters without claiming measured throughput from a toy example.

**Best for:** the payoff and comparison. **Risk:** space and arithmetic can distract from the mechanics; reserve it for an interactive or follow-up view.

## 5. Linked railcars

Draft positions are coupled cars behind a base locomotive. The first two cars on A and the first car on B get verification tickets; the remaining cars stay behind. Show the global score ranking alongside the tracks, so the train explains why allocation is a **prefix**, while the ranking explains how the lengths are chosen.

**Best for:** connecting an individual request to a batch-wide decision. **Risk:** a rail switch can suggest the request itself is rerouted; the tickets represent query positions, not physical routing.

## 6. Probability ribbons

Two ribbons run left to right through three labeled positions. Each ribbon narrows by its conditional rate; compare their widths at each position, then peel the three widest checkpoints into the budget tray. B visibly becomes narrow at its second position, so its high third-position rate cannot restore probability already lost.

**Best for:** seeing multiplication and cross-request comparison in one continuous picture. **Risk:** area and width can mislead when perspective changes, so use a flat, calibrated scale and print the scores.

## 7. A ranking wall

Each prefix is a labeled card on its request's row. Cards lift vertically onto a common score axis; a movable cut line selects the top three. The selected cards then return to their original rows and become counts. This makes the transformation from a two-dimensional batch to a global ranking and back visible.

**Best for:** readers who want the scheduler's actual data transformation. **Risk:** it can feel like a dashboard if the transformation is shown as a static list instead of a spatial motion.

## 8. A fixed-budget experiment

Let the reader drag a budget slider from two to eight query positions. Base tokens stay fixed; selected prefix cards light up one at a time in descending score order, and the A/B query lengths update. A second view locks an equal allocation alongside it, with estimated scores rather than a throughput claim.

**Best for:** building intuition about how a shared budget changes allocation. **Risk:** a UI simulator needs exact tie-breaking, prefix handling and accessibility; it should be built from a verified calculation, not animated guesses.

## Styles worth trying

| Style | What it gives us | Good fit |
| --- | --- | --- |
| **Scientific textbook** | Flat SVG, calibrated scales, few colors, direct labels | Exact probabilities and comparisons |
| **Transit diagram** | Color-coded routes, stations and transfers | Following requests through modules |
| **Paper stop-motion** | Tactile cards and tickets, readable shadows, no decorative machinery | Selection and regrouping |
| **Cross-section** | A cutaway showing a component's inside while the larger system stays visible | Explaining boundaries between modules |
| **Blackboard build-up** | Marks and equations appear in the order an engineer reasons | Derivations and causal chains |
| **Interactive instrument** | Sliders, knobs and synchronized numbers | Testing how input changes affect allocation |

These styles can share the same restrained palette and labels. A style is a way of presenting the mechanism, not an alternative algorithm.

## Recommended first animation

Combine **probability ribbons or survival gates → shared tickets → inspection queue** in one scene, using the same objects and colors throughout. The SVG should carry exact numbers; the motion should expose their relationships before a viewer reads the code. Use the ImageGen study's light paper and ceramic aesthetic, with no decorative machinery. Keep source and vLLM/SGLang comparisons outside the moving illustration.

The current pilot builds from narrowing ribbons to a shared-budget ranking, ordered prefixes, a worked verification outcome, and the complete decode loop.
