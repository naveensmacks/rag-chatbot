import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "../db";
import { AnyColumn, cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";

const embeddingModel = openai.embedding("text-embedding-ada-002");

const generateChunks = (input: string): string[] => {
  console.log("inside generateChunks input : ", input);
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  try {
    const chunks = generateChunks(value);
    console.log("inside generateEmbeddings chunks : ", chunks);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    });
    console.log("inside generateEmbeddings embeddings : ", embeddings);
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
  } catch (error) {
    console.error("Error in generateEmbeddings:", error);
    throw error;
  }
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  console.log("inside findRelevantContent userQuery : ", userQuery);
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding as unknown as AnyColumn,
    userQueryEmbedded
  )})`;

  // // Create a type-safe similarity calculation
  // const similarityExpression = (embeddings: any) => {
  //   return sql`1 - (${cosineDistance(
  //     embeddings.embedding,
  //     userQueryEmbedded
  //   )})`.as("similarity");
  // };
  // const similarGuides = await db
  //   .select({
  //     name: embeddings.content,
  //     similarity: similarityExpression(embeddings),
  //   })
  //   .from(embeddings)
  //   .where(gt(similarityExpression(embeddings), 0.5))
  //   .orderBy((t) => desc(t.similarity))
  //   .limit(4);

  console.log("similarity : ", similarity);
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  console.log("similarGuides : ", similarGuides);
  return similarGuides;
};
