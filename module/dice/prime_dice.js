import { PrimeDiceSheet } from "./PrimeDiceSheet.js";

export class PRIME_DICE {
	static dicePopup = null;

	static async init() {
	}

	static ready() {
	}

	static onRenderChatLog() {
		PRIME_DICE.attachToRollDiceIcon()
	}

	static attachToRollDiceIcon() {
		var diceIcon = $('.chat-control-icon .fas.fa-dice-d20');

		diceIcon.on('click', (event) => {
			PRIME_DICE.openPrimeDice("rollDiceIcon");
		});
	}

	static openPrimeDice(title, left, top) {
		let options = { left: left, top: top, log: title };
		if (!PRIME_DICE.dicePopup) {
			PRIME_DICE.dicePopup = new PrimeDiceSheet(options);
		} else if (left || top) {
			PRIME_DICE.dicePopup.position.left = left;
			PRIME_DICE.dicePopup.position.top = top;
		}
		PRIME_DICE.dicePopup.render(true, options);
	}
}

Hooks.once('init', PRIME_DICE.init);
Hooks.on('ready', PRIME_DICE.ready);
Hooks.on('renderChatLog', PRIME_DICE.onRenderChatLog);
