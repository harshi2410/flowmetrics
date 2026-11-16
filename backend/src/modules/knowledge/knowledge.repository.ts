import crypto from "node:crypto";
import { query } from "../../db/pool.js";

export interface KnowledgeDocumentRow {
  id: string;
  organization_id: string;
  title: string;
  source_type: string;
  content: string;
  status: "indexed" | "processing" | "failed";
  chunk_count: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface KnowledgeChunkRow {
  id: string;
  organization_id: string;
  document_id: string;
  document_title?: string;
  chunk_index: number;
  content: string;
  token_count: number;
  embedding: number[];
  metadata: Record<string, any>;
  similarity?: number;
  created_at: Date;
}

// In-Memory Fallback
const memDocs = new Map<string, KnowledgeDocumentRow>();
const memChunks = new Map<string, KnowledgeChunkRow[]>();

/**
 * Computes deterministic normalized pseudo-vector representation
 * for semantic cosine similarity search.
 */
function computeEmbedding(text: string): number[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const vector = new Array(32).fill(0);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % 32;
    vector[idx] += 1;
  }
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => Number((v / magnitude).toFixed(4)));
}

function cosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return 0;
  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  return Math.max(0, Math.min(1, Number(dot.toFixed(4))));
}

export class KnowledgeRepository {
  async createDocument(
    orgId: string,
    title: string,
    sourceType: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeDocumentRow> {
    const docId = crypto.randomUUID();
    const chunks = this.chunkText(content);
    const chunkCount = chunks.length;

    try {
      const docSql = `
        INSERT INTO knowledge_documents (id, organization_id, title, source_type, content, status, chunk_count, metadata)
        VALUES ($1, $2, $3, $4, $5, 'indexed', $6, $7::jsonb)
        RETURNING *
      `;
      const docRes = await query<KnowledgeDocumentRow>(docSql, [
        docId,
        orgId,
        title,
        sourceType,
        content,
        chunkCount,
        JSON.stringify(metadata),
      ]);

      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const emb = computeEmbedding(chunkText);
        const chunkSql = `
          INSERT INTO knowledge_chunks (organization_id, document_id, chunk_index, content, token_count, embedding, metadata)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
        `;
        await query(chunkSql, [
          orgId,
          docId,
          i,
          chunkText,
          Math.round(chunkText.length / 4),
          JSON.stringify(emb),
          JSON.stringify(metadata),
        ]);
      }

      if (docRes.rowCount > 0 && docRes.rows[0]) return docRes.rows[0];
    } catch {
      // fallback
    }

    const doc: KnowledgeDocumentRow = {
      id: docId,
      organization_id: orgId,
      title,
      source_type: sourceType,
      content,
      status: "indexed",
      chunk_count: chunkCount,
      metadata,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memDocs.set(docId, doc);

    const chunkRows: KnowledgeChunkRow[] = chunks.map((c, idx) => ({
      id: crypto.randomUUID(),
      organization_id: orgId,
      document_id: docId,
      document_title: title,
      chunk_index: idx,
      content: c,
      token_count: Math.round(c.length / 4),
      embedding: computeEmbedding(c),
      metadata,
      created_at: new Date(),
    }));
    memChunks.set(docId, chunkRows);

    return doc;
  }

  async listDocuments(orgId: string): Promise<KnowledgeDocumentRow[]> {
    try {
      const sql = `SELECT * FROM knowledge_documents WHERE organization_id = $1 ORDER BY created_at DESC`;
      const res = await query<KnowledgeDocumentRow>(sql, [orgId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    let list = Array.from(memDocs.values()).filter((d) => d.organization_id === orgId);
    if (list.length === 0) {
      // Seed default runbook for demo resilience
      const seedDoc = await this.createDocument(
        orgId,
        "RUNBOOK-101: Webhook Ingress Gateway 504 Timeout Troubleshooting",
        "runbook",
        "When high webhook volume causes 504 Gateway Timeouts, investigate Redis connection pool saturation and Envoy ingress worker thread exhaustion. Steps: 1. Verify Redis cluster CPU and memory headroom. 2. Scale up replica pods using kubectl scale deployment webhook-receiver --replicas=12. 3. Check client connection keep-alive headers. 4. If error rate > 5%, enable fallback rate limiting.",
        { category: "infrastructure", tags: ["envoy", "redis", "gateway", "504"] }
      );
      return [seedDoc];
    }
    return list;
  }

  async queryKnowledge(orgId: string, searchPhrase: string, limit: number = 5): Promise<KnowledgeChunkRow[]> {
    const queryVector = computeEmbedding(searchPhrase);
    const searchTerms = searchPhrase.toLowerCase().split(/\s+/).filter(Boolean);

    try {
      const sql = `
        SELECT 
          c.*,
          d.title AS document_title
        FROM knowledge_chunks c
        JOIN knowledge_documents d ON d.id = c.document_id
        WHERE c.organization_id = $1
      `;
      const res = await query<KnowledgeChunkRow>(sql, [orgId]);
      if (res.rowCount > 0) {
        return this.rankChunks(res.rows, queryVector, searchTerms, limit);
      }
    } catch {
      // fallback
    }

    const orgDocs = Array.from(memDocs.values()).filter((d) => d.organization_id === orgId);
    if (orgDocs.length === 0) {
      await this.listDocuments(orgId); // triggers seed
    }

    const allChunks: KnowledgeChunkRow[] = [];
    for (const doc of Array.from(memDocs.values()).filter((d) => d.organization_id === orgId)) {
      const chunks = memChunks.get(doc.id) || [];
      allChunks.push(...chunks);
    }

    return this.rankChunks(allChunks, queryVector, searchTerms, limit);
  }

  private rankChunks(
    chunks: KnowledgeChunkRow[],
    queryVector: number[],
    searchTerms: string[],
    limit: number
  ): KnowledgeChunkRow[] {
    const scored = chunks.map((chunk) => {
      let emb = chunk.embedding;
      if (typeof emb === "string") {
        try {
          emb = JSON.parse(emb);
        } catch {
          emb = computeEmbedding(chunk.content);
        }
      } else if (!Array.isArray(emb) || emb.length === 0) {
        emb = computeEmbedding(chunk.content);
      }

      const vectorSim = cosineSimilarity(queryVector, emb);

      // Hybrid boost for exact keyword matches
      const contentLower = chunk.content.toLowerCase();
      let matchCount = 0;
      for (const term of searchTerms) {
        if (contentLower.includes(term)) matchCount++;
      }
      const keywordBoost = searchTerms.length > 0 ? (matchCount / searchTerms.length) * 0.3 : 0;
      const totalScore = Math.min(1.0, Number((vectorSim * 0.7 + keywordBoost).toFixed(4)));

      return {
        ...chunk,
        similarity: totalScore,
      };
    });

    scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return scored.slice(0, limit);
  }

  private chunkText(text: string, chunkSizeWords: number = 100, overlapWords: number = 20): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= chunkSizeWords) return [text];

    const chunks: string[] = [];
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSizeWords, words.length);
      chunks.push(words.slice(start, end).join(" "));
      if (end >= words.length) break;
      start += chunkSizeWords - overlapWords;
    }
    return chunks;
  }
}

export const knowledgeRepository = new KnowledgeRepository();
