require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { AgentKit } = require('@coinbase/cdp-sdk');

const app = express();
const port = process.env.PORT || 3001; // Avoid conflict with frontend on 3000
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const agentKit = new AgentKit({ apiKey: process.env.CDP_API_KEY });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK, message: Freelance Invoice AI Backend is running' });
});

// Endpoint to generate milestones with AI
app.post('/generate-milestones', async (req, res) => {
  const { projectDescription, totalAmount } = req.body;

  if (!projectDescription || !totalAmount) {
    return res.status(400).json({ error: 'Missing projectDescription or totalAmount' });
  }

  try {
    console.log(`Generating milestones for: ${projectDescription} (${totalAmount} USDC)`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI agent specializing in freelance project management. Given a project description and total amount in USDC, generate a JSON array of milestones.\n\nRequirements:\n- Each milestone should have: {name: string, amount: number}\n- Ensure the amounts sum exactly to the totalAmount\n- Aim for 3-5 logical milestones based on typical project flow\n- Use clear, professional milestone names\n- Distribute amounts logically (e.g., 30% upfront, 40 for main work, 30% for final delivery)\n\nRespond ONLY with a valid JSON array, no explanation, no markdown, no extra text.`
        },
        {
          role: 'user',
          content: `Project: ${projectDescription}. Total Amount: ${totalAmount} USDC.`
        }
      ],
      temperature: 0.7, // Balanced creativity
      max_tokens: 500
    });

    let responseText = completion.choices[0].message.content.trim();
    console.log('AI Response:', responseText);

    // Fallback: Strip markdown code block if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*|```$/g, '').trim();
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\w*\s*|```$/g, '').trim();
    }

    // Parse JSON response
    let milestones;
    try {
      milestones = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(500).json({ error: 'Invalid JSON response from AI', raw: responseText });
    }

    // Validate milestones structure
    if (!Array.isArray(milestones)) {
      return res.status(500).json({ error: 'AI response is not an array' });
    }

    // Validate each milestone has required fields
    for (let i =0; i < milestones.length; i++) {
      const milestone = milestones[i];
      if (!milestone.name || typeof milestone.amount !== 'number') {
        return res.status(500).json({ 
          error: `Invalid milestone at index ${i}: missing name or amount` 
        });
      }
    }

    // Validate sum
    const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
    if (Math.abs(sum - totalAmount) > 0.01) { // Allow small floating point differences
      console.warn(`Sum mismatch: ${sum} vs ${totalAmount}`);
      return res.status(500).json({ 
        error: `AI-generated milestones sum to ${sum}, expected ${totalAmount}` 
      });
    }

    console.log('Successfully generated milestones:', milestones);
    res.json({ milestones });

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate milestones', details: error.message });
  }
});

// Endpoint to get contract information
app.get('/contract-info', (req, res) => {
  res.json({
    contractAddress: '0xe22EAfa82934Be3049B5AD3B2514A123bb7F74F3',
    network: 'Base Sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    feePercentage: 2
  });
});

// Future stub for AgentKit integration (CDP autonomous actions)
// Install @coinbase/cdp-sdk when ready
// const { createAgent } = require('@coinbase/cdp-agentkit');
app.post('/trigger-agent', async (req, res) => {
  const { action, invoiceId, milestoneIndex } = req.body;
  
  // TODO: Implement AgentKit integration
  // This will be used for autonomous onchain actions like:
  // - Auto-completing milestones based on AI analysis
  // - Automatic payment releases
  // - Dispute resolution
  
  console.log(`AgentKit action requested: ${action} for invoice ${invoiceId}`);
  
  res.json({ 
    message: 'AgentKit integration coming soon,',
    action,
    invoiceId,
    milestoneIndex 
  });
});

// New endpoint: Trigger agent to complete a milestone autonomously
app.post('/trigger-agent-complete', async (req, res) => {
  const { invoiceId, milestoneIndex } = req.body;
  try {
    const action = {
      chainId: 84532, // Base Sepolia chain ID
      to: '0xe22EAfa82934Be3049B5AD3B2514A123bb7F74F3',
      data: agentKit.encodeFunctionData('completeMilestone', [invoiceId, milestoneIndex]),
      value: '0',
    };
    const result = await agentKit.executeActions([action]);
    res.json({ success: true, txHash: result.txHash });
  } catch (error) {
    console.error('AgentKit Error:', error);
    res.status(500).json({ error: 'Agent execution failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 44 handler
app.use((req, res) => { 
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`🚀 Freelance Invoice AI Backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🤖 AI Milestone generation: POST http://localhost:${port}/generate-milestones`);
}); 