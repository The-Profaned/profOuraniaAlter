import { state } from '../script-state.js';
import { logError, logRepairPouches } from '../logging.js';
import { NPC_CONTACT_DIALOG } from '../constants.js';
import {
	anyPouchDegraded,
	getDarkMageNpcContactMenuIndex,
	getNpcContactSecondActionText,
} from '../pouch-utils.js';

// Widget ID for NPC contact selection window when using Cast NPC Contact
const NPC_CONTACT_WIDGET_ID = 4915214;
const NPC_CONTACT_WIDGET_IDENTIFIER = 1;
const NPC_CONTACT_WIDGET_OPCODE = 57;
const NPC_CONTACT_WIDGET_PARAM0 = -1;

const isNpcContactSelectionWidgetVisible = (): boolean => {
	const widget = client.getWidget(NPC_CONTACT_WIDGET_ID);
	if (!widget) return false;
	if (widget.isHidden()) return false;
	return true;
};

export const RepairPouches = (): void => {
	switch (state.workflowStep) {
		case 0: {
			logRepairPouches('Reading NPC Contact action 2 before casting.');

			const secondActionText = getNpcContactSecondActionText();
			logRepairPouches(
				`NPC Contact action 2 read as: ${secondActionText ?? 'Unavailable'}`,
			);

			const darkMageMenuIndex = getDarkMageNpcContactMenuIndex();
			if (darkMageMenuIndex >= 0) {
				logRepairPouches(
					'Direct Dark Mage NPC Contact found as action 2. Using action index 1.',
				);
				try {
					bot.magic.cast('NPC_CONTACT', darkMageMenuIndex);
					state.workflowStep = 2;
				} catch (error) {
					logError(
						`Failed to cast direct Dark Mage: ${String(error)}`,
					);
					state.workflowStep = 0;
				}
			} else {
				logRepairPouches(
					'Action 2 is not Dark Mage NPC Contact. Using standard cast (index 0) with widget selection.',
				);
				try {
					bot.magic.cast('NPC_CONTACT', 0);
					state.workflowStep = 1;
				} catch (error) {
					logError(`NPC Contact spell cast failed: ${String(error)}`);
					state.workflowStep = 0;
				}
			}
			return;
		}
		case 1: {
			if (!isNpcContactSelectionWidgetVisible()) {
				logRepairPouches(
					'Waiting for NPC Contact widget to appear before selecting Dark Mage.',
				);
				return;
			}

			logRepairPouches('Selecting Dark Mage from NPC contact widget.');
			bot.widgets.interactSpecifiedWidget(
				NPC_CONTACT_WIDGET_ID,
				NPC_CONTACT_WIDGET_IDENTIFIER,
				NPC_CONTACT_WIDGET_OPCODE,
				NPC_CONTACT_WIDGET_PARAM0,
			);
			state.workflowStep = 2;
			return;
		}
		case 2: {
			const continued = bot.widgets.handleDialogue([]);
			if (continued) {
				logRepairPouches('Handled first NPC Contact continue dialog.');
				state.workflowStep = 3;
			}
			return;
		}
		case 3: {
			const selected = bot.widgets.handleDialogue([
				NPC_CONTACT_DIALOG.repairPouchesOption,
			]);
			if (selected) {
				logRepairPouches('Requested pouch repair from Dark Mage.');
				state.workflowStep = 4;
				return;
			}
			return;
		}
		case 4: {
			const continued = bot.widgets.handleDialogue([]);
			if (continued) {
				logRepairPouches('Handled second NPC Contact continue dialog.');
				state.workflowStep = 5;
			}
			return;
		}
		case 5: {
			if (!anyPouchDegraded()) {
				logRepairPouches(
					'Pouches repaired. Returning to previous state.',
				);
				state.pouchState.needsRepair = false;
				state.workflowStep = 0;
				state.mainState = state.pouchState.returnState;
			}
			return;
		}
		default: {
			logError(
				`RepairPouches: unexpected workflowStep ${state.workflowStep}. Resetting.`,
			);
			state.workflowStep = 0;
		}
	}
};
