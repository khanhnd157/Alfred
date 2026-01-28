import { tool} from "ai";
import { z } from "zod";
import neo4j from "neo4j-driver";
import type { NextApiRequest, NextApiResponse } from "next";

const NEO4J_URI = process.env.NEO4J_URI!;
const NEO4J_USER = process.env.NEO4J_USER!;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!;

export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

export const getSession = (database = "neo4j") => driver.session({ database });

export const tool_neo4j_query = () =>
  tool({
    name: "tool_neo4j_query",
    description:
      "Execute a Cypher query on Neo4j and returns the results.",
    inputSchema: z.object({
      cypher: z.string().describe(
        "A valid Cypher query, e.g., MATCH (n) RETURN n LIMIT 5",
      ),
    }),
    execute: async ({ cypher }) => {
      const session = getSession();

      try {
        const result = await session.run(cypher);
        const data = result.records.map((r) => r.toObject());

        return { data };
      } catch (err: unknown) {
        console.error("Neo4j query error:", err);

        return {
          error:
            err instanceof Error ? err.message : "Unknown Neo4j error",
        };
      } finally {
        await session.close();
      }
    },
  });