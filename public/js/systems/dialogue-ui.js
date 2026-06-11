/**
 * Dialogue UI System for Skylark ARPG
 * Handles displaying and managing NPC conversations
 */

export class DialogueUI {
  constructor() {
    this.isOpen = false;
    this.currentNPC = null;
    this.currentDialogueNode = null;
    this.onOptionSelected = null;
    this.initializeDOM();
  }

  initializeDOM() {
    // Create dialogue container if it doesn't exist
    if (document.getElementById('dialogue-ui')) return;

    const html = `
      <div id="dialogue-ui" class="dialogue-container hidden">
        <div class="dialogue-box">
          <div class="dialogue-header">
            <span class="dialogue-npc-name" id="dialogue-npc-name">NPC Name</span>
            <button class="dialogue-close" id="dialogue-close-btn">×</button>
          </div>
          <div class="dialogue-content">
            <p class="dialogue-text" id="dialogue-text">Dialogue text here</p>
          </div>
          <div class="dialogue-options" id="dialogue-options">
            <!-- Options will be added here -->
          </div>
        </div>
      </div>
    `;

    const style = `
      <style>
        #dialogue-ui {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.95);
          border-top: 2px solid #0f0;
          padding: 20px;
          font-family: 'Courier New', monospace;
          color: #0f0;
          z-index: 1000;
          display: none;
        }

        #dialogue-ui.hidden {
          display: none;
        }

        #dialogue-ui.visible {
          display: block;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .dialogue-box {
          max-width: 800px;
          margin: 0 auto;
        }

        .dialogue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #0f0;
          padding-bottom: 10px;
        }

        .dialogue-npc-name {
          font-weight: bold;
          font-size: 16px;
          text-shadow: 0 0 10px #0f0;
        }

        .dialogue-close {
          background: none;
          border: none;
          color: #0f0;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dialogue-close:hover {
          color: #00ff00;
          text-shadow: 0 0 10px #0f0;
        }

        .dialogue-content {
          margin-bottom: 20px;
          min-height: 60px;
        }

        .dialogue-text {
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .dialogue-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dialogue-option {
          background: rgba(15, 255, 0, 0.1);
          border: 1px solid #0f0;
          color: #0f0;
          padding: 10px 15px;
          cursor: pointer;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          text-align: left;
          transition: all 0.2s;
        }

        .dialogue-option:hover {
          background: rgba(15, 255, 0, 0.2);
          box-shadow: 0 0 10px rgba(15, 255, 0, 0.5);
        }

        .dialogue-option:active {
          background: rgba(15, 255, 0, 0.3);
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', style);
    document.body.insertAdjacentHTML('beforeend', html);

    // Attach event listeners
    document.getElementById('dialogue-close-btn').addEventListener('click', () => this.close());
  }

  /**
   * Open dialogue with NPC
   * @param {Object} npcData - NPC data including name and dialogue
   */
  open(npcData) {
    this.currentNPC = npcData;
    this.isOpen = true;

    const container = document.getElementById('dialogue-ui');
    container.classList.remove('hidden');
    container.classList.add('visible');

    document.getElementById('dialogue-npc-name').textContent = npcData.npcName;
    this.displayDialogueNode(npcData.dialogue);
  }

  /**
   * Display a dialogue node with options
   * @param {Object} dialogueNode - Dialogue node data
   */
  displayDialogueNode(dialogueNode) {
    const textElement = document.getElementById('dialogue-text');
    const optionsElement = document.getElementById('dialogue-options');

    // Set dialogue text
    textElement.textContent = dialogueNode.greeting || dialogueNode.text || 'Dialogue unavailable';

    // Clear options
    optionsElement.innerHTML = '';

    // Add options
    if (dialogueNode.options && dialogueNode.options.length > 0) {
      dialogueNode.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'dialogue-option';
        button.textContent = option.text;
        button.addEventListener('click', () => {
          this.selectOption(option, index);
        });
        optionsElement.appendChild(button);
      });
    } else {
      // Default close option
      const closeBtn = document.createElement('button');
      closeBtn.className = 'dialogue-option';
      closeBtn.textContent = '[ Close conversation ]';
      closeBtn.addEventListener('click', () => this.close());
      optionsElement.appendChild(closeBtn);
    }
  }

  /**
   * Handle option selection
   * @param {Object} option - Selected option
   * @param {number} index - Option index
   */
  selectOption(option, index) {
    if (this.onOptionSelected) {
      this.onOptionSelected(option, index);
    }

    // Show response
    if (option.response) {
      const textElement = document.getElementById('dialogue-text');
      textElement.textContent = option.response;

      // Clear options to show response
      const optionsElement = document.getElementById('dialogue-options');
      optionsElement.innerHTML = '';

      // Add close option
      setTimeout(() => {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialogue-option';
        closeBtn.textContent = '[ Continue ]';
        closeBtn.addEventListener('click', () => this.close());
        optionsElement.appendChild(closeBtn);
      }, 300);
    }
  }

  /**
   * Close dialogue
   */
  close() {
    this.isOpen = false;
    const container = document.getElementById('dialogue-ui');
    container.classList.add('hidden');
    container.classList.remove('visible');
    this.currentNPC = null;
  }
}
