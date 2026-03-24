import { createPanel } from '../../../imports/ui-helper-functions.js';

export const createSettingsTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BoxLayout',
		{ boxLayout: { axis: javax.swing.BoxLayout.Y_AXIS } },
		{ top: 10, left: 10, bottom: 10, right: 10 },
	);

	const row1 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row1.add(new javax.swing.JLabel('Primary Weapon:'));
	row1.add(
		new javax.swing.JComboBox([
			'Any',
			'Melee',
			'Ranged',
			'Magic',
		] as unknown as string[]),
	);

	const row2 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row2.add(new javax.swing.JLabel('Minimum Food:'));
	row2.add(new javax.swing.JTextField('5', 4));

	const row3 = new javax.swing.JPanel(
		new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 8, 0),
	);
	row3.add(new javax.swing.JLabel('Minimum Prayer Dose:'));
	row3.add(new javax.swing.JTextField('4', 4));

	const options = new javax.swing.JPanel(new java.awt.GridLayout(0, 1, 0, 5));
	options.add(new javax.swing.JCheckBox('Use Potions', true));
	options.add(new javax.swing.JCheckBox('Enable Prayer Flicking', false));
	options.add(new javax.swing.JCheckBox('Loot Valuable Drops', true));

	panel.add(row1);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(row2);
	panel.add(javax.swing.Box.createVerticalStrut(8));
	panel.add(row3);
	panel.add(javax.swing.Box.createVerticalStrut(10));
	panel.add(options);

	return panel;
};
