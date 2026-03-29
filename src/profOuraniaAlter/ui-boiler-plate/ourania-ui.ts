import { createLabel, createPanel } from '../../imports/ui-helper-functions.js';
import {
	createBehaviourTab,
	createDebugTab,
	createInfoTab,
	UI_BRANDING,
	createSettingsTab,
} from './UIConfigs/ui.js';
import { state } from '../State Manager/script-state.js';
import { logOuraniaAlter } from '../State Manager/logging.js';
import { LOAD_DEBUG_UI_TAB } from '../State Manager/constants.js';

let startFrame: javax.swing.JFrame | null = null;

// Tab Sizes
const SETTINGS_TAB_FRAME_SIZE_COLLAPSED = new java.awt.Dimension(480, 310);
const SETTINGS_TAB_FRAME_SIZE_POH_EXPANDED = new java.awt.Dimension(480, 340);
const SETTINGS_TAB_FRAME_SIZE_RUNE_POUCH_EXPANDED = new java.awt.Dimension(
	480,
	355,
);
const SETTINGS_TAB_FRAME_SIZE_FULL = new java.awt.Dimension(480, 385);
const BEHAVIOUR_TAB_FRAME_SIZE_COLLAPSED = new java.awt.Dimension(480, 280);
const BEHAVIOUR_TAB_FRAME_SIZE_EXPANDED = new java.awt.Dimension(480, 380);
const DEBUG_TAB_FRAME_SIZE = new java.awt.Dimension(480, 330);
const INFO_TAB_FRAME_SIZE = new java.awt.Dimension(480, 400);

let showBehaviourPouchSelection = false;
let showSettingsPohAccess = false;
let showSettingsRunePouchOptions = false;

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
		type ScalableImage = {
			getScaledInstance: (
				width: number,
				height: number,
				hints: number,
			) => unknown;
		};

		type IconWithSize = javax.swing.Icon & {
			getIconWidth: () => number;
			getIconHeight: () => number;
			getImage: () => ScalableImage;
		};

		type SwingWithImageIcon = typeof javax.swing & {
			ImageIcon: new (source: string | object) => IconWithSize;
		};

		const swingWithImageIcon = javax.swing as SwingWithImageIcon;
		const baseIcon = new swingWithImageIcon.ImageIcon(trimmedPath);
		if (baseIcon.getIconWidth() <= 0 || baseIcon.getIconHeight() <= 0) {
			iconLabel.setText('ICON');
			iconLabel.setToolTipText(`Unable to load icon: ${trimmedPath}`);
			return false;
		}

		const scaledImage: unknown = baseIcon
			.getImage()
			.getScaledInstance(
				UI_BRANDING.iconSlotWidth - 6,
				UI_BRANDING.iconSlotHeight - 6,
				4,
			);
		const scaledIcon = new swingWithImageIcon.ImageIcon(
			scaledImage as object,
		);

		iconLabel.setIcon(scaledIcon as unknown as javax.swing.Icon);
		iconLabel.setText('');
		iconLabel.setToolTipText(trimmedPath);
		return true;
	} catch {
		iconLabel.setText('ICON');
		iconLabel.setToolTipText(`Invalid icon path: ${trimmedPath}`);
		return false;
	}
};

const getFrameSizeForTabIndex = (tabIndex: number): java.awt.Dimension => {
	const infoTabIndex: number = LOAD_DEBUG_UI_TAB ? 3 : 2;
	const debugTabIndex: number = 2;

	switch (tabIndex) {
		case 0: {
			return showBehaviourPouchSelection
				? BEHAVIOUR_TAB_FRAME_SIZE_EXPANDED
				: BEHAVIOUR_TAB_FRAME_SIZE_COLLAPSED;
		}
		case 1: {
			if (showSettingsPohAccess && showSettingsRunePouchOptions) {
				return SETTINGS_TAB_FRAME_SIZE_FULL;
			}

			if (showSettingsRunePouchOptions) {
				return SETTINGS_TAB_FRAME_SIZE_RUNE_POUCH_EXPANDED;
			}

			if (showSettingsPohAccess) {
				return SETTINGS_TAB_FRAME_SIZE_POH_EXPANDED;
			}

			return SETTINGS_TAB_FRAME_SIZE_COLLAPSED;
		}
		case 2: {
			if (LOAD_DEBUG_UI_TAB) {
				return DEBUG_TAB_FRAME_SIZE;
			}

			return INFO_TAB_FRAME_SIZE;
		}
		case 3: {
			if (LOAD_DEBUG_UI_TAB) {
				return INFO_TAB_FRAME_SIZE;
			}

			return SETTINGS_TAB_FRAME_SIZE_COLLAPSED;
		}
		default: {
			if (tabIndex === debugTabIndex && LOAD_DEBUG_UI_TAB) {
				return DEBUG_TAB_FRAME_SIZE;
			}

			if (tabIndex === infoTabIndex) {
				return INFO_TAB_FRAME_SIZE;
			}

			return SETTINGS_TAB_FRAME_SIZE_COLLAPSED;
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
		new java.awt.Dimension(
			UI_BRANDING.iconSlotWidth,
			UI_BRANDING.iconSlotHeight,
		),
	);
	iconPanel.setMinimumSize(
		new java.awt.Dimension(
			UI_BRANDING.iconSlotWidth,
			UI_BRANDING.iconSlotHeight,
		),
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
	const frame = new javax.swing.JFrame(UI_BRANDING.frameTitle);
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
	const titleHtml: string = `<html><span style="color:${UI_BRANDING.titlePrimaryColor};">${UI_BRANDING.titlePrimaryText}</span> <span style="color:${UI_BRANDING.titleSecondaryColor};">${UI_BRANDING.titleSecondaryText}</span></html>`;
	const title = new javax.swing.JLabel(titleHtml);
	title.setFont(new java.awt.Font('SansSerif', java.awt.Font.BOLD, 24));
	const subtitle = createLabel(
		UI_BRANDING.subtitle,
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
	applyIconPathToLabel(headerIconSlot.iconLabel, UI_BRANDING.scriptIconPath);
	headerPanel.add(headerIconSlot.panel, java.awt.BorderLayout.EAST);

	const tabbedPane = new javax.swing.JTabbedPane();
	const settingsTab = createSettingsTab((layoutState) => {
		showSettingsPohAccess = layoutState.showPohAccess;
		showSettingsRunePouchOptions = layoutState.showRunePouchOptions;

		if (tabbedPane.getSelectedIndex() === 1) {
			applyFrameSizeForTab(frame, 1);
		}
	});
	tabbedPane.addTab(
		'Behaviour',
		createBehaviourTab(
			(showPouchSelection) => {
				showBehaviourPouchSelection = showPouchSelection;
				if (tabbedPane.getSelectedIndex() === 0) {
					applyFrameSizeForTab(frame, 0);
				}
			},
			(runRestoreOption) => {
				settingsTab.setPohAccessVisible(runRestoreOption === 'PoH');
			},
		),
	);
	tabbedPane.addTab('Settings', settingsTab.panel);
	if (LOAD_DEBUG_UI_TAB) {
		tabbedPane.addTab('Debug', createDebugTab());
	}
	tabbedPane.addTab('Info', createInfoTab());
	tabbedPane.addChangeListener(() => {
		applyFrameSizeForTab(frame, tabbedPane.getSelectedIndex());
	});

	const startButton = new javax.swing.JButton('Start Script');
	startButton.setPreferredSize(new java.awt.Dimension(180, 36));
	startButton.addActionListener(() => {
		if (LOAD_DEBUG_UI_TAB && state.debugTab.forceStateOnStart) {
			state.mainState = state.debugTab.forcedMainState;
			state.lastLoggedMainState = null;
			logOuraniaAlter(
				`Debug start forced state: ${state.debugTab.forcedMainState}`,
			);
		}

		state.uiCompleted = true;
		logOuraniaAlter('UI completed. Starting script logic...');
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

export const onTemplateStart = (): void => {
	state.gameTick = 0;
	state.uiCompleted = false;
	disposeStartFrame();
	startFrame = createStartFrame();
	startFrame.setVisible(true);
	logOuraniaAlter('Script started. Waiting for UI input.');
};

export const onTemplateEnd = (): void => {
	disposeStartFrame();
	logOuraniaAlter('Script ended.');
};
