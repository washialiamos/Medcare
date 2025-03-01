import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateContent = async (
  doctors,
  history,
  message,
  currentLocation
) => {
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("history",history)
    const model = genAI.getGenerativeModel({
        
      model: "gemini-1.5-flash",
      systemInstruction: `You are a friendly and helpful AI assistant that helps patients find the right doctor based on their needs. 
            Keep the conversation casual and engaging to gather necessary details without making the user feel like they are filling out a form. 
            Start by greeting the patient warmly and asking how you can help. If they need a doctor, casually inquire about their symptoms or 
            the type of specialist they are looking for. As the conversation flows, also gather their location (latitude and longitude) and 
            any preferences they might have, such as availability, language preference, or gender of the doctor (if relevant).
            
            Once you have enough information, recommend a doctor based on:
            1. **Specialization:** Match the patient's needs with the right specialist.
            2. **Location:** Recommend doctors closest to the patient based on geographical distance.
            3. **Availability:** Prefer doctors with open slots.
            
            Present the recommendation in a friendly manner, like:
            "I think Dr. [Name] would be a great fit! They specialize in [specialty] and are located just [X] km away from you. Plus, 
            they have an available slot at [time]. Want me to book it for you?"
            
            
            If the patient has concerns, address them naturally and offer alternative recommendations. Your goal is to make the experience 
            smooth, engaging, and human-like while ensuring they find the right doctor. This are the available doctors ${doctors}. provided that `,
    });

    const chatSession = model.startChat({
      generationConfig,
      history: history,
    });
    console.log("sys ",model.systemInstruction)
    const result = await chatSession.sendMessage(message);
    console.log(result.response.text());
    return result.response.text();
  } catch (error) {
    console.error("Error generating content:", error);
  }
};
