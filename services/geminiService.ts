
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProcessedFrame, AnalysisResult, Language, ShotData } from "../types";
import { cropToVertical9_16 } from "../utils/videoUtils";

const getClient = (apiKey?: string) => {
  // 1. Use explicitly provided key (highest priority, from UI state)
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  // 2. Try to get the key from LocalStorage (User provided persistence)
  let key = localStorage.getItem("gemini_api_key");

  // 3. Fallback to process.env if available (Dev/Build time config)
  if (!key && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }
  
  if (!key) {
    throw new Error("API Key is missing. Please click the Key icon in the top right to enter your Google Gemini API Key.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const analyzeVideoFrames = async (
  frames: ProcessedFrame[], 
  fileName: string,
  language: Language = 'en',
  apiKey?: string
): Promise<AnalysisResult> => {
  const ai = getClient(apiKey);

  const isZh = language === 'zh';

  let systemInstruction = "";

  if (isZh) {
    systemInstruction = `你是一位专业的电影剪辑师和场记。
    我将提供一段视频（文件名："${fileName}"）的**超高密度**截图序列。
    
    你的任务是重建场景并生成一份详细的“分镜表”（Spotting Sheet）。
    
    **关键要求：所有输出内容必须完全使用简体中文。**
    
    请仔细观察画面变化，识别每一个镜头切换点（Cut）。这是一个高帧率采样序列，不要遗漏任何一个镜头，也不要过度敏感将一个镜头识别成多个镜头。

        **重要**：只有在以下情况才算镜头切换：
        1. 画面发生明显的硬切（Hard Cut）- 场景、角度、景别发生显著变化
        2. 转场效果（淡入淡出、划像等）
        3. 时间或空间的明显跳跃
        
        **不要**将以下情况识别为镜头切换：
        - 同一镜头内的人物移动或镜头晃动
        - 轻微的光线变化
        - 画面内物体的移动
        - 同一镜头内的缓慢推拉摇移
        
        如果不确定是否为镜头切换，倾向于将其视为同一镜头的延续。
    
    对于每个镜头，请根据画面推断以下信息：
    1. 开始和结束时间 (Start/End Time)：必须严格根据提供的截图时间戳来确定。如果两张截图之间画面发生显著突变，即为切点。
    2. 景别 (Size)：必须使用中文术语（如：特写, 近景, 中景, 全景, 大全景, 远景）。
    3. 运镜 (Movement)：必须使用中文术语（如：固定, 摇镜头, 推, 拉, 跟拍, 手持, 升降）。
    4. 画面描述 (Description)：用中文简要描述画面内容和动作。
    5. 人声/对白 (Audio)：根据人物口型和语境推断（如：“男主角说话”，“沉默”，“人群嘈杂”）。
    6. 音效 (SFX)：推断可能的音效（如：“脚步声”，“爆炸声”，“汽车经过”）。
    7. 缩略图索引 (Thumbnail Index)：最能代表该镜头的图片索引。
    
    请以 JSON 格式返回数据。`;
  } else {
    systemInstruction = `You are an expert film editor and script supervisor. 
    I will provide an **ULTRA-DENSE** sequence of image frames extracted from a video file named "${fileName}". 
    
    Your task is to reconstruct the scene and generate a detailed 'Shot List' (Spotting Sheet).
    
    This is a high-framerate sample. Identify every single cut.
        Carefully observe the visual changes and identify **clear shot transitions (Cuts)**.
        **Important**: Only consider the following as shot changes:
        1. Obvious hard cuts - significant changes in scene, angle, or shot size
        2. Transition effects (fade in/out, wipes, etc.)
        3. Clear jumps in time or space
        
        **Do NOT** identify the following as shot changes:
        - Character movement or camera shake within the same shot
        - Minor lighting changes
        - Movement of objects within the frame
        - Slow push/pull/pan/tilt within the same shot
        
        When in doubt, prefer to treat it as a continuation of the same shot.
    
    For each shot, infer the following based strictly on visual evidence and context:
    1. Start and End Time (Use the timestamps provided with images). Look for visual cuts between timestamps.
    2. Shot Size (e.g., ECU, CU, MCU, MS, MLS, LS, VLS).
    3. Camera Movement (e.g., Static, Pan, Tilt, Zoom, Dolly, Tracking, Handheld).
    4. Description: A concise breakdown of the action.
    5. Audio/Dialogue: Infer likely dialogue or voiceover based on character mouth movements and context.
    6. SFX: Infer likely sound effects.
    7. Thumbnail Index: The index of the frame that best represents this shot (pick the middle frame of the sequence).
    
    Return the data as a JSON object.`;
  }

  const parts: any[] = [];
  parts.push({ text: systemInstruction });

  // ULTRA-DENSE CONFIG
  // Increased MAX_FRAMES to 300 because we reduced image size to 256px in frameExtractor.
  // 300 frames * ~10KB = ~3MB, which is safe.
  const MAX_FRAMES = 300;
  const framesToSend = frames.length > MAX_FRAMES ? frames.filter((_, i) => i % Math.ceil(frames.length / MAX_FRAMES) === 0) : frames;

  framesToSend.forEach((frame, index) => {
    parts.push({
      text: `[Frame Index: ${index}, Timestamp: ${frame.timestamp.toFixed(2)}s]`
    });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: frame.data
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { 
              type: Type.STRING, 
              description: isZh ? "片段标题 (中文)" : "A creative title for this scene/clip" 
            },
            summary: { 
              type: Type.STRING, 
              description: isZh ? "片段总结 (中文)" : "A 2-sentence summary of the overall video clip." 
            },
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER },
                  startTime: { type: Type.STRING, description: "Format: MM:SS" },
                  endTime: { type: Type.STRING, description: "Format: MM:SS" },
                  duration: { type: Type.NUMBER, description: "Duration in seconds (Number only, e.g. 1.5)" },
                  size: { 
                    type: Type.STRING, 
                    description: isZh ? "景别 (必须使用中文, 如: 特写, 全景)" : "Shot size abbreviation (e.g. CU, Wide)" 
                  },
                  movement: { 
                    type: Type.STRING,
                    description: isZh ? "运镜 (必须使用中文, 如: 推, 拉, 摇)" : "Camera movement"
                  },
                  description: { 
                    type: Type.STRING,
                    description: isZh ? "画面描述 (必须使用中文)" : "Visual description"
                  },
                  audio: { 
                    type: Type.STRING, 
                    description: isZh ? "人声/对白 (必须使用中文)" : "Inferred dialogue/voice" 
                  },
                  sfx: { 
                    type: Type.STRING, 
                    description: isZh ? "音效 (必须使用中文)" : "Inferred sound effects" 
                  },
                  thumbnailIndex: { type: Type.INTEGER, description: "The index of the frame in the provided list that matches this shot" }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    const data = JSON.parse(resultText) as AnalysisResult;
    return data;

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};

export const translateAnalysisResult = async (
  data: AnalysisResult, 
  targetLang: Language,
  apiKey?: string
): Promise<AnalysisResult> => {
  const ai = getClient(apiKey);

  const isZh = targetLang === 'zh';
  const prompt = isZh 
    ? `你是一个专业的翻译助手。请将以下电影分镜表数据的 JSON 内容翻译成中文。
       仅翻译以下字段的值：'summary', 'title' 以及 shots 数组中的 'size', 'movement', 'description', 'audio', 'sfx'。
       不要修改任何数字、时间戳或结构。
       'size' (景别) 和 'movement' (运镜) 请使用专业的电影中文术语。`
    : `You are a professional translator. Please translate the content of the following film shot list JSON into English.
       Only translate the values for: 'summary', 'title' and inside the shots array: 'size', 'movement', 'description', 'audio', 'sfx'.
       Do not modify numbers, timestamps, or structure.
       Use standard English film abbreviations for 'size' (e.g., CU, Wide) and 'movement'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: 'user', parts: [{ text: prompt }, { text: JSON.stringify(data) }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                shots: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            shotNumber: { type: Type.INTEGER },
                            startTime: { type: Type.STRING },
                            endTime: { type: Type.STRING },
                            duration: { type: Type.NUMBER },
                            size: { type: Type.STRING },
                            movement: { type: Type.STRING },
                            description: { type: Type.STRING },
                            audio: { type: Type.STRING },
                            sfx: { type: Type.STRING },
                            thumbnailIndex: { type: Type.INTEGER }
                        }
                    }
                }
            }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini during translation");
    
    return JSON.parse(resultText) as AnalysisResult;

  } catch (error) {
    console.error("Translation Failed", error);
    return data; 
  }
};

export const generateScreenplay = async (
  data: AnalysisResult,
  language: Language,
  apiKey?: string
): Promise<string> => {
    const ai = getClient(apiKey);
    const isZh = language === 'zh';

    const cleanShots = data.shots.map(s => ({
        id: s.shotNumber,
        time: s.startTime,
        desc: s.description,
        audio: s.audio
    }));

    const prompt = isZh 
    ? `你是一位专业的电影编剧。根据以下分镜表（Shot List）数据，反推并生成一份标准的电影剧本格式文本。
       
       格式要求：
       1. 场景标题（SCENE HEADING）：根据内容推断，例如 "内景. 房间 - 白天"。
       2. 动作描写（ACTION）：将连续镜头的画面描述整合成连贯的动作段落。不要像分镜表那样一行行罗列，要像小说一样流畅。
       3. 角色和对白（CHARACTER & DIALOGUE）：从 'audio' 字段提取。格式为：角色名居中，对话在下方。
       
       请仅输出剧本内容，不需要任何解释。`
    : `You are a professional screenwriter. Reverse engineer a standard screenplay format text based on the following Shot List data.
    
       Format Requirements:
       1. SCENE HEADINGS: Infer context, e.g., "INT. ROOM - DAY".
       2. ACTION: Consolidate shot descriptions into fluid action paragraphs. Do not list them shot-by-shot; write them as a narrative.
       3. CHARACTER & DIALOGUE: Extract from 'audio' field. Format: Character name centered, Dialogue below.
       
       Output ONLY the screenplay text.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: 'user', parts: [{ text: prompt }, { text: JSON.stringify({ title: data.title, summary: data.summary, shots: cleanShots }) }] }
            ]
        });
        return response.text || "";
    } catch (error) {
        console.error("Screenplay Generation Failed", error);
        return "Error generating screenplay.";
    }
};

const findBestCharacterFrame = async (frames: ProcessedFrame[], apiKey?: string): Promise<string | null> => {
    const ai = getClient(apiKey);
    
    const framesToCheck = frames.filter((_, i) => i % 4 === 0); 
    
    const parts: any[] = [];
    parts.push({ 
        text: "Analyze these video frames. I need to design a movie poster. Identify the single best frame index (from the provided list) that contains the CLEARSEST, HIGHEST QUALITY CLOSE-UP or MEDIUM CLOSE-UP of the MAIN CHARACTER's face. This frame will be used as a strict visual reference for the poster. Return a JSON object: { \"bestFrameIndex\": number }." 
    });

    framesToCheck.forEach((frame, index) => {
        parts.push({ text: `[Index: ${index}]` });
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: frame.data
            }
        });
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        bestFrameIndex: { type: Type.INTEGER }
                    }
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        if (typeof result.bestFrameIndex === 'number' && framesToCheck[result.bestFrameIndex]) {
             return framesToCheck[result.bestFrameIndex].data;
        }
        return null;
    } catch (e) {
        console.warn("Failed to automatically identify best character frame", e);
        return null;
    }
}

export const generateMoviePoster = async (
    title: string,
    summary: string,
    shots: ShotData[],
    frames: ProcessedFrame[],
    apiKey?: string
): Promise<string[]> => {
    const ai = getClient(apiKey);
    
    let referenceImageBase64 = await findBestCharacterFrame(frames, apiKey);

    if (!referenceImageBase64) {
        console.log("Fallback to metadata for character frame...");
        const goodSizes = ['CU', 'MCU', 'Close Up', 'Close-Up', 'Medium Close Up', '特写', '近景'];
        const bestShot = shots.find(s => goodSizes.some(size => s.size.includes(size)));
        let heroFrameIndex = bestShot && bestShot.thumbnailIndex < frames.length 
            ? bestShot.thumbnailIndex 
            : Math.floor(frames.length / 2);
        referenceImageBase64 = frames[heroFrameIndex]?.data;
    }

    if (!referenceImageBase64) {
        return []; 
    }

    const verticalReferenceBase64 = await cropToVertical9_16(referenceImageBase64);
    
    const basePrompt = `Generate a movie poster for a film titled "${title}".
    CRITICAL: The output MUST be a vertical 9:16 movie poster.
    The person in the poster MUST look exactly like the character in the provided reference image. 
    Maintain the character's specific facial features, ethnicity, age, hairstyle, and costume details from the reference image.
    Film Summary: "${summary}".
    Style: High-quality cinematic movie poster, professional lighting, dramatic composition, title text overlay at the bottom.`;

    const variations = [
        "Close-up portrait with dramatic lighting.",
        "Character in a key environment from the film.",
        "Minimalist design with bold typography and high contrast.",
        "Dynamic action pose composition."
    ];

    const promises = variations.map(async (variation) => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-image", 
                contents: {
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: verticalReferenceBase64
                            }
                        },
                        { text: `${basePrompt} Variation: ${variation}` }
                    ]
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            });
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part && part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
            return null;
        } catch (e) {
            console.warn("Failed to generate one poster variation", e);
            return null;
        }
    });

    const results = await Promise.all(promises);
    return results.filter((res): res is string => res !== null);
}
