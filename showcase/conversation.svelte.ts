// A pretend assistant: canned replies picked by keyword, each with the face the robot should make.
// Real hosts map their own app state to moods the same way (thinking → focus, done → celebrate).

import type { Emotion } from '../src/lib/index.ts';
import { stage } from './stage.svelte.ts';

export type Message = { from: 'user' | 'bot'; text: string };
type Reply = { text: string; emotion: Emotion; celebrate?: boolean };

const REPLIES: [RegExp, Reply][] = [
	[
		/order|track|ship|deliver|package/i,
		{
			text: 'Found it! Order #A-2047 left our warehouse this morning and should reach you on Thursday.',
			emotion: 'happy',
			celebrate: true
		}
	],
	[
		/return|refund|exchange/i,
		{
			text: 'You have 30 days to send it back, free of charge. Want me to print a return label?',
			emotion: 'curious'
		}
	],
	[
		/joke|funny|laugh/i,
		{
			text: 'Why did the robot go on holiday? It needed to recharge its batteries.',
			emotion: 'happy'
		}
	],
	[
		/broken|damaged|wrong|terrible|awful/i,
		{
			text: "Oh no, I'm really sorry about that. I'll send a replacement right away.",
			emotion: 'sad'
		}
	],
	[
		/sad|bad day|upset|stress|worried/i,
		{
			text: "That sounds rough. I'm here if you want to talk, or I can find you something nice.",
			emotion: 'worried'
		}
	],
	[
		/password|secret|hack|admin/i,
		{ text: "Hmm. I'm not sure I should help with that one…", emotion: 'suspicious' }
	],
	[/tired|sleep|night|bed/i, { text: 'Same here, honestly. Good night soon?', emotion: 'tired' }],
	[/thank|love|great|awesome/i, { text: "Aww, you're welcome!", emotion: 'love' }],
	[/^(hi|hello|hey)\b/i, { text: 'Hello! How can I help today?', emotion: 'happy' }]
];
const FALLBACK: Reply = {
	text: 'Interesting! This is only a demo, so I know a few tricks: ask me to track an order, about returns, or for a joke.',
	emotion: 'curious'
};

const THINK_MS = 1400; // the robot shows `focus` while it "types"
const CALM_MS = 5000; // then its reaction fades back to neutral

export function createConversation(greeting: string) {
	const messages: Message[] = $state([{ from: 'bot', text: greeting }]);
	let thinking = $state(false);
	let timer = 0;

	return {
		get messages() {
			return messages;
		},
		get thinking() {
			return thinking;
		},
		send(text: string) {
			text = text.trim();
			if (!text || thinking) return;
			messages.push({ from: 'user', text });
			thinking = true;
			stage.emotion = 'focus';
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				const reply = REPLIES.find(([re]) => re.test(text))?.[1] ?? FALLBACK;
				messages.push({ from: 'bot', text: reply.text });
				thinking = false;
				stage.emotion = reply.emotion;
				if (reply.celebrate) stage.celebrate();
				timer = window.setTimeout(() => (stage.emotion = 'neutral'), CALM_MS);
			}, THINK_MS);
		},
		stop() {
			clearTimeout(timer);
		}
	};
}

export const SUGGESTIONS = [
	'Track my order',
	'Tell me a joke',
	'My item arrived broken',
	'Thanks!'
];
