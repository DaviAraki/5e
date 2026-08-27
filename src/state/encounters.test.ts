// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Encounter, isEncountersStorageHealthy, useEncounters } from "@/state/encounters";

const GOBLIN = "goblin|xmm";
const BUGBEAR = "bugbear|xmm";

const VALID_ENCOUNTER: Encounter = {
  id: "e1",
  name: "Cave Ambush",
  createdAt: "2024-01-01T00:00:00.000Z",
  monsters: { [GOBLIN]: 3 },
};

/** Read back an encounter, failing loudly if the indexed access is undefined. */
function encounter(id: string): Encounter {
  const e = useEncounters.getState().encounters[id];
  if (!e) throw new Error(`encounter ${id} not found`);
  return e;
}

function reset() {
  useEncounters.setState({ encounters: {}, activeEncounterId: null });
}

describe("encounter management", () => {
  beforeEach(reset);

  it("creates an encounter, sets it active, and trims a blank name", () => {
    const id = useEncounters.getState().createEncounter("  Boss Fight  ");
    expect(encounter(id).name).toBe("Boss Fight");
    expect(useEncounters.getState().activeEncounterId).toBe(id);
  });

  it("falls back to a default name when given an empty string", () => {
    const id = useEncounters.getState().createEncounter("   ");
    expect(encounter(id).name).toBe("New Encounter");
  });

  it("renames and deletes an encounter", () => {
    const id = useEncounters.getState().createEncounter("A");
    useEncounters.getState().renameEncounter(id, "Renamed");
    expect(encounter(id).name).toBe("Renamed");
    useEncounters.getState().deleteEncounter(id);
    expect(useEncounters.getState().encounters[id]).toBeUndefined();
    expect(useEncounters.getState().activeEncounterId).toBeNull();
  });

  it("reassigns active to the earliest remaining encounter on delete", () => {
    const first = useEncounters.getState().createEncounter("First");
    const second = useEncounters.getState().createEncounter("Second");
    useEncounters.getState().setActiveEncounter(second);
    useEncounters.getState().deleteEncounter(second);
    expect(useEncounters.getState().activeEncounterId).toBe(first);
  });

  it("ignores setActiveEncounter for an unknown id", () => {
    const id = useEncounters.getState().createEncounter("A");
    useEncounters.getState().setActiveEncounter("does-not-exist");
    expect(useEncounters.getState().activeEncounterId).toBe(id);
  });
});

describe("monster counts", () => {
  let id: string;

  beforeEach(() => {
    reset();
    id = useEncounters.getState().createEncounter("A");
  });

  it("addMonster sets count to 1, then increments", () => {
    const { addMonster, incMonster } = useEncounters.getState();
    addMonster(id, GOBLIN);
    expect(encounter(id).monsters[GOBLIN]).toBe(1);
    addMonster(id, GOBLIN);
    incMonster(id, GOBLIN);
    expect(encounter(id).monsters[GOBLIN]).toBe(3);
  });

  it("decMonster removes the entry when the count would drop to zero", () => {
    const { addMonster, decMonster } = useEncounters.getState();
    addMonster(id, GOBLIN);
    addMonster(id, GOBLIN); // 2
    decMonster(id, GOBLIN);
    expect(encounter(id).monsters[GOBLIN]).toBe(1);
    decMonster(id, GOBLIN);
    expect(GOBLIN in encounter(id).monsters).toBe(false);
  });

  it("setCount clamps non-integers and removes on <= 0", () => {
    const { addMonster, setCount } = useEncounters.getState();
    addMonster(id, GOBLIN);
    setCount(id, GOBLIN, 4.9);
    expect(encounter(id).monsters[GOBLIN]).toBe(4);
    setCount(id, GOBLIN, 0);
    expect(GOBLIN in encounter(id).monsters).toBe(false);
  });

  it("removeMonster drops the entry without touching others", () => {
    const { addMonster, removeMonster } = useEncounters.getState();
    addMonster(id, GOBLIN);
    addMonster(id, BUGBEAR);
    removeMonster(id, GOBLIN);
    const monsters = encounter(id).monsters;
    expect(GOBLIN in monsters).toBe(false);
    expect(monsters[BUGBEAR]).toBe(1);
  });

  it("all monster ops are no-ops on an unknown encounter id", () => {
    const before = useEncounters.getState().encounters;
    useEncounters.getState().addMonster("nope", GOBLIN);
    useEncounters.getState().incMonster("nope", GOBLIN);
    useEncounters.getState().decMonster("nope", GOBLIN);
    useEncounters.getState().removeMonster("nope", GOBLIN);
    useEncounters.getState().setCount("nope", GOBLIN, 5);
    expect(useEncounters.getState().encounters).toBe(before);
  });
});

/**
 * The persist `merge` function is the trust boundary for localStorage. Anyone
 * with DOM access can write arbitrary bytes into the encounters key; these
 * tests guarantee the store stays well-typed regardless of what's on disk.
 */
function seedLocalStorage(raw: unknown): void {
  localStorage.setItem(
    "5etools-react/encounters",
    JSON.stringify({ state: { encounters: raw }, version: 1 }),
  );
}

describe("persist hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    reset();
  });

  it("accepts a valid persisted encounters payload", async () => {
    seedLocalStorage({ e1: VALID_ENCOUNTER });
    await useEncounters.persist.rehydrate();
    expect(useEncounters.getState().encounters.e1).toEqual(VALID_ENCOUNTER);
  });

  it("drops encounters when localStorage holds malformed-shape entries", async () => {
    seedLocalStorage({ e1: { id: 123, name: "bad" } }); // wrong types
    await useEncounters.persist.rehydrate();
    expect(useEncounters.getState().encounters).toEqual({});
    expect(useEncounters.getState().activeEncounterId).toBeNull();
  });

  it("drops encounters when localStorage is a non-object value", async () => {
    seedLocalStorage("not-an-object");
    await useEncounters.persist.rehydrate();
    expect(useEncounters.getState().encounters).toEqual({});
  });

  it("drops an encounter whose id collides with a prototype key", async () => {
    seedLocalStorage({ __proto__: { ...VALID_ENCOUNTER, id: "__proto__" } });
    await useEncounters.persist.rehydrate();
    expect(useEncounters.getState().encounters).toEqual({});
  });

  it("coerces non-positive / non-integer counts by dropping or flooring them", async () => {
    seedLocalStorage({
      e1: {
        ...VALID_ENCOUNTER,
        monsters: {
          [GOBLIN]: 2.9, // floored to 2
          [BUGBEAR]: 0, // dropped (non-positive)
          "dragon|xmm": -1, // dropped (non-positive)
        },
      },
    });
    await useEncounters.persist.rehydrate();
    const monsters = encounter("e1").monsters;
    expect(monsters[GOBLIN]).toBe(2);
    expect(BUGBEAR in monsters).toBe(false);
    expect("dragon|xmm" in monsters).toBe(false);
  });

  it("preserves multiple valid encounters across rehydration", async () => {
    seedLocalStorage({
      e1: { ...VALID_ENCOUNTER, id: "e1" },
      e2: { ...VALID_ENCOUNTER, id: "e2", name: "Boss Fight" },
    });
    await useEncounters.persist.rehydrate();
    expect(Object.keys(useEncounters.getState().encounters).sort()).toEqual(["e1", "e2"]);
  });

  it("handles an empty encounters payload without crashing", async () => {
    seedLocalStorage({});
    await useEncounters.persist.rehydrate();
    expect(useEncounters.getState().encounters).toEqual({});
  });
});

describe("storage health tracking", () => {
  // NOTE: stays last — isEncountersStorageHealthy latches to false for the
  // rest of this module's lifetime once a failure is recorded.
  it("flags storage as unhealthy when localStorage access throws", () => {
    expect(isEncountersStorageHealthy()).toBe(true);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    try {
      // Any store write goes through trackedStorage.setItem; a throwing
      // localStorage must flip the health flag instead of only logging.
      useEncounters.getState().createEncounter("X");
      expect(isEncountersStorageHealthy()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
