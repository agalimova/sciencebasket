/**
 * Seed initial tag ontology for each field.
 *
 * Creates a base set of tags derived from well-known topics in each field.
 * These will be enriched by LLM extraction from paper abstracts later.
 *
 * Usage: npm run seed
 */

import { db } from "../db";
import { tags, fields as fieldsTable } from "../db/schema";
import { FIELDS, FIELD_IDS } from "../types/fields";
import { eq } from "drizzle-orm";

/** Base ontology per field — manually curated starting points. */
const BASE_ONTOLOGY: Record<string, { name: string; category: string }[]> = {
  "comp-bio": [
    // Techniques
    { name: "Sequence Alignment", category: "technique" },
    { name: "Genome Assembly", category: "technique" },
    { name: "RNA-seq Analysis", category: "technique" },
    { name: "Single-Cell Sequencing", category: "technique" },
    { name: "CRISPR", category: "technique" },
    { name: "Protein Structure Prediction", category: "technique" },
    { name: "Molecular Dynamics", category: "technique" },
    { name: "Phylogenetics", category: "technique" },
    { name: "Metagenomics", category: "technique" },
    { name: "Metabolomics", category: "technique" },
    { name: "Proteomics", category: "technique" },
    { name: "Epigenomics", category: "technique" },
    { name: "Gene Regulatory Networks", category: "technique" },
    { name: "Variant Calling", category: "technique" },
    { name: "Spatial Transcriptomics", category: "technique" },
    { name: "Long-Read Sequencing", category: "technique" },
    { name: "Cryo-EM", category: "technique" },
    // Tools
    { name: "AlphaFold", category: "tool" },
    { name: "BLAST", category: "tool" },
    { name: "Bioconductor", category: "tool" },
    { name: "PyMOL", category: "tool" },
    { name: "Nextflow", category: "tool" },
    { name: "Snakemake", category: "tool" },
    { name: "Scanpy", category: "tool" },
    { name: "Seurat", category: "tool" },
    { name: "DESeq2", category: "tool" },
    { name: "Rosetta", category: "tool" },
    { name: "GROMACS", category: "tool" },
    // Concepts
    { name: "Drug Discovery", category: "concept" },
    { name: "Precision Medicine", category: "concept" },
    { name: "Cancer Genomics", category: "concept" },
    { name: "Population Genetics", category: "concept" },
    { name: "Systems Biology", category: "concept" },
    { name: "Synthetic Biology", category: "concept" },
    { name: "Protein Engineering", category: "concept" },
    { name: "Neuroscience", category: "concept" },
    { name: "Immunoinformatics", category: "concept" },
    { name: "Structural Biology", category: "concept" },
    // Languages / Platforms
    { name: "Python", category: "tool" },
    { name: "R", category: "tool" },
    { name: "Julia", category: "tool" },
    { name: "AWS", category: "tool" },
    { name: "HPC", category: "tool" },
  ],
  "ml-ai": [
    // Techniques
    { name: "Deep Learning", category: "technique" },
    { name: "Reinforcement Learning", category: "technique" },
    { name: "Transfer Learning", category: "technique" },
    { name: "Self-Supervised Learning", category: "technique" },
    { name: "Federated Learning", category: "technique" },
    { name: "Attention Mechanisms", category: "technique" },
    { name: "Diffusion Models", category: "technique" },
    { name: "GANs", category: "technique" },
    { name: "Graph Neural Networks", category: "technique" },
    { name: "Neural Architecture Search", category: "technique" },
    { name: "Knowledge Distillation", category: "technique" },
    { name: "Contrastive Learning", category: "technique" },
    { name: "Few-Shot Learning", category: "technique" },
    { name: "Continual Learning", category: "technique" },
    { name: "Bayesian Deep Learning", category: "technique" },
    { name: "Model Compression", category: "technique" },
    { name: "Fine-Tuning", category: "technique" },
    { name: "RLHF", category: "technique" },
    // Domains
    { name: "NLP", category: "concept" },
    { name: "Computer Vision", category: "concept" },
    { name: "Speech Recognition", category: "concept" },
    { name: "Recommender Systems", category: "concept" },
    { name: "Autonomous Driving", category: "concept" },
    { name: "AI Safety", category: "concept" },
    { name: "Interpretability", category: "concept" },
    { name: "Multimodal Learning", category: "concept" },
    { name: "Code Generation", category: "concept" },
    { name: "Embodied AI", category: "concept" },
    { name: "AI Agents", category: "concept" },
    // Tools
    { name: "PyTorch", category: "tool" },
    { name: "TensorFlow", category: "tool" },
    { name: "JAX", category: "tool" },
    { name: "Hugging Face", category: "tool" },
    { name: "CUDA", category: "tool" },
    { name: "MLflow", category: "tool" },
    { name: "Weights & Biases", category: "tool" },
    { name: "LangChain", category: "tool" },
    { name: "vLLM", category: "tool" },
    // Models
    { name: "Transformers", category: "concept" },
    { name: "LLMs", category: "concept" },
    { name: "Vision Transformers", category: "concept" },
    { name: "Mixture of Experts", category: "concept" },
    { name: "State Space Models", category: "concept" },
  ],
  quantum: [
    // Hardware
    { name: "Superconducting Qubits", category: "concept" },
    { name: "Trapped Ions", category: "concept" },
    { name: "Neutral Atoms", category: "concept" },
    { name: "Photonic Systems", category: "concept" },
    { name: "Silicon Qubits", category: "concept" },
    { name: "Topological Qubits", category: "concept" },
    { name: "NV Centers", category: "concept" },
    { name: "Transmon", category: "concept" },
    { name: "Fluxonium", category: "concept" },
    // QEC
    { name: "Quantum Error Correction", category: "technique" },
    { name: "Surface Codes", category: "technique" },
    { name: "LDPC Codes", category: "technique" },
    { name: "Color Codes", category: "technique" },
    { name: "Floquet Codes", category: "technique" },
    { name: "Magic State Distillation", category: "technique" },
    { name: "Fault-Tolerant Computing", category: "technique" },
    // Algorithms
    { name: "Quantum Algorithms", category: "technique" },
    { name: "VQE", category: "technique" },
    { name: "QAOA", category: "technique" },
    { name: "Quantum Simulation", category: "technique" },
    { name: "Quantum Machine Learning", category: "technique" },
    // Tools
    { name: "Qiskit", category: "tool" },
    { name: "Cirq", category: "tool" },
    { name: "Stim", category: "tool" },
    { name: "PyMatching", category: "tool" },
    { name: "PennyLane", category: "tool" },
    { name: "Amazon Braket", category: "tool" },
    // Other
    { name: "Quantum Networking", category: "concept" },
    { name: "Quantum Sensing", category: "concept" },
    { name: "Quantum Chemistry", category: "concept" },
    { name: "Post-Quantum Cryptography", category: "concept" },
    { name: "Quantum Advantage", category: "concept" },
    { name: "NISQ", category: "concept" },
  ],
  "climate-tech": [
    { name: "Climate Modeling", category: "technique" },
    { name: "Carbon Capture", category: "concept" },
    { name: "Renewable Energy", category: "concept" },
    { name: "Battery Technology", category: "concept" },
    { name: "Solar Cells", category: "concept" },
    { name: "Wind Energy", category: "concept" },
    { name: "Hydrogen Economy", category: "concept" },
    { name: "Earth Observation", category: "technique" },
    { name: "Remote Sensing", category: "technique" },
    { name: "Weather Prediction", category: "technique" },
    { name: "Ocean Modeling", category: "technique" },
    { name: "Energy Storage", category: "concept" },
    { name: "Smart Grid", category: "concept" },
    { name: "Carbon Accounting", category: "concept" },
    { name: "Life Cycle Assessment", category: "technique" },
    { name: "Materials Discovery", category: "concept" },
    { name: "Sustainable Agriculture", category: "concept" },
    { name: "Geothermal Energy", category: "concept" },
    { name: "Nuclear Fusion", category: "concept" },
    { name: "Electric Vehicles", category: "concept" },
    { name: "Power Electronics", category: "concept" },
    // Tools
    { name: "CESM", category: "tool" },
    { name: "WRF", category: "tool" },
    { name: "Google Earth Engine", category: "tool" },
    { name: "OpenFOAM", category: "tool" },
  ],
  robotics: [
    // Techniques
    { name: "SLAM", category: "technique" },
    { name: "Motion Planning", category: "technique" },
    { name: "Grasp Planning", category: "technique" },
    { name: "Inverse Kinematics", category: "technique" },
    { name: "Imitation Learning", category: "technique" },
    { name: "Sim-to-Real Transfer", category: "technique" },
    { name: "Visual Servoing", category: "technique" },
    { name: "Sensor Fusion", category: "technique" },
    { name: "Optimal Control", category: "technique" },
    { name: "Model Predictive Control", category: "technique" },
    { name: "Swarm Robotics", category: "technique" },
    { name: "Human-Robot Interaction", category: "technique" },
    { name: "Tactile Sensing", category: "technique" },
    // Concepts
    { name: "Autonomous Navigation", category: "concept" },
    { name: "Manipulation", category: "concept" },
    { name: "Legged Locomotion", category: "concept" },
    { name: "Aerial Robots (UAV)", category: "concept" },
    { name: "Underwater Robots", category: "concept" },
    { name: "Soft Robotics", category: "concept" },
    { name: "Surgical Robotics", category: "concept" },
    { name: "Warehouse Automation", category: "concept" },
    { name: "Self-Driving Cars", category: "concept" },
    // Tools
    { name: "ROS", category: "tool" },
    { name: "ROS2", category: "tool" },
    { name: "MuJoCo", category: "tool" },
    { name: "Isaac Sim", category: "tool" },
    { name: "Gazebo", category: "tool" },
    { name: "PyBullet", category: "tool" },
    { name: "OpenCV", category: "tool" },
    { name: "LiDAR", category: "tool" },
  ],
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureFieldsExist() {
  for (const fieldId of FIELD_IDS) {
    const field = FIELDS[fieldId];
    const existing = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.id, fieldId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(fieldsTable).values({
        id: fieldId,
        name: field.name,
        color: field.color,
        description: field.description,
      });
    }
  }
}

async function main() {
  console.log("=== Seeding tag ontology ===\n");

  await ensureFieldsExist();

  let total = 0;
  for (const fieldId of FIELD_IDS) {
    const ontology = BASE_ONTOLOGY[fieldId];
    if (!ontology) {
      console.log(`  No ontology defined for ${fieldId}, skipping.`);
      continue;
    }

    let fieldCount = 0;
    for (const tag of ontology) {
      const slug = slugify(tag.name);
      try {
        await db
          .insert(tags)
          .values({
            slug,
            name: tag.name,
            fieldId,
            category: tag.category,
          })
          .onConflictDoNothing();
        fieldCount++;
      } catch {
        // already exists
      }
    }
    console.log(`  ${FIELDS[fieldId].name}: ${fieldCount} tags seeded`);
    total += fieldCount;
  }

  console.log(`\nTotal: ${total} tags seeded across ${FIELD_IDS.length} fields.`);
}

main().catch(console.error);
