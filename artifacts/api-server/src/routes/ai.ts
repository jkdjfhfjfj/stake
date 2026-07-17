import { Router } from "express";
import { requireAuth } from "../lib/auth";

const router = Router();

// Qrok AI Chat proxy — forwards messages to Groq-compatible API
router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const apiKey = process.env.QROK_API_KEY;
  const apiBase = process.env.QROK_API_BASE_URL ?? "https://api.groq.com/openai/v1";
  const model = process.env.QROK_MODEL ?? "llama3-8b-8192";

  if (!apiKey) {
    res.status(503).json({ error: "AI assistant is not configured." });
    return;
  }

  const { messages } = req.body as { messages?: Array<{ role: string; content: string }> };
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const systemPrompt = `You are a helpful assistant for StakeKE, a Kenyan M-Pesa investment and staking platform. 
You help users with questions about:
- How to deposit money via M-Pesa STK Push
- How staking plans work (ROI, duration, lock periods)
- How to withdraw funds (manual processing, 24 hours)
- Referral program and earning rewards
- Account settings and profile management
- KYC verification process
- General investment advice for Kenyan users

Be friendly, concise, and helpful. Always respond in the user's language (English or Swahili). 
If asked about specific account details, tell the user to contact support via WhatsApp.
Do not make up specific numbers about plans — tell users to check the Staking page for current rates.`;

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20), // keep last 20 messages for context
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      res.status(502).json({ error: err?.error?.message ?? "AI service error" });
      return;
    }

    const data = await response.json() as any;
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that.";
    res.json({ reply });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? "Network error" });
  }
});

export default router;
