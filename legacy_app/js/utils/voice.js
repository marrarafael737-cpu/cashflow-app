/**
 * js/utils/voice.js - Web Speech API (TTS) Utilities
 * Provides interactive voice feedback for the CashFlow Oráculo.
 */

const VoiceEngine = {
    enabled: true,
    voice: null,
    
    /**
     * Initializes the voice engine by selecting the best Portuguese voice.
     */
    init() {
        if (!('speechSynthesis' in window)) {
            console.warn('C.A.S.H. Unit: Speech Synthesis não suportado.');
            this.enabled = false;
            return;
        }

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Prioritize Portuguese voices (Google or Microsoft)
            this.voice = voices.find(v => v.lang.includes('pt-BR')) || voices.find(v => v.lang.includes('pt'));
            console.log('C.A.S.H. Unit: Voz selecionada:', this.voice?.name);
        };

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
    },

    /**
     * Speaks a message using the selected voice.
     * @param {string} text Message to speak
     */
    speak(text) {
        if (!this.enabled || !text) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        
        utterance.pitch = 1.1; // Slightly higher pitch for the mascot
        utterance.rate = 1.0;
        utterance.volume = 0.8;

        window.speechSynthesis.speak(utterance);
    }
};

// Auto-init on load
window.VoiceEngine = VoiceEngine;
VoiceEngine.init();
