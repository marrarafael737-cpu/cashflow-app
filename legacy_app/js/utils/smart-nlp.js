/**
 * js/utils/smart-nlp.js - Advanced NLP Orchestrator
 * Routes commands to Supabase Edge Functions (LLM) or local fallback.
 */

const SmartNLP = {
    /**
     * Processes natural language text to extract transaction data or intent.
     * @param {string} text The input text from Magic Input, OCR, or Voice.
     * @returns {Promise<Object>} Structured transaction or simulation data.
     */
    async process(text) {
        console.log('C.A.S.H. Unit: Analisando com SmartNLP...', text);

        // 1. Detect Intent: Is it a simulation (question) or a transaction?
        const cleanText = text.toLowerCase();
        const isSimulation = text.includes('?') || 
                             /\b(posso|consigo|da\s+pra|dá\s+pra|da\s+para|dá\s+para|vale\s+a\s+pena|compro|comprar|gastar|gasto|previsao|previsão|simular|simulação|simulacao|devo|compraria|sera\s+que|será\s+que|compromete|oraculo|oráculo)\b/i.test(cleanText);

        if (isSimulation && typeof window.OracleEngine !== 'undefined') {
            return { type: 'simulation', data: text };
        }

        // 2. Try Local Fast Parsing (SmartParser) first for simple commands
        const localResult = SmartParser.parse(text);
        
        // If local parser is very confident (score > 80), use it immediately for speed
        if (localResult && localResult.confidence > 80) {
            return { type: 'transaction', data: localResult };
        }

        // 3. Routing to Supabase Edge Function (LLM) for complex parsing
        try {
            const result = await this.callEdgeFunction(text);
            if (result) return { type: 'transaction', data: result };
        } catch (error) {
            console.warn('C.A.S.H. Unit: Falha na Edge Function, usando fallback local.', error);
        }

        // 4. Final Fallback (even with low confidence)
        return { type: 'transaction', data: localResult };
    },

    /**
     * Calls the Supabase Edge Function for LLM-based parsing.
     */
    async callEdgeFunction(text) {
        if (typeof supabase === 'undefined') return null;

        const { data, error } = await supabase.functions.invoke('process-magic-input', {
            body: { text: text }
        });

        if (error) throw error;
        return data;
    },

    /**
     * Utility to extract structured data from OCR text specifically.
     */
    async processOCR(rawText) {
        // Clean text from common OCR noise
        const cleaned = rawText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        return this.process(cleaned);
    }
};

window.SmartNLP = SmartNLP;
