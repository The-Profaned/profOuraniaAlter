import { createPanel } from '../../../imports/ui-helper-functions.js';
import { state, MainStates } from '../../State Manager/script-state.js';

type MainStateType = MainStates;

const STATE_OPTIONS: MainStateType[] = [
	MainStates.TRAVEL_TO_OURANIA_ALTAR,
	MainStates.INTERACT_WITH_OURANIA_ALTAR,
	MainStates.TRAVEL_TO_PRAYER_ALTAR,
	MainStates.TRAVEL_TO_POH,
	MainStates.TRAVEL_TO_DESERT,
	MainStates.SWAP_MAGE_BOOK,
	MainStates.USE_PRAYER_ALTAR,
	MainStates.TRAVEL_TO_BANK,
	MainStates.INTERACT_WITH_BANK,
	MainStates.IDLE,
];

export const createDebugTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const title = new javax.swing.JLabel('Debug Start Controls');
	title.setAlignmentX(0);
	title.setFont(new java.awt.Font('SansSerif', java.awt.Font.BOLD, 14));

	const forceStateCheck = new javax.swing.JCheckBox(
		'Force selected state on start',
		state.debugTab.forceStateOnStart,
	);
	forceStateCheck.setAlignmentX(0);
	forceStateCheck.addActionListener(() => {
		state.debugTab.forceStateOnStart = forceStateCheck.isSelected();
	});

	const stateRow = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	stateRow.setAlignmentX(0);
	stateRow.add(new javax.swing.JLabel('Start In State:'));

	const stateSelect = new javax.swing.JComboBox(
		STATE_OPTIONS as unknown as string[],
	);
	stateSelect.setPreferredSize(new java.awt.Dimension(260, 24));
	stateSelect.setSelectedItem(state.debugTab.forcedMainState);
	stateSelect.addActionListener(() => {
		state.debugTab.forcedMainState = String(
			stateSelect.getSelectedItem(),
		) as MainStateType;
	});
	stateRow.add(stateSelect);

	const helpText = new javax.swing.JTextArea(
		'Choose a state to start in for focused testing.\n' +
			'When debug mode is enabled in constants, normal start sync is disabled.',
	);
	helpText.setLineWrap(true);
	helpText.setWrapStyleWord(true);
	helpText.setEditable(false);
	helpText.setOpaque(false);
	helpText.setAlignmentX(0);

	panel.add(title);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(forceStateCheck);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(stateRow);
	panel.add(javax.swing.Box.createVerticalStrut(10));
	panel.add(helpText);

	return panel;
};
