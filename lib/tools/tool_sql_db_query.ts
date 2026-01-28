import { tool } from "ai";
import { z } from "zod";
import { executeDatabricksSQL } from "@/lib/tools/utils_tools";

const DATABRICKS_CATALOG = process.env.DATABRICKS_CATALOG;
const DATABRICKS_SCHEMA = process.env.DATABRICKS_SCHEMA;

const ensureSelectQuery = (sql: string) => {
  const trimmed = sql.trim();

  const statements = trimmed.split(";").filter((s) => s.trim().length > 0);
  if (statements.length > 1) {
    throw new Error("Only a single SELECT statement without additional statements is allowed.");
  }

  const statement = statements[0];

  const isSelectLike =
    /^\s*select\b/i.test(statement) ||
    /^\s*with\b/i.test(statement);

  if (!isSelectLike) {
    throw new Error(
      "Only SELECT queries are allowed. Write operations (INSERT, UPDATE, DELETE, MERGE, etc.) are forbidden."
    );
  }

  const forbiddenKeywords = [
    /\binsert\b/i,
    /\bupdate\b/i,
    /\bdelete\b/i,
    /\bmerge\b/i,
    /\bdrop\b/i,
    /\btruncate\b/i,
    /\bcreate\b/i,
    /\balter\b/i,
    /\bgrant\b/i,
    /\brevoke\b/i,
  ];

  if (forbiddenKeywords.some((re) => re.test(statement))) {
    throw new Error(
      "Write or DDL operations (INSERT, UPDATE, DELETE, MERGE, CREATE, DROP, ...) are not allowed."
    );
  }

  return statement;
};

const qualifyTables = (sql: string) =>
  sql.replace(
    /\b(from|join)\s+([`"]?)([a-z0-9_]+)\2\b/gi,
    (match, keyword, quote, table) => {
      if (table.includes(".")) return match;
      return `${keyword} \`${DATABRICKS_CATALOG}\`.\`${DATABRICKS_SCHEMA}\`.${table}`;
    }
  );

export const tool_sql_db_query = () =>
  tool({
    name: "tool_sql_db_query",
    description: "Execute a SELECT SQL query on the database and returns results.",
    inputSchema: z.object({
      ent_instructions: z
        .string()
        .describe(
          "Very brief instructions on how specific keywords or phrases from the user question should be handled when creating the SQL."
        ),
      sql_reasoning_steps: z
        .string()
        .describe(
          "Very brief description of the reasoning steps for constructing the SQL query (e.g., filters, grouping, sorting)."
        ),
      sql_query: z.string().describe("The SQL Query."),
    }),
    execute: async ({ sql_query }) => {
      const sql = qualifyTables(ensureSelectQuery(sql_query));
      const result = await executeDatabricksSQL(sql);
      return { result };
    },
  });