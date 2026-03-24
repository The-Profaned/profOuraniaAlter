import { createPanel } from '../../../imports/ui-helper-functions.js';

export const createInfoTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BorderLayout',
		{ borderLayout: { hgap: 0, vgap: 8 } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const infoText = new javax.swing.JTextArea(
		'Boilerplate script UI template.\n\n' +
			'- Set script icon path in UI_BRANDING.scriptIconPath (UIConfigs/ui-branding.ts).\n' +
			'- Configure options using the tabs.\n' +
			'- Add script-specific settings as needed.\n' +
			'- Click Start Script to close UI and begin logic.\n',
	);
	infoText.setLineWrap(true);
	infoText.setWrapStyleWord(true);
	infoText.setEditable(false);

	const scrollPane = new javax.swing.JScrollPane(infoText);
	panel.add(scrollPane, java.awt.BorderLayout.CENTER);

	return panel;
};
