import { createPanel } from '../../../imports/ui-helper-functions.js';
import {
	DESERT_AMULET_VARBIT,
	KINGDOM_DIVIDED_VARBIT,
	RUNECRAFTING_POUCH_LEVELS,
	TEST_MODE_ENABLED,
} from '../../State Manager/constants.js';
import {
	state,
	type RunRestoreOption,
} from '../../State Manager/script-state.js';

export const createBehaviourTab = (
	onPouchVisibilityChange?: (showPouchSelection: boolean) => void,
	onRunRestoreOptionChange?: (runRestoreOption: RunRestoreOption) => void,
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
	let hasDesertAmulet: boolean =
		client.getVarbitValue(DESERT_AMULET_VARBIT) > 0;

	// TEST MODE: Override with random varbit states
	if (TEST_MODE_ENABLED) {
		hasKingdomDivided = Math.random() > 0.5;
		hasDesertAmulet = Math.random() > 0.5;
		log.print(
			`[TEST MODE] Kingdom Divided varbit set to: ${hasKingdomDivided}`,
		);
		log.print(
			`[TEST MODE] Desert Amulet varbit set to: ${hasDesertAmulet}`,
		);
	}

	const runRestoreOptions: string[] = [
		'No Restore',
		'Stamina Potions',
		'PoH',
	];

	if (hasKingdomDivided) {
		runRestoreOptions.push('Vile Vigour');
	}

	if (hasDesertAmulet) {
		runRestoreOptions.push('Desert Amulet');
	}

	const runRestoreSelect = new javax.swing.JComboBox(
		runRestoreOptions as unknown as string[],
	);
	const hasSavedRunRestoreOption = runRestoreOptions.includes(
		state.behaviour.runRestoreOption,
	);
	runRestoreSelect.setSelectedItem(
		hasSavedRunRestoreOption
			? state.behaviour.runRestoreOption
			: runRestoreOptions[0],
	);
	state.behaviour.runRestoreOption = String(
		runRestoreSelect.getSelectedItem(),
	) as RunRestoreOption;
	onRunRestoreOptionChange?.(state.behaviour.runRestoreOption);
	runRestoreSelect.addActionListener(() => {
		state.behaviour.runRestoreOption = String(
			runRestoreSelect.getSelectedItem(),
		) as RunRestoreOption;
		onRunRestoreOptionChange?.(state.behaviour.runRestoreOption);
	});
	row1.add(runRestoreSelect);

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
		false,
	);
	colossalPouchCheck.setSelected(
		canUseColossal && state.behaviour.useColossalPouch,
	);
	colossalPouchCheck.setEnabled(canUseColossal);
	state.behaviour.useColossalPouch = colossalPouchCheck.isSelected();
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
	const smallCheck = new javax.swing.JCheckBox(
		'Small',
		state.behaviour.useSmallPouch,
	);
	smallCheck.setEnabled(runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.SMALL);
	if (!smallCheck.isEnabled()) state.behaviour.useSmallPouch = false;

	const mediumCheck = new javax.swing.JCheckBox(
		'Medium',
		state.behaviour.useMediumPouch,
	);
	mediumCheck.setEnabled(
		runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.MEDIUM,
	);
	if (!mediumCheck.isEnabled()) state.behaviour.useMediumPouch = false;

	const largeCheck = new javax.swing.JCheckBox(
		'Large',
		state.behaviour.useLargePouch,
	);
	largeCheck.setEnabled(runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.LARGE);
	if (!largeCheck.isEnabled()) state.behaviour.useLargePouch = false;

	const giantCheck = new javax.swing.JCheckBox(
		'Giant',
		state.behaviour.useGiantPouch,
	);
	giantCheck.setEnabled(runecraftingLevel >= RUNECRAFTING_POUCH_LEVELS.GIANT);
	if (!giantCheck.isEnabled()) state.behaviour.useGiantPouch = false;

	smallCheck.addActionListener(() => {
		state.behaviour.useSmallPouch = smallCheck.isSelected();
	});
	mediumCheck.addActionListener(() => {
		state.behaviour.useMediumPouch = mediumCheck.isSelected();
	});
	largeCheck.addActionListener(() => {
		state.behaviour.useLargePouch = largeCheck.isSelected();
	});
	giantCheck.addActionListener(() => {
		state.behaviour.useGiantPouch = giantCheck.isSelected();
	});

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

	if (!colossalPouchCheck.isSelected()) {
		smallCheck.setSelected(state.behaviour.useSmallPouch);
		mediumCheck.setSelected(state.behaviour.useMediumPouch);
		largeCheck.setSelected(state.behaviour.useLargePouch);
		giantCheck.setSelected(state.behaviour.useGiantPouch);
	}

	colossalPouchCheck.addActionListener(() => {
		const useColossal = colossalPouchCheck.isSelected();
		const showPouchSelection = !useColossal;
		state.behaviour.useColossalPouch = useColossal;

		if (useColossal) {
			smallCheck.setSelected(false);
			mediumCheck.setSelected(false);
			largeCheck.setSelected(false);
			giantCheck.setSelected(false);
			state.behaviour.useSmallPouch = false;
			state.behaviour.useMediumPouch = false;
			state.behaviour.useLargePouch = false;
			state.behaviour.useGiantPouch = false;
			setPouchOptionsEnabled(false);
		} else {
			smallCheck.setSelected(state.behaviour.useSmallPouch);
			mediumCheck.setSelected(state.behaviour.useMediumPouch);
			largeCheck.setSelected(state.behaviour.useLargePouch);
			giantCheck.setSelected(state.behaviour.useGiantPouch);
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
