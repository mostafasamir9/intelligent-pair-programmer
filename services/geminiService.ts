import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { File, Message, AnalysisIssue } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const SYSTEM_INSTRUCTION = `You are DevMate, an expert AI Pair Programmer. 
You are helpful, concise, and highly skilled in software engineering best practices.
You have access to the user's current file content.
When providing code, use Markdown code blocks with the appropriate language tag.
If the user asks for a modification, show the modified code clearly.
Focus on clean, readable, and efficient code.
If explaining a concept, be clear and avoid unnecessary jargon unless communicating with an expert.
`;

export const streamChatResponse = async (
  history: Message[],
  currentFile: File | null,
  allFiles: File[],
  userMessage: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const client = getAI();
  
  // Construct context about the project
  const fileContext = currentFile 
    ? `\n\nCurrent Active File: ${currentFile.name} (${currentFile.language})\nContent:\n\`\`\`${currentFile.language}\n${currentFile.content}\n\`\`\``
    : `\n\nNo active file selected. Available files: ${allFiles.map(f => f.name).join(', ')}`;
  
  const prompt = `${userMessage}${fileContext}`;

  // Convert internal message history to API format if needed, 
  // but for simplicity in this stateless wrapper, we will rely on the model 
  // being passed the context in a fresh chat or just use generateContentStream 
  // if we want a single turn response. 
  // However, for a true chat experience, we should use chats.create.
  
  // Mapping history to keep conversation context
  // Note: We only send the last few messages to keep context window manageable if needed,
  // but gemini-3-pro has a large window.
  const historyForModel = history
    .filter(msg => !msg.isError)
    .map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

  const chat = client.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    history: historyForModel
  });

  return chat.sendMessageStream({ message: prompt });
};

export const generateCodeSuggestion = async (
  instruction: string,
  currentCode: string,
  language: string
): Promise<string> => {
  const client = getAI();
  
  const prompt = `
    Task: ${instruction}
    Language: ${language}
    Existing Code:
    \`\`\`${language}
    ${currentCode}
    \`\`\`
    
    Return ONLY the updated code block without markdown formatting or explanation if possible, 
    or just the code block if explanation is absolutely necessary. 
    Preferably just the raw code to replace the existing file content.
  `;

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });

  return response.text || '';
};

export const analyzeCode = async (
  code: string,
  language: string
): Promise<AnalysisIssue[]> => {
  const client = getAI();

  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following ${language} code for syntax errors, logical bugs, and potential runtime issues. 
    Be concise. Only report high-confidence issues. If the code is incomplete but valid so far, ignore it.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                line: { type: Type.INTEGER, description: "Line number where the error occurs (1-based)" },
                message: { type: Type.STRING, description: "Short description of the error" },
                suggestion: { type: Type.STRING, description: "A code snippet or concise advice to fix it" },
                severity: { type: Type.STRING, enum: ["error", "warning", "info"] }
              },
              required: ["message", "severity"]
            }
          }
        }
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{ "issues": [] }');
    return result.issues || [];
  } catch (e) {
    console.error("Failed to parse analysis result", e);
    return [];
  }
};