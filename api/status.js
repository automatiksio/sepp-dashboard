// Sepp Status API — Node.js Script
// Liest Session-Daten und gibt Live-Status zurück

const fs = require('fs');
const path = require('path');

const SESSION_DIR = '/home/clawd/.openclaw/agents/main/sessions';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'live-status.json');

function getLatestSession() {
    const sessionsFile = path.join(SESSION_DIR, 'sessions.json');
    if (!fs.existsSync(sessionsFile)) return null;
    
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    return sessions;
}

function parseTranscript(sessionId) {
    const transcriptFile = path.join(SESSION_DIR, `${sessionId}.jsonl`);
    if (!fs.existsSync(transcriptFile)) return [];
    
    const content = fs.readFileSync(transcriptFile, 'utf8');
    const lines = content.trim().split('\n').filter(l => l);
    
    // Parse last 50 entries
    const entries = lines.slice(-50).map(line => {
        try {
            return JSON.parse(line);
        } catch {
            return null;
        }
    }).filter(Boolean);
    
    return entries;
}

function extractActivities(entries) {
    const activities = [];
    
    for (const entry of entries) {
        if (!entry.timestamp) continue;
        
        const time = new Date(entry.timestamp);
        
        // Tool calls
        if (entry.role === 'assistant' && entry.content) {
            for (const block of entry.content) {
                if (block.type === 'toolCall') {
                    activities.push({
                        timestamp: time.toISOString(),
                        type: 'tool_call',
                        tool: block.name,
                        description: `Tool: ${block.name}`,
                        details: summarizeArgs(block.name, block.arguments)
                    });
                }
                if (block.type === 'text' && block.text && block.text.length > 10) {
                    activities.push({
                        timestamp: time.toISOString(),
                        type: 'response',
                        description: 'Antwort gesendet',
                        details: block.text.substring(0, 100) + (block.text.length > 100 ? '...' : '')
                    });
                }
            }
        }
        
        // User messages
        if (entry.role === 'user' && entry.content) {
            const text = entry.content.map(c => c.text || '').join(' ').substring(0, 100);
            if (text) {
                activities.push({
                    timestamp: time.toISOString(),
                    type: 'user_message',
                    description: 'Nachricht von Chris',
                    details: text + (text.length >= 100 ? '...' : '')
                });
            }
        }
    }
    
    return activities.slice(-20).reverse();
}

function summarizeArgs(tool, args) {
    if (!args) return '';
    
    switch (tool) {
        case 'write':
            return `Datei: ${args.path || args.file_path || '?'}`;
        case 'read':
            return `Datei: ${args.path || args.file_path || '?'}`;
        case 'edit':
            return `Datei: ${args.path || '?'}`;
        case 'exec':
            return `Command: ${(args.command || '').substring(0, 50)}...`;
        case 'web_fetch':
            return `URL: ${args.url || '?'}`;
        case 'message':
            return `${args.action} → ${args.target || args.channel || '?'}`;
        case 'sessions_spawn':
            return `Sub-Agent: ${args.task?.substring(0, 50) || '?'}`;
        default:
            return '';
    }
}

function generateStatus() {
    const sessions = getLatestSession();
    const mainSession = sessions?.['agent:main:main'];
    
    if (!mainSession) {
        return {
            online: false,
            lastUpdate: new Date().toISOString(),
            status: 'Offline',
            currentTask: null,
            activities: []
        };
    }
    
    const sessionId = mainSession.sessionId;
    const entries = parseTranscript(sessionId);
    const activities = extractActivities(entries);
    
    // Determine current status
    const lastActivity = activities[0];
    const timeSinceLastActivity = lastActivity ? 
        (Date.now() - new Date(lastActivity.timestamp).getTime()) / 1000 : 9999;
    
    let status = 'Idle';
    let currentTask = null;
    
    if (timeSinceLastActivity < 60) {
        status = 'Aktiv';
        if (lastActivity.type === 'tool_call') {
            currentTask = `${lastActivity.description} — ${lastActivity.details}`;
        } else if (lastActivity.type === 'response') {
            currentTask = 'Antwort verfassen';
        }
    } else if (timeSinceLastActivity < 300) {
        status = 'Warte auf Input';
    }
    
    return {
        online: true,
        lastUpdate: new Date().toISOString(),
        status: status,
        currentTask: currentTask,
        model: mainSession.model || 'claude-opus-4-5',
        contextUsage: mainSession.totalTokens ? 
            Math.round((mainSession.totalTokens / mainSession.contextTokens) * 100) : 0,
        subAgents: 0, // TODO: Count from sessions
        activities: activities
    };
}

// Generate and save
const status = generateStatus();
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(status, null, 2));
console.log('Status updated:', status.status);
