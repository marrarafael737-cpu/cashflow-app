/**
 * js/utils/nlp.js - Simple Natural Language Processing utilities
 */

const NLP = {
    /**
     * Calculates the Levenshtein distance between two strings.
     * Used for fuzzy matching keywords.
     */
    levenshtein: function(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    },

    /**
     * Checks if a string is "close enough" to a target string.
     * @param {string} str Input string
     * @param {string} target Target string
     * @param {number} threshold Maximum distance allowed (default 2)
     */
    isSimilar: function(str, target, threshold = 2) {
        if (!str || !target) return false;
        const s = str.toLowerCase().trim();
        const t = target.toLowerCase().trim();
        
        // Exact match
        if (s === t) return true;
        
        // Distance check
        const dist = this.levenshtein(s, t);
        return dist <= threshold;
    },

    /**
     * Finds the best match in a list of options.
     */
    findBestMatch: function(str, options, threshold = 2) {
        let best = null;
        let minScore = Infinity;

        options.forEach(opt => {
            const dist = this.levenshtein(str.toLowerCase(), opt.toLowerCase());
            if (dist < minScore && dist <= threshold) {
                minScore = dist;
                best = opt;
            }
        });

        return best;
    }
};

window.NLP = NLP;
