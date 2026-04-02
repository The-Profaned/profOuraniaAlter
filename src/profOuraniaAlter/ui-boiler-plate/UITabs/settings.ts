import { createPanel } from '../../../imports/ui-helper-functions.js';
import {
	state,
	type PohAccessOption,
	type RuneOption,
	type RuneSelectionOption,
} from '../../State Manager/script-state.js';
import { persistUiPreferencesFromState } from '../UIConfigs/ui-preferences.js';

const RUNE_SELECTION_OPTIONS: string[] = [
	'Air',
	'Water',
	'Earth',
	'Fire',
	'Mind',
	'Dust',
	'Cosmic',
	'Astral',
	'Law',
	'Soul',
];

const POH_ACCESS_OPTIONS: string[] = [
	'Tablet',
	'Construction Cape',
	'Spellbook Swap',
];

const getSelectedRune = (comboBox: javax.swing.JComboBox): RuneOption =>
	String(comboBox.getSelectedItem()) as RuneOption;

const getSelectedPohAccess = (
	comboBox: javax.swing.JComboBox,
): PohAccessOption => String(comboBox.getSelectedItem()) as PohAccessOption;

const DEFAULT_RUNE_SELECTION: RuneOption = 'Air';

const getRuneSelectionValue = (selection: RuneSelectionOption): RuneOption =>
	selection === 'na' ? DEFAULT_RUNE_SELECTION : selection;

type SettingsLayoutState = {
	showPohAccess: boolean;
	showRunePouchOptions: boolean;
};

type SettingsTabController = {
	panel: javax.swing.JPanel;
	setPohAccessVisible: (visible: boolean) => void;
};

export const createSettingsTab = (
	onLayoutChange?: (layoutState: SettingsLayoutState) => void,
): SettingsTabController => {
	const panel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const notifyLayoutChange = (): void => {
		onLayoutChange?.({
			showPohAccess: pohAccessRow.isVisible(),
			showRunePouchOptions: runePouchOptionsPanel.isVisible(),
		});
	};

	const runesForBankingRow = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	runesForBankingRow.add(new javax.swing.JLabel('Runes For Banking:'));
	const runesForBankingSelect = new javax.swing.JComboBox(
		RUNE_SELECTION_OPTIONS as unknown as string[],
	);
	runesForBankingSelect.setSelectedItem(state.settings.runesForBanking);
	runesForBankingSelect.addActionListener(() => {
		state.settings.runesForBanking = getSelectedRune(runesForBankingSelect);
		persistUiPreferencesFromState();
	});
	runesForBankingRow.add(runesForBankingSelect);

	const pohAccessRow = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	pohAccessRow.add(new javax.swing.JLabel('PoH Access:'));
	const pohAccessSelect = new javax.swing.JComboBox(
		POH_ACCESS_OPTIONS as unknown as string[],
	);
	pohAccessSelect.setSelectedItem(state.settings.pohAccessOption);
	pohAccessSelect.addActionListener(() => {
		state.settings.pohAccessOption = getSelectedPohAccess(pohAccessSelect);
		persistUiPreferencesFromState();
	});
	pohAccessRow.add(pohAccessSelect);
	pohAccessRow.setAlignmentX(0);
	pohAccessRow.setMaximumSize(new java.awt.Dimension(10000, 30));
	pohAccessRow.setVisible(state.behaviour.runRestoreOption === 'PoH');

	const pohAccessSpacer = javax.swing.Box.createVerticalStrut(8);
	pohAccessSpacer.setVisible(state.behaviour.runRestoreOption === 'PoH');

	const divinePouchCheck = new javax.swing.JCheckBox('Divine Pouch', false);
	divinePouchCheck.setVisible(false);

	runesForBankingRow.setAlignmentX(0);
	runesForBankingRow.setMaximumSize(new java.awt.Dimension(10000, 30));

	const runePouchRow = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	runePouchRow.add(new javax.swing.JLabel('Rune Pouch:'));
	runePouchRow.setAlignmentX(0);
	runePouchRow.setMaximumSize(new java.awt.Dimension(10000, 32));

	const noLight = new javax.swing.JLabel('NO');
	noLight.setOpaque(true);
	noLight.setHorizontalAlignment(0);
	noLight.setBorder(javax.swing.BorderFactory.createEmptyBorder(3, 6, 3, 6));
	noLight.setPreferredSize(new java.awt.Dimension(46, 24));
	noLight.setForeground(java.awt.Color.WHITE);

	const yesLight = new javax.swing.JLabel('YES');
	yesLight.setOpaque(true);
	yesLight.setHorizontalAlignment(0);
	yesLight.setBorder(javax.swing.BorderFactory.createEmptyBorder(3, 6, 3, 6));
	yesLight.setPreferredSize(new java.awt.Dimension(46, 24));
	yesLight.setForeground(java.awt.Color.WHITE);

	const runePouchSwitch = new javax.swing.JButton('<');
	runePouchSwitch.setPreferredSize(new java.awt.Dimension(28, 24));
	runePouchSwitch.setOpaque(true);
	runePouchSwitch.setFocusPainted(false);
	runePouchSwitch.setForeground(java.awt.Color.WHITE);
	runePouchSwitch.setBorder(
		javax.swing.BorderFactory.createEmptyBorder(0, 0, 0, 0),
	);

	const rockerPanel = new javax.swing.JPanel(
		new java.awt.GridLayout(1, 3, 0, 0),
	);
	rockerPanel.setBorder(
		javax.swing.BorderFactory.createLineBorder(
			java.awt.Color.decode('#505050'),
			1,
		),
	);
	rockerPanel.setOpaque(true);
	rockerPanel.setBackground(java.awt.Color.decode('#2b2b2b'));
	rockerPanel.add(noLight);
	rockerPanel.add(runePouchSwitch);
	rockerPanel.add(yesLight);

	const runeSlotDropdownsPanel = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 6, 0),
	);

	const runePouchOptionsPanel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 2, left: 22, bottom: 0, right: 0 },
	);
	runePouchOptionsPanel.add(runeSlotDropdownsPanel);
	runePouchOptionsPanel.setVisible(false);
	runePouchOptionsPanel.setAlignmentX(0);
	runePouchOptionsPanel.setMaximumSize(new java.awt.Dimension(10000, 34));

	let isRunePouchEnabled = false;
	let isInitializing = true;

	const normalizeRunePouchSelections = (): void => {
		if (state.settings.runeSelection1 === 'na') {
			state.settings.runeSelection1 = DEFAULT_RUNE_SELECTION;
		}
		if (state.settings.runeSelection2 === 'na') {
			state.settings.runeSelection2 = DEFAULT_RUNE_SELECTION;
		}
		if (state.settings.runeSelection3 === 'na') {
			state.settings.runeSelection3 = DEFAULT_RUNE_SELECTION;
		}
		if (state.settings.runeSelection4 === 'na') {
			state.settings.runeSelection4 = DEFAULT_RUNE_SELECTION;
		}
	};

	const rebuildRunePouchSlotDropdowns = (slotCount: number): void => {
		runeSlotDropdownsPanel.removeAll();

		const savedSelections: RuneSelectionOption[] = [
			state.settings.runeSelection1,
			state.settings.runeSelection2,
			state.settings.runeSelection3,
			state.settings.runeSelection4,
		];

		for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
			const runeSelect = new javax.swing.JComboBox(
				RUNE_SELECTION_OPTIONS as unknown as string[],
			);
			runeSelect.setPreferredSize(new java.awt.Dimension(90, 22));
			runeSelect.setSelectedItem(
				getRuneSelectionValue(savedSelections[slotIndex]),
			);
			runeSelect.addActionListener(() => {
				if (isInitializing) return;
				const selectedRune = getSelectedRune(runeSelect);
				switch (slotIndex) {
					case 0: {
						state.settings.runeSelection1 = selectedRune;
						break;
					}
					case 1: {
						state.settings.runeSelection2 = selectedRune;
						break;
					}
					case 2: {
						state.settings.runeSelection3 = selectedRune;
						break;
					}
					case 3: {
						state.settings.runeSelection4 = selectedRune;
						break;
					}
				}
				persistUiPreferencesFromState();
			});
			runeSlotDropdownsPanel.add(runeSelect);
		}

		runeSlotDropdownsPanel.revalidate();
		runeSlotDropdownsPanel.repaint();
	};

	const applyRunePouchSwitchVisual = (persistChanges = true): void => {
		if (isRunePouchEnabled) {
			normalizeRunePouchSelections();
			runePouchSwitch.setText('>');
			runePouchSwitch.setBackground(java.awt.Color.decode('#3d8d41'));
			runePouchSwitch.setToolTipText('Rune Pouch: Yes');
			noLight.setBackground(java.awt.Color.decode('#4e2525'));
			yesLight.setBackground(java.awt.Color.decode('#2e7d32'));
		} else {
			runePouchSwitch.setText('<');
			runePouchSwitch.setBackground(java.awt.Color.decode('#a23636'));
			runePouchSwitch.setToolTipText('Rune Pouch: No');
			noLight.setBackground(java.awt.Color.decode('#8b1e1e'));
			yesLight.setBackground(java.awt.Color.decode('#274229'));
		}

		state.settings.runePouchEnabled = isRunePouchEnabled;
		if (persistChanges) {
			persistUiPreferencesFromState();
		}
		divinePouchCheck.setVisible(isRunePouchEnabled);
		runePouchOptionsPanel.setVisible(isRunePouchEnabled);
		rebuildRunePouchSlotDropdowns(divinePouchCheck.isSelected() ? 4 : 3);

		rockerPanel.revalidate();
		rockerPanel.repaint();
		panel.revalidate();
		panel.repaint();
		notifyLayoutChange();
	};

	divinePouchCheck.addActionListener(() => {
		if (isInitializing) return;
		state.settings.divinePouchEnabled = divinePouchCheck.isSelected();
		persistUiPreferencesFromState();
		rebuildRunePouchSlotDropdowns(divinePouchCheck.isSelected() ? 4 : 3);
		runePouchOptionsPanel.revalidate();
		runePouchOptionsPanel.repaint();
		panel.revalidate();
		panel.repaint();
	});

	runePouchSwitch.addActionListener(() => {
		if (isInitializing) return;
		isRunePouchEnabled = !isRunePouchEnabled;
		applyRunePouchSwitchVisual();
	});

	isRunePouchEnabled = state.settings.runePouchEnabled;
	divinePouchCheck.setSelected(state.settings.divinePouchEnabled);

	applyRunePouchSwitchVisual(false);
	isInitializing = false;

	const setPohAccessVisible = (visible: boolean): void => {
		pohAccessRow.setVisible(visible);
		pohAccessSpacer.setVisible(visible);
		panel.revalidate();
		panel.repaint();
		notifyLayoutChange();
	};

	runePouchRow.add(rockerPanel);
	runePouchRow.add(javax.swing.Box.createHorizontalStrut(10));
	runePouchRow.add(divinePouchCheck);

	panel.add(runesForBankingRow);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(pohAccessRow);
	panel.add(pohAccessSpacer);
	panel.add(runePouchRow);
	panel.add(javax.swing.Box.createVerticalStrut(6));
	panel.add(runePouchOptionsPanel);

	notifyLayoutChange();

	return {
		panel,
		setPohAccessVisible,
	};
};
