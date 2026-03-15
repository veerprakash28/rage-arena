import { ActionType } from '@rage-arena/shared';

// Maps keyboard codes to ActionTypes
const KEY_MAP: Record<string, ActionType> = {
    'ArrowLeft': ActionType.MOVE_LEFT,
    'a': ActionType.MOVE_LEFT,
    'ArrowRight': ActionType.MOVE_RIGHT,
    'd': ActionType.MOVE_RIGHT,
    'ArrowUp': ActionType.JUMP,
    'w': ActionType.JUMP,
    ' ': ActionType.BLOCK,
    'j': ActionType.PUNCH,
    'k': ActionType.KICK,
    'l': ActionType.SMASH,
    'e': ActionType.SPECIAL
};

export class InputManager {
    private socket: any; // Socket type
    private roomCode: string;
    private activeKeys: Set<string> = new Set();

    // Track previously sent actions to prevent spamming
    private sentActions: Set<ActionType> = new Set();

    constructor(socket: any, roomCode: string) {
        this.socket = socket;
        this.roomCode = roomCode;
    }

    public init() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    public cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        // Unpress everything on cleanup to ensure server doesn't think we are holding moving right forever
        Array.from(this.sentActions).forEach(action => {
            this.socket.emit('game-action', { code: this.roomCode, action, isPressed: false });
        });
        this.sentActions.clear();
        this.activeKeys.clear();
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        // Ignore chat input
        if (document.activeElement?.tagName === 'INPUT') return;

        const key = e.key.toLowerCase() === ' ' ? ' ' : e.key; // preserve spacebar, else lowercase letters
        const action = KEY_MAP[key] || KEY_MAP[e.key];

        if (action && !this.activeKeys.has(key)) {
            this.activeKeys.add(key);
            if (!this.sentActions.has(action)) {
                this.sentActions.add(action);
                this.socket.emit('game-action', { code: this.roomCode, action, isPressed: true });
            }
        }
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase() === ' ' ? ' ' : e.key;
        const action = KEY_MAP[key] || KEY_MAP[e.key];

        if (action && this.activeKeys.has(key)) {
            this.activeKeys.delete(key);

            // If another key mapped to the same action is NOT being held, unset it
            let stillHolding = false;
            for (const [mappedKey, mappedAction] of Object.entries(KEY_MAP)) {
                if (mappedAction === action && this.activeKeys.has(mappedKey)) {
                    stillHolding = true; break;
                }
            }

            if (!stillHolding) {
                this.sentActions.delete(action);
                this.socket.emit('game-action', { code: this.roomCode, action, isPressed: false });
            }
        }
    }
}
