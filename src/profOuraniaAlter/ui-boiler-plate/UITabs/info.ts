import { createPanel } from '../../../imports/ui-helper-functions.js';

export const createInfoTab = (): javax.swing.JPanel => {
	const panel = createPanel(
		'BorderLayout',
		{ borderLayout: { hgap: 0, vgap: 8 } },
		{ top: 8, left: 8, bottom: 8, right: 8 },
	);

	const infoText = new javax.swing.JTextArea(
		'Ourania Alter - Quick Guide\n\n' +
			'Requirements\n' +
			'- Lunar spellbook\n' +
			"- Bank on the 'All' tab\n" +
			'- Pure or Daeyalt essence in bank\n' +
			'- Banking runes in inventory (not rune pouch)\n\n' +
			'Startup Setup\n' +
			'- Dust staff recommended\n' +
			'- Keep pouches, banking rune, and rune pouch in fixed bank slots\n' +
			'- Starter pouch runes: 10 Astral, 10 Cosmic, 10 Law\n\n' +
			'Behaviour Tab\n' +
			'- Run Restore: recovery route after each altar trip\n' +
			'  Options: No Restore, Stamina Potions, PoH, Vile Vigour, Desert Amulet\n' +
			'- Pouches: Colossal or Standard set\n' +
			'- Emergency Food: auto-withdraw/eat food when needed\n\n' +
			'Settings Tab\n' +
			'- Runes For Banking: rune used for bank travel logic\n' +
			'- Emergency Food: food type used by emergency logic\n' +
			'- PoH Access: Tablet, Construction Cape, or Spellbook\n' +
			'- Rune Pouch: enables pouch checks\n' +
			'- Divine Pouch: enables slot 4 support\n' +
			'- Slot 1-4 Rune: expected rune in each pouch slot\n\n' +
			'How It Runs\n' +
			'- Set options, click Start Script\n' +
			'- Script auto-detects start location and resumes route\n' +
			'- Break handling runs automatically\n',
	);
	infoText.setLineWrap(true);
	infoText.setWrapStyleWord(true);
	infoText.setEditable(false);
	infoText.setOpaque(false);
	infoText.setFont(new java.awt.Font('SansSerif', java.awt.Font.PLAIN, 11));

	const scrollPane = new javax.swing.JScrollPane(infoText);
	scrollPane.setBorder(null);
	panel.add(scrollPane, java.awt.BorderLayout.CENTER);

	return panel;
};
