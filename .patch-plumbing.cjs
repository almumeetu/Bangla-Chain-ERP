const fs = require("fs");

const files = {};
function read(p) { files[p] = fs.readFileSync(p, "utf8"); return files[p]; }
function save(p, c) { fs.writeFileSync(p, c, "utf8"); files[p] = c; }
function apply(p, desc, fn) {
  const before = files[p];
  const after = fn(before);
  if (after === before) { console.log("  ⚠️  UNCHANGED:", desc); return false; }
  save(p, after); console.log("  ✅", desc); return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOCALSTORE.TS — add ClaimSettlement import + key + get/save + AllErpData + clearAllData + restoreAllData + seed
// ─────────────────────────────────────────────────────────────────────────────
console.log("== localStore.ts ==");
read("src/lib/localStore.ts");

apply("src/lib/localStore.ts", "Import ClaimSettlement type", c => {
  if (c.includes("ClaimSettlement")) return c;
  return c.replace(
    "CompanyBrand, Category, UnitOfMeasure, Godown, Route, Claim,",
    "CompanyBrand, Category, UnitOfMeasure, Godown, Route, Claim, ClaimSettlement,"
  );
});

apply("src/lib/localStore.ts", "Add KEYS.claimSettlements", c => {
  if (c.includes("claimSettlements:")) return c;
  return c.replace(
    "  claimReasons:      'erp_claim_reasons',\n} as const;",
    "  claimReasons:      'erp_claim_reasons',\n  claimSettlements:  'erp_claim_settlements',\n} as const;"
  );
});

apply("src/lib/localStore.ts", "Add getClaimSettlements / saveClaimSettlements helpers after ClaimReasons", c => {
  if (c.includes("function getClaimSettlements")) return c;
  const block =
`\n// ── Claim Settlements (Amount received from company for claim) ────────────────\n\nexport function getClaimSettlements(): ClaimSettlement[] {\n  return read<ClaimSettlement[]>(KEYS.claimSettlements, []);\n}\nexport function saveClaimSettlements(items: ClaimSettlement[]): void {\n  write(KEYS.claimSettlements, items);\n}\n`;
  return c.replace(
    "export function saveClaimReasons(items: ClaimReason[]): void {\n  write(KEYS.claimReasons, items);\n}\n\n// ── Load all ──",
    "export function saveClaimReasons(items: ClaimReason[]): void {\n  write(KEYS.claimReasons, items);\n}" + block + "// ── Load all ──"
  );
});

apply("src/lib/localStore.ts", "Add claimSettlements field in AllErpData interface", c => {
  if (/claimSettlements:\s*ClaimSettlement\[\]/.test(c)) return c;
  return c.replace(
    "  claims:            Claim[];\n  claimReasons:      ClaimReason[];\n}",
    "  claims:            Claim[];\n  claimReasons:      ClaimReason[];\n  claimSettlements:  ClaimSettlement[];\n}"
  );
});

apply("src/lib/localStore.ts", "Add claimSettlements in loadAllData() return", c => {
  if (c.includes("claimSettlements: getClaimSettlements()")) return c;
  return c.replace(
    "    claims:            getClaims(),\n    claimReasons:      getClaimReasons(),\n  };",
    "    claims:            getClaims(),\n    claimReasons:      getClaimReasons(),\n    claimSettlements:  getClaimSettlements(),\n  };"
  );
});

apply("src/lib/localStore.ts", "Add saveClaimSettlements([]) in seedInitialData after saveClaims", c => {
  // Seed an empty array (no demo settlements needed)
  if (/\nsaveClaimSettlements\(\[\]\);/.test(c)) return c;
  return c.replace(
    "  saveClaims(INITIAL_CLAIMS);\n\n  localStorage.setItem(KEYS.seeded, 'true');",
    "  saveClaims(INITIAL_CLAIMS);\n  saveClaimSettlements([]);\n\n  localStorage.setItem(KEYS.seeded, 'true');"
  );
});

apply("src/lib/localStore.ts", "Add KEYS.claimSettlements + saveClaimSettlements([]) in clearAllData", c => {
  let changed = c;
  if (!c.includes("KEYS.claimSettlements,\n  ];")) {
    changed = changed.replace(
      "    KEYS.claims,\n  ];",
      "    KEYS.claims,\n    KEYS.claimSettlements,\n  ];"
    );
  }
  if (!/\nsaveClaimSettlements\(\[\]\);/.test(changed)) {
    changed = changed.replace(
      "  saveClaims([]);\n  // Mark seeded = 'cleared'",
      "  saveClaims([]);\n  saveClaimSettlements([]);\n  // Mark seeded = 'cleared'"
    );
  }
  return changed;
});

apply("src/lib/localStore.ts", "Add claimSettlements in restoreAllData", c => {
  if (c.includes("if (data.claimSettlements) saveClaimSettlements(data.claimSettlements);")) return c;
  return c.replace(
    "  if (data.claims)            saveClaims(data.claims);\n  // Mark as seeded",
    "  if (data.claims)            saveClaims(data.claims);\n  if (data.claimSettlements)  saveClaimSettlements(data.claimSettlements);\n  // Mark as seeded"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DB.TS — import ClaimSettlement + upsert/delete + export
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n== db.ts ==");
read("src/lib/db.ts");

apply("src/lib/db.ts", "Import ClaimSettlement type in db.ts imports", c => {
  if (c.includes("ClaimSettlement")) return c;
  return c.replace(
    "  CompanyBrand, Category, UnitOfMeasure, Godown, Route, Claim,",
    "  CompanyBrand, Category, UnitOfMeasure, Godown, Route, Claim, ClaimSettlement,"
  );
});

apply("src/lib/db.ts", "Import getClaimSettlements / saveClaimSettlements from localStore", c => {
  if (c.includes("getClaimSettlements")) return c;
  return c.replace(
    "  getClaims,       saveClaims,\n  getClaimReasons, saveClaimReasons,",
    "  getClaims,       saveClaims,\n  getClaimReasons, saveClaimReasons,\n  getClaimSettlements, saveClaimSettlements,"
  );
});

apply("src/lib/db.ts", "Add upsertClaimSettlement / deleteClaimSettlement functions after deleteClaimReason", c => {
  if (c.includes("export async function upsertClaimSettlement")) return c;
  const block =
`\n// ── Claim Settlements ─────────────────────────────────────────────────────────\n\nexport async function upsertClaimSettlement(cs: ClaimSettlement): Promise<void> {\n  return upsertItem(getClaimSettlements, saveClaimSettlements, cs);\n}\nexport async function deleteClaimSettlement(id: string): Promise<void> {\n  return deleteItem(getClaimSettlements, saveClaimSettlements, id);\n}\n`;
  return c.replace(
    "export async function deleteClaimReason(id: string): Promise<void> {\n  return deleteItem(getClaimReasons, saveClaimReasons, id);\n}\n\n// ── Load all / seed ──",
    "export async function deleteClaimReason(id: string): Promise<void> {\n  return deleteItem(getClaimReasons, saveClaimReasons, id);\n}" + block + "// ── Load all / seed ──"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. USEERPDATA.TS — add claimSettlements state, syncer, return
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n== useErpData.ts ==");
read("src/app/admin/dashboard/useErpData.ts");

apply("useErpData.ts", "Import ClaimSettlement type", c => {
  if (c.includes("ClaimSettlement")) return c;
  return c.replace(
    "  CompanyBrand, Category, UnitOfMeasure, Godown, Route, DeliveryMan, Claim,",
    "  CompanyBrand, Category, UnitOfMeasure, Godown, Route, DeliveryMan, Claim, ClaimSettlement,"
  );
});

apply("useErpData.ts", "Import upsertClaimSettlement / deleteClaimSettlement", c => {
  if (c.includes("upsertClaimSettlement")) return c;
  return c.replace(
    "  upsertClaim,      deleteClaim,\n  upsertClaimReason, deleteClaimReason,",
    "  upsertClaim,      deleteClaim,\n  upsertClaimReason, deleteClaimReason,\n  upsertClaimSettlement, deleteClaimSettlement,"
  );
});

apply("useErpData.ts", "Add claimSettlements field in ErpDataStore interface", c => {
  if (/claimSettlements:\s*ClaimSettlement\[\]/.test(c)) return c;
  c = c.replace(
    "  claims:            Claim[];\n  claimReasons:      ClaimReason[];",
    "  claims:            Claim[];\n  claimReasons:      ClaimReason[];\n  claimSettlements:  ClaimSettlement[];"
  );
  c = c.replace(
    "  syncClaims:            (u: Claim[]            | ((prev: Claim[])            => Claim[]))            => void;\n  syncClaimReasons:      (u: ClaimReason[]      | ((prev: ClaimReason[])      => ClaimReason[]))      => void;",
    "  syncClaims:            (u: Claim[]            | ((prev: Claim[])            => Claim[]))            => void;\n  syncClaimReasons:      (u: ClaimReason[]      | ((prev: ClaimReason[])      => ClaimReason[]))      => void;\n  syncClaimSettlements:  (u: ClaimSettlement[]  | ((prev: ClaimSettlement[])  => ClaimSettlement[]))  => void;"
  );
  c = c.replace(
    "  setClaims:            React.Dispatch<React.SetStateAction<Claim[]>>;\n  setClaimReasons:      React.Dispatch<React.SetStateAction<ClaimReason[]>>;",
    "  setClaims:            React.Dispatch<React.SetStateAction<Claim[]>>;\n  setClaimReasons:      React.Dispatch<React.SetStateAction<ClaimReason[]>>;\n  setClaimSettlements:  React.Dispatch<React.SetStateAction<ClaimSettlement[]>>;"
  );
  return c;
});

apply("useErpData.ts", "Add useState + makeSyncer for claimSettlements", c => {
  if (c.includes("setClaimSettlements = useState")) return c;
  c = c.replace(
    "  const [claims,            setClaims]            = useState<Claim[]>([]);\n  const [claimReasons,      setClaimReasons]      = useState<ClaimReason[]>([]);",
    "  const [claims,            setClaims]            = useState<Claim[]>([]);\n  const [claimReasons,      setClaimReasons]      = useState<ClaimReason[]>([]);\n  const [claimSettlements,  setClaimSettlements]  = useState<ClaimSettlement[]>([]);"
  );
  c = c.replace(
    "  const syncClaims            = makeSyncer(setClaims,            upsertClaim,            deleteClaim);\n  const syncClaimReasons      = makeSyncer(setClaimReasons,      upsertClaimReason,      deleteClaimReason);",
    "  const syncClaims            = makeSyncer(setClaims,            upsertClaim,            deleteClaim);\n  const syncClaimReasons      = makeSyncer(setClaimReasons,      upsertClaimReason,      deleteClaimReason);\n  const syncClaimSettlements  = makeSyncer(setClaimSettlements,  upsertClaimSettlement,  deleteClaimSettlement);"
  );
  return c;
});

apply("useErpData.ts", "Add claimSettlements to return object (3 places: data/sync/set)", c => {
  let changed = c;
  // 1. Data block:
  if (!/claimSettlements,\s*$/.test(changed.split("shopName: _shopName")[0])) {
    changed = changed.replace(
      "    productCategories, units, godowns, routes, claims, claimReasons,\n    shopName: _shopName,",
      "    productCategories, units, godowns, routes, claims, claimReasons, claimSettlements,\n    shopName: _shopName,"
    );
  }
  // 2. Sync block:
  if (!changed.includes("syncClaims, syncClaimReasons, syncClaimSettlements,")) {
    changed = changed.replace(
      "    syncGodowns, syncRoutes, syncClaims, syncClaimReasons,",
      "    syncGodowns, syncRoutes, syncClaims, syncClaimReasons, syncClaimSettlements,"
    );
  }
  // 3. Set block:
  if (!changed.includes("setClaims, setClaimReasons, setClaimSettlements,")) {
    changed = changed.replace(
      "    setCompanies, setProductCategories, setUnits, setGodowns, setRoutes,\n    setClaims, setClaimReasons,",
      "    setCompanies, setProductCategories, setUnits, setGodowns, setRoutes,\n    setClaims, setClaimReasons, setClaimSettlements,"
    );
  }
  return changed;
});

console.log("\n✅ All 3 backend plumbing files patched (localStore / db / useErpData)");
process.exit(0);
