# profOuraniaAlter Script Blueprint

This document is the visual planning map for the full script lifecycle.
Use it to decide what to build next, branch ideas, and track what is done.

## 1) Current Main Flow (as coded today)

```mermaid
flowchart TD
    A[onStart] --> B[onGameTick]
    B -->|uiCompleted = false| B
    B -->|uiCompleted = true| C[State Manager]

    C --> D[TRAVEL_TO_OURANIA_ALTAR]
    D --> E[INTERACT_WITH_OURANIA_ALTAR]

    E --> F{Run energy >= 50%?}
    F -->|Yes| I[TRAVEL_TO_BANK]
    F -->|No| G[TRAVEL_TO_PRAYER_ALTAR]

    G --> H[SWAP_MAGE_BOOK]
    H --> J[USE_PRAYER_ALTAR]
    J --> I
    I --> K[INTERACT_WITH_BANK]
    K --> L[IDLE]

    M[onEnd]:::lifecycle

    classDef lifecycle fill:#f1f5f9,stroke:#64748b,stroke-width:1px;
```

## 2) Expanded Build Blueprint (what to implement)

```mermaid
flowchart LR
    %% Lanes
    subgraph Prep[Startup + Guardrails]
        P1[Load UI config]
        P2[Validate required items]
        P3[Set initial state + fail counters]
    end

    subgraph AltarLoop[Main Rune Loop]
        S1[Travel to Ourania altar]
        S2[Craft runes at altar]
        S3{Need prayer restore?}
        S4[Travel to prayer altar]
        S5[Swap spellbook]
        S6[Use prayer altar]
        S7[Travel to bank]
        S8[Banking + refill + pouch prep]
        S9{Loop complete?}
    end

    subgraph Recovery[Error Recovery]
        R1[Missing object/NPC]
        R2[Timeout / stuck detection]
        R3[Repath or world-hop]
        R4[Safe idle + notify]
    end

    subgraph Observability[Logging + Metrics]
        O1[State transition logs]
        O2[Action success/fail counters]
        O3[Trip duration + runes/hr]
    end

    P1 --> P2 --> P3 --> S1 --> S2 --> S3
    S3 -->|Yes| S4 --> S5 --> S6 --> S7 --> S8 --> S9
    S3 -->|No| S7
    S9 -->|Continue| S1
    S9 -->|Stop condition| R4

    S1 --> R2
    S2 --> R1
    S4 --> R1
    S7 --> R2
    S8 --> R1
    R1 --> R3 --> S1
    R2 --> R3

    S1 --> O1
    S2 --> O2
    S8 --> O2
    S9 --> O3
```

## 3) State-by-State Build Checklist

Mark each item with `[ ]` (todo), `[-]` (in progress), `[x]` (done).

### TRAVEL_TO_OURANIA_ALTAR
- [ ] Pathing strategy (static path / dynamic web path / tile checkpoints)
- [ ] Arrival detection (WorldArea + distance threshold)
- [ ] Failure handling if blocked/path fails

### INTERACT_WITH_OURANIA_ALTAR
- [ ] Confirm altar exists and is reachable
- [ ] Craft interaction timing and confirmation
- [ ] Pouch emptying logic before/after craft
- [ ] Decision gate for prayer detour vs direct bank

### TRAVEL_TO_PRAYER_ALTAR
- [ ] Find ladder and climb safely
- [ ] Position correction if misaligned plane/tile
- [ ] Retry strategy when ladder interaction fails

### SWAP_MAGE_BOOK
- [ ] Quest requirement check (Kingdom Divided varbit)
- [ ] Spellbook swap trigger + verify success
- [ ] Fallback if swap unavailable

### USE_PRAYER_ALTAR
- [ ] Confirm altar target + interaction
- [ ] Verify prayer restoration before leaving
- [ ] Timeout and retry thresholds

### TRAVEL_TO_BANK
- [ ] Movement route from altar area to bank area
- [ ] Run energy policy (toggle run, stamina handling)
- [ ] Anti-stuck correction points

### INTERACT_WITH_BANK
- [ ] Open bank and validate interface
- [ ] Deposit/withdraw rules
- [ ] Pouch fill strategy
- [ ] Inventory sanity check before next loop

### IDLE
- [ ] Exit criteria or resume trigger
- [ ] Optional auto-restart loop setting

## 4) Branching Board (idea sandbox)

Use this section to plan alternative strategies without disrupting the main design.

### Branch A: Fast XP Route
- Goal:
- Tradeoff:
- States affected:
- New conditions:
- Risks:
- Test plan:

### Branch B: Safe/Stable Route
- Goal:
- Tradeoff:
- States affected:
- New conditions:
- Risks:
- Test plan:

### Branch C: High-AFK Route
- Goal:
- Tradeoff:
- States affected:
- New conditions:
- Risks:
- Test plan:

## 5) Transition Rules (single source of truth)

Keep this in sync with code so flow changes are intentional.

| From State | Condition | To State | Notes |
|---|---|---|---|
| TRAVEL_TO_OURANIA_ALTAR | Arrival complete | INTERACT_WITH_OURANIA_ALTAR | Currently direct |
| INTERACT_WITH_OURANIA_ALTAR | Run energy >= 50% | TRAVEL_TO_BANK | Threshold in constants |
| INTERACT_WITH_OURANIA_ALTAR | Run energy < 50% | TRAVEL_TO_PRAYER_ALTAR | Prayer detour |
| TRAVEL_TO_PRAYER_ALTAR | Ladder traversal complete | SWAP_MAGE_BOOK | Currently direct |
| SWAP_MAGE_BOOK | Spellbook swap complete | USE_PRAYER_ALTAR | Currently direct |
| USE_PRAYER_ALTAR | Prayer restore complete | TRAVEL_TO_BANK | Currently direct |
| TRAVEL_TO_BANK | Arrival complete | INTERACT_WITH_BANK | Currently direct |
| INTERACT_WITH_BANK | Banking complete | IDLE | Placeholder end state |

## 6) Suggested Next Build Order

1. Finish `INTERACT_WITH_BANK` inventory + pouch logic.
2. Implement robust movement in `TRAVEL_TO_BANK` and `TRAVEL_TO_OURANIA_ALTAR`.
3. Add success/failure confirmation checks in altar interactions.
4. Implement `IDLE` behavior (loop resume, stop, or fail-safe).
5. Add recovery policies (timeouts, stuck detection, repath).

## 7) Quick Editing Tips

- Keep diagrams in Mermaid for easy Git diffs and quick edits.
- Add a new branch by copying one block in Section 4.
- When adding a new state in code, update:
  - state enum
  - state manager switch
  - transition table in this file
- If your loop logic changes, update Section 1 first so this stays trustworthy.
