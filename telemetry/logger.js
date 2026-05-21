/**
 * logger.js - Adaptmind.in Knowledge Tracing & Interaction Logger
 * Implements the sequence vector tokenization framework from Deep Knowledge Tracing (Piech et al.)
 */

const fs = require('fs');
const path = require('path');

class AdaptmindLogger {
    constructor(outputFilename = 'student_traces.json') {
        this.filePath = path.join(process.cwd(), outputFilename);
        this.initStorage();
    }

    // Ensures the data file exists and is structured as a JSON array
    initStorage() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        }
    }

    /**
     * Logs a gameplay interaction matching the DKT sequence model: x_t = {q_t, a_t}
     * @param {string} studentId - Unique identifier for the player
     * @param {string} conceptTag - The moral/cognitive skill tested (q_t)
     * @param {number} evaluation - Binary performance metric: 1 for constructive, 0 for flawed (a_t)
     * @param {Object} metadata - Optional contextual game metrics (time taken, choice ID)
     */
    logInteraction(studentId, conceptTag, evaluation, metadata = {}) {
        try {
            const fileData = fs.readFileSync(this.filePath, 'utf8');
            const database = JSON.parse(fileData);

            // Find or create the student's temporal interaction trace
            let studentRecord = database.find(entry => entry.studentId === studentId);

            if (!studentRecord) {
                studentRecord = {
                    studentId: studentId,
                    updatedAt: new Date().toISOString(),
                    trace_length: 0,
                    interactions: []
                };
                database.push(studentRecord);
            }

            // DKT Tuple formatting: combining interaction tag and raw score
            const interactionTuple = {
                timestamp: new Date().toISOString(),
                q_t: conceptTag,         // Concept/Exercise Tag
                a_t: evaluation === true || evaluation === 1 ? 1 : 0, // Binary outcome
                meta: metadata           // Web tracking hooks (e.g., duration)
            };

            studentRecord.interactions.push(interactionTuple);
            studentRecord.trace_length = studentRecord.interactions.length;
            studentRecord.updatedAt = new Date().toISOString();

            // Save trace sequence back to local ledger
            fs.writeFileSync(this.filePath, JSON.stringify(database, null, 4));
            return { success: true, trace_length: studentRecord.trace_length };

        } catch (error) {
            console.error(' [Adaptmind Logger Error]: Failed to commit event tuple.', error);
            return { success: false, error: error.message };
        }
    }

    // Helper to extract a clean sequence ready for your RNN/LSTM tensor pipeline
    getStudentSequence(studentId) {
        try {
            const database = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            const student = database.find(entry => entry.studentId === studentId);
            if (!student) return null;

            // Formats directly into the sequential vectors required by deep learning structures
            return student.interactions.map(item => ({
                concept: item.q_t,
                correct: item.a_t
            }));
        } catch (e) {
            return null;
        }
    }
}

// Export module for your game engine backend
module.exports = AdaptmindLogger;

// Direct execution test suite snippet
if (require.main === module) {
    console.log("Initializing Adaptmind Deep Knowledge Tracing Logger test...");
    const logger = new AdaptmindLogger('test_traces.json');

    // Simulate a student interacting with moral dilemma mechanics in-game
    logger.logInteraction('player_777', 'utilitarian_logic', 1, { choice: 'save_five', response_ms: 1420 });
    logger.logInteraction('player_777', 'deontology_rules', 0, { choice: 'lie_to_protect', response_ms: 3100 });
    logger.logInteraction('player_777', 'utilitarian_logic', 0, { choice: 'selfish_survival', response_ms: 950 });

    console.log("Trace generation successful. Sequence compiled into 'test_traces.json'.");
    console.log("Formatted Sequence Data:", JSON.stringify(logger.getStudentSequence('player_777'), null, 2));
}
