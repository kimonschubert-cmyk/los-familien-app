const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadApp() {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "index.html"),
    "utf8"
  );

  const match = html.match(
    /<script>([\s\S]*)<\/script>\s*<\/body>/
  );

  if (!match) {
    throw new Error("App-Skript nicht gefunden.");
  }

  const source =
    match[1] +
    `
module.exports = {
  processResults,
  setSearchOrigin(value) {
    searchOrigin = value;
  },
  setState(value) {
    state = { ...state, ...value };
  },
  setLastActivityIds(value) {
    lastActivityIds = value;
  },
  overrideGetDrivingTimes(fn) {
    getDrivingTimes = fn;
  }
};
`;

  const noop = () => {};
  const localStorageStore = new Map();
  const fakeElement = () => ({
    classList: { add: noop, remove: noop },
    innerHTML: "",
    value: "",
    textContent: "",
    checked: false,
    disabled: false,
    focus: noop,
    querySelectorAll: () => [],
    addEventListener: noop
  });

  const math = Object.create(Math);
  math.random = () => 0.25;

  const context = {
    console,
    module: { exports: {} },
    exports: {},
    Math: math,
    Date,
    JSON,
    URL,
    Intl,
    setTimeout,
    clearTimeout,
    window: {
      currentActivities: [],
      addEventListener: noop
    },
    navigator: {},
    document: {
      addEventListener: noop,
      getElementById: fakeElement,
      querySelectorAll: () => []
    },
    localStorage: {
      getItem(key) {
        return localStorageStore.has(key)
          ? localStorageStore.get(key)
          : null;
      },
      setItem(key, value) {
        localStorageStore.set(
          key,
          String(value)
        );
      },
      removeItem(key) {
        localStorageStore.delete(key);
      }
    },
    alert: noop,
    prompt: () => null,
    fetch: async () => {
      throw new Error("fetch darf im Test nicht aufgerufen werden");
    }
  };

  context.window.localStorage =
    context.localStorage;

  vm.createContext(context);
  vm.runInContext(source, context);

  return context.module.exports;
}

function createPlace(
  id,
  name,
  options = {}
) {
  return {
    id,
    displayName: { text: name },
    location: {
      latitude:
        options.latitude ?? 50.202,
      longitude:
        options.longitude ?? 10.077
    },
    currentOpeningHours:
      options.currentOpeningHours,
    regularOpeningHours:
      options.regularOpeningHours,
    businessStatus:
      options.businessStatus,
    rating: options.rating ?? 4.5,
    priceLevel:
      options.priceLevel ??
      "PRICE_LEVEL_INEXPENSIVE"
  };
}

async function run() {
  const app = loadApp();

  app.setSearchOrigin({
    lat: 50.202,
    lon: 10.077,
    name: "Bad Kissingen"
  });

  app.setState({
    driveTime: 30,
    maxBudget: 250,
    weather: "sunny",
    people: [],
    selectedPeople: []
  });

  app.overrideGetDrivingTimes(
    async candidates => {
      candidates.forEach(
        (place, index) => {
          place.driveMinutes =
            15 + index;
          place.roadDistance =
            place.distance;
        }
      );

      return candidates;
    }
  );

  app.setLastActivityIds([]);

  const openPlace = createPlace(
    "open-place",
    "Spielplatz Sonnenschein",
    {
      currentOpeningHours: {
        openNow: true
      }
    }
  );

  const unknownOpeningPlace =
    createPlace(
      "unknown-opening",
      "Spielplatz Regenbogen"
    );

  const strictResult =
    await app.processResults([
      openPlace,
      unknownOpeningPlace
    ]);

  assert(
    strictResult.some(
      place =>
        place.id === "open-place"
    ),
    "Geöffnete Orte sollten bevorzugt bleiben."
  );

  assert(
    strictResult.every(
      place =>
        place.id !==
        "unknown-opening"
    ),
    "Fallback-Orte mit unbekannten Öffnungszeiten dürfen nicht erscheinen, solange geöffnete Treffer vorhanden sind."
  );

  app.setLastActivityIds([]);

  const fallbackUnknownResult =
    await app.processResults([
      unknownOpeningPlace
    ]);

  assert.strictEqual(
    fallbackUnknownResult.length,
    1,
    "Bei fehlenden offenen Treffern soll mindestens ein Ort mit unbekannten Öffnungszeiten angezeigt werden."
  );

  assert.strictEqual(
    fallbackUnknownResult[0].id,
    "unknown-opening"
  );

  app.setLastActivityIds([]);

  const temporarilyClosedPlace =
    createPlace(
      "temporary-closed",
      "Spielplatz Abendrot",
      {
        currentOpeningHours: {
          openNow: false
        },
        businessStatus:
          "CLOSED_TEMPORARILY"
      }
    );

  const temporaryFallbackResult =
    await app.processResults([
      temporarilyClosedPlace
    ]);

  assert.strictEqual(
    temporaryFallbackResult.length,
    1,
    "Vorübergehend geschlossene Orte sollen als letzter Rückfall nutzbar bleiben."
  );

  assert.strictEqual(
    temporaryFallbackResult[0].id,
    "temporary-closed"
  );

  console.log(
    "search-fallback.test.js: ok"
  );
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
