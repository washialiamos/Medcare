

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;


export const generateContent = async (doctors, history,currentLocation) => {
  console.log("history",history)

  console.log("doctors loc",currentLocation)
  const requestData = {
    system_instruction: {
      parts: {
        text: `You are a friendly and helpful AI assistant that helps patients find the right doctor based on their needs. 
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
            smooth, engaging, and human-like while ensuring they find the right doctor. This are the available doctors ${doctors}. Given that the location of the patient is ${currentLocation.latitude},${currentLocation.longitude} provide the doctor based on this coordinates.`,
      },
    },
    contents: history,
  };
  console.log("request",requestData)
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Extracting the text response
    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";

    console.log("AI Response:", aiResponse);

    return aiResponse;
  } catch (error) {
    console.error("Error:", error);
  }
};

// generateContent();
