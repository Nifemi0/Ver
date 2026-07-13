import dotenv from 'dotenv';
dotenv.config();

async function testDeepSeek() {
  const key = process.env.DEEPSEEK_API_KEY;
  console.log("Key:", key ? "Exists" : "Missing");
  
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
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

testDeepSeek();
