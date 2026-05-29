# Prism · World-Slice Diversity Skill

> A methodology for generating world-slice diversity in interactive narrative.
> Same story, different worlds.

**Version**: v1.0
**Scope**: methodology only · framework-agnostic · genre-agnostic
**Out of scope**: numerical systems, ending routing, character personas, UI

---

## 0. One-line claim

**Turn a story node from a piece of written content into a generator function.**

A node holds the dramatic function that must occur. The exact stage, the visible options, and the cost of each option are computed at runtime from the current world state.

---

## 1. Why this exists

Interactive narratives suffer from a recurring problem: branches that look like choices but converge three sentences later. The diversity is performative, not structural.

Prism targets the **mid-game world texture** — the part between the opening and the ending where most "choices" feel weightless. It does not try to add more endings, more characters, or more branches. It restructures how a single node generates the player's experience.

The core observation:

> Two players reach the same node. Player A approaches it after befriending a side character; player B never met them. The node's options should not be identical — but in most systems, they are.

Prism makes the node's options a **function of world state**, not a fixed list.

---

## 2. Core model

### 2.1 The Crystal

Every node first decomposes into a Crystal — the **invariant dramatic skeleton**.

```yaml
crystal:
  id: <stable-identifier>
  dramatic_function: <one-line statement of what this scene exists to do>
  must_happen:
    - <events that define this scene's identity>
  must_not_happen:
    - <events that would break this scene's identity>
```

A Crystal binds no scene, no characters, no time. It only commits to what must be true for "this scene is still this scene."

### 2.2 The Five Axes

The world is decomposed into five orthogonal axes:

| Axis | Name | Governs | Effect on play |
| --- | --- | --- | --- |
| **S** | Scene Stage | Where the event takes place | Available objects, bystanders, exit cost |
| **H** | Hidden Knowledge | What truths are revealed to whom | Which options can even be conceived |
| **N** | NPC Presence | Who is on stage, off stage, or watching from shadow | Triggerable callbacks and dialogue partners |
| **T** | Time Pressure | Hours until the next irreversible event | Which options have decayed past availability |
| **A** | Ambient Noise | Rumor, weather, mood — the world's reverberation | Multipliers on the cost of each choice |

**Orthogonality property**: changing any single axis does not break the Crystal's `must_happen` constraints. This is what makes combinatorial expansion safe.

### 2.3 The refraction formula

```
WorldSlice = Crystal × (S, H, N, T, A)
```

A WorldSlice is what the player actually encounters: this Crystal, rendered through these specific axis values.

A choice belongs to the Crystal's **candidate pool**, not to any specific Slice. It carries `require` conditions over the axes. At runtime:

```
visible_choices = candidate_pool.filter(c => c.require matches current axes)
displayed_cost  = c.base_cost × A.reverb_multiplier
```

---

## 3. The five axes in depth

### 3.1 S · Scene Stage

The stage governs the **physical and social grammar** of the encounter.

Each candidate stage declares:
- `available_objects` — props the player can invoke
- `bystanders` — default observers
- `exit_cost` — how hard it is to walk away
- `social_register` — formal, intimate, public, hostile, etc.

A confrontation in a public hall versus in a private chamber is not "the same scene with different wallpaper." The player's available moves change.

### 3.2 H · Hidden Knowledge

The single most powerful axis for diversity.

Maintain a table of all knowable facts in the story world. Each fact has a state:

| State | Meaning |
| --- | --- |
| `unknown` | The player has zero evidence of this fact |
| `hinted` | The player has indirect evidence; can act on suspicion |
| `confirmed` | The player has explicit confirmation |

Choices can `require: { H.<fact>: hinted_or_above }`. When a fact's state advances, an entire batch of choices becomes available simultaneously. **Information difference is the most reusable source of replayability.**

For multi-protagonist or multi-perspective narratives, each viewpoint character can have a different H-state for the same fact set. This is how Prism handles perspective switching: same Crystal, different H, different choice pool.

### 3.3 N · NPC Presence

NPCs can be in one of several presence states beyond present/absent:

| State | Triggerable |
| --- | --- |
| `present` | Direct dialogue, all callbacks |
| `off_stage` | Referenced only, no callbacks |
| `watching_from_shadow` | Special callbacks, the player may or may not know they're watching |
| `masked` | Present but disguised; identity-conditional callbacks |

"Half-present" states (shadow, masked) are the most underused source of dramatic variation. They change which callbacks can fire without changing the visible cast.

### 3.4 T · Time Pressure

T does not change what the player wants to do. It changes **what they still have time to do**.

Each Slice declares a time window:

```yaml
time_window:
  upstream_event: <what just happened>
  downstream_event: <what is about to happen, irreversibly>
  hours_remaining: <integer>
```

Choices may declare `require: { T.max_hours: <N> }` — they appear only when time has compressed enough. The same Crystal under T=20 versus T=3 surfaces wholly different play styles: planning versus reaction.

### 3.5 A · Ambient Noise

A is a **cost multiplier**, not an option filter. It captures how loudly the world reacts to player actions.

```yaml
ambient:
  rumor: <public_sympathy | neutral | hostile>
  weather: <calm | rain | snow | storm>
  market_mood: <festive | tense | grieving>
  reverb_multiplier:
    public_action: 1.0 | 1.3 | 2.0
    private_action: 1.0
```

A weak hostile rumor doubles the cost of a defiant choice but also doubles its potential reward if the act is impressive. A blizzard amplifies any choice involving travel or exposure. **A is the axis that prevents the system from feeling sterile** — even when S/H/N/T are constant, an A change makes the world feel responsive.

---

## 4. Choice Pool design

Choices live in a **per-Crystal pool**, not per-Slice. This is the central authoring shift.

```yaml
choice:
  id: <stable-id>
  text: <what the player sees>
  hook: <semantic event name to emit when chosen>
  require:
    S: <stage-id or list>
    N: [<required npc ids>]
    H: <fact-id and state>
    T: { max_hours: <N> }
    A: { rumor: <value> }
  base_cost: <a vector of semantic deltas, not raw numbers>
```

Design rules:

1. **A choice should be writable without knowing which Slice it will appear in.** If you can't describe a choice without referencing a specific stage, your Crystal is too narrow.
2. **`hook` is the only thing the numerical system sees.** Use semantic event names (`vow_loyalty`, `confront_betrayal`) not numbers.
3. **`base_cost` describes the *kind* of cost** (`courage: +`, `family_favor: -`), leaving magnitude to the numerical layer.
4. **Each choice's `require` should disqualify it from at least one plausible Slice.** Choices that always appear are flat; they belong in the Crystal's pre-narration, not the choice pool.

---

## 5. Quality criteria

### 5.1 Real-diversity test

Two Slices of the same Crystal count as genuinely diverse only if at least 2 of 3 conditions hold:

| Criterion | Pass condition |
| --- | --- |
| **Choice asymmetry** | Visible choice sets share at most 60% overlap |
| **Information delta** | At least one H-fact has different state |
| **Cost topology change** | At least one choice's cost vector points in a different direction (sign-change), not just a different magnitude |

Slices that fail this test are "reskins" — they look different but play the same. Reject them.

### 5.2 Anti-patterns to refuse

| Anti-pattern | Symptom | Fix |
| --- | --- | --- |
| Cosmetic Slice | Only S or A changed, choice set identical | Force an H change |
| NPC clone | Same NPC behaves identically across Slices | Vary their presence state, not their lines |
| Decorative T | T axis declared but no choice depends on it | Bind at least one choice to T |
| Silent A | A axis declared but reverb multiplier unused | Apply multiplier in cost calculation |
| Always-on choice | Choice appears in every Slice | Move it to Crystal pre-narration, or add `require` |

---

## 6. Authoring workflow

Five phases. Total time scales with material, not Prism overhead.

### Phase 1 · Crystallize
For each candidate node in the source material, extract `dramatic_function`, `must_happen`, `must_not_happen`. Discard anything specific to one scene.

### Phase 2 · Axis configuration
For each Crystal, list the plausible values on each axis. Do not yet pick combinations.

### Phase 3 · Refraction
Hand-select 3–7 axis combinations per Crystal. Optimize for **dramatic difference**, not coverage. 2⁵ = 32 combinations are mathematically possible; almost all are wasted.

### Phase 4 · Choice pool
Write the candidate choice pool for the Crystal. Each choice with `require` and `hook`.

### Phase 5 · Quality pass
Run §5.1 between every pair of Slices. Cull failures. Confirm no §5.2 anti-patterns.

---

## 7. Integration contract

Prism is one of several layers in an interactive narrative system. It does not own:

- **Numerical state** — how points accumulate, what thresholds trigger what
- **Ending routing** — which combination of state reaches which ending
- **Persona** — character voice, dialogue style, backstory
- **Runtime UI** — how choices are rendered, how scenes transition
- **Multi-user state** — turns, voting, alliances (relevant for social play)

### 7.1 What Prism outputs

| Artifact | Format |
| --- | --- |
| Crystal table | YAML / JSON |
| Slice configurations | YAML / JSON |
| Candidate choice pool with `require` | YAML / JSON |
| `hook` namespace (the list of semantic events the choices emit) | flat list |

### 7.2 What Prism expects from downstream

| Layer | Provides |
| --- | --- |
| Numerical system | Maps each `hook` to its actual state delta |
| Ending routing | Reads accumulated state to pick ending |
| Persona layer | Translates choice's semantic intent into character-appropriate voice |
| UI / runtime | Renders Slice metadata (tone, stage, NPCs) and evaluates `require` against live state |

### 7.3 The `hook` contract

A `hook` is a **stable semantic event name**. It is the only handshake between Prism and the numerical system.

```yaml
# Prism declares
choice:
  id: confront_betrayal
  hook: confront_betrayal
  require: { ... }

# Numerical system maps
hook_table:
  confront_betrayal:
    deltas:
      trust_male_lead: -10
      courage: +5
      public_sympathy: +3
```

Both sides can evolve independently:
- Add a new Slice → no numerical change required
- Rebalance numerical weights → no Prism change required
- Add a new `hook` → both sides add an entry, no schema migration

---

## 8. JSON schema reference

```json
{
  "crystals": [
    {
      "id": "string",
      "dramatic_function": "string",
      "must_happen": ["string"],
      "must_not_happen": ["string"],
      "slices": [
        {
          "id": "string",
          "axes": {
            "S": "stage-id",
            "H": { "fact-id": "unknown | hinted | confirmed" },
            "N": ["npc-id"],
            "T": { "hours_remaining": 0, "upstream": "", "downstream": "" },
            "A": { "rumor": "", "weather": "", "reverb_multiplier": 1.0 }
          },
          "tone_hint": "string"
        }
      ],
      "choice_pool": [
        {
          "id": "string",
          "text": "string",
          "hook": "string",
          "require": {
            "S": "stage-id-or-array",
            "N": ["npc-id"],
            "H": { "fact-id": "state-or-above" },
            "T": { "max_hours": 0 },
            "A": { "rumor": "value" }
          },
          "base_cost": { "<semantic-key>": "+ | ++ | - | --" }
        }
      ]
    }
  ]
}
```

---

## 9. Naming conventions

| Convention | Recommendation |
| --- | --- |
| Crystal IDs | `<act>_<scene_slug>` — stable across drafts |
| Slice IDs | Greek letter for hand-picked Slices (`alpha`, `beta`, `gamma`); UUID otherwise |
| Hook names | `<verb>_<object>` lower_snake — describe the *intent*, not the *outcome* |
| Axis state values | enumerated; never free-form strings |
| H fact IDs | `<entity>_<attribute>` — e.g. `male_lead_illness`, `rival_culprit` |

---

## 10. What Prism is not

To prevent misuse:

- **Not a replacement for branching.** Branching still happens at the macro level (which Crystal comes next). Prism operates inside a Crystal.
- **Not a story generator.** Prism takes authored material and adds combinatorial depth. It does not invent scenes.
- **Not a balancing tool.** Whether the game feels fair is the numerical system's responsibility.
- **Not coupled to a renderer.** Prism's output is data; rendering belongs to UI.
- **Not a personality engine.** How a character speaks is independent of which choices are visible.

---

## Appendix · Glossary

| Term | Definition |
| --- | --- |
| **Crystal** | The invariant dramatic skeleton of a node |
| **Slice** | A Crystal rendered through specific axis values |
| **Axis** | One of the five world dimensions: S, H, N, T, A |
| **Choice pool** | The full set of candidate choices for a Crystal |
| **Hook** | A semantic event name emitted when a choice is taken |
| **Refraction** | The act of computing a Slice from a Crystal × axes |
| **Reverb multiplier** | A scalar from the A axis that scales choice cost |
| **Orthogonality** | Property that any single axis change preserves `must_happen` |

---

*Prism Skill v1.0 · Same story, different worlds.*
