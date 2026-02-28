/**
 * The five scientific fields tracked by the platform.
 * Each field maps to a set of arXiv categories and a curated tag ontology.
 */
export const FIELDS = {
  "comp-bio": {
    id: "comp-bio",
    name: "Computational Biology",
    color: "#10b981", // emerald
    arxivCategories: [
      "q-bio.BM", "q-bio.CB", "q-bio.GN", "q-bio.MN", "q-bio.NC",
      "q-bio.OT", "q-bio.PE", "q-bio.QM", "q-bio.SC", "q-bio.TO",
      "cs.CE", "stat.AP",
    ],
    description: "Genomics, protein engineering, drug discovery, bioinformatics",
  },
  "ml-ai": {
    id: "ml-ai",
    name: "Machine Learning & AI",
    color: "#8b5cf6", // violet
    arxivCategories: [
      "cs.LG", "cs.AI", "cs.CL", "cs.CV", "cs.NE",
      "stat.ML", "cs.IR", "cs.MA",
    ],
    description: "Deep learning, NLP, computer vision, reinforcement learning",
  },
  quantum: {
    id: "quantum",
    name: "Quantum Computing",
    color: "#6366f1", // indigo
    arxivCategories: [
      "quant-ph", "cond-mat.supr-con", "cond-mat.mes-hall",
      "physics.atom-ph",
    ],
    description: "QEC, quantum algorithms, hardware, trapped ions, superconducting qubits",
  },
  "climate-tech": {
    id: "climate-tech",
    name: "Climate Tech",
    color: "#f59e0b", // amber
    arxivCategories: [
      "physics.ao-ph", "physics.geo-ph", "stat.AP",
    ],
    description: "Climate modeling, clean energy, carbon capture, sustainability",
  },
  robotics: {
    id: "robotics",
    name: "Robotics",
    color: "#ef4444", // red
    arxivCategories: [
      "cs.RO", "cs.SY", "eess.SY",
    ],
    description: "Autonomous systems, manipulation, perception, control",
  },
} as const;

export type FieldId = keyof typeof FIELDS;
export const FIELD_IDS = Object.keys(FIELDS) as FieldId[];
