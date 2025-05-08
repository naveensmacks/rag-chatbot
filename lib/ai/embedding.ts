import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

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
