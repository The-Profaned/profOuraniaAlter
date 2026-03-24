import { createPanel } from '../../../imports/ui-helper-functions.js';
import {
	KINGDOM_DIVIDED_VARBIT,
	RUNECRAFTING_POUCH_LEVELS,
	TEST_MODE_ENABLED,
} from '../../State Manager/constants.js';

export const createBehaviourTab = (
	onPouchVisibilityChange?: (showPouchSelection: boolean) => void,
): javax.swing.JPanel => {
	const panel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const row1 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row1.add(new javax.swing.JLabel('Run Restore:'));

	// Build dropdown options conditionally based on Kingdom Divided completion
	let hasKingdomDivided: boolean =
		client.getVarbitValue(KINGDOM_DIVIDED_VARBIT) > 0;

	// TEST MODE: Override with random varbit state
	if (TEST_MODE_ENABLED) {
		hasKingdomDivided = Math.random() > 0.5;
		log.print(
			`[TEST MODE] Kingdom Divided varbit set to: ${hasKingdomDivided}`,
		);
	}

	const runRestoreOptions = hasKingdomDivided
		? ['No Restore', 'Stamina Potions', 'Vile Vigour']
		: ['No Restore', 'Stamina Potions'];

	row1.add(
		new javax.swing.JComboBox(runRestoreOptions as unknown as string[]),
	);

	const colossalRow = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 2),
	);

	// Get player's runecrafting level
	let runecraftingLevel: number = client.getRealSkillLevel(
		net.runelite.api.Skill.RUNECRAFT,
	);

	// TEST MODE: Override with random level (1-99)
	if (TEST_MODE_ENABLED) {
		runecraftingLevel = Math.floor(Math.random() * 99) + 1;
		log.print(
			`[TEST MODE] Runecrafting level set to: ${runecraftingLevel}`,
		);
	}

	// Colossal pouch is only available at level 25+
	const canUseColossal: boolean =
		runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.COLOSSAL;

	const colossalPouchCheck = new javax.swing.JCheckBox(
		'Colossal Pouch',
		canUseColossal,
	);
	colossalPouchCheck.setEnabled(canUseColossal);
	colossalRow.add(colossalPouchCheck);

	const pouchSelectionPanel = new javax.swing.JPanel(
		new java.awt.GridLayout(2, 2, 8, 8),
	);
	const labelColor: java.awt.Color = new javax.swing.JLabel(
		'',
	).getForeground();
	const pouchBorder: javax.swing.border.TitledBorder =
		javax.swing.BorderFactory.createTitledBorder(' Pouches in inventory ');
	pouchBorder.setTitleColor(labelColor);
	pouchSelectionPanel.setBorder(pouchBorder);

	// Create pouch checkboxes with level-based availability
	const smallCheck = new javax.swing.JCheckBox('Small', false);
	smallCheck.setEnabled(runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.SMALL);

	const mediumCheck = new javax.swing.JCheckBox('Medium', false);
	mediumCheck.setEnabled(
		runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.MEDIUM,
	);

	const largeCheck = new javax.swing.JCheckBox('Large', false);
	largeCheck.setEnabled(runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.LARGE);

	const giantCheck = new javax.swing.JCheckBox('Giant', false);
	giantCheck.setEnabled(runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.GIANT);

	const setPouchOptionsEnabled = (enabled: boolean): void => {
		smallCheck.setEnabled(
			enabled && runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.SMALL,
		);
		mediumCheck.setEnabled(
			enabled && runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.MEDIUM,
		);
		largeCheck.setEnabled(
			enabled && runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.LARGE,
		);
		giantCheck.setEnabled(
			enabled && runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.GIANT,
		);
	};

	pouchSelectionPanel.add(smallCheck);
	pouchSelectionPanel.add(largeCheck);
	pouchSelectionPanel.add(mediumCheck);
	pouchSelectionPanel.add(giantCheck);

	// If Colossal is unavailable, default to pouch selection being open.
	const showPouchSelectionByDefault: boolean = !canUseColossal;
	pouchSelectionPanel.setVisible(showPouchSelectionByDefault);
	setPouchOptionsEnabled(!colossalPouchCheck.isSelected());

	colossalPouchCheck.addActionListener(() => {
		const useColossal = colossalPouchCheck.isSelected();
		const showPouchSelection = !useColossal;

		if (useColossal) {
			smallCheck.setSelected(false);
			mediumCheck.setSelected(false);
			largeCheck.setSelected(false);
			giantCheck.setSelected(false);
			setPouchOptionsEnabled(false);
		} else {
			setPouchOptionsEnabled(true);
		}

		pouchSelectionPanel.setVisible(showPouchSelection);
		onPouchVisibilityChange?.(showPouchSelection);
		pouchSelectionPanel.revalidate();
		pouchSelectionPanel.repaint();
		panel.revalidate();
		panel.repaint();
	});

	onPouchVisibilityChange?.(showPouchSelectionByDefault);

	panel.add(row1);
	panel.add(javax.swing.Box.createVerticalStrut(4));
	panel.add(colossalRow);
	panel.add(javax.swing.Box.createVerticalStrut(0));
	panel.add(pouchSelectionPanel);

	return panel;
};
