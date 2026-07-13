import express from 'express';
import path from 'path';
import { HashGraphClient } from './src/sdk/client';

const app = express();
const port = 8080;

app.use(express.static(__dirname));

// Initialize client
const client = new HashGraphClient();

app.get('/api/analyze', async (req, res) => {
    const address = req.query.address as string;
    
    // Quick validation
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
            error: true,
            message: "Invalid contract address format. Must be a valid 0x hex address."
        });
    }

    try {
        const graph = await client.getProtocolGraph(address);
        res.json(graph);
    } catch (error: any) {
        res.status(500).json({
            error: true,
            message: error.message || "Failed to analyze contract"
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
