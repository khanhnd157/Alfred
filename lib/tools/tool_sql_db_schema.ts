import { tool } from "ai";
import { z } from "zod";
import { executeDatabricksSQL } from "@/lib/tools/utils_tools";

const DATABRICKS_CATALOG = process.env.DATABRICKS_CATALOG!;
const DATABRICKS_SCHEMA = process.env.DATABRICKS_SCHEMA!;
const topkcolumns = 4;

export const tool_sql_db_schema = () =>
  tool({
      name: "sql_db_schema",
      description: "Returns schema information and sample rows for a given table.",
      inputSchema: z.object({ tableName: z.string() }),
      execute: async ({ tableName }) => {

        const schema = await executeDatabricksSQL(
          `DESCRIBE TABLE \`${DATABRICKS_CATALOG}\`.\`${DATABRICKS_SCHEMA}\`.\`${tableName}\`;`,
        );
        const preview = await executeDatabricksSQL(
          `SELECT * FROM \`${DATABRICKS_CATALOG}\`.\`${DATABRICKS_SCHEMA}\`.\`${tableName}\` LIMIT ${topkcolumns};`,
        );
        return { schema, preview };
      },
    });