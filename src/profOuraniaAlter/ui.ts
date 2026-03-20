import { createLabel, createPanel } from '../imports/ui-helper-functions.js';
import { state } from './State Manager/script-state.js';

let startFrame: javax.swing.JFrame | null = null;

const ICON_SLOT_WIDTH: number = 56;
const ICON_SLOT_HEIGHT: number = 56;
const SCRIPT_ICON_PATH: string = '';

const SCRIPT_TITLE_PRIMARY_COLOR: string = '#111111';
const SCRIPT_TITLE_SECONDARY_COLOR: string = '#8b0000';

const SETTINGS_TAB_FRAME_SIZE = new java.awt.Dimension(480, 500);
const BEHAVIOUR_TAB_FRAME_SIZE = new java.awt.Dimension(480, 450);
const INFO_TAB_FRAME_SIZE = new java.awt.Dimension(480, 400);

const disposeStartFrame = (): void => {
	if (!startFrame) return;
	startFrame.dispose();
	startFrame = null;
};

const getThemeLabelForeground = (): java.awt.Color =>
	new javax.swing.JLabel('').getForeground();

const applyIconPathToLabel = (
	iconLabel: javax.swing.JLabel,
	iconPath: string,
): boolean => {
	const trimmedPath: string = iconPath.trim();
	if (trimmedPath.length === 0) {
		iconLabel.setText('ICON');
		iconLabel.setToolTipText('No icon configured');
		return false;
	}

	try {
		const normalizedPath: string = trimmedPath.replaceAll('\\', '/');
		iconLabel.setText(
			`<html><img src="file:${normalizedPath}" width="${ICON_SLOT_WIDTH - 6}" height="${ICON_SLOT_HEIGHT - 6}" /></html>`,
		);
		iconLabel.setToolTipText(trimmedPath);
		return true;
	} catch {
		iconLabel.setText('ICON');
		iconLabel.setToolTipText(`Invalid icon path: ${trimmedPath}`);
		return false;
	}
};

const getFrameSizeForTabIndex = (tabIndex: number): java.awt.Dimension => {
	switch (tabIndex) {
		case 0: {
			return SETTINGS_TAB_FRAME_SIZE;
		}
		case 1: {
			return BEHAVIOUR_TAB_FRAME_SIZE;
		}
		case 2: {
			return INFO_TAB_FRAME_SIZE;
		}
		default: {
			return SETTINGS_TAB_FRAME_SIZE;
		}
	}
};

const applyFrameSizeForTab = (
	frame: javax.swing.JFrame,
	tabIndex: number,
): void => {
	const targetSize = getFrameSizeForTabIndex(tabIndex);
	frame.setSize(targetSize.width, targetSize.height);
	frame.revalidate();
	frame.repaint();
};

const createSettingsTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const row1 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row1.add(new javax.swing.JLabel('Runecraft Mode:'));
	const modeCombo = new javax.swing.JComboBox([
		'Normal',
		'Conserve Energy',
	] as unknown as string[]);
	modeCombo.setSelectedItem(
		bot.bmCache.getString('ourania.ui.mode', 'Normal'),
	);
	modeCombo.addActionListener(() => {
		const selected = String(modeCombo.getSelectedItem() ?? 'Normal');
		bot.bmCache.saveString('ourania.ui.mode', selected);
	});
	row1.add(modeCombo);

	const row2 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row2.add(new javax.swing.JLabel('Bank Threshold %:'));
	const bankThresholdField = new javax.swing.JTextField(
		String(bot.bmCache.getInt('ourania.ui.bankThreshold', 50)),
		4,
	);
	bankThresholdField.addFocusListener(
		new java.awt.event.FocusAdapter({
			focusLost: () => {
				const parsed = Number(bankThresholdField.getText().trim());
				if (!Number.isNaN(parsed)) {
					bot.bmCache.saveInt('ourania.ui.bankThreshold', parsed);
				}
			},
		}),
	);
	row2.add(bankThresholdField);

	const options = new javax.swing.JPanel(new java.awt.GridLayout(0, 1, 0, 5));
	const enableDebug = new javax.swing.JCheckBox(
		'Enable Debug Logging',
		bot.bmCache.getBoolean('ourania.ui.debugLogging', true),
	);
	enableDebug.addActionListener(() => {
		bot.bmCache.saveBoolean(
			'ourania.ui.debugLogging',
			enableDebug.isSelected(),
		);
	});
	const enableSafety = new javax.swing.JCheckBox(
		'Enable Safety Checks',
		bot.bmCache.getBoolean('ourania.ui.safetyChecks', true),
	);
	enableSafety.addActionListener(() => {
		bot.bmCache.saveBoolean(
			'ourania.ui.safetyChecks',
			enableSafety.isSelected(),
		);
	});
	options.add(enableDebug);
	options.add(enableSafety);

	panel.add(row1);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(row2);
	panel.add(javax.swing.Box.createVerticalStrut(10));
	panel.add(options);

	return panel;
};

const createBehaviourTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const row1 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row1.add(new javax.swing.JLabel('Profile:'));
	const profileCombo = new javax.swing.JComboBox([
		'Balanced',
		'Fast Banking',
		'Prayer Priority',
	] as unknown as string[]);
	profileCombo.setSelectedItem(
		bot.bmCache.getString('ourania.ui.profile', 'Balanced'),
	);
	profileCombo.addActionListener(() => {
		const selected = String(profileCombo.getSelectedItem() ?? 'Balanced');
		bot.bmCache.saveString('ourania.ui.profile', selected);
	});
	row1.add(profileCombo);

	const row2 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row2.add(new javax.swing.JLabel('Tick Delay Min:'));
	const delayMinField = new javax.swing.JTextField(
		String(bot.bmCache.getInt('ourania.ui.delayMin', 1)),
		4,
	);
	delayMinField.addFocusListener(
		new java.awt.event.FocusAdapter({
			focusLost: () => {
				const parsed = Number(delayMinField.getText().trim());
				if (!Number.isNaN(parsed)) {
					bot.bmCache.saveInt('ourania.ui.delayMin', parsed);
				}
			},
		}),
	);
	row2.add(delayMinField);

	const row3 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row3.add(new javax.swing.JLabel('Tick Delay Max:'));
	const delayMaxField = new javax.swing.JTextField(
		String(bot.bmCache.getInt('ourania.ui.delayMax', 4)),
		4,
	);
	delayMaxField.addFocusListener(
		new java.awt.event.FocusAdapter({
			focusLost: () => {
				const parsed = Number(delayMaxField.getText().trim());
				if (!Number.isNaN(parsed)) {
					bot.bmCache.saveInt('ourania.ui.delayMax', parsed);
				}
			},
		}),
	);
	row3.add(delayMaxField);

	panel.add(row1);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(row2);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(row3);

	return panel;
};

const createInfoTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BorderLayout',
		{ borderLayout: { hgap: 0, vgap: 8 } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const infoText = new javax.swing.JTextArea(
		'profOuraniaAlter UI boilerplate.\n\n' +
			'- Gear/Inventory tab removed for this script.\n' +
			'- Configure settings and behaviour tabs.\n' +
			'- Click Start Script to begin logic.\n',
	);
	infoText.setLineWrap(true);
	infoText.setWrapStyleWord(true);
	infoText.setEditable(false);

	const scrollPane = new javax.swing.JScrollPane(infoText);
	panel.add(scrollPane, java.awt.BorderLayout.CENTER);

	return panel;
};

const createHeaderIconSlot = (): {
	panel: javax.swing.JPanel;
	iconLabel: javax.swing.JLabel;
} => {
	const iconPanel = createPanel(
		'FlowLayout',
		{ flowLayout: { horizontalGap: 0, verticalGap: 16 } },
		{ top: 0, left: 0, bottom: 0, right: 0 },
	);
	iconPanel.setLayout(
		new java.awt.FlowLayout(java.awt.FlowLayout.CENTER, 0, 16),
	);
	iconPanel.setPreferredSize(
		new java.awt.Dimension(ICON_SLOT_WIDTH, ICON_SLOT_HEIGHT),
	);
	iconPanel.setMinimumSize(
		new java.awt.Dimension(ICON_SLOT_WIDTH, ICON_SLOT_HEIGHT),
	);
	iconPanel.setBorder(
		javax.swing.BorderFactory.createLineBorder(java.awt.Color.DARK_GRAY, 1),
	);

	const iconLabel = new javax.swing.JLabel('ICON');
	iconLabel.setFont(new java.awt.Font('SansSerif', java.awt.Font.BOLD, 10));
	iconPanel.add(iconLabel);

	return { panel: iconPanel, iconLabel };
};

const createStartFrame = (): javax.swing.JFrame => {
	const labelColor: java.awt.Color = getThemeLabelForeground();
	const frame = new javax.swing.JFrame('profOuraniaAlter UI');
	frame.setDefaultCloseOperation(
		javax.swing.WindowConstants.DISPOSE_ON_CLOSE,
	);
	frame.setLayout(new java.awt.BorderLayout(10, 10));

	const mainPanel = createPanel(
		'BorderLayout',
		{ borderLayout: { hgap: 0, vgap: 10 } },
		{ top: 12, left: 12, bottom: 12, right: 12 },
	);

	const titlePanel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 0, left: 0, bottom: 0, right: 0 },
	);
	const titleHtml: string = `<html><span style="color:${SCRIPT_TITLE_PRIMARY_COLOR};">prof</span> <span style="color:${SCRIPT_TITLE_SECONDARY_COLOR};">OuraniaAlter</span></html>`;
	const title = new javax.swing.JLabel(titleHtml);
	title.setFont(new java.awt.Font('SansSerif', java.awt.Font.BOLD, 24));
	const subtitle = createLabel(
		'Reusable tabbed configuration UI',
		new java.awt.Font('SansSerif', java.awt.Font.PLAIN, 13),
		labelColor,
	).label;
	titlePanel.add(title);
	titlePanel.add(subtitle);

	const headerPanel = createPanel(
		'BorderLayout',
		{ borderLayout: { hgap: 10, vgap: 0 } },
		{ top: 0, left: 0, bottom: 0, right: 0 },
	);
	headerPanel.add(titlePanel, java.awt.BorderLayout.CENTER);
	const headerIconSlot = createHeaderIconSlot();
	applyIconPathToLabel(headerIconSlot.iconLabel, SCRIPT_ICON_PATH);
	headerPanel.add(headerIconSlot.panel, java.awt.BorderLayout.EAST);

	const tabbedPane = new javax.swing.JTabbedPane();
	tabbedPane.addTab('Settings', createSettingsTab());
	tabbedPane.addTab('Behaviour', createBehaviourTab());
	tabbedPane.addTab('Info', createInfoTab());
	tabbedPane.addChangeListener(() => {
		applyFrameSizeForTab(frame, tabbedPane.getSelectedIndex());
	});

	const startButton = new javax.swing.JButton('Start Script');
	startButton.setPreferredSize(new java.awt.Dimension(180, 36));
	startButton.addActionListener(() => {
		state.uiCompleted = true;
		disposeStartFrame();
	});

	const buttonPanel = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.CENTER, 0, 0),
	);
	buttonPanel.add(startButton);

	mainPanel.add(headerPanel, java.awt.BorderLayout.NORTH);
	mainPanel.add(tabbedPane, java.awt.BorderLayout.CENTER);
	mainPanel.add(buttonPanel, java.awt.BorderLayout.SOUTH);

	frame.add(mainPanel, java.awt.BorderLayout.CENTER);
	applyFrameSizeForTab(frame, tabbedPane.getSelectedIndex());
	frame.setLocationRelativeTo(null);
	return frame;
};

export const onUiStart = (): void => {
	state.uiCompleted = false;
	disposeStartFrame();
	startFrame = createStartFrame();
	startFrame.setVisible(true);
};

export const onUiEnd = (): void => {
	disposeStartFrame();
};
