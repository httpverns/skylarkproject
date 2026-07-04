import { DialogueUI } from './dialogue-ui.js';

class FakeElement {
  constructor(id = null, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = {};
    this.textContent = '';
    this.innerHTML = '';
    this.classList = {
      add: (cls) => {
        this._classes = this._classes || new Set();
        this._classes.add(cls);
      },
      remove: (cls) => {
        this._classes = this._classes || new Set();
        this._classes.delete(cls);
      },
      contains: (cls) => (this._classes || new Set()).has(cls)
    };
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(type) {
    (this.listeners[type] || []).forEach((handler) => handler({ target: this }));
  }
}

const elements = new Map();
const documentStub = {
  body: new FakeElement('body', 'body'),
  head: new FakeElement('head', 'head'),
  createElement(tagName) {
    return new FakeElement(null, tagName);
  },
  getElementById(id) {
    return elements.get(id) || null;
  },
  insertAdjacentHTML() {},
};

const setupDOM = () => {
  elements.clear();
  documentStub.body = new FakeElement('body', 'body');
  documentStub.head = new FakeElement('head', 'head');

  const root = new FakeElement('dialogue-ui', 'div');
  const npcName = new FakeElement('dialogue-npc-name', 'span');
  const text = new FakeElement('dialogue-text', 'p');
  const options = new FakeElement('dialogue-options', 'div');
  const close = new FakeElement('dialogue-close-btn', 'button');

  elements.set('dialogue-ui', root);
  elements.set('dialogue-npc-name', npcName);
  elements.set('dialogue-text', text);
  elements.set('dialogue-options', options);
  elements.set('dialogue-close-btn', close);

  global.document = documentStub;
  global.window = {};
};

const testDialogueTree = async () => {
  setupDOM();
  const ui = new DialogueUI();
  ui.open({
    npcName: 'Martin Crane',
    dialogue: {
      greeting: 'Hello',
      currentNodeId: 'greet',
      nodes: {
        greet: {
          id: 'greet',
          text: 'Hello there',
          responses: [{ text: 'Tell me more', next: 'about' }]
        },
        about: {
          id: 'about',
          text: 'The mission is ready',
          responses: []
        }
      }
    }
  });

  const text = document.getElementById('dialogue-text').textContent;
  if (text !== 'Hello there') {
    throw new Error(`Expected first node text, got ${text}`);
  }

  const options = document.getElementById('dialogue-options').children;
  if (options.length !== 1) {
    throw new Error(`Expected 1 option, got ${options.length}`);
  }

  options[0].dispatchEvent('click');
  await new Promise((resolve) => setTimeout(resolve, 250));
  const updatedText = document.getElementById('dialogue-text').textContent;
  if (updatedText !== 'The mission is ready') {
    throw new Error(`Expected next node text, got ${updatedText}`);
  }
};

testDialogueTree().then(() => {
  console.log('Dialogue UI test passed');
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
