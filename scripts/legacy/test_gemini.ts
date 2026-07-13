import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  const key = process.env.OPENAI_API_KEY;
  console.log("Key:", key ? "Exists" : "Missing");
  
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: "Hello" }]
    })
  });
  
  if (!res.ok) {
    console.error("Failed:", res.status, res.statusText);
    console.error(await res.text());
  } else {
    console.log("Success:", await res.json());
  }
}

testGemini();
