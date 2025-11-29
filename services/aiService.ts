import { StorageService, Memory, Message } from "./storage";

const getOpenRouterKey = (): string => {
  const key = typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  return key;
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `You are Cognitive Anchor, a warm, patient, and supportive AI companion designed to help individuals with memory challenges and their caregivers. Your role is to:

1. Be a trusted memory partner - help users recall important information about their life, family, and daily routines
2. Provide gentle, proactive reminders about daily activities, medications, and appointments
3. Engage in meaningful conversation about the user's life story and memories
4. Offer emotional support with calm, reassuring responses
5. Help identify people and places when asked
6. Never rush or pressure the user - always be patient and understanding

Communication style:
- Use simple, clear language with short sentences
- Be warm and encouraging, but not patronizing
- Repeat important information naturally when helpful
- Confirm understanding before moving on
- Use the user's name when appropriate
- Reference past conversations and memories to build continuity

Safety guidelines:
- If the user seems confused or distressed, offer calm reassurance
- Suggest contacting a caregiver or emergency contact if there's a safety concern
- Never provide medical advice - encourage consulting healthcare providers
- Respect privacy and handle all personal information with care

Remember: You are a supportive anchor helping the user navigate their day with confidence and dignity.`;

async function buildContextFromMemories(): Promise<string> {
  const memories = await StorageService.getMemories();
  const profile = await StorageService.getUserProfile();
  const contacts = await StorageService.getEmergencyContacts();
  
  let context = "";
  
  if (profile) {
    context += `\n\nUser Information:\n- Name: ${profile.name}\n`;
  }
  
  if (contacts.length > 0) {
    context += "\nEmergency Contacts:\n";
    contacts.forEach((c) => {
      context += `- ${c.name} (${c.relationship}): ${c.phone}${c.isPrimary ? " [Primary]" : ""}\n`;
    });
  }
  
  if (memories.length > 0) {
    context += "\nUser's Memories:\n";
    memories.slice(0, 10).forEach((m) => {
      context += `- [${m.category}] ${m.title}: ${m.content}\n`;
    });
  }
  
  return context;
}

function getTimeContext(): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  
  let timeOfDay = "morning";
  if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17 && hour < 21) timeOfDay = "evening";
  else if (hour >= 21 || hour < 5) timeOfDay = "night";
  
  return `Current time: ${time} on ${day}. It is ${timeOfDay}.`;
}

export const AIService = {
  async sendMessage(userMessage: string, conversationHistory: Message[]): Promise<string> {
    try {
      const memoryContext = await buildContextFromMemories();
      const timeContext = getTimeContext();
      
      const messages: ChatCompletionMessage[] = [
        {
          role: "system",
          content: SYSTEM_PROMPT + memoryContext + "\n\n" + timeContext,
        },
      ];
      
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
      
      messages.push({
        role: "user",
        content: userMessage,
      });
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cognitive-anchor.app",
          "X-Title": "Cognitive Anchor",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: ChatCompletionResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      
      throw new Error("No response from AI");
    } catch (error) {
      console.error("AI Service error:", error);
      return "I'm having a little trouble connecting right now. Would you like to try again in a moment? I'm here to help whenever you're ready.";
    }
  },

  async analyzeImage(imageBase64: string, prompt?: string): Promise<string> {
    try {
      const memoryContext = await buildContextFromMemories();
      
      const systemPrompt = `You are Cognitive Anchor's vision assistant. Help identify people, objects, and scenes to assist users with memory challenges. 

Your role:
- Describe what you see clearly and warmly
- If you see people, describe their appearance gently and ask if they look familiar
- Identify objects, locations, and text that might be helpful
- Connect what you see to the user's stored memories when possible
- Be concise but thorough - use 2-4 sentences

${memoryContext ? `Context about the user:\n${memoryContext}` : ""}`;

      const userPrompt = prompt || "What do you see in this image? Please describe it in a helpful way for someone who may have memory challenges.";
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cognitive-anchor.app",
          "X-Title": "Cognitive Anchor",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: "text",
                  text: userPrompt,
                },
              ],
            },
          ],
          max_tokens: 400,
          temperature: 0.5,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vision API error:", errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: ChatCompletionResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      
      throw new Error("No response from AI");
    } catch (error) {
      console.error("Vision analysis error:", error);
      return "I couldn't analyze the image right now. Please try again in a moment.";
    }
  },

  async generateProactiveNudge(locationContext?: { latitude: number; longitude: number }): Promise<string | null> {
    try {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const memories = await StorageService.getMemories();
      const profile = await StorageService.getUserProfile();
      const userName = profile?.name || "there";
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (hour >= 6 && hour < 8) {
        return `Good morning, ${userName}! I hope you had a restful night. Would you like to tell me about your plans for today?`;
      }
      
      if (hour >= 8 && hour < 10 && !isWeekend) {
        return `It's morning time, ${userName}. Have you had breakfast and taken any morning medications?`;
      }
      
      if (hour >= 11 && hour < 13) {
        return `It's lunchtime! Have you eaten yet today? Staying nourished helps you feel your best.`;
      }
      
      if (hour >= 14 && hour < 16) {
        const placeMemories = memories.filter(m => m.category === "place");
        if (placeMemories.length > 0 && Math.random() > 0.5) {
          const randomPlace = placeMemories[Math.floor(Math.random() * placeMemories.length)];
          return `The afternoon is a nice time to reminisce. I was thinking about ${randomPlace.title}. Would you like to share some memories about it?`;
        }
        return `Good afternoon! Would you like to take a short walk or look at some photos together?`;
      }
      
      if (hour >= 17 && hour < 19) {
        const personMemories = memories.filter(m => m.category === "person");
        if (personMemories.length > 0 && Math.random() > 0.6) {
          const randomPerson = personMemories[Math.floor(Math.random() * personMemories.length)];
          return `Evening is a good time to connect with loved ones. Would you like to call ${randomPerson.title}?`;
        }
        return `It's evening now. Have you had dinner? I'm here if you'd like to chat.`;
      }
      
      if (hour >= 20 && hour < 22) {
        return `It's getting late, ${userName}. Remember to take any evening medications and prepare for a good night's rest.`;
      }
      
      if (hour >= 22 || hour < 6) {
        return `It's nighttime. I hope you're resting well. I'm here if you need anything.`;
      }
      
      if (memories.length > 0 && Math.random() > 0.7) {
        const randomMemory = memories[Math.floor(Math.random() * memories.length)];
        return `I was thinking about ${randomMemory.title}. Would you like to talk about it?`;
      }
      
      return null;
    } catch (error) {
      console.error("Error generating nudge:", error);
      return null;
    }
  },

  async searchMemories(query: string): Promise<Memory[]> {
    try {
      const memories = await StorageService.getMemories();
      const queryLower = query.toLowerCase();
      
      return memories.filter(
        (m) =>
          m.title.toLowerCase().includes(queryLower) ||
          m.content.toLowerCase().includes(queryLower) ||
          m.tags.some((t) => t.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      console.error("Error searching memories:", error);
      return [];
    }
  },

  async startLifeStorySession(conversationHistory: Message[]): Promise<string> {
    try {
      const memoryContext = await buildContextFromMemories();
      const profile = await StorageService.getUserProfile();
      
      const lifeStoryPrompt = `You are Cognitive Anchor, starting a warm Life Story session with ${profile?.name || "the user"}. Your goal is to help them reminisce and share meaningful memories in a gentle, therapeutic way.

${memoryContext}

Start the Life Story session by:
1. Warmly greeting them and explaining that you'd love to hear about their life
2. Picking a gentle topic to start (childhood home, favorite family memory, proudest achievement, or a beloved pet)
3. Ask one open-ended question to invite them to share
4. Be encouraging and affirming - their stories matter

Keep your opening warm but concise. End with a single question to get them started.`;
      
      const messages: ChatCompletionMessage[] = [
        { role: "system", content: lifeStoryPrompt },
      ];
      
      const recentHistory = conversationHistory.slice(-6);
      recentHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
      
      messages.push({
        role: "user",
        content: "I'd like to share some memories. Let's do a life story session.",
      });
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cognitive-anchor.app",
          "X-Title": "Cognitive Anchor",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages,
          max_tokens: 400,
          temperature: 0.8,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: ChatCompletionResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      
      throw new Error("No response from AI");
    } catch (error) {
      console.error("Life story session error:", error);
      return "I'd love to hear about your memories! Let's start with something simple - can you tell me about a place that was special to you when you were young?";
    }
  },

  async continueLifeStory(userInput: string, conversationHistory: Message[]): Promise<string> {
    try {
      const memoryContext = await buildContextFromMemories();
      const profile = await StorageService.getUserProfile();
      
      const lifeStorySystemPrompt = `You are Cognitive Anchor in a Life Story session with ${profile?.name || "the user"}. 

Your role:
- Be a compassionate listener who validates their memories
- Ask gentle follow-up questions to help them explore their story deeper
- Show genuine interest and emotional engagement
- Help them connect current memories to past ones
- Occasionally suggest saving important memories they share
- Keep responses warm but concise (2-3 sentences + a question)

${memoryContext}

Continue the conversation naturally, building on what they share.`;
      
      const messages: ChatCompletionMessage[] = [
        { role: "system", content: lifeStorySystemPrompt },
      ];
      
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
      
      messages.push({
        role: "user",
        content: userInput,
      });
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cognitive-anchor.app",
          "X-Title": "Cognitive Anchor",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages,
          max_tokens: 400,
          temperature: 0.8,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: ChatCompletionResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      
      throw new Error("No response from AI");
    } catch (error) {
      console.error("Life story continuation error:", error);
      return "That sounds like a wonderful memory. Would you like to tell me more about it?";
    }
  },
};
